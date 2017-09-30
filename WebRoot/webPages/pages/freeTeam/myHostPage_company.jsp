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
		<title>我的主页-自由团队</title>
		<meta name="keywords" content="IT兼职，自由团队" />
		<meta name="description" content="自由团队是一个专业高效的免费创业IT外包服务平台，致力于通过创业IT外包数据服务降低创业者和投资人的综合时间成本、提升整个社会的创业IT外包效率，从而创造新的社会价值！" />
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
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/old.css" type="text/css"/>
		<link rel="stylesheet" href="<%=basePath%>webPages/bootstrap/dateTimePicker/css/bootstrap-datetimepicker.min.css" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/bootstrap/dateTimePicker/bootstrap-datetimepicker.min.js" ></script>
		<script type="text/javascript" src="<%=basePath%>webPages/bootstrap/dateTimePicker/locales/bootstrap-datetimepicker.fr.js" charset="UTF-8"></script>
		<script src="<%=basePath%>/webPages/js/pageSplit.js"></script>
		<script type="text/javascript" src="<%=basePath %>webPages/js/select2/js/select2.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		
		<script>
			$(document).ready(function() {
				var evTimeout = null;
				$("#header .dropdown").mouseenter(function() {
					$(this).find(".dropdown-menu").slideDown(200);
					if (evTimeout != null) {
						clearTimeout(evTimeout);
						evTimeout = null;
					}
				}).mouseleave(function() {
					var el = $(this);
					if (evTimeout != null) {
						clearTimeout(evTimeout);
						evTimeout = null;
					}
					evTimeout = setTimeout(function() {
						el.find(".dropdown-menu").slideUp(200);
						evTimeout = null;
					}, 100);
				});
			});
		</script>
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/swiper.min.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/styleV2.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/controller/index_v2.js"></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/vocation.js"></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/commonPageSplit.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/js/ajaxfileupload.js"></script>
		<style type="text/css">
			.praList>li>span {display: block;padding: 5px;}
			.searchArea {padding: 0px 10px;background-color: white;width: 100%;border-radius: 5px;}
			.fLeft {float: left;}.fRight{float:right}.clear{clear: both;}
			.praList li {display: block;padding: 5px; margin: 0px 2px;}.liActive {background: yellowgreen;border-radius: 5px;}
			.searchLabel li {float: left;}
			.pr5{padding-right: 5px;}
			.country {width: 300px;}
			.country select {margin: 2px 5px;width: 150px;font-size: 12px;height: 26px;color: cornflowerblue;}
			.gotoPage{padding: 4px 12px !important;}.gotoPage>input {height: 24px;}
			.pg_active {color: white !important;font-weight: bold;background: rgb(255,215,68) !important;}
			.eduFont{color:#757991;}
			ul.eduFont{padding-left: 12px;}
			.eduFont li{float: left; margin: 0 5px 10px 5px;border-right: 1px #ddd solid; padding-right: 10px;line-height: 13px;}
		
			#myOption{position:fixed;}
			#_headPic,.imgPreView{border-radius: 10px; padding:5px;}
			.hostUl{text-align: left;}.hostUl li{padding: 5px;}.hostUl li:hover{border-right: darkmagenta 1px solid;}
			.ulActiveGold{color:orange !important;}.ulActiveGold a{color:orange !important;}
			.ulActiveGold i{color:orange !important;}.li_img {color: cornflowerblue;padding: 0px 5px;}
			.settingUl li{padding: 6px 18px;font-size: 12px;}.li_img_success {color: green;}.li_img_error {color: red;}
			.sectionTitleA{width: 100%;text-align: left;}
			.panel-default{ border: none;display: none;}
			.btn-primary{height: 36px;}
			.firstMsg {background: whitesmoke;position: absolute;width: 300px;z-index: 11;}
			.bI-Table{width: 100%;}
			input[type=file]{width: auto;height: auto;opacity: 1;}
			table.bI-Table tr{height: 60px;border-bottom: 1px lightgray soild;}
			table.bI-Table tr td:first-child {padding-left: 50px;}
			.pSetting {margin: 5px 0px;margin-bottom: 100px;padding: 10px;}
			td{color: #505050 !important;}
			.cb{width: 90px;height: 36px;padding: 0px 2px;border-radius: 18px;background: yellowgreen;border: 1px solid white;}
			.redbg{background: indianred;}.graybg{background: gray;}
			.cb-btn{width: 32px;height: 32px;margin: 1px 0px;border-radius: 16px;background: whitesmoke;}
			.cb-text{font-family: '黑体';font-size: 14px;padding: 2px 0px;width: 48px;height: 32px;color: white;text-align: center;}
			.sysMsg{max-height: 400px;overflow-y: scroll;}
			.btn-sm.btn-info{color:white !important;}.btn-sm.btn-danger{color:white !important;}
		</style>
	</head>

	<body>
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		
		<jsp:include page="head.jsp"></jsp:include>
		<div class="bgcolor">
			<div class="subnav">
			</div>
		</div>
		<div>
			<div class="projectHead">
			    <div class="mainBox">
			        <div class="projectHeadLeft" style="width: 900px;">
			       		<hr style="margin-top: 0px;"/>
			            <div id="myContent" class="pinfo" style="border: none;width: 900px;padding-top: 0px; text-align: left;">
							<div class="">
								<div id="myOrder" class="panel panel-default">
								  <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-star"></i>我的订单
								  </h3>
								  <div class="panel-body" id="myOrder">
								  	<!-- 订单区域 -->
								  	<div class="search-area">
								  		<li id="buyTypeLi">
									  		<i class="active" value="0">全部</i>
									  		<span>|</span>
									  		<i value="1" >购买的服务</i>
									  		<span>|</span>
									  		<i value="2">卖出的服务</i>
									  		<span>|</span>
									  		<i value="3">承接的项目</i>
									  		<span>|</span>
									  		<i value="4">被承接的项目</i>
									  	</li>
									  	<hr style="margin: 0px 0px 10px 0px;"/>
									  	<li id="statusLi">
									  		<i class="active" value="0">待接单/待确认</i>
									  		<i value="1">待付款/待服务</i>
									  		<i value="2">服务中</i>
									  		<i value="3">待验证</i>
									  		<i value="4">待评价</i>
									  	</li>
								  	</div>
								  	<hr style="border-top: 2px #E3E3E3 solid;"/>
								  	<div class="order-data">
								  		<div id="orderList" class="panel-body eventset-list clearfix">
								  			
								  		</div>
								  		
								  	</div>
								  </div>
								</div>
								
								<div id="myAccount" class="panel panel-default">
								  <h3 class="sectionTitleA bold c56 f18">
									<i class="li_img li_img glyphicon glyphicon-yen"></i>账户
									<div class="fRight mr10" style="font-size: 14px;"><a>设置</a></div>
								  </h3>
								  <div class="panel-body">
								    <div>
								  		<table style="width:100%;" class="">
								  			<tr >
								  				<td class="w20"><span style="font-weight: bold;">账户余额：</span>100.00</td>
								  				<td>
								  					<a class="mybtn text-center mr15" style="width: 50px;display: inline-block;">充值</a>
								  					<a class="mybtn text-center mr15" style="width: 50px;display: inline-block;">提现</a>
								  				</td>
								  			</tr>
								  			<tr>
								  				<td  ><span style="margin: 20px 0px;display: inline-block;font-weight: bold;">服务保证金：</span>10000.00</td>
								  			</tr>
								  		</table>
								  		
								  		
								  		<div class="clearfix" style="margin-top: 15px;padding-top: 15px;border-top: 1px lightgrey solid;">
								    		<div class="fRight"><a>历史账单</a></div>
								    	</div>
								  		<div class="eventset-list">
								  			<li class="eventset-tit" style="margin-top: 0px;">
								  				<i class="cell logo w20">流水号</i>
												<i class="cell logo w20">日期</i>
												<i class="cell commpany w20">名称|备注</i>
												<i class="cell investor w15">收入(元)</i>
												<i class="cell investor w15">支出(元)</i>
												<i class="cell investor w10">详情</i>
								  			</li>
								  			
								  			<li>
								  				<i class="cell commpany w20">
													<span>201604062000400111</span>
												</i>
												<i class="cell logo w20">
													<span>2016-5-8 01:19:58</span>
												</i>
												<i class="cell commpany w20">
													<span class="name">退款</span>
													<span class="intro">
														自由团队项目延期退款…
													</span>
												</i>
												<i class="cell investor w15">
													<span style="color: darkgreen;">1000</span>
												</i>
												<i class="cell investor w15">
													-
												</i>
												<i class="cell investor w10">
													<a href="javascript: void(0)">查看详情</a>
												</i>
								  			</li>
								  			
								  			<li>
								  				<i class="cell commpany w20">
													<span>201604062000400111</span>
												</i>
												<i class="cell logo w20">
													<span>2016-5-8 01:19:58</span>
												</i>
												<i class="cell commpany w20">
													<span class="name">服务费</span>
													<span class="intro">
														开发服务费用...
													</span>
												</i>
												<i class="cell investor w15">
													-
												</i>
												<i class="cell investor w15">
													<span style="color: red;">10000</span>
												</i>
												<i class="cell investor w10">
													<a href="javascript: void(0)">查看详情</a>
												</i>
								  			</li>
								  			
								  			<li>
								  				<i class="cell commpany w20">
													<span>201604062000400111</span>
												</i>
												<i class="cell logo w20">
													<span>2016-5-8 01:19:58</span>
												</i>
												<i class="cell commpany w20">
													<span class="name">保证金解冻</span>
													<span class="intro">
														自由团队保证金...
													</span>
												</i>
												<i class="cell investor w15">
													<span style="color: darkgreen;">1000</span>
												</i>
												<i class="cell investor w15">
													-
												</i>
												<i class="cell investor w10">
													<a href="javascript: void(0)">查看详情</a>
												</i>
								  			</li>
								  			
								  			<li>
								  				<i class="cell commpany w20">
													<span>201604062000400111</span>
												</i>
												<i class="cell logo w20">
													<span>2016-5-8 01:19:58</span>
												</i>
												<i class="cell commpany w20">
													<span class="name">保证金</span>
													<span class="intro">
														开发服务缴纳的保证金...
													</span>
												</i>
												<i class="cell investor w15">
													-
												</i>
												<i class="cell investor w15">
													<span style="color: red;">10000</span>
												</i>
												<i class="cell investor w10">
													<a href="javascript: void(0)">查看详情</a>
												</i>
								  			</li>
								  		</div>
								    </div>
								  </div>
								</div>
								
								<div id="myService" class="panel panel-default">
								  <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-star"></i>服务
								  </h3>
								  <div align="right">
							    	<a href="chipPage.do?p=tianTianTou/newservice" class="mybtn-primary" >发布新服务</a>
							      	<div class="clear"></div>
							      </div>
								  <div class="panel-body eventset-list border_plist" id="myServiceArea">
								  	<!-- 服务区域 -->
								  </div>
								</div>
								
								<div id="myProject" class="panel panel-default">
								  <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-star"></i>项目
								  </h3>
								  <div align="right">
							    	<a href="chipPage.do?p=tianTianTou/newproject" class="mybtn-primary" >发布新项目</a>
							      	<div class="clear"></div>
							      </div>
								  <div class="panel-body eventset-list border_plist" id="myProjectArea">
								    <!-- 项目区域 -->
								  </div>
								</div>
								
								<div id="myOrderService" class="panel panel-default">
								  <div class="panel-heading">
								    <h3 class="panel-title"><i class="li_img glyphicon glyphicon-bookmark"></i>预定服务</h3>
								  </div>
								  <div id="myOrderSerArea" class="panel-body">
								    <!-- 预定服务 -->
								  </div>
								</div>
								
								<div id="proDemo" class="panel panel-default">
								  <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-th-list"></i>项目案例
								  </h3>
								  <div id="proDemoArea" class="panel-body">
								    <!-- 项目案例 -->
								    <div class="clearfix">
								    	<a class="mybtn fRight" onclick="$('#proDemoDialog').modal('show');">添加案例</a>
								    </div>
								   
								    <hr/>
								    <div id="projectDemoListArea">
								    	<p>暂无数据</p>
								    </div>
								  </div>
								</div>
								
								<!-- 新增修改项目案例modal -->
								  <div id="proDemoContent">
								  	<form id="addProDemoForm" action="projectDemo/add.do" method="post" enctype="multipart/form-data" onsuccess="showProDemo()">
								  		<table class="form-table" style="width: 500px;margin: 0px auto;">
								  			<tr>
								  				<td style="width: 30%">标题</td>
								  				<td style="width: 70%">
								  					<div class="form-group has-feedback p0m0">
								  						<input needvalicate="true" valicate="_required _maxlen=15" maxlength="15" type="text" class="form-control" id="projectDemo_title" name="title" />
								  					</div>
								  				</td>
								  			</tr>
								  			
								  			<tr>
								  				<td style="width: 30%">logo</td>
								  				<td style="width: 70%">
								  					<div class="form-group has-feedback p0m0">
										  				<input type="file" id="projectDemo_file" name="file" class="form-control" style="width: 250px; "/>
										  				<input type="checkbox" style="vertical-align: top;"><span class="p5 font-lg">使用默认logo</span>
										  			</div>
								  				</td>
								  			</tr>
								  			
								  			<tr>
								  				<td style="width: 30%">简单描述</td>
								  				<td style="width: 70%">
								  					<div class="form-group has-feedback p0m0">
										  				<textarea rows="3" cols="" needvalicate="true" valicate="_maxlen=150" id="projectDemo_depict" name="depict" class="form-control" style="resize: none;" placeholder="100字以内"></textarea>
										  			</div>
								  				</td>
								  			</tr>
								  			
								  			
								  		</table>
								  		
								  	</form>
								  </div>
							
								
								<div id="myLike" class="panel panel-default">
								 <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-info-sign"></i>关注项目
								  </h3>
								  <div id="myLikeProArea" class="panel-body eventset-list border_plist">
								    <!-- 点赞项目 -->
								  </div>
								</div>
								
								<div id="myLikeServices" class="panel panel-default">
								 <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-heart"></i>收藏服务
								  </h3>
								  <div id="myLikeSerArea" class="panel-body eventset-list border_plist">
								    <!-- 点赞项目 -->
								  </div>
								</div>
								
								<div id="myFriends" class="panel panel-default">
								  <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-star"></i>我的好友
								  </h3>
								  <div id="myFriendArea" class="panel-body eventset-list border_plist">
								    <!-- 好友区域 -->
								  </div>
								</div>
								
								<div id="myWarning" class="panel panel-default">
									<h3 class="sectionTitleA bold c56 f18 mb20">
									  <i class="li_img glyphicon glyphicon-bell"></i>我的消息
								    </h3>
								    
								    <ul class="switch_tab clearfix">
										<li style="float: right;" toChild="2"><a>系统消息</a></li>
										<li style="float: right;" class="active" toChild="1"><a>用户消息</a></li>
									</ul>
									
									<div class="p10_0 _nav_content" child="1">
								    	<div id="search_area" style="padding:10px 10px 0px 0px;">
								    		<div>
										  		<a href="javaScript:void(0)" onclick="showMyMessages();" class="mybtn fRight m3">搜索</a>
											  	<input type="text" placeholder="用户名称" class="form-control fRight" id="msg_name" style="width: 200px;" />
											  	<div class="clear"></div>
										  	</div>
										  </div>
										  
										  <div id="warning_area" class="p10 warning_area">
										  	<!-- <a href="#" class="btn btn-default" onclick="openMsgDia();">打开对话框</a> -->
										  	<div id="msg_content" class="thinBorder clearfix" style="min-height: 400px;">
										  		<!-- 用户消息列表区域 -->
										  		<ul class="eventset-list" id="msgDataArea">
										  			<li>
														<i class="cell logo">
															<a href="#" target="_blank">
																<span class="incicon"><img src="http://pp1.gofreeteam.com/2016/03/09/5966eac50616480f8b9c31da1ffd2656.png@!logom"></span>
															</a>
														</i> 
														<i class="cell commpany">
															<span class="name">
																<a href="/startups/51311" target="_blank">Hotel Internet Services</a></span>
																<span class="desc"> Hotel Internet Services是一家酒店技术… </span>
																<span class="desc"> </span>
														</i>
														<i class="cell date">2016-03-09</i>
													</li>
										  		</ul>
										  	</div>
								    	  </div>
								    </div>
								    
								    <div class="p10_0 _nav_content" child="2" style="display: none;">
								    	<div id="search_area" style="padding:10px 10px 0px 0px;">
								    		<div>
										  		<a href="javaScript:void(0)" onclick="showSysMessages();" class="mybtn fRight m3">搜索</a>
										  		<input type="dateTime" class="form-control fRight" style="width:250px;" placeholder="开始日期" id="msgStartTime" />
										  		
										  		<div class="clear"></div>
										  	</div>
								    	</div>
								    	
								    	<div id="warning_area" class="p10 warning_area clearfix">
								    		<div id="sysMsgArea" class="p10 sysMsg thinBorder">
								  			
								  			</div>
								    	</div>
								    	
								    </div>	
								  
								</div>
								
								
								<div id="employeeArea" class="panel panel-default">
								    <h3 class="sectionTitleA bold c56 f18 mb20">
										<i class="li_img glyphicon glyphicon-briefcase"></i>人员管理
									</h3>
								    <span style="color:red;display: block;font-size: 12px;" class="p10">Tip:可以邀请本站的技术人员作为团队的成员，一个人只可以加入一个团队。在资源界面，可以通过搜索成员的职业搜索出企业、团队信息</span>
								    <div>
								    	<form id="deleteEmployeeForm" action="addOrUpdateEmployee.do" method="post">
								    	<table id="employee_table" class="table text-center pinfo table-striped table-bordered">
						  					<tr>
						  						<td colspan="8"  style="text-align: right;">
						  							<a href="javascript:void(0)" onclick="addOrUpdateEmployee('add')" class="btn btn-default btn-sm"><span class="glyphicon glyphicon-plus"></span>&nbsp;添加</a>
											  		<a href="javascript:void(0)" onclick="addOrUpdateEmployee('update')" class="btn btn-default  btn-sm"><span class="glyphicon glyphicon-pencil"></span>&nbsp;修改</a>
											  		<a href="javascript:void(0)" onclick="addOrUpdateEmployee('delete')" class="btn btn-default  btn-sm"><span class="glyphicon glyphicon-minus"></span>&nbsp;删除</a>
						  						</td>
						  					</tr>
								  			<tr class="text-center th">
								  				<td><input type="checkbox" onchange="setAllChecked(this,'employee_table')" /></td>
								  				<td>头像</td>
								  				<td>名称</td>
								  				<td>位置</td>
								  				<td>当前职位</td>
								  				<td>加入日期</td>
								  				<td>状态</td>
								  				<td>备注</td>
								  			</tr>
								  		</table>
								  		</form>
								  		<div align="center" class="p5 thinBorder" style="background: rgba(196,217,243,0.6);">
											<a id="_firstPage2" class="btn btn-default btn-xs" onclick="chipTo('first',this)">首页</a>
											<a class="btn btn-default btn-xs" onclick="chipTo('pre',this)">上一页</a>
											<span>第<span name="page">0</span>/<span id="totalPage2" name="totalPage">0</span>页</span>
											<a class="btn btn-default btn-xs" onclick="chipTo('next',this)">下一页</a>
											<a class="btn btn-default btn-xs" onclick="chipTo('last',this)">尾页</a>
											<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initEmployeeList');" value="queryCompanyUserRelationList.do"/>
										</div>
								    </div>
								    
								    
								</div>
								
								
								<div id="myInfo" class="panel ">
								  <div class="panel-heading">
								    <h3 class="panel-title"><i class="li_img glyphicon glyphicon-cog"></i>个人资料</h3>
								  </div>
								  <div class="panel-body">
								    <div id="baseInfo" class="pSetting thinBorder">
										<h4>基本资料</h4>
										<div class="p10 pSet-form">
											<form id="myInfoForm" action="updateMyInfo.do" method="post" enctype="multipart/form-data">
												<table class="form-group bI-Table">
													<tr style="height: 220px;border-top:1px lightgrey solid;">
														<td style="width: 30%;"><label for="headPic">LOGO</label></td>
														<td style="width: 60%;">
															<input id="headPic" name="headPic" type="file" class="fLeft" onchange="setImage(this,'imgDiv','imgPreView')" style="margin-top: 90px;"/>
															<!-- 预览图片在不同的浏览器下要用不同的代码 ，下面这段代码是要为判断浏览器做准备 -->
															<div id="imgDiv" class="imgDiv" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale);">
															<div class="thinBorder fRight" style="width: 200px;height: 200px;">
																<img id="imgPreView" class="imgPreView" width="200px" height="200px" src="<%=basePath%>webPages/images/${freeteam_user.headImg}" alt="预览" />
															</div>
															<div class="clearfix"></div>
														</td>
														<td style="width: 10%;"></td>
													</tr>
													<tr>
														<td><label>电子邮箱</label></td>
														<td><input type="text" disabled="disabled" id="myEmail" class="form-control" /></td>
														<td></td>
													</tr>
													<tr>
														<td><label>名称</label></td>
														<td><input type="text" disabled="disabled" id="nickName" class="form-control"/></td>
														<td></td>
													</tr>
													<tr>
														<td><label>所在地</label></td>
														<td id="pca" onclick="setPcaId(this)">
															<select id="province" value="500000" name="provinceCode" onchange="queryCity(this);" style="width: 32%;">
																<option value="-1">请选择</option>
															</select>
															<select id="city" name="cityCode" onchange="queryArea(this);"  style="width: 32%;">
																<option value="-1">请选择</option>
															</select>
															<select id="area" name="areaCode" style="width: 32%;">
																<option value="-1">请选择</option>
															</select>
														</td>
														<td></td>
													</tr>
													<tr>
														<td><label>详细地址</label></td>
														<td>
															<input type="text" class="form-control" id="address" name="address" value="${freeteam_company.address}"/>
														</td>
														<td></td>
													</tr>
													<tr>
														<td><label>网站
														</label></td>
														<td>
															<input type="text" class="form-control" id="hostUrl" name="hostUrl" value="${freeteam_company.hostUrl}"/>
														</td>
														<td></td>
													</tr>
													<tr>
														<td><label>联系人</label></td>
														<td>
															<input type="text" class="form-control" id="contact" name="contact" value="${freeteam_company.contact}"/>
														</td>
														<td></td>
													</tr>
													<tr>
														<td><label>联系电话</label></td>
														<td>
															<input type="text" class="form-control" id="conTel" name="conTel" value="${freeteam_company.conTel}"/>
														</td>
														<td></td>
													</tr>
													<tr>
														<td><label id="wr_creater">创建者</label></td>
														<td>
															<input type="text" class="form-control" id="fddbr" name="fddbr" value="${freeteam_company.fddbr}"/>
														</td>
														<td></td>
													</tr>
													<tr>
														<td><label>标签</label></td>
														<td>
															<input type="text" id="keyWord" name="keyWord" placeholder="最多添加五个标签" readonly="readonly" class="form-control" onclick="showTypeLabel()" value="${freeteam_user.keyWord }"/>
															<input type="hidden" id="keyWord_ids" name="keyWord_ids" value="${freeteam_user.keyWord_ids}"/>
															<div class="type-label" style="display: none;">
																<div class="close-btn fRight">
																	<span class="glyphicon glyphicon-remove"></span>
																</div>
															
																<li class="sys-label" style="border-bottom: 1px soild lightgrey">
																	<i class="active">PC网站</i>
																	<i>安卓APP</i>
																	<i>苹果APP</i>
																	<i>UI</i>
																	<i>硬件设计</i>
																	<i>苹果APP</i>
																	<i>UI</i>
																	<i>硬件设计</i>
																</li>
																
																<li class="user-label">
																	<a class="fRight mybtn" style="width: 70px;margin-right: 20px;">
																		<span class="glyphicon glyphicon-plus add-label-btn"></span>
																		<span class="add-label-btn">自定义</span>
																		<div class="add-label-self" style="display: none;">
																			<input type="text" maxlength="10" width="80px"/>
																			<span class="glyphicon glyphicon-ok add"></span>
																		</div>
																	</a>
																	<i>类型1</i>
																	<i>类型2</i>
																	<i>类型3</i>
																	<i>类型4</i>
																	<i>类型5</i>
																</li>
																<div class="text-center">
																	<a class="mybtn-primary submit">
																		<i class="glyphicon glyphicon-ok"></i>
																		<span>确定</span>
																	</a>
																</div>
															</div>
														</td>
													</tr>
													
													<tr>
														<td colspan="2" style="text-align: center">
															<input type="button" class="btn btn-primary" onclick="submitMyInfo();" value="保存" />
														</td>
														<td></td>
													</tr>
													
												</table>
												<input type="hidden" id="id" name="id" value="${freeteam_user.id}"/>
											</form>
										</div>
									</div>
									
									<div id="myIntroduce" class="pSetting thinBorder">
										<h4 id="intro_title">简介</h4>
										<div align="center">
											<textarea id="user_intro" name="intro" placeholder="请输入简介。最多500字" onkeyup="checkWord(this)" maxlength="500" style="width:90%;height:100px;resize: none;"></textarea>
											<p style="float: right;">已输入<big>0</big>字，还可输入<big>500</big>字</p>
											<div class="clearfix"></div>
										</div>
										<div style="text-align: center;">
											<button class="btn btn-primary" onclick="submitIntro();">保存</button>
										</div>
									</div>
									
									<div id="myDetails" class="pSetting">
										<h4>详细介绍</h4>
										<hr/>
										<div style="width: 90%;margin: 0px auto;margin-bottom: 10px;">
											<!-- 加载编辑器的容器 -->
											<script id="detailIntro" name="detailIntro" type="text/plain" style="width:100%;"></script>
											
											<!-- 配置文件 -->
										    <script type="text/javascript" src="webPages/ueditor/ueditor.config.js"></script>
										    <!-- 编辑器源码文件 -->
										    <script type="text/javascript" src="webPages/ueditor/ueditor.all.js"></script>
										    <!-- 实例化编辑器 -->
										    <script type="text/javascript">
										    	
										        var ue = UE.getEditor('detailIntro',{
										        	toolbars: [
													    [ 'source', 'undo', 'redo'],
													    ['bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'fontfamily','fontsize','forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist', 'selectall', 'cleardoc'],
													    ['simpleupload', 'insertimage', 'emotion', 'scrawl', 'insertvideo', 'music', 'map', 'insertcode', 'pagebreak', 'template', 'background', '|']
													],
													maximumWords:1000
										        });
										        
										    </script>
										</div>
										
										<div style="text-align: center;">
											<a class="mybtn-primary" onclick="submitMyDetailIntro();">保存</a>
										</div>
									
									</div>
									
									<div id="qyPic" class="pSetting thinBorder">
										<h4 id="">上传展示图片</h4>
										<p style="color:red;display: block;text-align: right;">用于展示企业风采，请上传三张相同尺寸且小于2M的图片进行展示</p>
										<form id="updateQyImgForm" action="uploadQyImgs.do" method="post" enctype="multipart/form-data">
											<div align="center" style="width:650px; margin: 0px auto;">
												<div class="fLeft">
													<div class="imgDiv" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale);"></div>
													<div class="myUploadImg thinBorder m5" style="width: 200px;height: 200px;overflow: hidden;" >
														<img  onclick="path1.click()" class="imgWH200px imgPreView" onerror="this.src='webPages/images/add.png'" src="<%=staticFilesPath%>webPages/upload/qyImg/${freeteam_company.qyImg1}" alt="点击选择上传图片" title="点击选择上传图片"/>
														<div class="upimg-descripe thinBorder" isbottom="1" >
															<p class="btn btn-info btn-sm" style="width: 100%;" onclick="showImgDescripe(this);">点击输入图片描述</p>
															<textarea name="qyImgDescribe1" tabindex="-1" style="width: 100%;height: 70px;resize: none;" onblur="showImgDescripe(this);" maxlength="50" placeholder="最多输入50字">${freeteam_company.qyImgDescribe1}</textarea>
														</div>
														<div class="clearfix"></div>
													</div>
													<input type="file" id="path1" name="img1" style="display:none" onchange="setImage(this)" />
												</div>
												
												<div class="fLeft">
													<div class="imgDiv" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale);"></div>
													<div class="myUploadImg thinBorder m5" style="width: 200px;height: 200px;overflow: hidden;" >
														<img  onclick="path2.click()" class="imgWH200px imgPreView" onerror="this.src='webPages/images/add.png'" src="<%=staticFilesPath%>webPages/upload/qyImg/${freeteam_company.qyImg2}" alt="点击选择上传图片" title="点击选择上传图片"/>
														<div class="upimg-descripe thinBorder" isbottom="1" >
															<p class="btn btn-info btn-sm" style="width: 100%;" onclick="showImgDescripe(this);">点击输入图片描述</p>
															<textarea name="qyImgDescribe2" tabindex="-1" style="width: 100%;height: 70px;resize: none;" maxlength="50" onblur="showImgDescripe(this);" placeholder="最多输入50字">${freeteam_company.qyImgDescribe2}</textarea>
														</div>
														<div class="clearfix"></div>
													</div>
													<input type="file" id="path2" name="img2" style="display:none" onchange="setImage(this)" />
												</div>
												
												<div class="fLeft">
													<div class="imgDiv" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale);"></div>
													<div class="myUploadImg thinBorder m5" style="width: 200px;height: 200px;overflow: hidden;" >
														<img  onclick="path3.click()" class="imgWH200px imgPreView" onerror="this.src='webPages/images/add.png'" src="<%=staticFilesPath%>webPages/upload/qyImg/${freeteam_company.qyImg3}" alt="点击选择上传图片" title="点击选择上传图片"/>
														<div class="upimg-descripe thinBorder" isbottom="1" >
															<p class="btn btn-info btn-sm" style="width: 100%;" onclick="showImgDescripe(this);">点击输入图片描述</p>
															<textarea name="qyImgDescribe3" tabindex="-1" style="width: 100%;height: 70px;resize: none;" maxlength="50" onblur="showImgDescripe(this);" placeholder="最多输入50字">${freeteam_company.qyImgDescribe3}</textarea>
														</div>
														<div class="clearfix"></div>
													</div>
													<input type="file" id="path3" name="img3" style="display:none" onchange="setImage(this)" />
												</div>
												<input type="hidden" name="userId" value="${freeteam_user.id}"/>
											
												<div class="clear"></div>
											</div>
											<div style="text-align: center;">
												<input class="btn btn-primary" type="submit" value="保存"/>
											</div>
										</form>
										<div id="qyImgForComputeScore" class="hidden">
											<input type="hidden" value="${freeteam_company.qyImg1}"/>
											<input type="hidden" value="${freeteam_company.qyImg2}"/>
											<input type="hidden" value="${freeteam_company.qyImg3}"/>
										</div>
									</div>
									
									<div id="bindPhone" class="pSetting ">
										<h4>绑定手机号码</h4>
										<hr/>
										<c:if test="${empty freeteam_user.phoneAvailable or freeteam_user.phoneAvailable=='0'}">
											<form id="phoneCodeForm" action="activePhone.do" method="post">
												<div align="center" style="height: 500px;">
													<table class="bI-Table">
														<tr>
															<td style="width: 10%;"></td>
															<td style="width: 20%;">
																<label>请输入手机号</label>
															</td>
															<td style="width: 60%;">
																<input id="valiTel" type="text" name="phone" class="form-control" style="width: 300px;"/>
															</td>
															<td style="width: 10%;"></td>
														</tr>
														<tr>
															<td></td>
															<td>
																<label>验证码</label>
															</td>
															<td>
																<input type="text" name="code" class="input1" maxlength="6" placeholder="请输入手机收到的验证码" style="width: 200px;"/>
																<span><input type="button" id="valiCodeBtn"  class="mybtn" onclick="getvalicode(this);" value="获取验证码"/></span>
															</td>
															<td></td>
														</tr>
														<tr>
															<td colspan="3" class="text-center">
																<a class="mybtn-primary" onclick="submitPhoneCode();">确定</a>
															</td>
														</tr>
													</table>
												</div>
											</form>
										</c:if>
										<c:if test="${freeteam_user.phoneAvailable=='1'}">
											<p style="text-align: center">
												您已绑定手机号：${freeteam_user.tel}
											</p>
										</c:if>
									</div>
									
									<div id="bindEmail" class="pSetting ">
										<h4>绑定邮箱</h4>
										<hr/>
										<c:if test="${empty freeteam_user.emailAvailable or freeteam_user.emailAvailable=='0'}">
											<form id="emailCodeForm" action="sendVerfiEmail.do" method="post">
												<input type="hidden" name="isAjax" value="true"/>
												<div align="center" style="height: 500px;">
													<table class="bI-Table">
														<tr>
															<td style="width: 10%;"></td>
															<td style="width: 20%;">
																<label>请输入邮箱号</label>
															</td>
															<td style="width: 60%;">
																<c:if test="${not empty freeteam_user.email}">
																	<span>${freeteam_user.email}</span>
																	<input type="hidden" name="userEmail" value="${freeteam_user.email}"/>
																</c:if>
																<c:if test="${empty freeteam_user.email}">
																	<input id="valiEmail" type="text" name="userEmail" class="form-control" style="width: 300px;" value="${freeteam_user.email }"/>
																</c:if>
																
															</td>
															<td style="width: 10%;"></td>
														</tr>
														<tr>
															<td colspan="3" class="text-center">
																<a class="mybtn-primary" onclick="submitEmailActive()">发送验证邮件</a>
															</td>
														</tr>
													</table>
												</div>
											</form>
										</c:if>
										<c:if test="${freeteam_user.emailAvailable=='1'}">
											<p style="text-align: center">
												您已绑定邮箱：${freeteam_user.email}
											</p>
										</c:if>
									</div>
									
									<div id="qyzz" class="pSetting thinBorder">
										<h4 id="">企业认证</h4>
										<p style="color:red;display: block;text-align: right;">请上传企业运营执照,确认图片清晰。</p>
										<div align="center">
											<h5 id="qyzzFlag">状态：未上传</h5>
											<input type="hidden" id="_qyzzFlag" value="${freeteam_company.qyzzFlag}"/>
											<input type="hidden" id="qyzzForComputeScore" value="${freeteam_company.qyzz}"/>
											<input type="hidden" id="qyzzMark" value="${freeteam_company.qyzzMark}"/>
										</div>
										<form id="uploadQyzzForm" action="updateQyzz.do" method="post" enctype="multipart/form-data">
											<div align="center" class="p10">
												<input type="file" class="thinBorder" name="qyzzImg"/>
											</div>
											<div style="text-align: center;">
												<input type="hidden" name="userId" value="${freeteam_user.id}"/>
												<input type="submit" class="btn btn-primary" onclick="submitIntro();" value="保存" />
											</div>
										</form>
									</div>
									
									
								  </div>
								</div>
								
							</div>
							
							<div id="otherSettings" class="panel panel-default">
							  <div class="panel-heading">
							    <h3 class="panel-title"><i class="li_img glyphicon glyphicon-bookmark"></i>其它设置</h3>
							  </div>
							  <div class="panel-body">
							    <table class="table text-center pinfo table-striped table-bordered verlignMiddle">
							    	<tr class="th">
										<td>条例</td>
										<td>状态</td>
										<td>作用</td>
									</tr>
							    	
							    	<tr>
										<td>目前状态</td>
										<td>
											<form>
												<div  align="center">
													<div id="cb1" class="cb">
														<input id="cbCore" type="hidden" onclick="changeMyStatus(this)" value="0" />
														<div class="cb-btn fLeft" onclick="controlCb('cb1',this)"></div>
														<div class="cb-text fRight">
															<span class="cb-t1">空闲</span>
															<span class="cb-t2 hidden">忙碌</span>
														</div>
														<div class="clear"></div>
													</div>
												</div>
											</form>
											
											
										</td>
										<td>
											系统默认为空闲，若设置为忙碌，将会减少项目搜索到您的机会。
										</td>
									</tr>
										<td>是否在个人主页显示服务列表</td>
										<td>
											<div  align="center">
												<div id="cb2" class="cb" >
													<input id="cbCore" type="hidden" onclick="changeIsServiceShow(this)" value="0" />
													<div class="cb-btn fLeft" onclick="controlCb('cb2',this)"></div>
													<div class="cb-text fRight">
														<span class="cb-t1">是</span>
														<span class="cb-t2 hidden">否</span>
													</div>
													<div class="clear"></div>
												</div>
											</div>
											
										</td>
										<td>
											选择否，将会取消在您的个人介绍页面显示您的服务列表。
										</td>
									</tr>
							    </table>
							  </div>
							</div>
							
						</div>
			        </div>
			        
			        <!-- 菜单栏 -->
			        <div class="projectHeadRight">
			        	<div class="projectIntro" style="height: 800px;">
			               <div id="myOption" class="pinfo">
								<!--个人头像start-->
								<div id="myIntro">
									<img id="_headPic" width="100px" height="100px" class="fLeft" src="<%=basePath%>webPages/images/defaultHeadPic.png" onerror="this.src='webPages/images/defaultHeadPic.png'" />
									<div class="fLeft p5" style="max-width:145px; text-align: left;">
										<h5 id="_nickName"></h5>
										<p><span class="glyphicon glyphicon-map-marker"></span><span id="_area"></span></p>
									</div>
									<div class="clear"></div>
								</div>
								<!--个人头像start-->
								
								<!--资料完整度start-->
								<div class="margin10_0" title="资料完整度">
									<div class="progress fLeft" style="width: 80%;">
									  <div id="progress-bar" class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%;">
									    60%
									  </div>
									</div>
									<img id="mrt_help" data-toggle="tooltip" width="16px" height="16px" class="fRight" src="webPages/images/wh.png" title=""></img>
									<div class="clear"></div>
								</div>
								<!--资料完整度end-->
								
								<!--功能菜单start-->
								<div class="thinBorder">
									<ul class="hostUl list-unstyled myfont">
										<li class="" onclick="showMyOrder(0,0)">
											<i class="li_img glyphicon glyphicon-bookmark"></i>
											<a href="javascript:void(0)" tohref="#myOrder">我的订单</a>
										</li>
										<li>
											<i class="li_img glyphicon glyphicon-yen"></i>
											<a href="#" tohref="#myAccount">我的账户</a>
										</li>
										
										<!-- <li  onclick="showMyOrderService()">
											<i class="li_img glyphicon glyphicon-bookmark"></i>
											<a href="javascript:void(0)" tohref="#myOrderService">预定服务</a>
										</li>
										<li  onclick="showMyOrderProject()">
											<i class="li_img glyphicon glyphicon-tags"></i>
											<a href="javascript:void(0)" tohref="#myOrderProject">参与项目</a>
										</li> -->
										<li  onclick="showAllMsg()">
											<i class="li_img glyphicon glyphicon-bell"></i>
											<a id="myWarning_link" href="javascript:void(0)" tohref="#myWarning">我的消息</a>
										</li>
										<li  onclick="showMyFriend()">
											<i class="li_img glyphicon glyphicon-user"></i>
											<a href="javascript:void(0)" tohref="#myFriends">我的好友</a>
										</li>
										
										<li  onclick="showMyLikeProject()">
											<i class="li_img glyphicon glyphicon-info-sign"></i>
											<a href="javascript:void(0)" tohref="#myLike">关注项目</a>
										</li>
										
										<li  onclick="showMyLikeService()">
											<i class="li_img glyphicon glyphicon-heart"></i>
											<a href="javascript:void(0)" tohref="#myLikeServices">收藏服务</a>
										</li>
										
										<li  onclick="showMyService();">
											<i class="li_img glyphicon glyphicon-star"></i>
											<a href="javascript:void(0);" tohref="#myService">我的服务</a>
										</li>
										<li  onclick="showMyProject();">
											<i class="li_img glyphicon glyphicon-list-alt"></i>
											<a href="javascript:void(0)" tohref="#myProject">我的项目</a>
										</li>
										
										<li  onclick="showProDemo()">
											<i class="li_img glyphicon glyphicon-th-list"></i>
											<a href="javascript:void(0)" tohref="#proDemo">项目案例</a>
										</li>
										<li id="myInfoLi" style="border-right: none ; padding-bottom: 0px;" onclick="showAllInfo();">
											<i class="li_img glyphicon glyphicon-cog"></i>
											<a href="javascript:void(0)"  tohref="#myInfo">个人资料</a>
										</li>
										<div class="p5" onclick="showAllInfo();">
											<ul class="list-unstyled settingUl">
												<li id="myInfo_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i><a href="#baseInfo" tohref="#myInfo">完善基本资料</a></li>
												<li id="myIntro_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i><a href="#myIntroduce" tohref="#myInfo">填写简介</a></li>
												<li id="myDetails_i"><i class="li_img li_img_error glyphicon glyphicon-exclamation-sign"></i><a href="#myDetails" tohref="#myInfo">填写详细资料</a></li>
												<li id="qyPic_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i><a href="#qyPic" tohref="#myInfo">上传形象图片</a></li>
												<li id="qyzz_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i><a href="#qyzz" tohref="#myInfo">企业执照认证</a></li>
												<li id="phone_i"><i class="li_img li_img_error glyphicon glyphicon-exclamation-sign"></i><a href="#bindPhone" tohref="#myInfo">绑定手机</a></li>
												<li id="email_i"><i class="li_img li_img_error glyphicon glyphicon-exclamation-sign"></i><a href="#bindEmail" tohref="#myInfo">验证邮箱</a></li>
												<li id="bzry_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i><a href="javascript:void(0)" onclick="showEmployeeList();" tohref="#employeeArea">人员管理</a></li>
											</ul>
										</div>
										
										<li>
											<i class="li_img glyphicon glyphicon-wrench"></i>
											<a href="javaScript:void(0)" onclick="showMyStatus()" tohref="#otherSettings">隐私策略</a>
										</li>
										
										<li>
											<i class="li_img glyphicon glyphicon-headphones"></i>
											<a href="pageTo.do?p=contactUs#links">意见反馈</a>
										</li>
									</ul>
									
								</div>
								<!--功能菜单end-->
							</div>
			            </div>
			        	
			        </div>
			    </div>
			</div>
			
			
		</div>
			
		<input type="hidden" id="id" value="${userId}"/>
		<jsp:include page="footer.jsp"></jsp:include>
		<link rel="stylesheet" href="<%=basePath%>webPages/js/ystep/css/ystep.css" />
		<script type="text/javascript" src="<%=basePath%>webPages/js/ystep/js/ystep.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/myHostPage.js"></script>
	</body>

</html>