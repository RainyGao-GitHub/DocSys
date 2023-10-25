
function SystemLicenseInfoPageInit()
{
	console.log("SystemLicenseInfoPageInit()");
}

function showSystemLicenseInfoModal(text){
	$(".systemLicenseInfoModal").fadeIn("slow");
}

function closeSystemLicenseInfoModal(){
	$(".SystemLicenseInfoModal").fadeOut("slow");
}

//页面初始化代码    
$(function(){
	console.log("SystemLicenseInfo Page init");
	SystemLicenseInfoPageInit();
});

function SystemLicenseInfoPageCallback(systemLicenseInfo)
{
	console.log("SystemLicenseInfoPageCallback()");
    
    //Page Value Init
    $("#systemLicenseType").val(systemLicenseInfo.formatedType);	

    if(systemLicenseInfo.customer != undefined)
    {
    	$("#systemLicenseCustomer").val(systemLicenseInfo.customer);	
    }
    
    if(systemLicenseInfo.serverSN != undefined)
    {
    	$("#systemLicenseServerSN").val(systemLicenseInfo.serverSN);	
    }

	var usersCount = _Lang("不限");
	if(systemLicenseInfo.usersCount && systemLicenseInfo.usersCount != null)
	{
		usersCount = systemLicenseInfo.usersCount;
	}
	$("#systemLicenseUsersCount").val(usersCount);

	var expireTime = _Lang("长期");
	if(systemLicenseInfo.expireTime && systemLicenseInfo.expireTime != null)
	{
		if(systemLicenseInfo.expireTime < new Date().getTime())
		{
			expireTime = _Lang("已过期");
		}
		else
		{
			expireTime = formatDate(systemLicenseInfo.expireTime);
		}
	}
	$("#systemLicenseExpireTime").val(expireTime);
}