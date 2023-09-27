function sharePreferLinkPageInit(_preferLinkInfo)
{
	console.log("sharePreferLinkPageInit");
	SharePreferLink.init(_preferLinkInfo);
}

function searchPreferLinkAccessUser()
{
	var userSearchWord =  $("#search-preferLinkAccessUser").val();
	console.log("searchPreferLinkAccessUser() userSearchWord:" + userSearchWord);
	SharePreferLink.searchPreferLinkAccessUser(userSearchWord);
}

var SharePreferLink = (function () {
	var preferLinkInfo;
	var userSearchWord;
	var accessUserMap = {};

	function init(_preferLinkInfo)
	{
		console.log("SharePreferLink.init() _preferLinkInfo:", _preferLinkInfo);
		if(_preferLinkInfo)
		{
			preferLinkInfo = _preferLinkInfo;
			initAccessUserMap();
			showPreferLinkAllUserList();
		}
	}

	function initAccessUserMap()
	{
		accessUserMap = {};
		var accessUsers = preferLinkInfo.accessUserIds;
		if(accessUsers && accessUsers != "")
		{
			//split accessUsers Str to array
			var userArr = accessUsers.split(",");
			for(var i=0;i<userArr.length;i++)
			{
				var userId = userArr[i];
				if(userId != "")
				{
					console.log("initAccessUserMap() userId:" + userId);
					accessUserMap[userId] = true;
				}
			}
		}
	}

	function searchPreferLinkAccessUser(_userSearchWord)
	{
		userSearchWord = _userSearchWord;
		console.log("searchPreferLinkAccessUser() userSearchWord:" + userSearchWord);
		showPreferLinkAllUserList();
	}

	function showPreferLinkAllUserList(){
		console.log("showPreferLinkAllUserList() userSearchWord:" + userSearchWord);

		$.ajax({
			url : "/DocSystem/Bussiness/getPreferLinkAccessUsers.do",
			type : "post",
			dataType : "json",
			data : {
				searchWord: userSearchWord,
				preferLinkId : preferLinkInfo.id,
			},
			success : function (ret) {
				console.log("getPreferLinkAccessUsers ret", ret);
				if( "ok" == ret.status ){
					showUserList(ret.data);
				}
				else
				{
					showErrorMessage({
	            		id: "idAlertDialog",	
	            		title: _Lang("提示"),
	            		okbtn: _Lang("确定"),
	            		msg: _Lang("获取用户列表失败", " : ", ret.msgInfo),
	            	});
				}
			},
			error : function () {
				showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang('获取用户列表失败', " : ", "服务器异常"),
            	});
			}
		});

		function isAccessUser(userId)
		{
			if(undefined == userId)
			{
				return false;
			}

			var ret = accessUserMap[userId];
			if (undefined == ret)
			{
				return false;
			}

			return true;
		}

		//根据获取到的目录权限用户列表数据，绘制列表
		function showUserList(data){
			//console.log(data);
			var c = $("#preferLinkAccessUsers").children();
			$(c).remove();
			if(data.length==0){
				$("#preferLinkAccessUsers").append("<p>" + _Lang("暂无数据") + "</p>");
			}

			for(var i=0;i<data.length;i++){
				var d = data[i];
				//任意用户需要翻译
				if(d.id == 0)
				{
					d.name = _Lang(d.name);
					d.realName = _Lang(d.realName);
				}
				
				var opBtn = "		<a href='javascript:void(0)' onclick='SharePreferLink.addPreferLinkAccessUser(" + d.id + ");' class='mybtn-primary'>" + _Lang("添加") + "</a>";
				if(isAccessUser(d.id)) //已是访问用户的，操作按键显示为，已添加
				{
					opBtn = "		<a href='javascript:void(0)' class='mybtn' onclick='SharePreferLink.deletePreferLinkAccessUserConfirm(" + d.id + ");' disabled='disabled'>" + _Lang("移除") + "</a>";
				}

				var se = "<li value="+ i +">"
						+"	<i class='cell username w15'>"
						+"		<span class='name'>"
						+"			<a id='UserName"+i+"' href='javascript:void(0)'>"+d.name+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell realname w15'>"
						+"		<span class='name'>"
						+"			<a id='RealName"+i+"' href='javascript:void(0)'>"+d.realName+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell operation w10'>"
						+		opBtn
						+"	</i>"
						+"</li>";

				$("#preferLinkAccessUsers").append(se);
			}
		}
	}

	function addPreferLinkAccessUser(userId)
	{
		console.log("addPreferLinkAccessUser(" + userId+")");

		$.ajax({
			url : "/DocSystem/Bussiness/configPreferLinkAccessUser.do",
			type : "post",
			dataType : "json",
			data : {
				userId: userId,
				preferLinkId : preferLinkInfo.id,
				access: 1,
			},
			success : function (ret) {
				console.log("addPreferLinkAccessUser ret", ret);
				if( "ok" == ret.status ){
					preferLinkInfo.accessUserIds = ret.data;
					initAccessUserMap();
					showPreferLinkAllUserList();		//更新显示
				}
				else
				{
					showErrorMessage({
	            		id: "idAlertDialog",	
	            		title: _Lang("提示"),
	            		okbtn: _Lang("确定"),
	            		msg: _Lang("获取仓库用户列表失败", " : ", ret.msgInfo),
	            	});
				}
			},
			error : function () {
				showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("获取仓库用户列表失败", " : ", "服务器异常"),
            	});
			}
		});
	}


	function deletePreferLinkAccessUserConfirm(userId)
	{
		qiao.bs.confirm({
			id: 'deletePreferLinkAccessUserConfirm',
			title: _Lang("确认操作"),
			msg: _Lang("是否删除该用户的访问权限") + "?",
			close: false,
			okbtn: _Lang("删除"),
			qubtn: _Lang("取消"),
		},function () {

			//alert("点击了确定");
			deletePreferLinkAccessUser(userId);
			return true;
		},function(){
			//alert("点击了取消");
			return true;
		});
	}

	function deletePreferLinkAccessUser(userId)
	{
		console.log("deletePreferLinkAccessUser()");

		$.ajax({
			url : "/DocSystem/Bussiness/configPreferLinkAccessUser.do",
			type : "post",
			dataType : "json",
			data : {
				userId: userId,
				preferLinkId : preferLinkInfo.id,
				access: 0,
			},
			success : function (ret) {
				console.log("deletePreferLinkAccessUser ret", ret);
				if( "ok" == ret.status ){
					preferLinkInfo.accessUserIds = ret.data;
					initAccessUserMap();
					showPreferLinkAllUserList();		//更新显示
				}
				else
				{
					showErrorMessage({
	            		id: "idAlertDialog",	
	            		title: _Lang("提示"),
	            		okbtn: _Lang("确定"),
	            		msg: _Lang("移除失败", " : ", ret.msgInfo),
	            	});
				}
			},
			error : function () {
				showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("移除失败", " : ", "服务器异常"),
				});
			}
		});
	}

	//开放给外部的调用接口
	return {
		init: function(_preferLinkInfo, _callback){
			init(_preferLinkInfo, _callback);
		},
		searchPreferLinkAccessUser: function(userSearchWord){
			searchPreferLinkAccessUser(userSearchWord);
		},
		addPreferLinkAccessUser: function(userId){
			addPreferLinkAccessUser(userId);
		},
		deletePreferLinkAccessUserConfirm: function(userId){
			deletePreferLinkAccessUserConfirm(userId);
		},
	};
})();

