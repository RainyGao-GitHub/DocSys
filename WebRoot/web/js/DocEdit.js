	//DocEdit类	
    var DocEdit = (function () {
    	var md;	//mdeditor对象
    	var firstcall = true;
      	//自动保存定时器
      	var autoSaveTimer;
      	var timerState = 0;
    
      	function editorInit(content,edit)
      	{
      		console.log("DocEdit editorInit");
      		gEdit = edit;

      		var params = {
               width: "100%",
               height: $(document).height()-70,
               path : 'static/markdown/lib/',
               markdown : content,
               //toolbar  : false,             // 关闭工具栏
               codeFold : true,
               searchReplace : true,
               saveHTMLToTextarea : true,      // 保存 HTML 到 Textarea
               htmlDecode : "style,script,iframe|on*",            // 开启 HTML 标签解析，为了安全性，默认不开启
               emoji : true,
               taskList : true,
               tocm: true,          			// Using [TOCM]
               tex : true,                      // 开启科学公式 TeX 语言支持，默认关闭
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
               imageUploadURL : "/DocSystem/Doc/uploadMarkdownPic.do",
               onchange : function () {
                   console.log("onchange");
                   var newContent = this.getMarkdown();
                   if(gEdit == true)
                   {
            	       debounce.call(newContent);
    		       }
    		       else
    		       {
    		           debounce.clear();
    		       }       
               },
               onpreviewing : function () {
                   console.log("onpreviewing");
                   gEdit = false;
                   WikiEditBtnCtrl(gEdit);
               },
               onpreviewed :function () {
                   console.log("onpreviewed");
               },
               onload : function () {
                   console.log("onload edit:" + edit);
                   if(edit == false)
                   {
                   		this.previewing();               
                   }
                   gEdit = edit;
                   WikiEditBtnCtrl(gEdit);
               }
       		};
       		
      		//editormd was defined in editormd.js
       		md = editormd("doc",params);   
      	}
        
    	function editorLoadmd(content,edit) 
    	{
    		console.log("DocEdit editorLoadmd() edit:" + edit);
    		if(!md)
       		{
    			showErrorMessage("please call editorInit firstly");
       			return;
       		}
    		
    		if(!content)
    		{
    			content = "";
    		}
       		
    		md.setMarkdown(content);
    		if(edit != gEdit)
    		{
    			gEdit = edit;
    			md.previewing();
    		}
        }
        
        function loadmd(content,edit)
        {
			if(firstcall == true)
   			{ 
    			firstcall = false;
         		editorInit(content,edit);	
    		}
    		else
      		{
      			editorLoadmd(content,edit);	                    
			}
        }
		      		
		function editorSwitch(edit)
    	{
    		console.log("DocEdit editorSwitch() edit:"+edit);
    		if(!md)
       		{
    			showErrorMessage("please call editorInit firstly");
       			return;
       		}
       		
    		if(edit != gEdit)
    		{
    		    gEdit = edit;
    			md.previewing();
    		}
    	}
    	
    	function startAutoTmpSaver()
		{ 
			console.log("DocEdit.startAutoTmpSaver timerState:" + timerState);
			if(timerState == 0)
			{
				timerState = 1;
				autoSaveTimer = setInterval(function () {
		        	if(debounce.getStatus1() == 1)
		    		{
		    			console.log("autoTmpSaveWiki");
		    	    	debounce.clearStatus1();
		    			tmpSaveDoc(gDocId, debounce.get());
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
			
			var node = getNodeById(docId);
			if(node && node == null)
			{
	            console.log("临时保存失败 :" , (new Date()).toLocaleDateString());
	            bootstrapQ.msg({
					msg : "临时保存失败 : 文件不存在",
					type : 'danger',
					time : 1000,
				});	
	            return;
			}
			
	        $.ajax({
	            url : "/DocSystem/Doc/tmpSaveDocContent.do",
	            type : "post",
	            dataType : "json",
	            data : {
	            	reposId: gReposId,
	                docId : docId,
	                pid: node.pid,
	                path: node.path,
	                name: node.name,
	                content : content,
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
	            	reposId: gReposId,
	                docId : docId,
	                pid: node.pid,
	                path: node.path,
	                name: node.name,
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

		//开放给外部的调用接口
        return {
            loadmd: function(content,edit){
               loadmd(content,edit);
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
            
        };
    })();