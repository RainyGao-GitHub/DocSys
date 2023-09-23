//页面初始化
var login_user = "";	//用来保存刚注册的用户、或刚才登录的用户
var gShareId; //
function pageInit(lang)
{
	console.log("pageInit");
	
	Setcookie("UserLanguage", lang);	//设置用户的语言类型	
	
	//确定当前登录用户是否已登录
	$.ajax({
        url : "/DocSystem/User/getLoginUser.do",
        type : "post",
        dataType : "json",
        data : {},
        success : function (ret) {
        	console.log("pageInit() getLoginUser:", ret);
            if( "ok" == ret.status )
            {
            	//Get用户信息
				var user = ret.data;
				login_user = user;
				
            	//显示用户信息
            	ShowUserInfo(user);
            	loginBtnCtrl(user);                	
            }
            else 
            {
            	console.log("pageInit() 获取用户信息失败:" + ret.msgInfo);
                loginBtnCtrl();
                
            	if(ret.data && ret.data == "needAddFirstAdmin")
                {
            		showAddFirstAdminUserPanel();
                }

            }
        },
        error : function () {
        	showErrorMessage(_Lang("获取用户信息失败", " : ", "服务器异常"));
        }
    });

    var swiper = new Swiper('.swiper-container', {
        spaceBetween: 30,
        centeredSlides: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
    });
}

function Setcookie(name, value)
{ 
	var expdate = new Date();
    expdate.setTime(expdate.getTime() +  90 * 24 * 60 * 60 * 1000);   //时间单位毫秒
    document.cookie = name+"="+value+";expires="+expdate.toGMTString()+";path=/"; 
   //即document.cookie= name+"="+value+";path=/";  时间默认为当前会话可以不要，但路径要填写，因为JS的默认路径是当前页，如果不填，此cookie只在当前页面生效！
}

function userLogout()
{
	logout();
	loginBtnCtrl();
}

function loginBtnCtrl(user)
{
	if(user)
	{
    	//hide register Btn
    	$('#mobileRegisterBtn').hide();
    	$('#registerBtn').hide();
    	
    	//hide loginBtn
    	$('#mobileLoginBtn').hide();
    	$('#loginBtn').hide();
    	$('#loginBannerBtn').hide();
    	
    	//show logoutBtn
    	$('#logoutBtn').show();
       	$('#mobileLogoutBtn').show();
                       	
    	//显示进入系统按键
    	$('#enterSystemBtn').show();
    	$('#enterSystemLink').show();
	}
	else
	{
    	//show register Btn
    	$('#mobileRegisterBtn').show();
    	$('#registerBtn').show();
    	
    	//hide loginBtn
    	$('#mobileLoginBtn').show();
    	$('#loginBtn').show();
    	$('#loginBannerBtn').show();
    	
    	//show logoutBtn
    	$('#logoutBtn').hide();
       	$('#mobileLogoutBtn').hide();
                       	
    	//显示进入系统按键
    	$('#enterSystemBtn').hide();
    	$('#enterSystemLink').hide();
	}
}
//通用函数接口
function showErrorMessage($msg) {
	qiao.bs.alert($msg);
}


function showFeebackPanel()
{
	console.log("showFeebackPanel");
	var href = "https://gitee.com/RainyGao/DocSys/issues";
	window.open(href);   //新窗口打开	
}

function downloadInstallPackage()
{
	var href = "https://github.com/RainyGao-GitHub/DocSys/releases";
	window.open(href);   //新窗口打开	
}

function purchaseLicense()
{
	var href = "http://dw.gofreeteam.com/DocSystem/web/sales/select.html";
	window.open(href);   //新窗口打开	
}