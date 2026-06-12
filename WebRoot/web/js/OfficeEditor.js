//OfficeEditor类
var OfficeEditor = (function () {	
	var docEditor;
    var docInfo;
    var fileType;
    var documentType;
    var title;
    var dockey;
    var historyList;
    var historyData;
    var isExternalOffice = false;
    var lang = "zh-CN";
    
    //set_language
    function set_language(langType)
    {
//    	语言代码 对应语言
//    	en 		英语（默认）
//    	zh-CN 	简体中文
//    	zh-TW 	繁体中文（台湾）
//    	ru		俄语
//    	es		西班牙语
//    	fr		法语
//    	de		德语
//    	ja		日语
//    	ko		韩语
//    	it		意大利语
//    	pt-BR	巴西葡萄牙语
//    	pt-PT	葡萄牙语（葡萄牙）
//    	nl		荷兰语
//    	sv		瑞典语
//    	pl		波兰语
//    	tr		土耳其语
//    	ar		阿拉伯语（从右到左布局）
//    	hi		印地语
//    	th		泰语
//    	vi		越南语
    	//目前暂时不考虑支持其他语言
	    if(langType !== undefined)
	    {
	    	switch(langType)
	    	{
	    	case "ch":
	    	case "zh-CN":
	    		lang = "zh-CN";
	    		break;
	    	case "en":
	    		lang = "en";
	    		break;
	    	default:
	    		lang = "zh-CN";	//默认中文
	    		break;
	    	}
	    }   
		console.log("set_language() langType:" + langType + " lang:" + lang);
    }
    
	//For ArtDialog
	function initForArtDialog() 
	{
	    var params = GetRequest();
	    var docid = params['docid'];
	    	
	    //获取artDialog父窗口传递过来的参数
	    var artDialog2 = window.top.artDialogList['ArtDialog'+docid];
	    if (artDialog2 == null) {
	        artDialog2 = window.parent.artDialogList['ArtDialog' + docid];
	    }
	    
	    // 获取对话框传递过来的数据
	    docInfo = artDialog2.config.data;
		console.log("docInfo:",docInfo);
		
	    set_language(docInfo.langType); //设置语言
		
		init();
	}
	
	//For NewPage
	function initForNewPage()
	{
	    docInfo = getDocInfoFromRequestParamStr();	    
	 
	    set_language(getQueryString("langType"));
	    
	    init();
	}
	
	//For BootstrapDialog
	function PageInit(Input_doc, Input_langType)
	{
		console.log("PageInit InputDoc:", Input_doc);
		docInfo = Input_doc;
		
		set_language(Input_langType);
		
		init();
	}	

	function init()
	{
		console.log("officeEditorType:", officeEditorType);
		isExternalOffice = officeEditorType == undefined? false : (officeEditorType == 1);
		if(isExternalOffice == true)
		{
			if(isLocalhostAccess() == true)
			{
				alert("禁止localhost访问，请使用IP地址或域名访问!");
				return;
			}
		}
		console.log("isExternalOffice:", isExternalOffice);
		
	    fileType = getFileSuffix(docInfo.name);
	    fileType = convertWpsToOfficeType(fileType);
	    documentType = getDocumentType(fileType);
	    title = docInfo.name;
	    dockey = docInfo.docId + "";
	
	    getDocOfficeLink(docInfo, showOffice, showErrorMessage, "REST", 1);
	    document.title = docInfo.name;
	}    
	
	function isLocalhostAccess()
	{
		if(window.location.hostname=="127.0.0.1" || window.location.hostname=="localhost")
		{
			return true;
		}
		return false;
	}
	
    function GetRequest() {
        var url = location.search; //获取url中"?"符后的字串
        var theRequest = {};
        if (url.indexOf("?") !== -1) {
            var str = url.substr(1);
            var strs = str.split("&");
            for(var i = 0; i < strs.length; i ++) {
                theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
            }
        }
        return theRequest;
    }
    
    function showOffice(data)
   	{
		var fileLink = buildFullLink(data.fileLink);
		var saveFileLink = "";
		dockey = data.key + "";	//key是用来标志唯一性的，文件改动了key也必须改动
		
    	console.log("showOffice() title=" + title + " dockey=" + dockey + " fileType=" + fileType + " documentType=" + documentType + " fileLink="+fileLink + " saveFileLink:" + saveFileLink);
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
		
		var userName = data.realName;
		if(userName == undefined || userName == "")
		{
			userName = data.userName;
		}
		var user = {
            "id": data.userId + "",
            "name": userName,
        };
		
        var innerAlert = function (message) {
            if (console && console.log)
                console.log(message);
        };
		
    	var onRequestHistory = function() {
    	    console.log("onRequestHistory()");
    	    if(isExternalOffice)
    	    {
    	    	return;
    	    }
    	    getOfficeDocHistoryList(docInfo, initOfficeDocHistoryList);
    	};
    	
    	var onRequestHistoryData = function(event) {
    		console.log("onRequestHistoryData() event:", event);
    	    if(isExternalOffice)
    	    {
    	    	return;
    	    }

    		var version = event.data;
    		setOfficeDocHistoryData(version);
    	};
    	
    	var onRequestHistoryClose = function (event){
    		innerAlert("onRequestHistoryClose() event:", event);
            document.location.reload();
        };
        
        var onError = function (event) {
            var errorCode = -1;
            var errorDesc = "未知错误";
            if (event && event.data) {
                errorCode = event.data.errorCode;
                errorDesc = event.data.errorDescription;
            }
            innerAlert("onError() errorCode:" + errorCode + " errorDesc:" + errorDesc, event);
            
            //清除缓存标志，避免重复弹窗
            if(window._officeEditCacheClearFlag === true)
            {
            	return;
            }
            window._officeEditCacheClearFlag = true;
            
            //Office编辑器加载出错时，给用户提供清除缓存的选择
            {
            	var msg = "Office编辑器加载失败（errorCode=" + errorCode + "），是否清除缓存后重试？\n（清除缓存会重新生成编辑器数据，可能解决文件打开异常问题）";
            	if(confirm(msg))
            	{
            		$.ajax({
            			url : "/DocSystem/Doc/clearOfficeEditCache.do",
            			type : "post",
            			dataType : "json",
            			data : {
            				reposId: docInfo.vid,
            				path: docInfo.path,
            				name: docInfo.name,
            				shareId: docInfo.shareId
            			},
            			success : function (ret) {
            				if("ok" == ret.status)
            				{
            					location.reload(true);
            				}
            				else
            				{
            					alert("清除缓存失败：" + (ret.msgInfo || "未知错误"));
            				}
            			},
            			error : function () {
            				alert("清除缓存失败：服务器异常");
            			}
            		});
            	}
            }
        };

        var onOutdatedVersion = function (event) {
        	innerAlert("onOutdatedVersion() event:", event);
        	//reload will trigger state change loop
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
        	innerAlert("onMakeActionLink() event:", event);
            var actionData = event.data;
            var linkParam = JSON.stringify(actionData);
            docEditor.setActionLink(replaceActionLink(location.href, linkParam));
        };
		
    	var config = {
				"type": type,
    		    "document": {
    		        "fileType": fileType,
    		        "key": dockey,
    		        "title": title,
    		        "url": fileLink,
    		        "permissions": {
    		            "comment": editEn,
    		            "download": downloadEn,
    		            "edit": editEn,
    		            "copy": editEn,
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
                    "lang": lang,
                    "user": user,
                    "spellcheck": false,
                    "customization": {
                        "logo": {
                            "image": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4NiIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzMzMyI+TVhTRE9DPC90ZXh0Pjwvc3ZnPg==",
                            "imageDark": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4NiIgaGVpZ2h0PSIyMCI+PHRleHQgeD0iMCIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCxzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2NjYyI+TVhTRE9DPC90ZXh0Pjwvc3ZnPg==",
                            "url": "http://dw.gofreeteam.com"
                        },
                        "help": false,
                        "customer": {
                            "name": "杭州圆图网络技术有限公司",
                            "address": "杭州市滨江区信诚路857号",
                            "mail": "652055239@qq.com",
                            "www": "dw.gofreeteam.com",
                            "phone": "+86 13777479349",
                            "logo": ""
                        }
                    }
                },
    		    "events": {
    		    	"onError": onError,
    		    	"onRequestHistory": onRequestHistory,
    		        "onRequestHistoryData": onRequestHistoryData,
    		        "onRequestHistoryClose": onRequestHistoryClose,
    		        //"onOutdatedVersion": onOutdatedVersion,
                    //"onMakeActionLink": onMakeActionLink,
    		    },
                "height": "100%",
                "width": "100%",
    	};
		console.log("showOffice() config:", config);
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
          	
            var url = "/DocSystem/web/static/office-editor/getOfficeDocHistoryList.do"
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
        		historyData = [];
        		var version = 1;
        		var history;
        		var historyInfo;
        		var preHistoryInfo;
        		
        		for(var i=0; i<list.length; i++)
        		{
        			console.log("initOfficeDocHistoryList() version:" + version);

        			var data = list[i];
        			var created = formatTime(data.time);
        			var user = {};
        			user.id = data.useridoriginal;
        			user.name = data.userName !== undefined ? data.userName:data.user;
        			
        			if(data.orgChangeIndex === undefined)
        			{
             			history = {};
            			historyInfo = {};

    					history.orgChangeIndex = -1;

            			history.path = dataEx.path;
            			history.name = dataEx.name;

    					//Build historyList Item
        				history.changes = null;
                		history.key = data.docId;
                		history.version = version;
                		history.created = created;
                		history.user = user;
                		
                		//Build historyData Item
                		historyInfo.version = version;
                		historyInfo.key = data.docId;
                		historyInfo.url = buildHistoryUrl(docInfo, history, data.orgChangeIndex);
                		
            			historyList.push(history);
            			historyData.push(historyInfo);
            			preHistoryInfo = historyInfo;
            			version++;
        			}
        			else 
        			{
        				if(data.orgChangeIndex == 0)
        				{
            				history = {};
                			historyInfo = {};
                			
                			history.orgChangeIndex = data.orgChangeIndex;
            					
                			history.path = dataEx.path;
                			history.name = dataEx.name;

        					//Build historyList Item
        					history.serverVersion = dataEx.serverVersion;
            				history.changes = [];
        					history.key = data.docId;
                    		history.version = version;
                    		history.created = created;
                    		history.user = user;
                    		
                    		//Build historyData Item
                    		historyInfo.version = version;
                    		historyInfo.key = data.docId;
                    		historyInfo.url = buildHistoryUrl(docInfo, history, data.orgChangeIndex);
                    		if(preHistoryInfo !== undefined)
                    		{
                    			var previous = {};
                    			previous.key = preHistoryInfo.key;
                    			previous.url = preHistoryInfo.url;
                    			historyInfo.previous = previous;
                    		}
                    		historyInfo.changesUrl = buildChangesUrl(docInfo, history);

                    		historyList.push(history);
                			historyData.push(historyInfo);
                			preHistoryInfo = historyInfo;
                			version++;
        				}
        				
        				var change = {};
        				change.created = created;
        				change.user = user;
        				history.changes.push(change);        				
        			}        			
        		}
        		
    			console.log("initOfficeDocHistoryList historyList", historyList);
    			console.log("initOfficeDocHistoryList historyData", historyData);
        		
        		var currentVersion = historyList.length;
        		docEditor.refreshHistory({
        	        "currentVersion": currentVersion,
        	        "history": historyList
        	    });
        	}
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
        	if(historyData)
        	{
        		var data = historyData[version-1];
        		console.log("setOfficeDocHistoryData() data:", data);
        		docEditor.setHistoryData(data);
        	}
        }	        
   	}
	
 	function formatTime(time){
 		var now = new Date(time);
 		var year=now.getFullYear();
 		var month=now.getMonth()+1;
 		var date=now.getDate();
 		var hh=now.getHours();
 		var mm=now.getMinutes();
 		var ss=now.getSeconds();

 		return year+"-"+month+"-"+date + " " + hh+":"+mm+":"+ss;
 	}
	
	//开放给外部的调用接口
	return {
		initForArtDialog: function(){
			initForArtDialog();
	    },
	    initForNewPage: function(){
	    	initForNewPage();
	    },
	    PageInit: function(docInfo){
        	PageInit(docInfo);
        },
	};
})();