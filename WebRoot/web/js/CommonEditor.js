//CommonEditor类
;(function(MxsdocAPI, window, document, undefined) {

	MxsdocAPI.CommonEditor = function(config) {
		console.log("CommonEditor config:", config);
		
		var _self = this,	//_self是指实例化后的对象
        _config = config || {};
        
        var _docInfo;
		var _docText = "";
		var _tmpSavedDocText;
		var _isContentChanged = false;
		var _editState = false;
		var _autoSaveTimer;
	  	var _timerState = 0;
	  	
	  	var _isDynamicMode = false;	//true: 编辑器预加载模式(文件内容需要在AppReady之后进行显示，适用于需切换文件的场景)  false:文件内容在编辑器初始化时显示
		
		//****** Editor的抽象接口 Start ********
		//使用回调方式实现，因此具体的实现函数是通过config传入的
		function _initEditor(content, tmpSavedContent, docInfo)
		{
			console.log("CommonEditor _initEditor() docInfo:", docInfo);
			//console.log("CommonEditor _initEditor() _docText:", content);
			_docText = content;
			_tmpSavedDocText = tmpSavedContent;
			_config.initEditor(content, tmpSavedContent, docInfo);
		}
		
		function _setContent(content)
		{
	  		_config.setContent(content);
		}

		function _getContent()
		{
			return _config.getContent();
		}

		function _setEditMode(mode)
		{
			console.log("CommonEditor _setEditMode() mode", mode);
	  		_config.setEditMode(mode);
		}
		
	    function _onLoadDocument(docInfo)
	    {
	    	console.log("CommonEditor _onLoadDocument() docInfo", docInfo);
	  		_config.onLoadDocument(docInfo);
	    }
		//****** Editor的抽象接口 End ********

		//Init For ArtDialog
		function initForArtDialog()
		{
			console.log("CommonEditor initForArtDialog()");
	
			var params = GetRequest();
			var docid = params['docid'];
			//获取artDialog父窗口传递过来的参数
			var artDialog2 = window.top.artDialogList['ArtDialog' + docid];
			if (artDialog2 == null) {
				artDialog2 = window.parent.artDialogList['ArtDialog' + docid];
			}
			// 获取对话框传递过来的数据
			_docInfo = artDialog2.config.data;
			if(_docInfo.docType == undefined)
			{
				_docInfo.docType = 1;	//RealDoc
			}
			
			console.log("CommonEditor initForArtDialog() _docInfo:", _docInfo);
	
			if (!_docInfo.fileSuffix) {
				_docInfo.fileSuffix = getFileSuffix(_docInfo.name);
			}
			
			getDocText(_docInfo, _initEditor, showErrorInfo);	
		}
		
		//Init For NewPage
		function initForNewPage()
		{
			console.log("CommonEditor initForNewPage()");
			
		    _docInfo = getDocInfoFromRequestParamStr();
		    if(_docInfo.docType == undefined)
		    {
		    	_docInfo.docType = 1;	//RealDoc
		    }
		    
		    document.title = _docInfo.name;
		    
		    console.log("CommonEditor initForNewPage() _docInfo:", _docInfo);
		    
			if (!_docInfo.fileSuffix) {
				_docInfo.fileSuffix = getFileSuffix(_docInfo.name);
			}
			
			getDocText(_docInfo, _initEditor, showErrorInfo);	
		}
		
		//Init For Bootstrap Dialog
		function initForBootstrapDialog(Input_doc)
		{
			console.log("CommonEditor initForBootstrapDialog()");

			_docInfo = Input_doc;		
			if(_docInfo.docType == undefined)
			{
				_docInfo.docType = 1;	//RealDoc
			}
			
			console.log("CommonEditor initForBootstrapDialog() _docInfo:", _docInfo);
			
			if (!_docInfo.fileSuffix) {
				_docInfo.fileSuffix = getFileSuffix(_docInfo.name);
			}	
			
			getDocText(_docInfo, _initEditor, showErrorInfo);
	  	}
		
		//Init For VDoc 
		function initForVDoc()
		{
			console.log("CommonEditor initForVDoc()");
			_isDynamicMode = true;

			_initEditor("", "", undefined);
			
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
		
		//For VDoc
		function appReady(){
			if(_isDynamicMode)
			{
				//只有动态加载模式才需要在appReady之后加载文件
				console.log("CommonEditor appReady()");
				//Notify VDocEditor that eidtor is ready
			    _postMessage({ event: 'onAppReady' });
			        
			    if(checkDocInfo(_docInfo))
			    {
			    	console.log("CommonEditor appReady() _docInfo:", _docInfo);
					_tmpSavedDocText = undefined;	//重新获取文件内容前清空临时文件内容
			    	getDocText(_docInfo, showText, showErrorInfo);			
					_onLoadDocument(_docInfo);
			    }			
			}
		}
		
		//For VDoc
		var openDocument = function(data){
			_docInfo = data.doc;
			if(checkDocInfo(_docInfo))
		    {
				_docInfo.docType = 2;
				document.title = _docInfo.name;
			    
			    // 初始化文档信息
				console.log("CommonEditor openDocument() _docInfo:", _docInfo);
				_tmpSavedDocText = undefined;	//重新获取文件内容前清空临时文件内容
				getDocText(_docInfo, showText, showErrorInfo);
				_onLoadDocument(_docInfo);
		    }
		};
		
		//For VDoc
		function checkDocInfo(doc)
		{
			if(doc == undefined)
			{
				console.log("CommonEditor checkDocInfo() doc is null", doc);
				return false;
			}
			
			if(doc.vid == undefined)
			{
				console.log("CommonEditor checkDocInfo() doc.vid is null", doc);
				return false;
			}	
			return true;
		}
		
		//For VDoc
	    var _postMessage = function(msg) {
	    	if(_isDynamicMode)
	    	{
		    	console.log("CommonEditor _postMessage() msg:", msg);
		        // TODO: specify explicit origin
		        if (window.parent && window.JSON) {
		            msg.frameEditorId = window.frameEditorId;
		            window.parent.postMessage(window.JSON.stringify(msg), "*");
		        }
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
			_docText = docText;
			_tmpSavedDocText = tmpSavedDocText;
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
		
		function checkContentChange()
		{
			if(_isContentChanged == true)
			{
				//content change event received
				console.log("CommonEditor checkContentChange() _isContentChanged:", _isContentChanged);
				return true;
			}
			
			var newContent = _getContent();
			if(_docText != newContent)
			{
				//console.log("CommonEditor checkContentChange() _docText:", _docText);
				//console.log("CommonEditor checkContentChange() newContent:", newContent);
				console.log("CommonEditor checkContentChange() _isContentChanged == false, but content is changed");
				return true;
			}
			
			return false;
		}
		
		function saveDoc()
		{
			console.log("CommonEditor saveDoc _docInfo.docId:" + _docInfo.docId);
			
			//TODO: 应该check的时候把_docText改成最新内容
			if(checkContentChange() == false)
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
		            reposId: _docInfo.vid,
		        	docId : _docInfo.docId,
		        	path: _docInfo.path,
		            name: _docInfo.name,
		        	content : content,
		        	docType: _docInfo.docType, //RealDoc
		            shareId: _docInfo.shareId,
		        },
		        success : function (ret) {
		            if( "ok" == ret.status ){
		                console.log("保存成功 : " , (new Date()).toLocaleDateString());
		                _docText = content;
		                _isContentChanged = false;
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
		
		function enableEdit(callback)
		{
			console.log("CommonEditor enableEdit() _editState:" + _editState);
			//if(_editState == true)
			//{
			//	var result = {};
			//	result.status = "ok";
			//	callback && callback(result);
			//	return;
			//}
			
			if(_docInfo == undefined || _docInfo.docId == undefined)
			{
				callback && callback();
				showErrorInfo("文件信息不能为空");
				return;
			}
		
			$.ajax({
				url : "/DocSystem/Doc/lockDoc.do",
				type : "post",
				dataType : "json",
				data : {
					lockType : 1, //LockType: Normal Lock
					reposId : _docInfo.vid, 
					docId : _docInfo.docId,
					path: _docInfo.path,
					name: _docInfo.name,
					docType: _docInfo.docType,
		            shareId: _docInfo.shareId,
				},
				success : function (ret) {
					callback && callback(ret);
					if("ok" == ret.status)
					{
						switchEditState(true);
					}
					else
					{
						showErrorInfo("lockDoc 失败:" + ret.msgInfo);							
					}
				},
				error : function () 
				{
					callback && callback();
					showErrorInfo("lockDoc 异常");
					return;
				}
			});
		}
		
		function exitEdit(callback) {   	
			console.log("CommonEditor exitEdit() _editState:" + _editState);
			//if(_editState == false)
			//{
			//	var result = {};
			//	result.status = "ok";
			//	callback && callback(result);
			//	return;
			//}
			
			if(_docInfo == undefined || _docInfo.docId == undefined)
			{
				callback && callback();
				showErrorInfo("文件信息为空");
				return;
			}
			
			$.ajax({
				url : "/DocSystem/Doc/unlockDoc.do",
				type : "post",
				dataType : "json",
				data : {
					lockType : 1, //unlock the doc
					reposId : _docInfo.vid, 
		        	docId : _docInfo.docId,
					path: _docInfo.path,
					name: _docInfo.name,
					docType: _docInfo.docType,
		            shareId: _docInfo.shareId,
				},
				success : function (ret) {
					callback && callback(ret);
					if("ok" == ret.status)
					{
						switchEditState(false);
					}
					else
					{
						showErrorInfo("unlockDoc 失败:" + ret.msgInfo);	
					}
				},
				error : function () 
				{
					callback && callback();
					showErrorInfo("unlockDoc 异常");
					return;
				}
			});
		}
		
		function switchEditState(state)
		{
			//更新编辑器状态
			_editState = state;
			_docInfo.edit = state;
			if(_editState == true)
			{
				_postMessage({ event: 'onSwitchEditMode', data: _editState });
	
				//Start beat thread to keep 
				startBeatThread();
				
				//启动内容自动保存线程
				startAutoTmpSaver();
					
				if(_tmpSavedDocText && _tmpSavedDocText != _docText)
				{
					bootstrapQ.confirm({
						id: "loadContentConfirm",
						title: "加载确认",
						msg : "上次有未保存的编辑内容，是否加载？",
					},function () {
				    	//alert("点击了确定");
						_setContent(_tmpSavedDocText);
						_tmpSavedDocText = undefined;	//清空_tmpSavedDocText
				    	return true;   
				 	},function (){
				 		//alert("点击了取消");
				        _tmpSavedDocText = _docText;
				        deleteTmpSavedContent(_docInfo);
				        return true;
				 	});
				}
			}
			else
			{
				_postMessage({ event: 'onSwitchEditMode', data: _editState });
									
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
		        if(_editState == true)
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
					reposId : _docInfo.vid, 
					docId : _docInfo.docId,
					path: _docInfo.path,
					name: _docInfo.name,
					docType: _docInfo.docType,
		            shareId: _docInfo.shareId,
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
			console.log("CommonEditor startAutoTmpSaver _timerState:" + _timerState);
			if(_timerState == 0)
			{
				_timerState = 1;
				_autoSaveTimer = setInterval(function () {
		        	var newContent = _getContent();
		        	if(!_tmpSavedDocText)
		        	{
		        		_tmpSavedDocText = "";
		        	}
		        	
					if(_tmpSavedDocText != newContent)
		    		{
		    			console.log("autoTmpSaveWiki");
		    			tmpSaveDoc(_docInfo, newContent);
		    			_tmpSavedDocText = newContent;
		    		}
		    	},20000);
		    }
		}
	
		function stopAutoTmpSaver(){
			console.log("CommonEditor stopAutoTmpSaver _timerState:" + _timerState);
			if(_timerState == 1)
			{
				_timerState = 0;
				clearInterval(_autoSaveTimer);
			}
		}
		
	    //文件临时保存操作
	    function tmpSaveDoc(docInfo, content){
	    	console.log("tmpSaveDoc docInfo:", docInfo);
	    	console.log("tmpSaveDoc content:", content);
	    	$.ajax({
	            url : "/DocSystem/Doc/tmpSaveDocContent.do",
	            type : "post",
	            dataType : "json",
	            data : {
	            	reposId: docInfo.vid,
	                path: docInfo.path,
	                name: docInfo.name,
	                content : content,
	                docType : docInfo.docType,
	                shareId : docInfo.shareId,
	            },
	            success : function (ret) {
	    	    	console.log("tmpSaveDoc ret:", ret);
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
							msg : "临时保存失败 :" + ret.msgInfo,
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
	    function deleteTmpSavedContent(docInfo)
	    {	
	        $.ajax({
	            url : "/DocSystem/Doc/deleteTmpSavedDocContent.do",
	            type : "post",
	            dataType : "json",
	            data : {
	            	reposId: docInfo.vid,
	                path: docInfo.path,
	                name: docInfo.name,
	                docType: docInfo.docType,
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
					_setContent(p);
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
					_setContent(p);
					console.log("ctrlY stackZ.size:" + stackZ.size() +  " stackY.size:" + stackY.size() + " ctrlZY:" + isCtrlZY);
					isCtrlZY = false;
				}
			}
		}
		
		function contentChangeHandler(){
			console.log("CommonEditor contentChangeHandler() stackZ.size:" + stackZ.size() +  " stackY.size:" + stackY.size() +  " ctrlZY:" + isCtrlZY);
			_isContentChanged = true;
			if(false == isCtrlZY)
			{
				var content = _getContent();
				stackZ.push(content);
			}			
		}
		
		//开放给外部的调用接口
		return {
			initForArtDialog: function(){
				initForArtDialog();
		    },
			initForNewPage: function(){
				initForNewPage();
		    },
		    initForBootstrapDialog: function(docInfo){
		    	initForBootstrapDialog(docInfo);
	        },
			initForVDoc: function(){
				initForVDoc();
		    },
		    appReady: function(){
		    	appReady();
		    },
		    saveDoc: function(){
		    	saveDoc();
		    },
		    enableEdit: function(callback){
		    	enableEdit(callback);
		    },	    
		    exitEdit: function(callback){
		    	exitEdit(callback);
		    },
		    contentChangeHandler: function(){
		    	contentChangeHandler();
		    },
		    ctrlZ: function(){
		    	ctrlZ();
		    },
		    ctrlY: function(){
		    	ctrlY();
		    },
		}
	};
})(window.MxsdocAPI = window.MxsdocAPI || {}, window, document);
