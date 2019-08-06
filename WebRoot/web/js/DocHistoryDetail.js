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
		
		var changeItems = [];
		
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
			var changeItem = changeItems[index];
			
			var docId = "";
			var pid = "";
			var entryPath = changeItem.entryPath;
			
		   	console.log("downloadHistory() commitId:" +commitId  + " reposId:" + reposId  + " entryPath:"+ entryPath + " historyType:" + historyType);
		   	
		   	var encPath = encodeURI(parentPath);
		   	var encName = encodeURI(docName);
		   	var encEntryPath = encodeURI(entryPath);
		  
		   	window.location.href = "/DocSystem/Doc/downloadHistoryDoc.do?commitId=" + commitId + "&reposId=" + reposId + "&docId=" + docId + "&path=" + encPath + "&name="+encName + "&historyType=" + historyType +"&entryPath=" + encEntryPath ;	
		}
		
		function revertHistory(index)
		{
			var changeItem = changeItems[index];
			
			var docId = "";
			var pid = "";
			var entryPath = changeItem.entryPath;
			
		   	console.log("revertHistory() commitId:" +commitId  + " reposId:" + reposId + " entryPath:"+ entryPath + " historyType:" + historyType);
		   	
	   		$.ajax({
	             url : "/DocSystem/Doc/revertDocHistory.do",
	             type : "post",
	             dataType : "json",
	             data : {
	            	 commitId: commitId,
	                 reposId : reposId,
	                 pid: pid,
	                 docId: docId,
	            	 path : parentPath,
	             	 name: docName,
	             	 historyType: historyType,
	             	 entryPath: entryPath,
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
			   	
	   		$.ajax({
	             url : "/DocSystem/Doc/getHistoryDetail.do",
	             type : "post",
	             dataType : "json",
	             data : {
	            	 commitId: commitId,
	                 reposId : reposId, 
	                 pid: pid,
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
				//console.log(data);
				var c = $("#historyDetails").children();
				$(c).remove();
				if(data.length==0){
					$("#historyDetails").append("<p>暂无数据</p>");
				}
				
				for(var i=0;i<data.length;i++){
					var d = data[i];
					changeItems.push(d);
					
					var changeType = getChangeType(d);
					var entryPath = d.entryPath;
					var srcEntryPath = d.srcEntryPath;

					var changeContent = "			<a id='docPath"+i+"' href='javascript:void(0)'>"+entryPath+"</a>";
					if(d.changeType == 4 || d.changeType == 5)
					{
						changeContent = "			<a id='docPath"+i+"' href='javascript:void(0)'>"+entryPath+ " from " + srcEntryPath + "</a>";
					}

					var opBtn1 = "";
					var opBtn2 = "";
					if(historyType == 0)
					{
						opBtn1 = "		<a href='javascript:void(0)' onclick='downloadHistory("+i+ ")' class='mybtn-primary' style='margin-bottom:20px'>下载</a>";
						opBtn2 = "		<a href='javascript:void(0)' onclick='revertHistory("+i+ ")' class='mybtn-primary'>恢复</a>";
					}
					
					var se = "<li>" 
						+"	<i class='cell changeType w10'>"
						+"		<span class='name  breakAll'>"
						+"			<a id='changeType"+i+"' href='javascript:void(0)'>"+changeType+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell changeContent w30'>"
						+"		<span class='name breakAll'>"
						+ 			changeContent
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
			
			function getChangeType(changeItem)
			{
				switch(changeItem.changeType)
				{
				case 1:
					return "增加";
				case 2:
					return "删除";
				case 3:
					return "修改";
				case 4:
					return "移动";
				case 5:
					return "复制";
				}
				return "未知操作";
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