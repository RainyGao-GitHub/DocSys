//type: 1: pull to repos for mxsdoc server 2:pull to file server
function pullDocPageInit(node)
{
	console.log("pullDocPageInit() node:", node);
	DocPull.init(node);  
}

function closePullDocDialog()
{
	closeBootstrapDialog("pullDoc");
}

function doPullDoc()
{
	DocPull.doPullDoc();
  	closePullDocDialog();	
}

function cancelPullDoc()
{
	closePullDocDialog();
}

function doSelectRecurciveConfirm()
{
	console.log("doSelectRecurciveConfirm() skip confirm");
	return;
	
	var recurciveEn = $("#dialog-pull-doc input[name='recurciveEn']").is(':checked')? 1: 0;
	if(recurciveEn == 1)
	{
		qiao.bs.confirm({
	        id: 'recurcivePullConfirm',
	        msg: '该操作将拉取目录下的所有文件，是否允许？',
	    },function(){
	    	//确认
	    	$("#dialog-pull-doc input[name='recurciveEn']").attr("checked","checked");
	    },function(){
			//取消
	    	$("#dialog-pull-doc input[name='recurciveEn']").attr("checked",false);			
	    });
	}
}


function doSelectForceConfirm()
{
	var forceEn = $("#dialog-pull-doc input[name='forceEn']").is(':checked')? 1: 0;
	if(forceEn == 1)
	{
		qiao.bs.confirm({
	        id: 'forcePullConfirm',
	        msg: '文件改动将被强制覆盖，是否强制拉取？',
	    },function(){
	    	//确认
	    	$("#dialog-pull-doc input[name='forceEn']").attr("checked","checked");
	    },function(){
			//取消
	    	$("#dialog-pull-doc input[name='forceEn']").attr("checked",false);			
	    });
	}
}

function addUserPreferServer()
{
	showAddUserPreferServerPanel();
}

function editUserPreferServer()
{
	DocPull.showEditUserPreferServerPanel();
}

function deleteUserPreferServer()
{
	console.log("deleteUserPreferServer()");		   	
   	DocPull.deleteUserPreferServerConfirm();
}

function showAddUserPreferServerPanel()
{
	console.log("showAddUserPreferServerPanel");
	bootstrapQ.dialog({
		id: 'addUserPreferServer',
		url: 'addUserPreferServer.html',
		title: '添加常用服务器',
		msg: '页面正在加载，请稍等...',
		foot: false,
		big: false,
		callback: function(){
			addUserPreferServerPageInit(DocPull.initTaregetServerList);
		},
	});
}

var DocPull = (function () {
	var _node;
	var _reposId;
	var _localServer = {};
	var _targetServerList = [];
	
	var _pullEntryPath = "";
	
	//Selected ServerInfo
	var curServerIndex = 0;
	var _selectedServer;
	var targetServerId;
	var targetServerUrl = "";
	var userName = "";
	var pwd = "";
	//For mxsdoc server
	var remoteAuthCode = "";
	var targetStorageType = 1;	//1:仓库 2:磁盘
	var targetStorage = {};	//reposList and diskList
	var targetReposId = "";
	var targetDiskPath = "";
	var targetPath = "";
	
	function init(node)
	{
		console.log("DocPull.init() node:", node);

		_node = node;
		_reposId = node.vid;

		//set _pullEntryPath
		_pullEntryPath = _node.path + "/" + _node.name
        $("#dialog-pull-doc input[name='pullEntryPath']").val(_pullEntryPath);
		if(_node.type == 2)
		{
			$("#dialog-pull-doc span[name='recurciveEnSpan']").show();				
		}
		
		//set targetPath
		targetPath = _node.path;
        $("#dialog-pull-doc input[name='targetPath']").val(targetPath);
		
		//初始化serverList
		initTaregetServerList();
	}
	
	function showEditUserPreferServerPanel()
	{
		console.log("showEditUserPreferServerPanel");
		if(_selectedServer.isLocal)
		{
			showErrorMessage("无法修改本地服务器！");
			return;
		}
		
		bootstrapQ.dialog({
			id: 'editUserPreferServer',
			url: 'editUserPreferServer.html',
			title: '设置常用服务器',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: false,
			callback: function(){
				editUserPreferServerPageInit(_selectedServer, DocPull.initTaregetServerList);
			},
		});
	}
	
	function deleteUserPreferServerConfirm()
	{
		console.log("deleteUserPreferServerConfirm()");
		
		if(_selectedServer.isLocal)
		{			
			showErrorMessage("无法删除本地服务器！");
			return;
		}
		
		var showName = _selectedServer.serverUrl;
		if(_selectedServer.serverName)
		{		
			showName = _selectedServer.serverName;
		}
		bootstrapQ.confirm(
				{
					id: "deleteTargetServerConfirm",
					title: "删除确认",
					msg : "是否删除 " + showName,
				},
				function () {
			    	//alert("点击了确定");
					DocPull.deleteUserPreferServer(_selectedServer.id);
			    	return true;   
			 	});
	}
	
	function deleteUserPreferServer(serverId) 
	{
	   	console.log("deleteUserPreferServer() serverId:" + serverId);		   	
	   	$.ajax({
           	url : "/DocSystem/Bussiness/deleteUserPreferServer.do",
            type : "post",
            dataType : "json",
            data : {
            	serverId: serverId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
             		// 普通消息提示条
					bootstrapQ.msg({
								msg : "删除成功！",
								type : 'success',
								time : 2000,
					});
                	initTaregetServerList();
                }
                else
                {
                	console.log("删除常用服务器失败:" + ret.msgInfo);
                }
            },
            error : function () {
                  console.log('删除常用服务器失败：服务器异常！');
            }
	    });
	}
	
	function initTaregetServerList()
	{	
		_targetServerList = [];
		
		//Build Local ServerUrl
		var protocol = window.location.protocol + '//';
		var host = window.location.host; //域名带端口  
		var serverUrl = protocol + host;
		_localServer.serverUrl = serverUrl;
		_localServer.serverType = "mxsdoc";
		_localServer.serverName = "本地服务器";	
		_localServer.isLocal = true;				
		_targetServerList.push(_localServer);
		
		//设置当前选择的serverInfo
		curServerIndex = 0;
		_selectedServer = _localServer;
	   	
		//获取用户自定义服务器列表
		getUserPreferServerList(showTargetServerSelectList);
	}
	
	function getUserPreferServerList(callback)
	{
	   	console.log("getUserPreferServerList()");		   	
	    $.ajax({
	               	url : "/DocSystem/Bussiness/getUserPreferServerList.do",
	                type : "post",
	                dataType : "json",
	                data : {},
	                success : function (ret) {
	                    if( "ok" == ret.status ){
	                    	var list = ret.data;
	                    	if(list)
	                    	{
		                    	for(var i=0; i<list.length; i++)
		                    	{
		                    		//filter out not mxsdoc servers
		                    		var server = list[i];
		                    		if(server.serverType == undefined)
		                    		{
		                    			server.serverType = "mxsdoc";
		                    		}
		                    		_targetServerList.push(server);
		                    	}
	                    	}
	                    	callback && callback();
	                    }
	                    else
	                    {
	                    	console.log("获取常用服务器列表失败:" + ret.msgInfo);
	                    	callback && callback();
	                    }
	                },
	                error : function () {
                       console.log('获取常用服务器列表失败：服务器异常！');
                       callback && callback();
	                }
	    });
	}
	
	function showTargetServerSelectList()
	{
	   	console.log("showTargetServerSelectList()");
	   	var data = _targetServerList;
	   	
		console.log(data);
		if(data.length > 0){
			var c = $("#dialog-pull-doc select[name='targetServer']").children();
			$(c).remove();
						
			var selectListHtml = "";
			for(var i=0;i<data.length;i++){
				var d = data[i];
				var serverType = getFormatedServerType(d.serverType);
				var showName = serverType + " | " + d.serverUrl;
				if(d.serverName)
				{
					showName = serverType + " | "+ d.serverName;
				}
				selectListHtml += "<option value=" + i + ">" + showName + "</option>";
			}
			$("#dialog-pull-doc select[name='targetServer']").append(selectListHtml);
		}
		
		//get AuthCode For Selected Server
		getRemoteAuthCode();
	}
	
	function getFormatedServerType(serverType)
	{
		if(serverType === undefined) return "MXSDOC";
		switch(serverType)
		{
		case "mxsdoc":
			return "MXSDOC";
		case "ftp":
			return "FTP";
		case "sftp":
			return "SFTP";
		case "smb":
			return "SMB";
		case "svn":
			return "SVN";
		case "git":
			return "GIT";
		}
		return serverType;
	}
	
	function doSelectTargetSever() {
	   	console.log("doSelectTargetSever()");
		curServerIndex = $("#dialog-pull-doc select[name='targetServer']").val();
	   	console.log("doSelectTargetSever() curServerIndex:" + curServerIndex);

	   	_selectedServer = _targetServerList[curServerIndex];
		console.log("doSelectTargetSever() _selectedServer:", _selectedServer);
	   	if(_selectedServer.serverType == "mxsdoc")
	   	{
	   		//显示存储选择区域
	   		$("#dialog-pull-doc div[name='targetStorageDiv']").show();
		   	
	   		//设置targetStorageType
	   		$("#dialog-pull-doc select[name='targetStorageType']")[0].selectIndex = 0; //选择存储类型：仓库
			$("#dialog-pull-doc select[name='targetRepos']").show();
			$("#dialog-pull-doc select[name='targetDiskPath']").hide();
	   		
	   		//先清除仓库选择列表和磁盘选择列表  	
			cleanReposSelectList();
			cleanDiskPathSelectList();
			
			//获取authCode以及仓库和磁盘列表
			getRemoteAuthCode();				
	   	}
	   	else
	   	{
	   		//隐藏存储选择区域
	   		$("#dialog-pull-doc div[name='targetStorageDiv']").hide();		   		
	   	}
	}

	function doSelectTargetStorageType() {
	   	console.log("doSelectTargetStorageType()");
		targetStorageType = $("#dialog-pull-doc select[name='targetStorageType']").val();
	   	console.log("doSelectTargetStorageType() targetStorageType:" + targetStorageType);
		
	   	if(targetStorageType == 1)
	   	{
			$("#dialog-pull-doc select[name='targetRepos']").show();
			$("#dialog-pull-doc select[name='targetDiskPath']").hide();
	   	}
	   	else
	   	{
			$("#dialog-pull-doc select[name='targetRepos']").hide();
			$("#dialog-pull-doc select[name='targetDiskPath']").show();
	   	}
		
	   	getRemoteAuthCode()
	}
	
	function getRemoteAuthCode()
	{
	   	console.log("getRemoteAuthCode() _selectedServer:", _selectedServer);		   	
	   	
	   	targetServerId = _selectedServer.id;
	   	targetServerUrl = _selectedServer.serverUrl;
	   	userName = _selectedServer.serverUserName;
	   	pwd = _selectedServer.serverPwd;		
	   	
	   	var serverUrl = targetServerUrl;
	   	if(_selectedServer.isLocal)
	    {
	    	serverUrl = undefined;
	    }
	   	
	    $.ajax({
	               	url : "/DocSystem/Bussiness/getAuthCode.do",
	                type : "post",
	                dataType : "json",
	                data : {
	                	serverId: targetServerId,
	                	serverUrl: serverUrl,
	                	userName: userName,
	                	pwd: pwd,
	                	type: targetStorageType
	                },
	                success : function (ret) {
	                    if( "ok" == ret.status ){
	                    	remoteAuthCode = ret.data;
	                    	if(targetStorageType == 1)
	                    	{
	                    		targetStorage.reposList = ret.dataEx;
	                    		showReposSelectList(targetStorage.reposList);
	                    	}
	                    	else
	                    	{
	                    		targetStorage.diskList = ret.dataEx;
	            				showDiskPathSelectList(targetStorage.diskList);           		  
	                    	}
	                    }
	                    else
	                    {
	                 		//showErrorMessage("连接服务器失败:" + ret.msgInfo);
	                    }
	                },
	                error : function () {
	                   //showErrorMessage('连接服务器失败：服务器异常！');
	                }
	    });
	}
	
	function showReposSelectList(data)
	{
	   	console.log("showReposSelectList()");		   	
		console.log(data);
		if(data.length > 0){
			var c = $("#dialog-pull-doc select[name='targetRepos']").children();
			$(c).remove();
						
			var selectListHtml = "";
			for(var i=0;i<data.length;i++){
				var d = data[i];
				selectListHtml += "<option value=" +d.id + ">" + d.name + "</option>";
			}
			$("#dialog-pull-doc select[name='targetRepos']").append(selectListHtml);
		}
	}
	
	function showDiskPathSelectList(data)
	{
	   	console.log("showDiskPathSelectList()");		   	
	 	console.log(data);
		if(data.length > 0){
			var c = $("#dialog-pull-doc select[name='targetDiskPath']").children();
			$(c).remove();
						
			var selectListHtml = "";
			for(var i=0;i<data.length;i++){
				var d = data[i];
				selectListHtml += "<option value=" + i + ">" + d.path + "</option>";
			}
			$("#dialog-pull-doc select[name='targetDiskPath']").append(selectListHtml);
		}
	}
	
	function cleanReposSelectList()
	{
	   	console.log("cleanReposSelectList()");		   	
		var c = $("#dialog-pull-doc select[name='targetRepos']").children();
		$(c).remove();
						
		var selectListHtml = "<option>暂无数据</option>";
		$("#dialog-pull-doc select[name='targetRepos']").append(selectListHtml);
	}
	
	function cleanDiskPathSelectList()
	{
	   	console.log("cleanDiskPathSelectList()");		   	
		var c = $("#dialog-pull-doc select[name='targetDiskPath']").children();
		$(c).remove();
						
		var selectListHtml = "<option>暂无数据</option>";
		$("#dialog-pull-doc select[name='targetDiskPath']").append(selectListHtml);
	}
	
	function doPullDoc()
	{
	   	targetServerUrl = _selectedServer.serverUrl;
	   	userName = _selectedServer.serverUserName;
	   	pwd = _selectedServer.serverPwd;	
	   	
	   	if(_selectedServer.serverType == "mxsdoc")
	   	{
	   		targetStorageType = $("#dialog-pull-doc select[name='targetStorageType']").val();
	   		if(targetStorageType == 1)
		    {
		    	targetReposId = $("#dialog-pull-doc select[name='targetRepos']").val();
		    	targetDiskPath = "";
		    }
		    else
		    {
		    	targetReposId = "";
		    	var diskIndex = $("#dialog-pull-doc select[name='targetDiskPath']").val();	
		    	targetDiskPath = targetStorage.diskList[diskIndex].path;
		    }
	   	}
	   	
	    targetPath = $("#dialog-pull-doc input[name='targetPath']").val();
	    _pullEntryPath = $("#dialog-pull-doc input[name='pullEntryPath']").val();
	    
	    if(targetServerUrl)
		{
	  	  	pullDoc();
	      	return true;
		}
		else
		{
	    	alert("服务器地址不能为空");
	        return false;
	    }
	}
	
   	function pullDoc()
   	{
   		var forceEn = $("#dialog-pull-doc input[name='forceEn']").is(':checked')? 1: 0;
   		var recurciveEn = $("#dialog-pull-doc input[name='recurciveEn']").is(':checked')? 1: 0;

    	$.ajax({
             url : "/DocSystem/Bussiness/pullDoc.do",
             type : "post",
             dataType : "json",
             data : {
                reposId : _reposId, 
                path: _pullEntryPath,
                name : "",
                serverId: targetServerId,
	            targetServerUrl: targetServerUrl,
				remoteAuthCode: remoteAuthCode,
             	targetReposId: targetReposId,
             	targetDiskPath: targetDiskPath,
             	//targetPath: targetPath,
             	//shareId: gShareId,
	            recurciveEn : recurciveEn,
	            forceEn : forceEn,
             },
             success : function (ret) {
            	console.log("pullDoc ret:", ret);            		
             	if( "ok" == ret.status){             		
             		// 普通消息提示条
             		showPullResultInfo(ret);     		
                }
                else
                {
                	showErrorMessage("拉取失败:" + ret.msgInfo);
                }
            },
            error : function () {
                showErrorMessage("拉取失败:服务器异常！");
            }
        });
    }
   	
   	function showPullResultInfo(ret)
   	{
   		var totalNum = ret.dataEx.totalCount;
   		var successNum = ret.dataEx.successCount;
		var pullResultInfo = "拉取成功(共" + totalNum +"个)";
  		if(successNum != totalNum)
  		{
  			pullResultInfo = "拉取完成 (共" + totalNum +"个)"+",成功 " + successNum + "个: " + ret.dataEx.msgInfo;
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
   	}
   	
   	var fileSelectorCallback =  function(node)
	{
		//update _pullEntryPath
		_node = node;
		_pullEntryPath = _node.path;
		if(_pullEntryPath == undefined || _pullEntryPath == "")
		{
			_pullEntryPath = "/";
		}
		if(node.name)
		{
			_pullEntryPath += _node.name;	
		}
        $("#dialog-pull-doc input[name='pullEntryPath']").val(_pullEntryPath);		
        
		if(_node.type == 2)
		{
			$("#dialog-pull-doc span[name='recurciveEnSpan']").show();				
		}
		else
		{
			$("#dialog-pull-doc span[name='recurciveEnSpan']").hide();								
		}
	}
	
   	function openFileSelector()
   	{
   		console.log("PullDoc openFileSelector");
   		
   		targetStorageType = $("#dialog-pull-doc select[name='targetStorageType']").val();
   		if(targetStorageType == 1)
	    {
	    	targetReposId = $("#dialog-pull-doc select[name='targetRepos']").val();
	    	targetDiskPath = "";
	    }
	    else
	    {
	    	targetReposId = "";
	    	var diskIndex = $("#dialog-pull-doc select[name='targetDiskPath']").val();	
	    	targetDiskPath = targetStorage.diskList[diskIndex].path;
	    }
   		
   		var config = {};
   		if(_selectedServer.isLocal)
   		{	
	   		if(targetStorageType == 1)
	   		{
		   		config.storageType = "repos";
	   			config.reposId = targetReposId;
	   		}
	   		else
	   		{
		   		config.storageType = "disk";
	   			config.localDiskPath = targetDiskPath;
	   		}
   		}
   		else
   		{
	   		config.storageType = "remoteServer";
   			config.serverId = targetServerId;
   			config.targetReposId = targetReposId;
     		config.targetDiskPath = targetDiskPath;
   		}
   		
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
			title: '文件选择',
			msg: '页面正在加载，请稍等...',
			foot: false,
			big: false,
			callback: function(){
				FileSelector.fileSelectorPageInit(config);	//fileSlector.html 页面加载完成，此时可以通过改函数传递参数了
			},
		});
	}
   	
   	
	//开放给外部的调用接口
    return {
		init: function(_type, _parentNode){
			init(_type, _parentNode);
		},
    	doPullDoc: function(){
    		doPullDoc();
        },
        deleteUserPreferServerConfirm: function()
        {
        	deleteUserPreferServerConfirm();
        },
        deleteUserPreferServer: function(serverId){
        	deleteUserPreferServer(serverId);
        },
        showEditUserPreferServerPanel: function(){
        	showEditUserPreferServerPanel();
        },
        initTaregetServerList: function() {
        	initTaregetServerList();
        },
        doSelectTargetSever: function(){
        	doSelectTargetSever();
        },
        doSelectTargetStorageType: function(){
        	doSelectTargetStorageType();            	
        },
        openFileSelector: function(){
        	openFileSelector();
        },
	};
})();

