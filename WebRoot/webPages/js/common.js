var freeteam_model = "dev";
var http_base_path = (freeteam_model=="dev")?"http://localhost:8080/SSM/webPages/upload/":"http://static.gofreeteam.com/webPages/upload/";
var PARTROLE = ['技术合伙人','产品合伙人','市场合伙人','资源合伙人','投资合伙人'];

/**
 * 计算公司简介可以输入的数字数量 
 */
function checkWord(dom){
	var maxlen = $(dom).attr("maxlength");
	var val = $(dom).val();
	var writened = val.length;
	var canWriten = maxlen-writened;
	
	var w = $(dom).next("p").find("big")[0];
	var c = $(dom).next("p").find("big")[1];
	$(w).html(writened);
	$(c).html(canWriten);
}

/**
 * 移动DIV到指定位置
 * @param {Object} x 横坐标
 * @param {Object} y 纵坐标
 */
function moveDiv(x,y){
	var w = getWindowWH().w;
	var h = getWindowWH().h;
	var t = getScroll().t;
	var fd = document.getElementsByClassName("floatDiv")[0];
	
//	fd.style.top = (h + t - $(fd).height() -y) +"px";
	var lt = (h + t - 200 -y);
	fd.style.top = (lt<0?$(fd).height():lt)+100+"px";
//	fd.style.top = (t<y?y:t)+"px";
	fd.style.left = w - $(fd).width()-20+"px";
	
	fd.style.top = (t+y) + "px";
}

/**
 * 获得当前视口的宽度和高度
 */
function getWindowWH(){
	var w=window.innerWidth
	|| document.documentElement.clientWidth
	|| document.body.clientWidth;

	var h=window.innerHeight
	|| document.documentElement.clientHeight
	|| document.body.clientHeight;
	return{ w : w , h : h};
}

/**
 * 获得当前div的滚动高度、滚动条距左距离、当前视口的宽度和高度
 */
function getScroll() 
{
    var t, l, w, h;
    if (document.documentElement && document.documentElement.scrollTop) {
        t = document.documentElement.scrollTop;
        l = document.documentElement.scrollLeft;
        w = document.documentElement.scrollWidth;
        h = document.documentElement.scrollHeight;
    } else if (document.body) {
        t = document.body.scrollTop;
        l = document.body.scrollLeft;
        w = document.body.scrollWidth;
        h = document.body.scrollHeight;
    }
    return { t: t, l: l, w: w, h: h };
}

/**
 * 给对象添加事件
 * @param {Object} node
 * @param {Object} event
 * @param {Object} callback
 */
function addEvent(node, event, callback) {  
    if(document.addEventListener) {  
        node.addEventListener(event, callback);  
    } else {  
        node.attachEvent("on" + event, callback);  
    }  
}  

/**
 * 将头像图片放大显示
 * @param {Object} fromNode 要放大的头像DIV
 * @param {Object} toNode 页面上的大头像DIV
 * @param {Object} offsetX 向左偏移
 * @param {Object} offsetY 向上偏移
 */
function showLgImg(fromNode,toNode,offsetX,offsetY){
	var lgHead = document.getElementById(toNode);
	var smHead = fromNode;
	if(smHead==null||smHead==undefined){
		return;
	}
	addEvent(smHead,"mousemove",function(event){
		lgHead.style.left = event.pageX - offsetX + "px";
		lgHead.style.top = event.pageY - offsetY + "px";
		var lgImg = $(lgHead).find("img");
		$(lgImg).attr("src",$(smHead).attr("src"));
		$(lgHead).show();
	});
	
	addEvent(smHead,"mouseout",function(event){
		$(lgHead).hide();
	});
}

function clickSubmit(id){
	$("#"+id).click();
}

/**
 * 显示或者隐藏DIV
 * @param {Object} id div的ID
 * @param {Object} onlyShow 是否只显示(即显示后不再隐藏)
 */
function showOrHideDiv(id,onlyShow){
	var temp = "#" + id;
	var flag = $(temp).hasClass("hidden");
	if(flag){
		$(temp).removeClass("hidden");
	}
	if(!onlyShow){
		if(!flag){
			$(temp).addClass("hidden");
		}
	}
	
}

/**
 * 显示或者隐藏DIV
 * @param {Object} node div
 * @param {Object} onlyShow 是否只显示(即显示后不再隐藏)
 */
function showOrHideDiv2(node,onlyShow){
	var flag = $(node).hasClass("hidden");
	
	if(!onlyShow){
		if(!flag){
			$(node).addClass("hidden");
		}else{
			$(node).removeClass("hidden");
		}
	}else{
		if(flag){
			$(node).removeClass("hidden");
		}
	}
}

/**
 * 控制自定义单选按钮
 * @param {Object} id 按钮DIV的Id
 */
function controlCb(id,dom){
	$(dom).attr("disabled",true);
	var cb1 = document.getElementById(id);
	var btn = $(cb1).find('.cb-btn');
	var txt = $(cb1).find('.cb-text');
	var t1 = $(cb1).find('.cb-t1');
	var t2 = $(cb1).find('.cb-t2');
	
	var h = $(dom).prev();
	
	if($(btn).hasClass('fLeft')){
		$(t1).addClass('hidden');
		$(t2).removeClass('hidden');
		$(txt).removeClass('fRight').addClass('fLeft');
		$(btn).removeClass('fLeft').addClass('fRight');
		$(cb1).addClass('redbg');
		$(h).val("1");
	}else{
		$(t2).addClass('hidden');
		$(t1).removeClass('hidden');
		$(btn).removeClass('fRight').addClass('fLeft');
		$(txt).removeClass('fLeft').addClass('fRight');
		$(cb1).removeClass('redbg');
		$(h).val("0");
	}
	
	//提交数据到后台
	$(h).click();
}

/**
 * 初始化滑动按钮
 * @param id
 * @param cbVal
 */
function initCb(id,cbVal){
	var cb1 = document.getElementById(id);
	var btn = $(cb1).find('.cb-btn');
	var txt = $(cb1).find('.cb-text');
	var t1 = $(cb1).find('.cb-t1');
	var t2 = $(cb1).find('.cb-t2');
	var cbCore = $(cb1).find("#cbCore");
	$(cbCore).val(cbVal);
	
	if(cbVal=="1"){
		$(t1).addClass('hidden');
		$(t2).removeClass('hidden');
		$(txt).removeClass('fRight').addClass('fLeft');
		$(btn).removeClass('fLeft').addClass('fRight');
		$(cb1).addClass('redbg');
	}else{
		$(t2).addClass('hidden');
		$(t1).removeClass('hidden');
		$(btn).removeClass('fRight').addClass('fLeft');
		$(txt).removeClass('fLeft').addClass('fRight');
		$(cb1).removeClass('redbg');
	}
	
}

/**
 * 操作表格时显示操作选项
 */
function showOption(a,flag){
	var temp = $($(a).parent()).find(".options");
	showOrHideDiv2(temp,flag);
}

/**
 * 使用必须将input，imgDiv，和imgPreView的元素放在input的父级dom的任意后代dom下
 * 且注意class，js中是根据class处理的
 * @param {Object} obj
 */
function setImage(obj){
    var value = obj.value;
    if(value ==""){
        return false;
    }
//  if(value.indexOf('.jpg')<=0 && value.indexOf('.JPG')<=0){
//       alert("请选择jpg类型图片");
//       obj.outerHTML += "";
//       return false;
// 	}
	var p = $(obj).parent();
	var $divObj = $(p).find(".imgDiv");
	var $imgObj = $(p).find(".imgPreView");
	var divObj = $($divObj)[0];
	var imageObj = $($imgObj)[0];
	return previewImage(divObj,imageObj,obj);
};

/**
 * 预览图片，示例见myHostPage.html第439行
 * @param {Object} divObj 判断浏览器的类型
 * @param {Object} imageObj 要预览的图片元素
 * @param {Object} fileObj 上传图片的input
 */
function previewImage(divObj,imageObj,fileObj){
   try{
       //FireFox7.0下直接设置img属性
       if(fileObj.files && fileObj.files[0]){  //另一种FF浏览器的判断: if (navigator.userAgent.indexOf("Firefox")>0)
          imageObj.style.display="";
         imageObj.src = window.URL.createObjectURL(fileObj.files[0]); //7.0的获取方法；7.0以下的取法：obj.files.item(0).getAsDataURL();
       }else if(divObj.filters){  //另一种IE浏览器的判断: if (navigator.userAgent.indexOf("MSIE")>0)
          fileObj.select();
          var value;
          if ($.browser.version > 8) {    
             divObj.focus();  // IE9
             
         }
          value = document.selection.createRange().text;
          imageObj.style.display="none";
          divObj.filters.item("DXImageTransform.Microsoft.AlphaImageLoader").src= value;
      }
   }catch(ex){
       alert("选择企业LOGO图片路径错误!");
       fileObj.outerHTML+="";
       return false;
   }   
   return true;
}

/**
 * 解析URL参数
 * @param url 要解析的URL
 * @param paramName 要获取哪个param的值[可选]
 */
function paramsAnalysis(url,paramName){
	if(url==""||url==null){
		console.log('url is null');
		return null;
	}
	if(url.indexOf('?')<0){
		console.log('url has not params');
		return null;
	}
	var params = url.substring(url.indexOf('?')+1);
	var paramArray = params.split('&');
	
	for(var i in paramArray){
		var temp = paramArray[i].split('=');
		if(temp[0]==paramName)return temp[1];
	}
	return null;	
}

/**
 * 创建dialog
 * @param dialogId 要创建dialog的id
 * @param title 标题
 * @param contentId 将页面上某个div添加到dialog的内容中
 */
function createDialog(dialogId,title,contentId){
	var dialog = "<div class='modal fade' id='"+ dialogId +"' tabindex='-1' role='dialog' aria-labelledby='myModalLabel' style='display:none;'>"
		+"  <div class='modal-dialog' role='document'>"
		+"    <div class='modal-content clearfix'>"
		+"      <div class='modal-header'>"
		+"        <button type='button' class='close' data-dismiss='modal' aria-label='Close'><span aria-hidden='true'>&times;</span></button>"
		+"        <h4 class='modal-title' id='myModalLabel'>"+title+"</h4>"
		+"      </div>"
		+"      <div class='modal-body p10'>"
		+"      </div>"
		+"		<div class='p10'></div>"
		+"      <div name='footer' class='modal-footer'>"
		+"        <button type='button' class='mybtn btncancel' data-dismiss='modal'>关闭</button>"
		+"        <button type='button' class='mybtn-primary btnsave' onclick='clickButton(\""+dialogId+"\")'>保存</button>"
		+"      </div>"
		
		+"    </div>"
		+"  </div>"
		+"</div>";
	
	$('body').append(dialog);
//	$("#"+dialogId+">.modal-body").append("it");
	var _dialog = document.getElementById(dialogId);
	var _diaBody = $(_dialog).find(".modal-body");
	$(_diaBody).append(document.getElementById(contentId));
//	$(_diaBody).append("it works");
}

function hideDialog(id){
	$("#"+id).modal('hide');
}

function hideDialogFooter(id){
	var f = $("#"+id).find("[name=footer]");
	$(f).hide();
}

function changeDiaTitle(id,title){
	var t = $("#"+id).find(".modal-title");
	$(t).text(title);
	
}

function showDialogFooter(id){
	var f = $("#"+id).find("[name=footer]");
	$(f).show();
}

/**
 * 省市县三级联动divID
 */
var pcaId = "";
/**
 * 设置城市下拉框
 */
function queryProvince(){
	if(!pcaId||""==pcaId){
		return;
	}
	var province = $("#"+pcaId).find("#province");
	var setProvince = function(data){
		var c = $(province).children("option:gt(0)");
		$(c).remove();
		$(province).change();
		var p = data.obj;
		for(var i=0;i<p.length;i++){
			var code = p[i].code;
			var name = p[i].name;
			$(province).append("<option value='"+code+"'>"+name+"</option>");
			
		}
	}
	$.post("queryProvinceData.do",null,setProvince,'json');
}

function queryCity(dom){
	if(!pcaId||""==pcaId){
		return;
	}
	var provinceId = $(dom).val();
	if(!provinceId||""==provinceId||provinceId=="undefined")return;
	if(provinceId=="-1")clearCity();
	var city = $("#"+pcaId).find("#city");
	var setCity = function(data){
		var c = $(city).children("option:gt(0)");
		$(c).remove();
		$(city).change();
		var p = data.obj;
		for(var i=0;i<p.length;i++){
			var code = p[i].code;
			var name = p[i].name;
			$(city).append("<option value='"+code+"'>"+name+"</option>");
			
		}
	}
	
	$.post("queryCityData.do",{'provinceId':provinceId},setCity,'json');
}

function queryArea(dom){
	if(!pcaId||""==pcaId){
		return;
	}
	var cityId = $(dom).val();
	if(!cityId||""==cityId||cityId=="undefined")return;
	if(cityId=="-1")clearCity();
	var area = $("#"+pcaId).find("#area");
	var setArea = function(data){
		var c = $(area).children("option:gt(0)");
		$(c).remove();
		$(area).change();
		var p = data.obj;
		for(var i=0;i<p.length;i++){
			var code = p[i].code;
			var name = p[i].name;
			$(area).append("<option value='"+code+"'>"+name+"</option>");
		}
	};
	
	$.post("queryAreaData.do",{'cityId':cityId},setArea,'json');
}

function setPCA(pCode,cCode,aCode){
	if(!pcaId||""==pcaId){
		return;
	}
	var province = $("#"+pcaId).find("#province");
	var city = $("#"+pcaId).find("#city");
	var area = $("#"+pcaId).find("#area");
	
	var callback1 = function(data){
		var c = $(province).children("option:gt(0)");
		$(c).remove();
		var p = data.obj;
		for(var i=0;i<p.length;i++){
			var code = p[i].code;
			var name = p[i].name;
			if(pCode==code){
				$(province).append("<option selected='selected' value='"+code+"'>"+name+"</option>");
			}else{
				$(province).append("<option value='"+code+"'>"+name+"</option>");
			}
		}
		$.post("queryCityData.do",{'provinceId':pCode},callback2,'json');
	};
	
	var callback2 = function(data){
		var c = $(city).children("option:gt(0)");
		$(c).remove();
		var p = data.obj;
		for(var i=0;i<p.length;i++){
			var code = p[i].code;
			var name = p[i].name;
			if(cCode==code){
				$(city).append("<option selected='selected' value='"+code+"'>"+name+"</option>");
			}else{
				$(city).append("<option value='"+code+"'>"+name+"</option>");
			}
		}
		$.post("queryAreaData.do",{'cityId':cCode},callback3,'json');
	};
	
	var callback3 = function(data){
		var c = $(area).children("option:gt(0)");
		$(c).remove();
		var p = data.obj;
		for(var i=0;i<p.length;i++){
			var code = p[i].code;
			var name = p[i].name;
			if(aCode==code){
				$(area).append("<option selected='selected' value='"+code+"'>"+name+"</option>");
			}else{
				$(area).append("<option value='"+code+"'>"+name+"</option>");
			}
			
		}
		
	};
		
	$.post("queryProvinceData.do",null,callback1,'json');
}

function clearCity(){
	if(!pcaId||""==pcaId){
		return;
	}
	var province = $("#"+pcaId).find("#province");
	var city = $("#"+pcaId).find("#city");
	var area = $("#"+pcaId).find("#area");
	
	$(city).val("-1");
	$(area).val("-1");
	var c = $(area).children("option:gt(0)");
	$(c).remove();
}

/**
 * 复选框下有隐藏的input用于提交数据
 * @param dom
 */
function remeber(dom){
	var cv = $(dom).next();
	if($(dom)[0].checked){
		$(cv).val(1);
	}else{
		$(cv).val(0);
	}
}

/**
 * eg:将格式为username=david&pwd=123456 改为格式{username:david,pwd:123456}
 * @param params
 */
function changeUrlParamsToJson(params){
	
	var jparam = "{"+params.replace(new RegExp('=','gm'),':\'').replace(new RegExp('&','gm'),'\',')+"'}";
	var res = eval("("+jparam+")");
	return res;
}

/**
 * 格式化表单中的textArea
 * @param formId
 */
function markFormTextAreaFmt(formId){
	//页面初始化时反格式化textArea
	var eForm = document.getElementById(formId);
	var ta = $(eForm).find("textArea")[0];
	var taVal = $(ta).val();
	if(taVal!=null&&taVal!=undefined&&!""==taVal.trim()){
		taVal = taVal.replace(/<br>/g,"\n").replace(/&nbsp;/g," ");
		$(ta).val(taVal);
	}
}

function getRolePart(type){
	var rp = ["","技术合伙人","产品合伙人","市场合伙人","资源合伙人","投资合伙人"];
	return rp[parseInt(type)];
}

function showMyIntro(){
	var callback = function(data){
		var u = data.obj;
		$("#_headPic").attr("src",$("#basePath").val() + "webPages/upload/headpic/" + u.headImg);
		$("#_nickName").text(u.nickName);
		if($("#hidType").val()=="1"){
			$("#_partRole").text(PARTROLE[parseInt(u.partRole-1)]);
		}else{
			$($("#_partRole").parent()).remove();
		}
		$("#_area").text(u.area);
		$("#banlanceText").text(u.banlance);
	}
	$.post("queryMyIntro.do",null,callback,"json");
}

function setCbSelect(dom,value){
	console.log($(dom).attr("id")+"选中："+value);
	var o = $(dom).find("option[value='"+value+"']");
	var a = $(o)[0];
	if(a==undefined)return false;
	a.selected = true;
	$(dom).change();
	return true;
}

/**
 * 初始化页面上的下拉框
 */
function initCb(){
	$("select").each(function(i,item){
		var v = $(item).attr("value");
		if(v!=null&&v!=""&&v!=undefined){
			setCbSelect(item,v);
		}
	});
}

function getStar(num){
	if(num==null||num==undefined||isNaN(num)){
		return;
	}else{
		num = Math.round(parseFloat(num));
		var str = "";
		for(var i=0;i<num;i++){
			str += "<span class='glyphicon glyphicon-star redStar'></span>";
		}
		
		for(var i=num;i<5;i++){
			str += "<span class='glyphicon glyphicon-star whiteStar'></span>";
		}
		return str;
	}
}

/**
 * 通过ajax提交表单
 * @param formId form的id
 * @param callback 回调函数
 */
function postFormByAjax(formId,userparam,callback){
	var form = $("#"+formId);
	var url = $(form).attr("action");
	var param = $(form).serialize();
	param = param.replace(/\+/g," "); 
	//由于serialize方法会调用encodeURIComponent()将中文转码。下面调用decode保持正常格式。防止中文乱码
	param = decodeURIComponent(param,true); 
	var jparam = {};
	if(param.length>0){
		jparam = changeUrlParamsToJson(param);
	}
    if(userparam!=null){
    	jparam = eval('('+(JSON.stringify(jparam)+JSON.stringify(userparam)).replace(/}{/,',')+')');
    }
    $.post(url,jparam,callback,"json");
}

/**
 * 获取手机验证码
 */
function getValiCode(tel){
//	var callback = function(data){
//		alert(data.obj);
//		if(data.msgNo=="1"){
//			alert("手机号码验证成功！");
//			window.location.href = "activePhone.do";
//			
//		}else{
//			alert("您填写的验证码有误。");
//		}
//	}
	$.post("SMS/sendSms.do",{"phone":tel,"tplId": "1341175","code":"1"},function(data){},"json");
}

function toUrl(url){
	window.location.href = url;
}

function toUrlAjax(url){
	$.post(url,null,function(data){
		alert(data.obj);
	},"json");
}

function submitDoubleCheck(dom){
	alert(111);
	$(dom).attr("disabled","disabled");
	$(dom).html("请稍后...");
	var tmp = function(){
		$(dom).removeAttr('disabled');
		$(dom).html("保存");
	}
	setTimeout("tmp();",3000);
}

function nvl(str,str2){
	if(str!=null&&str!=undefined&&str.trim().length>0){
		return str;
	}else{
		return str2;
	}
}


/**
 * 剪切长文本，加上"..."后缀
 * @param txt
 * @param maxLength
 */
function cutLongTxt(txt,maxLength){
	if(txt==null||txt==undefined){
		return "";
	}
	var l = txt.length;
	if(l<=maxLength){
		return txt;
	}else{
		return txt.substring(0,maxLength)+"...";
	}
}

function fixToTop($dom){
	$(window).bind("scroll",function(e){
		var t1 = $dom.parent()[0].offsetTop;
		var t2 = $(document).scrollTop();
		var r = t1 - t2;
		if(r<=60){
			$dom.css("position","fixed").css("top","60px").css("z-index","9").css("background","white");
		}else{
			$dom.css("position","");
		}
	});
}

/**
 * 通用ajax上传方法  
 * 1.http://www.cnblogs.com/kissdodog/archive/2012/12/15/2819025.html
 * 2.http://dannybai.iteye.com/blog/657810
 * @param fileDivId
 * @param dir
 */
function ajaxFileUpload(fileDivId, dir,callback){
	$.ajaxFileUpload({
        url: 'file/uploadFile.do', //用于文件上传的服务器端请求地址
        secureuri: false, //是否需要安全协议，一般设置为false
        fileElementId: fileDivId, //文件上传域的ID
        dataType: 'String', //返回值类型 一般设置为json
        data: {
        	dir: dir
        },
        success: function (data, status){  //服务器成功响应处理函数
            callback(data);
        },
        error: function (data, status, e){//服务器响应失败处理函数
        	console.log(data);
            alert(e);
        }
    });
    return false;
}

//重载页面
function refreshPage(page){
	if(page){
		window.location = page;
	}else{
		window.location.reload();
	}
	
}


/**
 * 计算用户星级
 * @param examine 是否已认证
 * @param isRecommend 是否推荐
 * @param goodPercent 好评率
 * @returns {String}
 */
function getUserStars(examine,isRecommend,goodPercent){
	examine = examine>0?1:0;
	isRecommend = isRecommend>0?1:0;
	goodPercent = goodPercent>=0.6?1:0;
	var score = examine * 60 + isRecommend *20 + goodPercent * 20;
	score = Math.round(score / 100 * 5);
	return getStar(score);
}

$(function(){
	//过长文字添加省略号
	$(".ellipsis").each(function(i,item){
		initEllipsis(item);
	})
});

function initEllipsis(dom){
	if($(dom).text().length()<=100)return;
	var $clone = $(dom).clone();
	$clone.attr("id",$(dom).attr("id") + "clone");
	$(dom).addClass("hidden").after($clone);
	$clone.text(cutLongTxt($clone.text(), 100));
	$clone.after('<a for="'+$(dom).attr("id")+'" style="display: block;" onclick="showEllipsis(this);">展开</a>');
}

function showEllipsis(dom){
	var id = $(dom).attr("for");
	var $t1 = $("#" + id);
	var $t2 = $t1.next();
	if($t1.hasClass("hidden")){
		$t2.addClass("hidden");
		$t1.removeClass("hidden");
		$(dom).text("收起");
	}else{
		$t2.removeClass("hidden");
		$t1.addClass("hidden");
		$(dom).text("展开");
	}
	
}

/**
 * 获取项目基础调用路径
 * @returns
 */
function getCtx(){
	return $("#ctx").val();
}

