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
		<title>自由团队-项目承接流程图</title>
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
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/swiper.min.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/controller/index_v2.js"></script>
		<script src="<%=basePath%>webPages/js/common.js"></script>
    	<style>
    		.need-main {
			    margin-top: 15px;
			}
			.jiaoyi {
			    padding: 50px 85px;
			}
			
			.paihang-table {
			    background: #fff;
			    border: 1px solid #d9d9d9;
			}
			.text-666 {
			    color: #666;
			}
			.text-warning {
			    color: #ff7a32;
			}
			.h3, h3 {
			    font-size: 24px;
			}
			.tixi-detail {
			    line-height: 24px;
			    margin-bottom: 15px;
			}
			.text-gray {
			    color: #999;
			}
			.size-15 {
			    font-size: 15px;
			}
    	</style>
	</head>

	<body>
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		<jsp:include page="head.jsp"/>
		
		<div class="bgcolor">
			<div class="subnav">
				<div class="container">
					<ul class="nav-pills f-left">
						<li class="name">推荐</li>
						<li><a style="color: #F80;" href="chipPage.do?p=tianTianTou/prj_workflow">项目承接流程图</a></li>
						<li><a href="chipPage.do?p=tianTianTou/ser_workflow">服务购买流程图</a></li>
					</ul>
					<c:if test="${empty freeteam_user}">
						<ul class="nav-pills f-right">
							<li class="name"><a href="toChangePwd.do">忘记密码？点我找回</a></li>
						</ul>
					</c:if>
				</div>
			</div>
		</div>
		<!--中间内容开始-->
		<div class="container need-main" style="margin-top: 60px;">
		    <div class="paihang-table text-center jiaoyi">
		        <hr class="jiaoyi-line">
		        <p><img src="<%=basePath%>webPages/images/LCT2.png"></p>
		        <hr class="jiaoyi-line">
		    </div>
		</div>
    <!--中间内容结束-->
		
		<jsp:include page="footer.jsp"/>
	</body>

</html>