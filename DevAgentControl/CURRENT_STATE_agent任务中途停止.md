# CURRENT_STATE_agent任务中途停止（工作卡）

建立于 2026-10-08。**状态：根因已定位 + 已离线/在线复现 + 修复（A+B+C）已实施并验证；未提交（等用户确认）→ 页面级 E2E 留给用户。**

- 第一轮：只做"建卡 + 够写锚点的最小取证"。
- 第二轮（本 session）：锁定那 5 次运行、对齐日志时间线、**用同一模型/端点离线复现**了截断，根因明确（见下「根因」节）。
- 第三轮（本 session 同轮继续）：用户裁定 **A+B+C 全做** → 已实施 + 全量护栏/运行时探针验证（见下「修复」节）。
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

- **页面级 E2E 未跑**：dev Tomcat（8100）当前**没在监听**（用户常态；Java 改动本来也需要重启才生效），且登录凭据不在手 → 浏览器验证留给用户。已用"响应层探针 + 前端 lint"覆盖同一契约。
- **`llm.max-tokens` 未落 properties 键**：只改了代码默认值（`llm.*` 一族本来就只有 `@Value` 兜底、properties 无键；且 `docSysConfig.properties` 的 checksum 同步只覆盖两个文件）。已登记进 `devDocs/参数存储策略与参数清单.md` §2.1-E。
- **按模型「高级参数」的 `maxTokens` 仍未接线**（`settings` 渲染进 `llmConfig` 串但 `ResolvedLlmConfig` 不带 → 到不了请求体）：这是**独立缺陷**，已作为第 7 条写进 `devDocs/参数存储策略与参数清单.md` §2.2；本次不改（用户只要 A）。
- 8192 是"覆盖已观测的 ~3.2K reasoning + 正文"的经验值；再长的思考仍可能撞顶 → 由 B 兜住（partial + 「继续」），不再无声停下。
- 未提交（等用户确认）。

## 生效约束

- **取证已完成；修复已实施并验证**（见上两节）。
- **用户裁定（2026-10-08）：先不提交 —— 用户要自己重启 dev 在页面上验一遍**；验完再决定提交。
- **未取到证据前不要改代码**（项目惯例：事实驱动；根因与证据位置写进本卡）——已满足。
- 出现里程碑（定位根因 / 拿到验证数字 / 结论被推翻 / 用户裁定 / 提交）**立即**更新本卡，不要攒批。
- 本卡**不要**顺手改 `CURRENT_STATE_agent工具技能规模化.md` 里的内容（独立挂起项）。

### 页面验证要点（给用户 / 下次会话）

- dev 是 **junction**：`C:\TomcatForDocSysDev\docsys\tomcat\webapps\DocSystem → D:\Dev\DocSys\WebRoot`
  → 新 `.class` 已在位（`LLMService.class` 已于 2026-10-08 07:40 更新），**重启即生效**；HTML/JS 改动硬刷新即可（静态资源无 `Cache-Control`，见挂起卡）。
- dev 的 ini 副本 `tomcat\webapps\docSys.ini\docSysConfig.properties` **没有 `llm.max-tokens` 键** → A 的新默认 8192 不会被覆盖（已核对）。
- **想主动复现"被截断"分支**：把 `llm.max-tokens=2048` 加进 **dev 的 ini 副本**（不要只改 `classes/docSysConfig.properties`：`docSysInit()` 会用 ini 整文件覆盖 classes，加在 classes 里会被冲掉）→ 重启 → 跑长思考任务 → 验完删掉再重启。
