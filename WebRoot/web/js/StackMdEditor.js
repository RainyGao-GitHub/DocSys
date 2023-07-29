//StackMdEditor类
var StackMdEditor = (function () {
	var _commonEditor; //It will be set when callback from commonEditor
	
	var _editor;		  			//编辑器句柄
	var _isReadOnly = true;			//true: 只读模式
	var _editorState = false;			//
	var _docInfo;					//_docInfo
	var _content = "";				//编辑器内容
	var _switchEditModeOnly = false;	//编辑器状态切换回调控制变量
    
	var _isReady = false; //用于处理编辑器初始化期间的一些异常事件
	
	var setContent = function(content)
	{	
		//TODO: 目前没有接口，通过onChange事件带回来的
		//console.log("StackMdEditor setContent() content:", content);
		_content = content;
		
		var stackeditEl = $(".stackedit-iframe");
		if (stackeditEl !== undefined) {
			stackeditEl[0].contentWindow.postMessage({"type":"setContent","content":content},"*")
		}
	};
	
	var getContent = function()
	{	
		//TODO: 目前没有接口，通过onChange事件带回来的
		return _content;
	};
	
	var setEditMode = function(state)
	{
		console.log("StackMdEditor setEditMode() state:" + state + " _editorState:" + _editorState);
		_editorState = state;
		setStaticEditReaOnly(state);
	};
	
	var onLoadDocument = function(docInfo){
		console.log("onLoadDocument() docInfo:", docInfo);	
		_docInfo = docInfo;
		
		checkAndSetIsReadOnly(docInfo);
	};
	
	var initEditor = function(docText, tmpSavedDocText, docInfo)
	{
		//如果传入了docInfo，那么docInfo在初始化的时候就进行设置
  		console.log("StackMdEditor initEditor() docInfo:", docInfo);
  		//console.log("StackMdEditor initEditor() docText:", docText);
  		
  		if(docInfo)
  		{
  			_docInfo = docInfo;
  		}
 
  		if(docText)
  		{
  			_content = docText;
  		}

		// 传入staticedit插件地址和文件内容，获取staticedit插件指定路径
		var url = getStaticEditUrl("/DocSystem/web/static/stackedit/dist/index.html", _content);
		// 获取iframe并设置其src路径，渲染stackEdit编辑器，加载待修改markdown文件
		var stackEditIframeEl = $(".stackedit-iframe");
		stackEditIframeEl.prop("src",url);

		//监听stackeidtor发来的消息
		window.addEventListener('message', messageHandler);
	};
	
	/**
	 * staticEdit消息事件处理
	 *
	 * @param event 事件对象
	 */
	function messageHandler(event) {
		console.log("StackMdEditor messageHandler() event:", event);
		switch (event.data.type) 
		{
			case 'ready':
				_isReady = true;
				if(_docInfo)
				{
					onLoadDocument(_docInfo);
				}
				
				// iframe 页面加载完成,设置当前页面为只读
				setEditMode(false);
				
				_commonEditor.appReady();
				break;
			case 'fileChange':
				console.log("StackMdEditor fileChange");
				if(_isReady == true)
				{
					//TODO: fileChange事件以后不要直接把内容带回来
					var newContent = event.data.payload.content.text;
					if(_content != newContent)
					{
						//console.log("StackMdEditor fileChange _content:", _content);
						//console.log("StackMdEditor fileChange newContent:", newContent);
						_content = newContent;
						_commonEditor.contentChangeHandler();
					}
				}
				break;
			case 'close':
				console.log("StackMdEditor close");
				//收到iframe的关闭消息
				var artDialog = top.dialog.get(window);
				artDialog.close();
				break;
			case 'saveChange':
				console.log("StackMdEditor saveChange");
				if(_isReady == true)
				{
					_commonEditor.saveDoc();
				}
				break;
			case 'changeView':
              	console.log("StackMdEditor changeView() _editorState:" + _editorState);
              	if(_isReady == true)
				{        
					var state = !event.data.flag;
					console.log("StackMdEditor changeView() _editorState:" +  _editorState + " state:" + state);
					if(_editorState != state)
					{
						_editorState = state;
						if(_editorState == true)
						{
							_commonEditor.enableEdit(enableEditCallback2);
						}
						else
						{
					      	_commonEditor.exitEdit(exitEditCallback2);						      	
						}
					}
				}
				break;
			case 'uploadImages':
				console.log("StackMdEditor uploadImages");
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
	
	//抽象编辑器的以下接口, 通过config参数传递给_commonEditor
	var config = {
		"initEditor": initEditor,
		"setContent": setContent,
		"getContent": getContent,
		"setEditMode": setEditMode,			
		"onLoadDocument": onLoadDocument,
	};
	
	function init(mode, docInfo)
	{
		console.log("StackMdEditor init() mode:", mode);
		_commonEditor = new MxsdocAPI.CommonEditor(config);
		switch(mode)
		{
		case "ArtDialog":
			_commonEditor.initForArtDialog();
			break;
		case "NewPage":
			_commonEditor.initForNewPage();
			break;
		case "BootstrapDialog":
			_commonEditor.initForBootstrapDialog(docInfo);
			break;
		case "VDoc":
			_commonEditor.initForVDoc();
			break;
		}					
	}
	
	function checkAndSetIsReadOnly(docInfo)
	{
		if(docInfo.docType == 2)
		{
			_isReadOnly = false;
			return;
		}
		
		if(docInfo.isZip && docInfo.isZip == 1)
		{
			_isReadOnly = true;
			return;
		}
		if(docInfo.isHistory && docInfo.isHistory == 1)
		{
			_isReadOnly = true;
			return;
		}
	}
	
	/**
	 * 图片上传
	 */
	function getImageUploadBaseURL(docInfo)
	{
		//上传表单
		var path = base64_urlsafe_encode(docInfo.path);
		var name = base64_urlsafe_encode(docInfo.name);
		
		var url = "/DocSystem/Doc/uploadMarkdownPic.do?reposId=" + docInfo.vid + "&docId=" + docInfo.docId + "&path="+ path + "&name="+ name;
		if(docInfo.shareId) {
			url += "&shareId="+_docInfo.shareId;
		}
		return url;
	}
	
	function uploadMarkdownPic(file) {
		console.log("StackMdEditor uploadMarkdownPic() _docInfo:", _docInfo);
		var imageUploadBaseURL = getImageUploadBaseURL(_docInfo);
		var imgName =  file.lastModified + "_" + file.name;
		var imageUploadURL = imageUploadBaseURL + "&imgName=" + imgName;
		
		var xhr = new XMLHttpRequest();
		var form = new FormData();
		form.append("editormd-image-file", file);
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
		var params = {
			origin: origin,
			//fileName: fileName,
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
	
    //EnableEditBtn触发的EnableEdit，此时编辑器状态未发生任何变化，因此如果失败的话则不需要进行任何处理，如果成功的话则需要切换编辑器状态
    var enableEditCallback1 = function (ret)
    {
    	console.log("StackMdEditor enableEditCallback1() ret:", ret);
    	if(ret == undefined || ret.status == undefined)	//enableEdit异常
    	{
    		return;
    	}
    	
    	if(ret.status != "ok")
    	{
    		//enableEdit失败
    		return;
    	}
    	
    	//切换编辑器状态
    	setEditMode(true);
    };
    
    //编辑器状态切换回调触发的EditEnable，此时编辑器状态已切换，因此如果成功的话则不需要进行任何处理，如果失败的话则需要切换编辑器状态
    var enableEditCallback2 = function (ret)
    {
    	console.log("StackMdEditor enableEditCallback2() ret:", ret);
    	if(ret == undefined || ret.status == undefined)	//enableEdit异常
    	{
    		//切换编辑器状态
        	setEditMode(false);
    		return;
    	}
    	
    	if(ret.status != "ok")
    	{
        	//切换编辑器状态
        	setEditMode(false);
    		return;
    	}

    };
	
    //ExitEditBtn触发的exitEdit，此时编辑器状态未发生任何变化，因此如果失败的话则不需要进行任何处理，如果成功的话则需要切换编辑器状态
    var exitEditCallback1 = function (ret)
    {
    	console.log("StackMdEditor exitEditCallback1() ret:", ret);
    	if(ret == undefined || ret.status == undefined)	//异常
    	{
    		return;
    	}
    	
    	if(ret.status != "ok")
    	{
    		//exitEdit失败
    		return;
    	}
    	
    	//切换编辑器状态
    	setEditMode(false);
    };
    
    //编辑器状态切换回调触发的EditEnable，此时编辑器状态已切换，因此如果成功的话则不需要进行任何处理，如果失败的话则需要切换编辑器状态
    var exitEditCallback2 = function (ret)
    {
    	console.log("StackMdEditor exitEditCallback2() ret:", ret);
    	if(ret == undefined || ret.status == undefined)	//enableEdit异常
    	{
    		//切换编辑器状态
        	setEditMode(true);
    		return;
    	}
    	
    	if(ret.status != "ok")
    	{
        	//切换编辑器状态
        	setEditMode(true);
    		return;
    	}    	
    };
	
	//开放给外部的调用接口
	return {
		init: function(mode, docInfo){
			init(mode, docInfo);					
		},
	    ctrlZ: function(){
	    	_commonEditor.ctrlZ();
	    },
	    ctrlY: function(){
	    	_commonEditor.ctrlY();
	    },
	    enableEdit: function(){
	    	_commonEditor.enableEdit(enableEditCallback1);
	    },	    
	    exitEdit: function(){
	    	_commonEditor.exitEdit(exitEditCallback1);
	    },
	    saveDoc: function(){
	    	_commonEditor.saveDoc();
	    },
	}
})();