<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ page language="java" import="java.util.*" pageEncoding="UTF-8"%>
<%
String path = request.getContextPath();
String basePath = request.getScheme()+"://"+request.getServerName()+":"+request.getServerPort()+path+"/";
%>

<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="renderer" content="webkit">
		<title>新建服务</title>
		<script src="webPages/js/jquery-1.9.1.min.js"></script>
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/styleV2.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/resetV2.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap-theme.min.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.comm.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-css/bootstrap.custom.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="<%=basePath%>webPages/pages/tianTianTou/css/boot-fonts/css/font-awesome.css" type="text/css" media="screen" />
		<link rel="stylesheet" href="webPages/js/select2/css/select2.min.css" />
		<link rel="stylesheet" href="<%=basePath %>webPages/css/commonCss.css" />
		<link rel="stylesheet" href="<%=basePath %>webPages/css/style.css" />
		
		
		<script src="webPages/js/common.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery-1.11.1.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/css/boot-js/bootstrap.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.validate.min.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.form.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/jquery.cookie.js"></script>
		<script src="<%=basePath%>webPages/pages/tianTianTou/js/jquery/evervc/jquery.loginPanel.js"></script>
		<script type="text/javascript" src="webPages/js/select2/js/select2.min.js"></script>
		<script type="text/javascript" src="webPages/js/select2/js/i18n/zh-CN.js"></script>
		
		<script type="text/javascript" src="<%=basePath %>webPages/js/vocation.js"></script>
		<script type="text/javascript" src="<%=basePath%>/webPages/js/commonPageSplit.js"></script>
		
	</head>
	<body>
		<jsp:include page="head.jsp"></jsp:include>
		<jsp:include page="errorInfo.jsp"></jsp:include>
		<div class="bgcolor">
			<div class="subnav">
			</div>
		</div>
		<div class="container">
			<div id="mainFrame" class="mainFrame" style="margin-top: 30px;">
				<div class="row">
					<div class="col-sm-3 pull-right">
						<div class="projectHeadRight  clearfix">
				        	<div class="projectLogo">
				        		<a href="toUserDetail2.do?id=${freeteam_user.id}" target="_blank">
				        			<img id="_headPic" src="webPages/images/defaultHeadPic.png" onerror="this.src='webPages/images/defaultHeadPic.png'" />
				        		</a>
				            </div>
				            <div class="headSocial">
				                    <div class="headSocialGroup">
				                        <div class="socialName">
				                            <em class="iconTalks"></em>
				                            <a class="require_auth" after-auth="refresh-do" id="btn_raising_talk_with_founder"
				                               href="toUserDetail2.do?id=${freeteam_user.id}" target="_blank">
				                                <span id="_nickName" class="cf50 bold"></span>
				                            </a>
				                        </div>
				                    </div>
				
				                <div class="headSocialGroup">
				                        <div class="socialName" style="display: none;">
				                        	<em class="iconFollowing"></em>
				                        	<a javascript:void(0); id="btn_startup_profile_following" data-value="44452" fav-weight="1">取消关注</a>
				                        </div>
				                        <div class="socialName">
				                        	<em class="iconLocation">
				                        		<span class="glyphicon glyphicon-map-marker"></span>
				                        	</em>
				                        	<span id="_area"></span>
				                        </div>
				                    <div class="socailNum" title="关注度" id=""></div>
				                </div>
				                <!-- <div class="headSocialGroup">
				                    <div class="socialName"><em class="iconShare"></em><a id="btn_share_wechat" javascript:void(0);>微信分享</a></div>
				                </div> -->
				            </div>
				        </div>
						
						<!-- <div class="p5 thinBorder margin10_0">
							<h5 style="font-weight: bold;">最近创建的服务</h5>
							<div id="otherProArea">
								<p>暂无数据</p>
							</div>
						</div> -->
						<div class="projectGuide" style="background-color: whitesmoke;margin: 20px 0px;">
							<div class="talk-record" style="margin-top: 0;">
							    <h3>
							        <span class="left">最近创建的服务</span>
							    </h3>
							
							    <!-- 约谈人列表 -->
							    <div class="list" id="otherProArea">
							         <span>暂无数据</span>
							    </div>
							
							</div>
						</div>
					</div>
					
					<div class="col-sm-9">
						
						<div>
							<h3 class="sectionTitleA bold c56 f18 mb20" style="width:100%" id="panel_product_media">
								<c:if test="${empty ser.id}">发布服务</c:if>
								<c:if test="${not empty ser.id}">修改服务</c:if>
							</h3>
							<form id="serviceForm" action="addOrUpdateService.do" method="post" enctype="multipart/form-data">
								<c:if test="${empty ser.id}">
									<input type="hidden" id="option" name="option" value="add"/>
								</c:if>
								<c:if test="${!empty ser.id}">
									<input type="hidden" id="option" name="option" value="update"/>
									<input type="hidden" id="id" name="id" value="${ser.id}"/>
								</c:if>
								
								<table width="100%" class="form-table">
									<tr>
										<td width="18%">服务名称</td>
										<td width="62%">
											<div class="form-group has-feedback p0m0">
												<input id="name" maxlength="20" name="name" needvalicate="true" valicate="_required _maxlen=20" type="text" class="form-control" value="${ser.name}"/>
											</div>			
										</td>
										<td width="20%"></td>
									</tr>
									<tr>
										<td>服务简介</td>
										<td>
											<div class="form-group has-feedback p0m0">
												<textarea id="intro" name="intro" class="form-control" needvalicate="true" valicate="_required _maxlen=500" style="width: 100%;height: 170px;resize: none;" maxlength="500">${ser.intro}</textarea>
											</div>
										</td>
										<td></td>
									</tr>
									<tr>
										<td>海报</td>
										<td><input type="file" id="proImg" name="proImg" style="padding: 0px;" class="form-control" value="${ser.proLog}"/></td>
										<!--
										<td>将在页面的顶部展示大图片</td>  
										-->
									</tr>
									<tr>
										<td>所在地</td>
										<td id="pca" class="pca" class="align-left">
											<select id="province" name="provinceCode" onchange="queryCity(this);" style="width: 32%;">
												<option value="-1">请选择</option>
											</select>
											<select id="city" name="cityCode" onchange="queryArea(this);"  style="width: 32%;">
												<option value="-1">请选择</option>
											</select>
											<select id="area" name="serArea" style="width: 32%;">
												<option value="-1">请选择</option>
											</select>
											<input id="serArea" type="hidden" value="${ser.serArea}" />
										</td>
										<td></td>
									</tr>
									<tr>
										<td>服务价格</td>
										<td>
											<a title="快捷选择价格" class="btn btn-info btn-sm fLeft" style="margin:3px;" onclick="showPriceChoise();"><span class="glyphicon glyphicon-th-list"/></a>
											<div  id="choisePrice" class="chiosePrice" style="display:none;">
												<select placeholder="快速选择">
													<option id="mianyi" value="-1">面议</option>
													<option value="1-1000">0-1k</option>
													<option value="1000-3000">1-3k</option>
													<option value="3000-5000">3-5k</option>
													<option value="5000-10000">5k-1W</option>
													<option value="10000-30000">1W-3W</option>
													<option value="30000-50000">3W-5W</option>
													<option value="50000-100000">5W-10W</option>
													<option value="0">手动填写</option>
												</select>
												<script type="text/javascript">
													//给选择价格绑定事件
													var options = $("#choisePrice");
													$(options).bind('change',function(e){
														var p = $(this).find("option:selected").val();
														$("#startPrice").val("");
														$("#endPrice").val("");
														$("#startPrice").attr("needvalicate","true").removeAttr("disabled");
														$("#endPrice").attr("needvalicate","true").removeAttr("disabled");
														if(p=="0"){
															
														}else if(p=="-1"){
															$("#startPrice").val("面议");
															$("#endPrice").val("");
															$("#startPrice").attr("needvalicate","false").attr("disabled","disabled");
															$("#endPrice").attr("needvalicate","false").attr("disabled","disabled");
															validSuccess($("#startPrice"));
															validSuccess($("#endPrice"));
														}else{
															var tmp = p.split("-");
															$("#startPrice").val(tmp[0]);
															$("#endPrice").val(tmp[1]);
															$("#startPrice").change().blur();
															$("#endPrice").change().blur();
														}
														showPriceChoise();
													});
												</script>
											</div>
											<div class="form-group has-feedback p0m0 fLeft" style="width:40%">
												<input type="text" id="startPrice" maxlength="8" needvalicate="true" valicate="_n _maxlen=8 _lt=endPrice" placeholder="开始价格" class="form-control " name="startPrice" value="${ser.startPrice}" />
											</div>
											<span class="p10 fLeft" style="width:10%;text-align: center">至</span>
											<div class="form-group has-feedback p0m0 fLeft" style="width:40%">
												<input type="text" id="endPrice" maxlength="8" needvalicate="true" valicate="_n _maxlen=8 _gt=startPrice" placeholder="结束价格" class="form-control" name="endPrice" value="${ser.endPrice}"/>
											</div>
											<div class="clear"></div>
										</td>
										<td>
											<span>单位(元)</span>
										</td>
									</tr>
									<tr>
										<td>服务类型</td>
										<td>
											<%-- <select id="busiType" style="width:50%" onchange="setBusiType2(this)" class="form-control fLeft" value="${ser.busiType }"></select>
											<select id="busiType2" style="width:50%" name="busiType" class="form-control fLeft"></select>
											<div class="clear"></div> --%>
											<select id="busiType" style="width:98%" name="busiType"  class="form-control fLeft" value="${ser.busiType }">
												<option value="0">--请选择服务类型--</option>
												<option value="1">开发服务</option>
												<option value="2">咨询服务</option>
											</select>
											
											<!--<select id="busiSmlType" style="width:49%" name="busiSmlType"  class="form-control fRight" value="${ser.busiSmlType }">
												<option value="0">--请选择小类--</option>
											</select>-->
											
										</td>
										
										<!--<td>
											<a onclick="showAddBstDia();" class="mybtn-primary">添加小类</a>
										</td>-->
									</tr>
									<tr>
										<td>标签</td>
										<td>
											<input type="text" id="keyWord" name="keyWord" placeholder="最多添加五个标签" value="${ser.keyWord }" readonly="readonly" class="form-control" onclick="showTypeLabel()"/>
											<input type="hidden" id="keyWord_ids" name="keyWord_ids"  value="${ser.keyWord_ids}"/>
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
												<div>
													<a class="mybtn-primary submit">
														<span class="glyphicon glyphicon-ok"></span>
														<span>确定</span>
													</a>
												</div>
											</div>
										</td>
									</tr>
									
									<c:if test="${freeteam_user.type ne 1}">
										<tr>
											<td>服务成员</td>
											<td>
												<div id="servicePersonDiv">
													<div class="input-group" onclick="showDropDown();">
														<input id="employee_ids" name="employeeIds" type="hidden" value="${ser.employeeIds}"/>
														<input id="employee_name" type="text" placeholder="请选择服务成员，上限20位" readonly="readonly" class="form-control"/>
														<span class="btn btn-default input-group-addon"><span class="caret "></span></span>
													</div>
													<!-- <button class="btn btn-default" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
													</button> -->
													<div class="mydropdown thinBorder pinfo p0" style="display: none;height: 0px;max-height: 300px;overflow-y: scroll;">
														<table id="employeeTable" style="width:100%;">
															<tr>
																<td>正在查找...</td>
															</tr>
														</table>
													</div>
												</div>
											</td>
											<td><a class="mybtn-primary" href="pageTo.do?p=myHostPage&tohref=employeeArea" target="_blank">人员管理</a></td>
										</tr>
									</c:if>
									
									<tr>
										<td>支付计划</td>
										<td style="text-align: left;max-width: 300px;padding: 20px;overflow-x: auto;overflow-y: hidden;">
											<div id="planTip" style="color: red;display: inline-block;">示例：</div>
											<div class="ystep" style="display: inline-block;"></div>
											<input type="hidden" name="planId" id="planId" value="${ser.planId}"/>
											<div id="planSetting" class="thinBorder p10 pinfo" style="position: absolute;z-index: 1002;background: white;width: 500px; display:none;">
												<div class="close-btn fRight p10_0">
													<span class="glyphicon glyphicon-remove"></span>
												</div>
												<div>
													<div>
														
														<div class="clearfix mr10">
															<a class="mybtn fLeft" onclick="showPlanNodes('add')">
																<i class="glyphicon glyphicon-plus"></i>
																<span>新计划</span>
															</a>
															
														</div>
														<ul class="eventset-tit" style="margin-top: 10px;">
															<li>
																<i class="cell round w10"></i>
																<i class="cell round w60">计划</i>
																<i class="cell round w30">操作</i>
																
															</li>
														</ul>	
														<ul class="eventset-list" id="planArea" style="max-height:300px; overflow-y: auto;">
															
														</ul>
														
														<div class="text-center">
															<a class="mybtn-primary submit" onclick="choosePlan()">
																<span class="glyphicon glyphicon-ok"></span>
																<span>确定</span>
															</a>
														</div>
													</div>
												</div>
											</div>
											
											<div id="newPlan">
												<input type="hidden" id="hidPlanId" value="">
												<table>
													<tr class="th text-center">
														<td style="width: 20%;">名称</td>
														<td style="width: 40%;">描述</td>
														<td style="width: 20%;">支付比例</td>
														<td style="width: 10%;"></td>
													</tr>
													
													<tr id="addPlanNodeBtn" class="titleTr text-center">
														<td colspan="3">
															<a onclick="addPlanNode(true, false)"><span class="glyphicon glyphicon-plus"></span></a>
														</td>
													</tr>
													
													<tr>
														<td colspan="4" style="padding: 5px;">&nbsp;</td>
													</tr>
													<tr id="planNameDiv"  class="text-center" style="border-top: 1px lightgrey dashed;border-bottom: 1px lightgrey dashed;background-color: whitesmoke;">
														<td>
															<b>计划名称</b>
														</td>
														<td>
															<div class="from-group relative">
																<input id="plan_name" type="text" needvalicate="true" maxlength="20" valicate="_required _maxlen=20" class="form-control" placeholder="请输入计划名称"/>
															</div>
															
														</td>
														<td>
															<b>已占比例</b>:<label class="label label-info" id="totalPercent" num="0">0%</label>
														</td>
														<td></td>
													</tr>
													
												</table>
											</div>
										</td>
										<td><a class="mybtn-primary" onclick="showPlan()">设置</a></td>
										
									</tr>
									
									<!-- <tr>
										<td>
											其它图片<br />
											(ps:上传图像在本页宽高被压缩，上传后宽高将会还原，请放心上传。)
										</td>
										<td id="otherImgs" colspan="2">
											<input type="text" size="20" name="upfile" id="upfile" style="border:1px dotted #ccc">  
											<input type="button" value="浏览" onclick="path.click()" style="border:1px solid #ccc;background:#fff">  
											<input type="file" id="path" style="display:none" onchange="upfile.value=this.value">
											<div>
												<div class="imgDiv" style="filter:progid:DXImageTransform.Microsoft.AlphaImageLoader(sizingMethod=scale);"></div>
												<div class="thinBorder fLeft m5" style="width: 300px;height: 300px;overflow: hidden;" >
													<img  onclick="path.click()" class="imgWH300px imgPreView" src="webPages/images/add.png" alt="点击选择上传图片" title="点击选择上传图片"/>
													<div class="upimg-descripe thinBorder" isbottom="1" >
														<p class="btn btn-info btn-sm" style="width: 100%;" onclick="showImgDescripe(this);">请输入图片描述</p>
														<textarea style="width: 100%;height: 170px;resize: none;" maxlength="500"></textarea>
													</div>
													<div class="clearfix"></div>
												</div>
												<input type="file" id="path" style="display:none" onchange="setImage(this)">
											</div>
											<a class="btn btn-danger fLeft" style="margin: 20% 15%;" onclick="createaImgDiv(this);">添加下一张</a>
										</td>
									</tr> -->
									<tr>
										<td>
											服务详情
										</td>
										<td class="align-left" colspan="2">
											<!-- 加载编辑器的容器 -->
											<script id="container" name="content" type="text/plain" style="width: 100%;">${ser.content}</script>
										</td>
									</tr>
									<tr>
										<td colspan="3">
											<a class="mybtn-primary" onclick="saveService(this);">保存</a>
										</td>
									</tr>
								</table>
							</form>
						</div>
					</div>
					
					
					
				    <!-- 配置文件 -->
				    <script type="text/javascript" src="webPages/ueditor/ueditor.config.js"></script>
				    <!-- 编辑器源码文件 -->
				    <script type="text/javascript" src="webPages/ueditor/ueditor.all.js"></script>
				    <!-- 实例化编辑器 -->
				    <script type="text/javascript">
				    	
				        var ue = UE.getEditor('container',{
				        	toolbars: [
							    [ 'source', 'undo', 'redo'],
							    ['bold', 'italic', 'underline', 'fontborder', 'strikethrough', 'superscript', 'subscript', 'removeformat', 'formatmatch', 'autotypeset', 'blockquote', 'pasteplain', '|','fontfamily','fontsize', 'forecolor', 'backcolor', 'insertorderedlist', 'insertunorderedlist', 'selectall', 'cleardoc'],
							    ['simpleupload', 'insertimage', 'emotion', 'scrawl', 'insertvideo', 'music', 'map', 'insertcode', 'pagebreak', 'template', 'background', '|']
							],
							maximumWords:20000
				        });
				        
				    </script>
				</div>
				
				
				<div class="row">
					<div class="margin10_0">
						<!-- 加载编辑器的容器 -->
						<!--<script id="container" name="content" type="text/plain" style="width: 100%;">
						这里写你的初始化内容
						</script>-->
					</div>
					
				</div>
				
				<div id="bst_diaDiv" class="pInfo p10">
					<form id="addBstForm" action="addBusiSmlType.do" method="post">
						<table style="width:100%" >
							<tr>
								<td>
									&nbsp;&nbsp;
									<span id="bstTip" style="color:red;"></span>
								</td>
							</tr>
							<tr align="center">
								<td><input type="text" maxlength="10" name="busiSmlType" placeholder="如果没有能表示您意图的小类，请在此添加,10字以内" class="form-control"/></td>
								<td><a onclick="submitAddBst(this);" class="btn btn-info">确定</a></td>
							</tr>
						</table>
						
					</form>
				</div>
			</div>
		</div>
		<jsp:include page="footer.jsp"></jsp:include>
		<link rel="stylesheet" href="<%=basePath%>webPages/js/ystep/css/ystep.css" />
		<script type="text/javascript" src="<%=basePath%>webPages/js/ystep/js/ystep.js"></script>
		<script type="text/javascript" src="<%=basePath %>webPages/pages/tianTianTou/pageJs/newservice.js"></script>
	</body>
</html>
