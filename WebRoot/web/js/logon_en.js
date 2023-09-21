	function showLoginPanel(){
		console.log("showLoginPanel");
		bootstrapQ.dialog({
			id: "login",
			title: 'Sign In',
			url: 'login_en.html',
			msg: 'Loading...',
			foot: false,
			big: false
		}, null);
	}
	
	function showRegisterPanel(){
		console.log("showRegisterPanel");
		bootstrapQ.dialog({
			id: "register",
			url: 'register_en.html',
			title: 'Sign Up',
			msg: 'Loading...',
			foot: false,
			big: false
		}, null);
	}
	
	function showAddFirstAdminUserPanel(){
		console.log("showAddFirstAdminUserPanel");
		bootstrapQ.dialog({
			id: "addFirstAdminUser",
			url: 'addFirstAdminUser_en.html',
			title: 'Add System Administrator',
			msg: 'Loading...',
			foot: false,
			big: false
		}, null);
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
                	//document.location.reload();
                	var url = window.location.href;
                	window.location.href = url;	//刷新页面
                }else {
                    alert(_Lang("退出登录失败", ":", ret.msgInfo));
                }
            },
            error : function () {
                alert(_Lang("退出登录失败", ":", "服务器异常"));
            }
        });
    }
	
	//This  function
	function ShowUserInfo(user)
	{
		console.log("ShowUserInfo user:", user);
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
	}
	
	function getUserImgUrl(imgName)
	{
		return "/DocSystem/User/getUserImg.do?fileName=" + imgName;
	}
	
	function UserImgErrHandler()
	{
		console.log("UserImgErrorHandler");
		$("#userImg").attr('src',"images/default/defaultHeadPic.png"); 
	}
	