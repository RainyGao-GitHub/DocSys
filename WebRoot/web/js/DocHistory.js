	//DocHistory类
	var DocHistory = (function () {
		//These value is for commit
		var reposId;
		var docId;
		var pid;
		var parentPath = "";
		var docName = "";
		var docPath = "";
		var historyType = 0;
		
		function historyLogsPageInit(Input_vid, Input_docId, Input_pid, Input_path, Input_name, Input_historyType)
		{
			console.log("historyLogsPageInit vid:" + Input_vid + " docId:" + Input_docId + " pid:" + Input_pid + " path:" + Input_path + " name:" + Input_name + " historyType:" + Input_historyType);
			reposId = Input_vid;
			docId = Input_docId;
			pid = Input_pid;
			parentPath = Input_path;	
			docName = Input_name;
			docPath = Input_path + Input_name;
			historyType = Input_historyType;
			
			showHistoryLogList(reposId, docId, pid, parentPath, docName, historyType);	
		}
		
		function showHistoryDetail(index)
		{
			var commitId = $("#commitId" + index).attr("value");
		   	console.log("showHistoryDetail() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			

			var title = "历史详情";

		   	//show historyDetails page
			bootstrapQ.dialog({
				id: "historyDetailPage",
				title: title,
				url: 'historyDetails.html',
				msg: '页面正在加载，请稍等...',
				foot: false,
				big: true,
				callback: function(){
					DocHistoryDetail.historyDetailsPageInit(commitId, reposId, docId, parentPath, docName, historyType);
				},
			});		
		}
		
		function showDownloadConfirm(index)
		{
			var commitId = $("#commitId" + index).attr("value");
		   	console.log("showDownloadConfirm() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			

			var title = "下载确认";
			//Show dialog
		    qiao.bs.dialog({
		        id: "dialog-downloadConfirmDialog",
		        url: '#downloadConfirmDialog',
		        title: title,
		        okbtn: "确定",
		        callback: function () {
		            setTimeout(function () {
		            	console.log("showDownloadConfirm() callback commitId:" + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			         	
		                if(historyType == 0)
		                {
		                	$("#dialog-downloadConfirmDialog input[name='entryPath']").val("/"+parentPath+docName);
		                }
		                else
		                {
		                	if(docId == 0)
		                	{
		                		$("#dialog-downloadConfirmDialog input[name='entryPath']").val("/");	             
		                	}
		                	else
		                	{
		                		$("#dialog-downloadConfirmDialog input[name='entryPath']").val("/"+docId + "_" + docName);	             		                		
		                	}
		                }
		            },100);
		        }
		    },function () {
				var entryPath = $("#dialog-downloadConfirmDialog input[name='entryPath']").val();
				console.log("showDownloadConfirm() download commitId:" +  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);			         	
                downloadHistory(index, entryPath);
		    	return true;   
		    });
			return true;
		}
			
		function downloadHistory(index, entryPath)
		{
			//TODO: 如果当前是目录的话，需要提示是否只下载修改过的文件，否则下载该版本的整个目录
		   	
			var commitId = $("#commitId" + index).attr("value");
		   	console.log("downloadHistory() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);
		   	
			//执行后台downloadDoc操作
    		$.ajax({
                url : "/DocSystem/Doc/downloadHistoryDocPrepare.do",
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
	             	 downloadAll: 1,
		             shareId: gShareId,
                },
                success : function (ret) {
                   if( "ok" == ret.status )
                   {          
                	    console.log("downloadHistoryDocPrepare Ok:",ret);            	   		            	   		
            	   		var targetName = ret.data.name;
                	    var targetPath = ret.data.path;
                	    var deleteFlag = ret.msgData;
            	   		
                	    //targetName = encodeURI(Base64.encode(targetName));
            		   	//targetPath = encodeURI(Base64.encode(targetPath));
                	    targetName = encodeURI(targetName);
            		   	targetPath = encodeURI(targetPath);
            		   	console.log("downloadHistoryDocPrepare targetName:",targetName);            	   		            	   		
            	   		
            	   		window.location.href = "/DocSystem/Doc/downloadDoc.do?targetPath=" + targetPath + "&targetName=" + targetName + "&deleteFlag="+deleteFlag;
                	   	return;
                   }
                   else	//后台报错，结束下载
                   {
                	   	console.log("downloadHistoryDocPrepare Error:" + ret.msgInfo);
	                   	bootstrapQ.alert({
		      			    //id: "downloadHistoryDocPrepareError",
							msg : "下载失败:" + ret.msgInfo,
						    }); 
	                	return;
                   }
                },
                error : function () {	//后台异常
                	console.log("downloadHistoryDocPrepare 下载失败：服务器异常！");
	               	bootstrapQ.alert({
	      			    //id: "downloadHistoryDocPrepareError",
						msg : "下载失败:服务器异常",
					    }); 
	            	return;
                }
        	});			   	
		}
		
		function showRevertConfirm(index)
		{
			var commitId = $("#commitId" + index).attr("value");
		   	console.log("showRevertConfirm() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			

			var title = "恢复确认";
			//Show dialog
		    qiao.bs.dialog({
		        id: "dialog-revertConfirmDialog",
		        url: '#revertConfirmDialog',
		        title: title,
		        okbtn: "确定",
		        callback: function () {
		            setTimeout(function () {
		            	console.log("showRevertConfirm() callback commitId:" + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			         	
		                if(historyType == 0)
		                {
		                	$("#dialog-revertConfirmDialog input[name='entryPath']").val("/"+parentPath+docName);
		                }
		                else
		                {
		                	if(docId == 0)
		                	{
		                		$("#dialog-revertConfirmDialog input[name='entryPath']").val("/");	             
		                	}
		                	else
		                	{
		                		$("#dialog-revertConfirmDialog input[name='entryPath']").val("/"+docId + "_" + docName);	             		                		
		                	}
		                }
		            },100);
		        }
		    },function () {
				var entryPath = $("#dialog-revertConfirmDialog input[name='entryPath']").val();
				console.log("showRevertConfirm() revert commitId:" +  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);			         	
				revertHistory(index, entryPath);
		    	return true;   
		    });
			return true;
		}
		
		function revertHistory(index, entryPath)
		{
			//TODO: 如果当前是目录的话，需要提示是否只还原修改过的文件，否则将把目录下所有的文件都还原到该版本
		   	
			var commitId = $("#commitId" + index).attr("value");
		   	console.log("revertHistory() commitId:" +commitId  + " reposId:" + reposId + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);
	
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
	             	 downloadAll: 1,
		             shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	console.log(ret.data);
	        		  	bootstrapQ.alert("恢复成功！");
	                }
	                else
	                {
	                	showErrorMessage(ret.msgInfo);
	                }
	            },
	            error : function () {
	                showErrorMessage("历史版本恢复失败:服务器异常");
	            }
	        });
		}
	
		function showHistoryLogList(reposId, docId, pid, parentPath, docName, historyType)
		{
	   		console.log("showHistoryLogList  reposId:" + reposId + " docId:"+ docId + " pid:" + pid + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);
	    	$.ajax({
	             url : "/DocSystem/Doc/getDocHistory.do",
	             type : "post",
	             dataType : "json",
	             data : {
	                 reposId : reposId, 
	                 docId: docId,
	                 pid: pid,
	            	 path : parentPath,
	             	 name: docName,
	             	 historyType: historyType,
	             	 maxLogNum: 100,
		             shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	//console.log(ret.data);
	        		  	showList(ret.data);
	                }
	                else
	                {
	                	showErrorMessage("获取历史信息失败:" + ret.msgInfo);
	                }
	            },
	            error : function () {
	                showErrorMessage("获取历史信息失败:服务器异常");
	            }
	        });
	
			//根据获取到的列表数据，绘制列表
			function showList(data){
				//console.log(data);
				var c = $("#historyLogs").children();
				$(c).remove();
				if(!data || data.length==0){
					$("#historyLogs").append("<p>暂无数据</p>");
					return;
				}
				
				for(var i=0;i<data.length;i++){
					var d = data[i];
					var version = "V" + (data.length - i);
					var commitId = d.commitId;
					var commitUser = d.commitUser;
					var commitMsg = d.commitMsg;
					var commitTime = formatTime(d.commitTime);
					
					var opBtn = "		<a href='javascript:void(0)' onclick='DocHistory.showHistoryDetail("+i+ ")' class='mybtn-primary' style='margin-bottom:20px'>详情</a>";							
					var opBtn1 = "		<a href='javascript:void(0)' onclick='DocHistory.showDownloadConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px'>下载</a>";
					var opBtn2 = "		<a href='javascript:void(0)' onclick='DocHistory.showRevertConfirm("+i+ ")' class='mybtn-primary'>恢复</a>";
					var se = "<li>"
						+"	<i class='cell commitId w10'>"
						+"		<span class='name  breakAll'>"
						+"			<a id='commitId"+i+"' value='" +commitId+ "' href='javascript:void(0)'>"+version+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell commitMsg w30'>"
						+"		<span class='name breakAll'>"
						+"			<a id='commitMsg"+i+"' href='javascript:void(0)'>"+commitMsg+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell commitUser w13'>"
						+"		<span class='name'>"
						+"			<a id='commitUser"+i+"' href='javascript:void(0)'>"+commitUser+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell commitTime w10'>"
						+"		<span class='name'>"
						+"			<a id='commitTime"+i+"' href='javascript:void(0)'>"+commitTime+"</a>"
						+"		</span>"
						+"	</i>"
						+"	<i class='cell operation w10'>"
						+		opBtn
						+ 		opBtn1 
						+ 		opBtn2 
						+"	</i>"
						+"</li>";
					
					$("#historyLogs").append(se);
				}
			}
		}
		
		//开放给外部的调用接口
	    return {
	    	historyLogsPageInit: function(vid, docId, pid, path, name, type){
	    		historyLogsPageInit(vid, docId, pid, path, name, type);
	        },

	        showHistoryDetail: function(index){
	        	showHistoryDetail(index);
	        },

	        showDownloadConfirm: function(index){
	        	showDownloadConfirm(index);
	        },
	        
	        showRevertConfirm: function(index)
			{
	        	showRevertConfirm(index);
			}
	    };
	})();