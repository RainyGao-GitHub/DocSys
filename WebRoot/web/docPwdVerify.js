
function DocPwdVerifyPageInit(_reposId,_node,_callback)
{
	console.log("DocPwdVerifyPageInit()");
	DocPwdVerify.init(_reposId, _node,_callback);  
}

function closeDocPwdVerifyDialog()
{
	closeBootstrapDialog("docPwdVerify");
}

function cancelVerifyDocPwd()
{
	closeDocPwdVerifyDialog();
}

function verifyDocPwd()
{
	DocPwdVerify.doVerifyDocPwd();
}

var DocPwdVerify = (function () {
	var node;
	var reposId;
	var callback;
	var path;
	var name;
	
	function init(_reposId, _node, _callback)
	{
		console.log("DocPwdVerify.init() _callback:",_callback);
		reposId = _reposId;
		node = _node;
		callback = _callback;
		path = node.path;
		name = node.name;
	}
	
	
    function doVerifyDocPwd()
   	{
    	console.log("doVerifyDocPwd() " + path + name);

    	var pwd = $("#docAccessPwd").val();
    	$.ajax({
            url : "/DocSystem/Doc/verifyDocPwd.do",
            type : "post",
            dataType : "json",
            data : {
            	reposId: reposId,
            	path: path,
            	name: name,
            	pwd: pwd,
            	shareId: gShareId,
            },
            success : function (ret) {
                if( "ok" == ret.status )
                {
					bootstrapQ.msg({
								msg : _Lang("验证成功！"),
								type : 'success',
								time : 2000,
					}); 
					closeDocPwdVerifyDialog();
					callback && callback();
				}
                else 
                {
                	console.log(ret.msgInfo);
                    // 普通消息提示条
        			bootstrapQ.msg({
        					msg :  _Lang("验证失败", ":", ret.msgInfo),
        					type : 'warning',
        					time : 2000,
        				    }); 
                }
            },
            error : function () {
                // 普通消息提示条
    			bootstrapQ.msg({
    					msg :  _Lang("验证失败", ":", "服务器异常"),
    					type : 'warning',
    					time : 2000,
    				    }); 
            }
        });   
   	}
	//开放给外部的调用接口
    return {
		init: function(_reposId, _node, _callback){
			init(_reposId, _node, _callback);
		},
		doVerifyDocPwd: function(){
			doVerifyDocPwd();
        },
    };
})();
