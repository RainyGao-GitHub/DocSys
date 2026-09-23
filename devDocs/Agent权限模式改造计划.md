# Agent 权限模式改造计划（确认弹窗的"档位 + 作用域规则"）

- 建立于 2026-09-23。**唯一口径来源**：本文件（分期 / 验收 / 不做什么）。
- 工作卡：`CURRENT_STATE_agent权限模式.md`（当前任务状态、必读上下文锚点、进展）。
- 前序任务（轮数预算 + 续接）已完成并提交（`8353fe0ed` / `d8c826789` / `5725c0431` / `e044ddecc`）。

## 0. 结论摘要

现状：**每个** `isWrite + needsConfirm` 的写工具都要弹一次确认、点一次"批准执行"。
用户场景：整理目录时要连续移动/重命名/写文件，几十次点击全是"我知道这是安全的"——确认疲劳让确认失去意义。

做法（与 Copilot / Claude Code / Gemini CLI 一致的两层结构）：

1. **模式（决定默认行为）**：计划 / 手动 / 自动 / 全部允许 四档，**新会话默认手动**；
   （2026-09-23 用户二次裁定：原"只读"改名 **计划模式** 并**带 Claude 式闭环**（出计划 → 用户批准 → 自动切回执行）；原"智能"更名为 **自动**、原"自动"更名为 **全部允许（Allow All）**——因为"自动档反而因为硬清单每次都要问"比智能档更烦，命名误导；
   手动档**不提供**"记住授权"，保持"每次都要确认"的纯粹语义）
2. **规则（收敛例外）**：**自动档**的确认弹窗给"作用域授权"，授权后**同作用域内同类操作不再询问**（作用域维度：该工具 / 该目录（含子目录）/ 该仓库；**生命周期只到本会话**）。

判定优先级（单一决策函数，求值顺序 **绝对保护 → 计划模式 → 会话规则 → 硬清单 → 模式默认**，自上而下第一条命中即生效）：

```
绝对保护（ABSOLUTE）    → ASK   ← delete_repos 等；永远确认，不受模式/规则影响
计划模式               → 写工具 DENY（不弹窗；引导模型先出计划，用户批准后切档执行）
会话内显式规则命中       → ALLOW ← 覆盖硬清单（含删除/权限变更），但**不能覆盖绝对保护**
硬清单（危险类别）       → ASK   ← 自动档也要问；仅"全部允许"档不问
其余写操作             → 手动/计划: ASK ；自动/全部允许: ALLOW
```

## 1. 现状与证据（代码锚点）

| 事实 | 位置 |
|---|---|
| 写工具统一标记 `isWrite(true).needsConfirm(true)`（12 个 + `run_skill`） | `tool/DocSysToolFactory.java`（L486…L1242） |
| 唯一拦截点：`execute()` 内 `if (def.needsConfirm) → confirmGate.confirm(name, args)` | `tool/ToolRegistry.java` L165-176 |
| 门实现：建 PENDING 审计 → 推 SSE `confirm` → 轮询等待批准（默认 120s 超时） | `tool/AuditWriteConfirmGate.java`；超时 `agent.tool-loop.confirm-timeout` |
| 推送抽象（无通道时 NOOP） | `tool/ConfirmEventSink.java` |
| 前端弹窗：`#confirmModal` + `#confirmApproveBtn` / `#confirmRejectBtn`，`showConfirmModal(operation, token, message)`；批准经 `POST /agent/confirm {confirmToken, action}` | `WebRoot/web/agent/index.html` L2010-2016 / L2805-2830 / L3677 |
| 会话级存储（P3 已加，可复用）：`agent_sessions.metadata` 通用键读写 | `session/SessionService.java`（`getMetaValue/metaValueOf/putMetaJson/removeMeta`） |
| 全局配置：`agent_config` 键值 | `config/AgentConfigService.java`（`KEY_AGENT_MAX_TURNS` 同款） |
| 护栏（**改造后必须同步**）：断言"每个 needsConfirm 工具都真的弹确认" | `tool/TestWriteConfirmGateCoverage.java` |

结论：只需在**确认门之外包一层判定**（工具与门实现都不用改），前端弹窗加作用域选项 + 顶部模式选择器。

## 2. 业界参照（已核对官方文档，2026-09）

| 产品 | 模式 | 规则 / 作用域 |
|---|---|---|
| VS Code Copilot | **Manual / Assisted（LLM 逐次判定）/ Allow all**（+ Autopilot 模式） | 终端命令 regex 白名单；工具授权分**会话 / 工作区 / 用户**三级；`chat.tools.edits.autoApprove` glob；企业策略可禁用全局自动批准；官方建议"授权尽量留在会话级" |
| Claude Code | `permission_mode`：**default / acceptEdits / plan / bypassPermissions / dontAsk / auto** | `permissions.allow / deny / ask` 规则（如 `Bash(npm run test:*)`）；`allowed_tools` 只管"可用" |
| Gemini CLI | **default / auto_edit / plan / yolo** | policy engine 按模式配规则；Shift+Tab 切换；YOLO 有醒目指示 |

**取谁不取谁**：取"模式 + 规则"两层结构与 4 档形态（Claude 的 default/acceptEdits/plan/bypass 语义 + Copilot 的"作用域授权"），
**不取** Assisted（LLM 判定）、不取 dontAsk、不取企业级持久化规则（本任务作用域只到会话，见 §3）。

**技能/命令类调用的业界处理（已核对，2026-09）**：两家**都不解析调用内容**：

| 产品 | 做法 |
|---|---|
| VS Code | 自动批准按**工具/能力**粒度（非内容）；企业策略可强制某些工具永远人工批准（`execute/runInTerminal`、`web/fetch`）；终端 regex 白名单官方自标 best-effort（alias/引号拼接/复合命令有已知局限）并建议"担心 prompt injection 就用沙箱"；**沙箱内 MCP 工具调用直接自动批准**（用隔离替代判定）；**Assisted permissions = LLM judge 逐次判定**；`PreToolUse` hooks 可返回 allow/deny/ask |
| Claude Code | 技能在 `SKILL.md` frontmatter 声明 **`allowed-tools`**（如 `allowed-tools: Read, Grep, Bash(git:*)`）——技能级**静态声明**，技能内部工具调用再走权限层；命令白名单是前缀匹配（`Bash(npm run test:*)`）；`permission_mode: auto` = **模型分类器逐次判定**；官方生态把"`allowed-tools` 变宽"当作**安装时要审的权限提升** |

→ 可用路线只有三条：**按身份声明 / 沙箱隔离 / 模型判定**。我们的选择：**按技能声明的 risk 分级（主）+ 未声明 fail-safe（绝对保护）+ 可选 LLM judge（P4）**。

**命名对齐**（用户 2026-09-23 二次裁定）："只读"→**计划**（含闭环，对齐 `plan`）、原"智能"→**自动**（对齐 `acceptEdits` 的"常规自动通过"语义）、
原"自动"→**全部允许**（对齐 `bypassPermissions` / Allow all）。原命名的问题：叫"自动"却对硬清单每次都问、叫"智能"反而更自由，用户会选错档。

## 3. 设计定稿（用户 2026-09-23 裁定）

### 3.1 四档模式（2026-09-23 二次裁定后的命名与语义）

| 档 | id | 行为 | 参照 |
|---|---|---|---|
| 计划 | `plan` | 只读工具照跑（调研/列目录/读文件）；**写工具直接拒绝**，并在提示词里要求模型**先输出一份可执行计划**；用户点「批准并执行」→ 自动切到 `auto` 档 + 把该计划作为上下文注入后继续执行 | Claude/Gemini 的 `plan`（**带闭环**） |
| 手动（**新会话默认**） | `manual` | 所有 `needsConfirm` 工具逐个弹确认（= 现状，回归基线）；**不提供“记住授权”** | `default` / Manual |
| 自动 | `auto` | 常规写操作（`NORMAL`）默认放行；**硬清单（删除/权限变更）仍弹确认**；弹窗可选作用域授权，授权后同作用域内**包括危险项**都不再问 | `acceptEdits` + 作用域授权 |
| 全部允许 | `allowAll` | **除绝对保护外全部放行**（含删除/权限变更）；前端常驻醒目横幅 + 可一键切回；开启时二次确认（文案写明“除删除仓库外全部不问”）；管理员可全局禁用 | `bypassPermissions` / Allow all / `yolo` |

**计划模式的闭环（P1 一并做，否则该档是个死胡同）**

1. `plan` 档下 `ToolRegistry` 对写工具返回 DENY，文案：“当前为计划模式：请先把计划写出来（调研可以继续），用户批准后再执行”；
2. system prompt 追加计划模式段落：只做调研、不尝试写、最后输出**带步骤/目标对象/操作的计划**；
3. 前端在回答下渲染「批准并执行」（可附带「批准但逐步确认」→ 切 `manual`）：
   - 「批准并执行」→ 切 `auto` 档 + 发一条“我批准了计划，请按计划执行”（服务端把计划文本作上下文注入，复用 P3 的续接注入思路）；
4. 计划模式下未执行任何写操作 → 审计只记被拒绝的尝试。

### 3.2 绝对保护 + 硬清单（风险类别挂在 `ToolDefinition` 上）

风险类别**显式声明**（`riskClass`），不靠名字猜：`NORMAL / DESTRUCTIVE / PERMISSION / **ABSOLUTE**`。

| 类别 | 语义 | 初始归类（实现时逐工具核对语义后可微调） |
|---|---|---|
| **`ABSOLUTE`（绝对保护）** | **永远 ASK**：任何档位（含“全部允许”）都要确认；**会话规则也不能豁免** | `delete_repos`（硬编码，**不可移除**）；`run_skill` **当被调技能未声明 risk 或声明为 `absolute` 时** |
| `DESTRUCTIVE` | 自动档仍 ASK；“全部允许”档放行；规则可豁免 | `delete_doc`、`move_doc`、`rename_doc`、`update_repos`（若含物理路径变更） |
| `PERMISSION` | 同 `DESTRUCTIVE`（权限/共享变更） | `create_doc_share`、`update_repos`（成员/权限/配置变更） |
| `NORMAL` | 自动/全部允许档直接放行 | `create_repos`、`create_folder`、`write_file`、`write_note`、`copy_doc`、`backup_repos` |

#### 3.2.1 `run_skill` 的风险判定（用户 2026-09-23 四次裁定）

**不解析调用内容**（不可靠：`ExternalSkillExecutor` 直接跑技能的 `__main__.py` 或 `cmd.exe /c` 执行 SKILL.md 的 CLI 块 = 任意代码/任意 shell，静态分析注定被绕过），
而是**按技能声明的 risk 分级**（这是"判断内容"里唯一可靠的部分：判断的是**调哪个技能**）：

| 技能声明 `risk` | 判定 |
|---|---|
| `safe`（内置只读类：status / whoami / help…） | 跟随模式（自动・全部允许档不问）← **直接消掉现有最烦的那类技能弹窗** |
| `write` | 按 `NORMAL` / `DESTRUCTIVE` 规则 |
| `dangerous`（第三方 / 外部 Python / CLI 技能） | 硬清单（自动档仍问） |
| `absolute` **或未声明** | **绝对保护**（4 档全问，fail-safe） |

- 声明位置：`SKILL.md` YAML frontmatter 新增 `risk:`；**顺带修现存空壳**——`SkillParser.parseFrontmatter` 目前对 `permissions:` 只写了 `// Handle list`（没解析），`EnhancedSkill.permissions` 字段是死的。
- **纵向收口（P1 实现时验证）**：技能内部若经工具注册表执行动作，那些调用天然受同一策略约束（技能声明再宽松，内部 `delete_repos` 仍被绝对保护挡住）；需核对 `DocSysSkillExecutor`（内置 Java）路径，`ExternalSkillExecutor` 无法收口。
- 声明来源可控：技能由管理员安装 → 安装/导入时要求声明，未声明默认 `absolute`；技能列表 UI + `help` 显示 risk（P3）。

- 只读工具（`isWrite=false`）不参与判定。
- `memory_set` 现状 `needsConfirm=false`（低风险自我记忆）→ 保持不参与。

### 3.3 规则（仅会话级）

- 触发：**自动档**弹窗里用户选择作用域后点“批准并记住”（`plan`/`manual`/`allowAll` 档不产生规则）。
- 作用域维度（三者任选其一，最细优先）：`该工具` / `该目录（含子目录）` / `该仓库`。
- **生命周期：只到本会话**（用户裁定：授权作用域只做会话级）→ 存 `agent_sessions.metadata.permissionRules`，会话删除即失效；**不落 agent_config、不新增表、不跨会话继承**。
- 规则命中即 ALLOW，**覆盖硬清单**（用户在作用域内的删除/权限变更也不再问——否则整理目录仍会被打断），但**不覆盖绝对保护**（`delete_repos` 永远弹）。- 规则可见可撤：前端模式 chip 下拉里列出"本会话已授权 N 条"并可一键清空。

### 3.4 存储与开关

| 项 | 位置 |
|---|---|
| 当前模式（会话级） | `agent_sessions.metadata.permissionMode`（值 `plan`/`manual`/`auto`/`allowAll`；复用 P3 通用键；随请求带 `permissionMode` 时服务端以请求为准并回写） |
| 会话规则 | `agent_sessions.metadata.permissionRules`（JSON 数组：`{kind: tool|dir|repo, tool, vid, path}`） |
| 管理员全局开关 | `agent_config.agent_permission_allow_all_enabled`（默认 `true`；`false` → UI 不提供“全部允许”档 + 服务端把 `allowAll` 降级为 `auto` 并提示） |
| 前端当前值 | 会话内即时展示（并写 `localStorage` 仅作 UI 记忆；**新会话回到手动**） |

### 3.5 审计与可见性

- **所有**放行（含自动/规则）都要有审计记录：自动放行走 `AuditLogService.record(...)`（PENDING 流程仅用于"需要人批准"的场合）。
- 工具卡片上标注批准来源：`批准方式=手动 / 规则(该目录) / 自动档 / 全部允许`，便于事后追责。
- 顶部模式 chip 常驻；`allowAll` / `plan` 档用醒目色（对齐 Gemini 的 YOLO 指示）。

### 3.6 SSE 协议（只加不改）

- 新增事件 `{"type":"permission","mode":"auto"}`（会话模式变更回执，可选）与 `confirm` 事件**加字段**：`{"type":"confirm",...,"scopes":["tool","dir","repo"]}`（仅自动档下发）。
- 既有 `confirm` / `done` / `tool_call` / `tool_result` 语义不变。

## 4. 验收（可量化，逐条给证据）

| # | 验收项 | 证据形式 |
|---|---|---|
| V1 | **计划档**：写工具有 DENY（不弹窗、无写入）；模型输出带步骤的计划 | 页面 E2E + `[Permission] mode=plan decision=DENY tool=move_doc` 日志 |
| V2 | **计划闭环**：点「批准并执行」→ 切到 `auto` 档 + 计划作为上下文注入 → 模型按计划执行完成 | 页面 E2E + `done.meta.permissionMode=auto` + 日志 `[Permission][PLAN-APPROVED]` |
| V3 | **手动档回归**：与改造前一致（每个写工具都弹一次）；不出现"记住授权"入口 | 护栏 `TestWriteConfirmGateCoverage`（按模式改写后）+ 页面 E2E |
| V4 | **自动档**：连续 ≥5 次 `write_file`/`create_folder` 0 弹窗；**`delete_doc`/`create_doc_share` 仍弹**；审计有记录且标注"自动档" | 页面 E2E（计数弹窗次数）+ 审计查询 |
| V5 | **自动档作用域规则**：弹窗选"此目录内不再询问" → 同目录 `write_file`/`move_doc`/`delete_doc` 各 ≥3 次**均不再弹**；换目录仍弹 | 页面 E2E + `[Permission] decision=ALLOW reason=rule(dir)` 日志 |
| V6 | **规则只到本会话**：新会话/清空规则后重新弹；服务端不持久化跨会话规则 | 护栏（规则存储断言）+ 页面 E2E |
| V7 | **管理员禁用"全部允许"**：UI 不提供该档；服务端收到 `allowAll` 降级为 `auto` 并有提示 | 护栏 + 页面 E2E（配置 `agent_permission_allow_all_enabled=false`） |
| V8 | **绝对保护**：`delete_repos` 在 **4 个档位下都弹确认**（含"全部允许"档）；且在自动档已授权含该仓库的作用域规则时**仍弹** | 护栏（判定矩阵全覆盖）+ 页面 E2E |
| V9 | **技能 risk 分级**：声明 `safe` 的内置技能在自动档**不弹**；未声明 risk 的技能在**4 档都弹**（fail-safe）；声明 `dangerous` 的技能在自动档仍弹 | 护栏（策略层用假技能声明表）+ 页面 E2E |
| V10 | **回归**：全量护栏不低于当前基线 **37 套 / 1409 项**；`TestWriteConfirmGateCoverage` 按模式重写后仍全绿 | `run_guards.ps1` 输出 |

## 5. 分期

### P1（必做）：模式骨架 + 四档基础行为 + **计划模式闭环** + 会话级存储 + 可见性

- 新增 `agent/permission/`：`PermissionMode`（枚举 `plan/manual/auto/allowAll` + `fromId`/`isValid`/默认 `manual`）、`ToolRisk`（`NORMAL/DESTRUCTIVE/PERMISSION/ABSOLUTE`）、`PermissionDecision`（ALLOW/ASK/DENY + reason）、`PermissionPolicy`（**纯函数判定**：absolutes × mode × risk × rules → decision；无 Spring，可离线护栏）。
- `ToolDefinition` 加 `riskClass`（默认 NORMAL）+ Builder 方法 `riskClass(...)`；`DocSysToolFactory` 按 §3.2 标注。
- `ToolRegistry.execute()`：`needsConfirm` 分支改为"先问策略"——`DENY → 直接返回错误`；`ASK → 走 confirmGate`；`ALLOW → 跳过 gate（但记审计）`。策略为 null 时保持现状（向后兼容测试）。
- `MainAgent`：构建 registry 时注入策略（模式取自会话 metadata / 请求参数），并把模式与规则一起传给门（规则 P2 才用）。
- **计划模式闭环**：`plan` 档下写工具 DENY 文案 + system prompt 计划段落（只调研 + 输出可执行计划）+ 前端「批准并执行」（切 `auto` 并注入计划后继续）/「批准但逐步确认」（切 `manual`）。
- 前端：顶部模式 chip（4 档，`allowAll` 在管理员禁用时置灰）+ `allowAll`/`plan` 醒目色 + 请求带 `permissionMode`。
- 护栏：新增 `TestPermissionPolicy`（判定矩阵：4 模式 × 4 风险 × 规则命中/未命中，含"绝对保护在 4 档全 ASK"、"规则不能豁免绝对保护"、"自动档硬清单仍 ASK"、"全部允许档非绝对保护全 ALLOW"、"计划档写工具 DENY"）；技能 risk 解析与 fail-safe（`TestSkillRisk`）；改写 `TestWriteConfirmGateCoverage`。
- 验证：V1 / V2 / V3 / V4 / V7 / V8 / V9 / V10 + 页面 E2E。

### P2（必做，消除确认疲劳）：自动档 + 作用域授权

- 弹窗新增作用域选择（该工具 / 该目录（含子目录）/ 该仓库）+ 按钮"批准并记住"；`confirm` 事件带 `scopes`。
- 规则写入会话 metadata（`permissionRules`），命中即 ALLOW；模式 chip 下拉显示已授权条目 + 一键清空。
- 工具卡片标注批准来源（手动 / 规则(目录) / 自动档 / 全部允许）。
- 护栏：`TestPermissionRules`（命中/子目录包含/跨目录不命中/清空规则/规则覆盖硬清单/规则只在自动档产生）。
- 验证：V5 / V6。

### P3（推荐）：治理与统计

- 管理员全局开关 `agent_permission_allow_all_enabled`（UI + 服务端强制降级）。
- 绝对保护清单可配置（`agent_config` 里的追加名单；**`delete_repos` 始终在内且不可移除**）。
- 技能 risk 的 UI：技能列表/详情显示 `risk` 与"未声明（按绝对保护处理）"提示；管理员可改声明（写回 `SKILL.md` frontmatter）。
- 审计/统计：按模式的写操作分布、自动批准次数、规则命中次数。
- 文档：`devDocs/` 使用说明 + 记忆文件更新。

## 6. 不做什么（Non-goals）

1. **不做** Assisted（LLM 判定是否危险）那类模式（本轮）——成本与不确定性都不划算；仅 P4 可选，且只作减噪、不替代绝对保护。
2. **不做** `dontAsk`（未预先授权一律拒绝）。
3. **不做**跨会话/全局/工作区级持久化规则（用户裁定：作用域只做会话级）。
4. **不做**计划模式下的"计划在线编辑/多轮打磨"（闭环只做：出计划 → 批准（或批准并逐步确认）→ 执行）。
5. **不做**对技能调用**内容**的静态分析/关键字黑名单（不可靠且可绕过，见 §3.2.1）。
6. **不做**技能沙箱（容器/受限账号）——成本高，待后续专项评估。
7. **不改** SSE 既有事件语义（只加字段）；**不动**旧编排封口策略（R3-4/R3-5）。
8. **不改**工具自身语义与参数（本次只加"是否放行"的判定层）。

## 7. 风险与回滚

| 风险 | 说明 | 应对 |
|---|---|---|
| 全部允许档误删 | 用户开"全部允许"后批量删除（该档对硬清单不问） | **`delete_repos` 已被绝对保护挡掉**；其余删除属用户已知风险；开启时二次确认（文案写明"除删除仓库外全部不问"）+ 审计全量 + 常驻横幅 + 一键切回 + 管理员可禁用 |
| `run_skill` 绕过保护 | 技能可执行任意逻辑（间接删仓库） | **已定稿（§3.2.1）**：不解析内容，按技能声明的 `risk` 分级；**未声明 = 绝对保护**；内置只读技能声明 `safe`；第三方技能由管理员安装时声明；技能内部走注册表的调用天然受同一策略约束（P1 验证收口路径） |
| 自动档被误以为"什么都不问" | 用户选"自动"后仍被删除操作打断 | chip 下拉里写清每档语义（自动＝常规自动、危险仍确认）；硬清单命中时弹窗文案说明"该操作属危险类别" |
| 规则过宽 | "该仓库内不再询问"覆盖删除 | 作用域授权是显式选择（按钮文案写清"含删除等危险操作"）；chip 里可一键清空 |
| 会话 metadata 膨胀 | 规则条目过多 | 规则条数上限（如 50 条）+ 同类合并；只在自动档产生 |
| 计划闭环被滥用 | 批准的计划与实际执行不一致 | 计划注入后仍按档位判定（批准只切档，不放宽硬清单）；执行过程照常审计 |
| 护栏口径变化被忽略 | `TestWriteConfirmGateCoverage` 断言"必须弹确认" | P1 内同步改写（手动档必弹 / 计划档拒绝 / 自动档常规跳过但硬清单仍弹 / 全部允许档全跳过但有审计） |
| 多用户误开 | 普通用户看不到风险 | 顶部常驻 chip + 全部允许档醒目色 + 管理员全局开关（P3） |

## 8. 不变量（工程铁律）

- 编译输出 `-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`；Spring 控制器编译需 `-parameters -g`。
- 测试/探针产物写 `%TEMP%\docsys_chk\`（**绝不写工程根 `tmp/`**）。
- `ToolRegistry` 的"策略未注入 → 保持现状"必须成立（否则既有 36+ 套护栏与测试环境全红）。
- 提交归属：Agent 核心代码 + 计划 + 工作卡 → 主仓库 `D:/Dev/DocSys`（`devInt`）；每期结束先跑全量护栏再提交，提交信息写清"验了什么"。
- 会话级规则**不新增表**（复用 `agent_sessions.metadata`）；SQLite 下 update 返回值有假阴性，按"不抛异常即成功"判定。

## 9. 进度锚点（卡更新规则）

- 每完成一期或任一条验收项（V1~V7）**立即**更新工作卡三处：当前进展 / 下一步 / 未提交改动。
- 结论被推翻时**删改原结论**（不留过期描述）；FAIL 写清数字与归因；里程碑达成即记录提交号。
