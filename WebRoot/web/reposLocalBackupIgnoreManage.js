var LocalBackupIgnoreMange = (function () {
    /*全局变量*/
    var reposId;
	
	function reposLocalBackupIgnoreMangePageInit(_reposId)
	{
		console.log("reposLocalBackupIgnoreMangePageInit _reposId:" + _reposId);
		reposId = _reposId;
		showReposLocalBackupIngoreList();		
	}
	
	function addDocToLocalBackupIgnoreList()
	{
		console.log("addDocToLocalBackupIgnoreList() ignorePath:" + ignorePath);
		var node = {};
		node.path =  $("#ignorePath").val();
		node.name = "";
		console.log("addDocToLocalBackupIgnoreList() path:" + node.path + "name:" + node.name);
		setLocalBackupIgnore(node, 1);
	}
	
	function removeDocFromLocalBackupIgnoreList(index)
	{
		console.log("removeDocFromLocalBackupIgnoreList() index:" + index);
		var node = {};
		node.path = $("#IgnoreEntrySelect" + index).val();
		node.name = "";
		console.log("removeDocFromLocalBackupIgnoreList() path:" + node.path + "name:" + node.name);
		setLocalBackupIgnore(node, 0);
	}

	function setLocalBackupIgnore(node, ignore)
	{
		console.log("setLocalBackupIgnore()");
	    $.ajax({
	        url : "/DocSystem/Doc/setLocalBackupIgnore.do",
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
					showReposLocalBackupIngoreList();
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
	
	function showReposLocalBackupIngoreList(){
	   	console.log("showReposLocalBackupIngoreList() reposId:" + reposId);
	   	var path = "";
	   	var name = "";
	   	
	    $.ajax({
	            url : "/DocSystem/Doc/getLocalBackupIgnoreList.do",
	            type : "post",
	            dataType : "json",
	            data : {
	                reposId : reposId,
	                path : path,
	                name : name,
	            },
	            success : function (ret) {
	            	console.log("getLocalBackupIgnoreList ret:", ret);
	                if( "ok" == ret.status ){
	                    showList(ret.data);
	                }
	                else
	                {
	                	alert(_Lang("获取本地备份忽略列表失败", ":", ret.msgInfo));
	                }
	            },
	            error : function () {
	               alert(_Lang("获取本地备份忽略列表失败", ":", "服务器异常"));
	            }
    	});

		//绘制列表
		function showList(data){
			console.log(data);
			var c = $("#reposLocalBackupIgnoreList").children();
			$(c).remove();
			if(data.length==0){
				$("#reposLocalBackupIgnoreList").append("<p>" + _Lang("暂无数据") + "</p>");
			}
			
			for(var i=0;i<data.length;i++){
				var d = data[i];
				var opBtn = "		<a href='javascript:void(0)' onclick='LocalBackupIgnoreMange.removeDocFromLocalBackupIgnoreList(" + i + ");' class='mybtn-primary'>" + _Lang("移除") + "</a>";
													
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
					+"			<a id='IgnoreEntryStatus"+i+"' href='javascript:void(0)'>" + _Lang("本地备份已关闭") + "</a>"
					+"		</span>"
					+"	</i>"
					+"	<i class='cell operation w10'>"
					+		opBtn
					+"	</i>"
					+"</li>";				
				$("#reposLocalBackupIgnoreList").append(se);
			}
		}
	}
	//开放给外部的调用接口
    return {
        init: function(_reposId){
        	reposLocalBackupIgnoreMangePageInit(_reposId);
        },
        addDocToLocalBackupIgnoreList: function(){
        	addDocToLocalBackupIgnoreList();
        },
        removeDocFromLocalBackupIgnoreList: function(index){
        	removeDocFromLocalBackupIgnoreList(index);
        },
    };
})();