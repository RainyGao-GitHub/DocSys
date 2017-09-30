<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
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
		<title>资源信息-自由团队-IT产品开发外包平台</title>
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
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/pages/tianTianTou/pageJs/programer.js"></script>
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
		<style type="text/css">
			.body{background: white;}
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
			.eduFont li{float: left; margin: 0 5px 10px 5px;width: 100%; padding-right: 10px;line-height: 2;}
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
			    <div class="mainBox" style="min-width: 1100px;">
			        <div class="projectHeadLeft" style="width:100%;margin: 0px auto;">
			        	<div class="fLeft" style="width:250px;">
			        		<img class="proBigPic" id="headImg" width="200px" height="200px"  src="webPages/images/defaultHeadPic.png" onerror="this.src='webPages/images/defaultHeadPic.png'" alt="个人头像">
			        	</div>
			        
			            <div class="projectIntro" style="width:850px">
			                <h1 class="bold c56 f30">
			                	<a id="userName" class="projectTitle">${user.nickName}</a>
			                	<!-- <a class="fr mybtn" style="font-size:14px;font-weight: normal;padding: 0px;"><i class="glyphicon glyphicon-star-empty"></i>收藏</a> -->
			                </h1>	
			               <p>
			               		<input type='hidden' id="g_examine" value="${user.examine}"/>
			               		<input type='hidden' id="g_isRecommend" value="${user.isRecommend}"/>
			               		<input type='hidden' id="g_goodPercent" value="${user.goodPercent}"/>
			               		
		                		<span id="grade" class="redStar" style="vertical-align: middle;font-size: 16px;" title="资源等级">
			                		<span class="glyphicon glyphicon-star redStar"></span>
			                		<span class="glyphicon glyphicon-star redStar"></span>
			                		<span class="glyphicon glyphicon-star redStar"></span>
								</span>
		                	</p>
			               <p><i class="glyphicon glyphicon-map-marker mr10"></i>${user.area}</p>
			               <p>
		                    	<i class="glyphicon glyphicon-tags mr10"></i>
		                   		<c:if test="${not empty user.keyWord}">
		                   			<span class="p0_5">${user.keyWord}</span>
		                    	</c:if>
		                    	<c:if test="${empty user.keyWord}">
		                    		<span class="p0_5">暂无标签</span>
		                    	</c:if>
		                   </p>
			               <p id="intro" class="mt10 font-grey ellipsis">${user.intro}</p>
			               <p class="projectTip">
			               	<span class="fr">
			               		<a class="mybtn-primary fl" onclick="initMsgDalog(${user.id})">联系对方</a>
			               		<a class="mybtn-primary fl" style="margin-left: 20px" onclick="addFriend(${user.id},'${freeteam_user.nickName}')">加为好友</a>
			               		<c:if test="${not empty user.hostUrl and fn:startsWith(user.hostUrl, 'http')}">
				               		<a href="${user.hostUrl}" target="blank" class="mybtn-primary fl" style="margin-left: 20px">进入官网</a>
			               		</c:if>
			               	</span>
			               </p>
			            </div>
			        </div>
			    </div>
			</div>
			
			<!-- <h1 class="text-center">是否可以看他的资料：${showInfo}</h1> -->
			
			<div class="pageMain" style="width:70%;min-width: 1100px;">
				<div class="projectContent" style="width:100%">
					<ul class="switch_tab clearfix">
						<li class="active" toChild="1"><a>资源详情</a></li>
						<!--li toChild="2"><a>项目案例(${proDemoCnts})</a></li-->
						<li toChild="2"><a>项目案例</a></li>
						<c:if test="${user.type ne 1}">
							<li toChild="3" onclick="showEmployeeList();"><a>成员</a></li>
						</c:if>
						<li toChild="4" onclick="_firstPage3.click();"><a>网友评论</a></li>
						<li toChild="5" onclick="_firstPage1.click();"><a>服务</a></li>
						<li toChild="6" onclick="_firstPage2.click();"><a>项目</a></li>
					</ul>
				    
				    <div class="p10_0 _nav_content" child="1">
				    	<div style="width: 100%;overflow: hidden;" class="mt20 p20">
				    		${user.detailIntro}
				    	</div>
				    	
				    	
				    	<c:if test="${user.type eq 1}">
							<div class="projectContent mt20 p20">
			                    <p class="eduFont">
			                    	<em class="glyphicon glyphicon-briefcase pr5"></em><b>职业经历</b>
			                    	<ul class="eduFont" id="job_table">
			                           <c:if test="${showInfo eq true}">
			                           <li>暂无数据</li>
			                           </c:if>
			                           <c:if test="${showInfo ne true}">
			                           <li>无法查看</li>
			                           </c:if>
				                    </ul>
			                    </p>
			                    
			                    <p class="eduFont">
			                    	<em class="glyphicon glyphicon-education pr5"></em><b>教育经历</b>
			                    	<ul class="eduFont" id="edu_table">
			                           <c:if test="${showInfo eq true}">
			                           <li>暂无数据</li>
			                           </c:if>
			                           <c:if test="${showInfo ne true}">
			                           <li>无法查看</li>
			                           </c:if>				                    
			                        </ul>
			                    </p>
			                </div>
						</c:if>
				    </div>
				    
				    <div class="p10_0 _nav_content" child="2" style="display: none;padding: 0px 10px;">
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
				    
				    <c:if test="${user.type ne 1}">
					    <div class="p10_0 _nav_content" child="3" style="display: none;">
					    	<ul id="employeeList" class="eventset-list">
					    		<li>
					    			<i class="cell logo w12">
					    				<a href="#">
					    					<span class="incicon">
					    						<img src="//static.gofreeteam.com/webPages/upload/project/undefined" onerror="this.src=&quot;webPages/images/project.jpg">
					    					</span>
					    				</a>
					    			</i>
					    			<i class="cell commpany w20">
					    				<span class="name">
					    					詹俊鹏
					    				</span>
					    				<span>
						    				<span class="glyphicon glyphicon-star redStar"></span>
					                		<span class="glyphicon glyphicon-star redStar"></span>
					                		<span class="glyphicon glyphicon-star redStar"></span>
					                		<span class="glyphicon glyphicon-star redStar"></span>
					                		<span class="glyphicon glyphicon-star redStar"></span>
					    				</span>
					    				<span class="desc">java工程师</span>
					    			</i>
					    			<span class="cell commpany">
					    				<span class="desc">
					    					专业的JAV开发人员
					    				</span>
					    			</span>
					    		</li>
					    		
					    		<div  onclick="showAll(this)" class="text-right p10">
					    			<a>展开</a>
					    		</div>
					    		<li style="display: none;">
					    			<i class="cell logo w12">
					    				<a href="#">
					    					<span class="incicon">
					    						<img src="//static.gofreeteam.com/webPages/upload/project/undefined" onerror="this.src=&quot;webPages/images/project.jpg">
					    					</span>
					    				</a>
					    			</i>
					    			<i class="cell commpany w20">
					    				<span class="name">
					    					黄谦
					    				</span>
					    				<span>
						    				<span class="glyphicon glyphicon-star redStar"></span>
					                		<span class="glyphicon glyphicon-star redStar"></span>
					                		<span class="glyphicon glyphicon-star redStar"></span>
					                		<span class="glyphicon glyphicon-star redStar"></span>
					                		<span class="glyphicon glyphicon-star redStar"></span>
					    				</span>
					    				<span class="desc">java工程师</span>
					    			</i>
					    			<span class="cell commpany">
					    				<span class="desc">
					    					专业的JAV开发人员
					    				</span>
					    			</span>
					    		</li>
					    		
					    		<li  style="display: none;">
					    			<i class="cell logo w12">
					    				<a href="#">
					    					<span class="incicon">
					    						<img src="//static.gofreeteam.com/webPages/upload/project/undefined" onerror="this.src=&quot;webPages/images/project.jpg">
					    					</span>
					    				</a>
					    			</i>
					    			<i class="cell commpany w20">
					    				<span class="name">
					    					路人路人路人路人路人路人甲
					    				</span>
					    				<span  class="desc">
						    				非平台用户
					    				</span>
					    				<span class="desc">java工程师</span>
					    			</i>
					    			<span class="cell commpany">
					    				<span class="desc">
					    					专业的JAV开发人员
					    				</span>
					    			</span>
					    		</li>
					    	</ul>
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
				    	<a class="mybtn-primary fr" onclick="addUserComment()">发表评论</a>
				    	<hr/>
				    	<div >
				    	
				    		<div id="comments">
				    			
								
							</div>
							<div align="center" class="p5">
								<a id="_firstPage3" class="pageBtn" onclick="chipTo('first',this)">首页</a>
								<a class="pageBtn" onclick="chipTo('pre',this)">上一页</a>
								<span>第<span name="page">0</span>/<span id="totalPage3" name="totalPage">0</span>页</span>
								<a class="pageBtn" onclick="chipTo('next',this)">下一页</a>
								<a class="pageBtn" onclick="chipTo('last',this)">尾页</a>
								<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initCommentList');" value="comment/getCommentsList.do?type=2&toId=${user.id}"/>
							</div>
				    		
				    	</div>
				    </div>
				    
				    
				    <div class="p10_0 _nav_content" child="5" style="display: none;">
				    	<div id="fuwu">
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
				    <!-- scroll-box 样式可以美化滚动条 -->
				    <div class="p10_0  _nav_content" child="6" style="display: none;">
					    <div id="fuwu" class="pb10">
							<ul class="eventset-list" id="proListArea">
				    			<li class="pl20">暂无数据</li>
							</ul>
							<div align="center" class="p5">
								<a id="_firstPage2" class="pageBtn" onclick="chipTo('first',this)">首页</a>
									<a class="pageBtn" onclick="chipTo('pre',this)">上一页</a>
									<span>第<span name="page">0</span>/<span id="totalPage2" name="totalPage">0</span>页</span>
									<a class="pageBtn" onclick="chipTo('next',this)">下一页</a>
									<a class="pageBtn" onclick="chipTo('last',this)">尾页</a>
									<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initProList');" value="queryPrjListDataByUserId.do"/>
							</div>
							<hr/>
						</div>
					</div>
				    	
				</div>
				
				
				<!-- <div class="projectContent">
				    <h3 class="sectionTitleA bold c56 f18 mb20" id="panel_product_media">项目列表</h3>
				    	
				    	<div id="fuwu" class="pb10 border_plist">
							<ul class="eventset-list max_h450" id="proListArea">
				    			<li class="pl20">暂无数据</li>
							</ul>
							<div align="center" class="p5">
								<a id="_firstPage2" class="pageBtn" onclick="chipTo('first',this)">首页</a>
									<a class="pageBtn" onclick="chipTo('pre',this)">上一页</a>
									<span>第<span name="page">0</span>/<span id="totalPage2" name="totalPage">0</span>页</span>
									<a class="pageBtn" onclick="chipTo('next',this)">下一页</a>
									<a class="pageBtn" onclick="chipTo('last',this)">尾页</a>
									<input type="hidden" name="hidUrl" onclick="doPageSplit(this,'initProList');" value="queryPrjListDataByUserId.do"/>
							</div>
							<hr/>
						</div>
						
						
					<p class="h150"></p>
				
				</div> -->
				
				
			</div>
		</div>
		
		
			
		<input type="hidden" id="id" value="${userId}"/>
		<jsp:include page="footer.jsp"></jsp:include>
	</body>

</html>