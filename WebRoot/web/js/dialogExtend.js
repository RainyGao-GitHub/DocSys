var winWidth;
var winHeight;

var gIsPC = isPC();

function isPC() {
    var userAgentInfo = navigator.userAgent;
    var Agents = ["Android", "iPhone",
        "SymbianOS", "Windows Phone",
        "iPad", "iPod"];
    for (var v = 0; v < Agents.length; v++) {
        if (userAgentInfo.indexOf(Agents[v]) > 0) {
            return false;
        }
    }
    return true;
}

/**
 * 获取窗口宽度
 * @returns {number | *}
 */
function getWinWidth() {
    if (window.innerWidth) {
        winWidth = window.innerWidth;
    }
    else if ((document.body) && (document.body.clientWidth)) {
        winWidth = document.body.clientWidth;
    }
    return winWidth;
}

/**
 * 获取窗口高度
 * @returns {number | *}
 */
function getWinHeight() {
    if (window.innerHeight) {
        winHeight = window.innerHeight;
    }
    else if ((document.body) && (document.body.clientHeight)) {
        winHeight = document.body.clientHeight;
    }
    else {
        return winHeight;
    }
}

/**
 * 获取窗口最大宽度
 * @returns {number|*}
 */
function getArtDialogMaxWidth() {
    return getWinWidth();
}

/**
 * 空参判断
 * @param str 字符串
 * @returns {boolean} 空返回true,非空返回false
 */
function isEmpty(str) {
    return str === undefined || str === "";
}

/**
 * 非空判断
 * @param str 字符串
 * @returns {boolean} 空返回false,非空返回true
 */
function isNotEmpty(str) {
    return !isEmpty(str);
}
/**
 * 获取弹窗最大高度
 * @returns {number}
 */
function getArtDialogMaxHeight() {
    return getWinHeight() - 50;
}

/**
 * 获取弹出框初始化宽度
 * @returns {number}
 */
function getArtDialogInitWidth() {
    if (gIsPC) {
        return window.screen.width / 2;
    } else {
        return window.screen.width * 0.98;
    }
}

/**
 * 获取弹出框初始化高度
 * @returns {number}
 */
function getArtDialogInitHeight() {
    if (gIsPC) {
        return window.screen.height / 2;
    } else {
        return window.screen.height * 0.9;
    }
}

/**
 * dialog扩展初始化
 * @param docid        文档id
 * @param dialogObj 弹窗对象
 */
function dialogExtendInit(docid, dialogObj) {
    if (docid !== undefined && docid !== "") {
        // 给dialog追加一个dialog-can-resize类
        $("div[aria-labelledby='title:ArtDialog" + docid + "']").addClass("dialog-can-resize");
        // 获取当前初始化dialog
        var dialogHeaderEl = $("div[aria-labelledby='title:ArtDialog" + docid + "'] .ui-dialog-header");
        // 获取当前初始化dialog的title
        var dialogTitleEl = $(dialogHeaderEl.find(".ui-dialog-title"));
        // 将title区域设置为可移动标识
        dialogTitleEl.css("cursor", "move");
        // 隐藏关闭按钮，使用这种方式隐藏，该按钮的功能还是可用的，后面的按钮复用
        $(dialogHeaderEl.find("button.ui-dialog-close")).css("visibility", "hidden");
        // 追加三个按钮
        var btns = "";
        btns += "<div class='aui-btn-box'>";
        btns += "<a class='aui-min' style='position:relative'></a>";
        btns += "<a class='aui-max' style='position:relative'></a>";
        btns += "<a class='aui-close' style='position:relative'></a>";
        btns += "</div>";
        dialogTitleEl.append(btns);
        // 处理三个按钮居中显示
        dialogTitleEl.find(".aui-btn-box .aui-min, .aui-btn-box .aui-max, .aui-btn-box .aui-close").each(function (index, el) {
            $(el).css("margin", ((dialogTitleEl.innerHeight() - 30) / 2) + "px 0")
        });
        // 追加八个手动拖拽元素
        var dragEls = "";
        dragEls += '<div class="resize-handle resize-top" resize="top"></div>';
        dragEls += '<div class="resize-handle resize-right" resize="right"></div>';
        dragEls += '<div class="resize-handle resize-bottom" resize="bottom"></div>';
        dragEls += '<div class="resize-handle resize-left" resize="left"></div>';
        dragEls += '<div class="resize-handle resize-top-right" resize="top-right"></div>';
        dragEls += '<div class="resize-handle resize-bottom-right" resize="bottom-right"></div>';
        dragEls += '<div class="resize-handle resize-bottom-left" resize="bottom-left"></div>';
        dragEls += '<div class="resize-handle resize-top-left" resize="top-left"></div>';
        // 定位到.ui-dialog元素下并追加元素
        dialogTitleEl.parent().parent().parent().parent().parent().append(dragEls);

        // 给按钮绑定事件
        // 最小化
        $(dialogTitleEl.find(".aui-min")).bind("click", function (event) {
            dialogMin(docid, dialogObj, dialogTitleEl);
            // 停止冒泡
            event.stopPropagation();
        });
        // 最大化
        $(dialogTitleEl.find(".aui-max")).bind("click", function () {
            dialogMax(docid, dialogObj, dialogTitleEl)
        });
        // 关闭
        $(dialogTitleEl.find(".aui-close")).bind("click", function () {
            dialogClose(docid)
        });
        // 拖拉功能
        dialogToolsInit(docid);
    }
}

function dialogMin(docid, dialogObj, dialogTitleEl) {
    // 单击标题栏，则恢复dialog
    dialogTitleEl.parent().bind("click", function () {
        dialogTitleEl.parent().parent().parent().find("tr:not(:first)").each(function (index, el) {
            $(el).css("display", "block")
        });
        $(dialogTitleEl.find(".aui-btn-box")).css("visibility", "visible");
        $(dialogTitleEl.parent().find("button.ui-dialog-close")).css("visibility", "hidden");
        // 将绑定事件取消
        dialogTitleEl.parent().unbind("click");
    });
    // 隐藏内容区域
    dialogTitleEl.parent().parent().parent().find("tr:not(:first)").each(function (index, el) {
        $(el).css("display", "none");
    });
    // 隐藏按钮区域
    $(dialogTitleEl.find(".aui-btn-box")).css("visibility", "hidden");
    // 开启关闭按钮
    $(dialogTitleEl.parent().find("button.ui-dialog-close")).css("visibility", "visible");

}

/**
 * 设置指定dialog全屏
 *
 * @param docid 对话框唯一id
 * @param dialogObj 对话框对象
 * @param dialogTitleEl 对话框对应标题栏元素
 */
function dialogMax(docid, dialogObj, dialogTitleEl) {
    // 获取原始对话框的宽高
    var dialogEl = $(dialogObj.node);
    var resetWidth = dialogEl.innerWidth();
    var resetHeight = dialogEl.innerHeight();
    // 设置全屏
    var height = getArtDialogMaxHeight();
    var width = getArtDialogMaxWidth();
    dialogObj.width(width);
    dialogObj.height(height);
    // 将全屏按钮替换为恢复按钮
    var dialogMaxEl = $(dialogTitleEl.find(".aui-max"));
    dialogMaxEl.removeClass("aui-max");
    dialogMaxEl.addClass("aui-resize");
    dialogMaxEl.unbind("click");
    dialogMaxEl.bind("click", function () {
        dialogResize(docid, dialogObj, dialogTitleEl, resetWidth, resetHeight)
    })
}

/**
 * 恢复dialog为默认大小
 *
 * @param docid 对话框唯一id
 * @param dialogObj 对话框对象
 * @param dialogTitleEl 对话框对应标题栏元素
 * @param resetWidth 原始宽度
 * @param resetHeight 原始高度
 */
function dialogResize(docid, dialogObj, dialogTitleEl, resetWidth, resetHeight) {
    // 获取最大和默认初值的dialog宽高
    var maxHeight = getArtDialogMaxHeight();
    var maxWidth = getArtDialogMaxWidth();
    var minHeight = getArtDialogInitHeight();
    var minWidth = getArtDialogInitWidth();
    // 最大高度和最大宽度限制
    resetHeight = resetHeight >= maxHeight ? maxHeight : resetHeight;
    resetWidth = resetWidth >= maxWidth ? maxWidth : resetWidth;
    // 重置高度和宽度相等的情况下则取默认初始dialog高度
    if (resetHeight === maxHeight && resetWidth === maxWidth) {
        resetHeight = minHeight;
        resetWidth = minWidth;
    }
    dialogObj.width(resetWidth);
    dialogObj.height(resetHeight);
    // 将恢复按钮替换为全屏按钮
    var dialogResizeEl = $(dialogTitleEl.find(".aui-resize"));
    dialogResizeEl.removeClass("aui-resize");
    dialogResizeEl.addClass("aui-max");
    dialogResizeEl.unbind("click");
    dialogResizeEl.bind("click", function () {
        dialogMax(docid, dialogObj, dialogTitleEl)
    })
}

/**
 * 关闭dialog
 */
function dialogClose(docid) {
    $("div[aria-labelledby='title:ArtDialog" + docid + "'] .ui-dialog-header button.ui-dialog-close").click();
}

function DialogExtends() {
    // 确定dialog的唯一id
    this.docid = undefined;
    // 起始坐标x
    this.startX = 0;
    // 起始坐标y
    this.startY = 0;
    // 当前鼠标坐标X
    this.currentX = 0;
    // 当前鼠标坐标Y
    this.currentY = 0;
    // 激活的拖动工具栏：top,right,bottom,left,top-right,bottom-right,bottom-left,top-left
    this.active;
    // 拖动栏辅助变量
    this.dialogEl = undefined;
    this.artDialogIframe = undefined;
    this.maxWidth = 0;
    this.maxHeight = 0;
    this.minHeight = 0;
    this.minWidth = 0;
    this.startTop = 0;
    this.startLeft = 0;
    this.startHeight = 0;
    this.startWidth = 0;
    this.offsetY = 0;
    this.absOffsetY = 0;
    this.offsetX = 0;
    this.absOffsetX = 0;
    // 弹窗偏移后的实际width,height,top,left
    this.dialogWidth = 0;
    this.dialogHeight = 0;
    this.dialogTop = 0;
    this.dialogLeft = 0;
    // 宽度偏移量
    this.offsetWidth = 0;
    // 高偏移量
    this.offsetHeight = 0;
    // 顶部偏移量
    this.offsetTop = 0;
    // 左侧偏移量
    this.offsetLeft = 0;
    // 初始化方法
    this.init = function(docid) {
        if (docid === undefined || docid === "") {
            return;
        }
        // 1.初始化部分变量
        this.docid = docid;
        // 拖动范围限制
        this.maxWidth = getArtDialogMaxWidth();
        this.maxHeight = getArtDialogMaxHeight();
        this.minHeight = getArtDialogInitHeight();
        this.minWidth = getArtDialogInitWidth();
    };
    this.updateDialogStyle = function() {
        if (this.active !== undefined && this.active !== "") {
            console.log(this.docid + "..." + this.active);
            this.dialogEl = $("div[aria-labelledby='title:ArtDialog" + this.docid + "']");
            this.artDialogIframe = $("iframe[name='ArtDialog" + this.docid + "']");

            // 获取当前dialog的top高度和开始高度
            this.startTop = parseFloat(this.dialogEl.css("top"));
            this.startLeft = parseFloat(this.dialogEl.css("left"));
            this.startHeight = this.dialogEl.innerHeight();
            this.startWidth = this.dialogEl.innerWidth();

            // 获取偏移量，鼠标的y轴减去dialog开始的y起点
            this.offsetY = this.currentY - this.startY;
            this.absOffsetY = Math.abs(this.offsetY);
            this.startY = this.currentY;

            // 获取偏移量，鼠标的y轴减去dialog开始的y起点
            this.offsetX = this.currentX - this.startX;
            this.absOffsetX = Math.abs(this.offsetX);
            this.startX = this.currentX;

            // 改变dialogEl的高度和top偏移
            if (this.active === 'top') {
                this.updateDialogTopStyle();
            }
            if (this.active === 'bottom') {
                this.updateDialogBottomStyle();
            }
            if (this.active === 'left') {
                this.updateDialogLeftStyle();
            }
            if (this.active === 'right') {
                this.updateDialogRightStyle();
            }
            if (this.active === 'top-left') {
                this.updateDialogTopStyle();
                this.updateDialogLeftStyle();
            }
            if (this.active === 'top-right') {
                this.updateDialogTopStyle();
                this.updateDialogRightStyle();
            }
            if (this.active === 'bottom-left') {
                this.updateDialogBottomStyle();
                this.updateDialogLeftStyle();
            }
            if (this.active === 'bottom-right') {
                this.updateDialogBottomStyle();
                this.updateDialogRightStyle();
            }
            // 刷新样式
            this.refresh();
        }
    };
    this.refresh = function() {
        if (this.active === 'top') {
            this.dialogEl.css("top", this.dialogTop + "px");
            this.dialogEl.css("height", this.dialogHeight + "px");
            this.artDialogIframe.css("height", this.dialogHeight + "px");
        }
        if (this.active === 'bottom') {
            this.dialogEl.css("height", this.dialogHeight + "px");
            this.artDialogIframe.css("height", this.dialogHeight + "px");
        }
        if (this.active === 'left') {
            this.dialogEl.css("left", this.dialogLeft + "px");
            this.dialogEl.css("width", this.dialogWidth + "px");
            this.artDialogIframe.css("width", this.dialogWidth + "px");
        }
        if (this.active === 'right') {
            this.dialogEl.css("width", this.dialogWidth + "px");
            this.artDialogIframe.css("width", this.dialogWidth + "px");
        }
        if (this.active === 'top-left') {
            this.dialogEl.css("top", this.dialogTop + "px");
            this.dialogEl.css("height", this.dialogHeight + "px");
            this.artDialogIframe.css("height", this.dialogHeight + "px");
            this.dialogEl.css("left", this.dialogLeft + "px");
            this.dialogEl.css("width", this.dialogWidth + "px");
            this.artDialogIframe.css("width", this.dialogWidth + "px");
        }
        if (this.active === 'top-right') {
            this.dialogEl.css("top", this.dialogTop + "px");
            this.dialogEl.css("height", this.dialogHeight + "px");
            this.artDialogIframe.css("height", this.dialogHeight + "px");
            this.dialogEl.css("width", this.dialogWidth + "px");
            this.artDialogIframe.css("width", this.dialogWidth + "px");
        }
        if (this.active === 'bottom-left') {
            this.dialogEl.css("height", this.dialogHeight + "px");
            this.artDialogIframe.css("height", this.dialogHeight + "px");
            this.dialogEl.css("left", this.dialogLeft + "px");
            this.dialogEl.css("width", this.dialogWidth + "px");
            this.artDialogIframe.css("width", this.dialogWidth + "px");
        }
        if (this.active === 'bottom-right') {
            this.dialogEl.css("height", this.dialogHeight + "px");
            this.artDialogIframe.css("height", this.dialogHeight + "px");
            this.dialogEl.css("width", this.dialogWidth + "px");
            this.artDialogIframe.css("width", this.dialogWidth + "px");
        }
    };
    this.updateDialogTopStyle = function() {
        if (this.offsetY > 0) {
            // 向下移动，最大限制dialog窗口高度为184px，到最大限制，则只调整top
            this.offsetHeight = this.startHeight - this.absOffsetY;
            if (this.dialogHeight + this.offsetHeight >= this.minHeight) {
                this.dialogHeight = this.offsetHeight;
            }
            this.dialogTop = this.startTop + this.absOffsetY;
            this.startY = this.currentY;
        } else {
            // 向上移动，最小限制dialog窗口的top为0
            this.offsetTop = this.startTop - this.absOffsetY;
            if (this.offsetTop >= 0) {
                this.dialogHeight = this.startHeight + this.absOffsetY;
                this.dialogTop = this.offsetTop;
            }
        }
    };
    this.updateDialogBottomStyle = function() {
        if (this.offsetY > 0) {
            // 向下移动，只调整height，top不变
            this.dialogHeight = this.startHeight + this.absOffsetY;
        } else {
            // 向上移动，只调整height，top不变，最高限制184
            this.offsetHeight = this.startHeight - this.absOffsetY;
            if (this.offsetHeight >= this.minHeight) {
                this.dialogHeight = this.offsetHeight;
            }
        }
    };
    this.updateDialogLeftStyle = function(){
        if (this.offsetX > 0) {
            // 向右移动，减小width，增大left，
            this.offsetWidth = this.startWidth - this.absOffsetX;
            if(this.offsetWidth >= this.minWidth) {
                this.dialogWidth = this.offsetWidth;
            }
            this.dialogLeft = this.startLeft + this.absOffsetX;
        } else {
            // 向左移动，加大width，减小left，加上left为0的限制
            this.dialogWidth = this.startWidth - this.absOffsetX;
            this.offsetLeft = this.startLeft - this.absOffsetX;
            if (this.offsetLeft >= 0) {
                this.dialogWidth = this.startWidth + this.absOffsetX;
                this.dialogLeft = this.offsetLeft;
            }
        }
    };
    this.updateDialogRightStyle = function () {
        if (this.offsetX > 0) {
            // 向右移动，增大width
            this.offsetWidth = this.startWidth + this.absOffsetX;
            this.offsetLeft = this.startLeft + this.absOffsetX;
            if(this.offsetWidth + this.offsetLeft <= this.maxWidth) {
                this.dialogWidth = this.offsetWidth;
            }
        } else {
            // 向左移动，减小width
            this.offsetWidth = this.startWidth - this.absOffsetX;
            if(this.offsetWidth >= this.minWidth) {
                this.dialogWidth = this.offsetWidth;
            }
        }
    }
}
// 弹窗拖拉结束触发事件
function dialogMouseup(evt,dialogExtends) {
    dialogExtends.active = "";
    // 停止冒泡
    evt.stopPropagation();
}
// 弹窗拖拉过程触发事件
function dialogMouseMove(evt,dialogExtends) {
    dialogExtends.currentX = evt.pageX;
    dialogExtends.currentY = evt.pageY;
    dialogExtends.updateDialogStyle();
    // 停止冒泡
    evt.stopPropagation();
}
// 弹窗拖拉开启触发事件
function dialogMouseDown(evt,dialogExtends,_this) {
    dialogExtends.startX = evt.pageX;
    dialogExtends.startY = evt.pageY;
    if(dialogExtends.active === undefined || dialogExtends.active === "") {
        dialogExtends.active = _this.getAttribute("resize");
    }
    // 停止冒泡
    evt.stopPropagation();
}
// 弹窗拖拉事件绑定方法
function dialogBindEventsInit(docid,dialogExtends) {
    // 1.获取需要绑定事件的元素
    var dialogEl = $("div[aria-labelledby='title:ArtDialog" + docid + "']");
    var topEl = $(dialogEl.find(".resize-top"));
    var rightEl = $(dialogEl.find(".resize-right"));
    var bottomEl = $(dialogEl.find(".resize-bottom"));
    var leftEl = $(dialogEl.find(".resize-left"));
    var topRightEl = $(dialogEl.find(".resize-top-right"));
    var bottomRightEl = $(dialogEl.find(".resize-bottom-right"));
    var bottomLeftEl = $(dialogEl.find(".resize-bottom-left"));
    var topLeftEl = $(dialogEl.find(".resize-top-left"));
    var iframeEl = $("iframe[name='ArtDialog" + docid + "']")[0];
    var artDialogIframe = $(iframeEl.contentWindow);
    iframeEl.contentWindow.dialogExtends = this;
    var $window = $(window.document);

    // 2.给document绑定一个鼠标移动事件，绑定一个鼠标松开事件
    $window.bind("mousemove", function (evt) {
        dialogMouseMove(evt, dialogExtends)
    });
    $window.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });

    // 3.给ifreme加一个鼠标移动和鼠标放下事件
    artDialogIframe.bind("mousemove", function (evt) {
        dialogMouseMove(evt, dialogExtends)
    });
    artDialogIframe.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });

    // 4.给8个方向的元素添加鼠标按下事件
    topEl.bind("mousedown", function (evt) {
        dialogMouseDown(evt, dialogExtends, this)
    });
    rightEl.bind("mousedown", function (evt) {
        dialogMouseDown(evt, dialogExtends, this)
    });
    bottomEl.bind("mousedown", function (evt) {
        dialogMouseDown(evt, dialogExtends, this)
    });
    leftEl.bind("mousedown", function (evt) {
        dialogMouseDown(evt, dialogExtends, this)
    });
    topRightEl.bind("mousedown", function (evt) {
        dialogMouseDown(evt, dialogExtends, this)
    });
    bottomRightEl.bind("mousedown", function (evt) {
        dialogMouseDown(evt, dialogExtends, this)
    });
    bottomLeftEl.bind("mousedown", function (evt) {
        dialogMouseDown(evt, dialogExtends, this)
    });
    topLeftEl.bind("mousedown", function (evt) {
        dialogMouseDown(evt, dialogExtends, this)
    });

    // 5.给8个方向的元素添加鼠标抬起事件
    topEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });
    rightEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });
    bottomEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });
    leftEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });
    topRightEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });
    bottomRightEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });
    bottomLeftEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });
    topLeftEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });

    // 6.给dialog本身绑定一个鼠标移动事件，绑定一个鼠标松开事件
    dialogEl.bind("mousemove", function (evt) {
        dialogMouseMove(evt, dialogExtends)
    });
    dialogEl.bind("mouseup", function (evt) {
        dialogMouseup(evt, dialogExtends)
    });
}
function dialogToolsInit(docid) {
    var dialogExtends = new DialogExtends();
    // 初始化绑定拖拉事件
    dialogBindEventsInit(docid,dialogExtends);
    // 初始化
    dialogExtends.init(docid);
}