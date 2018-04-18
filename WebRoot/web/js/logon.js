	function showLoginPanel(){
		//alert("showLoginPanel");
		bootstrapQ.dialog({
			title: '登录',
			url: 'login.html',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: false
		}, null);
	}
	
	function showRegisterPanel(){
		//alert("showRegisterPanel");
		bootstrapQ.dialog({
			url: 'register.html',
			title: '注册',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: false
		}, null);
	}
	
	//退出登录
	function logout()
	{
		console.log("logout");
        $.ajax({
            url : "/DocSystem/logout.do",
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