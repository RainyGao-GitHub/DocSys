<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String ttt = basePath + "webPages/pages/tianTianTou/";
String staticFilesPath = "//static.gofreeteam.com/";
%>
<!DOCTYPE html>
<html>

<head>
	<meta http-equiv="Content-Type" content="text/html" charset="UTF-8" />
	<meta name="renderer" content="webkit">
	<title>添加文档-自由团队-IT产品开发外包平台</title>
	<meta name="keywords" content="IT兼职，自由团队" />
	<meta name="description" content="自由团队是一个专业高效的免费创业IT外包服务平台，致力于通过创业IT外包数据服务降低创业者和投资人的综合时间成本、提升整个社会的创业IT外包效率，从而创造新的社会价值！" />
	<meta http-equiv="x-ua-compatible" content="ie=8" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
</head>
<body>
	<div class="container">
		<form action="order/uploadDocument.do" method="POST">
			<input type="hidden" name="orderId" value="${order.id}"/>
			<div class="form-group">
				<label class="col-xs-3">标题：</label>
				<div class="col-xs-6">
				
				</div>
			</div>
			
			<input type="text" class="form-control" name="title" placeholder="文档标题"/>
			<textarea rows="5" class="form-control" name="note" maxlength="200" placeholder="请添加文档描述"></textarea>
		</form>
		<input type="file" id="documentFile" name="file" onchange="saveFile(this);"/>
	</div>
</body>
</html>