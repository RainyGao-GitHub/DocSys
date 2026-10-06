//导出用户（用户管理 → 导出 → 选格式）：CSV / Excel
//注意：本文件随弹窗加载，函数名 exportUserList 曾定义在 main.js（已移除），避免重名歧义
function exportUserList(format)
{
	console.log("exportUserList format:" + format + " userSearchWord:" + userSearchWord);

	$("#exportUser .modal-body button").attr("disabled", true);
	$("#exportUserProgress").text(_Lang("正在导出，请稍等..."));

	$.ajax({
        url : "/DocSystem/Bussiness/exportUserList.do",
        type : "post",
        dataType : "json",
        data : {
            //按当前搜索条件导出全部（服务端不分页）
            searchWord : userSearchWord,
            //导出顺序跟随列表当前排序
            sortField : userSortField,
            sortOrder : userSortOrder,
            format : format,
            lang : (langExt == "_en") ? "en" : "ch"
        },
        success : function (ret) {
        	console.log("exportUserList ret", ret);
        	$("#exportUser .modal-body button").attr("disabled", false);
        	$("#exportUserProgress").text("");
            if( "ok" == ret.status )
            {
            	//服务端已生成文件并返回下载链接（文件名带时间戳）
            	window.location.href = ret.data;
            	$("#exportUser").modal("hide");
            }
            else
            {
                console.log(ret.msgInfo);
	        	showErrorMessage(_Lang("导出用户列表失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	$("#exportUser .modal-body button").attr("disabled", false);
        	$("#exportUserProgress").text("");
        	showErrorMessage(_Lang("导出用户列表失败", ":", "服务器异常"));
        }
    });
}
