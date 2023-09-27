var DocShare = (function () {
	var shareId = null;
	var shareLink = null;
	var callback = null;
	function DocSharePageInit(docShare, docName, url, _callback)
	{
		shareId = docShare.shareId;
		shareLink = url;
		callback = _callback;
		
		$("#shareLink").val(url);
		
		//设置分享密码
		if(!docShare.sharePwd)
		{
			$("#sharePwd").val("");
		}
		else
		{
			$("#sharePwd").val(docShare.sharePwd);			
		}
		
		//转换有效时间
		if(!docShare.validHours)
		{
			$("#shareHours").get(0).selectedIndex=0;
		}
		else 
		{
			if(docShare.validHours > 10000) //大于10000小时
			{
				$("#shareHours").get(0).selectedIndex=0;
			}
			else if(docShare.validHours > 48) //大于48小时
			{
				$("#shareHours").get(0).selectedIndex=1;
			}
			else //其他清空
			{
				$("#shareHours").get(0).selectedIndex=2;
			}			
		}
		
		//分享权限转换
		var shareAuth = JSON.parse(docShare.shareAuth);
		if(shareAuth.downloadEn && shareAuth.downloadEn == 1)
		{
			//允许下载
			$("#downloadEn").attr('checked', 'true');
		}
		if(shareAuth.addEn && shareAuth.addEn == 1)
		{
			//允许上传
			$("#addEn").attr('checked', 'true');
		}
		if(shareAuth.editEn && shareAuth.editEn == 1)
		{
			//允许编辑
			$("#editEn").attr('checked', 'true');
		}
		if(shareAuth.deleteEn && shareAuth.deleteEn == 1)
		{
			//允许删除
			$("#deleteEn").attr('checked', 'true');
		}
	}
	
	function showDocShare(text){
		$(".docShareModal").fadeIn("slow");
	}
	
	function hideDocShare(){
		$(".docShareModal").fadeOut("slow");
	}
	
	function openShareLink()
	{
		console.log("openShareLink() shareLink:" + shareLink);
		window.open(shareLink,target="_blank");
	}
	
	function copyShareLink()
	{
		//window.clipboardData.setData("Text",url);	//剪贴板存在兼容性问题
		var obj=document.getElementById("shareLink");
		obj.select(); // 选择对象
		document.execCommand("Copy"); // 执行浏览器复制命令
	 	    
	 	// 普通消息提示条
	 	bootstrapQ.msg({
	 		msg : _Lang('分享链接已复制') + '!',
	 		type : 'success',
	 		time : 1000,
	 	});
	}
	
	function showShareLinkQRCode()
	{
		var shareLink = $("#shareLink").val();
		showDocShareQRCodePanel(shareLink);
	}
	
	function showDocShareQRCodePanel(url)
	{
		console.log("showDocShareQRCodePanel url:" + url);
		bootstrapQ.dialog({
			id: 'docShareQRCode',
			url: 'docShareQRCode.html',
			title: _Lang('分享二维码'),
			msg: _Lang('页面正在加载，请稍等') + '...',
			foot: false,
			big: false,
			callback: function(){
				DocShareQRCodePageInit(url);
			},
		});
	}
	
	function showDocShareSendMail()
	{
		var shareLink = $("#shareLink").val();
		showDocShareSendMailPanel(shareLink);
	}
	
	function showDocShareSendMailPanel(url)
	{
		console.log("showDocShareSendMailPanel url:" + url);
		bootstrapQ.dialog({
			id: 'docShareSendMail',
			url: 'docShareSendMail' + langExt + '.html',
			title: _Lang('发送分享链接'),
			msg: _Lang('页面正在加载，请稍等') + '...',
			foot: false,
			big: false,
			callback: function(){
				DocShareSendMailPageInit(url);
			},
		});
	}
	
	function generateSharePwd()
	{
		var sharePwd = randomString(6);
		console.log("generateSharePwd() sharePwd:" + sharePwd);
	    $("#sharePwd").val(sharePwd);
	}
	
	function randomString(len) {
		len = len || 32;
		var $chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678';    /****默认去掉了容易混淆的字符oOLl,9gq,Vv,Uu,I1****/
		var maxPos = $chars.length;
		var pwd = '';
		for (i = 0; i < len; i++) {
			pwd += $chars.charAt(Math.floor(Math.random() * maxPos));
		}
		return pwd;
	}
	
	function updateDocShare(){
		console.log("updateDocShare() shareId:" + shareId);
		
		var sharePwd = $("#sharePwd").val();
		var shareHours = $("#shareHours").val();		
		var downloadEn = $("#downloadEn").prop("checked")?1:0;;
		var addEn = $("#addEn").prop("checked")?1:0;;
		var deleteEn = $("#deleteEn").prop("checked")?1:0;;
		var editEn = $("#editEn").prop("checked")?1:0;;
		
    	$.ajax({
             url : "/DocSystem/Bussiness/updateDocShare.do",
             type : "post",
             dataType : "json",
             data : {
            	shareId : shareId,
            	isAdmin : 0,
            	access : 1,
            	downloadEn : downloadEn,
            	addEn : addEn,
            	deleteEn : deleteEn,
            	editEn : editEn,
            	heritable : 1,     
            	sharePwd : sharePwd,
            	shareHours : shareHours,
             },
             success : function (ret) {
             	console.log("updateDocShare ret:", ret);
             	if( "ok" == ret.status){
                	callback && callback();
             		bootstrapQ.msg({
    					msg : '保存成功！',
    					type : 'success',
    					time : 1000,
    				});
            		return;
	            }
                else
                {
                	callback && callback();
            		bootstrapQ.msg({
    					msg : '保存失败:' + ret.msgInfo,
    					type : 'danger',
    					time : 1000,
    				});
            		return false;
                }
            },
            error : function () {
            	callback && callback();
        		bootstrapQ.msg({
					msg : '保存失败:服务器异常',
					type : 'danger',
					time : 1000,
				});
	            return false;
            }
        });
		return true;
    }
	
	//登录按键处理函数
	function deleteDocShare(){
		console.log("deleteDocShare() shareId:" + shareId);
		
    	$.ajax({
             url : "/DocSystem/Bussiness/deleteDocShare.do",
             type : "post",
             dataType : "json",
             data : {
            	shareId : shareId,
             },
             success : function (ret) {
            	console.log("deleteDocShare ret:", ret);
             	if( "ok" == ret.status){
                	callback && callback();
            		bootstrapQ.msg({
    					msg : '取消成功！',
    					type : 'success',
    					time : 1000,
    				});
            		
            		//关闭对话框
            		closeBootstrapDialog("docShare");
            		return;
	            }
                else
                {
                	callback && callback();
            		bootstrapQ.msg({
    					msg : '取消失败:' + ret.msgInfo,
    					type : 'danger',
    					time : 1000,
    				});
            		return false;
                }
            },
            error : function () {
            	callback && callback();
        		bootstrapQ.msg({
					msg : '取消失败:服务器异常',
					type : 'danger',
					time : 1000,
				});
	            return false;
            }
        });
		return true;
    }
	
	//开放给外部的调用接口
    return {
    	DocSharePageInit: function(docShare, docName, url, _callback){
    		DocSharePageInit(docShare, docName, url, _callback);
        },
        showDocShare: function(){
        	showDocShare();
        },
        hideDocShare: function(){
        	hideDocShare();
        },
        openShareLink: function(){
        	return openShareLink();
        },
        copyShareLink: function(){
        	return copyShareLink();
        },
        showShareLinkQRCode: function(){
        	return showShareLinkQRCode();
        },
        showDocShareSendMail: function(){
        	return showDocShareSendMail();
        },
        generateSharePwd: function(){
        	return generateSharePwd();
        },
        updateDocShare: function(){
        	return updateDocShare();
        },
        deleteDocShare: function(){
        	return deleteDocShare();
        },
	};
})();
