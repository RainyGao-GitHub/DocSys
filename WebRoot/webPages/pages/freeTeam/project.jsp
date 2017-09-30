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
		<title>项目详细-自由团队-IT产品开发外包平台</title>
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
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		<script src="<%=basePath%>/webPages/js/pageSplit.js"></script>
		<script type="text/javascript" src="<%=basePath %>webPages/js/select2/js/select2.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/project.js"></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/commonPageSplit.js"></script>
		<script>
			$(document).ready(function() {
				// header
				$(".require-auth").loginPanel();
				// $("#header .dropdown").hover(function () {
				// $(this).find(".dropdown-menu").fadeIn();
				// }, function () {
				// $(this).find(".dropdown-menu").fadeOut();
				// });
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
		<style type="text/css">
			.body{background: white;}
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
							<li class="name"><a javascript:void(0);>忘记密码？点我找回</a></li>
						</ul>
					</c:if>
				</div>
			</div>
		</div>
		<div>
			<div class="projectHead">
			    <div class="mainBox">
			        <div class="projectHeadLeft"  style="width:900px">
			        	<div class="fLeft" style="width:400px">
			            	<img id="img_product_screenshot_big_show" class="proBigPic" width="360px" height="250px"
	                                 src="<%=staticFilesPath %>bigPic/webPages/upload/project/${pro.proLog}" onerror='this.src="webPages/images/project.jpg"' alt="">
			           		<p class="font-lg">
		                    	发布于
		                    	<span class="p0_5">${pro.publishTime}</span>
		                    </p>
			           
			            </div>
			            <div class="projectIntro" style="width:500px">
			            	
			                <h1 class="bold c56 f30">
			                	<a class="projectTitle">${pro.name}</a>
			                	<c:if test="${pro.isRecommend == 1}">
			                		<span class="claim">
				                		<a javascript:void(0); class="require_auth">平台推荐</a>
				                	</span>
			                	</c:if>
			                	
			                </h1>
			                <p>
			                	<i class="glyphicon glyphicon-map-marker"></i>
		                        <span href="javascript:void(0);" title="项目所在地">${pro.prjArea }</span>
		                    </p>
		                    <p>
		                    	<i class="glyphicon glyphicon-tags"></i>
		                    	<c:if test="${not empty pro.keyWord}">
		                    		<span class="p0_5">${pro.keyWord }</span>
		                    	</c:if>
		                    	<c:if test="${empty pro.keyWord}">
		                    		<span class="p0_5">暂无标签</span>
		                    	</c:if>
		                   		
		                    </p>
			                <p class="projectTip mt10">${pro.intro}</p>
			                <div class="headTag mt10 font-lg">
			                    <p>
			                   		<span class="color-83" style="font-size: 16px;">
			                    		<i class="glyphicon glyphicon-yen"></i>
			                    		<span class="p0_5" javascript:void(0);  title="项目预算">${pro.startPrice}-${pro.endPrice}元</span>
			                    	</span>
			                   		
			                   		<div class="fRight">
			                   			
			                   			
			                   			<a class="mybtn" title="关注">
			                    			<span  id="likeCnts"></span>
			                    		</a>
			                   			
			                    		<a class="mybtn-primary" style="margin-left: 20px;"	onclick="initMsgDalog(${pro.publisher})">
				                    		<i class="glyphicon glyphicon-envelope"></i>
				                    		<span>联系对方</span>
				                    	</a>
				                    	
				                    	<a class="mybtn-primary" style="margin-left: 20px;" href="toUndertakeProject.do?id=${pro.id}" title='点击将会发送私信到创建者信箱'>
				                    		<span>承接</span>
				                    	</a>
			                    	</div>
			                   
			                    </p>
			
			                </div>
			            </div>
			        </div>
			        <div class="projectHeadRight">
			        	<div class="projectLogo">
			        	    <a href="toUserDetail2.do?id=${pro.publisher}" target="_blank">
			        	    	<img src="<%=staticFilesPath %>webPages/upload/headpic/${pro.headImg}" onerror="this.src='webPages/images/defaultHeadPic.png'" alt="Soothe">
			                </a>
			            	<%-- <p class="location">
		                        <a href="javascript:void(0);" title="项目所在地">${pro.prjArea }</a>
		                    </p>  --%>    
			            </div>
			            <div class="headSocial">
			                    <div class="headSocialGroup">
			                        <div class="socialName">
			                            <em class="iconTalks"></em>
			                            <a class="require_auth" after-auth="refresh-do" id="btn_raising_talk_with_founder"
			                               href="toUserDetail2.do?id=${pro.publisher}" target="_blank">
			                                <span class="cf50 bold">${pro.nickName}</span>
			                            </a>
			                        </div>
			                    </div>
			
			                <div class="headSocialGroup">
			                        <div class="socialName" style="display: none;">
			                        	<em class="iconFollowing"></em>
			                        	<a javascript:void(0); id="btn_startup_profile_following" data-value="44452" fav-weight="1">取消关注</a>
			                        </div>
			                        <div class="socialName">
			                        	<em class="iconLocation">
			                        		<span class="glyphicon glyphicon-map-marker"></span>
			                        	</em>
			                        	${pro.area}
			                        </div>
			                    <div class="socailNum" title="关注度" id=""></div>
			                </div>
			                <!-- <div class="headSocialGroup">
			                    <div class="socialName"><em class="iconShare"></em><a id="btn_share_wechat" javascript:void(0);>微信分享</a></div>
			                </div> -->
			            </div>
			        </div>
			    </div>
			</div>
			
			<div class="pageMain" style="width:70%;min-width: 1100px;">
				<div class="projectContent" style="width:100%">
				    <%-- <h3 class="sectionTitleA bold c56 f18 mb20" id="panel_product_media">项目LOG</h3>
				    <div class="section" >
				        <div class="projectAlbum">
				            <div class="photo">
				
		                        <div style="display: none;" id="penel_product_video_contaienr" class="product_pic" href="javascript:undefined;">
		                            <span class="play"></span>
		                        </div>
		                        <a rel="product_pic" id="penel_product_photo_contaienr" class="product_pic"
		                           href="http://pp1.gofreeteam.com/2016/01/16/323696c8804c4e1cbedb9101f4b55427.png@!picb">
		                            <img id="img_product_screenshot_big_show"
		                                 src="<%=staticFilesPath %>bigPic/webPages/upload/project/${pro.proLog}" onerror='this.src="webPages/images/project.jpg"' alt="">
		                        </a>
				
				            </div>
				        </div>
				    </div> --%>
				    
				    <ul class="switch_tab clearfix">
						<li class="active" toChild="1"><a>项目详细</a></li>
						<li toChild="2" onclick="_firstPage1.click()"><a>网友评论</a></li>
						<li toChild="3"><a>该用户的其它项目</a></li>
					</ul>
					
					<div class="p10_0 _nav_content" child="1">
				    	<div>
				    		${pro.content}
				    	</div>
				    </div>
				    
				    <div class="p10_0 _nav_content" style="display: none;" child="2">
				    	<li id="commentChoose" style="list-style: none;padding-left: 10px;">
				    		<i class="label label-large label-default" id="goodPercent">好评率0%</i>
				    		<span>|</span>
				    		<i class="label label-large label-primary active" id="comments_total" value="0">全部(0)</i>
				    		<i class="label label-large label-success" id="comments_good" value="4,5">好评(0)</i>
				    		<i class="label label-large label-info" id="comments_mid" value="3">中评(0)</i>
				    		<i class="label label-large label-danger" id="comments_bad" value="1,2">差评(0)</i>
				    	</li>
				    	<a class="mybtn-primary fr" onclick="addPrjComment()">发表评论</a>
				    	<hr/>
				    	<div >
				    	
				    		<div id="comments">
				    			
								
							</div>
							<div align="center" class="p5">
								<a id="_firstPage1" class="pageBtn" onclick="chipTo('first',this)">首页</a>
								<a class="pageBtn" onclick="chipTo('pre',this)">上一页</a>
								<span>第<span name="page">0</span>/<span id="totalPage1" name="totalPage">0</span>页</span>
								<a class="pageBtn" onclick="chipTo('next',this)">下一页</a>
								<a class="pageBtn" onclick="chipTo('last',this)">尾页</a>
								<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initCommentList');" value="comment/getCommentsList.do?type=0&toId=${pro.id}"/>
							</div>
				    		
				    	</div>
				    </div>
				    
				   	<div class="p10_0 _nav_content" child="3" style="display: none;">
				   		<ul class="eventset-list"  id="otherProArea">
				   		
				   		</ul>
				   	</div>
				
				
				
				        <%-- <div class="section" id="prjDetail">
				            <h3 class="sectionTitleC bold c56 f16 mt30 mb10"><span>项目详细</span></h3>
				
				            <div class="stageBox">
				            	${pro.content}
				            </div>
				        </div>
				<p class="h150"></p> --%>
				
				</div>
			
				<!-------------- 快捷导航开始 --------------->
				<!-- <div class="projectGuide">
				    <div class="guide">
				        <ul class="guideUL" id="guide" >
				            <li class="current"><a href="#prjDetail"><em class="intro"></em>项目详细</a></li>
				        </ul>
				    </div>
					<div class="talk-record" style="margin-top: 0;">
					    <h3>
					        <span class="left">该用户最近其它项目</span>
					    </h3>
					
					    约谈人列表
					    <div class="list" id="otherProArea">
					        <div class="mt30 ac">
					            <i class="talk3"></i>
					            <span>暂无人约谈</span>
					        </div>
					    </div>
					
					</div>
				</div> -->
			</div>
		</div>
			
		<input type="hidden" id="projectId" value="${pro.id}"/>
		<input type="hidden" id="publisher" value="${pro.publisher}"/>
					
		<jsp:include page="footer.jsp"></jsp:include>
		
	</body>

</html>