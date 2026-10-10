# CURRENT_STATE — Agent 确认弹窗阻断与模式切换（工作卡）

建立于 2026-10-10。**状态：已按用户裁定实施完成 + 验收 V1~V10 全部通过（46 套护栏 / 2005 项 / 0 失败），待用户确认提交。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 参考计划 / 当前进展 / 下一步 / 生效约束。

## 任务

**标准模式**下每个写操作都弹**模态**确认框；写操作特别频繁时（典型：整理目录 = 连续几十次移动/改名），用户**没有机会去点权限模式 chip** 切档。

用户原话：「目前，在 标准模式 下 写操作使用的是弹窗，如果写操作特别频繁（比如整理目录时的大量文件移动操作），会导致没有机会去进行 模式切换，你帮我调研一下其他Agent时怎么处理的，然后帮我设计一个方案，我确认后再开工」

→ 交付：① 其他 Agent 的做法调研；② 结合本项目的方案（含待裁定项）；**用户确认后才动代码**。

## 必读上下文（续接锚点）

- 前序设计（**已实施**，四档模式/会话规则/判定优先级的口径来源）：`devDocs/Agent权限模式改造计划.md`；工作卡（已归档）`DevAgentControl/已完成/CURRENT_STATE_agent权限模式.md`
- 本任务方案（成文后为准）：`devDocs/Agent确认疲劳与模式切换方案.md`
- 代码锚点（2026-10-10 逐条核对过，不是推测）：
  - **判定策略**：`src/com/DocSystem/agent/permission/PermissionPolicy.java` —— 纯函数，顺序 ①ABSOLUTE→ASK ②PLAN→DENY ③**仅 AUTO**+会话规则→ALLOW ④硬清单→ASK ⑤MANUAL→ASK / AUTO·ALLOW_ALL→ALLOW
  - **★ 快照冻结（本轮最重要的发现）**：`agent/orchestrator/MainAgent.java:884/893/894` **每次请求**读一次模式与规则 → `new PermissionContext(mode, rules, resolver)` → `registry.setPermissionContext(...)`（`agent/tool/ToolRegistry.java:149`）。`PermissionContext` 字段是 `final`，`ToolRegistry.permissionContext` 全仓只被 MainAgent 与测试赋值 ⇒ **同一次请求内（一个用户回合含几十轮工具调用）改档/改规则都不生效，只对下一次请求生效**
  - **规则只在自动档生效/产生**：`PermissionPolicy:54`（`m == AUTO && rules != null`）+ 前端 `showConfirmModal` 只在 `currentPermMode()==='auto'` 时渲染作用域下拉（`WebRoot/web/agent/index.html:2991` 起）
  - **阻断机制**：`agent/tool/AuditWriteConfirmGate.java` —— 阻塞工具线程轮询等待 `POST /agent/confirm`（500ms/次，默认 **120s** 超时 → 判**失败**）；超时配置 `agent.tool-loop.confirm-timeout:120`（`MainAgent:183`）
  - **前端阻断源**：`#confirmModal` 是**全屏模态**（`.confirm-overlay{position:fixed;inset:0;z-index:11000}`，`index.html:755`）⇒ 弹窗在时整个工具条被盖住，chip **物理点不到**；`#permMenu` 的 z-index 只有 60（`index.html:1868`）
  - **前端相关函数**：chip `#permChipBtn`(2073) / `#permMenu`·`renderPermChip`·`renderPermMenu`(3496/3504) / `setPermissionMode`(3618) / `clearPermissionRules`(3652) / `showConfirmModal`(2991) / `resolveConfirm`(3024) / SSE `confirm` 分发(4244) / `buildConfirmScopes`(2975)
  - **串行执行**：`ToolUseLoop` 逐个执行同一轮的工具调用（`for (ToolCall call : parsed)`，`ToolUseLoop.java:556`）⇒ 同一请求内最多 1 个待确认（但多标签页/多会话并发时会撞车，见方案）
- 护栏（改动会碰到）：`agent/tool/TestWriteConfirmGateCoverage.java`、`agent/permission/TestPermissionPolicy.java`、`agent/permission/TestPermissionRules.java`
- 编译/环境：命令行 `javac` **必须带 `-g -encoding UTF-8`**（否则 Spring 参数名丢失 → 500，见 `CLAUDE.md`）；Java 改动需重编译 + 重启 dev Tomcat（8100，junction 挂载静态文件）；前端改完硬刷新

## 当前进展（如实）

10. ✅ **二轮加固（2026-10-10，用户裁定"①+②"）**：用户追问"挂起项危害"时我**实测复现了一个授权缺口**，据此落地：
    - ① **确认接口授权（4 处）**：`POST /agent/confirm` 补**登录校验** + **归属校验**（`ownedByCaller`：自己的 jsessionid / 自己的用户名 / 自己名下的对话会话，任一成立；否则 `FORBIDDEN`）；`GET /agent/confirm/pending` 对**调用方传入的 sessionId 也校验归属**（不归属 → 忽略）；日志里 `confirmToken`/`jsessionid` **一律打码**（只留前 8 位）；审计**记录批准者**（`Approved by user: <用户名>`）。
      - 实测（改前/改后对照）：未登录 + ajax 头 → 改前**进入控制器**（`Invalid or expired confirmToken`）、改后 `NOT_LOGGED_IN`；Admin 批准**别人的** → `FORBIDDEN` 且该行仍 PENDING；批准**自己的** → OK + 审计含批准者；pending 传别人 sessionId → 被忽略（`count=0`）。
      - 缺口成因（既有）：全站 `MyInterceptor` 对任何带 `X-Requested-With: XMLHttpRequest` 的请求**直接放行**，而 `confirmToken` 明文进日志 ⇒ 拿到 token 即可**免登录**批准（含 `delete_repos` 这类绝对保护）且**不可追责**。
    - ② **两条缓解**：(a) 挂起上限**按会话分名额**（新参数 `agent.tool-loop.max-pending-confirms-per-session`，默认 2）——原来全局 8 的名额可被一个会话占满、把**所有人**的写操作全拒掉，现在 A 会话占满后 B 照常可用，且提示语讲明"可能来自其他会话/用户"；(b) **重启后遗留 PENDING 失效化**（新参数 `agent.tool-loop.sweep-stale-confirms-on-start`，默认 true）：启动（根上下文 refresh 后）把早于「启动时间 − 60s」的 `PENDING` 置为新状态 `ABANDONED`，消除"恢复弹窗里点了批准却没反应"的静默失败（库里原有 3 条历史孤儿）。
    - 顺带修掉既有缺陷：**操作级（legacy）确认路径拿错 token**（先自己 UUID 再建审计、丢掉返回值 ⇒ 该路径确认从未生效），改为用落库返回的 token、拿不到则 fail-closed；`createPendingEntry` 的日志同样脱敏。
    - 验证：全量护栏 **46 套 / 2021 项 / 0 失败**（LiveContext 15→24、GateCoverage 56→63）；SQL 侧实测启动作废与宽限期（重启够快时新行保持 PENDING 未被误伤）；真实回合回归（标准档触发 `move_doc` → 6 个作用域选项照常 → 拒绝 → 如实汇报未执行）。
    - 文档：方案 **§11**（含实测证据表与集群注意）；`devDocs/参数存储策略与参数清单.md` §2.1-E 再登记两个新参数（第三次更新）。
    - ⚠️ 仍未做：**D10 选项 B（不占线程的挂起）**（完整解需工具执行链支持挂起/恢复，留后续专项）；**D6 计划先行**（P2）；启动清理日志在本机 dev 环境未落到 `docsys*.log`（原因未确认，故以数据库状态为验收依据）。

9. ✅ **一轮实施（2026-10-10，方案 §9.2 A→B→C）**：
   - ✅ **A 组（服务端 10 项）**：A1 `ToolRiskCatalog`（move/rename → NORMAL）｜A2 `PermissionPolicy`（规则门放开到 AUTO+MANUAL）｜A3 `PermissionRule`（DIR/REPO 校验工具名 + 新增 `DIR_ALL` + **目录来源扩到 path/srcPath/dstPath**）｜A4 `ToolRegistry`（`permissionContextSupplier` + 保守回落）｜A5 `MainAgent`（实时供应器 + `live=1` 日志 + `max-pending-confirms`）｜A6 等待语义重写（两处：工具门 + 操作级；**到点不做决定**）+ 全局挂起上限（`ConfirmGateBusyException`）｜A7 `findPendingBySessionId`（含 mapper XML 同步到 classes）｜A8 `GET /agent/confirm/pending`（**同时按对话会话 id 与 jsessionid 查**，返回 `risk`；**未加** `timeoutSeconds`）｜A10 `/stream` 的 `done` 先落库再推送 + `sendSse` 吞异常。
     - 顺带修掉一处**旧缺陷**：`AgentController.waitForConfirmation` 原先把"已批准"也当拒绝 → 改为按 `getStatusByConfirmToken` 真实终态判定。
   - ✅ **B 组（前端 7 项）**：等待提示 + 「切到自动模式并继续」；`pendingConfirm` 队列化；作用域选项按 D9（标准档也显示，源/目标目录分开）；恢复（`loadPendingConfirms` + JSON 解析 params）；chip 文案按 D8 修正；token 失效提示；**先落规则再批准**。
   - ✅ **C 组（护栏与文档）**：`TestPermissionPolicy` 92｜`TestPermissionRules` 25｜`TestWriteConfirmGateCoverage` 56（含 V8 实测 + D9 链路 lint）｜`TestPermissionLiveContext` 15｜`Agent权限模式改造计划.md` §3.2/§4 修正｜`参数存储策略与参数清单.md` 登记两个新参数。
   - ✅ **全量护栏：46 套 / 2005 项 / 0 失败**（逐套 exit=0）。
   - ✅ **页面 E2E（V1~V10 全部通过）**：真实 LLM 回合实测"同一轮第 2 次 `move_doc` 不再弹"（`21:15:04 ASK` → `21:15:05 ALLOW reason=rule(dir)`，页面计数 confirmCount=1）、刷新后待确认自动恢复、`delete_repos` 无任何放宽入口、拒绝即不执行、`GET /agent/confirm/pending` 命中、chip 档位切换与"新会话回标准档"。
   - ⚠️ **验证期额外修掉 8 个"不做就达不到验收"的问题**（详见方案 §10.2）：目录授权对 `move_doc` 完全无效、实况 SSE 丢 `dirs`、pending 接口查错会话 id、恢复缺 `risk`、恢复解析格式错、**"记住授权"与"批准"并行导致同轮第 2 个仍弹窗（竞态）**、`enterApp` 早于 `state.sessionId` 就绪、新会话沿用旧档位显示。
   - 🧹 **测试数据已清理**：E2E 伪造审计行已删、测试新建的 6 个会话已删、写入用户会话的一条测试规则已还原；**测试期间零文件改动**（写操作要么被拒、要么因源文件不存在失败）。
   - 📄 实施记录：方案 **§10**（改动清单 / 新增发现 / V1~V10 证据 / 与 §9.2 的差异）。


0. ✅ **2026-10-10 20:00 追加核实（用户追问 D2 与 Claude Code 的关系时发现）**：
   - **D2 ≠ D4**，Claude Code **两者都有**：① 弹窗里切档 = `"Yes, and switch to auto mode"`（**限 Bash 提示、限 Manual/acceptEdits 档、auto 可用时、v2.1.247+**；PowerShell 提示 / ask 规则 / hook 触发的提示**都不给**）→ 对应我们的 **D4**；② 弹窗里"不再询问" = `"Yes, and don't ask again"`（调研 §D 未标注档位限制）→ 对应我们的 **D2**。我们**当前只在自动档**提供 ②，**比 Claude Code 更严**。
   - ★ **新发现（改变 D2/D4 取舍）**：`ToolRiskCatalog` 把 **`move_doc` / `rename_doc` / `delete_doc` / `update_repos` 登记为 DESTRUCTIVE（硬清单）**，而 `PermissionPolicy` 对硬清单**在自动档仍 ASK** ⇒ **"整理目录"（大量移动/改名）切到自动模式照样弹**。"脱身"只能靠 ①规则命中 ②全部允许 ③逐个点 ⇒ **D4 单独无效，必须配 D2（或 D8 调整分级）**。对照：**Claude Code `acceptEdits` 连 `mv`/`cp` 都自动通过**，我们的自动档更严。
   - 另两处如实修正（详见方案 §1.3-5/6、§1.4、§5 D2/D4/D8/D9）：① chip 里"自动模式"的说明漏了"移动/改名"；② `DIR`/`REPO` 规则匹配**不校验工具名** ⇒ "本目录内不再询问"实际连带放行该目录内的删除，与弹窗文案"以后这类操作"不符。
   - 方案已按上述修正更新（新增 **§1.4 关键前提**、**待裁定 D8/D9**）。

1. ✅ **现状与根因已用代码核对完毕**（不是推测），检出 **3 条根因 + 1 条更深的结构性限制**：
   - 根因①**全屏模态盖住 chip**：弹窗期间工具条不可点（z-index 11000 / inset 0）。
   - 根因②**弹窗内没有脱身入口**：标准模式**故意不提供**「记住授权」（2026-09-23 用户裁定"手动档不提供记住授权"），于是除"批准/拒绝"外无路可走。
   - 根因③**批准完立刻再来一个**：每个写工具执行完模型马上发起下一个 ⇒ 弹窗间隔 ≈ 工具耗时（毫秒级），没有可操作的时间窗。
   - ★ 结构性限制④：**即使点到了 chip 也没用** —— 模式/规则是**每请求快照**，运行中改档对**当前请求**无效（见上"快照冻结"）。
2. ✅ **业界调研完成并落盘**：`devDocs/Agent审批机制业界调研（一手来源）.md`（42KB；覆盖 Claude Code / Codex CLI / Cursor / Cline / Roo Code / Copilot VS Code+CLI / Aider / Goose / OpenHands / Windsurf / Zed / Continue / Amp；只采信一手来源，源码给 `file:line`，并明确列出"未查到一手来源"的缺口）。
3. ✅ **方案已成文并交付评审**：`devDocs/Agent确认疲劳与模式切换方案.md`（§0 摘要 / §1 现状与根因 + 顺带发现 / **§2 业界做法（含「我们取/不取」表）** / §3 设计（改动 A 实时生效·B 非阻断·C 弹窗内脱身·D 超时体验 + §3.6 计划先行）/ §4 影响面 / §5 待裁定 **D1~D7** / §6 验收 **V1~V8** / §7 分期 / §8 明确不做）。
   - 业界结论要点：① 我们的三条腿**都有主流先例**——"同回合下一个 tool call 生效"= Claude Code v2.1.234+（官方原文 "You can also change a running session's permission mode at any time."）；"弹窗内直接切档"= Claude Code 的 `Yes, and switch to auto mode`；"非模态/排队"= OpenHands（`WAITING_FOR_CONFIRMATION` 非终态、状态落盘、可无限期挂）、Codex（排队在流式输出之后）、Cline/Roo（内联行）。② 业界**没有**"每 N 次弹一次"或"批 N 个操作合并批准"的通用做法 ⇒ 我们不该发明（我们的架构同一请求内串行、同时只 1 个 pending，"批"没有对象）。③ 厂商**自己承认** approval fatigue（Anthropic / Cursor / VS Code / Roo 一手引文），并且一律强调自动批准**"不是安全边界"**；反例 = CVE-2025-54135/54136（Cursor 无批准写文件 → RCE）。
4. ✅ **用户裁定（2026-10-10，逐条讨论中）**：
   - **D1 做** —— 模式/规则在当前请求内**实时生效**（`ToolRegistry` 增可选"上下文供应器"，`null` 时保持快照路径；读失败保守回落）。
   - **D2 保留** —— 标准模式**也允许**产生/生效"记住授权"规则（仅本会话；放宽 2026-09-23 裁定 #8）。
   - **D9 改为按工具授权** —— `DIR`/`REPO` 规则匹配同时校验 `tool`，并新增显式标注的「该目录内所有写操作不再询问」选项。
   - **D3 不做（保持现在的全屏遮罩）** —— 用户理由："这样不容易出问题"；因脱身入口放进弹窗，chip 点不到转为**经裁定的设计选择**。
   - **D5 推翻原推荐** —— **超时不得自动批准、也不得自动否决**（用户可能很久才答，或**故意不答**，例如离开有网络的地方回来再继续）⇒ 需"长时间/无限等待 + 待确认可恢复"。
   - **D10 = A+** —— 等待上限**默认无限**（不做任何自动决定）+ **全局挂起上限保护**（超限时对**新**写操作返回"请先处理待确认"）+ **保证结果落会话历史**（断开后重进会话能回看）；"不占线程的挂起（B）"留作后续专项。
   - **D11 = 必修** —— 补 `GET /agent/confirm/pending` + 前端进入会话/重连时重新弹窗（否则"离开网络再回来"不成立）。
   - **D12 = 代码无需改动** —— "连续同意三次后不再确认"**现状不存在**（已取证），但**原则立为硬约束**：不做任何"按次数"的行为；原稿"第 3 次提示条"已删除。
   - **D4 = 提供** —— 弹窗里给「切到自动模式并继续」，**不给"全部允许"**。
   - **D6 = 本轮不做** —— "计划先行"（标准档批量任务先出计划）记入 P2 备选。
   - **D7 = 全做** —— ① `pendingConfirm` 队列化；② "token 已过期/已被处理"提示；③ 旧 V5 结论按实测修回前序文档；④ chip 上"自动模式"的说明按 D8 后的真实行为修正。
   - **D8 = 降级** —— **仅** `move_doc`/`rename_doc` 由硬清单降为 `NORMAL`（自动档不再问移动/改名，标准档仍问）；`delete_doc`/`update_repos`/`create_doc_share` 保持硬清单。**已知代价（用户知情）**：自动档会静默移动/改名大量文件；移动/改名可能破坏外部引用（分享链接、历史、书签）。**连带**：`TestPermissionPolicy` 断言矩阵要改（自动档 + `move_doc` → ALLOW）、风险归类文档（`Agent权限模式改造计划.md` §3.2 / 已归档卡）要同步更新。
5. ✅ **裁定全部完成** ⇒ 已收口成 **方案 §9「裁定汇总 + 开工清单」**（A 服务端 10 项 / B 前端 7 项 / C 护栏与文档 6 项 / D 验收 V1~V10）。
6. ⚠️ **D5/D3 裁定牵出的新发现**（方案 §1.3-5/6/7/8）：① chip 里"自动模式"的说明漏了"移动/改名"；② `DIR`/`REPO` 规则不校验工具名（连带放行该目录内删除）；③ **服务端没有"查询待确认"接口** + 前端无重连 ⇒ **断线/刷新后待确认不可恢复**（"离开网络再回来"场景的硬缺口，D11 要补）；④ **两处等待实现**（工具门 + `AgentController.waitForConfirmation:3047`）都是"到点返回 false"。
7. ⛔ **D12 裁定（2026-10-10）**：用户指出"**连续同意三次后续不再确认**"是**错误机制，务必去掉** ⇒ 方案已**删除**原稿的"第 3 次确认提示条"，并立为硬约束：**不做任何"按次数"的行为**（不按次数放行、不按次数降级提问、不按次数弹提示）。
   ⚠️ **取证结论：代码里本来不存在这个机制**——穷举检索 `src/com/DocSystem/agent/**`、`WebRoot/web/agent/index.html`、`devDocs/**`，无 `approveCount`/`consecutiveApproval`/`autoApprove`/`alwaysAllow`/`批准全部` 之类；`AuditLogService` 只有 `approve/reject/record/getPendingEntry/getStatusByConfirmToken`。唯一与"3 次"相关的是 `ToolUseLoop` 的**防死循环护栏**（`MAX_IDENTICAL_CALLS=3`、`MAX_MALFORMED=3`）——**与用户批准无关，不得改动**。用户记忆的可能来源：① 前序方案 §4 验收 V5 的文字"各 **≥3 次**均不再弹"（验收场景描述 + 已判定存疑）；② 本方案原稿的"第 3 次提示条"；③ 业界产品（Roo/Cline 的 allowedMaxRequests）。
   ➡️ 用户 2026-10-10 追加裁定：**"代码里既然没有这个逻辑，那就不用管了"** ⇒ 代码零改动；原则保留在方案 §8/§9（D12）。
8. ⬜ 未改任何代码、未编译、未重启。

## 下一步

1. ✅ 实施 + 验收已完成；**待用户裁定是否提交**（提交范围见"未提交改动"）。
2. 提交后按惯例收尾归档（本卡移入 `DevAgentControl/已完成/`、`CLAUDE.md`「当前任务」换卡）。
3. 挂起/待裁定（不属本轮）：
   - `/agent/confirm`、`/agent/confirm/pending` **均只校验"已登录"、不校验会话归属**（既有缺口）。
   - D10 的"不占线程的挂起（选项 B）"；D6「计划先行」（P2）。
   - 参数微调：`agent.tool-loop.confirm-timeout` 默认已改 **0 = 无限等待**、`agent.tool-loop.max-pending-confirms` 默认 8（均在 `docSysConfig.properties`，**启动期读取 ⇒ 需重启**）。

## 生效约束

- **绝对保护不得被绕过**：`delete_repos` 等绝对保护在任何档位/任何"记住授权"下都要确认（2026-09-23 裁定）；本轮只改"如何问"，未改"谁必须被问"。
- **不做任何"按次数"的机制**（D12 硬约束）；**等待超时绝不自动批准/否决**（D5）。
- **规则仍只在本会话有效**（2026-09-23 裁定"作用域只做会话级"）。
- 改动落在**主仓库**（`D:/Dev/DocSys`），无 websocket / sales 仓库改动。
- 后端改动需重编译（`javac -g -encoding UTF-8`，输出到 `WebRoot/WEB-INF/classes`）+ 重启 dev Tomcat；前端（junction 挂载）硬刷新即可。
- 改 mapper XML 时必须**同步复制**到 `WebRoot/WEB-INF/classes/mapper/`（运行时加载处）。

## 未提交改动

- **二轮加固（待提交，主仓库）**：
  - `src/com/DocSystem/agent/entity/AuditLogEntity.java`（新增 `OperationStatus.ABANDONED`）
  - `src/com/DocSystem/agent/repository/AuditLogRepository.java` + `src/mapper/AuditLogRepositoryMapper.xml`（`markPendingAbandonedBefore`；XML 已同步到 `WebRoot/WEB-INF/classes/mapper/`）
  - `src/com/DocSystem/agent/controller/AuditLogService.java`（启动清理 `onApplicationEvent` + 宽限期 + 日志脱敏）
  - `src/com/DocSystem/agent/controller/AgentController.java`（`/confirm` 登录+归属校验、`/confirm/pending` sessionId 归属校验、审计记批准者、操作级路径用落库 token、日志脱敏）
  - `src/com/DocSystem/agent/tool/AuditWriteConfirmGate.java`（按会话分名额 + `pendingBusyMessage` + `maskToken`）
  - `src/com/DocSystem/agent/orchestrator/MainAgent.java`（新参数装配）
  - `src/com/DocSystem/agent/tool/TestPermissionLiveContext.java`、`TestWriteConfirmGateCoverage.java`（护栏 15→24、56→63）
  - `devDocs/Agent确认疲劳与模式切换方案.md`（§11）、`devDocs/参数存储策略与参数清单.md`（第三次更新）、`CLAUDE.md`、本卡
- ✅ **一轮实施已提交：主仓库 `e32c0f038`**（24 个文件；含实现 + 护栏 + 文档；无 websocket/sales 仓库改动）。
  - 一句话：`WebRoot/web/agent/index.html` + `src/com/DocSystem/agent/**` 17 个文件（含新增 `ConfirmGateBusyException`、`TestPermissionLiveContext`）+ 4 个 devDocs + `CLAUDE.md` + 本卡。
- 编译产物输出在 `WebRoot/WEB-INF/classes`（git 忽略，不入库）；源码树内不应出现 `.class`（本卡相关改动均输出到 classes）。

