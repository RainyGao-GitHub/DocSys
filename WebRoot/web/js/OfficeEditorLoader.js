var OfficeEditorLoader = (function () {
	var runtimeConfig = null;
	var runtimeReady = false;
	var loadingStarted = false;
	var pendingCallbacks = [];

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
				loadScript(runtimeConfig.officeEditorApi, function () {
					flushCallbacks();
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