
function addPreferLinkPageInit(_callback)
{
	console.log("addPreferLinkPageInit()");
	
	AddPreferLink.init(_callback);
}

function closeAddPreferLinkDialog()
{
	closeBootstrapDialog("addPreferLink");
	//临时方案避免滚动条消失
	window.location.reload();
}

function doAddPreferLink()
{
	AddPreferLink.doAddPreferLink();
}

function cancelAddPreferLink()
{
	closeAddPreferLinkDialog();
	//临时方案避免滚动条消失
	window.location.reload();
}

var AddPreferLink = (function () {
	var callback;
	var url;
	var name;
	var type;
	var content;

	function init(_callback)
	{
		console.log("AddPreferLink.init()");
		callback = _callback;
	}
	
	function doAddPreferLink()
	{
		url = $("#dialog-addPreferLink input[name='url']").val();
		name = $("#dialog-addPreferLink input[name='name']").val();
		content = $("#dialog-addPreferLink textarea[name='content']").val();
	    type = $("#dialog-addPreferLink select[name='type']").val();

	    if(url)
		{
	  	  	addPreferLink(name, url, content, type);
	      	return true;
		}
		else
		{
	    	alert(_Lang("网站地址不能为空"));
	        return false;
	    }
	}
	
   	function addPreferLink(name, url, content, type)
   	{
    	$.ajax({
             url : "/DocSystem/Bussiness/addPreferLink.do",
             type : "post",
             dataType : "json",
             data : {
            	name: name,
            	url: url,
	            content: content,
	            type: type,
             },
             success : function (ret) {
            	console.log("addPreferLink ret:", ret);            		
             	if( "ok" == ret.status){             		
             		// 普通消息提示条
					bootstrapQ.msg({
								msg : _Lang("添加成功") + "!",
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
                		msg: _Lang("添加失败", " : ", ret.msgInfo),
                	});
                }
            },
            error : function () {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("添加失败", " : ", "服务器异常"),
            	});
            }
        });
    }
   	
	//开放给外部的调用接口
    return {
		init: function(_callback){
			init(_callback);
		},
		doAddPreferLink: function(){
			doAddPreferLink();
        },
    };
})();

