/*
 ** 文件内容获取接口 **
 ** 文件链接获取接口 **
 ** 文件尾缀获取与文件类型判断接口 **
 ** 对话框操作接口 **
 ** 提示对话框接口 **
 * */

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

	return docInfo;
}

//获取文件链接接口
function getDocFileLink(docInfo, successCallback, errorCallback, urlStyle)
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

//获取文件链接接口(链接带officeEditorAuthCode)
function getDocOfficeLink(docInfo, successCallback, errorCallback)
{	
	var fileLink = "";
	var errorInfo = "";
	console.log("getDocOfficeLink()  docInfo:", docInfo);
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
            shareId: docInfo.shareId,
            preview: "office",
        },
        success : function (ret) {
        	console.log("getDocOfficeLink ret",ret);
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

//文件文本内容获取接口
function getDocText(docInfo, successCallback, errorCallback)
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
                docId : docInfo.id,
                pid: docInfo.pid,
                path: docInfo.path,
                name: docInfo.name,
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
	            	                docType: 1, //取回文件内容
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

function getDocDownloadLink(docInfo)
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
	var docLink = "/DocSystem/Doc/downloadDoc.do?targetPath=" + targetPath + "&targetName=" + targetName;
	
	if(gShareId)
	{
		docLink += "&shareId="+gShareId;
	}
	return docLink;
}

function getDocDownloadFullLink(docInfo)
{
	var docLink = getDocDownloadLink(docInfo);
	var url =  buildFullLink(docLink);
	return url;
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

//弹出对话框操作接口
function closeBootstrapDialog(id){ 
	$("#"+id + "div").remove();	//删除全屏遮罩
	$("#"+id).remove();	//删除对话框
}

//提示对话框
function showErrorMessage($msg) {
	qiao.bs.alert($msg);
}