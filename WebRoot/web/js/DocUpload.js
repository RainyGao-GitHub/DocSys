	//DocUpload类
    var DocUpload = (function () {
        /*全局变量*/
        var isUploading = false;	//文件上传中标记
        var stopFlag = false;	//结束上传
        var drawedNum = 0; //已绘制的进度条个数
        var uploadStartedNum = 0; //已上传个数
        var successNum = 0;	//成功上传个数
		var failNum = 0; //上传失败个数
		var totalSize = 0;	//总大小
        var uploadedSize = 0; //已上传大小：uploadedFileSize + 上传中文件的loadedSize
		var uploadedFileSize = 0; //已完成上传的文件大小
		var preUploadSize = 0; //上次的已上传大小
		var uploadTime = 0; //当前上传时间
        var preUploadTime = 0; //上次的上传时间
        var uploadStartTime = 0;//上传开始时间，用于计算已用时间
        var uploadSpeed = 1000;	//1k/s
        
        /*Content 用于保存文件上传的初始信息*/
        var Content = {};
        Content.BatchList = [];
        Content.batchNum = 0;	//totalBatchNum
        Content.batchIndex = 0;	//curBatchIndex
        Content.state = 0;	//0: all UploadBatch not inited 1: Batch Init is on going 2: Batch Init completed
        Content.initedFileNum = 0;
        Content.totalFileNum = 0; 
        Content.totalFileSize = 0;
        
        /*uploadDoc conditions 用于指示当前的上传文件及上传状态*/
        var index = 0; //当前操作的索引
        var totalNum = 0; 
 		var SubContextList = []; //文件上传上下文List，用于记录单个文件的上传情况，在开始上传的时候初始化
        var vid = 0;

        //文件上传线程计数器
 		var threadCount = 0;
 		//最大文件上传线程数(10个线程是普通电脑的极限，过大容易导致浏览器过度卡顿)
 		var maxThreadCount = null;
 		
 		//分片上传线程总数（所有文件的分片线程）
 		var totalChunkThreadCount = 0;
 		//分片上传线程阈值
 		//当totalChunkThreadCount > totalChunkThreadThreshold时，单个文件分片上传线程数降为1（进入单线程模式）
 		//注意：不分片上传的文件（小文件）不受该阈值的影响
 		var totalChunkThreadThreshold = 10;
 		
 		//单个文件最大分片上传线程数（每个文件的分片上传线程计数器在各自的上下文SubContext里）
 		var maxChunkThreadCount = 10; //文件分片上传线程限制
 		
 		var SubContextHashMap = {};
        
 		//上传成功但显示仍然还在的列表
 		var displayDeleteList = [];
 		
        //状态机变量，用于实现异步对话框的实现
        var fileCoverConfirmSet = 0; //0：文件已存在时弹出确认窗口，1：文件已存在直接覆盖，2：文件已存在跳过
        var uploadErrorConfirmSet = 0; //0:上传错误时弹出确认是否继续上传窗口，1：上传错误时继续上传后续文件， 2：上传错误时停止整个上传		
        var uploadWarningConfirmSet =0; //0: 上传警告时弹出确认是否继续上传窗口，1：上传警告时继续上传后续文件 2：上传警告时停止整个上传
        
        //vars for reupload
        var reuploadFlag = false; //false: 正常上传  true: 重传
        var reuploadCount = 0; 
        var reuploadTotalNum = 0;
        var reuploadFailNum = 0;
        var reuploadSuccessNum = 0;
        var reuploadStartedNum = 0;
        var reuploadList = []; //重传列表，保存的是SubContext的index
        var reuploadIndex = 0;	//This is for reupload, the index should be reuploadList[reuploadIndex]
        
        //标准Java成员操作接口
        function getUploadStatus()
        {
        	var uploadStatus = "idle";
        	if(isUploading == true)
        	{
        		uploadStatus = "busy";
        	}
        	console.log("uploadStatus: " + uploadStatus);
        	return uploadStatus;
        }
      	
      	//设置进度条的上传取消按键的接口,该接口有性能问题不再使用
    	function itemStopUploadDelegate()
    	{
    		console.log("itemStopUploadDelegate");
      		var len = SubContextList.length;
      		if(len > 0)
      		{
      			for(var i=0;i<len;i++)
    			{
      				//设置每个上传文件的stopUpload处理函数
    	    		$('.file'+i).delegate('.stopUpload','click',function(){
    					//isUploading=false
    					//console.log($(this).attr('value'));
    					var index = $(this).attr('value');	//value 不是i的原生属性，所以不能用value
    					console.log("stopUpload " + index);
    					DocUpload.stopUpload(index);
    				});
    			}
      		}
    	}
    	
		//多文件Upload接口
		function uploadDocs(files,parentNode,parentPath,parentId,level,vid,commitMsg)	//多文件上传函数
		{
			console.log("uploadDocs() commitMsg:" + commitMsg);
			
			if(!files || files.length <= 0)
			{
				showErrorMessage("请选择需要上传的文件!");
				return;
			}
			
			if(isUploading == true)
			{
				DocUploadAppend(files,parentNode,parentPath,parentId,level,vid,commitMsg);
				uploadNextDoc();
			}
			else
			{
				//初始化文件上传参数
				DocUploadInit(files,parentNode,parentPath,parentId,level,vid,commitMsg);
				
				uploadTime = new Date().getTime();	//初始化上传时间
				uploadStartTime = uploadTime;
				preUploadTime = uploadTime;
				//启动第一个Doc的Upload操作      		
				uploadDocById(index);	//start upload
			}
		}
		
		//初始化DocUpload设置
      	function DocUploadInit(files,parentNode, parentPath, parentId, level, vid,commitMsg)	//多文件移动函数
		{
			console.log("DocUploadInit() commitMsg:" + commitMsg);
			if(!files)
			{
				console.log("DocUploadInit() files undefined");		
				showErrorMessage("请选择文件!");
				return;
			}
			
			if(files.length <= 0)
			{
				showErrorMessage("请选择文件!");
				return;
			}

			var fileNum = files.length;
			console.log("DocUploadInit() fileNum:" + fileNum);				

			//Add BatchInfo to Content
			var Batch = {};
			Batch.files = files;
			Batch.parentNode = parentNode;
			Batch.parentPath = parentPath;
			Batch.parentId = parentId;
			Batch.commitMsg = commitMsg;
			Batch.level = level;
			Batch.vid = vid;
			Batch.num = fileNum;
			Batch.index = 0;
			Batch.state = 0;
			
			//Init Content.BatchList
			Content.BatchList = [];
			Content.BatchList.push(Batch);
			Content.batchNum = 1;
			Content.totalFileNum = fileNum;
			totalNum = Content.totalFileNum;
			
	        //Set Content Index and State
	        Content.initedFileNum = 0;
	        Content.totalFileSize = 0;
			Content.batchIndex = 0;
			Content.state = 1;
	        
	        console.log("DocUploadInit Content:", Content);
	        
			showUploadingInfo();
			
			//设置为正在上传，避免被其他上传中断
			isUploading = true;
			
			reuploadFlag = false; //false: 正常上传  true: 重传
	        
			//清空所有全局变量
			stopFlag = false;
			fileCoverConfirmSet = 0;
			uploadErrorConfirmSet = 0;
			uploadWarningConfirmSet = 0;
			uploadStartedNum = 0;
			successNum = 0;
			failNum = 0;
			drawedNum =0;
	
			//清空上下文列表
			SubContextList = [];
			
			//清空FailList
			FailList = [];
			
			//清空SubContextHashMap
			SubContextHashMap = {};
			
			//Set the Index
			index = 0;
			
			//Build SubContextList(totalFileNum and totalSize will also be caculated)
			buildSubContextList(Content,SubContextList,10);
			totalSize = Content.totalFileSize;
			console.log("文件总的个数为："+totalNum + " 文件总的大小为："+totalSize);
			
			//Draw UploadItems by Go through the SubContextList
			preUploadSize = 0;
			uploadedFileSize = 0;
			if(SubContextList.length > 0)
		   	{
		   		//初始化上传进度显示
				var str="<div><span class='upload-list-title'>正在上传  " +index +" / " + totalNum +"</span><span class='reuploadAllBtn' onclick='reuploadFailDocs()' style='display:none'>全部重传 </span><i class='el-icon-close uploadCloseBtn'></i></div>";
				str +="<div id='uploadedFileList' class='uploadedFileList'></div>";
				$(".el-upload-list").show();
				$('.el-upload-list').html(str);
				
				showDownloadBox($(".el-upload-list").height() + 40);
				
				checkAndDrawUploadItems(SubContextList);
		   	}
      	}
      	
      	//增加上传文件
      	function DocUploadAppend(files,parentNode, parentPath, parentId, level, vid,commitMsg)	//多文件移动函数
		{
			console.log("DocUploadAppend() commitMsg:" + commitMsg);
			if(!files)
			{
				console.log("DocUploadAppend() files is null");
				return;
			}

			var fileNum = files.length;
			console.log("DocUploadAppend() fileNum:" + fileNum);

			//Build Batch
			var Batch = {};
			Batch.files = files;
			Batch.parentNode = parentNode;
			Batch.parentPath = parentPath;
			Batch.parentId = parentId;
			Batch.level = level;
			Batch.commitMsg = commitMsg;
			Batch.vid = vid;
			Batch.num = fileNum;
			Batch.index = 0;
			Batch.state = 0;
			
			//Append to Content.BatchList
			Content.BatchList.push(Batch);
			Content.batchNum++;
			Content.totalFileNum += fileNum;
			totalNum = Content.totalFileNum;
			
			showUploadingInfo();
			
			console.log("DocUploadAppend Content:", Content);
			
			if(Content.state == 2)	//Batch already initiated, need to restart it
			{
				Content.batchIndex++;
				Content.state = 1;
				buildSubContextList(Content,SubContextList,10);
				totalSize = Content.totalFileSize;
			}
			
			console.log("文件总的个数为："+Content.totalFileNum + " 文件总的大小为："+totalSize);
			checkAndDrawUploadItems(SubContextList);
      	}
      	
      	//这是一个递归调用函数，递归遍历所有目录，并将文件加入到SubContextList中
		function buildSubContextList(Content,SubContextList,maxInitNum)
		{
			if(Content.state == 2)
			{
				return;
			}
			
      		console.log("buildSubContextList() maxInitNum:" + maxInitNum);
			
      		var curBatchIndex = Content.batchIndex;
      		var Batch = Content.BatchList[curBatchIndex];
      		console.log("buildSubContextList() Content curBatchIndex:" + curBatchIndex + " num:" + Content.batchNum );
    		
      		var files = Batch.files;
      		var parentPath = Batch.parentPath;
      		var level = Batch.level;
      		var parentId = Batch.parentId;
      		var vid = Batch.vid;
      		var index = Batch.index;
      		var fileNum =  Batch.num;
			var commitMsg=Batch.commitMsg;
      		console.log("buildSubContextList() Batch index:" + index + " fileNum:" + fileNum + "commitMsg:"+commitMsg);
      		
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
 				
    			var file = files[i];
    	   		if(typeof file == 'object')
    	   		{
    	   		   	var SubContext ={};
    	   		   	//Basic Info
    	   		   	SubContext.file = file;
    	   		   	SubContext.parentPath = parentPath;
    	   		   	SubContext.parentId = parentId;
    	   		   	SubContext.level = level;
        			SubContext.vid = vid;
					SubContext.commitMsg = commitMsg;
    	   		   	
		    		SubContext.docId = -1; //-1: 新增  
		    		
    	   		   	//advanced Info
    	   		   	SubContext.type = 1;	
		    	   	SubContext.size = file.size;
    	   		   	SubContext.name = file.name;
			    	
    	   		   	//get the realParentPath
    	   		   	getRealParentInfo(SubContext);
			    	
			    	//Status Info
		    	   	SubContext.state = 0;	//未开始上传
		    	   	SubContext.status = "待上传";	//未开始上传
		    	   	
		    	   	//上传速度信息
					SubContext.speed = "";
					SubContext.preUploadTime = new Date().getTime();
					SubContext.preUploadSize = 0;
		    	   	
		    	   	//checkSum Init
		    	   	SubContext.checkSumState = 0;
		    	   	SubContext.checkSum = "";
		    	   	
		    	   	//分片上传状态 
		    	   	SubContext.cutFileState = 0;
		    	   	SubContext.chunked = false;
					SubContext.resumeCutFile = false; //文件切片需要重新开发
		    	   	
		    	   	SubContext.fileCoverConfirmSet = 0;	//默认碰到已存在文件需要用户确认是否覆盖
		    		SubContext.uploadErrorConfirmSet = 0;	//默认碰到错误需要用户确认
			    	SubContext.uploadWarningConfirmSet = 0; //默认碰到警告需要用户确认
		    		SubContext.stopFlag = false; //停止上传标记未false
		      								 
		    	   	//threadState
		    	   	SubContext.threadState = 0; //0:上传线程未启动, 1:上传线程已启动, 2:上传线程已终止
		    	   	//startTime
		    	   	SubContext.startTime = Date.now();
		    	   	
		    	   	SubContext.chunkThreadCount = 0;
		    	   	
		    	   	//Push the SubContext
		    		SubContext.index = SubContextList.length;
		    		SubContextList.push(SubContext);
		    	   	SubContextHashMap[SubContext.index + "-" + SubContext.startTime] = SubContext.index;
		    		
		    		//Update global infos
		    	   	Content.totalFileSize += file.size;
    	   		}
	    	}
    		
    		//console.log(SubContextList);
	    	console.log("buildSubContextList() totSize:" + Content.totalFileSize);

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

      	//getRealParentPath
 		function getRealParentInfo(SubContext)
 		{
      		var file = SubContext.file;
      		
 			var relativePath = file.webkitRelativePath;
		 	if(file.fullPath)
    		{
    			relativePath = file.fullPath;
    		}
    		//console.log("getRealParentInfo() relativePath:" + relativePath);
      		
    		SubContext.relativePath = relativePath;
    		if(!relativePath || relativePath == "")
    		{
 				SubContext.realParentPath = SubContext.parentPath;
 				SubContext.realParentId = SubContext.parentId;
 	 			SubContext.realLevel = SubContext.level;
 				return true;
    		}
			
    		//get the realParentPath
    		var realParentPath = SubContext.parentPath;
    		var realLevel = SubContext.level;
    		var pathArray = new Array(); //定义一数组 
			pathArray = relativePath.split("/"); //字符分割 
			for(var i=0; i<pathArray.length-1; i++)	//最后一个是文件本身因此不需要检查
			{
				var nodeName = pathArray[i];
				if(!nodeName || nodeName == "")
				{
					continue;
				}
	 			realLevel++;				
				realParentPath = realParentPath + nodeName +"/";
			}
    		//console.log("getRealParentInfo() realParentPath:" + realParentPath);

			SubContext.realParentPath = realParentPath;
			SubContext.realLevel = realLevel;
			SubContext.realParentId = -1;
			return true;
 		}
      	
      	function getFileShowSize(fileSize)
      	{
			var showSize = fileSize;
			var units = "B";	//速度单位
			if((showSize/1024)>1)
			{
				showSize = showSize/1024;
				units = "K";
				if((showSize/1024)>1)
				{
					showSize = showSize/1024;
					units = "M";
					if((showSize/1024)>1)
					{
						showSize = showSize/1024;
						units = "G";						
					}
				}
			}
			result =  "" + showSize + units;
			//console.log("getFileShowSize() showSize:" + result);
			return result;
      	}
      	
      	//初始化上传文件的SubContext,并绘制对应的进度条
      	function checkAndDrawUploadItems(SubContextList)
      	{
      			var totalNum = Content.initedFileNum;
      			//Check if all items drawed
      			if(drawedNum >= totalNum)
      			{
      				//console.log("druawUploadItems() all items drawed");
      				return;
      			}
      			
      			//the drawedNum ahead of index less than 100, do draw the doc progress
      			if((drawedNum - index) > 100)
      			{
      			    console.log("druawUploadItems() drawedNum:" + drawedNum + " index:" + index);
      				return;
      			}
      			
      			//Delete the uploadItems which in displayDeleteList
      			deleteItemsInDisplayDeleteList();
      			
      			//Prepare to drawed
      			var startIndex = drawedNum;
      			var endIndex = totalNum;
      			if((totalNum -drawedNum) > 200)	//每次最多绘制200个
      			{
      				endIndex = drawedNum + 200;
      			}
      		    console.log("druawUploadItems() startIndex:" + startIndex + " endIndex:" + endIndex);
      			
      			var str = "";
      			for( var i = startIndex ; i < endIndex ; i++ )
		    	{	
		    		//console.log("index:" + i);
		    		var SubContext = SubContextList[i];
		    		SubContext.showSize = getFileShowSize(SubContext.size);
		    		//console.log(SubContext);
					str+="<li class='el-upload-list__item file"+i+" is-uploading' value="+i+">"+
		    				"<a class='el-upload-list__item-name uploadFileName'><i class='el-icon-document'></i><span class='uploadFileName' >"+SubContext.name+"</span></a>"+
		    				"<a class='reuploadBtn reupload"+i+"' onclick='reuploadFailDocs("+i+")'  style='display:none'>重传</a>"+
		    				"<label class='el-upload-list__item-status-label'><i class='el-icon-upload-success el-icon-circle-check'></i></label>"+
		    				"<i class='el-icon-close stopUpload'  value="+i+" onclick='DocUpload.stopUpload("+i+")'></i>"+
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
				$('#uploadedFileList').append(str);		
      	}
      	
      	function deleteItemsInDisplayDeleteList()
      	{
      		for(var i = 0; i < displayDeleteList.length; i++)
      		{
      			deleteDisplayItem(displayDeleteList[i]);
      		}
      		displayDeleteList = [];
      	}
      	
      	function deleteDisplayItem(index)
      	{
      		$('.file' + index).remove();      		
      	}
 		
		//文件覆盖确认不能像文件错误确认一样封装成函数的原因在于，文件复制会存在两种种情况：继续、异步等待用户确认，文件错误确认只有一种情况：异步等待用户确认
      	//获取当上传的文件覆盖设置
      	function getFileCoverConfirmSetting(SubContext)
      	{
	 		if(fileCoverConfirmSet == 0) //全局设置为直接覆盖
  	 		{
  	 			if(SubContext.fileCoverConfirmSet == 0)
  	 			{
  	 				return 0;
  	 			}
  	 		
  	 			return SubContext.fileCoverConfirmSet;	 			
  	 		}
  	 		
	 		return fileCoverConfirmSet;
      	}
      	
      	
      	var confirmDialogState = 0;
      	var penddingListForUploadCoverConfirm = [];
      	var penddingListForUploadErrorConfirm = [];
      	function clearPenddingConfirm()
      	{
      		console.log("clearPenddingConfirm()");
          	confirmDialogState = 0;
          	penddingListForUploadCoverConfirm = [];
          	penddingListForUploadErrorConfirm = [];
      	}
    	
    	function resumePenddingConfirm()
    	{
    		console.log("resumePenddingConfirm()");
    		confirmDialogState = 0;
    		resumePenddingUploadCoverConfirm();    	
    		resumePenddingUploadErrorConfirm();
    	}

      	
    	function resumePenddingUploadCoverConfirm()
    	{
    		console.log("resumePenddingUploadCoverConfirm()");
    		if(confirmDialogState == 1)
    		{
    			return;
    		}
    		
    		if(penddingListForUploadCoverConfirm.length > 0)
    		{
    			var SubContext = penddingListForUploadCoverConfirm.pop();
        		console.log("resumePenddingUploadCoverConfirm() index:" + SubContext.index + " name:" + SubContext.name);
        		fileCoverConfirm(SubContext);
    		}
    	}  
    	
    	function resumePenddingUploadErrorConfirm()
    	{
    		console.log("resumePenddingUploadErrorConfirm()");
    		if(confirmDialogState == 1)
    		{
    			return;
    		}

    		if(penddingListForUploadErrorConfirm.length > 0)
    		{
    			var SubContext = penddingListForUploadErrorConfirm.pop();
        		console.log("resumePenddingUploadErrorConfirm() index:" + SubContext.index + " name:" + SubContext.name);
        		uploadErrorConfirmHandler(SubContext, SubContext.msgInfo);    			
    		}
    	}
      	
      	//文件覆盖处理接口
      	function fileCoverConfirm(SubContext)
      	{
      		var msgInfo = "文件 " + SubContext.name + "已存在";
      		if(confirmDialogState == 1)
      		{
				console.log("[" + SubContext.index + "] fileCoverConfirm() add to penndingList");
				penddingListForUploadCoverConfirm.push(SubContext);
				return;
      		}
      		confirmDialogState = 1;
      			
			var docName = SubContext.name;
      		console.log("[" + SubContext.index + "] fileCoverConfirm()");
      		
  	 		var confirm = getFileCoverConfirmSetting(SubContext);
	  	 	if(confirm == 1)
	  	 	{
	  	 		//用户已确认直接覆盖
	  	 		SubContext.state = 3; //开始上传
	  	 		uploadDoc(SubContext);
	  	 		resumePenddingConfirm();
	  	 		return;
	  	 	}
	  	 	
	  	 	if(confirm == 2)
	  	 	{
	  	 		uploadErrorHandler(SubContext, "文件" + docName + " 已存在，自动跳过");
	  	 		resumePenddingConfirm();
	  	 		uploadNextDoc();
	  	 		return;
	  	 	}

	  	 	var fileCoverTimer = setTimeout(function () {	//超时用户没有动作，则直接覆盖
	  	 			console.log("fileCoverConfirm() 是否覆盖 " + docName + ",用户确认超时,采用覆盖且后续自动覆盖");
	            	SubContext.fileCoverConfirmSet = 1; //覆盖
	            	fileCoverConfirmSet = 1;
	            	closeBootstrapDialog("fileCoverConfirm");
	            	SubContext.state = 3; //开始上传	            	
	            	uploadDoc(SubContext); //reEnter uploadDoc
		  	 		resumePenddingConfirm();
	            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
		        
    	    qiao.bs.confirm({
    	    	id: 'fileCoverConfirm',
    	        msg: docName + "已存在,是否覆盖?",
    	        close: false,		
    	        okbtn: "替换",
    	        qubtn: "跳过",
    	    },function () {
               	console.log("fileCoverConfirm() 用户选择覆盖 " + docName);
       		 	clearTimeout(fileCoverTimer);
 	 			SubContext.fileCoverConfirmSet = 1; //覆盖
 	 			closeBootstrapDialog("fileCoverConfirm");
  	 			if(index < (totalNum-1)) //后续还有才提示
  	 			{
	  	 			var fileCoverTimer1 = setTimeout(function () {	//超时用户没有动作，则直接覆盖
	 	            	console.log("fileCoverConfirm() 后续已存在文件是否自动覆盖，用户确认超时,后续自动覆盖");
	 	            	fileCoverConfirmSet = 1;
	 	            	closeBootstrapDialog("takeSameActionConfirm1");
	 	            	SubContext.state = 3; //开始上传
	 	            	uploadDoc(SubContext); //reEnter uploadDoc
	 		  	 		resumePenddingConfirm();
	 	            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
	 	            
  	 	    	    qiao.bs.confirm({
  	 	    	    	id: 'takeSameActionConfirm1',
  	 	    	        msg: "后续已存在文件是否自动覆盖？",
  	 	    	        close: false,		
  	 	    	        okbtn: "是",
  	 	    	        qubtn: "否",
  	 	    	    },function () {
  	 	           		console.log("fileCoverConfirm() 后续已存在文件将自动覆盖");
  			 	    	clearTimeout(fileCoverTimer1);
  	 	    	    	fileCoverConfirmSet = 1;	//全局覆盖  	 	    	    	
  	 		  	 		SubContext.state = 3; //开始上传
  	  	 				uploadDoc(SubContext); //reEnter uploadDoc
  	  	 				closeBootstrapDialog("takeSameActionConfirm1");
  	  	 				resumePenddingConfirm();
  	  	 				return true;
  	 				},function(){
  	 		       		console.log("fileCoverConfirm() 后续已存在文件不自动覆盖");
  	 					clearTimeout(fileCoverTimer1);  	 					
  	 					SubContext.state = 3; //开始上传
  	 					uploadDoc(SubContext); //reEnter uploadDoc
  	 					closeBootstrapDialog("takeSameActionConfirm1");
  	 					resumePenddingConfirm();
  	  	 				return true;
  	 				});
  	 			}
  	 			else
  	 			{
  		  	 		SubContext.state = 3; //开始上传
  	 				uploadDoc(SubContext); //reEnter uploadDoc
  		  	 		resumePenddingConfirm();
  	 			}
    	    	return true;   
    	    },function(){
    	    	console.log("fileCoverConfirm() 用户选择跳过上传 " + docName);
    	    	clearTimeout(fileCoverTimer);
  	 			SubContext.fileCoverConfirmSet = 2; //不覆盖
  	 			closeBootstrapDialog("fileCoverConfirm");
  	 			
  	 			if(index < (totalNum-1)) //后续还有才提示 
  	 			{
	  	 			var fileCoverTimer2 = setTimeout(function () {	//超时用户没有动作，则直接覆盖
	 	            	console.log("fileCoverConfirm() 后续已存在文件是否自动跳过，用户确认超时，后续自动跳过！");
	 	            	fileCoverConfirmSet = 2;
	 	            	closeBootstrapDialog("takeSameActionConfirm2");	 	            	
	 	            	uploadErrorHandler(SubContext, "后续已存在文件是否自动跳过，用户确认超时，跳过且后续自动跳过！");
	 		  	 		resumePenddingConfirm();
	 	            	uploadNextDoc();
	 	            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
  	 				
  	 	    	    qiao.bs.confirm({
  	 	    	    	id: 'takeSameActionConfirm2',
  	 	    	        msg: "后续已存在文件是否自动跳过？",
  	 	    	        close: false,		
  	 	    	        okbtn: "是",
  	 	    	        qubtn: "否",
  	 	    	    },function () {
  	 	    	    	console.log("fileCoverConfirm() 后续已存在文件自动跳过！");
  	 	    	    	clearTimeout(fileCoverTimer2);
  	 					fileCoverConfirmSet = 2;	//全局覆盖
  	 					uploadErrorHandler(SubContext, "文件已存在，跳过且后续自动跳过");
  	 					closeBootstrapDialog("takeSameActionConfirm2");	
  	 					resumePenddingConfirm();
  	 					uploadNextDoc();
  	  	 				return true;
  	 				},function(){
  	 					console.log("fileCoverConfirm() 后续已存在文件不自动跳过！");
  	 	    	    	clearTimeout(fileCoverTimer2);
  						uploadErrorHandler(SubContext, "文件已存在，跳过但后续不自动跳过");
  						closeBootstrapDialog("takeSameActionConfirm2");	
  						resumePenddingConfirm();
  						uploadNextDoc();
  	  	 				return true;
  	 				});			
  	 			}
  	 			else
  	 			{
  	 				uploadErrorHandler(SubContext, "文件已存在，跳过");
  		  	 		resumePenddingConfirm();
  	 				uploadNextDoc();
  	 			}
    	    	return true;
    	    });      		
      	}
      	
      	//获取当上传的文件覆盖设置
      	function getUploadErrorConfirmSetting(SubContext)
      	{
	 		if(uploadErrorConfirmSet == 0) //全局设置为直接覆盖
  	 		{
  	 			if(SubContext.uploadErrorConfirmSet == 0)
  	 			{
  	 				return 0;
  	 			}
  	 		
  	 			return SubContext.uploadErrorConfirmSet;	 			
  	 		}
  	 		
	 		return uploadErrorConfirmSet;
      	}
      	
      	//upload Error Confirm
      	function uploadErrorConfirm(SubContext,errMsg)
      	{
      		if(confirmDialogState == 1)
      		{
				console.log("[" + SubContext.index + "] uploadErrorConfirm() add to penndingList");
				penddingListForUploadErrorConfirm.push(SubContext);
      			return;
      		}
      		confirmDialogState = 1;
      		
      		var uploadErrorTimer = setTimeout(function () {	//超时用户没有动作，则直接覆盖
            	console.log("用户确认超时,继续上传后续文件");
            	SubContext.uploadErrorConfirmSet = 1; //继续上传
            	uploadErrorConfirmSet = 1; //全局继续上传
            	closeBootstrapDialog("uploadErrorConfirm");
            	resumePenddingConfirm();
            	uploadNextDoc();
            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
      		
      		var FileName = SubContext.name;
      		
			//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: 'uploadErrorConfirm',
    	        msg: FileName + "上传失败（"+errMsg+"）,是否继续上传其他文件？",
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束上传",
    	    },function () {
    	    	//继续后续的上传
				clearTimeout(uploadErrorTimer);			
      			SubContext.uploadErrorConfirmSet = 1; //继续上传
      			closeBootstrapDialog("uploadErrorConfirm");
      			
    	 		if(index < (totalNum-1))	//后续还有文件
                {
    	      		var uploadErrorTimer1 = setTimeout(function () {	//超时用户没有动作，则直接覆盖
  	 	    	    	console.log("用户确认超时,后续错误都继续上传");
    	            	uploadErrorConfirmSet = 1; //全局不再进行错误确认
    	            	closeBootstrapDialog("takeSameActionConfirm3");
    	            	resumePenddingConfirm();
    	            	uploadNextDoc();
    	            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
    	 			
  	 	    	    qiao.bs.confirm({
  	 	    	    	id: 'takeSameActionConfirm3',
  	 	    	        msg: "后续错误是否执行此操作？",
  	 	    	        close: false,		
  	 	    	        okbtn: "是",
  	 	    	        qubtn: "否",
  	 	    	    },function () {
  	 	    	    	//后续错误将不再弹出窗口
  	 	    	    	clearTimeout(uploadErrorTimer1);
  	 	    	    	uploadErrorConfirmSet = 1;	//全局不再进行错误确认
  	 	    	    	closeBootstrapDialog("takeSameActionConfirm3");
  	 	    	    	resumePenddingConfirm();
  	 	    	    	uploadNextDoc();
  	  	 				return true;
  	 				},function(){
  	 					//后续错误将继续弹出错误确认窗口
  	 					clearTimeout(uploadErrorTimer1);
  	 					closeBootstrapDialog("takeSameActionConfirm3");
    	            	resumePenddingConfirm();
  	 					uploadNextDoc();
  	  	 				return true;
  	 				});	
                }
    	 		else
    	 		{
    	 			resumePenddingConfirm();
    	 			uploadNextDoc();
             		return;
    	 		}
    		},function(){
    			//结束后续的上传
    	    	stopFlag = true; //停止所有上传
    			clearPenddingConfirm();
    			clearTimeout(uploadErrorTimer);
      			SubContext.uploadErrorConfirmSet = 2; //结束所有上传
          		uploadErrorConfirmSet = 2; //全局取消上传
          		closeBootstrapDialog("uploadErrorConfirm");
          		uploadEndHandler(SubContext,errMsg);
      		});
      	}
      	
      	//获取当上传的文件警告确认设置
      	function getUploadWarningConfirmSetting()
      	{
	 		if(uploadWarningConfirmSet == 0) //全局设置为继续
  	 		{
  	 			if(SubContext.uploadWarningConfirmSet == 0)
  	 			{
  	 				return 0;
  	 			}
  	 		
  	 			return SubContext.uploadWarningConfirmSet;	 			
  	 		}
  	 		
	 		return uploadWarningConfirmSet;
      	}
      	
      	//upload Warning Confirm
      	function uploadWarningConfirm(SubContext,msgInfo)
      	{
      		var uploadWarningTimer = setTimeout(function () {	//超时用户没有动作，则直接继续
            	console.log("用户确认超时,继续上传后续文件");
            	SubContext.uploadWarningConfirmSet = 1; //继续上传
            	uploadWarningConfirmSet = 1; //全局继续上传
            	closeBootstrapDialog("uploadWarningConfirm");
            	uploadErrorHandler(SubContext,msgInfo);
            	uploadNextDoc();
            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
      		
			//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: 'uploadWarningConfirm',
    	        msg: FileName + "警告（"+msgInfo+"）,是否继续上传其他文件？",
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束上传",
    	    },function () {
    	    	//alert("点击了确定");
				clearTimeout(uploadWarningTimer);			
      			SubContext.uploadWarningConfirmSet = 1; //继续上传
    	 		if(index < (totalNum-1))	//后续还有文件
                {
    	      		var uploadWarningTimer1 = setTimeout(function () {	//超时用户没有动作，则直接继续
    	            	console.log("用户确认超时,后续错误都继续上传");
    	            	uploadWarningConfirmSet = 1; //全局继续上传
    	            	closeBootstrapDialog("takeSameActionConfirm4");
    	            	uploadSuccessHandler(SubContext,msgInfo);
    	            	uploadNextDoc();
    	            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
    	 			
  	 	    	    qiao.bs.confirm({
  	 	    	    	id: 'takeSameActionConfirm4',
  	 	    	        msg: "后续错误是否执行此操作？",
  	 	    	        close: false,		
  	 	    	        okbtn: "是",
  	 	    	        qubtn: "否",
  	 	    	    },function () {
  	 	    	    	//后续错误将不再弹出窗口
  	 	    	    	clearTimeout(uploadWarningTimer1);
  	 	    	    	uploadWarningConfirmSet = 1;	//全局覆盖
  	 	    	    	uploadSuccessHandler(SubContext,msgInfo); //reEnter uploadDoc
    	            	uploadNextDoc();
  	  	 				return true;
  	 				},function(){
  	 					//后续错误将继续弹出错误确认窗口
  	 					clearTimeout(uploadWarningTimer1);
  	 	    	    	uploadSuccessHandler(SubContext,msgInfo);
    	            	uploadNextDoc();
  	  	 				return true;
  	 				});	
                }
    	 		else
    	 		{
    	 			uploadSuccessHandler(SubContext,msgInfo);
             		uploadWarningConfirmHandler(SubContext,msgInfo);
             		return;
    	 		}
    		},function(){
    	    	//alert("点击了取消");
    	    	clearTimeout(uploadWarningTimer);
      			SubContext.uploadWarningConfirmSet = 2; //结束所有上传
          		uploadWarningConfirmSet = 2; //全局取消上传    	 		
          		uploadSuccessHandler(SubContext,msgInfo);
      		});
      	}
      	
      	//uploadWarnignConfirmHandler
      	function uploadWarningConfirmHandler(SubContext,msgInfo)
      	{
			console.log("[" + SubContext.index + "] uploadWarningConfirmHandler() 警告：" + msgInfo);
			var confirm = getUploadWarningConfirmSetting();
			if(confirm == 1)
			{
				uploadNextDoc();
			}
			else if(confirm == 2)	//结束上传
			{
				uploadEndHandler();
			}
			else
			{
				uploadWarningConfirm(SubContext, msgInfo);
			}
      	}
      	
      	//uploadErrorConfirmHandler
      	function uploadErrorConfirmHandler(SubContext,errMsg)
      	{
      		var FileName = SubContext.name;
			console.log("[" + SubContext.index + "] 上传失败：" + errMsg);
			var confirm = getUploadErrorConfirmSetting(SubContext);
			if(confirm == 1)
			{
				uploadNextDoc();
			}
			else if(confirm == 2)	//结束上传
			{
				uploadEndHandler(SubContext, errMsg);
			}
			else
			{
				uploadErrorConfirm(SubContext, errMsg);
			}
      	}
      	
      	function clearTimerForUpload(SubContext)
      	{
      		if(SubContext.timerForUpload)
      		{
      			console.log("[" + SubContext.index + "] clearTimerForUpload() clear timerForUpload");
      			clearTimeout(SubContext.timerForUpload);
      			SubContext.timerForUpload = undefined;
      		}
      	}
      	
      	//uploadErrorHandler
      	function uploadErrorHandler(SubContext,errMsg)
      	{
      		//Whatever do stop first
      		SubContext.stopFlag = true;
      		
      		console.log("[" + SubContext.index + "] uploadErrorHandler() clear timerForUpload");
      		clearTimerForUpload(SubContext);
      		
      		console.log("[" + SubContext.index + "] uploadErrorHandler() "+ SubContext.name + " " + errMsg);
      		
      		if(false == reuploadFlag)
      		{
      			failNum++;
      		}
      		else
      		{
          		console.log("[" + SubContext.index + "] uploadErrorHandler() 重传出错");
          		failNum++;
      			reuploadFailNum++;
      		}      		
			DecreaseThreadCount(SubContext);

      		//设置上传状态
			SubContext.state = 5;	//上传失败
      		SubContext.status = "fail";
			SubContext.msgInfo = errMsg;
    		
    		//update the uploadStatus
			$('.file' + SubContext.index).removeClass('is-uploading');
			$('.file' + SubContext.index).addClass('is-fail');
      	
      		//show the reupload btn
    		$(".reupload" + SubContext.index).show();
      	}
      	
      	//uploadSuccessHandler
      	function uploadSuccessHandler(SubContext,msgInfo)
      	{	
      		//Whatever do stop it first
      		SubContext.stopFlag = true;
      		
      		console.log("[" + SubContext.index + "] uploadSuccessHandler() clear timerForUpload");
      		clearTimerForUpload(SubContext);
      		
      		console.log("[" + SubContext.index + "] uploadSuccessHandler() "+ SubContext.name + " " + msgInfo);
      		      		
      		if(false == reuploadFlag)
      		{
      			successNum++;
      		}
      		else
      		{	
	      		console.log("[" + SubContext.index + "] uploadSuccessHandler() 重传成功");
	      		successNum++;
	      		reuploadSuccessNum++;
	      	}
      		DecreaseThreadCount(SubContext);      		
      		
	      	SubContext.state = 4;	//上传成功
      		SubContext.status = "success";
      		SubContext.msgInfo = msgInfo;

      		//update the uploadStatus
			$('.file'+SubContext.index).removeClass('is-uploading');
			$('.file'+SubContext.index).addClass('is-success');
			
			//hide the reupload btn
			$(".reupload"+SubContext.index).hide();
			
			//add index to displayDeleteList
			displayDeleteList.push(SubContext.index);
      	}

  		function showUploadEndInfo()
  		{
  			var uploadEndInfo = "上传完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			uploadEndInfo = "上传完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";

      			$(".reuploadAllBtn").show();

      			// 普通消息提示条
    			bootstrapQ.msg({
    					msg : uploadEndInfo,
    					type : 'warning',
    					time : 2000,
    				    }); 
      		}
      		else
      		{
      			$(".reuploadAllBtn").hide();
                // 普通消息提示条
    			bootstrapQ.msg({
    					msg : uploadEndInfo,
    					type : 'success',
    					time : 2000,
    				    }); 
      		}
      		$(".upload-list-title").text(uploadEndInfo);
  		}
  		
		function printUploadedTime()
		{
			var currentTime = new Date().getTime();
			var usedTime = (currentTime - uploadStartTime)/1000; //转换成秒
			console.log("printUploadedTime() usedTime:" + usedTime + "秒");   		

			//计算显示用speed和时间
    		//var speed = uploadSpeed;
			//var units = "b/s";	//速度单位
			//if((speed/1024)>1)
			//{
			//	speed = speed/1024;
			//	units = "k/s";
			//	if((speed/1024)>1)
			//	{
			//		speed = speed/1024;
			//		units = "M/s";
			//	}
			//}
       		//console.log("上传速度："+ speed + units);
			//console.log("总进度：" + totPer + "% 已用时间：" + usedTime + " 剩余时间：" + remainTime);
		}

      	//uploadEndHandler
      	function uploadEndHandler()
      	{
      		//console.log("uploadEndHandler() totalNum:" + totalNum +" successNum:"+successNum+" failNum:"+failNum);
      		if(stopFlag == false)
      		{
	      		if(totalNum > (successNum + failNum))
	      		{
	      			//console.log("uploadEndHandler() 上传未结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
	      			return;
	      		}
      		}
	      	
      		console.log("uploadEndHandler() 上传结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			printUploadedTime();
			
      		//显示上传完成 
      		showUploadEndInfo();      		
      		
      		//清除文件控件
			$("#uploadFiles").val("");
  			$("#uploadDir").val("");
      		$("#checkInFile").val("");
            
  			//清除标记
  			isUploading = false;
  			reuploadFlag = false;
      	}
      	
      	
    	function IncreaseThreadCount(SubContext)
        {    		
      		if(false == reuploadFlag)	//新传状态
      		{
        		if(SubContext.threadState == 0)
        		{
        			SubContext.threadState = 1;
        			threadCount++;
        		}
      		}
      		else	//重传
      		{	
        		if(SubContext.threadState == 2)
        		{
        			SubContext.threadState = 1;
            		threadCount++;    			
        		}
      		}	
        }
    	
    	function DecreaseThreadCount(SubContext)
        {
    		if(SubContext.threadState == 1)
    		{
    			SubContext.threadState = 2;
        		threadCount--;    			
    		}
        }
    	
    	function getMaxThreadCount()
    	{
    		if(maxThreadCount != null)
    		{
    			return maxThreadCount;
    		}
    		
			$.ajax({
	             url : "/DocSystem/Doc/getMaxThreadCount.do",
	             type : "post",
	             dataType : "json",
	             data : {},
	             success : function (ret) {
          			 maxThreadCount = 1; //只获取一次，无论成功失败
	            	 if( "ok" == ret.status){
	             		console.log("getMaxThreadCount() ret:", ret);
             			if(ret.data)
	             		{
	             			maxThreadCount = ret.data;
	             			if(maxThreadCount > 100)
	             			{
	             				maxThreadCount = 100;
	             			}
	             			else if(maxThreadCount < 1)
	             			{
	                 			maxThreadCount = 1;	             				
	             			}
	             		}
	            		return;
		            }
	                else
	                {
	          			maxThreadCount = 1; //只获取一次，无论成功失败
	                	console.log("获取maxThreadCount失败:" + ret.msgInfo);
	            		return false;
	                }
	            },
	            error : function () {
         			maxThreadCount = 1; //只获取一次，无论成功失败
	            	console.log("获取maxThreadCount失败：服务器异常");
		            return false;
	            }
	        });

	        return 1;
    	}
    	
      	//uploadNextDoc，如果后续有未上传文件则上传下一个文件 
		function uploadNextDoc()
		{
			var tmpMaxThreadCount = getMaxThreadCount();
			//检测当前运行中的上传线程
        	console.log("uploadNextDoc threadCount:" + threadCount + " tmpMaxThreadCount:" + tmpMaxThreadCount);				
			if(threadCount >= tmpMaxThreadCount)
			{
	        	console.log("uploadNextDoc 上传线程池已满，等待上传线程结束");				
				return;
			}
			
      		if(false == reuploadFlag)	//新传状态
      		{
    	        //console.log("uploadNextDoc index:" + index + " totalNum:" + totalNum);
    	        if(index < (totalNum-1)) //还有文件上传线程未启动
    	        {
    		        index++;
    	        	console.log("uploadNextDoc start upload");
    	        	uploadDocById(index);
    	        }
    	        else	//上传线程已全部启动，检测是否全部下载都已结束
    	        {
    	        	//console.log("uploadNextDoc all download started");
    	        	uploadEndHandler();
    	        }      			
      		}
      		else //重传状态
      		{  	
      			//console.log("uploadNextDoc reuploadIndex:" + reuploadIndex + " reuploadTotalNum:" + reuploadTotalNum);
      			if(reuploadIndex < (reuploadTotalNum-1))
      			{
      				reuploadIndex++;
      				var id = reuploadList[reuploadIndex];
      				uploadDocById(id);
      			}
      			else
      			{
      				uploadEndHandler();
      			}      				
      		}
		}
		
 		function getFileCheckSum(SubContext){
 			var chunkList = [];
 			var chunkIndex = 0;
 			var chunkNum = 0;
 			var successNum = 0;
 			var threadCount = 0;
 			var maxThreadCount = 10;
 			
 			function buildChunkList()
 			{
 	 			var chunkSize = 2097152;
 	 			var chunks = Math.ceil(SubContext.size / chunkSize); 	 			
 				var chunkStep = 1;
 	 			if(chunks > 10)
 	            {
 	 				chunkStep = chunks / 10;
 	            }
 	 			console.log("[" + SubContext.index + "] getFileCheckSum() buildChunkList() chunkSize:" + chunkSize + " chunks:" + chunks + " chunkStep:" + chunkStep);
 				
 				var index = 0;
				for(i = 0; i < chunks;)
				{
					var start = i * chunkSize;
 		            var end = start + chunkSize >= SubContext.size ? SubContext.size : start + chunkSize;
					
					var chunk = {};
					chunk.index = chunkList.length;
					chunk.start= start;
					chunk.end = end;
					chunk.chunkSize = end - start;
					chunk.checkSum = "";
					chunk.checkSumState = 0;
					chunk.threadState = 0;
					chunk.state = 0;
					
					chunkList.push(chunk);		
					
					i+=chunkStep;
				}
				chunkNum = chunkList.length;
				console.log("[" + SubContext.index + "] getFileCheckSum() buildChunkList() chunkNum:" + chunkNum);
 			}
 			
 	    	function IncreaseCalculateThreadCount(chunk)
 	        {    
 	    		if(chunk.threadState == 0)
 	    		{
 	    			chunk.threadState = 1;
 	    			threadCount++;
 	    		}
 	        }
 	    	
 	    	function DecreaseCalculateThreadCount(chunk)
 	        {
 	    		if(chunk.threadState == 1)
 	    		{
 	    			chunk.threadState = 0;
 	    			threadCount--;    			
 	    		}
 	        }
 	    	
 			function caculateNextChunk()
 			{
 	        	//console.log("[" + SubContext.index + "] getFileCheckSum() caculateNextChunk() threadCount:" + threadCount + " maxThreadCount:" + maxThreadCount);				
 	        	if(threadCount >= maxThreadCount)
 				{
 		        	//console.log("[" + SubContext.index + "] getFileCheckSum() caculateNextChunk() Chunk计算线程池已满，等待Chunk计算线程结束");				
 					return;
 				}
 				
 	      		//console.log("[" + SubContext.index + "] getFileCheckSum() caculateNextChunk() chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum);
 	    	    if(chunkIndex < (chunkNum-1)) //还有chunk计算线程未启动
 	    	    {
 	    	    	chunkIndex++;
 	    	        //console.log("[" + SubContext.index + "] getFileCheckSum() caculateNextChunk() start caculate chunk:" + chunkIndex);
 	    	        var chunk = chunkList[chunkIndex];
 	    	        caculateChunk(chunk);
 	    	    }
 			}
 			
 			function isLastChunk()
 			{
 				console.log("[" + SubContext.index + "] getFileCheckSum() successNum:" + successNum + " chunkNum:" + chunkNum);
 	 	      	if(successNum < chunkNum)
 				{
 					return false;
 				}
 				return true;
 			}
 			
	        function buildFileCheckSum()
 	      	{
      		    var allChunkHash = "";
      		    console.log("[" + SubContext.index + "] getFileCheckSum() buildFileCheckSum() ", chunkList); // computed hash   
	            
      			for(i = 0; i < chunkNum; i++)
	            {
	               console.log("[" + SubContext.index + "] getFileCheckSum() buildFileCheckSum() chunk.checkSum:" + chunkList[i].checkSum); // computed hash   
	               allChunkHash += "_" + chunkList[i].checkSum;
	            }
      			console.log("[" + SubContext.index + "] getFileCheckSum() buildFileCheckSum() allChunkHash:" + allChunkHash); // computed hash
            	return SparkMD5.hashBinary(allChunkHash);
 	      	}

 			function caculateChunk(chunk)
 	      	{
 	      		//console.log("[" + SubContext.index + "] [" + chunk.index + "] getFileCheckSum() caculateChunk() ", chunk);
 	      		if(stopFlag == true || SubContext.stopFlag == true)
 	      		{
 	 	      		console.log("[" + SubContext.index + "] [" + chunk.index + "] getFileCheckSum() caculateChunk() upload was stoped, stop caculate");
 	 	      		return;
 	      		}
 	      		
 	      		if(chunk.state != 0)
 	      		{
 	 	      		console.log("[" + SubContext.index + "] [" + chunk.index + "] getFileCheckSum() caculateChunk() thread already be started"); 	      			
 	      			return;
 	      		}
	 	      	
 	      		chunk.state = 1;	 	      		
 	      		IncreaseCalculateThreadCount(chunk);
 
	      		console.log("[" + SubContext.index + "] [" + chunk.index + "] getFileCheckSum() caculateChunk() start caculate checkSum for:" + SubContext.name);
 	      		var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
 	            	file = SubContext.file,
 	            	fileReader = new FileReader();
 	      		
 	      		fileReader.onload = function (e) {
 		            if(stopFlag == true || SubContext.stopFlag == true)
 		            {
 		            	console.log("[" + SubContext.index + "] [" + chunk.index + "] getFileCheckSum() caculateChunk() fileReader.onload() upload was stoped, stop caculate");
 		                return;
 		            }
 		            
 		            chunk.state = 2;	
	            	chunk.checkSum = SparkMD5.hashBinary(e.target.result);
 		            console.log("[" + SubContext.index + "] [" + chunk.index + "] getFileCheckSum() caculateChunk() fileReader.onload() chunk checksum is ready, checkSum:" + chunk.checkSum); // computed hash
	            	
 		            successNum++;
 	 	      		DecreaseCalculateThreadCount(chunk);

 		            if(isLastChunk() == true) 
 		            {
 		            	SubContext.checkSum = buildFileCheckSum();	            	
 		                console.log("[" + SubContext.index + "] [" + chunk.index + "] getFileCheckSum() caculateChunk() fileReader.onload() checksum is ready, checksum:" + SubContext.checkSum); // computed hash
 		            	SubContext.checkSumState = 2; 

 		            	//Switch to CheckDocInfo
 		            	SubContext.state = 2; //开始上传
 	                	uploadDoc(SubContext);
 	                	return;
 		            } 
		            
 		            caculateNextChunk();
 		        };
 		
 		        //Fail to compute hash
 		        fileReader.onerror = function () {
		            console.log("[" + SubContext.index + "] getFileCheckSum() caculate() fileReader.onerror() checksum caculate failed"); // computed hash
 		        	SubContext.checkSumState = 3;

 		        	uploadErrorHandler(SubContext, "校验码计算失败");
 		        	uploadNextDoc();
 		        };
 		        
 		        //trigger chunk load
		        if(fileReader.readAsBinaryString)
 		        {
		        	 fileReader.readAsBinaryString(blobSlice.call(file, chunk.start, chunk.end));
					 caculateNextChunk();
 		        }
 		        else
 		        {
	            	console.log("[" + SubContext.index + "] getFileCheckSum()  caculate() loadNext() 当前浏览器不支持读取文件，无法计算CheckSum"); //fail to compute hash
	            	SubContext.checkSumState = 4;
	            	SubContext.checkSum = "";
	            	
 		        	uploadErrorHandler(SubContext, "校验码计算失败:当前浏览器不支持读取文件");
 		        	uploadNextDoc();
 		        }		        
 	      	}
 			
 			//Start 
	      	SubContext.checkSumState = 1;
 	      	SubContext.checkSum = "";
 	      	buildChunkList(SubContext);
 	      	var chunk = chunkList[chunkIndex];
 			caculateChunk(chunk);		    
 	    }
      	
      	function checkDocInfo(SubContext)
      	{   
      		console.log("[" + SubContext.index + "] checkDocInfo() for " + SubContext.name);
      		
      		//检查服务器端是否存在同名文件，并确认文件内容是否相同
   			//调用后台接口检查DocInfo，回调函数需要根据情况决定具体的操作
  			$.ajax({
	             url : "/DocSystem/Doc/checkDocInfo.do",
	             type : "post",
	             dataType : "json",
	             data : {
		            reposId : SubContext.vid,
		            //docId: SubContext.docId,	//For upload we still do not know the docId and Pid
		            //pid : SubContext.realParentId,
		            path: SubContext.realParentPath,
	             	name : SubContext.name,
	             	//level: SubContext.realLevel,
					type: SubContext.type,
					size: SubContext.size,
	             	checkSum: SubContext.checkSum,	
	             	shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status)
	             	{		
	             		console.log("[" + SubContext.index + "] checkDocInfo() ret",ret);
	             		if(ret.msgData == "0")	//文件存在但checkSum不同，等待用户确认是否覆盖
	             		{
	             			SubContext.docId = ret.data.docId;
	             			fileCoverConfirm(SubContext,"文件" + name + " 已存在");
	             			return;
	             		}
	             		else if(ret.msgData == "1")	//文件存在且checkSum相同，直接标记成功
	             		{
		                	if(SubContext.docId == -1) //文件新建成功
			                {	
		                		//set the docId so that We can open it 
		             			SubContext.docId = ret.data.docId;	            
			             		addTreeNode(ret.data);
			             		addDocListNode(ret.data);
			             		
			                }
	             			
		                    uploadSuccessHandler(SubContext, ret.msgInfo);
		        			uploadNextDoc();
							return;
	             		}
	             		else
	             		{
	             			SubContext.state = 3; //开始上传
	             			uploadDoc(SubContext);
	             			return;
	             		}
	                }
	                else
	                {
					 	uploadErrorConfirmHandler(SubContext, ret.msgInfo);
			            return;
	                }
	            },
	            error : function () {
				 	uploadErrorConfirmHandler(SubContext, "checkDocInfo "+ SubContext.name + " 异常");
		            return;
	            }
	        });
    		
   			return false;
      	}
      	
      	function showUploadingInfo()
      	{
      		if(reuploadFlag == false)
      		{
	      		$(".upload-list-title").text("正在上传   " + uploadStartedNum + " / " + totalNum);
      		}
      		else
      		{
      			$(".upload-list-title").text("正在重传   " + reuploadStartedNum + " / " + reuploadTotalNum);
      		}
      	}
      	
		//重新上传所有失败文件（包括用户自己选择取消上传的文件）
		function reuploadFailDocs(id)
		{
			//首次上传未结束
			if(false == reuploadFlag && true == isUploading)
			{
				console.log("reuploadFailDocs() 首次上传未结束,不能重传失败文件");
				return;
			}
			
			if(false == reuploadFlag && false == isUploading)
			{	
				console.log("reuploadFailDocs() 启动重传");

				//开始重传
				reuploadList = [];
				reuploadIndex = 0;
				reuploadTotalNum = 0;
		        reuploadStartedNum = 0;
		    	reuploadFailNum = 0;
		        reuploadSuccessNum = 0;
				stopFlag = false;
				fileCoverConfirmSet = 0;
				uploadErrorConfirmSet = 0;
				uploadWarningConfirmSet = 0;
			}
			else
			{
				console.log("reuploadFailDocs() 重传进行中,更新重传列表即可");
			}
	        
			//Build reupload List
			if(id == undefined)
			{
				$(".reuploadAllBtn").hide();
				
				//由于push会pop后进的id,会导致先上传还未绘制进度条的文件，因此反过来遍历
				for(i=0; i<totalNum;i++)
				{
					reuploadHandler(i);
				}
			}
			else
			{
				reuploadHandler(id);
			}
			
			console.log("reuploadFailDocs() 重传个数："+reuploadTotalNum);
			if(0 == reuploadTotalNum )
			{
				console.log("reuploadFailDocs() 没有需要重传的Doc");
				return;	
			}
			
			//更新上传进度
			showUploadingInfo();
			
			if(false == reuploadFlag && false == isUploading)
			{
				reuploadFlag = true;
				isUploading = true;
				//trigger uploadDoc
				reuploadIndex = 0;
				var SubContextId = reuploadList[reuploadIndex];
				console.log("reuploadFailDocs() 重传开始" + " reuploadIndex:" + reuploadIndex + " SubContextId:" + SubContextId);
				uploadDocById(SubContextId);
			}
		}
		
		function reuploadHandler(id)
		{
			var SubContext = SubContextList[id];
			
			//console.log("reuploadHandler()",SubContext);
			//已成功地不能重传
			if(4 == SubContext.state)
			{
				console.log("[" + SubContext.index + "] reuploadHandler() 已成功上传，无需重传");
				return;
			}
			
			//避免在上传过程中，被多次重传
			if(true == reuploadFlag)
			{
				if(true == SubContext.reuploadFlag)
				{
					console.log("[" + SubContext.index + "] reuploadHandler() 已开始重传，请勿重复操作");
					return;
				}
			}
			SubContext.reuploadFlag = true;
			
			//更新重传总数
			reuploadTotalNum++;
			
			if(5 == SubContext.state)
			{
				//更新failNum
				failNum--;
	      		//hide the reupload btn
	    		$(".reupload"+SubContext.index).hide();
	    		
	    		$('.file' + SubContext.index).addClass('is-uploading');
				$('.file' + SubContext.index).removeClass('is-fail');
			}
			
			console.log("[" + SubContext.index + "] reuploadHandler() totalNum:" + totalNum +" successNum:"+successNum+" failNum:"+failNum);
			console.log("[" + SubContext.index + "] reuploadHandler() reuploadTotalNum:" + reuploadTotalNum +" reuploadSuccessNum:"+reuploadSuccessNum+" reuploadFailNum:"+reuploadFailNum);
			
			//Reset SubContext infos
			SubContext.state = 0;
			
			SubContext.speed = "";
			SubContext.preUploadTime = new Date().getTime();
			SubContext.preUploadSize = 0;
			
			if(SubContext.checkSumState != 2) //checkSum is not ready, need to recaculate the checkSum
			{
				SubContext.checkSumState = 0; 
			}

			//stopFlag should be clean
			SubContext.stopFlag = false;
			//confirmSet should be clean
			SubContext.fileCoverConfirmSet = 0;
			SubContext.uploadErrorConfirmSet = 0;
			SubContext.uploadWarningConfirmSet = 0;
			
			//文件切片需要继续
			SubContext.resumeCutFile = true; //文件切片需要恢复
			
			//分片要重头开始
			SubContext.chunkIndex = 0;
			SubContext.chunkThreadCount = 0;
			SubContext.successChunkNum = 0;
			
			reuploadList.push(id);
		}
		
		//CutFile will cut file to dedicated size slice
		function CutFile(SubContext)
		{ 	
			//console.log("[" + SubContext.index + "] CutFile()");
			if(0 == SubContext.cutFileState)
			{
				console.log("[" + SubContext.index + "] CutFile() for " + SubContext.name);
				var cutSize = 2097152;
				var minCutSize = cutSize * 10;
				if(SubContext.size < minCutSize)	//< 20M do not cut
				{
					SubContext.cutFileState = 2;
					console.log("[" + SubContext.index + "] CutFile() file size less than minCutSize " + minCutSize);
					return true;
				}
				
				console.log("[" + SubContext.index + "] CutFile() start to cut file");
				SubContext.chunked = true;
				SubContext.cutSize = cutSize;
				SubContext.cutFileState = 1;
				SubContext.chunkIndex = 0;
				SubContext.chunkNum = Math.ceil(SubContext.size / cutSize);
				SubContext.successChunkNum = 0;
				//Build ChunkList
				var chunkList = [];
				for(i=0; i< SubContext.chunkNum; i++)
				{
					var chunk = {};
					var start = i * cutSize;
					chunk.index = i;
					chunk.start= start;
					chunk.end =  start + cutSize >= SubContext.size ? SubContext.size : start + cutSize;
					chunk.chunkSize = chunk.end - chunk.start;
					chunk.checkSum = "";
					chunk.checkSumState = 0;
					chunk.state = 0;
					chunk.threadState = 0;
					chunkList.push(chunk);
				}
				SubContext.chunkList = chunkList;
				console.log("[" + SubContext.index + "] CutFile() start for " + SubContext.name);
			}
		}
		
		
		//CutFile will cut file to dedicated size slice
		function getChunkCheckSum(SubContext, chunk)
		{ 	
			console.log("[" + SubContext.index + "] [" + chunk.index + "] getChunkCheckSum()");	
 	      	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
 	            	file = SubContext.file,
 	            	cutSize = cutSize,                           // read in chunks of 2MB
 	            	chunks = SubContext.chunkNum,
 	            	currentChunk = 0,
 	            	fileReader = new FileReader();
 	      		
        	fileReader.onload = function (e) {
            	if(stopFlag == true || SubContext.stopFlag == true)
            	{
            		console.log("[" + SubContext.index + "] [" + chunk.index + "] getChunkCheckSum() fileReader.onload() [" + chunk.index + "] upload was stoped, stop caculate chunk checkSum");
                	return;
            	}
    	      	var hash = SparkMD5.hashBinary(e.target.result);   //compute Data Hash
    	      	chunk.checkSum = hash;
    	      	chunk.checkSumState = 2;		            	
            	console.log("[" + SubContext.index + "] [" + chunk.index + "] getChunkCheckSum() fileReader.onload()  data read ok, checkSum is " + hash);
            	
                //uploadChunk
                SubContext.state = 2; //checkChunkUploaded
                uploadChunk(SubContext, chunk);               	
            };
		        
		    function loadChunk() {
            	if(stopFlag == true || SubContext.stopFlag == true)
            	{
            		console.log("[" + SubContext.index + "] [" + chunk.index + "] getChunkCheckSum() loadChunk() upload was stoped, stop caculate chunk checkSum");
                	return;
            	}
		        fileReader.readAsBinaryString(blobSlice.call(file, chunk.start, chunk.end));
		    }
		    
		    //Start Calculate ChunkCheckSum
		    loadChunk();
		    
		    return false;
		}
		
		function isLastChunk(SubContext)
		{
			if(SubContext.successChunkNum < SubContext.chunkNum)
			{
				return false;
			}
			return true;
		}
		
      	function checkChunkUploaded(SubContext, chunk)
      	{      		
	  	 	console.log("[" + SubContext.index + "] [" + chunk.index + "] checkChunkUploaded()");
   			//检查服务器端是否存在分片文件（checkHash should same）
   			//调用后台接口检查chunk，并设置chunk.state re-enter upload
  			$.ajax({
	             url : "/DocSystem/Doc/checkChunkUploaded.do",
	             type : "post",
	             dataType : "json",
	             data : {
	             	reposId : SubContext.vid, 
	             	docId: SubContext.docId,
	                pid : SubContext.realParentId,
					path: SubContext.realParentPath,
	                name : SubContext.name,
	                size: SubContext.size,
	             	checkSum: SubContext.checkSum,
	             	chunkNum: SubContext.chunkNum,
	             	cutSize: SubContext.cutSize,
	             	chunkIndex: chunk.index,
	             	chunkSize: chunk.chunkSize,
	             	chunkHash: chunk.checkSum,
	             	combineDisabled: 1, //后台不自动合并
	             	shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status)
	             	{		
	             		console.log("[" + SubContext.index + "] [" + chunk.index + "] checkChunkUploaded() ret",ret);
	             		if(ret.msgData && ret.msgData == "0")	//分片文件不存在 
	             		{
	             			chunk.state = 3; //Start to upload chunk
	             			uploadChunk(SubContext, chunk);
	             			return;
	             		}
	             		else
	             		{
	             			chunkUploadSuccessHandler(SubContext, chunk);
	             			return;
	             		}
	                }
	                else
	                {
	                	uploadErrorHandler(SubContext, ret.msgInfo);
					 	uploadErrorConfirmHandler(SubContext, ret.msgInfo);
			            return;
	                }
	            },
	            error : function () {
	            	uploadErrorHandler(SubContext, "checkChunkUploaded "+name+ " 异常");
		            uploadErrorConfirmHandler(SubContext, "checkChunkUploaded "+name+ " 异常");
		            return;
	            }
	        });
      	}
      	
      	function combineChunks(SubContext)
      	{      		
	  	 	console.log("[" + SubContext.index + "] combineChunks() for "+ SubContext.name);
  			$.ajax({
	             url : "/DocSystem/Doc/combineChunks.do",
	             type : "post",
	             dataType : "json",
	             data : {
	             	reposId : SubContext.vid, 
	             	docId: SubContext.docId,
	                pid : SubContext.realParentId,
					path: SubContext.realParentPath,
	                name : SubContext.name,
	                size: SubContext.size,
	             	checkSum: SubContext.checkSum,
	             	chunkIndex: SubContext.chunkIndex,
	             	chunkNum: SubContext.chunkNum,
	             	cutSize: SubContext.cutSize,
	             	//chunkSize: chunk.chunkSize,
	             	//chunkHash: chunk.checkSum,
	             	shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status)
	             	{		
	             		console.log("[" + SubContext.index + "] combineChunks() ret",ret);
	             		uploadSuccessHandler(SubContext);
    					
	             		if(SubContext.docId == -1) //新增文件
	    		        {	
	    		        	var addedParentDocList = ret.dataEx;
	    		         	if(addedParentDocList)
	    		         	{
	    		         		addParentNodes(addedParentDocList);
	    		         	}
	    		        		
	    		        	addTreeNode(ret.data);
			             	addDocListNode(ret.data);
	    		        		
	    		         	//set the docId so that We can open it 
	    		         	SubContext.docId = ret.data.id;
	    				}
    					
    					uploadNextDoc();
	             		return;
	                }
	                else
	                {
	                	uploadErrorHandler(SubContext, ret.msgInfo);
					 	uploadErrorConfirmHandler(SubContext, ret.msgInfo);
			            return;
	                }
	            },
	            error : function () {
	            	uploadErrorHandler(SubContext, "combineChunks for "+ SubContext.name + " 异常");
		            uploadErrorConfirmHandler(SubContext, "combineChunks for "+ SubContext.name + " 异常");
		            return;
	            }
	        });
      	}
		
      	function addParentNodes(data) {
    		console.log("addParentNodes");

    		var list = data;
    		
    		//遍历jason_arry
          	for(var i=0; i<list.length; i++)
          	{
               var jsonObj = list[i];
               jsonObj.id = jsonObj.docId;
               jsonObj.pId = jsonObj.pid != 0? jsonObj.pid : "root",
               jsonObj.isParent = jsonObj.type == 1? false: true;
           
               addTreeNode(jsonObj);
          	}          	
    	}
    	
    	function uploadDocById(index)
    	{
    		console.log("uploadDocById(" + index + ") totalNum:" + totalNum);    		
    		var SubContext = SubContextList[index];
    		uploadDoc(SubContext);
    	}
    	
    	function checkAndBuildSubContextList()
    	{
    		//upload files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
				totalSize = Content.totalFileSize;	
    		}
    		
    		//每次上传前检查是否需要绘制，小于200个上传项目时绘制
    		checkAndDrawUploadItems(SubContextList);
    	}
    	
    	function uploadDoc(SubContext)
    	{
    		checkAndBuildSubContextList();
    		
    		//判断是否取消上传
    		if(stopFlag == true || SubContext.stopFlag == true)
    		{
    			console.log("[" + SubContext.index + "] uploadDoc() upload was stoped "+ SubContext.name);
    			return;
    		}
    					
			IncreaseThreadCount(SubContext);
			
			switch(SubContext.state)
			{
			case 0: //upload init
    			console.log("[" + SubContext.index + "] uploadDoc() upload init for " + SubContext.name, SubContext);
    			SubContext.uploadedSize = 0; //Clear uploadedSize

				if(false == reuploadFlag)
    			{
    				uploadStartedNum++;
    			}
    			else
    			{
    				reuploadStartedNum++;
    			}
				
				showUploadingInfo();
				
				//get the file from the SubContextList
    			var file = SubContext.file;
				if(!file) 
				{
					uploadErrorHandler(SubContext, SubContext.name + " 不是文件");
					uploadNextDoc();
					return; 
				}
				
				if(SubContext.size == 0)
				{
					SubContext.checkSumState = 2;
					SubContext.checkSum = "";
					SubContext.state = 3; //开始上传
					uploadDoc(SubContext);		
					return;
				}
				
				//启动超时定式器
				var timeOut = SubContext.size + 300000; //基础超时时间5分钟，文件越大超时时间越长
				if(timeOut > 144000000) //40小时
				{
					timeOut = 144000000;
				}
			    console.log("[" + SubContext.index + "] uploadDoc()  start timeout monitor with " + timeOut + " ms");
			    SubContext.timerForUpload = setTimeout(function () {
					 console.log("[" + SubContext.index + "] uploadDoc() timerForUpload triggered!");
					 if(SubContext.state != 4 || SubContext.state != 5) //没有成功或失败的文件超时都当失败处理
					 {
				         uploadErrorHandler(SubContext, "文件上传超时");
				         uploadNextDoc();
					 }
			    },timeOut);	//check it 50ms later	
				
				//Switch to get FileCheckSum
				SubContext.state = 1; //getFileCheckSum
				uploadDoc(SubContext);		
				break;
			case 1:	//getFileCheckSum
    			console.log("[" + SubContext.index + "] uploadDoc() getFileCheckSum for " + SubContext.name);
				if(SubContext.checkSumState == 2) //checkSum is ready, skip this step
				{
					SubContext.state = 2;  //checkDocInfo
					uploadDoc(SubContext);	
					return;
				}
				getFileCheckSum(SubContext);
				break;
			case 2:	//checkDocInfo
				console.log("[" + SubContext.index + "] uploadDoc() checkDocInfo for " + SubContext.name);
				checkDocInfo(SubContext);
				break;
			case 3:	//startUpload
				console.log("[" + SubContext.index + "] uploadDoc() startUpload for " + SubContext.name);
				CutFile(SubContext);	//文件上传
	   			if(false == SubContext.chunked) 
	   			{
	   	   			startUpload(SubContext);
	   	   		}
	   			else
	   			{
	   				//Start to upload first chunk
	   				var chunk = SubContext.chunkList[0];
	   				uploadChunk(SubContext, chunk);   			
	   			}
	   			break;
			case 4: //文件已上传成功
				break;
			case 5:	//文件已上传失败				
				break;
    		}
			
			//Try to start next Doc upload Thread
			uploadNextDoc();
    	}
    	
		function uploadChunk(SubContext, chunk)
		{ 
			//console.log("[" + SubContext.index + "] [" + chunk.index + "] uploadChunk()");
			
    		//判断是否取消上传
    		if(stopFlag == true || SubContext.stopFlag == true)
    		{
    			console.log("[" + SubContext.index + "] [" + chunk.index + "] uploadChunk() upload was stoped, stop upload chunk!");
    			return;
    		}
    		
    		switch(chunk.state)
    		{
    		case 0:	//init
    			console.log("[" + SubContext.index + "] [" + chunk.index + "] uploadChunk() chunk upload init");
    			IncreaseChunkThreadCount(SubContext, chunk);
    			
    			//Swich to next State
    			chunk.state = 1;
    			uploadChunk(SubContext, chunk);
    			break;    			
    		case 1: //getChunkCheckSum
    			console.log("[" + SubContext.index + "] [" + chunk.index + "] uploadChunk() getChunkCheckSum");

    			if(chunk.checkSumState == 2) //chunkCheckSum is ready skip to next step
    			{
    				chunk.state = 2;
    				uploadChunk(SubContext, chunk)
    			}
    			else
    			{
    				getChunkCheckSum(SubContext, chunk);
    			}
    			break;
    		case 2:	//checkChunkUploaded
    			console.log("[" + SubContext.index + "] [" + chunk.index + "] uploadChunk() checkChunkUploaded");
    			checkChunkUploaded(SubContext, chunk);
    			break;
    		case 3: //startChunkUpload
    			console.log("[" + SubContext.index + "] [" + chunk.index + "] uploadChunk() startChunkUpload");
    			startUpload(SubContext, chunk);
    			break;
    		}

    		//start next chunk upload
   	   		uploadNextChunk(SubContext);
		}
		
		function uploadNextChunk(SubContext)
		{
			//检测当前运行中的上传总线程
        	console.log("[" + SubContext.index + "] uploadNextChunk totalChunkThreadCount:" + totalChunkThreadCount + " totalChunkThreadThreshold:" + totalChunkThreadThreshold);				
        	var tmpMaxChunkThreadCount = maxChunkThreadCount;
			if(totalChunkThreadCount > totalChunkThreadThreshold)
			{
	        	console.log("[" + SubContext.index + "] uploadNextChunk() 当前分片线程总数已超过阈值，进入单线程分片上传模式！");				
				tmpMaxChunkThreadCount = 1;
			}
			
			//检测当前运行中的chunk上传线程
        	console.log("[" + SubContext.index + "] uploadNextChunk() chunkThreadCount:" + SubContext.chunkThreadCount + " tmpMaxChunkThreadCount:" + tmpMaxChunkThreadCount);				
			if(SubContext.chunkThreadCount >= tmpMaxChunkThreadCount)
			{
	        	console.log("[" + SubContext.index + "] uploadNextChunk() Chunk上传线程池已满，等待Chunk上传线程结束");				
				return;
			}
			
      		//console.log("[" + SubContext.index + "] uploadNextChunk() SubContext.chunkIndex:" + SubContext.chunkIndex + " SubContext.chunkNum:" + SubContext.chunkNum);
    	    if(SubContext.chunkIndex < (SubContext.chunkNum-1)) //还有chunk上传线程未启动
    	    {
    	    	SubContext.chunkIndex++;
    	        console.log("[" + SubContext.index + "] uploadNextChunk() start upload chunk:" + SubContext.chunkIndex);
    	        var chunk = SubContext.chunkList[SubContext.chunkIndex];
    	        uploadChunk(SubContext, chunk);
    	    }
		}
		
    	function IncreaseChunkThreadCount(SubContext, chunk)
        {    
    		if(chunk.threadState == 0)
    		{
    			chunk.threadState = 1;
    			SubContext.chunkThreadCount++;
    			totalChunkThreadCount++;
    		}
        }
    	
    	function DecreaseChunkThreadCount(SubContext, chunk)
        {
    		if(chunk.threadState == 1)
    		{
    			chunk.threadState = 0;
    			SubContext.chunkThreadCount--;    	
    			totalChunkThreadCount--;
    		}
        }
		
    	function startUpload(SubContext, chunk)
    	{
			//新建文件上传表单
			var form = new FormData();
			if(false == SubContext.chunked)
			{
				console.log("[" + SubContext.index + "] startUpload() SubContext:", SubContext);
				form.append("reposId", SubContext.vid);
				//form.append("docId", SubContext.docId);
				//form.append("pid", SubContext.realParentId);
				form.append("path", SubContext.realParentPath);
				//form.append("level", SubContext.realLevel);
				form.append("name", SubContext.name);
				form.append("filePath", SubContext.filePath);
				form.append("size", SubContext.size);
				form.append("checkSum", SubContext.checkSum);
				form.append("uploadFile", SubContext.file);
				form.append("commitMsg", SubContext.commitMsg);
				if(gShareId)
				{
					form.append("shareId", gShareId);
				}
			}
			else
			{
				console.log("[" + SubContext.index + "] [" + chunk.index + "] startUpload() chunkNum:" + SubContext.chunkNum);
				//根据chunkIndex上传
				form.append("reposId", SubContext.vid);
				//form.append("docId", SubContext.docId);
				//form.append("pid", SubContext.realParentId);
				form.append("path", SubContext.realParentPath);
				//form.append("level", SubContext.realLevel);
				form.append("name", SubContext.name);
				form.append("filePath", SubContext.filePath);
				form.append("size", SubContext.size);
				form.append("checkSum", SubContext.checkSum);
				form.append("commitMsg", SubContext.commitMsg);
				if(gShareId)
				{
					form.append("shareId", gShareId);
				}
				
				//Get chunk data
				var chunkData = SubContext.file.slice(chunk.start,chunk.end);
				//console.log("[" + SubContext.index + "] [" + chunk.index + "] startUpload() chunkData:",chunkData);
				form.append("chunkNum", SubContext.chunkNum);
				form.append("cutSize",SubContext.cutSize);
				form.append("chunkIndex", chunk.index);
				form.append("chunkSize",chunk.chunkSize);
				form.append("chunkHash", chunk.checkSum);
				form.append("combineDisabled", 1); //后台不自动合并
				form.append("uploadFile", chunkData);
			}
			
			var name = SubContext.name;
			//新建http异步请求
			var xhr = new XMLHttpRequest();
			
			//设置异步上传状态变化回调处a理函数
			xhr.onreadystatechange = function() {				
				//文件上传状态
				//console.log("[" + SubContext.index + "] startUpload() xhr onreadystatechange status:" + xhr.status + " readyState:" + xhr.readyState);
				
				if(stopFlag == true || SubContext.stopFlag == true)
	            {
					console.log("[" + SubContext.index + "] startUpload() xhr onreadystatechange upload task 已取消", SubContext);
	                return;
	            }
	                   
	            var SubContextIndex = SubContextHashMap[SubContext.index + "-" + SubContext.startTime];
	            if(SubContextIndex == undefined)
	            {
	            	//可能是上一次上传遗留的响应
	            	console.log("[" + SubContext.index + "] startUpload() xhr onreadystatechange 未找到对应的索引", SubContext);
	                return;                	   
	            }
	            //console.log("[" + SubContext.index + "] startUpload() xhr onreadystatechange SubContextIndex:" + SubContextIndex, SubContext);	
									
				if(xhr.status == 200) 
				{
					if(xhr.readyState != 4)
					{
						//文件上传未结束
						return;
					}
					
					//上传成功！
					var ret = JSON.parse(xhr.responseText);
					if("ok" == ret.status){
						if(true == SubContext.chunked)
						{
							chunkUploadSuccessHandler(SubContext, chunk);
						}
						else
						{		                
		                	uploadSuccessHandler(SubContext,ret.msgInfo);
		                	
		                	//如果是新增文件，需要在目录树上增加节点
		                	if(SubContext.docId == -1)
			                {	
	    		         		var addedParentDocList = ret.dataEx;
	    		         		if(addedParentDocList)
	    		         		{
	    		         			addParentNodes(addedParentDocList);
	    		         		}
		                		
	    		         		//Add Node at zTree and DocList
			             		addTreeNode(ret.data);
			             		addDocListNode(ret.data);
			            		
			             		//set the docId so that We can open it 
			             		SubContext.docId = ret.data.id;
			                }
		                	
		                	//启动下个文件上传
		                	uploadNextDoc();
						}
					 }
					 else	//上传失败
					 {
						//上传失败
						console.log("[" + SubContext.index + "] startUpload() 上传失败：" + ret.msgInfo);
						uploadErrorHandler(SubContext, ret.msgInfo);
						uploadErrorConfirmHandler(SubContext, ret.msgInfo);
						return;
		             }
				}else{
					if(xhr.status < 300) 
					{
						//不是真正的异常
						return;
					}
					//上传失败
					console.log("[" + SubContext.index + "] startUpload() 系统异常: " + name + " 上传异常！");
					uploadErrorHandler(SubContext, name + " 上传异常！");
					uploadErrorConfirmHandler(SubContext, name + " 上传异常！");
					return;
				}
			};
			
			//设置异步上传进度回调处理函数
			xhr.upload.onprogress = function(evt) {
				//取消上传的文件，直接不处理即可
				if(stopFlag == true || SubContext.stopFlag == true)
	            {
					console.log("[" + SubContext.index + "] startUpload() xhr onprogress upload task 已取消", SubContext);
					//xhr.abort(); //结束当前上传,什么都不要处理即可	 
					return;
	            }
	                   
	            var SubContextIndex = SubContextHashMap[SubContext.index + "-" + SubContext.startTime];
	            if(SubContextIndex == undefined)
	            {
	            	//可能是上一次上传遗留的响应
	            	console.log("[" + SubContext.index + "] startUpload() xhr onprogress 未找到对应的索引", SubContext);
	                return;                	   
	            }
	            //console.log("[" + SubContext.index + "] startUpload() xhr onprogress SubContextIndex:" + SubContextIndex, SubContext);	
				
				//文件上传进度(evt获取到的是上传的所有数据的百分比，所有比实际文件要大)
				var loaded = evt.loaded;	//已上传大小
				var tot = evt.total;
				if(tot <= 0)
				{
					xhr.abort(); //结束当前上传	
					uploadErrorHandler(SubContext, "文件读取失败！");
					uploadErrorConfirmHandler(SubContext, "文件读取失败！");
					return;
				}
				
				var per = Math.floor(100 * loaded / tot); //已经上传的百分比
				
				//计算实际文件的分片上传进度
				var realUploaedSize = loaded;
				if(SubContext.chunked)
				{
					var uploadedChunkSize = (per * chunk.chunkSize)/100;
					realUploaedSize = SubContext.uploadedSize +  uploadedChunkSize;
					per =  Math.floor(100 * realUploaedSize / SubContext.size);
					console.log("[" + SubContext.index + "] [" + chunk.index + "] startUpload() xhr onprogress uploadedChunkSize:" + uploadedChunkSize + " uploadedSize:" + realUploaedSize + " fileSize:" +   SubContext.size + " per:" + per + "%");
				}
				else
				{
					console.log("[" + SubContext.index + "] startUpload() xhr onprogress 上传中："+per+"%！");
				}
				
				updateUploadSpeed(SubContext, realUploaedSize, false);

				//计算当前文件上传百分比
				$('.file'+SubContextIndex+' .el-progress__text').text(SubContext.speed + " " + per+"%");
				$('.file'+SubContextIndex+' .el-progress-bar__inner')[0].style.width = per+"%"; //进度条
				
				//printUploadedTime();
			};
			
			//上传表单			
			xhr.open("post", "/DocSystem/Doc/uploadDoc.do");
			xhr.send(form);
			uploadTime = new Date().getTime();	//上传时间初始化
    	}
    	
    	//每隔一段时间更新一下速度
    	function updateUploadSpeed(SubContext, realUploaedSize, force)
    	{
    		var currentTime = new Date().getTime();	//当前时间
    		var preUploadTime = SubContext.preUploadTime; //之前的上传时间
    		
    		var perTime = currentTime - preUploadTime;	//时间间隔
    		
    		if(force == false)
    		{
	    		//时间间隔小于1秒则不更新
	    		if(perTime < 3000)
	    		{
	    			return;
	    		}
    		}
    		
    		//乘1000是换成秒
    		var bspeed = (realUploaedSize - SubContext.preUploadSize)*1000/perTime; //上传速度(b/s)
        	var speed = bspeed;
			var units = "b/s";	//速度单位
			if((speed/1024)>1)
			{
				speed = speed/1024;
				units = "k/s";
				if((speed/1024)>1)
				{
					speed = speed/1024;
					units = "M/s";
				}
			}
			SubContext.speed = Math.round(speed) + units;
			SubContext.preUploadTime = currentTime;
			SubContext.preUploadSize = realUploaedSize;
       		console.log("[" + SubContext.index + "] 上传速度："+ SubContext.speed);
    	}
    	
		function chunkUploadSuccessHandler(SubContext, chunk)
		{
			SubContext.successChunkNum++;
			DecreaseChunkThreadCount(SubContext, chunk);  			 		
			console.log("[" + SubContext.index + "] [" + chunk.index + "] chunkUploadSuccessHandler() successChunkNum:" + SubContext.successChunkNum + " chunkNum:" +   SubContext.chunkNum + " chunkThreadCount:" + SubContext.chunkThreadCount);
			
 			//Show current doc upload progress
 			SubContext.uploadedSize += chunk.chunkSize;
 			
 			updateUploadSpeed(SubContext, SubContext.uploadedSize, false);
 			
			var per =  Math.floor(100 * SubContext.uploadedSize / SubContext.size);
 			$('.file'+SubContext.index+' .el-progress__text').text(SubContext.speed + " " + per+"%");
			$('.file'+SubContext.index+' .el-progress-bar__inner')[0].style.width = per+'%'; //进度条			
			
			console.log("[" + SubContext.index + "] [" + chunk.index + "] chunkUploadSuccessHandler() uploadedSize:" + SubContext.uploadedSize + " fileSize:" +   SubContext.size + " per:" + per + "%");

			//check if this is last success uploaded chunk
			if(isLastChunk(SubContext) == true)
			{
				combineChunks(SubContext);
				uploadNextDoc();
				return;
			}
			
			//否则上传下一个chunk
			uploadNextChunk(SubContext);
		}
		
		function stopUpload(index)
		{
			var SubContext = SubContextList[index];
			console.log("stopUpload(" + index + ")",SubContext);
			if(SubContext.stopFlag == false)
			{
				uploadErrorHandler(SubContext, "用户取消了上传");
				uploadNextDoc();
			}
		}
		
		function stopAllUpload()
		{
  			function stopAllUploadHanlder()
  			{
				//将未上传的全部设置为取消状态
				for(i=0;i<totalNum;i++)
				{
					var SubContext = SubContextList[i];
					if(SubContext.state != 4 && SubContext.state != 5)	//处理未成功也未失败的文件
					{
						uploadErrorHandler(SubContext, "用户取消了上传");
					}
				}
  			}	
  		
			if(stopFlag == false)
			{
				stopFlag = true;
				
	  			//清除标记
	  			isUploading = false;
	  			reuploadFlag = false;

	  			//显示全部重传标记
  				$(".reuploadAllBtn").show();

	  			//通过回调来处理每个文件的停止，否则会导致出现对话框卡顿现象
	  			setTimeout(function () {
	  				stopAllUploadHanlder();	  	  			
	  			}, 1000);
			}
		}
				
		//开放给外部的调用接口
        return {
            uploadDocs: function(files,parentNode,parentPath,parentId,level,vid, commitMsg){
            	uploadDocs(files,parentNode,parentPath,parentId,level,vid, commitMsg);
            },
            stopAllUpload: function(){
            	stopAllUpload();
            },
            stopUpload: function(id){
            	stopUpload(id);
            },
            getUploadStatus: function(){
            	return getUploadStatus();
            },
            reuploadFailDocs: function(id){
            	return reuploadFailDocs(id);
            },
        };
    })();