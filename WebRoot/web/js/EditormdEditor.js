var EditormdEditor = (function () {
	var _commonEditor; //It will be set when callback from _commonEditor
	
	var _editor;		  		//编辑器句柄
	var _isReadOnly = true;		//true: 编辑器只读模式
	var _editState = false;		//编辑器当前状态
	var _docInfo;				//编辑器当前打开的文档信息
	var _content = "";			//编辑器当前展示的内容
	var _switchEditModeOnly = false;	//编辑器状态切换回调控制变量

	var setContent = function(content)
	{	
		_content = content;
		_editor.setMarkdown(content);
		//_editor.resize();
	};

	var getContent = function()
	{	
		return _editor.getMarkdown();
	};

	var setEditMode = function(mode)
	{
		_editState = mode;
		if(mode == true)
		{	
			//显示工具条
			$("#toolBarMenu").show();
			//显示退出编辑按键
			$("#textEditorCloseBtn").show();
			//隐藏编辑按键
			$("#textEditorEditBtn").hide();
			
			//Enable Edit
			_switchEditModeOnly = true;
			_editor.previewing();
			_editor.resize();
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
			_switchEditModeOnly = true;
			_editor.previewed();
			_editor.resize();
		}
	};
	
	var onLoadDocument = function(docInfo){
		console.log("EditormdEditor onLoadDocument() docInfo:", docInfo);
		_docInfo = docInfo;
		
		var imageUploadBaseURL = getImageUploadBaseURL(_docInfo);
		_editor.setImageUploadURL(imageUploadBaseURL);
	
		checkAndSetFileShowMode(docInfo);
		checkAndSetEditBtn(docInfo);
	};
	
	var initEditor = function(docText, tmpSavedDocText, docInfo)
	{
  		console.log("EditormdEditor initEditor() docInfo:", docInfo);
  		console.log("EditormdEditor initEditor() docText:", docText);
  		
  		//如果传入了docInfo，那么docInfo在初始化的时候就进行设置
  		var imageUploadBaseURL = "";
  		if(docInfo)
  		{
  			_docInfo = docInfo;
  			imageUploadBaseURL = getImageUploadBaseURL(_docInfo);
  		}
		
  		if(docText)
  		{
  			_content = docText;
  		}
  		
      	var params = {
            width: "100%",
            height: $(document).height()-70,
            path : 'static/markdown/lib/',
            markdown : _content,	//markdown的内容默认务必是空，否则会出现当文件内容是空的时候显示默认内容
            toolbar  : true,
            toolbarIcons: "simple",
            codeFold : false,
            searchReplace : true,
            watch : false,
            saveHTMLToTextarea : true,      // 保存 HTML 到 Textarea
            htmlDecode : "style,script,iframe|on*",            // 开启 HTML 标签解析，为了安全性，默认不开启
            emoji : false,
            taskList : false,
            tocm: false,          			// Using [TOCM]
            tex : false,                      // 开启科学公式 TeX 语言支持，默认关闭
            previewCodeHighlight : false,  // 关闭预览窗口的代码高亮，默认开启
            flowChart : true,
            sequenceDiagram : true,
            //dialogLockScreen : false,      // 设置弹出层对话框不锁屏，全局通用，默认为 true
            //dialogShowMask : false,     // 设置弹出层对话框显示透明遮罩层，全局通用，默认为 true
            //dialogDraggable : false,    // 设置弹出层对话框不可拖动，全局通用，默认为 true
            dialogMaskOpacity : 0.2,    // 设置透明遮罩层的透明度，全局通用，默认值为 0.1
            dialogMaskBgColor : "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为 #fff
            imageUpload : true,
            imageFormats : ["jpg","JPG", "jpeg","JPEG","gif","GIF","png", "PNG","bmp","BMP", "webp","WEBP",],
            imageUploadURL : imageUploadBaseURL,
           onchange : function () {
             	console.log("EditormdEditor onchange()");
        	    _commonEditor.contentChangeHandler();
           },
           onpreviewing : function () {
              	console.log("EditormdEditor onpreviewing() _switchEditModeOnly:" + _switchEditModeOnly);
				if(_switchEditModeOnly == true)
				{
					_switchEditModeOnly = false;
				}
				else
				{
	              	_commonEditor.exitEdit(2);	//编辑器触发的退出编辑
				}
           },
           onpreviewed :function () {
               	console.log("EditormdEditor onpreviewed _switchEditModeOnly:" + _switchEditModeOnly);
               	if(_switchEditModeOnly == true)
				{
					_switchEditModeOnly = false;
			    }
               	else
               	{
	               _commonEditor.enableEdit(2);	//编辑器触发的编辑
               	}
           },
           onload : function () {
               console.log("EditormdEditor onload");
               if(docInfo)
			   {
            	   onLoadDocument(docInfo);
			   }

               this.previewing(); 		  //加载成默认是预览
			   _commonEditor.appReady();
		   },
           onresize: function(){
        	   console.log("EditormdEditor onresize");
           },
           onsave: function(){
        	   console.log("EditormdEditor onsave");
        	   _commonEditor.saveDoc();
           },
   		};
   		
  		_editor = editormd("mdPlayer",params);
	};
	
	//抽象编辑器的以下接口, 通过config参数传递给CommonEditor
	var config = {
		"initEditor": initEditor,
		"setContent": setContent,
		"getContent": getContent,
		"setEditMode": setEditMode,			
		"onLoadDocument": onLoadDocument,
	};
	
	function init(mode, docInfo)
	{
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
	
    //图片上传
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
	
	function uploadMarkdownPic(file)
	{
		console.log("EditormdEditor uploadMarkdownPic() _docInfo:", _docInfo);
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
			//文件上传状态
			console.log("EditormdEditor xhr onreadystatechange() status:" + xhr.status + " readyState:" + xhr.readyState);
			if(xhr.status == 200)
			{
				if(xhr.readyState != 4)
				{
					//文件上传未结束
					return;
				}

				//上传成功！
				var ret = JSON.parse(xhr.responseText);
				console.log("EditormdEditor uploadMarkdownPic ret", ret);
				if(1 == ret.success)
				{
					//上传失败
					console.log("EditormdEditor 上传成功");
			        _editor.insertTextAtCursor("![]("+ ret.url +")");
				}
				else	//上传失败
				{
					//上传失败
					console.log("EditormdEditor 上传失败：" + ret.msgInfo);
					return;
	            }
			}else{
				if(xhr.status < 300)
				{
					//不是真正的异常
					return;
				}
				//上传失败
				console.log("EditormdEditor 系统异常: 上传异常！");
				return;
			}
		};
	}
	
	//图片粘贴上传实现
    document.addEventListener('paste', handlePasteImgEvent);
    function handlePasteImgEvent(event)
    {
    	console.log("EditormdEditor handlePasteImgEvent event:", event);
    	
    	if(_editState == undefined || _editState == false)
    	{
    		//编辑器处于编辑状态才处理paste事件
    		return;
    	}

    	var  file = null;
    	//粘贴事件
        if (event.clipboardData || event.originalEvent)
        {
        	var clipboardData = (event.clipboardData || event.originalEvent.clipboardData);
        	console.log("EditormdEditor handlePasteImgEvent clipboardData", clipboardData);
        	var items = clipboardData.items;
            if(items)
            {
            	console.log("EditormdEditor handlePasteImgEvent items", items);
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
        	console.log("EditormdEditor handlePasteImgEvent file is null");
        	return;
        }

        uploadMarkdownPic(file);

        //setImg Directly,以下代码可以直接将图片按base64格式插入到内容里
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
	    	_commonEditor.enableEdit(1);
	    },	    
	    exitEdit: function(mode){
	    	_commonEditor.exitEdit(1);
	    },
	    saveDoc: function(){
	    	_commonEditor.saveDoc();
	    },
	}
})();