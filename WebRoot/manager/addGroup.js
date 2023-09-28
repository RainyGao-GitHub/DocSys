function AddGroupPageInit()
{
	console.log("addGroupPageInit()");
	EnterKeyListenerForAddGroup();
}

function showAddGroupModal(text){
	$(".addGroupModal").fadeIn("slow");
	$("#name").focus();
}

function closeAddGroupModal(){
	$(".addGroupModal").fadeOut("slow");
}

//回车键监听函数
function EnterKeyListenerForAddGroup(){
	console.log("start enter key listener");
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		addGroup();
 	}  
}

function addGroup(){
	console.log("addGroup()");

	var name = $("#name").val();
    var info = $("#info").val();
    
    console.log(name,info);
    
    $.ajax({
        url : "/DocSystem/Manage/addGroup.do",
        type : "post",
        dataType : "json",
        data : {
             name : name,
             info : info,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	showGroupList();	//刷新GroupList
            	alert("新增成功");
            }else {
            	alert("错误：" + ret.msgInfo);
            }
        },
        error : function () {
        	alert("服务器异常:新增失败");
        }
    });
}

//页面初始化代码    
$(function(){
	console.log("addGroup Page init");
	AddGroupPageInit();
	$("#name").click().focus();
});
