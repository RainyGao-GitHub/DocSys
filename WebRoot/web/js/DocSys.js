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
	}
	
	if(docInfo.fileLink)
	{
		urlParamStr += andFlag + "fileLink=" + docInfo.fileLink;
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
	}
	
	return docInfo;
}

//获取文件链接接口
function getDocFileLink(docInfo, successCallback, errorCallback, urlStyle)
{
	if(docInfo.isZip && docInfo.isZip == 1)
	{
		getZipDocFileLink(docInfo, successCallback, errorCallback, urlStyle);
	}
	else
	{
		getDocFileLinkBasic(docInfo, successCallback, errorCallback, urlStyle);
	}
}

function getDocFileLinkBasic(docInfo, successCallback, errorCallback, urlStyle)
{	
	var fileLink = "";
	var errorInfo = "";
	console.log("getDocFileLink()  docInfo:", docInfo);
    if(!docInfo || docInfo == null || docInfo.id == 0)
    {
    	//未定义需要显示的文件
    	errorInfo = "请选择文件";
    	errorCallback && errorCallback(errorInfo);
    	return;
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
            shareId: docInfo.shareId,
            urlStyle: urlStyle,
        },
        success : function (ret) {
        	console.log("getDocFileLink ret",ret);
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
function getZipDocFileLink(docInfo, successCallback, errorCallback, urlStyle)
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

//获取文件链接接口(链接带officeEditorAuthCode)

function getDocOfficeLink(docInfo, successCallback, errorCallback, urlStyle)
{
	if(docInfo.isZip && docInfo.isZip == 1)
	{
		getZipDocOfficeLink(docInfo, successCallback, errorCallback, urlStyle);
	}
	else
	{
		getDocOfficeLinkBasic(docInfo, successCallback, errorCallback, urlStyle);
	}
}

function getDocOfficeLinkBasic(docInfo, successCallback, errorCallback, urlStyle)
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
  	
	$.ajax({
        url : "/DocSystem/Doc/getDocOfficeLink.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: docInfo.vid,
            path: docInfo.path,
            name: docInfo.name,
            commitId: docInfo.commitId,
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
function getZipDocOfficeLink(docInfo, successCallback, errorCallback, urlStyle)
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
  	
	$.ajax({
        url : "/DocSystem/Doc/getZipDocOfficeLink.do",
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
	console.log("getDocText()  docInfo:", docInfo);
    if(!docInfo || docInfo == null || docInfo.id == 0)
    {
    	//未定义需要显示的文件
    	errorInfo = "请选择文件";
    	errorCallback && errorCallback(errorInfo);
    	//showErrorMessage("请选择文件");
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
	            		successCallback &&successCallback(docText, "");
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
		            	            	successCallback &&successCallback(docText, tmpSavedDocText);
		            	            },
		            	            error : function () {	            	            	
		            	            	successCallback &&successCallback(docText, tmpSavedDocText);
	
		            	            	errorInfo = "临时保存文件内容获取失败：服务器异常";
		            	            	errorCallback && errorCallback(errorInfo);
		            	                //showErrorMessage("临时保存文件内容失败：服务器异常");
		            	            }
		            	        });
	            	}
            	}
            	else
            	{
            		errorInfo = "获取文件内容失败：" + ret1
            		errorCallback && errorCallback(errorInfo);
            		//showErrorMessage("获取文件内容失败：" + ret1);
            	}
            },
            error : function () {
            	errorInfo = "获取文件内容失败：服务器异常";
        		errorCallback && errorCallback(errorInfo);
                //showErrorMessage("获取文件内容失败：服务器异常");
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
    	errorInfo = "请选择文件";
    	errorCallback && errorCallback(errorInfo);
    	//showErrorMessage("请选择文件");
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
	            	successCallback &&successCallback(docText, "");
            	}
            	else
            	{
            		errorInfo = "获取文件内容失败：" + ret1
            		errorCallback && errorCallback(errorInfo);
            		//showErrorMessage("获取文件内容失败：" + ret1);
            	}
            },
            error : function () {
            	errorInfo = "获取文件内容失败：服务器异常";
        		errorCallback && errorCallback(errorInfo);
                //showErrorMessage("获取文件内容失败：服务器异常");
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
	
	var host = window.location.hostname; //域名不带端口  
 	var port = window.location.port;
 	if(port && port != "")
 	{
 		host += ":" + port;
 	}
 	
 	var url = "http://" + host + docLink;
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
	var href = "/DocSystem/web/project.html?vid="+ reposId + "&shareId=" + docShare.shareId;        			
 	console.log(href);
	
 	//var host = window.location.host;	//域名带端口
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
 		
 	var url = "http://"+host+href;
 	return url;
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
	
	var targetName = docDataEx.name;
	var targetPath = docDataEx.path;
    targetName = encodeURI(targetName);
   	targetPath = encodeURI(targetPath);
   	if(urlStyle && urlStyle == "REST")
   	{
   		return "/DocSystem/Doc/downloadDoc/"+targetPath+"/"+targetName;   		
   	}
   	
	var docLink = "/DocSystem/Doc/downloadDoc.do?targetPath=" + targetPath + "&targetName=" + targetName;
	if(docInfo.shareId)
	{
		docLink += "&shareId="+docInfo.shareId;
	}
	return docLink;
}

function getDocDownloadFullLink(docInfo, urlStyle)
{
	var docLink = getDocDownloadLink(docInfo, urlStyle);
	var url =  buildFullLink(docLink);
	return url;
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
function getFileSuffix(name)
{
   var i = name.lastIndexOf(".")
   if( i< 0 ){
		// 默认是文本类型
		return "";
   }
   
   var suffix = name.substring(i + 1 , name.length).toLowerCase();
   return suffix;
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

function isText(suffix)
{
	if(!suffix || suffix == "")
	{
		return false;
	}
	var fileTypeMap = {
			txt : true,
			log : true,
			md : true,
			py : true,
			java : true,
			cpp : true,
			hpp : true,
			c : true,
			h : true,
			json : true,
			xml : true,
			html : true,
			sql : true,
			js : true,
			css : true,
			jsp : true,
			php : true,
			properties : true,
			conf : true,
			out : true,
			sh : true,
			bat : true,
			msg : true,
			cmake : true,
			cmake : true,
			yaml : true,
			yml : true,
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
	        doc		:	"text",
	        docm 	:	"text",
	        docx	:	"text",
	        dot 	:	"text",
	        dotm	:	"text",
	        dotx 	:	"text",
	        doc		:	"text",
			docx 	:	"text",	
			epub	:	"text",
			fodt 	:	"text",
			htm		:	"text",
			htmk 	:	"text",
	        mht		:	"text",
	        odt		:	"text",
	        pdf		:	"text",
			rtf 	:	"text",	
			txt 	:	"text",	
			djvu 	:	"text",	
			xps 	:	"text",	
			fodp 	: 	"presentation",
		    odp 	: 	"presentation",
		    potm	:	"presentation",
		    pot 	: 	"presentation",
		    potx 	:	"presentation",
		    pps 	: 	"presentation",
		    ppsm 	: 	"presentation",
		    ppsx 	: 	"presentation",
		    ppt 	: 	"presentation",
		    pptm 	: 	"presentation",
		    pptx 	: 	"presentation",
		    csv 	: 	"spreadsheet",
		    fods 	: 	"spreadsheet",
		    ods 	: 	"spreadsheet",
			xls 	: 	"spreadsheet",
			xlsm 	: 	"spreadsheet",
	        xlsx 	: 	"spreadsheet",
	        xlt 	: 	"spreadsheet",
			xltm 	: 	"spreadsheet",
			xltx 	: 	"spreadsheet",
	};
	
    var type = documentTypeMap[fileType];
	if ( undefined == type )
	{
		return ""
	}
	
	return type;
}

//显示文件详情
function showDocDetail(node)
{
	console.log("showDocDetail node:",node);

	if(!node || node == null)
	{
		showErrorMessage("请选择文件！");
		return;
	}
	
	showDocDetailPanel(node);
}

function showDocDetailPanel(node)
{
	console.log("showDocDetailPanel()");
	bootstrapQ.dialog({
			id: 'docDetail',
			url: 'docDetail.html',
			title: '详细信息',
			msg: '页面正在加载，请稍等...',
            okbtn: "确定",
              callback: function () {
            	  docDetailPageInit(node);
              }
        },function(){
        	return true;
        });	
}

//弹出对话框操作接口
function closeBootstrapDialog(id){ 
	$("#"+id + "div").remove();	//删除全屏遮罩
	$("#"+id).remove();	//删除对话框
}

//提示对话框
function showErrorMessage($msg) {
	qiao.bs.alert($msg);
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

/****************** Show File In NewPage/Dialog **************************/
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
	else if(isPdf(docInfo.fileSuffix))
	{
		docInfo.fileLink = ""; //copyDocInfo的fileLink不是RESTLink，因此需要清空，保证showPdf接口重新获取RESTLINK
		showPdf(docInfo, openInNewPage);
	}
	else if(isOffice(docInfo.fileSuffix))
	{
		openOffice(docInfo, openInNewPage, preview);
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
    $.ajax({
        url : "/DocSystem/Doc/getDocOfficeLink.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: docInfo.vid,
            path: docInfo.path,
            name: docInfo.name,
            commitId: docInfo.commitId,
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
            	else
                {
            		if(openInNewPage != "openInNewPage")
            		{
            			docInfo.fileLink = ret.data;
            		}
            		showOffice(docInfo, openInNewPage);
                }
            }
            else
            {
            	console.log("previewOfficeInDialog getDocOfficeLink Failed");
            	showText(docInfo, openInNewPage); //ReadOnly 方式显示文件内容
            }
        },
        error : function () {
            //showErrorMessage("文件预览失败：服务器异常");
            console.log("previewOfficeInDialog getDocOfficeLink Failed 服务器异常");
            showText(docInfo, openInNewPage); //ReadOnly 方式显示文件内容
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
	  poster: 'xxx', // 视频封面图地址
	  preload: 'auto',
	  autoplay: false,
	  fluid: true, // 自适应宽高
	  language: 'zh-CN', // 设置语言
	  muted: false, // 是否静音
	  inactivityTimeout: false,
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
	          poster: fileLink,
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
	window.open("/DocSystem/web/image.html?" + urlParamStr);
}

function showVideoInNewPage(docInfo, fileLink){
	console.log("showVideoInNewPage docInfo:", docInfo);
	if(fileLink && fileLink != "")
	{
		docInfo.fileLink = fileLink;
	}
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/video.html?" + urlParamStr);
}

function showZipInNewPage(docInfo)
{
	console.log("showZipInNewPage docInfo:", docInfo);
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/zip.html?" + urlParamStr);
}

function showPdfInNewPage(docInfo, fileLink)
{
	console.log("showPdfInNewPage docInfo:", docInfo);
	if(fileLink && fileLink != "")
	{
		docInfo.fileLink = fileLink;
	}
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/pdf.html?" + urlParamStr);
}

function showMarkdownInNewPage(docInfo)
{
	console.log("showMarkdownInNewPage docInfo:", docInfo);
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	window.open("/DocSystem/web/markdown.html?" + urlParamStr);
}

function showTextInNewPage(docInfo, openType)
{
	console.log("showTextInNewPage docInfo:", docInfo);
	var urlParamStr = buildRequestParamStrForDoc(docInfo);
	if(openType && openType == "textViewer")
	{
		window.open("/DocSystem/web/text.html?" + urlParamStr);
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
	bootstrapQ.dialog({
		id: "ImgViewer",
		title: docInfo.name,
		url: 'imgViewer.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		mstyle: getDialogStyle(),
		callback: function(){
			ImgViewer.imgViewerPageInit(docInfo);
		},
	});
}

function showImgInArtDialog(docInfo)
{
	console.log("showImgInArtDialog docInfo:", docInfo);
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();	
	var d = dialog({
		id: "ImgViewer"  + docInfo.docId,
		title: docInfo.name,
		url: 'imgViewerForArt.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
		onshow: function(){
			console.log('onshow');
		},
		oniframeload: function () {
			console.log('oniframeload');
		},
	});
	d.show();

	//等待页面加载好了再获取
	setTimeout(function (){
		var isMax = false;
		
		var oDiv = document.getElementById("title:ImgViewer"  + docInfo.docId);
		oDiv.ondblclick=function(ev){
	    	console.log("DB Clicked on " +"ImgViewer"  + docInfo.docId);
			if(isMax)
			{
				var height =  getArtDialogInitHeight();
				var width = getArtDialogInitWidth();
				
				isMax = false;
				d.width(width);
				d.height(height);	
			}
			else
			{
				//最大化
				var height =  getArtDialogMaxHeight();
				var width = getArtDialogMaxWidth();
				isMax = true;
				d.width(width);
				d.height(height);		
			}	
		}
	}, 100);
	
}

function showVideoInDialog(docInfo){
	console.log("showVideoInDialog docInfo:", docInfo);
	bootstrapQ.dialog({
		id: "VideoViewer",
		title: docInfo.name,
		url: 'videoViewer.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		mstyle: getDialogStyle(),
		callback: function(){
			VideoViewer.videoViewerPageInit(docInfo);
		},
	});
}

function showVideoInArtDialog(docInfo)
{
	console.log("showVideoInArtDialog docInfo:", docInfo);
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();	
	var d = dialog({
		id: "VideoViewer"  + docInfo.docId,
		title: docInfo.name,
		url: 'videoViewerForArt.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
		onshow: function(){
			console.log('onshow');
		},
		oniframeload: function () {
			console.log('oniframeload');
		},
	});
	d.show();

	//等待页面加载好了再获取
	setTimeout(function (){
		var isMax = false;
		
		var oDiv = document.getElementById("title:VideoViewer"  + docInfo.docId);
		oDiv.ondblclick=function(ev){
	    	console.log("DB Clicked on " +"VideoViewer"  + docInfo.docId);
			if(isMax)
			{
				var height =  getArtDialogInitHeight();
				var width = getArtDialogInitWidth();
				
				isMax = false;
				d.width(width);
				d.height(height);	
			}
			else
			{
				//最大化
				var height =  getArtDialogMaxHeight();
				var width = getArtDialogMaxWidth();
				isMax = true;
				d.width(width);
				d.height(height);		
			}	
		}
	}, 100);
	
}

function showZipInDialog(docInfo)
{
	bootstrapQ.dialog({
		id: "ZipViewer",
		title: docInfo.name,
		url: 'zipViewer.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		mstyle: getZipDialogStyle(),
		callback: function(){
			ZipViewer.zipViewerPageInit(docInfo);
		},
	});
}

function showZipInArtDialog(docInfo)
{	
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();	
	var d = dialog({
		id: "ZipViewer"  + docInfo.docId,
		title: docInfo.name,
		url: 'zipViewerForArt.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
		onshow: function(){
			console.log('onshow');
		},
		oniframeload: function () {
			console.log('oniframeload');
			$(".ui-dialog-content").find("iframe").attr("scrolling", "auto");
		},
	});
	d.show();

	//等待页面加载好了再获取
	setTimeout(function (){
		var isMax = false;
		
		var oDiv = document.getElementById("title:ZipViewer"  + docInfo.docId);
		oDiv.ondblclick=function(ev){
	    	console.log("DB Clicked on " +"ZipViewer"  + docInfo.docId);
			if(isMax)
			{
				var height =  getArtDialogInitHeight();
				var width = getArtDialogInitWidth();
				
				isMax = false;
				d.width(width);
				d.height(height);	
			}
			else
			{
				//最大化
				var height =  getArtDialogMaxHeight();
				var width = getArtDialogMaxWidth();
				isMax = true;
				d.width(width);
				d.height(height);		
			}	
		}
	}, 100);
}

function showPdfInDialog(docInfo)
{
	bootstrapQ.dialog({
		id: "PdfViewer",
		title: docInfo.name,
		url: 'pdfViewer.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		mstyle: "width:95%;height:95%;",
		callback: function(){
			PdfViewer.pdfViewerPageInit(docInfo);
		},
	});
}

function showPdfInArtDialog(docInfo)
{	
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();	
	var d = dialog({
		id: "PdfViewer"  + docInfo.docId,
		title: docInfo.name,
		url: 'pdfViewerForArt.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
		onshow: function(){
			console.log('onshow');
		},
		oniframeload: function () {
			console.log('oniframeload');
		},
	});
	d.show();

	//等待页面加载好了再获取
	setTimeout(function (){
		var isMax = false;
		
		var oDiv = document.getElementById("title:PdfViewer"  + docInfo.docId);
		oDiv.ondblclick=function(ev){
	    	console.log("DB Clicked on " +"PdfViewer"  + docInfo.docId);
			if(isMax)
			{
				var height =  getArtDialogInitHeight();
				var width = getArtDialogInitWidth();
				
				isMax = false;
				d.width(width);
				d.height(height);	
			}
			else
			{
				//最大化
				var height =  getArtDialogMaxHeight();
				var width = getArtDialogMaxWidth();
				isMax = true;
				d.width(width);
				d.height(height);		
			}	
		}
	}, 100);
}

function showPdfInDialog(docInfo)
{
	bootstrapQ.dialog({
		id: "PdfViewer",
		title: docInfo.name,
		url: 'pdfViewer.html',
		msg: '页面正在加载，请稍等...',
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
		id: "MdViewer",
		title: docInfo.name,
		url: 'mdViewer.html',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		mstyle: getDialogStyle(),
		callback: function(){
			MdViewer.mdViewerPageInit(docInfo);
		},
	});
}

function showTextInDialog(docInfo, openType)
{
	console.log("showTextInDialog docInfo.docId:" + docInfo.docId);
	if(openType && openType == "textViewer")
	{
		bootstrapQ.dialog({
			id: "textViewer",
			title: docInfo.name,
			url: 'textViewer.html',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: true,
			mstyle: getDialogStyle(),
			callback: function(){
				TextViewer.textViewerPageInit(docInfo);
			},
		});
	}
	else
	{
		bootstrapQ.dialog({
			id: "AceEditor",
			title: docInfo.name,
			url: 'aceEditor.html',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: true,
			mstyle: getDialogStyle(),
			callback: function(){
				TextEditor.textEditorPageInit(docInfo);
			},
		});
	}
}

function showTextInArtDialog(docInfo, openType)
{
	console.log("showTextInArtDialog docInfo.docId:" + docInfo.docId);
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();	
	if(openType && openType == "textViewer")
	{
		var d = dialog({
			id: "textViewer"  + docInfo.docId,
			title: docInfo.name,
			url: 'textViewerForArt.html',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: true,
			padding: 0,
			width: width,
			height: height,
			resize: true,
			drag: true,
			data: docInfo,
			onshow: function(){
				setTimeout(function () {
					TextViewer.textViewerPageInit(docInfo);
				}, 2000);
			},
		});
		d.show();
	}
	else
	{
		var d = dialog({
			id: "AceEditor"  + docInfo.docId,
			title: docInfo.name,
			url: 'aceEditorForArt.html',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: true,
			padding: 0,
			width: width,
			height: height,
			resize: true,
			drag: true,
			data: docInfo,
			onshow: function(){
				console.log('onshow');
			},
			oniframeload: function () {
				console.log('oniframeload');
			},
		});
		d.show();
		
		//等待页面加载好了再获取
		setTimeout(function (){
			var isMax = false;
			
			var oDiv = document.getElementById("title:AceEditor"  + docInfo.docId);
			oDiv.ondblclick=function(ev){
		    	console.log("DB Clicked on " +"AceEditor"  + docInfo.docId);
				if(isMax)
				{
					var height = getArtDialogInitHeight();
					var width = getArtDialogInitWidth();
					
					isMax = false;
					d.width(width);
					d.height(height);	
				}
				else
				{
					//最大化
					var height =  getArtDialogMaxHeight();
					var width = getArtDialogMaxWidth();
					isMax = true;
					d.width(width);
					d.height(height);		
				}	
			}
		}, 100);
	}
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
		url: 'officeEditor.jsp',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		mstyle: "width:95%;height:95%;",
		callback: function(){
			setTimeout(function (){OfficeEditor.officeEditorPageInit(docInfo)}, 2000); 
		},
	});
}

function showOfficeInArtDialog(docInfo)
{	
	//获取窗口的高度并设置高度
	var height =  getArtDialogInitHeight();
	var width = getArtDialogInitWidth();	
	var d = dialog({
		id: "OfficeEditor"  + docInfo.docId,
		title: docInfo.name,
		url: 'officeEditorForArt.jsp',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
		padding: 0,
		width: width,
		height: height,
		resize: true,
		drag: true,
		data: docInfo,
		onshow: function(){
			console.log('onshow');
		},
		oniframeload: function () {
			console.log('oniframeload');
		},
	});
	d.show();

	//等待页面加载好了再获取
	setTimeout(function (){
		var isMax = false;
		
		var oDiv = document.getElementById("title:OfficeEditor"  + docInfo.docId);
		oDiv.ondblclick=function(ev){
	    	console.log("DB Clicked on " +"OfficeEditor"  + docInfo.docId);
			if(isMax)
			{
				var height =  getArtDialogInitHeight();
				var width = getArtDialogInitWidth();
				
				isMax = false;
				d.width(width);
				d.height(height);	
			}
			else
			{
				//最大化
				var height =  getArtDialogMaxHeight();
				var width = getArtDialogMaxWidth();
				isMax = true;
				d.width(width);
				d.height(height);		
			}	
		}
	}, 100);
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