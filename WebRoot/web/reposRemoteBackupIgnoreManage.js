var RemoteBackupIgnoreMange = (function () {
    /*全局变量*/
    var reposId;
	
	function reposRemoteBackupIgnoreMangePageInit(_reposId)
	{
		console.log("reposRemoteBackupIgnoreMangePageInit _reposId:" + _reposId);
		reposId = _reposId;
		showReposRemoteBackupIngoreList();		
	}
	
	function addDocToRemoteBackupIgnoreList()
	{
		console.log("addDocToRemoteBackupIgnoreList() ignorePath:" + ignorePath);
		var node = {};
		node.path =  $("#ignorePath").val();
		node.name = "";
		console.log("addDocToRemoteBackupIgnoreList() path:" + node.path + "name:" + node.name);
		setRemoteBackupIgnore(node, 1);
	}
	
	function removeDocFromRemoteBackupIgnoreList(index)
	{
		console.log("removeDocFromRemoteBackupIgnoreList() index:" + index);
		var node = {};
		node.path = $("#IgnoreEntrySelect" + index).val();
		node.name = "";
		console.log("removeDocFromRemoteBackupIgnoreList() path:" + node.path + "name:" + node.name);
		setRemoteBackupIgnore(node, 0);
	}

	function setRemoteBackupIgnore(node, ignore)
	{
		console.log("setRemoteBackupIgnore()");
	    $.ajax({
	        url : "/DocSystem/Doc/setRemoteBackupIgnore.do",
	        type : "post",
	        dataType : "json",
	        data : {
	            reposId : gReposId,
	        	path: node.path,
	        	name: node.name,
	        	ignore: ignore,
	        },
	        success : function (ret) {
	            if( "ok" == ret.status ){
					//刷新列表
					showReposRemoteBackupIngoreList();
	            	bootstrapQ.msg({
							msg : _Lang('设置成功！'),
							type : 'success',
							time : 2000,
						    });
	            }
	            else
	            {
	            	showErrorMessage(_Lang("设置失败", ":", ret.msgInfo));
	            }
	        },
	        error : function () {
	           	showErrorMessage(_Lang('设置失败', ':', '服务器异常'));
	        }
		});
	}
	
	function showReposRemoteBackupIngoreList(){
	   	console.log("showReposRemoteBackupIngoreList() reposId:" + reposId);
	   	var path = "";
	   	var name = "";
	   	
	    $.ajax({
	            url : "/DocSystem/Doc/getRemoteBackupIgnoreList.do",
	            type : "post",
	            dataType : "json",
	            data : {
	                reposId : reposId,
	                path : path,
	                name : name,
	            },
	            success : function (ret) {
	            	console.log("getRemoteBackupIgnoreList ret:", ret);
	                if( "ok" == ret.status ){
	                    showList(ret.data);
	                }
	                else
	                {
	                	alert(_Lang("获取异地备份忽略列表失败", ":", ret.msgInfo));
	                }
	            },
	            error : function () {
	               alert(_Lang('获取异地备份忽略列表失败', ':', '服务器异常'));
	            }
    	});

		//绘制列表
		function showList(data){
			console.log(data);
			var c = $("#reposRemoteBackupIgnoreList").children();
			$(c).remove();
			if(data.length==0){
				$("#reposRemoteBackupIgnoreList").append("<p>" + _Lang("暂无数据") + "</p>");
			}
			
			for(var i=0;i<data.length;i++){
				var d = data[i];
				var opBtn = "		<a href='javascript:void(0)' onclick='RemoteBackupIgnoreMange.removeDocFromRemoteBackupIgnoreList(" + i + ");' class='mybtn-primary'>" + _Lang("移除") + "</a>";
													
				var se = "<li value="+ i +">"
					+"	<i class='cell select w5'>"
					+"		<input class='IgnoreEntrySelect' id='IgnoreEntrySelect"+i+"' value='" + d.path + d.name + "' type='checkbox' onclick='onSelectIgnoreItem()'/>"
					+"	</i> "
					+"	<i class='cell path w15'>"
					+"		<span class='path'>"
					+"			<a id='IgnoreEntry"+i+"' href='javascript:void(0)'>/" + d.path + d.name + "</a>"
					+"		</span>"
					+"	</i>"
					+"	<i class='cell status w15'>"
					+"		<span class='status'>"
					+"			<a id='IgnoreEntryStatus"+i+"' href='javascript:void(0)'>" + _Lang("备份已关闭") + "</a>"
					+"		</span>"
					+"	</i>"
					+"	<i class='cell operation w10'>"
					+		opBtn
					+"	</i>"
					+"</li>";				
				$("#reposRemoteBackupIgnoreList").append(se);
			}
		}
	}
	//开放给外部的调用接口
    return {
        init: function(_reposId){
        	reposRemoteBackupIgnoreMangePageInit(_reposId);
        },
        addDocToRemoteBackupIgnoreList: function(){
        	addDocToRemoteBackupIgnoreList();
        },
        removeDocFromRemoteBackupIgnoreList: function(index){
        	removeDocFromRemoteBackupIgnoreList(index);
        },
    };
})();