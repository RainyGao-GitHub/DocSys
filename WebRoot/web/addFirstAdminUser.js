function AddFirstAdminUserPageInit()
{
	//console.log($.cookie("dsuser"));
	//回车键监听函数
	EnterKeyListenerForAddFirstAdminUser();
	initDataRootCombo();
}

function closeAddFirstAdminUser(){
	console.log("closeAddFirstAdminUser");
	$("#dataRootDropdown").remove();
	$("#addFirstAdminUserdiv").remove();	//删除全屏遮罩
	$("#addFirstAdminUser").remove();	//删除对话框
}

//回车键监听函数
function EnterKeyListenerForAddFirstAdminUser(){
	var event=arguments.callee.caller.arguments[0]||window.event;//消除浏览器差异  
 	if (event.keyCode == 13){  
 		addFirstAdminUser();
 	}  
}
	
// ---------- MxsDoc 数据根目录（组合编辑框） ----------
var dataRootOptions = [];
var dataRootActiveIndex = -1;
var dataRootDropdownId = "dataRootDropdown";
var dataRootEventsBound = false;

function escapeDataRootHtml(value)
{
	if(value == null) return "";
	return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function initDataRootCombo()
{
	var input = $("#dataRoot");
	var toggle = $("#dataRootCombo .dataRootComboToggle");

	input.off(".dataRootCombo")
		.on("focus.dataRootCombo click.dataRootCombo", function () {
			openDataRootDropdown();
		})
		.on("input.dataRootCombo", function () {
			openDataRootDropdown();
			updateDataRootSelection();
		})
		.on("keydown.dataRootCombo", handleDataRootKeydown);

	toggle.off(".dataRootCombo")
		.on("mousedown.dataRootCombo", function (event) {
			event.preventDefault();
		})
		.on("click.dataRootCombo", function (event) {
			event.preventDefault();
			event.stopPropagation();
			if($("#" + dataRootDropdownId).is(":visible")) {
				closeDataRootDropdown();
			} else {
				input.focus();
				openDataRootDropdown();
			}
		});

	if(!dataRootEventsBound) {
		dataRootEventsBound = true;
		$(document).on("mousedown.dataRootCombo", function (event) {
			if($(event.target).closest("#dataRootCombo, #" + dataRootDropdownId).length === 0) {
				closeDataRootDropdown();
			}
		});
		$(window).on("resize.dataRootCombo", closeDataRootDropdown);
		window.addEventListener("scroll", handleDataRootScroll, true);
		$(document).off("hidden.bs.modal.dataRootCombo", "#addFirstAdminUser")
			.on("hidden.bs.modal.dataRootCombo", "#addFirstAdminUser", function () {
				closeDataRootDropdown();
				$("#" + dataRootDropdownId).remove();
			});
	}

	loadDataRootCandidates();
}

function loadDataRootCandidates()
{
	$.ajax({
		url : "/DocSystem/Manage/getDataRootCandidates.do",
		type : "post",
		dataType : "json",
		data : {},
		success : function (ret) {
			if("ok" == ret.status && ret.data) {
				var list = ret.data.candidates || [];
				dataRootOptions = [];
				for(var i=0; i<list.length; i++) {
					if(list[i] && list[i].root) {
						dataRootOptions.push(list[i].root);
					}
				}
				if($.trim($("#dataRoot").val()) == "" && ret.data.recommended) {
					$("#dataRoot").val(ret.data.recommended);
				}
				if($("#dataRoot").is(":focus")) {
					openDataRootDropdown();
				}
			}
		}
	});
}

function openDataRootDropdown()
{
	if(dataRootOptions.length == 0) {
		return;
	}
	var dropdown = $("#" + dataRootDropdownId);
	if(dropdown.length == 0) {
		dropdown = $('<div id="' + dataRootDropdownId + '" class="dataRootDropdown"></div>').appendTo("body");
		dropdown.on("mousedown", ".dataRootOption", function (event) {
			event.preventDefault();
			var index = parseInt($(this).attr("data-index"), 10);
			selectDataRootOption(index);
		});
	}
	renderDataRootDropdown();
	dropdown.show();
	positionDataRootDropdown();
}

function renderDataRootDropdown()
{
	var current = $.trim($("#dataRoot").val());
	var html = "";
	for(var i=0; i<dataRootOptions.length; i++) {
		var cls = "dataRootOption";
		if(dataRootOptions[i] === current) cls += " selected";
		if(i === dataRootActiveIndex) cls += " active";
		html += '<div class="' + cls + '" data-index="' + i + '">'
			+ escapeDataRootHtml(dataRootOptions[i]) + '</div>';
	}
	$("#" + dataRootDropdownId).html(html);
}

function positionDataRootDropdown()
{
	var input = document.getElementById("dataRoot");
	var dropdown = document.getElementById(dataRootDropdownId);
	if(!input || !dropdown) {
		return;
	}
	var rect = input.getBoundingClientRect();
	var width = Math.max(rect.width, 240);
	dropdown.style.width = width + "px";
	var height = dropdown.offsetHeight;
	var top = rect.bottom + 6;
	if(top + height > window.innerHeight - 8) {
		top = Math.max(8, rect.top - height - 6);
	}
	dropdown.style.left = Math.max(8, rect.left) + "px";
	dropdown.style.top = top + "px";
}

function setDataRootActive(index)
{
	if(dataRootOptions.length == 0) {
		return;
	}
	if(index < 0) index = dataRootOptions.length - 1;
	if(index >= dataRootOptions.length) index = 0;
	dataRootActiveIndex = index;

	var dropdown = $("#" + dataRootDropdownId);
	var options = dropdown.find(".dataRootOption");
	options.removeClass("active");
	var active = options.filter('[data-index="' + index + '"]');
	active.addClass("active");
	if(active.length > 0) {
		var element = active[0];
		var container = document.getElementById(dataRootDropdownId);
		if(element.offsetTop < container.scrollTop) {
			container.scrollTop = element.offsetTop;
		} else if(element.offsetTop + element.offsetHeight > container.scrollTop + container.clientHeight) {
			container.scrollTop = element.offsetTop + element.offsetHeight - container.clientHeight;
		}
	}
}

function selectDataRootOption(index)
{
	if(index < 0 || index >= dataRootOptions.length) {
		return;
	}
	$("#dataRoot").val(dataRootOptions[index]);
	$("#dataRoot").focus();
	closeDataRootDropdown();
}

function updateDataRootSelection()
{
	var current = $.trim($("#dataRoot").val());
	$("#" + dataRootDropdownId + " .dataRootOption").each(function () {
		var index = parseInt($(this).attr("data-index"), 10);
		if(index >= 0 && dataRootOptions[index] === current) {
			$(this).addClass("selected");
		} else {
			$(this).removeClass("selected");
		}
	});
}

function closeDataRootDropdown()
{
	var dropdown = $("#" + dataRootDropdownId);
	if(dropdown.length > 0) {
		dropdown.hide();
	}
	dataRootActiveIndex = -1;
}

function handleDataRootScroll(event)
{
	var target = event.target;
	if(target && $(target).closest("#" + dataRootDropdownId).length > 0) {
		return;
	}
	closeDataRootDropdown();
}

function handleDataRootKeydown(event)
{
	var dropdown = $("#" + dataRootDropdownId);
	var isOpen = dropdown.length > 0 && dropdown.is(":visible");

	if(event.keyCode == 40) { // ArrowDown
		event.preventDefault();
		event.stopPropagation();
		if(!isOpen) {
			openDataRootDropdown();
			setDataRootActive(0);
		} else {
			setDataRootActive(dataRootActiveIndex + 1);
		}
		return;
	}
	if(event.keyCode == 38) { // ArrowUp
		event.preventDefault();
		event.stopPropagation();
		if(!isOpen) {
			openDataRootDropdown();
			setDataRootActive(dataRootOptions.length - 1);
		} else {
			setDataRootActive(dataRootActiveIndex - 1);
		}
		return;
	}
	if(event.keyCode == 13) { // Enter
		if(isOpen) {
			event.preventDefault();
			event.stopPropagation();
			if(dataRootActiveIndex >= 0 && dataRootActiveIndex < dataRootOptions.length) {
				selectDataRootOption(dataRootActiveIndex);
			} else {
				closeDataRootDropdown();
			}
		}
		return;
	}
	if(event.keyCode == 27) { // Escape
		if(isOpen) {
			event.preventDefault();
			event.stopPropagation();
			closeDataRootDropdown();
		}
		return;
	}
	if(event.keyCode == 9) { // Tab
		closeDataRootDropdown();
	}
}
// ---------- 数据根目录 end ----------


//登录按键处理函数
function addFirstAdminUser(){
	console.log("addFirstAdminUser");
    var name = $('input[name="userName"]').val();
    if(name == "")
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("用户名不能为空"),
    	});
    	return;
    }
    
    var tel = $('input[name="tel"]').val();
    if(tel == "")
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("手机号不能为空"),
    	});
    	return;
    }

    var email = $('input[name="email"]').val();
    if(email == "")
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("邮箱不能为空"),
    	});
    	return;
    }
    
    var pwd = $('input[name="pwd"]').val();
	if(pwd == "")
	{
		showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("密码不能为空"),
    	});
    	return;
	}
    var pwd2 = $('input[name="pwd2"]').val();
    if(pwd != pwd2)
    {
    	showErrorMessage({
    		id: "idAlertDialog",	
    		title: _Lang("提示"),
    		okbtn: _Lang("确定"),
    		msg: _Lang("两次密码输入不一致") + "!",
    	});        	
    	return;
    }

    var dataRoot = $.trim($("#dataRoot").val());
    if(dataRoot == "")
    {
        showErrorMessage({
            id: "idAlertDialog",
            title: _Lang("提示"),
            okbtn: _Lang("确定"),
            msg: _Lang("请选择或输入数据根目录"),
        });
        return;
    }
	
    $("#submit").attr("disabled","disabled");
    
    $.ajax({
        url : "/DocSystem/Manage/addFirstAdminUser.do",
        type : "post",
        dataType : "json",
        data : {
             name : name,
             pwd : MD5(pwd),
             pwd2: MD5(pwd2),
             tel : tel,
             email : email,
             dataRoot : dataRoot,
        },
        success : function (ret) {
        	$("#submit").removeAttr("disabled");
            
            if( "ok" == ret.status ){
            	closeAddFirstAdminUser();
            	//弹出登录对话框
            	showLoginPanel();
            	loginUser =  $('input[name="userName"]').val();
            }else {
            	showErrorMessage({
            		id: "idAlertDialog",	
            		title: _Lang("提示"),
            		okbtn: _Lang("确定"),
            		msg: _Lang("添加系统管理员失败", ":" , ret.msgInfo),
            	});
            }
        },
        error : function () {
        	$("#submit").removeAttr("disabled");
        	showErrorMessage({
        		id: "idAlertDialog",	
        		title: _Lang("提示"),
        		okbtn: _Lang("确定"),
        		msg: _Lang("添加系统管理员失败", ":" , "服务器异常"),
        	});
        }
    });
}