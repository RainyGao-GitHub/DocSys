var zTree = jQuery.fn.zTree;

$(document).keydown(function(e){
    // ctrl + s
    if( e.ctrlKey  == true && e.keyCode == 83 ){

        return false;
    }
});

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

//目录列表区域拖放功能：预览区和子目录区域需要一起变化
var oDiv=document.getElementById('line');
oDiv.onmousedown=function(ev){
  var disX=ev.clientX-oDiv.offsetLeft;
  var disY=ev.clientY-oDiv.offsetTop;

  document.onmousemove=function(ev){
      var l=ev.clientX-disX;	//计算Line的位置
      oDiv.style.left=l+'px';	//设置Line的位置
 	  $(".manual-left")[0].style.width=ev.clientX+'px';
   	  $(".manual-right")[0].style.left=ev.clientX+'px';
  };
  
  document.onmouseup=function(ev){
  	//$(".manual-left")[0].style.width=ev.clientX+'px';
 	//$(".manual-right")[0].style.left=ev.clientX+'px';
 	document.onmousemove=null;
  	document.onmouseup=null;
  };
};

/******************************** Repos Interfaces***************************************/
//获取仓库信息,callback是成功后的回调函数
var reposType = 1; //默认是普通文件系统
var reposName = "";
function getReposInfo(callback){
	console.log("getReposInfo");
    //set the vid in upload form
	var reposId = getQueryString("vid");
	if(reposId == null)
	{
		//bootstrapQ.alert("请选择仓库！");
		return;
	}
	gReposId = reposId;
	console.log("gReposId:" + gReposId);
	
    $.ajax({
        url : "/DocSystem/Repos/getRepos.do",
        type : "post",
        dataType : "json",
        data : {
            vid:getQueryString("vid")
        },
        success : function (ret) {
            if( "ok" == ret.status ){
                //设置当前选中的仓库名字
                $("#curRepos span:first-child").text(ret.data.name);
                
                //设置仓库信息
                gReposInfo = ret.data;
                reposType = gReposInfo.type;
                reposName = gReposInfo.name;
                $("#projectName").text(gReposInfo.name);
           		
                showDiskSpaceInfo(gReposInfo);
                
                if(reposType == 0)
                {
                	//alert("虚拟文件系统");
                    var keep = {};	//将虚拟文件系统的isParent锁定属性去掉
        			setting.data.keep = keep;
				}
				//回调函数	
                callback && callback();
                //显示编辑按键和增加用户按键
                $("#btnAddReposUser").show();
                $("#btnAddReposGroup").show();
            }else {
                $("#projectName").text(_Lang("项目名"));
                
                $("#editTime").text((new Date()).toLocaleTimeString());
                //隐藏编辑按键和增加用户按键
                $("#btnAddReposUser").hide();
			    $("#btnAddReposGroup").hide();
			    $("#btnSaveAuth").hide();
			    $("#btnCancelSaveAuth").hide();
			    showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("获取仓库信息失败", " : ", ret.msgInfo),
	        	});
            }
        },
        error : function () {
            //隐藏编辑按键和增加用户按键
            $("#btnAddReposUser").hide();
		    $("#btnAddReposGroup").hide();
		    $("#btnSaveAuth").hide();
		    $("#btnCancelSaveAuth").hide();
		    showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("获取仓库信息失败", " : ", "服务器异常"),
        	});
        }
    });
}

function showDiskSpaceInfo(reposInfo)
{
	if(reposInfo.totalSize)
	{
		var totalSpace = parseInt(reposInfo.totalSize / 1024 / 1024 / 1024) + "G";
		var freeSpace = parseInt(reposInfo.freeSize / 1024 / 1024 / 1024) + "G";
		var spaceInfo = _Lang("磁盘空间") + " : " + totalSpace + " / " + freeSpace;
		$("#editTime").text(spaceInfo);
	}
	else
	{
        var time=getDate(reposInfo.createTime);
        $("#editTime").text(time);    		
	}
}

//更新后台的zTree数据: callback是成功后的回调函数
function updateMenu(callback) {
	console.log("updateMenu");
	//get Menu from current zTree (this menu maybe not equals to window.menu)
	var treeObj = zTree.getZTreeObj("doctree");
    if ( !treeObj ){
        alert(_Lang("系统错误") + " : can not find the doctree");
        // 初始化过程中似乎获取不到 tree 对象
        return;
    }
    var nodes = treeObj.getNodes();
    //console.log(nodes);
    var curMenu = [];
    getinfo(nodes);	 
    
	//更新后台的Menu 
    var newMenu = jsonEscape(curMenu); //Convert the array to jason Format
    $.ajax({
         url : "/DocSystem/Repos/updateReposMenu.do",
         type : "post",
         dataType : "json",
         data : {
             vid : getQueryString("vid"),
             menu : newMenu
         },
         success : function (ret) {
             if( "ok" == ret.status ){
                 window.menu = newMenu;	//更新本地menu，但不需要再syncUp了，因为本来就是一样的
                 console.log("更新目录成功");
                 callback && callback();
             }
             else
             {	
            	 showErrorMessage({
 	        		id: "idAlertDialog",	
 	        		title: _Lang("提示"),
 	        		okbtn: _Lang("确定"),
 	        		msg: _Lang("更新目录失败", " : ", ret.msgInfo),
             	}); 
             }
         },
         error : function () {
             syncUpMenu();
             showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
	        	msg: _Lang("更新目录失败", " : ", "服务器异常"),
         	});
         }
     });
     
    //递归获取zTree信息，并放到ret数组中
	function getinfo(nodes){
        if( nodes && nodes.length )
        {
            for(i in nodes)
            {
                var node = nodes[i];
                curMenu.push({
                    "id" : node.id,
                    "name" : node.name,
                    "pId" : node.pId ? node.pId : "root",
                    "isParent": node.isParent,
                });
                getinfo(node.children);
            };
        };
    };	
}

//从后台获取zTree数据: callback是成功后的回调函数，需要后续处理的话加在这里处理
function getMenu(callback) {
	console.log("getMenu");
	$.ajax({
	    url : "/DocSystem/Repos/getReposManagerMenu.do",
	    type : "post",
	    dataType : "json",
	    data : {
	        vid : getQueryString("vid")
	    },
	    success : function (ret) {
	        	if( "ok" == ret.status ){
	        		console.log(ret);
	                callback && callback(ret.data);
	            }
	            else
	           	{
	            	showErrorMessage({
		        		id: "idAlertDialog",	
		        		title: _Lang("提示"),
		        		okbtn: _Lang("确定"),
		        		msg: _Lang("获取仓库目录失败", " : ", ret.MsgInfo),
	            	});
	           	}
	        },
	        error : function () {
	        	showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("获取仓库目录失败", " : ", "服务器异常"),
	        	});
	        }
	    });
}

function backupReposEncryptConfigConfirm(vid)
{	
	console.log("backupReposEncryptConfigConfirm");
	bootstrapQ.confirm({
        title: _Lang("备份密钥"),
        msg: _Lang("是否备份仓库密钥") + "?",
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
    },function () {
    	backupReposEncryptConfig(vid);
    	return true;   
    });
}

function backupReposEncryptConfig(reposId)
{
	console.log("backupReposEncryptConfig() reposId:" + reposId);
	$.ajax({
            url : "/DocSystem/Repos/backupReposEncryptConfig.do",
            type : "post",
            dataType : "json",
            data : {
                reposId : reposId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                    bootstrapQ.msg({
							msg : _Lang('密钥备份成功'),
							type : 'success',
							time : 2000,
					});
                    console.log("backupReposEncryptConfig Ok:",ret);	   		
	            	window.location.href = ret.data;
                }
                else
                {
                    bootstrapQ.msg({
							msg : _Lang('密钥备份失败', ' : ', ret.msgInfo),
							type : 'warning',
							time : 2000,
					});
                }
            },
            error : function () {
                bootstrapQ.msg({
						msg : _Lang('密钥备份失败', ' : ', '服务器异常'),
						type : 'warning',
						time : 2000,
				});
            }
    });
}

function deleteReposConfirm(vid)
{	
	console.log("deleteReposConfirm");
	bootstrapQ.confirm({
        title: _Lang("删除仓库"),
        msg: _Lang("仓库删除后数据将无法恢复，是否删除") + "?",
        okbtn: _Lang("删除"),
        qubtn: _Lang("取消"),
    },function () {
    	deleteRepos(vid);
    	return true;   
    });
}

function deleteRepos(vid)
{
	console.log("deleteRepos() id:" + vid);
	$.ajax({
            url : "/DocSystem/Repos/deleteRepos.do",
            type : "post",
            dataType : "json",
            data : {
                vid : vid,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                    bootstrapQ.msg({
							msg : _Lang('删除成功') + '!',
							type : 'success',
							time : 2000,
					});
					window.location.reload();	//刷新页面
                }
                else
                {
                	 bootstrapQ.msg({
							msg : _Lang('删除失败', ' : ', ret.msgInfo),
							type : 'warning',
							time : 2000,
					});
                	syncUpMenu();	//删除失败，只需要用本地数据刷新整个tree
                }
            },
            error : function () {
               	 bootstrapQ.msg({
						msg : _Lang('删除失败', ' : ', '服务器异常'),
						type : 'warning',
						time : 2000,
				});
            	syncUpMenu();	//删除失败，只需要用本地数据刷新整个tree
            }
    });
}

//Interfaces for Tree Operation

//Get Node by NodeId
function getNodeByNodeId(nodeId)
{
	var zTree = $.fn.zTree.getZTreeObj("doctree");
	var node = zTree.getNodeByParam("id",nodeId);
	return node;
}

//进入权限编辑状态
function editAuth() {
	console.log("editAuth");
	$("#btnAddReposUser").hide();
	$("#btnAddReposGroup").hide();
    $("#btnSaveAuth").show();
    $("#btnCancelSaveAuth").show();
    //使能用户列表的第一个复选框
    //$(".UserEnable").attr("disabled",false);
}

//将权限保存到后台
function saveAuth() {
	console.log("saveAuth");
	$("#btnAddReposUser").show();
	$("#btnAddReposGroup").show();
    $("#btnSaveAuth").hide();
    $("#btnCancelSaveAuth").hide();
    //Disable用户列表的第一个复选框
    $(".UserEnable").attr("disabled",true);
	
	//遍历所有勾选的用户权限
	var docAuths = [];
	$("#reposAuthArea >li").each(function(){
      	var index =$(this).val();  //获取li的索引
      	//alert(index);
      	if($("#DocAuth"+index).prop("checked") == true)
      	{
      		var docAuth = [];
			docAuth.id = $("#DocAuth"+index).val();
			docAuth.userId = $("#User"+index).attr("value"); //a标签没有value,所以需要使用attr来获取值
			docAuth.userName =  $("#User"+index).text();
			docAuth.groupId = $("#Group"+index).attr("value");
			docAuth.groupName =  $("#Group"+index).text();
			docAuth.docId = $("#Doc"+index).attr("value");
			docAuth.isAdmin = $(".IsAdmin"+index).prop("checked")?1:0;
			docAuth.access = $("#Access"+index).prop("checked")?1:0;
			docAuth.editEn = $("#EditEn"+index).prop("checked")?1:0;
			docAuth.addEn = $("#AddEn"+index).prop("checked")?1:0;
			docAuth.deleteEn = $("#DeleteEn"+index).prop("checked")?1:0;
			docAuth.downloadEn = $("#DownloadEn"+index).prop("checked")?1:0;
			var uploadSize = $("#UploadSize"+index).val();
			console.log("saveAuth uploadSize:", uploadSize);
			if(uploadSize ===  "NoLimit")
			{
				uploadSize = "";
			}
			docAuth.uploadSize = uploadSize;				
			docAuth.heritable = $("#Heritable"+index).prop("checked")?1:0;
			console.log(docAuth);
			docAuths.push(docAuth);	//将用户加入到列表中
	    }
	});
	console.log(docAuths);
	
	var vid = getQueryString("vid");
	ConfigUserAuth.configUserAuths(docAuths,vid);
}

function cancelSaveAuth() {
	console.log("cancelSaveAuth");
	$("#btnAddReposUser").show();
	$("#btnAddReposGroup").show();
    $("#btnSaveAuth").hide();
    $("#btnCancelSaveAuth").hide();
    //disable用户列表的第一个复选框
    $(".UserEnable").attr("disabled",true);
    //刷新用户列表
    showAuthList();
}	

/********************** zTree设置与接口**********************************/
var gReposId = null;
var gReposInfo = {};
var curDoc = 0;	
var docVersionIgnore = {};

//zTree初始化接口:根据data和setting生成zTree
function zTreeInit(data) {
    console.log("zTreeInit gReposId:" + gReposId);
    console.log(setting);
    
    //zTree's setting
	var setting = {
		//异步加载的工作原理
		async : {  
    		enable : true,//设置 zTree 是否开启异步加载模式  
            url : "/DocSystem/Repos/getSubDocList.do",
            type : "post",
    		autoParam : ["id","Level","path","name"],	//zTree会自动根据用户双击的节点设置参数为id=treeId，自动传递的参数必须符合zTree的规则，这也是为什么不得不把后台参数名parentId改为id的原因
    		otherParam:{"vid":gReposId}, //这里设置的参数是固定的，如果需要修改的话需要修改配置文件，我就是这么做的，详见getReposInfo函数	
    		dataFilter: asyncDataFilter, 
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
	            onClick: zTreeOnClick,
	            beforeRightClick: zTreeBeforeRightClick,
	    },
	};
    
    var doctree = zTree.init($("#doctree"), setting, data);
    //doctree.expandAll(true); //考虑只自动展开根目录下目录
}

function asyncDataFilter(treeId, parentNode, responseData) {
	console.log("asyncDataFilter");
	var docList = responseData.data;
	//遍历jason_arry, convert the node type to isParent flag
  	for(var i=0; i<docList.length; i++)
  	{
       var jsonObj = docList[i];
       jsonObj.id = jsonObj.docId,
       jsonObj.pId = jsonObj.pid != -1? jsonObj.pid : "root",
       jsonObj.isParent = jsonObj.type == 1? false: true;
       jsonObj.Level = jsonObj.level;
   }
   console.log(docList);
   return docList;
}

//右键点击所在的zTreeNode：用于右键菜单相关的操作:rename, remove, 新建,上传,下载
var curRightClickedTreeNode = null;

//This function was used to get the rightClick treeNode,it will be used for contextjs
function zTreeBeforeRightClick(treeId, treeNode) {
	//alert(treeNode ? treeNode.tId + ", " + treeNode.name : "isRoot");
	curRightClickedTreeNode = treeNode;
	return true;	
};

//为了能够让外部接口能够调用zTree的callback，需要记录当前treeNode等变量
function zTreeOnClick(event, treeId, treeNode) {
    console.log("zTreeOnClick()");
    if ( curDoc != treeNode.id ){
    	curDoc = treeNode.id;
    	showAuthList();
    	getCurDocVersionIgnore();
    }
    //alert(curDoc);
};
  
  //Double Click 对于文件应该是编辑，对于目录应该是打开

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

//获取Node的路径
function getNodePath(treeNode)
{
	var remoteDir = ".../";
	if(treeNode)
	{
		var nodes = treeNode.getPath();	//获取当前节点的所有父节点
		for( var i = 0 ; i < nodes.length ; i++ )
		{
			remoteDir += nodes[i].name + "/"; 
		}
	}
	return remoteDir;
}

//PageInit
function SysInit()
{
	console.log("SysInit");
	//绘制zTree并显示权限列表
	syncUpMenu(showAuthList);	    

	//初始化zTree的右键菜单 
	zTreeContextMenuInit();
}

//将后台Menu,同步回前台
function syncUpMenu(callback)
{
	console.log("syncUpMenu");
    getMenu(function (data) {
        if( window.menu != data ){
        	console.log("同步菜单");
        	drawMenu(data);
        }else{
            console.log("重新绘制菜单，因为当前菜单数据与zTree不一致");
            drawMenu(data);
        }
	    //仓库获取成功后再获取仓库用户列表
		showAuthList();
    });
}


//绘制zTree with the data:强制绘制，判断的东西不应该放在这里
function drawMenu(data) {
	console.log("drawMenu", data);
	window.menu = data;
    //data = JSON.parse('"' + data + '"'); //We need to use JSON parse one more time here  
    //var menu = JSON.parse(data);
    var menu = data;
    //遍历jason_arry
  	for(var i=0; i<menu.length; i++)
  	{
       var jsonObj = menu[i];
       jsonObj.id = jsonObj.docId,
       jsonObj.pId = jsonObj.pid != -1? jsonObj.pid : "root",	//id = 0是rootDoc
       jsonObj.isParent = jsonObj.type == 1? false: true;
       jsonObj.Level = jsonObj.level;
   }
   console.log("menu",menu);
   zTreeInit(menu);
}

//页面加载完成处理函数    
$(document).ready(function(){
	console.log("Page is ready");

	//获取docSys基本配置
	getDocSysConfig();
	
	//getReposList
	showReposSelectList(); //获取当前用户可管理仓库列表		
});

//zTree部分的右键菜单初始化
function zTreeContextMenuInit()
{
	//右键菜单实现：contextMenu Start
	context.init({preventDoubleContext: true});
	
	//zTree上的右键管理菜单
	context.attach('#tree', [
		{text: _Lang('仓库设置'), action: function(e){
				e.preventDefault();
				var treeObj = $.fn.zTree.getZTreeObj("doctree");
				if(curRightClickedTreeNode !== null)
				{
					console.log("仓库设置：" + curRightClickedTreeNode.id);	
					showReposBasicSettingPanel();
				}
			}
		},
		{divider: true},
		{text: _Lang('版本管理'), subMenu: [
			{text: _Lang('关闭版本管理'),  action: function(e){
					e.preventDefault();
					addDocToVersionIgnoreListConfirm(curRightClickedTreeNode);
				}
			},
			{text: _Lang('开启版本管理'),  action: function(e){
					e.preventDefault();
					removeDocFromVersionIgnoreListConfirm(curRightClickedTreeNode);
				}
			},
			{text: _Lang('忽略列表管理'),  action: function(e){
					e.preventDefault();
					showReposVersionIgnoreListManagePanel();
				}
			},
			]
		},
		{text: _Lang('远程存储'), subMenu: [
			{text: _Lang('关闭远程存储'),  action: function(e){
					e.preventDefault();
					addDocToRemoteStorageIgnoreListConfirm(curRightClickedTreeNode);
				}
			},
			{text: _Lang('开启远程存储'),  action: function(e){
					e.preventDefault();
					removeDocFromRemoteStorageIgnoreListConfirm(curRightClickedTreeNode);
				}
			},
			{text: _Lang('忽略列表管理'),  action: function(e){
					e.preventDefault();
					showReposRemoteStorageIgnoreListManagePanel();
				}
			},
			]
		},
		{text: _Lang('全文搜索'), subMenu: [
			{text: _Lang('关闭全文搜索'),  action: function(e){
					e.preventDefault();
					addDocToTextSearchIgnoreListConfirm(curRightClickedTreeNode);
				}
			},
			{text: _Lang('开启全文搜索'),  action: function(e){
					e.preventDefault();
					removeDocFromTextSearchIgnoreListConfirm(curRightClickedTreeNode);
				}
			},
			{text: _Lang('忽略列表管理'),  action: function(e){
					e.preventDefault();
					showReposTextSearchIgnoreListManagePanel();
				}
			},
			]
		},			
		{text: _Lang('自动备份'), subMenu: [
			{text: _Lang('本地备份'), subMenu: [
					{text: _Lang('关闭本地备份'),  action: function(e){
							e.preventDefault();
							addDocToLocalBackupIgnoreListConfirm(curRightClickedTreeNode);
						}
					},
					{text: _Lang('开启本地备份'),  action: function(e){
							e.preventDefault();
							removeDocFromLocalBackupIgnoreListConfirm(curRightClickedTreeNode);
						}
					},
					{text: _Lang('忽略列表管理'),  action: function(e){
							e.preventDefault();
							showReposLocalBackupIgnoreListManagePanel();
						}
					},
					{text: _Lang('立即本地备份'),  action: function(e){
							e.preventDefault();
							reposAutoBackupConfirm(1, 1); 
						}		
					},			
				]
			},
			{text: _Lang('异地备份'), subMenu: [
					{text: _Lang('关闭异地备份'),  action: function(e){
							e.preventDefault();
							addDocToRemoteBackupIgnoreListConfirm(curRightClickedTreeNode);
						}
					},
					{text: _Lang('开启异地备份'),  action: function(e){
							e.preventDefault();
							removeDocFromRemoteBackupIgnoreListConfirm(curRightClickedTreeNode);
						}
					},
					{text: _Lang('忽略列表管理'),  action: function(e){
							e.preventDefault();
							showReposRemoteBackupIgnoreListManagePanel();
						}
					},
					{text: _Lang('立即异地备份'),  action: function(e){
							e.preventDefault();
							reposAutoBackupConfirm(2, 1); 
						}	
					},						
				]					
			},
			]
		},
		{divider: true},
		{text: _Lang('删除仓库'), action: function(e){
					var vid = getQueryString("vid");
					console.log("删除仓库：" + vid);	
					deleteReposConfirm(vid);
				}
		},
		{divider: true},
		{text: _Lang('清除缓存'), action: function(e){
				e.preventDefault();
				//显示清除缓存确认
				clearReposCacheConfirm(curRightClickedTreeNode);
			}
		},
		{divider: true},
		{text: _Lang('强制刷新'), action: function(e){
				e.preventDefault();
				refreshDocConfirm(curRightClickedTreeNode);
			}
		},
		/*{divider: true},
		{text: _Lang('全文搜索'), action: function(e){
					e.preventDefault();
        			showTextSearchSetPanel();
				}
		},*/
		{divider: true},
		{text: _Lang('设置密码'), action: function(e){
					e.preventDefault();
        			showDocPwdSetPanel();
				}
		},
		{divider: true},
		{text: _Lang('备份密钥'), action: function(e){
					var vid = getQueryString("vid");
					console.log("备份仓库密钥：" + vid);	
					backupReposEncryptConfigConfirm(vid);
				}
		},
	]);
	
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

//远程存储
function showReposRemoteStorageIgnoreListManagePanel()
{
   	console.log("showReposRemoteStorageIgnoreListManagePanel()");

if(isRemoteStorageEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未设置远程存储，请联系管理员！"),
	});
	return;
}	

bootstrapQ.dialog({
	id: 'reposRemoteStorageIgnoreManage',
	title: _Lang('远程存储忽略管理'),
	url: 'reposRemoteStorageIgnoreManage' + langExt + '.html',
	msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: true,
		callback: function(){
			RemoteStorageIgnoreMange.init(gReposId);
		},
	}, null);
}

function isRemoteStorageEnabled(reposInfo)
{		
	console.log("isRemoteStorageEnabled reposInfo:", reposInfo);

	if(reposInfo.remoteStorageConfig == null || reposInfo.remoteStorageConfig == undefined)
   	{
		return false;
   	}
	
	return true;
}

function addDocToRemoteStorageIgnoreListConfirm(node)
{
   	console.log("addDocToRemoteStorageIgnoreListConfirm()");

if(isRemoteStorageEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未设置远程存储，请联系管理员！"),
	});
	return;
}	

var msg = _Lang("关闭远程存储") + " [" + node.path + node.name + "]"
if(node.docId == 0)
{
   msg = _Lang("关闭仓库所有文件的远程存储") + "?";
}

qiao.bs.confirm({
    	id: 'addRemoteStorageIgnoreConfirm',
        msg: msg,
        close: false,		
        okbtn: "确定",
        qubtn: "取消",
 	    },function () {
 	    	setRemoteStorageIgnore(node, 1);
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
}

function removeDocFromRemoteStorageIgnoreListConfirm(node)
{
   	console.log("removeDocFromRemoteStorageIgnoreListConfirm()");

if(isRemoteStorageEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未设置远程存储，请联系管理员！"),
	});
	return;
}

var msg = _Lang("开启远程存储") + " [" + node.path + node.name + "]"
if(node.docId == 0)
{
   msg = _Lang("开启仓库所有文件的远程存储") + "?";
}

qiao.bs.confirm({
    	id: 'removeRemoteStorageIgnoreConfirm',
        msg: msg,
        close: false,		
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
 	    },function () {
 	    	setRemoteStorageIgnore(node, 0);
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
}

function setRemoteStorageIgnore(node, ignore)
{
	console.log("setRemoteStorageIgnore()");
$.ajax({
    url : "/DocSystem/Doc/setRemoteStorageIgnore.do",
    type : "post",
    dataType : "json",
    data : {
        reposId : gReposId,
    	path: node.path,
    	name: node.name,
    	ignore: ignore,
    },
    success : function (ret) {
        if( "ok" == ret.status ){
        	// 普通消息提示条
        	docRemoteStorageIgnore[node.docId] = ignore;
        	bootstrapQ.msg({
					msg : _Lang('设置成功') + '!',
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
        		msg: _Lang("设置失败", " : ", ret.msgInfo),
        	});
        }
    },
    error : function () {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang('设置失败', ' : ', '服务器异常'),
    	});
        }
	});
}

//远程自动备份
function showReposRemoteBackupIgnoreListManagePanel()
{
   	console.log("showReposRemoteBackupIgnoreListManagePanel()");

if(isRemoteBackupEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未设置异地备份，请联系管理员！"),
	});
	return;
}	

bootstrapQ.dialog({
	id: 'reposRemoteBackupIgnoreManage',
	title: _Lang('异地备份忽略管理'),
	url: 'reposRemoteBackupIgnoreManage' + langExt + '.html',
	msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: true,
		callback: function(){
			RemoteBackupIgnoreMange.init(gReposId);
		},
	}, null);
}

function isRemoteBackupEnabled(reposInfo)
{		
	console.log("isRemoteBackupEnabled reposInfo:", reposInfo);

	if(reposInfo.autoBackupConfig == null || reposInfo.autoBackupConfig.remoteBackupConfig == undefined)
   	{
		return false;
   	}
	
	return true;
}

function addDocToRemoteBackupIgnoreListConfirm(node)
{
   	console.log("addDocToRemoteBackupIgnoreListConfirm()");

if(isRemoteBackupEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未设置异地备份，请联系管理员！"),
	});
	return;
}	

var msg = _Lang("关闭异地备份") + " [" + node.path + node.name + "]"
if(node.docId == 0)
{
   msg = _Lang("关闭仓库所有文件的异地备份") + "?";
}

qiao.bs.confirm({
    	id: 'addRemoteBackupIgnoreConfirm',
        msg: msg,
        close: false,		
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
 	    },function () {
 	    	setRemoteBackupIgnore(node, 1);
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
}

function removeDocFromRemoteBackupIgnoreListConfirm(node)
{
   	console.log("removeDocFromRemoteBackupIgnoreListConfirm()");

if(isRemoteBackupEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未设置异地备份，请联系管理员！"),
	});
	return;
}	

var msg = _Lang("开启异地备份") + " [" + node.path + node.name + "]"
if(node.docId == 0)
{
   msg = _Lang("开启仓库所有文件的异地备份") + "?";
}

qiao.bs.confirm({
    	id: 'removeRemoteBackupIgnoreConfirm',
        msg: msg,
        close: false,		
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
 	    },function () {
 	    	setRemoteBackupIgnore(node, 0);
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
}

function setRemoteBackupIgnore(node, ignore)
{
	console.log("setRemoteBackupIgnore()");
$.ajax({
    url : "/DocSystem/Doc/setRemoteBackupIgnore.do",
    type : "post",
    dataType : "json",
    data : {
        reposId : gReposId,
    	path: node.path,
    	name: node.name,
    	ignore: ignore,
    },
    success : function (ret) {
        if( "ok" == ret.status ){
        	bootstrapQ.msg({
					msg : _Lang('设置成功') + '!',
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
        		msg: _Lang("设置失败", " : ", ret.msgInfo),
        	});
        }
    },
    error : function () {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang('设置失败', ' : ', '服务器异常'),
    	});
        }
	});
}

function showReposLocalBackupIgnoreListManagePanel()
{
   	console.log("showReposLocalBackupIgnoreListManagePanel()");

if(isLocalBackupEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未设置本地备份，请联系管理员！"),
	});
	return;
}	

bootstrapQ.dialog({
	id: 'reposLocalBackupIgnoreManage',
	title: _Lang('本地备份忽略管理'),
	url: 'reposLocalBackupIgnoreManage' + langExt + '.html',
	msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: true,
		callback: function(){
			LocalBackupIgnoreMange.init(gReposId);
		},
	}, null);
}

function isLocalBackupEnabled(reposInfo)
{		
	console.log("isLocalBackupEnabled reposInfo:", reposInfo);

	if(reposInfo.autoBackupConfig == null || reposInfo.autoBackupConfig.localBackupConfig == undefined)
   	{
		return false;
   	}
	
	return true;
}
function reposAutoBackupConfirm(type, fullBackup)
{
   	console.log("reposAutoBackupConfirm() type:" + type + " fullBackup:" + fullBackup);

var msg = _Lang("是否立即执行仓库自动备份？");
if(type == 1)
{
	if(isLocalBackupEnabled(gReposInfo) == false)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("该仓库未设置本地自动备份，请联系管理员！"),
    	});
		return;
	}
	msg = _Lang("是否立即执行仓库本地自动备份？");
}
else
{
	if(isRemoteBackupEnabled(gReposInfo) == false)
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("该仓库未设置异地自动备份，请联系管理员！"),
    	});
		return;
	}
	msg = _Lang("是否立即执行仓库异地自动备份？");
}


qiao.bs.confirm({
    	id: 'reposAutoBackupConfirm',
        msg: msg,
        close: false,		
        okbtn: _Lang("开始"),
        qubtn: _Lang("取消"),
 	    },function () {
 	    	reposAutoBackup(type, fullBackup);
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
}


function reposAutoBackup(type, fullBackup)
{
	console.log("reposAutoBackup()");
$.ajax({
    url : "/DocSystem/Repos/reposAutoBackup.do",
    type : "post",
    dataType : "json",
    data : {
        reposId : gReposId,
    	type: type,
    	fullBackup: fullBackup,
    },
    success : function (ret) {
	    console.log("reposAutoBackup Ok:",ret);   
    	if( "ok" == ret.status ){
    	    if(ret.msgData == 5)
    	    {
				//下载目录压缩中
				var SubContext = {};
       	        SubContext.reposId = gReposId;
       	        SubContext.type = type;
       	        SubContext.fullBackup = fullBackup;
    	        
       	     showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("仓库备份中，可能需要花费较长时间，您可先关闭当前窗口！"),
         	});
				startReposAutoBackupQueryTask(SubContext, ret.data.id, 2000); //2秒后查询
    	        return;
    	    }

    	    reposAutoBackupSuccessHandler(SubContext, ret);
    	    return;
        }
        else
        {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("备份失败", " : ", ret.msgInfo),
        	});
        }
    },
    error : function () {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang('备份失败', ' : ', '服务器异常'),
    	});
        }
	});
}

function startReposAutoBackupQueryTask(SubContext, reposAutoBackupTaskId, delayTime)
{
	console.log("startReposAutoBackupQueryTask() repos:" + SubContext.reposId + " reposAutoBackupTaskId:" + reposAutoBackupTaskId + " delayTime:" + delayTime);
var nextDelayTime = delayTime; //每次增加5s
if(nextDelayTime < 60000) //最长1分钟
{
	nextDelayTime += 5000;
}

setTimeout(function () {
	console.log("timerForQueryReposAutoBackupTask triggered!");
	doQueryReposAutoBackupTask(SubContext, reposAutoBackupTaskId, nextDelayTime);
},delayTime);	//check it 2s later	
}

function doQueryReposAutoBackupTask(SubContext, reposAutoBackupTaskId, nextDelayTime)
{
	console.log("doQueryReposAutoBackupTask() repos:" + SubContext.reposId + " reposAutoBackupTaskId:" + reposAutoBackupTaskId);

$.ajax({
    url : "/DocSystem/Repos/queryReposAutoBackupTask.do",
    type : "post",
    dataType : "json",
    data : {
        taskId: reposAutoBackupTaskId,
        reposId: SubContext.reposId,
        type: SubContext.type,
        fullBackup: SubContext.fullBackup,
    },
    success : function (ret) {
	   console.log("doQueryReposAutoBackupTask ret:",ret);        
       if( "ok" == ret.status )
       {    
   	        if(ret.msgData == 5)
    	    {
   	        	var task = ret.data;
   	        	var info = task.info;
   	        	startReposAutoBackupQueryTask(SubContext, task.id, nextDelayTime);
   	        	return;
    	    }

   	     reposAutoBackupSuccessHandler(SubContext, ret);
       }
       else	//后台报错
       {
    	   showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("仓库自动备份失败", " : ", ret.msgInfo),
       	});
       }
    },
    error : function () {	//后台异常
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("仓库自动备份失败", " : ", "服务器异常"),
    	});
        }
	});	
}

function reposAutoBackupSuccessHandler(SubContext, ret)
{
	console.log("reposAutoBackupSuccessHandler() " + "仓库 [" + SubContext.reposId +"] 自动备份成功");

//bootstrapQ.msg({
//	msg : '自动备份成功！',
//	type : 'success',
//	time : 2000,
//    });	
if(SubContext.type == 1)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("本地自动备份成功") + "!",
	});
}
else
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("异地自动备份成功") + "!",
	});		
	}
}

function addDocToLocalBackupIgnoreListConfirm(node)
{
   	console.log("addDocToLocalBackupIgnoreListConfirm()");

	if(isLocalBackupEnabled(gReposInfo) == false)
	{
		showErrorMessage({
			id: "idAlertDialog",	
			title: _Lang("提示"),
			okbtn: _Lang("确定"),
			msg: _Lang("该仓库未设置本地备份，请联系管理员！"),
		});
		return;
	}	
	
	var msg = _Lang("关闭本地备份") + " [" + node.path + node.name + "]"
	if(node.docId == 0)
	{
	   msg = _Lang("关闭仓库所有文件的本地备份") + "?";
	}
	
	qiao.bs.confirm({
	    	id: 'addLocalBackupIgnoreConfirm',
	        msg: msg,
	        close: false,		
	        okbtn: _Lang("确定"),
	        qubtn: _Lang("取消"),
	 	    },function () {
	 	    	setLocalBackupIgnore(node, 1);
	 	    	return true;   
	 	    },function(){
	 	    	return true;
	 	    }); 
}

function removeDocFromLocalBackupIgnoreListConfirm(node)
{
   	console.log("removeDocFromLocalBackupIgnoreListConfirm()");

if(isLocalBackupEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未设置本地备份，请联系管理员！"),
	});
	return;
}	

var msg = _Lang("开启本地备份") + " [" + node.path + node.name + "]"
if(node.docId == 0)
{
   msg = _Lang("开启仓库所有文件的本地备份") + "?";
}

qiao.bs.confirm({
    	id: 'removeLocalBackupIgnoreConfirm',
        msg: msg,
        close: false,		
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
 	    },function () {
 	    	setLocalBackupIgnore(node, 0);
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
}

function setLocalBackupIgnore(node, ignore)
{
	console.log("setLocalBackupIgnore()");
$.ajax({
    url : "/DocSystem/Doc/setLocalBackupIgnore.do",
    type : "post",
    dataType : "json",
    data : {
        reposId : gReposId,
    	path: node.path,
    	name: node.name,
    	ignore: ignore,
    },
    success : function (ret) {
        if( "ok" == ret.status ){
        	bootstrapQ.msg({
					msg : _Lang('设置成功') + '!',
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
        		msg: _Lang("设置失败", " : ", ret.msgInfo),
        	});
        }
    },
    error : function () {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang('设置失败', ' : ', '服务器异常'),
    	});
        }
	});
}

function showReposTextSearchIgnoreListManagePanel()
{
   	console.log("showReposTextSearchIgnoreListManagePanel()");

if(isTextSearchEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未开启全文搜索，请联系管理员！"),
	});
	return;
}	

bootstrapQ.dialog({
	id: 'reposTextSearchIgnoreManage',
	title: _Lang('全文搜索忽略管理'),
	url: 'reposTextSearchIgnoreManage' + langExt + '.html',
	msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: true,
		callback: function(){
			TextSearchIgnoreMange.init(gReposId);
		},
	}, null);
}

function isTextSearchEnabled(reposInfo)
{		
	console.log("isTextSearchEnabled reposInfo:", reposInfo);

	if(reposInfo.textSearchConfig == undefined)
   	{
		return false;
   	}
	
	var enable = reposInfo.textSearchConfig.enable;
	if(enable == undefined || enable == false)
	{
		return false;
	}

	return true;
}

function addDocToTextSearchIgnoreListConfirm(node)
{
   	console.log("addDocToTextSearchIgnoreListConfirm()");

if(isTextSearchEnabled(gReposInfo) == false)
{
	showErrorMessage({
		id: "idAlertDialog",	
		title: _Lang("提示"),
		okbtn: _Lang("确定"),
		msg: _Lang("该仓库未开启全文搜索，请联系管理员！"),
	});
	return;
}	

	var msg = _Lang("关闭全文搜索") + " [" + node.path + node.name + "]";
	if(node.docId == 0)
	{
	   msg = _Lang("关闭仓库所有文件的全文搜索") + "?";
	}
	
	qiao.bs.confirm({
	    	id: 'addTextSearchIgnoreConfirm',
	        msg: msg,
	        close: false,		
	        okbtn: _Lang("确定"),
	        qubtn: _Lang("取消"),
	 	    },function () {
	 	    	setTextSearchIgnore(node, 1);
	 	    	return true;   
	 	    },function(){
	 	    	return true;
	 	    }); 
}

function removeDocFromTextSearchIgnoreListConfirm(node)
{
   	console.log("removeDocFromTextSearchIgnoreListConfirm()");

	if(isTextSearchEnabled(gReposInfo) == false)
	{
		showErrorMessage({
			id: "idAlertDialog",	
			title: _Lang("提示"),
			okbtn: _Lang("确定"),
			msg: _Lang("该仓库未开启全文搜索，请联系管理员！"),
		});
		return;
	}	

	var msg = _Lang("开启全文搜索") + " [" + node.path + node.name + "]"
	if(node.docId == 0)
	{
	   msg = _Lang("开启仓库所有文件的全文搜索") + "?";
	}
	
	qiao.bs.confirm({
	    	id: 'removeTextSearchIgnoreConfirm',
	        msg: msg,
	        close: false,		
	        okbtn: _Lang("确定"),
	        qubtn: _Lang("取消"),
	 	    },function () {
	 	    	setTextSearchIgnore(node, 0);
	 	    	return true;   
	 	    },function(){
	 	    	return true;
	 	    }); 
}

function setTextSearchIgnore(node, ignore)
{
	console.log("setTextSearchIgnore()");
$.ajax({
    url : "/DocSystem/Doc/setTextSearchIgnore.do",
    type : "post",
    dataType : "json",
    data : {
        reposId : gReposId,
    	path: node.path,
    	name: node.name,
    	ignore: ignore,
    },
    success : function (ret) {
        if( "ok" == ret.status ){
        	bootstrapQ.msg({
					msg : _Lang('设置成功') + '！',
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
        		msg: _Lang("设置失败", " : ", ret.msgInfo),
        	});
        }
    },
    error : function () {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang('设置失败', ' : ', '服务器异常！'),
    	});
        }
	});
}

function showReposVersionIgnoreListManagePanel()
{
   	console.log("showReposVersionIgnoreListManagePanel()");

//if(gReposInfo.verCtrl == undefined || gReposInfo.verCtrl == 0)
//{
//	showErrorMessage("该仓库未开通版本管理，请联系管理员！");
//	return;
//}

bootstrapQ.dialog({
	id: 'reposVersionIgnoreManage',
	title: _Lang('版本忽略管理'),
	url: 'reposVersionIgnoreManage' + langExt + '.html',
	msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: true,
		callback: function(){
			VersionIgnoreMange.init(gReposId);
		},
	}, null);
}


function addDocToVersionIgnoreListConfirm(node)
{
   	console.log("addDocToVersionIgnoreListConfirm()");

//if(gReposInfo.verCtrl == undefined || gReposInfo.verCtrl == 0)
//{
//	showErrorMessage("该仓库未开通版本管理，请联系管理员！");
//	return;
//}

var msg = _Lang("关闭历史版本管理") + " [" + node.path + node.name + "]"
if(node.docId == 0)
{
   msg = _Lang("关闭仓库所有文件的历史版本管理") + "?";
}

qiao.bs.confirm({
    	id: 'addVersionIgnoreConfirm',
        msg: msg,
        close: false,		
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
 	    },function () {
 	    	setVersionIgnore(node, 1);
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
}

function removeDocFromVersionIgnoreListConfirm(node)
{
   	console.log("removeDocFromVersionIgnoreListConfirm()");

	//if(gReposInfo.verCtrl == undefined || gReposInfo.verCtrl == 0)
	//{
	//	showErrorMessage("该仓库未开通版本管理，请联系管理员！");
	//	return;
	//}

   	var msg = _Lang("开启历史版本管理") + " [" + node.path + node.name + "]";
	if(node.docId == 0)
	{
	   msg = _Lang("开启仓库所有文件的历史版本管理") + "?";
	}
	
	qiao.bs.confirm({
    	id: 'removeVersionIgnoreConfirm',
        msg: msg,
        close: false,		
        okbtn: _Lang("确定"),
        qubtn: _Lang("取消"),
 	    },function () {
 	    	setVersionIgnore(node, 0);
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
}

function setVersionIgnore(node, ignore)
{
	console.log("setVersionIgnore()");
$.ajax({
    url : "/DocSystem/Doc/setVersionIgnore.do",
    type : "post",
    dataType : "json",
    data : {
        reposId : gReposId,
    	path: node.path,
    	name: node.name,
    	ignore: ignore,
    },
    success : function (ret) {
        if( "ok" == ret.status ){
        	// 普通消息提示条
        	docVersionIgnore[node.docId] = ignore;
        	bootstrapQ.msg({
					msg : _Lang('设置成功') + '!',
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
        		msg: _Lang("设置失败", " : ", ret.msgInfo),
        	});
        }
    },
    error : function () {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang('设置失败', ' : ', '服务器异常'),
    	});
        }
	});
}

function clearReposCacheConfirm(node)
{
   	console.log("clearReposCacheConfirm()");
	qiao.bs.confirm({
    	id: 'clearReposCacheConfirm',
        msg: _Lang("是否清除仓库缓存") + "?",
        close: false,		
        okbtn: _Lang("清除"),
        qubtn: _Lang("取消"),
    },function () {
    	//alert("点击了确定");
    	clearReposCache(node);
    	return true;   
    },function(){
    	//alert("点击了取消");
 	    	return true;
 	    }); 
}


function clearReposCache(node)
{
	console.log("clearReposCache()");
$.ajax({
    url : "/DocSystem/Repos/clearReposCache.do",
    type : "post",
    dataType : "json",
    data : {
        reposId : gReposId,
    	path: node.path,
    	name: node.name,
    },
    success : function (ret) {
        if( "ok" == ret.status ){
        	// 普通消息提示条
			bootstrapQ.msg({
					msg : _Lang('清除成功') + '!',
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
        		msg: _Lang("清除失败", " : ", ret.msgInfo),
        	});
        }
    },
    error : function () {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang('清除失败', ' : ', '服务器异常'),
    	});
        }
});
}

//显示curDoc对应的用户权限列表
function getCurDocVersionIgnore()
{
	console.log("getCurDocVersionIgnore()");
	var docId = curDoc;
	console.log("docId:" + docId);
	
	var parentPath = "";
	var docName = "";
	var node = getNodeByNodeId(docId);
	if(node && node != null)
	{
		parentPath = node.path;
		docName = node.name;
	}
	console.log("docId:" + docId + " parentPath:" +  parentPath + " docName:" + docName);
	var vid = getQueryString("vid");
	
	$.ajax({
            url : "/DocSystem/Doc/getVersionIgnore.do",
            type : "post",
            dataType : "json",
            data : {
                reposId : vid,
            	docId: docId,
            	path: parentPath,
            	name: docName,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                	docVersionIgnore[docId] = ret.data;
                }
                else
                {
                	showErrorMessage({
    	        		id: "idAlertDialog",	
    	        		title: _Lang("提示"),
    	        		okbtn: _Lang("确定"),
    	        		msg: _Lang('获取文件版本管理设置失败', ' : ', ret.msgInfo),
                	});
                }
            },
            error : function () {
            	showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang('获取文件版本管理设置失败', ' : ', '服务器异常'),
            	});
                }
    });
}

//显示curDoc对应的用户权限列表
function showAuthList()
{
	console.log("showAuthList()");
var docId = curDoc;
console.log("docId:" + docId);
	showDocAuthList();
}

function showDocAuthList(){
   	console.log("showDocAuthList()");
	var docId = curDoc;
	var parentPath = "";
	var docName = "";
	var node = getNodeByNodeId(docId);
	if(node && node != null)
	{
		parentPath = node.path;
		docName = node.name;
	}
	console.log("docId:" + docId + " parentPath:" +  parentPath + " docName:" + docName);
	
	var vid = getQueryString("vid");
	
	$.ajax({
            url : "/DocSystem/Repos/getDocAuthList.do",
            type : "post",
            dataType : "json",
            data : {
                reposId : vid,
            	docId: docId,
            	path: parentPath,
            	name: docName,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                    //显示编辑按键和增加用户按键
                    $("#btnAddReposUser").show();
			    	$("#btnAddReposGroup").show();
			        $("#btnSaveAuth").hide();
			        $("#btnCancelSaveAuth").hide();
                	showUserList(ret.data);
                }
                else
                {
                    //隐藏编辑按键和增加用户按键
                    $("#btnAddReposUser").hide();
			    	$("#btnAddReposGroup").hide();
			        $("#btnSaveAuth").hide();
			        $("#btnCancelSaveAuth").hide();
			        showErrorMessage({
		        		id: "idAlertDialog",	
		        		title: _Lang("提示"),
		        		okbtn: _Lang("确定"),
		        		msg: _Lang("获取仓库用户列表失败", " : ", ret.msgInfo),
		        	});
                }
            },
            error : function () {
                //隐藏编辑按键和增加用户按键
                $("#btnAddReposUser").hide();
		    	$("#btnAddReposGroup").hide();
		        $("#btnSaveAuth").hide();
		        $("#btnCancelSaveAuth").hide();
		        showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("获取仓库用户列表失败", " : ", "服务器异常"),
	        	});
            }
});


//根据获取到的目录权限用户列表数据，绘制列表
function showUserList(data){
	console.log("showUserList");
	console.log(data);
	
	var c = $("#reposAuthArea").children();
	$(c).remove();
	if(data.length==0)
	{
		$("#reposAuthArea").append("<p>暂无数据</p>");
	}
	
	var vid = getQueryString("vid");
	
	for(var i=0;i<data.length;i++){
		var d = data[i];
		var adminChecked = d.isAdmin == 1? "checked":"";
		var readChecked = d.access == 1? "checked":"";
		var editChecked = d.editEn == 1? "checked":"";
		var addChecked = d.addEn == 1? "checked":"";
		var deleteChecked = d.deleteEn == 1? "checked":"";
		var downloadChecked = d.downloadEn == 1? "checked":"";
		var uploadSizeSelected = getUploadSizeSelected(uploadSizeSelected, d.uploadSize);
		var heritableChecked = d.heritable == 1? "checked":"";
		//var selectAllChecked = d.selectAll == 1? "checked":"";
		var selectAllChecked = "";
		
		var opBtn = "";
		var docAuthId = "";
		if(d.id > 0) //docAuthId > 0 表示这不是继承的权限
		{
			docAuthId = d.id;
			//opBtn = "<a href='javascript:void(0)' onclick='deleteDocAuthConfirm("+docAuthId+");' class='mybtn-primary'>删除</a>";
			//var opBtn = "<a href='javascript:void(0)' onclick='configDocAuth("+docAuthId+");' class='mybtn'>设置</a>";
		}
		
		var userId = "";
		if(d.userId >= 0)
		{
			userId = d.userId;
			opBtn = "<a href='javascript:void(0)' class='mybtn-primary' onclick='deleteUserReposAuthConfirm("+d.reposAuthId+ "," +userId+");'>删除</a>";
		}
		var groupId = "";
		if(d.groupId > 0)
		{
			groupId = d.groupId;
			opBtn = "<a href='javascript:void(0)' class='mybtn-primary' onclick='deleteGroupReposAuthConfirm("+d.reposAuthId+ "," +groupId+");'>删除</a>";				
		}
		var se = "<li value="+ i +">"
			+"	<i class='cell select w5'>"
			+"		<input class='DocAuthEnable' id='DocAuth"+i+"' value='"+docAuthId+"' type='checkbox' onclick='editAuth()'/>"
			+"	</i> "
			+"	<i class='cell username w10'>"
			+"		<span class='name'>"
			+"			<a id='User"+i+"' value='"+userId+"' href='javascript:void(0)'>"+d.userName+"</a>"
			+"		</span>"
			+"	</i>"
			+"	<i class='cell groupname w10'>"
			+"		<span class='name'>"
			+"			<a id='Group"+i+"' value='"+groupId+"' href='javascript:void(0)'>"+d.groupName+"</a>"
			+"		</span>"
			+"	</i>"
			+"	<i class='cell docpath w15'>"
			+"		<span class='name'>"
			+"			<a id='Doc"+i+"' value='"+d.docId+"' href='javascript:void(0)'>"+ "/" + d.docPath+d.docName+"</a>"
//				+"			<a id='Doc"+i+"' value='"+d.docId+"' href='javascript:void(0)'>"+reposName+"::"+d.docPath+d.docName+"</a>"
			+"		</span>"
			+"	</i>"
			+"	<i class='cell access w6'>"
			+"		<input class='IsAdmin"+i+"' value='"+ d.isAdmin+"' type='checkbox' " + adminChecked + " onchange='EnableUserConfig("+i+");'>管理员</input>"
			+"	</i>"
			+"	<i class='cell  read w5'>"
			+"		<input id='Access"+i+"' value='"+ d.access+"' type='checkbox' " + readChecked + " onchange='EnableUserConfig("+i+");'>读</input>"
			+"	</i>"
			+"	<i class='cell edit w5'>"
			+"		<input id='EditEn"+i+"' value='"+ d.editEn+"' type='checkbox' " + editChecked + " onchange='EnableUserConfig("+i+");'>写</input>"
			+"	</i>"
			+"	<i class='cell add w6'>"
			+"		<input id='AddEn"+i+"'  value='"+ d.addEn+"' type='checkbox' " + addChecked + " onchange='EnableUserConfig("+i+");'>增加</input>"
			+"	</i>"
			+"	<i class='cell delete w6'>"
			+"		<input id='DeleteEn"+i+"' value='"+ d.deleteEn+"' type='checkbox' " + deleteChecked + " onchange='EnableUserConfig("+i+");'>删除</input>"
			+"	</i>"
			+"	<i class='cell download w8'>"
			+"		<input id='DownloadEn"+i+"' value='"+ d.downloadEn+"' type='checkbox' " + downloadChecked + " onchange='EnableUserConfig("+i+");'>下载/分享</input>"
			+"	</i>"
			+"	<i class='cell uploadSize w8'>"
			+"      <select class='form-control' id='UploadSize" + i +"' style='width:90%' onchange='EnableUserConfig("+i+");'>"
            +"			<option value='10485760' "  + uploadSizeSelected["10485760"] + ">10M</option>"
            +"			<option value='20971520' "  + uploadSizeSelected["20971520"] + ">20M</option>"
            +"			<option value='52428800' "   + uploadSizeSelected["52428800"] + ">50M</option>"
            +"			<option value='104857600' "  + uploadSizeSelected["104857600"] + ">100M</option>"
            +"			<option value='209715200' "  + uploadSizeSelected["209715200"] + ">200M</option>"
            +"			<option value='524288000' "  + uploadSizeSelected["524288000"] + ">500M</option>"
            +"			<option value='1073741824' " + uploadSizeSelected["1073741824"] + ">1G</option>"
            +"			<option value='2147483648' " + uploadSizeSelected["2147483648"] + ">2G</option>"
            +"			<option value='4294967296' " + uploadSizeSelected["4294967296"] + ">4G</option>"
            +"			<option value='NoLimit' " + uploadSizeSelected["NoLimit"] + ">不限</option>"
          	+"		</select>"
			+"	</i>"
			+"	<i class='cell heritable w6'>"
			+"		<input id='Heritable"+i+"' value='"+ d.heritable+"' type='checkbox' " + heritableChecked + " onchange='EnableUserConfig("+i+");'>可继承</input>"
			+"	</i>"
			+"	<i class='cell selectAll w6'>"
			+"		<input id='SelectAll"+i+"' value='"+ d.selectAll+"' type='checkbox' " + selectAllChecked + " onclick='selectAllAuth(" +i+")' onchange='EnableUserConfig("+i+");'>全部</input>"
			+"	</i>"
			+"	<i class='cell operation w10'>"
			+ 		opBtn
			+"	</i>"
			+"</li>";
		
		$("#reposAuthArea").append(se);
	}
}

function getUploadSizeSelected(uploadSizeSelected, uploadSize)
{
	var uploadSizeSelected = {};
    uploadSizeSelected["10485760"] ="";
    uploadSizeSelected["20971520"] ="";
    uploadSizeSelected["52428800"] ="";
    uploadSizeSelected["104857600"] ="";
    uploadSizeSelected["209715200"] ="";
    uploadSizeSelected["524288000"] ="";
    uploadSizeSelected["1073741824"] ="";
    uploadSizeSelected["2147483648"] ="";
    uploadSizeSelected["4294967296"] ="";
    uploadSizeSelected["NoLimit"] ="";

	var uploadSize = uploadSize == undefined? "NoLimit" : uploadSize;
	if(uploadSizeSelected["" + uploadSize] == undefined)
	{
        uploadSizeSelected["NoLimit"] = " selected='selected' ";
	}
	else
	{
    	uploadSizeSelected[""+uploadSize] = " selected='selected' ";
	}
    console.log("uploadSizeSelected", uploadSizeSelected);
        return uploadSizeSelected;
	}
}


function deleteGroupReposAuthConfirm(reposAuthId,groupId)
{
		qiao.bs.confirm({
 	    	id: 'deleteGroupReposAuthConfirm',
        msg: "是否删除该用户组的仓库权限?",
        close: false,		
        okbtn: "删除",
        qubtn: "取消",
    },function () {
    	
    	//alert("点击了确定");
    	deleteGroupReposAuth(reposAuthId,groupId);
    	return true;   
    },function(){
    	//alert("点击了取消");
 	    	return true;
 	    }); 
}

function deleteGroupReposAuth(reposAuthId,groupId)
{	
   	console.log("deleteGroupReposAuth()");

var vid = getQueryString("vid");
$.ajax({
        url : "/DocSystem/Repos/deleteReposAuth.do",
        type : "post",
        dataType : "json",
        data : {
            reposAuthId: reposAuthId,
            groupId: groupId,
            reposId: vid,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
                showAuthList();
            }
            else
            {
            	showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("删除用户组的仓库权限失败：" + ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang('删除用户组的仓库权限失败：服务器异常'),
        	});
            }
    });
}

function deleteUserReposAuthConfirm(reposAuthId,userId)
{
		qiao.bs.confirm({
 	    	id: 'deleteUserReposAuthConfirm',
        msg: "是否删除该用户的仓库权限?",
        close: false,		
        okbtn: "删除",
        qubtn: "取消",
    },function () {
    	
    	//alert("点击了确定");
    	deleteUserReposAuth(reposAuthId,userId);
    	return true;   
    },function(){
    	//alert("点击了取消");
 	    	return true;
 	    }); 
}

function deleteUserReposAuth(reposAuthId,userId)
{	
   	console.log("deleteUserReposAuth()");

var vid = getQueryString("vid");
$.ajax({
        url : "/DocSystem/Repos/deleteReposAuth.do",
        type : "post",
        dataType : "json",
        data : {
            reposAuthId: reposAuthId,
            userId: userId,
            reposId: vid,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
                showAuthList();
            }
            else
            {
            	showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("删除用户的仓库权限失败:" + ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang('删除用户的仓库权限失败：服务器异常！'),
        	});
            }
    });
}

function EnableUserConfig(index){
	//alert(index);
//alert($("#User"+index).prop("checked"));
editAuth();
if($("#DocAuth"+index).prop("checked") == false)
{
	$("#DocAuth"+index).prop("checked",true);
    //$("#UploadSize"+index).attr("disabled",false);
	}
}

function selectAllAuth(index)
{
	if($("#SelectAll"+index).prop("checked") == true)
{
	//SelectAll
	$(".IsAdmin"+index).prop("checked",true);
	$("#Access"+index).prop("checked",true);
	$("#EditEn"+index).prop("checked",true);
	$("#AddEn"+index).prop("checked",true);
	$("#DeleteEn"+index).prop("checked",true);
	$("#DownloadEn"+index).prop("checked",true);
	$("#Heritable"+index).prop("checked",true);
    //$("#UploadSize"+index).attr("disabled",false);
}
else
{
	//UnselectAll
	$(".IsAdmin"+index).prop("checked",false);
	$("#Access"+index).prop("checked",false);
	$("#EditEn"+index).prop("checked",false);
	$("#AddEn"+index).prop("checked",false);
	$("#DeleteEn"+index).prop("checked",false);
	$("#DownloadEn"+index).prop("checked",false);
	$("#Heritable"+index).prop("checked",false);
    //$("#UploadSize"+index).attr("disabled",false);
	}
}


function deleteDocAuthConfirm(docAuthId)
{
   	console.log("deleteDocAuthAuthConfirm()");
	qiao.bs.confirm({
    	id: 'deleteDocAuthConfirm',
        msg: "是否删除该用户的目录权限设置?",
        close: false,		
        okbtn: "删除",
        qubtn: "取消",
    },function () {
    	//alert("点击了确定");
    	deleteDocAuth(docAuthId);
    	return true;   
    },function(){
    	//alert("点击了取消");
 	    	return true;
 	    }); 
}

function deleteDocAuth(docAuthId)
{	
   	console.log("deleteDocAuth()");

var vid = getQueryString("vid");
$.ajax({
        url : "/DocSystem/Repos/deleteDocAuth.do",
        type : "post",
        dataType : "json",
        data : {
            docAuthId: docAuthId,
            //userId: userId,
            //docId: docId,
            reposId: vid,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
                showAuthList();
            }
            else
            {
            	showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang("删除用户的目录权限设置失败: " + ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang('删除用户的目录权限设置失败: 服务器异常！'),
        	});
            }
    });
}

//获取系统默认配置信息
var gDocSysConfig = null;
function getDocSysConfig()
{
	console.log("getDocSysConfig");
$.ajax({
    url : "/DocSystem/Repos/getDocSysConfig.do",
    type :"post",
    dataType :"json",
    data : null,
    success : function (ret) {
        if(ret.status == "ok")
        {
        	gDocSysConfig = ret.data;
        	console.log("getDocSysConfig config:", gDocSysConfig);
        }
        else
        {
        	console.log(ret.msgInfo);
        }
    },
    error : function () {
    	console.log('获取DocSysConfig失败: 服务器异常');
        }
    });
}

function showReposSelectList(callback)
{
   	console.log("showReposSelectList()");

$.ajax({
           	url : "/DocSystem/Repos/getManagerReposList.do",
            type : "post",
            dataType : "json",
            data : null,
            success : function (ret) {
                if( "ok" == ret.status ){
                    showReposList(ret.data);
                    
					//获取仓库信息
					getReposInfo(SysInit);
                }
                else
                {
                	showErrorMessage({
    	        		id: "idAlertDialog",	
    	        		title: _Lang("提示"),
    	        		okbtn: _Lang("确定"),
    	        		msg: _Lang("获取仓库列表失败:" + ret.msgInfo),
                	});
                }
            },
            error : function () {
            	showErrorMessage({
	        		id: "idAlertDialog",	
	        		title: _Lang("提示"),
	        		okbtn: _Lang("确定"),
	        		msg: _Lang('获取仓库列表失败:服务器异常'),
            	});
            }
});
    
//根据获取到的仓库列表数据，绘制列表
function showReposList(data){
	console.log(data);
	var c = $("#reposList").children();
	$(c).remove();
	if(data.length==0){
		$("#reposList").append("<p>暂无数据</p>");
	}
	
	for(var i=0;i<data.length;i++){
		var d = data[i];
		//alert(d.id);				
		var se = "<li>"
			+ "		<a href='/DocSystem/web/reposManager" + langExt + ".html?vid=" + d.id + "'>" + d.name +"</a>"
			+ "	  </li>";
		
		$("#reposList").append(se);
		}
	}	    
}

function showAddReposUserPanel(){
	console.log("showAddReposUserPanel");
bootstrapQ.dialog({
	id: 'addReposUser',
	title: '添加访问用户',
	url: 'addReposUser' + langExt + '.html',
	msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
	}, null);
}

function showAddReposGroupPanel(){
	console.log("showAddReposGroupPanel");
bootstrapQ.dialog({
	id: 'addReposGroup',
	title: '添加访问组',
	url: 'addReposGroup' + langExt + '.html',
	msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
	}, null);
}


function callbackForEditReposSuccess()
{
	//getReposInfo();	
showReposSelectList();
MyJquery.closeBootstrapDialog("editRepos");
}

function showReposBasicSettingPanel(){
	console.log("showReposBasicSettingPanel");
bootstrapQ.dialog({
	id: 'editRepos',
	title: '仓库设置',
	url: 'reposBasicSetting' + langExt + '.html',
	msg: '页面正在加载，请稍等...',
	foot: false,
	big: true,
	callback: function(){
	    console.log("editRepos.html loaded callback");
		    ReposConfig.editReposPageInit(gReposId, gReposInfo, callbackForEditReposSuccess);
		}		
	}, null);
}

function showReposSettingPanel(){
	console.log("showReposSettingPanel");
bootstrapQ.dialog({
	id: 'reposAdvancedSetting',
	title: '高级设置',
	url: 'reposAdvancedSetting' + langExt + '.html',
	msg: '页面正在加载，请稍等...',
		foot: false,
		big: true,
	}, null);
}

function showDocPwdSetPanel()
{
	console.log("showDocPwdSetPanel");
bootstrapQ.dialog({
	id: 'docPwdSet',
	url: 'docPwdSet' + langExt + '.html',
	title: '密码设置',
	msg: '页面正在加载，请稍等...',
	foot: false,
	big: true,
	//okbtn: "确定",
		callback: function(){
			DocPwdSetPageInit(gReposId, curRightClickedTreeNode);
		}, 
	}, null);
}

function showTextSearchSetPanel()
{
	console.log("showTextSearchSetPanel");
bootstrapQ.dialog({
	id: 'reposTextSearchSetting',
	url: 'reposTextSearchSetting' + langExt + '.html',
	title: '全文搜索:' + curRightClickedTreeNode.name,
	msg: '页面正在加载，请稍等...',
	foot: false,
	big: true,
	//okbtn: "确定",
		callback: function(){
			reposTextSearchSetPageInit(gReposId, curRightClickedTreeNode);
		}, 
	}, null);
}

function refreshDocConfirm(node)
{
   	console.log("refreshDocConfirm()");
var msg = "强制刷新 [" + node.path + node.name + "]？"
if(node.docId == 0)
{
   msg = "强制刷新整个仓库?";
}

qiao.bs.confirm({
    	id: 'refreshDocConfirm',
        msg: msg,
        close: false,		
        okbtn: "确定",
        qubtn: "取消",
    },function () {
    	refreshDoc(node, 1);	//强制刷新
 	    	return true;   
 	    },function(){
 	    	return true;
 	    }); 
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
    	reposId: gReposId,
        docId : docId,
        pid	: pid,
        type: type,
        level: level,
        path: parentPath,
        name: docName,
        force: force,
    },
    success : function (ret) {
        if( "ok" == ret.status ){
        	console.log("refresh ok:", ret.data);
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
        		msg: _Lang("刷新失败:" + ret.msgInfo),
        	});
        }
    },
    error : function () {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("刷新失败:服务器异常！"),
    	});
        }
	});
}
	

	//ConfigUserAuth类
var ConfigUserAuth = (function () {
    //当前操作的索引
    var index = 0;
    var docAuthList = null; //id(docAuthId),userId,groupId,docId,isAdmin, access, editEn, addEn, deleteEn
    var totalNum = 0;
    var failNum =0;
    var successNum = 0;
    var vid = 0;
    var configErrorConfirmSet = 0;
    //Context Cache
    var indexCache = [];
    var docAuthListCache =[];
    var totalNumCache = [];
    var vidCache = [];
    
    //标准Java成员操作接口
	function getIndex()
	{
        return index;
	}
	
	function setIndex(i)
	{
		index = i;
	}
	
	function getDocAutList()
	{
        return docAuthList;
	}
	
	function setDocAuthList(docAuths)
	{
		docAuthList = docAuths;
	}
	
	function getTotalNum()
	{
        return totalNum;
	}
	
	function setTotalNum(num)
	{
		totalNum = num;
	}
	
	function getVid()
	{
        return vid;
	}
	
	function setVid(id)
	{
		vid = id;
	}
			
	//上下文操作接口
	function pushContext()
	{
		indexCache.push(index);
		docAuthListCache.push(docAuthList);
		totalNumCache.push(totalNum);
		vidCache.push(vid);	
	}
	function popContext()
	{
		index = indexCache.pop();
		docAuthList = docAuthListCache.pop();
		totalNum = totalNumCache.pop();
		vid = vidCache.pop();
	}
	
	function clearContext()	//清空上下文，出错时需要清空，避免下次进来是被pop out来执行
	{
		indexCache = [];
        docAuthListCache =[];
        totalNumCache = [];
        vidCache = [];
	}
	
	function ContextSize()
	{
		return indexCache.length;
	}
  	
  	//初始化ConfigUserAuth设置
  	function ConfigUserAuthSet(docAuths,vid)	//多用户设置函数
	{
		console.log("ConfigUserAuthSet");

		setIndex(0);

		setDocAuthList(docAuths);
		
		var totalNum = 0;
		if(docAuthList && docAuthList.length)
		{
			totalNum = docAuthList.length;
		}
		setTotalNum(totalNum);
		failNum = 0;
		successNum = 0;
		configErrorConfirmSet = 0;
		
		setVid(vid);			
  	}
  		
	//ConfigUserAuth接口，该接口是个递归调用
	function configUserAuth()
	{
		console.log("configUserAuth index:" + index + " totalNum:" + totalNum);

		//set docAuth
		var docAuth = docAuthList[index];
		console.log(docAuth);
		
		var node = getNodeByNodeId(docAuth.docId);
		var parentPath = "";
		var docName = "";
		if(node && node != null && node.id != 0)
		{
			parentPath = node.path;
			docName = node.name;
		}
		   		
		$.ajax({
			  url : "/DocSystem/Repos/configDocAuth.do",
			  	type : "post",
			    dataType : "json",
			    data : {
			         userId : docAuth.userId,
			         groupId : docAuth.groupId,
			         reposId : vid,
			         docId : docAuth.docId,
			         path: node.path,
			         name: node.name,
			         isAdmin: docAuth.isAdmin, 
			         access: docAuth.access,
			         editEn: docAuth.editEn, 
			         addEn: docAuth.addEn, 
			         deleteEn: docAuth.deleteEn, 
			         downloadEn: docAuth.downloadEn,
			         uploadSize: docAuth.uploadSize,
			         heritable: docAuth.heritable,
			     },
			     success : function (ret) {
			         if( "ok" == ret.status){
				          	index++;
			                if(index < totalNum)
			                {
			                	configUserAuth();	//设置完成继续设置下一个
			                }else{
				                showAuthList();
		                    	// 普通消息提示条
								bootstrapQ.msg({
										msg : '设置完成！',
										type : 'success',
										time : 2000,
									    });
			                }
			          }else{
							//设置失败
							configErrorConfirmHandler(docAuth.userName, ret.msgInfo);
							return;
			            }
			      },
			      error : function () {
					  		//设置失败
					  		configErrorConfirmHandler(docAuth.userName, "设置异常");
							return;
				 }	
			});				
	}
	
	//获取错误处理设置 
	function getConfigErrorConfirmSetting()
  	{
 		return configErrorConfirmSet;
  	}
  	
	//config Error Confirm
  	function configErrorConfirm(UserName,errMsg)
  	{
  		var configErrorTimer = setTimeout(function () {	//超时用户没有动作，则直接继续
        	console.log("用户确认超时,继续配置其他用户");
        	configErrorConfirmSet = 1; //全局继续
        	MyJqeury.closeBootstrapDialog("configErrorConfirm");
        	configErrorHanlder(UserName,errMsg);
        },5*60*1000);	//5分鐘用戶不確認則關閉對話框
  		
		//弹出用户确认窗口
  		qiao.bs.confirm({
	    	id: 'configErrorConfirm',
	        msg: UserName + "权限设置失败（"+errMsg+"）,是否继续设置其他用户？",
	        close: false,		
	        okbtn: "继续",
	        qubtn: "退出",
	    },function () {
	    	//alert("点击了确定");
			clearTimeout(configErrorTimer);			
	 		if(index < (totalNum-1))	//后续还有用户
            {
	      		var configErrorTimer1 = setTimeout(function () {	//超时用户没有动作，则直接覆盖
	            	console.log("用户确认超时,后续错误都继续设置");
	            	configErrorConfirmSet = 1; //全局继续上传
	            	MyJqeury.closeBootstrapDialog("takeSameActionConfirm");
	            	configErrorHanlder(UserName,errMsg);
	            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
	 			
 	    	    qiao.bs.confirm({
 	    	    	id: 'takeSameActionConfirm3',
 	    	        msg: "后续错误是否执行此操作？",
 	    	        close: false,		
 	    	        okbtn: "是",
 	    	        qubtn: "否",
 	    	    },function () {
 	    	    	//后续错误将不再弹出窗口
 	    	    	clearTimeout(configErrorTimer1);
 	    	    	configErrorConfirmSet = 1;	//全局覆盖
 	    	    	configErrorHandler(UserName,errMsg); //reEnter config
  	 				return true;
 				},function(){
 					//后续错误将继续弹出错误确认窗口
 					clearTimeout(configErrorTimer1);
 	    	    	configErrorHandler(UserName,errMsg);
  	 				return true;
 				});	
            }
	 		else
	 		{
         		configErrorHandler(UserName,errMsg);
         		return;
	 		}
		},function(){
	    	//alert("点击了取消");
	    	clearTimeout(configErrorTimer);
      		configErrorConfirmSet = 2; //全局取消上传    	 		
	 		configErrorAbortHandler(UserName,errMsg);
  		});
  	}
  	
  	//configErrorConfirmHandler
  	function configErrorConfirmHandler(UserName,errMsg)
  	{
		console.log("设置失败" + errMsg);
		var confirm = getConfigErrorConfirmSetting();
		if(confirm == 1)
		{
			configErrorHandler(UserName, errMsg);
		}
		else if(confirm == 2)	//结束上传
		{
			configErrorAbortHandler(UserName, errMsg);
			return;
		}
		else
		{
			configErrorConfirm(UserName, errMsg);
		}
  	}
  	
  	//configErrorHandler
  	function configErrorHandler(UserName,errMsg)
  	{
  		failNum++;
		configNextUser();		 	
  	}
  	
  	//configErrorAbortHandler
  	function configErrorAbortHandler(UserName,errMsg)
  	{
  		failNum++;
		configEndHandler();
  	}

  	//uploadSuccessHandler
  	function configSuccessHandler(name,msgInfo)
  	{
  		successNum++;
		configNextUser();
  	}
  	
  	//configEndHandler
  	function configEndHandler()
  	{
  		console.log("设置结束，共"+ totalNum +"，成功"+successNum+"个，失败"+failNum+"个！");
  		// 普通消息提示条
		bootstrapQ.msg({
				msg : '设置完成！',
				type : 'success',
				time : 2000,
			    });
  	}
  	
  	//configNextDoc，如果后续有未上传文件则上传下一个文件 
	function configNextUser()
	{
		index++;
		if(index < totalNum)
		{
			configUserAuth(); 
		}
		else
		{
			configEndHandler();
		}
	}

	//多文件move接口
	function configUserAuths(docAuths,vid)	//多用户设置函数
	{
		console.log("configUserAuths");

		clearContext();	//清空Context缓存
		
		ConfigUserAuthSet(docAuths,vid);	//设置configUserAuth Parameters

		//启动复制操作      		
		configUserAuth();	//start set
	}
	
	//开放给外部的调用接口
    return {
        configUserAuths: function(docAuths,vid){
        	configUserAuths(docAuths,vid);
        },
        configUserAuth: function(){
        	configUserAuth();
        }
        
    };
})();