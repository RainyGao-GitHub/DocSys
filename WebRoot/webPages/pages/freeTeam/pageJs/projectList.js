$(function(){
	$("#tab_p2").addClass("active");
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
		queryProjectListData();
	});
	
	queryProjectListData();
//	createDialog("dia_joinPrj","加入项目>>选择职业","dia_content_joinPrj");
	
})

//参数：智能搜索，页码，行数
//var params = {searchWord:"",page:"",rows:"",busiSmlType:"",prjArea:"",price:"",pType:"",sort_jj:"",sort_xy:"",sort_ys:""};
var params = {searchWord:"",page:"",rows:"",busiSmlType:"",prjArea:"",price:"",pType:"",isRecommend: "0"};

function setParams(){
	params.page = PAGE;
	params.rows = ROW;
	params.searchWord = $("#searchWords").val();
	params.isRecommend = $("#isRecommend")[0].checked?1:0;
	
	params.sort = JSON.stringify($sortParams);
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
				params.prjArea = "";
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
				params.prjArea = v;
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

function queryProjectListData(){
	var c = $("#proArea").children();
	$(c).remove();
	$("#proArea").append("<div class='loading'></div>");
	setParams();
	var callback = function(data){
		$($("#proArea").children()).remove();
		initPageToolBar(data.obj.total);
		if(data.obj.total=="0"){
			$("#proArea").append("<p>暂无数据</p>");
			return;
		}
		$.each(data.obj.rows,function(i,item){
			var d = item;
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
			
			var recommendtagstr = ""; 	
			if(d.IS_RECOMMEND && d.IS_RECOMMEND != "0") 
			{
				recommendtagstr = "<span class='claim1'> <a style='color:#f80;'>平台推荐</a></span>";	
			}
			
			var str2 = "<li>"
					+"	<i class='cell logo w12'>"
					+"		<a href='toProject2.do?id="+d.ID+"'  target='_blank'>"
					+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/project/" + d.PROLOG +"' onerror='this.src=\"webPages/images/project.jpg\"'></span>"
					+"		</a>"
					+"	</i> "
					+"	<i class='cell commpany w30'>"
					+"		<span class='name'>"
					+"			<a href='toProject2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a>"			
					+recommendtagstr
					+"      </span>"
					+"			<span class='desc'>"+cutLongTxt(nvl(d.INTRO,"暂无简介"),50)+"</span>"
					+"			<span class='desc'>"
					+"				发布人：<a class='p5' href='toUserDetail2.do?id="+d.PUBLISHER+"'>"+d.NICKNAME+"</a>"
					+"				<a title='联系对方' class='btn btn-default btn-xs' onclick='initMsgDalog(\""+d.PUBLISHER+"\")'><span class='glyphicon glyphicon-envelope'></span></a>"
					+" 			</span>"
					+"	</i>"
					+"	<i class='cell round w10'>"+nvl(d.AREA,"未知地区").split(" ")[0]+"</i>"
					+"	<i class='cell round w10'>"+cutLongTxt(nvl(d.KEYWORDS,"暂无分类"),10)+"</i>"
					+"	<i class='cell amount w10'> "+ _price +"</i>"
					+"	<i class='cell investor w8'>"
					+str
					+"	</i>"
					+"	<i class='cell investor w10'>" 
					+(d.ISLIKED==0?"<a class='mylink' href='javascript:void(0)' onclick='doLike("+d.ID+")'><span class='glyphicon glyphicon-plus p5'></span>关注</a>":"<label class='label label-success'>已关注</label>") 
					+"	</i>"
					+"	<i class='cell date w10'>"+d.PUBLISHTIME+"</i>"
					+"</li>";
			$("#proArea").append(str2);
		});
	}
	$.post("queryProjectListData.do",params,callback,"json");
}

function chipPage(){
	queryProjectListData();
}

function queryProjectNeed(id){
	$('#dia_joinPrj').modal('show');
	$("#joinPrj_projectId").val(id);
	showJobChoose();
	var c = $("#joinPrj_table").find("tr:gt(0)");
	$(c).remove();
	$("#joinPrj_table").append("<tr><td colspan='4'><div class='loading'></div></td></tr>");
	var callback = function(data){
		var data = data.obj;
		var year = {"0":"不限","1":"一年","2":"两年","3":"三年以上","4":"五年以上","5":"十年以上"};
		var edu = {"0":"不限","1":"高中","2":"专科","3":"本科","4":"硕士","5":"博士"};
		var c = $("#joinPrj_table").find("tr:gt(0)");
		$(c).remove();
		if(data.length==0){
			$("#joinPrj_table").append("<tr><td colspan='4'>暂无数据</td></tr>");
			return;
		}
		$.each(data,function(i,item){
			var zrStr = "<tr>"
						+"	<td>"+getJob(item.jposition).main_job + "/" + getJob(item.jposition).sub_job+"</td>"
						+"	<td>"+edu[item.eduLevel]+"</td>"
						+"	<td>"+year[item.years]+"</td>"
						+"	<td>"+item.othersNeed+"</td>"
						+"</tr>";
			$("#joinPrj_table").append(zrStr);
		});
		
		$($("#joinPrj_table").find("tr:gt(0)")).bind('click',function(){
			var tds = $(this).find("td");
			var job = $($(tds)[0]).text();
			showJoinMsg(job);
		});
	}
	$.post("queryProgramerNeedData.do",{"projectId":id},callback,"json");
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

function doLike(id){
	var callback = function(data){
		queryProjectListData();
	}
	$.post("doLikeProject.do",{"projectId":id,"type": 0},callback,"json");
}

/*function showJobChoose(){
	changeDiaTitle("dia_joinPrj","加入项目>>选择职业");
	hideDialogFooter("dia_joinPrj");
	$("#join_msgDiv").hide();
	$("#joinPrj_table").show();
}

function showJoinMsg(text){
	$("#joinPrj_table").fadeOut('slow',function(){
		changeDiaTitle("dia_joinPrj","加入项目>>添加留言");
		$("#join_job_input").val(text);
		$("#join_job_label").text(text);
		showDialogFooter("dia_joinPrj");
		$("#returnJobChoose").show();
		$("#join_msgDiv").show('slow');
	});
}*/

function clickButton(id){
	var param = {"type":"0"};
	var callback = function(data){
		alert(data.obj);
		$('#dia_joinPrj').modal('hide');
		if(data.msgNo=="1"){
			queryProjectListData()
		}
	}
	postFormByAjax("joinPrj_form", param, callback);
}

/*function cbPrj(id){
	showJoinMsg("");
	
	$("#joinPrj_projectId").val(id);
	$("#returnJobChoose").hide('slow',function(){
		$('#dia_joinPrj').modal('show');
	});
}*/

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
