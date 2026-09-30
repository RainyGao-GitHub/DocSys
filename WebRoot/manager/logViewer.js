/**
 * 调试日志在线查看（管理后台「系统设置 → 调试日志 → 在线查看」打开的新标签页）
 *
 * 设计要点：
 *  - 后端按「字节窗口」返回内容（单窗默认 256KB），且窗口两端对齐到整行 → 分页不重不漏；
 *  - 增量刷新：把上次的 endOffset 当作 offset 再取一次即可；
 *  - 向上翻页：offset = max(0, startOffset - 256KB) 且 endOffset = startOffset（避免与已显示内容重叠）；
 *  - 日志文本一律转义后插入（日志里可能有 <script>），高亮也是"先转义再包 <mark>"；
 *  - 文件被清除/轮转时 fileSize 会变小 → 提示并重新加载末尾。
 */
var LOG_VIEWER_BYTES = 262144;			// 每窗 256KB（与后端默认一致）
var LOG_VIEWER_INTERVAL_MS = 3000;		// 自动刷新间隔（服务端不写日志，无自我污染）
var LOG_VIEWER_MAX_LINES = 50000;		// 已加载行数上限，防止浏览器内存爆

var LOG_VIEWER_TXT = {
	"_en": {
		loading: "Loading...",
		empty: "(empty)",
		atStart: "beginning of file",
		loadFailed: "Failed to load log: ",
		expired: "Not signed in (or session expired). Please sign in to the admin console and retry.",
		fileChanged: "Log file was cleaned or rotated; reloaded from the tail.",
		newLines: function (n) { return n + " new lines"; },
		maxLines: "Too much content loaded; jump to the tail or reload before paging up again.",
		notExist: "(not exists)"
	},
	"": {
		loading: "加载中...",
		empty: "（暂无内容）",
		atStart: "已到文件开头",
		loadFailed: "加载日志失败：",
		expired: "未登录或登录已过期，请重新登录管理后台后重试。",
		fileChanged: "日志文件已被清除或轮转，已重新加载末尾内容。",
		newLines: function (n) { return n + " 条新日志"; },
		maxLines: "已加载内容过多，请先跳到末尾或重新加载，再继续向上翻页。",
		notExist: "(文件不存在)"
	}
};

var lv = {
	txt: null,
	key: "",
	lines: [],
	startOffset: 0,
	endOffset: 0,
	fileSize: 0,
	filterText: "",
	pendingNew: 0,
	loading: false,
	timer: null
};

function lvInit()
{
	lv.txt = LOG_VIEWER_TXT[langExt] || LOG_VIEWER_TXT[""];

	$("#btnReload").on("click", function () { lvReloadTail(true); });
	$("#btnJumpEnd").on("click", function () { lvReloadTail(true); });
	$("#btnJumpStart").on("click", function () { lvLoadStart(); });
	$("#btnLoadBefore").on("click", function () { lvLoadBefore(); });
	$("#btnDownload").on("click", function () { lvDownload(); });
	$("#logSource").on("change", function () { lv.key = $(this).val(); lvReloadTail(true); });
	$("#logEncoding").on("change", function () { lvReloadTail(true); });
	$("#autoRefresh").on("change", function () { lvApplyAutoRefresh(); });
	$("#logFilter").on("input", function () { lv.filterText = $(this).val(); lvRender(); });

	lvApplyAutoRefresh();
	lvLoadSources();
}

function lvApplyAutoRefresh()
{
	if(lv.timer) {
		clearInterval(lv.timer);
		lv.timer = null;
	}
	if($("#autoRefresh").prop("checked")) {
		lv.timer = setInterval(lvPollNew, LOG_VIEWER_INTERVAL_MS);
	}
}

/* ---------------- 日志源列表 ---------------- */
function lvLoadSources()
{
	$.ajax({
		url : "/DocSystem/Manage/getLogSources.do",
		type : "post",
		dataType : "json",
		data : {},
		success : function (ret) {
			if(ret.status != "ok") {
				lvShowError((ret.msgInfo || lv.txt.expired));
				return;
			}
			var list = ret.data || [];
			var html = "";
			var firstExisting = "";
			for(var i = 0; i < list.length; i++) {
				var s = list[i];
				var label = s.label + (s.exists ? "  (" + lvFormatSize(s.size) + ")" : "  " + lv.txt.notExist);
				html += '<option value="' + lvEscapeAttr(s.key) + '"' + (s.exists ? "" : " disabled") + '>' + lvEscapeHtml(label) + "</option>";
				if(!firstExisting && s.exists) {
					firstExisting = s.key;
				}
			}
			$("#logSource").html(html);
			lv.key = firstExisting;
			$("#logSource").val(firstExisting);
			lvReloadTail(false);
		},
		error : function () {
			lvShowError(lv.txt.expired);
		}
	});
}

/* ---------------- 取内容 ---------------- */
function lvFetch(params, onOk)
{
	if(lv.loading) {
		return;
	}
	lv.loading = true;
	$.ajax({
		url : "/DocSystem/Manage/getLogContent.do",
		type : "post",
		dataType : "json",
		data : params,
		success : function (ret) {
			lv.loading = false;
			if(ret.status != "ok") {
				lvShowError(ret.msgInfo || lv.txt.loadFailed);
				return;
			}
			onOk(ret.data);
		},
		error : function () {
			lv.loading = false;
			lvShowError(lv.txt.loadFailed + "服务器异常");
		}
	});
}

function lvBaseParams()
{
	return {
		key : lv.key,
		maxBytes : LOG_VIEWER_BYTES,
		encoding : $("#logEncoding").val()
	};
}

/** 加载文件末尾一窗（初始加载 / 跳到末尾 / 重新加载） */
function lvReloadTail(clearPending)
{
	var params = lvBaseParams();
	params.offset = -1;
	lvFetch(params, function (data) {
		lv.lines = lvSplitLines(data.content);
		lv.startOffset = data.startOffset;
		lv.endOffset = data.endOffset;
		lv.fileSize = data.fileSize;
		lv.pendingNew = 0;
		lvRender();
		lvScrollToBottom();
		lvShowFileInfo(data);
		if(data.longLine) {
			lvShowTip("窗口内有超过 256KB 的超长单行，已整行返回。");
		}
	});
	if(clearPending) {
		lv.pendingNew = 0;
	}
}

/** 跳到文件开头 */
function lvLoadStart()
{
	var params = lvBaseParams();
	params.offset = 0;
	lvFetch(params, function (data) {
		lv.lines = lvSplitLines(data.content);
		lv.startOffset = data.startOffset;
		lv.endOffset = data.endOffset;
		lv.fileSize = data.fileSize;
		lv.pendingNew = 0;
		lvRender();
		$("#logContent").parent().scrollTop(0);
		lvShowFileInfo(data);
	});
}

/** 向上翻页（读取当前窗口之前的一窗） */
function lvLoadBefore()
{
	if(lv.startOffset <= 0) {
		lvShowTip(lv.txt.atStart);
		return;
	}
	if(lv.lines.length >= LOG_VIEWER_MAX_LINES) {
		lvShowTip(lv.txt.maxLines);
		return;
	}

	var from = lv.startOffset - LOG_VIEWER_BYTES;
	if(from < 0) {
		from = 0;
	}
	var params = lvBaseParams();
	params.offset = from;
	params.endOffset = lv.startOffset;		// 精确到"当前窗口起点"，不重叠
	lvFetch(params, function (data) {
		var older = lvSplitLines(data.content);
		if(older.length === 0) {
			lvShowTip(lv.txt.atStart);
			lv.startOffset = data.startOffset;
			return;
		}
		var box = $("#logContent");
		var oldHeight = box.prop("scrollHeight");
		var oldScroll = box.parent().scrollTop();

		lv.lines = older.concat(lv.lines);
		lv.startOffset = data.startOffset;
		lvRender();

		// 保持视觉位置（内容前插后把滚动条下移相同高度）
		var delta = box.prop("scrollHeight") - oldHeight;
		box.parent().scrollTop(oldScroll + delta);
		lvShowFileInfo(data);
	});
}

/** 自动刷新：只取新增部分 */
function lvPollNew()
{
	if(lv.loading || !lv.key) {
		return;
	}

	//只在"视图已经到达文件末尾"时才追加新内容。
	//否则（跳到开头 / 向上翻页看历史）offset 不是文件末尾，追加下去会等于把整个文件一路拉下来。
	if(lv.endOffset < lv.fileSize) {
		return;
	}
	if(lv.lines.length >= LOG_VIEWER_MAX_LINES) {
		lvShowTip(lv.txt.maxLines);
		return;
	}

	var params = lvBaseParams();
	params.offset = lv.endOffset;
	lvFetch(params, function (data) {
		if(data.fileSize < lv.fileSize) {
			// 日志被清除或被轮转（>50MB rename）
			lvShowTip(lv.txt.fileChanged);
			lvReloadTail(true);
			return;
		}
		lv.fileSize = data.fileSize;

		var news = lvSplitLines(data.content);
		if(news.length === 0) {
			return;
		}
		lv.endOffset = data.endOffset;
		var atBottom = lvIsAtBottom();
		lv.lines = lv.lines.concat(news);
		if(atBottom) {
			lvRender();
			lvScrollToBottom();
		} else {
			lv.pendingNew += news.length;
			lvRender();
			lvShowTip(lv.txt.newLines(lv.pendingNew));
		}
	});
}

/* ---------------- 渲染 ---------------- */
function lvSplitLines(text)
{
	if(!text) {
		return [];
	}
	var lines = text.split("\n");
	if(lines.length > 0 && lines[lines.length - 1] === "") {
		lines.pop();		// 末尾换行产生的空串
	}
	return lines;
}

function lvRender()
{
	var filter = lv.filterText;
	var out = [];
	for(var i = 0; i < lv.lines.length; i++) {
		var line = lv.lines[i];
		if(filter && line.indexOf(filter) < 0) {
			continue;
		}
		out.push(filter ? lvHighlight(line, filter) : lvEscapeHtml(line));
	}
	if(out.length === 0) {
		$("#logContent").html(filter ? "" : lvEscapeHtml(lv.txt.empty));
	} else {
		$("#logContent").html(out.join("\n"));
	}
	$("#filterInfo").text(filter ? (out.length + " / " + lv.lines.length) : "");
}

function lvHighlight(line, filter)
{
	var out = "";
	var pos = 0;
	var idx = line.indexOf(filter);
	while(idx >= 0) {
		out += lvEscapeHtml(line.substring(pos, idx));
		out += "<mark>" + lvEscapeHtml(line.substring(idx, idx + filter.length)) + "</mark>";
		pos = idx + filter.length;
		idx = line.indexOf(filter, pos);
	}
	out += lvEscapeHtml(line.substring(pos));
	return out;
}

function lvEscapeHtml(s)
{
	if(s === null || s === undefined) {
		return "";
	}
	return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function lvEscapeAttr(s)
{
	return lvEscapeHtml(s).replace(/"/g, "&quot;");
}

/* ---------------- 状态与滚动 ---------------- */
function lvShowFileInfo(data)
{
	var info = (data.filePath || "") + "    " + lvFormatSize(data.fileSize)
		+ "    " + lvFormatTime(data.lastModified)
		+ "    [" + data.startOffset + " ~ " + data.endOffset + "]";
	$("#statusBar").text(info);
}

function lvShowTip(msg)
{
	$("#tip").text(msg).show();
	clearTimeout(lv._tipTimer);
	lv._tipTimer = setTimeout(function () { $("#tip").hide(); }, 5000);
}

function lvShowError(msg)
{
	$("#logContent").html(lvEscapeHtml(msg || lv.txt.loadFailed));
}

function lvIsAtBottom()
{
	var box = $("#logContent");
	var parent = box.parent();
	return (box.prop("scrollHeight") - parent.scrollTop() - parent.innerHeight()) < 40;
}

function lvScrollToBottom()
{
	var box = $("#logContent");
	var parent = box.parent();
	parent.scrollTop(box.prop("scrollHeight"));
}

function lvFormatSize(size)
{
	if(size === null || size === undefined) {
		return "-";
	}
	if(size < 1024) {
		return size + " B";
	}
	if(size < 1024 * 1024) {
		return (size / 1024).toFixed(1) + " KB";
	}
	return (size / 1024 / 1024).toFixed(2) + " MB";
}

function lvFormatTime(time)
{
	if(!time) {
		return "-";
	}
	var d = new Date(time);
	function p(n) { return (n < 10 ? "0" : "") + n; }
	return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate())
		+ " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
}

/* ---------------- 下载（复用后台的下载接口，支持任意白名单日志源） ---------------- */
function lvDownload()
{
	$.ajax({
		url : "/DocSystem/Manage/downloadLogFile.do",
		type : "post",
		dataType : "json",
		data : { key : lv.key },
		success : function (ret) {
			if(ret.status == "ok") {
				window.location.href = ret.data;
			} else {
				lvShowError(lv.txt.loadFailed + (ret.msgInfo || ""));
			}
		},
		error : function () {
			lvShowError(lv.txt.loadFailed + "服务器异常");
		}
	});
}
