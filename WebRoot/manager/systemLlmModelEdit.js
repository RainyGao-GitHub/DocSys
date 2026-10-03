//AI接入设置：模型「新增/编辑」对话框
//
//依赖 main.js 中的：
//  gSystemLlmModels / gEditingSystemLlmIndex / gEditingSystemLlmModelId / gLlmModelSettingsError
//  validateSystemLlmModel(model)  —— 前端校验（与后端 AgentLlmConfigStore.validate 同口径）
//  applySystemLlmModelEditResult(model) —— 回写到内存列表并重绘（不落盘）
//  testSystemLlmModelObj(model, $result, $btn) —— 走 /agent/config/llm-models/test

function closeSystemLlmModelEditModal(){
	$("#systemLlmModelEdit").modal("hide");
}

//高级参数显隐（只有勾选「使用高级参数」才展示与写入）
function onToggleSystemLlmModelAdvanced(){
	if($("#systemLlmModelUseAdvanced").prop("checked"))
	{
		$("#systemLlmModelAdvancedBlock").show();
	}
	else
	{
		$("#systemLlmModelAdvancedBlock").hide();
	}
}

//收集表单 → 模型对象（apiKey 直接取输入框的值，已保存的值会预先回填到框里）
function collectSystemLlmModelEdit(){
	return {
		id : gEditingSystemLlmModelId,
		name : $.trim($("#systemLlmModelName").val()),
		endpoint : $.trim($("#systemLlmModelEndpoint").val()),
		modelName : $.trim($("#systemLlmModelModelName").val()),
		apiKey : $.trim($("#systemLlmModelApiKey").val()),
		enabled : $("#systemLlmModelEnabled").prop("checked"),
		settings : collectSystemLlmModelSettings()
	};
}

//高级参数：temperature / maxTokens + 「每行一个 键=值」
//格式错误写进 gLlmModelSettingsError，由 validateSystemLlmModel 统一报出
function collectSystemLlmModelSettings(){
	gLlmModelSettingsError = "";

	//未勾选「使用高级参数」→ 不写入（已保存的高级参数会被清掉，也就不再生效）
	if(!$("#systemLlmModelUseAdvanced").prop("checked"))
	{
		return {};
	}

	var settings = {};
	var temperature = $.trim($("#systemLlmModelTemperature").val());
	if(temperature != ""){
		settings["temperature"] = temperature;
	}
	var maxTokens = $.trim($("#systemLlmModelMaxTokens").val());
	if(maxTokens != ""){
		settings["maxTokens"] = maxTokens;
	}

	var text = $("#systemLlmModelSettings").val();
	if(text != null && text != ""){
		var lines = text.split("\n");
		for(var i=0; i<lines.length; i++){
			var line = $.trim(lines[i]);
			if(line == ""){
				continue;
			}
			var pos = line.indexOf("=");
			if(pos <= 0){
				gLlmModelSettingsError = _Lang("高级参数格式错误：") + "[" + line + "] " + _Lang("应为 键=值");
				return settings;
			}
			settings[$.trim(line.substring(0, pos))] = $.trim(line.substring(pos + 1));
		}
	}
	return settings;
}

function saveSystemLlmModelEdit(){
	var model = collectSystemLlmModelEdit();
	var error = validateSystemLlmModel(model);
	if(error != null){
		showErrorMessage(error);
		return;
	}
	applySystemLlmModelEditResult(model);
	closeSystemLlmModelEditModal();
}

//测试连接：用表单里的当前值试发（API Key 留空时按 id 取已保存的密钥）
function testSystemLlmModelEdit(){
	var model = collectSystemLlmModelEdit();
	var error = validateSystemLlmModel(model);
	if(error != null){
		showErrorMessage(error);
		return;
	}
	testSystemLlmModelObj(model, $("#systemLlmModelTestResult"), $("#btnTestSystemLlmModel"));
}

//页面初始化
$(function(){
	console.log("systemLlmModelEdit page init");
});
