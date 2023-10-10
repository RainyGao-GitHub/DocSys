function AddUserPageInit()
{
	console.log("addUserPageInit()");
	EnterKeyListenerForAddUser();
}

function showAddUserModal(text){
	$(".addUserModal").fadeIn("slow");
	$("#name").focus();
}

function closeAddUserModal(){
	$(".addUserModal").fadeOut("slow");
}

//回车键监听函数
function EnterKeyListenerForAddUser(){
	console.log("start enter key listener");
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		addUser();
 	}  
}

function addUser(obj,event){
	console.log("addUser()");
	
	//Disable the obj
	$(obj).attr("disabled",true);
	
	var name = $("#name").val();
    var realName = $("#realName").val();
    var tel = $("#tel").val();
    var email = $("#email").val();
    var pwd =  $("#pwd").val();
    var type =  $("#type").val();
    
    console.log(name,realName,pwd,type);
    
    $.ajax({
        url : "/DocSystem/Manage/addUser.do",
        type : "post",
        dataType : "json",
        data : {
             name : name,
             realName : realName,
             tel: tel,
             email : email,
             type : type,
             pwd : MD5(pwd),
        },
        success : function (ret) {
    		//Enable the obj
    		$(obj).attr("disabled",false);

            if( "ok" == ret.status ){
            	showUserList(gPageIndex);	//刷新UserList
            	showErrorMessage(_Lang("新增成功"));
            }else {
            	showErrorMessage(_Lang("新增失败", ":", ret.msgInfo));
            }
        },
        error : function () {
    		//Enable the obj
    		$(obj).attr("disabled",false);

    		showErrorMessage(_Lang("新增失败", ":", "服务器异常"));
        }
    });
}

//页面初始化代码    
$(function(){
	console.log("addUser Page init");
	AddUserPageInit();
	$("#name").click().focus();
});