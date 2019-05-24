	//DocCopy类
    var DocCopy = (function () {
    	
    	//copyDoc conditions
        var index = 0;        //当前操作的索引
        var treeNodes = null;
        var totalNum = 0;
        var parentNode = null;
        var parentId = 0;
        var vid = 0; 

        //Context Cache
        var indexCache = [];
        var treeNodesCache =[];
        var totalNumCache = [];
        var parentNodeCache = [];
        var parentIdCache = [];
        var vidCache = [];
        
        //标准Java成员操作接口
		function getIndex()
		{
            return index;
		}
		
		function setIndex(i)
		{
			index = i;
		}
		
		function getTreeNodes()
		{
            return treeNodes;
		}
		
		function setTreeNodes(nodes)
		{
			treeNodes = nodes;
		}
		
		function getTotalNum()
		{
            return totalNum;
		}
		
		function setTotalNum(num)
		{
			totalNum = num;
		}
		
		function getParentNode()
		{
            return parentNode;
		}
		
		function setParentNode(node)
		{
			parentNode = node;
		}
		
		function getParentId()
		{
            return parentId;
		}
		
		function setParentId(id)
		{
			parentId = id;
		}
		
		function getVid()
		{
            return vid;
		}
		
		function setVid(id)
		{
			vid = id;
		}
		
		
		//上下文操作接口
		function pushContext()
		{
			indexCache.push(index);
			treeNodesCache.push(treeNodes);
			totalNumCache.push(totalNum);
			parentNodeCache.push(parentNode);
			parentIdCache.push(parentId);
			vidCache.push(vid);			
		}
		function popContext()
		{
			index = indexCache.pop();
			treeNodes = treeNodesCache.pop();
			totalNum = totalNumCache.pop();
			parentNode = parentNodeCache.pop();
			parentId = parentIdCache.pop();
			vid = vidCache.pop();
		}
		function clearContext()	//清空上下文，出错时需要清空，避免下次进来是被pop out来执行
		{
			indexCache = [];
	        treeNodesCache =[];
	        totalNumCache = [];
	        parentNodeCache = [];
	        parentIdCache = [];
	        vidCache = [];
		}
		function ContextSize()
		{
			return indexCache.length;
		}
      	
		//提供给外部的多文件copy接口
		function copyDocs(treeNodes,parentNode,vid)	//多文件移动函数
		{
			console.log("copyDocs");
			if(ContextSize() > 0)
			{
				bootstrapQ.alert("系统正忙，请稍候重试！");
				return;
			}
			
			DocCopyInit(treeNodes,parentNode,vid);	//设置DocCopy Parameters
				
			//启动复制操作      		
			copyDoc();	//start copy
			
			
		}
		
		//多文件Copy接口
		function copyDocs(treeNodes,parentNode,vid)	//多文件复制函数
		{
			console.log("copyDocs()");
			//console.log(files);
			if(treeNodes.length <= 0)
			{
				showErrorMessage("没有需要复制的文件!");
				return;
			}
				
			if(isCopping == true)
			{
				DocCopyAppend(treeNodes,parentNode,vid);
			}
			else
			{
				DocCopyInit(treeNodes,parentNode,vid);
				copyDoc();
			}
		}
		
      	//初始化DocCopy
      	function DocCopyInit(treeNodes,parentNode,parentPath,parentId,level,vid)	//多文件移动函数
		{
			console.log("DocCopyInit()");
			var fileNum = treeNodes.length;
			console.log("DocCopyInit() fileNum:" + fileNum);				

			//Build CopyBatch
			var copyBatch = {};
			copyBatch.treeNodes = treeNodes;
			copyBatch.parentNode = parentNode;
			copyBatch.parentPath = parentNode.path;
			copyBatch.parentId = parentId;
			copyBatch.level = level;
			copyBatch.vid = vid;
			copyBatch.num = fileNum;
			copyBatch.index = 0;
			copyBatch.state = 0;
			
			//add to copyContent
			copyContent.copyBatchList = [];
			copyContent.copyBatchList.push(uploadBatch);			
			copyContent.batchNum = 1;
	        copyContent.totalFileNum = fileNum;
			totalNum = copyContent.totalFileNum;
			
			//Init copyContent state
			copyContent.initedFileNum = 0;
			copyContent.batchIndex = 0;
			copyContent.state = 1;
			console.log("DocUploadInit copyContent:", copyContent);
	        
			
			isCopping = true;
			
			//清空上下文列表
			SubContextList = [];
			FailList = [];
			
			//Set the Index
			index = 0;
			
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(copyContent, SubContextList, 1000);
			console.log("文件总的个数为："+totalNum);
      	}
      	
      	//增加上传文件
      	function DocCopyAppend(treeNodes, parentNode, parentPath, parentId, level, vid)	//多文件移动函数
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
			var copyBatch = {};
			copyBatch.treeNodes = treeNodes;
			copyBatch.parentNode = parentNode;
			copyBatch.parentPath = parentNode.path;
			copyBatch.parentId = parentId;
			copyBatch.level = level;
			copyBatch.vid = vid;
			copyBatch.num = fileNum;
			copyBatch.index = 0;
			copyBatch.state = 0;

			//Append to copyContent
			copyContent.batchList.push(copyBatch);
			copyContent.batchNum++;
			copyContent.totalFileNum += fileNum;
			totalNum = copyContent.totalFileNum;
			
			console.log("DocCopyAppend() Content:", Content);
			
			if(copyContent.state == 2)	//uploadBatch already initiated, need to restart it
			{
				copyContent.batchIndex++;
				copyContent.state = 1;
				buildSubContextList(copyContent, SubContextList, 1000);
			}
			
			console.log("文件总的个数为："+uploadContent.totalFileNum);
		}
      		
		//copyDoc接口，该接口是个递归调用
		function copyDoc(dstName)
		{
			var treeNode = treeNodes[index];
			console.log("copyDoc index:" + index + " name:" + treeNode.name + " parentId:" + parentId + " vid:" + vid + " totalNum:" + totalNum);
			
			//
			if(treeNode.id == parentId)
			{
				console.log("treeNode is same to parentNode","treeNode",treeNode.id,"parentId",parentId);
				copyErrorConfirm(treeNode.name);
				return;
			}			
			
			var dstDocName = treeNode.name;
			//如果copyDoc未指定dstName,需要检查parentNode下是否存在同名Node
			if(dstName != undefined)
			{
				dstDocName = dstName;	
			}
			else
			{
				if(isNodeExist(treeNode.name,parentNode) == true)
			  	{
			  		//Node Name conflict confirm
					CopyConflictConfirm(treeNode.name);
			  		return;
			  	}
			}
			
			$.ajax({
	            url : "/DocSystem/Doc/copyDoc.do",
	            type : "post",
	            dataType : "json",
	            data : {
	                docId : treeNode.id,	//待复制的docid
	                srcPid: treeNode.pid,
	                dstPid: parentId,	//目标doc parentId
	                srcPath: treeNode.path,
	                srcName: treeNode.name,
	                dstPath: parentNode.path + parentNode.name + "/",
	                dstName: dstDocName, //目标docName
	                vid: vid,			//仓库id
	            },
	            success : function (ret) {
	                if( "ok" == ret.status ){
	                	console.log("copyDoc() ok:",ret.data);
	                 	
	                	//后台复制成功，根据后台返回的docid,新建一个treeNode
	                	addTreeNode(ret.data,parentNode);	          			
	          			
	          			//复制下一个Doc
	                    copyNextDoc();
	                }
	                else
	                {
	                	console.log("Error:" + ret.msgInfo);
	                	copyErrorConfirm(treeNode.name,ret.msgInfo);
	                	return;
	                }
	            },
	            error : function () {
	            	console.log("服务器异常：copy failed");
                	copyErrorConfirm(treeNode.name,"服务器异常");
                	return;
	            }
	    	});
		}
		
		function doCopySubDocs(treeNode)
		{
  			if(treeNode.isParent)	//如果是parentNode,则获取其子目录
            {
            	console.log("treeNodes[" + index + "] isParent");
            	var subTreeNodes = treeObj.getNodesByParam("pId", treeNode.id, treeNode);
            	if(subTreeNodes && subTreeNodes.length)
	      		{
	      			console.log("subTreeNodes num:" + subTreeNodes.length + " newTreeNode:" + newTreeNode.name);
	      			//保存上下文
	      			index++;
	      			pushContext();
	      			//设置新的copyDoc条件
	      			DocCopySet(subTreeNodes,newTreeNode,vid);
	      			return true;
	      		}
	      		else
	      		{
	      			console.log("subTreeNodes is null");
	      		}
            }
  			return false;
		}
		
		//启动复制下一个Doc,如果没有了的话则结束复制
		function copyNextDoc()
		{
           	//确定是否还有需要复制的文件
           	index++;
           	if(index < totalNum)	//callback没传入，表示单个上传
           	{
   				//Start to copy next Doc
	      		copyDoc();	//do copy Next Doc	                   	
	      	}
           	else	//更新显示数据
           	{	
           		if(ContextSize() > 0)	//上下文非空
          		{
          			popContext();	//pop out the Context
           			if(index < totalNum)
           			{
           				//Start to copy next Doc
           				copyDoc();
					}
					else
					{
	        	    	busy = 0;
	    	            clearContext(); //清空上下文
			            
						bootstrapQ.msg({
							msg : '复制完成！',
							type : 'success',
							time : 2000,
						});
					}
          		}
          		else
          		{
        	    	busy = 0;
    	            clearContext(); //清空上下文

    	            bootstrapQ.msg({
						msg : '复制完成！',
						type : 'success',
						time : 2000,
					});
            	}
            }
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
				copyDoc(dstName);
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
    	    	copyNextDoc();
    	    	return true;
			},function(){
    	    	//alert("点击了取消");
    	    	busy = 0;
    	        clearContext(); //清空上下文
    	        syncUpMenu();	//刷新菜单
    	    	return true;
      		});
      	}
		
		//开放给外部的调用接口
        return {
			copyDocs: function(treeNodes,parentNode,vid){
            	copyDocs(treeNodes,parentNode,vid);
            },
        };
    })();
    