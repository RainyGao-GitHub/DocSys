# CURRENT_STATE — 仓库列表页（projects）搜索优化（工作卡）

建立于 2026-10-09。**状态：调研 + 方案已完成；已裁定 4 项（范围保持全仓 / 不跳过仓库 / 不排除源码目录 / **实施形态 = 先 P0+P1+P2 子项 1/2/4，之后 P2-3 变体 1**）；仍待裁定 1 项（热循环日志 A/B/C），实施未开工。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 参考计划 / 当前进展 / 下一步 / 生效约束。
> 用户原始诉求三条：① 搜索过程无明确指示（只禁用输入框），慢时像卡住 → 调研竞品交互；
> ② 搜索很慢 → 查后台接口性能与是否"仓库顺序搜索"；③ 结果只高亮标题，摘要命中未高亮。
> **交付物是文档 + 方案** —— 未获裁定前**不要开工改代码**。

## 任务

优化 `projects`（仓库列表页）的搜索体验：交互（进度/取消/不清空） + 性能（后端吞吐） + 结果高亮（摘要也要高亮）。
用户要求：**先调研 → 出方案 → 确认后开工**，多阶段实施。

## 必读上下文（续接锚点，不必全文重读）

- **`devDocs/仓库列表搜索优化方案.md`**（本次交付物，实施前必读；含现状链路、实测数据、竞品调研、P0~P3 方案、验收口径、风险、§7 待裁定问题、§8 证据索引）
- 关键代码锚点：
  - 前端：`WebRoot/web/projects.js:305 searchDoc()`（只传 searchWord/sort，不传分页）、`:321`（唯一"进度"=禁用输入框）、`:362-363`（高亮只加在 `name`/`info`）、`:392 showSearchResults()`（客户端分页）、`:469 searchWordsRender()`；模板 `WebRoot/web/projects.html:278`（摘要字段是 `content`，**base64**）；**仓内搜索共用同一接口**：`WebRoot/web/project.js:3985`
  - 后端：`src/com/DocSystem/controller/DocController.java:7341 searchDoc.do`（全仓搜索 + **阻塞**取结果 + **没用** pageIndex/pageSize）、`src/com/DocSystem/websocket/BusinessChannel.java:1173 searchDocAsync` / `:1195 waitForEndOfAsyncSearch`（3 min 等待 + 强行退出）、`src/com/DocSystem/websocket/BusinessBaseController.java:4843 searchInRepos` / `:5040 convertSearchResultToDocList`（响应前抽前 10 条整篇内容）、`src/com/DocSystem/websocket/entity/DocSearchContext.java`（maxThreadCount=10 / retrySleepTime=3min / maxNumOfContext=10 / maxContentSize=1000 / convertToBase64）
  - 日志放大器：`src/util/LuceneUtil/LuceneUtil2.java:845/904/929/960/962/991/1023`（每命中/每词 Log.debug）
- 相关既有能力（复用时先读）：`WebRoot/web/reposTextSearchSetting.html`（仓库全文检索设置）、`isRealDocTextSearchIgnored`、`tmp/OfficeText/<pathHash>_<name>/officeText_*.txt`（Office 文本缓存）、`getAccessableReposList`

## 当前进展（如实）

1. ✅ **现状链路已读透**（本人执行，读代码非推测）：前端两个入口共用 `/DocSystem/Doc/searchDoc.do`；后端"每仓一线程 + 阻塞等全部 + 全量返回 + 响应前抽前 10 条整篇内容"；热循环逐命中 debug 日志。
2. ✅ **问题 3 根因已定位**：高亮写在 `jsonObj.info`（`projects.js:362-363`），而模板渲染的摘要是 `{{# doc.content}}`（`projects.html:278`）→ 摘要永远不会高亮；另 `searchWordsRender` 有 `str.length > keyword.length` 才高亮 + 只支持单关键词。
3. ✅ **实测数据（2026-10-09 10:02–10:06，dev 8100，Admin，20 个可访问仓库）**：
   - `合同` → **14.0 s / 35 命中 / 42 KB**；`test` → **210.4 s（≈服务端 3 min 强制上限）/ 898 命中 / 497 KB**
   - 索引体量悬殊：`repos_5_RDoc` = **486 MB**（repo5="test" 仓库，索引了整棵源码树），其余仓库 65 B~114 KB → 慢的**主因是单个超大索引仓库**，不是"仓库数量多/顺序搜索"
   - dev `docSys.ini/debugLogLevel = 0`（debug）→ 两次搜索 `docsys.log` +8.6 MB
4. ✅ **竞品交互调研完成**（方案 §3）：Google/GitHub/VS Code/Gmail/Slack/资源管理器 的进度、增量、取消、计数+耗时做法，已逐条映射到我们的可落地项。
5. ✅ **方案已成文**（P0 度量止血 / P1 前端交互 / P2 后端吞吐 / P3 高亮 + 验收口径 + 风险 + §7 待裁定）。
6. ⚠️ **未改任何代码**（纯只读调研；仅创建本卡 + 方案文档）。
7. ⚠️ **未跑测试**（无代码改动，无护栏数字）。
8. ✅ **用户裁定（2026-10-09）**：① 默认搜索范围**保持"全部可访问仓库"**（本页不存在"当前仓库"概念）；② **不跳过**任何仓库 —— 已按代码核实：全文检索开关只作用于 **RDoc/VDoc** 索引（`isRealDocTextSearchEnabled` 唯一调用点 `addIndexForRDoc():14402`），**DocName 索引不受限**（`addIndexForDocName():14278` 无开关判断），关掉全文检索的仓库**仍能命中文件名**；③ repo5 类超大索引**不排除源码目录**。仍待裁定：热循环日志选项。④ **实施形态（2026-10-09）**：先做 P0+P1+P2 子项 1/2/4，**之后**再做 P2-3，且 P2-3 采用**变体 1**（复用 `searchDoc.do` + `scope` 参数、前端两次请求；~100–200 行 / 0.5–1 天），**不做**变体 2（真流式/SSE，2–4 天）——变体 2 待变体 1 落地后评估。
9. ✅ **热循环日志已量化**（供第 5 问裁定）：两次搜索（`合同` 14 s + `test` 210 s）共 **13,650 行**非空日志，其中 **11,360 行（83%）** 是 `LuceneUtil2` 的逐命中/逐词 debug；选项 A/B/C 见方案 §4 P0-3。
10. ✅ **已提交**：本卡 + `devDocs/仓库列表搜索优化方案.md` + `CLAUDE.md` 指针，主仓库 `devInt` **同一次提交**（查：`git log -1 -- 'DevAgentControl/CURRENT_STATE_projects搜索优化.md'`）。

## 下一步

1. **只剩 1 项待裁定**：热循环日志选 **A / B / C**（方案 §4 P0-3）。
   开工顺序已定：**P0 → P1 → P2 子项 1/2/4 → P2-3（变体 1）→ P3**。
   ⚠️ P0 里"加阶段计时"与日志选项无关、可先做；**日志整改等选项定下再动**（否则会返工）。
2. 获裁定后按 P0 → P1 → P2 → P3 推进；**P0 必须先跑**（把"到底哪里慢"变成数字：逐仓查询 / 磁盘探测 / 内容抽取 / 组装），不要凭本卡实测直接改 P2。
3. P1/P2 改动涉及**两个前端入口**（`projects.js` 跳仓 + `project.js` 仓内），改接口/字段必须同时兼容。
4. P3 高亮注意模板 `{{# }}` 不转义 → 高亮标记要在转义后插入（现已有 XSS 隐患，一并处理）。
5. 每阶段收尾按项目惯例：编译（`-encoding UTF-8 -parameters -g`）+ 重启 dev Tomcat + 真实浏览器 E2E（含分页/取消/超时文案）+ 更新本卡与方案文档。

## 生效约束

- **开工前是否需要先提交**：需要，且**已完成**（方案文档 + 本卡 + `CLAUDE.md` 指针，主仓库 `devInt` 同一次提交）。
- 已裁定的产品口径不得违背：不得引入"默认当前仓库"、不得跳过仓库、不得排除源码目录（见「当前进展」第 8 条）。
- 不得为"让搜索变快"而降低结果正确性（如静默跳过仓库）——跳过必须有**显式提示**（"部分仓库未参与"）。
- dev 环境 `debugLogLevel` 对性能影响很大：**性能数字必须标注日志级别**，不要把 dev 的日志开销当作生产收益。
