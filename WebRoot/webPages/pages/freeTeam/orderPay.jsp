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
	<title>确认支付信息</title>
	<meta name="keywords" content="自由团队，IT兼职，外包平台" />
	<meta name="description" content="自由团队是一个专业高效的免费找外包，专业人才和服务的平台，致力于通过互联网将IT行业的专业人才汇聚一起、共同实现创业和发挥自己的更多价值。" />
	<meta http-equiv="x-ua-compatible" content="ie=8" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
	<script type="text/javascript" src="<%=ttt%>/js/jquery/messages_zh.js"/>
</head>

<body>
	<form id="payForm" action="alipay/alipayTest.do" method="post" enctype="multipart/form-data" target="_blank">
		<c:if test="${type eq 0}">
			<input name="WIDsubject" class="hidden" value="购买服务费用"/>
			<input id="WIDtotal_fee" name="WIDtotal_fee" class="hidden" value="${payAmount}"/>
			<%-- <input name="WIDbody" class="hidden" value="《${ser.name }》服务费"/> --%>
			<input name="WIDshow_url" class="hidden" value="www.gofreeteam.com"/>
			<input name="orderId" class="hidden" value="${order.id}"/>
		</c:if> 
		<c:if test="${type eq 1}">
			<input name="WIDsubject" class="hidden" value="支付承接项目费用"/>
			<input id="WIDtotal_fee" name="WIDtotal_fee" class="hidden" value="${payAmount}"/>
			<input name="WIDbody" class="hidden" value="《${prj.name }》服务费"/>
			<input name="WIDshow_url" class="hidden" value="www.gofreeteam.com"/>
			<input name="orderId" class="hidden" value="${order.id}"/>
		</c:if>
		<c:if test="${type eq 2 }">
			<input name="WIDsubject" class="hidden" value="自由团队账户充值"/>
			<input name="WIDbody" class="hidden" value="自由团队账户充值"/>
			<input name="WIDshow_url" class="hidden" value="www.gofreeteam.com"/>
			<input name="orderId" class="hidden" value="-1"/>
			
			<div class="form-group row">
				<label class="col-xs-3">订单描述：</label>
				<div class="col-xs-7">
					<span>自由团队账户充值</span>
				</div>
			</div>
			
			<hr style="margin: 10px 0px;"/>
			
			<div class="form-group row">
				<label class="col-xs-3 mt10">充值金额：</label>
				<div class="col-xs-7">
					<span><input type="text" class="form-control" name="WIDtotal_fee" required="required" isAmount="isAmount" maxlength="11" max="99999999"/></span>
				</div>
			</div>
			
			<hr style="margin: 10px 0px;"/>
			
			<div class="form-group row">
				<label class="col-xs-3 mt15">支付方式：</label>
				<div class="col-xs-7">
					<p>
						<input type="radio" name="payType" checked="checked" value="alipay"/>
						<img width="60px;" src="<%=basePath%>/webPages/images/alipayLogo.png">
					</p>
				</div>
			</div>
		</c:if>
		
		<c:if test="${type ne 2}">
			<!-- <h5 style="color:#A3A3A3">购买服务支付</h5> -->
			
			<div class="form-group row">
				<label class="col-xs-3">当前阶段：</label>
				<div class="col-xs-7">
					<span>${planNode.name}</span>
				</div>
			</div>
			<hr style="margin: 10px 0px;"/>
			<div class="form-group row">
				<label class="col-xs-3">需付金额：</label>
				<div class="col-xs-7">
					<span><b style="color: #f83;">${payAmount}元</b>&nbsp;(总费用的${planNode.amountPercent}%)</span>
				</div>
			</div>
			<hr style="margin: 10px 0px;"/>
			<div class="form-group row" id="payType">
				<label class="col-xs-3">支付方式：</label>
				<div class="col-xs-7">
					<p>
						<input type="radio" name="payType" checked="checked" value="alipay"/>
						<img width="60px;" src="<%=basePath%>/webPages/images/alipayLogo.png">
					</p>
					<div style="margin: 5px;"/>
					<p>
						<input type="radio" ${user.banlance ge payAmount?"":"disabled='disabled'"} name="payType" value="acc"/>
						<span class="p5">账户余额<small>（余额：${user.banlance}元）</small></span>
						<c:if test="${user.banlance lt payAmount}">
							<span style="color:red">(余额不足)</span>
						</c:if>
					</p>
				</div>
			</div>
			<hr style="margin: 10px 0px;"/>
			<div class="form-group row">
				<label class="col-xs-3">订单描述：</label>
				<div class="col-xs-7">
					<input type="hidden" name="note" value=""/>
					<c:if test="${type eq 0}">
						<textarea id="note" name="WIDbody" class="form-control" rows="3">《${ser.name }》服务费</textarea>
					</c:if>
					<c:if test="${type eq 1}">
						<%-- <span>《${prj.name}》服务费</span> --%>
						<textarea  id="note" name="WIDbody" class="form-control" rows="3">《${prj.name }》服务费</textarea>
					</c:if>
				</div>
			</div>
			
		</c:if>
		
		
		<div class="form-group row text-center">
			<input id="submitPay" type="submit" class='mybtn-primary hidden' value="确认"/>
		</div>
		
	</form>
	<script type="text/javascript">
		 // 电话号码验证    
	    jQuery.validator.addMethod("isAmount", function(value, element) {    
	      if(!isNaN(value) && value<999999999 && value>0){
	    	  return true;
	      }else{
	    	  return false;
	      }
	    }, "请填写正确的金额格式");
	</script>
</body>
</html>