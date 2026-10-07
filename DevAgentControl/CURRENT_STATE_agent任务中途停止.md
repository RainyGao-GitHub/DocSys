# CURRENT_STATE_agent任务中途停止（工作卡）

建立于 2026-10-08。**状态：待开工 —— 本卡不需要立即执行**（用户明示：会在新的 session 开始任务执行）。
本次只做"建卡 + 够写锚点的最小取证"，**没有复现、没有改动任何代码**。

- 归属：`src/com/DocSystem/agent/`（**主仓库**，不是 office / websocket）
- 严重程度：**高**（用户视角：Agent 干不完多步任务，且三种权限模式都停）
- 相关但独立的挂起卡：`CURRENT_STATE_agent工具技能规模化.md`（P0 已提交、实施等裁定）——**不要顺手改**

## 当前任务

排查并修复"**Agent 多步任务执行到一半就停下来**"。

用户已观察到：同一个任务在 `标准模式` / `自动模式` / `全部允许` **三种模式下分别跑了一次，都会停** →
因此不像"某个权限档位没放行"这么简单，**但也不能先排除权限**（见下方"关键怀疑点"）。

## 用户原话（2026-10-08）

> 我让 Agent 执行以下任务，刚开始是标准模式，Agent 没执行完就停下来了，我以为是模式问题，
> 后来切到自动模式 和 全部允许模式 分别又执行了一次，还是会停下来，所以我觉得是个 Bug，
> 具体 Agent 的执行历史应该还在（当时针对的是 **我的桌面** 仓库）：
>
> 【帮我整理一下桌面上的文件，根据文件的类型和内容帮我放到对应的目录里，如果没有合适的目录的话，帮我创建好了再放进去】

**任务特征（对复现很重要）**：多步 + 长链路（枚举桌面 → 逐个判断类型/内容 → 建目录 → **移动**），
**写操作密集**，且**目标仓库是"我的桌面"**（用户本机的本地目录仓库）。

## 先对齐口径（避免查错地方）

用户说的"标准模式"是**前端 chip 文案**，后端 id 是 `manual`：

| 用户说法 | 前端 chip（`WebRoot/web/agent/index.html:3479-3481`） | 后端 enum（`agent/permission/PermissionMode.java`） | id |
|---|---|---|---|
| 标准模式 | `标准模式` | `MANUAL`（**新会话默认**） | `manual` |
| 自动模式 | `自动模式` | `AUTO` | `auto` |
| 全部允许 | `全部允许` | `ALLOW_ALL` | `allowAll` |

⚠️ `PermissionMode` 里 `MANUAL` 的 label 写的是"手动"，前端 chip 是"标准模式"——**日志/DB 里出现的是 id `manual`**，
排查时不要按中文名去找（这算一处文案不一致，可顺手记，但不在本卡范围）。

### 关键怀疑点（已按代码确认，不是猜测）

`ToolRiskCatalog`（`agent/permission/ToolRiskCatalog.java:37-39`）把 **`move_doc` / `rename_doc` / `delete_doc`
归为 `DESTRUCTIVE` = 硬清单**，而 `PermissionPolicy` 的判定顺序是
`① 绝对保护 → ② 计划档拒绝 → ③ 会话规则命中(仅自动档) → ④ 硬清单`：

- **`auto` 档：硬清单仍 ASK**（`PermissionPolicy.java:62`、`TestPermissionPolicy` 的
  `decide(AUTO, DESTRUCTIVE, null, "move_doc", ...).isAsk()` == true）
- **`allowAll` 档：硬清单放行**（`decide(ALLOW_ALL, DESTRUCTIVE, null, "delete_doc", ...).isAllow()` == true）

用户这个任务的核心动作恰恰是**"移动文件"** → 所以：
- `auto` 档会弹确认 → 若弹窗没落地/前端没接住，现象就是"停下"；
- 但 `allowAll` 档**本该直接放行**却也停了 → **说明至少还有一个与权限无关的原因**（或者是同一个 UI/编排层的卡点）。

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

## 第一步该做什么（**先取证，不要先改代码**）

1. **锁定那三次运行**：查 `agent_sessions`（按 `username` + `last_active` 时间窗，或 `metadata.permissionMode`
   区分 `manual`/`auto`/`allowAll`）+ `agent_tasks`（`session_id` / `status` / `retry_count` / `timeout_at`）。
   要回答：三次各自**停在什么状态**（`completed`? 悬挂的 `running`? `failed`? `pending`?）、
   **最后一条消息/最后一次工具调用是什么**。
2. **对齐日志时间线**：找这三个 session 的 `requestId`，按 `[ToolUseLoop][STEP]` 聚合看 turns 与最后一步，
   据此把"停下"归类到下面某一类（**结论必须以证据落位**）：
   - 到**轮数上限** → 与旧卡 P4 同源（看有没有 `truncated` / `WRAPUP`）；
   - 停在**一个待确认的写操作**（移动/改名）→ 权限链路（弹窗没落地 / 前端没接住 / `allowAll` 判定仍走弹窗）；
   - 工具返回后**没有下一轮** → 编排循环终止条件 / SSE 断流 / 前端 SSE `done` 处理；
   - LLM 调用失败或超时 → 找异常栈。
3. **三模式对比**：`manual` / `auto` / `allowAll` 三次的**停止点是否相同**。
   若相同 → 权限不是唯一原因（用户已给出"都停"这个事实，值得优先验证这条）。
4. **可小规模复现**：小仓库 + 同类多步任务（枚举 → 建目录 → 移动）跑一次，边跑边看日志。
   建议先**专门证伪/证实权限假设**（例如：纯建目录不移动 vs 含移动各跑一次，看停止点差异）。
5. 定性后再出方案。可能的方向（**未定，不要提前实现**）：启用/修复中断任务的恢复；到顶给 partial + 继续入口
   （旧卡 P4 的思路）；硬清单在"用户已确认整批操作"场景下收窄；前端弹窗与 SSE 的健壮性。

## 生效约束

- **本卡不需要立即执行**；用户会新开 session 做。
- **未复现、未取到证据前不要改代码**（项目惯例：事实驱动；根因与证据位置写进本卡）。
- 出现里程碑（定位根因 / 拿到验证数字 / 结论被推翻 / 用户裁定 / 提交）**立即**更新本卡，不要攒批。
- 本卡**不要**顺手改 `CURRENT_STATE_agent工具技能规模化.md` 里的内容（独立挂起项）。
