var dialogList = {
    "add": function(id) {
        return window.TaskTab && TaskTab.add(id)
    },
    "focus": function(id) {
        return window.TaskTab && TaskTab.focus(id)
    },
    "close": function(id) {
        return window.TaskTab && TaskTab.close(id)
    },
    "title": function(id, text) {
        return window.TaskTab && TaskTab.title(id, text)
    },
    "dialogTab": function(id) {
        return window.TaskTab && TaskTab.dialogTab(id)
    }
}
    , bindTouchDrag = function($wrap) {
    if (("ontouchstart"in window || window.DocumentTouch && document instanceof DocumentTouch) && $.fn.drag) {
        function position(x, y) {
            $wrap.css({
                "left": x + startLeft,
                "top": y + startTop
            })
        }
        var startLeft, startTop;
        $wrap.find(".aui-title").drag({
            "start": function() {
                startLeft = parseInt($wrap.css("left")),
                    startTop = parseInt($wrap.css("top"))
            },
            "move": function(e, offsetx, offsety) {
                return position(offsetx, offsety),
                    $wrap.addClass("aui-state-drag"),
                    !1
            },
            "end": function(e, offsetx, offsety) {
                $wrap.removeClass("aui-state-drag"),
                    position(offsetx, offsety)
            }
        })
    }
};
!function($, window) {
    $.noop = $.noop || function() {}
    ;
    var _path, _count = 0, _$window = $(window), _$document = $(document), _$html = $("html"), _elem = document.documentElement, _isMobile = "createTouch"in document && !("onmousemove"in _elem) || /(iPhone|iPad|iPod|Android)/i.test(navigator.userAgent), _expando = "artDialog" + +new Date, artDialog = function(config, ok, cancel) {
        "string" != typeof (config = config || {}) && 1 !== config.nodeType || (config = {
            "content": config,
            "fixed": !_isMobile
        }),
        "undefined" != typeof LNG && (artDialog.defaults.title = LNG["common.tips"],
            artDialog.defaults.okVal = LNG["common.ok"],
            artDialog.defaults.cancelVal = LNG["common.cancel"]);
        var api, defaults = artDialog.defaults, elem = config.follow = 1 === this.nodeType && this || config.follow;
        for (var i in defaults)
            void 0 === config[i] && (config[i] = defaults[i]);
        if ($.each({
            "ok": "yesFn",
            "cancel": "noFn",
            "close": "closeFn",
            "init": "initFn",
            "okVal": "yesText",
            "cancelVal": "noText"
        }, function(i, o) {
            config[i] = void 0 !== config[i] ? config[i] : config[o]
        }),
        "string" == typeof elem && (elem = $(elem)[0]),
            config.id = elem && elem[_expando + "follow"] || config.id || _expando + _count,
        (api = artDialog.list[config.id]) && 0 == $("." + config.id).length && (api = null,
            delete artDialog.list[config.id],
            dialogList.close(config.id)),
        elem && api)
            return api.follow(elem).zIndex().focus();
        if (api)
            return api.zIndex().focus().display(!0),
            $.fn.flash && api.DOM.wrap.flash(),
                api;
        $.isArray(config.button) || (config.button = config.button ? [config.button] : []),
        void 0 !== ok && (config.ok = ok),
        void 0 !== cancel && (config.cancel = cancel),
        config.ok && config.button.push({
            "name": config.okVal,
            "callback": config.ok,
            "focus": !0
        }),
        config.cancel && config.button.push({
            "name": config.cancelVal,
            "callback": config.cancel
        }),
            artDialog.defaults.zIndex = config.zIndex,
            _count++,
        config && config.hasOwnProperty("title") && !1 !== config["title"] && (config.title = config.ico + config.title);
        var dialog = new artDialog.fn._init(config);
        return artDialog.list[config.id] = dialog,
        1 <= _count && config.displayTab && dialogList.add(config.id, config.title),
            dialog
    };
    artDialog.fn = artDialog.prototype = {
        "version": "4.1.7",
        "closed": !0,
        "_init": function(config) {
            var DOM, icon = config.icon, iconBg = icon && {
                "background-image": "url('" + config.path + icon + ".png')",
                "background-repeat": "no-repeat",
                "background-position": "center"
            };
            this.closed = !1,
                this.config = config,
            window.Events && Events.trigger("dialog.beforeShow", this),
                this.DOM = DOM = this._getDOM(),
            config.resize && 0 != config.title && DOM.wrap.addClass("dialog-can-resize"),
                DOM.wrap.find(".aui-content").addClass("can-select"),
            $.isIE8 && (config.animate = !1,
                this.config.animate = !1);
            if (config.title && (config.title = function(str) {
                try {
                    return decodeURIComponent(str)
                } catch (e) {
                    return str
                }
            }(config.title)),
            config.simple && 0 != config.title && (DOM.wrap.addClass("dialog-simple"),
                DOM.wrap.die("mouseenter").live("mouseenter", function() {
                    $(this).find(".aui-outer").addClass("dialog-mouse-in")
                }).live("mouseleave", function() {
                    $(this).find(".aui-outer").removeClass("dialog-mouse-in")
                })),
                DOM.wrap.find(".dialog-menu").attr("id", config.id),
                DOM.wrap.addClass(config.id),
                DOM.wrap.addClass("artDialog " + config.className),
                DOM.close[!1 === config.cancel ? "hide" : "show"](),
                DOM.icon[0].style.display = icon ? "" : "none",
                DOM["icon-bg"].css(iconBg || {
                    "background": "none"
                }),
                DOM.title.css("cursor", config.drag ? "move" : "auto"),
                DOM.main.css("padding", config.padding),
                DOM.wrap.data("artDialog", this),
            config.css && DOM.wrap.css(config.css),
                this.$main = DOM.wrap,
                this[config.show ? "show" : "hide"](!0),
                this.button(config.button).title(config.title).content(config.content, !0).size(config.width, config.height).time(config.time),
            "100%" == config.width && "100%" == config.height && DOM.wrap.addClass("dialog-max dialog-max-first"),
                config.follow ? this.follow(config.follow) : this.position(config.left, config.top),
            0 == $("." + config.id).length)
                return dialogList.close(config.id),
                    void this.close();
            this.zIndex().focus(),
            config.lock && this.lock(),
                this.resetDialogWidth();
            var $outer = $(DOM.wrap).find(".aui-outer");
            return $outer.width(),
                this.config.animate ? $outer.addClass(this.config.animateOpen) : $outer.removeClass("animated"),
                $outer.width(),
                this._addEvent(),
            config.init && config.init.call(this, window),
                DOM.title.css("height").replace("px", ""),
                $(DOM.wrap).find("iframe").focus(),
                bindTouchDrag($(DOM.wrap)),
            window.Events && Events.trigger("dialog.afterShow", this),
                this.throttle = function(fn, wait, context) {
                    var previous = 0
                        , timer = !1;
                    return function() {
                        clearTimeout(timer);
                        var now = parseInt((new Date).valueOf())
                            , args = arguments;
                        wait < now - previous ? (previous = now,
                            fn.apply(context, args)) : timer = setTimeout(function() {
                            previous = parseInt((new Date).valueOf()),
                                fn.apply(context, args)
                        }, wait)
                    }
                }
                ,
                this.debounce = function(fn, wait, context) {
                    var timer = !1;
                    return function() {
                        clearTimeout(timer);
                        var args = arguments;
                        timer = setTimeout(function() {
                            fn.apply(context, args)
                        }, wait)
                    }
                }
                ,
                this.dialogResize = this.throttle(this.dialogResize, 50, this),
                this.resetTitleLength = this.throttle(this.resetTitleLength, 50, this),
                this.resetTitleLength(),
                this
        },
        "resetDialogWidth": function() {
            var DOM = this.DOM;
            if ("auto" == $(DOM.wrap).get(0).style.width) {
                var size = Math.min(DOM.wrap.outerWidth(), DOM.wrap.find(".aui-border").outerWidth());
                $(DOM.wrap).css("min-width", size)
            }
        },
        "content": function(msg) {
            var prev, next, parent, display, that = this, DOM = that.DOM, wrap = DOM.wrap[0], width = wrap.offsetWidth, height = wrap.offsetHeight, left = parseInt(wrap.style.left), top = parseInt(wrap.style.top), cssWidth = wrap.style.width, $content = DOM.content, content = $content[0];
            if (that._elemBack && that._elemBack(),
            void 0 === msg)
                return content;
            if ("string" == typeof msg) {
                $content.html(msg);
                var $iframe = $content.find("iframe");
                if (0 < $iframe.length && $iframe.parent().is($content)) {
                    $content.append('<div class="aui-loading"><span>loading..</span></div>'),
                        DOM.wrap.find(".aui-loading").css({
                            "top": DOM.wrap.find(".aui-title").height() / 2
                        }),
                        $iframe.attr("allowTransparency", !0).attr("frameborder", "0").attr("allowfullscreen", "true").attr("webkitallowfullscreen", "true").attr("mozallowfullscreen", "true");
                    function load() {
                        clearTimeout(loadDelay),
                            $content.find(".aui-loading").fadeOut(600).remove(),
                            that.resetTitleLength()
                    }
                    $iframe.css("display", "none"),
                        $iframe.bind("load", load).bind("error", load),
                        $iframe.fadeIn(300);
                    var loadDelay = setTimeout(load, 15e3)
                }
            } else
                msg && 1 === msg.nodeType && (display = msg.style.display,
                    prev = msg.previousSibling,
                    next = msg.nextSibling,
                    parent = msg.parentNode,
                    that._elemBack = function() {
                        prev && prev.parentNode ? prev.parentNode.insertBefore(msg, prev.nextSibling) : next && next.parentNode ? next.parentNode.insertBefore(msg, next) : parent && parent.appendChild(msg),
                            msg.style.display = display,
                            that._elemBack = null
                    }
                    ,
                    $content.html(""),
                    content.appendChild(msg),
                    msg.style.display = "block");
            return arguments[1] || (that.config.follow ? that.follow(that.config.follow) : (left -= (width = wrap.offsetWidth - width) / 2,
                top -= (height = wrap.offsetHeight - height) / 2,
                wrap.style.left = Math.max(left, 0) + "px",
                wrap.style.top = Math.max(top, 0) + "px"),
            cssWidth && "auto" !== cssWidth && (wrap.style.width = wrap.offsetWidth + "px"),
                that._autoPositionType()),
                that._runScript(content),
                that
        },
        "title": function(text) {
            var DOM = this.DOM
                , wrap = DOM.wrap
                , title = DOM.title
                , className = "aui-state-no-title";
            return void 0 === text ? title[0] : (!1 === text ? (title.hide().html(""),
                wrap.addClass(className)) : (this.config.title = text,
                title.data("data-title", text),
            wrap.hasClass(className) && (wrap.removeClass(className),
                title.show()),
                this.resetTitleLength(),
                dialogList.title(this.config.id, text)),
                this)
        },
        "dialogResize": function() {
            var func = this.config && this.config.resizeCallback;
            func && func.apply(this),
                this._mainWidth = this.$main.width()
        },
        "resetTitleLength": function() {
            if (this.$main && this._mainWidth) {
                this._titleFontSize || (this._titleFontSize = parseInt(this.DOM.title.css("font-size")));
                var title = this.DOM.title
                    , fontSize = this._titleFontSize
                    , titleBefore = title.data("data-title")
                    , titleStr = titleBefore
                    , maxWidth = this._mainWidth - 160;
                if (this.config && !this.config.resize)
                    return title.html(titleStr);
                function stringWidth(str, fontSize) {
                    var width = 0
                        , text = htmlRemoveTags(str);
                    text = text.replace(/&nbsp;/g, " ");
                    for (var i = 0; i < text.length; i++) {
                        width += 128 < text[i].charCodeAt() ? fontSize : .5 * fontSize
                    }
                    return width
                }
                var htmlRemoveTags = function(str) {
                    return (str = str || "").replace(/<[^>]+>/g, "")
                }
                    , strWidth = stringWidth(titleStr, fontSize);
                if (strWidth < maxWidth || strWidth < 100)
                    return title.html(titleStr);
                var strPre = "";
                if (-1 != titleStr.indexOf("<")) {
                    var point = titleStr.lastIndexOf(">") + 1;
                    strPre = titleStr.substr(0, point),
                        titleStr = titleStr.substr(point)
                }
                for (; stringWidth(titleStr, fontSize) > maxWidth && !((titleStr = titleStr.substr(1)).length < 10); )
                    ;
                if (htmlRemoveTags(titleBefore) == titleStr)
                    return title.html(titleBefore);
                title.html(strPre + "..." + titleStr)
            }
        },
        "position": function(left, top) {
            var config = this.config
                , wrap = this.DOM.wrap[0]
                , isFixed = config.fixed
                , docLeft = _$document.scrollLeft()
                , docTop = _$document.scrollTop()
                , dl = isFixed ? 0 : docLeft
                , dt = isFixed ? 0 : docTop
                , ww = _$window.width()
                , wh = _$window.height()
                , ow = wrap.offsetWidth
                , oh = wrap.offsetHeight
                , style = wrap.style;
            return isFixed && (docTop = docLeft = 0),
            !left && 0 !== left || (this._left = -1 !== left.toString().indexOf("%") ? left : null,
                "number" == typeof (left = this._toNumber(left, ww - ow)) ? (left += docLeft,
                    style.left = Math.max(left, dl) + "px") : "string" == typeof left && (style.left = left)),
            !top && 0 !== top || (this._top = -1 !== top.toString().indexOf("%") ? top : null,
                "number" == typeof (top = this._toNumber(top, wh - oh)) ? (top += docTop,
                    style.top = Math.max(top, dt) + "px") : "string" == typeof top && (style.top = top)),
            void 0 !== left && void 0 !== top && (this._follow = null,
                this._autoPositionType()),
                this
        },
        "size": function(width, height) {
            this.config;
            var maxWidth, maxHeight, DOM = this.DOM, wrap = DOM.wrap, main = DOM.main, wrapStyle = wrap[0].style, style = main[0].style;
            return width && (this._width = -1 !== width.toString().indexOf("%") ? width : this._width,
                maxWidth = _$window.width() - wrap[0].offsetWidth + main[0].offsetWidth,
                "number" == typeof (width = this._toNumber(width, maxWidth)) ? (wrapStyle.width = "auto",
                    style.width = Math.max(this.config.minWidth, width) + "px",
                    wrapStyle.width = wrap[0].offsetWidth + "px") : "string" == typeof width && "auto" === (style.width = width) && wrap.css("width", "auto")),
            height && (this._height = -1 !== height.toString().indexOf("%") ? height : this._height,
                maxHeight = _$window.height() - wrap[0].offsetHeight + main[0].offsetHeight,
                "number" == typeof (height = this._toNumber(height, maxHeight)) ? style.height = Math.max(this.config.minHeight, height) + "px" : "string" == typeof height && (style.height = height)),
                this.dialogResize(),
                this
        },
        "follow": function(elem) {
            var $elem, config = this.config;
            if (("string" == typeof elem || elem && 1 === elem.nodeType) && (elem = ($elem = $(elem))[0]),
            !elem || !elem.offsetWidth && !elem.offsetHeight)
                return this.position(this._left, this._top);
            var expando = _expando + "follow"
                , winWidth = _$window.width()
                , winHeight = _$window.height()
                , docLeft = _$document.scrollLeft()
                , docTop = _$document.scrollTop()
                , offset = $elem.offset()
                , width = elem.offsetWidth
                , height = elem.offsetHeight
                , isFixed = config.fixed
                , left = isFixed ? offset.left - docLeft : offset.left
                , top = isFixed ? offset.top - docTop : offset.top
                , wrap = this.DOM.wrap[0]
                , style = wrap.style
                , wrapWidth = wrap.offsetWidth
                , wrapHeight = wrap.offsetHeight
                , setLeft = left - (wrapWidth - width) / 2
                , setTop = top + height
                , dl = isFixed ? 0 : docLeft
                , dt = isFixed ? 0 : docTop;
            return setLeft = setLeft < dl ? left : winWidth < setLeft + wrapWidth && dl < left - wrapWidth ? left - wrapWidth + width : setLeft,
                setTop = winHeight + dt < setTop + wrapHeight && dt < top - wrapHeight ? top - wrapHeight : setTop,
                style.left = setLeft + "px",
                style.top = setTop + "px",
            this._follow && this._follow.removeAttribute(expando),
                (this._follow = elem)[expando] = config.id,
                this._autoPositionType(),
                this
        },
        "button": function() {
            var that = this
                , ags = arguments
                , buttons = that.DOM.buttons
                , elem = buttons[0]
                , listeners = that._listeners = that._listeners || {}
                , list = $.isArray(ags[0]) ? ags[0] : [].slice.call(ags);
            return void 0 === ags[0] ? elem : ($.each(list, function(i, val) {
                var name = val.name
                    , isNewButton = !listeners[name]
                    , button = isNewButton ? document.createElement("button") : listeners[name].elem;
                listeners[name] || (listeners[name] = {}),
                val.callback && (listeners[name].callback = val.callback),
                val.className && (button.className = val.className),
                val.focus && (that._focus && that._focus.removeClass("aui-state-highlight"),
                    that._focus = $(button).addClass("aui-state-highlight"),
                    that.focus()),
                    button.setAttribute("type", "button"),
                    button[_expando + "callback"] = name,
                    button.disabled = !!val.disabled,
                isNewButton && (button.innerHTML = name,
                    listeners[name].elem = button,
                    elem.appendChild(button))
            }),
                buttons[0].style.display = list.length ? "" : "none",
                that)
        },
        "display": function(type) {
            var $wrap = this.DOM.wrap
                , $main = $(this.DOM.main[0]);
            if (null == type && (type = !0),
                !this.config.animate) {
                if (type) {
                    if (this.resetTitleLength(),
                        this.focus().zIndex(),
                    "hidden" != $wrap.css("visibility"))
                        return this;
                    $wrap.css({
                        "visibility": "visible"
                    }).fadeIn(100)
                } else {
                    if ("hidden" == $wrap.css("visibility"))
                        return this;
                    $wrap.fadeOut(100, function() {
                        $wrap.css({
                            "visibility": "hidden"
                        })
                    })
                }
                return this
            }
            var animateCss = "translation-200";
            $wrap.addClass(animateCss),
                setTimeout(function() {
                    $wrap.removeClass(animateCss)
                }, 200),
            this.hasFrame() && ($main.find(".aui-content").hide(),
                setTimeout(function() {
                    $main.find(".aui-content").fadeIn(100)
                }, 200));
            var $taskTab = dialogList.dialogTab(this.config.id);
            if (clearTimeout(this.displayShowDelay),
                clearTimeout(this.displayHideDelay),
                type) {
                if (this.resetTitleLength(),
                    this.focus().zIndex(),
                "hidden" != $wrap.css("visibility"))
                    return this;
                $taskTab && 0 < $taskTab.length && ($wrap.addClass("no-animate"),
                    $wrap.css({
                        "left": $taskTab.offset().left + "px",
                        "top": $taskTab.offset().top + "px",
                        "opacity": 0
                    }),
                    $wrap.removeClass("no-animate"),
                    $wrap.width()),
                this._lockMaskWrap && this._lockMaskWrap.fadeIn(),
                    $wrap.css({
                        "left": $wrap.data("initSize").left + "px",
                        "top": $wrap.data("initSize").top + "px",
                        "transform": "scale(1,1)",
                        "visibility": "visible",
                        "opacity": 1
                    }),
                    this.displayShowDelay = setTimeout(function() {
                        $wrap.css({
                            "transform": ""
                        })
                    }, 200)
            } else {
                if ("hidden" == $wrap.css("visibility"))
                    return this;
                this._lockMaskWrap && this._lockMaskWrap.fadeOut();
                var toWidth = .8 * $wrap.outerWidth()
                    , toLeft = -1
                    , toTop = -1;
                $taskTab && 0 < $taskTab.length && (toWidth = $taskTab.outerWidth(),
                    toLeft = $taskTab.offset().left,
                    toTop = $taskTab.offset().top);
                var scale = toWidth / $wrap.outerWidth();
                animateCss = {
                    "transform": "scale(" + scale + "," + scale + ")",
                    "opacity": 0
                };
                $wrap.data("initSize", {
                    "left": $wrap.context.offsetLeft,
                    "top": $wrap.context.offsetTop
                }),
                -1 == toLeft && -1 == toTop || (animateCss.left = toLeft - (1 - scale) * $wrap.outerWidth() / 2,
                    animateCss.top = toTop - (1 - scale) * $wrap.outerHeight() / 2),
                    $wrap.css(animateCss),
                    this.displayHideDelay = setTimeout(function() {
                        $wrap.css({
                            "visibility": "hidden"
                        })
                    }, 200)
            }
            return this
        },
        "resetIndex": function() {
            var dialogIndex = 0
                , dialogThis = !1;
            for (var key in artDialog.list) {
                var dialog = artDialog.list[key];
                if ("undefined" != typeof dialog.config) {
                    if (dialog.$main.is(":visible")) {
                        var thisIndex = dialog.config.zIndex;
                        dialogIndex < thisIndex && (dialogIndex = thisIndex,
                            dialogThis = dialog)
                    }
                } else
                    delete artDialog.list[key]
            }
            dialogThis && (dialogThis.focusDialog(),
                dialogThis.focus())
        },
        "hasFrame": function() {
            var $frame = this.DOM.wrap.find("iframe");
            return !!(0 < $frame.length && $frame.is(":visible"))
        },
        "refresh": function() {
            var frame = this.DOM.wrap.find("iframe")
                , src = frame.attr("src");
            try {
                frame.get(0).contentWindow.location.reload()
            } catch (e) {
                frame.attr("src", src)
            }
            return this
        },
        "openWindow": function() {
            var frame = this.DOM.wrap.find("iframe");
            return window.open(frame.attr("src")),
                this
        },
        "show": function() {
            return this.DOM.wrap.show(),
            !arguments[0] && this._lockMaskWrap && this._lockMaskWrap.show(),
                this
        },
        "hide": function() {
            return this.DOM.wrap.hide(),
            !arguments[0] && this._lockMaskWrap && this._lockMaskWrap.hide(),
                this
        },
        "close": function() {
            if (this.closed)
                return this;
            if (!1 === (this.config.closeBefore || $.noop).call(this, window))
                return !1;
            this.closed = !0;
            var that = this
                , DOM = that.DOM
                , wrap = DOM.wrap
                , list = artDialog.list
                , closeCallback = that.config.close;
            that.config.follow,
                $(this.DOM.main[0]);
            that.time(),
                that.unlock(),
            that.config && !1 !== that.config["title"] && dialogList.close(that.config.id),
            that.config && delete list[that.config["id"]];
            function closeThis() {
                for (var i in window.Events && Events.trigger("dialog.beforeClose", this),
                closeCallback && closeCallback.call(that, window),
                that._elemBack && that._elemBack(),
                    wrap[0].className = wrap[0].style.cssText = "",
                    DOM.title.html(""),
                    DOM.content.html(""),
                    DOM.buttons.html(""),
                artDialog.focus === that && (artDialog.focus = null),
                    that._removeEvent(),
                    that.hide(!0)._setAbsolute(),
                    that)
                    that.hasOwnProperty(i) && "DOM" !== i && delete that[i];
                return wrap.remove(),
                    that.resetIndex(),
                window.Events && Events.trigger("dialog.afterClose", this),
                    that
            }
            if (!that.config.animate)
                return closeThis();
            this.hasFrame();
            var addClass = "animated " + that.config.animateClose;
            wrap.width(),
                wrap.addClass(addClass).animate({
                    "bottom": 0
                }, {
                    "duration": 280,
                    "complete": function() {
                        return closeThis()
                    }
                })
        },
        "time": function(second) {
            var that = this
                , cancel = that.config.cancelVal
                , timer = that._timer;
            return timer && clearTimeout(timer),
            second && (that._timer = setTimeout(function() {
                that._click(cancel)
            }, 1e3 * second)),
                that
        },
        "focus": function() {
            try {
                if (this.config.focus) {
                    var elem = this._focus && this._focus[0] || this.DOM.close[0];
                    elem && elem.focus()
                }
            } catch (e) {}
            return this
        },
        "zIndex": function() {
            if (0 == $("." + this.config.id).length)
                return this.close();
            var index = artDialog.defaults.zIndex++;
            return this.DOM.wrap.css("zIndex", index),
                this.config.zIndex = index,
            this._lockMask && this._lockMask.css("zIndex", index - 1),
                this.focusDialog()
        },
        "focusDialog": function() {
            return !1 !== this.config.title && dialogList.focus(this.config.id),
            artDialog.focus && artDialog.focus.DOM.wrap.removeClass("aui-state-focus"),
                (artDialog.focus = this).DOM.wrap.addClass("aui-state-focus"),
                this
        },
        "lock": function() {
            if (this._lock)
                return this;
            var that = this
                , index = artDialog.defaults.zIndex - 1
                , wrap = that.DOM.wrap
                , config = that.config
                , docWidth = _$document.width()
                , docHeight = _$document.height()
                , lockMaskWrap = that._lockMaskWrap || $(document.body.appendChild(document.createElement("div")))
                , lockMask = that._lockMask || $(lockMaskWrap[0].appendChild(document.createElement("div")))
                , sizeCss = _isMobile ? "width:" + docWidth + "px;height:" + docHeight + "px" : "width:100%;height:100%";
            return that.zIndex(),
                wrap.addClass("aui-state-lock"),
                lockMaskWrap[0].style.cssText = sizeCss + ";position:fixed;z-index:" + index + ";top:0;left:0;overflow:hidden;",
                lockMask[0].style.cssText = "height:100%;background:" + config.background + ";filter:alpha(opacity=0);opacity:0",
                lockMask.stop(),
                lockMask.bind("click", function() {
                    that._reset(),
                        wrap.width(),
                        wrap.find(".animated").removeClass(config.animateOpen),
                        setTimeout(function() {
                            wrap.width(),
                                wrap.find(".animated").removeClass(config.animateOpen + " animated"),
                                wrap.width()
                        }, 400)
                }).bind("dblclick", function() {}),
                0 === config.duration ? lockMask.css({
                    "opacity": config.opacity
                }) : lockMask.animate({
                    "opacity": config.opacity
                }, config.duration),
                that._lockMaskWrap = lockMaskWrap,
                that._lockMask = lockMask,
                that._lock = !0,
                that
        },
        "unlock": function() {
            var lockMaskWrap = this._lockMaskWrap
                , lockMask = this._lockMask;
            if (!this._lock)
                return this;
            function un() {
                style.cssText = "display:none",
                    lockMaskWrap.remove()
            }
            var style = lockMaskWrap[0].style;
            return lockMask.stop().unbind(),
                this.DOM.wrap.removeClass("aui-state-lock"),
                this.config.duration ? lockMask.animate({
                    "opacity": 0
                }, this.config.duration, un) : un(),
                this._lock = !1,
                this
        },
        "_getDOM": function() {
            var wrap = document.createElement("div")
                , body = document.body;
            this.config.parentAt && 0 != $(this.config.parentAt).length && (body = $(this.config.parentAt).get(0)),
                wrap.style.cssText = "position:absolute;left:0;top:0",
                wrap.innerHTML = artDialog._templates,
                body.insertBefore(wrap, body.firstChild);
            for (var name, i = 0, DOM = {
                "wrap": $(wrap)
            }, els = wrap.getElementsByTagName("*"), elsLen = els.length; i < elsLen; i++)
                (name = els[i].className.split("aui-")[1]) && (DOM[name] = $(els[i]));
            return DOM
        },
        "_toNumber": function(thisValue, maxValue) {
            if (!thisValue && 0 !== thisValue || "number" == typeof thisValue)
                return thisValue;
            var last = thisValue.length - 1;
            return thisValue.lastIndexOf("px") === last ? thisValue = parseInt(thisValue) : thisValue.lastIndexOf("%") === last && (thisValue = parseInt(maxValue * thisValue.split("%")[0] / 100)),
                thisValue
        },
        "_runScript": function(elem) {
            for (var i = 0, n = 0, tags = elem.getElementsByTagName("script"), length = tags.length, script = []; i < length; i++)
                "text/dialog" === tags[i].type && (script[n] = tags[i].innerHTML,
                    n++);
            script.length && (script = script.join(""),
                new Function(script).call(this))
        },
        "_autoPositionType": function() {
            this[this.config.fixed ? "_setFixed" : "_setAbsolute"]()
        },
        "_setFixed": ($(function() {
                var bg = "backgroundAttachment";
                "fixed" !== _$html.css(bg) && "fixed" !== $("body").css(bg) && _$html.css({
                    "zoom": 1,
                    "backgroundAttachment": "fixed"
                })
            }),
                function() {
                    this.DOM.wrap[0].style.position = "fixed"
                }
        ),
        "_setAbsolute": function() {
            this.DOM.wrap[0].style.position = "absolute"
        },
        "_click": function(name) {
            var fn = this._listeners[name] && this._listeners[name].callback;
            return "function" != typeof fn || !1 !== fn.call(this, window) ? this.close() : this
        },
        "_clickMax": function() {
            var that = this
                , $wrap = this.DOM.wrap
                , $main = $(this.DOM.main[0]);
            if (that.config.animate && ($wrap.addClass("dialog-change-max"),
                setTimeout(function() {
                    $wrap.removeClass("dialog-change-max")
                }, 300),
                this.hasFrame())) {
                var $content = $main.find(".aui-content");
                $content.fadeOut(50),
                    setTimeout(function() {
                        $content.fadeIn(50)
                    }, 300)
            }
            if ($wrap.hasClass("dialog-max")) {
                var dataSize = $wrap.data("initSize");
                if ($wrap.removeClass("dialog-max"),
                    !dataSize) {
                    var winWidth = _$window.width()
                        , winHeight = _$window.height();
                    dataSize = {
                        "left": .1 * winWidth,
                        "top": .1 * winHeight,
                        "width": .8 * winWidth,
                        "height": .7 * winHeight,
                        "mainHeight": .7 * winHeight
                    }
                }
                that.size(dataSize.width, dataSize.height),
                    $wrap.css(dataSize),
                    $main.css("height", dataSize.mainHeight)
            } else {
                var dialogDom = $wrap.context
                    , size = {
                    "left": dialogDom.offsetLeft,
                    "top": dialogDom.offsetTop,
                    "width": $wrap.css("width"),
                    "height": $wrap.css("height"),
                    "mainHeight": $main.height()
                };
                $wrap.addClass("dialog-max"),
                $wrap.hasClass("dialog-min-size") || $wrap.data("initSize", size),
                    $wrap.css({
                        "left": 0,
                        "top": 0,
                        "width": _$window.width(),
                        "height": _$window.height()
                    });
                var headerHeight = $wrap.find(".aui-n").height() + $wrap.find(".aui-header").height()
                    , footerHeight = $wrap.find(".aui-s").height() + $wrap.find(".aui-footer").height();
                $wrap.hasClass("dialog-simple") && (headerHeight = 0);
                var mainHeight = _$window.height() - headerHeight - footerHeight;
                $main.css("height", mainHeight)
            }
            var resizeTimeAll = 0
                , resizeTimer = setInterval(function() {
                that.dialogResize(),
                300 <= (resizeTimeAll += 10) && (clearInterval(resizeTimer),
                    that._reset(),
                    that.resetTitleLength())
            }, 10);
            $wrap.removeClass("dialog-min-size")
        },
        "_clickMin": function() {
            var that = this
                , $wrap = $(this.DOM.wrap);
            window.TaskTab ? this.display(!1) : ($wrap.hasClass("dialog-max") && this._clickMax(),
                $wrap.toggleClass("dialog-min-size")),
                setTimeout(function() {
                    that.dialogResize(),
                        that.resetTitleLength()
                }, 0)
        },
        "_reset": function(test) {
            if (this.DOM.wrap.hasClass("dialog-max")) {
                var $wrap = $(this.DOM.wrap)
                    , headerHeight = $wrap.find(".aui-n").height() + $wrap.find(".aui-header").height()
                    , footerHeight = $wrap.find(".aui-s").height() + $wrap.find(".aui-footer").height();
                $wrap.hasClass("dialog-simple") && (headerHeight = 0);
                var mainHeight = _$window.height() - headerHeight - footerHeight
                    , mainOffset = parseInt($wrap.css("margin-top") || "0");
                return 0 < mainOffset && (mainHeight -= mainOffset),
                    $(this.DOM.wrap).css("width", $(window).width()),
                    $(this.DOM.main).css("height", mainHeight),
                    void this.dialogResize()
            }
            var oldSize = this._winSize || _$window.width() * _$window.height()
                , elem = this._follow
                , width = this._width
                , height = this._height;
            this._left,
                this._top;
            test && oldSize === (this._winSize = _$window.width() * _$window.height()) || ((width || height) && this.size(width, height),
            elem && this.follow(elem))
        },
        "_addEvent": function() {
            var resizeTimer, that = this, config = that.config, isIE = "CollectGarbage"in window, DOM = that.DOM;
            that._winResize = function() {
                resizeTimer && clearTimeout(resizeTimer),
                    resizeTimer = setTimeout(function() {
                        that._reset(isIE)
                    }, 10)
            }
                ,
                _$window.bind("resize", that._winResize),
                DOM.wrap.bind("click", function(event) {
                    var callbackID, target = event.target, $target = $(target);
                    if (target.disabled)
                        return !1;
                    $target.hasClass("aui-min") ? that._clickMin() : $target.hasClass("aui-max") ? that._clickMax() : $target.hasClass("aui-close") ? that._click(config.cancelVal) : (callbackID = target[_expando + "callback"]) && that._click(callbackID)
                }).bind("mousedown", function() {
                    that.zIndex()
                })
        },
        "_removeEvent": function() {
            this.DOM.wrap.unbind(),
                _$window.unbind("resize", this._winResize)
        }
    },
        artDialog.fn._init.prototype = artDialog.fn,
        $.fn.dialog = $.fn.artDialog = function() {
            var config = arguments;
            return this[this.live ? "live" : "bind"]("click", function() {
                return artDialog.apply(this, config),
                    !1
            }),
                this
        }
        ,
        artDialog.focus = null,
        artDialog.get = function(id) {
            return void 0 === id ? artDialog.list : artDialog.list[id]
        }
        ,
        artDialog.list = {},
        _$document.bind("keydown", function(event) {
            var nodeName = event.target.nodeName
                , api = artDialog.focus
                , keyCode = event.keyCode;
            !api || !api.config.esc || /^INPUT|TEXTAREA$/.test(nodeName) || api.config.resize || api.config.simple || 27 === keyCode && api._click(api.config.cancelVal)
        }),
        _path = window["_artDialog_path"] || function(script, i, me) {
            for (i in script)
                script[i].src && -1 !== script[i].src.indexOf("artDialog") && (me = script[i]);
            var thePath = (me = (me || script[script.length - 1]).src.replace(/\\/g, "/")).lastIndexOf("/") < 0 ? "." : me.substring(0, me.lastIndexOf("/"));
            return thePath += "/icons/"
        }(document.getElementsByTagName("script")),
        artDialog._templates = '<div class="aui-outer animated"><div class="aui-mask"></div><table class="aui-border"><tbody><tr><td class="aui-nw"></td><td class="aui-n"></td><td class="aui-ne"></td></tr><tr><td class="aui-w"></td><td class="aui-c"><div class="aui-inner"><table class="aui-dialog"><tbody><tr><td colspan="2" class="aui-header"><div class="aui-title-bar dialog-menu"><div class="aui-title"></div><div class="aui-btn-box"><a class="aui-min"></a><a class="aui-max"></a><a class="aui-close"></a></div></div></td></tr><tr><td class="aui-icon"><div class="aui-icon-bg"></div></td><td class="aui-main"><div class="aui-content"></div></td></tr><tr><td colspan="2" class="aui-footer"><div class="aui-buttons"></div></td></tr></tbody></table></div></td><td class="aui-e"></td></tr><tr><td class="aui-sw"></td><td class="aui-s"></td><td class="aui-se"></td></tr></tbody></table><div class="resize-handle resize-top" resize="top"></div><div class="resize-handle resize-right" resize="right"></div><div class="resize-handle resize-bottom" resize="bottom"></div><div class="resize-handle resize-left" resize="left"></div><div class="resize-handle resize-top-right" resize="top-right"></div><div class="resize-handle resize-bottom-right" resize="bottom-right"></div><div class="resize-handle resize-bottom-left" resize="bottom-left"></div><div class="resize-handle resize-top-left" resize="top-left"></div></div>',
        artDialog.defaults = {
            "content": "",
            "parentAt": "",
            "title": "消息",
            "button": null,
            "ok": null,
            "cancel": null,
            "init": null,
            "close": null,
            "okVal": "确定",
            "cancelVal": "取消",
            "width": "auto",
            "height": "auto",
            "minWidth": 96,
            "minHeight": 32,
            "padding": "0",
            "icon": null,
            "time": null,
            "esc": !0,
            "focus": !0,
            "show": !0,
            "follow": null,
            "path": _path,
            "lock": !1,
            "background": "#000",
            "opacity": .7,
            "duration": 300,
            "fixed": !1,
            "left": "50%",
            "top": "38.2%",
            "zIndex": 300,
            "displayTab": !0,
            "animate": !0,
            "animateOpen": "dialogShow",
            "animateClose": "dialogClose",
            "ico": "",
            "resize": !1,
            "drag": !0,
            "closeBefore": !1,
            "resizeCallback": !1
        },
        window.artDialog = $.dialog = $.artDialog = artDialog
}(this.art || this.jQuery && (this.art = jQuery), this),
    function($) {
        var _dragEvent, _use, _$window = $(window), _$document = $(document), _elem = document.documentElement, _isLosecapture = "onlosecapture"in _elem, _isSetCapture = "setCapture"in _elem;
        artDialog.dragEvent = function() {
            function proxy(name) {
                var fn = that[name];
                that[name] = function() {
                    return fn.apply(that, arguments)
                }
            }
            var that = this;
            proxy("start"),
                proxy("move"),
                proxy("end")
        }
            ,
            artDialog.dragEvent.prototype = {
                "onstart": $.noop,
                "start": function(event) {
                    return _$document.bind("mousemove", this.move).bind("mouseup", this.end),
                        this.onstart(event.clientX, event.clientY),
                        !1
                },
                "onmove": $.noop,
                "move": function(event) {
                    return this.onmove(event.clientX, event.clientY),
                        !1
                },
                "onend": $.noop,
                "end": function(event) {
                    return _$document.unbind("mousemove", this.move).unbind("mouseup", this.end),
                        this.onend(event.clientX, event.clientY),
                        !1
                }
            },
            preMouseUpTime = 0,
            _use = function(event) {
                var startWidth, startHeight, startLeft, startTop, isResize, startX, startY, screenWidth, screenHeight, api = artDialog.focus, DOM = api.DOM, wrap = DOM.wrap, title = DOM.title, main = DOM.main, clsSelect = "getSelection"in window ? function() {
                        window.getSelection().removeAllRanges()
                    }
                    : function() {
                        try {
                            document.selection.empty()
                        } catch (e) {}
                    }
                ;
                _dragEvent.onstart = function(x, y) {
                    startX = x,
                        startY = y,
                        screenHeight = $(window).height(),
                        screenWidth = $(window).width(),
                        startTop = (startLeft = (isResize && (startWidth = main[0].offsetWidth,
                            startHeight = main[0].offsetHeight),
                            wrap[0].offsetLeft),
                            wrap[0].offsetTop),
                        _$document.bind("dblclick", _dragEvent.end),
                        _isLosecapture ? title.bind("losecapture", _dragEvent.end) : _$window.bind("blur", _dragEvent.end),
                    _isSetCapture && title[0].setCapture(),
                        wrap.addClass("aui-state-drag"),
                        api.focus()
                }
                    ,
                    _dragEvent.onmove = function(x, y) {
                        if (!wrap.hasClass("dialog-max")) {
                            if (x = (x = screenWidth <= x ? screenWidth : x) <= 0 ? 0 : x,
                                y = (y = screenHeight <= y ? screenHeight : y) <= 0 ? 0 : y,
                                x -= startX,
                                y -= startY,
                                isResize) {
                                if (resizeDirection == undefined)
                                    return;
                                var wrapStyle = wrap[0].style
                                    , style = main[0].style
                                    , left = startLeft
                                    , top = startTop
                                    , width = startWidth
                                    , height = startHeight;
                                switch (resizeDirection) {
                                    case "top":
                                        top = y + top,
                                            height = -y + height;
                                        break;
                                    case "right":
                                        width = x + width;
                                        break;
                                    case "bottom":
                                        height = y + height;
                                        break;
                                    case "left":
                                        left = x + left,
                                            width = -x + width;
                                        break;
                                    case "top-left":
                                        left = x + left,
                                            top = y + top,
                                            width = -x + width,
                                            height = -y + height;
                                        break;
                                    case "top-right":
                                        top = y + top,
                                            width = x + width,
                                            height = -y + height;
                                        break;
                                    case "bottom-right":
                                        width = x + startWidth,
                                            height = y + startHeight;
                                        break;
                                    case "bottom-left":
                                        left = x + left,
                                            width = -x + startWidth,
                                            height = y + startHeight
                                }
                                left = left <= 0 ? 0 : left,
                                    top = top <= 0 ? 0 : top,
                                    wrapStyle.width = "auto",
                                    wrapStyle.width = wrap[0].offsetWidth + "px",
                                    wrapStyle.left = left + "px",
                                    wrapStyle.top = top + "px",
                                    style.width = Math.max(0, width) + "px",
                                    style.height = Math.max(0, height) + "px",
                                    api._width = width,
                                    api._height = height,
                                    api.resetTitleLength(),
                                    api.dialogResize()
                            } else {
                                (style = wrap[0].style).left = x + startLeft + "px",
                                    style.top = y + startTop + "px";
                                $(window).height() - (y + startTop) <= 50 && (style.top = $(window).height() - 50 + "px")
                            }
                            clsSelect()
                        }
                    }
                    ,
                    _dragEvent.onend = function(x, y) {
                        var theTime = parseInt((new Date).valueOf());
                        theTime - preMouseUpTime < 300 && api.config.resize ? api.$main.hasClass("dialog-min-size") ? api._clickMin() : api._clickMax() : preMouseUpTime = theTime,
                            _$document.unbind("dblclick", _dragEvent.end),
                            _isLosecapture ? title.unbind("losecapture", _dragEvent.end) : _$window.unbind("blur", _dragEvent.end),
                        _isSetCapture && title[0].releaseCapture(),
                        api.closed || api._autoPositionType(),
                            wrap.removeClass("aui-state-drag"),
                        1 <= $(DOM.wrap).find("iframe").length && $(DOM.wrap).find("iframe").focus()
                    }
                    ,
                    isResize = $(event.target).hasClass("resize-handle"),
                    resizeDirection = $(event.target).attr("resize"),
                    _dragEvent.start(event)
            }
            ,
            _$document.bind("mousedown", function(event) {
                if (1 != event.which)
                    return !0;
                var api = artDialog.focus;
                if (api) {
                    var target = event.target
                        , config = api.config
                        , DOM = api.DOM;
                    (!1 !== config.drag && target === DOM.title[0] || !1 !== config.resize && $(target).hasClass("resize-handle")) && (_dragEvent = _dragEvent || new artDialog.dragEvent,
                        _use(event))
                }
            })
    }(this.art || this.jQuery && (this.art = jQuery)),
    function($, window, artDialog) {
        var _topDialog, _proxyDialog, _zIndex, _data = "@ARTDIALOG.DATA", _open = "@ARTDIALOG.OPEN", _opener = "@ARTDIALOG.OPENER", _winName = window.name = window.name || "@ARTDIALOG.WINNAME" + +new Date;
        $(function() {
            window.jQuery || "BackCompat" !== document.compatMode || alert('artDialog Error: document.compatMode === "BackCompat"')
        });
        var _top = artDialog.top = function() {
            try {
                return share.frameTop()
            } catch (e) {
                return window
            }
        }();
        artDialog.parent = _top,
            _topDialog = _top.artDialog,
            _zIndex = function() {
                return _topDialog.defaults.zIndex
            }
            ,
            artDialog.data = function(name, value) {
                var top = artDialog.top
                    , cache = top[_data] || {};
                return top[_data] = cache,
                    void 0 === value ? cache[name] : (cache[name] = value,
                        cache)
            }
            ,
            artDialog.removeData = function(name) {
                var cache = artDialog.top[_data];
                cache && cache[name] && delete cache[name]
            }
            ,
            artDialog.through = _proxyDialog = function() {
                var api = _topDialog.apply(this, arguments);
                return _top !== window && (artDialog.list[api.config.id] = api),
                    api
            }
            ,
        _top !== window && $(window).bind("unload", function() {
            var config, list = artDialog.list;
            for (var i in list)
                list[i] && ((config = list[i].config) && (config.duration = 0),
                    list[i].close())
        }),
            artDialog.open = function(url, options, cache) {
                options = options || {};
                var api, DOM, $content, iframe, $iframe, $idoc, iwin, ibody, top = artDialog.top, loadCss = "width:100%;height:100%;border:none 0";
                if (!1 === cache) {
                    var ts = +new Date
                        , ret = url.replace(/([?&])_=[^&]*/, "$1_=" + ts);
                    url = ret + (ret === url ? (/\?/.test(url) ? "&" : "?") + "_=" + ts : "")
                }
                function load() {
                    var iWidth, iHeight, aConfig = api.config;
                    if (DOM.content.find(".aui-loading").remove(),
                        $content.addClass("aui-state-full"),
                        aConfig) {
                        try {
                            iwin = iframe.contentWindow,
                                $idoc = $(iwin.document),
                                ibody = iwin.document.body
                        } catch (e) {
                            return iframe.style.cssText = loadCss,
                                aConfig.follow ? api.follow(aConfig.follow) : api.position(aConfig.left, aConfig.top),
                            options.init && options.init.call(api, iwin, top),
                                void (options.init = null)
                        }
                        iWidth = "auto" === aConfig.width ? $idoc.width() + parseInt($(ibody).css("marginLeft")) : aConfig.width,
                            iHeight = "auto" === aConfig.height ? $idoc.height() : aConfig.height,
                            iframe.style.cssText = loadCss,
                            api.size(iWidth, iHeight),
                        $.browser.safari && setTimeout(function() {
                            $.artDialog.tips("", .01)
                        }, 10),
                        options.init && options.init.call(api, iwin, top),
                            options.init = null
                    }
                }
                var config = {
                    "zIndex": _zIndex(),
                    "init": function() {
                        DOM = (api = this).DOM,
                            DOM.main,
                            $content = DOM.content,
                            DOM.content.append('<div class="aui-loading"><span>loading..</span></div>'),
                            DOM.wrap.find(".aui-loading").css({
                                "top": DOM.wrap.find(".aui-title").height() / 2
                            }),
                            (iframe = api.iframe = top.document.createElement("iframe")).src = url,
                            iframe.name = "Open" + api.config.id,
                            iframe.style.cssText = "position:absolute;left:-9999em;top:-9999em;border:none 0;background:transparent",
                            iframe.setAttribute("frameborder", 0, 0),
                            iframe.setAttribute("allowTransparency", !0),
                            $iframe = $(iframe),
                            api.content().appendChild(iframe),
                            $iframe.attr("allowfullscreen", "true").attr("webkitallowfullscreen", "true").attr("mozallowfullscreen", "true"),
                            iwin = iframe.contentWindow;
                        try {
                            iwin.name = iframe.name,
                                artDialog.data(iframe.name + _open, api),
                                artDialog.data(iframe.name + _opener, window)
                        } catch (e) {}
                        $iframe.bind("load", load).bind("error", load),
                            setTimeout(load, 15e3)
                    },
                    "close": function() {
                        if ($iframe.css("display", "none").unbind("load", load),
                        options.close && !1 === options.close.call(this, iframe.contentWindow, top))
                            return !1;
                        $content.removeClass("aui-state-full"),
                            $iframe[0].src = "about:blank",
                            $iframe.remove();
                        try {
                            artDialog.removeData(iframe.name + _open),
                                artDialog.removeData(iframe.name + _opener)
                        } catch (e) {}
                    }
                };
                for (var i in "function" == typeof options.ok && (config.ok = function() {
                        return options.ok.call(api, iframe.contentWindow, top)
                    }
                ),
                "function" == typeof options.cancel && (config.cancel = function() {
                        return options.cancel.call(api, iframe.contentWindow, top)
                    }
                ),
                    delete options.content,
                    options)
                    void 0 === config[i] && (config[i] = options[i]);
                return _proxyDialog(config)
            }
            ,
            artDialog.open.api = artDialog.data(_winName + _open),
            artDialog.opener = artDialog.data(_winName + _opener) || window,
            artDialog.open.origin = artDialog.opener,
            artDialog.close = function() {
                var api = artDialog.data(_winName + _open);
                return api && api.close(),
                    !1
            }
            ,
        _top != window && $(document).bind("mousedown", function() {
            var api = artDialog.open.api;
            api && api.zIndex()
        }),
            artDialog.load = function(url, options, cache) {
                cache = cache || !1;
                var opt = options || {}
                    , config = {
                    "zIndex": _zIndex(),
                    "init": function(here) {
                        var api = this;
                        api.config;
                        $.ajax({
                            "url": url,
                            "success": function(content) {
                                api.content(content),
                                opt.init && opt.init.call(api, here)
                            },
                            "cache": cache
                        })
                    }
                };
                for (var i in delete options.content,
                    opt)
                    void 0 === config[i] && (config[i] = opt[i]);
                return _proxyDialog(config)
            }
            ,
            artDialog.alert = function(content, callback) {
                return _proxyDialog({
                    "id": "Alert",
                    "className": "dialog-alert-box",
                    "zIndex": _zIndex(),
                    "icon": "warning",
                    "padding": "30px 35px",
                    "left": "50%",
                    "top": "50%",
                    "fixed": !0,
                    "lock": !0,
                    "opacity": .2,
                    "content": content,
                    "ok": !0,
                    "close": callback
                })
            }
            ,
            artDialog.confirm = function(content, yes, no, okVal) {
                var options = {
                    "id": "Confirm",
                    "className": "dialog-confirm-box",
                    "zIndex": _zIndex(),
                    "icon": "question",
                    "fixed": !0,
                    "left": "50%",
                    "top": "50%",
                    "padding": "30px 20px",
                    "lock": !0,
                    "opacity": .2,
                    "content": content,
                    "ok": function(here) {
                        return yes.call(this, here)
                    },
                    "cancel": function(here) {
                        if (!1 !== no)
                            return no && no.call(this, here)
                    }
                };
                return okVal && (options.okVal = okVal,
                    options.className += " confirm-warning"),
                    _proxyDialog(options)
            }
            ,
            artDialog.prompt = function(content, yes, value) {
                var input;
                return value = value || "",
                    _proxyDialog({
                        "id": "Prompt",
                        "zIndex": _zIndex(),
                        "icon": "question",
                        "className": "dialog-prompt-box",
                        "fixed": !0,
                        "padding": "30px 35px",
                        "left": "50%",
                        "top": "50%",
                        "lock": !0,
                        "opacity": .2,
                        "content": ['<div style="margin-bottom:5px;font-size:12px">', content, "</div>", '<div class="prompt-input">', '<input value="', value, '" style="padding:6px 4px" />', "</div>"].join(""),
                        "init": function() {
                            (input = this.DOM.content.find("input")[0]).select(),
                                input.focus()
                        },
                        "ok": function(here) {
                            return yes && yes.call(this, input.value, here)
                        },
                        "cancel": !0
                    })
            }
            ,
            artDialog.tips = function(content, time) {
                return _proxyDialog({
                    "id": "Tips",
                    "zIndex": _zIndex(),
                    "title": !1,
                    "padding": 20,
                    "cancel": !1,
                    "fixed": !0,
                    "lock": !1
                }).content('<div style="padding: 0 1em;">' + content + "</div>").time(time || 1.5)
            }
            ,
            $(function() {
                var event = artDialog.dragEvent;
                if (event) {
                    $(window),
                        $(document);
                    var dragEvent = event.prototype
                        , mask = document.createElement("div")
                        , style = mask.style;
                    style.cssText = "display:none;position:fixed;left:0;top:0;width:100%;height:100%;cursor:move;filter:alpha(opacity=0);opacity:0;background:#FFF",
                        document.body.appendChild(mask),
                        dragEvent._start = dragEvent.start,
                        dragEvent._end = dragEvent.end,
                        dragEvent.start = function(e) {
                            var cursor = $(e.target).css("cursor");
                            $(mask).css({
                                "cursor": cursor
                            });
                            var DOM = artDialog.focus.DOM;
                            DOM.main[0],
                                DOM.content[0].getElementsByTagName("iframe")[0];
                            dragEvent._start.apply(this, arguments),
                                style.display = "block",
                                style.zIndex = artDialog.defaults.zIndex + 3
                        }
                        ,
                        dragEvent.end = function() {
                            artDialog.focus;
                            dragEvent._end.apply(this, arguments),
                                style.display = "none"
                        }
                }
            })
    }(this.art || this.jQuery, this, this.artDialog),
    $.artDialog.confirm2 = function(content, yes, no, okVal) {
        var numbers = [roundFromTo(1, 20), roundFromTo(1, 20)]
            , value = numbers[0] + numbers[1]
            , question = numbers[0] + "+" + numbers[1] + "="
            , text = window.LNG && window.LNG["common.confirmTips"] || "危险操作,请确认"
            , html = '<tr class="confirm-cell"><td colspan="2">\t\t<div class="confirm-tips"><span class="desc">' + text + "</span>: <b>" + question + '</b><input type="text"/></div></td></tr>'
            , dialog = $.artDialog.confirm(content, function() {
            return $input.val() != value ? ($input.val("").focus(),
                Tips.tips(text, "warning"),
                !1) : yes()
        }, no, okVal);
        $(html).insertAfter(dialog.$main.find(".aui-main").parent());
        var $main = dialog.$main
            , $ok = $main.find(".aui-state-highlight")
            , $input = $main.find(".confirm-tips input");
        $main.addClass("dialog-confirm2");
        function focus() {
            $input.focus()
        }
        return focus(),
            setTimeout(focus, 50),
            setTimeout(focus, 500),
            $input.bind("change keyup", function(e) {}),
            $input.bind("keyup", function(e) {
                "Enter" == e.key && $ok.trigger("click"),
                "Escape" == e.key && dialog.close()
            }),
            dialog
    }
;