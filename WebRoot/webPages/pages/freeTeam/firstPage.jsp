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
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap-theme.min.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.comm.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.custom.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-fonts/css/font-awesome.css" type="text/css" media="screen" />
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
		<script src="<%=basePath%>webPages/pages/tianTianTou/pageJs/firstPage.js"></script>
		<script src="<%=basePath%>webPages/js/common.js"></script>
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
							<li class="name"><a href="toChangePwd.do">忘记密码？点我找回</a></li>
						</ul>
					</c:if>
				</div>
			</div>
		</div>
		
		<div class="container">
			<div class="main mheader banner">
				<div class="bannerImg banner-slide">
				
					<div class="slideBtn slideBtn-left"><span class="glyphicon glyphicon-chevron-left"></span></div>
					<div class="slideBtn slideBtn-right"><span class="glyphicon glyphicon-chevron-right"></span></div>
					
					
					<ul class="header_back_slider">
						<li>
							<a><img src="<%=basePath%>/webPages/images/banner1.png" alt="自由团队" /></a>
						</li>
						<li>
							<a><img src="<%=basePath%>/webPages/images/banner1.png" alt="自由团队" /></a>
						</li>
						<li>
							<a><img src="<%=basePath%>/webPages/images/banner1.png" alt="自由团队" /></a>
						</li>
						<li>
							<a><img src="<%=basePath%>/webPages/images/banner1.png" alt="自由团队" /></a>
						</li>
						<li>
							<a><img src="<%=basePath%>/webPages/images/banner1.png" alt="自由团队" /></a>
						</li>
					</ul>
				</div>
				<div class="">
					<!-- 点击下面的标题也可触发显示二维码 ↓ -->
					<ul class="banner-slider banner-tabs">
						<li class="current tab p_tab tab-basic p_tab_item p_slide_trig" data-value="0"></li>
						<li class=" tab p_tab tab-basic p_tab_item p_slide_trig" data-value="1"></li>
						<li class=" tab p_tab tab-basic p_tab_item p_slide_trig" data-value="2"></li>
						<li class=" tab p_tab tab-basic p_tab_item p_slide_trig" data-value="3"></li>
						<li class=" tab p_tab tab-basic p_tab_item p_slide_trig" data-value="4"></li>
					</ul>
				</div>
			</div>
			<script>
				var headerSlider = $('.header_back_slider').bxSlider({
					controls: false,
					pagerSelector: '.slider',
					auto: true,
					pause: 8000,
					onSlideBefore: function(indexSlider) {
						$('.banner-tabs .p_tab').removeClass("current");
						$(".banner-tabs .p_tab").each(function(index_tab) {
							if (index_tab == (indexSlider.index() - 1)) {
								$(this).addClass("current");
							}
						})
					},
					buildPager: function(slideIndex) {
						return '•';
					}
				});
				$(".header_back_slider li img").show();
				var currentHeaderSlider = 0;
				$('.p_tab_menu').hide();
				$('.banner-tabs .p_tab').hover(
					function() {
						var $this = $(this);
						$this.find('.p_tab_menu').slideDown(200);
					},
					function() {
						var $this = $(this);
						$this.find('.p_tab_menu').slideUp(200);
					}
				);
				$(".slideBtn-left").on("click",function(){
					$(".p_slide_trig.current").prev().mouseover();
				});
				$(".slideBtn-right").on("click",function(){
					$(".p_slide_trig.current").next().mouseover();
				});
				
				$('.banner-tabs .p_slide_trig').on("mouseover", function() {
					var $this = $(this);
					currentHeaderSlider = $this.attr('data-value');
					$(".p_slide_trig").removeClass("current");
					$this.addClass("current");
					//console.log('index:'+currentHeaderSlider);
					headerSlider.goToSlide(currentHeaderSlider);
					setTimeout(function() {
						if (currentHeaderSlider != headerSlider.getCurrentSlide()) {
							headerSlider.goToSlide(currentHeaderSlider);
						}
					}, 400);
				});
				var slider = $('.slideshow').bxSlider({
					controls: false,
					pagerSelector: '.slider',
					buildPager: function(slideIndex) {
						return '•';
					}
				});
			</script>
			
			
			<div class="main-row">
				<div class="col-md">
					<ul class="nav nav-tabs _nav_click">
						<li class="active _nav_bar"><a>推荐服务</a></li>
						<li class="more"><a href="pageTo.do?p=serviceList">更多服务</a></li>
					</ul>
					<div class="row">
						<div class="_nav_content p10_0">
							<div class="startups-list-box">
								<div class="swiper-container fms-swiper-container _nav_content">
									<div class="swiper-wrapper">
										<div class="swiper-slide">
											<ul id="serArea" class="startups-list col5">
												<li>暂无数据</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			<div class="main-row">
				<div class="col-md">
					<ul class="nav nav-tabs _nav_click">
						<li class="active _nav_bar"><a>推荐项目</a></li>
						<li class="more"><a href="pageTo.do?p=projectList">更多项目</a></li>
					</ul>
					<div class="row">
						<div class="_nav_content p10_0">
							<div class="startups-list-box">
								<div class="swiper-container fms-swiper-container _nav_content">
									<div class="swiper-wrapper">
										<div class="swiper-slide">
											<ul id="prjArea" class="startups-list col5">
												<li>暂无数据</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			
			
			<!-- <div class="main-row">
				<div class="col-md">
					<ul class="nav nav-tabs">
						<li class="active"><a href="javascript:void(0)">合作伙伴</a></li>
						<li class="more">
							<a href="javascript:void(0)" class="partner-apply">
							<span class="partner-tip">请添加商务合作微信 “1764085” 为好友，以便深度洽谈合作事宜。</span>合作申请</a>
						</li>
					</ul>
					<div class="row">
						<ul class="event-partner home">
							<li><a href="http://zc.open.qq.com/" target="_blank"><span>腾讯众创空间</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_txzckj.jpg" /></a></li>
							<li><a href="https://www.baidu.com/" target="_blank"><span>百度</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_baidu.jpg" /></a></li>
							<li><a href="http://beijing.thegmic.cn/" target="_blank"><span>GMIC</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_gmic.jpg?2" /></a></li>
							<li><a href="http://www.3wcoffee.com/" target="_blank"><span>3W</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_3w.jpg?2" /></a></li>
							<li><a href="http://www.sem.tsinghua.edu.cn/" target="_blank"><span>清华经管学院</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_qhjgxy.jpg" /></a></li>
							<li><a href="http://edp.sjtu.edu.cn/" target="_blank"><span>交大安泰经管</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_jdat.jpg" /></a></li>
							<li><a href="http://www.qiniu.com/" target="_blank"><span>七牛云</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_qiniu.jpg" /></a></li>
							<li><a href="http://www.z-innoway.com/" target="_blank"><span>中关村创业大街</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_zgccydj.jpg" /></a></li>
							<li><a href="http://huayouhui.tuweia.cn/" target="_blank"><span>华友会</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_hyh.jpg" /></a></li>
							<li><a href="http://startupweekend.huodongxing.com/" target="_blank"><span>Startup Weekend</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_cyzm.jpg" /></a></li>
							<li><a href="http://www.nbs.edu.cn/" target="_blank"><span>新华都商学院</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_xhdsxy.jpg" /></a></li>
							<li><a href="http://www.aamachina.org/" target="_blank"><span>亚杰商会</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_yjsh.jpg" /></a></li>
							<li><a href="http://www.kejisi.com/" target="_blank"><span>科技寺</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_kjs.jpg" /></a></li>
							<li><a href="http://salad.cool/" target="_blank"><span>创业沙拉</span><img src="http://pp1.gofreeteam.com/zhuanti-imgs/logo_cysl.jpg" /></a></li>
						</ul>
					</div>
				</div>
			</div> -->
		</div>
		<jsp:include page="footer.jsp"></jsp:include>
		<!-- 弹窗：提交建议或反馈 -->
		<!-- <div class="modal" style="display: none;">
			<div class="modal-dialog modal-dialog-md">
				<div class="modal-content">
					<div class="modal-header">
						<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true" title="关闭">×</span><span class="sr-only">关闭</span>
						</button>
						<h4 class="modal-title">提交建议或反馈</h4>
					</div>
					<div class="modal-body">
						填单前 ↓
						<form class="form-horizontal model-form" style="display: none;">
							<p class="modal-text">感谢你为我们提供建议或反馈！</p>
							<textarea class="form-control" rows="5" placeholder="请尽量客观详细的描述你的问题"></textarea>
						</form>
						填单后 ↓
						<div class="row">
							<span class="fa fa-check-circle fa-5x"></span>
							<h4>你的反馈已提交成功！</h4>
							<h5 style="line-height: 22px;">再次感谢你对自由团队的关注<br/>若需更多的了解我们请关注自由团队微信公众号 “evervc”。</h5>
						</div>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btnDefault" data-dismiss="modal">取消</button>
						<button type="button" class="btn btnPrimary">提交</button>
					</div>
				</div>
			</div>
		</div> -->
	</body>

</html>