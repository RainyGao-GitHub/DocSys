var gGroupId;
	
function manageGroupMemberPageInit(groupId)
{
	console.log("manageGroupMemberPageInit groupId:" + groupId);
	gGroupId = groupId;
	showGroupAllUserList(groupId);		
}

var groupMemberSearchWord = "";
function searchGroupMember()
{
	groupMemberSearchWord =  $("#search-groupMember").val();
	showGroupAllUserList(gGroupId);
}

function showGroupAllUserList(groupId){
   	console.log("showGroupAllUserList() groupId:"+groupId);

   	$.ajax({
            url : "/DocSystem/Manage/getGroupAllUsers.do",
            type : "post",
            dataType : "json",
            data : {
            	searchWord: groupMemberSearchWord,
            	groupId:groupId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                	console.log("groupAllUsers:",ret.data);
                	var memberList = ret.data;
                	GroupMemberListDisplay(groupId,memberList);
                }
                else
                {
                	alert(_Lang("获取用户列表失败", ":", ret.msgInfo));
                }
            },
            error : function () {
               alert(_Lang('获取用户列表失败', ":", "服务器异常"));
            }
    });
}

function GroupMemberListDisplay(groupId,list)
{
	console.log("GroupMemberListDisplay", groupId);	
	$Func.render($("#groupMemberContainer"),"groupMember" + langExt,{"list":list,"groupId":groupId});
}

function addGroupMember(userId,groupId)
{
   	console.log("addGroupMember userId:" + userId+ " groupId:" + groupId);
   
    $.ajax({
            url : "/DocSystem/Manage/addGroupMember.do",
            type : "post",
            dataType : "json",
            data : {
            	userId: userId,
                groupId : groupId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                	showGroupAllUserList(groupId);		//更新显示
                }
                else
                {
                	showErrorMessage("Error:" + ret.msgInfo);
                }
            },
            error : function () {
               showErrorMessage(_Lang('获取用户列表失败', ":", "服务器异常"));
            }
    });
}


function delGroupMemberConfirm(id,userId,groupId)
{
	qiao.bs.confirm({
 	    	id: 'delGroupMemeberConfirm',
 	        msg: _Lang("是否删除该成员?"),
 	        close: false,		
 	        title: _Lang("确认"),
 	        okbtn: _Lang("删除"),
 	        qubtn: _Lang("取消"),
 	    },function () {
 	    	//alert("点击了确定");
 	    	delGroupMemeber(id,userId,groupId);
 	    	return true;   
 	    },function(){
 	    	//alert("点击了取消");
 	    	return true;
 	    }); 
}

function delGroupMemeber(id,userId,groupId)
{	
   	console.log("deleteGroupMember() id:" + id + " groupId:" + groupId + " userId:" + userId);
   	
    $.ajax({
            url : "/DocSystem/Manage/delGroupMember.do",
            type : "post",
            dataType : "json",
            data : {
            	id: id,
                groupId: groupId,
                userId: userId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                	showGroupAllUserList(groupId);
                }
                else
                {
                	showErrorMessage(_Lang("删除成员失败", ":" ,ret.msgInfo));
                }
            },
            error : function () {
               showErrorMessage(_Lang("删除成员失败", ":" , '服务器异常'));
            }
    });
}
