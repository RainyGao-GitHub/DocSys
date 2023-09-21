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
		"获取验证码" : "Send",
		"验证码发送失败" : "Failed to send verification code",
		"验证码已发送，请注意查收！" : "MxsDoc will send a verification code to your mobile phone or email!",
		"添加系统管理员失败" : "Failed to add System Aministrator",
		"两次密码输入不一致" : "Re-enter password error",
		"手机号不能为空" : "Mobile Number is empty",
		"用户名不能为空" : "Account is empty",
		"邮箱不能为空" : "Email is empty",
		"密码不能为空" : "Password is empty",
		"数据库配置有变更，请先重启服务"	: "DataSource configuration was changed, Please restart server",
		"系统初始化失败" : "System Init Failed",
		"账号不能为空！" : "Account is empty!",
		"账号格式不正确！" : "Account format error!",
		"该用户已存在！" : "Account exists!",
		"密码不能为空！" : "Password is empty!",
		"两次密码不一致，请重试！" : "Re-enter password error!",
		"验证码错误！" : "Incorrect verification code!",		
	};
	
	var newStr = translateMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}