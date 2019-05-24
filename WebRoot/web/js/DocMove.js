	//DocMove类	
    var DocMove = (function () {
    	var busy = 0;
    	
        //moveDoc conditions
    	var index = 0; //当前操作的索引
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
      	
		//多文件move接口
		function moveDocs(treeNodes,parentNode,vid)	//多文件移动函数
		{
			console.log("moveDocs");

			if(busy == 1)
			{
				bootstrapQ("系统正忙，请稍候重试!");
				return;
			}
			busy = 1;
			clearContext();	//清空Context缓存
			
			DocMoveSet(treeNodes,parentNode,vid);	//设置DocMove Parameters
				
			//启动复制操作      		
			moveDoc();	//start move
		}
		
      	//初始化DocMove设置
      	function DocMoveSet(treeNodes,parentNode,vid)	//多文件移动函数
		{
			console.log("DocMoveSet");

			setIndex(0);

			setTreeNodes(treeNodes);
			var totalNum = 0;
			if(treeNodes && treeNodes.length)
			{
				totalNum = treeNodes.length;
			}
			setTotalNum(totalNum);

			setParentNode(parentNode);
			var parentId = 0;
			if(parentNode && parentNode.id)
			{
 				parentId = parentNode.id;
			}
			setParentId(parentId);
			
			setVid(vid);			
      	}
      		
		//moveDoc接口，该接口是个递归调用
    	function moveDoc()
    	{
    		console.log("moveDoc index:" + index + " totalNum:" + totalNum + " parentId:" + parentId + " vid:" + vid);
    		var treeNode = treeNodes[index];
    		
  	    	if(treeNode.pid == parentId)
  			{
  	    		console.log("treeNode is already under parentNode","treeNode",treeNode,"parentNode",parentNode);
  	    		//moveErrorConfirm(treeNode.name);
  	    		moveNextDoc();
  	    		return; 
  			}
  	    	
			//执行后台moveDoc操作
    		$.ajax({
                url : "/DocSystem/Doc/moveDoc.do",
                type : "post",
                dataType : "json",
                data : {
                    docId : treeNode.id,
                    srcPid: treeNode.pid,
                    dstPid: parentId,
                    srcPath: treeNode.path,
                    srcName: treeNode.name,
                    dstPath: parentNode.path + parentNode.name + "/",
                    dstName: treeNode.name,
                    vid: vid,
                },
                success : function (ret) {
                   if( "ok" == ret.status )
                   {
                	    var doc = ret.data;
                	   	//Add or Delete from DocList
               			if(parentId == DocListParentDocId)	//dstParentId
            			{
							DocList.addNode(doc.id, doc.pid, doc.type, doc.path, doc.name, doc.latestEditTime);
            			}
               			else if(treeNode.pid == DocListParentDocId) //srcParentId
               			{
               				DocList.deleteNode(docId);
               			}
                   		
                	   	//moveNextDoc
                	   	moveNextDoc();
                	   	return;
                   }
                   else	//后台报错，结束移动
                   {
                	   console.log("moveDoc Error:" + ret.msgInfo);
                       moveErrorConfirm(treeNode.name,ret.msgInfo);
                       return;
                   }
                },
                error : function () {	//后台异常
 	               console.log("服务器异常：文件[" + index + "]移动异常！");
            	   moveErrorConfirm(treeNode.name,"服务器异常");
            	   return;
                }
        	});
    	}

		function moveNextDoc()
		{
	        index++;	//move成功，则调用回调函
	        if(index < totalNum) //上传没结束，且回调函数存在则回调，否则表示结束
	        {
	        	console.log("moveDoc Next");
	        	moveDoc();
	        }
	        else	//上传结束，保存目录结构到后台
	        {
    	    	busy = 0;
	            clearContext(); //清空上下文
	            
	         	console.log("moveDoc End");
				bootstrapQ.msg({
					msg : '移动完成！',
					type : 'success',
					time : 2000,
				});
	        }
		}
		
      	function moveErrorConfirm(FileName,errMsg)
      	{
      		var msg = FileName + "移动失败,是否继续移动其他文件？";
      		if(errMsg != undefined)
      		{
      			msg = FileName + "移动失败(" + errMsg + "),是否继续移动其他文件？";
      		}
      		//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: "moveErrorConfirm",
    	        msg: msg,
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束",
    	    },function () {
    	    	//alert("点击了确定");
    	    	moveNextDoc();
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
            moveDocs: function(treeNodes,parentNode,vid){
            	moveDocs(treeNodes,parentNode,vid);
            },
        };
    })();