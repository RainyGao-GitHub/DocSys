# CURRENT_STATE — 仓库列表页（projects）搜索优化（工作卡）

建立于 2026-10-09。**状态：P0 ✅ + P1 ✅ + P2-2 ✅ 已完成；⚠️ P0 的“组装 88~95% 是主因”已被实测推翻并修正；下一步待裁定（P2-1 / P2-3 / P3）。**

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
8. ✅ **用户裁定（2026-10-09）**：① 默认搜索范围**保持"全部可访问仓库"**（本页不存在"当前仓库"概念）；② **不跳过**任何仓库 —— 已按代码核实：全文检索开关只作用于 **RDoc/VDoc** 索引（`isRealDocTextSearchEnabled` 唯一调用点 `addIndexForRDoc():14402`），**DocName 索引不受限**（`addIndexForDocName():14278` 无开关判断），关掉全文检索的仓库**仍能命中文件名**；③ repo5 类超大索引**不排除源码目录**。⑤ **热循环日志（2026-10-09）**：选 **B**（删逐词/逐位置日志、只留汇总）—— 那些日志原本是接口调试期用的，接口已稳定。④ **实施形态（2026-10-09）**：先做 P0+P1+P2 子项 1/2/4，**之后**再做 P2-3，且 P2-3 采用**变体 1**（复用 `searchDoc.do` + `scope` 参数、前端两次请求；~100–200 行 / 0.5–1 天），**不做**变体 2（真流式/SSE，2–4 天）——变体 2 待变体 1 落地后评估。
9. ✅ **热循环日志已量化**（供第 5 问裁定）：两次搜索（`合同` 14 s + `test` 210 s）共 **13,650 行**非空日志，其中 **11,360 行（83%）** 是 `LuceneUtil2` 的逐命中/逐词 debug；选项 A/B/C 见方案 §4 P0-3。
10. ✅ **已提交**：本卡 + `devDocs/仓库列表搜索优化方案.md` + `CLAUDE.md` 指针，主仓库 `devInt` **同一次提交**（查：`git log -1 -- 'DevAgentControl/CURRENT_STATE_projects搜索优化.md'`）。
11. ✅ **P0 已完成（2026-10-09）**：后端阶段计时落地（`[searchDoc][逐仓汇总]` / `[逐仓完成]` / `[汇总]` / `[单仓]`）+ 日志瘦身（选项 B：删 `LuceneUtil2`/`HitDoc` 的逐命中/逐词/逐位置 debug，保留 `//P0(2026-10-09) 日志瘦身` 标记）。
12. ✅ **P0 实测（同关键词 `test`，20 仓 / 898 命中，跑 3 次，curl 已登录）**：
    - 端到端 **39.0 / 36.5 / 35.3 s**；逐仓（含等待）2.66 / 5.37 / 1.68 s；排序 0~2 ms；**组装（含前 10 条摘要抽取）36.22 / 31.08 / 33.60 s（占 88~95%）**；三段相加与端到端吻合（误差 <1%）
    - repo5（876 命中）逐仓仅 **2011 ms** ⇒ **486 MB 索引不是问题**（原"索引体量大"推断被推翻）；逐仓里"直查"（1 次 `docSysGetDoc`/仓）要 **70~88 ms/仓** ×20 仓 ≈ 1.5 s
    - 改造前同关键词 **210.4 s**（含部分冷缓存因素）；日志量 **13,650 行 / 8.6 MB → 1,671 行 / 0.18 MB（-98%）**
13. ✅ **P1 已完成（2026-10-09）**：`projects.js`（`gSearchState` + 4 个状态函数 + 重写 `searchDoc` 请求/取消/错误分支 + `showSearchResults` 结果头部）、`projects.html`/`projects_en.html`（`#searchStatusBox`/`#searchResultInfo`）、`lang/en.js`（5 条词条）。
    - **E2E 实测（真实浏览器 + CDP 关缓存）**：搜索中不再禁用输入框 ✅；t=0 即显示「正在搜索… 0.0s」✅；旧仓库列表保留（opacity 0.45）✅；t=3.2s 出「取消」✅；取消后「已取消 · 用时 3.2s」+ 无错误弹窗 + 请求 `net::ERR_ABORTED` ✅；成功路径结果头「找到 35 条 · 用时 49.1s」✅ 分页正常 ✅
    - ⚠️ **遗留（属 P2）**：客户端 abort 后**服务端仍跑完**（日志实测并发导致 `合同` 逐仓从 2.7s→23s，端到端 14s→49s）⇒ 取消只解决"用户等待"，必须靠 P2-4 预算/超时 + P2-2 降摘要开销
14. ✅ **P1 已提交**：`d8a0513bb`（前端 4 文件）+ `6dca2091f`（方案/卡）。
15. ✅ **P2-2 已完成（2026-10-09）—— 但内容与预期相反：真正的主因是日志，不是内容抽取**。
    - **第一步（只改 ini、不改代码）做了干净 A/B**：`docSys.ini/debugLogLevel` 0(debug)→1(info)，重启后同关键词实测：
      - `test`（898 命中）：逐仓 **1536 ms**、排序 1 ms、**组装 13 ms**（debug 时 31 080~74 377 ms）、端到端 **1.8 s**（debug 时 35.3~39.0 s）
      - `合同`（35 命中）：**1.2 s**（debug 时 14.0 s），组装 **49 ms**（debug 时 17 250 ms）；`采购`（40 命中）**2.9 s**，组装 1567 ms
      - 推算 **≈19.4 ms/行**（898×2 = 1796 行，34 870 ms）⇒ **“组装 88~95%”是逐命中 debug 日志造成的假象，内容抽取只要 13~49 ms**
      - 日志落盘方式已核实：`println` → stdout 重定向到 `docsys_console.log`（40 MB）；`docsys.log` 26 MB、一次搜索 +4.3 MB；`Log.toFile()` 每行 `new RandomAccessFile`+`seek(EOF)`+`close()`（成因未进一步定位：文件写放大/杀软扫描/句柄开销 未区分）
    - **清理的日志（业务/WebSocket 仓库）**：
      - `BusinessBaseController.convertSearchResultToDocList`：删 2 行/命中 + 2 行/抽取文档的 debug（后者还会把文件内容写进日志）→ 改为末尾一行 `[searchDoc][组装] 命中总数=… 抽取摘要文档数=… 摘要抽取耗时=…ms`
      - `BusinessBaseController`：`getHitDocList`（入口 1 行 + 评分前后 2 行）、`hitDocSmartSearch`（入口 1 + 评分前后 4 + tempPath 1）、`buildDocPath`（每次调用 1 行）全删
      - `BusinessChannel`：`searchInReposAsync` 每仓 1 debug + 3 info（保留 `[searchDoc][逐仓完成]`）、`waitForEndOfAsyncSearch` 每次唤醒 1~2 行 info（改为 `[searchDoc][逐仓结束]` 一行）、`waitForFreeSearchThread` 线程池满时 3 行 info 全删
    - **实测（debug 级别、同机、curl、20 仓）**：`test` 35.3~39.0 s → **5.3~6.4 s**（组装 31~74 s → **1.07~1.12 s**，日志 4.3 MB → **43 KB / -99%**）；`合同` 14.0 s → **5.3~5.4 s**；`采购` → **5.9~6.3 s**
    - **编译**：`BusinessChannel.java` + `BusinessBaseController.java` javac exit=0（`-encoding UTF-8 -parameters -g`），已重启 dev Tomcat 实测；`debugLogLevel` 已恢复为 **0**
    - ⚠️ **有意未做**：单篇抽取预算/类型限制（实测只 13~1567 ms，属过度设计）；`maxNumOfContext/chunkSize/maxContentSize` 均未改
    - ⚠️ **仍未清理**（下一轮可选，需改 `LuceneUtil2`/文件工具，影响面大）：`luceneSearch` 每索引/每仓 debug（~80 行）、`readDocContentFromFile() encode:`（~38 行）、“不存在或不是文件”（20 行）≈ 3.5 s
16. ⚠️ **待提交（等用户确认）**：`src/com/DocSystem/websocket/BusinessChannel.java`、`src/com/DocSystem/websocket/BusinessBaseController.java`（**websocket 仓库** `master`，不是主仓库）+ 主仓库 `devDocs/仓库列表搜索优化方案.md`、`DevAgentControl/CURRENT_STATE_projects搜索优化.md`。

## 下一步

1. **P2-2 ✅ 已完成**（真实瓶颈是 dev 逐命中日志，已清理并实测：`test` 35.3~39.0 s → 5.3~6.4 s；详见「当前进展」15）。
2. **用户裁定（2026-10-09，本次会话）**：
   - **P2-3（两阶段/流式）→ ❌ 不做**（性能已达标；大改动容易引入未知风险）
   - **P2-1（服务端分页 + 上限）→ ✅ 要做**
   - **P3（高亮，对应用户诉求③）→ 要做**；P2-4（预算/超时）优先级下调（逐仓实测仅 1.5 s，“睡 3 分钟再醒”仍值得复核但已非体验瓶颈）
3. **我推荐顺序：先 P3（高亮）→ 再 P2-1（分页/分批）**（待用户确认）。理由：① P3 是**未交付的用户诉求**，P2-1 优化的是已经够用的东西；② 风险不对称——P3 集中在 `projects.js`+模板（不动接口契约），P2-1 必须改 `searchDoc.do` 契约而它被**两个入口共用**（`projects.js` 跳仓 + `project.js` 仓内）；③ P3 顺手能修 `{{# }}` 不转义的 **XSS 隐患**；④ 两者**无强依赖**
   - ⚠️ **P2-1 动手前必须先定口径**（否则会体验倒退）：现状是“一次返回全部 898 条 + 前端本地分页” ⇒ **翻页瞬开**；若改“真分页”（每次只回一页）⇒ **每次翻页都要重跑整次搜索**（1.2~6.4 s），898 条/20 每页 = 45 页 ⇒ 翻页反而变慢
     - **A 真分页**：`pageIndex/pageSize` 生效、每次重搜（响应 ~20 KB，翻页慢）——风险中
     - **B 分批+本地分页（推荐）**：`pageSize` 取大（如 100、上限 100）一次取一批，跳批才再请求，批内本地翻页（497 KB → **~55 KB**，无服务端状态）——**风险最低**
     - C 服务端缓存结果集（`searchId` 切片，翻页快）——**风险高**（TTL/并发/内存 = P2-3 变体 2 那套复杂度），不推荐
     - 兼容要求：**不传分页参数时行为不变**（仓内 `project.js` 依赖现契约）
4. ❌ ~~按 P0 实测调整优先级：先做 P2-2（内容抽取/摘要，占 88~95%）~~ → **P2-2 已做完，且该 88~95% 判断已被推翻**（真因是日志）；P2-5（超大索引口径）按裁定不做。
4. P2 改动涉及**两个前端入口**（`projects.js` 跳仓 + `project.js` 仓内），改接口/字段必须同时兼容。
5. P3 高亮注意模板 `{{# }}` 不转义 → 高亮标记要在转义后插入（现已有 XSS 隐患，一并处理）。
6. 每阶段收尾按项目惯例：编译（`-encoding UTF-8 -parameters -g`）+ 重启 dev Tomcat + 真实浏览器 E2E（含分页/取消/超时文案）+ 更新本卡与方案文档。

## 生效约束

- **开工前是否需要先提交**：需要，且**已完成**（方案文档 + 本卡 + `CLAUDE.md` 指针，主仓库 `devInt` 同一次提交）。
- 已裁定的产品口径不得违背：不得引入"默认当前仓库"、不得跳过仓库、不得排除源码目录（见「当前进展」第 8 条）。
- 不得为"让搜索变快"而降低结果正确性（如静默跳过仓库）——跳过必须有**显式提示**（"部分仓库未参与"）。
- dev 环境 `debugLogLevel` 对性能影响很大：**性能数字必须标注日志级别**，不要把 dev 的日志开销当作生产收益。
