<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%
String officeEditorApi = BaseController.getOfficeEditor(request);
Integer officeEditorType = BaseController.getOfficeEditorType();
Boolean isBussienss = BaseController.isBussienss();
%>

<div id="officePlayer" class="officePlayer" style="width: 100%; height: 1000px;">
	<div id="placeholder"></div>
</div>
<script type="text/javascript" src="<%=officeEditorApi%>"></script>
<script type="text/javascript" src=js/OfficeEditor.js></script>
<script type="text/javascript">
	var officeEditorType = <%=officeEditorType%>;
	var height =  window.screen.height;
	console.log("window height=" + height)
	height *= 0.95;
	console.log("dialog height=" + height)
	document.getElementById('officePlayer').style.height = height + "px";
</script>