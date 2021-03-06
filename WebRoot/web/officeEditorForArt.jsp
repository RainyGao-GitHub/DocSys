<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%
String officeEditorApi = BaseController.getOfficeEditor(request);
Boolean isBussienss = BaseController.isBussienss();
%>

<script src="static/scripts/jquery.min.js"></script>
<script type="text/javascript" src="js/common.js"></script>
<script type="text/javascript" src="js/base64.js"></script>
<script type="text/javascript" src="js/DocSys.js"></script>
<script type="text/javascript" src="<%=officeEditorApi%>"></script>
<div id="placeholder" style="height: 100%"></div>
<script type="text/javascript">
	var artDialog = top.dialog.get(window);
	var docInfo = {};
	if(artDialog)
	{
		docInfo = artDialog.data; // 获取对话框传递过来的数据
	}
	else
	{
		//解决artDialog递归调用的数据穿透问题
		docInfo = window.parent.gDialogData[window.name];
	}
	console.log("docInfo:",docInfo);

	var editor;
    var fileType = getFileSuffix(docInfo.name);
    var documentType = getDocumentType(fileType);
    var title = docInfo.name;
    var key = docInfo.docId + "";
    
    $(document).ready(function()
    {
    	getDocOfficeLink(docInfo, showOffice, showErrorMessage, "REST", <%=isBussienss%>);
    });
    
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
		
    	/*var config = {
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
                },
                "height": "100%",
                "width": "100%",
    	};*/
    	
    	var config = {
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
    		        //"location": "us",
    		        //"region": "en-US",
    		        "customization": {
    		            "anonymous": {
    		                "request": true,
    		                "label": "Guest"
    		            },
    		            "autosave": false,
    		            "chat": true,
    		            "comments": true,
    		            "compactHeader": false,
    		            "compactToolbar": false,
    		            "compatibleFeatures": false,
    		            "forcesave": false,
    		            "help": true,
    		            "hideRightMenu": false,
    		            "hideRulers": false,
    		            "macros": false,
    		            "macrosMode": "warn",
    		            "mentionShare": true,
    		            "plugins": false,
    		            "reviewDisplay": "original",
    		            "showReviewChanges": false,
    		            "spellcheck": false,		            
    		            "toolbarHideFileName": false,
    		            "toolbarNoTabs": false,
    		            "trackChanges": false,
    		            "unit": "cm",
    		            "zoom": 100
    		        },
    		    },
    		    "height": "100%",
    		    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M",
    		    "type": "desktop",
    		    "width": "100%"
    		};
        editor = new DocsAPI.DocEditor("placeholder", config);
   	}
</script>