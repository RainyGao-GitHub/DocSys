//var cFlag = 0; //决定监控浏览器的部分是否工作，负责下面代码中window.onscroll 和 window.onhashchange做通信

$(function(){
	
	staticfilesPath = $("#staticPath").val();
	
	addToolTip($("#mrt_help"),"资料完整度，请完善您的资料，还可以提高用户排名哦。");
	
	hideAllPanel(true);
	//给左边菜单加点击事件，点击显示指定id的panel
	var lis = $(".hostUl").find("li");
	$(lis).bind('click',function(){
		
		$(lis).each(function(i,item){
			$(item).removeClass('ulActiveGold');
		});
		$(this).addClass('ulActiveGold');
		var a = $(this).children('a');
		var href = $(a).attr('tohref');
		hideAllPanel(false);
		$(href).show();
	});
	
	locateDiv();
	
	showMyIntro();
	
	//让左侧菜单随滚动条同时增加margin-top
	$(window).on("scroll",function(){
		changeFloatPostion();
	})
	
	showMyService();
	//为时间控件添加中文以及格式
	$.fn.datetimepicker.dates['en'] = {
		days: ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"],
		daysShort: ["周日", "周一", "周二", "周三", "周四", "周五", "周六", "周日"],
		daysMin:  ["日", "一", "二", "三", "四", "五", "六", "日"],
		months: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
		monthsShort: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
		today: "今天",
		suffix: [],
		meridiem: ["上午", "下午"]
	};
	
	var dt = $("input[type=dateTime]");
	$(dt).each(function(i,item){
		$(dt).datetimepicker({
			format: 'yyyy-mm-dd',
			autoclose: true,
			minView : 'month',
			showMeridian: true,
			todayBtn:true
		});
	});
	
	createDialog("employeeDialog","新增团队成员","employeeDiaArea");
	
	createDialog("proDemoDialog","新增项目案例","proDemoContent");
	
	var href = window.location.href;
	var index = href.indexOf('myInfo');
	if(index>0){
		$("#myInfoLi").click();
	}else{
		showAllInfo();
	}
	
	var index2 = href.indexOf('myWarning');
	if(index2>0){
		$("#myWarning_link").click();
	}
	
	initPageByType(); //根据登陆的是团队或者企业修改部分页面
	
	pcaId = "pca2";
	queryProvince();
	
	setJob();
	
	changeFloatPostion();
	
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
	
	showMyOrder(0,0);
	$("#buyTypeLi").on("click","i",function(){
		$(this).addClass("active").siblings().removeClass("active");
		
		var v = $(this).attr("value");
		var v2 = $("#statusLi i.active").attr("value");
		showMyOrder(v,v2);
	});
	$("#statusLi").on("click","i",function(){
		$(this).addClass("active").siblings().removeClass("active");
		
		var v2 = $(this).attr("value");
		var v = $("#buyTypeLi i.active").attr("value");
		showMyOrder(v,v2);
	});
	
	$(".ystep").loadStep({
	    //ystep的外观大小
	    //可选值：small,large
	    size: "small",
	    //ystep配色方案
	    //可选值：green,blue
	    color: "green",
	    //ystep中包含的步骤
	    steps: [{
	      //步骤名称
	      title: "开始",
	      //步骤内容(鼠标移动到本步骤节点时，会提示该内容)
	      content: "客户下订单购买服务"
	    },{
	      title: "需求",
	      content: "客户提供需求文档"
	    },{
	      title: "设计",
	      content: "卖家进行设计，评估"
	    },{
	      title: "版本发布",
	      content: "开发中的迭代"
	    },{
	      title: "结束",
	      content: "服务结束"
	    }]
	  });
});

function setMyDropDownEvent(){
	var trs = $(".mydropdown").find("tr");
	$(trs).bind("click",function(e){
		$(trs).each(function(i,item){
			$(item).removeClass("active");
		})
		$(this).addClass("active");
	})
}





function changeFloatPostion(){
//	var mt = $("#myOption").attr('style');
//	//如果滚动已到页脚，要停止增加margin-top
//	if(getScroll().t>($('#myContent').height()-$('#myOption').height())||($('#myOption').height()+mt)>$('#myContent').height()){
//	}else{
//		var t = (getScroll().t-70)>0?(getScroll().t-70):0;
//		$("#myOption").attr('style',"margin-top:"+t+"px;");
//	}
	//var offsetTop_myOption = $("#myOption")[0].offsetTop; //右侧菜单栏顶部距浏览器顶部的距离
	var outHeight_myOption = $("#myOption").outerHeight(); //右侧菜单栏的高度
	var total_height = 100 + outHeight_myOption + 50;
	var footer_top = document.getElementById("footer").getBoundingClientRect().top; //页脚距顶部的距离
	if(footer_top < total_height){
		var top = footer_top - total_height;
		$("#myOption").attr("style","top:"+top+"px;");
	}else{
		$("#myOption").attr("style","");
	}
	
	
	
	
//	moveDiv(100,200);//这里要重新写head.jsp引用的window.onscroll。否则右侧快捷入口不会滚动
}


/**
 * 隐藏所有panel
 * @param isInit 是否是初始化，初始化时不隐藏第一个panel
 */
function hideAllPanel(isInit){
	var panels = $(".panel");
	
	if (isInit){
		$("#myInfoLi").addClass("ulActiveGold");
		$("#myInfo").show();
	}else{
		$(panels).each(function(i,item){
			$(item).hide();
		});
	}
	


	tempStyle = $("#myOption").attr('style');
	$("#myOption").attr('style',"");
}


function locateDiv(){
	var href = window.location.href;
	var tohref = paramsAnalysis(href,'tohref');
	if(tohref!=null){
		hideAllPanel(false);
//		$("#"+tohref).show();
		$("a[tohref='#"+tohref+"']").click();
	}
}

function showMyService(){
	var callback = function(data){
		var data = data.obj;
		var c = $("#myServiceArea").children();
		$(c).remove();
		if(data.length==0){
			$("#myServiceArea").append("<p>暂无数据</p>");
		}
		
		for(var i=0;i<data.length;i++){
			var d = data[i];
			
			var _price = "";
			if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
				_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
			}else{
				_price = "<span class='price'>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>元&nbsp;&nbsp;";
			}
			var se = "<li>"
				+"	<i class='cell logo w12'>"
				+"		<a href='#' target='_blank'>"
				+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
				+"		</a>"
				+"	</i> "
				+"	<i class='cell commpany w25'>"
				+"		<span class='name'>"
				+"			<a href='toService2.do?id="+d.ID+"'>"+d.NAME+"</a></span>"
				+"			<span class='desc'><span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE)+Math.round(d.SCORE/5*100)+"%</span></span>"
				+"			<span class='claim'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.BST,"暂无") +"</span>"
				+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
				+"	</i>"
				+"	<i class='cell amount w20'> "+ _price +"</i>"
				+"	<i class='cell date w18'>"+d.PUBLISHTIME+"</i>"
				+"	<i class='cell industry w25'>"
				+"		<a href='toUpdateService.do?id="+d.ID+"' class='mybtn'>修改</a>"
				+"		<a href='javascript:void(0)' onclick='deleteService("+d.ID+")' class='mybtn-primary'>删除</a>"
				+"	</i>"
				+"</li>";
			
			$("#myServiceArea").append(se);
		}
		
		
	}
	
	$.post("queryMyService.do",null,callback,"json");
}


function showMyProject(){
	try {
		var callback = function(data){
			var data = data.obj;
			var c = $("#myProjectArea").children();
			$(c).remove();
			if(data.length==0){
				$("#myProjectArea").append("<p>暂无数据</p>");
			}
			for(var i=0;i<data.length;i++){
				var d = data[i];
				
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
				}else{
					_price = "<span class='price'>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>元&nbsp;&nbsp;";
				}
				
				var proj = "<li>"
					+"	<i class='cell logo w12'>"
					+"		<a href='#' target='_blank'>"
					+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
					+"		</a>"
					+"	</i> "
					+"	<i class='cell commpany w25'>"
					+"		<span class='name'>"
					+"			<a href='toProject2.do?id="+d.ID+"'>"+d.NAME+"</a></span>"
					+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
					+"			<span class='desc'> </span>"
					+"	</i>"
					+"	<i class='cell round w20'>"+nvl(d.BUSISMLTYPE,"暂无分类")+"</i>"
					+"	<i class='cell amount w10'> "+ _price +"</i>"
					
					+"	<i class='cell investor w6'><span class='glyphicon glyphicon-thumbs-up redStar'></span>(<a href='#'>"+d.LIKECNTS+"</a>)</i>"
					+"	<i class='cell date w12'>"+d.PUBLISHTIME+"</i>"
					+"	<i class='cell investor w15'>"
					+"		<a href='toUpdateProject.do?id="+d.ID+"' class='mybtn'>修改</a>"
					+"		<a href='javascript:void(0);' onclick='deleteProject("+d.ID+")' class='mybtn-primary'>删除</a>"
					+"	</i>"
					+"</li>";
				
				$("#myProjectArea").append(proj);
			}
			
		}
		
		$.post("queryMyProject.do",null,callback,"json");
	} catch (e) {
		e.toString();
	}
	
}

function showMyOrderService(){
	var callback = function(data){
		if(parseInt(data.msgNo)>0){
			var c = $("#myOrderSerArea").children();
			$(c).remove();
			if(data.obj.length==0){
				$("#myOrderSerArea").append("<p>暂无数据</p>");
			}
			$.each(data.obj,function(i,item){
				var d = item;
				var str = "";
				
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "			价格：<span class='price'>面议</span>&nbsp;&nbsp;";
				}else{
					_price = "			价格：<span class='price'>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>元&nbsp;&nbsp;";
				}
				if(d.SCHEDULE=='0'){
					str = "<div class='fRight'><a class='btn btn-default btn-sm'>已<span class='p3'/>申<span class='p3'/>请</a></div>";
				}else if(d.SCHEDULE=='1'){
					str = "<div class='fRight'><a class='btn btn-success btn-sm'>已<span class='p3'/>接<span class='p3'/>受</a></div>";
				}else if(d.SCHEDULE=='2'){
					str = "<div class='fRight'><a class='btn btn-danger btn-sm'>未<span class='p3'/>接<span class='p3'/>受</a></div>";
				}else{
					str = "<div class='fRight'><a class='btn btn-primary btn-sm' href='javaScript:void(0)' title='点击将会发送私信到创建者信箱' onclick='addRelation("+d.ID+")'>预订服务</a></div>";
				}
				var str = "<div class='proj'>"
					+"	<div class='fLeft'>"
					+"		<img src='"+ $("#basePath").val()+ "webPages/upload/service/" + d.PROLOG +"' width='200px' height='130px;' onerror='this.src=\"webPages/images/service.png\"'/>"
					+"	</div>"
					+"	<div class='fLeft projContent-min'>"
					+"		<h4>"
					+"			<a href='toService.do?id="+d.PROJECTID+"' class='canChip'>"+d.NAME+"</a>"
					+"			<span title='服务类型' class='label label-warning font-12'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.BUSISMLTYPE,"暂无") +"</span>"
					+	str
					+"			<div class='clear'></div>"
					+"		</h4>"
					+"		<div id='discribe' class='p10'>"
					+"			<p><span style='color:blue'>服务简介:</span>"+d.INTRO+"</p>  "
					+"		</div>"
					+"		<div>"
					+"			发布人:<a href='toProgramer.do?id="+d.PUBLISHER+"'>"+d.NICKNAME+"</a>&nbsp;&nbsp;"
					+_price
					+"评论(<a href='toService.do?id="+d.ID+"#leaveMsgBoard'>"+d.COMMENTNUM+"</a>)&nbsp;&nbsp;发布日期:"+d.PUBLISHTIME+"&nbsp;&nbsp;"
					+"			<span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE)+"好评率:"+Math.round(d.SCORE/5*100)+"%</span>"
					+"			"
					+"		</div>"
					+"	</div>"
					+"	<div class='clear'></div>"
					+"</div>";
				
				$("#myOrderSerArea").append(str);
			});
		}else{
			alert("获取数据失败，请稍后重试！");
		}
	}
	
	$.post("queryMyOrderServiceData.do",null,callback,"json");
}

function showMyOrderProject(){
	var callback = function(data){
		if(parseInt(data.msgNo)>0){
			var c = $("#myOrderProArea").children();
			$(c).remove();
			if(data.obj.length==0){
				$("#myOrderProArea").append("<p>暂无数据</p>");
			}
			$.each(data.obj,function(i,item){
				var d = item;
				var schedule = "";
				if(d.SCHEDULE=='0'){
					schedule = "<div class='fRight'><a class='btn btn-default btn-sm'>已<span class='p3'/>申<span class='p3'/>请</a></div>";
				}else if(d.SCHEDULE=='1'){
					schedule = "<div class='fRight'><a class='btn btn-success btn-sm'>已<span class='p3'/>接<span class='p3'/>受</a></div>";
				}else if(d.SCHEDULE=='2'){
					schedule = "<div class='fRight'><a class='btn btn-danger btn-sm'>未<span class='p3'/>接<span class='p3'/>受</a></div>";
				}
				
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "			项目预算：<span class='price'>面议</span>&nbsp;&nbsp;";
				}else{
					_price = "			项目预算：<span class='price'>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>元&nbsp;&nbsp;";
				}
				var str = "<div class='proj'>"
					+"	<div class='fLeft'>"
					+"		<img src='"+ $("#basePath").val()+ "webPages/upload/project/" + d.PROLOG +"' width='200px' height='130px;' onerror='this.src=\"webPages/images/project.jpg\"'/>"
					+"	</div>"
					+"	<div class='fLeft projContent-min'>"
					+"		<h4>"
					+"			<a href='toProject.do?id="+d.PROJECTID+"' class='canChip'>"+d.NAME+"</a>"
					+"			<span title='项目分类' class='label label-warning font-12'>"+nvl(d.BUSISMLTYPE,"暂无分类")+"</span>"
					+ 	schedule
					+"			<div class='clear'></div>"
					+"		</h4>"
					+"		<div id='discribe' class='p10'>"
					+"			<p><span style='color:blue'>服务简介:</span>"+d.INTRO+"</p>  "
					+"		</div>"
					+"		<div>"
					+"			发布人:<a href='toProgramer.do?id="+d.PUBLISHER+"'>"+d.NICKNAME+"</a>&nbsp;&nbsp;"
					+_price
					+"			<a title='点赞可以提高项目排名哦，喜欢就推荐给大家吧。' href='#'>"
					+"			<span class='glyphicon glyphicon-thumbs-up redStar'></span>("+d.LIKECNTS+")"
					+"			</a>&nbsp;&nbsp;"
					+"			发布日期:"+d.PUBLISHTIME
					+"		</div>"
					+"	</div>"
					+"	<div class='clear'></div>"
					+"</div>";
				
				$("#myOrderProArea").append(str);
			});
		}else{
			alert("获取数据失败，请稍后重试！");
		}
	}
	$.post("queryMyOrderProjectData.do",null,callback,"json");
}

function addRelation(id){
	var flag = confirm("确定要申请加入项目吗？");
	if(flag){
		var param = {"proId":id,"type":"0"};
		var callback = function(data){
			alert(data.obj);
			if(data.msgNo=="1"){
				queryProjectListData()
			}
		}
		$.post("addRelation.do",param,callback,"json");
	}
	
}

function showMyLikeProject(){
	
	var callback = function(data){
		if(parseInt(data.msgNo)>0){
			var c = $("#myLikeProArea").children();
			$(c).remove();
			if(data.obj.length==0){
				$("#myLikeProArea").append("<p>暂无数据</p>");
			}
			$.each(data.obj,function(i,item){
				var d = item;
				var href = "javascript:void(0)";
				var schedule = "";
				var str = "";
				if(d.SCHEDULE=='0'){
					str = "<div class='fRight'><a class='btn btn-default btn-sm'>已<span class='p3'/>申<span class='p3'/>请</a></div>";
				}else if(d.SCHEDULE=='1'){
					str = "<div class='fRight'><a class='btn btn-success btn-sm'>已<span class='p3'/>接<span class='p3'/>受</a></div>";
				}else if(d.SCHEDULE=='2'){
					str = "<div class='fRight'><a class='btn btn-danger btn-sm'>未<span class='p3'/>接<span class='p3'/>受</a></div>";
				}else{
					str = "<div class='fRight'>"
						/*+ "<a class='btn btn-info btn-sm' href='javaScript:void(0)' title='点击将会发送私信到创建者信箱' onclick='queryProjectNeed("+d.ID+")'>加入项目</a>"*/
						+ "<span class='p5'/><a class='btn btn-info btn-sm' onclick='cbPrj("+d.ID+")'>承包项目</a>"
						+ "</div>";
				}
//				}else{
//					str = "<div class='fRight'>"
//						+ "<span class='p5'/><a class='btn btn-info btn-sm' onclick='cbPrj("+d.ID+")'>承包项目</a>"
//						+ "</div>";
//				}
				var hidUserId = $("#hidUserId").val(); 
				if(hidUserId == d.PUBLISHER){
					str = "<div class='fRight' title='不能承包自己的项目'><a class='btn btn-info btn-sm' disabled='disabled' >承包项目</a></div>";
				}
				console.log("a:"+schedule);
				
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "<span class='price'>面议</span>";
				}else{
					_price = "<span class='price'><i class='glyphicon glyphicon-yen'></i>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>";
				}
				
				var proj = "<li>"
					+"	<i class='cell logo w12'>"
					+"		<a href='#' target='_blank'>"
					+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
					+"		</a>"
					+"	</i> "
					+"	<i class='cell commpany w25'>"
					+"		<span class='name'>"
					+"			<a href='toProject2.do?id="+d.ID+"'>"+d.NAME+"</a></span>"
					+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
					+"			<span class='desc'> </span>"
					+"	</i>"
					+"	<i class='cell round w10'>"+nvl(d.BST,"暂无分类")+"</i>"
					+"	<i class='cell amount w17'> "+ _price +"</i>"
					
					+"	<i class='cell round w6'>关注("+d.LIKECNTS+")</i>"
					+"	<i class='cell date w15'>"+d.PUBLISHTIME+"</i>"
					+"	<i class='cell investor w15'><a class='mybtn-primary'>承接</a></i>"	
					+"</li>";
				
				$("#myLikeProArea").append(proj);
			});
		}else{
			$("#myLikeProArea").append("获取数据失败，请稍后重试！");
		}
	}
	$.post("findMyLikeProjectData.do",{"type": 0},callback,"json");
}

function showMyLikeService(){
	var callback = function(data){
		if(parseInt(data.msgNo)>0){
			var c = $("#myLikeSerArea").children();
			$(c).remove();
			if(data.obj.length==0){
				$("#myLikeSerArea").append("<p>暂无数据</p>");
			}else{
				$.each(data.obj,function(i,item){
					var d = item;
					
					var _price = "";
					if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
						_price = "<span class='price'>面议</span>";
					}else{
						_price = "<span class='price'><i class='glyphicon glyphicon-yen'></i>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>";
					}
					
					var proj = "<li>"
						+"	<i class='cell logo w12'>"
						+"		<a href='#' target='_blank'>"
						+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
						+"		</a>"
						+"	</i> "
						+"	<i class='cell commpany w35'>"
						+"		<span class='name'>"
						+"			<a href='toService2.do?id="+d.ID+"'>"+d.NAME+"</a></span>"
						+"			<span class='desc'><span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE)+Math.round(d.SCORE/5*100)+"%</span></span>"
						+"			<span class='claim'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.BST,"暂无") +"</span>"
						+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
						+"	</i>"
						+"	<i class='cell amount w17'> "+ _price +"</i>"
						
						+"	<i class='cell round w6'>收藏("+d.LIKECNTS+")</i>"
						+"	<i class='cell date w15'>"+d.PUBLISHTIME+"</i>"
						+"	<i class='cell investor w15'><a class='mybtn-primary'>购买</a></i>"	
						+"</li>";
					
					$("#myLikeSerArea").append(proj);
					
				})
			}
			
		}else{
			$("#myLikeSerArea").append("获取数据失败，请稍后重试！");
		}
	}
	
	$.post("findMyLikeServiceData.do",{"type": 1},callback,"json");
}

/**
 * 项目案例
 */
function showProDemo(){
	var callback = function(data){
		$("#projectDemoListArea").children().remove();
		if(data.msgNo==1){
			$.each(data.obj, function(i,item){
				var html = '<div style="width:20%;float: left;padding: 10px;text-align: center;">'
					+'<img width="150vw" height="150vw" class="img-rounded" src="'+item.logo+'" onerror="this.src=\'webPages/images/project.jpg\'" />'
					+'<h5 class="text-center no-wrap" title="'+item.title+'">'+item.title+'</h5>'
					+'</div>';
				$("#projectDemoListArea").append(html);
				
			})
		}else{
			setMsg("danger#查询项目案例数据失败！");
		}
		var d = data.obj;
	}
	
	$.post("projectDemo/getProjectDemoList.do",null,callback,"json");
}

function showMyOrder(buyType,status){
	var _orderStatus = ['待接单/待确认','待确认 ','待服务/服务中','待确认','已完成']
	var $dom = $("#orderList");
	$dom.children().remove();
	$dom.append("<p>正在查询...</p>");
	var callback = function(data){
		$dom.children().remove();
		if(data.msgNo=='1'){
			if(data.obj.totalCnt>0){
				var list = data.obj.rows;
				var html = "";
				$.each(list,function(i,item){
					console.log(item);
					var d = item;
					html += '<li>'
						+'	<i class="cell logo w12">'
						+'<img width="50px" height="50ox" src="' + $("#basePath").val()+ "webPages/upload/headpic/" + d.HEADIMG +'" onerror="this.src=\'webPages/images/defaultHeadPic.png\'">'
						+'		<div>'+d.NAME+'</div>'
						+'	</i>'
						+'	<i class="cell commpany">'
						+'		<span class="name"><a href="toOrderDetail.do?orderId='+d.ID+'&type='+d.TYPE+'">'+d.RESOURCE_NAME+'</a></span>'
						+'		<span class="desc">'
						+		cutLongTxt(d.RESOURCE_INTRO,50)
						+'		</span>'
						+'		'
						+'		<span class="amount">价格：'+d.PRICE+'元</span>'
						+'		<span class="desc">'
						+'			<a class="fLeft" style="margin-top: 20px;font-size: 14px;">进度：</a>'
						+'			<div class="ystep"></div>'
						+'		</span>'
						+'	</i>'
						+'	<i class="cell investor w10">'
						+'		<label class="label label-info label-large">'+_orderStatus[d.STATUS]+'</label>'
						+'	</i>'
						+'	<i class="cell investor w10">'
						+'		<a class="mybtn">联系对方</a>'
						+'	</i>'
						+'</li>'
				});
				$dom.append(html);
			}else{
				$dom.append("<p>暂无数据</p>");
			}
		}else{
			$dom.append("<p>查询订单数据失败.</p>");
		}
		
	}
	
	$.post("order/queryOrderList.do",{"buyType":buyType,"status":status},callback,"json");
}

function showMyAmount(){
	
}

function showMyFriend(){
	var callback = function(data){
		var c = $("#myFriendArea").children();
		$(c).remove();
		if(data.obj.length==0){
			$("#myFriendArea").append("<p>暂无数据</p>");
			return;
		}
		$.each(data.obj,function(i,item){
			var d = item;
			var str = "<li>"
				+"	<i class='cell logo w15'>"
				+"		<a href='#' target='_blank'>"
				+"			<span class='incicon'><img src='" + $("#basePath").val()+ "webPages/upload/headpic/" + d.HEADIMG +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"'></span>"
				+"		</a>"
				+"	</i> "
				+"	<i class='cell commpany w20'>"
				+"		<span class='name'>"
				+"			<a href='toUserDetail2.do?id="+ d.ID +"'>"+d.NICKNAME+"</a></span>"
				+"			<span class='desc'>"+ nvl(d.AREA,"未知") +"</span>"
				+"			<span class='desc'>"+ getJob(d.JOB).main_job+"/"+getJob(d.JOB).sub_job +"</span>"
				+"	</i>"
				+"	<i class='cell commpany w40'>" + cutLongTxt(nvl(d.INTRO,"暂无简介"),50) +"</i>"
				+"	<i class='cell investor w15'>"
				+"		<a title='发送站内信' class='mybtn' onclick='initMsgDalog(\""+d.ID+"\")'><span class='glyphicon glyphicon-envelope'></span></a>"
				+"	</i>"
				+"	<i class='cell investor w10'>"
				+"	<a class='mybtn-primary' href='javaScript:void(0)' onclick='deleteFriend("+d.ID+",\""+d.NICKNAME+"\")'>删除好友</a>"
				+"	</i>"
				+"</li>";
			$("#myFriendArea").append(str);
		})
		
	}
	$.post("findMyFriendData.do",null,callback,"json");
}


function showAllMsg(){
	showMyMessages();
	showSysMessages();
}

function showMyMessages(){
	
	var msg_name = $("#msg_name").val();
	var param = {};
	if(msg_name!=null&&msg_name!=undefined&&msg_name.trim()!=""){
		param.name = msg_name;
	}
	
	
	var callback = function(data){
		$("#msgDataArea").children().remove();
		if(data.msgNo!="1"){
			alert(data.obj);
		}else{
			if(parseInt(data.obj.total)==0){
				var str = "<div><p class='p10'>暂无用户消息</p></div>";
				$("#msg_content").append(str);
			}else{
				$.each(data.obj.rows,function(i,item){
					var d = item;
					var noReadNum = "";
					if(parseInt(d.NOREADNUM)>0){
						noReadNum += "<span class='badge fRight msgTip' style='position: absolute;background-color: red;margin-left: -12px;margin-top: -5px;' title='"+d.NOREADNUM+"条未读消息'>"+d.NOREADNUM+"</span>";
					}
					if(d.SENDTIME==null||d.SENDTIME==undefined){
						d.SENDTIME = "";
						d.CONTENT = "<span style='color:cornflowerblue'>ta还没有给您发送过消息哦</span>";
					}
					
					str = '<li>'
						+'	<i class="cell logo">'
						+'		<a href="toUserDetail2.do?id='+d.REID+'">'
						+'			<span class="incicon"><img src="'+ $("#basePath").val()+ 'webPages/upload/headpic/' + d.HEADIMG +'" onerror="this.src=\'webPages/images/defaultHeadPic.png\'">'+noReadNum+'</span>'
						+'		</a>'
						+'	</i> '
						+'	<i class="cell commpany">'
						+'		<span class="name">'
						+'			<a href="toUserDetail2.do?id='+d.REID+'">'+d.NICKNAME+'</a></span>'
						+'			<span class="desc">'+d.CONTENT+'</span>'
						+'	</i>'
						+'	<i class="cell date">'+nvl(d.SENDTIME,'')+'</i>'
						+'	<i class="cell investor"><a title="发送站内信" class="mybtn" onclick="initMsgDalog(\''+d.REID+'\')"><span class="glyphicon glyphicon-envelope"></span></a></i>'
						+'</li>';
					$("#msgDataArea").append(str);
					
				});
				
			}
		}
	}
	$.post("queryTalkerList.do",param,callback,"json");
}

function showSysMessages(){
	var startTime = $("#msgStartTime").val();
	var param = {};
	if(startTime!=null&&startTime!=undefined&&startTime.trim()!=""){
		param.startTime = startTime;
	}
	
	var callback = function(data){
		var c = $("#sysMsgArea").children();
		$(c).remove();
		if(data.msgNo!="1"){
			alert(data.obj);
		}else{
			if(data.obj.length==0){
				var str = "<p>暂无系统消息</p>";
				$("#sysMsgArea").append(str);
			}else{
				$.each(data.obj,function(i,item){
					var d = item;
					var str = "<div>"
						+"<span>"+d.SENDTIME+"</span>"
						+"<p>"+d.CONTENT+"</p>"
						+"</div>";
					$("#sysMsgArea").append(str);
				});
			}
		}
		
		
	}
	
	$.post("querySysMessages.do",param,callback,"json");
}


var inputs = [];
var qyImgInputs = [];
var qyzzInputs = [];
function showAllInfo(){
	inputs = [];
	showMyInfo();
	
	var c = $("#qyImgForComputeScore").children();
	var qyImgInputs_tmp = [];
	$(c).each(function(i,item){
		qyImgInputs_tmp.push($(item).val());
	});
	
	//是否有企业形象照片
	qyImgInputs = qyImgInputs_tmp;
	changeIconAndColor("qyPic_i", qyImgInputs_tmp);
	
	var type = $("#hidType").val();
	if(type=="3"){
		//是否有企业执照
		var qyzzInputs_tmp = [];
		qyzzInputs_tmp.push($("#qyzzForComputeScore").val());
		qyzzInputs = qyzzInputs_tmp;
		changeIconAndColor("qyzz_i", qyzzInputs_tmp);
	}
	
	showEmployeeList();
}

var SCORE2 = 0; //记录资料完整度
function computeScores(){
	inputs = [];
	inputs.push(myInfo_inputs);
	inputs.push(myIntro_inputs);
	inputs.push(qyImgInputs);
	inputs.push(e_input);
	inputs.push(qyzzInputs);
	var score1 = 0;
	$.each(inputs,function(i,item){
		$.each(item,function(j,item2){
//			if(item2==null||item2==undefined||item2==""){
//			}else{
			if(item2!=null&&item2!=undefined&&item2.length>0){
				score1++;
			}
//			}
		})
	});
	
	var type = $("#hidType").val();
	var score2 = 0;
	if(type=="2"){
		score2 = parseFloat(Math.round((score1/14)*100));
	}else{
		score2 = parseFloat(Math.round((score1/15)*100));
	}
	
	
	SCORE2 = score2;
	setProgress();
}

/**
 * 修改进度条
 */
function setProgress(){
	SCORE2 = SCORE2>100?100:SCORE2;
	var p = $("#progress-bar");
	$(p).attr("aria-valuenow",SCORE2);
	$(p).attr("style","width:"+SCORE2+"%");
	$(p).text(SCORE2+"%");
}

/**
 * 根据后台传回来的数据确定资料是否完整
 * @param id
 * @param list
 */
function changeIconAndColor(id,list){
	var flag = true;
	$.each(list,function(i,item){
		if(item==null||item==undefined||item==""){
			flag = false;
		}
	})
	var a = $("#"+id);
	var i = $(a).find("i");
	$(i).remove();
	if(flag&&list.length>0){
		$(a).prepend("<i class='li_img li_img_success glyphicon glyphicon-ok'></i>");
	}else{
		$(a).prepend("<i class='li_img li_img_error glyphicon glyphicon-exclamation-sign'></i>");
	}
	computeScores();
}

var myInfo_inputs = [];
var myIntro_inputs = [];
/**
 * 查找我的信息
 */
function showMyInfo(){
	
	var callback = function(data){
		if(parseInt(data.msgNo)==0){
			showAjaxMsg(data);
		}else{
			var u = data.obj;
			var myInfo_inputs_tmp = [];
			var myIntro_inputs_tmp = [];
			var myDetail_inputs = [];
			var phone_inputs = [];
			var email_inputs = [];
			
			
			myInfo_inputs_tmp.push(u.email);
			myInfo_inputs_tmp.push(u.nickName);
			myInfo_inputs_tmp.push(u.area);
			myInfo_inputs_tmp.push(u.headImg);
			myInfo_inputs_tmp.push($("#address").val());
			myInfo_inputs_tmp.push($("#hostUrl").val());
			myInfo_inputs_tmp.push($("#contact").val());
			myInfo_inputs_tmp.push($("#conTel").val());
			myInfo_inputs_tmp.push(u.emailAvailable=='1'?'1':null);
			myInfo_inputs_tmp.push(u.phoneAvailable=='1'?'1':null);
			myDetail_inputs.push(u.detailIntro);
			phone_inputs_tmp.push(u.phoneAvailable=='1'?'1':null);
			email_inputs_tmp.push(u.emailAvailable=='1'?'1':null);
			
			myIntro_inputs_tmp.push(u.intro);

			
			
			changeIconAndColor("myInfo_i",myInfo_inputs_tmp);
			changeIconAndColor("myIntro_i",myIntro_inputs_tmp);
			changeIconAndColor("myDetails_i",myDetail_inputs);
			changeIconAndColor("phone_i",phone_inputs);
			changeIconAndColor("email_i",email_inputs);
			
			
			//电子邮箱
			$("#myEmail").val(u.email);
			//真实姓名
			$("#nickName").val(u.nickName);
			//性别
			$("#sex").val(u.sex);
			//居住地
			pcaId = "pca";
			if(u.area!=null&&u.area!=undefined){
				setPCA(u.area.substring(0,2)+"0000",u.area.substring(0,4)+"00",u.area);
			}else{
				queryProvince();
			}
			var hImg = $("#basePath").val() + "webPages/upload/headpic/" + u.headImg;
			console.log(hImg);
			$("#imgPreView").attr("src",hImg);
			//个人简介
			var intro = u.intro;
			if(intro!=null&&intro!=undefined){
				intro = intro.split("<br>").join("\n");
				intro = intro.split("<nbsp>").join(" ");
			}
			$("#user_intro").val(intro);
			ue.setContent(u.detailIntro);
			//用户id
			$("#id").val(u.id);
			
		}
	}
	$.post("queryMyInfo.do",null,callback,"json");
}

function showMyStatus(){
	var callback = function(data){
		var d = data.obj;
		initCb("cb1",d.currentStatus);
		initCb("cb2",d.showService);
	}
	$.post("queryMyIntro.do",null,callback,"json");
}

function submitMyInfo(){
//	var callback = function(data){
//		alert(data.obj);
//	}
//	var param = $('#myInfoForm').serialize();
//	//由于serialize方法会调用encodeURIComponent()将中文转码。下面调用decode保持正常格式。防止中文乱码
//	param = decodeURIComponent(param,true); 
//    var jparam = changeUrlParamsToJson(param);
//    
//	$.post("updateMyInfo.do",jparam,callback,"json");
	$("#myInfoForm").submit();
}

function submitIntro(){
	var callback = function(data){
		if(data.msgNo=="1"){
			alert("更新简介信息成功！");
		}else{
			alert("更新简介信息失败！");
		}
	}
	var uId = $("#id").val();
	var intro = $("#user_intro").val();
	intro = intro.replace(/[\n\r]/g,"<br>").replace(/[ ]/g,"<nbsp>"); 
	$.post("updateMyInfoAjax.do",{"id":uId,"intro":intro},callback,"json");
}

function submitMyDetailIntro(){
	var callback = function(data){
		if(data.msgNo=="1"){
			alert("更新详细信息成功！");
		}else{
			alert("更新详细信息失败！");
		}
	}
	var uId = $("#id").val();
	var detail = ue.getContent();
	$.post("updateMyInfoAjax.do",{"id":uId,"detailIntro":detail},callback,"json");
}

function getvalicode(dom){
	var tel = $("#valiTel").val();
	
	var flag = valicate(tel,"_tel");
	if(flag){
		getValiCode(tel); //commonJs中的方法
		$(dom).attr("disabled","disabled");
		$(dom).attr("second","60");
		remainTime();
	}else{
		alert("您填写的手机号格式不正确！");
	}
}

function remainTime(){
	var i = $('#valiCodeBtn').attr("second");
    document.getElementById('valiCodeBtn').value = --i + "s后可重发"; 
    $('#valiCodeBtn').attr("second",i);
    var t = setTimeout("remainTime()",1000);
    if(i==0){
    	clearTimeout(t);
    	$('#valiCodeBtn').removeAttr("disabled");
    	$('#valiCodeBtn').val("发送验证码");
    }
} 


function submitPhoneCode(){
	var callback = function(data){
		if(data.msgNo=="1"){
			bootstrapQ.msg({
				msg: '绑定手机成功！',
				type: 'success',
				time: 2000
			});
			window.location.href = "pageTo.do?p=myHostPage&toHref=myInfo#bindPhone&t="+Math.random()*1000000;
		}else{
			bootstrapQ.msg({
				msg: '绑定手机失败！',
				type: 'danger',
				time: 2000
			});
		}
	}
	postFormByAjax("phoneCodeForm",null,callback);
	
}

function submitEmailActive(){
	var callback = function(data){
		if(data.msgNo=="1"){
			bootstrapQ.msg({
				msg: '验证邮件已发送，请登录邮箱查收。',
				type: 'success',
				time: 2000
			});
			window.location.href = "pageTo.do?p=myHostPage&toHref=myInfo#bindEmail&t="+Math.random()*1000000;
		}else{
			bootstrapQ.msg({
				msg: '验证邮件已发送失败！',
				type: 'danger',
				time: 2000
			});
		}
	}
	postFormByAjax("emailCodeForm",null,callback);
}



function deleteFriend(id,name){
	var flag = confirm("确定要删除好友"+name+"吗？");
	if(flag){
		var callback = function(data){
			showAjaxMsg(data);
			showMyFriend();
		}
		$.post("deleteFriend.do",{"id":id},callback,"json");
	}else{
		return;
	}
}
/**
 * 删除服务
 * @param id
 */
function deleteService(id){
	var flag = confirm("确定要删除这条服务吗？");
	if(flag){
		var callback = function(data){
			showAjaxMsg(data);
			showMyService();
		}
		$.post("deleteService.do",{"id":id},callback,"json");
	}else{
		return;
	}
}

/**
 * 删除项目
 * @param id
 */
function deleteProject(id){
	var flag = confirm("确定要删除这个项目吗？");
	if(flag){
		var callback = function(data){
			showAjaxMsg(data);
			showMyProject();
		}
		$.post("deleteProject.do",{"id":id},callback,"json");
	}else{
		return;
	}
}

/**
 * 提交新增修改工作经验或者教育经验
 * @param diaId
 */
function clickButton(diaId){
	var form;
	if(diaId=="employeeDialog"){
		form = $("#"+diaId).find("form[abled]");
	}else{
		form = $("#"+diaId).find("form");
	}
	var form_attr = $(form).attr("enctype");
	var formId = $(form).attr("id");
	if(!formAjaxSubmitCheck(formId)){
		return;
	}
	$(form).ajaxSubmit({
		dataType: "json",
		success: function(data){
			showAjaxMsg(data);
			$(".modal.in").modal("hide");
			$("#employee_name").val("");
			eval($(form).attr("onsuccess"));
		},
		error: function(data){
			showAjaxMsg(data);
		}
	});
}



//处理form中的多选框
function setAllChecked(cb0,formId){
	var cbs = $("#"+formId).find("[type=checkbox]:gt(0)");
	if(cb0.checked){
		for(var i=0;i<cbs.length;i++){
			cbs[i].checked = true;
		}
	}else{
		for(var i=0;i<cbs.length;i++){
			cbs[i].checked = false;
		}
	}
	
}

function changeMyStatus(dom){
	var val = $(dom).val();
	var btn = $(dom).next();
	var callback = function(data){
		showAjaxMsg(data);
		$(btn).attr("disabled",false);
	}
	$.post("updateMyInfoAjax.do",{"currentStatus":val},callback,"json");
}

function changeIsServiceShow(dom){
	var val = $(dom).val();
	var btn = $(dom).next();
	var callback = function(data){
		showAjaxMsg(data);
		$(btn).attr("disabled",false);
	}
	$.post("updateMyInfoAjax.do",{"showService":val},callback,"json");
}

//============================== 选择职业的联动框 ================================================
function setJob(){
	var c = $("#cJob").children();
	$(c).remove();
	$("#cJob").append("<option value='0'>请选择</option>");
	$(main_menu).each(function(i,item){
		$("#cJob").append("<option value='"+item[0]+"'>"+item[1]+"</option>");
	});
	$("#cJob").change();
}

function setJob2(dom){
	var bt1 = $(dom).val();
	var c = $("#cJob2").children();
	$(c).remove();
	$("#cJob2").append("<option value='0'>请选择</option>");
	$(second_menu).each(function(i,item){
		if(item[0]==bt1){
			$("#cJob2").append("<option value='"+item[1]+"'>"+item[2]+"</option>");
		}
	});
}


//============================= 选择行业的联动框 ================================================
function setBusitype(){
	var c = $("#busiType").children();
	$(c).remove();
	$("#busiType").append("<option value='0'>请选择</option>");
	$(ParentVocation).each(function(i,item){
		
		$("#busiType").append("<option value='"+item[0]+"'>"+item[1]+"</option>");
	})
}

function setBusiType2(dom){
	var bt1 = $(dom).val();
	var c = $("#busiType2").children();
	$(c).remove();
	var key = bt1.split("~");
	$("#busiType2").append("<option value='0'>请选择</option>");
	for(var i=key[0]-1;i<=key[1]-1;i++){
		$("#busiType2").append("<option value='"+Vocation[i][0]+"'>"+Vocation[i][1]+"</option>");
	}
	
}

function initPageByType(){
	var type = $("#hidType").val();
	switch (type) {
	case "2":
		$("#intro_title").text("团队简介");
		$("#qyzz_i").remove();
		$("#qyzz").remove();
		break;
	case "3":
		$("#intro_title").text("企业简介");
		$("#wr_creater").text("法定代表人");
		initQyzz();
		break;
	default:
		break;
	}
}

/**
 * 创建项目是添加图片描述上滑或者下滑输入框
 * 
 * @param {Object} a
 */
function showImgDescripe(a){
	var desDiv = $(a).parent();
	var isbottom = $(desDiv).attr("isbottom");
	if(isbottom==1){
		$(desDiv).animate({
			'top' : "-100px",
			 opacity: 1
			},300,function(){
			var ta = $(desDiv).children("textarea");
			$(ta)[0].focus();
		});
		$(desDiv).attr("isbottom",'0');
	}else{
		$(desDiv).animate({
			'top' : "-33px",
			 opacity: 0.7
			},300);
		$(desDiv).attr("isbottom",'1');
		var ta = $(desDiv).children("textarea");
		var text = $(ta).val();
		
		if(text.length>0){
			var p = $(ta).prev();
			$(p).text(text.length>10?(text.substring(0,10)+'...'):text);
		}
	}
}

function showDropDown(dom){
	var menu = $(dom).nextAll(".mydropdown");
	$(menu).show();
	$("#_firstPage1").click();
	
}

function hideDropDown(){
	$(".mydropdown").hide();
}

function comfirmEmployee(){
	var tr = $("#employeeTable").find("tr.active");
	if($(tr).size()!=1){
		alert("请选择您要邀请的用户。");
	}else{
		$("#employee_name").val($($(tr).find("td[id=nickName]")).html());
		$("#employee_job").val($($(tr).find("td[id=job]")).html());
		$("#employee_area").val($($(tr).find("td[id=area]")).html());
		$("#employee_userId").val($($(tr).find("input[id=userId]")).val());
		hideDropDown();
	}
	
}

function doPageSplit(dom,callback){
	$.pg.param.name = $("#employee_name").val();
	$.pg.param.companyId = $("#_companyId").val();
	$.post($(dom).val(),$.pg.param,eval(callback),"json");
}

/**
 * 查询可回调函数
 * @param data
 */
function initEmployee(data){
	var trs = $("#employeeTable").children();
	var d = data.obj;
	$(trs).remove();
	var str = "<p>暂无数据</p>";
	if(data.msgNo == '0'){
		alert(data.msg);
		$("#employeeTable").append(str);
	}else if(d.totalCnt=="0"){
		str = "<p>暂无数据</p>";
		$("#employeeTable").append(str);
	}else{
		$("#totalPage").text(d.totalCnt);
		$.each(d.rows,function(i,item){
			str = "<tr>"
				+"	<td name='headImg'>"
				+"		<img width='50px' height='50px' src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + item.headImg +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"'/>"
				+"	</td>"
				+"	<td id='nickName'>"+item.nickName+"</td>"
				+"	<td id='area'>"+item.area+"</td>"
				+"	<td id='job'>"+getJob(item.job).main_job+"/"+getJob(item.job).sub_job+"</td>"
				+"	<input type='hidden' id='userId' value='"+ item.id +"'/>"
				+"</tr>";
			$("#employeeTable").append(str);
		})
		setMyDropDownEvent();
	}
	
	
}

function addOrUpdateEmployee(option){
	//初始化清除数据
	$("#employee_name").val("");
	$("#employee_job").val("");
	$("#employee_area").val("");
	$("#employee_id").val("");
	$("#employee_mark").val("");
	
	$("#capImg").attr("src","");
	$("#capName").val("");
	$("#capMark").val("");
	queryProvince();
	setJob();
	
	switch (option) {
	case 'add':
		$("#addp_ul").show();
		var title = $("#employeeDialog").find("#myModalLabel");
		$(title).text("新增团队成员");
		$("#employee_option").val("add");
		$("#hid_capOption").val("add");
		$("#employee_name").removeAttr("disabled");
		$('#employeeDialog').modal('show');
		break;
	case 'update':
		var title = $("#employeeDialog").find("#myModalLabel");
		$(title).text("修改团队成员信息");
		$("#employee_option").val("update");
		$("#hid_capOption").val("update");
		$("#employee_name").attr("disabled","disabled");
		
		var trs = $("#employee_table").find("[name=ids][type=checkbox]");
		var j = 0;
		var id = null;
		var _id = null;
		$(trs).each(function(i,item){
			if(trs[i].checked){
				j++;
				id = $(item).val();
				_id = $($(item).next()).val();
			}
		})
		if(j==0){
			alert("请先选中要修改的行");
		}else if(j>1){
			alert("修改时只能选中其中一行");
		}else{
			var callback = function(data){
				var d = data.obj;
				$("#employee_name").val(d.nickName);
				$("#employee_job").val(getJob(d.job).main_job+"/"+getJob(d.job).sub_job);
				$("#employee_area").val(d.area);
				$("#employee_id").val(d.employeeId);
				$("#employee_userId").val(d.id);
				$("#employee_mark").val(d.mark);
			}
			
			var callback2 = function(data){
				var d = data.obj;
				$("#capImg").attr("src",$("#basePath").val()+ "webPages/upload/headpic/" + d.headImg);
				$("#capName").val(d.name);
				$("#capMark").val(d.mark);
				$("#hid_capId").val(d.id);
				//居住地
				pcaId = "pca2";
				if(d.area!=null&&d.area!=undefined){
					setPCA(d.area.substring(0,2)+"0000",d.area.substring(0,4)+"00",d.area);
				}else{
					queryProvince();
				}
				//职业
				setCbSelect($("#cJob"),getJob(d.job).pId);
				setCbSelect($("#cJob2"),d.job);
			}
			$("#addp_ul").hide();
			if(id=="-1"){
				$("#addp2").click();
				$.post("queryCAPbyId.do",{"id":_id},callback2,"json");
			}else{
				$("#addp1").click();
				$.post("queryEmployeeByUserId.do",{"userId":id,"companyId":$("#hidUserId").val()},callback,"json");
			}
			$('#employeeDialog').modal('show');
		}
		break;
	case 'delete':
		var trs = $("#employee_table").find("[name=ids][type=checkbox]");
		var j = 0;
		$(trs).each(function(i,item){
			if(trs[i].checked){
				j++;
				id = $(item).val();
			}
		})
		if(j==0){
			alert("请先选中要删除的行");
		}else{
			var c = $("input[name=_ids]");
			var ids = "";
			var capIds = "";
			$(c).each(function(i,item){
				if($(item)[0].checked){
					var _id = $(item).val();
					var flag = $($(item).prev()).val();
					if(flag!="-1"){
						ids += _id+",";
					}else{
						capIds += _id + ",";
					}
				}
			})
			
			if(ids.endsWith(',')){
				ids = ids.substring(0, ids.length-1);
			}
			if(capIds.endsWith(',')){
				capIds = capIds.substring(0, capIds.length-1);
			}
			if(confirm("确定要删除选中的成员吗？请慎重选择。")){
				postFormByAjax("deleteEmployeeForm",{'option':'delete','ids':ids,"capIds":capIds},function(data){
					alert(data.obj);
					refleshEmployeeTable();
				});
			}
		}
		break;
	default:
		break;
	}
}

var e_input = [];

function initEmployeeList(data){
	var trs = $("#employee_table").find("tr:gt(1)");
	$(trs).remove();
	var d = data.obj;
	var str = "<tr><td><p>暂无数据</p></td></tr>";
	var e_input_tmp = [];
	if($(d.rows).size() == 0){
		e_input_tmp.push("");
	}else{
		e_input_tmp.push("1");
	}
	e_input = e_input_tmp;
	changeIconAndColor("bzry_i", e_input_tmp);
	
	
	if(data.msgNo == '0'){
		alert(data.msg);
	}else if(d.totalCnt=="0"){
		$("#employee_table").append(str);
	}else{
		$("#totalPage2").text(d.totalPage);
		$.each(d.rows,function(i,item){
			var schedule = "待对方确认";
			if(item.schedule=="11"){
				schedule = "<span style='color:green'>已加入</span>";
			}else if(item.schedule=="2"){
				schedule = "";
			}
			var str = "<tr class='text-center'>"
				+"	<td>"
				+"		<input type='checkbox' name='ids' onclick='checkHidCheckBox(this)' value='"+item.userId+"' />"
				+"		<input type='checkbox' class='hidden' name='_ids' value='" +item.cId+"' />"
				+"	<td>"
				+"		<img width='50px' height='50px' src='"+ $("#basePath").val()+ "webPages/upload/member/" + item.headImg +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"'/>"
				+"	</td>"
				+"	<td>"+ item.nickName +"</td>"
				+"	<td>"+ item.area +"</td>"
				+"	<td>"+ getJob(item.job).main_job+"/"+getJob(item.job).sub_job +"</td>"
				+"	<td>"+ item.addTime +"</td>"
				+"	<td>"+ schedule +"</td>"
				+"	<td>"+ item.mark +"</td>"
				+"</tr>";
			$("#employee_table").append(str);
		})
	}
	
}

function showEmployeeList(){
	$("#_firstPage2").click();
}

function checkHidCheckBox(dom){
	$($(dom).next())[0].checked = $(dom)[0].checked;
}

function refleshEmployeeTable(){
	chipTo('refresh',$("#_firstPage2"));
}

function initQyzz(){
	var qyzzFlag = $("#_qyzzFlag").val();
	if(qyzzFlag==undefined||qyzzFlag == ""||qyzzFlag==null){
		var qyzz = $("#qyzzForComputeScore").val();
		if(qyzz == undefined||qyzz == ""||qyzz == null){
			$("#qyzzFlag").text("状态：未上传");
		}else{
			$("#qyzzFlag").text("状态：正在认证...将在上传后两个工作日内完成。");
			$("#uploadQyzzForm").remove();
		}
		
	}else if(qyzzFlag=='0'){
		$("#qyzzFlag").text("状态：已通过企业认证");
		$("#uploadQyzzForm").remove();
	}else if(qyzzFlag=='1'){
		$("#qyzzFlag").text("状态：未通过企业认证。原因：<small>["+$("#qyzzMark").val()+"]</small>");
	}
}

function setPcaId(dom){
	pcaId = $(dom).attr("id");
}

function disableForm(formId){
	if(formId=='1'){
		$("#employeeForm").attr("abled",true);
		$("#addCompanyPersonForm").removeAttr("abled");
	}else{
		$("#employeeForm").removeAttr("abled");
		$("#addCompanyPersonForm").attr("abled",true);
	}
}

function uploadImgAjax(){
	$.ajaxFileUpload({
		url: 'uploadImgAjax.do',
		secureuri: false,
		fileElementId: 'capImg_btn',
		dataType: 'json',
		success: function(data,status){
			console.log("uploadImg:enter success!");
			var d = data.responseText.replace("<pre>","").replace("</pre>","");
			eval("var d = ("+ d +")");
			$("#capImg").attr("src",$("#basePath").val()+ "webPages/upload/headpic/" + d.obj);
			$("#hid_imgName").val(d.obj);
		},
		error: function(data,status,e){
			console.log("uploadImg:enter error!");
			var d = data.responseText.replace("<pre>","").replace("</pre>","");
			eval("var d = ("+ d +")");
			$("#capImg").attr("src",$("#basePath").val()+ "webPages/upload/headpic/" + d.obj);
			$("#hid_imgName").val(d.obj);
		}
	})
}


//keyWords start
$(".type-label").on("click","i",function(e){
	if($(this).hasClass("active")){
		$(this).removeClass("active");
	}else if($(".type-label").find("i.active").size()<5){
		$(this).addClass("active");
	}
});

$(".type-label .submit").on("click",function(e){
	var text = "",ids="";
	var $is = $(".type-label").find("i.active")
	$is.each(function(i,item){
		if($is.size()==i+1){
			text += $(item).text();
			ids += $(item).attr("value");
		}else{
			text += $(item).text()+"、";
			ids += $(item).attr("value") + "、";
		}
	});
	$("#keyWord").val(text);
	$("#keyWord_ids").val(ids);
	$(".type-label").hide();
})

$(".add-label-btn").on("click",function(e){
	if($(".add-label-self").css("display")==="none"){
		$(".add-label-self").slideDown("slow");
	}else{
		$(".add-label-self").slideUp("slow");
	}
	
})

$(".add-label-self .add").on("click",function(e){
	var $input = $(this).prev();
	var v = $input.val();
	while(v&&v.indexOf("、")>-1){
		v = v.replace("、","");
	}
	if(!v){
		setMsg("danger#不能为空");
		return;
	}else if(v.length>10){
		setMsg("danger#长度最大10位");
		return;
	}
	
	var me = this;
	$.post("keyWords/add.do",{keyWord: v},function(data){
		if(data.msgNo=="1"){
			var i = '<i><span class="glyphicon glyphicon-remove"></span>'+v+'</i>';
			if($(".type-label").find("i.active").size()<5){
				i = '<i class="active" value="'+data.obj+'"><span class="glyphicon glyphicon-remove"></span>'+v+'</i>';
			}
			$(".user-label").append(i);
			$(me).parent().hide();
			$input.val("");//清空输入框
		}
		
		showAjaxMsg(data);
	},"json");
	
	
})

function showTypeLabel(){
	if($(".type-label").css("display")==='none'){
		$(".type-label").slideDown("slow");
	}else{
		$(".type-label").slideUp("slow");
	}
	
}

$(".close-btn").on("click",function(e){
	$(this).parent().slideUp("slow");
})

initBusiSmlType();

/**
* new 小类初始化
*/
function initBusiSmlType(){
	$(".sys-label").children("i").remove();
	$(".user-label").children("i").remove();
	var callback = function(data){
		var bstList_sys = data.obj.keyWord_sys;
		var bstList_user = data.obj.keyWord_user;
		var sysHtml = "",userHtml = "";
		//关键字部分初始化
		var keyWordIds = $("#keyWord_ids").val();
		var ids = keyWordIds.split("、");
		$.each(bstList_sys,function(i,item){
			sysHtml += '<i value="'+item.id+'" '+(ids.includes(item.id+"")?'class="active"':'')+'>'+item.name+'</i>'
		});
		
		$.each(bstList_user,function(i,item){
			userHtml += '<i value="'+item.id+'" '+(ids.includes(item.id+"")?'class="active"':'')+'><span class="glyphicon glyphicon-remove"></span>'+item.name+'</i>'
		});
		
		$(".sys-label").append(sysHtml);
		$(".user-label").append(userHtml);
		
	}
	$.post("keyWords/getProjectKeyWords.do",null,callback,"json");
};

$("li.user-label ").on("mouseover","i",function(){
	$(this).find(".glyphicon-remove").show();
}).on("mouseout","i",function(){
	$(this).find(".glyphicon-remove").hide();
})

$(".type-label .user-label").on("click",".glyphicon-remove",function(){
	var id = $(this).parent().attr("value");
	var callback = function(data){
		showAjaxMsg(data);
		initBusiSmlType();
	}
	
	$.post("keyWords/delete.do",{id: id},callback,"json");
});
//keyWords end