	//DocDelete类
    var DocDelete = (function () {
        /*全局变量*/
        var isDeleteing = false;	//文件删除中标记
        var stopDeleteFlag = false;	//结束删除
        var DeleteedNum = 0; //已删除个数
        var successNum = 0;	//成功删除个数
		var failNum = 0; //删除失败个数
        
        /*Content 用于保存文件删除的初始信息*/
        var Content = {};
        Content.DeleteBatchList = [];
        Content.batchNum = 0;	//totalBatchNum
        Content.batchIndex = 0;	//curBatchIndex
        Content.state = 0;	//0: all DeleteBatch not inited 1: DeleteBatch Init is on going 2: DeleteBatch Init completed
        Content.totalFileNum = 0; 
        
        /*DeleteDoc conditions 用于指示当前的删除文件及删除状态*/
        var index = 0; //当前操作的索引
        var totalNum = 0; 
 		var SubContextList = []; //文件删除上下文List，用于记录单个文件的删除情况，在开始删除的时候初始化
 		
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
				DeleteDoc();	//start Delete
			}
		}
        
      	//初始化DocDelete
      	function DocDeleteInit(treeNodes,vid)	//多文件移动函数
		{
      		console.log("DocDeleteInit()");
			if(!treeNodes)
			{
				console.log("DocDeleteAppend() treeNodes is null");
				showErrorMessage("请选择文件！");
				return;
			}
			
			var fileNum = treeNodes.length;
			if(fileNum <= 0)
			{
				console.log("DocDeleteAppend() fileNum <= 0");
				showErrorMessage("请选择文件！");
				return;
			}
			
			//Build CopyBatch
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
			console.log("DocCopyInit Content:", Content);
	        
			
			isDeleteing = true;
			
			//清空上下文列表
			SubContextList = [];
			
			//Set the Index
			index = 0;
			
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
        		      		
		//DeleteDoc接口，该接口是个递归调用
		function DeleteDoc()
		{
    		//Delete files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
    		}
    		
    		console.log("DeleteDoc() index:" + index + " totalNum:" + totalNum);
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
	                shareId: gShareId,
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
				     	
				     	//start to Delete nextDoc
				     	DeleteNextDoc();
				     	return;
	                }
	                else
	                {
	                	console.log("Error:" + ret.msgInfo);
	                	DeleteErrorConfirm(name,ret.msgInfo);
	            		return;
	                }
	            },
	            error : function () {
	             	console.log("服务器异常：Delete failed");
	             	DeleteErrorConfirm(name,"服务器异常");
	            	return;
	            }
	    	});
		}
		
      	function DeleteErrorConfirm(FileName,errMsg)
      	{
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
    	    	//alert("点击了确定");
    	    	DeleteNextDoc();
    	    	return true;
			},function(){
				//
				DeleteEndHandler();
    	    	return true;
      		});
      	}
      	
      	//DeleteEndHandler
      	function DeleteEndHandler()
      	{
      		console.log("DeleteEndHandler() 删除结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
      		//清除标记
      		isDeleteing = false;
  			
      		//显示移动完成 
      		showDeleteEndInfo();
      	}
      	
  		function showDeleteEndInfo()
  		{
  			var deleteEndInfo = "移动完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			deleteEndInfo = "移动完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
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
		
      	function DeleteNextDoc()
      	{
           	//确定是否还有需要删除的文件
           	index++;
           	if(index < totalNum)	//callback没传入，表示单个删除
           	{
           		DeleteDoc();	//do Delete Next Doc	                   	
	      	}
           	else	//更新显示数据
           	{	
           		isDeleteing = false;
    	            	            
    	        bootstrapQ.msg({
						msg : '删除完成！',
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
	