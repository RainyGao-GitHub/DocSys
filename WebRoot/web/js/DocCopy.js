	//DocCopy类
    var DocCopy = (function () {
        /*全局变量*/
        var isCopping = false;	//文件复制中标记
        var stopCopyFlag = false;	//结束复制
        var copiedNum = 0; //已复制个数
        var successNum = 0;	//成功复制个数
		var failNum = 0; //复制失败个数
		
        /*copyContent 用于保存文件复制的初始信息*/
        var copyContent = {};
        copyContent.copyBatchList = [];
        copyContent.batchNum = 0;	//totalBatchNum
        copyContent.batchIndex = 0;	//curBatchIndex
        copyContent.state = 0;	//0: all copyBatch not inited 1: copyBatch Init is on going 2: copyBatch Init completed
        copyContent.initedFileNum = 0;
        copyContent.totalFileNum = 0; 
        
        /*copyDoc conditions 用于指示当前的复制文件及复制状态*/
        var index = 0; //当前操作的索引
        var totalNum = 0; 
 		var SubContextList = []; //文件复制上下文List，用于记录单个文件的复制情况，在开始复制的时候初始化
        var vid = 0;
 		
        //状态机变量，用于实现异步对话框的实现
        var copyConflictConfirmSet = 0; //0：文件已存在时弹出确认窗口，1：文件已存在直接更改目标文件名，2：文件已存在跳过
        var copyErrorConfirmSet = 0; //0:复制错误时弹出确认是否继续复制窗口，1：复制错误时继续复制后续文件， 2：复制错误时停止整个复制		
        var copyWarningConfirmSet =0; //0: 复制警告时弹出确认是否继续复制窗口，1：复制警告时继续复制后续文件 2：复制警告时停止整个复制
      	
		//提供给外部的多文件copy接口
		function copyDocs(treeNodes,parentNode,vid)	//多文件移动函数
		{
			console.log("copyDocs treeNodes:", treeNodes);
			if(treeNodes.length <= 0)
			{
				showErrorMessage("请选择需要复制的文件!");
				return;
			}
			
			//get the parentInfo
		  	var parentPath = "";
		  	var parentId = 0;
		  	var level = 0;
			if(parentNode && parentNode != null)
			{
				parentPath = parentNode.path + parentNode.name+"/";
				parentId=parentNode.id;
				level = parentNode.level+1;
			}
			else
			{
				parentNode=null;
			}

			console.log("copyDocs parentNode:", parentNode);

			if(isCopping == true)
			{
				DocCopyAppend(treeNodes, parentNode, parentPath, parentId, level, vid);
			}
			else
			{
				DocCopyInit(treeNodes, parentNode, parentPath, parentId, level, vid);
				copyDoc();
			}			
		}
		
      	//初始化DocCopy
      	function DocCopyInit(treeNodes,parentNode,parentPath,parentId,level,vid)	//多文件移动函数
		{
			console.log("DocCopyInit()");
			var fileNum = treeNodes.length;
			console.log("DocCopyInit() fileNum:" + fileNum);				

			//Build CopyBatch
			var copyBatch = {};
			copyBatch.treeNodes = treeNodes;
			copyBatch.parentNode = parentNode;
			copyBatch.parentPath = parentNode.path;
			copyBatch.parentId = parentId;
			copyBatch.level = level;
			copyBatch.vid = vid;
			copyBatch.num = fileNum;
			copyBatch.index = 0;
			copyBatch.state = 0;
			
			//add to copyContent
			copyContent.copyBatchList = [];
			copyContent.copyBatchList.push(copyBatch);			
			copyContent.batchNum = 1;
	        copyContent.totalFileNum = fileNum;
			totalNum = copyContent.totalFileNum;
			
			//Init copyContent state
			copyContent.initedFileNum = 0;
			copyContent.batchIndex = 0;
			copyContent.state = 1;
			console.log("DocCopyInit copyContent:", copyContent);
	        
			
			isCopping = true;
			
			//清空上下文列表
			SubContextList = [];
			FailList = [];
			
			//Set the Index
			index = 0;
			
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(copyContent, SubContextList, 1000);
			console.log("文件总的个数为："+totalNum);
      	}
      	
      	//增加复制文件
      	function DocCopyAppend(treeNodes, parentNode, parentPath, parentId, level, vid)	//多文件移动函数
		{
			console.log("DocCopyAppend()");
			if(!treeNodes)
			{
				console.log("DocCopyAppend() treeNodes is null");
				return;
			}

			var fileNum = treeNodes.length;
			console.log("DocCopyAppend() fileNum:" + fileNum);

			//Build CopyBatch
			var copyBatch = {};
			copyBatch.treeNodes = treeNodes;
			copyBatch.parentNode = parentNode;
			copyBatch.parentPath = parentNode.path;
			copyBatch.parentId = parentId;
			copyBatch.level = level;
			copyBatch.vid = vid;
			copyBatch.num = fileNum;
			copyBatch.index = 0;
			copyBatch.state = 0;

			//Append to copyContent
			copyContent.batchList.push(copyBatch);
			copyContent.batchNum++;
			copyContent.totalFileNum += fileNum;
			totalNum = copyContent.totalFileNum;
			
			console.log("DocCopyAppend() Content:", Content);
			
			if(copyContent.state == 2)	//copyBatch already initiated, need to restart it
			{
				copyContent.batchIndex++;
				copyContent.state = 1;
				buildSubContextList(copyContent, SubContextList, 1000);
			}
			
			console.log("文件总的个数为："+copyContent.totalFileNum);
		}
      	
      	//并将需要复制的文件加入到SubContextList中
		function buildSubContextList(copyContent, SubContextList, maxInitNum)
		{
			if(copyContent.state == 2)
			{
				return;
			}
			
      		console.log("buildSubContextList() maxInitNum:" + maxInitNum);
			
      		var curBatchIndex = copyContent.batchIndex;
      		var copyBatch = copyContent.copyBatchList[curBatchIndex];
      		console.log("buildSubContextList() copyContent curBatchIndex:" + curBatchIndex + " num:" + copyContent.batchNum );
    		
      		var treeNodes = copyBatch.treeNodes;
      		var parentPath = copyBatch.parentPath;
      		var level = copyBatch.level;
      		var parentId = copyBatch.parentId;
      		var vid = copyBatch.vid;
      		var index = copyBatch.index;
      		var fileNum =  copyBatch.num;
      		console.log("buildSubContextList() copyBatch index:" + index + " fileNum:" + fileNum );
      		
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
 				
 				copyBatch.index++;
 				copyContent.initedFileNum++;
 				
    			var treeNode = treeNodes[i];
    	   		if(treeNode && treeNode != null)
    	   		{
    	   		   	var SubContext ={};
    	   		   	//Doc Info
    	   		   	SubContext.treeNode = treeNode;
        			SubContext.vid = vid;
    	   		   	SubContext.docId = treeNode.id;  
    	   		   	SubContext.parentId = treeNode.pid;
		    		SubContext.parentPath = treeNode.path;
		    		SubContext.name = treeNode.name;
    	   		   	SubContext.level = treeNode.level;		
    	   		   	SubContext.type = treeNode.isParent == true? 2: 1;	
		    	   	SubContext.size = treeNode.size;
    	   		   	SubContext.lastestEditTime = treeNode.latestEditTime;
			    	
    	   		   	//dst ParentNode Info
    	   		   	SubContext.dstParentNode = parentNode;
    	   		   	SubContext.dstParentPath = parentPath;
    	   		   	SubContext.dstParentId = parentId;
    	   		   	SubContext.dstLevel = level;

			    	//Status Info
		    		SubContext.index = i;
		    	   	SubContext.state = 0;	//未开始复制
		    	   	SubContext.status = "待复制";	//未开始复制
		    	   			      								    	   	
		    	   	//Push the SubContext
		    	   	SubContextList.push(SubContext);
    	   		}
	    	}
    		
    		copyBatch.state = 2;
    		copyContent.batchIndex++;
    		if(copyContent.batchIndex == copyContent.batchNum)
    		{
    			copyContent.state = 2;
    			console.log("buildSubContextList() all copyBatch Inited");
    		}
	   	}
		
		//copyDoc接口，该接口是个递归调用
		function copyDoc()
		{
    		//copy files 没有全部加入到SubContextList
    		if(copyContent.state != 2)
    		{
				buildSubContextList(copyContent,SubContextList,1000);
    		}
    		
			//判断是否取消复制
    		if(stopCopyFlag == true)
    		{
    			console.log("copyDoc(): 结束复制");
    			copyEndHandler();
    			return;
    		}
    		
			
    		console.log("copyDoc() index:" + index + " totalNum:" + totalNum);
    		var SubContext = SubContextList[index];

			if(SubContext.docId == parentId)
			{
				console.log("treeNode is same to parentNode","treeNode",SubContext.docId,"parentId",parentId);
				copyErrorConfirm(SubContext.name);
				return;
			}			
			
			if(isNodeExist(SubContext.name, SubContex.parentNode) == true)
			{
			  	//Node Name conflict confirm
				CopyConflictConfirm(SubContext.name);
			  	return;
			}
			
			$.ajax({
	            url : "/DocSystem/Doc/copyDoc.do",
	            type : "post",
	            dataType : "json",
	            data : {
	                docId : SubContext.docId,	//待复制的docid
	                srcPid: SubContext.pid,
	                srcPath: SubContext.path,
	                srcName: SubContext.name,
	                dstPid: SubContext.dstParentId,	//目标doc parentId
	                dstPath: SubContext.dstParentPath,
	                dstName: SubContext.dstName, //目标docName
	                vid: SubContext.vid,			//仓库id
	            },
	            success : function (ret) {
	                if( "ok" == ret.status ){
	                	console.log("copyDoc() ok:",ret.data);
	                 	
	                	//后台复制成功，根据后台返回的docid,新建一个treeNode
	                	addTreeNode(ret.data,parentNode);	          			
	          			
	          			//复制下一个Doc
	                    copyNextDoc();
	                }
	                else
	                {
	                	console.log("Error:" + ret.msgInfo);
	                	copyErrorConfirm(SubContext.name,ret.msgInfo);
	                	return;
	                }
	            },
	            error : function () {
	            	console.log("服务器异常：copy failed");
                	copyErrorConfirm(SubContext.name,"服务器异常");
                	return;
	            }
	    	});
		}
		
		//启动复制下一个Doc,如果没有了的话则结束复制
		function copyNextDoc()
		{
           	//确定是否还有需要复制的文件
           	index++;
           	if(index < totalNum)	//callback没传入，表示单个复制
           	{
   				//Start to copy next Doc
	      		copyDoc();	//do copy Next Doc	                   	
	      	}
           	else	//更新显示数据
           	{	
           		copyEndHandler();
        	    bootstrapQ.msg({
						msg : '复制完成！',
						type : 'success',
						time : 2000,
    	        });
            }
		}
		
      	//uploadEndHandler
      	function copyEndHandler()
      	{
      		console.log("uploadEndHandler() 复制结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
  			//清除标记
            isCopping = false;
            
      		//显示上传完成 
      		showCopyEndInfo();      		
      	}
		
  		function showCopyEndInfo()
  		{
  			var copyEndInfo = "上传完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			copyEndInfo = "上传完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
      		}

            // 普通消息提示条
			bootstrapQ.msg({
					msg : copyEndInfo,
					type : 'success',
					time : 2000,
				    }); 
        }
      	
		function CopyConflictConfirm(copiedNodeName)
		{
		    qiao.bs.dialog({
		        id: "dialog-copyConflictDialog",
		        url: '#copyConflictConfirmDialog',
		        title: copiedNodeName + '已存在',
    	        //close: false,		
		        okbtn: "确定",
    	        qubtn: "取消",
		        callback: function () {
		            setTimeout(function () {
		                $("#dialog-copyConflictDialog input[name='newDocName']").val("Copy of " + copiedNodeName);
		            },100);
		        }
		    },function () {
		    	//确定按键
		    	var dstName =  $("#dialog-copyConflictDialog input[name='newDocName']").val();
		    	console.log("copyConflictConfirm newName:",dstName);
				copyDoc(dstName);
		    	return true;   
		    });
		}
		
      	function copyErrorConfirm(FileName,errMsg)
      	{
      		var msg = FileName + "复制失败,是否继续复制其他文件？";
      		if(errMsg != undefined)
      		{
      			msg = FileName + "复制失败(" + errMsg + "),是否继续复制其他文件？";
      		}
      		//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: "copyErrorConfirm",
    	        msg: msg,
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束",
    	    },function () {
    	    	//alert("点击了确定");
    	    	copyNextDoc();
    	    	return true;
			},function(){
    	    	//alert("点击了取消");
    	    	isCopping = false;
    	        syncUpMenu();	//刷新菜单
    	    	return true;
      		});
      	}
		
		//开放给外部的调用接口
        return {
			copyDocs: function(treeNodes,parentNode,vid){
            	copyDocs(treeNodes,parentNode,vid);
            },
        };
    })();
    