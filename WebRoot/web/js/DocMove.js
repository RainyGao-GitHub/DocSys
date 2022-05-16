	//DocMove类	
    var DocMove = (function () {
        /*全局变量*/
        var isMoving = false;	//任务进行中标记
        var stopFlag = false;	//任务全部停止标记
        
        var threadCount = 0; //线程计数器
 		var maxThreadCount = 10; //最大线程数
 		
        var index = 0; //当前任务索引
        var totalNum = 0; //总任务数
        var successNum = 0;	//成功任务数
		var failNum = 0; //移动失败任务数		
        var SubContextList = []; //任务上下文列表，用于记录任务的执行情况，在开始移动的时候初始化

        /*Content 用于保存文件移动的初始信息*/
        var Content = {};
        Content.BatchList = [];
        Content.batchNum = 0;	//totalBatchNum
        Content.batchIndex = 0;	//curBatchIndex
        Content.state = 0;	//0: all Batch not inited 1: Batch Init is on going 2: Batch Init completed
        Content.initedFileNum = 0;
        Content.totalFileNum = 0;         
 		
		//提供给外部的多文件move接口
		function moveDocs(treeNodes, dstParentNode, vid)	//多文件移动函数
		{
			console.log("moveDocs reposId:" + vid + " treeNodes:", treeNodes);
			if(!treeNodes || treeNodes.length <= 0)
			{
				showErrorMessage("请选择需要移动的文件!");
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

			console.log("moveDocs dstParentNode:", dstParentNode);

			if(isMoving == true)
			{
				DocMoveAppend(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid);
				moveNextDoc();
			}
			else
			{
				DocMoveInit(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid);
				//move first doc
	    		console.log("moveDoc() index:" + index + " totalNum:" + totalNum);
	    		var SubContext = SubContextList[index];
				moveDoc(SubContext);
			}			
		}
		
      	//初始化DocMove
      	function DocMoveInit(treeNodes,dstParentNode,dstPath,dstPid,dstLevel,vid)	//多文件移动函数
		{
			console.log("DocMoveInit()");
			if(!treeNodes)
			{
				console.log("DocMoveInit() treeNodes is null");
				showErrorMessage("请选择文件！");
				return;
			}
			
			var fileNum = treeNodes.length;
			console.log("DocMoveInit() fileNum:" + fileNum);				
			if(fileNum <= 0)
			{
				console.log("DocMoveInit() fileNum <= 0");
				showErrorMessage("请选择文件！");
				return;
			}
			
	        /*重置全局变量*/
			isMoving = false;	//任务进行中标记
	        stopFlag = false;	//任务全部停止标记
	        threadCount = 0; //线程计数器
	 		maxThreadCount = 10; //最大线程数
	 		index = 0; //当前任务索引
	        totalNum = 0; //总任务数
	        successNum = 0;	//成功任务数
			failNum = 0; //移动失败任务数		
	        SubContextList = []; //任务上下文列表，用于记录任务的执行情况，在开始移动的时候初始化
			
			//Build Batch
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
			console.log("DocMoveInit Content:", Content);
	        			
			isMoving = true;
			
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(Content, SubContextList, 1000);
			console.log("文件总的个数为："+totalNum);
      	}
      	
      	//增加移动文件
      	function DocMoveAppend(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid)	//多文件移动函数
		{
			console.log("DocMoveAppend()");
			if(!treeNodes)
			{
				console.log("DocMoveAppend() treeNodes is null");
				return;
			}

			var fileNum = treeNodes.length;
			console.log("DocMoveAppend() fileNum:" + fileNum);

			//Build Batch
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

			//Append to Content
			Content.batchList.push(Batch);
			Content.batchNum++;
			Content.totalFileNum += fileNum;
			totalNum = Content.totalFileNum;
			
			console.log("DocMoveAppend() Content:", Content);
			
			if(Content.state == 2)	//Batch already initiated, need to restart it
			{
				Content.batchIndex++;
				Content.state = 1;
				buildSubContextList(Content, SubContextList, 1000);
			}
			
			console.log("文件总的个数为："+Content.totalFileNum);
		}
      	
      	//并将需要移动的文件加入到SubContextList中
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
		    	   	SubContext.state = 0;	//未开始移动
		    	   	SubContext.status = "待移动";	//未开始移动
		    	   	
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
    		//move files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
    		}
    	}
		
      	function moveNextDoc()
      	{
			//检测当前运行中的线程
        	console.log("moveNextDoc threadCount:" + threadCount + " maxThreadCount:" + maxThreadCount);				
			if(threadCount >= maxThreadCount)
			{
	        	console.log("moveNextDoc 线程池已满，等待线程结束");				
				return;
			}
			
     
	        //console.log("moveNextDoc index:" + index + " totalNum:" + totalNum);
	        if(index < (totalNum-1)) //还有线程未启动
	        {
		        index++;
	        	console.log("moveNextDoc start move");
        		console.log("moveNextDoc() index:" + index + " totalNum:" + totalNum);
        		var SubContext = SubContextList[index];
           		moveDoc(SubContext);
	        }
	        else	//线程已全部启动，检测是否全部都已结束
	        {
	        	moveEndHandler();
	        }
      	}
    	
    	function moveDoc(SubContext)
    	{    		
    		//console.log("moveDoc()  SubContext:",SubContext);
    		
    		checkAndBuildSubContextList();
    		
    		//判断任务是否已停止
			if(stopFlag == true || SubContext.stopFlag == true)
    		{
    			console.log("[" + SubContext.index + "] moveDoc() task was stoped "+ SubContext.name);
    			return;
    		}
    		
    		IncreaseThreadCount(SubContext);
    		
  	    	if(SubContext.pid == SubContext.dstPid)
  			{
				console.log("[" + SubContext.index + "] moveDoc() 无法在同一个目录下移动");
				moveErrorHandler(SubContext, "无法在同一个目录下移动");
				moveErrorConfirm(SubContext, "无法在同一个目录下移动");
  	    		moveNextDoc();
  	    		return; 
  			}
  	    	
			//启动超时定式器
			var timeOut = 3600000; //超时时间1小时（复制操作无法预估时间）
		    console.log("[" + SubContext.index + "] moveDoc()  start timeout monitor with " + timeOut + " ms");
		    SubContext.timerForMove = setTimeout(function () {
				 console.log("[" + SubContext.index + "] moveDoc() timerForMove triggered!");
				 if(SubContext.state != 4 || SubContext.state != 5) //没有成功或失败的文件超时都当失败处理
				 {
			         moveErrorHandler(SubContext, "文件复制超时");
			         moveNextDoc();
				 }
		    },timeOut);			
  	    	
			//执行后台moveDoc操作
    		$.ajax({
                url : "/DocSystem/Doc/moveDoc.do",
                type : "post",
                dataType : "json",
                data : {
                    reposId: SubContext.vid,
                	docId : SubContext.docId,
                	type: SubContext.type,
                	srcLevel: SubContext.level,
                	dstLevel: SubContext.dstLevel,
                    srcPid: SubContext.pid,
                    dstPid: SubContext.dstPid,
                    srcPath: SubContext.path,
                    srcName: SubContext.name,
                    dstPath: SubContext.dstPath,
                    dstName: SubContext.name,
		            shareId: gShareId,
                },
                success : function (ret) {
                   console.log("[" + SubContext.index + "] moveDoc() ret:",ret);
                   if( "ok" == ret.status )
                   {
                	    moveSuccessHandler(SubContext, ret.msgInfo);
               	   	
               	        //Add or Delete from treeNode
                 	    var doc = ret.data;
                	    addTreeNode(doc);
                  	    deleteTreeNodeById(SubContext.docId);
                	    DocList.addNode(doc);
                	    DocList.deleteNode(SubContext.docId);
                	    
                	    moveNextDoc();
                	    return;
                   }
                   else	//后台报错，结束移动
                   {
                	   console.log("[" + SubContext.index + "] moveDoc() Error:" + ret.msgInfo);
                	   moveErrorHandler(SubContext, ret.msgInfo);
                	   moveErrorConfirm(SubContext,ret.msgInfo);
                       return;
                   }
                },
                error : function () {	//后台异常
            	   console.log("[" + SubContext.index + "] moveDoc() 服务器异常：move failed");
            	   moveErrorHandler(SubContext, "服务器异常");
            	   moveErrorConfirm(SubContext,"服务器异常");            	   
            	   return;
                }
        	});
    	}
    	
      	function clearTimerForMove(SubContext)
      	{
      		if(SubContext.timerForMove)
      		{
      			console.log("[" + SubContext.index + "] clearTimerForMove() clear timerForMove");
      			clearTimeout(SubContext.timerForMove);
      			SubContext.timerForMove = undefined;
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
    	
      	function moveErrorHandler(SubContext,errMsg)
      	{
      		//Whatever do stop first
      		SubContext.stopFlag = true;
      		
      		console.log("[" + SubContext.index + "] moveErrorHandler() clear timerForMove");
      		clearTimerForMove(SubContext);
      		
      		console.log("[" + SubContext.index + "] moveErrorHandler() "+ SubContext.name + " " + errMsg);
      		
      		failNum++;
      		DecreaseThreadCount(SubContext);

      		//设置状态
			SubContext.state = 5;	//失败
      		SubContext.status = "fail";
			SubContext.msgInfo = errMsg;
      	}
      	
      	//moveSuccessHandler
      	function moveSuccessHandler(SubContext,msgInfo)
      	{	
      		//Whatever do stop it first
      		SubContext.stopFlag = true;
      		
      		console.log("[" + SubContext.index + "] moveSuccessHandler() clear timerForMove");
      		clearTimerForMove(SubContext);
      		
      		console.log("[" + SubContext.index + "] moveSuccessHandler() "+ SubContext.name + " " + msgInfo);
      		      		
      		successNum++;
      		DecreaseThreadCount(SubContext);      		
      		
	      	SubContext.state = 4;	//复制成功
      		SubContext.status = "success";
      		SubContext.msgInfo = msgInfo;
      	}  	
		
      	function moveErrorConfirm(SubContext,errMsg)
      	{
      		var FileName = SubContext.name;
      		var msg = FileName + "移动失败,是否继续移动其他文件？";
      		if(errMsg != undefined)
      		{
      			msg = FileName + "移动失败(" + errMsg + "),是否继续移动其他文件？";
      		}
      		//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: "moveErrorConfirm"  +  SubContext.index,
    	        msg: msg,
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束",
    	    },function () {
    	    	moveNextDoc();
    	    	return true;
			},function(){
    	    	//alert("点击了取消");
				stopFlag = true;
				moveEndHandler();
    	    	return true;
      		});
      	}
      	
      	
      	
      	//moveEndHandler
      	function moveEndHandler()
      	{
      		console.log("moveEndHandler() totalNum:" + totalNum +" successNum:"+successNum+" failNum:"+failNum);
      		if(stopFlag == false)
      		{
	      		if(totalNum > (successNum + failNum))
	      		{
	      			console.log("moveEndHandler() 复制未结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
	      			return;
	      		}
      		}
      		
      		console.log("moveEndHandler() 复制结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
      		showMoveEndInfo();

      		isMoving = false;
      	}
      	
  		function showMoveEndInfo()
  		{
  			var moveEndInfo = "移动完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			moveEndInfo = "移动完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
      		    bootstrapQ.msg({
					msg : moveEndInfo,
					type : 'warning',
					time : 2000,
				    }); 
      		}
      		else
      		{
	            bootstrapQ.msg({
						msg : moveEndInfo,
						type : 'success',
						time : 2000,
					    }); 
      		}
  		}
		
		//开放给外部的调用接口
        return {
            moveDocs: function(treeNodes,dstParentNode,vid){
            	moveDocs(treeNodes,dstParentNode,vid);
            },
        };
    })();