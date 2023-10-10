var gReposId;
	
function manageReposMemberPageInit(reposId)
{
	console.log("manageReposMemberPageInit reposId:" + reposId);
	gReposId = reposId;
		
	showReposAllUserList(reposId);		
}


var reposMemberSearchWord = "";
function searchReposMember()
{
	reposMemberSearchWord =  $("#search-reposMember").val();
	showReposAllUserList(gReposId);
}

function showReposAllUserList(reposId){
   	console.log("showReposAllUserList() reposId:"+reposId);
 
   	$.ajax({
            url : "/DocSystem/Manage/getReposAllUsers.do",
            type : "post",
            dataType : "json",
            data : {
            	searchWord: reposMemberSearchWord,
            	reposId:reposId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                	console.log("reposAllUsers:",ret.data);
                	var memberList = ret.data;
                	ReposMemberListDisplay(reposId,memberList);
                }
                else
                {
                	alert(_Lang("获取用户列表失败", ":", ret.msgInfo));
                }
            },
            error : function () {
               alert(_Lang("获取用户列表失败", ":", '服务器异常'));
            }
    });
}

function ReposMemberListDisplay(reposId,list)
{
	console.log("ReposMemberListDisplay", reposId);	
	$Func.render($("#reposMemberContainer"),"reposMember" + langExt,{"list":list,"reposId":reposId});
}

function addReposMember(userId,reposId)
{
   	console.log("addReposMember userId:" + userId+ " reposId:" + reposId);
   
    $.ajax({
            url : "/DocSystem/Repos/configReposAuth.do",
            type : "post",
            dataType : "json",
            data : {
            	userId: userId,
                reposId : reposId,
                access: 1,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                	showReposAllUserList(reposId);		//更新显示
                }
                else
                {
                	showErrorMessage(_Lang("获取用户列表失败", ":", ret.msgInfo));
                }
            },
            error : function () {
               showErrorMessage(_Lang('获取用户列表失败', ":", "服务器异常"));
            }
    });
}


function delReposMemberConfirm(id,userId,reposId)
{
	qiao.bs.confirm({
 	    	id: 'delReposMemeberConfirm',
 	        msg: _Lang("是否删除该成员?"),
 	        close: false,		
 	        title: _Lang("确认"),
 	        okbtn: _Lang("删除"),
 	        qubtn: _Lang("取消"),
 	    },function () {
 	    	//alert("点击了确定");
 	    	delReposMemeber(id,userId,reposId);
 	    	return true;   
 	    },function(){
 	    	//alert("点击了取消");
 	    	return true;
 	    }); 
}

function delReposMemeber(id,userId,reposId)
{	
   	console.log("deleteReposMember() id:" + id + " reposId:" + reposId + " userId:" + userId);
   	
    $.ajax({
            url : "/DocSystem/Repos/deleteReposAuth.do",
            type : "post",
            dataType : "json",
            data : {
            	reposAuthId: id,
                reposId: reposId,
                userId: userId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                	showReposAllUserList(reposId);
                }
                else
                {
                	showErrorMessage(_Lang('删除成员失败', ":", ret.msgInfo));
                }
            },
            error : function () {
               showErrorMessage(_Lang('删除成员失败', ":", "服务器异常"));
            }
    });
}
