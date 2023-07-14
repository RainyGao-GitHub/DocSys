//EditormdEditor类
var EditormdEditor = (function () {
	var docInfo = {};
	var docText = "";
	var tmpSavedDocText = "";
	var isContentChanged = false;
	var editState = false;
	var switchEditModeOnly = false;
	var editor = {};	
	
	//文件自动保存
	var autoSaveTimer;
  	var timerState = 0;
  	
  	var isOnLoadTriggerChange = false;
	
  	//supported command in message
	var commandMap = {
            'openDocument': function(data) {
                _loadDocument(data);
            },
        };
    
	
	function initEditor()
	{
  		console.log("EditormdEditor editorInit editState:" + editState);

  		var params = {
           width: "100%",
           height: $(document).height()-70,
           path : 'static/markdown/lib/',
           markdown : "",	//markdown的内容默认务必是空，否则会出现当文件内容是空的时候显示默认内容
           toolbar  : false,             // 关闭工具栏
           codeFold : true,
           searchReplace : true,
           saveHTMLToTextarea : true,      // 保存 HTML 到 Textarea
           htmlDecode : "style,script,iframe|on*",            // 开启 HTML 标签解析，为了安全性，默认不开启
           emoji : true,
           taskList : true,
           tocm: true,          			// Using [TOCM]
           tex : true,                      // 开启科学公式 TeX 语言支持，默认关闭
           //previewCodeHighlight : false,  // 关闭预览窗口的代码高亮，默认开启
           flowChart : true,
           sequenceDiagram : true,
           //dialogLockScreen : false,      // 设置弹出层对话框不锁屏，全局通用，默认为 true
           //dialogShowMask : false,     // 设置弹出层对话框显示透明遮罩层，全局通用，默认为 true
           //dialogDraggable : false,    // 设置弹出层对话框不可拖动，全局通用，默认为 true
           dialogMaskOpacity : 0.2,    // 设置透明遮罩层的透明度，全局通用，默认值为 0.1
           dialogMaskBgColor : "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为 #fff
           imageUpload : true,
           imageFormats : ["jpg","JPG", "jpeg","JPEG","gif","GIF","png", "PNG","bmp","BMP", "webp","WEBP",],
           imageUploadURL : "/DocSystem/Doc/uploadMarkdownPic.do?docId="+docInfo.docId + "&path=" + docInfo.path + "&name=" + docInfo.name,
           onchange : function () {
                console.log("EditormdEditor onchange docInfo.edit:", docInfo.edit);       
                isContentChanged = true;
	   		    console.log("textChange stackZ.size:" + stackZ.size() +  " stackY.size:" + stackY.size() +  " ctrlZY:" + isCtrlZY);
	   			if(false == isCtrlZY)
	   			{
	   				var content = editor.getMarkdown();
	   				stackZ.push(content);
	   			}
           },
           onpreviewing : function () {
               console.log("EditormdEditor onpreviewing switchEditModeOnly:" + switchEditModeOnly);
               if(switchEditModeOnly)
               {
            	   switchEditModeOnly = false;
               }
               else
               {
            	   _exitEdit(2);	//编辑器触发的退出编辑
               }
           },
           onpreviewed :function () {
               console.log("EditormdEditor onpreviewed switchEditModeOnly:" + switchEditModeOnly);
               if(switchEditModeOnly)
               {
            	   switchEditModeOnly = false;
               }
               else
               {
            	   _enableEdit(2);	//编辑器触发的退出编辑
               }

           },
           onload : function () {
               console.log("EditormdEditor onload editState:" + editState);

                //TODO: 如果主动设置编辑器状态，会触发回调则需要设置
				//switchEditModeOnly = true;
                //Disable Edit
				this.previewing(); 		  //加载成默认是预览
           },
           onresize: function(){
        	   console.log("EditormdEditor onresize");
           }
   		};
   		
  		editor = editormd("mdPlayer",params);
	}
	
	//Init For ArtDialog
	function initForArtDialog()
	{
		initEditor();

		var params = GetRequest();
		var docid = params['docid'];
		//获取artDialog父窗口传递过来的参数
		var artDialog2 = window.top.artDialogList['ArtDialog' + docid];
		if (artDialog2 == null) {
			artDialog2 = window.parent.artDialogList['ArtDialog' + docid];
		}
		// 获取对话框传递过来的数据
		docInfo = artDialog2.config.data;
		docInfo.docType = 1;	//RealDoc
		
		console.log("initForArtDialog() docInfo:", docInfo);

		if (!docInfo.fileSuffix) {
			docInfo.fileSuffix = getFileSuffix(docInfo.name);
		}
		
		getDocText(docInfo, showText, showErrorInfo);
	}
	
	//Init For NewPage
	function initForNewPage()
	{
		initEditor();
		
	    docInfo = getDocInfoFromRequestParamStr();
	    docInfo.docType = 1;	//RealDoc
	    
	    document.title = docInfo.name;
	    
	    console.log("initForNewPage() docInfo:", docInfo);
	    
		if (!docInfo.fileSuffix) {
			docInfo.fileSuffix = getFileSuffix(docInfo.name);
		}
		
		getDocText(docInfo, showText, showErrorInfo);
	}
	
	//Init For Bootstrap Dialog
	function textEditorPageInit(Input_doc)
	{
		initEditor();
		
		docInfo = Input_doc;		
		docInfo.docType = 1;	//RealDoc
	    
		console.log("textEditorPageInit() docInfo:", docInfo);
		
		if (!docInfo.fileSuffix) {
			docInfo.fileSuffix = getFileSuffix(docInfo.name);
		}
		
		getDocText(docInfo, showText, showErrorInfo);	  	
  	}
	
	//Init For VDoc 
	function initForVDoc()
	{
		initEditor();
		
		//get frameEditorId from url
		var frameEditorId = getQueryString("frameEditorId");
		if(frameEditorId && frameEditorId != null)
		{
			window.frameEditorId = frameEditorId;
		}		
		
		//Bind message handler
        if (window.attachEvent) {
            window.attachEvent('onmessage', _onMessage);
        } else {
            window.addEventListener('message', _onMessage, false);
        }
        
        //Notify VDocEditor that eidtor is ready
        _postMessage({ event: 'onAppReady' });
	}
	
    var _postMessage = function(msg) {
        console.log("EditormdEditor _postMessage() msg:", msg);

        // TODO: specify explicit origin
        if (window.parent && window.JSON) {
            msg.frameEditorId = window.frameEditorId;
            window.parent.postMessage(window.JSON.stringify(msg), "*");
        }
    };
    
    var _onMessage = function(msg) {
        console.log("EditormdEditor _onMessage() msg:", msg);

    	// TODO: check message origin
        var data = msg.data;
        
        if (Object.prototype.toString.apply(data) !== '[object String]' || !window.JSON) {
            return;
        }

        var cmd, handler;

        try {
            cmd = window.JSON.parse(data)
        } catch(e) {
            cmd = '';
        }

        if (cmd) {
            handler = commandMap[cmd.command];
            if (handler) {
                handler.call(this, cmd.data);
            }
        }
    };
    
	var _loadDocument = function(data){
		docInfo = data.doc;
		docInfo.docType = 2;
		
		//docInfo = getDocInfoFromRequestParamStr();
		//docInfo.docType = 2;

	    document.title = docInfo.name;
	    
	    // 初始化文档信息
		console.log("loadDocument() docInfo:", docInfo);
		
		getDocText(docInfo, showText, showErrorInfo);	
		
		checkAndSetFileShowMode(docInfo);
		checkAndSetEditBtn(docInfo);
	};
	
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
			for (var i = 0; i < strs.length; i++) {
				theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
			}
		}
		return theRequest;
	}


			
	function showText(docText, tmpSavedDocText)
	{	
		editor.setMarkdown(docText);
	}
	    
	function ArrayStack(){
	    var arr = [];  
	        //压栈操作  
	    this.push = function(element){  
	        arr.push(element);  
	    }  
	        //退栈操作  
	    this.pop = function(){  
	        return arr.pop();  
	    }  
	        //获取栈顶元素  
	    this.top = function(){  
	        return arr[arr.length-1];  
	    }  
	        //获取栈长  
	    this.size = function(){  
	        return arr.length;  
	    }  
	        //清空栈  
	    this.clear = function(){  
	        arr = [];  
	        return true;  
	    }  
	  
	    this.toString = function(){  
	        return arr.toString();  
	    }  
	}
	
	var stackZ = new ArrayStack();
	var stackY = new ArrayStack();
	var isCtrlZY = false;
	function ctrlZ(){
		if(stackZ.size() > 0)
		{
			var p = stackZ.pop();
			if(p)
			{
				//put entry to stackY
				stackY.push(p);
				isCtrlZY = true;
				editor.setMarkdown(p);
				console.log("ctrlZ stackZ.size:" + stackZ.size() +  " stackY.size:" + stackY.size() + " ctrlZY:" + isCtrlZY);
				isCtrlZY = false;
			}
		}
	}
	
	//ctrl + y
	function ctrlY()
	{
		if(stackY.size() > 0)
		{
			var p = stackY.pop();
			if(p)
			{
				stackZ.push(p);
				isCtrlZY = true;
				editor.setMarkdown(p);
				console.log("ctrlY stackZ.size:" + stackZ.size() +  " stackY.size:" + stackY.size() + " ctrlZY:" + isCtrlZY);
				isCtrlZY = false;
			}
		}
	}
	
	function saveDoc()
	{
		console.log("saveDoc docInfo.docId:" + docInfo.docId);
		
		if(isContentChanged == false)
		{
		   	console.log("saveDoc there is no change");
			return;
		}
		
		var content = editor.getMarkdown();
		$.ajax({
	        url : "/DocSystem/Doc/updateDocContent.do",
	        type : "post",
	        dataType : "json",
	        data : {
	            reposId: docInfo.vid,
	        	docId : docInfo.docId,
	        	path: docInfo.path,
	            name: docInfo.name,
	        	content : content,
	        	docType: docInfo.docType, //RealDoc
	            shareId: docInfo.shareId,
	        },
	        success : function (ret) {
	            if( "ok" == ret.status ){
	                console.log("保存成功 : " , (new Date()).toLocaleDateString());
	                docText = content;
	                isContentChanged = false;
	                stackZ.clear();
	                stackY.clear();
	                
	                bootstrapQ.msg({
								msg : "保存成功 : " + (new Date()).toLocaleDateString(),
								type : 'success',
								time : 1000,
					});
				}else {
	                //bootstrapQ.alert("保存失败:"+ret.msgInfo);
	                bootstrapQ.msg({
						msg : "保存失败 : " + ret.msgInfo,
						type : 'warning',
						time : 1000,
	        		});
	           }
	        },
	        error : function () {
	            //bootstrapQ.alert("保存失败:服务器异常");
	            bootstrapQ.msg({
					msg : "保存失败: 服务器异常",
					type : 'warning',
					time : 1000,
	    		});
	        }
	    });
	}
	
	//TODO: 进入编辑状态和退出编辑状态的两种模式
	//1. 编辑器外部触发
	//   文件锁定或解锁成功后，将编辑器切换到指定的编辑状态
	//2. 编辑器内部按键触发
	//   编辑器先切换到指定编辑状态，再进行文件锁定或解锁，如果失败则将编辑器切换回原来的编辑状态
	
	function _enableEdit(switchMode)
	{
		console.log("_enableEdit() switchMode:" + switchMode);
		if(!docInfo.docId || docInfo.docId == 0)
		{
			if(switchMode == 2)
			{
				switchEditMode(false, 3);	//只需要切换编辑器状态
			}
			showErrorInfo("请选择文件!");
			return;
		}
	
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
				docType: docInfo.docType,
	            shareId: docInfo.shareId,
			},
			success : function (ret) {
				if( "ok" == ret.status)
				{
					console.log("enableEdit() ret.data",ret.data);
					$("[dataId='"+ docInfo.docId +"']").children("div:first-child").css("color","red");
	
					//显示工具条和退出编辑按键
					if(switchMode == 1)
					{
						switchEditMode(true, 1);
					}
					else
					{
						switchEditMode(true, 2);	//编辑器状态不需要切换						
					}
					return;
				}
				else
				{					
					if(switchMode == 2)
					{
						switchEditMode(false, 3);	//只需要切换编辑器状态
					}
					showErrorInfo("lockDoc Error:" + ret.msgInfo);
					return;
				}
			},
			error : function () 
			{
				if(switchMode == 2)
				{
					switchEditMode(false, 3);	//只需要切换编辑器状态
				}
				showErrorInfo("lockDoc 异常");
				return;
			}
		});
	}
	
	//退出文件编辑状态
	function _exitEdit(switchMode) {   	
		console.log("exitEdit()  switchMode:" + switchMode);
		if(!docInfo.docId || docInfo.docId == 0)
		{
			if(switchMode == 2)
			{
				switchEditMode(true, 3);	//只需要切换编辑器状态
			}
			showErrorInfo("文件不存在");
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
				docType: docInfo.docType,
	            shareId: docInfo.shareId,
			},
			success : function (ret) {
				if( "ok" == ret.status)
				{
					console.log("exitEdit() ret:",ret.data);
					$("[dataId='"+ docInfo.docId +"']").children("div:first-child").css("color","black");
					if(switchMode == 1)
					{
						switchEditMode(false, 1);
					}
					else
					{
						switchEditMode(false, 2);	//编辑器状态不需要切换						
					}
					return;
				}
				else
				{
					if(switchMode == 2)
					{
						switchEditMode(true, 3);	//只需要切换编辑器状态
					}
					showErrorInfo("exitEdit() unlockDoc Error:" + ret.msgInfo);
					return;
				}
			},
			error : function () 
			{
				if(switchMode == 2)
				{
					switchEditMode(true, 3);	//只需要切换编辑器状态
				}
				showErrorInfo("exitEdit() unlockDoc 异常");
				return;
			}
		});
	}
	
	function switchEditMode(state, mode)
	{
		//更新编辑器状态
		editState = state;
		docInfo.edit = state;
		
		if(mode == 3)
		{
			switchEditModeOnly = true;	//避免编辑器回调再次触发状态切换回调
			if(editState == true)
			{	
				//Enable Edit
				editor.previewing();
			}
			else
			{
				//Disable Edit
				editor.previewed();
			}
			return;
		}
		
		if(editState == true)
		{
			_postMessage({ event: 'onSwitchEditMode', data: editState });

			//显示工具条
			$("#toolBarMenu").show();
			//显示退出编辑按键
			$("#textEditorCloseBtn").show();
			//隐藏编辑按键
			$("#textEditorEditBtn").hide();
			
			if(mode == 1)
			{
				//TODO: 如果主动设置编辑器状态，会触发回调则需要设置
				switchEditModeOnly = true;
				//Enable Edit
				editor.previewing();
			}
			
			//Start beat thread to keep 
			startBeatThread();
			
			//启动内容自动保存线程
			startAutoTmpSaver();
				
			if(tmpSavedDocText && tmpSavedDocText != docText)
			{
				bootstrapQ.confirm({
					id: "loadContentConfirm",
					title: "加载确认",
					msg : "上次有未保存的编辑内容，是否加载？",
				},function () {
			    	//alert("点击了确定");
			        editor.loadmd(tmpSavedDocText);
			    	return true;   
			 	},function (){
			 		//alert("点击了取消");
			        tmpSavedDocText = docText;
			        deleteTmpSavedContent(docInfo.docId);
			        return true;
			 	});
			}
		}
		else
		{
			_postMessage({ event: 'onSwitchEditMode', data: editState });

			//隐藏工具条
			$("#toolBarMenu").hide();			
			//隐藏退出编辑按键
			$("#textEditorCloseBtn").hide();
			//显示编辑按键
			$("#textEditorEditBtn").show();			
			
			if(mode == 1)
			{
				//TODO: 如果主动设置编辑器状态，会触发回调则需要设置
				switchEditModeOnly = true;
				//Disable Edit
				editor.previewed();
			}
			
			//关闭内容自动保存线程
			stopAutoTmpSaver();
		}
	}
	
	function startBeatThread()
	{
		//启动超时定式器
		var timeOut = 180000; //超时时间3分钟
	    console.log("aceEditorForArt startBeatThread() with " + timeOut + " ms");
	    setTimeout(function () {
	        if(editState == true)
	    	{
	        	console.log("aceEditorForArt startBeatThread() refreshDocLock");
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
				docType: docInfo.docType,
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
	
	function checkAndSetEditBtn(docInfo)
	{
		if(docInfo.docType == 2)
		{
			$("#textEditorEditBtn").show();
			return;
		}
		
		if(docInfo.isZip && docInfo.isZip == 1)
		{
			return;
		}
		if(docInfo.isHistory && docInfo.isHistory == 1)
		{
			return;
		}
		
		
		var editable = isEditableText(docInfo.fileSuffix);
		console.log("checkAndSetEditBtn() isEditableText:" + editable);
		if(editable)
		{
			$("#textEditorEditBtn").show();
		}
	}
	
	function checkAndSetFileShowMode(docInfo)
	{
		//Do nothing
	}
	
	function startAutoTmpSaver()
	{ 
		console.log("EditormdEditor.startAutoTmpSaver timerState:" + timerState);
		if(timerState == 0)
		{
			timerState = 1;
			autoSaveTimer = setInterval(function () {
	        	var newContent = editor.getMarkdown();
	        	if(!tmpSavedDocText)
	        	{
	        		tmpSavedDocText = "";
	        	}
	        	
				if(tmpSavedDocText != newContent)
	    		{
	    			console.log("autoTmpSaveWiki");
	    			tmpSaveDoc(docInfo.docId, newContent);
	    			tmpSavedDocText = newContent;
	    		}
	    	},20000);
	    }
	}

	function stopAutoTmpSaver(){
		console.log("EditormdEditor.stopAutoTmpSaver timerState:" + timerState);
		if(timerState == 1)
		{
			timerState = 0;
			clearInterval(autoSaveTimer);
		}
	}
	
    //文件临时保存操作
    function tmpSaveDoc(node, content){
		$.ajax({
            url : "/DocSystem/Doc/tmpSaveDocContent.do",
            type : "post",
            dataType : "json",
            data : {
            	reposId: gReposInfo.id,
                docId : node.docId,
                pid: node.pid,
                path: node.path,
                name: node.name,
                content : content,
                docType : 1, //realDoc
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                    console.log("临时保存成功 :" , (new Date()).toLocaleDateString());
                    bootstrapQ.msg({
								msg : "临时保存成功 :" + (new Date()).toLocaleDateString(),
								type : 'success',
								time : 1000,
					});
                }else {
                    //bootstrapQ.alert("临时保存失败:"+ret.msgInfo);
                    bootstrapQ.msg({
						msg : "临时保存失败 :" + +ret.msgInfo,
						type : 'danger',
						time : 1000,
					});
                }
            },
            error : function () {
                //bootstrapQ.alert("临时保存异常");
                bootstrapQ.msg({
					msg : "临时保存失败 :服务器异常",
					type : 'danger',
					time : 1000,
				});
            }
        });

    }
    
    //文件临时Delete操作
    function deleteTmpSavedContent(node)
    {	
        $.ajax({
            url : "/DocSystem/Doc/deleteTmpSavedDocContent.do",
            type : "post",
            dataType : "json",
            data : {
            	reposId: gReposInfo.id,
                docId : node.docId,
                pid: node.pid,
                path: node.path,
                name: node.name,
                docType: 1,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                    console.log("删除临时保存内容成功 :" , (new Date()).toLocaleDateString());
                    bootstrapQ.msg({
								msg : "删除临时保存内容成功 :" + (new Date()).toLocaleDateString(),
								type : 'success',
								time : 1000,
					});
                }else {
                    //bootstrapQ.alert("临时保存失败:"+ret.msgInfo);
                    bootstrapQ.msg({
						msg : "删除临时保存内容失败 :" + +ret.msgInfo,
						type : 'danger',
						time : 1000,
					});
                }
            },
            error : function () {
                //bootstrapQ.alert("临时保存异常");
                bootstrapQ.msg({
					msg : "删除临时保存内容失败 :服务器异常",
					type : 'danger',
					time : 1000,
				});
            }
        });
    }
    
    //Markdown的图片截图粘贴接口
    document.addEventListener('paste', handlePasteImgEvent);
    function handlePasteImgEvent(event)
    {
    	if(!docInfo.edit || docInfo.edit == false)
    	{
    		return;
    	}

    	var  file = null;
    	//粘贴事件
        if (event.clipboardData || event.originalEvent)
        {
        	var clipboardData = (event.clipboardData || event.originalEvent.clipboardData);
        	console.log("handlePasteImgEvent clipboardData", clipboardData);
        	var items = clipboardData.items;
            if(items)
            {
            	console.log("handlePasteImgEvent items", items);
                for (var i = 0; i <items.length; i++)
                {
                	if (clipboardData.items[i].type.indexOf("image") !== -1)
                	{
                		file = items[i].getAsFile();
                        break;
                    }
                }
            }
        }

        if(file == null)
    	{
        	console.log("handlePasteImgEvent file is null");
        	return;
        }

        uploadMarkdownPic(file);

    	function uploadMarkdownPic(file)
    	{
			console.log("uploadMarkdownPic() file:", file);

			var xhr = new XMLHttpRequest();

			var form = new FormData();
			form.append("editormd-image-file", file);

			//上传表单
			var imgName =  file.lastModified + "_" + file.name;
			var path = base64_urlsafe_encode(gDocInfo.path);
    		var name = base64_urlsafe_encode(gDocInfo.name);
    		var imageUploadURL = "/DocSystem/Doc/uploadMarkdownPic.do?reposId=" + gReposInfo.id + "&docId=" + gDocInfo.docId + "&path="+ path + "&name="+ name + "&imgName=" + imgName;
      		if(gShareId)
      		{
      			imageUploadURL="&shareId="+gShareId;
      		}
    		xhr.open("post", imageUploadURL);
			xhr.send(form);

			//设置异步上传状态变化回调处a理函数
			xhr.onreadystatechange = function() {
				//文件上传状态
				console.log("xhr onreadystatechange() status:" + xhr.status + " readyState:" + xhr.readyState);
				if(xhr.status == 200)
				{
					if(xhr.readyState != 4)
					{
						//文件上传未结束
						return;
					}

					//上传成功！
					var ret = JSON.parse(xhr.responseText);
					console.log("uploadMarkdownPic ret", ret);
					if(1 == ret.success)
					{
						//上传失败
						console.log("上传成功");
				        VDocEditor.insertTextAtCursor("![]("+ ret.url +")");
					}
					else	//上传失败
					{
						//上传失败
						console.log("上传失败：" + ret.msgInfo);
						return;
		            }
				}else{
					if(xhr.status < 300)
					{
						//不是真正的异常
						return;
					}
					//上传失败
					console.log("系统异常: 上传异常！");
					return;
				}
			};
    	}

        //setImg Directly,以下代码可以直接将
        /*
        var render = new FileReader();
        render.onload = function (evt) {
            //输出base64编码
            var base64 = evt.target.result;
            document.getElementById('fileLogo').setAttribute('src',base64);
        }
        render.readAsDataURL(file);
        return;*/
    }
	
	//开放给外部的调用接口
	return {
		initForArtDialog: function(){
			initForArtDialog();
	    },
		initForNewPage: function(){
			initForNewPage();
	    },
        textEditorPageInit: function(docInfo){
        	textEditorPageInit(docInfo);
        },
		initForVDoc: function(){
			initForVDoc();
	    },
	    saveDoc: function(){
	    	return saveDoc();
	    },
	    ctrlZ: function(){
	    	return ctrlZ();
	    },
	    ctrlY: function(){
	    	return ctrlY();
	    },
	    enableEdit: function(){
	    	return _enableEdit(1);
	    },	    
	    exitEdit: function(){
	    	return _exitEdit(1);
	    },
	};
})();
