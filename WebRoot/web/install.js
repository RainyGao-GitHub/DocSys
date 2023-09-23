var login_user = "";	//用来保存刚才登录的用户
var gShareId;
var gToHref;
var authCode;
function pageInit()
{
	console.log("pageInit");
	authCode = getQueryString("authCode");
	console.log("pageInit authCode:" + authCode);
	
    //显示左侧菜单栏
    $('#menu').show();
    //根据url中的toHref信息确定需要显示的内容
    gToHref = getQueryString("toHref");
    if(!gToHref)
    {
    	//gToHref = "sysConfig";
    	gToHref = "dbConfig";
    }           
    
    console.log("gToHref:" + gToHref); 
    PageSwitch(gToHref);
}

// 从 url 中获取参数
function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

//Siwtch the display of page
function PageSwitch(page)
{
	console.log("PageSwitch:" + page);
	switch(page)
	{
   	case "sysConfig":
	    $("#sysConfigTag").addClass("active");
	    $("#sysConfig").show();

   		$("#dbConfigTag").removeClass("active");
	    $("#dbConfig").hide();
	    updateUrl(page);
	    sysConfigPageInit();
      	break;
    default:	//myInfo
	    $("#dbConfigTag").addClass("active");
	    $("#dbConfig").show();

	    $("#sysConfigTag").removeClass("active");
	    $("#sysConfig").hide();
		    updateUrl(page);
		    dbConfigPageInit();
	     	break;
	     }
	}
  
	function updateUrl(pageName)
    {
    	console.log("updateUrl() pageName:" + pageName);
	var param = {
			toHref : pageName,
            authCode : authCode,
        };
        var url = makeUrl(param);
		window.history.pushState({}, "wiki", url);
}

function makeUrl(params) {
    var href = window.location.href;
    var i = href.indexOf("?");
    if ( i< 0 ){
        i = href.length;
    }
    href = href.substring(0,i);

    var str = ""
    for( k in params ){
        if ( params[k]){ //params[k]
          str += "&" + k + "=" + params[k];
        }
    }
    return href + "?" + str.substr(1);
}

function docSysInit()
{
	console.log("sysConfigPageInit");
	$.ajax({
        url : "/DocSystem/Manage/docSysInit.do",
        type : "post",
        dataType : "json",
        data : {
        	authCode: authCode,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	if(ret.data && ret.data == "needRestart")
            	{
            		showErrorMessage(_Lang("数据库配置有变更，请先重启服务！"));	
            	}
            	else
            	{
            		//进入系统主页
            		window.location.href='/DocSystem/web/index.html';
            	}
            }
            else
            {
	        	showErrorMessage("系统初始化失败:" + ret.msgInfo);
            	console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("系统初始化失败", " : ", "服务器异常"));
        }
    });
}

//系统配置
var systemInfo = {
		version: "",
		tomcatPath: "",
		openOfficePath:"",
};

function enableSystemInfoSet(){
	$("#btnEnableSystemInfoSet").hide();
	$("#btnCancelSystemInfoSet").show();
	$("#btnSaveSystemInfoSet").show();
	$("#tomcatPath").val(systemInfo.tomcatPath);
	
	$("#tomcatPath").attr('disabled',false);
}

function cancelSystemInfoSet(){
	$("#btnEnableSystemInfoSet").show();
	$("#btnCancelSystemInfoSet").hide();
	$("#btnSaveSystemInfoSet").hide();
	//revert the value
	$("#tomcatPath").attr('disabled',true);
	$("#tomcatPath").val(systemInfo.tomcatPath);
}

function saveSystemInfoSet(){
	$("#btnEnableSystemInfoSet").show();
	$("#btnCancelSystemInfoSet").hide();
	$("#btnSaveSystemInfoSet").hide();
	//revert the value
	$("#tomcatPath").attr('disabled',true);

	var tomcatPath = $("#tomcatPath").val();
	updateSystemInfo(tomcatPath);
}

function updateSystemInfo(tomcatPath, openOfficePath){
	$.ajax({
        url : "/DocSystem/Manage/setSystemInfo.do",
        type : "post",
        dataType : "json",
        data : {
        	authCode: authCode,
        	tomcatPath: tomcatPath,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
        		systemInfo.tomcatPath = tomcatPath;
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("更新数据库配置信息失败", " : ", ret.msgInfo));
        		//restore the setting
        		$("#tomcatPath").val(systemInfo.tomcatPath);
	        }
        },
        error : function () {
            showErrorMessage(_Lang("更新数据库配置信息失败", " : ", "服务器异常"));
        	//restore the setting
    		$("#tomcatPath").val(systemInfo.tomcatPath);
        }
    });
}

function sysConfigPageInit(){
	console.log("sysConfigPageInit");
	$.ajax({
        url : "/DocSystem/Manage/getSystemInfo.do",
        type : "post",
        dataType : "json",
        data : {
        	authCode: authCode,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	var config = ret.data;
            	systemInfo.version = config.version;
            	systemInfo.tomcatPath = config.tomcatPath;
            	systemInfo.openOfficePath = config.openOfficePath;	            	
            	$("#version").val(systemInfo.version);
            	$("#tomcatPath").val(systemInfo.tomcatPath);
            }
            else
            {
	        	showErrorMessage(_Lang("获取系统信息失败", " : ", ret.msgInfo));
            	console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取系统信息失败", " : ", "服务器异常"));
        }
    });
}

function restartTomcat(){
	console.log("restartTomcat()");
	var tomcatPath = $("#tomcatPath").val();
	if(!tomcatPath || tomcatPath == "")
	{
		showErrorMessage(_Lang("错误", " : ", "未指定服务器路径！"));
		return;
	}
				
    qiao.bs.confirm({
    		id: "restartTomcatConfirmDialog",
	        title: _Lang("重启服务"),
	        msg: _Lang("是否重启服务") + "(" + tomcatPath + ")?",
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
			doRestartTomcat(tomcatPath);
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function doRestartTomcat(tomcatPath)
{
	console.log("doRestartTomcat tomcatPath:" + tomcatPath);
	$.ajax({
        url : "/DocSystem/Manage/restartServer.do",
        type : "post",
        dataType : "json",
        data : {
        	authCode: authCode,
        	tomcatPath: tomcatPath,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	showErrorMessage("重启成功!");
        	}
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage("重启失败:" + ret.msgInfo);
	        }
        },
        error : function () {
        	showErrorMessage("重启失败:服务器异常");
        }
    });
}

//系统数据库设置
var systemDbSetting = {
		type: "",
		url: "",
		user: "",
		pwd: "",
}
function enableSystemDBSet(){
	$("#btnEnableSystemDBSet").hide();
	$("#btnCancelSystemDBSet").show();
	$("#btnSaveSystemDBSet").show();
	
	$("#systemDbType").val(systemDbSetting.type);
	$("#systemDbUrl").val(systemDbSetting.url);
	$("#systemDbUser").val(systemDbSetting.user);
	$("#systemDbPwd").val(systemDbSetting.pwd);
	
	$("#systemDbType").attr('disabled',false);;
	$("#systemDbUrl").attr('disabled',false);;
	$("#systemDbUser").attr('disabled',false);
	$("#systemDbPwd").attr('disabled',false);
}

function cancelSystemDBSet(){
	$("#btnEnableSystemDBSet").show();
	$("#btnCancelSystemDBSet").hide();
	$("#btnSaveSystemDBSet").hide();
	
	//revert the value
	$("#systemDbType").attr('disabled',true);;
	$("#systemDbUrl").attr('disabled',true);;
	$("#systemDbUser").attr('disabled',true);
	$("#systemDbPwd").attr('disabled',true);
	
	$("#systemDbType").val(systemDbSetting.type);
	$("#systemDbUrl").val(systemDbSetting.url);
	$("#systemDbUser").val(systemDbSetting.user);
	$("#systemDbPwd").val(systemDbSetting.pwd);
}

function saveSystemDBSet(){
	$("#btnEnableSystemDBSet").show();
	$("#btnCancelSystemDBSet").hide();
	$("#btnSaveSystemDBSet").hide();
	//revert the value
	$("#systemDbType").attr('disabled',true);;
	$("#systemDbUrl").attr('disabled',true);;
	$("#systemDbUser").attr('disabled',true);
	$("#systemDbPwd").attr('disabled',true);
	
	var type = $("#systemDbType").val();
	var url = $("#systemDbUrl").val();
	var user = $("#systemDbUser").val();
	var pwd = $("#systemDbPwd").val();
	updatesystemDbSetting(type, url, user, pwd);
}

function dbConfigPageInit(){
	$.ajax({
        url : "/DocSystem/Manage/getSystemDbConfig.do",
        type : "post",
        dataType : "json",
        data : {
        	authCode: authCode,
        },
        success : function (ret) {
        	console.log("getSystemDbConfig ret:", ret);
            if( "ok" == ret.status )
            {
				var config = ret.data;
				systemDbSetting.type = config.type;
				systemDbSetting.url = config.url;
				systemDbSetting.user = config.user;
				systemDbSetting.pwd = config.pwd;
            	$("#systemDbType").val(systemDbSetting.type);
				$("#systemDbUrl").val(systemDbSetting.url);
            	$("#systemDbUser").val(systemDbSetting.user);
            	$("#systemDbPwd").val(systemDbSetting.pwd);				
            }
            else 
            {
            	console.log(ret.msgInfo);
        		showErrorMessage("获取数据库信息失败:" + ret.msgInfo);
            	if(ret.data == "invalidAuthCode")
            	{
                	window.location.href='/DocSystem';                	            		
            	}
            }
        },
        error : function () {
        	showErrorMessage("服务器异常:获取数据库信息失败");
        }
    });
}

function doSelectDbType(){
	var type = $("#systemDbType").val();
	switch(type)
	{
	case "mysql":
		$("#systemDbUrl").val("jdbc:mysql://localhost:3307/DocSystem1?useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC");
		$("#systemDbUser").val("root");
		$("#systemDbPwd").val("");
		break;
	case "sqlite":
		$("#systemDbUrl").val("jdbc:sqlite:${catalina.home}/DocSystem.db");
		$("#systemDbUser").val("");
		$("#systemDbPwd").val("");
		break;
	}
}

function updatesystemDbSetting(type, url, user, pwd){
	$.ajax({
        url : "/DocSystem/Manage/setSystemDBConfig.do",
        type : "post",
        dataType : "json",
        data : {
        	type: type,
        	url: url,
        	user: user,
        	pwd: pwd,
        	authCode: authCode,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
        		systemDbSetting.type = type;
            	systemDbSetting.url = url;
        		systemDbSetting.user = user;
        		systemDbSetting.pwd = pwd;
        		showErrorMessage("数据库配置修改成功，请重启服务！");
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage("更新数据库配置信息失败:" + ret.msgInfo);
        		//restore the setting
        		$("#systemDbType").val(systemDbSetting.type);
        		$("#systemDbUrl").val(systemDbSetting.url);
        		$("#systemDbUser").val(systemDbSetting.user);
        		$("#systemDbPwd").val(systemDbSetting.pwd);
	        }
        },
        error : function () {
        	showErrorMessage("服务器异常:更新数据库配置信息失败");
    		//restore the setting
    		$("#systemDbType").val(systemDbSetting.type);
    		$("#systemDbUrl").val(systemDbSetting.url);
    		$("#systemDbUser").val(systemDbSetting.user);
    		$("#systemDbPwd").val(systemDbSetting.pwd);
        }
    });
}

function testDatabase(){
	var dbType = $("#systemDbType").val();
	var dbUrl = $("#systemDbUrl").val();
	var dbUser = $("#systemDbUser").val();
	var dbPwd = $("#systemDbPwd").val();
	
	$.ajax({
        url : "/DocSystem/Manage/testDatabase.do",
        type : "post",
        dataType : "json",
        data : {
        	type: dbType,
        	url: dbUrl,
        	user: dbUser,
        	pwd: dbPwd,
        	authCode: authCode,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
            	//设置成功
            	showErrorMessage("数据库连接成功");
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage("数据库连接失败:" + ret.msgInfo);
	        }
        },
        error : function () {
        	showErrorMessage("服务器异常:数据库连接失败");
        }
    });
}

function resetDatabaseConfirm()
{
	console.log("resetDatabaseConfirm()");
    qiao.bs.confirm({
    		id: "resetDatabaseConfirmDialog",
	        title: "重置数据库",
	        msg: "是否重置数据库？",
	        okbtn: "确认",
	        qubtn: "取消",
    	},function () {
	    	//alert("点击了确定");
			resetDatabase();
	    	return true;   //close dialog
    	},function()
    	{
    		//alert("点击了取消")
    		return true;	//close dialog
    	}
    );
}

function resetDatabase(){
	var dbType = $("#systemDbType").val();
	var dbUrl = $("#systemDbUrl").val();
	var dbUser = $("#systemDbUser").val();
	var dbPwd = $("#systemDbPwd").val();
	
	$.ajax({
        url : "/DocSystem/Manage/resetDatabase.do",
        type : "post",
        dataType : "json",
        data : {
        	type: dbType,
        	url: dbUrl,
        	user: dbUser,
        	pwd: dbPwd,
        	authCode: authCode,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
            	//设置成功
            	showErrorMessage("重置数据库成功");
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage("重置数据库失败:" + ret.msgInfo);
	        }
        },
        error : function () {
        	showErrorMessage("服务器异常:重置数据库失败");
        }
    });
}

function exportDBData(){
	var dbType = $("#systemDbType").val();
	var dbUrl = $("#systemDbUrl").val();
	var dbUser = $("#systemDbUser").val();
	var dbPwd = $("#systemDbPwd").val();
	
	$.ajax({
        url : "/DocSystem/Manage/exportDBData.do",
        type : "post",
        dataType : "json",
        data : {
        	type: dbType,
        	url: dbUrl,
        	user: dbUser,
        	pwd: dbPwd,
        	authCode: authCode,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
            	//设置成功
        	    console.log("exportDBData Ok:",ret);	   		
    	   		var targetName = ret.data.name;
        	    var targetPath = ret.data.path;
        	    var deleteFlag = ret.msgData;
    	   		
        	    targetName = encodeURI(targetName);
    		   	targetPath = encodeURI(targetPath);
    	   		window.location.href = "/DocSystem/Doc/downloadDoc.do?targetPath=" + targetPath + "&targetName=" + targetName + "&deleteFlag="+deleteFlag + "&authCode="+authCode;
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage("数据库导出失败:" + ret.msgInfo);
	        }
        },
        error : function () {
        	showErrorMessage("服务器异常:数据库导出失败");
        }
    });
}

function importDBData(){
	console.log("importDBData()");
	//清除文件控件
	$("#uploadFiles").val("");
    return $("#uploadFiles").click();
}

function importDBDataConfirm(e)
{
	console.log("importDBData()");
	
	var dbType = $("#systemDbType").val();
	var dbUrl = $("#systemDbUrl").val();
	var dbUser = $("#systemDbUser").val();
	var dbPwd = $("#systemDbPwd").val();
	
    var files = e.target.files;
    var firstFile;
    if(files.length > 0)
   	{
    	console.log("files.length:" + files.length);
    	for( var i = 0 ; i < files.length ; i++ )
    	{  
    		firstFile = files[i];
    	   	if(typeof firstFile == 'object')
    	   	{
    	   		var relativePath = firstFile.webkitRelativePath;	//获取第一个文件的相对路径
    	   		console.log("firstFile relativePath:"+firstFile.webkitRelativePath);
    	   		break;
    	   	}
    	   	else
    	   	{
    	   		//This is something else 
    	   		//console.log("it is not a file");
    	   	}
    	}
    }
    else
   	{
   		bootstrapQ.alert("请选择文件");
      	return false;
   	}  
	
	var fileName = firstFile.name;
    console.log("firstFile:"+fileName);
    
    qiao.bs.confirm({
    		id: "importDBDataConfirmDialog",
	        title: "导入数据",
	        msg: "是否导入 " + fileName+ " ？",
	        okbtn: "确认",
	        qubtn: "取消",
    	},function () {
	    	//alert("点击了确定");
			//开始上传
			startImportDBData(firstFile, dbType, dbUrl, dbUser, dbPwd);
	    	return true;   //close dialog
    	},function()
    	{
    		//alert("点击了取消")
    		return true;	//close dialog
    	}
    );
}

function startImportDBData(file, dbType, dbUrl, dbUser, dbPwd)
{
	//新建文件上传表单
	var form = new FormData();
	form.append("type", dbType);
	form.append("url", dbUrl);
	form.append("user", dbUser);
	form.append("pwd", dbPwd);
	form.append("uploadFile", file);
	form.append("authCode", authCode);


	//新建http异步请求
	var xhr = new XMLHttpRequest();
	
	//设置异步上传状态变化回调处a理函数
	xhr.onreadystatechange = function() {				
		//文件上传状态
		console.log("xhr onreadystatechange() status:" + xhr.status + " readyState:" + xhr.readyState);
		if(xhr.status == 200) 
		{
			if(xhr.readyState != 4)
			{
				//文件上传未结束
				return;
			}
			
			//上传成功！
			var ret = JSON.parse(xhr.responseText);
			if("ok" == ret.status){
				showErrorMessage("导入成功");
			 }
			 else	//上传失败
			 {
				//上传失败
				console.log("上传失败：" + ret.msgInfo);
				showErrorMessage("导入失败:" + ret.msgInfo);
				return;
             }
		}else{
			if(xhr.status < 300) 
			{
				//不是真正的异常
				return;
			}
			//上传失败
			console.log("系统异常: " + file.name + " 上传异常！");
			showErrorMessage("系统异常: 上传异常");
			return;
		}
	};
	
	//上传表单			
	xhr.open("post", "/DocSystem/Manage/importDBData.do");
	xhr.send(form);
}
