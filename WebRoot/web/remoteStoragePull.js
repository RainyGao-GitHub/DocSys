var RemoteStoragePull = (function () {
	var _node;
	var _repos;
	
   	function remoteStoragePull()
   	{
   		var forceEn = $("#dialog-remoteStoragePull input[name='forceEn']").is(':checked')? 1: 0;
   		var deleteEn = $("#dialog-remoteStoragePull input[name='deleteEn']").is(':checked')? 1: 0;
   		var recurciveEn = $("#dialog-remoteStoragePull input[name='recurciveEn']").is(':checked')? 1: 0;
   		var pullEntryPath = $("#dialog-remoteStoragePull input[name='pullEntryPath']").val();
   		console.log("remoteStoragePull() pull entry:" + pullEntryPath);
   		
    	$.ajax({
             url : "/DocSystem/Bussiness/remoteStoragePull.do",
             type : "post",
             dataType : "json",
             data : {
                reposId : _repos.id, 
                path: pullEntryPath,
                name : "",
	            shareId: gShareId,
	            recurciveEn : recurciveEn,
	            forceEn : forceEn,
	            deleteEn : deleteEn,
             },
             success : function (ret) {
            	console.log("remoteStoragePull ret:", ret);            		
             	if( "ok" == ret.status){             		
             		// 普通消息提示条
             		showPullResultInfo(ret);     		
                }
                else
                {
                	showErrorMessage({
        	    		id: "idAlertDialog",	
        	    		title: _Lang("提示"),
        	    		okbtn: _Lang("确定"),
        	    		msg: _Lang("拉取失败", " : ", ret.msgInfo),
        	    	});
                }
            },
            error : function () {
            	showErrorMessage({
    	    		id: "idAlertDialog",	
    	    		title: _Lang("提示"),
    	    		okbtn: _Lang("确定"),
    	    		msg: _Lang("拉取失败", " : ", "服务器异常"),
    	    	});
            }
        });
    }
   	
   	function showPullResultInfo(ret)
   	{
   		var totalNum = ret.dataEx.totalCount;
   		var successNum = ret.dataEx.successCount;
		var pullResultInfo = "";
		switch(langType)
		{
		case "en":
			pullResultInfo = "Pull Completed(Total : " + totalNum + ")";	
			break;
		default:
			pullResultInfo = "拉取成功(共" + totalNum +"个)";
			break;
		}
		
  		if(successNum != totalNum)
  		{
  			switch(langType)
  			{
  			case "en":
  				pullResultInfo = "Pull Completed(Total : " + totalNum + ", Failed : " + (totalNum - successNum) + ")";
  				break;
  			default:
  				pullResultInfo = "拉取完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
  				break;
  			}
  			
            // 普通消息提示条
			bootstrapQ.msg({
					msg : pullResultInfo,
					type : 'warning',
					time : 2000,
				    }); 
  		}
  		else
  		{
            // 普通消息提示条
			bootstrapQ.msg({
					msg : pullResultInfo,
					type : 'success',
					time : 2000,
				    }); 
  		}
  		
  		//有文件拉取成功，那么刷新页面
  		if(successNum > 0)
  		{
	     	//2秒后刷新页面
	        setTimeout(function () 
	        {
		     	window.location.reload();			        	
            }, 100);
  		}
   	}
	
	var fileSelectorCallback =  function(node)
	{
		//update pullEntryPath
		var pullEntryPath = node.path;
		if(pullEntryPath == undefined || pullEntryPath == "")
		{
			pullEntryPath = "/";
		}
		if(node.name)
		{
			pullEntryPath += node.name;	
		}
        $("#dialog-remoteStoragePull input[name='pullEntryPath']").val(pullEntryPath);		
        
		if(node.type == 2)
		{
			$("#dialog-remoteStoragePull span[name='recurciveEnSpan']").show();				
		}
		else
		{
			$("#dialog-remoteStoragePull span[name='recurciveEnSpan']").hide();								
		}
	}
	
   	function openFileSelector()
   	{
   		console.log("RemoteStoragePull openFileSelector");
   		var config = {};
   		config.storageType = "repos";
   		config.reposId = _repos.id;
   		config.repos = _repos;
   		config.listType = 3; //3: LocalEntryAndRemoteStorage
   		config.doc = _node;
   		config.onSelect = fileSelectorCallback;   	   		
   		showFileSelectorInBootstrapDialog(config);
   	}
   		   	
	function showFileSelectorInBootstrapDialog(config)
	{
		console.log("showFileSelectorInBootstrapDialog config:", config);

		bootstrapQ.dialog({
			id: 'fileSelector',
			url: 'fileSelector.html',
			title: _Lang('文件选择'),
			msg: _Lang('页面正在加载，请稍等') + '...',
			foot: false,
			big: false,
			callback: function(){
				FileSelector.fileSelectorPageInit(config);	//fileSlector.html 页面加载完成，此时可以通过改函数传递参数了
			},
		});
	}
   	
	function remoteStoragePullPageInit(node, repos)
	{
		console.log("remoteStoragePullPageInit() node:", node, repos);

		_node = node;
		_repos = repos;
		
		var targetServer = getTargetServerDispInfo(repos);
		console.log("targetSever:" + targetServer);
        $("#dialog-remoteStoragePull input[name='targetServer']").val(targetServer);

		if(node.type == 2)
		{
			$("#dialog-remoteStoragePull span[name='recurciveEnSpan']").show();				
		}
					
		//set pullEntryPath
		var pullEntryPath = node.path;
		if(pullEntryPath == undefined || pullEntryPath == "")
		{
			pullEntryPath = "/";
		}
		if(node.name)
		{
			pullEntryPath += node.name;	
		}
        $("#dialog-remoteStoragePull input[name='pullEntryPath']").val(pullEntryPath);		
    }

	function closeRemoteStoragePullDialog()
	{
		closeBootstrapDialog("remoteStoragePull");
	}

	function doRemoteStoragePull()
	{
		remoteStoragePull();
      	closeRemoteStoragePullDialog();	
	}
	
	function cancelRemoteStoragePull()
	{
		closeRemoteStoragePullDialog();
	}
	
	function doSelectRecurciveConfirm()
	{
		var recurciveEn = $("#dialog-remoteStoragePull input[name='recurciveEn']").is(':checked')? 1: 0;
		if(recurciveEn == 1)
		{
			qiao.bs.confirm({
		        id: 'recurcivePullConfirm',
		        title: _Lang("确认操作"),
		        okbtn: _Lang("确认"),
		        qubtn: _Lang("取消"),		        
		        msg: _Lang('该操作将拉取目录下的所有文件，是否允许？'),
		    },function(){
		    	//确认
		    	$("#dialog-remoteStoragePull input[name='recurciveEn']").attr("checked","checked");
		    },function(){
				//取消
		    	$("#dialog-remoteStoragePull input[name='recurciveEn']").attr("checked",false);			
		    });
		}
	}
	
	
	function doSelectForceConfirm()
	{
		var forceEn = $("#dialog-remoteStoragePull input[name='forceEn']").is(':checked')? 1: 0;
		if(forceEn == 1)
		{
			qiao.bs.confirm({
		        id: 'forcePullConfirm',
		        title: _Lang("确认操作"),
		        okbtn: _Lang("确认"),
		        qubtn: _Lang("取消"),
		        msg: _Lang('文件改动将被强制覆盖，是否强制拉取？'),
		    },function(){
		    	//确认
		    	$("#dialog-remoteStoragePull input[name='forceEn']").attr("checked","checked");
		    },function(){
				//取消
		    	$("#dialog-remoteStoragePull input[name='forceEn']").attr("checked",false);			
		    });
		}
	}
	
	function doSelectDeleteConfirm()
	{
		var deleteEn = $("#dialog-remoteStoragePull input[name='deleteEn']").is(':checked')? 1: 0;
		if(deleteEn == 1)
		{
			qiao.bs.confirm({
		        id: 'deletePullConfirm',
		        title: _Lang("确认操作"),
		        okbtn: _Lang("确认"),
		        qubtn: _Lang("取消"),
		        msg: _Lang('文件可能被删除，是否允许删除？'),
		    },function(){
		    	//确认
		    	$("#dialog-remoteStoragePull input[name='deleteEn']").attr("checked","checked");
		    },function(){
				//取消
		    	$("#dialog-remoteStoragePull input[name='deleteEn']").attr("checked",false);			
		    });
		}
	}
   	
	//开放给外部的调用接口
    return {
        remoteStoragePullPageInit: function(node, repos){
        	remoteStoragePullPageInit(node, repos);
        },
        openFileSelector: function(){
        	openFileSelector();
        },                        
    	doRemoteStoragePull: function(){
    		doRemoteStoragePull();
        },
        cancelRemoteStoragePull: function(){
        	cancelRemoteStoragePull();
        },   
        doSelectRecurciveConfirm: function(){
        	doSelectRecurciveConfirm();
        },   
        doSelectForceConfirm: function(){
        	doSelectForceConfirm();
        }, 
        doSelectDeleteConfirm: function(){
        	doSelectDeleteConfirm();
        }, 
	};
})();
