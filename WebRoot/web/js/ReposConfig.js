//ReposConfig
function addReposPageInit(_type, _parentNode)
{
		console.log("addReposPageInit()");
		MyJquery.focus("repos-name");

        //alert(login_user.type);
        var defaultReposStorePath =  gDocSysConfig.defaultReposStorePath;
        var defaultLocalVerReposStorePath =  defaultReposStorePath + "DocSysVerReposes/";

        MyJquery.setValue("repos-path", gDocSysConfig.defaultReposStorePath);
        MyJquery.enable("repos-path");
       
        doSelectFS(); 
        
        MyJquery.setValue("repos-localSvnPath", defaultLocalVerReposStorePath);
        MyJquery.setValue("repos-svnPath", "");
        MyJquery.setValue("repos-svnUser", "");
        MyJquery.setValue("repos-svnPwd", "");
        MyJquery.setValue("repos-localSvnPath1", defaultLocalVerReposStorePath);
        MyJquery.setValue("repos-svnPath1", "");
        MyJquery.setValue("repos-svnUser1", "");
        MyJquery.setValue("repos-svnPwd1", "");
}

function cancelAddRepos()
{
	closeAddReposDialog();
	//临时方案避免滚动条消失
	window.location.reload();
}

function closeAddReposDialog()
{
	closeBootstrapDialog("addRepos");
	//临时方案避免滚动条消失
	window.location.reload();
}

function doAddRepos()
{
    var name = MyJquery.getValue("repos-name");
    var info = MyJquery.getValue("repos-info");
    var path = MyJquery.getValue("repos-path");
    var realDocPath = MyJquery.getValue("repos-realDocPath");
    
    var textSearch = getTextSearchConfig();
    var encryptType = MyJquery.isChecked("isEncryptEnabled");
    var autoBackupConfig = getAutoBackupConfig();	//autoBackupConfig
    console.log("autoBackupConfig = " + autoBackupConfig);
    
    //Force Enable Virtual Doc Version Control Start
    var verCtrl1 = MyJquery.getValue("repos-verCtrl1");
    var isRemote1 = MyJquery.isChecked("verCtrl1-isRemote");
    var localSvnPath1 = MyJquery.getValue("verCtrl1-localSvnPath");
    var svnPath1 = MyJquery.getValue("verCtrl1-svnPath");
    var svnUser1 = MyJquery.getValue("verCtrl1-svnUser");
    var svnPwd1 = MyJquery.getValue("verCtrl1-svnPwd");
    if(isRemote1 == 0)
	{
		localSvnPath1 =   path + "DocSysVerReposes/";        		
	}
    //default to set VirtualDoc VersionControl as GIT
    if(verCtrl1 == 0)
    {
    	verCtrl1 = 2;
    }
    //Force Enable Virtual Doc Version Control End
    	    
	//前置服务器
    var remoteServer = "";
    //远程存储
	var remoteStorage = "";
    //版本管理
    var verCtrl = "";
    var isRemote = 0;
    var localSvnPath = "";
    var svnPath = "";
    var svnUser = "";
    var svnPwd = "";
	
    var type = MyJquery.getValue("repos-type"); //1:文件管理系统  5:文件服务器前置
    if(type == 1)
    {
    	//远程存储
	    remoteStorage = getRemoteStorageConfig();	//remoteStorage
	    //版本管理
	    verCtrl = MyJquery.getValue("repos-verCtrl");
	    isRemote = MyJquery.isChecked("verCtrl-isRemote");
	    localSvnPath = MyJquery.getValue("verCtrl-localSvnPath");
	    svnPath = MyJquery.getValue("verCtrl-svnPath");
	    svnUser = MyJquery.getValue("verCtrl-svnUser");
	    svnPwd = MyJquery.getValue("verCtrl-svnPwd");

		if(isRemote == 0)
		{
			localSvnPath =   path + "DocSysVerReposes/";
		}
    }
    else
    {
    	remoteServer = getRemoteServerConfig();	//remoteServer
    }
    
    var createTime = new Date().getTime();	//获取时间戳
    
    //alert("仓库名："+ name + " 仓库类型：" + type + " 仓库路径：" + path + " 仓库描述：" + info + " svnPath:" + svnPath + " svnUser:" + svnUser + " 创建时间：" + createTime);
	if(!name)
	{
    	alert("仓库名不能为空！");
    	return false;
	}
	if(!info)
	{
    	alert("仓库简介不能为空！");
    	return false;
	}
	if(!path)
	{
    	alert("仓库存储路径不能为空！");
    	return false;
	}
	
    $.ajax({
            url : "/DocSystem/Repos/addRepos.do",
            type : "post",
            dataType : "json",
            data : {
                name:name,
                info:info,
                type:type,
                path:path,
                realDocPath: realDocPath,
                remoteServer: remoteServer,
                remoteStorage: remoteStorage,
                verCtrl: verCtrl,
                isRemote: isRemote,
                localSvnPath: localSvnPath,
                svnPath: svnPath,
                svnUser: svnUser,
                svnPwd: svnPwd,
                verCtrl1: verCtrl1,
                isRemote1: isRemote1,
                localSvnPath1: localSvnPath1,
                svnPath1: svnPath1,
                svnUser1: svnUser1,
                svnPwd1: svnPwd1,
                createTime:createTime,
                textSearch: textSearch,
                encryptType : encryptType,
                autoBackup : autoBackupConfig,	                
            },
            success : function (ret) {
            	if(ret.status == "ok")
            	{
            		console.log("创建仓库成功");
                	onChange();
                }
                else
                {
                	showErrorMessage(ret.msgInfo);
                }
            },
            error : function () {
            	showErrorMessage('服务器异常: 创建仓库失败');
            }
        });
    
    closeAddReposDialog();
	//临时方案避免滚动条消失
	window.location.reload();
    return true;
}

//文件系统类型改变时需要根据文件系统类型，显示或者不显示相关信息
function doSelectFS()
{
	var type = MyJquery.getValue("repos-type");
	console.log("doSelectFS type:" + type);
	if(type == 1 || type == 2)
	{
		MyJquery.hide("remoteServerDiv");
		MyJquery.show("remoteStorageDiv");
		MyJquery.show("verCtrlDiv");
	}
	else
	{
		MyJquery.show("remoteServerDiv");
		MyJquery.hide("remoteStorageDiv");
		MyJquery.hide("verCtrlDiv");
	}
}

/** 版本管理设置 **/
function doSelectVerCtrlEnable()
{
	var verCtrlEnable = MyJquery.isChecked("verCtrlEnable");
	console.log("doSelectVerCtrlEnable verCtrlEnable:" + verCtrlEnable);
	if(verCtrlEnable == 0)
	{
		MyJquery.select("repos-verCtrl", 0); //关闭verCtrl
		MyJquery.hide("verCtrlConfigDiv"); //隐藏 高级选项
		
		MyJquery.hide("showVerCtrlConfig"); //隐藏(显示高级选项)提示
		MyJquery.setValue("showVerCtrlConfig", 0);
		MyJquery.setText("showVerCtrlConfig", "显示高级选项");
	}
	else
	{	
		if(MyJquery.getValue("repos-verCtrl") == 0)	//设置版本控制为GIT
		{
			MyJquery.select("repos-verCtrl", 2);
		}
		
		MyJquery.hide("verCtrlConfigDiv"); //隐藏 高级选项
		
		MyJquery.show("showVerCtrlConfig");	//显示(显示高级选项)提示
		MyJquery.setValue("showVerCtrlConfig", 0);
		MyJquery.setText("showVerCtrlConfig", "显示高级选项");
	}
	
	doSelectVerCtrl();
}

function doSelectShowVerCtrlConfig()
{
	var showVerCtrlConfig = MyJquery.getValue("showVerCtrlConfig");
	console.log("doSelectShowVerCtrlConfig showVerCtrlConfig:" + showVerCtrlConfig);
	if(showVerCtrlConfig == 0)
	{
		MyJquery.setValue("showVerCtrlConfig", 1);
		MyJquery.setText("showVerCtrlConfig", "隐藏高级选项");
		MyJquery.show("verCtrlConfigDiv");			
	}
	else
	{
		MyJquery.setValue("showVerCtrlConfig", 0);
		MyJquery.setText("showVerCtrlConfig", "显示高级选项");
		MyJquery.hide("verCtrlConfigDiv");
	}
}

//According verCtrl value to disale the svnPath or not
function doSelectVerCtrl()
{
	var verCtrl = MyJquery.getValue("repos-verCtrl");
	var isRemote = MyJquery.isChecked("verCtrl-isRemote");
	console.log("doSelectVerCtrl verCtrl:" + verCtrl + " isRemote:" + isRemote);
	
	//alert(verCtrl);
	if(verCtrl != 0) 			//show verRepos info
	{
		if(isRemote == 0)
		{
			MyJquery.hide("verCtrl-localVerRepos");
			MyJquery.hide("verCtrl-remoteVerRepos");
		}
		else
		{
			if(verCtrl == 1)
			{
				MyJquery.hide("verCtrl-localVerRepos");
			}
			else
			{
				MyJquery.show("verCtrl-localVerRepos");
			}
			MyJquery.show("verCtrl-remoteVerRepos");				
		}
		MyJquery.show("verCtrl-isRemoteSetting");
		MyJquery.show("verCtrl-verReposSetting");
	}
	else	//hide verRepos info
	{
		MyJquery.hide("verCtrl-isRemoteSetting");
		MyJquery.hide("verCtrl-verReposSetting");		
	}   
}

//According verCtrl1 value to disale the svnPath1 or not
function doSelectVerCtrl1()
{
	var verCtrl = MyJquery.show("repos-verCtrl1");
	var isRemote = MyJquery.isChecked("verCtrl1-isRemote1");
	console.log("doSelectVerCtrl1 verCtrl:" + verCtrl + " isRemote:" + isRemote);

	if(verCtrl != 0) 			//show verRepos info
	{
		if(isRemote == 0)
		{
			MyJquery.show("verCtrl1-localVerRepos");
			MyJquery.hide("verCtrl1-remoteVerRepos");
		}
		else
		{
			if(verCtrl == 1)
			{
				MyJquery.hide("verCtrl1-localVerRepos");
			}
			else
			{
				MyJquery.show("verCtrl1-localVerRepos");
			}
			MyJquery.show("verCtrl1-remoteVerRepos");
		}
		MyJquery.show("verCtrl1-isRemoteSetting");
		MyJquery.show("verCtrl1-verReposSetting");		
	}
	else	//hide verRepos info
	{
		MyJquery.hide("verCtrl1-isRemoteSetting");
		MyJquery.hide("verCtrl1-verReposSetting");				
	}     
}

function doSelectReposStorageConfigEnable()
{
	var reposStorageConfigEnable = MyJquery.isChecked("reposStorageConfigEnable");
	console.log("doSelectReposStorageConfigEnable reposStorageConfigEnable:" + reposStorageConfigEnable);
	if(reposStorageConfigEnable == 0)
	{
		MyJquery.hide("reposStorageConfig");	
	}
	else
	{	
		MyJquery.show("reposStorageConfig");	
	}
}

/** 文件存储路径设置 **/
function doSelectReposStorageRealDocPathEnable()
{
	var reposStorageRealDocPathEnable = MyJquery.isChecked("reposStorageRealDocPathEnable");
	console.log("doSelectReposStorageRealDocPathEnable reposStorageRealDocPathEnable:" + reposStorageRealDocPathEnable);
	if(reposStorageRealDocPathEnable == 0)
	{
		MyJquery.hide("reposStorageRealDocPathConfig");
	}
	else
	{	
		MyJquery.show("reposStorageRealDocPathConfig");
	}
}

/** 文件加密设置  **/
function doSetEncryptConfirm()
{
	var en = MyJquery.isChecked("isEncryptEnabled");
	if(en == 1)
	{
		qiao.bs.confirm({
	        id: 'setEncryptConfirm',
	        msg: '仓库文件将被加密存储，密钥一旦丢失将导致文件无法恢复，是否加密？',
	    },function(){
	    	//确认
	    	$("#isEncryptEnabled").attr("checked","checked");
	    },function(){
			//取消
	    	$("#isEncryptEnabled").attr("checked",false);			
	    });
	}
}

/**** 文件服务器前置设置 ***/
function doSelectRemoteServerProtocol()
{
	var protocol = MyJquery.getValue("remoteServerProtocol");
	console.log("doSelectRemoteServerProtocol protocol:" + protocol);
	if(protocol == undefined || protocol == "")
	{
		MyJquery.hide("remoteServerConfig");
		return;
	}
	
	var placehoder = getPlacehoderForRemoteStorageProtocol(protocol);
	$("#remoteServer").attr('placeholder', placehoder);
	MyJquery.show("remoteServerConfig");
}

function getRemoteServerConfig()
{   
	var protocol = MyJquery.getValue("remoteServerProtocol");
	console.log("getRemoteServerConfig protocol:" + protocol);
	if(protocol == undefined || protocol == "")
	{
		return "";
	}
	
	var prefix = "";
	switch(protocol)
	{
	case "svn":
		prefix = "svn://";
		break;
	case "git":
		prefix = "git://";
		break;
	case "mxsdoc":
		prefix = "mxsdoc://";
		break;
	}
	
    var remoteServer = MyJquery.getValue("remoteServer");	//remoteServer
    if(remoteServer != undefined && remoteServer != "")
	{
    	remoteServer = prefix + remoteServer;
	}
    console.log("getRemoteStorageConfig remoteServer:" + remoteServer);
	return remoteServer;
}	

/**** 远程存储设置 ***/
function doSelectRemoteStorageConfigEnable()
{
	var remoteStorageConfigEnable = MyJquery.isChecked("remoteStorageConfigEnable");
	console.log("doSelectRemoteStorageConfigEnable remoteStorageConfigEnable:" + remoteStorageConfigEnable);
	if(remoteStorageConfigEnable == 0)
	{
		MyJquery.hide("remoteStorageConfigDiv");
	}
	else
	{	
		MyJquery.show("remoteStorageConfigDiv");
	}
	
}

function doSelectRemoteStorageProtocol()
{
	var protocol = MyJquery.getValue("remoteStorageProtocol");
	console.log("doSelectRemoteStorageProtocol protocol:" + protocol);
	if(protocol == undefined || protocol == "")
	{
		MyJquery.hide("remoteStorageProtocolConfig");
		return;
	}

	var placehoder = getPlacehoderForRemoteStorageProtocol(protocol);
	$("#remoteStorage").attr('placeholder', placehoder);
	MyJquery.show("remoteStorageProtocolConfig");
}

function getRemoteStorageConfig()
{   
	var remoteStorageConfigEnable = MyJquery.isChecked("remoteStorageConfigEnable");
	console.log("getRemoteStorageConfig remoteStorageConfigEnable:" + remoteStorageConfigEnable);
	if(remoteStorageConfigEnable == 0)
	{
		return "";
	}
	
	var protocol = MyJquery.getValue("remoteStorageProtocol");
	console.log("getRemoteStorageConfig protocol:" + protocol);
	if(protocol == undefined || protocol == "")
	{
		return "";
	}
	
	var prefix = "";
	switch(protocol)
	{
	case "svn":
		prefix = "svn://";
		break;
	case "git":
		prefix = "git://";
		break;
	case "mxsdoc":
		prefix = "mxsdoc://";
		break;
	}
	
    var remoteStorage = MyJquery.getValue("remoteStorage"); //remoteStorage
	var autoPull = MyJquery.isChecked("remoteStorage-autoPull");
	var autoPullForce = MyJquery.isChecked("remoteStorage-autoPullForce");
	var autoPush = MyJquery.isChecked("remoteStorage-autoPush");
	var autoPushForce = MyJquery.isChecked("remoteStorage-autoPushForce");
    if(remoteStorage != undefined && remoteStorage != "")
	{
    	remoteStorage += ";autoPull=" + autoPull + ";autoPullForce=" + autoPullForce + ";autoPush=" + autoPush + ";autoPushForce=" + autoPushForce;
		remoteStorage = prefix + remoteStorage;
	}
    console.log("getRemoteStorageConfig remoteStorage:" + remoteStorage);
	return remoteStorage;
}	

/********* 自动备份设置 *****************/
function doSelectAutoBackupConfigEanble()
{
	var autoBackupEnable = MyJquery.isChecked("autoBackupEnable");
	console.log("doSelectAutoBackupConfigEanble autoBackupEnable:" + autoBackupEnable);
	if(autoBackupEnable == 0)
	{
		MyJquery.hide("autoBackupConfigDiv");
	}
	else
	{	
		MyJquery.show("autoBackupConfigDiv");
	}		
}

function doSelectLocalBackupEnable()
{
	var localBackupEnable = MyJquery.isChecked("localBackupEnable");
	console.log("doSelectLocalBackupEnable localBackupEnable:" + localBackupEnable);
	if(localBackupEnable == 0)
	{
		MyJquery.hide("localBackupConfig");
	}
	else
	{	
		MyJquery.show("localBackupConfig");
	}		
}

function doSelectRemoteBackupEnable()
{
	var remoteBackupEnable = MyJquery.isChecked("remoteBackupEnable");
	console.log("doSelectRemoteBackupEnable remoteBackupEnable:" + remoteBackupEnable);
	if(remoteBackupEnable == 0)
	{
		MyJquery.hide("remoteBackupConfig");
	}
	else
	{	
		MyJquery.show("remoteBackupConfig");
	}		
}

function doSelectRemoteBackupStorageProtocol()
{
	var protocol = MyJquery.getValue("remoteBackupStorageProtocol");
	console.log("doSelectRemoteBackupStorageProtocol protocol:" + protocol);
	if(protocol == undefined || protocol == "")
	{
		MyJquery.hide("remoteBackupStorageConfig");
		return;
	}
	
	var placehoder = getPlacehoderForRemoteStorageProtocol(protocol);
	$("#remoteBackupStorage").attr('placeholder', placehoder);
	MyJquery.show("remoteBackupStorageConfig");
}

/** 异地备份高级选项 **/
function doSelectRemoteBackupFilterEnable()
{
	var enable = MyJquery.isChecked("remoteBackupFilterEnable");
	console.log("doSelectRemoteBackupFilterEnable enable:" + enable);
	if(enable == 0)
	{
		MyJquery.hide("remoteBackupFilterConfig");
	}
	else
	{	
		MyJquery.show("remoteBackupFilterConfig");
	}
}

function getTextSearchConfig()
{   
    var isTextSearchEnabled = $("#dialog-new-repos input[name='isTextSearchEnabled']").is(':checked')? 1: 0;
	console.log("getTextSearchConfig isTextSearchEnabled:" + isTextSearchEnabled);
	var config = "{enable:" + isTextSearchEnabled + "}";
	return config;
}

function getAutoBackupConfig()
{   
	var autoBackupEnable = MyJquery.isChecked("autoBackupEnable");
	console.log("getAutoBackupConfig autoBackupEnable:" + autoBackupEnable);
	if(autoBackupEnable == 0)
	{
		return "{localBackup:{},remoteBackup:{}}";
	}
	
	var localBackupConfig = getLocalBackupConfig();
	var remoteBackupConfig = getRemoteBackupConfig();
	return "{localBackup:" + localBackupConfig + ",remoteBackup:" + remoteBackupConfig + "}";
}
	
function getLocalBackupConfig()
{
	var localBackupEnable = MyJquery.isChecked("localBackupEnable");
	console.log("getLocalBackupConfig localBackupEnable:" + localBackupEnable);
	if(localBackupEnable == 0)
	{
		return "{}";
	}
	
	var localRootPath = $("#dialog-new-repos input[name='localBackupRootPath']").val();
	if(localRootPath == undefined || localRootPath == "")
	{
		return "{}";
	}

	var backupTime = MyJquery.getValue("localBackupTime");
    var weekDay1 = MyJquery.isChecked("localBackupWeekDay1");
    var weekDay2 = MyJquery.isChecked("localBackupWeekDay2");
    var weekDay3 = MyJquery.isChecked("localBackupWeekDay3");
    var weekDay4 = MyJquery.isChecked("localBackupWeekDay4");
    var weekDay5 = MyJquery.isChecked("localBackupWeekDay5");
    var weekDay6 = MyJquery.isChecked("localBackupWeekDay6");
    var weekDay7 = MyJquery.isChecked("localBackupWeekDay7");
    var realTimeBackup = MyJquery.isChecked("localBackup-realTimeBackupEnable");
	var localBackupConfig = 
	"{" +
		"backupTime:" + backupTime + "," +
		"weekDay1:" + weekDay1 +"," + 
		"weekDay2:" + weekDay2 +"," + 
		"weekDay3:" + weekDay3 +"," + 
		"weekDay4:" + weekDay4 +"," + 
		"weekDay5:" + weekDay5 +"," + 
		"weekDay6:" + weekDay6 +"," + 
		"weekDay7:" + weekDay7 +"," + 
		"realTimeBackup:" + realTimeBackup + "," +
		"localRootPath:\"" + localRootPath + "\"" +
	"}";
	return localBackupConfig;
}

function getRemoteBackupConfig()
{
	var remoteBackupEnable = MyJquery.isChecked("remoteBackupEnable");
	console.log("getRemoteBackupConfig remoteBackupEnable:" + remoteBackupEnable);
	if(remoteBackupEnable == 0)
	{
		return "{}";
	}
	
	var remoteStorage = getRemoteBackupRemoteStorageConfig();
	if(remoteStorage == "")
	{
		return "{}";
	}
	
	var backupTime = MyJquery.getValue("remoteBackupTime");
    var weekDay1 = MyJquery.isChecked("remoteBackupWeekDay1");
    var weekDay2 = MyJquery.isChecked("remoteBackupWeekDay2");
    var weekDay3 = MyJquery.isChecked("remoteBackupWeekDay3");
    var weekDay4 = MyJquery.isChecked("remoteBackupWeekDay4");
    var weekDay5 = MyJquery.isChecked("remoteBackupWeekDay5");
    var weekDay6 = MyJquery.isChecked("remoteBackupWeekDay6");
    var weekDay7 = MyJquery.isChecked("remoteBackupWeekDay7");
    var realTimeBackup = MyJquery.isChecked("remoteBackup-realTimeBackupEnable");
    //高级选项
    var isUnkownFileAllowed = "";
    var allowedMaxFile = "";
    var allowedFileTypeList = "";
    var notAllowedFileTypeList = "";
    var notAllowedFileList = "";
	var remoteBackupFilterEnable = MyJquery.isChecked("remoteBackupFilterEnable");
	console.log("getRemoteBackupConfig remoteBackupFilterEnable:" + remoteBackupFilterEnable);
	if(remoteBackupFilterEnable == 1)
	{
		isUnkownFileAllowed = MyJquery.isChecked("remoteBackup-isUnkownFileAllowed");
	    allowedMaxFile = MyJquery.getValue("remoteBackup-allowedMaxFile");
	    allowedFileTypeList = MyJquery.getValue("remoteBackup-allowedFileTypeList");
	    notAllowedFileTypeList = MyJquery.getValue("remoteBackup-notAllowedFileTypeList");
	    notAllowedFileList = MyJquery.getValue("remoteBackup-notAllowedFileList");
	}
    
    var remoteBackupConfig = 
	"{" +
		"backupTime:" + backupTime + ","  + 
		"weekDay1:" + weekDay1 +"," + 
		"weekDay2:" + weekDay2 +"," + 
		"weekDay3:" + weekDay3 +"," + 
		"weekDay4:" + weekDay4 +"," + 
		"weekDay5:" + weekDay5 +"," + 
		"weekDay6:" + weekDay6 +"," + 
		"weekDay7:" + weekDay7 +"," + 
		"realTimeBackup:" + realTimeBackup + "," +
		"isUnkownFileAllowed:\"" + isUnkownFileAllowed + "\"," +
		"allowedMaxFile:\"" + allowedMaxFile + "\"," +
		"allowedFileTypeList:\"" + allowedFileTypeList + "\"," +
		"notAllowedFileTypeList:\"" + notAllowedFileTypeList + "\"," +
		"notAllowedFileList:\"" + notAllowedFileList + "\"," +
		"remoteStorage:\"" + remoteStorage + "\"" +
	"}";
	
	return remoteBackupConfig;
}

function getRemoteBackupRemoteStorageConfig()
{
	var protocol = $("#dialog-new-repos select[name='remoteBackupStorageProtocol']").val();
	console.log("getRemoteBackupRemoteStorageConfig protocol:" + protocol);
	if(protocol == undefined || protocol == "")
	{
		return "";
	}
	
	var prefix = "";
	switch(protocol)
	{
	case "svn":
		prefix = "svn://";
		break;
	case "git":
		prefix = "git://";
		break;
	case "mxsdoc":
		prefix = "mxsdoc://";
		break;
	}
	
    var remoteStorage = MyJquery.getValue("remoteBackupStorage");	//remoteStorage
    if(remoteStorage != undefined && remoteStorage != "")
	{
    	remoteStorage = prefix + remoteStorage;
	}
    console.log("getRemoteBackupRemoteStorageConfig remoteStorage:" + remoteStorage);
	return remoteStorage;
}

function doRemoteSeverTest()
{
	console.log("doRemoteSeverTest()");

	var config = getRemoteServerConfig();
	console.log("doRemoteSeverTest() config:", config);
	
	remoteStorageServerTest(config, "RemoteServer");
}

function doRemoteStorageTest()
{
	console.log("doRemoteStorageTest()");

	var config = getRemoteStorageConfig();
	console.log("doRemoteStorageTest() config:", config);
	
	remoteStorageServerTest(config, "RemoteStorage");
}

function doRemoteBackupStorageTest()
{
	console.log("doRemoteBackupStorageTest()");

	var config = getRemoteBackupRemoteStorageConfig();
	console.log("doRemoteBackupStorageTest() config:", config);
	
	remoteStorageServerTest(config, "RemoteBackupStorage");
}

function doVerReposTest()
{
	console.log("doVerReposTest()");
	
	var verCtrl = MyJquery.getValue("repos-verCtrl");
    var url = MyJquery.getValue("verCtrl-svnPath");
    var user = MyJquery.getValue("verCtrl-svnUser");
    var pwd = MyJquery.getValue("verCtrl-svnPwd");
	console.log("doVerReposTest() verCtrl:" + verCtrl + " url:" + url + " user:" +user + " pwd:" + pwd);
	
	var prefix = "";
	switch(verCtrl)
	{
	case "1":
		prefix = "svn://";
		break;
	case "2":
		prefix = "git://";
		break;
	default:
		break;
	}
	
	var config = prefix + url + ";userName=" + user + ";pwd=" + pwd;
	console.log("doVerReposTest() config:" + config);

	remoteStorageServerTest(config, "VerRepos");
}

function remoteStorageServerTest(config, type)
{
	console.log("remoteStorageServerTest() config:" + config);
    $.ajax({
        url : "/DocSystem/Repos/remoteStorageTest.do",
        type : "post",
        dataType : "json",
        data : {
            config : config,
        	type: type,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	showErrorMessage("<font color='green'><strong>测试成功</strong></font><br/><br/>" + ret.msgInfo);
            }
            else
            {
            	showErrorMessage("<font color='red'><strong>测试失败</strong></font><br/><br/>" + ret.msgInfo);
            }
        },
        error : function () {
           	showErrorMessage('测试失败:服务器异常！');
        }
	});
}
