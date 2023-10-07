function renameConfirmPageInit(node)
{
	console.log("renameConfirmPageInit()");
	RenameDocConfirm.init(node);
}	

function closeRenameConfirmDialog()
{
	closeBootstrapDialog("renameConfirm");
}

function cancelRenameDoc()
{
	closeRenameConfirmDialog();
}

function doRenameDoc()
{
	RenameDocConfirm.doRenameDoc();
	closeRenameConfirmDialog();	
}

var RenameDocConfirm = (function () {
	var node;
	var docId;
	var pid;
	var parentPath;
	var docName;
	var level;
	var type;
	
	function init(_node)
	{
		console.log("RenameDocConfirm.init()");
		node = _node;
		docId = node.id;
		pid = node.pid;
		parentPath = node.path;
		docName = node.name;
		level = node.level;
		type = node.type;
		$("#dialog-renameConfirmDialog input[name='docName']").val(docName);
	}
	
	function doRenameDoc()
	{
		var newName = $("#dialog-renameConfirmDialog input[name='docName']").val();
		renameDoc(docId, type, level, pid, parentPath, docName,newName);
	    return true;
	}
	
	function renameDoc(docId, type,  level, pid, parentPath, docName, newName)
	{
   		console.log("doRenameDoc docId:" + docId + " type:"+ type + " level:" + level + " pid:" + pid + " path:" + parentPath + " name:" + docName + " newName:" +  newName);
		$.ajax({
            url : "/DocSystem/Doc/renameDoc.do",
            type : "post",
            dataType : "json",
            data : {
            	reposId: gReposInfo.id,
                docId : docId,
                pid	: pid,
                type: type,
                level: level,
                path: parentPath,
                name: docName,
                dstName: newName,
                shareId: gShareId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                	console.log("renameDoc ok:", ret.data)
                    //Rename at zTree
              	    addTreeNode(ret.data);
              	    deleteTreeNodeById(docId);

              		//Rename at docList
              		DocList.deleteNode(docId);
              		addDocListNode(ret.data);
		            
			     	bootstrapQ.msg({
							msg : _Lang("重命名完成！"),
							type : 'success',
							time : 2000,
					});
                }
                else
                {
                	showErrorMessage("重命名失败:" + ret.msgInfo);
                }
            },
            error : function () {
	               showErrorMessage("重命名失败:服务器异常！");
            }
    	});
	}
	
	function renameTreeNode(id, newDocId, newName)
	{
		var zTree = $.fn.zTree.getZTreeObj("doctree");
		var node = zTree.getNodeByParam("id",id);
		if(node && node != null)
		{
			node.name = newName;
			node.id = newDocId;
			node.docId = newDocId;
		}
		zTree.updateNode(node);
		
	    //Add or Delete from zTree
  	    addTreeNode(doc);
  	    deleteTreeNodeById(SubContext.docId);

		
		if(node.isParent == true && node.open == true) //刷新目录
		{
			//强制异步刷新子目录，以保证子目录的信息正确
			zTree.reAsyncChildNodes(node, "refresh",true);	
		}
	}

	//开放给外部的调用接口
    return {
		init: function(_node){
			init(_node);
		},
    	doRenameDoc: function(){
    		doRenameDoc();
        },
    };
})();

