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
	<title>建议与反馈</title>
	<script type="text/javascript" src="<%=ttt%>/js/jquery/jquery.validate.min.js"/>
	<script type="text/javascript" src="<%=ttt%>/js/jquery/messages_zh.js"/>
	<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/resetV2.css" type="text/css" media="screen" />
	
</head>
	
<body>
	<form id="suggestForm" action="suggest/addSuggest.do" method="post">
		<h5 style="color:#A3A3A3;margin: 10px 0px;">您对平台有任何建议，或使用中遇到任何问题，都可以在本页面反馈。以帮助我们提供给您更优质、更贴心的服务！
		</h5>
		<div class="form-group">
			<textarea maxlength="500" rows="5" resizeable="false" class="form-group" required="required"></textarea>
		</div>
	</form>
</body>
</html>