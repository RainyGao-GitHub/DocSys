$(function(){
	$("#tab_p1").addClass("active");
	queryProjectData();
	queryServiceData();
})


/**
 * 查找最新的项目
 */
function queryProjectData(){
	
	var callback = function(data){
		var c = $("#prjArea").children();
		$(c).remove();
		if(data.obj.length==0){
			$("#prjArea").append("<p>暂无数据.</p>");
			return;
		}
		
		for(var i = 0;i<data.obj.length;i++){
			var d = data.obj[i];
			
			var _price = "";
			if(nvl(d.startPrice,"0")==nvl(d.endPrice,"0")&&nvl(d.startPrice,"0")=="0"){
				_price = "预算:<span class='fRight'>面议</span>"
			}else{
				_price = "预算:<span class='fRight price'>" + d.startPrice +"-"+d.endPrice + "元</span>"
			}
			
			var prj = "<li class='col-sm-6 col-md-4 startups-item'>"
				+"		<a href='toProject2.do?id="+d.id+"'>"
				+"			<div class='thumbnail'>"
				+"				<div class='thumbnail-img'><img src='"+ $("#basePath").val()+ "webPages/upload/project/" + d.proLog +"' onerror='this.src=\"webPages/images/project.jpg\"' alt='"+d.name+"' /></div>"
				+"				<div class='caption'>"
				+"					<h4>"+d.name+"</h4>"
				+"					<p class='tag'>"+nvl(d.prjArea,"未知区域").split(" ")[0]+"</p>"
				+"					<p class='tag'>"
				+"						<!-- 最多仅显示3个标签 -->"
				+"						<span>"+nvl(d.busiSmlType,"暂无分类")+"</span>"
				+"					</p>"
				+"					<!-- 简介最多显示两行，约26个字符 -->"
//				+"					<p>"+d.lastUpdateTime+"</p>"
//				+"					<p><span class='glyphicon glyphicon-heart'> </span>"+d.likeCnts+"人已点赞</span></p>"
				+"					<p class='desc'>"
				+						cutLongTxt(d.intro,26)
				+"					</p>"
				+"					<p>"+_price+"</p>"
				+"				</div>"
				+"			</div>"
				+"		</a>"
				+"	</li>";
				
				$("#prjArea").append(prj);
		}
		$("#prjArea").append("<div class='clear'></div>");
		
	}
	
	$.post("queryProjectData.do",{"num": "4"},callback,"json");
}

/**
 * 查找最新的服务
 */
function queryServiceData(){
	var callback = function(data){
		var c = $("#serArea").children();
		$(c).remove();
		if(data.obj.length==0){
			$("#serArea").append("<p>暂无数据.</p>");
			return;
		}
		
		for(var i = 0;i<data.obj.length;i++){
			var d = data.obj[i];
			console.log("busitype:"+d.BUSITYPE);
			var _price = "";
			if(nvl(d.STARTPRICE,"0")==nvl(d.ENDPRICE,"0")&&nvl(d.STARTPRICE,"0")=="0"){
				_price = "价格:<span class='fRight'>面议</span>"
			}else{
				_price = "价格:<span class='fRight price'>" + d.STARTPRICE +"-"+d.ENDPRICE + "元</span>"
			}
			
			var ser = "<li class='col-sm-6 col-md-4 startups-item'>"
				+"		<a href='toService2.do?id="+d.ID+"'>"
				+"			<div class='thumbnail'>"
				+"				<div class='thumbnail-img'><img src='"+ $("#basePath").val()+ "webPages/upload/service/" + d.PROLOG +"' onerror='this.src=\"webPages/images/service.png\"' alt='"+d.NAME+"' /></div>"
				+"				<div class='caption'>"
				+"					<h4>"+d.NAME+"</h4>"
				+"					<p class='tag'>"
				+"						<!-- 最多仅显示3个标签 -->"
				+"						<span>"+nvl(d.AREA,"未知区域").split(" ")[0]+"</span>"
				+"					</p>"
				+"					<p class='tag'>"+nvl(d.BUSISMLTYPE,"暂无分类")+"</p>"
				+"					<!-- 简介最多显示两行，约26个字符 -->"
//				+"					<p>"+d.LASTUPDATETIME+"</p>"
//				+"					<p><span class='glyphicon glyphicon-heart'> </span>"+d.likeCnts+"人已点赞</span></p>"
				
				+"					<p class='desc'>"
				+						cutLongTxt(d.INTRO,26)
				+"					</p>"
				+"					<p>"+_price+"</p>"
				+"				</div>"
				+"			</div>"
				+"		</a>"
				+"	</li>";
			
			
			
			$("#serArea").append(ser);
		}
		$("#serArea").append("<div class='clear'></div>");
		
	}
	
	$.post("queryServiceData.do",{"num": '4'},callback,"json");
}