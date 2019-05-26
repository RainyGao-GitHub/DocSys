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
        DeleteContent.initedFileNum = 0;
        DeleteContent.totalFileNum = 0; 
        
        /*DeleteDoc conditions 用于指示当前的删除文件及删除状态*/
        var index = 0; //当前操作的索引
        var totalNum = 0; 
 		var SubContextList = []; //文件删除上下文List，用于记录单个文件的删除情况，在开始删除的时候初始化
        var vid = 0;
 		
        //状态机变量，用于实现异步对话框的实现
        var fileCoverConfirmSet = 0; //0：文件已存在时弹出确认窗口，1：文件已存在直接覆盖，2：文件已存在跳过
        var DeleteErrorConfirmSet = 0; //0:删除错误时弹出确认是否继续删除窗口，1：删除错误时继续删除后续文件， 2：删除错误时停止整个删除		
        var DeleteWarningConfirmSet =0; //0: 删除警告时弹出确认是否继续删除窗口，1：删除警告时继续删除后续文件 2：删除警告时停止整个删除
        
        //vars for reDelete
        var reDeleteFlag = false; //false: 正常删除  true: 重传
        var reDeleteCount = 0; 
        var reDeleteTotalNum = 0;
        var reDeleteFailNum = 0;
        var reDeleteSuccessNum = 0;
        var reDeleteedNum = 0;
        var reDeleteList = []; //重传列表，保存的是SubContext的index
        var reDeleteIndex = 0;	//This is for reDelete, the index should be reDeleteList[reDeleteIndex]
        
        //标准Java成员操作接口
        function getDeleteStatus()
        {
        	var DeleteStatus = "idle";
        	if(isDeleteing == true)
        	{
        		DeleteStatus = "busy";
        	}
        	console.log("DeleteStatus: " + DeleteStatus);
        	return DeleteStatus;
        }
		
		//多文件Delete接口
		function deleteDocs(treeNodes,parentNode,vid)	//多文件移动函数
		{
			console.log("deleteDocs");
			if(busy ==  1)
			{
				bootstrapQ.alert("系统正忙，请稍候重试！");
				return;
			}
			
			busy = 1;
			clearContext();	//清空Context缓存
			
			DocDeleteSet(treeNodes,parentNode,vid);	//设置DocCopy Parameters
				
			//启动删除操作      		
			deleteDoc();	//start delete
		}
		
      	//初始化deleteDoc conditions
      	function DocDeleteSet(treeNodes)	//多文件移动函数
		{
			console.log("DocDeleteSet");

			setIndex(0);
			setTreeNodes(treeNodes);
			var totalNum = 0;
			if(treeNodes && treeNodes.length)
			{
				totalNum = treeNodes.length;
			}
			setTotalNum(totalNum);
			status = 0;
		}
      		
		//deleteDoc接口，该接口是个递归调用
		function deleteDoc()
		{
			var treeNode = treeNodes[index];
			console.log("deleteDoc index:" + index + " name:" + treeNode.name + " totalNum:" + totalNum);
			
			//后台会自动删除子目录，因此前台不需要遍历删除其子目录
			//if(doDeleteSubDocs() == true)
			//{
			//	return;
			//}
			
			$.ajax({
                url : "/DocSystem/Doc/deleteDoc.do",
                type : "post",
                dataType : "json",
                data : {
                	reposId: gReposId,
                    docId : treeNode.id,
                    pid: treeNode.pid,
                    path: treeNode.path,
                    name: treeNode.name,
                },
	            success : function (ret) {
	                if( "ok" == ret.status ) //后台删除成功
	                {
	                	console.log(ret.data);
	                 	//Delete zTree Node
	                    var treeObj = $.fn.zTree.getZTreeObj("doctree");
				     	treeObj.removeNode(treeNode);
				     	//Delete docList Node
				     	DocList.deleteNode(treeNode.id);
				     	
				     	//start to delete nextDoc
				     	deleteNextDoc();
				     	return;
	                }
	                else
	                {
	                	console.log("Error:" + ret.msgInfo);
	                	deleteErrorConfirm(treeNode.name,ret.msgInfo);
	            		return;
	                }
	            },
	            error : function () {
	             	console.log("服务器异常：delete failed");
	             	deleteErrorConfirm(treeNode.name,"服务器异常");
	            	return;
	            }
	    	});
		}
		
      	function deleteErrorConfirm(FileName,errMsg)
      	{
      		var msg = FileName + "删除失败,是否删除复制其他文件？";
      		if(errMsg != undefined)
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
    	    	//alert("点击了取消");
    	    	busy = 0;
	            clearContext(); //清空上下文
	            //syncUpMenu();	//将新增的失败的节点刷掉
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
	