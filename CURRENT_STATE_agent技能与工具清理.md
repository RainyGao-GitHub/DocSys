# CURRENT_STATE — Agent 技能与工具清理（工作卡）

> 本文件是会话恢复协议第 1 步（见 `CLAUDE.md`）。本卡是「Agent 技能与工具清理」任务的唯一定义处。
> 方案全文（清单 + 阶段）：`devDocs/Agent技能与工具清理计划.md`（2026-09-19 定稿）。

## 当前任务

把 Agent 的"工具 / 技能"两套能力面收敛：DocSys 自有能力走工具，技能体系只保留外部/可进化插件。按计划分 P1-P4 阶段推进，逐阶段验收。

## 用户定稿决策（2026-09-19）

- **P1 死代码清理**：删 `DocSysToolFactory.aiChat`（未注册的死定义）、删 `get_banner_config` 工具、删 `darwin-eval/`（无 skill.md）、删 `backup_repo/`（与 backup_repos 重复）；`test-skill/` 去留待定。
- **P2 删除 3 个 DocSys 技能**：`download_doc`（改用 `create_doc_share` 生成下载链接）、`upload_doc`（附件+入库已覆盖，且其 CLI 需本地文件路径=死链路）、`ai_chat`（Agent 自身即 chat）。
- **P3 大去重**：S1 23 个同名技能 + S2（`user_login`/`user_logout`/`status`）下线。
- **P4 工具瘦身裁定**：`rag_chat` `list_ai_models` `get_sys_config` `backup_repos` `query_backup_status` `lock_doc` `unlock_doc` `web_search`(技能版)，以及 store 清理机制。
- 原则：工具只服务"仓库/文件基本能力（查找/增/删/读/写）"；不绕开 REST（继续用 `DocSysClient` 走鉴权）。

## 必读上下文（续接锚点）

- `devDocs/Agent技能与工具清理计划.md` → §2 清单、§3 阶段、§4 联动点
- 相关实现：`src/com/DocSystem/agent/tool/DocSysToolFactory.java`（工具定义）、`src/com/DocSystem/agent/skill/SkillManager.java` 与 `EnhancedSkillManager.java`（技能注册）、`src/com/DocSystem/agent/skill/executor/{DocSysSkillExecutor,ExternalSkillExecutor,SkillExecutorRegistry}.java`（执行）
- 编译/部署约定见 `CLAUDE.md`；dev 环境见 `devDocs/本地开发Tomcat部署与启动指南.md`

## 当前进展

- **P1 死代码/垃圾清理 — ✅ 完成（2026-09-19，已提交 `a3b2da425`）**
  - 删 `DocSysToolFactory.aiChat`（未注册死定义）、`get_banner_config`（注册+定义；client/端点保留给 CLI 与 Banner.js）
  - 删技能目录 `darwin-eval`（无 skill.md）、`backup_repo`（与 backup_repos 重复）、`test-skill`（用户裁定删除）——仓库与运行期 store 均已删
  - 实测：工具 **28→27**；`/skills` **37→36→（删 test-skill）35**；护栏全绿；重启 dev Tomcat 后 200 复验
- **P2 下线 3 个 DocSys 技能 — ✅ 完成（2026-09-19，已提交 `7621521ca`）**
  - `download_doc` / `upload_doc` / `ai_chat`：目录 + store 删除；`SkillManager` 内置注册、`EnhancedSkillManager` 三个 `create*Skill` 方法、两处 `BUILT_IN_SKILL_IDS`、`DocSysSkillExecutor` 分发与 handler（`handleDownloadDoc`/`handleChat`）全部移除
  - 实测：`/skills` **35 → 32**（三个 id 均消失，`rag_chat`/`system_help` 保留）；工具 27 不变；护栏 6 项全绿（58/55/29/26/30/55）；重启后 200
  - 遗留：`SubAgent`/`MainAgent`/`LLMIntentParser` 的旧编排分支未动（不依赖技能注册表，P4 可选清理）
- **P3a（S2 试点）— ✅ 完成（2026-09-19，已提交 `fcf727d5f`）**
  - `user_login` / `user_logout`：目录+store、`SkillManager` 注册、两处白名单（含 `login`/`logout` 别名）、`DocSysSkillExecutor` 分发 + `handleLogin`/`handleLogout` 均移除
  - `status`：仅目录+store（本就不在任何白名单）
  - 实测：`/skills` **32 → 29**；工具 27；护栏 6 项全绿（58/55/29/26/30/55）；重启后 200
- **身份与权限核查 — ✅ 完成（2026-09-19，写入计划 §2.5）**
  - 工具通道：身份 = **HttpSession 的 `login_user`**，经 `copyWithSession(jsessionid)` 带 cookie，后端按该用户 `ReposAccess` 鉴权（实测：无 cookie → "用户未登录"；带 cookie → ok）
  - 技能（内置 handler）通道：**无身份**（`DocSysSkillExecutor` 单例 client 构造期 new、`AgentContext` 无 cookie）→ DocSys 调用一律失败
  - 结构风险：该单例 client 一旦被写 cookie 就跨用户冒用（历史触发点 `user_login` 已删，触发点消除、结构未消除）→ **P3b 要删该执行器及其实例 client**
  - 另：`SKILL.md` 的 `permissions` 不参与鉴权（仅展示）；`checkSkillAccess` 只管技能可见性
- **P3b-读（只读组 11 个）— ✅ 代码完成 + 静态验证（2026-09-19）**
  - 下线：`list_repos` `repos_info` `list_docs` `get_doc` `doc_history` `list_models` `search_doc` `search_in_repo` `rag_chat` `whoami` `system_config`（目录+store、两个 Manager 注册、两处白名单+分发）
  - 静态实测：`/skills` **29 → 18**；工具 **27 不变**；护栏 6 项全绿（58/55/29/26/30/55）
  - 遗留死代码（无引用，待 P3b-写收尾清除）：`DocSysSkillExecutor` 的 10 个 handler + `EnhancedSkillManager` 的 4 个 `create*Skill`
  - ⏳ 浏览器端到端验证：进行中（用户要求每轮必做）
- **P3b-写（写组 11 个）— ✅ 完成并验证（2026-09-19）commit `f364529e4`**
  - 下线：`add_doc` `create_repos` `delete_repos` `delete_doc` `rename_doc` `move_doc` `copy_doc` `backup_repos` `lock_doc` `unlock_doc` `share_doc`（目录+store、SkillManager/EnhancedSkillManager 注册、两处白名单+分发）
  - **删除 `DocSysSkillExecutor` 的共享单例 `DocSysClient`**（含构造函数参数/import）→ 无参构造；彻底消除 §2.5 串号结构风险
  - **清死代码**：执行器 876 → 300 行（删全部 DocSys-API handler + NL/init 段）；`EnhancedSkillManager` 418 → 211 行（删 6 个 `create*Skill`）
  - 顺带移除不可达 id：`update_repos` `backup_status` `init-llm` `init-auth` `search_and_load` `generate_summary` `search_and_answer`
  - 验证（全部实测 PASS）：API `/skills` = **7**（ant-expert banner browser_use java-expert playwright system_help web_search）；帮助弹窗同样只显示 7 个；工具 **27 不变**；护栏 6 项全绿（58/55/29/26/30/55）；编译通过；重启后 200
  - **页面端到端**（重启后重登 Admin/Admin）：① 读=「列出所有仓库」→ 1 步 `list_repos` 工具调用；② 写=「在仓库 5 根目录创建文件夹 P3B验证」→ `create_folder` 工具 + 确认弹窗→批准→`新增成功 docId=102224210355`；③ 清理=「删除该文件夹」→ `delete_doc` + 确认弹窗→批准→`删除成功 status: ok`（无残留）
- **P4（工具瘦身裁定 + 机制加固）— ✅ 完成并验证（2026-09-19）**
  - 用户裁定下线 5 个：`rag_chat` `list_ai_models` `get_sys_config` `lock_doc` `unlock_doc`；保留 `backup_repos` `query_backup_status`
  - 工具 **27 → 22**（14R+13W → 10R+12W）；`DocSysClient` 同名方法保留（`DocSysCLI`/`SubAgent` 旧编排仍用，本轮不动）
  - `TestWriteTools` 断言 27→22 + 用例改写（→ 52 passed）
  - **store 黑名单清扫**：`AgentInitService.RETIRED_SKILL_IDS`（31 个 id）+ `purgeRetiredSkills()`（在拷贝前执行）→ 今后下线只需加 id
  - 验证：护栏 6 项全绿（52/55/29/26/30/55）；编译通过；重启 200；store 清扫实测（预置 `rag_chat`+`lock_doc` 残留 → 重启后递归删除，`java-expert` 保留）
  - 页面端到端：工具清单无那 5 个；写 `create_folder`/`delete_doc` 确认门正常；负向「锁定文件」→ 模型声明无此工具、未调用 ✓

## 全阶段完成情况

P1 ✅ `a3b2da425` / P2 ✅ `7621521ca` / P3a ✅ `fcf727d5f` / P3b-读 ✅ `72963c8f0` / P3b-写 ✅ `f364529e4` / P4 ✅（未提交）
技能：37 → **7**（`ant-expert` `java-expert` `playwright` `browser_use` `web_search` `system_help` `banner`）；工具：35 定义 → **22**（10R+12W，另含条件工具 memory_*3/web_search/run_skill/attachment）

## 下一步

1. 提交 P4（主仓库 `devInt`）
2. 遗留（与本轮清理无关，待裁定）：`move_doc` 工具失败根因（只传 docId+dstPid → 空 name/path → FSM 重复 FORCE 锁同键；方案 A/B/C）、FSM 失败释放自锁
3. 可选：后端级测试（TestBackupTools 类断言备份族）、提醒后续新增/下线工具要同步 `TestWriteTools` 计数

## 未提交改动

- 主仓库 `devInt`：P4 代码（`DocSysToolFactory` / `TestWriteTools` / `AgentInitService`）+ 文档（计划 §P4 / 本卡）
- 已提交：P1 = `a3b2da425`；P2 = `7621521ca`；P3a = `fcf727d5f`；P3b-读 = `72963c8f0`；P3b-写 = `f364529e4`；UTF-8 编码修复 = `3c774d101`（用户此前提交）
- office 仓库：与本任务无关

## 生效约束

- 无前置提交要求；是否提交由用户决定（建议本任务分阶段提交，message 见各阶段完成时记录）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`。
- 运行期技能 store：dev = `C:\DocSysReposes\skills`（配置 `AgentSkillStorePath`），源码删除后必须手工清理同名目录。
