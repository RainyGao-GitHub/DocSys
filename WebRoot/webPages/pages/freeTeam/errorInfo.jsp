<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>

<style type="text/css">
	.errorArea{
		position:fixed;
		top:60px;
		width:60%;
		margin-left:20%;
		z-index:9
	}
</style>
<div class="errorArea">
	<div id="success_msg" class="alert alert-success" align="center" role="alert" style="display:none;"></div>
	<div id="info_msg" class="alert alert-info" align="center" role="alert" style="display:none;"></div>
	<div id="warning_msg" class="alert alert-warning" align="center" role="alert" style="display:none;"></div>
	<div id="danger_msg" class="alert alert-danger" align="center" role="alert" style="display:none;"></div>
</div>
<input type="hidden" id="my_msgNo" value="${message.msgNo}"/>
<input type="hidden" id="my_msgInfo" value="${message.msgInfo}"/>
<input type="hidden" id="my_msg" value="${message.obj}" />

<script type="text/javaScript">
	/**
	 * 设置错误信息
	 */
	function setMsg(_msg){
		if($("#my_msgInfo").val()=='errEmailNotVerified'){
			bootstrapQ.confirm("您的邮箱未验证无法登陆，是否重新发送验证邮件？", function(){
				$.post("sendVerfiEmail.do",{isAjax:true},function(data){
					if(data&&data.msgNo=='1'){
						bootstrapQ.msg({
							msg: '验证邮件已发送至您的邮箱，请及时验证。',
							type: 'success',
							time: 2000
						});
					}else{
						bootstrapQ.msg({
							msg: '发送验证邮件失败，请重试！',
							type: 'danger',
							time: 2000
						});
					}
				},'json');
				return true;
			});
			return;
		}
		var msg = $("#my_msg").val();
		var msg_no = $("#my_msgNo").val();
		if(msg_no=='-9'){
			bootstrapQ.alert({
				msg: "您未登录系统，请先<a onclick='javascript: showLoginPanel();'>登录</a>！",
				foot: false
			});
		}
		msg = _msg?_msg:msg;
		if(msg){
			var msg2 = msg.split('#');
			var level = msg2[0];
			var msgBody = msg2[1];
			if(level=="success"){
				document.getElementById("success_msg").innerHTML = msgBody;
				$("#success_msg").show();
				$("#success_msg").fadeOut(5000);
			}else if(level=="info"){
				document.getElementById("info_msg").innerHTML = msgBody;
				$("#info_msg").show();
				$("#info_msg").fadeOut(5000);
			}else if(level=="warning"){
				document.getElementById("warning_msg").innerHTML = msgBody;
				$("#warning_msg").show();
				$("#warning_msg").fadeOut(5000);
			}else if(level=="danger"){
				document.getElementById("danger_msg").innerHTML = msgBody;
				$("#danger_msg").show();
				$("#danger_msg").fadeOut(5000);
			}
		}
	}
	
	function showAjaxMsg(rt){
		$("#my_msg").val(rt.obj);
		setMsg();
	}
	
	setMsg();
</script>