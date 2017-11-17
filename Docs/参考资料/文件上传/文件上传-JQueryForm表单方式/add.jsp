<%@ page language="java" import="java.util.*" pageEncoding="utf-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
<title>新增节目话题</title>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
 <link rel="stylesheet" href="${ctx}/rs/crop/assets/css/font-awesome.min.css"/>
 <%-- <link rel="stylesheet" href="${ctx}/rs/css/bootstrap.min.css"/> --%>
 <link href="${ctx}/rs/js/umeditor/themes/default/css/umeditor.css" type="text/css" rel="stylesheet"/>
 <link rel="stylesheet" href="${ctx}/rs/crop/assets/css/tooltip.min.css"/>
 <link rel="stylesheet" href="${ctx}/rs/crop/dist/cropper.css"/>
  <!-- Scripts -->
  <%-- <script src="${ctx}/rs/crop/assets/js/jquery.min.js"></script> --%>
  <script src="${ctx}/rs/crop/assets/js/tooltip.min.js"></script>
  <script src="${ctx}/rs/crop/assets/js/bootstrap.min.js"></script>
<script src="${ctx}/rs/js/jquery.validate.min.js"></script>
<script src="${ctx}/rs/js/jquery.form.js" type="text/javascript"></script>
<script src="${ctx}/rs/js/qiao.js" type="text/javascript"></script>

<style type="text/css">
	.aCss {
		display: block; 
		width: 70px;
		height: 25px;
		border: 1px solid #CCC;
		background: #5bc0de;
		margin-top: 5px;
	}
	.aCss a {
		font-size: 14px;
		padding: 2px 6px;
		display: block;
		color: #ffffff;
		text-decoration: none;
	}
	
	.uploadDiv{width: 500px;}
	.uploadDiv ul{background: rgb(232,232,232);margin-bottom: 0px;}
	.uploadDiv ul li{list-style: none;float: left;padding: 5px;margin: 5px 0px 0px 15px;}
	.uploadDiv ul li.active{background: white;}
	
	.uploadDiv .imgDiv{padding: 10px;border: 1px #E3E3E3 solid;border-top: 1px white solid;max-width: 475px;max-height: 400px;overflow-y: auto;}
	.uploadDiv .file{width: 75px;text-align: center;}
	.uploadDiv .tipText{width:300px; margin: 0px auto;font-size: 12px;color: grey;margin-top: 10px;}
	.uploadDiv .tipText p{line-height: 1em;}
	
	.uploadDiv #preview{position: relative;}
	.uploadDiv #preview img{padding: 5px 10px 5px 0px;}
	.uploadDiv #preview .close{position: absolute;color: red;z-index: 99;font-size: 16px;top: -2px;right: 2px;}
	
	.img-box{width: 120px; height: 120px;}
	.img-box .checkBox{margin-left: 105px;}
	
	#content-error{top: 26px;}
	#addTopic .btn-primary:hover {
 		background-color: #14b9d6;
 		border-color: #14b9d6;
	}
	.valid2 {
	left:500px;
	}
	.colortxt{display: inline-block;padding: 10px 0px 0px 0px;}
</style>
</head>
<body>
<div id="addTopic">
	<form id="form1" class="form-horizontal" action="${ctx}/interactive/topic/save.htm" method="post" enctype="multipart/form-data">
      	<!-- 如果有这两个参数则会将该ID的话题或者投票替换至历史库 -->
      	<input type="hidden" name="oldId" value="${oldId}"/>
      	<input type="hidden" name="oldType" value="${oldType}"/>
      <div class="form-group">
        <label for="name" class="col-sm-2 control-label item wid1">标签：</label>
        <div class="col-sm-9 wid0701">
          <input type="hidden" id="channelId" name="channelId" value="${channelId}"/>
          <input type="hidden" id="programColumnId" name="programColumnId" value="${programColumnId}"/>
          <input type="hidden" id="enable" name="enable" value="${enable}"/>
          <!-- 新增时如果有节目单ID，则默认上线 -->
          <input type="hidden" id="programId" name="programId" value="${programId}"/>
          <input type="hidden" id="type" name="type" value="0"/>
          <input type="text" class="form-control itemput" id="title" name="title" maxlength="12" placeholder="长度不能超过12个汉字" style="width:470px"/>
        </div>
        <font style="color:#FF9966"> *</font>
      </div>
      
     
      
      <div class="form-group">
        <label for="name" class="col-sm-2 control-label item wid1">话题内容：</label>
        <div class="col-sm-9 wid0701">
		  <!--style给定宽度可以影响编辑器的最终宽度-->
          <script type="text/plain" id="myEditor" onchange="changeContent(this);" maxlength="500" style="width:470px;height:200px;"></script>
		  <!-- <textarea rows="0" id="content" name="content" maxlength="500" style="width:0px;height: 0px;resize: none;" maxlength="500"></textarea> -->
		  <input id="contentcc" name="content" maxlength="500" style="width:0px;height: 0px;padding: 1px;border: 0px;"></input>
		  <span id="contentCounter" class="colortxt" num="500" for="content">还可输入500字</span>
        </div>
        <font style="color:#FF9966"> *</font>
      </div>
      
      <div class="form-group">
      	<label for="name" class="col-sm-2 control-label item wid1">封面：</label>
      	<div class="col-sm-9 uploadDiv">
      		<ul class="clearfix tab">
      			<li class="active" for="childDiv1">本地上传</li>
      			<!-- <li for="childDiv2">我的图片</li> -->
      		</ul>
      		<div class="imgDiv">
      			<div class="childDiv1">
      				<div style="width: 100px;margin: 0px auto;">
	      				<div class="aCss">
					  		<a id = "choosePicture" href="javascript:void(0)" onclick="choosePicture();">选择图片</a>
						</div>
	      			</div>
	      			
	      			<div class="tipText">
	      				<p>提示：</p>
	      				<p>1.支持png和jpg格式，最多支持三张图片</p>
	      				<p>2.建议每张图片显示200k以内</p>
	      			</div>
	      			<div>
	      				<span id="preview" class="clearfix">
	      					<input type="file" class="file hidden" name="files" value="选择图片"  onchange="previewImage(this)"/>
		      				<input type="file" class="file hidden" name="files" value="选择图片"  onchange="previewImage(this)"/>
		      				<input type="file" class="file hidden" name="files" value="选择图片"  onchange="previewImage(this)"/>
	      				</span>
	      			</div>
      			</div>
      			<div class="childDiv2" style="display: none;">
      				<div id="libraryPics" class="hidden">
      					<input type="hidden" id="libraryPicsInput" name="libraryPics" value="" />
      				</div>
      				<div class="pic-container">
      				
      				</div>
      			</div>
      		</div>
      	</div>
      </div>
      <!-- 
       <div class="form-group">
        <label for="name" class="col-sm-2 control-label item wid1">图标：</label>
        <div class="col-sm-9 wid0701" style="overflow: hidden;">
		   <input type="file" id="cfilepic" name="cfilepic" class="upload"  /> <span class="help-block" id="valierr" style="color:#FF9966">*</span>
		 <div class="colortxt" style="color: red">支持png和jpg格式，建议尺寸105*63</div>
        </div>
      </div>
       -->
      <!-- <div class="form-group">
        <label for="name" class="col-sm-2 control-label item wid1">类型：</label>
        <div class="col-sm-9 wid2">
          <select class="comp_select" id="type" name="type" style="height:34px">
  			<option value="0" selected="selected">文字话题</option>
			<option value="1">外链网址</option>
		  </select>
        </div>
      </div> -->
      
      <div class="form-group">
        <label for="name" class="col-sm-2 control-label item wid1">展示期数：</label>
        <div class="col-sm-8 wid2">
        <input id="peroidTimes" name="peroidTimes" class="form-control itemput fl" placeholder="请输入1-360的整数" maxlength="8" onkeyup="this.value = this.value.replace(/[０１２３４５６７８９]/g, function(v){return v.charCodeAt(0)-65296;});" value="1"  />
        <label style="margin-top: 5px;margin-left: 8px;float:left;">期</label>
        </div>
        <font style="color:#FF9966"> *</font>
        <label class="colortxt" style="color: #DBDBDB;margin-left:139px;margin-top:12px;">设置互动内容展示期数，每次直播算一期</label>
      </div>
      
      <div class="form-group">
        <div class="text-center pt15">
		     <button type="button" class="btn btn-primary btn-lg srt-btn active mr30" onclick="valiSubmit()">提交</button>
		     <button type="button" class="btn btn-default btn-lg srt-btn active"  onclick="resetForm()">重置</button>
        </div>
      </div>

      <div class="form-group">
        <div class=" col-sm-10">
          <span id="error-text" style="color: #FF0000;"></span>
        </div>
      </div>
</form>
</div>	

 

<script type="text/javascript" src="${ctx}/rs/js/bootstrapQ.min.js"></script>
<script src="${ctx}/rs/js/messages_zh.min.js"></script>

<script type="text/javascript" charset="utf-8" src="${ctx}/rs/js/umeditor/umeditor.config.js"></script>
<script type="text/javascript" charset="utf-8" src="${ctx}/rs/js/umeditor/umeditor.min.js"></script>
<script type="text/javascript" src="${ctx}/rs/js/umeditor/lang/zh-cn/zh-cn.js"></script>
<script type="text/javascript">
	//实例化编辑器
	var um = UM.getEditor('myEditor', {
	    autoHeightEnabled : false,
	    toolbar: ['link unlink'],
	    maximumWords: 500
	});
	um.addListener('blur', function() {
	    //失去焦点，做一次保存操作
	    $("#contentcc").val(um.getContentTxt()).blur();
	});
	
	um.addListener('keyup', function() {
	    var cl = um.getContentTxt().length;
	    $("#contentcc").val(um.getContentTxt()).blur();
	    if(cl<500){
	        //失去焦点，做一次保存操作
	        $("#contentCounter").text("还可输入" + (500 - um.getContentTxt().length) + "字");
	    }else{
	        
	        $("#contentCounter").text("还可输入0字");
	    }
	});
	//计数器
	function countNum(dom){
		var num = $(dom).attr("num");
		var f = $(dom).attr("for");
		
		f&&$("#"+f).on("keyup",function(){
			
			var v = um.getContentTxt();
			if(v.length>num){
				$(this).text(v.substring(0,num));
			}
			$(dom).text("还可输入" + (num - v.length) + "字");
			
		})
		
	}
	countNum($("#contentCounter"));
	
	function changeContent(dom){
		
		$("#contentCounter").text("还可输入" + (500 - um.getContentTxt().length) + "字");
	}
	
	
	
	//给链接加提示
	$('.addlink').bstip({
	    title   : '添加文字链接',
	    html    : true,
	    placement   : 'top',
	    trigger : 'hover'
	});
	
	function addLink(){
		/* var text = getSelectedText(document.getElementById("content")); */
		//项目中的bootstrapQ是老版的，不支持多重弹窗，这里引入新版bootstrapQ改名为qiao2，
		//zhanjp added 2016-10-9 10:56:27 for v2.7.0
		qiao2.bs.dialog({
			url: '${ctx}/send.htm?page=topic/addLink',
			id: 'addLinkModal',
			mstyle:'width:500px;',
			msg: '',
			title: '添加链接',
			foot: false
		});
	}
	
	
	//自定义验证规则
	$.validator.addMethod("limitType", function(value, element) {
		var str = value.substr(value.lastIndexOf(".")).toLowerCase();
		return this.optional(element) || /.(png|jpg)$/.test(str);
	}, "上传图片格式不正确!");
	
	$.validator.addMethod("limitPicSize", function(value, element) {
		if(value=="") return true;
		var width=$('#imghead').attr("width");
		var heights=$('#imghead').attr("height");
		if(width==600 && heights==230){
			return true;
		}
	}, "上传图片的尺寸必须是600*230");
	
	$.validator.addMethod("limitImgSize", function(value, element) {
		if(value=="") return true;
		var browserCfg = {};
		var ua = window.navigator.userAgent;
		if (ua.indexOf("MSIE")>=1){
			browserCfg.ie = true;
		}else if(ua.indexOf("Firefox")>=1){
			browserCfg.firefox = true;
		}else if(ua.indexOf("Chrome")>=1){
			browserCfg.chrome = true;
		}
		var filesize = 0;
		if(browserCfg.firefox || browserCfg.chrome ){
			filesize = element.files[0].size;
		}else if(browserCfg.ie){
			var obj_img = document.getElementById('imghead');
			obj_img.dynsrc=element.value;
			filesize = obj_img.fileSize;
		}else{
			return false;
		}
		if(filesize==-1){
			return false;
		}else if(filesize>200*1024){
			return false;
		}else{
			return true;
		}
	}, "上传的图片大小不能超过200KB!");
	
	//自定义验证方法，验证字符长度（汉字算两个）
	$.validator.addMethod("checkCharLength",function(value,element,params) {
	    advertName = encodeURIComponent(value);
	    var minLength = params[1];
	    var maxLength = params[2];
	    var txtLength;
	    var obj = value.match(/[^\x00-\xff]/g);
	    if(obj!=null) {
	        txtLength = obj.length+value.length;    //将汉字的长度加上总长度（相对于把汉字做两个字符看）
	    }
	    else {
	        txtLength = value.length;
	    }
	    if (txtLength > maxLength || txtLength < minLength) {
	         return false;
	    }
	    return true;
	});
	
	
	
	var form = $('#form1');
	var validator = form.validate({
			rules : {
				title : {
					maxlength : 12,
					required : true
				},
				/* cfile : {
					limitType : "limitType",
					limitPicSize:"limitPicSize",
					limitImgSize:"limitImgSize"
				},
				cfilepic : {
					limitType : "limitType"
				}, */
				content : {
					maxlength: 500,
					required : true
				},
				peroidTimes: {
                    digits:true,
                    min:1,
                    max:360,
                    required :true
                }
			},
			messages : {
				content: {
					checkCharLength: "长度不能超过500汉字"
				}
			},
			highlight : function(element) {
				$(element).closest('.form-group').removeClass('success').addClass(
						'error');
			},
			success : function(element) {
				element.text('OK!').addClass('valid valid2').closest('.form-group')
						.removeClass('error').addClass('success');
			}
		});
	function valiSubmit() {
		if (form.valid()) {
			var options = {
				dataType : "json",
				beforeSubmit : function() {
					$(".unable").show();
				},
				success : function(result) {
					if (!$('.unable').is(':hidden')) {
						$(".unable").hide();
					}
					if (result) {
						// 普通消息提示条
						bootstrapQ.msg({
							msg : '新增话题成功！',
							type : 'success',
							time : 2000
						});
						//触发隐藏确认的按钮，引用回调方法关闭窗口并刷新列表
						$("button.bsok").click();
					} else {
						bootstrapQ.msg({
							msg : '新增话题失败！',
							type : 'danger',
							time : 2000
						});
					}
				},
				error : function(result) {
					if (!$('.unable').is(':hidden')) {
						$(".unable").hide();
					}
					bootstrapQ.msg({
						msg : '发布失败！',
						type : 'danger',
						time : 2000
					});
				}
			};
			
			// 替换富文本编辑器里面的除a标签的其它标签
			var html = um.getContent();
			$("#contentcc").val(delHtmlTag(html).split("&nbsp;").join(" "));
            var programId=$("#programId").val();
            var channelId=$("#channelId").val();
            var columnId=$("#programColumnId").val();
            var fillDisplayPeriodTimes= $("#peroidTimes").val();
            
           $.ajax({
               url: "${ctx}/interactive/resource/getColumnScheduleCount.htm",
               data: { programId: programId ,channelId:channelId,columnId:columnId},
               type: "post",
               success: function (count) {
                if(parseInt(fillDisplayPeriodTimes) <= parseInt(count)){
                    form.ajaxSubmit(options);
                } else {
                    bootstrapQ.msg({
                        msg : '节目单只存在'+count+'期节目，最多填写'+count+'期。',
                        type : 'danger',
                        time : 2000
                    });
                    return false;
                }
               },
               error : function(result) {
                   bootstrapQ.msg({
                       msg : '发生错误，新增活动保存失败！',
                       type : 'danger',
                       time : 2000
                   });
               }
           });
			return false;
		}
	}
	
	function delHtmlTag(str){
		//去掉所有的html标签保留a标签
	 	return str.replace(/<(?!a|\/a).*?>/g,"");
	 }
	
	$('#type').change(function(){
		$('#contentcc').val('');
	})
	
	function resetForm() {
		$("#form1").resetForm();
		UM.getEditor('myEditor').setContent('');
		validator.resetForm();
	}
	
	//======================== 上传三张图片开始 ===========================================
	$(".uploadDiv .tab").on("click","li",function(){
		$(this).addClass("active").siblings().removeClass("active");
		var f = $(this).attr("for");
		$("."+f).show().siblings().hide();
	});
	
	/**
	 * 检查图片大小
	 */
	function checkImgSize(value, element){
		if(value=="") return true;
		var browserCfg = {};
		var ua = window.navigator.userAgent;
		if (ua.indexOf("MSIE")>=1){
			browserCfg.ie = true;
		}else if(ua.indexOf("Firefox")>=1){
			browserCfg.firefox = true;
		}else if(ua.indexOf("Chrome")>=1){
			browserCfg.chrome = true;
		}
		var filesize = 0;
		if(browserCfg.firefox || browserCfg.chrome ){
			filesize = element.files[0].size;
		}else if(browserCfg.ie){
			var obj_img = document.getElementById('imghead');
			obj_img.dynsrc=element.value;
			filesize = obj_img.fileSize;
		}else{
			return false;
		}
		if(filesize==-1){
			return false;
		}else if(filesize>200*1024){
			return false;
		}else{
			return true;
		}
		
	}
	
	/* 检查图片格式 */
	function checkImgType(value, element) {
		var str = value.substr(value.lastIndexOf(".")).toLowerCase();
		return /.(png|jpg)$/.test(str);
	}
	
	$.ajax({
	    url: "${ctx}/resourceLibrary/getResourceListByType.htm?type=2",
	    success: function (text) {
	    	$(".pic-container").children().remove();
	    	text = JSON.parse(text);
	      	if(text.total>0){
	      		var d = text.rows;
	      		$.each(d,function(i,item){
	      			var img = new Image();
	      			img.src = item.content;
	      			var w = img.width, h = img.height;
	      			var max_width = 140,max_height = 140;
	      			var width=0,mt=0; //css中定义的父级div
	      			if(w>=h){
	      				width = max_width + "px";
	      				var height = max_height*h/w;
	      				mt = Math.round((max_height - height)/2) + "px"; //垂直居中
	      			}else{
	      				width = Math.round(max_width*w/h)+"px"
	      			}
	      			
	      			
	      			var tmp = '<img src="'+ item.content +'" style="width:'+ width +';margin-top: '+ mt +';"/>';
	      			
	      			
	      			
	      			
	      			var imgDiv = $('<div class="img-box">'
			    			+'	<div class="checkBox"></div>'
			    			+tmp
			    			+'</div>');
		    		$(".pic-container").append(imgDiv);
	      		});
	      		
	      	}else{
	      		$(".pic-container").append("<p>暂无数据.</p>")
	      	}
	    },
		error: function () {
	  		$(".pic-container").append("<p>发生了未知错误，请检查网络是否正常连接.</p>")
		}
	});
	
	$(".pic-container").on("click",".img-box",function(e){
		var $cb = $(this).find(".checkBox");
		if($cb.hasClass("active")){
			$cb.removeClass("active");
			$(this).removeClass("active"); //um插件获取选中图片需要属性
		}else{
			if(!checkPicNum())return;
			$cb.addClass("active");
			$(this).addClass("active");
			var pics = [];
			$(".pic-container .img-box.active").each(function(i,item){
				var src = $(item).find("img").attr("src");
				var pic = {};
				pic.url = src;
				pics.push(pic);
			});
			
			if(pics.length>0){
				$("#libraryPicsInput").val(JSON.stringify(pics));
			}
			
		}
	});
	
	/**
	 * 点击删除图片
	 */
	$("#preview").on("click",".close",function(){
		clearInput($(this).parent().next('input[type=file]'));
		$(this).parent().remove();
	});
	
	function checkPicNum(){
		var pc = $("#preview").find("img").size();
		var pc2 = $(".pic-container").find(".img-box.active").size();
		
		if(pc+pc2==3){
			bootstrapQ.msg({
	        	msg: '图片最多选择三张。',
	        	type: 'danger',
	        	time: 2000
	        });
			return false;
		}else{
			return true;
		}
	}
	
	function choosePicture(){
		if(!checkPicNum())return;
		var $imgs = $("#preview").find("img");
		var icnt = $imgs.size();
		var $btns = $("#preview").find("input[type=file]");
		$btns.eq(icnt).click();
	}
	
	function clearInput(file){
		file = $(file);
		file.after(file.clone().val(""));      
		file.remove();  
	}
	
	//图片上传预览    IE是用了滤镜。
	function previewImage(file)
	{
	  if(!checkImgType($(file).val())){
		  alert("上传图片仅支持jpg和png格式");
		  	clearInput($(file));
		  	return;
	  }
	  
	  
	  
	  var MAXWIDTH  = 80; 
	  var MAXHEIGHT = 80;
	  var div = document.getElementById('preview');
	  
	  if (file.files && file.files[0])
	  {

	      /* div.innerHTML ='<img id=imghead>';
	      var img = document.getElementById('imghead'); */
	      var $p = $("<div class='relative fl'></div>");
	      var $img = $("<img/><i class='glyphicon glyphicon-remove close'></i>");
	      $p.append($img);
	      var img = $img[0];
	      $(file).before($p);
	      img.onload = function(){
	        var rect = clacImgZoomParam(MAXWIDTH, MAXHEIGHT, 80,80);
	        img.width  =  80;
	        img.height =  80;
//	         img.style.marginLeft = rect.left+'px';
	        img.style.marginTop = rect.top+'px';
	      }
	      var reader = new FileReader();
	      reader.onload = function(evt){img.src = evt.target.result;}
	      reader.readAsDataURL(file.files[0]);
	  }
	  else //兼容IE
	  {
	    var sFilter='filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale,src="';
	    file.select();
	    var src = document.selection.createRange().text;
	    div.innerHTML = '<img id=imghead class="damFront">';
	    var img = document.getElementById('imghead');
	    img.filters.item('DXImageTransform.Microsoft.AlphaImageLoader').src = src;
	    var rect = clacImgZoomParam(MAXWIDTH, MAXHEIGHT, img.offsetWidth, img.offsetHeight);
	    status =('rect:'+rect.top+','+rect.left+','+rect.width+','+rect.height);
	    div.innerHTML = "<div id=divhead style='width:"+rect.width+"px;height:"+rect.height+"px;margin-top:"+rect.top+"px;"+sFilter+src+"\"'></div>";
	  }
	}
	function clacImgZoomParam( maxWidth, maxHeight, width, height ){
	    var param = {top:0, left:0, width:width, height:height};
	    if( width>maxWidth || height>maxHeight )
	    {
	        rateWidth = maxWidth;
	        rateHeight = maxHeight;
	        
	        if( rateWidth > rateHeight )
	        {
	            param.width =  maxWidth;
	            param.height = rateHeight;
	        }else
	        {
	            param.width = maxWidth;
	            param.height = maxHeight;
	        }
	    }
	    
	    param.left = Math.round((maxWidth - param.width) / 2);
	    param.top = Math.round((maxHeight - param.height) / 2);
	    return param;
	}
	
	
	
	 function convertCanvasToImage(canvas) {
			var image = new Image();
			image.src = canvas.toDataURL("image/jpeg");
			return image;
	}
</script>	
</body>
</html>