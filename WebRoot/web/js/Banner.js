var Banner =  (function () {
	var BannerList = [];
	init();
	
	function init()
	{
		console.log("Banner init");
		//第一个默认banner
		var defaultBanner = {
				img: "/DocSystem/web/images/banner.jpg",
				href: null
		};
		BannerList.push(defaultBanner);
		
		//系统支持6个自定义轮播广告
		for( var i = 1 ; i < 7 ; i++ )
		{
			var bannerInfo = {};
			bannerInfo.img = "/DocSystem/web/images/local_banner/" + i + ".jpg";
			bannerInfo.href = null; 
			BannerList.push(bannerInfo);
		}
		
		var serverIP = getQueryString("serverIP");
		
		//获取官网的轮播图设置，并重新设置banner的背景和跳转链接
		$.ajax({
             url : "http://dw.gofreeteam.com/DocSystem/Manage/getBannerConfig.do",
             //url : "/DocSystem/Manage/getBannerConfig.do",
             type : "post",
             dataType : "json",
             data : {
            	 serverIP: serverIP,
             },
             success : function (ret) {
             	if( "ok" == ret.status){
             		//获取成功
                	console.log("获取轮播图设置成功 ret:", ret);
             		var bannerConfigList = ret.data;
             		if(bannerConfigList)
             		{
             			//根据官网的配置来修改banner配置
	             		for(var i=0; i<bannerConfigList.length; i++)
	             		{
	             			var bannerConfig = bannerConfigList[i];
	             			var index = bannerConfig.bannerIndex;
	             			console.log("bannerConfig index:" + index + " img:" + bannerConfig.img);
	             			if(index && index > 0 && index < 7) //1-6
	             			{
	             				var banner = document.getElementById("banner" + index);
	             				BannerList[index].img = bannerConfig.img;
	             				BannerList[index].href = bannerConfig.href;
	             				BannerList[index].openInNewPage = bannerConfig.openInNewPage;
	             				banner.style.backgroundImage = "url("+ bannerConfig.img +")";		             				
	             			}
	             		}
             		}		             		
            		return;
	            }
                else
                {
                	console.log("获取轮播图设置失败");
            		return false;
                }
            },
            error : function () {
            	console.log("获取轮播图设置异常");
	            return false;
            }
        });
	}
			
	function onclick(index)
	{
		console.log("Banner onclick index:" + index);
		var bannerInfo = BannerList[index];
		if(bannerInfo)
		{
			var href = bannerInfo.href;
			if(href && href != null)
			{
				console.log("Banner onclick href:" + href + " openInNewPage:" + bannerInfo.openInNewPage);
				if(!bannerInfo.openInNewPage || bannerInfo.openInNewPage != false)
				{
					window.open(href);   //新窗口打开						
				}
				else
				{
					window.location.href = href; //当前窗口打开
				}
			}
		}
	}
	
    return {
        init: function(){
        	init();
        },
        onclick: function(index){
        	onclick(index);
        },
    };		
})();