<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String ttt = basePath + "webPages/pages/tianTianTou/";
String staticFilesPath = "//static.gofreeteam.com/";
%>
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html" charset="UTF-8" />
	<meta name="renderer" content="webkit">
	<title>支付宝测试</title>
</head>
	
<body>
	<form action="alipay/alipayTest.do" method="post" enctype="multipart/form-data">
		<input name="WIDsubject" value="测试订单"/>
		<input name="WIDtotal_fee" value="0.01"/>
		<input name="WIDbody" value="这是一笔测试订单"/>
		<input name="WIDshow_url" value="www.gofreeteam.com"/>
		<input name="userId" value="1"/>
		
		<input type="submit" value="提交"/>
	</form>
</body>
</html>