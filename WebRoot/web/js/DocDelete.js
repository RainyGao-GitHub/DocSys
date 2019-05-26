	//DocDelete类
    var DocDelete = (function () {
        /*全局变量*/
        var isDeleteing = false;	//文件删除中标记
        var stopDeleteFlag = false;	//结束删除
        var DeleteedNum = 0; //已删除个数
        var successNum = 0;	//成功删除个数
		var failNum = 0; //删除失败个数
        
        /*DeleteContent 用于保存文件删除的初始信息*/
        var DeleteContent = {};
        DeleteContent.DeleteBatchList = [];
        DeleteContent.batchNum = 0;	//totalBatchNum
        DeleteContent.batchIndex = 0;	//curBatchIndex
        DeleteContent.state = 0;	//0: all DeleteBatch not inited 1: DeleteBatch Init is on going 2: deleteBatch Init completed
        DeleteContent.totalFileNum = 0; 
        
        /*DeleteDoc conditions 用于指示当前的删除文件及删除状态*/
        var index = 0; //当前操作的索引
        var totalNum = 0; 
 		var SubContextList = []; //文件删除上下文List，用于记录单个文件的删除情况，在开始删除的时候初始化
        var vid = 0;
 		
		//多文件Delete接口
        function deleteDocs(treeNodes, vid)
		{
			console.log("deleteDocs() treeNodes:", treeNodes);
				
			if(isDeleteing == true)
			{
				DocDeleteAppend(treeNodes, vid);
			}
			else
			{
				//初始化文件删除参数
				DocDeleteInit(treeNodes, vid);
	
				//启动第一个Doc的Delete操作      		
				deleteDoc();	//start delete
			}
		}
        
      	//初始化DocDelete
      	function DocDeleteInit(treeNodes,vid)	//多文件移动函数
		{
			console.log("DocCopyInit()");
			var fileNum = treeNodes.length;
			console.log("DocCopyInit() fileNum:" + fileNum);				

			//Build CopyBatch
			var deleteBatch = {};
			deleteBatch.treeNodes = treeNodes;
			deleteBatch.vid = vid;
			deleteBatch.num = fileNum;
			deleteBatch.index = 0;
			deleteBatch.state = 0;
			
			//add to deleteContent
			deleteContent.deleteBatchList = [];
			deleteContent.deleteBatchList.push(deleteBatch);			
			deleteContent.batchNum = 1;
	        deleteContent.totalFileNum = fileNum;
			totalNum = deleteContent.totalFileNum;
			
			//Init deleteContent state
			deleteContent.initedFileNum = 0;
			deleteContent.batchIndex = 0;
			deleteContent.state = 1;
			console.log("DocCopyInit deleteContent:", deleteContent);
	        
			
			isDeleteing = true;
			
			//清空上下文列表
			SubContextList = [];
			
			//Set the Index
			index = 0;
			
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(deleteContent, SubContextList, 10000);
      	}
        
      	//增加删除文件
      	function DocDeleteAppend(treeNodes, vid)	//多文件移动函数
		{
			console.log("DocDeleteAppend()");
			if(!treeNodes)
			{
				console.log("DocDeleteAppend() treeNodes is null");
				return;
			}

			var fileNum = treeNodes.length;
			console.log("DocDeleteAppend() fileNum:" + fileNum);

			//Build deleteBatch
			var deleteBatch = {};
			deleteBatch.treeNodes = treeNodes;
			deleteBatch.vid = vid;
			deleteBatch.num = fileNum;
			deleteBatch.index = 0;
			deleteBatch.state = 0;
			
			//Append to deleteContent.deleteBatchList
			deleteContent.deleteBatchList.push(deleteBatch);
			deleteContent.batchNum++;
			deleteContent.totalFileNum += fileNum;
			totalNum = deleteContent.totalFileNum;
			
			console.log("DocDeleteAppend deleteContent:", deleteContent);
			
			if(deleteContent.state == 2)	//deleteBatch already initiated, need to restart it
			{
				deleteContent.batchIndex++;
				deleteContent.state = 1;
				buildSubContextList(deleteContent,SubContextList,10000);
			}
      	}
      	
      	//这是一个递归调用函数，递归遍历所有目录，并将文件加入到SubContextList中
		function buildSubContextList(deleteContent,SubContextList,maxInitNum)
		{
			if(deleteContent.state == 2)
			{
				return;
			}
			
      		console.log("buildSubContextList() maxInitNum:" + maxInitNum);
			
      		var curBatchIndex = deleteContent.batchIndex;
      		var deleteBatch = deleteContent.deleteBatchList[curBatchIndex];
      		console.log("buildSubContextList() deleteContent curBatchIndex:" + curBatchIndex + " num:" + deleteContent.batchNum );
    		
      		var treeNodes = deleteBatch.treeNodes;
      		var vid = deleteBatch.vid;
      		var index = deleteBatch.index;
      		var fileNum =  deleteBatch.num;
      		console.log("buildSubContextList() deleteBatch index:" + index + " fileNum:" + fileNum );
      		
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
 				
 				deleteBatch.index++;
 				deleteContent.initedFileNum++;
 				
    			var treeNode = treeNodes[i];
    	   		if(treeNode && treeNode != null)
    	   		{
    	   		   	var SubContext ={};
    	   		   	//Basic Info
    	   		   	SubContext.treeNode = treeNode;
    	   		   	SubContext.docId = treeNode.id; 
    	   		   	SubContext.parentId = treeNode.pid;
    	   		   	SubContext.parentPath = treeNode.path;
    	   		 	SubContext.name = treeNode.name;
			    	SubContext.level = treeNode.level;
        			SubContext.vid = vid;
			    	
			    	//Status Info
		    		SubContext.index = i;
		    	   	SubContext.state = 0;	//未开始删除
		    	   	SubContext.status = "待删除";	//未开始删除
		    	   			      								    	   	
		    	   	//Push the SubContext
		    	   	SubContextList.push(SubContext);
		    	}
	    	}
    		
    		deleteBatch.state = 2;
    		deleteContent.batchIndex++;
    		if(deleteContent.batchIndex == deleteContent.batchNum)
    		{
    			deleteContent.state = 2;
    			console.log("buildSubContextList() all deleteBatch Inited");
    		}
	   	}
        		      		
		//deleteDoc接口，该接口是个递归调用
		function deleteDoc()
		{
    		//delete files 没有全部加入到SubContextList
    		if(deleteContent.state != 2)
    		{
				buildSubContextList(deleteContent,SubContextList,10000);
    		}
    		
    		console.log("deleteDoc() index:" + index + " totalNum:" + totalNum);
    		var SubContext = SubContextList[index];
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
                },
	            success : function (ret) {
	                if( "ok" == ret.status ) //后台删除成功
	                {
	                	console.log(ret.data);
	                 	//Delete zTree Node
	                    var treeNode = getNodeByNodeId(docId);
	                    if(treeNode != null)
	                    {
	                    	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	                    	treeObj.removeNode(treeNode);
	                    }
	                    
				     	//Delete docList Node
				     	DocList.deleteNode(docId);
				     	
				     	//start to delete nextDoc
				     	deleteNextDoc();
				     	return;
	                }
	                else
	                {
	                	console.log("Error:" + ret.msgInfo);
	                	deleteErrorConfirm(name,ret.msgInfo);
	            		return;
	                }
	            },
	            error : function () {
	             	console.log("服务器异常：delete failed");
	             	deleteErrorConfirm(name,"服务器异常");
	            	return;
	            }
	    	});
		}
		
      	function deleteErrorConfirm(FileName,errMsg)
      	{
      		var msg = FileName + "删除失败,是否继续删除其他文件？";
      		if(errMsg)
      		{
      			msg = FileName + "删除失败(" + errMsg + "),是否继续删除其他文件？";
      		}
      		
      		//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: "deleteErrorConfirm",
    	        msg: msg,
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束",
    	    },function () {
    	    	//alert("点击了确定");
    	    	deleteNextDoc();
    	    	return true;
			},function(){
				//
				deleteEndHandler();
    	    	return true;
      		});
      	}
		
      	//删除子目录
      	function doDeleteSubDocs(treeNode)
      	{
			if(status == 0)
			{
				if(treeNode.isParent)	//如果是parentNode,则获取其子目录先删除掉
	            {
	            	console.log("treeNodes[" + index + "] isParent");
	            	var treeObj = $.fn.zTree.getZTreeObj("doctree");
					var subTreeNodes = treeObj.getNodesByParam("pId", treeNode.id, treeNode);
	            	if(subTreeNodes && subTreeNodes.length)
		      		{
		      			console.log("subTreeNodes num:" + subTreeNodes.length);
		      			//save context to contextStack
		      			//index++; //当前节点还没有被删除，所以index不可以增加哦
		      			status = 1; //但是需要记录该节点是第二次进来，避免再次检查该目录是否为空，理论上本来应该是可以检查的，但是好像获取subTreeNodes有点问题，导致获取到的子节点仍然存在
		      			pushContext();
		      			
		      			//设置新的copyDoc条件
		      			DocDeleteSet(subTreeNodes);
		      			
		      			deleteDoc();	//启动删除子目录
		      			return true;
		      		}
		      		else
		      		{
		      			console.log("subTreeNodes is null");
		      		}
	            }
			}
			return false;
      	}
      	
      	function deleteNextDoc()
      	{
           	//确定是否还有需要删除的文件
           	index++;
           	if(index < totalNum)	//callback没传入，表示单个删除
           	{
           		status = 0;
           		deleteDoc();	//do delete Next Doc	                   	
	      	}
           	else	//更新显示数据
           	{	
           		if(ContextSize() > 0)	//上下文非空
          		{
          			popContext();	//pop out the Context
           			if(index < totalNum)
           			{
           				status = 0;
           				deleteDoc();
					}
					else
					{
		    	    	busy = 0;
			            clearContext(); //清空上下文
			            
						bootstrapQ.msg({
							msg : '删除完成！',
							type : 'success',
							time : 2000,
						});
					}
          		}
          		else
          		{
        	    	busy = 0;
    	            clearContext(); //清空上下文
    	            
    	            //调用回调函数
    	            successCallBack && successCallBack();
    	            
    	            bootstrapQ.msg({
						msg : '删除完成！',
						type : 'success',
						time : 2000,
					});
            	}
            }
      	}
      	
		
		//开放给外部的调用接口
        return {
        	deleteDocs: function(treeNodes,parentNode,vid,callback){
        		if(callback)
        		{
        			successCallBack = callback;
        		}
        		deleteDocs(treeNodes,parentNode,vid);
            },
        };
    })();
	