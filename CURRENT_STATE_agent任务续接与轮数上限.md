# CURRENT_STATE — Agent 任务续接与轮数上限（工作卡）

建立于 2026-09-22。**本卡是当前任务的唯一定义处**（必读上下文 / 进展 / 下一步 / 生效约束）。
上一个任务（技能与工具清理）已完成并全部提交，见 `CURRENT_STATE_agent技能与工具清理.md`（该卡只作历史查询，不再续接）。

## 当前任务

解决"多步任务跑到一半被硬切断、且已做的工作全部丢失"：
`ToolUseLoop.MAX_TURNS = 10` 的硬上限 + 超限后**返回错误串**（不是阶段成果）+ 重试**从头再来丢掉观察** + `trimTranscript` **整条丢弃**早期工具结果。

- 状态：**P1+P2 代码已完成、编译通过、护栏 1381/0、页面 E2E 已验证（V1/V2/V4/V6）→ 待提交**
- 计划（唯一口径来源）：`devDocs/Agent任务续接与轮数上限改造计划.md`
- 用户原话（本次触发）："目前我们的Agent设计的轮数限制导致了我有些任务其实没有完成就结束了"

## 用户定稿决策（2026-09-22）

| 项 | 状态 |
|---|---|
| 需要开工 / 新建独立工作卡 / 先排计划 | ✅ 已确认（用户明示） |
| 参照口径：**骨架照 Claude Code**（上限=成本开关、到顶给 partial + 怎么继续、上下文压缩而非丢弃），**默认值取 Copilot 的 25** | ✅ **已确认**（用户回复"1. 口径：同意"） |
| P1+P2 先做（一轮会话内），P3 单独一轮，P4 可选 | ✅ **已确认**（用户回复"2. 分期：同意；3. 到顶的交付形态：可以"） |

## 必读上下文（续接锚点）

1. 计划：`devDocs/Agent任务续接与轮数上限改造计划.md`（§1 问题证据 / §2 参照对比 / §3 验收 V1~V6 / §4 分期 / §5 不做什么 / §6 风险）
2. 代码锚点（2026-09-22 **P1+P2 改造后**的状态；行号供粗定位，以符号名为准）：
   - `src/com/DocSystem/agent/orchestrator/ToolUseLoop.java`：`MAX_TURNS = 25`（默认值）/`MIN_TURNS=5`/`MAX_TURNS_LIMIT=50`；`setMaxTurns/getMaxTurns`；主循环 `while (turns < maxTurns)`；**预算收尾轮**在 `runInternal` 尾部（`BUDGET_WRAPUP_HINT` + `stripToolCallMarkup`）；`trimTranscript`（折叠优先：`findOldestFoldableRound`/`foldRound`/`isFullToolResultMsg`/`truncateContent`/`totalChars`）；常量 `MAX_TRANSCRIPT_SIZE=30`/`MAX_TRANSCRIPT_CHARS=60000`/`TRUNCATED_RESULT_CHARS=400`/`MAX_TRIM_STEPS=200`
   - `src/com/DocSystem/agent/orchestrator/ToolUseResult.java`：`truncated` 字段 + `partial(answer, transcript, turns, toolCalls)`；`success/error` 均 truncated=false
   - `src/com/DocSystem/agent/orchestrator/TranscriptCompactor.java`（新增）：`summarize(transcript, maxChars)` / `summaryLine(toolName, content)` / `FOLDED_ROUND_CHARS=600`
   - `src/com/DocSystem/agent/orchestrator/MainAgent.java`：`loopResponse(tr, durationMs, extraMeta)`（truncated → 追加提示 + `meta.truncated=true`）、`retryQueryWithProgress(query, failed)`（重试带进展摘要）；`buildToolLoop` 内读 `KEY_AGENT_MAX_TURNS`
   - `src/com/DocSystem/agent/config/AgentConfigService.java`：`KEY_AGENT_MAX_TURNS = "agent_max_turns"`
   - `src/com/DocSystem/agent/controller/AgentController.java`：调用点 L474；**null → 回退旧编排** + `[LEGACY-FALLBACK] sse-tool-loop-returned-null`（L1391-1400）
   - 前端：`WebRoot/web/agent/index.html`（SSE `done` 事件处理、消息渲染、会话队列）
3. 相关护栏（改动会碰到）：`TestToolUseLoop`（L183-195 "max turns" 断言 `r.turns == ToolUseLoop.MAX_TURNS`）、`TestToolUseLoopStreaming`、`TestToolUseLoopNative`、`TestStepAudit`、`TestLegacyFallbackGuard`
4. 记忆：`/memories/repo/agent-tools.md`（工具/编排口径与踩坑）、`/memories/repo/dev-tomcat.md`（编译/重启/`-parameters -g`）

## 基线（开工前实测，用于对比）

- 全量护栏：**36 套 / 1361 断言 / 0 失败**（`%TEMP%\docsys_chk\run_guards.ps1`）
- 当前上限：`MAX_TURNS = 10`（硬编码）；转录裁剪：`MAX_TRANSCRIPT_SIZE = 30`（整条删除）
- dev 环境：`C:\TomcatForDocSysDev\docsys` 8100，junction 挂载工作区（静态改动即时生效，Java 改动需重编译 + 重启）

## 当前进展

1. ✅ 定位问题链路并取得代码证据（计划 §1：10 轮硬上限 → 返回错误串 → 重试从头再来 → null → 回退旧编排；另有转录整条丢弃）
2. ✅ 核对两家参照实现（Copilot / VS Code 官方设置文档；Claude Code 官方 CHANGELOG），形成对比表与选定建议（计划 §2）
3. ✅ 排出分期计划（P1 上限可配 + 到顶给阶段成果；P2 转录压缩；P3 前端「继续」+ 续接上下文；P4 可选完成判定）与验收口径 V1~V6
4. ✅ 新建本工作卡
5. ✅ 用户确认口径/分期/交付形态（口径照 Claude Code 骨架 + Copilot 默认 25）
6. ✅ **P1+P2 编码完成**（2026-09-22）：
   - `ToolUseResult`：新增 `truncated` 字段 + `partial(...)` 工厂
   - `ToolUseLoop`：`MAX_TURNS` 10 → **25**（降为默认值）+ `MIN_TURNS=5`/`MAX_TURNS_LIMIT=50` + 实例级 `maxTurns`/`setMaxTurns`（钳制）+ 主循环改用 `maxTurns`；**预算收尾轮**（不传 tools、`stripToolCallMarkup` 剔工具标记、有文字→`partial`，无文字→仍 `error+maxTurnsExceeded`）；`MAX_TRANSCRIPT_CHARS=60000`/`TRUNCATED_RESULT_CHARS=400`；**`trimTranscript` 重写为"先折叠再删"**（`findOldestFoldableRound`/`foldRound`/`truncateContent`，原生通道从 `assistant.tool_calls` 取工具名）
   - `TranscriptCompactor`（新文件）：`summarize(transcript, maxChars)` + `summaryLine(name, content)`（P1 重试续接 / P2 折叠 / 后续 P3 共用）
   - `MainAgent`：`loopResponse(...)` 接住 `truncated`（追加"预算到顶 + 回复继续"提示 + `meta.truncated=true`）；`retryQueryWithProgress(...)` 重试携带进展摘要；`buildToolLoop` 读 `agent_max_turns` 并 `loop.setMaxTurns`
   - `AgentConfigService`：新键 `KEY_AGENT_MAX_TURNS = "agent_max_turns"`
7. ✅ 编译通过（javac 退出码 0）；护栏同步更新并全绿：**36 套 / 1381 断言 / 0 失败**（`TestToolUseLoop` 新增到顶交付、预算可配/钳制、折叠不丢条目等断言；旧基线 1361）
8. ✅ **页面 E2E 已验证（2026-09-22 22:43~22:52，重启 dev Tomcat 后实测）**：
   - V2（到顶交付形态）：`done` 事件 = `"meta":{"toolLoop":"streaming=true, turns=6, toolCalls=5","truncated":"true"}`（预算临时设为 5）；页面回答含"① 已完成 / ② 还缺什么"与"⚠️ 本轮工具预算到顶（6 轮 / 5 次工具调用）……回复「继续」"
   - V1（>10 轮任务不再无声中断）：仓库 17 个逐个列根目录的真实任务 → `turns=10, toolCalls=104`，**无 truncated、无报错**，一次性跑完（同一任务在预算 5 时会被收尾）
   - V4（折叠不丢条目）：线上实测 `[ToolUseLoop][TRIM] folded=2 messages=30 chars=21612` / `folded=1 messages=21 chars=18388`（原生通道折叠未引发 400，配对合法）
   - V6（兜底率）：`docsys.log` 中 `sse-tool-loop-returned-null` 全日志计数 **0**；今日无新增 `LEGACY-FALLBACK`
   - 另外实测：`[ToolUseLoop][WRAPUP] maxTurns=5 toolCalls=31 answerLen=3217`（收尾轮确实产出阶段性结论）
   - 无配置回退：临时键 `agent_max_turns` 已从 dev 库删除（默认 25 生效）

9. ✅ **已提交**：主仓库 `D:/Dev/DocSys`（`devInt`）commit **`8353fe0ed`**（7 files changed, +630/-76；含代码 + 本卡）

## 下一步

1. P3（下一轮）：前端「继续」入口（`done.meta.truncated=true` 时出现）+ 服务端续接上下文注入（复用 `TranscriptCompactor.summarize`，还需一个"未完成任务"标记）
2. P4 可选：完成判定（autopilot 式自动继续）
3. 会话恢复协议入口：`CLAUDE.md` 第 1 步仍指向旧卡 `CURRENT_STATE_agent技能与工具清理.md`（已封卡）——已向用户提议改指向本卡，待裁定

## 未提交改动

- 无。P1+P2 的 7 个文件（含本卡）已随 `8353fe0ed` 提交：
  - `src/com/DocSystem/agent/orchestrator/ToolUseResult.java`（+truncated/partial）
  - `src/com/DocSystem/agent/orchestrator/ToolUseLoop.java`（预算可配 + 收尾轮 + 折叠式裁剪）
  - `src/com/DocSystem/agent/orchestrator/TranscriptCompactor.java`（**新文件**）
  - `src/com/DocSystem/agent/orchestrator/MainAgent.java`（truncated 交付 + 重试续接 + 读配置）
  - `src/com/DocSystem/agent/config/AgentConfigService.java`（+KEY_AGENT_MAX_TURNS）
  - `src/com/DocSystem/agent/orchestrator/TestToolUseLoop.java`（护栏同步）
  - 本卡（计划已于 `395e31b9b` 单独提交）

## 生效约束

- 本任务**是否需要先提交**：不需要（未改任何既有未提交代码）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`；Spring 控制器必须 `-parameters -g`。
- 测试/探针产物写 `%TEMP%\docsys_chk\`；**绝不写工程根 `tmp/`**。
- SSE 协议只做**加法**（`done.meta` 加字段），不改既有事件；旧编排封口策略（R3-4/R3-5）不动。
- 提交归属：Agent 核心代码 + 计划 + 工作卡 → 主仓库 `D:/Dev/DocSys`（`devInt`）。
- 每期结束先跑全量护栏（不得低于 36 套 / **1381** 项）再提交，提交信息写清"验了什么"。
