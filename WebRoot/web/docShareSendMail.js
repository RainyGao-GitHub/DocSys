var docShareMailSubject = _Lang("来自MxsDoc的邮件");
function DocShareSendMailPageInit(_url)
{
	console.log("DocShareSendMailPageInit(): _url", _url);		
	DocShareSendMail.init(_url);
}

function closeDocShareSendMailDialog()
{
	closeBootstrapDialog("docShareSendMail");
}

function doDocShareSendMail()
{
	DocShareSendMail.doDocShareSendMail();
}

function cancelDocShareSendMail()
{
	closeDocShareSendMailDialog();
}

var DocShareSendMail = (function () {
	var url;

	function init(_url)
	{
		console.log("DocShareSendMail.init() _url:", _url);
		url = _url;
	}
	
	function doDocShareSendMail()
	{
		var mailList = $("#dialog-docShareSendMail textarea[name='mailList']").val();

	    if(mailList)
		{
	  	  	docShareSendMail(url, mailList);
	      	return true;
		}
		else
		{
	    	alert(_Lang("请填写接收人信息") + "!");
	        return false;
	    }
	}
	
   	function docShareSendMail(url, mailList)
   	{
    	$.ajax({
             url : "/DocSystem/Bussiness/docShareSendMail.do",
             type : "post",
             dataType : "json",
             data : {
            	url: url,
            	mailList: mailList,
            	mailSubject: docShareMailSubject,
             },
             success : function (ret) {
            	console.log("docShareSendMail ret:", ret);            		
             	if( "ok" == ret.status){             		
             		showSendResultInfo(ret);
                }
                else
                {
                	showErrorMessage(_Lang("发送失败", " : ", ret.msgInfo));
                }
            },
            error : function () {
                showErrorMessage(_Lang("发送失败", " : ", "服务器异常"));
            }
        });
    }
   	
   	function showSendResultInfo(ret)
   	{
   		var totalNum = ret.data.totalCount;
   		var successNum = ret.data.successCount;
		var sendResultInfo = "";
		switch(langType)
		{
		case "en":
			sendResultInfo = "Send Completed(Total : " + totalNum + ")";	
			break;
		default:
			sendResultInfo = "发送成功(共" + totalNum +"个)";
			break;
		}
   		
  		if(successNum != totalNum)
  		{
  			switch(langType)
  			{
  			case "en":
  				sendResultInfo = "Send Completed(Total : " + totalNum + ", Failed : " + (totalNum - successNum) + ")";
  				break;
  			default:
  	  			sendResultInfo = "发送完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
  				break;
  			}
  			
            // 普通消息提示条
			bootstrapQ.msg({
					msg : sendResultInfo,
					type : 'warning',
					time : 2000,
				    }); 
  		}
  		else
  		{
            // 普通消息提示条
			bootstrapQ.msg({
					msg : sendResultInfo,
					type : 'success',
					time : 2000,
				    }); 
  		}
   	}
   	
	//开放给外部的调用接口
    return {
		init: function(_url){
			init(_url);
		},
		doDocShareSendMail: function(){
			doDocShareSendMail();
        },
    };
})();
