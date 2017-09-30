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
	<title>改价</title>
	<script type="text/javascript" src="<%=ttt%>/js/jquery/jquery.validate.min.js"/>
	<script type="text/javascript" src="<%=ttt%>/js/jquery/messages_zh.js"/>
</head>
	
<body>
	<form id="changePriceForm" action="order/changePrice.do" method="post">
		<h5 style="color:#A3A3A3;margin: 10px 0px;">订单价格只能修改一次，是否确定要修改订单价格？</h5>
		<div class="form-group row">
			<label class="col-xs-3 p5">价格：</label>
			<div class="col-xs-9">
				<span id="prePriceText">1</span>
			</div>
		</div>
		<div class="form-group row">
			<label class="col-xs-3 p5">改后价格：</label>
			<div class="col-xs-6">
				<input type="text" class="form-control" name="price" id="newPrice"/>
			</div>
		</div>
	</form>
<script type="text/javascript">
	
</script>
</body>
</html>