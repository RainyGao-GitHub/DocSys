/**
 * 使用统计 - 页面活动上报
 *
 * 背景：管理后台「使用统计」需要推断"用户在线时长"。系统日志原本只在写操作/管理操作时产生，
 *       用户不点「退出」就统计不出时长，所以这里在用户真的在使用页面时定时上报一次活动。
 *
 * 服务端（/DocSystem/User/activityReport.do）只在距上次记录超过 20 分钟时才落一条 activity 日志，
 * 所以日志量很小（每个活跃用户每 20 分钟最多 1 条），且必须小于服务端的会话空闲阈值(30分钟)，
 * 否则一个会话会被误切成多段。
 *
 * ★ 关闭该功能：把 USAGE_ACTIVITY_REPORT_ENABLED 置 false，
 *   或去掉 project.js / main.js 里对 UsageActivityReporterInit() 的调用。
 */
var USAGE_ACTIVITY_REPORT_ENABLED = true;				//总开关
var USAGE_ACTIVITY_REPORT_INTERVAL = 5 * 60 * 1000;		//本地轮询间隔
var USAGE_ACTIVITY_IDLE_LIMIT = 10 * 60 * 1000;			//距上次用户操作超过该值就不上报（避免"人走了、标签页还开着"被算成在线）

function UsageActivityReporterInit()
{
	if(!USAGE_ACTIVITY_REPORT_ENABLED)
	{
		return;
	}

	var lastInteractionTime = new Date().getTime();
	$(document).on("mousemove keydown click scroll touchstart", function(){
		lastInteractionTime = new Date().getTime();
	});

	function reportActivity()
	{
		//标签页不可见、或用户已经很久没有任何操作 → 不上报（顺带也不会把会话续命）
		if(document.visibilityState && document.visibilityState != "visible")
		{
			return;
		}
		if(new Date().getTime() - lastInteractionTime > USAGE_ACTIVITY_IDLE_LIMIT)
		{
			return;
		}

		$.ajax({
			url : "/DocSystem/User/activityReport.do",
			type : "post",
			dataType : "json",
			data : {},
			success : function () {
			},
			error : function () {
			}
		});
	}

	//立即上报一次（记录"打开页面"这个动作），之后定时上报
	reportActivity();
	setInterval(reportActivity, USAGE_ACTIVITY_REPORT_INTERVAL);
}
