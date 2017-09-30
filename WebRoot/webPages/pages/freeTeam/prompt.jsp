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
	<title>带输入框的弹出框-自由团队-IT产品开发外包平台</title>
	<meta name="keywords" content="IT兼职，自由团队" />
	<meta name="description" content="自由团队是一个专业高效的免费创业IT外包服务平台，致力于通过创业IT外包数据服务降低创业者和投资人的综合时间成本、提升整个社会的创业IT外包效率，从而创造新的社会价值！" />
	<meta http-equiv="x-ua-compatible" content="ie=8" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
	<link rel="stylesheet" href="<%=basePath %>webPages/css/style.css" />
	<link rel="stylesheet" href="<%=basePath %>webPages/css/commonCss.css" />
	<!--common.js功能：
		1.计算文本域可输入字数；2.页面上的浮动DIV；3.获取当前窗口大小，滚动条等坐标
		4.鼠标经过图片将图片放大。
	-->
	<!-- jquery-1.11.1 -->
	<!-- bootstrap3.0 js and css -->
	<script type="text/javascript" src="<%=basePath%>/webPages/js/qiao.js"></script>
	<script type="text/javascript" src="<%=basePath%>/webPages/js/web.js"></script>
	<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/messages_zh.js"></script>
	
	<!-- 这个里面修复了发送中文是乱码的问题 -->
	<script src="<%=basePath%>webPages/js/jquery.form.js"></script>
</head>
<body>
	<div class="row">
		<div class="col-xs-12">
			<c:if test="${not empty helpTxt}">
				<!-- 输入框提示语 -->
				<h5 style="color:#A3A3A3">${helpTxt}</h5>
			</c:if>
			<textarea rows="3" class="form-control" style="resize: none;" maxlength="500" id="promptTxt"></textarea>
		</div>
	</div>
</body>

</html>