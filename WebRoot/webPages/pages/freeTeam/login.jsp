<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String staticFilesPath = "//static.gofreeteam.com/";
%>
<script type="text/javascript" src="webPages/pages/tianTianTou/pageJs/register.js"></script>
<script src="webPages/js/md5.js"></script>
<script type="text/javascript">
	function showLogin(text){
		$(".loginModal2").fadeIn("slow");
		$("#username").focus();
	}
	
	function closeLogin(){
		$(".loginModal2").fadeOut("slow");
	}
	
	function EnterSubmit(form1){
		var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
	 	if (event.keyCode == 13){  
	 		form1.submit();
	 	}  
	}
	
	$(function(){
		var form1 = document.getElementById("login_form");
		if(form1){
			form1.onsubmit = function(){
				var nv = $(form1).find("input[needvalicate=true]");
				$(nv).each(function(i,item){
					$(item).blur();
				});
				var e = $(form1).find(".has-error");
				if(e.length>0){
					return false;
				}else{
					var pwd = document.getElementById("pwd").value;
					var md5_pwd = MD5(pwd);
					$("#pwd").val(md5_pwd);
					return true;
				}
			}
			
			EnterSubmit(form1);
		}
		$("#username").click().focus();
	});
	
	
	
</script>

 <div id="ordLogin" class="row" style="display: ;">
     <!-- <h4 class="modal-subtitle"><a class="f-right tog-login" onclick="$('#ordLogin').hide();$('#smsLogin').show();">用户登录</h4> -->
     <form class="form-horizontal" id="login_form" method="POST" action="login.do" novalidate="novalidate">
         <div class="form-group">
             <label class="col-sm-3 control-label">邮箱/手机号：</label>
             <div class="col-sm-9">
                 <input type="text" id="username" name="email" value="${email}" needvalicate=true class="form-control" valicate="_required _minlen=6 _emailOR_tel" maxlength="40" class="form-control" placeholder="请输入邮箱或者手机号" aria-required="true">
             </div>
         </div>
         <div class="form-group">
             <label class="col-sm-3 control-label">密 码：</label>
             <div class="col-sm-9">
                 <input type="password" id="pwd" name="pwd" value="${pwd}" class="form-control" valicate="_required _minlen=6" id="inputGroupSuccess2"  placeholder="密码">
             </div>
         </div>
         <div class="form-group">
             <label class="col-sm-3 control-label">&nbsp;</label>
             <div class="col-sm-9">
                 <div class="checkbox">
                 	<input id="remeberMe_cb" type="checkbox" onchange="remeber(this);" class="needSetVal" value="1" /> 记住我
<input id="remeberMe_vl" name="remeberMe" type="hidden" value="${remeberMe}" />
                     <a class="f-right" href="toChangePwd.do">忘记密码？</a>
                 </div>
             </div>
         </div>
         <p class="text-warning"></p>
         <div class="form-group">
             <div class="col-sm-12 text-center">
                 <button type="submit" class="btn btnPrimary" style="width: 258px;height: 42px;">登录</button>
             </div>
         </div>
     </form>
 </div>
 <div id="smsLogin" class="row" style="display: none;">
     <!-- <h4 class="modal-subtitle"><a class="f-right tog-login" onclick="$('#ordLogin').show();$('#smsLogin').hide();"><em class="important">普通方式登录</em></a>用户登录</h4> -->
     <form class="form-horizontal" id="_form_login_sms" method="POST" action="/api/mobile/login" novalidate="novalidate">
         <div class="form-group">
             <label class="col-sm-2 control-label">手机号码</label>
             <div class="col-sm-10">
                 <input type="number" name="account" required="true" digits="true" rangelength="11,11" class="form-control" placeholder="请输入注册的手机号" aria-required="true">
             </div>
         </div>
         <div class="form-group" style="display:none">
             <label class="col-sm-2 control-label">验证码</label>
             <div class="col-sm-10">
                 <span class="vercode-img"><img src="" title="点击刷新"></span> <!-- 验证码 -->
                 <input type="hidden" name="captchaKey" required="true" aria-required="true">
                 <input type="text" name="captchaCode" required="true" rangelength="4,4" class="form-control" placeholder="请输入右侧的验证码" aria-required="true">
             </div>
         </div>
         <div class="form-group">
             <label class="col-sm-2 control-label">短信验证码</label>
             <div class="col-sm-10">
                 <a class="vercode" href="javascript:void">获取验证码</a>
                 <span class="vercode" style="display: none;"><em><i>60</i>秒后重新获取</em></span>
                 <input type="hidden" name="trId">
                 <input type="number" name="smsCode" digits="true" required="true" rangelength="4,6" class="form-control" placeholder="短信验证码" aria-required="true">
             </div>
         </div>
         <p class="text-warning" style="display:none"></p>
         <div class="form-group" style="margin-top: 30px;">
             <label class="col-sm-2 control-label">&nbsp;</label>
             <div class="col-sm-10 text-left">
                 <button type="submit" class="btn btnPrimary">登录</button>
             </div>
         </div>
     </form>
 </div>
