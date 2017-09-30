/*非空校验*/
var _required = /^\S/;

/*邮箱验证正则表达式*/
var _eamil = /^([a-z0-9_\.-]+)@([\da-z\.-]+)\.([a-z\.]{2,6})$/;

/*密码*/
var _password = /^[a-zA-Z0-9_-]{6,18}$/;

/*手机号*/
var _tel = /^((1[0-9]{1})+\d{9})$/;

/*邮政编码*/
var _yzbm = /^[1-9]\d{5}/;

/*身份证号码*/
var _personcode = /^\d{15}(\d\d[0-9xX])?/;

/*正整数*/
var _n = /^[0-9]\d*$/;

/*数字*/
var _num = /^\d+$/;

/*URL*/
var _url = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

/*ip地址*/
var _ip = /^((2[0-4]\d|25[0-5]|[01]?\d\d?)\.){3}(2[0-4]\d|25[0-5]|[01]?\d\d?)/;

/*日期（年-月-日）*/
var _ymd = /^(\d{4}|\d{2})-((0?([1-9]))|(1[1|2]))-((0?[1-9])|([12]([1-9]))|(3[0|1]))/;

/*MAC地址*/
var _mac = /^[A-F0-9]{2}(-[A-F0-9]{2}){5}$/; 

function valicate(str,type){
	var test = "";
	var value = false;
	var minLen = 0,maxLen = 0;
	var url = "";
	var p1 = "";
	if(type.indexOf('_minlen')>=0){
		var ml = type.split("=");
		type = ml[0];
		minLen = ml[1];
	}else if(type.indexOf('_maxlen')>=0){
		var ml = type.split("=");
		type = ml[0];
		maxLen = ml[1];
	}else if(type.indexOf('_repeat')>=0){
		var r = type.split("=");
		type = r[0];
		url = r[1];
	}else if(type.indexOf('_equals')>=0){
		var e = type.split("=");
		type = e[0];
		p1 = e[1];
	}else if(type.indexOf('_gt')>=0){
		var e  = type.split("=");
		type = e[0];
		p1 = e[1];
	}else if(type.indexOf('_lt')>=0){
		var e  = type.split("=");
		type = e[0];
		p1 = e[1];
	}else if(type.indexOf('_remote')>=0){
		var e = type.split("=");
		type = e[0];
		p1 = e[1];
		//调用远程校验
		return eval(p1);
	}
	switch (type){
		case '_required':
			test = _required;
			break;
		case '_email':
			test = _eamil;
			break;
		case '_password':
			test = _password;
			break;
		case '_tel':
			test = _tel;
			break;
		case '_yzbm':
			test = _yzbm;
			break;
		case '_personcode':
			test = _personcode;
			break;
		case '_n':
			test = _n;
			break;
			
		case '_num':
			test = _num;
			break;
		case '_url':
			test = _url;
			break;
		case '_ip':
			test = _ip;
			break;
		case '_ymd':
			test = _ymd;
			break;
		case '_mac':
			test = _mac;
			break;
		/*下面写非正则表达式的判断*/
		case '_minlen':
			if(str.trim().length>=minLen){
				return true;
			}else{
				/*errorMsg += "长度最少为"+minLen+"位";
				$("body").append("<h4>验证<small style='color:red'>"+str+"</small>"+errorMsg+":"+value+"</h4>");*/
				return false;
			}
		case '_maxlen':
			if(str.trim().length<=maxLen){
				return true;
			}else{
				/*errorMsg += "长度最多为"+maxLen+"位";
				$("body").append("<h4>验证<small style='color:red'>"+str+"</small>"+errorMsg+":"+value+"</h4>");*/
				return false;
			}
		case '_repeat':
			var uri = url+"="+str.trim();
			//校验是否重副
//			$.post(uri,null,function(data){
//				return data;
//			},"json");
			var f = false;
			$.ajax({ 
				type: "post", 
				url: uri, 
				cache:false, 
				async:false, 
				dataType: 'json', 
				success: function(data){ 
					console.log(uri);
					f = data;
				} 
			});
			return f;
			break;
		case '_equals':
			var p2 = str.trim();
			p1 = $("#"+p1).val();
			console.log("pw1:"+p1+"pw2:"+p2);
			if(p1!=p2){
				return false;
			}else{
				return true;
			}
			break;
		case '_gt':
			var p2 = str.trim();
			p1 = isNaN(p1)?$("#"+p1).val():p1;
			try {
				if(parseInt(p2)<parseInt(p1)){
					return false;
				}else{
					return true;
				}
			} catch (e) {
				return false;
			}
			
			break;
		case '_lt':
			var p2 = str.trim();
			p1 = isNaN(p1)?$("#"+p1).val():p1;
			try {
				if(parseInt(p2)>parseInt(p1)){
					return false;
				}else{
					return true;
				}
			} catch (e) {
				return false;
			}
			
			break;
		default:
			break;
	}
	if(test==""){
		value = true;
	}else{
		value = test.test(str);
	}
	/*if(!value){
		errorMsg += "格式错误，请确认！"
	}*/
	/*$("body").append("<h4>验证<small style='color:red'>"+str+"</small>"+errorMsg+":"+value+"</h4>");*/
	return value;
}


function addValicate(formMsgs){
	$(":input.form-control").blur(function(){
		if($(this).attr('needvalicate')=="true"){
			//防止重复验证
			$(this).attr('needvalicate',"false");
			
			//查找需要验证的选项
			var valiStr = $(this).attr('valicate');
			if(valiStr==null||valiStr.trim()==""){
				return;
			}
			var va = valiStr.split(" ");
			
			for(var i = 0;i<va.length;i++){
				var flag = false;
				if(va[i].indexOf("OR")>=0){
					var vb = va[i].split("OR");
					var f = false;
					for(var j=0;j<vb.length;j++){
						f = valicate($(this).val(),vb[j]);
						if(f)break;
					}
					flag = f;
				}else{
					flag = valicate($(this).val(),va[i]);
					console.log("验证："+va[i]+"结果："+flag);
				}
				if(flag){
					validSuccess($(this));
				}else if(!flag){
					var temp = "formMsgs." + $(this).attr("id") + "." + va[i].split("=")[0];
					var msg = eval(temp);
					validError($(this),msg);
					return;
				}
			}
			
		}
	});
	
	$(":input.form-control").change(function(){
		$(this).attr('needvalicate',"true");
	})
}

function validSuccess(dom){
	var span = $($(dom).parent()).children("span");
	if(span){
		$(span).each(function(n,item){
			$(item).remove();
		});
	}
	var g = $(dom).parent();
	$(g).removeClass("has-error");
	$(g).addClass("has-success");
	
	$(dom).after('<span class="glyphicon glyphicon-ok form-control-feedback" aria-hidden="true"></span>');
	removeTooTip(dom);
}

function validError(dom,formMsgs){
	var g = $(dom).parent();
	$(g).removeClass("has-success");
	$(g).addClass("has-error");
	var span = $(dom).next("span");
	if(span){
		$(span).remove();
	}
	$(dom).after('<span class="glyphicon glyphicon-remove form-control-feedback" aria-hidden="true"></span>');
	addToolTip(dom,formMsgs);
	$(dom).focus();
}

function addToolTip(dom,msg){
	
	//工具提示的默认位置为顶部
	$(dom).attr("data-placement","top");
	//工具提示的信息为title
	$(dom).attr("title",msg);
	$(dom).attr("data-original-title",msg);
	$(dom).tooltip();
}

function removeTooTip(dom){
	$(dom).attr("title","");
	$(dom).attr("data-original-title","");
}

function formSubmitCheck(formId){
	document.getElementById(formId).onsubmit = function(){
		var nv = $("#"+formId).find(":input[needvalicate=true]");
		$(nv).each(function(i,item){
			$(item).blur();
		});
		var e = $("#"+formId).find(".has-error");
		if(e.length>0){
			return false;
		}else{
			return true;
		}
		
		
	}
}

function formAjaxSubmitCheck(formId){
	var nv = $("#"+formId).find(":input[needvalicate=true]");
	$(nv).each(function(i,item){
		$(item).blur();
	});
	var e = $("#"+formId).find(".has-error");
	if(e.length>0){
		return false;
	}else{
		return true;
	}
}
