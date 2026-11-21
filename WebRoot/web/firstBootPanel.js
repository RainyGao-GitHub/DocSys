//首启启动方式选择面板：needAddFirstAdmin 且本机存在可恢复备份时显示（全新启动 / 从已有数据恢复）
//恢复成功刷新页面进入登录；失败可重新选择（换备份或改走全新启动）
var FirstBootPanel = {
	active: false,
	view: "choice",		//choice | restore
	roots: [],			//getRestoreCandidates 返回的数据根目录列表
	mode: "fresh",		//fresh | restore
	selected: null,		//已选备份 {root, dir, timeText, latest}
	listOpen: false,
	elapsedTimer: null,
	elapsedStart: 0,
};

//index.js 首启入口：先探查本机是否存在可恢复备份，无备份（或查询失败）则维持现状直接弹首管弹窗
function showFirstBootEntry()
{
	console.log("showFirstBootEntry");
	FirstBootPanel.show();
}

FirstBootPanel.show = function()
{
	$.ajax({
		url: "/DocSystem/Manage/getRestoreCandidates.do",
		type: "post",
		dataType: "json",
		timeout: 30000,
		data: {},
		success: function(ret) {
			if("ok" == ret.status && ret.data && ret.data.roots && ret.data.roots.length > 0)
			{
				FirstBootPanel.roots = ret.data.roots;
				FirstBootPanel.enter();
			}
			else
			{
				showAddFirstAdminUserPanel();
			}
		},
		error: function() {
			showAddFirstAdminUserPanel();
		}
	});
};

FirstBootPanel.enter = function()
{
	FirstBootPanel.active = true;
	FirstBootPanel.view = "choice";
	FirstBootPanel.mode = "fresh";
	FirstBootPanel.selected = null;
	FirstBootPanel.listOpen = false;
	FirstBootPanel.expandedGroups = {};

	FirstBootPanel.renderTips();
	FirstBootPanel.selectMode("fresh");
	FirstBootPanel.renderBackupList();
	FirstBootPanel.showView("choice");
	$("#firstBootPanel").show();
};

FirstBootPanel.showView = function(view)
{
	FirstBootPanel.view = view;
	$("#fbChoiceView").toggle(view == "choice");
	$("#fbRestoreView").toggle(view == "restore");
};

FirstBootPanel.lang = function(key, fallback)
{
	if(typeof FirstBootLang != "undefined" && FirstBootLang[key] != null && FirstBootLang[key] != "")
	{
		return FirstBootLang[key];
	}
	return fallback;
};

FirstBootPanel.escapeHtml = function(value)
{
	if(value == null) return "";
	return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

FirstBootPanel.formatSize = function(bytes)
{
	if(bytes == null || bytes < 0) return "";
	if(bytes < 1024) return bytes + "B";
	if(bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
	if(bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + "MB";
	return (bytes / 1024 / 1024 / 1024).toFixed(2) + "GB";
};

FirstBootPanel.renderTips = function()
{
	var rootCount = FirstBootPanel.roots.length;
	var backupCount = 0;
	for(var i = 0; i < rootCount; i++)
	{
		backupCount += FirstBootPanel.roots[i].backupCount || 0;
	}
	var format = FirstBootPanel.lang("tipsFormat", "检测到本机存在历史系统数据（{roots} 个数据目录，共 {backups} 个备份）");
	$("#fbTips").text(format.replace("{roots}", rootCount).replace("{backups}", backupCount));
};

FirstBootPanel.selectMode = function(mode)
{
	FirstBootPanel.mode = mode;
	$("input[name='fbMode'][value='" + mode + "']").prop("checked", true);
	$("#fbChoiceFresh").toggleClass("fb-active", mode == "fresh");
	$("#fbChoiceRestore").toggleClass("fb-active", mode == "restore");
	$("#fbPickBackupBtn").prop("disabled", mode != "restore");

	if(mode == "restore" && FirstBootPanel.selected == null)
	{
		FirstBootPanel.selectDefaultBackup();
	}
	if(mode != "restore")
	{
		//切走恢复模式时收起备份列表（所选记录行随 renderRecord 按模式隐藏）
		FirstBootPanel.listOpen = false;
		FirstBootPanel.renderBackupList();
	}
	FirstBootPanel.renderRecord();
	FirstBootPanel.renderConfirmBtn();
};

//默认选中备份：优先推荐根，其次第一个根；根内默认最新（列表已按时间倒序，取第一个）
FirstBootPanel.selectDefaultBackup = function()
{
	var roots = FirstBootPanel.roots;
	if(roots.length == 0)
	{
		return;
	}
	var target = roots[0];
	for(var i = 0; i < roots.length; i++)
	{
		if(roots[i].recommended)
		{
			target = roots[i];
			break;
		}
	}
	var backups = target.backups || [];
	if(backups.length == 0)
	{
		return;
	}
	FirstBootPanel.applyBackup(target.root, backups[0]);
};

FirstBootPanel.applyBackup = function(root, backup)
{
	//展示用数据目录路径（<根>/DocSysReposes），比裸数据根（可能是盘符）更直观
	var reposPath = root;
	for(var i = 0; i < FirstBootPanel.roots.length; i++)
	{
		if(FirstBootPanel.roots[i].root == root)
		{
			reposPath = FirstBootPanel.roots[i].reposPath || root;
			break;
		}
	}
	FirstBootPanel.selected = {
		root: root,
		reposPath: reposPath,
		dir: backup.dir,
		timeText: backup.timeText || backup.dir,
		latest: backup.latest == true,
	};
	FirstBootPanel.renderRecord();
	FirstBootPanel.renderBackupList();
	FirstBootPanel.renderConfirmBtn();
};

FirstBootPanel.clearSelected = function()
{
	FirstBootPanel.selected = null;
	FirstBootPanel.renderRecord();
	FirstBootPanel.renderBackupList();
	FirstBootPanel.renderConfirmBtn();
};

FirstBootPanel.renderRecord = function()
{
	var selected = FirstBootPanel.selected;
	//记录行仅在恢复模式下显示（切到全新启动时隐藏，切回时自动恢复显示）
	if(selected == null || FirstBootPanel.mode != "restore")
	{
		$("#fbSelectedBox").hide();
		return;
	}
	$("#fbRecordName").text(selected.reposPath || selected.root);
	$("#fbRecordTime").text(selected.timeText);
	$("#fbRecordLatest").toggle(selected.latest);
	$("#fbSelectedBox").show();
};

FirstBootPanel.renderConfirmBtn = function()
{
	var btn = $("#fbConfirmBtn");
	if(FirstBootPanel.mode == "restore")
	{
		btn.prop("disabled", FirstBootPanel.selected == null);
		btn.text(FirstBootPanel.selected == null
			? FirstBootPanel.lang("selectBackupFirst", "请选择备份")
			: FirstBootPanel.lang("startRestore", "开始恢复"));
	}
	else
	{
		btn.prop("disabled", false);
		btn.text(FirstBootPanel.lang("nextStep", "下一步"));
	}
};

FirstBootPanel.openBackupList = function()
{
	FirstBootPanel.listOpen = true;
	FirstBootPanel.expandSelectedGroup();
	FirstBootPanel.renderBackupList();
};

//打开备份列表时自动展开当前所选备份所在的组（未选过则展开第一组），其余组收起
FirstBootPanel.expandSelectedGroup = function()
{
	var targetRoot = null;
	if(FirstBootPanel.selected != null)
	{
		targetRoot = FirstBootPanel.selected.root;
	}
	else if(FirstBootPanel.roots.length > 0)
	{
		targetRoot = FirstBootPanel.roots[0].root;
	}
	FirstBootPanel.expandedGroups = {};
	if(targetRoot != null)
	{
		FirstBootPanel.expandedGroups[targetRoot] = true;
	}
};

FirstBootPanel.toggleBackupGroup = function(root)
{
	FirstBootPanel.expandedGroups[root] = FirstBootPanel.expandedGroups[root] != true;
	FirstBootPanel.renderBackupList();
};

FirstBootPanel.renderBackupList = function()
{
	var box = $("#fbBackupList");
	var selected = FirstBootPanel.selected;
	if(!FirstBootPanel.listOpen)
	{
		box.hide();
		return;
	}

	var html = "";
	for(var i = 0; i < FirstBootPanel.roots.length; i++)
	{
		var rootInfo = FirstBootPanel.roots[i];
		var groupLabel = rootInfo.reposPath || rootInfo.root;
		var backups = rootInfo.backups || [];
		var expanded = FirstBootPanel.expandedGroups[rootInfo.root] == true;
		html += '<div class="fb-group-root' + (expanded ? " fb-group-open" : "") + '" data-root="' + FirstBootPanel.escapeHtml(rootInfo.root) + '" title="' + FirstBootPanel.escapeHtml(groupLabel) + '">'
			+ '<span class="fb-group-arrow">' + (expanded ? "&#9662;" : "&#9656;") + '</span>'
			+ '<span class="fb-group-name">' + FirstBootPanel.escapeHtml(groupLabel) + '</span>'
			+ '<span class="fb-group-count">' + backups.length + '</span>'
			+ '</div>';
		if(expanded)
		{
			for(var j = 0; j < backups.length; j++)
			{
				var b = backups[j];
				var isActive = selected && selected.root == rootInfo.root && selected.dir == b.dir;
				html += '<div class="fb-backup-item' + (isActive ? " fb-active" : "") + '" data-root="'
					+ FirstBootPanel.escapeHtml(rootInfo.root) + '" data-dir="' + FirstBootPanel.escapeHtml(b.dir) + '">'
					+ '<span class="fb-radio-dot"></span>'
					+ '<span class="fb-backup-time">' + FirstBootPanel.escapeHtml(b.timeText || b.dir) + '</span>'
					+ '<span class="fb-backup-meta">' + FirstBootPanel.formatSize(b.jsonSize)
					+ (b.latest ? ' · <em class="fb-latest">' + FirstBootPanel.lang("latest", "最新") + '</em>' : '')
					+ '</span>'
					+ '</div>';
			}
		}
	}
	box.html(html).show();
};

FirstBootPanel.confirm = function()
{
	if(FirstBootPanel.mode == "restore")
	{
		if(FirstBootPanel.selected == null)
		{
			return;
		}
		FirstBootPanel.startRestore();
	}
	else
	{
		//全新启动：隐藏面板并弹出现有的首管创建弹窗（弹窗未完成被关闭时重新显示面板）
		$("#firstBootPanel").hide();
		showAddFirstAdminUserPanel();
		FirstBootPanel.watchAdminDialogClose();
	}
};

//监听首管弹窗的关闭（未完成创建时回显面板）：
//bootstrapQ 会在 hidden.bs.modal 的直属处理器里直接移除弹窗 DOM，事件冒泡到 document 时已中断，
//因此 document 级委托收不到该事件，必须在弹窗元素出现后直接绑定
FirstBootPanel.watchAdminDialogClose = function()
{
	if(FirstBootPanel.dialogCloseWatchTimer != null)
	{
		clearInterval(FirstBootPanel.dialogCloseWatchTimer);
		FirstBootPanel.dialogCloseWatchTimer = null;
	}
	var tries = 0;
	FirstBootPanel.dialogCloseWatchTimer = setInterval(function() {
		tries++;
		var modal = $("#addFirstAdminUser");
		if(modal.length > 0)
		{
			clearInterval(FirstBootPanel.dialogCloseWatchTimer);
			FirstBootPanel.dialogCloseWatchTimer = null;
			//创建成功走 closeAddFirstAdminUser 直接移除 DOM（不触发 hidden），面板保持隐藏；
			//仅手动关闭（modal('hide')）时回显
			modal.off("hidden.bs.modal.fbPanel").on("hidden.bs.modal.fbPanel", function() {
				$(this).off("hidden.bs.modal.fbPanel");
				if(FirstBootPanel.active && FirstBootPanel.view == "choice")
				{
					$("#firstBootPanel").show();
				}
			});
		}
		else if(tries > 75)	//约15秒内未出现则放弃监听
		{
			clearInterval(FirstBootPanel.dialogCloseWatchTimer);
			FirstBootPanel.dialogCloseWatchTimer = null;
		}
	}, 200);
};

FirstBootPanel.startRestore = function()
{
	var selected = FirstBootPanel.selected;
	FirstBootPanel.showView("restore");
	FirstBootPanel.stopElapsed();
	FirstBootPanel.elapsedStart = new Date().getTime();
	FirstBootPanel.renderRestoring();
	FirstBootPanel.elapsedTimer = setInterval(function() {
		FirstBootPanel.renderRestoring();
	}, 1000);

	console.log("startRestore dataRoot:" + selected.root + " backupDir:" + selected.dir);
	$.ajax({
		url: "/DocSystem/Manage/restoreSystemData.do",
		type: "post",
		dataType: "json",
		timeout: 900000,	//恢复为同步接口，超时放宽到15分钟
		data: {
			dataRoot: selected.root,
			backupDir: selected.dir,
		},
		success: function(ret) {
			FirstBootPanel.stopElapsed();
			if("ok" == ret.status)
			{
				FirstBootPanel.renderRestoreSuccess();
			}
			else
			{
				FirstBootPanel.renderRestoreFail(ret.msgInfo);
			}
		},
		error: function() {
			FirstBootPanel.stopElapsed();
			FirstBootPanel.renderRestoreFail(FirstBootPanel.lang("serverError", "服务器异常"));
		}
	});
};

FirstBootPanel.stopElapsed = function()
{
	if(FirstBootPanel.elapsedTimer != null)
	{
		clearInterval(FirstBootPanel.elapsedTimer);
		FirstBootPanel.elapsedTimer = null;
	}
};

FirstBootPanel.elapsedSeconds = function()
{
	if(FirstBootPanel.elapsedStart == 0)
	{
		return 0;
	}
	return Math.floor((new Date().getTime() - FirstBootPanel.elapsedStart) / 1000);
};

FirstBootPanel.renderRestoring = function()
{
	var selected = FirstBootPanel.selected || {reposPath: "", timeText: ""};
	$("#fbRestoreBody").html(
		'<div class="fb-restore-spin"><i class="fa fa-refresh fa-spin"></i></div>'
		+ '<div class="fb-restore-text">' + FirstBootPanel.lang("restoring", "正在恢复系统数据，请稍候...")
		+ '（' + FirstBootPanel.lang("elapsed", "已用时") + ' ' + FirstBootPanel.elapsedSeconds() + ' '
		+ FirstBootPanel.lang("seconds", "秒") + '）</div>'
		+ '<div class="fb-restore-detail">' + FirstBootPanel.escapeHtml(selected.reposPath) + ' · '
		+ FirstBootPanel.lang("backup", "备份") + ' ' + FirstBootPanel.escapeHtml(selected.timeText) + '</div>'
	);
};

FirstBootPanel.renderRestoreSuccess = function()
{
	$("#fbRestoreBody").html(
		'<div class="fb-restore-ok"><i class="fa fa-check-circle"></i></div>'
		+ '<div class="fb-restore-text">' + FirstBootPanel.lang("restoreSuccess", "系统数据恢复成功，请使用原系统管理员账号登录！") + '</div>'
		+ '<div class="fb-restore-detail">' + FirstBootPanel.lang("entering", "即将进入登录页面...") + '</div>'
	);
	//恢复成功后刷新页面（getLoginUser 已能查到超管，页面自然进入正常登录态）
	setTimeout(function() {
		window.location.reload();
	}, 2000);
};

FirstBootPanel.renderRestoreFail = function(msgInfo)
{
	$("#fbRestoreBody").html(
		'<div class="fb-restore-fail"><i class="fa fa-exclamation-circle"></i></div>'
		+ '<div class="fb-restore-text">' + FirstBootPanel.lang("restoreFailed", "系统数据恢复失败")
		+ '：' + FirstBootPanel.escapeHtml(msgInfo || "") + '</div>'
		+ '<div class="fb-footer" style="margin-top:24px;">'
		+ '<button type="button" class="fb-btn fb-btn-primary" onclick="FirstBootPanel.rechoose();">'
		+ FirstBootPanel.lang("rechoose", "重新选择启动方式") + '</button></div>'
	);
};

//恢复失败后重新选择：重新拉取备份列表（目录状态可能已变化）并回到选择视图
FirstBootPanel.rechoose = function()
{
	FirstBootPanel.show();
};

//事件绑定（页面加载后执行一次）
$(function() {
	$("input[name='fbMode']").on("change", function() {
		FirstBootPanel.selectMode($(this).val());
	});
	$("#fbChoiceFresh").on("click", function() {
		FirstBootPanel.selectMode("fresh");
	});
	$("#fbChoiceRestore").on("click", function() {
		FirstBootPanel.selectMode("restore");
	});
	$("#fbPickBackupBtn").on("click", function(event) {
		event.stopPropagation();
		FirstBootPanel.openBackupList();
	});
	$("#fbRecord").on("click", function() {
		FirstBootPanel.openBackupList();
	});
	$("#fbRemoveBtn").on("click", function(event) {
		event.stopPropagation();
		FirstBootPanel.clearSelected();
	});
	$("#fbBackupList").on("click", ".fb-group-root", function(event) {
		event.stopPropagation();
		FirstBootPanel.toggleBackupGroup($(this).attr("data-root"));
	});
	$("#fbBackupList").on("click", ".fb-backup-item", function() {
		var root = $(this).attr("data-root");
		var dir = $(this).attr("data-dir");
		for(var i = 0; i < FirstBootPanel.roots.length; i++)
		{
			if(FirstBootPanel.roots[i].root != root)
			{
				continue;
			}
			var backups = FirstBootPanel.roots[i].backups || [];
			for(var j = 0; j < backups.length; j++)
			{
				if(backups[j].dir == dir)
				{
					FirstBootPanel.applyBackup(root, backups[j]);
					FirstBootPanel.listOpen = false;
					FirstBootPanel.renderBackupList();
					return;
				}
			}
		}
	});
	$("#fbConfirmBtn").on("click", function() {
		FirstBootPanel.confirm();
	});
});
