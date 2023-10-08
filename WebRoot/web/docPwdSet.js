function DocPwdSetPageInit(_reposId,_node)
{
	console.log("DocPwdSetPageInit()");
	DocPwdSet.init(_reposId,_node);  
}

function closeDocPwdSetDialog()
{
	closeBootstrapDialog("docPwdSet");
}

function cancelSetDocPwd()
{
	closeDocPwdSetDialog();
}

function setDocPwd()
{
	DocPwdSet.doSetDocPwd();
	closeDocPwdSetDialog();	
}

var DocPwdSet = (function () {
	var reposId;
	var node;
	var path;
	var name;
	
	function init(_reposId,_node)
	{
		reposId = _reposId;
		node = _node;
		path = node.path;
		name = node.name;
		console.log("DocPwdSet.init() reposId:" + reposId + " docPath:" + path + name);
	}
	
	
    function doSetDocPwd()
   	{
    	console.log("doSetDocPwd() " + path + name);

    	var pwd = $("#docAccessPwd").val();
    	$.ajax({
            url : "/DocSystem/Doc/setDocPwd.do",
            type : "post",
            dataType : "json",
            data : {
            	reposId: reposId,
            	path: path,
            	name: name,
            	pwd: pwd,
            },
            success : function (ret) {
                if( "ok" == ret.status )
                {
					bootstrapQ.msg({
								msg : _Lang("设置成功！"),
								type : 'success',
								time : 2000,
					});  
                }
                else 
                {
                	console.log(ret.msgInfo);
                    // 普通消息提示条
        			bootstrapQ.msg({
        					msg :  _Lang("设置失败", ":", ret.msgInfo),
        					type : 'warning',
        					time : 2000,
        				    }); 
                }
            },
            error : function () {
                // 普通消息提示条
    			bootstrapQ.msg({
    					msg :  _Lang("设置失败", ":", "服务器异常"),
    					type : 'warning',
    					time : 2000,
    				    }); 
            }
        });   
   	}
	//开放给外部的调用接口
    return {
		init: function(_reposId,_node){
			init(_reposId,_node);
		},
    	doSetDocPwd: function(){
    		doSetDocPwd();
        },
    };
})();
