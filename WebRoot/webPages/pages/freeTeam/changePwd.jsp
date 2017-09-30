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
		<title>修改密码-自由团队-IT产品开发外包平台</title>
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
		<link rel="stylesheet" href="<%=basePath %>webPages/css/qiao.css" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/styleV2.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		
		
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/controller/index_v2.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/js/js_valicate.js"></script>
		<script src="<%=basePath%>webPages/js/md5.js"></script>
		<script src="<%=basePath%>/webPages/js/qiao.js"></script>
		<style type="text/css">
			.p8{padding: 8px;}.m3{margin: 3px;}
			.text-warning{text-align: center;}
			.tooltip-inner {background-color: #D9534F;}.tooltip.top .tooltip-arrow {left: 0px;border-top-color: #D9534F;}
			.form-control-feedback{margin-top: 2px;margin-right: 10px;}
		</style>
	</head>

	<body>
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		<jsp:include page="errorInfo.jsp"></jsp:include>
		<div id="header">
			<div class="navbar navbar-default navbar-fixed-top">
				<div class="container-fluid">
					<div class="navbar-header" style="width:220px;">
						<a class="navbar-brand" href="test.do">
							<div style="display: inline-block;float: left;margin-right: 10px;">
								<img class="logo-mini" alt="自由团队" src="<%=basePath%>webPages/images/logo.png">
							</div>
							<div style="display: inline-block;float: right;">
								<span class="">自由团队 </span><br/>
								<small>gofreeteam.com</small>
							</div>
						</a>
					</div>
					<span style="width: 120px;font-size: 24px;font-weight: bold;font-family: '宋体';margin: 10px 0px;display: inline-block;">找回密码</span>
					<div style="display: inline-block;float: right;padding: 10px;">
						<a href="test.do">返回主页</a>
					</div>
				
				</div>
			</div>
		</div>
		<div style="height: 65px;"></div>
		<div id="wrapper">
		    <div style="background: white;height: 700px;padding-top: 5%;">
		    	<form id="changePwdForm" action="changePwd.do" method="post">
		    		<div id="changePwd1" style="width: 500px;margin: 0px auto;background: white;padding: 50px 0px;border: 1px lightgrey solid;" class="clearfix">
			    		<div id="userIdDiv">
			    			<div class="col-xs-4 text-center">
			    				<label class="p8">账号</label>
			    			</div>
			    			<div class="form-group col-xs-8">
			    				<input type="text" class="form-control" id="username" name="username" needvalicate=true valicate="_required _minlen=8 _maxlen=20 _emailOR_tel" placeholder="邮箱/手机号"/>
			    			</div>
			    		</div>
			    		
			    		<div>
			    			<div class="col-xs-4 text-center">
			    				<label class="p8">验证码</label>
			    			</div>
			    			<div class="form-group col-xs-5">
			    				<input type="text" class="form-control" maxlength="6" id="code" name="code" needvalicate=true valicate="_required _n"  placeholder="请输入验证码"/>
			    			</div>
			    			<div class="col-xs-3">
			    				<input type="button" id="svc" class="mybtn m3" second="60" onclick="sendVerifyCode(this);" value="获取验证码"/>
			    			</div>
			    		</div>
			    		<div>
			    			<div class="col-xs-12 text-center">
			    				<hr/>
			    				<input class="mybtn-primary" onclick="nextStep();" value="下一步">
			    			</div> 
			    		</div>
			    	</div>
			    	
			    	
			    	<div id="changePwd2" style="display: none;width: 500px;margin: 0px auto;background: white;padding: 50px 0px;border: 1px lightgrey solid;" class="clearfix">
			    		<div>
			    			<div class="col-xs-4 text-center">
			    				<label class="p8">密码</label>
			    			</div>
			    			<div class="form-group col-xs-8">
			    				<input id="pwd" name="pwd" type="password" needvalicate="true" valicate="_required _minlen=6 _maxlen=18" class="form-control" placeholder="6-18位，可由数字字母特殊字符组成"/>
			    			</div>
			    		</div>
			    		
			    		<div>
			    			<div class="col-xs-4 text-center">
			    				<label class="p8">确认密码</label>
			    			</div>
			    			<div class="form-group col-xs-8">
			    				<input id="pwd2" name="pwd2" type="password" needvalicate="true" valicate="_required _minlen=6 _maxlen=18 _equals=pwd" class="form-control" placeholder="请填写重复密码"/>
			    			</div>
			    		</div>
			    		<div>
			    			<div class="col-xs-12 text-center">
			    				<hr/>
			    				<a class="mybtn-primary" onclick="submitNewPwd();">提交新密码</a>
			    			</div>
			    		</div>
			    	</div>
		    	
		    	</form>
		    	
		    	<div class="container" style="margin-top: 100px;">
					<div class="footer-bottom">
						<p>© 2014 - 2016 gofreeteam.com. 杭州圆图网络技术有限公司版权所有</p>
						<p><a href="http://www.miibeian.gov.cn/" target="_blank">浙ICP备15034351号-1</a></p>
						<p>
					 		<a target="_blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010502002048" style="display:inline-block;text-decoration:none;height:20px;line-height:20px;"><img src="<%=basePath%>webPages/images/beian.png" style="float:left;"/><span style="float:left;height:20px;line-height:20px;margin: 0px 0px 0px 5px; color:#939393;">浙公网安备 33010502002048号</span></a>
					 	</p>
					</div>
				</div>
		    </div>
		    
		</div>
		
		
		<script type="text/javascript">
			var form1_errorMsg = {
				//注册
				'pwd2':{'_required':'密码不能为空。','_minlen':'密码最小长度为6位。','_maxlen': '密码最长18位','_equals':'两次密码输入不相同，请重新输入'},
				'code':{'_required':'验证码不能为空','_n': '验证码为数字'},
				//登录
				'username':{'_required':'用户名不能为空。','_emailOR_tel':'邮箱/电话格式不正确。','_minlen':'用户名最少为8位','_maxlen':'用户名最长为20位'},
				'pwd':{'_required':'密码不能为空。','_minlen':'密码最小长度为6位。','_maxlen': '密码最长18位'}
			};
			
			addValicate(form1_errorMsg);
			
			function nextStep(){
				if(formAjaxSubmitCheck("changePwd1")){
					var username = $("#username").val();
					var code = $("#code").val();
					$.post("checkEmailOrSms.do",{"userId": username,"code": code},function(data){
						if(data.msgNo == "1"){
							bootstrapQ.msg({
								msg: "验证码校验成功！",
								type: "success",
								time: 2000
							});
							$('#changePwd1').hide(function(){$('#changePwd2').show();});
						}else{
							bootstrapQ.msg({
								msg: "验证码校验失败！",
								type: "danger",
								time: 2000
							});
						}
						
					},"json");
					
					
				}
				
			}
			
			//发送邮件或者短息
			function sendVerifyCode(){
				var dom = $("#svc");
				if(formAjaxSubmitCheck("userIdDiv")){
					$(dom).attr("disabled","disabled");
					$(dom).attr("second","60");
					remainTime(dom);
					var userId = $("#username").val();
					
					var callback = function(data){
						showAjaxMsg(data);
					}
					
					$.post("sendEmailOrSmsForChangePwd.do",{"userId": userId}, callback, "json");
				}else{
					return;
				}
			}
			
			function remainTime(){
				var dom = $("#svc");
				var i = $(dom).attr("second");
				$(dom).val(--i + "s"); 
				$(dom).attr("second",i);
			    var t = setTimeout(remainTime,1000);
			    if(i==0){
			    	clearTimeout(t);
			    	$(dom).removeAttr("disabled");
			    	$(dom).val("获取验证码");
			    }
			} 
			
			
			function submitNewPwd(){
				var pwd = $("#pwd").val();
				pwd = MD5(pwd);
				var userId = $("#username").val();
				var code = $("#code").val();
				$.ajax({
					url: "changePwd.do",
					dataType: "json",
					data: {"userId": userId, "pwd": pwd,"code": code},
					success: function(data){
						if(data.msgNo=="1"){
							bootstrapQ.msg({
								msg: "密码修改成功,稍后将自动跳转到首页。",
								type: "success",
								time: 2000
							});
							setTimeout(function(){
								window.location.href = "tologin.do";
							},1000)
						}else{
							bootstrapQ.msg({
								msg: "密码修改失败！",
								type: "success",
								time: 2000
							});
						}
					},
					error: function(data){
						bootstrapQ.msg({
							msg: "可能发生了网络错误，请稍后重试！",
							type: "success",
							time: 2000
						});
					}
					
				});
			}
		</script>
	</body>

</html>