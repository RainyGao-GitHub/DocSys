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
		"用户未登录" : "User not Signed In",
		
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
		"重启成功" : "Restart Ok",
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
		"更新目录失败" : "Failed to update repository menu",
		"备份密钥" : "Backup Encrypt-Key",
		"是否备份仓库密钥" : "Do you want to backup Encrypt-Key",
		"密钥备份成功" : "Encrypt-Key backup Success",
		"密钥备份失败" : "Failed to backup Encrypt-Key",
		"删除仓库" : "Delete Repository",
		"仓库删除后数据将无法恢复，是否删除" : "All data will be deleted, Please confirm you have backuped data",
		"删除成功" : "Delete Ok",
		"删除失败" : "Failed to delete",
		"仓库设置" : "Repository Config",
		"版本管理" : "History",
		"关闭版本管理" : "Disable History",
		"开启版本管理" : "Enable History",
		"关闭历史版本管理" : "Disable History",
		"开启历史版本管理" : "Enable History",
		"忽略列表管理" : "Ignore List",
		"远程存储" : "RemoteStorage",
		"关闭远程存储" : "Disable RemoteStorage",
		"开启远程存储" : "Enable RemoteStorage",
		"全文搜索" : "TextSearch",
		"关闭全文搜索" : "Disable TextSearch",
		"开启全文搜索" : "Enable TextSearch",
		"自动备份" : "AutoBackup",
		"本地备份" : "LocalBackup",
		"关闭本地备份" : "Disable LocalBackup",
		"开启本地备份" : "Enable LocalBackup",
		"立即本地备份" : "Start LocalBackup",
		"异地备份" : "RemoteBackup",
		"立即异地备份" : "Start RemoteBackup",
		"关闭异地备份" : "Disable RemoteBackup",
		"开启异地备份" : "Enable RemoteBackup",
		"清除缓存" : "Clean Cache",
		"强制刷新" : "Force Refresh",
		
		"该仓库未设置远程存储，请联系管理员！" : "RemoteStorage was not configured, Please contact System Administrator",
		"远程存储忽略管理" : "RemoteStorage Ignore List",
		"关闭仓库所有文件的远程存储" : "Disable RemoteStorage for all documents",
		"开启仓库所有文件的远程存储" : "Enable RemoteStorage for all documents",
		"设置成功" : "Config Ok",
		"设置失败" : "Config Failed",
				
		"该仓库未设置异地备份，请联系管理员！" : "RemoteBackup was not configured, Please contact System Administrator",
		"该仓库未设置异地自动备份，请联系管理员！" : "RemoteBackup was not configured, Please contact System Administrator",
		"异地备份忽略管理" : "RemoteBackup Ignore List",
		"关闭仓库所有文件的异地备份" : "Disable RemoteBackup for all documents",
		"开启仓库所有文件的异地备份" : "Enable RemoteBackup for all documents",
		
		"该仓库未设置本地备份，请联系管理员！" : "LocalBackup was not configured, Please contact System Administrator",
		"该仓库未设置本地自动备份，请联系管理员！" : "LocalBackup was not configured, Please contact System Administrator",
		"本地备份忽略管理" : "LocalBackup Ignore List",
		"关闭仓库所有文件的本地备份" : "Disable LocalBackup for all documents",
		"开启仓库所有文件的本地备份" : "Enable LocalBackup for all documents",
		
		"是否立即执行仓库自动备份？" : "Do you want to start AutoBackup for repository now?",
		"是否立即执行仓库本地自动备份？" : "Do you want to start LocalBackup for repository now?",
		"是否立即执行仓库异地自动备份？" : "Do you want to start RemoteBackup for repository now?",
		"开始" : "Start",
		"仓库备份中，可能需要花费较长时间，您可先关闭当前窗口！" : "Repository Backup may take long time, You can close this dialog now",
		"备份失败" : "Backup Failed",
		"仓库自动备份失败" : "Repository AutoBackup Failed",
		"本地自动备份成功" : "LocalBackup OK",
		"异地自动备份成功" : "RemoteBackup OK",		
		
		"该仓库未开启全文搜索，请联系管理员！" : "TextSearch was not configured, Please contact System Administrator",
		"全文搜索忽略管理" : "TextSearch Ignore List",
		"该仓库未设置全文搜索，请联系管理员！" : "TextSearch was not configured, Please contact System Administrator",
		"关闭仓库所有文件的全文搜索" : "Disable TextSearch for all documents",
		"开启仓库所有文件的全文搜索" : "Enable TextSearch for all documents",

		"版本忽略管理" : "History Ignore List",
		"历史版本忽略管理" : "History Ignore List",
		"该仓库未设置历史版本管理，请联系管理员！" : "History was not configured, Please contact System Administrator",
		"关闭仓库所有文件的历史版本管理" : "Disable History for all documents",
		"开启仓库所有文件的历史版本管理" : "Enable History for all documents",		
		"获取文件版本管理设置失败" : "Failed to get History ignore setting",
		
		"是否清除仓库缓存" : "Do you want to clean cache",
		"清除" : "Clean",
		"清除成功" : "Clean Ok",
		"清除失败" : "Clean Failed",
		
		"获取仓库用户列表失败" : "Failed to get user list",
		
		"暂无数据" : "No Data",
		"管理员" : "Admin",
		"读" : "Read",
		"写" : "Write",
		"增加" : "Add",
		"删除" : "Delete",
		"全部" : "All",
		"可继承" : "Inherit",
		"下载/分享" : "Download/Share",
		"不限" : "NoLimit",
		
		"是否删除该用户组的仓库权限" : "Do you want to remove Group on this repository",
		"删除用户组的仓库权限失败" : "Failed to remove Group on repository",
		"是否删除该用户的仓库权限" : "Do you want to remove User on this repository",
		"删除用户的仓库权限失败" : "Failed to remove User on repository",
		"是否删除该用户的目录权限设置" :  "Do you want to remove User on this folder",		
		"删除用户的目录权限设置失败" : "Failed to remove User on folder",

		"获取仓库列表失败" : "Failed to get repository's file list",
		"添加访问用户" : "Add Access User",
		"添加访问组" : "Add Access Group",
		
		"高级设置" : "Advanced Options",
		"密码设置" : "Set Password",
		"强制刷新整个仓库" : "Force Refresh whole repository",
		
		"权限设置失败" : "Access Configure Failed",
		"是否继续设置其他用户" : "Continue to configure other users",
		"后续错误是否执行此操作" : "Take the same action for this failure",
		"是" : "Yes",
		"否" : "No",
		"设置完成" : "Configure Completed",
		
 		
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
		
		"推送失败" : "Push Failed",
		"该操作将推送目录下的所有文件，是否允许？" : "All files under this folder will be pushed, please confirm",
		"远程文件可能被删除或覆盖，是否强制推送？" : "Remote file will be replaced forcely, please confirm",
		
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