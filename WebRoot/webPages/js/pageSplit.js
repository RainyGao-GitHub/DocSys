var PAGE = 1; //页码
var ROW = 10; //条数
var TOTALCNTS = 0; //总条数
var TOTALPAGE = 1; //总页码

function init(){
	TOTALCNTS = $("#totalCnts").val();
}

var PAGE_RECORD = 1; //记录当前翻页

/**
 * 获得totalCnts数据后即可调用此方法初始化翻页栏
 * @param totalCnts
 */
function initPageToolBar(totalCnts){
	totalCnts = parseInt(totalCnts);
	console.log("记录总条数："+totalCnts);
	
	//把后台传回的值放入全局参数
	TOTALCNTS = totalCnts;
	
	var tmp1 = (totalCnts/ROW).toString().split('.')[0];
	var tmp2 = totalCnts%ROW;
	console.log("totalCnts/ROW:"+tmp1+"totalCnts%ROW:"+tmp2);
	if(tmp2>0)tmp1++;
	TOTALPAGE = tmp1;
	
	//1.初始化页码栏的显示
	$("#totalCnts").val(totalCnts);
	$("#totCnts").text(totalCnts);
	$("#totPage").text(TOTALPAGE);
	PAGE_RECORD = PAGE;
	var li = $("#pageSplit").find("li:eq(1)");
	var $li = $("#pageSplit").find("li.page_num");
	$li.remove();
	
	//重新计算分页栏
	var start = 0,end = 0;
	if(TOTALPAGE<=10){
		end = TOTALPAGE>=1?TOTALPAGE:1;
	}else{
		var page = parseInt(PAGE);
		if(page<=5){
			end = 10;
		}else if(TOTALPAGE-page>=5){
			start = page - 5;
			end = page + 4;
		}else{
			start = TOTALPAGE - 10;
			end = TOTALPAGE;
		}
	}
	
	console.log("start:"+start+",end:"+end);
	
	while(end>start){
		var str =  "<li class='page_num'><a href='javaScript:void(0);' onclick='toPage("+end+");'>"+end+"</a></li>";
		li.after(str);
		end--;
	}
	
	/*if(PAGE<10){
		for(var i=(parseInt(PAGE)+9);i>=PAGE;i--){
			var str =  "<li class='page_num'><a href='javaScript:void(0);' onclick='toPage("+i+");'>"+i+"</a></li>";
			li.after(str);
		}
	}else{
		for(var i=(parseInt(PAGE)+5);i>=PAGE-5;i--){
			var str =  "<li class='page_num'><a href='javaScript:void(0);' onclick='toPage("+i+");'>"+i+"</a></li>";
			li.after(str);
		}
	}*/
		
	
	//2.根据PAGE初始化当前页码的选中状态
	var index = PAGE+1;
	var tmpA = $("#pageSplit").find("li>a");
	$(tmpA).each(function(i,item){
		if($(item).text()==PAGE){
			setActive($(item));
			return;
		}
	})
	
}

/**
 * 让页码处于选中状态
 * @param dom
 */
function setActive(dom){
	var tmpa = $(".pg_active");
	$(tmpa).removeClass("pg_active");
	$(dom).addClass("pg_active");
}

function chip(){
	var p = $("#inputPage").val();
	toPage(p);
}

function toPage(str){
	init();
	var PS_MSG = "";
	if(TOTALCNTS==0){
		return;
	}
	var totalPage = TOTALPAGE;
	switch (str) {
	case 'first':
		PAGE = 1;
		break;
	case 'pre':
		if(PAGE>1){
			PAGE--;
		}else{
			PS_MSG = "当前已经是第一页";
		}
		break;
	case 'next':
		if(PAGE<totalPage){
			PAGE++;
		}else{
			PS_MSG = "当前已经是最后一页";
		}
		break;
	case 'last':
		PAGE = totalPage;
		break;
	default:
		if(isNaN(str)){
			PS_MSG = "您输入的页码不正确！";
		}
		var pnum = parseInt(str);
		if(pnum>totalPage){
			PAGE = totalPage;
		}else{
			PAGE = pnum;
		}
		break;
	}
	console.log("PAGE:"+PAGE+",TOTALCNTS:"+TOTALCNTS);
//	$("#pgMsg").html(PS_MSG);
//	$('#myDialog').modal('show');
	if(PS_MSG!=null&&PS_MSG!=""&&PS_MSG!=undefined){
		alert(PS_MSG);
		return;
	}
	
	$("#inputPage").val(PAGE);
	
	params.page = PAGE;
	params.rows = ROW;
	//chipPage()这个方法需要用户重写
	chipPage();
}