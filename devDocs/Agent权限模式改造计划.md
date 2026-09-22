# Agent 权限模式改造计划（确认弹窗的"档位 + 作用域规则"）

- 建立于 2026-09-23。**唯一口径来源**：本文件（分期 / 验收 / 不做什么）。
- 工作卡：`CURRENT_STATE_agent权限模式.md`（当前任务状态、必读上下文锚点、进展）。
- 前序任务（轮数预算 + 续接）已完成并提交（`8353fe0ed` / `d8c826789` / `5725c0431` / `e044ddecc`）。

## 0. 结论摘要

现状：**每个** `isWrite + needsConfirm` 的写工具都要弹一次确认、点一次"批准执行"。
用户场景：整理目录时要连续移动/重命名/写文件，几十次点击全是"我知道这是安全的"——确认疲劳让确认失去意义。

做法（与 Copilot / Claude Code / Gemini CLI 一致的两层结构）：

1. **模式（决定默认行为）**：只读 / 手动 / 智能 / 自动 四档，**新会话默认手动**；
2. **规则（收敛例外）**：智能档的确认弹窗给"作用域授权"，授权后**同作用域内同类操作不再询问**（作用域维度：该工具 / 该目录（含子目录）/ 该仓库；**生命周期只到本会话**）。

判定优先级（单一决策函数，**规则 > 硬清单 > 模式**）：

```
只读模式        → 写工具一律 DENY（不弹窗）
会话内显式规则命中 → ALLOW        ← 覆盖硬清单（含删除/权限变更）
硬清单（危险类别） → ASK          ← 自动模式也要问
模式默认         → manual/smart: ASK ；auto: ALLOW
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

## 3. 设计定稿（用户 2026-09-23 裁定）

### 3.1 四档模式

| 档 | id | 行为 | 参照 |
|---|---|---|---|
| 只读 | `readonly` | 只读工具照跑；**写工具直接拒绝**（返回 `ToolResult.error("当前为只读模式…切到手动/智能/自动后再执行")`，不弹窗、不落写审计） | Claude/Gemini 的 `plan` |
| 手动（**新会话默认**） | `manual` | 所有 `needsConfirm` 工具逐个弹确认（= 现状，回归基线） | `default` / Manual |
| 智能 | `smart` | 手动 + 弹窗带作用域授权；命中会话内规则 → 直接放行（**引用规则覆盖硬清单**） | `acceptEdits` / Assisted 的作用域授权 |
| 自动 | `auto` | 默认全部放行；**硬清单类别仍弹确认**；前端显示醒目横幅 + 可一键切回 | `bypassPermissions` / Allow all / yolo |

### 3.2 硬清单（危险类别，自动模式也必须确认）

风险类别挂在 `ToolDefinition` 上**显式声明**（`riskClass: NORMAL / DESTRUCTIVE / PERMISSION`），不靠名字猜。

| 类别 | 初始归类（实现时逐工具核对语义后可微调） |
|---|---|
| `DESTRUCTIVE` | `delete_repos`、`delete_doc`、`move_doc`、`rename_doc`、`update_repos`、`run_skill`（技能可执行任意逻辑） |
| `PERMISSION` | `create_doc_share`（外链分享）、`update_repos`（若含成员/权限变更→归此类） |
| `NORMAL` | `create_repos`、`create_folder`、`write_file`、`write_note`、`copy_doc`、`backup_repos` |

- 只读工具（`isWrite=false`）不参与判定。
- `memory_set` 现状 `needsConfirm=false`（低风险自我记忆）→ 保持不参与。

### 3.3 规则（仅会话级）

- 触发：**智能档**弹窗里用户选择作用域后点"批准并记住"。
- 作用域维度（三者任选其一，最细优先）：`该工具` / `该目录（含子目录）` / `该仓库`。
- **生命周期：只到本会话**（用户裁定：授权作用域只做会话级）→ 存 `agent_sessions.metadata.permissionRules`，会话删除即失效；**不落 agent_config、不新增表、不跨会话继承**。
- 规则命中即 ALLOW，**覆盖硬清单**（用户在作用域内的删除/权限变更也不再问——否则整理目录仍会被打断）。
- 规则可见可撤：前端模式 chip 下拉里列出"本会话已授权 N 条"并可一键清空。

### 3.4 存储与开关

| 项 | 位置 |
|---|---|
| 当前模式（会话级） | `agent_sessions.metadata.permissionMode`（复用 P3 通用键；随请求带 `permissionMode` 时服务端以请求为准并回写） |
| 会话规则 | `agent_sessions.metadata.permissionRules`（JSON 数组：`{kind: tool|dir|repo, tool, vid, path}`） |
| 管理员全局开关 | `agent_config.agent_permission_auto_enabled`（默认 `true`；`false` → UI 不提供自动档 + 服务端把 `auto` 降级为 `manual` 并提示） |
| 前端当前值 | 会话内即时展示（并写 `localStorage` 仅作 UI 记忆；**新会话回到手动**） |

### 3.5 审计与可见性

- **所有**放行（含自动/规则）都要有审计记录：自动放行走 `AuditLogService.record(...)`（PENDING 流程仅用于"需要人批准"的场合）。
- 工具卡片上标注批准来源：`批准方式=手动 / 规则(该目录) / 自动模式`，便于事后追责。
- 顶部模式 chip 常驻；`auto` / `readonly` 档用醒目色（对齐 Gemini 的 YOLO 指示）。

### 3.6 SSE 协议（只加不改）

- 新增事件 `{"type":"permission","mode":"smart"}`（会话模式变更回执，可选）与 `confirm` 事件**加字段**：`{"type":"confirm",...,"scopes":["tool","dir","repo"]}`（仅智能档下发）。
- 既有 `confirm` / `done` / `tool_call` / `tool_result` 语义不变。

## 4. 验收（可量化，逐条给证据）

| # | 验收项 | 证据形式 |
|---|---|---|
| V1 | **只读档**：写操作被拒且回答说明原因；无写入、无弹窗 | 页面 E2E + `[Permission] mode=readonly decision=DENY tool=move_doc` 日志 |
| V2 | **手动档回归**：与改造前一致（每个写工具都弹一次） | 护栏 `TestWriteConfirmGateCoverage`（按模式改写后）+ 页面 E2E |
| V3 | **自动档**：连续 ≥5 次 `write_file`/`create_folder` 0 弹窗；**`delete_doc`/`create_doc_share` 仍弹**；审计有记录且标注"自动模式" | 页面 E2E（计数弹窗次数）+ 审计查询 |
| V4 | **智能档作用域规则**：弹窗选"此目录内不再询问" → 同目录 `write_file`/`move_doc`/`delete_doc` 各 ≥3 次**均不再弹**；换目录仍弹 | 页面 E2E + `[Permission] decision=ALLOW reason=rule(dir)` 日志 |
| V5 | **规则只到本会话**：新会话/清空规则后重新弹；服务端不持久化跨会话规则 | 护栏（规则存储断言）+ 页面 E2E |
| V6 | **管理员禁用自动档**：UI 不提供该档；服务端收到 `auto` 降级为 `manual` 并有提示 | 护栏 + 页面 E2E（配置 `agent_permission_auto_enabled=false`） |
| V7 | **回归**：全量护栏不低于当前基线 **37 套 / 1409 项**；`TestWriteConfirmGateCoverage` 按模式重写后仍全绿 | `run_guards.ps1` 输出 |

## 5. 分期

### P1（必做，核心止血）：模式骨架 + 只读/手动/自动三档 + 会话级存储 + 可见性

- 新增 `agent/permission/`：`PermissionMode`（枚举，含 `fromId`/`isValid`）、`ToolRisk`（枚举）、`PermissionDecision`（ALLOW/ASK/DENY + reason）、`PermissionPolicy`（**纯函数判定**：mode × risk × rules → decision；无 Spring，可离线护栏）。
- `ToolDefinition` 加 `riskClass`（默认 NORMAL）+ Builder 方法 `riskClass(...)`；`DocSysToolFactory` 按 §3.2 标注。
- `ToolRegistry.execute()`：`needsConfirm` 分支改为"先问策略"——`DENY → 直接返回错误`；`ASK → 走 confirmGate`；`ALLOW → 跳过 gate（但记审计）`。策略为 null 时保持现状（向后兼容测试）。
- `MainAgent`：构建 registry 时注入策略（模式取自会话 metadata / 请求参数），并把模式与规则一起传给门（智能档 P2 才用）。
- 前端：顶部模式 chip（4 档，自动档在管理员禁用时置灰）+ `auto`/`readonly` 醒目色 + 请求带 `permissionMode`。
- 护栏：新增 `TestPermissionPolicy`（判定矩阵：4 模式 × 3 风险 × 规则命中/未命中，含"规则覆盖硬清单"、"自动档硬清单仍 ASK"、"只读档写工具 DENY"）；改写 `TestWriteConfirmGateCoverage`。
- 验证：V1 / V2 / V3 / V6 / V7 + 页面 E2E。

### P2（必做，消除确认疲劳）：智能档 + 作用域授权

- 弹窗新增作用域选择（该工具 / 该目录 / 该仓库）+ 按钮"批准并记住"；`confirm` 事件带 `scopes`。
- 规则写入会话 metadata（`permissionRules`），命中即 ALLOW；模式 chip 下拉显示已授权条目 + 一键清空。
- 工具卡片标注批准来源（手动 / 规则(目录) / 自动）。
- 护栏：规则命中/作用域包含（子目录）/跨目录不命中/清空规则/规则覆盖硬清单；`TestPermissionRules`。
- 验证：V4 / V5。

### P3（推荐）：治理与统计

- 管理员全局开关 `agent_permission_auto_enabled`（UI + 服务端强制降级）。
- 审计/统计：按模式的写操作分布、自动批准次数、规则命中次数（`AuditLogService` 已有字段扩展）。
- 文档：`devDocs/` 更新使用说明 + 记忆文件。

## 6. 不做什么（Non-goals）

1. **不做** Assisted（LLM 判定是否危险）那类模式——成本与不确定性都不划算。
2. **不做** `dontAsk`（未预先授权一律拒绝）。
3. **不做**跨会话/全局/工作区级持久化规则（用户裁定：作用域只做会话级）。
4. **不做**只读档的"计划审批后自动执行"闭环（后续单独评估）。
5. **不改** SSE 既有事件语义（只加字段）；**不动**旧编排封口策略（R3-4/R3-5）。
6. **不改**工具自身语义与参数（本次只加"是否放行"的判定层）。

## 7. 风险与回滚

| 风险 | 说明 | 应对 |
|---|---|---|
| 自动档误删 | 用户开自动档后批量删除 | 硬清单（删除/权限变更）仍确认；审计全量记录；前端横幅常驻 + 一键切回；管理员可全局禁用 |
| 规则过宽 | "该仓库内不再询问"覆盖删除 | 作用域授权是显式选择（按钮文案写清"含删除等危险操作"）；chip 里可一键清空 |
| 会话 metadata 膨胀 | 规则条目过多 | 规则条数上限（如 50 条）+ 同类合并；只在智能档产生 |
| 护栏口径变化被忽略 | `TestWriteConfirmGateCoverage` 断言"必须弹确认" | P1 内同步改写（手动档必弹 / 只读档拒绝 / 自动档跳过但有审计） |
| 多用户误开 | 普通用户看不到风险 | 顶部常驻 chip + 自动档醒目色 + 管理员全局开关（P3） |

## 8. 不变量（工程铁律）

- 编译输出 `-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`；Spring 控制器编译需 `-parameters -g`。
- 测试/探针产物写 `%TEMP%\docsys_chk\`（**绝不写工程根 `tmp/`**）。
- `ToolRegistry` 的"策略未注入 → 保持现状"必须成立（否则既有 36+ 套护栏与测试环境全红）。
- 提交归属：Agent 核心代码 + 计划 + 工作卡 → 主仓库 `D:/Dev/DocSys`（`devInt`）；每期结束先跑全量护栏再提交，提交信息写清"验了什么"。
- 会话级规则**不新增表**（复用 `agent_sessions.metadata`）；SQLite 下 update 返回值有假阴性，按"不抛异常即成功"判定。

## 9. 进度锚点（卡更新规则）

- 每完成一期或任一条验收项（V1~V7）**立即**更新工作卡三处：当前进展 / 下一步 / 未提交改动。
- 结论被推翻时**删改原结论**（不留过期描述）；FAIL 写清数字与归因；里程碑达成即记录提交号。
