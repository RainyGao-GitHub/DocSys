<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String staticFilesPath = "//static.gofreeteam.com/";
%>

<script type="text/javascript">
	$(function(){
		createDialog("dia_joinPrj","申请服务>>添加留言","join_msgDiv");
	})
	
	function showJoinPrjMsg(text){
		changeDiaTitle("dia_joinPrj","加入项目>>添加留言");
		$("#join_msg").attr("placeholder","请添加给项目创建者的留言，100字以内。");
		$("#join_job_input").val(text);
		$("#join_job_label").text(text);
		showDialogFooter("dia_joinPrj");
	}
	
	function showJoinSerMsg(text){
		changeDiaTitle("dia_joinPrj","申请服务>>添加留言");
		$("#join_msg").attr("placeholder","请添加给服务创建者的留言，100字以内。");
		$("#join_job_input").val(text);
		$("#join_job_label").text(text);
		showDialogFooter("dia_joinPrj");
	}
	
	function joinService(id){
		showJoinSerMsg("");
		
		$("#joinPrj_projectId").val(id);
		$('#dia_joinPrj').modal('show');
	}
	
	function cbPrj(id){
		showJoinPrjMsg("");
		$("#joinPrj_projectId").val(id);
		$('#dia_joinPrj').modal('show');
	}
</script>

<div id="join_msgDiv">
	<form id="joinPrj_form" action="addRelation.do" method="post">
		<input type="hidden" id="joinPrj_projectId" name="proId" value="" />
		<input type="hidden" id="join_job_input" name="job" value="" />
		<textarea id="join_msg" name="msg" placeholder="请添加给服务创建者的留言，100字以内。" class="form-control" maxlength="100"></textarea>
	</form>
</div>