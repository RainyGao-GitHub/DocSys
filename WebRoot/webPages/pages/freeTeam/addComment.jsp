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
	<title>添加评论-自由团队-IT产品开发外包平台</title>
	<meta name="keywords" content="IT兼职，自由团队" />
	<meta name="description" content="自由团队是一个专业高效的免费创业IT外包服务平台，致力于通过创业IT外包数据服务降低创业者和投资人的综合时间成本、提升整个社会的创业IT外包效率，从而创造新的社会价值！" />
	<meta http-equiv="x-ua-compatible" content="ie=8" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="shortcut icon" type="image/x-icon" href="/favicon.ico" />
	<!--common.js功能：
		1.计算文本域可输入字数；2.页面上的浮动DIV；3.获取当前窗口大小，滚动条等坐标
		4.鼠标经过图片将图片放大。
	-->
	<!-- jquery-1.11.1 -->
	<!-- bootstrap3.0 js and css -->
	<script type="text/javascript" src="<%=basePath%>/webPages/js/qiao.js"></script>
	<script type="text/javascript" src="<%=basePath%>/webPages/js/web.js"></script>
	<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/messages_zh.js"></script>
	
	<!-- 这个里面修复了发送中文是乱码的问题 -->
	<script src="<%=basePath%>webPages/js/jquery.form.js"></script>
</head>
<body>
	<form id="commentForm" action="comment/addComment.do" method="post">
		<div id="hidData">
			<!-- 0项目 1服务 2用户 -->
			<input type="hidden" name="cType" value="${type}"/>
			<input type="hidden" name="toId" value="${toId}"/>
			<input type="hidden" name="isReply" value="${isReply}"/>
			<input type="hidden" name="score" id="score" value="5"/>
		</div>
		
		<div id="comment_area" class="p10 thinBorder mb10" style="border-bottom-color: green;" align="center;display:none;">
			<div>
				<div>
					<!-- 默认好评 -->
					<input type="hidden" id="stars" name="level" value="5"/>
					<c:if test="${type eq 0}"><h5 style="color:#A3A3A3">选择下对这个项目的评价吧</h5></c:if>
					<c:if test="${type eq 1}"><h5 style="color:#A3A3A3">您的好评是服务方最大的鼓励哦</h5></c:if>
					<c:if test="${type eq 2}"><h5 style="color:#A3A3A3">请选择对用户的评价哦</h5></c:if>
					<div style="font-weight: bold;" class="redStar fLeft">请选择星级：</div>
		  			<div id="levStar" style="width: 140px;" class="starDiv whiteStar fLeft">
			  			<span class="glyphicon glyphicon-star" value="1"></span>
				  		<span class="glyphicon glyphicon-star" value="2"></span>
				  		<span class="glyphicon glyphicon-star" value="3"></span>
				  		<span class="glyphicon glyphicon-star" value="4"></span>
				  		<span class="glyphicon glyphicon-star" value="5"></span>
			  		</div>
			  		<div style="width: 50px;" class="fLeft">
			  			<span id="level" style="font-weight: bold;" class="redStar"></span>
			  		</div>
			  		<div class="clear"></div>
		  		</div>
			</div>
			
			<c:if test="${type eq 0}"><h5 style="color:#A3A3A3"><h5 style="color:#A3A3A3">说说您对这个项目的看法吧。最多500字</h5></h5></c:if>
			<c:if test="${type eq 1}"><h5 style="color:#A3A3A3"><h5 style="color:#A3A3A3">说说您对这个服务的看法吧。最多500字</h5></h5></c:if>
			<c:if test="${type eq 2}"><h5 style="color:#A3A3A3"><h5 style="color:#A3A3A3">说说您对这个资源的看法吧。最多500字</h5></h5></c:if>
			
			<div class="form-group">
				<!-- <input type="text" placeholder="添加我的评论" class="form-control" id="comment_msg" /> -->
				<textarea class="form-control" resizeable="false" name="content" placeholder="添加我的评论" required="required"  rows="5" maxlength="500"></textarea>
			</div>
			<!-- <div style="width:15%" class="fLeft">
				<a href="javaScript:void(0)" onclick="addComment();" class="mybtn-primary">发表</a>
			</div> -->
			<div class="clear"></div>
		</div>
	</form>
	
	<script type="text/javascript">
		// alert
		qiao.on('#alert1', 'click', function(){
			qiao.bs.dialog({
				url : 'pageTo.do?p=addComment',
			    title : '添加评论',
			    callback: function(){
			        $('#todonatea').text('点击确定按钮会再弹出一个modal（confirm）框~').attr('href','javascript:void(0);');
			    }
			}, function(){
			    qiao.bs.confirm({
			        id: 'bsconfirm',
			        msg: '带回调确认框！'
			    },function(){
			        alert('点击了确定！');
			    },function(){
			        alert('点击了取消！');
			    });
			});
		});
		
		$("#levStar>.glyphicon-star").bind("mouseover",function(e){
			var p = $(this).parent();
			var level = $(this).attr("value");
			setLevel(level);
			var c = $(p).children();
			$(c).each(function(i,item){
				$(item).removeClass("redStar").removeClass("whiteStar").addClass("whiteStar");
			})
			for(var i = 1;i<=parseInt(level);i++){
				var tmp = $(p).find("span[value="+i+"]");
				$(tmp).removeClass("redStar").removeClass("whiteStar").addClass("redStar");
			}
			$("#stars").val($("#levStar .redStar").size());
			$("#score").val($("#levStar .redStar").size());
		});
		
		function setLevel(level){
			var l = parseInt(level);
			switch (l){
				case 1:
					$("#level").text("差评");
					break;
				case 2:
					$("#level").text("一般");
					break;
				case 3:
					$("#level").text("中评");
					break;
				case 4:
					$("#level").text("较好");
					break;
				case 5:
					$("#level").text("好评");
					break;
				default:
					$("#level").text("");
					break;
			}
		}
		
		function addComment(){
			
		}
	</script>
</body>

</html>