function AddLicensePageInit()
{
	console.log("addLicensePageInit()");
	EnterKeyListenerForAddLicense();
}

function showAddLicenseModal(text){
	$(".addLicenseModal").fadeIn("slow");
	$("#name").focus();
}

function closeAddLicenseModal(){
	$(".addLicenseModal").fadeOut("slow");
}

//回车键监听函数
function EnterKeyListenerForAddLicense(){
	console.log("start enter key listener");
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		addLicense();
 	}  
}

function doSelectAllowAllActionEnable(obj,event){
	console.log("doSelectAllowAllActionEnable()");
	var allowAllActionEnable = $("#allowAllActionEnable").is(':checked')? 1: 0;
	console.log("doSelectAllowAllActionEnable allowAllActionEnable:" + allowAllActionEnable);
	if(allowAllActionEnable == 0)
	{
		$("#getAuthCodeEnable").prop("checked",false);
		$("#resetHistoryEnable").prop("checked",false);
		$("#recoverBackupEnable").prop("checked",false);
		$("#recycleBinEnable").prop("checked",false);
		//attr不能多次选择会无效
		//$("#getAuthCodeEnable").attr("checked",false);	
		//$("#resetHistoryEnable").attr("checked",false);	
		//$("#recoverBackupEnable").attr("checked",false);	
		//$("#recycleBinEnable").attr("checked",false);	
	}
	else
	{	
		$("#getAuthCodeEnable").prop("checked",true);
		$("#resetHistoryEnable").prop("checked",true);
		$("#recoverBackupEnable").prop("checked",true);
		$("#recycleBinEnable").prop("checked",true);
		//attr不能多次选择会无效
		//$("#getAuthCodeEnable").attr("checked","checked");
		//$("#resetHistoryEnable").attr("checked","checked");
		//$("#recoverBackupEnable").attr("checked","checked");
		//$("#recycleBinEnable").attr("checked","checked");
	}
}

function doSelectGetAuthCodeEnable(obj,event){
	console.log("doSelectGetAuthCodeEnable()");
	var getAuthCodeEnable = $("#getAuthCodeEnable").is(':checked')? 1: 0;
	console.log("doSelectGetAuthCodeEnable getAuthCodeEnable:" + getAuthCodeEnable);
	if(getAuthCodeEnable == 0)
	{
		$("#allowAllActionEnable").prop("checked",false);
	}
}

function doSelectResetHistoryEnable(obj,event){
	console.log("doSelectResetHistoryEnable()");
	var resetHistoryEnable = $("#resetHistoryEnable").is(':checked')? 1: 0;
	console.log("doSelectResetHistoryEnable resetHistoryEnable:" + resetHistoryEnable);
	if(resetHistoryEnable == 0)
	{
		$("#allowAllActionEnable").prop("checked",false);
	}
}

function doSelectRecoverBackupEnable(obj,event){
	console.log("doSelectRecoverBackupEnable()");
	var recoverBackupEnable = $("#recoverBackupEnable").is(':checked')? 1: 0;
	console.log("doSelectRecoverBackupEnable recoverBackupEnable:" + recoverBackupEnable);
	if(recoverBackupEnable == 0)
	{
		$("#allowAllActionEnable").prop("checked",false);
	}
}

function doSelectRecycleBinEnable(obj,event){
	console.log("doSelectRecycleBinEnable()");
	var recycleBinEnable = $("#recycleBinEnable").is(':checked')? 1: 0;
	console.log("doSelectRecycleBinEnable recycleBinEnable:" + recycleBinEnable);
	if(recycleBinEnable == 0)
	{
		$("#allowAllActionEnable").prop("checked",false);
	}
}

function getAllowedAction()
{
	var allowAllActionEnable = $("#allowAllActionEnable").is(':checked')? 1: 0;
	var getAuthCodeEnable = $("#getAuthCodeEnable").is(':checked')? 1: 0;
	var resetHistoryEnable = $("#resetHistoryEnable").is(':checked')? 1: 0;
	var recoverBackupEnable = $("#recoverBackupEnable").is(':checked')? 1: 0;
	var recycleBinEnable = $("#recycleBinEnable").is(':checked')? 1: 0;

	var allowedAction = "{";		
	if(allowAllActionEnable == 1)
	{
		allowedAction += "allowAllAction:\"enabled\","
	}
	if(getAuthCodeEnable == 1)
	{
		allowedAction += "getAuthCode:\"enabled\","
	}
	if(resetHistoryEnable == 1)
	{
		allowedAction += "resetHistory:\"enabled\","
	}
	if(recoverBackupEnable == 1)
	{
		allowedAction += "recoverBackup:\"enabled\","
	}
	if(recycleBinEnable == 1)
	{
		allowedAction += "recycleBin:\"enabled\","
	}		
	allowedAction += "}";		

	console.log("getAllowedAction() allowedAction:" + allowedAction);
	return allowedAction;
}

function addLicense(obj,event){
	console.log("addLicense()");
	
	//Disable the obj
	$(obj).attr("disabled",true);
	
	var type = $("#lienceType").val();
	var serverSN = $("#serverSN").val();
	var customer = $("#customer").val();
    var payInfo = $("#payInfo").val();
    var usersCount =  $("#usersCount").val();
    var validMonths =  $("#validMonths").val();
    var allowedAction = getAllowedAction();
    
    console.log(customer,payInfo,usersCount,validMonths);
    
    $.ajax({
        url : "/DocSystem/Sales/generateLicense.do",
        type : "post",
        dataType : "json",
        data : {
        	type: type,
        	serverSN : serverSN,
        	customer : customer,
        	payInfo : payInfo,
        	usersCount : usersCount,
        	validMonths : validMonths,
        	allowedAction: allowedAction,
        },
        success : function (ret) {
    		//Enable the obj
    		$(obj).attr("disabled",false);

            if( "ok" == ret.status ){
            	showLicenseList(gPageIndex);	//刷新LicenseList
        	    console.log("generateLicense Ok:",ret);        	   		
            	window.location.href = ret.data;
            	showErrorMessage("新增成功");
            }else {
            	showErrorMessage("错误：" + ret.msgInfo);
            }
        },
        error : function () {
    		//Enable the obj
    		$(obj).attr("disabled",false);

    		showErrorMessage("新增失败:服务器异常");
        }
    });
}

//页面初始化代码    
$(function(){
	console.log("addLicense Page init");
	AddLicensePageInit();
	$("#customer").click().focus();
});