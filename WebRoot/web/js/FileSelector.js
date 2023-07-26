//FileSelector类
;(function(MxsdocAPI, window, document, undefined) {

	MxsdocAPI.FileSelector = function(config) {
		console.log("FileSelector config:", config);
		
		var _self = this,	//_self是指实例化后的对象
        _config = config || {};
        	
	    var _postMessage = function(msg) {
	    	console.log("FileSelector _postMessage() msg:", msg);
		    if (window.parent && window.JSON) {
		            msg.frameEditorId = window.frameEditorId;
		            window.parent.postMessage(window.JSON.stringify(msg), "*");
		    }
	    };
	    
	  	//消息交互接口
	    function _onAppReady()
	    {
	    	//Do nothing
	    }
	    
	    function _onConfirmSelect(data)
	    {
	    	//设置 docPath
	    	//close
	    	_unbindEvents(_onMessage);
	    }

	    function onCancelSelect()
	    {
	    	//close
	    	_unbindEvents(_onMessage);
	    }
	    
	    function _onClose()
	    {
	    	//close
	    	_unbindEvents(_onMessage);
	    }

		var commandMap = {
				'onAppReady': function() {
	                _onAppReady();	//fileSelector页面初始化完成
	            },
				'onConfirmSelect': function(data) {
	                _onConfirmSelect(data);	//fileSelector 确定文件选择: data是选中的文件信息, 需要关闭artDialog页面，取消监听线程
	            },
	            'onCancelSelect': function() {
	                _onCancelSelect();	//fileSelector 取消文件选择: 关闭artDialog页面，取消监听线程
	            },
	            'onClose': function() {
	                _onClose();	//fileSelector 窗口被关闭: 关闭artDialog页面，取消监听线程
	            },
	        };
		
	    var _onMessage = function(msg) {
	        console.log("FileSelector _onMessage() msg:", msg);
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
				
		function showErrorInfo(msg)
		{
			bootstrapQ.msg({
				msg : msg,
				type : 'warning',
				time : 5000,
			    }); 
		}
		
        var _bindEvents = function(eventFn) {
            if (window.addEventListener) {
                window.addEventListener("message", eventFn, false)
            }
            else if (window.attachEvent) {
                window.attachEvent("onmessage", eventFn);
            }
        };

        var _unbindEvents = function(eventFn) {
            if (window.removeEventListener) {
                window.removeEventListener("message", eventFn, false)
            }
            else if (window.detachEvent) {
                window.detachEvent("onmessage", eventFn);
            }
        };
        
        function showFileSelectorInArtDialog(data) {
        	//获取窗口的高度并设置高度
        	var height =  getArtDialogInitHeight();
        	var width = getArtDialogInitWidth();
        	var fileSelectorId = data.fileSelectorId;
        	var ArtDialogDivContentId = "div[aria-describedby='content:ArtDialog"+fileSelectorId+"']";
        	var ArtDialogId = "ArtDialog"  + fileSelectorId;
        	var d = new artDialog({
        		id: "ArtDialog" + fileSelectorId,
        		title: data.title,
        		content: '<iframe frameborder="0" name="ArtDialog' + fileSelectorId + '" src="fileSelectorForArt.html?fileSelectorId=' + fileSelectorId + '" style="width: 100%; height: 100%; border: 0px;" allowtransparency="true" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true" sandbox="allow-forms allow-popups allow-scripts allow-modals allow-same-origin allow-downloads"></iframe>',
        		msg: '页面正在加载，请稍等...',
        		foot: false,
        		big: true,
        		padding: 0,
        		width: width,
        		height: height,
        		resize: true,
        		drag: true,
        		data: data,
        		cancel: function () {
        			console.log("showFileSelectorInArtDialog data:",data);
        			_unbindEvents(_onMessage);
        			return true;
        		}
        	});
        	
        	if (window.artDialogList === undefined) {
        		window.artDialogList = {};
        	}
        	window.artDialogList["ArtDialog" + fileSelectorId] = d;
        	// 去除最后一列的按钮栏
        	$("."+ArtDialogId+" .aui-footer").parent().remove();
        }
        
		function _init()
		{
			console.log("FileSelector _init() _config:", _config);

			//open fileSelector.html in artDialog
			showFileSelectorInArtDialog(_config);
			
			//监听来自fileSelector的消息
			_bindEvents(_onMessage);
		}
		
		function _close(){
			_unbindEvents(_onMessage);
		}		
				
		
		//开放给外部的调用接口
		return {
			init: function(){
				_init();
		    },
		    close: function(){
		    	_close();
		    },
		}
	};
})(window.MxsdocAPI = window.MxsdocAPI || {}, window, document);
