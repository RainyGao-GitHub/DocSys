/**
 * CompressExtract.js —— 在线压缩与解压（提取/添加到压缩包）共享逻辑
 *
 * 使用方：
 *  - project.js #tree 右键菜单（提取压缩文件 / 压缩选中条目）
 *  - extractDoc.html / compressDoc.html 弹窗片段
 *  - zipViewer 三变体右键（提取压缩包内条目到仓库）
 *
 * 后端接口（详见工作卡 §5.1）：
 *  - /DocSystem/Doc/extractDocPrepare.do   提取（返回 msgData=5 轮询 / "conflict" 冲突确认 / fail）
 *  - /DocSystem/Doc/compressDocPrepare.do  压缩（同上）
 *  - /DocSystem/Doc/queryCompressExtractTask.do 轮询（msgData=5 进行中 / ok+data 完成 / fail）
 */
var CompressExtract = CompressExtract || {};

//是否为可提取的压缩文件节点（仅文件；后缀集合与后端 isZip 对齐，由 DocSys.js 的 isZip 实现）
CompressExtract.isCompressDoc = function(node)
{
	if(!node || node.isParent === true)
	{
		return false;
	}
	return isZip(getFileSuffix(node.name));
};

//压缩包名去后缀
CompressExtract.getZipBaseName = function(name)
{
	var suffix = getFileSuffix(name);
	if(!suffix)
	{
		return name;
	}
	return name.substring(0, name.length - suffix.length - 1);
};

//多文件打包下载同款虚拟名（buildTreeNodesForCompressDownload 规则）
CompressExtract.buildVirtualName = function(nodes)
{
	if(!nodes || nodes.length == 0)
	{
		return "";
	}
	if(nodes.length == 1)
	{
		return nodes[0].name;
	}
	return nodes[0].name + "...等" + nodes.length + "个文件";
};

//节点所在目录的仓库内路径（node.path 即父目录路径，根级为""或"/"，统一返回"/"）
CompressExtract.getDirPath = function(node)
{
	var p = (node && node.path) || "";
	if(p === "")
	{
		return "/";
	}
	return p;
};

// ============ 任务进度提示（轻量弹窗） ============

CompressExtract.showTaskDialog = function(title)
{
	if($("#compressExtractTaskDialog").length == 0)
	{
		var html = ''
			+ '<div class="modal fade" id="compressExtractTaskDialog" tabindex="-1" role="dialog" aria-hidden="true">'
			+   '<div class="modal-dialog" style="width: 420px;">'
			+     '<div class="modal-content">'
			+       '<div class="modal-header">'
			+         '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span></button>'
			+         '<h4 class="modal-title" id="compressExtractTaskTitle"></h4>'
			+       '</div>'
			+       '<div class="modal-body">'
			+         '<div id="compressExtractTaskInfo" style="text-align:center; padding:15px 5px;"></div>'
			+       '</div>'
			+       '<div class="modal-footer">'
			+         '<button type="button" class="btn btn-default" onclick="$(\'#compressExtractTaskDialog\').modal(\'hide\');" style="min-width:80px;">' + _Lang('后台运行') + '</button>'
			+       '</div>'
			+     '</div>'
			+   '</div>'
			+ '</div>';
		$("body").append(html);
	}
	$("#compressExtractTaskTitle").text(title);
	$("#compressExtractTaskInfo").text(_Lang("任务准备中..."));
	$("#compressExtractTaskDialog").modal("show");
};

CompressExtract.updateTaskInfo = function(info)
{
	$("#compressExtractTaskInfo").text(info);
};

CompressExtract.hideTaskDialog = function()
{
	$("#compressExtractTaskDialog").modal("hide");
};

// ============ 任务轮询（仿 DocDownload：2s 起步 +5s 递增，上限 60s） ============

CompressExtract.startQueryTask = function(taskId, delayTime, callbacks)
{
	var nextDelayTime = delayTime;
	if(nextDelayTime < 60000)
	{
		nextDelayTime += 5000;
	}
	setTimeout(function() {
		CompressExtract.doQueryTask(taskId, nextDelayTime, callbacks);
	}, delayTime);
};

CompressExtract.doQueryTask = function(taskId, nextDelayTime, callbacks)
{
	$.ajax({
		url : "/DocSystem/Doc/queryCompressExtractTask.do",
		type : "post",
		dataType : "json",
		timeout : 0,
		data : {
			taskId : taskId,
		},
		success : function(ret) {
			if(ret.status == "ok")
			{
				if(ret.msgData == 5)
				{
					//任务执行中
					var task = ret.data;
					if(callbacks.onInfo && task && task.info)
					{
						callbacks.onInfo(task.info);
					}
					CompressExtract.startQueryTask(taskId, nextDelayTime, callbacks);
				}
				else
				{
					//完成
					if(callbacks.onDone)
					{
						callbacks.onDone(ret.data);
					}
				}
			}
			else
			{
				if(callbacks.onFail)
				{
					callbacks.onFail(ret.msgInfo);
				}
			}
		},
		error : function() {
			if(callbacks.onFail)
			{
				callbacks.onFail(_Lang("服务器异常") + "!");
			}
		}
	});
};

// ============ 冲突确认（整体一次确认：替换=合并/覆盖，取消=中止） ============

CompressExtract.confirmConflict = function(conflictData, onReplace)
{
	var count = conflictData.count || 0;
	var names = conflictData.names || [];
	var nameDisp = "";
	for(var i = 0; i < names.length && i < 5; i++)
	{
		nameDisp += (i == 0 ? "" : "、") + names[i];
	}
	if(count > 5)
	{
		nameDisp += " ...";
	}
	var msg = _Lang("目标位置已存在同名条目") + " " + count + _Lang("个") + " (" + nameDisp + ") " + _Lang("是否替换？");
	qiao.bs.confirm({
		title : _Lang("冲突提示"),
		msg : msg,
		okbtn : _Lang("替换"),
		qubtn : _Lang("取消"),
	}, onReplace || function(){});
};

// ============ 提取（解压压缩文件到仓库目录） ============
// zipInfo: {reposId, path, name}          压缩文件在仓库内的位置
// opts:    {targetPath, targetName,       目标目录(空或"/"=仓库根) 与目标子目录名(空=散落到targetPath)
//           entryList(array,可选),        zip内相对路径，空=全部
//           overwriteFlag, shareId,       0=冲突询问 1=直接覆盖
//           title,                        进度弹窗标题
//           onDone(result)}               result={targetPath,targetName} 完成回调（默认提示+刷新）
CompressExtract.extractZipDoc = function(zipInfo, opts)
{
	opts = opts || {};
	var title = opts.title || (_Lang("提取") + " " + zipInfo.name);
	var send = function(overwriteFlag) {
		var data = {
			reposId : zipInfo.reposId,
			path : zipInfo.path,
			name : zipInfo.name,
			targetPath : opts.targetPath || "/",
			targetName : opts.targetName || "",
			overwriteFlag : overwriteFlag,
		};
		if(opts.entryList && opts.entryList.length > 0)
		{
			data.entryList = JSON.stringify(opts.entryList);
		}
		if(opts.shareId || (typeof gShareId !== "undefined" && gShareId))
		{
			data.shareId = opts.shareId || gShareId;
		}
		$.ajax({
			url : "/DocSystem/Doc/extractDocPrepare.do",
			type : "post",
			dataType : "json",
			timeout : 0,
			data : data,
			success : function(ret) {
				CompressExtract.handlePrepareRet(ret, title, send, opts);
			},
			error : function() {
				CompressExtract.hideTaskDialog();
				showErrorMessage ? showErrorMessage(_Lang("服务器异常") + "!") : alert(_Lang("服务器异常") + "!");
			}
		});
	};
	send(opts.overwriteFlag || 0);
};

// ============ 压缩（选中条目打包为zip存入仓库） ============
// opts: {docList(array {path,name,type}), targetPath, targetName, overwriteFlag, shareId, title, onDone(result)}
CompressExtract.compressDocs = function(opts)
{
	opts = opts || {};
	var title = opts.title || (_Lang("压缩") + " " + (opts.targetName || ""));
	var send = function(overwriteFlag) {
		var data = {
			reposId : opts.reposId || (typeof gReposInfo !== "undefined" ? gReposInfo.id : null),
			docList : JSON.stringify(opts.docList || []),
			targetPath : opts.targetPath || "/",
			targetName : opts.targetName || "",
			overwriteFlag : overwriteFlag,
		};
		if(opts.shareId || (typeof gShareId !== "undefined" && gShareId))
		{
			data.shareId = opts.shareId || gShareId;
		}
		$.ajax({
			url : "/DocSystem/Doc/compressDocPrepare.do",
			type : "post",
			dataType : "json",
			timeout : 0,
			data : data,
			success : function(ret) {
				CompressExtract.handlePrepareRet(ret, title, send, opts);
			},
			error : function() {
				CompressExtract.hideTaskDialog();
				showErrorMessage ? showErrorMessage(_Lang("服务器异常") + "!") : alert(_Lang("服务器异常") + "!");
			}
		});
	};
	send(opts.overwriteFlag || 0);
};

//prepare 接口统一响应处理：conflict → 确认后重发；msgData=5 → 弹进度+轮询；fail → 报错
CompressExtract.handlePrepareRet = function(ret, title, resend, opts)
{
	if(ret.status != "ok")
	{
		var msg = ret.msgInfo || _Lang("操作失败");
		showErrorMessage ? showErrorMessage(msg) : alert(msg);
		return;
	}
	if(ret.msgData == "conflict")
	{
		CompressExtract.confirmConflict(ret.data, function(){
			resend(1);
		});
		return;
	}
	if(ret.msgData == 5)
	{
		var task = ret.data;
		if(!task || !task.id)
		{
			showErrorMessage ? showErrorMessage(_Lang("创建任务失败")) : alert(_Lang("创建任务失败"));
			return;
		}
		CompressExtract.showTaskDialog(title);
		CompressExtract.startQueryTask(task.id, 2000, {
			onInfo : function(info) {
				CompressExtract.updateTaskInfo(info);
			},
			onDone : function(result) {
				CompressExtract.hideTaskDialog();
				var msg = title + " " + _Lang("完成");
				qiao.bs.msg({msg : msg, type : "success", time : 2000});
				if(opts.onDone)
				{
					opts.onDone(result);
				}
				else
				{
					CompressExtract.refreshTargetDir(result);
				}
			},
			onFail : function(msgInfo) {
				CompressExtract.hideTaskDialog();
				showErrorMessage ? showErrorMessage(msgInfo) : alert(msgInfo);
				if(opts.onFail)
				{
					opts.onFail(msgInfo);
				}
			}
		});
		return;
	}
	//意外响应
	var msg = ret.msgInfo || _Lang("未知响应");
	showErrorMessage ? showErrorMessage(msg) : alert(msg);
};

//完成后刷新目标目录（project页可用时刷新当前页；zipViewer等场景由onDone自行处理）
CompressExtract.refreshTargetDir = function(result)
{
	if(!result || !result.targetPath)
	{
		return;
	}
	//目标目录可能是新建的，树中没有节点，直接刷新整个页面（refreshDoc本身即整页reload）
	setTimeout(function(){
		CompressExtract.refreshHostPage();
	}, 1000);
};

//跨窗口刷新宿主project页：本页（ForBootstrap片段同页）→ 父窗口（ForArt iframe）→ 打开者（新窗口）
CompressExtract.refreshHostPage = function()
{
	try { if(typeof refreshDoc === "function") { refreshDoc(null, 0); return; } } catch(e) {}
	try { if(window.parent && window.parent !== window && typeof window.parent.refreshDoc === "function") { window.parent.refreshDoc(null, 0); return; } } catch(e) {}
	try { if(window.opener && window.opener !== window && typeof window.opener.refreshDoc === "function") { window.opener.refreshDoc(null, 0); } } catch(e) {}
};

// ============ zipViewer 预览页入口（压缩包内条目提取到仓库） ============

//zipViewer节点在zip内的相对路径（node.path = 压缩包仓库路径+包名/+条目路径）
CompressExtract.getZipEntryPath = function(node)
{
	if(!node)
	{
		return "";
	}
	var prefix = (node.rootPath || "") + (node.rootName || "") + "/";
	var entry = node.path || "";
	if(prefix && entry.indexOf(prefix) == 0)
	{
		entry = entry.substring(prefix.length);
	}
	entry += node.name || "";
	return entry;
};

//zipViewer右键提取：mode="here"提取到当前位置（zip所在目录，按zip内原结构散开）| "dialog"提取到...
CompressExtract.extractZipEntry = function(node, mode)
{
	if(!node)
	{
		return;
	}
	var zipInfo = {
		reposId : node.vid,
		path : node.rootPath,
		name : node.rootName,
	};
	var entryList = [CompressExtract.getZipEntryPath(node)];
	var targetPath = node.rootPath || "/";
	if(mode == "dialog")
	{
		CompressExtract.openExtractDialog(zipInfo, {
			targetPath : targetPath,
			targetName : "",
			entryList : entryList,
			doc : node,
			shareId : node.shareId,
		});
		return;
	}
	//提取到当前位置：目标=zip所在目录，子目录名为空（条目按zip内原结构落地）
	CompressExtract.extractZipDoc(zipInfo, {
		targetPath : targetPath,
		targetName : "",
		entryList : entryList,
		shareId : node.shareId,
		title : "提取 " + entryList[0],
	});
};

// ============ 右键菜单入口（project.js #tree 菜单调用） ============

//【提取到同名目录】：直接提取到 zip所在目录/包名去后缀/
CompressExtract.extractDocMenuAction = function(node)
{
	if(!CompressExtract.isCompressDoc(node))
	{
		qiao.bs.msg({msg : _Lang("请选择压缩文件"), type : "warning", time : 2000});
		return;
	}
	CompressExtract.extractZipDoc({
		reposId : gReposInfo.id,
		path : node.path,
		name : node.name,
	}, {
		targetPath : CompressExtract.getDirPath(node),
		targetName : CompressExtract.getZipBaseName(node.name),
		title : _Lang("提取") + " " + node.name,
	});
};

//【添加到压缩包】：直接压缩到选中节点所在目录，包名=虚拟名规则
CompressExtract.compressDocsMenuAction = function(nodes)
{
	if(!nodes || nodes.length == 0)
	{
		qiao.bs.msg({msg : _Lang("请选择要压缩的文件"), type : "warning", time : 2000});
		return;
	}
	var docList = [];
	for(var i = 0; i < nodes.length; i++)
	{
		docList.push({
			path : nodes[i].path,
			name : nodes[i].name,
			type : (nodes[i].isParent === true ? 2 : 1),
		});
	}
	var zipName = CompressExtract.buildVirtualName(nodes) + ".zip";
	CompressExtract.compressDocs({
		reposId : gReposInfo.id,
		docList : docList,
		targetPath : CompressExtract.getDirPath(nodes[0]),
		targetName : zipName,
		title : _Lang("压缩") + " " + zipName,
	});
};

// ============ 弹窗（bootstrapQ.dialog 片段注入） ============

//目录选择弹窗（同 pullDoc.js 实现；该函数不保证在宿主页已加载，此处自带一份）
CompressExtract.showFileSelectorInBootstrapDialog = function(config)
{
	bootstrapQ.dialog({
		id : "fileSelector",
		url : "fileSelector" + (typeof langExt !== "undefined" ? langExt : "") + ".html",
		title : _Lang("文件选择"),
		msg : _Lang("页面正在加载，请稍等") + "...",
		foot : false,
		big : false,
		callback : function() {
			FileSelector.fileSelectorPageInit(config);
		},
	});
};

//打开"提取到..."对话框（zipInfo={reposId,path,name}；defaults={targetPath,targetName,entryList,doc,shareId,onDone}）
CompressExtract.openExtractDialog = function(zipInfo, defaults)
{
	defaults = defaults || {};
	bootstrapQ.dialog({
		id : "extractDoc",
		url : "extractDoc" + (typeof langExt !== "undefined" ? langExt : "") + ".html",
		title : _Lang("提取") + " " + zipInfo.name,
		msg : _Lang("页面正在加载，请稍等") + "...",
		foot : false,
		big : false,
		callback : function() {
			CompressExtract.extractDocPageInit({
				zipInfo : zipInfo,
				targetPath : defaults.targetPath || "/",
				targetName : defaults.targetName || "",
				entryList : defaults.entryList || null,
				doc : defaults.doc || null,
				shareId : defaults.shareId,
				onDone : defaults.onDone,
			});
		},
	});
};

//打开"添加到压缩包"对话框（defaults={reposId,docList,targetPath,targetName,doc,onDone}）
CompressExtract.openCompressDialog = function(defaults)
{
	defaults = defaults || {};
	bootstrapQ.dialog({
		id : "compressDoc",
		url : "compressDoc" + (typeof langExt !== "undefined" ? langExt : "") + ".html",
		title : _Lang("添加到压缩包"),
		msg : _Lang("页面正在加载，请稍等") + "...",
		foot : false,
		big : false,
		callback : function() {
			CompressExtract.compressDocPageInit({
				reposId : defaults.reposId,
				docList : defaults.docList || [],
				targetPath : defaults.targetPath || "/",
				targetName : defaults.targetName || "",
				doc : defaults.doc || null,
				onDone : defaults.onDone,
			});
		},
	});
};
