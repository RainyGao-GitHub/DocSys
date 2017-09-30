$(document).ready(function () {

    // tab切换, 只有一级的情况
    $("._nav_hover>._nav_bar").mouseenter(function(e){
        toggleTab($(this));
    }).click(function(e){
        e.preventDefault();
        toggleTab($(this));
    });

    $("._nav_click>._nav_bar").click(function(e){
        e.preventDefault();
        toggleTab($(this));
    });

    var toggleTab = function(el){
        var idx = el.index();

        // 切换menu状态
        el.parent().children("._nav_bar").removeClass("active");
        el.addClass("active");

        // 找到内容 及其 容器
        var container = el.parent().next().children("._nav_content");
        var content = container.eq(idx);

        // 原理: 先全部隐藏, 让内容先逐渐出现
        var showTab = function(container, content){
            container.hide();
            content.children().hide().fadeIn(200);
            content.show();
        }

        // 先判断要展现的content 内是否有内容,  如果没有, 需要先远程加载
        if(content.children().length == 0 ){
            var dataUrl = el.attr("data-url");
            if(dataUrl){
                $.get(dataUrl, function(html){
                    content.html(html);
                    showTab(container, content);

                    // 加载swiper, 首页专用
                    initSwiper(content);
                });
            }
        }else{
            showTab(container, content);
        }

    }

    // 初始化swiper
    var initSwiper = function(el){
        new Swiper(el, {
            nextButton: el.find('.swiper-button-next'),
            prevButton: el.find('.swiper-button-prev'),
        });
    }

    $('.swiper-container').each(function(){
        if($(this).children().length > 0 ){
            initSwiper($(this));
        }
    });

    $(".list-group-side-simple").hover(function (e) {
        e.preventDefault();
        $(this).parent().find(".list-group-side-full").removeClass("active").hide();
        $(this).parent().find(".list-group-side-simple").show();
        $(this).hide();
        $(this).prev().addClass("active").show();
    });

});

