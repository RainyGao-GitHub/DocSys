<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%
String officeEditorApi = BaseController.getOfficeEditor();
%>

<div id="officePlayer" class="officePlayer" style="width: 100%; height:1200px;">
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
	    key = docInfo.docId + "";
	    
	    getDocOfficeLink(docInfo, showOffice, showErrorMessage);
	}
	
    function showOffice(fileLink, saveFileLink)
   	{
    	console.log("showOffice() title=" + title + " key=" + key + " fileType=" + fileType + " documentType=" + documentType + " fileLink="+fileLink + " saveFileLink:" + saveFileLink);
		var config = {
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
                "width": "100%",
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