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
		<title>订单详细</title>
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
		<script src="<%=basePath%>webPages/js/ajaxfileupload.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/js/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		
		<link rel="stylesheet" href="<%=ttt%>css/freeteam.css" />
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
		
		<div id="msgDiv0" class="container hidden" style="margin-top: 30px;background: white;padding: 10px;">
			<p class="clearfix">
				<div class="fLeft formTip">
					<input type="hidden" id="hidMsg0Id"/>
					系统提示(<span id="msg0Time"></span>)：<b id="msg0"></b>
				</div>
				
				<div class="fRight">
					<a class="mybtn-primary">同意</a>
					<a class="mybtn">取消订单</a>
				</div>
			</p>
		</div>
		
		<div id="msgDiv1" class="container hidden" style="margin-top: 30px;background: white;padding: 10px;">
			<p class="clearfix">
				<div class="fLeft formTip">
					系统提示(<span id="msg1Time"></span>)：<b id="msg1"></b>
				</div>
			</p>
		</div>
		
		<div class="container" style="margin-top: 30px;background: white;">
			<div class="row white-bg p20_0">
				<div class="row">
					<div class="col-xs-12" style="padding: 0px 20px;">
						<h4 class="darkred">
							<div style="display: inline-block;" >
								<i class="glyphicon glyphicon-exclamation-sign red mr20 f20"></i>
							</div>
							<c:if test='${link eq "prj"}'>
								<c:if test="${order. buyer eq freeteam_user.id}">
									订单信息（被承接的项目）
								</c:if>
								<c:if test="${order. seller eq freeteam_user.id}">
									订单信息（承接的项目）
								</c:if>
							</c:if>
							<c:if test='${link eq "ser"}'>
								<c:if test="${order. buyer eq freeteam_user.id}">
									订单信息（购买的服务）
								</c:if>
								<c:if test="${order. seller eq freeteam_user.id}">
									订单信息（卖出的服务）
								</c:if>
							</c:if>
						</h4>
					</div>
					<div class="col-xs-4">
						
					</div>
					
				</div>
				<hr class="m5"/>
				<div class="row">
					<div class="col-xs-8">
						<form id="form1" action="order/changePrice.do" method="post" enctype="multipart/form-data">
							<input id="planId" name="planId" type="hidden" value="${order.currentPlan}"/>
							<input id="type" name="type" type="hidden" value="0"/>
							<input id="linkId" name="linkId" type="hidden" value="${order.linkId}"/>
							<input id="currentPlan" name="currentPlan" type="hidden" value="${order.currentPlan}"/>
							<input id="planNodeId" name="planNodeId" type="hidden" value="${order.planNodeId}">
							<input id="seller" name="seller" type="hidden" value="${order.seller}"/>
							<input type="hidden" id="orderId" name="orderId" value="${order.id}"/>
							<input type="hidden" id="hidPrePrice" value="${order.prePrice}"/>
							<div id="page1" class="clearfix">
								<div class="col-xs-11">
									<div class="row form-group m10">
										<label class="col-xs-3 control-label">订单编号:</label>
										<div class="col-xs-9">
											 <span class="p0_10">${order.id}</span>
										</div>
									</div>
									<hr/>
									<div class="row form-group m10">
										<label class="col-xs-3 control-label">价格:</label>
										<div class="col-xs-5  p0">
											<input type="hidden" name="prePrice" id="prePrice" value="${order.price}"/>
											<input type="hidden" name="price" id="price" value="${order.price}"/>
											<span id="priceText">${order.price}</span>										
										</div>
										<c:if test="${order.status eq 0}">
											<div class="col-xs-2  p0" style="margin-left: 20px">
												<c:if test='${link eq "prj"}'>
													<c:if test="${order.buyer eq freeteam_user.id}">
														<c:if test="${order.priceChangeNum eq 0}">
															<a class="mybtn-primary mr15" id="changePriceBtn" onclick="changePrice()">改价</a>
														</c:if>
													</c:if>
												</c:if>
												<c:if test='${link eq "ser"}'>
													<c:if test="${order.seller eq freeteam_user.id}">
														<c:if test="${order.priceChangeNum eq 0}">
															<a class="mybtn-primary mr15" id="changePriceBtn" onclick="changePrice()">改价</a>
														</c:if>
													</c:if>
												</c:if>
											</div>
										</c:if>
									</div>
									<hr/>
									<div class="row form-group m10" style="padding:0px 0px 20px 0px;">
										<label class="col-xs-3 control-label mt20">支付方式:</label>
										<div class="col-xs-7 p0">
											<div style="display: inline-block;max-width: 900px;" class="ystep1"></div>
										</div>
									</div>
									<hr/>
									<div class="row form-group m10">
										<label class="col-xs-3 control-label">备注:</label>
										<div class="col-xs-7 p0">
											<p>${order.note }</p>
										</div>
									</div>
									<hr/>
									
									<!-- 按钮根据订单状态不同 -->
									<div id="orderStatusArea" class="row form-group m10 text-center">
										<!-- 0.订单状态为待确认时 -->
										<c:if test="${order.status eq 0}">
											<c:if test='${link eq "prj"}'>
												<c:if test="${order.seller eq freeteam_user.id}">
													<span><label id="orderStatus" class="label label-info label-lg">等待项目方确认...</label></span>
												</c:if>
												<c:if test="${order.buyer eq freeteam_user.id}">
													<a class="mybtn-primary mr15" onclick="accpetOrder()">同意</a>
													<a class="mybtn-primary" onclick="cancelOrder()">拒绝</a>
												</c:if>
											</c:if>
											<c:if test='${link eq "ser"}'>
												<c:if test="${order. buyer eq freeteam_user.id}">
													<span><label id="orderStatus" class="label label-info label-lg">等待服务方确认...</label></span>
												</c:if>
												<c:if test="${order.seller eq freeteam_user.id}">
													<a class="mybtn-primary mr15" onclick="accpetOrder()">接单</a>
													<a class="mybtn-primary" onclick="cancelOrder()">拒绝</a>
												</c:if>
											</c:if>
											
										</c:if>
										
										<!-- 1.订单状态为 改价待确认时 -->
										<c:if test="${order.status eq 1}">
											<c:if test='${link eq "prj"}'>
												<c:if test="${order.seller eq freeteam_user.id}">
													<span class="mr15">对方修改了价格，请确认</span>
													<a class="mybtn-primary mr15" onclick="updateOrderStatus('${order.id}','2')">同意</a>
													<a class="mybtn-primary" onclick="cancelOrder()">拒绝</a>
												</c:if>
												<c:if test="${order.buyer eq freeteam_user.id}">
													<span><label id="orderStatus" class="label label-info label-lg">改价成功，等待对方确认...</label></span>
												</c:if>
											</c:if>
											<c:if test='${link eq "ser"}'>
												<c:if test="${order.buyer eq freeteam_user.id}">
													<span class="mr15">对方修改了价格，请确认</span>
													<a class="mybtn-primary mr15" onclick="updateOrderStatus('${order.id}','2')">同意</a>
													<a class="mybtn-primary" onclick="cancelOrder()">拒绝</a>
												</c:if>
												<c:if test="${order.seller eq freeteam_user.id}">
													<span><label id="orderStatus" class="label label-info label-lg">改价成功，等待对方确认...</label></span>
												</c:if>
											</c:if>
										</c:if>
										
										<!-- 2.订单确认后 -->
										<c:if test="${order.status eq 2}">
											<c:if test="${order.buyer eq freeteam_user.id}">
												<c:if test="${order.curPlanStatus eq 0}">
													当前阶段费用：&nbsp;<b>${nodePrice}元</b>
													<a class="mybtn-primary" target="_blank" onclick="toPay();">付款</a>
												</c:if>
												<c:if test="${order.curPlanStatus eq 1}">
													<span><label id="orderStatus" class="label label-info label-lg">待服务...</label></span>
												</c:if>
												<c:if test="${order.curPlanStatus eq 2}">
													<span><label id="orderStatus" class="label label-info label-lg">服务中...</label></span>
												</c:if>
												<c:if test="${order.curPlanStatus eq 3}">
													当前阶段服务已完成，请及时验收
													<a class="mybtn-primary mr15" onclick="updatePlanNodeStatus(4);">验收通过</a>
													<a class="mybtn-primary" onclick="updatePlanNodeStatus(5);">不通过</a>
												</c:if>
												<c:if test="${order.curPlanStatus eq 5}">
													<span><label id="orderStatus" class="label label-info label-lg">待服务...</label></span>
												</c:if>
											</c:if>
											<c:if test="${order.seller eq freeteam_user.id}">
												<c:if test="${order.curPlanStatus eq 0}">
													<span><label id="orderStatus" class="label label-info label-lg">等待对方付款...</label></span>
												</c:if>
												<c:if test="${order.curPlanStatus eq 1}">
													<span>当前阶段已付款</span>
													<a class="mybtn-primary" onclick="updatePlanNodeStatus(2);">开始服务</a>
												</c:if>
												<c:if test="${order.curPlanStatus eq 2}">
													<a class="mybtn-primary" onclick="updatePlanNodeStatus(3);">申请验收</a>
												</c:if>
												<c:if test="${order.curPlanStatus eq 3}">
													<span><label id="orderStatus" class="label label-info label-lg">待验收...</label></span>
												</c:if>
												<c:if test="${order.curPlanStatus eq 5}">
													<span>验收未通过，请重新开始服务</span>
													<a class="mybtn-primary" onclick="updatePlanNodeStatus(2);">开始服务</a>
												</c:if>
											</c:if>
										</c:if>
										
										<!-- 3.订单已完成 -->
										<c:if test="${order.status eq 3}">
											<span><label id="orderStatus" class="label label-info label-lg">订单已完成</label></span>
											<c:if test="${order.buyer eq freeteam_user.id}">
												<c:if test="${order.isComment eq 0}">
													<a class="mybtn-primary" onclick="toComment()">评价</a>
												</c:if>
											</c:if>
										</c:if>
										
										<!-- 4.订单已取消 -->
										<c:if test="${order.status eq 4}">
											<span><label id="orderStatus" class="label label-info label-lg">订单已取消</label></span>
										</c:if>
									</div>
									
								</div>
							</div>
						</form>
						<hr/>
						<div id="page2" class="clearfix">
							<h4 class="darkred">附件（点击文件名可下载）</h4>
							<hr/>
							<div class="col-xs-11">
								<div class="row" id="documentsDiv">
									<p>正在加载...</p>
								</div>
								<hr/>
								<div class="text-center">
									<a class="mybtn-primary" onclick="$('#docDialog').modal('show')">上传文件</a>
								</div>
								<form id="addDocDiv" action="order/addDocument.do" method="POST" enctype="multipart/form-data">
									<input type="hidden" name="orderId" value="${order.id}"/>
									<div class="row form-group">
										<label class="col-xs-3 text-right p10">标题:</label>
										<div class="col-xs-9">
											<input type="text" class="form-control" name="title" placeholder="文档标题"/>
										</div>
									</div>	
									<div class="row form-group">
										<label class="col-xs-3  text-right p10">描述:</label>
										<div class="col-xs-9">
											<textarea rows="5" class="form-control" name="note" maxlength="200" placeholder="请添加文档描述"></textarea>
										</div>
									</div>
									<div class="row form-group" style="padding: 10px 0px 0px 0px">
										<label class="col-xs-3  text-right p10">文件:</label>
										<div class="col-xs-9">
											<input type="file" id="documentFile" name="file"/>
											<p class="formTip">* 请选择小于200M的文档进行上传</p>
										</div>
									</div>
								</form>
							</div>
						</div>
					</div>
					
					<div class="col-xs-4">
						<div>
							<div>
								<c:if test='${link eq "ser"}'>
								<p><b>买方已支付</b></p>
								</c:if>
								<c:if test='${link eq "prj"}'>
								<p><b>项目方已支付</b></p>
								</c:if>
								<p>
									<div class="progress" >
									  <div class="progress-bar progress-bar-success"  role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: ${order.amountPayed/order.price*100}%;max-width: 100%;">
									    <span style="width:50px;display: block;margin: 0px auto;">${order.amountPayed}元</span>
									  </div>
									  
									</div>
								</p>
							</div>
							<hr/>
							<div>
								<c:if test='${link eq "prj"}'>
									<p><b>项目信息</b></p>
								</c:if>
								<c:if test='${link eq "ser"}'>
									<p><b>服务信息</b></p>
								</c:if>
								<div>
									<div style="width: 28%;display: inline-block;vertical-align: top;margin-top: 3%;">
										<img width="90%" style="max-height: 200px;" src='<%=staticFilesPath%>/webPages/upload/${link eq "prj"?"project":"service"}/${empty info.proLog?"undefined":info.proLog}' />
									</div>
									<div style="width: 70%;display: inline-block;">
										<p>
											<h5><b><a id="serTitle" target="blank" href='to${link eq "prj"?"Project":"Service"}2.do?id=${info.id}'>${info.name }</a></b></h5>
										</p>
										<p>
											<span id="Intro" class="cutText2">${info.intro}</span>
										</p>
									</div>
								</div>
								
								<p>
									<label style="color: #f83;">${info.startPrice}-${info.endPrice}元</label>
									<small class="fRight lightred">好评率:${info.score * 100}%</small>
								</p>
							</div>
							<hr />
							
							<div>
								<c:if test='${link eq "ser"}'>
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
										<i class="glyphicon glyphicon-map-marker p5" ></i>${seller.area }
										<small class="fRight lightred" id="publisher_goodPercent">等级:★★★★</small>
									</p>
								</c:if>
								<c:if test='${link eq "prj"}'>
									<p><b>项目发布者信息</b></p>
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
										<small class="fRight lightred" id="publisher_goodPercent">等级:★★★★</small>
									</p>
								</c:if>
							</div>
							<hr />
							<div>
								<c:if test='${link eq "ser"}'>
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
										<small class="fRight lightred" id="opUser_goodPercent">等级:★★★★</small>
									</p>
								</c:if>
								<c:if test='${link eq "prj"}'>
									<p><b>项目承接人信息</b></p>
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
										<small class="fRight lightred" id="opUser_goodPercent">等级:★★★★</small>
									</p>
								</c:if>
														
							</div>
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
				initDocumentList();
				$("#Intro").text(cutLongTxt($("#Intro").text(),100));
				createDialog("docDialog","添加订单文档","addDocDiv");
				$("#docDialog .btncancel").text("取消");
				$("#docDialog .btnsave").text("上传");
				
				queryOrderMsg();
				
				var type = '${link}';
				if(type == 'prj'){
					$("#publisher_goodPercent").html("等级："+getUserStars('${buyer.examine}','${buyer.isRecommend}',${buyer.goodPercent}));
					$("#opUser_goodPercent").html("等级："+getUserStars('${seller.examine}','${seller.isRecommend}',${seller.goodPercent}));
				}else{
					$("#publisher_goodPercent").html("等级："+getUserStars('${seller.examine}','${seller.isRecommend}',${seller.goodPercent}));
					$("#opUser_goodPercent").html("等级："+getUserStars('${buyer.examine}','${buyer.isRecommend}',${buyer.goodPercent}));
				}
			});
			
		
			
			
			
			var curPlanNodeId;
			
			function initPlanByPlanId(id){
				var callback = function(data){
					var d = data.obj;
					//1.生成计划节点UI
					var d2 = $.map(d,function(row){
						var cs = "";
						switch (row.state) {
						case 0:
							if(row.currentPlan == planNodeId){
								cs = cs = "<label class='label label-danger'>待付款</label>";
							}else{
								cs = "<label class='label label-default'>未开始</label>";
							}
							break;
						case 1:
							cs = "<label class='label label-info'>待服务</label>";
							break;
						case 2:
							cs = "<label class='label label-info'>服务中</label>";
							break;
						case 3:
							cs = "<label class='label label-danger'>待验收</label>";
							break;
						case 4:
							cs = "<label class='label label-success'>验收通过</label>";
							break;
						case 5:
							cs = "<label class='label label-danger'>验收未通过</label>";
							break;
						default:
							break;
						}
						var l = row.payState==0?'<label class="label label-danger">未支付</label>':'<label class="label label-success">已支付</label>';
						var title = row.name;
						var content = '<div class="planNode"><p><label>节点状态：</label>'+cs+'</p><p><label>支付('+row.amountPercent+'%)：</label>'+l+'</p><p><label>描述：</label>'+row.content+'</p></div>';
						var steptitle = '<p>'+row.amountPercent+'%</p><p style="margin-top: 30px;" class="cutText">'+ row.name + '</p>';
						console.log(row);
						return {title: title,content: content, steptitle: steptitle};
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
					
					var planNodeId = $("#planNodeId").val();
					for(var i=1;i<d.length+1;i++){
						var planNodeId = $("#planNodeId").val();
						if(d[i-1].id==planNodeId){
							$(".ystep1").setStep(i);
							return;
						}
					}
				}
				
				$.post("plan/findPlanNodesByPlanId.do",{planId: id},callback,"json");
			}
			
			function initDocumentList(){
				var orderId = $("#orderId").val();
				$.post("order/queryOrderDocuments.do",{"orderId":orderId},function(msg){
					console.log(msg);
					var obj = msg.obj;
					var docs = "";
					$.each(obj,function(i,item){
						docs += '<div class="row">'
							+'<div class="col-xs-4">'
							+'<a href="file/download.do?id='+item.id+'">'+nvl(item.orginFileName,"未知")+'</a>'
							+'</div>'
							+'<div class="col-xs-4">'
							+'<b style="word-break: break-all;">'+item.title+'</b>'
							+'	<h5><small style="word-break: break-all;">'+item.note+'</small></h5>'
							+'</div>'
							+'<div class="col-xs-4">'
							+'	<p><i class="p5 glyphicon glyphicon-user"/>'+item.createrName+'</p>'
							+'	<p><i class="p5 glyphicon glyphicon-time"/>'+item.createTime+'</p>'
							+'</div>'
							+'</div>'
							+'<hr/>'
					});
					$("#documentsDiv").children().remove();
					$("#documentsDiv").append(docs==""?"<p>暂无文档</p>":docs);
				},"json");
			}
			
			function saveFile(dom){
				bootstrapQ.confirm("确定要上传文档吗？", function(){
					unableDbClick();
					ajaxFileUpload("documentFile","orderDocument",function(data){
						data = $(data).html();
						data = JSON.parse(data);
						if(data.msgNo == '1'){
							unableDbClick();
							bootstrapQ.msg({
			                	msg: "上传文件成功！",
			            		type : 'success',
			            	    time : 2000
			                });
							$.post("order/addDocument.do",{"orderId":$("#orderId").val(),})
						}else{
							unableDbClick();
							bootstrapQ.msg({
			                	msg: "上传文件失败！",
			            		type : 'danger',
			            	    time : 2000
			                });
						}
					});
				})
			}
			
			function clickButton(diaId){
				var options = {
			        success: function (data) {
			        	$("#"+diaId).modal("hide");
			        	initDocumentList();
			        }
			    };
		        // ajaxForm
		        $("#addDocDiv").ajaxSubmit(options);
			}
			
			
			function queryOrderMsg(){
				var orderId = $("#orderId").val();
				var planNodeId = $("#planNodeId").val();
				var callback = function(data){
					if(data.msgNo == '1'){
						var d = data.obj;
						var msg0 = $.map(d,function(row){
							if(row.type=="0"){
								return row;
							}
						});
						var msg1 = $.map(d,function(row){
							if(row.type=="1"){
								return row;
							}
						});
						console.log(msg1);
						if(msg0.length>0){
							$("#msg0Time").text(msg0[0].createTime);
							$("#msg0").text(msg0[0].msg);
							$("#msgDiv0").removeClass("hidden");
						}
						
						if(msg1.length>0){
							$("#msg1Time").text(msg1[0].createTime);
							$("#msg1").text(msg1[0].msg);
							$("#msgDiv1").removeClass("hidden");
						}
						
					}else{
						
					}
				}
				$.post("order/queryOrderMessageData.do",{"orderId": orderId,"planNodeId": planNodeId},callback,"json");
			}
			
			function updateOrderStatus(id, status){
				unableDbClick();
				$.ajax({
					url: 'order/updateStatus.do?status='+status+'&orderId='+id,
					type: "POST",
					dataType: "json",
					success: function(data){
						if(data.msgNo=='1'){
							bootstrapQ.msg({
								msg: "操作成功！",
								type: "success",
								time: 2000
							});
							setTimeout(refreshPage, 1000);
						}else{
							unableDbClick();
							bootstrapQ.msg({
								msg: "操作失败！",
								type: "danger",
								time: 2000
							});
						}
					},
					error: function(data){
						unableDbClick();
						bootstrapQ.msg({
							msg: "操作失败，请稍后重试！",
							type: "danger",
							time: 2000
						});
					}
				})
			}
			
			function updatePlanNodeStatus(status){
				/* $.post("order/updatePlanNodeStatus.do",{"orderId": orderId,"status": status},function(data){
					alert(data);
					if(data.msgNo=='1'){
						bootstrapQ.msg({
							msg: "操作成功！",
							type: "success",
							time: 2000
						});
						setTimeout(refreshPage, 1000);
					}else{
						bootstrapQ.msg({
							msg: "操作失败！",
							type: "danger",
							time: 2000
						});
					}
				},"json"); */
				var curPlanStatusNote = "";
				if(status=='5'){
					var helpTxt = encodeURI(encodeURI("请输入验收不通过的理由"));
					//验收不通过，添加理由
					bootstrapQ.dialog({
						title: '添加理由',
						msg: '',
						btn : true,
						okbtn: "确定",
						qubtn : "取消",
						url: 'toPromptPage.do?helpTxt='+helpTxt
					}, function(){
						curPlanStatusNote = $("#promptTxt").val();
						doUpdateStatus();
						return true;
					})
				}else{
					doUpdateStatus();
				}
				
				function doUpdateStatus(){
					unableDbClick();
					$.ajax({
						url: "order/updatePlanNodeStatus.do?orderId="+$("#orderId").val() 
								+ "&status=" + status 
								+"&curPlanStatusNote=" +encodeURI(encodeURI(curPlanStatusNote)),
						type: "POST",
						dataType: "json",
						success: function(data){
							
							if(data.msgNo=='1'){
								bootstrapQ.msg({
									msg: "操作成功！",
									type: "success",
									time: 2000
								});
								setTimeout(refreshPage, 1000);
							}else{
								unableDbClick();
								bootstrapQ.msg({
									msg: "操作失败！",
									type: "danger",
									time: 2000
								});
							}
						},
						error: function(data){
							console.log(JSON.stringify(arguments));
							if(data.msgNo=='1'){
								bootstrapQ.msg({
									msg: "操作成功！",
									type: "success",
									time: 2000
								});
								setTimeout(refreshPage, 1000);
							}else{
								unableDbClick();
								bootstrapQ.msg({
									msg: "操作失败！",
									type: "danger",
									time: 2000
								});
							}
						}
					});
				}
			}
			
			//option start
			//接单
			function accpetOrder(){
				bootstrapQ.confirm("确定要接受此订单吗？",function(){
					var orderId = $("#orderId").val();
					updateOrderStatus(orderId,2);
				});
			}
			
			//取消订单
			function cancelOrder(){
				bootstrapQ.confirm("确定要取消此订单吗？",function(){
					var orderId = $("#orderId").val();
					updateOrderStatus(orderId,4);
				});
			}
			
			function changePrice()
			{	
				bootstrapQ.dialog({
					url: 'pageTo.do?p=priceChange',
					title: '改价',
					msg: "加载中...",
					close : true,
					btn : true,
					okbtn: "确定",
					qubtn : "取消",
					callback : function(){
						//设置默认消息
						$("#prePriceText").text("${order.price}");
					}
				},function()
				{
					$("#price").val($("#newPrice").val());
					doChangePrice($("#newPrice").val());
					return true;
				});
				
			}
			
			//改价
			function doChangePrice(newPrice){
				unableDbClick();
				$("#changePriceBtn").hide().after("<span>改价中...</span>");
				$("#form1").ajaxSubmit({
					dataType: "json",
					success: function(data){
						if(data.msgNo=='1'){
							bootstrapQ.msg({
								msg: "改价成功,等待对方确认！",
								type: "success",
								time: 2000
							});
							$("#priceText").text(newPrice);
							setTimeout(refreshPage,1000);
						}else{
							unableDbClick();
							bootstrapQ.msg({
								msg: "改价失败，请重试！",
								type: "danger",
								time: 2000
							});
							$("#changePriceBtn").show().after().remove();
						}
						
					},
					error: function(data){
						unableDbClick();
						bootstrapQ.msg({
							msg: "改价失败，请重试！",
							type: "danger",
							time: 2000
						});
						$("#changePriceBtn").show().after().remove();
						console.log(JSON.stringify(arguments));
					}
				})
			}
			
			function toPay(){
				<c:if test='${link eq "prj"}'>
				var type = 1;
				</c:if>
				<c:if test='${link eq "ser"}'>
				var type = 0;
				</c:if>				
				bootstrapQ.dialog({
					url: "order/toPayOrder.do?type="+type+"&orderId="+$("#orderId").val(),
					type: "post",
					title: "确认付款信息",
					msg: '正在加载...',
					btn : true,
					okbtn : "确定",
					qubtn: '取消',
					mstyle:'width:500px;',
					foot: true
				}, function(){
					var c = $("#payType").find("input:checked");
					var payType = $(c).val();
					if(payType=='alipay'){
						payAlipay()
					}else if(payType='acc'){
						payAcc();
					}
					
					return true;
				});
				
				/* 支付宝支付 */
				function payAlipay(){
					$("#submitPay").click();
					bootstrapQ.confirm({
						id: 'bsconfirm',
						okbtn: '支付完成',
						qubtn: '支付遇到问题',
						msg: "请在支付宝页面完成支付。", 
					},function(){
						unableDbClick();
						refreshPage();
						return true;
					},function(){
						unableDbClick();
						refreshPage();
						return true;
					});
				}
				
				/* 余额支付 */
				function payAcc(){
					unableDbClick();
					$.ajax({
						url: 'order/payByCharge.do',
						data: {
							orderId: $("#orderId").val(),
							money: $("#WIDtotal_fee").val(),
							note: encodeURI($("#note").val())
						},
						dataType: 'json',
						success: function(data){
							unableDbClick();
							if(data.msgNo=='1'){
								bootstrapQ.confirm({
									id: 'bsconfirm',
									msg: "支付成功！", 
								},function(){
									unableDbClick();
									refreshPage();
								},function(){
									unableDbClick();
									refreshPage();
								});
								
							}else{
								unableDbClick();
								bootstrapQ.msg({
									msg: data.obj,
									type: 'danger',
									time: 2000
								});
							}
						},
						error: function(){
							unableDbClick();
							bootstarpQ.msg({
								msg: '发生了未知的网络错误，请稍后重试！',
								type: 'danger',
								time: 2000
							});
						}
					
					})
				}
			}
			
			
			function toComment(){
				//如果是项目，则是给服务方添加评论，如果是服务，则是添加服务给评论
				var type = ${link eq "prj"?2:1};
				var linkId = type==1?${order.linkId}:${order.seller};
				bootstrapQ.dialog({
					url : 'comment/toComment.do?type='+type+'&isReply=0&toId='+$("#linkId").val(),
				    title : '添加评论',
				    msg: '正在加载请稍后...',
				    mstyle: "width:600px;"
				}, function(){
					if(!$("#commentForm").valid()){
						return false;
					}
					$("#commentForm").ajaxSubmit({
				    	dataType: "json",
				    	contentType: "application/x-www-form-urlencoded; charset=utf-8",
				    	data: {
				    		orderId: $("#orderId").val()
				    	},
				    	success: function(data){
				    		if(data.msgNo=="1"){
				    			bootstrapQ.msg({
					    			msg: "添加评论成功！",
					    			type: "success",
					    			time: 2000
					    		});
				    			setTimeout(refreshPage,1000);
				    		}
				    		
				    	},
				    	error: function(data){
				    		bootstrapQ.msg({
				    			msg: "发生了未知的网络错误，评论失败！",
				    			type: "danger",
				    			time: 2000
				    		});
				    	}
				    });
				});
				
			}
			
		</script>
	</body>

</html>