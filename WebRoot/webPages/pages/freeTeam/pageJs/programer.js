


$(function(){
	$("#tab_p4").addClass("active");
//	addToolTip($("#ml_help"),"如果您一个月内没有登录，系统将判定您为忙碌状态，您也可以手动更改此状态�?");
	/*$('body').scrollspy({ target: '#navbar-example' });
	window.onscroll = function(){
		moveDiv(100,200);
	}
	window.onload = function(){
		moveDiv(100,200);
	}
	window.onresize = function(){
		moveDiv(100,200);
	}*/
	showMyInfo();
//	showServiceList();
	
	if( $("#hidShowUserInfo").val() == "true" )
	{
		showJobExperience();
		showEduExperience();
	}
	
	queryProSerFriCnts();
	setIsFriend();
	
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
		});
	});
	
	fixToTop($(".switch_tab"));
	
	$("#commentChoose i").on("click",function(){
		var v = $(this).attr("value");
		if(v!='0'){
			$.pg.param.level = v;
		}else{
			$.pg.param.level = "";
		}
		$("#_firstPage3").click();
	});
	
	//计算星级
	var examine = $("#g_examine").val();
	var isRecommend = $("#g_isRecommend").val();
	var goodPercent = $("#g_goodPercent").val();
	var stars = getUserStars(examine, isRecommend, goodPercent);
	$("#grade").html(stars);
});

/**
 * 显示我的信息
 */
function showMyInfo(){
	var callback = function(data){
		var u = data.obj;
		if(u.headImg!=null&&u.headImg!=""&&u.headImg!=undefined){
			$("#headImg").attr("src",$("#basePath").val() + "webPages/upload/headpic/" + u.headImg);
			$("#headImg2").attr("src",$("#basePath").val() + "webPages/upload/headpic/" + u.headImg);
		}
		$("#nickName").text(u.nickName);
		$("#pArea").text(u.area);
		if(u.showService != '1'){
			$("#showService").text("");
			$("#showService").append("<a href='#serArea' onclick='showServiceList();'>服务</a>");
		}
	}
	
	var id = $("#id").val();
	$.post("queryMyIntro.do",{"userId":id},callback,"json");
}

/**
 * 刷新工作经验列表
 */
function showJobExperience(){
	var showCnts = 2;
	var userId = $("#id").val();
	var callback = function(data){
		if(data.obj.length>0){
			var trs = $("#job_table").html("");
		}
		$.each(data.obj,function(i,item){
			var d = item;
			/*var str = "<b>" + d.startTime + "</b> - <b>" + d.endTime 
				+ "</b> | 就职�?b>" + d.company 
				+ "</b> | 任职<b>"+ d.job + "</b><br/>";*/
			
			if(i<showCnts){
				var str = "<li>"
					+"	<i class='col-xs-3'>"+ d.company +"</i>"
					+"	<i class='col-xs-2'>***部门</i>"
					+"	<i class='col-xs-2'>"+ d.job +"</i>"
					+"	<i class='col-xs-5 text-right'>" + d.startTime + " - " + d.endTime +"</i>"
					+"</li>";
				$("#job_table").append(str);
			}
			if(i==showCnts){
				var str = "<li class='col-xs-12 text-right' onclick='showAll(this)'><a>展开</a></li>";
				$("#job_table").append(str);
			}
			if(i>=showCnts){
				var str = "<li style='display:none;'>"
					+"	<i class='col-xs-3'>"+ d.company +"</i>"
					+"	<i class='col-xs-2'>***部门</i>"
					+"	<i class='col-xs-2'>"+ d.job +"</i>"
					+"	<i class='col-xs-5 text-right'>" + d.startTime + " - " + d.endTime +"</i>"
					+"</li>";
				$("#job_table").append(str);
			}
			
		});
		
		
	};
	$.post("queryJobExperienceByUserId.do",{"userId":userId},callback,"json");
}

function showEduExperience(){
	var showCnts = 2;
	var userId = $("#id").val();
	var callback = function(data){
		if(data.obj.length>0){
			var trs = $("#edu_table").html("");
		}
		$.each(data.obj,function(i,item){
			var d = item;
			/*var str = "<b>" + d.startTime + "</b> - <b>" + d.endTime 
			+ "</b> | 就读�?b>" + d.school 
			+ "</b> | 专业<b>"+ d.mojor + "</b><br/>";*/
			if(i<showCnts){
				var str = "<li>"
					+"	<i class='col-xs-3'>"+ d.school +"</i>"
					+"	<i class='col-xs-2'>"+ d.mojor +"</i>"
					+"	<i class='col-xs-2'>本科</i>"
					+"	<i class='col-xs-5 text-right'>" + d.startTime + " - " + d.endTime +"</i>"
					+"</li>";
				$("#edu_table").append(str);
			}
			if(i==showCnts){
				var str = "<li class='col-xs-12 text-right' onclick='showAll(this)'><a>展开</a></li>";
				$("#edu_table").append(str);
			}
			if(i>=showCnts){
				var str = "<li style='display:none;'>"
					+"	<i class='col-xs-3'>"+ d.school +"</i>"
					+"	<i class='col-xs-2'>"+ d.mojor +"</i>"
					+"	<i class='col-xs-2'>本科</i>"
					+"	<i class='col-xs-5 text-right'>" + d.startTime + " - " + d.endTime +"</i>"
					+"</li>";
				$("#edu_table").append(str);
			}
			
			
		});
		
		
	};
	$.post("queryEduExperienceByUserId.do",{"userId":userId},callback,"json");
}

function showAll(dom){
	$(dom).hide().siblings().show();
}

//function showServiceList(){
//	var userId = $("#id").val();
//	var callback = 
//	$.post("queryServiceDataById.do",{"userId":userId},callback,"json");
//}

function doPageSplit(dom,callback){
	$.pg.param.rows = "10";
	$.pg.param.userId = $("#id").val();
	$.post($(dom).val(),$.pg.param,eval(callback),"json");
}

function doLikeService(id){
	var callback = function(data){
		$("#_firstPage1").click();
	};
	$.post("doLikeProject.do",{"projectId":id,"type": 1},callback,"json");
}

function doLikeProject(id){
	var callback = function(data){
		$("#_firstPage2").click();
	};
	$.post("doLikeProject.do",{"projectId":id,"type": 0},callback,"json");
}

var initSerList = function(data){
	if(data.msgNo=="1"){
		var c = $("#serArea").children();
		$(c).remove();
		$("#totalPage1").text(data.obj.totalCnt);
		var list = data.obj.rows;
		if(list.length==0){
			$("#serArea").append("<p>暂无数据</p>");
		}else{
			$.each(list,function(i,item){
				var d = item;
				
								var str = "";
				var hidUserId = $("#hidUserId").val(); 
				if(hidUserId == d.PUBLISHER){
					str = "<a onclick='bootstrapQ.alert(\"不能购买自己的服务！\")' class='mybtn-primary' disabled='disabled' >购买</a>";
				}else{
					str = "<a class='mybtn-primary' href='toBuyService.do?id="+d.ID+"' title=''>购买</a>";
				}
				
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
				}else{
					_price = "<span class='price'>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>&nbsp;&nbsp;";
				}
				var str2 = "<li>"
					+"	<i class='cell logo w12'>"
					+"		<a href='toService2.do?id="+d.ID+"' target='_blank'>"
					+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
					+"		</a>"
					+"	</i> "
					+"	<i class='cell commpany w30'>"
					+"		<span class='name'>"
					+"			<a href='toService2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a></span>"
					+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无�?��"),20)+"</span>"
					+"			<span class='desc'> </span>"
					+"	</i>"
					+"  <i class='cell round w10'>"+nvl(d.AREA,"未知区域").split(" ")[0] +"</i>"
					+"	<i class='cell round w10'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.BST,"暂无") +"</i>"
					+"	<i class='cell amount w10'> "+ _price +"</i>"
					+"  <i class='cell round w8'>"
					+ str 
					+"  </i>"
					//+"	<i class='cell investor w6'>"
					//+"		<a title='发消息' class='btn btn-default btn-xs' onclick='initMsgDalog(\""+d.PUBLISHER+"\")'><span class='glyphicon glyphicon-envelope'></span></a>"
					//+"	</i>"
					+"  <i class='cell round w10'>" 
					+(d.ISLIKED==0?"<a class='mylink' href='javascript:void(0)' onclick='doLikeService("+d.ID+")'><span class='glyphicon glyphicon-plus p5'></span>收藏</a>":"<label class='label label-success'>已收藏</label>")
					+"	</i>"
					//+"	<i class='cell round w15'><span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE)+Math.round(d.SCORE/5*100)+"%</span></i>"
					+"	<i class='cell date w12'>"+d.PUBLISHTIME+"</i>"
					+"</li>";
				$("#serArea").append(str2);
			});
		}
	}else if(data.msgNo=="2"){
		var c = $("#serArea").children();
		$(c).remove();
		$("#serArea").append("<p style='color:red'>该用户设置了不公开他的服务</p>");
	}else{
		alert(data.obj);
	}
}

/**
 * 定义初始化服务列表的回调函数
 */
var initProList = function(data){
	if(data.msgNo=="1"){
		var c = $("#proListArea").children();
		$(c).remove();
		$("#totalPage2").text(data.obj.totalCnt);
		var d = data.obj.rows;
		if(d.length==0){
			$("#proListArea").append("<p>暂无数据</p>");
		}else{
			$.each(data.obj.rows,function(i,item){
				var d = item;
//				var str = "";
//				if(d.SCHEDULE=='0'){
//					str = "<div class='fRight'><a class='btn btn-default btn-sm'>�?span class='p3'/>�?span class='p3'/>�?/a></div>";
//				}else if(d.SCHEDULE=='1'){
//					str = "<div class='fRight'><a class='btn btn-success btn-sm'>�?span class='p3'/>�?span class='p3'/>�?/a></div>";
//				}else if(d.SCHEDULE=='2'){
//					str = "<div class='fRight'><a class='btn btn-danger btn-sm'>�?span class='p3'/>�?span class='p3'/>�?/a></div>";
//				}else{
//					str = "<div class='fRight'>"
//						/*+ "<a class='btn btn-info btn-sm' href='javaScript:void(0)' title='点击将会发�?私信到创建�?信箱' onclick='queryProjectNeed("+d.ID+")'>加入项目</a>"*/
//						+ "<span class='p5'/><a class='btn btn-info btn-sm' onclick='cbPrj("+d.ID+")'>承包项目</a>"
//						+ "</div>";
//				}
//				}else{
//					str = "<div class='fRight'>"
//						+ "<span class='p5'/><a class='btn btn-info btn-sm' onclick='cbPrj("+d.ID+")'>承包项目</a>"
//						+ "</div>";
//				}
				
				var str = "";
				var hidUserId = $("#hidUserId").val(); 
				if(hidUserId == d.PUBLISHER){
					str = "<a onclick='bootstrapQ.alert(\"不能承接自己的项目！\")' class='mybtn-primary' disabled='disabled' >承接</a>";
				}else{
					str = "<a class='mybtn-primary' href='toUndertakeProject.do?id="+d.ID+"' title=''>承接</a>";
				}
				
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
				}else{
					_price = "<span class='price'>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>&nbsp;&nbsp;";
				}
				
				var str2 = "<li>"
					+"	<i class='cell logo w12'>"
					+"		<a href='toProject2.do?id="+d.ID+"' target='_blank'>"
					+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
					+"		</a>"
					+"	</i> "
					+"	<i class='cell commpany w30'>"
					+"		<span class='name'>"
					+"			<a href='toProject2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a></span>"
					+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
					+"			<span class='desc'> </span>"
					+"	</i>"
					+"	<i class='cell round w10'>"+nvl(d.AREA,"未知地区").split(" ")[0]+"</i>"
					+"	<i class='cell round w10'>"+nvl(d.BUSISMLTYPE,"暂无分类")+"</i>"
					//+"	<i class='cell round w20'>"+nvl(d.bst,"暂无分类")+"</i>"
					+"	<i class='cell amount w10'> "+ _price +"</i>"
					+"	<i class='cell investor w8'>"
					+ str
					+"	</i>"
					//+"	<i class='cell investor w6'>"
					//+"		<a title='发�?站内�? class='btn btn-default btn-xs' onclick='initMsgDalog(\""+d.PUBLISHER+"\")'><span class='glyphicon glyphicon-envelope'></span></a>"
					//+"	</i>"
					+"	<i class='cell investor w10'>" 
					+(d.ISLIKED==0?"<a class='mylink' href='javascript:void(0)' onclick='doLikeProject("+d.ID+")'><span class='glyphicon glyphicon-plus p5'></span>关注</a>":"<label class='label label-success'>已关注</label>") 
					+"	</i>"
					//+"	<i class='cell investor w15'><span class='glyphicon glyphicon-thumbs-up redStar'></span>(<a href='#'>"+d.LIKECNTS+"</a>)</i>"
					+"	<i class='cell date w12'>"+d.PUBLISHTIME+"</i>"
					+"</li>";
				$("#proListArea").append(str2);
			});
		}
	}else{
		alert(data.obj);
	}
};

function queryProSerFriCnts(){
	var userId = $("#id").val();
	
	var callback = function(data){
		if(data.msgNo=="0"){
			alert(data.obj);
		}else{
			var d = data.obj;
			$("#friCnts").text(d.friCnts);
			$("#proCnts").text(d.proCnts);
			$("#serCnts").text(d.serCnts);
		}
	};
	$.post("queryProSerFriCnts.do",{"userId":userId},callback,"json");
}

function setIsFriend(){
	var userId = $("#id").val();
	var userName = "\"" + $("#userName").val() + "\"";
	var callback = function(data){
		if(data.msgNo=="0"){
			alert(data.obj);
		}else{
			if(data.obj){
				$("#isFriend").attr("disabled",true);
				$("#isFriend").html("我的好友");
			}else{
				$("#isFriend").attr("disabled",false);
				$("#isFriend").html("加为好友");
				$("#isFriend").bind("click",function(e){
					addFriend(userId,userName);
				});
			}
		}
	};
	$.post("queryMyFriendByUserId.do",{"userId":userId},callback,"json");
}

function addFriend1(userId){
	var callback = function(data){
		//alert(data.obj);
		bootstrapQ.alert(data.obj);
		setIsFriend();
	};
	$.post("addFriend.do",{"id":userId},callback,"json");
}

function addFriend(id,name)
{	
	bootstrapQ.dialog({
		url: 'pageTo.do?p=friendRequest',
		title: '好友申请',
		msg: "加载中...",
		close : true,
		btn : true,
		okbtn: "发送",
		qubtn : "取消",
		callback : function(){
			//设置默认消息
			$("#friendRequestForm div textarea").val("我是"+name);
		}
	},function()
	{
		var callback = function(data){
			showProgramerList();
			//alert(data.obj);
			//bootstrapQ.alert(data.obj);
			bootstrapQ.msg
			({
				msg: "好友申请已发送，等待对方验证！",
				type: "success",
				time: 2000
			});
		};
		$.post("addFriend.do",{"id":id,"msg": $("#friendRequestForm div textarea").val()},callback,"json");
		return true;
	});
}

function showEmployeeList(){
	$("#employeeList").children().remove();
	$("#employeeList").append("<p>正在查询...</p>");
	$.post("queryCompanyUserRelationList.do?schedule=11",{page: 1,rows: 99999,companyId: $("#id").val()},function(data){
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


function addRelation(id){
	var flag = confirm("确定要预定此服务吗？");
	if(flag){
		var param = {"proId":id,"type":"1"};
		var callback = function(data){
			if(data.msgNo=="1"){
				alert(data.obj);
				showServiceList();
			}
		};
		$.post("addRelation.do",param,callback,"json");
	}
	
}


//评论列表
var initCommentList = function(data){
	var tmp = ['','差评','一般','中评','好评','好评'];
	var $dom = $("#comments");
	$dom.children().remove();
	var pt = data.pt;
	
	
	if(data.msgNo=="1"){
		
		$("#totalPage3").text(data.obj.total);
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
					+'		<img width="30px" height="30px" src="'+$("#basePath").val() + "webPages/upload/headpic/" + d.HEADIMG +'"  onerror="this.src=\'webPages/images/defaultHeadPic.png\'" />'
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
	
};

function addUserComment(){
	//type 0 项目  1 服务 2用户  -----  isReply  0 1级评论  1 二级评论
	bootstrapQ.dialog({
		url : 'comment/toComment.do?type=2&isReply=0&toId='+$("#id").val(),
	    title : '添加评论',
	    msg: '正在加载请稍后...',
	    mstyle: "width:600px;"
	}, function(){
		if(!$("#commentForm").valid()){
			return false;
		}
		$("#commentForm").ajaxSubmit({
	    	dataType: "json",
	    	contentType: "application/x-www-form-urlencoded; charset=utf-8",
	    	data: {
	    		orderId: $("#orderId").val()
	    	},
	    	success: function(data){
	    		if(data.msgNo=="1"){
	    			bootstrapQ.msg({
		    			msg: "添加评论成功！",
		    			type: "success",
		    			time: 2000
		    		});
	    			$("#_firstPage3").click();
	    		}
	    		
	    	},
	    	error: function(data){
	    		bootstrapQ.msg({
	    			msg: "发生了未知的网络错误，评论失败！",
	    			type: "danger",
	    			time: 2000
	    		});
	    	}
	    });
	    return true;
	});
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