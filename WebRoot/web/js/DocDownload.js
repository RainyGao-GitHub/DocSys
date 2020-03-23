	//DocDownload类	
    var DocDownload = (function () {
        /*全局变量*/
        var reposId;
        var isDownloading = false;	//文件下载中标记
        var stopFlag = false;	//结束下载
        var downloadedNum = 0; //已下载个数
        var successNum = 0;	//成功下载个数
		var failNum = 0; //下载失败个数
		
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

	        downloadedNum = 0; //已下载个数
	        successNum = 0;	//成功下载个数
			failNum = 0; //下载失败个数
			
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
			
			//Set the Index
			index = 0;
			
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(Content, SubContextList, 1000);
			console.log("文件总的个数为："+totalNum);
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
			Content.batchList.push(Batch);
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
		    		SubContext.index = i;
		    	   	SubContext.state = 0;	//未开始下载
		    	   	SubContext.status = "待下载";	//未开始下载
		    	   			      								    	   	
		    	   	//Push the SubContext
		    	   	SubContextList.push(SubContext);
    	   		}
	    	}
    		
    		Batch.state = 2;
    		Content.batchIndex++;
    		if(Content.batchIndex == Content.batchNum)
    		{
    			Content.state = 2;
    			console.log("buildSubContextList() all Batch Inited");
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
  	    	
			//执行后台downloadDoc操作
    		$.ajax({
                url : "/DocSystem/Doc/downloadDocPrepare.do",
                type : "post",
                dataType : "json",
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
                   if( "ok" == ret.status )
                   {          
                	    console.log("downloadDocPrepare Ok:",ret);                	                	   		
            	   		var targetName = ret.data.name;
                	    var targetPath = ret.data.path;
                	    var deleteFlag = ret.msgData;
            	   		
                	    //targetName = encodeURI(Base64.encode(targetName));
            		   	//targetPath = encodeURI(Base64.encode(targetPath));
                	    targetName = encodeURI(targetName);
            		   	targetPath = encodeURI(targetPath);
            		   	var url = "/DocSystem/Doc/downloadDoc.do?targetPath=" + targetPath + "&targetName=" + targetName + "&deleteFlag="+deleteFlag;
            		   	if(gShareId)
            		   	{
            		   		url += "&shareId=" + gShareId;
            		   	}
            		   	
            		   	if(index != 0)
            		   	{
            		   		console.log("downloadDocPrepare 延时启动文件下载: " + SubContext.name);
            		   		//延时2秒启动下载
	            		   	setTimeout(function(){
	            		   		console.log("downloadDocPrepare download start for " + SubContext.name);
	            		   		window.location.href = url;
	            		   		downloadSuccessHandler(SubContext, ret.msgInfo);
	                	   	}, 2000);
            		   	}
            		   	else
            		   	{
            		   		console.log("downloadDocPrepare download start for " + SubContext.name);
            		   		window.location.href = url;
            		   		downloadSuccessHandler(SubContext, ret.msgInfo);
            		   	}
                	   	return;
                   }
                   else	//后台报错，结束下载
                   {
                	   console.log("downloadDocPrepare Error:" + ret.msgInfo);
                       downloadErrorConfirm(SubContext,ret.msgInfo);
                       return;
                   }
                },
                error : function () {	//后台异常
 	               console.log("downloadDocPrepare 服务器异常：文件[" + SubContext.name + "]下载异常！");
            	   downloadErrorConfirm(SubContext,"服务器异常");
            	   return;
                }
        	});
    	}

		function downloadNextDoc()
		{
	        index++;	//download成功，则调用回调函
	        if(index < totalNum) //下载没结束，且回调函数存在则回调，否则表示结束
	        {
	        	console.log("downloadDoc Next");
	        	downloadDoc();
	        }
	        else	//下载结束，保存目录结构到后台
	        {
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
	      	
	      	SubContext.state = 2;	//下载结束
      		SubContext.status = "success";
      		SubContext.msgInfo = msgInfo;
			downloadNextDoc();
      	}
      	
      	//downloadEndHandler
      	function downloadEndHandler()
      	{
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
		
		//开放给外部的调用接口
        return {
            downloadDocs: function(treeNodes,dstParentNode,vid,downloadType){
            	downloadDocs(treeNodes,dstParentNode,vid,downloadType);
            },
        };
    })();