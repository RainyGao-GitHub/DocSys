//短信服务「发送测试短信」对话框
//依赖 main.js 中的：collectSystemSmsFormData（读取短信服务表单的当前值）

function SystemSmsTestSendPageInit()
{
	console.log("SystemSmsTestSendPageInit()");
	EnterKeyListenerForSystemSmsTestSend();
}

//回车键发送（Ctrl+Enter）
//注意：弹窗页面是多次插入的，监听必须**幂等**（否则多次打开会让一次回车发多条短信）
function EnterKeyListenerForSystemSmsTestSend(){
	$(document).off("keypress.systemSmsTestSend").on("keypress.systemSmsTestSend", function(event){
		var keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
		if(keyCode == 13 && event.ctrlKey){
			sendSystemSmsTest();
		}
	});
}

function closeSystemSmsTestSendModal(){
	$("#systemSmsTestSend").modal("hide");
}

function sendSystemSmsTest(){
	console.log("sendSystemSmsTest()");

	var phone = $.trim($("#systemSmsTestPhone").val());
	if(phone == ""){
		showErrorMessage(_Lang("请填写接收测试短信的手机号"));
		return;
	}

	//表单处于只读状态时 collectSystemSmsFormData 会跳过所有字段 → 服务端改用已保存的配置
	var data = collectSystemSmsFormData();
	data.push({name : "phone", value : phone});

	var $btn = $("#btnSendSystemSmsTest");
	$btn.attr("disabled", true);
	$("#systemSmsTestResult").empty();

	$.ajax({
		url : "/DocSystem/Manage/testSystemSmsConfig.do",
		type : "post",
		dataType : "json",
		data : data,
		success : function (ret) {
			$btn.attr("disabled", false);
			if( "ok" == ret.status ){
				renderSystemSmsTestResult(ret.data, null);
				showErrorMessage(_Lang("测试短信已发出，请核对手机"));
			}else{
				renderSystemSmsTestResult(ret.data, ret.msgInfo);
				showErrorMessage(_Lang("发送测试短信失败", ":", ret.msgInfo));
			}
		},
		error : function () {
			$btn.attr("disabled", false);
			renderSystemSmsTestResult(null, _Lang("服务器异常"));
			showErrorMessage(_Lang("发送测试短信失败", ":", "服务器异常"));
		}
	});
}

//渲染发送结果：成功回显运营商/返回码/返回信息/耗时/验证码 + 运营商原始响应；失败回显原因 + 原始响应
function renderSystemSmsTestResult(data, errorMsg){
	var $box = $("#systemSmsTestResult");
	$box.empty();

	if(errorMsg != null && errorMsg != ""){
		$box.append($("<div class='alert alert-danger'></div>").text(errorMsg));
		appendSystemSmsRaw($box, data);	//失败时也要看到返回码与原始响应，否则只剩一句无从下手的话
		return;
	}
	if(data == null){
		return;
	}

	$box.append($("<div class='alert alert-success'></div>").text(_Lang("发送成功")));

	appendSystemSmsTestLine($box, _Lang("运营商"), data.provider);
	appendSystemSmsTestLine($box, _Lang("返回码"), data.providerCode);
	appendSystemSmsTestLine($box, _Lang("返回信息"), data.providerMsg);
	appendSystemSmsTestLine($box, _Lang("耗时"), data.elapsedMs + " ms");
	if(data.code){
		appendSystemSmsTestLine($box, _Lang("验证码"), data.code);
	}

	appendSystemSmsRaw($box, data);
}

//运营商原始响应（成功与失败都展示；失败时它往往就是真正的原因）
function appendSystemSmsRaw($box, data){
	if(data == null || !data.raw){
		return;
	}
	if(data.providerCode != null && data.providerCode != ""){
		appendSystemSmsTestLine($box, _Lang("返回码"), data.providerCode);
	}
	if(data.providerMsg != null && data.providerMsg != ""){
		appendSystemSmsTestLine($box, _Lang("返回信息"), data.providerMsg);
	}
	$box.append($("<div class='help-block'></div>").text(_Lang("运营商原始响应") + "："));
	$box.append($("<pre style='max-height:160px;overflow:auto;white-space:pre-wrap;word-break:break-all;'></pre>")
		.text(data.raw));
}

function appendSystemSmsTestLine($box, label, value){
	var text = label + "：" + ((value == null || value == "") ? "-" : value);
	$box.append($("<div></div>").text(text));
}

//页面初始化
$(function(){
	SystemSmsTestSendPageInit();
});
