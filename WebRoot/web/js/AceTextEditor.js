//AceTextEditor类
var AceTextEditor = (function () {
	var docInfo = {};
	var docText = "";
	var tmpSavedDocText = "";
	var isContentChanged = false;
	var editState = false;
	var editor = {};	
	
	function initAceEditor()
	{
		editor = ace.edit("editor");
		editor.setTheme("ace/theme/twilight");
		//editor.setTheme("ace/theme/chrome");
		//editor.setTheme("ace/theme/tomorrow_night");
		editor.session.setMode("ace/mode/text");
		editor.setReadOnly(true); // false to make it editable
	}
	
	//Init For ArtDialog
	function initForArtDialog()
	{
		initAceEditor();

		var params = GetRequest();
		var docid = params['docid'];
		//获取artDialog父窗口传递过来的参数
		var artDialog2 = window.top.artDialogList['ArtDialog' + docid];
		if (artDialog2 == null) {
			artDialog2 = window.parent.artDialogList['ArtDialog' + docid];
		}
		// 获取对话框传递过来的数据
		docInfo = artDialog2.config.data;
	    console.log("initForArtDialog() docInfo:", docInfo);

		if (!docInfo.fileSuffix) {
			docInfo.fileSuffix = getFileSuffix(docInfo.name);
		}
		
		getDocText(docInfo, showText, showErrorInfo);
	}
	
	//Init For NewPage
	function initForNewPage()
	{
		initAceEditor();
		
	    docInfo = getDocInfoFromRequestParamStr();
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
		initAceEditor();
		
		docInfo = Input_doc;		
	
		console.log("textEditorPageInit() docInfo:", docInfo);
		
		if (!docInfo.fileSuffix) {
			docInfo.fileSuffix = getFileSuffix(docInfo.name);
		}
		
		getDocText(docInfo, showText, showErrorInfo);	  	
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


			
	function showText(docText, tmpSavedDocText)
	{
		checkAndSetFileShowMode(docInfo);
		checkAndSetEditBtn(docInfo);	
		
		editor.setValue(docText);	
		editor.getSession().on('change', function(e) {
			isContentChanged = true;
			console.log("textChange stackZ.size:" + stackZ.size() +  " stackY.size:" + stackY.size() +  " ctrlZY:" + isCtrlZY);
			if(false == isCtrlZY)
			{
				var content = editor.getValue();
				stackZ.push(content);
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
	        	docType: 1, //RealDoc
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
				docType: 1,
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
				docType: 1,
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
			editor.setReadOnly(false);
			editState = true;
			
			//Start beat thread to keep 
			startBeatThread();
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
			editState = false;			
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
				docType: 1,
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
		var showMode = getFileShowMode(docInfo.name, docInfo.fileSuffix);
		console.log("checkAndSetFileShowMode() showMode:" + showMode);
		editor.session.setMode("ace/mode/" + showMode);
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
