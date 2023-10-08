var TextSearchIgnoreMange = (function () {
    /*全局变量*/
    var reposId;
	
	function reposTextSearchIgnoreMangePageInit(_reposId)
	{
		console.log("reposTextSearchIgnoreMangePageInit _reposId:" + _reposId);
		reposId = _reposId;
		showReposTextSearchIngoreList();		
	}
	
	function addDocToTextSearchIgnoreList()
	{
		console.log("addDocToTextSearchIgnoreList() ignorePath:" + ignorePath);
		var node = {};
		node.path =  $("#ignorePath").val();
		node.name = "";
		console.log("addDocToTextSearchIgnoreList() path:" + node.path + "name:" + node.name);
		setTextSearchIgnore(node, 1);
	}
	
	function removeDocFromTextSearchIgnoreList(index)
	{
		console.log("removeDocFromTextSearchIgnoreList() index:" + index);
		var node = {};
		node.path = $("#IgnoreEntrySelect" + index).val();
		node.name = "";
		console.log("removeDocFromTextSearchIgnoreList() path:" + node.path + "name:" + node.name);
		setTextSearchIgnore(node, 0);
	}

	function setTextSearchIgnore(node, ignore)
	{
		console.log("setTextSearchIgnore()");
	    $.ajax({
	        url : "/DocSystem/Doc/setTextSearchIgnore.do",
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
					showReposTextSearchIngoreList();
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
	
	function showReposTextSearchIngoreList(){
	   	console.log("showReposTextSearchIngoreList() reposId:" + reposId);
	   	var path = "";
	   	var name = "";
	   	
	    $.ajax({
	            url : "/DocSystem/Doc/getTextSearchIgnoreList.do",
	            type : "post",
	            dataType : "json",
	            data : {
	                reposId : reposId,
	                path : path,
	                name : name,
	            },
	            success : function (ret) {
	            	console.log("getTextSearchIgnoreList ret:", ret);
	                if( "ok" == ret.status ){
	                    showList(ret.data);
	                }
	                else
	                {
	                	alert("Error:" + ret.msgInfo);
	                }
	            },
	            error : function () {
	               alert(_Lang('获取全文搜索忽略列表失败', ':', '服务器异常'));
	            }
    	});

		//绘制列表
		function showList(data){
			console.log(data);
			var c = $("#reposTextSearchIgnoreList").children();
			$(c).remove();
			if(data.length==0){
				$("#reposTextSearchIgnoreList").append("<p>" + _Lang("暂无数据") + "</p>");
			}
			
			for(var i=0;i<data.length;i++){
				var d = data[i];
				var opBtn = "		<a href='javascript:void(0)' onclick='TextSearchIgnoreMange.removeDocFromTextSearchIgnoreList(" + i + ");' class='mybtn-primary'>" + _Lang("移除") + "</a>";
													
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
					+"			<a id='IgnoreEntryStatus"+i+"' href='javascript:void(0)'>" + _Lang("全文搜索已关闭") + "</a>"
					+"		</span>"
					+"	</i>"
					+"	<i class='cell operation w10'>"
					+		opBtn
					+"	</i>"
					+"</li>";				
				$("#reposTextSearchIgnoreList").append(se);
			}
		}
	}
	//开放给外部的调用接口
    return {
        init: function(_reposId){
        	reposTextSearchIgnoreMangePageInit(_reposId);
        },
        addDocToTextSearchIgnoreList: function(){
        	addDocToTextSearchIgnoreList();
        },
        removeDocFromTextSearchIgnoreList: function(index){
        	removeDocFromTextSearchIgnoreList(index);
        },
    };
})();
