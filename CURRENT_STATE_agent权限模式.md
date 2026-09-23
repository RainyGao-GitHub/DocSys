# CURRENT_STATE — Agent 权限模式（工作卡）

建立于 2026-09-23。**本卡是当前任务的唯一定义处**（必读上下文 / 进展 / 下一步 / 生效约束）。
上一个任务（任务续接与轮数上限，P1~P3）已完成并全部提交，见 `CURRENT_STATE_agent任务续接与轮数上限.md`（该卡只作历史查询，不再续接；其 P4 为可选、待数据）。

## 当前任务

给 Agent 增加**权限模式**，解决"整理目录时每个移动/写入都要点一次确认、几十次点击全是'我知道这是安全的'"的确认疲劳：

- 计划（唯一口径来源）：`devDocs/Agent权限模式改造计划.md`
- 用户原话（本次触发）："我看 copilot 和 claude code 都是可以选权限模式的，比如整理目录过程中由于调用移动目录工具，所以需要不断的确认……"
- 状态：**P3 主体完成（全局开关 + 轮数预算 + 绝对保护可追加 + 提示词接入设置弹窗；服务端强制已实测；菜单置灰项待复验）**

## 用户定稿决策（2026-09-23）

| # | 项 | 裁定 |
|---|---|---|
| 1 | 档数 | **4 档**（首轮） |
| 2 | 授权作用域 | **只做会话级**（会话内规则，删除会话即失效；不落全局、不新增表） |
| 3 | 全部允许档可用性 | **可以**（默认允许；P3 加管理员全局开关，`false` 时 UI 不提供并服务端降级为 `auto`） |
| 4 | 硬清单 | **删除 / 权限变更**在“自动”档仍需确认；**但用户显式授权作用域后，该作用域内的删除/权限变更不再确认**（否则整理目录照样被打断）→ 判定优先级 **规则 > 硬清单 > 模式** |
| 5 | 新会话默认档 | **手动**（= 现状行为） |
| 6 | **档位改名（二次裁定）** | “只读”→**计划**；原“智能”→**自动**；原“自动”→**全部允许（Allow All）**。用户理由：自动与智能区别不明显、命名误导（原因：叫“自动”却对硬清单每次都问） |
| 7 | **计划模式带闭环（二次裁定）** | 按 Claude 的 plan 模式：写操作被拒 + 模型**输出可执行计划** → 用户「批准并执行」（切 `auto`）或「批准但逐步确认」（切 `manual`）→ 注入计划后继续执行。**并入 P1**（否则该档是死胡同） |
| 8 | 手动档是否提供“记住授权” | **不提供**（保持“每次都要确认”的纯粹语义；规则只在自动档产生） |
| 9 | **绝对保护（三次裁定）** | **删仓库（`delete_repos`）永远例外**：4 个档位下都要确认，**包括“全部允许”档**，且**会话规则也不能豁免**（风险过大）→ 判定优先级最顶格：**绝对保护 → 模式 → 硬清单 → 规则** || 10 | **技能调用 `run_skill`（四次裁定）** | **不解析调用内容**（外部技能=任意 Python/shell，静态分析不可靠、可绕过；两家业界亦如此）；改为**按技能声明的 `risk` 分级**：`safe` 跟随模式 / `write` 按硬清单规则 / `dangerous` 硬清单 / **未声明 = 绝对保护（fail-safe）**。参考：Claude Code 在 `SKILL.md` frontmatter 用 `allowed-tools` 做技能级静态声明；VS Code 按工具粒度 + 沙箱 + LLM judge。沙箱本轮不做（Non-goals）；LLM judge 放 P4 可选 |
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

- 基线（开工前）：**37 套 / 1409 断言 / 0 失败**；当前（P1）：**38 套 / 1490 项 / 0 失败**
- 现状行为：无模式概念；`needsConfirm` 工具**每次**都弹确认（`AuditWriteConfirmGate` 120s 超时）
- 编译：`%TEMP%\docsys_chk\do_compile.ps1 -Files "..."`（Spring 控制器加 `-Spring`）
- dev 环境：`C:\TomcatForDocSysDev\docsys` 8100，junction 挂载（静态即时生效，Java 需重编译 + 重启）

## 当前进展

1. ✅ 现状与代码锚点核对（计划 §1：唯一拦截点 + 门实现 + 前端弹窗 + 可复用的会话 metadata）
2. ✅ 业界参照核对（计划 §2：VS Code Manual/Assisted/Allow all + 会话级授权建议；Claude Code 6 种 `permission_mode` + allow/deny/ask 规则；Gemini CLI default/auto_edit/plan/yolo）
3. ✅ 用户 5 项裁定定稿（计划 §3；含"规则 > 硬清单 > 模式"的优先级）
4. ✅ 计划已排（`devDocs/Agent权限模式改造计划.md`）+ 本卡已建 + `CLAUDE.md` 会话恢复入口改指本卡（提交 `d4f5a142c`）
5. ✅ **用户二次裁定（2026-09-23）已并入计划**：档位改名（计划/手动/自动/全部允许）+ 计划模式闭环（并入 P1）+ 手动档不提供"记住授权"；计划 §0/§2/§3/§4/§5/§6 已按新口径重写（旧描述已删，不留过期结论）（提交 `49127d655`）
6. ✅ **用户三次裁定（2026-09-23）已并入计划**：`delete_repos` = **绝对保护**（4 档全问 + 规则不可豁免），已写入计划 §0 优先级、§3.1 四档表、§3.2 风险类别（新增 `ABSOLUTE`）、§3.3 规则边界、§4 验收 V8、§5 P1/P3、§7 风险
7. ⏳ **未开始编码**（用户明示：最终方案他再确认一遍后再开工）
8. ✅ **最终方案已确认（2026-09-23）**：技能调用按 `SKILL.md` 的 `risk` 声明分级、未声明 = 绝对保护（fail-safe）；不解析调用内容；沙箱列 Non-goals；LLM judge 放 P4 可选。计划 §2/§3.2.1/§4（V9）/§5/§6/§7 已同步
9. ▶ **P1 部分完成（2026-09-23，已编译 + 护栏全绿）**：
   - ✅ 新增 `agent/permission/`：`PermissionMode`（plan/manual/auto/allowAll，默认 manual）、`ToolRisk`（+`ABSOLUTE`）、`PermissionDecision`（ALLOW/ASK/DENY+reason）、`PermissionPolicy`（**纯函数**，求值序：绝对保护→计划档→规则→硬清单→模式默认）、`PermissionRule`（tool/dir(含子目录)/repo + JSON 往返）、`ToolRiskCatalog`、`SkillRiskRegistry`、`PermissionContext`、`PermissionStore`（会话级模式+规则，复用 `agent_sessions.metadata`，不新增表）
   - ✅ `ToolRegistry.execute()`：`needsConfirm` 分支改为三分支（`DENY`→计划模式文案；`ASK`→确认门；`ALLOW`→跳过门并把 `[Permission] mode/tool/risk/decision/reason` 写 docsys.log）；**策略 null 时行为同改造前**（既有路径/测试不受影响）
   - ✅ `MainAgent`：`buildToolLoop(..., sessionId)` 按会话读模式/规则注入 `PermissionContext`；计划模式 system prompt 段落（`PLAN_MODE_PROMPT`）；技能 risk 解析（`EnhancedSkillManager.getSkill(id).getRisk()` → `SkillRiskRegistry`，未声明 fail-safe）
   - ✅ 技能 risk 声明：`EnhancedSkill.risk` 字段 + `SkillParser` 解析 frontmatter `risk:`（原 `permissions:` 仍是空壳，未动）
   - ✅ 护栏：新增 `TestPermissionPolicy`（**66 项**：矩阵 4模式×4风险、绝对保护 4 档全 ASK 且规则不可豁免、计划档 DENY 优先于规则、规则覆盖硬清单、目录/仓库/工具匹配与路径规范化、技能 fail-safe、目录 fallback）；全量 **38 套 / 1475 项 / 0 失败**（基线 37/1409）
   - ⚠️ **实现偏差（已在计划外说明）**：风险类别用**集中目录** `ToolRiskCatalog`（+`ToolDefinition.riskClass` 可覆盖）而不是逐个改 12 个工具的 builder 链——因为 12 处 `.isWrite(true).needsConfirm(true)` 完全相同、逐个改易漏；安全性由"**未登记 = fail-safe 绝对保护**"兜住，并留护栏强制全覆盖（待做）
   - ⏳ **未完成（P1 剩余）**：页面 E2E 的 LLM 实跑（V1 计划档拒写 + 计划闭环 / V3 手动回归 / V4 自动档硬清单仍问 / V7 管理员禁用全部允许 / V9 技能分级）
10. ✅ **P1 前端 + 端点 + 护栏扩展（2026-09-23，提交 `93df21fea`）**：
   - 端点：`GET /agent/permission`（模式 + 4 档定义 + 已授权规则 + 绝对保护清单）、`POST /agent/permission/mode`、`POST /agent/permission/rules/clear`
   - 前端：顶部模式 chip（🛡 四档 + 计划/自动/全部允许 配色）+ 下拉菜单（档位说明 / 已授权条数 / 清空授权）+ 计划闭环页脚（「批准并执行」切 auto、「批准但逐步确认」切 manual）
   - 🐞 **E2E 暴露并已修**：切换模式后旧的 `loadPermission` 响应会把档位盖回去 → `localChangedAt` 时间戳丢弃过期响应
   - 护栏：`TestWriteConfirmGateCoverage` +15 项（风险登记全覆盖 + 模式判定真的作用在确认门上）；全量 **38 套 / 1490 项 / 0 失败**
   - 页面实测：端点返回 4 档 + `absoluteGuarded=["delete_repos"]`，POST 切换后服务端模式生效；JS 语法 0 错误
11. ✅ **P1 页面 LLM 实跑验收（2026-09-23 15:24~15:26）**：
   - **V1 计划档**：发“在 vid=1 根目录建文件夹 permTest” → 只调只读工具（list_docs/search_files）、**无 create_folder**、回答为“待批准的执行计划（本轮未做任何写操作）”，页面出现「批准并执行」/「批准但逐步确认」✓
   - **V2 计划闭环**：点「批准并执行」→ chip 变“自动模式” + 自动发“按计划执行” → `create_folder:success` 且 **0 弹窗**，回答“计划执行完毕”✓
   - **V4 自动档**：常规写（create_folder）→ `decision=ALLOW reason=mode(auto)` 0 弹窗；删除（delete_doc）→ `decision=ASK reason=hardlist(destructive)` 弹确认（文案含 vid/name）✓
   - **V7 全部允许档**：“建 permTest2 然后删掉” → 两步都 ALLOW（reason=mode(allowAll)）、**0 弹窗**✓；已测完即把模式改回手动
   - 日志主线：`[Permission][MODE]`（模式切换）+ `[Permission] mode=.. tool=.. risk=.. decision=.. reason=..`（每次写工具判定）
   - **V8 绝对保护**：为避免真删仓库，未做线上删除；由护栏 `TestPermissionPolicy`/`TestWriteConfirmGateCoverage` 覆盖（4 档全 ASK + 规则不可豁免）
   - **V9 技能 risk 分级**：由护栏覆盖（safe 跟随模式 / dangerous 硬清单 / 未声明 fail-safe 绝对保护）
   - 测试产物已清理：`permTest`（手动批准后删除）、`permTest2`（全部允许档下建+删）

## 下一步

**开 P1（模式骨架 + 四档基础行为 + 计划模式闭环 + 会话级存储 + 可见性）**，第一步动作按序：

1. 新增 `agent/permission/`：`PermissionMode`（`plan`/`manual`/`auto`/`allowAll`，默认 `manual`）/ `ToolRisk` / `PermissionDecision` / `PermissionPolicy`（**纯函数**，便于离线护栏）
2. `ToolDefinition` 加 `riskClass`（默认 `NORMAL`）+ Builder；`DocSysToolFactory` 按计划 §3.2 标注（删除/移动/改名/更新仓库/技能 = DESTRUCTIVE，外链分享 = PERMISSION）
3. `ToolRegistry.execute()`：`needsConfirm` 分支改为 `DENY → 错误` / `ASK → 门` / `ALLOW → 跳过门但记审计`；**策略为 null 时保持现状**（不破坏既有测试）
4. 会话级模式：请求带 `permissionMode` → 服务端校验 + 写 `agent_sessions.metadata.permissionMode`
5. **计划模式闭环**：`plan` 档的 DENY 文案 + system prompt 计划段落 + 前端「批准并执行」（切 `auto` + 注入计划）/「批准但逐步确认」（切 `manual`）
6. 前端：顶部模式 chip（4 档 + 全部允许档醒目色）
7. 护栏：新增 `TestPermissionPolicy`（4 模式 × 3 风险 × 规则矩阵）；改写 `TestWriteConfirmGateCoverage`
8. 编译 → 全量护栏 → 页面 E2E（V1~V4、V7、V8）→ 更新本卡 → 提交

## 未提交改动

- 无（P1 代码/前端/端点/护栏已随 `03f3df4a6`、`93df21fea` 提交；本卡随下一次提交收尾）
- 已提交：`d4f5a142c` / `49127d655` / `29ad82f4d` / `6d30dbf85`（文档）+ `03f3df4a6` / `93df21fea`（P1 代码）

## 下一步

**P3 剩余**：

1. 模式菜单“全部允许”置灰项复验（本次 E2E 实测服务端已正确拒绝，但页面探针读到 disabled=false，疑浏览器缓存旧页面 → 用 `?_v=` 强制刷新复验）
2. 技能 risk 的 UI（技能列表/详情显示 risk 与"未声明按绝对保护处理"；管理员声明入口）
3. 统计/审计：按模式的写操作分布、自动批准次数、规则命中次数
4. 待补：P2 观测项——“批准并记住”那次 delete_doc 结果为 failed（疑确认轮询与授权 POST 时序/120s 超时）

## P3 实施记录（2026-09-23）

- 全局配置（`agent_config`，仅管理员可改）：
  - `agent_permission_allow_all_enabled`（默认 true）：关闭 → **服务端把 allowAll 降级为 auto**（`PermissionConfig.applyAllowAllGate`）+ **拒绝切换接口**
  - `agent_absolute_guarded_extra`（逗号分隔）：**追加**绝对保护工具（`delete_repos` 为内置不可移除）
  - 顺带把既有但无 UI 的 `agent_max_turns`、`system_prompt_override`、`system_prompt_suffix` 一起接入设置弹窗
- 新端点：`GET/POST /agent/config/admin-permission`（GET 对非管理员只返回 isAdmin=false + allowAllEnabled；POST 仅管理员，键白名单 + 值校验）
- 前端：设置弹窗新增"管理员：权限与全局配置"分区（4 项 + 内置绝对保护只读展示）；模式 chip 下拉在开关关闭时把"全部允许"置灰并标"（管理员已禁用）"
- 护栏：`TestPermissionPolicy` 85 项（+11：开关降级/布尔与列表解析/非法工具名/追加绝对保护生效与可清空）；全量 **39 套 / 1524 项 / 0 失败**
- E2E（V7）：写入 `agent_permission_allow_all_enabled=false` 后
  - `POST /agent/permission/mode mode=allowAll` → **success=false "管理员已禁用「全部允许」档"** ✓
  - `GET /agent/permission` → `allowAllEnabled:false` ✓
  - 设置弹窗管理员分区正常（开关=禁用、轮数预算=25、内置绝对保护 delete_repos）✓
  - ⚠️ 菜单置灰探针读到 `disabled=false`（服务端已拒绝；疑浏览器缓存旧 index.html）—— 待复验
  - 验证后已把该配置键删除（恢复默认允许）

## P2 实施记录（2026-09-23）

- 判定层：**规则只在“自动”档生效**（手动档保持“每次都要确认”）；规则命中可覆盖硬清单，**不能豁免绝对保护**
- `ConfirmEventSink` 新增默认 4 参重载（带 args，旧实现无需改动）；确认事件现带 `scopes/vid/path/risk`
- 新端点 `POST /agent/permission/rule`（scope=tool|dir|repo + tool/vid/path + sessionId）
- 前端：确认弹窗在自动档显示作用域选择（该工具/该目录(含子目录)/该仓库）+「批准并记住」；工具卡片标注批准来源（手动确认 / 已授权规则(dir) / 自动档放行 / 全部允许）
- `PermissionTrace`（线程内痕迹）把判定结果传到 SSE 的 `tool_result.approval`
- 🐞 E2E 暴露并已修：confirm 事件的 `risk` 原用 `ToolRegistry.getInstance().find()` 反查 → 单例里没有每请求构建的工具 → 一律误判为 absolute（作用域提示语错误）；改为从 `PermissionTrace` 推导
- 护栏：`TestPermissionPolicy` 74 项（+8：手动档不适用规则、批准来源标注）+ 新增 `TestPermissionRules` 15 项（存取/去重/上限 50/清空/不破坏 title/策略效果与边界）
- 页面实测（16:02~16:06）：自动档建目录+写两文件 **0 弹窗**（卡片显示"自动档放行"）→ 删除 `permDir/a.txt` 弹窗 → 选"该目录"+批准并记住 → 规则入库 `目录 vid=1/permDir` → **删除同目录 b.txt 不再问**（`decision=ALLOW reason=rule(dir)`）→ **删除父目录下的 permDir 仍问**（规则不覆盖父目录）→ 新会话规则回到 0 条（V6）
- 观测：上述“批准并记住”那次 delete_doc 工具结果是 failed（未深究；同日后续同规则调用成功，已知可能原因：确认轮询与授权 POST 的时序/120s 超时）

## 技能调用口径（已定稿，实现要点）

- `run_skill` 的 risk = 按 `args.skillId` 查技能声明（不解析 params/脚本内容）
- 声明位置：`SKILL.md` frontmatter 新增 `risk: safe|write|dangerous|absolute`；`SkillParser` 现在对 `permissions:` 是空壳（`// Handle list`），一并做成真的
- **未声明 = 绝对保护**；内置只读技能（status/whoami/help…）声明 `safe` → 自动档不再弹
- P1 需核对：技能内部经注册表执行动作时是否受同一策略约束（内置 `DocSysSkillExecutor` 路径）

## 生效约束

- 本任务**是否需要先提交**：不需要（上一期已提交，工作区干净）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`；Spring 控制器必须 `-parameters -g`。
- 测试/探针产物写 `%TEMP%\docsys_chk\`；**绝不写工程根 `tmp/`**。
- SSE 协议只做**加法**（`confirm` 加 `scopes`、新增可选 `permission` 事件），不改既有事件语义；旧编排封口策略（R3-4/R3-5）不动。
- 会话级规则**不新增表**（复用 `agent_sessions.metadata`）；SQLite 下 update 返回值有假阴性，按"不抛异常即成功"判定。
- `ToolRegistry` 必须保持"策略未注入 → 行为同改造前"，否则既有测试环境全红。
- 提交归属：Agent 核心代码 + 计划 + 工作卡 → 主仓库 `D:/Dev/DocSys`（`devInt`）。
- 每期结束先跑全量护栏（不得低于 37 套 / **1409** 项）再提交，提交信息写清"验了什么"。
