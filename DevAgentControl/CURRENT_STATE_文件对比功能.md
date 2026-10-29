# CURRENT_STATE_文件对比功能（工作卡）

建立于 2026-10-28。**状态：调研完成，方案已成文待用户裁定，未改任何代码，未开工。**
来源：Gitee issue [I54IJU](https://gitee.com/RainyGao/DocSys/issues/I54IJU)（2022-04 提的【NewFeature】文本文件对比功能，待办）。
用户 2026-10-28 指示：先建卡 + 调研方案（候选 CodeMirror，用户不确定是否合适，要求调研有无更好方案），**用户确认方案后才开工**。

> 本卡是**当前任务**的唯一口径处：必读上下文 / 当前进展 / 下一步 / 生效约束。

## 任务（用户原话归纳，2026-10-28）

实现文件对比功能，覆盖三个场景：
1. **选两个文件对比**；顺带裁定：是否需要多文件对比（如三方，用户见过 git 冲突页那种，但没想到超三个的场景）。
2. **文件两个历史版本对比**（历史列表选两个版本 / 查看某版本相对改动）。
3. **AI 对比技能的结果呈现**：AI 调用对比技能后展示对比结果链接（参照文件改动后的产物链接），点击打开对比窗口。

## 调研结论（2026-10-28 完成，详见方案文档）

- **方案文档**：`devDocs/文件对比功能方案.md`（成文后为准，含候选库对比表与裁定问题）。
- **前端库推荐：CodeMirror 5 merge addon**（+diff_match_patch，两个纯 script 库）——唯一同时满足
  「免构建 script 引入 / 双栏+行内视图 / 折叠相同段 / 对齐 / 可选 revert / 支持将来三方」的成熟方案。
  CodeMirror 6 官方 merge 包只有 ESM 必须 bundler（本项目无构建链，一票否决）；Monaco DiffEditor
  最强但重（~MB 级）且 **AMD 免构建方式已被官方废弃**；Mergely 停维护；diff2html 只读无编辑器对齐。
- **取数零后端新增（场景 1/2）**：`getDocContent.do` 已支持 `commitId + historyType + shareId/authCode`，
  文本直读、**Office/PDF 走既有文本提取**（`checkAndGenerateOfficeContentEx`）。
- **场景 3 需新增** agent 工具 `compare_docs`（后端取文本 + diff 摘要给模型）+ `AgentProductLink`
  扩展 compare 产物形态 + agent 前端识别打开对比窗口。
- **对话框模式**：artDialog + iframe `xxxForArt.html`（照 historyLogsForArt 先例）；参数走
  artDialog data / sessionStorage（不走 URL——多选 @ 的 8KB 请求行先例）。
- **三方对比建议本期不做**（DocSys 无合并冲突场景；CM5 merge 将来要加也支持 origLeft+origRight）。

## 用户裁定（2026-10-28，开工依据，对应方案文档 §9）

- **A** = CodeMirror 5 merge addon（+diff_match_patch）。
- **B** = 本期只做两方；三方另立卡。
- **C** = 对比窗口只读。
- **D** = AI 工具返回差异摘要 + 对比链接。
- **E** = 单侧 >2MB 拒绝；二进制只支持 Office；**Office 对比 = 对比窗口内并排打开两个 Office 查看器**
  （不做提取文本比对；双实例风险 M4 验证；场景 3 摘要仍用提取文本算）。
- **F** = M1 窗口+右键入口 → M2 历史对比 → M3 AI 工具与链接 → **M4 Office 并排模式**+打磨回归；
  每阶段模型实测 → 用户验收。**已获裁定，按 M1 开工。**

## 当前进展（如实）

- ✅ 2026-10-28：调研与方案成文；用户六项裁定（CM5 merge / 两方 / 只读 / 摘要+链接 / Office 并排（M4）/ M1→M4）。
- ✅ 2026-10-28：**M1 实施完成并实测通过，用户已验收并提交 `75815a34d`**。
- ✅ 2026-10-28：**用户裁定交互简化**（原话归纳）：不用两步式子菜单——**选中两个文件（Ctrl 多选）→ 右键「对比」直接开窗**；
  选 1 个提示需选两个、>2 个提示只支持两个。**已实施并实测通过，等用户验收**。

### 交互简化实施（2026-10-28，project.js，未提交）

- 删除两步式（gComparePendingDoc/selectCompareDoc/doCompareWithSelectedDoc/cancelCompareSelection）。
- 新增 `compareSelectedDocs()`：以 **zTree 多选为唯一事实源**（getSelectedNodes 过滤 type==1）；
  <2 → 提示「请先选中两个文件（Ctrl+点击 多选）」；>2 → 「目前只支持两个文件对比」；==2 → openCompareWindow（先选=左基准）。
- **文件列表新增 Ctrl 增量选中**（原列表只单选，多选只在目录树）：`docListOnMouseDown` ctrl 分支 →
  `listCtrlSelectDoc`（zTree selectNode(node,true) + 列表高亮 #e8f0fe + 置 gListCtrlSelecting）；
  `DocListOnClick` 开头：ctrl 点击跳过单选/预览；普通点击 `resetListMultiSelect()`（清高亮+清 zTree 多选，恢复单选语义）。
- 4 处右键「对比」子菜单 → 单项「对比」（#tree、#secondList×2、#docPreview，同一 compareSelectedDocs）。
- project.js 版本 bump → `?v=20261028c`。

### 交互简化实测（2026-10-28，dev 浏览器）

1. 列表 Ctrl 点两个（test.md + JS调用测试.xlsx，高亮 2 行）→ 右键对比 → 窗口开、左 test.md 右 xlsx、Office 占位 ✓
2. 树选 test.md + agent-test/hello.txt（跨目录）→ 右键对比 → 双栏 diff 窗、统计「+0/-1·1 处变更」✓
3. 只选 1 个 → 提示「请先选中两个文件（Ctrl+点击 多选）再进行对比!」✓
4. 意外复现 >2（残留旧选中）→ 提示「目前只支持两个文件对比」✓
5. 普通单击 → 多选高亮清零、zTree 恢复单选 ✓
6. ⚠️ 已知边界：zTree 多选残留（如从搜索态切回）会让计数包含旧节点——普通点击会复位；如需更强清理可在
   showDocList 里调 resetListMultiSelect（暂未加，避免动既有流程）。

### M3 实施与实测（2026-10-28 晚，dev，已发布待用户验收）

**实施**（后端两文件 + agent/index.html，已编译发布重启）：
- `DocSysToolFactory.compareDocs(client)`：新只读工具 `compare_docs`（参数 vidA/pathA/nameA + vidB/pathB/nameB，
  必填 vid+name；跨仓库支持）。执行：`client.getDoc`×2 取文本（`extractDocTextOrNull`）→
  `compareTextSummary`（**换行符归一化**（与前端一致）→ 行集合差异 +N/-M → `appendDiffSamples`
  朴素对齐扫描前 3 处差异样本，>50 万行跳过样本）→ `ToolResult.ok(summary, AgentProductLink.compareOf(...))`。
  注册进 `createReadOnlyRegistry`。
- `AgentProductLink`：PRODUCT_TOOLS 增 compare_docs；`Product` 增 `pair` 字段（{left:{vid,path,name,docType},
  right:{...}}，toJson/fromJson 同步）；新增 `compareOf(...)` 工厂。
- `agent/index.html`：`extractProducts` 带 pair；`renderProductLinks` compare 分支渲染「⇄ A ⟷ B」链接
  （pair 经 encodeURIComponent 存 data-pair）；点击委托识别 `data-compare` → `openComparePair(pair)`：
  同源父窗口有 `openCompareWindow`（project 内嵌场景）复用之，否则写 sessionStorage
  （键 `docsys_compare_pair`，与 project.js 一致）+ `window.open('compareForArt.html?from=agent')`
  （新窗口继承 sessionStorage 快照；DocCompare 无 dialogId 时自动读该键）。

**实测**（2026-10-28 晚，dev agent 页真实 LLM 会话）：
1. 发「对比 agent-test/hello.txt 和 根目录 test.md」→ 模型调用 `compare_docs:success`（另带 2 次 get_doc 定位），
   回答含差异摘要（A=5行 vs B=1行、B 相对 A 新增约 1 行删除约 5 行）✓
2. 回答末尾渲染产物链接「⇄ hello.txt ⟷ test.md」，data-pair 携带两侧定位 ✓
3. 点击链接 → sessionStorage 写入 → compareForArt 直开渲染：左=agent-test/hello.txt(42B, "hello v2")、
   右=test.md(10B, "# Markdown")、统计 +1/-4·2 处、7 行删除标记 ✓
   （自动化里 window.open 被弹窗拦截——合成点击无用户手势；真实用户点击有手势不受影响，
   sessionStorage 通道已同 tab 导航等效验证。）
4. 兼容：旧产物 new/modified 走原分支不受影响；测试会话已删。

**版本参数**：无新增外链引用（agent 页改动全在内联脚本；compareForArt 引用未变）。

### M5.1 实施与实测（2026-10-28 晚，后端目录对比，dev 已发布待验收）

**背景**：用户 2026-10-28 裁定——目录对比做成 M5 且要可视化界面（先于 M4）；方案见
`devDocs/文件对比功能方案.md` §11。分两段：M5.1 后端目录 diff + AI 链路（本节）→ M5.2 前端目录视图。

**实施**（`DocSysToolFactory.java` + `AgentProductLink.java`）：
- `compare_docs` **自动分流**：getDoc 的 `data.type`（1=文件/2=目录）判定（实测发现 getSubDocList
  对"文件当目录查"会误导性返回 ok+1 条，不能用列表探测）；文件与目录混合 → 明确提示不支持。
- 目录分支 `compareDirsSummary`：BFS 递归 `getSubDocList` 收集两侧树（上限：条目 1000/深度 8/文本
  内容对 100，超限截断并如实标注）→ 四类清单（仅A/仅B/内容不同/相同；目录对不单列，空目录差异由
  onlyX 体现；类型不匹配标注）→ 文本文件逐对 `lineSetDiff`（EOL 归一化行集合差异）给 +N/-M；
  非文本按大小判（"大小相同，未比对内容"如实标注）→ 摘要（统计 + 每类前 8 样本）。
- `AgentProductLink.compareOfDir`：pair 两侧加 `kind:"dir"`（M5.2 前端识别）。
- 工具描述更新（文件/目录双语义）。

**实测**（2026-10-28 晚，dev，磁盘造 cmp-a/cmp-b 已知差异目录 → agent 真实对话）：
- 模型调 `compare_docs:success` 目录分支，摘要四类**与造数完全一致**：仅A有 2（only-a.txt、sub/inner.txt）、
  仅B有 2（only-b.txt、sub/inner2.txt）、内容不同 1（diff.txt +3/-2）、相同 1（same.txt）✓
- 模型基于摘要进一步解读（读两边 diff.txt 内容讲差异语义）——LLM 解读层的预期行为 ✓
- 产物链接「⇄ cmp-a ⟷ cmp-b」pair 带 kind:"dir" ✓
- 测试目录（磁盘直放）与会话已清理。

**M5.1 未测项**：条目/内容对超限的截断提示（造大目录成本高，逻辑简单）；混合类型提示（分支直给文案）。
**注意**：磁盘直放文件绕过 DocSys 元数据（仅测试用法，产物正常）；M5.2 前端目录视图点击
kind:"dir" 的链接暂走文件对比（getDocContent 对目录返回空）——M5.2 接管。

### M5.2 实施与实测（2026-10-29，前端目录对比视图，dev 已发布待验收）

**实施**（DocCompare.js + compareForArt.html×2 + project.js + agent/index.html）：
- `DocCompare.run` 按 `pair.*.kind=='dir'` 分流目录模式（混合类型提示；agent 的 compareOfDir 与
  project.js 的 buildCompareRef 都带 kind）。
- **目录视图**：前端 BFS 递归 `getSubDocList.do` 拉两侧树（并发≤6；上限与后端一致：条目 1000/深度 8/
  文本对 100，超限如实标注）→ 四类清单（规则同 M5.1）→ 表格渲染（🟡不同/🔴仅左/🟢仅右/⚪相同 +
  文本文件 +N/-M；默认筛选"有差异"，五档筛选；渲染上限 300 行）。
- **下钻**：点"内容不同"的文本文件行 → 复用文件 diff 视图（MergeView）+ 面包屑「« 返回目录对比」返回。
- **入口放行**：buildCompareRef 放行目录（kind 字段）；compareSelectedDocs 同类型校验（混合提示）；
  列表 Ctrl 多选放行目录。
- 版本：DocCompare.js `?v=20261029c`；project.js `?v=20261030`（2026-10-29 随语法修复 bump）；
  **对比窗 iframe src 加 `&_v=20261030`**（openCompareWindow 与 agent openComparePair 两处——
  compareForArt.html 无自版本参数的历史包袱，靠引用方带版本，改它必须同步 bump 这两处）。

**实测**（2026-10-29，dev，cmp-a/cmp-b 已知差异目录）：
- Ctrl 双选两目录 → 右键对比 → 目录清单：**仅左侧 2 · 仅右侧 2 · 内容不同 1 · 相同 1**（与数据一致），
  默认"有差异"视图 5 行、diff.txt 显示 +3/-2 ✓
- 下钻 diff.txt → 文件双栏 diff（v1/v2、+3/-2·4 处）+ 面包屑 ✓；返回目录视图恢复 ✓；筛选"相同"仅显 same.txt ✓
- （agent kind:dir 链接与右键入口走同一 DocCompare 通道；agent 端到端留给用户验收一并验证）
- **2026-10-29 用户已验收提交**（含语法错误修复）。

### M5.3 目录对比树形视图（2026-10-29，用户建议：像目录树一样双栏展示+懒展开；**已验收，提交 9c89cf0d3**）

**用户需求**：平铺清单改为两侧目录树结构；默认只展示第一级，目录不直接展开只标记有无差异，点击后展开。

**实施取舍**：数据收集仍是打开时一次 BFS 全树（上限保护不变）——这样未展开的目录节点也能**准确**
标记子树有无差异（真按需拉取做不到"不展开就知道"），点击展开零延迟；"懒"体现在渲染层（默认只渲染
第一级）。

**改动**（DocCompare.js + compareForArt.html×2 + project.js + agent/index.html + project.html×2）：
- `buildDirTree()`：平铺 rows → 嵌套树（目录对无平铺行，靠 `rollup` 递归汇总子树差异 subDiff；
  节点带 side（两侧/仅左/仅右）、drill 等属性；open 展开态挂在节点上跨筛选/下钻保持）。
- `renderDirList()` + `emitTreeRows()`：树形渲染——每行 [▸展开箭头][🟡🔴🟢⚪][左名][右名][Diff]，
  目录行带子树汇总标记（🟡"内部有差异（点击展开）"/⚪"内部完全一致"tooltip），缩进 18px/级，
  同级目录在前按名排；**默认仅第一级、目录收起，展开完全由用户点击控制**（初版曾在筛选态强制展开
  匹配路径，实测与用户要求不符已去掉）；双栏：仅左侧→右格"—"、仅右侧→左格"—"。
- 筛选改为树形剪枝：`subtreeMatches`（自身或子孙命中才显示；目录因子孙命中而显示时非匹配子级隐藏）；
  统计口径不变（按平铺 rows 四类计数）；渲染上限 300 行逻辑保留。
- 文案新增：colLeft/colRight（表头"左 · 基准/右 · 对比"）、dirSubDiff/dirAllSame（中英）。
- 版本全链 bump **20261031b**：DocCompare.js?v=（两 compareForArt html）、iframe `&_v=`
  （project.js + agent openComparePair）、project.js?v=（project.html/_en.html）。

**实测**（2026-10-29，dev，磁盘直放测试目录 cmp-tree-a/cmp-tree-b 于仓库根，含嵌套四类差异）：
- 首屏：**仅 6 行一级条目**，目录全收起（▸）带标记（sub-diff 🟡"内部有差异（点击展开）"、
  sub-only-a 🔴、sub-only-b 🟢），统计 仅左4·仅右4·不同2·相同2 与数据一致 ✓
- 点 sub-diff → ▾ 展开 3 个子行（mod2.txt 🟡+2/-1 可下钻、only-a2 🔴、only-b2 🟢），其余目录保持收起 ✓
- 下钻 mod.txt → 双栏 diff（+2/-1·3 处）+ 面包屑；返回 → 树恢复且 sub-diff 仍展开 ✓
- 筛选：全部=补出 sub-same ⚪/same.txt ⚪；相同=仅 2 行 ⚪；仅左侧=sub-diff(▾ 只显 only-a2)+
  sub-only-a(▸)+only-a.txt；切回有差异正常 ✓（展开状态跨筛选保持）
- 文件对比回归：apply_changes…md ⟷ …-1.md → +9/-7·5 处变更 ✓
- 测试目录 cmp-tree-a/cmp-tree-b 留在仓库根供用户验收，验收后可删。
- **缩进优化（2026-10-29 用户反馈"平级错觉"后追加）**：原先只给名字单元格缩进、箭头/状态点是固定列，
  层级感弱；改为**整行随层级缩进**（row padding-left = 14 + depth×22，箭头+状态点+双栏一起右移），
  版本链 bump `20261031c`。测试数据补了三级嵌套（sub-diff/deep/d.txt）。用户要求测试目录保留
  至 M4 回归后再删。

### ⚠️ "缓存玄学"复盘 + 真 Bug：compareForArt 启动脚本语法错误（2026-10-29 修复，用户报告触发）

**用户实测目录对比回报窗口空白**（截图：标题停在静态「左·基准/右·对比」、工具栏按钮在、主体空白）。
真正根因：**compareForArt.html 与 _en.html 的内联 lang 脚本里 `mixedUnsupported` 字符串混入裸换行**
（python heredoc 转义坑，本该 `\n`）→ SyntaxError → 整个 `<script>` 解析失败 → `DocCompare.init()`
从未执行 → 只剩静态 HTML。**之前记的"IAB 忽略 query 的缓存层"结论有误**——当时 iframe 流程空白
而 `DocCompare.init(null)` 手动驱动正常，正是同一语法错误的表现（手动驱动绕过了启动脚本），
误判为缓存；js 带 ?v"一直正常"是因为 js 文件本身没语法错误。

**修复**：两 html 裸换行 → `\n`（提取内联脚本 `node --check` 双双通过）；按版本纪律 bump
`&_v=20261029→20261030`（project.js + agent/index.html 两处）、`project.js?v=20261029b→20261030`
（project.html/_en.html 两处）；6 个文件发布 dev。

**修复后真实浏览器（IAB）端到端回归全通过**：
- 目录对比：04-合同协议 ⟷ 99-杂项 → 统计「仅左侧 1 · 仅右侧 1 · 内容不同 0 · 相同 0」+ 五档筛选 +
  清单表（🔴/🟢 行）、标题=真实目录名、折叠/忽略空白按钮正确隐藏、iframe src 带 `_v=20261030` ✓
- 文件对比：apply_changes代码逻辑分析.md ⟷ …-1.md → 双栏 MergeView、+9/-7 · 5 处变更 ✓
- （期间无任何强刷，正常刷新即可——"缓存层"不存在，见上）

**教训**：①改 html 内联脚本必须整体语法校验（提取+node --check），不能只查引用的 js；
②"手动驱动正常"≠"真实入口正常"，自动化验收必须走真实 UI 路径（本轮 IAB 真实右键流程暴露了它）。

### M2 交互优化：详情页「对比」（2026-10-28 晚，用户裁定后实施，已验收提交 b991b71cc）

**用户裁定**：「与当前版本对比」入口不合适——改为**历史详情页**加「对比」按钮，查看**该次提交改动前后**
（本版 vs 上一版）。

**实施**：
- `DocHistory.showHistoryDetail`：dialog data 增 `versionLabel / parentCommitId / parentVersionLabel`
  （父版本 = 历史列表 index+1 行；最旧行无父 → null）。
- `DocHistoryDetail.js`：init 签名扩至 9 参；每条目行新增「对比」按钮 → `compareHistory(index)`：
  左=改动前（**移动/复制条目取 `srcEntryPath`**；新增/删除条目对侧为空=全增/全删展示）、右=改动后；
  host 用 parent 链向上找 `openCompareWindow`（详情 iframe→历史 iframe→project，实测 hostAt=2）。
- 工具条「与当前版本对比」**移除**（html×2 + JS 相关函数清理），只保留「对比选中的两个版本」。
- 版本：DocHistory.js → `?v=20261028c`；DocHistoryDetail.js 引用从无版本 → `?v=20261028e`。

**实测**（2026-10-28 晚，hello.txt 三版本）：
1. 行0（最新）详情 → 对比 → **左=@前1版(hello v1)、右=@最新(hello v2)、统计 +3/-2·4 处** ✓
2. 最旧行（前2版）详情 → 对比 → 提示「没有更早的版本，无法对比本次改动」、不开窗 ✓
3. 工具条只剩一个对比按钮 ✓

⚠️ **实施中踩的隐蔽坑（已修）**：`DocHistoryDetail` 的**导出包装函数**是旧 6 参签名，把页面传入的
9 参截断成 6 参转发——parentCommitId 静默丢失（症状：按钮点了只弹"没有更早的版本"）。
用 `arguments.length` 诊断日志定位（len=6 实锤），导出包装改 `apply(null, arguments)` 透传。
**通用教训：改内部函数签名时必须同步检查模块导出包装层。**

（未实测项：移动/复制条目的 srcEntryPath 分支——无现成数据；逻辑一行，留待真实场景。）

### M2 最初版实测记录（2026-10-28，勾选机制部分仍有效）

**实施**（`js/DocHistory.js` + `historyLogsForArt.html/_en.html` + `js/DocCompare.js`）：
- 历史页顶部新增对比工具条（`historyCompareBar`）：「对比选中的两个版本」「与当前版本对比（勾选 1 个）」；
  historyType **0/2/3 显示**，1（VDoc）/4（回收站）不显示。
- 行首复选框（`historyCk{i}`）：勾 3 个拒绝并提示；按钮联动 = 勾 1 启用「与当前」、勾 2 启用「两版对比」。
- 选中两版：**列表自上而下=新→旧，index 大（旧）= 左基准**；与当前：左=历史版（带 versionLabel @版本N）、
  右=当前（无 commitId，label @当前版本）。经 `window.parent.openCompareWindow(...)`（opener 兜底）。
- `DocCompare.fetchText`：带 commitId 时附 `needDeletedEntry:1`（历史版本可能是当时已删除的文件）。
- 版本参数：DocHistory.js 引用从无版本 → `?v=20261028b`；DocCompare.js → `?v=20261028g`（两历史页/两对比页）。

**实测**：
1. hello.txt 现场造两版（ace 编辑保存 v1/v2）→ 历史页 3 个版本 → 勾 2 个 → 对比窗口：
   **左=@前1版(hello v1, 23B)、右=@最新(hello v2, 42B)**、统计 +3/-2·4 处、内容真实来自历史版本 ✓
2. 勾 1 个 → 「与当前版本对比」→ 左=@前1版(v1)、右=@当前版本(v2)、统计同上 ✓
3. 勾第 3 个被拒绝（保持 2 个）✓；按钮联动（勾1/勾2 互斥启用）✓
4. 修复实施中一个导出名字错误（`compareWithCurrent`→实现为 `compareHistoryWithCurrent`）。

### ⚠️ 发现的既有后端数据问题（非 M2 范围，待用户裁定是否另立卡）

`apply_changes代码逻辑分析.md` 的历史索引（CommitEntry）指向版本目录 `2026-10-28/20261028201220/`，
但磁盘 `1_DISK_RReposes/2026-10-28/` 下只有 `20261028201313/`（且只含 -1.md）→
`getDocContent.do` 历史分支 checkout 不到文件，**返回 ok+空内容**（前端显示 0B/无差异）。
时间线：用户 2026-10-28 20:12-20:13 间上传 -1.md/移动 .md 产生提交，commitId(20:12:20) 与
实际目录(20:13:13) 差 53 秒——疑似「索引记录时刻 ≠ 版本目录落盘时刻」或移动操作未落版本文件。
**影响**：此类"索引有记录但目录缺失"的历史版本，对比/取内容均为空（既有行为，M2 之前就如此）。

### Bug 修复：折叠相同段无效（2026-10-28，用户报告：apply_changes…md ⟷ …-1.md；已验收 359d51c8f）

- **根因 = 换行符差异**：`.md` 为 CRLF（829 处）、`-1.md` 为纯 LF——逐行 diff 把 830 行全部判异
  （统计 +831/-829 的假象），**无相同段可折叠**（折叠本身工作正常）。
- **修复**：`fetchText` 归一化 `\r\n → \n` 后再进 diff/显示（业界默认行为，VS Code/Beyond Compare 同款）。
  修复后实测同一对：统计 `+9 / -7 · 5 处变更`、折叠 widget 4 个、5 个删除块、开关往返稳定。
- ⚠️ **教训两条**（已入踩坑备忘）：①**改 compareForArt 引用的任何资源必须同步 bump 其 `?v=`**
  （本次中途误判"折叠还有独立 bug"，实为 iframe 缓存旧 JS）；②自动化排查时若上一个对比窗口未关，
  读到的是**旧窗口 iframe** 的状态——复测前先关旧窗再开新窗。

### M1 实施内容（未提交）

- **vendor**：`WebRoot/web/static/CodeMirror5/`（5.65.19：lib + addon/merge + 14 个常用 mode + LICENSE，MIT）
  与 `WebRoot/web/static/diff-match-patch/`（1.0.5 + LICENSE，Apache-2.0），页面引用带 `?v=20261028`。
- **窗口**：`compareForArt.html` + `compareForArt_en.html` + `js/DocCompare.js`——
  参数双通道（artDialog data 优先 / sessionStorage `docsys_compare_pair` 兜底，不走 URL）；
  取数 `getDocContent.do`（**commitId 必须真缺省，传空串会后端 500**——以 commitId==null 区分当前/历史）；
  双栏 MergeView（**`origLeft`=基准在左 / value=第二个文件在右**——此 build 的 2-pane 是 value 左 orig 右，
  用 origLeft 才能让基准渲染在左且颜色方向正确）、行号、语法高亮（后缀→14 mode 映射）、
  差异统计（dmp 行模式；**npm 版 dmp 行方法为私有名 `diff_linesToChars_`，已双命名兼容**）、
  折叠相同段/忽略空白开关（重建式）、只读、2MB 上限、Office 占位提示（M4 换并排查看器）、二进制不支持提示。
  ⚠️ **CodeMirror 不能在 display:none 容器里构建**（会渲染空窗无差异标记）——必须先 show 再 build。
- **入口**：project.js 新增 `gComparePendingDoc`/`buildCompareRef`/`selectCompareDoc`/
  `doCompareWithSelectedDoc`/`cancelCompareSelection`/`openCompareWindow`（artDialog big + iframe）；
  右键「对比」子菜单 ×4 处（#tree、#secondList×2、#docPreview）。
  ⚠️ `#secondList` 有**两个** attach（菜单内容几乎相同但缩进/尾随空白不同）——改菜单要两处都改
  （本次 v2 漏改过一次，文件列表实际显示的是 v2）。
- project.js 版本参数 bump：project.html/project_en.html `?v=20261023 → 20261028b`（纪律）。

### M1 实测证据（2026-10-28，dev=TomcatForDocSysDev，浏览器）

1. **跨目录两文件对比**：05-技术笔记/apply_changes…md(36KB/830行) ⟷ 根/test.md(10B/1行)——
   右键两步全流程，窗口打开：左=基准(830行，**72 行红色删除标记**)、右=test.md、标题与内容一致、
   高度撑满、markdown 语法高亮、统计「+1 / -829 · 2 处变更」；截图经视觉模型核验通过。
2. **开关**：忽略空白切换（重建）后双栏与标记保持；折叠相同段默认开。
3. **Office 占位**：test.md ⟷ 深入ClaudeCode….docx → 英文中文占位提示（M4 前的预期行为）。
4. **防御分支**（4 条 toast 全实测）：未选基准点「与已选」提示；选基准提示含文件名；
   同一文件两次提示且保留 pending；取消对比选择清空。
5. **英文页**：compareForArt_en.html 直开——英文按钮 + 英文无参提示。
6. **菜单挂载**：4 处 attach 均含「对比」子菜单（DOM 验证；文件列表入口走全流程实测，其余同函数路径）。

### M1 未测项（如实）

- 单侧 >2MB 拒绝：无现成大文本素材，代码路径为取数后长度检查（简单）；用户验收时可造大文件抽查。
- 纯二进制（图片/压缩包）拒绝提示：同类分支（Office 已实测占位路径）。
- 对齐连接线（connect:'align' 的 SVG）：视觉核验提及 gap 存在但未明确连线——留 M4 打磨一并看。

### M4 Office 并排模式 + 对齐连接线（2026-10-29，dev 已发布待验收）

**Office 并排查看器**（两侧同为 Office/PDF → 对比窗内双 office.html iframe 并排只读；混合 Office+非Office 给提示）：
- `officeUrl(ref)`：按 `DocSys.buildRequestParamStrForDoc` 同款协议组参（reposId/docId/path/name/docType
  均 b64；**历史版本透传 isHistory=1&commitId&historyType&needDeletedEntry=1**；editEn=0 只读）。
- `renderOfficeCompare()`：整行隐藏"折叠/忽略空白"按钮，stats 显示"并排预览 · 只读"，左右各 50% iframe。
- **目录树下钻扩展**：Office 差异对（doc/docx/… 后缀）行也可下钻 → 并排视图+面包屑，返回恢复树。
- 触发路径全覆盖：两文件对比 / 历史详情页对比（@前1版 ⟷ @最新 两 commitId）/ 树内下钻。

**对齐连接线修复**：M1 起用的 `connect:'align'` 实为"只对齐窗格不画线"（merge.min.js 源码实证：
`"align" != connect` 才创建 SVG）→ 改 `connect: true`，双栏中间现绘制 diff 连接曲线（实测 3 条，
配合折叠相同段曲线短而清晰）。

**实测**（2026-10-29，dev，真实 UI 全流程）：
- base.docx ⟷ 写入功能测试.docx → 双 office 查看器渲染文档内容 ✓（用户亦已自测通过）
- cmp-tree 树内 报告.docx（🟡+41/-19）下钻 → 并排 + 面包屑 + 返回恢复树 ✓
- 软件测试报告模板.docx 历史详情页「对比」→ 左 @前1版(commitId 179034603324)/右 @最新(179034603551)，
  两侧 office.html 均带 isHistory=1&commitId&editEn=0，加载对应历史版本 ✓
- apply_changes md 对 → +9/-7·5 处变更 + 连接曲线 ✓（31e 全链）
- 版本链 bump 至 `20261031e`（DocCompare.js ?v= / iframe _v= / project.js ?v= 三层）。

**环境事故与用户裁定（2026-10-29）**：Office 查看器首测卡死整个渲染进程（evaluate 全挂起）——
用户裁定：**字体库未重置所致（环境问题）+ 以后 Office 编辑相关问题不调研、直接上报**（已记入
CLAUDE.md「验证要求」）。调研中顺带发现 OfficeEditor.js 对 127.0.0.1+外部 Office 模式 alert 阻断（既有
行为，不处理）。

## 下一步

1. **等用户验收 M4**（刷新 project 页，版本链 20261031e）：①Office 两文件对比（如 02-测试文件 里
   base.docx ⟷ 写入功能测试.docx）②Office 文件历史详情页「对比」③目录树内 Office 行下钻
   ④文本对比看双栏中间新增的连接曲线。
2. M4 验收通过 → **收尾归档**：删测试目录 cmp-tree-a/b（用户要求留到回归完）、工作卡移入
   DevAgentControl/已完成/。
3. 待用户裁定：是否为「历史索引指向缺失版本目录」另立排查卡（后端数据一致性）。

## 生效约束

- 新增静态库自托管到 `WebRoot/web/static/CodeMirror5/`（内网产品不依赖 CDN；带 LICENSE/NOTICE；
  CM5=MIT，diff_match_patch=Apache-2.0），页面引用加 `?v=` 起始版本（project.js 先例）。
- 新页面走中英双页惯例（`xxxForArt.html` + `_en`）+ `_Lang()`。
