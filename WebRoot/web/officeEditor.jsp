<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%
String officeEditorApi = BaseController.getOfficeEditor();
%>

<div id="officePlayer" class="officePlayer" style="width: 100%; height: 1000px;">
	<div id="placeholder"></div>
</div>
<script type="text/javascript" src="<%=officeEditorApi%>"></script>
<script type="text/javascript">
var height =  window.screen.height;
console.log("window height=" + height)
height *= 0.95;
console.log("dialog height=" + height)
document.getElementById('officePlayer').style.height = height + "px";

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
	
    function showOffice(data)
   	{
		var fileLink = buildFullLink(data.fileLink);
		var saveFileLink = "";
		var key = data.key + "";
    	
    	console.log("showOffice() title=" + title + " key=" + key + " fileType=" + fileType + " documentType=" + documentType + " fileLink="+fileLink + " saveFileLink:" + saveFileLink);
		var type = 'desktop';
    	var width = "100%";
		if(gIsPC == false)
		{
			type = 'mobile';
			width = "90%";
		}
    	
		var editEn =  data.editEn == 1? true:false;
		var mode = "view";
		if(editEn == true)
		{
			saveFileLink = buildFullLink(data.saveFileLink);
			mode = "edit";
		}
		var downloadEn = data.downloadEn == 1? true:false;
		console.log("editEn:" + editEn + " downloadEn:" + downloadEn);
		var user = {
                "id": data.userId + "",
                "name": data.userName,
            };
		
    	var config = {
				"type" : type,
    		    "document": {
    		        "fileType": fileType,
    		        "key": key,
    		        "title": title,
    		        "url": fileLink,
    		        "permissions": {
    		            "comment": editEn,
    		            "download": downloadEn,
    		            "edit": editEn,
    		            "fillForms": true,
    		            "modifyContentControl": editEn,
    		            "modifyFilter": editEn,
    		            "print": downloadEn,
    		            "review": true
    		        },
    		    },
    		    "documentType": documentType,
    		    "editorConfig": {
    		    	"mode": mode,
                    "callbackUrl": saveFileLink,
                    "lang": "zh-CN",
                    "user": user,
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