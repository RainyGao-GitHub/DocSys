	//DocUpload类
    var DocUpload = (function () {
        /*全局变量*/
        var isUploading = false;	//文件上传中标记
        var stopUploadFlag = false;	//结束上传
        var drawedNum = 0; //已绘制的进度条个数
        var uploadedNum = 0; //已上传个数
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
        var reuploadedNum = 0;
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
      	
      	//设置进度条的上传取消按键的接口,this function has performance issue, so it will not be used
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
		function uploadDocs(files,parentNode,parentPath,parentId,level,vid)	//多文件上传函数
		{
			console.log("uploadDocs()");
			
			if(!files || files.length <= 0)
			{
				showErrorMessage("请选择需要上传的文件!");
				return;
			}
			
			if(isUploading == true)
			{
				DocUploadAppend(files,parentNode,parentPath,parentId,level,vid);
			}
			else
			{
				//初始化文件上传参数
				DocUploadInit(files,parentNode,parentPath,parentId,level,vid);
				
				uploadTime = new Date().getTime();	//初始化上传时间
				uploadStartTime = uploadTime;
				preUploadTime = uploadTime;
				//启动第一个Doc的Upload操作      		
				uploadDoc();	//start upload
			}
		}
		
		//初始化DocUpload设置
      	function DocUploadInit(files,parentNode, parentPath, parentId, level, vid)	//多文件移动函数
		{
			console.log("DocUploadInit()");
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
			stopUploadFlag = false;
			fileCoverConfirmSet = 0;
			uploadErrorConfirmSet = 0;
			uploadWarningConfirmSet = 0;
			uploadedNum = 0;
			successNum = 0;
			failNum = 0;
			drawedNum =0;
			//清空上下文列表
			SubContextList = [];
			FailList = [];
			
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
				var str="<div><span class='upload-list-title'>正在上传  " +index +" / " + totalNum +"</span><span class='reuploadAllBtn' onclick='reuploadFailDocs()'>全部重传 </span><i class='el-icon-close closeBtn'></i></div>";
				str +="<div id='uploadedFileList' class='uploadedFileList'></div>";
				$(".el-upload-list").show();
				$('.el-upload-list').html(str);
				checkAndDrawUploadItems(SubContextList);
		   	}
      	}
      	
      	//增加上传文件
      	function DocUploadAppend(files,parentNode, parentPath, parentId, level, vid)	//多文件移动函数
		{
			console.log("DocUploadAppend()");
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
    	   		   	
		    		SubContext.docId = -1; //-1: 新增  
		    		
    	   		   	//advanced Info
    	   		   	SubContext.type = 1;	
		    	   	SubContext.size = file.size;
    	   		   	SubContext.name = file.name;
			    	
    	   		   	//get the realParentPath
    	   		   	getRealParentInfo(SubContext);
			    	
			    	//Status Info
		    		SubContext.index = i;
		    	   	SubContext.state = 0;	//未开始上传
		    	   	SubContext.status = "待上传";	//未开始上传
		    	   	
		    	   	//checkSum Init
		    	   	SubContext.checkSumState = 0;
		    	   	SubContext.checkSum = "";
		    	   	
		    	   	//StateMachine SMMain\SMSub
		    	   	SubContext.SMState = "init";	//uploadDoc状态机的主状态
		    	   	SubContext.SMSubState = 0;	//uploadDoc状态机的子状态
		    	   	
		    	   	//分片上传状态 
		    	   	SubContext.cutFileState = 0;
		    	   	SubContext.chunked = false;
		    	   	
		    	   	SubContext.fileCoverConfirmSet = 0;	//默认碰到已存在文件需要用户确认是否覆盖
		    		SubContext.uploadErrorConfirmSet = 0;	//默认碰到错误需要用户确认
			    	SubContext.uploadWarningConfirmSet = 0; //默认碰到警告需要用户确认
		    		SubContext.stopUploadFlag = false; //停止上传标记未false
		      								    	   	
		    	   	//Push the SubContext
		    	   	SubContextList.push(SubContext);
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
    		console.log("getRealParentInfo() relativePath:" + relativePath);
      		
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
    		console.log("getRealParentInfo() realParentPath:" + realParentPath);

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
      				console.log("druawUploadItems() all items drawed");
      				return;
      			}
      			
      			//the drawedNum ahead of index less than 100, do draw the doc progress
      			if((drawedNum - index) > 100)
      			{
      			    console.log("druawUploadItems() drawedNum:" + drawedNum + " index:" + index);
      				return;
      			}
      			
      			//Prepare to drawed
      			var startIndex = drawedNum;
      			var endIndex = totalNum;
      			if((totalNum -drawedNum) > 200)	//每次最多绘制200个
      			{
      				endIndex = drawedNum + 200;
      			}
      			var str = "";
      			for( var i = startIndex ; i < endIndex ; i++ )
		    	{	
		    		//console.log("index:" + i);
		    		var SubContext = SubContextList[i];
		    		SubContext.showSize = getFileShowSize(SubContext.size);
		    		//console.log(SubContext);
					str+="<li class='el-upload-list__item file"+i+" is-uploading' value="+i+">"+
		    				"<a class='el-upload-list__item-name uploadFileName'><i class='el-icon-document'></i><span class='uploadFileName' >"+SubContext.name+"</span></a>"+
		    				"<a class='reuploadBtn reupload"+i+"' onclick='reuploadFailDocs("+i+")'>重传 </a>"+
		    				"<label class='el-upload-list__item-status-label'><i class='el-icon-upload-success el-icon-circle-check'></i></label>"+
		    				"<i class='el-icon-close stopUpload'  value="+i+" onclick='stopUpload("+i+")'></i>"+
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
      	
      	//文件覆盖处理接口
      	function fileCoverConfirm(SubContext, msgInfo)
      	{
			var docName = SubContext.name;
      		console.log("fileCoverConfirm");
      		//It is checkIn behavior do cover
     		if(curCheckInDoc.id && curCheckInDoc.id > -1)
     		{
     			fileCoverConfirmSet = 1;
     		}
      		
  	 		var confirm = getFileCoverConfirmSetting(SubContext);
	  	 	if(confirm == 1)
	  	 	{
	  	 		//用户已确认直接覆盖
	  	 		uploadDoc();
	  	 		return;
	  	 	}
	  	 	else if(confirm == 2)
	  	 	{
	  	 		uploadErrorHandler(SubContext, "文件" + docName + " 已存在，自动跳过");
	  	 		return;
	  	 	}
	  	 	else
	  	 	{
		        var fileCoverTimer = setTimeout(function () {	//超时用户没有动作，则直接覆盖
		            	console.log("fileCoverConfirm() 是否覆盖 " + docName + ",用户确认超时,采用覆盖且后续自动覆盖");
		            	SubContext.fileCoverConfirmSet = 1; //覆盖
		            	fileCoverConfirmSet = 1;
		            	closeBootstrapDialog("fileCoverConfirm");
		            	uploadDoc(); //reEnter uploadDoc
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
	  	 			if(index < (totalNum-1)) //后续还有才提示
	  	 			{
		  	 			var fileCoverTimer1 = setTimeout(function () {	//超时用户没有动作，则直接覆盖
		 	            	console.log("fileCoverConfirm() 后续已存在文件是否自动覆盖，用户确认超时,后续自动覆盖");
		 	            	fileCoverConfirmSet = 1;
		 	            	closeBootstrapDialog("takeSameActionConfirm1");
		 	            	uploadDoc(); //reEnter uploadDoc
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
	  	  	 				uploadDoc(); //reEnter uploadDoc
	  	  	 				return true;
	  	 				},function(){
	  	 		       		console.log("fileCoverConfirm() 后续已存在文件不自动覆盖");
	  	 					clearTimeout(fileCoverTimer1);
	  	 					uploadDoc(); //reEnter uploadDoc
	  	  	 				return true;
	  	 				});
	  	 			}
	  	 			else
	  	 			{
	  	 				uploadDoc(); //reEnter uploadDoc
	  	 			}
	    	    	return true;   
	    	    },function(){
	    	    	console.log("fileCoverConfirm() 用户选择跳过上传 " + docName);
	    	    	clearTimeout(fileCoverTimer);
	
	  	 			SubContext.fileCoverConfirmSet = 2; //不覆盖
	  	 			if(index < (totalNum-1)) //后续还有才提示 
	  	 			{
		  	 			var fileCoverTimer2 = setTimeout(function () {	//超时用户没有动作，则直接覆盖
		 	            	console.log("fileCoverConfirm() 后续已存在文件是否自动跳过，用户确认超时，后续自动跳过！");
		 	            	fileCoverConfirmSet = 2;
		 	            	closeBootstrapDialog("takeSameActionConfirm2");	 	            	
		 	            	uploadErrorHandler(SubContext, "后续已存在文件是否自动跳过，用户确认超时，跳过且后续自动跳过！");
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
	  	  	 				return true;
	  	 				},function(){
	  	 					console.log("fileCoverConfirm() 后续已存在文件不自动跳过！");
	  	 	    	    	clearTimeout(fileCoverTimer2);
	  						uploadErrorHandler(SubContext, "文件已存在，跳过但后续不自动跳过");
	  	  	 				return true;
	  	 				});			
	  	 			}
	  	 			else
	  	 			{
	  	 				uploadErrorHandler(docName,"文件已存在，跳过");
	  	 			}
	    	    	return true;
	    	    });      		
      	 	}
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
      		var uploadErrorTimer = setTimeout(function () {	//超时用户没有动作，则直接覆盖
            	console.log("用户确认超时,继续上传后续文件");
            	SubContext.uploadErrorConfirmSet = 1; //继续上传
            	uploadErrorConfirmSet = 1; //全局继续上传
            	closeBootstrapDialog("uploadErrorConfirm");
            	uploadErrorHandler(SubContext, errMsg);
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
    	    	//alert("点击了确定");
				clearTimeout(uploadErrorTimer);			
      			SubContext.uploadErrorConfirmSet = 1; //继续上传
    	 		if(index < (totalNum-1))	//后续还有文件
                {
    	      		var uploadErrorTimer1 = setTimeout(function () {	//超时用户没有动作，则直接覆盖
    	            	console.log("用户确认超时,后续错误都继续上传");
    	            	uploadErrorConfirmSet = 1; //全局继续上传
    	            	closeBootstrapDialog("takeSameActionConfirm3");
    	            	uploadErrorHandler(SubContext,errMsg);
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
  	 	    	    	uploadErrorConfirmSet = 1;	//全局覆盖
  	 	    	    	uploadErrorHandler(SubContext,errMsg); //reEnter uploadDoc
  	  	 				return true;
  	 				},function(){
  	 					//后续错误将继续弹出错误确认窗口
  	 					clearTimeout(uploadErrorTimer1);
  	 	    	    	uploadErrorHandler(SubContext,errMsg);
  	  	 				return true;
  	 				});	
                }
    	 		else
    	 		{
             		uploadErrorConfirmHandler(SubContext, errMsg);
             		return;
    	 		}
    		},function(){
    	    	//alert("点击了取消");
    	    	clearTimeout(uploadErrorTimer);
      			SubContext.uploadErrorConfirmSet = 2; //结束所有上传
          		uploadErrorConfirmSet = 2; //全局取消上传    	 		
		 		uploadErrorAbortHandler(SubContext,errMsg);
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
    	            	uploadWarningHandler(SubContext,msgInfo);
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
  	 	    	    	uploadWarningHandler(SubContext,msgInfo); //reEnter uploadDoc
  	  	 				return true;
  	 				},function(){
  	 					//后续错误将继续弹出错误确认窗口
  	 					clearTimeout(uploadWarningTimer1);
  	 	    	    	uploadWarningHandler(SubContext,msgInfo);
  	  	 				return true;
  	 				});	
                }
    	 		else
    	 		{
             		uploadWarningConfirmHandler(SubContext,msgInfo);
             		return;
    	 		}
    		},function(){
    	    	//alert("点击了取消");
    	    	clearTimeout(uploadWarningTimer);
      			SubContext.uploadWarningConfirmSet = 2; //结束所有上传
          		uploadWarningConfirmSet = 2; //全局取消上传    	 		
		 		uploadWarningAbortHandler(SubContext,msgInfo);
      		});
      	}
      	
      	//uploadWarnignConfirmHandler
      	function uploadWarningConfirmHandler(SubContext,msgInfo)
      	{
			console.log("警告：" + msgInfo);
			var confirm = getUploadWarningConfirmSetting();
			if(confirm == 1)
			{
				uploadWarningHandler(SubContext, msgInfo);
			}
			else if(confirm == 2)	//结束上传
			{
				uploadWarningAbortHandler(SubContext, msgInfo);
			}
			else
			{
				uploadWarningConfirm(SubContext, msgInfo);
			}
      	}
      	
      	//uploadWarningHandler
      	function uploadWarningHandler(SubContext,msgInfo)
      	{
      		var FileName = SubContext.name;
      		console.log("uploadWarningHandler() "+ FileName + " " + msgInfo);
      	  	
      		//If curCheckInDoc was set, means the upload is for CheckIn
          	if(curCheckInDoc.id && curCheckInDoc.id > -1)
          	{
          		//CheckIn ok, do unlock the doc
          		unlockDoc(curCheckInDoc.id);
          		curCheckInDoc.id = -1;
          	}
          		
          	successNum++;
    	      	
          	if(true == reuploadFlag)
          	{	
    	      	console.log("uploadWarningHandler() 重传成功");
    	      	reuploadSuccessNum++;
    	    }
    	    SubContext.state = 2;	//上传结束
          	SubContext.status = "success";
          	SubContext.msgInfo = msgInfo;
    		//hide the reupload btn
    		$(".reupload"+index).hide();
    		uploadNextDoc();
        }
      	
      	//uploadWarningAbortHandler
      	function uploadErrorAbortHandler(SubContext,errMsg)
      	{
      		var FileName = SubContext.name;
      		console.log("uploadWarningAbortHandler() "+ FileName + " " + errMsg);
      		
      		//If curCheckInDoc was set, means the upload is for CheckIn
          	if(curCheckInDoc.id && curCheckInDoc.id > -1)
          	{
          		//CheckIn ok, do unlock the doc
          		unlockDoc(curCheckInDoc.id);
          		curCheckInDoc.id = -1;
          	}
          		
          	successNum++;
    	      	
          	if(true == reuploadFlag)
          	{	
    	      	console.log("uploadWarningHandler() 重传成功");
    	      	reuploadSuccessNum++;
    	    }
    	    SubContext.state = 2;	//上传结束
          	SubContext.status = "success";
          	SubContext.msgInfo = msgInfo;
    		//hide the reupload btn
    		$(".reupload"+index).hide();
      		uploadEndHandler();
      	}
      	
      	//uploadErrorConfirmHandler
      	function uploadErrorConfirmHandler(SubContext,errMsg)
      	{
      		var FileName = SubContext.name;
			console.log("上传失败：" + errMsg);
			var confirm = getUploadErrorConfirmSetting(SubContext);
			if(confirm == 1)
			{
				uploadErrorHandler(SubContext, errMsg);
			}
			else if(confirm == 2)	//结束上传
			{
				uploadErrorAbortHandler(SubContext, errMsg);
			}
			else
			{
				uploadErrorConfirm(SubContext, errMsg);
			}
      	}
      	
      	//uploadErrorHandler
      	function uploadErrorHandler(SubContext,errMsg)
      	{
      		var FileName = SubContext.name;
      		console.log("uploadErrorHandler() "+ FileName + " " + errMsg);
      		
      		//CheckIn Failed
      		if(curCheckInDoc.id && curCheckInDoc.id > -1)
      		{	
          		console.log("uploadErrorAbortHandler() checkIn failed for "+ FileName + " " + errMsg);      			
          		curCheckInDoc.id = -1;
      		}
      		
      		if(false == reuploadFlag)
      		{
      			failNum++;
      		}
      		else
      		{
          		console.log("uploadErrorHandler() 重传出错");
      			reuploadFailNum++;
      		}
      		//设置上传状态
			SubContext.state = 3;	//上传结束
      		SubContext.status = "fail";
			SubContext.msgInfo = errMsg;
			uploadNextDoc();		 	
      	}
      	
      	//uploadErrorAbortHandler
      	function uploadErrorAbortHandler(SubContext,errMsg)
      	{
      		var FileName = SubContext.name;      		
      		console.log("uploadErrorAbortHandler() "+ FileName + " " + errMsg);
      		//CheckIn Failed
      		if(curCheckInDoc.id && curCheckInDoc.id > -1)
      		{	
          		console.log("uploadErrorAbortHandler() checkIn failed for "+ FileName + " " + errMsg);      			
          		curCheckInDoc.id = -1;
      		}
      	
      		if(false == reuploadFlag)
      		{
      			failNum++;
      		}
      		else
      		{
          		console.log("uploadErrorAbortHandler() 重传出错");
      			reuploadFailNum++;
      		}
    		//设置上传状态
			SubContext.state = 3;	//上传结束
      		SubContext.status = "fail";
      		SubContext.msgInfo = errMsg;
      		uploadEndHandler();
      	}
      	
      	//uploadSuccessHandler
      	function uploadSuccessHandler(SubContext,msgInfo)
      	{	
      		var FileName = SubContext.name;
      		console.log("uploadSuccessHandler() "+ FileName + " " + msgInfo);
      		//If curCheckInDoc was set, means the upload is for CheckIn
      		if(curCheckInDoc.id && curCheckInDoc.id > -1)
      		{
      			//CheckIn ok, do unlock the doc
      			unlockDoc(curCheckInDoc.id);
      			curCheckInDoc.id = -1;
      		}
      		
      		successNum++;
	      	
      		if(true == reuploadFlag)
      		{	
	      		console.log("uploadSuccessHandler() 重传成功");
	      		reuploadSuccessNum++;
	      	}
	      	SubContext.state = 2;	//上传结束
      		SubContext.status = "success";
      		SubContext.msgInfo = msgInfo;
			//hide the reupload btn
			$(".reupload"+index).hide();
			uploadNextDoc();
      	}

  		function showUploadEndInfo()
  		{
  			var uploadEndInfo = "上传完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			uploadEndInfo = "上传完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
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

      	//uploadEndHandler
      	function uploadEndHandler()
      	{
      		console.log("uploadEndHandler() 上传结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
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
      	
      	//uploadNextDoc，如果后续有未上传文件则上传下一个文件 
		function uploadNextDoc()
		{
      		if(false == reuploadFlag)
      		{
	      		index++;
				if(index < totalNum)
				{
					uploadDoc(); 
				}
				else
				{
					uploadEndHandler();
				}
      		}
      		else 
      		{
      			reuploadIndex ++;
      			if(reuploadIndex < reuploadTotalNum)
      			{
      				index = reuploadList[reuploadIndex];
      				uploadDoc();
      			}
      			else
      			{
      				uploadEndHandler();
      			}      				
      		}
		}
      	
 		var CheckSumCaculator = (function(){
 			var caculateIndex = 0;
 			var reuploadCaculateIndex = 0;
 			
 	      	//由于FileReader是异步调用，因此该接口也是异步调用，结果会保存在SubContext.checkSum中
 	      	function caculate()
 	      	{
 	      		//console.log("caculateFileCheckSum() caculateIndex:" + caculateIndex);
 	      		var SubContext = SubContextList[caculateIndex];
 	 			if(1 == SubContext.checkSumState)
 	          	{
 	      			//console.log("caculateFileCheckSum() checkSum is caculating for: " + SubContext.name );
 	      			return;
 	          	}
 	      		else if(2 == SubContext.checkSumState)
 	      		{
 	      			//console.log("caculateFileCheckSum() checkSum is ready for:" + SubContext.name);
 	      			caculateNext();
 	      			return;
 	      		}
 	      		
 	      		//start to caculate the checkSum for SubContext
 	      		//console.log("caculateFileCheckSum() start caculate checkSum for:",SubContext);
 	      		var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
 	            	file = SubContext.file,
 	            	chunkSize = 2097152,                           // read in chunks of 2MB
 	            	chunks = Math.ceil(SubContext.size / chunkSize),
 	            	currentChunk = 0,
 	            	spark = new SparkMD5(),
 	            	time,
 	            	uniqueId = 'chunk_' + (new Date().getTime()),
 	            	chunkStep = 1,
 	            	fileReader = new FileReader();
 	      		
 	      		//console.log("caculateFileCheckSum() blobSlice",blobSlice);
 	      		
 		        fileReader.onload = function (e) {
 		            //console.log("currentChunk=" + currentChunk);
 		            if(stopUploadFlag == true || SubContext.stopUploadFlag == true)
 		            {
 		            	console.log("caculateFileCheckSum() upload was stoped, stop caculate");
 		                return;
 		            }
 		            
 		            if (currentChunk === 0) {
 		                //console.log("caculateFileCheckSum() Read chunk number id=" + uniqueId + " + currentChunk=" + (currentChunk + 1) + " chunks=" + chunks);
 		                if(chunks > 10)
 		                {
 		                	chunkStep = chunks / 10;
 		                }
 		                //console.log("caculateFileCheckSum() chunkStep=" + chunkStep);
 		            }
 		
 		            spark.appendBinary(e.target.result);                 // append array buffer
 		            currentChunk += chunkStep;
 		
 		            if (currentChunk < chunks) {
 		                loadNext();
 		            } else {

 		            	SubContext.checkSum = spark.end();	            	
 		                //console.log("caculateFileCheckSum() Computed hash:" + SubContext.checkSum); // computed hash
 		            	SubContext.checkSumState = 2; 		                
 		                
 		                //To caculateNext
 		                caculateNext();
 		            }
 		        };
 		
 		        //Fail to compute hash
 		        fileReader.onerror = function () {
 		        	SubContext.checkSumState = 3;
 	                console.log("caculateFileCheckSum() Fail to Computed hash"); //fail to compute hash
 	                
		            //To caculateNext
		            caculateNext();
 		        };
 		
 		        function loadNext() {
 		            var start = currentChunk * chunkSize;
 		            var end = start + chunkSize >= file.size ? file.size : start + chunkSize;
 		            
 		            if(fileReader.readAsBinaryString)
 		            {
 		            	fileReader.readAsBinaryString(blobSlice.call(file, start, end));
 		            }
 		            else
 		            {
 		            	console.log("caculateFileCheckSum() 当前浏览器不支持读取文件，无法计算CheckSum"); //fail to compute hash
 		            	SubContext.checkSumState = 4;
 		            	SubContext.checkSum = "";	
 		            }
 		            
 		        }
 		
 	      		//set the running state
 	      		SubContext.checkSumState = 1;
 	      		SubContext.checkSum = "";
 		        loadNext();
 	      	}
 	      	
 	   		function caculateNext()
 	   		{
 	         	if(false == reuploadFlag)
 	         	{
 	   	      		caculateIndex++;
 	   				if(caculateIndex < totalNum)
 	   				{
 	   					caculate(); 
 	   				}
 	   				else
 	   				{
 	   					console.log("caculateNext() all upload doc checkSum was computed");
 	   				}
 	         	}
 	         	else 
 	         	{
 	         		reuploadCaculateIndex ++;
 	         		if(reuploadCaculateIndex < reuploadTotalNum)
 	         		{
 	         			caculateIndex = reuploadList[reuploadCaculateIndex];
 	         			caculate();
 	         		}
 	         		else
 	         		{
 	         			console.log("caculateNext() for all reupload doc checkSum was computed");
 	         		}			
 	         	}
 	       }
 	   	   
 	   		//开放给外部的调用接口
 	        return {
 	            caculate : function(startId){
 	            	if(false == reuploadFlag)
 	            	{
 	            		caculateIndex = startId;
 	            	}
 	            	else
 	            	{
 	            		reuploadCaculateIndex = startId;
 	            		caculateIndex = reuploadList[reuploadCaculateIndex];
 	            	}
 	            	caculate();
 	            },
 	        };
 		})();
      	
      	
		function getFileCheckSum(SubContext)
		{            
			switch(SubContext.checkSumState)
			{
			case 0:				
				 //Start CheckSum Caculator: It will caculate for all upload or reupload Docs
				 console.log("getFileCheckSum() checkSum not computed, start compute");
				 if(false == reuploadFlag)
			     {
					 CheckSumCaculator.caculate(index);					 
			     }
				 else
			     {
					 CheckSumCaculator.caculate(reuploadIndex);					 
			     }
				 //注意：CheckSumCaculator.caculate是异步调用，如果启动成功的话，则会把状态改为1，所以这里没有break
			case 1:
				//Start timer to wait for result
		        console.log("getFileCheckSum() checkSum not ready, wait for result 100 ms later"); 
				setTimeout(function () {
		            uploadDoc(); //reEnter uploadDoc
		        },50);	//check it 50ms later
				return false;
			case 2:
				//CheckSum ok
				return true;
			case 3:
				//CheckSum Failed, Skip to upload this file
				return true;
			default:
				//CheckSum Error
				SubContext.checkSum = "";
				return true;
			}
		}
      	
      	//返回false表示该接口触发异步调用，当前uploadDoc线程需要先退出，异步回调会根据check结果决定后续是否reenter uploadDoc
      	function checkDocInfo(SubContext)
      	{      		
      		var name = SubContext.name;
	  	 	//console.log("checkDocInfo() file:" + name);

	  	 	//It is the first call for file, so we need to check the docInfo
	  	 	//console.log("checkDocInfo() SM [" + SubContext.SMState + "," + SubContext.SMSubState + "]");
   			if("checkDocInfo" == SubContext.SMState && 1 == SubContext.SMSubState)
   			{
   				return true;
   			}
   			
   			console.log("checkDocInfo() for file:"+ name);
   			//Modify the SM
      		SubContext.SMState = "checkDocInfo";
      		SubContext.SMSubState = 1;
      		
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
	             		console.log("checkDocInfo() ret",ret);
	             		if(ret.msgData == "0")	//文件存在但checkSume不同，等待用户确认是否覆盖
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
	             			
	             			$('.file'+index).removeClass('is-uploading');
		    				$('.file'+index).addClass('is-success');
		                    uploadSuccessHandler(SubContext, ret.msgInfo);
							return;
	             		}
	             		else
	             		{
	             			//doc not exists, let's resume the uploadDoc
	             			uploadDoc();
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
	      		$(".upload-list-title").text("正在上传   " + uploadedNum + " / " + totalNum);
      		}
      		else
      		{
      			$(".upload-list-title").text("正在重传   " + reuploadedNum + " / " + reuploadTotalNum);
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
		        reuploadedNum = 0;
		    	reuploadFailNum = 0;
		        reuploadSuccessNum = 0;
				stopUploadFlag = false;
				fileCoverConfirmSet = 0;
				uploadErrorConfirmSet = 0;
				uploadWarningConfirmSet = 0;
			}
			else
			{
				console.log("reuploadFailDocs() 重传进行中,更新重传列表即可");
			}
	        
			//Build reupload List
			if(id)
			{
				setSubContextForReupload(id);
			}
			else
			{
				//由于push会pop后进的id,会导致先上传还未绘制进度条的文件，因此反过来遍历
				for(i=0; i<totalNum;i++)
				{
					setSubContextForReupload(i);
				}
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
				index = reuploadList[reuploadIndex];
				console.log("reuploadFailDocs() 重传开始" + index);
				uploadDoc();
			}
		}
		
		function setSubContextForReupload(id)
		{
			var SubContext = SubContextList[id];
			
			//console.log("setSubContextForReupload()",SubContext);
			//已成功地不能重传
			if(2 == SubContext.state)
			{
				return;
			}
			
			//避免在上传过程中，被多次重传
			if(true == reuploadFlag)
			{
				if(true == SubContext.reuploadFlag)
				{
					return;
				}
			}
			SubContext.reuploadFlag = true;
				
			//其他所有状态的都可以重传
			reuploadTotalNum ++;

			//Reset all basick SubContext 
			SubContext.state = 0;
			if(SubContext.checkSumState != 2) //checkSum is not ready, need to recaculate the checkSum
			{
				SubContext.checkSumState = 0; 
			}
			//CheckDocInfo should be reCheck
			SubContext.SMState = "init";
			SubContext.SMSubState = 0;
			//stopUploadFlag should be clean
			SubContext.stopUploadFlag = false;
			//confirmSet should be clean
			SubContext.fileCoverConfirmSet = 0;
			SubContext.uploadErrorConfirmSet = 0;
			SubContext.uploadWarningConfirmSet = 0;
			
			reuploadList.push(id);
		}
		
		//CutFile will cut file to dedicated size slice
		function CutFile(SubContext)
		{ 	
			if(0 == SubContext.cutFileState)
			{
				console.log("CutFile() for", SubContext);
				var cutSize = 2097152;
				var minCutSize = cutSize * 10;
				if(SubContext.size < minCutSize)	//< 20M do not cut
				{
					SubContext.cutFileState = 2;
					console.log("CutFile() file size less than minCutSize " + minCutSize);
					return true;
				}
				
				console.log("CutFile() start to cut file");
				SubContext.chunked = true;
				SubContext.cutSize = cutSize;
				SubContext.cutFileState = 1;
				SubContext.chunkIndex = 0;
				SubContext.chunkNum = Math.ceil(SubContext.size / cutSize);
				//Build ChunkList
				var chunkList = [];
				for(i=0; i< SubContext.chunkNum; i++)
				{
					var chunk = [];
					var start = i * cutSize;
					chunk.start= start;
					chunk.end =  start + cutSize >= SubContext.size ? SubContext.size : start + cutSize;
					chunk.chunkSize = chunk.end - chunk.start;
					chunk.checkSum = "";
					chunk.checkSumState = 0;
					chunk.uploadedState = 0;
					chunkList.push(chunk);
				}
				SubContext.chunkList = chunkList;
				console.log("CutFile() cut ok",SubContext);
			}
			else if(2 == SubContext.cutFileState)
 	      	{
 	      		//console.log("CutFile() completed for:",SubContext);
 	      		return true;
 	      	}
 	      	else
 	      	{
 	      		console.log("CutFile() is in processing for: ",SubContext);
	      		return false;
 	      	}
 	      		
 	      	//start to caculate the chunk checkSum
 	      	console.log("CutFile() start to caculate chunk checkSum for:" + SubContext.name);
 	      	var blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice,
 	            	file = SubContext.file,
 	            	cutSize = cutSize,                           // read in chunks of 2MB
 	            	chunks = SubContext.chunkNum,
 	            	currentChunk = 0,
 	            	fileReader = new FileReader();
 	      		
        	fileReader.onload = function (e) {
            	if(stopUploadFlag == true || SubContext.stopUploadFlag == true)
            	{
            		console.log("CutFile() upload was stoped, stop caculate chunk checkSum");
                	return;
            	}
    	      	var hash = SparkMD5.hashBinary(e.target.result);   //compute Data Hash
    	      	SubContext.chunkList[currentChunk].checkSum = hash;
    	      	SubContext.chunkList[currentChunk].checkSumState = 2;		            	
            	console.log("CutFile() Chunk " + currentChunk + " data read ok, checkSum is " + hash);
            	
            	//Try to start read next chunk data
            	currentChunk ++;
            	if (currentChunk < chunks) {
                	loadNext();
            	}
            	else
            	{
            		console.log("CutFile() all chunks checkSum is ready ",SubContext);
                	SubContext.cutFileState = 2;
            		return;
            	}
            };
		        
		    function loadNext() {
		    	//console.log("loadNext()");
		    	SubContext.chunkList[currentChunk].checkSumState = 1;
		        var start = SubContext.chunkList[currentChunk].start;
		        var end = SubContext.chunkList[currentChunk].end;
		        //console.log("loadNext() ",start,end);
		        fileReader.readAsBinaryString(blobSlice.call(file, start, end));
		    }
		    
	      	//Trigger the fileRead
		    loadNext();
		    return false;
		}
		
		function isLastChunk(SubContext)
		{
			if(SubContext.chunkIndex == SubContext.chunkNum -1)
			{
				return true;
			}
			return false;
		}
		
		function getChunkCheckSum(SubContext)
		{            
			console.log("getChunkCheckSum() chunkIndex:" + SubContext.chunkIndex)
			var chunk = SubContext.chunkList[SubContext.chunkIndex];
			switch(chunk.checkSumState)
			{
			case 0:
			case 1:
				//Start timer to wait for result
		        console.log("getChunkCheckSum() chunk checkSum not ready, wait for result 100 ms later"); 
				setTimeout(function () {
		            uploadDoc(); //reEnter uploadDoc
		        },100);	//check it one minute later
				return false;
			case 2:
				//CheckSum ok
				return true;
			default:
				//CheckSum Error
				SubContext.checkSum = "";
				return true;
			}
		}
		
      	function checkChunkUploaded(SubContext)
      	{      		
      		var name = SubContext.name;
	  	 	console.log("checkChunkUploaded() for file:"+ name);
	  	 	
   			var chunk = SubContext.chunkList[SubContext.chunkIndex];
	  	 	if(0 != chunk.uploadedState)
	  	 	{
	  	 		return true;
	  	 	}
   			
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
	             	chunkIndex: SubContext.chunkIndex,
	             	chunkNum: SubContext.chunkNum,
	             	cutSize: SubContext.cutSize,
	             	chunkSize: chunk.chunkSize,
	             	chunkHash: chunk.checkSum,
	             	shareId: gShareId,
	             },
	             success : function (ret) {
	             	if( "ok" == ret.status)
	             	{		
	             		console.log("checkChunkUploade() ret",ret);
	             		if(ret.msgData && ret.msgData == "0")	//分片文件不存在 
	             		{
	             			chunk.uploadedState = 1;
	             			uploadDoc();
	             			return;
	             		}
	             		else
	             		{
	             			chunk.uploadedState = 2;
	             			
	             			//Show current doc upload progress
	             			SubContext.uploadedSize += chunk.chunkSize
	             			console.log("checkChunkUploaded() uploadedSize:" + SubContext.uploadedSize + " fileSize:" +   SubContext.size);
	    					var per =  Math.floor(100 * SubContext.uploadedSize / SubContext.size);
	    					$('.file'+index+' .el-progress__text').text(per+"%");
	    					$('.file'+index+' .el-progress-bar__inner')[0].style.width=per+'%';
							
	    					console.log("checkChunkUploaded() chunkIndex:" + SubContext.chunkIndex + " chunkNum:" +   SubContext.chunkNum);
	    					//the last chunk exists
	    					if(SubContext.chunkIndex == (SubContext.chunkNum -1))
	    					{
	    						console.log("checkChunkUploaded() All chunks uploaded",SubContext);
		    					
		    					//All Chunk Uploaded, means file upload ok, 这里的逻辑是有问题的，因为没有ret
		    		        	if(SubContext.docId == -1) //文件新建成功
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
		    					//update the uploadStatus
		    					$('.file'+index).removeClass('is-uploading');
		    					$('.file'+index).addClass('is-success');
		    					uploadSuccessHandler(SubContext,ret.msgInfo);
	    					}
	    					else
	    					{
	    						//re enter uploadDoc to upload next trunk
	    						SubContext.chunkIndex++;
	    						uploadDoc();
	    					}
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
				 	uploadErrorConfirmHandler(SubContext, "checkChunkUploade "+name+ " 异常");
		            return;
	            }
	        });
   			return false;
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
      	
		function startChunkUpload(SubContext)
		{ 
			if(SubContext.chunkIndex <  SubContext.chunkNum)
			{
   	   			if(false == getChunkCheckSum(SubContext))
   	   			{
   	   				//checkSum for chunk is not ready, timer be called, callback will re-enter uploadDoc 100ms later
   	   				return;
   	   			}
	   			
   	   			//检查Chunk是否存在且是否相同，return false 表示内部有异步调用
   	   			if(false == checkChunkUploaded(SubContext))
   	   			{
   	    			console.log("startChunkUpload() checkChunkUploaded be called, callback will re-enter uploadDoc");   				
   	   				return;
   	   			}
	   			
   	   			//根据chunk.state决定是否上传
   	   			var chunk = SubContext.chunkList[SubContext.chunkIndex];
   				if(1 == chunk.uploadedState)	//current chunk not uploaded
   				{
	   				startUpload(SubContext); //Do Upload the chunk
	   				return;
   				}
			}
		}
		
    	function startUpload(SubContext)
    	{
			console.log("startUpload() SubContext:" , SubContext);

			//新建文件上传表单
			var form = new FormData();
			if(false == SubContext.chunked)
			{
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
				if(gShareId)
				{
					form.append("shareId", gShareId);
				}
			}
			else
			{
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
				if(gShareId)
				{
					form.append("shareId", gShareId);
				}
				
				var chunkIndex = SubContext.chunkIndex;
				var chunkNum = SubContext.chunkNum;
				var chunk = SubContext.chunkList[chunkIndex];
				console.log("startUpload() chunkIndex:" + chunkIndex + " chunkNum:" + chunkNum, chunk);
				var chunkData = SubContext.file.slice(chunk.start,chunk.end);
				console.log("startUpload() chunkData:",chunkData);
				form.append("chunkIndex", chunkIndex);
				form.append("chunkNum", chunkNum);
				form.append("cutSize",SubContext.cutSize);
				form.append("chunkSize",chunk.chunkSize);
				form.append("chunkHash", chunk.checkSum);
				form.append("uploadFile", chunkData);
			}
			
			var name = SubContext.name;
			//新建http异步请求
			var xhr = new XMLHttpRequest();
			
			//设置异步上传状态变化回调处a理函数
			xhr.onreadystatechange = function() {				
				//文件上传状态
				console.log("xhr onreadystatechange() status:" + xhr.status + " readyState:" + xhr.readyState);
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
						if(true == SubContext.chunked && false == isLastChunk(SubContext))
						{
							//分片上传未结束,re-enter uploadDoc to upload next chunk
							SubContext.chunkIndex++;
							uploadDoc();
							return;
						}
						
	                	if(SubContext.docId == -1) //文件新建成功
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
	                	
						//update the uploadStatus
						$('.file'+index).removeClass('is-uploading');
						$('.file'+index).addClass('is-success');
						uploadSuccessHandler(SubContext,ret.msgInfo);
					 }
					 else	//上传失败
					 {
						//上传失败
						console.log("上传失败：" + ret.msgInfo);
	
						//update the uploadStatus
						$('.file'+index).removeClass('is-uploading');
						$('.file'+index).addClass('is-fail');
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
					console.log("系统异常: " + name + " 上传异常！");
					$('.file'+index).removeClass('is-uploading');
					$('.file'+index).addClass('is-fail');
					uploadErrorConfirmHandler(SubContext, name + " 上传异常！");
					return;
				}
			};
			
			//设置异步上传进度回调处理函数
			xhr.upload.onprogress = function(evt) {
				//由于xhr.abort不能立即结束上传，因此会导致uploadErrorHandler多次被调用而导致状态机混乱，因此目前处理方式只对未开始上传的文件有效
				var SubContext = SubContextList[index];
				if(stopUploadFlag == true || SubContext.stopUploadFlag == true)
				{
					console.log("stopUploadFlag: " + stopUploadFlag + " SubContext.stopUploadFlag:" + SubContext.stopUploadFlag);	
					if(true == SubContext.stopUploadFlag)	//we need to promise there is only one abort for one doc upload
					{
						SubContext.stopUploadFlag = false;
						xhr.abort(); //结束当前上传	 
						uploadErrorHandler(SubContext, name + " 取消上传！");
					}
					return;
				}
				
				//文件上传进度(evt获取到的是上传的所有数据的百分比，所有比实际文件要大)
				var loaded = evt.loaded;	//已上传大小
				var tot = evt.total;
				if(tot <= 0)
				{
					xhr.abort(); //结束当前上传	
					//update the uploadStatus
					$('.file'+index).removeClass('is-uploading');
					$('.file'+index).addClass('is-fail');
					uploadErrorConfirmHandler(SubContext, "文件读取失败！");
					return;
				}
				
				var per = Math.floor(100 * loaded / tot); //已经上传的百分比
				console.log("upload.onprogress loaded:" + loaded + " tot:" + tot + " per:" + per);
				
				//计算实际文件的分片上传进度
				if(SubContext.chunked)
				{
					var uploadedChunkSize = (per * SubContext.chunkList[SubContext.chunkIndex].chunkSize)/100;
					var realUploaedSize = SubContext.uploadedSize +  uploadedChunkSize;
					if(per == "100")	//单片上传结束
					{
						SubContext.uploadedSize = realUploaedSize;
					}
					per =  Math.floor(100 * realUploaedSize / SubContext.size);
				}
				
				//计算当前文件上传百分比
				$('.file'+index+' .el-progress__text').text(per+"%");
				$('.file'+index+' .el-progress-bar__inner')[0].style.width=per+'%';
				console.log("上传中："+per+"%！"); 
	
				//统计总的已上传大小、百分比、上传速度、剩余上传时间
				uploadTime = new Date().getTime();
				if(per=="100")
				{
					uploadedFileSize = uploadedFileSize + tot; //已完成上传的文件大小
					uploadedSize = uploadedFileSize;
				}
				else
				{
					uploadedSize = uploadedFileSize + loaded;
				}
				var remainSize = totalSize - uploadedSize;
				var usedTime = (uploadTime - uploadStartTime)/1000; //转换成秒
	    		//console.log("totalSize:" + totalSize + " remainSize:" + remainSize + " preUploadSize:" + preUploadSize + " uploadedSize:"+ uploadedSize);
	    		if(remainSize < 0)
	    		{
	    			remainSize = 0;
	    		}
				
				var perTime = (uploadTime - preUploadTime)/1000;
	    		//console.log("preUploadTime:" + preUploadTime + " uploadTime:" + uploadTime + " perTime:" + perTime);
				if(perTime > 1)	//每10秒更新一次下载速度
	    		{
	    			var bspeed = (uploadedSize - preUploadSize)/perTime; //上传速度(b/s)
	        		uploadSpeed = bspeed;
	        		preUploadSize = uploadedSize;
					preUploadTime = uploadTime;
	    		}				
	    		var remainTime = remainSize/uploadSpeed;
	    		var totPer = Math.floor(100 * uploadedSize / totalSize);
				//计算显示用speed和时间
	    		var speed = uploadSpeed;
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
	       		//console.log("上传速度："+ speed + units);
				//console.log("总进度：" + totPer + " 已用时间：" + usedTime + " 剩余时间：" + remainTime);
			};
			
			//上传表单			
			xhr.open("post", "/DocSystem/Doc/uploadDoc.do");
			xhr.send(form);
			uploadTime = new Date().getTime();	//上传时间初始化
    	}
    	
		//uploadDoc接口，该接口是个递归调用
    	function uploadDoc()
    	{
    		//upload files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
				totalSize = Content.totalFileSize;	
    		}
    		
    		//每次上传前检查是否需要绘制，小于200个上传项目时绘制
    		checkAndDrawUploadItems(SubContextList);
			
    		//console.log("uploadDoc() index:" + index + " totalNum:" + totalNum);
    		var SubContext = SubContextList[index];
			
    		//判断是否取消上传
    		if(stopUploadFlag == true)
    		{
    			console.log("uploadDoc(): 结束上传");
    			uploadEndHandler();
    			return;
    		}
    		
    		//取消当前文件上传
			if(SubContext.stopUploadFlag == true)
			{
				console.log("uploadDoc() 用户取消了上传 "+ name);
    			uploadErrorHandler(name,"用户取消了上传！");
				return;
			}
    		
    		//设置上传状态
    		if(0 == SubContext.state)
    		{   
    			console.log("uploadDoc() 开始上传 fileName:" + SubContext.name,SubContext);
				SubContext.state = 1;	//上传中
				SubContext.uploadedSize = 0; //Clear uploadedSize

				if(false == reuploadFlag)
    			{
    				uploadedNum++;
    			}
    			else
    			{
    				reuploadedNum++;
    			}
				
				showUploadingInfo();
				
				//get the file from the SubContextList
    			var file = SubContext.file;
				if(!file) 
				{
					uploadErrorHandler("未知","不是文件");
					return; 
				}
    		}
    		
   			if(false == getFileCheckSum(SubContext))
   			{
   				//checkSum is not ready, timer be called, callback will re-enter uploadDoc 100ms later
   				return;
   			}
   			
   			if(3 == SubContext.checkSumState)
   			{
				//uploadErrorHandler(SubContext.name,"文件校验码计算错误");
				uploadErrorConfirmHandler(SubContext, "文件校验码计算错误")
				return;
   			}
   			
   			//检查文件是否存在且是否相同，return false 表示内部有异步调用
   			if(false == checkDocInfo(SubContext))
   			{
    			console.log("uploadDoc() checkDocInfo be called, callback will re-enter uploadDoc");   				
   				return;
   			}
   			//console.log("uploadDoc() checkDocInfo completed"); 
			   			
   			//该接口只对大于50M的文件进行切片，设置chunked标记，生成chunkList（chunkHash或者叫chunkCheckSum并没有完全生成，所以后续getChunkedSum可能需要等待）
   			CutFile(SubContext); 
   			
   			if(false == SubContext.chunked) 
   			{
   	   			startUpload(SubContext);
   	   			return;
   			}
   			else
   			{
   				startChunkUpload(SubContext);	
   			}
    	}
		
		function stopUpload(index)
		{
			console.log("stopUpload() index:" + index ,SubContext);
			SubContext.stopUploadFlag = true;
		}
		
		function stopAllUpload()
		{
			//将未上传的全部设置
			for(i=index;i<totalNum;i++)
			{
				SubContextList[i].stopUploadFlag = true;
			}
			stopUploadFlag = true;
			
  			//清除标记
  			isUploading = false;
  			reuploadFlag = false;
		}
				
		//开放给外部的调用接口
        return {
            uploadDocs: function(files,parentNode,parentPath,parentId,level,vid){
            	uploadDocs(files,parentNode,parentPath,parentId,level,vid);
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