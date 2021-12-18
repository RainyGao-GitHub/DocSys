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