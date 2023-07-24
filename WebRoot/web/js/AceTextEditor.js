//AceTextEditor类
var AceTextEditor = (function () {
	var _commonEditor; //It will be set when callback from _commonEditor
	
	var _editor;		  		//编辑器句柄
	var _editorState = false;	//
	var _docInfo;				//_docInfo
	var _content = "";			//编辑器内容
	
	var setContent = function(content)
	{	
		_editor.setValue(content);
	};

	var getContent = function()
	{	
		return _editor.getValue();
	};

	var setEditMode = function(state)
	{
		console.log("AceTextEditor setEditMode() state:" + state + " _editorState:" + _editorState);
		_editorState = state;
		if(state == true)
		{	
			//显示工具条
			$("#toolBarMenu").show();
			//显示退出编辑按键
			$("#textEditorCloseBtn").show();
			//隐藏编辑按键
			$("#textEditorEditBtn").hide();
	
			//Enable Edit
			_editor.setReadOnly(false);
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
			_editor.setReadOnly(true);
		}
	};
	
	var onLoadDocument = function(docInfo){
		console.log("AceTextEditor onLoadDocument() docInfo:", docInfo);
		_docInfo = docInfo;
		
		checkAndSetFileShowMode(docInfo);
		checkAndSetEditBtn(docInfo);
	};
	
	var initEditor = function(docText, tmpSavedDocText, docInfo)
	{
		console.log("AceTextEditor initEditor() docInfo:", docInfo);
		
		//如果传入了docInfo，那么docInfo在初始化的时候就进行设置
		if(docInfo)
  		{
  			_docInfo = docInfo;
  		}
		
  		if(docText)
  		{
  			_content = docText;
  		}
  		
		_editor = ace.edit("editor");
		_editor.setTheme("ace/theme/twilight");
		//_editor.setTheme("ace/theme/chrome");
		//_editor.setTheme("ace/theme/tomorrow_night");
		_editor.session.setMode("ace/mode/text");
		_editor.setReadOnly(true); // false to make it editable
		_editor.getSession().on('change', function(e) {
			console.log("AceTextEditor change");
			_commonEditor.contentChangeHandler();
		});
		
		if(_content)
		{
			_editor.setValue(_content);
		}
		
		if(_docInfo)
		{
			onLoadDocument(_docInfo);
		}
		
		_commonEditor.appReady();
	};
	
	//抽象编辑器的以下接口, 通过config参数传递给CommonEditor
	//"initEditor": initEditorForEditormd,
	//"setContent": setContentForEditormd,
	//"getContent": setContentForEditormd,
	//"setEditMode": setEditModeForEditormd,			
	//"onLoadDocument": onLoadDocumentForEditormd,
	var config = {
			"initEditor": initEditor,
			"setContent": setContent,
			"getContent": getContent,
			"setEditMode": setEditMode,			
			"onLoadDocument": onLoadDocument,
		};

	function init(mode, docInfo)
	{
		console.log("AceTextEditor init() mode:" + mode);
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
		console.log("AceTextEditor checkAndSetEditBtn() isEditableText:" + editable);
		if(editable)
		{
			$("#textEditorEditBtn").show();
		}
	}
	
	function checkAndSetFileShowMode(docInfo)
	{
		if(docInfo.docType == 1)
		{
			var showMode = getFileShowMode(docInfo.name, docInfo.fileSuffix);
			console.log("checkAndSetFileShowMode() showMode:" + showMode);
			_editor.session.setMode("ace/mode/" + showMode);
		}
	}
	
    //EnableEditBtn触发的EnableEdit，此时编辑器状态未发生任何变化，因此如果失败的话则不需要进行任何处理，如果成功的话则需要切换编辑器状态
    function enableEditCallback1(ret)
    {
    	console.log("AceTextEditor enableEditCallback1() ret:", ret);
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
    }
    
    //编辑器状态切换回调触发的EditEnable，此时编辑器状态已切换，因此如果成功的话则不需要进行任何处理，如果失败的话则需要切换编辑器状态
    function enableEditCallback2(ret)
    {
    	console.log("AceTextEditor enableEditCallback2() ret:", ret);
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

    }
	
    //ExitEditBtn触发的exitEdit，此时编辑器状态未发生任何变化，因此如果失败的话则不需要进行任何处理，如果成功的话则需要切换编辑器状态
    function exitEditCallback1(ret)
    {
    	console.log("AceTextEditor exitEditCallback1() ret:", ret);
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
    }
    
    //编辑器状态切换回调触发的EditEnable，此时编辑器状态已切换，因此如果成功的话则不需要进行任何处理，如果失败的话则需要切换编辑器状态
    function exitEditCallback2(ret)
    {
    	console.log("AceTextEditor exitEditCallback2() ret:", ret);
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
    }
	
	//开放给外部的调用接口
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
	    exitEdit: function(mode){
	    	_commonEditor.exitEdit(exitEditCallback1);
	    },
	    saveDoc: function(){
	    	_commonEditor.saveDoc();
	    },
	}
})();
