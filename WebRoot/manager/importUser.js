//用户批量导入（用户管理 → 批量导入）
//文件名与结果只在本次弹窗生命周期内使用，不进列表渲染，因此不需要跨渲染保持状态
var gImportUserFileName = "";
var gImportUserResult = null;		//服务端返回的完整结果（用于下载明细）
var gImportUserDetailItems = [];	//面板里展示的明细（失败在前、跳过在后）

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
	$("#btn_exportImportUserDetail").hide();
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

	//保留结果供「下载失败明细」用（明细上限与导入行数上限一致，服务端不会截断）
	gImportUserResult = data;
	gImportUserDetailItems = items;
	$("#btn_exportImportUserDetail").toggle(items.length > 0);

	$("#importUserResultGroup").show();

	showErrorMessage(summary);
}

//下载明细 CSV（失败 + 跳过；UTF-8 + BOM，标准转义）
function exportImportUserDetailCsv()
{
	var items = gImportUserDetailItems || [];
	if(items.length == 0)
	{
		showErrorMessage(_Lang("没有需要下载的明细"));
		return;
	}

	var lines = [];
	lines.push(importUserCsvLine([_Lang("行号"), _Lang("状态"), _Lang("账号"), _Lang("原因")]));
	for(var i=0; i<items.length; i++)
	{
		lines.push(importUserCsvLine([items[i].row, items[i].status, items[i].name, items[i].reason]));
	}

	//\ufeff(BOM) 让 Excel 双击打开不乱码
	var blob = new Blob(["\ufeff" + lines.join("\r\n")], {type : "text/csv;charset=utf-8"});
	var now = new Date();
	var fileName = "userImportResult_" + now.getFullYear() + importUserPad2(now.getMonth()+1) + importUserPad2(now.getDate())
		+ importUserPad2(now.getHours()) + importUserPad2(now.getMinutes()) + importUserPad2(now.getSeconds()) + ".csv";
	downloadBlobAsFile(blob, fileName);	//复用 main.js 的工具函数
}

//标准 CSV 转义：含 , " CR LF 时用双引号包裹，内部 " 变 ""
function importUserCsvField(value)
{
	var v = (value == null) ? "" : String(value);
	if(v.indexOf(",") >= 0 || v.indexOf("\"") >= 0 || v.indexOf("\r") >= 0 || v.indexOf("\n") >= 0)
	{
		return "\"" + v.replace(/\"/g, "\"\"") + "\"";
	}
	return v;
}

function importUserCsvLine(values)
{
	var out = [];
	for(var i=0; i<values.length; i++)
	{
		out.push(importUserCsvField(values[i]));
	}
	return out.join(",");
}

function importUserPad2(n)
{
	return (n < 10 ? "0" : "") + n;
}
