function EditUserPageInit()
{
	console.log("EditUserPageInit()");
	EnterKeyListenerForEditUser();
}

function showEditUserModal(text){
	$(".editUserModal").fadeIn("slow");
	$("#name").focus();
}

function closeEditUserModal(){
	$(".editUserModal").fadeOut("slow");
}

//回车键监听函数
function EnterKeyListenerForEditUser(){
	console.log("start enter key listener");
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		editUser();
 	}  
}

function editUser(){
	console.log("editUser()");

	var id =  $("#userId").val();
	var name = $("#name").val();
    var realName = $("#realName").val();
    var tel = $("#tel").val();
    var email = $("#email").val();
    //var pwd =  $("#pwd").val();
    var type =  $("#type").val();
    
    console.log("editUser()",id, name, realName, type);
    
    $.ajax({
        url : "/DocSystem/Manage/editUser.do",
        type : "post",
        dataType : "json",
        data : {
        	 id : id,
             name : name,
             realName : realName,
             tel : tel,
             email: email,
             type : type,
             //pwd : MD5(pwd),
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	showUserList(gPageIndex);	//刷新UserList
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
	console.log("editUser Page init");
	EditUserPageInit();
	$("#name").click().focus();
});