//首页导航栏"在线升级"按键：仅超级管理员（type==2）可见
//三态：隐藏（非超管/无新版/升级完成）/ "升级(x.y.z)"（GitHub 检测到新版本）/ "系统升级中..."（升级任务运行中或 monitor 重启中）
//升级执行走后端 onlineUpgrade.do：GitHub 下载 war 后与后台上传 war 升级完全相同的流程（executeWarUpgrade）
//升级中状态跨刷新/重开：页面加载时先查 getUpgradeTask.do 恢复显示；服务重启期间接口失败按"仍升级中"保持
var OnlineUpgrade = {
	user: null,
	state: "hidden",	//hidden | available | upgrading
	version: null,		//检测到的新版本号
	size: null,			//新版本 war 大小（字节）
	taskId: null,		//升级任务 id（getUpgradeTask/onlineUpgrade 返回）
	timer: null,		//轮询定时器
};

//index.js pageInit 登录成功后的入口钩子（非超管传 undefined 也可，用于复位）
function OnlineUpgradeEntry(user)
{
	console.log("OnlineUpgradeEntry user:", user);
	if(user && user.type == 2)
	{
		OnlineUpgrade.user = user;
		OnlineUpgrade.detect();	//先判"升级中"（跨刷新恢复），再判新版本
	}
	else
	{
		OnlineUpgrade.reset();
	}
}

OnlineUpgrade.lang = function(key, fallback)
{
	if(typeof OnlineUpgradeLang != "undefined" && OnlineUpgradeLang[key] != null && OnlineUpgradeLang[key] != "")
	{
		return OnlineUpgradeLang[key];
	}
	return fallback;
};

OnlineUpgrade.reset = function()
{
	OnlineUpgrade.user = null;
	OnlineUpgrade.state = "hidden";
	OnlineUpgrade.version = null;
	OnlineUpgrade.size = null;
	OnlineUpgrade.taskId = null;
	OnlineUpgrade.stopTimer();
	$("#onlineUpgradeBtn").hide();
	$("#mobileOnlineUpgradeBtn").hide();
};

OnlineUpgrade.stopTimer = function()
{
	if(OnlineUpgrade.timer != null)
	{
		clearTimeout(OnlineUpgrade.timer);
		OnlineUpgrade.timer = null;
	}
};

//页面加载/失败重判：先查升级中，再查新版本
OnlineUpgrade.detect = function()
{
	$.ajax({
		url: "/DocSystem/Manage/getUpgradeTask.do",
		type: "post",
		dataType: "json",
		timeout: 30000,
		data: {},
		success: function(ret) {
			if("ok" == ret.status && ret.data && ret.data.upgrading)
			{
				//升级中（下载/解压/裁剪 或 monitor 重启）：恢复"系统升级中..."并继续轮询
				OnlineUpgrade.setUpgrading(ret.data.taskId);
				return;
			}
			OnlineUpgrade.checkVersion();
		},
		error: function() {
			//初始查询失败：静默不显示（下次刷新页面再试）
			OnlineUpgrade.reset();
		}
	});
};

//检测 GitHub 新版本（后端缓存 10 分钟），有新版才显示"升级(x.y.z)"
OnlineUpgrade.checkVersion = function()
{
	$.ajax({
		url: "/DocSystem/Manage/checkSystemUpgrade.do",
		type: "post",
		dataType: "json",
		timeout: 60000,
		data: {},
		success: function(ret) {
			if("ok" == ret.status && ret.data && ret.data.hasNewVersion)
			{
				OnlineUpgrade.state = "available";
				OnlineUpgrade.version = ret.data.newVersion;
				OnlineUpgrade.size = ret.data.downloadSize;
				var text = OnlineUpgrade.lang("upgrade", "升级") + "(" + OnlineUpgrade.version + ")";
				$("#onlineUpgradeBtn a").text(text).attr("title", text);
				$("#mobileOnlineUpgradeBtn a").text(text).attr("title", text);
				$("#onlineUpgradeBtn").show();
				$("#mobileOnlineUpgradeBtn").show();
				return;
			}
			//无新版/非超管被拒/GitHub 不可达：不显示
			OnlineUpgrade.reset();
		},
		error: function() {
			OnlineUpgrade.reset();
		}
	});
};

//点击"升级"按键：确认框（版本/大小/自动重启提示）→ onlineUpgrade.do
OnlineUpgrade.start = function()
{
	console.log("OnlineUpgrade.start state:" + OnlineUpgrade.state);
	if(OnlineUpgrade.state == "upgrading")
	{
		return;	//防重入
	}
	if(OnlineUpgrade.state != "available")
	{
		return;
	}

	//大小仅 GitHub 检测源可知（Gitee 只有版本号），未知时不显示大小片段
	var sizePart = (OnlineUpgrade.size != null)
		? OnlineUpgrade.lang("sizePart", "（大小 {size}）").replace("{size}", OnlineUpgrade.formatSize(OnlineUpgrade.size))
		: "";
	var msg = OnlineUpgrade.lang("confirmMsg", "检测到新版本 {version}{sizePart}，是否升级系统？<br><br><strong>升级过程中系统将自动重启，请勿关闭页面。</strong>");
	msg = msg.replace("{version}", OnlineUpgrade.version || "").replace("{sizePart}", sizePart);

	qiao.bs.confirm({
		id: "onlineUpgradeConfirmDialog",
		title: OnlineUpgrade.lang("confirmTitle", "系统升级"),
		msg: msg,
		okbtn: OnlineUpgrade.lang("ok", "确认"),
		qubtn: OnlineUpgrade.lang("cancel", "取消"),
	}, function() {
		OnlineUpgrade.begin();
		return true;	//close dialog
	}, function() {
		return true;	//close dialog
	});
};

OnlineUpgrade.begin = function()
{
	$.ajax({
		url: "/DocSystem/Manage/onlineUpgrade.do",
		type: "post",
		dataType: "json",
		timeout: 60000,
		data: {},
		success: function(ret) {
			if("ok" == ret.status && ret.data)
			{
				var task = ret.data;
				OnlineUpgrade.setUpgrading(task.id);
				return;
			}
			showErrorMessage({
				id: "idAlertDialog",
				title: OnlineUpgrade.lang("confirmTitle", "系统升级"),
				okbtn: OnlineUpgrade.lang("ok", "确定"),
				msg: OnlineUpgrade.lang("upgradeFailed", "在线升级失败") + " : " + (ret.msgInfo || ""),
			});
		},
		error: function() {
			showErrorMessage({
				id: "idAlertDialog",
				title: OnlineUpgrade.lang("confirmTitle", "系统升级"),
				okbtn: OnlineUpgrade.lang("ok", "确定"),
				msg: OnlineUpgrade.lang("serverError", "服务器异常"),
			});
		}
	});
};

//切"系统升级中..."：有 taskId 时轮询 queryLongTermTask 展示进度，否则轮询 getUpgradeTask 等待结束
OnlineUpgrade.setUpgrading = function(taskId)
{
	OnlineUpgrade.state = "upgrading";
	OnlineUpgrade.taskId = taskId || null;
	var text = OnlineUpgrade.lang("upgrading", "系统升级中...");
	$("#onlineUpgradeBtn a").text(text).attr("title", text);
	$("#mobileOnlineUpgradeBtn a").text(text).attr("title", text);
	$("#onlineUpgradeBtn").show();
	$("#mobileOnlineUpgradeBtn").show();

	OnlineUpgrade.stopTimer();
	if(OnlineUpgrade.taskId)
	{
		OnlineUpgrade.pollTask(OnlineUpgrade.taskId, 3000);
	}
	else
	{
		OnlineUpgrade.pollState(10000);
	}
};

//轮询升级任务进度（下载 xxMB → 解压 → 裁剪 → 创建升级任务）
OnlineUpgrade.pollTask = function(taskId, delayTime)
{
	OnlineUpgrade.stopTimer();
	OnlineUpgrade.timer = setTimeout(function() {
		$.ajax({
			url: "/DocSystem/Manage/queryLongTermTask.do",
			type: "post",
			dataType: "json",
			timeout: 30000,
			data: {
				taskId: taskId,
			},
			success: function(ret) {
				console.log("OnlineUpgrade.pollTask ret:", ret);
				if("ok" != ret.status)
				{
					//任务已从内存删除（200 后 2 分钟延时删除）：转 getUpgradeTask 判定（trigger/monitor 阶段）
					OnlineUpgrade.pollState(5000);
					return;
				}
				var task = ret.data;
				if(task.status == 200)
				{
					//准备工作完成，upgrade.trigger 已创建，交给 monitor（服务即将重启）：转状态轮询
					OnlineUpgrade.pollState(10000);
					return;
				}
				if(task.status != null && task.status < 0)
				{
					//任务失败：提示后重判版本（失败可重试）
					showErrorMessage({
						id: "idAlertDialog",
						title: OnlineUpgrade.lang("confirmTitle", "系统升级"),
						okbtn: OnlineUpgrade.lang("ok", "确定"),
						msg: OnlineUpgrade.lang("upgradeFailed", "在线升级失败") + " : " + (task.info || ""),
					});
					OnlineUpgrade.detect();
					return;
				}
				//进行中：进度写到按键 title（悬停可见）
				var text = OnlineUpgrade.lang("upgrading", "系统升级中...");
				$("#onlineUpgradeBtn a").attr("title", task.info || text);
				$("#mobileOnlineUpgradeBtn a").attr("title", task.info || text);
				var nextDelayTime = delayTime < 10000 ? delayTime + 2000 : 10000;
				OnlineUpgrade.pollTask(taskId, nextDelayTime);
			},
			error: function() {
				//接口失败：可能 monitor 阶段服务重启中，按"仍升级中"保持，恢复后按 getUpgradeTask 重判
				OnlineUpgrade.pollState(10000);
			}
		});
	}, delayTime);
};

//轮询升级中状态（monitor 重启阶段/任务已被删除后）：结束则重判版本（成功后版本已更新 → 按键消失）
OnlineUpgrade.pollState = function(delayTime)
{
	OnlineUpgrade.stopTimer();
	OnlineUpgrade.timer = setTimeout(function() {
		$.ajax({
			url: "/DocSystem/Manage/getUpgradeTask.do",
			type: "post",
			dataType: "json",
			timeout: 30000,
			data: {},
			success: function(ret) {
				console.log("OnlineUpgrade.pollState ret:", ret);
				if("ok" == ret.status && ret.data && ret.data.upgrading)
				{
					//仍在升级中（prepare 阶段且带 taskId 时切回任务轮询以展示进度）
					if(ret.data.phase == "prepare" && ret.data.taskId)
					{
						OnlineUpgrade.pollTask(ret.data.taskId, 3000);
						return;
					}
					OnlineUpgrade.pollState(10000);
					return;
				}
				//升级结束：重判（成功 → 无新版隐藏；异常 → 可能恢复"升级"按键）
				OnlineUpgrade.detect();
			},
			error: function() {
				//服务重启中接口不可用：保持升级中状态继续等
				OnlineUpgrade.pollState(10000);
			}
		});
	}, delayTime);
};

OnlineUpgrade.formatSize = function(bytes)
{
	if(bytes == null || bytes < 0) return "";
	if(bytes < 1024) return bytes + "B";
	if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
	if(bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + "MB";
	return (bytes / 1024 / 1024 / 1024).toFixed(2) + "GB";
};
