//根据id关闭对话框
function closeBootstrapDialog(id){ 
	$("#"+id + "div").remove();	//删除全屏遮罩
	$("#"+id).remove();	//删除对话框
}

function showErrorMessage($msg) {
	qiao.bs.alert($msg);
}