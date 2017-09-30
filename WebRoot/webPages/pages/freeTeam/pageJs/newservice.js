$(function(){
	//快捷入口随滚动条固定的效果会被ueditor抢占。在这里把快捷入口隐藏
	$("#floatDiv").hide();
	
	var form1_errorMsg = {
		'name':{'_required':'服务名称不能为空。','_maxlen':'服务名称最长为20位'},
		'intro':{'_required':'服务简介不能为空。','_maxlen':'简介最长字数:500。'},
		'startPrice':{'_n':'请填写大于0的整数','_maxlen':'请填写少于8位的数字','_lt':'开始价格要小于结束价格'},
		'endPrice':{'_n':'请填写大于0的整数','_maxlen':'请填写少于8位的数字','_gt':'结束价格要大于开始价格'},
		
		/*'keyWord': {'_required': '关键词不能为空'},
		'employee_name': {'_required': '服务成员不能为空'},*/
		
		'plan_name': {'_required':'计划名称不能为空。','_maxlen':'计划名称最长为20位'}
	};
	
	addValicate(form1_errorMsg);
	
	pcaId = "pca"; //定义在commonjs中
	var serArea = $("#serArea").val();
	if(serArea!=null&&serArea!=undefined){
		setPCA(serArea.substring(0,2)+"0000",serArea.substring(0,4)+"00",serArea);
	}else{
		queryProvince();
	}
	
	//为所有form表单输入框添加工具提示并初始化
	$(":input.form-control").attr('data-toggle',"tooltip");
	
	/*setBusitype();
	setBusiType2($("#busiType"));*/
	
	//向后台提交数据时格式化textArea
	var ta = $($("#serviceForm").find("textArea"))[0];
	var taVal = $(ta).val();
	var a = taVal.split("<br>").join("\n");
	$(ta).val(a);
	
	createDialog("bstDialog","添加业务小类","bst_diaDiv");
	hideDialogFooter("bstDialog");
	
	showBusiSmlType();
	//======如果是更新操作，要初始化下拉框。
	var option = $("#option").val();
	setCbSelect($("#busiType"),$("#busiType").attr("value"));
	$("#busiType").select2();
	
	
		
	findMyLastThreeService();
	showMyIntro();
	
	
	var sPrice = $("#startPrice").val();
	var ePrice = $("#endPrice").val();
	if(sPrice==ePrice&&sPrice=="0"){
		$("#mianyi").click();
		showPriceChoise();
	}
	
	initBusiSmlType();
	
	setMyDropDownEvent();
	
	var planId = $("#planId").val();
	if(planId){
		initPlanByPlanId(planId);
	}else{
		initPlanByPlanId(1);
	}
	
	createDialog("planDialog","新增支付计划","newPlan");
	$('[data-toggle="popover"]').popover({html: true});
	queryCompayPerson();
});

function saveService(dom){
	unableDbClick();
	if(!formAjaxSubmitCheck("serviceForm")){
		unableDbClick();
		return;
	}else if(!$("#planId").val()){
		//支付计划不能为空
		bootstrapQ.alert("支付计划栏未设置！");
		unableDbClick();
		return;
	}
	
	//向后台提交数据时格式化textArea
	var ta = $($("#serviceForm").find("textArea"))[0];
	var taVal = $(ta).val();
	if(taVal!=null&&taVal!=undefined){
		console.log(taVal);
		var a = encodeURIComponent(taVal);
		var b = a.split("%0A").join("<br>");
		var c = decodeURIComponent(b);
		$(ta).val(c);
	}
	
	document.getElementById("serviceForm").submit();
}

function setBusitype(){
	var c = $("#busiType").children();
	$(c).remove();
	$(ParentVocation).each(function(i,item){
		$("#busiType").append("<option value='"+item[0]+"'>"+item[1]+"</option>");
	})
}

function setBusiType2(dom){
	var bt1 = $(dom).val();
	var c = $("#busiType2").children();
	$(c).remove();
	var key = bt1.split("~");
	for(var i=key[0]-1;i<=key[1]-1;i++){
		$("#busiType2").append("<option value='"+Vocation[i][0]+"'>"+Vocation[i][1]+"</option>");
	}
	
}

function findMyLastThreeService(){
	var callback = function(data){
		var c = $("#otherProArea").children();
		$(c).remove();
		if(data.msgNo!="1"){
			return;
		}
		if(data.obj.length==0){
			$("#otherProArea").append("<p>暂无数据</p>");
		}
//		$.each(data.obj,function(i,item){
//			var d = item;
//			var str = "<div class='p5 thinBorder margin10_0'>"
//				+"	<div >"
//				+"		<img width='100%' src='"+ $("#basePath").val()+ "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/service.png\"'/>"
//				+"	</div>"
//				+"	<div>"
//				+"		<h5>"
//				+"			<p><a href='toService.do?id="+d.ID+"'>"+d.NAME+"</a></p>"
//				+"		</h5>"
//				+"	</div>"
//				+"</div>";
//			$("#otherProArea").append(str);
//		})
		$.each(data.obj,function(i,item){
			var d = item;
			var str = "<div class='p5 thinBorder'>"
				+"	<div >"
				+"		<img width='100%' src='"+ $("#basePath").val()+ "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/service.png\"'/>"
				+"	</div>"
				+"	<div>"
				+"		<h5>"
				+"			<p><a href='toService2.do?id="+d.ID+"' target='_blank'>"+d.NAME+"</a></p>"
				+"			<span class='redStar' style='vertical-align: middle;'>"+getStar(d.SCORE)+"好评率:"+Math.round(d.SCORE/5*100)+"%</span>"
				+"		</h5>"
				+"		"
				+"	</div>"
				+"</div>";
			$("#otherProArea").append(str);
		});
		
	}
	
	$.post("queryMyLastThreeService.do",null,callback,"json");
}

function showPriceInput(){
	$($("#price").parent()).removeClass("hidden");
	$("#price").removeAttr("disabled");
	$("#price_select").addClass("hidden");
	$("#price_select").attr("disabled","disabled");
}

function showPriceSelect(){
	$($("#price").parent()).addClass("hidden");
	$("#price").attr("disabled","disabled");
	$("#price_select").removeClass("hidden");
	$("#price_select").removeAttr("disabled");
}

function showBusiSmlType(){
	var c = $("#busiSmlType").children("option:gt(1)");
	$(c).remove();
	var callback = function(data){
		var bst = data.obj.bstList;
		$.each(bst,function(i,item){
			var str = "<option value='"+item.id+"'>"+item.busiSmlType+"</option>";
			$("#busiSmlType").append(str);
		});
		$("#busiSmlType").select2({
		})
		setCbSelect($("#busiSmlType"),$("#busiSmlType").attr("value"));
	}
	
	$.post("queryBusiSmlType.do",null,callback,"json");
	
}
/*function setBusitype(){
	var c = $("#busiType").children();
	$(c).remove();
	$(main_menu).each(function(i,item){
		$("#busiType").append("<option value='"+item[0]+"'>"+item[1]+"</option>");
	});
}

function setBusiType2(dom){
	var bt1 = $(dom).val();
	var c = $("#busiType2").children();
	$(c).remove();
	
	$(second_menu).each(function(i,item){
		if(item[0]==bt1){
			$("#busiType2").append("<option value='"+item[1]+"'>"+item[2]+"</option>");
		}
	});
}*/

function showAddBstDia(){
	$("#bstDialog").modal('show');
}

function submitAddBst(dom){
	$(dom).html("请稍后...");
	$(dom).attr("disabled","disabled");
	var callback = function(data){
		$(dom).html("确定");
		$(dom).removeAttr("disabled");
		if(data.msgNo=="0"){
			$("#bstTip").html("Error:"+data.obj);
		}else{
			$("#bstDialog").modal('hide');
			showBusiSmlType();
			alert("添加成功！");
		}
		
	}
	postFormByAjax("addBstForm", null, callback);
}

function showPriceChoise(){
	$("#choisePrice").toggle(
		function(){
//			alert(1);
		},
		function(){
//			alert(2);
		}
	)
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
		$(".type-label").slideDown(200);
	}else{
		$(".type-label").slideUp(200);
	}
	
}

$(".close-btn").on("click",function(e){
	$(this).parent().slideUp("slow");
})

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
			sysHtml += '<i value="'+item.id+'" '+(ids.indexOf(item.id+"")>=0?'class="active"':'')+'>'+item.name+'</i>'
		});
		
		$.each(bstList_user,function(i,item){
			userHtml += '<i value="'+item.id+'" '+(ids.indexOf(item.id+"")>=0?'class="active"':'')+'><span class="glyphicon glyphicon-remove"></span>'+item.name+'</i>'
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




//服务人员start，只有团队或者企业有此选项

function setMyDropDownEvent(){
	var trs = $(".mydropdown").find("tr");
	$(trs).bind("click",function(e){
		if($("#employeeTable").find("tr.active").size()>=20){
			bootstrapQ.alert("超出服务人员限制，最多可选择20位。");
			return;
		}
		if($(this).hasClass("active")){
			$(this).removeClass("active");
			$(this).find("input[type='checkbox']")[0].checked = false;
		}else{
			$(this).addClass("active");
			$(this).find("input[type='checkbox']")[0].checked = true;
		}
		comfirmEmployee();
	})
}

function showDropDown(){
	if($(".mydropdown").css("height")=='300px'){
		$(".mydropdown").animate({
			height: "0px"
		},'easein').hide();
	}else{
		$(".mydropdown").animate({
			height: "300px"
		},'easein').show();
	}
	
	
}

function hideDropDown(){
	$(".mydropdown").hide();
}

function comfirmEmployee(){
	var tr = $("#employeeTable").find("tr.active");
	var ids="",cIds="", names="";
	$(tr).each(function(i,item){
		var id = $(item).find("input[name=userId]").val();
		var cId = $(item).find("input[name=userId]").attr("cId");
		var name = $(item).find("td[name=nickName]").html();
		
		if(id&&id>0){
			ids += ids?(',' + id):id;
		}else{
			cIds += cIds?(',' + cId):cId;
		}
		names += names?('、' + name):name;
	});
	$("#employee_ids").val(ids+"|"+cIds);
	$("#employee_name").val(names);
}

function queryCompayPerson(){
	$.post("queryCompanyUserRelationList.do?schedule=11",{companyId: $("#hidUserId").val(),page: 1,rows: 99999},initEmployee,"json");
}

/**
 * 更新时候初始化下拉框的值
 */
function initEmployeeSelect(data){
	if(!data)return;
	var _employeeIds = $("#employee_ids").val();//更新操作时，拿到ids进行初始化显示
	var _ids = _employeeIds.split("|")[0];
	var _cIds = _employeeIds.split("|")[1];
	var _idsArray = [],_cIdsArray = [];
	_idsArray = _ids?_ids.split(","):[];
	_cIdsArray = _cIds?_cIds.split(","):[];
	
	var names = "";
	$(data).each(function(i,item){
		var userId = item.userId+"";
		var cId = item.cId+"";
		var name = item.nickName;
		//本站人员
		if(_idsArray.indexOf(userId)>-1){
			names += names?("、"+name):name;
			item.active = 1;
		}
		
		//企业人员
		if(_cIdsArray.indexOf(cId)>-1){
			names += names?("、"+name):name;
			item.active = 1;
		}
	});
	$("#employee_name").val(names);
	return data;
}

/**
 * 查询可回调函数
 * @param data
 */
function initEmployee(data){
	var rows2 = initEmployeeSelect(data.obj.rows);
	data.obj.rows = rows2;
	
	var trs = $("#employeeTable").children();
	var d = data.obj;
	$(trs).remove();
	var str = "<p>暂无数据</p>";
	if(data.msgNo == '0'){
		alert(data.msg);
		$("#employeeTable").append(str);
	}else if(d.totalPage=="0"){
		str = "<p>暂无数据</p>";
		$("#employeeTable").append(str);
	}else{
		$("#totalPage").text(d.totalPage);
		$.each(d.rows,function(i,item){
			str = "<tr "+(item.active?"class='active'":"")+">"
				+"	<td><input type='checkbox' "+(item.active?"checked='checked'":"")+" class='m5'/></td>"
				+"	<td name='headImg'>"
				+"		<img width='40px' height='40px' class='img-circle' src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + item.headImg +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"'/>"
				+"	</td>"
				+"	<td name='nickName'>"+item.nickName+"</td>"
				+"	<td name='area'>"+item.area+"</td>"
				+"	<td name='job'>"+getJob(item.job).main_job+"/"+getJob(item.job).sub_job+"</td>"
				+"	<input type='hidden' name='userId' cId='"+item.cId+"' value='"+ item.userId +"'/>"
				+"</tr>";
			$("#employeeTable").append(str);
		})
		setMyDropDownEvent();
	}
	
	
}
//服务人员end



//支付计划start
function initPlanSelecter(){
	$.post("plan/findForSelecter.do",null,function(data){
		$("#planArea").children().remove();
		var d = data.obj;
		if(d.length>0){
			var html = "";
			$.each(d,function(i,item){
				html += '<li class="planList">'
					+'	<i class="cell round w10">'
					+'		<input type="checkbox" data="'+item.ID+'"/>'
					+'	</i>'
					+'	<i class="cell company w60">'+item.TITLE+'</i>'
					+'	<i class="cell round w30">'
					+'		<a class="mybtn" onclick="showPlanNodes(\'show\','+item.ID+',\''+item.TITLE+'\')">查看</a>'
					+'		<a class="mybtn-primary" onclick="showPlanNodes(\'update\','+item.ID+',\''+item.TITLE+'\')">修改</a>'
					+'	</i>'
					+'</li>';
			})
			
			$("#planArea").append(html);
		}else{
			$("#planArea").append("<p>暂无数据，请添加新的支付计划.</p>")
		}
		
		
	},"json");
}

initPlanSelecter();

/**
 * 新增支付计划节点，是否有保存按钮
 * @param isEdit 是否有可编辑框，没有编辑框则没有操作按钮
 * @param save 有编辑框的情况下，是否有保存按钮
 */
function addPlanNode(isEdit,save,data){
	var input1=input2=input3=btnOk=btnRemove = "";
	
	var planNodeTmpl = '<tr class="data-row">'
		+'	<td><div class="form-group relative text-center">${input1}</div></td>'
		+'	<td><div class="form-group relative text-center">${input2}</div></td>'
		+'	<td><div class="form-group relative text-center">${input3}</div></td>'
		+'	<td class="text-center">'
		+'		${btnOk}'
		+'		${btnRemove}'
		+'	</td>'
		+'</tr>';
	
	if(isEdit){
		var i1 = i2 = "", i3 = "0";
		if(data){
			i1 = data.name;
			i2 = data.content;
			i3 = data.amountPercent;
		}
		input1 = '<input id="node_name" needvalicate="true" maxlength="20" valicate="_required _maxlen=20" class="form-control" type="text" placeholder="请输入节点名称" value="'+i1+'" />';
		input2 = '<input id="node_descript" needvalicate="true" maxlength="100" valicate="_required _maxlen=100" class="form-control" type="text" placeholder="请输入节点描述" value="'+i2+'"/>';
		input3 = '<input id="node_amountPercent" needvalicate="true" valicate="_required _n _lt=100" class="form-control" maxlength="3" max="100" type="text" placeholder="请输入支付比例" value="'+i3+'"/>';
		btnRemove = '<a class="font-lr"><span class="glyphicon glyphicon-remove"></span></a>';
		if(save){
			btnOk = '<a class="font-lg mr5"><span class="glyphicon glyphicon-ok"></span></a>';
		}
		
		//支付计划弹出框点击了保存按钮
		var formMsg = {
			'node_name':{'_required':'节点名称不能为空。','_maxlen':'名称最长为20位。'},
			'node_descript':{'_required':'节点描述不能为空。','_maxlen':'最长字数:100。'},
			'node_amountPercent':{'_required':'支付比例不能为空。','_n':'请填写大于0的整数。','_lt':'最大数字100'}
		};
		
	}else{
		input1 = data.name;
		input2 = data.content;
		input3 = data.amountPercent+"%";
	}
	var html = planNodeTmpl.replace("${input1}", input1)
		.replace("${input2}", input2)
		.replace("${input3}", input3)
		.replace("${btnOk}", btnOk)
		.replace("${btnRemove}", btnRemove);
	
	var $th = $("#newPlan").find("tr.titleTr");
	
	console.log($th);
	$th.before(html);
	addValicate(formMsg, $(html));
}

$("#planArea").on("click",".planList",function(e){
	$("#planArea").find("input[type='checkbox']").each(function(i,item){
		item.checked = false;
	})
	$(this).find("input[type='checkbox']")[0].checked = true;
});

$("#newPlan").on("click","tr .glyphicon-remove",function(){
	$(this).parents("tr").remove();
	$("#node_amountPercent").change();
});

function showPlan(){
	$("#planSetting").slideDown("slow");
}

function choosePlan(){
	var $cb = $(".planList").find(":checked"),id = "";
	if($cb&&$cb.size()>0){
		id = $cb.attr("data");
		$("#planId").val(id);
	}else{
		$("#planSetting").slideUp("slow");
		return;
	}
	initPlanByPlanId(id);
}

function initPlanByPlanId(id){
	var callback = function(data){
		var d = data.obj;
		var d2 = $.map(d,function(row){
			var title = row.name;
			var content = '<p>'+row.content+'</p><p> 付款:'+ row.amountPercent + '%</p>';
			var steptitle = '<p >'+row.amountPercent+'%</p><p style="margin-top: 30px;" class="cutText">'+ row.name + '</p>';
			console.log(row);
			return {title: title, content: content, steptitle:steptitle};
		});
		
		//开发流程
		$(".ystep").children().remove();
		if($("#planId").val()){
			$("#planTip").remove();
		}
		
		$(".ystep").loadStep({
		    //ystep的外观大小
		    //可选值：small,large
		    size: "small",
		    //ystep配色方案
		    //可选值：green,blue
		    color: "green",
		    //ystep中包含的步骤
		    steps: d2
		  });
		$("#planSetting").slideUp("slow");
	}
	
	$.post("plan/findPlanNodesByPlanId.do",{planId: id},callback,"json");
}

function showPlanNodes(option, planId,title){
	$("#planDialog").find("tr.data-row").remove();
	$("#addPlanNodeBtn").show();
	$("#planNameDiv").show();
	$("#plan_name").val("");
	$("#totalPercent").text("0%");
	$("#hidPlanId").val("");
	showDialogFooter("planDialog");
	if(option=="add"){
		changeDiaTitle("planDialog",title?title:"新增计划");
		addPlanNode(true,false);
	}else{
		if(option=="show"){
			$("#addPlanNodeBtn").hide();
			hideDialogFooter("planDialog");
			$("#planNameDiv").hide();
			changeDiaTitle("planDialog",title?title:"查看计划详细");
		}else{
			changeDiaTitle("planDialog","修改计划");
			$("#plan_name").val(title);
			$("#totalPercent").text("100%");
			$("#hidPlanId").val(planId);
		}
		//初始化
		$.post("plan/findPlanNodesByPlanId.do",{planId: planId}, function(data){
			if(data.msgNo=="0"){
				showAjaxMsg(data);
			}else{
				var nodeList = data.obj;
				$.each(nodeList,function(i,item){
					var flag = (option=="update");
					addPlanNode(flag,false,item);
				})
			}
		},"json");
		
	}
	$("#planDialog").modal("show");
}


/**
 * 保存支付计划
 */
function savePlan(){
	$("#node_amountPercent").change();
	if(!formAjaxSubmitCheck("planDialog")){
		return;
	}else if($("#totalPercent").attr("num")!=100){
		setMsg("danger#您的总支付比例不等于100%,无法保存，请修改后保存。");
		$(".errorArea").css("z-index","9999");
		setTimeout(function(){
			$(".errorArea").css("z-index","9");
		},5000);
		return;
	}else{
		var title = $("#plan_name").val();
		var data = {},rows = [];
		data.title = title;
		$(".data-row").each(function(i,item){
			var row = {};
			var name = $(item).find("#node_name").val();
			var content = $(item).find("#node_descript").val();
			var amountPercent = $(item).find("#node_amountPercent").val();
			row.name = name;
			row.content = content;
			row.amountPercent = amountPercent;
			rows.push(row);
		});
		data.rows = rows;
		
		var json = JSON.stringify(data);
		
		console.log(json);
		
		$.post("plan/addOrUpdatePlan.do",{plan: json,type: "0",planId: $("#hidPlanId").val()},function(d){
			$(".errorArea").css("z-index","9999");
			setTimeout(function(){
				$(".errorArea").css("z-index","9");
			},5000);
			
			showAjaxMsg(d);
			
			if(d.msgNo==1){
				hideDialog("planDialog");
				initPlanSelecter();
			}
			
		},"json");
	}
}

$("#newPlan").on("change","tr #node_amountPercent",function(){
	var tp = 0;
	$("#newPlan").find("tr #node_amountPercent").each(function(i,item){
		var np = $(this).val();
		np = (np&&!isNaN(np))?np:0;
		tp += parseInt(np);
	})
	if(tp>100){
		$("#totalPercent").removeClass("label-success").addClass("label-danger");
	}else{
		$("#totalPercent").removeClass("label-danger").addClass("label-success");
	}
	$("#totalPercent").text(tp+"%");
	$("#totalPercent").attr("num",tp);
	
	
	
})

//支付计划end


/**
 * 响应弹出框点击保存事件
 * @param dialogId
 */
function clickButton(dialogId){
	
	if(dialogId=="planDialog"){
		//支付计划弹出框点击了保存按钮
		savePlan();
		
	}
}