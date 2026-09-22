# Agent 任务续接与轮数上限改造计划（2026-09-22）

> 目的：解决"多步任务跑到一半被硬切断、且已做的工作全部丢失"。
> 本文件是**实施前先排的计划**，含分期、验收、不做什么、回滚口径；进度记在配对的工作卡
> `CURRENT_STATE_agent任务续接与轮数上限.md`（本计划只定"做什么/怎么验收"，不记流水账）。

## 0. 结论摘要

| 项 | 内容 |
|---|---|
| 参照口径（**待用户确认**） | **骨架照 Claude Code**（上限是成本开关、到顶给"部分产出 + 怎么继续"、上下文满了压缩而非丢弃）；**默认值取 Copilot 的 25**（`chat.agent.maxRequests` 默认 25，比我们现在的 10 大方得多） |
| 不做 | Copilot 的"独立模型判定任务完成并自动续跑"（其 `chat.autopilot.advanced.enabled`，实验特性、需常驻多轮驱动）；Claude Code 的"无限对话 + 大上下文自动压缩"（我们没有那个 token 预算） |
| 分期 | P1 上限可配 + 到顶不丢成果 → P2 转录压缩 → P3 前端「继续」入口 + 续接上下文 → P4（可选）完成判定 |
| 建议工期 | P1+P2 一轮会话内完成（含护栏 + 页面 E2E）；P3 单独一轮；P4 待 P1-P3 上线后按真实数据评估 |
| 允许中途止损 | P1 完成即可独立验收（任务不再"无声失败"），P2/P3 任一延期不影响 P1 的价值 |

## 1. 问题与证据（全部为代码/实测事实，非推断）

### 1.1 现状链路（超轮数时发生了什么）

| 步骤 | 代码位置 | 事实 |
|---|---|---|
| 1 | `ToolUseLoop.MAX_TURNS = 10`（`public static final`，**硬编码**） | 单次用户请求内 **LLM 调用次数**上限（1 轮=1 次 LLM 调用，1 轮内可并发多个工具调用） |
| 2 | `ToolUseLoop.runInternal` 循环体 `while (turns < MAX_TURNS)` | 到顶后跳出循环 |
| 3 | `ToolUseResult.error("处理超时：AI 连续调用工具过多仍未给出回答（已中断）。请缩小请求范围或重试。", …, maxTurnsExceeded=true)` | **返回错误串**，不是"阶段成果 + 可继续" |
| 4 | `MainAgent.runToolUseLoop*` 失败重试分支 | 用**同样的 userQuery + "如果无法通过工具完成，请直接基于已有信息回答"** 再跑一次 —— **转录被重置，前面查到的观察全部丢掉**；最坏再花 10 轮 |
| 5 | 重试仍失败 → `return null` | `AgentController` 记 `[LEGACY-FALLBACK] sse-tool-loop-returned-null`，**回退旧编排**（弱答案/裸文本） |

### 1.2 第二个隐患：转录裁剪是"丢弃"不是"压缩"

`ToolUseLoop.trimTranscript()`：消息数 > `MAX_TRANSCRIPT_SIZE(30)` 时，**从最早的工具结果开始整条删除**
（`messages.remove(i)`）→ 长任务会"忘掉"前面读到的东西，模型要么重复读、要么基于缺失信息下结论。

### 1.3 影响面

- 需要多轮"观察→决策"的任务（批量建文档、整理归档、跨目录搜索后逐个核对）最容易撞顶；
- 用户侧表现就是本次反馈的"任务其实没有完成就结束了"，且**看不到已完成到哪一步**。

## 2. 参照模型对比与选定口径

### 2.1 两家怎么处理（已核实来源）

| 维度 | Copilot / VS Code Agent 模式（官方设置文档） | Claude Code（官方 CHANGELOG） |
|---|---|---|
| 上限 | `chat.agent.maxRequests` **默认 25**，可配；到顶是**停下来可继续**，不丢工作 | 交互式**默认不按轮数**（靠 auto-compact 持续跑）；`--max-turns` 与 agent frontmatter `maxTurns` 是**显式的成本开关** |
| 到顶怎么交付 | 停下 + 继续入口 | 子代理撞 `maxTurns` 时**返回标注为 partial 的输出 + 提示"用 SendMessage 继续"**，而不是当失败丢弃 |
| 完成判定 | `chat.autopilot.advanced.enabled`：**另一个模型**每轮判定"请求是否完成"并引导下一轮（实验） | `/goal`：设**完成条件**，跨轮一直做到满足；用量限制恢复后自动接着跑 |
| 上下文满了 | `summarizeAgentConversationHistory`（默认开）→ **摘要**历史 | auto-compact（约 80% 起）→ **摘要**；连续 3 次"刚压又满"就停手报错（不烧 token） |
| 大输出 | `chat.tools.compressOutput` 先压缩再入模型 | 大工具结果落盘 + 上下文里只放摘要/路径引用 |
| 子代理 | 搜索子代理 + 可嵌套（深度 5） | 子代理默认后台、深度 5、单会话上限 200（**防失控**，不是限制任务规模） |
| 运行中干预 | queue / steer / stop（stop 不撤销已完成动作）+ checkpoint | 可中断、可 `/resume`、后台任务、Todo 列表做跨轮进度载体 |

**共同点（这是我们要学的）**：都不把"轮数"当任务完成度的判据，而是
(a) 把上限放大到 25 甚至不限；(b) 到顶时**保留成果并给出继续方式**；(c) 上下文用**摘要**支撑长任务；(d) 用"完成条件/判定"决定何时停。

### 2.2 我们选哪条（建议 + 理由）

**建议：骨架照 Claude Code，默认值取 Copilot 的 25。**

1. **架构匹配度**：我们是"一次 SSE 请求内跑完循环"的模型。Claude Code 的"到顶 → 给部分产出 + 告诉你怎么继续"可以 1:1 映射成
   "同一会话再发一条继续"；而 Copilot 的 autopilot 自动续跑需要 harness 常驻驱动多轮 + 每轮一次额外模型调用，
   我们要么把单请求拉得很长（用户干等、SSE 超时风险），要么改成后台任务 —— 收益/风险比明显更差。
2. **痛点正对**：我们的痛点是"任务没做完就结束"，Claude Code 恰好把轮数上限当**成本开关**，并规定了到顶的交付物形态（partial + 继续提示）。
3. **"压缩而非丢弃"两家一致**，我们只需把 `trimTranscript` 从删除改成摘要。
4. **取 Copilot 的一点**：默认上限 **25**（可配）+ "到顶是停下让你继续"的产物品格。
5. **明确不照搬**：Copilot 的独立完成判定模型（P4 才评估）；Claude Code 的无限对话/超大上下文自动压缩（成本模型不同）。

## 3. 目标与验收口径

### 3.1 目标

1. 多步任务**不再无声失败**：撞上预算时交付"已完成什么 + 还缺什么 + 下一步"，并让用户一键继续。
2. 续接时**不重复已做过的事**（把已有观察压缩后带进下一段）。
3. 长任务**不因转录裁剪而失忆**。
4. 上限可配（管理员可调，默认 25），轮数/工具调用数对用户可见。

### 3.2 验收（可量化，逐条给证据）

| # | 验收项 | 证据形式 |
|---|---|---|
| V1 | 构造一个"必然需要 >10 轮"的真实任务（如：在某目录建 5 个文档并逐个写入内容） | 改造前：必走 `maxTurnsExceeded`；改造后：能一次跑完，或到顶给出阶段性结论 + 继续提示 |
| V2 | 到顶时的产物品格 | `done` 事件里带 `meta.truncated=true` 与 `turns/toolCalls`；回答里有"还缺什么/下一步"；前端出现继续入口 |
| V3 | 续接不重复劳动 | `docsys.log` 的 `[ToolUseLoop][STEP]` 中，第二段不再重复第一段已成功的同参数调用 |
| V4 | 转录压缩不丢条目 | 新护栏断言：被压条目降级为一行摘要（保留 `tool=` 与关键首行），且可计数 |
| V5 | 回归 | 全量护栏不低于基线（当前 **36 套 / 1361 项 / 0 失败**）；`TestToolUseLoop` 的"max turns"断言同步更新并通过 |
| V6 | 兜底率 | 多步任务不再出现 `[LEGACY-FALLBACK] sse-tool-loop-returned-null` |

## 4. 分期任务清单

### P1（必做，核心止血）：上限可配 + 到顶给阶段性成果

**改动落点**

| 文件 | 改动 |
|---|---|
| `ToolUseLoop` | `MAX_TURNS` 保留为**默认值常量**（10 → 25），新增实例级 `maxTurns`（构造参数，默认取常量）；循环用 `maxTurns` |
| `ToolUseLoop` | **预算收尾**：最后一轮（`turns == maxTurns`）不再直接跳出，而是先注入一条 `[SYSTEM] 预算即将用尽，请立刻用已有信息给出：①已完成 ②结论 ③还缺什么 ④建议下一步（不要再调用工具）` 再跑一轮拿"阶段性回答" |
| `ToolUseResult` | 新增 `truncated`（是否因预算收尾）字段；`maxTurnsExceeded` 语义保持（真到顶未收尾成功时才为 true） |
| `AgentConfigService` | 新增键 `agent_max_turns`（默认 25，区间 5~50），`MainAgent.buildToolLoop` 读取后传入 |
| `MainAgent` | ① 到顶但有阶段性回答 → 作为**成功回答**返回（末尾追加"⚠️ 本轮预算到顶（N 轮 / M 次工具调用）…回复『继续』我接着做"）；② 失败重试从"从头再来 + 直接回答提示"改为**"带进展摘要续接"**（摘要来自 P2 的压缩器） |

**护栏**：`TestToolUseLoop`（改"max turns"断言为可配上限 + 断言到顶时拿到阶段性回答而非错误）、
`TestToolUseLoopStreaming`/`TestToolUseLoopNative`（断言 `truncated` 标记与 SSE 事件序列不变）、`TestStepAudit`（轮数元数据）。

**验证**：V1 / V2 / V5 / V6 + 页面 E2E。

### P2（必做，防失忆）：转录压缩替代丢弃

- `ToolUseLoop.trimTranscript`：删除前把被删的工具结果替换为一行摘要
  `[TOOL_RESULT_SUMMARY tool=<name>] <前 200 字>（完整结果已省略，需要请重新调用）`；无内容可摘要时才退回"删位置 2"。
- 新增 `MAX_TRANSCRIPT_SIZE` 同时看**条数**与**总字符数**（避免 30 条超长结果仍然撑爆）。
- 被省略条目计数写 `docsys.log`（`[ToolUseLoop][TRIM] omitted=N`），便于 P1 的"续接摘要"取材与线上观测。
- 护栏：断言摘要格式 + 原条目名保留 + 计数正确（V4）。

### P3（推荐）：前端「继续」入口 + 续接上下文

- 前端 `WebRoot/web/agent/index.html`：`done` 带 `meta.truncated=true` 时，在该条回答下渲染「继续」按钮 → 发一条"继续"；
  气泡上显示"预算到顶 N 轮"。
- 后端：识别"继续/接着做"类续接意图时，把**上一条 assistant 结论 + 该轮工具摘要 + 未完成标记**作为上下文注入
  （需要在会话维度记一条"未完成任务"状态：优先放现有会话存储，不新增表）。
- 验收：点「继续」后模型从上次断点接着做（不重头再来），并最终交付完整结果。

**P3 实施记录（2026-09-22 已完成 + 页面 E2E 验证）**

| 点 | 定案 |
|---|---|
| 未完成任务标记存哪 | **复用会话 metadata**（`agent_sessions.metadata` 的 `pendingContinuation` 键，与 `title` 同级），**不新增表** |
| 写入时机 | 到顶交付（`ToolUseResult.truncated`）→ `ContinuationStore.savePending(sessionId, 结论, 工具进展摘要, turns, toolCalls)`；结论/进展分别封顶 1200/1500 字符 |
| 语义入口 | 仅当**整条消息**就是续接短语（继续 / 接着做 / go on / continue…，见 `ContinuationStore.CONTINUATION_QUERY`）且有标记时注入；否则按普通消息处理（避免把旧上下文反复注入） |
| 取用即清 | `takeContinuationContext` 注入后立刻删键；没有断点时的“继续”= 普通消息 |
| 注入内容 | `[SYSTEM] 这是上一段任务的续接…**不要重复已经完成的部分**` + 上一段结论 + 工具进展摘要 + “只补做缺失的部分，最后给完整结果” |
| 前端 | `done.meta.truncated=true` → 气泡下渲染「⏸ 预算到顶（N 轮）」+「继续」按钮（点击→走普通发送路径发“继续”，并收起该页脚） |
| 关键文件 | `session/ContinuationStore.java`（新）、`session/SessionService.java`（metadata 自定义键读写）、`orchestrator/MainAgent.java`（注入/记录钩子）、`WebRoot/web/agent/index.html`（页脚 + 点击委托） |
| 护栏 | 新增 `TestContinuationStore`（28 项：短语识别/存取/取用即清/非续接不消费/不影响 title/无会话降级/截断） |
| 实测（V3） | 段1（预算5）5 次工具调用到顶 → 点「继续」→ 段2 仅 `turns=2 / toolCalls=1`（**未重复** list_repos/get_repos），完成收尾；跨 Tomcat 重启后标记仍可续（`[Continuation][TAKE] … pending=used`） |

### P4（可选，待数据）：完成判定驱动自动续跑

- 等价 Copilot `chat.autopilot.advanced.enabled` / Claude `/goal`：用**低成本模型**判定"用户请求是否已完成"，
  未完成且未超总预算（如 2 段 × 25 轮）则自动续一段。
- 前置条件：先拿到 P1-P3 的真实数据（多步任务占比、平均轮数、续接率），再决定是否值得这个额外调用成本。

## 5. 不做什么（Non-goals，防止范围蔓延）

1. **不做** Copilot 式"独立模型自动判定完成 + 无限自动续跑"（P4 才评估）。
2. **不做** Claude Code 式"无限对话 / 超大上下文自动压缩"——我们没有那个 token 与延迟预算。
3. **不动**旧编排（SubAgent/LLMIntentParser）的封口策略（R3-4/R3-5 已定案：保留 + `@Deprecated` + `[LEGACY-FALLBACK]` 打点）。
4. **不改** SSE 协议既有事件（`text/tool_call/tool_result/retry/done`）；只在 `done.meta` 里**加字段**（向后兼容）。
5. **不扩**到工具本身的语义（本轮只解决"预算与续接"，不顺手改工具输出格式）。

## 6. 风险与回滚

| 风险 | 说明 | 应对 |
|---|---|---|
| 成本/等待上升 | 上限 10→25，单请求最坏 LLM 调用数 ×2.5 | `agent_max_turns` 可配（默认 25，可调小）；回答里显示实际轮数；观察一周再决定默认值 |
| SSE 长连接超时 | 轮数变多 = 连接更久，中间层可能断（既有 `SSE send failed` 噪声） | 观测；必要时默认降到 20；P3 的"继续"本身就是断点续接的兜底 |
| "继续"语义被误用 | 用户发"继续"但上下文里没有未完成任务 | P3 才开续接注入；无未完成标记时按普通消息处理 |
| 收尾轮模型不听话（仍调工具） | 预算收尾提示被忽略 | 收尾轮**禁用工具**（不传 tools / toolChoice=none），强制产出文字结论 |
| 回归 | 循环出口改动影响既有护栏与兜底统计 | 全量护栏 + 页面 E2E；单 commit 可 revert；`maxTurnsExceeded` 语义不放宽 |

## 7. 不变量（沿用工程铁律）

- 编译输出 `-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`；Spring 控制器编译带 `-parameters -g`。
- 测试/探针产物写 `%TEMP%\docsys_chk\`；**绝不写工程根 `tmp/`**。
- 提交归属：Agent 核心代码 + 本计划 + 工作卡 → 主仓库（`D:/Dev/DocSys`，`devInt`）。
- 每期结束先跑全量护栏（当前基线 **37 套 / 1409 项**，随护栏增加而上升）再提交；提交信息写清"验了什么"。

## 8. 进度锚点（卡更新规则）

- 每完成一期或任一条验收项（V1~V6）**立即**更新工作卡的三处：当前进展 / 下一步 / 未提交改动。
- 结论被推翻（例如收尾轮方案不可行）时，**删改原结论**，不留过期描述；FAIL 写清数字与归因。
- 里程碑达成即记录提交号（主库），避免"卡落后于代码"。
