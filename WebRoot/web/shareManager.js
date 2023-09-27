//页面加载完成处理函数    
$(document).ready(function(){
	console.log("Page is ready");
	showShareList();
});

//进入分享编辑状态
function editShare() {
	console.log("editShare");
	$("#btnSaveShare").show();
    $("#btnCancelSaveShare").show();
}

//将权限保存到后台
function saveShare() {
	console.log("saveShare");
	$("#btnSaveShare").hide();
    $("#btnCancelSaveShare").hide();
    
	//遍历所有勾选的用户权限
	var docShares = [];
	$("#shareListArea >li").each(function(){
      	var index =$(this).val();  //获取li的索引
      	//alert(index);
      	if($("#DocShare"+index).prop("checked") == true)
      	{
      		var docShare = [];
			docShare.shareId = $("#DocShare"+index).val();
			docShare.editEn = $("#EditEn"+index).prop("checked")?1:0;
			docShare.addEn = $("#AddEn"+index).prop("checked")?1:0;
			docShare.deleteEn = $("#DeleteEn"+index).prop("checked")?1:0;
			docShare.downloadEn = $("#DownloadEn"+index).prop("checked")?1:0;
			console.log(docShare);
			docShares.push(docShare);	//将用户加入到列表中
	    }
	});
	console.log(docShares);
	
	ConfigDocShare.configDocShares(docShares);
}

function cancelSaveShare() {
	console.log("cancelSaveShare");
    $("#btnSaveShare").hide();
    $("#btnCancelSaveShare").hide();
    //刷新分享列表
    showShareList();
}

function showDocShareEditPanel(index)
{
	var docShare = gDocShareList[index];
	var url = getDocShareLink(docShare.vid,docShare,docShare.serverIp);
 	console.log(url);	 		
 	showDocSharePanel(docShare, docShare.name, url, showShareList);
}

function showDocSharePanel(docShare, docName, url, callback)
{
	console.log("showDocSharePanel docName:" + docName);
	bootstrapQ.dialog({
		id: 'docShare',
		url: 'docShare' + langExt + '.html',
		title: _Lang('文件分享') + " [" + docName + "]",
		msg: _Lang('页面正在加载，请稍等') + '...',
		foot: false,
		big: false,
		callback: function(){
			DocShare.DocSharePageInit(docShare, docName, url, callback);
		},
	});
}

var gDocShareList = [];
function showShareList(){
   	console.log("showShareList()");
   	$.ajax({
                url : "/DocSystem/Doc/getDocShareList.do",
                type : "post",
                dataType : "json",
                data : {
                    //reposId : vid, //指定仓库
                	//path: parentPath, //指定文件
                	//name: docName,
                },
                success : function (ret) {
                    if( "ok" == ret.status ){
				        $("#btnSaveShare").hide();
				        $("#btnCancelSaveShare").hide();
				        gDocShareList = ret.data;
                    	showDocShareList(ret.data);
                    }
                    else
                    {
				        $("#btnSaveShare").hide();
				        $("#btnCancelSaveShare").hide();
                    	showErrorMessage(_Lang("文件分享列表获取失败", " : ", ret.msgInfo));
                    }
                },
                error : function () {
    		        $("#btnSaveShare").hide();
			        $("#btnCancelSaveShare").hide();
                   	showErrorMessage(_Lang('文件分享列表获取失败', ' : ', '服务器异常'));
                }
    });
    
    
    function shareAuthCovert(docShare)
    {
		//分享权限转换
		var shareAuth = JSON.parse(docShare.shareAuth);
		if(shareAuth.downloadEn && shareAuth.downloadEn == 1)
		{
			docShare.downloadEn = 1;			
		}
		else
		{
			docShare.downloadEn = 0;
		}
		
		if(shareAuth.addEn && shareAuth.addEn == 1)
		{
			docShare.addEn = 1;			
		}
		else
		{
			docShare.addEn = 0;
		}
		
		if(shareAuth.editEn && shareAuth.editEn == 1)
		{
			docShare.editEn = 1;			
		}
		else
		{
			docShare.editEn = 0;
		}
		
		if(shareAuth.deleteEn && shareAuth.deleteEn == 1)
		{
			docShare.deleteEn = 1;			
		}
		else
		{
			docShare.deleteEn = 0;
		}
    }

	function showDocShareList(data){
		console.log("showDocShareList");
		console.log(data);
		
		var c = $("#shareListArea").children();
		$(c).remove();
		if(data.length==0)
		{
			$("#shareListArea").append("<p>" + _Lang("暂无数据") + "</p>");
		}
		
		for(var i=0;i<data.length;i++){
			var d = data[i];
			shareAuthCovert(d);			
			var editChecked = d.editEn == 1? "checked":"";
			var addChecked = d.addEn == 1? "checked":"";
			var deleteChecked = d.deleteEn == 1? "checked":"";
			var downloadChecked = d.downloadEn == 1? "checked":"";
			var selectAllChecked = "";
			
			var opBtn1 = "";
			var opBtn2 = "";
			var docShareId = "";
			docShareId = d.shareId;
			opBtn1 = "<a href='javascript:void(0)' onclick='showDocShareEditPanel("+i+");' class='mybtn-primary'>" + _Lang("编辑") + "</a>";
			opBtn2 = "<a href='javascript:void(0)' onclick='deleteDocShareConfirm("+docShareId+");' class='mybtn-primary'>" + _Lang("删除") + "</a>";
							
			var shareInfo = d.reposName + "::" + d.path + d.name;
			var expireTime = getDate(d.expireTime);
			var se = "<li value="+ i +">"
				+"	<i class='cell select w5'>"
				+"		<input class='DocShareEnable' id='DocShare"+i+"' value='"+docShareId+"' type='checkbox' onclick='editShare()'/>"
				+"	</i> "
				+"	<i class='cell shareinfo w30'>"
				+"		<span class='name'>"
				+"			<a id='ShareInfo"+i+"' value='"+d.vid+"' href='javascript:void(0)'>"+ shareInfo + "</a>"
				+"		</span>"
				+"	</i>"
				+"	<i class='cell shareinfo w10'>"
				+"		<span class='name'>"
				+"			<a id='ExpireTime"+i+"' value='"+d.expireTime+"' href='javascript:void(0)'>"+ expireTime + "</a>"
				+"		</span>"
				+"	</i>"
				+"	<i class='cell add w7'>"
				+"		<input id='AddEn"+i+"'  value='"+ d.addEn+"' type='checkbox' " + addChecked + " onchange='EnableShareConfig("+i+");'>Download</input>"
				+"	</i>"
				+"	<i class='cell download w7'>"
				+"		<input id='DownloadEn"+i+"' value='"+ d.downloadEn+"' type='checkbox' " + downloadChecked + " onchange='EnableShareConfig("+i+");'>Upload</input>"
				+"	</i>"
				+"	<i class='cell edit w7'>"
				+"		<input id='EditEn"+i+"' value='"+ d.editEn+"' type='checkbox' " + editChecked + " onchange='EnableShareConfig("+i+");'>Modify</input>"
				+"	</i>"
				+"	<i class='cell delete w7'>"
				+"		<input id='DeleteEn"+i+"' value='"+ d.deleteEn+"' type='checkbox' " + deleteChecked + " onchange='EnableShareConfig("+i+");'>Delete</input>"
				+"	</i>"
				+"	<i class='cell selectAll w7'>"
				+"		<input id='SelectAll"+i+"' value='"+ d.selectAll+"' type='checkbox' " + selectAllChecked + " onclick='selectAllShare(" +i+")' onchange='EnableShareConfig("+i+");'>全部</input>"
				+"	</i>"
				+"	<i class='cell operation w10'>"
				+ 		opBtn1
				+ " "
				+ 		opBtn2
				+"	</i>"
				+"</li>";
			
			$("#shareListArea").append(se);
		}
	}
}

function EnableShareConfig(index){
	editShare();
	if($("#DocShare"+index).prop("checked") == false)
	{
		$("#DocShare"+index).prop("checked",true);
	}
}

function selectAllShare(index)
{
	if($("#SelectAll"+index).prop("checked") == true)
	{
		//SelectAll
		$("#EditEn"+index).prop("checked",true);
		$("#AddEn"+index).prop("checked",true);
		$("#DeleteEn"+index).prop("checked",true);
		$("#DownloadEn"+index).prop("checked",true);
	}
	else
	{
		//UnselectAll
		$("#EditEn"+index).prop("checked",false);
		$("#AddEn"+index).prop("checked",false);
		$("#DeleteEn"+index).prop("checked",false);
		$("#DownloadEn"+index).prop("checked",false);
	}
}

function deleteDocShareConfirm(shareId)
{
   	console.log("deleteDocDocShareConfirm()");
		qiao.bs.confirm({
 	    	id: 'deleteDocShareConfirm',
 	    	title: _Lang("确认操作"),
 	        msg: _Lang("是否删除该分享") + "?",
 	        close: false,		
 	        okbtn: _Lang("确认"),
 	        qubtn: _Lang("取消"),
 	    },function () {
 	    	//alert("点击了确定");
 	    	deleteDocShare(shareId);
 	    	return true;   
 	    },function(){
 	    	//alert("点击了取消");
 	    	return true;
 	    }); 
}

function deleteDocShare(docShareId)
{	
   	console.log("deleteDocShare()");   	
   	$.ajax({
            url : "/DocSystem/Bussiness/deleteDocShare.do",
            type : "post",
            dataType : "json",
            data : {
                shareId: docShareId,
            },
            success : function (ret) {
                if( "ok" == ret.status ){
                    showShareList();
                	// 普通消息提示条
					bootstrapQ.msg({
							msg : _Lang('删除成功') + '!',
							type : 'success',
							time : 2000,
						    });
                }
                else
                {
                	showErrorMessage(_Lang("删除失败", " : ", ret.msgInfo));
                }
            },
            error : function () {
               showErrorMessage(_Lang('删除失败', ' : ', '服务器异常'));
	        }
	    });
	}

//ConfigDocShare类
var ConfigDocShare = (function () {
    //当前操作的索引
    var index = 0;
    var docShareList = null; //id(docShareId), reposId, docPath, editEn, addEn, deleteEn, downloadEn
    var totalNum = 0;
    var failNum =0;
    var successNum = 0;
    var configErrorConfirmSet = 0;
    
    //标准Java成员操作接口
	function getIndex()
	{
        return index;
	}
	
	function setIndex(i)
	{
		index = i;
	}
	
	function getDocAutList()
	{
        return docShareList;
	}
	
	function setDocShareList(docShares)
	{
		docShareList = docShares;
	}
	
	function getTotalNum()
	{
        return totalNum;
	}
	
	function setTotalNum(num)
	{
		totalNum = num;
	}
  	
  	function ConfigDocShareSet(docShares)
	{
		console.log("ConfigDocShareSet");

		setIndex(0);

		setDocShareList(docShares);
		
		var totalNum = 0;
		if(docShareList && docShareList.length)
		{
			totalNum = docShareList.length;
		}
		setTotalNum(totalNum);
		failNum = 0;
		successNum = 0;
		configErrorConfirmSet = 0;
  	}
  		
	function configDocShare()
	{
		console.log("configDocShare index:" + index + " totalNum:" + totalNum);

		//set docShare
		var docShare = docShareList[index];
		console.log(docShare);
		
		$.ajax({
			  url : "/DocSystem/Bussiness/updateDocShare.do",
			  	type : "post",
			    dataType : "json",
			    data : {
			         shareId : docShare.shareId,
		             isAdmin : 0,
		             access : 1,
				     editEn: docShare.editEn, 
				     addEn: docShare.addEn, 
				     deleteEn: docShare.deleteEn, 
				     downloadEn: docShare.downloadEn,
		             heritable : 1,     
		             sharePwd : docShare.sharePwd,
		             shareHours : docShare.shareHours,
			     },
			     success : function (ret) {
			         if( "ok" == ret.status){
				          	index++;
			                if(index < totalNum)
			                {
			                	configDocShare();	//设置完成继续设置下一个
			                }else{
				                showShareList();
		                    	// 普通消息提示条
								bootstrapQ.msg({
										msg : _Lang('设置完成') + '!',
										type : 'success',
										time : 2000,
									    });
			                }
			          }else{
							//设置失败
							configErrorConfirmHandler(docShare.userName, _Lang("设置失败", " : ", ret.msgInfo));
							return;
			            }
			      },
			      error : function () {
					  		//设置失败
					  		configErrorConfirmHandler(docShare.userName, _Lang("设置失败", " : ", "服务器异常"));
							return;
				 }	
			});				
	}
	
	//获取错误处理设置 
	function getConfigErrorConfirmSetting()
  	{
 		return configErrorConfirmSet;
  	}
  	
	//config Error Confirm
  	function configErrorConfirm(ShareName,errMsg)
  	{
  		var configErrorTimer = setTimeout(function () {	//超时用户没有动作，则直接继续
        	console.log("用户确认超时,继续配置其他分享");
        	configErrorConfirmSet = 1; //全局继续
        	closeBootstrapDialog("configErrorConfirm");
        	configErrorHanlder(ShareName,errMsg);
        },5*60*1000);	//5分鐘用戶不確認則關閉對話框
  		
		//弹出用户确认窗口
  		qiao.bs.confirm({
	    	id: 'configErrorConfirm',
	    	title: _Lang("确认操作"),
	        msg: ShareName + " " + _Lang("权限设置失败") + "("+errMsg+")," + _Lang("是否继续设置其他用户") + "？",
	        close: false,		
	        okbtn: _Lang("继续"),
	        qubtn: _Lang("退出"),
	    },function () {
	    	//alert("点击了确定");
			clearTimeout(configErrorTimer);			
	 		if(index < (totalNum-1))	//后续还有用户
            {
	      		var configErrorTimer1 = setTimeout(function () {	//超时用户没有动作，则直接覆盖
	            	console.log("用户确认超时,后续错误都继续设置");
	            	configErrorConfirmSet = 1; //全局继续上传
	            	closeBootstrapDialog("takeSameActionConfirm");
	            	configErrorHanlder(ShareName,errMsg);
	            },5*60*1000);	//5分鐘用戶不確認則關閉對話框
	 			
 	    	    qiao.bs.confirm({
 	    	    	id: 'takeSameActionConfirm3',
 	    	        msg: _Lang("后续错误是否执行此操作") + "？",
 	    	        close: false,		
 	    	        okbtn: _Lang("是"),
 	    	        qubtn: _Lang("否"),
 	    	    },function () {
 	    	    	//后续错误将不再弹出窗口
 	    	    	clearTimeout(configErrorTimer1);
 	    	    	configErrorConfirmSet = 1;	//全局覆盖
 	    	    	configErrorHandler(ShareName,errMsg); //reEnter config
  	 				return true;
 				},function(){
 					//后续错误将继续弹出错误确认窗口
 					clearTimeout(configErrorTimer1);
 	    	    	configErrorHandler(ShareName,errMsg);
  	 				return true;
 				});	
            }
	 		else
	 		{
         		configErrorHandler(ShareName,errMsg);
         		return;
	 		}
		},function(){
	    	//alert("点击了取消");
	    	clearTimeout(configErrorTimer);
      		configErrorConfirmSet = 2; //全局取消上传    	 		
	 		configErrorAbortHandler(ShareName,errMsg);
  		});
  	}
  	
  	//configErrorConfirmHandler
  	function configErrorConfirmHandler(ShareName,errMsg)
  	{
		console.log("设置失败" + errMsg);
		var confirm = getConfigErrorConfirmSetting();
		if(confirm == 1)
		{
			configErrorHandler(ShareName, errMsg);
		}
		else if(confirm == 2)	//结束上传
		{
			configErrorAbortHandler(ShareName, errMsg);
			return;
		}
		else
		{
			configErrorConfirm(ShareName, errMsg);
		}
  	}
  	
  	//configErrorHandler
  	function configErrorHandler(ShareName,errMsg)
  	{
  		failNum++;
		configNextShare();		 	
  	}
  	
  	//configErrorAbortHandler
  	function configErrorAbortHandler(ShareName,errMsg)
  	{
  		failNum++;
		configEndHandler();
  	}

  	//uploadSuccessHandler
  	function configSuccessHandler(name,msgInfo)
  	{
  		successNum++;
		configNextShare();
  	}
  	
  	//configEndHandler
  	function configEndHandler()
  	{
  		console.log("设置结束，共"+ totalNum +"，成功"+successNum+"个，失败"+failNum+"个！");
  		// 普通消息提示条
		bootstrapQ.msg({
				msg : _Lang('设置完成') + '!',
				type : 'success',
				time : 2000,
			    });
  	}
  	
  	//configNextDoc，如果后续有未上传文件则上传下一个文件 
	function configNextShare()
	{
		index++;
		if(index < totalNum)
		{
			configDocShare(); 
		}
		else
		{
			configEndHandler();
		}
	}

	//多文件move接口
	function configDocShares(docShares)	//多用户设置函数
	{
		console.log("configDocShares");
		ConfigDocShareSet(docShares);	//设置configDocShare Parameters

		//启动复制操作      		
		configDocShare();	//start set
	}
	
	//开放给外部的调用接口
    return {
        configDocShares: function(docShares){
        	configDocShares(docShares);
        },
        configDocShare: function(){
        	configDocShare();
        }
        
    };
})();