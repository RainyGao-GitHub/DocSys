$(function(){
	
	/*控制左侧栏菜单的js块*/
	$('.left-menu div p').click(function(){
		var c = $(this).next('.myul');
		var isShowed = $(c).attr('style');
		if(isShowed=="display: block;"){
			$(c).hide();
			return;
		}else{
			$('dd').hide();
			
			$(c).show();
		}
		
	});
	localStorage.runOnLoacl = 0;
	if(localStorage.runOnLoacl == 0){
		/*控制巨幕浮动特效的js块*/
		/*$(".cloud").animate({'background-position' : "-=40"},5000,function(){
			$("#jum-content").fadeIn(3000);
		});*/
		$("#jum-content").fadeIn(5000);
		
		/*控制左侧菜单划过抖动的js块*/
		$('.left-menu div p').hover(function(){
			$(this).animate({'padding-left' : "+=20"},100);
			$(this).animate({'padding-left' : "-=20"},100);
			
		});
		
	}
	
	/*测试js*/
	$("#myAlert").hide('slow');
	$("#myAlert").show('slow');
	
	var fd = document.getElementById("floatDiv");
	
	//======================= 显示大头像 ==============================
	var smHead = document.getElementById("smHead");
	showLgImg(smHead,"lgHead",0,0);
	/*for(var i in headimgs){
		showLgImg(headimgs[i],$("#lgHead"),0,0);
	}*/
//	$(window).scroll(function() {
//		
//    });
//	$(window).scroll(function() {
//		var bg = $(".lastBg")[0];
//		if(bg!=null&&bg!=undefined){
//			bg.style.top = getScroll().t+"px";
//		}
//    });
});


/**
 * 挑选喜欢的背景
 * @param index
 */
function changeBackImgae(index){
	$(".cloud").removeClass("b1");
	$(".cloud").removeClass("b2");
	$(".cloud").removeClass("b3");
	var imgs = $("#backImgs>a>img");
	$(imgs).each(function(i,item){
		$(item).removeClass("myactive");
	});
	
	var temp = "#bimg"+index;
	$(temp).addClass("myactive");
	if(index == 1){
		img = "b1";
	}else if(index==2){
		img = "b2";
	}else if(index == 3){
		img = "b3";
	}else{
		img = "b1";
	}
	
	$(".cloud").addClass(img);
	
}

/**
 * 开启关闭动画
 */
function startGif(){
	if(localStorage.runOnLoacl == 0){
		localStorage.runOnLoacl = 1;
		alert("动画已关闭！");
	}else{
		localStorage.runOnLoacl = 0;
		alert("动画已开启！");
	}
}

//右侧快捷入口展示与隐藏
var menuIsShow = true;
function hideMenu(flag){
	var divs = $("#floatMenu>div");
	var span = $("#floatTitle>span");
	if(menuIsShow){
		$(divs).each(function(i,item){
			$(item).hide();
		});
		if(flag){
			$("#floatDiv").animate({
				'width' : '30px',
				'left' : '+=170',
				'background' : 'blue'
			},0);
		}else{
			$("#floatDiv").animate({
				'width' : '30px',
				'left' : '+=170',
				'background' : 'blue'
			},500);
		}
		
		$(span).removeClass("glyphicon-circle-arrow-right");
		$(span).addClass("glyphicon-circle-arrow-left");
		menuIsShow = false;
		
	}else{
		if(flag){
			$("#floatDiv").animate({
				'width' : '200px',
				'left' : '-=170'
			},0,function(){
				$(divs).each(function(i,item){
					$(item).show();
				});
			});
		}else{
			$("#floatDiv").animate({
				'width' : '200px',
				'left' : '-=170'
			},500,function(){
				$(divs).each(function(i,item){
					$(item).show();
				});
			});
		}
		
		
		$(span).removeClass("glyphicon-circle-arrow-left");
		$(span).addClass("glyphicon-circle-arrow-right");
		menuIsShow = true;
	}
}

