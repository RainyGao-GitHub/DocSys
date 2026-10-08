# CURRENT_STATE_agent任务中途停止（工作卡）

建立于 2026-10-08。**状态：任务结束（已收尾）—— 根因已定位并复现 → A+B+C 已实施验证并提交（`eba99636c`）→ D1+D2+D3（按模型可配 / 撞顶升级重试 / 截断计数）已实施验证并提交（`0c840f6af`）→ 页面级 E2E 已通过（第五轮）→ **用户自查通过并提交 `e9b228bd8`（第六轮）**。**

**唯一遗留（与本次修复无关）**："Eclipse 编译不生成方法参数名"隐患待用户裁定（见「页面验证要点」末条）。

- 第一轮：只做"建卡 + 够写锚点的最小取证"。
- 第二轮：锁定那 5 次运行、对齐日志时间线、**用同一模型/端点离线复现**了截断，根因明确（见下「根因」节）。
- 第三轮：用户裁定 **A+B+C 全做** → 已实施 + 全量护栏/运行时探针验证；**用户已提交 `eba99636c`**。
- 第四轮（同日）：用户指出"改大默认值会让问题触发不出来" → 调研业界做法 → 裁定 **D1+D2+D3 全做** → 已实施验证并**提交 `0c840f6af`**（见「追加」节）。
- 第五轮（同日）：用户裁定"**由我启动 dev 并跑页面级 E2E**（含临时把某模型 maxTokens 设成 2048 验截断分支，验完清掉）" → **已执行并通过，配置已复原**（见「页面级 E2E」节）。
- 第六轮（同日 12:2x~12:3x）：**用户自查通过**（真实整理任务两次都正常收尾，含 26 轮那次）→ 提交 `e9b228bd8 【文档】…任务结束`。见「用户自查」节。
- ⚠️ **权限怀疑已被证伪**：Agent 连一次写工具都没调用就停了。

- 归属：`src/com/DocSystem/agent/`（**主仓库**，不是 office / websocket）
- 严重程度：**高**（用户视角：Agent 干不完多步任务，且三种权限模式都停）
- 相关但独立的挂起卡：`CURRENT_STATE_agent工具技能规模化.md`（P0 已提交、实施等裁定）——**不要顺手改**

## 当前任务

排查并修复"**Agent 多步任务执行到一半就停下来**"。

用户已观察到：同一个任务在 `标准模式` / `自动模式` / `全部允许` **三种模式下分别跑了一次，都会停** →
因此不像"某个权限档位没放行"这么简单（**该怀疑已于第二轮取证证伪**：停止发生在权限判定之前，见下方「根因」节）。

## 用户原话（2026-10-08）

> 我让 Agent 执行以下任务，刚开始是标准模式，Agent 没执行完就停下来了，我以为是模式问题，
> 后来切到自动模式 和 全部允许模式 分别又执行了一次，还是会停下来，所以我觉得是个 Bug，
> 具体 Agent 的执行历史应该还在（当时针对的是 **我的桌面** 仓库）：
>
> 【帮我整理一下桌面上的文件，根据文件的类型和内容帮我放到对应的目录里，如果没有合适的目录的话，帮我创建好了再放进去】

**任务特征（对复现很重要）**：多步 + 长链路（枚举桌面 → 逐个判断类型/内容 → 建目录 → **移动**），
**写操作密集**，且**目标仓库是"我的桌面"**（用户本机的本地目录仓库）。

## 根因（已定位 + 已离线复现，2026-10-08 第二轮 session）

**一句话**：Agent 不是被"权限/编排"停下的，而是 **LLM 的输出 token 预算（2048）被"思考(reasoning)"吃光** ——
流式返回 `finish_reason=length` 且**正文 content 为空**；`ToolUseLoop` 把"空正文 + 无工具调用"当成**正常最终回答**，
于是这一轮"成功"地返回了空答案 → 用户看到 Agent 停在半路、什么都不说，也不报错。

### 运行定位（就是用户说的那个会话）

dev 库 `C:\TomcatForDocSysDev\docsys\tomcat\DocSystem.db` →
`agent_sessions` **id=66 / session_id=`4776ff72-2ed6-44c0-b7ab-a7af944b914a`**
（username=Admin；`metadata.title` = 那句桌面整理的话；`metadata.permissionMode` = `allowAll`；
`created_at` 2026-10-07 13:56:52，`last_active` 14:02:16）。

**是「同一个会话里连跑 5 次」，不是 3 个会话**：`agent_session_messages` 里 5 条 user（seq 1/3/5/7/9），
其中 4 条是同一任务的重复投喂（原任务 → `继续` → `你为什么老是停下来？` → `我已经改成全部允许模式了` →
`我改成了全部允许模式了，你怎么还是停下来呢`）。

> 强证据：**该会话是本库 80+ 个会话中唯一 `role` 只有 `user,reasoning`、完全没有 `assistant` 的会话**；
> `agent_step_audits` 对本会话 **0 条**。

### 5 次运行 + 日志时间线（`C:\TomcatForDocSysDev\docsys\tomcat\logs\docsys.log`）

| # | requestId | 起始 | 工具轮 | 结束 | 结束方式 |
|---|---|---|---|---|---|
| 1 | `dbb540c6-f107-4d1d-85ee-02d12457ee68` | 13:58:51 | turn1-5（读了 6 个文件正文） | 13:59:16 | `PARSE turn=6 len=0 EMPTY` |
| 2 | `6e6d3758-638c-4aa3-902c-07f4948af750` | 14:00:01 | turn1-2 | 14:00:11 | `PARSE turn=3 len=0 EMPTY` |
| 3 | `bde6ff5e-aa70-466e-9056-f7f12dc09fa2` | 14:00:45 | turn1-5（扫了 22 个目录） | 14:01:04 | `PARSE turn=6 len=0 EMPTY` |
| 4 | `d2eeb4f6-c08d-4073-aa2e-637a4676dcd2` | 14:01:28 | turn1-2（mode=allowAll） | 14:01:38 | `PARSE turn=3 len=0 EMPTY` |
| 5 | `5002cfd0-10d0-4662-9964-8d0d678b96be` | 14:02:06 | turn1-2（mode=allowAll） | 14:02:16 | `PARSE turn=3 len=0 EMPTY` |

**5 次的结束行一字不差**：

```
[ToolUseLoop][PARSE] turn=N len=0 result=EMPTY(视为最终回答) head=[]
```

`len=0` = 这一轮模型**正文为空**；`ToolCallParser.parse("")` 返回空列表 →
`ToolUseLoop.java:487` 直接 `return ToolUseResult.success(withProductFooter(""))`。

### 为什么正文是空的（已离线复现）

- `agent_config.llm_models` 配的是**推理模型**：`deepseek-v4-flash` / `deepseek-v4-pro` @ `https://api.deepseek.com`，
  `settings:{}`（未勾选「使用高级参数」）。
- `LLMService.java:52` `@Value("${llm.max-tokens:2048}")` —— **全量搜过 `WebRoot/WEB-INF`（含 classes）与 spring xml：
  没有 `max-tokens`、没有 `llm.` 占位符** → **max_tokens 恒为 2048**（`applyConfig` 只设 endpoint/model/apiKey）。
- 推理模型的 `reasoning_content` **计入 `completion_tokens`** → 思考一长就吃光 2048，**还没轮到输出正文**。

**复现实验（同端点、同模型、合成数据，未使用用户任何文件）**：

| max_tokens | finish_reason | content len | reasoning len | usage |
|---|---|---|---|---|
| 2048 | **length** | **0** | 7019 | completion=2048, reasoning_tokens=2048 |
| 8192 | stop | 427 | 10324 | completion=3449, reasoning_tokens=3220 |

**与库里的证据吻合**：5 条 `reasoning` 消息（13277 / 6374 / 7593 / 6975 / 7817 字符）**结尾全部断在半个词上**：
`...CodeConverter.log-`、`...文档_2026-07`、`H. MxsDoc产品资料（5）：M`、`Hmm, but should I`、`...pptTest`
= 生成被硬截断的签名（若是模型正常收尾，不会是半个词）。

### 为什么这么"静默"（不报错、不重试、不提示）

| 环节 | 现状 | 位置 |
|---|---|---|
| "被截断"是否上报 | `done = ... && !"length".equals(finishReason)` —— 刻意不把 `length` 当结束，但**也没上报**（`StreamChunk` 只有 text/reasoning/toolCall/done/toolsRejected） | `LLMService.java:1244` |
| 空正文被当最终回答 | `parsed.isEmpty()` → `success("")` | `ToolUseLoop.java:487` |
| 失败重试不触发 | 重试只在 `!tr.success` 时走；`success("")` **不进** T5.1 重试 | `MainAgent.java:556` / `:604` |
| 前端「继续」入口不渲染 | 依赖 `meta.truncated=true`，而 `truncated=false`（P1/P3 机制**已存在**，只是从没被这个场景触发） | `MainAgent.java:640` / `index.html:3702` |
| 库里没有 assistant 消息 | `saveExchange` 跳过空 assistant | `ConversationHistoryService.java:64` |

### 附带观察（不是根因，但相关）

注入块里那句 **「写操作仍需用户确认」** 确实把模型带向了"先出方案、等确认"的路线（reasoning 里能看到它在
跟这条约束较劲），但**它不是停止原因**——模型是在"组织这份方案"的过程中被 token 上限截断的。

### 结论

1. **与权限档位无关**（停止点在权限判定之前，且一次写工具都没调用）→ 用户看到"三种模式都停"完全成立。
2. 是**两个缺陷叠加**：`max_tokens=2048` 对推理模型太小 ＋ 编排层把"空正文"当成功的最终回答。
3. **不是新问题**：全 `docsys.log` 里 `PARSE ... len=0 ... EMPTY(视为最终回答)` **共 9 次**，
   最早 2026-09-22（09-22×2、09-23、09-24、10-07×5）。

## 先对齐口径（避免查错地方）

用户说的"标准模式"是**前端 chip 文案**，后端 id 是 `manual`：

| 用户说法 | 前端 chip（`WebRoot/web/agent/index.html:3479-3481`） | 后端 enum（`agent/permission/PermissionMode.java`） | id |
|---|---|---|---|
| 标准模式 | `标准模式` | `MANUAL`（**新会话默认**） | `manual` |
| 自动模式 | `自动模式` | `AUTO` | `auto` |
| 全部允许 | `全部允许` | `ALLOW_ALL` | `allowAll` |

⚠️ `PermissionMode` 里 `MANUAL` 的 label 写的是"手动"，前端 chip 是"标准模式"——**日志/DB 里出现的是 id `manual`**，
排查时不要按中文名去找（这算一处文案不一致，可顺手记，但不在本卡范围）。

### 关键怀疑点（权限）—— **已证伪（2026-10-08 第二轮 session）**

原怀疑（第一轮，按代码确认的静态推理）：`ToolRiskCatalog`（`agent/permission/ToolRiskCatalog.java:37-39`）把
`move_doc`/`rename_doc`/`delete_doc` 归为 `DESTRUCTIVE` 硬清单，`auto` 档仍 ASK（`PermissionPolicy.java:62`），
而本任务核心动作是"移动文件" → 怀疑弹窗没落地 → 现象是"停下"。

**证伪证据**：那 5 次运行的 `[ToolUseLoop][STEP]` **全是只读工具**（`list_docs`/`get_repos`/`get_doc`），
**一次写工具都没被调用过**；Agent 连"提出移动方案"都没走到就停了 → **停止发生在权限判定之前**，与档位无关。
且 `manual`×3 / `allowAll`×2 的停止行**逐字完全一致**，正好解释用户看到的「三种模式都停」。

## 必读上下文（开工锚点）

1. **最可能同源的旧卡**：`DevAgentControl/CURRENT_STATE_agent任务续接与轮数上限.md`（2026-09-23 收尾，
   **P4 因"无数据支撑"挂起**）。该卡已经踩过"多步任务跑到一半被切断"，要点：
   - `agent/orchestrator/ToolUseLoop.java`：`MAX_TURNS = 25`（默认）/`MIN_TURNS=5`/`MAX_TURNS_LIMIT=50`、
     `BUDGET_WRAPUP_HINT`（到顶给收尾提示）、`trimTranscript`（`MAX_TRANSCRIPT_SIZE=30`/`MAX_TRANSCRIPT_CHARS=60000`）
   - `agent/orchestrator/MainAgent.java`：`loopResponse(...)`（`truncated` → `meta.truncated=true`）、
     `retryQueryWithProgress(...)`；**`MainAgent.java:202` 注释提到"扫 `agent_tasks` 表把中断的 pending/running
     任务恢复"——要确认这段恢复逻辑现在是否启用**（若未启用，停下的任务就永远停着）
   - `agent/controller/AgentController.java`：调 `ToolUseLoop` 的调用点、`[LEGACY-FALLBACK] sse-tool-loop-returned-null`
   - **取证方法可直接复用**：日志里 `[ToolUseLoop][STEP]` 按 `requestId` 聚合 → calls（STEP 行数）/ turns（最大 turn）
2. **权限链路**：`agent/permission/`（`PermissionMode` / `PermissionPolicy` / `PermissionRule` / `PermissionStore` /
   `PermissionTrace` / `SkillRiskRegistry` / `ToolRiskCatalog`）、`AgentController.java:2316`（模式校验）、
   `:2472`（作用域授权落库）；前端 `WebRoot/web/agent/index.html`（chip 3475-3485、作用域授权弹窗 2158、
   `loadPermission()` 6267、SSE `done` 处理）
3. **数据表**：`agent_sessions` / `agent_tasks`（`agent/config/DatabaseInitializer.java:54/105`）。
   dev 是 SQLite：`C:\TomcatForDocSysDev\docsys\tomcat\DocSystem.db`（产品亦支持 MySQL）。
   **那三次运行的会话与任务记录应该都在这里**。
4. 环境：dev 服务用 `C:\TomcatForDocSysDev\docsys\docsys_start_hidden.bat` 启动（前台阻塞式，属正常）；
   日志 `tomcat\logs\docsys.log` + `docsys_console.log`（后者被 Tomcat 独占，读取需 `FileShare.ReadWrite`）。

## 当前进展（取证已完成，2026-10-08 第二轮 session）

| # | 原计划取证项 | 结果 |
|---|---|---|
| 1 | 锁定那几次运行 | ✅ 会话 `4776ff72-…`，**同一会话内 5 次**（不是 3 个会话）；5 条 user 全无 assistant |
| 2 | 对齐日志时间线 | ✅ 5 个 `requestId` 全部以 `PARSE … len=0 EMPTY(视为最终回答)` 结束 |
| 3 | 三模式对比 | ✅ `manual`×3 与 `allowAll`×2 停止行逐字相同；**一次写工具都没调用** → 与权限无关 |
| 4 | 小规模复现 | ✅ **离线复现**（同端点/同模型/合成数据）：max_tokens=2048 → `finish_reason=length` + `content=0`；8192 → 正常 |
| 5 | 定性并出方案 | ✅ 定性完成 → **用户裁定 A+B+C 全做** → 已实施 + 已验证（见下节） |

> 复现成本的说明：本轮用的是**直接打 DeepSeek 端点**的离线探针（合成文件清单，未用用户任何文件），
> 比"在页面上重跑一次多步任务"更快更确定。**尚未**做页面级 E2E。

## 修复：用户裁定 A+B+C 全做（2026-10-08），已实施并验证

### 改了什么（按 A / B / C 分）

| # | 目标 | 落点 |
|---|---|---|
| **A** | 抬高输出预算（治标止损） | `LLMService.java`：`@Value("${llm.max-tokens:2048}")` → **`8192`**（+ 注释说明"推理模型的 reasoning 计入该预算"与"启动期静态读取"） |
| **C** | 把"被截断"显式上报 | `StreamChunk`：新增 `TYPE_OUTPUT_TRUNCATED` + `outputTruncated()` + `isOutputTruncated()`；`LLMService.StreamChunkIterator`：识别 `finish_reason=length`（OpenAI 兼容）与 `done_reason=length`（Ollama），`flushToolCalls()` 在 done 之前追加标记块，并打 WARN `[LLM] 输出被截断…`；`LlmTurnResult`：新增 `outputTruncated` + `text(text, truncated)`；`ToolUseLoop.runStreamingTurn` 捕获该标记 |
| **B** | 空正文不再当成功回答（治本） | `ToolUseLoop.runInternal`：`parsed.isEmpty()` 分支——**空/纯空白正文**先注入 `EMPTY_ANSWER_HINT`（"别再展开分析，直接给结论"）**重试一次**（`MAX_EMPTY_ANSWER_RETRIES=1`）；仍为空 → `emptyAnswerFallback()`（说明 + `TranscriptCompactor` 进展摘要）包成 **`partial` + `outputTruncated`**；**有正文但被截断** → 同样返回 partial + 该原因；两条路径都打 WARN `[ToolUseLoop][EMPTY]` / `[TRUNCATED]`（原 `PARSE … len=0` 保持 INFO 作为事实轨迹） |
| 配套 | 原因分流 | `ToolUseResult`：新增 `truncatedReason` + `REASON_MAX_TURNS` / `REASON_OUTPUT_TRUNCATED` + `partialOutputTruncated(...)`；`MainAgent.loopResponse`：`truncationNotice(tr)` 按原因给不同文案（**不能把"输出被截断"说成"工具预算到顶"**）+ `meta.truncatedReason`；`WebRoot/web/agent/index.html`：`applyDoneMeta` 读 `meta.truncatedReason`、`buildTruncatedFooterHtml` 徽标分「⏸ 输出被截断」/「⏸ 预算到顶（N 轮）」，「继续」入口不变 |

**没做**：权限链路一行未动（已证伪）；`PermissionMode.MANUAL` 显示「手动」vs 前端 chip「标准模式」的文案不一致只记为观察。

### 验证结果（可复核）

1. **全量护栏**：**45 套 / 1916 断言 / 0 失败**
   （基线 44 套 / 1869 → 新增 `TestTruncationContract` 23 断言；`TestToolUseLoop` +10、`TestToolUseLoopStreaming` +10、`TestStreamChatChunks` +4）
   编译命令（含 `-encoding UTF-8`，否则中文断言变乱码）：
   `javac -encoding UTF-8 -parameters -g -cp 'WebRoot\WEB-INF\classes;WebRoot\WEB-INF\lib\*' -d WebRoot\WEB-INF\classes <Test*.java>`
2. **运行时端到端探针**（`%TEMP%\docsys_chk\agentfix\AgentStopProbe`，**真端点 + 生产同一条链路** `streamChatChunksNative` → `ToolUseLoop`，合成数据）：**5/5 PASS**
   - `maxTokens=2048`（旧默认，故障形态）：真出现 `finish_reason=length` → 实测 `success=true truncated=true reason=outputTruncated turns=2 toolCalls=1 answerLen=128 reasoningSinkChars=6037` → **不再无声停下**（改造前这里要么返回半截正文且无任何提示、要么 `success("")` 空回答）
   - `maxTokens=8192`（新默认）：`success=true truncated=false reason=null answerLen=3816` → 正常完成
3. **响应层探针**（`LoopResponseProbe`，反射调 `MainAgent.loopResponse`）：**12/12 PASS** —— 两类截断文案不同、meta 键齐、正常回答零污染（`truncated`/`truncatedReason` 均不出现）
4. **编译**：改动源码 + 全部 45 个护栏类 `javac` 退出码 0；`.class` 全部落在 `WebRoot/WEB-INF/classes`（源码树无 `.class`）

> ⚠️ 注意（实测踩到）：PowerShell 里给 java 传 `-Dfile.encoding=UTF-8` 会被拆参数（`找不到或无法加载主类 .encoding=UTF-8`）→ 护栏命令**别加**这个开关；要看中文就重定向到文件再读。

### 未做 / 遗留（如实记录）

- ~~页面级 E2E 未跑（当时 dev 8100 没在监听、凭据不在手）~~ → **第五轮已补跑并通过**（见「页面级 E2E」节）；当时靠"响应层探针 + 前端 lint"覆盖同一契约。
- **`llm.max-tokens` 未落 properties 键**：只改了代码默认值（`llm.*` 一族本来就只有 `@Value` 兜底、properties 无键；且 `docSysConfig.properties` 的 checksum 同步只覆盖两个文件）。已登记进 `devDocs/参数存储策略与参数清单.md` §2.1-E。
- **按模型「高级参数」的 `maxTokens` 仍未接线**（`settings` 渲染进 `llmConfig` 串但 `ResolvedLlmConfig` 不带 → 到不了请求体）：这是**独立缺陷**，已作为第 7 条写进 `devDocs/参数存储策略与参数清单.md` §2.2；本次不改（用户只要 A）。
- 8192 是"覆盖已观测的 ~3.2K reasoning + 正文"的经验值；再长的思考仍可能撞顶 → 由 B 兜住（partial + 「继续」），不再无声停下。
- **A+B+C 已由用户提交：主仓库 `eba99636c`**（13 files changed, +665/−51）。

## 追加：D1 + D2 + D3（用户裁定，2026-10-08 同日）

### 触发与调研

用户指出："**改成 8192 很可能让问题触发不出来**"（即调大默认值只是掩盖触发条件），要求调研
"这个值能不能配、别的 Agent 通常怎么处理"。**调研结论**（来源为官方文档/仓库源码，未验证项已注明）：

| 项目 | 可配置 | 默认/范围 | 撞 `length` 处理 |
|---|---|---|---|
| Claude Code | ✅ `CLAUDE_CODE_MAX_OUTPUT_TOKENS`（被模型上限钳制；官方 settings 页未列该键） | **按模型**：默认 32k / 上限 64k | ①先**升级重试**到 64k；②**有界自动续接 ≤3 次**，注入"Resume directly — no apology, no recap… Break remaining work into smaller pieces" |
| Aider | ✅ 每模型 + `extra_params.max_tokens` | 按模型 | **显式抛 `FinishReasonLength`**（不静默） |
| Cline | ✅ 每请求 `options.maxTokens` | 门槛 32k；`min(模型上限, 上下文−提示−预留, 用户上限)` | 以 `finish_reason:"error"` 暴露，调用方必须检查 |
| Roo Code | ✅ 每模型 "Max Output Tokens" | 按模型 | **自动拒绝**截断输出 |
| Codex CLI / Agents SDK | SDK ✅ `ModelSettings.max_tokens` | 透传 | 不做续接；Codex 主循环里**没找到**按请求上限（**未完全验证**） |
| Copilot / Cursor | ❌（服务端按模型定 / 闭源） | — | 未见专门机制（**未验证**） |
| OpenRouter（provider 口径） | ✅ `max_tokens` / `reasoning.max_tokens` | — | 文档明确：**reasoning 与正文共用预算**，被吃光 → `length` + **空 `content`**；检测法 `completion_tokens − completion_tokens_details.reasoning_tokens ≈ 0` |

**反复出现的 5 个模式**：①按模型默认 + 用户覆盖并钳制（单一全局数字是少数派）；②给推理留"地板"别饿死正文；
③**必须显式检测 `length`**，绝不把空正文当回答；④有界自动续接 + 反思考提示；⑤撞顶先"升级重试"。

### 改了什么（用户裁定：D1+D2+D3 全做）

| # | 目标 | 落点 |
|---|---|---|
| **D1** | 让「按模型 maxTokens」**真正生效**（顺带修掉 §2.2-7 那个"只存不发"的独立缺陷） | `ResolvedLlmConfig`：新增 `maxTokens`（+`withMaxTokens` 复制、`parseMaxTokens(JSONObject)` / `parseMaxTokensFromJson(String)`，兼容 `maxTokens`/`max_tokens`，非法/越界回落 null）；`LLMService`：新增 `effectiveMaxTokens(override)`，**6 处请求体全覆盖**（`doChat`/`doChatNative`/`streamChat`/`streamChatChunks`/`openStreamResponse`＋其 400 重试体），`getDefaultMaxTokens()` 暴露全局默认；解析侧接线 `LLMService.resolveDefaultConfig`、`UserLlmModelService.toResolved` 与 `user:` 分支。**前端无需改动**——管理端「高级参数 → maxTokens」输入框本来就有 |
| **D2** | 撞顶**升级重试一次**（照 Claude Code） | `MainAgent`：`escalatedMaxTokensFor(current)=min(max(current*4, current+4096), 32768)`；`escalateAndRerun(...)` 用 `resolved.withMaxTokens(升后值)` 重建 ToolUseLoop、带进展摘要重跑、流式路径先 `onRetry()` 清掉半截内容；**只升一次**，升级不了/重试异常 → 保留第一次的 partial（绝不让"有部分成果"变"什么都没有"）。两条运行路径（sync/streaming）都接 |
| **D3** | 让截断**可观测**（直接回应"问题看不见"） | `MainAgent.countTruncation(...)` → `agentMetrics.incrementCounter("agent.tool.truncated", reason=…, path=…)`（`sync`/`streaming`/`escalated` 分桶）；配合已有的 WARN 日志 |

### 验证结果（D1~D3）

1. **全量护栏：45 套 / 1955 断言 / 0 失败**（A+B+C 时为 1916 → 本次 +39）
   - `TestResolvedLlmConfig` 7→**23**：maxTokens 字段/复制/两种键名/越界/非数字/**坏 JSON 不抛**
   - `TestStreamChatChunks` 13→**17**（+4）：**抓真实请求体**断言"按模型值 4096 下发、未配回落全局 2048"（生产走 `streamChatChunksNative`）
   - `TestTruncationContract` 23→**36**（+13）：D1 接线（6 处请求体都走 `effectiveMaxTokens`、**不得再有** `max_tokens", maxTokens`）、D2 公式与"只对 outputTruncated 生效"、D3 计数
2. **真端点运行时探针**（`AgentStopProbe`，生产同一条链路）：**7/7 PASS**
   - 全局默认 2048 → `truncated=true reason=outputTruncated answerLen=1998`（故障真复现；已是有提示的 partial，不再是无声停下）
   - 全局默认 8192 → `truncated=false answerLen=4036`
   - **全局默认 2048 + 按模型覆盖 8192 → `truncated=false answerLen=3557`** ← **这就是 D1 的决定性证据**：若"按模型值"没到请求体，这一次会沿用 2048 而照样截断
3. 编译：`javac` 退出码 0（改动源码 + 45 个护栏类）；`.class` 全在 `WebRoot/WEB-INF/classes`

> ⚠️ **踩坑记录（务必照抄命令）**：
> - 只 grep `error` 的中文报错会被乱码吞掉 → **编译后必须看 `COMPILE_EXIT`**；否则护栏跑的是旧 class（本次就出现了"假绿"：断言数停在旧值）。
> - PowerShell 传带 `=` 的 Java 参数（`-Dfile.encoding=UTF-8`、`-J-Duser.language=en`）会被拆开 → 必须加引号；
>   想让报错变英文用 `'-J-Duser.language=en'`（引号不可省）。

### 未做 / 遗留（D 部分）

- ~~页面级 E2E 仍未跑~~ → **第五轮已补跑并通过**（per-model 2048 真截断 + B 兜住 + 恢复配置复验）。
- **D2 的"升级重试"分支未被真实触发**：2048 下 B 的空正文重试**一次就拿到完整正文**了，所以没走到升级 → 该分支目前只有单元/响应层探针证据，**别写成"已实机验证"**。
- **全局默认值仍不落 properties 键**（只改代码默认 8192）——见 §2.1-E；想改就得新增 `llm.max-tokens` 键并重启。
- **升级上限 32768 是经验值**：真被服务商拒绝时只是退回 partial（已 try/catch 兜住），但会白花一次调用。
- **`max_tokens` vs `max_completion_tokens` 未做 provider 分支**（OpenAI 推理模型只认后者）；接了那类模型再说。
- **无显式模型配置（`resolvedLlm == null`）时不升级**（拿不到"当前值/复制"），直接保留 partial。

## 页面级 E2E（第五轮，2026-10-08，全程由我执行）

### 环境事实（顺带解掉用户"编译/运行 JDK 不一致"的担心）

- 用户担心"Eclipse 编译与运行是同一个 JDK，理论上运行期会出问题（没有 GraalVM）"：实测 **运行期 JRE = `tomcat\java\jre` = OpenJDK 1.8.0_302 + GraalVM CE 21.2.0 (jvmci-21.2-b08)**，
  编译期 `javac` = 1.8.0_162（产物 major 52），Eclipse 工程 compliance/source/targetPlatform 全 = 1.8
  → **无字节码版本问题**，也不需要拿 GraalVM 去编译；Eclipse 与脚本编译共用 `WebRoot/WEB-INF/classes`。
- dev Tomcat 由我启动：`C:\TomcatForDocSysDev\docsys\docsys_start_hidden.bat`（**async attached**，控制台日志 `tomcat\logs\docsys_console.log`），约 **56s** 才就绪。
- 登录：`POST /DocSystem/User/login.do`（**前缀必须 `/DocSystem/User/`**，`/DocSys/login.do` 会 404）`userName=Admin&pwd=<base64(Admin)>`；测试账号 `Admin / Admin`。
- 模型配置：`GET/POST /DocSystem/agent/config/llm-models`，body `{"models":[...]}`，响应结构 **`data.models[]`**；
  ⚠️ 响应的 **`legacy` 字段会回显明文 apiKey** → 别贴进报告；`save()` → `applyLLMConfigMirror()` → **改完即时生效、不用重启**。

### 步骤与结果

| # | 动作 | 结果 |
|---|---|---|
| 1 | 临时把两个模型 `settings.maxTokens=2048`（原值 `{}`；快照 `%TEMP%\docsys_chk\agentfix\llm_models_before.json`） | POST 200；镜像即时刷新（`applyLLMConfigMirror() … 模型数:2` + 解析出 `maxTokens : 2048`）——**已复原，见第 4 行** |
| 2 | **复现原任务**：`?ctxVid=2&ctxKind=dir`（焦点 = 整个「我的桌面」）+ **标准模式**（不批准写操作，绝不碰用户真实文件）+ 原任务文本（202 字符，与原卡一致） | turn1/2 `list_docs` → `turn=3 len=0 EMPTY`（**真截断**）→ `[ToolUseLoop][EMPTY] … outputTruncated=true → 注入"直接给结论"提示后重试本轮`（**B 生效**）→ `turn=4 len=1419` 拿到完整正文 → `ToolUseLoop(streaming) finished: success=true, turns=4, toolCalls=2, cost=15113ms` |
| 3 | 核对页面 + 落库 | 页面**无**「⏸ 输出被截断 / 预算到顶」徽标、**无**「继续」按钮（因重试成功 → `truncated=false`，符合预期）；最终回答完整（① 桌面根目录 84 项 = 22 目录 + 62 文件 ② 归置方案表格 + 反问确认）；DB **`assistant seq=33 len=1419`** ← **原 Bug 会话缺的正是这条**（原会话只有 user+reasoning） |
| 4 | **恢复配置**：用快照 POST 回（`settings={}`） | 200；GET 复查两模型 `settings={}` + apiKey 指纹不变（sha1 前 8 位 `fcecca92`）+ 模型数 2 → `RESTORE_MATCHES_SNAPSHOT: True` |
| 5 | 恢复后复验默认路径 | 短任务 `success=true, turns=1, toolCalls=0, cost=1244ms`；页面答"正常"、无徽标；DB `assistant seq=36 len=2` |

### 结论与未覆盖

- ✅ **D1 在生产链路上成立**：per-model `maxTokens` 真到了 wire —— 同一模型 / 同一任务文本在 2048 下**真的截断**（若"按模型值"没下发，就不会出现 `outputTruncated=true`）。
- ✅ **用户报的现象已消除**：截断发生后不再无声停下，B 兜住并给出完整回答（且落库可见）。
- ✅ 配置已复原、无残留；E2E 期间**未批准任何写操作**，未改动用户桌面文件。
- ⚠️ **未覆盖**：D2 升级重试分支（见「未做 / 遗留（D 部分）」）；「⏸ 输出被截断」徽标的**真机渲染**也没被看到（只在 `LoopResponseProbe` 里验过契约）——要看到它得让重试也失败。

### 用户自查（第六轮，2026-10-08 12:2x~12:3x）

用户自己在页面上跑了**真实**整理任务（含写操作），两次运行均正常收尾：

| 时间 | 结果 |
|---|---|
| 12:27:32 | `ToolUseLoop(streaming) finished: success=true, turns=26` |
| 12:30:53 | `finished: success=true, turns=8, toolCalls=24, cost=29696ms`；最终回答 =《桌面整理索引.md》已生成并核验完毕 |

- **全日志无任何截断痕迹**：没有 `outputTruncated`、没有 `[EMPTY] … 重试本轮`、没有 `escalat*` → 8192 默认下这两轮**没撞顶**，故障不复现。
- **DB 对照（同一 session `0b6b34b9-7a11`）**：现为 **assistant 17 条 / 23,269 字符**（user 17 / reasoning 17）；
  而**故障当时该会话 `assistant` 为 0 条**（只有 user + reasoning）→ 这是修复前后最直观的差异。
- 用户随后提交 `e9b228bd8 【文档】CURRENT_STATE_agent任务中途停止 任务结束`。

## 生效约束

- **任务结束**：A+B+C（`eba99636c`）、D1+D2+D3（`0c840f6af`）已提交；页面级 E2E 通过（第五轮）；用户自查通过并提交 `e9b228bd8`（第六轮）。源码零残余改动。
- **本卡已收尾** → 按项目惯例可移入 `DevAgentControl/已完成/`（**等用户确认后再移动 + 提交**）。
- **未取到证据前不要改代码**（项目惯例：事实驱动；根因与证据位置写进本卡）——已满足。
- 出现里程碑（定位根因 / 拿到验证数字 / 结论被推翻 / 用户裁定 / 提交）**立即**更新本卡，不要攒批。
- 本卡**不要**顺手改 `CURRENT_STATE_agent工具技能规模化.md` 里的内容（独立挂起项）。

### 页面验证要点（下次会话照这个走）

- dev 是 **junction**：`C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem → D:\Dev\DocSys\WebRoot`
  → 新 `.class` 已在位（`LLMService.class` 2026-10-08 07:40），**重启即生效**；HTML/JS 改动硬刷新即可（静态资源无 `Cache-Control`，见挂起卡）。
- 启动：`docsys_start_hidden.bat`，约 **56s** 才就绪 —— **早期 HTTP 超时/404 多半是还在初始化**。
- 登录：`/DocSystem/User/login.do`（`userName=Admin&pwd=base64(Admin)`，账号 `Admin/Admin`）。
- **复现「被截断」分支的首选手段**：`POST /agent/config/llm-models` 把某模型 `settings.maxTokens` 设 2048 → **即时生效、不用重启** → 验完 POST 回 `{}`（第五轮就是这么做的）。
  - 备选（验**全局**默认）：把 `llm.max-tokens=2048` 加进 **dev 的 ini 副本**（别只改 `classes/docSysConfig.properties`：`docSysInit()` 会用 ini 整文件覆盖 classes）→ 重启 → 验完删掉再重启。
  - dev 的 ini 副本当前**没有** `llm.max-tokens` 键 → 不会被覆盖（已核对）。
- **页面 URL 参数**：`?ctxVid=2&ctxKind=dir` = 焦点为整个「我的桌面」 —— **vid=2 映射真实 `C:/Users/65205/Desktop/`，写操作会动真实文件** → 用标准模式且**不批准**写确认。
- **日志读法（极易误读）**：`[ToolUseLoop][PARSE] turn=N len=M result=EMPTY(视为最终回答) head=[...]`
  —— `len` 是**正文长度**，`EMPTY` 指**工具调用表为空**（不是正文为空）。原 Bug 的签名是 `len=0` **且** `head=[]` 同时成立。
- **Eclipse 编译隐患（本轮新发现，待用户裁定）**：工程 `codegen.methodParameters=do not generate`，而本项目 Spring MVC 控制器**历史上必须带 `-parameters`**
  （先例：探针暴露 4 个接口 500 `IllegalArgumentException: Name for argument type [java.lang.Integer] not available`，见 `devDocs/Agent工具与接口可靠性计划.md:716`）；
  当前 `AgentController.class`（10/7 17:08）确实**无 `MethodParameters` 属性**。本次 E2E 实测 agent 端点正常（`/agent/stream`、`/agent/config/llm-models` 均 200，它们不依赖参数名反解），**未触发**该隐患
  → 属**独立隐患排查项**（处置方式：Eclipse 勾选生成方法参数名，或统一走带 `-parameters` 的 `do_compile.ps1 -Spring`），**本次不动**。
