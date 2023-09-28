<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html lang="en">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>系统引导</title>
</head>
<body>
	<p id="dispInfo">系统初始化中,请稍候...</p>
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

var langType = "ch";
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

function getCookie(c_name){
	//判断document.cookie对象里面是否存有cookie
	if (document.cookie.length <= 0)
	{
		return "";
	}
  	
	var c_start = document.cookie.indexOf(c_name + "=");
	//如果document.cookie对象里面有cookie则查找是否有指定的cookie，如果有则返回指定的cookie值，如果没有则返回空字符串
  	if (c_start!=-1)
  	{ 
    	c_start = c_start + c_name.length + 1; 
    	c_end = document.cookie.indexOf(";",c_start);
    	if (c_end==-1)
    	{
    		c_end=document.cookie.length;
  		}
    	return unescape(document.cookie.substring(c_start,c_end))
   	}
	return ""
}

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
	switch(langType)
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

function pageInit()
{
	console.log("pageInit");
	langType = getBrowserLang();
	
	if(docSysInitState == null || docSysInitState == 0)
	{
		window.location.href='/DocSystem/web/index' + langExt + '.html';
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
            		window.location.href='/DocSystem/web/install' + langExt + '.html?authCode='+docSysInitAuthCode;
            	}
            	else
            	{
            		//进入系统主页
            		window.location.href='/DocSystem/web/index' + langExt + '.html';
            	}
            }
            else
            {
            	alert(_Lang("系统初始化失败", " : " , ret.msgInfo));
        		window.location.href='/DocSystem/web/install' + langExt + '.html?authCode='+docSysInitAuthCode;
            }
        },
        error : function () {
        	alert(_Lang("系统初始化失败", " : ", "服务器异常"));
    		window.location.href='/DocSystem/web/install' + langExt + '.html?authCode='+docSysInitAuthCode;
       }
    });
}
</script>

</html>