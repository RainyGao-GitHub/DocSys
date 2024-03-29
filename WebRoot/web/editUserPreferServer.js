function editUserPreferServerPageInit(_serverInfo, _callback)
{
	console.log("editUserPreferServerPageInit(): _serverInfo", _serverInfo);
	
	EditUserPreferServer.init(_serverInfo, _callback);
}

function doSelectServerType()
{		
	var serverType = $("#dialog-editUserPreferServer select[name='serverType']").val();
	console.log("doSelectServerType serverType:", serverType);
	//选择ftp时显示字符集和被动模式
	if(serverType == "ftp")
	{
		$("#dialog-editUserPreferServer select[name='charset']").parent().parent().show();
		$("#dialog-editUserPreferServer select[name='passiveMode']").parent().parent().show();
	}
	else
	{
		$("#dialog-editUserPreferServer select[name='charset']").parent().parent().hide();
		$("#dialog-editUserPreferServer select[name='passiveMode']").parent().parent().hide();
	}
}

function closeEditUserPreferServerDialog()
{
	closeBootstrapDialog("editUserPreferServer");
}

function doEditUserPreferServer()
{
	EditUserPreferServer.doEditUserPreferServer();
}

function cancelEditUserPreferServer()
{
	closeEditUserPreferServerDialog();
}

var EditUserPreferServer = (function () {
	var callback;
	var serverInfo;

	function init(_serverInfo, _callback)
	{
		console.log("EditUserPreferServer.init() _serverInfo:", _serverInfo);
		if(_serverInfo)
		{
			serverInfo = _serverInfo;
			var serverType = serverInfo.serverType;
			var serverUrl = serverInfo.serverUrl;
			var serverName = serverInfo.serverName;
			var userName = serverInfo.serverUserName;
			var pwd = serverInfo.serverUserPwd;
			var charset = serverInfo.charset;
			var passiveMode = serverInfo.passiveMode;
			
			//set the serverInf
			if(serverType)
			{
				$("#dialog-editUserPreferServer select[name='serverType'] option[value='" + serverType + "']").attr("selected","selected");
			}
			else
			{
				
				$("#dialog-editUserPreferServer select[name='serverType'] option[value='mxsdoc']").attr("selected","selected");
			}
			
			if(serverUrl)
			{
				$("#dialog-editUserPreferServer input[name='serverUrl']").val(serverUrl);
			}
			if(serverName)
			{
				$("#dialog-editUserPreferServer input[name='serverName']").val(serverName);
			}
			if(userName)
			{
				$("#dialog-editUserPreferServer input[name='userName']").val(userName);
			}
			if(pwd)
			{
				$("#dialog-editUserPreferServer input[name='pwd']").val(pwd);
			}
			if(charset)
			{
				$("#dialog-editUserPreferServer select[name='charset'] option[value='" + charset + "']").attr("selected","selected");
			}
			else
			{
				$("#dialog-editUserPreferServer select[name='charset'] option[value='utf-8']").attr("selected","selected");				
			}
			if(passiveMode)
			{
				$("#dialog-editUserPreferServer select[name='passiveMode'] option[value='" + passiveMode + "']").attr("selected","selected");
			}
			else
			{
				$("#dialog-editUserPreferServer select[name='passiveMode'] option[value='0']").attr("selected","selected");
			}
			
			doSelectServerType();
							
		}			
		
		callback = _callback;
					
	}
	
	function doEditUserPreferServer()
	{
		var isChanged = false;
		var serverType;
		var serverUrl;
		var serverName;
		var userName;
		var pwd;
		var params;
		var charset;
		var passiveMode; 
		
		var tmpServerType = $("#dialog-editUserPreferServer select[name='serverType']").val();
		if(!(serverInfo.serverType && tmpServerType === serverInfo.serverType))
		{				
			isChanged = true;
			serverType = tmpServerType;
			console.log("doEditUserPreferServer serverType changed:", serverType);
		}
		
		var tmpServerUrl = $("#dialog-editUserPreferServer input[name='serverUrl']").val();
		if(!(serverInfo.serverUrl && tmpServerUrl === serverInfo.serverUrl))
		{				
			isChanged = true;
			serverUrl = tmpServerUrl;
			console.log("doEditUserPreferServer serverUrl changed:", serverUrl);
		}
			
		var tmpServerName = $("#dialog-editUserPreferServer input[name='serverName']").val();
		if(!(serverInfo.serverName && tmpServerName === serverInfo.serverName))
		{
			isChanged = true;
			serverName = tmpServerName;
			console.log("doEditUserPreferServer serverName changed:", serverName);
		}
		
		var tmpUserName = $("#dialog-editUserPreferServer input[name='userName']").val();
		if(!(serverInfo.serverUserName && tmpUserName === serverInfo.serverUserName))
		{
			isChanged = true;
			userName = tmpUserName;
			console.log("doEditUserPreferServer serverUserName changed:", userName);
		}
		
		var tmpPwd = $("#dialog-editUserPreferServer input[name='pwd']").val();
	    if(!(serverInfo.serverUserPwd && tmpPwd === serverInfo.serverUserPwd))
	    {
	    	isChanged = true;		    	
	    	pwd = base64_encode(tmpPwd);
			console.log("doEditUserPreferServer serverUserPwd changed:", pwd);
	    }	
	    
	    var tmpCharset = $("#dialog-editUserPreferServer select[name='charset']").val();
		if(!(serverInfo.charset && tmpCharset === serverInfo.charset))
		{				
			isChanged = true;
			charset = tmpCharset;
			console.log("doEditUserPreferServer charset changed:", charset);
		}
		
		var tmpPassiveMode = $("#dialog-editUserPreferServer select[name='passiveMode']").val();
		if(!(serverInfo.passiveMode && tmpPassiveMode === serverInfo.passiveMode))
		{				
			isChanged = true;
			passiveMode = tmpPassiveMode;
			console.log("doEditUserPreferServer passiveMode changed:", passiveMode);
		}

	    if(isChanged == true)
		{
		    switch(serverType)
		   	{
		    case "ftp":
		    	if(charset != "")
				{
					params += "charset=" + charset + ";";
				}
				if(passiveMode != "")
				{
					params += "isPassive=" + passiveMode + ";";
				}
		    	break;
		   	}
	    	
	  	  	editUserPreferServer(serverName, serverType, serverUrl, userName, pwd, params);
	      	return true;
		}
		else
		{
	    	alert(_Lang("服务器设置未改动") + "!");
	        return false;
	    }
	}
	
   	function editUserPreferServer(serverName, serverType, serverUrl, userName, pwd, params)
   	{
    	$.ajax({
             url : "/DocSystem/Bussiness/editUserPreferServer.do",
             type : "post",
             dataType : "json",
             data : {
            	serverId: serverInfo.id,
            	serverName: serverName,
            	serverType: serverType,
            	serverUrl: serverUrl,
	            userName: userName,
	            pwd: pwd,
	            params: params,
             },
             success : function (ret) {
            	console.log("editUserPreferServer ret:", ret);            		
             	if( "ok" == ret.status){             		
             		// 普通消息提示条
					bootstrapQ.msg({
								msg : _Lang("修改成功") + "!",
								type : 'success',
								time : 2000,
					});
             		
             		callback && callback();
                }
                else
                {
                	showErrorMessage({
                		id: "idAlertDialog",	
                		title: _Lang("提示"),
                		okbtn: _Lang("确定"),
                		msg: _Lang("修改失败", " : ", ret.msgInfo),
                	});
                }
            },
            error : function () {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("修改失败", " : ", "服务器异常"),
            	});
            }
        });
    }
   	
	//开放给外部的调用接口
    return {
		init: function(_serverInfo, _callback){
			init(_serverInfo, _callback);
		},
		doEditUserPreferServer: function(){
			doEditUserPreferServer();
        },
    };
})();
