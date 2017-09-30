$(function(){
	$("#tab_p3").addClass("active");
	pcaId = "country"; //定义在commonjs中
	queryProvince();
	queryBusiSmlType();
	var lis = $("#searchArea").find(".searchLabel>li");
	$(lis).bind("click",function(e){
		var p = $(this).parent();
		var lis2 = $(p).find("li");
		$(lis2).each(function(i,item){
			$(item).removeClass("liActive");
		});
		$(this).addClass("liActive");
		queryServiceListData();
	});

	queryServiceListData();
	createDialog("dia_joinPrj","申请服务>>添加留言","join_msgDiv");
})

//参数：智能搜索，页码，行数
var params = {
	searchWord:"",page:"",rows:"",busiType:"",busiSmlType:"",
	serArea:"",price:"",pType:"",isRecommend: "0"
};

function setParams(){
	params.page = PAGE;
	params.rows = ROW;
	params.searchWord = $("#searchWords").val();
	params.sort = JSON.stringify($sortParams);
	params.isRecommend = $("#isRecommend")[0].checked?1:0;
	
	var lis = $("#searchArea").find(".liActive");
	$(lis).each(function(i,item){
		var p = $(item).parent();
		var v = $(item).attr("value");
		if(v==""||v==null||v==undefined||v=="-1"||v.length==0){
			//-1是选择了其它的情况。
			return false;
		}else if(v=="0"){
			//0是选择了全部的情况
			var id = $(p).attr("id");
			switch (id) {
			case 'jobArea':
				params.busiSmlType = "";
				break;
			case 'pcaArea':
				params.serArea = "";
				break;
			case 'priceArea':
				params.price = "";
				break;	
			case 'pTypeArea':
				params.pType = "";
				break;
			default:
				break;
			}
		}else{
			//正常选择的情况
			var id = $(p).attr("id");
			switch (id) {
			case 'jobArea':
				if($(item).attr("id")=="otherJob"){
					params.busiSmlType = v;
				}else{
					params.busiSmlType = $(item).text();
				}
				
				break;
			case 'pcaArea':
				params.serArea = v;
				break;
			case 'priceArea':
				params.price = v;
				break;
			case 'pTypeArea':
				params.pType = v;
				break;
			default:
				break;
			}
		}
	});
}

function queryServiceListData(){
	var c = $("#serArea").children();
	$(c).remove();
	$("#serArea").append("<div class='loading'></div>");
	var uId = $("#hidUserId").val();
	setParams();
	var callback = function(data){
		$($("#serArea").children()).remove();
		initPageToolBar(data.obj.total);
		if(data.obj.total=="0"){
			$("#serArea").append("<p>暂无数据</p>");
			return;
		}
		$.each(data.obj.rows,function(i,item){
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
				_price = "<span class='price'>面议</span>&nbsp;&nbsp;";
			}else{
				_price = "<span class='price'><i class='glyphicon glyphicon-yen'></i>" + d.STARTPRICE +"-"+ d.ENDPRICE +"</span>&nbsp;&nbsp;";
			}
			
			var recommendtagstr = ""; 	
			if(d.IS_RECOMMEND && d.IS_RECOMMEND != "0") 
			{
				recommendtagstr = "<span class='claim1'> <a style='color:#f80;'>平台推荐</a></span>";	
			}
			
			var str2 = "<li>"
				+"	<i class='cell logo w12'>"
				+"		<a href='toService2.do?id="+d.ID+"' target='_blank'>"
				+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
				+"		</a>"
				+"	</i> "
				+"	<i class='cell commpany w30'>"
				+"		<span class='name'>"
				+"			<a href='toService2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a>"
				+recommendtagstr
				+"		</span>"
				+"			<span class='desc'><span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE*5)+"(好评率"+Math.round(d.SCORE*100)+"%)</span></span>"
				+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),50)+"</span>"
				+"			<span class='desc'>"
				+"				发布人：<a href='toUserDetail2.do?id="+d.PUBLISHER+"'>"+d.NICKNAME+"</a>"
				+"				<a title='发送站内信' class='btn btn-default btn-xs' onclick='initMsgDalog(\""+d.PUBLISHER+"\")'><span class='glyphicon glyphicon-envelope'></span></a>"
				+" 			</span>"
				+"	</i>"
				+"  <i class='cell round w10'>"+nvl(d.AREA,"未知区域").split(" ")[0] +"</i>"
				+"	<i class='cell round w10'>" + nvl($p.busiType[d.BUSITYPE],"暂无") + "<br/>" + cutLongTxt(nvl(d.KEYWORDS,"暂无"),10) +"</i>"
				+"	<i class='cell amount w10'> "+ _price +"</i>"
				+"  <i class='cell round w8'>"+ str +"</i>"
				+"  <i class='cell round w10'>" 
				+(d.ISLIKED==0?"<a class='mylink' href='javascript:void(0)' onclick='doLike("+d.ID+")'><span class='glyphicon glyphicon-plus p5'></span>收藏</a>":"<label class='label label-success'>已收藏</label>") 
				+"	</i>"
				+"	<i class='cell date w10'>"+d.PUBLISHTIME+"</i>"
				+"</li>";
			
			$("#serArea").append(str2);
		});
	}
	$.post("queryServiceListData.do",params,callback,"json");
}

function chipPage(){
	queryServiceListData();
}

function addRelation(id){
	var flag = confirm("确定要预定此服务吗？");
	if(flag){
		var param = {"proId":id,"type":"1"};
		var callback = function(data){
			alert(data.obj);
			if(data.msgNo=="1"){
				queryServiceListData();
			}
		}
		$.post("addRelation.do",param,callback,"json");
	}
	
}

function doLike(id){
	var callback = function(data){
		queryServiceListData();
	}
	$.post("doLikeProject.do",{"projectId":id,"type": 1},callback,"json");
}

/*function showJoinMsg(text){
	$("#join_job_input").val(text);
	$("#join_job_label").text(text);
	showDialogFooter("dia_joinPrj");
}

function joinService(id){
	showJoinMsg("");
	
	$("#joinPrj_projectId").val(id);
	$('#dia_joinPrj').modal('show');
}*/

function clickButton(id){
	var param = {"type":"1"};
	var callback = function(data){
		alert(data.obj);
		$('#dia_joinPrj').modal('hide');
		if(data.msgNo=="1"){
			queryServiceListData();
		}
	}
	postFormByAjax("joinPrj_form", param, callback);
}


function showCountry(){
	showOrHideDiv("country",false);
}

function showSmlType(){
	showOrHideDiv("job",false);
}

function selectOtherArea(dom){
	var v = $(dom).val();
	if(v=="-1"){
		return;
	}else{
		$("#otherArea").val(v);
		$("#otherArea>a").click();
	}
}

function queryBusiSmlType(){
	var callback = function(data){
		var bst = data.obj;
		$.each(bst,function(i,item){
			var str = "<option value='"+item.id+"'>"+item.name+"</option>";
			$("#cBusiSmlType").append(str);
		});
		$("#cBusiSmlType").select2({
		})
	}
	
	$.post("keyWords/getForSelecter.do",null,callback,"json");
}

function selectOtherSmlType(dom){
	var v = $(dom).find("option:selected").text();
	if(v=="-1"){
		return;
	}else{
		$("#otherJob").attr("value",v);
		$("#otherJob>a").click();
	}
}


function queryByBusiType(busiType,dom){
	params.busiType = busiType;
	queryServiceListData();
	var p = $(dom).parent();
	var c = $(p).children(".btn-xs");
	$(c).removeClass("btn-info").addClass("btn-default");;
	$(dom).addClass("btn-info");
}