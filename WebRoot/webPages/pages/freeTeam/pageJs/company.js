$(function(){
	$("#tab_p4").addClass("active");
	var img = $(".qyImg").find("img");
	$(img).bind("click",function(e){
		$(img).each(function(i,item){
			$(item).animate({'width' : "22%"});
		})
		$(this).animate({'width' : "52%"});
	}).bind("dbclick",function(e){
		$(img).each(function(i,item){
			$(item).animate({'width' : "32%"},0);
		})
	});
	
	initCompanyIntro();
	
	$("#_firstPage1").click();
	initEmployeeList();
	
});

/**
 * 初始化企业介绍
 */
function initCompanyIntro(){
	
	var userId = $("#company_userId").val();
	console.log(userId);
	
	var callback = function(data){
		var d = data.obj;
		if(d.msgNo == "1"){
			showAjaxMsg(d);
		}else{
			$("#headImg").attr("src",$("#basePath").val() + "webPages/upload/headpic/" + d.headImg);
			$("#company_name").text(d.nickName);
			$("#company_area").text(d.area);
			$("#company_url").text(d.hostUrl).attr("src",d.hostUrl);
			$("#company_tel").text(d.conTel);
			$("#company_intro").text(d.intro);
			
			if(d.qyImg1||d.qyImg2||d.qyImg3){
				$("#qyImg1").attr("src",$("#basePath").val()+ "webPages/upload/qyImg/" + d.qyImg1);
				$("#qyImg1").attr("title",d.qyImgDescribe1);
				
				$("#qyImg2").attr("src",$("#basePath").val()+ "webPages/upload/qyImg/" + d.qyImg2);
				$("#qyImg2").attr("title",d.qyImgDescribe2);
				
				$("#qyImg3").attr("src",$("#basePath").val()+ "webPages/upload/qyImg/" + d.qyImg3);
				$("#qyImg3").attr("title",d.qyImgDescribe2);
				
				$("#qyImgDiv").show().animate({display: 'block',width: "80%"});
				$("#qyImgDiv").siblings("p").remove();
			}
			
//			$("#company_").text(d.);
		}
	}
	
	$.post("queryCompanyIntro.do",{"userId":userId},callback,"json");
}

function doPageSplit(dom,callback){
	$.pg.param.userId = $("#company_userId").val();
	$.post($(dom).val(),$.pg.param,eval(callback),"json");
}

/**
 * 定义初始化服务列表的回调函数
 */
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
				if(d.SCHEDULE=='0'){
					str = "<div class='fRight'><a class='btn btn-default btn-sm'>已<span class='p3'/>申<span class='p3'/>请</a></div>";
				}else if(d.SCHEDULE=='1'){
					str = "<div class='fRight'><a class='btn btn-success btn-sm'>已<span class='p3'/>接<span class='p3'/>受</a></div>";
				}else if(d.SCHEDULE=='2'){
					str = "<div class='fRight'><a class='btn btn-danger btn-sm'>未<span class='p3'/>接<span class='p3'/>受</a></div>";
				}else{
					str = "<div class='fRight'>"
						+ "<a class='btn btn-info btn-sm' href='javaScript:void(0)' title='点击将会发送私信到创建者信箱' onclick='joinService("+d.ID+")'>预订服务</a>"
						+ "</div>";
				}
				var hidUserId = $("#hidUserId").val(); 
				if(hidUserId == d.PUBLISHER){
//					str = "<div class='fRight'><a class='btn btn-primary btn-sm' href='toUpdateService.do?id="+d.ID+"'>预定服务</a></div>";
					str = "<div class='fRight' title='不能预订自己的服务'><a class='btn btn-info btn-sm' disabled='disabled'>预订服务</a></div>";
				}
				var _price = "";
				if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
					_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
				}else{
					_price = "<span class='price'>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>元&nbsp;&nbsp;";
				}
				var str2 = "<li>"
					+"	<i class='cell logo w12'>"
					+"		<a href='#' target='_blank'>"
					+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
					+"		</a>"
					+"	</i> "
					+"	<i class='cell commpany w25'>"
					+"		<span class='name'>"
					+"			<a href='toService2.do?id="+d.ID+"'>"+d.NAME+"</a></span>"
					+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),20)+"</span>"
					+"			<span class='desc'> </span>"
					+"	</i>"
					+"	<i class='cell round w20'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "/" + nvl(d.BST,"暂无") +"</i>"
					+"	<i class='cell amount w10'> "+ _price +"</i>"
					+"	<i class='cell investor w6'>"
					+"		<a title='发送站内信' class='btn btn-default btn-xs' onclick='initMsgDalog(\""+d.PUBLISHER+"\")'><span class='glyphicon glyphicon-envelope'></span></a>"
					+"	</i>"
					+"	<i class='cell round w15'><span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE)+Math.round(d.SCORE/5*100)+"%</span></i>"
					+"	<i class='cell date w12'>"+d.PUBLISHTIME+"</i>"
					+"</li>";
				$("#serArea").append(str2);
			});
		}
	}else if(data.msgNo=="2"){
		var c = $("#serArea").children();
		$(c).remove();
		$("#serArea").append("<p style='color:red'>该用户设置了不显示服务列表。</p>");
	}else{
		alert(data.obj);
	}
}

function initEmployeeList(){
	var callback = function(data){
		var c = $("#showEmployeeDiv").children();
		$(c).remove();
		var d = data.obj;
		if(data.msgNo=="0"){
			$("#showEmployeeDiv").append("<p>发生了位置错误，未能查找到数据</p>");
			return;
		}
		
		if($(d.rows).size()>0){
			$.each(d.rows,function(i,item){
				var qyClass = "qyClass_default";
				if(item.userId == "-1"){
					qyClass = "qyClass";
				}
				
//				var str = "<div class='col-xs-3 p5'>"
//					+"	<div class='thinBorder " + qyClass + "'>"
//					+"		<div style='width:50%' class='fLeft'>"
//					+"			<img class='p5 whiteBorder' src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + item.headImg +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"' width='100px' height='100px'/>"
//					+"		</div>"
//					+"		<div style='width:50%' class='fLeft p5_0'>"
//					+"			<p><span class='glyphicon glyphicon-user'>&nbsp;</span><a href='toUserDetail.do?id="+ item.userId +"'>"+ item.nickName +"</a></p>"
//					+"			<p><span class='glyphicon glyphicon-map-marker'>&nbsp;</span>"+ item.area +"</p>"
//					+"			<p><span class='glyphicon glyphicon-lock'>&nbsp;</span>"+ getJob(item.job).main_job+"/"+getJob(item.job).sub_job +"</p>"
//					+"			<p><span class='glyphicon glyphicon-tags'>&nbsp;</span>"+ item.mark +"</p>"
//					+"		</div>"
//					+"		<div class='clear'></div>"
//					+"	</div>"
//					+"</div>";
				
				var str = "<div class='itemService'>"
					+"	<a "+ (item.userId=='-1'?'':"href='toUserDetail2.do?id=" + item.userId + "'") + ">"
					+"		<img src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + item.headImg +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"' >"
					+"	</a>"
					+"	<div class='serContent'>"
					+"			<p><span class='glyphicon glyphicon-user'>&nbsp;</span><a href='toUserDetail2.do?id="+ item.userId +"'>"+ item.nickName +"</a></p>"
					+"			<p><span class='glyphicon glyphicon-tags'>&nbsp;</span>"+ item.mark +"</p>"
					+"	</div>"
					+"</div>";
				if(item.userId=="-1"){
					$("#employee_self").append(str);
				}else{
					$("#employee_local").append(str);
				}
				
			})
		}else{
			$("#employee_local").append("<p>暂无数据</p>");
			$("#employee_self").append("<p>暂无数据</p>");
		}
	}
	
	
	
	$.post("queryCompanyUserRelationList.do",{"companyId":$("#company_userId").val(),"rows":20,"schedule":1},callback,"json");
}