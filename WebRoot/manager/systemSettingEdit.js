//系统参数 新增/编辑 对话框
//依赖 main.js 中的：gEditingSystemSettingName、showSystemSettingList、gPageIndex

function SystemSettingEditPageInit()
{
	console.log("SystemSettingEditPageInit()");
	EnterKeyListenerForSystemSettingEdit();
}

//回车键监听（与 addGroup/editUser 一致：esc 不处理，避免误关）
function EnterKeyListenerForSystemSettingEdit(){
	$(document).keypress(function(event){
		var keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
		if(keyCode == 13 && event.ctrlKey){
			saveSystemSetting();
		}
	});
}

function closeSystemSettingEditModal(){
	$("#systemSettingEdit").modal("hide");
}

function saveSystemSetting(){
	console.log("saveSystemSetting()");

	var name = $.trim($("#systemSettingName").val());
	var value = $("#systemSettingValue").val();
	var remark = $("#systemSettingRemark").val();

	if(name == ""){
		showErrorMessage(_Lang("配置名称不能为空"));
		return;
	}
	if(value == ""){
		showErrorMessage(_Lang("配置值不能为空"));
		return;
	}

	var $btn = $("#btn_saveSystemSetting");
	$btn.attr("disabled", true);

	$.ajax({
		url : "/DocSystem/SysConfig/set.do",
		type : "post",
		dataType : "json",
		data : {
			name : name,
			value : value,
			remark : remark
		},
		success : function (ret) {
			$btn.attr("disabled", false);
			if( "ok" == ret.status ){
				closeSystemSettingEditModal();
				showSystemSettingList(gPageIndex);	//刷新列表
				showErrorMessage(_Lang("保存成功"));
			}else{
				showErrorMessage(_Lang("保存失败", ":", ret.msgInfo));
			}
		},
		error : function () {
			$btn.attr("disabled", false);
			showErrorMessage(_Lang("保存失败", ":", "服务器异常"));
		}
	});
}

//页面初始化
$(function(){
	console.log("systemSettingEdit Page init");
	SystemSettingEditPageInit();
	$("#systemSettingName").click().focus();
});
