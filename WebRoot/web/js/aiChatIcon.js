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
		var startX = 0, startY = 0, origX = 0, origY = 0, iconW = 60, iconH = 60;
		var dragMasks = [];

		//拖动期间给所有 iframe 盖透明遮罩（仿 zTree showIfameMask）：iframe 会捕获 mousemove/mouseup
		//导致图标拖进其区域后卡死、松手后从边缘瞬移；pointer-events:none 方案对 iframe 命中测试无效，必须物理遮挡
		function makeDragMasks() {
			var masks = [];
			var iframes = document.querySelectorAll("iframe");
			for(var i = 0; i < iframes.length; i++) {
				var r = iframes[i].getBoundingClientRect();
				if(r.width < 2 || r.height < 2) continue;	//隐藏的 iframe 无需遮盖
				var mask = document.createElement("div");
				//fixed + 视口坐标即可（拖动期间页面不滚动）；z-index 低于图标(9999)，高于 iframe 及页面内容
				mask.style.cssText = "position:fixed;left:" + r.left + "px;top:" + r.top
					+ "px;width:" + r.width + "px;height:" + r.height + "px;z-index:9997;background:transparent;";
				document.body.appendChild(mask);
				masks.push(mask);
			}
			return masks;
		}

		icon.addEventListener("mousedown", function(e) {
			if(e.button !== 0) return;
			started = true;
			dragging = false;
			lastUpWasDrag = false;	//新一轮按下，清除上一次的抑制标记
			startX = e.clientX;
			startY = e.clientY;
			//参照 zTree 拖动（干净代理元素无任何过渡）：拖动跟随走 transform（只触发合成，不重排/不重绘渐变阴影），
			//并临时禁掉 hover/:active 的 transform 过渡——否则快速拖动时鼠标在图标边界移进移出，
			//scale/rotate 会以 0.3s 缓动反复震荡，视觉上表现为卡顿
			icon.style.transition = "none";
			icon.style.transform = "scale(1)";
			iconW = icon.offsetWidth || 60;
			iconH = icon.offsetHeight || 60;
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
				dragMasks = makeDragMasks();
			}
			//视口内钳制；尺寸用 mousedown 时缓存的值，mousemove 内只写不读，避免每帧强制布局
			var nx = Math.max(0, Math.min(origX + dx, window.innerWidth - iconW));
			var ny = Math.max(0, Math.min(origY + dy, window.innerHeight - iconH));
			icon.style.transform = "translate(" + (nx - origX) + "px," + (ny - origY) + "px)";
		});

		document.addEventListener("mouseup", function() {
			if(!started) return;
			endDrag();
		});

		//兜底：鼠标移出窗口（Alt+Tab 等）时 mouseup 丢失，同样要结束拖动并还原样式
		window.addEventListener("blur", function() {
			if(started && dragging) endDrag();
		});

		function endDrag() {
			started = false;
			for(var i = 0; i < dragMasks.length; i++) { dragMasks[i].remove(); }
			dragMasks = [];
			if(dragging) {
				dragging = false;
				lastUpWasDrag = true;
				icon.style.cursor = "grab";
				document.body.style.userSelect = "";
				//落定：把 transform 位移折算进 left/top 后清掉 transform，恢复纯布局定位
				var rect = icon.getBoundingClientRect();
				icon.style.transform = "";
				applyPos(rect.left, rect.top);
				//transition 必须等 transform 清稳后再恢复（下一帧）：若在清 translate 前恢复，
				//"translate→无"会被浏览器当成一次 0.3s 过渡播放，图标表现为从拖动起点方向快速滑入落定点
				requestAnimationFrame(function() { icon.style.transition = ""; });
				try {
					localStorage.setItem(STORE_KEY, JSON.stringify({left: rect.left, top: rect.top}));
				} catch(e) {}
			} else {
				icon.style.transform = "";	//未拖动（纯点击）：恢复 hover/:active 的原生表现
				requestAnimationFrame(function() { icon.style.transition = ""; });
			}
		}

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
