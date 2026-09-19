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
- **P4（工具瘦身裁定 + 机制加固）— ✅ 完成并验证（2026-09-19）commit `8a776af35`**
  - 用户裁定下线 5 个：`rag_chat` `list_ai_models` `get_sys_config` `lock_doc` `unlock_doc`；保留 `backup_repos` `query_backup_status`
  - 工具 **27 → 22**（14R+13W → 10R+12W）；`DocSysClient` 同名方法保留（`DocSysCLI`/`SubAgent` 旧编排仍用，本轮不动）
  - `TestWriteTools` 断言 27→22 + 用例改写（→ 52 passed）
  - **store 黑名单清扫**：`AgentInitService.RETIRED_SKILL_IDS`（31 个 id）+ `purgeRetiredSkills()`（在拷贝前执行）→ 今后下线只需加 id
  - 验证：护栏 6 项全绿（52/55/29/26/30/55）；编译通过；重启 200；store 清扫实测（预置 `rag_chat`+`lock_doc` 残留 → 重启后递归删除，`java-expert` 保留）
  - 页面端到端：工具清单无那 5 个；写 `create_folder`/`delete_doc` 确认门正常；负向「锁定文件」→ 模型声明无此工具、未调用 ✓

## move_doc 底层功能修复（2026-09-20）—— 智能体"资料整理"的底层能力

### 根因（代码 + 实测取证）
realDoc 的 `docId` **不是数据库主键**，而是 `Path.getDocId(level, path+name)` 的派生值：
`docId = level*100000000000L + (path+name).hashCode() + 102147483647L`。而
`buildBasicDoc(vid, docId, pid, reposPath, path, name, …)` 在 **path 与 name 同时为空**时会把文档
**强制改写为仓库根目录**（`docId=0 / pid=-1 / level=-1`）——传入的 docId 被丢弃。

因此只带 `docId+dstPid` 的调用（正是模型 19/19 次的传参方式，audit_logs 已取证）会变成：
源文档/目标目录双双塔缩为仓库根 → 先 FORCE 锁住根目录(`key=vid_`)，再锁目标时命中"父目录已被锁定"
→ `lock dstDoc [] Failed` / `用户[Admin]正在移动文件[],请稍后重试!`。

### 两层修复
1. **服务端按 docId 反查（`BaseController.resolveRealDocByDocId`）**：解析链 = doc 表 → 文件名索引 →
   按 level 限定层级的文件系统枚举；每个候选都用 `Path.buildDocIdByName(level, path, name)` 重算校验。
   level 由 docId 反推（`floorDiv(docId - 99999999999, 1e11)`，已用 1435 组往返用例钉住）。
   `moveDoc`/`copyDoc`/`renameDoc`/`deleteDoc` 四个接口在缺少 path/name 时自动补全（**仅缺参时触发，UI 行为不变**）。
2. **工具层锁占用重试（`DocSysToolFactory.callWithLockRetry`）**：写操作在后台异步动作（版本库提交/推送/索引）
   完成前会一直持有 FORCE 锁，实测窗口 **0.6~1.0s**；"先建目录、立刻移入"必然撞上。
   按提示语"请稍后重试"识别为可重试，退避重试 6 次×500ms；真实错误（权限/不存在）不重试。

### 顺带加固
- **拒绝静默回落根目录**：解析失败时明确报错（"无法通过 docId=… 定位源文件（可能已被移动/重命名/删除）…"），
  不再报含糊的锁冲突；无 docId 也无 path/name 时直接提示缺定位信息（挡住"删根"风险）。
- **同位置守卫**：源与目标同一个 `path+name` 时提前报错，避免两个 FORCE 锁落在同一 key 上。
- **异步解锁用 try/finally 包住**（`executeCommonActionListAsyncEx` + `releaseDocLockQuietly`）：
  异步动作抛异常时也必须释放锁，并在解锁后仍残留 FORCE 锁时告警。

### 验证证据
- 新增护栏：`TestDocIdResolve` 11/11（docId 公式 + level 反解 1435 组 + 边界 hashCode）；
  `TestLockRetry` 9/9（标记识别/重试后成功/真实错误不重试/耗尽次数）；其余 6 项全绿（52/55/29/26/30/55）
- 工具层端到端（Java，走 Agent 同一代码路径）：`MoveToolE2E` **15/15**：建目录后立刻移动（重试成功）、
  移回根、docId-only 重命名、过期 docId → 明确报错（非锁错误）、docId-only 删除、磁盘无残留
- **Agent 页面端到端**（真实 LLM + 确认门）：`在仓库 5 建 AI整理测试 → 把 TTITrace 移进去` → 3 步工具调用
  （create_folder×2 + move_doc）全部批准并成功；反向 `移回根 + 删除空目录` → 2 步（move_doc + delete_doc）
  成功；磁盘核对 `TTITrace` 回到根目录、`AI整理测试` 已删、无残留

## 全阶段完成情况

P1 ✅ `a3b2da425` / P2 ✅ `7621521ca` / P3a ✅ `fcf727d5f` / P3b-读 ✅ `72963c8f0` / P3b-写 ✅ `f364529e4` / P4 ✅ `8a776af35`；文档 `92b81351c` / `a6ad776dd`
技能：37 → **7**（`ant-expert` `java-expert` `playwright` `browser_use` `web_search` `system_help` `banner`）；工具：35 定义 → **22**（10R+12W，另含条件工具 memory_*3/web_search/run_skill/attachment）

## 下一步

1. 提交 move_doc 修复（主仓库 `devInt`）
2. 可选后续：`list_docs` 的 4000 字截断（大目录返回被截断，模型无法解析；仓库 5 根目录 90+ 项必踩）
3. 可选后续：后端给"文档被锁占用"加错误码（现靠提示语"请稍后重试"判定，较脆弱）

## 未提交改动

- 主仓库 `devInt`：`BaseController`（resolver + 异步解锁 try/finally）/ `DocController`（4 接口按 docId 反查 + 定位守卫）/ `DocSysToolFactory`（锁占用重试）/ 新增 `TestDocIdResolve` + `TestLockRetry` + 本卡
- 已提交：P1 = `a3b2da425`；P2 = `7621521ca`；P3a = `fcf727d5f`；P3b-读 = `72963c8f0`；P3b-写 = `f364529e4`；P4 = `8a776af35`；UTF-8 修复 = `3c774d101`
- office 仓库：与本任务无关

## 生效约束

- 无前置提交要求；是否提交由用户决定（建议本任务分阶段提交，message 见各阶段完成时记录）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`。
- 运行期技能 store：dev = `C:\DocSysReposes\skills`（配置 `AgentSkillStorePath`），源码删除后必须手工清理同名目录。
