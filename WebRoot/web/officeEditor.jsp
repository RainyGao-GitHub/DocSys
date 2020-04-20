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
	
	function officeEditorPageInit(Input_doc)
	{
		console.log("officeEditorPageInit InputDoc:", Input_doc);
		docInfo = Input_doc;
		var fileLink = getDocDownloadFullLink(docInfo);
	    var fileType = getFileSuffix(docInfo.name);
	    var documentType = getDocumentType(fileType);
	    var title = docInfo.name;
	    var key = docInfo.docId + "";
	    
	    console.log("officeEditorPageInit() title=" + title + " key=" + key + " fileType=" + fileType + " documentType=" + documentType + " fileLink="+fileLink);
		   
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