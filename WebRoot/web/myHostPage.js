var login_user = "";	//用来保存刚才登录的用户
var gShareId;

$(function () {
	pageInit();

});

//Update UserInfo
function UpdateUserInfo(){
	console.log("UpdateUserInfo");
    $.ajax({
        url : "/DocSystem/User/updateLoginUserInfo.do",
        type : "post",
        dataType : "json",
        data : {
             userName : $("#name").val(),
             nickName : $("#nickName").val(),
             realName : $("#realName").val(),
             intro: $("#userIntro").val(),
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	console.log("UpdateUserInfo 成功");
    			bootstrapQ.msg({
					msg : _Lang("保存成功") + "!", 
					type : 'success',
					time : 2000,
				    });
            }else {
            	showErrorMessage(_Lang("保存失败", " : ", ret.msgInfo));
            }
        },
        error : function () {
            showErrorMessage(_Lang("保存失败", " : ", "服务器异常"));
        }
    });
}


//ModifyPassword
function ModifyPassword(){
	console.log("ModifyPassword");
    $.ajax({
        url : "/DocSystem/User/modifyPwd.do",
        type : "post",
        dataType : "json",
        data : {
             userName : $("#name").val(),
             oldPwd : MD5($("#password1").val()),
             pwd : MD5($("#password2").val()),
             pwd2 : MD5($("#password3").val()),
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	console.log("ModifyPassword 成功");
    			bootstrapQ.msg({
					msg : _Lang('修改成功') + '!', 
					type : 'success',
					time : 2000,
				    });
            }else {
            	showErrorMessage(_Lang("修改失败", " : ", ret.msgInfo));
            	//showError(ret.msgInfo);
            }
        },
        error : function () {
            showErrorMessage(_Lang("修改失败", " : ", "服务器异常"));
        }
    });
}
//页面初始化
var loginUser = "";
var gToHref;
function pageInit()
{
	console.log("pageInit");
	//确定当前登录用户是否已登录
	$.ajax({
        url : "/DocSystem/User/getLoginUser.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
            if( "ok" == ret.status )
            {
            	var user = ret.data;
            	loginUser = user;
            	console.log(loginUser);
            	//Set UserName NickName RealName Intro
            	$("#name").val(loginUser.name);
               	$("#nickName").val(loginUser.nickName);
               	$("#realName").val(loginUser.realName);
               	$("#userIntro").val(loginUser.intro);
               	
            	//显示用户信息
            	ShowUserInfo(user);
            	$("#loginBtn").hide();
               	
            	
            	//显示左侧菜单栏
            	$('#menu').show();
            	//根据url中的toHref信息确定需要显示的内容
            	gToHref = getQueryString("toHref");
            	if(!gToHref)
            	{
            		gToHref = "myInfo";
            	}           
            	console.log("gToHref:" + gToHref); 
            	PageSwitch(gToHref);
            	

            }
            else 
            {
                console.log(ret.msgInfo);
            	$("#loginBtn").show();
            }
        },
        error : function () {
            alert(_Lang("获取用户信息失败", " : ", "服务器异常"));
        }
    });
}

//通用函数接口
function showErrorMessage($msg) {
	qiao.bs.alert($msg);
}
// 从 url 中获取参数
function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}

//Siwtch the display of page
function PageSwitch(page)
{
	console.log("PageSwitch:" + page);
	switch(page)
	{
   	case "password":
	    $("#myInfoTag").removeClass("active");
	    $("#passwordTag").addClass("active");
	    $("#myInfo").hide();
	    $("#password").show();
      	break;
    default:	//myInfo
    	$("#myInfoTag").addClass("active");
	    $("#passwordTag").removeClass("active");
	    $("#myInfo").show();
      	$("#password").hide();
	    MyInfoPageInit();
     	break;
     }
}

function MyInfoPageInit()
{
	console.log("MyInfoPageInit");
	
	//Set userImg
	setUserImg();
	
	//Set the evnent handler for hidden.bs.modal(This handler will show the immg upload dialog)
    $("#upload-logo-panel").on("hidden.bs.modal",function () {
        $("#upload-logo-panel").find(".modal-body").html(window.modalHtml);
    }).on("show.bs.modal",function () {
        window.modalHtml = $("#upload-logo-panel").find(".modal-body").html();
    });
	
	//Setup the WebUploader for img upload
    var host = window.location.host;	//域名带端口
	console.log(host);
	var serverUrl = "http://" + host + "/DocSystem/User/uploadUserImg.do";		
	try {
        var uploader = WebUploader.create({
            auto: false,
            swf: 'static/webuploader/Uploader.swf',
            server: serverUrl,
            pick: "#filePicker",
            fileVal : "file",	//后台请求受到name
            fileNumLimit : 1,
            compress : false,
            accept: {
                title: 'Images',
                extensions: 'jpg,jpeg,png',
                mimeTypes: 'image/jpg,image/jpeg,image/png'
            }
        });
        
        uploader.on("beforeFileQueued",function (file) {
        	console.log("beforeFileQueued1");
            uploader.reset();
        });
        
        uploader.on( "fileQueued", function( file ) {
        	console.log("fileQueued");
            uploader.makeThumb( file, function( error, src ) {
                $img = '<img src="' + src +'" style="max-width: 360px;max-height: 360px;">';
                if ( error ) {
                    $img.replaceWith('<span>' + _Lang('不能预览') + '</span>');
                    return;
                }

                $("#image-wraper").html($img);
                window.ImageCropper = $('#image-wraper>img').cropper({
                    aspectRatio: 1 / 1,
                    dragMode : 'move',
                    viewMode : 1,
                    preview : ".img-preview"
                });
            }, 1, 1 );
        });
        
        uploader.on("uploadError",function (file,reason) {
        	console.log("uploadError");
        	console.log(reason);
            $("#error-message").text(_Lang("上传失败", " : ", reason));

        });
        
        uploader.on("uploadSuccess",function (file, res) {
        	console.log("uploadSuccess");
        	console.log(res);
            if(res.status === "ok"){
                $("#upload-logo-panel").modal('hide');
                //Set the headimg url
                loginUser.img = res.data.img;
                setUserImg();
            }else{
                $("#error-message").text(res.message);
            }
        });
        
        uploader.on("beforeFileQueued",function (file) {
        	console.log("beforeFileQueued2");
            if(file.size > 1024*1024*2){
                uploader.removeFile(file);
                uploader.reset();
                alert(_Lang("文件必须小于") + " 2MB");
                return false;
            }
        })
        
        uploader.on("uploadComplete",function () {
        	console.log("uploadComplete");
            $("#saveImage").button('reset');
        });
        
        $("#saveImage").on("click",function () {
            var files = uploader.getFiles();
            if(files.length > 0) {
                $("#saveImage").button('loading');
                var cropper = window.ImageCropper.cropper("getData");

                uploader.option("formData", cropper);

                uploader.upload();
            }else{
                alert(_Lang("请选择头像"));
            }
        });
    }catch(e){
        console.log(e);
    }
}

function setUserImg()
{
	if(!loginUser.img || loginUser.img == "")
	{
		return;
	}
	var headImgUrl = getUserImgUrl(loginUser.img); 
	$("#headimgurl").attr('src',headImgUrl); 
    $("#userImg").attr('src',headImgUrl);

}

function getUserImgUrl(imgName)
{
	return "/DocSystem/User/getUserImg.do?fileName=" + imgName;
}