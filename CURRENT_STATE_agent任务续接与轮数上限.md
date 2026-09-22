# CURRENT_STATE — Agent 任务续接与轮数上限（工作卡）

建立于 2026-09-22。**本卡是当前任务的唯一定义处**（必读上下文 / 进展 / 下一步 / 生效约束）。
上一个任务（技能与工具清理）已完成并全部提交，见 `CURRENT_STATE_agent技能与工具清理.md`（该卡只作历史查询，不再续接）。

## 当前任务

解决"多步任务跑到一半被硬切断、且已做的工作全部丢失"：
`ToolUseLoop.MAX_TURNS = 10` 的硬上限 + 超限后**返回错误串**（不是阶段成果）+ 重试**从头再来丢掉观察** + `trimTranscript` **整条丢弃**早期工具结果。

- 状态：**计划已排、卡已建；代码尚未动手**（等用户确认参照口径 → 开 P1）
- 计划（唯一口径来源）：`devDocs/Agent任务续接与轮数上限改造计划.md`
- 用户原话（本次触发）："目前我们的Agent设计的轮数限制导致了我有些任务其实没有完成就结束了"

## 用户定稿决策（2026-09-22）

| 项 | 状态 |
|---|---|
| 需要开工 / 新建独立工作卡 / 先排计划 | ✅ 已确认（用户明示） |
| 参照口径：**骨架照 Claude Code**（上限=成本开关、到顶给 partial + 怎么继续、上下文压缩而非丢弃），**默认值取 Copilot 的 25** | ⏳ **待用户确认**（计划 §2 已给对比与理由；不照搬 Copilot 的独立完成判定模型、也不照搬 Claude 的无限对话） |
| P1+P2 先做（一轮会话内），P3 单独一轮，P4 可选 | ⏳ 待确认（计划 §4） |

## 必读上下文（续接锚点）

1. 计划：`devDocs/Agent任务续接与轮数上限改造计划.md`（§1 问题证据 / §2 参照对比 / §3 验收 V1~V6 / §4 分期 / §5 不做什么 / §6 风险）
2. 代码锚点（行号为 2026-09-22 工作区状态）：
   - `src/com/DocSystem/agent/orchestrator/ToolUseLoop.java`：`MAX_TURNS = 10`（L56）；主循环 `while (turns < maxTurns)`（L385）；超限出口 `log.warn + ToolUseResult.error("处理超时：…")`（L468-471）；异常出口（L465）；**`trimTranscript()` 整条删除早期工具结果**（L637-658）；`MAX_TRANSCRIPT_SIZE = 30`（L65）
   - `src/com/DocSystem/agent/orchestrator/ToolUseResult.java`：`success / message / transcript / turns / toolCalls / maxTurnsExceeded`（L27）
   - `src/com/DocSystem/agent/orchestrator/MainAgent.java`：**失败重试**（非流式 L553-568 / 流式 L619-637）——"同样的 userQuery + 直接回答提示"**重跑一次，转录重置**；`buildToolLoop`（L640+，L700 读 `KEY_AGENT_TOOL_CHOICE`）
   - `src/com/DocSystem/agent/controller/AgentController.java`：调用点（L474）；**null → 回退旧编排** + `[LEGACY-FALLBACK] sse-tool-loop-returned-null`（L1391-1400）
   - `src/com/DocSystem/agent/config/AgentConfigService.java`：通用键值（`get/set/list/getGlobal`），现有键 `system_prompt_override` / `system_prompt_suffix` / `agent_tool_choice`
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
5. ⏳ 未开始编码

## 下一步

**等用户确认参照口径 → 开 P1**（第一步动作，按序）：

1. 读 `ToolUseLoop` 全文 + 4 个相关护栏，确认 `MAX_TURNS` 的引用面（含测试）与 `runInternal` 出口结构
2. 改 `ToolUseLoop`：`MAX_TURNS` 降级为默认值常量 + 实例级可配 `maxTurns`；加"预算收尾轮"（不传 tools，强制产文字结论）
3. 改 `ToolUseResult`：加 `truncated`；`maxTurnsExceeded` 语义不放宽
4. 改 `MainAgent`：到顶但有阶段成果 → 当成功返回 + 末尾"继续"提示；重试改为带进展摘要续接（依赖 P2 压缩器）
5. 改 `AgentConfigService` + `buildToolLoop`：`agent_max_turns`（默认 25，区间 5~50）
6. 同步护栏 → 跑全量护栏 → 页面 E2E（V1：构造 >10 轮的真实任务）→ 更新本卡 → 提交

## 未提交改动

- 无（计划 + 本卡 + 旧卡收尾指针 已于 `395e31b9b` 提交；本轮**未改任何代码**）

## 生效约束

- 本任务**是否需要先提交**：不需要（未改任何既有代码）；计划 + 卡随首次代码改动一起提交，或按用户要求单独提交。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`；Spring 控制器必须 `-parameters -g`。
- 测试/探针产物写 `%TEMP%\docsys_chk\`；**绝不写工程根 `tmp/`**。
- SSE 协议只做**加法**（`done.meta` 加字段），不改既有事件；旧编排封口策略（R3-4/R3-5）不动。
- 提交归属：Agent 核心代码 + 计划 + 工作卡 → 主仓库 `D:/Dev/DocSys`（`devInt`）。
- 每期结束先跑全量护栏（不得低于 36 套 / 1361 项）再提交，提交信息写清"验了什么"。
