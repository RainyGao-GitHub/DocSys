var web = {};

// 兼容微信的刷新
web.reload = function(){
	var vendor = web.vendor();
	if(vendor && vendor.weixin){
		var url = window.location.href;
		window.location.href = url + (url.indexOf('?') > -1 ? '&' : '?') + 'v=' + Math.random(); 
	}else{
		window.location.reload();
	}
};

// vendor
web.vendor = function(){
	var ua = window.navigator.userAgent;
	
	var vendor = {};
	vendor.mobile 	= /AppleWebKit.*Mobile.*/.test(ua);
	vendor.android	= /android/gi.test(ua);
	vendor.ios 		= /(iphone|ipad|ipod)/gi.test(ua);
	vendor.iphone 	= /iphone/gi.test(ua);
	vendor.ipad 	= /ipad/gi.test(ua);
	vendor.ipod 	= /ipod/gi.test(ua);
	vendor.weixin 	= /micromessenger/gi.test(ua);
	vendor.qq 		= / qq/gi.test(ua);
	vendor.qqb 		= /mqqbrowser/gi.test(ua);
	vendor.weibo 	= /weibo/gi.test(ua);
	var matched;
	if((matched = ua.match(/MSIE\s([\d\.]+)/)) || (matched = ua.match(/IEMobile\/([\d\.]+)/))){
		vendor.ie = true;
		vendor.version = matched[1];
	}
	
	return vendor;
};

// ue
web.ue = function(id, options){
	if(typeof(UE) != "undefined"){
		if(!options){
			return UE.getEditor(id);
		}else if(typeof options == 'string'){
			if(options == 'mini'){
				return UE.getEditor(id, {toolbars: [['bold','italic','underline','forecolor','backcolor','|','fontfamily','fontsize','|','removeformat','formatmatch','pasteplain']]});
			}
		}else{
			var opt = $.extend({}, window.UEDITOR_CONFIG);
			return UE.getEditor(id, $.extend(opt, options));
		}
	}
	
	return {};
};

// donate tip
web.donate = {};
web.donate.init = function(){
	qiao.on('.todonate', 'click', web.donate.tip);
};
web.donate.tip = function(){
	var url = $(this).data('url');
	qiao.bs.dialog({
		url 	: '/donate/tip',
		title 	: '捐助',
		okbtn	: '多谢支持~',
		callback: function(){$('#todonatea').attr('href', url);}
	});
};

// weixin
web.weixin = {};
web.weixin.init = function(){
	qiao.ajax({
		url : '/weixin/jsapi',
		data: {
			url : location.href.split('#')[0]
		}
	}, function(json){
		var data = json.object;
		wx.config({
			debug: false,
			appId: data.appid,
			timestamp: data.timestamp,
			nonceStr: data.nonceStr, 
			signature: data.signature,
			jsApiList: ['onMenuShareAppMessage', 'onMenuShareTimeline', 'onMenuShareQQ', 'onMenuShareQZone', 'onMenuShareWeibo']
		});
		wx.ready(function(){
			var title = document.title;
			var desc = title;
			var meta = document.getElementsByTagName('meta');
			for(var i=0; i<meta.length; i++){
				if(meta[i].name && meta[i].name.toLowerCase() == 'description') desc = meta[i].content;
			}
			
			var shareOptions = {
				title: title,
				desc: desc,
				link: data.url,
				imgUrl: 'http://7sbn90.com1.z0.glb.clouddn.com/@/uikoo9/300x300n.png'
//					trigger: function (res) {
//						alert('用户点击发送给朋友');
//					},
//					success: function () { 
//						alert(1);
//					},
//					cancel: function () { 
//						alert(2);
//					},
//					fail: function (res) {
//						alert(JSON.stringify(res));
//					}
			};
			wx.onMenuShareAppMessage(shareOptions);
			wx.onMenuShareTimeline(shareOptions);
			wx.onMenuShareQQ(shareOptions);
			wx.onMenuShareQZone(shareOptions);
			wx.onMenuShareWeibo(shareOptions);
		});
		wx.error(function(res){
			if(location.href.indexOf('version') > -1) alert(JSON.stringify(res));
		});
	});
};

// reg
web.reg = {};
web.reg.init = function(){
	qiao.on('.regbtn', 'click', web.reg.reg);
};
web.reg.reg = function(){
	var $form = $('.regform');
	var $h5 = $form.find('h5');
	
	qiao.ajax({
		url : '/reg/reg',
		data : $form.qser()
	}, function(res){
		if(res){
			$h5.text(res.msg);
		}else{
			$h5.text('ajax fail');
		}
	});
};

// login
web.login = {};
web.login.init = function(options){
	qiao.on('.loginbtn', 'click', web.login.login);
	qiao.on('.loginform', 'keydown', function(e){if(e.keyCode == 13) web.login.login();});
};
web.login.show = function(){
	qiao.bs.dialog({
		url 	: '/login',
		title 	: '登录',
		head	: false,
		foot	: false,
		backdrop: true,
		mstyle	: 'width:300px;margin:40px auto;'
	});
};
web.login.login = function(){
	var $form = $('.loginform');
	var $h5 = $form.find('h5');
	
	qiao.ajax({
		url : '/login/login',
		data : $form.qser()
	}, function(res){
		if(res){
			if(res.type == 'success'){
				$h5.text('登录成功，正在跳转。。。');
				if(res.msg == '/'){
					location.reload(true);
				}else{
					location.href = base + res.msg;
				}
			}else{
				$h5.text(res.msg);
			}
		}else{
			$h5.text('ajax fail');
		}
	});
};

// modify pwd
web.modifypwd = {};
web.modifypwd.init = function(){
	qiao.on('.modifyPwd', 'click', web.modifypwd.modifypwdp);
};
web.modifypwd.modifypwdp = function(){
	qiao.bs.dialog({
		url : '/login/modifyPwdp',
		title : '修改密码',
		okbtn : '修改'
	}, web.modifypwd.modifypwd);
};
web.modifypwd.modifypwd = function(){
	var newpwd = $.trim($('input[name="newpwd"]').val());
	if(!newpwd){
		qiao.bs.msg({msg:'请输入新密码！',type:'danger'});
		return false;
	}else{
		var res; 
		qiao.ajax({
			async: false,
			url: '/login/modifyPwd',
			data:{password:newpwd}
		}, function(json){
			res = json;
		});
		
		qiao.bs.msg(res);
		if(res && res.type == 'success'){
			setTimeout(function(){
				location.href = base + '/login/logout';
			}, 1000);
		}
		return false;
	}
};

// role
web.role = {};
web.role.init = function(){
	qiao.on('.roleadduserbtn',	'click', web.role.setuser);
	qiao.on('.roleaddurlbtn', 	'click', web.role.seturl);
	qiao.on('.mytr',			'click', function(){$(this).toggleClass('info');});
};
web.role.setuser = function(){
	var id = $(this).parents('tr').qdata().id;
	qiao.bs.dialog({
		url : '/ucenter/role/setUser/' + id,
		title : '设置用户',
		okbtn : '关闭'
	});
};
web.role.addUser = function(){
	var ids = [];
	$('tr.outtr').each(function(){if($(this).hasClass('info')) ids.push($(this).attr('data'));});
	
	qiao.ajax({
		url: '/ucenter/role/addUser',
		data:{userids:ids.join(','),roleid:$('input[name="roleid"]').val()}
	}, function(res){
		if(res && res.type == 'success'){
			$('tr.outtr').each(function(){if($(this).hasClass('info')) $(this).removeClass('outtr').addClass('intr').prependTo('table.intable');});
		}else{
			qiao.bs.msg(res);
		}
	});
};
web.role.removeUser = function(){
	var ids = [];
	$('tr.intr').each(function(){if($(this).hasClass('info')) ids.push($(this).attr('data'));});
	
	qiao.ajax({
		url: '/ucenter/role/removeUser',
		data:{rlids:ids.join(','),roleid:$('input[name="roleid"]').val()}
	}, function(res){
		if(res && res.type == 'success'){
			$('tr.intr').each(function(){if($(this).hasClass('info')) $(this).removeClass('intr').addClass('outtr').prependTo('table.outtable');});
		}else{
			qiao.bs.msg(res);
		}
	});
};
web.role.seturl = function(){
	var id = $(this).parents('tr').qdata().id;
	qiao.bs.dialog({
		url : '/ucenter/role/setUrl/' + id,
		title : '设置Url',
		okbtn : '保存'
	}, web.role.addUrl);
};
web.role.addUrl = function(){
	var ids = [];
	$('#treeul input:checked').each(function(){ids.push($(this).parent().qdata().id);});
	
	var res;
	qiao.ajax({
		async: false,
		url: '/ucenter/role/saveUrl',
		data:{ids:ids.join(','),roleid:$('input[name="roleid"]').val()}
	}, function(json){
		res = json;
	});
	
	if(res && res.type == 'success'){
		return true;
	}else{
		qiao.bs.msg(res);
		return false;
	}
};
web.role.removeUrl = function(){
	var urls = [];
	$('tr.intr').each(function(){if($(this).hasClass('info')) urls.push($(this).attr('data'));});
	
	qiao.ajax({
		url: '/ucenter/role/removeUrl',
		data:{urls:urls.join(','),roleid:$('input[name="roleid"]').val()}
	}, function(res){
		if(res && res.type == 'success'){
			$('tr.intr').each(function(){if($(this).hasClass('info')) $(this).removeClass('intr').addClass('outtr').prependTo('table.outtable');});
		}else{
			qiao.bs.msg(res);
		}
	});
};

// account
web.bill = {};
web.bill.init = function(){
	qiao.crud.init();
	qiao.on('.shouzhi', 'click', web.bill.toshouzhi);
	qiao.on('.zhuan', 'click', web.bill.tozhuan);
	qiao.on('.stock', 'click', web.bill.tostock);
	qiao.on('.stockA', 'click', web.bill.stockDetail);
};
web.bill.toshouzhi = function(){
	qiao.bs.dialog({
		url : '/bill/detail/savep',
		title : '收入&支出',
		okbtn : '添加'
	}, function(){
		var res;
		qiao.ajax({
			async: false,
			url: '/bill/detail/save',
			data:$('#bsmodal').find('form').qser()
		}, function(json){
			res = json;
		});
		
		qiao.bs.msg(res);
		if(res && res.type == 'success'){
			setTimeout(function(){
				location.reload();
			},1000);
			return true;
		}else{
			return false;
		}
	});
};
web.bill.tozhuan = function(){
	qiao.bs.dialog({
		url : '/bill/tozhuan',
		title : '转账',
		okbtn : '转账'
	}, function(){
		var res;
		qiao.ajax({
			async: false,
			url: '/bill/zhuan',
			data:$('#bsmodal').find('form').qser()
		}, function(json){
			res = json;
		});

		qiao.bs.msg(res);
		if(res && res.type == 'success'){
			setTimeout(function(){
				location.reload();
			},1000);
			return true;
		}else{
			return false;
		}
	});
};
web.bill.tostock = function(){
	var title = $.trim($(this).text());
	qiao.bs.dialog({
		url : '/stock/detail/savep',
		title : title,
		okbtn : title
	}, function(){
		var $form = $('#bsmodal').find('form');
		if(title == '买入'){
			var $input = $form.find('input[name="row.stock_detail_price"]');
			$input.val('-' + $input.val());
		}
		
		var res;
		qiao.ajax({
			async: false,
			url: '/stock/detail/save',
			data:$form.qser()
		}, function(json){
			res = json;
		});
		
		qiao.bs.msg(res);
		if(res && res.type == 'success'){
			setTimeout(function(){
				location.reload();
			},1000);
			return true;
		}else{
			return false;
		}
	});
};
web.bill.stockDetail = function(){
	var title = '【' +　$(this).text() + '】交易明细';
	var url = '/stock/detail?row.stock_data_id=' + $(this).qdata().id;
	qiao.bs.dialog({url : url,title : title});
};


// blog
web.blog = {};
web.blog.init = function(){
	qiao.bs.initimg();
	web.blog.reset();

	qiao.on('.goblog', 'click', web.blog.go);
	
	qiao.on('.readda', 'click', web.blog.readd);
	qiao.on('.addComment', 'click', web.blog.save);
	$('.taba:eq(0)').on('shown.bs.tab', web.blog.redis);
};
web.blog.reset = function(){
	$('input[name="row.blog_comment_parent_id"]').val('');
	$('textarea[name="row.blog_comment_content"]').val('');
};
web.blog.go = function(){
	location.href = base + '/blog/detail/' + $(this).qdata().code;
};
web.blog.readd = function(){
	$('input[name="row.blog_comment_parent_id"]').val($(this).qdata().id);
	$('.taba:eq(1)').tab('show');
	$('#commentreadd').find('fieldset').attr('disabled',null).end().find('.btn').attr('disabled',null).focus();
	if(ue2) ue2.setEnabled();
};
web.blog.redis = function(){
	web.blog.reset();
	$('#commentreadd').find('fieldset').attr('disabled','disabled').end().find('.btn').attr('disabled','disabled');
	setTimeout(function(){if(ue2) ue2.setDisabled();}, 400);
};
web.blog.save = function(){
	qiao.ajax({
		url : '/blog/comment/save',
		data : $(this).parent().prev().qser()
	}, function(res){
		if(res){
			if(res.msg == 'notlogin'){
				web.login.show();
			}else{
				qiao.bs.msg(res);
				if(res.type == 'success'){
					setTimeout(function(){location.reload();},1000);
				}
			}
		}
	});
};

// blog-edit
web.blogedit = {};
web.blogedit.init = function(){
	qiao.on('.addBlog', 'click', web.blogedit.save);
};
web.blogedit.save = function(){
	var $form = $('#addBlogForm');
	var title = $.trim($form.find('input[name="row.blog_article_title"]').val()); 
	
	if(!title){
		qiao.bs.msg({msg:'请填写博客标题！',type:'danger'});
	}else{
		qiao.ajax({
			url : '/blog/article/save',
			data : $form.qser()
		}, function(res){
			qiao.bs.msg(res);
			
			if(res && res.type == 'success'){
				setTimeout(function(){
					location.href = base + '/blog/detail/' + res.object.blog_article_code;
				},1000);
			}
		});
	}
};

// diary
web.diary = {};
web.diary.init = function(){
	qiao.bs.initimg();
	qiao.on('.godiary', 'click', web.diary.go);
};
web.diary.go = function(){
	location.href = base + '/diary/detail/' + $(this).qdata().id;
};

// diary-edit
web.diaryedit = {};
web.diaryedit.init = function(){
	qiao.on('.addDiary', 'click', web.diaryedit.save);
};
web.diaryedit.save = function(){
	var $form = $('#addDiaryForm');
	var title = $.trim($form.find('input[name="row.diary_article_title"]').val()); 

	if(!title){
		qiao.bs.msg({msg:'请填写日记标题！',type:'danger'});
	}else{
		qiao.ajax({
			url : '/diary/article/save',
			data : $form.qser()
		}, function(res){
			qiao.bs.msg(res);
			
			if(res && res.type == 'success'){
				setTimeout(function(){
					location.href = base + '/diary/detail/' + res.object.id;
				},1000);
			}
		});
	}
};

// book
web.chapter = {};
web.chapter.init = function(){
	qiao.bs.initimg();
	qiao.on('.gochapter', 'click', web.chapter.go);
};
web.chapter.go = function(){
	location.href = base + '/book/chapterDetail/' + $(this).qdata().id;
};

// chapter-edit
web.chapteredit = {};
web.chapteredit.init = function(){
	qiao.on('.addChapter', 'click', web.chapteredit.save);
};
web.chapteredit.save = function(){
	var $form = $('#addChapterForm');
	var title = $.trim($form.find('input[name="row.book_chapter_title"]').val()); 

	if(!title){
		qiao.bs.msg({msg:'请填写章节标题！',type:'danger'});
	}else{
		qiao.ajax({
			url : '/book/chapter/save',
			data : $form.qser()
		}, function(res){
			qiao.bs.msg(res);
			
			if(res && res.type == 'success'){
				setTimeout(function(){
					location.href = base + '/book/chapterDetail/' + res.object.id;
				},1000);
			}
		});
	}
};

// otime
web.otime = {};
web.otime.init = function(){
	$('.orderimg').each(function(){
		var $this = $(this);
		$this.bstip($this.data('name'));
	});
	
	qiao.on('.wxreload', 'click', web.reload);
	qiao.on('.joinorderbtn', 'click', web.otime.joinorder);
	qiao.on('.addorderbtn', 'click', web.otime.addorder);
	qiao.on('.tohistory', 'click', web.otime.tohistory);
	qiao.on('.toranklist', 'click', web.otime.toranklist);
};
web.otime.joinorder = function(){
	var $this = $(this);
	if($this.hasClass('glyphicon-plus')){
		qiao.ajax({
			url : '/otime/adduser',
			data: $('.orderform').qser()
		}, function(json){
			qiao.bs.msg(json);
			
			if(json.type == 'success'){
				$this.removeClass('glyphicon-plus').addClass('glyphicon-trash');
				setTimeout(function(){location.reload();}, 1000);
			}
		});
	}else{
		qiao.ajax({
			url : '/otime/removeuser',
			data: $('.orderform').qser()
		}, function(json){
			qiao.bs.msg(json);
			
			if(json.type == 'success'){
				$this.removeClass('glyphicon-trash').addClass('glyphicon-plus');
				setTimeout(function(){location.reload();}, 1000);
			}
		});
	}
};
web.otime.addorder = function(){
	qiao.ajax({
		url : '/otime/saveorder',
		data: $('#addorderform').qser()
	}, function(json){
		qiao.bs.msg(json);
		if(json.type == 'success'){
			setTimeout(function(){
				location.href = base + '/otime/' + json.object.id;
			},1000);
		}
	});
};
web.otime.tohistory = function(){
	location.href = base + '/otime/rank/' + $(this).data('id');
};
web.otime.toranklist = function(){
	var $this = $(this);
	var title = $this.text() + '-订餐历史记录';
	var url = '/otime/ranktip/' + $this.data('orderid') + '-' + $this.data('userid');
	
	qiao.bs.dialog({
		url 	: url,
		title 	: title,
		foot	: false
	});
};