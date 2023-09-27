function addDocPageInit(_type, _parentNode)
{
	console.log("addDocPageInit()");
	AddDocConfirm.init(_type, _parentNode);  
}

function closeAddDocDialog()
{
	closeBootstrapDialog("addDoc");
}

function doAddDoc()
{
	AddDocConfirm.doAddDoc();
  	closeAddDocDialog();	
}

function cancelAddDoc()
{
	closeAddDocDialog();
}

var AddDocConfirm = (function () {
	var type;
	var parentNode;
	
	var parentId = 0;
	var parentPath = "";
	var remoteDir = gReposInfo.name+ "::"; //only for display
	
	function init(_type, _parentNode)
	{
		console.log("AddDocConfirm.init()");

		type = _type;
		parentNode = _parentNode;
		if(parentNode && parentNode.id)
		{
			parentId = parentNode.id;
			parentPath = getNodePath(parentNode) + parentNode.name+ "/";
			remoteDir = gReposInfo.name+ "::" + parentPath; //only for display		
		}

        $("#dialog-new-doc input[name='name']").focus();
        $("#dialog-new-doc input[name='remoteDir']").val(remoteDir);    
	}
	
	function doAddDoc()
	{
	    var name = $("#dialog-new-doc input[name='name']").val();
	    var content = $("#dialog-new-doc textarea[name='content']").val();
	    var fileLink = $("#dialog-new-doc input[name='fileLink']").val();

	    //检查当前目录下是否有同名文件
		  if(isNodeExist(name,parentNode) == true)
		  {	
			showErrorMessage(name + " " + _Lang("已存在"));
		  	return false;
		  }
		  var vid = gReposInfo.id;
		  
		  //发送新建文件请求到后台
	    if( name ){
	    	if(fileLink && fileLink.length > 0)
	    	{
	    		addDocFromUrl(name, type, content, fileLink, parentNode, parentId, vid);
	    	}
	    	else
	    	{
	    		addDoc(name,type,content,parentNode,parentId,vid);
	    	}
	      	return true;
	    }else{
	    	  alert(_Lang("文件名不能为空"));
	        return false;
	    }
	}
	
   	function addDoc(name,type,content,parentNode,parentId,vid)
   	{
   		console.log("addDoc name:" + name + " type:" +  type + " content:" +  content + " parentNode:" +  parentNode + " vid:" +  vid);
   		var parentPath = "";
   		if(parentNode && parentNode != null)
   		{
   			parentPath = parentNode.path + parentNode.name + "/";
   		}

    	$.ajax({
             url : "/DocSystem/Doc/addDoc.do",
             type : "post",
             dataType : "json",
             data : {
                reposId : vid, 
				type : type, //文件类型
	            pid : parentId,
                path: parentPath,
                name : name,
             	content: content,
             	shareId: gShareId,
             },
             success : function (ret) {
            	console.log("addDoc ret:", ret);            		
             	if( "ok" == ret.status && ret.data.docId){             		
             		if(type == 2)
                    {
                    	isParent = true;
                    }
                    else
                    {
                    	isParent = false;                    	
                    }
             		
             		
                    //Add zTreeNode
             		addTreeNode(ret.data);
                    
                    //Add docListNode
             		addDocListNode(ret.data);
                    
             		// 普通消息提示条
					bootstrapQ.msg({
								msg : _Lang("新建完成") + "!",
								type : 'success',
								time : 2000,
					});         		
                }
                else
                {
                	showErrorMessage(_Lang("新建失败", " : ", ret.msgInfo));
                }
            },
            error : function () {
                showErrorMessage(_Lang("新建失败", " : ", "服务器异常"));
            }
        });
    }
   	
   	function addDocFromUrl(name, type, content, fileLink, parentNode, parentId, vid)
   	{
   		console.log("addDocFromUrl name:" + name + " type:" +  type + " content:" +  content + " fileLink:" + fileLink + " parentNode:" +  parentNode + " vid:" +  vid);
   		var parentPath = "";
   		if(parentNode && parentNode != null)
   		{
   			parentPath = parentNode.path + parentNode.name + "/";
   		}

    	$.ajax({
             url : "/DocSystem/Doc/uploadDocRS.do",
             type : "post",
             dataType : "json",
             data : {
                taskId: "myTestQueryId",
            	reposId : vid, 
				type : type, //文件类型
	            pid : parentId,
                path: parentPath,
                name : name,
             	content: content,
             	fileLink: fileLink,
             	size: 2399550,
             	shareId: gShareId,
             },
             success : function (ret) {
            	console.log("addDocFromUrl ret:", ret);            		
             	if( "ok" == ret.status && ret.data.docId){             		
             		if(type == 2)
                    {
                    	isParent = true;
                    }
                    else
                    {
                    	isParent = false;                    	
                    }
             		
             		
                    //Add zTreeNode
             		addTreeNode(ret.data);
                    
                    //Add docListNode
             		addDocListNode(ret.data);
                    
             		// 普通消息提示条
					bootstrapQ.msg({
								msg : _Lang("新建完成") + "!",
								type : 'success',
								time : 2000,
					});         		
                }
                else
                {
                	showErrorMessage(_Lang("新建失败", " : ", ret.msgInfo));
                }
            },
            error : function () {
                showErrorMessage(_Lang("新建失败", " : ", "服务器异常"));
            }
        });
    }
   	
	//开放给外部的调用接口
    return {
		init: function(_type, _parentNode){
			init(_type, _parentNode);
		},
    	doAddDoc: function(){
    		doAddDoc();
        },
    };
})();
