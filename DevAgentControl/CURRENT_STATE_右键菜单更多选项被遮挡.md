# CURRENT_STATE_右键菜单更多选项被遮挡（任务卡）

> 状态：**已实施+已验证（2026-11-20），待用户实测确认后提交**（代码已改于工作区+已同步 dev 8100 部署目录；浏览器全场景验收通过，见文末实施记录）
> Issue：https://gitee.com/RainyGao/DocSys/issues/IKWXMH（【优化】project页面里右键菜单-更多选项被遮挡）
> 归属：**主仓库前端**（WebRoot/web/static/ContextJS/ 下 vendored 第三方库 js+css 为主 + 引用页版本号），后端不动

## 一句话

project 页右键菜单悬停"更多..."展开的子菜单很高（实测 379px），固定从触发项顶部**向下**展开（纯 CSS `top:0`），当父级菜单位于屏幕下半部时子菜单伸出可视区底部——用户看到"更多选项被遮挡"。目标（issue 原文规则）：**子菜单底部会超过父级菜单底部时，改用底部对齐（向上展开）**。

## 根因（2026-11-20 调研 + 实测，行号为当时快照）

菜单实现 = vendored 第三方库 ContextJS（Jacob Kelley, MIT，本仓已带 Rainy 修改痕迹）：
- JS：`WebRoot/web/static/ContextJS/js/context.js`（210 行）——`buildMenu` 把 subMenu 渲染为嵌套 `<ul class="dropdown-context-sub">` 挂在 `<li class="dropdown-submenu">` 内、append 到 body
- CSS：`WebRoot/web/static/ContextJS/css/context.standalone.css`（215 行）

**三层链路**：
1. **子菜单定位纯 CSS、只向下**（context.standalone.css:127-135）：`.dropdown-submenu > .dropdown-menu { top:0; left:100%; margin-top:-6px }`——锚定触发项顶部、向下展开；`:136-138` 的 `.drop-left { left:-100% }` 只处理**水平**越界
2. **JS 只有水平碰撞检测**（context.js:33-41，init 里的 delegate mouseenter）：`(subWidth+subLeft) > window.innerWidth → addClass('drop-left')`——**没有任何垂直方向处理**
3. **主菜单 auto 翻转的缓冲不够**（context.js:127-140 showMenu / :165-177 showMenuOffset，`above:'auto'`）：`autoH = $dd.height() + 160`（160 = 注释里的"height of subMenu"预估），仅保证**父菜单自身**翻转到页内；实测"更多"子菜单 379px（31 个 li 含嵌套"备注"二级子菜单），远超 160 → 父菜单可见但子菜单伸出屏幕

**实测取证（dev 8100，project.html?vid=1，视口 720px，合成 contextmenu pageY=60 → 菜单向下展开）**：
- 父菜单 top 72 → bottom 576（高 504）
- "更多" li：512 → 538（项高 26）；子菜单 379px 高 / 160px 宽
- 子菜单向下展开：top 506 → **bottom 885** = **超视口底 165px、超父菜单底 308px** ← 与 issue 截图现象一致
- 按底部对齐反推：子菜单 top 应为 ~576-379=197（或锚 li 底 538 → 顶 153），完全页内 ✓ 规则可行

**触发面**：不只 doclist 菜单——project.js 里 6 处 `{text: _Lang('更多')+'...', subMenu:[...]}`（:5393/:5646/:5882/:6114/:6370/:6577，doclist/zTree/空白处等各右键菜单）+ reposManager/shareManager/zipViewer 等页面也用同一库；修复应落在库层（一处生效全部）。

## 改造设计要点

1. **改哪里（推荐方案）**：仿 `drop-left` 既有模式，垂直方向加 `drop-up`：
   - **context.js:33-41 mouseenter** 补垂直检测：子菜单底（`$sub.offset().top + $sub.outerHeight()`）> 父级菜单底（`$sub.closest('.dropdown-context').offset().top + .outerHeight()`，closest 取**直接父级菜单**——对嵌套"备注"二级子菜单语义同样正确）→ `$sub.addClass('drop-up')`
   - **context.standalone.css:136-138 旁**加：`.dropdown-submenu > .dropdown-menu.drop-up { top:auto; bottom:-6px; }`（与 `margin-top:-6px` 对称，锚触发项底部向上展开）
   - **关闭清理**：context.js:24-26 fadeOut 回调里 `.find('.drop-left').removeClass('drop-left')` 同步补 drop-up（否则换位置重开可能残留误判）
2. **决策点（对齐目标，偏简单）**：`bottom:-6px` 对齐的是**触发 li 底部**（更多 li 是父菜单倒数第二项，与父菜单底仅差一项 26px）；issue 文字是"对齐父级菜单底部"——严格版需 JS 动态算 top 写内联样式。**建议纯 CSS 版**（改动最小、视觉上已满足"不被遮挡"），是否严格对齐父菜单底问用户/看实测观感。
3. **可行性前提已被证实**：mouseenter 触发时 CSS `:hover` 已同步生效（display:block），offset/height 可测——现有 drop-left 同一前提，线上已工作多年。
4. **两个已知边界（不阻塞，备注即可）**：①子菜单比父菜单还高时 drop-up 顶部可能超出父菜单顶（本页数据 379<504 不会；issue 只要求底部规则）；②drop-up 与 drop-left 可能同时触发（右下角场景），两个 class 的 CSS 属性正交（bottom/left），叠加无冲突。
5. **顺带发现（不建议顺手修，保持最小 diff）**：showMenuOffset:166 `y = top - 20 - ...` 的 `top` 未定义（→window.top→NaN），仅 `options.above===true` 才触达、全库无此配置，属死代码笔误；可提请用户裁定修否。
6. **主菜单自身不回归**：showMenu 的向上翻转逻辑（:129-140）不动。

## 约束

- **后端零改动**；提交归属主仓库
- **缓存纪律（重点）**：context.js 与 context.standalone.css 目前被以下页面**无版本号**引用，js+css 都引（都要 bump `?v=20261120`）的 9 页：project.html / project_en.html / largeFileManager.html / reposManager(±_en) / shareManager(±_en) / zipViewer.html / zipViewerForArt.html；test.html / testDownload.html / testGradio.html 只引 css（内部测试页，可不 bump，实施时定）；goTop.html 只引 jquery 无关。注意 zipViewer/zipViewerForArt 上一卡刚 bump 过 artDialog.js 行，本卡 bump 的是**不同行**（ContextJS 的 script/link），不冲突
- context.js（210 行）/ context.standalone.css（215 行）是简洁风格非压缩；**CRLF 状态未查**——实施前先 `python` 查行尾，CRLF 文件一律 python 二进制替换（方法论文档坑 12）；改后 `git diff --stat` 核对
- 上下文菜单由 `context.attach(selector, data)` 渲染、`showContextMenu`（project.js:3929）→ `context.show('#secondList',event,xOffset)` 触发——**菜单数据结构（project.js 6 处）不用动**，全改库层

## 验收标准

1. project 页右键文件、菜单出现在**下半屏**（向下展开场景）→ 悬停"更多..." → 子菜单完整可见，底部不超出父级菜单底/视口底
2. **上半屏**场景（子菜单向下展开本就不越界）→ 保持现状向下展开（不误触发 drop-up）
3. 水平 drop-left 行为不回归（右侧边缘右键、窄窗口场景）
4. 嵌套"备注"二级子菜单同样按其父级（更多子菜单）底部对齐
5. project.html 与 project_en.html 均生效；reposManager/shareManager/zipViewer 页面的右键菜单不回归
6. 引用页版本号已 bump、无旧缓存命中（Ctrl+F5 后行为一致）

## 验证建议

- dev 实例 8100：Admin 登录 → 测试仓库2 → 右键列表**下部**文件 → 悬停"更多..."看恢复；再右键**上部**文件确认不误触发
- 精确控制可用合成事件（本卡调研用过的手法，可直接复用）：`$("#secondList").trigger($.Event("contextmenu",{pageX:400,pageY:60}))` 后 evaluate 读 `.dropdown-context-sub` 的 getBoundingClientRect 对比视口/父菜单底
- 悬停路径（mouseenter → drop-up 挂类）需真实 hover 驱动（IAB 里可用 cua.move 到"更多"项坐标），纯 evaluate 强制 display 会绕过 mouseenter——**类是否挂上以 DOM className 为准**

## 开工姿势（新 session）

1. 读本卡 + `DevAgentControl/OFFICE文件排查方法与经验总结.md` §二 Step 5（前端纪律：in-app browser 假阳性、版本号 bump、CRLF/最小 diff）
2. 决策点（对齐"触发 li 底部"还是严格"父菜单底部"）自行设计后若拿不准，问用户
3. 改动聚焦：context.js mouseenter(:33-41) + 关闭清理(:24-26) + context.standalone.css drop-up 规则 + 9 页版本号

---

## 实施记录（2026-11-20 已完成，本 session）

### 改动清单（git diff --stat 全部最小 diff，CRLF 文件字节级安全）

1. **context.js**（LF 文件，Edit 直改，+9 行）：
   - mouseenter（原 33-41）补垂直碰撞：`$sub.parent().closest('.dropdown-context')` 取直接父级菜单 → 子菜单底 > 父菜单底 → `addClass('drop-up')`。**⚠️ 卡片设计原文 `$sub.closest(...)` 有笔误**：子菜单 ul 自身也带 `dropdown-context` 类（buildMenu 拼接），不加 `.parent()` 时 closest 匹配自身 → 比较恒 false → 修复静默失效。实施时已修正
   - 关闭清理（原 24-26）：`.find('.drop-left,.drop-up').removeClass('drop-left drop-up')`
2. **context.standalone.css**（LF 文件，+4 行）：drop-left 规则旁加 `.dropdown-submenu > .dropdown-menu.drop-up { top:auto; bottom:-6px; }`（与 margin-top:-6px 对称）
3. **9 页版本号 bump** `?v=20261120`（js+css 各 1 处/页）：project / project_en / largeFileManager / reposManager(±_en) / shareManager(±_en) / zipViewer / zipViewerForArt。其中 reposManager(±_en)、zipViewerForArt 为 CRLF 文件，python 二进制替换（行尾 164/164/400 保持完好）；test*.html 内部测试页未 bump（卡片约定）；goTop.html 无关
4. 已同步 dev 8100 部署目录（C:/TomcatForDocSysDev/docsys/tomcat/webapps/DocSystem/web/，11 文件 cp + grep 验证）

### 决策点裁定（卡片"改造设计要点 2"）

采用**纯 CSS 版**（bottom:-6px 锚触发 li 底部）：改动最小；且实测"查看备份"（父菜单末项）场景子菜单底=父菜单底恰好严格对齐。视觉上"更多"子菜单（倒数第二项触发）底在父菜单底上方约 31px，满足"不被遮挡"。**未采用 JS 动态对齐父菜单底**——如用户观感上要求严格对齐父菜单底，再升级

### 浏览器验收数据（dev 8100，project.html?vid=1，视口 1280×720，合成 contextmenu pageY=50 + cua.move 真实悬停，类挂载以 DOM className 为准）

1. **下半屏（主场景）**：父菜单 62→566，"更多"项 502-528，子菜单 379px——修复前向下展开 bottom 875（超视口 155px/超父菜单底 309px）→ 修复后 **drop-up 挂上**，154→534 向上展开，底 534 ≤ 父菜单底 566 ✓
2. **不误触发**（两处实证）：①"更多"子菜单内"备注"项（63px 短子菜单）：向下 526 ≤ 其父级底 534 → 无 drop-up 保持向下 ✓；②reposManager"自动备份"子菜单 243→306 ≤ 父菜单底 445 → 无 drop-up ✓
3. **drop-left 不回归**：视口缩到 700 宽、菜单贴右缘 → dropLeft+dropUp **同时挂载、正交叠加无冲突**，子菜单 411→571 完全页内 ✓（卡片边界②实证）
4. **嵌套对齐**：①"查看备份"（"更多"子菜单末项，63px）：向下 559>534 越界 → drop-up，底 **534 = 父级底严格对齐** ✓；②reposManager 三级链路"自动备份→本地备份"（115px）：向下 357>306 越界 → drop-up，165→280，底 280 ≤ 其父级（"自动备份"子菜单）底 306 ✓
5. **关闭清理**：点击空白关闭后 `.drop-up/.drop-left` 残留 0 ✓
6. **reposManager 页**（含三级嵌套菜单结构）：加载/弹菜单/子菜单方向全部正常 ✓；project_en 与 project 同库同版本号（html 已带 v=20261120）；shareManager/zipViewer 引用同库未逐页点开（库层已全链路验证，风险极低）

### 遗留说明

- 卡片"要点 5"的 showMenuOffset:166 `top` 未定义死代码笔误：**未修**（保持最小 diff，卡片建议提请用户裁定）
- 主菜单自身 auto 翻转（160px 预估缓冲）未动（卡片要点 6 约定）
- 待办：用户实测确认 → 提交（commit 归属主仓库，建议文案【优化】右键菜单子菜单越出屏幕底部时向上展开）
