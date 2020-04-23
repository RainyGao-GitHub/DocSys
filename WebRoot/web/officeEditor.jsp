<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%
String officeEditorApi = BaseController.getOfficeEditor();
%>

<div id="officePlayer" class="officePlayer" style="width: 100%; height: 100%;">
	<div id="placeholder"></div>
</div>
<script type="text/javascript" src="<%=officeEditorApi%>"></script>
<script type="text/javascript">
var OfficeEditor = (function () {
	var editor = null;
	var docInfo = null;
    var fileType = null;
    var documentType = null;
    var title = null;
    var key = null;
    
	function officeEditorPageInit(Input_doc)
	{
		console.log("officeEditorPageInit InputDoc:", Input_doc);
		docInfo = Input_doc;
	    fileType = getFileSuffix(docInfo.name);
	    documentType = getDocumentType(fileType);
	    title = docInfo.name;
	    
	    getDocOfficeLink(docInfo, showOffice, showErrorMessage, "REST");
	}
	
    function showOffice(data, dataEx)
   	{
		var fileLink = buildFullLink(data.fileLink);
		var saveFileLink = buildFullLink(data.saveFileLink);
		var key = data.key;
    	
    	console.log("showOffice() title=" + title + " key=" + key + " fileType=" + fileType + " documentType=" + documentType + " fileLink="+fileLink + " saveFileLink:" + saveFileLink);
		var type = 'desktop';
    	var width = "100%";
		if(gIsPC == false)
		{
			type = 'mobile';
			width = "90%";
		}
    	
    	var config = {
				"type" : type,
    		    "document": {
    		        "fileType": fileType,
    		        "key": key,
    		        "title": title,
    		        "url": fileLink,
    		        "permissions": {
    		            "comment": true,
    		            "download": true,
    		            "edit": true,
    		            "fillForms": true,
    		            "modifyContentControl": true,
    		            "modifyFilter": true,
    		            "print": true,
    		            "review": true
    		        },
    		    },
    		    "documentType": documentType,
    		    "editorConfig": {
                    "callbackUrl": saveFileLink,
                    "lang": "zh-CN",
                },
                "height": "100%",
                "width": width,
    	};
        editor = new DocsAPI.DocEditor("placeholder", config);
   	}

    //开放给外部的接口
    return {
        officeEditorPageInit: function(docInfo){
        	officeEditorPageInit(docInfo);
        },
    };
})();
</script>