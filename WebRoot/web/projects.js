var gDocSysConfig = null;
var gAiModelList = null;
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
	getAiModelList();

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

function getAiModelList()
{
	console.log("getAiModelList");
    $.ajax({
        url : "/DocSystem/Repos/getAiModelList.do",
        type :"post",
        dataType :"json",
        data : null,
        success : function (ret) {
            if(ret.status == "ok")
            {
            	gAiModelList = ret.data;
            	console.log("getAiModelList aiModelList:", gAiModelList);
               	$('#ai-chat-icon').show();	//显示AI 图标
            }
            else
            {
            	console.log(ret.msgInfo);
            }
        },
        error : function () {
        	console.log('服务器异常:获取Ai模型列表失败');
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
			url: 'addRepos' + langExt + '.html',
			title: _Lang('新建仓库'),
			msg:  _Lang('页面正在加载，请稍侯') + '...',
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
		//P3.1(2026-10-09): 页面有两个 #searchWord（顶部搜索栏 eq0 + 列表行内 eq1，靠 oninput 互相镜像），
		//  窄屏下顶部那个被父容器隐藏，此时聚焦的是 eq1；原写法只查 eq0 ⇒ is(":focus") 恒 false ⇒ 回车静默无效
		var isFocus=$("[id='searchWord']").is(":focus");  
		if(isFocus)
		{
			console.log("enter key listener for SearchDoc");
			searchDoc();
		}
		return;
 	}
}

//P1(2026-10-09): 搜索交互状态 —— 进度提示 / 可取消 / 保留旧结果 / 丢弃过期响应
var gSearchState = {
	jqXHR : null,			//当前请求（用于取消）
	token : 0,				//请求序号（用于丢弃过期响应）
	startTime : 0,
	timer : null,
	cancelled : false,
	elapsed : "0.0",
	showingResults : false	//#project-box 里当前是搜索结果还是仓库列表
};

//注意:page从0开始，pageIndex从1开始
//P3(2026-10-09): 当前结果对应的关键词数组（只在搜索成功后更新，取消/翻页时不会用错词）
var gSearchWords = [];

var searchResults = [];
function searchDoc(pageIndex)
{
	var searchWordInputs = $("[id='searchWord']");
	//P1(2026-10-09): 输入框不再被禁用（搜索中可继续输入/回车），此判断保留仅为兼容旧行为
	if(searchWordInputs.filter(":disabled").length > 0)
	{
		return;
	}

	var searchWord = searchWordInputs.eq(0).val();
	var sort = "";
	
	//P1(2026-10-09): 新搜索自动取消上一次未完成的搜索，并立即给出进度反馈（不再只禁用输入框）
	if(gSearchState.jqXHR != null)
	{
		console.log("searchDoc() 取消上一次搜索");
		gSearchState.jqXHR.abort();
		gSearchState.jqXHR = null;
	}
	var token = ++gSearchState.token;
	gSearchState.cancelled = false;
	gSearchState.startTime = (new Date()).getTime();
	startSearchStatus();
	
	gSearchState.jqXHR = $.ajax({
           url : "/DocSystem/Doc/searchDoc.do",
           type : "post",
           dataType : "json",
           beforeSend : function () {
		   	//P1(2026-10-09): 不再禁用输入框（改为状态条 + 可取消）
		   },
           data : {
               searchWord:searchWord,
               sort:sort,
               //pageIndex: page,
           	   //pageSize: gPageSize
           },
           success : function (ret) {
if(token != gSearchState.token) { return; }	//P1: 丢弃过期响应（已被更新的搜索取代）
		   	gSearchState.elapsed = (((new Date()).getTime() - gSearchState.startTime) / 1000).toFixed(1);
           		console.log("searchDoc ret:", ret);
        		if(ret.status == "ok")
           		{
           			console.log("文件搜索成功", ret);
					var docList = ret.data;
					gSearchWords = searchWordsSplit(searchWord);	//P3: 当前结果对应的关键词（高亮用）
					searchResults = docList; //赋值给searchResult,用于分页显示控制
					gSearchState.showingResults = true;	//P1: #project-box 已变为搜索结果
					
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
                        //P3(2026-10-09): 加粗渲染搜索结果 —— 写入独立的 nameHtml；name 保持原文（getDocLink 等仍用原文）
                        jsonObj.nameHtml = searchWordsRender(jsonObj.name, gSearchWords);
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
           error : function (xhr, textStatus) {
        	   if(token != gSearchState.token) { return; }	//P1: 过期响应
        	   if(textStatus == "abort") { console.log("searchDoc() 请求已取消，保留旧结果"); return; }	//P1: 取消不报错
        	   showErrorMessage({
           		id: "idAlertDialog",	
           		title: _Lang("提示"),
           		okbtn: _Lang("确定"),
           		msg: _Lang("文件搜索出错", " : ", "服务器异常")
           		});
		   },
		   complete : function () {
		   	gSearchState.jqXHR = null;
		   	stopSearchStatus(gSearchState.cancelled);	//P1: 结束状态条（取消时显示"已取消"）
           }
       });
}

//P1(2026-10-09): 搜索状态条 —— 立即反馈（不再只禁用输入框）+ 实时已耗时 + >2s 可取消
function startSearchStatus()
{
	$("#searchResultInfo").hide();
	$("#searchStatusBox").show();
	$("#searchCancelBtn").text(_Lang("取消")).hide();
	if(gSearchState.timer != null) { clearInterval(gSearchState.timer); }
	gSearchState.timer = setInterval(updateSearchStatus, 100);
	updateSearchStatus();
	//P1: 保留旧内容（仓库列表或上次结果），只做淡化提示，不清空页面
	$("#project-box").css("opacity", "0.45");
}

function updateSearchStatus()
{
	var sec = ((new Date()).getTime() - gSearchState.startTime) / 1000;
	$("#searchStatusText").text(_Lang("正在搜索") + "… " + sec.toFixed(1) + "s");
	if(sec >= 2) { $("#searchCancelBtn").show(); }	//超过 2s 才显示取消，避免闪一下
}

function stopSearchStatus(cancelled)
{
	if(gSearchState.timer != null) { clearInterval(gSearchState.timer); gSearchState.timer = null; }
	$("#searchCancelBtn").hide();
	$("#project-box").css("opacity", "1");
	if(cancelled)
	{
		var sec = ((new Date()).getTime() - gSearchState.startTime) / 1000;
		$("#searchStatusText").text(_Lang("已取消") + " · " + _Lang("用时") + " " + sec.toFixed(1) + "s");
		setTimeout(function(){ $("#searchStatusBox").hide(); }, 2000);
	}
	else
	{
		$("#searchStatusBox").hide();
	}
}

function cancelSearch()
{
	console.log("cancelSearch()");
	gSearchState.cancelled = true;
	if(gSearchState.jqXHR != null)
	{
		gSearchState.jqXHR.abort();
		gSearchState.jqXHR = null;
	}
	else
	{
		stopSearchStatus(true);
	}
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
			//P3(2026-10-09): 摘要也要高亮命中词（原来只对 name/info 做加粗，而模板渲染的是 content ⇒ 摘要永远不高亮）
			//  命中片段里一定有命中词（后端按命中位置取窗口）；此处按关键词重新定位，并在【转义后】插 <em>
			var hitType = docList[i].hitType || 0;
			var isNameOnly = ((hitType & 1) != 0) && ((hitType & 6) == 0);	//1=文件名 2=内容 4=备注
			docList[i].contentHtml = (isNameOnly ? '<span style="color:#999">' + escapeHtml(_Lang("命中文件名")) + '</span> ' : "")
					+ searchWordsRender(docList[i].content, gSearchWords);
			docList[i].state = 1;
		}
	}
	console.log(docList);
	
    //P1(2026-10-09): 结果头部显示命中数与耗时（用户取消时保留旧结果，不覆盖）
    if(!gSearchState.cancelled)
    {
    	$("#searchResultInfo").html(_Lang("找到") + " <b>" + total + "</b> " + _Lang("条")
    			+ " · " + _Lang("用时") + " " + gSearchState.elapsed + "s").show();
    }
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
//P3(2026-10-09): 关键词拆词（与后端 multiSearch 一致：按空白分割，支持多关键词）
function searchWordsSplit(searchWord)
{
	var words = String(searchWord == null ? "" : searchWord).split(/\s+/);
	var list = [];
	for(var i=0; i<words.length; i++)
	{
		if(words[i].length > 0) { list.push(words[i]); }
	}
	return list;
}

//P3(2026-10-09): HTML 转义 —— 模板用的是 {{# }}（原样输出、不转义），
//  所以所有要显示的文本都必须先转义，否则文件内容/文件名里的 <script>/<img onerror>
//  会被浏览器当 HTML 执行（改造前 {{# doc.content}} 就有这个隐患）
function escapeHtml(str)
{
	if(str == null) { return ""; }
	return String(str)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * 加粗加红显示搜索关键字（P3：多关键词 + 摘要高亮 + 转义后插标记）
 * 返回的是【已转义的安全 HTML】：命中词包 <em>，其余字符全部转义
 * （加粗加红由 .s-box em 的 CSS 提供）
 * @param str 原始字符串（未转义）
 * @param words 关键词数组；也可传单个字符串（向后兼容）
 */
function searchWordsRender(str, words)
{
	if(str == null || str === "") { return ""; }
	str = String(str);
	if(typeof(words) == "string") { words = searchWordsSplit(words); }
	if(words == null || words.length == 0) { return escapeHtml(str); }

	//1. 在原文上找所有命中区间（大小写不敏感）
	var lowerStr = str.toLowerCase();
	var ranges = [];
	for(var i=0; i<words.length; i++)
	{
		var word = String(words[i]).toLowerCase();
		if(word.length == 0) { continue; }
		var pos = 0;
		var index = -1;
		while((index = lowerStr.indexOf(word, pos)) >= 0)
		{
			ranges.push([index, index + word.length]);
			pos = index + word.length;
			if(ranges.length >= 200) { break; }	//防御：命中过多时不再继续收集
		}
	}
	if(ranges.length == 0) { return escapeHtml(str); }

	//2. 按起点排序并合并重叠区间（多关键词互相重叠时只包一次 <em>）
	ranges.sort(function(a, b) { return a[0] - b[0] || a[1] - b[1]; });
	var merged = [];
	for(var i=0; i<ranges.length; i++)
	{
		var last = merged[merged.length-1];
		if(last != null && ranges[i][0] <= last[1])
		{
			if(ranges[i][1] > last[1]) { last[1] = ranges[i][1]; }
		}
		else
		{
			merged.push([ranges[i][0], ranges[i][1]]);
		}
	}

	//3. 逐段拼接：非命中段转义后原样输出，命中段转义后包 <em>
	var html = "";
	var cursor = 0;
	for(var i=0; i<merged.length; i++)
	{
		var start = merged[i][0];
		var end = merged[i][1];
		if(start > cursor) { html += escapeHtml(str.substring(cursor, start)); }
		html += "<em>" + escapeHtml(str.substring(start, end)) + "</em>";
		cursor = end;
	}
	if(cursor < str.length) { html += escapeHtml(str.substring(cursor)); }
	return html;
}

function onSmallScreen() {
    return $("#visibleOnSmall:visible").size() > 0;
}