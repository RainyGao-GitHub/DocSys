$(function(){
	var form1_errorMsg = {
		//注册
		'email':{'_required':'账号不能为空。','_emailOR_tel':'邮箱/电话格式不正确。','_minlen':'账号长度最少为6位','_repeat':'此账号已注册'},
		'code':{'_required':'验证码不能为空','_num': '验证码为数字'},
		'pwdForReg':{'_required':'密码不能为空。','_minlen':'密码最小长度为6位。'},
		'pwd2':{'_required':'密码不能为空。','_minlen':'密码最小长度为6位。','_equals':'两次密码输入不相同，请重新输入'},
		'realName':{'_required':'名称不能为空','_minlen':'用户名最小长度为2位。','_maxlen':'用户名最大长度为32位。'},
		
		//登录
		'username':{'_required':'用户名不能为空。','_emailOR_tel':'邮箱/电话格式不正确。','_minlen':'用户名最少为8位','_maxlen':'用户名最长为20位'},
		'pwd':{'_required':'密码不能为空。','_minlen':'密码最小长度为6位。'}
	};
	
	addValicate(form1_errorMsg);
	
	//为所有form表单输入框添加工具提示并初始化
	$("input.form-control").attr('data-toggle',"tooltip");
	pcaId = "pca"; //定义在commonjs中
	queryProvince();
	if(document.getElementById("registForm")){
		document.getElementById("registForm").onsubmit = function(){
			
			var nv = $("#registForm").find("input[needvalicate=true]");
			$(nv).each(function(i,item){
				$(item).blur();
			});
			var e = $("#registForm").find(".has-error");
//			alert($('#province option:selected').text());
			if(e.length>0){
				return false;
			}else{
				var pwd = document.getElementById("pwdForReg").value;
				var md5_pwd = MD5(pwd);
				$("#pwdForReg").val(md5_pwd);
				return true;
			}
			
			
		}
	}
	
	
})

function canSubmit(dom){
	if(dom.checked) {
		$("#submit").attr('disabled',false);
	}
	else {
		$("#submit").attr('disabled',true);
	}
}


function setBusitype(){
	var c = $("#busiType").children();
	$(c).remove();
	$(main_menu).each(function(i,item){
		$("#busiType").append("<option value='"+item[0]+"'>"+item[1]+"</option>");
	});
}

function setBusiType2(dom){
	var bt1 = $(dom).val();
	var c = $("#busiType2").children();
	$(c).remove();
	
	$(second_menu).each(function(i,item){
		if(item[0]==bt1){
			$("#busiType2").append("<option value='"+item[1]+"'>"+item[2]+"</option>");
		}
	});
}

function initCheckBox(){
	var c = $("input[name='type']");
	$(c).bind('change',function(e){
		console.log(this.value);
		$(c).each(function(i,item){
			var ci = $(c)[i];
			ci.checked = false;
		});
		this.checked = true;
		if(this.value=="1"){
			showPersonalRegister();
		}else if(this.value=="2"){
			showWorkRoomRegister();
		}else if(this.value=="3"){
			showCompanyRegister();
		}
	});
	if(isNaN(this.value)){
		c[0].checked = true;
		$(c[0]).change();
	}
}

function showPersonalRegister(){
	$("#realName_label").text("真实姓名");
	$("#address_tr").hide();
	$("#hostUrl_tr").hide();
	$("#contact_tr").hide();
	$("#conTel_tr").hide();
	
	$("#partRole_tr").show();
	$("#status_tr").show();
	$("#busiType_tr").show();
}

function showWorkRoomRegister(){
	$("#realName_label").text("团队名称");
	$("#address_tr").show();
	$("#hostUrl_tr").hide();
	$("#contact_tr").show();
	$("#conTel_tr").show();
	
	
	$("#partRole_tr").hide();
	$("#status_tr").hide();
	$("#busiType_tr").hide();
}

function showCompanyRegister(){
	$("#realName_label").text("企业名称");
	$("#address_tr").hide();
	$("#hostUrl_tr").show();
	$("#contact_tr").show();
	$("#conTel_tr").show();
	
	$("#partRole_tr").hide();
	$("#status_tr").hide();
	$("#busiType_tr").hide();
}

function checkCode(){
	var username = $("#email").val();
	var code = $("#code").val();
	
	$.ajax({
		url: 'checkEmailOrSms.do',
		dataType: 'json',
		async: false,
		data: {
			"userId": username,
			"code": code
		},
		success: function(data){
			if(data.msgNo == "1"){
				/*bootstrapQ.msg({
					msg: "验证码校验成功！",
					type: "success",
					time: 2000
				});*/
				validSuccess($("#code"));
				submitBtn.click();
			}else{
				/*bootstrapQ.msg({
					msg: "验证码校验失败!",
					type: "danger",
					time: 2000
				});*/
				validError($("#code"),"验证码不正确!")
			}
		},
		error: function(){
			/*bootstrapQ.msg({
				msg: "可能由于网络原因，验证码校验失败，请稍后重试！",
				type: "danger",
				time: 2000
			});*/
			validError($("#code"),"可能由于网络原因，验证码校验失败，请稍后重试！")
		}
	});
}

function checkNickNameRepeat(){
	var nickName = $("#realName").val();
	var flag = false;
	$.ajax({
		url: 'checkNickNameRegisted.do',
		dataType: 'json',
		async: false, //设置为同步执行
		data: {
			"nickName": encodeURIComponent(nickName)
		},
		success: function(data){
			if(data){
				validSuccess($("#realName"));
				flag = true;
			}else{
				validError($("#realName"),"该昵称已被占用")
				flag = false;
			}
		},
		error: function(){
			validError($("#realName"),"可能由于网络原因，昵称检查失败！")
			flag = false;
		}
	});
	return flag;
}

//发送邮件或者短息
function sendVerifyCode(){
	var dom = $("#svc");
	if(formAjaxSubmitCheck("userIdDiv")){
		$(dom).attr("disabled","disabled");
		$(dom).attr("second","60");
		remainTime(dom);
		var userId = $("#email").val();
		
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