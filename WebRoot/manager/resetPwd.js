function ResetPwdPageInit()
{
	console.log("ResetPwdPageInit()");
	EnterKeyListenerForResetPwd();
}

function showResetPwdModal(text){
	$(".resetPwdModal").fadeIn("slow");
	$("#name").focus();
}

function closeResetPwdModal(){
	$(".resetPwdModal").fadeOut("slow");
}

//回车键监听函数
function EnterKeyListenerForResetPwd(){
	console.log("start enter key listener");
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		resetPwd();
 	}  
}

function resetPwd(){
	console.log("resetPwd()");

	var id =  $("#userId").val();
	var name = $("#name").val();
    var pwd =  $("#pwd").val();
    
    console.log(name,pwd);
    
    $.ajax({
        url : "/DocSystem/Manage/resetPwd.do",
        type : "post",
        dataType : "json",
        data : {
        	 id : id,
             pwd : MD5(pwd),
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	showUserList(gPageIndex);	//刷新UserList
            	alert("更新成功");
            }else {
            	alert("错误：" + ret.msgInfo);
            }
        },
        error : function () {
        	alert("服务器异常:更新失败");
        }
    });
}

//页面初始化代码    
$(function(){
	console.log("resetPwd Page init");
	ResetPwdPageInit();
	$("#name").click().focus();
});
