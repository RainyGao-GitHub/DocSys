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
	
	//使用统计：页面活动上报（不需要时可去掉这一行，见 web/js/UsageActivityReporter.js）
	//用 typeof 守卫：浏览器可能缓存了旧版 HTML（里面没有该脚本），直接调用会抛 ReferenceError 打断页面初始化
	if(typeof UsageActivityReporterInit == "function")
	{
		UsageActivityReporterInit();
	}
	
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

  //说明：实测点父级时本处理器会**先于** [data-eb-event] 执行（jQuery 事件队列顺序），
  //而父级自身的展开/收起已经在 showContentPage 里统一处理（含「再点一次收起」），
  //所以父级带 data-eb-event 时这里必须直接返回，否则会把子菜单 toggle 掉、再被 showContentPage 展开，导致「收不起来」。
  //保留下面这段是作为兵底：万一以后有不带 data-eb-event 的父级，行为仍然正确。
  $(document).on("click","li.has_sublist",function(){
	  var $this = $(this);
	  if($this.attr("data-eb-event"))
	  {
		  return;
	  }
	  var expanded = $this.children("ul.sublist").css("display") !== "none";
	  $this.siblings("li.has_sublist").children("ul.sublist").hide();
	  $this.children("ul.sublist").toggle(!expanded);
	  updateSublistArrow();
  });

//点「已展开的父级」= 再点一次 → 收起它的子菜单（**内容区保持不变**）。
//返回 true 表示本次点击已按「收起」处理，调用方直接返回即可。
//必须由调用方在清空内容区之前判断，否则当前页面会被清成「载入中...」。
function collapseParentMenu(curPath){
	if(curPath !== "system" && curPath !== "agent")
	{
		return false;	//只对带子项的父级生效
	}
	if($("#nav li[data-eb-params=" + curPath + "]>ul.sublist").css("display") === "none")
	{
		return false;	//当前是收起的 → 走正常流程（展开 + 进默认页）
	}
	//记住当前内容页对应的子项，收起后仍保持它的高亮
	var currentChild = $("#nav ul.sublist li>a.open").parent().attr("data-eb-params");
	$("#nav li>a").removeClass("open");
	$("#nav li[data-eb-params=" + curPath + "]>a").addClass("open");
	if(currentChild)
	{
		$("#nav li[data-eb-params=" + currentChild + "]>a").addClass("open");
	}
	$("ul.sublist").hide();
	updateSublistArrow();
	return true;
}

//只展开指定父级（data-eb-params=parentPath，桌面+移动两个导航都算）的子菜单，其余全部收起
function showOnlySublist(parentPath){
	$("ul.sublist").hide();
	$("li[data-eb-params=" + parentPath + "]>ul.sublist").show();
	updateSublistArrow();
}

//展开状态与箭头图标保持一致：展开 → 向下箭头（icon-chevron-down），收起 → 向右箭头（icon-chevron-right）
function updateSublistArrow(){
	$("li.has_sublist").each(function(){
		var $li = $(this);
		//注意：不能用 :visible 判断——移动端/桌面端两套导航只有一套真正可见，
		//另一个的父容器是 display:none，会让它的子菜单永远算「不可见」
		var expanded = $li.children("ul.sublist").css("display") !== "none";
		var $arrow = $li.children("a").find("i.icon-chevron-right, i.icon-chevron-down");
		if($arrow.length > 0)
		{
			$arrow.toggleClass("icon-chevron-right", !expanded);
			$arrow.toggleClass("icon-chevron-down", expanded);
		}
	});
}
  
//菜单项都是 <a href="#">，必须阻止默认跳转：空锦点会让浏览器把文档滚回顶部
//（表现为"点靠下的子菜单后侧边栏跳回最上方、看起来焦点跑回父级"，2026-09-29 用户反馈）
function stopMenuAnchorDefault(e) {
	if ( e && e.preventDefault ) {
		e.preventDefault();
	} else {
		window.event.returnValue = false;
	}
}

//click event handler  for data-eb-event="content.refresh"
$(document).on("click","[data-eb-event]", function (e) {
	console.log("[data-eb-event] onclick()");
	stopMenuAnchorDefault(e); //阻止 <a href="#"> 的默认跳转（否则会滚到文档顶部）
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

    //点「已展开的父级」= 再点一次收起子菜单：只收菜单，内容区不变
    //（必须在下面清空 #container 之前判断并返回，否则当前页面会被清成「载入中...」）
    if(collapseParentMenu(curPath))
    {
    	return;
    }

	var title = _Lang("载入中...");
    var subtitle = _Lang("载入中...");
	
    $("#container").html(_Lang("载入中..."));
    //内容区在桌面布局下自己就是滚动容器（见 style.css 的后台布局块），切页时回到顶部；
    //侧边栏是独立的滚动列，不会受影响（不再靠 <a href="#"> 的默认跳转来实现）
    $(".mainbar").scrollTop(0);

    $("#nav li>a").removeClass("open");
    $("ul.sublist").hide();
    updateSublistArrow();

    switch ( curPath ){
        case "user":
            title = _Lang("用户管理");
            userSearchWord = "";	//清除搜索关键字
            userSortField = "id";	//默认排序：用户ID 降序（新增用户ID递增 → 最近创建的在前）
            userSortOrder = "desc";
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
            initSystemLogTimeRange();
            break;
        case "userUsageStats":
            title = _Lang("使用统计");
            $("#nav li[data-eb-params=userUsageStats]>a").addClass("open");
            initUsageStatsTimeRange();
            break;
        case "system":
        case "systemEmailConfig":
        case "systemSmsConfig":
        case "systemSetting":
        case "systemDbConfig":
        case "systemUpgrade":
        case "systemLicenses":
        case "systemMigrate":
        case "systemDebugLog":
        case "systemLdap":
        case "systemNetwork":
        case "systemCluster":
        case "systemOfficeEditor":
        	title = _Lang("系统管理");
        	//高亮：父级保持蓝色（表示在系统管理这个分组里），被点开的那一项另有一种选中样式
        	//（父级蓝色 + 子项白底蓝字，两种样式并存表示「在哪个分组 + 在哪一页」）
            $("#nav li[data-eb-params=system]>a").addClass("open");
            //点父级时它默认进入「系统设置」（showSystemPage 里 "system" → showSystemUpgrade），子项也按该项标出
            var systemOpenPath = (curPath === "system") ? "systemUpgrade" : curPath;
            $("#nav li[data-eb-params=" + systemOpenPath + "]>a").addClass("open");
            showOnlySublist("system");	        	
            showSystemPage(curPath);
        	break;
        case "license":
            title = _Lang("证书管理");
            $("#nav li[data-eb-params=license]>a").addClass("open");
            licenseSearchWord = "";
            initLicenseTimeRange();		//默认近3年（与服务端原默认窗口一致），可点时间筛选按钮改
            break;
        case "order":
            title = _Lang("订单管理");
            $("#nav li[data-eb-params=order]>a").addClass("open");
            orderSearchWord = "";
            initOrderTimeRange();		//默认近1年（与服务端原默认窗口一致），可点时间筛选按钮改
            break;
        case "agent":
        case "systemLlm":
        case "prompt":
        	title = _Lang("智能体设置");
        	//高亮：父级保持蓝色（表示在智能体设置这个分组里），被点开的那一项另有一种选中样式
            $("#nav li[data-eb-params=agent]>a").addClass("open");
            //点父级时默认进入「AI接入设置」（非超级管理员看不到它，则进「提示词管理」）
            var agentOpenPath = (curPath === "agent") ? (($("#nav li[data-eb-params=systemLlm]").length > 0) ? "systemLlm" : "prompt") : curPath;
            $("#nav li[data-eb-params=" + agentOpenPath + "]>a").addClass("open");
            showOnlySublist("agent");
            showAgentPage(curPath);
        	break;
    }
    
    $Func.render($("#pagehead"),"pagehead" + langExt,{
        title : title,
        subtitle : title
    });
}

//智能体设置（父级）：AI接入设置 + 提示词管理
function showAgentPage(curPath)
{
	switch(curPath)
   	{
   	case "agent":
   		//点父级：有「AI接入设置」就进它（超级管理员），否则进「提示词管理」
   		if($("#nav li[data-eb-params=systemLlm]").length > 0)
   		{
   			showSystemLlm();
   		}
   		else
   		{
   			showPromptConfig();
   		}
        break;
    case "systemLlm":
    	showSystemLlm();
    	break;
    case "prompt":
    	showPromptConfig();
    	break;
   	}
}

//提示词管理（T8.6）：默认只读，需先点「编辑」才能改（与「系统管理-系统设置」页一致的交互）
var PROMPT_CONFIG_FIELDS = ["promptSuffix", "promptOverride"];
var promptConfigData = null;	//已保存的值，用于「取消」时还原

function showPromptConfig(){
	$.ajax({
        url : "/DocSystem/agent/config/system-prompt",
        type : "get",
        dataType : "json",
        success : function (ret) {
            console.log("showPromptConfig() ret", ret);
        	if(ret.success)
            {
            	promptConfigData = ret.data;	//缓存已保存值（取消时还原）
            	$Func.render($("#container"),"promptConfig" + langExt,{"value":ret.data});
            }
            else
            {
            	showErrorMessage(_Lang("读取提示词配置失败", " : ", ret.message || ""));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("读取提示词配置失败", " : ", "服务器异常"));
        }
    });
}

function enablePromptConfigSet(){
	console.log("enablePromptConfigSet");
	setSystemPageEditMode("PromptConfig", PROMPT_CONFIG_FIELDS, true);
}

function cancelPromptConfigSet(){
	console.log("cancelPromptConfigSet promptConfigData:", promptConfigData);

	//还原成已保存的值
	$("#promptSuffix").val(promptConfigData ? (promptConfigData.suffix || "") : "");
	$("#promptOverride").val(promptConfigData ? (promptConfigData.override || "") : "");
	setSystemPageEditMode("PromptConfig", PROMPT_CONFIG_FIELDS, false);
}

function savePromptConfig(){
	var suffix = $("#promptSuffix").val() || "";
	var override = $("#promptOverride").val() || "";

	setSystemPageEditMode("PromptConfig", PROMPT_CONFIG_FIELDS, false);	//先退出编辑态

	$.ajax({
        url : "/DocSystem/agent/config/system-prompt",
        type : "post",
        contentType : "application/json",
        data : JSON.stringify({override: override, suffix: suffix}),
        dataType : "json",
        success : function (ret) {
            console.log("savePromptConfig() ret", ret);
        	if(ret.success)
            {
            	showErrorMessage(_Lang("提示词配置已保存，将于后续请求生效"));
            	showPromptConfig();	//重新拉取并渲染（回到只读态、显示已保存的值）
            }
            else
            {
            	//保存失败：留在编辑态，方便修正后重试（不重新渲染，避免丢掉已输入内容）
            	setSystemPageEditMode("PromptConfig", PROMPT_CONFIG_FIELDS, true);
            	showErrorMessage(_Lang("保存提示词配置失败", " : ", ret.message || ""));
            }
        },
        error : function () {
        	setSystemPageEditMode("PromptConfig", PROMPT_CONFIG_FIELDS, true);
        	showErrorMessage(_Lang("保存提示词配置失败", " : ", "服务器异常"));
        }
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
    case "systemSetting":
    	showSystemSetting();
        break;
    case "systemDbConfig":
    	showSystemDbConfig();
    	break;
    case "systemMigrate":
        	showSystemMigrate();
        	break;
    case "systemDebugLog":
    	showSystemDebugLog();
    	break;
    case "systemLdap":
    	showSystemLdap();
    	break;
    case "systemNetwork":
    	showSystemNetwork();
    	break;
    case "systemCluster":
    	showSystemCluster();
    	break;
    case "systemOfficeEditor":
    	showSystemOfficeEditor();
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

function viewLogFile(){
	//调试日志在线查看：用独立的新标签页打开（看日志需要更大的视觉空间）
	window.open("/DocSystem/manager/logViewer" + langExt + ".html", "_blank");
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

//系统邮件服务设置（system_setting 表的 mail.* 行；老 properties 仅作首次启用时的默认数据）
var gSystemMailConfigData = null;	//服务端返回的原始配置（取消编辑时用于回填）
var gSystemMailProviderList = ["smtp", "aliyun", "tencent", "http"];	//字段块与发信方式一一对应（枚举码 = 块 ID 后缀）

//按当前发信方式显示对应字段块（参照系统数据库页的 doSelectDbType / 短信页的 doSelectSmsProvider 写法）
function doSelectMailProvider(){
	for(var i=0; i<gSystemMailProviderList.length; i++){
		$("#systemMailBlock" + gSystemMailProviderList[i].charAt(0).toUpperCase() + gSystemMailProviderList[i].substring(1)).hide();
	}

	var provider = $("#systemMailProvider").val();
	if(provider == null || provider == ""){
		return;
	}
	$("#systemMailBlock" + provider.charAt(0).toUpperCase() + provider.substring(1)).show();
}

//表单只读/可编辑切换
function setSystemMailFormEnabled(enabled){
	$("#systemMailConfigForm").find("input,select,textarea").attr("disabled", !enabled);
}

//收集表单值；只读（disabled）字段跳过 —— 服务端发现没有任何表单字段时会改用已保存的配置
function collectSystemMailFormData(){
	var data = [];
	$("#systemMailConfigForm").find("input,select,textarea").each(function(){
		if($(this).prop("disabled")){
			return;
		}
		var name = $(this).attr("name");
		if(name == null || name == ""){
			return;
		}
		if($(this).attr("type") == "checkbox"){
			if($(this).prop("checked")){
				data.push({name : name, value : $(this).val()});
			}
			return;
		}
		data.push({name : name, value : $(this).val()});
	});
	return data;
}

function enableSystemEmailSet(){
	$("#btnEnableSystemEmailSet").hide();
	$("#btnCancelSystemEmailSet").show();
	$("#btnSaveSystemEmailSet").show();
	setSystemMailFormEnabled(true);
}

function cancelSystemEmailSet(){
	$("#btnEnableSystemEmailSet").show();
	$("#btnCancelSystemEmailSet").hide();
	$("#btnSaveSystemEmailSet").hide();
	renderSystemMailConfigView();	//重新渲染以丢弃未保存的修改
}

function saveSystemEmailSet(){
	//必须在切只读前收集，否则 disabled 字段会被跳过
	var data = collectSystemMailFormData();

	var $btn = $("#btnSaveSystemEmailSet");
	$btn.attr("disabled", true);

	$.ajax({
		url : "/DocSystem/Manage/setSystemMailConfig.do",
		type : "post",
		dataType : "json",
		data : data,
		success : function (ret) {
			$btn.attr("disabled", false);
			if( "ok" == ret.status )
			{
				showSystemEmailConfig();	//重新加载（自动回到只读态）
				showErrorMessage(_Lang("更新邮件服务配置成功"));
			}
			else
			{
				//保持编辑态，便于管理员按提示修正
				console.log(ret.msgInfo);
				showErrorMessage(_Lang("更新邮件服务配置失败", ":", ret.msgInfo));
			}
		},
		error : function () {
			$btn.attr("disabled", false);
			showErrorMessage(_Lang("更新邮件服务配置失败", ":", "服务器异常"));
		}
	});
}

function showSystemEmailConfig(){
	$.ajax({
        url : "/DocSystem/Manage/getSystemMailConfig.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	gSystemMailConfigData = ret.data;
            	$("#btnEnableSystemEmailSet").show();
            	$("#btnCancelSystemEmailSet").hide();
            	$("#btnSaveSystemEmailSet").hide();
            	renderSystemMailConfigView();
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

function renderSystemMailConfigView(){
	if(gSystemMailConfigData == null){
		return;
	}
	$Func.render($("#container"), "systemEmailConfig" + langExt, {"value" : buildSystemMailConfigView(gSystemMailConfigData)}, function(){
		doSelectMailProvider();	//渲染后按当前发信方式显示对应字段块
	});
}

//服务端配置 → 页面视图（补默认值，避免模板里访问 null 的属性）
function buildSystemMailConfigView(data){
	var config = data.config || {};
	config.smtp = config.smtp || {};
	config.aliyun = config.aliyun || {};
	config.tencent = config.tencent || {};
	config.http = config.http || {};
	config.http.paramNames = config.http.paramNames || {};
	config.options = config.options || {};

	var providerTypes = data.providerTypes || [];
	var encryptionTypes = data.encryptionTypes || [];
	var view = {
		config : config,
		providerTypes : providerTypes,
		encryptionTypes : encryptionTypes,
		providerDefaults : data.providerDefaults || {},
		httpParamsText : data.httpParamsText || "",
		providerName : "",
		warnings : translateWarnings(data.warnings)
	};

	for(var i=0; i<providerTypes.length; i++){
		//显示名来自服务端枚举（中文），英文页靠 _Lang 翻译
		providerTypes[i].displayName = _Lang(providerTypes[i].displayName);
		if(providerTypes[i].code == config.provider){
			view.providerName = providerTypes[i].displayName;
		}
	}
	for(var j=0; j<encryptionTypes.length; j++){
		encryptionTypes[j].displayName = _Lang(encryptionTypes[j].displayName);
	}
	if(view.providerName == ""){
		view.providerName = _Lang("未配置");
	}

	return view;
}

function showSystemMailTestSendPanel(){
	qiao.bs.dialog({
		id: 'systemMailTestSend',
		url: 'systemMailTestSend' + langExt + '.html',
		title: _Lang('发送测试邮件'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		callback: function(){
			$("#systemMailTestToEmail").val("");
			$("#systemMailTestResult").empty();
			$("#systemMailTestToEmail").focus();
		}
	}, null);
}


//系统短信服务设置（system_setting 表的 sms.* 行；老 properties 仅作首次启用时的默认数据）
var gSystemSmsConfigData = null;	//服务端返回的原始配置（取消编辑时用于回填）
var gSystemSmsProviderList = ["yunpian", "aliyun", "tencent", "custom"];	//字段块与运营商一一对应

//按当前运营商显示对应字段块（参照系统数据库页的 doSelectDbType 写法）
function doSelectSmsProvider(){
	for(var i=0; i<gSystemSmsProviderList.length; i++){
		$("#systemSmsBlock" + gSystemSmsProviderList[i].charAt(0).toUpperCase() + gSystemSmsProviderList[i].substring(1)).hide();
	}

	var provider = $("#systemSmsProvider").val();
	if(provider == null || provider == ""){
		return;
	}
	$("#systemSmsBlock" + provider.charAt(0).toUpperCase() + provider.substring(1)).show();
}

//表单只读/可编辑切换
function setSystemSmsFormEnabled(enabled){
	$("#systemSmsConfigForm").find("input,select,textarea").attr("disabled", !enabled);
}

//收集表单值；只读（disabled）字段跳过 —— 服务端发现没有任何表单字段时会改用已保存的配置
function collectSystemSmsFormData(){
	var data = [];
	$("#systemSmsConfigForm").find("input,select,textarea").each(function(){
		if($(this).prop("disabled")){
			return;
		}
		var name = $(this).attr("name");
		if(name == null || name == ""){
			return;
		}
		if($(this).attr("type") == "checkbox"){
			if($(this).prop("checked")){
				data.push({name : name, value : $(this).val()});
			}
			return;
		}
		data.push({name : name, value : $(this).val()});
	});
	return data;
}

function enableSystemSmsSet(){
	$("#btnEnableSystemSmsSet").hide();
	$("#btnCancelSystemSmsSet").show();
	$("#btnSaveSystemSmsSet").show();
	setSystemSmsFormEnabled(true);
}

function cancelSystemSmsSet(){
	$("#btnEnableSystemSmsSet").show();
	$("#btnCancelSystemSmsSet").hide();
	$("#btnSaveSystemSmsSet").hide();
	renderSystemSmsConfigView();	//重新渲染以丢弃未保存的修改
}

function saveSystemSmsSet(){
	//必须在切只读前收集，否则 disabled 字段会被跳过
	var data = collectSystemSmsFormData();

	var $btn = $("#btnSaveSystemSmsSet");
	$btn.attr("disabled", true);

	$.ajax({
		url : "/DocSystem/Manage/setSystemSmsConfig.do",
		type : "post",
		dataType : "json",
		data : data,
		success : function (ret) {
			$btn.attr("disabled", false);
			if( "ok" == ret.status )
			{
				showSystemSmsConfig();	//重新加载（自动回到只读态）
				showErrorMessage(_Lang("更新短信服务配置成功"));
			}
			else
			{
				//保持编辑态，便于管理员按提示修正
				console.log(ret.msgInfo);
				showErrorMessage(_Lang("更新短信服务配置失败", ":", ret.msgInfo));
			}
		},
		error : function () {
			$btn.attr("disabled", false);
			showErrorMessage(_Lang("更新短信服务配置失败", ":", "服务器异常"));
		}
	});
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
            	gSystemSmsConfigData = ret.data;
            	$("#btnEnableSystemSmsSet").show();
            	$("#btnCancelSystemSmsSet").hide();
            	$("#btnSaveSystemSmsSet").hide();
            	renderSystemSmsConfigView();
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

function renderSystemSmsConfigView(){
	if(gSystemSmsConfigData == null){
		return;
	}
	$Func.render($("#container"), "systemSmsConfig" + langExt, {"value" : buildSystemSmsConfigView(gSystemSmsConfigData)}, function(){
		doSelectSmsProvider();	//渲染后按当前运营商显示对应字段块
	});
}

//服务端告警文案的中英翻译（语言包里真体实现：ch.js 原样返回，en.js 查表 + 规则）
//宿主页面可能没加载语言包（或版本较旧）时原样返回，不能因此报错
function translateWarnings(list){
	var out = [];
	if(list == null){
		return out;
	}
	for(var i=0; i<list.length; i++){
		if(typeof _LangWarning == "function"){
			out.push(_LangWarning(list[i]));
		}else{
			out.push(list[i]);
		}
	}
	return out;
}

//服务端配置 → 页面视图（补默认值，避免模板里访问 null 的属性；场景模板的 vars 数组转成逗号文本）
function buildSystemSmsConfigView(data){
	var config = data.config || {};
	config.yunpian = config.yunpian || {};
	config.aliyun = config.aliyun || {};
	config.tencent = config.tencent || {};
	config.custom = config.custom || {};
	config.custom.paramNames = config.custom.paramNames || {};
	config.options = config.options || {};

	var providerTypes = data.providerTypes || [];
	var view = {
		config : config,
		providerTypes : providerTypes,
		providerDefaults : {},
		providerName : "",
		warnings : translateWarnings(data.warnings),
		customParamsText : data.customParamsText || "",
		sceneTplId : {},
		sceneVars : {}
	};

	for(var i=0; i<providerTypes.length; i++){
		//运营商显示名来自服务端枚举（中文），英文页靠 _Lang 翻译
		providerTypes[i].displayName = _Lang(providerTypes[i].displayName);
		view.providerDefaults[providerTypes[i].code] = providerTypes[i].defaultEndpoint || "";
		if(providerTypes[i].code == config.provider){
			view.providerName = providerTypes[i].displayName;
		}
	}
	if(view.providerName == ""){
		view.providerName = _Lang("未配置");
	}

	var scenes = config.scenes || {};
	var sceneCodes = ["register", "resetPwd", "phoneVerify", "test"];
	for(var j=0; j<sceneCodes.length; j++){
		var tpl = scenes[sceneCodes[j]] || {};
		view.sceneTplId[sceneCodes[j]] = tpl.tplId || "";
		view.sceneVars[sceneCodes[j]] = (tpl.vars && tpl.vars.length > 0) ? tpl.vars.join(",") : "";
	}

	return view;
}

function showSystemSmsTestSendPanel(){
	qiao.bs.dialog({
		id: 'systemSmsTestSend',
		url: 'systemSmsTestSend' + langExt + '.html',
		title: _Lang('发送测试短信'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		callback: function(){
			$("#systemSmsTestPhone").val("");
			$("#systemSmsTestResult").empty();
			$("#systemSmsTestPhone").focus();
		}
	}, null);
}

//系统参数（system_setting 表）—— 与邮件/短信/数据库页是同一份数据，这里是通用键值视图
var gSystemSettingList = [];
var gSystemSettingSearchWord = "";
var gEditingSystemSettingName = "";

function showSystemSetting(){
	gSystemSettingSearchWord = "";
	showSystemSettingList(0);
}

function searchSystemSetting(){
	gSystemSettingSearchWord = $("#search-systemSetting").val();
	showSystemSettingList(0);
}

function showSystemSettingList(pageIndex){
	var pageSize = gPageSize;
	pageIndex = pageIndex ? pageIndex : 0;
	gPageIndex = pageIndex;

	$.ajax({
        url : "/DocSystem/SysConfig/getAll.do",
        type : "post",
        dataType : "json",
        data : {
        	searchWord : gSystemSettingSearchWord,
        	pageIndex : pageIndex,
        	pageSize : pageSize
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	var list = ret.data;
            	for(var i=0; i<list.length; i++)
            	{
            		list[i].displayValue = buildSystemSettingDisplayValue(list[i].value);
            	}
            	gSystemSettingList = list;
            	$Func.render($("#container"),"systemSetting" + langExt,{"list":list}, function(){
					// 渲染分页
					var total = ret.dataEx;
					$("#systemSettingList-pagination").pagination({
						currentPage: pageIndex + 1,
						totalPage: Math.ceil(total/pageSize),
						isShow:true,
						count:5,
						homePageText: _Lang('首页'),
						endPageText: _Lang('尾页'),
						prevPageText: _Lang('上一页'),
						nextPageText: _Lang('下一页'),
						callback: function(newPageIndex) {
							showSystemSettingList(newPageIndex - 1);
						}
					});
            	});
            }
            else
            {
            	showErrorMessage(_Lang("获取系统参数失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取系统参数失败", ":", "服务器异常"));
        }
    });
}

//配置值可能很长（JSON），列表里做截断展示
function buildSystemSettingDisplayValue(value){
	if(value == null || value.length <= 200){
		return value;
	}
	return value.substring(0, 200) + " ...(" + value.length + ")";
}

function showAddSystemSettingPanel(){
	qiao.bs.dialog({
		id: 'systemSettingEdit',
		url: 'systemSettingEdit' + langExt + '.html',
		title: _Lang('新增系统参数'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		callback: function(){
			gEditingSystemSettingName = "";
			$("#systemSettingName").val("").attr("readonly", false);
			$("#systemSettingValue").val("");
			$("#systemSettingRemark").val("");
			$("#systemSettingName").focus();
		}
	}, null);
}

function showEditSystemSettingPanel(name){
	var setting = null;
	for(var i=0; i<gSystemSettingList.length; i++){
		if(gSystemSettingList[i].name == name){
			setting = gSystemSettingList[i];
			break;
		}
	}
	if(setting == null){
		showErrorMessage(_Lang("配置不存在，请刷新后重试"));
		return;
	}

	qiao.bs.dialog({
		id: 'systemSettingEdit',
		url: 'systemSettingEdit' + langExt + '.html',
		title: _Lang('编辑系统参数'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		callback: function(){
			gEditingSystemSettingName = setting.name;
			$("#systemSettingName").val(setting.name).attr("readonly", true);
			$("#systemSettingValue").val(setting.value);
			$("#systemSettingRemark").val(setting.remark == null ? "" : setting.remark);
		}
	}, null);
}

function deleteSystemSettingConfirm(name)
{
	qiao.bs.confirm({
    		id: "deleteSystemSettingConfirmDialog",
	        title: _Lang("删除系统参数"),
	        msg: _Lang("是否删除配置") + " [" + name + "] ？",
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
    	},function () {
	    	deleteSystemSetting(name);
	    	return true;   //close dialog
    	},function()
    	{
    		return true;	//close dialog
    	}
    );
}

function deleteSystemSetting(name){
	$.ajax({
        url : "/DocSystem/SysConfig/delete.do",
        type : "post",
        dataType : "json",
        data : {
        	name : name
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	showErrorMessage(_Lang("删除成功"));
            	showSystemSettingList(gPageIndex);
            }
            else
            {
            	showErrorMessage(_Lang("删除失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	showErrorMessage(_Lang("删除失败", ":", "服务器异常"));
        }
    });
}

//导出：按当前搜索条件分页取全量，前端生成 JSON 文件下载
function exportSystemSetting(){
	fetchAllSystemSettings(function(list){
		var content = JSON.stringify({systemSettings : list}, null, 2);
		var blob = new Blob([content], {type : "application/json;charset=utf-8"});
		var url = URL.createObjectURL(blob);
		var a = document.createElement("a");
		var now = new Date();
		a.href = url;
		a.download = "systemSetting_" + now.getFullYear() + padNumber2(now.getMonth()+1) + padNumber2(now.getDate())
			+ padNumber2(now.getHours()) + padNumber2(now.getMinutes()) + padNumber2(now.getSeconds()) + ".json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		showErrorMessage(_Lang("导出成功", ":", list.length + " 条"));
	});
}

function padNumber2(n){
	return (n < 10 ? "0" : "") + n;
}

//分页拉取全量（服务端单页上限 200，最多 10 页）
function fetchAllSystemSettings(cb){
	var all = [];
	var pageSize = 200;
	var pageIndex = 0;
	var maxPage = 10;
	var failed = false;

	function fetchNext(){
		$.ajax({
	        url : "/DocSystem/SysConfig/getAll.do",
	        type : "post",
	        dataType : "json",
	        data : {
	        	searchWord : gSystemSettingSearchWord,
	        	pageIndex : pageIndex,
	        	pageSize : pageSize
	        },
	        success : function (ret) {
	            if( "ok" != ret.status ){
	            	showErrorMessage(_Lang("导出失败", ":", ret.msgInfo));
	            	failed = true;
	            	return;
	            }
	            var rows = ret.data || [];
	            for(var i=0; i<rows.length; i++){
	            	all.push(rows[i]);
	            }
	            pageIndex++;
	            if(rows.length >= pageSize && pageIndex < maxPage && all.length < ret.dataEx){
	            	fetchNext();
	            }else{
	            	cb(all);
	            }
	        },
	        error : function () {
	        	if(!failed){
	        		showErrorMessage(_Lang("导出失败", ":", "服务器异常"));
	        	}
	        }
	    });
	}

	fetchNext();
}

function importSystemSetting(){
	$("#importSystemSettingFile").val("");
	$("#importSystemSettingFile").click();
}

function importSystemSettingFileChanged(input){
	var file = input.files[0];
	if(!file){
		return;
	}

	var reader = new FileReader();
	reader.onload = function(){
		var payload = null;
		try{
			payload = JSON.parse(String(reader.result || ""));
		}catch(e){
			showErrorMessage(_Lang("导入失败", ":", "文件不是合法 JSON"));
			return;
		}

		var list = (payload && payload.systemSettings) ? payload.systemSettings : payload;
		if(!(list instanceof Array)){
			showErrorMessage(_Lang("导入失败", ":", "需要 {systemSettings:[...]} 或 JSON 数组"));
			return;
		}

		$.ajax({
	        url : "/DocSystem/SysConfig/import.do",
	        type : "post",
	        dataType : "json",
	        data : {
	        	settings : JSON.stringify(list)
	        },
	        success : function (ret) {
	            if( "ok" == ret.status )
	            {
	            	var d = ret.data;
	            	var msg = _Lang("导入完成") + "：" + _Lang("成功") + " " + d.success + " / " + d.total
	            		+ "，" + _Lang("失败") + " " + d.failed;
	            	if(d.errors && d.errors.length > 0){
	            		alert(msg + "\n" + d.errors.join("\n"));
	            	}else{
	            		showErrorMessage(msg);
	            	}
	            	showSystemSettingList(0);
	            }
	            else
	            {
	            	showErrorMessage(_Lang("导入失败", ":", ret.msgInfo));
	            }
	        },
	        error : function () {
	        	showErrorMessage(_Lang("导入失败", ":", "服务器异常"));
	        }
	    });
	};
	reader.readAsText(file, "UTF-8");
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
		agentSkillStorePath:"",
		salesDataStorePath:"",
		ldapConfig:"",	//LDAP Config
		allowedNetworkConfig:"",	//allowedNetworkConfig
		llmConfig:"",	//AI LLM Config
		logLevel: 1,	//default info
		logFile : "", //defualt not set
		maxThreadCount: 1, //default 1
		systemDisabled: 0, //default 0
		officeDisabled: 0, //default 0			
}

/****************  系统管理各子页公共逻辑  ******************/

//「系统设置」页保留的字段（其余配置已拆到各自的子页面维护）
var SYSTEM_INFO_FIELDS = ["tomcatPath", "javaHome", "defaultReposStorePath", "indexDBStorePath", "agentSkillStorePath", "salesDataStorePath", "systemLogStorePath", "maxThreadCount"];

//「系统设置」页支持「目录树选择」的存储位置字段（与页面上的「选择…」按钮一一对应）
var STORE_PATH_FIELDS = ["defaultReposStorePath", "indexDBStorePath", "agentSkillStorePath", "salesDataStorePath", "systemLogStorePath"];

//打开「选择目录」对话框（对话框实现见 systemStorePathPicker.js）
//重要：选择结果只回填输入框，**不自动保存** —— 仍需点页面上的「保存」
function openStorePathPicker(fieldId){
	if($.inArray(fieldId, STORE_PATH_FIELDS) < 0){
		console.log("openStorePathPicker() 未知字段:", fieldId);
		return;
	}
	var fieldName = $.trim($("#" + fieldId).closest("tr").find("td:first").text());
	//底部「确定 / 取消」用 qiao 自带的 modal-footer（右下角）：foot = 显示底部，btn = 同时显示「取消」
	//注：qiao.bs.dialog 内部会把 big 强制置 false，所以宽度用 mstyle 直接指定
	qiao.bs.dialog({
		id: 'systemStorePathPicker',
		url: 'systemStorePathPicker' + langExt + '.html',
		title: _Lang('选择目录') + (fieldName == "" ? "" : ("：" + fieldName)),
		msg: _Lang('页面正在加载，请稍候') + '...',
		foot: true,
		btn: true,
		okbtn: _Lang('确定'),
		qubtn: _Lang('取消'),
		mstyle: 'width:760px;max-width:calc(100% - 24px);',
		callback: function(){
			//对话框的 HTML 里带的 <script> 是异步加载的：等 systemStorePathPicker.js 执行完再初始化
			waitStorePathPickerReady(fieldId, 0);
		}
	}, function(){
		//「确定」：返回 false 时保持对话框打开（例如还没选目录）
		return onStorePathPickerOk();
	}, function(){
		//「取消」：不改动输入框
		return true;
	});
}

//等待「选择目录」对话框的脚本就绪（注入 HTML 里的 <script> 是异步执行的，直接调用可能函数还未定义）
function waitStorePathPickerReady(fieldId, tryCount){
	if(typeof initStorePathPicker == "function"){
		initStorePathPicker(fieldId);
		return;
	}
	if(tryCount >= 50){	//约 5 秒
		console.log("waitStorePathPickerReady() 超时：systemStorePathPicker.js 未加载？");
		return;
	}
	setTimeout(function(){ waitStorePathPickerReady(fieldId, tryCount + 1); }, 100);
}

//目录选择结果回填：只改输入框（不写 systemInfo）
//⇒ 点页面「取消」时 cancelSystemInfoSet() 会按 systemInfo 回滚，即「取消 = 回到进入编辑态前的值」
function applyStorePathPickResult(fieldId, path){
	console.log("applyStorePathPickResult", fieldId, path);
	$("#" + fieldId).val(path);
}

//子页共用的取数 + 渲染：templateName 为 tmpl 下的模板名（不含 _en）
//normalize：渲染前修正 systemInfo；afterRender：渲染完成后的补充动作（如动态状态刷新）
function showSystemInfoPage(templateName, normalize, afterRender){
	$.ajax({
        url : "/DocSystem/Manage/getSystemInfo.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            console.log("showSystemInfoPage(" + templateName + ") ret", ret);
        	if( "ok" == ret.status )
            {
            	systemInfo = ret.data;	//联动逻辑（如 selectRedisEn）需要配置里的值
            	if(normalize)
            	{
            		normalize();
            	}
            	$Func.render($("#container"),templateName + langExt,{"value":systemInfo});
            	if(afterRender)
            	{
            		afterRender();
            	}
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

//子页的编辑态切换：prefix 为页面按钮 id 的后缀（如 SystemNetwork → btnEnableSystemNetworkSet / btnSaveSystemNetworkSet / btnCancelSystemNetworkSet）
function setSystemPageEditMode(prefix, fieldIds, editing){
	$("#btnEnable" + prefix + "Set").toggle(!editing);
	$("#btnSave" + prefix + "Set").toggle(editing);
	$("#btnCancel" + prefix + "Set").toggle(editing);
	for(var i = 0; fieldIds && i < fieldIds.length; i++)
	{
		$("#" + fieldIds[i]).prop('disabled', !editing);
	}
	//存储位置的「选择…」按钮与字段同步启停（其它子页没有这类按钮，选择器命中为空）
	$(".storePathPickBtn").prop('disabled', !editing);
}

//保存系统参数：只提交 fields 里显式给出的字段。
//必须按页白名单构造请求体：jQuery 会把 undefined 序列化成空串（实测 1.10.2：$.param({a:undefined}) == "a="），
//而 setSystemInfo.do 对每个参数都是「传 null 才不改」→ 空串会被当成「把该配置改成空」，
//从而把别的页面负责的配置清掉。
function postSystemInfo(fields, onDone){
	console.log("postSystemInfo fields:", fields);
	$.ajax({
        url : "/DocSystem/Manage/setSystemInfo.do",
        type : "post",
        dataType : "json",
        data : fields,
        success : function (ret) {
        	console.log("postSystemInfo ret:", ret);
            if( "ok" == ret.status )
            {
            	showErrorMessage(_Lang("更新成功！"));
            }
            else
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("更新失败", ":", ret.msgInfo));
            }
            if(onDone)
            {
            	onDone();
            }
        },
        error : function () {
        	showErrorMessage(_Lang("更新失败", ":", "服务器异常"));
            if(onDone)
            {
            	onDone();
            }
        }
    });
}

function enableSystemInfoSet(){
	console.log("enableSystemInfoSet systemInfo:", systemInfo);
	setSystemPageEditMode("SystemInfo", SYSTEM_INFO_FIELDS, true);
}

function cancelSystemInfoSet(){
	console.log("cancelSystemInfoSet systemInfo:", systemInfo);

	//revert the value
	$("#tomcatPath").val(systemInfo.tomcatPath || "");
	$("#javaHome").val(systemInfo.javaHome || "");
	$("#defaultReposStorePath").val(systemInfo.defaultReposStorePath || "");
	$("#systemLogStorePath").val(systemInfo.systemLogStorePath || "");
	$("#indexDBStorePath").val(systemInfo.indexDBStorePath || "");
	$("#agentSkillStorePath").val(systemInfo.agentSkillStorePath || "");
	$("#salesDataStorePath").val(systemInfo.salesDataStorePath || "");
	$("#maxThreadCount").val(systemInfo.maxThreadCount);
	setSystemPageEditMode("SystemInfo", SYSTEM_INFO_FIELDS, false);
}

function saveSystemInfoSet(){
	console.log("saveSystemInfoSet systemInfo:", systemInfo);

	setSystemPageEditMode("SystemInfo", SYSTEM_INFO_FIELDS, false);

	//只提交「系统设置」页仍保留的字段（其余配置已拆到各自的子页维护，详见 postSystemInfo 注释）
	var data = {
		tomcatPath: $("#tomcatPath").val() || "",
		javaHome: $("#javaHome").val() || "",
		defaultReposStorePath: $("#defaultReposStorePath").val() || "",
		systemLogStorePath: $("#systemLogStorePath").val() || "",
		indexDBStorePath: $("#indexDBStorePath").val() || "",
		agentSkillStorePath: $("#agentSkillStorePath").val() || "",
		maxThreadCount: $("#maxThreadCount").val()
	};
	if($("#salesDataStorePath").length > 0)
	{
		//销售数据存储位置只在销售服务器上渲染
		data.salesDataStorePath = $("#salesDataStorePath").val() || "";
	}

	postSystemInfo(data, showSystemUpgrade);
}

//注意：本函数已无调用方——「系统设置」页改为按页白名单提交（见 postSystemInfo）。
//保留仅作历史参考，不要在新代码里调用：它会把页面上不存在的字段以空串提交，
//而 setSystemInfo.do 对字符串参数是「空串=改成空」，可能清掉别的页面负责的配置。
function updateSystemInfo(tomcatPath, 
		javaHome, 
		openOfficePath, 
		officeEditorApi, 
		defaultReposStorePath, 
		systemLogStorePath, 
		indexDBStorePath,
		agentSkillStorePath,
		salesDataStorePath,
		ldapConfig, 
		allowedNetworkConfig, 
		llmConfig, 
		logLevel, 
		ouputToFileEn,
		logFile,
		maxThreadCount,
		redisEn,
		redisUrl,
		clusterServerUrl,
		isOnlyOfficeUsed)
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
        	agentSkillStorePath: agentSkillStorePath,
        	salesDataStorePath: salesDataStorePath,
        	ldapConfig: ldapConfig,
        	allowedNetworkConfig: allowedNetworkConfig,
        	llmConfig: llmConfig,
        	logLevel: logLevel,
        	logFile: logFile,
        	maxThreadCount: maxThreadCount,
        	redisEn: redisEn,
        	redisUrl: redisUrl,
        	clusterServerUrl: clusterServerUrl,
        	isOnlyOfficeUsed: isOnlyOfficeUsed,
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
        		systemInfo.agentSkillStorePath = agentSkillStorePath;
        		systemInfo.salesDataStorePath = salesDataStorePath;
        		systemInfo.ldapConfig = ldapConfig;
        		systemInfo.allowedNetworkConfig = allowedNetworkConfig;
        		systemInfo.llmConfig = llmConfig;
        		systemInfo.maxThreadCount = maxThreadCount;
        		systemInfo.logLevel = logLevel;
        		systemInfo.logFile = logFile;
        		systemInfo.ouputToFileEn = ouputToFileEn;
        		systemInfo.redisEn = redisEn;
        		systemInfo.redisUrl = redisUrl;
        		systemInfo.clusterServerUrl = clusterServerUrl;
        		systemInfo.isOnlyOfficeUsed = isOnlyOfficeUsed;
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
        		$("#agentSkillStorePath").val(systemInfo.agentSkillStorePath);
        		$("#salesDataStorePath").val(systemInfo.salesDataStorePath);
        		$("#ldapConfig").val(systemInfo.ldapConfig);
        		$("#allowedNetworkConfig").val(systemInfo.allowedNetworkConfig);
        		$("#llmConfig").val(systemInfo.llmConfig);
        		$("#maxThreadCount").val(systemInfo.maxThreadCount);
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
        		if(systemInfo.isOnlyOfficeUsed == 1)
        		{
        			$("#isOnlyOfficeUsed").prop("checked", true);
        		}
        		else
        		{
        			$("#isOnlyOfficeUsed").prop("checked",false);			
        		}
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
    		$("#agentSkillStorePath").val(systemInfo.agentSkillStorePath);
    		$("#salesDataStorePath").val(systemInfo.salesDataStorePath);
    		$("#ldapConfig").val(systemInfo.ldapConfig);
    		$("#allowedNetworkConfig").val(systemInfo.allowedNetworkConfig);
    		$("#llmConfig").val(systemInfo.llmConfig);
    		$("#maxThreadCount").val(systemInfo.maxThreadCount);
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
        		if(systemInfo.isOnlyOfficeUsed == undefined)
            	{
            		systemInfo.isOnlyOfficeUsed = 0;	//default use FileConverter
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

//调试日志（系统管理 → 调试日志）：日志级别/输出到指定文件的配置 + 日志文件的运维操作（在线查看/下载/清除）
function showSystemDebugLog(){
	$.ajax({
        url : "/DocSystem/Manage/getSystemInfo.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            console.log("showSystemDebugLog() ret", ret);
        	if( "ok" == ret.status )
            {
            	var config = ret.data;
            	systemInfo = config;	//selectOutputToFileEn() 需要 tomcatPath 来补默认日志路径
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
            	$Func.render($("#container"),"systemDebugLog" + langExt,{"value":systemInfo}, bindSystemDebugLogDirtyCheck);
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

//该页没有「编辑」按键：用「表单当前值 vs 进页时拉取到的值」判定有没有改动，
//没改动就把「保存/取消」置灰——用户一眼能看出参数是否被改过（值改回原样也会重新置灰）
function isSystemDebugLogDirty(){
	var outputToFileEn = $("#outputToFileEn").is(':checked')? 1: 0;
	var logLevel = systemInfo.logLevel == undefined? 1: systemInfo.logLevel;
	if(String($("#logLevel").val()) != String(logLevel))
	{
		return true;
	}
	if(outputToFileEn != systemInfo.outputToFileEn)
	{
		return true;
	}
	//「日志文件路径」只在勾选「输出到指定文件」时参与比较（未勾选时后端会把它清空）
	if(outputToFileEn == 1 && $("#logFile").val() != systemInfo.logFile)
	{
		return true;
	}
	return false;
}

function updateSystemDebugLogButtons(){
	var dirty = isSystemDebugLogDirty();
	$("#btnSaveSystemDebugLogSet").prop("disabled", !dirty);
	$("#btnCancelSystemDebugLogSet").prop("disabled", !dirty);
}

//渲染后绑定：三个字段任一变化都重新判定
//（render 会替换整块 DOM，所以每次渲染后都要重新绑定）
function bindSystemDebugLogDirtyCheck(){
	updateSystemDebugLogButtons();
	$("#logLevel").on("change", updateSystemDebugLogButtons);
	$("#logFile").on("input", updateSystemDebugLogButtons);
	$("#outputToFileEn").on("click", function(){
		selectOutputToFileEn();	//勾选/取消勾选时同步「日志文件路径」的可用性
		updateSystemDebugLogButtons();
	});
}

function cancelSystemDebugLogSet(){
	console.log("cancelSystemDebugLogSet systemInfo:", systemInfo);

	//该页没有「编辑」按键，三个字段始终可改；「取消」只把字段回滚到进页时拉取到的值
	//注意：必须用 val() 回滚。attr("selected","selected") 只在 select 未被赋值/交互过时有效，
	//用户或脚本改过选项后 select 处于"dirty"状态，改 selected 属性不会再改变当前选中项。
	$("#logLevel").val(systemInfo.logLevel);
	$("#logFile").val(systemInfo.logFile);
	if(systemInfo.outputToFileEn == 1)
	{
		$("#outputToFileEn").prop("checked", true);
	}
	else
	{
		$("#outputToFileEn").prop("checked", false);			
	}
	$("#logFile").prop("disabled", systemInfo.outputToFileEn != 1);
	updateSystemDebugLogButtons();	//值已回到进页状态 → 「保存/取消」重新置灰
}

//只提交日志相关的两个字段：setSystemInfo.do 里其余字段传 null 表示「不改」，
//但 logFile 例外（传 null 会清空日志文件配置），所以 logFile 必须始终提交
//（关闭「输出到指定文件」时提交空串，由后端转成 null 清除）
function saveSystemDebugLogSet(){
	console.log("saveSystemDebugLogSet systemInfo:", systemInfo);

	//该页没有「编辑」按键，字段始终可改；保存时先把「保存/取消」置灰避免重复提交，
	//保存完会重新拉取配置（showSystemDebugLog）并按新的进页值重新判定
	$("#btnSaveSystemDebugLogSet").prop("disabled", true);
	$("#btnCancelSystemDebugLogSet").prop("disabled", true);

	var logLevel = $("#logLevel").val();
	var outputToFileEn = $("#outputToFileEn").is(':checked')? 1: 0;
	var logFile = "";
	if(outputToFileEn == 1)
	{
		logFile = $("#logFile").val();
		if(logFile == undefined)
		{
			logFile = "";
		}
	}

	$.ajax({
        url : "/DocSystem/Manage/setSystemInfo.do",
        type : "post",
        dataType : "json",
        data : {
        	logLevel: logLevel,
        	logFile: logFile
        },
        success : function (ret) {
        	console.log("saveSystemDebugLogSet ret:",ret);
            if( "ok" == ret.status )
            {
            	systemInfo.logLevel = logLevel;
            	systemInfo.logFile = logFile;
            	systemInfo.outputToFileEn = outputToFileEn;
            	showErrorMessage(_Lang("更新成功！"));
            }
            else
            {
                console.log(ret.msgInfo);
                showErrorMessage(_Lang("更新失败", ":", ret.msgInfo));
            }
            showSystemDebugLog();	//重新拉取配置，界面回到不可编辑的当前值
        },
        error : function () {
        	showErrorMessage(_Lang("更新失败", ":", "服务器异常"));
        	showSystemDebugLog();
        }
    });
}

/****************  系统管理子页：LDAP设置 / 安全网络设置 / AI接入设置 / 集群部署设置 / Office编辑器  ******************/

//======================= 系统管理 → LDAP设置（多服务器列表）=======================
//存储：system_setting(ldap.servers) 为权威源（后端 LdapConfigStore）；
//运行期镜像串（url; name=..; loginMode=.. 用 || 连接）由后端渲染并落 docSys.ini/classes，
//保存后立即生效（无需重启）。列表顺序 = 不带域名登录时的尝试顺序；停用的服务器不参与登录。
//每次操作（新增/编辑/删除/启停/置顶）都**立即落盘**，无页面级「保存/取消」。
var gSystemLdapServers = [];			//当前列表（含停用项）
var gSystemLdapLegacy = "";				//当前运行期配置串（诊断用）
var gSystemLdapMaxServers = 20;
var gSystemLdapDocSysType = 0;
var gSystemLdapSupported = false;		//是否企业版（非企业版不允许启用LDAP）
var gSystemLdapDefaultLoginMode = "uid";
var gSystemLdapSaving = false;			//保存中（防连点）
var gEditingSystemLdapId = "";			//对话框正在编辑的服务器 id（新增时为空；一律按 id 定位，避免行号失效）
var gLdapExtraSettingsError = "";		//对话框里「其他设置」解析错误（由 systemLdapServerEdit.js 写入）

function showSystemLdap(){
	$.ajax({
		url : "/DocSystem/Manage/getSystemLdapConfig.do",
		type : "post",
		dataType : "json",
		success : function (ret) {
			console.log("showSystemLdap() ret", ret);
			if("ok" == ret.status)
			{
				loadSystemLdapServers(ret.data);
			}
			else
			{
				showErrorMessage(_Lang("读取LDAP配置失败", " : ", ret.msgInfo));
			}
		},
		error : function () {
			showErrorMessage(_Lang("读取LDAP配置失败", " : ", "服务器异常"));
		}
	});
}

function loadSystemLdapServers(data){
	gSystemLdapServers = (data && data.servers) ? data.servers : [];
	gSystemLdapLegacy = (data && data.legacy) ? data.legacy : "";
	if(data && data.maxServers)
	{
		gSystemLdapMaxServers = data.maxServers;
	}
	if(data && data.defaultLoginMode)
	{
		gSystemLdapDefaultLoginMode = data.defaultLoginMode;
	}
	if(data)
	{
		gSystemLdapDocSysType = data.docSysType || 0;
		gSystemLdapSupported = (data.ldapSupported == true);
	}
	renderSystemLdapView();
}

//接口格式：与后端 LdapServerConfig 一一对应（嵌套 attributes + 对象形 extraSettings）
function systemLdapApiServer(server){
	var attr = server.attributes || {};
	var extra = server.extraSettings || {};
	var extraObj = {};
	for(var key in extra)
	{
		extraObj[key] = extra[key];
	}
	return {
		id : server.id || "",
		name : server.name || "",
		scheme : (server.scheme == null || server.scheme == "") ? "ldap" : server.scheme,
		host : server.host || "",
		port : server.port || "",
		baseDn : server.baseDn || "",
		enabled : (server.enabled != false),
		authentication : server.authentication || "",
		domainCheck : (server.domainCheck == true),
		loginMode : server.loginMode || "",
		bindAccount : server.bindAccount || "",
		bindPassword : server.bindPassword || "",
		filter : server.filter || "",
		attributes : {
			name : attr.name || "",
			realName : attr.realName || "",
			nickName : attr.nickName || "",
			mail : attr.mail || "",
			description : attr.description || ""
		},
		extraSettings : extraObj
	};
}

//渲染列表
function renderSystemLdapView(){
	var servers = [];
	for(var i=0; i<gSystemLdapServers.length; i++)
	{
		var one = $.extend({}, gSystemLdapServers[i]);
		one.url = systemLdapServerUrl(one);
		one.baseDn = one.baseDn || "";
		one.bindAccount = one.bindAccount || "";
		one.authText = (one.authentication == null || one.authentication == "") ? _Lang("简单绑定(simple)") : one.authentication;
		one.loginModeText = (one.loginMode == null || one.loginMode == "") ? gSystemLdapDefaultLoginMode : one.loginMode;
		servers.push(one);
	}

	$Func.render($("#container"), "systemLdap" + langExt,
		{"value" : {"servers" : servers, "legacy" : gSystemLdapLegacy, "maxServers" : gSystemLdapMaxServers,
			"ldapSupported" : gSystemLdapSupported, "docSysType" : gSystemLdapDocSysType}});
}

//列表里展示的服务器地址（与后端的渲染口径一致：scheme://host[:port]/baseDn）
function systemLdapServerUrl(server){
	var scheme = (server.scheme == null || server.scheme == "") ? "ldap" : server.scheme;
	var url = scheme + "://" + (server.host || "");
	if(server.port != null && server.port != "")
	{
		url += ":" + server.port;
	}
	url += "/" + (server.baseDn || "");
	return url;
}

//------------- 落盘（每次操作后立即保存；成功则用服务端返回值重绘，失败则回读服务端状态）-------------
//onSuccess 只在「新增/编辑对话框保存」这类显式动作里传（弹一次成功提示）；
//启停/置顶/删除靠列表自身变化反馈，不弹提示。
function persistSystemLdapServers(onSuccess, onFail){
	if(gSystemLdapSaving)
	{
		return;
	}
	gSystemLdapSaving = true;

	var data = [];
	for(var i=0; i<gSystemLdapServers.length; i++)
	{
		data.push(systemLdapApiServer(gSystemLdapServers[i]));
	}

	$.ajax({
		url : "/DocSystem/Manage/setSystemLdapConfig.do",
		type : "post",
		dataType : "json",
		data : { servers : JSON.stringify(data) },
		success : function (ret) {
			console.log("persistSystemLdapServers ret", ret);
			if("ok" == ret.status)
			{
				loadSystemLdapServers(ret.data);
				if(onSuccess) { onSuccess(); }
			}
			else
			{
				showErrorMessage(_Lang("保存LDAP配置失败", " : ", ret.msgInfo));
				showSystemLdap();	//回读服务端状态（放弃本地改动）
				if(onFail) { onFail(ret.msgInfo); }
			}
		},
		error : function () {
			showErrorMessage(_Lang("保存LDAP配置失败", " : ", "服务器异常"));
			showSystemLdap();
			if(onFail) { onFail(""); }
		},
		complete : function () {
			gSystemLdapSaving = false;
		}
	});
}

//------------- 校验（与后端 LdapConfigStore.validate 同口径，先拦住再请求）-------------
function systemLdapHasSeparator(value){
	return value != null && (value.indexOf(";") >= 0 || value.indexOf("|") >= 0);
}

//对话框正在编辑的行号（按 id 定位；新增/未命中 → -1）
function systemLdapSelfIndex(){
	if(gEditingSystemLdapId == null || gEditingSystemLdapId == "")
	{
		return -1;
	}
	for(var i=0; i<gSystemLdapServers.length; i++)
	{
		if(gSystemLdapServers[i].id == gEditingSystemLdapId)
		{
			return i;
		}
	}
	return -1;
}

function validateSystemLdapServer(server, selfIndex){
	if(selfIndex == undefined)
	{
		selfIndex = systemLdapSelfIndex();	//对话框路径：跳过正在编辑的那一行
	}
	if(gLdapExtraSettingsError != "")
	{
		return gLdapExtraSettingsError;
	}

	var host = $.trim(server.host || "");
	var scheme = $.trim(server.scheme || "");
	var port = $.trim(server.port || "");
	var baseDn = $.trim(server.baseDn || "");
	var name = $.trim(server.name || "");

	if(host == "")
	{
		return _Lang("服务器地址不能为空");
	}
	if(scheme != "" && scheme != "ldap" && scheme != "ldaps")
	{
		return _Lang("协议只支持 ldap 或 ldaps");
	}
	if(port != "")
	{
		if(!/^[0-9]+$/.test(port))
		{
			return _Lang("端口必须是数字");
		}
		var portNum = parseInt(port, 10);
		if(portNum < 1 || portNum > 65535)
		{
			return _Lang("端口必须在1~65535之间");
		}
	}
	if(baseDn == "")
	{
		return _Lang("基础DN不能为空");
	}
	if(systemLdapHasSeparator(host) || systemLdapHasSeparator(port) || systemLdapHasSeparator(name)
		|| systemLdapHasSeparator(baseDn) || systemLdapHasSeparator(server.loginMode)
		|| systemLdapHasSeparator(server.bindAccount) || systemLdapHasSeparator(server.bindPassword)
		|| systemLdapHasSeparator(server.filter))
	{
		return _Lang("配置值不能包含分号或竖线");
	}

	var attr = server.attributes || {};
	if(systemLdapHasSeparator(attr.name) || systemLdapHasSeparator(attr.realName)
		|| systemLdapHasSeparator(attr.nickName) || systemLdapHasSeparator(attr.mail)
		|| systemLdapHasSeparator(attr.description))
	{
		return _Lang("属性映射不能包含分号或竖线");
	}

	var extra = server.extraSettings || {};
	for(var key in extra)
	{
		if(systemLdapHasSeparator(key) || systemLdapHasSeparator(extra[key]) || key.indexOf("=") >= 0)
		{
			return _Lang("其他设置不能包含分号竖线或等号");
		}
	}

	//非企业版不允许启用（与后端一致；停用/清空不受限）
	if(server.enabled != false && !gSystemLdapSupported)
	{
		return _Lang("当前版本不支持LDAP登录认证，请购买企业版！");
	}

	//域名唯一性（只约束启用项）：域名可以不填（单域/主备多台且不带域名登录是合法场景），
	//但多台启用时「同名域名」会让「域名/账号」登录产生歧义，必须拦住。
	if(server.enabled != false && name != "")
	{
		for(var i=0; i<gSystemLdapServers.length; i++)
		{
			if(i == selfIndex)
			{
				continue;
			}
			var other = gSystemLdapServers[i];
			if(other.enabled == false)
			{
				continue;
			}
			if($.trim(other.name || "").toLowerCase() == name.toLowerCase())
			{
				return _Lang("域名已存在", " : ", name);
			}
		}
	}
	return null;
}

//------------- 增删改查（都先改内存，最后点页面「保存」才落盘）-------------
function addSystemLdapServer(){
	if(gSystemLdapServers.length >= gSystemLdapMaxServers)
	{
		showErrorMessage(_Lang("最多支持的服务器数", " : ", gSystemLdapMaxServers));
		return;
	}
	gEditingSystemLdapId = "";
	showSystemLdapServerEditPanel(null);
}

function editSystemLdapServer(index){
	var server = gSystemLdapServers[index];
	if(server == null)
	{
		return;
	}
	gEditingSystemLdapId = server.id || "";
	showSystemLdapServerEditPanel(server);
}

function showSystemLdapServerEditPanel(server){
	qiao.bs.dialog({
		id: 'systemLdapServerEdit',
		url: 'systemLdapServerEdit' + langExt + '.html',
		title: (server == null) ? _Lang('新增LDAP服务器') : _Lang('编辑LDAP服务器'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		callback: function(){
			$("#systemLdapServerName").val(server == null ? "" : (server.name || ""));
			$("#systemLdapServerScheme").val((server == null || server.scheme == null || server.scheme == "") ? "ldap" : server.scheme);
			$("#systemLdapServerHost").val(server == null ? "" : (server.host || ""));
			$("#systemLdapServerPort").val(server == null ? "" : (server.port || ""));
			$("#systemLdapServerBaseDn").val(server == null ? "" : (server.baseDn || ""));
			$("#systemLdapServerAuthentication").val(server == null ? "" : (server.authentication || ""));
			$("#systemLdapServerLoginMode").val(server == null ? "" : (server.loginMode || ""));
			$("#systemLdapServerBindAccount").val(server == null ? "" : (server.bindAccount || ""));
			//已保存的鉴权密码直接回填（便于管理员核对原值）
			$("#systemLdapServerBindPassword").val(server == null ? "" : (server.bindPassword || ""));
			$("#systemLdapServerDomainCheck").prop("checked", (server != null && server.domainCheck == true));
			$("#systemLdapServerEnabled").prop("checked", server == null ? true : (server.enabled != false));

			var attr = (server == null || server.attributes == null) ? {} : server.attributes;
			var extra = (server == null || server.extraSettings == null) ? {} : server.extraSettings;
			var hasAdvanced = (server != null && server.filter != null && server.filter != "");
			for(var key in attr)
			{
				if(attr[key] != null && attr[key] != "")
				{
					hasAdvanced = true;
				}
			}
			for(var key2 in extra)
			{
				hasAdvanced = true;
			}
			$("#systemLdapServerUseAdvanced").prop("checked", hasAdvanced);
			$("#systemLdapServerFilter").val(server == null ? "" : (server.filter || ""));
			$("#systemLdapServerNameAttribute").val(attr.name || "");
			$("#systemLdapServerRealNameAttribute").val(attr.realName || "");
			$("#systemLdapServerNickNameAttribute").val(attr.nickName || "");
			$("#systemLdapServerMailAttribute").val(attr.mail || "");
			$("#systemLdapServerDescriptionAttribute").val(attr.description || "");
			$("#systemLdapServerOtherSettings").val(buildSystemLdapOtherSettingsText(extra));
			onToggleSystemLdapServerAdvanced();

			$("#systemLdapTestUser").val("");
			$("#systemLdapTestPassword").val("");
			$("#systemLdapServerTestResult").empty();
			$("#systemLdapServerName").focus();
		}
	}, null);
}

function buildSystemLdapOtherSettingsText(extra){
	var lines = [];
	for(var key in extra)
	{
		lines.push(key + "=" + extra[key]);
	}
	return lines.join("\n");
}

//对话框「保存」回写内存（新增 = 追加；编辑 = 覆盖原行，沿用原 id）并**立即落盘**
function applySystemLdapServerEditResult(server){
	var one = {
		id : server.id || "",
		name : server.name || "",
		scheme : server.scheme || "ldap",
		host : server.host || "",
		port : server.port || "",
		baseDn : server.baseDn || "",
		enabled : (server.enabled != false),
		authentication : server.authentication || "",
		domainCheck : (server.domainCheck == true),
		loginMode : server.loginMode || "",
		bindAccount : server.bindAccount || "",
		bindPassword : server.bindPassword || "",
		filter : server.filter || "",
		attributes : server.attributes || {},
		extraSettings : server.extraSettings || {}
	};

	//按 id 写入（新增/找不到则追加）；一律按 id，避免保存失败回读后行号失效
	var index = systemLdapSelfIndex();
	if(index >= 0)
	{
		one.id = gSystemLdapServers[index].id;	//沿用原 id
		gSystemLdapServers[index] = one;
	}
	else
	{
		one.id = gEditingSystemLdapId || "";
		gSystemLdapServers.push(one);
	}
	renderSystemLdapView();

	//立即落盘；失败则保持列表与服务端一致（persist 内部会回读），弹窗不关以便修正后重试
	persistSystemLdapServers(function(){
		showErrorMessage(_Lang("LDAP配置已保存并生效"));
		closeSystemLdapServerEditModal();
	}, function(msg){
		//服务端拒绝时把完整错误回显到弹窗里（列表已回读为服务端状态）
		$("#systemLdapServerTestResult").html("<font color='red'><strong>" + _Lang("保存失败") + "</strong></font><br/><br/>" + (msg || ""));
	});
}

function deleteSystemLdapServer(index){
	var server = gSystemLdapServers[index];
	if(server == null)
	{
		return;
	}
	qiao.bs.confirm({
		id: "deleteSystemLdapServerConfirmDialog",
		title: _Lang("删除LDAP服务器"),
		msg: _Lang("是否删除服务器") + " [" + (server.name || server.host) + "] ？",
		okbtn: _Lang("确认"),
		qubtn: _Lang("取消"),
	}, function(){
		gSystemLdapServers.splice(index, 1);
		renderSystemLdapView();
		persistSystemLdapServers();	//行消失即反馈；失败会在 persist 里报错
		return true;	//close dialog
	}, function(){
		return true;	//close dialog
	});
}

//启用/停用：立即落盘（停用项不参与运行期）
function toggleSystemLdapServer(index){
	var server = gSystemLdapServers[index];
	if(server == null)
	{
		return;
	}
	server.enabled = (server.enabled == false);	//取反
	renderSystemLdapView();
	persistSystemLdapServers();	//列表状态即反馈，不弹提示（失败会在 persist 里报错）
}

//置顶：不带域名登录时按列表顺序尝试，置顶后它就是第一台；立即落盘
function moveSystemLdapServerToTop(index){
	if(index <= 0 || index >= gSystemLdapServers.length)
	{
		return;
	}
	var server = gSystemLdapServers[index];
	gSystemLdapServers.splice(index, 1);
	gSystemLdapServers.unshift(server);
	renderSystemLdapView();
	persistSystemLdapServers();	//列表顺序即反馈，不弹提示（失败会在 persist 里报错）
}

//------------- 测试连接（服务端渲染串 → 复用 Manage/ldapTest.do 做解析/登录测试）-------------
function sendSystemLdapServerTest(server, testUser, testPassword, cb){
	$.ajax({
		url : "/DocSystem/Manage/renderSystemLdapServer.do",
		type : "post",
		dataType : "json",
		data : {
			server : JSON.stringify(systemLdapApiServer(server)),
			testUser : testUser || "",
			testPassword : testPassword || ""
		},
		success : function (ret) {
			if("ok" != ret.status || ret.data == null || !ret.data.ldapConfig)
			{
				cb({"status" : "error", "msgInfo" : ret.msgInfo || ""});
				return;
			}
			$.ajax({
				url : "/DocSystem/Manage/ldapTest.do",
				type : "post",
				dataType : "json",
				data : { ldapConfig : ret.data.ldapConfig },
				success : function (ret2) {
					cb(ret2);
				},
				error : function () {
					cb({"status" : "error", "msgInfo" : _Lang("服务器异常")});
				}
			});
		},
		error : function () {
			cb({"status" : "error", "msgInfo" : _Lang("服务器异常")});
		}
	});
}

function buildSystemLdapTestHtml(ret){
	var ok = ("ok" == ret.status);
	var title = ok ? _Lang("测试成功") : _Lang("测试失败");
	var color = ok ? "green" : "red";
	return "<font color='" + color + "'><strong>" + title + "</strong></font><br/><br/>" + (ret.msgInfo || "");
}

//列表行「测试」：测试账号取该服务器已保存的 testUser（没有则由后端回落默认值 test）
function testSystemLdapServer(index){
	var server = gSystemLdapServers[index];
	if(server == null)
	{
		return;
	}
	showErrorMessage(_Lang("正在测试LDAP服务器", " : ", (server.name || server.host)));
	sendSystemLdapServerTest(server, "", "", function(ret){
		showErrorMessage(buildSystemLdapTestHtml(ret));
	});
}

//对话框「测试连接」：用表单当前值 + 弹窗里填的测试账号
function testSystemLdapServerObj(server, $result, $btn){
	if($result)
	{
		$result.html(_Lang("正在测试，请稍等..."));
	}
	if($btn)
	{
		$btn.attr("disabled", true);
	}
	sendSystemLdapServerTest(server, $("#systemLdapTestUser").val(), $("#systemLdapTestPassword").val(), function(ret){
		if($btn)
		{
			$btn.attr("disabled", false);
		}
		if($result)
		{
			$result.html(buildSystemLdapTestHtml(ret));
		}
		else
		{
			showErrorMessage(buildSystemLdapTestHtml(ret));
		}
	});
}

//安全网络设置
var SYSTEM_NETWORK_FIELDS = ["allowedNetworkConfig"];

function showSystemNetwork(){
	showSystemInfoPage("systemNetwork", function(){
		systemInfo.allowedNetworkConfig = systemInfo.allowedNetworkConfig || "";
	});
}

function enableSystemNetworkSet(){
	console.log("enableSystemNetworkSet systemInfo:", systemInfo);
	setSystemPageEditMode("SystemNetwork", SYSTEM_NETWORK_FIELDS, true);
}

function cancelSystemNetworkSet(){
	$("#allowedNetworkConfig").val(systemInfo.allowedNetworkConfig);
	setSystemPageEditMode("SystemNetwork", SYSTEM_NETWORK_FIELDS, false);
}

function saveSystemNetworkSet(){
	setSystemPageEditMode("SystemNetwork", SYSTEM_NETWORK_FIELDS, false);
	postSystemInfo({ allowedNetworkConfig: $("#allowedNetworkConfig").val() || "" }, showSystemNetwork);
}

//======================= 智能体设置 → AI接入设置（系统级 LLM 模型列表）=======================
//存储：agent_config(global, llm_models) 为权威源（后端 AgentLlmConfigStore）；
//运行期镜像串（url; name=..; modelName=..; apikey=.. 用 || 连接）由后端渲染并落 docSys.ini，
//保存后立即生效（无需重启）。列表顺序即优先级，第 1 个「启用」的模型是默认模型。
var gSystemLlmModels = [];			//当前编辑中的列表（含停用项）
var gSystemLlmOriginal = "[]";		//进页/上次保存后的列表 JSON 串（用于判定改动）
var gSystemLlmLegacy = "";			//上次保存后的运行期配置串（只读展示）
var gSystemLlmMaxModels = 20;
var gEditingSystemLlmIndex = -1;	//对话框正在编辑的行号（-1 = 新增）
var gEditingSystemLlmModelId = "";	//对话框正在编辑的模型 id（新增时为空）
var gLlmModelSettingsError = "";	//对话框里高级参数解析错误（由 systemLlmModelEdit.js 写入）

function showSystemLlm(){
	$.ajax({
		url : "/DocSystem/agent/config/llm-models",
		type : "get",
		dataType : "json",
		success : function (ret) {
			console.log("showSystemLlm() ret", ret);
			if(ret.success)
			{
				loadSystemLlmModels(ret.data);
			}
			else
			{
				showErrorMessage(_Lang("读取AI接入配置失败", " : ", ret.message || ""));
			}
		},
		error : function () {
			showErrorMessage(_Lang("读取AI接入配置失败", " : ", "服务器异常"));
		}
	});
}

function loadSystemLlmModels(data){
	gSystemLlmModels = (data && data.models) ? data.models : [];
	gSystemLlmLegacy = (data && data.legacy) ? data.legacy : "";
	if(data && data.maxModels)
	{
		gSystemLlmMaxModels = data.maxModels;
	}
	gSystemLlmOriginal = JSON.stringify(gSystemLlmModels);
	renderSystemLlmView();
}

//渲染列表
function renderSystemLlmView(){
	var models = [];
	for(var i=0; i<gSystemLlmModels.length; i++)
	{
		models.push($.extend({}, gSystemLlmModels[i]));
	}

	$Func.render($("#container"), "systemLlm" + langExt,
		{"value" : {"models" : models, "legacy" : gSystemLlmLegacy, "maxModels" : gSystemLlmMaxModels}},
		function(){ updateSystemLlmButtons(); });
}

function isSystemLlmDirty(){
	return JSON.stringify(gSystemLlmModels) != gSystemLlmOriginal;
}

//「保存/取消」默认置灰，仅在有改动时启用（与「调试日志」页同一门控口径）
function updateSystemLlmButtons(){
	var dirty = isSystemLlmDirty();
	$("#btnSaveSystemLlmSet").prop("disabled", !dirty);
	$("#btnCancelSystemLlmSet").prop("disabled", !dirty);
}

//------------- 校验（与后端 AgentLlmConfigStore.validate 同口径，先拦住再请求）-------------
function systemLlmHasSeparator(value){
	return value != null && (value.indexOf(";") >= 0 || value.indexOf("|") >= 0);
}

function validateSystemLlmModel(model, selfIndex){
	if(selfIndex == undefined)
	{
		selfIndex = gEditingSystemLlmIndex;	//对话框路径：跳过正在编辑的那一行
	}
	if(gLlmModelSettingsError != "")
	{
		return gLlmModelSettingsError;
	}
	if(model.name == "")
	{
		return _Lang("模型名称不能为空");
	}
	if(model.modelName == "")
	{
		return _Lang("模型标识不能为空");
	}
	if(model.endpoint == "")
	{
		return _Lang("接口地址不能为空");
	}
	if(model.endpoint.indexOf("http://") != 0 && model.endpoint.indexOf("https://") != 0)
	{
		return _Lang("接口地址需以http开头");
	}
	if(systemLlmHasSeparator(model.name) || systemLlmHasSeparator(model.modelName)
		|| systemLlmHasSeparator(model.endpoint) || systemLlmHasSeparator(model.apiKey))
	{
		return _Lang("配置值不能包含分号或竖线");
	}
	var settings = model.settings || {};
	for(var key in settings)
	{
		if(systemLlmHasSeparator(key) || systemLlmHasSeparator(settings[key]) || key.indexOf("=") >= 0)
		{
			return _Lang("高级参数不能包含分号竖线或等号");
		}
	}
	//重名检查（跳过自己）
	for(var i=0; i<gSystemLlmModels.length; i++)
	{
		if(i == selfIndex)
		{
			continue;
		}
		if(gSystemLlmModels[i].name == model.name)
		{
			return _Lang("模型名称已存在", " : ", model.name);
		}
	}
	return null;
}

//------------- 增删改查（都先改内存，最后点页面「保存」才落盘）-------------
function addSystemLlmModel(){
	if(gSystemLlmModels.length >= gSystemLlmMaxModels)
	{
		showErrorMessage(_Lang("最多支持的模型数", " : ", gSystemLlmMaxModels));
		return;
	}
	gEditingSystemLlmIndex = -1;
	gEditingSystemLlmModelId = "";
	showSystemLlmModelEditPanel(null);
}

function editSystemLlmModel(index){
	var model = gSystemLlmModels[index];
	if(model == null)
	{
		return;
	}
	gEditingSystemLlmIndex = index;
	gEditingSystemLlmModelId = model.id || "";
	showSystemLlmModelEditPanel(model);
}

function showSystemLlmModelEditPanel(model){
	qiao.bs.dialog({
		id: 'systemLlmModelEdit',
		url: 'systemLlmModelEdit' + langExt + '.html',
		title: (model == null) ? _Lang('新增模型') : _Lang('编辑模型'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: true,
		callback: function(){
			$("#systemLlmModelName").val(model == null ? "" : (model.name || ""));
			$("#systemLlmModelEndpoint").val(model == null ? "" : (model.endpoint || ""));
			$("#systemLlmModelModelName").val(model == null ? "" : (model.modelName || ""));
			//已保存的 API Key 直接回填（便于管理员核对原值）
			$("#systemLlmModelApiKey").val(model == null ? "" : (model.apiKey || ""));
			$("#systemLlmModelEnabled").prop("checked", model == null ? true : (model.enabled != false));

			var settings = (model == null || model.settings == null) ? {} : model.settings;
			var hasAdvanced = false;
			for(var key in settings)
			{
				hasAdvanced = true;
				break;
			}
			$("#systemLlmModelUseAdvanced").prop("checked", hasAdvanced);
			$("#systemLlmModelTemperature").val(settings["temperature"] || "");
			$("#systemLlmModelMaxTokens").val(settings["maxTokens"] || "");
			$("#systemLlmModelSettings").val(buildSystemLlmExtraSettingsText(settings));
			onToggleSystemLlmModelAdvanced();

			$("#systemLlmModelTestResult").empty();
			$("#systemLlmModelName").focus();
		}
	}, null);
}

function buildSystemLlmExtraSettingsText(settings){
	var lines = [];
	for(var key in settings)
	{
		if(key == "temperature" || key == "maxTokens")
		{
			continue;
		}
		lines.push(key + "=" + settings[key]);
	}
	return lines.join("\n");
}

//对话框「保存」回写内存（新增 = 追加；编辑 = 覆盖原行）
function applySystemLlmModelEditResult(model){
	var one = $.extend({}, model);
	one.apiKey = one.apiKey || "";

	if(gEditingSystemLlmIndex < 0)
	{
		gSystemLlmModels.push(one);
	}
	else
	{
		one.id = gSystemLlmModels[gEditingSystemLlmIndex].id;	//沿用原 id（对应 agent_config 里那条）
		gSystemLlmModels[gEditingSystemLlmIndex] = one;
	}
	renderSystemLlmView();
}

function deleteSystemLlmModel(index){
	var model = gSystemLlmModels[index];
	if(model == null)
	{
		return;
	}
	qiao.bs.confirm({
		id: "deleteSystemLlmModelConfirmDialog",
		title: _Lang("删除模型"),
		msg: _Lang("是否删除模型") + " [" + (model.name || model.modelName) + "] ？",
		okbtn: _Lang("确认"),
		qubtn: _Lang("取消"),
	}, function(){
		gSystemLlmModels.splice(index, 1);
		renderSystemLlmView();
		return true;	//close dialog
	}, function(){
		return true;	//close dialog
	});
}

function toggleSystemLlmModel(index){
	var model = gSystemLlmModels[index];
	if(model == null)
	{
		return;
	}
	model.enabled = (model.enabled == false);	//取反
	renderSystemLlmView();
}

//置顶：列表顺序即优先级，置顶后它就是第 1 个模型（若同时是第 1 个启用项，即为默认模型）
function moveSystemLlmModelToTop(index){
	if(index <= 0 || index >= gSystemLlmModels.length)
	{
		return;
	}
	var model = gSystemLlmModels[index];
	gSystemLlmModels.splice(index, 1);
	gSystemLlmModels.unshift(model);
	renderSystemLlmView();
}

//丢弃未保存的改动
function cancelSystemLlmSet(){
	gSystemLlmModels = JSON.parse(gSystemLlmOriginal);
	renderSystemLlmView();
}

function saveSystemLlmSet(){
	var data = [];
	for(var i=0; i<gSystemLlmModels.length; i++)
	{
		var model = gSystemLlmModels[i];
		var error = validateSystemLlmModel(model, i);
		if(error != null)
		{
			showErrorMessage(error);
			return;
		}

		var one = {
			id : model.id,
			name : model.name,
			modelName : model.modelName,
			endpoint : model.endpoint,
			apiKey : model.apiKey || "",
			enabled : (model.enabled != false),
			settings : model.settings || {}
		};
		data.push(one);
	}

	$("#btnSaveSystemLlmSet").prop("disabled", true);
	$.ajax({
		url : "/DocSystem/agent/config/llm-models",
		type : "post",
		contentType : "application/json",
		data : JSON.stringify({"models" : data}),
		dataType : "json",
		success : function (ret) {
			console.log("saveSystemLlmSet ret", ret);
			if(ret.success)
			{
				loadSystemLlmModels(ret.data);
				showErrorMessage(_Lang("AI接入配置已保存并生效"));
			}
			else
			{
				showErrorMessage(_Lang("保存AI接入配置失败", " : ", ret.message || ""));
				updateSystemLlmButtons();
			}
		},
		error : function () {
			showErrorMessage(_Lang("保存AI接入配置失败", " : ", "服务器异常"));
			updateSystemLlmButtons();
		}
	});
}

//------------- 测试连接 --------------
function sendSystemLlmModelTest(model, cb){
	$.ajax({
		url : "/DocSystem/agent/config/llm-models/test",
		type : "post",
		contentType : "application/json",
		data : JSON.stringify(model),
		dataType : "json",
		success : function (ret) {
			cb(ret);
		},
		error : function () {
			cb({"success" : false, "message" : _Lang("服务器异常")});
		}
	});
}

//列表行「测试」：只带 id/地址/标识，密钥由后端按 id 取已保存的明文
function testSystemLlmModel(index){
	var model = gSystemLlmModels[index];
	if(model == null)
	{
		return;
	}
	showErrorMessage(_Lang("正在测试模型", " : ", (model.name || model.modelName)));
	sendSystemLlmModelTest({
		id : model.id,
		name : model.name,
		modelName : model.modelName,
		endpoint : model.endpoint,
		apiKey : model.apiKey || "",
		enabled : true
	}, function(ret){
		showErrorMessage(buildSystemLlmModelTestHtml(ret));
	});
}

//对话框「测试连接」：用表单当前值（apiKey 留空时后端按 id 取已保存的密钥），结果写在弹窗里
function testSystemLlmModelObj(model, $result, $btn){
	if($result)
	{
		$result.html(_Lang("正在测试，请稍等..."));
	}
	if($btn)
	{
		$btn.attr("disabled", true);
	}
	sendSystemLlmModelTest(model, function(ret){
		if($btn)
		{
			$btn.attr("disabled", false);
		}
		if($result)
		{
			$result.html(buildSystemLlmModelTestHtml(ret));
		}
		else
		{
			showErrorMessage(buildSystemLlmModelTestHtml(ret));
		}
	});
}

function buildSystemLlmModelTestHtml(ret){
	var info = (ret.data && ret.data.info) ? ret.data.info : (ret.message || "");
	var color = ret.success ? "green" : "red";
	var title = ret.success ? _Lang("测试成功") : _Lang("测试失败");
	return "<font color='" + color + "'><strong>" + title + "</strong></font><br/><br/>" + info;
}

//集群部署设置（未启用集群时不保留两个地址，与原来「系统设置」页的行为一致）
var SYSTEM_CLUSTER_FIELDS = ["redisEn", "redisUrl", "clusterServerUrl"];

function showSystemCluster(){
	showSystemInfoPage("systemCluster", function(){
		if(systemInfo.redisEn == undefined)
		{
			systemInfo.redisEn = 0;
		}
		systemInfo.redisUrl = systemInfo.redisUrl || "";
		systemInfo.clusterServerUrl = systemInfo.clusterServerUrl || "";
		systemInfo.clusterInfo = systemInfo.clusterInfo || "";
	});
}

function enableSystemClusterSet(){
	console.log("enableSystemClusterSet systemInfo:", systemInfo);
	setSystemPageEditMode("SystemCluster", SYSTEM_CLUSTER_FIELDS, true);
	selectRedisEn();	//未勾选「启用」时两个地址仍保持禁用
}

function cancelSystemClusterSet(){
	$("#redisEn").prop("checked", systemInfo.redisEn == 1);
	$("#redisUrl").val(systemInfo.redisUrl);
	$("#clusterServerUrl").val(systemInfo.clusterServerUrl);
	setSystemPageEditMode("SystemCluster", SYSTEM_CLUSTER_FIELDS, false);
}

function saveSystemClusterSet(){
	var redisEn = $("#redisEn").is(':checked')? 1: 0;
	var redisUrl = "";
	var clusterServerUrl = "";
	if(redisEn == 1)
	{
		redisUrl = $("#redisUrl").val() || "";
		clusterServerUrl = $("#clusterServerUrl").val() || "";
	}
	setSystemPageEditMode("SystemCluster", SYSTEM_CLUSTER_FIELDS, false);
	postSystemInfo({ redisEn: redisEn, redisUrl: redisUrl, clusterServerUrl: clusterServerUrl }, showSystemCluster);
}

//Office编辑器（officeEditorApi / openOfficePath 是残留配置，系统已不再使用，不再提交）
var SYSTEM_OFFICE_FIELDS = ["isOnlyOfficeUsed", "officeAutoGenerateFonts"];

function showSystemOfficeEditor(){
	showSystemInfoPage("systemOfficeEditor", function(){
		if(systemInfo.isOnlyOfficeUsed == undefined)
		{
			systemInfo.isOnlyOfficeUsed = 0;
		}
		if(systemInfo.officeAutoGenerateFonts == undefined)
		{
			systemInfo.officeAutoGenerateFonts = 1;
		}
	}, function(){
		//渲染完成后才能取 DOM：刷新字体库状态（只读，生成中会自动轮询）
		refreshOfficeFontsStatus();
	});
}

function enableSystemOfficeEditorSet(){
	console.log("enableSystemOfficeEditorSet systemInfo:", systemInfo);
	setSystemPageEditMode("SystemOfficeEditor", SYSTEM_OFFICE_FIELDS, true);
}

function cancelSystemOfficeEditorSet(){
	//Office引擎改为下拉框：0=默认（系统自带转换器）、1=OnlyOffice
	$("#isOnlyOfficeUsed").val(systemInfo.isOnlyOfficeUsed == 1? 1: 0);
	$("#officeAutoGenerateFonts").val(systemInfo.officeAutoGenerateFonts == 0? 0: 1);
	setSystemPageEditMode("SystemOfficeEditor", SYSTEM_OFFICE_FIELDS, false);
}

function saveSystemOfficeEditorSet(){
	var isOnlyOfficeUsed = parseInt($("#isOnlyOfficeUsed").val(), 10) == 1? 1: 0;
	var officeAutoGenerateFonts = parseInt($("#officeAutoGenerateFonts").val(), 10) == 0? 0: 1;
	setSystemPageEditMode("SystemOfficeEditor", SYSTEM_OFFICE_FIELDS, false);
	postSystemInfo({ isOnlyOfficeUsed: isOnlyOfficeUsed, officeAutoGenerateFonts: officeAutoGenerateFonts }, showSystemOfficeEditor);
}

//字体库状态（只读展示，数据来自 /Bussiness/getOfficeFontsStatus.do；生成中时自动轮询刷新）
function refreshOfficeFontsStatus(){
	$.ajax({
		url : "/DocSystem/Bussiness/getOfficeFontsStatus.do",
		type : "post",
		dataType : "json",
		data : {},
		success : function (ret) {
			if("ok" != ret.status || ret.data == undefined)
			{
				$("#officeFontsStatus").text(_Lang("获取字体库状态失败", " : ", ret.msgInfo));
				return;
			}
			renderOfficeFontsStatus(ret.data);
		},
		error : function () {
			$("#officeFontsStatus").text(_Lang("获取字体库状态失败", " : ", "服务器异常"));
		}
	});
}

function renderOfficeFontsStatus(status){
	console.log("renderOfficeFontsStatus()", status);
	if(status.installed == false)
	{
		$("#officeFontsStatus").text(_Lang("未安装Office编辑器"));
		return;
	}
	if(status.ready == true)
	{
		$("#officeFontsStatus").text(_Lang("已就绪"));
		return;
	}
	if(status.generating == true)
	{
		$("#officeFontsStatus").text(_Lang("生成中（首次约 10-30 分钟），期间无法使用Office") + (status.taskInfo? "（" + status.taskInfo + "）" : ""));
		setTimeout(refreshOfficeFontsStatus, 15000);	//生成中：15秒后自动刷新状态
		return;
	}
	var msg = _Lang("缺失，需重新生成") + ": " + (status.missing? status.missing.join(", ") : "");
	if(status.autoEnabled == false)
	{
		msg += _Lang("；「字体库缺失时自动生成」已关闭，请手动重置字体库");
	}
	else if(status.autoFailed == true)
	{
		msg += _Lang("；自动生成已失败", status.lastError? ":" + status.lastError : "", "") + _Lang("，请手动重置字体库");
	}
	$("#officeFontsStatus").text(msg);
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

//（原 ldapTest() 已随「LDAP设置」改版移除：页面不再手工拼配置串，
//  改为「服务端渲染单台串（renderSystemLdapServer.do）→ 复用 ldapTest.do 做解析/登录测试」，
//  见上面的 sendSystemLdapServerTest / testSystemLdapServer / testSystemLdapServerObj）
//（原 llmTest() 已随「AI接入设置」改版移除：单模型测试走
//  /DocSystem/agent/config/llm-models/test，见上面的 testSystemLlmModel / testSystemLlmModelObj）

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
	           			// 切换到阶段2：系统即将重启，改为定时轮询 getSystemVersion 确认升级结果
	           			var oldVersion = $('#systemVersion').val() || "";
	           			startPollVersionAfterRestart(oldVersion, 5000); //5秒后开始查询
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
        	   	//queryLongTermTask请求失败(502/超时/连接拒绝等)，说明服务器已不可达。
        	   	//由于准备完成(status=200)后monitor.sh会立即重启服务器，存在"服务器已开始重启、
        	   	//但前端尚未轮询到status=200"的竞态，此时不能判为失败，应切到阶段2按版本轮询确认升级结果。
        	   	console.log("doQuerySystemUpgradePrepareTask() 服务器不可达，可能已开始重启，切换到版本轮询");
				var oldVersion = $('#systemVersion').val() || "";
				gStatus = 0;
				startPollVersionAfterRestart(oldVersion, 5000); //5秒后开始查询
            }
    	});
	}

	// ---- 阶段2：系统重启后定时轮询版本号，确认升级是否成功 ----
	// 系统重启期间后台接口返回不可靠(连接拒绝/404/超时等)，因此由前端定时器自己驱动查询，
	// 接口异常则继续等待，直到版本号发生变化(说明新系统已成功启动)
	var _upgradePollingTimer = null;

	function startPollVersionAfterRestart(oldVersion, delayTime)
	{
		console.log("startPollVersionAfterRestart() oldVersion:" + oldVersion + " delayTime:" + delayTime);
		var nextDelayTime = delayTime; //每次增加5s
		if(nextDelayTime < 60000) //最长1分钟
		{
			nextDelayTime += 5000;
		}

		_upgradePollingTimer = setTimeout(function () {
			console.log("timerForPollVersionAfterRestart triggered!");
			doPollVersionAfterRestart(oldVersion, nextDelayTime);
		}, delayTime);
	}

	function doPollVersionAfterRestart(oldVersion, nextDelayTime)
	{
		console.log("doPollVersionAfterRestart() oldVersion:" + oldVersion + " nextDelayTime:" + nextDelayTime);

		$.ajax({
			url : "/DocSystem/Manage/getSystemVersion.do",
			type : "post",
			dataType : "json",
			success : function (ret) {
				console.log("doPollVersionAfterRestart() ret:", ret);
				if("ok" == ret.status)
				{
					var newVersion = ret.data;
					if(newVersion != null && newVersion != "" && newVersion != oldVersion)
					{
						//版本号已变更，说明新系统已成功启动
						console.log("doPollVersionAfterRestart() 升级成功，新版本：" + newVersion);
						$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("升级成功！当前版本：") + newVersion);
						return;
					}
				}
				//版本号未变更(旧系统尚未停止)，继续等待
				$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("系统重启中，请稍候..."));
				startPollVersionAfterRestart(oldVersion, nextDelayTime);
			},
			error : function () {
				//系统重启中，接口暂时不可访问(连接拒绝/404/超时等)，继续等待
				console.log("doPollVersionAfterRestart() 系统重启中，接口暂不可用，继续等待...");
				$(".upload-list-title").text("[" + _Lang("系统升级") + "] " + _Lang("系统重启中，请稍候..."));
				startPollVersionAfterRestart(oldVersion, nextDelayTime);
			}
		});
	}
	// ---- 阶段2 end ----

	function stop(){
    	if (_upgradePollingTimer != null) {
    		clearTimeout(_upgradePollingTimer);
    		_upgradePollingTimer = null;
    	}
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
var systemLogStartTime = 0;
var systemLogEndTime = 0;
var systemLogActiveRange = "today";

function clearSystemLogQuickButtons() {
    systemLogActiveRange = "custom";
    $("#systemLog-btn-today, #systemLog-btn-yesterday, #systemLog-btn-last7days, #systemLog-btn-last30days").removeClass("btn-primary").addClass("btn-default");
}

function highlightSystemLogButton() {
    //模板渲染后恢复按钮高亮和日期值
    $("#systemLog-btn-today, #systemLog-btn-yesterday, #systemLog-btn-last7days, #systemLog-btn-last30days").removeClass("btn-primary").addClass("btn-default");
    if(systemLogActiveRange != "custom") {
        $("#systemLog-btn-" + systemLogActiveRange).removeClass("btn-default").addClass("btn-primary");
    }
    //恢复日期输入框的值（模板渲染会清空）
    $("#systemLogStartDate").val(formatDateStr(new Date(systemLogStartTime)));
    $("#systemLogEndDate").val(formatDateStr(new Date(systemLogEndTime)));
    //恢复搜索关键字（模板渲染会清空）
    $("#search-systemLog").val(systemLogSearchWord);
}

function initSystemLogTimeRange() {
    setSystemLogTimeRange("today");
}

function setSystemLogTimeRange(range) {
    systemLogActiveRange = range;
    var now = new Date();
    var startDate, endDate;

    //先高亮按钮（渲染前），渲染后 SystemLogListDisplay 会重新调 highlightSystemLogButton
    highlightSystemLogButton();

    switch(range) {
        case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "yesterday":
            var yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
            endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
            break;
        case "last7days":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "last30days":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "custom":
            var startStr = $("#systemLogStartDate").val();
            var endStr = $("#systemLogEndDate").val();
            if(!startStr || !endStr) {
                showErrorMessage(_Lang("请选择开始和结束日期"));
                return;
            }
            startDate = new Date(startStr + "T00:00:00");
            endDate = new Date(endStr + "T23:59:59");
            break;
        default:
            return;
    }
    systemLogStartTime = startDate.getTime();
    systemLogEndTime = endDate.getTime();

    $("#systemLogStartDate").val(formatDateStr(startDate));
    $("#systemLogEndDate").val(formatDateStr(endDate));

    showSystemLogList();
}

function searchSystemLog()
{
	systemLogSearchWord = $("#search-systemLog").val();

	//检查是否修改了自定义日期
	var startStr = $("#systemLogStartDate").val();
	var endStr = $("#systemLogEndDate").val();
	var hasStart = (startStr && startStr.length > 0);
	var hasEnd = (endStr && endStr.length > 0);

	if(hasStart || hasEnd)
	{
		//只要动了日期输入框，必须开始和结束日期都指定
		if(!hasStart || !hasEnd)
		{
			showErrorMessage(_Lang("请选择开始和结束日期"));
			return;
		}
		var newStart = new Date(startStr + "T00:00:00").getTime();
		var newEnd = new Date(endStr + "T23:59:59").getTime();
		if(newStart != systemLogStartTime || newEnd != systemLogEndTime)
		{
			systemLogStartTime = newStart;
			systemLogEndTime = newEnd;
			systemLogActiveRange = "custom";
		}
	}
	showSystemLogList();
}

//导出操作日志：按当前筛选条件（时间范围 + 关键字）导出**全量** CSV
//服务端流式生成（不构造大 JSON），前端按 Content-Type 区分「文件」与「错误提示」
function exportSystemLog(){
	var $btn = $("#btnExportSystemLog");
	if($btn.length > 0){ $btn.attr("disabled", true); }

	var body = "startTime=" + encodeURIComponent(systemLogStartTime)
		+ "&endTime=" + encodeURIComponent(systemLogEndTime)
		+ "&searchWord=" + encodeURIComponent(systemLogSearchWord == null ? "" : systemLogSearchWord)
		+ "&lang=" + encodeURIComponent((langExt == "_en") ? "en" : "ch");

	showErrorMessage(_Lang("正在导出，请稍等..."));

	fetch("/DocSystem/Manage/exportSystemLogList.do", {
		method : "post",
		headers : {
			"Content-Type" : "application/x-www-form-urlencoded",
			//与 jQuery ajax 保持一致：MyInterceptor 对「非 ajax 且未登录」的请求会 302 到 tologin.do
			"X-Requested-With" : "XMLHttpRequest"
		},
		body : body,
		credentials : "same-origin"
	}).then(function(res){
		var contentType = res.headers.get("Content-Type") || "";
		if(contentType.indexOf("text/csv") < 0){
			//非 CSV = 服务端拒绝（空结果/超上限/未登录）：尽量把错误文案展示出来
			return res.text().then(function(text){
				var msg = text || "";
				try {
					var ret = JSON.parse(msg);
					if(ret && ret.msgInfo){ msg = ret.msgInfo; }
				} catch(e) {
					if(msg.indexOf("<") == 0){
						msg = "登录状态可能已失效，请重新登录后再试";
					}
				}
				showErrorMessage(_Lang("导出失败", " : ", msg));
			});
		}
		var fileName = "SystemLog.csv";
		var disposition = res.headers.get("Content-Disposition") || "";
		var match = disposition.match(/filename="?([^";]+)"?/);
		if(match && match[1]){
			fileName = match[1];
		}
		return res.blob().then(function(blob){
			downloadBlobAsFile(blob, fileName);
			showErrorMessage(_Lang("导出成功"));
		});
	}).catch(function(){
		showErrorMessage(_Lang("导出失败", " : ", "服务器异常"));
	}).then(function(){
		if($btn.length > 0){ $btn.attr("disabled", false); }
	});
}

//用 Blob 触发浏览器保存（与「系统参数导出」同一套路）
function downloadBlobAsFile(blob, fileName){
	var url = URL.createObjectURL(blob);
	var a = document.createElement("a");
	a.href = url;
	a.download = fileName;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function showSystemLogList(pageIndex){
	var pageSize = gPageSize;
	pageIndex = pageIndex ? pageIndex : 0;
	gPageIndex = pageIndex;

	$.ajax({
        url : "/DocSystem/Manage/getSystemLogList.do",
        type : "post",
        dataType : "json",
        data : {
            searchWord: systemLogSearchWord,
            startTime: systemLogStartTime,
            endTime: systemLogEndTime,
        	pageIndex: pageIndex,
        	pageSize: pageSize
        },
        success : function (ret) {
        	console.log("querySystemLog ret",ret);
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
    $Func.render($("#container"),"systemLog" + langExt,{"list":list}, function(){
        highlightSystemLogButton();
        if(callback) callback();
    });
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

// --- 用户使用统计 ---
var usageStatsStartTime = 0;
var usageStatsEndTime = 0;
var usageStatsActiveRange = "today";

function clearUsageStatsQuickButtons() {
    usageStatsActiveRange = "custom";
    $("#btn-today, #btn-yesterday, #btn-last7days, #btn-last30days").removeClass("btn-primary").addClass("btn-default");
}

function highlightUsageStatsButton() {
    //模板渲染后恢复按钮高亮和日期值
    $("#btn-today, #btn-yesterday, #btn-last7days, #btn-last30days").removeClass("btn-primary").addClass("btn-default");
    if(usageStatsActiveRange != "custom") {
        $("#btn-" + usageStatsActiveRange).removeClass("btn-default").addClass("btn-primary");
    }
    //恢复日期输入框的值（模板渲染会清空）
    $("#usageStatsStartDate").val(formatDateStr(new Date(usageStatsStartTime)));
    $("#usageStatsEndDate").val(formatDateStr(new Date(usageStatsEndTime)));
}

function initUsageStatsTimeRange() {
    setUsageStatsTimeRange("today");
}

function setUsageStatsTimeRange(range) {
    usageStatsActiveRange = range;
    highlightUsageStatsButton();

    var now = new Date();
    var startDate, endDate;

    switch(range) {
        case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "yesterday":
            var yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
            endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
            break;
        case "last7days":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "last30days":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "custom":
            var startStr = $("#usageStatsStartDate").val();
            var endStr = $("#usageStatsEndDate").val();
            if(!startStr || !endStr) {
                showErrorMessage(_Lang("请选择开始和结束日期"));
                return;
            }
            startDate = new Date(startStr + "T00:00:00");
            endDate = new Date(endStr + "T23:59:59");
            break;
        default:
            return;
    }
    usageStatsStartTime = startDate.getTime();
    usageStatsEndTime = endDate.getTime();

    $("#usageStatsStartDate").val(formatDateStr(startDate));
    $("#usageStatsEndDate").val(formatDateStr(endDate));

    queryUserUsageStats();
}

function formatDateStr(date) {
    return date.getFullYear() + "-"
        + ("0" + (date.getMonth() + 1)).slice(-2) + "-"
        + ("0" + date.getDate()).slice(-2);
}

function queryUserUsageStats() {
    console.log("queryUserUsageStats startTime:" + usageStatsStartTime + " endTime:" + usageStatsEndTime);
    $("#container").html(_Lang("载入中..."));

    $.ajax({
        url : "/DocSystem/Doc/queryUserUsageStats.do",
        type : "post",
        dataType : "json",
        data : {
            startTime: usageStatsStartTime,
            endTime: usageStatsEndTime
        },
        success : function (ret) {
            console.log("queryUserUsageStats ret", ret);
            if("ok" == ret.status) {
                var list = ret.data || [];
                for(var i = 0; i < list.length; i++) {
                    list[i].formatedDuration = formatDuration(list[i].loginDuration);
                }
                $Func.render($("#container"), "userUsageStats" + langExt, {"list": list}, function(){
                    highlightUsageStatsButton();
                });
            } else {
                showErrorMessage(_Lang("查询失败", ":", ret.msgInfo));
                $Func.render($("#container"), "userUsageStats" + langExt, {"list": []});
            }
        },
        error : function () {
            showErrorMessage(_Lang("查询失败", ":", "服务器异常"));
            $Func.render($("#container"), "userUsageStats" + langExt, {"list": []});
        }
    });
}

function formatDuration(millis) {
    if(!millis || millis <= 0) return "0:00:00";
    var totalSeconds = Math.floor(millis / 1000);
    var hours = Math.floor(totalSeconds / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    return hours + ":" + ("0" + minutes).slice(-2) + ":" + ("0" + seconds).slice(-2);
}

var orderSearchWord = "";
//订单管理：时间范围筛选（默认近1年，与服务端原默认窗口一致）
var orderStartTime = 0;
var orderEndTime = 0;
var orderActiveRange = "last1year";

function clearOrderQuickButtons() {
    orderActiveRange = "custom";
    $("#order-btn-last30days, #order-btn-last1year, #order-btn-last3years, #order-btn-all").removeClass("btn-primary").addClass("btn-default");
}

function highlightOrderButton() {
    //模板渲染后恢复按钮高亮和日期值
    $("#order-btn-last30days, #order-btn-last1year, #order-btn-last3years, #order-btn-all").removeClass("btn-primary").addClass("btn-default");
    if(orderActiveRange != "custom") {
        $("#order-btn-" + orderActiveRange).removeClass("btn-default").addClass("btn-primary");
    }
    if(orderActiveRange == "all") {
        //「全部」不显示具体日期，避免出现 1970-01-01
        $("#orderStartDate").val("");
        $("#orderEndDate").val("");
    } else {
        $("#orderStartDate").val(formatDateStr(new Date(orderStartTime)));
        $("#orderEndDate").val(formatDateStr(new Date(orderEndTime)));
    }
    $("#search-order").val(orderSearchWord);
}

function initOrderTimeRange() {
    setOrderTimeRange("last1year");
}

function setOrderTimeRange(range) {
    orderActiveRange = range;
    var now = new Date();
    var startDate, endDate;

    //先高亮（渲染前），渲染后 OrderListDisplay 会重新调 highlightOrderButton
    highlightOrderButton();

    switch(range) {
        case "last30days":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "last1year":
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "last3years":
            startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "all":
            //startTime=0 = 不限制起始时间（服务端只在参数为 null 时才用默认窗口）
            startDate = new Date(0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "custom":
            var startStr = $("#orderStartDate").val();
            var endStr = $("#orderEndDate").val();
            if(!startStr || !endStr) {
                showErrorMessage(_Lang("请选择开始和结束日期"));
                return;
            }
            startDate = new Date(startStr + "T00:00:00");
            endDate = new Date(endStr + "T23:59:59");
            break;
        default:
            return;
    }
    orderStartTime = startDate.getTime();
    orderEndTime = endDate.getTime();

    highlightOrderButton();
    showOrderList();
}

function searchOrder()
{
	orderSearchWord = $("#search-order").val();

	//检查是否修改了自定义日期（「全部」时日期框为空，保持不变）
	var startStr = $("#orderStartDate").val();
	var endStr = $("#orderEndDate").val();
	var hasStart = (startStr && startStr.length > 0);
	var hasEnd = (endStr && endStr.length > 0);
	if(hasStart || hasEnd)
	{
		//只要动了日期输入框，必须开始和结束日期都指定
		if(!hasStart || !hasEnd)
		{
			showErrorMessage(_Lang("请选择开始和结束日期"));
			return;
		}
		var newStart = new Date(startStr + "T00:00:00").getTime();
		var newEnd = new Date(endStr + "T23:59:59").getTime();
		if(newStart != orderStartTime || newEnd != orderEndTime)
		{
			orderStartTime = newStart;
			orderEndTime = newEnd;
			orderActiveRange = "custom";
		}
	}
	showOrderList();
}
function showOrderList(pageIndex){
	var pageSize = gPageSize;
	pageIndex = pageIndex ? pageIndex : 0;
	gPageIndex = pageIndex;

	//时间范围未初始化时不传（服务端用默认窗口）；「全部」时 startTime=0 是有效值
	var data = {
        searchWord: orderSearchWord,
    	pageIndex: pageIndex,
    	pageSize: pageSize
	};
	if(orderEndTime > 0) {
		data.startTime = orderStartTime;
		data.endTime = orderEndTime;
	}

	$.ajax({
        url : "/DocSystem/pay/getOrderList.do",
        type : "post",
        dataType : "json",
        data : data,
        success : function (ret) {
        	console.log("getOrderList ret",ret);
            if( "ok" == ret.status )
            {
            	OrderListDisplay(ret.data || [], pageIndex, pageSize, function(){

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
	$Func.render($("#container"),"order" + langExt,{"list":list}, function(){
		highlightOrderButton();		//模板渲染会清空筛选控件状态，渲染后恢复
		if(callback) callback();
	});
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
//证书管理：时间范围筛选（默认近3年，与服务端原默认窗口一致）
var licenseStartTime = 0;
var licenseEndTime = 0;
var licenseActiveRange = "last3years";

function clearLicenseQuickButtons() {
    licenseActiveRange = "custom";
    $("#license-btn-last30days, #license-btn-last1year, #license-btn-last3years, #license-btn-all").removeClass("btn-primary").addClass("btn-default");
}

function highlightLicenseButton() {
    //模板渲染后恢复按钮高亮和日期值
    $("#license-btn-last30days, #license-btn-last1year, #license-btn-last3years, #license-btn-all").removeClass("btn-primary").addClass("btn-default");
    if(licenseActiveRange != "custom") {
        $("#license-btn-" + licenseActiveRange).removeClass("btn-default").addClass("btn-primary");
    }
    if(licenseActiveRange == "all") {
        //「全部」不显示具体日期，避免出现 1970-01-01
        $("#licenseStartDate").val("");
        $("#licenseEndDate").val("");
    } else {
        $("#licenseStartDate").val(formatDateStr(new Date(licenseStartTime)));
        $("#licenseEndDate").val(formatDateStr(new Date(licenseEndTime)));
    }
    $("#search-license").val(licenseSearchWord);
}

function initLicenseTimeRange() {
    setLicenseTimeRange("last3years");
}

function setLicenseTimeRange(range) {
    licenseActiveRange = range;
    var now = new Date();
    var startDate, endDate;

    //先高亮（渲染前），渲染后 LicenseListDisplay 会重新调 highlightLicenseButton
    highlightLicenseButton();

    switch(range) {
        case "last30days":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "last1year":
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "last3years":
            startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate(), 0, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "all":
            //startTime=0 = 不限制起始时间（服务端只在参数为 null 时才用默认窗口）
            startDate = new Date(0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            break;
        case "custom":
            var startStr = $("#licenseStartDate").val();
            var endStr = $("#licenseEndDate").val();
            if(!startStr || !endStr) {
                showErrorMessage(_Lang("请选择开始和结束日期"));
                return;
            }
            startDate = new Date(startStr + "T00:00:00");
            endDate = new Date(endStr + "T23:59:59");
            break;
        default:
            return;
    }
    licenseStartTime = startDate.getTime();
    licenseEndTime = endDate.getTime();

    highlightLicenseButton();
    showLicenseList();
}

function searchLicense()
{
	licenseSearchWord = $("#search-license").val();

	//检查是否修改了自定义日期（「全部」时日期框为空，保持不变）
	var startStr = $("#licenseStartDate").val();
	var endStr = $("#licenseEndDate").val();
	var hasStart = (startStr && startStr.length > 0);
	var hasEnd = (endStr && endStr.length > 0);
	if(hasStart || hasEnd)
	{
		//只要动了日期输入框，必须开始和结束日期都指定
		if(!hasStart || !hasEnd)
		{
			showErrorMessage(_Lang("请选择开始和结束日期"));
			return;
		}
		var newStart = new Date(startStr + "T00:00:00").getTime();
		var newEnd = new Date(endStr + "T23:59:59").getTime();
		if(newStart != licenseStartTime || newEnd != licenseEndTime)
		{
			licenseStartTime = newStart;
			licenseEndTime = newEnd;
			licenseActiveRange = "custom";
		}
	}
	showLicenseList();
}

function showLicenseList(pageIndex){
	
	var pageSize = gPageSize;
	pageIndex = pageIndex ? pageIndex : 0;
	gPageIndex = pageIndex;
	
	//时间范围未初始化时不传（服务端用默认窗口）；「全部」时 startTime=0 是有效值
	var data = {
        searchWord: licenseSearchWord,
    	pageIndex: pageIndex,
    	pageSize: pageSize
	};
	if(licenseEndTime > 0) {
		data.startTime = licenseStartTime;
		data.endTime = licenseEndTime;
	}

	$.ajax({
        url : "/DocSystem/Sales/getLicenseList.do",
        type : "post",
        dataType : "json",
        data : data,
        success : function (ret) {
        	console.log("getLicenseList ret",ret);
            if( "ok" == ret.status )
            {
            	LicenseListDisplay(ret.data || [], pageIndex, pageSize, function(){

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
	$Func.render($("#container"),"license" + langExt,{"list":list}, function(){
		highlightLicenseButton();		//模板渲染会清空筛选控件状态，渲染后恢复
		if(callback) callback();
	});
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
var userSortField = "id";	//排序字段：id / name（服务端白名单，非法值回落默认）
var userSortOrder = "desc";	//排序方向：asc / desc

//表头排序箭头（表头在 tmpl 里，列表每次重渲染都会重建 → 渲染回调里回填）
function updateUserSortUi()
{
	$("#th-userId .user-sort-arrow, #th-userName .user-sort-arrow").html("");
	var thId = (userSortField == "name") ? "#th-userName" : "#th-userId";
	var icon = (userSortOrder == "asc") ? "icon-chevron-up" : "icon-chevron-down";
	$(thId + " .user-sort-arrow").html('<i class="' + icon + '"></i>');
}

//点击表头排序：同列再点反向；切到新列时用该列的默认方向（用户ID降序=最近创建在前、用户名升序），回到第一页重新查询
function changeUserSort(field)
{
	if(userSortField == field)
	{
		userSortOrder = (userSortOrder == "asc") ? "desc" : "asc";
	}
	else
	{
		userSortField = (field == "name") ? "name" : "id";
		userSortOrder = (userSortField == "name") ? "asc" : "desc";
	}
	console.log("changeUserSort " + userSortField + " " + userSortOrder);
	showUserList();
}

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
            // 排序条件（服务端白名单校验）
            sortField: userSortField,
            sortOrder: userSortOrder,
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
	$Func.render($("#container"),"user" + langExt,{"list":list}, function(){
		updateUserSortUi();	//tmpl 重渲染后回填排序下拉
		if(callback) callback();
	});
}

//导出用户：弹窗选格式（CSV / Excel），实际导出逻辑在 exportUser.js（随弹窗加载）
function showExportUserPanel()
{
	console.log("showExportUserPanel userSearchWord:" + userSearchWord);
	qiao.bs.dialog({
		id: 'exportUser',
		url: 'exportUser' + langExt + '.html',
		title: _Lang('导出用户'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false
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

//批量导入用户（对话框里的逻辑在 importUser.js）
function showImportUserPanel(){
	console.log("showImportUserPanel");
	gImportUserFileName = "";
	qiao.bs.dialog({
		id: 'importUser',
		url: 'importUser' + langExt + '.html',
		title: _Lang('批量导入用户'),
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
function showEditUserNetworkSettingsPanel(e, userId, pageIndex, index)
{
	console.log("showEditUserNetworkSettingsPanel() userId:" + userId + " pageIndex:" + pageIndex);
	gPageIndex = pageIndex;
	
	var Obj = e.target;
	var trObj =  $(e.target).parent().parent();
	var name = trObj.children("td:eq(2)").text();
	var networkSettings = trObj.children("td:eq(8)").text();
	
	qiao.bs.dialog({
		url: 'editUserNetworkSettings' + langExt + '.html',
		title: _Lang('网络限制'),
		msg: _Lang('页面正在加载，请稍等...'),
		foot: false,
		big: false,
		callback: function(){
			console.log("page loaded callback");
			//Page Value Init
			$("#userId").val(userId);
			$("#name").val(name);
			$("#networkSettings").val(networkSettings);
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
	var checkboxHtml = '<br/><div style="margin-top:12px;"><label style="font-weight:normal;font-size:14px;"><input type="checkbox" id="chkDeleteReposData" style="margin-right:6px;">' + _Lang("同时删除仓库数据（删除后无法恢复）") + '</label></div>';
	qiao.bs.confirm({
		id: "delReposConfirmDialog",
        title: _Lang("删除仓库"),
        msg: _Lang("确认删除仓库？仓库记录将从系统中移除。") + checkboxHtml,
        okbtn: _Lang("删除"),
        qubtn: _Lang("取消"),
    },function () {
    	var deleteData = $("#chkDeleteReposData").is(":checked") ? 1 : 0;
    	delRepos(id, deleteData);
    	return true;
    });
}

function delRepos(reposId, deleteData){
    $.ajax({
        url : "/DocSystem/Repos/deleteRepos.do",
        type : "post",
        dataType : "json",
        data : {
             vid : reposId,
             deleteData : deleteData || 0,
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