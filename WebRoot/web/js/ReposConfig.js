//ReposConfig类
var ReposConfig = (function () {
	var reposId;
	var gCurReposInfo;
	
	function addReposPageInit()
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
	
	function editReposPageInit(_reposId, _reposInfo)
	{
		console.log("editReposPageInit() _reposId:" + _reposId + " _reposInfo:", _reposInfo);
		reposId = _reposId;
		if(_reposInfo)
		{
			gCurReposInfo = _reposInfo;
			showReposBasicSetting(gCurReposInfo);
		}
		else
		{
			getReposBasicSetting();			
		}
	}
	
	function getReposBasicSetting()
	{
		console.log("getReposBasicSetting");
	    $.ajax({
	           url : "/DocSystem/Repos/getRepos.do",
	           type : "post",
	           dataType : "json",
	           data : {
	               vid : reposId,
	           },
	           success : function (ret) {
	               if( "ok" == ret.status ){
	               		gCurReposInfo = ret.data;
	               		console.log("gCurReposInfo", gCurReposInfo);
	               		showReposBasicSetting(ret.data);
	               }else {
						showErrorMessage(ret.msgInfo);
	               }
	           },
	           error : function () {
	               showErrorMessage("服务器异常:获取仓库信息失败");
	           }
	    });
	}   

	//编辑页面初始化代码 Start	
	function showReposBasicSetting(reposInfo)
	{
	   	$("#repos-name").val(reposInfo.name);
	   	$("#repos-info").val(reposInfo.info);
	   	$("#repos-path").val(reposInfo.path);
	   	
	   	if(reposInfo.type == 1 || reposInfo.type == 2)
	   	{
	   		$("#repos-type").get(0).selectedIndex=0;	//文件管理系统
	   	}
	   	else
	   	{
	   		$("#repos-type").get(0).selectedIndex=1;	//文件服务器前置
	   	}
	   	
	   	//文件存储路径显示
	   	showReposStorageRealDocPath(reposInfo);
	   	
	   	//文件服务器前置
	   	showRemoteServerConfig(reposInfo);
	   	
	   	//远程存储
	   	showRemoteStorageConfig(reposInfo);
	   	
	   	//版本管理
	   	if(reposInfo.verCtrl == 0)
	   	{
	   		$("#verCtrlEnable").attr("checked",false);
	   		$("#verCtrlConfigDiv").hide();		//隐藏 高级选项
	   		$("#showVerCtrlConfig").hide();	//隐藏 高级选项提示
	   		$("#showVerCtrlConfig").val(0);
	   		$("#showVerCtrlConfig").text("显示高级选项");
	   	}
	   	else
	   	{	
	   		$("#verCtrlEnable").attr("checked","checked");
	   		$("#verCtrlConfigDiv").hide();			//隐藏 高级选项
	   		$("#showVerCtrlConfig").show();		//显示 高级选项提示
	   		$("#showVerCtrlConfig").val(0);
	   		$("#showVerCtrlConfig").text("显示高级选项");						
	   	}
	   	$("#repos-verCtrl option[value='"+reposInfo.verCtrl+"']").attr("selected","selected");
	   	if(reposInfo.isRemote == 0)
	   	{
		   	$("#verCtrl-isRemote").attr("checked",false);
	   	}
	   	else
	   	{
		   	$("#verCtrl-isRemote").attr("checked","checked");
	   	}
	   	$("#verCtrl-localSvnPath").val(reposInfo.localSvnPath);
	   	$("#verCtrl-svnPath").val(reposInfo.svnPath);
	   	$("#verCtrl-svnUser").val(reposInfo.svnUser);
	   	$("#verCtrl-svnPwd").val(reposInfo.svnPwd);
	   	
	   	//备注版本管理
	   	$("#repos-verCtrl1 option[value='"+reposInfo.verCtrl1+"']").attr("selected","selected");
	   	if(reposInfo.isRemote1 == 0)
	   	{
		   	$("#verCtrl1-isRemote").attr("checked",false);	   		
	   	}
	   	else
	   	{
		   	$("#verCtrl1-isRemote").attr("checked","checked");
	   	}
	   	$("#verCtrl1-localSvnPath").val(reposInfo.localSvnPath1);
	   	$("#verCtrl1-svnPath").val(reposInfo.svnPath1);
	   	$("#verCtrl1-svnUser").val(reposInfo.svnUser1);
	   	$("#verCtrl1-svnPwd").val(reposInfo.svnPwd1);
		
	   	//全文搜索
	    showTextSearchConfig(reposInfo);
	   	
	   	//文件加密
	   	if(reposInfo.encryptType == 0)
	   	{
		   	$("#isEncryptEnabled").attr("checked",false);
	   	}
	   	else
	   	{
		   	$("#isEncryptEnabled").attr("checked","checked");
	   	}
	   	
	   	//自动备份
	   	showAutoBackupConfig(reposInfo);
	   	
	   	//初始化显示
	   	doSelectFS();
	}
	
	/** 文件存储位置设置 **/
	function showReposStorageRealDocPath(reposInfo)
	{
	   	if(reposInfo.realDocPath == null || reposInfo.realDocPath == "")
	   	{
			$("#reposStorageRealDocPathEnable").attr("checked",false);
	   		$("#reposStorageRealDocPathConfig").hide();
	   	}
	   	else
	   	{
	   		$("#reposStorageRealDocPathEnable").attr("checked","checked");
			$("#reposStorageRealDocPathConfig").show();
	   		$("#repos-realDocPath").val(reposInfo.realDocPath);
	   	}	
	}
	
	/*** 文件服务器前置 ****/
	function showRemoteServerConfig(reposInfo)
	{
		if(reposInfo.remoteServerConfig == undefined)
	   	{
			$("#remoteServerDiv").hide();
			$("#remoteServerProtocol option[value='']").attr("selected","selected");		
			return;
	   	}
		
		var protocol = reposInfo.remoteServerConfig.protocol;
		if(protocol == undefined || protocol == "")
		{
			$("#remoteServerProtocol option[value='']").attr("selected","selected");			
			$("#remoteServerDiv").hide();
			return;
		}
		
		$("#remoteServerDiv").show();			
		$("#remoteServerProtocol option[value='" + protocol + "']").attr("selected","selected");	
		
		var remoteServer = buildRemoteStorageConfigStr(reposInfo.remoteServerConfig);
		$("#remoteServer").val(remoteServer);
	}
	
	/*** 远程存储 ****/
	function showRemoteStorageConfig(reposInfo)
	{
		if(reposInfo.remoteStorageConfig == undefined)
	   	{
	    	$("#remoteStorageConfigDiv").hide();
	       	$("#remoteStorageConfigEnable").attr("checked",false);
			
			$("#remoteStorageProtocolConfig").hide();
			$("#remoteStorageProtocol option[value='']").attr("selected","selected");		
			return;
	   	}
		
		$("#remoteStorageConfigDiv").show();
	   	$("#remoteStorageConfigEnable").attr("checked","checked");
	   	
		var protocol = reposInfo.remoteStorageConfig.protocol;
		if(protocol == undefined || protocol == "")
		{
			$("#remoteStorageProtocol option[value='']").attr("selected","selected");			
			$("#remoteStorageProtocolConfig").hide();
			return;
		}
		
		$("#remoteStorageProtocolConfig").show();			
		$("#remoteStorageProtocol option[value='" + protocol + "']").attr("selected","selected");	
		
		var remoteStorage =  buildRemoteStorageConfigStr(reposInfo.remoteStorageConfig);
		$("#remoteStorage").val(remoteStorage);
		
	   	if(reposInfo.remoteStorageConfig.autoPull != undefined && reposInfo.remoteStorageConfig.autoPull == 1)
	   	{
	   		$("#remoteStorage-autoPull").attr("checked","checked");
	   	}
	   	else
	   	{
	   		$("#remoteStorage-autoPull").attr("checked",false);
	   	}
	   		
	   	if(reposInfo.remoteStorageConfig.autoPullForce != undefined && reposInfo.remoteStorageConfig.autoPullForce == 1)
	   	{
			$("#remoteStorage-autoPullForce").attr("checked","checked");
	   	}
	   	else
	   	{
	   		$("#remoteStorage-autoPullForce").attr("checked",false);
	   	}
	   		
	   	if(reposInfo.remoteStorageConfig.autoPush != undefined && reposInfo.remoteStorageConfig.autoPush == 1)
	   	{
	   		$("#remoteStorage-autoPush").attr("checked","checked");
	   	}
	   	else
	   	{
			$("#remoteStorage-autoPush").attr("checked",false);
	   	}
	   	
	   	if(reposInfo.remoteStorageConfig.autoPushForce != undefined && reposInfo.remoteStorageConfig.autoPushForce == 1)
	   	{
	   		$("#remoteStorage-autoPushForce").attr("checked","checked");
	   	}
	   	else
	   	{
	   		$("#remoteStorage-autoPushForce").attr("checked",false);
	   	}
	}
	
	/****** 全文搜索  *****/
	function showTextSearchConfig(reposInfo)
	{	
		console.log("showTextSearchConfig textSearchConfig:", reposInfo.textSearchConfig);
		if(reposInfo.textSearchConfig == undefined)
	   	{
			$("#isTextSearchEnabled").attr("checked",false);
	   	}
		else
		{
			var enable = reposInfo.textSearchConfig.enable;
			if(enable == undefined || enable == false)
			{
				$("#isTextSearchEnabled").attr("checked",false);
			}
			else
			{
				$("#isTextSearchEnabled").attr("checked","checked");
			}
		}
		
		reposInfo.textSearch = getTextSearchConfig();
		console.log("reposInfo.textSearch:" + reposInfo.textSearch);
	}
	
	/******* 自动备份 *************/
	function showAutoBackupConfig(reposInfo)
	{
		if(reposInfo.backupConfig == undefined)
	   	{
			$("#autoBackupConfigDiv").hide();
	   		$("#autoBackupEnable").attr("checked",false);
		}
		else
		{	
			if(reposInfo.backupConfig.localBackupConfig == undefined && 
				reposInfo.backupConfig.remoteBackupConfig == undefined)
			{
				$("#autoBackupConfigDiv").hide();
		   		$("#autoBackupEnable").attr("checked",false);
			}
			else
			{
				
				$("#autoBackupConfigDiv").show();
				$("#autoBackupEnable").attr("checked", "checked");
				
				showLocalBackupConfig(reposInfo.backupConfig.localBackupConfig);
				showRemoteBackupConfig(reposInfo.backupConfig.remoteBackupConfig);
			}
		}
		
		//init autoBackup
		reposInfo.autoBackup = getAutoBackupConfig();
		console.log("reposInfo.autoBackup:" + reposInfo.autoBackup);
	}

	function showLocalBackupConfig(localBackupConfig)
	{
		if(localBackupConfig == undefined)
	   	{
			$("#localBackupConfig").hide();
	   		$("#localBackupEnable").attr("checked",false);
			return;
	   	}
		
		$("#localBackupConfig").show();
		$("#localBackupEnable").attr("checked", "checked");	
		
		if(localBackupConfig.remoteStorageConfig && localBackupConfig.remoteStorageConfig.FILE &&  localBackupConfig.remoteStorageConfig.FILE.localRootPath)
		{
			$("#localBackupRootPath").val(localBackupConfig.remoteStorageConfig.FILE.localRootPath);
		}
		
		if(localBackupConfig.backupTime)
		{
			$("#localBackupTime option[value='" + localBackupConfig.backupTime + "']").attr("selected","selected");	
		}
		
		if(localBackupConfig.realTimeBackup == undefined || localBackupConfig.realTimeBackup == 0)
		{
			$("#localBackup-realTimeBackupEnable").attr("checked", false);		
		}	
		else
		{
			$("#localBackup-realTimeBackupEnable").attr("checked", "checked");				
		}
		
		if(localBackupConfig.weekDay1 == undefined || localBackupConfig.weekDay1 == 0)
		{	
			$("#localBackupWeekDay1").attr("checked", false);
		}
		else
		{
			$("#localBackupWeekDay1").attr("checked", "checked");		
		}
		
		if(localBackupConfig.weekDay2 == undefined || localBackupConfig.weekDay2 == 0)
		{	
			$("#localBackupWeekDay2").attr("checked", false);
		}
		else
		{
			$("#localBackupWeekDay2").attr("checked", "checked");		
		}
		
		if(localBackupConfig.weekDay3 == undefined || localBackupConfig.weekDay3 == 0)
		{	
			$("#localBackupWeekDay3").attr("checked", false);
		}
		else
		{
			$("#localBackupWeekDay3").attr("checked", "checked");		
		}
		
		if(localBackupConfig.weekDay4 == undefined || localBackupConfig.weekDay4 == 0)
		{	
			$("#localBackupWeekDay4").attr("checked", false);
		}
		else
		{
			$("#localBackupWeekDay4").attr("checked", "checked");		
		}
		
		if(localBackupConfig.weekDay5 == undefined || localBackupConfig.weekDay5 == 0)
		{	
			$("#localBackupWeekDay5").attr("checked", false);
		}
		else
		{
			$("#localBackupWeekDay5").attr("checked", "checked");		
		}
		
		if(localBackupConfig.weekDay6 == undefined || localBackupConfig.weekDay6 == 0)
		{	
			$("#localBackupWeekDay6").attr("checked", false);
		}
		else
		{
			$("#localBackupWeekDay6").attr("checked", "checked");		
		}
		
		if(localBackupConfig.weekDay7 == undefined || localBackupConfig.weekDay7 == 0)
		{	
			$("#localBackupWeekDay7").attr("checked", false);
		}
		else
		{
			$("#localBackupWeekDay7").attr("checked", "checked");		
		}
	}

	function showRemoteBackupConfig(remoteBackupConfig)
	{
		if(remoteBackupConfig == undefined)
	   	{
			$("#remoteBackupConfig").hide();
	   		$("#remoteBackupEnable").attr("checked",false);
			return;
	   	}
		
		if(remoteBackupConfig.remoteStorageConfig == undefined)
	   	{
			$("#remoteBackupStorageConfig").hide();
			$("#remoteBackupStorageProtocol option[value='']").attr("selected","selected");		
			return;
	   	}
		
		$("#remoteBackupConfig").show();
		$("#remoteBackupEnable").attr("checked", "checked");
		
		showRemoteBackupRemoteStorageConfig(remoteBackupConfig.remoteStorageConfig);
		
		var backupTime = remoteBackupConfig.backupTime;
		console.log("showRemoteBackupConfig() backupTime:" + backupTime);
		if(backupTime)
		{
			$("#remoteBackupTime option[value='" + backupTime + "']").attr("selected","selected");		
		}
		
		if(remoteBackupConfig.realTimeBackup == undefined || remoteBackupConfig.realTimeBackup == 0)
		{
			$("#remoteBackup-realTimeBackupEnable").attr("checked", false);		
		}	
		else
		{
			$("#remoteBackup-realTimeBackupEnable").attr("checked", "checked");				
		}
		
		if(remoteBackupConfig.weekDay1 == undefined || remoteBackupConfig.weekDay1 == 0)
		{	
			$("#remoteBackupWeekDay1").attr("checked", false);
		}
		else
		{
			$("#remoteBackupWeekDay1").attr("checked", "checked");		
		}
		
		if(remoteBackupConfig.weekDay2 == undefined || remoteBackupConfig.weekDay2 == 0)
		{	
			$("#remoteBackupWeekDay2").attr("checked", false);
		}
		else
		{
			$("#remoteBackupWeekDay2").attr("checked", "checked");		
		}
		
		if(remoteBackupConfig.weekDay3 == undefined || remoteBackupConfig.weekDay3 == 0)
		{	
			$("#remoteBackupWeekDay3").attr("checked", false);
		}
		else
		{
			$("#remoteBackupWeekDay3").attr("checked", "checked");		
		}
		
		if(remoteBackupConfig.weekDay4 == undefined || remoteBackupConfig.weekDay4 == 0)
		{	
			$("#remoteBackupWeekDay4").attr("checked", false);
		}
		else
		{
			$("#remoteBackupWeekDay4").attr("checked", "checked");		
		}
		
		if(remoteBackupConfig.weekDay5 == undefined || remoteBackupConfig.weekDay5 == 0)
		{	
			$("#remoteBackupWeekDay5").attr("checked", false);
		}
		else
		{
			$("#remoteBackupWeekDay5").attr("checked", "checked");		
		}
		
		if(remoteBackupConfig.weekDay6 == undefined || remoteBackupConfig.weekDay6 == 0)
		{	
			$("#remoteBackupWeekDay6").attr("checked", false);
		}
		else
		{
			$("#remoteBackupWeekDay6").attr("checked", "checked");		
		}
		
		if(remoteBackupConfig.weekDay7 == undefined || remoteBackupConfig.weekDay7 == 0)
		{	
			$("#remoteBackupWeekDay7").attr("checked", false);
		}
		else
		{
			$("#remoteBackupWeekDay7").attr("checked", "checked");		
		}
		
		//显示高级选项
		showRemoteBackFilterConfig(remoteBackupConfig);
	}

	function showRemoteBackFilterConfig(remoteBackupConfig)
	{
		console.log("showRemoteBackFilterConfig remoteBackupConfig:", remoteBackupConfig);
		if(remoteBackupConfig.remoteStorageConfig == undefined)
		{
			return;
		}
		
		var remoteStorageConfig = remoteBackupConfig.remoteStorageConfig;
		
		var remoteBackupFilterEnable = 0;
		
		if(remoteStorageConfig.isUnkownFileAllowed != undefined)
		{
			remoteBackupFilterEnable = 1;
			if(remoteStorageConfig.isUnkownFileAllowed == 0)
			{
	   			$("#remoteBackup-isUnkownFileAllowed").attr("checked", false);		
			}
			else
			{
	   			$("#remoteBackup-isUnkownFileAllowed").attr("checked","checked");		
			}
		}
		else
		{
			$("#remoteBackup-isUnkownFileAllowed").attr("checked","checked");
		}
		
		if(remoteStorageConfig.allowedMaxFile != undefined)
		{
			remoteBackupFilterEnable = 1;
			$("#remoteBackup-allowedMaxFile option[value='" + remoteStorageConfig.allowedMaxFile + "']").attr("selected","selected");	
		}
		else
		{
			$("#remoteBackup-allowedMaxFile option[value='0']").attr("selected","selected");			
		}
		
		if(remoteStorageConfig.allowedFileTypeHashMap)
		{
			remoteBackupFilterEnable = 1;	
			var allowedFileTypeList = getAllowedFileTypeList(remoteStorageConfig.allowedFileTypeHashMap);
			$("#remoteBackup-allowedFileTypeList").val(allowedFileTypeList);
		}
		
		if(remoteStorageConfig.notAllowedFileTypeHashMap)
		{
			remoteBackupFilterEnable = 1;
			var notAllowedFileTypeList = getNotAllowedFileTypeList(remoteStorageConfig.notAllowedFileTypeHashMap);
			$("#remoteBackup-notAllowedFileTypeList").val(notAllowedFileTypeList);
		}
		
		if(remoteStorageConfig.notAllowedFileHashMap)
		{
			remoteBackupFilterEnable = 1;
			var notAllowedFileList = getNotAllowedFileList(remoteStorageConfig.notAllowedFileHashMap);
			$("#remoteBackup-notAllowedFileList").val(notAllowedFileList);
		}
		
		if(remoteBackupFilterEnable == 0)
		{
			//隐藏高级选项
			$("#remoteBackupFilterConfig").hide();
	   		$("#remoteBackupFilterEnable").attr("checked",false);
		}
		else
		{
			//显示高级选项
			$("#remoteBackupFilterConfig").show();
	   		$("#remoteBackupFilterEnable").attr("checked","checked");		
		}
	}
	
	function getAllowedFileTypeList(allowedFileTypeHashMap)
	{
		var listStr = "";
		for(var key in allowedFileTypeHashMap)
		{
			listStr += key + ";"
		}
		return listStr;
	}

	function getNotAllowedFileTypeList(notAllowedFileTypeHashMap)
	{
		var listStr = "";
		for(var key in notAllowedFileTypeHashMap)
		{
			listStr += key + ";"
		}
		return listStr;
	}

	function getNotAllowedFileList(notAllowedFileHashMap)
	{
		var listStr = "";
		for(var key in notAllowedFileHashMap)
		{
			listStr += key + ";"
		}
		return listStr;
	}

	function showRemoteBackupRemoteStorageConfig(remoteStorageConfig)
	{
		var protocol = remoteStorageConfig.protocol;
		if(protocol == undefined || protocol == "")
		{
			$("#remoteBackupStorageConfig").hide();
			$("#remoteBackupStorageProtocol option[value='']").attr("selected","selected");			
			return;
		}
		
		$("#remoteBackupStorageConfig").show();			
		$("#remoteBackupStorageProtocol option[value='" + protocol + "']").attr("selected","selected");	
		
		var remoteStorage = buildRemoteStorageConfigStr(remoteStorageConfig);
		$("#remoteBackupStorage").val(remoteStorage);
	}
	//编辑页面初始化代码 End	
		
	
	function saveReposBasicSetting()
	{
		console.log("saveReposBasicSetting");
		var newReposSetting = [];
		newReposSetting.vid = reposId;
		newReposSetting.name = $("#repos-name").val();
		newReposSetting.info = $("#repos-info").val();
		newReposSetting.type =  $("#repos-type").val();	//Real DocSystem
		newReposSetting.path = $("#repos-path").val();
		newReposSetting.realDocPath = $("#repos-realDocPath").val();
		var remoteServer = getRemoteServerConfig();
		newReposSetting.remoteServer = remoteServer;
		var remoteStorage = getRemoteStorageConfig();
		newReposSetting.remoteStorage = remoteStorage;
		var autoBackup = getAutoBackupConfig();
		newReposSetting.autoBackup = autoBackup;
		console.log("newReposSetting.autoBackup:" + autoBackup);

		newReposSetting.verCtrl = $("#repos-verCtrl").val();
		newReposSetting.isRemote =  $("#verCtrl-isRemote").is(':checked')? 1: 0;
		newReposSetting.localSvnPath = $("#verCtrl-localSvnPath").val();
		newReposSetting.svnPath = $("#verCtrl-svnPath").val();
		newReposSetting.svnUser = $("#verCtrl-svnUser").val();
		newReposSetting.svnPwd = $("#verCtrl-svnPwd").val();
		newReposSetting.verCtrl1 = $("#repos-verCtrl1").val();
		newReposSetting.isRemote1 =  $("#verCtrl1-isRemote").is(':checked')? 1: 0;
		newReposSetting.localSvnPath1 = $("#verCtrl1-localSvnPath").val();
		newReposSetting.svnPath1 = $("#verCtrl1-svnPath").val();
		newReposSetting.svnUser1 = $("#verCtrl1-svnUser").val();
		newReposSetting.svnPwd1 = $("#verCtrl1-svnPwd").val();
		
		var textSearch = getTextSearchConfig();
		newReposSetting.textSearch = textSearch;
		console.log("newReposSetting.textSearch:" + textSearch);
		
		newReposSetting.encryptType =  $("#isEncryptEnabled").is(':checked')? 1: 0;
	    //default to set VirtualDoc VersionControl as GIT
	    if(newReposSetting.verCtrl1 == 0)
	    {
	    	newReposSetting.verCtrl1 = 2;
	    }
	    
		console.log(newReposSetting);
		
		if(newReposSetting.isRemote == 0)
		{
			newReposSetting.localSvnPath = newReposSetting.path + "DocSysVerReposes/";
		}
		
		if(newReposSetting.isRemote1 == 0)
		{
			newReposSetting.localSvnPath1 = newReposSetting.path + "DocSysVerReposes/";        		
		}
		
		if(verifyReposSetting(gCurReposInfo,newReposSetting) == true)
		{	
	   		$.ajax({
	                url : "/DocSystem/Repos/updateReposInfo.do",
	                type : "post",
	                dataType : "json",
	                data : {
	                	reposId : newReposSetting.vid,
	                    name : newReposSetting.name,
	                    info : newReposSetting.info,
	                    type : newReposSetting.type,
	                    path : newReposSetting.path,
	                    realDocPath : newReposSetting.realDocPath,
	                    remoteServer : newReposSetting.remoteServer,
	                    remoteStorage : newReposSetting.remoteStorage,
	                    verCtrl : newReposSetting.verCtrl,
	                    isRemote : newReposSetting.isRemote,
	                    localSvnPath : newReposSetting.localSvnPath,
	                    svnPath : newReposSetting.svnPath,
	                    svnUser : newReposSetting.svnUser,
	                    svnPwd : newReposSetting.svnPwd,
	                    verCtrl1 : newReposSetting.verCtrl1,
	                    isRemote1 : newReposSetting.isRemote1,
	                    localSvnPath1 : newReposSetting.localSvnPath1,
	                    svnPath1 : newReposSetting.svnPath1,
	                    svnUser1 : newReposSetting.svnUser1,
	                    svnPwd1 : newReposSetting.svnPwd1,
	                    textSearch: newReposSetting.textSearch,
	                    encryptType: newReposSetting.encryptType,
	                    autoBackup : newReposSetting.autoBackup,                    
	                },
	                success : function (ret) {
	                	if(ret.status == "ok")
	                	{
	                		console.log("更新仓库设置成功");
	                		getReposBasicSetting();     
	                		// 普通消息提示条
							bootstrapQ.msg({
							msg : '设置完成！',
							type : 'success',
							time : 2000,
						    });
		                }
	                    else
	                    {
	                    	alert(ret.msgInfo);
	                    }
	                },
	                error : function () {
	                    alert('服务器异常: 设置失败');
	                }
	            });
	            return true;
	       }
	       else
	       {
	            return false;
	       }    
	       
	       function verifyReposSetting(oldSetting, newSetting)
	       {
	       		if(oldSetting.name != newSetting.name)
	       		{
	       			//alert("仓库名字不能修改");
	       			return true;
	       		}
	       		
	       		if(oldSetting.type != newSetting.type)
	       		{
	       			alert("仓库类型不能修改");
	       			return false;
	       		}
	       		
	       		if(oldSetting.path != newSetting.path)
	       		{
	       			return true;
	       		}
	       		
	       		if(oldSetting.realDocPath != newSetting.realDocPath)
	       		{
	       			return true;
	       		}

	       		if(oldSetting.remoteServer != newSetting.remoteServer)
	       		{
	       			return true;
	       		}
	       		
	       		if(oldSetting.remoteStorage != newSetting.remoteStorage)
	       		{
	       			return true;
	       		}
	       		
	       		if(oldSetting.info != newSetting.info)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.verCtrl != newSetting.verCtrl)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.isRemote != newSetting.isRemote)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.localSvnPath != newSetting.localSvnPath)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.svnPath != newSetting.svnPath)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.svnUser != newSetting.svnUser)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.svnPwd != newSetting.svnPwd)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.verCtrl1 != newSetting.verCtrl1)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.isRemote1 != newSetting.isRemote1)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.localSvnPath1 != newSetting.localSvnPath1)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.svnPath1 != newSetting.svnPath1)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.svnUser1 != newSetting.svnUser1)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.svnPwd1 != newSetting.svnPwd1)
	       		{
	       			return true;
	       		} 
	       		if(oldSetting.textSearch != newSetting.textSearch)
	       		{
	       			return true;
	       		}
	       		if(oldSetting.encryptType != newSetting.encryptType)
	       		{
	       			return true;
	       		}
	       		
	       		if(oldSetting.autoBackup != newSetting.autoBackup)
	       		{
	       			return true;
	       		}
	       		alert("仓库信息未变化！");
	       		return false;
	       }  
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
		var protocol = MyJquery.getValue("remoteBackupStorageProtocol");
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
	
	function showAddReposModal(){
		$(".addReposModal").fadeIn("slow");
	}
	
	function closeAddReposModal(){
		$(".addReposModal").fadeOut("slow");
	}
	
	//回车键监听函数
	function EnterKeyListenerForAddRepos(){
		console.log("start enter key listener");
		var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
	 	if (event.keyCode == 13){  
	 		doAddRepos();
	 	}  
	}
	
	function showEditReposModal(){
		$(".editReposModal").fadeIn("slow");
	}
	
	function closeEditReposModal(){
		$(".editReposModal").fadeOut("slow");
	}
	
	//回车键监听函数
	function EnterKeyListenerForEditRepos(){
		console.log("start enter key listener");
		var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
	 	if (event.keyCode == 13){  
	 		saveReposBasicSetting();
	 	}  
	}

	//开放给外部的调用接口
	return {
		addReposPageInit: function(){
			addReposPageInit();
	    },    
	    editReposPageInit: function(reposId, reposInfo){
	    	editReposPageInit(reposId, reposInfo);
	    },
	    EnterKeyListenerForAddRepos: function(){
			EnterKeyListenerForAddRepos();
	    },    
	    EnterKeyListenerForEditRepos: function(){
	    	EnterKeyListenerForEditRepos();
	    },	    
	    doSelectFS: function(){
	    	doSelectFS();
	    },    
	    doSelectRemoteServerProtocol: function(){
	    	doSelectRemoteServerProtocol();
	    },    
	    doRemoteSeverTest: function(){
	    	doRemoteSeverTest();
	    },    
	    doSelectReposStorageRealDocPathEnable: function(){
	    	doSelectReposStorageRealDocPathEnable();
	    },    
	    doSelectRemoteStorageConfigEnable: function(){
	    	doSelectRemoteStorageConfigEnable();
	    },    
	    doSelectRemoteStorageProtocol: function(){
	    	doSelectRemoteStorageProtocol();
	    },    
	    doRemoteStorageTest: function(){
	    	doRemoteStorageTest();
	    },    
	    doSelectVerCtrlEnable: function(){
	    	doSelectVerCtrlEnable();
	    },    
	    doSelectShowVerCtrlConfig: function(){
	    	doSelectShowVerCtrlConfig();
	    },    
	    doSelectVerCtrl: function(){
	    	doSelectVerCtrl();
	    },    
	    doVerReposTest: function(){
	    	doVerReposTest();
	    },    
	    doSetEncryptConfirm: function(){
	    	doSetEncryptConfirm();
	    },    
	    doSelectAutoBackupConfigEanble: function(){
	    	doSelectAutoBackupConfigEanble();
	    },    
	    doSelectLocalBackupEnable: function(){
	    	doSelectLocalBackupEnable();
	    },    
	    doSelectRemoteBackupEnable: function(){
	    	doSelectRemoteBackupEnable();
	    },    
	    doSelectRemoteBackupStorageProtocol: function(){
	    	doSelectRemoteBackupStorageProtocol();
	    },    
	    doRemoteBackupStorageTest: function(){
	    	doRemoteBackupStorageTest();
	    },    
	    doSelectRemoteBackupFilterEnable: function(){
	    	doSelectRemoteBackupFilterEnable();
	    },  
	    doAddRepos: function(){
	    	doAddRepos();
	    },  
	    cancelAddRepos: function(){
	    	cancelAddRepos();
	    },
	    saveReposBasicSetting: function(){
	    	saveReposBasicSetting();
	    },
	};
})();
