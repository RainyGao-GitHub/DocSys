<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String ttt = basePath + "webPages/pages/tianTianTou/";
String staticFilesPath = "//static.gofreeteam.com/";
%>
<!DOCTYPE html>
<html>

	<head>
		<meta http-equiv="Content-Type" content="text/html" charset="UTF-8" />
		<meta name="renderer" content="webkit">
		<title>推荐用户-自由团队-IT产品开发外包平台</title>
		<meta name="keywords" content="IT兼职，自由团队" />
		<meta name="description" content="自由团队是一个专业高效的免费创业IT外包服务平台，致力于通过创业IT外包数据服务降低创业者和投资人的综合时间成本、提升整个社会的创业IT外包效率，从而创造新的社会价值！" />
		<meta http-equiv="x-ua-compatible" content="ie=8" />
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/resetV2.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap-theme.min.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.comm.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.custom.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-fonts/css/font-awesome.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath %>webPages/js/select2/css/select2.min.css" />
		<link rel="stylesheet" href="<%=basePath %>webPages/css/qiao.css" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/styleV2.css" type="text/css" media="screen" />
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/messages_zh.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		
		
		<script src="<%=basePath%>/webPages/js/common.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/bxslider/jquery.bxslider.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/vender/swiper.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/controller/index_v2.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/js/js_valicate.js"></script>
		<script type="text/javascript" src="<%=basePath%>webPages/js/common.js"></script>
		<script src="<%=basePath%>webPages/js/md5.js"></script>
		<script src="<%=basePath%>/webPages/js/qiao.js"></script>
		<style type="text/css">
			.p8{padding: 8px;}.m3{margin: 3px;}
			.text-warning{text-align: center;}
			.tooltip-inner {background-color: #D9534F;}.tooltip.top .tooltip-arrow {left: 0px;border-top-color: #D9534F;}
			.form-control-feedback{margin-top: 2px;margin-right: 10px;}
			
			
			.praList>li>span {display: block;padding: 5px;}
			.searchArea {padding: 0px 10px;background-color: white;width: 100%;border-radius: 5px;}
			.fLeft {float: left;}.fRight{float:right}.clear{clear: both;}
			.praList li {display: block;padding: 5px; margin: 0px 2px;}.liActive {background: yellowgreen;border-radius: 5px;}
			.searchLabel li {float: left;}
			.pr5{padding-right: 5px;}
			.country {width: 300px;}
			.country select {margin: 2px 5px;width: 150px;font-size: 12px;height: 26px;color: cornflowerblue;}
			.gotoPage{padding: 4px 12px !important;}.gotoPage>input {height: 24px;}
			.pg_active {color: white !important;font-weight: bold;background: rgb(255,215,68) !important;}
			.eduFont{color:#757991;}
			ul.eduFont{padding-left: 12px;}
			.eduFont li{float: left; margin: 0 5px 10px 5px;border-right: 1px #ddd solid; padding-right: 10px;line-height: 13px;}
		
			#myOption{position:fixed;}
			#_headPic,.imgPreView{border-radius: 10px; padding:5px;}
			.hostUl{text-align: left;}.hostUl li{padding: 5px;}.hostUl li:hover{border-right: darkmagenta 1px solid;}
			.ulActiveGold{color:orange !important;}.ulActiveGold a{color:orange !important;}
			.ulActiveGold i{color:orange !important;}.li_img {color: cornflowerblue;padding: 0px 5px;}
			.settingUl li{padding: 6px 18px;font-size: 12px;}.li_img_success {color: green;}.li_img_error {color: red;}
			.sectionTitleA{width: 100%;text-align: left;}
			.panel-default{ border: none;display: none;}
			.btn-primary{height: 36px;}
			.firstMsg {background: whitesmoke;position: absolute;width: 300px;z-index: 11;}
			.bI-Table{width: 100%;}
			input[type=file]{width: auto;height: auto;opacity: 1;}
			table.bI-Table tr{height: 60px;border-bottom: 1px lightgray soild;}
			table.bI-Table tr td:first-child {padding-left: 50px;}
			.pSetting {margin: 5px 0px;margin-bottom: 100px;padding: 10px;}
			td{color: #505050 !important;}
			.cb{width: 90px;height: 36px;padding: 0px 2px;border-radius: 18px;background: yellowgreen;border: 1px solid white;}
			.redbg{background: indianred;}.graybg{background: gray;}
			.cb-btn{width: 32px;height: 32px;margin: 1px 0px;border-radius: 16px;background: whitesmoke;}
			.cb-text{font-family: '黑体';font-size: 14px;padding: 2px 0px;width: 48px;height: 32px;color: white;text-align: center;}
			.sysMsg{max-height: 400px;overflow-y: scroll;}
			.btn-sm.btn-info{color:white !important;}.btn-sm.btn-danger{color:white !important;}
			
			.userType{clearfix();}
			.userType li{float: left;padding: 5px 50px 5px 0px;}
			.userType li input[type=radio]{vertical-align: top;margin-right: 5px;}
		</style>
	</head>

	<body>
		<input type="hidden" id="basePath" value="//static.gofreeteam.com/"/>
		<jsp:include page="errorInfo.jsp"></jsp:include>
		<div id="header">
			<div class="navbar navbar-default navbar-fixed-top">
				<div class="container-fluid">
					<div class="navbar-header" style="width:220px;">
						<a class="navbar-brand" href="test.do">
							<div style="display: inline-block;float: left;margin-right: 10px;">
								<img class="logo-mini" alt="自由团队" src="<%=basePath%>webPages/images/logo.png">
							</div>
							<div style="display: inline-block;float: right;">
								<span class="">自由团队 </span><br/>
								<small>gofreeteam.com</small>
							</div>
						</a>
					</div>
					<span style="width: 120px;font-size: 24px;font-weight: bold;font-family: '宋体';margin: 10px 0px;display: inline-block;">用户推荐</span>
					<div style="display: inline-block;float: right;padding: 10px;">
						<a href="test.do">返回主页</a>
					</div>
				
				</div>
			</div>
		</div>
		<div style="height: 65px;"></div>
		<div id="wrapper">
		    <div style="background: white;padding-top: 20px;padding-bottom: 150px;">
		    	<div style="margin: 0px auto;width: 60%;min-width: 880px;border: 1px solid #E3E3E3;">
	    		<div id="myInfo" class="panel ">
				  <div class="panel-heading">
				    <h3 class="panel-title"><i class="li_img glyphicon glyphicon-cog"></i>个人资料</h3>
				  </div>
				  <div class="panel-body">
				    <div id="baseInfo" class="pSetting thinBorder">
						<h4>基本资料</h4>
						<div class="p10 pSet-form">
							<form id="recommendForm" action="recommend/add.do" method="post" enctype="multipart/form-data">
								<table class="form-group bI-Table">
									<tr style="height: 220px;border-top:1px lightgrey solid;">
										<td style="width: 30%;"><label for="headPic">LOGO</label></td>
										<td style="width: 60%;">
											<input id="headPic" name="headPic" type="file" class="fLeft" onchange="setImage(this,'imgDiv','imgPreView')" style="margin-top: 90px;"/>
											<!-- 预览图片在不同的浏览器下要用不同的代码 ，下面这段代码是要为判断浏览器做准备 -->
											<div id="imgDiv" class="imgDiv" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale);">
											<div class="thinBorder fRight" style="width: 200px;height: 200px;">
												<img id="imgPreView" class="imgPreView" width="200px" height="200px" src="<%=basePath%>webPages/images/${freeteam_user.headImg}" alt="预览" />
											</div>
											<div class="clearfix"></div>
										</td>
										<td style="width: 10%;"></td>
									</tr>
									<tr>
										<td><label>电子邮箱</label></td>
										<td><input type="text"  id="myEmail" class="form-control" name="email"/></td>
										<td></td>
									</tr>
									<tr>
										<td><label>名称</label></td>
										<td><input type="text"  id="nickName" name="realName" class="form-control"/></td>
										<td></td>
									</tr>
									<tr>
										<td><label>所在地</label></td>
										<td id="pca">
											<select id="province" value="500000" name="provinceCode" onchange="queryCity(this);" style="width: 32%;">
												<option value="-1">请选择</option>
											</select>
											<select id="city" name="cityCode" onchange="queryArea(this);"  style="width: 32%;">
												<option value="-1">请选择</option>
											</select>
											<select id="area" name="areaCode" style="width: 32%;">
												<option value="-1">请选择</option>
											</select>
										</td>
										<td></td>
									</tr>
									<tr>
										<td><label>详细地址</label></td>
										<td>
											<input type="text" class="form-control" id="address" name="address" value=""/>
										</td>
										<td></td>
									</tr>
									<tr>
										<td><label>用户类型</label></td>
										<td>
											<ul class="userType">
												<li><input type="radio" name="type" id="userType" value="1"/>个人</li>
												<li><input type="radio" name="type" id="userType" value="2"/>团队</li>
												<li><input type="radio" name="type" id="userType" value="3"/>企业</li>
											</ul>
										</td>
										<td></td>
									</tr>
									
									<tr>
										<td><label>网站
										</label></td>
										<td>
											<input type="text" class="form-control" id="hostUrl" name="hostUrl" value=""/>
										</td>
										<td></td>
									</tr>
									<tr>
										<td><label>联系人</label></td>
										<td>
											<input type="text" class="form-control" id="contact" name="contact" value=""/>
										</td>
										<td></td>
									</tr>
									<tr>
										<td><label>联系电话</label></td>
										<td>
											<input type="text" class="form-control" id="conTel" name="conTel" value=""/>
										</td>
										<td></td>
									</tr>
									<tr>
										<td><label id="wr_creater">创建者</label></td>
										<td>
											<input type="text" class="form-control" id="fddbr" name="fddbr" value=""/>
										</td>
										<td></td>
									</tr>
									<tr>
										<td><label>标签</label></td>
										<td>
											<input type="text" id="keyWord" name="keyWord" placeholder="最多添加五个标签" readonly="readonly" class="form-control" onclick="showTypeLabel()" value=""/>
											<input type="hidden" id="keyWord_ids" name="keyWord_ids" value=""/>
											<div class="type-label" style="display: none;">
												<div class="close-btn fRight">
													<span class="glyphicon glyphicon-remove"></span>
												</div>
											
												<li class="sys-label" style="border-bottom: 1px soild lightgrey">
													<i class="active">PC网站</i>
													<i>安卓APP</i>
													<i>苹果APP</i>
													<i>UI</i>
													<i>硬件设计</i>
													<i>苹果APP</i>
													<i>UI</i>
													<i>硬件设计</i>
												</li>
												
												<li class="user-label">
													<a class="fRight mybtn" style="width: 70px;margin-right: 20px;">
														<span class="glyphicon glyphicon-plus add-label-btn"></span>
														<span class="add-label-btn">自定义</span>
														<div class="add-label-self" style="display: none;">
															<input type="text" maxlength="10" width="80px"/>
															<span class="glyphicon glyphicon-ok add"></span>
														</div>
													</a>
													<i>类型1</i>
													<i>类型2</i>
													<i>类型3</i>
													<i>类型4</i>
													<i>类型5</i>
												</li>
												<div class="text-center">
													<a class="mybtn-primary submit">
														<i class="glyphicon glyphicon-ok"></i>
														<span>确定</span>
													</a>
												</div>
											</div>
										</td>
									</tr>
									
									<tr>
										<td><label id="wr_creater">简介</label></td>
										<td>
											<div align="center">
												<textarea id="user_intro" name="intro" placeholder="请输入简介。最多500字" onkeyup="checkWord(this)" maxlength="500" style="width:100%;height:100px;resize: none;"></textarea>
												<p style="float: right;">已输入<big>0</big>字，还可输入<big>500</big>字</p>
												<div class="clearfix"></div>
											</div>
										</td>
										<td></td>
									</tr>
									
									<tr>
										<td><label id="wr_creater">详细介绍</label></td>
										<td>
											<!-- 加载编辑器的容器 -->
											<script id="detailIntro" name="detailIntro" type="text/plain" style="width:100%;"></script>
											
											<!-- 配置文件 -->
										    <script type="text/javascript" src="webPages/ueditor/ueditor.config.js"></script>
										    <!-- 编辑器源码文件 -->
										    <script type="text/javascript" src="webPages/ueditor/ueditor.all.js"></script>
										    <!-- 实例化编辑器 -->
										    <script type="text/javascript">
										    	
										        var ue = UE.getEditor('detailIntro',{
										        	toolbars: [
													    [ 'source', 'undo', 'redo'],
													    ['bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|', 'fontfamily','fontsize','forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist', 'selectall', 'cleardoc'],
													    ['simpleupload', 'insertimage', 'emotion', 'scrawl', 'insertvideo', 'music', 'map', 'insertcode', 'pagebreak', 'template', 'background', '|']
													],
													maximumWords:1000
										        });
										        
										    </script>
										</td>
										<td></td>
									</tr>
									
									<tr>
										<td colspan="2" style="text-align: center">
											<input type="button" class="btn btn-primary" onclick="submitMyInfo();" value="保存" />
										</td>
										<td></td>
									</tr>
									
								</table>
								<input type="hidden" id="recommenderId" name="recommenderId" value="${freeteam_user.id}"/>
							</form>
						</div>
					</div>
		    	</div>
		    	
		    </div>
		    
		</div>
    	<div class="container">
			<div class="footer-bottom">
				<p>© 2014 - 2016 gofreeteam.com. 杭州圆图网络技术有限公司版权所有</p>
				<p><a href="http://www.miibeian.gov.cn/" target="_blank">浙ICP备15034351号-1</a></p>
				<p>
			 		<a target="_blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010502002048" style="display:inline-block;text-decoration:none;height:20px;line-height:20px;"><img src="<%=basePath%>webPages/images/beian.png" style="float:left;"/><span style="float:left;height:20px;line-height:20px;margin: 0px 0px 0px 5px; color:#939393;">浙公网安备 33010502002048号</span></a>
			 	</p>
			</div>
		</div>
		
		
		<script type="text/javascript">
			
			//keyWords start
			$(".type-label").on("click","i",function(e){
				if($(this).hasClass("active")){
					$(this).removeClass("active");
				}else if($(".type-label").find("i.active").size()<5){
					$(this).addClass("active");
				}
			});

			$(".type-label .submit").on("click",function(e){
				var text = "",ids="";
				var $is = $(".type-label").find("i.active")
				$is.each(function(i,item){
					if($is.size()==i+1){
						text += $(item).text();
						ids += $(item).attr("value");
					}else{
						text += $(item).text()+"、";
						ids += $(item).attr("value") + "、";
					}
				});
				$("#keyWord").val(text);
				$("#keyWord_ids").val(ids);
				$(".type-label").hide();
			})

			$(".add-label-btn").on("click",function(e){
				if($(".add-label-self").css("display")==="none"){
					$(".add-label-self").slideDown("slow");
				}else{
					$(".add-label-self").slideUp("slow");
				}
				
			})

			$(".add-label-self .add").on("click",function(e){
				var $input = $(this).prev();
				var v = $input.val();
				while(v&&v.indexOf("、")>-1){
					v = v.replace("、","");
				}
				if(!v){
					setMsg("danger#不能为空");
					return;
				}else if(v.length>10){
					setMsg("danger#长度最大10位");
					return;
				}
				
				var me = this;
				$.post("keyWords/add.do",{keyWord: v},function(data){
					if(data.msgNo=="1"){
						var i = '<i><span class="glyphicon glyphicon-remove"></span>'+v+'</i>';
						if($(".type-label").find("i.active").size()<5){
							i = '<i class="active" value="'+data.obj+'"><span class="glyphicon glyphicon-remove"></span>'+v+'</i>';
						}
						$(".user-label").append(i);
						$(me).parent().hide();
						$input.val("");//清空输入框
					}
					
					showAjaxMsg(data);
				},"json");
				
				
			})

			function showTypeLabel(){
				if($(".type-label").css("display")==='none'){
					$(".type-label").slideDown("slow");
				}else{
					$(".type-label").slideUp("slow");
				}
				
			}

			$(".close-btn").on("click",function(e){
				$(this).parent().slideUp("slow");
			})

			initBusiSmlType();

			/**
			* new 小类初始化
			*/
			function initBusiSmlType(){
				$(".sys-label").children("i").remove();
				$(".user-label").children("i").remove();
				var callback = function(data){
					var bstList_sys = data.obj.keyWord_sys;
					var bstList_user = data.obj.keyWord_user;
					var sysHtml = "",userHtml = "";
					//关键字部分初始化
					var keyWordIds = $("#keyWord_ids").val();
					var ids = keyWordIds.split("、");
					$.each(bstList_sys,function(i,item){
						sysHtml += '<i value="'+item.id+'" '+(ids.indexOf(item.id+"")>-1?'class="active"':'')+'>'+item.name+'</i>'
					});
					
					$.each(bstList_user,function(i,item){
						userHtml += '<i value="'+item.id+'" '+(ids.indexOf(item.id+"")>-1?'class="active"':'')+'><span class="glyphicon glyphicon-remove"></span>'+item.name+'</i>'
					});
					
					$(".sys-label").append(sysHtml);
					$(".user-label").append(userHtml);
					
				}
				$.post("keyWords/getProjectKeyWords.do",null,callback,"json");
			};

			$("li.user-label ").on("mouseover","i",function(){
				$(this).find(".glyphicon-remove").show();
			}).on("mouseout","i",function(){
				$(this).find(".glyphicon-remove").hide();
			})

			$(".type-label .user-label").on("click",".glyphicon-remove",function(){
				var id = $(this).parent().attr("value");
				var callback = function(data){
					showAjaxMsg(data);
					initBusiSmlType();
				}
				
				$.post("keyWords/delete.do",{id: id},callback,"json");
			});
			//keyWords end
			
			//userType start
			$("ul.userType").on("mouseup","li",function(){
				$(this).children("input[type=radio]").click();
			});
			//end
			
			pcaId = "pca";
			queryProvince();
			
			$("#recommendForm").validate({
				rules: {
					email: {
						required: true
					}
				},
				messages: {
					
				}
			})
			function submitMyInfo(){
				var form = $("#recommendForm");
				if(form.valid()){
					var options = {
				        success: function (data) {
				        	bootstrapQ.msg({
				        		msg: '推荐成功！',
				        		type: 'success',
				        		time: 2000
				        	});
				        },
				        error: function(){
				        	bootstrapQ.msg({
				        		msg: '发生了未知的网络错误，推荐失败！',
				        		type: 'danger',
				        		time: 2000
				        	});
				        }
				        
				    };
					form.ajaxSubmit(options);
				}
			}
		</script>
	</body>

</html>