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
		<title>购买服务</title>
		<meta name="keywords" content="自由团队，IT兼职，外包平台" />
		<meta name="description" content="自由团队是一个专业高效的免费找外包，专业人才和服务的平台，致力于通过互联网将IT行业的专业人才汇聚一起、共同实现创业和发挥自己的更多价值。" />
		<meta http-equiv="x-ua-compatible" content="ie=8" />
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/resetV2.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap-theme.min.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.comm.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.custom.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-fonts/css/font-awesome.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath %>webPages/js/select2/css/select2.min.css" />
		
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/styleV2.css" type="text/css" media="screen" />
		
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		
		<link rel="stylesheet" href="<%=basePath%>/webPages/pages/tianTianTou/css/freeteam.css" />
		<link rel="stylesheet" href="<%=basePath%>/webPages/js/ystep/css/ystep.css" />
	</head>

	<body class="whitesmoke-bg">
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		<div class="bgcolor">
			<div class="subnav">
				<div class="container">
					<ul class="nav-pills f-left">
						<li class="name">推荐</li>
						<li><a href="chipPage.do?p=tianTianTou/prj_workflow">项目承接流程图</a></li>
						<li><a href="chipPage.do?p=tianTianTou/ser_workflow">服务购买流程图</a></li>
					</ul>
					<c:if test="${empty freeteam_user}">
						<ul class="nav-pills f-right">
							<li class="name"><a href="#">忘记密码？点我找回</a></li>
						</ul>
					</c:if>
				</div>
			</div>
		</div>
		<jsp:include page="head.jsp"></jsp:include>
		
		<div class="container" style="margin-top: 30px;background: white;">
			
			<div class="row white-bg p20_0">
				<div class="row">
					<div class="col-xs-8" style="padding: 0px 20px;">
						<h4 class="darkred">
							<div style="display: inline-block;" >
								<i class="glyphicon glyphicon-exclamation-sign red mr20 f20"></i>
							</div>
							订单信息（服务购买）
						</h4>
					</div>
					<!-- <div class="col-xs-4">
						<div>
							<p><b>买家已支付</b></p>
							<p>
								<div class="progress">
								  <div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 0%;">
								    0元
								  </div>
								</div>
							</p>
						</div>
						
					</div> -->
					
				</div>
				<hr class="m5"/>
				<div  class="row">
					<div class="col-xs-8">
					<form id="form1" action="order/saveOrder.do" method="post" enctype="multipart/form-data">
						<input id="planId" name="planId" type="hidden" value="${ser.planId}"/>
						<input id="type" name="type" type="hidden" value="0"/>
						<input id="linkId" name="linkId" type="hidden" value="${ser.id}"/>
						<input id="currentPlan" name="currentPlan" type="hidden" value="${ser.planId}"/>
						<input id="seller" name="seller" type="hidden" value="${ser.publisher}"/>
						
						<div id="page1" class="clearfix">
							<div class="col-xs-11">
								<div class="row form-group m10">
									<label class="col-xs-3 control-label">订单编号:</label>
									<div class="col-xs-9">
										<input id="orderId" type="hidden" name="id" value="${orderId}"/>
										 <span class="p0_10">${orderId}</span>
									</div>
								</div>
								
								<div class="row form-group m10">
									<label class="col-xs-3 control-label">价格:</label>
									<div class="col-xs-9  p0">
										<input type="hidden" id="hid_startPrice" value="${ser.startPrice}"/>
										<input type="hidden" id="hid_endPrice" value="${ser.endPrice}"/>
										<input type="text" class="form-control" id="hid_price" name="price" maxlength="8" placeholder="请输入您的预算，${ser.startPrice}到${ser.endPrice}之间"/>
										<!-- <p class="formTip">* 预算范围在服务方定义的价格之间</p>-->
									</div>
								</div>
								
								<div class="row form-group m10" style="padding:0px 0px 25px 0px">
									<label class="col-xs-3 control-label mt15">支付方式:</label>
									<div class="col-xs-7 p0">
										<div style="display: inline-block;max-width: 900px;" class="ystep1"></div>
									</div>
								</div>
								
								<div class="row form-group m10">
									<label class="col-xs-3 control-label">备注:</label>
									<div class="col-xs-9  p0">
										<textarea rows="5" id="note" name="note" class="form-control" maxlength="500" placeholder="请简要描述您的需求，方便对方进行报价，如有更详细的需求，请以附件方式上传。"></textarea>
									</div>
								</div>
								
								<div class="row form-group m10">
									<label class="col-xs-3 control-label">附件:</label>
									<div class="col-xs-9 p0">
										<input type="file" name="file" />
										<p class="formTip">* 最多200M,多个文件请压缩后上传。</p>
									</div>
								</div>
								
								<div class="row form-group m10 text-center">
									<a onclick="submitForm(this)" class="mybtn-primary">提交</a>
								</div>
							</div>
						</div>
						
					</form>
					
					
					
				</div>
				
				<div class="col-xs-4">
					<div>
						<div>
							<p><b>服务信息</b></p>
							<div>
								<div style="width: 28%;display: inline-block;vertical-align: top;margin-top: 3%;">
									<img width="90%" style="max-height: 100px;" src='<%=staticFilesPath%>/webPages/upload/service/${empty ser.proLog?"undefined":ser.proLog}' />
								</div>
								<div style="width: 70%;display: inline-block;">
									<p>
										<h5><b><a target="blank" href="toService2.do?id=${ser.id}">${ser.name }</a></b></h5>
									</p>
									<p>
										<span id="Intro" class="cutText2">${ser.intro}</span>
									</p>
								</div>
							</div>
							<p>
								<label style="color: #f83;">${ser.startPrice}-${ser.endPrice}元</label>
								<small class="fRight lightred">好评率:95%</small>
							</p>
						</div>
						<hr />
						
						<div>
							<p><b>服务发布者信息</b></p>
							<p>
								<a target="blank" href="toUserDetail2.do?id=${seller.id}">
									<img width="50px" height="50px" class="img-circle" src='<%=staticFilesPath%>/webPages/upload/headpic/${empty seller.headImg?"undefined":seller.headImg}'>
									${seller.nickName}
								</a>
								<small class="fRight">
									<a class="btn btn-sm btn-default" onclick="initMsgDalog(${seller.id})"><i class="glyphicon glyphicon-send"></i>发消息</a>
								</small>
							</p>
							<p>
								<!-- <span class="lightred p5 glyphicon glyphicon-hand-right"></span>已缴纳保证金：10000元 -->
							</p>
							<p>
								<i class="glyphicon glyphicon-phone p5"></i>${seller.tel}
							</p>
							<p>
								<i class="glyphicon glyphicon-map-marker p5"></i>${seller.area }
								<small class="fRight lightred">等级:★★★★</small>
							</p>
							
						</div>
						<hr />
						<div>
							<p><b>服务购买人信息</b></p>
							<p>
								<a target="blank" href="toUserDetail2.do?id=${buyer.id}">
									<img width="50px" height="50px" class="img-circle" src='<%=staticFilesPath%>/webPages/upload/headpic/${empty buyer.headImg?"undefined":buyer.headImg}'>
									${buyer.nickName}
								</a>
								<small class="fRight">
									<a class="btn btn-sm btn-default" onclick="initMsgDalog(${buyer.id})"><i class="glyphicon glyphicon-send"></i>发消息</a>
								</small>
							</p>
							<p>
								<!-- <span class="lightred p5 glyphicon glyphicon-hand-right"></span>已缴纳保证金：10000元 -->
							</p>
							<p>
								<i class="glyphicon glyphicon-phone p5"></i>${buyer.tel}
							</p>
							<p>
								<i class="glyphicon glyphicon-map-marker p5"></i>${buyer.area }
								<small class="fRight lightred">等级:★★★★</small>
							</p>
							
						</div>
						<hr />
					</div>
					
				</div>
				</div>
				
				
				<!--<form class="form-inline clearfix">
					
					
					
				</form>-->
				
			</div>
		</div>
		
		<script type="text/javascript" src="<%=basePath%>/webPages/js/ystep/js/ystep.js" ></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/qiao.js"></script>
		<script type="text/javascript">
			$(function(){
				var planId = $("#planId").val();
				initPlanByPlanId(planId);
				$("#serIntro").text(cutLongTxt($("#serIntro").text(),100));
			});
			
		
			
			function pay(){
				qiao.bs.dialog({
					url : 'pageTo.do?p=addComment',
				    title : '添加评论',
				    callback: function(){
				        $('#todonatea').text('点击确定按钮会再弹出一个modal（confirm）框~').attr('href','javascript:void(0);');
				    }
				}, function(){
				    qiao.bs.confirm({
				        id: 'bsconfirm',
				        msg: '带回调确认框！'
				    },function(){
				        alert('点击了确定！');
				    },function(){
				        alert('点击了取消！');
				    });
				});
				
			}
			
			function initPlanByPlanId(id){
				var callback = function(data){
					var d = data.obj;
					var d2 = $.map(d,function(row){
						var title = row.name;
						var content = '<p>'+row.content+'</p><p> 付款:'+ row.amountPercent + '%</p>';
						var steptitle = '<p>'+row.amountPercent+'%</p><p class="cutText" style="margin-top: 30px;">'+ row.name + '</p>';
						console.log(row);
						return {title: title, content: content, steptitle:steptitle};
					});
					
					//开发流程
					$(".ystep1").children().remove();
					$(".ystep1").loadStep({
					    //ystep的外观大小
					    //可选值：small,large
					    size: "small",
					    //ystep配色方案
					    //可选值：green,blue
					    color: "green",
					    //ystep中包含的步骤
					    steps: d2
					  });
				}
				
				$.post("plan/findPlanNodesByPlanId.do",{planId: id},callback,"json");
			}
			
			function submitForm(dom){
				if($(dom).attr("disabled")=='disabled')return;
				$(dom).html("请稍后...");
				$(dom).attr("disabled","disabled");
				$("#form1").ajaxSubmit({
					success: function(data){
						if(data.msgNo=='1'){
							bootstrapQ.msg({
								msg: "购买成功，2秒后自动跳转至详细页面。",
								type: "success",
								time: 2000
							});
							setTimeout(function(){
								window.location.href = "toOrderDetail.do?orderId="+$("#orderId").val()+"&type=0";
							},2000);
							
						}else{
							$(dom).html("提交");
							$(dom).removeAttr("disabled");
							bootstrapQ.msg({
								msg: "购买失败！",
								type: "danger",
								time: 2000
							});
						}
						
					},
					error: function(){
						$(dom).html("提交");
						$(dom).removeAttr("disabled");
					}
				})
			}
		</script>
	</body>

</html>