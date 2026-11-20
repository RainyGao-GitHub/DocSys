# CURRENT_STATE_文件最小化后双击恢复窗口（任务卡）

> 状态：**用户实测通过（2026-11-20），待用户提交**（"最小化的文件双击后可以恢复成默认大小了"——用户确认语；Issue：https://gitee.com/RainyGao/DocSys/issues/IKWM0U）
> Issue：https://gitee.com/RainyGao/DocSys/issues/IKWM0U
> 归属：**主仓库前端**（WebRoot/web/js/artDialog.js 为主 + 引用页版本号），后端不动

## 一句话

project 页文件窗口（ArtDialog）被最小化后缩在角落容易被忽视，用户再双击文件想打开，但窗口"已打开"，触发复用分支后对最小化状态 no-op——用户感知"点了没反应，文件打不开"。目标：**再次触发打开已最小化的窗口时，恢复其正常显示（原尺寸原位置）并置顶提示**。

## 根因（2026-11-20 调研，行号为当时快照）

**双击打开链路**：
1. doclist 双击 `DocListOnDbClick`（project.js:3586）→ `getAndShowDoc(node, 2, false)`（project.js:1453，openMode==2 分支）→ ajax getDoc 成功后 `openDoc(gDocInfo, false, "openInArtDialog", "open", gShareId)`；zTree 双击 `zTreeOnDbClick`（project.js:2891）同路。右键"打开/预览"同样汇入
2. → DocSys.js `showXxxInArtDialog` 家族（showPdf/showImg/showAudio/showVideo/showZip/showMarkdown/showText/showOffice...，:2680-2850 一带）→ `new artDialog({ id: "ArtDialog"+docId, ... })` 并注册 `window.artDialogList["ArtDialog"+docId] = d`
3. → **js/artDialog.js 构造函数**（:47 起）：

```js
// :70  id 已注册且 DOM 还在 → api 命中
(api = artDialog.list[config.id]) && 0 == $("." + config.id).length && (api = null, delete ...),
...
// :76  复用分支：不新建，只置顶+聚焦+display(true)+flash
if (api)
    return api.zIndex().focus().display(!0),
        $.fn.flash && api.DOM.wrap.flash(),
        api;
```

4. → `display(!0)`（:402）开头有短路：`if ("hidden" != $wrap.css("visibility")) return this;`
5. → **最小化实现 `_clickMin`（:790-799）**：`window.TaskTab ? this.display(!1)（真隐藏 visibility:hidden） : ($wrap.hasClass("dialog-max") && this._clickMax(), $wrap.toggleClass("dialog-min-size"))`

**无 TaskTab 的普通 project 页**：最小化 = toggle `dialog-min-size` class（纯 CSS 缩小，**visibility 仍 visible，原尺寸/位置 style 未动**）→ 复用分支里 `zIndex()/focus()` 执行了但窗口仍缩着，`display(!0)` 被 visibility 短路直接 return，**没人移除 `dialog-min-size`** → 用户看到"无任何动作"。

**有 TaskTab 的任务栏模式**：最小化走 `display(!1)`（visibility hidden）→ 复用分支 `display(!0)` 能正常 fadeIn 恢复——**该 bug 仅无 TaskTab 场景存在**。

## 改造设计要点

1. **改哪里（推荐方案）**：js/artDialog.js 构造函数复用分支（:76）——一处改动对所有入口生效（全部 showXxxInArtDialog + project.html 内直接 new artDialog 的 + zipViewer 内嵌窗口）。改法：复用分支先检测 `$wrap.hasClass("dialog-min-size")`，命中则按 `_clickMin` 的恢复语义处理（照抄 :790-799 内部方向，注意不要走 toggle 语义）：
   ```js
   $wrap.removeClass("dialog-min-size");
   that.dialogResize();
   that.resetTitleLength();
   ```
   然后照旧 `zIndex().focus()` + flash。
2. **尺寸语义（决策点，偏简单）**：`dialog-min-size` 是纯 CSS class 缩小，最小化**没有改动** left/top/width style——移除 class 即恢复用户所见原尺寸原位置（含用户手动拖动后的尺寸）。issue 文案"恢复第一次打开的大小（默认尺寸）"实际等价于"取消最小化"。若严格要"创建时默认尺寸"（getArtDialogInitWidth/Height，DocSys.js:3084/3104），可从 `api.config.width/height` 取（创建参数保留在 config 上）+ 重新定位——**建议先做等价版（removeClass 即恢复），是否强制默认尺寸问用户/看实测观感**。注意 `_clickMax`（:741-756）有 initSize 机制（$wrap.data("initSize")），但那只覆盖"最大化过"的场景；min 与 max 互斥维护着（_clickMin/_clickMax 各自 removeClass 对方），复用分支只需处理 min-size 存在的情况。
3. **通用对话框不受影响**：普通提示框不传固定 id（自动 `_expando+_count` id），永不命中复用分支；命中复用分支的只有显式传 id 的长生命周期窗口（文件窗口/历史窗口等）——正是目标场景，全局库改动风险可控。
4. **两套注册表**：构造函数用 `artDialog.list[id]`，DocSys.js 另维护 `window.artDialogList["ArtDialog"+docId]`（iframe 页经 window.top.artDialogList 取 docInfo 数据）。本卡只动前者逻辑，不动后者。
5. **flash 提示**：`$.fn.flash` 闪烁保留——恢复后闪一下，明示用户"窗口已存在，给你调出来了"。

## 约束

- **后端零改动**
- **缓存纪律（重点）**：js/artDialog.js 当前被以下页面**无版本号**引用，改动后必须 bump 主入口（project.html:164 / project_en.html:165 必改；projects(±_en):201、zipViewer(ForArt).html、historyLogs(ForArt)(±_en)、historyDetailsForArt(±_en) 视风险决定是否统一加）——上一卡（预览弹窗先行）刚踩过 iframe 页引用 js 无版本号命中旧缓存的坑（ReferenceError 卡 loading），本卡直接在 artDialog.js 加私有方法/改构造函数，旧缓存同样会炸，务必处理
- 提交归属：主仓库
- js/artDialog.js 是压缩风格代码（变量名单字母），改动用最小 diff、python 二进制替换或精准 Edit，改后 `git diff --stat` 核对变动行数（方法论文档坑 12）

## 验收标准

1. 双击打开 office/pdf 文件 → 点最小化 → 再双击同一文件 → **窗口恢复原尺寸原位置并置顶、闪烁提示**，全程无需用户找角落小条
2. 未最小化时再双击已打开文件 → 保持现状行为（置顶+focus+flash，不重复开窗）
3. 最大化状态下再双击 → 现状行为不回归（若实测发现最大化+最小化组合有异常，按设计要点 2 处理）
4. 图片/视频/音频/文本/markdown/zip/office 各类文件窗口同样生效（同一复用分支）
5. zipViewer 内打开的文件窗口、历史记录窗口（显式 id 的 ArtDialog）同样生效
6. 有 TaskTab 的任务栏模式（若环境可测）不回归
7. project.html 与 project_en.html 均正常（中英文），引用版本号已 bump、无旧缓存命中

## 验证建议

- dev 实例 8100（PublishDev.bat 发布或 Eclipse 实例）：Admin 登录 → 测试仓库2 → 双击 `MxsDoc产品介绍.docx`（或 pdf/图片）→ 最小化 → 再双击 → 看恢复
- 回归清单见验收标准 2-7；注意 in-app browser 测弹窗有假阳性（方法论文档 §二 Step 5），关键结论以用户实测为准

## 开工姿势（新 session）

1. 读本卡 + `DevAgentControl/OFFICE文件排查方法与经验总结.md` §二 Step 5（前端纪律：in-app browser 假阳性、版本号 bump、CRLF/最小 diff）
2. 决策点（恢复"用户上次尺寸"还是"创建默认尺寸"）自行设计后若拿不准，问用户
3. 改动聚焦：js/artDialog.js（构造函数复用分支 :76 一带）+ 引用页版本号

## 实施记录（2026-11-20）

**改动（已发布 dev 并实测，未提交）**：
1. `WebRoot/web/js/artDialog.js` 构造函数复用分支（:75 一处，+3 行）：命中已注册窗口时，先检测 `dialog-min-size`，命中则 `removeClass` + `api.dialogResize()` + `api.resetTitleLength()`（与 `_clickMin` 恢复语义一致，非 toggle），再照旧 `zIndex().focus().display(!0)` + flash。两方法均被 `_init` 包成 50ms 尾沿节流，顺序调用顺序执行，无需 setTimeout。
2. 10 处引用 bump `?v=20261120`：project.html / project_en.html / projects.html / projects_en.html / zipViewer.html / zipViewerForArt.html / historyLogsForArt(±_en) / historyDetailsForArt(±_en)（python 二进制替换，CRLF 文件未污染）。
3. 尺寸语义取"等价版"（removeClass 即恢复用户所见原尺寸原位置）——`dialog-min-size` 是纯 CSS 缩小，left/top/width 内联样式最小化时未动。

**dev 8100 实测（in-app browser，Admin/测试仓库2）全过**：
- test.md（markdown 窗口）：开 854×569@213,57 → 最小化 250×30 → 再双击 → 恢复 854×569@213,57、zIndex 500→503、单窗不重复
- MxsDoc产品介绍.docx（office 窗口，officeForArt iframe）：同场景恢复 854×569、zIndex 512→514（注：office iframe 加载 sdkjs 期间渲染进程忙，in-app browser evaluate 会超时，等 1-2 分钟恢复后可测）
- 未最小化再双击：现状行为保持（单窗、置顶 503→505、尺寸不变）
- 最大化→最小化→再双击：恢复正常尺寸（非最大化）；"最大化状态下再双击"实际不可达（max 窗口全覆盖文件列表）
- project_en.html 英文页：同场景全过

**实测中的两点澄清**：
- **历史记录窗口不适用本修复**：`project.js:2119` 历史 id = `ArtDialogHistory_<type>_<docId>_<new Date().getTime()>`，每次打开都是新 id → 复用分支永不命中（每次开新窗是既有设计，非本次回归）。本卡设计要点 5 里"历史记录窗口同样生效"的假设与实际不符。
- zipViewer 内文件窗口走同一 showXxxInArtDialog 家族（同复用分支），理论覆盖（仓库无 zip 样本未实测）。
- TaskTab 模式 dev 未启用无法实测；代码路径确认零影响（有 TaskTab 时最小化走 display(!1)/visibility hidden，复用分支 display(!0) fadeIn 原有恢复逻辑不变，hasClass 恒 false）。

**待办**：用户浏览器实测（重点 office 文件+闪烁提示观感）→ 用户提交（主仓库 11 文件：artDialog.js + 10 html）。
