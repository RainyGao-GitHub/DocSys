<%@ page language="java"  import="com.DocSystem.controller.*" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%
String officeEditorApi = BaseController.getOfficeEditor(request);
Boolean isBussienss = BaseController.isBussienss();
%>

<script src="static/scripts/jquery.min.js"></script>
<script type="text/javascript" src="js/common.js"></script>
<script type="text/javascript" src="js/base64.js"></script>
<script type="text/javascript" src="js/DocSys.js"></script>
<script type="text/javascript" src="<%=officeEditorApi%>"></script>
<script type="text/javascript" src=js/OfficeEditor.js></script>    
<div id="placeholder" style="height: 100%"></div>
<script type="text/javascript">
    $(document).ready(function() {
    	OfficeEditor.initForArtDialog();
    });
</script>