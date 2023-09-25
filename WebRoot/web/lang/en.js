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
		"文件" : "File",
		"文件夹" : "Folder",		
		
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
    	"获取用户信息失败" : "Failed to get user information",
    	"用户名或密码错误！" : "Incorrect account or password!",
		
    	//退出登录
		"退出登录失败" : "Sign Out Failed",
		
		//添加系统管理员
		"添加系统管理员失败" : "Failed to add System Aministrator",

		//系统配置
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
		"新建仓库" : "New Repository",
		"用户未登录，请先登录！" : "Please login system firstly!",
		"您无权修改该仓库!" : "You have no right to modify this repository!",
		"仓库信息更新失败！" : "Failed to update the repository configuration",
		"仓库目录修改失败" : "Failed to change folder for repository",
		"修改仓库文件目录失败！" : "Failed to change the storage folder for repository",
		"普通用户无权修改仓库存储位置，请联系管理员！" : "You can not change the storage folder, please contact System Administrator",
		"版本仓库初始化失败！" : "Failed to init history storage repository",
		"仓库文件将被加密存储，密钥一旦丢失将导致文件无法恢复，是否加密？" : "Do you want to encrypt files in this repository?",
		"更新仓库配置失败" : "Failed to update repoistory configuration",
		"仓库类型不能修改" : "Repository Type can not be changed",
		"仓库信息未变化" : "Repository configuration was not changed",
		"仓库名不能为空" : "Name is empty",
		"仓库简介不能为空" : "Description is empty",
		"仓库存储路径不能为空" : "Path is empty",
		"新建仓库成功" : "Repoistory was created",
		"创建仓库失败" : "Failed to create new repoistory",
		"显示高级选项" : "Show Advanced Options",
		"隐藏高级选项" : "Hide Advanced Options",
		"测试成功" : "Test Success",
		"测试失败" : "Test Failed",
		"项目名" : "Repository Name",
		"磁盘空间" : "Disk Space",
		"系统错误" : "System Error",
		
		//文件操作与右键菜单选项
		"刷新" : "Refresh",
		"分享" : "Share",
		"打开" : "Open",
		"新建" : "New",
		"删除" : "Delete",
		"重命名" : "Rename",
		"复制" : "Copy",
		"剪切" : "Cut",
		"粘贴" : "Paste",
		"移动" : "Move",
		"下载" : "Download",
		"上传" : "Upload",
		"预览" : "Preview",
		"拉取" : "Pull",
		"推送" : "Push",
		"锁定" : "Lock",
		"解锁" : "Unlock",
		"设置密码" : "Set Password",
		"文件上传" : "Upload Document",
		"文件推送" : "Push Document",
		"文件拉取" : "Pull Document",
		"文件分享" : "Share Document",
		"在新窗口打开" : "Open In New Page",
		"属性" : "Properties",
		"查看历史" : "View History",		
		"远程存储" : "Remote Storage",
		"备注" : "Note",
		"下载备注" : "Download Note",
		"本地路径" : "Local File Path",
		"名字" : "Name",
		"路径" : "Path",		
		"链接" : "Link",
		"下载链接" : "Download Link",
		"全选" : "Select All",
		"更多" : "More",
		
		"刷新失败" : "Failed to refresh",		
		
		"删除确认" : "Delete Confirm",
		"是否删除" : "Do you want to delete",
		"是否删除文件" : "Do you want to delete the file",
		"是否删除目录" : "Do you want to delete the folder",
		"等" : "...",
		"个文件" : "files",
		"清选择需要删除的文件或目录" : "No any file or folder was selected to delete",

		"是否移动文件" : "Do you want to move the file or folder",	
		"请选择需要复制的文件" : "No any file or folder was selected to copy",
		"请选择需要移动的文件" : "No any file or folder was selected to move",
		"请选择文件或目录" : "No any file or folder was selected",
		"复制成功" : "Copy Ok",
		
		"是否下载" : "Do you want to download",
		"请选择需要下载的文件" : "No any file or folder was selected to download",
		"的备注" : "'s Note",
		" 备注"  : "'s Note",
		
		"正在上传" : "Uploading",
		"正在重传" : "Reuploading",
		"上传完成" : "Upload Completed",
		
		"您没有新增或修改权限" : "You have no right to add or modify",
		"下载还未结束，是否终止下载" : "Download not completed, do you want to cancel",
		"上传还未结束，是否终止上传" : "Upload not completed, do you want to cancel",
		"获取仓库信息失败" : "Failed to get repository information",
		"获取仓库目录失败" : "Failed to get repository's file list",
		"获取文件列表失败" : "Failed to get file list",
		"获取文件信息失败" : "Failed to get document information",
		"密码验证" : "Verify Password",
		"该仓库未开通版本管理，请联系管理员" : "History was not configured for this repository, please contact System Administrator",
		"历史版本" : "History",
		"备注历史" : "Note's History",
		"请选择需要锁定的文件" : "No any file or folder was selected to lock",
		"请选择需要解锁的文件" : "No any file or folder was selected to unlock",
		"锁定失败" : "Lock Failed",
		"解锁定败" : "Unlock Failed",
		"访问密码设置" : "Set Access Password",
		"请选择需要设置访问密码的文件" : "No any file or folder was selected to set access password",
		"目标节点不存在" : "Target node not exists",
		
		"文件搜索失败" : "Failed to search",
		"标准模式" : "Standard Mode",
		"电子书模式" : "E-Book Mode",
		"新建目录" : "New Folder",
		"新建文件" : "New File",
		"请选择需要检出文件" : "No any file was selected to check out",
		"获取文件分享信息失败" : "Failed to get document share information",
		"密码验证" : "Verify Password",
		
		"当前为分享链接，无法再次分享！" : "Shared Link can not be shared again",
		"创建文件分享失败" : "Failed to share",
		"该仓库未设置远程存储" : "Remote Storage was not configured for this repository",
		
	};
	
	var newStr = translateMap[str];
	if ( undefined == newStr )
	{
		return str;
	}
	
	return newStr;
}