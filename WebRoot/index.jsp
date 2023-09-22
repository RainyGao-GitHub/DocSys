<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>System Init</title>
</head>
<body>
	<p id="dispInfo">System Init...</p>
</body>

<script src="web/static/scripts/jquery.min.js" type="text/javascript"></script>
<script src="web/static/scripts/jquery.form.js" type="text/javascript"></script>
<script language="javascript" type="text/javascript"> 
<%
Integer docSysInitState = BaseController.getDocSysInitState();
String docSysInitAuthCode = BaseController.getDocSysInitAuthCode();
String serverIP = BaseController.getServerIP();
System.out.println("index.jsp: docSysInitState:" + docSysInitState + " docSysInitAuthCode:" + docSysInitAuthCode);
%>

var docSysInitState=<%=docSysInitState%>;
var docSysInitAuthCode=<%=docSysInitAuthCode%>;
var serverIP= "<%=serverIP%>";

$(function () {
	pageInit();
});

function _Lang(str1, connectStr , str2)
{
	if(connectStr == undefined)
	{
		return lang(str1);
	}
	
	return lang(str1) + connectStr + lang(str2);
}

function lang(str)
{
	switch(lang)
	{
	case "en":
		return translateToEnglish(str);
	}
	return str;
}

function translateToEnglish(str)
{
	var translateMap = 
	{
		"服务器异常" : "Server Exception",			
		"系统初始化中,请稍候"	: "Systemt Init...",		
		"系统初始化失败" : "System Init Failed",
	};
	
	var newStr = translateMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}

function getBrowserLang() 
{
	var browserLang = navigator.language? navigator.language : navigator.browserLanguage;
	switch(browserLang.toLowerCase())
	{
	case "us":
		console.log("us");
		return "en";
	case "en":
		console.log("en");
		return "en";
	case "en_us":
		console.log("en_us");
		return "en";
    case "zh-tw":
        console.log("中文繁体(中国台湾)");
    	return "ch";
    case "zh-hk":
    	console.log("中文繁体(中国香港)");
    	return "ch";
    case "zh-cn":
    	console.log("中文简体");
    	return "ch";
    default:
        break;
	}
	return "ch";
}

function goToSystemIndexPage()
{
	switch(lang)
	{
	case "en":
		window.location.href='/DocSystem/web/index_en.html';
		break;
	case "ch":
		window.location.href='/DocSystem/web/index.html';
		break;
	default:
		window.location.href='/DocSystem/web/index.html';
		break;
	}
}

function goToSystemInstallPage()
{
	switch(lang)
	{
	case "en":
		window.location.href='/DocSystem/web/install_en.html?authCode='+docSysInitAuthCode;
		break;
	case "ch":
		window.location.href='/DocSystem/web/install.html?authCode='+docSysInitAuthCode;
		break;
	default:
		window.location.href='/DocSystem/web/install.html?authCode='+docSysInitAuthCode;
		break;
	}
}

var lang = "ch";
function pageInit()
{
	console.log("pageInit");
	lang = getBrowserLang();
	
	if(docSysInitState == null || docSysInitState == 0)
	{
		goToSystemIndexPage();
	}
	else
	{
		docSysInit();
		//更新显示
		setTimeout(function () {
			updateDispInfo();
		},500);	//update 500ms later
	}
}

var count = 0;
var dispInfo = _Lang("系统初始化中,请稍候");
function updateDispInfo()
{	
	if(count > 3)
	{
		count = 0;
		dispInfo = _Lang("系统初始化中,请稍候");
	}
	else
	{
		count++;
		dispInfo = dispInfo + "...";		
	}
	$('#dispInfo').text(dispInfo);
	
	setTimeout(function () {
		updateDispInfo(); //reEnter uploadDoc
	},500);	//check it 500ms later
}

function docSysInit()
{
	console.log("docSysInit");
	$.ajax({
        url : "/DocSystem/Manage/docSysInit.do",
        type : "post",
        dataType : "json",
        data : {
        	authCode: docSysInitAuthCode,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	if(ret.data && ret.data == "needRestart")
            	{
            		goToSystemInstallPage();
            	}
            	else
            	{
            		//进入系统主页
            		goToSystemIndexPage();
            	}
            }
            else
            {
            	alert(_Lang("系统初始化失败", ":" , ret.msgInfo));
            	goToSystemInstallPage();
            }
        },
        error : function () {
        	alert(_Lang("系统初始化失败", ":", "服务器异常"));
        	goToSystemInstallPage();
       }
    });
}
</script>

</html>