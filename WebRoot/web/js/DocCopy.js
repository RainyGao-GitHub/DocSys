	//DocCopy类
    var DocCopy = (function () {
        /*全局变量*/
        var isCopping = false;	//任务进行中标记
        var stopFlag = false;	//任务全部停止标记
        
        var threadCount = 0; //线程计数器
 		var maxThreadCount = 10; //最大线程数
 		
        var index = 0; //当前任务索引
        var totalNum = 0; //总任务数
        var successNum = 0;	//成功任务数
		var failNum = 0; //移动失败任务数		
        var SubContextList = []; //任务上下文列表，用于记录任务的执行情况，在开始移动的时候初始化
 		
        /*Content 用于保存文件复制的初始信息*/
        var Content = {};
        Content.BatchList = [];
        Content.batchNum = 0;	//totalBatchNum
        Content.batchIndex = 0;	//curBatchIndex
        Content.state = 0;	//0: all Batch not inited 1: Batch Init is on going 2: Batch Init completed
        Content.initedFileNum = 0;
        Content.totalFileNum = 0; 
         		
        //状态机变量，用于实现异步对话框的实现
        var copyConflictConfirmSet = 0; //0：文件已存在时弹出确认窗口，1：文件已存在直接更改目标文件名，2：文件已存在跳过
        var copyErrorConfirmSet = 0; //0:复制错误时弹出确认是否继续复制窗口，1：复制错误时继续复制后续文件， 2：复制错误时停止整个复制		
        var copyWarningConfirmSet =0; //0: 复制警告时弹出确认是否继续复制窗口，1：复制警告时继续复制后续文件 2：复制警告时停止整个复制
      	
		//提供给外部的多文件copy接口
		function copyDocs(treeNodes, dstParentNode, vid)	//多文件复制函数
		{
			console.log("copyDocs treeNodes:", treeNodes);
			console.log("copyDocs dstParentNode:", dstParentNode);

			if(!treeNodes || treeNodes.length <= 0)
			{
				showErrorMessage("请选择需要复制的文件!");
				return;
			}
			
			//get the parentInfo
		  	var dstPath = "";
		  	var dstPid = 0;
		  	var dstLevel = -1;
			if(dstParentNode && dstParentNode != null)
			{
				dstPath = dstParentNode.path + dstParentNode.name+"/";
				dstPid = dstParentNode.id;
				dstLevel = dstParentNode.level+1;
			}
			else
			{
				dstParentNode = null;
			}

			console.log("copyDocs dstParentNode:", dstParentNode);

			if(isCopping == true)
			{
				DocCopyAppend(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid);
				copyNextDoc();
			}
			else
			{
				DocCopyInit(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid);
	    		//start copy first doc
				console.log("copyDoc() index:" + index + " totalNum:" + totalNum);
	    		var SubContext = SubContextList[index];
				copyDoc(SubContext);
			}			
		}
		
      	//初始化DocCopy
      	function DocCopyInit(treeNodes,dstParentNode,dstPath,dstPid,dstLevel,vid)	//多文件复制函数
		{
			console.log("DocCopyInit()");
			if(!treeNodes)
			{
				console.log("DocCopyInit() treeNodes is null");
				showErrorMessage("请选择文件！");
				return;
			}
			
			var fileNum = treeNodes.length;
			console.log("DocCopyInit() fileNum:" + fileNum);			
			if(fileNum <= 0)
			{
				console.log("DocCopyInit() fileNum <= 0");
				showErrorMessage("请选择文件！");
				return;
			}
			
	        /*重置全局变量*/
			isCopping = false;	//任务进行中标记
	        stopFlag = false;	//任务全部停止标记
	        threadCount = 0; //线程计数器
	 		maxThreadCount = 10; //最大线程数
	 		index = 0; //当前任务索引
	        totalNum = 0; //总任务数
	        successNum = 0;	//成功任务数
			failNum = 0; //移动失败任务数		
	        SubContextList = []; //任务上下文列表，用于记录任务的执行情况，在开始移动的时候初始化

			//Build CopyBatch
			var Batch = {};
			Batch.treeNodes = treeNodes;
			Batch.dstParentNode = dstParentNode;
			Batch.dstPath = dstPath;
			Batch.dstPid = dstPid;
			Batch.dstLevel = dstLevel;
			Batch.vid = vid;
			Batch.num = fileNum;
			Batch.index = 0;
			Batch.state = 0;
			
			//add to Content
			Content.BatchList = [];
			Content.BatchList.push(Batch);			
			Content.batchNum = 1;
	        Content.totalFileNum = fileNum;
			totalNum = Content.totalFileNum;
			
			//Init Content state
			Content.initedFileNum = 0;
			Content.batchIndex = 0;
			Content.state = 1;
			console.log("DocCopyInit Content:", Content);
	        
			isCopping = true;
						
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(Content, SubContextList, 1000);
			console.log("文件总的个数为："+totalNum);
      	}
      	
      	//增加复制文件
      	function DocCopyAppend(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid)	//多文件复制函数
		{
			console.log("DocCopyAppend()");
			if(!treeNodes)
			{
				console.log("DocCopyAppend() treeNodes is null");
				return;
			}

			var fileNum = treeNodes.length;
			console.log("DocCopyAppend() fileNum:" + fileNum);

			//Build CopyBatch
			var Batch = {};
			Batch.treeNodes = treeNodes;
			Batch.dstParentNode = dstParentNode;
			Batch.dstPath = dstPath;
			Batch.dstPid = dstPid;
			Batch.level = dstLevel;
			Batch.vid = vid;
			Batch.num = fileNum;
			Batch.index = 0;
			Batch.state = 0;

			//Append to Content
			Content.BatchList.push(Batch);
			Content.batchNum++;
			Content.totalFileNum += fileNum;
			totalNum = Content.totalFileNum;
			
			console.log("DocCopyAppend() Content:", Content);
			
			if(Content.state == 2)	//Batch already initiated, need to restart it
			{
				Content.batchIndex++;
				Content.state = 1;
				buildSubContextList(Content, SubContextList, 1000);
			}
			
			console.log("文件总的个数为："+Content.totalFileNum);
		}
      	
      	//并将需要复制的文件加入到SubContextList中
		function buildSubContextList(Content, SubContextList, maxInitNum)
		{
			if(Content.state == 2)
			{
				return;
			}
			
      		console.log("buildSubContextList() maxInitNum:" + maxInitNum);
			
      		var curBatchIndex = Content.batchIndex;
      		var Batch = Content.BatchList[curBatchIndex];
      		console.log("buildSubContextList() Content curBatchIndex:" + curBatchIndex + " num:" + Content.batchNum );
    		
      		var treeNodes = Batch.treeNodes;
      		var dstParentNode = Batch.dstParentNode;
      		var dstPath = Batch.dstPath;
      		var dstLevel = Batch.dstLevel;
      		var dstPid = Batch.dstPid;
      		var vid = Batch.vid;
      		var index = Batch.index;
      		var fileNum =  Batch.num;
      		console.log("buildSubContextList() Batch index:" + index + " fileNum:" + fileNum );
      		
      		var count = 0;
			console.log("buildSubContextList fileNum:" + fileNum);
    		for( var i = index ; i < fileNum ; i++ )
    		{
 				count++;
 				if(count > maxInitNum)
 				{
 					//buildSubContext 每次最多1000个
 					return;
 				}
 				
 				Batch.index++;
 				Content.initedFileNum++;
 				
    			var treeNode = treeNodes[i];
    	   		if(treeNode && treeNode != null)
    	   		{
    	   		   	var SubContext ={};
    	   		   	//Doc Info
    	   		   	SubContext.treeNode = treeNode;
        			SubContext.vid = vid;
    	   		   	SubContext.docId = treeNode.id;  
    	   		   	SubContext.pid = treeNode.pid;
		    		SubContext.path = treeNode.path;
		    		SubContext.name = treeNode.name;
    	   		   	SubContext.level = treeNode.level;		
    	   		   	SubContext.type = treeNode.isParent == true? 2: 1;	
		    	   	SubContext.size = treeNode.size;
    	   		   	SubContext.lastestEditTime = treeNode.latestEditTime;
			    	
    	   		   	//dst ParentNode Info
    	   		   	SubContext.dstParentNode = dstParentNode;
    	   		   	SubContext.dstPath = dstPath;
    	   		   	SubContext.dstPid = dstPid;
    	   		   	SubContext.dstLevel = dstLevel;
    	   		   	SubContext.dstName = treeNode.name;

			    	//Status Info
		    		SubContext.index = i;
		    	   	SubContext.state = 0;	//未开始复制
		    	   	SubContext.status = "待复制";	//未开始复制
		    	   	
		    	   	//thread Status
		    	   	SubContext.threadState = 0; //0:线程未启动, 1:线程已启动, 2:线程已终止
		    	   	
		    	    SubContext.stopFlag = false;
		    	   	
		    	   	//Push the SubContext
		    	   	SubContextList.push(SubContext);
    	   		}
	    	}
    		
    		Batch.state = 2;
    		if((Content.batchIndex + 1) == Content.batchNum) //It is the last batchIndex
    		{
    			Content.state = 2;
    			console.log("buildSubContextList() all Batch Inited");
    		}
    		else
    		{
    			Content.batchIndex++;
    			Content.state = 1;
    			console.log("buildSubContextList() there is more Batch need to be Inited");
    		}
	   	}
		
    	function checkAndBuildSubContextList()
    	{
    		//copy files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
    		}	
    	}
		
      	function copyNextDoc()
      	{
			//检测当前运行中的线程
        	console.log("copyNextDoc threadCount:" + threadCount + " maxThreadCount:" + maxThreadCount);				
			if(threadCount >= maxThreadCount)
			{
	        	console.log("copyNextDoc 线程池已满，等待线程结束");				
				return;
			}
			
     
	        //console.log("copyNextDoc index:" + index + " totalNum:" + totalNum);
	        if(index < (totalNum-1)) //还有线程未启动
	        {
		        index++;
	        	console.log("copyNextDoc start copy");
        		console.log("copyNextDoc() index:" + index + " totalNum:" + totalNum);
        		var SubContext = SubContextList[index];
           		copyDoc(SubContext);
	        }
	        else	//线程已全部启动，检测是否全部都已结束
	        {
	        	copyEndHandler();
	        }
      	}
    	
		//copyDoc接口，该接口是个递归调用
		function copyDoc(SubContext)
		{
			console.log("[" + SubContext.index + "] copyDoc()  name:" + SubContext.name);
			
			checkAndBuildSubContextList();
			
    		//判断任务是否已停止
			if(stopFlag == true || SubContext.stopFlag == true)
    		{
    			console.log("[" + SubContext.index + "] copyDoc() task was stoped "+ SubContext.name);
    			return;
    		}
			
			IncreaseThreadCount(SubContext);

			if(SubContext.docId == SubContext.dstPid)
			{
				console.log("[" + SubContext.index + "] copyDoc() 禁止将上级目录复制到子目录");
				copyErrorHandler(SubContext, "禁止将上级目录复制到子目录");
				copyErrorConfirm(SubContext, "禁止将上级目录复制到子目录");
				copyNextDoc();
				return;
			}

			console.log("[" + SubContext.index + "] copyDoc() state:" + SubContext.state);
			switch(SubContext.state)
			{
			case 0:	//check node exist
				console.log("[" + SubContext.index + "] copyDoc() check if node exist");
				if(isNodeExist(SubContext.dstName, SubContext.dstParentNode) == true)
				{
				  	//Node Name conflict confirm
					CopyConflictConfirm(SubContext);
					copyNextDoc();
					return;
				}
				SubContext.state = 1;
				copyDoc(SubContext);
				break;
			case 1:	//start copy doc
				console.log("[" + SubContext.index + "] copyDoc() start copy");
				//启动超时定式器
				var timeOut = 3600000; //超时时间1小时（复制操作无法预估时间）
			    console.log("[" + SubContext.index + "] copyDoc()  start timeout monitor with " + timeOut + " ms");
			    SubContext.timerForCopy = setTimeout(function () {
					 console.log("[" + SubContext.index + "] copyDoc() timerForCopy triggered!");
					 if(SubContext.state != 4 || SubContext.state != 5) //没有成功或失败的文件超时都当失败处理
					 {
				         copyErrorHandler(SubContext, "文件复制超时");
				         copyNextDoc();
					 }
			    },timeOut);			    
				
				$.ajax({
		            url : "/DocSystem/Doc/copyDoc.do",
		            type : "post",
		            dataType : "json",
		            data : {
		                reposId: SubContext.vid,			//仓库id
		            	docId : SubContext.docId,	//待复制的docid
		                type: SubContext.type,
		                srcLevel: SubContext.level,
		                srcPid: SubContext.pid,
		                srcPath: SubContext.path,
		                srcName: SubContext.name,
		                dstLevel: SubContext.dstLevel,
		                dstPid: SubContext.dstPid,	//目标doc dstPid
		                dstPath: SubContext.dstPath,
		                dstName: SubContext.dstName, //目标docName
		                shareId: gShareId,
		            },
		            success : function (ret) {
		            	console.log("[" + SubContext.index + "] copyDoc() ret:",ret);
		            	if( "ok" == ret.status ){
		                	copySuccessHandler(SubContext, ret.msgInfo);
	
		                	//add tree node
		            		var doc = ret.data;                	    
	                  	    addTreeNode(doc);                  	    
	                 		addDocListNode(doc);
	                 		
	                 		//try to start another thread
		                	copyNextDoc();
		                	return;
		                }
		                else
		                {
		                	console.log("[" + SubContext.index + "] copyDoc() Error:" + ret.msgInfo);
		                	copyErrorHandler(SubContext, ret.msgInfo);
		                	copyErrorConfirm(SubContext,ret.msgInfo);
		                	return;
		                }
		            },
		            error : function () {
		            	console.log("[" + SubContext.index + "] copyDoc() 服务器异常：copy failed");
		             	copyErrorHandler(SubContext, "服务器异常");
	                	copyErrorConfirm(SubContext,"服务器异常");
	                	return;
		            }
		    	});
				
				SubContext.state = 2; //wait for copy result
				break;
			case 2:	//等待文件复制结果
				console.log("[" + SubContext.index + "] copyDoc() copy already started, 理论上不应该出现在这里");
				break;
			case 4: //文件已复制成功
				console.log("[" + SubContext.index + "] copyDoc() copy already success, 理论上不应该出现在这里");
				break;
			case 5:	//文件已复制失败				
				console.log("[" + SubContext.index + "] copyDoc() copy already stopped, 理论上不应该出现在这里");
				break;				
			}
			//try to start next copy thread
			copyNextDoc();
		}
		
      	function clearTimerForCopy(SubContext)
      	{
      		if(SubContext.timerForCopy)
      		{
      			console.log("[" + SubContext.index + "] clearTimerForCopy() clear timerForCopy");
      			clearTimeout(SubContext.timerForCopy);
      			SubContext.timerForCopy = undefined;
      		}
      	}
      	
    	function IncreaseThreadCount(SubContext)
        {    		
    		if(SubContext.threadState == 0)
        	{
    			SubContext.threadState = 1;
        		threadCount++;
        	}
        }
    	
    	function DecreaseThreadCount(SubContext)
        {
    		if(SubContext.threadState == 1)
    		{
    			SubContext.threadState = 2;
        		threadCount--;    			
    		}
        }
    	
      	function copyErrorHandler(SubContext,errMsg)
      	{
      		//Whatever do stop first
      		SubContext.stopFlag = true;
      		
      		console.log("[" + SubContext.index + "] copyErrorHandler() clear timerForCopy");
      		clearTimerForCopy(SubContext);
      		
      		console.log("[" + SubContext.index + "] copyErrorHandler() "+ SubContext.name + " " + errMsg);
      		
      		failNum++;
      		DecreaseThreadCount(SubContext);

      		//设置状态
			SubContext.state = 5;	//失败
      		SubContext.status = "fail";
			SubContext.msgInfo = errMsg;
      	}
      	
      	//copySuccessHandler
      	function copySuccessHandler(SubContext,msgInfo)
      	{	
      		//Whatever do stop it first
      		SubContext.stopFlag = true;
      		
      		console.log("[" + SubContext.index + "] copySuccessHandler() clear timerForCopy");
      		clearTimerForCopy(SubContext);
      		
      		console.log("[" + SubContext.index + "] copySuccessHandler() "+ SubContext.name + " " + msgInfo);
      		      		
      		successNum++;
      		DecreaseThreadCount(SubContext);      		
      		
	      	SubContext.state = 4;	//复制成功
      		SubContext.status = "success";
      		SubContext.msgInfo = msgInfo;
      	}
      	
      	
      	var penddingListForCopyConflictConfirm = [];
      	var copyConflictConfirmState = 0;
		function CopyConflictConfirm(SubContext)
		{
			console.log("[" + SubContext.index + "] CopyConflictConfirm()");
			if(copyConflictConfirmState == 1)
			{
				//add it to penddingList
				console.log("[" + SubContext.index + "] CopyConflictConfirm() add to penndingList");
				penddingListForCopyConflictConfirm.push(SubContext);
				return;
			}
			
			copyConflictConfirmState = 1;
			showCopyConflictConfirmPanel(SubContext);
		}
		
		function showCopyConflictConfirmPanel(SubContext)
		{
			console.log("[" + SubContext.index + "] showCopyConflictConfirmPanel()");
			var copiedNodeName = SubContext.dstName;
			
			var dialogId = 'copyConflictConfirm' + SubContext.index;
			bootstrapQ.dialog({
					id: dialogId,
					url: 'copyConflictConfirm.html',
					title: copiedNodeName + '已存在',
					msg: '页面正在加载，请稍等...',
			        okbtn: "确定",
	    	        qubtn: "取消",
		            callback: function () {
		            	//copyConflictConfirmPageInit(copiedNodeName);
		            	$("#" + dialogId + " input[name='newDocName']").val("Copy of " + copiedNodeName);
		            }
		        },function(){
		        	copyConflictConfirmState = 0;
		        	console.log("[" + SubContext.index + "] showCopyConflictConfirmPanel() 修改名字:", SubContext);	
		        	//用户修改了目标名字，重入复制操作
		        	var newDstName =  $("#" + dialogId + " input[name='newDocName']").val();
			    	console.log("[" + SubContext.index + "] showCopyConflictConfirmPanel newDstName:",newDstName);
			    	SubContext.dstName = newDstName;
			    	//关闭对话框(该接口会删除该对话框,避免无法再次打开对话框)
            		closeBootstrapDialog("copyConflictConfirm"  + SubContext.index);
            		copyDoc(SubContext);			    	
            		resumePenddingCopyConflictConfirm();
            		return true;
		        }, function(){ //取消
		        	copyConflictConfirmState = 0;
		        	console.log("[" + SubContext.index + "] showCopyConflictConfirmPanel() 取消复制:", SubContext);					
		        	copyErrorHandler(SubContext, "文件已存在，用户放弃修改名字并取消了复制！");
		        	//关闭对话框(该接口会删除该对话框,避免无法再次打开对话框)
            		closeBootstrapDialog("copyConflictConfirm"  + SubContext.index);
		        	resumePenddingCopyConflictConfirm();
		        	copyNextDoc();
	    	    	return true;
	      		});	
		}
		
    	function resumePenddingCopyConflictConfirm()
    	{
    		console.log("resumePenddingCopyConflictConfirm()");
			if(penddingListForCopyConflictConfirm.length > 0)
    		{
    			var SubContext = penddingListForCopyConflictConfirm.pop();
        		console.log("resumePenddingCopyConflictConfirm() index:" + SubContext.index + " name:" + SubContext.name);
    			copyDoc(SubContext);
    		}
    	}

    	var penddingListForCopyErrorConfirm = [];
      	var copyErrorConfirmState = 0;
      	function copyErrorConfirm(SubContext,errMsg)
      	{
      		if(copyErrorConfirmState == 1)
      		{
      			console.log("[" + SubContext.index + "] copyErrorConfirm() add to penndingList");
      			penddingListForCopyErrorConfirm.push(SubContext);
      			return;
      		}
      		copyErrorConfirmState = 1;
	      	
  			var FileName = SubContext.name;
      		var msg = FileName + "复制失败,是否继续复制其他文件？";
      		if(errMsg != undefined)
      		{
      			msg = FileName + "复制失败(" + errMsg + "),是否继续复制其他文件？";
      		}
      		//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: "copyErrorConfirm" +  SubContext.index,
    	        msg: msg,
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束",
    	    },function () {
    	    	//继续后续的复制
    	    	copyErrorConfirmState = 0;
    	    	//关闭对话框(该接口会删除该对话框,避免无法再次打开对话框)
        		closeBootstrapDialog("copyErrorConfirm"  + SubContext.index);
    	    	resumePenddingCopyErrorConfirm();
    	    	copyNextDoc();
    	    	return true;
			},function(){
				//结束后续的复制
				copyErrorConfirmState = 0;
				penddingListForCopyErrorConfirm = [];
    	    	//关闭对话框(该接口会删除该对话框,避免无法再次打开对话框)
        		closeBootstrapDialog("copyErrorConfirm"  + SubContext.index);
				stopFlag = true;
				copyEndHandler();
    	    	return true;
      		});
      	}
      	
    	function resumePenddingCopyErrorConfirm()
    	{
			console.log("resumePenddingCopyErrorConfirm()");
    		if(penddingListForCopyErrorConfirm.length > 0)
    		{
    			var SubContext = penddingListForCopyErrorConfirm.pop();
    			console.log("resumePenddingCopyErrorConfirm() index:" + SubContext.index + " name:" + SubContext.name);
    			//For copy error which already stopped, so just show the confirm dialog
    			copyErrorConfirm(SubContext, SubContext.msgInfo);
    		}
    	}
      	
      	
      	//copyEndHandler
      	function copyEndHandler()
      	{
      		console.log("copyEndHandler() totalNum:" + totalNum +" successNum:"+successNum+" failNum:"+failNum);
      		if(stopFlag == false)
      		{
	      		if(totalNum > (successNum + failNum))
	      		{
	      			console.log("copyEndHandler() 复制未结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
	      			return;
	      		}
      		}
      		
      		console.log("copyEndHandler() 复制结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
      		//显示移动完成 
      		showCopyEndInfo();

      		//清除标记
      		isCopping = false;
      	}
      	
  		function showCopyEndInfo()
  		{
  			var copyEndInfo = "复制完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			deleteEndInfo = "复制完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
      		    bootstrapQ.msg({
					msg : copyEndInfo,
					type : 'warning',
					time : 2000,
				    }); 
      		}
      		else
      		{
	            bootstrapQ.msg({
						msg : copyEndInfo,
						type : 'success',
						time : 2000,
					    }); 
      		}      		
        }
		
		//开放给外部的调用接口
        return {
			copyDocs: function(treeNodes,dstParentNode,vid){
            	copyDocs(treeNodes,dstParentNode,vid);
            },
        };
    })();
    