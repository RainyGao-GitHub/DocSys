//CommonEditor类
;(function(MxsdocAPI, window, document, undefined) {

	MxsdocAPI.CommonEditor = function(config) {
		console.log("CommonEditor config:", config);
		
		var _self = this,	//_self是指实例化后的对象
        _config = config || {};
        
        var docInfo = {};
		var docText = "";
		var tmpSavedDocText = "";
		var isContentChanged = false;
		var editState = false;
		var autoSaveTimer;
	  	var timerState = 0;
	  	var isOnLoadTriggerChange = false;
		
		//****** Editor的抽象接口 Start ********
		//使用回调方式实现，因此具体的实现函数是通过config传入的
		function _initEditor()
		{
	  		var handler = _config.initEditor;
	  		if (handler && typeof handler == "function") {
                handler.call(_self);
            }
		}
		
		function _setContent(content)
		{
	  		var handler = _config.setContent;
	  		if (handler && typeof handler == "function") {
                handler.call(_self, content);
            }
		}

		function _getContent()
		{
	  		var handler = _config.getContent;
	  		if (handler && typeof handler == "function") {
                return handler.call(_self);
            }
		}

		function _setEditMode(mode)
		{
	  		var handler = _config.setEditMode;
	  		if (handler && typeof handler == "function") {
                handler.call(_self, mode);
            }
		}
		
	    function _onLoadDocument(docInfo)
	    {
	  		var handler = _config.onLoadDocument;
	  		if (handler && typeof handler == "function") {
                handler.call(_self, docInfo);
            }	    	
	    }
		//****** Editor的抽象接口 End ********
		
		function initEditor()
		{
	  		console.log("CommonEditor initEditor()");
	  		_initEditor();
		}
		
		//Init For ArtDialog
		function initForArtDialog()
		{
			console.log("CommonEditor initForArtDialog()");

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
			
			console.log("CommonEditor initForArtDialog() docInfo:", docInfo);
	
			if (!docInfo.fileSuffix) {
				docInfo.fileSuffix = getFileSuffix(docInfo.name);
			}
			
			getDocText(docInfo, showText, showErrorInfo);
		}
		
		//Init For NewPage
		function initForNewPage()
		{
			console.log("CommonEditor initForNewPage()");

			initEditor();
			
		    docInfo = getDocInfoFromRequestParamStr();
		    docInfo.docType = 1;	//RealDoc
		    
		    document.title = docInfo.name;
		    
		    console.log("CommonEditor initForNewPage() docInfo:", docInfo);
		    
			if (!docInfo.fileSuffix) {
				docInfo.fileSuffix = getFileSuffix(docInfo.name);
			}
			
			getDocText(docInfo, showText, showErrorInfo);
		}
		
		//Init For Bootstrap Dialog
		function textEditorPageInit(Input_doc)
		{
			console.log("CommonEditor textEditorPageInit()");

			initEditor();
			
			docInfo = Input_doc;		
			docInfo.docType = 1;	//RealDoc
		    
			console.log("CommonEditor textEditorPageInit() docInfo:", docInfo);
			
			if (!docInfo.fileSuffix) {
				docInfo.fileSuffix = getFileSuffix(docInfo.name);
			}
			
			getDocText(docInfo, showText, showErrorInfo);	  	
	  	}
		
		//Init For VDoc 
		function initForVDoc()
		{
			console.log("CommonEditor initForVDoc()");
			
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
		}
		
		function appReady(){
			console.log("CommonEditor appReady()");
	        //Notify VDocEditor that eidtor is ready
	        _postMessage({ event: 'onAppReady' });			
		}
		
		var openDocument = function(data){
			docInfo = data.doc;
			docInfo.docType = 2;
			
		    document.title = docInfo.name;
		    
		    // 初始化文档信息
			console.log("CommonEditor openDocument() docInfo:", docInfo);
			
			getDocText(docInfo, showText, showErrorInfo);	
			
			_onLoadDocument(docInfo);
		};
		
	    var _postMessage = function(msg) {
	        console.log("CommonEditor _postMessage() msg:", msg);
	
	        // TODO: specify explicit origin
	        if (window.parent && window.JSON) {
	            msg.frameEditorId = window.frameEditorId;
	            window.parent.postMessage(window.JSON.stringify(msg), "*");
	        }
	    };
	    
	  	//消息交互接口
		var commandMap = {
	            'openDocument': function(data) {
	                openDocument(data);
	            },
	        };
		
	    var _onMessage = function(msg) {
	        console.log("CommonEditor _onMessage() msg:", msg);
	
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
		
		function showText(docText, tmpSavedDocText)
		{
			console.log("CommonEditor showText()");
			//这里可以机上docText和tmpSavedDocText是否一致，以及用户的选择来来确定需要加载内容
			_setContent(docText);
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
				for (var i = 0; i < strs.length; i++) {
					theRequest[strs[i].split("=")[0]] = unescape(strs[i].split("=")[1]);
				}
			}
			return theRequest;
		}
		
		function saveDoc()
		{
			console.log("CommonEditor saveDoc docInfo.docId:" + docInfo.docId);
			
			if(isContentChanged == false)
			{
			   	console.log("CommonEditor saveDoc there is no change");
				return;
			}
			
			var content = _getContent();
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
		
		function enableEdit(switchMode)
		{
			console.log("CommonEditor enableEdit() switchMode:" + switchMode);
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
		function exitEdit(switchMode) {   	
			console.log("CommonEditor exitEdit()  switchMode:" + switchMode);
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
				_setEditMode(editState);
				return;
			}
			
			if(editState == true)
			{
				_postMessage({ event: 'onSwitchEditMode', data: editState });
	
				if(mode == 1)
				{
					//TODO: 如果主动设置编辑器状态，会触发回调则需要设置
					switchEditModeOnly = true;
					//Enable Edit
					_setEditMode(true);
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
						_setContent(tmpSavedDocText);
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
					
				if(mode == 1)
				{
					//TODO: 如果主动设置编辑器状态，会触发回调则需要设置
					switchEditModeOnly = true;
					//Disable Edit
					_setEditMode(false);
				}
				
				//关闭内容自动保存线程
				stopAutoTmpSaver();
			}
		}
		
		function startBeatThread()
		{
			//启动超时定式器
			var timeOut = 180000; //超时时间3分钟
		    console.log("CommonEditor startBeatThread() with " + timeOut + " ms");
		    setTimeout(function () {
		        if(editState == true)
		    	{
		        	console.log("CommonEditor startBeatThread() refreshDocLock");
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
		
		function startAutoTmpSaver()
		{ 
			console.log("CommonEditor startAutoTmpSaver timerState:" + timerState);
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
			console.log("CommonEditor stopAutoTmpSaver timerState:" + timerState);
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
		    appReady: function(){
		    	appReady();
		    },
		    saveDoc: function(){
		    	return saveDoc();
		    },
		    enableEdit: function(mode){
		    	return enableEdit(mode);
		    },	    
		    exitEdit: function(mode){
		    	return exitEdit(mode);
		    },
		}
	};
})(window.MxsdocAPI = window.MxsdocAPI || {}, window, document);
