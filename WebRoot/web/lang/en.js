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
		//TODO: 后台的接口发送的邮件和短信是中文，可以考虑后台增加语言参数
		//通用
		"服务器异常" : "Server Exception",			
		//注册
		"注册失败"	: "Sign Up Failed",			
		"获取验证码" : "Send",
		"验证码发送失败" : "Failed to send verification code",
		"验证码已发送，请注意查收！" : "MxsDoc will send a verification code to your mobile phone or email!",
		"两次密码输入不一致" : "Re-enter password error",
		"手机号不能为空" : "Mobile Number is empty",
		"用户名不能为空" : "Account is empty",
		"邮箱不能为空" : "Email is empty",
		"密码不能为空" : "Password is empty",
		"账号不能为空！" : "Account is empty!",
		"账号格式不正确！" : "Account format error!",
		"该用户已存在！" : "Account exists!",
		"该手机已被使用！" : "Mobile Phone have been registered",
		"该邮箱已被使用！" : "Email have been registered",
		"手机格式错误！" : "Incorrect Mobile Number",
		"邮箱格式错误！" : "Incorrect Email",
		"请填写正确的邮箱或手机" : "Please use correct email or mobile phone",
		"请使用正确的邮箱手机！" : "Please use correct email or mobile phone",
		"验证码错误！" : "Incorrect verification code!",
		"密码不能为空！" : "Password is empty!",
		"两次密码不一致，请重试！" : "Re-enter password error!",
		//登录
		"登录失败"	: "Sign In Failed",
    	"获取用户信息失败" : "Get Login User Failed",
    	"用户名或密码错误！" : "Incorrect account or password!",
		//退出登录
		"退出登录失败" : "Sign Out Failed",
		//添加系统管理员
		"添加系统管理员失败" : "Failed to add System Aministrator",
		//系统
		"数据库配置有变更，请先重启服务"	: "DataSource configuration was changed, Please restart server",
		"系统初始化失败" : "System Init Failed",
		//仓库访问
		"用户未登录，请先登录！" : "Please login system firstly!",
		"您无权修改该仓库!" : "You have no right to modify this repository!",
		"仓库信息更新失败！" : "Failed to update the repository configuration",
		"仓库目录修改失败" : "Failed to change folder for repository",
		"修改仓库文件目录失败！" : "Failed to change the storage folder for repository",
		"普通用户无权修改仓库存储位置，请联系管理员！" : "You can not change the storage folder, please contact System Administrator",
		"版本仓库初始化失败！" : "Failed to init history storage repository",
		
		
	};
	
	var newStr = translateMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}