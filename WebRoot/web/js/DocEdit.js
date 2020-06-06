	//DocEdit类
	//TODO: Markdown编辑器不只是针对于vDoc，也可以用于realDoc，因此涉及后台接口的需要区分是VDOC还是RDOC
    var DocEdit = (function () {
    	var md;	//mdeditor对象
    	
    	var docText = "";
    	var editState = false;
    	
      	//自动保存定时器
      	var autoSaveTimer;
      	var timerState = 0;
      	var isOnLoadTriggerChange = false;
    
        function loadmd(content, edit, initFlag)
        {
    		if(!content)
    		{
    			content = "";
    		}
    		
			//console.log("loadmd content:", content);				
    		
			if(md)
   			{
				if(initFlag)
				{
					editorInit(content, edit);
				}
				else
				{
	      			editorLoadmd(content);               									
				}
   			}
			else
			{
				editorInit(content, edit);	
    		}
        }
        
      	function editorInit(content, edit, isPC)
      	{
      		console.log("DocEdit editorInit edit:" + edit);
      		docText = content;
      		if(edit)
      		{
      			editState = edit;
      		}
      		
      		var params = getParams(isPC);
       		md = editormd("vdocPreview",params);
      	}
    	
      	function editorLoadmd(content) 
    	{
    		console.log("DocEdit editorLoadmd() gDocInfo.edit:" + gDocInfo.edit);
    		docText = content;
    		md.setMarkdown(docText);
    		
    		var path = base64_urlsafe_encode(gDocInfo.path);
    		var name = base64_urlsafe_encode(gDocInfo.name);
    		md.setImageUploadURL("/DocSystem/Doc/uploadMarkdownPic.do?reposId=" + gReposInfo.id + "&docId=" + gDocInfo.docId + "&path="+ path + "&name="+ name); 
        }
      	
      	function getParams(isPC)
      	{
      		if(!isPC)
      		{
      			isPC = true;
      		}
      		
    		var path = base64_urlsafe_encode(gDocInfo.path);
    		var name = base64_urlsafe_encode(gDocInfo.name);
    		var imageUploadURL = "/DocSystem/Doc/uploadMarkdownPic.do?reposId=" + gReposInfo.id + "&docId=" + gDocInfo.docId + "&path="+ path + "&name="+ name; 
      		console.log("getParams imageUploadURL:" + imageUploadURL);

	      	var params = {
	            width: "100%",
	            height: $(document).height()-70,
	            path : 'static/markdown/lib/',
	            markdown : "",	//markdown的内容默认务必是空，否则会出现当文件内容是空的时候显示默认内容
	            //toolbar  : false,             // 关闭工具栏
	            codeFold : true,
	            searchReplace : isPC?true:false,
	            watch : isPC?true:false,                // 关闭实时预览
	            saveHTMLToTextarea : true,      // 保存 HTML 到 Textarea
	            htmlDecode : "style,script,iframe|on*",            // 开启 HTML 标签解析，为了安全性，默认不开启
	            emoji : isPC?true:false,
	            taskList : isPC?true:false,
	            tocm: isPC?true:false,          			// Using [TOCM]
	            tex : isPC?true:false,                      // 开启科学公式 TeX 语言支持，默认关闭
	            //previewCodeHighlight : false,  // 关闭预览窗口的代码高亮，默认开启
	            flowChart : true,
	            sequenceDiagram : true,
	            //dialogLockScreen : false,      // 设置弹出层对话框不锁屏，全局通用，默认为 true
	            //dialogShowMask : false,     // 设置弹出层对话框显示透明遮罩层，全局通用，默认为 true
	            //dialogDraggable : false,    // 设置弹出层对话框不可拖动，全局通用，默认为 true
	            dialogMaskOpacity : 0.2,    // 设置透明遮罩层的透明度，全局通用，默认值为 0.1
	            dialogMaskBgColor : "#000", // 设置透明遮罩层的背景颜色，全局通用，默认为 #fff
	            imageUpload : true,
	            imageFormats : ["jpg","JPG", "jpeg","JPEG","gif","GIF","png", "PNG","bmp","BMP", "webp","WEBP",],
	            imageUploadURL : imageUploadURL,
	            onchange : function () {
	                console.log("DocEdit onchange gDocInfo.edit:" + gDocInfo.edit);                  
	            },
	            onpreviewing : function () {
	                console.log("DocEdit onpreviewing gDocInfo.edit:" + gDocInfo.edit);
	                exitEditWiki();
	            },
	            onpreviewed :function () {
	                console.log("DocEdit onpreviewed gDocInfo.edit:" + gDocInfo.edit);
	                lockAndEditWiki();
	            },
	            onload : function () {
	                console.log("DocEdit onload gDocInfo.edit:" + gDocInfo.edit + " editState:" + editState);	//这是markdown初始化完毕的回调（此时才可以访问makdown的接口）
		    		   this.previewing(); 		  //加载成默认是预览
		    		   this.setMarkdown(docText); //内容需要在onload的时候进行加载，会触发onchange事件
		    		   isOnLoadTriggerChange = true;
		    		   if(!editState || editState == false)
		    		   {
		    			   console.log("DocEdit onload edit is false");
		    		   }
		    		   else
		    		   {
		    			   console.log("DocEdit onload edit is true");
		    			   lockAndEditWiki();
		    		   }
	            },
	            onresize: function(){
	         	   console.log("DocEdit onresize");
	            }
	    	};
	      	return params;
      	}
		      		
		function editorSwitch(newEditState)
    	{
    		console.log("DocEdit editorSwitch() editState:"+editState + " newEditState:" + newEditState);
    		
    		editState = newEditState;
    		gDocInfo.edit = editState;
    		
    		if(!md)
       		{
    			showErrorMessage("请先初始化Markdown编辑器");
       			return;
       		}
       		
    		if(editState == false)
	    	{
	    		md.previewing();
	    	}
	    	else
	    	{
	    		md.previewed();
	    	}
    	}
    	
    	function startAutoTmpSaver()
		{ 
			console.log("DocEdit.startAutoTmpSaver timerState:" + timerState);
			if(timerState == 0)
			{
				timerState = 1;
				autoSaveTimer = setInterval(function () {
		        	var newContent = getMarkdown();
		        	if(!gTmpSavedContent)
		        	{
		        		gTmpSavedContent = "";
		        	}
		        	
					if(gTmpSavedContent != newContent)
		    		{
		    			console.log("autoTmpSaveWiki");
		    			tmpSaveDoc(gDocInfo.docId, newContent);
		    			gTmpSavedContent = newContent;
		    		}
		    	},20000);
		    }
		}
	
		function stopAutoTmpSaver(){
			console.log("DocEdit.stopAutoTmpSaver timerState:" + timerState);
			if(timerState == 1)
			{
				timerState = 0;
				clearInterval(autoSaveTimer);
			}
		}
		
	    //文件临时保存操作
	    function tmpSaveDoc(docId, content){
			console.log("tmpSaveDoc: docId:" + docId);
			
	        $.ajax({
	            url : "/DocSystem/Doc/tmpSaveDocContent.do",
	            type : "post",
	            dataType : "json",
	            data : {
	            	reposId: gReposInfo.id,
	                docId : gDocInfo.docId,
	                pid: gDocInfo.pid,
	                path: gDocInfo.path,
	                name: gDocInfo.name,
	                content : content,
	                docType : gDocInfo.contentType,
	                shareId: gShareId,
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
	    function deleteTmpSavedContent(docId){
			console.log("deleteTmpSavedDocContent: docId:" + docId);
			
			var node = getNodeById(docId);
			if(node && node == null)
			{
	            console.log("删除临时保存内容失败 :" , (new Date()).toLocaleDateString());
	            bootstrapQ.msg({
					msg : "删除临时保存内容失败 : 文件不存在",
					type : 'danger',
					time : 1000,
				});	
	            return;
			}
			
	        $.ajax({
	            url : "/DocSystem/Doc/deleteTmpSavedDocContent.do",
	            type : "post",
	            dataType : "json",
	            data : {
	            	reposId: gReposInfo.id,
	                docId : docId,
	                pid: node.pid,
	                path: node.path,
	                name: node.name,
	                docType: gDocInfo.contentType,
	                shareId: gShareId,
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
	    
		//进入文件编辑状态
	    function editWiki(){
	    	console.log("editWiki()  gDocInfo.docId:" + gDocInfo.docId + " gDocInfo.edit:" + gDocInfo.edit);
		    if(gDocInfo.edit == true)
		    {
		    	return;
		    }

		    gDocInfo.edit = true;
	    	DocEdit.editorSwitch(true);
	    	DocEdit.loadmd(gDocContent);
	    	WikiEditBtnCtrl(true);
	        updateUrl();
	        
	        //start the autoTmpSaver
		    DocEdit.startAutoTmpSaver();
		    
			if(gTmpSavedContent && gTmpSavedContent != gDocContent)
			{
				bootstrapQ.confirm({
					id: "loadContentConfirm",
					title: "加载确认",
					msg : "上次有未保存的编辑内容，是否加载？",
					},function () {
				    	//alert("点击了确定");
				        DocEdit.loadmd(gTmpSavedContent);
				    	return true;   
				 	},function (){
				 		//alert("点击了取消");
				        gTmpSavedContent = gDocContent;
				        DocEdit.deleteTmpSavedContent(gDocInfo.docId);
				        return true;
				 	});
			}
	    }
		
	    function exitEditWiki() {
	      	console.log("exitEditWiki()  gDocInfo.docId:" + gDocInfo.docId + " gDocInfo.edit:" + gDocInfo.edit);
		    if(gDocInfo.edit == false)
		    {
		    	return;
		    }

		    gDocInfo.edit = false;
	      	editorSwitch(false);
	      	loadmd(gDocContent);
		    WikiEditBtnCtrl(false);
		    updateUrl();
			    
			//Stop autoSaver
			DocEdit.stopAutoTmpSaver();
	    }
	    
	    //将编辑中的文件保存到后台
	    function saveWiki() {
	    	console.log("saveWiki");
	    	var newContent = getMarkdown();
	    	if(gDocContent != newContent)
	    	{
	    		saveDoc(newContent);
	    	}
	    }
	    
		//锁定文件并进入编辑状态
		function lockAndEditWiki()
		{
			console.log("lockAndEditWiki()");
			//if(!gDocInfo.docId || gDocInfo.docId == 0)
			//{
			//	showErrorMessage("请选择文件!");
			//	return;
			//}

			$.ajax({
				url : "/DocSystem/Doc/lockDoc.do",
				type : "post",
				dataType : "json",
				data : {
					lockType : 3, //LockType: Online Edit
					reposId : gReposInfo.id, 
					docId : gDocInfo.docId,
					path: gDocInfo.path,
					name: gDocInfo.name,
					docType: gDocInfo.contentType,
	                shareId: gShareId,
				},
				success : function (ret) {
					if( "ok" == ret.status)
					{
						console.log("lockAndEditWiki() ret.data",ret.data);
						$("[dataId='"+ gDocInfo.docId +"']").children("div:first-child").css("color","red");
						editWiki();
					    return;
	 				}
					else
					{
						showErrorMessage("lockDoc Error:" + ret.msgInfo);
						return;
					}
				},
				error : function () 
				{
					showErrorMessage("lockDoc 异常");
					return;
				}
			});
		}
		
		function getMarkdown()
		{
			var content = md.getMarkdown();
	    	if(!content)
	    	{
	    		content = "";
	    	}
	    	return content;
		}

		//退出文件编辑状态
	    function exitEdit(newNode) {
	    	console.log("exitEdit gDocInfo.docId:" + gDocInfo.docId, newNode);	
	    	if(gDocInfo.edit == false)
	    	{
	    		return;
	    	}
	    	
	    	var newContent = getMarkdown();
	    	if(!gDocContent)
	    	{
	    		gDocContent = "";
	    	}
	    	if(gDocContent != newContent)
	    	{
	    		//console.log("exitEdit gDocContent:" + gDocContent);	
	    		//console.log("exitEdit newContent:" + newContent);	
	    		qiao.bs.confirm({
	  	 	    		id: 'saveDocConfirm',
	  	 	    		msg: "修改未保存，是否保存？",
	  	 	    		close: false,		
	  	 	    		okbtn: "保存",
	  	 	    		qubtn: "直接退出",
	  	 	    	},function () {
	  	 	    	    saveWikiAndExit(newNode);
	  	  	 			return true;
	  	 			},function(){
	  	 				unlockAndExitEditWiki(newNode);
	  	 				return true;
	  	 		});
	  	 	}
	  	 	else
	  	 	{
	    		unlockAndExitEditWiki(newNode);
	    	}
		}
	    
		//解锁文件并退出编辑
		function unlockAndExitEditWiki(newNode)
		{
			console.log("unlockAndExitEditWiki()  gDocInfo.docId:" + gDocInfo.docId);
			//if(!gDocInfo.docId || gDocInfo.docId == 0)
			//{
			//	showErrorMessage("文件不存在");
			//	exitEditWiki();
			//	return;
			//}
			
			$.ajax({
				url : "/DocSystem/Doc/lockDoc.do",
				type : "post",
				dataType : "json",
				data : {
					lockType : 0, //unlock the doc
					reposId : gReposInfo.id, 
					docId : gDocInfo.docId,
					path: gDocInfo.path,
					name: gDocInfo.name,
					docType: gDocInfo.contentType,
	                shareId: gShareId,
				},
				success : function (ret) {
					if( "ok" == ret.status)
					{
						console.log("unlockAndExitEditWiki() ret:" + ret.data);
						$("[dataId='"+ gDocInfo.docId +"']").children("div:first-child").css("color","black");
						exitEditWiki();
						if(newNode)
						{
							getAndShowDoc(newNode);
						}
						return;
	 				}
					else
					{
						showErrorMessage("unlockAndExitEditWiki() unlockDoc Error:" + ret.msgInfo);
						return;
					}
				},
				error : function () 
				{
					showErrorMessage("unlockAndExitEditWiki() unlockDoc 异常");
					return;
				}
			});
		}
		
	    //将编辑中的文件保存到后台
	    function saveWikiAndExit(newNode) 
	    {
	    	console.log("saveWikiAndExit  gDoc:" + gDocInfo.docId, newNode);
	    	var newContent = getMarkdown();
	    	if(gDocContent != newContent)
	    	{
	    		saveDoc(newContent, unlockAndExitEditWiki, newNode);
	    	}
	    	else
	    	{
	    		unlockAndExitEditWiki(newNode);
	    	}
	    }
	    
	    function saveDoc(content, callback, newNode)
		{
			console.log("saveDoc gDocInfo.docId:" + gDocInfo.docId);
			$.ajax({
	            url : "/DocSystem/Doc/updateDocContent.do",
	            type : "post",
	            dataType : "json",
	            data : {
	                reposId: gReposInfo.id,
	            	docId : gDocInfo.docId,
	            	path: gDocInfo.path,
	                name: gDocInfo.name,
	            	content : content,
	            	docType: gDocInfo.contentType,
	                shareId: gShareId,
	            },
	            success : function (ret) {
	                if( "ok" == ret.status ){
	                    console.log("保存成功 : " , (new Date()).toLocaleDateString());
						gDocContent = content;
						gTmpSavedContent = content;
	                    bootstrapQ.msg({
									msg : "保存成功 :" + (new Date()).toLocaleDateString(),
									type : 'success',
									time : 1000,
						});
						//回调
						callback && callback(newNode);
					}else {
	                    bootstrapQ.alert("保存失败:"+ret.msgInfo);
	                }
	            },
	            error : function () {
	                bootstrapQ.alert("保存失败:服务器异常");
	            }
	        });
	    }
	    
	    function insertTextAtCursor(text)
	    {
	    	console.log("insertTextAtCursor text:", text);
	    	md.insertTextAtCursor(text);
	    }

		//开放给外部的调用接口
        return {
        	resize: function(){
        		if(!md)
        		{
        			return;
        		}
        		md.resize();
            },
            loadmd: function(content, edit, initFlag){
               loadmd(content, edit, initFlag);
            },
            editWiki: function(){
            	editWiki();
            },
            exitEdit: function(newNode){
            	exitEdit(newNode);
            },
            saveWiki: function(){
            	saveWiki();
            },
            editorSwitch: function(edit){
            	editorSwitch(edit);
            },
            startAutoTmpSaver: function(){
            	startAutoTmpSaver();
            },
            stopAutoTmpSaver: function(){
            	stopAutoTmpSaver();
            },
            deleteTmpSavedContent: function(docId){
            	deleteTmpSavedContent(docId);
            },
            insertTextAtCursor : function(text){
            	insertTextAtCursor(text);
            }
        };
    })();