$.pg = {};
$.pg.param = {};

/**
 * 翻页功能
 * @param option
 * @param dom
 * @returns {___anonymous749_762}
 */
function chipTo(option,dom){
	console.log("点击了跳转页面");
	var p = $(dom).parent();
	var page = $(p).find("span[name=page]");
	var totalPage = $(p).find("span[name=totalPage]");
	var _page = $(page).text();
	var _totalPage = $(totalPage).text();
	if(parseInt(_totalPage)==0||isNaN(_totalPage)){
		_page = 1;
	}else{
		_page = parseInt(_page);
		_totalPage = parseInt(_totalPage);
		switch (option) {
		case 'first':
			_page = 1;
			break;
		case 'pre':
			if(_page>1){
				_page--;
			}else{
				_page = 1;
			}
			break;
		case 'next':
			if(_page<_totalPage){
				_page++;
			}else{
				_page = _totalPage;
			}
			break;
		case 'last':
			_page = _totalPage==0?1:_totalPage;
			break;
		case 'refresh':
			
			break;
		default:
			_page = 1;
			break;
		}
	}
	$(page).text(_page);
	$.pg.param.page = _page;
	var btn = $(p).find("input[name=hidUrl]");
	$(btn).click();
}

