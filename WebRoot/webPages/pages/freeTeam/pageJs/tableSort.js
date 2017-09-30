var $sortParams = [];

function addToParamSort(j){
	for (var key in j){
		$.each($sortParams,function(i){
			if($sortParams[i]&&$sortParams[i].hasOwnProperty(key)){
				$sortParams.pop(key);
				return;
			}
		})
    }
	$sortParams.push(j);
}

function removeParamSort(j){
	$sortParams.pop(j);
}

$(function(){
	$(".softer").on("click",".glyphicon-arrow-up",function(e){
		$(this).addClass("on").siblings().removeClass("on");
		$(this).parents("i").addClass("active");
		var key = $(this).parent().attr("value");
		var tmp = {};
		tmp[key] = "asc";
		addToParamSort(tmp);
		chipPage();
	});
	
	$(".softer").on("click",".glyphicon-arrow-down",function(e){
		$(this).addClass("on").siblings().removeClass("on");
		$(this).parents("i").addClass("active");
		//使用array使排序可以按照点击顺序进行
		var key = $(this).parent().attr("value");
		var tmp = {};
		tmp[key] = "desc";
		addToParamSort(tmp);
		chipPage();
	});
	$(".softer").on("click",".reset",function(e){
		if($(this).parent().attr("value")=='0'){
			//重置全部排序
			$(this).parent().parent().find("i").removeClass("active");
			$(this).parent().parent().find("span").removeClass("on");
			$(this).parent().addClass("active");
			var $i = $(this).parent().parent().find("i");
			$i.each(function(i,item){
				var v = $(item).attr("value");
				removeParamSort(v);
			})
			chipPage();
		}else{
			//重置当前排序
			var singleSort = $(this).siblings("span.glyphicon").size();
			if($(this).parent().hasClass("active")){
				$(this).parent().removeClass("active");
				$(this).parent().find("span").removeClass("on");
				var v = $(this).parent().attr("value");
				removeParamSort(v);
				chipPage();
			}else if(singleSort==1){
				//单排序的情况下
				$(this).siblings().click();
			}
		}
		
	});
})