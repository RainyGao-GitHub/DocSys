<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String staticFilesPath = "//static.gofreeteam.com/";
%>

<link rel="stylesheet" href="<%=basePath%>webPages/css/jqpagination.css" />
<link rel="stylesheet" href="<%=basePath%>webPages/pages/freeTeam/css/freeteam.css" />
<link href="<%=basePath%>webPages/static/font-awesome/css/font-awesome.min.css" rel="stylesheet">
<script type="text/javascript" src="<%=basePath%>webPages/bootstrap/js/bootstrap.min.js" ></script>
<script src="<%=basePath%>webPages/js/jquery.jqpagination.js"></script>
<script type="text/javascript" src="<%=basePath%>webPages/js/message.js" ></script>
<script type="text/javascript" src="<%=basePath%>webPages/js/js_valicate.js"></script>
<script type="text/javascript" src="<%=basePath%>/webPages/js/qiao.js"></script>
<script type="text/javascript" src="<%=basePath%>/webPages/js/web.js"></script>
<script type="text/javascript" src="<%=basePath%>/webPages/js/jquery.ellipsis.js"></script>
<style type="text/css">
	.p0m0{padding:0px;margin: 0px;} .mr10{margin-right: 10px;} .p0_10{padding:0px 10px;} .p10{padding:10px;}
	.pl10{padding-left: 10px}.p5{padding: 5px}.m2{margin:2px;}.m5{margin: 5px;}
	.thinBorder{border: 1px solid rgba(0,0,0,0.1);}
	.msgDiaLog {height: 500px;overflow-y: scroll;}
	.pinfo {border: 1px solid lightgrey;padding: 10px;border-radius: 5px;}
	.msg_title {font-family: '楷体';font-size: 12px;}
	.msg_content{font-family: "宋体";font-size: 12px;}
	#msgDiaLog p {margin-bottom: 2px;}
	.main_msg .msg_img {border-right: solid 2px darkmagenta;}.re_msg .msg_img {border-left: solid 2px dodgerblue;}

	.form-control-feedback {
	    position: inherit;
	    float: right;
	    margin-top: -35px;
	    top: 0;
	    right: 0;
	    z-index: 2;
	    display: block;
	    width: 34px;
	    height: 34px;
	    line-height: 34px;
	    text-align: center;
	    pointer-events: none;
	}

</style>

<style type="text/css">
	/* 自定义toolTip 生成ToolTip方法写在js_valicate.js里  */
	.ft_toolTip{max-width: 300px;position: absolute;top: -40px;text-align: center;float: left; margin: 0px 10px;}
	.ft_toolTip .t_content{background: rgb(214,54,62);color:white;padding: 2px 10px;font-size: 12px;width: 100%;height: 100%;border: 2px solid rgb(232,32,48);line-height: 2;border-radius: 5px;}
	.ft_toolTip .t_jt{position: absolute;width: 20px;height: 20px;bottom: -20px;left: 40%;}
	.t_jt *{ display:block; border-width:8px; position:absolute; border-style:solid dashed dashed dashed; font-size:0; line-height:0; }
	.t_jt em{border-color:rgb(232,32,48) transparent transparent;}
	.t_jt span{border-color:rgb(214,54,62) transparent transparent; top:-4px;}
	
	.greenBorder{border: 1px solid green !important;}.redBorder{border: 1px solid red !important;}
	
	
	/* login css */
	.loginModal{position: fixed;left: 0px; top:0px;background-color: rgba(0,0,0,0.5);width:100%;height: 100%;}
	.loginModal .modal-dialog{width:900px !important;}
	.loginModal .vercode{position: absolute;top: 1px;right: 1px;width: 110px;text-align: center;line-height: 36px;background-color: #fff;height: 36px;}
	.modal-subtitle{text-align: left;margin-bottom: 20px;border-bottom: 1px #eee solid;line-height: 44px;}
	body{
	    font: 14px / 1.5 "Helvetica Neue",Helvetica,Arial,"Microsoft Yahei","Hiragino Sans GB","Heiti SC","WenQuanYi Micro Hei",sans-serif;
	    -moz-osx-font-smoothing: grayscale;
	    -webkit-font-smoothing: antialiased;
	}
	.col-sm-10 .btnDefault {width: 288px;height: 42px;background-color: #f9f9f9;color: #f80;}
	.col-sm-10 .btnPrimary {width: 288px;height: 42px;}
	.modal-content .checkbox {text-align: left;padding-left: 20px;}
	.fa-remove:before, .fa-close:before, .fa-times:before {content: "\f00d";}
	.modal-content .fa-close {
	    position: absolute;
	    top: 0;
	    right: 0;
	    padding: 10px;
	    color: #999;
	    font-size: 16px;
	    cursor: pointer;
	    z-index: 999;
	}
	.clear{clear: both;}
	.text-warning{text-align: center;}
	.tooltip-inner {background-color: #D9534F;}.tooltip.top .tooltip-arrow {left: 0px;border-top-color: #D9534F;}
	select{height: 36px; background: white;border: 1px lightgray solid;} option{line-height: 1.5em;}
	.sf_choose li{width: 30%;float: left;padding: 6px 10px; border: 1px lightgray solid;text-align: center;margin-right: 3%;}
	.sf_choose li.active{background: gold;border:gray 1px solid;}.sf_choose li:hover{background: rgb(255,218,68);}
	/* login css end */
	.mybadge{position: absolute !important;background: red !important;color: white !important;top: 7px !important;right: -5px !important;}

	/* 保存的遮罩start 防止多次点击 */
	.unable{position: fixed;width: 100%; height: 100%;background: rgba(255,255,255,0.5);z-index: 10000;display: none;}
	.unable .unableTip{margin: 20% 50%;font-size: 14px;font-family: '楷书';width: 50px;height: 50px;color: #f83;}
	.loading{background: url("http://localhost:80/SSM//webPages/images/loading2.gif") no-repeat center center;
		width: 30px;height: 30px;margin: 15px;display:inline-block;background-size: 30px 30px;}

</style>
<script type="text/javascript">
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
	
	function queryNoReadMsgCnt(){
		var callback = function(data){
			var badge = $("#innerEmail2").find(".badge");
			$(badge).remove();
			try {
				if(parseInt(data.obj)>0){
					//$("#innerEmail2").attr("style","border-color:rgba(212, 36, 11,0.5);");
					$("#innerEmail2").removeClass("btn-default").addClass("btn-danger");
					$("#innerEmail2").append("<span class='badge mybadge'>"+data.obj+"</span>");
				}
			} catch (e) {
				console.log(e.toString());
			}
			
		}
		
		$.post('queryNoReadMsgCnt.do',null,callback,'json');
	}
	queryNoReadMsgCnt();
	
	function sendValiEmail(email){
		var flag = confirm("确定要给"+email+"邮箱发送验证邮件么？");
		if(flag){
			var callback = function(data){
				alert(data.msgNo+":"+data.obj);
				if(data.msgNo=="1"){
					
				}
			}
			$("sendVerfiEmail.do",{"userEmail":email,"isAjax":true},callback,"json");
		}
	}
	
	function showLoginPanel(){
		bootstrapQ.dialog({
			title: '登录DocSys',
			url: 'pageTo.do?p=web/login.html',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: false
		}, null)
	}
	
	function showRegisterPanel(){
		bootstrapQ.dialog({
			url: 'pageTo.do?p=web/register.html',
			title: '注册',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: false
		}, null)
	}
	
	function unableDbClick(){
		var u = $("#unableDbClick");
		if(u.css("display")=="none"){
			u.show();
		}else{
			u.hide();
		}
	}
	
	
</script>
<div id="unableDbClick" class="unable">
	<div class="unableTip">
		<i class=" loading" ></i><span>loading...</span>
	</div>
</div>

<div id="header">
	<div class="navbar navbar-default navbar-fixed-top">
		<div class="container-fluid">
			<div class="navbar-header" style="width:220px;">
				<a class="navbar-brand" href="/DocSystem"><i class="fa fa-paper-plane"></i> DocSys</a>
			</div>
			<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
				<ul class="nav navbar-nav navbar-right">
				    <li id="userImgDiv" style="display:none"><img id="userImg" name="userImg" width="40px" height="40px" src="images/default/defaultHeadPic.png" class="img-circle m5"/></li>
					<li id="userInfoDiv" style="display:none">
							<a href="" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false"><span>Rainy</span><span class="caret"></span></a>
							<ul class="dropdown-menu" role="menu">
								<li><a href="/DocSystem/pageTo.do?p=webPages/pages/freeTeam/myHostPage.jsp">我的主页</a></li>
								<li><a href="/DocSystem/pageTo.do?p=webPages/pages/freeTeam/myHostPage.jsp&tohref=myOrder">仓库管理</a></li>
								<li><a href="/DocSystem/pageTo.do?p=webPages/pages/freeTeam/myHostPage.jsp&tohref=myFriends">我的好友</a></li>
								<li><a href="/DocSystem/pageTo.do?p=webPages/pages/freeTeam/myHostPage.jsp&toHref=myInfo">个人设置</a></li>
								<li><a onclick="logout()">退出登录</a></li>
							</ul>
					</li>
                    <li id="loginBtn">
                        <a onclick="showLoginPanel()"  title="用户登录">登录</a>
                    </li>
				</ul>
			</div>
		</div>
	</div>
</div>

<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
<div id="msgDiaLog" class="p0_10 hidden">
	<div>
  		<div class="jqPagination fRight p0m0 mr10">
		  <a href="#" class="first" data-action="first">&laquo;</a>
		  <a href="#" class="previous" data-action="previous">&lsaquo;</a>
		  <input type="text" readonly="readonly" data-max-page="40" />
		  <a href="#" class="next" data-action="next">&rsaquo;</a>
		  <a href="#" class="last" data-action="last">&raquo;</a>
		</div>
		<script type="text/javascript">
			$(".jqPagination>a").bind('dbclick',function(e){
				console.log("you click double.");
			});
		</script>
		<div class="clear"></div>
 		</div>
  	<div id="msgContent" class="pinfo p5 m5 msgDiaLog ">
  		<div class="main_msg thinBorder p5 m2">
  			<table>
  				<tr>
  					<td style="width:62px;" class="msg_img p5" valign="top">
  						<img width="50px" height="50px;" class="img-circle" src="../images/firstPageImg/head.png" />
  					</td>
  					<td style="width:700px;" class="pl10">
  						<p class="msg_title">
  							<big>系统</big>(2015-8-14 09:48:23)
  						</p>
  						<p class="msg_content pl10">
  							欢迎来到DocSys
  						</p>
  					</td>
  					<!--<td style="width:100px;" class="p10">
  						<div class="msg_option fRight">
 								<a href="#" class="btn btn-default">回复</a>
 							</div>
 							<div class="clear"></div>
  					</td>-->
  				</tr>	
  				
  			</table>
  		</div>
  		<div class="re_msg  thinBorder p5 m1">
  			<table>
  				<tr>
  					<td style="width:700px;" class="pr10">
  						<p class="msg_title fRight">
  							<big><a>詹俊鹏</a></big>(2015-8-14 09:48:23)
  						</p>
  						<div class="clear"></div>
  						<p class="msg_content pl10 fRight">
  							测试回复
  						</p>
  						<div class="clear"></div>
  					</td>
  					<td style="width:62px;" class="msg_img p5" valign="top">
  						<img width="50px" height="50px;" class="img-circle" src="../images/firstPageImg/head.png" />
  					</td>
  					<!--<td style="width:100px;" class="p10">
  						<div class="msg_option fRight">
 								<a href="#" class="btn btn-default">回复</a>
 							</div>
 							<div class="clear"></div>
  					</td>-->
  				</tr>	
  				
  			</table>
  		</div>
  		
  	</div>
  	<div id="reply" align="center" style="margin-top: 3px;">
  		<div style="width:90%;padding-left:5px;" class="fLeft">
  			<input id="input_msgContent" placeholder="请输入消息，最多200字" maxlength="200" type="text" class="form-control"/>
  		</div>
  		<div style="width:10%" class="fLeft">
  			<a href="javascript:void(0)" class="btn btn-default" onclick="addMsg();">发送</a>
  		</div>
  		<input type="hidden" id="msg_toId" value=""/>
  		<div class="clear"></div>
  	</div>
  	<input type="hidden" id="hidUserId" value="${freeteam_user.id}"/>
  	<input type="hidden" id="hidUserName" value="${freeteam_user.nickName}"/>
  	<input type="hidden" id="hidType" value="${freeteam_user.type}"/>
  	<input type="hidden" id="hidShowUserInfo" value="${showInfo}"/>
  	<input type="hidden" id="ctx" value="<%=basePath%>"/>
</div>
<jsp:include page="errorInfo.jsp"></jsp:include>
