<%@ page language="java" import="java.util.*" pageEncoding="utf-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="shiro" uri="http://shiro.apache.org/tags" %>
<c:set var="ctx" value="${pageContext.request.contextPath}"/>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html>
<head>
<title>上传安装包</title>
<meta http-equiv="content-type" content="text/html; charset=UTF-8" />
<script src="${ctx}/rs/js/jquery.validate.min.js"></script>
<script src="${ctx}/rs/js/jquery.form.js" type="text/javascript"></script>
</head>
<body>
<form id="form1" class="form-horizontal" action="${ctx}/app/add.htm" method="post" enctype="multipart/form-data">
      <div class="form-group">
        <label for="name" class="col-sm-2 control-label item ">版本号：</label>
        <div class="col-sm-6  ">
          <input type="text" class="form-control " id="versionId" name="versionId"/>
        </div>
        <span class="help-block col-sm-4" id="valierr" style="color:#FF9966">*</span>
        <input  type="hidden" id="isDown" name="isDown" value="1"/>
      </div>
	  <div class="form-group">
        <label for="name" class="col-sm-2 control-label item ">更新介绍：</label>
        <div class="col-sm-6  ">
		  <textarea class="form-control textarea-resize" rows="3" id="introDuction" name="introDuction"></textarea>
        </div>
        <span class="help-block col-sm-4" id="valierr" style="color:#FF9966">*</span>
      </div>
	  
	  <div class="form-group">
        <label for="name" class="col-sm-2 control-label item ">升级包：</label>
        <div class="col-sm-6  ">
		  <input type="file" id="mfile" name="mfile" class="upload"/>
        </div>
        <span class="help-block col-sm-4" id="valierr" style="color:#FF9966">*</span>
      </div>
	  <div class="form-group">
	     <label for="name" class="col-sm-4 control-label item " style="margin-left:10px;color:#D3D3D3">备注：只支持安卓包</label>
	  </div>
      <div class="form-group">
        <div class="text-center pt15">
		  <shiro:hasPermission name="app:save">
		     <button type="button" class="btn btn-primary btn-lg srt-btn active mr30" onclick="valiSubmit()">提交</button>
		     <button type="reset" class="btn btn-default btn-lg srt-btn active">重置</button>
          </shiro:hasPermission>
        </div>
      </div>

      <div class="form-group">
        <div class=" col-sm-10">
          <span id="error-text" style="color: #FF0000;"></span>
        </div>
      </div>
</form>


<script type="text/javascript" src="${ctx}/rs/js/bootstrapQ.min.js"></script>
<script src="${ctx}/rs/js/messages_zh.min.js"></script>
<script type="text/javascript">
$.validator.addMethod("mfileType", function(value, element) {
	var str = value.substr(value.lastIndexOf(".")).toLowerCase();
	return this.optional(element) || /.(apk)$/.test(str);
}, "只能上传安卓包!");


$.validator.addMethod("vername", function(value, element) {
	return this.optional(element) || /^[^\u4e00-\u9fa5]{0,}$/.test(value);
}, "版本号不可以存在中文!");

	//初始化验证 start
    var form = $('#form1');
    var validator = form.validate({
		rules: {
			versionId: {
				vername:"vername",
				maxlength: 20,
		        required: true
		    },
		    introDuction: {
		    	maxlength: 200,
			    required: true
			},
			mfile: {
				mfileType:"mfileType",
			    required: true
			}
		    
		  },
		  
		  highlight: function(element) {
			  $(element).closest('.form-group').removeClass('success').addClass('error');
		  },
		  success: function(element) {
			  element.text('OK!').addClass('valid')
		      .closest('.form-group').removeClass('error').addClass('success');
		  }
    });
    /** end */

	function valiSubmit() {
		if (form.valid()) {
			var options = {
				dataType : "json",
				beforeSubmit : function() {
					$(".unable").show();
				},
				success : function(result) {
					if(!$('.unable').is(':hidden')){
						$(".unable").hide();
					}
					if (result) {
						// 普通消息提示条
						bootstrapQ.msg({
							msg : '发布成功！',
							type : 'success',
							time : 2000
						});
						//触发隐藏确认的按钮，引用回调方法关闭窗口并刷新列表
						$("button.bsok").click();
					} else {
						bootstrapQ.msg({
							msg : '发布失败！',
							type : 'danger',
							time : 2000
						});
					}
				},
				error : function(result) {
					if(!$('.unable').is(':hidden')){
						$(".unable").hide();
					}
					bootstrapQ.msg({
						msg : '发布失败！',
						type : 'danger',
						time : 2000
					});
				}
			};
			form.ajaxSubmit(options);
			return false;
		}
	}
</script>
</body>
</html>