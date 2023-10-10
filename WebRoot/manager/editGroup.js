function EditGroupPageInit()
{
	console.log("EditGroupPageInit()");
	EnterKeyListenerForEditGroup();
}

function showEditGroupModal(text){
	$(".editGroupModal").fadeIn("slow");
	$("#name").focus();
}

function closeEditGroupModal(){
	$(".editGroupModal").fadeOut("slow");
}

//回车键监听函数
function EnterKeyListenerForEditGroup(){
	console.log("start enter key listener");
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		editGroup();
 	}  
}

function editGroup(){
	console.log("editGroup()");

	var id =  $("#groupId").val();
	var name = $("#name").val();
    var info = $("#info").val();
    
    console.log(name,info);
    
    $.ajax({
        url : "/DocSystem/Manage/editGroup.do",
        type : "post",
        dataType : "json",
        data : {
        	 id : id,
             name : name,
             info : info,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	showGroupList();	//刷新GroupList
            	alert(_Lang("更新成功"));
            }else {
            	alert(_Lang("更新失败", ":", ret.msgInfo));
            }
        },
        error : function () {
        	alert(_Lang("更新失败", ":", "服务器异常"));
        }
    });
}

//页面初始化代码    
$(function(){
	console.log("editGroup Page init");
	EditGroupPageInit();
	$("#name").click().focus();
});