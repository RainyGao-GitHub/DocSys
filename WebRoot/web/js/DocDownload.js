	//DocDownload类	
    var DocDownload = (function () {
        /*全局变量*/
        var reposId;
        var isDownloading = false;	//文件下载中标记
        var stopFlag = false;	//结束下载
        var drawedNum = 0; //已绘制的进度条个数
        var downloadedNum = 0; //已下载个数
        var successNum = 0;	//成功下载个数
		var failNum = 0; //下载失败个数
		
		var previousTimestamp = 0; //上一个下载时间
		
        /*Content 用于保存文件下载的初始信息*/
        var Content = {};
        Content.BatchList = [];
        Content.batchNum = 0;	//totalBatchNum
        Content.batchIndex = 0;	//curBatchIndex
        Content.state = 0;	//0: all Batch not inited 1: Batch Init is on going 2: Batch Init completed
        Content.initedFileNum = 0;
        Content.totalFileNum = 0; 
        
        /*downloadDoc conditions 用于指示当前的下载文件及下载状态*/
        var index = 0; //当前操作的索引
        var totalNum = 0; 
 		var SubContextList = []; //文件下载上下文List，用于记录单个文件的下载情况，在开始下载的时候初始化
 		
 		//下载线程计数器
 		var threadCount = 0;
 		var maxThreadCount = 3;
 		
 		var SubContextHashMap = {};

        function getDownloadStatus()
        {
        	var downloadStatus = "idle";
        	if(isDownloading == true)
        	{
        		downloadStatus = "busy";
        	}
        	console.log("downloadStatus: " + downloadStatus);
        	return downloadStatus;
        }
 		
		//提供给外部的多文件download接口
		function downloadDocs(treeNodes, dstParentNode, vid, downloadType)	//多文件下载函数
		{
			console.log("downloadDocs reposId:" + vid + " downloadType:" + downloadType + " treeNodes:", treeNodes);
			if(!treeNodes || treeNodes.length <= 0)
			{
				showErrorMessage("请选择需要下载的文件!");
				return;
			}
			
			//get the parentInfo
		  	var dstPath = "";
		  	var dstPid = 0;
		  	var dstLevel = 0;
			if(dstParentNode && dstParentNode != null)
			{
				dstPath = dstParentNode.path + dstParentNode.name+"/";
				dstPid = dstParentNode.id;
				dstLevel = dstParentNode.level+1;
			}
			else
			{
				dstParentNode = null;
			}

			console.log("downloadDocs dstParentNode:", dstParentNode);

			if(isDownloading == true)
			{
				DocDownloadAppend(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid, downloadType);
	    		//尝试触发多线程下载
	        	downloadNextDoc();

			}
			else
			{
				DocDownloadInit(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid, downloadType);
				downloadDoc();
			}			
		}
		
      	//初始化DocDownload
      	function DocDownloadInit(treeNodes,dstParentNode,dstPath,dstPid,dstLevel,vid, downloadType)	//多文件下载函数
		{
			console.log("DocDownloadInit() downloadType:" + downloadType);
			var fileNum = treeNodes.length;
			console.log("DocDownloadInit() fileNum:" + fileNum);				

			//清空所有全局变量
			stopFlag = false; //停止下载标志
	        downloadedNum = 0; //已下载个数
	        successNum = 0;	//成功下载个数
			failNum = 0; //下载失败个数
			drawedNum =0; //已绘制个数
			
			//Build Batch
			var Batch = {};
			Batch.treeNodes = treeNodes;
			Batch.dstParentNode = dstParentNode;
			Batch.dstPath = dstPath;
			Batch.dstPid = dstPid;
			Batch.dstLevel = dstLevel;
			Batch.vid = vid;
			Batch.num = fileNum;
			Batch.index = 0;
			Batch.state = 0;
			Batch.downloadType = downloadType;	//1: realDoc 2: VDoc
			
			//add to Content
			Content.BatchList = [];
			Content.BatchList.push(Batch);			
			Content.batchNum = 1;
	        Content.totalFileNum = fileNum;
			totalNum = Content.totalFileNum;
			
			//Init Content state
			Content.initedFileNum = 0;
			Content.batchIndex = 0;
			Content.state = 1;
			console.log("DocDownloadInit Content:", Content);
	        
			
			isDownloading = true;
			
			//清空上下文列表
			SubContextList = [];

			//清空SubContextHashMap
			SubContextHashMap = {};
			
			//Set the Index
			index = 0;
			
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(Content, SubContextList, 1000);
			console.log("文件总的个数为："+totalNum);
			
			if(SubContextList.length > 0)
		   	{
		   		//初始化上传进度显示
				var str="<div><span class='download-list-title'>下载列表  (共 " + totalNum + " 个) </span><i class='el-icon-close downloadCloseBtn'></i></div>";
				str +="<div id='downloadedFileList' class='downloadedFileList'></div>";
				$(".el-download-list").show();
				$('.el-download-list').html(str);
				drawDownloadItems(SubContextList);
		   	}
      	}
      	
      	//初始化文件的SubContext,并绘制对应的进度条
      	function drawDownloadItems(SubContextList)
      	{
      			//获取当前总的下载文件数
      			var totalNum = Content.initedFileNum;
      			
      			//Prepare to drawed
      			var startIndex = drawedNum;
      			var endIndex = totalNum;
      			var str = "";
      			for( var i = startIndex ; i < endIndex ; i++ )
		    	{	
		    		//console.log("index:" + i);
		    		var SubContext = SubContextList[i];
					str+="<li class='el-download-list__item downloadFile"+i+" is-downloading' value="+i+">"+
		    				"<a class='el-download-list__item-name downloadFileName'><i class='el-icon-document'></i><span class='downloadFileName' >"+SubContext.name+"</span></a>"+
		    				"<a class='downloadStatus downloadInfo"+i+"' >待下载...</a>"+
		    				"<label class='el-download-list__item-status-label'><i class='el-icon-download-success el-icon-circle-check'></i></label>"+
		    				"<i class='el-icon-close stopDownload'  value="+i+" onclick='DocDownload.stopDownload("+i+")'></i>"+
		    				"<div class='el-progress el-progress--line'>"+
		    					"<div class='el-progress-bar'>"+
		    						"<div class='el-progress-bar__outer' >"+
		    							"<div class='el-progress-bar__inner'></div>"+
		    						"</div>"+
		    					"</div>"+
		    					"<div class='el-progress__text' style='font-size: 12.8px;'></div>"+
		    				"</div>"+
		    			  "</li>";
		    		//已绘制个数增1
		    		drawedNum++;	    		
				}
				$('#downloadedFileList').append(str);		
      	}
      	
      	//增加下载文件
      	function DocDownloadAppend(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid, downloadType)	//多文件下载函数
		{
			console.log("DocDownloadAppend() downloadType:" + downloadType);

			if(!treeNodes)
			{
				console.log("DocDownloadAppend() treeNodes is null");
				return;
			}

			var fileNum = treeNodes.length;
			console.log("DocDownloadAppend() fileNum:" + fileNum);

			//Build Batch
			var Batch = {};
			Batch.treeNodes = treeNodes;
			Batch.dstParentNode = dstParentNode;
			Batch.dstPath = dstPath;
			Batch.dstPid = dstPid;
			Batch.dstLevel = dstLevel;
			Batch.vid = vid;
			Batch.num = fileNum;
			Batch.index = 0;
			Batch.state = 0;
			Batch.downloadType = downloadType;	//1: realDoc 2: VDoc

			//Append to Content
			Content.BatchList.push(Batch);
			Content.batchNum++;
			Content.totalFileNum += fileNum;
			totalNum = Content.totalFileNum;
			
			console.log("DocDownloadAppend() Content:", Content);
			
			if(Content.state == 2)	//Batch already initiated, need to restart it
			{
				Content.batchIndex++;
				Content.state = 1;
				buildSubContextList(Content, SubContextList, 1000);
			}
			
			console.log("文件总的个数为："+Content.totalFileNum);
			
			//绘制文件下载列表
			drawDownloadItems(SubContextList);
			
			$(".download-list-title").text("下载列表 (共   " + totalNum + " 个)");			
		}
      	
      	//并将需要下载的文件加入到SubContextList中
		function buildSubContextList(Content, SubContextList, maxInitNum)
		{
			if(Content.state == 2)
			{
				return;
			}
			
      		console.log("buildSubContextList() maxInitNum:" + maxInitNum);
			
      		var curBatchIndex = Content.batchIndex;
      		var Batch = Content.BatchList[curBatchIndex];
      		console.log("buildSubContextList() Content curBatchIndex:" + curBatchIndex + " num:" + Content.batchNum );
    		
      		var treeNodes = Batch.treeNodes;
      		var dstParentNode = Batch.dstParentNode;
      		var dstPath = Batch.dstPath;
      		var dstLevel = Batch.dstLevel;
      		var dstPid = Batch.dstPid;
      		var vid = Batch.vid;
      		var index = Batch.index;
      		var fileNum =  Batch.num;
      		var downloadType = Batch.downloadType;
      		console.log("buildSubContextList() Batch index:" + index + " fileNum:" + fileNum );
      		
      		var count = 0;
			console.log("buildSubContextList fileNum:" + fileNum);
    		for( var i = index ; i < fileNum ; i++ )
    		{
 				count++;
 				if(count > maxInitNum)
 				{
 					//buildSubContext 每次最多1000个
 					return;
 				}
 				
 				Batch.index++;
 				Content.initedFileNum++;
 				
    			var treeNode = treeNodes[i];
    	   		if(treeNode && treeNode != null)
    	   		{
    	   		   	var SubContext ={};
    	   		   	var timestamp = Date.now();
    	   		   	//Doc Info
    	   		   	SubContext.treeNode = treeNode;
        			SubContext.vid = vid;
    	   		   	SubContext.docId = treeNode.id;  
    	   		   	SubContext.pid = treeNode.pid;
		    		SubContext.path = treeNode.path;
		    		SubContext.name = treeNode.name;
    	   		   	SubContext.level = treeNode.level;		
    	   		   	SubContext.type = treeNode.isParent == true? 2: 1;	
		    	   	SubContext.size = treeNode.size;
    	   		   	SubContext.lastestEditTime = treeNode.latestEditTime;
    	   		    SubContext.downloadType = downloadType;
			    	
    	   		   	//dst ParentNode Info
    	   		   	SubContext.dstParentNode = dstParentNode;
    	   		   	SubContext.dstPath = dstPath;
    	   		   	SubContext.dstPid = dstPid;
    	   		   	SubContext.dstLevel = dstLevel;
    	   		   	SubContext.dstName = treeNode.name;

			    	//Status Info
		    	   	SubContext.state = 0;	//未开始下载
		    	   	SubContext.status = "待下载";	//未开始下载
		    	   	SubContext.stopFlag = false; //停止标记false
		    	   	
		    	   	//threadState
		    	   	SubContext.threadState = 0; //0:下载线程未启动, 1:下载线程已启动, 2:下载线程已终止
		    	   			    	   	
		    	   	SubContext.startTime = Date.now();
		    	   	
		    	   	//Push the SubContext
		    		SubContext.index = SubContextList.length; //SubContext在List中的index
		    	   	SubContextList.push(SubContext);
		    	   	SubContextHashMap[SubContext.docId + "-" + SubContext.startTime] = SubContext.index;
    	   		}
	    	}
    		
    		Batch.state = 2;
    		if((Content.batchIndex + 1) == Content.batchNum) //It is the last batchIndex
    		{
    			Content.state = 2;
    			console.log("buildSubContextList() all Batch Inited");
    		}
    		else
    		{
    			Content.batchIndex++;
    			Content.state = 1;
    			console.log("buildSubContextList() there is more Batch need to be Inited");
    		}
	   	}
      	
		//downloadDoc接口，该接口是个递归调用
    	function downloadDoc()
    	{    		
    		//files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
    		}
    		
			//判断是否取消下载
    		if(stopFlag == true)
    		{
    			console.log("downloadDoc(): 结束下载");
    			downloadEndHandler();
    			return;
    		}
    		
    		var SubContext = SubContextList[index];
    		console.log("downloadDoc() index:" + index + " totalNum:" + totalNum, SubContext);
    		if(SubContext.stopFlag == true)
    		{
    			downloadNextDoc();
    			return;
    		}
    		
    		$(".downloadInfo"+index).text("下载准备中...");
    		
    		IncThreadCount(SubContext);
    		
			//执行后台downloadDoc操作
    		$.ajax({
                url : "/DocSystem/Doc/downloadDocPrepare.do",
                type : "post",
                dataType : "json",
                timeout : 0,	//永不超时 
                data : {
                    reposId: SubContext.vid,
                	docId : SubContext.docId,
                    pid: SubContext.pid,
                    path: SubContext.path,
                    name: SubContext.name,
                    downloadType: SubContext.downloadType,
                    shareId: gShareId,
                },
                success : function (ret) {
                   if(SubContext.stopFlag == true)
                   {
                	   console.log("downloadDoc download task 已取消", SubContext);
                	   return;
                   }
                   
                   var SubContextIndex = SubContextHashMap[SubContext.docId + "-" + SubContext.startTime];
                   if(SubContextIndex == undefined)
                   {
                	   console.log("downloadDoc 未找到对应的索引", SubContext);
                	   return;                	   
                   }
                   console.log("downloadDoc SubContextIndex:" + SubContextIndex, SubContext);
                   
                   if( "ok" == ret.status )
                   {    
                	    console.log("downloadDocPrepare Ok:",ret);        
               	        if(ret.msgData == 5)
                	    {
               	        	//下载目录压缩中
               	        	$(".downloadInfo"+SubContextIndex).text(ret.data.info);
               	        	startDownloadPrepareQueryTask(SubContext, ret.data.id, 2000); //2秒后查询
               	        	return;
                	    }
               	        
               	        //下载任务准备完成
               	        DecThreadCount(SubContext);
               	        
               	        var vid =  SubContext.vid;
            	   		var path = ret.data.path;
            	   		var name = ret.data.name;
            	   		var targetName = ret.data.targetName;
                	    var targetPath = ret.data.targetPath;
                	    var deleteFlag = ret.msgData;
            	   		
                	    path = encodeURI(path);
                	    name = encodeURI(name);
                	    targetName = encodeURI(targetName);
            		   	targetPath = encodeURI(targetPath);
            		   	var url = "/DocSystem/Doc/downloadDoc.do?vid=" + vid + "&path=" + path + "&name=" + name + "&targetPath=" + targetPath + "&targetName=" + targetName + "&deleteFlag="+deleteFlag + "&encryptEn=1";
            		   	if(gShareId)
            		   	{
            		   		url += "&shareId=" + gShareId;
            		   	}
            		   	
            		   	var delayTime = getDownloadDelayTime();
            		   	if(delayTime > 0)
            		   	{
            		   		console.log("downloadDocPrepare 延时启动文件下载: " + SubContext.name);
            		   		//延时启动下载
	            		   	setTimeout(function(){
	            		   		console.log("downloadDocPrepare download start for " + SubContext.name);
	            		   		window.location.href = url;
	            		   		
	    						$('.downloadFile'+SubContextIndex).removeClass('is-downloading');
	    						$('.downloadFile'+SubContextIndex).addClass('is-success');
	    						$(".downloadInfo"+SubContextIndex).hide();
	            		   		downloadSuccessHandler(SubContext, ret.msgInfo);
	                	   	}, delayTime);
            		   	}
            		   	else
            		   	{
            		   		console.log("downloadDocPrepare download start for " + SubContext.name);
            		   		window.location.href = url;
            		   		$('.downloadFile'+SubContextIndex).removeClass('is-downloading');
    						$('.downloadFile'+SubContextIndex).addClass('is-success');
    						$(".downloadInfo"+SubContextIndex).hide();
            		   		downloadSuccessHandler(SubContext, ret.msgInfo);
            		   	}
                	   	return;
                   }
                   else	//后台报错，结束下载
                   {
                	   console.log("downloadDocPrepare Error:" + ret.msgInfo);
                	   DecThreadCount(SubContext);
                	   
                	   $('.downloadFile'+SubContextIndex).removeClass('is-uploading');
   					   $('.downloadFile'+SubContextIndex).addClass('is-fail');
   					   $(".downloadInfo"+SubContextIndex).text("下载失败");
                       downloadErrorConfirm(SubContext,ret.msgInfo);
                       return;
                   }
                },
                error : function () {	//后台异常
                   if(SubContext.stopFlag == true)
                   {
                 	   console.log("downloadDoc download task 已取消", SubContext);
                 	   return;
                   }
                    
                   var SubContextIndex = SubContextHashMap[SubContext.docId + "-" + SubContext.startTime];
                   if(SubContextIndex == undefined)
                   {
                 	   console.log("downloadDoc 未找到对应的索引", SubContext);
                 	   return;                	   
                   }
                   console.log("downloadDoc SubContextIndex:" + SubContextIndex, SubContext);
                   DecThreadCount(SubContext);

                   console.log("downloadDocPrepare 服务器异常：文件[" + SubContext.name + "]下载异常！");
 	               $('.downloadFile'+SubContextIndex).removeClass('is-uploading');
				   $('.downloadFile'+SubContextIndex).addClass('is-fail');
				   $(".downloadInfo"+SubContextIndex).text("下载失败");
				   downloadErrorConfirm(SubContext,"服务器异常");
            	   return;
                }
        	});
    		
    		//启动下一个下载线程
        	downloadNextDoc();
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

                   if(SubContext.stopFlag == true)
                   {
                	   console.log("doQueryDownloadPrepareTask download task 已取消", SubContext);
                	   return;
                   }
                   
                   var SubContextIndex = SubContextHashMap[SubContext.docId + "-" + SubContext.startTime];
                   if(SubContextIndex == undefined)
                   {
                	   console.log("doQueryDownloadPrepareTask 未找到对应的索引", SubContext);
                	   return;                	   
                   }
                   console.log("doQueryDownloadPrepareTask SubContextIndex:" + SubContextIndex, SubContext);
                   
                   if( "ok" == ret.status )
                   {    
               	        if(ret.msgData == 5)
                	    {
               	        	//下载目录压缩中
               	        	var compressTask = ret.data;
               	        	var info = compressTask.info;
               	        	if(compressTask.targetSize)
               	        	{
               	        		info = "目录压缩中(" + getFileDisplaySize(compressTask.targetSize) + ")...";
               	        	}
               	        	$(".downloadInfo"+SubContextIndex).text(info);
               	        	
               	        	startDownloadPrepareQueryTask(SubContext, compressTask.id, nextDelayTime);
               	        	return;
                	    }
               	        
               	        //下载任务准备完成
               	        DecThreadCount(SubContext);              	        

               	        var vid =  SubContext.vid;
            	   		var path = ret.data.path;
            	   		var name = ret.data.name;
            	   		var targetName = ret.data.targetName;
                	    var targetPath = ret.data.targetPath;
                	    var deleteFlag = ret.msgData;
            	   		
                	    path = encodeURI(path);
                	    name = encodeURI(name);
                	    targetName = encodeURI(targetName);
            		   	targetPath = encodeURI(targetPath);
            		   	var url = "/DocSystem/Doc/downloadDoc.do?vid=" + vid + "&path=" + path + "&name=" + name + "&targetPath=" + targetPath + "&targetName=" + targetName + "&deleteFlag="+deleteFlag + "&encryptEn=1";
            		   	if(gShareId)
            		   	{
            		   		url += "&shareId=" + gShareId;
            		   	}
            		   	
            		   	var delayTime = getDownloadDelayTime();
            		   	if(delayTime > 0)
            		   	{
            		   		console.log("doQueryDownloadPrepareTask 延时启动文件下载: " + SubContext.name);
            		   		//延时启动下载
	            		   	setTimeout(function(){
	            		   		console.log("doQueryDownloadPrepareTask download start for " + SubContext.name);
	            		   		window.location.href = url;
	            		   		
	    						$('.downloadFile'+SubContextIndex).removeClass('is-downloading');
	    						$('.downloadFile'+SubContextIndex).addClass('is-success');
	    						$(".downloadInfo"+SubContextIndex).hide();
	            		   		downloadSuccessHandler(SubContext, ret.msgInfo);
	                	   	}, delayTime);
            		   	}
            		   	else
            		   	{
            		   		console.log("doQueryDownloadPrepareTask download start for " + SubContext.name);
            		   		window.location.href = url;
            		   		$('.downloadFile'+SubContextIndex).removeClass('is-downloading');
    						$('.downloadFile'+SubContextIndex).addClass('is-success');
    						$(".downloadInfo"+SubContextIndex).hide();
            		   		downloadSuccessHandler(SubContext, ret.msgInfo);
            		   	}
                	   	return;
                   }
                   else	//后台报错，结束下载
                   {
                	   console.log("doQueryDownloadPrepareTask Error:" + ret.msgInfo);
                	   DecThreadCount(SubContext);
                	   
                	   $('.downloadFile'+SubContextIndex).removeClass('is-uploading');
   					   $('.downloadFile'+SubContextIndex).addClass('is-fail');
   					   $(".downloadInfo"+SubContextIndex).text("下载失败");
                       downloadErrorConfirm(SubContext,ret.msgInfo);
                       return;
                   }
                },
                error : function () {	//后台异常
                   if(SubContext.stopFlag == true)
                   {
                 	   console.log("doQueryDownloadPrepareTask download task 已取消", SubContext);
                 	   return;
                   }
                    
                   var SubContextIndex = SubContextHashMap[SubContext.docId + "-" + SubContext.startTime];
                   if(SubContextIndex == undefined)
                   {
                 	   console.log("doQueryDownloadPrepareTask 未找到对应的索引", SubContext);
                 	   return;                	   
                   }
                   console.log("doQueryDownloadPrepareTask SubContextIndex:" + SubContextIndex, SubContext);
                   DecThreadCount(SubContext);

                   console.log("doQueryDownloadPrepareTask 服务器异常：文件[" + SubContext.name + "]下载异常！");
 	               $('.downloadFile'+SubContextIndex).removeClass('is-uploading');
				   $('.downloadFile'+SubContextIndex).addClass('is-fail');
				   $(".downloadInfo"+SubContextIndex).text("下载失败");
				   downloadErrorConfirm(SubContext,"服务器异常");
            	   return;
                }
        	});
    		
    		//启动下一个下载线程
        	downloadNextDoc();    		
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
    	
    	function getDownloadDelayTime()
    	{
		   	var delayTime = 0;
		   	var curTimestamp = new Date().getTime();
		   	console.log("getDownloadDelayTime() curTimestamp:" + curTimestamp + " previousTimestamp:" + previousTimestamp);

		   	if(previousTimestamp != 0)
		   	{
			   	var passedTime = curTimestamp - previousTimestamp;
			   	console.log("getDownloadDelayTime() passedTime:" + passedTime);
			   	if(passedTime < 2000)
			   	{
			   		delayTime = 2000 - passedTime;
			   	}
			   	console.log("getDownloadDelayTime() delayTime:" + delayTime);
		   	}
			
		   	previousTimestamp = curTimestamp + delayTime;
		   	return delayTime;
    	}
    	
    	function IncThreadCount(SubContext)
        {
    		if(SubContext.threadState == 0)
    		{
    			SubContext.threadState = 1;
    			threadCount++;
    		}
        }
    	
    	function DecThreadCount(SubContext)
        {
    		if(SubContext.threadState == 1)
    		{
    			SubContext.threadState = 2;
        		threadCount--;    			
    		}
        }


		function downloadNextDoc()
		{
			//检测当前运行中的下载线程
        	console.log("downloadNextDoc threadCount:" + threadCount + " maxThreadCount:" + maxThreadCount);				
			if(threadCount > maxThreadCount)
			{
	        	console.log("downloadNextDoc 下载线程池已满，等待下载线程结束");				
				return;
			}
			
	        console.log("downloadNextDoc index:" + index + " totalNum:" + totalNum);
	        if(index < (totalNum-1)) //下载没结束，且回调函数存在则回调，否则表示结束
	        {
		        index++;
	        	console.log("downloadNextDoc start download");
	        	downloadDoc();
	        }
	        else	//下载任务已全部启动，检测是否全部下载都已结束
	        {
	        	console.log("downloadNextDoc all download started");
	        	downloadEndHandler();
	        }
		}
		
      	function downloadErrorConfirm(SubContext,errMsg)
      	{
      		var FileName = SubContext.name; 
      		var msg = FileName + "下载失败,是否继续下载其他文件？";
      		if(errMsg != undefined)
      		{
      			msg = FileName + "下载失败(" + errMsg + "),是否继续下载其他文件？";
      		}
      		//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: "downloadErrorConfirm",
    	        msg: msg,
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束",
    	    },function () {
    	    	downloadErrorHandler(SubContext, errMsg);
    	    	return true;
			},function(){
    	    	//alert("点击了取消");
				downloadErrorAbortHandler(SubContext, errMsg);
    	    	return true;
      		});
      	}
      	
      	//downloadErrorHandler
      	function downloadErrorHandler(SubContext,errMsg)
      	{
      		console.log("downloadErrorHandler() "+ SubContext.name + " " + errMsg);
      		
      		failNum++;
			DecThreadCount(SubContext);
      		
      		//设置下载状态
			SubContext.state = 3;	//下载结束
      		SubContext.status = "fail";
			SubContext.msgInfo = errMsg;
			downloadNextDoc();		 	
      	}
      	
      	//downloadErrorAbortHandler
      	function downloadErrorAbortHandler(SubContext,errMsg)
      	{
      		console.log("downloadErrorAbortHandler() "+ SubContext.name + " " + errMsg);
      	
      		failNum++;
			DecThreadCount(SubContext);
      		
    		//设置下载状态
			SubContext.state = 3;	//下载结束
      		SubContext.status = "fail";
      		SubContext.msgInfo = errMsg;
      		downloadEndHandler();
      	}
      	
      	//downloadSuccessHandler
      	function downloadSuccessHandler(SubContext, msgInfo)
      	{	
      		console.log("downloadSuccessHandler() "+ SubContext.name + " " + msgInfo);
      		
      		successNum++;
			DecThreadCount(SubContext);
	      	
	      	SubContext.state = 2;	//下载结束
      		SubContext.status = "success";
      		SubContext.msgInfo = msgInfo;
      		$('.downloadFile'+SubContext.index+' .el-progress-bar__inner')[0].style.width = '100%'; //进度条
      		
      		downloadNextDoc();
      	}
      	
      	//downloadEndHandler
      	function downloadEndHandler()
      	{
      		console.log("downloadEndHandler() totalNum:" + totalNum +" successNum:"+successNum+" failNum:"+failNum);
      		if(totalNum > (successNum + failNum))
      		{
      			console.log("downloadEndHandler() 下载未结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
      			return;
      		}

  			console.log("downloadEndHandler() 下载结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
      		console.log("downloadEndHandler() SubContextList:", SubContextList);

  			//清除标记
  			isDownloading = false;
  			
      		//显示下载准备完成 
      		showDownloadEndInfo();
      		
      		
      	}
      	
  		function showDownloadEndInfo()
  		{
  			var downloadEndInfo = "下载准备完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			downloadEndInfo = "下载准备完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
      		    bootstrapQ.msg({
					msg : downloadEndInfo,
					type : 'warning',
					time : 2000,
				    }); 
      		}
      		else
      		{
	            bootstrapQ.msg({
						msg : downloadEndInfo,
						type : 'success',
						time : 2000,
					    }); 
      		}
  		}
  		
		function stopDownload(index)
		{
			console.log("stopDownload() index:" + index,SubContextList[index]);
			var SubContext = SubContextList[index];
			if(SubContext.stopFlag == false)
			{
				SubContext.stopFlag = true;
				$(".downloadInfo"+index).text("已取消");
				
				//停止的当做失败处理
				failNum++;
				DecThreadCount(SubContext)

				//触发下一个文件下载
				downloadNextDoc();
			}

		}
		
		function stopAllDownload()
		{
			console.log("stopAllDownload()");
			
			//将未上传的全部设置
			for(i=index;i<totalNum;i++)
			{
				var SubContext = SubContextList[index];
				SubContext.stopFlag = true;
				$(".downloadInfo"+i).text("已取消");

				//停止的当做失败处理
				failNum++;
				DecThreadCount(SubContext)
			}
			stopFlag = true;
			
  			//清除标记
  			isDownloading = false;
  			redownloadFlag = false;
		}
		
		//开放给外部的调用接口
        return {
            downloadDocs: function(treeNodes,dstParentNode,vid,downloadType){
            	downloadDocs(treeNodes,dstParentNode,vid,downloadType);
            },
            stopAllDownload: function(){
            	stopAllDownload();
            },
            stopDownload: function(id){
            	stopDownload(id);
            },
            getDownloadStatus: function(){
            	return getDownloadStatus();
            },
        };
    })();