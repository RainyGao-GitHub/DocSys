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
		<title>资源列表-自由团队-IT产品开发外包平台</title>
		<meta name="keywords" content="IT兼职，自由团队" />
		<meta name="description" content="自由团队是一个专业高效的免费找外包，专业人才和服务的平台，致力于通过互联网将IT行业的专业人才汇聚一起、共同实现创业和发挥自己的更多价值。" />
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
		
		<!-- table排序，要放到programerList.js的前面 -->
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/tableSort.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/programerList.js"></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/vocation.js"></script>
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/swiper.min.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/controller/index_v2.js"></script>
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
			.prj_title{padding: 5px 20px}
			
			.w5{width:5% !important;}.w6{width:6% !important;}.w7{width:7% !important;}.w8{width:8% !important;}
			.w10{width:10% !important;}.w12{width:12% !important;}.w15{width:15% !important;}.w20{width:20% !important;}
			.w25{width:25% !important;}.w35{width:35% !important;}.w40{width:40% !important;}.w45{width:45% !important;}
		</style>
	</head>

	<body>
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
					<div id="searchArea" class="searchArea col-xs-10">
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
							<div id="searchBar" class="fRight" style="width:330px;">
								<div class="input-group">
									<span class="input-group-addon" >智能搜索：</span>
									<input type="text" class="form-control" placeholder="名称/关键字" id="searchWords" aria-describedby="basic-addon2" />
									<span class="input-group-addon btn btn-default" id="basic-addon2" onclick="showProgramerList();">搜索</span>
								</div>
							</div>
							<li>
								<span class="fLeft">类 型：</span>
								<ul id="type" class="list-unstyled searchLabel fleft">
									<li value="0" class="liActive"><a href="#">全部</a></li>
									<li value="1"><a href="#">个人</a></li>
									<li value="2"><a href="#">团队</a></li>
									<li value="3"><a href="#">企业</a></li>
								</ul>
							</li>
							
						</ul>
					</div>
					
					<div class="data-content">
						<div>
							<ul class="eventset-tit">
								<li class="softer">
									<i>排序</i>
									<i class="active" title="按照创建时间排序" value="0">
										<label class="reset">默认排序</label>
									</i>
									<i value="sort_xy">
										<label class="reset">信用</label>
										<span class="glyphicon glyphicon-arrow-down"></span>
									</i>
									<i value="sort_cjl">
										<label class="reset">成交量</label>
										<span class="glyphicon glyphicon-arrow-up"></span>
										<span class="glyphicon glyphicon-arrow-down"></span>
									</i>
								</li>
								
								<!-- 筛选栏 -->
								<li class="chooserBar">
									<i>筛选</i>
									<!-- <i class="active">
										<span>是否有保证金</span>
										<input type="checkbox"/>
									</i>
									<i>
										<span>三星以上</span>
										<input type="checkbox"/>
									</i> -->
									<i>
										<span>平台推荐<span style="margin-left:3px;" class="glyphicon glyphicon-thumbs-up"></span></span>
										<input id="isRecommend" onchange="chipPage();" type="checkbox"/>
									</i>
									
									
									<i class="fRight pageBtn" onclick="toPage('next');" title="上一页">
										<span class="glyphicon glyphicon-chevron-right"></span>
									</i>
									<i class="fRight pageBtn" onclick="toPage('pre');" title="下一页">
										<span class="glyphicon glyphicon-chevron-left"></span>
									</i>
								</li>
								<!-- <li>
									<i class="cell logo w15"></i>
									<i class="cell commpany w20">名称</i>
									<i class="cell commpany w35">简介</i>
									<i class="cell investor w5">站内信</i>
									<i class="cell investor w25">地址</i>
								</li> -->
							</ul>
							<ul class="eventset-list" id="programerArea">
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
					<!-- <div class="data-tips">
						<h3>自由团队声明</h3>
						<p>1，本榜单是基于自由团队投融资数据库整理开发而成，初衷是为创业者和投资人提供尽可能客观且真实的数据参考；</p>
						<p>2，自由团队为用户提供的各类数据值均为估算值，些许误差不可避免，但自由团队仍将致力于打造更加真实可信的投融资数据平台；</p>
						<p>3，基于各种或简单或复杂的原因，某些项目可能未被自由团队的投融资数据库所收录（或信息有误），若您发现此类情况请及时与我们取得联系，我们会在第一时间作出反馈，联系邮箱：service@gofreeteam.com</p>
					</div> -->
				</div>
				
			</div>
			
		</div>
		<jsp:include page="footer.jsp"></jsp:include>
	</body>

</html>