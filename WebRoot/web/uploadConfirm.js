function uploadConfirmPageInit(files, parentNode, showCommitMsg)
{
	console.log("uploadConfirmPageInit()");
	if(showCommitMsg == true)
	{
		$("#dialog-upload-confirm div[name='commitMsg']").show();
	}
	UploadConfirm.init(files,parentNode);            
}

function closeUploadConfirmDialog()
{
	closeBootstrapDialog("uploadConfirm");
}

function doUploadDocs()
{
	UploadConfirm.doUploadDocs();
	closeUploadConfirmDialog();
}

var UploadConfirm = (function () {
	var files;
	var parentNode;
  	var parentPath = "";
  	var parentId = 0;
  	var level = 0;
	var vid = gReposInfo.id;
	
	function init(_files, _parentNode)
	{
		console.log("UploadConfirm.init()");
		files = _files;
		parentNode = _parentNode;
    		
		var firstFile;
		var relativePath;
		
	    if(files.length > 0)
   	   	{
   	    	console.log("files.length:" + files.length);
   	    	for( var i = 0 ; i < files.length ; i++ )
   	    	{  
   	    		firstFile = files[i];
   	    	   	if(typeof firstFile == 'object')
   	    	   	{
   	    	   		relativePath = firstFile.webkitRelativePath;	//获取第一个文件的相对路径
   	    	   		console.log("firstFile relativePath:"+firstFile.webkitRelativePath);
   	    	   		break;
   	    	   	}
   	    	   	else
   	    	   	{
   	    	   		//This is something else 
   	    	   		//console.log("it is not a file");
   	    	   	}
   	    	}
   	    }
   	    else
   	   	{
   	   		bootstrapQ.alert(_Lang("请选择文件"));
   	      	return false;
   	   	}  
   		
   		var fileName = firstFile.name;
   	    console.log("firstFile:"+fileName);
   	  	
   	  	var uploadDispInfo = fileName;
   	  	if(files.length > 1)
   	  	{
   	  		uploadDispInfo = uploadDispInfo + " " + _Lang("等") + " " + files.length + " " + _Lang("个文件");
   	  	}
   	  	
   		if(parentNode && parentNode != null)
   		{
   			parentPath = parentNode.path + parentNode.name+"/";
   			parentId=parentNode.id;
   			level = parentNode.Level+1;
   		}
   		else
   		{
   			parentNode=null;
   		}

   		var remoteDir = "/" + parentPath;	//only for display
       	
        $("#dialog-upload-confirm input[name='uploadContent']").val(uploadDispInfo);
        $("#dialog-upload-confirm input[name='remoteDir']").val(remoteDir);                
	}
	
	function doUploadDocs()
	{ 
		//开始上传
		var commitMsg = $("#dialog-upload-confirm input[name='commitMsg']").val();      
    	console.log("commitMsg:" + commitMsg);
		FileUpload.uploadDocs(files,parentNode,parentPath,parentId,level,vid,commitMsg);
	    return true;   
	}
	
	//开放给外部的调用接口
    return {
		init: function(_files, _parentNode){
			init(_files, _parentNode);
		},
    	doUploadDocs: function(){
    		doUploadDocs();
        },
    };
})();