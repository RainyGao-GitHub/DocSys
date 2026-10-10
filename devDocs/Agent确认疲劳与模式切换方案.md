# Agent 确认疲劳与模式切换方案

> 起因（用户 2026-10-10 原话）：「目前，在 **标准模式** 下 写操作使用的是弹窗，如果写操作特别频繁（比如整理目录时的大量文件移动操作），会导致**没有机会去进行 模式切换**，你帮我调研一下其他Agent时是怎么处理的，然后帮我设计一个方案，我确认后再开工」。
> 前序口径（**已实施**，本方案不改其结论，只改"怎么问"）：`devDocs/Agent权限模式改造计划.md`（四档模式 + 会话规则 + 判定优先级）。
> 业界调研（完整记录，一手来源）：`devDocs/Agent审批机制业界调研（一手来源）.md` —— 摘要见本文件 **§2**。
> **本文件是本次任务的唯一口径来源**（设计 / 待裁定 / 验收 / 不做什么）。工作卡：`DevAgentControl/CURRENT_STATE_Agent确认弹窗脱困.md`。

---

## 0. 结论摘要

现象是"**弹窗盖住了模式 chip，点不到**"；但代码核对后发现 **4 条根因**，其中第 ④ 条是结构性的、**不修就白修**：

| # | 根因 | 证据（已核对源码，非推测） |
|---|---|---|
| ① | 确认框是**全屏模态**，期间整个工具条（含权限 chip）被遮罩盖住，**物理点不到** | `.confirm-overlay{position:fixed;inset:0;z-index:11000}`（`agent/index.html:755`）；`.perm-menu` 只有 `z-index:60`（`:1868`） |
| ② | 标准模式**故意不提供**任何"记住/放宽"入口（2026-09-23 裁定"手动档不提供记住授权"）⇒ 除「批准执行 / 拒绝」外**无路可走** | 前端只在 `currentPermMode()==='auto'` 时渲染作用域下拉（`showConfirmModal`，`index.html:2991` 起）；服务端规则也只在自动档生效（`PermissionPolicy:54`） |
| ③ | 批准完**立刻又来一个**：写工具执行完模型马上发起下一个 ⇒ 弹窗间隔 ≈ 工具耗时（毫秒级），**没有可操作的时间窗** | `ToolUseLoop` 逐轮串行执行工具（`ToolUseLoop.java:556`），门在 `ToolRegistry.execute()` 内同步阻塞（`ToolRegistry.java:189`） |
| ④ | ★ **即使点到了 chip 也没用**：模式与规则是**「每请求快照」**，运行中改档**只对下一次请求生效** | `MainAgent.java:884/893/894` 每次**请求**读一次模式+规则 → `new PermissionContext(mode, rules, resolver)` → `registry.setPermissionContext(...)`；`PermissionContext` 字段 `final`，`ToolRegistry.permissionContext` 全仓仅 MainAgent/测试赋值；判定用的是 `ctx.mode`（`PermissionPolicy.decide`） |

> ⚠️ **另一个必须先知道的事实**（本轮核实，见 §1.4）：`move_doc` / `rename_doc` / `delete_doc` 属**硬清单**，**"自动模式"下也会弹窗** ⇒ "脱身"不能只靠切档；"整理目录"（大量移动/改名）必须靠**作用域规则**（D2）或调整风险分级（D8）。

**所以方案的骨架是两条腿 + 两条硬约束**：

1. **能脱身** —— 弹窗里直接给「本目录内不再询问」「切到自动模式并继续」（**脱身入口放在弹窗内**，不依赖够到 chip）；
2. **立刻生效** —— 让模式/规则在**当前这次请求内**实时生效（修根因④）；
3. ⛔ **不阻断** —— ✅ **已裁定不做（2026-10-10，用户）**：弹窗**保持现在的全屏遮罩**（理由："这样不容易出问题"）。因为脱身入口已在弹窗内，chip 在弹窗期间点不到**不再是问题** ⇒ **根因① 由"缺陷"转为"经裁定的设计选择"**；
4. ⛔ **不代用户决定** —— ✅ **已裁定（2026-10-10，用户）**：超时/倒计时**不得自动批准、也不得自动否决**（用户可能很久才回答，或**故意不答**——例如离开有网络的地方，等回来再继续）⇒ 需要"长时间/无限等待 + 待确认可恢复"，见 §3.2 改动 D 与待裁定 **D10/D11**。

安全底线**不动**：绝对保护（`delete_repos` 等）在任何档位/任何"记住授权"下**永远都要问**；授权作用域**只到本会话**。

---

## 1. 现状与根因（代码核对）

### 1.1 一次写操作的完整链路

```
用户："把这些文件整理到 A 目录"
 └─ POST /agent/chat（一次请求）→ MainAgent 组装本次请求的 ToolUseLoop
     ├─ MainAgent:884  permissionStore.getMode(sessionId)      ← 模式只在这里读一次
     ├─ MainAgent:893  permissionStore.getRules(sessionId)     ← 规则只在这里读一次
     ├─ MainAgent:894  new PermissionContext(mode, rules, 技能风险解析器)  ← 不可变
     └─ registry.setPermissionContext(ctx)                     ← ToolRegistry:149
     └─ ToolUseLoop 循环（最多 agent_max_turns 轮）
         └─ 每次工具调用 → ToolRegistry.execute()
             └─ if (def.needsConfirm) → ctx.decide(def, args)   ← 用**快照**里的 mode/rules
                 ├─ DENY  → 直接返回错误（计划模式）
                 ├─ ALLOW → 跳过门（记审计）
                 └─ ASK   → AuditWriteConfirmGate.confirm()
                     ├─ 建 PENDING 审计 → confirmToken
                     ├─ SSE 推 {"type":"confirm", ...}
                     ├─ **阻塞轮询** POST /agent/confirm（500ms 一次，默认 120s）
                     └─ 超时 → 返回 false（工具失败）
 └─ 前端：SSE confirm → showConfirmModal()（全屏模态）→ 用户点「批准执行」
```

### 1.2 现有可复用的能力（不必重造）

| 能力 | 位置 | 复用方式 |
|---|---|---|
| 四档模式（计划/标准/自动/全部允许） | `permission/PermissionMode.java`、前端 `PERM_MODES` | 直接切档 |
| 切档接口 | `POST /agent/permission/mode`（`AgentController:2320`）；前端 `setPermissionMode`(3618) | 弹窗内直接调用 |
| 会话作用域规则（工具/目录/仓库） | `permission/PermissionRule.java`、`PermissionStore`（`agent_sessions.metadata.permissionRules`，上限 50） | 弹窗内"批准并记住" |
| 记住授权接口 | `POST /agent/permission/rule`（`AgentController:2475`）；前端 `resolveConfirm(action, scope)`(3024) | 同上 |
| 清空授权 | `POST /agent/permission/rules/clear`；前端 `clearPermissionRules`(3652) | chip 菜单里已有 |
| 确认事件带上下文 | SSE `confirm` 已带 `operation/vid/path/risk`（`index.html:4244`） | 弹窗内可据此生成"本目录"范围 |
| 计划模式闭环 | `plan` 档 → 写操作 DENY → 模型出计划 → 「批准并执行」切 auto | 批量任务的另一条正道（见 §3.6） |
| 审计（含批准来源标注） | `AuditLogService` + `AuditWriteConfirmGate` | 记"谁放行的" |

### 1.3 顺带发现（本轮核查发现，建议一并修）

1. ⚠️ **旧验收 V5 存疑**：`Agent权限模式改造计划.md` §4 的 V5 写的是"自动档弹窗选『此目录内不再询问』→ 同目录 `write_file`/`move_doc`/`delete_doc` 各 ≥3 次**均不再弹**"。但按根因④，同一请求内规则快照是冻结的，**该结论在一次请求内不可能成立**；它只在"≥3 个用户回合（= 3 次请求）"时才成立。**实施阶段要重新实测**，并把结论按事实修回文档（可能是当时的验证跨回合做的，也可能当时验收偏松）。
2. ⚠️ **单槽 `pendingConfirm` 会被覆盖**：前端只有一个 `pendingConfirm` 变量（`index.html:2989`），第二个 `confirm` 事件会**覆盖**前一个的 token ⇒ 前一操作永远等不到答复、120s 后判失败。当前同一请求内工具是串行的，撞车概率低，但**多标签页/多会话并发**（同一 sessionId）时会真实发生。建议：入队 + 过期提示。
3. ⚠️ **超时 = 判失败**：`AuditWriteConfirmGate.waitForApproval` 超时返回 `false`（"拒绝"），工具直接失败。用户在处理弹窗时慢一点（比如去别的窗口看文件）就会**白做**。**✅ 已裁定（D5，2026-10-10）：超时不得自动批准、也不得自动否决**（用户可能很久才答或故意不答）⇒ 按 §3.2 改动 D 修。
4. 💡 **chip 本身没有"生成中"禁用**（`index.html:5690` 的点击处理无 `isGenerating` 判断）⇒ 若将来改做非模态，运行中点 chip 立刻可用（无需额外放开）。**D3 裁定"保持全屏遮罩"后本条暂不需处理**。
5. ⚠️ **chip 对「自动模式」的说明与实现不符**：前端写的是"常规写操作自动通过；**删除/权限变更**仍需确认"（`index.html:3480`），但**移动/改名/仓库更新**（`move_doc`/`rename_doc`/`update_repos`）也在硬清单里（见 §1.4）⇒ 文案应改为"删除/**移动/改名**/权限变更仍需确认"，否则用户切到自动档后会发现**还在弹**。
6. ⚠️ **`DIR`/`REPO` 规则匹配不看工具名**（`PermissionRule.matches`）：只有 `TOOL` 规则按工具名匹配；`DIR` 只比 vid + 路径前缀、`REPO` 只比 vid ⇒ 从 `move_doc` 弹窗里选"本目录内不再询问"，**实际生效的是"该目录内所有写工具（除绝对保护）都不再问"**（含该目录内的**删除**），而弹窗文案写的是"以后**这类**操作"，给人的印象更窄 ⇒ **✅ 已裁定（D9，2026-10-10）：`DIR`/`REPO` 匹配同时校验 `tool`**，并新增显式标注的「该目录内所有写操作不再询问」选项。
7. ⚠️ **待确认在断线/重载后无法恢复**（这是"离开网络再回来"场景的硬缺口）：服务端**只有 `POST /agent/confirm`，没有任何查询待确认的接口**；前端 `pendingConfirm` 只在内存里、`confirm` 事件是**一次性推送**，且 `agent/index.html` 里**没有 EventSource / 重连逻辑**（流是 XHR）⇒ 页面一刷新、网络一断，用户就**再也看不到那个待确认弹窗**，而服务端仍在等待。审计表里本来就有 `PENDING` 行（含 `confirmToken`），可以直接支撑一个查询接口（见 §3.2 改动 D / D11）。
8. ⚠️ **两处"等待确认"实现**（改超时语义时不要漏）：`tool/AuditWriteConfirmGate.waitForApproval`（工具门，主路径）与 `controller/AgentController.waitForConfirmation:3047`（`/agent/execute` 旧路径）**都是"轮询到点 → 返回 false（= 否决）"**。

### 1.4 ★ 关键前提：现在"自动模式"**并不能**免除"移动/改名"的确认

`ToolRiskCatalog` 的显式风险登记（`ToolRiskCatalog.java:38-60`，单一事实来源）+ `PermissionPolicy` 判定：

| 风险类 | 工具 | 标准档 | **自动档** | 全部允许 | 规则命中 |
|---|---|---|---|---|---|
| ABSOLUTE | `delete_repos`（+ 管理员追加名单） | 问 | **问** | **问** | **问**（不可豁免） |
| DESTRUCTIVE（**硬清单**） | **`move_doc`** / **`rename_doc`** / `delete_doc` / `update_repos` | 问 | **问** | 不问 | 不问 |
| PERMISSION（**硬清单**） | `create_doc_share` | 问 | **问** | 不问 | 不问 |
| NORMAL | `create_folder` / `write_file` / `write_office` / `edit_office` / `write_note` / `copy_doc` / `backup_repos` / `create_repos` | 问 | 不问 | 不问 | 不问 |
| 按技能声明 | `run_skill`（未声明 = 绝对保护） | 见技能 risk | 同左 | 同左 | 同左 |

**推论（对本任务极其关键）**：用户原始场景"**整理目录 = 大量文件移动**"用的正是 `move_doc`（DESTRUCTIVE）⇒ **切到"自动模式"照旧每次弹窗**。能真正止住它的只有三条：① **规则命中**（"本目录内不再询问"）② **全部允许**（最危险）③ 逐个点。

⇒ **D4（弹窗内切到自动模式）单独存在时，对"整理目录"是无效的**；必须配 **D2**（标准模式也能产生规则）或 **D8**（调整风险分级），否则用户在弹窗里切到自动档后会**发现还在弹**，体验比现在更差。

> ✅ **D8 裁定（2026-10-10，用户）：降级** —— **仅** `move_doc`/`rename_doc` 由 `DESTRUCTIVE` 降为 `NORMAL`（`delete_doc`/`update_repos`/`create_doc_share` 仍为硬清单）。
> ⇒ **实施后本表的"自动档"列会变为**：`move_doc`/`rename_doc` → **不问**；`delete_doc`/`update_repos`/`create_doc_share` → 仍问；`delete_repos` → 仍问。
> ⇒ 连带改动：`ToolRiskCatalog`（两行登记改类）、**护栏 `TestPermissionPolicy` 的断言矩阵**（"自动档 + `move_doc` → ASK" 必须改成 ALLOW）、`DevAgentControl/已完成/CURRENT_STATE_agent权限模式.md` 与 `devDocs/Agent权限模式改造计划.md` 里"破坏性：删除/移动/改名/仓库更新"的归类描述要同步更新（否则文档与实现不一致）。
> ⇒ **标准档不受影响**（标准档对所有写操作都问），"标准模式"的保护语义不变。

⚠️ **对照业界**：**Claude Code 的 `acceptEdits` 档**自动通过的是"Reads、file edits、**常见文件系统命令（`mkdir`,`touch`,`mv`,`cp`…）**"—— `mv`/`cp` 属自动通过；而我们的自动档把 `move_doc` 当硬清单。**我们的自动档比 Claude Code 的 acceptEdits 更严**（这正是 §1.3-5 文案与实现不符的根源）。

---

## 2. 业界做法（调研）

> 完整调研记录（对照表 / 逐条问答 A–G / 模式清单 / 缺口声明）：`devDocs/Agent审批机制业界调研（一手来源）.md`（2026-10-10，只采信一手来源：官方文档 / 官方仓库源码 `file:line` / 官方博客 / 官方 issue；网络受限处经 `r.jina.ai` 代理取回正文）。
> 下面只保留与本方案直接相关的结论。

### 2.1 一句话结论

**用户遇到的这个问题，业界有针对性解法，且"我们想到的三条腿"在主流产品里都能找到对应先例**——尤其是"**同一回合的下一个工具调用即生效**"（Claude Code v2.1.234+）与"**弹窗内直接切到自动模式**"（Claude Code 的 `Yes, and switch to auto mode`）。但**没有任何产品把"弹窗堆叠导致点不到模式开关"当作显式问题写进文档**，也**没有**"每 N 次弹一次"或"批 N 个操作一次批准"的通用一手实现。

### 2.2 各家档位的确切名字（对齐参考）

| 产品 | 档位/模式（确切名） | 备注 |
|---|---|---|
| **Claude Code** | `default`(=Manual) / `acceptEdits` / `plan` / **`auto`** / `dontAsk` / `bypassPermissions` | `auto` 的**设计目的官方原文**写的是 *"Long tasks, **reducing prompt fatigue**"*；v2.1.283+ 起 `auto` 是交互式终端/VS Code 的**默认起始模式**；规则优先级 `deny → ask → allow` |
| **OpenAI Codex CLI** | 预设 `read-only` / `auto`(=Default) / `full-access`；**正交的 reviewer 轴** `user`("Ask for approval") / `auto_review`("Approve for me")；`approval_policy` = `on-request`/`never`/`granular`；`sandbox_mode` = `read-only`/`workspace-write`/`danger-full-access` | `--yolo` = `--dangerously-bypass-approvals-and-sandbox`，官方标 **Elevated Risk / not recommended** |
| **Goose** | `chat` / `approve` / **`smart_approve`** / `auto`（源码 `goose_mode.rs:24-31`） | `smart_approve` = **LLM 分类器**判只读；默认 `auto` 被自家贡献者在 issue #2806 称 *"Autonomous mode by default is dangerous"* |
| **GitHub Copilot**（VS Code） | **Manual permissions** / **Assisted permissions** / **Allow all** + 模式 **Autopilot** | 标题即"permissions"，与我们四档同构 |
| **Cursor** | 现行 `Auto-review` / `Allowlist` / `Run Everything`；3.5 已退役 `Run in Sandbox`/`Ask Every Time` | Auto-review 官方明说 *"not a security boundary"* |
| **Roo Code** | 8 项 auto-approve + 命令**前缀 allow/deny 表**（最长前缀优先、deny 胜）+ `allowedMaxRequests/Cost` 上限 | 分叉自 Cline |
| **OpenHands** | 确认策略 `AlwaysConfirm` / `NeverConfirm` / `ConfirmRisky`(阈值默认 HIGH)；风险级 LOW/MEDIUM/HIGH/UNKNOWN | UNKNOWN **默认要确认** |

对我们的启示：我们的四档（**计划 / 标准 / 自动 / 全部允许**）与 `plan` / `default`(Manual) / `acceptEdits`·`auto` / `bypassPermissions`·`Allow all` **一一对齐**，命名无需改。

### 2.3 与本痛点直接相关的横向对照（节选）

| 产品 | 审批**阻塞**吗 | **运行中**能改权限吗 | **弹窗内**能升级吗 | 连续同类操作怎么省 | 事后可回滚 |
|---|---|---|---|---|---|
| **Claude Code** | 阻塞该次操作，但**弹窗内即含升级按钮**；`/permissions` 可"**while Claude is working**"打开，**改动自同一回合的下一个 tool call 生效**（v2.1.234+） | **能**（官方原文 *"You can also change a running session's permission mode at any time."*） | **有**：Bash 提示上的 **"Yes, and switch to auto mode"**（限 Bash + auto 可用；PowerShell / ask 规则 / hook 提示**不给**） | `auto` 分类器整类免问 + 持久化 allow 规则 | 无内置 checkpoint（靠 git + 沙箱） |
| **OpenAI Codex CLI** | **审批可"deferred behind streaming output"**（排队而非抢占），TUI 全程可用 | **能**（`/permissions` 的 `available_during_task()==true`、`Shift+Tab` 循环、`/approve` 复审） | 弹窗按钮里放**粒度**：`"Yes, just this once"`、`"…don't ask again for commands that start with \`X\`"`、`"…in this session"` | 命令**前缀永久规则**（落盘 `~/.codex/rules/default.rules`，最严者胜） | 无内建 undo（`/diff`/`/review` + 建议 git 分支） |
| **Cline / Roo** | Agent 阻塞但**编辑器非模态**（审批是聊天内 inline 行，auto-approve 面板始终可点） | **能**（`Ctrl/Cmd+Alt+A`，Roo 还"保留你的权限选择"） | 无（升级走面板） | **Roo Batch Diff Approval**（一次批准应用整批）；`allowedMaxRequests` 反向设计 | **有**：shadow git checkpoint（改文件前打点） |
| **OpenHands** | **最彻底的非模态/排队**：`WAITING_FOR_CONFIRMATION` 是**非终态**、状态**自动落盘**、可无限期挂着，期间 pause / 发消息 / **改确认策略**都能做 | **能**（REST 改策略） | 无 | **一次 `accept` 覆盖该批全部 pending** | 会话图 fork/navigate + git diff |
| **Cursor / Windsurf / Zed** | Cursor 未查到一手明文；Windsurf 完全非模态（只有不被允许的命令才弹卡片）；Zed 阻塞该线程但其他线程可并行 | 能（Windsurf 改级别/列表；Zed ACP session modes 随时改） | 无 | LLM 分类器（Cursor Auto-review） | Checkpoints + Restore |

### 2.4 可复用模式，以及我们**取/不取**

| # | 模式 | 谁在用 | 我们 |
|---|---|---|---|
| 1 | **弹窗内直接升级模式**（"Yes, and switch to auto mode"） | Claude Code；Copilot 的 "Enable Auto Approve…" | **取** → 改动 C（待裁定 D4）。对齐 Claude 的收敛做法：**只在需要时给，且不给最危险的档（我们不给"全部允许"）** |
| 2 | **非模态/排队审批**（Agent 挂起但 UI 与设置全可用） | OpenHands（最彻底）、Codex（排队在流式输出之后）、Cline/Roo（inline 行）、Windsurf | **取** → 改动 B（待裁定 D3）。我们先取最小形态（遮罩不拦人 + 等待提示），不引入"无限期挂起" |
| 3 | **运行中改档、且**从同一回合**的下一个 tool call 生效 | Claude Code（官方明写）、Codex、Copilot、Cline/Roo、Goose、OpenHands | **取** → 改动 A（待裁定 D1）。这正是我们的根因④，Claude Code 已把这条做成默认行为 |
| 4 | **会话级允许清单**（一次批准只在本会话、不落盘） | Copilot `scope:'session'`、Codex `ApprovedForSession`、Claude Code 文件编辑 "until session end" | **已在做**（2026-09-23 裁定"作用域只到会话级"）。VS Code 官方推荐会话级正是为了"限制提权时长"→ **坚持不落盘** |
| 5 | **批准并记住窄规则**（"同前缀/同目录不再问"） | Codex（命令前缀→落盘）、Copilot（Always Allow）、Claude Code（`.claude/settings.local.json`） | **取**（我们已有 `tool/dir/repo` 三类作用域）→ 待裁定 D2 决定是否让标准模式也能产生 |
| 6 | **批量/折叠审批**（一次批准覆盖一批同类） | Roo Batch Diff、OpenHands 单 `accept` 覆盖全部 pending、Copilot CLI"同类并行待审请求自动批准" | **不适用**：我们的工具在**同一请求内串行**执行（`ToolUseLoop` 逐个调），**同时最多只有 1 个 pending**，"批"没有对象。想实现等效效果 → 用模式 5（"本目录内不再询问"= Codex 前缀规则的目录版） |
| 7 | **"每 N 次弹一次"** | **未找到任何一手实现**；Roo 的 `allowedMaxRequests` 是**反向**的（到量后停下问；默认 Unlimited），Cline 曾在默认 20 次后于 2025-10 移除（理由："多一层复杂度=坏设计"） | ⛔ **不做，且已按 D12 升级为硬约束**：不只是"不做自动放行"，也**不做任何"按次数"的提示/降级**（原稿那条"第 3 次提示条"已删除）；现状代码里也**不存在**此类机制（取证见 §5 D12） |
| 8 | **智能批准**（LLM/启发式自动放行） | Goose `smart_approve`、Claude `auto`、Codex `auto_review`（带 3/10 熔断）、Cursor Auto-review、Copilot Assisted、OpenHands（LLM + 确定性层） | **本轮不做**（与前序方案 §6 一致）。业界一律声明它 **"不是安全边界"**；OpenHands 的理由值得记下：*"the model can be manipulated… You need a layer that does not depend on model judgment"*，且规定 **"UNKNOWN 不等于 safe"**、**"取最大严重度，不做平均"** |
| 9 | **沙箱替代确认 / checkpoint 事后回滚** | Codex（Seatbelt/Landlock/MXC）、Anthropic sandbox-runtime（官方称**提示减少 84%**）、Cline/Roo shadow-git、Cursor/Copilot Checkpoints、Aider（每步 commit + `/undo`） | **本轮不做**（与本任务正交）。但我们**已有部分配套**：仓库历史版本、回收站（`delete_doc` 可进回收站）、Office 文档历史 → 在"减少确认"的同时**不是**完全没有回头路（§3.5 会写明边界） |
| 10 | **逃生阀自锁 + 高调命名** | Claude Code `disableBypassPermissionsMode`/`disableAutoMode`、Codex `--dangerously-*`/`--yolo`、VS Code 警告横幅 | **不重开**：我们曾做过"管理员禁用全部允许档"，2026-09-23 经用户裁定**移除**（理由：该档自身已有二次确认 + 绝对保护，管理员开关用途不大）。仅保留 UI 醒目色 + 二次确认（现状） |
| 11 | **自动批准计数上限 / 到量提醒** | Roo `allowedMaxRequests`/`Cost`（默认 Unlimited，触顶给 "Reset and Continue"） | **不做**（同 #7 理由：Cline 已因此移除；且我们的问题不是"批太多"而是"点不到开关"） |

### 2.5 "确认疲劳"是厂商自己承认的问题（一手引文）

- **Anthropic 工程博客（2025-10-20）**：*"Constantly clicking 'approve' … can lead to **'approval fatigue'**, where users might not pay close attention to what they're approving, and in turn making development less safe."*
- **Claude Code 安全文档**把 **"Prompt fatigue mitigation"** 列为内建保护项。
- **Cursor 博客**：*"asking for permission too often creates its own safety problem. After enough repeated prompts, people stop reading carefully, and the approval flow becomes less meaningful."*
- **VS Code 官方**：**"Approval fatigue.** Repeatedly approving commands can cause you to pay less attention… especially during long agent sessions."；并把**"Terminal auto-approval is a best-effort convenience, not a security boundary"** 标为 CAUTION。
- **风险的另一面（一手公告）**：**CVE-2025-54135 / CVE-2025-54136（Cursor）** —— *"Cursor allows writing in-workspace files **with no user approval**"* → 间接注入改配置 → **无批准 RCE**；以及**已记住的 MCP 定义被静默替换**。这正是"记住授权"这一类机制的教科书级反例，**也是本方案把作用域死死限制在"本会话 + 该工具/该目录/该仓库"、且绝不豁免绝对保护的直接理由**。

### 2.6 结论（对我们）

1. 我们要做的三件事（**实时生效 / 非模态 / 弹窗内脱身**）**都有主流先例**，不是自创：分别对齐 Claude Code 的"同回合下一个 tool call 生效"、OpenHands/Codex/Cline 的非模态排队、Claude Code/Copilot 的弹窗内升级。
2. 业界**没有**"每 N 次弹一次"或"批 N 个操作一次批准"的通用做法 → 我们**不该**发明它们；等效需求用"作用域规则"（模式 5）解决即可。
3. 业界的共识配套是**把隔离/回滚补上**（沙箱、checkpoint），而不是简单加大放行。我们不引入沙箱，但要把"我们已有的回滚能力（历史版本/回收站）覆盖到什么程度"在 §3.5 写清，避免给出"可以放心全放行"的错觉。
4. "减少确认"的所有厂商都强调**不是安全边界**：因此本方案**不降低**"谁必须被问"的判定（绝对保护、硬清单语义全不变），只改"怎么问、在哪问、何时生效"。

---

## 3. 设计

### 3.1 目标与非目标

**目标**：让用户在**任何时刻**都能从"标准模式的高频确认"里脱身，且脱身**当场生效**、不牺牲"可疑操作必须有人点头"这一安全语义。

**非目标**：不改判定优先级（绝对保护 → 计划 → 规则 → 硬清单 → 模式默认）；不引入"沉默自动放行"；不引入跨会话/全局持久化授权。

### 3.2 核心改动三件套（对应根因 ④①③②）

#### 改动 A：模式/规则"每请求快照" → **实时生效**（必须，修根因④）

- **做法**：`ToolRegistry` 新增**可选的上下文供应器**，默认 null 时行为与现在**完全一致**（旧路径/护栏不受影响）：

  ```java
  // ToolRegistry
  private volatile Supplier<PermissionContext> permissionContextSupplier = null;  // 新增
  public void setPermissionContextSupplier(Supplier<PermissionContext> s) { ... }

  // execute() 里：
  PermissionContext ctx = (permissionContextSupplier != null)
          ? permissionContextSupplier.get()      // 每次工具调用取最新
          : this.permissionContext;              // 兼容路径：仍是快照
  ```

- **MainAgent** 注入供应器（`MainAgent:894` 附近）：

  ```java
  registry.setPermissionContextSupplier(() -> new PermissionContext(
          permissionStore.getMode(sessionId),
          permissionStore.getRules(sessionId),
          skillRiskResolver));
  ```
  并保留原先的 `setPermissionContext(...)` 作为**非实时**兼容路径（`PermissionStore` 未装配时）。
  - **读库频率**：写工具调用 +1 次 `agent_sessions.metadata` 读（写操作本身远重于一次 metadata 查询）。若担心压力，可加**请求内 1s TTL** 小缓存（`AtomicLong lastReadAt`）——默认**不加**，先用最简单的"每次读"。
  - **fail-safe（硬要求）**：读取异常/为空**不得**回落到放行，必须回落到**最保守**（`MANUAL` + 空规则）——即"坏了就更严"，不是"坏了就放行"。
  - **向后兼容**：`permissionContextSupplier == null` ⇒ 走老路径（快照）；`ctx == null` ⇒ 退化为改造前（每次都问）。两条都要有护栏断言。

#### 改动 B：非模态（修根因①）—— ✅ **已裁定不做（2026-10-10）**

- 用户裁定：**保持现在的全屏遮罩**，不做非模态（理由："这样不容易出问题"）。
- 因此：chip 在弹窗期间**仍然点不到** —— 这是**接受的设计**，因为脱身入口已经放进弹窗内（改动 C）。
- 保留的最低要求：弹窗上要清楚显示"**Agent 正在等待你的确认**"（让用户知道 Agent 卡在这里），且**不用倒计时做任何自动决定**（见改动 D / 待裁定 D10）。

#### 改动 C：弹窗内的"脱身"入口（修根因②）

弹窗按钮区改为（从左到右，危险度递增；文案待定）：

| 按钮 | 行为 | 作用域 | 备注 |
|---|---|---|---|
| 拒绝 | 维持现状 | — | 已有 |
| **本目录内不再询问** | 写规则 `dir`（该仓库该目录含子目录；⚠️ 现状匹配**不校验工具名** ⇒ 实际是该目录内**所有写工具**（除绝对保护），见 §1.3-6 / 待裁定 D9） | 本会话 | 最贴合"整理目录"；**自本方案起标准模式也可用**（见待裁定 D2） |
| **切到自动模式并继续** | `POST /permission/mode {auto}` | 本会话 | 一步到底；**弹窗内不提供"全部允许"** |
| 仅批准这一次 | 维持现状 | — | 已有 |

- 作用域下拉在**标准模式**下也要显示（当前只在自动档显示）——这是"允许在标准模式产生规则"的前端一半；服务端一半见 D2。
- ⛔ **不做任何"按次数"的机制**（用户 2026-10-10 裁定："连续同意三次后续不再确认"是**错误的机制**，务必去掉）：
  - 原方案里那条"同一个请求内第 3 次确认时给建议提示条"**已删除**（它容易被误读成"三次之后就不问了"，本质是诱导放权）；
  - 本方案**不引入任何"次数触发"的行为**——不按次数自动放行、不按次数降级提问、也不按次数弹提示；
  - **现状核对结论**：代码里**本来也不存在**这个机制（详见 §5 D12 的取证）。
- **权限提升要被记录**：切档/新增规则都已有日志（`[Permission][MODE]` / `[Permission][RULES]`），需在工具卡片上保留"批准来源"标注（手动 / 规则(目录) / 自动档）。

#### 改动 D：等待与超时（修根因③的副作用）—— 语义按 2026-10-10 裁定**重写**

**裁定：不得用超时/倒计时自动批准或自动否决**（用户可能很久才回答，或**故意不答**——例如离开有网络的地方，等回来再继续）。因此：

1. **超时不再做决定**：把 `agent.tool-loop.confirm-timeout` 的语义从"到点判失败"改为"**等待上限；0 = 无限等待**"，默认取**很长/无限**（待定，见 D10）。到点**不做任何批准/否决**，只记录日志并继续等（或按 D10 选的挂起模型处理）。
2. **待确认必须"可恢复"（现状缺口，必修）**：现在前端只有一个内存里的 `pendingConfirm`，`confirm` 事件是**一次性 SSE 推送**；服务端**只有 `POST /agent/confirm`，没有任何"查询待确认"的接口** ⇒ **页面重载/断网重连后，用户看不到那个待确认弹窗**（`agent/index.html` 无 EventSource/重连逻辑，流是 XHR）。
   ⇒ 需要补：**`GET /agent/confirm/pending?sessionId=`**（返回该会话所有 `PENDING` 的确认：token / 工具名 / 参数摘要 / 创建时间；审计表里本来就有这些行）+ **前端进入会话/重连时拉取并重新弹窗**。
3. **两处等待实现必须同步改**（否则同类不一致）：`tool/AuditWriteConfirmGate.waitForApproval`（工具门，主路径）与 `controller/AgentController.waitForConfirmation`（`/agent/execute` 旧路径）**都是"轮询到点 → 返回 false（= 否决）"**。
4. **"故意不回答"的收场**：保留「拒绝」按钮；并建议加一个**「终止本轮」**入口（用户回来后明确表示不要了、且不想继续往下跑）。**不要**用"客户端断线"当成否决（那会破坏"离开网络再回来"的场景）。
5. **"占线程"的代价（已核实，见 D10）**：`POST /agent/stream` 返回 **`SseEmitter`**，Agent 循环跑在 **`AgentController:122` 的 `Executors.newCachedThreadPool()`（无界缓存线程池）**上 ⇒ 无限等待**不会**耗尽 Tomcat 的请求线程，占的是**一个缓存池线程**；无界池不会堵死别人，但**每个被放弃的待确认 = 一个永久线程 + 一份驻留上下文** ⇒ 风险是**慢速泄漏**，需 **全局挂起上限 + WARN**（超限时对**新**写操作返回"请先处理待确认"，这不属于"自动决定"）。
6. **结果可见性（离开网络再回来的关键）**：批准是**独立请求**（`POST /agent/confirm`），它只把审计行改成 `APPROVED` ⇒ 唤醒**旧线程**继续跑；但旧线程的输出去向是**已断开的 SseEmitter** ⇒ **用户可能看不到续跑结果**。因此必须保证**结果落进会话历史**（`ConversationHistoryService.saveExchange` 在 `/stream` 路径已有调用点：`AgentController:1629/1651/1751`），用户重进会话能回看。

### 3.3 服务端改动点（预计）

| 文件 | 改动 |
|---|---|
| `agent/tool/ToolRegistry.java` | 新增 `permissionContextSupplier`（`Supplier<PermissionContext>`）+ setter；`execute()` 优先取供应器；保留快照兼容路径 |
| `agent/orchestrator/MainAgent.java` | 注入供应器（每次读 `PermissionStore`）；fail-safe 回落保守；日志补 `live=true` |
| `agent/permission/PermissionPolicy.java` | **仅当 D2 通过**：规则门由 `m == AUTO` 放开为 `m == AUTO \|\| m == MANUAL`（绝对保护、计划档顺序不变） |
| `agent/permission/PermissionStore.java` | 无需改（读写已够用）；可选：加 1s 读缓存 |
| `agent/tool/AuditWriteConfirmGate.java` | **仅当 D5 选"可延长/可挂起"**：等待窗口可续；否则只补倒计时所需信息（`timeoutSeconds` 已在 SSE 事件里带上即可） |
| `agent/controller/AgentController.java` | SSE `confirm` 事件**加字段**（向后兼容）：`timeoutSeconds`（等待提示用，**不用它做任何自动决定**）；**新增 `GET /confirm/pending`**（D11 待确认恢复） |

### 3.4 前端改动点（预计，`WebRoot/web/agent/index.html`）

1. 弹窗保持**全屏模态**（D3 裁定）；`#confirmModal` 上清楚显示"**Agent 正在等待你的确认**"（**不显示倒计时做自动决定**）。
2. 弹窗内容：**模式快捷项**（切到自动模式并继续，待定 D4）、**作用域下拉**（按工具授权 D9；**标准模式也显示**，D2）。⛔ **不加"按次数"的提示条**（D12）。
3. `resolveConfirm` 扩展动作类型（`approve` / `reject` / `approve+rule` / `switchMode+approve`）。
4. `pendingConfirm` → **队列**（`pendingConfirms[]`，逐条展示），并处理"token 已过期/已被处理"的答复。
5. **进入会话/重连时拉取待确认**（`GET /confirm/pending`，D11）→ 重新弹窗，保证"离开网络再回来"能看到要批准什么。
6. 工具条：等待期间在 chip 旁显示"⏳ 等待确认"，让"Agent 卡住了"这件事可见。

### 3.5 安全边界（不变量）

- **绝对保护**（`delete_repos` + 管理员追加名单 `agent_absolute_guarded_extra`）：4 档全问、规则不可豁免、**弹窗内也不提供"绕过"按钮**。
- **作用域只到本会话**（2026-09-23 裁定）：`agent_sessions.metadata`，删会话即失效；**不落 `agent_config`、不新增表**。
- **不引入沉默放行**：任何跳过确认的路径都必须源于**用户的一次显式点击**（切档 / 记住授权），并留下审计与"批准来源"标注。
- **弹窗内不提供「全部允许」**：该档风险最高，只在 chip 菜单里显式选择。
- **fail-safe 方向**：任何读取失败/异常一律**更严**（保守回落），绝不更松。
- ⚠️ **"记住授权"的代价必须知情**：规则一旦命中即**覆盖硬清单**（含该作用域内的**删除**与**权限变更**）——这是 2026-09-23 裁定 #4 的既有语义。本方案若让标准模式也能产生规则（D2），等于把这条语义**延伸到标准模式**。业界反例可查：**CVE-2025-54136（Cursor）** 就是"已记住的 MCP 定义被静默替换"（详见 §2.5）。
- ⚠️ **回滚能力的真实边界（不要产生"放行了也没事"的错觉）**：我们已有的回滚只覆盖**文件内容与删除**（仓库历史版本、回收站、Office 文档历史）；**不覆盖** `run_skill` 执行的外部脚本副作用、`create_doc_share` 一类权限变更、新建/改名目录，以及仓库之外的任何副作用。因此本方案**不得**以"可回滚"为由放宽任何判定（这也呼应 §2.6 结论 3：业界的配套是隔离+回滚，不是简单放行）。

### 3.6 另一条正道（批量任务"一次批准"）：计划先行（P2，可选）

"整理目录"这类**批**任务，业界更偏好的解法不是"逐个弹窗"，而是**先出计划、一次批准、之后自动执行**——本项目**已经有**这套闭环（`plan` 档 → 写操作 DENY → 模型输出计划 → 「批准并执行」切 `auto`）。

可选增强（P2）：在**标准模式**下，若模型判断本轮需要**大量同类写操作**，也先给一份计划并要求一次批准（现在 `planMode` 标记只在 `plan` 档产生，需要服务端在 manual 档也能标记）。

**本轮建议不做**（见待裁定 D6）：因为做完 D1~D4，"本目录内不再询问"一次点击就已经解决"整理目录"，而计划先行需要改服务端标记 + 提示词，收益重叠、风险更高。

---

## 4. 影响面

| 面 | 影响 |
|---|---|
| 判定语义 | **不变**（只改"何时读模式/规则"，不改优先级与名单）。**例外（已裁定）**：① D2 ⇒ 标准模式下规则开始生效；② **D8 ⇒ `move_doc`/`rename_doc` 由 `DESTRUCTIVE` 降为 `NORMAL`（自动档不再问移动/改名）** |
| 既有护栏 | `TestWriteConfirmGateCoverage`（按模式断言弹窗）需按新路径改写；`TestPermissionPolicy` 补"标准模式 + 规则"矩阵，并**按 D8 改**"自动档 + `move_doc`/`rename_doc` → ALLOW"（原断言是 ASK）；新增 `TestPermissionLiveContext`（同一 registry 重设上下文后**下一次调用**即生效）、"规则按工具匹配"断言（D9） |
| 性能 | 每写工具调用 +1 次会话 metadata 读（可选 TTL 1s） |
| 兼容 | `PermissionContext` 快照路径、`ctx == null` 路径行为**完全不变**（非 SSE/旧路径、单测） |
| 前端 | 只动 `WebRoot/web/agent/index.html`（无编译、junction 生效、硬刷新）；后端需带 `-g` 重编译 + 重启 dev Tomcat |
| 审计 | 切档/新增规则已有日志；建议补"批准来源"在工具卡片上的展示（已有字段） |

---

## 5. 待裁定（请逐条给结论）

| # | 问题 | 推荐 | 理由 / 代价 |
|---|---|---|---|
| **D1** | 是否做"模式/规则在**当前请求内实时生效**"（改动 A） | ✅ **已裁定（2026-10-10，用户）：做** —— `ToolRegistry` 增可选"上下文供应器"（每次工具调用取最新），`null` 时保持快照路径（旧行为一字不变）；读失败**保守回落** | 不做则"弹窗内切档/记住授权"**当场无效**，D2 在最需要的场景（一次请求内几十次移动）等于没用（根因④）。代价：每次写工具调用多一次 metadata 读（可加 1s TTL）；需新增护栏。**先例**：Claude Code 官方"改权限自同一回合的下一个 tool call 生效" |
| **D2** | **标准模式**是否允许产生并生效"记住授权"规则（放宽 2026-09-23 裁定 #8） | ✅ **已裁定（2026-10-10，用户）：保留** —— 标准模式**也允许**产生/生效"记住授权"规则（**仅本会话**） | ⚠️ **这条不是锦上添花**：见 §1.4 —— `move_doc`/`rename_doc` 属硬清单，**自动档也会问**，所以对"整理目录"场景，**作用域规则是唯一温和的解法**（否则只剩"全部允许"或逐个点）。参考：**Claude Code 在 Manual 档下也提供 `Yes, and don't ask again`**（调研 §D），我们当前比它更严。代价：① 标准模式"每次都要确认"的语义被打破（**用户已知情并同意**）；② 规则匹配不看工具名的连带问题 → **由 D9 解决** |
| **D3** | 弹窗是否由「全屏模态」改为「非阻断（可点 chip）」 | ⛔ **已裁定（2026-10-10，用户）：不做，保持现在的全屏遮罩** | 用户理由："这样不容易出问题"；既然脱身入口放进弹窗（D2/D4），chip 在弹窗期间点不到**不再是问题** ⇒ 根因① 转为**经裁定的设计选择**（不是缺陷）。代价：非弹窗态的可用性没有改善 |
| **D4** | 弹窗内是否提供「切到自动模式并继续」 | ✅ **已裁定（2026-10-10，用户）：提供**，且**不含**"全部允许" | 一步脱身，且有明确先例：Claude Code 的 `Yes, and switch to auto mode`（限 Bash + auto 可用）、Copilot 的 `Enable Auto Approve…`（§2.4 模式 1）。⚠️ 硬清单（删除/移动/改名/权限变更）在自动档**仍会问** ⇒ 必须与 D2 配套使用（§1.4）；弹窗内**不提供** allowAll（避免误点放大权限） |
| **D8** | 是否**调整风险分级**：把 `move_doc`/`rename_doc` 从硬清单降为常规写（对齐 Claude Code `acceptEdits` 的 `mv`/`cp`） | ✅ **已裁定（2026-10-10，用户）：降级** —— **仅** `move_doc` / `rename_doc` 降为 `NORMAL`；`delete_doc` / `update_repos` / `create_doc_share` **保持硬清单** | 效果：**自动档不再对移动/改名弹窗**（标准档仍问）；整理目录因此即使不靠规则也不被打断。**已知代价（用户知情）**：① 自动档会**静默移动/改名大量文件**；② 移动/改名可能**破坏外部引用**（分享链接、历史、他人书签）。**护栏必须同步**：`TestPermissionPolicy` 里"自动档 + `move_doc` → ASK"的断言要改成 ALLOW |
| **D9** | `DIR`/`REPO` 规则匹配是否改为**也校验工具名**（并修正弹窗文案） | ✅ **已裁定（2026-10-10，用户）：改为按工具授权** —— `DIR`/`REPO` 匹配**同时校验 `tool`**；并**新增一个显式标注的「该目录内所有写操作不再询问」选项**给想一次批完的用户 | 现状"本目录内不再询问"会连带放行该目录内的**删除**（§1.3-6），与弹窗文案"以后这类操作"不符。收窄后语义与用户理解一致；想"一次授权批完整理目录"的用户显式选那个更宽的选项（诚实标注），而不是被默默放大 |
| **D5** | 超时（默认 120s，超时判失败）是否改 | ✅ **已裁定（2026-10-10，用户）：不得自动批准、也不得自动否决** —— 用户可能很久才回答或**故意不答**（如离开有网络的地方，回来再继续）⇒ 改为"长时间/无限等待 + 待确认可恢复"（改动 D） | 我原推荐（倒计时 + 超时判失败）**已被推翻**。新方案要求补 **待确认查询接口 + 断线恢复**（现状缺口，见 §1.3-7），并解决**占请求线程**的问题（D10） |
| **D6** | 是否做"计划先行（标准模式下批量任务先出计划、一次批准）"（§3.6） | ✅ **已裁定（2026-10-10，用户）：本轮不做**，记入 P2 备选 | D1/D2 已解决"脱身"；计划先行改动大（服务端 `planMode` 标记 + 提示词），且与 D2 收益重叠 |
| **D7** | 是否顺手修 §1.3 的几处（`pendingConfirm` 队列化、过期提示），以及把旧 V5 结论按实测修回 `Agent权限模式改造计划.md` | ✅ **已裁定（2026-10-10，用户）：全做** —— ① `pendingConfirm` 队列化；② "token 已过期/已被处理"提示；③ 旧 V5 结论按实测修回前序文档；④ chip 上"自动模式"的说明按 D8 后的真实行为修正 | 队列化是多标签页并发下的真实缺陷；旧 V5 结论与事实不符，留着会让后续会话误判 |
| **D10** | 无限等待的**挂起模型** | ✅ **已裁定（2026-10-10，用户）：A+** —— 等待上限默认**无限**（不做任何自动决定）+ **全局挂起上限保护**（超限时对**新**写操作返回"请先处理待确认"，这属限并发而非替用户决定）+ 待确认可恢复（D11）+ **保证结果落进会话历史**（断开后重进会话能回看续跑结果）。**B（不占线程的挂起）不做**，留作后续专项 | A+ 便宜且满足"离开网络、回来再继续"。代价：占一个 **`newCachedThreadPool()` 线程**（`AgentController:122`，无界池 ⇒ 不堵别人，但每个被放弃的待确认 = 常驻线程 + 驻留上下文，属慢速泄漏，靠上限保护兜）。B 涉及 Agent 循环的挂起/恢复语义改造，风险与工作量都大 |
| **D11** | 是否补"**待确认可恢复**"能力（`GET /agent/confirm/pending` + 前端进入会话/重连时重新弹窗） | ✅ **已裁定（2026-10-10，用户）：必修**（已并入 D10 的 A+ 方案） | 否则"离开网络再回来"这个场景根本不成立：弹窗不再出现、Agent 一直空等。现状：只有 `POST /agent/confirm`，前端 `pendingConfirm` 仅在内存；审计表里本就有 `PENDING` 行可直接用于查询 |
| **D12** | 是否存在并要移除"**连续同意 N 次后续不再确认**"的机制 | ✅ **已裁定（2026-10-10，用户）：这是错误机制，务必去掉** | ⚠️ **取证结论：代码里本来不存在这个机制**（穷举检索 `src/com/DocSystem/agent/**`、`WebRoot/web/agent/index.html`、`devDocs/**`：无 `approveCount`/`consecutiveApproval`/`autoApprove`/`alwaysAllow`/`批准全部` 之类；`AuditLogService` 的接口只有 `approve/reject/record/getPendingEntry/getStatusByConfirmToken`）。**唯一与"3 次"相关的**是 `ToolUseLoop` 的**防死循环**护栏（`MAX_IDENTICAL_CALLS=3` 连续相同工具调用→注入"换思路"提示；`MAX_MALFORMED=3` 连续畸形调用→终止）——**与用户批准无关，不要动**。<br>用户记忆的可能来源：① 前序方案 §4 验收 V5 的文字"同目录 `write_file`/`move_doc`/`delete_doc` 各 **≥3 次**均不再弹"（**是验收场景描述，且已判定存疑**，见 §1.3-1）；② **本方案原稿里那条"第 3 次确认时给建议提示条"**（最像，"3 次"重合）；③ 业界产品（Roo `allowedMaxRequests` 默认 Unlimited、Cline 曾默认 20 次后于 2025-10 移除）。<br>**执行**：① 本方案已删除"第 3 次提示条"，并**不引入任何按次数的行为**；② 遗留待确认：前序文档 V5 那段文字要在实施阶段按实测修正（§1.3-1 / V7） |

---

## 6. 验收（逐条给证据）

| # | 验收项 | 证据形式 |
|---|---|---|
| V1 | **标准模式下"整理目录"脱身（同一请求内）**：连续 ≥4 次同类写操作（如 `move_doc`）→ 第 1 次弹窗内点「本目录内不再询问」→ **后续 0 弹窗**，且全部成功 | 页面 E2E（数弹窗次数）+ 日志 `[Permission] mode=manual ... decision=ALLOW reason=rule(dir)` |
| V2 | **运行中切档当场生效**：标准模式下弹窗内点「切到自动模式并继续」→ **本轮剩余的常规写操作与移动/改名立即不再弹**（无需等下一次请求）；**删除/权限变更仍会弹**（D8 后仍是硬清单） | 页面 E2E + 日志（下一次工具调用即 `mode=auto`） |
| V3 | **弹窗期间 chip 点不到 = 预期**（D3 裁定）：确认弹窗上必须清楚显示"Agent 正在等待你的确认"，且**弹窗内**的脱身入口可用（切档 / 记住授权） | 页面 E2E（断言弹窗存在时的等待提示文案 + 弹窗内两个入口可点并生效） |
| V4 | **绝对保护不受影响**：`delete_repos` 在 标准/自动/全部允许/规则命中 下**都弹** | 护栏判定矩阵 + 页面 E2E |
| V5 | **授权只到本会话**：新会话回到标准模式且规则为空 | 护栏（存储断言）+ 页面 E2E |
| V6 | **回归**：`permissionContextSupplier==null`（快照）与 `ctx==null`（改造前）两条路径行为不变；护栏全绿（含改写后的 `TestWriteConfirmGateCoverage`） | `run_guards.ps1` 输出（不低于当前基线） |
| V7 | **旧 V5 结论复核**：实测"自动档记住授权后同目录是否不再弹"，并按实测结果修正 `Agent权限模式改造计划.md` | 页面 E2E + 文档 diff |
| V8 | **永不自动决定**：等待超时**不**自动批准也不自动否决（把等待上限配成很短做实验：到点后仍为 PENDING、弹窗仍在、最终批准仍可成功执行） | 页面 E2E + 日志（无 TIMEOUT 否决记录）+ 审计行仍 PENDING |
| V9 | **断线/重载后待确认可恢复**（D11）：弹窗出现时**刷新页面**或断开网络再恢复 → 该待确认**重新出现在页面上**，点批准后操作照常执行 | 页面 E2E + `GET /agent/confirm/pending` 返回该 token |
| V10 | **拒绝/终止仍可用**：弹窗里「拒绝」照常生效（该操作不执行，Agent 收到拒绝结果）；「终止本轮」若做，能结束等待 | 页面 E2E |

---

## 7. 分期

- **P1（必做）**：改动 A（实时生效，D1）+ 改动 C（弹窗内脱身入口：记住授权按工具授权 D9 + 标准模式也可用 D2 + 待定 D4）+ **改动 D（等待语义：超时不自动决定 D5 + 两处等待实现同步 + 待确认可恢复 D11 + 全局并发上限保护 + 结果落会话历史）** + 前端 `pendingConfirm` 队列化（D7）+ 护栏（新增 `TestPermissionLiveContext`、改写 `TestWriteConfirmGateCoverage`、补 `TestPermissionPolicy` 矩阵、新增"规则按工具匹配"断言）+ 验收 V1~V10。
- **P2（可选/后续）**：计划先行（D6）、**"不占线程的挂起"异步化（D10 选项 B）**、按模式的统计/审计看板。
- ⛔ **已裁定不做**：非模态审批条（D3）、任何"按次数"的行为（D12）。

---

## 8. 明确不做（Non-goals）

1. **不做**任何形式的"沉默放行"（Agent 不得在无人点击的情况下扩大权限），**也不做任何"自动决定"**——超时/倒计时既不能自动批准、也不能自动否决（2026-10-10 裁定）。
2. **不做**非模态审批条/横幅（D3 裁定：保持现在的全屏遮罩）。
3. **不做**跨会话 / 全局 / 工作区级持久化授权（要做得先重新裁定——现裁定是"只到本会话"；业界主流也是会话级，VS Code 官方推荐会话级正是为了"限制提权时长"）。
4. **不做**在确认弹窗里提供「全部允许」档（避免误点放大权限；业界先例也只给"切到自动/本会话放行"）。
5. **不做**"客户端断线即视为否决"——那会破坏"离开网络、回来再继续"的场景（D5 裁定）。
6. **不做** LLM 判定是否危险（沿用前序结论；业界一律声明其"不是安全边界"）。
7. **不做**任何"**按次数**"的机制（⛔ **D12 裁定：用户明确指出"连续同意三次后续不再确认"是错误机制，务必去掉**）——
   本方案**不引入**按次数自动放行/按次数降级提问/按次数弹提示；原稿里那条"第 3 次确认时给建议提示条"**已删除**。
   调研中**也未找到任何"每 N 次弹一次"的一手实现**（Roo 的 `allowedMaxRequests` 是反向的、默认 Unlimited；Cline 曾默认 20 次，已于 2025-10 因"多一层复杂度=坏设计"移除，§2.4 模式 7/11）。
   ⚠️ **现状核对**：代码里**本来就不存在**这种机制（取证见 §5 D12）；唯一与"3 次"有关的是 `ToolUseLoop` 的**防死循环护栏**（`MAX_IDENTICAL_CALLS` / `MAX_MALFORMED`），**与本裁定无关、不得改动**。
8. **不做**"**批 N 个操作合并批准**"——架构上同一请求内工具**串行**执行，同时只有 1 个 pending，"批"没有对象（§2.4 模式 6）；等效需求用作用域规则（"本目录内不再询问"）解决。
9. **不重开**"管理员禁用全部允许档"（2026-09-23 经用户裁定移除，理由：用途不大；重启属重新裁定）。
10. **不做**沙箱 / checkpoint 机制（与本任务正交；我们已有仓库历史版本/回收站，覆盖边界已在 §3.5 写明）。
11. **不改**绝对保护名单语义、**不改**判定优先级顺序、**不改** `delete_repos` 的任何行为。

---

## 9. 裁定汇总 + 开工清单（2026-10-10 用户逐条裁定完毕）

### 9.1 裁定汇总

| # | 议题 | 裁定 |
|---|---|---|
| D1 | 模式/规则**当前请求内实时生效** | ✅ 做 |
| D2 | **标准模式**也允许"记住授权"（仅本会话） | ✅ 保留 |
| D3 | 弹窗改非模态（chip 可点） | ❌ 不做，**保持全屏遮罩** |
| D4 | 弹窗内提供「切到自动模式并继续」 | ✅ 提供（**不含**"全部允许"） |
| D5 | 超时自动批准/否决 | ❌ 都**不允许**（不代用户决定） |
| D6 | "计划先行"（标准档批量任务先出计划） | ⏸ 本轮不做（P2 备选） |
| D7 | 顺手修 `pendingConfirm` 队列/过期提示/旧 V5 结论/chip 文案 | ✅ 全做 |
| D8 | 风险分级：`move_doc`/`rename_doc` 降为常规写 | ✅ **降级**（`delete_doc`/`update_repos`/`create_doc_share` 仍硬清单） |
| D9 | `DIR`/`REPO` 规则按工具授权 + 新增显式"该目录内所有写操作"选项 | ✅ 做 |
| D10 | 无限等待的挂起模型 | ✅ **A+**（默认无限 + 上限保护 + 结果落会话历史）；B 留后续 |
| D11 | 待确认可恢复（查询接口 + 重连重新弹窗） | ✅ 必修 |
| D12 | "连续三次后不再确认" | ✅ **代码无需改动（现状不存在，已取证）**；原则立为硬约束 |

### 9.2 开工清单（按实施顺序）

**A. 服务端（`src/com/DocSystem/agent/**`）**

| # | 文件 | 改动 | 依据 |
|---|---|---|---|
| A1 | `permission/ToolRiskCatalog.java` | `move_doc`/`rename_doc`：`DESTRUCTIVE` → `NORMAL` | D8 |
| A2 | `permission/PermissionPolicy.java` | 规则门 `m == AUTO` → `m == AUTO \|\| m == MANUAL` | D2 |
| A3 | `permission/PermissionRule.java` | `DIR`/`REPO` 匹配**加 `tool` 校验**；新增 `Kind.DIR_ALL`（"该目录内所有写操作"，不校验 tool） | D9 |
| A4 | `tool/ToolRegistry.java` | 新增 `permissionContextSupplier`（`Supplier<PermissionContext>`）+ setter；`execute()` 优先取供应器，`null` → 现有快照字段；**供应器异常 → 保守回落（MANUAL + 空规则）** | D1 |
| A5 | `orchestrator/MainAgent.java` | 装配供应器（每次读 `PermissionStore.getMode/getRules`）；日志补 `live=1`；`PermissionStore` 未装配 → 保持快照 | D1 |
| A6 | `tool/AuditWriteConfirmGate.java` + `controller/AgentController.waitForConfirmation` | 超时语义：等待上限（`0`/负 = 无限），**到点不做任何决定**；补**全局挂起上限 + WARN**，超限时对**新**写操作返回"请先处理待确认" | D5 / D10 |
| A7 | `controller/AuditLogService.java`（+ repository） | 新增"按 sessionId 查 `PENDING`" | D11 |
| A8 | `controller/AgentController.java` | 新增 `GET /agent/confirm/pending?sessionId=`；SSE `confirm` 事件加 `timeoutSeconds`（**仅展示用**） | D11 / D5 |
| A9 | 配置 | `agent.tool-loop.confirm-timeout` 语义改"等待上限，0=无限"（建议默认 0）；**`@Value` 启动期读取 ⇒ 需重启**；登记进 `devDocs/参数存储策略与参数清单.md` | D5 |
| A10 | 结果落库 | 保证 `/stream` 在**客户端断开/写流失败**时仍 `saveExchange`（用户重进会话能看到续跑结果） | D10 |

**B. 前端（`WebRoot/web/agent/index.html`）**

| # | 改动 | 依据 |
|---|---|---|
| B1 | 弹窗保留**全屏遮罩**；文案明确"**Agent 正在等待你的确认**"；**不做倒计时自动决定** | D3 / D5 |
| B2 | 作用域下拉**标准档也显示**；选项按 D9：`该工具` / `该目录内该工具` / `该目录内所有写操作` / `该仓库内该工具` | D2 / D9 |
| B3 | 新增「**切到自动模式并继续**」（`POST /agent/permission/mode {auto}` + 批准当前操作）；**不提供"全部允许"** | D4 |
| B4 | `resolveConfirm` 支持 `switchMode+approve`；"token 已过期/已被处理"给明确提示 | D4 / D7-② |
| B5 | `pendingConfirm` → **队列** `pendingConfirms[]`（逐条展示） | D7-① |
| B6 | 进入会话/重连时 `GET /agent/confirm/pending` → 重新弹出未决确认 | D11 |
| B7 | chip 里"自动模式"的说明按 D8 后的真实行为修正 | D7-④ |

**C. 护栏与文档**

| # | 项 | 依据 |
|---|---|---|
| C1 | `TestPermissionPolicy`：按 D8 改（自动档 + `move_doc`/`rename_doc` → **ALLOW**；`delete_doc`/`update_repos`/`create_doc_share` → ASK）+ 补"标准档 + 规则 → ALLOW"（D2）+ 绝对保护 4 档全 ASK 不变 | D8 / D2 |
| C2 | `TestPermissionRules`：按 D9 改（`DIR` 只对同工具命中；`DIR_ALL` 对所有写工具命中；`REPO` 同理） | D9 |
| C3 | **新增** `TestPermissionLiveContext`：同一 registry 重设上下文后**下一次调用**即生效；供应器为空 → 快照行为不变；供应器抛异常 → 保守回落 | D1 |
| C4 | 改写 `TestWriteConfirmGateCoverage`（按模式 + 降级后的分类断言）、`TestWriteTools` 等对 `move_doc` 的确认断言 | D8 |
| C5 | `devDocs/Agent权限模式改造计划.md`：§3.2 风险归类同步（move/rename 不再属破坏性）、**§4 的 V5 结论按实测修正** | D7-③ |
| C6 | `devDocs/参数存储策略与参数清单.md`：登记 `agent.tool-loop.confirm-timeout` 的语义变化 | A9 |

**D. 验收**：V1~V10（§6）逐条给证据；其中 **V2 已按 D8 调整**（切到自动档后"常规写 + 移动/改名"不再弹，删除/权限变更仍弹）。

---

## 10. 实施记录（2026-10-10）

### 10.1 改动清单

**服务端（`src/com/DocSystem/agent/**`，主仓库）**

| 文件 | 改动 |
|---|---|
| `permission/ToolRiskCatalog.java` | `move_doc`/`rename_doc`：`DESTRUCTIVE` → `NORMAL`（D8，含代价注释） |
| `permission/PermissionPolicy.java` | 规则门 `m == AUTO` → `m == AUTO \|\| m == MANUAL`（D2）+ 类 javadoc 更新 |
| `permission/PermissionRule.java` | ① `Kind.DIR_ALL("dirAll")`；② `DIR`/`REPO` **校验工具名**（fail-safe）；③ ★ **目录来源改为 `path`/`srcPath`/`dstPath` 任一命中**（`DIR_ARGS` + `callDirs`，见 10.2-①） |
| `permission/PermissionMode.java` / `permission/ToolRisk.java` | 档位说明与风险归类 javadoc / `AUTO.description` 按 D8/D2 修正（`/agent/permission` 的 `description` 也是对外契约） |
| `tool/ToolRegistry.java` | `permissionContextSupplier`（`Supplier<PermissionContext>`）+ 保守回落 `CONSERVATIVE_CONTEXT`；`ConfirmGateBusyException` 原样回传 |
| `tool/ConfirmGateBusyException.java`（新） | 确认门"忙"信号 |
| `tool/AuditWriteConfirmGate.java` | 静态挂起上限（默认 8）+ `tryAcquire/releasePendingSlot`；**等待语义重写**：`timeoutSeconds<=0` = 无限等待、到点**不做任何决定**（只 WARN 一次并继续等）；仅"无确认通道（NOOP）"退回 120s 有限等待并判未批准 |
| `orchestrator/MainAgent.java` | `agent.tool-loop.confirm-timeout` 默认 **120 → 0（无限）**；新增 `agent.tool-loop.max-pending-confirms:8`；装配**实时供应器**（每次工具调用重读模式/规则）+ `live=1` 日志 |
| `controller/AgentController.java` | `GET /agent/confirm/pending`（D11，**见 10.2-③④**）；`waitForConfirmation` 重写为"不做决定"并修掉旧缺陷（原来把"已批准"当拒绝）；操作级确认复用挂起上限；A10：`/stream` 的 `done` **先落库再推送**、流式路径裸 `emitter.send` → 吞异常 `sendSse`；★ confirm 事件新增 `dirs`（10.2-②）；`dirArrayJson`/`dirArgLabel` 辅助 + `escapeJson` 改 static |
| `controller/AuditLogService.java`、`repository/AuditLogRepository.java`、`src/mapper/AuditLogRepositoryMapper.xml` | `findPendingBySessionId`（`status='PENDING'` 按 `created_at ASC` + LIMIT）；**XML 已同步复制到 `WebRoot/WEB-INF/classes/mapper/`**（运行时加载处） |

**前端（`WebRoot/web/agent/index.html`，唯一落点）**

- 弹窗保留**全屏遮罩**；新增等待提示 `#confirmWaitHint`（"⏳ Agent 正在等待你的确认（可以稍后回来再处理；不答复就不会继续）"）与按钮 `#confirmAutoModeBtn`（「切到自动模式并继续」，D4；**不提供"全部允许"**）。
- `pendingConfirm` 单槽 → **队列**（`pendingConfirms`/`currentConfirm`/`enqueueConfirm`/`showNextConfirm`/`resetPendingConfirms`，D7①）。
- 作用域选项（D9，**标准档也显示**）：`tool` / `dir:<i>` / `dirAll:<i>` / `repo`，目录来自 `collectConfirmDirs(extra)`（`extra.dirs` 优先，回退单个 `path`），标签区分「源目录/目标目录/目录」。
- 恢复（D11）：`loadPendingConfirms(force)`（5s 节流）+ `buildRecoveredConfirmMessage` + `parseParamsForScope`（**按 JSON 解析**，见 10.2-⑤）；`visibilitychange` 补拉；`enterApp`/会话切换/新建会话三处接入；chip 的 `auto` 说明按 D8 修正（D7④）。
- `resolveConfirm` 支持 `switchMode+approve`（`confirmSwitchAutoAndApprove`）；"token 已失效/已被处理"明确提示（D7②）；★ **先落规则再批准**（10.2-⑥）。

**护栏与文档**：`TestPermissionPolicy`（92）｜`TestPermissionRules`（25，含 srcPath/dstPath 命中矩阵）｜`TestWriteConfirmGateCoverage`（56，含 **V8 实测**、D9 目录链路 lint）｜`TestPermissionLiveContext`（15，D1）｜`Agent权限模式改造计划.md` §3.2/§4 修正｜`参数存储策略与参数清单.md` §2.1-E 登记两个新参数。

### 10.2 验证期间新发现并修掉的问题（均属"不做就达不到验收"）

1. ★ **目录级授权对移动/复制原本完全无效**：`move_doc`/`copy_doc` 的目录参数是 `srcPath`/`dstPath`（**没有 `path`**），而规则匹配只看 `path` ⇒ 弹窗给不出目录选项、规则也永远不可能命中——**"整理目录"的脱身入口形同虚设**。修：`PermissionRule.DIR_ARGS={path,srcPath,dstPath}` + `callDirs()`（任一落在授权目录内即命中；都没带目录参数 → 不命中，fail-safe）。⚠️ 语义是"该目录**参与**了本次调用"（源/目标命中都算），不是"必须以它为源"——已在代码与护栏里写明。
2. **实况 SSE 事件丢了 `dirs`**：前端 `event.type==='confirm'` 分发只透传 `{operation,vid,path,risk}`，`dirs` 被丢掉 ⇒ 实况弹窗对移动/改名同样没有目录选项。修：分发处补 `dirs: event.dirs`（护栏加 lint 锁）。
3. **`GET /confirm/pending` 查不到**：审计里的 `session_id` 是 **HTTP 会话 id**（`MainAgent` 用 `context.getSessionId()`，即 jsessionid），而前端传的是**对话会话 id** ⇒ 只查前者永远为空。修：两者都查、按 token 去重（`collectPending` + `currentHttpSessionId`）。
4. **恢复出来的弹窗不知道风险类别** ⇒ 绝对保护（`delete_repos`）也会显示"不再询问"入口。修：pending 接口返回 `risk`（`ToolRiskCatalog.registered`），前端 `extra.risk` 透传；实测 `delete_repos` 无任何放宽入口、无"切到自动模式"按钮。
5. **恢复解析格式错**：`operation_params` 落库是 **JSON**（`{"vid":"5","srcPath":"散落/"}`），前端却按 `k=v；` 解析 ⇒ 恢复后只剩"该工具"一个选项；且空串（根目录）被当"无值"丢弃。修：按 JSON 解析 + 空串保留。
6. ★ **"记住授权"与"批准"并行 ⇒ 竞态**：规则晚于"本轮下一个写操作"的判定落地时，第 2 个操作**又弹一次**（实测复现：`21:09:04 ASK` / `21:09:06 ASK`）。修：`resolveConfirm` **先 `POST /permission/rule` 再 `POST /confirm`**；复测同一场景变成 `21:15:04 ASK` / `21:15:05 ALLOW reason=rule(dir)`。
7. **页面刷新后恢复不出来**：`enterApp` 里 `loadPendingConfirms(true)` 早于 `loadSessionsFromServer()` 完成（后者才设置 `state.sessionId`）⇒ 被 `if (!sid) return` 直接跳过。修：串到 `.then()` 里，`loadPermission()` 同批。
8. **新会话沿用上一个会话的档位显示**（chip 与 D4 按钮可见性都受影响）：新建会话未重读权限。修：`newSessionBtn` 里 `loadPermission()`。

### 10.3 验收证据（V1~V10）

| # | 结果 | 证据 |
|---|---|---|
| V1 | ✅ | 真实 LLM 回合（新会话 = 标准档、0 规则）：同一轮连续 2 次 `move_doc`（同一目标目录），第 1 次弹窗内选「目标目录 + 批准并记住」→ **第 2 次 0 弹窗**；服务端日志 `21:15:04 decision=ASK reason=mode(manual)` / `21:15:05 decision=ALLOW reason=rule(dir)`；页面 MutationObserver 计数 **confirmCount=1**（同场景改造前实测为 2）。两次移动因源文件不存在而失败（`DOC_NOT_FOUND`）⇒ **测试无副作用** |
| V2 | ✅ | 同上：规则命中即被服务端实时读取（`live=1` + 供应器），无需等下一次请求；硬清单（`delete_doc`/`update_repos`/`create_doc_share`）与绝对保护仍 ASK（护栏矩阵 92 项 + pending 接口 `risk` 实测） |
| V3 | ✅ | 弹窗含等待提示 `⏳ Agent 正在等待你的确认（可以稍后回来再处理；不答复就不会继续）`；弹窗内「批准并记住 / 批准执行 / 切到自动模式并继续 / 拒绝」均可用（实测点击生效） |
| V4 | ✅ | 恢复的 `delete_repos` 确认：**无作用域下拉、无「批准并记住」、无「切到自动模式」**，只有批准/拒绝（实测 DOM：`scopeVisible:false, rememberVisible:false, autoVisible:false`）；护栏矩阵 4 档全 ASK |
| V5 | ✅ | 新会话 chip 菜单显示「本会话已授权 0 条」；规则存 `agent_sessions.metadata.permissionRules`（会话级），护栏含存取/去重/上限断言 |
| V6 | ✅ | **46 套 / 2005 项 / 0 失败**（逐套 exit=0）；`permissionContextSupplier==null`（快照）与 `ctx==null`（改造前）两条路径行为不变（`TestPermissionLiveContext` 15 项） |
| V7 | ✅ | 实测确认："自动档 + 记住授权"后同目录不再弹；`Agent权限模式改造计划.md` §4 的旧 V5 结论已按实测加"修正（2026-10-10）"条目 |
| V8 | ✅ | 护栏用假审计服务 + 1s 上限实测：1.7s 后调用**仍在等**、审计仍 `PENDING`、之后批准照样生效；日志 `still PENDING after 1s (TOKEN-V8); keep waiting — never auto approve/reject (D5)`；拒绝路径同样只由用户决定 |
| V9 | ✅ | ① HTTP：按 **jsessionid** 插入 PENDING 行 → 不带参数调用 `GET /agent/confirm/pending` 命中该行（含 `risk`）；② 浏览器：刷新页面后待确认**自动重新弹出**（移动/改名类也能看到目录选项），点「批准并记住」→ 审计 `APPROVED` + 会话规则落库（`目录 / 工具 move_doc vid=2/散落`）；③ `visibilitychange` 补拉 |
| V10 | ✅ | 恢复的 `delete_doc` 确认点「拒绝」→ 审计 `REJECTED`、弹窗关闭；真实回合点「拒绝」→ 模型收到 `ERROR: 操作被用户拒绝` 并如实汇报（`move_doc` 未执行）；对已失效 token 再点 → 「该确认已失效或已被处理」提示（D7②） |

**测试数据已清理**：E2E 伪造的审计行（`confirm_token like 'e2e-%'`）已删除；测试期间新建的 6 个对话会话已删除（`DELETE /agent/sessions/{id}`）；测试期间写入用户会话 `0b6b34b9…` 的那条 `dir/散落` 规则已还原（4 → 3 条）。测试期间**未产生任何文件/目录改动**（所有写操作要么被拒、要么因源文件不存在而失败）。

### 10.4 与 §9.2 的差异 / 未尽事项

- **A8 简化**：SSE `confirm` 事件**未加** `timeoutSeconds`（D5 不做倒计时，前端可按收到时间自行计算），改为新增 `dirs`（更有实际用途）。
- **验收 V1 用"2 次连续同类写操作"取证**（等价覆盖 D1/D2/D9；4+ 次会真的移动用户文件，故用"文件不存在"的调用做到零副作用）。§6 表格里的"≥4 次"表述保留为原始验收意图。
- **未做（保持挂起）**：`D10` 的"不占线程的挂起（选项 B）"；`D6` 计划先行（P2）；`/agent/confirm` 与 `/agent/confirm/pending` 的**会话归属校验**（现状只校验"已登录"，属**既有缺口**，未在本轮改，需用户裁定）。

---

## 11. 追加加固（2026-10-10 第二轮，用户裁定"①+②"）

第一轮收尾后用户追问"挂起项的危害"，据此**实测复现了一个授权缺口**并裁定加固：**① 确认接口的授权（4 处）+ ② 全局挂起上限互踩 / 孤儿确认的两条缓解**。本轮改动已实现并验收（详见下文与 §11.4）。

### 11.1 ① 确认接口授权缺口（实测复现 → 已修）

**实测事实（改前）**
- 全站拦截器 [`MyInterceptor.preHandle`](../../src/com/DocSystem/controller/MyInterceptor.java) 对任何带 `X-Requested-With: XMLHttpRequest` 的请求 **直接放行**（`if (isAjaxRequest(request)) return true;`）；
- `POST /agent/confirm` **自身不校验登录、也不校验 token 归属**（只 `getPendingEntry` 判存在）；
- 实测：无任何 Cookie + ajax 头 → `200 {"message":"Invalid or expired confirmToken"}`（**进入了控制器**）；不带 ajax 头 → 404（被重定向到登录）；
- `confirmToken` **明文进日志**（`AuditWriteConfirmGate` 与 `AgentController` 多处，实测在 `tomcat/logs/docsys_console.log` 可搜到），而日志在本产品内可在线查看/下载（`streamLogFile.do` 仅要求 `type>=1`）。

**危害**：拿到 token 的人**无需登录**即可"替用户批准"一条待确认，而被批准的对象可能是 `delete_repos`（绝对保护）或 `delete_doc` —— 恰是整套人类确认机制要拦的操作；反向也能"替用户拒绝"（把正常操作卡死）。另有：批准者不入审计（`"Approved by user"` 无用户名）⇒ **不可追责**。

**修法（4 处）**
1. `POST /agent/confirm` 补**登录校验**（`currentUser`）；
2. 补**归属校验** `ownedByCaller`：审计行 `session_id` == 调用者当前 jsessionid，**或** `user_id` == 调用者用户名，**或** 该 `session_id` 是调用者名下的对话会话（`agent_sessions.username`）；三条都不成立 → `FORBIDDEN`（fail-safe）；
3. `GET /agent/confirm/pending` 的**调用方传入 `sessionId` 也要校验归属**（不归属 → 忽略该参数并记 WARN），否则登录用户可拿别人的会话 id 读出别人的待确认；
4. **日志脱敏**：`confirmToken`/`jsessionid` 一律 `maskToken()`（只留前 8 位）；**审计记录批准者**（`"Approved by user: <用户名>"`）。

**实测证据（改后）**

| 场景 | 结果 |
|---|---|
| 未登录 + ajax 头 `POST /agent/confirm` | `200 {"message":"NOT_LOGGED_IN"}` ✓（改前会进控制器） |
| 登录用户批准**别人的**待确认 | `200 {"message":"FORBIDDEN: 该待确认不属于当前用户"}`，该行**仍是 PENDING** ✓ |
| 登录用户批准**自己的**待确认 | `Operation approved` + 审计 `Approved by user: Admin` ✓ |
| `GET /confirm/pending?sessionId=<别人的会话>` | 被忽略（`count=0`）✓ |

### 11.2 ② 两条缓解

**（a）挂起上限按会话分名额**（`agent.tool-loop.max-pending-confirms-per-session`，默认 **2**）
- 原来上限是**全局**的（默认 8）：一个用户留下 8 个未答复确认（按 D5 允许"慢慢答/离开再回来"）就能把**所有人**的写操作全拒掉，且提示语与本人无关、排查困难。
- 现在 `tryAcquire/releasePendingSlot(sessionKey)` 同时受**全局**与**单会话**约束；提示语区分两种情况，全局满时明确写"**可能来自其他会话/用户**"。
- 实测（护栏）：同会话占满 2 → 第 3 个被拒；**A 会话占满后 B 会话照常可用**（原缺陷的直接反证）；释放后计数归零。

**（b）重启后遗留 PENDING 失效化**
- 现状问题：等待状态在**内存线程**里，重启后线程消失、审计行仍 `PENDING` ⇒ D11 的恢复弹窗会把它弹出来，用户点"批准"只改了数据库、**操作不执行**（静默失败）。改前库里就躺着 3 条这样的历史孤儿（`delete_doc`/`write_file`/`move_doc`，2026-10-08 及更早）。
- 新增：启动（**根上下文 refresh 完成之后**，`ApplicationListener<ContextRefreshedEvent>`）把**早于「启动时间 − 60s 宽限期」**的 `PENDING` 批量置为 **`ABANDONED`**（`AuditLogEntity.OperationStatus` 新增；判定上等同"未批准"，`findPendingBySessionId` 只取 PENDING ⇒ 不再出现在恢复弹窗里；批准会得到明确的"已失效"提示）。
- 开关：`agent.tool-loop.sweep-stale-confirms-on-start`（默认 true）。
- 实测：启动后 3 条历史孤儿 → `ABANDONED`（`PENDING` 归零）；宽限期生效（重启够快时，重启前 30s 内新建的行**保持 PENDING** 未被误伤）；`ABANDONED` 行不再被 `GET /confirm/pending` 返回。
- ⚠️ **集群注意（已在代码/文档写明）**：审计表是共享的，某节点重启会作废**其他节点**尚未答复的待确认 —— 那些等待线程会按"未批准"收场（操作不执行，用户重做即可）。不希望如此就把开关置 false。

### 11.3 顺带修掉的既有缺陷

- **操作级（legacy）确认路径拿错 token**：原代码先 `UUID.randomUUID()` 生成 token 再调 `createPendingEntry(...)` 并**丢掉返回值** ⇒ 等待时永远查不到该审计行，`waitForConfirmation` 首个轮询即把"已批准"判成"拒绝"（该路径的确认从来没生效过）。改为**用落库返回的 token**；拿不到 token 时 fail-closed（不执行并明确报错）。
- **`AuditLogService.createPendingEntry` 的日志**同样把 token 明文打出来 → 已脱敏。

### 11.4 本轮验证

- 全量护栏 **46 套 / 2021 项 / 0 失败**（`TestPermissionLiveContext` 15→24：按会话限额/跨会话互不影响/提示语/脱敏；`TestWriteConfirmGateCoverage` 56→63：授权与归属 lint、按会话分名额、启动清理链路 lint）。
- 真实回合回归：新会话（标准档）→ 触发 `move_doc` 确认 → 弹窗 6 个作用域选项照常 → 点「拒绝」→ 模型如实汇报"操作被用户拒绝"、未执行（**证明按会话分名额的改动没有破坏确认门**）。
- 测试数据全部清理：伪造审计行已删、测试会话已删；测试期间**零文件改动**。

### 11.5 仍未做（挂起）

- **D10 选项 B（不占线程的挂起）**：完整解需工具执行链可挂起/可恢复（`ToolUseLoop`/`ToolRegistry` 支持暂停点），改动面大，仍留后续专项。本轮只做"按会话分名额 + 孤儿失效化"两条缓解。
- **D6 计划先行**（P2）。
- 启动清理日志的可见性：本机 dev 环境启动期 `log.info` 未落到 `docsys*.log`（原因未确认），故**以数据库状态作为该功能的验收依据**（代码同时走 SLF4J 与项目日志两路，正常运行环境下应可查）。


