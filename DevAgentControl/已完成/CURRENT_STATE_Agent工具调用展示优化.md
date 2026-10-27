# CURRENT_STATE_Agent工具调用展示优化与持久化（工作卡）

建立于 2026-10-27。**状态：调研与 Bug 分析已完成，方案已获用户裁定（2026-10-27，见「用户裁定」节），未改任何代码，等新 session 开工。**
用户指示：**本卡由新 session 正式开工**（2026-10-27 原话："你先完成方案调研和Bug分析，然后创建任务卡，不要直接开工（我需要换个session来正式开工）"）。

> 本卡是**当前任务**的唯一口径处：必读上下文 / 当前进展 / 下一步 / 生效约束。

## 任务（用户原话，2026-10-27）

1. **展示优化**：目前工具调用详情卡片直接堆在思考过程后面，影响用户查看思考过程。参考业界 Agent 实现：把工具调用详情卡片放在
   "Agent 决定去调用工具的地方"（即按真实时序交错）；工具调用结束时卡片收起、只显示标题，用户点击才展开 → 上下文阅读连续。
2. **Bug**：工具调用详情在**重新打开 Agent 页面时消失**（用户怀疑没有做持久化处理——**已证实，怀疑正确**）。

## 现状实现（已测绘，勿重复找）

### 前端（`WebRoot/web/agent/index.html`，全部内联，无框架）

- **消息模型**（流式期间，index.html:4375-4386）：assistant 消息带
  `reasoning`（字符串，**所有轮次拼接成一整块**）/ `intermediate[]`（工具调用之间的正文文本，按序）/
  `toolCalls[]`（`{name,args,status,summary,error,approval}`）/ `liveText→content`（最终正文）。
- **流式事件**（index.html:4462-4537）：SSE `reasoning`→追加 reasoning 串；`text`→追加 liveText；
  `tool_call`→当前 liveText（剥 `<tool_call>` XML 后）push 进 intermediate、清空 liveText、push 新 toolCalls 卡（running）；
  `tool_result`→回填**同名最后一张 running 卡**；`retry`→清空全部过程字段；`done`→定稿 content。
  **SSE 事件流本身时序完整（reasoning/text/tool 交替到达），是前端累积进三个分离字段时把交错顺序丢了。**
- **渲染**：`renderMessages`（:3694）→ `buildProcessContainerHtml`（:4047）→ 结构为
  `<details class="process-container">`（生成中 open、完成后收起）内：**①整块 reasoning → ②intermediate 文本们 → ③全部工具卡片堆在最后**。
  工具卡片 `renderToolCard`（:3664）非折叠（args/summary 直接平铺）。
  增量更新 `updateStreamingMessage`（:4094）只替换当前消息的 process 容器节点 + body innerHTML（保留外层 open 状态）。
- **历史回放** `loadSessionMessages`（:4228）：调 `GET /agent/sessions/{id}/messages`；role='reasoning' 的行**拼接进其后
  assistant 消息的 reasoning**；**`toolCalls: []`、`intermediate: []` 恒为空**（:4241-4247）。

### 后端

- **持久化** `ConversationHistoryService.saveExchange`（ConversationHistoryService.java:42-75）：每轮只落
  `user` / `reasoning`（可选，单独行）/ `assistant`（**最终回答文本**）三种行到 `agent_session_messages`
  （表结构 `id, session_id, role, content, seq, created_at`，role 为自由字符串列，实体注释本就预留了 `tool`）。
  **工具调用/中间文本从不落库。**
- **接口** `AgentController.getSessionMessages`（:652-689）：只回传 `role/content/seq/createdAt`（+从注入块反解的 focus/operation），
  无工具信息。
- **SSE 工具事件源头** `runToolLoopStreamingWithSse`（AgentController.java:423-535）：`ToolUseLoop.StreamSink`
  （onReasoning/onText/onToolCall/onToolResult/onRetry，定义在 ToolUseLoop.java:173）→ 拼成 SSE 事件推前端。
  **所有工具事件都经过这里**——在此顺带累积记录即可持久化，ToolUseLoop 本体可不动。
  另 `ToolUseResult.transcript`（完整消息列表）也可作为数据源，但 StreamSink 累积更贴展示所需字段。
- **回灌安全**：`MainAgent.loadSessionHistory`（MainAgent.java:1114-1145）与 SSE 直连路径（AgentController.java:1745）
  都**只取 role=user/assistant** 续接上下文 → 新增 role='process'/'tool' 行**不会污染模型上下文**。

## ★ Bug 根因（已实证，2026-10-27）

**工具调用详情没有任何持久化**，三处缺口串成一链：

1. 后端 `saveExchange` 只写 user/reasoning/assistant 三种行（工具调用/中间文本丢弃）；
2. `getSessionMessages` 即使有也不回传（当前无需谈）；
3. 前端 `loadSessionMessages` 重建消息时 `toolCalls:[]` 恒空。

**实测证据**（2026-10-27，dev 8100）：
- 会话 `ef538696-...`（当天真实多轮工具会话，reasoning 行 12961/35209 字符，明显几十次工具调用）：
  `GET /agent/sessions/{id}/messages` 返回 **user:5 / reasoning:5 / assistant:5，无任何工具行**；
- 打开 Agent 页面 `loadSessionMessages` 加载该会话：**5 个处理过程容器、5 块 reasoning、`toolCards: 0`**——
  流式期间的卡片全部消失，处理过程摘要也没有"N 步工具调用"。与用户报告完全一致。

（reasoning 能回来是因为它单独落库；assistant 回来的是最终回答。）

## ★ 用户裁定（2026-10-27，本 session 记录，开工依据）

1. **展示形态**：工具卡片**交错在"处理过程"容器内**（方案 A 推荐形态；"主流程混排"备选不做）。
2. **持久化粒度**：**完整时间线**（B 与 A 合流：持久化 processSteps，回放与新展示同构，避免返工）。
3. **旧 role='reasoning' 行**：**过渡期继续写**（兼容旧版页面），新前端两边都认。
4. **Agent 页 js 缓存**：同意处理——开工时查 `agent/index.html` 的 `<script src>` 引用，改动涉及的 js/html
   参照 project.js 先例（`c778552c5`，`?v=YYYYMMDD`）加版本参数。

## 方案评估（已按上述裁定定稿，未实施）

### A. 展示优化（前端，index.html 单文件）【已裁定采用：容器内交错】

**推荐：消息模型改"过程时间线" + 工具卡片自折叠**，能完整实现目标 UX：

1. **数据模型**：`msg.processSteps = [{kind:'reasoning',text}, {kind:'text',text}, {kind:'tool',tc}]`，
   流式事件按到达顺序 append（reasoning/text 事件→若与最后一步同 kind 则追加文本否则新步；tool_call→push tool 步；
   tool_result→回填最后匹配 running 步；retry→清空 steps）。SSE 协议**无需改动**。
2. **渲染**：`buildProcessContainerHtml` 遍历 processSteps 按序输出 → 工具卡片自然出现在"决定调用工具"的位置；
   `renderToolCard` 改为 `<details class="tool-card">`（summary=图标+工具名+状态，body=args+result），
   **running 时展开、结束后收起**（与用户描述一致）；外层"处理过程"容器保留（完成后整体收起，嵌套两层 details）。
3. **状态保留**：`updateStreamingMessage` 增量替换 process 容器时，除现有外层 open 保留外，需保留每张内层卡片的展开态
   （现状只处理了外层，:4110-4114）。
4. **兼容**：旧消息无 processSteps → 降级为现状渲染（reasoning 整块+无卡片）；若 B 方案同期实施则历史回放也走 steps。

工作量：前端 3 个函数改造 + 流式分支 + 回放重建，中低复杂度；无后端依赖（可独立于 B 先上）。

~~备选形态：工具卡片移出"处理过程"容器、与思考/正文在消息主流程混排~~（**用户裁定不做**，2026-10-27；将来若要可作二期另立卡）。

### B. 持久化修复（后端 + 前端，零表结构变更）【已裁定：与 A 合流，持久化完整时间线】

1. 后端：`runToolLoopStreamingWithSse` 的 StreamSink 里顺带累积时间线步（reasoning 分段轮廊、中间文本、
   tool 调用记录含 name/args/status/summary/error/approval，args/summary 沿用 truncateForCard 截断）；
   `saveExchange` 增参：追加一行 `role='process'`，content=processSteps JSON。
   （旧 role='reasoning' 行：**用户裁定过渡期继续写**——旧版前端页面兼容；新前端两邊都认：优先用 process 行重建，
   无 process 行时降级用 reasoning 行拼整块。）
2. `getSessionMessages`：role='process' 行原样透传（前端识别；其他消费方已核实只取 user/assistant）。
3. 前端 `loadSessionMessages`：识别 process 行 → 重建 processSteps（B 与 A 合流后回放即得新展示；
   仅做 B 不做 A 时，降级塞回 toolCalls 数组 → 卡片回到现状位置，也修复 Bug）。
4. 兼容旧数据：老会话无 process 行 → 现状降级（有 reasoning 无卡片），不迁移。

**最小修复（仅持久化 toolCalls 数组 JSON，不做时间线）**：**未被采用**（用户裁定 B 直接按完整时间线做，2026-10-27，
避免 A 上线后回放拿不到交错顺序、二次返工）。

### 风险与注意

- reasoning/process 行较大（实测单 reasoning 行 35K 字符），SQLite TEXT 无碍；args/summary 落库前截断。
- `tool_result` 的 approval 取自 `PermissionTrace.last()`（当次判定痕迹），落库即固化，回放不重算——正确。
- 直连聊天路径（isAiChat，AgentController:1740-1790）无工具调用，不受影响；确认弹窗/重试/续接路径已核对无冲突。
- E2E 必测：流式期间卡片时序与收起行为、`updateStreamingMessage` 增量替换不丢展开态、重开页面回放、
  续接会话（模型上下文不污染）、旧会话降级、retry 清空、确认弹窗路径。

## 必读上下文（续接锚点）

- 前端：`agent/index.html:3664-3692`（renderToolCard/stripToolCallXml）、`:4046-4071`（buildProcessContainerHtml）、
  `:4094-4148`（updateStreamingMessage）、`:4227-4260`（loadSessionMessages）、`:4374-4545`（sendMessage 流式事件分支）、
  CSS `:617-760`（process-container/tool-card）
- 后端：`agent/controller/AgentController.java:391-535`（StreamingLoopOutcome + runToolLoopStreamingWithSse 的 StreamSink）、
  `:652-689`（getSessionMessages）、`:1792-1816`（SSE ToolLoop 路径的 saveExchange 调用点）；
  `agent/session/ConversationHistoryService.java`（saveExchange/appendMessage/getHistory）；
  `agent/orchestrator/ToolUseLoop.java:165-177`（StreamSink 定义）；
  `agent/orchestrator/MainAgent.java:1112-1145`（loadSessionHistory 只取 user/assistant）
- 表结构：`agent/config/DatabaseInitializer.java:70-`（agent_session_messages 建表）
- 复现证据会话：`ef538696-455c-4bf3-93f1-01a6a8e8d821`（dev 库，多轮工具调用，roles 仅 user/reasoning/assistant）

## 当前进展（如实）

- ✅ 2026-10-27：前端渲染链路、SSE 事件链、持久化链路、回放链路全部测绘（见上，含行号）。
- ✅ 2026-10-27：**Bug 根因实证**（库中无工具行 + 页面加载 toolCards=0，证据见上）。
- ✅ 2026-10-27：方案 A（时间线+自折叠卡片）/ B（零表结构变更持久化，建议与 A 合流）评估完成。
- ✅ 2026-10-27：**用户四项裁定已记录**（容器内交错 / 完整时间线合流 / reasoning 行过渡保留 / agent 页 js 加版本参数），见「用户裁定」节。
- ✅ 2026-10-27（新 session）：**S1 前端实施完成并实测通过**（详见下），**等用户实测验收后进 S2**。
- ⚠️ 2026-10-27：误启正式实例事故（已恢复，见「环境事实」节）。

### S1 实施内容（`WebRoot/web/agent/index.html`，未提交）

CSS（:686-752 区）：`.tool-card` 由 div 改 `<details>`（summary=图标+工具名+状态+▸箭头旋转，
body=args+result，`tool-card-header` 点击样式）；`renderToolCard(tc, stepIndex)`（:3680，running 展开/
结束收起/`data-step-index`）；新增 `appendProcessStep`（:3708，同 kind 合并）；新增
`preserveToolCardOpenState`（:3722，只保留「已结束且展开」卡的展开态——running 的展开是默认行为，
running→finished 过渡按裁定收起）；`buildProcessContainerHtml`（:4098）优先 processSteps 交错输出、
无 steps 走旧降级分支；`updateStreamingMessage` 替换前调 preserve；流式分支（:4560-4610）只维护
processSteps+liveText（intermediate/toolCalls 不再维护，仅旧数据降级渲染用）；retry 分支清 processSteps；
`loadSessionMessages` 防御性跳过 role='process' 行（为 S2 铺路）。

### S1 实测证据（2026-10-27，dev=TomcatForDocSysDev 8100，前台标签页）

1. **交错渲染**：多轮真实会话，容器内顺序 = reasoning→text→list_repos→search_files→reasoning→text→
   list_docs×3→get_doc_history×9→…（26 步/16 卡那次），视觉模型核验截图确认「思考→工具→思考」交错、
   卡片折叠样式标准、无原生三角残留、无错位。
2. **结束后收起**：全部 success/failed 卡 collapsed、外层容器 collapsed、摘要行「N 步工具调用·已完成」。
3. **点击展开/收起**：实测 idx=3 卡点击展开（args + 结果可见）、再点收起。
4. **真实 running 展开**：写操作确认弹窗挂起期间实拍 `write_file:open=true`（running 卡强制展开）；
   另 DOM 级同路径验证（running 卡 open + tool-spin 动画 + 清理干净）。
5. **增量更新保留展开态**：真实流中（steps 9→16→26 持续增长期间）展开 idx=25 已完成卡，后续 4 次检查
   全部 open:true。
6. **增量渲染本身正常**：前台标签页 steps/liveText 逐帧增长；⚠️ 后台标签页 rAF 被节流 → 过程容器到
   done 才一次性出现——环境特性非代码问题（已记入「环境事实」）。
7. **确认弹窗路径**：write 确认弹出正常；点「拒绝」→ 卡片 running→failed、无文件写入、流正常收尾。
8. **旧数据降级**：回放旧会话（无 process 行）→ reasoning-only 容器，无卡片无报错（即 Bug 现状保持，S3 修）。
9. **多轮续接**：同一会话连续 5+ 轮正常。
10. **未测项**：retry 清空（无法自然触发；代码已含 `processSteps=[]`，与旧字段同步清）。
11. **发布链路**：`PublishDev.bat` 增量发布 → dev 拷贝与工作区一致；dev 实例 8100 当前**运行中**。

### ⚠️ 自动化踩坑备忘（复测时注意）

- 「＋新会话」与「立即发消息」在同一瞬间会触发页面既有异步竞态（messages 被清空、流写入孤儿索引）——
  人工操作不会踩到；自动化要先点＋等 1s 再发。
- IAB 后台标签页 rAF 节流：测流式中间态必须前台可见。
- **dev Tomcat 重启会丢 JSESSIONID**：agent 页会弹本地登录框（Admin/Admin），重新登录即可；
  症状是 /agent/* 全部 302→tologin.do→404，**别误判成模块挂了**（catalina 里 libfreenect2 多版本 jar 的
  `Invalid byte tag 19` 告警是历史噪声，与本任务无关）。

### S2 实施内容（2026-10-27，后端两文件，未提交）

- `agent/controller/AgentController.java`：
  - `StreamingLoopOutcome` 增 `processStepsJson` 字段（三参构造）；
  - 新增 `private static final class ProcessTimeline`（与前端 processSteps 同构的累积器）：
    onReasoning/onText 入 buffer（onText 先 flushReasoning）；onToolCall 双 flush 后 push 工具步
    （args 截 4000）；onToolResult 回填最后同名 running 步（summary 300/error 200/approval）；
    onRetry 全清；`finish()` 只收尾 reasoning、**丢弃尾随正文**（= 最终回答，assistant 行已有），
    序列化 `{"v":1,"steps":[...]}`；
  - StreamSink 五个回调接线（与 SSE 同值）；`truncateForCard` 改 static；
  - SSE ToolLoop 落库点传 `outcome.processStepsJson`。
- `agent/session/ConversationHistoryService.java`：新增 5 参 `saveExchange`（user→reasoning[→process]→assistant，
  process 行 = 前端回放专用，loadSessionHistory/isAiChat 只取 user/assistant 不回灌）；旧 4 参重载委托（传 null）。
- 编译（WDK JDK8 `-g -encoding UTF-8`，classpath 需带 `WebRoot/WEB-INF/classes`）→ `PublishDev.bat` → dev 重启，全链路通。

### S2 实测证据（2026-10-27，dev=TomcatForDocSysDev，重启后需重新登录）

1. **落库行序**：新会话一轮工具对话后 `GET /agent/sessions/{id}/messages` 回
   `user(1)→reasoning(2,1190字)→process(3,10035字)→assistant(4,911字)`；reasoning 行过渡期照写 ✓。
2. **process JSON 结构**：`v:1`、27 步、kinds=`reasoning,text,list_repos:success,reasoning,text,list_docs×22,reasoning`；
   tool tc 六字段齐（args/summary/approval/name/error/status）；args/summary 截断生效；
   **尾步=reasoning 无尾随 text**（最终回答只在 assistant 行，无重复）；tool 后接 reasoning（交错保真）✓。
3. **续接不污染**：同会话第二轮追问"仓库总数多少"，回答正确引用第一轮统计（"21 个，vid 1~22 无 15"）
   ——模型上下文只含 user/assistant，process/reasoning 行未回灌 ✓；两轮行序均正常。
4. **旧会话降级**：pre-S2 会话（e6f97500）行结构 user,reasoning,assistant 无 process 行；
   切换到它页面 14 条消息全部正常角色、4 个 reasoning-only 容器、0 卡片、无怪气泡无报错 ✓
   （S1 版 loadSessionMessages 的 process 行跳过防御同时得到验证）。
5. **isAiChat 直连路径**：代码未动（4 参重载传 null），无回归风险（未单独行为测试）。

### S3 实施内容（2026-10-27，前端 1 文件，未提交）

- `WebRoot/web/agent/index.html` 新增 `parseProcessSteps(content)`：解析 `{"v":1,"steps":[...]}` →
  前端 processSteps，**防御性归一化**（未知 kind/缺 tc/空 text 丢弃该步；残留 running 按 failed 展示）；
  解析失败返回 null → 走降级。
- `loadSessionMessages` 改造：`pendingSteps` 与 `pendingReasoning` 并行累积；assistant 消息**优先用
  pendingSteps 建 processSteps**，无 steps 才用 pendingReasoning 填 reasoning（降级，避免同一段思考显示两遍）；
  两者用完即清。
- 发布：PublishDev.bat（静态文件，无需重启）。

### S3 实测证据（2026-10-27，dev，浏览器）

1. **Bug 端到端修复（用户原始诉求）**：新会话跑一轮（list_repos+list_docs 2 卡）→ **刷新页面** →
   容器摘要"⚙️ 处理过程 · 2 步工具调用已完成"、卡片 2 张（名称一致）、reasoning 在、卡片收起、
   点击展开有 args+结果。**刷新前 2 卡 = 刷新后 2 卡** ✓
2. **回放交错保真**：22 步工具会话回放 → 27 步容器，顺序 =
   think→text→list_repos→think→text→list_docs×22→think，与 S1 流式期间完全同构 ✓
3. **纯思考轮次**：无工具调用的轮次 → 1 步（think）容器、0 卡、无怪摘要 ✓
4. **pre-S2 旧会话降级**：e6f97500（仅 user/reasoning/assistant 行）→ 14 条消息正常角色、
   4 个 reasoning-only 容器、0 卡片、无怪气泡 ✓
5. **卡片交互（回放态）**：点击展开/再次收起正常，args/result 均在 ✓

### S4 收尾回归（2026-10-27，dev，浏览器；全部通过）

1. **确认弹窗·批准路径**：write_file 批准 → 文件真实创建于 `C:\DocSysReposes\1\data\rdata\`（含版本库历史）、
   卡片 `success + approval="手动确认"`、**落库 process 行同值**、刷新回放同值（两卡 success+approval）✓
2. **删除路径**：delete_doc 批准 → 文件真实删除（磁盘已无）、卡片 success ✓（测试文件已清理干净）
3. **中断（stop）**：前端停止正常、无残留 running 卡、DOM 健康、正文追加"(生成已中断)"；
   ⚠️ **发现既有行为**：SSE 中断只是前端停止接收，**服务端 ToolLoop 继续跑完并完整落库**——刷新后该轮
   28 步/23 工具全 success 完整回放（12 行 3 轮齐全）。非本次引入，对历史完整性反而有利，记录备查。
4. **多轮**：3 轮（建文件/删文件/中断轮）刷新后全部完整回放，角色无异常、无 undefined/NaN ✓
5. **回放后再测**：27 卡（含 22×search_files）全部 success、无 running 残留 ✓
6. **预算到顶**：未自然触发（需 26 轮打满，成本高）；代码路径未改（footer 由 done.meta 驱动）——
   判定无回归风险，未测。
7. **retry**：未自然触发（需 LLM 请求失败）；retry 分支已同步清 processSteps（S1 实施），
   判定无回归风险，未测。

### 结论

- 三阶段全部完成并逐段验收：S1 `f59e2e4af` → S2+S3 合并 `47bd45327`（用户 --amend）。
- 两处既有行为已记录：①中断=前端停止接收、服务端继续（落库完整）；②后台标签页 rAF 节流。
- 测试会话已清理（dev 仅保留用户自己的 `e6a6246f`）；测试文件 s4-批准回归.txt 已删除；无残留写入。

## 阶段计划（S2~S4 细节）

- **S2 后端持久化**：StreamSink 累积时间线步（reasoning 分段/中间文本（onToolCall 时 flush 并剥
  `<tool_call>` XML）/tool 步含 name/args（截断 4000）/status/summary（300）/error（200）/approval；
  **循环结束时尾随 text buffer 丢弃**——那是最终回答，已由 assistant 行落库，避免回放重复**；
  onRetry 清空）→ `saveExchange` 新增重载落 `role='process'` 行（content=`{"v":1,"steps":[...]}`，
  行序 user→reasoning→process→assistant，steps 结构与前端完全同构）；reasoning 行照写（过渡期）；
  `getSessionMessages` 本就逐行透传 role/content，无需改。javac 编译到 WebRoot/WEB-INF/classes →
  PublishDev.bat → 重启 dev → API 实测（落库/透传/续接不污染模型上下文）。
- **S3 前端回放**：`loadSessionMessages` 识别 process 行（pendingProcess 挂到其后 assistant 消息，
  **优先于 reasoning 行**；解析失败/无 process 行降级现状）。实测：重开页面卡片交错恢复 + 旧会话降级。
- **S4 收尾**：全量 E2E 回归（确认弹窗批准路径/中断/多轮/预算到顶/retry 若可触发）+ 版本参数结论落实 +
  工作卡收尾 + 汇报。

**版本参数结论（S1 时已查明）**：agent/index.html 的外链只有 `styles.css`/`marked.min.js`/
`mermaid.min.js`/`base64.js`，本次改动全部在内联 `<style>`/`<script>` 里，**外链一个都不动 ⇒ 无需加 ?v=**
（project.js 先例针对的是被页面引用的外链 js）。index.html 本体按历史惯例（历次改动均未加）不加。

## 下一步

**任务已完成，等用户确认后归档（移入 `已完成/`）。** 归档动作：本卡移入 `DevAgentControl/已完成/` +
更新 `CLAUDE.md`「当前任务」节（本任务转为「上一任务」条目，清空当前任务等待用户指定新任务）。
不自动 commit（惯例）。

**版本参数结论（S1 时已查明）**：agent/index.html 的外链只有 `styles.css`/`marked.min.js`/
`mermaid.min.js`/`base64.js`，本次改动全部在内联 `<style>`/`<script>` 里，**外链一个都不动 ⇒ 无需加 ?v=**
（project.js 先例针对的是被页面引用的外链 js）。index.html 本体按历史惯例（历次改动均未加）不加。

**E2E 必测清单**：流式时序/收起行为/展开态保留/重开回放/续接不污染模型上下文/旧会话降级/retry 清空/确认弹窗路径。
验证通过 → 汇报 → 用户确认后提交（不自动 commit）。

## 环境事实（2026-10-27；⚠️ 第一版结论写反过，已按用户更正）

- ⚠️ **`C:\MxsDoc` 是正式实例，开发绝不使用**（用户 2026-10-27 明确更正："本地跑的 MxsDoc 是正式的实例，注意开发只能用 TomcatForDocSysDev"）。
  本 session 曾误判 MxsDoc 为 dev 实例并**重启过它**做了 S1 浏览器实测（事故经过：15:51 用户停机 → 15:57 我误重启 →
  完成大部分 S1 验证 → 16:2x 用户更正）。**已恢复**：①被覆盖的 `web/agent/index.html` 已用 `git show HEAD:` 还原
  （297712 字节，与原 ETag 尺寸一致）；②挂起的 write_file 确认已在页面上点「拒绝」（工具卡转 failed，**未写任何文件**）；
  ③已用 `docsys_stop.bat /q` 停机（无 java 进程、8100 无 LISTEN）。遗留：MxsDoc 库里多了本 session 的测试会话
  （约 6 轮对话，含"S1 验收测试"字样），未清理，待用户裁定。**教训：实测前先确认目标实例归属，不要拿"正在 8100 监听"当 dev 依据。**
- **dev = `C:\TomcatForDocSysDev\docsys\tomcat`**（部署指南主角）：发布用 `Docs/scripts/PublishDev.bat`
  （无参 = robocopy /MIR /XO 增量，运行期产物受保护）；重启 `cmd /c "C:\TomcatForDocSysDev\docsys\docsys_restart.bat"`
  （隐藏窗口，控制台日志 `tomcat\logs\docsys_console.log`）。判活 = catalina `Server startup in` + 8100 LISTEN + 探 `.do`。
- 编译输出仍先落 `D:/Dev/DocSys/WebRoot/WEB-INF/classes`（canonical），再由 PublishDev 同步到 dev webapp。
- **IAB 后台标签页会节流 requestAnimationFrame** ⇒ `scheduleStreamingUpdate` 的增量渲染在后台页看似"卡住"、
  到 done 才一次性出现——**不是前端 bug**；测"流式中间态/running 卡/增量保留展开态"必须前台可见标签页。

## 生效约束

- **所有改动必须实测**：改 Java 必须重启 dev Tomcat（启动 2~10 分钟，判据 = catalina `Server startup in` + 8100 Listen +
  探一个 `.do`）；改前端 publish + 浏览器实测（**用户已裁定（2026-10-27）：改动涉及的 agent 页 js/html 引用要加
  `?v=YYYYMMDD` 版本参数，参照 project.js 先例 `c778552c5`；注意 agent/index.html 是 6800 行单文件、js 多为内联，
  外链 js 才需要加**）。
- 编译：canonical JDK `C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac`，`-g -encoding UTF-8`，
  输出只到 `WebRoot/WEB-INF/classes`；源码树不得出现 `.class`。
- **不要自动 commit**：改完 + 验证 → 汇报 → 等用户确认。
- E2E 登录口径：`POST /DocSystem/User/login.do`（Admin / pwd base64）。
- dev Tomcat 8100 当前运行中。
