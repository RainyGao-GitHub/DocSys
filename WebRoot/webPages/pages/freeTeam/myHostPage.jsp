<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String ttt = basePath + "webPages/pages/freeTeam/";
String staticFilesPath = "//static.gofreeteam.com/";
%>
<!DOCTYPE html>
<html>

	<head>
		<meta http-equiv="Content-Type" content="text/html" charset="UTF-8" />
		<meta name="renderer" content="webkit">
		<title>我的主页-自由团队</title>
		<meta name="keywords" content="IT兼职，自由团队" />
		<meta name="description" content="自由团队是一个专业高效的免费创业IT外包服务平台，致力于通过创业IT外包数据服务降低创业者和投资人的综合时间成本、提升整个社会的创业IT外包效率，从而创造新的社会价值！" />
		<meta http-equiv="x-ua-compatible" content="ie=8" />
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/resetV2.css" type="text/css" media="screen" />
		
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/boot-css/bootstrap.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/boot-css/bootstrap-theme.min.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/boot-css/bootstrap.comm.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/boot-css/bootstrap.custom.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/boot-fonts/css/font-awesome.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath %>webPages/js/select2/css/select2.min.css" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/old.css" type="text/css"/>
		<link rel="stylesheet" href="<%=basePath%>webPages/bootstrap/dateTimePicker/css/bootstrap-datetimepicker.min.css" />
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/messages_zh.js"></script>
		
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/jquery.cookie.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/bootstrap/dateTimePicker/bootstrap-datetimepicker.min.js" ></script>
		<script type="text/javascript" src="<%=basePath%>webPages/bootstrap/dateTimePicker/locales/bootstrap-datetimepicker.fr.js" charset="UTF-8"></script>
		<script src="<%=basePath%>/webPages/js/pageSplit.js"></script>
		<script type="text/javascript" src="<%=basePath %>webPages/js/select2/js/select2.min.js"></script>
		<script src="<%=basePath%>/webPages/pages/freeTeam/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/jquery.dateFormat.js"></script>
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
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/swiper.min.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/styleV2.css" type="text/css" media="screen" />
		
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/controller/index_v2.js"></script>
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
			.panel-default{ border: none; display: none;}
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
			.orderInfo{padding: 15px 0px 0px 10px;color: #757575;}
		</style>
	</head>

	<body>
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		
		<jsp:include page="head.jsp"></jsp:include>
		<jsp:include page="errorInfo.jsp"></jsp:include>
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
									  		<i value="-1" class="active">全部</i>
									  		<i value="0">待接单/待确认</i>
									  		<i value="1">待付款</i>
									  		<i value="2">待服务</i>
									  		<i value="3">服务中</i>
									  		<i value="4">待验收</i>
									  		<i value="5">待评价</i>
									  		<i value="6">已完成</i>
									  	</li>
								  	</div>
								  	<hr style="border-top: 2px #E3E3E3 solid;"/>
								  	<div class="ystep hidden" id="hidYstep"></div>
								  	<div class="order-data">
								  		<div id="orderList" class="panel-body eventset-list clearfix">
								  			
								  		</div>
								  	</div>
								  </div>
								</div>
								
								<div id="myAccount" class="panel panel-default">
								  <h3 class="sectionTitleA bold c56 f18">
									<i class="li_img li_img glyphicon glyphicon-yen"></i>我的账户
									<div class="fRight mr10" style="font-size: 14px;"><a href="pageTo.do?p=accountSetting">设置</a></div>
								  </h3>
								  <div class="panel-body">
								    <div>
								  		<table style="width:100%;" class="">
								  			<tr >
								  				<td class="w20"><span style="font-weight: bold;">账户余额：</span><span id="banlanceText">${freeteam_user.banlance}</span>元</td>
								  				<td>
								  					<a class="mybtn text-center mr15" style="width: 50px;display: inline-block;" onclick="toCharge();">充值</a>
								  					<a class="mybtn text-center mr15" style="width: 50px;display: inline-block;" onclick="toGetCharge();">提现</a>
								  					<span style="display: none;color: #757575;" id="chargeTip">提示：最低提现金额5元</span>
								  				</td>
								  			</tr>
								  			<!-- <tr>
								  				<td  ><span style="margin: 20px 0px;display: inline-block;font-weight: bold;">服务保证金：</span>10000.00</td>
								  			</tr> -->
								  		</table>
								  		
								  		
								  		<div class="clearfix" style="margin-top: 15px;padding-top: 15px;border-top: 1px lightgrey solid;">
								    		<div class="fRight">
								    			<input type="dateTime" class="form-control datetime" placeholder="开始日期" id="account_startTime" />
								    			<input type="dateTime" class="form-control datetime" placeholder="结束日期" id="account_endTime" />
								    			<a class="mybtn-primary" onclick="showMyAmount()">搜索</a>
								    		</div>
								    	</div>
								    	<div class="eventset-list">
								    		<li class="eventset-tit" style="margin-top: 0px;">
								  				<i class="cell logo w15">流水号</i>
												<i class="cell logo w15">日期</i>
												<i class="cell commpany w20">名称|备注</i>
												<i class="cell investor w15">收入(元)</i>
												<i class="cell investor w15">支出(元)</i>
												<i class="cell investor w10">状态</i>
												<i class="cell investor w10">详情</i>
								  			</li>
								    	</div>
								    	
								  		<div class="eventset-list" id="chargeList">
								  		</div>
								  		
								  		<div align="center" class="p5">
											<a id="account_firstPage" class="pageBtn" onclick="chipTo('first',this)">首页</a>
											<a class="pageBtn" onclick="chipTo('pre',this)">上一页</a>
											<span>第<span name="page">0</span>/<span id="account_totalPage" name="totalPage">0</span>页</span>
											<a class="pageBtn" onclick="chipTo('next',this)">下一页</a>
											<a class="pageBtn" onclick="chipTo('last',this)">尾页</a>
											<input type="hidden" name="hidUrl" onclick="showMyAmount()" value="deal/dealList.do"/>
										</div>
								    </div>
								  </div>
								  
								  <div id="accDetail">
								  	 <div class="row form-group">
								  	 	<div class="col-xs-1"></div>
								  	 	<label class="col-xs-3">流水号：</label>
								  	 	<label class="col-xs-7" id="acc_num">
								  	 		201608072045447011091819
								  	 	</label>
								  	 </div>
								  	 <hr style="margin: 10px 0px;"/>
								  	 <div class="row form-group">
								  	 	<div class="col-xs-1"></div>
								  	 	<label class="col-xs-3">状态：</label>
								  	 	<label class="col-xs-7" id="acc_status">
								  	 		待处理
								  	 	</label>
								  	 </div>
								  	 <hr style="margin: 10px 0px;"/>
								  	 <div class="row form-group">
								  	 	<div class="col-xs-1"></div>
								  	 	<label class="col-xs-3">类型：</label>
								  	 	<label class="col-xs-7" id="acc_type">
								  	 		充值
								  	 	</label>
								  	 </div>
								  	 <hr style="margin: 10px 0px;"/>
								  	 
								  	 <div class="row form-group payType" id="payType_0" style="display: none;">
								  	 	<div class="col-xs-1"></div>
								  	 	<label class="col-xs-3">付款途径：</label>
								  	 	<label class="col-xs-7" id="acc_payType">
											账户余额
								  	 	</label>
								  	 </div>
								  	 
								  	 <div class="row form-group payType" id="payType_1" style="display: none;">
								  	 	<div class="col-xs-1"></div>
								  	 	<label class="col-xs-3">付款途径：</label>
								  	 	<label class="col-xs-7" id="acc_payType">
											<img width="70px;" src="<%=basePath%>/webPages/images/alipayLogo.png">
								  	 	</label>
								  	 </div>
								  	 
								  	 <hr style="margin: 10px 0px;"/>
								  	 <div class="row form-group">
								  	 	<div class="col-xs-1"></div>
								  	 	<label class="col-xs-3">备注：</label>
								  	 	<label class="col-xs-7" id="acc_note">
								  	 		自由团队账户充值
								  	 	</label>
								  	 </div>
								  	 <hr style="margin: 10px 0px;"/>
								  	 <div class="row form-group">
								  	 	<div class="col-xs-1"></div>
								  	 	<label class="col-xs-3" id="acc_money_tip">收入/支出：</label>
								  	 	<label class="col-xs-7" id="acc_money">
								  	 		0.01
								  	 	</label>
								  	 </div>
								  	 <hr style="margin: 10px 0px;"/>
								  	 <div class="row form-group">
								  	 	<div class="col-xs-1"></div>
								  	 	<label class="col-xs-3">交易时间：</label>
								  	 	<label class="col-xs-7" id="acc_time">
								  	 		2016-08-07 21:53:23
								  	 	</label>
								  	 </div>
								  </div>
								</div>
								
								<div id="myService" class="panel panel-default">
								  <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-star"></i>服务
								  </h3>
								  <div align="right">
							    	<a href="chipPage.do?p=freeTeam/newservice" class="mybtn-primary" >发布新服务</a>
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
							    	<a href="chipPage.do?p=freeTeam/newproject" class="mybtn-primary" >发布新项目</a>
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
								    	<a class="mybtn fRight" onclick="showProDemoDialog();">添加案例</a>
								    </div>
								   
								    <hr/>
								    <div id="projectDemoListArea">
								    	<p>暂无数据</p>
								    </div>
								  </div>
								</div>
								
								<!-- 新增修改项目案例modal -->
								  <div id="proDemoContent" style="display: none;">
								  	<form id="addProDemoForm" action="projectDemo/add.do" method="post" enctype="multipart/form-data" onsuccess="showProDemo()">
								  		<table class="form-table" style="width: 500px;margin: 0px auto;">
								  			<tr>
								  				<td style="width: 30%">名称</td>
								  				<td style="width: 70%">
								  					<div class="form-group has-feedback p0m0">
								  						<input needvalicate="true" valicate="_required _maxlen=15" maxlength="15" type="text" class="form-control" id="projectDemo_title" name="title" />
								  					</div>
								  				</td>
								  			</tr>
								  			
								  			<tr>
								  				<td style="width: 30%">海报</td>
								  				<td style="width: 70%">
								  					<div class="form-group has-feedback p0m0">
										  				<input type="file" id="projectDemo_file" name="file" class="form-control" style="width: 250px; "/>
										  				<!-- <input type="checkbox" style="vertical-align: top;"><span class="p5 font-lg">使用默认logo</span> -->
										  			</div>
								  				</td>
								  			</tr>
								  			
								  			<tr>
								  				<td style="width: 30%">项目简介</td>
								  				<td style="width: 70%">
								  					<div class="form-group has-feedback p0m0">
										  				<textarea rows="3" cols="" needvalicate="true" maxlength="2000" id="projectDemo_depict" onkeyup="checkWord(this)" name="depict" class="form-control" style="resize: none;" placeholder="2000字以内"></textarea>
										  				<p style="float: right;">已输入<big>0</big>字，还可输入<big>2000</big>字</p>
										  			</div>
								  				</td>
								  			</tr>
								  			
								  			
								  		</table>
								  		
								  	</form>
								  </div>
								
								<div id="myLike" class="panel panel-default">
								 <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-info-sign"></i>关注的项目
								  </h3>
								  <div id="myLikeProArea" class="panel-body eventset-list border_plist">
								    <!-- 点赞项目 -->
								  </div>
								</div>
								
								<div id="myLikeServices" class="panel panel-default">
								 <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon glyphicon-heart"></i>收藏的服务
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
											<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initEmployeeList');" value="queryCompanyUserRelationList.do?companyId=${freeteam_user.id}"/>
										</div>
								    </div>
								    
								    <c:if test="${freeteam_user.type ne 1}">
								    <!-- 新增或者修改团队成员Dialog start -->
									<div id="employeeDiaArea" style="text-align: center;">
										<div>
											<ul id="addp_ul" class="nav nav-tabs" role="tablist">
												<li role="presentation" class="active"><a id="addp1" href="#home" aria-controls="home" role="tab" data-toggle="tab" onclick="disableForm('1')">添加本站人员</a></li>
    											<li role="presentation"><a id="addp2" href="#profile" aria-controls="profile" role="tab" data-toggle="tab" onclick="disableForm('2')">添加企业人员</a></li>
											</ul>
											<div class="tab-content">
												<div role="tabpanel" class="tab-pane active" id="home">
													<form id="employeeForm" action="addOrUpdateEmployee.do" method="post" abled="true" onsuccess="showEmployeeList()">
														<table class="form-table">
															<tr>
																<td style="width:100%">
																	<div>
																		<div class="input-group" onclick="showDropDown(this);">
																			<input id="employee_name" type="text" onkeyup="employeeQuery.click()" placeholder="选择用户，仅能选择未加入团队的用户" class="form-control"/>
																			<span class="btn btn-default input-group-addon"><span class="caret "></span></span>
																		</div>
																		<!-- <button class="btn btn-default" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
																		</button> -->
																		<div class="mydropdown thinBorder p10 pinfo" style="display:none">
																			<table id="employeeTable" style="width:100%;border-top: 1px lightgray solid;border-bottom: 1px lightgray solid;">
																				<tr>
																					<td>正在查找...</td>
																				</tr>
																			</table>
																			<div align="center" class="p5 thinBorder" style="background: rgba(196,217,243,0.6);">
																				<a id="_firstPage1" class="btn btn-default btn-xs" onclick="chipTo('first',this)">首页</a>
																				<a class="btn btn-default btn-xs" onclick="chipTo('pre',this)">上一页</a>
																				<span>第<span name="page">0</span>/<span id="totalPage" name="totalPage">0</span>页</span>
																				<a class="btn btn-default btn-xs" onclick="chipTo('next',this)">下一页</a>
																				<a class="btn btn-default btn-xs" onclick="chipTo('last',this)">尾页</a>
																				<input type="hidden" id="employeeQuery" name="hidUrl" onclick="doPageSplit(this,'initEmployee');" value="queryEmployeeListByName.do"/>
																			</div>
																			<div style="margin-top:10px;">
																				<a class="btn btn-default btn-xs" onclick="comfirmEmployee();">确定</a>
																				<a class="btn btn-default btn-xs" onclick="hideDropDown();">关闭</a>
																			</div>
																			
																		</div>
																	</div>
																</td>
															</tr>
															<tr>
																<td>
																	<input type="text" class="form-control" id="employee_area" disabled placeholder="所在地，选择用户后自动填充"/>
																</td>
															</tr>
															<tr>
																<td>
																	<input type="text" class="form-control" id="employee_job" disabled placeholder="目前职业，选择用户后自动填充"/>
																</td>
															</tr>
															<tr>
																<td>
																	<textarea class="form-control" id="employee_mark" name="mark" maxlength="50" placeholder="请添加备注,50字以内"></textarea>
																</td>
															</tr>
															<input type="hidden" id="employee_id" name="id"/>
															<input type="hidden" id="employee_userId" name="userId"/>
															<input type="hidden" id="_companyId" name="companyId" value="${freeteam_user.id}"/>
															<input type="hidden" id="employee_option" name="option" value=""/>
														</table>
													</form>
												</div>
   												<div role="tabpanel" class="tab-pane" id="profile">
   													<form id="addCompanyPersonForm" action="addCompanyPeople.do" enctype="multipart/form-data" onsuccess="refleshEmployeeTable()">
   														<table class="form-table">
   															<tr>
																<td style="width:20%">
																	头像：
																</td>
																<td style="width:80%; vertical-align: middle;">
																	<input id="capImg_btn" style="margin-top: 10%;" name="proImg" class="fLeft p10_0"  type="file" placeholder="请上传头像" value="浏览"/>
																	<img id="capImg" class="img-small fLeft" alt="预览" src="webPages/images/defaultHeadPic.png" onerror="this.src='webPages/images/defaultHeadPic.png'" />
																	<input type="hidden" id="hid_imgName" name="file" />
																	<input type="hidden" id="hid_capOption" name="option" value="add"/>
																	<input type="hidden" id="hid_capId" name="id" value=""/>
																	<div class="clear"></div>
																</td>
															</tr>
															<tr>
																<td style="width:20%">
																	姓名：
																</td>
																<td style="width:80%">
																	<input type="text" class="form-control" id="capName" name="name" placeholder="姓名"/>
																</td>
															</tr>
															<tr>
																<td>
																	所在地：
																</td>
																<td id="pca2" onclick="setPcaId(this)">
																	<select id="province" value="500000" name="provinceCode" onchange="queryCity(this);" style="width: 32%;">
																		<option value="-1">请选择</option>
																	</select>
																	<select id="city" name="cityCode" onchange="queryArea(this);"  style="width: 32%;">
																		<option value="-1">请选择</option>
																	</select>
																	<select id="area" name="area" style="width: 32%;">
																		<option value="-1">请选择</option>
																	</select>
																</td>
															</tr>
															<tr>
																<td>
																	职业：
																</td>
																<td>
																	<select id="cJob" style="width:50%" onchange="setJob2(this)" class="fLeft"></select>
																	<select id="cJob2" style="width:50%" name="job" class="fLeft" value=""></select>
																	<div class="clear">
																</td>
															</tr>
															<tr>
																<td>
																	描述：
																</td>
																<td>
																	<textarea maxlength="50" id="capMark" class="form-control" name="mark" placeholder="请添加备注，50字以内"></textarea>
																	<input type="hidden" name="companyId" value="${freeteam_user.id}"/>
																</td>
															</tr>
														</table>
   													</form>
   												</div>
											</div>
										</div>
									</div>
									</c:if>
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
											<a id="_firstPage3" class="btn btn-default btn-xs" onclick="chipTo('first',this)">首页</a>
											<a class="btn btn-default btn-xs" onclick="chipTo('pre',this)">上一页</a>
											<span>第<span name="page">0</span>/<span id="totalPage3" name="totalPage">0</span>页</span>
											<a class="btn btn-default btn-xs" onclick="chipTo('next',this)">下一页</a>
											<a class="btn btn-default btn-xs" onclick="chipTo('last',this)">尾页</a>
											<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initEmployeeList');" value="queryCompanyUserRelationList.do?companyId=${freeteam_user.id}"/>
										</div>
								    </div>
									
								</div>	
								
								
								
														
								<div id="TeamArea" class="panel panel-default">
								    <h3 class="sectionTitleA bold c56 f18 mb20">
										<i class="li_img glyphicon glyphicon-briefcase"></i>团队管理
									</h3>
								    <span style="color:red;display: block;font-size: 12px;" class="p10">Tip:只可以加入一个团队，退出当前团队才可加入其他团队。</span>
								    <div>
								    	<form id="TeamForm" action="addOrUpdateEmployee.do" method="post">
								    	<table id="TeamTable" class="table text-center pinfo table-striped table-bordered">
								  			<tr class="text-center th">
								  				<td>LOGO</td>
								  				<td>名称</td>
								  				<td>状态</td>
								  				<td>操作</td>
								  			</tr>
								  		</table>
								  		</form>
								    </div>
								    
								</div>
								
								<div id="myInfo" class="panel panel-default">
									<h3 class="sectionTitleA bold c56 f18 mb20">
									  <i class="li_img glyphicon glyphicon-cog"></i>
									 	<c:if test="${freeteam_user.type eq 1}">个人资料</c:if>
										<c:if test="${freeteam_user.type eq 2}">团队资料</c:if>
										<c:if test="${freeteam_user.type eq 3}">企业资料</c:if>
								    </h3>
								  <div class="panel-body">
								    <div id="baseInfo" class="pSetting ">
										<h4>基本资料</h4>
										<div class="p10 pSet-form">
											<form id="myInfoForm" action="updateMyInfo.do" method="post" enctype="multipart/form-data">
												<table class="form-group bI-Table">
													<tr style="height: 220px;border-top:1px lightgrey solid;">
														<td style="width: 30%;">
															<label for="headPic">
																<c:if test="${freeteam_user.type eq 1}">个人头像</c:if>
																<c:if test="${freeteam_user.type eq 2}">团队头像</c:if>
																<c:if test="${freeteam_user.type eq 3}">企业头像</c:if>
															</label>
														</td>
														<td style="width: 60%;">
															<input id="headPic" name="headPic" type="file" class="fLeft" onchange="setImage(this,'imgDiv','imgPreView')" style="margin-top: 90px;"/>
															<!-- 预览图片在不同的浏览器下要用不同的代码 ，下面这段代码是要为判断浏览器做准备 -->
															<div id="imgDiv" class="imgDiv" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale);">
															<div class="thinBorder fRight" style="width: 200px;height: 200px;">
																<img id="imgPreView" class="imgPreView" width="200px" height="200px" src="" alt="预览" />
															</div>
															<div class="clearfix"></div>
														</td>
														<td style="width: 10%;"></td>
													</tr>
													<tr>
														<td><label>电子邮箱</label></td>
														<td><input type="text" disabled="disabled" maxlength="40" id="myEmail" class="form-control" /></td>
														<td></td>
													</tr>
													<c:if test="${freeteam_user.type eq 1}">
													<tr>
														<td><label>真实姓名</label></td>
														<td><input type="text" id="realName" name="realName" class="form-control" placeholder="请如实填写，设置后无法修改"/></td>
														<td></td>
													</tr>
													<tr>
														<td><label>昵称</label></td>
														<td><input type="text" id="nickName" name="nickName" class="form-control"/></td>
														<td></td>
													</tr>
													</c:if>
													<c:if test="${freeteam_user.type eq 2}">
													<tr>
														<td><label>团队名称</label></td>
														<td><input type="text" id="nickName" name="nickName" class="form-control" disabled="disabled"/></td>
														<td></td>
													</tr>
													<!--  <tr>
														<td><label>团队全称</label></td>
														<td><input type="text" id="realName" name="realName" class="form-control"/></td>
														<td></td>
													</tr>  -->
													</c:if>
													<c:if test="${freeteam_user.type eq 3}">
													<tr>
														<td><label>企业名称</label></td>
														<td><input type="text" id="nickName" name="nickName" class="form-control" disabled="disabled"/></td>
														<td></td>
													</tr>
													<!-- <tr>
														<td><label>企业全称</label></td>
														<td><input type="text" id="realName" name="realName" class="form-control"/></td>
														<td></td>
													</tr>  -->
													</c:if>
													
													<c:if test="${freeteam_user.type eq 1}">
														<tr>
															<td><label>性别</label></td>
															<td>
																<select id="sex" name="sex" type="text" class="form-control">
																	<option value="0">--请选择--</option>
																	<option value="1">男</option>
																	<option value="2">女</option>
																</select>
															</td>
															<td></td>
														</tr>
														<tr>
															<td><label>居住地</label></td>
															<td id="pca">
																<select id="province" value="500000" name="provinceCode" onchange="queryCity(this);" style="width: 32%;">
																	<option value="-1">请选择</option>
																</select>
																<select id="city" name="cityCode" onchange="queryArea(this);"  style="width: 33%;">
																	<option value="-1">请选择</option>
																</select>
																<select id="area" name="areaCode" style="width: 33%;">
																	<option value="-1">请选择</option>
																</select>
															</td>
															<td></td>
														</tr>
														<tr>
															<td><label>所属行业</label></td>
															<td>
																<select id="busiType" style="width:50%" onchange="setBusiType2(this)" class="form-control fLeft"></select>
																<select id="busiType2" style="width:50%" name="jobType" class="form-control fLeft"></select>
																<div class="clear">
															</td>
															<td></td>
														</tr>
														<tr>
															<td><label>目前职位</label></td>
															<td>
																<select id="cJob" style="width:50%" onchange="setJob2(this)" class="form-control fLeft"></select>
																<select id="cJob2" style="width:50%" name="job" class="form-control fLeft" value=""></select>
																<div class="clear">
															</td>
															<td></td>
														</tr>
													</c:if>
													
													<c:if test="${freeteam_user.type ne 1}">
														<tr>
															<td><label>所在地区</label></td>
															<td id="pca">
																<select id="province" value="500000" name="provinceCode" onchange="queryCity(this);" style="width: 32%;">
																	<option value="-1">请选择</option>
																</select>
																<select id="city" name="cityCode" onchange="queryArea(this);"  style="width: 33%;">
																	<option value="-1">请选择</option>
																</select>
																<select id="area" name="areaCode" style="width: 33%;">
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
															<td><label>负责人</label></td>
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
														<!-- <tr>
															<td><label id="wr_creater">创建人</label></td>
															<td>
																<input type="text" class="form-control" id="fddbr" name="fddbr" value="${freeteam_company.fddbr}"/>
															</td>
															<td></td>
														</tr> -->
													</c:if>

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
																		<span class="glyphicon glyphicon-ok"></span>
																		<span>确定</span>
																	</a>
																</div>
															</div>
														</td>
													</tr>
													
													
													<tr>
														<td colspan="2" style="text-align: center">
															<a type="button" class="mybtn-primary" onclick="submitMyInfo();">保存</a>
														</td>
														<td></td>
													</tr>
													
													
												</table>
												<input type="hidden" id="id" name="id" value="${freeteam_user.id}"/>
											</form>
										</div>
									</div>
									
									
									<div id="myIntroduce" class="pSetting ">
										<h4>
											<c:if test="${freeteam_user.type eq 1}">个人简介</c:if>
											<c:if test="${freeteam_user.type eq 2}">团队简介</c:if>
											<c:if test="${freeteam_user.type eq 3}">企业简介</c:if>
										</h4>
										<hr/>
										<div align="center">
											<textarea id="user_intro" name="intro" placeholder="请输入简介。最多200字" onkeyup="checkWord(this)" maxlength="2000" style="width:90%;height:100px;resize: none;"></textarea>
											<p style="float: right;">已输入<big>0</big>字，还可输入<big>2000</big>字</p>
											<div class="clearfix"></div>
										</div>
										<div style="text-align: center;">
											<a class="mybtn-primary" onclick="submitIntro();">保存</a>
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
										    	

										        
										    </script>
										</div>
										
										<div style="text-align: center;">
											<a class="mybtn-primary" onclick="submitMyDetailIntro();">保存</a>
										</div>
									
									</div>
									
									
									<c:if test="${freeteam_user.type eq 1}">
										<div id="workEx" class="pSetting ">
											<h4>填写职业经历</h4>
											<hr/>
											<div>
												<div class="prj_ex">
									  				<table id="job_table" class="table text-center pinfo table-striped table-bordered">
									  					<tr align="right">
									  						<td colspan="5" style="text-align: right;">
									  							<a href="javascript:void(0)" onclick="doJobExperience('add')" class="btn btn-default btn-sm"><span class="glyphicon glyphicon-plus"></span>&nbsp;添加</a>
														  		<a href="javascript:void(0)" onclick="doJobExperience('update')" class="btn btn-default  btn-sm"><span class="glyphicon glyphicon-pencil"></span>&nbsp;修改</a>
														  		<a href="javascript:void(0)" onclick="doJobExperience('delete')" class="btn btn-default  btn-sm"><span class="glyphicon glyphicon-minus"></span>&nbsp;删除</a>
									  						</td>
									  					</tr>
											  			<tr class="text-center th">
											  				<td><input type="checkbox" onchange="setAllChecked(this,'job_table')" /></td>
											  				<td>开始日期</td>
											  				<td>结束日期</td>
											  				<td>所在公司</td>
											  				<td>职位</td>
											  			</tr>
											  			<!-- <tr>
											  				<td><input type="checkbox" /></td>
											  				<td>2014年11月</td>
											  				<td>2015年5月</td>
											  				<td>信雅达java工程师java工程师</td>
											  				<td>java工程师java工程师</td>
											  			</tr> -->
											  		</table>
											  		
											  	</div>
											</div>
										</div>
										<!-- 新增或者修改工作经历Dialog start -->
										<div id="jobContent" style="text-align: center;">
											<form id="jobForm" action="addJobExperience.do" method="post">
												<table class="form-table" style="width: 500px;margin: 0px auto;">
													<tr>
														<td style="width:30%">
															开始日期：
														</td>
														<td style="width:70%">
															<div class="form-group has-feedback p0m0">
																<input needvalicate="true" valicate="_required _maxlen=10" maxlength="10" type="dateTime" class="form-control" id="jobStartTime" name="startTime" />
															</div>
														</td>
													</tr>
													<tr>
														<td style="width:30%">
															结束日期：
														</td>
														<td style="width:70%">
															<div class="form-group has-feedback p0m0">
																<input needvalicate="true" valicate="_required _maxlen=10" maxlength="10" type="dateTime" class="form-control" id="jobEndTime" name="endTime" />
															</div>
														</td>
													</tr>
													<tr>
														<td style="width:30%">
															所在公司：
														</td>
														<td style="width:70%">
															<div class="form-group has-feedback p0m0">
																<input needvalicate="true" valicate="_required _maxlen=20" maxlength="20" type="text" class="form-control" id="company" name="company" />
															</div>
														</td>
													</tr>
													<tr>
														<td style="width:30%">
															职位：
														</td>
														<td style="width:70%">
															<div class="form-group has-feedback p0m0">
																<input needvalicate="true" valicate="_required _maxlen=20" maxlength="20" type="text" class="form-control" id="jJob" name="job" />
															</div>
														</td>
													</tr>
													<input type="hidden" id="jobId" name="id"/>
												</table>
											</form>
											
										</div>
										<!-- 新增或者修改工作经历Dialog end -->
										<div id="eduEx" class="pSetting ">
											<h4>填写教育经历</h4>
											<hr/>
											<div align="center">
											    <table id="edu_table" class="table text-center pinfo table-striped table-bordered">
											    	<tr align="right">
								  						<td colspan="5" style="text-align: right;">
								  							<a href="javascript:void(0)" onclick="doEduExperience('add')" class="btn btn-default btn-sm"><span class="glyphicon glyphicon-plus"></span>&nbsp;添加</a>
													  		<a href="javascript:void(0)" onclick="doEduExperience('update')" class="btn btn-default  btn-sm"><span class="glyphicon glyphicon-pencil"></span>&nbsp;修改</a>
													  		<a href="javascript:void(0)" onclick="doEduExperience('delete')" class="btn btn-default  btn-sm"><span class="glyphicon glyphicon-minus"></span>&nbsp;删除</a>
								  						</td>
								  					</tr>
										  			<tr class="text-center th">
										  				<td><input type="checkbox" /></td>
										  				<td>开始日期</td>
										  				<td>结束日期</td>
										  				<td>所在学校</td>
										  				<td>专业</td>
										  			</tr>
										  			<!-- <tr>
										  				<td><input type="checkbox" /></td>
										  				<td>2010年6月</td>
										  				<td>2014年6月</td>
										  				<td>华北水利水电大学</td>
										  				<td>计算机科学与技术</td>
										  			</tr> -->
										  		</table>
											</div>
										</div>
										
										<!-- 新增或者修改教育经历Dialog start -->
										<div id="eduContent" style="text-align: center;">
											<form id="eduForm" action="addEduExperience.do" method="post">
												<table class="form-table" style="width: 500px;margin: 0px auto;">
													<tr>
														<td style="width:30%">
															开始日期：
														</td>
														<td style="width:70%">
															<div class="form-group has-feedback p0m0">
																<input needvalicate="true" valicate="_required _maxlen=10" maxlength="10" type="dateTime" class="form-control" id="eduStartTime" name="startTime" />
															</div>
														</td>
													</tr>
													<tr>
														<td style="width:30%">
															结束日期：
														</td>
														<td style="width:70%">
															<div class="form-group has-feedback p0m0">
																<input needvalicate="true" valicate="_required _maxlen=10" maxlength="10" type="dateTime" class="form-control" id="eduEndTime" name="endTime" />
															</div>
														</td>
													</tr>
													<tr>
														<td style="width:30%">
															所在学校：
														</td>
														<td style="width:70%">
															<div class="form-group has-feedback p0m0">
																<input needvalicate="true" valicate="_required _maxlen=20" maxlength="20" type="text" class="form-control" id="school" name="school" />
															</div>
														</td>
													</tr>
													<tr>
														<td style="width:30%">
															专业：
														</td>
														<td style="width:70%">
															<div class="form-group has-feedback p0m0">
																<input needvalicate="true" valicate="_required _maxlen=20" maxlength="20" type="text" class="form-control" id="mojor" name="mojor" />
															</div>
														</td>
													</tr>
													<input type="hidden" id="eduId" name="id"/>
												</table>
											</form>
										</div>
									
									</c:if>
									
									
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
																<input id="valiTel" type="text" name="phone" maxlength="11" class="form-control" style="width: 300px;"/>
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
																	<input id="valiEmail" type="text" maxlength="40" name="userEmail" class="form-control" style="width: 300px;" value="${freeteam_user.email }"/>
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
									
									
								  </div>
								</div>
							</div>
							
							<div id="yhrz" class="panel panel-default">
								 <h3 class="sectionTitleA bold c56 f18 mb20">
									<i class="li_img glyphicon  glyphicon-ok-circle"></i>用户认证
								  </h3>
								  <div class="panel-body">
									<div id="qyzz" class="pSetting">
										<h4 id="">
											<c:if test="${freeteam_user.type eq 1}">个人认证</c:if>
											<c:if test="${freeteam_user.type eq 2}">团队认证</c:if>
											<c:if test="${freeteam_user.type eq 3}">企业认证</c:if>
											<small class="text-left" id="yhrzStatus"></small>
										</h4>
										<hr/>
										<p id="yhrzTip" style="color:red;display: block;text-align: left;">
											<c:if test="${freeteam_user.type eq 1}">请上传个人身份证证件照，要求正反两面。</c:if>
											<c:if test="${freeteam_user.type eq 2}">请上传团队负责人的身份证证件照，要求正反两面。</c:if>
											<c:if test="${freeteam_user.type eq 3}">请上传企业营业执照。</c:if>
										</p>
										<form id="yhrzForm" action="idCard/addIdCard.do" class="hidden" method="post" enctype="multipart/form-data">
											<!-- <div align="center" class="p10">
												<input type="file" class="thinBorder" name="qyzzImg"/>
											</div> -->
											<div class="form-group row">
												<c:if test="${freeteam_user.type eq 1}">
													<label class="col-xs-3 p5" for="name">真实姓名：</label>
													<div class="col-xs-6">
														<input type="text" class="form-control" name="name" maxlength="15" required="required" value="${freeteam_user.realName}"/>
													</div>
												</c:if>
												<c:if test="${freeteam_user.type eq 2}">
													<label class="col-xs-3 p5" for="name">负责人姓名：</label>
													<div class="col-xs-6">
														<input type="text" class="form-control" name="name" maxlength="15" required="required" value="${freeteam_company.contact}"/>
													</div>
												</c:if>
												<c:if test="${freeteam_user.type eq 3}">
													<label class="col-xs-3 p5" for="name">企业名称：</label>
													<div class="col-xs-6">
														<input type="text" class="form-control" name="name" maxlength="15" required="required" value="${freeteam_user.nickName}"/>
													</div>
												</c:if>
											</div>
											<hr/>
											<div class="form-group row">
												<label class="col-xs-3 p5" for="code">证件号码：</label>
												<div class="col-xs-6">
													<c:if test="${freeteam_user.type eq 1}">
														<input type="text" class="form-control" name="code" maxlength="18"  required="required" sfz="sfz"/>
													</c:if>
													<c:if test="${freeteam_user.type eq 2}">
														<input type="text" class="form-control" name="code" maxlength="18"  required="required" sfz="sfz"/>
													</c:if>
													<c:if test="${freeteam_user.type eq 3}">
														<input type="text" class="form-control" name="code" minlength="15" maxlength="15"  required="required" number="number" min="0"/>
													</c:if>
												</div>
											</div>
											<hr/>
											<c:if test="${freeteam_user.type ne 3}">
												<div class="form-group row">
													<label class="col-xs-3 p5" for="idCard">身份证正面：</label>
													<div class="col-xs-6">
														<input type="file" class="form-control" name="idCard"  required="required"/>
													</div>
												</div>
												<hr/>
												<div class="form-group row">
													<label class="col-xs-3 p5" for="idCard">身份证背面：</label>
													<div class="col-xs-6">
														<input type="file" class="form-control" id="idCard2" name="idCard2"  required="required"/>
													</div>
												</div>
											</c:if>
											
											<c:if test="${freeteam_user.type eq 3}">
												<div class="form-group row">
													<label class="col-xs-3 p5" for="idCard">上传营业执照：</label>
													<div class="col-xs-6">
														<input type="file" class="form-control" name="idCard"  required="required"/>
													</div>
												</div>
											</c:if>
											
											<hr/>
											<div class="form-group row text-center">
												<input type="button" class="mybtn-primary" onclick="submitYhrz();" value="保存" />
											</div>
										</form>
									</div>
								  </div>
							</div>
							
							<div id="otherSettings" class="panel panel-default">
							  <div class="panel-heading">
							    <h3 class="panel-title"><i class="li_img glyphicon glyphicon-bookmark"></i>其他设置</h3>
							  </div>
							  <div class="panel-body">
							    <table class="table text-center pinfo table-striped table-bordered verlignMiddle">
							    	<tr class="th">
										<td style="width:20%">设置</td>
										<td style="width:40%">状态</td>
										<td style="width:40%">说明</td>
									</tr>
							    	
							    	<tr>
										<td>允许搜索</td>
										<td>
											<form>
												<div  align="center">
													<div id="cb1" class="cb">
														<input id="cbCore" type="hidden" onclick="changeMyStatus(this)" value="0" />
														<div class="cb-btn fLeft" onclick="controlCb('cb1',this)"></div>
														<div class="cb-text fRight">
															<span class="cb-t1">开启</span>
															<span class="cb-t2 hidden">关闭</span>
														</div>
														<div class="clear"></div>
													</div>
													<!--
													<select id="busiStatus" style="width:120px;" value="${freeteam_user.currentStatus }" onchange="changeMyStatus(this)">
														<option value="0" <c:if test="${freeteam_user.currentStatus eq 0}">selected="selected"</c:if>>空闲</option>
														<option value="1" <c:if test="${freeteam_user.currentStatus eq 1}">selected="selected"</c:if>>忙碌</option>
													</select>
													-->
												</div>
											</form>
										</td>
										<td>
											关闭后，其他用户将无法搜索到你
										</td>
									</tr>
									<tr>
										<td>谁可以给我发消息</td>
										<td>
											<div  align="center">
												<select id="showServiceStatus"  style="width:240px;" value="${freeteam_user.showService }" onchange="changeIsServiceShow(this)">
													<option value="0" <c:if test="${freeteam_user.showService eq 0}">selected="selected"</c:if>>所有人</option>
													<option value="1" <c:if test="${freeteam_user.showService eq 1}">selected="selected"</c:if>>仅好友</option>
												</select>
											</div>
											
										</td>
										<td>
											设置为仅好友，将无法接收陌生人的消息
										</td>
									</tr>
									<c:if test="${freeteam_user.type eq 1}">
									<tr>
										<td>我的资料</td>
										<td>
											<div  align="center">
												<select id="showInfoStatus"  style="width:240px;" value="${freeteam_user.showInfo }" onchange="changeIsInfoShow(this)">
													<option value="0" <c:if test="${freeteam_user.showInfo eq 0}">selected="selected"</c:if>>所有人可见</option>
													<option value="1" <c:if test="${freeteam_user.showInfo eq 1}">selected="selected"</c:if>>仅好友可见</option>
													<option value="2" <c:if test="${freeteam_user.showInfo eq 2}">selected="selected"</c:if>>保密</option>
												</select>
											</div>
											
										</td>
										<td>
											我的资料包括真实姓名、职业经历以及教育经历
										</td>
									</tr>
									</c:if>
									<!-- 
									<tr>
										<td>我的服务</td>
										<td>
											<div  align="center">
												<select id="showServiceStatus"  style="width:240px;" value="${freeteam_user.showService }" onchange="changeIsServiceShow(this)">
													<option value="0" <c:if test="${freeteam_user.showService eq 0}">selected="selected"</c:if>>所有人可见</option>
													<option value="1" <c:if test="${freeteam_user.showService eq 1}">selected="selected"</c:if>>仅好友可见</option>
												</select>
											</div>
											
										</td>
										<td>
											默认为所有人可见
										</td>
									</tr>
									<tr>
										<td>我的项目</td>
										<td>
											<div  align="center">
												<select id="showServiceStatus"  style="width:240px;" value="${freeteam_user.showService }" onchange="changeIsServiceShow(this)">
													<option value="0" <c:if test="${freeteam_user.showService eq 0}">selected="selected"</c:if>>所有人可见</option>
													<option value="1" <c:if test="${freeteam_user.showService eq 1}">selected="selected"</c:if>>仅好友可见</option>
												</select>
											</div>
											
										</td>
										<td>
											默认为所有人可见
										</td>
									</tr>
									-->
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
										<li class="" onclick="showMyOrder(0,-1)">
											<i class="li_img glyphicon glyphicon-bookmark"></i>
											<a href="javascript:void(0)" tohref="#myOrder">我的订单</a>
										</li>
										<li onclick="account_firstPage.click()">
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
										<li id="myFriendLi" onclick="showMyFriend()">
											<i class="li_img glyphicon glyphicon-user"></i>
											<a href="javascript:void(0)" tohref="#myFriends">我的好友</a>
										</li>
										
										<li  onclick="showMyLikeProject()">
											<i class="li_img glyphicon glyphicon-info-sign"></i>
											<a href="javascript:void(0)" tohref="#myLike">关注的项目</a>
										</li>
										
										<li  onclick="showMyLikeService()">
											<i class="li_img glyphicon glyphicon-heart"></i>
											<a href="javascript:void(0)" tohref="#myLikeServices">收藏的服务</a>
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
										
										<!-- <li  onclick="showMyLikeProject()">
											<i class="li_img glyphicon glyphicon-heart"></i>
											<a href="javascript:void(0)" tohref="#myLike">我的成员</a>
										</li> -->
										
										<li id="myInfoLi" class="" style="border-right: none ; padding-bottom: 0px; " onclick="showAllInfo();">
											<i class="li_img glyphicon glyphicon-cog"></i>
											<a href="javascript:void(0)"  tohref="#myInfo">
												<c:if test="${freeteam_user.type eq 1}">个人资料</c:if>
												<c:if test="${freeteam_user.type eq 2}">团队资料</c:if>
												<c:if test="${freeteam_user.type eq 3}">企业资料</c:if>
											</a>
										</li>
										<div class="p5" onclick="showAllInfo();">
											<ul class="list-unstyled settingUl">
												<li id="myInfo_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i><a href="#baseInfo" tohref="#myInfo">完善基本资料</a></li>
												<li id="myIntro_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i>
													<a href="#myIntroduce" tohref="#myInfo">
														<c:if test="${freeteam_user.type eq 1}">填写个人简介</c:if>
														<c:if test="${freeteam_user.type eq 2}">填写团队简介</c:if>
														<c:if test="${freeteam_user.type eq 3}">填写企业简介</c:if>
													</a>
												</li>
												<li id="myDetails_i"><i class="li_img li_img_error glyphicon glyphicon-exclamation-sign"></i><a href="#myDetails" tohref="#myInfo">填写详细资料</a></li>
												<c:if test="${freeteam_user.type eq 1}">
													<li id="job_i"><i class="li_img li_img_error glyphicon glyphicon-exclamation-sign"></i><a href="#workEx" tohref="#myInfo">填写职业经历</a></li>
													<li id="edu_i"><i class="li_img li_img_error glyphicon glyphicon-exclamation-sign"></i><a href="#eduEx" tohref="#myInfo">填写教育经历</a></li>
												</c:if>
												<li id="phone_i"><i class="li_img li_img_error glyphicon glyphicon-exclamation-sign"></i><a href="#bindPhone" tohref="#myInfo">绑定手机</a></li>
												<li id="email_i"><i class="li_img li_img_error glyphicon glyphicon-exclamation-sign"></i><a href="#bindEmail" tohref="#myInfo">验证邮箱</a></li>
												<c:if test="${freeteam_user.type ne 1}">
													<li id="member_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i><a href="javascript:void(0)" onclick="showEmployeeList();" tohref="#employeeArea">人员管理</a></li>
												</c:if>
												<c:if test="${freeteam_user.type eq 1}">
													<li id="group_i"><i class="li_img li_img_success glyphicon glyphicon-ok"></i><a href="javascript:void(0)" onclick="showEmployeeList();" tohref="#TeamArea">团队管理</a></li>
												</c:if>
											</ul>
										</div>
										
										<li  onclick="queryYhrzInfo()">
											<i class="li_img glyphicon glyphicon-ok-circle"></i>
											<a href="javascript:void(0);" tohref="#yhrz">用户认证</a>
										</li>
										
										<li>
											<i class="li_img glyphicon glyphicon-wrench"></i>
											<a href="javaScript:void(0)" tohref="#otherSettings">其他设置</a>
										</li>
										
										<!--  
										<li>
											<i class="li_img glyphicon glyphicon-headphones"></i>
											<a href="pageTo.do?p=contactUs#links">意见反馈</a>
										</li>
										-->
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
		<script type="text/javascript" src="<%=basePath%>webPages/pages/freeTeam/pageJs/myHostPage.js"></script>
		
	</body>

</html>