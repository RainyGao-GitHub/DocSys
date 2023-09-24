function RegisterPageInit()
{
	//console.log($.cookie("dsuser"));
	//回车键监听函数
	EnterKeyListenerForRegister();
}

function closeRegister(){
	console.log("closeRegister");
	$("#registerdiv").remove();	//删除全屏遮罩
	$("#register").remove();	//删除对话框
}

//回车键监听函数
function EnterKeyListenerForRegister(){
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		register();
 	}  
}

//使能submit按键
function canSubmit(dom){
	if(dom.checked) {
		$("#submit").attr('disabled',false);
	}
	else {
		$("#submit").attr('disabled',true);
	}
}

//登录按键处理函数
function register(){
	console.log("register");
	
	//关闭按键点击避免连续点击
	$("#submit").attr('disabled',true);
	
    $.ajax({
        url : "/DocSystem/User/register.do",
        type : "post",
        dataType : "json",
        data : {
             userName : $('input[name="userName"]').val(),
             pwd : MD5($('input[name="pwd"]').val()),
             pwd2: MD5($('input[name="pwd2"]').val()),
             verifyCode : $('input[name="verifyCode"]').val(),
        },
        success : function (ret) {
        	$("#submit").attr('disabled',false);
            if( "ok" == ret.status ){
            	//window.location.href = "index.html";	//跳转到主页

            	loginUser =  $('input[name="userName"]').val();
            	
            	//关闭注册对话框
            	closeRegister();
            	//弹出登录对话框
            	showLoginPanel();
            }else {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("注册失败", " : ", ret.msgInfo),
            	});
            }
        },
        error : function () {
        	$("#submit").attr('disabled',false);
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("注册失败", " : ", "服务器异常"),
        	});
        }
    });
}

//检查用户是否注册并发送验证码
function checkUserAndSendVerifyCode(){
	console.log("checkUserAndSendVerifyCode");
	
	$.ajax({
        url : "/DocSystem/User/checkUserRegistered.do",
        type : "post",
        dataType : "json",
        data : {
             userName : $('input[name="userName"]').val(),
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	sendVerifyCode();
            }else {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("注册失败", " : ", ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("注册失败", " : ", "服务器异常"),
        	});
        }
    });
    
}

//发送验证码
function sendVerifyCode()
{
	var dom = $("#svc");
	
	$(dom).attr("disabled","disabled");
	$(dom).attr("second","60");
	remainTime(dom);
		
	$.ajax({
        url : "/DocSystem/User/sendVerifyCode.do",
        type : "post",
        dataType : "json",
        data : {
             userName : $('input[name="userName"]').val(),
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("验证码已发送，请注意查收！"),
            	});
            }else {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("验证码发送失败", " : ", ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("验证码发送失败", " : ", "服务器异常"),
        	});
        }
    });
}

//验证码倒计时
function remainTime(){
	var dom = $("#svc");
	var i = $(dom).attr("second");
	$(dom).val(--i + "s"); 
	$(dom).attr("second",i);
    var t = setTimeout(remainTime,1000);
    if(i==0){
    	clearTimeout(t);
    	$(dom).removeAttr("disabled");
    	$(dom).val(_Lang("获取验证码"));
    }
} 
