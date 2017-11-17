;(function ($) {
    $.extend({
        /**
         * 获取鼠标移动的位置，改变DIV层的位置
         * @param obj  传入 document 元素  类名
         */
        'mouseMoveShow': function (obj) {
            var pageX = 0;
            var pageY = 0;
            var doc = $(document);
            var width = doc.width();
            var height = doc.height();
            var marginWidth = 5;
            var documentClass = $(obj);
            doc.mousemove(function (e) {
                pageX = e.pageX;
                pageY = e.pageY;
                if (pageX + documentClass.width() >= width) {
                    pageX = pageX - documentClass.width() - marginWidth;
                }
                if (pageY + documentClass.height() >= height) {
                    pageY = pageY - documentClass.height() - marginWidth;
                }
                //dblclick 双击 click 单击
                doc.on({
                    /**
                     * 右点击
                     * @param e
                     */
                    "mousedown": function (e) {
                        if (3 == e.which) {
                            documentClass.css({
                                'left': pageX,
                                'top': pageY
                            }).show();
                        }
                    },
                    /**
                     * 点击
                     */
                    "click": function () {
                        documentClass.hide();
                    }
                });
            });
        },
        /**
         * 禁用右键
         */
        'disabledContextMenu': function () {
            document.oncontextmenu = function () {
                return false;
            }
        }
        
    });

})(jQuery);