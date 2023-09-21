/*
 * English Support
 * */

function _Lang(str1, connectStr , str2)
{
	if(connectStr == undefined)
	{
		return lang(str1);
	}
	
	return lang(str1) + connectStr + lang(str2);
}

function lang(str)
{
	var translateMap = 
	{
		"服务器异常" : "Server Exception",			
		"注册失败"	: "Sign Up Failed",			
		"登录失败"	: "Sign In Failed",
		"退出登录失败" : "Sign Out Failed",
		"获取验证码" : "Send Verify Code",
		"验证码发送失败" : "Failed To Send Verify Code",
		"验证码已发送" : "Verify Code was sent to you",
		"请注意查收" : "Please check your email or SMS",
		"添加系统管理员失败" : "Failed to add System Aministrator Account",
		"两次密码输入不一致" : "Your re-enter password is incorrect",
		"手机号不能为空" : "Mobile Number can not be empty",
		"用户名不能为空" : "Account can not be empty",
		"邮箱不能为空" : "Email can not be empty",
		"密码不能为空" : "Password can not be empty",
		"数据库配置有变更，请先重启服务"	: "DataSource configuration was changed, Please restart server",
		"系统初始化失败" : "System Init Failed",
		
	};
	
	var newStr = langTypeMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}