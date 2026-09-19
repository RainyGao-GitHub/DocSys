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
- P3b-写（11 个写类技能 + 删执行器）、P4 未开始。

## 下一步

1. 完成 P3b-读的 **Agent 页面端到端验证**（列仓库 / 列目录 / 搜索 / 读文件 → 确认走工具且结果正确）
2. P3b-写：`add_doc` `create_repos` `delete_repos` `delete_doc` `rename_doc` `move_doc` `copy_doc` `backup_repos` `lock_doc` `unlock_doc` `share_doc` + 删 `DocSysSkillExecutor` 及其实例 client + 清死代码；做完同样要页面验证
3. P4：工具瘦身裁定（`rag_chat` `list_ai_models` `get_sys_config` `backup_repos` `query_backup_status` `lock_doc` `unlock_doc`）+ store 清理机制 +（可选）免 HTTP 直调门面评估

## 未提交改动

- 主仓库 `devInt`：P3b-读 代码改动（`SkillManager` / `EnhancedSkillManager` / `DocSysSkillExecutor` / `ExternalSkillExecutor` + 11 个技能目录删除）+ 文档（计划 P3b / 本卡）；另含上一轮未提交的 §2.5 文档改动
- 已提交：P1 = `a3b2da425`；P2 = `7621521ca`；P3a = `fcf727d5f`；UTF-8 编码修复 = `3c774d101`（用户此前提交）
- office 仓库：与本任务无关

## 生效约束

- 无前置提交要求；是否提交由用户决定（建议本任务分阶段提交，message 见各阶段完成时记录）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`。
- 运行期技能 store：dev = `C:\DocSysReposes\skills`（配置 `AgentSkillStorePath`），源码删除后必须手工清理同名目录。
