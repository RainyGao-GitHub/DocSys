	//DocMove类	
    var DocMove = (function () {
        /*全局变量*/
        var reposId;
        var isMoving = false;	//文件移动中标记
        var stopFlag = false;	//结束移动
        var movedNum = 0; //已移动个数
        var successNum = 0;	//成功移动个数
		var failNum = 0; //移动失败个数
		
        /*Content 用于保存文件移动的初始信息*/
        var Content = {};
        Content.BatchList = [];
        Content.batchNum = 0;	//totalBatchNum
        Content.batchIndex = 0;	//curBatchIndex
        Content.state = 0;	//0: all Batch not inited 1: Batch Init is on going 2: Batch Init completed
        Content.initedFileNum = 0;
        Content.totalFileNum = 0; 
        
        /*moveDoc conditions 用于指示当前的移动文件及移动状态*/
        var index = 0; //当前操作的索引
        var totalNum = 0; 
 		var SubContextList = []; //文件移动上下文List，用于记录单个文件的移动情况，在开始移动的时候初始化
 		
		//提供给外部的多文件move接口
		function moveDocs(treeNodes, dstParentNode, vid)	//多文件移动函数
		{
			console.log("moveDocs reposId:" + vid + " treeNodes:", treeNodes);
			if(!treeNodes || treeNodes.length <= 0)
			{
				showErrorMessage("请选择需要移动的文件!");
				return;
			}
			
			//get the parentInfo
		  	var dstPath = "";
		  	var dstPid = 0;
		  	var dstLevel = -1;
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

			console.log("moveDocs dstParentNode:", dstParentNode);

			if(isMoving == true)
			{
				DocMoveAppend(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid);
			}
			else
			{
				DocMoveInit(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid);
				moveDoc();
			}			
		}
		
      	//初始化DocMove
      	function DocMoveInit(treeNodes,dstParentNode,dstPath,dstPid,dstLevel,vid)	//多文件移动函数
		{
			console.log("DocMoveInit()");
			var fileNum = treeNodes.length;
			console.log("DocMoveInit() fileNum:" + fileNum);				

	        movedNum = 0; //已移动个数
	        successNum = 0;	//成功移动个数
			failNum = 0; //移动失败个数
			
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
			console.log("DocMoveInit Content:", Content);
	        
			
			isMoving = true;
			
			//清空上下文列表
			SubContextList = [];
			
			//Set the Index
			index = 0;
			
			//Build SubContextList(totalFileNum will also be caculated)
			buildSubContextList(Content, SubContextList, 1000);
			console.log("文件总的个数为："+totalNum);
      	}
      	
      	//增加移动文件
      	function DocMoveAppend(treeNodes, dstParentNode, dstPath, dstPid, dstLevel, vid)	//多文件移动函数
		{
			console.log("DocMoveAppend()");
			if(!treeNodes)
			{
				console.log("DocMoveAppend() treeNodes is null");
				return;
			}

			var fileNum = treeNodes.length;
			console.log("DocMoveAppend() fileNum:" + fileNum);

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

			//Append to Content
			Content.batchList.push(Batch);
			Content.batchNum++;
			Content.totalFileNum += fileNum;
			totalNum = Content.totalFileNum;
			
			console.log("DocMoveAppend() Content:", Content);
			
			if(Content.state == 2)	//Batch already initiated, need to restart it
			{
				Content.batchIndex++;
				Content.state = 1;
				buildSubContextList(Content, SubContextList, 1000);
			}
			
			console.log("文件总的个数为："+Content.totalFileNum);
		}
      	
      	//并将需要移动的文件加入到SubContextList中
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
			    	
    	   		   	//dst ParentNode Info
    	   		   	SubContext.dstParentNode = dstParentNode;
    	   		   	SubContext.dstPath = dstPath;
    	   		   	SubContext.dstPid = dstPid;
    	   		   	SubContext.dstLevel = dstLevel;
    	   		   	SubContext.dstName = treeNode.name;

			    	//Status Info
		    		SubContext.index = i;
		    	   	SubContext.state = 0;	//未开始移动
		    	   	SubContext.status = "待移动";	//未开始移动
		    	   			      								    	   	
		    	   	//Push the SubContext
		    	   	SubContextList.push(SubContext);
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
      	
		//moveDoc接口，该接口是个递归调用
    	function moveDoc()
    	{    		
    		//files 没有全部加入到SubContextList
    		if(Content.state != 2)
    		{
				buildSubContextList(Content,SubContextList,1000);
    		}
    		
			//判断是否取消移动
    		if(stopFlag == true)
    		{
    			console.log("moveDoc(): 结束移动");
    			moveEndHandler();
    			return;
    		}
    		
    		console.log("moveDoc() index:" + index + " totalNum:" + totalNum);
    		var SubContext = SubContextList[index];
    		
  	    	if(SubContext.pid == SubContext.dstPid)
  			{
  	    		moveNextDoc();
  	    		return; 
  			}
  	    	
			//执行后台moveDoc操作
    		$.ajax({
                url : "/DocSystem/Doc/moveDoc.do",
                type : "post",
                dataType : "json",
                data : {
                    reposId: SubContext.vid,
                	docId : SubContext.docId,
                	type: SubContext.type,
                	srcLevel: SubContext.level,
                	dstLevel: SubContext.dstLevel,
                    srcPid: SubContext.pid,
                    dstPid: SubContext.dstPid,
                    srcPath: SubContext.path,
                    srcName: SubContext.name,
                    dstPath: SubContext.dstPath,
                    dstName: SubContext.name,
		            shareId: gShareId,
                },
                success : function (ret) {
                   if( "ok" == ret.status )
                   {
                	    var doc = ret.data;
                	    
                	    //Add or Delete from zTree
                  	    addTreeNode(doc);
                  	    deleteTreeNodeById(SubContext.docId);
                	    
                	   	//Add or Delete from DocList
                	    DocList.addNode(doc);
                	    DocList.deleteNode(SubContext.docId);
                	    
                	    moveSuccessHandler(SubContext, ret.msgInfo);
                	   	return;
                   }
                   else	//后台报错，结束移动
                   {
                	   console.log("moveDoc Error:" + ret.msgInfo);
                       moveErrorConfirm(SubContext,ret.msgInfo);
                       return;
                   }
                },
                error : function () {	//后台异常
 	               console.log("服务器异常：文件[" + index + "]移动异常！");
            	   moveErrorConfirm(SubContext,"服务器异常");
            	   return;
                }
        	});
    	}

		function moveNextDoc()
		{
	        index++;	//move成功，则调用回调函
	        if(index < totalNum) //移动没结束，且回调函数存在则回调，否则表示结束
	        {
	        	console.log("moveDoc Next");
	        	moveDoc();
	        }
	        else	//移动结束，保存目录结构到后台
	        {
	        	moveEndHandler();
	        }
		}
		
      	function moveErrorConfirm(SubContext,errMsg)
      	{
      		var FileName = SubContext.name;
      		var msg = FileName + "移动失败,是否继续移动其他文件？";
      		if(errMsg != undefined)
      		{
      			msg = FileName + "移动失败(" + errMsg + "),是否继续移动其他文件？";
      		}
      		//弹出用户确认窗口
      		qiao.bs.confirm({
    	    	id: "moveErrorConfirm",
    	        msg: msg,
    	        close: false,		
    	        okbtn: "继续",
    	        qubtn: "结束",
    	    },function () {
    	    	moveErrorHandler(SubContext, errMsg);
    	    	return true;
			},function(){
    	    	//alert("点击了取消");
				moveErrorAbortHandler(SubContext, errMsg);
    	    	return true;
      		});
      	}
      	
      	//moveErrorHandler
      	function moveErrorHandler(SubContext,errMsg)
      	{
      		console.log("moveErrorHandler() "+ SubContext.name + " " + errMsg);
      		
      		failNum++;
      		
      		//设置移动状态
			SubContext.state = 3;	//移动结束
      		SubContext.status = "fail";
			SubContext.msgInfo = errMsg;
			moveNextDoc();		 	
      	}
      	
      	//moveErrorAbortHandler
      	function moveErrorAbortHandler(SubContext,errMsg)
      	{
      		console.log("moveErrorAbortHandler() "+ SubContext.name + " " + errMsg);
      	
      		failNum++;
      		
    		//设置移动状态
			SubContext.state = 3;	//移动结束
      		SubContext.status = "fail";
      		SubContext.msgInfo = errMsg;
      		moveEndHandler();
      	}
      	
      	//moveSuccessHandler
      	function moveSuccessHandler(SubContext,msgInfo)
      	{	
      		console.log("moveSuccessHandler() "+ SubContext.name + " " + msgInfo);
      		
      		successNum++;
	      	
	      	SubContext.state = 2;	//移动结束
      		SubContext.status = "success";
      		SubContext.msgInfo = msgInfo;
			moveNextDoc();
      	}
      	
      	//moveEndHandler
      	function moveEndHandler()
      	{
      		console.log("moveEndHandler() 移动结束，共"+ totalNum +"文件，成功"+successNum+"个，失败"+failNum+"个！");
			
      		//清除标记
  			isMoving = false;
  			
      		//显示移动完成 
      		showMoveEndInfo();
      	}
      	
  		function showMoveEndInfo()
  		{
  			var moveEndInfo = "移动完成(共" + totalNum +"个)";
      		if(successNum != totalNum)
      		{
      			moveEndInfo = "移动完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
      		    bootstrapQ.msg({
					msg : moveEndInfo,
					type : 'warning',
					time : 2000,
				    }); 
      		}
      		else
      		{
	            bootstrapQ.msg({
						msg : moveEndInfo,
						type : 'success',
						time : 2000,
					    }); 
      		}
  		}
		
		//开放给外部的调用接口
        return {
            moveDocs: function(treeNodes,dstParentNode,vid){
            	moveDocs(treeNodes,dstParentNode,vid);
            },
        };
    })();