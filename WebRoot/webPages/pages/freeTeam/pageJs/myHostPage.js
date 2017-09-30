
//var cFlag = 0; //决定监控浏览器的部分是否工作，负责下面代码中window.onscroll 和 window.onhashchange做通信

var LOGIN_TYPE = $("#hidType").val(); //0 个人 1团队 2企业

$(function(){
	staticfilesPath = $("#staticPath").val();
	
	addToolTip($("#mrt_help"),"资料完整度，请完善您的资料，还可以提高用户排名哦。");
	
	hideAllPanel(true);
	
	
	//为所有form表单输入框添加工具提示并初始化
	$(":input.form-control").attr('data-toggle',"tooltip");
	
	
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
		$(href).trigger("init");
		console.log(href);
	});
	
	locateDiv();
	
	showMyIntro();
	
	//让左侧菜单随滚动条同时增加margin-top
	
	$(window).on("scroll",function(){
		changeFloatPostion();
	})
	
	showMyService();
	
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
//		$(dt).attr("readonly","");
		$(dt).datetimepicker({
			format: 'yyyy-mm-dd',
			autoclose: true,
			minView : 'month',
			showMeridian: true,
			todayBtn:true
		});
	});
	
	createDialog("accDetailDialog", "交易详情", "accDetail");
	if(LOGIN_TYPE == '1'){
		//下面是自己写的js校验，不过不如插件开发快
		var form1_errorMsg = {
			'jobStartTime':{'_required':'开始日期不能为空。','_maxlen':'开始时间最长10位'},
			'jobEndTime':{'_required':'结束日期不能为空。','_maxlen':'结束时间最长10位'},
			'company':{'_required':'所在公司不能为空。','_maxlen':'公司名称最长20位'},
			'jJob':{'_required':'不能为空。','_maxlen':'职位最长20位'},
			'eduStartTime':{'_required':'开始日期不能为空。','_maxlen':'开始时间最长10位'},
			'eduEndTime':{'_required':'结束日期不能为空。','_maxlen':'结束时间最长10位'},
			'school':{'_required':'学校名称不能为空。','_maxlen':'学校名称最长20位'},
			'mojor':{'_required':'不能为空。','_maxlen':'专业最长20位'},
			'projectDemo_title':{'_required':'项目标题不能为空。','_maxlen':'项目标题最长15位'},
			'projectDemo_depict': {'_maxlen' : '描述最多100个字'}
			
		};
		
		addValicate(form1_errorMsg);
		
		createDialog("jobDialog","新增工作经历","jobContent");
		createDialog("eduDialog","新增教育经历","eduContent");
		
		setJob();
		setJob2($("#cJob"));
		
		setBusitype();
		setBusiType2($("#busiType"));
	}else{
		createDialog("employeeDialog","新增团队成员","employeeDiaArea");
		
		// TODO
		initPageByType(); //根据登陆的是团队或者企业修改部分页面
		
		pcaId = "pca2";
		queryProvince();
		// END
	}
	
	jQuery.validator.addMethod("mobile", function(value, element) {
	    var length = value.length;
	    var mobile =  /^((1[0-9]{1})+\d{9})$/
	    return this.optional(element) || (length == 11 && mobile.test(value));
	}, "手机号码格式错误");   
	
	$("#phoneCodeForm").validate({
		rules:{
			phone: {
				required: true,
				mobile: true,
				remote: {
					url: "checkTelRegisted.do",
					type:"post",
					dataType: "json",
					data: {
						tel: function() {
							return $("#valiTel").val();
				        }
				    }
				}
			},
			code: {
				required: true,
				digits:true
			}
		},
		messages: {
			phone:{
				remote: "此手机号已验证，请勿重复验证。"
			}
		}
		
	});
	
	$("#emailCodeForm").validate({
		rules: {
			userEmail: {
				required: true,
				email: true,
				remote: {
					url: "checkEmailRegisted.do",
					type:"post",
					dataType: "json",
					data: {
						email: function() {
							return $("#valiEmail").val();
				        }
				    }
				}
				
			}
		},
		messages: {
			userEmail: {
				remote: '此邮箱已验证，请勿重复验证。'
			}
		}
	})
	
	createDialog("proDemoDialog","新增项目案例","proDemoContent");
	$("#proDemoContent").show();
	
	
	
	
	
	var href = window.location.href;
	var index = href.indexOf('myInfo');
//	var tmp = href.substring(index).split('=')[1];
	if(index>0){
		$("#myInfoLi").click();
	}else{
		showAllInfo();
	}
	
	var index2 = href.indexOf('myWarning');
	if(index2>0){
		$("#myWarning_link").click();
	}
	
	
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
	
	//我的消息中好友申请跳转至好友列表
	$(document).on("click",".friendHref", function(){
		$("#myFriendLi").click();
	});
	
	$(document).on("click",".teamHref", function(){
		$("#group_i").click();
	});
	
});


var ue = UE.getEditor('detailIntro',{
	toolbars: [
	    [ 'source', 'undo', 'redo','fullscreen'],
	    ['bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'fontfamily','fontsize','forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist', 'selectall', 'cleardoc'],
	    ['simpleupload', 'insertimage', 'emotion', 'scrawl', 'insertvideo', 'music', 'map', 'insertcode', 'pagebreak', 'template', 'background', '|']
	],
	maximumWords:20000
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
 * 默认隐藏所有panel
 * @param isInit 是否是初始化
 * 初始化时显示 个人信息/基本信息
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
			
			var ServiceStatusStr = ""; 	
			if(d.EXAMINE == "0") 
			{
				ServiceStatusStr = "<span class='claim1'> <a style='color:#f80;'>待审核</a></span>";	
			}
			else if(d.EXAMINE == "1")
			{
				ServiceStatusStr = "<span class='claim1'> <a style='color:skyblue;border-color: skyblue;'>已审核</a></span>";	
			}
			else if(d.EXAMINE == "2")
			{
				ServiceStatusStr = "<span class='claim1'> <a style='color:#f80;'>未通过审核</a></span>";					
			}
			
			var se = "<li>"
				+"	<i class='cell logo w12'>"
				+"		<a href='toService2.do?id="+d.ID+"' target='_blank'>"
				+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
				+"		</a>"
				+"	</i> "
				+"	<i class='cell commpany w25'>"
				+"		<span class='name'>"
				+"			<a href='toService2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a>"
				+ServiceStatusStr
				+"		</span>"
				+"		<span class='desc'><span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE*5)+Math.round(d.SCORE*100)+"%</span></span>"
				+"		<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
				+"	</i>"
				+"	<i class='cell round w20'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "<br/>" + cutLongTxt(nvl(d.KEYWORDS,"暂无"),10) +"</i>"
				//+"	<i class='cell round w20'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.BST,"暂无") +"</i>"
				+"	<i class='cell amount w10'> "+ _price +"</i>"
				+"	<i class='cell industry w15'>"
				+"		<a href='toUpdateService.do?id="+d.ID+"' class='mybtn'>修改</a>"
				+"		<a href='javascript:void(0)' onclick='deleteService("+d.ID+")' class='mybtn-primary'>删除</a>"
				+"	</i>"
				+"	<i class='cell date w12'>"+d.PUBLISHTIME+"</i>"
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
				
				
				var ProjectStatusStr = ""; 	
				if(d.EXAMINE == "0") 
				{
					ProjectStatusStr = "<span class='claim1'> <a style='color:#f80;'>待审核</a></span>";	
				}
				else if(d.EXAMINE == "1")
				{
					ProjectStatusStr = "<span class='claim1'> <a style='color:skyblue;border-color: skyblue;'>已审核</a></span>";	
				}
				else if(d.EXAMINE == "2")
				{
					ProjectStatusStr = "<span class='claim1'> <a style='color:#f80;'>未通过审核</a></span>";					
				}
				
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
				}else{
					_price = "<span class='price'>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>元&nbsp;&nbsp;";
				}
				
				var proj = "<li>"
					+"	<i class='cell logo w12'>"
					+"		<a href='toProject2.do?id="+d.ID+"' target='_blank'>"
					+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
					+"		</a>"
					+"	</i> "
					+"	<i class='cell commpany w25'>"
					+"		<span class='name'>"
					+"			<a href='toProject2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a>" 
					+ ProjectStatusStr
					+"		</span>"
					+"		<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
					+"		<span class='desc'> </span>"
					+"	</i>"
					+"	<i class='cell round w10'>"+cutLongTxt(nvl(d.KEYWORDS,"暂无分类"),10)+"</i>"
					//+"	<i class='cell round w20'>"+nvl(d.BUSISMLTYPE,"暂无分类")+"</i>"
					+"	<i class='cell amount w10'> "+ _price +"</i>"
					
					//+"	<i class='cell investor w6'><span class='glyphicon glyphicon-thumbs-up redStar'></span>(<a href='#'>"+d.LIKECNTS+"</a>)</i>"
					+"	<i class='cell investor w15'>"
					+"		<a href='toUpdateProject.do?id="+d.ID+"' class='mybtn'>修改</a>"
					+"		<a href='javascript:void(0);' onclick='deleteProject("+d.ID+")' class='mybtn-primary'>删除</a>"
					+"	</i>"
					+"	<i class='cell date w12'>"+d.PUBLISHTIME+"</i>"
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
					+"		<a href='toService2.do?id="+d.SERVICEID+"' target='_blank'>" 
					+			"<img src='"+ $("#basePath").val()+ "webPages/upload/service/" + d.PROLOG +"' width='200px' height='130px;' onerror='this.src=\"webPages/images/service.png\"'/>"
					+		"</a>"
					+"	</div>"
					+"	<div class='fLeft projContent-min'>"
					+"		<h4>"
					+"			<a href='toService2.do?id="+d.SERVICEID+"' target='_blank' class='canChip'>"+d.NAME+"</a>"
					+"			<span title='服务类型' class='label label-warning font-12'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.BUSISMLTYPE,"暂无") +"</span>"
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
			bootstrapQ.alert("获取数据失败，请稍后重试！");
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
					+"		<a href='toProject2.do?id="+d.PROJECTID+"' target='_blank'>"
					+"			<img src='"+ $("#basePath").val()+ "webPages/upload/project/" + d.PROLOG +"' width='200px' height='130px;' onerror='this.src=\"webPages/images/project.jpg\"'/>"
					+"		</a>"
					+"	</div>"
					+"	<div class='fLeft projContent-min'>"
					+"		<h4>"
					+"			<a href='toProject2.do?id="+d.PROJECTID+"' target='_blank' class='canChip'>"+d.NAME+"</a>"
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
			bootstrapQ.alert("获取数据失败，请稍后重试！");
		}
	}
	$.post("queryMyOrderProjectData.do",null,callback,"json");
}

function addRelation(id){
	var flag = confirm("确定要申请加入项目吗？");
	if(flag){
		var param = {"proId":id,"type":"0"};
		var callback = function(data){
			bootstrapQ.alert(data.obj);
			if(data.msgNo=="1"){
				queryProjectListData()
			}
		}
		$.post("addRelation.do",param,callback,"json");
	}
	
}

function doLikeService(id){
	bootstrapQ.confirm({
		title: "删除收藏",
		msg: "确定要删除该收藏吗？",
		okbtn : "确定",
		qubtn : "取消"},
		function(){
		var callback = function(data){
			//bootstrapQ.msg(data);
			showMyLikeService();
		};
		$.post("doLikeProject.do",{"projectId":id,"type": 1},callback,"json");
	});
	return;	
}

function doLikeProject(id){
	bootstrapQ.confirm({
		title: "取消关注",
		msg: "确定要取消该关注吗？",
		okbtn : "确定",
		qubtn : "取消"},
		function(){
		var callback = function(data){
			//bootstrapQ.msg(data);
			showMyLikeProject();
		};
		$.post("doLikeProject.do",{"projectId":id,"type": 0},callback,"json");
	});	
	return;	

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

				var str="";
				var hidUserId = $("#hidUserId").val(); 
				if(hidUserId == d.PUBLISHER){
					str = "<a class='mybtn-primary' onclick='bootstrapQ.alert(\"不能承接自己的项目！\")'  disabled='disabled' >承接</a>";
				}else{
					str = "<a class='mybtn-primary' href='toUndertakeProject.do?id="+d.ID+"' title='点击将会发送私信到创建者信箱'>承接</a>";
				}
				
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "<span class='price'>面议</span>";
				}else{
					_price = "<span class='price'><i class='glyphicon glyphicon-yen'></i>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>";
				}
				
				var recommendtagstr = ""; 	
				if(d.IS_RECOMMEND && d.IS_RECOMMEND != "0") 
				{
					recommendtagstr = "<span class='claim1'> <a style='color:#f80;'>平台推荐</a></span>";	
				}
				
				var proj = "<li>"
					+"	<i class='cell logo w12'>"
					+"		<a href='toProject2.do?id="+d.ID+"' target='_blank'>"
					+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
					+"		</a>"
					+"	</i> "
					+"	<i class='cell commpany w25'>"
					+"		<span class='name'>"
					+"			<a  href='toProject2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a>"
					+recommendtagstr
					+"      </span>"
					+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
					+"			<span class='desc'> </span>"
					+"	</i>"
					+"	<i class='cell round w10'>"+nvl(d.KEYWORDS,"暂无分类")+"</i>"
					+"	<i class='cell amount w17'> "+ _price +"</i>"
					+"	<i class='cell investor w15'>"
					+ str
					+"  </i>"
					+"	<i class='cell round w10'>" 
					//+"		<a class='mylink' href='javascript:void(0)' onclick='doLikeProject("+d.ID+")'>关注("+d.LIKECNTS+")</a>"
					+"		<a class='mybtn' href='javascript:void(0)' onclick='doLikeProject("+d.ID+")'>取消关注</a>"
					+"	</i>"
					+"	<i class='cell date w15'>"+d.PUBLISHTIME+"</i>"
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
					var str = "";
					var hidUserId = $("#hidUserId").val(); 
					if(hidUserId == d.PUBLISHER){
						str = "<a class='mybtn-primary' onclick='bootstrapQ.alert(\"不能购买自己的服务\")'>购买</a>";
					}else{
						str = "<a class='mybtn-primary' href='toBuyService.do?id="+d.ID+"' title='点击将会发送私信到创建者信箱'>购买</a>";
					}
					
					var _price = "";
					if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
						_price = "<span class='price'>面议</span>";
					}else{
						_price = "<span class='price'><i class='glyphicon glyphicon-yen'></i>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>";
					}
					
					var recommendtagstr = ""; 	
					if(d.IS_RECOMMEND && d.IS_RECOMMEND != "0") 
					{
						recommendtagstr = "<span class='claim1'> <a style='color:#f80;'>平台推荐</a></span>";	
					}
					
					var proj = "<li>"
						+"	<i class='cell logo w12'>"
						+"		<a href='toService2.do?id="+d.ID+"' target='_blank'>"
						+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
						+"		</a>"
						+"	</i> "
						+"	<i class='cell commpany w25'>"
						+"		<span class='name'>"
						+"			<a href='toService2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a>" 
						+recommendtagstr
						+"		</span>"
						+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
						+"	</i>"
						+"	<i class='cell round w10'><span class='claim'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.KEYWORDS,"暂无") +"</span></i>"
						+"	<i class='cell amount w17'> "+ _price +"</i>"
						+"	<i class='cell investor w15'>" 
						+str
						+"	</i>"	
						+"	<i class='cell round w10'>" 
						//+"		<a class='mylink' href='javascript:void(0)' onclick='doLikeService("+d.ID+")'>收藏("+d.LIKECNTS+")</a>" 
						+"		<a class='mybtn' href='javascript:void(0)' onclick='doLikeService("+d.ID+")'>删除收藏</a>" 
						+"	</i>"
						+"	<i class='cell date w15'>"+d.PUBLISHTIME+"</i>"
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
				var html = '<div style="width:15%;float: left;padding: 10px;text-align: center;position: relative;">'
					+'<i class="glyphicon glyphicon-remove demo-remove" onclick="removePrjDemo('+item.id+')"></i>'
					+'<img width="100px" height="100px" class="img-rounded" src="'+item.logo+'" onerror="this.src=\'webPages/images/project.jpg\'" />'
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

function removePrjDemo(id){
	bootstrapQ.confirm("确定要删除此项目案例？", function(){
		$.post("projectDemo/delete.do?id="+id,null,function(data){
			if(data.msgNo=='1'){
				bootstrapQ.msg({
					msg: '删除成功！',
					type: 'success',
					time: 2000
				});
				showProDemo();
			}else{
				bootstrapQ.msg({
					msg: '删除失败！',
					type: 'danger',
					time: 2000
				});
			}
		},"json");
	});
}

function showProDemoDialog()
{
	$('#proDemoContent').show();
	$('#proDemoDialog').modal('show');
}

function initOrderPlan(dom,d,currentNodeId){
	var d2 = $.map(d,function(row){
		var cs = "";
		var nodeStatusStr = "";
		switch (row.state) {
		case 0:
			if(row.currentPlan == currentNodeId){
				cs = "<label class='label label-danger'>待付款</label>";
				nodeStatusStr = "待付款";
			}else{
				cs = "<label class='label label-default'>未开始</label>";
				nodeStatusStr = "未开始";
			}
			break;
		case 1:
			cs = "<label class='label label-info'>待服务</label>";
			nodeStatusStr = "待服务";
			break;
		case 2:
			cs = "<label class='label label-info'>服务中</label>";
			nodeStatusStr = "服务中";
			break;
		case 3:
			cs = "<label class='label label-danger'>待验收</label>";
			nodeStatusStr = "待验收";
			break;
		case 4:
			cs = "<label class='label label-success'>验收通过</label>";
			nodeStatusStr = "完成";
			break;
		case 5:
			cs = "<label class='label label-danger'>验收未通过</label>";
			nodeStatusStr = "验收未通过";
			break;
		default:
			break;
		}
		var l = row.payState==0?'<label class="label label-danger">未支付</label>':'<label class="label label-success">已支付</label>';

		var title = row.name;
		var content = '<div class="planNode"><p><label>节点状态：</label>'+cs+'</p><p><label>支付('+row.amountPercent+'%)：</label>'+l+'</p><p><label>描述：</label>'+row.content+'</p></div>';
		var steptitle = '<p>'+ nodeStatusStr +'</p><p style="margin-top: 30px;" class="cutText">'+ row.name + '</p>';
		return {title: title, content: content, steptitle:steptitle};
	});
	
	//开发流程
	$(dom).children().remove();
	$(dom).loadStep({
	    //ystep的外观大小
	    //可选值：small,large
	    size: "small",
	    //ystep配色方案
	    //可选值：green,blue
	    color: "green",
	    //ystep中包含的步骤
	    steps: d2
	  });
	
	for(var i=1;i<d.length+1;i++){
		if(d[i-1].id==currentNodeId){
			$(dom).setStep(i);
			return;
		}
	}
}

/*
 * 我的订单
 * */
function showMyOrder(buyType,status){
	//0:待确认待接单    1:改价待确认    2:订单确立待付款    3:订单确立待服务    4:订单确立服务中  5:订单确立待验收    6:订单确立验收未通过后待服务   7:订单完成待评价   8:订单完成最近评论  9:订单已取消
	var _serviceOrderStatusForBuyer = 	['待接单',	'去确认',		'去付款',		'待服务',	'服务中',	'去验收',		'待服务',	 '已完成',	'已完成', '订单已取消'];
	var _serviceOrderStatusForSeller = 	['去接单',	'改价待确认',	'待付款 ',		'开始服务',	'申请验收',	'待验收',		'开始服务',	 '去评价',	'已完成', '订单已取消'];
	var _projectOrderStatusForBuyer = 	['去确认',	'改价待确认',	'去付款',		'待服务',	'服务中',	'去验收',		'待服务',	 '去评价',	'已完成', '订单已取消'];
	var _projectOrderStatusForSeller = 	['待确认',	'去确认',		'待付款 ',		'开始服务',	'申请验收',	'待验收',		'开始服务',	 '已完成',	'已完成', '订单已取消'];
	
	
	var $dom = $("#orderList");
	var uId = $("#hidUserId").val(); //当前登录用户ID
	$dom.children().remove();
	$dom.append("<p>正在查询...</p>");
	var callback = function(data){
		$dom.children().remove();
		if(data.msgNo=='1'){
			if(data.obj.totalCnt>0){
				var list = data.obj.rows;
				var html = "";
				$.each(list,function(i,item){
					var d = item;
					var str = "";
					if(uId==d.BUYER)
					{
						str = '<a class="mybtn" onclick="initMsgDalog('+d.SELLER+')">联系对方</a>';
					}
					else
					{
						str = '<a class="mybtn" onclick="initMsgDalog('+d.BUYER+')">联系对方</a>';						
					}
					
					//设置该订单对应的项目或者服务发布人的信息	
					var publisherID = "";
					var publisherName="";
					var imgsubpath ="";
					var publisherLink ="";
					if(d.TYPE == 1) //项目订单
					{
						publisherID = d.BUYER; //项目订单对应的项目发布人为需求方
						publisherName = d.BUYER_NAME;
						imgsubpath = "project";
						publisherLink = "href='toProject2.do?id="+d.LINKID+"'";
					}
					else
					{
						publisherID  = d.SELLER; //服务订单对应的服务的发布人为服务方 	
						publisherName = d.SELLER_NAME;
						imgsubpath = "service";
						publisherLink = "href='toService2.do?id="+d.LINKID+"'";
					}
					
					//根据订单状态、支付节点状态、以及是否已评论状态，确定订单指示状态
					var OrderStatus = 0;
					if((d.STATUS == 0) || (d.STATUS == 1))
					{
						OrderStatus = d.STATUS;
					}
					else if(d.STATUS == 2)
					{
						if(d.CURPLANSTATUS == 0)
						{
							OrderStatus = 2;							
						}
						else if(d.CURPLANSTATUS == 1)
						{
							OrderStatus = 3;							
						}
						else if(d.CURPLANSTATUS == 2)
						{
							OrderStatus = 4;							
						}
						else if(d.CURPLANSTATUS == 3)
						{
							OrderStatus = 5;							
						}
						else if(d.CURPLANSTATUS == 5)
						{
							OrderStatus = 6;							
						}
					}
					else if(d.STATUS == 3)
					{
						if(d.IS_COMMENT == 0)
						{
							OrderStatus = 7;	
						}
						else
						{
							OrderStatus = 8;	
						}						
					}
					else if(d.STATUS == 4)
					{
						OrderStatus = 9;
					}
					
					//根据订单类型和登录者身份，确定订单状态显示		
					var OrderStatusHtmlStr ="",orderType = "";
					if(d.TYPE == 1) //项目订单
					{
						if(uId==d.BUYER)
						{
							if((OrderStatus == 0) || (OrderStatus == 2) || (OrderStatus == 5) || (OrderStatus == 7))  //去付款 和  去验收 是按键 
							{
								OrderStatusHtmlStr = '<a class="mybtn-primary" href="toOrderDetail.do?orderId='+d.ID+'&type='+d.TYPE+'" target="_blank">'+_projectOrderStatusForBuyer[OrderStatus]+'</a>';
							}
							else
							{
								OrderStatusHtmlStr = '<label class="label label-info label-large">'+_projectOrderStatusForBuyer[OrderStatus]+'</label>';
							}
							orderType = "被承接的项目";
						}
						else
						{	
							if((OrderStatus == 1) || (OrderStatus == 3) || (OrderStatus == 4) || (OrderStatus == 6))  //去付款 和  去验收 是按键 
							{
								OrderStatusHtmlStr = '<a class="mybtn-primary" href="toOrderDetail.do?orderId='+d.ID+'&type='+d.TYPE+'" target="_blank">'+_projectOrderStatusForSeller[OrderStatus]+'</a>';
							}
							else
							{
								OrderStatusHtmlStr = '<label class="label label-info label-large">'+_projectOrderStatusForSeller[OrderStatus]+'</label>';
							}
							orderType = "承接的项目";
						}
					}
					else
					{
						if(uId==d.BUYER)
						{
							if((OrderStatus == 1) || (OrderStatus == 2) || (OrderStatus == 5) || (OrderStatus == 7))  //去付款 和  去验收 是按键 
							{
								OrderStatusHtmlStr = '<a class="mybtn-primary" href="toOrderDetail.do?orderId='+d.ID+'&type='+d.TYPE+'" target="_blank">'+_serviceOrderStatusForBuyer[OrderStatus]+'</a>';
							}
							else
							{
								OrderStatusHtmlStr = '<label class="label label-info label-large">'+_serviceOrderStatusForBuyer[OrderStatus]+'</label>';
							}
							orderType = "购买的服务";
						}
						else
						{
							if((OrderStatus == 0) || (OrderStatus == 3) || (OrderStatus == 4) || (OrderStatus == 6))  //去付款 和  去验收 是按键 
							{
								OrderStatusHtmlStr = '<a class="mybtn-primary" href="toOrderDetail.do?orderId='+d.ID+'&type='+d.TYPE+'" target="_blank">'+_serviceOrderStatusForSeller[OrderStatus]+'</a>';
							}
							else
							{
								OrderStatusHtmlStr = '<label class="label label-info label-large">'+_serviceOrderStatusForSeller[OrderStatus]+'</label>';
							}
							orderType = "卖出的服务";
						}
					}
					
					
					html += '<li style="display: block;">'
						+ '<div class="orderInfo clearfix"><span class="col-xs-8">订单号：<a href="toOrderDetail.do?orderId='+d.ID+'&type='+d.TYPE+'" target="_blank">'+d.ID+'</a><span>（'+orderType+'）</span></span><span class="col-xs-4 text-right">'+d.CREATE_TIME+'</span></div>'
						+'	<i class="cell logo w12">'
						+'		<a ' + publisherLink + '  target="_blank">'
						+'			<img width="100px" height="100ox" src="' + $("#basePath").val()+ "webPages/upload/"+imgsubpath+"/" + d.RESOURCE_IMG +'" onerror="this.src=\'webPages/images/defaultHeadPic.png\'">'
						+'		</a>'		
						+'		<div><span class="name">'
						+'			<a href="toUserDetail2.do?id='+ publisherID +'"  target="_blank">'+publisherName+'</a>'
						+'		</span></div>'
						+'	</i>'
						+'	<i class="cell commpany w30">'
						+'		<span class="name"><a ' + publisherLink + '  target="_blank">'+d.RESOURCE_NAME+'</a></span>'
						+'		<span class="desc">'
						+		cutLongTxt(d.RESOURCE_INTRO,50)
						+'		</span>'
						+'		<span class="amount">价格：'+d.PRICE+'元</span>'
						+'		<span class="desc">'
						+'			<a class="fLeft" style="margin-top: 20px;font-size: 14px;">进度：</a>'
						+'			<div class="ystep" id="ystep'+d.ID+'" style="padding:20px"></div>'
						+'		</span>'
						+'	</i>'
						+'	<i class="cell investor w8">'
						+ OrderStatusHtmlStr
						//+'		<label class="label label-info label-large">'+OrderStatus+'</label>'
						+'	</i>'
						+'	<i class="cell investor w8">'
						+	'<a class="mybtn" href="toOrderDetail.do?orderId='+d.ID+'&type='+d.TYPE+'" target="_blank">订单详情</a>'
						+'	</i>'
						+'	<i class="cell investor w8">'
						+ 	str
						+'	</i>'
						+'</li>';
				});
				$dom.append(html);
				
				//进度
				$.each(list,function(i,item){
					var nodes = item.CURPLANNODES;
					var dom = $("#ystep"+item.ID);
					initOrderPlan(dom,nodes,item.PLAN_NODE_ID);
				});
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
	//刷新账户余额
	showMyIntro();
	$("#chargeList").children().remove();
	$("#chargeList").append("<p>正在加载...</p>");
	var callback = function(data){
		$("#account_totalPage").text(data.obj.total);
		$("#chargeList").children().remove();
		if(data.msgNo=='1'&&data.obj.total>0){
			var html = "";
			$.each(data.obj.rows,function(i,item){
				var d = item;
				html += '<li>'
					+'	<i class="cell logo w15">'
					+'	<div style="word-break:break-all;">'+(d.payOrderId?d.payOrderId:d.id)+'</div>'
					+'</i>'
					+'<i class="cell logo w15">'
					+'	<span>'+$.format.date(d.createTime,'yyyy-MM-dd<br/>HH:mm:ss')+'</span>'
					+'</i>'
					+'<i class="cell commpany w20">'
					+'	<span class="name">'+typeFormatter(d.type,d)+'</span>'
					+'	<div class="intro" style="word-break: break-all;">'
					+  		cutLongTxt(nvl(d.note,"-"),50)
					+'	</div>'
					+'</i>'
					+'<i class="cell investor w15">'
					+ moneyInFormatter(d.money, d)
					+'</i>'
					+'<i class="cell investor w15">'
					+ moneyOutFormatter(d.money, d)
					+'</i>'
					+'<i class="cell investor w10">'
					+ statusFormatter(d.status,d)
					+'</i>'
					+'<i class="cell investor w10">'
					+'	<a href="javascript: void(0)" onclick="showAccountDetail('+d.id+')">查看详情</a>'
					+'</i>'
					+'</li>';
			})
			$("#chargeList").append(html);
		}else{
			$("#chargeList").append("<p class='p10'>暂无数据</p>");
		}
		
	}
	var params = $.extend($.pg.param,{'startTime':$("#account_startTime").val(),'endTime': $("#account_endTime").val()});
	$.post("deal/dealList.do",params,callback,"json");
	
	/**
	 * 类型格式化
	 */
	function typeFormatter(value,row){
		var type = ['付款托管','验收后支付','充值','提现'];
		if(value==0||value==1){
			return '服务费';
		}else{
			return type[value];
		}
	}
	
	/**
	 * 收入格式化
	 */
	function moneyInFormatter(value, row){
		var userId = $("#id").val();
		if(row.type=='0'||row.type=='1'){
			if(row.payer == userId){
				//支付方
				return "-";
			}else{
				//收入方
				return '<span style="color: darkgreen;">'+value+'</span>';
			}
		}else if(row.type=='2'){
			//充值
			return  '<span style="color: darkgreen;">'+value+'</span>';
		}else if(row.type=='3'){
			//提现
			return '-';
		}
	}
	
	/**
	 * 支出格式化
	 */
	function moneyOutFormatter(value, row){
		var userId = $("#id").val();
		if(row.type=='0'||row.type=='1'){
			if(row.payer == userId){
				//支付方
				return '<span style="color: red;">'+value+'</span>';
			}else{
				//收入方
				return '-';
			}
		}else if(row.type=='2'){
			//充值
			return  '-';
		}else if(row.type=='3'){
			//提现
			return '<span style="color: red;">'+value+'</span>';
		}
	}
	
	/**
	 * 状态格式化
	 */
	function statusFormatter(value, row){
		if(row.status=='1'){
			if(row.type=='0'){
				return "<span style='color: #f83'>已托管</span>";
			}else if(row.type=='1'){
				return "<span style='color: skyblue'>支付完成</span>";
			}
		}
		switch (row.status) {
		case 0:
			status = "<span style='color: #f83'>待处理</span>";
			break;
		case 1:
			status = "<span style='color: skyblue'>交易成功</span>";
			break;
		case 2:
			status = "<span style='color: red'>交易失败</span>";
			break;
		default:
			break;
		}
		return status;
	}
}

function showAccountDetail(id){
	var type = ['付款托管','验收后支付','充值','提现'];
	var payType = ['余额','支付宝','银行卡','微信'];
	var userId = $("#id").val();
	$.post("deal/findById.do?id="+id,null,function(data){
		if(data.msgNo == '1'){
			var d = data.obj;
			$("#acc_num").text(d.id);
			$("#acc_type").text(type[d.type]);
			$("#acc_note").text(d.note);
			if(d.type =='0'||d.type=='1'){
				$("#acc_type").text('服务费');
				if(userId == d.payer){
					$("#acc_money_tip").text("支出：");
					$("#acc_money").html('<span style="color:red">'+d.money+'</span>');
				}else{
					$("#acc_money_tip").text("收入：");
					$("#acc_money").html('<span style="color:green">'+d.money+'</span>');
				}
			}else if(d.type!='2'){
				$("#acc_money_tip").text("支出：");
				$("#acc_money").html('<span style="color:red">'+d.money+'</span>');
			}else{
				$("#acc_money_tip").text("收入：");
				$("#acc_money").html('<span style="color:green">'+d.money+'</span>');
			}
			
			
			$("#acc_time").text($.format.date(d.createTime,'yyyy-MM-dd HH:mm:ss'));
			var status = "";
			if(d.status>2){
				status = '其它';
			}else{
				
				switch (d.status) {
				case 0:
					status = "<span style='color: #f83'>待处理</span>"
					break;
				case 1:
					status = "<span style='color: skyblue'>交易成功</span>"
					break;
				case 2:
					status = "<span style='color: red'>交易失败</span>"
					break;
				default:
					break;
				}
				
				if(d.status=='1'){
					if(d.type=='0'){
						status = "<span style='color: #f83'>已托管</span>";
					}else if(d.type=='1'){
						status = "<span style='color: skyblue'>交易成功</span>";
					}
				}
			}
			$("#acc_status").html(status);
//			$("#acc_payType").text(d.payType?payType[d.payType-1]:'未知');
			$("#payType_"+d.payType).show().siblings(".payType").hide();
			$("#accDetailDialog .btnsave").hide();
			$("#accDetailDialog .btncancel").text('确定').removeClass("mybtn").addClass('mybtn-primary');
			$("#accDetailDialog").modal('show');
		}else{
			bootstrapQ.msg({
				msg: '查询详细信息失败！',
				type: 'danger',
				time: 2000
			});
		}
	},"json");
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
			var btn = ""
			if( d.STATUS ){
				
				btn = "	<i class='cell investor w15'>"
					+"		<a title='发送消息' class='mybtn' onclick='initMsgDalog(\""+d.ID+"\")'><span class='glyphicon glyphicon-envelope'></span></a>"
					+"	</i>"
					+"	<i class='cell investor w10'>"
					+"	<a class='mybtn-primary' href='javaScript:void(0)' onclick='deleteFriend("+d.ID+",\""+d.NICKNAME+"\")'>删除好友</a>"
					+"	</i>";
				
			}
			else{
				
				btn = "	<i class='cell investor w10'>"
					+"	<a class='mybtn-ok' href='javaScript:void(0)' onclick='passApplyFriend("+d.ID+")'>同意</a>"
					+"	</i>"
					+"	<i class='cell investor w10'>"
					+"	<a class='mybtn-primary' href='javaScript:void(0)' onclick='deleteFriend("+d.ID+",\""+d.NICKNAME+"\")'>拒绝</a>"
					+"	</i>";
				
			}
			var str = "<li>"
				+"	<i class='cell logo w10'>"
				+"		<a href='toUserDetail2.do?id="+d.ID+"' target='_blank'>"
				+"			<span class='incicon'><img src='" + $("#basePath").val()+ "webPages/upload/headpic/" + d.HEADIMG +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"'></span>"
				+"		</a>"
				+"	</i> "
				+"	<i class='cell commpany w20'>"
				+"		<span class='name' style='display: inline-block;'>"
				+"			<a href='toUserDetail2.do?id="+ d.ID +"'  target='_blank'>"+d.NICKNAME+"</a></span>"
				+"			<span class='desc' style='display: inline-block;'> ("+ nvl(d.AREA,"未知") +")</span>"
				+"			<span class='desc' style='max-width:300px'>"+ (d.msg_content ? d.msg_content : "") +"</span>"
				+"	</i>"
				+ btn
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
			bootstrapQ.alert(data.obj);
		}else{
			if(parseInt(data.obj.total)==0){
				var str = "<div><p class='p10'>暂无用户消息</p></div>";
				$("#msgDataArea").append(str);
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
						+'		<a href="toUserDetail2.do?id='+d.REID+'" target="_blank">'
						+'			<span class="incicon"><img src="'+ $("#basePath").val()+ 'webPages/upload/headpic/' + d.HEADIMG +'" onerror="this.src=\'webPages/images/defaultHeadPic.png\'">'+noReadNum+'</span>'
						+'		</a>'
						+'	</i> '
						+'	<i class="cell commpany">'
						+'		<span class="name">'
						+'			<a href="toUserDetail2.do?id='+d.REID+'" target="_blank">'+d.NICKNAME+'</a></span>'
						+'			<span class="desc"  onclick="initMsgDalog(\''+d.REID+'\')">'+d.CONTENT+'</span>'
						+'	</i>'
						+'	<i class="cell date">'+nvl(d.SENDTIME,'')+'</i>'
						+'	<i class="cell investor"><a title="发送消息" class="mybtn" onclick="initMsgDalog(\''+d.REID+'\')"><span class="glyphicon glyphicon-envelope"></span></a></i>'
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
			bootstrapQ.alert(data.obj);
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
			if(item2!=null&&item2!=undefined&&item2.length>0){
				score1++;
			}
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
			var myInfo_inputs = [];
			var myIntro_inputs = [];
			var myInfo_inputs_tmp = [];
			var myIntro_inputs_tmp = [];
			var myDetail_inputs = [];
			var phone_inputs = [];
			var email_inputs = [];
			
			
			var type = $("#hidType").val();
			if(type == 1){
				myInfo_inputs.push(u.email);
				myInfo_inputs.push(u.nickName);
				myInfo_inputs.push(u.sex);
				myInfo_inputs.push(u.area);
				myInfo_inputs.push(u.jobType);
				myInfo_inputs.push(u.partRole);
				myInfo_inputs.push(u.job);
				myInfo_inputs.push(u.headImg);
				myIntro_inputs.push(u.intro);
				myDetail_inputs.push(u.detailIntro);
				phone_inputs.push(u.phoneAvailable);
				email_inputs.push(u.emailAvailable);
			
				inputs.push(myInfo_inputs);
				inputs.push(myIntro_inputs);
				inputs.push(myDetail_inputs);
				inputs.push(phone_inputs);
				inputs.push(email_inputs);
				
				changeIconAndColor("myInfo_i",myInfo_inputs);
				changeIconAndColor("myIntro_i",myIntro_inputs);	
				
				var index = 0;
				console.log(u);
				if(u.jobType!=null&&u.jobType!=""&&u.jobType!=undefined&&parseInt(u.jobType)>0){
					index = getVocationValue(u.jobType).pId;
					//目前职位
					setCbSelect($("#busiType"),index);
					setCbSelect($("#busiType2"),u.jobType);
				}
			
				//创业定位
				$("#partRole").val(u.partRole);
				//所属行业
				index = getJob(u.job).pId;
				setCbSelect($("#cJob"),index);
				setCbSelect($("#cJob2"),u.job);		
				
				showJobExperience();
				showEduExperience();
			}else{
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
				phone_inputs.push(u.phoneAvailable=='1'?'1':null);
				email_inputs.push(u.emailAvailable=='1'?'1':null);
			
				myIntro_inputs_tmp.push(u.intro);
				
				changeIconAndColor("myInfo_i",myInfo_inputs);
				changeIconAndColor("myIntro_i",myIntro_inputs);
			}
			

			
			

			changeIconAndColor("myDetails_i",myDetail_inputs);
			changeIconAndColor("phone_i",phone_inputs);
			changeIconAndColor("email_i",email_inputs);
			
			//电子邮箱
			$("#myEmail").val(u.email);
			//真实姓名
			$("#nickName").val(u.nickName);
			$("#realName").val(u.realName);
			
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
			//keyup 事件更改统计字数
			$("#user_intro").val(intro).keyup();
			$("#projectDemo_depict").keyup();
			
			

			ue.ready(function(){
				ue.setContent(u.detailIntro);
				$(ue).keyup();
			});
			
			//用户id
			$("#id").val(u.id);
			
		}
	}
	$.post("queryMyInfo.do",null,callback,"json");
}

/**
 * 刷新工作经验列表
 */
function showJobExperience(){
	var userId = $("#id").val();
	var callback = function(data){
		var job_inputs = [];
		if(data.obj.length>0){
			job_inputs.push("job");
		}
		inputs.push(job_inputs);
		changeIconAndColor("job_i",job_inputs);
		
		var trs = $("#job_table").find("tr:gt(1)");
		$(trs).remove();
		
		if(data.obj==null||data.obj.size==0){
			$("#job_table").append("<p>暂无数据</p>");
		}
		$.each(data.obj,function(i,item){
			var d = item;
			var str = "<tr class='text-center'>"
				+"	<td><input type='checkbox' value="+d.id+" /></td>"
				+"	<td>"+d.startTime+"</td>"
				+"	<td>"+d.endTime+"</td>"
				+"	<td>"+d.company+"</td>"
				+"	<td>"+d.job+"</td>"
				+"</tr>";
			$("#job_table").append(str);
		});
		
		
	}
	$.post("queryJobExperienceByUserId.do",{"userId":userId},callback,"json");
}

function showEduExperience(){
	var userId = $("#id").val();
	var callback = function(data){
		var edu_inputs = [];
		if(data.obj.length>0){
			edu_inputs.push("edu");
		}
		inputs.push(edu_inputs);
		changeIconAndColor("edu_i",edu_inputs);
		
		
		var trs = $("#edu_table").find("tr:gt(1)");
		$(trs).remove();
		if(data.obj==null||data.obj.size==0){
			$("#edu_table").append("<p>暂无数据</p>");
		}
		
		$.each(data.obj,function(i,item){
			var d = item;
			var str = "<tr class='text-center'>"
				+"	<td><input type='checkbox' value="+d.id+" /></td>"
				+"	<td>"+d.startTime+"</td>"
				+"	<td>"+d.endTime+"</td>"
				+"	<td>"+d.school+"</td>"
				+"	<td>"+d.mojor+"</td>"
				+"</tr>";
			$("#edu_table").append(str);
		});
		
		
	}
	$.post("queryEduExperienceByUserId.do",{"userId":userId},callback,"json");
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
			bootstrapQ.msg({
				msg: '更新简介信息成功！',
				type: 'success',
				time: 2000
			});
		}else{
			bootstrapQ.msg({
				msg: '更新简介信息失败！',
				type: 'danger',
				time: 2000
			});
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
			bootstrapQ.msg({
				msg: '更新详细信息成功！',
				type: 'success',
				time: 2000
			});
		}else{
			bootstrapQ.msg({
				msg: '更新详细信息失败！',
				type: 'danger',
				time: 2000
			});
		}
	}
	var uId = $("#id").val();
	ue.ready(function(){
		var detail = ue.getContent();
		$.post("updateMyInfoAjax.do",{"id":uId,"detailIntro":detail},callback,"json");		
	})

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
		bootstrapQ.alert("您填写的手机号格式不正确！");
	}
}

/*Delete Friend Functions*/
function deleteFriend(id,name){
	bootstrapQ.confirm({
		title: "删除好友",
		msg: "确定要删除好友 "+name+" 吗？",
		okbtn : "确定",
		qubtn : "取消"},
		function(){
			//Send the Delete Request
			var callback = function(data){
				showAjaxMsg(data);
				showMyFriend();
			}
			$.post("deleteFriend.do",{"id":id},callback,"json");
		});
	
	return;
}

function passApplyFriend(id){
	var callback = function(data){
		showAjaxMsg(data);
		showMyFriend();
	}
	$.post("passApply.do",{"id":id},callback,"json");
	
	return;
}



/**
 * 删除服务
 * @param id
 */
function deleteService(id){
	bootstrapQ.confirm(
		{
			title: "删除服务",
			msg: "确定要删除该服务吗？",
			okbtn : "确定",
			qubtn : "取消"
		},
		function()
		{
			var callback = function(data){
				showAjaxMsg(data);
				showMyService();
			};
			$.post("deleteService.do",{"id":id},callback,"json");
		}
	);
	return;
}

/**
 * 删除项目
 * @param id
 */
function deleteProject(id){
	bootstrapQ.confirm(
		{
			title: "删除项目",
			msg: "确定要删除该项目吗？",
			okbtn : "确定",
			qubtn : "取消"
		},
		function()
		{
			var callback = function(data){
				showAjaxMsg(data);
				showMyProject();
			};
			$.post("deleteProject.do",{"id":id},callback,"json");
		}
	);
	return;
}

/**
 * 点击新增或者修改。改变form提交的action
 * @param option
 */
function doJobExperience(option){
	switch (option) {
	case 'add':
		$("#jobForm").attr("action","addJobExperience.do");
		$('#jobDialog').modal('show');
		break;
	case 'update':
		$("#jobForm").attr("action","updateJobExperience.do");
		var trs = $("#job_table").find("[type=checkbox]:gt(0)");
		var j = 0;
		var id = null;
		$(trs).each(function(i,item){
			if(trs[i].checked){
				j++;
				id = $(item).val();
			}
		})
		if(j==0){
			bootstrapQ.alert("请先选中要修改的行");
		}else if(j>1){
			bootstrapQ.alert("修改时只能选中其中一行");
		}else{
			$('#jobDialog').modal('show');
			var callback = function(data){
				var d = data.obj;
				$("#jobStartTime").val(d.startTime);
				$("#jobEndTime").val(d.endTime);
				$("#company").val(d.company);
				$("#jJob").val(d.job);
				$("#jobId").val(d.id);
			}
			$.post("queryJobExperienceById.do",{"id":id},callback,"json");
		}
		break;	
	case 'delete':
		var trs = $("#job_table").find("[type=checkbox]:gt(0)");
		var j = 0;
		var id = [];
		$(trs).each(function(i,item){
			if(trs[i].checked){
				j++;
				id.push($(item).val());
			}
		})
		if(j==0){
			bootstrapQ.alert("请先选中要删除的行");
		}else{
			var flag = confirm("确定要删除这些列吗?");
			if(flag){
				var callback = function(data){
					showJobExperience();
					bootstrapQ.alert(data.obj);
				}
				$.post("deleteJobExperience.do",{"ids":id.toString()},callback,"json");
			}else{
				return;
			}
			
		}
		break;
	default:
		break;
	}
}

/**
 * 点击新增或者修改。改变form提交的action
 * @param option
 */
function doEduExperience(option){
	switch (option) {
	case 'add':
		$("#eduForm").attr("action","addEduExperience.do");
		$('#eduDialog').modal('show');
		break;
	case 'update':
		$("#eduForm").attr("action","updateEduExperience.do");
		var trs = $("#edu_table").find("[type=checkbox]:gt(0)");
		var j = 0;
		var id = null;
		$(trs).each(function(i,item){
			if(trs[i].checked){
				j++;
				id = $(item).val();
			}
		})
		if(j==0){
			bootstrapQ.alert("请先选中要修改的行");
		}else if(j>1){
			bootstrapQ.alert("修改时只能选中其中一行");
		}else{
			$('#eduDialog').modal('show');
			var callback = function(data){
				var d = data.obj;
				$("#eduStartTime").val(d.startTime);
				$("#eduEndTime").val(d.endTime);
				$("#school").val(d.school);
				$("#mojor").val(d.mojor);
				$("#eduId").val(d.id);
			}
			$.post("queryEduExperienceById.do",{"id":id},callback,"json");
		}
		break;	
	case 'delete':
		var trs = $("#edu_table").find("[type=checkbox]:gt(0)");
		var j = 0;
		var id = [];
		$(trs).each(function(i,item){
			if(trs[i].checked){
				j++;
				id.push($(item).val());
			}
		})
		if(j==0){
			bootstrapQ.alert("请先选中要删除的行");
		}else{
			var flag = confirm("确定要删除这些列吗?");
			if(flag){
				var callback = function(data){
					showEduExperience();
					bootstrapQ.alert(data.obj);
				}
				$.post("deleteEduExperience.do",{"ids":id.toString()},callback,"json");
			}else{
				return;
			}
			
		}
		break;
	default:
		break;
	}
}

/**
 * 提交新增修改工作经验或者教育经验
 * @param diaId
 */
function clickButton(diaId){
	unableDbClick();
	// TODO 不一样
	var form = $("#"+diaId).find("form");
	if(form.size()>1){
		form = $("#"+diaId).find("form[abled=true]");
	}
	var form_attr = $(form).attr("enctype");
	var formId = $(form).attr("id");
	
	if(!formAjaxSubmitCheck(formId)){
		unableDbClick();
		return;
	}
	if(form_attr!="multipart/form-data"){
		
		var url = $(form).attr("action");
		var param = $(form).serialize();
		param = param.replace(/\+/g," "); 
		//由于serialize方法会调用encodeURIComponent()将中文转码。下面调用decode保持正常格式。防止中文乱码
		param = decodeURIComponent(param,true); 
	    var jparam = changeUrlParamsToJson(param);
	    if(diaId!="employeeDialog"){
	    	jparam.userId = $("#id").val();
	    }
	    
	    var callback = function(data){
	    	unableDbClick();
	    	$('#'+diaId).modal('hide');
	    	bootstrapQ.alert(data.obj);
	    	if(diaId.indexOf('job')>=0){
	    		showJobExperience();
	    	}else if(diaId.indexOf('edu')>=0){
	    		showEduExperience();
	    	}
	    	
	    }
	    
	    $.post(url,jparam,callback,"json");
	}else{
		
		$(form).ajaxSubmit({
			dataType: 'json',
			success: function(data){
				unableDbClick();
				bootstrapQ.msg({
					msg: data.obj.substring(data.obj.indexOf("#")+1,data.obj.length),
					type: 'success',
					time: 2000
				})
				$('#'+diaId).modal('hide');
//				$('#'+diaId).find(":input").val("");
				eval($(form).attr("onsuccess"));
			},
			error: function(data){
				unableDbClick();
				bootstrapQ.msg({
					msg: data.obj.substring(data.obj.indexOf("#")+1,data.obj.length),
					type: 'danger',
					time: 2000
				})
			}
		});
	}
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
	var callback = function(data){
		showAjaxMsg(data);
	}
	$.post("updateMyInfoAjax.do",{"currentStatus":val},callback,"json");
}

function changeIsServiceShow(dom){
	var val = $(dom).val();
	var callback = function(data){
		showAjaxMsg(data);
	}
	$.post("updateMyInfoAjax.do",{"showService":val},callback,"json");
}

function changeIsInfoShow(dom){
	var val = $(dom).val();
	var callback = function(data){
		showAjaxMsg(data);
	}
	$.post("updateMyInfoAjax.do",{"showInfo":val},callback,"json");
}

//============================== 选择职业的联动框 ================================================
function setJob(){
	var c = $("#cJob").children();
	$(c).remove();
	$("#cJob").append("<option value='0'>请选择</option>");
	$(main_menu).each(function(i,item){
		$("#cJob").append("<option value='"+item[0]+"'>"+item[1]+"</option>");
	});
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

function acceptOrRefuseIntval(url){
	var callback = function(data){
		bootstrapQ.alert(data.obj);
	}
	$.post(url,null,callback,"json");
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
		bootstrapQ.alert("您填写的手机号格式不正确！");
	}
}

function initPageByType(){
	var type = $("#hidType").val();
	switch (type) {
	case "2":
		$("#intro_title").text("团队简介");
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
		bootstrapQ.alert("请选择您要邀请的用户。");
	}else{
		$("#employee_name").val($($(tr).find("td[id=nickName]")).html());
		$("#employee_job").val($($(tr).find("td[id=job]")).html());
		$("#employee_area").val($($(tr).find("td[id=area]")).html());
		$("#employee_userId").val($($(tr).find("input[id=userId]")).val());
		hideDropDown();
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
	if($("#phoneCodeForm").valid()){
		var callback = function(data){
			if(data.msgNo=="1"){
				bootstrapQ.msg({
					msg: '绑定手机成功！',
					type: 'success',
					time: 2000
				});
				refreshPage();
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
	
	
	
}

function submitEmailActive(){
	if($("#emailCodeForm").valid()){
		var callback = function(data){
			if(data.msgNo=="1"){
				bootstrapQ.msg({
					msg: '验证邮件已发送，请登录邮箱查收。',
					type: 'success',
					time: 2000
				});
				refreshPage();
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
			sysHtml += '<i value="'+item.id+'" '+(ids.indexOf(item.id+"")>-1?'class="active"':'')+'>'+item.name+'</i>'
		});
		
		$.each(bstList_user,function(i,item){
			userHtml += '<i value="'+item.id+'" '+(ids.indexOf(item.id+"")>-1?'class="active"':'')+'><span class="glyphicon glyphicon-remove"></span>'+item.name+'</i>'
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


//alipay
//充值
function toCharge(){
	bootstrapQ.dialog({
		url: "order/toPayOrder.do?type=2&orderId=-1",
		type: "post",
		title: "确认充值信息",
		msg: '正在加载...',
		mstyle:'width:500px;',
		foot: true
	}, function(){
		if($("#payForm").valid()){
			$("#payForm").submit();
			bootstrapQ.confirm({
				id: 'bsconfirm',
				okbtn: '支付完成',
				qubtn: '支付遇到问题',
				msg: "请在支付宝页面完成支付。"
			},function(){
				account_firstPage.click();
				return true;
			},function(){
				return true;
			});
			return true;
		}else{
			return false;
		}
		
		
	});
}

//alipay end


// 团队 成员 相关动作

function doPageSplit(dom,callback){
	$.pg.param.name = $("#employee_name").val();
//	$.pg.param.companyId = $("#_companyId").val();
	$.post($(dom).val(),$.pg.param,eval(callback),"json");
}



$(document).on("init","#TeamArea",function(){
	//alert("show");
	$.post("queryTeamList.do",null,function(msg){
		$("#TeamTable").html("");
		var isPartin = false;
		if( msg.msgNo == 1 ){
			if( msg.obj[0].schedule == "11" ){
				isPartin = true;
			}
			$.each(msg.obj,function(i,item){
				var schedule = "";
				var button = "";
				if(item.schedule=="10"){
					schedule = "<span style='color:green'>受邀</span>";
					if( isPartin ){
						button = "<button type='button' class='btn btn-success' onclick=\"fakePartInTeam("+ item.companyId +")\">加入</button>";
					}else{
						button = "<button type='button' class='btn btn-success' onclick=\"partInTeam("+ item.companyId +")\">加入</button>";
					}
					
				}else if(item.schedule=="11"){
					schedule = "<span style='color:green'>已加入</span>";
					button = "<button type='button' class='btn btn-danger' onclick=\"exitTeam("+ item.companyId +")\">退出</button>";
				}else {
					schedule = "" + schedule;
				}
				var str = "<tr class='text-center'>"
					+"	<td><img width='50px' height='50px' src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + item.headImg +"' />"
					+"	</td>"
					+"	<td>"+ item.NICKNAME +"</td>"
					+"	<td>" + schedule + "</td>"
					+"	<td>" + button + "</td>"
					+"</tr>";
				$("#TeamTable").append(str);
			})
			
			
		}
	},"json");
})



function initEmployee(data){
	var trs = $("#employeeTable").children();
	var d = data.obj;
	$(trs).remove();
	var str = "<p>暂无数据</p>";
	if(data.msgNo == '0'){
		bootstrapQ.alert(data.msg);
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
			bootstrapQ.alert("请先选中要修改的行");
		}else if(j>1){
			bootstrapQ.alert("修改时只能选中其中一行");
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
			bootstrapQ.alert("请先选中要删除的行");
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
					bootstrapQ.alert(data.obj);
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
		bootstrapQ.alert(data.msg);
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
	$("#_firstPage3").click();
}

function checkHidCheckBox(dom){
	$($(dom).next())[0].checked = $(dom)[0].checked;
}

function refleshEmployeeTable(){
	chipTo('refresh',$("#_firstPage3"));
}

function initQyzz(){
	var qyzzFlag = $("#_qyzzFlag").val();
	if(qyzzFlag==undefined||qyzzFlag == ""||qyzzFlag==null){
		var qyzz = $("#qyzzForComputeScore").val();
		if(qyzz == undefined||qyzz == ""||qyzz == null){
			$("#qyzzFlag").text("状态：未上传");
		}else{
			$("#qyzzFlag").text("状态：正在认证...将在上传后7个工作日内完成。");
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




//提现
function toGetCharge(){
	bootstrapQ.dialog({
		url: "account/toGetCharge.do",
		type: "post",
		title: "余额提现",
		msg: '正在加载...',
		okbtn : "提交",
		qubtn: '取消',
		mstyle:'width:550px;',
		foot: true,
		callback: function(){
			
		}
	}, function(){
		if($("#chargeForm").valid()){
			$("#chargeForm").ajaxSubmit({
				dataType: "json",
				success: function(data){
					if(data.msgNo=='1'){
						bootstrapQ.msg({
							msg: "提现申请提交成功，1-2个工作日内将打入您的账户内。",
							type: 'success',
							time: 2000
						});
						account_firstPage.click();
					}else{
						bootstrapQ.msg({
							msg: data.obj,
							type: 'danger',
							time: 2000
						})
					}
					
				},
				error: function(data){
					bootstrapQ.msg({
						msg: "提现失败！",
						type: 'danger',
						time: 2000
					})
				}
			});
			
			
			return true;
		}else{
			return false;
		}
		
		
	});
}
//alipay end




function exitTeam(id){
	$.post("deleteTeamRelation.do",{
		companyId : id
	},function(ret){
		$("#TeamArea").trigger("init");
		bootstrapQ.msg({
			msg: ret.obj,
			type: ret.msgNo == 1 ? 'success' : 'danger',
			time: 2000
		})
	},"json")
}


function fakePartInTeam(){
	bootstrapQ.msg({
		msg: "您已加入团队，退出后才能加入新团队。",
		type: 'danger',
		time: 2000
	})
}
function partInTeam(id){
	$.post("addOrUpdateEmployee.do",{
		option : "update",
		companyId : id,
		schedule : 11
	},function(ret){
		$("#TeamArea").trigger("init");
		bootstrapQ.msg({
			msg: ret.obj,
			type: ret.msgNo == 1 ? 'success' : 'danger',
			time: 2000
		})
	},"json")
	
}

//用户认证start

//查询用户认证信息
function queryYhrzInfo(){
	
	$.post("idCard/getIdCardByUserId.do",null,function(data){
		var zj = ['','个人','团队','企业'];
		var type = $("#hidType").val();
		if(!type)type=0;
		type = type>3?0:type;
		if(data.msgNo=='1'){
			var d = data.obj;
			if(!d){
//				$("#yhrzTip").text("请上传"+zj[type]+"证件照。");
				$("#yhrzTip").text("");
				$("#yhrzStatus").html("（状态：未认证）");
				$("#yhrzForm").removeClass("hidden");
			}else if(d.status=='0'){
				$("#yhrzTip").text("工作人员将在7个工作日内完成认证资料的审核，请耐心等待。");
				$("#yhrzStatus").html("（状态：待审核）");
				$("#yhrzForm").addClass("hidden");
			}else if(d.status=='1'){
				$("#yhrzTip").text("您已通过"+zj[type]+"实名认证。");
				$("#yhrzStatus").html("（状态：已认证）");
				$("#yhrzForm").addClass("hidden");
			}else if(d.status=='2'){
				$("#yhrzTip").text("您的认证资料未通过审核，请重新提交申请。原因："+d.note);
				$("#yhrzStatus").html("（状态：审核未通过）");
				$("#yhrzForm").removeClass("hidden");
			}
		}else{
			$("#yhrzTip").text("查询认证信息失败.");
			$("#yhrzStatus").text("（状态：未知）");
			$("#yhrzForm").addClass("hidden");
		}
	},"json");
}


//提交用户认证
function submitYhrz(){
	unableDbClick();
	var type = $("#hidType").val();
	if(type!=3){
		$.validator.addMethod("sfz",function(value,element,params){  
			var _personcode = /^\d{15}(\d\d[0-9xX])?/;
			return _personcode.test(value);
		},"身份证号码格式错误");
	}
	
	var $form = $("#yhrzForm");
	if($form.valid()){
		if(type!=3){
			$("#idCard2").attr("name","idCard");
		}
		$form.ajaxSubmit({
			dataType: 'json',
			success: function(data){
				unableDbClick();
				if(type!=3){
					$("#idCard2").attr("name","idCard2");
				}
				if(data.msgNo=='1'){
					bootstrapQ.msg({
						msg: '提交成功！',
						type: 'success',
						time: 2000
					});
					queryYhrzInfo();
				}else{
					bootstrapQ.msg({
						msg: '提交失败！',
						type: 'danger',
						time: 2000
					});
				}
			},
			error: function(data){
				unableDbClick();
				if(type!=3){
					$("#idCard2").attr("name","idCard2");
				}
				bootstrapQ.msg({
					msg: '发生了未知的网络错误，请稍后重试！',
					type: 'danger',
					time: 2000
				});
			}
		});
	}else{
		unableDbClick();
	}
}

//用户认证end

