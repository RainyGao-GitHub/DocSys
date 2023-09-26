function editPreferLinkPageInit(_preferLinkInfo, _callback)
{
	console.log("editPreferLinkPageInit(): _preferLinkInfo", _preferLinkInfo);
	
	EditPreferLink.init(_preferLinkInfo, _callback);
}

function closeEditPreferLinkDialog()
{
	closeBootstrapDialog("editPreferLink");
	//临时方案避免滚动条消失
	window.location.reload();
}

function doEditPreferLink()
{
	EditPreferLink.doEditPreferLink();
	//临时方案避免滚动条消失
	window.location.reload();
}

function cancelEditPreferLink()
{
	closeEditPreferLinkDialog();
}

var EditPreferLink = (function () {
	var callback;
	var preferLinkInfo;

	function init(_preferLinkInfo, _callback)
	{
		console.log("EditPreferLink.init() _preferLinkInfo:", _preferLinkInfo);
		if(_preferLinkInfo)
		{
			preferLinkInfo = _preferLinkInfo;
			var url = preferLinkInfo.url;
			var name = preferLinkInfo.name;
			var content = preferLinkInfo.content;
			var type = preferLinkInfo.type;
			if(url)
			{
				$("#dialog-editPreferLink input[name='url']").val(url);
			}
			if(name)
			{
				$("#dialog-editPreferLink input[name='name']").val(name);
			}
			if(content)
			{
				$("#dialog-editPreferLink textarea[name='content']").val(content);
			}
			if(type)
			{
				$("#dialog-editPreferLink select[name='type']").val(type);
			}
		}			
		
		callback = _callback;
					
	}
	
	function doEditPreferLink()
	{
		var isChanged = false;
		var url;
		var name;
		var content;
		var type;
		var tmpUrl = $("#dialog-editPreferLink input[name='url']").val();
		if(!(preferLinkInfo.serverUrl && tmpServerUrl === preferLinkInfo.serverUrl))
		{				
			isChanged = true;
			url = tmpUrl;
			console.log("doEditPreferLink url changed:", url);
		}
			
		var tmpName = $("#dialog-editPreferLink input[name='name']").val();
		if(!(preferLinkInfo.name && tmpName === preferLinkInfo.name))
		{
			isChanged = true;
			name = tmpName;
			console.log("doEditPreferLink name changed:", name);
		}
		
		var tmpContent = $("#dialog-editPreferLink textarea[name='content']").val();
		if(!(preferLinkInfo.content && tmpContent === preferLinkInfo.content))
		{
			isChanged = true;
			content = tmpContent;
			console.log("doEditPreferLink content changed:", content);
		}
		
		var tmpType = $("#dialog-editPreferLink select[name='type']").val();
	    if(!(preferLinkInfo.type && tmpType === preferLinkInfo.type))
	    {
	    	isChanged = true;
	    	type = tmpType;
			console.log("doEditPreferLink type changed:", type);
	    }	

	    if(isChanged == true)
		{
	  	  	editPreferLink(name, url, content, type);
	      	return true;
		}
		else
		{
	    	alert(_Lang("设置未改动") + "!");
	        return false;
	    }
	}
	
   	function editPreferLink(name, url, content, type)
   	{
    	$.ajax({
             url : "/DocSystem/Bussiness/editPreferLink.do",
             type : "post",
             dataType : "json",
             data : {
            	linkId: preferLinkInfo.id,
            	name: name,
            	url: url,
            	content: content,
            	type: type,
             },
             success : function (ret) {
            	console.log("editPreferLink ret:", ret);            		
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
		init: function(_preferLinkInfo, _callback){
			init(_preferLinkInfo, _callback);
		},
		doEditPreferLink: function(){
			doEditPreferLink();
        },
    };
})();