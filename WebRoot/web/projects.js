var gDocSysConfig = null;
var login_user = "";
var gShareId;
var gPageIndex = 1;
var gPageSize = 10;

function pageInit()
{
	console.log("pageInit");
	
	//Set the event handler for keydown
	console.log("pageInit() Set the event handler for keydown");
	document.onkeydown=function(event)
	{
		//浏览器兼容性处理
		var e = event || window.event || arguments.callee.caller.arguments[0];
		EnterKeyListenerForSearchDoc(e);	
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
            	
            	//用戶已經登錄才能看到倉庫
            	showReposList();
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
                    showLoginPanel();
                	//showErrorMessage("获取用户信息失败:" + ret.msgInfo);
            	}
            }
        },
        error : function () {
            alert(_Lang("服务器异常", " : ", "获取用户信息失败"));
        }
    });
	
	//showQRCode();
}

function showQRCode()
{
	$.ajax({
        url : "/DocSystem/Doc/getLoginLink.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
     		console.log("getLoginLink ret:", ret)
     		if(ret.status == "ok")
        	{
     			var url = ret.data;
     			console.log(url);
     			new QRCode(document.getElementById("qrcode"), url);  // 设置要生成二维码的链接
     		}
            else
            {
            	new QRCode(document.getElementById("qrcode"), "http://dw.gofreeteam.com/DocSystem");  // 设置要生成二维码的链接
                showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("获取登录链接失败", " : ", ret.msgInfo)
        		});
            }
        },
        error : function () {
        	new QRCode(document.getElementById("qrcode"), "http://dw.gofreeteam.com/DocSystem");  // 设置要生成二维码的链接
            showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("获取登录链接失败", " : ", "服务器异常")
        		});
        }
    });

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
    	$('#mobileLoginBtn').hide();
    	
    	$('#logoutBtn').show();
       	$('#mobileLogoutBtn').show();            
       	
    	if(user.type > 0) //超级管理员和管理员才能新建仓库，后台也需要进行控制，普通用户只能建立最多10个私人仓库
    	{
        	$('#newReposBtn').show();
        	$('#mobileNewReposBtn').show();
        	
    		$('#goManagerBtn').show();
    		$('#mobileGoManagerBtn').show();
    	}
	}
	else
	{
    	$('#loginBtn').show();
    	$('#mobileLoginBtn').show();
    	
    	$('#logoutBtn').hide();
       	$('#mobileLogoutBtn').hide();

       	$('#newReposBtn').hide();
    	$('#mobileNewReposBtn').hide();
    	
    	$('#goManagerBtn').hide();
    	$('#mobileGoManagerBtn').hide();        	
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


function showReposList()
{
	console.log("showReposList");
    $.ajax({
        url : "/DocSystem/Repos/getReposList.do",
        type :"post",
        dataType :"json",
        data : null,
        success : function (ret) {
            if(ret.status == "ok")
            {
                var html = template('tmpl-projects', {
                    list : ret.data
                });
                
                $("#project-box").html(html);
            }
            else
            {
            	console.log(ret.msgInfo);
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("获取仓库列表失败", " : ", ret.msgInfo),
            	});
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("获取仓库列表失败", " : ", "服务器异常"),
        		});
        }
    });
}

$(function () {
	pageInit();
});

function newRepos() {
	showAddReposPanel();
}

function callBackForAddReposSuccess()
{
	showReposList();
	
	MyJquery.closeBootstrapDialog("addRepos");
	
	//临时方案避免滚动条消失
	//window.location.reload();
}

function callbackForCancelAddRepos()
{
	MyJquery.closeBootstrapDialog("addRepos");

	//临时方案避免滚动条消失
	//window.location.reload();    	
}


function showAddReposPanel()
{
	console.log("showAddReposPanel()");
	bootstrapQ.dialog({
			id: 'addRepos',
			url: 'addRepos.html',
			title: 'Add Repository',
			msg: 'Loading...',
			foot: false,
			big: false,
			//okbtn: "确定",
			callback: function(){
				ReposConfig.addReposPageInit(callBackForAddReposSuccess, callbackForCancelAddRepos);
			},
	});
}

function showFeebackPanel()
{
	console.log("showFeebackPanel");
	var href = "https://gitee.com/RainyGao/DocSys/issues";
	window.open(href);   //新窗口打开
}

//回车键监听函数，该event已经过兼容性处理 
function EnterKeyListenerForSearchDoc(event){
	if (event.keyCode == 13)
	{  
		var isFocus=$("#searchWord").is(":focus");  
		if(isFocus)
		{
			console.log("enter key listener for SearchDoc");
			searchDoc();
		}
		return;
 	}
}

//注意:page从0开始，pageIndex从1开始
var searchResults = [];
function searchDoc(pageIndex)
{
	var searchWord = $("#searchWord").val();
	var sort = "";
	
   	$.ajax({
           url : "/DocSystem/Doc/searchDoc.do",
           type : "post",
           dataType : "json",
           data : {
               searchWord:searchWord,
               sort:sort,
               //pageIndex: page,
           	   //pageSize: gPageSize
           },
           success : function (ret) {
           		console.log("searchDoc ret:", ret);
        		if(ret.status == "ok")
           		{
           			console.log("文件搜索成功", ret);
					var docList = ret.data;
					searchResults = docList; //赋值给searchResult,用于分页显示控制
					
					var total = ret.dataEx; //搜索结果总数
			      	for(var i=0; i<docList.length; i++)
			      	{
			           var jsonObj = docList[i];
			           jsonObj.link = getDocLink(jsonObj);
			           
			           //设置用户自定义文件图标（必须在standardStyle中有定义）
			           if(jsonObj.type == 1)
			           {
			        	   var iconType = getDiyFileIconType(jsonObj.name);
			        	   if(iconType && iconType != "")
			        	   {
			        		   jsonObj.iconStyle = "icons smallicon file " + iconType;
			        	   }
			        	   else
			        	   {
			        		   jsonObj.iconStyle = "icons smallicon file";
			        	   }
			           }
			           else
			           {
			        	   jsonObj.iconStyle = "icons smallicon folder";
			           }

                        // 加粗渲染搜索结果
                        jsonObj.name = searchWordsRender(jsonObj.name, searchWord);
                        jsonObj.info = searchWordsRender(jsonObj.info, searchWord);
			       }

			       showSearchResults(searchResults, pageIndex);
               	}
               	else
               	{
               		showErrorMessage({
                		id: "idAlertDialog",	
                		title: _Lang("提示"),
                		okbtn: _Lang("确定"),
                		msg: _Lang("文件搜索出错", " : ", ret.msgInfo)
                		});
               	}
           },
           error : function () {
        	   showErrorMessage({
           		id: "idAlertDialog",	
           		title: _Lang("提示"),
           		okbtn: _Lang("确定"),
           		msg: _Lang("文件搜索出错", " : ", "服务器异常")
           		});
           }
       });
}

function showSearchResults(searchResults, pageIndex)
{
	console.log("showSearchResults pageIndex:" + pageIndex);
	var page = pageIndex ? pageIndex : 0;

	var docList = [];
	var startIndex = page * gPageSize; //当前页第一个搜索结果索引号
	var total = searchResults.length;
	var size = total - startIndex;
	if(size > gPageSize)
	{
		size = gPageSize;
	}
	for(var i=0; i< size; i++)
	{
		docList[i] = searchResults[startIndex+i];
		if(!docList[i].state)
		{
			//do decode the content
			if(docList[i].content)
			{
				docList[i].content = base64_decode(docList[i].content);
				docList[i].content = subByte(docList[i].content, docList[i].content.length);
			}
			docList[i].state = 1;
		}
	}
	console.log(docList);
	
    var html = template('tmpl-searchResults', {
            list : docList,
    });
    
    $("#project-box").html(html);
    

    // 渲染分页
    $("#pagination").pagination({
         /*当前页码*/
         currentPage: page + 1,
         /*总共有多少页*/
         totalPage: Math.ceil(total/gPageSize),
         /*是否显示首页、尾页 true：显示 false：不显示*/
         isShow:true,
         /*分页条显示可见页码数量, 小屏幕只显示3个页码，大屏幕显示5个*/
         count: onSmallScreen() ? 3 : 5,
         /*第一页显示文字*/
         homePageText: 'First',
         /*最后一页显示文字*/
         endPageText: 'Last',
         /*上一页显示文字*/
         prevPageText: 'Prev',
         /* 下一页显示文字*/
         nextPageText:'Next',
         /*点击翻页绑定事件*/
         callback: function(newPageIndex) {
         	showSearchResults(searchResults, newPageIndex - 1);
         }
    });
    
}

//截取字符 去除乱码 避免半个中文字符
function subByte(source, length) {
    source = String(source);
    source = source.substr(0,length).replace(/([^\x00-\xff])/g,"\x241 ")//双字节字符替换成两个
       .substr(0,length)//截取长度
       .replace(/[^\x00-\xff]$/,"")//去掉临界双字节字符
       .replace(/([^\x00-\xff]) /g,"\x241");//还原
    return source;
};

/**
 * 加粗加红显示搜索关键字
 * @param str 原始字符串
 * @param keyword 关键字
 */
function searchWordsRender(str, keyword) {
    if (str && keyword && str.length > keyword.length) {
        var keywordLength = keyword.length;
        var tmpStr = str.toLowerCase();
        keyword = keyword.toLowerCase();
        var indexs = [];

        var startPosition = 0;
        var index = -1;
        while ((index = tmpStr.indexOf(keyword, startPosition)) >= 0) {
            startPosition = index + keyword.length;
            indexs.push(index);
        }

        if (indexs.length == 0) {
            return str;
        } else {
            // 倒序替换
            for (var i = indexs.length - 1; i >=0; i--) {
                var start = indexs[i];
                var end = start + keywordLength;
                var left = str.substring(0, start);
                var mid = str.substring(start, end);
                var right = str.substring(end, str.length);

                // 关键字加粗显示
                str = left + "<em>" + mid + "</em>" + right;
            }
            return str;
        }
    } else {
        return str;
    }

}

function onSmallScreen() {
    return $("#visibleOnSmall:visible").size() > 0;
}