/**
 * 0.1.0.20151217
 */

/**
 * qiao.util.js
 * 1.qser
 * 2.qdata
 * 3.qiao.on
 * 4.qiao.is
 * 5.qiao.ajax
 * 6.qiao.totop
 * 7.qiao.qrcode
 * 8.qiao.end
 * 9.qiao.cookie
 * 10.qiao.search
 */
var qiao = {};

/**
 * 将表单转为js对象
 */
$.fn.qser = function(){
	var obj = {};
	
	var objs = $(this).serializeArray();
	if(objs.length != 0){
		for(var i=0; i<objs.length; i++){
			obj[objs[i].name] = objs[i].value;
		}
	}

	return obj;
};

/** 
 * 将data属性转为js对象
 */
$.fn.qdata = function(){
	var res = {};
	
	var data = $(this).attr('data');
	if(data){
		var options = data.split(';');
		for(var i=0; i<options.length; i++){
			if(options[i]){
				var opt = options[i].split(':');
				res[opt[0]] = opt[1];
			}
		}
	}
	
	return res;
};

/**
 * qiao.on
 * 事件绑定
 */
qiao.on = function(obj, event, func){
	$(document).off(event, obj).on(event, obj, func);
};

/**
 * qiao.is
 * 一些常用的判断，例如数字，手机号等
 */
qiao.is = function(str, type){
	if(str && type){
		if(type == 'number') return /^\d+$/g.test(str);
		if(type == 'mobile') return /^1\d{10}$/g.test(str);
	}
};

/**
 * qiao.ajax
 * 对$.ajax的封装
 */
qiao.ajaxoptions = {
	url 		: '',
	data 		: {},
	type 		: 'post',
	dataType	: 'json',
	async 		: true,
	crossDomain	: false
};
qiao.ajaxopt = function(options){
	var opt = $.extend({}, qiao.ajaxoptions);
	if(typeof options == 'string'){
		opt.url = options;
	}else{
		$.extend(opt, options);
	}
	
	return opt;
};
qiao.ajax = function(options, success, fail){
	if(options){
		var opt = qiao.ajaxopt(options);
		if(typeof base != 'undefined') opt.url = base + opt.url;
		
		$.ajax(opt).done(function(obj){
			if(success) success(obj);
		}).fail(function(e){
			if(fail){
				fail(e);
			}else{
				alert('数据传输失败，请重试！');
			}
		});
	}
};

/**
 * qiao.totop
 * 返回顶部的方法
 * 可以参考：plugins/_01_qtotop/qtotop.html
 */
qiao.totop = function(el){
	var $el = $(el);
	$el.hide().click(function(){
		$('body, html').animate({scrollTop : '0px'});
	});
	
	var $window = $(window);
	$window.scroll(function(){
		if ($window.scrollTop()>0){
			$el.fadeIn();
		}else{
			$el.fadeOut();
		}
	});
};

/**
 * qiao.qcode
 * 生成二维码
 * 注：需要引入qrcode，<script src="http://cdn.staticfile.org/jquery.qrcode/1.0/jquery.qrcode.min.js"></script>
 * text：待生成文字
 * type：中文还是英文，cn为中文
 * render：展示方式，table为表格方式
 * width：宽度
 * height：高度
 * 可以参考：plugins/_03_qcode/qcode.html
 */
$.fn.qcode = function(options){
	if(options){
		var opt = {};
		if(typeof options == 'string'){
			opt.text = options;
		}else{
			if(options.text) opt.text = options.text;
			if(options.type && options.type == 'ch') opt.text = qiao.qrcodetochar(opt.text);
			if(options.render && options.render == 'table') opt.render = options.render;
			if(options.width) opt.width = options.width;
			if(options.height) opt.height = options.height;
		}

		$(this).qrcode(opt);
	}
};
qiao.qrcodetochar = function(str){
    var out, i, len, c;
    out = "";
    len = str.length;
    for (i = 0; i < len; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            out += str.charAt(i);
        } else if (c > 0x07FF) {
            out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
            out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        } else {
            out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F));
            out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F));
        }
    }
    return out;
};

/**
 * qiao.end
 * 到达页面底部后自动加载内容
 * end：到达底部后的回调函数
 * $d：容器，默认是$(window)
 * $c：内容，默认是$(document)
 * 可以参考：plugins/_04_qend/qend.html
 */
qiao.end = function(end, $d, $c){
	if(end){
		var $d = $d || $(window);
		var $c = $c || $(document);
		
		$d.scroll(function(){if($d.scrollTop() + $d.height() >= $c.height()) end();});
	}else{
		$(window).scroll(null);
	}
};

/**
 * qiao.cookie
 * 对jquery.cookie.js稍作封装
 * 注：需要引入jquery.cookie.js，<script src="http://cdn.bootcss.com/jquery-cookie/1.4.1/jquery.cookie.min.js"></script>
 * qiao.cookie(key)：返回key对应的value
 * qiao.cookie(key, null)： 删除key对应的cookie
 * qiao.cookie(key, value)：设置key-value的cookie
 * 可以参考：plugins/_05_qcookie/qcookie.html
 */
qiao.cookie = function(key, value){
	if(typeof value == 'undefined'){
		return $.cookie(key);
	}else if(value == null){
		$.cookie(key, value, {path:'/', expires: -1});
	}else{
		$.cookie(key, value, {path:'/', expires:1});
	}
};

/**
 * qiao.search
 * 获取url后参数中的value
 * qiao.search(key)：返回参数中key对应的value
 * 可以参考：plugins/_06_qsearch/qsearch.html
 */
qiao.search = function(key){
	var res;
	
	var s = location.search;
	if(s){
		s = s.substr(1);
		if(s){
			var ss = s.split('&');
			for(var i=0; i<ss.length; i++){
				var sss = ss[i].split('=');
				if(sss && sss[0] == key) res = sss[1]; 
			}
		}
	}
	
	return res;
};

/**
 * qiao.bs.js
 * 1.alert
 * 2.confirm
 * 3.dialog
 * 4.msg
 * 5.tooltip
 * 6.popover
 * 7.tree
 * 8.scrollspy
 * 9.initimg
 * 10.bsdate
 * 11.bstro
 */
qiao.bs 	= {};
qiao.bs.modaloptions = {
	id		: 'bsmodal',
	url 	: '',
	fade	: 'fade',
	close	: true,
	title	: 'title',
	head	: true,
	foot	: true,
	btn		: false,
	okbtn	: '确定',
	qubtn	: '取消',
	msg		: 'msg',
	big		: false,
	show	: false,
	remote	: false,
	backdrop: 'static',
	keyboard: true,
	style	: '',
	mstyle	: '',
	callback: null
};
qiao.bs.modalstr = function(opt){
	var start = '<div class="modal '+opt.fade+'" id="' + opt.id + '" tabindex="-1" role="dialog" aria-labelledby="bsmodaltitle" aria-hidden="true" style="position:fixed;top:20px;'+opt.style+'">';
	if(opt.big){
		start += '<div class="modal-dialog modal-lg" style="'+opt.mstyle+'"><div class="modal-content">';
	}else{
		start += '<div class="modal-dialog" style="'+opt.mstyle+'"><div class="modal-content">';
	}
	var end = '</div></div></div>';
	
	var head = '';
	if(opt.head){
		head += '<div class="modal-header">';
		if(opt.close){
			head += '<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>';
		}
		head += '<h3 class="modal-title" id="bsmodaltitle">'+opt.title+'</h3></div>';
	}
	
	var body = '<div class="modal-body"><p><h4>'+opt.msg+'</h4></p></div>';
	
	var foot = '';
	if(opt.foot){
		foot += '<div class="modal-footer"><button type="button" class="btn btn-primary bsok">'+opt.okbtn+'</button>';
		if(opt.btn){
			foot += '<button type="button" class="btn btn-default bscancel">'+opt.qubtn+'</button>';
		}
		foot += '</div>';
	}
	
	return start + head + body + foot + end;
};
qiao.bs.alert = function(options, func){
	// options
	var opt = $.extend({}, qiao.bs.modaloptions);
	
	opt.title = '提示';
	if(typeof options == 'string'){
		opt.msg = options;
	}else{
		$.extend(opt, options);
	}
	
	// add
	$('body').append(qiao.bs.modalstr(opt));
	
	// init
	var $modal = $('#' + opt.id); 
	$modal.modal(opt);
	
	// bind
	qiao.on('button.bsok', 'click', function(){
		if(func) func();
		$modal.modal('hide');
	});
	qiao.on('#' + opt.id, 'hidden.bs.modal', function(){
		$modal.remove();
	});
	
	// show
	$modal.modal('show');
};
qiao.bs.confirm = function(options, ok, cancel){
	// options
	var opt = $.extend({}, qiao.bs.modaloptions);

	opt.title = '确认操作';
	if(typeof options == 'string'){
		opt.msg = options;
	}else{
		$.extend(opt, options);
	}
	opt.btn = true;
	
	// append
	$('body').append(qiao.bs.modalstr(opt));
	
	// init
	var $modal = $('#' + opt.id); 
	$modal.modal(opt);
	
	// bind
	qiao.on('button.bsok', 'click', function(){
		if(ok) ok();
		$modal.modal('hide');
	});
	qiao.on('button.bscancel', 'click', function(){
		if(cancel) cancel();
		$modal.modal('hide');
	});
	qiao.on('#' + opt.id, 'hidden.bs.modal', function(){
		$modal.remove();
	});
	
	// show
	$modal.modal('show');
};
qiao.bs.dialog = function(options, func){
	// options
	var opt = $.extend({}, qiao.bs.modaloptions, options);
	opt.big = true;
	
	// append
	$('body').append(qiao.bs.modalstr(opt));
	
	// ajax page
	qiao.ajax({
		url:options.url,
		dataType:'html'
	}, function(html){
		$('#' + opt.id + ' div.modal-body').empty().append(html);
		if(options.callback) options.callback();
	});
		
	// init
	var $modal = $('#' + opt.id); 
	$modal.modal(opt);
	
	// bind
	qiao.on('button.bsok', 'click', function(){
		var flag = true;
		if(func){
			flag = func();
		}
		
		if(flag){
			$modal.modal('hide');
		}
	});
	qiao.on('button.bscancel', 'click', function(){
		$modal.modal('hide');
	});
	qiao.on('#' + opt.id, 'hidden.bs.modal', function(){
		$modal.remove();
	});
	
	// show
	$modal.modal('show');
};
qiao.bs.msgoptions = {
	msg  : 'msg',
	type : 'info',
	time : 2000,
	position : 'top',
};
qiao.bs.msgstr = function(msg, type, position){
	return '<div class="alert alert-'+type+' alert-dismissible" role="alert" style="display:none;position:fixed;' + position + ':0;left:0;width:100%;z-index:2001;margin:0;text-align:center;" id="bsalert"><button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>'+msg+'</div>';
};
qiao.bs.msg = function(options){
	var opt = $.extend({},qiao.bs.msgoptions);
	
	if(typeof options == 'string'){
		opt.msg = options;
	}else{
		$.extend(opt, options);
	}
	
	$('body').prepend(qiao.bs.msgstr(opt.msg, opt.type , opt.position));
	$('#bsalert').slideDown();
	setTimeout(function(){
		$('#bsalert').slideUp(function(){
			$('#bsalert').remove();
		});
	},opt.time);
};
qiao.bs.popoptions = {
	animation 	: true,
	container 	: 'body',
	content		: 'content',
	html		: true,
	placement	: 'bottom',
	title		: '',
	trigger		: 'hover'//click | hover | focus | manual.
};
$.fn.bstip = function(options){
	var opt = $.extend({}, qiao.bs.popoptions);
	if(typeof options == 'string'){
		opt.title = options;
	}else{
		$.extend(opt, options);
	}
	
	$(this).data(opt).tooltip();
};
$.fn.bspop = function(options){
	var opt = $.extend({}, qiao.bs.popoptions);
	if(typeof options == 'string'){
		opt.content = options;
	}else{
		$.extend(opt, options);
	}
	
	$(this).popover(opt);
};
qiao.bs.tree = {};
qiao.bs.tree.options = {
	url 	: '',
	height 	: '600px',
	open	: true,
	edit	: false,
	checkbox: false,
	showurl	: true
};
$.fn.bstree = function(options){
	var opt = $.extend({}, qiao.bs.tree.options);
	if(options){
		if(typeof options == 'string'){
			opt.url = options;
		}else{
			$.extend(opt, options);
		}
	}
	
	var res = '加载失败！';
	var $this = $(this);
	qiao.ajax(opt.url + '/tree', function(json){
		if(json && json.object){
			var tree = json.object;
			
			var start = '<div class="panel panel-info"><div class="panel-body" ';
			if(opt.height != 'auto') 
				start += 'style="height:600px;overflow-y:auto;"';
			start += '><ul class="nav nav-list sidenav" id="treeul" data="url:' + opt.url +';">';
			var children = qiao.bs.tree.sub(tree, opt);
			var end = '</ul></div></div>';
			res = start + children + end;
		}
		
		$this.empty().append(res);
		qiao.bs.tree.init();
	});
};
qiao.bs.tree.sub = function(tree, opt){
	var res = '';
	if(tree){
		var res = 
			'<li>' + 
				'<a href="javascript:void(0);" data="id:' + tree.id + ';url:' + tree.url + ';">' + 
					'<span class="glyphicon glyphicon-minus"></span>';
		if(opt.checkbox){
			res += '<input type="checkbox" class="treecheckbox" ';
			if(tree.checked){
				res += 'checked';
			}
			res += '/>';
		}
			res += tree.text;
		if(opt.showurl){
			res += '(' + tree.url + ')';
		}
		if(opt.edit)
			res += 
				'&nbsp;&nbsp;<span class="label label-primary bstreeadd">添加子菜单</span>' + 
				'&nbsp;&nbsp;<span class="label label-primary bstreeedit">修改</span>' + 
				'&nbsp;&nbsp;<span class="label label-danger  bstreedel">删除</span>';
			res += '</a>';
		var children = tree.children;
		if(children && children.length > 0){
				res += '<ul style="padding-left:20px;" id="treeid_' + tree.id + '" class="nav collapse ';
			if(opt.open) 
				res += 'in';
				res += '">';
			for(var i=0; i<children.length; i++){
				res += qiao.bs.tree.sub(children[i], opt);
			}
				res += '</ul>';
		}
		res += '</li>';
	}
	
	return res;
};
qiao.bs.tree.init = function(){
	qiao.on('#treeul .glyphicon-minus', 'click', function(){
		if($(this).parent().next().length > 0){
			$('#treeid_' + $(this).parents('a').qdata().id).collapse('hide');
			$(this).removeClass('glyphicon-minus').addClass('glyphicon-plus');
		}
	});
	qiao.on('#treeul .glyphicon-plus', 'click', function(){
		if($(this).parent().next().length > 0){
			$('#treeid_' + $(this).parents('a').qdata().id).collapse('show');
			$(this).removeClass('glyphicon-plus').addClass('glyphicon-minus');
		}
	});
	qiao.on('input.treecheckbox', 'change', function(){
		// 检测子级的
		var subFlag = $(this).prop('checked');
		$(this).parent().next().find('input.treecheckbox').each(function(){
			$(this).prop('checked', subFlag);
		});
		
		// 检测父辈的
		var parentFlag = true;
		var $ul = $(this).parent().parent().parent(); 
		$ul.children().each(function(){
			var checked = $(this).children().children('input').prop('checked');
			if(!checked) parentFlag = false;
		});
		$ul.prev().children('input').prop('checked', parentFlag);
	});
	
	qiao.bs.tree.url = $('#treeul').qdata().url;
	if(qiao.bs.tree.url){
		qiao.on('.bstreeadd', 'click', qiao.bs.tree.addp);
		qiao.on('.bstreedel', 'click', qiao.bs.tree.del);
		qiao.on('.bstreeedit', 'click', qiao.bs.tree.editp);
	}
};
qiao.bs.tree.addp = function(){
	qiao.bs.dialog({
		url 	: qiao.bs.tree.url + '/add/' + $(this).parent().qdata().id,
		title 	: '添加子菜单',
		okbtn 	: '保存'
	}, qiao.bs.tree.add);
};
qiao.bs.tree.add = function(){
	var res;
	qiao.ajax({url:qiao.bs.tree.url + '/save',data:$('#bsmodal').find('form').qser(),async: false}, function(obj){res = obj;});
	
	qiao.bs.msg(res);
	if(res && res.type == 'success'){
		qiao.crud.url = qiao.bs.tree.url;
		qiao.crud.reset();
		return true;
	}else{
		return false;
	}
};
qiao.bs.tree.del = function(){
	qiao.ajax({
		url:qiao.bs.tree.url + '/del/' + $(this).parent().qdata().id,
	}, function(res){
		qiao.bs.msg(res);
		
		if(res && res.type == 'success'){
			qiao.crud.url = qiao.bs.tree.url;
			qiao.crud.reset();
		}
	});
};
qiao.bs.tree.editp = function(){
	qiao.bs.dialog({
		url 	: qiao.bs.tree.url + '/savep?id=' + $(this).parent().qdata().id,
		title 	: '修改菜单',
		okbtn 	: '保存'
	}, qiao.bs.tree.edit);
};
qiao.bs.tree.edit = function(){
	qiao.crud.url = qiao.bs.tree.url;
	return qiao.crud.save();
};
qiao.bs.spy = function(target,body){
	var $body = 'body';
	var $target = '.scrolldiv';
	
	if(body) $body = body;
	if(target) $target = target;
	
	$($body).scrollspy({target:$target});
};
qiao.bs.initimg = function(){
	$('img').each(function(){
		var clazz = $(this).attr('class');
		if(clazz){
			if(clazz.indexOf('img-responsive') == -1) $(this).addClass('img-responsive');
		}else{
			$(this).addClass('img-responsive');
		}
	});
};
qiao.bs.bsdateoptions = {
	autoclose: true,
	language : 'zh-CN',
	format: 'yyyy-mm-dd'
};
qiao.bs.bsdate = function(selector, options){
	if(selector){
		var $element = $(selector);
		if($element.length > 0){
			var opt = $.extend({}, qiao.bs.bsdateoptions, options);
			$element.each(function(){
				$(this).datepicker(opt);
			});
		}
	}
};
qiao.bs.bstrooptions = {
	width 	: '500px',
	html 	: 'true',
	nbtext	: '下一步',
	place 	: 'bottom',
	title 	: '网站使用引导',
	content : 'content'
};
qiao.bs.bstroinit = function(selector, options, step){
	if(selector){
		var $element = $(selector);
		if($element.length > 0){
			var opt = $.extend({}, qiao.bs.bstrooptions, options);
			if(typeof options == 'string'){
				opt.content = options;
			}else{
				$.extend(opt, options);
			}
			
			$element.each(function(){
				$(this).attr({
					'data-bootstro-width'			: opt.width, 
					'data-bootstro-title' 			: opt.title, 
					'data-bootstro-html'			: opt.html,
					'data-bootstro-content'			: opt.content, 
					'data-bootstro-placement'		: opt.place,
					'data-bootstro-nextButtonText'	: opt.nbtext,
					'data-bootstro-step'			: step
				}).addClass('bootstro');
			});
		}
	}
};
qiao.bs.bstroopts = {
	prevButtonText : '上一步',
	finishButton : '<button class="btn btn-lg btn-success bootstro-finish-btn"><i class="icon-ok"></i>完成</button>',
	stopOnBackdropClick : false,
	stopOnEsc : false
};
qiao.bs.bstro = function(bss, options){
	if(bss && bss.length > 0){
		for(var i=0; i<bss.length; i++){
			qiao.bs.bstroinit(bss[i][0], bss[i][1], i);
		}
		
		var opt = $.extend({}, qiao.bs.bstroopts);
		if(options){
			if(options.hasOwnProperty('pbtn')){
				opt.prevButtonText = options.pbtn;
			}
			if(options.hasOwnProperty('obtn')){
				if(options.obtn == ''){
					opt.finishButton = '';
				}else{
					opt.finishButton = '<button class="btn btn-mini btn-success bootstro-finish-btn"><i class="icon-ok"></i>'+options.obtn+'</button>';
				}
			}
			if(options.hasOwnProperty('stop')){
				opt.stopOnBackdropClick = options.stop;
				opt.stopOnEsc = options.stop;
			}
			if(options.hasOwnProperty('exit')){
				opt.onExit = options.exit;
			}
		}
		
		bootstro.start('.bootstro', opt);
	}
};
qiao.bs.search = function(selector, options){
	if(!selector || !options || !options.url || !options.make || !options.back) return;
	
	var $this = $(selector);
	var zIndex = options.zIndex || 900;
	var bgColor = options.bgColor || '#fff';
	
	var $table = $('<table class="table table-bordered table-hover" style="position:absolute;display:none;margin-top:10px;width:95%;z-index:' + zIndex + ';background-color:' + bgColor + ';"></table>');
	$this.after($table);
	
	var tid,xhr;
	qiao.on(selector, 'keyup', function(){
		if(tid) clearTimeout(tid);
		if(xhr) xhr.abort();
		tid = setTimeout(function(){
			var code = $this.val();
			if(code){
				xhr = $.ajax({
					url: base + options.url + '?code=' + code,
					type:'get',
					dataType:'json'
				}).done(function(json){
					if(json && json.type == 'success'){
						var codes = json.object;
						if(codes && codes.length > 0){
							$table.empty();
							$.each(codes, function(i, item){
								if(item) $table.append('<tr class="qsearchtr" style="cursor:pointer;" data-id="' + item.id + '"><td>' + options.make(item) + '</td></tr>');
							});
						}
					}
					
					$table.show();
				});
			}
		}, 500);
	});
	
	qiao.on('tr.qsearchtr', 'click', function(){
		options.back($(this).data('id'));
		
		$this.val($(this).find('td').text());
		$table.hide();
	});
};

/**
 * qiao.crud
 */
qiao.crud = {};
qiao.crud.url = '';
qiao.crud.init = function(){
	// menu click
	qiao.on('.menus', 'click', function(){
		var url = $(this).qdata().url;
		if(url){
			qiao.crud.url = url;
			qiao.crud.reset();
		}
	});
	qiao.crud.bindcrud();
	qiao.crud.bindpage();
};
qiao.crud.bindcrud = function(){
	qiao.on('.allcheck','change', function(){$('.onecheck').prop('checked',$(this).prop('checked'));});
	qiao.on('.addBtn', 'click', function(){qiao.crud.savep('添加')});
	qiao.on('.editbtn','click', function(){qiao.crud.savep('修改',$(this).parents('tr').qdata().id)});
	qiao.on('.queBtn', 'click', function(){qiao.crud.search('查询')});
	qiao.on('.relBtn', 'click', function(){qiao.crud.reset();});
	qiao.on('.delBtn', 'click', function(){qiao.crud.del();});
	qiao.on('.delbtn', 'click', function(){qiao.crud.del($(this).parents('tr').qdata().id);});
};
qiao.crud.listopt = {pageNumber:1,pageSize:10};
qiao.crud.list = function(data){
	var opt = {url : qiao.crud.url + '/index'};
	if(data) $.extend(qiao.crud.listopt, data);
	opt.data = qiao.crud.listopt;
	opt.dataType = 'html';
	
	qiao.ajax(opt, function(html){$('#cruddiv').empty().append(html);});
};
qiao.crud.reset = function(){
	qiao.crud.listopt = {pageNumber:1,pageSize:10};
	qiao.crud.list();
};
qiao.crud.search = function(title){
	qiao.bs.dialog({title:title,url:qiao.crud.url + '/search'}, function(){
		qiao.crud.list($('#bsmodal').find('form').qser());
		return true;
	});
};
qiao.crud.savep = function(title, id){
	var url = id ? (qiao.crud.url + '/savep?id=' + id) : (qiao.crud.url + '/savep');
	qiao.bs.dialog({title:title,url:url}, function(){
		return qiao.crud.save();
	});
};
qiao.crud.save = function(){
	var res;
	qiao.ajax({
		async: false,
		url:qiao.crud.url+'/save',
		data:$('#bsmodal').find('form').qser()
	}, function(json){
		res = json;
	});
	
	qiao.bs.msg(res);
	if(res && res.type == 'success'){
		qiao.crud.list();
		return true;
	}else{
		return false;
	}
};
qiao.crud.del = function(id){
	var ids = [];
	
	if(id){
		ids.push(id);
	}else{
		$('.onecheck:checked').each(function(){ids.push($(this).parents('tr').qdata().id);});
	}
	
	if(!ids.length){
		qiao.bs.alert('请选择要删除的记录！');
	}else{
		qiao.bs.confirm('确认要删除所选记录吗（若有子记录也会同时删除）？',function(){
			qiao.ajax({
				url:qiao.crud.url+'/del',
				data:{ids:ids.join(',')}
			}, function(res){
				qiao.bs.msg(res);
				qiao.crud.list();
			});
		});
	}
};
qiao.crud.bindpage = function(){
	qiao.on('.crudfirst', 'click', function(){
		if(!$(this).parent().hasClass('disabled')){
			qiao.crud.reset();
		}
	});
	qiao.on('.crudprev', 'click', function(){
		if(!$(this).parent().hasClass('disabled')){
			qiao.crud.list({pageNumber:qiao.crud.listopt.pageNumber - 1});
		}
	});
	qiao.on('.crudnext', 'click', function(){
		if(!$(this).parent().hasClass('disabled')){
			qiao.crud.list({pageNumber:qiao.crud.listopt.pageNumber + 1});
		}
	});
	qiao.on('.crudlast', 'click', function(){
		if(!$(this).parent().hasClass('disabled')){
			qiao.crud.list({pageNumber:$(this).qdata().page});
		}
	});
	qiao.on('.cruda', 'click', function(){
		if(!$(this).parent().hasClass('disabled')){
			qiao.crud.list({pageNumber:parseInt($(this).text())});
		}
	});
	qiao.on('.pagesize', 'change', function(){
		var value = $(this).val();
		if(value){
			qiao.crud.listopt.pageSize = value;
		}
		
		qiao.crud.list({pageSize:value});
	});
};