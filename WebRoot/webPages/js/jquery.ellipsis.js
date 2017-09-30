//段落省略号插件
;(function($){
    $.fn.ellipsis = function(options){
        //插件参数
        options = $.extend({
            //英文模式
            english : false,
            //优化系数
            OP_NUM: 1.3,
            //目标行数
            lineNum : 3,
        }, options);
        $(this).each(function(index, element) {
            //优化系数
            var OP_NUM = options.OP_NUM;
            //wrap
            var $wrap = $(this);
            //目标p
            var $p = $('p',$wrap);
            //行数
            var lineNum = options.lineNum;
            //最初整篇文章
            var originAll = $p.text();
             //字体大小
            var pFontSize = parseInt($p.css('font-size'));
              //行高
            var pLineHeight = parseInt($p.css('line-height'));
            // 过去宽度
            var oldWidth = $p.width();
            // 现在宽度
            var nowWidth = oldWidth;
            //根据行数设置wrap高度
            var wrapHeight = lineNum * pLineHeight;
            $wrap.height(wrapHeight);
            // 英文模式，字符偏多，系数*2.5
            OP_NUM = options.english ? 1.3*2.5 : 1.3;
            //首次加载先进行一次粗略筛选
            $p.text(originAll.slice(0,lineNum * nowWidth/pFontSize * OP_NUM));
            //主功能
            function render(){
                nowWidth = $p.width();
                //当页面放大时，粗略筛选
                if(nowWidth > oldWidth){
                    $p.text(originAll.slice(0,lineNum * nowWidth/pFontSize * OP_NUM));
                }
                oldWidth = nowWidth;
                //核心筛选
                while ($p.outerHeight() > wrapHeight) {
                    $p.text($p.text().replace(/\s?(\w+|\W{1,3})(\.{6})?$/, "......"));
                };
            }
            render();
            // 窗口拉伸;
            $(window).resize(function(){
                //利用异步将页面渲染操作合在一起
                setTimeout(render,0);
            })
        });
    };
})(jQuery);