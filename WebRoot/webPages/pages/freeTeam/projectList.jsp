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
		<title>自由团队-IT产品开发外包平台</title>
		<meta name="keywords" content="IT兼职，自由团队" />
		<meta name="description" content="自由团队是一个专业高效的免费创业IT外包服务平台，致力于通过创业IT外包数据服务降低创业者和投资人的综合时间成本、提升整个社会的创业IT外包效率，从而创造新的社会价值！" />
		<meta http-equiv="x-ua-compatible" content="ie=8" />
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
		
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/resetV2.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/styleV2.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap-theme.min.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.comm.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.custom.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-fonts/css/font-awesome.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath %>webPages/js/select2/css/select2.min.css" />
		
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		
		
		<script src="<%=basePath%>/webPages/js/pageSplit.js"></script>
		<script type="text/javascript" src="<%=basePath %>webPages/js/select2/js/select2.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		<!-- table排序，要放到projectList.js的前面 -->
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/tableSort.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/projectList.js"></script>
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/swiper.min.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/controller/index_v2.js"></script>
		<script src="<%=basePath%>webPages/js/qiao.js"></script>
		<style type="text/css">
			.praList>li>span {display: block;padding: 5px;}
			.searchArea {padding: 0px 10px;background-color: white;width: 100%;border-radius: 5px;}
			.fLeft {float: left;}.fRight{float:right}
			.praList li {display: block;padding: 5px; margin: 0px 2px;}.liActive {background: yellowgreen;border-radius: 5px;}
			.searchLabel li {float: left;}
			.clear{clear: both;}
			.country {width: 300px;}
			.country select {margin: -2px 5px;width: 150px;font-size: 12px;color: cornflowerblue;}
			.gotoPage{padding: 4px 12px !important;}.gotoPage>input {height: 24px;}
			.pg_active {color: white !important;font-weight: bold;background: rgb(255,215,68) !important;}
		</style>
	</head>

	<body>
		<jsp:include page="/webPages/pages/joinMsg.jsp"></jsp:include>
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		<jsp:include page="head.jsp"></jsp:include>
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
		<div class="container">
			<br/>
			<div class="main-row">
				<div class="row">
					<div id="searchArea" class="searchArea col-xs-10 clearfix mb10">
						<br/>
						<ul id="praList" class="list-unstyled praList">
							<li>
								<span class="fLeft">领 域：</span>
								<ul id="jobArea" class="list-unstyled searchLabel fLeft">
									<li value="0" class="liActive"><a href="#">全部</a></li>
									<li value="1"><a href="#">网站</a></li>
									<li value="2"><a href="#">移动APP</a></li>
									<li value="3"><a href="#">微信应用</a></li>
									<li value="4"><a href="#">嵌入式产品</a></li>
									<li value="5"><a href="#">PC机软件</a></li>
									<li id="otherJob" value=""><a href="#" onclick="showSmlType()">其它</a></li>
								</ul>
								<div id="job" class="mySelect2 hidden fLeft">
									<select id="cBusiSmlType" style="width: 170px;" onchange="selectOtherSmlType(this)" value=""></select>
								</div>
								<div class="clear"></div>
							</li>
							
							<li>
								<span class="fLeft">地 点：</span>
								<ul id="pcaArea" class="list-unstyled searchLabel fleft">
									<li value="0" class="liActive"><a href="#">全部</a></li>
									<li value="110100"><a href="#">北京</a></li>
									<li value="310100"><a href="#">上海</a></li>
									<li value="440100"><a href="#">广州</a></li>
									<li value="440300"><a href="#">深圳</a></li>
									<li value="330100"><a href="#">杭州</a></li>
									<li value="320100"><a href="#">南京</a></li>
									<li value="320500"><a href="#">苏州</a></li>
									<li id="otherArea" value=""><a href="#" onclick="showCountry()">其它</a></li>
								</ul>
								<div id="country" class="country hidden fLeft">
									<select id="province" name="provinceCode" onchange="queryCity(this);" style="width: 40%;">
										<option value="-1">请选择</option>
									</select>
									<select id="city" name="area" onchange="selectOtherArea(this)"  style="width: 40%;">
										<option value="-1">请选择</option>
									</select>
								</div>
								<div class="clear"></div>
							</li>
							<li>
								<span class="fLeft">预  算：</span>
								<ul id="priceArea" class="list-unstyled searchLabel fleft">
									<li value="0" class="liActive"><a href="#">全部</a></li>
									<li value="0-1000"><a href="#">0-1k</a></li>
									<li value="1000-3000"><a href="#">1k-3k</a></li>
									<li value="3000-5000"><a href="#">3k-5k</a></li>
									<li value="5000-10000"><a href="#">5k-1W</a></li>
									<li value="10000-30000"><a href="#">1W-3W</a></li>
									<li value="30000-50000"><a href="#">3W-5W</a></li>
									<li value="50000-100000"><a href="#">5W-10W</a></li>
									<li value="100000-"><a href="#">10W以上</a></li>
									<!-- <li id="otherPrice" value=""><a href="#" onclick="showCountry()">其它</a></li> -->
								</ul>
								<!-- <div id="country" class="country hidden fLeft">
									<select id="province" name="provinceCode" onchange="queryCity(this);" style="width: 40%;">
										<option value="-1">请选择</option>
									</select>
									<select id="city" name="area" onchange="selectOtherArea(this)"  style="width: 40%;">
										<option value="-1">请选择</option>
									</select>
								</div> -->
								<div class="clear"></div>
							</li>
							<div id="searchBar" class="searchBar fRight" style="width:330px;">
								<!--智能搜索：<input type="text"  placeholder="项目名称/职位需求" /><input type="button" value="搜索" />-->
								<div class="input-group">
									<span class="input-group-addon" >智能搜索：</span>
								  <input type="text" class="form-control" placeholder="项目名称/关键字" id="searchWords" aria-describedby="basic-addon2">
								  <span class="input-group-addon btn btn-default" id="basic-addon2" onclick="chipPage();">搜索</span>
								</div>
							</div>
							<li>
								<span class="fLeft">类 型：</span>
								<ul id="pTypeArea" class="list-unstyled searchLabel fleft">
									<li value="0" class="liActive"><a href="#">全部</a></li>
									<li value="1"><a href="#">个人</a></li>
									<li value="4"><a href="#">团队</a></li>
									<li value="3"><a href="#">企业</a></li>
									
								</ul>
							</li>
						</ul>
							
						
						<div class="clear"></div>
					</div>
					
					<div class="data-content">
						<div>
							<ul class="eventset-tit">
								<li class="softer">
									<i>排序</i>
									<i class="active" title="按照创建时间排序" value="0">
										<label class="reset">默认排序</label>
									</i>
									<i title="按照用户项目是否延期排序" value="sort_jj">
										<label class="reset">紧急程度</label>
										<span class="glyphicon glyphicon-arrow-up on"></span>
										<span class="glyphicon glyphicon-arrow-down"></span>
									</i>
									<i value="sort_xy">
										<label class="reset">信用</label>
										<span class="glyphicon glyphicon-arrow-down hidden"></span>
									</i>
									<i value="sort_ys">
										<label class="reset">项目预算</label>
										<span class="glyphicon glyphicon-arrow-up"></span>
										<span class="glyphicon glyphicon-arrow-down"></span>
									</i>
								</li>
								
								<!-- 筛选栏 -->
								<li class="chooserBar">
									<i>筛选</i>
									<i>
										<span>平台推荐<span style="margin-left:3px;" class="glyphicon glyphicon-thumbs-up"></span></span>
										<input id="isRecommend" onchange="chipPage();" type="checkbox"/>
									</i>
									<!-- <i class="active">
										<span>是否有保证金</span>
										<input type="checkbox"/>
									</i>
									<i>
										<span>三星以上</span>
										<input type="checkbox"/>
									</i>
									<i>
										<span>开发 / 咨询服务</span>
										<input type="checkbox" checked="checked"/>
									</i> -->
									
									
									<i class="fRight pageBtn" onclick="toPage('next');" title="上一页">
										<span class="glyphicon glyphicon-chevron-right"></span>
									</i>
									<i class="fRight pageBtn" onclick="toPage('pre');" title="下一页">
										<span class="glyphicon glyphicon-chevron-left"></span>
									</i>
								</li>
								<!-- <li>
									<i class="cell logo w12"></i>
									<i class="cell commpany w25">名称/简介</i>
									<i class="cell round w10">地点</i>
									<i class="cell round w15">类型</i>
									<i class="cell amount w10">预算</i>
									<i class="cell investor w11">承包项目</i>
									<i class="cell investor w10">关注</i>
									<i class="cell date w7">创建时间</i>
								</li> -->
							</ul>
							<ul class="eventset-list" id="proArea">
							</ul>
							
							<div id="pageSplit" class="systemfont">
								<nav>
								  <ul class="pagination fRight">
								    <li><a title="首页" href="javaScript:void(0);" onclick="toPage('first');">‹‹</a></li>
								    <li><a title="上一页" href="javaScript:void(0);" onclick="toPage('pre');">‹</a></li>
								    <!-- <li><a href="javaScript:void(0);" onclick="toPage('1');">1</a></li>
								    <li><a href="javaScript:void(0);" onclick="toPage('2');">2</a></li>
								    <li><a href="javaScript:void(0);" onclick="toPage('3');">3</a></li>
								    <li><a href="javaScript:void(0);" onclick="toPage('4');">4</a></li>
								    <li><a href="javaScript:void(0);" onclick="toPage('5');">5</a></li> -->
								    <li><a title="下一页" href="javaScript:void(0);" onclick="toPage('next');">›</a></li>
								    <li><a title="尾页" href="javaScript:void(0);" onclick="toPage('last');">››</a></li>
								    <li><span class="fRight gotoPage">共 <strong id="totCnts">${totalCnts}</strong> 条 第 <input type="text" id="inputPage" style="width: 20px;height: 20px;"/>/<strong id="totPage">10</strong> 页  <input type="button" class="btn btn-info btn-xs" onclick="chip()" value="跳转" /></span></li>
								  </ul>
								  <div class="clear"></div>
								</nav>
								
								<input type="hidden" id="totalCnts" value="${totalCnts}"/>
							</div>
						</div>
					</div>
				</div>
			</div>
			
		</div>
		<jsp:include page="footer.jsp"></jsp:include>
	</body>

</html>