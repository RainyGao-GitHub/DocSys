//type: 1: push to repos for mxsdoc server 2:push to file server
function pushDocPageInit(_node)
{
	console.log("pushDocPageInit() node:", _node);
	DocPush.init(_node);  
}

function closePushDocDialog()
{
	closeBootstrapDialog("pushDoc");
}

function doPushDoc()
{
	DocPush.doPushDoc();
  	closePushDocDialog();	
}

function cancelPushDoc()
{
	closePushDocDialog();
}

function doSelectRecurciveConfirm()
{
	console.log("doSelectRecurciveConfirm() skip confirm");
	return;
	
	var recurciveEn = $("#dialog-push-doc input[name='recurciveEn']").is(':checked')? 1: 0;
	if(recurciveEn == 1)
	{
		qiao.bs.confirm({
	        id: 'recurcivePushConfirm',
	        title: _Lang("确认操作"),
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
	        msg: _Lang('该操作将推送目录下的所有文件，是否允许？'),
		},function(){
	    	//确认
	    	$("#dialog-push-doc input[name='recurciveEn']").attr("checked","checked");
	    },function(){
			//取消
	    	$("#dialog-push-doc input[name='recurciveEn']").attr("checked",false);			
	    });
	}
}


function doSelectForceConfirm()
{
	var forceEn = $("#dialog-push-doc input[name='forceEn']").is(':checked')? 1: 0;
	if(forceEn == 1)
	{
		qiao.bs.confirm({
	        id: 'forcePushConfirm',
	        title: _Lang("确认操作"),
	        okbtn: _Lang("确认"),
	        qubtn: _Lang("取消"),
	        msg: _Lang('远程文件改动将被强制覆盖，是否强制推送？'),
	    },function(){
	    	//确认
	    	$("#dialog-push-doc input[name='forceEn']").attr("checked","checked");
	    },function(){
			//取消
	    	$("#dialog-push-doc input[name='forceEn']").attr("checked",false);			
	    });
	}
}

function addUserPreferServer()
{
	showAddUserPreferServerPanel();
}

function editUserPreferServer()
{
	DocPush.showEditUserPreferServerPanel();
}

function deleteUserPreferServer()
{
	console.log("deleteUserPreferServer()");		   	
   	DocPush.deleteUserPreferServerConfirm();
}

function showAddUserPreferServerPanel()
{
	console.log("showAddUserPreferServerPanel");
	bootstrapQ.dialog({
		id: 'addUserPreferServer',
		url: 'addUserPreferServer.html',
		title: _Lang('添加常用服务器'),
		msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: false,
		callback: function(){
			addUserPreferServerPageInit(DocPush.initTaregetServerList);
		},
	});
}

var DocPush = (function () {
	var node;
	
	var localServer = {};
	var targetServerList = [];
	
	var pushEntryPath = "";
	
	//Selected ServerInfo
	var curServerIndex = 0;
	var selectedServer;
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
	
	function init(_node)
	{
		console.log("DocPush.init() node:", _node);

		node = _node;

		//set pushEntryPath
		pushEntryPath = node.path + "/" + node.name
        $("#dialog-push-doc input[name='pushEntryPath']").val(pushEntryPath);
		if(node.type == 2)
		{
			$("#dialog-push-doc span[name='recurciveEnSpan']").show();				
		}
		
		//set targetPath
		targetPath = node.path;
        $("#dialog-push-doc input[name='targetPath']").val(targetPath);
		
		//初始化serverList
		initTaregetServerList();
	}
	
	function showEditUserPreferServerPanel()
	{
		console.log("showEditUserPreferServerPanel");
		if(selectedServer.isLocal)
		{
			showErrorMessage({
	    		id: "idAlertDialog",	
	    		title: _Lang("提示"),
	    		okbtn: _Lang("确定"),
	    		msg: _Lang("无法修改本地服务器！"),
	    	});
			return;
		}
		
		bootstrapQ.dialog({
			id: 'editUserPreferServer',
			url: 'editUserPreferServer' + langExt + '.html',
			title: _Lang('设置常用服务器'),
			msg: _Lang('页面正在加载，请稍等') + '...',
			foot: false,
			big: false,
			callback: function(){
				editUserPreferServerPageInit(selectedServer, DocPush.initTaregetServerList);
			},
		});
	}
	
	function deleteUserPreferServerConfirm()
	{
		console.log("deleteUserPreferServerConfirm()");
		
		if(selectedServer.isLocal)
		{			
			showErrorMessage({
	    		id: "idAlertDialog",	
	    		title: _Lang("提示"),
	    		okbtn: _Lang("确定"),
	    		msg: _Lang("无法删除本地服务器！"),
	    	});
			return;
		}
		
		var showName = selectedServer.serverUrl;
		if(selectedServer.serverName)
		{		
			showName = selectedServer.serverName;
		}
		bootstrapQ.confirm(
				{
					id: "deleteTargetServerConfirm",
					title: _Lang("删除确认"),
					msg : _Lang("是否删除") + " [" + showName + "]",
				},
				function () {
			    	//alert("点击了确定");
					DocPush.deleteUserPreferServer(selectedServer.id);
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
								msg : _Lang("删除成功") + "!",
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
		targetServerList = [];
		
		//Build Local ServerUrl
		var protocol = window.location.protocol + '//';
		var host = window.location.host; //域名带端口  
		var serverUrl = protocol + host;
		localServer.serverUrl = serverUrl;
		localServer.serverType = "mxsdoc";
		localServer.serverName = _Lang("本地服务器");	
		localServer.isLocal = true;				
		targetServerList.push(localServer);
		
		//设置当前选择的serverInfo
		curServerIndex = 0;
		selectedServer = localServer;
	   	
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
		                    		targetServerList.push(server);
		                    	}
	                    	}
	                    	callback && callback();
	                    }
	                    else
	                    {
	                    	console.log(_Lang("获取常用服务器列表失败", " : ", ret.msgInfo));
	                    	callback && callback();
	                    }
	                },
	                error : function () {
                       console.log('获取常用服务器列表失败', ' : ', '服务器异常');
                       callback && callback();
	                }
	    });
	}
	
	function showTargetServerSelectList()
	{
	   	console.log("showTargetServerSelectList()");
	   	var data = targetServerList;
	   	
		console.log(data);
		if(data.length > 0){
			var c = $("#dialog-push-doc select[name='targetServer']").children();
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
			$("#dialog-push-doc select[name='targetServer']").append(selectListHtml);
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
		curServerIndex = $("#dialog-push-doc select[name='targetServer']").val();
	   	console.log("doSelectTargetSever() curServerIndex:" + curServerIndex);

	   	selectedServer = targetServerList[curServerIndex];
		console.log("doSelectTargetSever() selectedServer:", selectedServer);
	   	if(selectedServer.serverType == "mxsdoc")
	   	{
	   		//显示存储选择区域
	   		$("#dialog-push-doc div[name='targetStorageDiv']").show();
		   	
	   		//设置targetStorageType
	   		$("#dialog-push-doc select[name='targetStorageType']")[0].selectIndex = 0; //选择存储类型：仓库
			$("#dialog-push-doc select[name='targetRepos']").show();
			$("#dialog-push-doc select[name='targetDiskPath']").hide();
	   		
	   		//先清除仓库选择列表和磁盘选择列表  	
			cleanReposSelectList();
			cleanDiskPathSelectList();
			
			//获取authCode以及仓库和磁盘列表
			getRemoteAuthCode();				
	   	}
	   	else
	   	{
	   		//隐藏存储选择区域
	   		$("#dialog-push-doc div[name='targetStorageDiv']").hide();		   		
	   	}
	}

	function doSelectTargetStorageType() {
	   	console.log("doSelectTargetStorageType()");
		targetStorageType = $("#dialog-push-doc select[name='targetStorageType']").val();
	   	console.log("doSelectTargetStorageType() targetStorageType:" + targetStorageType);
		
	   	if(targetStorageType == 1)
	   	{
			$("#dialog-push-doc select[name='targetRepos']").show();
			$("#dialog-push-doc select[name='targetDiskPath']").hide();
	   	}
	   	else
	   	{
			$("#dialog-push-doc select[name='targetRepos']").hide();
			$("#dialog-push-doc select[name='targetDiskPath']").show();
	   	}
		
	   	getRemoteAuthCode()
	}
	
	function getRemoteAuthCode()
	{
	   	console.log("getRemoteAuthCode() selectedServer:", selectedServer);		   	
	   	
	   	targetServerId = selectedServer.id;
	   	targetServerUrl = selectedServer.serverUrl;
	   	userName = selectedServer.serverUserName;
	   	pwd = selectedServer.serverPwd;		
	   	
	   	var serverUrl = targetServerUrl;
	   	if(selectedServer.isLocal)
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
			var c = $("#dialog-push-doc select[name='targetRepos']").children();
			$(c).remove();
						
			var selectListHtml = "";
			for(var i=0;i<data.length;i++){
				var d = data[i];
				selectListHtml += "<option value=" +d.id + ">" + d.name + "</option>";
			}
			$("#dialog-push-doc select[name='targetRepos']").append(selectListHtml);
		}
	}
	
	function showDiskPathSelectList(data)
	{
	   	console.log("showDiskPathSelectList()");		   	
	 	console.log(data);
		if(data.length > 0){
			var c = $("#dialog-push-doc select[name='targetDiskPath']").children();
			$(c).remove();
						
			var selectListHtml = "";
			for(var i=0;i<data.length;i++){
				var d = data[i];
				console.log("showDiskPathSelectList() path:[" +d.path + "]")
				selectListHtml += "<option value=" + i + ">" + d.path + "</option>";
			}
			$("#dialog-push-doc select[name='targetDiskPath']").append(selectListHtml);
		}
	}
	
	function cleanReposSelectList()
	{
	   	console.log("cleanReposSelectList()");		   	
		var c = $("#dialog-push-doc select[name='targetRepos']").children();
		$(c).remove();
						
		var selectListHtml = "<option>暂无数据</option>";
		$("#dialog-push-doc select[name='targetRepos']").append(selectListHtml);
	}
	
	function cleanDiskPathSelectList()
	{
	   	console.log("cleanDiskPathSelectList()");		   	
		var c = $("#dialog-push-doc select[name='targetDiskPath']").children();
		$(c).remove();
						
		var selectListHtml = "<option>暂无数据</option>";
		$("#dialog-push-doc select[name='targetDiskPath']").append(selectListHtml);
	}
	
	function doPushDoc()
	{
	   	targetServerUrl = selectedServer.serverUrl;
	   	userName = selectedServer.serverUserName;
	   	pwd = selectedServer.serverPwd;	
	   	
	   	if(selectedServer.serverType == "mxsdoc")
	   	{
	   		targetStorageType = $("#dialog-push-doc select[name='targetStorageType']").val();
	   		if(targetStorageType == 1)
		    {
		    	targetReposId = $("#dialog-push-doc select[name='targetRepos']").val();
		    	targetDiskPath = "";
		    }
		    else
		    {
		    	targetReposId = "";
		    	var diskIndex = $("#dialog-push-doc select[name='targetDiskPath']").val();	
		    	targetDiskPath = targetStorage.diskList[diskIndex].path;
		    }
	   		console.log("targetReposId:" + targetReposId + " targetDiskPath:[" + targetDiskPath + "]")
	   	}
	   	
	    targetPath = $("#dialog-push-doc input[name='targetPath']").val();
	    pushEntryPath = $("#dialog-push-doc input[name='pushEntryPath']").val();
	    
	    if(targetServerUrl)
		{
	  	  	pushDoc();
	      	return true;
		}
		else
		{
	    	alert("服务器地址不能为空");
	        return false;
	    }
	}
	
   	function pushDoc()
   	{
   		var forceEn = $("#dialog-push-doc input[name='forceEn']").is(':checked')? 1: 0;
   		var recurciveEn = $("#dialog-push-doc input[name='recurciveEn']").is(':checked')? 1: 0;

    	$.ajax({
             url : "/DocSystem/Bussiness/pushDoc.do",
             type : "post",
             dataType : "json",
             data : {
                reposId : node.vid, 
                path: pushEntryPath,
                name : "",
                serverId: targetServerId,
             	targetReposId: targetReposId,
             	targetDiskPath: targetDiskPath,
             	//targetPath: targetPath,
             	//shareId: gShareId,
	            recurciveEn : recurciveEn,
	            forceEn : forceEn,
             },
             success : function (ret) {
            	console.log("pushDoc ret:", ret);            		
             	if( "ok" == ret.status){             		
             		// 普通消息提示条
             		showPushResultInfo(ret);     		
                }
                else
                {
                	showErrorMessage(_Lang("推送失败", " : ", ret.msgInfo));
                }
            },
            error : function () {
                showErrorMessage(_Lang("推送失败", " : ", "服务器异常"));
            }
        });
    }
   	
   	function showPushResultInfo(ret)
   	{
   		var totalNum = ret.dataEx.totalCount;
   		var successNum = ret.dataEx.successCount;
		var pushResultInfo = "";
		switch(langType)
		{
		case "en":
			pushResultInfo = "Push Completed(Total : " + totalNum + ")";	
			break;
		default:
			pushResultInfo = "推送成功(共" + totalNum +"个)";
			break;
		}
  		if(successNum != totalNum)
  		{
  			switch(langType)
  			{
  			case "en":
  				pushResultInfo = "Push Completed(Total : " + totalNum + ", Failed : " + (totalNum - successNum) + ")";
  				break;
  			default:
  	  			pushResultInfo = "推送完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
  				break;
  			}
  			
            // 普通消息提示条
			bootstrapQ.msg({
					msg : pushResultInfo,
					type : 'warning',
					time : 2000,
				    }); 
  		}
  		else
  		{
            // 普通消息提示条
			bootstrapQ.msg({
					msg : pushResultInfo,
					type : 'success',
					time : 2000,
				    }); 
  		}
   	}
   	
	//开放给外部的调用接口
    return {
		init: function(_type, _parentNode){
			init(_type, _parentNode);
		},
    	doPushDoc: function(){
    		doPushDoc();
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
    };
})();
