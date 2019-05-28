	//DocCopy类
    var DocCopy = (function () {
        /*全局变量*/
        var reposId;
        var isCopping = false;	//文件复制中标记
        var stopFlag = false;	//结束复制
        var copiedNum = 0; //已复制个数
        var successNum = 0;	//成功复制个数
		var failNum = 0; //复制失败个数
		
        /*Content 用于保存文件复制的初始信息*/
        var Content = {};
        Content.BatchList = [];
        Content.batchNum = 0;	//totalBatchNum
        Content.batchIndex = 0;	//curBatchIndex
        Content.state = 0;	//0: all Batch not inited 1: Batch Init is on going 2: Batch Init completed
        Content.initedFileNum = 0;
        Content.totalFileNum = 0; 
        
        /*copyDoc conditions 用于指示当前的复制文件及复制状态*/
        var index = 0; //当前操作的索引
        var totalNum = 0; 
 		var SubContextList = []; //文件复制上下文List，用于记录单个文件的复制情况，在开始复制的时候初始化
 		
        //状态机变量，用于实现异步对话框的实现
        var copyConflictConfirmSet = 0; //0：文件已存在时弹出确认窗口，1：文件已存在直接更改目标文件名，2：文件已存在跳过
        var copyErrorConfirmSet = 0; //0:复制错误时弹出确认是否继续复制窗口，1：复制错误时继续复制后续文件， 2：复制错误时停止整个复制		
        var copyWarningConfirmSet =0; //0: 复制警告时弹出确认是否继续复制窗口，1：复制警告时继续复制后续文件 2：复制警告时停止整个复制
      	
		//提供给外部的多文件copy接口
		function copyDocs(treeNodes, dstParentNode, vid)	//多文件复制函数
		{
			console.log("copyDocs treeNodes:", treeNodes);
			if(treeNodes.length <= 0)
			{
				showErrorMessage("请选择需要复制的文件!");
				return;
			}
			
			//get the parentInfo
		  	var dstPath = "";
		  	var dstPid = 0;
		  	var dstLevel = 0;
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
			}
			else
			{
				DocCopyInit(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid);
				copyDoc();
			}			
		}
		
      	//初始化DocCopy
      	function DocCopyInit(treeNodes,dstParentNode,dstPath,dstPid,level,vid)	//多文件复制函数
		{
			console.log("DocCopyInit()");
			var fileNum = treeNodes.length;
			console.log("DocCopyInit() fileNum:" + fileNum);				

			//Build CopyBatch
			var Batch = {};
			Batch.treeNodes = treeNodes;
			Batch.dstParentNode = dstParentNode;
			Batch.dstPath = dstParentNode.path;
			Batch.dstPid = dstPid;
			Batch.level = level;
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
			
			//清空上下文列表
			SubContextList = [];
			
			//Set the Index
			index = 0;
			
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(Content, SubContextList, 1000);
			console.log("文件总的个数为："+totalNum);
      	}
      	
      	//增加复制文件
      	function DocCopyAppend(treeNodes, dstParentNode, dstPath, dstPid, level, vid)	//多文件复制函数
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
			Batch.dstPath = dstParentNode.path;
			Batch.dstPid = dstPid;
			Batch.level = level;
			Batch.vid = vid;
			Batch.num = fileNum;
			Batch.index = 0;
			Batch.state = 0;

			//Append to Content
			Content.batchList.push(Batch);
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

			    	//Status Info
		    		SubContext.index = i;
		    	   	SubContext.state = 0;	//未开始复制
		    	   	SubContext.status = "待复制";	//未开始复制
		    	   			      								    	   	
		    	   	//Push the SubContext
		    	   	SubContextList.push(SubContext);
    	   		}
	    	}
    		
    		Batch.state = 2;
    		Content.batchIndex++;
    		if(Content.batchIndex == Content.batchNum)
    		{
    			Content.state = 2;
    			console.log("buildSubContextList() all Batch Inited");
    		}
	   	}
		
		//copyDoc接口，该接口是个递归调用
		function copyDoc()
		{
    		//copy files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
    		}
    		
			//判断是否取消复制
    		if(stopFlag == true)
    		{
    			console.log("copyDoc(): 结束复制");
    			copyEndHandler();
    			return;
    		}
    		
			
    		console.log("copyDoc() index:" + index + " totalNum:" + totalNum);
    		var SubContext = SubContextList[index];

			if(SubContext.docId == dstPid)
			{
				console.log("treeNode is same to dstParentNode","treeNode",SubContext.docId,"dstPid",dstPid);
				copyErrorConfirm(SubContext.name);
				return;
			}			
			
			if(isNodeExist(SubContext.name, SubContex.dstParentNode) == true)
			{
			  	//Node Name conflict confirm
				CopyConflictConfirm(SubContext.name);
			  	return;
			}
			
			$.ajax({
	            url : "/DocSystem/Doc/copyDoc.do",
	            type : "post",
	            dataType : "json",
	            data : {
	                docId : SubContext.docId,	//待复制的docid
	                srcPid: SubContext.pid,
	                srcPath: SubContext.path,
	                srcName: SubContext.name,
	                dstPid: SubContext.dstParentId,	//目标doc dstPid
	                dstPath: SubContext.dstParentPath,
	                dstName: SubContext.dstName, //目标docName
	                vid: SubContext.vid,			//仓库id
	            },
	            success : function (ret) {
	                if( "ok" == ret.status ){
	                	console.log("copyDoc() ok:",ret.data);
	                 	
	                	//后台复制成功，根据后台返回的docid,新建一个treeNode
	                	addTreeNode(ret.data,dstParentNode);	          			
	          			
	          			//复制下一个Doc
	                    copyNextDoc();
	                }
	                else
	                {
	                	console.log("Error:" + ret.msgInfo);
	                	copyErrorConfirm(SubContext.name,ret.msgInfo);
	                	return;
	                }
	            },
	            error : function () {
	            	console.log("服务器异常：copy failed");
                	copyErrorConfirm(SubContext.name,"服务器异常");
                	return;
	            }
	    	});
		}
		
		//启动复制下一个Doc,如果没有了的话则结束复制
		function copyNextDoc()
		{
           	//确定是否还有需要复制的文件
           	index++;
           	if(index < totalNum)	//callback没传入，表示单个复制
           	{
   				//Start to copy next Doc
	      		copyDoc();	//do copy Next Doc	                   	
	      	}
           	else	//更新显示数据
           	{	
           		copyEndHandler();
        	    bootstrapQ.msg({
						msg : '复制完成！',
						type : 'success',
						time : 2000,
    	        });
            }
		}
		
      	//copyEndHandler
      	function copyEndHandler()
      	{
      		console.log("copyEndHandler() 复制结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
  			//清除标记
            isCopping = false;
            
      		//显示复制完成 
      		showCopyEndInfo();      		
      	}
		
  		function showCopyEndInfo()
  		{
  			var copyEndInfo = "复制完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			copyEndInfo = "复制完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
      		}

            // 普通消息提示条
			bootstrapQ.msg({
					msg : copyEndInfo,
					type : 'success',
					time : 2000,
				    }); 
        }
      	
		function CopyConflictConfirm(copiedNodeName)
		{
		    qiao.bs.dialog({
		        id: "dialog-copyConflictDialog",
		        url: '#copyConflictConfirmDialog',
		        title: copiedNodeName + '已存在',
    	        //close: false,		
		        okbtn: "确定",
    	        qubtn: "取消",
		        callback: function () {
		            setTimeout(function () {
		                $("#dialog-copyConflictDialog input[name='newDocName']").val("Copy of " + copiedNodeName);
		            },100);
		        }
		    },function () {
		    	//确定按键
		    	var dstName =  $("#dialog-copyConflictDialog input[name='newDocName']").val();
		    	console.log("copyConflictConfirm newName:",dstName);
		    	SubContext.dstName = dstName;
				copyDoc();
		    	return true;   
		    });
		}
		
      	function copyErrorConfirm(FileName,errMsg)
      	{
      		var msg = FileName + "复制失败,是否继续复制其他文件？";
      		if(errMsg != undefined)
      		{
      			msg = FileName + "复制失败(" + errMsg + "),是否继续复制其他文件？";
      		}
      		//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: "copyErrorConfirm",
    	        msg: msg,
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束",
    	    },function () {
    	    	//alert("点击了确定");
    	    	copyErrorHandler(FileName, errMsg);
    	    	return true;
			},function(){
    	    	//alert("点击了取消");
				copyErrorAbortHandler(FileName, errMsg);
    	        //syncUpMenu();	//刷新菜单
    	    	return true;
      		});
      	}
      	
      	//copyErrorHandler
      	function copyErrorHandler(FileName,errMsg)
      	{
      		console.log("copyErrorHandler() "+ FileName + " " + errMsg);
      		
      		failNum++;
      		
      		//设置复制状态
			SubContextList[index].state = 3;	//复制结束
      		SubContextList[index].status = "fail";
			SubContextList[index].msgInfo = errMsg;
			copyNextDoc();		 	
      	}
      	
      	//copyErrorAbortHandler
      	function copyErrorAbortHandler(FileName,errMsg)
      	{
      		console.log("copyErrorAbortHandler() "+ FileName + " " + errMsg);
      	
      		failNum++;
      		
    		//设置复制状态
			SubContextList[index].state = 3;	//复制结束
      		SubContextList[index].status = "fail";
      		SubContextList[index].msgInfo = errMsg;
      		copyEndHandler();
      	}
      	
      	//copySuccessHandler
      	function copySuccessHandler(name,msgInfo)
      	{	
      		console.log("copySuccessHandler() "+ name + " " + msgInfo);
      		
      		successNum++;
	      	
	      	SubContextList[index].state = 2;	//复制结束
      		SubContextList[index].status = "success";
      		SubContextList[index].msgInfo = msgInfo;
			copyNextDoc();
      	}
		
		//开放给外部的调用接口
        return {
			copyDocs: function(treeNodes,dstParentNode,vid){
            	copyDocs(treeNodes,dstParentNode,vid);
            },
        };
    })();
    