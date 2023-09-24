//cookie操作接口
function setCookie(name, value, iDay) 
{
    var oDate=new Date();
     
    oDate.setDate(oDate.getDate()+iDay);
     
    document.cookie=name+'='+encodeURIComponent(value)+';expires='+oDate;
}
 
function getCookie(name)
{
    var arr=document.cookie.split('; ');
    var i=0;
    for(i=0;i<arr.length;i++)
    {
        //arr2->['username', 'abc']
        var arr2=arr[i].split('=');
         
        if(arr2[0]==name)
        {  
            var getC = decodeURIComponent(arr2[1]);
            return getC;
        }
    }
     
    return '';
}
 
function removeCookie(name)
{
    setCookie(name, '1', -1);
}

//登录页面初始化操作
function LoginPageInit()
{
	//console.log($.cookie("dsuser"));
	//Set the event handler for keydown
	console.log("LoginPageInit() Set the event handler for keydown");
	document.onkeydown=function(event)
	{
		//浏览器兼容性处理
		var e = event || window.event || arguments.callee.caller.arguments[0];
		EnterKeyListenerForLogin(e);	
	}	
}

function showLogin(text){
	$(".loginModal2").fadeIn("slow");
	$("#userName").focus();
}

function closeLogin(){
	$(".loginModal2").fadeOut("slow");
}

//回车键监听函数
function EnterKeyListenerForLogin(e){
	//var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (e.keyCode == 13){  
 		login();
 	}  
}

//登录按键处理函数
function login(){
	var rememberMe = $('input[name="rememberMe"]').is(':checked')? 1: 0;
	$.ajax({
        url : "/DocSystem/User/login.do",
        type : "post",
        dataType : "json",
        data : {
             userName : $('input[name="userName"]').val(),
             pwd : base64_encode($('input[name="pwd"]').val()),
             rememberMe : rememberMe,
        },
        success : function (ret) {
            if( "ok" == ret.status ){
            	console.log("登录成功");
            	login_user = $('input[name="userName"]').val();
            	//document.location.reload();
            	if(gShareId)
            	{
            		gShareId = undefined;
            		updateUrl();
            	}
            	var url = window.location.href;               	
            	window.location.href = url;	//刷新页面
            }else {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("登录失败", " : ", ret.msgInfo),
            	});
            	
            	if(ret.data == "needCheckDBSetting")
            	{
            		window.location.href='/DocSystem/index.jsp'
            	}
            }
        },
        error : function () {
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("登录失败", ":", "服务器异常"),
        	});
        }
    });
}
