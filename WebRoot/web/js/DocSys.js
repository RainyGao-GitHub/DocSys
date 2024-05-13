/*
 ** 文件内容获取接口 **
 ** 文件链接获取接口 **
 ** 文件尾缀获取与文件类型判断接口 **
 ** 对话框操作接口 **
 ** 提示对话框接口 **
 * */

var gIsPC = isPC();
function isPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone",
                "SymbianOS", "Windows Phone",
                "iPad", "iPod"];

    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            return false;
        }
    }
   	return true;
}

function isWeiXin(){ 
    var ua = navigator.userAgent.toLowerCase(); 
    if(ua.indexOf('micromessenger') != -1) { 
        return true; 
    } else { 
        return false; 
    } 
}

//语言获取接口
function getBrowserLang() 
{
	var language = "ch";

	var userLanguage = getCookie("UserLanguage");
	if(userLanguage == undefined || userLanguage == "")
	{
		language = navigator.language;
		console.log("getBrowserLang() navigator.language:" + language);		
	}
	else
	{
		language = userLanguage;
		console.log("getBrowserLang() userLanguage:" + language);				
	}
	
	if(language == undefined)
	{
		return "ch";
	}
	
	switch(language.toLowerCase())
	{
	case "us":
	case "en":
	case "en_us":
		return "en";
    case "zh-tw":
    case "zh-hk":
    case "zh-cn":
    	return "ch";
    default:
        break;
	}
	return "ch";
}
    
//构造 buildRequestParamStrForDoc 和 getDocInfoFromRequestParamStr 需要成对使用，用于前端页面之间传递参数
//如果是传给后台的url需要用base64_urlsafe_encode
function buildRequestParamStrForDoc(docInfo)
{
	if(!docInfo)
	{
		return "";
	}
	
	var urlParamStr = "";
	var andFlag = "";
	if(docInfo.vid)
	{
		urlParamStr = "reposId=" + docInfo.vid;
		andFlag = "&";
	}

	if(docInfo.docId)
	{
		urlParamStr += andFlag + "docId=" + docInfo.docId;
		andFlag = "&";
	}
	
	if(docInfo.path)
	{
		urlParamStr += andFlag + "path=" + base64_encode(docInfo.path);
		andFlag = "&";
	}
	
	if(docInfo.name)
	{
		urlParamStr += andFlag + "name=" + base64_encode(docInfo.name);
		andFlag = "&";
	}
	
	if(docInfo.docType)
	{
		urlParamStr += andFlag + "docType=" + base64_encode(docInfo.docType);
		andFlag = "&";	
	}
	
	if(docInfo.isZip)
	{
		urlParamStr += andFlag + "isZip=" + docInfo.isZip;
		andFlag = "&";		
		if(docInfo.rootPath)
		{
			urlParamStr += andFlag + "rootPath=" + base64_encode(docInfo.path);
			andFlag = "&";
		}
		
		if(docInfo.rootName)
		{
			urlParamStr += andFlag + "rootName=" + base64_encode(docInfo.name);
			andFlag = "&";
		}
	}
	
	if(docInfo.isHistory)
	{
		urlParamStr += andFlag + "isHistory=" + docInfo.isHistory;
		andFlag = "&";		
		if(docInfo.commitId)
		{
			urlParamStr += andFlag + "commitId=" + docInfo.commitId;
			andFlag = "&";		
		}
		if(docInfo.historyType)
		{
			urlParamStr += andFlag + "historyType=" + docInfo.historyType;
			andFlag = "&";		
		}
		if(docInfo.needDeletedEntry)
		{
			urlParamStr += andFlag + "needDeletedEntry=" + docInfo.needDeletedEntry;
			andFlag = "&";					
		}
	}
	
	if(docInfo.fileLink)
	{
		urlParamStr += andFlag + "fileLink=" + docInfo.fileLink;
		andFlag = "&";
	}
	
	if(docInfo.shareId)
	{
		urlParamStr += andFlag + "shareId=" + docInfo.shareId;
		andFlag = "&";
	}
	
	return urlParamStr;
}

function getDocInfoFromRequestParamStr()
{
	var docInfo = {};

	var reposId = getQueryString("reposId");
	if(reposId && reposId != null)
	{
		docInfo.vid = reposId;
	}
	
	var docId = getQueryString("docId");
	if(docId && docId != null)
	{
		docInfo.docId = docId;
	}
	
	var path = getQueryString("path");
	if(path && path != null)
	{
		path = base64_decode(path);
	}
	else
	{
		path = "";
	}
	docInfo.path = path;

		
	var name = getQueryString("name");
	if(name && name != null)
	{
		name = base64_decode(name);
	}
	else
	{
		name = "";
	}
	docInfo.name = name;
	
	var docType = getQueryString("docType");
	if(docType && docType != null)
	{
		docInfo.docType = docType;
	}
	
	var isZip = getQueryString("isZip");
	if(isZip && isZip != null)
	{
		docInfo.isZip = isZip;
		var rootPath = getQueryString("rootPath");
		if(rootPath && rootPath != null)
		{
			rootPath = base64_decode(rootPath);
			docInfo.rootPath = rootPath;
		}

		var rootName = getQueryString("rootName");
		if(rootName && rootName != null)
		{
			rootName = base64_decode(rootName);
			docInfo.rootName = rootName;
		}
	}
	
	var isHistory = getQueryString("isHistory");
	if(isHistory && isHistory != null)
	{
		docInfo.isHistory = isHistory;
		var commitId = getQueryString("commitId");
		if(commitId && commitId != null)
		{
			docInfo.commitId = commitId;
		}
		
		var historyType = getQueryString("historyType");
		if(historyType && historyType != null)
		{
			docInfo.historyType = historyType;
		}

		var needDeletedEntry = getQueryString("needDeletedEntry");
		if(needDeletedEntry && needDeletedEntry != null)
		{
			docInfo.needDeletedEntry = needDeletedEntry;
		}
	}
	
	var shareId = getQueryString("shareId");
	if(shareId && shareId != null)
	{
		docInfo.shareId = shareId;
	}
	return docInfo;
}

//获取文件访问链接
function getDocFileLink(docInfo, successCallback, errorCallback, urlStyle)
{
	if(docInfo.isZip && docInfo.isZip == 1)
	{
		getZipDocFileLink(docInfo, successCallback, errorCallback, urlStyle, 0);
	}
	else
	{
		getDocFileLinkBasic(docInfo, successCallback, errorCallback, urlStyle, 0);
	}
}

function getDocFileLinkForPreview(docInfo, successCallback, errorCallback, urlStyle)
{
	//set videoConvertType
	docInfo.videoConvertType = getVideoConvert(docInfo.fileSuffix);
	
	if(docInfo.isZip && docInfo.isZip == 1)
	{
		getZipDocFileLink(docInfo, successCallback, errorCallback, urlStyle, 1);
	}
	else
	{
		getDocFileLinkBasic(docInfo, successCallback, errorCallback, urlStyle, 1);
	}
}

function getDocFileLinkBasic(docInfo, successCallback, errorCallback, urlStyle, forPreview)
{	
	var fileLink = "";
	var errorInfo = "";
	console.log("getDocFileLinkBasic()  docInfo:", docInfo);
    if(!docInfo || docInfo == null || docInfo.id == 0)
    {
    	//未定义需要显示的文件
    	errorInfo = "请选择文件";
    	errorCallback && errorCallback(errorInfo);
    	return;
    }
    
    if(forPreview == undefined)
    {
    	forPreview = 0;
    }
  	
	$.ajax({
        url : "/DocSystem/Doc/getDocFileLink.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: docInfo.vid,
            path: docInfo.path,
            name: docInfo.name,
            commitId: docInfo.commitId,
            historyType: docInfo.historyType,
            shareId: docInfo.shareId,
            urlStyle: urlStyle,
            forPreview: forPreview,
            videoConvertType: docInfo.videoConvertType,
        },
        success : function (ret) {
        	console.log("getDocFileLinkBasic ret",ret);
        	if( "ok" == ret.status )
        	{
        		var docLink = ret.data;
        		var fileLink = buildFullLink(docLink);
        		successCallback &&successCallback(fileLink);
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

//获取压缩文件的文件链接接口
function getZipDocFileLink(docInfo, successCallback, errorCallback, urlStyle, forPreview)
{	
	var fileLink = "";
	var errorInfo = "";
	console.log("getZipDocFileLink()  docInfo:", docInfo);
    if(!docInfo || docInfo == null || docInfo.id == 0)
    {
    	//未定义需要显示的文件
    	errorInfo = "请选择文件";
    	errorCallback && errorCallback(errorInfo);
    	return;
    }
    
    if(forPreview == undefined)
    {
    	forPreview = 0;
    }
  	
	$.ajax({
        url : "/DocSystem/Doc/getZipDocFileLink.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: docInfo.vid,
            path: docInfo.path,
            name: docInfo.name,
            isZip: docInfo.isZip,
            rootPath: docInfo.rootPath,
            rootName: docInfo.rootName,
            shareId: docInfo.shareId,
            urlStyle: urlStyle,
            forPreview: forPreview,
            videoConvertType: docInfo.videoConvertType,
        },
        success : function (ret) {
        	console.log("getZipDocFileLink ret",ret);
        	if( "ok" == ret.status )
        	{
        		var docLink = ret.data;
        		var fileLink = buildFullLink(docLink);
        		successCallback &&successCallback(fileLink);
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

//获取文件预览或编辑链接For Office File
function getDocOfficeLink(docInfo, successCallback, errorCallback, urlStyle, isBussiness)
{
	console.log("getDocOfficeLink() isBussiness:" + isBussiness);
	if(docInfo.isZip && docInfo.isZip == 1)
	{
		getZipDocOfficeLink(docInfo, successCallback, errorCallback, urlStyle, isBussiness);
	}
	else
	{
		getDocOfficeLinkBasic(docInfo, successCallback, errorCallback, urlStyle, isBussiness);
	}
}

function getDocOfficeLinkBasic(docInfo, successCallback, errorCallback, urlStyle, isBussiness)
{	
	var fileLink = "";
	var errorInfo = "";
	console.log("getDocOfficeLinkBasic()  docInfo:", docInfo);
    if(!docInfo || docInfo == null || docInfo.id == 0)
    {
    	//未定义需要显示的文件
    	errorInfo = "请选择文件";
    	errorCallback && errorCallback(errorInfo);
    	return;
    }
  	
    var url = "/DocSystem/Bussiness/getDocOfficeLink.do"
    $.ajax({
        url : url,
        type : "post",
        dataType : "json",
        data : {
        	reposId: docInfo.vid,
            path: docInfo.path,
            name: docInfo.name,
            commitId: docInfo.commitId,
            historyType: docInfo.historyType,
            isZip: docInfo.isZip,
            rootPath: docInfo.rootPath,
            rootName: docInfo.rootName,
            shareId: docInfo.shareId,
            preview: "office",
            urlStyle: urlStyle,
        },
        success : function (ret) {
        	console.log("getDocOfficeLinkBasic ret",ret);
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

//获取压缩文件的文件链接接口(链接带officeEditorAuthCode)
function getZipDocOfficeLink(docInfo, successCallback, errorCallback, urlStyle, isBussiness)
{	
	var fileLink = "";
	var errorInfo = "";
	console.log("getZipDocOfficeLink()  docInfo:", docInfo);
    if(!docInfo || docInfo == null || docInfo.id == 0)
    {
    	//未定义需要显示的文件
    	errorInfo = "请选择文件";
    	errorCallback && errorCallback(errorInfo);
    	return;
    }
  	
    var url = "/DocSystem/Bussiness/getZipDocOfficeLink.do";
	$.ajax({
        url : url,
        type : "post",
        dataType : "json",
        data : {
        	reposId: docInfo.vid,
            path: docInfo.path,
            name: docInfo.name,
            isZip: docInfo.isZip,
            rootPath: docInfo.rootPath,
            rootName: docInfo.rootName,
            shareId: docInfo.shareId,
            preview: "office",
            urlStyle: urlStyle,
        },
        success : function (ret) {
        	console.log("getZipDocOfficeLink ret",ret);
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

//文件文本内容获取接口
function getDocText(docInfo, successCallback, errorCallback)
{
	console.log("getDocText()");
	if(docInfo.isZip && docInfo.isZip == 1)
	{
		getZipDocText(docInfo, successCallback, errorCallback);
	}
	else
	{
		getDocTextBasic(docInfo, successCallback, errorCallback)
	}	
}

function getDocTextBasic(docInfo, successCallback, errorCallback)
{
	var docText = "";
	var tmpSavedDocText = "";
	var errorInfo = "";
	console.log("getDocTextBasic()  docInfo:", docInfo);
    if(!docInfo || docInfo == null || docInfo.id == 0)
    {
    	//未定义需要显示的文件
    	errorInfo = _Lang("请选择文件");
    	errorCallback && errorCallback(errorInfo, docInfo);
    	return;
    }
      	
    $.ajax({
           url : "/DocSystem/Doc/getDocContent.do",
           type : "post",
           dataType : "text",
           data : {
            	reposId: docInfo.vid,
                path: docInfo.path,
                name: docInfo.name,
                docType: docInfo.docType, //取回文件内容
                commitId: docInfo.commitId,
                historyType: docInfo.historyType,
                needDeletedEntry: docInfo.needDeletedEntry,
                shareId: docInfo.shareId,
            },
            success : function (ret1) {
            	//console.log("getDocText ret1",ret1);
            	var status = ret1.substring(0,2);
            	if("ok" == status)
            	{
	            	docText = ret1.substring(2);
	            	//console.log("getDocText docText",docText);
	            	if(docInfo.isHistory && docInfo.isHistory == 1)
	            	{
	            		successCallback &&successCallback(docText, "", docInfo);
	            	}
	            	else
	            	{
		            	//Try to get tmpSavedDocContent
		            	$.ajax({
		            	           url : "/DocSystem/Doc/getTmpSavedDocContent.do",
		            	           type : "post",
		            	           dataType : "text",
		            	           data : {
		            	            	reposId: docInfo.vid,
		            	                docId : docInfo.id,
		            	                pid: docInfo.pid,
		            	                path: docInfo.path,
		            	                name: docInfo.name,
		            	                docType: docInfo.docType, //取回文件内容
		            	                shareId: docInfo.shareId,
		            	            },
		            	            success : function (ret2) {
		            	            	//console.log("getDocText ret2",ret2);
		            	            	tmpSavedDocText = ret2;
		            	            	successCallback &&successCallback(docText, tmpSavedDocText, docInfo);
		            	            },
		            	            error : function () {	            	            	
		            	            	successCallback &&successCallback(docText, tmpSavedDocText, docInfo);
	
		            	            	errorInfo = _Lang("临时保存文件内容获取失败", ":", "服务器异常");
		            	            	errorCallback && errorCallback(errorInfo, docInfo);
		            	            }
		            	        });
	            	}
            	}
            	else
            	{
            		errorInfo = _Lang("获取文件内容失败", ":" ,ret1);
            		errorCallback && errorCallback(errorInfo, docInfo);
            	}
            },
            error : function () {
            	errorInfo = _Lang("获取文件内容失败", ":", "服务器异常");
        		errorCallback && errorCallback(errorInfo, docInfo);
            }
        });
}

//压缩文件中的文件文本内容获取接口
function getZipDocText(docInfo, successCallback, errorCallback)
{
	var docText = "";
	var tmpSavedDocText = "";
	var errorInfo = "";
	console.log("getZipDocText()  docInfo:", docInfo);
    if(!docInfo || docInfo == null || docInfo.id == 0)
    {
    	//未定义需要显示的文件
    	errorInfo = _Lang("请选择文件");
    	errorCallback && errorCallback(errorInfo, docInfo);
    	return;
    }
      	
    $.ajax({
           url : "/DocSystem/Doc/getZipDocContent.do",
           type : "post",
           dataType : "text",
           data : {
            	reposId: docInfo.vid,
                docId : docInfo.id,
                pid: docInfo.pid,
                path: docInfo.path,
                name: docInfo.name,
                rootPath: docInfo.rootPath, //压缩文件的路径
                rootName: docInfo.rootName, //压缩文件名
                docType: 1, //取回文件内容
                shareId: docInfo.shareId,
            },
            success : function (ret1) {
            	//console.log("getDocText ret1",ret1);
            	var status = ret1.substring(0,2);
            	if("ok" == status)
            	{
	            	docText = ret1.substring(2);
	            	//console.log("getDocText docText",docText);
	            	successCallback &&successCallback(docText, "", docInfo);
            	}
            	else
            	{
            		errorInfo = _Lang("获取文件内容失败", ":", ret1);
            		errorCallback && errorCallback(errorInfo, docInfo);
            	}
            },
            error : function () {
            	errorInfo = _Lang("获取文件内容失败", ":", "服务器异常");
        		errorCallback && errorCallback(errorInfo, docInfo);
            }
        });
}

//文件链接获取接口
function buildFullLink(docLink)
{
	if(docLink == null)
	{
		return null;
	}
	
	var protocol = window.location.protocol + '//';
	var host = window.location.host; //域名带端口  
 	var url = protocol + host + docLink;
 	console.log("buildFullLink() url:" + url);
 	return url;
}

function getDocLink(doc)
{
	var link = "/DocSystem/web/project.html?vid="+doc.vid+"&doc="+doc.docId;
	if(doc.path && doc.path != "")
	{
		link += "&path=" + base64_encode(doc.path);
	}
	if(doc.name && doc.name != "")
	{
		link += "&name=" + base64_encode(doc.name);
	}
	return link;
}

function getDocShareLink(reposId, docShare, IpAddress)
{
	var href = "/DocSystem/web/project" + langExt + ".html?vid="+ reposId + "&shareId=" + docShare.shareId;        			
 	console.log(href);
	
	var protocol = window.location.protocol + '//';
 	var host = window.location.hostname; //域名不带端口       	 		
 	if(host == "localhost" && IpAddress && IpAddress != "")
 	{
 		host = 	IpAddress;
 	}
 		
 	var port = window.location.port;
 	if(port && port != "")
 	{
 		host += ":" + port;
 	}
 		
 	var url = protocol + host + href;
 	return url;
}

function buildDocDownloadLink(downloadDocInfo, urlStyle)
{	
	console.log("buildDocDownloadLink downloadDocInfo:", downloadDocInfo);
	var name = encodeURI(downloadDocInfo.name);
   	var path = encodeURI(downloadDocInfo.path);
   	var targetName = encodeURI(downloadDocInfo.targetName);
   	var targetPath = encodeURI(downloadDocInfo.targetPath);
   	
   	if(urlStyle && urlStyle == "REST")
   	{
   		var docRestLink =  "/DocSystem/Doc/downloadDoc/" + downloadDocInfo.vid + "/" + path + "/" + name + "/" +targetPath+ "/"+targetName;
   		if(downloadDocInfo.authCode)
   		{
   			docRestLink += "/" + downloadDocInfo.authCode;
   		}
   		else
   		{
   			docRestLink += "/0";
   		}
   		if(downloadDocInfo.shareId)
   		{
   			docRestLink +=  "/"  + downloadDocInfo.shareId;
   		}
   		else
   		{
   			docRestLink += "/0";
   		}
   		if(downloadDocInfo.encryptEn)
   		{
   			docRestLink +=  "/"  + downloadDocInfo.encryptEn;
   		}
   		else
   		{
   			docRestLink += "/0";   			
   		}
   		
   		return docRestLink;
   	}
   	
	var docLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDocInfo.vid + "&path=" + path + "&name=" + name + "&targetPath=" + targetPath + "&targetName=" + targetName;
	if(downloadDocInfo.authCode)
   	{
		docLink += "&authCode=" + downloadDocInfo.authCode;
   	}
	if(downloadDocInfo.shareId)
	{
		docLink += "&shareId="+downloadDocInfo.shareId;
	}
	if(downloadDocInfo.deleteFlag)
	{
		docLink += "&deleteFlag="+ downloadDocInfo.deleteFlag;	
	}
	if(downloadDocInfo.encryptEn)
	{
		docLink += "&encryptEn="+ downloadDocInfo.encryptEn;	
	}
	
	return docLink;
}

function getDocDownloadLink(docInfo, urlStyle)
{
	if(docInfo.fileLink)
	{
		return docInfo.fileLink;
	}
	
	var docDataEx = docInfo.dataEx;
	if(!docDataEx || docDataEx == null)	//表明不是文件，无法预览
	{
		return null;
	}
	
	docDataEx.vid = docInfo.vid;
	return buildDocDownloadLink(docDataEx, urlStyle);
}

function getDocDownloadFullLink(docInfo, urlStyle)
{
	var docLink = getDocDownloadLink(docInfo, urlStyle);
	var url =  buildFullLink(docLink);
	return url;
}

function buildDocImagePreviewLink(downloadDocInfo, resolutionLevel, urlStyle)
{	
	console.log("buildDocDownloadLink downloadDocInfo:", downloadDocInfo);
	var name = encodeURI(downloadDocInfo.name);
   	var path = encodeURI(downloadDocInfo.path);
   	var targetName = encodeURI(downloadDocInfo.targetName);
   	var targetPath = encodeURI(downloadDocInfo.targetPath);
   	
   	if(urlStyle && urlStyle == "REST")
   	{
   		var docRestLink =  "/DocSystem/Doc/downloadImg/" + downloadDocInfo.vid + "/" + path + "/" + name + "/" +targetPath+ "/"+targetName;
   		if(downloadDocInfo.authCode)
   		{
   			docRestLink += "/" + downloadDocInfo.authCode;
   		}
   		else
   		{
   			docRestLink += "/0";
   		}
   		if(downloadDocInfo.shareId)
   		{
   			docRestLink +=  "/"  + downloadDocInfo.shareId;
   		}
   		else
   		{
   			docRestLink += "/0";
   		}
   		if(downloadDocInfo.encryptEn)
   		{
   			docRestLink +=  "/"  + downloadDocInfo.encryptEn;
   		}
   		else
   		{
   			docRestLink += "/0";   			
   		}
   		if(resolutionLevel)
   		{
   			docRestLink +=  "/"  + resolutionLevel;
   		}
   		else
   		{
   			docRestLink += "/0"; 
   		}
   		return docRestLink;
   	}
   	
	var docLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDocInfo.vid + "&path=" + path + "&name=" + name + "&targetPath=" + targetPath + "&targetName=" + targetName;
	if(downloadDocInfo.authCode)
   	{
		docLink += "&authCode=" + downloadDocInfo.authCode;
   	}
	if(downloadDocInfo.shareId)
	{
		docLink += "&shareId="+downloadDocInfo.shareId;
	}
	if(downloadDocInfo.deleteFlag)
	{
		docLink += "&deleteFlag="+ downloadDocInfo.deleteFlag;	
	}
	if(downloadDocInfo.encryptEn)
	{
		docLink += "&encryptEn="+ downloadDocInfo.encryptEn;	
	}
	if(resolutionLevel)
	{
		docLink += "&resolutionLevel="+ resolutionLevel;	
	}	
	return docLink;
}

function buildDocVideoPreviewLink(downloadDocInfo, convertType, urlStyle)
{	
	console.log("buildDocVideoPreviewLink downloadDocInfo:", downloadDocInfo);
	var name = encodeURI(downloadDocInfo.name);
   	var path = encodeURI(downloadDocInfo.path);
   	var targetName = encodeURI(downloadDocInfo.targetName);
   	var targetPath = encodeURI(downloadDocInfo.targetPath);
   	
   	if(urlStyle && urlStyle == "REST")
   	{
   		var docRestLink =  "/DocSystem/Doc/downloadVideo/" + downloadDocInfo.vid + "/" + path + "/" + name + "/" +targetPath+ "/"+targetName;
   		if(downloadDocInfo.authCode)
   		{
   			docRestLink += "/" + downloadDocInfo.authCode;
   		}
   		else
   		{
   			docRestLink += "/0";
   		}
   		if(downloadDocInfo.shareId)
   		{
   			docRestLink +=  "/"  + downloadDocInfo.shareId;
   		}
   		else
   		{
   			docRestLink += "/0";
   		}
   		if(downloadDocInfo.encryptEn)
   		{
   			docRestLink +=  "/"  + downloadDocInfo.encryptEn;
   		}
   		else
   		{
   			docRestLink += "/0";   			
   		}
   		if(convertType)
   		{
   			docRestLink +=  "/"  + convertType;
   		}
   		else
   		{
   			docRestLink += "/0"; 
   		}
   		return docRestLink;
   	}
   	
	var docLink = "/DocSystem/Doc/downloadDoc.do?vid=" + downloadDocInfo.vid + "&path=" + path + "&name=" + name + "&targetPath=" + targetPath + "&targetName=" + targetName;
	if(downloadDocInfo.authCode)
   	{
		docLink += "&authCode=" + downloadDocInfo.authCode;
   	}
	if(downloadDocInfo.shareId)
	{
		docLink += "&shareId="+downloadDocInfo.shareId;
	}
	if(downloadDocInfo.deleteFlag)
	{
		docLink += "&deleteFlag="+ downloadDocInfo.deleteFlag;	
	}
	if(downloadDocInfo.encryptEn)
	{
		docLink += "&encryptEn="+ downloadDocInfo.encryptEn;	
	}
	if(convertType)
	{
		docLink += "&convertType="+ convertType;	
	}	
	return docLink;
}

function getDocImagePreviewLink(docInfo, resolutionLevel, urlStyle)
{
	var docDataEx = docInfo.dataEx;
	if(!docDataEx || docDataEx == null)	//表明不是文件，无法预览
	{
		return null;
	}
	
	docDataEx.vid = docInfo.vid;
	return buildDocImagePreviewLink(docDataEx, resolutionLevel, urlStyle);
}

function getDocVideoPreviewLink(docInfo, convertType, urlStyle)
{
	var docDataEx = docInfo.dataEx;
	if(!docDataEx || docDataEx == null)	//表明不是文件，无法预览
	{
		return null;
	}
	
	docDataEx.vid = docInfo.vid;
	return buildDocVideoPreviewLink(docDataEx, convertType, urlStyle);
}

//文件类型获取与判断接口
function buildBasicDoc(path, name)
{
	var doc = {
		path: path,
		name: name,
	};
	
	if(name == "" && path != "")
	{
		var offset = path.lastIndexOf("/");
		if( offset < 0 ){
			doc.path = "";
			doc.name = path;
		}
		else
		{
			doc.path = path.substring(0, offset+1);
			doc.name = path.substring(offset + 1 , path.length);
		}
	}
	return doc;
}

//文件类型获取与判断接口
function getFileSuffix(name) {
	if (name !== undefined && name !== "" && name.lastIndexOf(".") !== -1) {
		var i = name.lastIndexOf(".")
		if (i < 0) {
			// 默认是文本类型
			return "";
		}
		var suffix = name.substring(i + 1, name.length).toLowerCase();
		return suffix;
	} else {
		return "";
	}
}

function isBinary(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	
	var fileTypeMap = {
	        bin : true,
	        exe : true,
			dll : true,
			so : true,
			lib : true,
			war : true,
			jar : true,
	};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isPicture(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	
	var fileTypeMap = {
	        jpg : true,
	        jpeg : true,
			png : true,
			gif : true,
			bmp : true,
			mpg : true,
			jfif : true,
	};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isVideo(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			avi : true,
			mov : true,
			mpeg : true,
			mpg : true,
			mp4 : true,
			rmvb : true,
			asf : true,
			flv : true,
			ogg : true,
	};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function getVideoConvert(suffix)
{
	if(!suffix || suffix == "")
	{
		return 0;
	}
	var convertTypeMap = {
			avi : 1,
			mov : 0,
			mpeg : 1,
			mpg : 1,
			mp4 : 0,
			rmvb : 1,
			asf : 1,
			flv : 1,
			ogg : 1,
	};
	
	var type = convertTypeMap[suffix];
	if ( undefined == type )
	{
		return 0;
	}
	
	return type;
}

function isAudio(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			mp3: true,
	};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isMarkdown(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			md : true,
			markdown : true,
	};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isText(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			//text
			txt : true,
			//markdown (it will be opened by markdown editor)
			//md : true,
			//code
			cpp : true,
			hpp : true,
			c : true,
			h : true,
			java : true,
			py : true,
			go : true,
			js : true,
			css : true,
			html : true,
			jsp : true,
			php : true,
			//config
			json : true,
			xml : true,
			sql : true,
			properties : true,
			conf : true,
			cnf : true,
			asn : true,
			//script
			sh : true,
			bash: true,
			bat : true,
			cmake : true,
			yaml : true,
			yml : true,
			cmake : true,
			//log
			log : true,
			out : true,
			//email
			msg : true,
	};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isEditableText(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			//text
			txt : true,
			//markdown
			md : true,
			//code
			cpp : true,
			hpp : true,
			c : true,
			h : true,
			java : true,
			py : true,
			go : true,
			js : true,
			css : true,
			html : true,
			jsp : true,
			php : true,
			//config
			json : true,
			xml : true,
			sql : true,
			properties : true,
			conf : true,
			cnf : true,
			asn : true,
			//script
			sh : true,
			bash: true,
			bat : true,
			cmake : true,
			yaml : true,
			yml : true,
			cmake : true,
			//log
			log : true,
			out : true,
	};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;	
}

function isZip(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			zip : true,
			war : true,
			rar : true,
			"7z" : true,
			gz : true,
			tgz : true,
			xz : true,
			txz : true,
			bz2 : true,
			tbz2 : true,
			tar : true,
	};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isOffice(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			doc : true,
			docx : true,
		 	ppt : true,
			pptx : true,
			xls : true,
			xlsx : true,
			csv: true,
			wps: true,
			et: true,
			dps: true,
		};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isCad(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			dwg : true,
			dxf: true,
		 	stl: true,
		};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isPdf(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			pdf : true,
		};
	
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return false;
	}
	
	return true;
}

function isPictureFile(fileName)
{
	var suffix = getFileSuffix(fileName);
	return isPicture(suffix);
}

function isTextFile(fileName)
{		
	var suffix = getFileSuffix(fileName);
	return isText(suffix);
}

function isMarkdownFile(fileName)
{		
	var suffix = getFileSuffix(fileName);
	return isMarkdown(suffix);
}

function getDiyFileIconType(name)
{
	var fileIconTypeMap = {
	        doc		:	"word",
			docx 	:	"word",
			xls 	: 	"excel",
			xlsx 	: 	"excel",
			ppt		:	"ppt",
			pptx	:	"ppt",
			pdf 	: 	"pdf",
			jpg 	:	"picture",
	        jpeg 	: 	"picture",
			png 	: 	"picture",
	    	gif 	: 	"picture",
	    	jfif 	: 	"picture",
	    	mp3 	: 	"video",
			mp4 	: 	"video",
			mpg 	: 	"video",
			mkv 	: 	"video",
			rmvb 	: 	"video",
			avi 	: 	"video",
			mov 	: 	"video",
			wav 	: 	"audio",
			html 	: 	"html",
	        htm 	: 	"html",
	        txt 	: 	"txt",
			swf 	: 	"flash",
			zip 	: 	"zip",
	        rar 	: 	"zip",
	        "7z" 	: 	"zip",
			exe 	: 	"exe",
			psd 	: 	"psd",
			md		: 	"markdown",
			markdown: 	"markdown",
	};
    
    var suffix = getFileSuffix(name);
	if(suffix == "")
    {
		// 默认是文本类型
		return "";
	}
	
    var iconType = fileIconTypeMap[suffix];
	if ( undefined == iconType )
	{
		return ""
	}
	
	return iconType;
}

//这个接口是给OfficeEditor使用的
function getDocumentType(fileType)
{
	var documentTypeMap = {
	        doc		:	"word",
	        docm 	:	"word",
	        docx	:	"word",
	        dot 	:	"word",
	        dotm	:	"word",
	        dotx 	:	"word",
	        doc		:	"word",
			docx 	:	"word",	
			epub	:	"word",
			fodt 	:	"word",
			htm		:	"word",
			htmk 	:	"word",
	        mht		:	"word",
	        odt		:	"word",
	        pdf		:	"word",
			rtf 	:	"word",	
			txt 	:	"word",	
			djvu 	:	"word",	
			xps 	:	"word",	
			wps		:	"word",
			fodp 	: 	"slide",
		    odp 	: 	"slide",
		    potm	:	"slide",
		    pot 	: 	"slide",
		    potx 	:	"slide",
		    pps 	: 	"slide",
		    ppsm 	: 	"slide",
		    ppsx 	: 	"slide",
		    ppt 	: 	"slide",
		    pptm 	: 	"slide",
		    pptx 	: 	"slide",
		    dps		:	"slide",
		    csv 	: 	"cell",
		    fods 	: 	"cell",
		    ods 	: 	"cell",
			xls 	: 	"cell",
			xlsm 	: 	"cell",
	        xlsx 	: 	"cell",
	        xlt 	: 	"cell",
			xltm 	: 	"cell",
			xltx 	: 	"cell",
			et		:	"cell",
	};
	
    var type = documentTypeMap[fileType];
	if ( undefined == type )
	{
		return ""
	}
	
	return type;
}

function convertWpsToOfficeType(fileType)
{
	switch(fileType)
	{
	case "wps":
		return "doc";
	case "et":
		return "xls";
	case "dps":
		return "ppt";
	}
	return fileType
}

//显示文件详情
function showDocDetail(node)
{
	console.log("showDocDetail node:",node);

	if(!node || node == null)
	{
		showErrorMessage(_Lang("请选择文件！"));
		return;
	}
	
	showDocDetailPanel(node);
}

function showDocDetailPanel(node)
{
	console.log("showDocDetailPanel()");
	bootstrapQ.dialog({
			id: 'docDetail',
			url: 'docDetail' + langExt + '.html',
			title: _Lang('属性'),
			msg: _Lang('页面正在加载，请稍等...'),
            okbtn: _Lang("确定"),
              callback: function () {
            	  docDetailPageInit(node);
              }
        },function(){
        	return true;
        });	
}

//弹出对话框操作接口
function closeBootstrapDialog(id){ 
	console.log("closeBootstrapDialog " + id);
	$("#"+id + " div").remove();	//删除全屏遮罩
	$("#"+id).remove();	//删除对话框
}

//提示对话框
function showErrorMessage($msg) {
	console.log("showErrorMessage() ", $msg);
	if(typeof $msg == 'string'){
		qiao.bs.alert({
			id: "idAlertDialog",	
			title: _Lang("提示"),
			okbtn: _Lang("确定"),
			msg: $msg,
		});
	}else{
		qiao.bs.alert($msg);
	}
}

//提示框
function showSuccessMsg(msg)
{
    bootstrapQ.msg({
			msg : msg,
			type : 'success',
			time : 1000,
	});
}

//****************** Show File In NewPage **************************
function openDocInNewPage(doc)
{
	console.log("openDocInNewPage() doc:",doc);

	var vid = gReposInfo.id;
	var docId = doc.docId;
	var path = base64_encode(doc.path);
	var name = base64_encode(doc.name);
	var href = "/DocSystem/web/project.html?vid="+gReposInfo.id+"&doc="+docId+"&path="+path+"&name="+name;
	if(gShareId)
	{
		href += "&shareId"+gShareId;
	}
	console.log(href);
	window.open(href);
}

//****************** Show File In NewPage/Dialog **************************
function openDoc(doc, showUnknownFile, openInNewPage, preview, shareId)
{
	console.log("openDoc() showUnknownFile:" + showUnknownFile + " openInNewPage:" + openInNewPage + " preview:" + preview);
	console.log("openDoc() doc:",doc);
	
	if(doc == null || doc.type == 2)
	{
		//Folder do nothing
		return;
	}
	
	//copy do to docInfo
	var docInfo = copyDocInfo(doc, shareId);
	console.log("openDoc() docInfo:", docInfo);
	
	if(showUnknownFile && (showUnknownFile == true || showUnknownFile == "showUnknownFile"))
	{
		showUnknownFile = true;
	}
	else
	{
		showUnknownFile = false;
	}
	
	if(isPicture(docInfo.fileSuffix))
	{
		showImage(docInfo, openInNewPage);
	}
	else if(isVideo(docInfo.fileSuffix))
	{
		showVideo(docInfo, openInNewPage);
	}
	else if(isAudio(docInfo.fileSuffix))
	{
		showAudio(docInfo, openInNewPage);
	}
	else if(isPdf(docInfo.fileSuffix))
	{
		docInfo.fileLink = ""; //copyDocInfo的fileLink不是RESTLink，因此需要清空，保证showPdf接口重新获取RESTLINK
		showPdf(docInfo, openInNewPage);
	}
	else if(isOffice(docInfo.fileSuffix))
	{
		openOffice(docInfo, openInNewPage, preview);
	}
	else if(isCad(docInfo.fileSuffix))
	{
		openCad(docInfo, openInNewPage);		
	}
	else if(isMarkdown(docInfo.fileSuffix))
	{
		showMarkdown(docInfo, openInNewPage);		
	}
	else if(isText(docInfo.fileSuffix))
	{
		showText(docInfo, openInNewPage);
	}
	else if(isZip(docInfo.fileSuffix))
	{
		if(docInfo.isZip && docInfo.isZip == 1)
		{
			console.log("目前不支持在线打开压缩文件中的压缩文件");
		}
		else
		{
			showZip(docInfo, openInNewPage);
		}
	}
	else if(isBinary(docInfo.fileSuffix))
	{
		//Do nothing	
	}
	else	//UnknownFile
	{
		if(showUnknownFile && showUnknownFile == true)
		{
			showText(docInfo, openInNewPage);
		}
	}
}

function copyDocInfo(doc, shareId)
{
	if(doc)
	{
		var docInfo = {};
		docInfo.isBussiness = doc.isBussiness;
		docInfo.officeType = doc.officeType;
		
		if(doc.vid)
    	{
			docInfo.vid = doc.vid;
    	}
    	else
    	{
    		docInfo.vid = gReposInfo.id;
    	}
    	
    	if(gShareId)
    	{
    		docInfo.shareId = gShareId;
    	}
    	
		docInfo.docId = doc.docId;
		docInfo.path = doc.path;
		docInfo.name = doc.name;
		docInfo.docType = doc.docType;
		if(!docInfo.docType)
		{
			docInfo.docType = 1; //默认是1
		}
				
		docInfo.isZip = doc.isZip;
		if(docInfo.isZip && docInfo.isZip == 1)
		{
			docInfo.rootPath = doc.rootPath;
			docInfo.rootName = doc.rootName;
		}
		
		docInfo.isHistory = doc.isHistory;
		if(docInfo.isHistory && docInfo.isHistory == 1)
		{
			docInfo.commitId = doc.commitId;
			docInfo.historyType = doc.historyType;
			docInfo.needDeletedEntry = doc.needDeletedEntry;
		}
		
		if(doc.fileSuffix)
		{
			docInfo.fileSuffix = doc.fileSuffix;	
		}
		else
		{
			docInfo.fileSuffix = getFileSuffix(docInfo.name);    			
		}
		
		if(doc.dataEx)
		{
			docInfo.dataEx = doc.dataEx;
			var fileLink = getDocDownloadFullLink(docInfo);
			if(fileLink && fileLink != null)
			{
				docInfo.fileLink = fileLink;
			}
		}
		
		return docInfo;
	}
	return null;
}

function openOffice(docInfo, openInNewPage, preview)
{
	console.log("openOffice preview:" + preview);
    var url = "/DocSystem/Bussiness/getDocOfficeLink.do";
    if(docInfo.isZip && docInfo.isZip == 1)
    {
        var url = "/DocSystem/Bussiness/getZipDocOfficeLink.do";    	
    }
	$.ajax({
        url : url,
        type : "post",
        dataType : "json",
        data : {
        	reposId: docInfo.vid,
            path: docInfo.path,
            name: docInfo.name,
            rootPath: docInfo.rootPath,
            rootName: docInfo.rootName,
            commitId: docInfo.commitId,
            historyType: docInfo.historyType,
            shareId: docInfo.shareId,
            preview: preview,  //preview表示是否是预览，预览则是转成pdf
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	console.log("openOffice ret", ret);
            	if(ret.dataEx == "pdf")
                {
    				docInfo.fileLink = ret.data;
    				showPdf(docInfo, openInNewPage);
                }
            	else if(ret.dataEx == "office")
                {
            		if(openInNewPage != "openInNewPage")
            		{
            			docInfo.fileLink = ret.data;
            		}
            		showOffice(docInfo, openInNewPage);
                }
            	else
            	{
                	console.log("previewOfficeInDialog getDocOfficeLink Failed (maybe office not supported or not installed)");
                	showText(docInfo, openInNewPage); //ReadOnly 方式显示文件内容            		
            	}
            }
            else
            {
            	console.log("previewOfficeInDialog getDocOfficeLink Failed");
            	showText(docInfo, openInNewPage); //ReadOnly 方式显示文件内容
            }
        },
        error : function () {
            console.log("previewOfficeInDialog getDocOfficeLink Failed 服务器异常");
            showText(docInfo, openInNewPage); //ReadOnly 方式显示文件内容
        }
    });
}

function openCad(docInfo, openInNewPage)
{
	console.log("openCad() openInNewPage:" + openInNewPage + " docInfo:", docInfo);
    var url = "/DocSystem/Bussiness/getDocCadLink.do";
    if(docInfo.isZip && docInfo.isZip == 1)
    {
        var url = "/DocSystem/Bussiness/getZipDocCadLink.do";    	
    }
	$.ajax({
        url : url,
        type : "post",
        dataType : "json",
        data : {
        	reposId: docInfo.vid,
            path: docInfo.path,
            name: docInfo.name,
            rootPath: docInfo.rootPath,
            rootName: docInfo.rootName,
            commitId: docInfo.commitId,
            historyType: docInfo.historyType,
            shareId: docInfo.shareId,
            //preview: preview,  //cad总是预览，无法编辑
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	console.log("openCad ret", ret);
            	if(ret.dataEx == "pdf")
                {
    				docInfo.fileLink = ret.data;
    				showPdf(docInfo, openInNewPage);
                }
            	else
            	{
            		showErrorMessage(_Lang("文件打开失败", ":", ret.msgInfo));
            	}
            }
            else
            {
            	console.log("openCad getDocCadLink Failed");
        		showErrorMessage(_Lang("文件打开失败", ":", ret.msgInfo));
            }
        },
        error : function () {
            console.log("openCad getDocCadLink Failed 服务器异常");
    		showErrorMessage(_Lang("文件打开失败", ":", "服务器异常"));
        }
    });
}

function showImage(docInfo, openInNewPage)
{
	if(openInNewPage == "openInNewPage")
	{
		showImgInNewPage(docInfo);
	}
	else
	{
		if(openInNewPage == "openInArtDialog")
		{			
			showImgInArtDialog(docInfo);
		}
		else
		{
			showImgInDialog(docInfo);
		}
	}
}

function showAudio(docInfo, openInNewPage)
{
	if(openInNewPage == "openInNewPage")
	{
		showAudioInNewPage(docInfo);
	}
	else
	{
		if(openInNewPage == "openInArtDialog")
		{			
			showAudioInArtDialog(docInfo);
		}
		else
		{
			showAudioInDialog(docInfo);
		}
	}
}

function showVideo(docInfo, openInNewPage)
{
	if(openInNewPage == "openInNewPage")
	{
		showVideoInNewPage(docInfo);
	}
	else
	{
		if(openInNewPage == "openInArtDialog")
		{			
			showVideoInArtDialog(docInfo);
		}
		else
		{
			showVideoInDialog(docInfo);
		}
	}
}

function showVideoWithDPlayer(objId, fileLink)
{
	const dp = new DPlayer({
	    container: document.getElementById(objId),
	    screenshot: true,
	    video: {
	        url: fileLink,
	        pic: fileLink,
	        thumbnails: fileLink,
	    },
	});
}

function getVideoTypeByFileSuffix(suffix)
{	
	return "video/mp4";
	
	if(!suffix || suffix == "")
	{
		return "video/mp4";
	}
		
	var fileTypeMap = {
	        mp4 : "video/mp4",
	        mov : "video/mp4",
	};
	var type = fileTypeMap[suffix];
	if ( undefined == type )
	{
		return "video/" + suffix;
	}
		
	return type;
}
function showVideoWithVideojs(objId, fileLink, type)
{
	var player = videojs(document.getElementById(objId), {
	  controls: true, // 是否显示控制条
	  //poster: fileLink, // 视频封面图地址
	  preload: 'auto',
	  autoplay: false,
	  fluid: true, // 自适应宽高
	  language: 'zh-CN', // 设置语言
	  muted: false, // 是否静音
	  inactivityTimeout: false,
	  //seeking: true,
	  controlBar: { // 设置控制条组件
	    /* 设置控制条里面组件的相关属性及显示与否
	    'currentTimeDisplay':true,
	    'timeDivider':true,
	    'durationDisplay':true,
	    'remainingTimeDisplay':false,
	     volumePanel: {
	      inline: false,
	    }
	    */
	    /* 使用children的形式可以控制每一个控件的位置，以及显示与否 */
	    children: [
	      {name: 'playToggle'}, // 播放按钮
	      {name: 'currentTimeDisplay'}, // 当前已播放时间
	      {name: 'progressControl'}, // 播放进度条
	      {name: 'durationDisplay'}, // 总时间
	      { // 倍数播放
	        name: 'playbackRateMenuButton',
	        'playbackRates': [0.5, 1, 1.5, 2, 2.5]
	      },
	      {
	        name: 'volumePanel', // 音量控制
	        inline: false, // 不使用水平方式
	      },
	      {name: 'FullscreenToggle'} // 全屏
	    ]
	  },
	  sources:[ // 视频源
	      {
	          src: fileLink,
	          type: type,
	          //poster: fileLink,
	      }
	  ]
	}, function (){
	  console.log('视频可以播放了',this);
	});
}

function showZip(docInfo, openInNewPage)
{
	if(openInNewPage == "openInNewPage")
	{
		showZipInNewPage(docInfo);
	}
	else
	{
		if(openInNewPage == "openInArtDialog")
		{			
			showZipInArtDialog(docInfo);
		}
		else
		{
			showZipInDialog(docInfo);
		}
	}
}

function showPdf(docInfo, openInNewPage)
{
	if(openInNewPage == "openInNewPage")
	{
		showPdfInNewPage(docInfo);
	}
	else
	{
		if(openInNewPage == "openInArtDialog")
		{			
			showPdfInArtDialog(docInfo);
		}
		else
		{
			showPdfInDialog(docInfo);
		}
	}
}

function showMarkdown(docInfo, openInNewPage)
{
	if(openInNewPage == "openInNewPage")
	{
		showMarkdownInNewPage(docInfo);
	}
	else
	{
		if(openInNewPage == "openInArtDialog")
		{			
			showMarkdownInArtDialog(docInfo);
		}
		else
		{
			showMarkdownInDialog(docInfo);
		}
	}
}

function showText(docInfo, openInNewPage)
{
	if(openInNewPage == "openInNewPage")
	{
		showTextInNewPage(docInfo);
	}
	else
	{
		if(openInNewPage == "openInArtDialog")
		{			
			showTextInArtDialog(docInfo);
		}
		else
		{
			showTextInDialog(docInfo);
		}
	}
}

function showOffice(docInfo, openInNewPage)
{
	if(openInNewPage == "openInNewPage")
	{
		showOfficeInNewPage(docInfo);
	}
	else
	{
		if(openInNewPage == "openInArtDialog")
		{			
			showOfficeInArtDialog(docInfo);
		}
		else
		{
			showOfficeInDialog(docInfo);
		}
	}
}

//ShowDocInNewPage
function showImgInNewPage(docInfo, fileLink)
{
	console.log("showImgInDialog docInfo:", docInfo);
	if(fileLink && fileLink != "")
	{
		docInfo.fileLink = fileLink;
	}
	
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	if(docInfo.isZip && docInfo.isZip == 1)
	{
		window.open("/DocSystem/web/imgViewer.html?" + urlParamStr);				
	}
	else
	{
		window.open("/DocSystem/web/imageListViewer.html?" + urlParamStr);		
	}
}

function showVideoInNewPage(docInfo, fileLink){
	console.log("showVideoInNewPage docInfo:", docInfo);
	if(fileLink && fileLink != "")
	{
		docInfo.fileLink = fileLink;
	}
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/videoViewer.html?" + urlParamStr);
}

function showAudioInNewPage(docInfo, fileLink){
	console.log("showAudioInNewPage docInfo:", docInfo);
	if(fileLink && fileLink != "")
	{
		docInfo.fileLink = fileLink;
	}
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/audio.html?" + urlParamStr);
}

function showZipInNewPage(docInfo)
{
	console.log("showZipInNewPage docInfo:", docInfo);
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/zipViewer.html?" + urlParamStr);
}

function showPdfInNewPage(docInfo, fileLink)
{
	console.log("showPdfInNewPage docInfo:", docInfo);
	if(fileLink && fileLink != "")
	{
		docInfo.fileLink = fileLink;
	}
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/pdfViewer.html?" + urlParamStr);
}

function showMarkdownInNewPage(docInfo, openType)
{
	console.log("showTextInNewPage docInfo:", docInfo);
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/stackedit.html?" + urlParamStr);			
}

function showTextInNewPage(docInfo, openType)
{
	console.log("showTextInNewPage docInfo:", docInfo);
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	if(openType && openType == "textViewer")
	{
		window.open("/DocSystem/web/textViewer.html?" + urlParamStr);
	}
	else
	{
		window.open("/DocSystem/web/ace.html?" + urlParamStr);			
	}
}

function showOfficeInNewPage(docInfo)
{	
	console.log("showOfficeInNewPage docInfo:", docInfo);

    var urlParamStr = buildRequestParamStrForDoc(docInfo);
    console.log("urlParamStr=" + urlParamStr);
	var link = "/DocSystem/web/office.jsp?" + urlParamStr;
    window.open(link);
}

//ShowDocInDialog
function showImgInDialog(docInfo)
{
	console.log("showImgInDialog docInfo:", docInfo);
	var url = 'imgListViewerForBootstrap.html';
	if(docInfo.isZip && docInfo.isZip == 1)
	{
		url = 'imgViewerForBootstrap.html';
	}
	
	bootstrapQ.dialog({
		id: "ImgListViewer",
		title: docInfo.name,
		url: 'imgListViewerForBootstrap.html',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		mstyle: getDialogStyle(),
		callback: function(){
			ImgListViewer.imgViewerPageInit(docInfo);
		},
	});
}

function showImgInArtDialog(docInfo) {
	console.log("showImgInArtDialog docInfo:", docInfo);
	var url = 'imgListViewerForArt.html';
	if (docInfo.isZip && docInfo.isZip == 1) {
		url = 'imgViewerForArt.html';
	}
	//获取窗口的高度并设置高度
	var height = getArtDialogInitHeight();
	var width = getArtDialogInitWidth();
	var d = new artDialog({
		id: "ArtDialog" + docInfo.docId,
		title: docInfo.name,
		url: url,
		content: '<iframe frameborder="0" name="ArtDialog' + docInfo.docId + '" src="' + url + '?docid=' + docInfo.docId + '" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
	});
	if (window.artDialogList === undefined) {
		window.artDialogList = {};
	}
	window.artDialogList["ArtDialog" + docInfo.docId] = d;
}

function showVideoInDialog(docInfo){
	console.log("showVideoInDialog docInfo:", docInfo);
	bootstrapQ.dialog({
		id: "VideoViewer",
		title: docInfo.name,
		url: 'videoViewerForBootstrap.html',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		mstyle: getDialogStyle(),
		callback: function(){
			VideoViewer.videoViewerPageInit(docInfo);
		},
	});
}

function showVideoInArtDialog(docInfo) {
	console.log("showVideoInArtDialog docInfo:", docInfo);
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();
	var d = new artDialog({
		id: "ArtDialog" + docInfo.docId,
		title: docInfo.name,
		content: '<iframe frameborder="0" name="ArtDialog' + docInfo.docId + '" src="videoViewerForArt.html?docid=' + docInfo.docId + '" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
	});
	if (window.artDialogList === undefined) {
		window.artDialogList = {};
	}
	window.artDialogList["ArtDialog" + docInfo.docId] = d;
}

function showAudioInArtDialog(docInfo) {
	console.log("showAudioInArtDialog docInfo:", docInfo);
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();
	var d = new artDialog({
		id: "ArtDialog" + docInfo.docId,
		title: docInfo.name,
		content: '<iframe frameborder="0" name="ArtDialog' + docInfo.docId + '" src="audioForArt.html?docid=' + docInfo.docId + '" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
	});
	if (window.artDialogList === undefined) {
		window.artDialogList = {};
	}
	window.artDialogList["ArtDialog" + docInfo.docId] = d;
}

function showZipInDialog(docInfo)
{
	bootstrapQ.dialog({
		id: "ZipViewer",
		title: docInfo.name,
		url: 'zipViewerForBootstrap.html',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		mstyle: getZipDialogStyle(),
		callback: function(){
			ZipViewer.zipViewerPageInit(docInfo);
		},
	});
}

function showZipInArtDialog(docInfo) {
	//获取窗口的高度并设置高度
	var height = getArtDialogInitHeight();
	var width = getArtDialogInitWidth();
	var d = new artDialog({
		id: "ArtDialog" + docInfo.docId,
		title: docInfo.name,
		content: '<iframe frameborder="0" scrolling="auto" name="ArtDialog' + docInfo.docId + '" src="zipViewerForArt.html?docid=' + docInfo.docId + '" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
	});
	if (window.artDialogList === undefined) {
		window.artDialogList = {};
	}
	window.artDialogList["ArtDialog" + docInfo.docId] = d;
}

function showPdfInDialog(docInfo)
{
	bootstrapQ.dialog({
		id: "PdfViewer",
		title: docInfo.name,
		url: 'pdfViewerForBootstrap.html',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		mstyle: "width:95%;height:95%;",
		callback: function(){
			PdfViewer.pdfViewerPageInit(docInfo);
		},
	});
}

function showPdfInArtDialog(docInfo) {
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();
	var d = new artDialog({
		id: "ArtDialog" + docInfo.docId,
		title: docInfo.name,
		content: '<iframe frameborder="0" name="ArtDialog' + docInfo.docId + '" src="pdfViewerForArt.html?docid=' + docInfo.docId + '" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
	});
	if (window.artDialogList === undefined) {
		window.artDialogList = {};
	}
	window.artDialogList["ArtDialog" + docInfo.docId] = d;
}

function showPdfInDialog(docInfo)
{
	bootstrapQ.dialog({
		id: "PdfViewer",
		title: docInfo.name,
		url: 'pdfViewerForBootstrap.html',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		mstyle: "width:95%;height:95%;",
		callback: function(){
			PdfViewer.pdfViewerPageInit(docInfo);
		},
	});
}

function showMarkdownInDialog(docInfo, docText, tmpSavedDocText)
{
	console.log("showMarkdownInDialog docInfo.docId:" + docInfo.docId);
	
	bootstrapQ.dialog({
		id: "StackeidtEditor",
		title: docInfo.name,
		url: 'stackeditForBootstrap.html',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		mstyle: getDialogStyle(),
		callback: function(){
			StackMdEditor.init("BootstrapDialog", docInfo);
		},
	});
}

function showMarkdownInArtDialog(docInfo)
{
	console.log("showMarkdownInArtDialog docInfo.docId:" + docInfo.docId);
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();
	var d = new artDialog({
		id: "ArtDialog"  + docInfo.docId,
		title: docInfo.name,
		content:'<iframe frameborder="0" name="ArtDialog'+docInfo.docId+'" src="stackeditForArt.html?docid='+docInfo.docId+'" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		//content:'<iframe frameborder="0" name="ArtDialog'+docInfo.docId+'" src="editormdForArt.html?docid='+docInfo.docId+'" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
	});
	if(window.artDialogList === undefined) {
		window.artDialogList = {};
	}
	window.artDialogList["ArtDialog"+docInfo.docId] = d;
}

function showTextInDialog(docInfo, openType)
{
	console.log("showTextInDialog docInfo.docId:" + docInfo.docId);
	if(openType && openType == "textViewer")
	{
		bootstrapQ.dialog({
			id: "textViewer",
			title: docInfo.name,
			url: 'textViewerForBootstrap.html',
			msg: _Lang('页面正在加载，请稍等...'),
			foot: false,
			big: true,
			mstyle: getDialogStyle(),
			callback: function(){
				TextViewer.init("BootstrapDialog", docInfo);
			},
		});
	}
	else
	{
		bootstrapQ.dialog({
			id: "AceEditor",
			title: docInfo.name,
			url: 'aceForBootstrap.html',
			msg: _Lang('页面正在加载，请稍等...'),
			foot: false,
			big: true,
			mstyle: getDialogStyle(),
			callback: function(){
				AceTextEditor.init("BootstrapDialog", docInfo);
			},
		});
	}
}

function showTextInArtDialog(docInfo) {
	console.log("showTextInArtDialog docInfo.docId:" + docInfo.docId);
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();
	var d = new artDialog({
		id: "ArtDialog" + docInfo.docId,
		title: docInfo.name,
		content: '<iframe frameborder="0" name="ArtDialog' + docInfo.docId + '" src="aceForArt.html?docid=' + docInfo.docId + '" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
	});
	if (window.artDialogList === undefined) {
		window.artDialogList = {};
	}
	window.artDialogList["ArtDialog" + docInfo.docId] = d;

}

function getArtDialogInitWidth()
{
	if(gIsPC)
	{
		return window.screen.width/2;
	}
	else
	{
		return window.screen.width*0.98;
	}
}

function getArtDialogInitHeight()
{
	if(gIsPC)
	{
		return window.screen.height/2;	
	}
	else
	{
		return window.screen.height*0.9;
	}	
}

function getArtDialogMaxWidth()
{
	return getWinWidth();
}

function getArtDialogMaxHeight()
{
	return getWinHeight() - 50;
}

//获取窗口宽度
function getWinWidth()
{
	if (window.innerWidth)
	winWidth = window.innerWidth;
	else if ((document.body) && (document.body.clientWidth))
	winWidth = document.body.clientWidth;
	return winWidth;
}

function getWinHeight()
{
	if (window.innerHeight)
	winHeight = window.innerHeight;
	else if ((document.body) && (document.body.clientHeight))
	winHeight = document.body.clientHeight;
	return winHeight;
}

function showOfficeInDialog(docInfo)
{
	console.log("showOfficeInDialog docInfo:", docInfo);
	bootstrapQ.dialog({
		id: "OfficeEditor",
		title: docInfo.name,
		url: 'officeForBootstrap.jsp',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		mstyle: "width:95%;height:95%;",
		callback: function(){
			setTimeout(function(){ OfficeEditor.PageInit(docInfo); }, 2000); 
		},
	});
}

function showOfficeInArtDialog(docInfo) {
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();
	var ArtDialogDivContentId = "div[aria-describedby='content:ArtDialog"+docInfo.docId+"']";
	var ArtDialogId = "ArtDialog"  + docInfo.docId;
	var d = new artDialog({
		id: "ArtDialog" + docInfo.docId,
		title: docInfo.name,
		content: '<iframe frameborder="0" name="ArtDialog' + docInfo.docId + '" src="officeForArt.jsp?docid=' + docInfo.docId + '" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
		cancel: function () {
			console.log("showOfficeInArtDialog docInfo:",docInfo);
			if ((docInfo.officeType && docInfo.officeType == 1) ||(docInfo.isZip && docInfo.isZip == 1)) {
				//压缩文件的Office为只读，不需要检测
				return true;
			}
			// 原理：该按钮是内嵌office是否保存按钮，保存后该按钮处于禁用状态，未保存，该按钮处于启用状态就代表文档还未保存，则拦截
			// 获取该文档唯一iframe,其name是文档唯一值
			let docIframe = $("." + ArtDialogId).find("iframe[name=" + ArtDialogId + "]")[0];
			if (docIframe !== undefined) {
				// 根据该iframe获取下一级iframe
				let officeIframe = $(docIframe.contentWindow.document).find("iframe[name=frameEditor]")[0];
				if (officeIframe !== undefined) {
					// 从该iframe中，获取是否保存按钮元素，修改为通过绝对元素相对定位获取
					let saveButton = $(officeIframe.contentWindow.document).find("div#slot-btn-dt-save > button:first");
					if (saveButton !== undefined) {
						// 获取该元素的禁用状态，开启则提示，禁用则直接关闭窗口即可
						let check = $(saveButton).prop("disabled");
						if (!check) {
							qiao.bs.confirm('文件尚未保存，是否关闭当前窗口？', function () {
								d.close();
							});
							return false;
						}
					}
				}
			}
			return true;
		}
	});
	if (window.artDialogList === undefined) {
		window.artDialogList = {};
	}
	window.artDialogList["ArtDialog" + docInfo.docId] = d;
	// 去除最后一列的按钮栏
	$("."+ArtDialogId+" .aui-footer").parent().remove();

}

function getZipDialogStyle()
{
	console.log("getZipDialogStyle gIsPC:" + gIsPC);
	if(gIsPC == false)
	{
		return "width:95%;height:95%;";	
	}
	else
	{
		return "width:50%;height:95%;";				
	}
}

function getDialogStyle()
{
	return 'width:95%;';	
}

//在前端构造DocInfo
function buildDocInfo(reposId, path, name)
{
	var docInfo = {};
	var entryPath = getEntryPath(path, name);
	var result = {};
	var level = seperatePathAndName(entryPath, result);
	docInfo.vid = reposId;
	docInfo.path = result.path;
	docInfo.name = result.name;
	docInfo.level = level;
	docInfo.docId = buildDocIdByName(level, result.path, result.name);
	return docInfo;	
}

function buildDocIdByName(level, parentPath, docName) 
{
	var docPath = parentPath + docName;
	if(docName == "")
	{
		if(parentPath == "")
		{
			return 0;
		}
		
		docPath = parentPath.substring(0, parentPath.length-1);	//remove the last char '/'
	}
	
	var docId = level*100000000000 + getHashCode(docPath) + 102147483647;	//为了避免文件重复使用level*100000000 + docName的hashCode
	return docId;
}

//Java的String.hashCode()实现
function getHashCode(str)
{
	let hash = 0;
	var len = str.length;
	if(len == 0)
	{
		return hash
	}

	for (var i = 0; i < len; i++)
	{
		var ch = str.charCodeAt(i);
		hash = ((hash<<5) - hash) + ch;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}

function getEntryPath(path, name)
{
	if(path == undefined)
	{
		path = "";
	}

	if(name == undefined)
	{
		name = "";
	}

	//无法确定path是否以 / 结尾，因此需要加上 /
	//无法确定name是否包含了 /, 因此需要组合成整个路径统一处理
	var entryPath = path + "/" + name;

	//将 \\ 替换为 /
	entryPath = entryPath.replace(/\\/g, "/");
	return entryPath;
}

function seperatePathAndName(entryPath, result) 
{
	if(entryPath == '')
	{
		//It it rootDoc
		return -1;
	}
		
	//拆分路径（中间可能有无效空字段）
	var paths = entryPath.split("/");
	var deepth = paths.length;
	
	var  path = "";
	var name = "";
		
	//Get Name and pathEndPos
	var pathEndPos = 0;
	for(var i=deepth-1; i>=0; i--)
	{
		name = paths[i];
		if(name == '')
		{
			continue;
		}
		pathEndPos = i;
		break;
	}
		
	//Get Path
	var level = 0;
	for(var i=0; i<pathEndPos; i++)
	{
		var tempName = paths[i];
		if(tempName == '')
		{
			continue;
		}

		level++;
		path = path + tempName + "/";
	}
		
	result.path = path;
	result.name = name;
	return level;
}


