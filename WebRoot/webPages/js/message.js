$(function(){
	createDialog("messageDialog","我的信息","msgDiaLog");
	showOrHideDiv("msgDiaLog",false);
});

function openMsgDia(){
	hideDialogFooter('messageDialog');
	$('#messageDialog').modal('show');
}


function initMessagePagebar(maxPage){
	console.log("initMessagePagebar:init");
	//取消其它绑定
//	$(".jqPagination").off('.jqPagination');
	$(".jqPagination").off('.jqPagination')
	.find('*')
	.off('.jqPagination');
	//新增绑定
	$('.jqPagination').jqPagination({
	  link_string : 'tologin.do?page={page_number}',
	  current_page: maxPage, //设置当前页 不设置默认为1
	  max_page : maxPage, //设置最大页 默认为1
	  page_string : '当前第{current_page}页,共{max_page}页',
	  paged : function(page) {
		  queryParams.page = page;
		  queryMegListData(page);
	  }
	});
}

var queryParams = {userId:"",page:"0"};
var pg_flag = 0; //是否第一次加载，0：是，1：否
/**
 * 应该调用的方法
 * @param userId
 */
function initMsgDalog(userId){
	console.log("initMsgDalog:init");
	pg_flag = 0;
	queryParams.userId = userId;
	queryMegListData();
	var callback = function(data){
		var u = data.obj;
		if(u==null||u==undefined){
			alert("初始化消息框失败！");
		}
		var title = $("#messageDialog").find(".modal-title");
		$(title).text("");
		var str = "与"+"<a href='toUserDetail2.do?id="+ u.id +"' target='_blank'>"+u.nickName+"</a>"+"的对话";
		$("#msg_toId").val(u.id);
		$(title).append(str);
		openMsgDia();
		
		//开启自动刷新
		setTimeout(openAutoRefreshMsg,10000);
	}
	
	$.post("queryMyIntro.do",{"userId":userId},callback,"json");
}


/**
 * 查询与用户Id为userId的对话记录
 * @param userId
 */
function queryMegListData(){
	closeMsgInterval(); //如果对话框不存在，则清除定时器
	console.log("queryMegListData:init");
	var callback = function(data){
		var c = $("#msgContent").children();
		$(c).remove();
		if(data.msgNo=="0"){
			alert(data.msgInfo);
		}
		//计算总页数并初始化分页栏
		var _total = parseInt(data.obj.total);
		var tmp1 = (_total/10).toString().split('.')[0];
		var tmp2 = _total%10;
		if(tmp2>0)tmp1++;
		var max_page = tmp1;
		initMessagePagebar(max_page);
		
		if(data.obj.total=='0'){
			var str = "<p>暂无聊天记录，快给TA发送消息吧。</p>";
			$("#msgContent").append(str);
		}else{
			$.each(data.obj.rows,function(i,item){
				var d = item;
				var str = "";
				if(d.ISISEND=="0"){
					//是我发送给别人的消息。
					str = "<div class='re_msg  thinBorder p5 m2'>"
						+"	<table>"
						+"		<tr>"
						+"			<td style='width:700px;' class='pr10'>"
						+"				<p class='msg_title fRight'>"
						+"					<big><a href='toUserDetail2.do?id="+d.FROMID+"'  target='_blank'>"+d.FROMNAME+"</a></big>("+d.SENDTIME+")"
						+"				</p>"
						+"				<div class='clear'></div>"
						+"				<p class='msg_content pl10 fRight'>"
						+					d.CONTENT
						+"				</p>"
						+"				<div class='clear'></div>"
						+"			</td>"
						+"			<td style='width:62px;' class='msg_img p5' valign='top'>"
						+"				<a href='toUserDetail2.do?id="+d.FROMID+"'  target='_blank'>" 
						+"					<img width='50px' height='50px;' class='img-circle' src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + d.FROMHEADIMG +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"' />"
						+"				</a>"	
						+"			</td>"
						+"		</tr>	"
						+"	</table>"
						+"</div>";
				}else{
					str = "<div class='main_msg thinBorder p5 m2'>"
						+"	<table>"
						+"		<tr>"
						+"			<td style='width:62px;' class='msg_img p5' valign='top'>"
						+"				<a href='toUserDetail2.do?id="+d.FROMID+"'  target='_blank'>" 
						+"					<img width='50px' height='50px;' class='img-circle' src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + d.FROMHEADIMG +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"'/>"
						+"				</a>"
						+"			</td>"
						+"			<td style='width:700px;' class='pl10'>"
						+"				<p class='msg_title'>"
						+"					<big><a href='toUserDetail2.do?id="+d.FROMID+"'  target='_blank'>"+d.FROMNAME+"</a></big>("+d.SENDTIME+")"
						+"				</p>"
						+"				<p class='msg_content pl10'>"
						+					d.CONTENT
						+"				</p>"
						+"			</td>"
						+"		</tr>	"
						+"	</table>"
						+"</div>";
				}
				
				$("#msgContent").append(str);
			})
			
		}
		console.log("是否刷新到最后一页："+pg_flag);
		//默认要显示最后一页。
		if(pg_flag==0&&queryParams.page != max_page){
			
			pg_flag = 1;
			queryParams.page = max_page;
			queryMegListData();
		}
	}
	
	$.post("queryMessageListData.do",queryParams,callback,"json");
}

/**
 * 添加消息
 */
function addMsg(){
	
	var callback = function(data){
		if(data.msgNo=="0"){
			alert(data.obj);
		}else{
			pg_flag = 0; //让消息刷新到最后一页
			queryMegListData();
			$("#input_msgContent").val("");
		}
	}
	
	
	var toId = $("#msg_toId").val();
	var content = $("#input_msgContent").val();
	if(toId==null||toId==undefined){
		alert("发生了未知错误，请刷新页面后重试！");
		return;
	}
	if(content==null||content==undefined||content.trim()==""){
		alert("不能发送空消息！");
		return;
	}
	$.post("addMessage.do",{'toId':toId,'content':content,'type':'2'},callback,"json");
}
var msgTime;
//自动刷新消息
function openAutoRefreshMsg(){
	closeAutoRefreshMsg();
	msgTime = setInterval(queryMegListData,10000);
}

function closeAutoRefreshMsg(){
	if(msgTime)clearInterval(msgTime);
}

function closeMsgInterval(){
	//如果聊天框是隐藏的，则关闭自动刷新
	if(!$("#messageDialog").hasClass("in")){
		closeAutoRefreshMsg();
		return true;
	}else{
		return false;
	}
}

//动态生成的对话框无法触发该事件
/*$('#messageDialog').on('shown.bs.modal', function () {
	alert("打开了对话框");
	//开启自动刷新
	setTimeout(openAutoRefreshMsg,10000);
}).on('hidden.bs.modal', function () {
	alert("关闭了对话框");
	closeAutoRefreshMsg();
})*/

