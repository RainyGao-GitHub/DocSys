<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
String staticFilesPath = "//static.gofreeteam.com/";
%>
<div id="footer">
	<div class="container">
		<ul class="footer-top">
			<!-- <li class="col-xs-1" style="width:400px;">
				<dl>
					<dt>IT产品开发外包平台</dt>
					<dd><em class="important">10,050</em> 个技术服务人员</dd>
					<dd><em class="important">2,102</em> 个技术服务团队</dd>
					<dd><em class="important">1,102</em> 个技术服务企业</dd>
					<dd><em class="important">130,000</em> IT开发项目</dd>
				</dl>
			</li> -->
			<li class="col-xs-3 text-center">
				<dl>
					<dt class="color-83">关于</dt>
					<dd><a href="pageTo.do?p=webPages/pages/freeTeam/contactUs.jsp#about">关于我们</a></dd>
					<dd><a href="pageTo.do?p=webPages/pages/freeTeamcontactUs.jsp#useAgreement">使用协议</a></dd>
					<dd><a href="pageTo.do?p=webPages/pages/freeTeamcontactUs.jsp#contact">联系我们</a></dd>
				</dl>
			</li>
			
			<li class="col-xs-2 text-center" >
				<dl>
					<dt class="color-83">支持</dt>
					<dd><a onclick="suggest();">建议与反馈</a></dd>
				</dl>
			</li>
			<li class="col-xs-4"></li>
			<!-- <li class="col-4 text-center">
				<dl>
					<dt><span class="weixin"></span></dt>
					<dd>自由团队官方微信
						<br>evervc</dd>
				</dl>
			</li> -->
			<li class="col-xs-3 text-center" style="border-left: 1px lightgrey solid;">
				<dl>
					<dd class="color-83">手机客户端</dd>
					<dt>
						<a href="http://static.gofreeteam.com/FreeTeamApp.apk" class="mobi">
							<img src="<%=basePath%>/webPages/images/android.png" width="120px" height="120px"/>
						</a>
					</dt>
					
				</dl>
			</li>
			<!-- <li class="col-6">
				<dl>
					<dt>提交BP</dt>
					<dd>请将商业计划书发送至：</dd>
					<dd><a href="mailto:bp@gofreeteam.com">bp@gofreeteam.com</a></dd>
				</dl>
			</li>
			<li class="col-6 text-right">
				<dl>
					<dt>商务合作</dt>
					<dd>商务合作微信：1764085</dd>
					<dd>客服微信：ever_vc</dd>
				</dl>
			</li> -->
		</ul>
		<div class="footer-bottom">
			<p>© 2014 - 2016 gofreeteam.com. 杭州圆图网络技术有限公司版权所有</p>
			<p><a href="http://www.miibeian.gov.cn/" target="_blank">浙ICP备15034351号-1</a></p>
			<p>
		 		<a target="_blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=33010502002048" style="display:inline-block;text-decoration:none;height:20px;line-height:20px;"><img src="<%=basePath%>webPages/images/beian.png" style="float:left;"/><span style="float:left;height:20px;line-height:20px;margin: 0px 0px 0px 5px; color:#939393;">浙公网安备 33010502002048号</span></a>
		 	</p>
		</div>
	</div>
</div>
<script type="text/javascript">


function suggest(){
	bootstrapQ.dialog({
		url: 'pageTo.do?p=suggest',
		title: '建议与反馈',
		msg: "正在加载中...",
		close : true,
		btn : true,
		qubtn : "取消"
		
	},function(){
		var $suggestForm = $("#suggestForm");
		if($suggestForm.valid()){
			$("#suggestForm").ajaxSubmit({
				dataType: "json",
				success: function(data){
					if(data.msgNo=='1'){
						bootstrapQ.msg({
							msg: "您的反馈已提交成功,感谢您的建议！",
							type: "success",
							time: 2000
						});
						return true;
						
					}else{
						bootstrapQ.msg({
							msg: "您的反馈提交失败,请稍后重试！",
							type: "danger",
							time: 2000
						});
						return false;
					}
					
				}
			});
		};
	})
}
</script>