/**
 * AI 悬浮图标通用行为（projects/project 四页共用）：
 *  1. 图标可拖动：位移超过 5px 阈值才算拖动，纯点击仍触发页面上的 openAiChat()
 *  2. 位置记忆：localStorage 保存拖动后位置，刷新/重进页面后恢复
 *  3. AI_CHAT_ZINDEX：Agent 弹窗置顶层级常量，供各页内联的 openAiChat() 使用
 */
window.AI_CHAT_ZINDEX = 9998;	//高于业务弹窗（artDialog 自增序列/modal 1040/上传面板 999 等），低于右键菜单(9999)与 layer 提示(19891014)等系统级 UI

(function() {
	var ICON_ID = "ai-chat-icon";
	var STORE_KEY = "aiChatIconPos";
	var DRAG_SQUARE = 25;	//位移平方阈值（5px），小于它视为点击

	function init() {
		var icon = document.getElementById(ICON_ID);
		if(!icon) return;

		icon.style.cursor = "grab";

		//把图标摆到视口内指定位置（fixed 定位，四边钳制防止拖丢）
		function applyPos(left, top) {
			var w = icon.offsetWidth || 60;
			var h = icon.offsetHeight || 60;
			left = Math.max(0, Math.min(left, window.innerWidth - w));
			top = Math.max(0, Math.min(top, window.innerHeight - h));
			icon.style.left = left + "px";
			icon.style.top = top + "px";
			icon.style.right = "auto";
			icon.style.bottom = "auto";	//初始定位是 bottom:30px，改用 top 前必须清掉
		}

		//恢复记忆位置（越界值会被 applyPos 钳回视口，窗口缩小后图标不会丢失）
		try {
			var pos = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
			if(pos && isFinite(pos.left) && isFinite(pos.top)) {
				applyPos(pos.left, pos.top);
			}
		} catch(e) {}

		var started = false, dragging = false, lastUpWasDrag = false;
		var startX = 0, startY = 0, origX = 0, origY = 0;

		icon.addEventListener("mousedown", function(e) {
			if(e.button !== 0) return;
			started = true;
			dragging = false;
			lastUpWasDrag = false;	//新一轮按下，清除上一次的抑制标记
			startX = e.clientX;
			startY = e.clientY;
			var rect = icon.getBoundingClientRect();
			origX = rect.left;
			origY = rect.top;
			e.preventDefault();	//避免拖动时选中页面文本
		});

		document.addEventListener("mousemove", function(e) {
			if(!started) return;
			var dx = e.clientX - startX, dy = e.clientY - startY;
			if(!dragging) {
				if(dx*dx + dy*dy < DRAG_SQUARE) return;
				dragging = true;
				icon.style.cursor = "grabbing";
				document.body.style.userSelect = "none";
			}
			applyPos(origX + dx, origY + dy);
		});

		document.addEventListener("mouseup", function() {
			if(!started) return;
			started = false;
			if(dragging) {
				dragging = false;
				lastUpWasDrag = true;
				icon.style.cursor = "grab";
				document.body.style.userSelect = "";
				//记忆拖动后位置
				var rect = icon.getBoundingClientRect();
				try {
					localStorage.setItem(STORE_KEY, JSON.stringify({left: rect.left, top: rect.top}));
				} catch(e) {}
			}
		});

		//拖动结束后的那次 click 不应打开弹窗：capture 阶段拦截（早于 onclick 属性执行）
		icon.addEventListener("click", function(e) {
			if(lastUpWasDrag) {
				lastUpWasDrag = false;
				e.stopPropagation();
				e.preventDefault();
			}
		}, true);
	}

	//本脚本在 body 上部引入，图标元素在其后，需等 DOM 就绪再绑定
	if(document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", init);
	} else {
		init();
	}
})();
