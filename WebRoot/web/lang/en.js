/*
 * English Support
 * */
var langType = "en";
var langExt = "_en";	//跳转网页扩展字符，用于区分跳转不同页面

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
		"提示" : "Message",
		"确认操作" : "Confirm",
		"错误" : "Error",
		"确定" : "Ok",
		"确认" : "Confirm",
		"取消" : "Cancel",
		"登录" : "Sign In",
		"注册" : "Sign Up",
		"退出登录" : "Log Out",
		"添加系统管理员" : "Add System Administrator",		
		"服务器异常" : "Server exception",
		"页面正在加载，请稍等" : "Loading",
		"页面正在加载，请稍侯" : "Loading",
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
		"系统初始化失败" : "System Init Failed",
		"重启服务" : "Restart Server",
		"未指定服务器路径！" : "Server not configured",
		"是否重启服务" : "Do you want to restart server",
		"重启成功" : "Restart Successfuly",
		"重启失败" : "Failed to restart",
		"获取数据库信息失败" : "Failed to get DataSource configuration",
		"数据库配置修改成功，请重启服务！" : "Update DataSource successfuly, Please restart server!",
		"数据库配置有变更，请先重启服务！"	: "DataSource changed, Please restart server!",
		"更新数据库配置信息失败" : "Failed to modify DataSource configuration",
		"数据库连接成功" : "Connect DataBase Successfuly",
		"数据库连接失败" : "Failed to connect DataBase",
		"连接数据库失败" : "Connect DataBase Failed",
		"新建数据库失败" : "Create DataBase Failed",
		"重置数据库" : "Reset DataBase",
		"是否重置数据库" : "Do you want to reset DataBase",
		"重置数据库成功" : "Reset DataBase Successfuly",
		"重置数据库失败" : "Failed to reset DataBase",
		"数据库导出失败" : "Failed to export data from DataBase",
		"导入数据" : "Import Data",
		"是否导入" : "Do you want to import",
		"导入成功" : "Import Successfuly",
		"导入失败" : "Failed to import",
		"上传异常" : "Upload exception",

		//仓库访问
		"用户未登录，请先登录！" : "Please login system firstly!",
		"您无权修改该仓库!" : "You have no right to modify this repository!",
		"仓库信息更新失败！" : "Failed to update the repository configuration",
		"仓库目录修改失败" : "Failed to change folder for repository",
		"修改仓库文件目录失败！" : "Failed to change the storage folder for repository",
		"普通用户无权修改仓库存储位置，请联系管理员！" : "You can not change the storage folder, please contact System Administrator",
		"版本仓库初始化失败！" : "Failed to init history storage repository",
		
		//文件操作
		"删除" : "Delete",
		"删除确认" : "Delete Confirm",
		"是否删除" : "Do you want to delete",
		"是否删除文件" : "Do you want to delete the file",
		"是否删除目录" : "Do you want to delete the folder",
		"等" : "...",
		"个文件" : "files",
		"清选择需要删除的文件或目录" : "No any file or folder was selected to delete",
		
	};
	
	var newStr = translateMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}