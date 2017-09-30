/**
 * 包含功能 : 注册, 账号密码登录, 短信登录
 */

;(function( $ ) {

    var plugin = {
        id        : "_uniq_login_panel_id",
        version   : "1.0.0",
        elemEvent : null,
        success   : ""
    };

    $.fn.loginPanel = function() {
        plugin.elemEvent = this;

        // TODO: 判断当前用户状态, 如果已经登录, 则执行默认方法
        if(localStorage ) {
            var authTarget = localStorage['auth-target'];
            if($.cookie('access_token') && authTarget && authTarget.length > 0){
                var elId = "#"+authTarget;
                console.log("trigger task :" + authTarget);
                localStorage['auth-target'] = null;
                $(elId).trigger('click');
            }
        }

        // 事件绑定
        plugin.elemEvent.on('click', function(e){
            e.preventDefault();
            plugin.success = plugin.elemEvent.attr("after-auth");
            if(plugin.success == undefined)
                plugin.success = "";

            var selector = "#" + plugin.id;
            if($(selector).length>0){
                // 调用reset, 清除已经填的内容, 以及验证码等
                showPanel();
                e.stopImmediatePropagation();
                return;
            }

            // validate options
            var optValidate = {
                submitHandler : function(form){
                    var elem = $(form).find("input");
                    $(form).ajaxSubmit({
                        success: logonHandler,
                        error: function(res){
                            errorHandler(res, elem);
                        }
                    });
                },
                onkeyup    : false,
                onfocusout : false,
                messages   : {
                    name : {
                        required : "请输入姓名",
                        rangelength : "请输入真实姓名, 至少2个字"
                    },
                    phoneNumber :{
                        required : "请输入11位中国大陆手机号",
                        digits : "请输入11位中国大陆手机号",
                        rangelength : "请输入11位中国大陆手机号",
                    },
                    account :{
                        required : "请输入11位中国大陆手机号",
                        digits : "请输入11位中国大陆手机号",
                        rangelength : "请输入11位中国大陆手机号",
                    },
                    smsCode :{
                        required : "请输入正确的短信验证码",
                        digits : "请输入正确的短信验证码",
                        rangelength : "请输入正确的短信验证码"
                    },
                    password :{
                        required : "请输入6位以上密码",
                        rangelength : "请输入6位以上密码"
                    },

                    _term : {
                        required: "请同意服务协议"
                    }
                },
                showErrors: function(map, list) {
                    $.each(list, function(index, error) {
                        showError(error.element, error.message);
                        return false;
                    });
                }
            };

            // 加载HTML
            $.get("/account/layout/login_v2.html?" + plugin.version, function(html){
                plugin.el = $(html);
                plugin.el.attr("id", plugin.id);

                setTimeout(function(){
                    plugin.el.find("input[name=password]").attr("type", "password");
                }, 500);

                // 关闭弹窗
                plugin.el.on("click", ".fa-close", hidePanel);

                // 切换登录方式, 需要在html中加上.tog-login
                plugin.el.on("click", ".modal-subtitle .tog-login", toggleLogin);

                // 是否同意协议
                plugin.el.on("click", "input[name=_term]", toggleTerm);

                // 格式校验绑定

                plugin.el.formReg     = plugin.el.find("#_form_reg");
                plugin.el.formLogin   = plugin.el.find("#_form_login");
                plugin.el.valLoginSms = plugin.el.find("#_form_login_sms");

                plugin.el.valReg      = plugin.el.formReg.validate(optValidate);
                plugin.el.valLogin    = plugin.el.formLogin.validate(optValidate);
                plugin.el.valLoginSms = plugin.el.valLoginSms.validate(optValidate);

                // 输入信息实时绑定, 检测手机号是否注册过, 或者需要验证码
                plugin.el.on("change", "input[name=phoneNumber], input[name=account]", checkAccount);

                // 绑定短信发送
                plugin.el.on("click", "a.vercode", sendSms);

                // 刷新验证码
                plugin.el.on("click", ".vercode-img img", refreshCaptcha);


                plugin.el.appendTo('body').fadeIn();
            });
            e.stopImmediatePropagation();
        });

        var logonHandler = function(data){

            // 兼容以前的代码, 写入到cookie中
            if(data.token){
                $.cookie('access_token', data.token, { path:'/' });
                $.cookie('user_id', data.userId, { path:'/' });
            }

            window.location.reload();
            return;


            switch(plugin.success){
                case "refresh":
                    window.location.reload();
                    break;

                case "refresh-do":
                    //刷新后再执行相关操作
                    if(localStorage){
                        localStorage['auth-target'] = plugin.elemEvent.attr('id');
                        window.location.reload();
                        break;
                    }
                    console.error('用户验证完成后，不能刷新界面后执行相关操作，因为浏览器不支持localStorage');
                    break;

                case "do-refresh":
                    var clickHandlers = $._data(plugin.elemEvent,'events').click;
                    if(clickHandlers && clickHandlers.length > 1){
                        $.each(clickHandlers,function(i,event){
                            if(event.handler){
                                event.handler(e);
                            }
                        });
                    }
                    setTimeout(function(){
                        window.location.reload();
                    },700);
                    break;

                default:
                    var clickHandlers = $._data(plugin.elemEvent,'events').click;
                    if(clickHandlers && clickHandlers.length > 1){
                        $.each(clickHandlers,function(i,event){
                            if(event.handler){
                                event.handler(e);
                            }
                        })
                    } else {
                        var href  = plugin.elemEvent.attr('href');
                        if(href && href.length > 0){
                            window.location = href;
                        }
                    }
                    break;
            }
        }

        var toggleTerm = function(){
            var elem = $(this);
            var btn = elem.parents("form").find("button[type=submit]");
            if(elem.is(":checked")){
                btn.removeAttr("disabled");
            }else{
                btn.attr("disabled", "disabled");
            }
        }

        var showPanel = function(){
            plugin.el.fadeIn(function(){
                // 刷新验证码
                showCaptcha($(".vercode-img img:visible").parents("form"));
            });
        }

        var hidePanel = function(){
            plugin.el.fadeOut(function(){
                plugin.el.valReg.resetForm();
                plugin.el.valLogin.resetForm();
                plugin.el.valLoginSms.resetForm();
            });
        }

        var refreshCaptcha = function(){
            var form = $(this).parents("form");
            showCaptcha(form);
        }

        var sendSms = function(e){
            e.preventDefault();

            // 检查手机号是否正确
            var form = $(this).parents("form");
            var elem = form.find("input[name=phoneNumber], input[name=account]");
            if(!elem.valid())
                return;

            var smsType = elem.attr("name") == "phoneNumber" ? "Register" : "Login";
            var reqData = {type : smsType, phone: elem.val()};
            var captchaCode = form.find("input[name=captchaCode]").val();
            if(captchaCode != ""){
                var captchaKey = form.find("input[name=captchaKey]").val();
                reqData.captchaKey = captchaKey;
                reqData.captchaCode = captchaCode;
            }

            $.ajax("/api/sms/request", {
                type: "POST",
                data : reqData,
                success:function(data){
                    if(data.trId){
                        form.find("input[name=trId]").val(data.trId);
                        // 60秒倒计时
                        var counter = form.find("span.vercode em i");
                        counter.text("60");
                        setTimeout(function(){
                            var left = parseInt(counter.text());
                            if(left <= 1){
                                form.find(".vercode").toggle();
                            }else{
                                counter.text(left - 1);
                                setTimeout(arguments.callee, 1000);
                            }
                        }, 1000);

                        form.find(".vercode").toggle();
                    }
                },
                error: function(res){
                    errorHandler(res, elem);
                }

            });
        }

        var errorHandler = function(res, elem){
            data = res.responseJSON;
            switch (data.errorCode) {
                case 20012:
                    var form = elem.parents("form");
                    showCaptcha(form);
                    showError(elem, data.errorDesc);
                    break;
                case 20005:
                    showError(elem, "请求异常, 请检查输入后提交");
                    break;
                default:
                    showError(elem, data.errorDesc);
                    break;
            }
        }

        var showCaptcha = function(form){
            var elemKey  = form.find("input[name=captchaKey]");
            if(elemKey.val() == ""){
                var rand = (Math.random()+"").substring(2);
                elemKey.val(rand);
                form.find(".vercode-img img").attr("src",  "/captcha/" + elemKey.val());
            }else{
                form.find(".vercode-img img").attr("src", "/captcha/" + elemKey.val() + "?" + Math.random());
            }
            elemKey.parents(".form-group").fadeIn();
        }

        // 切换两种登录方式
        var toggleLogin = function(e){
            e.preventDefault();
            var row = $(this).parents(".col-md-6 .row");
            row.hide().siblings().show();
        }

        // 实时检查手机, 如果是手机号, 则发送请求到服务器, 判断是否已注册, 以及是否需要图形验证码
        var checkAccount = function(e){
            e.preventDefault();
            var val = $(this).val();
            // console.log("elValid:" + $(this).valid());
            if($(this).valid()){
                // TODO: 实时检查手机号, 显示验证码
                // showCaptcha(form)
                // 如果手机号改变, 则清空验证码
                $(this).parents("form").find("input[name=smsCode]").val("");
            }
        }

        var showError = function(elem, message){
            var warning = $(elem).parents("form").find(">.text-warning").text(message).fadeIn();
            setTimeout(function(){
                warning.fadeOut();
            }, 4000);
            $(elem).focus();
        }


        return this;
    };

}( jQuery ));