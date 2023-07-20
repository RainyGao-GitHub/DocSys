//AceTextEditor类
var AceTextEditor = (function () {
	var commonEditor; //It will be set when callback from commonEditor
	
	var editor;		  		//编辑器句柄
	var isReadOnly = true;	//true: 只读模式
	var docInfo;			//docInfo
	var content = "";		//编辑器内容
	var switchEditModeOnly = false;	//编辑器状态切换回调控制变量
	
	var setContent = function(content)
	{	
		editor.setValue(content);
	};

	var getContent = function()
	{	
		return editor.getValue();
	};

	var setEditMode = function(mode)
	{
		if(mode == true)
		{	
			//显示工具条
			$("#toolBarMenu").show();
			//显示退出编辑按键
			$("#textEditorCloseBtn").show();
			//隐藏编辑按键
			$("#textEditorEditBtn").hide();
	
			//Enable Edit
			editor.setReadOnly(false);
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
			editor.setReadOnly(true);
		}
	};
	
	var onLoadDocument = function(docInfo){
		console.log("onLoadDocument() docInfo:", docInfo);

		//editor.setImageUploadURL(buildImageUploadURL(docInfo));
	
		checkAndSetFileShowMode(docInfo);
		checkAndSetEditBtn(docInfo);
	};
	
	var initEditor = function(docText, tmpSavedDocText, docInfo)
	{
		console.log("AceTextEditor initEditor() docInfo:", docInfo);
		
		//如果传入了docInfo，那么docInfo在初始化的时候就进行设置
		if(docInfo)
  		{
  			this.docInfo = docInfo;
  		}
  		if(docText)
  		{
  			this.content = docText;
  		}
  		
		editor = ace.edit("editor");
		editor.setTheme("ace/theme/twilight");
		//editor.setTheme("ace/theme/chrome");
		//editor.setTheme("ace/theme/tomorrow_night");
		editor.session.setMode("ace/mode/text");
		editor.setReadOnly(true); // false to make it editable
		editor.getSession().on('change', function(e) {
			console.log("AceTextEditor change");
			commonEditor.contentChangeHandler();
		});
		
		if(this.content)
		{
			editor.setValue(this.content);
		}
		
		if(this.docInfo)
		{
			onLoadDocument(this.docInfo);
		}
		
		commonEditor.appReady();
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
		commonEditor = new MxsdocAPI.CommonEditor(config);
		switch(mode)
		{
		case "ArtDialog":
			commonEditor.initForArtDialog();
			break;
		case "NewPage":
			commonEditor.initForNewPage();
			break;
		case "BootstrapDialog":
			commonEditor.initForBootstrapDialog(docInfo);
			break;
		case "VDoc":
			commonEditor.initForVDoc();
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
		console.log("checkAndSetEditBtn() isEditableText:" + editable);
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
			editor.session.setMode("ace/mode/" + showMode);
		}
	}
	
	//开放给外部的调用接口
	//开放给外部的调用接口
	return {
		init: function(mode, docInfo){
			init(mode, docInfo);					
		},
	    ctrlZ: function(){
	    	commonEditor.ctrlZ();
	    },
	    ctrlY: function(){
	    	commonEditor.ctrlY();
	    },
	    enableEdit: function(){
	    	commonEditor.enableEdit(1);
	    },	    
	    exitEdit: function(mode){
	    	commonEditor.exitEdit(1);
	    },
	    saveDoc: function(){
	    	commonEditor.saveDoc();
	    },
	}
})();
