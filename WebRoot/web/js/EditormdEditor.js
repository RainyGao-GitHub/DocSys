//EditormdEditor类
var EditormdEditor = (function () {
	var docInfo = {};
	var docText = "";
	var tmpSavedDocText = "";
	var isContentChanged = false;
	var editState = false;
	var editor = {};	
    //supported command in message
	var commandMap = {
            'openDocument': function(data) {
                _loadDocument(data);
            },
        };
        
	function initEditor()
	{
  		console.log("EditormdEditor editorInit edit:" + edit);

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
                console.log("EditormdEditor onchange docInfo.edit:" + docInfo.edit);       
                isContentChanged = true;
	   		    console.log("textChange stackZ.size:" + stackZ.size() +  " stackY.size:" + stackY.size() +  " ctrlZY:" + isCtrlZY);
	   			if(false == isCtrlZY)
	   			{
	   				var content = editor.getValue();
	   				stackZ.push(content);
	   			}
           },
           onpreviewing : function () {
               console.log("EditormdEditor onpreviewing docInfo.edit:" + docInfo.edit);
               exitEditWiki();
           },
           onpreviewed :function () {
               console.log("EditormdEditor onpreviewed docInfo.edit:" + docInfo.edit);
               lockAndEditWiki();
           },
           onload : function () {
               console.log("EditormdEditor onload docInfo.edit:" + docInfo.edit + " edit:" + edit);	//这是markdown初始化完毕的回调（此时才可以访问makdown的接口）
	    		   this.previewing(); 		  //加载成默认是预览
	    		   this.setMarkdown(content); //内容需要在onload的时候进行加载，会触发onchange事件
	    		   isOnLoadTriggerChange = true;
	    		   if(!edit || edit == false)
    		   {
	    			   console.log("EditormdEditor onload edit is false");
    		   }
	    		   else
	    		   {
	    			   console.log("EditormdEditor onload edit is true");
	    			   lockAndEditWiki();
    		   }
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
				editor.setValue(p);
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
				editor.setValue(p);
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
		
		var content = editor.getValue();
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
					switchEditMode(true);
					return;
					}
				else
				{
					showErrorInfo("lockDoc Error:" + ret.msgInfo);
					return;
				}
			},
			error : function () 
			{
				showErrorInfo("lockDoc 异常");
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
				docType: docInfo.docType,
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
					return;
				}
			},
			error : function () 
			{
				showErrorInfo("exitEdit() unlockDoc 异常");
				return;
			}
		});
	}
	
	function switchEditMode(edit)
	{
		if(edit == true)
		{
			//显示工具条
			$("#toolBarMenu").show();
			
			//显示退出编辑按键
			$("#textEditorCloseBtn").show();
			
			//隐藏编辑按键
			$("#textEditorEditBtn").hide();
	
			//Enable Edit
			editor.previewing();
			editState = true;
			
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
			//隐藏工具条
			$("#toolBarMenu").hide();
			
			//隐藏退出编辑按键
			$("#textEditorCloseBtn").hide();
		
			//显示编辑按键
			$("#textEditorEditBtn").show();			
			
			//Disable Edit
			editor.previewed();
			editState = false;			

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
	        	var newContent = getMarkdown();
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
	    	return enableEdit();
	    },	    
	    exitEdit: function(){
	    	return exitEdit();
	    },
	};
})();
