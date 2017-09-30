$(function(){
	$("input.form-control").attr('needvalicate',"true");
	
	var form1_errorMsg = {
		'username':{'_required':'用户名不能为空。','_emailOR_tel':'邮箱/电话格式不正确。','_minlen':'用户名最少为6位'},
		'pwd':{'_required':'密码不能为空。','_minlen':'密码最小长度为6位。'}
	};
	
	addValicate(form1_errorMsg);
	
	//为所有form表单输入框添加工具提示并初始化
	$("input.form-control").attr('data-toggle',"tooltip");
	setCheckBoxs();
	var form1 = document.getElementById("form1");
	if(form1){
		form1.onsubmit = function(){
			var nv = $("#form1").find("input[needvalicate=true]");
			$(nv).each(function(i,item){
				$(item).blur();
			});
			var e = $("#form1").find(".has-error");
			if(e.length>0){
				return false;
			}else{
				var pwd = document.getElementById("pwd").value;
				var md5_pwd = MD5(pwd);
				$("#pwd").val(md5_pwd);
				return true;
			}
		}
		
		EnterSubmit(form1);
	}
	
	queryProjectData();
	queryServiceData();
	
//	document.write('<script src="http://pv.sohu.com/cityjson?ie=utf-8"><\/script>');
//	$("#localIp").val(returnCitySN["cip"]);
//	$("#localCity").val(returnCitySN["cname"]);
	
})

function EnterSubmit(form1){
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		form1.submit();
 	}  
}

function setCheckBoxs(){
	var s = $("input[type=checkbox]");
	
	$(s).each(function(i,item){
		if($(item).hasClass("needSetVal")){
			var hc = $(item).next();
			var v = $(hc).val();
			console.log($(item)[0].checked);
			if(v=="1"){
				$(item).attr("checked",true);
			}else{
				$(item).attr("checked",false);
			}
		}
	})
}

/**
 * 查找最新的项目
 */
function queryProjectData(){
	
	var callback = function(data){
		var c = $("#prjArea").children();
		$(c).remove();
		for(var i = 0;i<data.obj.length;i++){
			var d = data.obj[i];
			
			var _price = "";
			if(nvl(d.startPrice,"0")==nvl(d.endPrice,"0")&&nvl(d.startPrice,"0")=="0"){
				_price = "<span class='fRight'>预算:面议<span class='glyphicon glyphicon-cd' style='color:gold'/></span>"
			}else{
				_price = "<span class='fRight'>预算:" + d.startPrice +"-"+d.endPrice + "元<span class='glyphicon glyphicon-cd' style='color:gold'/></span>"
			}
			var prj = "<div class='fLeft pm'>"
				+"	<div class='myservice thinBorder'>"
				+"		<img class='imgshadow'  src='"+ $("#basePath").val()+ "webPages/upload/project/" + d.proLog +"' onerror='this.src=\"webPages/images/project.jpg\"' />"
				+"		<div class='proInfo pinfo'>"
				+"			<p class='f16'><a href='toProject.do?id="+d.id+"'>"+d.name+"</a></p>"
				+"			<p>"+ nvl(d.busiSmlType,"暂无分类")
				+_price
				+"			</p>"
				+"			<img width='70px' name='headimg' height='70px' src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + d.user.headImg +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"' class='img-circle pull-left'>"
				+"			<div class='f10 blackBg'>"
				+"				<span class='fRight'><a href='toUserDetail.do?id="+d.user.id+"'>"+d.user.nickName+"</a></span><br/>"
				+"				<span class='glyphicon glyphicon-map-marker fRight'>"+d.user.area+"</span><br/>"
				+"				<span class='fRight redStar' title='9.5'><span class='glyphicon glyphicon-heart'> </span>"+d.likeCnts+"人已点赞</span>"
				+"				<div class='clear'></div>"
				+"			</div>"
				+"		</div>"
				+"	</div>"
				+"</div>";
			
			$("#prjArea").append(prj);
		}
		$("#prjArea").append("<div class='clear'></div>");
		
	}
	
	$.post("queryProjectData.do",null,callback,"json");
}

/**
 * 查找最新的服务
 */
function queryServiceData(){
	var callback = function(data){
		var c = $("#serviceArea").children();
		$(c).remove();
		for(var i = 0;i<data.obj.length;i++){
			var d = data.obj[i];
			console.log("busitype:"+d.BUSITYPE);
			var _price = "";
			if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
				_price = "<span class='fRight'>价格:面议<span class='glyphicon glyphicon-cd' style='color:gold'/></span>"
			}else{
				_price = "<span class='fRight'>价格:" + d.STARTPRICE +"-"+d.ENDPRICE + "元<span class='glyphicon glyphicon-cd' style='color:gold'/></span>"
			}
			
			var ser = "<div class='fLeft pm'>"
				+"	<div class='myservice thinBorder'>"
				+"		<img class='imgshadow'  src='"+ $("#basePath").val()+ "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/service.png\"'/>"
				+"		<div class='proInfo pinfo'>"
				+"			<p class='f16'>"
				+"				<a href='toService.do?id="+d.ID+"'>"+d.NAME+"</a>"
				+"			</p>"
				+"			<p>"+ nvl($p.busiType[d.BUSITYPE],"暂无") +"/"+ nvl(d.BUSISMLTYPE,"暂无")
				+_price
				+"			</p>"
				+"			<img width='70px' name='headimg' height='70px' src='"+ $("#basePath").val()+ "webPages/upload/headpic/" + d.HEADIMG +"' onerror='this.src=\"webPages/images/defaultHeadPic.png\"' class='img-circle pull-left'>"
				+"			<div class='f10 blackBg'>"
				+"				<span class='fRight'><a href='toUserDetail.do?id="+d.PUBLISHER+"'>"+d.NICKNAME+"</a></span><br/>"
				+"				<span class='glyphicon glyphicon-map-marker fRight'>"+d.AREA+"</span><br/>"
				+"				<span class='fRight redStar' title='"+d.SCORE+"'>"+getStar(d.SCORE)+"("+d.COMMENTNUM+"条评论)</span>"
				+"				<div class='clear'></div>"
				+"			</div>"
				+"		</div>"
				+"	</div>"
				+"</div>";
			
			$("#serviceArea").append(ser);
		}
		$("#serviceArea").append("<div class='clear'></div>");
		
	}
	
	$.post("queryServiceData.do",null,callback,"json");
}