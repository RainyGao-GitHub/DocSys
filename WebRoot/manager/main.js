function onSelectUserLanguage()
{
	//判断选择的语言，决定页面的跳转
	var lang = $("#UserLanguage").val();
	console.log("onSelectLanguage lang:" + lang);
	if(lang == undefined)
	{
		return;
	}
	
	if(lang == langType)
	{
		return;
	}
	
	langType = lang;
	langExt = getLangExt(langType);
	//Setcookie("UserLanguage", lang);	//注意Cookie在新页面里设置，这里不要设置	
	window.location.href='/DocSystem/manager/main' + langExt + '.html';
}

function getLangExt(langType)
{
	if(langType == undefined)
	{
		return "";
	}
	
	switch(langType)
	{
	case "en":
		return "_en";
	}
	return "";
}

//通用函数接口
function Setcookie(name, value)
{ 
	var expdate = new Date();
    expdate.setTime(expdate.getTime() +  90 * 24 * 60 * 60 * 1000);   //时间单位毫秒
    document.cookie = name+"="+value+";expires="+expdate.toGMTString()+";path=/"; 
   //即document.cookie= name+"="+value+";path=/";  时间默认为当前会话可以不要，但路径要填写，因为JS的默认路径是当前页，如果不填，此cookie只在当前页面生效！
}

function showErrorMessage($msg) {
	console.log("showErrorMessage() ", $msg);
	if(typeof $msg == 'string'){
		qiao.bs.alert({
			id: "idAlertDialog",	
			title: _Lang("提示"),
			okbtn: _Lang("确定"),
			msg: $msg,
		});
	}else{
		qiao.bs.alert($msg);
	}
}
  
//弹出对话框操作接口
function closeBootstrapDialog(id){ 
  	console.log("closeBootstrapDialog " + id);
$("#"+id).next('div').remove();	//删除全屏遮罩
$("#"+id).remove();	//删除对话框
  }
	
  function addToUrlParam(key,value,url){
    var ref = "";
if( url ){
  ref = url;
}
else
{
  ref = location.href;
}
if( ref.endsWith("#") ){
  ref = ref.substr(0,ref.length -1);
}
if( ref.indexOf("?") > 0 ){
  var p = getQuery(key);
  if( p ){
    var end = ref.replace(key + "=" + p,key + "=" + value);
    return end;
  }else{
    return ref + "&"+ key +"=" + value;
  }
}else{
  return ref + "?" + key + "=" + value;
    }
  }

  $(document).on("changePage",function(e,msg){
location.href = addToUrlParam("page",msg.page);
  });

var gDocSysConfig = null;
var gPageIndex = 0;
var gPageSize = 15;
var gTotal = 0;

//页面初始化
var loginUser = "";	//用来保存刚注册的用户、或刚才登录的用户
function pageInit(lang)
{
	console.log("pageInit");

	Setcookie("UserLanguage", lang);	//设置用户的语言类型	

	getDocSysConfig();
	
	//确定当前登录用户是否已登录
	$.ajax({
        url : "/DocSystem/User/getLoginUser.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
			console.log("getLoginUser ret",ret);
        	if( "ok" == ret.status )
            {
            	//Get用户信息
				var user = ret.data;
				var total = ret.dataEx; //查询结果总数
				
            	loginUser = user;
				if(!user.type || user.type < 1)
				{
	        		showErrorMessage(_Lang("非管理员用户，请联系系统管理员"));
				}
				else
				{
					//显示用户信息
	                $Func.render($("#headbar"),"headbar" + langExt, user);

					//显示菜单
	            	$Func.render($("#sidebar"),"sidebar" + langExt, user);

	            	//显示内容部分
	            	showContentPage("user");	           
				}
            }
            else 
            {
                console.log(ret.msgInfo);
                window.location.href = "login" + langExt + ".html";
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取用户信息失败", " : ", "服务器异常"));
        }
    });
}

function getDocSysConfig()
{
	console.log("getDocSysConfig");
    $.ajax({
        url : "/DocSystem/Repos/getDocSysConfig.do",
        type :"post",
        dataType :"json",
        data : null,
        success : function (ret) {
            if(ret.status == "ok")
            {
            	gDocSysConfig = ret.data;
            	console.log("getDocSysConfig config:", gDocSysConfig);
            }
            else
            {
            	console.log(ret.msgInfo);
            }
        },
        error : function () {
        	console.log('服务器异常:获取DocSysConfig失败');
        }
    });
}

//展开子项目
$(document).on("click",".has_sub",function(){
	  console.log(".has_sub onclick()");
      var title = $(this).children("a");
      if( title.hasClass("subdrop") ){
          title.removeClass("subdrop");
          $(this).children("ul").hide();
      }else{
          title.addClass("subdrop");
          $(this).children("ul").show();
      }
  });

  //展开子目录
  $(document).on("click","li.has_sublist",function(){
	  console.log("li.has_sublist onclick()");
	  var $this = $(this);
      if( ! $this.children("a").hasClass("open") ){
          $this.children("ul.sublist").toggle();
      }
  });
  
//click event handler  for data-eb-event="content.refresh"
$(document).on("click","[data-eb-event]", function (e) {
	console.log("[data-eb-event] onclick()");
	stopBubble(e); //阻止冒泡

    var event = $(this).attr("data-eb-event");
    var params = $(this).attr("data-eb-params");
  	
    console.log("data-eb-event:"+ event + " " + params);
    
    //非回调方式更加容易被理解，so I give up the event bus 
    switch(event)
    {
    //菜单点击
    case "content.refresh":
    	showContentPage(params);
    	break;
    }
});

function stopBubble(e) { 
	//如果提供了事件对象，则这是一个非IE浏览器 
	if ( e && e.stopPropagation ) 
	    //因此它支持W3C的stopPropagation()方法 
	    e.stopPropagation(); 
	else 
	    //否则，我们需要使用IE的方式来取消事件冒泡 
	    window.event.cancelBubble = true; 
	}

//显示对应菜单
function showContentPage(curPath) {
    console.log("showContentPage() " + curPath);
	var title = _Lang("载入中...");
    var subtitle = _Lang("载入中...");
	
    $("#container").html(_Lang("载入中..."));

    $("#nav li>a").removeClass("open");
    $("ul.sublist").hide();

    switch ( curPath ){
        case "user":
            title = _Lang("用户管理");
            userSearchWord = "";	//清除搜索关键字
            showUserList();
            $("#nav li[data-eb-params=user]>a").addClass("open");
            break;
        case "group":
            title = _Lang("用户组管理");
            showGroupList();
            $("#nav li[data-eb-params=group]>a").addClass("open");
            break;
        case "repos":
            title = _Lang("仓库管理");
            showReposList();
            $("#nav li[data-eb-params=repos]>a").addClass("open");
            break;  
        case "systemLog":
            title = _Lang("日志管理");
            $("#nav li[data-eb-params=systemLog]>a").addClass("open");
            systemLogSearchWord = "";	//清除搜索关键字
            showSystemLogList();
            break;
        case "system":
        case "systemEmailConfig":
        case "systemSmsConfig":
        case "systemDbConfig":
        case "systemUpgrade":
        case "systemLicenses":
        case "systemMigrate":
        	title = _Lang("系统管理");
            $("#nav li[data-eb-params=system]>a").addClass("open");
            $("ul.sublist").show();	        	
            showSystemPage(curPath);
        	break;
        case "license":
            title = _Lang("证书管理");
            $("#nav li[data-eb-params=license]>a").addClass("open");
            licenseSearchWord = "";
            showLicenseList();
            break;
        case "order":
            title = _Lang("订单管理");
            $("#nav li[data-eb-params=order]>a").addClass("open");
            orderSearchWord = "";
            showOrderList();
            break;
    }
    
    $Func.render($("#pagehead"),"pagehead" + langExt,{
        title : title,
        subtitle : title
    });
}

function showSystemPage(curPath)
{
	switch(curPath)
   	{
   	case "system":
   		showSystemUpgrade();
        break;
    case "systemUpgrade":
        showSystemUpgrade();
    	break;
    case "systemLicenses":
        showSystemLicenses();
    	break; 
   	case "systemEmailConfig":
    	showSystemEmailConfig();
        break;
    case "systemSmsConfig":
    	showSystemSmsConfig();
        break;
    case "systemDbConfig":
    	showSystemDbConfig();
    	break;
    case "systemMigrate":
        	showSystemMigrate();
        	break;
       	}
    }
 
	//系统设置
function selectOutputToFileEn()
{
	var outputToFileEn = $("#outputToFileEn").is(':checked')? 1: 0;
	console.log("selectOutputToFileEn outputToFileEn:" + outputToFileEn);
	if(outputToFileEn == 0)
	{
		$("#logFile").attr('disabled',true);
	}
	else
	{	
		$("#logFile").attr('disabled',false);
		var logFile = $("#logFile").val();
		if(logFile == undefined || logFile == "")
		{
			$("#logFile").val(systemInfo.tomcatPath + "logs/docsys.log");
		}
	}		
}

function selectRedisEn()
{
	var redisEn = $("#redisEn").is(':checked')? 1: 0;
	console.log("redisEn redisEn:" + redisEn);
	if(redisEn == 0)
	{
		$("#redisUrl").attr('disabled',true);
		$("#clusterServerUrl").attr('disabled',true);
	}
	else
	{	
		$("#redisUrl").attr('disabled',false);
		$("#clusterServerUrl").attr('disabled',false);

		var redisUrl = $("#redisUrl").val();
		if(redisUrl == undefined || redisUrl == "")
		{
			$("#redisUrl").val("redis://localhost:6379");
		}
	}		
}

function downloadLogFile(){
	$.ajax({
        url : "/DocSystem/Manage/downloadLogFile.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
         	    console.log("downloadLogFile Ok:",ret);	   		
            	window.location.href = ret.data;
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("日志下载失败", ":", ret.msgInfo));
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("日志下载失败", ":", "服务器异常"));
        }
    });
}

function cleanLogFile()
{
	cleanLogFileConfirm();
}

function cleanLogFileConfirm()
{
	console.log("cleanLogFileConfirm()");
    qiao.bs.confirm({
    		id: "cleanLogFileConfirm",
	        title: _Lang("清除日志"),
	        msg: _Lang("是否清除调试日志？"),
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
    	},function () {
			startCleanLogFile();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function startCleanLogFile()
{
    $.ajax({
        url : "/DocSystem/Manage/cleanLogFile.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status ){
               	showErrorMessage(_Lang("清除日志成功"));
            }else {
            	showErrorMessage(_Lang("清除日志失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("清除日志失败", ":", "服务器异常"));
        }
    });
}

//系统邮件服务设置
var systemEmailConfig = {
		host: "",
		email: "",
		pwd: "",
}
function enableSystemEmailSet(){
	$("#btnEnableSystemEmailSet").hide();
	$("#btnCancelSystemEmailSet").show();
	$("#btnSaveSystemEmailSet").show();
	$("#systemEmailHost").val(systemEmailConfig.host);
	$("#systemEmailUser").val(systemEmailConfig.email);
	$("#systemEmailPwd").val(systemEmailConfig.pwd);
	$("#systemEmailHost").attr('disabled',false);
	$("#systemEmailUser").attr('disabled',false);
	$("#systemEmailPwd").attr('disabled',false);
}

function cancelSystemEmailSet(){
	$("#btnEnableSystemEmailSet").show();
	$("#btnCancelSystemEmailSet").hide();
	$("#btnSaveSystemEmailSet").hide();
	//revert the value
	$("#systemEmailHost").attr('disabled',true);
	$("#systemEmailUser").attr('disabled',true);
	$("#systemEmailPwd").attr('disabled',true);
	$("#systemEmailHost").val(systemEmailConfig.host);
	$("#systemEmailUser").val(systemEmailConfig.email);
	$("#systemEmailPwd").val(systemEmailConfig.pwd);
}

function saveSystemEmailSet(){
	$("#btnEnableSystemEmailSet").show();
	$("#btnCancelSystemEmailSet").hide();
	$("#btnSaveSystemEmailSet").hide();
	//revert the value
	$("#systemEmailHost").attr('disabled',true);
	$("#systemEmailUser").attr('disabled',true);
	$("#systemEmailPwd").attr('disabled',true);
	var host = $("#systemEmailHost").val();
	var user = $("#systemEmailUser").val();
	var pwd = $("#systemEmailPwd").val();
	updateSystemEmailConfig(host, user, pwd);
}

function showSystemEmailConfig(){
	$.ajax({
        url : "/DocSystem/Manage/getSystemEmailConfig.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	//console.log("getSystemEmailConfig ret", ret);
				var config = ret.data; 	
				systemEmailConfig.host = config.host;
            	systemEmailConfig.email = config.email;
            	systemEmailConfig.pwd = config.pwd;
            	console.log("getSystemEmailConfig systemEmailConfig",systemEmailConfig);
            	$Func.render($("#container"),"systemEmailConfig" + langExt,{"value":systemEmailConfig});
            }
            else 
            {
            	showErrorMessage(_Lang("获取邮件服务配置信息失败", ":", ret.msgInfo));
            	console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取邮件服务配置信息失败", ":", "服务器异常"));
        }
    });
}

function updateSystemEmailConfig(host, email, pwd){
	$.ajax({
        url : "/DocSystem/Manage/setSystemEmailConfig.do",
        type : "post",
        dataType : "json",
        data : {
        	host: host,
        	email: email,
        	pwd: pwd,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
        		systemEmailConfig.host = host;
            	systemEmailConfig.email = email;
        		systemEmailConfig.pwd = pwd;
        		showErrorMessage(_Lang("更新邮件服务配置成功"));
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("更新邮件服务配置失败", ":", ret.msgInfo));
        		//restore the setting
        		$("#systemEmailHost").val(systemEmailConfig.host);
        		$("#systemEmailUser").val(systemEmailConfig.email);
        		$("#systemEmailPwd").val(systemEmailConfig.pwd);
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("更新邮件服务配置失败", ":", "服务器异常"));
    		//restore the setting
        	$("#systemEmailHost").val(systemEmailConfig.host);
    		$("#systemEmailUser").val(systemEmailConfig.email);
    		$("#systemEmailPwd").val(systemEmailConfig.pwd);
        }
    });
}

//系统短信服务设置
var systemSmsConfig = {
		server: "",
		apikey: "",
		tplid: "",
}
function enableSystemSmsSet(){
	$("#btnEnableSystemSmsSet").hide();
	$("#btnCancelSystemSmsSet").show();
	$("#btnSaveSystemSmsSet").show();
	$("#systemSmsServer").val(systemSmsConfig.server);
	$("#systemSmsApikey").val(systemSmsConfig.apikey);
	$("#systemSmsTplid").val(systemSmsConfig.tplid);
	$("#systemSmsServer").attr('disabled',false);
	$("#systemSmsApikey").attr('disabled',false);
	$("#systemSmsTplid").attr('disabled',false);
}

function cancelSystemSmsSet(){
	$("#btnEnableSystemSmsSet").show();
	$("#btnCancelSystemSmsSet").hide();
	$("#btnSaveSystemSmsSet").hide();
	//revert the value
	$("#systemSmsServer").attr('disabled',true);
	$("#systemSmsApikey").attr('disabled',true);
	$("#systemSmsTplid").attr('disabled',true);
	$("#systemSmsServer").val(systemSmsConfig.server);
	$("#systemSmsApikey").val(systemSmsConfig.apikey);
	$("#systemSmsTplid").val(systemSmsConfig.tplid);
}

function saveSystemSmsSet(){
	$("#btnEnableSystemSmsSet").show();
	$("#btnCancelSystemSmsSet").hide();
	$("#btnSaveSystemSmsSet").hide();
	//revert the value
	$("#systemSmsServer").attr('disabled',true);
	$("#systemSmsApikey").attr('disabled',true);
	$("#systemSmsTplid").attr('disabled',true);
	var host = $("#systemSmsServer").val();
	var user = $("#systemSmsApikey").val();
	var pwd = $("#systemSmsTplid").val();
	updateSystemSmsConfig(host, user, pwd);
}

function showSystemSmsConfig(){
	$.ajax({
        url : "/DocSystem/Manage/getSystemSmsConfig.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	//console.log("getSystemSmsConfig ret", ret);
				var config = ret.data; 	
				systemSmsConfig.server = config.server;
            	systemSmsConfig.apikey = config.apikey;
            	systemSmsConfig.tplid = config.tplid;
            	console.log("getSystemSmsConfig systemSmsConfig",systemSmsConfig);
            	$Func.render($("#container"),"systemSmsConfig" + langExt,{"value":systemSmsConfig});
            }
            else 
            {
            	showErrorMessage(_Lang("获取短信服务配置信息失败", ":", ret.msgInfo));
            	console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取短信服务配置信息失败", ":", "服务器异常"));
        }
    });
}

function updateSystemSmsConfig(server, apikey, tplid){
	$.ajax({
        url : "/DocSystem/Manage/setSystemSmsConfig.do",
        type : "post",
        dataType : "json",
        data : {
        	server: server,
        	apikey: apikey,
        	tplid: tplid,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
        		systemSmsConfig.server = server;
            	systemSmsConfig.apikey = apikey;
        		systemSmsConfig.tplid = tplid;
        		showErrorMessage(_Lang("更新短信服务配置成功"));
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("更新短信服务配置失败", ":", ret.msgInfo));
        		//restore the setting
        		$("#systemSmsServer").val(systemSmsConfig.server);
        		$("#systemSmsApikey").val(systemSmsConfig.apikey);
        		$("#systemSmsTplid").val(systemSmsConfig.tplid);
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("更新短信服务配置失败", ":", "服务器异常"));
    		//restore the setting
        	$("#systemSmsServer").val(systemSmsConfig.server);
    		$("#systemSmsApikey").val(systemSmsConfig.apikey);
    		$("#systemSmsTplid").val(systemSmsConfig.tplid);
        }
    });
}

//系统迁移
var gMigrateReposList = [];
function showSystemMigrate(){
	$.ajax({
        url : "/DocSystem/Manage/getReposList.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	var reposList = ret.data;
        		for(var i=0; i<reposList.length; i++)
        	 	{
        	    	var node = reposList[i];
        	       	node.formatedType = formateReposType(node.type);
             	}
        		gMigrateReposList = reposList;
            	$Func.render($("#container"),"systemMigrate" + langExt,{"list":reposList});
            }
            else 
            {
                console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取仓库列表失败", ":", "服务器异常"));
        }
    });		
}

function selectAllReposMigrateEn()
{
	console.log("selectAllReposMigrateEn()");
	var en = $("#allReposMigrateEn").is(':checked')? 1: 0;
	console.log("selectAllReposMigrateEn() allReposMigrateEn:" + en);
	
	if(en == 1)
	{
		console.log("selectAllReposMigrateEn() select all repos");
		$(".reposMigrateEn").prop("checked","checked");
		//$(".reposMigrateEn").attr("checked","checked");
	}
	else
	{
		console.log("selectAllReposMigrateEn() unselect all repos");
		$(".reposMigrateEn").prop("checked",false);
		//$(".reposMigrateEn").attr("checked",false);
	}
}

//showSystemMigratePanel
function showSystemMigrateConfirmPanel(){
	console.log("showSystemMigrateConfirmPanel gMigrateReposList.length :" + gMigrateReposList.length);
	
	var selectedMigrateReposList = [];
	for(var i=0; i < gMigrateReposList.length; i++)
	{
		var node = gMigrateReposList[i];
		//console.log("showSystemMigrateConfirmPanel node:", node);
		var selected = $("#reposMigrateEn" + i).is(':checked')? 1: 0;
		if(selected == 1)
		{
			selectedMigrateReposList.push(gMigrateReposList[i]);
		}
	}
	
	console.log("showSystemMigrateConfirmPanel selectedMigrateReposList.length :" + selectedMigrateReposList.length);
	if(selectedMigrateReposList.length == 0)
	{
		showErrorMessage(_Lang("请选择需要迁移的仓库！"));
		return;
	}
	
	qiao.bs.dialog({
		url: 'systemMigrateConfirm' + langExt + '.html',
		title: _Lang('系统迁移'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false,
		callback: function(){
		    console.log("page loaded callback");
		    SystemMigrateConfirmPageInit(selectedMigrateReposList);
		}
	}, null);
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
	
	$("#systemDbType").attr('disabled',false);
	$("#systemDbUrl").attr('disabled',false);
	$("#systemDbUser").attr('disabled',false);
	$("#systemDbPwd").attr('disabled',false);
}

function cancelSystemDBSet(){
	$("#btnEnableSystemDBSet").show();
	$("#btnCancelSystemDBSet").hide();
	$("#btnSaveSystemDBSet").hide();
	//revert the value
	$("#systemDbType").attr('disabled',true);
	$("#systemDbUrl").attr('disabled',true);
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

	//save the value
	$("#systemDbType").attr('disabled',true);
	$("#systemDbUrl").attr('disabled',true);
	$("#systemDbUser").attr('disabled',true);
	$("#systemDbPwd").attr('disabled',true);
	
	var type = $("#systemDbType").val();
	var url = $("#systemDbUrl").val();
	var user = $("#systemDbUser").val();
	var pwd = $("#systemDbPwd").val();
	updateSystemDBConfig(type, url, user, pwd);
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

function showSystemDbConfig(){
	$.ajax({
        url : "/DocSystem/Manage/getSystemDbConfig.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
				var config = ret.data; 	
				systemDbSetting.type = config.type;
				systemDbSetting.url = config.url;
				systemDbSetting.user = config.user;
				systemDbSetting.pwd = config.pwd;
            	$Func.render($("#container"),"systemDbConfig" + langExt,{"value":systemDbSetting});
            }
            else 
            {
	        	showErrorMessage(_Lang("获取数据库配置信息失败", ":", ret.msgInfo));
            	console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取数据库配置信息失败", ":", "服务器异常"));
        }
    });
}

function updateSystemDBConfig(type, url, user, pwd){
	$.ajax({
        url : "/DocSystem/Manage/setSystemDBConfig.do",
        type : "post",
        dataType : "json",
        data : {
        	type: type,
        	url: url,
        	user: user,
        	pwd: pwd,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	      
            	systemDbSetting.type = type;
        		systemDbSetting.url = url;
        		systemDbSetting.user = user;
        		systemDbSetting.pwd = pwd;
        		showErrorMessage(_Lang("更新成功,重启服务后生效！"));
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("更新数据库配置信息失败", ":", ret.msgInfo));
        		//restore the setting
        		$("#systemDbType").val(systemDbSetting.type);
        		$("#systemDbUrl").val(systemDbSetting.url);
        		$("#systemDbUser").val(systemDbSetting.user);
        		$("#systemDbPwd").val(systemDbSetting.pwd);
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("更新数据库配置信息失败", ":", "服务器异常"));
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
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
            	//设置成功
            	showErrorMessage(_Lang("数据库连接成功"));
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("数据库连接失败", ":", ret.msgInfo));
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("数据库连接失败", ":", "服务器异常"));
        }
    });
}

function deleteDatabaseConfirm()
{
	console.log("deleteDatabaseConfirm()");
	
    qiao.bs.confirm({
    		id: "deleteDatabaseConfirmDialog",
	        title: _Lang("删除数据库"),
	        msg: _Lang("是否删除数据库？"),
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
	    	//showErrorMessage("点击了确定");
			deleteDatabase();
	    	return true;   //close dialog
    	},function()
    	{
    		//showErrorMessage("点击了取消")
    		return true;	//close dialog
    	}
    );
}

function deleteDatabase(){
	var dbType = $("#systemDbType").val();
	var dbUrl = $("#systemDbUrl").val();
	var dbUser = $("#systemDbUser").val();
	var dbPwd = $("#systemDbPwd").val();
	
	$.ajax({
        url : "/DocSystem/Manage/deleteDatabase.do",
        type : "post",
        dataType : "json",
        data : {
        	type: dbType,
        	url: dbUrl,
        	user: dbUser,
        	pwd: dbPwd,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
            	//设置成功
            	showErrorMessage(_Lang("删除数据库成功"));
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("删除数据库失败", ":", ret.msgInfo));
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("删除数据库失败", ":", "服务器异常"));
        }
    });
}

function resetDatabaseConfirm()
{
	console.log("resetDatabaseConfirm()");
    qiao.bs.confirm({
    		id: "resetDatabaseConfirmDialog",
	        title: _Lang("重置数据库"),
	        msg: _Lang("是否重置数据库？"),
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
	    	//showErrorMessage("点击了确定");
			resetDatabase();
	    	return true;   //close dialog
    	},function()
    	{
    		//showErrorMessage("点击了取消")
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
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
            	//设置成功
            	showErrorMessage(_Lang("重置数据库成功"));
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("重置数据库失败", ":", ret.msgInfo));
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("重置数据库失败", ":", "服务器异常"));
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
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
            	//设置成功
        	    console.log("exportDBData Ok:",ret);        	   		
            	window.location.href = ret.data;
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("数据库导出失败", ":", ret.msgInfo));
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("数据库导出失败", ":", "服务器异常"));
        }
    });
}

function importDBData(){
	console.log("importDBData()");
	//清除文件控件
	$("#importDBFiles").val("");
    return $("#importDBFiles").click();
}

function importDBDataConfirm(e)
{
	console.log("importDBDataConfirm()");
	
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
   		showErrorMessage(_Lang("请选择文件"));
      	return false;
   	}  
	
	var fileName = firstFile.name;
    console.log("firstFile:"+fileName);
    
    qiao.bs.confirm({
    		id: "importDBDataConfirmDialog",
	        title: _Lang("导入数据"),
	        msg: _Lang("是否导入") + " " + fileName+ " ？",
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
	    	//showErrorMessage("点击了确定");
			//开始上传
			startImportDBData(firstFile, dbType, dbUrl, dbUser, dbPwd);
	    	return true;   //close dialog
    	},function()
    	{
    		//showErrorMessage("点击了取消")
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
				showErrorMessage(_Lang("导入成功，建议重启服务！"));
			 }
			 else	//上传失败
			 {
				//上传失败
				console.log("上传失败：" + ret.msgInfo);
				showErrorMessage(_Lang("导入失败", ":", ret.msgInfo));
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
			showErrorMessage(_Lang("导入失败", ":", "上传异常"));
			return;
		}
	};
	
	//上传表单			
	xhr.open("post", "/DocSystem/Manage/importDBData.do");
	xhr.send(form);
}

var systemInfo = {
		version: "",
		tomcatPath: "",
		javaHome: "",
		openOfficePath:"",
		officeEditorApi:"",
		defaultReposStorePath:"",
		systemLogStorePath:"",
		indexDBStorePath:"",
		salesDataStorePath:"",			
		ldapConfig:"",	//LDAP Config
		llmConfig:"",	//AI LLM Config
		logLevel: 1,	//default info
		logFile : "", //defualt not set
		maxThreadCount: 1, //default 1
		systemDisabled: 0, //default 0
		officeDisabled: 0, //default 0			
}

function enableSystemInfoSet(){
	console.log("enableSystemInfoSet systemInfo:", systemInfo);

	$("#btnEnableSystemInfoSet").hide();
	$("#btnCancelSystemInfoSet").show();
	$("#btnSaveSystemInfoSet").show();
	$("#tomcatPath").val(systemInfo.tomcatPath);
	$("#javaHome").val(systemInfo.javaHome);
	$("#openOfficePath").val(systemInfo.openOfficePath);
	$("#officeEditorApi").val(systemInfo.officeEditorApi);
	$("#defaultReposStorePath").val(systemInfo.defaultReposStorePath);
	$("#systemLogStorePath").val(systemInfo.systemLogStorePath);
	$("#indexDBStorePath").val(systemInfo.indexDBStorePath);
	$("#salesDataStorePath").val(systemInfo.salesDataStorePath);
	$("#ldapConfig").val(systemInfo.ldapConfig);
	$("#llmConfig").val(systemInfo.llmConfig);
	$("#maxThreadCount option[value='"+systemInfo.maxThreadCount+"']").attr("selected","selected");
	$("#logLevel option[value='"+systemInfo.logLevel+"']").attr("selected","selected");

	$("#tomcatPath").attr('disabled',false);
	$("#javaHome").attr('disabled',false);
	$("#openOfficePath").attr('disabled',false);
	$("#officeEditorApi").attr('disabled',false);
	$("#defaultReposStorePath").attr('disabled',false);
	$("#systemLogStorePath").attr('disabled',false);
	$("#indexDBStorePath").attr('disabled',false);
	$("#salesDataStorePath").attr('disabled',false);
	$("#ldapConfig").attr('disabled',false);
	$("#llmConfig").attr('disabled',false);
	$("#maxThreadCount").attr('disabled',false);		
	$("#logLevel").attr('disabled',false);		
	$("#outputToFileEn").attr('disabled',false);
	$("#redisEn").attr('disabled',false);
	if(systemInfo.outputToFileEn == 1)
	{
		$("#logFile").attr('disabled',false);
	}
	if(systemInfo.redisEn == 1)
	{
		$("#redisUrl").attr('disabled',false);
		$("#clusterServerUrl").attr('disabled',false);
	}
}

function cancelSystemInfoSet(){
	console.log("cancelSystemInfoSet systemInfo:", systemInfo);

	$("#btnEnableSystemInfoSet").show();
	$("#btnCancelSystemInfoSet").hide();
	$("#btnSaveSystemInfoSet").hide();
	//revert the value
	$("#tomcatPath").attr('disabled',true);
	$("#javaHome").attr('disabled',true);
	$("#openOfficePath").attr('disabled',true);
	$("#officeEditorApi").attr('disabled',true);
	$("#defaultReposStorePath").attr('disabled',true);
	$("#systemLogStorePath").attr('disabled',true);
	$("#indexDBStorePath").attr('disabled',true);
	$("#salesDataStorePath").attr('disabled',true);
	$("#ldapConfig").attr('disabled',true);
	$("#llmConfig").attr('disabled',true);
	$("#maxThreadCount").attr('disabled',true);
	$("#logLevel").attr('disabled',true);
	$("#outputToFileEn").attr('disabled',true);
	$("#logFile").attr('disabled',true);
	$("#redisEn").attr('disabled',true);
	$("#redisUrl").attr('disabled',true);
	$("#clusterServerUrl").attr('disabled',true);
	
	$("#tomcatPath").val(systemInfo.tomcatPath);
	$("#javaHome").val(systemInfo.javaHome);
	$("#openOfficePath").val(systemInfo.openOfficePath);
	$("#officeEditorApi").val(systemInfo.officeEditorApi);
	$("#defaultReposStorePath").val(systemInfo.defaultReposStorePath);
	$("#systemLogStorePath").val(systemInfo.systemLogStorePath);
	$("#indexDBStorePath").val(systemInfo.indexDBStorePath);
	$("#salesDataStorePath").val(systemInfo.salesDataStorePath);
	$("#ldapConfig").val(systemInfo.ldapConfig);
	$("#llmConfig").val(systemInfo.llmConfig);
	$("#maxThreadCount option[value='"+systemInfo.maxThreadCount+"']").attr("selected","selected");
	$("#logLevel option[value='"+systemInfo.logLevel+"']").attr("selected","selected");
	$("#logFile").val(systemInfo.logFile);
	$("#redisUrl").val(systemInfo.redisUrl);
	$("#clusterServerUrl").val(systemInfo.clusterServerUrl);
	
	if(systemInfo.outputToFileEn == 1)
	{
		$("#outputToFileEn").prop("checked", true);
	}
	else
	{
		$("#outputToFileEn").prop("checked", false);			
	}
	if(systemInfo.redisEn == 1)
	{
		$("#redisEn").prop("checked", true);
	}
	else
	{
		$("#redisEn").prop("checked", false);			
	}
}

function saveSystemInfoSet(){
	console.log("saveSystemInfoSet systemInfo:", systemInfo);

	$("#btnEnableSystemInfoSet").show();
	$("#btnCancelSystemInfoSet").hide();
	$("#btnSaveSystemInfoSet").hide();
	//revert the value
	$("#tomcatPath").attr('disabled',true);
	$("#javaHome").attr('disabled',true);
	$("#openOfficePath").attr('disabled',true);
	$("#officeEditorApi").attr('disabled',true);
	$("#defaultReposStorePath").attr('disabled',true);
	$("#systemLogStorePath").attr('disabled',true);
	$("#indexDBStorePath").attr('disabled',true);
	$("#salesDataStorePath").attr('disabled',true);
			
	$("#ldapConfig").attr('disabled',true);
	$("#llmConfig").attr('disabled',true);

	$("#maxThreadCount").attr('disabled',true);
	
	$("#logLevel").attr('disabled',true);
	$("#outputToFileEn").attr('disabled',true);
	$("#logFile").attr('disabled',true);
	$("#redisEn").attr('disabled',true);
	$("#redisUrl").attr('disabled',true);
	$("#clusterServerUrl").attr('disabled',true);
	
	var tomcatPath = $("#tomcatPath").val();
	var javaHome = $("#javaHome").val();
	var openOfficePath = $("#openOfficePath").val();
	var officeEditorApi = $("#officeEditorApi").val();
	var defaultReposStorePath = $("#defaultReposStorePath").val();
	var systemLogStorePath = $("#systemLogStorePath").val();
	var indexDBStorePath = $("#indexDBStorePath").val();
	var salesDataStorePath = $("#salesDataStorePath").val();
	var ldapConfig = $("#ldapConfig").val();
	var llmConfig = $("#llmConfig").val();
	var maxThreadCount = $("#maxThreadCount").val();
	var logLevel = $("#logLevel").val();
	var logFile = "";
	var outputToFileEn = $("#outputToFileEn").is(':checked')? 1: 0;
	if(outputToFileEn == 1)
	{
		logFile =  $("#logFile").val();
	}
	var redisEn = $("#redisEn").is(':checked')? 1: 0;
	var redisUrl = "";
	var clusterServerUrl = "";
	if(redisEn == 1)
	{
		redisUrl =  $("#redisUrl").val();
		clusterServerUrl =  $("#clusterServerUrl").val();
	}
	
	updateSystemInfo(tomcatPath, 
			javaHome, 
			openOfficePath, 
			officeEditorApi, 
			defaultReposStorePath,
			systemLogStorePath, 
			indexDBStorePath,
			salesDataStorePath,
			ldapConfig, 
			llmConfig, 
			logLevel,
			outputToFileEn,
			logFile,
			maxThreadCount,
			redisEn,
			redisUrl,
			clusterServerUrl);
}

function updateSystemInfo(tomcatPath, 
		javaHome, 
		openOfficePath, 
		officeEditorApi, 
		defaultReposStorePath, 
		systemLogStorePath, 
		indexDBStorePath,
		salesDataStorePath,
		ldapConfig, 
		llmConfig, 
		logLevel, 
		ouputToFileEn,
		logFile,
		maxThreadCount,
		redisEn,
		redisUrl,
		clusterServerUrl)
{
	$.ajax({
        url : "/DocSystem/Manage/setSystemInfo.do",
        type : "post",
        dataType : "json",
        data : {
        	tomcatPath: tomcatPath,
        	javaHome: javaHome,
        	openOfficePath: openOfficePath,
        	officeEditorApi: officeEditorApi,
        	defaultReposStorePath: defaultReposStorePath,
        	systemLogStorePath: systemLogStorePath,
        	indexDBStorePath: indexDBStorePath,
        	salesDataStorePath: salesDataStorePath,
        	ldapConfig: ldapConfig,
        	llmConfig: llmConfig,
        	logLevel: logLevel,
        	logFile: logFile,
        	maxThreadCount: maxThreadCount,
        	redisEn: redisEn,
        	redisUrl: redisUrl,
        	clusterServerUrl: clusterServerUrl,
        },
        success : function (ret) {
        	console.log("setSystemInfo ret:",ret);
            if( "ok" == ret.status )
            {	        		
        		systemInfo.tomcatPath = tomcatPath;
        		systemInfo.javaHome = javaHome;
        		systemInfo.openOfficePath = openOfficePath;
        		systemInfo.officeEditorApi = officeEditorApi;
        		systemInfo.defaultReposStorePath = defaultReposStorePath;
        		systemInfo.systemLogStorePath = systemLogStorePath;
        		systemInfo.indexDBStorePath = indexDBStorePath;
        		systemInfo.salesDataStorePath = salesDataStorePath;
        		systemInfo.ldapConfig = ldapConfig;
        		systemInfo.llmConfig = llmConfig;
        		systemInfo.maxThreadCount = maxThreadCount;
        		systemInfo.logLevel = logLevel;
        		systemInfo.logFile = logFile;
        		systemInfo.ouputToFileEn = ouputToFileEn;
        		systemInfo.redisEn = redisEn;
        		systemInfo.redisUrl = redisUrl;
        		systemInfo.clusterServerUrl = clusterServerUrl;
        		showErrorMessage(_Lang("更新成功！"));
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("更新失败", ":", ret.msgInfo));
        		//restore the setting
        		$("#tomcatPath").val(systemInfo.tomcatPath);
        		$("#javaHome").val(systemInfo.javaHome);
        		$("#openOfficePath").val(systemInfo.openOfficePath);
        		$("#officeEditorApi").val(systemInfo.officeEditorApi);
        		$("#defaultReposStorePath").val(systemInfo.defaultReposStorePath);
        		$("#systemLogStorePath").val(systemInfo.systemLogStorePath);
        		$("#indexDBStorePath").val(systemInfo.indexDBStorePath);
        		$("#salesDataStorePath").val(systemInfo.salesDataStorePath);
        		$("#ldapConfig").vllmConfigal(systemInfo.ldapConfig);
        		$("#llmConfig").vllmConfigal(systemInfo.llmConfig);
        		$("#maxThreadCount").val(systemInfo.maxThreadCount);
        		$("#logLevel").val(systemInfo.logLevel);
        		$("#logFile").val(systemInfo.logFile);
        		if(systemInfo.ouputToFileEn == 1)
        		{
        			$("#outputToFileEn").prop("checked", true);
        		}
        		else
        		{
        			$("#outputToFileEn").prop("checked",false);			
        		}	
        		if(systemInfo.redisEn == 1)
        		{
        			$("#redisEn").prop("checked", true);
        		}
        		else
        		{
        			$("#redisEn").prop("checked",false);			
        		}
        		$("#redisUrl").val(systemInfo.redisUrl);
        		$("#clusterServerUrl").val(systemInfo.clusterServerUrl);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("更新失败", ":", "服务器异常"));
    		//restore the setting
    		$("#tomcatPath").val(systemInfo.tomcatPath);
    		$("#javaHome").val(systemInfo.javaHome);
    		$("#openOfficePath").val(systemInfo.openOfficePath);
    		$("#officeEditorApi").val(systemInfo.officeEditorApi);
    		$("#defaultReposStorePath").val(systemInfo.defaultReposStorePath);
    		$("#systemLogStorePath").val(systemInfo.systemLogStorePath);
    		$("#indexDBStorePath").val(systemInfo.indexDBStorePath);
    		$("#salesDataStorePath").val(systemInfo.salesDataStorePath);
    		$("#ldapConfig").val(systemInfo.ldapConfig);
    		$("#llmConfig").val(systemInfo.llmConfig);
    		$("#maxThreadCount").val(systemInfo.maxThreadCount);
    		$("#logLevel").val(systemInfo.logLevel);
    		$("#logFile").val(systemInfo.logFile);
    		if(systemInfo.ouputToFileEn == 1)
    		{
    			$("#outputToFileEn").prop("checked", true);
    		}
    		else
    		{
    			$("#outputToFileEn").prop("checked",false);			
    		}	
    		if(systemInfo.redisEn == 1)
    		{
    			$("#redisEn").prop("checked", true);
    		}
    		else
    		{
    			$("#redisEn").prop("checked",false);			
    		}
    		$("#redisUrl").val(systemInfo.redisUrl);
    		$("#clusterServerUrl").val(systemInfo.clusterServerUrl);
        }
    });
}

function showSystemUpgrade(){
	$.ajax({
        url : "/DocSystem/Manage/getSystemInfo.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            console.log("showSystemUpgrade() ret", ret);
        	if( "ok" == ret.status )
            {
            	var config = ret.data; 	
            	systemInfo = config;
        		if(systemInfo.maxThreadCount == undefined)
            	{
            		systemInfo.maxThreadCount = 1;	//defulat 1
            	}
            	if(systemInfo.logLevel == undefined)
            	{
            		systemInfo.logLevel = 1;	//defulat info
            	}
            	if(systemInfo.logFile == undefined)
            	{
            		systemInfo.logFile = "";
            	}
    			systemInfo.outputToFileEn = 0;
        		if(systemInfo.logFile && systemInfo.logFile != "")
        		{
        			systemInfo.outputToFileEn = 1;
        		}
        		if(systemInfo.redisEn == undefined)
            	{
            		systemInfo.redisEn = 0;	//defulat info
            	}
        		
            	$Func.render($("#container"),"systemUpgrade" + langExt,{"value":systemInfo});
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
    qiao.bs.confirm({
    		id: "restartTomcatConfirmDialog",
	        title: _Lang("重启服务"),
	        msg: _Lang("是否重启服务") + "？",
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
	    	//showErrorMessage("点击了确定");
			//开始上传
			var tomcatPath = $("#tomcatPath").val();
			var javaHome = $("#javaHome").val();
			doRestartTomcat(tomcatPath, javaHome);
	    	return true;   //close dialog
    	},function()
    	{
    		//showErrorMessage("点击了取消")
    		return true;	//close dialog
    	}
    );
}

function doRestartTomcat(tomcatPath, javaHome)
{
	console.log("doRestartTomcat tomcatPath:" + tomcatPath + " javaHome:" + javaHome);
	$.ajax({
        url : "/DocSystem/Manage/restartServer.do",
        type : "post",
        dataType : "json",
        data : {
        	tomcatPath: tomcatPath,
        	javaHome: javaHome,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	showErrorMessage(_Lang("系统重启中，请稍候..."));
        	}
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("重启失败", " : ", ret.msgInfo));
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("重启失败", " : ", "服务器异常"));
        }
    });
}

function ldapTest()
{
	var ldapConfig = $("#ldapConfig").val();
	console.log("ldapTest() ldapConfig:" + ldapConfig);
	
	$.ajax({
        url : "/DocSystem/Manage/ldapTest.do",
        type : "post",
        dataType : "json",
        data : {
        	ldapConfig: ldapConfig,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	showErrorMessage("<font color='green'><strong>" + _Lang("测试成功") + "</strong></font><br/><br/>" + ret.msgInfo);
            }
            else
            {
            	showErrorMessage("<font color='red'><strong>" + _Lang("测试失败") + "</strong></font><br/><br/>" + ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("测试失败", " : ", "服务器异常"));
        }
    });
}
function llmTest()
{
	var llmConfig = $("#llmConfig").val();
	console.log("llmTest() llmConfig:" + llmConfig);
	
	$.ajax({
		url : "/DocSystem/Manage/llmTest.do",
		type : "post",
		dataType : "json",
		data : {
			llmConfig: llmConfig,
		},
		success : function (ret) {
			if( "ok" == ret.status )
			{
				showErrorMessage("<font color='green'><strong>" + _Lang("测试成功") + "</strong></font><br/><br/>" + ret.msgInfo);
			}
			else
			{
				showErrorMessage("<font color='red'><strong>" + _Lang("测试失败") + "</strong></font><br/><br/>" + ret.msgInfo);
			}
		},
		error : function () {
			showErrorMessage(_Lang("测试失败", " : ", "服务器异常"));
		}
	});
}

function testCluster()
{
	var redisUrl = $("#redisUrl").val();
	var clusterServerUrl = $("#clusterServerUrl").val();
	console.log("testCluster() redisUrl:" + redisUrl + " clusterServerUrl:" + clusterServerUrl);
	
	$.ajax({
        url : "/DocSystem/Manage/testCluster.do",
        type : "post",
        dataType : "json",
        data : {
        	redisUrl: redisUrl,
        	clusterServerUrl: clusterServerUrl,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	showErrorMessage("<font color='green'><strong>" + _Lang("测试成功") + "</strong></font><br/><br/>" + ret.msgInfo);
            }
            else
            {
            	showErrorMessage("<font color='red'><strong>" + _Lang("测试失败") + "</strong></font><br/><br/>" + ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("测试失败", " : ", "服务器异常"));
        }
    });
}

function resetClusterConfirm()
{
	console.log("resetClusterConfirm()");	    
    qiao.bs.confirm({
    		id: "resetClusterConfirmDialog",
	        title: _Lang("重置"),
	        msg: _Lang("是否重置"),
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
    		resetCluster();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function resetCluster()
{
	console.log("resetCluster()");
	
	$.ajax({
        url : "/DocSystem/Manage/resetCluster.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	showErrorMessage("<font color='green'><strong>" + _Lang("重置成功") + "</strong></font>");
            }
            else
            {
            	showErrorMessage("<font color='red'><strong>" + _Lang("重置失败") + "</strong></font><br/><br/>" + ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("重置失败", " : ", "服务器异常"));
        }
    });
}

function generateRootKey()
{
    $.ajax({
        url : "/DocSystem/Sales/generateRootKey.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status ){
               	showErrorMessage(_Lang("生成密钥成功"));
            }else {
            	showErrorMessage(_Lang("生成密钥失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("生成密钥失败", " : ", "服务器异常"));
        }
    });
}

function exportRootKey(){
	$.ajax({
        url : "/DocSystem/Sales/exportRootKey.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
         	    console.log("exportRootKey Ok:",ret);	   		
            	window.location.href = ret.data;
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("密钥导出失败", " : ", ret.msgInfo));
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("密钥导出失败", " : ", "服务器异常"));
        }
    });
}

function deleteRootKey()
{
	deleteRootKeyConfirm();
}

function deleteRootKeyConfirm()
{
	console.log("deleteRootKeyConfirm()");
    qiao.bs.confirm({
    		id: "deleteRootKeyConfirmDialog",
	        title: _Lang("删除密钥"),
	        msg: _Lang("是否删除系统密钥") + "？",
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
    	},function () {
    		startDeleteRootKey();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function startDeleteRootKey()
{
    $.ajax({
        url : "/DocSystem/Sales/deleteRootKey.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status ){
               	showErrorMessage(_Lang("删除密钥成功"));
            }else {
            	showErrorMessage(_Lang("删除密钥失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("删除密钥失败", " : ", "服务器异常"));
        }
    });
}

function generateLicenseKeyPair()
{
    $.ajax({
        url : "/DocSystem/Sales/generateLicenseKeyPair.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status ){
               	showErrorMessage(_Lang("生成密钥成功"));
            }else {
            	showErrorMessage(_Lang("生成密钥失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("生成密钥失败", " : ", "服务器异常"));
        }
    });
}

function exportLicenseKeyPair(){
	$.ajax({
        url : "/DocSystem/Sales/exportLicenseKeyPair.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {	        		
         	    console.log("exportLicenseKeyPair Ok:",ret);	   		
            	window.location.href = ret.data;
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("密钥导出失败", " : ", ret.msgInfo));
	        }
        },
        error : function () {
        	showErrorMessage(_Lang("密钥导出失败", " : ", "服务器异常"));
        }
    });
}

function deleteLicenseKeyPair()
{
	deleteLicenseKeyPairConfirm();
}

function deleteLicenseKeyPairConfirm()
{
	console.log("deleteLicenseKeyPairConfirm()");
    qiao.bs.confirm({
    		id: "deleteLicenseKeyPairConfirm",
	        title: _Lang("删除密钥"),
	        msg: _Lang("是否删除证书密钥") + "?",
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
    	},function () {
			startDeleteLicenseKeyPair();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function startDeleteLicenseKeyPair()
{
    $.ajax({
        url : "/DocSystem/Sales/deleteLicenseKeyPair.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status ){
               	showErrorMessage(_Lang("删除密钥成功"));
            }else {
            	showErrorMessage(_Lang("删除密钥失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("删除密钥失败", " : ", "服务器异常"));
        }
    });
}

function deleteSystemLicense(){
	console.log("deleteSystemLicense()");
	var systemLicense = systemLicenses.systemLicense;
	if(systemLicense.hasLicense == false)
	{
		return;
	}
	
	deleteSystemLicenseConfirm();
}

function deleteSystemLicenseConfirm()
{
	console.log("deleteSystemLicenseConfirm()");
    qiao.bs.confirm({
    		id: "deleteSystemLicenseConfirmDialog",
	        title: _Lang("删除证书"),
	        msg: _Lang("是否删除证书") + "?",
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
    	},function () {
			startDeleteSystemLicense();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function startDeleteSystemLicense()
{
    $.ajax({
        url : "/DocSystem/Bussiness/deleteSystemLicense.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status ){
				updateSystemLicenseInfo(ret.data);
				showSystemLicenses(systemLicenses);
               	showErrorMessage(_Lang("删除成功"));
            }else {
            	showErrorMessage(_Lang("删除失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("删除失败", " : ", "服务器异常"));
        }
    });
}


function installSystemLicense(){
	console.log("installSystemLicense()");
	//清除文件控件
	$("#installSystemLicense").val("");
    return $("#installSystemLicense").click();
}


function installSystemLicenseConfirm(e)
{
	console.log("installSystemLicenseConfirm()");
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
    	   		//var relativePath = firstFile.webkitRelativePath;	//获取第一个文件的相对路径
    	   		//console.log("firstFile relativePath:"+firstFile.webkitRelativePath);
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
   		showErrorMessage(_Lang("请选择证书文件"));
      	return false;
   	}  
	
	//var fileName = firstFile.name;
    //console.log("firstFile:"+fileName);

    qiao.bs.confirm({
    		id: "installSystemLicenseConfirmDialog",
	        title: _Lang("安装证书"),
	        msg: _Lang("是否安装证书") + "?",
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
    	},function () {
	    	//showErrorMessage("点击了确定");
			//开始上传
			startInstallSystemLicense(firstFile);
	    	return true;   //close dialog
    	},function()
    	{
    		//showErrorMessage("点击了取消")
    		return true;	//close dialog
    	}
    );
}

function startInstallSystemLicense(file)
{
	//新建文件上传表单
	var form = new FormData();
	form.append("uploadFile", file);

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
				showErrorMessage(_Lang("安装成功"));
				updateSystemLicenseInfo(ret.data);
				showSystemLicenses(systemLicenses);
			 }
			 else	//上传失败
			 {
				//上传失败
				console.log("安装失败：" + ret.msgInfo);
				showErrorMessage(_Lang("安装失败", " : ", ret.msgInfo));
				return;
             }
		}else{
			if(xhr.status < 300) 
			{
				//不是真正的异常
				return;
			}
			//上传失败
			console.log("安装失败: " + file.name + " 上传异常！");
			showErrorMessage(_Lang("安装失败", " : ", "上传异常"));
			return;
		}
	};
	
	//上传表单			
	xhr.open("post", "/DocSystem/Bussiness/installSystemLicense.do");
	xhr.send(form);
}

function updateSystemLicenseInfo(licenseInfo)
{
	var systemLicenseInfo = systemLicenses.systemLicense;
	systemLicenseInfo.hasLicense = licenseInfo.hasLicense;
	systemLicenseInfo.id = licenseInfo.id;
	systemLicenseInfo.customer = licenseInfo.customer;
	systemLicenseInfo.usersCount = licenseInfo.usersCount;
	systemLicenseInfo.expireTime = licenseInfo.expireTime;
	systemLicenseInfo.createTime = licenseInfo.createTime;
}

function cleanSystemLocks(){
	console.log("cleanSystemLocks()");
	cleanSystemLocksConfirm();
}

function cleanSystemLocksConfirm()
{
	console.log("cleanSystemLocksConfirm()");
    qiao.bs.confirm({
    		id: "cleanSystemLocksConfirmDialog",
	        title: _Lang("清除锁定"),
	        msg: _Lang("是否清除系统所有锁定") + "？",
	        okbtn: _Lang("清除"),
	        qubtn: _Lang("取消"),
    	},function () {
    		doCleanSystemLocks();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function doCleanSystemLocks(){
	$.ajax({
        url : "/DocSystem/Manage/cleanSystemLocks.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
        	console.log("doCleanSystemLocks ret:",ret);
            if( "ok" == ret.status )
            {
                showErrorMessage(_Lang("清除成功"));	            	
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("清除失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("清除失败", " : ", "服务器异常"));
        }
    });
}

function disableSystem(){
	console.log("disableSystem()");
	disableSystemConfirm();
}

function enableSystem(){
	console.log("enableSystem()");
	enableSystemConfirm();
}

function disableSystemConfirm()
{
	console.log("disableSystemConfirm()");
    qiao.bs.confirm({
    		id: "disableSystemConfirmDialog",
	        title: _Lang("禁用系统"),
	        msg: _Lang("是否禁用系统") + "?",
	        okbtn: _Lang("禁用"),
	        qubtn: _Lang("取消"),
    	},function () {
			doDisableSystem();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function enableSystemConfirm()
{
	console.log("enableSystemConfirm()");
    qiao.bs.confirm({
    		id: "enableSystemConfirmConfirmDialog",
	        title: _Lang("启用系统"),
	        msg: _Lang("是否启用系统") + "?",
	        okbtn: _Lang("启用"),
	        qubtn: _Lang("取消"),
    	},function () {
			doEnableSystem();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function doDisableSystem(){
	$.ajax({
        url : "/DocSystem/Manage/disableSystem.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
        	console.log("disableSystem ret:",ret);
            if( "ok" == ret.status )
            {	        		
        		systemInfo.systemDisabled = 1;
        		$("#btnEnableSystem").show();
        		$("#btnDisableSystem").hide();
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("禁用系统失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("禁用系统失败", " : ", "服务器异常"));
        }
    });
}

function doEnableSystem(){
	$.ajax({
        url : "/DocSystem/Manage/enableSystem.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
        	console.log("enableSystem ret:",ret);
            if( "ok" == ret.status )
            {	        		
        		systemInfo.systemDisabled = 0;
        		$("#btnEnableSystem").hide();
        		$("#btnDisableSystem").show();
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("启用系统失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("启用系统失败", " : ", "服务器异常"));
        }
    });
}

var gStatus = 0;

function upgradeSystem(){
	console.log("upgradeSystem()");
	
	switch(gStatus)
	{
	case 1:
		showErrorMessage(_Lang("系统升级中，请稍后重试!"));
		return;
	case 2:
		showErrorMessage(_Lang("正在安装Office，请稍后重试!"));			
		return;
	case 3:
		showErrorMessage(_Lang("正在在线安装Office，请稍后重试!"));			
		return;
	case 4:
		showErrorMessage(_Lang("正在安装字体，请稍后重试!"));			
		return;
	case 5:
		showErrorMessage(_Lang("正在重置字体库，请稍后重试!"));			
		return;
	}
	
	//清除文件控件
	$("#upgradeFiles").val("");
    return $("#upgradeFiles").click();
}

function upgradeSystemConfirm(e)
{
	console.log("upgradeSystemConfirm()");
	gStatus = 1;
	
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
   		showErrorMessage(_Lang("请选择文件"));
   		gStatus = 0;
      	return false;
   	}  
	
	var fileName = firstFile.name;
    console.log("firstFile:"+fileName);
    if(fileName.indexOf("DocSystem") == -1)
    {
    	showErrorMessage(_Lang("非法升级文件"));
    	gStatus = 0;
    	return false;
    }
    
    qiao.bs.confirm({
    		id: "upgradeSystemConfirmDialog",
	        title: _Lang("系统升级"),
	        msg: _Lang("是否升级系统？"),
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
	    	//showErrorMessage("点击了确定");
			//开始上传
			SystemUpgrade.start(files, firstFile);
	    	return true;   //close dialog
    	},function()
    	{
    		//showErrorMessage("点击了取消")
    		gStatus = 0;
    		return true;	//close dialog
    	}
    );
}

//上传控件状态栏收起展开控制（基于class工作）
var showUploadList = true;
$(".el-upload-list").delegate(".upload-list-title","click",function(){
	var uploadListHeight = $(".el-upload-list").height();
	if(showUploadList == true)
	{
		showUploadList = false;
		//收起进度
		var height = - uploadListHeight + "px";
		$(".el-upload-list").animate({bottom: height});
		$(".uploadCloseBtn").animate({opacity: 0});	//隐藏关闭按键
	}
	else
	{
		showUploadList = true;
		$(".el-upload-list").animate({bottom: "0px"});
		$(".uploadCloseBtn").animate({opacity: 1});	//显示关闭按键
	}
});

//SystemUpgrade类	
var SystemUpgrade = (function () {
	var _firstFile;
	var _status = 0; //0: init 1:uploading 2:upload-success 3:systemUpgradePrepare 4:systemUpgradePrepare-success 5: systemUpgradeInProgress
	var _taskId;
	
	//初始化上传控件
	var SystemUpgradeFileUpload;
	function SystemUpgradeFileUploadInit()
	{
		var uploadDisplayInit = function(index, totalNum) {
			console.log("uploadDisplayInit index:" + index + " totalNum:" + totalNum);
			var str="<div><span class='upload-list-title'>[" + _Lang("系统升级") + "] " + _Lang("正在上传") + " " + index +" / " + totalNum +"</span><i class='el-icon-close uploadCloseBtn' onclick='stopUpgradeSystem()'></i></div>";
			str +="<div id='uploadedFileList' class='uploadedFileList'></div>";
			$(".el-upload-list").show();
			$('.el-upload-list').html(str);
      	};
     
      	var showUploadingInfo = function(reuploadFlag, uploadStartedNum, totalNum, reuploadStartedNum, reuploadTotalNum)
      	{
      		if(reuploadFlag == false)
      		{
      			$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("正在上传") + " " + uploadStartedNum + " / " + totalNum);
      		}
      		else
      		{
      			$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("正在重传") + " " + reuploadStartedNum + " / " + reuploadTotalNum);
      		}
      	}
      	
		var createUploadItem = function(index, fileName) {
			console.log("createUploadItem index:" + index + " fileName:" + fileName);
			return "<li class='el-upload-list__item file" + index + " is-uploading' value=" + index + ">"+
			"<a class='el-upload-list__item-name uploadFileName'><i class='el-icon-document'></i><span class='uploadFileName' >"+ fileName +"</span></a>"+
			"<a class='reuploadBtn reupload" + index + "' onclick='SystemUpgrade.reuploadFailDocs("+ index +")'  style='display:none'>" + _Lang("重传") + "</a>"+
			"<label class='el-upload-list__item-status-label'><i class='el-icon-upload-success el-icon-circle-check'></i></label>"+
			"<i class='el-icon-close stopUpload'  value="+index+" onclick='SystemUpgrade.stopUpload("+ index +")'></i>"+
			"<div class='el-progress el-progress--line'>"+
				"<div class='el-progress-bar'>"+
					"<div class='el-progress-bar__outer' >"+
						"<div class='el-progress-bar__inner'></div>"+
					"</div>"+
				"</div>"+
				"<div class='el-progress__text' style='font-size: 12.8px;'></div>"+
			"</div>"+
		  "</li>";
		};
  		
		var appendUploadItems = function(uploadItemsHtmlStr) {
			$('#uploadedFileList').append(uploadItemsHtmlStr);
		};
				
  		var deleteUploadItem = function(index) {
	  		$('.file' + index).remove();      		
  		};

  		var updateUploadItem = function(index, speed, percent){
			$('.file'+index+' .el-progress__text').text(speed + " " + percent+"%");
			$('.file'+index+' .el-progress-bar__inner')[0].style.width = percent +"%"; //进度条

			//printUploadedTime();
  		};
  		
  		var stopAllUploadCallback = function(){  	  		
	    	//停止上传
  			$(".el-upload-list").hide();
	    	gStatus = 0;
  		};
  		
  		var reuploadItemInit = function(index){
      		//hide the reupload btn
    		$(".reupload"+index).hide();
    		
    		$('.file' + index).addClass('is-uploading');
			$('.file' + index).removeClass('is-fail');
  		};

  		var uploadSuccessCallback = function(index, context){  	  					
			//更新上传显示
  			$('.file'+index).removeClass('is-uploading');
  			$('.file'+index).addClass('is-success');
  			//hide the reupload btn
  			$(".reupload"+index).hide();
  		};
  		
  		var uploadErrorCallback = function(index)
  		{  	  		
  			$('.file' + index).removeClass('is-uploading');
  			$('.file' + index).addClass('is-fail');
  	  	
  	  		//show the reupload btn
  			$(".reupload" + index).show();
  		};
  		
  		var uploadEndCallback = function(totalNum, successNum){  	  		
      		//显示上传完成 
      		var uploadEndInfo = "[" + _Lang("系统升级") + "] " + _Lang("上传完成") + "(" + _LangStats(totalNum) + ")," + _Lang("解压安装文件") + "...";
      		if(successNum != totalNum)
      		{
      			uploadEndInfo = "[" + _Lang("系统升级") + "] " + _Lang("上传失败") + "(" + _LangStats(totalNum, successNum) + ")";
      			$(".reuploadAllBtn").show();
      		}
      		else
      		{
      			$(".reuploadAllBtn").hide();
    			startUpgradeSystem(_firstFile);
      		}
      		$(".upload-list-title").text(uploadEndInfo);   		
      		
      		//清除文件控件
			$("#upgradeFiles").val("");
  		};
  		
		var config = {
				uploadDisplayInit: uploadDisplayInit,
				showUploadingInfo: showUploadingInfo,
				createUploadItem: createUploadItem,
				appendUploadItems: appendUploadItems,		
				deleteUploadItem: deleteUploadItem,
				updateUploadItem: updateUploadItem,
				stopAllUploadCallback: stopAllUploadCallback,
				uploadSuccessCallback: uploadSuccessCallback,			
				uploadErrorCallback: uploadErrorCallback,			
				uploadEndCallback: uploadEndCallback,			
				reuploadItemInit: reuploadItemInit,
				usage: 1,	//SystemUpgrade
			};
		
  		SystemUpgradeFileUpload = new DocUpload(config);
	}
	
	//Re Upload Fail Docs
    function reuploadFailDocs(index)
    {
    	console.log("reuploadFailDocs() index:" + index);
    	SystemUpgradeFileUpload.reuploadFailDocs(index);
    }

	//Stop Upload
	function stopUpload(index)
	{
    	//var index = $(this).attr('value');	//value 不是i的原生属性，所以不能用value
    	console.log("stopUpload " + index);
    	SystemUpgradeFileUpload.stopUpload(index);
    }
	
	function start(files, firstFile){
		_firstFile = firstFile;
		
		var parentPath = "";
	  	var parentId = 0;
	  	var level = 0;
	  	var vid = -1;
	  	var parentNode = null;
	  	
	  	SystemUpgradeFileUpload.uploadDocs(files, parentNode, parentPath, parentId, level, vid);
	}
	
	function startSystemUpgradePrepareTask(taskId, delayTime)
	{
		_taskId = taskId;
		console.log("startSystemUpgradePrepareTask() taskId:" + taskId + " delayTime:" + delayTime);
		var nextDelayTime = delayTime; //每次增加5s
		if(nextDelayTime < 60000) //最长1分钟
		{
			nextDelayTime += 5000;
		}
		
		setTimeout(function () {
			console.log("timerForQuerySystemUpgradePrepareTask triggered!");
			doQuerySystemUpgradePrepareTask(_taskId, nextDelayTime);
		},delayTime);	//check it 2s later	
	}
	
	function doQuerySystemUpgradePrepareTask(taskId, nextDelayTime)
	{
		console.log("doQuerySystemUpgradePrepareTask() taskId:" + taskId + " nextDelayTime:" + nextDelayTime);

		$.ajax({
            url : "/DocSystem/Manage/queryLongTermTask.do",
            type : "post",
            dataType : "json",
            data : {
                taskId: taskId,
            },
            success : function (ret) {
        	   console.log("doQuerySystemUpgradePrepareTask() ret:",ret);        
               if( "ok" == ret.status )
               {    
            	   var task = ret.data;
           	       if(task.status == 200)
            	   {
	           			console.log("SystemUpgradePrepareSuccessHandler() 升级准备工作已完成，等待升级");
	           			$(".upload-list-title").text("[" + _Lang("系统升级") + "] " +  _Lang("开始升级，请稍候..."));
	           			gStatus = 0;
           	        	return;
            	   }
           	       startSystemUpgradePrepareTask(task.id, nextDelayTime);
               }
               else	//后台报错
               {
            	   	console.log("系统升级失败:" + ret.msgInfo);
					$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("升级失败", ":", ret.msgInfo));
               }
            },
            error : function () {	//后台异常
        	   	console.log("系统升级失败:服务器异常");
				$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + + _Lang("升级失败", ":", "服务器异常"));
            }
    	});	
	}
	
	function stop(){
    	if(_status < 2)	//上传中
    	{
    		SystemUpgradeFileUpload.stopAllUpload();	        	
    	}
    	else
    	{
    		stopSystemUpgradePrepareTask(_taskId);
    	}
	}
	
	function stopSystemUpgradePrepareTask(taskId)
	{
		console.log("stopSystemUpgradePrepareTask() taskId:" + taskId);

		$.ajax({
            url : "/DocSystem/Manage/stopLongTermTask.do",
            type : "post",
            dataType : "json",
            data : {
                taskId: taskId,
            },
            success : function (ret) {
        	   console.log("stopSystemUpgradePrepareTask() ret:",ret);        
               if( "ok" == ret.status )
               {    
	           		console.log("stopSystemUpgradePrepareTask() 升级任务已取消");
	           		$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("升级任务已取消"));
	           		gStatus = 0;
               }
               else
               {
            	   	console.log("stopSystemUpgradePrepareTask() 升级任务取消失败:" + ret.msgInfo);
            	   	showErrorMessage("升级任务取消失败:" + ret.msgInfo);
               }
            },
            error : function () {	//后台异常
        	   	console.log("stopSystemUpgradePrepareTask() 系统升级失败:服务器异常");
        	   	showErrorMessage(_Lang("升级任务取消失败", ":", "服务器异常"));
            }
    	});	
	}
	
	//初始化上传控件
	SystemUpgradeFileUploadInit();
	
	//开放给外部的调用接口
    return {
    	start: function(files, firstFile){
    		start(files, firstFile);
        },
        stop: function(){
        	stop();
        },
        stopUpload: function(index){
        	stopUpload(index);
        },
        reuploadFailDocs: function(index){
        	reuploadFailDocs(index);
        },
        startSystemUpgradePrepareTask: function(taskId, delayTime){
        	startSystemUpgradePrepareTask(taskId, delayTime);
        },
    };
})();

function startUpgradeSystem(file)
{
	$.ajax({
        url : "/DocSystem/Manage/upgradeSystem.do",
        type : "post",
        dataType : "json",
        data : {
        	name: file.name,
        	size: file.size,
        },
        success : function (ret) {
        	console.log("upgradeSystem ret:",ret);
			if("ok" == ret.status){
				//showErrorMessage("系统升级中，请稍候...");
				var task = ret.data;
				SystemUpgrade.startSystemUpgradePrepareTask(task.id, 2000); //2秒后查询
				$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("升级准备中", ":" , task.info));
			 }
			 else	//上传失败
			 {
				//上传失败
				console.log("升级失败：" + ret.msgInfo);
				//showErrorMessage("升级失败:" + ret.msgInfo);
				$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("升级失败", ":", ret.msgInfo));
				gStatus = 0;
				return;
             }
        },
        error : function () {
			$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("升级失败", ":", "服务器异常"));
        	//showErrorMessage("升级失败: 服务器异常");
			gStatus = 0;
        }
    });
}

function stopUpgradeSystem()
{
	if(gStatus == 0)
	{
		$(".el-upload-list").hide();
		return;
	}

	qiao.bs.confirm({
        id: 'bsconfirm',
        title: _Lang("取消升级"),
        msg: _Lang('是否取消系统升级！'),
        okbtn: _Lang("取消升级"),
        qubtn: _Lang("继续"),
    },function(){
    	SystemUpgrade.stop();
    },function(){
        //alert('点击了取消！');
    });
}


function disableOffice(){
	console.log("disableOffice()");
	disableOfficeConfirm();
}

function enableOffice(){
	console.log("enableOffice()");
	enableOfficeConfirm();
}

function disableOfficeConfirm()
{
	console.log("disableOfficeConfirm()");
    qiao.bs.confirm({
    		id: "disableOfficeConfirmDialog",
	        title: _Lang("禁用Office"),
	        msg: _Lang("是否禁用Office？"),
	        okbtn: _Lang("禁用"),
	        qubtn: _Lang("取消"),
    	},function () {
			doDisableOffice();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function enableOfficeConfirm()
{
	console.log("enableOfficeConfirm()");
    qiao.bs.confirm({
    		id: "enableOfficeConfirDialog",
	        title: _Lang("启用Office"),
	        msg: _Lang("是否启用Office？"),
	        okbtn: _Lang("启用"),
	        qubtn: _Lang("取消"),
    	},function () {
			doEnableOffice();
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function doDisableOffice(){
	$.ajax({
        url : "/DocSystem/Manage/disableOffice.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
        	console.log("disableOffice ret:",ret);
            if( "ok" == ret.status )
            {	        		
        		systemInfo.officeDisabled = 1;
        		$("#btnEnableOffice").show();
        		$("#btnDisableOffice").hide();
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("禁用Office失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("禁用Office失败", ":", "服务器异常"));
        }
    });
}

function doEnableOffice(){
	$.ajax({
        url : "/DocSystem/Manage/enableOffice.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
        	console.log("enableOffice ret:",ret);
            if( "ok" == ret.status )
            {	        		
        		systemInfo.officeDisabled = 0;
        		$("#btnEnableOffice").hide();
        		$("#btnDisableOffice").show();
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("启用Office失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("启用Office失败", ":", "服务器异常"));
        }
    });
}

//安装字体
function addOfficeFonts(){
	console.log("addOfficeFonts()");
	
	switch(gStatus)
	{
	case 1:
		showErrorMessage(_Lang("系统升级中，请稍后重试!"));
		return;
	case 2:
		showErrorMessage(_Lang("正在安装Office，请稍后重试!"));			
		return;
	case 3:
		showErrorMessage(_Lang("正在在线安装Office，请稍后重试!"));			
		return;
	case 4:
		showErrorMessage(_Lang("正在安装字体，请稍后重试!"));			
		return;
	case 5:
		showErrorMessage(_Lang("正在重置字体库，请稍后重试!"));			
		return;
	}
	
	//清除文件控件
	$("#addOfficeFonts").val("");
    return $("#addOfficeFonts").click();
}

function addOfficeFontsConfirm(e)
{
	console.log("addOfficeFontsConfirm()");
	gStatus = 4;

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
    	   		//var relativePath = firstFile.webkitRelativePath;	//获取第一个文件的相对路径
    	   		//console.log("firstFile relativePath:"+firstFile.webkitRelativePath);
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
   		showErrorMessage(_Lang("请选择文件"));
    	gStatus = 0;
   		return false;
   	}  
    
    
    qiao.bs.confirm({
    		id: "addOfficeFontsConfirmDialog",
	        title: _Lang("添加字体"),
	        msg: _Lang("是否安装新字体？"),
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
    	},function () {
    		OfficeFontsInstall.start(files, firstFile);
	    	return true;   //close dialog
    	},function()
    	{
	    	gStatus = 0;
    		return true;	//close dialog
    	}
    );
}

//OfficeFontsInstall类
var OfficeFontsInstall = (function () {
	var _firstFile;
	var _status = 0;
	var _taskId;
	
	var OfficeFontsInstallFileUpload;
	function OfficeFontsInstallFileUploadInit()
	{
		var uploadDisplayInit = function(index, totalNum) {
			console.log("uploadDisplayInit index:" + index + " totalNum:" + totalNum);
			var str="<div><span class='upload-list-title'>[" + _Lang("安装字体") + "] " + _Lang("正在上传") + "  " +index +" / " + totalNum +"</span><i class='el-icon-close uploadCloseBtn' onclick='stopInstallOfficeFonts()'></i></div>";
			str +="<div id='uploadedFileList' class='uploadedFileList'></div>";
			$(".el-upload-list").show();
			$('.el-upload-list').html(str);
      	};
     
      	var showUploadingInfo = function(reuploadFlag, uploadStartedNum, totalNum, reuploadStartedNum, reuploadTotalNum)
      	{
      		if(reuploadFlag == false)
      		{
      			$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("正在上传") + " " + uploadStartedNum + " / " + totalNum);
      		}
      		else
      		{
      			$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("正在重传") + " " + reuploadStartedNum + " / " + reuploadTotalNum);
      		}
      	}
      	
		var createUploadItem = function(index, fileName) {
			console.log("createUploadItem index:" + index + " fileName:" + fileName);
			return "<li class='el-upload-list__item file" + index + " is-uploading' value=" + index + ">"+
			"<a class='el-upload-list__item-name uploadFileName'><i class='el-icon-document'></i><span class='uploadFileName' >"+ fileName +"</span></a>"+
			"<a class='reuploadBtn reupload" + index + "' onclick='OfficeFontsInstall.reuploadFailDocs("+ index +")'  style='display:none'>" + _Lang("重传") + "</a>"+
			"<label class='el-upload-list__item-status-label'><i class='el-icon-upload-success el-icon-circle-check'></i></label>"+
			"<i class='el-icon-close stopUpload'  value="+index+" onclick='OfficeFontsInstall.stopUpload("+ index +")'></i>"+
			"<div class='el-progress el-progress--line'>"+
				"<div class='el-progress-bar'>"+
					"<div class='el-progress-bar__outer' >"+
						"<div class='el-progress-bar__inner'></div>"+
					"</div>"+
				"</div>"+
				"<div class='el-progress__text' style='font-size: 12.8px;'></div>"+
			"</div>"+
		  "</li>";
		};
  		
		var appendUploadItems = function(uploadItemsHtmlStr) {
			$('#uploadedFileList').append(uploadItemsHtmlStr);
		};
				
  		var deleteUploadItem = function(index) {
	  		$('.file' + index).remove();      		
  		};

  		var updateUploadItem = function(index, speed, percent){
			$('.file'+index+' .el-progress__text').text(speed + " " + percent+"%");
			$('.file'+index+' .el-progress-bar__inner')[0].style.width = percent +"%"; //进度条

			//printUploadedTime();
  		};
  		
  		var stopAllUploadCallback = function(){  	  		
	    	//停止上传
  			$(".el-upload-list").hide();
	    	gStatus = 0;
  		};
  		
  		var reuploadItemInit = function(index){
      		//hide the reupload btn
    		$(".reupload"+index).hide();
    		
    		$('.file' + index).addClass('is-uploading');
			$('.file' + index).removeClass('is-fail');
  		};

  		var uploadSuccessCallback = function(index, context){  	  					
			//更新上传显示
  			$('.file'+index).removeClass('is-uploading');
  			$('.file'+index).addClass('is-success');
  			//hide the reupload btn
  			$(".reupload"+index).hide();
  		};
  		
  		var uploadErrorCallback = function(index){  	  		

  			$('.file' + index).removeClass('is-uploading');
  			$('.file' + index).addClass('is-fail');
  	  	
  	  		//show the reupload btn
  			$(".reupload" + index).show();
  		};
  		
  		var uploadEndCallback = function(totalNum, successNum)
  		{  	  		
      		//显示上传完成 
      		var uploadEndInfo = "[" + _Lang("安装字体") + "] " + _Lang("上传完成") + "(" + _LangStats(totalNum) + ")," + _Lang("开始安装...");
      		if(successNum != totalNum)
      		{
      			uploadEndInfo = "[" + _Lang("安装字体") + "] " + _Lang("上传失败") + "(" + _LangStats(totalNum, successNum) + ")";
      			$(".reuploadAllBtn").show();
      		}
      		else
      		{
      			$(".reuploadAllBtn").hide();
      			startInstalOfficeFonts(_firstFile);
      		}
      		$(".upload-list-title").text(uploadEndInfo);   		
      		
      		//清除文件控件
			$("#installOffice").val("");
  		};
  		
		var config = {
				uploadDisplayInit: uploadDisplayInit,
				showUploadingInfo: showUploadingInfo,
				createUploadItem: createUploadItem,
				appendUploadItems: appendUploadItems,		
				deleteUploadItem: deleteUploadItem,
				updateUploadItem: updateUploadItem,
				stopAllUploadCallback: stopAllUploadCallback,
				uploadSuccessCallback: uploadSuccessCallback,			
				uploadErrorCallback: uploadErrorCallback,			
				uploadEndCallback: uploadEndCallback,			
				reuploadItemInit: reuploadItemInit,
				usage: 3,	//OfficeFontsInstall
		};
  		
		OfficeFontsInstallFileUpload = new DocUpload(config);
	}
	    	
	//Re Upload Fail Docs
    function reuploadFailDocs(index)
    {
    	console.log("reuploadFailDocs() index:" + index);
    	OfficeFontsInstallFileUpload.reuploadFailDocs(index);
    }

	//Stop Upload
	function stopUpload(index)
	{
    	//var index = $(this).attr('value');	//value 不是i的原生属性，所以不能用value
    	console.log("stopUpload " + index);
    	OfficeFontsInstallFileUpload.stopUpload(index);
    }

	function start(files, firstFile){
		_firstFile = firstFile;
	  	var parentPath = "";
	  	var parentId = 0;
	  	var level = 0;
	  	var vid = -1;
	  	var parentNode = null;
		OfficeFontsInstallFileUpload.uploadDocs(files, parentNode, parentPath, parentId, level, vid);
	}
	
	function startOfficeFontsInstallPrepareTask(taskId, delayTime)
	{
		_taskId = taskId;
		console.log("startOfficeFontsInstallPrepareTask() taskId:" + taskId + " delayTime:" + delayTime);
		var nextDelayTime = delayTime; //每次增加5s
		if(nextDelayTime < 60000) //最长1分钟
		{
			nextDelayTime += 5000;
		}
		
		setTimeout(function () {
			console.log("timerForQueryOfficeFontsInstallPrepareTask triggered!");
			doQueryOfficeFontsInstallPrepareTask(taskId, nextDelayTime);
		},delayTime);	//check it 2s later	
	}
	
	function doQueryOfficeFontsInstallPrepareTask(taskId, nextDelayTime)
	{
		console.log("doQueryOfficeFontsInstallPrepareTask() taskId:" + taskId + " nextDelayTime:" + nextDelayTime);

		$.ajax({
            url : "/DocSystem/Manage/queryLongTermTask.do",
            type : "post",
            dataType : "json",
            data : {
                taskId: taskId,
            },
            success : function (ret) {
        	   console.log("doQueryOfficeFontsInstallPrepareTask() ret:",ret);        
               if( "ok" == ret.status )
               {    
            	   var task = ret.data;
           	       if(task.status == 200)
            	   {
	           			console.log("OfficeFontsInstallPrepareSuccessHandler() 字体安装完成:" + ret.msgInfo);
	           			$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("安装完成", ":", ret.msgInfo));
	           			gStatus = 0;
           	        	return;
            	   }
           	       startOfficeFontsInstallPrepareTask(task.id, nextDelayTime);
               }
               else	//后台报错
               {
            	   	console.log("字体安装失败:" + ret.msgInfo);
					$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("安装失败", ":", ret.msgInfo));
               }
            },
            error : function () {	//后台异常
        	   	console.log("字体安装失败:服务器异常");
				$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("安装失败", ":", "服务器异常"));
            }
    	});	
	}
	
	function stop()
	{
    	if(_status < 2)	//上传中
    	{
    		OfficeFontsInstallFileUpload.stopAllUpload();
    	}
    	else
    	{
    		stopOfficeFontsInstallPrepareTask(_taskId);
    	}
	}
	
	function stopOfficeFontsInstallPrepareTask(taskId)
	{
		console.log("stopOfficeFontsInstallPrepareTask() taskId:" + taskId);

		$.ajax({
            url : "/DocSystem/Manage/stopLongTermTask.do",
            type : "post",
            dataType : "json",
            data : {
                taskId: taskId,
            },
            success : function (ret) {
        	   console.log("stopOfficeFontsInstallPrepareTask() ret:",ret);        
               if( "ok" == ret.status )
               {    
	           		console.log("stopOfficeFontsInstallPrepareTask() 字体安装任务已取消");
	           		$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("字体安装任务已取消"));
               }
               else
               {
            	   	console.log("stopOfficeFontsInstallPrepareTask() 字体安装任务取消失败:" + ret.msgInfo);
            	   	showErrorMessage(_Lang("字体安装任务取消失败", ":", ret.msgInfo));
               }
            },
            error : function () {	//后台异常
        	   	console.log("stopOfficeFontsInstallPrepareTask() 字体安装任务取消失败:服务器异常");
        	   	showErrorMessage(_Lang("字体安装任务取消失败", ":", "服务器异常"));
            }
    	});	
	}
	
	//初始化上传控件
	OfficeFontsInstallFileUploadInit();
	
	//开放给外部的调用接口
    return {
    	start: function(files, firstFile){
    		start(files, firstFile);
        },
        stop: function(){
        	stop();
        },
        stopUpload: function(index){
        	stopUpload(index);
        },
        reuploadFailDocs: function(index){
        	reuploadFailDocs(index);
        },
        startOfficeFontsInstallPrepareTask: function(taskId, delayTime){
        	startOfficeFontsInstallPrepareTask(taskId, delayTime);
        },
	};
})();

function startInstalOfficeFonts(file)
{
	$.ajax({
        url : "/DocSystem/Bussiness/installOfficeFonts.do",
        type : "post",
        dataType : "json",
        data : {
        	name: file.name,
        	size: file.size,
        },
        success : function (ret) {
        	console.log("startInstalOfficeFonts() ret:",ret);
			if("ok" == ret.status){
				var task = ret.data;
				OfficeFontsInstall.startOfficeFontsInstallPrepareTask(task.id, 2000); //2秒后查询
				$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("安装准备中..."));
			 }
			 else	//上传失败
			 {
				//上传失败
				console.log("startInstalOfficeFonts() 字体安装失败：" + ret.msgInfo);
				$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("安装失败", ":", ret.msgInfo));
				gStatus = 0;
				return;
             }
        },
        error : function () {
	    	$(".upload-list-title").text("[" + _Lang("安装字体") + "] " + _Lang("安装失败", ":", "服务器异常"));
			gStatus = 0;
        }
    });
}

function stopInstallOfficeFonts(){
	if(gStatus == 0)
	{
		$(".el-upload-list").hide();
		return;
	}
	
	qiao.bs.confirm({
        id: 'bsconfirm',
        msg: _Lang('是否取消字体安装！'),
        title: _Lang("确认"),
        okbtn: _Lang("取消安装"),
        qubtn: _Lang("继续"),
    },function(){
    	OfficeFontsInstall.stop();
    },function(){
        //alert('点击了取消！');
    });
}

//安装OfficeEditor
function installOffice(){
	console.log("installOffice()");
	
	switch(gStatus)
	{
	case 1:
		showErrorMessage(_Lang("系统升级中，请稍后重试!"));
		return;
	case 2:
		showErrorMessage(_Lang("正在安装Office，请稍后重试!"));			
		return;
	case 3:
		showErrorMessage(_Lang("正在在线安装Office，请稍后重试!"));			
		return;
	case 4:
		showErrorMessage(_Lang("正在安装字体，请稍后重试!"));			
		return;
	case 5:
		showErrorMessage(_Lang("正在重置字体库，请稍后重试!"));			
		return;
	}
	
	//清除文件控件
	$("#installOffice").val("");
    return $("#installOffice").click();
}

function installOfficeConfirm(e)
{
	console.log("installOfficeConfirm()");
	gStatus = 2;

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
    	   		//var relativePath = firstFile.webkitRelativePath;	//获取第一个文件的相对路径
    	   		//console.log("firstFile relativePath:"+firstFile.webkitRelativePath);
    	   		break;
    	   	}
    	   	else
    	   	{
    	   		//This is something else 
    	   		//console.log("it is not a file");
    	   	}
    	}
    	
		var fileName = firstFile.name;
	    console.log("firstFile:"+fileName);
	    if(fileName.indexOf("office") == -1)
	    {
	    	showErrorMessage(_Lang("非法Office安装文件!"));
	    	gStatus = 0;
	    	return false;
	    }
    }
    else
   	{
   		showErrorMessage(_Lang("请选择文件"));
    	gStatus = 0;
   		return false;
   	}  
    
    
    qiao.bs.confirm({
    		id: "installOfficeConfirmDialog",
	        title: _Lang("安装Office"),
	        msg: _Lang("是否安装Office？"),
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
    	},function () {
    		OfficeInstall.start(files, firstFile);
	    	return true;   //close dialog
    	},function()
    	{
	    	gStatus = 0;
    		return true;	//close dialog
    	}
    );
}

//OfficeInstall类
var OfficeInstall = (function () {
	var _firstFile;
	var _status = 0;
	var _taskId;
	
	var OfficeInstallFileUpload;
	function OfficeInstallFileUploadInit()
	{
		var uploadDisplayInit = function(index, totalNum) {
			console.log("uploadDisplayInit index:" + index + " totalNum:" + totalNum);
			var str="<div><span class='upload-list-title'>[" + _Lang("安装Office") + "] " + _Lang("正在上传") + "  " +index +" / " + totalNum +"</span><i class='el-icon-close uploadCloseBtn' onclick='stopInstallOffice()'></i></div>";
			str +="<div id='uploadedFileList' class='uploadedFileList'></div>";
			$(".el-upload-list").show();
			$('.el-upload-list').html(str);
      	};
     
      	var showUploadingInfo = function(reuploadFlag, uploadStartedNum, totalNum, reuploadStartedNum, reuploadTotalNum)
      	{
      		if(reuploadFlag == false)
      		{
      			$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("正在上传") + " " + uploadStartedNum + " / " + totalNum);
      		}
      		else
      		{
      			$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("正在重传") + " " + reuploadStartedNum + " / " + reuploadTotalNum);
      		}
      	}
      	
		var createUploadItem = function(index, fileName) {
			console.log("createUploadItem index:" + index + " fileName:" + fileName);
			return "<li class='el-upload-list__item file" + index + " is-uploading' value=" + index + ">"+
			"<a class='el-upload-list__item-name uploadFileName'><i class='el-icon-document'></i><span class='uploadFileName' >"+ fileName +"</span></a>"+
			"<a class='reuploadBtn reupload" + index + "' onclick='OfficeInstall.reuploadFailDocs("+ index +")'  style='display:none'>" + _Lang("重传") + "</a>"+
			"<label class='el-upload-list__item-status-label'><i class='el-icon-upload-success el-icon-circle-check'></i></label>"+
			"<i class='el-icon-close stopUpload'  value="+index+" onclick='OfficeInstall.stopUpload("+ index +")'></i>"+
			"<div class='el-progress el-progress--line'>"+
				"<div class='el-progress-bar'>"+
					"<div class='el-progress-bar__outer' >"+
						"<div class='el-progress-bar__inner'></div>"+
					"</div>"+
				"</div>"+
				"<div class='el-progress__text' style='font-size: 12.8px;'></div>"+
			"</div>"+
		  "</li>";
		};
  		
		var appendUploadItems = function(uploadItemsHtmlStr) {
			$('#uploadedFileList').append(uploadItemsHtmlStr);
		};
				
  		var deleteUploadItem = function(index) {
	  		$('.file' + index).remove();      		
  		};

  		var updateUploadItem = function(index, speed, percent){
			$('.file'+index+' .el-progress__text').text(speed + " " + percent+"%");
			$('.file'+index+' .el-progress-bar__inner')[0].style.width = percent +"%"; //进度条

			//printUploadedTime();
  		};
  		
  		var stopAllUploadCallback = function(){  	  		
	    	//停止上传
  			$(".el-upload-list").hide();
	    	gStatus = 0;
  		};
  		
  		var reuploadItemInit = function(index){
      		//hide the reupload btn
    		$(".reupload"+index).hide();
    		
    		$('.file' + index).addClass('is-uploading');
			$('.file' + index).removeClass('is-fail');
  		};

  		var uploadSuccessCallback = function(index, context){  	  					
			//更新上传显示
  			$('.file'+index).removeClass('is-uploading');
  			$('.file'+index).addClass('is-success');
  			//hide the reupload btn
  			$(".reupload"+index).hide();
  		};
  		
  		var uploadErrorCallback = function(index){  	  		

  			$('.file' + index).removeClass('is-uploading');
  			$('.file' + index).addClass('is-fail');
  	  	
  	  		//show the reupload btn
  			$(".reupload" + index).show();
  		};
  		
  		var uploadEndCallback = function(totalNum, successNum)
  		{  	  		
      		//显示上传完成 
      		var uploadEndInfo = "[" + _Lang("安装Office") + "] " + _Lang("上传完成") + "(" + _LangStats(totalNum) + ")," + _Lang("开始安装...");
      		if(successNum != totalNum)
      		{
      			uploadEndInfo = "[" + _Lang("安装Office") + "] " + _Lang("上传失败") + "(" + _LangStats(totalNum, successNum) + ")";
      			$(".reuploadAllBtn").show();
      		}
      		else
      		{
      			$(".reuploadAllBtn").hide();
      			startInstalOffice(_firstFile);
      		}
      		$(".upload-list-title").text(uploadEndInfo);   		
      		
      		//清除文件控件
			$("#installOffice").val("");
  		};
  		
		var config = {
				uploadDisplayInit: uploadDisplayInit,
				showUploadingInfo: showUploadingInfo,
				createUploadItem: createUploadItem,
				appendUploadItems: appendUploadItems,		
				deleteUploadItem: deleteUploadItem,
				updateUploadItem: updateUploadItem,
				stopAllUploadCallback: stopAllUploadCallback,
				uploadSuccessCallback: uploadSuccessCallback,			
				uploadErrorCallback: uploadErrorCallback,			
				uploadEndCallback: uploadEndCallback,			
				reuploadItemInit: reuploadItemInit,
				usage: 2,	//OfficeInstall
		};
  		
		OfficeInstallFileUpload = new DocUpload(config);
	}
	    	
	//Re Upload Fail Docs
    function reuploadFailDocs(index)
    {
    	console.log("reuploadFailDocs() index:" + index);
    	OfficeInstallFileUpload.reuploadFailDocs(index);
    }

	//Stop Upload
	function stopUpload(index)
	{
    	//var index = $(this).attr('value');	//value 不是i的原生属性，所以不能用value
    	console.log("stopUpload " + index);
    	OfficeInstallFileUpload.stopUpload(index);
    }

	function start(files, firstFile){
		_firstFile = firstFile;
	  	var parentPath = "";
	  	var parentId = 0;
	  	var level = 0;
	  	var vid = -1;
	  	var parentNode = null;
		OfficeInstallFileUpload.uploadDocs(files, parentNode, parentPath, parentId, level, vid);
	}
	
	function startOfficeInstallPrepareTask(taskId, delayTime)
	{
		_taskId = taskId;
		console.log("startOfficeInstallPrepareTask() taskId:" + taskId + " delayTime:" + delayTime);
		var nextDelayTime = delayTime; //每次增加5s
		if(nextDelayTime < 60000) //最长1分钟
		{
			nextDelayTime += 5000;
		}
		
		setTimeout(function () {
			console.log("timerForQueryOfficeInstallPrepareTask triggered!");
			doQueryOfficeInstallPrepareTask(taskId, nextDelayTime);
		},delayTime);	//check it 2s later	
	}
	
	function doQueryOfficeInstallPrepareTask(taskId, nextDelayTime)
	{
		console.log("doQueryOfficeInstallPrepareTask() taskId:" + taskId + " nextDelayTime:" + nextDelayTime);

		$.ajax({
            url : "/DocSystem/Manage/queryLongTermTask.do",
            type : "post",
            dataType : "json",
            data : {
                taskId: taskId,
            },
            success : function (ret) {
        	   console.log("doQueryOfficeInstallPrepareTask() ret:",ret);        
               if( "ok" == ret.status )
               {    
            	   var task = ret.data;
           	       if(task.status == 200)
            	   {
	           			console.log("OfficeInstallPrepareSuccessHandler() Off编辑器安装完成");
	           			$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("Office编辑器安装完成"));
	           			gStatus = 0;
           	        	return;
            	   }
           	       startOfficeInstallPrepareTask(task.id, nextDelayTime);
               }
               else	//后台报错
               {
            	   	console.log("Office安装失败:" + ret.msgInfo);
					$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("安装失败", ":", ret.msgInfo));
               }
            },
            error : function () {	//后台异常
        	   	console.log("Office安装失败:服务器异常");
				$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("安装失败", ":", "服务器异常"));
            }
    	});	
	}
	
	function stop()
	{
    	if(_status < 2)	//上传中
    	{
    		OfficeInstallFileUpload.stopAllUpload();
    	}
    	else
    	{
    		stopOfficeInstallPrepareTask(_taskId);
    	}
	}
	
	function stopOfficeInstallPrepareTask(taskId)
	{
		console.log("stopOfficeInstallPrepareTask() taskId:" + taskId);

		$.ajax({
            url : "/DocSystem/Manage/stopLongTermTask.do",
            type : "post",
            dataType : "json",
            data : {
                taskId: taskId,
            },
            success : function (ret) {
        	   console.log("stopOfficeInstallPrepareTask() ret:",ret);        
               if( "ok" == ret.status )
               {    
	           		console.log("stopOfficeInstallPrepareTask() Office安装任务已取消");
	           		$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("Office安装任务已取消"));
               }
               else
               {
            	   	console.log("stopOfficeInstallPrepareTask() Office安装任务取消失败:" + ret.msgInfo);
            	   	showErrorMessage(_Lang("Office安装任务取消失败", ":", ret.msgInfo));
               }
            },
            error : function () {	//后台异常
        	   	console.log("stopOfficeInstallPrepareTask() Office安装任务取消失败:服务器异常");
        	   	showErrorMessage(_Lang("Office安装任务取消失败", ":", "服务器异常"));
            }
    	});	
	}
	
	//初始化上传控件
	OfficeInstallFileUploadInit();
	
	//开放给外部的调用接口
    return {
    	start: function(files, firstFile){
    		start(files, firstFile);
        },
        stop: function(){
        	stop();
        },
        stopUpload: function(index){
        	stopUpload(index);
        },
        reuploadFailDocs: function(index){
        	reuploadFailDocs(index);
        },
        startOfficeInstallPrepareTask: function(taskId, delayTime){
        	startOfficeInstallPrepareTask(taskId, delayTime);
        },
	};
})();

function startInstalOffice(file)
{
	$.ajax({
        url : "/DocSystem/Bussiness/installOffice.do",
        type : "post",
        dataType : "json",
        data : {
        	name: file.name,
        	size: file.size,
        },
        success : function (ret) {
        	console.log("installOffice ret:",ret);
			if("ok" == ret.status){
				//showErrorMessage("Office编辑器安装成功");
				var task = ret.data;
				OfficeInstall.startOfficeInstallPrepareTask(task.id, 2000); //2秒后查询
				$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("安装准备中..."));
			 }
			 else	//上传失败
			 {
				//上传失败
				console.log("Office编辑器安装失败：" + ret.msgInfo);
				//showErrorMessage("Office编辑器安装失败:" + ret.msgInfo);
		    	$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("安装失败", ":", ret.msgInfo));
				gStatus = 0;
				return;
             }
        },
        error : function () {
			//showErrorMessage("Office编辑器安装失败: 服务器异常");
	    	$(".upload-list-title").text("[" + _Lang("安装Office") + "] " + _Lang("安装失败", ":", "服务器异常"));
			gStatus = 0;
        }
    });
}

function stopInstallOffice(){
	if(gStatus == 0)
	{
		$(".el-upload-list").hide();
		return;
	}
	
	qiao.bs.confirm({
        id: 'bsconfirm',
        msg: _Lang('是否取消Office安装！'),
        title: _Lang("确认"),
        okbtn: _Lang("取消安装"),
        qubtn: _Lang("继续"),
    },function(){
    	OfficeInstall.stop();
    },function(){
        //alert('点击了取消！');
    });
}


//在线安装
function onlineInstallOfficeConfirm()
{
	console.log("onlineInstallOfficeConfirm()");
	switch(gStatus)
	{
	case 1:
		showErrorMessage(_Lang("系统升级中，请稍后重试!"));
		return;
	case 2:
		showErrorMessage(_Lang("正在安装Office，请稍后重试!"));			
		return;
	case 3:
		showErrorMessage(_Lang("正在在线安装Office，请稍后重试!"));			
		return;
	case 4:
		showErrorMessage(_Lang("正在安装字体，请稍后重试!"));			
		return;
	case 5:
		showErrorMessage(_Lang("正在重置字体库，请稍后重试!"));			
		return;
	}
	
	gStatus = 3;
    qiao.bs.confirm({
    		id: "onlineInstallOfficeConfirmDialog",
	        title: _Lang("安装Office"),
	        msg: _Lang("在线安装OfficeEditor大约需要10分钟, 是否安装？"),
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
			startOnlineInstallOffice();
	    	return true;   //close dialog
    	},function()
    	{
    		gStatus = 0;
    		return true;	//close dialog
    	}
    );
}

function startOnlineInstallOffice()
{
	console.log("startOnlineInstallOffice()");
	$.ajax({
        url : "/DocSystem/Bussiness/onlineInstallOffice.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
        	console.log("startOnlineInstallOffice ret",ret);
            if( "ok" == ret.status )
            {
            	showErrorMessage(_Lang("安装成功"));
            	gStatus = 0;
            }
            else 
            {
                console.log(ret.msgInfo);
	        	showErrorMessage(_Lang("安装失败", ":", ret.msgInfo));	               
	        	gStatus = 0;
            }
        },
        error : function () {
        	showErrorMessage(_Lang("安装失败", ":", "服务器异常"));
        	gStatus = 0;
        }
    });
}

function startOnlineInstallOffice()
{
	console.log("startOnlineInstallOffice()");
    $.ajax({
        url : "/DocSystem/Bussiness/onlineInstallOffice.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status ){
        	    console.log("startOnlineInstallOffice start ret:",ret);   
        	    showErrorMessage(_Lang("Office安装中，可能需要花费较长时间，您可先关闭当前窗口！"));
				startOnlineInstallOfficeQueryTask(ret.data.id, 2000); //2秒后查询
        	    return;
            }else {
            	showErrorMessage(_Lang("安装失败", ":", ret.msgInfo));
            	gStatus = 0;
            }
        },
        error : function () {
        	showErrorMessage(_Lang("安装失败", ":", "服务器异常"));
        	gStatus = 0;
        }
    });
}

function startOnlineInstallOfficeQueryTask(taskId, delayTime)
{
	console.log("startGenerateOfficeFontsQueryTask() taskId:" + taskId + " delayTime:" + delayTime);
	var nextDelayTime = delayTime; //每次增加5s
	if(nextDelayTime < 60000) //最长1分钟
	{
		nextDelayTime += 5000;
	}
	
	setTimeout(function () {
		console.log("timerForQueryOnlineInstallOfficeTask triggered!");
		doQueryOnlineInstallOfficeTask(taskId, nextDelayTime);
	},delayTime);	//check it 2s later	
}

function doQueryOnlineInstallOfficeTask(taskId, nextDelayTime)
{
	console.log("doQueryOnlineInstallOfficeTask() taskId:" + taskId);

	$.ajax({
        url : "/DocSystem/Manage/queryLongTermTask.do",
        type : "post",
        dataType : "json",
        data : {
            taskId: taskId,
        },
        success : function (ret) {
    	   console.log("doQueryOnlineInstallOfficeTask() ret:",ret);        
           if( "ok" == ret.status )
           {    
        	   var task = ret.data;
       	       if(task.status == 200)
        	   {
           			console.log("doQueryOnlineInstallOfficeTask() 在线安装Office成功");
           			gStatus = 0;
           			showErrorMessage(_Lang("在线安装Office成功"));
           			return;
        	   }
       	       startOnlineInstallOfficeQueryTask(task.id, nextDelayTime);
           }
           else	//后台报错
           {
        	   	console.log("在线安装Office失败:" + ret.msgInfo);
       			showErrorMessage(_Lang("在线安装Office失败", " : ", ret.msgInfo));
       			gStatus = 0;
           }
        },
        error : function () {	//后台异常
    	   	console.log("在线安装Office失败:服务器异常");
   			showErrorMessage(_Lang("在线安装Office失败", " : ", "服务器异常"));
   			gStatus = 0;
        }
	});		
}

//重新生成字体库
function generateOfficeFontsConfirm()
{
	console.log("generateOfficeFontsConfirm()");
	switch(gStatus)
	{
	case 1:
		showErrorMessage(_Lang("系统升级中，请稍后重试!"));
		return;
	case 2:
		showErrorMessage(_Lang("正在安装Office，请稍后重试!"));			
		return;
	case 3:
		showErrorMessage(_Lang("正在在线安装Office，请稍后重试!"));			
		return;
	case 4:
		showErrorMessage(_Lang("正在安装字体，请稍后重试!"));			
		return;
	case 5:
		showErrorMessage(_Lang("正在重置字体库，请稍后重试!"));			
		return;
	}
	
	gStatus = 5;
    qiao.bs.confirm({
    		id: "generateOfficeFontsConfirmDialog",
	        title: _Lang("重置字体库"),
	        msg: _Lang("重新生成字体库大约需要10分钟, 期间将无法使用Office, 是否重置？"),
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
			startGenerateOfficeFonts();
	    	return true;   //close dialog
    	},function()
    	{
    		gStatus = 0;
    		return true;	//close dialog
    	}
    );
}

function startGenerateOfficeFonts()
{
	console.log("startGenerateOfficeFonts()");
    $.ajax({
        url : "/DocSystem/Bussiness/generateOfficeFonts.do",
        type : "post",
        dataType : "json",
        data : {
        },
        success : function (ret) {
            if( "ok" == ret.status ){
        	    console.log("generateOfficeFonts start ret:",ret);   
        	    showErrorMessage(_Lang("字体库生成中，可能需要花费较长时间，您可先关闭当前窗口！"));
				startGenerateOfficeFontsQueryTask(ret.data.id, 2000); //2秒后查询
        	    return;
            }else {
            	showErrorMessage(_Lang("重置字体库失败", ":", ret.msgInfo));
            	gStatus = 0;
            }
        },
        error : function () {
        	showErrorMessage(_Lang("重置字体库失败", ":", "服务器异常"));
        	gStatus = 0;
        }
    });
}

function startGenerateOfficeFontsQueryTask(taskId, delayTime)
{
	console.log("startGenerateOfficeFontsQueryTask() taskId:" + taskId + " delayTime:" + delayTime);
	var nextDelayTime = delayTime; //每次增加5s
	if(nextDelayTime < 60000) //最长1分钟
	{
		nextDelayTime += 5000;
	}
	
	setTimeout(function () {
		console.log("timerForQueryGenerateOfficeFontsTask triggered!");
		doQueryGenerateOfficeFontsTask(taskId, nextDelayTime);
	},delayTime);	//check it 2s later	
}

function doQueryGenerateOfficeFontsTask(taskId, nextDelayTime)
{
	console.log("doQueryGenerateOfficeFontsTask() taskId:" + taskId);

	$.ajax({
        url : "/DocSystem/Manage/queryLongTermTask.do",
        type : "post",
        dataType : "json",
        data : {
            taskId: taskId,
        },
        success : function (ret) {
    	   console.log("doQueryGenerateOfficeFontsTask() ret:",ret);        
           if( "ok" == ret.status )
           {    
        	   var task = ret.data;
       	       if(task.status == 200)
        	   {
           			console.log("doQueryGenerateOfficeFontsTask() 字体库重置成功");
           			gStatus = 0;
           			showErrorMessage(_Lang("字体库重置成功"));
           			return;
        	   }
       	       startGenerateOfficeFontsQueryTask(task.id, nextDelayTime);
           }
           else	//后台报错
           {
        	   	console.log("字体库重置失败:" + ret.msgInfo);
       			showErrorMessage(_Lang("字体库重置失败", " : ", ret.msgInfo));
       			gStatus = 0;
           }
        },
        error : function () {	//后台异常
    	   	console.log("字体库重置失败:服务器异常");
   			showErrorMessage(_Lang("字体库重置失败", " : ", "服务器异常"));
   			gStatus = 0;
        }
	});		
}

var systemLogSearchWord = "";
function searchSystemLog()
{
	systemLogSearchWord = $("#search-systemLog").val();
	showSystemLogList();
}

function showSystemLogList(pageIndex){
	var pageSize = gPageSize;
	pageIndex = pageIndex ? pageIndex : 0;
	gPageIndex = pageIndex;
	
	$.ajax({
        url : "/DocSystem/Bussiness/getSystemLogList.do",
        type : "post",
        dataType : "json",
        data : {
            searchWord: systemLogSearchWord,
        	pageIndex: pageIndex,
        	pageSize: pageSize
        },
        success : function (ret) {
        	console.log("getSystemLogList ret",ret);
            if( "ok" == ret.status )
            {
            	SystemLogListDisplay(ret.data, pageIndex, pageSize, function(){

                    // 渲染分页
                    var total = ret.dataEx;
                    $("#systemLogList-pagination").pagination({
                        /*当前页码*/
                        currentPage: pageIndex + 1,
                        /*总共有多少页*/
                        totalPage: Math.ceil(total/pageSize),
                        /*是否显示首页、尾页 true：显示 false：不显示*/
                        isShow:true,
                        /*分页条显示可见页码数量*/
                        count:5,
                        /*第一页显示文字*/
                        homePageText: _Lang('首页'),
                        /*最后一页显示文字*/
                        endPageText: _Lang('尾页'),
                        /*上一页显示文字*/
                        prevPageText: _Lang('上一页'),
                        /* 下一页显示文字*/
                        nextPageText: _Lang('下一页'),
                        /*点击翻页绑定事件*/
                        callback: function(newPageIndex) {
                            // 分页插件的页码从1开始，减1处理
                            showSystemLogList(newPageIndex - 1);
                        }
                    });
                });
            }
            else 
            {
                console.log(ret.msgInfo);
	        	showErrorMessage(_Lang("查询失败", ":", ret.msgInfo));	                
            }
        },
        error : function () {
        	showErrorMessage(_Lang("查询失败", ":", "服务器异常"));
        }
    });
}

function SystemLogListDisplay(list, pageIndex, pageSize, callback)
{
	var index = pageIndex ? pageIndex : 0
	var offset = index * pageSize;
   	for(var i=0; i<list.length; i++)
    {
   		var node = list[i];
	    node.pageIndex = pageIndex;
   		node.index = i + offset;
		node.formatedTime = formatTime(node.time);
		formatSystemLogContent(node);
    }
   	console.log("SystemLogListDisplay list", list);
    $Func.render($("#container"),"systemLog" + langExt,{"list":list}, callback);
}

function formatSystemLogContent(node)
{
	console.log("formatSystemLogContent content:" + node.content);
	switch(node.event)
	{
	case "addRepos":
		node.formatedContent = "[" + _Lang("新建仓库") + " " + node.event + "] [" + node.reposName + "]";
		break;
	case "deleteRepos":
		node.formatedContent = "[" + _Lang("删除仓库") + " " + node.event + "] [" + node.reposName + "]";
		break;
	case "updateReposInfo":
		node.formatedContent = "[" + _Lang("修改仓库") + " " + node.event + "] [" + node.reposName + "]";
		break;
	case "configReposAuth":
		node.formatedContent = "[" + _Lang("设置仓库权限") + " " + node.event + "] [" + node.reposName + "]";
		break;
	case "deleteReposAuth":
		node.formatedContent = "[" + _Lang("删除仓库权限") + " " + node.event + "] [" + node.reposName + "]";
		break;
	case "pushDoc":
		node.formatedContent = "[" + _Lang("文件推送") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "saveDocEx":
		node.formatedContent = "[" + _Lang("上传文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "addDoc":
		node.formatedContent = "[" + _Lang("新增文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "deleteDoc":
		node.formatedContent = "[" + _Lang("删除文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "uploadDoc":
		node.formatedContent = "[" + _Lang("上传文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "downloadDocPrepare":
		node.formatedContent = "[" + _Lang("下载文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "downloadDoc":
		node.formatedContent = "[" + _Lang("下载文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "copyDoc":
		node.formatedContent = "[" + _Lang("复制文件") + " " + node.event + "] [" + node.path + node.name + "] 到 [" + node.newPath + node.newName + "] [" + node.reposName + "]";
		break;
	case "moveDoc":
		node.formatedContent = "[" + _Lang("移动文件") + " " + node.event + "] [" + node.path + node.name + "] 到 [" + node.newPath + node.newName + "] [" + node.reposName + "]";
		break;
	case "renameDoc":
		node.formatedContent = "[" + _Lang("重命名文件") + " " + node.event + "] [" + node.path + node.name + "] 为 [" + node.newPath + node.newName + "] [" + node.reposName + "]";
		break;
	case "updateDocContent":
		node.formatedContent = "[" + _Lang("更新文件内容") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "uploadMarkdownPic":
		node.formatedContent = "[" + _Lang("上传备注图片") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;	
	case "lockDoc":
		node.formatedContent = "[" + _Lang("锁定文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "unlockDoc":
		node.formatedContent = "[" + _Lang("解锁文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "setDocPwd":
		node.formatedContent = "[" + _Lang("设置文件访问密码") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "downloadHistoryDocPrepare":
		node.formatedContent = "[" + _Lang("下载历史文件") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "revertDocHistory":
		node.formatedContent = "[" + _Lang("恢复文件历史版本") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "addDocShare":
		node.formatedContent = "[" + _Lang("新建文件分享") + " " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "updateDocShare":
		node.formatedContent = "[" + _Lang("修改文件分享") + " " + node.event + "] ";
		break;
	case "deleteDocShare":
		node.formatedContent = "[" + _Lang("删除文件分享") + " " + node.event + "]";
		break;
	case "configDocAuth":
		node.formatedContent = "[" + _Lang("设置文件权限") + "  " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "deleteDocAuth":
		node.formatedContent = "[" + _Lang("删除文件权限") + "  " + node.event + "] [" + node.path + node.name + "] [" + node.reposName + "]";
		break;
	case "login":
		node.formatedContent = "[" + _Lang("登录系统") + " " + node.event + "]";
		break;
	case "logout":
		node.formatedContent = "[" + _Lang("退出登录") + " " + node.event + "]";
		break;
	case "register":
		node.formatedContent = "[" + _Lang("用户注册") + " " + node.event + "]";
		break;
	default:
		node.formatedContent = "[" + node.action + " " + node.event + "] ";
		if(node.path)
		{
			node.formatedContent += "[" + node.path + node.name + "] ";				
		}
		if(node.reposName)
		{
			node.formatedContent += "[" + node.reposName + "]";				
		}
		break;
	}
	if(node.content)
	{
		node.formatedContent = node.formatedContent + " " + node.content;
	}
}

function delSystemLogConfirm(id, time, pageIndex, index)
{	
	console.log("delSystemLogConfirm pageIndex:" + pageIndex);
	qiao.bs.confirm({
		id: "delSystemLogConfirm",
        title: _Lang("删除系统日志"),
        msg: _Lang("是否删除系统日志？"),
        okbtn: _Lang("删除"),
        qubtn: _Lang("取消"),
    },function () {
    	deleteSystemLog(id, time, pageIndex, index);
    	return true;   
    });
}

function deleteSystemLog(id, time, pageIndex, index){
	console.log("deleteSystemLog pageIndex:" + pageIndex);
    $.ajax({
        url : "/DocSystem/Bussiness/deleteSystemLog.do",
        type : "post",
        dataType : "json",
        data : {
        	logId : id,
        	time : time,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	//if(index == 0 && pageIndex != 0)
            	//{
            	//	pageIndex -= 1;
            	//}
            	showSystemLogList(pageIndex);	//刷新list
                showErrorMessage(_Lang("删除成功"));
            }else {
            	showErrorMessage(_Lang("删除失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("删除失败", ":", "服务器异常"));
        }
    });
}

var orderSearchWord = "";
function searchOrder()
{
	orderSearchWord = $("#search-order").val();		
	showOrderList();		
}
function showOrderList(pageIndex){
	var pageSize = gPageSize;
	pageIndex = pageIndex ? pageIndex : 0;
	gPageIndex = pageIndex;

	$.ajax({
        url : "/DocSystem/pay/getOrderList.do",
        type : "post",
        dataType : "json",
        data : {
            searchWord: orderSearchWord,
        	pageIndex: pageIndex,
        	pageSize: pageSize
        },
        success : function (ret) {
        	console.log("getOrderList ret",ret);
            if( "ok" == ret.status )
            {
            	OrderListDisplay(ret.data, pageIndex, pageSize, function(){

                    // 渲染分页
                    var total = ret.dataEx;
                    $("#orderList-pagination").pagination({
                        /*当前页码*/
                        currentPage: pageIndex + 1,
                        /*总共有多少页*/
                        totalPage: Math.ceil(total/pageSize),
                        /*是否显示首页、尾页 true：显示 false：不显示*/
                        isShow:true,
                        /*分页条显示可见页码数量*/
                        count:5,
                        /*第一页显示文字*/
                        homePageText: _Lang('首页'),
                        /*最后一页显示文字*/
                        endPageText: _Lang('尾页'),
                        /*上一页显示文字*/
                        prevPageText: _Lang('上一页'),
                        /* 下一页显示文字*/
                        nextPageText: _Lang('下一页'),
                        /*点击翻页绑定事件*/
                        callback: function(newPageIndex) {
                            // 分页插件的页码从1开始，减1处理
                            showOrderList(newPageIndex - 1);
                        }
                    });
            	});
            }
            else 
            {
                console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取订单列表失败", ":", "服务器异常"));
        }
    });
}

function OrderListDisplay(list, pageIndex, pageSize, callback)
{
	var index = pageIndex ? pageIndex : 0
	var offset = index * pageSize;
	       	
   	for(var i=0; i<list.length; i++)
    {
   		var node = list[i];
	    node.pageIndex = pageIndex;
	 	node.index = i + offset;
		node.createDate = formatTime(node.createTime);
		node.formatedState = formateOrderSatus(node);
		node.formatedPayType = formatePayType(node);
		node.showRefund = needShowRefundBtn(node);
    }		
	$Func.render($("#container"),"order" + langExt,{"list":list}, callback);
}

function needShowRefundBtn(node)
{
	//没有退款成功的订单都可以继续退款
	if(node.payType == "Pay" && node.orderStatus != "Refunded")
	{
		var curTime = new Date().getTime();
		//console.log("needShowRefundBtn curTime:" + curTime + " createTime:" + node.createTime + " diff:" + (curTime - node.createTime));
		if(curTime <= node.createTime)
		{
			return true;
		}	
		
		//根据订单时间决定是否显示
		var diff = curTime - node.createTime;
	    switch(node.orderStatus)
	    {
	    case "Paid":
	    case "Success":
	    	//支付成功的订单一个月后不许退款
			return 	(diff < 30*24*60*60*1000);
		default:
			//支付异常的订单7天后不许退款
			return (diff < 7*24*60*60*1000);
	    }
	}
	return false;
}

function formatePayType(node)
{
	switch(node.payType)
	{
	case "Pay":
		return _Lang("付款");
	case "Refund":
		return _Lang("退款");
	}
	return node.payType;
}

function formateOrderSatus(node)
{
	switch(node.orderStatus)
	{
	case "Processing":
			return _Lang("未完成");
	case "Paid":
	case "Success":
			return _Lang("成功");
	case "Failed":
			return _Lang("失败");
	case "Refunded":
			return _Lang("已全额退款");		
	}
	return node.orderStatus;
}

function refundOrderConfirm(orderNo, pageIndex, index)
{	
	console.log("refundLicenseConfirm pageIndex:" + pageIndex);
	qiao.bs.confirm({
		id: "refundLicenseConfirm",
        title: _Lang("退款"),
        msg: _Lang("是否退款？"),
        okbtn: _Lang("退款"),
        qubtn: _Lang("取消"),
    },function () {
    	refundOrder(orderNo, pageIndex, index);
    	return true;   
    });
}

function refundOrder(orderNo, pageIndex, index){
	console.log("refundOrder pageIndex:" + pageIndex);
	$.ajax({
        url : "/DocSystem/pay/refund/" + orderNo,
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status ){
               	showOrderList(pageIndex);
                showErrorMessage(_Lang("退款成功"));
            }else {
               	showOrderList(pageIndex);
            	showErrorMessage(_Lang("退款失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("退款失败", ":", "服务器异常"));
        }
    });
}

var licenseSearchWord = "";
function searchLicense()
{
	licenseSearchWord = $("#search-license").val();
	showLicenseList();
}

function showLicenseList(pageIndex){
	
	var pageSize = gPageSize;
	pageIndex = pageIndex ? pageIndex : 0;
	gPageIndex = pageIndex;
	
	$.ajax({
        url : "/DocSystem/Sales/getLicenseList.do",
        type : "post",
        dataType : "json",
        data : {
            searchWord: licenseSearchWord,
        	pageIndex: pageIndex,
        	pageSize: pageSize
        },
        success : function (ret) {
        	console.log("getLicenseList ret",ret);
            if( "ok" == ret.status )
            {
            	LicenseListDisplay(ret.data, pageIndex, pageSize, function(){

                    // 渲染分页
                    var total = ret.dataEx;
                    $("#licenseList-pagination").pagination({
                        /*当前页码*/
                        currentPage: pageIndex + 1,
                        /*总共有多少页*/
                        totalPage: Math.ceil(total/pageSize),
                        /*是否显示首页、尾页 true：显示 false：不显示*/
                        isShow:true,
                        /*分页条显示可见页码数量*/
                        count:5,
                        /*第一页显示文字*/
                        homePageText: _Lang('首页'),
                        /*最后一页显示文字*/
                        endPageText: _Lang('尾页'),
                        /*上一页显示文字*/
                        prevPageText: _Lang('上一页'),
                        /* 下一页显示文字*/
                        nextPageText: _Lang('下一页'),
                        /*点击翻页绑定事件*/
                        callback: function(newPageIndex) {
                            // 分页插件的页码从1开始，减1处理
                            showLicenseList(newPageIndex - 1);
                        }
                    });
                });
            }
            else 
            {
                console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取证书列表失败", ":", "服务器异常"));
        }
    });
}

function LicenseListDisplay(list, pageIndex, pageSize, callback)
{
	var index = pageIndex ? pageIndex : 0
	var offset = index * pageSize;
	       	
   	for(var i=0; i<list.length; i++)
    {
   		var node = list[i];
	    node.pageIndex = pageIndex;
  		node.index = i + offset;
		node.createDate = formatTime(node.createTime);
		node.expireDate = "长期";
		if(node.expireTime)
		{
			node.expireDate = formatDate(node.expireTime);				
		}
		node.formatedState = "正常";
		if(node.state != undefined)
		{
			if(node.state == 0)
			{
				node.formatedState = "已作废";
			}
		}

		node.formatedType = getFormatedLicenseType(node.type, node.hasLicense);
		
		if(node.installedCount)
		{
			node.formatedInstallInfo = "已安装" + node.installedCount + "次, [" + node.installedMacList + "]";
		}
    }		
	$Func.render($("#container"),"license" + langExt,{"list":list}, callback);
}

function downloadLicenseConfirm(id)
{	
	console.log("downloadLicenseConfirm id:", id);
	qiao.bs.confirm({
		id: "downloadLicenseConfirm",
        title: "下载证书",
        msg: "是否下载证书？",
        okbtn: "下载",
        qubtn: "取消",
    },function () {
    	downloadLicense(id);
    	return true;   
    });
}

function downloadLicense(id){
    $.ajax({
        url : "/DocSystem/Sales/downloadLicense.do",
        type : "post",
        dataType : "json",
        data : {
        	licenseId : id,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
        	    console.log("downloadLicense Ok:",ret);        	   		
            	window.location.href = ret.data;
            }else {
            	showErrorMessage("错误：" + ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage("服务器异常:删除失败");
        }
    });
}

function delLicenseConfirm(id, pageIndex, index)
{	
	console.log("delLicenseConfirm pageIndex:" + pageIndex);
	qiao.bs.confirm({
		id: "delLicenseConfirm",
        title: "删除证书",
        msg: "是否删除证书？",
        okbtn: "删除",
        qubtn: "取消",
    },function () {
    	delLicense(id, pageIndex, index);
    	return true;   
    });
}

function delLicense(id, pageIndex, index){
	console.log("delLicense pageIndex:" + pageIndex);
	$.ajax({
        url : "/DocSystem/Sales/deleteLicense.do",
        type : "post",
        dataType : "json",
        data : {
        	licenseId : id,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	//if(index == 0 && pageIndex != 0)
            	//{
            	//	pageIndex -= 1;
            	//}
               	showLicenseList(pageIndex);
                showErrorMessage("删除成功");
            }else {
            	showErrorMessage("错误：" + ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage("服务器异常:删除失败");
        }
    });
}

function deperacateLicenseConfirm(id, pageIndex)
{	
	console.log("deperacateLicenseConfirm pageIndex:" + pageIndex);
	qiao.bs.confirm({
		id: "deperacateLicenseConfirm",
        title: "作废证书",
        msg: "是否作废证书？",
        okbtn: "作废",
        qubtn: "取消",
    },function () {
    	deperacateLicense(id, pageIndex);
    	return true;   
    });
}

function deperacateLicense(id, pageIndex){
	console.log("deperacateLicense pageIndex:" + pageIndex);
	$.ajax({
        url : "/DocSystem/Sales/deperacateLicense.do",
        type : "post",
        dataType : "json",
        data : {
        	licenseId : id,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
               	showLicenseList(pageIndex);
                showErrorMessage("证书已作废");
            }else {
            	showErrorMessage("错误：" + ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage("操作失败:服务器异常");
        }
    });
}


//成员管理
var userSearchWord = "";	//清除搜索关键字
function searchUser()
{
	userSearchWord = $("#search-userName").val();
	showUserList();
}

function showUserList(pageIndex){
	console.log("showUserList pageIndex:" + pageIndex);
	
	var pageSize = gPageSize;
	pageIndex = pageIndex ? pageIndex : 0;
	gPageIndex = pageIndex; //所有分页都是用的同一个gPageIndex
			
	$.ajax({
        url : "/DocSystem/Manage/getUserList.do",
        type : "post",
        dataType : "json",
        data : {
            // 新增用户名搜索条件
            userName: userSearchWord,
        	pageIndex: pageIndex,
        	pageSize: pageSize
        },
        success : function (ret) {
        	console.log("getUserList ret",ret);
            if( "ok" == ret.status )
            {
            	UserListDisplay(ret.data, pageIndex, pageSize, function(){
                    // 渲染分页
                    var total = ret.dataEx;
                    gTotal = total;
                    $("#userList-pagination").pagination({
                        /*当前页码*/
                        currentPage: pageIndex + 1,
                        /*总共有多少页*/
                        totalPage: Math.ceil(total/pageSize),
                        /*是否显示首页、尾页 true：显示 false：不显示*/
                        isShow:true,
                        /*分页条显示可见页码数量*/
                        count:5,
                        /*第一页显示文字*/
                        homePageText:_Lang('首页'),
                        /*最后一页显示文字*/
                        endPageText: _Lang('尾页'),
                        /*上一页显示文字*/
                        prevPageText: _Lang('上一页'),
                        /* 下一页显示文字*/
                        nextPageText: _Lang('下一页'),
                        /*点击翻页绑定事件*/
                        callback: function(newPageIndex) {
                            // 分页插件的页码从1开始，减1处理
                            showUserList(newPageIndex - 1);
                        }
                    });
                });
            }
            else 
            {
                console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取用户列表失败", " : ", "服务器异常"));
        }
    });
}

function UserListDisplay(list, pageIndex, pageSize, callback)
{
	var index = pageIndex ? pageIndex : 0
	var offset = index * pageSize;
			       	
	for(var i=0; i<list.length; i++)
 	{
    	var node = list[i];
       	node.pageIndex = pageIndex;
  		node.index = i + offset;
 	}
	$Func.render($("#container"),"user" + langExt,{"list":list}, callback);
}

function exportUserConfirm()
{
	console.log("exportUserConfirm userSearchWord:" + userSearchWord);
	qiao.bs.confirm({
		id: "exportUserConfirmDialog",
        title: _Lang("导出用户"),
        msg: _Lang("是否导出用户？"),
        okbtn: _Lang("导出"),
        qubtn: _Lang("取消"),
    },function () {
    	exportUserList(userSearchWord);
    	return true;   
    });
}

function exportUserList(userSearchWord){
	console.log("exportUserList userSearchWord:" + userSearchWord);
	
	$.ajax({
        url : "/DocSystem/Bussiness/exportUserList.do",
        type : "post",
        dataType : "json",
        data : {
            // 新增用户名搜索条件
            searchWord: userSearchWord,
        },
        success : function (ret) {
        	console.log("exportUserList ret",ret);
            if( "ok" == ret.status )
            {
        	    console.log("exportUserList Ok");        	   		
            	window.location.href = ret.data;
            }
            else 
            {
                console.log(ret.msgInfo);
	        	showErrorMessage(_Lang("导出用户列表失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("导出用户列表失败", ":", "服务器异常"));
        }
    });
}


function delUserConfirm(userId, pageIndex, index)
{	
	console.log("delUserConfirm userId:" + userId + " pageIndex:" + pageIndex);
	qiao.bs.confirm({
		id: "delUserConfirmDialog",
        title: _Lang("删除用户"),
        msg: _Lang("是否删除用户？"),
        okbtn: _Lang("删除"),
        qubtn: _Lang("取消"),
    },function () {
    	delUser(userId, pageIndex, index);
    	return true;   
    });
}

function delUser(userId, pageIndex, index){
	console.log("delUser userId:" + userId + " pageIndex:" + pageIndex);
    $.ajax({
        url : "/DocSystem/Manage/delUser.do",
        type : "post",
        dataType : "json",
        data : {
             userId : userId,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	showUserList(pageIndex);	//刷新UserList
                showErrorMessage(_Lang("删除成功"));
            }else {
            	showErrorMessage(_Lang("删除失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("删除失败", ":", "服务器异常"));
        }
    });
}

//showAddUserPanel
function showAddUserPanel(){
	console.log("showAddUserPanel");
	qiao.bs.dialog({
		id: 'addUser',
		url: 'addUser' + langExt + '.html',
		title: _Lang('新增用户'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false
	});
}

//showAddOfficeLicensePanel
function showAddOfficeLicensePanel(){
	console.log("showAddOfficeLicensePanel");
	qiao.bs.dialog({
		id: 'addOfficeLicense',
		url: 'addOfficeLicense' + langExt + '.html',
		title: _Lang('新增Office证书'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false
	});
}

function importLicense(){
	console.log("importLicense()");
	//清除文件控件
	$("#importLicenseFiles").val("");
    return $("#importLicenseFiles").click();
}

function importLicenseConfirm(e)
{
	console.log("importLicenseConfirm()");
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
   		showErrorMessage("请选择文件");
      	return false;
   	}  
		    
    qiao.bs.confirm({
    		id: "importLicenseConfirmDialog",
	        title: "证书导入",
	        msg: "是否导入证书？",
	        okbtn: "确认",
	        qubtn: "取消",
    	},function () {
	    	//showErrorMessage("点击了确定");
			//开始上传
			startImportLicense(firstFile);
	    	return true;   //close dialog
    	},function()
    	{
    		//showErrorMessage("点击了取消")
    		return true;	//close dialog
    	}
    );
}

function startImportLicense(file)
{
	//新建文件上传表单
	var form = new FormData();
	form.append("uploadFile", file);

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
				showLicenseList();	//刷新LicenseList
				showErrorMessage("导入成功");
			 }
			 else	//上传失败
			 {
				//上传失败
				console.log("导入失败：" + ret.msgInfo);
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
			console.log("导入失败: " + file.name + " 上传异常！");
			showErrorMessage("导入失败: 上传异常");
			return;
		}
	};
	
	//上传表单			
	xhr.open("post", "/DocSystem/Sales/importLicense.do");
	xhr.send(form);
}


//showAddLicensePanel
function showAddLicensePanel(){
	console.log("showAddLicensePanel");
	qiao.bs.dialog({
		id: 'addLicense',
		url: 'addLicense' + langExt + '.html',
		title: '新增证书',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: false
	});
}

//showSystemLicensePanel
function showSystemLicenseInfoPanel(){
	console.log("showSystemLicenseInfoPanel");
	qiao.bs.dialog({
		id: 'systemLicenseInfo',
		url: 'systemLicenseInfo' + langExt + '.html',
		title: '系统证书',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: false,
		callback: function(){
		    console.log("page loaded callback");
		    var systemLicenseInfo = systemLicenses.systemLicense;
		    systemLicenseInfo.formatedType = getFormatedLicenseType(systemLicenseInfo.type, systemLicenseInfo.hasLicense);
		    SystemLicenseInfoPageCallback(systemLicenseInfo);
		}
	});
}

function getFormatedLicenseType(type, hasLicense)
{
	var formatedType = "未知";			
	if(type != undefined)
	{
		switch(type)
		{
		case 0: //开源版
			formatedType = "开源版";
			break;
		case 1: //企业版
			formatedType = "企业版";
			if(hasLicense != undefined && hasLicense == false)
			{
				formatedType = "企业版(试用)";
			}
			break;
		case 2: //专业版
			formatedType = "专业版";
			if(hasLicense != undefined && hasLicense == false)
			{
				formatedType = "专业版(试用)";
			}
			break;
		case 3: //个人版
			formatedType = "个人版";
			break;
		}
	}
	else
	{
		//老版证书都是企业版
		formatedType = "企业版";				
	}
	return formatedType;
}

//showOfficeLicenseInfoPanel
function showOfficeLicenseInfoPanel(){
	console.log("showOfficeLicenseInfoPanel");
	//后台管理页面的对话框都需要指定id
	qiao.bs.dialog({
		id: 'officeLicenseInfo',
		url: 'officeLicenseInfo' + langExt + '.html',
		title: 'Office证书',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: false,
		callback: function(){
		    console.log("page loaded callback");
		    var officeLicenseInfo = systemLicenses.officeLicense;
		    OfficeLicenseInfoPageCallback(officeLicenseInfo);
		}
	});
}

function showEditUserPanel(e, userId, pageIndex, index)
{
	console.log("showEditUserPanel() userId:" + userId + " pageIndex:" + pageIndex);
	gPageIndex = pageIndex;
	//TODO: 以下代码从显示元素里读取仓库信息存在风险,显示内容的顺序和含义修改会导致信息错误
	var Obj = e.target;
	var trObj =  $(e.target).parent().parent();
	var name = trObj.children("td:eq(2)").text();
	var type = trObj.children("td:eq(3)").text();
	var nickName = trObj.children("td:eq(4)").text();
	var realName = trObj.children("td:eq(5)").text();
	var tel = trObj.children("td:eq(6)").text();
	var email = trObj.children("td:eq(7)").text();
	
	qiao.bs.dialog({
		url: 'editUser' + langExt + '.html',
		title: _Lang('编辑用户'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false,
		callback: function(){
		    console.log("page loaded callback");
		    //Page Value Init
		    $("#userId").val(userId);
			$("#name").val(name);
		    $("#realName").val(realName);
		    $("#tel").val(tel);
		    $("#email").val(email);
		    //$("#pwd").val(pwd);
		    $("#type").val(type);
		}
	}, null);	
}

function randomPassword(size)
{
  var seed = new Array('A','B','C','D','E','F','G','H','I','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z',
  'a','b','c','d','e','f','g','h','i','j','k','m','n','p','Q','r','s','t','u','v','w','x','y','z',
  '2','3','4','5','6','7','8','9'
  );//数组
  seedlength = seed.length;//数组长度
  var createPassword = '';
  for (i=0;i<size;i++) {
    j = Math.floor(Math.random()*seedlength);
    createPassword += seed[j];
  }
  return createPassword;
}

function showResetPwdPanel(e, userId, pageIndex, index)
{
	console.log("showResetPwdPanel() userId:" + userId + " pageIndex:" + pageIndex);
	gPageIndex = pageIndex;
	
	var Obj = e.target;
	var trObj =  $(e.target).parent().parent();
	var name = trObj.children("td:eq(2)").text();
	var pwd = randomPassword(8);
	
	qiao.bs.dialog({
		url: 'resetPwd' + langExt + '.html',
		title: _Lang('重置密码'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false,
		callback: function(){
		    console.log("page loaded callback");
		    //Page Value Init
		    $("#userId").val(userId);
			$("#name").val(name);
		    $("#pwd").val(pwd);
		}
	}, null);	
}

//证书安装
var systemLicenses = {};
function showSystemLicenses(){
	$.ajax({
        url : "/DocSystem/Manage/getSystemLicenses.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	systemLicenses = ret.data;
            	SystemLicensesDisplay(systemLicenses);
            }
            else 
            {
                console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取证书列表失败", ":", "服务器异常"));
        }
    });
}

function SystemLicensesDisplay(systemLicenses)
{
	console.log("SystemLicensesDisplay", systemLicenses);
	var systemLicense = systemLicenses.systemLicense;
	if(systemLicense.hasLicense == false)
	{
		systemLicense.status = "未安装";
	}
	else
	{
		systemLicense.status = "已安装";	
		if(systemLicense.state != undefined)
		{
			if(systemLicense.state == 0)
			{
				systemLicense.status = "已失效";							
			}				
		}
	}
	
	var officeLicense = systemLicenses.officeLicense;
	if(officeLicense.hasLicense == false)
	{
		officeLicense.status = "未安装";
	}
	else{
		officeLicense.status = "已安装";		
		if(officeLicense.state != undefined)
		{
			if(officeLicense.state == 0)
			{
				officeLicense.status = "已失效";							
			}				
		}
	}
	
	$Func.render($("#container"),"systemLicenses" + langExt, {"value":systemLicenses});
}

//仓库管理
var gReposList = [];
function showReposList(){
	$.ajax({
        url : "/DocSystem/Manage/getReposList.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	gReposList = ret.data;
            	ReposListDisplay(ret.data);
            }
            else 
            {
                console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取仓库列表失败", ":", "服务器异常"));
        }
    });
}

function ReposListDisplay(list)
{
	for(var i=0; i<list.length; i++)
 	{
    	var node = list[i];
       	node.formatedType = formateReposType(node.type);
 	}
	console.log("ReposListDisplay", list);
	$Func.render($("#container"),"repos" + langExt, {"list":list});
}

function formateReposType(type)
{
	switch(type)
	{
	case 1:
	case 2:
		return _Lang("文件管理系统");
	default:
		return _Lang("文件服务器前置");
	}
	return type;
}

//showAddReposPanel
function showAddReposPanel(){
	console.log("showAddReposPanel");
	qiao.bs.dialog({
		id: 'addRepos',
		url: 'addRepos' + langExt + '.html',
		title: _Lang('新增仓库'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false,
		callback: function(){
		    console.log("addRepos.html loaded callback");
		    //Page Value Init
		    ReposConfig.addReposPageInit(callBackForAddReposSuccess);
			ReposConfig.EnterKeyListenerForAddRepos();
		}			
	}, null);
}

function callBackForAddReposSuccess()
{
	showReposList();
	
	MyJquery.closeBootstrapDialog("addRepos");
	
	//临时方案避免滚动条消失
	//window.location.reload();
}

function clearAllReposCacheConfirm()
{	
	console.log("clearAllReposCacheConfirm");
	qiao.bs.confirm({
		id: "clearAllReposCacheConfirmDialog",
        title: _Lang("清除缓存"),
        msg: _Lang("是否清除所有仓库缓存？"),
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
    },function () {
    	clearAllReposCache();
    	return true;   
    });
}

function clearAllReposCache()
{
	console.log("clearAllReposCache()");
    $.ajax({
        url : "/DocSystem/Repos/clearAllReposCache.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status ){
            	// 普通消息提示条
				bootstrapQ.msg({
						msg : _Lang('清除成功！'),
						type : 'success',
						time : 2000,
					    });
            }
            else
            {
            	showErrorMessage(_Lang("清除失败", ":" ,ret.msgInfo));
            }
        },
        error : function () {
           	showErrorMessage(_Lang("清除失败", ":", "服务器异常"));
        }
	});
}

function delReposConfirm(id)
{	
	console.log("delReposConfirm");
	qiao.bs.confirm({
		id: "delReposConfirmDialog",
        title: _Lang("删除仓库"),
        msg: _Lang("是否删除仓库，仓库数据将无法恢复？"),
        okbtn: _Lang("删除"),
        qubtn: _Lang("取消"),
    },function () {
    	delRepos(id);
    	return true;   
    });
}

function delRepos(reposId){
    $.ajax({
        url : "/DocSystem/Repos/deleteRepos.do",
        type : "post",
        dataType : "json",
        data : {
             vid : reposId,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
               	showReposList();	//刷新ReposList
                showErrorMessage(_Lang("删除成功"));
            }else {
            	showErrorMessage(_Lang("删除失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("删除失败", ":", "服务器异常"));
        }
    });
}

function convertReposHistoryConfirm(id)
{	
	console.log("convertReposHistoryConfirm");
	qiao.bs.confirm({
		id: "convertReposHistoryConfirmDialog",
        title: _Lang("转换仓库历史"),
        msg: _Lang("是否将仓库历史转换成最新格式？"),
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
    },function () {
    	convertReposHistory(id);
    	return true;   
    });
}

function convertReposHistory(reposId){
    $.ajax({
        url : "/DocSystem/Repos/convertReposHistory.do",
        type : "post",
        dataType : "json",
        data : {
             vid : reposId,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
                showErrorMessage(_Lang("仓库历史转换成功"));
            }else {
            	showErrorMessage(_Lang("仓库历史转换失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("仓库历史转换失败", ":", "服务器异常"));
        }
    });
}

function disableRepos(reposId){
	console.log("disableRepos() " + reposId);
	disableReposConfirm(reposId);
}

function enableRepos(reposId){
	console.log("enableRepos() " + reposId);
	enableReposConfirm(reposId);
}

function disableReposConfirm(reposId)
{
	console.log("disableReposConfirm() " + reposId);
    qiao.bs.confirm({
    		id: "disableReposConfirmDialog",
	        title: _Lang("禁用仓库"),
	        msg: _Lang("是否禁用仓库？"),
	        okbtn: _Lang("禁用"),
	        qubtn: _Lang("取消"),
    	},function () {
			doDisableRepos(reposId);
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function enableReposConfirm(reposId)
{
	console.log("enableReposConfirm() " + reposId);
    qiao.bs.confirm({
    		id: "enableReposConfirmDialog",
	        title: _Lang("启用仓库"),
	        msg: _Lang("是否启用仓库？"),
	        okbtn: _Lang("启用"),
	        qubtn: _Lang("取消"),
    	},function () {
			doEnableRepos(reposId);
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function doDisableRepos(reposId){
	$.ajax({
        url : "/DocSystem/Manage/disableRepos.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: reposId,
        },
        success : function (ret) {
        	console.log("doDisableRepos ret:",ret);
            if( "ok" == ret.status )
            {	        		
        		$("#btnEnableRepos" + reposId).show();
        		$("#btnDisableRepos" + reposId).hide();
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("禁用仓库失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("禁用仓库失败", ":", "服务器异常"));
        }
    });
}

function doEnableRepos(reposId){
	$.ajax({
        url : "/DocSystem/Manage/enableRepos.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: reposId,
        },
        success : function (ret) {
        	console.log("enableRepos ret:",ret);
            if( "ok" == ret.status )
            {	        		
        		$("#btnEnableRepos" + reposId).hide();
        		$("#btnDisableRepos" + reposId).show();
            }
            else 
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("启用仓库失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("启用仓库失败", ":", "服务器异常"));
        }
    });
}

function showBackupReposConfirmPanel(e, reposId, type, index)
{
	console.log("showBackupReposConfirmPanel() reposId:" + reposId + " type:" + type + " index:" + index);
	
	var repos = gReposList[index];
	qiao.bs.confirm({
		id: "backupReposConfirmDialog",
        title: _Lang("备份仓库") + " [" +repos.name+ "]",
        msg: _Lang("备份仓库可能需要占用服务器较大的磁盘空间，是否备份仓库？"),
        okbtn: _Lang("备份"),
        qubtn: _Lang("取消"),
    },function () {
    	backupRepos(reposId, repos);
    	return true;   
    });
}

function backupRepos(reposId, repos){
    $.ajax({
        url : "/DocSystem/Repos/backupRepos.do",
        type : "post",
        dataType : "json",
        data : {
             reposId : reposId,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
        	    console.log("backupRepos Ok:",ret);   
        	    if(ret.msgData == 5)
        	    {
					//下载目录压缩中
					var SubContext = {};
           	        SubContext.reposId = reposId;
           	        SubContext.repos = repos;
           	        
        	        showErrorMessage(_Lang("仓库备份中，可能需要花费较长时间，您可先关闭当前窗口！"));
					startReposFullBackupQueryTask(SubContext, ret.data.id, 2000); //2秒后查询
        	        return;
        	    }

        	    reposFullBackupSuccessHandler(SubContext, ret);
        	   	return;
            }else {
            	showErrorMessage(_Lang("备份仓库失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("备份仓库失败", ":", "服务器异常"));
        }
    });
}

function reposFullBackupSuccessHandler(SubContext, ret)
{
		console.log("reposFullBackupSuccessHandler() " + "仓库 [" + SubContext.repos.name +"] 备份完成");
		var repos = SubContext.repos;
		
	    var vid =  ret.data.vid;
   		var path = ret.data.path;
   		var name = ret.data.name;
   		var targetName = ret.data.targetName;
	    var targetPath = ret.data.targetPath;
	    var deleteFlag = ret.msgData;
   		
	    path = encodeURI(path);
	    name = encodeURI(name);
	    targetName = encodeURI(targetName);
	   	targetPath = encodeURI(targetPath);
	   	var url = "/DocSystem/Doc/downloadDoc.do?vid=" + vid + "&path=" + path + "&name=" + name + "&targetPath=" + targetPath + "&targetName=" + targetName + "&deleteFlag="+deleteFlag + "&encryptEn=0";
		qiao.bs.confirm({
			id: "downloadReposFullBackupConfirmDialog",
	        title: _Lang("仓库备份成功") +  "[" + repos.name + "]",
	        msg: _Lang("仓库备份成功，是否下载仓库备份文件？"),
	        okbtn: _Lang("下载"),
	        qubtn: _Lang("取消"),
	    },function () {
	    	window.location.href = url;
	    	return true;   
	    });		
}

function startReposFullBackupQueryTask(SubContext, reposFullBackupTaskId, delayTime)
{
	console.log("startReposFullBackupQueryTask() repos:" + SubContext.repos.name + " reposFullBackupTaskId:" + reposFullBackupTaskId + " delayTime:" + delayTime);
	var nextDelayTime = delayTime; //每次增加5s
	if(nextDelayTime < 60000) //最长1分钟
	{
		nextDelayTime += 5000;
	}
	
	setTimeout(function () {
		console.log("timerForQueryReposFullBackupTask triggered!");
		doQueryReposFullBackupTask(SubContext, reposFullBackupTaskId, nextDelayTime);
	},delayTime);	//check it 2s later	
}

function doQueryReposFullBackupTask(SubContext, reposFullBackupTaskId, nextDelayTime)
{
	console.log("doQueryReposFullBackupTask() repos:" + SubContext.repos.name + " reposFullBackupTaskId:" + reposFullBackupTaskId);

	$.ajax({
        url : "/DocSystem/Repos/queryReposFullBackupTask.do",
        type : "post",
        dataType : "json",
        data : {
            taskId: reposFullBackupTaskId,
        },
        success : function (ret) {
    	   console.log("doQueryReposFullBackupTask ret:",ret);        
           if( "ok" == ret.status )
               {    
           	        if(ret.msgData == 5)
            	    {
           	        	var task = ret.data;
           	        	var info = task.info;
           	        	startReposFullBackupQueryTask(SubContext, task.id, nextDelayTime);
           	        	return;
            	    }
 
            	    reposFullBackupSuccessHandler(SubContext, ret);
               }
               else	//后台报错
           {
        	   showErrorMessage(_Lang("备份仓库失败", ":", ret.msgInfo));
           }
        },
        error : function () {	//后台异常
        	showErrorMessage(_Lang("备份仓库失败", ":", "服务器异常"));
        }
	});	
}

function showEditReposPanel(e, reposId, type, index)
{
	console.log("showEditReposPanel() reposId:" + reposId + " type:" + type + " index:" + index);
	
	var repos = gReposList[index];		
	qiao.bs.dialog({
		id: 'editRepos',
		url: 'editRepos' + langExt + '.html',
		title: _Lang('编辑仓库'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false,
		callback: function(){
		    console.log("editRepos.html loaded callback");
		    ReposConfig.editReposPageInit(reposId, repos, callBackForEditReposSuccess);
			ReposConfig.EnterKeyListenerForEditRepos();
		}
	}, null);	
}

function callBackForEditReposSuccess()
{
	showReposList();
	
	MyJquery.closeBootstrapDialog("editRepos");
	
	//临时方案避免滚动条消失
	//window.location.reload();
}


//显示组成员管理页面
function showManageReposMemberPanel(e,reposId){
	console.log("showManageReposMemberPanel reposId:" + reposId);
	
	//get current click the Repos Info
	var Obj = e.target;
	console.log(Obj);
	var trObj =  $(e.target).parent().parent();
	//var reposId = trObj.children("td:eq(0)").text();
	var ReposName = trObj.children("td:eq(1)").text();
	
	qiao.bs.dialog({
		title: _Lang('成员管理') + ' ['+ ReposName + ']',
		url: 'manageReposMember.html',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		callback: function(){
			manageReposMemberPageInit(reposId);
		},
	});
}

function showReposManagerPage(e, reposId){
	//open reposManager in new page
	window.open("/DocSystem/web/reposManager" + langExt + ".html?vid=" + reposId);
}

//用户组管理
//成员管理
var groupSearchWord = "";	//清除搜索关键字
function searchGroup()
{
	groupSearchWord = $("#search-groupSearchWord").val();
	showGroupList();
}

function showGroupList(){
	$.ajax({
        url : "/DocSystem/Manage/getGroupList.do",
        type : "post",
        dataType : "json",
        data : {
            // 新增用户名搜索条件
            userName: groupSearchWord,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	GroupListDisplay(ret.data);
            }
            else 
            {
                console.log(ret.msgInfo);
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取用户组列表失败", ":", "服务器异常"));
        }
    });
}

function GroupListDisplay(list)
{
	console.log("GroupListDisplay", list);
	$Func.render($("#container"),"group" + langExt,{"list":list});
}
	

//showAddGroupPanel
function showAddGroupPanel(){
	console.log("showAddGroupPanel");
	qiao.bs.dialog({
		id: 'addGroup',
		url: 'addGroup' + langExt + '.html',
		title: _Lang('新增用户组'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false
	}, null);
}

function delGroupConfirm(id)
{	
	console.log("delGroupConfirm");
	qiao.bs.confirm({
		id: "delGroupConfirmDialog",
        title: _Lang("删除用户组"),
        msg: _Lang("是否删除用户组？"),
        okbtn: _Lang("删除"),
        qubtn: _Lang("取消"),
    },function () {
    	delGroup(id);
    	return true;   
    });
}

function delGroup(id){
    $.ajax({
        url : "/DocSystem/Manage/delGroup.do",
        type : "post",
        dataType : "json",
        data : {
             id : id,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
               	showGroupList();	//刷新GroupList
                showErrorMessage(_Lang("删除成功"));
            }else {
            	showErrorMessage(_Lang("删除失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("删除失败", ":", "服务器异常"));
        }
    });
}

function showEditGroupPanel(e, id)
{
	console.log("showEditGroupPanel() " + id);
	var Obj = e.target;
	var trObj =  $(e.target).parent().parent();
	var groupId = trObj.children("td:eq(0)").text();
	var name = trObj.children("td:eq(1)").text();
	var info = trObj.children("td:eq(2)").text();		
	
	qiao.bs.dialog({
		url: 'editGroup' + langExt + '.html',
		title: _Lang('编辑用户组'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false,
		callback: function(){
		    console.log("page loaded callback");
		    //Page Value Init
		    $("#groupId").val(groupId);
			$("#name").val(name);
		    $("#info").val(info);
		}
	}, null);	
}

//显示组成员管理页面
function showManageGroupMemberPanel(e,groupId){
	console.log("showManageGroupMemberPanel groupId:" + groupId);
	
	//get current click the Group Info
	var Obj = e.target;
	console.log(Obj);
	var trObj =  $(e.target).parent().parent();
	//var groupId = trObj.children("td:eq(0)").text();
	var groupName = trObj.children("td:eq(1)").text();
	
	qiao.bs.dialog({
		title: _Lang('成员管理') + ' ['+ groupName + "]",
		url: 'manageGroupMember.html',
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		callback: function(){
			manageGroupMemberPageInit(groupId);
		},
	});
}

// 快速查找指定的项
function fastSearch(_this){
    var $this = $(_this);
    var event = $this.attr("data-eb-xevent");
    var event2 = $("#examine").attr("data-eb-xparam");
    var value = $this.val();
    var type = $this.attr("data-type");

    $Current.ajax(event,{name:value,type:type},function(ret){
        console.log(ret);
        ret.data.page.curExamine = "0";
        bus.trigger(event2,ret.data.page);
    });
}

function exit(){
	console.log("logout");
    $.ajax({
        url : "/DocSystem/User/logout.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status ){
            	console.log("已退出登录");
            	window.location.href = "login" + langExt + ".html";
            }else {
                showErrorMessage(_Lang("退出登录失败", ":", ret.msgInfo));
            }
        },
        error : function () {
            showErrorMessage(_Lang("退出登录失败", ":", "服务器异常"));
        }
    });
}

function formatDate(date) {
	var now = new Date(date);
	var year=now.getFullYear(); 
	var month=now.getMonth()+1;
	var date=now.getDate(); 
	return year+"-"+month+"-"+date; 
}

function formatTime(time){
	var now = new Date(time);
	var year=now.getFullYear(); 
	var month=now.getMonth()+1;
	var date=now.getDate(); 
	var hh=now.getHours(); 
	var mm=now.getMinutes(); 
	var ss=now.getSeconds(); 
	
	return year+"-"+month+"-"+date + " " + hh+":"+mm+":"+ss; 
}