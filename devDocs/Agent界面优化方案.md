# Agent 界面优化方案：移除左侧栏，功能上移/下移

> 背景：Agent 页面（`WebRoot/web/agent/index.html`）在 ArtDialog 内嵌场景下默认只占约半屏宽，260px 的左栏太占空间。
> 目标：移除左栏，把其功能分配到**顶部栏**与**底部工具行**；纯前端调整，不改后端接口。
> 状态：已实施并完成实测（2026-09-17）。

## 1. 现状盘点（左栏承载的功能）

| # | 左栏区块 | 内容 | 交互 |
| --- | --- | --- | --- |
| 1 | 品牌头 | "MXSDOC AI智能体"绿底标题 | 无 |
| 2 | Soul 进化面板 | 等级徽章、健康点+文字、模式数、成功率、学习进度条 | 仅展示（`updateSidebarSoul()` 刷新） |
| 3 | 会话区 | "会话"标题 + `+` 新建；会话列表（点击切换、悬停 ✕ 删除、当前项高亮、空态提示） | 新建/切换/删除 |
| 4 | 底部按钮组 | 帮助 ?、技能市场、设置 | 打开对应弹窗（弹窗已存在且保留） |

布局事实：
- `.app-container`（flex 行）= 左栏（220px，index.html 内联样式） + `main.main-content`；**页面无任何响应式断点**。
- 左栏样式在 `index.html` 内联 `<style>` 与 `css/styles.css` **重复定义**（内联后加载、优先生效）。
- `css/styles.css` 的 `.sidebar*` 样式仍被 `ui.html` 使用 → **本次只清理 index.html 内联部分，styles.css 不动**。

## 2. 目标布局（已确认）

```
┌────────────────────────────────────────────────────────────────┐
│ [＋] [当前会话标题 ▾]              [● 系统健康 · Lv.1 · 5%]     │ ← 新增顶栏（约40px）
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    消息区（全宽；max-width 900 居中保留）        │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│ [📎]  [ 输入框 ………………………………… ]                    [发送/停止] │
│ [? 帮助] [📚 技能] [⚙ 设置]    [模型 ▾][⚙模型] ……………      0/4000 │ ← 底部工具行
└────────────────────────────────────────────────────────────────┘
```

**分工原则**：顶部 = 导航/会话级控件；底部 = 工具/输入级控件。

已拍板的决策：
1. **技能市场**：双入口 —— 底部 `📚 技能` 图标 + 顶栏 Soul 芯片点击（均指向现有"技能市场 & 进化状态"弹窗）。
2. **帮助/设置**：底部小图标按钮（不做"⋯更多"溢出菜单）。
3. **会话控件**：顶栏 `🕘 当前会话标题 ▾` 下拉面板。
4. **顶栏不放品牌文字**（外层 ArtDialog 已有 "AI Agent" 标题）。
5. **快捷键提示条移除**（Enter/Shift+Enter/Tab 属约定俗成，帮助弹窗已有完整说明）。

## 3. 功能迁移映射

| 原功能 | 新位置 | 设计细节 |
| --- | --- | --- |
| 品牌标题 | 删除 | 冗余信息 |
| Soul 面板 | 顶栏右侧**状态芯片** `● 健康 · Lv.N · 进度%` | hover tooltip（模式数/成功率）；点击打开"技能市场 & 进化状态"弹窗 |
| 会话列表 | 顶栏左侧**下拉面板** | 宽 260~320px、max-height 300px 滚动；顶行标题"会话"；列表项=标题+悬停✕删除、当前项高亮；点选即切换并收起；点外部/Esc 收起；空态"暂无会话" |
| ＋新建会话 | 顶栏左侧独立按钮（高频操作） | 逻辑不变 |
| 技能市场 | 底部 `技能` 图标 | 打开现有弹窗 |
| 帮助 ? | 底部 `帮助` 图标 | 打开现有弹窗；`Ctrl+H` 不变 |
| 设置 | 底部 `设置` 图标 | 打开现有弹窗 |

## 4. 实施要点

### 4.1 元素 ID 保持约定（关键）

下列 ID **原样保留、仅挪位置**，使既有 JS（`renderSessions` / `updateSidebarSoul` / 各弹窗事件）几乎零改动：

- 顶栏：`newSessionBtn`、`sessionList`（移入下拉面板）、`soulLevelBadge`、`healthDot`、`healthText`、`sidebarProgress`
- 底部：`helpBtn`、`skillsBtn`、`settingsBtn`
- 隐藏保留（芯片 tooltip 用，DOM 仍在）：`sidebarPatterns`、`sidebarSuccessRate`、`sidebarProgressFill`

### 4.2 唯一新增 JS（约 30 行）

- 会话下拉：toggle、点击外部关闭、Esc 关闭（并入现有全局 Esc 处理）、点选会话后收起。
- `renderSessions()` 内追加一行：同步顶栏"当前会话标题"。
- Soul 芯片：点击 → 触发 `skillsBtn`；`updateSidebarSoul()` 追加一行更新芯片 tooltip。

### 4.3 CSS 改动范围

- index.html 内联样式：删除 `.sidebar*`、`.section-header`、`.section-btn` 规则；**保留** `.session-list` / `.session-item*`（下拉列表复用）；新增 `.top-bar` / `.session-dropdown` / `.soul-chip` / 底部工具按钮样式；新增窄屏媒体查询。
- `css/styles.css`：**不动**（ui.html 仍在用）。
- 深色主题（index.html `body.dark-theme` 区块）：删除 sidebar 相关规则；为新组件补 dark 变体。

### 4.4 响应式（iframe 内视口=弹层宽度，@media 生效）

- `< 560px`：顶栏收窄（会话标题限宽省略、芯片只留 `● Lv.N`+健康点）。
- `< 420px`：底部工具按钮仅图标；字符计数隐藏。

### 4.5 交互层级

- Esc 处理顺序：先关会话下拉，再关弹窗（并入现有全局 keydown）。
- 下拉打开时点击消息区/输入区自动收起。

## 5. 自测清单

- [ ] 新建/切换/删除会话/空会话；删除当前会话后标题回"未选择会话"
- [ ] 下拉：点外部关闭、Esc 关闭、点选后收起、当前项高亮、悬停删除
- [ ] Soul 芯片：数据刷新、tooltip、点击打开技能弹窗（完整 Soul 数据同步）
- [ ] 底部：帮助/技能/设置三弹窗；`Ctrl+H`；模型选择/管理不受影响
- [ ] 视口：ArtDialog 停靠态（≈500px）与全屏直链（宽）两种；最大化/还原
- [ ] 主题：浅色/深色
- [ ] 无控制台报错；`sessionList` 隐藏状态下渲染不影响

## 6. 变更记录

- **2026-09-17**：方案确认并实施（移除左栏 → 顶栏会话控件+Soul 芯片、底部工具行；移除快捷键提示条）。
- **2026-09-17（实施与实测）**：
  - `index.html`：删除 `aside.sidebar` 与其内联样式；新增 `.top-bar`（`#newSessionBtn` / `#sessionToggleBtn` / `#sessionDropdown` / `#soulChipBtn` / `#currentSessionTitle`）；底部 `.input-bottom-bar` 增加 `.input-tools`（帮助/技能/设置 图标，ID 不变）并移除快捷键提示；新增深色主题适配与 620/480/400px 三档媒体查询。
  - JS：新增 `updateSessionToggleTitle()`（`renderSessions()` 内调用）、会话下拉 IIFE（toggle/点外部/Esc 关闭，选中后收起）、Soul 芯片点击（触发 `skillsBtn`）、`updateSidebarSoul()` 追加芯片 tooltip；全局 Esc 追加关下拉。
  - 实测（8100，junction 部署直链）：无控制台错误；宽屏/520px/400px 布局无溢出；下拉打开/选中收起/点外部关闭/Esc 关闭均通过；芯片→技能弹窗、新会话标题同步、工具图标（26×26）可见；400px 下进度与字数按断点隐藏。
  - 插曲：批量编辑时 Esc 处理块曾被拼接错位（`Ctrl+L` 分支丢行），已修复；此后以 `node vm.Script` 对内联脚本做整体语法校验（见仓库记忆）。
  - 收尾微调：输入框 placeholder 同步精简（去掉快捷键说明）；窄宽度（<480px）隐藏"系统健康"文字时同步隐藏其后的分隔符（芯片显示 `Lv.1 · 0%`）。
  - 宽屏优化：移除 `.chat-container` 的最大宽度限制（原 inline `max-width:1000px; margin:0 auto`，styles.css 另有 900px 旧值被其覆盖）→ 改为 `max-width:none; margin:0`。用户拉大窗口/弹层时消息区与输入区满宽显示（1600px 视口实测容器=视口宽，无两侧空白）。styles.css 保持不动（ui.html 兼容）。
  - ⚠️ 缓存提示：Agent 页在 ArtDialog iframe 中按浏览器缓存策略加载，更新静态页后首次可能显示旧缓存版本；**硬刷新（Ctrl+F5）一次**即可。若希望每次打开强刷，可在 `openAiChat()` 的 iframe src 加时间戳参数（未做，按需评估）。

## 7. 扩展：仓库详情页 Agent 入口（project.html / project_en.html）

目标：进入仓库（仓库详情页）后也能用 Agent，且**不打断当前的仓库/文件浏览视图**——与仓库列表页 `projects.html` 行为一致（右侧停靠弹层 + 图标互斥）。

### 7.1 实现（纯前端，无 Java 改动）

- 改动位置：`WebRoot/web/project.html` 与 `WebRoot/web/project_en.html` 的**页面尾部**（`<script src="project.js">` 之前）各插入一段自包含代码：
  - `#ai-chat-icon`：左下悬浮图标（60×60 渐变圆，`position:fixed; z-index:9999`），初始 `style="display:none"`；
  - `openAiChat()`：与 `projects.html` 同一实现——`id: "ArtDialogAiChat"`；右侧停靠（宽 ≈50%、下限 420、上限 视口-40）；`top = 导航栏高 + 10`；高 = 视口高 - top - 55；`zIndex:2000`（> 本页导航栏 `z-index:300`，最大化后标题栏/关闭按钮不被遮）；`fixed:true`；打开时隐藏图标、`close` 回调恢复；已存在则 `zIndex().focus()` 不重复创建；移除 `.aui-footer` 按钮栏。
  - 入口显示条件：`POST /DocSystem/Repos/getAiModelList.do` 返回 `ok`。该接口只校验服务端 LLM 配置（未配置/未启用/无模型时返回 error），**不校验登录态**，因此与列表页保持一致即可，无需额外登录门禁。
- **无需引入任何资源**：两页已自带 `css/artDialog.css`、`dialog.js`、`dialog-plus.js`、`js/artDialog.js`（实际生效的是 v6 版 `js/artDialog.js`，含全局 `artDialog.list`）。
- **未改 `project.js`**：该文件同时被中/英文页引用且近 3k 行，登录检查 `SysInit()` 保持原样；AI 入口完全自包含于页面尾部脚本，避免回归风险。

### 7.2 实测（8100，junction 部署，视口 795×876，已登录 Admin）

- 图标按预期显示；点击打开弹层：`position:fixed`、`z-index:2000`、左 355 / 上 61 / 宽 420 / 高 795（导航栏高 51，底部留白 20）；仓库树与文档区在左侧仍可见可用；
- iframe 内 Agent 页加载正常（顶栏 / 新会话 / 会话下拉 / 帮助 / 技能 / 设置 / 模型选择器均在，无左栏残留）；
- 关闭按钮 → 弹层移除、图标恢复 `display:flex`（jQuery 1.10.2 的 `.show()` 会清空内联 `display`，样式表 `flex` 生效——已实测确认，无需改用 `.css()`）；
- 重复调用 `openAiChat()` → 弹层仍只有 1 个（去重生效）；
- 页面无其它 `fixed/absolute` 角标元素，图标不与文件树、翻页控件（prev/next）冲突；
- 控制台仅见既有历史问题：head 中 jPlayer 的 `Cannot read properties of undefined (reading 'fn')` 与 `stackeditForVDoc.html` 404，均与本改动无关。
- 校验：`node vm.Script` 对两页全部内联脚本块做语法解析，0 错误（脚本：`%TEMP%\check_html_js.js`，用法 `node check_html_js.js <html路径>`）
