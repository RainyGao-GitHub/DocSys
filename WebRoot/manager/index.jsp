<%@ page language="java" import="java.util.*" pageEncoding="ISO-8859-1"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
%>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
  <head>
    <base href="<%=basePath%>">
    
    <title>My JSP 'index.jsp' starting page</title>
	<meta http-equiv="pragma" content="no-cache">
	<meta http-equiv="cache-control" content="no-cache">
	<meta http-equiv="expires" content="0">    
	<meta http-equiv="keywords" content="keyword1,keyword2,keyword3">
	<meta http-equiv="description" content="This is my page">
	<!--
	<link rel="stylesheet" type="text/css" href="styles.css">
	-->
  </head>
  
  <body>
    This is my JSP page. <br>
  </body>
  <script language="javascript" type="text/javascript"> 
	  var langType = "ch";
	  function getBrowserLang() 
	  {
	  	var language = "ch";
	
	  	var userLanguage = getCookie("UserLanguage");
	  	if(userLanguage == undefined || userLanguage == "")
	  	{
	  		language = navigator.language;
	  		console.log("getBrowserLang() navigator.language:" + language);		
	  	}
	  	else
	  	{
	  		language = userLanguage;
	  		console.log("getBrowserLang() userLanguage:" + language);				
	  	}
	  	
	  	if(language == undefined)
	  	{
	  		return "ch";
	  	}
	  	
	  	switch(language.toLowerCase())
	  	{
	  	case "us":
	  	case "en":
	  	case "en_us":
	  		return "en";
	      case "zh-tw":
	      case "zh-hk":
	      case "zh-cn":
	      	return "ch";
	      default:
	          break;
	  	}
	  	return "ch";
	  }
	
	  function getCookie(c_name){
	  	//判断document.cookie对象里面是否存有cookie
	  	if (document.cookie.length <= 0)
	  	{
	  		return "";
	  	}
	    	
	  	var c_start = document.cookie.indexOf(c_name + "=");
	  	//如果document.cookie对象里面有cookie则查找是否有指定的cookie，如果有则返回指定的cookie值，如果没有则返回空字符串
	    	if (c_start!=-1)
	    	{ 
	      	c_start = c_start + c_name.length + 1; 
	      	c_end = document.cookie.indexOf(";",c_start);
	      	if (c_end==-1)
	      	{
	      		c_end=document.cookie.length;
	    		}
	      	return unescape(document.cookie.substring(c_start,c_end))
	     	}
	  	return ""
	  }
	  
	  var langType = getBrowserLang();
	  var langExt = "_" + langType;
	  window.location.href='/DocSystem/manager/login' + langExt + '.html';
</script>
</html>
