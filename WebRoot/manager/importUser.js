//用户批量导入（用户管理 → 批量导入）
//文件名与结果只在本次弹窗生命周期内使用，不进列表渲染，因此不需要跨渲染保持状态
var gImportUserFileName = "";

//选择文件（隐藏的 input 在 main.html 里，与其它导入保持一致）
function importUserSelectFile()
{
	$("#importUserFiles").val("");	//清空以便重复选择同一个文件
	$("#importUserFiles").click();
}

function importUserFileChanged(event)
{
	var files = event.target.files;
	if(!files || files.length == 0)
	{
		return;
	}
	var file = files[0];
	var name = file.name || "";
	if(!/\.(csv|xls|xlsx|et|ett)$/i.test(name))
	{
		gImportUserFileName = "";
		$("#importUserFileName").text(_Lang("未选择文件"));
		showErrorMessage(_Lang("只支持 CSV / XLS / XLSX / ET 文件"));
		return;
	}
	gImportUserFileName = name;
	$("#importUserFileName").text(name);
}

//下载导入模板（服务端生成，列头与别名表同源）
function downloadUserImportTemplate()
{
	fetch("/DocSystem/Manage/downloadUserImportTemplate.do", {
		method : "get",
		headers : {
			//与 jQuery ajax 保持一致：MyInterceptor 对「非 ajax 且未登录」的请求会 302 到 tologin.do
			"X-Requested-With" : "XMLHttpRequest"
		},
		credentials : "same-origin"
	}).then(function(res){
		var contentType = res.headers.get("Content-Type") || "";
		if(contentType.indexOf("text/csv") < 0)
		{
			//非 CSV = 服务端拒绝（未登录/无权限），尽量把文案展示出来
			return res.text().then(function(text){
				var msg = text || "";
				try {
					var ret = JSON.parse(msg);
					if(ret && ret.msgInfo){ msg = ret.msgInfo; }
				} catch(e) {
					if(msg && msg.indexOf("<") == 0){ msg = _Lang("登录状态可能已失效，请重新登录后再试"); }
				}
				showErrorMessage(_Lang("下载失败", " : ", msg));
			});
		}
		var fileName = "userImportTemplate.csv";
		var disposition = res.headers.get("Content-Disposition") || "";
		var match = disposition.match(/filename="?([^";]+)"?/);
		if(match && match[1]){
			fileName = match[1];
		}
		return res.blob().then(function(blob){
			downloadBlobAsFile(blob, fileName);
		});
	}).catch(function(){
		showErrorMessage(_Lang("下载失败", " : ", "服务器异常"));
	});
}

//开始导入：FormData + XHR（与「证书导入」同一套路），服务端逐行处理并回结果
function startImportUser()
{
	var input = document.getElementById("importUserFiles");
	if(!gImportUserFileName || !input || !input.files || input.files.length == 0)
	{
		showErrorMessage(_Lang("请先选择要导入的文件"));
		return;
	}
	var file = input.files[0];

	$("#importUserResultGroup").hide();
	$("#importUserResultBody").empty();
	$("#importUserResultSummary").text("");
	$("#btn_importUser").attr("disabled", true);
	$("#importUserProgress").text(_Lang("正在导入，请稍等..."));

	var form = new FormData();
	form.append("uploadFile", file);

	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if(xhr.readyState != 4)
		{
			return;
		}
		$("#btn_importUser").attr("disabled", false);
		$("#importUserProgress").text("");

		if(xhr.status != 200)
		{
			showErrorMessage(_Lang("导入失败", " : ", "服务器异常"));
			return;
		}
		var ret = null;
		try {
			ret = JSON.parse(xhr.responseText);
		} catch(e) {
			showErrorMessage(_Lang("导入失败", " : ", "服务器返回异常"));
			return;
		}
		if("ok" != ret.status)
		{
			showErrorMessage(_Lang("导入失败", " : ", ret.msgInfo));
			return;
		}
		importUserResultDisplay(ret.data);
		showUserList(0);	//刷新用户列表
	};

	xhr.open("post", "/DocSystem/Manage/importUserList.do");
	//必须带：否则未登录时会被 MyInterceptor 重定向成 404 HTML（见日志导出的同类问题）
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(form);
}

//结果展示：摘要 + 明细（失败在前、跳过在后）
function importUserResultDisplay(data)
{
	if(!data)
	{
		showErrorMessage(_Lang("导入失败", " : ", "服务器返回异常"));
		return;
	}

	var summary = _Lang("导入完成") + "：" + _Lang("共") + " " + data.total
		+ "，" + _Lang("成功") + " " + data.success
		+ "，" + _Lang("跳过") + " " + data.skipped
		+ "，" + _Lang("失败") + " " + data.failed;
	$("#importUserResultSummary").text(summary);

	var body = $("#importUserResultBody");
	body.empty();

	var items = [];
	if(data.errors){
		for(var i = 0; i < data.errors.length; i++){
			items.push({status : _Lang("失败"), row : data.errors[i].row, name : data.errors[i].name, reason : data.errors[i].reason});
		}
	}
	if(data.skippedRows){
		for(var j = 0; j < data.skippedRows.length; j++){
			items.push({status : _Lang("跳过"), row : data.skippedRows[j].row, name : data.skippedRows[j].name, reason : data.skippedRows[j].reason});
		}
	}

	for(var k = 0; k < items.length; k++)
	{
		var item = items[k];
		var tr = $("<tr></tr>");
		tr.append($("<td></td>").text(item.row));
		tr.append($("<td></td>").text(item.status));
		tr.append($("<td></td>").text(item.name));
		tr.append($("<td></td>").text(item.reason));
		body.append(tr);
	}

	$("#importUserResultGroup").show();

	showErrorMessage(summary);
}
