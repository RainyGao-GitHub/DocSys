//LDAP设置：服务器「新增/编辑」对话框
//
//依赖 main.js 中的：
//  gEditingSystemLdapIndex / gEditingSystemLdapId / gLdapExtraSettingsError
//  validateSystemLdapServer(server, selfIndex) —— 前端校验（与后端 LdapConfigStore.validate 同口径）
//  applySystemLdapServerEditResult(server)     —— 回写到内存列表并重绘（不落盘）
//  testSystemLdapServerObj(server, $result, $btn) —— 服务端渲染串 + ldapTest.do

function closeSystemLdapServerEditModal(){
	$("#systemLdapServerEdit").modal("hide");
}

//高级参数显隐（只有勾选「使用高级参数」才展示与写入）
function onToggleSystemLdapServerAdvanced(){
	if($("#systemLdapServerUseAdvanced").prop("checked"))
	{
		$("#systemLdapServerAdvancedBlock").show();
	}
	else
	{
		$("#systemLdapServerAdvancedBlock").hide();
	}
}

//收集表单 → 服务器对象
function collectSystemLdapServerEdit(){
	var advanced = collectSystemLdapServerAdvanced();
	return {
		id : gEditingSystemLdapId,
		name : $.trim($("#systemLdapServerName").val()),
		scheme : $("#systemLdapServerScheme").val(),
		host : $.trim($("#systemLdapServerHost").val()),
		port : $.trim($("#systemLdapServerPort").val()),
		baseDn : $.trim($("#systemLdapServerBaseDn").val()),
		enabled : $("#systemLdapServerEnabled").prop("checked"),
		authentication : $("#systemLdapServerAuthentication").val(),
		domainCheck : $("#systemLdapServerDomainCheck").prop("checked"),
		loginMode : $.trim($("#systemLdapServerLoginMode").val()),
		bindAccount : $.trim($("#systemLdapServerBindAccount").val()),
		bindPassword : $.trim($("#systemLdapServerBindPassword").val()),
		filter : advanced.filter,
		attributes : advanced.attributes,
		extraSettings : advanced.extraSettings
	};
}

//高级参数：过滤条件 + 属性映射 + 「其他设置」（每行一个 键=值）
//未勾选「使用高级参数」→ 全部清空（已保存的高级参数会被清掉，也就不再生效）
function collectSystemLdapServerAdvanced(){
	var advanced = {"filter" : "", "attributes" : {}, "extraSettings" : {}};
	gLdapExtraSettingsError = "";

	if(!$("#systemLdapServerUseAdvanced").prop("checked"))
	{
		return advanced;
	}

	advanced.filter = $.trim($("#systemLdapServerFilter").val());
	advanced.attributes = {
		name : $.trim($("#systemLdapServerNameAttribute").val()),
		realName : $.trim($("#systemLdapServerRealNameAttribute").val()),
		nickName : $.trim($("#systemLdapServerNickNameAttribute").val()),
		mail : $.trim($("#systemLdapServerMailAttribute").val()),
		description : $.trim($("#systemLdapServerDescriptionAttribute").val())
	};

	var text = $("#systemLdapServerOtherSettings").val();
	if(text != null && text != "")
	{
		var lines = text.split("\n");
		for(var i=0; i<lines.length; i++)
		{
			var line = $.trim(lines[i]);
			if(line == "")
			{
				continue;
			}
			var pos = line.indexOf("=");
			if(pos <= 0)
			{
				gLdapExtraSettingsError = _Lang("其他设置格式错误：") + "[" + line + "] " + _Lang("应为 键=值");
				return advanced;
			}
			advanced.extraSettings[$.trim(line.substring(0, pos))] = $.trim(line.substring(pos + 1));
		}
	}
	return advanced;
}

function saveSystemLdapServerEdit(){
	var server = collectSystemLdapServerEdit();
	var error = validateSystemLdapServer(server);
	if(error != null){
		showErrorMessage(error);
		return;
	}
	//apply 内部会立即落盘：成功才关面板，失败则保留当前表单并回显错误
	applySystemLdapServerEditResult(server);
}

//测试连接：用表单里的当前值（后端渲染串 + ldapTest.do 解析/登录测试）
function testSystemLdapServerEdit(){
	var server = collectSystemLdapServerEdit();
	var error = validateSystemLdapServer(server);
	if(error != null){
		showErrorMessage(error);
		return;
	}
	testSystemLdapServerObj(server, $("#systemLdapServerTestResult"), $("#btnTestSystemLdapServer"));
}

//页面初始化
$(function(){
	console.log("systemLdapServerEdit page init");
});
