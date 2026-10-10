var OfficeEditorLoader = (function () {
	var runtimeConfig = null;
	var runtimeReady = false;
	var loadingStarted = false;
	var pendingCallbacks = [];

	//字体库自检与自动生成（见 devDocs/Office字体库自动生成方案.md）
	//未就绪时：由本页面发起一次自动生成（后端后台线程执行），提示用户并轮询等待，就绪后继续加载编辑器
	var OFFICE_FONTS_STATUS_URL = "/DocSystem/Bussiness/getOfficeFontsStatus.do";
	var OFFICE_FONTS_AUTO_GEN_URL = "/DocSystem/Bussiness/autoGenerateOfficeFonts.do";
	var OFFICE_FONTS_POLL_INTERVAL = 15000;		//15秒
	var OFFICE_FONTS_MAX_WAIT = 60 * 60 * 1000;	//最长等待60分钟（实测全量重建含缩略图约 25 分钟）
	var fontsCheckStarted = false;
	var fontsCallbacks = [];

	function lang(text)
	{
		return (typeof _Lang == "function") ? _Lang(text) : text;
	}

	function setPlaceholderMessage(message)
	{
		var placeholder = document.getElementById("placeholder");
		if(placeholder == null)
		{
			return;
		}

		placeholder.innerHTML = "";
		var messageDiv = document.createElement("div");
		messageDiv.style.padding = "20px";
		messageDiv.style.color = "#d9534f";
		messageDiv.textContent = message;
		placeholder.appendChild(messageDiv);
	}

	function fail(message)
	{
		console.error(message);
		setPlaceholderMessage(message);
		alert(message);
	}

	function flushCallbacks()
	{
		runtimeReady = true;
		while(pendingCallbacks.length > 0)
		{
			var callback = pendingCallbacks.shift();
			if(callback)
			{
				callback(runtimeConfig);
			}
		}
	}

	function flushFontsCallbacks()
	{
		while(fontsCallbacks.length > 0)
		{
			var callback = fontsCallbacks.shift();
			if(callback)
			{
				callback();
			}
		}
	}

	//确认字体库就绪后再加载编辑器脚本。
	//任何异常、接口不可用（如开源版/接口缺失）一律 fail-open 当作就绪，保证不引入新的阻塞点。
	function ensureOfficeFontsReady(callback)
	{
		fontsCallbacks.push(callback);
		if(fontsCheckStarted)
		{
			return;
		}
		fontsCheckStarted = true;
		checkOfficeFonts(Date.now() + OFFICE_FONTS_MAX_WAIT);
	}

	function checkOfficeFonts(deadline)
	{
		$.ajax({
			url : OFFICE_FONTS_STATUS_URL,
			type : "post",
			dataType : "json",
			data : {},
			success : function (ret) {
				if("ok" != ret.status || ret.data == undefined)
				{
					flushFontsCallbacks();	//fail-open
					return;
				}

				var status = ret.data;
				if(status.installed == false || status.ready == true)
				{
					flushFontsCallbacks();
					return;
				}

				if(status.generating == true)
				{
					showFontsGeneratingMessage();
					pollOfficeFontsReady(deadline);
					return;
				}

				requestOfficeFontsAutoGenerate(deadline);
			},
			error : function () {
				flushFontsCallbacks();	//fail-open
			}
		});
	}

	function requestOfficeFontsAutoGenerate(deadline)
	{
		$.ajax({
			url : OFFICE_FONTS_AUTO_GEN_URL,
			type : "post",
			dataType : "json",
			data : {},
			success : function (ret) {
				if("ok" == ret.status && ret.data != undefined && ret.data.generating == true)
				{
					console.log("requestOfficeFontsAutoGenerate() 字体库自动生成已启动 taskId:" + ret.data.taskId);
					showFontsGeneratingMessage();
					pollOfficeFontsReady(deadline);
					return;
				}

				//已就绪 / 无需生成 / 自动生成不可用（已关闭或已达尝试上限）：
				//不阻塞用户，交给编辑器自身表现（管理后台会显示字体库状态与手动重置入口）
				console.log("requestOfficeFontsAutoGenerate() 未启动自动生成:" + JSON.stringify(ret));
				flushFontsCallbacks();
			},
			error : function () {
				flushFontsCallbacks();	//fail-open
			}
		});
	}

	function showFontsGeneratingMessage()
	{
		setPlaceholderMessage(lang("字体库正在生成中（首次可能需要 10-30 分钟），完成后本页面会自动打开，也可稍后重试"));
	}

	function pollOfficeFontsReady(deadline)
	{
		setTimeout(function () {
			$.ajax({
				url : OFFICE_FONTS_STATUS_URL,
				type : "post",
				dataType : "json",
				data : {},
				success : function (ret) {
					if("ok" == ret.status && ret.data != undefined && ret.data.ready == true)
					{
						console.log("pollOfficeFontsReady() 字体库已就绪，继续加载编辑器");
						flushFontsCallbacks();
						return;
					}
					waitMoreOrFail(deadline);
				},
				error : function () {
					waitMoreOrFail(deadline);
				}
			});
		}, OFFICE_FONTS_POLL_INTERVAL);
	}

	function waitMoreOrFail(deadline)
	{
		if(Date.now() < deadline)
		{
			pollOfficeFontsReady(deadline);
			return;
		}
		fail(lang("字体库初始化超时，请在 管理后台-系统管理-Office编辑器 手动重置字体库后重试"));
	}

	function loadScript(scriptUrl, callback)
	{
		if(typeof DocsAPI !== "undefined")
		{
			callback();
			return;
		}

		var script = document.createElement("script");
		script.type = "text/javascript";
		script.src = scriptUrl;
		script.onload = callback;
		script.onerror = function () {
			fail("Office编辑器脚本加载失败");
		};
		document.head.appendChild(script);
	}

	function loadRuntimeConfig(callback)
	{
		if(runtimeReady)
		{
			callback(runtimeConfig);
			return;
		}

		pendingCallbacks.push(callback);
		if(loadingStarted)
		{
			return;
		}

		loadingStarted = true;
		$.ajax({
			url : "/DocSystem/Manage/getOfficeEditorConfig.do",
			type : "post",
			dataType : "json",
			data : {},
			success : function (ret) {
				if("ok" != ret.status || ret.data == undefined || !ret.data.officeEditorApi)
				{
					fail(ret.msgInfo ? ret.msgInfo : "Office编辑器不可用");
					return;
				}

				runtimeConfig = ret.data;
				window.officeEditorType = runtimeConfig.officeEditorType;
				//先确认字体库就绪（缺失时自动生成并等待），再加载编辑器脚本
				ensureOfficeFontsReady(function () {
					loadScript(runtimeConfig.officeEditorApi, function () {
						flushCallbacks();
					});
				});
			},
			error : function () {
				fail("Office编辑器配置获取失败");
			}
		});
	}

	function initNewPage()
	{
		loadRuntimeConfig(function () {
			OfficeEditor.initForNewPage();
		});
	}

	function initArtDialog()
	{
		loadRuntimeConfig(function () {
			OfficeEditor.initForArtDialog();
		});
	}

	function initBootstrapDialog(docInfo, langType)
	{
		loadRuntimeConfig(function () {
			OfficeEditor.PageInit(docInfo, langType);
		});
	}

	return {
		loadRuntimeConfig: loadRuntimeConfig,
		initNewPage: initNewPage,
		initArtDialog: initArtDialog,
		initBootstrapDialog: initBootstrapDialog
	};
})();