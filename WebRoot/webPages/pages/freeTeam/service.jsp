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
		<title>服务详细-自由团队-IT产品开发外包平台</title>
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
		<script type="text/javascript" src="<%=basePath %>webPages/js/vocation.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/service.js"></script>
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
			#page-B{padding-top: 0px;}
			.pg_active {color: white !important;font-weight: bold;background: rgb(255,215,68) !important;}
			.redStar {font-size: 14px;color: lightcoral;}.whiteStar {font-size: 14px;color: #FAEBCC;}
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
			        <div class="projectHeadLeft" style="width:900px">
			            <div class="fLeft" style="width:400px">
			            	<img id="img_product_screenshot_big_show"  width="360px" height="250px"
	                                 src="<%=staticFilesPath %>bigPic/webPages/upload/service/${ser.proLog}" onerror='this.src="webPages/images/service.png"' alt="">
			            
			            	<p class="font-lg">
		                    	发布于
		                    	<span class="p0_5">${ser.publishTime}</span>
		                    </p>
			            
			            </div>
			            <div class="projectIntro" style="width:500px">
			                <h1 class="bold c56 f30"><a class="projectTitle" >${ser.name}</a>
			                	<span class="claim">
				                    <c:if test="${ser.isRecommend == 1}">
				                		<span class="claim">
					                		<a javascript:void(0); class="require_auth">平台推荐</a>
					                	</span>
				                	</c:if>
			                    </span>
			                </h1>
			                <p>
			                	<span class="redStar" javascript:void(0); title="好评率" id="serLevel"></span>
			                	<input type="hidden" id="ser_score" value="${ser.score}"/>
			                </p>
			                <p>
			                	<i class="glyphicon glyphicon-map-marker"></i>
		                        <a href="javascript:void(0);" title="所在地">${ser.serArea }</a>
		                    </p>
		                    <p>
		                    	<i class="glyphicon glyphicon-tags"></i>
		                   		<span id="busiType" class="p0_5" style="color:#f80">${ser.busiType}</span>
		                   		<c:if test="${not empty ser.keyWord}">
		                   			<span class="p0_5">${ser.keyWord }</span>
		                    	</c:if>
		                    	<c:if test="${empty ser.keyWord}">
		                    		<span class="p0_5">暂无标签</span>
		                    	</c:if>
		                    </p>
			                <p class="projectTip mt10">${ser.intro}</p>
			                <div class="headTag mt10 font-lg">
			                    <p>
			                    	<span class="color-83" style="font-size: 16px;">
			                    		<i class="glyphicon glyphicon-yen"></i>
			                    		<span class="p0_5" javascript:void(0);  title="服务价格">${ser.startPrice}-${ser.endPrice}元</span>
			                    	</span>
			                    	
			                    	
			                    	<div class="fRight">
			                    		<a class="mybtn">
			                    			<span  id="likeCnts"></span>
			                    		</a>
			                    		
			                    		<a class="mybtn-primary" style="margin-left: 20px;" onclick="initMsgDalog(${ser.publisher})">
				                    		<i class="glyphicon glyphicon-envelope"></i>
				                    		<span>联系对方</span>
				                    	</a>
				                    	
				                    	<a class="mybtn-primary" style="margin-left: 20px;" href="toBuyService.do?id=${ser.id}">
				                    		<span>购买</span>
				                    	</a>
			                    	</div>
			                    	
			                    </p>
			                    
			                    
			
			                </div>
			            </div>
			        </div>
			        <div class="projectHeadRight">
			        	<div class="projectLogo">
			        		<a href="toUserDetail2.do?id=${ser.publisher}" target="_blank">
			        		<img src="<%=staticFilesPath %>webPages/upload/headpic/${ser.headImg}" onerror="this.src='webPages/images/defaultHeadPic.png'"/>
			        		</a>
			            </div>
			            <div class="headSocial">
			                    <div class="headSocialGroup">
			                        <div class="socialName">
			                            <em class="iconTalks"></em>
			                            <a class="require_auth" after-auth="refresh-do" id="btn_raising_talk_with_founder"
			                               href="toUserDetail2.do?id=${ser.publisher}" target="_blank">
			                                <span class="cf50 bold">${ser.nickName}</span>
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
			                        	${ser.area}
			                        </div>
			                    <div class="socailNum" title="关注度" id=""></div>
			                    <input type="hidden" id="ser_score" value="${ser.score}"/>
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
		        <%-- <div class="section" id="prjDetail">
		            <h3 class="sectionTitleC bold c56 f16 mt30 mb10"><span>项目详细</span></h3>
		
		            <div class="stageBox">
		            	${ser.content}
		            </div>
		        </div>
		        
				<p class="h150"></p> --%>
				<ul class="switch_tab clearfix">
					<li class="active" toChild="1"><a>服务详细</a></li>
					<!--li toChild="2"><a>项目案例(${proDemoCnts})</a></li-->
					<li toChild="2"><a>项目案例</a></li>
					<c:if test="${publisher.type ne 1}">
						<li toChild="3" onclick="showEmployeeList();"><a>服务成员</a></li>
					</c:if>
					<li toChild="4" onclick="_firstPage1.click()"><a>用户评价</a></li>
					<li toChild="5"><a>该用户的其它服务</a></li>
				</ul>               
				
				<div class="p10_0 _nav_content" child="1">
			    	<div>
			    		${ser.content}
			    	</div>
			    </div>
			    
			    <div class="p10_0 _nav_content" style="display: none;padding: 0px 10px;" child="2">
			    	<c:if test="${proDemoList eq null}">
			    		<p class="p10">暂无数据</p>
			    	</c:if>
			    	<c:if test="${proDemoList ne null}">
			    		<c:forEach items="${proDemoList}" var="demo" varStatus="status">
				    		<!--
				    		<c:if test="${status.count == 5}">
				    			<div style="float:right;padding: 10px;" onclick="showAll(this)">
						    		<a>展开</a>
						    	</div>
				    		</c:if>
				    		<c:if test="${status.count != 5}">
				    			<div style="width:20%;float: left;padding: 10px;text-align: center;overflow: hidden;">
						    		<img width="150px" height="150px;" class="img-rounded" src="${demo.logo}" onerror='this.src="webPages/images/project.jpg"'/>
						    		<h5 class="text-center no-wrap">${demo.title}</h5>
						    	</div>
				    		</c:if>
				    		-->
				    		<div class="project-demo" onclick="toProjectDemoInfo(${demo.id},'${demo.title}')">
						    	<img width="100px" height="100px;" class="img-rounded" src="${demo.logo}" onerror='this.src="webPages/images/project.jpg"'/>
						    	<h5 class="text-center no-wrap">${demo.title}</h5>
						    </div>
				    	</c:forEach>
			    	</c:if>
			    </div>
			    
			    <c:if test="${publisher.type ne 1}">
				    <div class="p10_0 _nav_content" style="display: none;" child="3">
					    <div id="employeeList" class="eventset-list">
					    	<p>服务成员</p>
					    </div>
					</div>
			    </c:if>
			    
			    <div class="p10_0 _nav_content" style="display: none;" child="4">
			    	<li id="commentChoose" style="list-style: none;padding-left: 10px;">
			    		<i class="label label-large label-default" id="goodPercent">好评率0%</i>
			    		<span>|</span>
			    		<i class="label label-large label-primary active" id="comments_total" value="0">全部(0)</i>
			    		<i class="label label-large label-success" id="comments_good" value="4,5">好评(0)</i>
			    		<i class="label label-large label-info" id="comments_mid" value="3">中评(0)</i>
			    		<i class="label label-large label-danger" id="comments_bad" value="1,2">差评(0)</i>
			    	</li>
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
							<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initCommentList');" value="comment/getCommentsList.do?type=1&toId=${ser.id}"/>
						</div>
			    		
			    	</div>
			    </div>
			    
			    <div class="p10_0 _nav_content" style="display: none;" child="5">
			    	<ul class="eventset-list"  id="otherSerArea">
			    	
			    	</ul>
			    </div>
			
			</div>
			
			</div>
			
			</div>
			
		<input type="hidden" id="publisher" value="${ser.publisher}"/>
		<input type="hidden" id="serviceId" value="${ser.id}"/>
		<jsp:include page="footer.jsp"></jsp:include>
	</body>

</html>