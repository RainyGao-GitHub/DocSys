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
	<title>提现</title>
	<meta name="keywords" content="自由团队，IT兼职，外包平台" />
	<meta name="description" content="自由团队是一个专业高效的免费找外包，专业人才和服务的平台，致力于通过互联网将IT行业的专业人才汇聚一起、共同实现创业和发挥自己的更多价值。" />
	<meta http-equiv="x-ua-compatible" content="ie=8" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
	<script type="text/javascript" src="<%=ttt%>/js/jquery/messages_zh.js"/>
</head>

<body>
	<form id="chargeForm" action="account/charge.do" method="post">		
		<div class="form-group row">
			<label class="col-xs-3">账户金额：</label>
			<div class="col-xs-7">
				<span>${loginUser.banlance} </span>
			</div>
		</div>
		
		<hr style="margin: 10px 0px;"/>
		
		<div class="form-group row">
			<label class="col-xs-3 mt10">提现金额：</label>
			<div class="col-xs-7">
				<!-- <span><input type="text" class="form-control" name="money" required="required" isAmount="isAmount" maxlength="11" min=5 max="99999999"/></span> -->
				<span><input type="text" class="form-control" name="money" required="required" isAmount="isAmount" maxlength="11" max="99999999"/></span>
			</div>
		</div>
		
		<hr style="margin: 10px 0px;"/>

		<div class="form-group row">
			<label class="col-xs-3">收款账号：</label>
			<div class="col-xs-7">
				<select class="form-control" name="accountNo" accountRequired="true">
					<c:if test="${empty accountList}">
						<option>未设置收款账号</option>
					</c:if>
					<c:if test="${not empty accountList}">
						<c:forEach items="${accountList}" var="item" varStatus="status">
							<option value="${item.accountNo}">${item.accountNo}  [支付宝]</option>
						</c:forEach>
					</c:if>
				</select>
			</div>
			<div class="col-xs-2 p5">
				<a href="pageTo.do?p=accountSetting" target="_blank" style="color:#f80">设置</a>
			</div>
		</div>
		
		<hr style="margin: 10px 0px;"/>
		
		<div class="form-group row">
			<label class="col-xs-3">提示：</label>
			<div class="col-xs-7">
				<span>预计1-2个工作日到账</span>
			</div>
		</div>
		<div class="form-group row text-center">
			<input id="submitPay" type="submit" class='mybtn-primary hidden' value="确认"/>
		</div>
		
	</form>
	<script type="text/javascript">
		 // 电话号码验证    
	    jQuery.validator.addMethod("isAmount", function(value, element) {    
	      if(!isNaN(value) && value<99999999 && value>0){
	    	  return true;
	      }else{
	    	  return false;
	      }
	    }, "请填写正确的金额格式");
		 
	    // 电话号码验证    
	    jQuery.validator.addMethod("accountRequired", function(value, element) {    
	      var options = $(element).find("option");
	      if(options&&options.size()==1){
	    	  var v = options.eq(0).attr("value");
	    	  if(v){
	    		  return true;
	    	  }else{
	    		  return false;
	    	  }
	      }
	      
	      
	    }, "未设置收款账号");
	</script>
</body>
</html>