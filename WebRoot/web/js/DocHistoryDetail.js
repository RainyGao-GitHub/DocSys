	//DocHistoryDetail类
	var DocHistoryDetail = (function () {
		//These value is for commit
		var commitId;
		var reposId;
		var docId;
		var parentPath = "";
		var docName = "";
		var docPath = "";
		var historyType = 0;
		
		function historyDetailsPageInit(Input_commitId, Input_vid, Input_docId, Input_path, Input_name, Input_historyType)
		{
			console.log("historyDetailsPageInit commitId:" + Input_commitId + " reposId:" + Input_vid + " docId:" + Input_docId + " path:" + Input_path + " name:" + Input_name + " historyType:" + Input_historyType);
			commitId = Input_commitId;
			reposId = Input_vid;
			docId = Input_docId;
			parentPath = Input_path;	
			docName = Input_name;
			docPath = Input_path + Input_name;
			historyType = Input_historyType;
			
			showHistoryDetailList(commitId, reposId, docId, parentPath, docName, historyType);	
		}
			
		function downloadHistory(index)
		{
			//TODO: 如果当前是目录的话，需要提示是否只下载修改过的文件，否则下载该版本的整个目录
		   	
			var commitId = $("#commitId" + index).text();
		   	console.log("downloadHistory() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);
		   	
		   	var encParentPath = encodeURI(parentPath);
		   	var encDocName = encodeURI(docName);
		   	window.location.href = "/DocSystem/Doc/getHistoryDoc.do?commitId=" + commitId + "&reposId=" + reposId + "&docId=" + docId + "&path=" + encParentPath + "&name="+encDocName + "&historyType=" + historyType;	
		}
		
		function revertHistory(index)
		{
			//TODO: 如果当前是目录的话，需要提示是否只还原修改过的文件，否则将把目录下所有的文件都还原到该版本
		   	
			var commitId = $("#commitId" + index).text();
		   	console.log("revertHistory() commitId:" +commitId  + " reposId:" + reposId + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);
	
		   	var encParentPath = encodeURI(parentPath);
		   	var encDocName = encodeURI(docName);
		   	
	   		$.ajax({
	             url : "/DocSystem/Doc/revertDocHistory.do",
	             type : "post",
	             dataType : "json",
	             data : {
	            	 commitId: commitId,
	                 reposId : reposId,
	                 pid: pid,
	                 docId: docId,
	            	 path : encParentPath,
	             	 name: encDocName,
	             	 historyType: historyType,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	console.log(ret.data);
	        		  	alert("恢复成功！");
	                }
	                else
	                {
	                	showErrorMessage("历史版本恢复失败:" + ret.msgInfo);
	                }
	            },
	            error : function () {
	                showErrorMessage("历史版本恢复失败:服务器异常");
	            }
	        });
		}
		
		function showHistoryDetail(index)
		{
			var commitId = $("#commitId" + index).text();
		   	console.log("revertHistory() commitId:" +commitId  + " reposId:" + reposId + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);
	
		   	var encParentPath = encodeURI(parentPath);
		   	var encDocName = encodeURI(docName);
		   	
	   		$.ajax({
	             url : "/DocSystem/Doc/getHistoryDetail.do",
	             type : "post",
	             dataType : "json",
	             data : {
	            	 commitId: commitId,
	                 reposId : reposId, 
	                 pid: pid,
	                 docId: docId,
	            	 path : encParentPath,
	             	 name: encDocName,
	             	 historyType: historyType,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	console.log(ret.data);
	        		  	showList(ret.data);
	                }
	                else
	                {
	                	showErrorMessage("获取历史版本详情失败:" + ret.msgInfo);
	                }
	            },
	            error : function () {
	                showErrorMessage("获取历史版本详情失败:服务器异常");
	            }
	        });
	   		
			//根据获取到的列表数据，绘制列表
			function showList(data){
				
			}
		}
	
		function showHistoryDetailList(commitId, reposId, docId, parentPath, docName, historyType)
		{
	   		console.log("showHistoryDetailList  commitId:"  + commitId + " reposId:" + reposId + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);
	   		$.ajax({
	             url : "/DocSystem/Doc/getHistoryDetail.do",
	             type : "post",
	             dataType : "json",
	             data : {
	            	 commitId: commitId,
	                 reposId : reposId,
	                 docId: docId,
	            	 path : parentPath,
	             	 name: docName,
	             	 historyType: historyType,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	console.log(ret.data);
	        		  	showList(ret.data);
	                }
	                else
	                {
		                closeBootstrapDialog("historyDetailPage");
	                	showErrorMessage("获取历史详情失败:" + ret.msgInfo);
	                }
	            },
	            error : function () {
	                closeBootstrapDialog("historyDetailPage");
	                showErrorMessage("获取历史详情失败:服务器异常");
	            }
	        });
	
			//根据获取到的列表数据，绘制列表
			function showList(data){
				console.log(data);
				var c = $("#historyDetails").children();
				$(c).remove();
				if(data.length==0){
					$("#historyDetails").append("<p>暂无数据</p>");
				}
				
				for(var i=0;i<data.length;i++){
					var d = data[i];
					var changeType = d.changeType;
					var docPath = d.path;
					
					var opBtn1 = "		<a href='javascript:void(0)' onclick='downloadHistory("+i+ ")' class='mybtn-primary' style='margin-bottom:20px'>下载</a>";
					var opBtn2 = "		<a href='javascript:void(0)' onclick='revertHistory("+i+ ")' class='mybtn-primary'>恢复</a>";
					var se = "<li>" 
						+"	<i class='cell changeType w10'>"
						+"		<span class='name  breakAll'>"
						+"			<a id='changeType"+i+"' href='javascript:void(0)'>"+changeType+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell docPath w30'>"
						+"		<span class='name breakAll'>"
						+"			<a id='docPath"+i+"' href='javascript:void(0)'>"+docPath+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell operation w10'>"
						+ 		opBtn1 
						+ 		opBtn2 
						+"	</i>"
						+"</li>";
					
					$("#historyDetails").append(se);
				}
			}
		}
		
		//开放给外部的调用接口
	    return {
	    	historyDetailsPageInit: function(vid, docId, pid, path, name, type){
	    		historyDetailsPageInit(vid, docId, pid, path, name, type);
	        },

	        showHistoryDetail: function(index){
	        	showHistoryDetail(index);
	        },
	        downloadHistory: function(index){
	        	downloadHistory(index);
	        },
	        revertHistory: function(index)
			{
	        	revertHistory(index);
			}
	    };
	})();