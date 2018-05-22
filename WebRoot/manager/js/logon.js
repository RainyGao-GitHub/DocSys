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
                	//document.location.reload();
                	var url = window.location.href;
                	window.location.href = url;	//刷新页面
                }else {
                    alert("错误："+ret.msgInfo);
                }
            },
            error : function () {
                alert("服务器异常:退出登录失败");
            }
        });
    }
	
	//This  function
	function ShowUserInfo(user)
	{
		console.log("id:" + user.id + " name:" + user.name + " img:" + user.img);
		if((typeof(user.img)=="undefined") || (user.img == ""))
		{
			//使用默认图片
			console.log("use default img");
			//$("#userImg").attr('src',"images/default/defaultHeadPic.png"); 
		}
		else	//使用用户自定义头像
		{
			var userImgUrl = getUserImgUrl(user.img);
			$("#userImg").attr('src',userImgUrl); 
		}
		$('#userImgDiv').show();
		$('#userInfoDiv > a >span:first-child').text(user.name);
		$('#userInfoDiv').show();
		$('#loginBtn').hide();
	}
	
	function getUserImgUrl(imgName)
	{
		return "/DocSystem/getUserImg.do?fileName=" + imgName;
	}
	
	function UserImgErrHandler()
	{
		console.log("UserImgErrorHandler");
		$("#userImg").attr('src',"images/default/defaultHeadPic.png"); 
	}
	