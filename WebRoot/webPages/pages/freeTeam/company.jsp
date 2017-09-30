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
		<title>企业信息-自由团队-IT产品开发外包平台</title>
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
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/styleV2.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		
		
		<script src="<%=basePath%>/webPages/js/pageSplit.js"></script>
		<script type="text/javascript" src="<%=basePath %>webPages/js/select2/js/select2.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/company.js"></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/vocation.js"></script>
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/swiper.min.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/controller/index_v2.js"></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/commonPageSplit.js"></script>
		<style type="text/css">
			.praList>li>span {display: block;padding: 5px;}
			.searchArea {padding: 0px 10px;background-color: white;width: 100%;border-radius: 5px;}
			.fLeft {float: left;}.fRight{float:right}
			.praList li {display: block;padding: 5px; margin: 0px 2px;}.liActive {background: yellowgreen;border-radius: 5px;}
			.searchLabel li {float: left;}
			.clear{clear: both;}
			.country {width: 300px;}
			.country select {margin: 2px 5px;width: 150px;font-size: 12px;height: 26px;color: cornflowerblue;}
			.gotoPage{padding: 4px 12px !important;}.gotoPage>input {height: 24px;}
			.pg_active {color: white !important;font-weight: bold;background: rgb(255,215,68) !important;}
			.prj_title{padding: 5px 20px}
			
			.w5{width:5% !important;}.w6{width:6% !important;}.w7{width:7% !important;}.w8{width:8% !important;}
			.w10{width:10% !important;}.w12{width:12% !important;}.w15{width:15% !important;}.w20{width:20% !important;}
			.w25{width:25% !important;}.w35{width:35% !important;}.w40{width:40% !important;}.w45{width:45% !important;}
			.userHead{height: 240px;}.userTxt h1{height: auto;margin-top: 7px;}
			.userTxt p.userIntro:BEFORE {content: "企业简介：";}
			.main .item{padding-bottom: 30px;margin-bottom: 20px;}
			.qyImg img{border-radius: 10px;}
			
			.itemService{width: 180px;height: 280px;border: 2px lightgray solid;border-radius: 10px;background: white;padding: 2px 0px; float: left;margin-right: 20px;margin-bottom: 20px;}
			.itemService:HOVER{border: 2px gold solid;}
			.itemService img{width: 156px;height: 156px;margin: 10px;border-radius: 10px;}
			.itemService hr{margin: 10px 5px;color: lightgray;}
			.itemService .serContent{padding: 0px 10px;}
			
			
			.gotoPage{padding: 4px 12px !important;}.gotoPage>input {height: 24px;}
			.pg_active {color: white !important;font-weight: bold;background: rgb(255,215,68) !important;}
		</style>
	</head>

	<body>
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		<input type="hidden" id="company_userId" value="${userId}"/>
		<jsp:include page="head.jsp"></jsp:include>
<div id="wrapper">
    <div class="userHead">
        <div class="userHeadCon">
            <div class="userInfo">
                <div class="userPhoto"><img id="headImg" src="webPages/images/defaultHeadPic.png" onerror="this.src='webPages/images/defaultHeadPic.png'" alt="头像"></div>
                <div class="userTxt">
                    <h1 id="company_name" class="bold">未知用户</h1>
	                    <div class="userBadgeInverstor">
	                        <div class="userBadgeTips"><span class="upArrow"></span>平台认证企业</div>
	                    </div>
                    <p class="userRoles">
                    		<span id="company_area"></span>
                   			<span class="shuxian"> | </span>
                   			电话：<span id="company_tel"></span>
                   			<span class="shuxian"> | </span>
                   			网址：<a id="company_url" href="#" target="_blank" style="color: gold;"></a>
                    </p>
                    <p class="userIntro" id="company_intro">
                    	暂无数据
                    </p>
                </div>
            </div>
            
            <div class="userBtns">
                <div class="btnGroup">
	                <a style="" class="follow" href="javaScript:void(0)" onclick="initMsgDalog(${userId});">好友</a>
                </div>
                <div class="userSocial">
                </div>
            </div>
        </div>
    </div>


    <div class="main">
    	
        <div class="item" id="qyImgDiv_all">
            <div class="itemTitle f18 bold">企业风采</div>
            <div id="qyImgDiv" class="itemCon qyImg" style="display: none;">
				<img id="qyImg1" width="32%" src=""/>
				<img id="qyImg2" width="32%" src=""/>
				<img id="qyImg3" width="32%" src=""/>
            </div>
            <p>暂无数据</p>
        </div>


        <div class="item" id="panel_investor">
            <div class="itemTitle f18 bold">已发布服务</div>
            <div class="itemCon" style="width: 900px;padding: 20px 10px;background: white;">
            	<div id="fuwu" class="border_plist" style="">
					<ul class="eventset-list" id="serArea">
		    			<li class="pl20">暂无数据</li>
					</ul>
					<div align="center" class="p5">
						<a id="_firstPage1" class="pageBtn" onclick="chipTo('first',this)">首页</a>
						<a class="pageBtn" onclick="chipTo('pre',this)">上一页</a>
						<span>第<span name="page">0</span>/<span id="totalPage1" name="totalPage">0</span>页</span>
						<a class="pageBtn" onclick="chipTo('next',this)">下一页</a>
						<a class="pageBtn" onclick="chipTo('last',this)">尾页</a>
						<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initSerList');" value="queryServiceDataById.do"/>
					</div>
					<hr/>
				</div>
            </div>
        </div>
         
        
        <div class="item" id="panel_investor">
            <div class="itemTitle f18 bold">人员</div>
            <div  class="itemCon" style="width: 900px;padding: 20px 10px;background: white;">
            	<h3 class="sectionTitleA bold c56 f18 mb20" style="width: 90%" id="panel_product_media">本站人员</h3>
            	<div id="employee_local">
            		
            	</div>
            	<div class="clear"></div>
            	<h3 class="sectionTitleA bold c56 f18 mb20" style="width: 90%" id="panel_product_media">企业人员</h3>
            	<div id="employee_self">
            		
            	</div>
            </div>
        </div>
       
    </div>
</div>
		<jsp:include page="footer.jsp"></jsp:include>
	</body>

</html>