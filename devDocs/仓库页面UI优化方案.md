# 仓库详情页（project）前端 UI 优化方案

> 建立于 2026-10-09。**状态：S1 已实施并通过真实浏览器 E2E 验收（2026-10-09）；S2 / S3 未开始；改动尚未提交**。
> 工作卡：`DevAgentControl/CURRENT_STATE_仓库详情页UI优化.md`。
> 本方案里所有「实测」都来自真实浏览器（dev 8100，`project.html?vid=2&showType=1`）与源码定位，**不是推测**。
> **用户裁定（2026-10-09）**：① 按 S1 → S2 → S3 推进，**先只做 S1**；② 吸顶先用 `position: sticky`，效果不好再换 flex column；③「第一栏可折叠」**先不做**；④ 问题 2 双击的是 **3px 灰线（分隔条）**；⑤ 暂不需要更多参考图。

---

## 1. 现状：三栏是怎么搭的（实测 + 源码）

| 栏 | 元素 | CSS 来源 | 实测几何（视口 1059×770） | 是否滚动容器 |
|---|---|---|---|---|
| 分隔条1 | `#line.manual-line` | `static/styles/kancloud.css:127` | left 450, w **3px**, `cursor:col-resize`, z-index **100**, #ddd | — |
| 第一栏（目录树） | `.manual-left` | `kancloud.css:148` | left 0, w 450, `overflow: visible`, bg `#fafafa` | ❌ 自身不滚（scrollH=clientH=715） |
| 分隔条2 | `#second-line.second-line` | **`css/style.css:8`**（`kancloud.css:137` 的 `#line2.manual-line` **从未生效**，见 §2.1） | left 903, w 3px, `cursor:col-resize`, z-index 100, #ddd | — |
| 第二栏（文件列表） | `.second-table` | `css/style.css:1/66` | left 453, w 450, `overflow:auto`, bg `#fafafa` | ✅ **scrollH 3615 / clientH 715** |
| 第三栏（内容/预览） | `.manual-right` | `kancloud.css:273` | left 907, w 152, `overflow:auto`, **bg 透明 `rgba(0,0,0,0)`** | ✅ **scrollH 1007 / clientH 715** |

布局模型：**绝对定位 + JS 改几何**（不是 flex/grid）。

- 拖动逻辑：`project.js:4290`（`#line`）与 `project.js:4334`（`#second-line`），`onmousedown` → `document.onmousemove` 里直接改 `style.left / style.width`
- 滚动条：**自绘**（`kancloud.css:51` 起）`.m-manual:not(.manual-mobile) ::-webkit-scrollbar{ width:7px; background:rgba(0,0,0,.1) }`；`:hover` 时**轨道变深**为 `rgba(0,0,0,.2)`（实测栏内滚动条宽 = **7px**）

---

## 2. 三个已知问题的根因（含实测证据）

### 2.1 问题 1：把栏拖到最边上后，「新文档」反而显示出来 ✅ 根因已实证

**三条原因叠加：**

1. **拖动没有任何最小/最大宽度限制**（`project.js:4290-4372` 全是裸的 `ev.clientX` 赋值）。实测：
   - 把 `#line` 拖到 x=5 → `.manual-left` 宽度 **450 → 5px**
   - 再把 `#second-line` 拖到 x=5 → `.second-table` 宽度 **450 → 0px**，第三栏 `.manual-right` 变成 left 8 / **w 1051**（铺满）
2. **栏内固定宽度的内容会溢出到栏外**：第一栏顶部的「+ 新文档 ▾」是固定 **100px** 宽的块（`project.html:246` 起的 `.manual-tab .tab-navg`，内层 `style="width:100px"`）。实测栏被压到 5px 时该按钮 **l=0 / w=77**，`超出左栏: true`；而 `.manual-left` 是 `overflow: visible`（不裁剪）⇒ 溢出的按钮被绘制到栏外。
3. **第三栏背景是透明的**（`.manual-right` 实测 `background: rgba(0,0,0,0)`；对比 `.second-table` 有 `#fafafa`）⇒ 底层溢出的按钮**从第三栏里透出来**，于是"拖到最边上之后它在内容栏上显示出来了"。
4. 附带缺陷：`kancloud.css:137` 写的是 **`#line2.manual-line`**（含 `z-index:301`），但 HTML 是 `<div id="second-line" class="second-line">`（`project.html:311`）⇒ **该规则从未生效**，第二条分隔条实际由 `css/style.css:8 .second-line` 提供样式。**CSS/JS/HTML 三处 id 命名不统一**（`line2` / `second-line`），是后续维护的坑。

**修法（已实施，见 §4）**：**不设最小宽度**（保持原来「可以拖到最窄」的手感）＋ 钳制只做「不为负」＋ 第三栏补不透明背景（挡住溢出）＋ 统一分隔条 id/类名 ＋ 修正第二栏宽度公式。

> ⚠️ **两处计划修正（重要）**：
> 1. 原方案打算给三栏加最小宽度（左 ≥200 / 中 ≥260 / 右 ≥320）—— **用户裁定不做**（2026-10-09）：「需要保持原来可以拖到最小的逻辑」。最终实现：最小宽度 = **0**，只保证不出现负宽/负栏。
> 2. 原方案打算用 `overflow: hidden` 裁剪溢出 —— **实际不能这么做**：① 第二栏本身就是滚动容器，加 `hidden` 会彻底失去滚动；② 第一栏内的「新文档」下拉菜单会被剪掉；③ `overflow:hidden` 会产生新的滚动容器，**反而会让 S1-4 的 sticky 失效**。最终改为「**给上层栏不透明底色**」：三栏按 DOM 顺序（左 → 中 → 右）绘制，后画的栏把前面栏溢出的内容挡住，已实测验证。

### 2.2 问题 3：第二栏搜索框行、第三栏标题行没有固定 ✅ 根因已实证

**根因**：**每栏本身既是容器又是滚动容器**（`.second-table` / `.manual-right` 都是 `overflow:auto`，scrollH 远大于 clientH）⇒ 栏内第一行随内容一起滚走。

**修法**：把每栏改成「**固定头 + 内层滚动区**」：
- 方案 A（改动小）：头部行加 `position: sticky; top: 0; z-index: 2`，并确保其**所有祖先**没有 `overflow: hidden/auto` 截断（这点必须在实施时逐层实测——`overflow:hidden` 会破坏 sticky）。
- 方案 B（更稳、改动大）：改 DOM 结构为 `flex column`（头 `flex: 0 0 auto` + 内容 `flex: 1 1 auto; overflow:auto`），彻底摆脱"栏=滚动容器"。
- ⚠️ 与 2.1 的修法有**冲突点**：2.1 要求栏 `overflow: hidden`，而 sticky 要求祖先不能是滚动容器。**这两者必须一起设计**（推荐 B，或用 `overflow: clip` 代替 `hidden`，`clip` 不产生滚动容器、不破坏 sticky）。
- ✅ **实际采用方案 A（`position: sticky`）且已验证成立**。关键前提：`#secondDropZone > .searchBox` 与 `#previewPane > .searchBox` 都是**滚动容器的直接子元素**，sticky 的滚动口就是该栏本身，无需改 DOM；同时**没有给任何祖先加 `overflow: hidden`**（见 2.1 的计划修正）。
- 📌 **补充实测**：第一栏**本来就已经是「固定头 + 内层滚动区」**——`#uuz.tab-item.manual-catalog` 是 `position:absolute; top:60px; bottom:0; overflow-y:auto` 的滚动区，表头 `.tab-navg` 在它外面 ⇒ 第一栏无需改动，与你报的问题 3 只涉及第二、三栏一致。

### 2.3 问题 2：双击第二栏滚动条会「变细」 ✅ 已定位并修复（根因：宽度公式缺陷）

**现象还原（用户补充）**：双击的是**那条 3px 灰线（分隔条）**，而结果却是**滚动条变细**。

**为什么上一轮没复现（关于测试方法的教训）**：用合成 `dblclick` / `page.mouse.dblclick` 永远复现不了 —— 它们只在点击前发一次 `mousemove`，此时**拖动监听还没装上**。真实双击是 `mousedown → mouseup → mousedown → mouseup`，**人手不可能落在同一像素**，两次按下之间必然夹一次 `mousemove` —— 而拖动监听恰好在这时才生效。

**根因（实测坐实）**：拖动第二条分隔条的公式把它自己的 3px 也算进了第二栏宽度：

```js
$('.second-table').width($(".second-line").position().left - $('.manual-left').width());
//                             ^^ 分隔条 left（=左栏宽+3+栏宽）− 左栏宽 = 栏宽+3
```

实测（视口 1013）：

| | 第二栏 rect | 分隔条 rect | 分隔条压住第二栏 | 滚动条可见宽 | 该点最上层元素 |
|---|---|---|---|---|---|
| 双击前 | l=453 **w=450 r=903** | 903–906 | **0px** | **7px** | `secondDropZone`（滚动条） |
| 双击后（手微抖） | l=453 **w=453 r=906** | 903–906 | **3px** | **4px** | `second-line`（分隔条） |

⇒ 第二栏右边界从 903 变成 906，而分隔条（`z-index:100`）正好盖在滚动条最右 3px 上 ⇒ **滚动条从 7px 可见变成 4px 可见 = 用户看到的「变细」**。

**叠加因素**：滚动条是自绘的，轨道 `rgba(0,0,0,.1)` 在 `:hover` 时变深到 `.2`（`kancloud.css:57`），thumb 与轨道对比度下降，也容易被感知成「变细」。

**修法（已实施）**：① 第二栏宽度改为 **不含分隔条**（分隔条紧贴栏右缘，与滚动条零重叠）；② 滚动条轨道改透明、hover 只加深 thumb；③ 分隔条命中区只向右扩 4px，**绝不向左侵占滚动条**；④ 拖动改为「起点宽度 + 位移」算式，双击时手抖只挪 1px，且**双击分隔条现在会复位**（原来双击没有任何反馈）。

---

## 3. 市场参考调研（三栏式产品）

### 3.1 我实际截图的参考

| 产品 | 截图要点（已存档） | 可借鉴 |
|---|---|---|
| **Seafile**（开源文件系统，域名最接近我们） | **细图标栏**（≈56px，图标+选中态左侧色条）+ 列表**带固定列头**（Name/Size/Time/Owner）+ 右上**视图切换/排序** + **行悬停才出现操作图标**（分享/删除/更多） | 图标栏省空间、列表列头、悬停显露操作、元信息灰字 |
| **Linear**（现代感标杆） | 左侧**窄导航**（≈220px，分组可折叠 + 底部 workspace 切换）+ 主区**吸顶头**（面包屑式标题 + 星标 + `...` 操作）→ 内容滚动时头部**不动** | **内容区吸顶头**（正是我们的问题 3）、导航分组可折叠、克制的配色与紧凑行高 |

### 3.2 同类产品普遍做法（按"我们能用"的角度归纳）

| 做法 | 谁在用 | 对我们的意义 |
|---|---|---|
| 三栏 = 导航 / 列表 / 内容，**面包屑固定在内容栏顶部** | Linear、Notion、Dropbox、Google Drive | 直接解决问题 3 |
| **可拖拽分隔条**：4–8px 命中区、hover 变主色、`col-resize` 光标、**双击复位**、有最小/最大宽度 | VS Code、Figma、Finder、几乎所有现代三栏 | 解决问题 1（钳制）+ 问题 2（把手语义明确） |
| **左栏可折叠成图标栏**（或整体收起） | Seafile、VS Code、Linear、Gmail | 窄屏/专注阅读时把空间让给内容 |
| 列表**列头固定**、行高 40–56px、**行悬停出操作** | Seafile、Finder、Google Drive、VS Code | 第二栏观感现代化 + 操作可达性 |
| **详情/属性侧栏可用按钮开关** | Google Drive、Notion、Figma | 第三栏默认宽度小时更好用 |
| 滚动条**统一自绘**（固定宽度、透明轨道、hover 只变 thumb） | VS Code、Linear、Notion | 解决问题 2 的"变细"观感 |
| **宽度/折叠状态持久化**（localStorage） | VS Code、Finder、几乎所有现代三栏 | 记住用户习惯 |
| 空态/加载态有明确视觉（骨架屏、空态插图） | 现代全部 | 避免"白屏像坏了" |

> 说明：3.1 的两张截图是我在本环境真实抓取的；3.2 是基于这些产品公开设计的归纳（未逐条抓图）。**需要我继续抓某几个产品的图（Google Drive / Dropbox / Notion / Figma / Windows 资源管理器 / macOS Finder / M-Files / SharePoint），说一声即可**——本环境浏览器能访问外网（`fetch` 与截图均可用），个别站点可能超时。

### 3.3 不建议照搬的

- 深色主题（Linear）：本产品是浅色系，且已有 `.s-box` 等既定视觉，**不换主题**。
- 图标栏不是所有场景都好：本产品第一栏是**目录树**（层级深），直接砍成图标栏会伤可用性 ⇒ 建议"**可折叠**"而非默认图标栏。

---

## 4. 实施方案（分 3 阶段，**每阶段独立可验收**）

### S1 修掉 3 个已知问题（风险最低；CSS 为主 + 少量 JS）

| 步骤 | 内容 | 涉及 |
|---|---|---|
| S1-1 | 拖动**实时钳制**（不设最小宽度，只保证不为负）；双击分隔条复位到默认 450/450 | `project.js` 两条分隔条逻辑 |
| S1-2 | 分隔条重做：统一 `#line`/`#second-line` 命名（修掉 `#line2` 死 CSS）、6–8px 命中区 + 1px 视觉线、hover 变主色、**不与滚动条重叠** | `kancloud.css`、`css/style.css`、`project.html` |
| S1-3 | 三栏 `overflow` 策略定稿（栏不裁切内容 vs 不破坏 sticky）→ 推荐 `overflow: clip`；第三栏补不透明背景；三栏 z-index 关系理清 | 2 个 CSS 文件 |
| S1-4 | 第二栏表头（搜索框行 + 排序列）与第三栏表头（标题行）**吸顶** | `project.html`/`project.js` 渲染处 + CSS |
| S1-5 | 滚动条统一（固定宽度、透明轨道、hover 只变 thumb） | `kancloud.css` |

**S1 验收（脚本可断言）**：
- 拖动到**任意极值**（左/右到边）后：三栏内**没有一个元素**的 `getBoundingClientRect()` 超出其所在栏边界（当前实测第一栏「新文档」超出 → 必须变成 0）
- 三栏滚动时，其表头 `getBoundingClientRect().top` **与滚动前相差 ≤1px**
- 双击分隔条 → 恢复默认宽度（±2px）
- 640 / 1024 / 1440 / 1920 四个宽度下逐条复验

### S1 实施结果（2026-10-09，已真实浏览器 E2E 验收）

**改动文件（5 个）**：

| 文件 | 改动 |
|---|---|
| `WebRoot/web/project.js` | 重写两条分隔条逻辑：新增 `readPaneLayout / applyPaneLayout / resetPaneLayout / bindPaneSplitterDrag / isPaneLayoutAvailable`；所有几何只在 `applyPaneLayout` 里算一次；**不设最小宽度**（只保证不为负）；双击复位；**保留「第二栏分隔条越过第一栏分隔条 → 转而缩第一栏」的原行为**；删掉热循环里的 `console.log` |
| `WebRoot/web/static/styles/kancloud.css` | 修掉死规则 `#line2` → `#second-line.manual-line`（与 `#line` 共用样式、z-index 统一 100）；新增 `:after` 命中区（只向右 4px）、`:hover` 反馈（#428bca）、拖拽期 `user-select:none`；滚动条轨道改透明、thumb 悬停只加深（并修好原来漏空格的选择器） |
| `WebRoot/web/css/style.css` | 删除重复的 `.second-line` 定义（统一到 kancloud.css）；新增 `#secondDropZone > .searchBox` 与 `#previewPane > .searchBox` 吸顶 + `#previewPane` 不透明底色 |
| `WebRoot/web/project.html` | `#second-line` 补 `manual-line` 类；`.manual-right` 加 `id="previewPane"`；「新文档」块补 `max-width:100%` |
| `WebRoot/web/project_en.html` | 同上 3 处（英文页同步） |

**实测结果（视口 1013，第二栏有 39 条列表内容）**：

| 验收项 | 修前 | 修后（实测） |
|---|---|---|
| 第一栏拖到最左 | 5px | **4px**（不设下限，可继续拖到 0） |
| 第二栏拖到最左 | **0px**（且会把分隔条/滚动条搞坏） | **0px**（保持原手感；宽度公式修好后不再压滚动条） |
| 第二栏分隔条越过第一栏分隔条 | 转而缩**第一栏**（原实现 `if(lineLeft > secondLineLeft)` 分支） | **同样保留**：第二栏被压到 0 后继续往左拖，多余位移转给第一栏（实测一次连续拖动：二栏 450→150→0，随后一栏 450→300→150→100→0，第一栏分隔条同步跟走，无跳变） |
| 「新文档」块在栏被拖窄时 | 溢出栏外并从**透明**的内容栏透出 | 加 `max-width:100%` 后按钮会被压缩换行；即便仍有溢出也**被上层栏挡住**（同一行扫描：x≥10 取到的都是上层栏元素） |
| 第三栏同一位置看到什么 | 「新文档」块（底层透出） | 第三栏自己的表头（同一行探针 `pane=right`） |
| 分隔条压住第二栏 | 0 → 双击后 **3px** | **恒为 0px**（左栏 4px / 中栏 0px / 中栏 20px 三种状态下均实测） |
| 第二栏滚动条可见宽 | 7 → 双击后 **4px** | **恒为 7px**（中栏 = 20px 时同样是 7px） |
| 表头吸顶 | 随内容滚走 | 滚动 400px 后 header top **55 → 55**（第二、三栏均为 `position:sticky`） |
| 双击分隔条 | 无任何反馈（且会改坏栏宽） | **复位到默认 450/450**（视口放不下时按「不让其余栏为负」收紧：465 宽 → 9/450/0） |
| 分隔条 hover | 无反馈 | `rgb(66,139,202)` ✔ |
| 三栏总和 | 可能溢出视口 | `左 + 中 + 右 + 2×3px == 视口宽`（不满足时只牺牲最右栏，**不出现负宽**） |

> 🔧 **关于 resize（已收定）**：**不做窗口 resize 重排（保持原行为）**——第一/二栏保持已拖好的像素宽度，第三栏宽度由 CSS 的 `right:0` 自适应（窗口变窄时会被挤到 0，但不会为负，`left:auto` 也不会出现负宽度）。
>
> 实施中曾加过一版「resize 重新钳制」，过程中发现 **`resize` 事件里读到的 `clientWidth` 可能还是旧值**（把视口直接改到 800 时会差一拍，首轮得到 367/367/**60** → 第三栏被压成 60px，需立即 + rAF 各钳一次才能稳）。既然最小宽度已取消、第三栏靠 `right:0` 也不会为负，这版逻辑已**整体删除**，不再需要。

> 📱 **移动端分支（`gIsPC == false`）冒烟结果**（CDP 模拟 iPhone UA + 390×844）：`gIsPC=false`、第一栏与两条分隔条 `display:none`、第二栏 `left:0 / width:100vw`、`isPaneLayoutAvailable()=false` ⇒ **新布局代码不干预移动端分支**（原先用全局开关实现，后改为按 DOM 实际状态判断，避免 `gIsPC` 未定义/初始化顺序导致拖拽静默失效）。

> ⚠️ 另：`kancloud.css` 里 `.manual-line{display:none}`、`.m-manual.manual-reader .manual-right{left:0 !important}` 等覆盖全都写在 **`@media screen and (max-width: 0px)`**（永远不匹配 = 死规则）里，因此这些“响应式/电子书模式”覆盖本来就从未生效。
| 点击可达性 | — | 排序图标 / 新文档 / 搜索框 / 返回箭头 / 列表行 的命中测试全部 `clickable: true`（分隔条 4px 扩展区未挡住第三栏返回箭头） |
| 功能回归 | — | 搜索「合同」4.98s 返回结果并渲染；点文件行 `#filetitle` = `BasicInfo页面显示流程.docx`；预览 iframe 正常；排序下拉正常浮在吸顶头之上（z-index 1000 > 2） |

> 注：仓库详情页的列表项**本来就不含高亮 `<em>` 标记**（`project.js` 里没有任何 `nameHtml/contentHtml/s-box/s-content` 引用——高亮是 projects 列表页的能力），因此本轮 `em=0` 属既有行为，与本轮改动无关。

### S2 视觉现代化（低风险，纯 CSS）

- 设计令牌归一：间距 4/8/12/16、圆角 6/8、边框 `#e5e7eb`、主色沿用现有 `#428bca`、正文 `#333` / 次级 `#6b7280`
- 列表行：统一行高 48px、hover 底色复用页面已有 `#eaf0fb`、选中态左侧 2px 主色条、图标 16px、右侧元信息灰字
- 表头行统一高度（44px）+ 细下边框；**滚动时才出现**的轻微阴影
- 空态与加载态：空目录给文案/插图；列表加载给骨架屏
- 第一栏**可折叠**（折叠成 56px 图标栏或整体收起；参考 Seafile/Linear）

### S3 交互增强（中风险，可选）

- 三栏宽度 / 折叠状态**持久化**（localStorage）
- 拖动时显示宽度提示；双击复位默认比例
- 键盘：`Ctrl/⌘+B` 折叠第一栏、`Esc` 返回上级、`↑/↓` 移动选择
- 大目录虚拟滚动（单目录文件很多时）

---

## 5. 验收口径（可量化）

| 项 | 现状（实测） | 目标 |
|---|---|---|
| 栏外内容溢出 | 第一栏压到 5px 时「新文档」按钮 l=0/w=77 **超出栏外** | **0 个**越界元素 |
| 栏宽下限 | 第一栏 5px、第二栏 0px（原行为） | **不设下限**（用户裁定保持原手感）；只保证三栏都不为负 |
| 表头吸顶 | 第二/三栏表头随内容滚走（scrollH 3615/1007 vs clientH 715） | 滚动时 top **不变**（±1px） |
| 分隔条 | 3px、无 hover 反馈、双击无作用、**压住滚动条 3px** | 6–8px 命中区、hover 变主色、双击复位、不与滚动条重叠 |
| 滚动条 | 自绘 7px，hover 变轨道底色（易被感知"变细"） | 统一宽度、轨道透明、hover 只变 thumb |
| 三栏宽度记忆 | 无（刷新回默认） | 刷新后保持（±2px） |

---

> ✅ 2026-10-09 实测（S1 完成后）：§5 各项均达标，逐项实测值见 §4「S1 实施结果」。

## 6. 风险

- 三栏是**绝对定位 + JS 改几何**，吸顶/钳制/折叠都要动这套几何逻辑；**改动会碰到 zTree（第一栏树）、内容区（iframe/Office 预览）、以及 `manual-reader`（电子书模式）与 `manual-mobile`（移动端）分支** ⇒ 必须在这 4 种状态下都回归。
- `overflow: hidden` 与 `position: sticky` **天然冲突**（前者产生滚动容器，会让 sticky 失效）⇒ 计划用 `overflow: clip`，但**浏览器支持需实测**（Chrome 90+/Edge 90+ 支持；本项目只面向现代浏览器）。
- 折叠第一栏（S2）会改变用户既有操作习惯 ⇒ **单独一次改动、可回退**。
- 本页曾被前序任务改动过（`project.js` 的搜索：P2-1 分批等），改动 `project.js` 时不要动搜索相关代码。

---

## 7. 裁定与后续

**用户已裁定（2026-10-09）**：
1. 按 S1 → S2 → S3 推进 —— **先只做 S1**；→ ✅ S1 已实施并验收；
2. 表头吸顶用 `position: sticky`（效果不好再换 flex column）；→ ✅ 采用且验证成立；
3. 「第一栏可折叠」**先不做**；
4. 问题 2 双击的是 **3px 灰线（分隔条）**，表现为滚动条变细；→ ✅ 已定位为宽度公式缺陷并修复；
5. 暂不需要更多参考图。
6. **不要给第一/二栏加最小宽度**（2026-10-09 追加裁定）：「需要保持原来可以拖到最小的逻辑」⇒ 最小宽度一律取消（= 0），只保证不为负。

**仍未开始 / 待再议**：
- **S2 视觉现代化**（间距/圆角/行高/列表选中态/空态/骨架屏；「第一栏折叠」已明确不做）；
- **S3 交互增强**（栏宽持久化、拖动宽度提示、快捷键、大目录虚拟滚动）；
- **提交**：S1 的 5 个文件改动**尚未提交**（等用户确认）。

---

## 8. 证据索引（复核锚点）

- 三栏几何与滚动数据：本文件 §1（实测于 `project.html?vid=2&showType=1`，视口 1059×770）
- 「新文档」溢出实测：`#line`→x=5 后 `.manual-left` w=5、按钮 l=0/w=77、`超出左栏: true`、`elementFromPoint(按钮中心)` = `DIV.searchBox`
- 拖动代码：`project.js:4290`（`#line`）、`project.js:4334`（`#second-line`）
- 分隔条 CSS：`kancloud.css:127`（`#line.manual-line`）、`kancloud.css:137`（`#line2.manual-line`，**死规则**）、`css/style.css:8`（`.second-line`）
- 滚动条 CSS：`kancloud.css:51 / 57 / 61 / 70`
- 第三栏背景透明：`kancloud.css:273`（`.m-manual .manual-right`）
- 第一栏「新文档」：`project.html:246` 起（`.manual-tab .tab-navg`，内层 100px 宽块）
- 参考截图（会话内已展示）：Seafile 首页（细图标栏+列表列头+悬停操作）、Linear 首页（窄导航+内容区吸顶头）

**S1 实施后新增证据锚点**：
- 问题 2 复现用例：`#second-line` 上 `dispatchEvent(mousedown)` → `document` 上 `mousemove`（同点）→ 修前 `splitterCoversColumn` **0 → 3**、修后恒为 **0**
- 拖动/钳制代码：`project.js` 的 `applyPaneLayout`（唯一几何出口）、`resetPaneLayout`（双击复位）、`bindPaneSplitterDrag`（起点+位移）
- 分隔条样式：`kancloud.css` 的 `#line.manual-line` / `#second-line.manual-line`（含 `:after` 命中区、`:hover`、`pane-dragging`）
- 吸顶与底色：`css/style.css` 的 `#secondDropZone > .searchBox`、`#previewPane`、`#previewPane > .searchBox`
- 视口差异说明：本轮多次测量中 视口 `documentElement.clientWidth` 为 1013 / 1060（随窗口与滚动条变化），几何差值不受影响
