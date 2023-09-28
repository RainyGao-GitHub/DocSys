//登录按键处理函数
function login(){
	//alert("11");
	var rememberMe = $('input[name="rememberMe"]').is(':checked')? 1: 0;
    $.ajax({
        url : "/DocSystem/User/login.do",
        type : "post",
        dataType : "json",
        data : {
             userName : $('input[name="userName"]').val(),
             pwd : base64_encode($('input[name="pwd"]').val()),
             rememberMe : rememberMe,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	//Get用户信息
				var user = ret.data;
				console.log("user",user);
				if(!user.type || user.type < 1)
				{
					alert("非管理员用户，请联系系统管理员");
				}
				else
				{
                	console.log("登录成功");
                	window.location.href = "main" + langExt + ".html";
				}
            }else {
                alert("错误："+ret.msgInfo);
            }
        },
        error : function () {
            alert("服务器异常:登录失败");
        }
    });
}

//退出登录
function logout()
{
	console.log("logout");
    $.ajax({
        url : "/DocSystem/User/logout.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status ){
            	console.log("已退出登录");
            	window.location.reload();	//刷新页面
            }else {
                alert("错误："+ret.msgInfo);
            }
        },
        error : function () {
            alert("服务器异常:退出登录失败");
        }
    });
}

//页面初始化
function pageInit()
{
	console.log("pageInit");
	//确定当前登录用户是否已登录
	$.ajax({
        url : "/DocSystem/User/getLoginUser.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	//Get用户信息
				var user = ret.data;
				console.log("user",user);
				if(!user.type || user.type < 1)
				{
					console.log("非管理员用户，请联系系统管理员");
				}
				else
				{
            		window.location.href="main" + langExt + ".html";
				}
            }
            else 
            {
                console.log(ret.msgInfo);
            }
        },
        error : function () {
            alert("服务器异常:获取用户信息失败");
            }
        });
}
    
pageInit();  