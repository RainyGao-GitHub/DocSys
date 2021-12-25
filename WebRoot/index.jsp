<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>系统引导</title>
</head>
<body>
	<p>系统初始化中,请稍候...</p>
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

function pageInit()
{
	console.log("pageInit");
	if(docSysInitState == null || docSysInitState == 0)
	{
		// 以下方式直接跳转
		window.location.href='/DocSystem/web/index.html';
		// 以下方式定时跳转
		//setTimeout("javascript:location.href='index.html'", 5000);
	}
	else
	{
		docSysInit();
	}
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
            		showErrorMessage("数据库配置有变更，请先重启服务！");	
            	}
            	else
            	{
            		//进入系统主页
            		window.location.href='/DocSystem/web/index.html';
            	}
            }
            else
            {
	        	//showErrorMessage("系统初始化失败:" + ret.msgInfo);
            	console.log("系统初始化失败:" + ret.msgInfo);
            	window.location.href='/DocSystem/web/install.html?authCode='+docSysInitAuthCode;
            }
        },
        error : function () {
        	console.log("系统初始化失败:服务器异常");
        	window.location.href='/DocSystem/web/install.html?authCode='+docSysInitAuthCode;
       }
    });
}
</script>

</html>