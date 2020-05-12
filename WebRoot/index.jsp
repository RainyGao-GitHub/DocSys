<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<title>系统引导</title>
</head>
<body>
</body>

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
if(docSysInitState == null || docSysInitState == 0)
{
	// 以下方式直接跳转
	window.location.href='/DocSystem/web/index.html';
	// 以下方式定时跳转
	//setTimeout("javascript:location.href='index.html'", 5000);
}
else
{
	window.location.href='/DocSystem/web/install.html?authCode='+docSysInitAuthCode;
}
</script>

</html>