<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%
String officeEditorApi = BaseController.getOfficeEditor(request);
Boolean isBussienss = BaseController.isBussienss();;
%>

<!DOCTYPE html>
<html style="height: 100%;">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Office Editor</title>
    <script src="static/scripts/jquery.min.js"></script>
    <script type="text/javascript" src="js/common.js"></script>
    <script type="text/javascript" src="js/base64.js"></script>
    <script type="text/javascript" src="js/DocSys.js"></script>
    <script type="text/javascript" src="<%=officeEditorApi%>"></script>
</head>
<body style="height: 100%; margin: 0;">
    <div id="placeholder" style="height: 100%"></div>
    <script type="text/javascript">
    	var editor;
	    var docInfo = getDocInfoFromRequestParamStr();	    
	    var fileType = getFileSuffix(docInfo.name);
	    var documentType = getDocumentType(fileType);
	    var title = docInfo.name;
	    var key = docInfo.docId + "";
	    
	    getDocOfficeLink(docInfo, showOffice, showErrorMessage, "REST", <%=isBussienss%>);
	    document.title = docInfo.name;
	    
	    function showOffice(data)
	   	{
			var fileLink = buildFullLink(data.fileLink);
			var saveFileLink = "";
			var key = data.key + "";	//key是用来标志唯一性的，文件改动了key也必须改动
			
	    	console.log("showOffice() title=" + title + " key=" + key + " fileType=" + fileType + " documentType=" + documentType + " fileLink="+fileLink + " saveFileLink:" + saveFileLink);
			var type = 'desktop';
	    	if(gIsPC == false)
			{
				type = 'mobile';
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
					"type": type,
	    		    "document": {
	    		        "fileType": fileType,
	    		        "key": key,
	    		        "title": title,
	    		        "url": fileLink,
	    		        "permissions": {
	    		            "comment": editEn,
	    		            "download": downloadEn,
	    		            "edit": editEn,
	    		            "fillForms": editEn,
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
	                    "spellcheck": false,
	                },
	                "height": "100%",
	                "width": "100%",
	    	};
	        editor = new DocsAPI.DocEditor("placeholder", config);
	   	}
    </script>
</body>
</html>