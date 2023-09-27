//页面初始化
var gDocSysConfig = null;
var login_user = "";
var gShareId;
var gPageIndex = 1;
var gPageSize = 10;
var preferLinkList = [];
var sharedPreferLinkList = [];
var showStyle = 1; //icon style

//根据参数列表构造Url请求
function makeUrl(params) {
    var href = window.location.href;
    var i = href.indexOf("?");
    if ( i< 0 ){
        i = href.length;
    }

    href = href.substring(0,i);

    var str = ""
    for( k in params ){
        if ( params[k]){ //params[k]
          str += "&" + k + "=" + params[k];
        }
    }

    return href + "?" + str.substr(1);
}

function updateUrl()
{
	console.log("updateUrl() showStyle:" + showStyle);
    var param = {
    		showStyle :showStyle,
        };
    var url = makeUrl(param);
	window.history.pushState({}, "wiki", url);
}

//从 url 中获取参数
function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

function pageInit()
{
	console.log("pageInit");
	showStyle = getQueryString("showStyle");
	if(showStyle == undefined)
	{
		showStyle = 1; //非编辑模式
	}
	
	document.onkeydown=function(event)
	{
		//浏览器兼容性处理
		var e = event || window.event || arguments.callee.caller.arguments[0];
		EnterKeyListenerForSearchPreferLink(e);	
	}
	
	getDocSysConfig();

	// 加载滚动到顶端功能
	$("#scrollToTopDiv").load("goTop.html")
	 	
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
            	
            	getPreferLinks();
            	getSharedPreferLinks();
            }
            else 
            {
            	console.log("pageInit() 获取用户信息失败:" + ret.msgInfo);
            	if(ret.data && ret.data == "needAddFirstAdmin")
                {
            		showAddFirstAdminUserPanel();
                }
            	else
            	{
                	console.log(ret.msgInfo);
                    //showLoginPanel();
                	//showErrorMessage("获取用户信息失败:" + ret.msgInfo);
            	}
            }
        },
        error : function () {
            alert(_Lang("获取用户信息失败", " : ", "服务器异常"));
        }
    });
}

//回车键监听函数，该event已经过兼容性处理 
function EnterKeyListenerForSearchPreferLink(event){
	if (event.keyCode == 13)
	{  
		var isFocus=$("#searchWord").is(":focus");  
		if(isFocus)
		{
			console.log("enter key listener for SearchPreferLink");
			searchPreferLink();
		}
		return;
 	}
}

function searchPreferLink(pageIndex)
{
	getPreferLinks();
	getSharedPreferLinks();
}

function showPreferLinkList(list)
{
	console.log("showPreferLinkList");
	if(list)
	{
		
    	for(var i=0; i<list.length; i++)
    	{
    		var jsonObj = list[i];
    		jsonObj.showName = jsonObj.url;
    		if(jsonObj.name && jsonObj.name != "")
    		{
    			jsonObj.showName = jsonObj.name;
    		}
    		
    		jsonObj.iconType = "icons webpage";
    		if(jsonObj.type == 2)
    		{
    			jsonObj.iconType = "icons weblink";
    		}
    		else if(jsonObj.type == 3)
    		{
    			jsonObj.iconType = "icons webserver";	                			
    		}
    		if(gIsPC == true)
    		{
    			jsonObj.iconStyle = " bigicon";
    			jsonObj.btnIconStyle = "";
    		}
    		else
    		{
    			jsonObj.iconStyle = " middleicon";
    			jsonObj.btnIconStyle = "";	 //小图标                			
    		}
    	}
    	
    	var html = "";
    	if(showStyle == 1)
    	{
            html = template('tmpl-preferLinks-icon', {
                list : list
            });        		
    	}
    	else
    	{
            html = template('tmpl-preferLinks', {
                list : list
            });        		
    	}
        
        $("#preferLink-box").html(html);
	}
}

function showSharedPreferLinkList(list)
{
	console.log("showSharedPreferLinkList");
	if(undefined == list || list.length == 0)
	{
		$("#sharedPreferLink-box").hide();
		return;
	}
	
	for(var i=0; i<list.length; i++)
   	{
   		var jsonObj = list[i];
   		jsonObj.showName = jsonObj.url;
   		if(jsonObj.name && jsonObj.name != "")
   		{
   			jsonObj.showName = jsonObj.name;
   		}
   		
   		jsonObj.iconType = "icons webpage";
   		if(jsonObj.type == 2)
   		{
   			jsonObj.iconType = "icons weblink";
   		}
   		else if(jsonObj.type == 3)
   		{
   			jsonObj.iconType = "icons webserver";	                			
   		}
   		if(gIsPC == true)
   		{
   			jsonObj.iconStyle = " bigicon";
   			jsonObj.btnIconStyle = "";
   		}
   		else
   		{
   			jsonObj.iconStyle = " middleicon";
   			jsonObj.btnIconStyle = "";	 //小图标                			
   		}
   	}
   	
   	var html = "";
   	if(showStyle == 1)
   	{
           html = template('tmpl-sharedPreferLinks-icon', {
               list : list
           });        		
   	}
   	else
   	{
           html = template('tmpl-sharedPreferLinks', {
               list : list
           });        		
   	}
       
    $("#sharedPreferLink-box").html(html);
    $("#sharedPreferLink-box").show();    	
}

function userLogout()
{
	logout();
	loginBtnCtrl();
}

function switchDisplayStyle()
{
	if(showStyle == 2)	//list
	{
		showStyle = 1;  //icon
		$('.display-style').text(_Lang("设置"));
        $("#sharedPreferLink-box").show();        
	}
	else
	{
		showStyle = 2;	//list
		$('.display-style').text(_Lang("退出设置"));
        $("#sharedPreferLink-box").hide();
	}
	updateUrl();
	
	if(showStyle == 1)
	{
        html = template('tmpl-preferLinks-icon', {
            list : preferLinkList
        });        		
	}
	else
	{
        html = template('tmpl-preferLinks', {
            list : preferLinkList
        });        		
	}
    
    $("#preferLink-box").html(html);  
}

function loginBtnCtrl(user)
{
	if(user)
	{
    	$('#loginBtn').hide();
    	$('#mobileLoginBtn').hide();
    	
    	$('#logoutBtn').show();
       	$('#mobileLogoutBtn').show();            
       	
    	$('#newReposBtn').show();
    	$('#mobileNewReposBtn').show();

    	$('#switchDisplayBtn').show();
    	$('#mobileSwitchDisplayBtn').show();
	}
	else
	{
    	$('#loginBtn').show();
    	$('#mobileLoginBtn').show();
    	
    	$('#logoutBtn').hide();
       	$('#mobileLogoutBtn').hide();

       	$('#newReposBtn').hide();
    	$('#mobileNewReposBtn').hide();
    	
    	$('#switchDisplayBtn').hide();
    	$('#mobileSwitchDisplayBtn').hide();
	}
}

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
        	console.log('服务器异常:获取DocSysConfig失败');
        }
    });
}
function deletePreferLink(index)
{
	console.log("deletePreferLink() index:" + index);		   	
	deletePreferLinkConfirm(index);
}

function deletePreferLinkConfirm(index)
{
	console.log("deletePreferLinkConfirm()");
	
	var preferLink = preferLinkList[index];
	var showName = preferLink.url;
	if(preferLink.name)
	{		
		showName = preferLink.name;
	}
	bootstrapQ.confirm(
			{
				id: "deletePreferLinkConfirm",
				title: _Lang("删除确认"),
				msg: _Lang("是否删除") + " [" + showName + "]",
				okbtn: _Lang("删除"),
				qubtn: _Lang("取消"),
			},
			function () {
		    	//alert("点击了确定");
				doDeletePreferLink(preferLink.id);
		    	return true;   
		 	});
}

function doDeletePreferLink(linkId) 
{
   	console.log("doDeletePreferLink() linkId:" + linkId);		   	
   	$.ajax({
       	url : "/DocSystem/Bussiness/deletePreferLink.do",
        type : "post",
        dataType : "json",
        data : {
        	linkId: linkId,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
         		// 普通消息提示条
				bootstrapQ.msg({
							msg : _Lang("删除成功") + "!",
							type : 'success',
							time : 2000,
				});
				getPreferLinks();	//刷新列表
            }
            else
            {
            	console.log("删除常用网站失败:" + ret.msgInfo);
            }
        },
        error : function () {
              console.log('删除常用网站失败：服务器异常！');
        }
    });
}

function addPreferLink()
{
	console.log("addPreferLink");
	showAddPreferLinkPanel();
}

function showAddPreferLinkPanel()
{
	console.log("showAddPreferLinkPanel");
	bootstrapQ.dialog({
		id: 'addPreferLink',
		url: 'addPreferLink' + langExt + '.html',
		title: _Lang('添加常用网站'),
		msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: false,
		callback: function(){
			addPreferLinkPageInit(getPreferLinks);
		},
	});
}

function sharePreferLink(index)
{
	console.log("sharePreferLink() index:" + index);		   	
	showSharePreferLinkPanel(index);
}

function showSharePreferLinkPanel(index)
{
	console.log("showSharePreferLinkPanel");
	
	bootstrapQ.dialog({
		id: 'sharePreferLink',
		url: 'sharePreferLink' + langExt + '.html',
		title: _Lang('添加访问用户'),
		msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: false,
		callback: function(){
			var preferLink = preferLinkList[index];
			sharePreferLinkPageInit(preferLink);
		},
	});
}

function editPreferLink(index)
{
	console.log("editPreferLink() index:" + index);		   	
	showEditPreferLinkPanel(index);
}

function showEditPreferLinkPanel(index)
{
	console.log("showEditPreferLinkPanel");
	
	bootstrapQ.dialog({
		id: 'editPreferLink',
		url: 'editPreferLink' + langExt + '.html',
		title: _Lang('设置常用服务器'),
		msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: false,
		callback: function(){
			var preferLink = preferLinkList[index];
			editPreferLinkPageInit(preferLink, getPreferLinks);
		},
	});
}

function getPreferLinks()
{
	var searchWord = $("#searchWord").val();
	var sort = "";
	
	console.log("getPreferLinks() searchWord:" + searchWord);
    $.ajax({
        url : "/DocSystem/Bussiness/getPreferLinkList.do",
        type :"post",
        dataType :"json",
        data : {
            searchWord:searchWord,
            sort:sort,
        },
        success : function (ret) {
            if(ret.status == "ok")
            {
            	console.log("getPreferLinkList ret:", ret);
            	var list = ret.data;
            	preferLinkList = list;
            	
            	showPreferLinkList(list);
            }
            else
            {
            	console.log(ret.msgInfo);
            	//showErrorMessage("获取常用网站列表失败：" + ret.msgInfo);
            }
        },
        error : function () {
        	//showErrorMessage('获取常用网站列表失败：服务器异常');
        }
    });
}

function getSharedPreferLinks()
{
	var searchWord = $("#searchWord").val();
	var sort = "";
	
	console.log("getSharedPreferLinks() searchWord:" + searchWord);
	
    $.ajax({
        url : "/DocSystem/Bussiness/getSharedPreferLinkList.do",
        type :"post",
        dataType :"json",
        data : {
            searchWord:searchWord,
            sort:sort,
        	userId : login_user.id,
        },
        success : function (ret) {
            if(ret.status == "ok")
            {
            	console.log("getSharedPreferLinks ret:", ret);
            	var list = ret.data;
            	sharedPreferLinkList = list;
            	showSharedPreferLinkList(list);
            }
            else
            {
            	console.log(ret.msgInfo);
            	//showErrorMessage("获取常用网站列表失败：" + ret.msgInfo);
            }
        },
        error : function () {
        	//showErrorMessage('获取常用网站列表失败：服务器异常');
        }
    });
}

$(function () {
	pageInit();
});

function showFeebackPanel()
{
	console.log("showFeebackPanel");
	var href = "https://gitee.com/RainyGao/DocSys/issues";
	window.open(href);   //新窗口打开
}
