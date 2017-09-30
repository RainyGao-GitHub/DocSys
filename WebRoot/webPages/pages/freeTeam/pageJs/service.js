$(function(){
	$("#tab_p3").addClass("active");
	var bt = $("#busiType").html();
	//服务分类
//	$("#busiType").html(getVocationValue(bt).parentVocation+"/"+getVocationValue(bt).vocation);
	$("#busiType").html($p.busiType[$("#busiType").html()]);
	//服务星级
	var l = $("#ser_score").val();
	var str = getStar(l*5) + " (好评率" +Math.round(l*100)+"%)";
	$("#serLevel").text("");
	$("#serLevel").append(str);
	//查看是否预订过该服务
	var schedule = $("#schedule").val();
	var str = "";
	if(schedule=="-1"){
		str = "<a href='javaScript:void(0)' onclick='joinService("+$("#serviceId").val()+")' title='点击将会发送私信到创建者信箱'>预定服务</a>";
	}else if(schedule=='0'){
		str = "<a>已申请</a>";
	}else if(schedule=='1'){
		str = "<a>已接收</a>";
	}else if(schedule=='2'){
		str = "<a>未接受</a>";
	}
	
	//价格区间
	var price = $("#price").text();
	var _price = price.split("-");
	if(_price[0]==_price[1]&&_price[0]=="0"){
		$("#price").text("面议");
		$("#dw").text("");
	}
	
	var hidUserId = $("#hidUserId").val(); 
	var publisher = $("#publisher").val();
	if(hidUserId == publisher){
		str = "<a href='toUpdateService.do?id="+$("#serviceId").val()+"'>修改服务</a>";
	}
	var tmpc = $("#orderServiceBtn").children();
	$(tmpc).remove();
	$("#orderServiceBtn").append(str);
	
	queryOthersService();
	queryMsgList();
	
	$("#levStar>.glyphicon-star").bind("mouseover",function(e){
		var p = $(this).parent();
		var level = $(this).attr("value");
		setLevel(level);
		var c = $(p).children();
		$(c).each(function(i,item){
			$(item).removeClass("redStar").removeClass("whiteStar").addClass("whiteStar");
		})
		for(var i = 1;i<=parseInt(level);i++){
			var tmp = $(p).find("span[value="+i+"]");
			$(tmp).removeClass("redStar").removeClass("whiteStar").addClass("redStar");
		}
	});
	
	$(".switch_tab").on("click","li",function(e){
		$(this).addClass("active").siblings().removeClass("active");
		var $divs = $(this).parent().siblings();
		var toChild = $(this).attr("toChild");
		/*$divs.map(function(){
			if($(this).attr("child"))return $(this);
		})*/
		$divs.each(function(i,item){
			if($(this).attr("child")){
				if($(this).attr("child")==toChild){
					$(this).fadeIn("slow");
				}else{
					$(this).hide();
				}
			}else{
				return;
			}
		})
	});
	
	fixToTop($(".switch_tab"));
	setProLikeData();
	initCommentForm();
	
	
	$("#commentChoose i").on("click",function(){
		var v = $(this).attr("value");
		if(v!='0'){
			$.pg.param.level = v;
		}else{
			$.pg.param.level = "";
		}
		$("#_firstPage1").click();
	});
});

function showAll(dom){
	$(dom).hide().siblings().show();
}

function queryOthersService(){
	var c = $("#otherSerArea").children();
	$(c).remove();
	var callback = function(data){
		if(data.obj.length==0){
			var str = "<P>暂无数据</p>";
			$("#otherSerArea").append(str);
			return;
		}
		$.each(data.obj,function(i,item){
			var d = item;
			var str = "";
			var hidUserId = $("#hidUserId").val(); 
			if(hidUserId == d.PUBLISHER){
				str = "<a onclick='bootstrapQ.alert(\"不能购买自己的服务！\")' class='mybtn-primary' disabled='disabled' >购买</a>";
			}else{
				str = "<a class='mybtn-primary' href='toBuyService.do?id="+d.ID+"' title='点击将会发送私信到创建者信箱'>购买</a>";
			}
			
			var _price = "";
			if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
				_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
			}else{
				_price = "<span class='price'><i class='glyphicon glyphicon-yen'></i>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>&nbsp;&nbsp;";
			}
			var str2 = "<li>"
				+"	<i class='cell logo w12'>"
				+"		<a href='toService2.do?id="+d.ID+"'" + " target='_blank'>"
				+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
				+"		</a>"
				+"	</i> "
				+"	<i class='cell commpany w30'>"
				+"		<span class='name'>"
				+"			<a href='toService2.do?id="+d.ID+"'" +" target='_blank'>"+d.NAME+"</a></span>"
				+"			<span class='desc'><span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE)+Math.round(d.SCORE/5*100)+"%</span></span>"
				+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),50)+"</span>"
				+"	</i>"
				+"  <i class='cell round w10'>"+nvl(d.AREA,"未知区域").split(" ")[0] +"</i>"
				+"	<i class='cell round w10'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.BUSISMLTYPE,"暂无") +"</i>"
				+"	<i class='cell amount w10'> "+ _price +"</i>"
				+"  <i class='cell round w8'>"
				+ str 
				+"  </i>"
				+"  <i class='cell round w10'>" 
				+(d.ISLIKED==0?"<a class='mylink' href='javascript:void(0)' onclick='doLike("+d.ID+")'><span class='glyphicon glyphicon-plus p5'></span>收藏</a>":"<label class='label label-success'>已收藏</label>")
				+"	</i>"
				+"	<i class='cell date w10'>"+d.PUBLISHTIME+"</i>"
				+"</li>";
			$("#otherSerArea").append(str2);
		});
	}
	
	$.post("queryOthersService.do",{"serviceId":$("#serviceId").val(),"publisher":$("#publisher").val()},callback,"json");
}

var params = {page:"",rows:""};
function setParams(){
	params.page = PAGE;
	params.rows = ROW;
	params.serId = $("#serviceId").val();
}

function setProLikeData(){
	var c = $("#likeCnts").children();
	$(c).remove();
	var callback = function(data){
		if(data.msgNo=="1"){
			var cor = "";
			if(data.obj.isILiked!="0"){
				cor = "已收藏";
			}else{
				cor = "收藏";
			}
			var p = "<span onclick='doLike1();' title='喜欢就收藏这个服务吧'>"
				+"	<span id='likeCnts'>"+cor+"("+data.obj.totalLike+")</span>"
				+"</span>";
			$("#likeCnts").append(p);
		}
	}
	$.post("queryLikeData.do",{"projectId":$("#serviceId").val(),"type": 1},callback,"json");
}

function doLike1(){
	var callback = function(data){
		setProLikeData();
	}
	$.post("doLikeProject.do",{"projectId":$("#serviceId").val(),"type": 1},callback,"json");
}

function doLike(id){
	var callback = function(data){
		queryOthersService();
	}
	$.post("doLikeProject.do",{"projectId":id,"type": 1},callback,"json");
}


/**
 * 查询评论列表
 */
function queryMsgList(){
	setParams();
	var callback = function(data){
		initPageToolBar(data.obj.total);
		if(data.msgNo=="0"){
			alert(data.msgInfo);
		}else{
			var c = $("#leaveMsgBoard").children();
			$(c).remove();
			if(data.obj.total=="0"){
				var str = "<p>暂无数据</p>";
				$("#leaveMsgBoard").append(str);
			}else{
				$.each(data.obj.rows,function(i,item){
					var d = item;
					var str = "<div class='thinBorder m5'>"
						+"	<div style='width: 10%;' class='thinBorder text-center fLeft'>"
						+"		<img width='80%' style='border: 1px solid gray; padding: 2px;margin: 2px;' class='img-circle' src='"+$("#basePath").val() + "webPages/upload/headpic/" + d.HEADIMG +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"' />"
						+"		<p><a href='toUserDetail2.do?id="+d.USERID+"'>"+d.NICKNAME+"</a></p>"
						+"	</div>"
						+"	<div style='width: 85%;' class='fLeft p10'>"
						+"		<span class='fRight'>留言时间:"+d.MSGTIME+"</span>"
						+"		<p class='redStar'>服务质量："+getStar(d.SCORE)+"</p>"
						+"		<p>"
						+ "&nbsp;&nbsp;"+d.MSG
						+"		</p>"
						+"		<div class='clear'></div>"
						+"	</div>"
						+"	<div class='clear'></div>"
						+"</div>";
					
					$("#leaveMsgBoard").append(str);
				});
			}
		}
	}
	$.post("queryCommentsListData.do",params,callback,"json");
}

/**
 * 初始化评论框
 */
function initCommentForm(){
	var serId = $("#serviceId").val();
	var callback = function(data){
		if(!data.obj){
			$("#comment_area").remove();
		}else{
			$("#comment_area").show();
		}
	}
	
	$.post("queryPopedomOfComment.do",{"serviceId":serId},callback,"json");
}

function showEmployeeList(){
	$("#employeeList").children().remove();
	$("#employeeList").append("<p>正在查询...</p>");
	$.post("queryCompanyUserRelationList.do?schedule=11&serviceId="+$("#serviceId").val(),{page: 1,rows: 99999},function(data){
		if(data.msgNo==1){
			$("#employeeList").children().remove();
			var d = data.obj;
			if(d.totalPage>0){
				var html = "";
				$.each(d.rows,function(i,item){
					var userHref = "";
					if(item.userId>0){
						userHref = "href='toUserDetail2.do?id="+item.userId+"' target='_blank'";
					}
					html += "<li>"
						+"	<i class='cell logo w12'>"
						+"		<a href='#'>"
						+"			<span class='incicon'>"
						+"				<img src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + item.headImg +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"'>"
						+"			</span>"
						+"		</a>"
						+"	</i>"
						+"	<i class='cell commpany w20'>"
						+"		<span class='name'>"
						+"<a "+userHref+">"+item.nickName+"</a>"
						+"		</span>"
						+"		<span class='desc'>描述："+item.mark+"</span>"
						+"	</i>"
						+"	<span class='cell round'>"
						+"		<span class='desc'>"
						+getJob(item.job).main_job+"/"+getJob(item.job).sub_job
						+"		</span>"
						+"	</span>"
						+"	<span class='cell round'>"
						+"		<span>"
						+"			" + (item.userId>0?"本站成员":"企业人员")
						+"		</span>"
						+"	</span>"
						+"	<span class='cell round'>"
						+"		<span>"
						+item.addTime
						+"		</span>"
						+"	</span>"
						+"</li>";
				});
				$("#employeeList").append(html);
			}else{
				$("#employeeList").append("<p>暂无成员数据</p>")
			}
		}
	},"json");
}

$("#commentChoose").on("click",".label",function(){
	alert(11);
	$(this).addClass("active").siblings().removeClass("active");
	$("#_firstPage1").click();
})

function doPageSplit(dom,callback){
	$.pg.param.rows = "10";
	$.post($(dom).val(),$.pg.param,eval(callback),"json");
}

var initCommentList = function(data){
	var tmp = ['','差评','一般','中评','较好','好评'];
	var $dom = $("#comments");
	$dom.children().remove();
	var pt = data.pt;
	
	
	if(data.msgNo=="1"){
		
		$("#totalPage1").text(data.obj.total);
		var d = data.obj.rows;
		if(d.length==0){
			$dom.append("<p>暂无数据</p>");
		}else{
			var html = "";
			$.each(data.obj.rows,function(i,item){
				var d = item;
				html += '<div class="clearfix">'
					+'	<div class="fLeft p10">'
					+'		<div style="min-height: 30px;max-width: 700px;">'
					+ d.CONTENT
					+'		</div>'
					+'		<div>'+d.CREATE_TIME+'</div>'
					+'	</div>'
					+'	<div class="fRight p10" style="max-width: 280px;">'
					+'		<img width="30px" height="30px" src="'+$("#basePath").val() + "webPages/upload/headpic/" + d.HEADIMG +'"  onerror="this.src=\'webPages/images/defaultHeadPic.jpg\'" />'
					+'		<span>'+d.FROM_USERNAME+'</span>'
					+'		<h5 class="text-right">'
					+	getStar(d.LEVEL) + '<span style="color: #757575;">（'+tmp[d.SCORE]+'）</span>'
					+'		</h5>'
					+'	</div>'
					+'</div><hr/>';
			});
			$dom.append(html);
			
			var tj = data.obj.tj;
			var s0 = "好评率"+Math.round(tj.SCORE_GOOD/tj.SCORE_TOTAL*100)+"%";
			$("#goodPercent").text(s0);
			$("#comments_total").text("全部("+tj.SCORE_TOTAL+")");
			$("#comments_good").text("好评("+tj.SCORE_GOOD+")");
			$("#comments_mid").text("中评("+tj.SCORE_MID+")");
			$("#comments_bad").text("差评("+tj.SCORE_BAD+")");
		}
	}else{
		$dom.append("<p>加载数据失败</p>");
	}
	
}

/**
 * 添加服务评论
 */
function addComment(){
	var star = $("#levStar").children(".redStar");
	if(star!=null&&star!=undefined&&$(star).size()>0){
		var level = $(star).size();
		var msg = $("#comment_msg").val();
		if(msg!=null&&msg!=undefined&&msg.trim().length>0){
			var param = {};
			param.score = level;
			param.msg = msg;
			var serId = $("#serviceId").val();
			param.serviceId = serId;
			
			var callback = function(data){
				alert(data.obj);
				queryMsgList();
				initCommentForm();
			}
			$.post("addComment.do",param,callback,"json");
		}else{
			alert("评论不能为空！");
			return;
		}
	}else{
		alert("请选择服务星级！");
	}
	
}


function setLevel(level){
	var l = parseInt(level);
	switch (l){
		case 1:
			$("#level").text("差评");
			break;
		case 2:
			$("#level").text("一般");
			break;
		case 3:
			$("#level").text("中评");
			break;
		case 4:
			$("#level").text("较好");
			break;
		case 5:
			$("#level").text("好评");
			break;
		default:
			$("#level").text("");
			break;
	}
}


/*function addRelation(id){
	var flag = confirm("确定要预定此服务吗？");
	if(flag){
		var param = {"proId":id,"type":"1"};
		var callback = function(data){
			alert(data.obj);
			if(data.msgNo=="1"){
				var tmpc = $("#orderServiceBtn").children();
				$(tmpc).remove();
				$("#orderServiceBtn").append("<a>已&nbsp;申&nbsp;请</a>");
			}
		}
		$.post("addRelation.do",param,callback,"json");
	}
	
}*/

function clickButton(id){
	var param = {"type":"1"};
	var callback = function(data){
		alert(data.obj);
		$('#dia_joinPrj').modal('hide');
		if(data.msgNo=="1"){
			window.location.href = window.location.href;
		}
	}
	postFormByAjax("joinPrj_form", param, callback);
}

/**
 *  查看项目案例详情
 */
function toProjectDemoInfo(id,title){
	bootstrapQ.dialog({
		id: 'projectDemoDialog',
		title: title,
		url: getCtx() + 'projectDemo/toInfo.do?id=' + id,
		msg: '正在加载请稍后...',
		okbtn: '关闭'
	},function(){
		$("#projectDemoDialog").modal("hide");
	});
}
