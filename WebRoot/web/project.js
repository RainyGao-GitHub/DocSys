//全局变量定义
//Repos Info
var gInitReposInfo = {};
var gReposInfo = {};
//For ArtDialog
var gDialogData = {};


function showReposManagerPage(){
	//open reposManager in current page
	//window.open("/DocSystem/web/reposManager" + langExt + ".html?vid=" + gReposInfo.id);
	window.location.href = "/DocSystem/web/reposManager" + langExt + ".html?vid=" + gReposInfo.id;
}

//DocShare Info
var gShareId;

//RootDoc Inof
var gRootDoc = {
		docId : 0,
		path : "",
		name : "",
		type : 2,
		//showName: "仓库名",
};

//Doc Info
//页面第一次加载时从URL中获取的信息
var gInitDocInfo = {
		docId : 0,
		path : "",
		name : "",
		doc : null, //从后台取回的数据
		dataEx : null, //文件的链接等信息
		openMode : 1, //1:摘要模式  2:详情模式
		edit : false, //编辑状态
};
var gDocInfo = {};

//视频播放器
var gVideoPlayer;
//音频播放器	
var gAudioPlayer;


//当前页面显示模式
var gInitShowType = 1;
var gShowType = 1; //1:标准模式 2:电子书模式

function getDeleteNodes()
{
	var deleteNodes = [];

	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	var selectedNodes = treeObj.getSelectedNodes();
	if(selectedNodes == null || selectedNodes.length < 2)
	{
		console.log("selectedNodes",selectedNodes);
		if(curRightClickedTreeNode != null)
		{
			deleteNodes.push(curRightClickedTreeNode);
		}
	}
	else
	{
		deleteNodes = selectedNodes;
	}

	return deleteNodes;
}

//callback is for success delete
function DoDelete(treeNodes)
{
	if(treeNodes == null || treeNodes.length < 1)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("清选择需要删除的文件或目录"),
    	});
	}
	else
	{
		var treeNode = treeNodes[0];
		var msg =  _Lang("是否删除文件") + " [" + treeNode.name + "] ?";
		if(treeNodes.length > 1)
	  	{
			msg = _Lang("是否删除") + " " + treeNode.name + " " + _Lang("等") + treeNodes.length  + " " + _Lang("个文件") + " ?";
	  	}
		else
		{
			if(treeNode.type == 2)
			{
				msg =  _Lang("是否删除目录") + " [" + treeNode.name + "] ?";
			}
		}

		bootstrapQ.confirm({
			id: "deleteConfirm",
			title: _Lang("删除确认"),
    		okbtn: _Lang("删除"),
    		qubtn: _Lang("取消"),
			msg : msg,
			},function () {
		    	//alert("点击了确定");
				DocDelete.deleteDocs(treeNodes, gReposInfo.id);
		    	return true;
		 	});
	}
}

function refreshDoc(node, force)
{
	console.log("refreshDoc node:", node);

	var docId = 0;
	var pid = -1;
	var parentPath = "";
	var docName = "";
	var level = 0;
	var type = 2;

	if(node != null)
	{
		docId = node.id;
		pid = node.pid;
		parentPath = node.path;
		docName = node.name;
		level = node.level;
		type = node.type;
	}

	console.log("refreshDoc docId:" + docId + " type:"+ type + " level:" + level + " pid:" + pid + " path:" + parentPath + " name:" + docName);
	$.ajax({
        url : "/DocSystem/Doc/refreshDoc.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: gReposInfo.id,
            docId : docId,
            pid	: pid,
            type: type,
            level: level,
            path: parentPath,
            name: docName,
            force: force,
            shareId: gShareId,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	console.log("refresh ok:", ret.data);
		     	/*bootstrapQ.msg({
						msg : "刷新成功！",
						type : 'success',
						time : 1000,
				});*/

		     	//2秒后刷新页面
		        setTimeout(function ()
		        {
			     	window.location.reload();
	            }, 100);
            }
            else
            {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("刷新失败", " : ", ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("刷新失败", " : ", "服务器异常") + "!",
        	});
        }
	});
}

function showRenameDialog(node)
{
	console.log("showRenameDialog node:", node);

	bootstrapQ.dialog({
		id: 'renameConfirm',
		url: 'renameConfirm' + langExt + '.html',
		title: _Lang('重命名'),
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
        //okbtn: "确定",
		callback: function(){
			renameConfirmPageInit(node);
		},
	});

	return true;
}

function getSelectedNodes()
{
	var treeNodes = [];

	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	var selectedNodes = treeObj.getSelectedNodes();
	if(selectedNodes == null || selectedNodes.length < 2)
	{
		console.log("selectedNodes",selectedNodes);
		if(curRightClickedTreeNode != null)
		{
			treeNodes.push(curRightClickedTreeNode);
		}
	}
	else
	{
		treeNodes = selectedNodes;
	}

	return treeNodes;
}

function DoPaste(treeNodes,dstParentNode, isCopy)
{
	console.log("DoPaste()",treeNodes,dstParentNode);
	if(treeNodes == null || treeNodes.length < 1)
	{
		if(isCopy)
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("请选择需要复制的文件") + "!",
	    	});
		}
		else
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("请选择需要移动的文件") + "!",
	    	});
		}
		return;
	}

	if(isCopy)
	{
		console.log("StartCopy");
		DocCopy.copyDocs(treeNodes,dstParentNode,gReposInfo.id);
	}
	else
	{
		console.log("StartMove");
		DocMove.moveDocs(treeNodes,dstParentNode,gReposInfo.id);
	}
}

function copyDocName(node){
	if(node == null)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择文件或目录"),
    	});
		return false;
	}

	var docName = node.name;
	console.log("copiedDocName:" + docName);

	//window.clipboardData.setData("Text",url);	//剪贴板存在兼容性问题
	var obj=document.getElementById("copiedText");
	obj.value=docName;	//修改其中的值
	obj.select(); // 选择对象
	document.execCommand("Copy"); // 执行浏览器复制命令
    // 普通消息提示条
	bootstrapQ.msg({
				msg : _Lang('复制成功') + '!',
				type : 'success',
				time : 1000,
	});
}

function copyDocPath(node){
	if(node == null)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择文件或目录"),
    	});
		return false;
	}

	var docPath = node.path + node.name;
	console.log("docPath:" + docPath);

	//window.clipboardData.setData("Text",url);	//剪贴板存在兼容性问题
	var obj=document.getElementById("copiedText");
	obj.value=docPath;	//修改其中的值
	obj.select(); // 选择对象
	document.execCommand("Copy"); // 执行浏览器复制命令
    // 普通消息提示条
	bootstrapQ.msg({
				msg : _Lang('复制成功') + '!',
				type : 'success',
				time : 1000,
	});
}

function copyUrl(node){
	if(node == null)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择文件或目录"),
    	});
		return false;
	}

	var vid = gReposInfo.id;
	var docId = node.docId;
   	var path = base64_encode(node.path);
   	var name = base64_encode(node.name);
   	var href = "/DocSystem/web/project" + langExt + ".html?vid="+gReposInfo.id+"&doc="+docId+"&path="+path+"&name="+name;
	if(gShareId)
	{
		href += "&shareId"+gShareId;
	}
	console.log(href);
	var protocol = window.location.protocol + '//';
	var host = window.location.host;	//域名带端口
	//var host2=document.domain; 			//域名不带端口
	//var url = window.location.href;		//全路径
	var url = protocol + host + href;
	console.log(url);

	//window.clipboardData.setData("Text",url);	//剪贴板存在兼容性问题
	var obj=document.getElementById("copiedText");
	obj.value=url;	//修改其中的值
	obj.select(); // 选择对象
	document.execCommand("Copy"); // 执行浏览器复制命令
    // 普通消息提示条
	bootstrapQ.msg({
				msg : _Lang('复制成功') + '!',
				type : 'success',
				time : 1000,
	});
}

function copyString(str)
{
	var obj=document.getElementById("copiedText");
	obj.value=str;	//修改其中的值
	obj.select(); // 选择对象
	document.execCommand("Copy"); // 执行浏览器复制命令
    // 普通消息提示条
	bootstrapQ.msg({
				msg : _Lang('复制成功') + '!',
				type : 'success',
				time : 1000,
	});
}

var gFileSuffixForLocalApp = "";
function openWordApp(fileUrl)
{
	var customProtocol = "ms-word:" + fileUrl;
    window.location.href = customProtocol;
}

function openExcelApp(fileUrl)
{
	var customProtocol = "ms-excel:" + fileUrl;
    window.location.href = customProtocol;
}

function openPptApp(fileUrl)
{
	var customProtocol = "ms-powerpoint:" + fileUrl;
    window.location.href = customProtocol;
}

function openLocalApp(fileLink)
{
	switch(gFileSuffixForLocalApp)
	{
	case "doc":
	case "docx":
		fileLink += "/word." + gFileSuffixForLocalApp;
		openWordApp(fileLink);
		break;
	case "csv":
	case "xls":
	case "xlsx":
		fileLink += "/excel." + gFileSuffixForLocalApp;
		openExcelApp(fileLink);
		break;
	case "ppt":
	case "pptx":
		fileLink += "/ppt." + gFileSuffixForLocalApp;
		openPptApp(fileLink);
		break;
	}
}

function openInLocalApp(node) 
{
	gFileSuffixForLocalApp = getFileSuffix(node.name);
	getDocFileLink(node, openLocalApp, showErrorMessage, "REST"); //要求获取RESTFUL风格的fileLink
}

//文件下载接口
function downloadDoc(treeNodes,needConfirm,downloadType)
{
	console.log("downloadDoc downloadType:" + downloadType + " treeNodes:", treeNodes);
	if(!treeNodes || treeNodes == null)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择需要下载的文件") + "!",
    	});
		return;
	}
	if(needConfirm)
	{
		var fileName = treeNodes[0].name;
		if(treeNodes[0].docId == 0)
		{
			fileName = gReposInfo.name;
		}
		console.log("firstFile:"+fileName);

	  	var downloadDispInfo = fileName;
	  	if(treeNodes.length > 1)
	  	{
	  		downloadDispInfo = downloadDispInfo + " " + _Lang("等") + treeNodes.length + " " +_Lang("个文件");
	  	}

		if(downloadType && downloadType == 2)
		{
  			downloadDispInfo = downloadDispInfo + _Lang("的备注");
		}

		qiao.bs.confirm({
	        id: 'downloadConfirm',
	        msg: _Lang('是否下载') + ' ' + downloadDispInfo + ' ?',
	        title: _Lang("确认"),
	        okbtn: _Lang("下载"),
	        qubtn: _Lang("取消"),
	    },function(){
	        //alert('点击了确定！');
			DocDownload.downloadDocs(treeNodes, null, gReposInfo.id,downloadType);
	    },function(){
	        //alert('点击了取消！');
	    });
	}
	else
	{
		DocDownload.downloadDocs(treeNodes, null, gReposInfo.id,downloadType);
	}
}

/*文件上传实现*/
function uploadFilesEx()
{
	var node = getNodeByNodeId(gDocInfo.docId);
	gParentNodeForUpload = getParentNodeByNode(node);
    uploadFiles();
}

function uploadDirEx()
{
	var node = getNodeByNodeId(gDocInfo.docId);
	gParentNodeForUpload = getParentNodeByNode(node);
    uploadDir();
}

//文件上传入口
function uploadFiles(){
	console.log("uploadFiles() gParentNodeForUpload:",gParentNodeForUpload);
	//清除文件控件
	$("#uploadFiles").val("");

	$("#uploadType").val(1); //文件
    return $("#uploadFiles").click();
}

//文件夹上传入口
function uploadDir(){
	console.log("uploadDir() gParentNodeForUpload:",gParentNodeForUpload);
	//清除文件控件
	$("#uploadDir").val("");

	$("#uploadType").val(2);
    return $("#uploadDir").click();
}

//文件chekcIn入口
function checkInFile(){
	console.log("checkInFile() gParentNodeForUpload:",gParentNodeForUpload);
	//清除文件控件
	$("#checkInFile").val("");

	return $("#checkInFile").click();
}


//get the filename
function getFileName(o){
    var pos=o.lastIndexOf("\\");
    return o.substring(pos+1);
}

//upload file confirm dialog
function selectUploadConfirm(e)
{
	console.log("selectUploadConfirm",gParentNodeForUpload);
    var entrys = e.target.files;

	checkUserUploadRight(entrys,gParentNodeForUpload,uploadConfirm);
	return true;
}

function dragUploadConfirm(e,parentNode)
{
	console.log("dragUploadConfirm",e);
	DragUploadInit(e, parentNode);
}

//CheckInUpload Confirm
function checkInUploadConfirm(e)
{
	console.log("checkInUploadConfirm",e,gParentNodeForUpload);
    var entrys = e.target.files;
    var fileName = entrys[0].name;
    console.log("checkInUploadConfirm fileName" + fileName);

    if(fileName != curCheckInDoc.name)
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择文件") + " : " + curCheckInDoc.name,
    	});
	    return false;
    }

    checkUserUploadRight(entrys,gParentNodeForUpload,uploadWithoutConfirm);
    return true;
}

//获取用户的权限
function checkUserUploadRight(files,parentNode,callback)
{
	console.log("checkUserUploadRight() parentNode:",parentNode);

	//get the parentInfo
  	var parentPath = "";
  	var parentId = 0;
  	var level = 0;
  	var pPath = "";
  	var pName = "";
	if(parentNode && parentNode != null)
	{
		parentPath = parentNode.path + parentNode.name+"/";
		pPath = parentNode.path;
		pName = parentNode.name;
		parentId=parentNode.id;
		level = parentNode.Level;
	}
	else
	{
		parentNode=null;

	}

	var vid = gReposInfo.id;
	var remoteDir = "/" + parentPath;	//only for display

	$.ajax({
		url : "/DocSystem/Repos/getUserDocAuth.do",
		type : "post",
		dataType : "json",
		data : {
			docId : parentId,
			reposId : vid,
			path: pPath,
			name: pName,
			shareId: gShareId,
		},
		success : function (ret){
			if( "ok" == ret.status){
				var docAuth = ret.data;
				console.log(docAuth);
				if(docAuth.addEn == 1 || docAuth.editEn == 1)
				{
					callback && callback(files,parentNode);
				}
				else
				{
					showErrorMessage({
		        		id: "idAlertDialog",	
		        		title: _Lang("提示"),
		        		okbtn: _Lang("确定"),
		        		msg: _Lang("您没有新增或修改权限") + "[" + remoteDir + "]",
			    	});
				}
				return;
			}
			else
			{
				showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("错误", " : ", ret.msgInfo),
		    	});
				return;
			}
		},
		error : function () {
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("错误", " : ", "服务器异常"),
	    	});
			return;
		}
	});
}

//drag upload file confirm dialog（拖拽上传的确认对话框）
function uploadConfirm(files,parentNode)
{
	console.log("uploadConfirm()");
	showUploadConfirmPanel(files, parentNode);
	return true;
}

function showUploadConfirmPanel(files, parentNode)
{
	console.log("showUploadConfirmPanel()");

	bootstrapQ.dialog(
		{
			id: 'uploadConfirm',
			url: 'uploadConfirm' + langExt + '.html',
			title: _Lang('文件上传'),
			msg: _Lang('页面正在加载，请稍侯') + '...',
			foot: false,
			big: false,
			//okbtn: "开始上传",
			callback: function(){	//page load ok callback
				var showCommitMsg = false;
				if(gReposInfo.verCtrl && gReposInfo.verCtrl != 0)
				{
					showCommitMsg = true;
				}
				uploadConfirmPageInit(files, parentNode, showCommitMsg);
			},
		});
}

function uploadWithoutConfirm(files,parentNode)
{
	console.log("uploadWithoutConfirm()");

	//get the parentInfo
  	var parentPath = "";
  	var parentId = 0;
  	var level = 0;
	if(parentNode && parentNode != null)
	{
		parentPath = parentNode.path + parentNode.name+"/";
		parentId=parentNode.id;
		level = parentNode.Level;
	}
	else
	{
		parentNode=null;
	}

	var vid = gReposInfo.id;

	//开始上传
	FileUpload.uploadDocs(files,parentNode,parentPath,parentId,level,vid);
    return true;
}



//Re Upload Fail Docs
function reuploadFailDocs(index)
{
	console.log("reuploadFailDocs() index:" + index);
	FileUpload.reuploadFailDocs(index);
}

//Stop Upload
function stopUpload(index)
{
	//var index = $(this).attr('value');	//value 不是i的原生属性，所以不能用value
	console.log("stopUpload " + index);
	FileUpload.stopUpload(index);
}

//删除多余的treeNode
function deleteDuplicatedTreeNode(name,parentNode)
{
	console.log("deleteDuplicatedTreeNode",name,parentNode);
	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	var nodes = treeObj.getNodesByParam("name", name, parentNode);
	console.log(nodes);
	if(nodes!=null && nodes.length > 1)
	{
		var size = nodes.length;
		var i = 1;
		//删除多余的treeNode
		for(i=1;i<size;i++)
		{
			Node = nodes[i];
			treeObj.removeNode(Node);
		}
	}
	return;
}

function deleteTreeNodeById(docId)
{
	console.log("deleteTreeNode docId:" + docId);
	if(docId && docId != null)
	{
		var zTree = $.fn.zTree.getZTreeObj("doctree");
		var node = zTree.getNodeByParam("id",docId);
		if(node!=null)
		{
			zTree.removeNode(node);
		}
	}
}

function deleteTreeNode(name,parentNode)
{
	console.log("deleteTreeNode",name,parentNode);
	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	var Node = treeObj.getNodeByParam("name", name, parentNode); //找到新的目录下，id与被复制的节点相同id的Node(这是zTree自动产生的，我要删掉他)
	if(Node!=null)
	{
		treeObj.removeNode(Node);
	}
}

//下载状态框显示控制
$(".el-download-list").delegate(".downloadCloseBtn","click",function(){
	var downloadStatus = DocDownload.getDownloadStatus();
	console.log("downloadStatus:" + downloadStatus);
	if(downloadStatus == "busy")
    {
		qiao.bs.confirm({
	        id: 'downloadCloseConfirm',
	        msg: _Lang('下载还未结束，是否终止下载') + " ?",
	        title: _Lang("确认"),
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
		},function(){
	        //alert('点击了确定！');
	    	DocDownload.stopAllDownload();
	    },function(){
	        //alert('点击了取消！');
	    });
    }
    else
    {
    	$(".el-download-list").hide();
    }
});

var showDownloadList = true;
$(".el-download-list").delegate(".download-list-title","click",function(){
	var offsetBottom = getOffsetBottomForDownloadBox();
	//Switch DownloadList Display
	if(showDownloadList == true)
	{
		showDownloadList = false;
	}
	else
	{
		showDownloadList = true;
	}
	showDownloadBox(offsetBottom);
});

function getOffsetBottomForDownloadBox()
{
	if($(".el-upload-list").is(":hidden"))
	{
		return 0;
	}
	
	if(showUploadList)
	{
		return $(".el-upload-list").height() + 40;
	}
	
	return 40;
}

function showDownloadBox(offsetBottom)
{
	console.log("offsetBottom:" + offsetBottom);
	var height = offsetBottom + "px";
	if(showDownloadList == false)
	{
		//收起状态
		height = offsetBottom - $(".el-download-list").height() + "px";
		$(".el-download-list").animate({bottom: height});
		$(".downloadCloseBtn").animate({opacity: 0});	//隐藏关闭按键
	}
	else
	{
		$(".el-download-list").animate({bottom: height});
		$(".downloadCloseBtn").animate({opacity: 1});	//显示关闭按键
	}
}

//上传进度框显示控制
$(".el-upload-list").delegate(".uploadCloseBtn","click",function(){
	var uploadStatus = FileUpload.getUploadStatus();
	//uploadStatus = "busy";
	console.log("uploadStatus:" + uploadStatus);
	if(uploadStatus == "busy")
    {
		qiao.bs.confirm({
	        id: 'bsconfirm',
	        msg: _Lang('上传还未结束，是否终止上传') + " ?",
	        title: _Lang("确认"),
	        okbtn: _Lang("是"),
	        qubtn: _Lang("否"),
		},function(){
	        //alert('点击了确定！');
	    	FileUpload.stopAllUpload();
	    },function(){
	        //alert('点击了取消！');
	    });
    }
    else
    {
    	$(".el-upload-list").hide();
    	showDownloadBox(0);
    }
});

var showUploadList = true;
$(".el-upload-list").delegate(".upload-list-title","click",function(){
	var uploadListHeight = $(".el-upload-list").height();
	if(showUploadList == true)
	{
		showUploadList = false;
		//收起进度
		var height = - uploadListHeight + "px";
		$(".el-upload-list").animate({bottom: height});
		$(".uploadCloseBtn").animate({opacity: 0});	//隐藏关闭按键
		//$(this).animate({opacity: 0});	//隐藏title，好像title不应该隐藏
		showDownloadBox(40);
	}
	else
	{
		showUploadList = true;
		$(".el-upload-list").animate({bottom: "0px"});
		$(".uploadCloseBtn").animate({opacity: 1});	//显示关闭按键
		//$(this).animate({opacity: 1});	//this 指向的是title，显示title
		showDownloadBox(uploadListHeight + 40);
	}
});

/* 上传进度放在目录树的实现，不友好，代码放这里是可能给其他实现作参考
$('.lookPro').on('click',function(){
	$(".el-upload-list").show();
	$('.main').removeClass('active');
	$(this).addClass('active');
});
$('.main').on('click',function(){
	$(".el-upload-list").hide();
	$('.lookPro').removeClass('active');
	$(this).addClass('active');
});
*/

var zTree = jQuery.fn.zTree;

$(document).keydown(function(e){
    // ctrl + s
    if( e.ctrlKey  == true && e.keyCode == 83 ){

        return false;
    }
});

// 从 url 中获取参数
function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

function getTime() {
    var now= new Date(),
    h=now.getHours(),
    m=now.getMinutes(),
    s=now.getSeconds(),
    ms=now.getMilliseconds();
    return (h+":"+m+":"+s+ " " +ms);
}

var events = $("body");
var catalog = null;
/**
 * 初始化高亮插件
 */
function initHighlighting() {
    $('pre code').each(function (i, block) {
        hljs.highlightBlock(block);
    });

    hljs.initLineNumbersOnLoad();
}
$(function () {
    initHighlighting();

    var windowHeight = $(window).height();
    var bodyHeight = $(document).height();

    $(window).resize(function(){
        var windowHeight = $(window).height();
        var bodyHeight = $(document).height();
    });

    /*
     catalog = $("#sidebar").jstree({
     'plugins':["wholerow","types"],
     "types": {
     "default" : {
     "icon" : false  // 删除默认图标
     }
     },
     'core' : {
     'check_callback' : false,
     "multiple" : false ,
     'animation' : 0
     }
     }).on('select_node.jstree',function (node,selected,event) {
     $(".m-manual").removeClass('manual-mobile-show-left');
     var url = selected.node.a_attr.href;

     if(url == window.location.href){
     return false;
     }


     $.ajax({
     url : url,
     type : "GET",
     beforeSend :function (xhr) {
     var body = events.data('body_' + selected.node.id);
     var title = events.data('title_' + selected.node.id);
     var doc_title = events.data('doc_title_' + selected.node.id);

     if(body && title && doc_title){

     $("#page-content").html(body);
     $("title").text(title);
     $("#article-title").text(doc_title);

     events.trigger('article.open',url,true);

     return false;
     }
     NProgress.start();
     },
     success : function (res) {
     if(res.errcode == 0){
     var body = res.data.body;
     var doc_title = res.data.doc_title;
     var title = res.data.title;

     $("#page-content").html(body);
     $("title").text(title);
     $("#article-title").text(doc_title);

     events.data('body_' + selected.node.id,body);
     events.data('title_' + selected.node.id,title);
     events.data('doc_title_' + selected.node.id,doc_title);

     events.trigger('article.open',url,false);

     }else{
     layer.msg("加载失败");
     }
     },
     complete : function () {
     NProgress.done();
     }
     });
     });*/

    $("#slidebar").on("click",function () {
        $(".m-manual").addClass('manual-mobile-show-left');
    });
    $(".manual-mask").on("click",function () {
        $(".m-manual").removeClass('manual-mobile-show-left');
    });
});

events.on('article.open', function (event, url,init) {
    if ('pushState' in history) {

        if (init == false) {
            history.replaceState({}, '', url);
            init = true;
        } else {
            history.pushState({}, '', url);
            }

        } else {
            location.hash = url;
        }
        initHighlighting();

    });

/******************************** Repos Interfaces***************************************/
function getReposInfo(reposId, callback){
	console.log("getReposInfo");
    $.ajax({
        url : "/DocSystem/Repos/getRepos.do",
        type : "post",
        dataType : "json",
        data : {
            vid : reposId,
            shareId: gShareId,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	gReposInfo = ret.data;
            	console.log("gReposInfo:", gReposInfo);

            	gRootDoc.vid = gReposInfo.id;
            	gRootDoc.shareId = gShareId;
            	if(!gRootDoc.showName)
            	{
                	gRootDoc.showName = gReposInfo.name;
                    $("#projectName").text(gRootDoc.showName);
            	}

				callback && callback();
                //初始化目录树和Doc
				//InitMenuAndDoc();
            }else {
                $("#projectName").text("仓库名");
                showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("获取仓库信息失败", " : " , ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("获取仓库信息失败", " : " , "服务器异常"),
        	});
        }
    });
}


function getNodeById(docId)
{
	if(docId && docId != null)
	{
		var zTree = $.fn.zTree.getZTreeObj("doctree");
		var node = zTree.getNodeByParam("id",docId);
		return node;
	}
	return null;
}

//从后台获取zTree数据: callback1是成功后的回调函数1，需要后续处理的话加在这里处理
function getInitMenu(docId, parentPath, docName, callback)
{
	console.log("getInitMenu docId:" + docId + " parentPath:" + parentPath + " docName:" + docName);

	$.ajax({
	    url : "/DocSystem/Repos/getReposInitMenu.do",
	    type : "post",
	    dataType : "json",
	    data : {
	        reposId : gReposInfo.id,
	    	docId:  docId,
	    	path: parentPath,
	    	name: docName,
	    	shareId: gShareId,
	    },
	    success : function (ret) {
	        	if( "ok" == ret.status ){
	        		console.log("getMenu() ret",ret);
	                reDrawMenu(ret.data);
	                //选中文件
	         		var treeNode = getNodeByNodeId(docId);
	        		if(treeNode && treeNode != null)
	        		{
	        			var zTree = $.fn.zTree.getZTreeObj("doctree");
	        			//select this node in zTree
	        		 	zTree.selectNode(treeNode);
	        		}
	        		callback && callback();
	            }
	            else
	           	{
                	if(ret.msgData && ret.msgData == "1")	//需要验证访问密码
                	{
                		var node = ret.data;
                		showDocPwdVerifyPanel(node, refreshPage);
                	}
                	else
                	{
                		showErrorMessage({
                    		id: "idAlertDialog",	
                    		title: _Lang("提示"),
                    		okbtn: _Lang("确定"),
                    		msg: _Lang("获取仓库目录失败", " : " , ret.msgInfo),
                    	});
                	}
	           	}
	        },
	        error : function () {
	        	showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("获取仓库目录失败", " : " , "服务器异常"),
	        	});
	        }
	    });
}

function refreshPage()
{
	console.log("refreshPage()");
    setTimeout(function ()
    {
     	window.location.reload();
    }, 100);
}

/******************************** Doc Interfaces***************************************/
function updateProjectName()
{
	if(gIsPC == true)
	{
		//电脑端不需要更新显示
		return;
	}

	if(!gDocInfo.docId || gDocInfo.docId == 0)
	{
		$("#projectName").text(gRootDoc.showName);
	}
	else
	{
		if(gDocInfo.type == 2)
		{
			$("#projectName").text(gDocInfo.name);
		}
		else
		{
			//For File need to show parent docName
			$("#projectName").text(gDocInfo.name);
		}
	}
}

function updateUrl()
{
	console.log("updateUrl() reposId:" + gReposInfo.id + " gDocInfo:", gDocInfo);
	updateProjectName();
	if(gDocInfo.docId)
	{
    	//避免取回来时乱码
	   	var path = base64_encode(gDocInfo.path);
	   	var name = base64_encode(gDocInfo.name);
	   	console.log("after encode path:" + path + " name:" + name);

	   	//path = decodeURI(path);
	   	//name = decodeURI(name);
	   	//console.log("after decode path:" + path + " name:" + name);
        //Update URL 保证页面刷新后还是处于正确的状态
        var param = {
        	vid : gReposInfo.id,
            shareId: gShareId,
	        doc : gDocInfo.docId,
            path: path,
            name: name,
            edit: gDocInfo.edit,
            showType: gShowType,
        };
        var url = makeUrl(param);
		window.history.pushState({}, "wiki", url);
	}
	else
	{
        //Update URL 保证页面刷新后还是处于正确的状态
        var param = {
        	vid : gReposInfo.id,
        	shareId: gShareId,
        	showType: gShowType,
        };
        var url = makeUrl(param);
		window.history.pushState({}, "wiki", url);
	}
}

//清除Doc预览信息
function cleanDocPreview()
{
	console.log("cleanDocPreview() ");

	//clean gDocInfo
	updateGDocInfo(gRootDoc);
	
	//更新预览信息
	previewDoc(gDocInfo);
}

function updateGDocInfo(doc, dataEx, openMode)
{
	//Reset gDocInfo
	gDocInfo = {};
	
	if(doc)
	{	
        gDocInfo.vid = gReposInfo.id;
    	gDocInfo.docId = doc.docId;
    	gDocInfo.path = doc.path;
    	gDocInfo.name = doc.name;
    	gDocInfo.type = doc.type;
    	gDocInfo.isBussiness = doc.isBussiness;
    	gDocInfo.officeType = doc.officeType;
    	gDocInfo.size = doc.size;
    	gDocInfo.createTime = doc.createTime;
    	gDocInfo.latestEditTime = doc.latestEditTime;
    	
    	//扩展参数
    	gDocInfo.dataEx = dataEx;
    	gDocInfo.openMode = openMode;
	}
	
	updateUrl();
}

//getAndShowDoc涉及密码校验问题，因此更新gDocInfo以及预览的前提是要获取成功
function getAndShowDoc(node, openMode, edit)
{
	console.log("getAndShowDoc() gShowType:" + gShowType + " openMode:" + openMode + " edit:" + edit + " node:", node);
  	if(!node || node == null || node.id == 0)	//undefine do clean the info of rightDiv
  	{
  		cleanDocPreview();
      	return;
    }

    //To get DocInfo and Show Doc
	$.ajax({
        url : "/DocSystem/Doc/getDoc.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: gReposInfo.id,
            docId : node.id,
            pid: node.pid,
            path: node.path,
            name: node.name,
            docType: 0, //不读取文件内容和备注内容
            shareId: gShareId,
        },
        success : function (ret) {
        	console.log("getAndShowDoc ret",ret);
        	if( "ok" == ret.status )
        	{
        		var doc = ret.data
        		console.log("getAndShowDoc gDocInfo.docId:" + gDocInfo.docId + " docId:" + doc.docId + " gShowType:" + gShowType);
            	
        		updateGDocInfo(doc, ret.dataEx, openMode);
				
        		//openMode == 2则需要打开文件
        		if(openMode == 2)
        		{
          		  openDoc(gDocInfo, false, "openInArtDialog", "office", gShareId);
        		}
        		//当前文件处于打开状态，则不会进行预览
                previewDoc(gDocInfo, gShowType);
            }
            else
            {
            	console.log(ret.msgInfo);
            	if(ret.msgData && ret.msgData == "1")	//需要验证访问密码
            	{
            		if(gDocInfo.docId || gDocInfo.docId == 0)
            		{
            			showDocPwdVerifyPanel(node, refreshPage);	//rootDoc need refreshPage
            		}
            		else
            		{
            			showDocPwdVerifyPanel(node);
            		}
            	}
            	else
            	{
            		showErrorMessage({
                		id: "idAlertDialog",	
                		title: _Lang("提示"),
                		okbtn: _Lang("确定"),
                		msg: _Lang("获取文件信息失败", " : ", ret.msgInfo),
                	});
                	cleanDocPreview();
            	}
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("获取文件信息失败", " : ", "服务器异常"),
        	});
            cleanDocPreview();
        }
    });
}

function showDocPwdVerifyPanel(node, successCallback)
{
	console.log("showDocPwdVerifyPanel node",node);
	bootstrapQ.dialog({
		id: 'docPwdVerify',
		url: 'docPwdVerify' + langExt + '.html',
		title: _Lang('密码验证'),
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
		big: false,
		callback: function(){
			DocPwdVerifyPageInit(gReposInfo.id, node, successCallback);
		},
	});
}

//Function: previewDoc
var gDocInfoInPreview;	//当前预览中的Doc
function previewDoc(doc, showType)
{
	console.log("previewDoc gShowType:" + gShowType + " doc", doc);
	if(doc == undefined)
	{
		return;
	}
	
	if(gDocInfoInPreview != undefined && doc.docId == gDocInfoInPreview.docId)
	{
    	//该文件已处于预览状态
    	return;
    }
	
	if(vdocEditor.getEditState() == true)
	{
		console.log("previewDoc 文档编辑中，请先退出编辑");
		return;
	}
	
	//TODO:注意gDocInfo可能是根目录
	//更新gDocInfoInPreview
	gDocInfoInPreview = doc;
	if(gShareId)
	{
		gDocInfoInPreview.shareId = gShareId;
	}

	//更新文件名显示
	$('#filetitle').html(doc.name);
	
	//显示文件图标
	var fileSuffix = getFileSuffix(doc.name);
	doc.fileSuffix = fileSuffix;

	if(showType == 2)	//电子书模式：不显示图标
	{
	     $("#docPreview").hide();
	}
	else	//标准模式：显示图标或图片、视频
	{
		$("#docPreview").show();
		if(isPicture(fileSuffix))
		{
			showFileLogo(null);
			showFileImg(doc);				
            showVideoPreview(false);
            showAudioPreview(false);
		}
		else if(isVideo(fileSuffix))
		{
			showFileLogo(null);
			showFileImg(null);
            showVideoPreview(true);
            showAudioPreview(false);
		}
		else if(isAudio(fileSuffix))
		{
			//TODO: 音频无法在project.html预览
			//showFileLogo(null);
			//showFileImg(null);
            //showVideoPreview(false);
            //showAudioPreview(true);	
            showFileLogo(doc);
			showFileImg(null);
	        showVideoPreview(false);
            showAudioPreview(false);
		}
		else
		{
			showFileLogo(doc);
			showFileImg(null);
	        showVideoPreview(false);
            showAudioPreview(false);
		}
	}

	//显示备注
	vdocEditor.openDocument(doc);
}

function DocOnClick()
{
	console.log("DocOnClick()");
	//for pad or phone need to open it
	if(gIsPC == false)
	{
		DocOnDblClick();
	}
}

//对于直接图标直接点击将尝试打开二进制文件
function DocOnDblClick()
{
	if(gDocInfoInPreview.type == 1)
	{
    	//open doc in dialog
    	openDoc(gDocInfoInPreview, true, "openInArtDialog", "office", gShareId);
	}
	else
	{
		showDocList(gDocInfoInPreview);
		showCenterDiv();
	}
}

function showFileImg(docInfo)
{
	if(docInfo == null)
	{
		$("#imgPreview").attr('src', "");
		$("#imgPreview").hide();
		return;
	}

	return showImgPreview(docInfo);
}

function showImgPreview(docInfo)
{
	var docDataEx = docInfo.dataEx;
	if(!docDataEx || docDataEx == null)	//表明不是文件，无法预览
	{
		console.log("showImgPreview() dataEx is null");
		showFileImg(docInfo);
		return;
	}

	docDataEx.shareId = gShareId;
	var docLink = getDocImagePreviewLink(docInfo, 1, "REST");

	console.log("showImgPreview() docLink:" + docLink);
	$("#imgPreview").attr('src', docLink);
	$("#imgPreview").show();
}

function showFileLogo(docInfo)
{
	if(docInfo == null)
	{
		$("#fileLogo").attr('src', "");
		$("#fileLogo").hide();
		return;
	}

	if(docInfo.type == 2)
	{
		//showFolderLogo("win10");
		showFolderLogo("mac");
		return;
	}

	//Show File Logo
	var fileSuffix = docInfo.fileSuffix;
	var logoLink = "/DocSystem/web/images/file_icon/icon_file/file.png";
	if(fileSuffix && fileSuffix != "")
	{
		logoLink = "/DocSystem/web/images/file_icon/icon_file/" + fileSuffix + ".png";
	}
	$("#fileLogo").attr('src', logoLink);
	$("#fileLogo").show();
}

function showFolderLogo(style)
{
	var logoLink = "/DocSystem/web/images/file_icon/icon_others/folder.png";
	if(style && style != "")
	{
		logoLink = "/DocSystem/web/images/file_icon/icon_others/folder_" + style + ".png";
	}
	$("#fileLogo").attr('src', logoLink);
	$("#fileLogo").show();
}

function showAudioPreview(showFlag)
{
	if(showFlag == false)
	{
		$("#audioPreview").hide();
		return;
	}

	var docDataEx = gDocInfo.dataEx;
	if(!docDataEx || docDataEx == null)	//表明不是文件，无法预览
	{
		console.log("showAudioPreview() dataEx is null");
		showFileImg(docInfo);
		return;
	}
	docDataEx.shareId = gShareId;
	var docLink = getDocDownloadLink(gDocInfo);
	if(docLink == null)
	{
		console.log("showAudioPreview() docLink is null");
		$("#audioPreview").hide();
	}
	else
	{
		console.log("showAudioPreview() docLink:" + docLink);
		$("#audioPreview").show();
		previewAudioWithJplayer('audioPreview', docLink);
	}
}

function previewAudioWithJplayer(objId, fileLink)
{
	if(gAudioPlayer)
	{
		gAudioPlayer.jPlayer('setMedia', {
			mp3: fileLink // 音频文件路径
		});
	}
	else
	{
		$("#jquery_jplayer_1").jPlayer({
			ready: function () {
				gAudioPlayer = $(this);
				$(this).jPlayer("setMedia", {
					title: "Bubble",
					mp3: fileLink
				});
			},
			swfPath: "static/jPlayer/dist/jplayer",
			supplied: "mp3",
			wmode: "window",
			useStateClassSkin: true,
			autoBlur: false,
			smoothPlayBar: true,
			keyEnabled: true,
			remainingDuration: true,
			toggleDuration: true
		});
	}
}

function showVideoPreview(showFlag)
{
	if(showFlag == false)
	{
		$("#videoPreview").attr('src', "");
		//$("#videoPreview").attr('poster', "");
		$("#videoPreview").hide();
		return;
	}

	var docDataEx = gDocInfo.dataEx;
	if(!docDataEx || docDataEx == null)	//表明不是文件，无法预览
	{
		console.log("showVideoPreview() dataEx is null");
		showFileImg(docInfo);
		return;
	}
	docDataEx.shareId = gShareId;
	
	//TODO: 1表示需要转成mp4,如果是mp4或mov则只是拷贝到预览区(可以避免视频在预览的情况下无法删除或移动)
	var docLink = docLink = getDocVideoPreviewLink(gDocInfo, 1, "REST"); 
//	if(	gDocInfo.fileSuffix == "MOV" || gDocInfo.fileSuffix == "mov" || 
//		gDocInfo.fileSuffix == "MP4" || gDocInfo.fileSuffix == "mp4")
//	{
//		docLink = getDocDownloadLink(gDocInfo);
//	}
//	else	//如果不是mov和mp4格式的则需要进行格式转换
//	{
//		docLink = getDocVideoPreviewLink(gDocInfo, 1, "REST"); //1表示需要转成mp4
//	}
	//docLink = "/DocSystem/web/static/video-js/oceans.mp4";
	if(docLink == null)
	{
		console.log("showVideoPreview() docLink is null");
		$("#videoPreview").attr('src', "");
		//$("#videoPreview").attr('poster', "");
		$("#videoPreview").hide();
	}
	else
	{
		console.log("showVideoPreview() docLink:" + docLink);
		$("#videoPreview").attr('src', docLink);
		//$("#videoPreview").attr('poster', docLink);
		$("#videoPreview").show();
		//var type = getVideoTypeByFileSuffix(gDocInfo.fileSuffix);
		var type = "video/mp4"; //We always need to covert to mp4
		previewVideoWithVideojs('videoPreview', docLink, type);
	}
}


function previewVideoWithVideojs(objId, fileLink, type)
{
	if(gVideoPlayer)
	{
		var data = {
			src: fileLink,
			type: type
		};

		gVideoPlayer.pause();
		gVideoPlayer.src(data);
		gVideoPlayer.load(data);
		// 动态切换poster
		//gVideoPlayer.posterImage.setSrc(fileLink);
		//gVideoPlayer.play();
		// 销毁videojs
		//player.dispose();
	}
	else
	{
		gVideoPlayer = videojs(document.getElementById(objId), {
		  controls: true, // 是否显示控制条
		  poster: fileLink, // 视频封面图地址
		  preload: 'auto',
		  autoplay: false,
		  fluid: true, // 自适应宽高
		  language: 'zh-CN', // 设置语言
		  muted: false, // 是否静音
		  inactivityTimeout: false,
		  seeking: true,
		  controlBar: { // 设置控制条组件
		    /* 使用children的形式可以控制每一个控件的位置，以及显示与否 */
		    children: [
		      {name: 'playToggle'}, // 播放按钮
		      {name: 'currentTimeDisplay'}, // 当前已播放时间
		      {name: 'progressControl'}, // 播放进度条
		      {name: 'durationDisplay'}, // 总时间
		      { // 倍数播放
		        name: 'playbackRateMenuButton',
		        'playbackRates': [0.5, 1, 1.5, 2, 2.5]
		      },
		      {
		        name: 'volumePanel', // 音量控制
		        inline: false, // 不使用水平方式
		      },
		      {name: 'FullscreenToggle'} // 全屏
		    ]
		  },
		  sources:[ // 视频源
		      {
		          src: fileLink,
		          type: type,
		          poster: fileLink,
		      }
		  ]
		}, function (){
		  console.log('视频可以播放了',this);
		});
	}
}

function parseDocContent(content)
{
    if(!content || content == "")
    {
    	content = "";	//Convert it to empty String
    }
    else
    {
    	//docContent = JSON.parse(content);
    }

    //前台的Decode和Encode结果是一致的，后台的Decode一致但Encode之后Decode的结果不正确
    //base64_encode(content);
    //base64_decode(content);

    return content;
}

function getDocHistoryTitle(docName, docType, historyType)
{
	var title = "";
	switch(historyType)
	{
	case 0:
		if(docId == 0)
		{
			title = _Lang("历史版本") + " [/]";
		}
		else
		{
			if(docType == 2)
			{
				title = _Lang("历史版本") + " [" + docName + "/]";
			}
			else
			{
				title = _Lang("历史版本") + " [" + docName + "]";
			}
		}
		break;
	case 1:
		if(docId == 0)
		{
			title = _Lang("备注历史") + " [/]";
		}
		else
		{
			if(docType == 2)
			{
				title = _Lang("备注历史") + " [" + docName + "/]";				
			}
			else
			{
				title = _Lang("备注历史") + " [" + docName + "]";
			}
		}
		break;
	case 2:
		if(docId == 0)
		{
			title = _Lang("本地备份历史") + " [/]";
		}
		else
		{
			if(docType == 2)
			{
				title = _Lang("本地备份历史") + " [" + docName + "/]";
			}
			else
			{
				title = _Lang("本地备份历史") + " [" + docName + "]";				
			}				
		}
		break;
	case 3:
		if(docId == 0)
		{
			title = _Lang("异地备份历史") + " [/]";
		}
		else
		{
			if(docType == 2)
			{
				title = _Lang("异地备份历史") + " [" + docName + "/]";
			}
			else
			{
				title = _Lang("异地备份历史") + " [" + docName + "]";				
			}
		}
		break;
	case 4:
		if(docId == 0)
		{
			title = _Lang("回收站") + " [/]";
		}
		else
		{
			if(docType == 2)
			{
				title = _Lang("回收站") + " [" + docName + "/]";
			}
			else
			{
				title = _Lang("回收站") + " [" + docName + "]";				
			}
		}
		break;
	}
	return title;
}

function showDocHistory(node, historyType)
{
	console.log("showDocHistory() historyType:" + historyType);
	
	var parentPath ="";
	var docName = "";
	var docId = 0;
	var pid = 0;
	var docType = 2;

	switch(historyType)
	{
	case 0:
		if(gReposInfo.type != 5)	//前置仓库不检查
		{
			if(gReposInfo.verCtrl == undefined || gReposInfo.verCtrl == 0)
			{
				showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("该仓库未开通版本管理，请联系管理员") + "!",
		    	});
				return;
			}
		}
		break;
	case 2:
		if(gReposInfo.type == 5)	//前置仓库不支持
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("前置仓库不支持自动备份") + "!",
	    	});
			return;
		}
		
		if(gReposInfo.autoBackupConfig == undefined || gReposInfo.autoBackupConfig.localBackupConfig == undefined)
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("该仓库未开通本地备份，请联系管理员") + "!",
	    	});
			return;
		}
		break;
	case 3:
		if(gReposInfo.type == 5)	//前置仓库不支持
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("前置仓库不支持自动备份") + "!",
	    	});
			return;
		}
		
		if(gReposInfo.autoBackupConfig == undefined || gReposInfo.autoBackupConfig.remoteBackupConfig == undefined)
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("该仓库未开通异地备份，请联系管理员") + "!",
	    	});
			return;
		}
		break;
	case 4:
		if(gReposInfo.type == 5)	//前置仓库不支持
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("前置仓库不支持回收站") + "!",
	    	});
			return;
		}
		
		if(gReposInfo.recycleBinConfig == undefined || !gReposInfo.recycleBinConfig.enable)
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("该仓库未开通回收站功能，请联系管理员") + "!",
	    	});
			return;
		}
		break;
	}
	
	var treeNode = node;
	if(treeNode != null)
	{
		docId = treeNode.id;
		pid = treeNode.pid;
		parentPath = treeNode.path;
		docName = treeNode.name;
		docType = treeNode.type;
	}
	console.log("docId:" + docId + "parentPath:" + parentPath + " docName:"+docName);

	var title = getDocHistoryTitle(docName, docType, historyType);

	//show HistoryLogs page
	bootstrapQ.dialog({
		id: "historyPage",
		title: title,
		url: 'historyLogs' + langExt + '.html',
		msg: _Lang('页面正在加载，请稍侯') + '...',
			foot: false,
			big: true,
			callback: function(){
				DocHistory.historyLogsPageInit(gReposInfo.id, docId, pid, parentPath, docName, historyType);
			},
		});
}

/********************* 文件编辑接口 *********************************************/
function lockDoc(node, lockType)
{
	console.log("lockDoc() lockType:" + lockType, node);
	if(!node || node == null)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择需要锁定的文件") + "!",
    	});
		return;
	}

	var docId = node.docId;
	var pid = node.pid;
	var path = node.path;
	var name = node.name;
	var type = node.type;

	$.ajax({
		url : "/DocSystem/Doc/lockDoc.do",
		type : "post",
		dataType : "json",
		data : {
			lockType : lockType, //lockType: CheckOut
			reposId : gReposInfo.id,
			docId : docId,
			pid: pid,
			path: path,
			name: name,
			type: type,
            shareId: gShareId,
		},
		success : function (ret) {
			if( "ok" == ret.status){
				console.log(ret.data);
				$("[dataId='"+ docId +"']").children("div:first-child").css("color","red");
				return;
			}
			else
			{
				showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("锁定失败", " : ", ret.msgInfo),
		    	});
				return;
			}
		},
		error : function ()
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("锁定失败", " : ", "服务器异常"),
	    	});
			return;
		}
	});
}

function unlockDoc(node, lockType)
{
	console.log("unlockDoc() lockType:" + lockType, node);
	if(!node || node == null)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择需要解锁的文件") + "!",
    	});
		return;
	}

	var docId = node.docId;
	var pid = node.pid;
	var path = node.path;
	var name = node.name;
	var type = node.type;

	$.ajax({
		url : "/DocSystem/Doc/unlockDoc.do",
		type : "post",
		dataType : "json",
		data : {
			lockType : lockType, //lockType: Edit
			reposId : gReposInfo.id,
			docId : docId,
			pid: pid,
			path: path,
			name: name,
			type: type,
            shareId: gShareId,
		},
		success : function (ret) {
			if( "ok" == ret.status){
				console.log(ret.data);
				$("[dataId='"+ docId +"']").children("div:first-child").css("color","black");
			    return;
			}
			else
			{
				showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("解锁失败", " : ", ret.msgInfo),
		    	});
				return;
			}
		},
		error : function ()
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("解锁失败", " : ", "服务器异常"),
	    	});
			return;
		}
	});
}

function showDocPwdSetPanel(node)
{
	if(!node || node == null)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择需要设置访问密码的文件") + "!",
    	});
		return;
	}
	
	console.log("showDocPwdSetPanel node:", node);
	bootstrapQ.dialog({
		id: 'docPwdSet',
		url: 'docPwdSet' + langExt + '.html',
		title: _Lang('访问密码设置') + " [" + node.name + "]",
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
		big: true,
		//okbtn: "确定",
			callback: function(){
				DocPwdSetPageInit(gReposInfo.id, node);
			}, 
		}, null);
}

/********************** zTree设置与接口**********************************/

//右键点击所在的zTreeNode：用于右键菜单相关的操作:rename, remove, 新建,上传,下载
var curRightClickedTreeNode = null;
var gCopiedNodes = null;	//右键复制操作选中的节点
var gIsCopy = true;
var gParentNodeForUpload = null; //用于保存右键选择上传的父节点

//zTree's setting
var setting = {
   	//可编辑功能设置
	edit: {
           enable: true,
           removeTitle : _Lang("删除"),
           renameTitle : _Lang("重命名"),
           showRemoveBtn : false,
           showRenameBtn : false,
           drag: {
               autoExpandTrigger: true,
               prev: dropPrev,
               inner: dropInner,
               next: dropNext,
           },
       },
       //zTree数据格式
   	data: {
   			//使用简单数据模式
            simpleData: {
                enable: true,
            },
            //不允许修改leaf node and parent node的isParent属性
            keep: {
            	leaf: true,
            	parent: true,
            },
    },
    //zTree各种操作的回调函数定义
    callback: {
            beforeAsync: zTreeBeforeAsync, //异步加载前的回调函数， 可以用来判断是否需要异步加载
            onAsyncSuccess: zTreeOnAsyncSuccess, //异步加载完成后的回调
            beforeDrag: zTreeBeforeDrag,
            beforeDrop: zTreeBeforeDrop,
            onDrag : zTreeOnDrag,
            onDrop : zTreeOnDrop,
            onChange: zTreeOnChange,
            onClick: zTreeOnClick,
            onDblClick: zTreeOnDbClick,
            beforeRightClick: zTreeBeforeRightClick
            //onRightClick: zTreeOnRightClick, //定义该回调将会屏蔽系统右击事件
    },
    view: {
    	//showLine: false,	//不显示文件下面的下划线
    	//addDiyDom: addDiyDom         //设置zTree的自定义图标

    }
};

function addDiyDom(treeId, treeNode) {
    var aObj = $("#" + treeNode.tId + "_a");
    if ($("#diyBtn_"+treeNode.id).length>0) return;
	var cs = $("#" + treeNode.tId + "_a > span")[0];
	console.log("cs", cs);
	cs.remove();
	console.log( "treeNode" , treeNode);

    var switchObj = $("#" + treeNode.tId + "_switch");
    switchObj.remove();

    var iType = getIconByNameAndType( treeNode.name , treeNode.type);
    var iconType = '<svg class="color-icon" aria-hidden="true">\n' +
        '  <use xlink:href="'+ iType + '"></use>\n' +
        '</svg>';

    aObj.prepend( iconType );
    aObj.prepend( switchObj );

    //增加边距
    //此处通过往a标签最前位置增加透明元素来实现层级的缩进，层级越高，缩进的距离越大。同时也需要将原本的css中控制缩进的padding删除掉
    //var spaceWidth = 15;
    //var spaceStr = "<span style='display: inline-block;width:" + (spaceWidth * treeNode.level+15)+ "px'></span>";
    //var spaceStr = "<span style='display: inline-block;'></span>";
    //aObj.prepend( spaceStr )
};

function asyncDataFilter(treeId, parentNode, responseData) {
	console.log("asyncDataFilter");
	var docList = responseData.data;
	if(!docList)
	{
		return docList;
	}
	//遍历jason_arry, convert the node type to isParent flag
  	for(var i=0; i<docList.length; i++)
  	{
       var jsonObj = docList[i];
       jsonObj.id = jsonObj.docId;
       jsonObj.pId = jsonObj.pid != 0? jsonObj.pid : "root",
       jsonObj.isParent = jsonObj.type == 1? false: true;
       //设置用户自定义文件图标（必须在standardStyle中有定义）
       if(jsonObj.type == 1)
       {
    	   var iconType = getDiyFileIconType(jsonObj.name);
    	   if(iconType && iconType != "")
    	   {
    		   jsonObj.iconSkin = iconType;
    	   }
       }
   }
   console.log(docList);
   return docList;
}

function zTreeBeforeAsync(treeId, treeNode) {
	console.log("zTreeBeforeAsync treeId:"+ treeId, treeNode);
}

function zTreeOnAsyncSuccess(event, treeId, treeNode, msg) {
	console.log("zTreeOnAsyncSuccess treeId:" + treeId);
}

//This function was used to get the rightClick treeNode,it will be used for contextjs
function zTreeBeforeRightClick(treeId, treeNode) {

	curRightClickedTreeNode = treeNode;
	return true;
};

//This function will replace all righot click, so i did not use it
function zTreeOnRightClick(event, treeId, treeNode) {
	alert(treeNode ? treeNode.tId + ", " + treeNode.name : "isRoot");
};

//Drag and Drop Implementation Start: curDragNhodes was used to remember DragNodes
var className = "dark", curDragNodes, autoExpandNode;
//拖动前的检查
function zTreeBeforeDrag(treeId, treeNodes) {
    console.log("zTreeBeforeDrag");
    className = (className === "dark" ? "":"dark");
    for (var i=0,l=treeNodes.length; i<l; i++) {
        if (treeNodes[i].drag === false) {	//Current node can not drag
            curDragNodes = null;
            return false;
        } else if (treeNodes[i].parentTId && treeNodes[i].getParentNode().childDrag === false) { //Parent's child can not drag
            curDragNodes = null;
            return false;
        }
    }
    curDragNodes = treeNodes;
    return true;
}

function zTreeBeforeDragOpen(treeId, treeNode) {
    console.log("zTreeBeforeDragOpen");
    autoExpandNode = treeNode;
    return true;
}

//zTree拖动处理接口
function zTreeOnDrag()
{
	console.log("zTreeOnDrag");
 	//updateMenu();
}

//dropPre Next and Inner was use to check if it was allowed to drop
function dropPrev(treeId, nodes, targetNode) {
	console.log("dropPrev");
       var pNode = targetNode.getParentNode();
       if (pNode && pNode.dropInner === false) {
           return false;
       } else {
       	//当前被拖动的节点和目标节点如果在同一个目录不变化；不同目录，但所在目录子节点不允许移动则不变化
       	var l=curDragNodes.length;
           for (var i=0; i<l; i++) {
               var curPNode = curDragNodes[i].getParentNode();
               if (curPNode && curPNode !== targetNode.getParentNode() && curPNode.childOuter === false) {
                   return false;
               }
           }
       }
       return true;
}
function dropInner(treeId, nodes, targetNode) {
  	  console.log("dropInner");
      if (targetNode && targetNode.dropInner === false) {
          return false;
      }
      else {
          //if the curDragNodes was in the same directory with TargetNode do nothing
          for (var i=0,l=curDragNodes.length; i<l; i++) {
              if (!targetNode && curDragNodes[i].dropRoot === false) {
                  return false;
              } else if (curDragNodes[i].parentTId && curDragNodes[i].getParentNode() !== targetNode && curDragNodes[i].getParentNode().childOuter === false) {
                  return false;
              }
          }
      }
      return true;
  }
  function dropNext(treeId, nodes, targetNode) {
  	console.log("dropNext");
      var pNode = targetNode.getParentNode();
      if (pNode && pNode.dropInner === false) {
          return false;
      } else {
          for (var i=0,l=curDragNodes.length; i<l; i++) {
              var curPNode = curDragNodes[i].getParentNode();
              if (curPNode && curPNode !== targetNode.getParentNode() && curPNode.childOuter === false) {
                  return false;
              }
          }
      }
      return true;
  }

  //drop前检查函数
  function zTreeBeforeDrop(treeId, treeNodes, targetNode, moveType, isCopy) {
      console.log("zTreeBeforeDrop");

      //move this confirm to dropInner, it will be better
      //if (targetNode && targetNode.isParent !== true) { //leaf node can not drop
      //	console.log("can not drop to leaf node");
      //	return false;
      //}

      if(targetNode.drop === false)
      {
      	console.log("drop was not allowed for this node");
      	return false;
      }

      //get targe parentNode
  	  var parentNode = targetNode;
  	  if(targetNode)
  	  {
  			if(moveType == "prev" || moveType == "next")	//如果拖到节点的前面或后面，则表示要放到上一层目录,leaf的inner属性是通过setting来控制的
  			{
  				parentNode = targetNode.getParentNode();
  			}
  			else
  			{
      			parentNode = targetNode;
  			}
  	  }
  	  else
  	  {
  		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("targetNode is null,理论上不该出现"),
    	});
  			return false;
  	  }

      className = (className === "dark" ? "":"dark");
      return true;
  }

  //Drop处理函数
  function zTreeOnDrop(event, treeId, treeNodes, targetNode, moveType, isCopy)
  {
  		console.log("zTreeOnDrop");

  		if(moveType == null)	//无效拖放，不处理
		{
			//alert("Invalid drag and drop!");
			return;
		}

  		//get targe parentNode
  		var parentNode = targetNode;
  		if(targetNode)
  		{
  			//对于leaf node, prev next inner都是指放到其父节点下
  			if(targetNode.isParent == false)
			{
				parentNode = targetNode.getParentNode();
 			}
 			else
 			{
 				if(moveType == "prev" || moveType == "next")	//如果拖到节点的前面或后面，则表示要放到上一层目录
  				{
  					parentNode = targetNode.getParentNode();
  				}
  				else
  				{
      				parentNode = targetNode;
  				}
 			}
  		}
  		else
  		{
  			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("目标节点不存在") + "!",
  	    	});
  			return;
  		}

		var vid = gReposInfo.id;

		qiao.bs.confirm({
		        id: 'bsconfirm',
		        msg: _Lang('是否移动文件') + " ?",
		        title: _Lang("确认"),
		        okbtn: _Lang("是"),
		        qubtn: _Lang("否"),
		},function(){
		        //alert('点击了确定！');
	      		DocMove.moveDocs(treeNodes,parentNode,vid);
		},function(){
		        //alert('点击了取消！');
		});
  }
  //Drag and Drop Implementation End

  //zTree API没有onChange事件定义啊，汗，大概就zTree发送变化时的处理函数
  function zTreeOnChange()
  {
   	console.log("zTreeOnChange");
  }

  function selectAllNode(currentNode)
  {
	  var parentNode = null;
	  var pid = 0;
	  if(currentNode != null)
	  {
  			var node = getNodeByNodeId(currentNode.docId);
			gParentNode = getParentNodeByNode(node);
  		    pid = currentNode.pid;
	  }
	  var treeObj = $.fn.zTree.getZTreeObj("doctree");
	  var nodes = treeObj.getNodesByParam("pid", pid, parentNode);
	  for (var i=0, l=nodes.length; i < l; i++) {
			treeObj.selectNode(nodes[i], true, true); //
	  }
  }

  //为了能够让外部接口能够调用zTree的callback，需要记录当前treeNode等变量
  function zTreeOnClick(event, treeId, treeNode)
  {
	  console.log("zTreeOnClick() treeId:" + treeId);
	  
	  DocListState = 0;

	  if(!gDocInfo.docId || gDocInfo.docId == 0)
	  {
	  		//没有处于打开状态的文件，直接打开文件，摘要模式
      		getAndShowDoc(treeNode, 1, false);
      		showDocList(treeNode);
	  		return;
	  }

	  
	  if(gDocInfo.docId == treeNode.id)
	  {
		  //当前文件处于打开状态，则不会进行预览
		  previewDoc(gDocInfo, gShowType);
		  return;
	  }
   	  
	  getAndShowDoc(treeNode, 1, false);
	  showDocList(treeNode);    	  
  }

  //Double Click 对于文件应该是编辑，对于目录应该是打开
  function zTreeOnDbClick(event, treeId, treeNode)
  {
	  //alert("zTreeOnDbClick");
	  if(!gDocInfo.docId || gDocInfo.docId == 0)
	  {
	  		//没有处于打开状态的文件，直接打开新文件（详情模式）
      		getAndShowDoc(treeNode, 2, false);
	  		return;
	  }

	  //文件列表已展示
	  if(gDocInfo.docId == treeNode.id)
	  {
		  //直接用gDocInfo打开文件
		  openDoc(gDocInfo, false, "openInArtDialog", "office", gShareId);
		  
		  //预览gDocInfo(该接口会自行判断是否需要更新gDocInfoInPreview)
		  previewDoc(gDocInfo);
		  return;
	  }
	  
	  //文件没有被打开 (openMode = 2 表示需要打开文件并预览文件（比如dbclick事件），openMode = 1 则表示只需要预览文件（比如click事件）)
      getAndShowDoc(treeNode, 2, false);
 }

//判断当前目录下名字为 name的Node是否已经存在，parentNode是null表示根目录
function isNodeExist(name,parentNode)
{
	var parentId = null;
	if(parentNode && parentNode.id)
	{
		parentId =  parentNode.id;
	}

	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	var nodes = treeObj.getNodesByParam("name", name, parentNode);
	for (var i=0,l=nodes.length; i<l; i++)
	{
		if(nodes[i].pId == parentId)
		{
			//alert(name + " 已存在");
			return true;
		}
	}
	return false;
}

//get the treeNode under parentNode with name
function getNodeByName(name,parentNode)
{
	var parentId = null;
	if(parentNode && parentNode.id)
	{
		parentId =  parentNode.id;
	}

	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	var nodes = treeObj.getNodesByParam("name", name, parentNode);
	for (var i=0,l=nodes.length; i<l; i++)
	{
		if(nodes[i].pId == parentId)
		{
			return nodes[i];
		}
	}
	return null;
}

//获取Node的path
function getNodePath(treeNode)
{
	var path = "";
	if(treeNode)
	{
		var nodes = treeNode.getPath();	//获取当前节点的所有父节
		console.log("getNodePath() nodes ",nodes);
		for( var i = 0 ; i < nodes.length-1; i++ )
		{
			path = path + nodes[i].name + "/";
		}
	}
	return path;
}

//该接口是为了避免新增Node时触发的异步加载导致出现多个Node
function addTreeNode(node)
{
	console.log("addTreeNode() node:",node);

	if(!node || node == null)
	{
		console.log("addTreeNode() node is null");
		return;
	}

	var isParent = false;
	if(node.type == 2)
	{
		isParent = true;
	}

	var parentNode = undefined;
	var pId = node.pid;
	if(node.pid == 0)
	{
		parentNode = null;	//parentNode is rootNode
		pId = "root"; //zTree root id is root -__-!
	}
	else
	{
		parentNode = getNodeById(pId);
		if(parentNode == null || parentNode.open == false)
		{
			console.log("addTreeNode() parentNode is null or not exists");
			return;
		}
	}

	//Add zTree Node
	//parentNode处于展开状态时，需要手动addTreeNode以保证与后台同步，否则只要触发异步加载即可
	if(parentNode == null || parentNode.open == true)
	{
		console.log("addTreeNode() parentNode is open");
		//add the treeNode
		var treeObj = $.fn.zTree.getZTreeObj("doctree");
		var treeNode = getNodeByNodeId(node.docId);
		if(treeNode == null)
		{				
      		var newNode = {
      				//For zTree
      				id : node.docId,	//it is for zTree
      				pId: pId,
      				level: node.level,  //it is for zTree
      				isParent: isParent,
      				//For Doc
      				docId: node.docId,
      				pid: node.pid,
      				path: node.path,
      				name: node.name,
      				type: node.type,
      				Leve: node.level,
      				size: node.size,
      				createTime: node.createTime,
      				latestEditTime: node.latestEditTime,
      				};

      		if(isParent == false)
	        {
	       	   var iconType = getDiyFileIconType(node.name);
	           if(iconType && iconType != "")
	           {
	        	   newNode.iconSkin = iconType;
	           }
	        }

      		newNodes = treeObj.addNodes(parentNode, newNode);
		}
	}
	else
	{
		console.log("addTreeNode() parentNode is closed, do not addTreeNode");

		//open the parentNode
		//var treeObj = $.fn.zTree.getZTreeObj("doctree");
		//treeObj.expandNode(parentNode, true, false, true);
	}
}

//zTree初始化接口:根据data和setting生成zTree
function zTreeInit(data) {
    console.log("zTreeInit");
    //console.log(setting);

    var doctree = zTree.init($("#doctree"), setting, data);
    //doctree.expandAll(true); //考虑只自动展开根目录下目录
}

//PageInit
var login_user = "";	//用来保存刚注册的用户、或刚才登录的用户
function SysInit()
{
	console.log("SysInit");

	//Set the event handler for keydown
	document.onkeydown=function(event)
	{
		//浏览器兼容性处理
		var e = event || window.event || arguments.callee.caller.arguments[0];
		EnterKeyListenerForSearchDoc(e);
	}

	if(gShareId)
	{

		getReposInfo(gInitReposInfo.id,InitMenuAndDoc);
	}
	else
	{
    	//确定当前登录用户是否已登录
    	$.ajax({
            url : "/DocSystem/User/getLoginUser.do",
            type : "post",
            dataType : "json",
            data : {},
            success : function (ret) {
                if( "ok" == ret.status )
                {
                	var user = ret.data;
                	login_user = user;
                	//显示用户信息
                	ShowUserInfo(user);
                	loginBtnCtrl(user);

                	//获取仓库信息（获取成功的话会调用getAndShowDoc和getInitMenu）
            		getReposInfo(gInitReposInfo.id,InitMenuAndDoc);
                }
                else
                {
                	console.log(ret.msgInfo);
                	//showErrorMessage("获取用户信息失败:" + ret.msgInfo);
                	//Jump to index.html
                    //window.location.href = "index" + langExt + ".html";

                	//Show Login Dialog
                    //showLoginPanel();
                }
            },
            error : function () {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("获取用户信息失败", " : ", "服务器异常"),
            	});
            }
        });
	}
}

//初始化目录树显示和Doc显示
//该接口只能被调用一次，否则会导致逻辑错误
function InitMenuAndDoc()
{
	console.log("InitMenuAndDoc() gInitDocInfo:", gInitDocInfo);

	if(gInitDocInfo.docId == 0)
	{
		gInitDocInfo.vid = gRootDoc.vid;
		gInitDocInfo.docId = gRootDoc.docId;
		gInitDocInfo.path = gRootDoc.path;
		gInitDocInfo.name = gRootDoc.name;
		gInitDocInfo.shareId = gRootDoc.shareId;
	}

	getInitMenu(gInitDocInfo.docId, gInitDocInfo.path, gInitDocInfo.name, showInitDocAndSubDocList);
	
	initVDocEditor(gInitDocInfo);
}

var vdocEditor;
function initVDocEditor(docInfo)
{
	var config = {
		"docInfo" : docInfo,
		"editor": "stackedit",	//stackedit/ace/editormd
	};
	vdocEditor = new MxsdocAPI.VDocEditor("vdocPreview", config);
}

function showInitDocAndSubDocList()
{
	console.log("showInitDocAndSubDocList() gInitDocInfo:",gInitDocInfo);
	showDocList(gInitDocInfo);
	getAndShowDoc(gInitDocInfo, 1, gInitDocInfo.edit);
}

function userLogout()
{
	logout();
	loginBtnCtrl();
}

function loginBtnCtrl(user)
{
	if(user)
	{
    	$('#loginBtn').hide();
    	$('#logoutBtn').show();
       	$('#modeSwitchBtn').show();
	}
	else
	{
    	$('#loginBtn').show();
    	$('#logoutBtn').hide();
       	$('#modeSwitchBtn').hide();
	}
}

//将后台Menu,同步回前台
function syncUpMenu()
{
	console.log("syncUpMenu");
    getInitMenu(gDocInfo.docId, gDocInfo.path, gDocInfo.name);
}

function reDrawMenu(data)
{
   drawMenu(data);
}

//绘制zTree with the data:强制绘制，判断的东西不应该放在这里
function drawMenu(data) {
	console.log("drawMenu");
	window.menu = data;
    //data = JSON.parse('"' + data + '"'); //We need to use JSON parse one more time here
    //var menu = JSON.parse(data);
    var menu = data;
    //遍历jason_arry
  	for(var i=0; i<menu.length; i++)
  	{
       var jsonObj = menu[i];
       jsonObj.id = jsonObj.docId;
       jsonObj.pId = jsonObj.pid != 0? jsonObj.pid : "root",
       jsonObj.isParent = jsonObj.type == 1? false: true;
       jsonObj.Level = jsonObj.level;
       //设置用户自定义文件图标（必须在standardStyle中有定义）
       if(jsonObj.type == 1)
       {
    	   var iconType = getDiyFileIconType(jsonObj.name);
    	   if(iconType && iconType != "")
    	   {
    		   jsonObj.iconSkin = iconType;
    	   }
       }
   }
   //console.log(menu);
   zTreeInit(menu);
}

//DocList类
var DocListState = 0;
var DocListParentDocId = -1; //无效值
var DocList = (function () {
	var list;
	var index = 0;

	function getList()
	{
		return list;
	}

	//Draw DocList
	function showList(data){
 	 	list = data;
		var str="";
       	for(var i=0; i<data.length; i++)
 	    {
       		var iconType = docListGetIconItemStr(data[i].name , data[i].type, gShowType);
       		var node = data[i];
   			str+= '<li dataId='+ node.docId
   				+ ' dataPid='+ node.pid
   				+' dataPath="'+ node.path + '"'
   				+' dataName="' + node.name + '"'
   				+' dataType=' + node.type
   				+' dataSize=' + node.size
   				+' createTime=' + node.createTime
   				+' latestEditTime=' + node.latestEditTime;

   			//if(node.state && (node.state | 0b00000010) != 0) //只显示文件编辑锁定
   			if(node.state && (node.state | 2)) //只显示文件编辑锁定
   			{
   				if(node.type == 2)
   				{
   					if(DocListState == 0)
   					{
   	        			str += ' class="second-listBox" onmousedown="docListOnMouseDown(this,event)"><div onclick="DocListOnClick(this)" ondblclick="DocListOnDbClick(this)" class="filename pull-left  nowrap ellipsis" style="width: 60%; color:red">'+iconType + node.name+'</div><div class="filedate pull-right">'+formatTimeEx(node.latestEditTime)+'</div><div class="handle pull-right"><i class="icons note" onclick="xs(this,event)"></i><i onclick="showContextMenu(this,event)" class="icons more"></i></div></li>';
   					}
   					else
   					{
   	        			str += ' class="second-listBox" onmousedown="docListOnMouseDown(this,event)"><div onclick="DocListOnClick(this)" ondblclick="DocListOnDbClick(this)" class="filename pull-left  nowrap ellipsis" style="width: 60%; color:red">'+iconType + node.name+'</div><div class="filedate pull-right">'+formatTimeEx(node.latestEditTime)+'</div><div class="handle pull-right"><i class="icons folder-open2" onclick="dk(this,event)"></i><i onclick="showContextMenu(this,event)" class="icons more"></i></div></li>';
   					}
   				}
   				else
   				{
        			str += ' class="second-listBox" onmousedown="docListOnMouseDown(this,event)"><div onclick="DocListOnClick(this)" ondblclick="DocListOnDbClick(this)" class="filename pull-left  nowrap ellipsis" style="width: 60%; color:red">'+iconType + node.name+'</div><div class="filedate pull-right">'+formatTimeEx(node.latestEditTime)+'</div><div class="handle pull-right"><i onclick="showContextMenu(this,event)" class="icons more"></i></div></li>';
   				}
        	}
           	else
           	{
           		if(node.type == 2)
           		{
   					if(DocListState == 0)
   					{
	   	           	    str += ' class="second-listBox" onmousedown="docListOnMouseDown(this,event)"><div onclick="DocListOnClick(this)" ondblclick="DocListOnDbClick(this)"  class="filename pull-left  nowrap ellipsis" style="width: 60%;">'+iconType + node.name + '</div><div class="filedate pull-right">'+formatTimeEx(node.latestEditTime)+'</div><div class="handle pull-right"><i class="icons note" onclick="xs(this,event)"></i><i onclick="showContextMenu(this,event)" class="icons more"></i></div></li>';
   					}
   					else
   					{
	   	           	    str += ' class="second-listBox" onmousedown="docListOnMouseDown(this,event)"><div onclick="DocListOnClick(this)" ondblclick="DocListOnDbClick(this)"  class="filename pull-left  nowrap ellipsis" style="width: 60%;">'+iconType + node.name + '</div><div class="filedate pull-right">'+formatTimeEx(node.latestEditTime)+'</div><div class="handle pull-right"><i class="icons folder-open2" onclick="dk(this,event)"></i><i onclick="showContextMenu(this,event)" class="icons more"></i></div></li>';
   					}
           		}
           		else
           		{
   	           	    str += ' class="second-listBox" onmousedown="docListOnMouseDown(this,event)"><div onclick="DocListOnClick(this)" ondblclick="DocListOnDbClick(this)"  class="filename pull-left  nowrap ellipsis" style="width: 60%;">'+iconType + node.name + '</div><div class="filedate pull-right">'+formatTimeEx(node.latestEditTime)+'</div><div class="handle pull-right"><i onclick="showContextMenu(this,event)" class="icons more"></i></div></li>';
           		}
           	}
 	    }
       	$("#secondList").html(str);
 	}

	function docListGetIconItemStr(name, type, showType)
	{
		//console.log("docListGetIconItemStr name:" + name + " showType:" + showType);
		var iconItemStr = "";
		if(type == 2)
		{
			iconItemStr =  '<i class="icons folder"></i>';
			return iconItemStr;
		}

		if(showType == 2)
		{
			iconItemStr = '<i class="icons file"></i>';
			return iconItemStr;
		}

		var iconType = getDiyFileIconType(name);
		//console.log("docListGetIconItemStr iconType:" + iconType);
       	if(iconType && iconType != "")
       	{
        	iconItemStr = '<i class="icons file ' + iconType + '"></i>';
     	}
       	else
       	{
    		iconItemStr = '<i class="icons file"></i>';
    	}
       	//console.log("docListGetIconItemStr iconItemStr:" + iconItemStr);
       	return iconItemStr;
	}

	//Check if node exists
	function isNodeExists(docId)
	{
		if($("[dataId='"+ docId +"']").length > 0)
		{
			return true;
		}
		return false;
	}

	//Add Node
	function addNode(node)
	{
        var iconType = docListGetIconItemStr(node.name, node.type, gShowType);
     	var nodeStr='<li dataId='+ node.docId
     				+ ' dataPid='+ node.pid
     				+' dataPath="' + node.path +'"'
     				+ 'dataName="' + node.name + '"'
     				+' dataType=' + node.type
     				+' dataSize=' + node.size
     				+' createTime='+ node.createTime
     				+' latestEditTime=' + node.latestEditTime;
     	if(node.type == 2)
     	{
     		nodeStr += ' class="second-listBox" onmousedown="docListOnMouseDown(this,event)"><div onclick="DocListOnClick(this)" ondblclick="DocListOnDbClick(this)" class="filename pull-left nowrap ellipsis" style="width: 60%;">'+iconType + node.name+'</div><div class="filedate pull-right">'+formatTimeEx(node.latestEditTime)+'</div><div class="handle pull-right"><i class="icons note" onclick="xs(this,event)"></i><i onclick="showContextMenu(this,event)" class="icons more"></i></div></li>';
     	}
     	else
     	{
     		nodeStr += ' class="second-listBox" onmousedown="docListOnMouseDown(this,event)"><div onclick="DocListOnClick(this)" ondblclick="DocListOnDbClick(this)" class="filename pull-left nowrap ellipsis" style="width: 60%;">'+iconType + node.name+'</div><div class="filedate pull-right">'+formatTimeEx(node.latestEditTime)+'</div><div class="handle pull-right"><i onclick="showContextMenu(this,event)" class="icons more"></i></div></li>';
     	}
     	$("#secondList").append(nodeStr);
	}

	//Delete Node
	function deleteNode(docId)
	{
		var obj = $("[dataId='"+ docId +"']");
		if(obj)
		{
			obj.remove();
		}
	}

	//Rename Node
	function renameNode(docId, node)
	{
		deleteNode(docId);
		addNode(node);
	}

	//Delete Node
	function focusNode(docId)
	{
		var obj = $("[dataId='"+ docId +"']");
		if(obj)
		{
			obj.focus();
		}
	}

	//开放给外部的调用接口
    return {
    	showList: function(data){
    		showList(data);
        },
    	getList: function(){
    		return getList();
        },
		isNodeExists: function (docId)
		{
			return isNodeExists(docId);
		},
		addNode: function(node){
    		addNode(node);
        },
        deleteNode: function(docId){
        	deleteNode(docId);
        },
        renameNode: function(docId, newNode){
        	renameNode(docId, newNode);
        },
        focusNode: function(docId){
        	focusNode(docId);
        },
    };
})();

function addDocListNode(node)
{
	console.log("addDocListNode() node:",node);
	if(!node || node == null)
	{
		console.log("addDocListNode() node is null");
		return;
	}
	
	console.log("addDocListNode() pid:" + node.pid + " DocListParentDocId:" + DocListParentDocId );
	if(node.pid == DocListParentDocId)
	{
		if(DocList.isNodeExists(node.docId) == false)
		{
			DocList.addNode(node);
		}
	}
}

var curRightClickedDocListNode = null;
function docListOnMouseDown(obj,ev)
{
 	var docId = $(obj).attr('dataId');
 	var pid = $(obj).attr('dataPid');
 	var path = $(obj).attr('dataPath');
 	var name = $(obj).attr('dataName');
 	var type = $(obj).attr('dataType');
 	var size = $(obj).attr('dataSize');
 	var createTime = $(obj).attr('createTime');
 	var latestEditTime = $(obj).attr('latestEditTime');

 	var node = {};
 	node.vid = gReposInfo.id;
 	node.id = docId;
 	node.docId = docId;
 	node.pid = pid;
	node.path = path;
	node.name = name;
	node.type = type;
	node.size = size;
	node.createTime = parseInt(createTime);
	node.latestEditTime = parseInt(latestEditTime);
	node.isBussiness = gReposInfo.isBussiness;
	node.officeType = gReposInfo.officeType;

	curRightClickedDocListNode = node;
 	console.log("docListOnMouseDown on doc:",curRightClickedDocListNode);
}

function DocListOnClick(obj)
{
	var docListNode = $(obj).parents('li');
	var docId = docListNode.attr('dataId');
 	var pid = docListNode.attr('dataPid');
 	var path = docListNode.attr('dataPath');
 	var name = docListNode.attr('dataName');
 	var type = docListNode.attr('dataType');
 	var latestEditTime = docListNode.attr('latestEditTime');

 	var node = {};
 	node.vid = gReposInfo.id;
 	node.id = docId;
 	node.pid = pid;
	node.path = path;
	node.name = name;
	node.type = type;
	node.latestEditTime = latestEditTime;

	console.log("DocListOnClick node:", node);

	//DocListState = 1 表示当前列表显示的是搜索结果，此时点击文件不更新文件列表
	if(DocListState == 0 && type == 2)
	{
		//更新DocList
		showDocList(node);
	}

	//显示预览或备注
	getAndShowDoc(node, 1, false);

	//TODO: 对于手机端，中间栏点击显示详情（在点击图标的时候才显示列表）
	//如果是文件或者搜索结构那么在手机上显示详情
	//if(type == 1 || DocListState == 1)
	//{
	 	showRightDiv();
	//}
			
	 //在zTree上选中该doc
	 zTreeSelectDoc(docId, path, name);
}

function DocListOnDbClick(obj)
{
	var docListNode = $(obj).parents('li');

	var docId = docListNode.attr('dataId');
 	var pid = docListNode.attr('dataPid');
 	var path = docListNode.attr('dataPath');
 	var name = docListNode.attr('dataName');
 	var type = docListNode.attr('dataType');
 	var latestEditTime = docListNode.attr('latestEditTime');

 	var node = {};
 	node.vid = gReposInfo.id;
 	node.id = docId;
 	node.pid = pid;
	node.path = path;
	node.name = name;
	node.type = type;
	node.latestEditTime = latestEditTime;

	console.log("DocListOnDbClick node:", node);

	if(DocListState == 0 && type == 2)
	{
 		//更新DocList
		showDocList(node);
		showCenterDiv();
	}

	//显示预览或备注
	getAndShowDoc(node, 2, false);

	//如果是文件或者搜索结构那么在手机上显示详情
	if(type == 1 || DocListState == 1)
	{
	 	showRightDiv();
	}

	 //在zTree上选中该doc
	 zTreeSelectDoc(docId, path, name);
}

//根据gDocInfo.docId选中文件
function zTreeSelectDoc(docId, path, name)
{
	console.log("zTreeSelectDoc docId:" + docId);
	if(!docId || docId == 0)	//表示不选中任何文件
	{
	  	var treeObj = $.fn.zTree.getZTreeObj("doctree");
		var selectedNode = treeObj.getSelectedNodes()[0];
		if(selectedNode && selectedNode != null)
		{
			zTree.cancelSelectedNode(selectedNode);
		}
		return;
	}

	//检查当前选中的文件是否为期望选中的文件
	var treeObj = $.fn.zTree.getZTreeObj("doctree");
	var selectedNode = treeObj.getSelectedNodes()[0];
	if(selectedNode)
	{
		if(selectedNode.id == docId)
		{
			return;
		}
	}

	//期望的文件未选中但已加载
	var treeNode = getNodeByNodeId(docId);
	if(treeNode && treeNode != null)
	{
		var zTree = $.fn.zTree.getZTreeObj("doctree");
		//select this node in zTree
	 	zTree.selectNode(treeNode);

		if(treeNode.type == 1)	//For File, show RightDiv
	 	{
	 		showRightDiv();
	 	}
	 	else
	 	{
	 		//Open the dir in zTree
			zTree.reAsyncChildNodes(treeNode, "refresh",true);
	 	}
		return;
	}

	//期望的文件未加载
	console.log("node was not exists in current zTree, getInitMenu for:" + docId  + " " + path + name);
	getInitMenu(docId, path, name);
}

//显示
function xs(obj,event){
	var docListNode = $(obj).parents('li');

	var docId = docListNode.attr('dataId');
 	var pid = docListNode.attr('dataPid');
 	var path = docListNode.attr('dataPath');
 	var name = docListNode.attr('dataName');
 	var type = docListNode.attr('dataType');
 	var latestEditTime = docListNode.attr('latestEditTime');

 	var node = {};
 	node.vid = gReposInfo.id;
 	node.id = docId;
 	node.pid = pid;
	node.path = path;
	node.name = name;
	node.type = type;
	node.latestEditTime = latestEditTime;

	console.log("xs() node:", node);

	//显示预览或备注
	getAndShowDoc(node, 1, false);

	showRightDiv();
}

//打开目录
function dk(obj,event){
	var docListNode = $(obj).parents('li');

	var docId = docListNode.attr('dataId');
 	var pid = docListNode.attr('dataPid');
 	var path = docListNode.attr('dataPath');
 	var name = docListNode.attr('dataName');
 	var type = docListNode.attr('dataType');
 	var latestEditTime = docListNode.attr('latestEditTime');

 	var node = {};
 	node.vid = gReposInfo.id;
 	node.id = docId;
 	node.pid = pid;
	node.path = path;
	node.name = name;
	node.type = type;
	node.latestEditTime = latestEditTime;

	console.log("dk() node:", node);

	DocListState = 0;
	showDocList(node);
}

function fx(obj,event){
	var docListNode = $(obj).parents('li');
	var path = docListNode.attr('dataPath');
 	var name = docListNode.attr('dataName');

 	var node = {
		path : path,
		name : name,
 	};
 	shareDoc(node);
}

function xz(obj,event){
	var docListNode = $(obj).parents('li');

	var docId = docListNode.attr('dataId');
 	var pid = docListNode.attr('dataPid');
 	var path = docListNode.attr('dataPath');
 	var name = docListNode.attr('dataName');
 	var type = docListNode.attr('dataType');
 	var latestEditTime = docListNode.attr('latestEditTime');

 	var node = {};
 	node.vid = gReposInfo.id;
 	node.id = docId;
 	node.pid = pid;
	node.path = path;
	node.name = name;
	node.type = type;
	node.latestEditTime = latestEditTime;

	var treeNodes = [];
	treeNodes.push(node);
	downloadDoc(treeNodes,true,1);
	event.stopPropagation();
}

function sc(obj,event){
	var docListNode = $(obj).parents('li');

	var docId = docListNode.attr('dataId');
 	var pid = docListNode.attr('dataPid');
 	var path = docListNode.attr('dataPath');
 	var name = docListNode.attr('dataName');
 	var type = docListNode.attr('dataType');
 	var latestEditTime = docListNode.attr('latestEditTime');

 	var node = {};
 	node.vid = gReposInfo.id;
 	node.id = docId;
 	node.pid = pid;
	node.path = path;
	node.name = name;
	node.type = type;
	node.latestEditTime = latestEditTime;

	var deleteNodes = [];
	deleteNodes.push(node);
	DoDelete(deleteNodes);
	event.stopPropagation();
}

function showContextMenu(obj,event){
	event.stopPropagation();
	var xOffset = 0;
	if(gIsPC == false)
	{
		xOffset = -150;
	}
	context.show('#secondList',event,xOffset);
}

function formatDate(date) {
	var now = new Date(date);
	var year=now.getFullYear();
	var month=now.getMonth()+1;
	var date=now.getDate();
	return year+"-"+month+"-"+date;
}

function formatTime(time){
	var now = new Date(time);
	var year=now.getFullYear();
	var month=now.getMonth()+1;
	var date=now.getDate();
	var hh=now.getHours();
	var mm=now.getMinutes();
	var ss=now.getSeconds();

	return year+"-"+month+"-"+date + " " + hh+":"+mm+":"+ss;
}

function formatTimeEx(time){
	var now = new Date(time);
	var year=now.getFullYear();
	var month=now.getMonth()+1;
	var date=now.getDate();
	var hh=now.getHours();
	var mm=now.getMinutes();
	return year+"-"+month+"-"+date + " " + hh+":"+mm;
}

var gSearchFolder = "";
function setSearchFolder(searchFolder)
{
	gSearchFolder = searchFolder;
	searchDoc();
}

var gSortType = "";
function sortDocList(sortType)
{
	gSortType = sortType;
	showDocList(gDocInfo);
}

function showDocList(node)
{
	console.log("showDocList() node:", node);

	var docId = gRootDoc.docId;
	var path = gRootDoc.path;
	var name = gRootDoc.name;

	if(node &&  node != null)
	{
		docId = node.docId;
	    path = node.path;
	    name = node.name;
		//如果是文件且不是根文件则获取上层目录的文件
	    if(node.type == 1 && docId != gRootDoc.docId)
		{
	    	console.log("showDocList() node is File and is not rootDoc");
			docId = node.pid;
			path = node.path;
			name = "";
		}
    }

	console.log("showDocList() DocListParentDocId:" + DocListParentDocId + " docId:" + docId );
	//if(DocListParentDocId == docId)
	//{
	//	return;
	//}

	$.ajax({
        url : "/DocSystem/Repos/getSubDocList.do",
        type : "post",
        dataType : "json",
        data : {
            vid: gReposInfo.id,
            docId: docId,
            path: path,
            name: name,
            shareId: gShareId,
            sort: gSortType,
            needLockState: 1,
        },
        success : function (ret) {
     		console.log("showDocList ret:", ret)
     		if(ret.status == "ok")
        	{
     			DocListParentDocId = docId;
     			console.log("showDocList() DocListParentDocId:" + DocListParentDocId + " docId:" + docId );
     			DocList.showList(ret.data);
            }
            else
            {
            	console.log(ret.msgInfo);
            	if(ret.msgData && ret.msgData == "1")	//需要验证访问密码
            	{
            		//showDocPwdVerifyPanel(node);
            	}
            	else
            	{
            		showErrorMessage({
                		id: "idAlertDialog",	
                		title: _Lang("提示"),
                		okbtn: _Lang("确定"),
                		msg: _Lang("获取文件列表失败", " : ", ret.msgInfo),
                	});
            	}
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("获取文件列表失败", " : ", "服务器异常"),
        	});
        }
    });
}

function gotoPreviousDoc()
{
	var zTree = $.fn.zTree.getZTreeObj("doctree");
	var node = zTree.getNodeByParam("id",gDocInfo.docId);
	node = node.getPreNode();
	if(node == null)
	{
		console.log("gotoPreviousDoc rearch top");
		return;
	}

	zTree.selectNode(node);
	showDocList(node);
	getAndShowDoc(node, 1, false);
}

function gotoNextDoc()
{
	var zTree = $.fn.zTree.getZTreeObj("doctree");
	var node = zTree.getNodeByParam("id",gDocInfo.docId);
	node = node.getNextNode();
	if(node == null)
	{
		console.log("gotoPreviousDoc rearch bottom");
		return;
	}

	zTree.selectNode(node);
	showDocList(node);
	getAndShowDoc(node, 1, false);
}

function backToParentDoc()
{
	console.log("backToParentDoc() gDocInfo.docId:" + gDocInfo.docId);
	DocListState = 0;
	if(gDocInfo.docId == 0 || gDocInfo.docId == gRootDoc.docId)	//reach the top level
	{
		console.log("backToParentDoc() gShareId", gShareId, gIsPC);
		if(gShareId || gIsPC == true)
		{
			showDocList(gRootDoc);
		}
		else
		{
			console.log("backToParentDoc() back to projects");
			//back to projects
			var href = "/DocSystem/web/projects" + langExt + ".html";
			window.location.href = href;
		}
		return;
	}

	var zTree = $.fn.zTree.getZTreeObj("doctree");
	var node = zTree.getNodeByParam("id",gDocInfo.docId);

	//current Doc not exists, update gDocInfo.docId and URL and showDocList under root dir
	if(node == null)
	{
		console.log("backToParentDoc node not exist:" + gDocInfo.docId);
		cleanDocPreview();

		//Show DocList
		showDocList(gRootDoc);
		return;
	}
	else
	{
		var parentNode = node.getParentNode();
		console.log("backToParentDoc parentNode:" + parentNode);
		if(parentNode && parentNode.id)
		{
			zTree.selectNode(parentNode);
			showDocList(parentNode);
			getAndShowDoc(parentNode, 1, false);
		}
		else
		{
			zTree.cancelSelectedNode(node);
			showDocList(gRootDoc);
			getAndShowDoc(gRootDoc, 1, false);
		}
	}


	return;
}

function backToParentDocEx()
{
	if(gIsPC == true)
	{
		backToParentDoc();
	}
	else
	{
		showCenterDiv();
	}
}


//回车键监听函数，该event已经过兼容性处理
function EnterKeyListenerForSearchDoc(event){
	console.log("enter key listener for SearchDoc");
	if (event.keyCode == 13)
	{
		var isFocus=$("#searchWord").is(":focus");
		if(isFocus)
		{
			searchDoc();
		}
		return;
 	}

	/*
	if(event.ctrlKey)
	{
    	if(event.keyCode == 67)
    	{
    		handlePasteImgEvent(event);
        }
	}*/
}

function searchDoc()
{
	var searchWord = $("#searchWord").val();
	if(searchWord == "")
	{
		return;
	}

	var sort = "";

	var parentPath = "";
	if(gSearchFolder == "currentFolder")
	{
		if(gDocInfo.type == 2)
		{
			parentPath = gDocInfo.path + gDocInfo.name;
		}
		else
		{
			parentPath = gDocInfo.path;
		}
	}

   	$.ajax({
           url : "/DocSystem/Doc/searchDoc.do",
           type : "post",
           dataType : "json",
           data : {
               searchWord:searchWord,
               sort:sort,
               reposId: gReposInfo.id,
               //pid: pDocId,
     		   path: parentPath,
               shareId: gShareId,
           },
           success : function (ret) {
        		console.log("searchDoc ret:", ret)
        		if(ret.status == "ok")
           		{
        			//Set it as search result
        			DocListState = 1;
        			DocListParentDocId = -1;
        			DocList.showList(ret.data);
           			console.log("文件搜索成功");
               	}
               	else
               	{
               		showErrorMessage({
                		id: "idAlertDialog",	
                		title: _Lang("提示"),
                		okbtn: _Lang("确定"),
                		msg: _Lang("文件搜索失败", " : ", ret.msgInfo),
                	});
               	}
           },
           error : function () {
        	   showErrorMessage({
           		id: "idAlertDialog",	
           		title: _Lang("提示"),
           		okbtn: _Lang("确定"),
        		msg: _Lang("文件搜索失败", " : ", "服务器异常"),
           	});
           }
       });
}

function WikiEditBtnCtrl(edit)
{
	 if(edit == true)
   	 {
	    $("#btnExitEdit").show();
      	$("#btnSaveWiki").show();
     }
     else
     {
	    $("#btnExitEdit").hide();
      	$("#btnSaveWiki").hide();
     }
}


function switchShowMode(showType)
{
	 console.log("switchShowMode showType:" + showType);

	 if(!showType)	//showType为定义则进行切换
	 {
		 console.log("switchShowMode gShowType:" + gShowType);
		 if(gShowType == 2)	//Swith To 显示预览
	   	 {
			gShowType = 1;
		 }
	     else
	     {
			 gShowType = 2;
		 }
	 }
	 else
	 {
		 gShowType = showType;
	 }

	 console.log("switchShowMode after switch gShowType:" + gShowType);

	 if(gShowType == 1)	//预览
   	 {
	    $("#modeSwitchBtnText").css("title", _Lang("标准模式"));
	    $("#docPreview").show();
     }
     else
     {
		$("#modeSwitchBtnText").css("title", _Lang("电子书模式"));
		$("#docPreview").hide();
     }

	 updateUrl();

	 changePageStyle(gShowType);
}

 function changePageStyle(showType)
 {
	  var obj = document.getElementById("zTreeCss");
	  if(showType == 1)
	  {
		  obj.setAttribute("href","static/zTree/css/metroStyle/standardStyle.css");
	  }
	  else
	  {
		  obj.setAttribute("href","static/zTree/css/metroStyle/metroStyle.css");
	  }
}
/************************** contextMenu 接口***************************/
//Get Node by NodeId
function getNodeByNodeId(nodeId)
{
	var zTree = $.fn.zTree.getZTreeObj("doctree");
	var node = zTree.getNodeByParam("id",nodeId);
	return node;
}

//Get NodeId by Node
function getNodeIdByNode(node)
{
	if(node && node.id)
	{
		return node.id;
	}
	return 0;
}

//Get ParentNode of Node(zTree)
function getParentNodeByNode(node)
{
	console.log("getParentNodeByNode",node);
 	//Get ParentNode
	var parentNode = node;
	if(node && node.isParent === false)
	{
		parentNode = node.getParentNode();
	}
	return parentNode;
}

function getParentNodeEx(node)
{
	if(node.docId == 0 || node.docId == gRootDoc.docId)
	{
		return node
	}
	
	var parentNode = getParentNodeByNodeId(gDocInfo.docId);
	return parentNode;
}

//Get ParentNode of NodeId(zTree)
function getParentNodeByNodeId(nodeId)
{
	console.log("getParentNodeByNodeId:" + nodeId);
	var node = getNodeByNodeId(nodeId);
 	return getParentNodeByNode(node);
}

//Get ParentNodeId of Node(zTree)
function getParentNodeIdByNode(node)
{
	var parentNode = getParentNodeByNode(node);
 	return getNodeIdByNode(parentNode);
}

//Get ParentNodeId of NodeId(zTree)
function getParentNodeIdByNodeId(nodeId)
{
	console.log("getParentNodeByNodeId" + nodeId);
	var node = getNodeByNodeId(nodeId);
 	var parentNode = getParentNodeByNode(node);
 	return getNodeIdByNode(parentNode);
}

//add a new Doc
function newDocEx(type)
{
	var parentNode = getParentNodeByNodeId(gDocInfo.docId);
	newDoc(type,parentNode);
}

//add a new Doc: type 1: 文件  2:目录
function newDoc(type,parentNode) {
	console.log("type:" + type, parentNode);
    showAddDocPanel(type, parentNode);
}

//不再使用非标的bootstrapQ
function showAddDocPanel(type, parentNode)
{
	console.log("showAddDocPanel()");

	//对话框 title
    var title = _Lang("新建文件");
    if(type == 2)
    {
    	title = _Lang("新建目录");
    }

	bootstrapQ.dialog({
			id: 'addDoc',
			url: 'addDoc' + langExt + '.html',
			title: title,
			msg: _Lang('页面正在加载，请稍侯') + '...',
			foot: false,
			big: false,
			//okbtn: "确定",
			callback: function(){
				addDocPageInit(type, parentNode);
			},
	});
}

//ShowCenter: hide left and right
function showCenterDiv(){
	if(gIsPC == false)
	{
        $(".second-table").show();
        $(".manual-right").hide();
	}
}

//ShowRight
function showRightDiv(){
	if(gIsPC == false)
	{
        $(".second-table").hide();
        $(".manual-right").show();
	}
}

//LockDoc and Download it
function checkOut(node)
{
	console.log("checkOut()", node);
	if(!node || node == null)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("请选择需要检出文件") + "!",
    	});
		return;
	}

	var docId = node.docId;
	var pid = node.pid;
	var path = node.path;
	var name = node.name;
	var type = node.type;

	$.ajax({
		url : "/DocSystem/Doc/lockDoc.do",
		type : "post",
		dataType : "json",
		data : {
			lockType : 1, //lockType: CheckOut
			reposId : gReposInfo.id,
			docId : docId,
			pid: pid,
			path: path,
			name: name,
			type: type,
            shareId: gShareId,
		},
		success : function (ret) {
			if( "ok" == ret.status){
				console.log(ret.data);
				$("[dataId='"+ docId +"']").children("div:first-child").css("color","red");
			    var treeNodes = [];
			    treeNodes.push(node);
				downloadDoc(treeNodes,false,1);
			    return;
			}
			else
			{
				showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("检出失败", " : ", ret.msgInfo),
		    	});
				return;
			}
		},
		error : function ()
		{
			showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("检出失败", " : ", "服务器异常"),
	    	});
			return;
		}
	});
}

//UnlockDoc and Upload doc
var curCheckInDoc = [];
function checkIn(node)
{
	console.log("checkIn()", node);
	curCheckInDoc.id = node.docId;
	curCheckInDoc.pid = node.pid;
	curCheckInDoc.path = node.path;
	curCheckInDoc.name = node.name;
	curCheckInDoc.type = node.type;

	gParentNodeForUpload = getParentNodeByNodeId(node.docId);
	checkInFile();
	return;
}

//目录列表区域拖放功能：预览区和子目录区域需要一起变化
var oDiv=document.getElementById('line');
oDiv.onmousedown=function(ev){
  var disX=ev.clientX-oDiv.offsetLeft;
  var disY=ev.clientY-oDiv.offsetTop;

  document.onmousemove=function(ev){
      var l=ev.clientX-disX;	//计算Line的位置
      oDiv.style.left=l+'px';	//设置Line的位置

      //左边框的偏移位置总是0，因此只需要设置with
 	  $(".manual-left")[0].style.width=ev.clientX+'px';
      //second-table只要调整左边位置就可以了，宽度不变
   	  $(".second-table").css("left",$(".manual-left").width() + $("#line").width());
   	  $(".second-line").css("left", $(".manual-left").width() + $("#line").width() + $(".second-table").width()); //第二个拖拽线的位置
      $(".manual-right").css("left", $(".manual-left").width() + $("#line").width() + $(".second-table").width() + $(".second-line").width()); //第二个拖拽线的位置
      //$(".manual-right")[0].style.left = $(".manual-left").width() + $("#line").width()) + $(".second-table").width() + $(".second-table").width() + 'px';
  };

  document.onmouseup=function(ev){
  	//$(".manual-left")[0].style.width=ev.clientX+'px';
 	//$(".manual-right")[0].style.left=ev.clientX+'px';
 	document.onmousemove=null;
  	document.onmouseup=null;
  };
};

var oDiv2=document.getElementById('second-line');
oDiv2.onmousedown=function(ev){
	var disX=ev.clientX-oDiv2.offsetLeft;
	var disY=ev.clientY-oDiv2.offsetTop;
	
	document.onmousemove=function(ev){
   		var l=ev.clientX-disX;	//计算Line的位置
       	oDiv2.style.left=l+'px';	//设置Line的位置
       	
       	var lineLeft = $("#line").position().left;
       	var secondLineLeft = $("#second-line").position().left;
       	console.log("lineLeft:" + lineLeft + " secondLineLeft:" + secondLineLeft);
       	if(lineLeft > secondLineLeft)
       	{
       		oDiv.style.left=l+'px';
       		$(".manual-left")[0].style.width=ev.clientX+'px';
       		//second-table只要调整左边位置就可以了，宽度不变
         	$(".second-table").css("left",$(".manual-left").width() + $("#line").width());             	
       	}
       	
       	$('.second-table').width($(".second-line").position().left-$('.manual-left').width());
        $(".manual-right").css("left", $('.manual-left').width() + $(".second-table").width() + $(".second-line").width());
       	return false;
  	};
  
  	document.onmouseup=function(ev){
	 	document.onmousemove=null;
	  	document.onmouseup=null;
    };
};

//页面加载完成处理函数
$(document).ready(function()
{
	//初始化全局变量
	globalVarInit();

	//zTree配置初始化
	zTreeSettingInit(gInitReposInfo.id);

	treeBodyZoneInit();
	//拖拽上传区域初始化
	dragDropUploadZoneInit();

	//右键菜单初始化
	contextMenuInit();

	//FileUpload Init
	DocUploadInit();
	
	if(gShareId)
	{
		getDocShare(SysInit);
	}
	else
	{
		//系统初始化
		SysInit();
	}
});

function getDocShare(callback)
{
	//获取DocShare
	$.ajax({
        url : "/DocSystem/Doc/getDocShare.do",
        type : "post",
        dataType : "json",
        data : {
        	shareId: gShareId,
        },
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	var docShare = ret.data;
            	gRootDoc.vid = docShare.vid;
            	gRootDoc.showName = docShare.name;
            	gRootDoc.name = docShare.name;
            	gRootDoc.path = docShare.path;
            	gRootDoc.docId = docShare.docId;
            	gRootDoc.shareId = gShareId;
            	$("#projectName").text(gRootDoc.showName);

            	//成功后台回调
            	callback && callback();
            }
            else
            {
            	console.log(ret.msgInfo);
            	if(ret.msgData && ret.msgData == "1")	//需要验证分享密码
            	{
            		showDocSharePwdVerifyPanel(gShareId, callback);
            	}
            	else
            	{
            		showErrorMessage({
                		id: "idAlertDialog",	
                		title: _Lang("提示"),
                		okbtn: _Lang("确定"),
                		msg: _Lang("获取文件分享信息失败", " : ", ret.msgInfo),                		
                	});
            	}
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("获取文件分享信息失败", " : ", "服务器异常"),
        	});
        }
    });
}

function showDocSharePwdVerifyPanel(shareId, successCallback)
{
	console.log("showDocSharePwdVerifyPanel shareId:" + shareId);
	bootstrapQ.dialog({
		id: 'docSharePwdVerify',
		url: 'docSharePwdVerify' + langExt + '.html',
		title: _Lang('密码验证'),
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
		big: false,
		callback: function(){
			DocSharePwdVerifyPageInit(shareId, successCallback);
		},
	});
}

function globalVarInit()
{
    //Confirm if it is PC
	if(gIsPC == true)
    {
	    console.log("It is PC");
    }
    else
    {
    	console.log("It is MP");
	    //hide the drag lines
	    $("#line").hide();
	    $(".second-line").hide();
	    //hide the left div
        $(".manual-left").hide();
	    //show Center Div
	    $(".second-table").css("left",0);
        $(".second-table")[0].style.width=100+'vw';
        //hide right Dive
        $(".manual-right")[0].style.left = 0;
        $(".manual-right")[0].style.width = 100+'vw';
        $(".manual-right").hide();
    }

    console.log("globalVarInit() start");

    setGDocShareInfo();

    setGInitReposInfo();

	//set gInitDocInfo
	setGInitDocInfo();

	//setGShowType
	setGShowType();

	console.log("globalVarInit() gInitReposId:" + gInitReposInfo.id  + " gShowType:" + gShowType + " gInitDocInfo:", gInitDocInfo);
}

function setGDocShareInfo()
{
	var shareId = getQueryString("shareId");
	if(shareId)
	{
		gShareId = shareId;
		//不允许登录
		$('#loginBtn').hide();
    	$('#logoutBtn').hide();
       	$('#modeSwitchBtn').hide();
	}
}

function setGInitReposInfo()
{
	var reposId = getQueryString("vid");

	gInitReposInfo.id = reposId;

	//set the vid in upload form
	$("#reposId").val(reposId);

}

function setGShowType()
{
	gInitShowType = getQueryString("showType");
	if(!gInitShowType)
	{
		//保持页面默认的gShowType
	}
	else
	{
		gShowType = gInitShowType;
	}

	changePageStyle(gShowType);

	if(gShowType == 1)	//预览
   	{
	    $("#modeSwitchBtnText").css("title","标准模式");
    }
    else
    {
		$("#modeSwitchBtnText").css("title","电子书模式");
    }
}

function setGInitDocInfo()
{
	var docId = getQueryString("doc");
	if(!docId)
	{
		docId = 0;
	}

	var path = getQueryString("path");
	if(path && path != null)
	{
		path = base64_decode(path);
	}
	else
	{
		path = "";
	}

	var name = getQueryString("name");
	if(name && name != null)
	{
		name = base64_decode(name);
	}
	else
	{
		name = "";
	}

	var edit = getQueryString("edit");
	if(!edit)
	{
		edit = false;
	}
	if(docId == 0)
	{
		edit = false;
	}

	gInitDocInfo.vid = gInitReposInfo.id;
	gInitDocInfo.docId = docId;
	gInitDocInfo.path = path;
	gInitDocInfo.name = name;
	gInitDocInfo.edit = edit;
}

function treeBodyZoneInit()
{
	console.log("treeBodyZoneInit()");
	var treeBodyZone = document.getElementById("treeBody");
	
	//注意：onclick的初衷是为了实现点击空白区域来取消文件的选中，但该事件也会被文件拖放事件触发，因此使用rootDocSelected标记来进行判断
	var rootDocSelected = null;
	treeBodyZone.onclick = function(e){
        e.preventDefault();
        
		//console.log("treeBodyZone.onclick() e.target.tagName:", e.target.tagName);
        //判断是否在zTree上
        if(e.target.tagName != "SPAN" && e.target.tagName != "A")
        {
        	if(rootDocSelected == null || rootDocSelected == false)
        	{
        		console.log("treeBodyZone.onclick() gRootDoc selected");
                rootDocSelected = true;
        		var treeObj = $.fn.zTree.getZTreeObj("doctree");
        		treeObj.cancelSelectedNode();
				showDocList(gRootDoc);
				getAndShowDoc(gRootDoc, 1, false);
        	}
        }
        else
        {
        	if(rootDocSelected == true)
        	{
        		console.log("treeBodyZone.onclick() gRootDoc unselected");
        		rootDocSelected = false;
        	}
        }            
    };
}

var FileUpload;
function DocUploadInit()
{
	var uploadDisplayInit = function(index, totalNum) {
		var str="<div><span class='upload-list-title'>正在上传  " +index +" / " + totalNum +"</span><span class='reuploadAllBtn' onclick='reuploadFailDocs()' style='display:none'>全部重传 </span><i class='el-icon-close uploadCloseBtn'></i></div>";
		str +="<div id='uploadedFileList' class='uploadedFileList'></div>";
		$(".el-upload-list").show();
		$('.el-upload-list').html(str);
		
		showDownloadBox($(".el-upload-list").height() + 40);
  	};
  	
  	var showUploadingInfo = function(reuploadFlag, uploadStartedNum, totalNum, reuploadStartedNum, reuploadTotalNum)
  	{
  		if(reuploadFlag == false)
  		{
  			$(".upload-list-title").text(_Lang("正在上传") + "  " + uploadStartedNum + " / " + totalNum);
  		}
  		else
  		{
  			$(".upload-list-title").text(_Lang("正在重传") + "  " + reuploadStartedNum + " / " + reuploadTotalNum);
  		}
  	}
	
	var createUploadItem = function(index, fileName) {
		return "<li class='el-upload-list__item file" + index + " is-uploading' value=" + index + ">"+
		"<a class='el-upload-list__item-name uploadFileName'><i class='el-icon-document'></i><span class='uploadFileName' >"+ fileName +"</span></a>"+
		"<a class='reuploadBtn reupload" + index + "' onclick='reuploadFailDocs("+ index +")'  style='display:none'>重传</a>"+
		"<label class='el-upload-list__item-status-label'><i class='el-icon-upload-success el-icon-circle-check'></i></label>"+
		"<i class='el-icon-close stopUpload'  value="+index+" onclick='FileUpload.stopUpload("+ index +")'></i>"+
		"<div class='el-progress el-progress--line'>"+
			"<div class='el-progress-bar'>"+
				"<div class='el-progress-bar__outer' >"+
					"<div class='el-progress-bar__inner'></div>"+
				"</div>"+
			"</div>"+
			"<div class='el-progress__text' style='font-size: 12.8px;'></div>"+
		"</div>"+
	  "</li>";
	};
	
	var appendUploadItems = function(uploadItemsHtmlStr) {
		$('#uploadedFileList').append(uploadItemsHtmlStr);
	};
			
	var deleteUploadItem = function(index) {
  		$('.file' + index).remove();      		
	};

	var updateUploadItem = function(index, speed, percent){
		$('.file'+index+' .el-progress__text').text(speed + " " + percent+"%");
		$('.file'+index+' .el-progress-bar__inner')[0].style.width = percent +"%"; //进度条

		//printUploadedTime();
	};
	
	var stopAllUploadCallback = function(){  	  		
  		$(".reuploadAllBtn").show();
	};

	var uploadSuccessCallback = function(index, context){  	  					
		//更新上传显示
		$('.file'+index).removeClass('is-uploading');
		$('.file'+index).addClass('is-success');
		//hide the reupload btn
		$(".reupload"+index).hide();
		
		//更新文件树和文件列表列表
     	if(context.isNewDoc)
		{
     		console.log("uploadSuccessCallback() is new Doc", context);
			if(context.addedParentDocList)
         	{
         		//addParentNodes(context.addedParentDocList);
         		addTreeNode(context.addedParentDocList[0]);	//添加最上层目录
         		context.addedParentDocList = undefined; //释放内存
         	}
			
        	if(context.newDoc)
        	{
    			addTreeNode(context.newDoc);
     			addDocListNode(context.newDoc);
     			context.newDoc = undefined; //释放内存
        	}
		}

	};
	
	var uploadErrorCallback = function(index){  	  		

		$('.file' + index).removeClass('is-uploading');
		$('.file' + index).addClass('is-fail');
  	
  		//show the reupload btn
		$(".reupload" + index).show();
	};
	
	var uploadEndCallback = function(totalNum, successNum){  	  		
  		//显示上传完成 
  		var uploadEndInfo = "";
  		if(successNum != totalNum)
  		{
  			switch(langType)
  			{
  			case "en":
  				uploadEndInfo = "Upload Completed (Total : " + totalNum +")"+",Failed : " + (toalNum - successNum);
  				break;
  			default:
  				uploadEndInfo = "上传完成 (共" + totalNum +"个)"+",成功 " + successNum + "个";
  				break;
  			}
  			
  			$(".reuploadAllBtn").show();

  			// 普通消息提示条
			bootstrapQ.msg({
					msg : uploadEndInfo,
					type : 'warning',
					time : 2000,
				    }); 
  		}
  		else
  		{
  			switch(langType)
  			{
  			case "en":
  				uploadEndInfo = "Upload Completed (Total : " + totalNum +")";
  				break;
  			default:
  				uploadEndInfo = "上传完成 (共" + totalNum +"个)";
  				break;
  			}
  			
  			$(".reuploadAllBtn").hide();
            // 普通消息提示条
			bootstrapQ.msg({
					msg : uploadEndInfo,
					type : 'success',
					time : 2000,
				    }); 
  		}
  		$(".upload-list-title").text(uploadEndInfo);   		
  		
  		//清除文件控件
		$("#uploadFiles").val("");
		$("#uploadDir").val("");
  		$("#checkInFile").val("");
	};
	
	var reuploadItemInit = function(index){
  		//hide the reupload btn
		$(".reupload"+index).hide();
		
		$('.file' + index).addClass('is-uploading');
		$('.file' + index).removeClass('is-fail');
	};
	
	var config = {
		uploadDisplayInit: uploadDisplayInit,
		showUploadingInfo: showUploadingInfo,
		createUploadItem: createUploadItem,
		appendUploadItems: appendUploadItems,		
		deleteUploadItem: deleteUploadItem,
		updateUploadItem: updateUploadItem,
		stopAllUploadCallback: stopAllUploadCallback,
		uploadSuccessCallback: uploadSuccessCallback,			
		uploadErrorCallback: uploadErrorCallback,			
		uploadEndCallback: uploadEndCallback,			
		reuploadItemInit: reuploadItemInit,
		gShareId: gShareId, 
	};
	
	FileUpload = new DocUpload(config);
}

function dragDropUploadZoneInit()
{
	var selectedTarget = null;
  	//拖拽上传:目录树区域
	var uuz = document.getElementById("uuz");
	uuz.ondragenter = function(e){
        e.preventDefault();
    };
    uuz.ondragover = function(e){
        e.preventDefault();
        //判断现在所在的zTree Node并选中它
        if(e.target.tagName=="SPAN"){
        	if(selectedTarget == null || selectedTarget != e.target)
        	{
        		console.log("uuz.ondragover() trigger zTree node click");
        		selectedTarget = e.target;
        		e.target.parentNode.click();
        	}
        }
    };
    uuz.ondrop = function(e){
        console.log("uuz.ondrop() event:",e);
    	e.preventDefault();

    	//If File drop on the zTree Item, trigger the click event on it
	  	//console.log("uuz.ondrop() e.target:",e.target);
        if(e.target.tagName=="SPAN"){
        	console.log("uuz.ondrop() trigger zTree node click");
        	e.target.parentNode.click();
        }

        //Choose the selectNode as the place for upload
	  	var treeObj = $.fn.zTree.getZTreeObj("doctree");
		var selectedNode = treeObj.getSelectedNodes()[0];
		console.log("uuz.ondrop() selectedNode",selectedNode);
		var parentNode = selectedNode;
		if(selectedNode && selectedNode.isParent === false)
		{
			console.log("uuz.ondrop() selectedNode:" + selectedNode.name);
			parentNode = selectedNode.getParentNode();
		}
		console.log("uuz.ondrop() parentNode:", parentNode);
        dragUploadConfirm(e,parentNode);
    };

	//拖拽上传:子目录区域
	//目标目录是当前选中的Doc
	var docListZone = document.getElementById("secondDropZone");
	docListZone.ondragenter = function(e){
        e.preventDefault();
    };
    docListZone.ondragover = function(e){
        e.preventDefault();
    };
    docListZone.ondrop = function(e){
        e.preventDefault();
	  	//get the parentNode
	  	var treeObj = $.fn.zTree.getZTreeObj("doctree");
		var selectedNode = treeObj.getSelectedNodes()[0];
		console.log("docListZone.ondrop() selectedNode:",selectedNode);
		var parentNode = selectedNode;
		if(selectedNode && selectedNode.isParent === false)
		{
			console.log("docListZone.ondrop() selectedNode:" + selectedNode.name);
			parentNode = selectedNode.getParentNode();
		}
		console.log("docListZone.ondrop() parentNode:", parentNode);
		dragUploadConfirm(e,parentNode);
    };

    //文件预览区的拖拽上传
    var docZone =  document.getElementById("previewZone");
    docZone.ondragenter = function(e){
        e.preventDefault();
    };
    docZone.ondragover = function(e){
        e.preventDefault();
    };
    docZone.ondrop = function(e){
        e.preventDefault();
	  	//get the parentNode
	  	var treeObj = $.fn.zTree.getZTreeObj("doctree");
		var selectedNode = treeObj.getSelectedNodes()[0];
		console.log(selectedNode);
		var parentNode = selectedNode;
		if(selectedNode && selectedNode.isParent === false)
		{
			console.log("selectedNode:" + selectedNode.name);
			parentNode = selectedNode.getParentNode();
		}
        dragUploadConfirm(e,parentNode);
    };
}

//zTreeSeting
function zTreeSettingInit(reposId)
{
	//处于编辑状态下，需要禁用删除和改名等所有编辑操作，避免出错
    if(gInitDocInfo.edit == true){
        var edit = {};
        setting.edit = edit;
    }
    //设置异步加载的参数
    var async =  {
		enable : true,//设置 zTree 是否开启异步加载模式
        url : "/DocSystem/Repos/getSubDocList.do",
        type : "post",
		autoParam : ["id","Level","path","name"],//异步加载时需要自动提交父节点属性的参数
		otherParam:{
			"vid": reposId,
            "shareId": gShareId,
		},
		dataFilter: asyncDataFilter,
	};
	setting.async = async;

	/*if(gShowType == 1)
	{
		var view = {
        	showLine: false,	//不显示文件下面的下划线
        	addDiyDom: addDiyDom         //设置zTree的自定义图标
		};
		setting.view = view;
	}*/
}

function querySystemLogTest()
{
	//查询日志列表测试
	$.ajax({
         url : "/DocSystem/Doc/querySystemLog.do",
         type : "post",
         dataType : "json",
         data : {
        	queryId: "myTestQueryId",
        	//reposName: gReposInfo.name,
            //path: "",
            //name : "demo.png",
         },
         success : function (ret) {
        	console.log("querySystemLog ret:", ret); 
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("querySystemLog exception!"),
        	});
        }
    });
}

function contextMenuInit()
{
	//右键菜单实现：contextMenu Start
	context.init({preventDoubleContext: true});

	//zTree外部的右键菜单
	context.attach('#treeBody', [
		{text: _Lang('新建'), subMenu: [
			{text: _Lang('文件'),  action: function(e){
					e.preventDefault();
					curRightClickedTreeNode = null;
					var parentNode = getParentNodeByNode(null);
        			newDoc(1,parentNode);
				}
			},
			{text: _Lang('文件夹'),  action: function(e){
					e.preventDefault();
        			curRightClickedTreeNode = null;
        			var parentNode = getParentNodeByNode(null);
        			newDoc(2,parentNode);
				}
			},
			]
		},
		{text: _Lang('上传'), subMenu: [
			{text: _Lang('文件'),  action: function(e){
					e.preventDefault();
					curRightClickedTreeNode = null;
				    gParentNodeForUpload = null;	//uploadFiles is the trigger, so need to save the destination dir to gVar
				  	uploadFiles();
				}
			},
			{text: _Lang('文件夹'),  action: function(e){
					e.preventDefault();
					curRightClickedTreeNode = null;
				    gParentNodeForUpload = null;	//uploadFiles is the trigger, so need to save the destination dir to gVar
					uploadDir();
				}
			},
			]
		},
		{divider: true},
		{text: _Lang('下载'), action: function(e){
					e.preventDefault();
					var treeNodes = [];
					treeNodes.push(gRootDoc);
					downloadDoc(treeNodes,true,1);
				}
		},
		{divider: true},
		{text: _Lang('分享'), action: function(e){
					e.preventDefault();
					shareDoc(gRootDoc);
				}
		},
		{divider: true},
		{text: _Lang('全选'), action: function(e){
				e.preventDefault();
				selectAllNode(null);
	    	}
		},
		{divider: true},
		{text: _Lang('粘贴'), action: function(e){
					e.preventDefault();
					curRightClickedTreeNode = null;
					DoPaste(gCopiedNodes,null,gIsCopy);
				}
		},
		{divider: true},		
		{text: _Lang('远程存储'), subMenu: [
			{text: _Lang('推送'),  action: function(e){
					e.preventDefault();
					showRemoteStoragePushPanel(gRootDoc);
				}
			},
			{text: _Lang('拉取'),  action: function(e){
					e.preventDefault();
					showRemoteStoragePullPanel(gRootDoc);
				}
			},
			]
		},
		{divider: true},		
		{text: _Lang('文件服务器'), subMenu: [
			{text: _Lang('推送'),  action: function(e){
					e.preventDefault();
					showDocPushPanel(gRootDoc, 1);
				}
			},
			{text: _Lang('拉取'),  action: function(e){
					e.preventDefault();
					showDocPullPanel(gRootDoc, 1);
				}
			},
			]
		},
		{divider: true},
		{text: _Lang('查看历史'), action: function(e){
					e.preventDefault();
					curRightClickedTreeNode = null;
	    			showDocHistory(gRootDoc,0);
				}
		},
		{divider: true},
		{text: _Lang('回收站'), action: function(e){
					e.preventDefault();
					curRightClickedTreeNode = null;
					showDocHistory(gRootDoc,4);
				}
		},
		{divider: true},		
		{text: _Lang('更多') + '...', subMenu: [
					{text: _Lang('刷新'), action: function(e){
								e.preventDefault();
								refreshDoc(null, 0);
							}
					},
		   			{divider: true},
					{text: _Lang('锁定'), action: function(e){
							e.preventDefault();
							lockDoc(gRootDoc, 1);
						}
					},
					{text: _Lang('解锁'), action: function(e){
							e.preventDefault();
							unlockDoc(gRootDoc, 1);
						}
					},
					{divider: true},
					{text: _Lang('备注'), subMenu: [
							{text: _Lang('查看历史'), action: function(e){
									e.preventDefault();
									curRightClickedTreeNode = null;
				        			showDocHistory(gRootDoc, 1);
			        			}
							},	
							{text: _Lang('下载'), action: function(e){
									e.preventDefault();
									var treeNodes = [];
									treeNodes.push(gRootDoc);
									downloadDoc(treeNodes,true,2);
								}
							},
		   				]
		   			},
		   			{divider: true},
		   			{text: _Lang('查看备份'), subMenu: [
		   				{text: _Lang('本地备份'), action: function(e){
		   						e.preventDefault();
		   						curRightClickedTreeNode = null;
		   	        			showDocHistory(gRootDoc, 2);
		   	    			}
		   				},	
		   				{text: _Lang('异地备份'), action: function(e){
		   						e.preventDefault();
		   						curRightClickedTreeNode = null;
		   	        			showDocHistory(gRootDoc, 3);
		   					}
		   				},
		   				]
		   			},
				]
			},
		]
	);
	//zTree上的右键菜单
	context.attach('#tree', [
		{text: _Lang('新建'), subMenu: [
			{text: _Lang('文件'),  action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeByNode(curRightClickedTreeNode);
					newDoc(1,parentNode);
				}
			},
			{text: _Lang('文件夹'),  action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeByNode(curRightClickedTreeNode);
					newDoc(2,parentNode);
				}
			},
			]
		},
		{text: _Lang('上传'), subMenu: [
			{text: _Lang('文件'),  action: function(e){
					e.preventDefault();
					gParentNodeForUpload = getParentNodeByNode(curRightClickedTreeNode);	//uploadFiles is the trigger, so need to save the destination dir to gVar
					uploadFiles();
				}
			},
			{text: _Lang('文件夹'),  action: function(e){
					e.preventDefault();
					gParentNodeForUpload = getParentNodeByNode(curRightClickedTreeNode);	//uploadFiles is the trigger, so need to save the destination dir to gVar
					uploadDir();
				}
			},
			]
		},
		{divider: true},
		{text: _Lang('下载'), action: function(e){
					e.preventDefault();
					var treeNodes = getSelectedNodes();
					downloadDoc(treeNodes,true,1);
				}
		},
		{divider: true},
		{text: _Lang('分享'), action: function(e){
					e.preventDefault();
					shareDoc(curRightClickedTreeNode);
				}
		},
		{divider: true},
		{text: _Lang('全选'), action: function(e){
				e.preventDefault();
				selectAllNode(curRightClickedTreeNode);
	    	}
		},
		{divider: true},
		{text: _Lang('复制'), action: function(e){
					e.preventDefault();
					gCopiedNodes = getSelectedNodes();
					gIsCopy = true;
					console.log("gCopiedNodes",gCopiedNodes);
				}
		},
		{text: _Lang('剪切'), action: function(e){
				e.preventDefault();
				gCopiedNodes = getSelectedNodes();
				gIsCopy = false;
				console.log("gCopiedNodes",gCopiedNodes);
			}
		},
		{divider: true},
		{text: _Lang('粘贴'), action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeByNode(curRightClickedTreeNode);
					DoPaste(gCopiedNodes,parentNode, gIsCopy);
				}
		},
		{divider: true},
		{text: _Lang('删除'), action: function(e){
					e.preventDefault();
					var deleteNodes = getDeleteNodes();
					DoDelete(deleteNodes);
				}
		},
		{text: _Lang('重命名'), action: function(e){
					e.preventDefault();
					if(curRightClickedTreeNode !== null)
					{
						showRenameDialog(curRightClickedTreeNode);
						//treeObj.editName(curRightClickedTreeNode);
						curRightClickedTreeNode = null;
	    			}
				}
		},
		{divider: true},	
		{text: _Lang('远程存储'), subMenu: [
			{text: _Lang('推送'),  action: function(e){
					e.preventDefault();
					showRemoteStoragePushPanel(curRightClickedTreeNode);
				}
			},
			{text: _Lang('拉取'),  action: function(e){
					e.preventDefault();
					showRemoteStoragePullPanel(curRightClickedTreeNode);
				}
			},				
			]
		},
		{divider: true},
		{text: _Lang('文件服务器'), subMenu: [
			{text: _Lang('推送'),  action: function(e){
					e.preventDefault();
					showDocPushPanel(curRightClickedTreeNode, 1);
				}
			},
			{text: _Lang('拉取'),  action: function(e){
					e.preventDefault();
					showDocPullPanel(curRightClickedTreeNode, 1);
				}
			},
			]
		},
		{divider: true},
		{text: _Lang('查看历史'), action: function(e){
					e.preventDefault();
		      		showDocHistory(curRightClickedTreeNode,0);
				}
		},
		{divider: true},
		{text: _Lang('回收站'), action: function(e){
					e.preventDefault();
					showDocHistory(curRightClickedTreeNode,4);
				}
		},
		{divider: true},	
		{text: _Lang('更多') + '...', subMenu: [
					{text: _Lang('在新窗口打开'), action: function(e){
							e.preventDefault();
							if(curRightClickedTreeNode != null && curRightClickedTreeNode.type == 2)
							{
								openDocInNewPage(curRightClickedTreeNode);
							}
							else
							{
								openDoc(curRightClickedTreeNode, true, "openInNewPage", "office", gShareId);
							}
						}
					},
					{text: _Lang('本地打开'), action: function(e){
							e.preventDefault();
							openInLocalApp(curRightClickedTreeNode);
						}
					},
					{divider: true},
					{text: _Lang('设置密码'), action: function(e){
							e.preventDefault();
			        		showDocPwdSetPanel(curRightClickedTreeNode);
						}
					},
					{divider: true},
					{text: _Lang('复制'), subMenu: [
			           	{text: _Lang('名字'), action: function(e){
								e.preventDefault();
			        			copyDocName(curRightClickedTreeNode);
							}
						},
						{text: _Lang('路径'), action: function(e){
									e.preventDefault();
				        			copyDocPath(curRightClickedTreeNode);
								}
						},
						{text: _Lang('链接'), action: function(e){
									e.preventDefault();
				        			copyUrl(curRightClickedTreeNode);
								}
						},
						{text: _Lang('本地路径'), action: function(e){
								e.preventDefault();
								var localPath = getDocLocalPath(gReposInfo, curRightClickedTreeNode);
								console.log("本地路径 localPath:" + localPath);
								copyString(localPath);
							}
						},
						{text: _Lang('下载链接'), action: function(e){
								e.preventDefault();
								curRightClickedTreeNode.shareId = gShareId;
						  		getDocFileLink(curRightClickedTreeNode, copyString, showErrorMessage, "REST"); //要求获取RESTFUL风格的fileLink
							}
						},
						]
					},
					{divider: true},
					{text: _Lang('刷新'), action: function(e){
								e.preventDefault();
								if(curRightClickedTreeNode !== null)
								{
									refreshDoc(curRightClickedTreeNode, 0);
									curRightClickedTreeNode = null;
				    			}
							}
					},
					{divider: true},
					{text: _Lang('锁定'), action: function(e){
							e.preventDefault();
							lockDoc(curRightClickedTreeNode, 1);
						}
					},
					{text: _Lang('解锁'), action: function(e){
							e.preventDefault();
							unlockDoc(curRightClickedTreeNode, 1);
						}
					},
					{divider: true},
					{text: _Lang('预览'), action: function(e){
							e.preventDefault();
							openDoc(curRightClickedTreeNode, true, "openInArtDialog", "pdf", gShareId);
						}
					},
					{divider: true},
					{text: _Lang('备注'), subMenu: [
								{text: _Lang('查看历史'), action: function(e){
										e.preventDefault();
										showDocHistory(curRightClickedTreeNode,1);
									}
								},						
								{text: _Lang('下载'), action: function(e){
										e.preventDefault();
										var treeNodes = [];
										treeNodes.push(curRightClickedTreeNode);
										downloadDoc(treeNodes,true,2);
									}
								},
		   				  ]
		   			},
		   			{divider: true},
		   			{text: _Lang('查看备份'), subMenu: [
		   				{text: _Lang('本地备份'), action: function(e){
		   						e.preventDefault();
		   	        			showDocHistory(curRightClickedTreeNode, 2);
		   	    			}
		   				},	
		   				{text: _Lang('异地备份'), action: function(e){
		   						e.preventDefault();
		   	        			showDocHistory(curRightClickedTreeNode, 3);
		   					}
		   				},
		   				]
		   			},
			  ]
		},
		{divider: true},
		{text: _Lang('属性'), action: function(e){
				e.preventDefault();
				if(curRightClickedTreeNode == null)
				{
					showErrorMessage({
		        		id: "idAlertDialog",	
		        		title: _Lang("提示"),
		        		okbtn: _Lang("确定"),
		        		msg: _Lang("请选择需要文件或目录"),
			    	});
					return false;
				}
				showDocDetail(curRightClickedTreeNode);
			}
		},
	]);


	//secondList外部的右键菜单
	context.attach('#secondListBody', [
		{text: _Lang('新建'), subMenu: [
			{text: _Lang('文件'),  action: function(e){
					e.preventDefault();
		    	  	//get the parentNode
		    	  	newDocEx(1);
				}
			},
			{text: _Lang('文件夹'),  action: function(e){
					e.preventDefault();
					newDocEx(2);
				}
			},
			]
		},
		{text: _Lang('上传'), subMenu: [
			{text: _Lang('文件'),  action: function(e){
					e.preventDefault();
					uploadFilesEx();
				}
			},
			{text: _Lang('文件夹'),  action: function(e){
					e.preventDefault();
					uploadDirEx();
				}
			},
			]
		},
		{divider: true},
		{text: _Lang('分享'), action: function(e){
					e.preventDefault();
					shareDoc(gDocInfo);
				}
		},
		{divider: true},
		{text: _Lang('粘贴'), action: function(e){
					e.preventDefault();
					curRightClickedDocListNode = null;
					var parentNode = getParentNodeEx(gDocInfo);
					DoPaste(gCopiedNodes, parentNode, gIsCopy);
				}
		},			
		{divider: true},	
		{text: _Lang('远程存储'), subMenu: [
			{text: _Lang('推送'),  action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeEx(gDocInfo);
					showRemoteStoragePushPanel(parentNode);
				}
			},
			{text: _Lang('拉取'),  action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeEx(gDocInfo);
					showRemoteStoragePullPanel(parentNode);
				}
			},
			]
		},
		{divider: true},
		{text: _Lang('文件服务器'), subMenu: [
			{text: _Lang('推送'),  action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeEx(gDocInfo);
					showDocPushPanel(parentNode, 1);
				}
			},
			{text: _Lang('拉取'),  action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeEx(gDocInfo);
					showDocPullPanel(parentNode, 1);
				}
			},			
			]
		},
		{divider: true},
		{text: _Lang('查看历史'), action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeEx(gDocInfo);
	    			showDocHistory(parentNode,0);
				}
		},
		{divider: true},
		{text: _Lang('回收站'), action: function(e){
					e.preventDefault();
					var parentNode = getParentNodeEx(gDocInfo);
					showDocHistory(parentNode,4);
				}
		},
		{divider: true},
		{text: _Lang('更多') + '...', subMenu: [
					{text: _Lang('在新窗口打开'), action: function(e){
							e.preventDefault();
							var parentNode = getParentNodeEx(gDocInfo);
							if(parentNode != null && parentNode.type == 2)
							{
								openDocInNewPage(parentNode);
							}
							else
							{
								openDoc(parentNode, true, "openInNewPage", "office", gShareId);
							}
						}
					},
					{text: _Lang('本地打开'), action: function(e){
							e.preventDefault();
							openInLocalApp(parentNode);
						}
					},
					{divider: true},
					{text: _Lang('设置密码'), action: function(e){
							e.preventDefault();
							var parentNode = getParentNodeEx(gDocInfo);
			        		showDocPwdSetPanel(parentNode);
						}
					},
					{divider: true},
					{text: _Lang('复制'), subMenu: [
			           	{text: _Lang('名字'), action: function(e){
								e.preventDefault();
								var parentNode = getParentNodeEx(gDocInfo);
			        			copyDocName(parentNode);
							}
						},
						{text: _Lang('路径'), action: function(e){
									e.preventDefault();
									var parentNode = getParentNodeEx(gDocInfo);
				        			copyDocPath(parentNode);
								}
						},
						{text: _Lang('链接'), action: function(e){
									e.preventDefault();
									var parentNode = getParentNodeEx(gDocInfo);
				        			copyUrl(parentNode);
								}
						},
						{text: _Lang('本地路径'), action: function(e){
								e.preventDefault();
								var parentNode = getParentNodeEx(gDocInfo);
								var localPath = getDocLocalPath(gReposInfo, parentNode);
								console.log("本地路径 localPath:" + localPath);
								copyString(localPath);
							}
						},
						{text: _Lang('下载链接'), action: function(e){
								e.preventDefault();
								var parentNode = getParentNodeEx(gDocInfo);
								parentNode.shareId = gShareId;
						  		getDocFileLink(parentNode, copyString, showErrorMessage, "REST"); //要求获取RESTFUL风格的fileLink
							}
						},
						]
					},
   	   				{divider: true},
					{text: _Lang('刷新'), action: function(e){
								e.preventDefault();
								var parentNode = getParentNodeEx(gDocInfo);
								refreshDoc(parentNode, 0);
							}
					},
					{divider: true},
					{text: _Lang('锁定'), action: function(e){
							e.preventDefault();
							var parentNode = getParentNodeEx(gDocInfo);
							lockDoc(parentNode, 1);
						}
					},
					{text: _Lang('解锁'), action: function(e){
							e.preventDefault();
							var parentNode = getParentNodeEx(gDocInfo);
							unlockDoc(parentNode, 1);
						}
					},
					{divider: true},
					{text: _Lang('备注'), subMenu: [
   							{text: _Lang('查看历史'), action: function(e){
   									e.preventDefault();
   									var parentNode = getParentNodeEx(gDocInfo);
   				        			showDocHistory(parentNode, 1);
   			        			}
   							},						
   							{text: _Lang('下载'), action: function(e){
									e.preventDefault();
									var parentNode = getParentNodeEx(gDocInfo);
									var treeNodes = [];
									treeNodes.push(parentNode);
									downloadDoc(treeNodes,true,2);
			        			}
							},						   							
   					  	]
   	   				},
   	   				{divider: true},
		   	 		{text: _Lang('查看备份'), subMenu: [
		   	 			{text: _Lang('本地备份'), action: function(e){
		   	 					e.preventDefault();
		   	 					var parentNode = getParentNodeEx(gDocInfo);
		   	         			showDocHistory(parentNode, 2);
		   	     			}
		   	 			},	
		   	 			{text: _Lang('异地备份'), action: function(e){
		   	 					e.preventDefault();
		   	 					var parentNode = getParentNodeEx(gDocInfo);
		   	         			showDocHistory(parentNode, 3);
		   	 				}
		   	 			},
		   	 			]
		   	 		},
			  	]
			},			
		]
	);
	//secondList上的右键菜单
	if(gIsPC == false)
	{
		context.attach('#secondList', [
			{text: _Lang('下载'), action: function(e){
					e.preventDefault();
					var treeNodes = [];
					treeNodes.push(curRightClickedDocListNode);
					downloadDoc(treeNodes,true,1);
				}
			},
			{divider: true},
			{text: _Lang('分享'), action: function(e){
						e.preventDefault();
						shareDoc(curRightClickedDocListNode);
					}
			},
			{text: _Lang('重命名'), action: function(e){
						e.preventDefault();
						if(curRightClickedDocListNode !== null)
						{
							showRenameDialog(curRightClickedDocListNode);
							curRightClickedDocListNode = null;
		    			}
					}
			},
			{divider: true},
			{text: _Lang('复制'), action: function(e){
						e.preventDefault();
						gCopiedNodes = [];
						gIsCopy = true;
						if(curRightClickedDocListNode != null)
						{
							gCopiedNodes.push(curRightClickedDocListNode);
						}
						console.log("gCopiedNodes",gCopiedNodes);
					}
			},
			{text: _Lang('剪切'), action: function(e){
					e.preventDefault();
					gCopiedNodes = [];
					gIsCopy = false;
					if(curRightClickedDocListNode != null)
					{
						gCopiedNodes.push(curRightClickedDocListNode);
					}
					console.log("gCopiedNodes",gCopiedNodes);
				}
			},
			{divider: true},
			{text: _Lang('粘贴'), action: function(e){
						e.preventDefault();
						var parentNode = getParentNodeEx(gDocInfo);
						DoPaste(gCopiedNodes, parentNode, gIsCopy);
					}
			},							
			{divider: true},
			{text: _Lang('删除'), action: function(e){
						e.preventDefault();
						console.log(e);
						var deleteNodes = [];
						deleteNodes.push(curRightClickedDocListNode);
						DoDelete(deleteNodes);
					}
			},
			{divider: true},
			{text: _Lang('远程存储'), subMenu: [
				{text: _Lang('推送'),  action: function(e){
						e.preventDefault();
						showRemoteStoragePushPanel(curRightClickedDocListNode);
					}
				},
				{text: _Lang('拉取'),  action: function(e){
						e.preventDefault();
						showRemoteStoragePullPanel(curRightClickedDocListNode);
					}
				},
				]
			},			
			{divider: true},
			{text: _Lang('文件服务器'), subMenu: [
				{text: _Lang('推送'),  action: function(e){
						e.preventDefault();
						showDocPushPanel(curRightClickedDocListNode, 1);
					}
				},
				{text: _Lang('拉取'),  action: function(e){
						e.preventDefault();
						showDocPullPanel(curRightClickedDocListNode, 1);
					}
				},	
				]
			},
			{divider: true},
			{text: _Lang('查看历史'), action: function(e){
					e.preventDefault();
					showDocHistory(curRightClickedDocListNode,0);
				}
			},	
			{divider: true},
			{text: _Lang('回收站'), action: function(e){
						e.preventDefault();
						showDocHistory(curRightClickedDocListNode,4);
					}
			},
			{divider: true},
				{text: _Lang('更多') + '...', subMenu: [
					{text: _Lang('在新窗口打开'), action: function(e){
							e.preventDefault();
							if(curRightClickedDocListNode != null && curRightClickedDocListNode.type == 2)
							{
								openDocInNewPage(curRightClickedDocListNode);
							}
							else
							{
								openDoc(curRightClickedDocListNode, true, "openInNewPage", "office", gShareId);
							}
						}
					},
					{text: _Lang('本地打开'), action: function(e){
							e.preventDefault();
							openInLocalApp(curRightClickedDocListNode);
						}
					},
					{divider: true},					
					{text: _Lang('设置密码'), action: function(e){
							e.preventDefault();
			        		showDocPwdSetPanel(curRightClickedDocListNode);
						}
					},
					{divider: true},
					{text: _Lang('复制'), subMenu: [
				           	{text: _Lang('名字'), action: function(e){
									e.preventDefault();
				        			copyDocName(curRightClickedDocListNode);
								}
							},
							{text: _Lang('路径'), action: function(e){
										e.preventDefault();
					        			copyDocPath(curRightClickedDocListNode);
									}
							},
							{text: _Lang('链接'), action: function(e){
										e.preventDefault();
					        			copyUrl(curRightClickedDocListNode);
									}
							},
							{text: _Lang('本地路径'), action: function(e){
									e.preventDefault();
									var localPath = getDocLocalPath(gReposInfo, curRightClickedDocListNode);
									console.log("本地路径 localPath:" + localPath);
									copyString(localPath);
								}
							},
							{text: _Lang('下载链接'), action: function(e){
									e.preventDefault();
									curRightClickedDocListNode.shareId = gShareId;
							  		getDocFileLink(curRightClickedDocListNode, copyString, showErrorMessage, "REST"); //要求获取RESTFUL风格的fileLink
								}
							},
						]
					},
		   			{divider: true},				
					{text: _Lang('预览'), action: function(e){
							e.preventDefault();
							openDoc(curRightClickedDocListNode, true, "openInArtDialog", "pdf", gShareId);
						}
					},					
					{divider: true},					
					{text: _Lang('备注'), subMenu: [
							{text: _Lang('查看历史'), action: function(e){
									e.preventDefault();
								    showDocHistory(curRightClickedDocListNode,1);
								}
							},						
							{text: _Lang('下载'), action: function(e){
									e.preventDefault();
									var treeNodes = [];
									treeNodes.push(curRightClickedDocListNode);
									downloadDoc(treeNodes,true,2);
								}
							},
		   				]
		   			},			
					{divider: true},
					{text: _Lang('查看备份'), subMenu: [
						{text: _Lang('本地备份'), action: function(e){
								e.preventDefault();
			        			showDocHistory(curRightClickedDocListNode, 2);
			    			}
						},	
						{text: _Lang('异地备份'), action: function(e){
								e.preventDefault();
			        			showDocHistory(curRightClickedDocListNode, 3);
							}
						},
						]
					},
				]
			},		
			{divider: true},
			{text: _Lang('属性'), action: function(e){
					e.preventDefault();
					showDocDetail(curRightClickedDocListNode);
				}
			},
		]);
	}
	else
	{
		context.attach('#secondList', [
			{text: _Lang('新建'), subMenu: [
				{text: _Lang('文件'),  action: function(e){
						e.preventDefault();
						var parentNode = getParentNodeEx(gDocInfo);
	        			newDoc(1,parentNode);
					}
				},
				{text: _Lang('文件夹'),  action: function(e){
						e.preventDefault();
						var parentNode = getParentNodeEx(gDocInfo);
	        			newDoc(2,parentNode);
					}
				},
				]
			},
			{text: _Lang('上传'), subMenu: [
				{text: _Lang('文件'),  action: function(e){
						e.preventDefault();
						var node = getNodeByNodeId(gDocInfo.docId);
						gParentNodeForUpload = getParentNodeByNode(node);
	        			uploadFiles();
					}
				},
				{text: _Lang('文件夹'),  action: function(e){
						e.preventDefault();
						var node = getNodeByNodeId(gDocInfo.docId);
						gParentNodeForUpload = getParentNodeByNode(node);
	        			uploadDir();
					}
				},
				]
			},
			{divider: true},
			{text: _Lang('下载'), action: function(e){
					e.preventDefault();
					var treeNodes = [];
					treeNodes.push(curRightClickedDocListNode);
					downloadDoc(treeNodes,true,1);
				}
			},
			{divider: true},
			{text: _Lang('分享'), action: function(e){
						e.preventDefault();
						shareDoc(curRightClickedDocListNode);
					}
			},
			{divider: true},
			{text: _Lang('复制'), action: function(e){
						e.preventDefault();
						gCopiedNodes = [];
						gIsCopy = true;
						if(curRightClickedDocListNode != null)
						{
							gCopiedNodes.push(curRightClickedDocListNode);
						}
						console.log("gCopiedNodes",gCopiedNodes);
					}
			},
			{text: _Lang('剪切'), action: function(e){
					e.preventDefault();
					gCopiedNodes = [];
					gIsCopy = false;
					if(curRightClickedDocListNode != null)
					{
						gCopiedNodes.push(curRightClickedDocListNode);
					}
					console.log("gCopiedNodes",gCopiedNodes);
				}
			},
			{divider: true},
			{text: _Lang('粘贴'), action: function(e){
						e.preventDefault();
						var parentNode = getParentNodeEx(gDocInfo);
						DoPaste(gCopiedNodes, parentNode, gIsCopy);
					}
			},
			{divider: true},
			{text: _Lang('删除'), action: function(e){
						e.preventDefault();
						console.log(e);
						var deleteNodes = [];
						deleteNodes.push(curRightClickedDocListNode);
						DoDelete(deleteNodes);
					}
			},
			{text: _Lang('重命名'), action: function(e){
						e.preventDefault();
						if(curRightClickedDocListNode !== null)
						{
							showRenameDialog(curRightClickedDocListNode);
							curRightClickedDocListNode = null;
		    			}
					}
			},			
			{divider: true},
			{text: _Lang('远程存储'), subMenu: [
					{text: _Lang('推送'),  action: function(e){
							e.preventDefault();
							showRemoteStoragePushPanel(curRightClickedDocListNode);
						}
					},
					{text: _Lang('拉取'),  action: function(e){
							e.preventDefault();
							showRemoteStoragePullPanel(curRightClickedDocListNode);
						}
					},
				]
			},
			{divider: true},
			{text: _Lang('文件服务器'), subMenu: [
				{text: _Lang('推送'),  action: function(e){
						e.preventDefault();
						showDocPushPanel(curRightClickedDocListNode, 1);
					}
				},
				{text: _Lang('拉取'),  action: function(e){
						e.preventDefault();
						showDocPullPanel(curRightClickedDocListNode, 1);
					}
				},
				]
			},
			{divider: true},
			{text: _Lang('查看历史'), action: function(e){
					e.preventDefault();
					showDocHistory(curRightClickedDocListNode,0);
				}
			},
			{divider: true},
			{text: _Lang('回收站'), action: function(e){
						e.preventDefault();
						showDocHistory(curRightClickedDocListNode,4);
					}
			},
			{divider: true},
			{text: _Lang('更多') + '...', subMenu: [
						{text: _Lang('在新窗口打开'), action: function(e){
								e.preventDefault();
								if(curRightClickedDocListNode != null && curRightClickedDocListNode.type == 2)
								{
									openDocInNewPage(curRightClickedDocListNode);
								}
								else
								{
									openDoc(curRightClickedDocListNode, true, "openInNewPage", "office", gShareId);
								}
							}
						},
						{text: _Lang('本地打开'), action: function(e){
								e.preventDefault();
								openInLocalApp(curRightClickedDocListNode);
							}
						},
						{divider: true},
						{text: _Lang('设置密码'), action: function(e){
								e.preventDefault();
				        		showDocPwdSetPanel(curRightClickedDocListNode);
							}
						},					
						{divider: true},
						{text: _Lang('复制'), subMenu: [
				           	{text: _Lang('名字'), action: function(e){
										e.preventDefault();
					        			copyDocName(curRightClickedDocListNode);
									}
							},
							{text: _Lang('路径'), action: function(e){
										e.preventDefault();
					        			copyDocPath(curRightClickedDocListNode);
									}
							},
							{text: _Lang('链接'), action: function(e){
										e.preventDefault();
					        			copyUrl(curRightClickedDocListNode);
									}
							},
							{text: _Lang('本地路径'), action: function(e){
									e.preventDefault();
									var localPath = getDocLocalPath(gReposInfo, curRightClickedDocListNode);
									console.log("本地路径 localPath:" + localPath);
									copyString(localPath);
								}
							},
							{text: _Lang('下载链接'), action: function(e){
									e.preventDefault();
									curRightClickedDocListNode.shareId = gShareId;
							  		getDocFileLink(curRightClickedDocListNode, copyString, showErrorMessage, "REST"); //要求获取RESTFUL风格的fileLink
								}
							},
							]
						},
						{divider: true},
						{text: _Lang('刷新'), action: function(e){
									e.preventDefault();
									if(curRightClickedDocListNode !== null)
									{
										refreshDoc(curRightClickedDocListNode, 0);
										curRightClickedDocListNode = null;
					    			}
								}
						},
						{divider: true},
						{text: _Lang('锁定'), action: function(e){
								e.preventDefault();
								lockDoc(curRightClickedDocListNode, 1);
							}
						},
						{text: _Lang('解锁'), action: function(e){
								e.preventDefault();
								unlockDoc(curRightClickedDocListNode, 1);
							}
						},
						{divider: true},
						{text: _Lang('预览'), action: function(e){
								e.preventDefault();
								openDoc(curRightClickedDocListNode, true, "openInArtDialog", "pdf", gShareId);
							}
						},
						{divider: true},
						{text: _Lang('备注'), subMenu: [
									{text: _Lang('查看历史'), action: function(e){
											e.preventDefault();
										    showDocHistory(curRightClickedDocListNode,1);
										}						
									},							
									{text: _Lang('下载'), action: function(e){
											e.preventDefault();
											var treeNodes = [];
											treeNodes.push(curRightClickedDocListNode);
											downloadDoc(treeNodes,true,2);
										}
									},
			   				]
			   			},
			   			{divider: true},
						{text: _Lang('查看备份'), subMenu: [
							{text: _Lang('本地备份'), action: function(e){
									e.preventDefault();
				        			showDocHistory(curRightClickedDocListNode, 2);
				    			}
							},	
							{text: _Lang('异地备份'), action: function(e){
									e.preventDefault();
				        			showDocHistory(curRightClickedDocListNode, 3);
								}
							},
							]
						},
   				]
   			},   			
			{divider: true},
			{text: _Lang('属性'), action: function(e){
					e.preventDefault();
					showDocDetail(curRightClickedDocListNode);
				}
			},
		]);
	}

	//previewZone上的右键菜单
	if(gIsPC == true)
	{
		context.attach('#docPreview', [
			{text: _Lang('下载'), action: function(e){
					e.preventDefault();
					var treeNodes = [];
					treeNodes.push(gDocInfo);
					downloadDoc(treeNodes,true,1);
				}
			},
			{divider: true},
			{text: _Lang('分享'), action: function(e){
						e.preventDefault();
						shareDoc(gDocInfo);
					}
			},
			{divider: true},
			{text: _Lang('删除'), action: function(e){
						e.preventDefault();
						console.log(e);
						var deleteNodes = [];
						deleteNodes.push(gDocInfo);
						DoDelete(deleteNodes);
					}
			},
			{divider: true},		
			{text: _Lang('远程存储'), subMenu: [
				{text: _Lang('推送'),  action: function(e){
						e.preventDefault();
						showRemoteStoragePushPanel(gDocInfo);
					}
				},
				{text: _Lang('拉取'),  action: function(e){
						e.preventDefault();
						showRemoteStoragePullPanel(gDocInfo);
					}
				},
				]
			},
			{divider: true},
			{text: _Lang('文件服务器'), subMenu: [
				{text: _Lang('推送'),  action: function(e){
						e.preventDefault();
						showDocPushPanel(gRootDoc, 1);
					}
				},
				{text: _Lang('拉取'),  action: function(e){
						e.preventDefault();
						showDocPullPanel(gRootDoc, 1);
					}
				},
				]
			},
			{divider: true},
			{text: _Lang('查看历史'), action: function(e){
					e.preventDefault();
					showDocHistory(gDocInfo,0);
				}
			},
			{divider: true},
			{text: _Lang('回收站'), action: function(e){
						e.preventDefault();
						showDocHistory(gDocInfo,4);
					}
			},
			{divider: true},
			{text: _Lang('更多') + '...', subMenu: [
					{text: _Lang('在新窗口打开'), action: function(e){
							e.preventDefault();
							if(gDocInfo != null && gDocInfo.type == 2)
							{
								openDocInNewPage(gDocInfo);
							}
							else
							{
								openDoc(gDocInfo, true, "openInNewPage", "office", gShareId);
							}
						}
					},
					{text: _Lang('本地打开'), action: function(e){
							e.preventDefault();
							openInLocalApp(gDocInfo);
						}
					},
					{divider: true},
					{text: _Lang('设置密码'), action: function(e){
							e.preventDefault();
			        		showDocPwdSetPanel(gDocInfo);
						}
					},
					{divider: true},
					{text: _Lang('复制'), subMenu: [
			           	{text: _Lang('名字'), action: function(e){
									e.preventDefault();
				        			copyDocName(gDocInfo);
								}
						},
						{text: _Lang('路径'), action: function(e){
									e.preventDefault();
				        			copyDocPath(gDocInfo);
								}
						},
						{text: _Lang('链接'), action: function(e){
									e.preventDefault();
				        			copyUrl(gDocInfo);
								}
						},
						{text: _Lang('本地路径'), action: function(e){
								e.preventDefault();
								var localPath = getDocLocalPath(gReposInfo, gDocInfo);
								console.log("本地路径 localPath:" + localPath);
								copyString(localPath);
							}
						},
						{text: _Lang('下载链接'), action: function(e){
								e.preventDefault();
								gDocInfo.shareId = gShareId;
						  		getDocFileLink(gDocInfo, copyString, showErrorMessage, "REST"); //要求获取RESTFUL风格的fileLink
							}
						},
						]
					},
		   			{divider: true},
					{text: _Lang('预览'), action: function(e){
							e.preventDefault();
							openDoc(gDocInfo, true, "openInArtDialog", "pdf", gShareId);
						}
					},
					{divider: true},
					{text: _Lang('备注'), subMenu: [
							{text: _Lang('查看历史'), action: function(e){
									e.preventDefault();
								    showDocHistory(gDocInfo,1);
								}
							},	
							{text: _Lang('下载'), action: function(e){
									e.preventDefault();
									var treeNodes = [];
									treeNodes.push(gDocInfo);
									downloadDoc(treeNodes,true,2);
								}
							},
		   				]
		   			},
					{divider: true},
					{text: _Lang('查看备份'), subMenu: [
						{text: _Lang('本地备份'), action: function(e){
								e.preventDefault();
			        			showDocHistory(gDocInfo, 2);
			    			}
						},	
						{text: _Lang('异地备份'), action: function(e){
								e.preventDefault();
			        			showDocHistory(gDocInfo, 3);
							}
						},
						]
					},
				]
			},
			{divider: true},
			{text: _Lang('属性'), action: function(e){
					e.preventDefault();
					showDocDetail(gDocInfo);
				}
			},			
		]);
	}

	context.settings({compress: true});

	$(document).on('mouseover', '.me-codesta', function(){
		$('.finale h1:first').css({opacity:0});
		$('.finale h1:last').css({opacity:1});
		});

	$(document).on('mouseout', '.me-codesta', function(){
		$('.finale h1:last').css({opacity:0});
		$('.finale h1:first').css({opacity:1});
	});
	//右键菜单实现：contextMenu End
}

function getDocLocalPath(repos, doc)
{
	var reposStorePath = repos.realDocPath;
	if(!reposStorePath || reposStorePath == "")
	{
		reposStorePath = repos.path + repos.id + "/data/rdata/";
	}

	var docPath = "";
	if(doc.path)
	{
    	docPath = doc.path;
	}
	if(doc.name)
	{
		docPath += doc.name;
	}

	return reposStorePath + docPath;
}

function executeDoc(node)
{
	console.log("executeDoc()", node);

	$.ajax({
         url : "/DocSystem/Doc/executeDoc.do",
         type : "post",
         dataType : "json",
         data : {
            reposId : gReposInfo.id,
			path: node.path,
            name : node.name,
            //params: params, //执行参数
            //对于远程的仓库（远程目录/ftp）执行需要远程进行登录后执行
            //protocol: ssh,
            //server: server,
            //port: port,
            //user: user,
         	//pwd: pwd,
         },
         success : function (ret) {
        	console.log("executeDoc ret:", ret);
         	if( "ok" == ret.status){
         		// 普通消息提示条
				bootstrapQ.msg({
							msg : _Lang("执行完成"),
							type : 'success',
							time : 2000,
				});
            }
            else
            {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("执行失败", ":", ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("执行失败", ":", "服务器异常"),
        	});
        }
    });
}

function shareDoc(node){
	if(gShareId)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("当前为分享链接，无法再次分享！"),
    	});
		return;
	}

	var path = node.path;
 	var name = node.name;
 	if(path == null)
 	{
 		path = "";
 	}

 	var reposId = gReposInfo.id;

	$.ajax({
        url : "/DocSystem/Bussiness/addDocShare.do",
        type : "post",
        dataType : "json",
        data : {
        	reposId: reposId,
            path: path,
            name: name,
        	isAdmin : 0,
        	access : 1,
        	downloadEn : 1,
        	addEn : 0,
        	deleteEn : 0,
        	editEn : 0,
        	heritable : 1,
        	shareHours : 7*24, //默认7天
        },
        success : function (ret) {
     		console.log("addDocShare ret:", ret)
     		if(ret.status == "ok")
        	{
     			var docShare = ret.data;
     			var IpAddress = ret.dataEx;
     			var url = docShare.shareLink; //getDocShareLink(reposId,docShare,IpAddress);
     	 		console.log(url);

     	 		showDocSharePanel(docShare, name, url);
        	}
            else
            {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("创建文件分享失败", " : " , ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("创建文件分享失败", " : " , "服务器异常"),
        	});
        }
    });

	event.stopPropagation();
}

function showDocPushPanel(node, type)
{
	console.log("showDocPushPanel type:" + type, node);
	bootstrapQ.dialog({
		id: 'pushDoc',
		url: 'pushDoc' + langExt + '.html',
		title: _Lang('文件推送'),
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
		big: false,
		callback: function(){
			pushDocPageInit(node, type);
		},
	});
}

function showDocPullPanel(node, type)
{
	console.log("showDocPullPanel type:" + type, node);
	bootstrapQ.dialog({
		id: 'pullDoc',
		url: 'pullDoc' + langExt + '.html',
		title: _Lang('文件拉取'),
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
		big: false,
		callback: function(){
			pullDocPageInit(node, type);
		},
	});
}

function showRemoteStoragePushPanel(node)
{
	console.log("showRemoteStoragePushPanel node:", node);
	if(gReposInfo.remoteStorageConfig == undefined)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("该仓库未设置远程存储") + "!",
    	});
		return;
	}

	bootstrapQ.dialog({
		id: 'remoteStoragePush',
		url: 'remoteStoragePush' + langExt + '.html',
		title: _Lang('文件推送'),
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
		big: false,
		callback: function(){
			remoteStoragePushPageInit(node, gReposInfo);
		},
	});
}

function showRemoteStoragePullPanel(node)
{
	console.log("showRemoteStoragePullPanel node:", node);
	if(gReposInfo.remoteStorageConfig == undefined)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("该仓库未设置远程存储" + "!"),
    	});
		return;
	}

	bootstrapQ.dialog({
		id: 'remoteStoragePull',
		url: 'remoteStoragePull' + langExt + '.html',
		title: _Lang('文件拉取'),
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
		big: false,
		callback: function(){
			RemoteStoragePull.remoteStoragePullPageInit(node, gReposInfo);
		},
	});
}


function getTargetServerDispInfo(repos)
{
	var remote = repos.remoteStorageConfig;
	console.log("getTargetServerDispInfo remote:", remote);
	var serverInfo = "";
	switch(remote.protocol)
	{
	case "sftp":
		serverInfo = getTargetServerDispInfoForSftp(remote);
		break;
	case "ftp":
		serverInfo = getTargetServerDispInfoForFtp(remote);
		break;
	case "smb":
		serverInfo = getTargetServerDispInfoForSmb(remote);
		break;
	case "svn":
		serverInfo = getTargetServerDispInfoForSvn(remote);
		break;
	case "git":
		serverInfo = getTargetServerDispInfoForGit(remote);
		break;
	case "mxsdoc":
		serverInfo = getTargetServerDispInfoForMxsDoc(remote);
		break;
	}
	return serverInfo;
}

function getTargetServerDispInfoForSftp(remote)
{
	var sftp = remote.SFTP;
	console.log("getTargetServerDispInfoForSftp sftp:", sftp);
	var url = "sftp://" + sftp.host + ":" + sftp.port + "" + remote.rootPath;
	console.log("getTargetServerDispInfoForSftp sftpUrl:", url);
	return url;
}

function getTargetServerDispInfoForFtp(remote)
{
	var ftp = remote.FTP;
	console.log("getTargetServerDispInfoForFtp ftp:", ftp);
	var url = "ftp://" + ftp.host + ":" + ftp.port + "" + remote.rootPath;
	console.log("getTargetServerDispInfoForFtp ftpUrl:", url);
	return url;
}

function getTargetServerDispInfoForSmb(remote)
{
	var smb = remote.SMB;
	console.log("getTargetServerDispInfoForSmb smb:", smb);
	var url = "smb://" + smb.host + remote.rootPath;
	console.log("getTargetServerDispInfoForSmb smbUrl:", url);
	return url;
}

function getTargetServerDispInfoForSvn(remote)
{
	var svn = remote.SVN;
	console.log("getTargetServerDispInfoForSvn svn:", svn);
	var url = svn.url + remote.rootPath;
	console.log("getTargetServerDispInfoForSvn svnUrl:", url);
	return url;
}

function getTargetServerDispInfoForGit(remote)
{
	var git = remote.GIT;
	console.log("getTargetServerDispInfoForGit git:", git);
	var url = git.url + remote.rootPath;
	console.log("getTargetServerDispInfoForGit gitUrl:", url);
	return url;
}

function getTargetServerDispInfoForMxsDoc(remote)
{
	var mxsdoc = remote.MXSDOC;
	console.log("getTargetServerDispInfoForMxsDoc mxsdoc:", mxsdoc);
	var url = mxsdoc.url;
	if(mxsdoc.reposId)
	{
		url += ";reposId=" + mxsdoc.reposId;
	}
	if(mxsdoc.remoteDirectory)
	{
		url += ";remoteDirectory=" + mxsdoc.remoteDirectory;
	}
	if(remote.rootPath)
	{
		url += ";rootPath=" + remote.rootPath;
	}

	console.log("getTargetServerDispInfoForMxsDoc mxsdocUrl:", url);
	return url;
}

function showDocSharePanel(docShare, docName, url)
{
	console.log("showDocSharePanel docName:" + docName);
	bootstrapQ.dialog({
		id: 'docShare',
		url: 'docShare' + langExt + '.html',
		title: _Lang('文件分享') + " [" + docName + "]",
		msg: _Lang('页面正在加载，请稍侯') + '...',
		foot: false,
		big: false,
		callback: function(){
			DocShare.DocSharePageInit(docShare, docName, url);
		},
	});
}