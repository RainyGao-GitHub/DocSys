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
		<title>设置账户-自由团队-IT产品开发外包平台</title>
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
		<script src="<%=basePath%>webPages/js/md5.js"></script>
		<script src="<%=basePath%>/webPages/js/qiao.js"></script>
		<style type="text/css">
			.p8{padding: 8px;}.m3{margin: 3px;}
			.text-warning{text-align: center;}
			.tooltip-inner {background-color: #D9534F;}.tooltip.top .tooltip-arrow {left: 0px;border-top-color: #D9534F;}
			.form-control-feedback{margin-top: 2px;margin-right: 10px;}
			td{color: #505050 !important;}
			.p5_20{padding: 5px 20px;}
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
					<span style="width: 180px;font-size: 24px;font-weight: bold;font-family: '宋体';margin: 10px 0px;display: inline-block;">账户设置</span>
					<div style="display: inline-block;float: right;padding: 10px;">
						<a href="test.do">返回主页</a>
					</div>
					<div style="display: inline-block;float: right;padding: 10px;">
						<a href="pageTo.do?p=myHostPage&tohref=myAccount">返回我的账户</a>
					</div>
				
				</div>
			</div>
		</div>
		<div style="height: 65px;"></div>
		<div id="wrapper" style="height: 90%;">
			<div class="row" style="background: white;height: 100%;">
				
				
				<div class="col-xs-8 col-xs-push-2 mt50">
					<table id="acc_table" class="table text-center pinfo table-striped table-bordered">
	  					<tr align="right">
	  						<td colspan="6" style="text-align: right;">
	  							<a href="javascript:void(0)" onclick="add()" class="btn btn-default btn-sm"><span class="glyphicon glyphicon-plus"></span>&nbsp;添加</a>
						  		<a href="javascript:void(0)" onclick="update()" class="btn btn-default  btn-sm"><span class="glyphicon glyphicon-pencil"></span>&nbsp;修改</a>
						  		<a href="javascript:void(0)" onclick="removeData()" class="btn btn-default  btn-sm"><span class="glyphicon glyphicon-minus"></span>&nbsp;删除</a>
	  						</td>
	  					</tr>
			  			<tr class="text-center th">
			  				<td><input type="checkbox" onchange="setAllChecked(this,'acc_table')" /></td>
			  				<td>账号</td>
			  				<td>账户类型</td>
			  				<td>用户名</td>
			  				<td>默认账号</td>
			  				<td>操作</td>
			  			</tr>
			  			<tr>
			  				<td colspan="6">暂无数据，请添加账户信息</td>
			  			</tr>
			  		</table>
			  		
			  		<div class="row hidden" id="accountContent">
			  			<form id="accountForm" action="account/saveAccount.do" method="post">
			  				<input type="hidden" name="id" id="accountId"/>
			  				<div class="form-group clearfix">
				  				<label class="col-xs-3 p5_20" for="type">账户类型：</label>
				  				<div class="col-xs-9">
				  					<select class="form-control" id="cardType" name="type">
				  						<option value="1">支付宝</option>
				  						<!-- <option value="2">银行卡</option>
				  						<option value="3">微信</option> -->
				  					</select>
				  				</div>
				  			</div>
				  			<div class="form-group clearfix">
				  				<label class="col-xs-3 p5_20" for="account">账号：</label>
				  				<div class="col-xs-9">
				  					<input type="text" class="form-control" id="accountNo" name="accountNo"/>
				  				</div>
				  			</div>
				  			<div class="form-group clearfix">
				  				<label class="col-xs-3 p5_20" for="accountName">用户名：</label>
				  				<div class="col-xs-9">
				  					<input type="hidden" class="form-control" id="hidAccountName" name="accountName"/>
				  					<input id="accountName" type="text" class="form-control" disabled="disabled"/>
				  				</div>
				  			</div>
				  			<input type="reset" id="resetAccount" class="hidden"/>
			  			</form>
			  		</div>
				
				</div>
			</div>
			
		
		    <div style="position: fixed;bottom: 0px;width:100%" class="clearfix">
		    	
		    	<div class="container">
					<div class="footer-bottom">
						<hr/>
						<p>© 2014 - 2016 gofreeteam.com. 杭州圆图网络技术有限公司版权所有</p>
						<p><a href="http://www.miibeian.gov.cn/" target="_blank">浙ICP备15034351号-1</a></p>
						<p>
					 		<a target="_blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010502002048" style="display:inline-block;text-decoration:none;height:20px;line-height:20px;"><img src="<%=basePath%>webPages/images/beian.png" style="float:left;"/><span style="float:left;height:20px;line-height:20px;margin: 0px 0px 0px 5px; color:#939393;">浙公网安备 33010502002048号</span></a>
					 	</p>
					</div>
				</div>
		    </div>
		    
		</div>
		
		
	</body>
	
	<script type="text/javascript">
		$(function(){
			createDialog("accountDialog","设置账户","accountContent");
			initPage();
		});
		
		function initPage(){
			var callback = function(data){
				var cardType = ['支付宝','银行卡','微信'];
				$("#acc_table tr:gt(1)").remove();
				if(data.msgNo == '1'){
					var html = "";
					$.each(data.obj,function(i,item){
						
						var option = "";
						if(item.isDefault=='1'){
							option = "	<td><a style='color: green'>默认账户</a></td>"
						}else{
							option = "	<td><a onclick='setDefault("+item.id+")'>设为默认账户</a></td>";
						}
						
						html += "<tr>"
							+"	<td><input type='checkbox' class='acc_cb' value='"+item.id+"'/></td>"
							+"	<td>"+item.accountNo+"</td>"
							+"	<td>"+cardType[item.type-1]+"</td>"
							+"	<td>"+item.accountName+"</td>"
							+"	<td>"+(item.isDefault=='1'?'是':'否')+"</td>"
							+option
							+"</tr>";
					});
					$("#acc_table tbody").append(html);
				}
				
			}
			$.post("account/findListByUserId.do",null,callback,"json");
		}
		
		function goAuthpageConfirm(){
			bootstrapQ.confirm({
				title: "提示",
				msg: "请先完成用户认证，去认证？",
				okbtn : "确定",
				qubtn : "取消"
			},function(){
				window.location.href = "pageTo.do?p=myHostPage&tohref=yhrz";
			});
		}
		
		function add(){
			$.post("idCard/getIdCardByUserId.do",null,function(data){
				if(data.msgNo=='1'){
					var d = data.obj;
					if(!d||d.status!='1'){
						goAuthpageConfirm();
					}else{
						reset();
						$("#accountName").val(d.name);
						$("#hidAccountName").val(d.name);
						$("#accountContent").removeClass("hidden");
						$("#accountDialog").modal("show");
					}
				}else{
					bootstrapQ.msg({
						msg: '当前网络错误，请重试！',
						type: 'danger',
						time: 2000
					})
				}
				
			},"json");
			
		}
		
		function update(){
			reset();
			$("#accountContent").removeClass("hidden");
			
			var cb = $(".acc_cb:checked");
			if(cb.size()==0){
				bootstrapQ.alert("请选中要修改的账号。");
			}else if(cb.size()>1){
				bootstrapQ.alert("修改时只能选中其中一行。");
			}else{
				var id = $(cb).attr("value");
				var callback = function(data){
					if(data.msgNo=='1'){
						var d = data.obj;
						$("#cardType").val(d.type);
						$("#accountNo").val(d.accountNo);
						$("#accountName").val(d.accountName);
						$("#hidAccountName").val(d.accountName);
						$("#accountId").val(d.id);
						
						$("#accountDialog").modal("show");
					}else{
						bootstrapQ.msg({
							msg: '查询账号信息失败！',
							type: 'danger',
							time: 2000
						});
					}
				}
				
				
				$.post("account/findById.do",{id: id},callback,"json");
				
			}
		}
		
		function removeData(){
			var cb = $(".acc_cb:checked");
			if(cb.size()==0){
				bootstrapQ.alert("请选中要删除的账号。");
			}else{
				bootstrapQ.confirm("确定要删除选中的账号？", function(){
					var ids = $.map(cb,function(item){
						return $(item).attr("value");
					});
					$.post("account/remveAccounts.do?ids="+ids,null,function(data){
						if(data.msgNo=='1'){
							bootstrapQ.msg({
								msg: '删除成功！',
								type: 'success',
								time: 2000
							});
							initPage();
						}else{
							bootstrapQ.msg({
								msg: '删除失败！',
								type: 'danger',
								time: 2000
							});
						}
					},"json");
				})
			}
		}
		
		function setDefault(id){
			$.post("account/setDefault.do?id="+id,null,function(data){
				if(data.msgNo=='1'){
					bootstrapQ.msg({
						msg: '设置成功！',
						type: 'success',
						time: 2000
					});
					initPage();
				}else{
					bootstrapQ.msg({
						msg: '设置失败！',
						type: 'danger',
						time: 2000
					});
				}
			},"json");
		}
		
		var validator = $("#accountForm").validate({
		    rules: {
		   	  accountNo: {
		        required: true,
		        minlength: 4,
		        maxlength: 30
		      },
		      accountName:{
		    	required: true,
		        minlength: 2,
		        maxlength: 15
		      }
		    },
		    messages: {
		      
		    }
		});
		
		function clickButton(){
			if($("#accountForm").valid()){
				$("#accountForm").ajaxSubmit({
					dataType: "json",
					success: function(data){
						bootstrapQ.msg({
							msg: '操作成功！',
							type: 'success',
							time: 2000
						});
						initPage();
						$("#accountDialog").modal("hide");
					},
					error: function(data){
						bootstrapQ.msg({
							msg: '操作失败！',
							type: 'danger',
							time: 2000
						});
					}
				
				});
			}
			
		}
	
		//处理form中的多选框
		function setAllChecked(cb0,formId){
			var cbs = $("#"+formId).find("[type=checkbox]:gt(0)");
			if(cb0.checked){
				for(var i=0;i<cbs.length;i++){
					cbs[i].checked = true;
				}
			}else{
				for(var i=0;i<cbs.length;i++){
					cbs[i].checked = false;
				}
			}
			
		}
		
		function reset(){
			$("#resetAccount").click();
			validator.resetForm();
		}
	</script>

</html>