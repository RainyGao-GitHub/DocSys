$(function(){
	$("#tab_p4").addClass("active");
	/*addToolTip($("#mrt_help"),"排名根据用户的信息完整度、服务数目以及质量、进行综合排名");*/
	
	setPartRole();
	createDialog("myDialog","提示","dialogContent");
	hideDialogFooter('myDialog');
	
	pcaId = "country"; //定义在commonjs中
	queryProvince();
	queryBusiSmlType(); //业务小类
	
//	setJob();
//	setJob2($("#cJob"));
	
	var lis = $("#searchArea").find(".searchLabel>li");
	$(lis).bind("click",function(e){
		var p = $(this).parent();
		var lis2 = $(p).find("li");
		$(lis2).each(function(i,item){
			$(item).removeClass("liActive");
		});
		$(this).addClass("liActive");
		showProgramerList();
	});
	
	/*$("#searchByType>a").bind("click",function(e){
		params.type = $(this).attr("value");
		toPage(1);
		var p = $(this).parent();
		var c = $(p).children(".btn-info");
		$(c).removeClass("btn-info").addClass("btn-default");;
		
		$(this).addClass("btn-info");
		
	})*/
	
//	var totalCnts = $("#totalCnts").val();
//	initPageToolBar(totalCnts);
	showProgramerList();
	
});


function showCountry(){
	showOrHideDiv("country",false);
}

function showJob(){
	showOrHideDiv("job",false);
}

function setPartRole(){
	var pt = $("[name=partRole]");
	$(pt).each(function(i,item){
		var s = $(item).html();
		var sNum = parseInt(s)-1;
		$(item).html(PARTROLE[sNum]);
	});
}

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

//向后台传递数据时需要传递的参数，职业，地区，页码，条数,默认类型，名称
var params = {job:"",area:"",page:"",rows:"",type:"1",name:"",isRecommend: "0"};

/**
 * 将搜索栏里的条件加入params
 */
function setParams(){
	params.page = PAGE;
	params.rows = ROW;
	var name = $("#searchWords").val();
	params.name = name;
	params.sort = JSON.stringify($sortParams);
	params.isRecommend = $("#isRecommend")[0].checked?1:0;
	
	var lis = $("#searchArea").find(".liActive");
	$(lis).each(function(i,item){
		var p = $(item).parent();
		var v = $(item).attr("value");
		if(v==""||v==null||v==undefined||v=="-1"){
			//-1是选择了其它的情况。
			return false;
		}else if(v=="0"){
			//0是选择了全部的情况
			var id = $(p).attr("id");
			switch (id) {
			case 'jobArea':
				params.job = "";
				break;
			case 'pcaArea':
				params.area = "";
			case 'type':
				params.type = "";
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
					params.job = v;
				}else{
					params.job = $(item).text();
				}
				break;
			case 'pcaArea':
				params.area = v;
			case 'type':
				params.type = v;
				break;
			default:
				break;
			}
		}
		
	});
	
	return true;
}

function selectOtherJob(dom){
	var v = $(dom).val();
	if(v=="0"){
		return;
	}else{
		$("#otherJob").val(v);
		$("#otherJob>a").click();
	}
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

function chipPage(){
	showProgramerList();
}

/**
 * 显示用户列表
 */
function showProgramerList(){
	var flag = setParams();
	console.log(flag);
	if(!flag){
		return;
	}
	var pa = $("#programerArea").children();
	$(pa).remove();
	$("#programerArea").append("<div class='loading'></div>");
	var callback = function(data){
		var pa = $("#programerArea").children();
		$(pa).remove();
		initPageToolBar(data.obj.total);
		if(data.obj.total=="0"){
			$("#programerArea").append("<p>暂无数据</p>");
		}
		
		var uId = $("#hidUserId").val();
		var uNickName = $("#hidUserName").val();
		
		$.each(data.obj.rows,function(i,item){
			var u = item;
			var job = "";
			switch (params.type) {
			case '1':
				job = nvl(getJob(u.job).main_job+"/"+getJob(u.job).sub_job,'');
				break;
			case '2':
				break;
			case '3':
				break;
			default:
				break;
			}
			
			var recommendtagstr = ""; 	
			if(u.isRecommend && u.isRecommend != "0") 
			{
				recommendtagstr = "<span class='claim1'> <a style='color:#f80;'>平台推荐</a></span>";	
			}
			
			var str = "<li>"
				+"	<i class='cell logo w15'>"
				+"		<a href='toUserDetail2.do?id="+u.id+"' target='_blank'>"
				+"			<span class='incicon'><img src='"+$("#basePath").val() + "webPages/upload/headpic/" + u.headImg+"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"'></span>"
				+"		</a>"
				+"	</i> "
				+"	<i class='cell commpany w25'>"
				+"		<span class='name'>"
				+"			<a href='toUserDetail2.do?id="+u.id+"' target='_blank'>"+u.nickName+"</a>"
				+ recommendtagstr
				+"		</span>"
				+"	<span clas></span>"
				+"		<span class='desc redStar' style='vertical-align: middle;width: 100px;'>"+getUserStars(u.examine,u.isRecommend,u.goodPercent)+"</span>"
				
				+"			<span class='desc'>"+cutLongTxt(nvl(u.intro,"暂无简介"),50)+"</span>"
				+ (u.prjDemoCnts>0?
					"			<span class='desc'>"+u.prjDemoCnts+"个项目案例:"+cutLongTxt(nvl(u.prjDemos,""),10)+"</span>"
					:""
					
				)
				+"	</i>"
				+"	<i class='cell investor w10' title='资源等级'>"
				
				+"		<span>"+nvl(u.area,"未知")+"</span>"
				
				+"	</i>"
				+"	<i class='cell investor w20' title='擅长领域'>"
				+"		<span>"+cutLongTxt(nvl(u.keyWord,"暂无分类"),10)+"</span>"
				+"	</i>"
				+"	<i class='cell investor w5'>"
				+"		<a title='联系对方' class='mybtn' onclick='initMsgDalog(\""+u.id+"\")'><span class='glyphicon glyphicon-envelope'></span></a>"
				+"	</i>"
				+"	<i class='cell investor w11'>"
				+"		<a class='mybtn' href='javaScript:void(0)' onclick='addFriend("+u.id+",\"" + uNickName+ "\");'>加为好友</a>"
				+"	</i>"
				+"</li>";
			$("#programerArea").append(str);
			setPartRole();
			
			// 普通烤饼
			$('#programerArea .desc.redStar').bspop({
			    html: true,
			    placement: 'top',
			    content : '<span style="color: #757575;font-size: 10px;">用户认证+3<br/>平台推荐+1<br/> 好评率>60% + 1</span>'
			});
		})
	}
	$.post("queryProgramerListData.do",params,callback,"json");
}

/*
function addFriend1(id){
	var callback = function(data){
		showProgramerList();
		//alert(data.obj);
		bootstrapQ.alert(data.obj);
	};
	$.post("addFriend.do",{"id":id},callback,"json");
}
*/

function addFriend(id,name)
{	
	bootstrapQ.dialog({
		url: 'pageTo.do?p=friendRequest',
		title: '好友申请',
		msg: "加载中。。。",
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


function showSmlType(){
	showOrHideDiv("job",false);
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
