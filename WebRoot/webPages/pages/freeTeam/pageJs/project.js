$(function(){
	$("#tab_p2").addClass("active");
//	queryProjectNeed();
	setProLikeData();
//	var bt = $("#busiType").html();
//	$("#busiType").html(getVocationValue(bt).parentVocation+"/"+getVocationValue(bt).vocation);

	//查看是否预订过该服务
	var schedule = $("#schedule").val();
	var str = "";
	if(schedule=="-1"){
		str = "<a href='javaScript:void(0)' onclick='cbPrj("+$("#projectId").val()+")' title='点击将会发送私信到创建者信箱'>承包项目</a>";
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
		str = "<a href='toUpdateProject.do?id="+$("#projectId").val()+"'>修改项目</a>";
	}
	
	var tmpc = $("#pro_schedule").children();
	$(tmpc).remove();
	$("#pro_schedule").append(str);
	
	queryOthersProject();
	
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

/**
 * 显示招人条件
 */
function showZRTiaojian(li){
	var tj = $(li).next("div.tiaojian");
	$(tj).animate({'height':'+=200px'},500);
}


function hideZRTiaojian(li){
	var tj = $(li).next("div.tiaojian");
	$(tj).animate({'height':'-=200px'},500);
}


function queryProjectNeed(){
	var callback = function(data){
		var data = data.obj;
		var year = {"0":"不限","1":"一年","2":"两年","3":"三年以上","4":"五年以上","5":"十年以上"};
		var edu = {"0":"不限","1":"高中","2":"专科","3":"本科","4":"硕士","5":"博士"};
		var c = $("#zr").children();
		$(c).remove();
		
		if(data.length==0){
			$("#zr").append("<p>暂无数据</p>");
			return;
		}
		$.each(data,function(i,item){
			var zrStr = "<li>"
				+"	<a>"+getJob(item.jposition).main_job + "/" + getJob(item.jposition).sub_job+"</a>"
				+"</li>"
				+"<div class='thinBorder tiaojian' style='height: 0px;'>"
				+"	学&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;历：<span>"+edu[item.eduLevel]+"</span><br/>"
				+"	工作经验：<span>"+year[item.years]+"</span><br/>"
				+"	其&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;它：<span>"+item.othersNeed+"</span>"
				+"</div>";
			$("#zr").append(zrStr);
		});
		
		$("#zr>li").bind('click',function(){
			var tj = $(this).next("div.tiaojian");
			
			if($(this).hasClass("myactive")){
				$(this).removeClass("myactive");
				$(tj).animate({'height':'-=200px'},500);
			}else{
				var tmp = $($("#zr").find(".myactive"))[0];
				var tmp2 = $(tmp).next("div.tiaojian");
				$(tmp2).animate({'height':'-=200px'},500);
				$("#zr>li").removeClass("myactive");
				$(this).addClass("myactive");
				$(tj).animate({'height':'+=200px'},500);
			}
		});
	}
	$.post("queryProgramerNeedData.do",{"projectId":$("#projectId").val()},callback,"json");
}

function setProLikeData(){
	var c = $("#likeCnts").children();
	$(c).remove();
	var callback = function(data){
		if(data.msgNo=="1"){
			var cor = "";
			if(data.obj.isILiked!="0"){
				cor = "已关注";
			}else{
				cor = "关注";
			}
			var p = "<span onclick='doLike1();' title='喜欢就关注这个项目吧'>"
				+"	<span id='likeCnts'>"+cor+"("+data.obj.totalLike+")</span>"
				+"</span>";
			$("#likeCnts").append(p);
		}
	}
	$.post("queryLikeData.do",{"projectId":$("#projectId").val(),"type": 0},callback,"json");
}

function doLike1(){
	var callback = function(data){
		setProLikeData();
	}
	$.post("doLikeProject.do",{"projectId":$("#projectId").val(),"type": 0},callback,"json");
}

function doLike(id){
	var callback = function(data){
		queryOthersProject();
	}
	$.post("doLikeProject.do",{"projectId":id,"type": 0},callback,"json");
}

function queryOthersProject(){
	var callback = function(data){
		var c = $("#otherProArea").children();
		$(c).remove();
		
		var data2 = data.obj;
		$.each(data2,function(i,item){
			var d = data2[i];
			var str = "";
			var hidUserId = $("#hidUserId").val(); 
			if(hidUserId == d.PUBLISHER){
				str = "<a onclick='bootstrapQ.alert(\"不能承接自己的项目！\")' class='mybtn-primary' disabled='disabled' >承接</a>";
			}else{
				str = "<a class='mybtn-primary' href='toUndertakeProject.do?id="+d.ID+"' title='点击将会发送私信到创建者信箱'>承接</a>";
			}
			
			var _price = "";
			if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
				_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
			}else{
				_price = "<span class='price'><i class='glyphicon glyphicon-yen'></i>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>&nbsp;&nbsp;";
			}
			
			var str2 = "<li>"
				+"	<i class='cell logo w12'>"
				+"		<a href='toProject2.do?id="+d.ID+"'" + "target='_blank'>"
				+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
				+"		</a>"
				+"	</i> "
				+"	<i class='cell commpany w30'>"
				+"		<span class='name'>"
				+"			<a href='toProject2.do?id="+d.ID+"'" + "target='_blank'>"+d.NAME+"</a></span>"
				+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),50)+"</span>"
				+"	</i>"
				+"	<i class='cell round w10'>"+nvl(d.AREA,"未知地区").split(" ")[0]+"</i>"
				+"	<i class='cell round w10'>"+nvl(d.BUSISMLTYPE,"暂无分类")+"</i>"
				+"	<i class='cell amount w10'> "+ _price +"</i>"
				+"	<i class='cell investor w8'>"
				+ str
				+"	</i>"
				+"	<i class='cell investor w10'>" 
				+(d.ISLIKED==0?"<a class='mylink' href='javascript:void(0)' onclick='doLike("+d.ID+")'><span class='glyphicon glyphicon-plus p5'></span>关注</a>":"<label class='label label-success'>已关注</label>") 
				+"	</i>"
				+"	<i class='cell date w10'>"+d.PUBLISHTIME+"</i>"
				+"</li>";
			
			$("#otherProArea").append(str2);
		})
	}
	var pId = $("#projectId").val();
	var uId = $("#publisher").val();
	$.post("queryOthersProject.do",{"projectId":pId,"publisher":uId},callback,"json");
}

/*function addRelation(id){
	var flag = confirm("确定要申请加入项目吗？");
	if(flag){
		var param = {"proId":id,"type":"0"};
		var callback = function(data){
			if(data.msgNo=="0"){
				alert(data.obj);
			}
		}
		$.post("addRelation.do",param,callback,"json");
	}
	
}*/

function clickButton(id){
	var param = {"type":"0"};
	var callback = function(data){
		alert(data.obj);
		$('#dia_joinPrj').modal('hide');
		if(data.msgNo=="1"){
			window.location.href = window.location.href;
		}
	}
	postFormByAjax("joinPrj_form", param, callback);
}

//评论start
function doPageSplit(dom,callback){
	$.pg.param.rows = "10";
	$.post($(dom).val(),$.pg.param,eval(callback),"json");
}

var initCommentList = function(data){
	var tmp = ['','差评','一般','中评','好评','好评'];
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

function addPrjComment(){
	//type 0 项目  1 服务 2用户  -----  isReply  0 1级评论  1 二级评论
	bootstrapQ.dialog({
		url : 'comment/toComment.do?type=0&isReply=0&toId='+$("#projectId").val(),
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
	    			$("#_firstPage1").click();
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

