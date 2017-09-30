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
		<title>自由团队-联系我们</title>
		<meta name="keywords" content="自由团队，IT兼职，外包平台" />
		<meta name="description" content="自由团队是一个专业高效的免费找外包，专业人才和服务的平台，致力于通过互联网将IT行业的专业人才汇聚一起、共同实现创业和发挥自己的更多价值。" />
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
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/styleV2.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/jquery.cookie.js"></script>
		
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/evervc/jquery.loginPanel.js"></script>
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/swiper.min.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/freeTeam/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/freeTeam/js/controller/index_v2.js"></script>
		<script src="<%=basePath%>webPages/js/common.js"></script>
		<style>
			.nav-tabs.nav-justified > .active > a, .nav-tabs.nav-justified > .active > a:hover, .nav-tabs.nav-justified > .active > a:focus, .nav-tabs.nav-justified > li > a {
			    border: 0 none;
			    border-radius: 0;
			    background: none;
			    font-size: 14px;
			}
			.nav-tabs.about > li > a {
				border-bottom: 1px #E3E3E3 solid;
			    padding: 25px 0;
			}
			.nav-tabs.about > li > a:hover,.nav-tabs.about > li > a.active {
			    background-color: #f9f9f9 !important;
			}
			
			.nav-tabs.about > li.active{
				border-bottom: 1px #F80 solid;
			}
			.nav li.active a{
				line-height: normal;
			}
			.row-section {
			    padding: 80px 180px;
			}
			.row-section h2.tit1 {
			    text-align: center;
			    margin-bottom: 20px;
			    color: #f80;
			}
			.row-section h2.tit2 {
			    margin: 20px 0;
			}
			
			.row-section h2 {
			    text-align: center;
			    margin-bottom: 25px;
			    color: #222;
			}
			
			.row-section p {
			    font-size: 14px;
			    line-height: 1.8;
			    color: #666;
			    margin-bottom: 15px;
			}
			.row-section-btn {
			    text-align: center;
			    text-indent: 0 !important;
			}
			.btn-outline-default:hover {
			    background-color: #f80;
			    color: #fff;
			    border: 1px #f80 solid;
			}
			.btn-outline-default {
			    text-align: center;
			    line-height: 46px;
			    padding: 0 70px;
			    border: 1px #ddd solid;
			    display: inline-block;
			    margin: 0 auto;
			    margin-top: 20px;
			    text-indent: 0;
			    border-radius: 3px;
			}
			.row-section p {
			    font-size: 14px;
			    line-height: 1.8;
			    color: #666;
			    margin-bottom: 15px;
			}
			
			.no-indent {
			    text-indent: 0;
			}
			
			.about-links {
			    margin: 0 50px;
			    overflow: hidden;
			}
			.about-links li {
			    float: left;
			    margin: 0 10px 10px 0;
			    line-height: 40px;
			}
			.about-links li a:hover {
			    text-decoration: none;
			    background-color: #fa0;
			    border: 1px #fa0 solid;
			    color: #fff;
			}
			
			.about-links li a {
			    padding: 10px 11px;
			    border: 1px #eee solid;
			    border-radius: 3px;
			}
			.breadcrumb {
			    background: none;
			    padding: 15px 0;
			    margin-bottom: 0;
			}
		</style>
		
		<script>
		    $(document).ready(function () {
		        // header
		        $(".require-auth").loginPanel();
		
		        var evTimeout = null;
		        $("#header .dropdown").mouseenter(function(){
		            $(this).find(".dropdown-menu").slideDown(200);
		            if(evTimeout != null) {
		                clearTimeout(evTimeout);
		                evTimeout = null;
		            }
		        }).mouseleave(function(){
		            var el = $(this);
		            if(evTimeout != null) {
		                clearTimeout(evTimeout);
		                evTimeout = null;
		            }
		            evTimeout = setTimeout(function () {
		                el.find(".dropdown-menu").slideUp(200);
		                evTimeout = null;
		            }, 100);
		        });
		
		
		        // 退出时清理cookie
		        $("a._btn_logout").click(function(e){
		            $.removeCookie('access_token', { path:'/' });
		            $.removeCookie('user_id', { path:'/' });
		        });
		
		    });
		    var _hmt = _hmt || [];
		    (function() {
		        var hm = document.createElement("script");
		        hm.src = "//hm.baidu.com/hm.js?b8afd1353ddcc6a6e3630d282272fa54";
		        var s = document.getElementsByTagName("script")[0];
		        s.parentNode.insertBefore(hm, s);
		    })();
    </script>
    
	</head>

	<body>
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		<jsp:include page="head.jsp"/>
		
		<div class="bgcolor">
			<div class="subnav">
				<div class="container">
					<ul class="nav-pills f-left">
						<li class="name">推荐</li>
						<li><a href="chipPage.do?p=freeTeam/prj_workflow">项目承接流程图</a></li>
						<li><a href="chipPage.do?p=freeTeam/ser_workflow">服务购买流程图</a></li>
					</ul>
					<c:if test="${empty freeteam_user}">
						<ul class="nav-pills f-right">
							<li class="name"><a href="toChangePwd.do">忘记密码？点我找回</a></li>
						</ul>
					</c:if>
				</div>
			</div>
		</div>
		
		
		<!-- 页头 -->
		<!-- 子导航 -->
		
		<div class="container">
		    <ol class="breadcrumb">
		        <li>首页</li>
		        <li>关于自由团队</li>
		        <li class="active">联系我们</li>
		    </ol>
		    <div class="main-row">
		        <div class="col-md">
		
		            <ul id="myTabs" class="nav nav-tabs nav-justified about" role="tablist">
		                <li role="presentation" class=""><a href="http://www.gofreeteam.com/pageTo.do?p=contactUs#about" aria-controls="about" role="tab" data-toggle="tab" aria-expanded="false">关于我们</a></li>
		                <li role="presentation"><a href="http://www.gofreeteam.com/pageTo.do?p=contactUsl#useAgreement" aria-controls="useAgreement" role="tab" data-toggle="tab">使用协议</a></li>
		                <!-- <li role="presentation"><a href="http://www.gofreeteam.com/about.html#service" aria-controls="service" role="tab" data-toggle="tab">平台服务</a></li>
		                <li role="presentation"><a href="http://www.gofreeteam.com/about.html#media" aria-controls="media" role="tab" data-toggle="tab">媒体报道</a></li> -->
		                <li role="presentation"><a href="http://www.gofreeteam.com/pageTo.do?p=contactUs#_contact" aria-controls="_contact" role="tab" data-toggle="tab" aria-expanded="true">联系我们</a></li>
		                <!-- <li role="presentation"><a href="http://www.gofreeteam.com/about.html#links" aria-controls="links" role="tab" data-toggle="tab">友情链接</a></li> -->
		            </ul>
		
		            <div id="myTabContent" class="tab-content">
		
		                <!-- 公司简介 ↓ -->
		                <div role="tabpanel" class="tab-pane fade row-tab-content" id="about">
		                    <div class="row-section">
		                        <h2 class="tit1">关于自由团队</h2>
		                        <p class="textIndent2">自由团队是一个专业的IT产品开发资源平台，致力于解决IT产品开发问题，通过为IT行业的技术人员、团队和企业提供一个开放、安全、高效的互联网开发服务交易平台，实现技术快速安全高效地变现，促进技术人员、团队和企业的专业技能的不断提升，实现IT产品开发资源的优化配置，提升IT产品开发的效率与品质。</p>
		                        <p class="textIndent2">我们将为打造一个完美的IT产品开发资源平台而不懈努力！</p>
		                    </div>
		                </div>
		
		                <!-- 使用协议 ↓ -->
		                <div role="tabpanel" class="tab-pane fade row-tab-content" id="useAgreement">
		                    <div class="row-section">
		                        <h2 class="tit1">自由团队使用协议</h2>
		                        <p>本协议系由用户（“您”）与杭州圆图网络技术有限公司（本协议中统称为"圆图公司"）就其所运营的“自由团队”互联网IT产品开发资源平台（本协议中统称为本网络平台） 所订立的相关权利义务规范。因此，请在注册成为自由团队用户前，确实详细阅读本协议的所有内容，当您点选同意键即视为同意接受本协议的所有规范并愿受其拘束。</p>
<p>圆图公司有权随时变更本协议并在本网络平台上予以公告。经修订的条款一经在本网络平台的公布后，立即自动生效。如您不同意相关变更，必须立即停止使用本网络平台。 本协议内容包括协议正文及所有本网络平台已经发布的各类规则。所有规则为本协议不可分割的一部分，与本协议正文具有同等法律效力。一旦您继续使用本网络平台，则表示您已接受并自愿遵守经修订后的条款。</p>
<p>用户应当明确：无论事实上是否在注册前认真阅读，只要用户点击“同意”按钮并按照相关注册程序成功注册，用户的行为就已经表示用户无条件接受了本协议以及本网络平台所不时公布的各项管理规定，并愿意受其约束。如果发生纠纷，用户不得以未仔细阅读为由实行抗辩。</p>
<p>在本协议中所使用的下列词语，除非另有定义，应具有以下含义：</p>
<p>“本网络平台”在无特别说明的情况下，均指"自由团队"（www.gofreeteam.com）。</p>
<p>“用户”：指具有完全民事行为能力的自由团队各项服务的使用者。</p>
<p>“需求方”：是指在本网络平台上进行发布需求或购买增值服务等“买”操作的用户。</p>
<p>“服务方”：是指在本网络平台上、销售服务、出售技能等“卖”操作的用户。</p>
<p>第一条 用户资格</p>
<p>1、只有符合下列条件之一的自然人或法人才能申请成为本网络平台用户，可以使用本网络平台的服务：</p>
<p>A、年满十八岁，并具有民事权利能力和民事行为能力的自然人；</p>
<p>B、无民事行为能力人或限制民事行为能力人应经过其监护人的同意；</p>
<p>C、根据中国法律、法规、行政规章成立并合法存在的机关、企事业单位、社团组织和其他组织。无法人资格的单位或组织不当注册为本网络平台用户的，其与本网络平台之间的协议自始无效，本网络平台一经发现，有权立即终止对该用户的服务，并追究其使用本网络平台服务的一切法律责任。</p>
<p>2、用户需要提供明确的联系电话，并提供真实姓名或名称。</p>
<p>第二条 用户的权利和义务</p>
<p>1、用户有权根据本协议及本网络平台发布的相关规则，在本网络平台及相关产品发布信息，参加本网络平台的有关活动及有权享受本网络平台提供的其他有关资讯及信息服务；</p>
<p>2、用户须自行负责自己的用户账号和密码，且须对在用户账号密码下发生的所有活动承担责任。用户有权根据需要更改登录和账户提现密码。因用户的过错导致的任何损失由用户自行承担，该过错包括但不限于：不按照交易提示操作，未及时进行交易操作，遗忘或泄漏密码，密码被他人破解，您使用的计算机被他人侵入；</p>
<p>3、用户应当向本网络平台提供真实准确的注册信息，包括但不限于真实姓名/名称、身份证号/营业执照、联系电话、地址、邮政编码等。保证本网络平台可以通过上述联系方式与自己进行联系。同时，用户也应当在相关资料实际变更时及时更新有关注册资料；</p>
<p>4、用户不得以任何形式擅自转让或授权他人使用自己在本网络平台的用户帐号；</p>
<p>5、用户有义务确保在本网络平台上发布的需求信息真实、准确，无误导性；</p>
<p>6、用户在本网络平台上发布需求和在社区内及相关产品发布信息，不得违反国家法律、法规、行政规章的规定、不得侵犯他人知识产权或其他合法权益、不得违背社会公共利益或公共道德、不得违反自由团队的相关规定；</p>
<p>7、用户在本网络平台交易中应当遵守诚实信用原则，不得以干预或操纵发布需求等不正当竞争方式扰乱网上交易秩序，不得从事与网上交易无关的不当行为；</p>
<p>8、用户不应采取不正当手段（包括但不限于虚假需求、互换好评等方式）提高自身或他人信用度，或采用不正当手段恶意评价其他用户，降低其他用户信用度；</p>
<p>9、用户不得违反《银行卡业务管理办法》使用银行卡，或利用信用卡套取现金（以下简称套现）；</p>
<p>10、用户承诺自己在使用本网络平台实施的所有行为遵守法律、法规、行政规章和本网络平台的相关规定以及各种社会公共利益或公共道德。如有违反导致任何法律后果的发生，用户将以自己的名义独立承担相应的法律责任；</p>
<p>11、用户在本网络平台网上交易过程中如与其他用户因交易产生纠纷，可以请求本网络平台从中予以协调处理。用户如发现其他用户有违法或违反本协议的行为，可以向本网络平台举报；</p>
<p>12、用户应当自行承担因交易产生或取得的相关费用，并依法纳税；</p>
<p>13、未经本网络平台书面允许，用户不得将本网络平台的任何资料以及在交易平台上所展示的任何信息作商业性利用（包括但不限于以复制、修改、翻译等形式制作衍生作品、分发或公开展示）；</p>
<p>14、用户不得使用以下方式登录网站或破坏网站所提供的服务：</p>
<p>A、以任何机器人软件、蜘蛛软件、爬虫软件、刷屏软件或其它自动方式访问或登录本网络平台；</p>
<p>B、通过任何方式对本公司内部结构造成或可能造成不合理或不合比例的重大负荷的行为；</p>
<p>C、通过任何方式干扰或试图干扰网站的正常工作或网站上进行的任何活动。</p>
<p>15、用户有权在同意本网络平台相关规则的前提下享受消费者保障服务；</p>
<p>16、用户同意接收来自本网络平台的信息，包括但不限于活动信息、交易信息、促销信息等。</p>
<p>17、用户了解并同意，如您系在自由团队完成注册，只要您注册成功，将您的支付宝登录名填写完整，以后提现都需要通过支付宝账户进行操作。</p>
<p>第三条 自由团队网络平台的权利和义务</p>
<p>1、本网络平台仅为用户提供一个信息交流平台，是需求方发布需求和服务方提供解决方案的一个交易市场，本网络平台对交易双方均不加以监视或控制，亦不介入交易的过程；</p>
<p>2、本网络平台有义务在现有技术水平的基础上努力确保整个网上交流平台的正常运行，尽力避免服务中断或将中断时间限制在最短时间内，保证用户网上交流活动的顺利进行；</p>
<p>3、为保障交易公平安全，本网络平台为用户提供代收、代付服务，为交易双方提供资金担保；</p>
<p>4、本网络平台有义务对用户在注册使用本网络平台信息平台中所遇到的与交易或注册有关的问题及反映的情况及时作出回复；</p>
<p>5、本网络平台有权对用户的注册和认证资料进行审查，对存在任何问题或怀疑的注册与认证资料，本网络平台有权发出通知询问用户并要求用户做出解释、改正；</p>
<p>6、用户因在本网络平台网上交易与其他用户产生纠纷的，用户将纠纷告知本网络平台，或本网络平台知悉纠纷情况的，经审核后，本网络平台有权通过电子邮件及电话联系向纠纷双方了解纠纷情况，并将所了解的情况通过电子邮件互相通知对方；用户通过司法机关依照法定程序要求本网络平台提供相关资料，本网络平台将积极配合并提供有关资料；</p>
<p>7、因网上信息平台的特殊性，本网络平台没有义务对所有用户的交易行为以及与交易有关的其他事项进行事先审查，但如发生以下情形，本网络平台有权无需征得用户的同意限制用户的活动、向用户核实有关资料、发出警告通知、暂时中止、无限期中止及拒绝向该用户提供服务：</p>
<p>A、用户违反本协议或因被提及而纳入本协议的相关规则；</p>
<p>B、存在用户或其他第三方通知本网络平台，认为某个用户或具体交易事项存在违法或不当行为，并提供相关证据，而本网络平台无法联系到该用户核证或验证该用户向本网络平台提供的任何资料；</p>
<p>C、存在用户或其他第三方通知本网络平台，认为某个用户或具体交易事项存在违法或不当行为，并提供相关证据。本网络平台以普通非专业交易者的知识水平标准对相关内容进行判别，可以明显认为这些内容或行为可能对本网络平台用户或本网络平台造成财务损失或法律责任。</p>
<p>8、根据国家法律、法规、行政规章规定、本协议的内容和本网络平台所掌握的事实依据，可以认定该用户存在违法或违反本协议行为以及在本网络平台交易平台上的其他不当行为，本网络平台有权无需征得用户的同意在本网络平台交易平台及所在网站上以网络发布形式公布该用户的违法行为，并有权随时作出删除相关信息、终止服务提供等处理；</p>
<p>9、本网络平台依据本协议及相关规则，可以冻结、使用、先行赔付、退款、处置用户缴存并冻结在本网络平台账户内的资金。被封号的用户如果账户中有资金，在扣除用户不正当收入后，用户可申请提现；</p>
<p>10、本网络平台有权在不通知用户的前提下，删除或采取其他限制性措施处理下列信息：包括但不限于以规避费用为目的；以炒作信用为目的；存在欺诈等恶意 或虚假内容；与网上交易无关或不是以交易为目的；存在恶意竞价或其他试图扰乱正常交易秩序因素；违反公共利益或可能严重损害本网络平台和其他用户合法利益。</p>
<p>第四条 服务的中断和终止 </p>
<p>1、本网络平台可自行全权决定以任何理由(包括但不限于本网络平台认为用户已违反本协议及相关规则的字面意义和精神，或用户在超过180日内未登录本网络平台等)终止对用户的服务，并有权在两年内保存用户在本网络平台的全部资料（包括但不限于用户信息、产品信息、交易信息等）。同时本网络平台可自行全权决定，在发出通 知或不发出通知的情况下，随时停止提供全部或部分服务。服务终止后，本网络平台没有义务为用户保留原账户中或与之相关的任何信息，或转发任何未曾阅读或发送的 信息给用户或第三方；</p>
<p>2、若用户申请终止本网络平台服务，需经本网络平台审核同意，方可解除与本网络平台的协议关系，但本网络平台仍保留下列权利：</p>
<p>A、本网络平台有权在法律、法规、行政规章规定的时间内保留该用户的资料,包括但不限于以前的用户资料、交易记录等；</p>
<p>B、若终止服务之前，该用户在本网络平台交易平台上存在违法行为或违反本协议的行为，本网络平台仍可行使本协议所规定的权利。</p>
<p>3、用户存在下列情况，本网络平台可以终止向该用户提供服务：</p>
<p>A、在用户违反本协议及相关规则规定时，本网络平台有权终止向该用户提供服务。本网络平台将在中断服务时通知用户。但该用户在被本网络平台终止提供服务后，再一次直接或间接或以他人名义注册为本网络平台用户的，本网络平台有权再次单方面终止为该用户提供服务；</p>
<p>B、本网络平台发现用户注册资料中主要内容是虚假的，本网络平台有权随时终止为该用户提供服务；</p>
<p>C、本协议终止或更新时，用户未确认新的协议的；</p>
<p>D、其它本网络平台认为需终止服务的情况。</p>
<p>第五条 本网络平台的责任范围</p>
<p>当用户接受该协议时，用户应当明确了解并同意：</p>
<p>1、本网络平台不能随时预见到任何技术上的问题或其他困难。该等困难可能会导致数据损失或其他服务中断。本网络平台是在现有技术基础上提供的服务。本网络平台不保证以下事项∶</p>
<p>A、本网络平台将符合所有用户的要求；</p>
<p>B、本网络平台不受干扰、能够及时提供、安全可靠或免于出错；</p>
<p>2、是否经由本网络平台下载或取得任何资料，由用户自行考虑、衡量并且自负风险，因下载任何资料而导致用户电脑系统的任何损坏或资料流失，用户自行承担后果。希望用户在使用本网络平台时，小心谨慎并运用常识；</p>
<p>3、用户经由本网络平台取得的建议和资讯，无论其形式或表现，绝不构成本协议未明示规定的任何保证；</p>
<p>4、基于以下原因而造成的利润、商誉、使用、资料损失或其它无形损失，本网络平台不承担任何直接、间接、附带、特别、衍生性或惩罚性赔偿（即使本网络平台已被告知前款赔偿的可能性）：</p>
<p>A、本网络平台的使用或无法使用；</p>
<p>B、用户的传输或资料遭到未获授权的存取或变更；</p>
<p>C、本网络平台中任何第三方之声明或行为；</p>
<p>D、本网络平台在服务交易中为用户提供交易机会，推荐交易方；</p>
<p>E、本网络平台其它相关事宜。</p>
<p>5、本网络平台只是为用户提供一个服务交易的平台，对于用户所发布的需求的合法性、真实性及其品质，以及用户履行交易的能力等，本网络平台一律不负任何担保责任；</p>
<p>6、本网络平台提供与其它互联网上的网站或资源的链接，用户可能会因此连结至其它运营商经营的网站，但不表示本网络平台与这些运营商有任何关系。其它运营商经营的网站均由各经营者自行负责，不属于本网络平台控制及负责范围之内。对于存在或来源于此类网站或资源的任何内容、广告、物品或其它资料，本网络平台亦不予保证或负责。因使用或依赖任何此类网站或资源发布的或经由此类网站或资源获得的任何内容、物品或服务所产生的任何损害或损失，本网络平台不负任何直接或间接的责任。</p>
<p>第六条 知识产权 </p>
<p>1、本网络平台及本网络平台所使用的任何相关软件、程序、内容，包括但不限于作品、图片、档案、资料、网站构架、网站版面的安排、网页设计、经由本网络平台或广告商向用户呈现的广告或资讯，均由本网络平台或其它权利人依法享有相应的知识产权，包括但不限于著作权、商标权、专利权或其它专属权利等，受到相关法律的保护。未经本网络平台或权利人明示授权，用户保证不修改、出租、出借、出售、散布本网络平台及本网络平台所使用的上述任何资料和资源，或根据上述资料和资源制作成任何种类产品；</p>
<p>2、本网络平台授予用户不可转移及非专属的使用权，使用户可以通过单机计算机使用本网络平台的目标代码（以下简称"软件"），但用户不得且不得允许任何第三方复制、修改、创作衍生作品、进行还原工程、反向组译，或以其它方式破译或试图破译源代码，或出售、转让"软件"或对"软件"进行再授权，或以其它方式移转"软件"之任何权利。用户同意不以任何方式修改"软件"，或使用修改后的"软件"；</p>
<p>3、用户不得经由非本网络平台所提供的界面使用本网络平台。</p>
<p>第七条 隐私权 </p>
<p>1、信息使用：</p>
<p>A、本网络平台不会向任何人出售或出借用户的个人或法人信息，除非事先得到用户得许可；</p>
<p>B、本网络平台亦不允许任何第三方以任何手段收集、编辑、出售或者无偿传播用户的个人或法人信息。任何用户如从事上述活动，一经发现，本网络平台有权立即终止与该用户的服务协议，查封其账号。</p>
<p>2、信息披露：用户的个人或法人信息将在下述情况下部分或全部被披露：</p>
<p>A、经用户同意，向第三方披露；</p>
<p>B、若用户是合法的知识产权使用权人并提起投诉，应被投诉人要求，向被投诉人披露，以便双方处理可能的权利纠纷；</p>
<p>C、根据法律的有关规定，或者行政、司法机关的要求，向第三方或者行政、司法机关披露；</p>
<p>D、若用户出现违反中国有关法律或者网站规定的情况，需要向第三方披露；</p>
<p>E、为提供您所要求的产品和服务，而必须和第三方分享用户的个人或法人信息；</p>
<p>F、其它本网络平台根据法律或者网站规定认为合适的披露。</p>
<p>3、信息安全：</p>
<p>A、在使用本网络平台服务进行网上交易时，请用户妥善保护自己的个人或法人信息，仅在必要的情形下向他人提供；</p>
<p>B、如果用户发现自己的个人或法人信息泄密，尤其是用户账户或“支付账户管理”账户及密码发生泄露，请用户立即联络本网络平台客服，以便我们采取相应措施。</p>
<p>第八条 不可抗力 </p>
<p>因不可抗力或者其他意外事件，使得本协议的履行不可能、不必要或者无意义的，双方均不承担责任。本合同所称之不可抗力意指不能预见、不能避免并不能 克服的客观情况，包括但不限于战争、台风、水灾、火灾、雷击或地震、罢工、暴动、法定疾病、黑客攻击、网络病毒、电信部门技术管制、政府行为或任何其它自然或人为造成的灾难等客观情况。</p>
<p>第九条 保密</p>
<p>双方保证在对讨论、签订、执行本协议中所获悉的属于对方的且无法自公开渠道获得的文件及资料（包括但不限于商业秘密、公司计划、运营活动、财务信息、技术信息、经营信息及其他商业秘密）予以保密。未经该资料和文件的原提供方同意，另一方不得向第三方泄露该商业秘密的全部或者部分内容。但法律、法规、行政规章另有规定或者双方另有约定的除外。</p>
<p>第十条 交易纠纷解决方式</p>
<p>1、本协议及其规则的有效性、履行和与本协议及其规则效力有关的所有事宜，将受中华人民共和国法律管辖，任何争议仅适用中华人民共和国法律；</p>
<p>2、本网络平台有权受理并调处您与其他用户因交易服务产生的纠纷，同时有权单方面独立判断其他用户对您的举报及索偿是否成立，若判断索偿成立，则本网络平台 有权划拨您已支付的担保金或交纳的保证金进行相应偿付。本网络平台没有使用自用资金进行偿付的义务，但若进行了该等支付，您应及时赔偿本网络平台的全部损失，否则本网络平台有权通过前述方式抵减相应资金或权益，如仍无法弥补损失，则本网络平台保留继续追偿的权利。因本网络平台及诚信委员会非司法机关，您完全理解并承认，本网络平台及诚信委员会对证据的鉴别能力及对纠纷的处理能力有限，受理交易纠纷完全是基于您之委托，不保证处理结果符合您的期望，本网络平台有权决定是否参与争议的调处；</p>
<p>3、凡因本协议及其规则发生的所有纠纷，双方可协商解决，若协商不成的，双方同意北京仲裁委员会按其仲裁规则进行仲裁。</p>
<p>第十一条 协议 </p>
<p>您对本协议理解和认同，您即对本协议所有组成部分的内容理解并认同，一旦您使用本服务，您和本公司即受本协议所有组成部分的约束。</p>
<p>第十二条</p>
<p>圆图公司对本服务协议包括基于本服务协议制定的各项规则拥有法律许可范围内的最终解释权。本协议可由本网络平台随时修订，并将修订后的协议公告于本网络平台之上，修订后的条款内容自公告时起生效，并成为本协议的一部分。用户若在本协议修改之后，仍继续使用本网络平台，则视为用户接受和自愿遵守修订后的协议。本网络平台行使修改或中断服务时，不需对任何第三方负责。</p>
		                    </div>
		                </div>
		
		                <!-- 平台服务 ↓ -->
		                <%-- <div role="tabpanel" class="tab-pane fade row-tab-content" id="service">
		                    <div class="row-banner"><img src="<%=ttt%>/images/about_banner_05.jpg"></div>
		                    <div class="row-section">
		                        <h2 class="tit1" style="margin-bottom: 50px;">自由团队旗下拥有 “三大核心服务平台” 和 “3650助梦投资计划”：</h2>
		                        <h2 class="tit2">创投大数据平台</h2>
		                        <p class="text-center">自由团队创投大数据服务致力于成为创业投资领域的Google，汇聚整合创业投资领域的各种信息和数据<br>以公开、透明、共享方式免费提供给所有创业者和投资人，为投资人投前找项目、投中决策、投后管理提供全流程数据支持。</p>
		                        <p class="text-center">目前自由团队已经推出了以产业图谱为核心的第一阶段创投大数据服务<br>包括产业图谱分析、最新投融事件、融资项目列表、投资人列表、投资机构列表、最新收录项目等。</p>
		                        <p class="row-section-btn"><a href="http://www.gofreeteam.com/data" class="btn-outline-default" target="_blank">了解详情</a></p>
		                    </div>
		                    <div class="row-banner"><img src="<%=ttt%>/images/about_banner_06.jpg"></div>
		                    <div class="row-section">
		                        <h2 class="tit2">投融资对接平台</h2>
		                        <p class="text-center">自由团队投融资对接是一个专业高效的免费投融资平台<br>提供优秀创业项目及投资机构信息免费发布，并可通过二度人脉匹配、名校名企、个性化投资偏好等进行专业匹配<br>截止2015年12月，已经帮助170家创业公司，成功融资9亿人民币<br>吸引2000多家入驻投资机构/投资人，创业项目入驻过万。</p>
		                        <p class="row-section-btn"><a href="http://www.gofreeteam.com/startups" class="btn-outline-default" target="_blank">了解详情</a></p>
		                    </div>
		                    <div class="row-banner"><img src="<%=ttt%>/images/about_banner_07.jpg"></div>
		                    <div class="row-section">
		                        <h2 class="tit2">创投活动群平台</h2>
		                        <p class="text-center">自由团队创投活动群是全球首家创投活动平台，提供全网最全、最专业的创业投资精品线下活动的聚合发现，发布推广<br>致力于打造成“创投人士都在用”的活动群平台。</p>
		                        <p class="row-section-btn"><a href="http://www.gofreeteam.com/elite/meetings" class="btn-outline-default" target="_blank">了解详情</a></p>
		                    </div>
		                    <div class="row-banner"><img src="<%=ttt%>/images/about_banner_03.jpg"></div>
		                    <div class="row-section">
		                        <h2 class="tit2">3650助梦投资计划</h2>
		                        <p class="text-center">自由团队3650助梦投资计划主要面向种子天使阶段的创业者，帮助有梦想的人启动项目，每个项目投资10到100万<br>同时帮助这些项目快速对接顶级投资机构解决后续融资<br>对接产业链关键资源解决市场拓展问题，对接127家合作的孵化器提供免费办公场地。</p>
		                        <p class="row-section-btn"><a href="http://www.gofreeteam.com/camps/33" class="btn-outline-default" target="_blank">了解详情</a></p>
		                    </div>
		                </div> --%>
		
		                <!-- 媒体报道 ↓ -->
		                <%-- <div role="tabpanel" class="tab-pane fade row-tab-content" id="media">
		                    <div class="row-banner"><img src="<%=ttt%>/images/about_banner_08.jpg"></div>
		                    <div class="row-section">
		                        <ul class="topic-media-list">
		                            <li>
		                                <div class="media-logo1"></div>
		                                <div class="media-txt">
		                                    <p class="media-txt-link"><a href="http://tech.sina.cn/it/2016-03-31/detail-ifxqxcnr5082006.d.html?vt=4" target="_blank">新浪科技：清华人工智能专家:人工智能领域中美之间无代差</a></p>
		                                    <p>谷歌围棋程序AlphaGo战胜人类，引发了学界和产业界对人工智能及大数据领域的高度关注。在自由团队举办的投融资面对面活动中，中国人工智能学会副理事长黄河燕、清华大学计算机系教授邓志东与驭势科技CEO吴甘沙、图灵机器人创始人俞志晨等学界及业界人士就人工智能发表看法。</p>
		                                </div>
		                            </li>
		                            <li>
		                                <div class="media-logo1"></div>
		                                <div class="media-txt">
		                                    <p class="media-txt-link"><a href="http://tech.sina.com.cn/2016-03-07/doc-ifxqaffy3702893.shtml" target="_blank">新浪科技：“中国VR/AR创投联盟”正式成立</a></p>
		                                    <p>中国VR/AR创投联盟” 在自由团队举办的VR/AR投融资面对面活动上正式宣布成立。本联盟由自由团队联合50多家知名投资机构、产业公司和行业组织成立，致力于构建VR/AR全产业生态网络，服务和扶持VR/AR领域的创新创业，推动产业快速发展。</p>
		                                </div>
		                            </li>
		                            <li>
		                                <div class="media-logo2"></div>
		                                <div class="media-txt">
		                                    <p class="media-txt-link"><a href="http://tech.163.com/16/0331/07/BJFJIDDA00094P40.html" target="_blank">网易科技：人工智能推动互联网向下一个方向演进？</a></p>
		                                    <p>在自由团队联合腾讯众创和启迪之星举办的人工智能／大数据投融资面对面活动上，自由团队创始人崔鹏揭晓新版投融资平台自由团队2.0版，并联合腾讯众筹、清华启迪之星倡议发起“中国人工智能和大数据创投联盟”。</p>
		                                </div>
		                            </li>
		                            <li>
		                                <div class="media-logo3"></div>
		                                <div class="media-txt">
		                                    <p class="media-txt-link"><a href="http://tech.cnr.cn/techit/20160401/t20160401_521762765.shtml" target="_blank">央视网：自由团队联合腾讯、清华启迪之星举办人工智能/大数据专场投融资面对面活动</a></p>
		                                    <p>3月30日，自由团队联合腾讯众创、清华启迪之星，举办人工智能/大数据专场投融资面对面活动。本次活动有超过2000人报名，活动当天共有20多位行业顶级投资人和行业专家、150家知名投资机构、80个优秀创业项目（大部分已经获得一轮机构投资）、35家主流媒体参加。</p>
		                                </div>
		                            </li>
		                            <li>
		                                <div class="media-logo4"></div>
		                                <div class="media-txt">
		                                    <p class="media-txt-link"><a href="http://business.sohu.com/20160331/n442930001.shtml" target="_blank">搜狐：投资人告诉你未来3到5年人工智能有多“凶猛”</a></p>
		                                    <p>在谷歌Alpha Go与李世石对弈之前，Facebook曾经就挑战围棋的程序称自己也可以利用AI实现，且扎克伯格已经明确表示AI将是Facebook未来发展的核心之一。</p>
		                                </div>
		                            </li>
		                            <li>
		                                <div class="media-logo5"></div>
		                                <div class="media-txt">
		                                    <p class="media-txt-link"><a href="http://epaper.ynet.com/html/2016-04/02/content_190555.htm?div=-1" target="_blank">北青报：自由团队倡议发起：人工智能创投联盟</a></p>
		                                    <p>日前，在自由团队联合腾讯众创和清华启迪之星举办的人工智能/大数据专场投融资面对面活动上，包括中国人工智能学会副理事长黄河燕、清华大学计算机系教授邓志东与驭势科技CEO吴甘沙、图灵机器人创始人俞志晨等众多嘉宾围绕该话题展开讨论。</p>
		                                </div>
		                            </li>
		                            <li>
		                                <div class="media-logo6"></div>
		                                <div class="media-txt">
		                                    <p class="media-txt-link"><a href="http://www.donews.com/company/201603/2919140.shtm" target="_blank">DoNews：“中国VR/AR创投联盟”正式成立，并发布VR/AR创投行业全名单</a></p>
		                                    <p>2016年3月2日下午2:00， "中国VR/AR创投联盟" 在自由团队和腾讯众创合作举办的VR/AR投融资面对面活动上正式宣布成立！本联盟由自由团队联合50多家知名投资机构、产业公司和行业组织成立，致力于构建VR/AR全产业生态网络，服务和扶持VR/AR领域的创新创业，推动产业快速发展。</p>
		                                </div>
		                            </li>
		                        </ul>
		                    </div>
		                </div> --%>
		
		                <!-- 联系我们 ↓ -->
		                <div role="tabpanel" class="tab-pane fade row-tab-content active in" id="_contact">
		                    <div class="row-section">
		                        <h2 class="tit1">联系方式</h2>
		                        <p class="text-center no-indent">拱墅区万达商业中心 3 幢 3 单元 713 室<br>邮编：310000</p>
		                        <hr class="hr-about">
		                        <h2 class="tit2">服务 / 合作</h2>
		                        <p class="text-center">提交商业计划：admin@gofreeteam.com</p>
		                    </div>
		                </div>
		
		                <!-- 友情链接 ↓ -->
		                <%-- <div role="tabpanel" class="tab-pane fade row-tab-content" id="links">
		                    <div class="row-banner"><img src="<%=ttt%>/images/about_banner_09.jpg"></div>
		                    <div class="row-section">
		                        <ul class="about-links">
		                            <li><a href="http://www.ucloud.cn/" target="_blank">UCloud</a></li>
		                        </ul>
		                    </div>
		                </div> --%>
		
		            </div>
		
		        </div>
		    </div>
		</div>
		
		<jsp:include page="footer.jsp"/>
		<script type="text/javascript">
			$(function(){
				var href = location.href;
				$(".nav-tabs li a").each(function(i,item){
					var attr = $(item).attr("aria-controls");
					if(href.indexOf(attr)>0){
						$(item).click();
						$(item).parent().addClass("active").siblings().removeClass("active");
					}
				});
			});
		</script>
	</body>

</html>