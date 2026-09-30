//邮件服务「发送测试邮件」对话框
//依赖 main.js 中的：collectSystemMailFormData（读取邮件服务表单的当前值）

function SystemMailTestSendPageInit()
{
	console.log("SystemMailTestSendPageInit()");
	EnterKeyListenerForSystemMailTestSend();
}

//回车键发送（Ctrl+Enter）
//注意：弹窗页面是多次插入的，监听必须**幂等**（否则多次打开会让一次回车发多封邮件）
function EnterKeyListenerForSystemMailTestSend(){
	$(document).off("keypress.systemMailTestSend").on("keypress.systemMailTestSend", function(event){
		var keyCode = event.keyCode ? event.keyCode : event.which ? event.which : event.charCode;
		if(keyCode == 13 && event.ctrlKey){
			sendSystemMailTest();
		}
	});
}

function closeSystemMailTestSendModal(){
	$("#systemMailTestSend").modal("hide");
}

function sendSystemMailTest(){
	console.log("sendSystemMailTest()");

	var toEmail = $.trim($("#systemMailTestToEmail").val());
	if(toEmail == ""){
		showErrorMessage(_Lang("请填写接收测试邮件的邮箱地址"));
		return;
	}

	//表单处于只读状态时 collectSystemMailFormData 会跳过所有字段 → 服务端改用已保存的配置
	var data = collectSystemMailFormData();
	data.push({name : "toEmail", value : toEmail});

	var $btn = $("#btnSendSystemMailTest");
	$btn.attr("disabled", true);
	$("#systemMailTestResult").empty();

	$.ajax({
		url : "/DocSystem/Manage/testSystemMailConfig.do",
		type : "post",
		dataType : "json",
		data : data,
		success : function (ret) {
			$btn.attr("disabled", false);
			if( "ok" == ret.status ){
				renderSystemMailTestResult(ret.data, null);
				showErrorMessage(_Lang("测试邮件已发出，请核对收件箱"));
			}else{
				renderSystemMailTestResult(null, ret.msgInfo);
				showErrorMessage(_Lang("发送测试邮件失败", ":", ret.msgInfo));
			}
		},
		error : function () {
			$btn.attr("disabled", false);
			renderSystemMailTestResult(null, _Lang("服务器异常"));
			showErrorMessage(_Lang("发送测试邮件失败", ":", "服务器异常"));
		}
	});
}

//渲染发送结果：成功回显发信方式/返回码/返回信息/耗时 + SMTP 原始响应；失败回显原因
function renderSystemMailTestResult(data, errorMsg){
	var $box = $("#systemMailTestResult");
	$box.empty();

	if(errorMsg != null && errorMsg != ""){
		$box.append($("<div class='alert alert-danger'></div>").text(errorMsg));
		return;
	}
	if(data == null){
		return;
	}

	$box.append($("<div class='alert alert-success'></div>").text(_Lang("发送成功")));

	appendSystemMailTestLine($box, _Lang("发信方式"), data.provider);
	appendSystemMailTestLine($box, _Lang("返回码"), data.providerCode);
	appendSystemMailTestLine($box, _Lang("返回信息"), data.providerMsg);
	appendSystemMailTestLine($box, _Lang("耗时"), data.elapsedMs + " ms");

	if(data.raw){
		$box.append($("<div class='help-block'></div>").text(_Lang("SMTP 原始响应") + "："));
		$box.append($("<pre style='max-height:160px;overflow:auto;white-space:pre-wrap;word-break:break-all;'></pre>")
			.text(data.raw));
	}
}

function appendSystemMailTestLine($box, label, value){
	var text = label + "：" + ((value == null || value == "") ? "-" : value);
	$box.append($("<div></div>").text(text));
}

//页面初始化
$(function(){
	SystemMailTestSendPageInit();
});
