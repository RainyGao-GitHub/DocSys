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
    		        "info": {
    		            "favorite": true,
    		            "folder": "Example Files",
    		            "owner": "John Smith",
    		            "sharingSettings": [
    		                {
    		                    "permissions": "Full Access",
    		                    "user": "John Smith"
    		                },
    		                {
    		                    "isLink": true,
    		                    "permissions": "Read Only",
    		                    "user": "External link"
    		                },
    		                ...
    		            ],
    		            "uploaded": "2010-07-07 3:46 PM"
    		        },
    		        "key": key,
    		        "permissions": {
    		            "comment": true,
    		            "copy": true,
    		            "deleteCommentAuthorOnly": false,
    		            "download": true,
    		            "edit": true,
    		            "editCommentAuthorOnly": false,
    		            "fillForms": true,
    		            "modifyContentControl": true,
    		            "modifyFilter": true,
    		            "print": true,
    		            "review": true,
    		            "reviewGroups": ["Group1", "Group2", ""]
    		        },
    		        "title": title,
    		        "url": fileLink
    		    },
    		    "documentType": documentType,
    		    "editorConfig": {
    		        "actionLink": ACTION_DATA,
    		        "callbackUrl": saveFileLink,
    		        "customization": {
    		            "anonymous": {
    		                "request": true,
    		                "label": "Guest"
    		            },
    		            "autosave": true,
    		            "chat": true,
    		            "comments": true,
    		            "compactHeader": false,
    		            "compactToolbar": false,
    		            "compatibleFeatures": false,
    		            "customer": {
    		                "address": "My City, 123a-45",
    		                "info": "Some additional information",
    		                "logo": "https://example.com/logo-big.png",
    		                "mail": "john@example.com",
    		                "name": "John Smith and Co.",
    		                "www": "example.com"
    		            },
    		            "feedback": {
    		                "url": "https://example.com",
    		                "visible": true
    		            },
    		            "forcesave": false,
    		            "goback": {
    		                "blank": true,
    		                "requestClose": false,
    		                "text": "Open file location",
    		                "url": "https://example.com"
    		            },
    		            "help": true,
    		            "hideRightMenu": false,
    		            "hideRulers": false,
    		            "logo": {
    		                "image": "https://example.com/logo.png",
    		                "imageEmbedded": "https://example.com/logo_em.png",
    		                "url": "https://example.com"
    		            },
    		            "macros": true,
    		            "macrosMode": "warn",
    		            "mentionShare": true,
    		            "plugins": true,
    		            "reviewDisplay": "original",
    		            "showReviewChanges": false,
    		            "spellcheck": true,
    		            
    		            "toolbarHideFileName": false,
    		            "toolbarNoTabs": false,
    		            "trackChanges": false,
    		            "unit": "cm",
    		            "zoom": 100
    		        },
    		        "embedded": {
    		            "embedUrl": "https://example.com/embedded?doc=exampledocument1.docx",
    		            "fullscreenUrl": "https://example.com/embedded?doc=exampledocument1.docx#fullscreen",
    		            "saveUrl": "https://example.com/download?doc=exampledocument1.docx",
    		            "shareUrl": "https://example.com/view?doc=exampledocument1.docx",
    		            "toolbarDocked": "top"
    		        },
    		        "lang": "en",
    		        "location": "us",
    		        "mode": "edit",
    		        "plugins": {
    		             "autostart": [
    		                 "asc.{0616AE85-5DBE-4B6B-A0A9-455C4F1503AD}",
    		                 "asc.{FFE1F462-1EA2-4391-990D-4CC84940B754}",
    		                 ...
    		             ],
    		             "pluginsData": [
    		                 "https://example.com/plugin1/config.json",
    		                 "https://example.com/plugin2/config.json",
    		                 ...
    		             ]
    		        },
    		        "recent": [
    		            {
    		                "folder": "Example Files",
    		                "title": "exampledocument1.docx",
    		                "url": "https://example.com/exampledocument1.docx"
    		            },
    		            {
    		                "folder": "Example Files",
    		                "title": "exampledocument2.docx",
    		                "url": "https://example.com/exampledocument2.docx"
    		            },
    		            ...
    		        ],
    		        "region": "en-US",
    		        "templates": [
    		            {
    		                "image": "https://example.com/exampletemplate1.png",
    		                "title": "exampletemplate1.docx",
    		                "url": "https://example.com/url-to-create-template1"
    		            },
    		            {
    		                "image": "https://example.com/exampletemplate2.png",
    		                "title": "exampletemplate2.docx",
    		                "url": "https://example.com/url-to-create-template2"
    		            },
    		            ...
    		        ],
    		        "user": {
    		            "group": "Group1",
    		            "id": "78e1e841",
    		            "name": "John Smith"
    		        }
    		    },
    		    "events": {
    		        "onAppReady": onAppReady,
    		        "onCollaborativeChanges": onCollaborativeChanges,
    		        "onDocumentReady": onDocumentReady,
    		        "onDocumentStateChange": onDocumentStateChange,
    		        "onDownloadAs": onDownloadAs,
    		        "onError": onError,
    		        "onInfo": onInfo,
    		        "onMetaChange": onMetaChange,
    		        "onOutdatedVersion": onOutdatedVersion,
    		        "onRequestClose": onRequestClose,
    		        "onRequestCompareFile": onRequestCompareFile,
    		        "onRequestCreateNew": onRequestCreateNew,
    		        "onRequestEditRights": onRequestEditRights,
    		        "onRequestHistory": onRequestHistory,
    		        "onRequestHistoryClose": onRequestHistoryClose,
    		        "onRequestHistoryData": onRequestHistoryData,
    		        "onRequestInsertImage": onRequestInsertImage,
    		        "onRequestMailMergeRecipients": onRequestMailMergeRecipients,
    		        "onRequestRename": onRequestRename,
    		        "onRequestRestore": onRequestRestore,
    		        "onRequestSaveAs": onRequestSaveAs,
    		        "onRequestSendNotify": onRequestSendNotify,
    		        "onRequestSharingSettings": onRequestSaveAs,
    		        "onRequestUsers": onRequestUsers,
    		        "onWarning": onWarning
    		    },
    		    "height": "100%",
    		    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-IDcSemACt8x4iTMCda8Yhe3iZaWbvV5XKSTbuAn0M",
    		    "type": "desktop",
    		    "width": "100%"
    		};
        editor = new DocsAPI.DocEditor("placeholder", config);
   	}
</script>