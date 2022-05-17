	//DocDelete类
    var DocDelete = (function () {
        /*全局变量*/
        var isDeleteing = false;	//任务进行中标记
        var stopFlag = false;	//任务全部停止标记
        
        var threadCount = 0; //线程计数器
 		var maxThreadCount = 10; //最大线程数
 		
        var index = 0; //当前任务索引
        var totalNum = 0; //总任务数
        var successNum = 0;	//成功任务数
		var failNum = 0; //移动失败任务数		
        var SubContextList = []; //任务上下文列表，用于记录任务的执行情况，在开始移动的时候初始化
		
        /*Content 用于保存文件删除的初始信息*/
        var Content = {};
        Content.DeleteBatchList = [];
        Content.batchNum = 0;	//totalBatchNum
        Content.batchIndex = 0;	//curBatchIndex
        Content.state = 0;	//0: all DeleteBatch not inited 1: DeleteBatch Init is on going 2: DeleteBatch Init completed
        Content.totalFileNum = 0; 
        
		//多文件Delete接口
        function deleteDocs(treeNodes, vid)
		{
			console.log("deleteDocs() treeNodes:", treeNodes);
				
			if(isDeleteing == true)
			{
				DocDeleteAppend(treeNodes, vid);				
				deleteNextDoc();	//start Delete
			}
			else
			{
				//初始化文件删除参数
				DocDeleteInit(treeNodes, vid);
	
        		console.log("deleteDoc() index:" + index + " totalNum:" + totalNum);
        		var SubContext = SubContextList[0];
           		deleteDoc(SubContext);
			}
		}
        
      	//初始化DocDelete
      	function DocDeleteInit(treeNodes,vid)	//多文件移动函数
		{
      		console.log("DocDeleteInit()");
			if(!treeNodes)
			{
				console.log("DocDeleteInit() treeNodes is null");
				showErrorMessage("请选择文件！");
				return;
			}
	        
			var fileNum = treeNodes.length;
			if(fileNum <= 0)
			{
				console.log("DocDeleteInit() fileNum <= 0");
				showErrorMessage("请选择文件！");
				return;
			}
			
	        /*重置全局变量*/
	        isDeleteing = false;	//任务进行中标记
	        stopFlag = false;	//任务全部停止标记
	        threadCount = 0; //线程计数器
	 		maxThreadCount = 10; //最大线程数
	 		index = 0; //当前任务索引
	        totalNum = 0; //总任务数
	        successNum = 0;	//成功任务数
			failNum = 0; //移动失败任务数		
	        SubContextList = []; //任务上下文列表，用于记录任务的执行情况，在开始移动的时候初始化
			
			//Build DeleteBatch
			var DeleteBatch = {};
			DeleteBatch.treeNodes = treeNodes;
			DeleteBatch.vid = vid;
			DeleteBatch.num = fileNum;
			DeleteBatch.index = 0;
			DeleteBatch.state = 0;
			
			//add to Content
			Content.DeleteBatchList = [];
			Content.DeleteBatchList.push(DeleteBatch);			
			Content.batchNum = 1;
	        Content.totalFileNum = fileNum;
			totalNum = Content.totalFileNum;
			
			//Init Content state
			Content.initedFileNum = 0;
			Content.batchIndex = 0;
			Content.state = 1;
			console.log("DocDeleteInit() Content:", Content);
	        
			isDeleteing = true;
						
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(Content, SubContextList, 1000);
      	}
        
      	//增加删除文件
      	function DocDeleteAppend(treeNodes, vid)	//多文件移动函数
		{
			console.log("DocDeleteAppend()", treeNodes);
			if(!treeNodes)
			{
				console.log("DocDeleteAppend() treeNodes is null");
				showErrorMessage("请选择文件！");
				return;
			}

			var fileNum = treeNodes.length;
			console.log("DocDeleteAppend() fileNum:" + fileNum);
			if(fileNum <= 0)
			{
				showErrorMessage("请选择文件！");
				return;
			}

			//Build DeleteBatch
			var DeleteBatch = {};
			DeleteBatch.treeNodes = treeNodes;
			DeleteBatch.vid = vid;
			DeleteBatch.num = fileNum;
			DeleteBatch.index = 0;
			DeleteBatch.state = 0;
			
			//Append to Content.DeleteBatchList
			Content.DeleteBatchList.push(DeleteBatch);
			Content.batchNum++;
			Content.totalFileNum += fileNum;
			totalNum = Content.totalFileNum;
			
			console.log("DocDeleteAppend Content:", Content);
			
			if(Content.state == 2)	//DeleteBatch already initiated, need to restart it
			{
				Content.batchIndex++;
				Content.state = 1;
				buildSubContextList(Content,SubContextList,1000);
			}
      	}
      	
      	//这是一个递归调用函数，递归遍历所有目录，并将文件加入到SubContextList中
		function buildSubContextList(Content,SubContextList,maxInitNum)
		{
			if(Content.state == 2)
			{
				return;
			}
			
      		console.log("buildSubContextList() maxInitNum:" + maxInitNum);
			
      		var curBatchIndex = Content.batchIndex;
      		var DeleteBatch = Content.DeleteBatchList[curBatchIndex];
      		console.log("buildSubContextList() Content curBatchIndex:" + curBatchIndex + " num:" + Content.batchNum );
    		
      		var treeNodes = DeleteBatch.treeNodes;
      		var vid = DeleteBatch.vid;
      		var index = DeleteBatch.index;
      		var fileNum =  DeleteBatch.num;
      		console.log("buildSubContextList() DeleteBatch index:" + index + " fileNum:" + fileNum );
      		
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
 				
 				DeleteBatch.index++;
 				Content.initedFileNum++;
 				
    			var treeNode = treeNodes[i];
    	   		if(treeNode && treeNode != null)
    	   		{
    	   		   	var SubContext ={};
    	   		   	//Basic Info
    	   		   	SubContext.treeNode = treeNode;
    	   		   	SubContext.docId = treeNode.id; 
    	   		   	SubContext.pid = treeNode.pid;
    	   		   	SubContext.path = treeNode.path;
    	   		 	SubContext.name = treeNode.name;
    	   		 	SubContext.level = treeNode.level;
        			SubContext.vid = vid;
			    	
			    	//Status Info
		    		SubContext.index = i;
		    	   	SubContext.state = 0;	//未开始删除
		    	   	SubContext.status = "待删除";	//未开始删除
		    	   	
		    	   	//thread Status
		    	   	SubContext.threadState = 0; //0:线程未启动, 1:线程已启动, 2:线程已终止
		    	   	
		    	    SubContext.stopFlag = false;
		    	    
		    	   	//Push the SubContext
		    	   	SubContextList.push(SubContext);
		    	}
	    	}
    		
    		DeleteBatch.state = 2;
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
    		//Delete files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
    		}    		
    	}
    	
      	function deleteNextDoc()
      	{
			//检测当前运行中的线程
        	console.log("deleteNextDoc threadCount:" + threadCount + " maxThreadCount:" + maxThreadCount);				
			if(threadCount >= maxThreadCount)
			{
	        	console.log("deleteNextDoc 线程池已满，等待线程结束");				
				return;
			}
			
     
	        //console.log("deleteNextDoc index:" + index + " totalNum:" + totalNum);
	        if(index < (totalNum-1)) //还有文件删除线程未启动
	        {
		        index++;
	        	console.log("deleteNextDoc start delete");
        		console.log("deleteNextDoc() index:" + index + " totalNum:" + totalNum);
        		var SubContext = SubContextList[index];
           		deleteDoc(SubContext);
	        }
	        else	//删除线程已全部启动，检测是否全部删除都已结束
	        {
	        	deleteEndHandler();
	        }
      	}
      			      		
		//deleteDoc接口，该接口是个递归调用
		function deleteDoc(SubContext)
		{
			//console.log("deleteDoc()  SubContext:",SubContext);
		    
			checkAndBuildSubContextList();
    		
    		//判断是否取消删除
    		if(stopFlag == true || SubContext.stopFlag == true)
    		{
    			console.log("[" + SubContext.index + "] deleteDoc() delete was stoped "+ SubContext.name);
    			return;
    		}
    					
			IncreaseThreadCount(SubContext);

			//启动超时定式器
			var timeOut = 3600000; //超时时间1小时（删除操作无法预估时间）
		    console.log("[" + SubContext.index + "] deleteDoc()  start timeout monitor with " + timeOut + " ms");
		    SubContext.timerForDelete = setTimeout(function () {
				 console.log("[" + SubContext.index + "] deleteDoc() timerForDelete triggered!");
				 if(SubContext.state != 4 || SubContext.state != 5) //没有成功或失败的文件超时都当失败处理
				 {
			         deleteErrorHandler(SubContext, "文件删除超时");
			         deleteNextDoc();
				 }
		    },timeOut);
		    
			var vid = SubContext.vid;
    		var docId = SubContext.docId;
    		var pid = SubContext.pid;
    		var path = SubContext.path;
    		var name = SubContext.name;				
    		
			$.ajax({
                url : "/DocSystem/Doc/deleteDoc.do",
                type : "post",
                dataType : "json",
                data : {
                	reposId: vid,
                    docId : docId,
                    pid: pid,
                    path: path,
                    name: name,
	                shareId: gShareId,
                },
	            success : function (ret) {
                	console.log("[" + SubContext.index + "] deleteDoc() ret:", ret);
	            	if( "ok" == ret.status ) //后台删除成功
	                {				     	
				     	//删除成功处理
				     	deleteSuccessHandler(SubContext, ret.msgInfo);

	            		//Delete zTree Node
	                    var treeNode = getNodeByNodeId(docId);
	                    if(treeNode != null)
	                    {
	                    	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	                    	treeObj.removeNode(treeNode);
	                    }
	                    
				     	//Delete docList Node
				     	DocList.deleteNode(docId);
				     	
				     	//start to Delete nextDoc
				     	deleteNextDoc();
				     	return;
	                }
	                else
	                {
	                	console.log("[" + SubContext.index + "] deleteDoc() Error:" + ret.msgInfo);
	                	deleteErrorHandler(SubContext, ret.msgInfo);
	                	DeleteErrorConfirm(name,ret.msgInfo);
	            		return;
	                }
	            },
	            error : function () {
	             	console.log("[" + SubContext.index + "] deleteDoc() 服务器异常：Delete failed");
	             	deleteErrorHandler(SubContext, "服务器异常");
                	DeleteErrorConfirm(SubContext, "服务器异常");
	            	return;
	            }
	    	});
			
			//try to start next delete thread
			deleteNextDoc();
		}
		
      	function clearTimerForDelete(SubContext)
      	{
      		if(SubContext.timerForDelete)
      		{
      			console.log("[" + SubContext.index + "] clearTimerForDelete() clear timerForDelete");
      			clearTimeout(SubContext.timerForDelete);
      			SubContext.timerForDelete = undefined;
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
      	
      	//deleteErrorHandler
      	function deleteErrorHandler(SubContext,errMsg)
      	{
      		//Whatever do stop first
      		SubContext.stopFlag = true;
      		
      		console.log("[" + SubContext.index + "] deleteErrorHandler() clear timerForDelete");
      		clearTimerForDelete(SubContext);
      		
      		console.log("[" + SubContext.index + "] deleteErrorHandler() "+ SubContext.name + " " + errMsg);
      		
      		failNum++;
      		DecreaseThreadCount(SubContext);

      		//设置状态
			SubContext.state = 5;	//失败
      		SubContext.status = "fail";
			SubContext.msgInfo = errMsg;
      	}
      	
      	//deleteSuccessHandler
      	function deleteSuccessHandler(SubContext,msgInfo)
      	{	
      		//Whatever do stop it first
      		SubContext.stopFlag = true;
      		
      		console.log("[" + SubContext.index + "] deleteSuccessHandler() clear timerForDelete");
      		clearTimerForDelete(SubContext);
      		
      		console.log("[" + SubContext.index + "] deleteSuccessHandler() "+ SubContext.name + " " + msgInfo);
      		      		
      		successNum++;
      		DecreaseThreadCount(SubContext);      		
      		
	      	SubContext.state = 4;	//删除成功
      		SubContext.status = "success";
      		SubContext.msgInfo = msgInfo;
      	}
		
      	var penddingListForDeleteErrorConfirm = [];
      	var deleteErrorConfirmState = 0;
      	function DeleteErrorConfirm(SubContext, errMsg)
      	{
      		if(deleteErrorConfirmState == 0)
      		{
      			deleteErrorConfirmState = 1;
      			
	      		FileName = SubContext.name;
	      		var msg = FileName + "删除失败,是否继续删除其他文件？";
	      		if(errMsg)
	      		{
	      			msg = FileName + "删除失败(" + errMsg + "),是否继续删除其他文件？";
	      		}
	      		
	      		//弹出用户确认窗口
	      		qiao.bs.confirm({
	    	    	id: "DeleteErrorConfirm",
	    	        msg: msg,
	    	        close: false,		
	    	        okbtn: "继续",
	    	        qubtn: "结束",
	    	    },function () {
	    	    	//继续后续的删除
	    	    	deleteErrorConfirmState = 0;
	    	    	resumePenddingDeleteErrorConfirm();
	    	    	deleteNextDoc();
	    	    	return true;
				},function(){
					//结束后续的删除
	    	    	deleteErrorConfirmState = 0;
					stopFlag = true;
					DeleteEndHandler();
	    	    	return true;
	      		});
      		}
      		else
      		{
				console.log("[" + SubContext.index + "] deleteErrorConfirm() add to penndingList");
				penddingListForDeleteErrorConfirm.push(SubContext);
      		}
      	}
      	
    	function resumePenddingDeleteErrorConfirm()
    	{
    		if(penddingListForDeleteErrorConfirm.length > 0)
    		{
    			var SubContext = penddingListForDeleteErrorConfirm.pop();
    			deleteErrorConfirm(SubContext);
    		}
    	}
      	
      	//DeleteEndHandler
      	function DeleteEndHandler()
      	{
      		console.log("DeleteEndHandler() totalNum:" + totalNum +" successNum:"+successNum+" failNum:"+failNum);
      		if(stopFlag == false)
      		{
	      		if(totalNum > (successNum + failNum))
	      		{
	      			console.log("DeleteEndHandler() 删除未结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
	      			return;
	      		}
      		}
      		
      		console.log("DeleteEndHandler() 删除结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
      		//显示移动完成 
      		showDeleteEndInfo();

      		//清除标记
      		isDeleteing = false;
      	}
      	
  		function showDeleteEndInfo()
  		{
  			var deleteEndInfo = "删除完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			deleteEndInfo = "删除完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
      		    bootstrapQ.msg({
					msg : deleteEndInfo,
					type : 'warning',
					time : 2000,
				    }); 
      		}
      		else
      		{
	            bootstrapQ.msg({
						msg : deleteEndInfo,
						type : 'success',
						time : 2000,
					    }); 
      		}
  		}
      	
      	function deleteEndHandler()
      	{
      		console.log("deleteEndHandler() totalNum:" + totalNum +" successNum:"+successNum+" failNum:"+failNum);
      		if(stopFlag == false)
      		{
	      		if(totalNum > (successNum + failNum))
	      		{
	      			console.log("deleteEndHandler() 删除未结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
	      			return;
	      		}
      		}
	      	
      		console.log("deleteEndHandler() 删除结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
      		//显示删除完成信息
      		showDeleteEndInfo();      		

            
  			//清除标记
       		isDeleteing = false;
      	}  
      	
  		function showDeleteEndInfo()
  		{
  			var deleteEndInfo = "删除完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			deleteEndInfo = "删除完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
      			// 普通消息提示条
    			bootstrapQ.msg({
    					msg : deleteEndInfo,
    					type : 'warning',
    					time : 2000,
    				    }); 
      		}
      		else
      		{
                // 普通消息提示条
    			bootstrapQ.msg({
    					msg : deleteEndInfo,
    					type : 'success',
    					time : 2000,
    				    }); 
      		}
  		}
		
		//开放给外部的调用接口
        return {
        	deleteDocs: function(treeNodes, vid){
        		deleteDocs(treeNodes,vid);
            },
        };
    })();
	