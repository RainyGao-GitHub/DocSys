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
		var curCommitId = "";	//目前已加载的历史
		var curVersion = 0;
		
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
			
			if(docId == undefined)
			{
				docId = 0;
			}
			showHistoryLogList(reposId, docId, pid, parentPath, docName, historyType);	
		}
		
		function loadMoreHistory()
		{
			console.log("loadMoreHistory() curCommitId:" + curCommitId);
			showHistoryLogList(reposId, docId, pid, parentPath, docName, historyType);	
		}
		
		
		function showHistoryDetail(index)
		{
			var commitId = $("#commitId" + index).attr("value");
		   	console.log("showHistoryDetail() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			

			var title = _Lang("历史详情");

		   	//show historyDetails page
			bootstrapQ.dialog({
				id: "historyDetailPage",
				title: title,
				url: 'historyDetails' + langExt + '.html',
				msg: _Lang('页面正在加载，请稍等...'),
				foot: false,
				big: true,
				callback: function(){
					DocHistoryDetail.historyDetailsPageInit(commitId, reposId, docId, parentPath, docName, historyType);
				},
			});		
		}
		
		//view VDocHistory
		function viewVDocHistory(index)
		{			
			var commitId = $("#commitId" + index).attr("value");
			var entryPath = "0_/content.md";
			if(docId)
			{
				entryPath = docId + "_" + docName + "/content.md";	//需要指定VDOC在vdata目录的相对路径（例如:0_/content.md）
			}
			
			console.log("viewHistory() commitId:" +commitId  + " reposId:" + reposId  + " entryPath:"+ entryPath + " historyType:" + historyType);
		    var docInfo = buildBasicDoc(entryPath, "");
		    docInfo.vid = reposId;
		    docInfo.type = 1;
		    docInfo.isHistory = 1;
		    docInfo.commitId = commitId;
		    docInfo.docType = historyType == 1? 2:1;
		    docInfo.historyType = historyType;
		    
		    //openDoc(docInfo, false, "openInArtDialog", "office", gShareId);
		    openDoc(docInfo, false, "openInDialog", "office", gShareId);
		}
		
		function showDownloadConfirm(index)
		{
			var commitId = $("#commitId" + index).attr("value");
			var version = $("#commitId" + index).text();
		   	console.log("showDownloadConfirm() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			

		   	var docPath = "/"+parentPath + docName;
		   	var msg = getDownloadConfirmMsg(historyType, docId, docPath, version)			
		   	var entryPath = getEntryPath(historyType, docId, docName, docPath);
            
		   	qiao.bs.confirm({
		        id: 'downloadHistoryConfirm',
		        msg: msg,
	    		title: _Lang("确认"),
	    		okbtn: _Lang("下载"),
	    		qubtn: _Lang("取消"),
		    },function(){
		    	console.log("showDownloadConfirm() download commitId:" +  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);			         	
		    	downloadHistory(index, entryPath);
		    },function(){
		        //alert('点击了取消！');
		    });
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
	             	 downloadAll: 0,
	             	 needDeletedEntry: 1,
		             shareId: gShareId,
                },
                success : function (ret) {
            	    console.log("downloadHistoryDocPrepare ret:",ret);   
                	if( "ok" == ret.status )
                    {          
               	        if(ret.msgData == 5)
                	    {
               	        	//下载目录压缩中
               	        	console.log("downloadHistoryDocPrepare 下载准备中:", ret.data.info);   
               	        	var SubContext = {};
               	        	SubContext.index = 0;
               	        	SubContext.commitId = commitId;
               	        	SubContext.reposId = reposId;
               	        	SubContext.pid = pid;
               	        	SubContext.docId = docId;
               	        	SubContext.path = parentPath;
               	        	SubContext.name = docName;
               	        	SubContext.historyType = historyType;
               	        	SubContext.entryPath = entryPath;
               	        	SubContext.downloadAll = 0;
               	        	SubContext.needDeletedEntry = 1;
               	        	SubContext.shareId = gShareId;	
               	        	
                	        showErrorMessage(_Lang("历史版本下载准备中，可能需要花费较长时间，您可先关闭当前窗口！"));
               	        	startDownloadPrepareQueryTask(SubContext, ret.data.id, 2000); //2秒后查询
               	        	return;
                	    }
                	    
               	        //下载准备完成
               	        closeBootstrapDialog("bsmodal"); //showErrorMessage's default id is bsmodal
                	    var docDownloadInfo = ret.data;
                	    docDownloadInfo.deleteFlag = ret.msgData;

            		   	var docLink = buildDocDownloadLink(ret.data);
                	    console.log("downloadHistoryDocPrepare docLink:",docLink);
            	   		window.location.href = docLink;
                	   	return;
                   }
                   else	//后台报错，结束下载
                   {
                	   	console.log("downloadHistoryDocPrepare Error:" + ret.msgInfo);
	                   	bootstrapQ.alert({
		      			    //id: "downloadHistoryDocPrepareError",
							msg : _Lang("下载失败", ":", ret.msgInfo),
						    }); 
	                	return;
                   }
                },
                error : function () {	//后台异常
                	console.log("downloadHistoryDocPrepare 下载失败：服务器异常！");
	               	bootstrapQ.alert({
	      			    //id: "downloadHistoryDocPrepareError",
						msg : _Lang("下载失败", ":", "服务器异常"),
					    }); 
	            	return;
                }
        	});			   	
		}
		
    	function startDownloadPrepareQueryTask(SubContext, downloadPrepareTaskId, delayTime)
    	{
    		console.log("startDownloadPrepareQueryTask() downloadPrepareTaskId:" + downloadPrepareTaskId + " delayTime:" + delayTime);
    		var nextDelayTime = delayTime; //每次增加5s
    		if(nextDelayTime < 60000) //最长1分钟
    		{
    			nextDelayTime += 5000;
    		}
    		
    		setTimeout(function () {
				console.log("[" + SubContext.index + "] timerForQueryDownloadPrepareTask triggered!");
				doQueryDownloadPrepareTask(SubContext, downloadPrepareTaskId, nextDelayTime);
			},delayTime);	//check it 2s later	
    	}
    	
    	function doQueryDownloadPrepareTask(SubContext, downloadPrepareTaskId, nextDelayTime)
    	{
    		console.log("doQueryDownloadPrepareTask() downloadPrepareTaskId:" + downloadPrepareTaskId);
			//执行后台downloadDoc操作
    		$.ajax({
                url : "/DocSystem/Doc/queryDownloadPrepareTask.do",
                type : "post",
                dataType : "json",
                data : {
                    taskId: downloadPrepareTaskId,
                },
                success : function (ret) {
            	   console.log("doQueryDownloadPrepareTask ret:",ret);        
                   if( "ok" == ret.status )
                   {    
               	        if(ret.msgData == 5)
                	    {
               	        	var prepareTask = ret.data;
               	        	var info = prepareTask.info;
               	        	if(prepareTask.targetSize)
               	        	{
               	        		info = _Lang("目录压缩中") + "(" + getFileDisplaySize(prepareTask.targetSize) + ")...";
               	        	}
               	        	console.log("doQueryDownloadPrepareTask info:" + info);
               	        	startDownloadPrepareQueryTask(SubContext, prepareTask.id, nextDelayTime);
               	        	return;
                	    }
               	        
               	        //下载任务准备完成
               	        closeBootstrapDialog("bsmodal"); //showErrorMessage's default id is bsmodal
               	        
                	    var docDownloadInfo = ret.data;
                	    docDownloadInfo.deleteFlag = ret.msgData;

            		   	var docLink = buildDocDownloadLink(ret.data);
                	    console.log("doQueryDownloadPrepareTask docLink:",docLink);
            	   		window.location.href = docLink;
                	   	return;
                   }
                   else	//后台报错，结束下载
                   {
	               	   	console.log("doQueryDownloadPrepareTask Error:" + ret.msgInfo);
	               	    showErrorMessage(_Lang("下载失败", ":", ret.msgInfo)); 
	                	return;
                   }
                },
                error : function () {	//后台异常
                	console.log("doQueryDownloadPrepareTask 下载失败：服务器异常！");
	               	showErrorMessage(_Lang("下载失败", ":", "服务器异常")); 
	            	return;
                }
        	});		
    	}
    	
    	function getFileDisplaySize(size)
    	{
    		var showSize = size;
	    	var units = "B";	//单位
			if((showSize/1024)>1)
			{
				showSize = showSize/1024;
				units = "KB";
				if((showSize/1024)>1)
				{
					showSize = showSize/1024;
					units = "MB";
				}
			}
			showSize = Math.round(showSize) + units;
			return showSize;
    	}
    	
    	function buildRevertConfirmMsg(historyType, docId, docPath, version)
    	{
		   	var msg = "";				
		   	switch(historyType)
            {
            case 0:	//History
            case 2: //LocalBackup
            case 3: //RemoteBackup
            case 4: //RecycleBin
		   		if(docId == 0)
		   		{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Recover repository's changes on version" + ":" + version + " ?";
			   			break;
		   			default:
		   				msg = "是否恢复仓库在版本" + ":" + version + "上的改动?";
		   				break;
		   			}
		   		}
		   		else
		   		{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Recover [" + docPath + "]'s changes on version" + ":" + version + " ?";
			   			break;
		   			default:
			   			msg = "是否恢复 [" + docPath + "] 在版本:" + version + " 上的改动?";
		   				break;
		   			}
		   		}
		   		break;
            case 1: //Note's History
            	if(docId == 0)
            	{
            		entryPath = "/";
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Recover repository's Note changes on version" + ":" + version + " ?";
		   				break;
		   			default:
	            		msg = "是否恢复仓库备注在版本:" + version + " 上的改动?";
		   				break;
		   			}
            	}
            	else
            	{
            		switch(langType)
		   			{
		   			case "en":
		   				msg = "Recover [" + docPath + "]'s Note changes on version" + ":" + version + " ?";
		   				break;
		   			default:
	            		msg = "是否恢复 [" + docPath + "] 的备注在版本:" + version + " 上的改动?";
		   				break;
		   			}

            	}
            	break;
            }	
		   
		   	return msg;
    	}
    	
    	function buildResetConfirmMsg(historyType, docId, docPath, version)
    	{
		   	var msg = "";				
		   	switch(historyType)
            {
            case 0:	//History
            case 2: //LocalBackup
            case 3: //RemoteBackup
            case 4: //RecycleBin
		   		if(docId == 0)
		   		{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Revert repository to version" + ":" + version + " ?";
			   			break;
		   			default:
			   			msg = "是否将仓库回退到版本:" + version + "?";
		   				break;
		   			}
		   		}
		   		else
		   		{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Revert [" + docPath + "] to version" + ":" + version + " ?";
			   			break;
		   			default:
			   			msg = "是否将 [" + docPath + "] 回退到版本:" + version + "?";
		   				break;
		   			}
		   		}
		   		break;
            case 1: //Note's History
            	if(docId == 0)
            	{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Revert repository's Note to version" + ":" + version + " ?";
			   			break;
		   			default:		           		
	            		msg = "是否将仓库备注回退到版本:" + version + "?";	
			   			break;
		   			}

            	}
            	else
            	{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Revert [" + docPath + "]'s Note to version" + ":" + version + " ?";
			   			break;
		   			default:		           		
			   			msg = "是否将 [" + docPath + "] 的备注回退到版本:" + version + "?";
		   				break;
		   			}
             	}
            	break;
            }	
		   
		   	return msg;
    	}
    	
    	function buildDeleteConfirmMsg(historyType, docId, docPath, version)
    	{
		   	var msg = "";				
		   	switch(historyType)
            {
            case 0:	//History
            case 2: //LocalBackup
            case 3: //RemoteBackup
            case 4: //RecycleBin
            	if(docId == 0)
		   		{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Delete repository's change history on version" + ":" + version + " ?";
			   			break;
		   			default:
		   				msg = "是否删除仓库在版本" + ":" + version + "上的改动历史 ?";
		   				break;
		   			}
		   		}
		   		else
		   		{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Delete [" + docPath + "]'s change history on version" + ":" + version + " ?";
			   			break;
		   			default:
			   			msg = "是否删除 [" + docPath + "] 在版本:" + version + " 上的改动历史 ?";
		   				break;
		   			}
		   		}
		   		break;
            case 1: //Note's History
            	if(docId == 0)
            	{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Delete repository's Note change hisotry to version" + ":" + version + " ?";
			   			break;
		   			default:		           		
		   				msg = "是否删除仓库备注在版本" + ":" + version + "上的改动历史 ?";
			   			break;
		   			}
            	}
            	else
            	{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Delete [" + docPath + "]'s Note change history on version" + ":" + version + " ?";
			   			break;
		   			default:		           		
			   			msg = "是否将 [" + docPath + "] 的备注到版本:" + version + "上的改动历史 ?";
		   				break;
		   			}
             	}
            	break;
            }	
		   
		   	return msg;
    	}
    	
		function getDownloadConfirmMsg(historyType, docId, docPath, version)
		{
		   	var msg = "";				
		   	switch(historyType)
            {
            case 0:	//History
            case 2: //LocalBackup
            case 3: //RemoteBackup
            case 4: //RecycelBin
		   		if(docId == 0)
		   		{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Download Repository's changes on version" + ":" + version + " ?";
			   			break;
		   			default:
			   			msg = _Lang("下载仓库的历史版本") + ":" + version + "?";
		   				break;
		   			}
		   		}
		   		else
		   		{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Download [" + docPath + "]'s changes on version" + ":" + version + " ?";
			   			break;
		   			default:
			   			msg = "下载" + " " + docPath + " " + "的历史版本" + ":" + version + "?";
		   				break;
		   			}
		   		}
		   		break;
		   	case 1: //VirtualDoc
            	if(docId == 0)
            	{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Download Repository's Note changes on version" + ":" + version + " ?";
			   			break;
		   			default:
	            		msg = _Lang("下载仓库的备注历史版本") + ":" + version + "?";
		   				break;
		   			}
            	}
            	else
            	{
		   			switch(langType)
		   			{
		   			case "en":
		   				msg = "Download [" + docPath + "]'s Note changes on version" + ":" + version + " ?";
			   			break;
		   			default:
			   			msg = "下载" + " " + docPath + " " + "的备注历史版本" + ":" + version + "?";
		   				break;
		   			}            		
            	}
            	break;
            }	
		   	return msg;
		}
    	
    	function getEntryPath(historyType, docId, docName, docPath)
    	{
    		var entryPath = docPath;
    	  	if(historyType == 1)
            {
            	if(docId == 0)
            	{
            		entryPath = "/";
		   		}
            	else
            	{
            		entryPath = "/"+docId + "_" + docName;             		                		
            	}
            }
    	  	return entryPath;
    	}
    	
		function showRevertConfirm(index)
		{
			var commitId = $("#commitId" + index).attr("value");
			var version = $("#commitId" + index).text();
		   	console.log("showRevertConfirm() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			

		   	
		   	var docPath = "/"+parentPath + docName;
            var entryPath = getEntryPath(historyType, docId, docName, docPath);			
		   	var msg = buildRevertConfirmMsg(historyType, docId, docPath, version);
		 	
		   	qiao.bs.confirm({
		        id: 'revertHistoryConfirm',
		        msg: msg,
	    		title: _Lang("确认"),
	    		okbtn: _Lang("恢复"),
	    		qubtn: _Lang("取消"),
		   	},function(){
		    	console.log("showRevertConfirm() revert commitId:" +  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);			         	
				revertHistory(index, entryPath);
		    },function(){
		        //alert('点击了取消！');
		    });
		}
    	
		function showResetConfirm(index)
		{
			var commitId = $("#commitId" + index).attr("value");
			var version = $("#commitId" + index).text();
		   	console.log("showRevertConfirm() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			

		   	var docPath = "/"+parentPath + docName;
		   	var entryPath = getEntryPath(historyType, docId, docName, docPath);
		   	var msg = buildResetConfirmMsg(historyType, docId, docPath, version);
		    
		   	qiao.bs.confirm({
		        id: 'resetHistoryConfirm',
		        msg: msg,
	    		title: _Lang("确认"),
	    		okbtn: _Lang("回退"),
	    		qubtn: _Lang("取消"),
		   	},function(){
		    	console.log("showResetConfirm() reset commitId:" +  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);			         	
				resetHistory(index, entryPath);
		    },function(){
		        //alert('点击了取消！');
		    });
		}
		
		function showDeleteConfirm(index)
		{
			var commitId = $("#commitId" + index).attr("value");
			var version = $("#commitId" + index).text();
		   	console.log("showDeleteConfirm() commitId:" +commitId  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType);			

		   	var docPath = "/"+parentPath + docName;
		   	var entryPath = getEntryPath(historyType, docId, docName, docPath);
		   	var msg = buildDeleteConfirmMsg(historyType, docId, docPath, version);
		    
		   	qiao.bs.confirm({
		        id: 'deleteHistoryConfirm',
		        msg: msg,
	    		title: _Lang("确认"),
	    		okbtn: _Lang("删除"),
	    		qubtn: _Lang("取消"),
		   	},function(){
		    	console.log("showResetConfirm() reset commitId:" +  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);			         	
				deleteHistory(index, entryPath);
		    },function(){
		        //alert('点击了取消！');
		    });
		}
		
		function revertHistory(index, entryPath)
		{
			//恢复本次提交被改动的文件
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
		             shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	console.log(ret.data);
	        		  	showErrorMessage(_Lang("恢复成功！"));
	                }
	                else
	                {
	                	showErrorMessage(_Lang("恢复失败", ":", ret.msgInfo));
	                }
	            },
	            error : function () {
	                showErrorMessage(_Lang("恢复失败", ":", "服务器异常"));
	            }
	        });
		}
		
		function resetHistory(index, entryPath)
		{
			//回退所有文件到指定版本
			var commitId = $("#commitId" + index).attr("value");
		   	console.log("revertHistory() commitId:" +commitId  + " reposId:" + reposId + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);
	
	   		$.ajax({
	             url : "/DocSystem/Bussiness/resetDocHistory.do",
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
		             shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	console.log(ret.data);
	        		  	bootstrapQ.alert(_Lang("回退成功！"));
	                }
	                else
	                {
	                	showErrorMessage(_Lang("回退失败", ":", ret.msgInfo));
	                }
	            },
	            error : function () {
	                showErrorMessage(_Lang("回退失败", ":", "服务器异常"));
	            }
	        });
		}
		
		function deleteHistory(index, entryPath)
		{
			//回退所有文件到指定版本
			var commitId = $("#commitId" + index).attr("value");
		   	console.log("deleteHistory() commitId:" +commitId  + " reposId:" + reposId + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);
	
	   		$.ajax({
	             url : "/DocSystem/Bussiness/deleteDocHistory.do",
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
		             shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	console.log(ret.data);
	        		  	bootstrapQ.alert(_Lang("删除成功！"));
	        		  	$('#historyItem' + index).hide();
	                }
	                else
	                {
	                	showErrorMessage(_Lang("删除失败", ":", ret.msgInfo));
	                }
	            },
	            error : function () {
	                showErrorMessage(_Lang("删除失败", ":", "服务器异常"));
	            }
	        });
		}
	
		function showHistoryLogList(reposId, docId, pid, parentPath, docName, historyType)
		{
	   		console.log("showHistoryLogList  reposId:" + reposId + " docId:"+ docId + " pid:" + pid + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " curCommitId:" + curCommitId);
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
	             	 commitId: curCommitId,
		             shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status){
	        		  	//console.log(ret.data);
	        		  	showList(ret.data);
	                }
	                else
	                {
	                	showErrorMessage(_Lang("获取历史信息失败", ":", ret.msgInfo));
	                }
	            },
	            error : function () {
	                showErrorMessage(_Lang("获取历史信息失败", ":", "服务器异常"));
	            }
	        });
	
			//根据获取到的列表数据，绘制列表
			function showList(data){
				//console.log(data);
				var startIndex = 0;
				if(curCommitId == "")
				{
					startIndex = 0;
					var c = $("#historyLogs").children();
					$(c).remove();
				}
				else
				{
					startIndex = 1;
				}
				
				if(!data || data.length==0){
					$("#historyLogs").append("<p>" + _Lang("暂无数据") + "</p>");
					return;
				}
								
				if(data.length < 100)
				{
					$('#loadMoreHistoryBtn').hide();
				}
				else
				{
					$('#loadMoreHistoryBtn').show();
				}	
				
				for(var i=startIndex; i<data.length; i++){
					var d = data[i];
					//var version = "V" + (data.length - i);
					var version = "V" + curVersion;
					curVersion++;
					var commitId = d.commitId;
					var commitUser = d.commitUser;
					var commitMsg = d.commitMsg;
					var commitTime = formatTime(d.commitTime);

					curCommitId = commitId;
					
					var opBtn = "";
					var opBtn1 = "";
					var opBtn2 = "";
					var opBtn3 = "";
					var opBtn4 = "";
					switch(historyType)
					{
					case 1:
						opBtn = "		<a href='javascript:void(0)' onclick='DocHistory.viewVDocHistory("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("查看") + "</a>";	
						opBtn1 = "		<a href='javascript:void(0)' onclick='DocHistory.showDownloadConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("下载") + "</a>";
						opBtn2 = "		<a href='javascript:void(0)' onclick='DocHistory.showRevertConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("恢复") + "</a>";
						opBtn3 = "		<a href='javascript:void(0)' onclick='DocHistory.showResetConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("回退") + "</a>";
						opBtn4 = "		<a href='javascript:void(0)' onclick='DocHistory.showDeleteConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("删除") + "</a>";
						break;
					case 0:
						opBtn = "		<a href='javascript:void(0)' onclick='DocHistory.showHistoryDetail("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("详情") + "</a>";							
						opBtn1 = "		<a href='javascript:void(0)' onclick='DocHistory.showDownloadConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("下载") + "</a>";
						opBtn2 = "		<a href='javascript:void(0)' onclick='DocHistory.showRevertConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("恢复") + "</a>";
						opBtn3 = "		<a href='javascript:void(0)' onclick='DocHistory.showResetConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("回退") + "</a>";
						opBtn4 = "		<a href='javascript:void(0)' onclick='DocHistory.showDeleteConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("删除") + "</a>";
						break;
					case 2:
					case 3:
						opBtn = "		<a href='javascript:void(0)' onclick='DocHistory.showHistoryDetail("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("详情") + "</a>";							
						opBtn1 = "		<a href='javascript:void(0)' onclick='DocHistory.showDownloadConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("下载") + "</a>";
						opBtn2 = "		<a href='javascript:void(0)' onclick='DocHistory.showRevertConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("恢复") + "</a>";
						opBtn3 = "		<a href='javascript:void(0)' onclick='DocHistory.showResetConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("回退") + "</a>";
						opBtn4 = "		<a href='javascript:void(0)' onclick='DocHistory.showDeleteConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("删除") + "</a>";
						break;
					case 4:
						opBtn = "		<a href='javascript:void(0)' onclick='DocHistory.showHistoryDetail("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("详情") + "</a>";							
						opBtn1 = "		<a href='javascript:void(0)' onclick='DocHistory.showDownloadConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("下载") + "</a>";
						opBtn2 = "		<a href='javascript:void(0)' onclick='DocHistory.showRevertConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("恢复") + "</a>";
						opBtn3 = "";
						opBtn4 = "		<a href='javascript:void(0)' onclick='DocHistory.showDeleteConfirm("+i+ ")' class='mybtn-primary' style='margin-bottom:20px;width:80px;'>" + _Lang("删除") + "</a>";
						break;
					}
					
					var se = "<li id='historyItem" + i + "'>"
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
						+ 		opBtn3 
						+ 		opBtn4 
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
	        
	        loadMoreHistory: function(){
	        	loadMoreHistory();
	        },
	        showHistoryDetail: function(index){
	        	showHistoryDetail(index);
	        },
	        
	        viewVDocHistory: function(index){
	        	viewVDocHistory(index);
	        },
	        
	        showDownloadConfirm: function(index){
	        	showDownloadConfirm(index);
	        },
	        
	        showRevertConfirm: function(index)
			{
	        	showRevertConfirm(index);
			},
	        showResetConfirm: function(index)
			{
	        	showResetConfirm(index);
			},
	        showDeleteConfirm: function(index)
			{
	        	showDeleteConfirm(index);
			}	
	    };
	})();