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
    	var docEditor;
	    var docInfo = getDocInfoFromRequestParamStr();	    
	    var fileType = getFileSuffix(docInfo.name);
	    fileType = convertWpsToOfficeType(fileType);
	    var documentType = getDocumentType(fileType);
	    var title = docInfo.name;
	    var key = docInfo.docId + "";
	    var historyList;
	    
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
			
	        var innerAlert = function (message) {
	            if (console && console.log)
	                console.log(message);
	        };
			
	    	var onRequestHistory = function() {
	    	    console.log("onRequestHistory()");
	    	    getOfficeDocHistoryList(docInfo, initOfficeDocHistoryList);
	    	};
	    	
	    	var onRequestHistoryData = function(event) {
	    		console.log("onRequestHistoryData() event:", event);
	    		var version = event.data;
	    		setOfficeDocHistoryData(version);
	    	};
	    	
	    	var onRequestHistoryClose = function (event){
	            document.location.reload();
	        };
	        
	        var onError = function (event) {
	            if (event)
	                innerAlert(event.data);
	        };

	        var onOutdatedVersion = function (event) {
	            location.reload(true);
	        };

	        var replaceActionLink = function(href, linkParam) {
	            var link;
	            var actionIndex = href.indexOf("&action=");
	            if (actionIndex != -1) {
	                var endIndex = href.indexOf("&", actionIndex + "&action=".length);
	                if (endIndex != -1) {
	                    link = href.substring(0, actionIndex) + href.substring(endIndex) + "&action=" + encodeURIComponent(linkParam);
	                } else {
	                    link = href.substring(0, actionIndex) + "&action=" + encodeURIComponent(linkParam);
	                }
	            } else {
	                link = href + "&action=" + encodeURIComponent(linkParam);
	            }
	            return link;
	        }

	        var onMakeActionLink = function (event) {
	            var actionData = event.data;
	            var linkParam = JSON.stringify(actionData);
	            docEditor.setActionLink(replaceActionLink(location.href, linkParam));
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
	    		            "review": true,
	    		            "changeHistory": true
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
	    		    "events": {
	    		    	"onError": onError,
	    		    	"onRequestHistory": onRequestHistory,
	    		        "onRequestHistoryData": onRequestHistoryData,
	    		        "onRequestHistoryClose": onRequestHistoryClose,
	    		        "onOutdatedVersion": onOutdatedVersion,
                        "onMakeActionLink": onMakeActionLink,
	    		    },
	                "height": "100%",
	                "width": "100%",
	    	};
	        docEditor = new DocsAPI.DocEditor("placeholder", config);
	        
	        function getOfficeDocHistoryList(docInfo, successCallback, errorCallback)
	        {	
	        	console.log("getOfficeDocHistoryList()  docInfo:", docInfo);
	            if(!docInfo || docInfo == null || docInfo.id == 0)
	            {
	            	//未定义需要显示的文件
	            	errorInfo = "请选择文件";
	            	errorCallback && errorCallback(errorInfo);
	            	return;
	            }
	          	
	            var url = "/DocSystem/Bussiness/getOfficeDocHistoryList.do"
	            $.ajax({
	                url : url,
	                type : "post",
	                dataType : "json",
	                data : {
	                	reposId: docInfo.vid,
	                    path: docInfo.path,
	                    name: docInfo.name,
	                    shareId: docInfo.shareId,
	                },
	                success : function (ret) {
	                	console.log("getOfficeDocHistoryList ret",ret);
	                	if( "ok" == ret.status )
	                	{
	                		successCallback &&successCallback(ret.data, ret.dataEx);
	                    }
	                    else 
	                    {
	                    	console.log(ret.msgInfo);
	                    	errorInfo = "获取文件信息失败：" + ret.msgInfo;
	                    	errorCallback && errorCallback(errorInfo);
	                    }
	                },
	                error : function () {
	                	errorInfo = "获取文件信息失败：服务器异常";
	                	errorCallback && errorCallback(errorInfo);
	                }
	            });
	        }

	        function initOfficeDocHistoryList(list, dataEx)
	        {
	        	if(list)
	        	{
	        		historyList = [];
	        		for(var i=0; i<list.length; i++)
	        		{
	        			var data = list[i];
	        			var history = {};
	        			history.user = {};
	        			history.user.id = data.useridoriginal;
	        			history.user.name = data.user;
	        			history.key = data.docId;
	        			history.created = data.time;	//不转换直接先用
	        			history.version = i+1;
	        			history.path = dataEx.path;
	        			history.name = dataEx.name;
	        			history.url = buildHistoryUrl(docInfo, history, data.orgChangeIndex);
	        			if(data.orgChangeIndex === undefined)
	        			{
        					//First history have no previous info
        					history.orgChangeIndex = -1;
	        			}
        				else
        				{
	        				history.orgChangeIndex = data.orgChangeIndex;
	        				history.changesUrl = buildChangesUrl(docInfo, history);	        				
	        				history.previous = buildPreviousHistory(docInfo, history);
	        				//update history.key会触发auth，暂时不修改
	        				//history.key = history.key + "_" + history.orgChangeIndex;
	        			}
	        			
	        			console.log("initOfficeDocHistoryList history[" + i + "]", history);
	        			historyList.push(history);
	        		}
	        		
	        		var currentVersion = list.length;
	        		docEditor.refreshHistory({
	        	        "currentVersion": currentVersion,
	        	        "history": historyList
	        	    });
	        	}
	        }
	        
	        function buildPreviousHistory(docInfo, history)
	        {
	        	var previous = {};
				previous.orgChangeIndex = history.orgChangeIndex - 1;
				if(previous.orgChangeIndex < 0)
				{
					previous.key = history.key;
					previous.url = buildHistoryUrl(docInfo, history, -1);
				}
				else
				{
					previous.key = history.key + "_" + previous.orgChangeIndex;
					previous.url = buildHistoryUrl(docInfo, history, previous.orgChangeIndex);
				}
				return previous;
			}
	        
	        function buildHistoryUrl(docInfo, history, orgChangeIndex)
	        {
	        	var url = "/DocSystem/web/static/office-editor/downloadHistory/" 
	        				+ docInfo.vid 
	        				+ "/" + history.path 
	        				+ "/" + history.name 
	        				+ "/" + history.key;
	        	
	        	if(orgChangeIndex  !== undefined)
	        	{
	        		url += "/" + orgChangeIndex;
	        	}
	        	else
	        	{
	        		url += "/-1";
	        	}
	        	
	        	if(docInfo.authCode !== undefined)
	       		{
	        		url += "/" + docInfo.authCode;
	       		}
	       		else
	       		{
	       			url += "/0";
	       		}
	        	
	       		if(docInfo.shareId !== undefined)
	       		{
	       			url +=  "/"  + docInfo.shareId;
	       		}
	       		else
	       		{
	       			url += "/0";
	       		}
	        	
	        	return buildFullLink(url);
	        }
	        
	        function buildChangesUrl(docInfo, history)
	        {
	        	var url = "/DocSystem/web/static/office-editor/downloadHistoryDiff/" 
	        				+ docInfo.vid + "/" + history.path + "/" + history.name 
	        				+ "/" + history.key;
	        	
	        	if(history.orgChangeIndex !== undefined)
	        	{
	        		url += "/" + history.orgChangeIndex;
	        	}
	        	else
	        	{
	        		url += "/-1";;
	        	}
	       		
	        	if(docInfo.authCode !== undefined)
	       		{
	        		url += "/" + docInfo.authCode;
	       		}
	       		else
	       		{
	       			url += "/0";
	       		}
	        	
	       		if(docInfo.shareId !== undefined)
	       		{
	       			url +=  "/"  + docInfo.shareId;
	       		}
	       		else
	       		{
	       			url += "/0";
	       		}
	        	
	        	return buildFullLink(url);
	        }

	        function setOfficeDocHistoryData(version)
	        {
	        	if(historyList)
	        	{
	        		var data = historyList[version-1];
	        		console.log("setOfficeDocHistoryData() data:", data);
	        		docEditor.setHistoryData(data);
	        	}
	        }	        
	   	}
    </script>
</body>
</html>