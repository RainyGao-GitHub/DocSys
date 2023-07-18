var EditormdEditor = (function () {
	var commonEditor; //It will be set when callback from commonEditor
	
	var editor;		  		//编辑器句柄
	var isReadOnly = true;	//true: 只读模式
	var docInfo;			//docInfo
	var content = "";		//编辑器内容
	var switchEditModeOnly = false;	//编辑器状态切换回调控制变量

	var setContent = function(content)
	{	
		editor.setMarkdown(content);
		//editor.resize();
	};

	var getContent = function()
	{	
		return editor.getMarkdown();
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
			switchEditModeOnly = true;
			editor.previewing();
			editor.resize();
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
			switchEditModeOnly = true;
			editor.previewed();
			editor.resize();
		}
	};
	
	var onLoadDocument = function(docInfo){
		console.log("EditormdEditor onLoadDocument() docInfo:", docInfo);

		editor.setImageUploadURL(buildImageUploadURL(docInfo));
	
		checkAndSetFileShowMode(docInfo);
		checkAndSetEditBtn(docInfo);
	};
	
	var initEditor = function(docText, tmpSavedDocText, docInfo)
	{
  		console.log("EditormdEditor initEditor() docInfo:", docInfo);
		
  		//如果传入了docInfo，那么docInfo在初始化的时候就进行设置
		if(docInfo)
  		{
  			this.docInfo = docInfo;
  		}
  		if(docText)
  		{
  			this.content = docText;
  		}
  		
      	var params = {
            width: "100%",
            height: $(document).height()-70,
            path : 'static/markdown/lib/',
            markdown : this.content,	//markdown的内容默认务必是空，否则会出现当文件内容是空的时候显示默认内容
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
           //imageUploadURL : "/DocSystem/Doc/uploadMarkdownPic.do?docId="+ docInfo.docId + "&path=" + docInfo.path + "&name=" + docInfo.name,
           onchange : function () {
        	   commonEditor.contentChangeHandler();
           },
           onpreviewing : function () {
              	console.log("EditormdEditor onpreviewing() switchEditModeOnly:" + switchEditModeOnly);
				if(switchEditModeOnly == true)
				{
					switchEditModeOnly = false;
				}
				else
				{
	              	commonEditor.exitEdit(2);	//编辑器触发的退出编辑
				}
           },
           onpreviewed :function () {
               	console.log("EditormdEditor onpreviewed switchEditModeOnly:" + switchEditModeOnly);
               	if(switchEditModeOnly == true)
				{
					switchEditModeOnly = false;
			    }
               	else
               	{
	               commonEditor.enableEdit(2);	//编辑器触发的编辑
               	}
           },
           onload : function () {
               console.log("EditormdEditor onload");
               if(docInfo)
			   {
            	   onLoadDocument(docInfo);
			   }
			   else
			   {
	               //TODO: 如果主动设置编辑器状态，会触发回调则需要设置
				   this.previewing(); 		  //加载成默认是预览
				   this.setMarkdown(""); 	  //内容需要在onload的时候进行加载，会触发onchange事件
			   }
			   commonEditor.appReady();
		   },
           onresize: function(){
        	   console.log("EditormdEditor onresize");
           },
           onsave: function(){
        	   console.log("EditormdEditor onsave");
        	   commonEditor.saveDoc();
           },
   		};
   		
  		editor = editormd("mdPlayer",params);
	};
	
	//抽象编辑器的以下接口, 通过config参数传递给CommonEditor
	var config = {
		"initEditor": initEditor,
		"setContent": setContent,
		"getContent": getContent,
		"setEditMode": setEditMode,			
		"onLoadDocument": onLoadDocument,
	};
	
	function buildImageUploadURL(docInfo){
		var path = base64_urlsafe_encode(docInfo.path);
		var name = base64_urlsafe_encode(docInfo.name);
		var imageUploadURL = "/DocSystem/Doc/uploadMarkdownPic.do?reposId=" + docInfo.vid + "&docId=" + docInfo.docId + "&path="+ path + "&name="+ name; 
		console.log("EditormdEditor buildImageUploadURL() imageUploadURL:" + imageUploadURL);
		return imageUploadURL;
	}
	
	function init(mode, docInfo)
	{
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
		//Do nothing
	}
	
    //Markdown的图片截图粘贴接口
    document.addEventListener('paste', handlePasteImgEvent);
    function handlePasteImgEvent(event)
    {
    	if(commonEditor.editState == undefined || commonEditor.editState == false)
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
				        editor.insertTextAtCursor("![]("+ ret.url +")");
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