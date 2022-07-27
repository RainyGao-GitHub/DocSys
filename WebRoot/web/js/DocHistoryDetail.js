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
			
			if(docId == undefined)
			{
				docId = 0;
			}
			showHistoryDetailList(commitId, reposId, docId, parentPath, docName, historyType);	
		}
		
		function viewHistory(index)
		{			
			var changeItem = changeItems[index];

			var entryPath = changeItem.entryPath;
			console.log("viewHistory() commitId:" +commitId  + " reposId:" + reposId  + " entryPath:"+ entryPath + " historyType:" + historyType);
		    var docInfo = buildBasicDoc(entryPath, "");
		    docInfo.vid = reposId;
		    docInfo.type = 1;
		    docInfo.isHistory = 1;
		    docInfo.commitId = commitId;
		    docInfo.docType = historyType == 0? 1:2;
		    ////openDoc(docInfo, false, "openInArtDialog", "office", gShareId);
		    openDoc(docInfo, false, "openInDialog", "office", gShareId);
		}
			
		function downloadHistory(index)
		{			
			var changeItem = changeItems[index];
			
			var docId = "";
			var pid = "";
			var entryPath = changeItem.entryPath;
			
		   	console.log("downloadHistoryDocPrepare() commitId:" +commitId  + " reposId:" + reposId  + " entryPath:"+ entryPath + " historyType:" + historyType);
		   	
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
               	        	SubContext.downloadAll = 1;	
               	        	SubContext.shareId = gShareId;	
               	        	
               	        	startDownloadPrepareQueryTask(SubContext, ret.data.id, 2000); //2秒后查询
               	        	return;
                	    }
              	        
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
               	        		info = "目录压缩中(" + getFileDisplaySize(prepareTask.targetSize) + ")...";
               	        	}
               	        	console.log("doQueryDownloadPrepareTask info:" + info);
               	        	startDownloadPrepareQueryTask(SubContext, prepareTask.id, nextDelayTime);
               	        	return;
                	    }
               	        
               	        //下载任务准备完成
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
	                   	bootstrapQ.alert({
		      			    //id: "downloadHistoryDocPrepareError",
							msg : "下载失败:" + ret.msgInfo,
						    }); 
	                	return;
                   }
                },
                error : function () {	//后台异常
                	console.log("doQueryDownloadPrepareTask 下载失败：服务器异常！");
	               	bootstrapQ.alert({
	      			    //id: "downloadHistoryDocPrepareError",
						msg : "下载失败:服务器异常",
					    }); 
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

		function showRevertConfirm(index)
		{
			var changeItem = changeItems[index];
			
			var docId = "";
			var pid = "";
			var entryPath = changeItem.entryPath;

		   	console.log("showRevertConfirm() commitId:" +commitId  + " reposId:" + reposId + " entryPath:"+ entryPath + " historyType:" + historyType);

		   	var msg = "";	
		   	var docPath = "/" + parentPath + docName;
		   	if(historyType == 0)
            {
		   		msg = "恢复 " + entryPath + " 到版本:" + commitId + "?";
            }
            else
            {
            	if(docId == 0)
            	{
    		   		msg = "恢复仓库备注到版本:" + commitId + "?";
            	}
            	else
            	{
		   			msg = "恢复 " + docPath + " 的备注到版本:" + commitId + "?";
            	}
            }	
            
		   	qiao.bs.confirm({
		        id: 'revertHistoryConfirm',
		        msg: msg,
		    },function(){
		    	console.log("showRevertConfirm() revert commitId:" +  + " reposId:" + reposId  + " docId:"+ docId + " parentPath:" + parentPath + " docName:" + docName + " historyType:" + historyType + " entryPath:" + entryPath);			         	
		    	revertHistory(index);
		    },function(){
		        //alert('点击了取消！');
		    });
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
		             shareId: gShareId,
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
				if(!data || data.length==0){
					$("#historyDetails").append("<p>暂无数据</p>");
					return;
				}
				
				changeItems = data;
				for(var i=0;i<data.length;i++){
					var d = data[i];
					
					var changeType = getChangeType(d);
					var entryPath = d.entryPath;
					var srcEntryPath = d.srcEntryPath;

					var changeContent = "			<a id='docPath"+i+"' href='javascript:void(0)'>"+entryPath+"</a>";
					if(d.changeType == 4 || d.changeType == 5)
					{
						changeContent = "			<a id='docPath"+i+"' href='javascript:void(0)'>"+entryPath+ " from " + srcEntryPath + "</a>";
					}

					var	opBtn1 = "		<a href='javascript:void(0)' onclick='DocHistoryDetail.viewHistory("+i+ ")' class='mybtn-primary' style='margin-bottom:20px'>查看</a>";
					var	opBtn2 = "		<a href='javascript:void(0)' onclick='DocHistoryDetail.downloadHistory("+i+ ")' class='mybtn-primary' style='margin-bottom:20px'>下载</a>";
					var	opBtn3 = "		<a href='javascript:void(0)' onclick='DocHistoryDetail.showRevertConfirm("+i+ ")' class='mybtn-primary'>恢复</a>";
					
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
						+ 		opBtn3 
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
	        viewHistory: function(index){
	        	viewHistory(index);
	        },
	        downloadHistory: function(index){
	        	downloadHistory(index);
	        },
	        showRevertConfirm: function(index)
			{
	        	showRevertConfirm(index);
			}
	    };
	})();