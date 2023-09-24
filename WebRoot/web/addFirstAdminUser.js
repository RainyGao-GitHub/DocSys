function AddFirstAdminUserPageInit()
{
	//console.log($.cookie("dsuser"));
	//回车键监听函数
	EnterKeyListenerForAddFirstAdminUser();
}

function closeAddFirstAdminUser(){
	console.log("closeAddFirstAdminUser");
	$("#addFirstAdminUserdiv").remove();	//删除全屏遮罩
	$("#addFirstAdminUser").remove();	//删除对话框
}

//回车键监听函数
function EnterKeyListenerForAddFirstAdminUser(){
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		addFirstAdminUser();
 	}  
}
	
//登录按键处理函数
function addFirstAdminUser(){
	console.log("addFirstAdminUser");
    var name = $('input[name="userName"]').val();
    if(name == "")
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("用户名不能为空"),
    	});
    	return;
    }
    
    var tel = $('input[name="tel"]').val();
    if(tel == "")
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("手机号不能为空"),
    	});
    	return;
    }

    var email = $('input[name="email"]').val();
    if(email == "")
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("邮箱不能为空"),
    	});
    	return;
    }
    
    var pwd = $('input[name="pwd"]').val();
	if(pwd == "")
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("密码不能为空"),
    	});
    	return;
	}
    var pwd2 = $('input[name="pwd2"]').val();
    if(pwd != pwd2)
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("两次密码输入不一致") + "!",
    	});        	
    	return;
    }
	
    $("#submit").attr("disabled","disabled");
    
    $.ajax({
        url : "/DocSystem/Manage/addFirstAdminUser.do",
        type : "post",
        dataType : "json",
        data : {
             name : name,
             pwd : MD5(pwd),
             pwd2: MD5(pwd2),
             tel : tel,
             email : email,
        },
        success : function (ret) {
        	$("#submit").removeAttr("disabled");
            
            if( "ok" == ret.status ){
            	closeAddFirstAdminUser();
            	//弹出登录对话框
            	showLoginPanel();
            	loginUser =  $('input[name="userName"]').val();
            }else {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("添加系统管理员失败", ":" , ret.msgInfo),
            	});
            }
        },
        error : function () {
        	$("#submit").removeAttr("disabled");
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("添加系统管理员失败", ":" , "服务器异常"),
        	});
        }
    });
}