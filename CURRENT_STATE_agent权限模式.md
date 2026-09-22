# CURRENT_STATE — Agent 权限模式（工作卡）

建立于 2026-09-23。**本卡是当前任务的唯一定义处**（必读上下文 / 进展 / 下一步 / 生效约束）。
上一个任务（任务续接与轮数上限，P1~P3）已完成并全部提交，见 `CURRENT_STATE_agent任务续接与轮数上限.md`（该卡只作历史查询，不再续接；其 P4 为可选、待数据）。

## 当前任务

给 Agent 增加**权限模式**，解决"整理目录时每个移动/写入都要点一次确认、几十次点击全是'我知道这是安全的'"的确认疲劳：

- 计划（唯一口径来源）：`devDocs/Agent权限模式改造计划.md`
- 用户原话（本次触发）："我看 copilot 和 claude code 都是可以选权限模式的，比如整理目录过程中由于调用移动目录工具，所以需要不断的确认……"
- 状态：**用户 5 项裁定已定稿 + 计划已排 + 本卡已建；代码未动手（等开工确认）**

## 用户定稿决策（2026-09-23）

| # | 项 | 裁定 |
|---|---|---|
| 1 | 档数 | **4 档**：只读 / 手动 / 智能 / 自动（用户追问"只读是不是其他 Agent 的计划模式"→ 是，见计划 §3.1） |
| 2 | 授权作用域 | **只做会话级**（会话内规则，删除会话即失效；不落全局、不新增表） |
| 3 | 自动档可用性 | **可以**（默认允许；P3 加管理员全局开关，`false` 时 UI 不提供并服务端降级） |
| 4 | 硬清单 | **删除 / 权限变更**即使自动档也确认；**但智能档里用户显式授权作用域后，该作用域内的删除/权限变更不再确认**（否则整理目录照样被打断）→ 判定优先级 **规则 > 硬清单 > 模式** |
| 5 | 新会话默认档 | **手动**（= 现状行为） |

## 必读上下文（续接锚点）

1. 计划：`devDocs/Agent权限模式改造计划.md`（§1 现状与代码锚点 / §2 业界参照 / §3 设计定稿 / §4 验收 V1~V7 / §5 分期 P1~P3 / §6 不做什么 / §7 风险 / §8 不变量）
2. 代码锚点（2026-09-23 状态）：
   - `src/com/DocSystem/agent/tool/ToolRegistry.java` L165-176：**唯一拦截点** `if (def.needsConfirm) → confirmGate.confirm(...)`（改造就在这一处外面包判定）
   - `src/com/DocSystem/agent/tool/ToolDefinition.java`：`name/description/parameters/executor/isWrite/needsConfirm/adminOnly`（P1 要加 `riskClass`）
   - `src/com/DocSystem/agent/tool/DocSysToolFactory.java`：12 个写工具 + `run_skill` 全部 `isWrite(true).needsConfirm(true)`；`memory_set` 是 `isWrite=true` 但 `needsConfirm=false`
   - `src/com/DocSystem/agent/tool/AuditWriteConfirmGate.java`：建 PENDING 审计 → `ConfirmEventSink.onConfirmRequired` → 轮询批准（默认 120s，`agent.tool-loop.confirm-timeout`）
   - `src/com/DocSystem/agent/tool/ConfirmEventSink.java` / `WriteConfirmGate.java`（`NOOP` 兼容非交互路径）
   - `src/com/DocSystem/agent/session/SessionService.java`：**P3 新加的 metadata 通用键读写**（`getMetaValue/metaValueOf/putMetaJson/removeMeta`）→ 会话级模式与规则直接放这里
   - `src/com/DocSystem/agent/config/AgentConfigService.java`：全局配置键（`KEY_AGENT_MAX_TURNS` 同款，P3 加管理员开关）
   - `src/com/DocSystem/agent/controller/AuditLogService.java`：`isWriteOperation`（按名字）/ `createPendingEntry(force)` / `record(...)`
   - 前端 `WebRoot/web/agent/index.html`：`#confirmModal`（L2010-2016）+ `showConfirmModal`（L2805）+ 批准/拒绝提交（L2828）；顶部工具栏按钮区（`#focusBtn`/`#opBtn`/`#sendBtn` 附近）放模式 chip
3. 相关护栏（改动会碰到）：`tool/TestWriteConfirmGateCoverage.java`（**断言"每个 needsConfirm 工具都真的弹确认"→ 必须按模式重写**）、`tool/TestWriteTools.java`（确认门 approve/reject 路径）、`tool/TestToolRegistry.java`（Builder 校验）
4. 记忆：`/memories/repo/agent-tools.md`、`/memories/repo/agent-tool-loop.md`（工具/编排口径 + E2E 技巧）、`/memories/repo/dev-tomcat.md`

## 基线（开工前实测，用于对比）

- 全量护栏：**37 套 / 1409 断言 / 0 失败**（`%TEMP%\docsys_chk\run_guards.ps1`）
- 现状行为：无模式概念；`needsConfirm` 工具**每次**都弹确认（`AuditWriteConfirmGate` 120s 超时）
- 编译：`%TEMP%\docsys_chk\do_compile.ps1 -Files "..."`（Spring 控制器加 `-Spring`）
- dev 环境：`C:\TomcatForDocSysDev\docsys` 8100，junction 挂载（静态即时生效，Java 需重编译 + 重启）

## 当前进展

1. ✅ 现状与代码锚点核对（计划 §1：唯一拦截点 + 门实现 + 前端弹窗 + 可复用的会话 metadata）
2. ✅ 业界参照核对（计划 §2：VS Code Manual/Assisted/Allow all + 会话级授权建议；Claude Code 6 种 `permission_mode` + allow/deny/ask 规则；Gemini CLI default/auto_edit/plan/yolo）
3. ✅ 用户 5 项裁定定稿（计划 §3；含"规则 > 硬清单 > 模式"的优先级）
4. ✅ 计划已排（`devDocs/Agent权限模式改造计划.md`）+ 本卡已建 + `CLAUDE.md` 会话恢复入口改指本卡
5. ⏳ 未开始编码

## 下一步

**开 P1（模式骨架 + 只读/手动/自动 + 会话级存储 + 可见性）**，第一步动作按序：

1. 新增 `agent/permission/`：`PermissionMode` / `ToolRisk` / `PermissionDecision` / `PermissionPolicy`（**纯函数**，便于离线护栏）
2. `ToolDefinition` 加 `riskClass`（默认 `NORMAL`）+ Builder；`DocSysToolFactory` 按计划 §3.2 标注（删除/移动/改名/更新仓库/技能 = DESTRUCTIVE，外链分享 = PERMISSION）
3. `ToolRegistry.execute()`：`needsConfirm` 分支改为 `DENY → 错误` / `ASK → 门` / `ALLOW → 跳过门但记审计`；**策略为 null 时保持现状**（不破坏既有测试）
4. 会话级模式：请求带 `permissionMode` → 服务端校验 + 写 `agent_sessions.metadata.permissionMode`
5. 前端：顶部模式 chip（4 档 + 自动档醒目色）
6. 护栏：新增 `TestPermissionPolicy`（4 模式 × 3 风险 × 规则矩阵）；改写 `TestWriteConfirmGateCoverage`
7. 编译 → 全量护栏 → 页面 E2E（V1/V2/V3/V6）→ 更新本卡 → 提交

## 未提交改动

- 计划 `devDocs/Agent权限模式改造计划.md`（**新文件**）+ 本卡（**新文件**）+ `CLAUDE.md`（入口改指本卡）+ 旧卡封卡说明 —— 作为本任务首次提交

## 生效约束

- 本任务**是否需要先提交**：不需要（上一期已提交，工作区干净）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`；Spring 控制器必须 `-parameters -g`。
- 测试/探针产物写 `%TEMP%\docsys_chk\`；**绝不写工程根 `tmp/`**。
- SSE 协议只做**加法**（`confirm` 加 `scopes`、新增可选 `permission` 事件），不改既有事件语义；旧编排封口策略（R3-4/R3-5）不动。
- 会话级规则**不新增表**（复用 `agent_sessions.metadata`）；SQLite 下 update 返回值有假阴性，按"不抛异常即成功"判定。
- `ToolRegistry` 必须保持"策略未注入 → 行为同改造前"，否则既有测试环境全红。
- 提交归属：Agent 核心代码 + 计划 + 工作卡 → 主仓库 `D:/Dev/DocSys`（`devInt`）。
- 每期结束先跑全量护栏（不得低于 37 套 / **1409** 项）再提交，提交信息写清"验了什么"。
