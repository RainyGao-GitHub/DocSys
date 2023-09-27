var shareId = null;
var successCallback = null;
function DocSharePwdVerifyPageInit(id, callback)
{
	shareId = id;
	successCallback = callback;
}

function verifySharePwd()
{
	console.log("verifySharePwd() shareId:" + shareId);

	var sharePwd = $("#sharePwd").val();
	$.ajax({
        url : "/DocSystem/Doc/verifyDocSharePwd.do",
        type : "post",
        dataType : "json",
        data : {
        	shareId: shareId,
        	sharePwd: sharePwd,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	var docShare = ret.data;
            	gRootDoc.docId = docShare.docId;
            	gRootDoc.path = docShare.path;
            	gRootDoc.name = docShare.name;
            	gRootDoc.type = 2;          	
            	$("#projectName").text(gRootDoc.name);
    	
            	//成功后台回调
            	successCallback && successCallback();
            	
            	//关闭对话框
            	closeBootstrapDialog("docSharePwdVerify");
            }
            else 
            {
            	console.log(ret.msgInfo);
                // 普通消息提示条
    			bootstrapQ.msg({
    					msg :  _Lang("验证失败", " : ", ret.msgInfo),
    					type : 'warning',
    					time : 2000,
    				    }); 
            }
        },
        error : function () {
            // 普通消息提示条
			bootstrapQ.msg({
					msg :  _Lang("验证失败", " : ", "服务器异常"),
					type : 'warning',
					time : 2000,
				    }); 
        }
    });    
}

