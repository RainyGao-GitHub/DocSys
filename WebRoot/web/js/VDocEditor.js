/*
一、(function(){})(); 和 (function(){}()); 
1. (function(){})(); 
把函数当作表达式解析，然后执行解析后的函数
相当于 var a = function(){}; a(); a得到的是函数
2. (function(){}()); 
把函数表达式和执行当作语句直接执行
相当于 var a = function(){}(); a得到的是结果

最终结果是一样的
()只是起了 自执行的作用
和 () 一样的还有很多
比如 +function (){}
这个等于 (function (){}) 
一般用(function (){}) 还有个作用,就是 避免全局变量

二、什么是this
this，从字面上含义是(指较近的人或事物) 这，这个;
this：表示当前对象的一个引用。
this的指向：this不是固定不变的，是根据调用的上下文（执行时环境）改变而改变。

如果单独使用，this 表示全局对象。
在方法中，this 表示该方法所属的对象。
在函数中，this 表示全局对象。
在函数中，在严格模式下，this 是未定义的(undefined)。
在事件中，this 表示接收事件的元素。

<script>
	console.log(this); // 全局环境，即window对象下，this -> window 
	
	function fun() {
		console.log(this);
	}
	fun(); // fun() 实际上是window.fun(), 所以this -> window
	
	var obj1 = {
	    a: 1,
	    fun1: function() {
	        console.log(this);
	    },
	    obj2: {
	    	fun2: function() {
	    		console.log(this);
	    	}
	    }
	}
	obj1.fun1(); // fun1由obj调用，所以this -> obj1
	obj1.obj2.fun2(); // fun2由obj2调用，所以this -> obj2
	
	var Person = function() {
		this.name = "小刘"; // 这里的this -> obj对象
	}
	var obj = new Person();
</script>

*/

;(function(MxsdocAPI, window, document, undefined) {

	MxsdocAPI.VDocEditor = function(placeholderId, config) {
		console.log("VDocEditor() config", config);
		var _isAppReady = false;
		
		var _edit = false;	 //默认处于非编辑状态
		
		var _self = this,	//_self是指实例化后的对象
            _config = config || {};

        extend(_config, MxsdocAPI.VDocEditor.defaultConfig);
        console.log("VDocEditor() _config", _config);
        
        _config.frameEditorId = placeholderId;
        _config.parentOrigin = window.location.origin;

        var onMouseUp = function (evt) {
            _processMouse(evt);
        };

        var _attachMouseEvents = function() {
            if (window.addEventListener) {
                window.addEventListener("mouseup", onMouseUp, false)
            } else if (window.attachEvent) {
                window.attachEvent("onmouseup", onMouseUp);
            }
        };

        var _detachMouseEvents = function() {
            if (window.removeEventListener) {
                window.removeEventListener("mouseup", onMouseUp, false)
            } else if (window.detachEvent) {
                window.detachEvent("onmouseup", onMouseUp);
            }
        };

        var _onAppReady = function() {
        	console.log("VDocEditor _onAppReady() _config:", _config);
        	_isAppReady = true;

        	_attachMouseEvents();

            if (_config.docInfo) {
                _openDocument(_config.docInfo);
            }
        };
        
        var _onSwitchEditMode = function(data) {
        	console.log("VDocEditor _onSwitchEditMode() data:", data);
        	_edit = data;
        };
        
        var _onMessage = function(msg) {
        	console.log("VDocEditor _onMessage() msg:", msg);
            if ( msg ) 
            {
                var events = _config.events || {},
                        handler = events[msg.event],
                        res;
                //CommonEditor init ready
                if (msg.event === 'onAppReady') {
                	_onAppReady();
                }
                    
                //CommonEditor switched the edit Mode
                if (msg.event === 'onSwitchEditMode') {	
                	_onSwitchEditMode(msg.data);
                }

                if (handler && typeof handler == "function") {
                	res = handler.call(_self, {target: _self, data: msg.data});
                }
            }
        };

        var target = document.getElementById(placeholderId),
            iframe;

        if (target) {
        	_config.height = document.body.scrollHeight - target.scrollTop - 300;
        	//_config.height = document.documentElement.scrollHeight;
        	console.log("VDocEditor target height:" + _config.height);
        	
            iframe = createIframe(_config);
            if (iframe.src) {
            	console.log("VDocEditor iframe.src:" + iframe.src);
            	var pathArray = iframe.src.split('/');
                this.frameOrigin = pathArray[0] + '//' + pathArray[2];
            }
            
            target.parentNode && target.parentNode.replaceChild(iframe, target);
            var _msgDispatcher = new MessageDispatcher(_onMessage, this);
        }

        var _destroyEditor = function(cmd) {
            var target = document.createElement("div");
            target.setAttribute('id', placeholderId);

            if (iframe) {
                _msgDispatcher && _msgDispatcher.unbindEvents();
                _detachMouseEvents();
                iframe.parentNode && iframe.parentNode.replaceChild(target, iframe);
            }
        };
        
        var _processMouse = function(evt) {
            var r = iframe.getBoundingClientRect();
            var data = {
                type: evt.type,
                x: evt.x - r.left,
                y: evt.y - r.top,
                event: evt
            };

            _sendCommand({
                command: 'processMouse',
                data: data
            });
        };
        
        var _openDocument = function(doc) {
        	console.log("VDocEditor _openDocument() doc:", doc);
        	if(_isAppReady == true)
        	{
	            _sendCommand({
	                command: 'openDocument',
	                data: {
	                    doc: doc
	                }
	            });
        	}
        };
        
        var _getEditState = function() {
        	console.log("VDocEditor _getEditState() _edit:", _edit);
        	return _edit;
        };

        var _sendCommand = function(cmd) {
            if (iframe && iframe.contentWindow)
                postMessage(iframe.contentWindow, cmd);
        };
      
        return {
            attachMouseEvents   : _attachMouseEvents,
            detachMouseEvents   : _detachMouseEvents,
            destroyEditor       : _destroyEditor,
            openDocument		: _openDocument,
            getEditState		: _getEditState,
        }
    };


    MxsdocAPI.VDocEditor.defaultConfig = {
    	editor: 'stackedit',
        width: '100%',
        height: '100%',
    };

    MessageDispatcher = function(fn, scope) {
        var _fn     = fn,
            _scope  = scope || window,
            eventFn = function(msg) {
                _onMessage(msg);
            };

        var _bindEvents = function() {
            if (window.addEventListener) {
                window.addEventListener("message", eventFn, false)
            }
            else if (window.attachEvent) {
                window.attachEvent("onmessage", eventFn);
            }
        };

        var _unbindEvents = function() {
            if (window.removeEventListener) {
                window.removeEventListener("message", eventFn, false)
            }
            else if (window.detachEvent) {
                window.detachEvent("onmessage", eventFn);
            }
        };

        var _onMessage = function(msg) {
            // TODO: check message origin
        	console.log("VDocEditor MessageDispatcher _onMessage() msg:", msg);
            if (msg && window.JSON && _scope.frameOrigin==msg.origin ) {

                try {
                    var msg = window.JSON.parse(msg.data);
                    if (_fn) {
                        _fn.call(_scope, msg);
                    }
                } catch(e) {}
            }
        };
        
        _bindEvents.call(this);

        return {
            unbindEvents: _unbindEvents
        }
    };
    
    function getAppPath(config) {
    	console.log("getAppPath() editor:" + config.editor);
    	var path = "/DocSystem/web/stackeditForVDoc.html";
    	switch(config.editor)
    	{
		case "stackedit":
			path = "/DocSystem/web/stackeditForVDoc.html";
			break;
		case "ace":
			path = "/DocSystem/web/aceForVDoc.html";    			
			break;
		case "editormd":
			path = "/DocSystem/web/editormdForVDoc.html";    			
			break;
    	}
    	return path;
    }
    
    function getAppParameters(config) {
        var params = "?_version=2.02.50";
        if (config.frameEditorId)
            params += "&frameEditorId=" + config.frameEditorId;
        if (config.parentOrigin)
            params += "&parentOrigin=" + config.parentOrigin;
        
        if(config.docInfo)
        {
        	var docInfo = config.docInfo;
        	if(docInfo.vid)
        	{
        		params += "&reposId=" + docInfo.vid;
        	}

        	if(docInfo.docId)
        	{
        		params += "&docId=" + docInfo.docId;
        	}
        	
        	if(docInfo.path)
        	{
        		params += "&path=" + base64_encode(docInfo.path);
        	}
        	
        	if(docInfo.name)
        	{
        		params += "&name=" + base64_encode(docInfo.name);
        	}
        	
        	if(docInfo.shareId)
        	{
        		params += "&shareId=" + docInfo.shareId;
        	}
        }
        console.log("getAppParameters() params:", params);
        return params;
    }

    function createIframe(config) {
        var iframe = document.createElement("iframe");

        iframe.src = getAppPath(config) + getAppParameters(config);
        iframe.width = config.width;
        iframe.height = config.height;
        iframe.align = "top";
        iframe.frameBorder = 0;
        iframe.name = "frameEditor";
        iframe.allowFullscreen = true;
        iframe.setAttribute("allowfullscreen",""); // for IE11
        iframe.setAttribute("onmousewheel",""); // for Safari on Mac
        iframe.setAttribute("allow", "autoplay; camera; microphone; display-capture");
        
		if (config.type == "mobile")
		{
			iframe.style.position = "fixed";
            iframe.style.overflow = "hidden";
            document.body.style.overscrollBehaviorY = "contain";
		}
        return iframe;
    }

    function postMessage(wnd, msg) {
        console.log("VDocEditor postMessage() msg:", msg);

        if (wnd && wnd.postMessage && window.JSON) {
            // TODO: specify explicit origin
            wnd.postMessage(window.JSON.stringify(msg), "*");
        }

    }

    function extend(dest, src) {
        for (var prop in src) {
            if (src.hasOwnProperty(prop)) {
                if (typeof dest[prop] === 'undefined') {
                    dest[prop] = src[prop];
                } else
                if (typeof dest[prop] === 'object' &&
                        typeof src[prop] === 'object') {
                    extend(dest[prop], src[prop])
                }
            }
        }
        return dest;
    }

})(window.MxsdocAPI = window.MxsdocAPI || {}, window, document);

