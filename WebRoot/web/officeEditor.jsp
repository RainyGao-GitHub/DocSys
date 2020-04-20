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
	    
	    var fileLink = docInfo.fileLink;
		if(!fileLink || fileLink == null || fileLink == "")
		{
			getDocOfficeLink(docInfo, showOffice, showErrorMessage);
		}
		else
		{
			showOffice(fileLink);
		}
	}
	
    function showOffice(fileLink)
   	{
    	console.log("showOffice() title=" + title + " key=" + key + " fileType=" + fileType + " documentType=" + documentType + " fileLink="+fileLink);
		var config = {
    		    "document": {
    		        "fileType": fileType,
    		        "key": key,
    		        "title": title,
    		        "url": fileLink,
    		    },
    		    "documentType": documentType,
                //"editorConfig": {
                //    "callbackUrl": saveUrl,
                //    "lang": "zh-CN",
                //},
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