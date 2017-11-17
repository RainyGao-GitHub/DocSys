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
	function showRegister(text){
		$(".registerModal").fadeIn("slow");
		$("#realName").focus();
	}
	
	function closeRegister(){
		$(".registerModal").fadeOut("slow");
	}
	
	function EnterSubmit(form1){
		var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
	 	if (event.keyCode == 13){  
	 		form1.submit();
	 	}  
	}
	
	$(function(){
		//注册身份
		$("ul.sf_choose>li").on("click",function(e){
			$(this).addClass("active").siblings("li").removeClass("active");
			$(this).find(":input")[0].checked = true;
			var inputs = $(this).siblings().find(":input");
			$(inputs).each(function(i,item){
				item.checked = false;
			});
			
			var $cb = $(this).find("input[type='checkbox']");
			var value = $cb.val();
			if(value=='1'){
				$("#nickNameText").text("昵称");
				$("#realName").attr("placeholder","请输入昵称");
			}else if(value=='2'){
				$("#nickNameText").text("团队名称");
				$("#realName").attr("placeholder","请认真填写，设置后无法修改");
			}else{
				$("#nickNameText").text("企业名称");
				$("#realName").attr("placeholder","请认真填写，设置后无法修改");
			}
			
		});
		$("#realName").click().focus();
	});
	
	
	
</script>

                    <form class="form-horizontal" id="registForm" method="POST" action="registUser.do">
                        <div class="form-group">
                            <label class="col-sm-2 control-label" id="nickNameText">昵称</label>
                            <div class="col-sm-10">
                                <input type="text" id="realName" name="realName" type="text" needvalicate="true" valicate="_required _minlen=2 _maxlen=32 _remote=checkNickNameRepeat()"  class="form-control" placeholder="请输入昵称">
                            </div>
                        </div>
                        <div class="form-group" id="userIdDiv">
                            <label class="col-sm-2 control-label">邮箱/手机</label>
                            <div class="col-sm-10">
                                <input id="email" name="email" placeholder="请填写您的有效邮箱/手机，以便找回密码以及验证" type="text" needvalicate="true" valicate="_required _emailOR_tel _minlen=6 _repeat=checkReName.do?username" maxlength="40" class="form-control" value=""/>
                            </div>
                        </div>
                        <div class="form-group">
                        	<label class="col-sm-2 control-label">验证码</label>
                        	<div class="col-sm-7">
                        		<input type="text" class="form-control" maxlength="6" id="code" name="code" needvalicate=true valicate="_required _num"  placeholder="请输入验证码"/>
                        	</div>
                        	<div class="col-sm-3">
                        		<input type="button" id="svc" class="mybtn-primary m3" second="60" onclick="sendVerifyCode(this);" value="获取验证码"/>
                        	</div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 control-label">所在地</label>
                            <div class="col-sm-10">
                                <div id="pca" class="pca" class="align-left">
									<select id="province" name="provinceCode" onchange="queryCity(this);" style="width: 32%;">
										<option value="-1">请选择</option>
									</select>
									<select id="city" name="cityCode" onchange="queryArea(this);"  style="width: 32%;">
										<option value="-1">请选择</option>
									</select>
									<select id="area" name="areaCode" style="width: 32%;">
										<option value="-1">请选择</option>
									</select>
								</div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 control-label">密 码</label>
                            <div class="col-sm-10">
                                <input id="pwdForReg" name="pwd" type="password" needvalicate="true" valicate="_required _minlen=6" class="form-control" placeholder="6-18位，可由数字字母特殊字符组成"/>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 control-label">重复密码</label>
                            <div class="col-sm-10">
                                <input id="pwd2" name="pwd2" type="password" needvalicate="true" valicate="_required _minlen=6 _equals=pwdForReg" class="form-control" placeholder="请填写重复密码"/>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="col-sm-2 control-label">注册身份</label>
                            <div class="col-sm-10">
                                <ul class="sf_choose">
                                	<li class="active">个人<input type="checkbox" class="hidden"  checked="checked" name="type" value="1"/></li>
                                	<li>团队<input type="checkbox" class="hidden" name="type" value="2"/></li>
                                	<li>企业<input type="checkbox" class="hidden" name="type" value="3"/></li>
                                	
                                	<div class="clear"></div>
                                </ul>
                            </div>
                        </div>
                        <div class="form-group">
                            <div class="col-sm-12 text-center">
                                <input onclick="canSubmit(this);" type="checkbox">
									<span class="p5">我已阅读并同意<a target="_blank" href="<%=basePath %>/pageTo.do?p=contactUs#useAgreement">《自由团队注册条款》</a></span>
								</input>
                            </div>
                        </div>
                        <p class="text-warning" style="display: none;">请输入姓名</p>

                        <div class="form-group">
                            <div class="col-sm-12 text-center">
                            	<input id="submitBtn" type="submit" class="hidden"/>
                                <button  id="submit" type="button" class="btn btnPrimary" onclick="checkCode();" style="width: 288px;height: 42px;" disabled>立即注册</button>
                            </div>
                        </div>
                    </form>
