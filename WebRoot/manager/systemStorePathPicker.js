//「系统设置」页 5 个存储位置的「目录树选择」对话框
//
//依赖（均在 main.js）：
//  STORE_PATH_FIELDS                      —— 支持选择器的字段 id 列表
//  applyStorePathPickResult(fieldId,path) —— 回填到输入框（只回填，不保存）
//  _Lang(...)
//
//要点：
//  · 对话框 DOM 由 qiao.bs.dialog 在关闭时 remove()，所以状态全部放在本文件的全局变量里，每次打开重新初始化
//  · 目录树懒加载：首次展开某节点才请求它的子目录（后端只列目录，不列文件）
//  · 根节点由后端给（Windows = 盘符；Linux/macOS = 只有 "/"），前端不判断操作系统
//  · 默认隐藏 "." 开头（*nix）与带系统隐藏属性的目录，可勾选「显示隐藏目录」
//  · 底部「确定/取消」用 qiao.bs.dialog 自带的 modal-footer（右下角），本文件只提供 onStorePathPickerOk()

var gStorePathPickerFieldId = null;		//当前正在为哪个字段选择
var gStorePathPickerRoots = [];			//根列表（后端返回）
var gStorePathPickerDirCache = {};		//path -> [{name, path}]（已加载过的子目录）
var gStorePathPickerExpanded = {};		//path -> true/false
var gStorePathPickerChildUl = {};		//path -> 该节点的子 <ul>（jQuery 对象）
var gStorePathPickerSelected = "";		//已选路径
var gStorePathPickerShowHidden = false;	//是否显示隐藏目录
var gStorePathPickerLeafPaths = {};		//path -> true：已确认是空目录（按叶子处理，不再展开）

/**************** 初始化 / 关闭 ****************/

function initStorePathPicker(fieldId)
{
	console.log("initStorePathPicker fieldId:", fieldId);
	gStorePathPickerFieldId = fieldId;
	gStorePathPickerSelected = normalizeStorePath($("#" + fieldId).val() || "");
	$("#storePathPickerSelected").text(gStorePathPickerSelected);
	$("#storePathPickerShowHidden").prop("checked", false);
	gStorePathPickerShowHidden = false;
	showStorePathTreeTip("");
	resetStorePathTree();
}

//重新加载整棵树（保留「已选」，用于刷新 / 切换隐藏目录显示）
function resetStorePathTree()
{
	gStorePathPickerDirCache = {};
	gStorePathPickerExpanded = {};
	gStorePathPickerChildUl = {};
	gStorePathPickerLeafPaths = {};
	$("#storePathPickerTree").html('<div class="store-path-empty">' + _Lang("正在加载") + "...</div>");
	loadStorePathRoots();
}

/**************** 取数 ****************/

function requestStorePathDirList(path, onOk, onFail)
{
	$.ajax({
		url : "/DocSystem/Manage/getServerDirList.do",
		type : "post",
		dataType : "json",
		data : { path: path, showHidden: gStorePathPickerShowHidden ? 1 : 0 },
		success : function (ret) {
			if("ok" == ret.status)
			{
				onOk(ret.data);
			}
			else
			{
				if(onFail) onFail(ret.msgInfo || _Lang("获取目录列表失败"));
			}
		},
		error : function () {
			if(onFail) onFail(_Lang("获取目录列表失败"));
		}
	});
}

function loadStorePathRoots()
{
	requestStorePathDirList("", function (data) {
		gStorePathPickerRoots = data.roots || [];
		$("#storePathPickerTree").empty();
		if(gStorePathPickerRoots.length == 0)
		{
			showStorePathTreeError(_Lang("未获取到可浏览的根目录"));
			return;
		}

		var $ul = $("<ul>");
		for(var i=0; i<gStorePathPickerRoots.length; i++)
		{
			$ul.append(buildStorePathNode(gStorePathPickerRoots[i], gStorePathPickerRoots[i]));
		}
		$("#storePathPickerTree").append($ul);

		if(gStorePathPickerRoots.length == 1)
		{
			//只有一个根（Linux/macOS，或 Windows 只有一个盘）：直接展开，省掉一层点击
			var onlyRoot = gStorePathPickerRoots[0];
			ensureStorePathChildren(onlyRoot, function () {
				expandStorePathNode(onlyRoot);
				locateStorePath(gStorePathPickerSelected);
			});
		}
		else
		{
			locateStorePath(gStorePathPickerSelected);
		}
	}, function (msg) {
		showStorePathTreeError(msg);
	});
}

//确保某节点的子目录已加载（命中缓存则直接回调）
function ensureStorePathChildren(path, onDone)
{
	if(gStorePathPickerDirCache[path])
	{
		onDone();
		return;
	}
	requestStorePathDirList(path, function (data) {
		fillStorePathChildren(path, data);
		onDone();
	}, function (msg) {
		fillStorePathChildren(path, { dirs: [], total: 0, truncated: false, error: msg });
		onDone();
	});
}

/**************** 渲染 ****************/

function buildStorePathNode(path, name)
{
	var $li = $("<li>").attr("data-path", path);
	var $toggle = $('<span class="store-path-toggle">').text("\u25b8");	// ▸
	var $node = $('<span class="store-path-node">').attr("data-path", path).attr("title", path);
	$node.append($('<i class="store-path-folder">')).append(document.createTextNode(name));
	var $ul = $("<ul>").css("display", "none");
	$li.append($toggle).append($node).append($ul);
	gStorePathPickerChildUl[path] = $ul;

	$toggle.on("click", function (ev) {
		ev.stopPropagation();
		toggleStorePathNode(path);
	});
	$node.on("click", function (ev) {
		ev.stopPropagation();
		selectStorePathNode(path);
	});
	$node.on("dblclick", function (ev) {
		ev.stopPropagation();
		ev.preventDefault();
		toggleStorePathNode(path);
	});
	return $li;
}

function fillStorePathChildren(path, data)
{
	var $ul = gStorePathPickerChildUl[path];
	if(!$ul)
	{
		return;
	}
	$ul.empty();
	gStorePathPickerDirCache[path] = data.dirs || [];

	var dirs = (data.dirs || []).slice();
	//按目录名排序（中文按拼音；服务端只做了与大小写无关的稳定排序）
	dirs.sort(function (a, b) {
		return String(a.name).localeCompare(String(b.name), "zh");
	});

	if(dirs.length == 0)
	{
		if(data.error)
		{
			//读取失败（无权限/不存在）才给提示
			$ul.append($('<li class="store-path-empty">').text(data.error));
		}
		else
		{
			//空目录：按叶子处理（不提示"无子目录"，也不必展开——点不开用户自然就知道）
			markStorePathNodeAsLeaf(path);
		}
		return;
	}

	for(var i=0; i<dirs.length; i++)
	{
		$ul.append(buildStorePathNode(dirs[i].path, dirs[i].name));
	}

	if(data.truncated)
	{
		showStorePathTreeTip(_Lang("该目录下共") + " " + data.total + " " + _Lang("个子目录，仅列出前 500 个"));
	}
}

function setStorePathToggle(path, expanded)
{
	var $ul = gStorePathPickerChildUl[path];
	if(!$ul)
	{
		return;
	}
	$ul.closest("li").children(".store-path-toggle").text(expanded ? "\u25be" : "\u25b8");
	$ul.closest("li").children(".store-path-node").children(".store-path-folder").toggleClass("open", expanded);
}

//空目录按叶子节点处理：隐藏展开箭头、保持收起（不提示“无子目录”——点不开用户自然就知道）
function markStorePathNodeAsLeaf(path)
{
	var $ul = gStorePathPickerChildUl[path];
	if(!$ul)
	{
		return;
	}
	gStorePathPickerLeafPaths[path] = true;
	gStorePathPickerExpanded[path] = false;
	$ul.hide();
	$ul.closest("li").children(".store-path-toggle").text(" ");
}

function expandStorePathNode(path)
{
	var $ul = gStorePathPickerChildUl[path];
	if(!$ul)
	{
		return;
	}
	$ul.show();
	gStorePathPickerExpanded[path] = true;
	setStorePathToggle(path, true);
}

function collapseStorePathNode(path)
{
	var $ul = gStorePathPickerChildUl[path];
	if(!$ul)
	{
		return;
	}
	$ul.hide();
	gStorePathPickerExpanded[path] = false;
	setStorePathToggle(path, false);
}

function toggleStorePathNode(path)
{
	if(gStorePathPickerLeafPaths[path])
	{
		return;	//已确认是空目录（箭头已隐藏，不再展开）
	}
	if(gStorePathPickerExpanded[path])
	{
		collapseStorePathNode(path);
		return;
	}
	if(gStorePathPickerDirCache[path])
	{
		expandStorePathNode(path);
		return;
	}
	ensureStorePathChildren(path, function () {
		if(gStorePathPickerLeafPaths[path])
		{
			return;	//空目录：已在 fillStorePathChildren 里按叶子处理好了
		}
		expandStorePathNode(path);
	});
}

/**************** 选中 / 定位 ****************/

function selectStorePathNode(path)
{
	gStorePathPickerSelected = path;
	$("#storePathPickerTree .store-path-node").each(function () {
		$(this).removeClass("selected");
	});
	var $node = findStorePathNode(path);
	if($node)
	{
		$node.addClass("selected");
	}
	$("#storePathPickerSelected").text(path);
	showStorePathTreeTip("");
}

function findStorePathNode(path)
{
	var $found = null;
	$("#storePathPickerTree .store-path-node").each(function () {
		if($found == null && $(this).attr("data-path") == path)
		{
			$found = $(this);
		}
	});
	return $found;
}

function isStorePathRoot(path)
{
	for(var i=0; i<gStorePathPickerRoots.length; i++)
	{
		if(gStorePathPickerRoots[i] == path)
		{
			return true;
		}
	}
	return false;
}

//取父目录（字符串处理，与后端 Path.getParentPath 口径一致：根目录返回 null）
function getStorePathParentPath(path)
{
	path = normalizeStorePath(path);
	if(path == "")
	{
		return null;
	}
	var tmp = path.substring(0, path.length - 1);	//去掉末尾 "/"
	var pos = tmp.lastIndexOf("/");
	if(pos < 0)
	{
		return null;
	}
	var parentPath = tmp.substring(0, pos + 1);
	if(parentPath == path || parentPath == "")
	{
		return null;
	}
	return parentPath;
}

//取某条路径的所有上级目录（从根往下），例如 D:/a/b/ -> ["D:/", "D:/a/"]
function getStorePathAncestors(path)
{
	var ancestors = [];
	var parentPath = getStorePathParentPath(path);
	var guard = 0;
	while(parentPath && guard < 64)
	{
		ancestors.unshift(parentPath);
		parentPath = getStorePathParentPath(parentPath);
		guard ++;
	}
	return ancestors;
}

function normalizeStorePath(path)
{
	path = $.trim(path == null ? "" : ("" + path));
	if(path == "")
	{
		return "";
	}
	path = path.replace(/\\/g, "/");
	if(path.charAt(path.length - 1) != "/")
	{
		path = path + "/";
	}
	return path;
}

//定位到指定目录：逐级展开其上级，再选中它（打开对话框时"回到当前值"用）
function locateStorePath(path)
{
	path = normalizeStorePath(path);
	if(path == "")
	{
		return;
	}
	if(isStorePathRoot(path))
	{
		if(findStorePathNode(path))
		{
			selectStorePathNode(path);
		}
		return;
	}

	var ancestors = getStorePathAncestors(path);
	expandStorePathAncestors(ancestors, 0, function () {
		var $node = findStorePathNode(path);
		if(!$node)
		{
			showStorePathTreeTip(_Lang("目录不存在或无法读取") + "：" + path, true);
			return;
		}
		selectStorePathNode(path);
		scrollStorePathNodeIntoView($node);
	});
}

function expandStorePathAncestors(ancestors, index, onDone)
{
	if(index >= ancestors.length)
	{
		onDone();
		return;
	}
	var path = ancestors[index];
	if(gStorePathPickerExpanded[path])
	{
		expandStorePathAncestors(ancestors, index + 1, onDone);
		return;
	}
	ensureStorePathChildren(path, function () {
		expandStorePathNode(path);
		expandStorePathAncestors(ancestors, index + 1, onDone);
	});
}

function scrollStorePathNodeIntoView($node)
{
	var box = $("#storePathPickerTree").get(0);
	var el = $node.get(0);
	if(!box || !el)
	{
		return;
	}
	var boxRect = box.getBoundingClientRect();
	var elRect = el.getBoundingClientRect();
	if(elRect.top < boxRect.top || elRect.bottom > boxRect.bottom)
	{
		box.scrollTop += (elRect.top - boxRect.top) - Math.max((boxRect.height - elRect.height) / 2, 0);
	}
}

/**************** 底部按钮 / 开关 ****************/

//对话框「确定」：由 qiao.bs.dialog 调用，返回 false 则不关闭对话框
function onStorePathPickerOk()
{
	if(!gStorePathPickerSelected)
	{
		showStorePathTreeTip(_Lang("请先在目录树里选择一个目录"), true);
		return false;
	}
	applyStorePathPickResult(gStorePathPickerFieldId, gStorePathPickerSelected);
	return true;
}

function reloadStorePath()
{
	resetStorePathTree();
}

function onToggleStorePathShowHidden()
{
	gStorePathPickerShowHidden = $("#storePathPickerShowHidden").prop("checked");
	resetStorePathTree();
}

/**************** 提示 ****************/

function showStorePathTreeError(msg)
{
	$("#storePathPickerTree").html($('<div class="store-path-empty store-path-error">').text(msg || _Lang("获取目录列表失败")));
}

function showStorePathTreeTip(msg, isError)
{
	var $tip = $("#storePathPickerTreeTip");
	if(!$tip.length)
	{
		return;
	}
	$tip.text(msg || "");
	if(isError)
	{
		$tip.addClass("store-path-error");
	}
	else
	{
		$tip.removeClass("store-path-error");
	}
}
