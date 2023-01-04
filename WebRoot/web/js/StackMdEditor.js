//StackMdEditor类
var StackMdEditor = (function () {
	var docInfo = {};
	var docText = "";
	var tmpSavedDocText = "";
	var isContentChanged = false;
	var isReadOnly = false;	//zip or history doc set it as readonly
	//注意: editState用于标记编辑器当前的状态，如果不一致会导致切换状态时不正常
	//要使用editState进行标记是因为编辑器的changeView很多按键都会触发，需要避免重复触发
	var editState = true;	//编辑器的默认状态是处于编辑状态
	
	//For ArtDialog
	function initForArtDialog() 
	{
		var params = GetRequest();
		var docid = params['docid'];
		//获取artDialog父窗口传递过来的参数
		var artDialog2 = window.top.artDialogList['ArtDialog'+docid];
		if (artDialog2 == null) {
			artDialog2 = window.parent.artDialogList['ArtDialog' + docid];
		}
		
		docInfo = artDialog2.config.data; // 获取对话框传递过来的数据
	
		// 初始化文档信息
		docInfoInit();
		
		console.log("initForArtDialog() docInfo:", docInfo);

		//history file or file in zip is readonly
		checkAndSetIsReadOnly(docInfo);
		
		getDocText(docInfo, showText, showErrorInfo);
	}
	
	//For NewPage
	function initForNewPage()
	{
		docInfo = getDocInfoFromRequestParamStr();
	    document.title = docInfo.name;
	    
	    // 初始化文档信息
		docInfoInit();
		
		console.log("initForNewPage() docInfo:", docInfo);
	    
		//history file or file in zip is readonly
		checkAndSetIsReadOnly(docInfo);
		
		getDocText(docInfo, showText, showErrorInfo);
	}
	
	//For BootstrapDialog
	function PageInit(Input_doc)
	{
		docInfo = Input_doc;

	    // 初始化文档信息
		docInfoInit();

		console.log("PageInit() docInfo:", docInfo);

		//history file or file in zip is readonly
		checkAndSetIsReadOnly(docInfo); 
		
		getDocText(docInfo, showText, showErrorInfo);
  	}
	
	function showErrorInfo(msg)
	{
		bootstrapQ.msg({
			msg : msg,
			type : 'warning',
			time : 5000,
		    }); 
	}
	
	function GetRequest() {
		var url = location.search; //获取url中"?"符后的字串
		var theRequest = {};
		if (url.indexOf("?") !== -1) {
			var str = url.substr(1);
			var strs = str.split("&");
			for(var i = 0; i < strs.length; i ++) {
				theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);
			}
		}
		return theRequest;
	}
	
	function checkAndSetIsReadOnly(docInfo)
	{
		if(docInfo.isZip && docInfo.isZip == 1)
		{
			isReadOnly = true;
			return;
		}
		if(docInfo.isHistory && docInfo.isHistory == 1)
		{
			isReadOnly = true;
			return;
		}
	}
	
	/**
	 * 文档信息初始化方法
	 */
	function docInfoInit() {
		// 为空时获取文档的后缀
		if(docInfo.fileSuffix !==  undefined || docInfo.fileSuffix !== "") {
			docInfo.fileSuffix = getFileSuffix(docInfo.name);
		}
	}
	/**
	 * 文档加载类
	 * @param docText_ 文档内容
	 * @param tmpSavedDocText_ 临时保存文档内容（暂时未使用）
	 */
	function showText(docText_, tmpSavedDocText_) {
		// 传入staticedit插件地址和文件内容，获取staticedit插件指定路径
		var url = getStaticEditUrl("/DocSystem/web/static/stackedit/dist/index.html",docText_);
		// 获取iframe并设置其src路径，渲染stackEdit编辑器，加载待修改markdown文件
		var stackEditIframeEl = $(".stackedit-iframe");
		stackEditIframeEl.prop("src",url);

		// Listen to StackEdit events and apply the changes to the textarea.
		//监听iframe发来的消息
		window.addEventListener('message', messageHandler);
		// 设置定时0.5s后设置页面为只读
		//setTimeout(function () {
		//	switchEditMode(false);
		//},500)
	}

	/**
	 * staticEdit消息事件处理
	 *
	 * @param event 事件对象
	 */
	function messageHandler(event) {
		
		switch (event.data.type) 
		{
			case 'ready':
				// iframe 页面加载完成,设置当前页面为只读
				switchEditMode(false);
				break;
			case 'fileChange':
				if(isReadOnly == false)
				{
					//收到iframe文件改动消息
					var file = event.data.payload;
					docText = file.content.text;
					isContentChanged = true;
				}
				break;
			case 'close':
				//收到iframe的关闭消息
				var artDialog = top.dialog.get(window);
				artDialog.close();
				break;
			case 'saveChange':
				if(isContentChanged) {
					//执行文档保存操作
					saveDoc();
				}
				break;
			case 'changeView':
				console.log("messageHandler() changeView flag:", event.data.flag);
				//TODO: 注意除了点击编辑按键外，所有的按键点击的flag都是true（退出编辑），这样会导致逻辑错误
				if(event.data.flag)
				{
					if(isReadOnly)
					{
						console.log("readOnly: do nothing");
					}
					else
					{
						if(editState == true)
						{
							console.log("编辑器退出编辑状态...");
							editState = false;
							exitEdit();
						}
					}
				}
				else
				{
					if(isReadOnly)
					{
						console.log("readOnly: switch back to readonly");
						setStaticEditReaOnly(editState);
					}
					else
					{
						if(editState == false)
						{
							console.log("编辑器进入编辑状态...");
							editState = true;
							enableEdit();
						}
					}
				}
				break;
			case 'uploadImages':
				var images = event.data.payload.content.images;
				if (images && images.length > 0) {
					// 仅上传第一个传输过来的图片
					uploadMarkdownPic(images[0]);
				}
				break;
			default:
				break;
		}
	}

	/**
	 * 图片上传
	 */
	function uploadMarkdownPic(file) {
		var xhr = new XMLHttpRequest();
		var form = new FormData();
		form.append("editormd-image-file", file);
		//上传表单
		var imgName =  file.lastModified + "_" + file.name;
		var path = base64_urlsafe_encode(docInfo.path);
		var name = base64_urlsafe_encode(docInfo.name);
		var imageUploadURL = "/DocSystem/Doc/uploadMarkdownPic.do?reposId=" + docInfo.vid + "&docId=" + docInfo.docId + "&path="+ path + "&name="+ name + "&imgName=" + imgName;
		if(docInfo.shareId) {
			imageUploadURL="&shareId="+docInfo.shareId;
		}
		xhr.open("post", imageUploadURL);
		xhr.send(form);
		//设置异步上传状态变化回调处a理函数
		xhr.onreadystatechange = function() {
			if(xhr.status == 200) {
				if(xhr.readyState != 4) {
					//文件上传未结束
					return;
				}
				//上传成功！
				var ret = JSON.parse(xhr.responseText);
				if(1 == ret.success) {
					var stackeditEl = $(".stackedit-iframe");
					if (stackeditEl !== undefined) {
						var origin = window.location.protocol + '//' + window.location.host;
						var imgUrl = origin + ret.url;
						stackeditEl[0].contentWindow.postMessage({"type":"uploadCompleted","imgUrl":imgUrl},"*");
					}
				}
				else {
					//上传失败
					console.error("上传失败：" + ret.msgInfo);
				}
			}else{
				if(xhr.status < 300) {
					//不是真正的异常
					return;
				}
				//上传失败
				console.error("系统异常: 上传异常！");
			}
		};
	}

	/**
	 * stackEdit插件加载路径初始化，在原始路径上拼装文件信息，域信息
	 *
	 * @param url 插件路径
	 * @param doc_text 文档内容
	 * @return 拼装后携带文件内容的url路径
	 */
	function getStaticEditUrl(url,doc_text) {
		var origin = window.location.protocol + '//' + window.location.host;
		var fileName = docInfo.name;
		var params = {
			origin: origin,
			fileName: fileName,
			contentText: doc_text,
			silent: false
		};
		var serializedParams = Object.keys(params).map(function (key) {
			return key + '=' + encodeURIComponent(params[key] || '');
		}).join('&');
		var hash = '#' + serializedParams;
		return url+hash;
	}

	/**
	 * 设置编辑器的编辑状态为只读
	 *
	 * @param editFlag false代表编辑状态，true代表只读状态
	 */
	function setStaticEditReaOnly(editFlag) {
		var stackeditEl = $(".stackedit-iframe");
		if (stackeditEl !== undefined) {
			stackeditEl[0].contentWindow.postMessage({"type":"toggleEditor","flag":editFlag},"*")
		}
	}

	/**
	 * 设置编辑器的保存按钮的开启和禁用
	 *
	 * @param editFlag false代表编辑状态，true代表只读状态
	 */
	function disabledEditState(editFlag) {
		var stackeditEl = $(".stackedit-iframe");
		if (stackeditEl !== undefined) {
			stackeditEl[0].contentWindow.postMessage({"type":"updateEditState","flag":editFlag},"*")
		}
	}

	/**
	 * 保存文档
	 */
    function saveDoc() {
		$.ajax({
            url : "/DocSystem/Doc/updateDocContent.do",
            type : "post",
            dataType : "json",
            data : {
                reposId: docInfo.vid,
            	docId : docInfo.docId,
            	path: docInfo.path,
                name: docInfo.name,
            	content : docText,
            	docType: 1, //RealDoc
                shareId: docInfo.shareId,
            },
            success : function (ret) {
                if( "ok" === ret.status ){
                    isContentChanged = false;
					disabledEditState(true);
                    bootstrapQ.msg({
								msg : "保存成功 :" + (new Date()).toLocaleDateString(),
								type : 'success',
								time : 1000,
					});
				}else {
					bootstrapQ.msg({
						msg : "保存失败 : " + ret.msgInfo,
						type : 'warning',
						time : 1000,
	        		});
                }
            },
            error : function () {
            	bootstrapQ.msg({
					msg : "保存失败: 服务器异常",
					type : 'warning',
					time : 1000,
	    		});
            }
        });
    }

    function enableEdit()
    {
		console.log("enableEdit()");
		if(!docInfo.docId || docInfo.docId == 0)
		{
			showErrorInfo("请选择文件!");
			return;
		}

		$.ajax({
			url : "/DocSystem/Doc/lockDoc.do",
			type : "post",
			dataType : "json",
			data : {
				lockType : 1, //LockType: Online Edit
				reposId : docInfo.vid,
				docId : docInfo.docId,
				path: docInfo.path,
				name: docInfo.name,
				docType: 1,
                shareId: docInfo.shareId,
			},
			success : function (ret) {
				if( "ok" == ret.status)
				{
					console.log("enableEdit() ret.data",ret.data);
					$("[dataId='"+ docInfo.docId +"']").children("div:first-child").css("color","red");

					//显示工具条和退出编辑按键
					switchEditMode(true);
					return;
 				}
				else
				{
					showErrorInfo("lockDoc Error:" + ret.msgInfo);
					switchEditMode(false);
					return;
				}
			},
			error : function ()
			{
				showErrorInfo("lockDoc 异常");
				switchEditMode(false);
				return;
			}
		});
    }

	//退出文件编辑状态
    function exitEdit() {
		console.log("exitEdit()  docInfo.docId:" + docInfo.docId);
		if(!docInfo.docId || docInfo.docId == 0)
		{
			showErrorInfo("文件不存在");
			switchEditMode(false);
			return;
		}

		$.ajax({
			url : "/DocSystem/Doc/unlockDoc.do",
			type : "post",
			dataType : "json",
			data : {
				lockType : 1, //unlock the doc
				reposId : docInfo.vid,
            	docId : docInfo.docId,
				path: docInfo.path,
				name: docInfo.name,
				docType: 1,
                shareId: docInfo.shareId,
			},
			success : function (ret) {
				if( "ok" == ret.status)
				{
					console.log("exitEdit() ret:",ret.data);
					$("[dataId='"+ docInfo.docId +"']").children("div:first-child").css("color","black");
					switchEditMode(false);
					return;
 				}
				else
				{
					showErrorInfo("exitEdit() unlockDoc Error:" + ret.msgInfo);
					switchEditMode(true);
					return;
				}
			},
			error : function ()
			{
				showErrorInfo("exitEdit() unlockDoc 异常");
				switchEditMode(true);
				return;
			}
		});
	}
	
	function switchEditMode(edit)
	{
		console.log("switchEditMode() edit:" + edit);
		if(edit != editState)
		{
			editState = edit;
			setStaticEditReaOnly(edit);
			
			if(edit == true)
			{
				//Start beat thread to keep 
				startBeatThread();					
			}
		}			
	}
	
	function startBeatThread()
	{
		//启动超时定式器
		var timeOut = 180000; //超时时间3分钟
	    console.log("stackMdEditorForArt startBeatThread() with " + timeOut + " ms");
	    setTimeout(function () {
	        if(editState == true)
	    	{
	        	console.log("stackMdEditorForArt startBeatThread() refreshDocLock");
	    		refreshDocLock();
	    		startBeatThread();
	    	}
	    },timeOut);	
	}
	
	function refreshDocLock()
	{
		$.ajax({
			url : "/DocSystem/Doc/lockDoc.do",
			type : "post",
			dataType : "json",
			data : {
				lockType : 1, //LockType: Normal Lock
				reposId : docInfo.vid, 
				docId : docInfo.docId,
				path: docInfo.path,
				name: docInfo.name,
				docType: 1,
	            shareId: docInfo.shareId,
			},
			success : function (ret) {
				if( "ok" == ret.status)
				{
					console.log("refreshDocLock() ret.data",ret.data);
					return;
				}
				else
				{
					//showErrorInfo("lockDoc Error:" + ret.msgInfo);
					return;
				}
			},
			error : function () 
			{
				//showErrorInfo("lockDoc 异常");
				return;
			}
		});		
	}
	
	
	//开放给外部的调用接口
	return {
		initForArtDialog: function(){
			initForArtDialog();
	    },
	    initForNewPage: function(){
	    	initForNewPage();
	    },
	    PageInit: function(docInfo){
        	PageInit(docInfo);
        },
	    saveDoc: function(){
	    	return saveDoc();
	    },
	    enableEdit: function(){
	    	return enableEdit();
	    },	    
	    exitEdit: function(){
	    	return exitEdit();
	    },
	};
})();