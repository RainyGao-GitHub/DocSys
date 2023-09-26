
function addUserPreferServerPageInit(_callback, _serverInfo)
{
	console.log("addUserPreferServerPageInit(): _serverInfo", _serverInfo);
	
	AddUerPreferServer.init(_callback, _serverInfo);
}

function doSelectServerType()
{		
	var serverType = $("#dialog-addUserPreferServer select[name='serverType']").val();
	console.log("doSelectServerType serverType:", serverType);
	//选择ftp时显示字符集和被动模式
	if(serverType == "ftp")
	{
		$("#dialog-addUserPreferServer select[name='charset']").parent().parent().show();
		$("#dialog-addUserPreferServer select[name='passiveMode']").parent().parent().show();
	}
	else
	{
		$("#dialog-addUserPreferServer select[name='charset']").parent().parent().hide();
		$("#dialog-addUserPreferServer select[name='passiveMode']").parent().parent().hide();
	}
}

function closeAddUserPreferServerDialog()
{
	closeBootstrapDialog("addUserPreferServer");
}

function doAddUserPreferServer()
{
	AddUerPreferServer.doAddUserPreferServer();
}

function cancelAddUserPreferServer()
{
	closeAddUserPreferServerDialog();
}

var AddUerPreferServer = (function () {
	var callback;
	var serverInfo;
	var serverUrl;
	var serverName;
	var userName;
	var pwd;
	var params = "";

	function init(_callback, _serverInfo)
	{
		console.log("AddUerPreferServer.init() _serverInfo:", _serverInfo);
		serverInfo = _serverInfo;
		callback = _callback;						
	}
	
	function doAddUserPreferServer()
	{
		serverType = $("#dialog-addUserPreferServer select[name='serverType']").val();
		serverUrl = $("#dialog-addUserPreferServer input[name='serverUrl']").val();
		serverName = $("#dialog-addUserPreferServer input[name='serverName']").val();
		userName = $("#dialog-addUserPreferServer input[name='userName']").val();
	    pwd = base64_encode($("#dialog-addUserPreferServer input[name='pwd']").val());
		
	    switch(serverType)
	   	{
	    case "ftp":
	    	var charset = $("#dialog-addUserPreferServer select[name='charset']").val();
			var passiveMode = $("#dialog-addUserPreferServer select[name='passiveMode']").val();
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
	    
	    if(serverUrl)
		{
	  	  	addUserPreferServer(serverType, serverName, serverUrl, userName, pwd, params);
	      	return true;
		}
		else
		{
	    	alert("服务器地址不能为空");
	        return false;
	    }
	}
	
   	function addUserPreferServer(serverType, serverName, serverUrl, userName, pwd, params)
   	{
    	$.ajax({
             url : "/DocSystem/Bussiness/addUserPreferServer.do",
             type : "post",
             dataType : "json",
             data : {
				serverType: serverType,
            	serverName: serverName,
            	serverUrl: serverUrl,
	            userName: userName,
	            pwd: pwd,
	            params: params,
             },
             success : function (ret) {
            	console.log("addUserPreferServer ret:", ret);            		
             	if( "ok" == ret.status){             		
             		// 普通消息提示条
					bootstrapQ.msg({
								msg : "添加成功！",
								type : 'success',
								time : 2000,
					});
             		
             		callback && callback();
            		//closeAddUserPreferServerDialog();
                }
                else
                {
                	showErrorMessage("添加失败:" + ret.msgInfo);
                }
            },
            error : function () {
                showErrorMessage("添加失败:服务器异常！");
            }
        });
    }
   	
	//开放给外部的调用接口
    return {
		init: function(_serverInfo, _callback){
			init(_serverInfo, _callback);
		},
		doAddUserPreferServer: function(){
			doAddUserPreferServer();
        },
    };
})();

