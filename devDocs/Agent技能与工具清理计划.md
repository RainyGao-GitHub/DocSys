# Agent 技能与工具清理计划（定稿 2026-09-19）

> 背景：Agent 代码已并入 DocSys 主仓库（同进程），早期为"进程外 Agent"设计的 DocSys-API 类技能，已可用工具（Java 直连 `DocSysClient` → REST）替代。本计划把"工具/技能"两套能力面收敛：**DocSys 自有能力走工具，技能体系保留给外部/可进化插件**。
> 跟踪工作卡：`CURRENT_STATE_agent技能与工具清理.md`。

## 0. 原则（用户 2026-09-19 确认）

1. 工具是给智能体的**仓库与文件基本能力**（查找 / 增 / 删 / 读 / 写）；非基本能力（运维、展示、会话管理）一律不进工具表。
2. DocSys-API 类技能与工具**不要两份**；同名时保留工具。
3. 技能体系保留用途：外部插件（Python/CLI/LLM 引导）、自主进化产物、技能市场/可见性元数据。
4. 不绕开 REST：工具继续走 `DocSysClient`（带用户 session → controller 层鉴权），**不改**为直调 Service。

## 1. 工具清单（初始 35 个定义 = 28 常驻 + 6 条件 + 1 死代码 → **P4 后 22 常驻 + 6 条件**）

> 当前实际：**22 常驻**（10 读 + 12 写）+ 6 条件（`attachment` `run_skill` `web_search` `memory_set/get/list`）。下文"处置"列是**初始裁定记录**，已全部执行。

| 分组 | 工具 | 处置 |
|---|---|---|
| 核心查找/读（8） | `list_repos` `get_repos` `list_docs` `get_doc` `get_doc_history` `search_files` `grep_files` `get_login_user` | 保留 |
| 核心增删改写（7） | `create_folder` `write_file` `write_note` `delete_doc` `rename_doc` `move_doc` `copy_doc` | 保留 |
| 仓库管理（3） | `create_repos` `delete_repos` `update_repos` | 保留 |
| 分享（2） | `create_doc_share` `get_doc_share_list` | 保留（替代 download 的"生成下载链接"） |
| 框架（6） | `attachment` `run_skill` `memory_set/get/list` `web_search` | 保留 |
| **P1 删除（1）** | `get_banner_config`（`DocSysToolFactory:44` 注册 + `:254-262` 定义） | **删**（banner 属展示，不进工具表） |
| **P1 删除（1，死代码）** | `ai_chat` 定义（`DocSysToolFactory:302-317`，从未注册，`TestWriteTools:148` 断言不注册） | **删** |
| P4 已删（5） | `rag_chat`、`list_ai_models`、`get_sys_config`、`lock_doc`、`unlock_doc` | **已删**（用户 2026-09-19 裁定） |
| P4 保留（2） | `backup_repos`、`query_backup_status` | **保留**（运维价值 + 成对） |

使用证据（`audit_logs` 全量）：`move_doc` 38、`run_skill` 6、`create_folder` 4、`write_file` 4、`delete_doc` 2、`unlock_doc` 2、`memory_set` 1 —— 其余工具模型从未调用过。

## 2. 技能清单（38 个目录）

### S0 已定删除（3，P2）

| 技能 | 理由 | 替代 |
|---|---|---|
| `download_doc` | 后台可直接取内容；模型/用户不需要"下载"动作 | `create_doc_share` 分享链接 |
| `upload_doc` | 附件上传+入库已覆盖；SKILL.md 的 CLI 需要**本地文件路径**（模型拿不到）→ 该链路本就是死的 | `/agent/attachment*` |
| `ai_chat` | Agent 自身即 chat 能力；且存在未注册的死工具定义 | — |

### S1 与工具 1:1 重复，建议下线（23，P3）

`add_doc` `backup_repo` `backup_repos` `copy_doc` `create_repos` `delete_doc` `delete_repos` `doc_history` `get_doc` `list_docs` `list_models` `list_repos` `lock_doc` `move_doc` `rag_chat` `rename_doc` `repos_info` `search_doc` `search_in_repo` `share_doc` `unlock_doc` `whoami` `system_config`

> ⚠️ `lock_doc` `unlock_doc` `share_doc` `status` `system_help` `test-skill` `backup_repo` **不在任何内置白名单内**（两个 executor 的 `BUILT_IN_SKILL_IDS` 都没有）；`repos_info` 另有问题：**别名写成连字符**（`repos-info`）而技能 id 是下划线（`repos_info`）—— 见下方「更正」。
>
> **更正（2026-09-19 核查）**：
> 1. `repos_info` **有 Java 实现**（`DocSysSkillExecutor.handleGetRepos`），但白名单/分发只列了 `get_repos` 与 `repos-info`（`DocSysSkillExecutor.java:72/125`、`ExternalSkillExecutor.java:67`）→ 技能 id `repos_info`（下划线，来自目录名与 frontmatter）**匹配不上**，`run_skill("repos_info")` 落到外部策略。
> 2. **外部策略在本部署整体不可执行**（已逐一核查技能目录 + 运行期 store）：**无一个目录含 `__main__.py` 或 `agent.md`**，环境也**没有 `docsys` CLI** → 策略1/2/3 全失败（`All three strategies failed for skill 'x'`）。
> 3. 推论：凡不在白名单的技能 = **纯清单条目**（只有帮助列表/技能市场可见，不可执行）——包括 `repos_info` `lock_doc` `unlock_doc` `share_doc`，以及文档型 `ant-expert` `java-expert`（这也说明 ant-expert 当年的乱码只影响帮助列表显示，与执行无关）。删除这些条目无行为损失。
> 4. 若日后要让外部技能真可执行，需补齐资产（安装 `docsys` CLI，或在技能目录提供 `__main__.py`（Python 策略）/ `agent.md`（LLM 引导策略））——属独立课题，不在本计划范围。

### S2 无工具、建议删/不暴露（3，P3a 已删）

`user_login` `user_logout`（会话由页面管理）、`status`（会话状态，用 `get_login_user` 即可）—— 2026-09-19 已下线，见 P3a。

### S3 保留（8）

`system_help`（帮助技能，保留）、`banner`（欢迎横幅，保留或并入 UI）、`test-skill`（E2E 测试件，**待定**：全仓库仅其自身 skill.md 引用）、`ant-expert` `java-expert`（外部插件）、`playwright` `browser_use` `web_search`（外部能力；`web_search` 另有 T8.4 工具版，两版并存待 P4 一并裁定）

### S4 非技能待清理（1，P1）

`darwin-eval/`（只有 `EVALUATE.md`，无 skill.md，不构成技能）

### 无文件的 Java 内置注册（同步删）

- `SkillManager.loadBuiltInSkills()`：27 条（list_repos … browser_use）
- `EnhancedSkillManager`：9 条（`setId`：list_repos / create_repos / delete_repos / list_docs / search_doc / upload_doc / download_doc / whoami / chat）

## 2.5 技能通道的身份与权限（2026-09-19 核查，结论：**技能通道无身份**）

### 身份机制（工具通道是正确的）
- 身份来源不是 HTTP，而是 **HttpSession 里的 `login_user` 属性**；HTTP 只是 `JSESSIONID` 的载体
- 链路：`AgentController:276` `request.getSession().getId()` → `MainAgent:221` `copyWithSession(jsessionid, username)`（`DocSysClient:1122` 写入 `Cookie: JSESSIONID=…`）→ `runToolUseLoop(..., client, ...)`（javadoc："per-request DocSysClient（会话隔离）"）→ 后端 `BaseController:579` `session.getAttribute("login_user")` → `checkAndGetAccessInfo`（`:8348`）构造 `ReposAccess(authMask)` → `checkUserDeleteRight` / `checkUserAddRight` / `checkUserAccessPwd`
- ⚠️ `copyWithSession(jsessionId, username)` 的 `username` **不参与鉴权**（仅日志/展示），真实身份由 cookie 决定
- 实测（`%TEMP%\docsys_chk\IdProbe.java`，2026-09-19）：无 cookie → `{"msgInfo":"用户未登录","status":"fail"}`；带浏览器 JSESSIONID → `status:ok` + 完整仓库列表

### 技能（内置 handler）通道：无身份
- `DocSysSkillExecutor` 的 client 构造期 new 一次（`:53/59`），`run_skill` 传入的 `AgentContext` 只带 sessionId/userId/username/role（无 cookie/client），也没有 per-request 注入 setter
- ⇒ DocSys 内置技能的 HTTP 调用在真实运行中一律"用户未登录"（功能失效，非越权）

### 结构风险：共享单例 client 的 cookie 串号
- 该 client 是 Spring 单例：一旦有代码写入 cookie（`login()` 在 `DocSysClient:88` 写 `this.sessionCookie`；`setSessionCookie` `:1102`），后续**所有用户**经此执行器的请求都会带那把 cookie → 以他人身份执行
- 历史触发点：`user_login` 技能（P3a 已删）。现状：现存 `.login(` 仅 `DocSysCLI:161` 与 `SubAgent:279`（均为 per-request client）→ **触发点已消除，结构未消除**
- 决策：P3b 删除 `DocSysSkillExecutor` 及其实例 client（或至少改为 per-request 注入）

### 技能"权限声明"不生效
- `Skill.getPermission()` 仅用于 `/skills` 展示（`AgentController:1577`），**不参与鉴权**
- `ExternalSkillExecutor.checkSkillAccess`（`:204/250`）只校验技能可见性（PRIVATE/TENANT/PUBLIC），**不校验文档级权限**
- ⇒ 技能侧没有细粒度权限保护；真保护只在后端 controller，而技能通道拿不到身份去触发它

### 外部技能通道（供参考）
- `ExternalSkillExecutor.injectEnvVars` 注入 `DOCSYS_SESSION`（= `context.getSessionId()`）/`DOCSYS_USER`/`DOCSYS_PASSWORD` → 理论上有身份
- 但 `context.getSessionId()` 语义漂移（既当 jsessionid 又当附件会话键），且当前无 `__main__.py`/agent.md/CLI 资产 → 未验证；若复活外部技能，须先把该字段明确定义为 HttpSession id

### 若将来做"免 HTTP 直调"
- 只在"**门面 + 显式 User**"形态下做：Controller 从 session 取 `User`、Agent 从同一 session 取同一个 `User`，两边共用业务实现
- 必须补齐 controller 的鉴权链（`checkAndGetAccessInfo` / shareId / authMask / docPwd / 锁 / 审计）——"身份正确"的保障从容器转移到调用方

## 3. 阶段计划

### P1 死代码 / 垃圾清理（零行为变化）— ✅ 完成（2026-09-19）

- [x] 删 `DocSysToolFactory.aiChat`（原 `:302-317`，未注册的死定义）
- [x] 删 `get_banner_config`（原 `:44` 注册 + `:254-262` 定义）；`DocSysClient.getBannerConfig` 与后端端点保留（`DocSysCLI` / `Banner.js` 仍用）
- [x] 删 `WebRoot/WEB-INF/skills/darwin-eval/` 与 `WebRoot/WEB-INF/skills/backup_repo/`（+ 运行期 store 同名目录）
- [x] `test-skill/` 去留**待定**（未删；全仓库仅其自身 skill.md 引用）
- **实测验收**：工具 28 → **27**（`ToolChk` 打印，`get_banner_config` 已不在）；`/skills` 37 → **36**（`backup_repo` 消失、`backup_repos` 保留）；护栏 `TestWriteTools 58/0`（断言 size 28→27 已同步）、`TestAgentSearchWriteTools 55/0`、`TestToolRegistry 29/0`、`TestUserMemoryTools 26/0`、`TestWebSearchTool 30/0`；重启 dev Tomcat 后 HTTP 200 复验通过
- 目录计数：仓库技能目录 38 → 36；store `C:\DocSysReposes\skills` 37（36 技能 + `data`）

### P2 已定 3 技能下线 — ✅ 完成（2026-09-19）

`download_doc` / `upload_doc` / `ai_chat`：
- [x] 目录（`WebRoot/WEB-INF/skills/<id>/`）+ 运行期 store（两个都删）
- [x] `SkillManager` 内置注册（`download_doc`、`ai_chat`）+ `EnhancedSkillManager`（`createUploadDocSkill` / `createDownloadDocSkill` / `createChatSkill` 注册与定义均删）
- [x] 两处 `BUILT_IN_SKILL_IDS`（含 chat 别名组：`chat`/`ai-chat`/`ask`/`ai_chat`）
- [x] `DocSysSkillExecutor`：分发分支 + handler（`handleDownloadDoc` / `handleChat`）删除
- [ ] 遗留引用未动（保留）：`SubAgent`（101/191/628、200/702）、`MainAgent`（991/1090/1235）、`LLMIntentParser`——旧编排自有直调路径，不依赖技能注册表（P4 可选）
- **实测**：`/skills` **35 → 32**（`download_doc`/`upload_doc`/`ai_chat` 均消失；`rag_chat`/`system_help` 保留）；工具 27 不变；护栏 TestWriteTools 58/0、TestAgentSearchWriteTools 55/0、TestToolRegistry 29/0、TestUserMemoryTools 26/0、TestWebSearchTool 30/0、TestToolCallParser 55/0；重启 dev Tomcat 后 200 复验
- 未运行时验证（代码级确认）：`run_skill` 对这 3 个 id 现应返回 "No executor found for skill"

### P3 同名技能大去重（S1 23 个 + S2 3 个）

逐项同步（每个技能 6 处）：目录 / `SkillManager` 注册 / `EnhancedSkillManager` 注册 / `DocSysSkillExecutor` 白名单+分发+handler / `ExternalSkillExecutor` 白名单 / store 副本。

#### P3a S2 试点 — ✅ 完成（2026-09-19）

- [x] `user_login` / `user_logout`：目录+store；`SkillManager` 内置注册；两处 `BUILT_IN_SKILL_IDS`（含 `login`/`logout` 别名）；`DocSysSkillExecutor` 分发 + `handleLogin`/`handleLogout`
- [x] `status`：仅目录+store（本就不在任何白名单，无代码引用）
- **实测**：`/skills` **32 → 29**（三个 id 均消失，`whoami`/`system_help` 保留）；工具 27 不变；护栏 6 项全绿（58/55/29/26/30/55）；重启后 200
- 保留：`SubAgent.handleLogin/handleLogout`（旧编排自有路径，不依赖技能注册表；`DocSysClient.login/logout` 亦保留）

#### P3b-读 只读组 11 个 — ✅ 完成（2026-09-19，浏览器验证见下）

- 下线名单：`list_repos` `repos_info` `list_docs` `get_doc` `doc_history` `list_models` `search_doc` `search_in_repo` `rag_chat` `whoami` `system_config`
- [x] 目录 + 运行期 store（双删，每个 11 个）
- [x] `SkillManager` 内置注册（含整段 Search/AI-Chat/User 小节）+ `EnhancedSkillManager` 注册（`createListReposSkill`/`createListDocsSkill`/`createSearchDocSkill`/`createWhoamiSkill`）
- [x] 两处 `BUILT_IN_SKILL_IDS` 与 `DocSysSkillExecutor` 分发分支（含别名组 `list-repos`/`repos-info`/`get_doc_list`/`list-docs`/`doc-info`/`version-history`/`search`/`search-docs`/`chat-with-docs`/`ai-models`/`config`/`system-config`）
- ⏳ 遗留：`DocSysSkillExecutor` 里这些 id 的 handler 方法（`handleListRepos`/`handleGetRepos`/`handleGetDocList`/`handleGetDoc`/`handleDocHistory`/`handleSearchDoc`/`handleRagChat`/`handleListAiModels`/`handleWhoami`/`handleGetConfig`）与 `EnhancedSkillManager` 的 4 个 `create*Skill` 现已**无引用**（死代码），待 P3b-写收尾或删除执行器时一并清除
- **静态实测**：`/skills` **29 → 18**；工具 **27 不变**（`list_repos`/`get_doc`/`get_doc_history`/`search_files`/`rag_chat`/`get_sys_config` 均在）；护栏 6 项全绿（58/55/29/26/30/55）；目录计数：仓库 29→18、store 30→19

#### P3b-写 写组 11 个 — ✅ 完成并验证（2026-09-19，commit `f364529e4`）

- 名单：`add_doc` `create_repos` `delete_repos` `delete_doc` `rename_doc` `move_doc` `copy_doc` `backup_repos` `lock_doc` `unlock_doc` `share_doc`
- 保留（共 7）：`ant-expert` `java-expert` `playwright` `browser_use` `web_search` `system_help` `banner`
- [x] 目录 + 运行期 store（11 个双删）
- [x] `SkillManager` 内置注册（Repository/Document 两节全清，仅剩 system_help + web 3 个）+ `EnhancedSkillManager` 注册
- [x] 两处 `BUILT_IN_SKILL_IDS` + `DocSysSkillExecutor` 分发分支（含 `add_repos`/`create-repos`/`delete-repos`/`update_repos`/`backup`/`backup_status`/`create-doc`/`add-document`/`delete-document`/`rename-doc`/`move-doc`/`copy-doc` 等别名）
- [x] **删除 `DocSysSkillExecutor` 的共享单例 `DocSysClient`**（字段 + 构造函数参数 + import）→ 构造器变为无参（`@Autowired public DocSysSkillExecutor()`），彻底消除 §2.5 的串号结构风险
- [x] **清死代码**：`DocSysSkillExecutor` 删了所有 DocSys-API handler（USER/REPOS/DOCS/SEARCH/BACKUP/SYSTEM-config + NATURAL-LANGUAGE + init 段；876 → 300 行）；`EnhancedSkillManager` 删了 6 个 `create*Skill`（418 → 211 行）
- [x] 顺带清理：`update_repos` / `backup_status` / `init-llm` / `init-auth` / `search_and_load` / `generate_summary` / `search_and_answer` 等**无目录、无注册、不可达**的 DocSys 白名单 id 一并移除（避免残留死入口）
- **实测全绿**：API `/skills` **18 → 7**（`ant-expert` `banner` `browser_use` `java-expert` `playwright` `system_help` `web_search`）；帮助弹窗仅显示这 7 个；工具 **27 不变**；护栏 6 项全绿（58/55/29/26/30/55）；编译通过，重启后 200
- **页面端到端**（重启后重登）：① 读「列出所有仓库」→ 1 步 `list_repos`；② 写「创建文件夹 P3B验证」→ `create_folder` + 确认弹窗（“此操作将执行写操作 [create_folder]”，拒绝/批准执行）→ 批准 → 新增成功；③ 清理删除 → `delete_doc` + 确认弹窗 → 批准 → 删除成功，无残留

### P4 工具瘦身裁定 + 机制加固 — ✅ 完成并验证（2026-09-19）

**用户裁定（2026-09-19）**：

| 工具 | 裁定 | 理由 |
|---|---|---|
| `rag_chat` (R) | **下线** | 与 Agent 自身推理 + `search_files`/`grep_files`/`get_doc` 重叠 |
| `list_ai_models` (R) | **下线** | 模型配置元信息，模型选择属对话层 |
| `get_sys_config` (R) | **下线** | 系统配置暴露给模型，收益低、风险面大 |
| `lock_doc` (W) | **下线** | 协作编辑语义的 2h FORCE 锁，失败不自解（`move_doc` 锁冲突故障直接诱因） |
| `unlock_doc` (W) | **下线** | 同上，成对 |
| `backup_repos` (W) | 保留 | 运维动作，"AI 运维助手"场景有真实价值 |
| `query_backup_status` (R) | 保留 | 与 `backup_repos` 成对 |

- [x] 5 个工具下线：`DocSysToolFactory` 注册 + 定义删（保留 `DocSysClient` 同名方法：`DocSysCLI:220` 用 `getDocSysConfig`、`SubAgent:728 handleRagChat` 仍走 `ragChat`——均属旧编排，本次不动）
- [x] 工具总数 **27 → 22**（14R+13W → **10R+12W**）；同步改 `TestWriteTools`（断言 27→22、删 3 条 rag_chat 用例、加 4 条"已下线"用例 → 52）
- [x] **store 黑名单清扫机制**（`AgentInitService`）：`RETIRED_SKILL_IDS`（31 个 id）+ `purgeRetiredSkills()`，在 `copyDefaultSkillsIfAbsent()` 之前执行——精确按 id 删运行期目录里的已下线技能，不动进化/自建技能；今后下线只需把 id 加进名单
- [x] 未动：免 HTTP 直调评估（yield，保持"经 REST"现状）
- **验证全绿**：护栏 6 项（52/55/29/26/30/55）；编译通过；重启 200
- **store 清扫实测**：预置 `C:\DocSysReposes\skills\rag_chat`（含 `references/` 子目录）与 `lock_doc` 两个残留 → 重启后两者均被递归删除，对照组 `java-expert` 保留；日志见 `delDir() delete Dir:C:\DocSysReposes\skills\rag_chat/references`
- **页面端到端**：① 问"列出现有工具" → 模型列 22 常驻 + memory_*/web_search/run_skill/attachment，**无** rag_chat/list_ai_models/get_sys_config/lock_doc/unlock_doc；② 写「创建 P4验证」→ `create_folder` + 确认门 → 新增成功；③ 负向：「帮我锁定仓库 5 里的文件」→ 模型明说"没有任何锁定工具"、**未调 lock_doc**（改用 `list_docs` 给目录）；④ 清理删除 → `delete_doc` + 确认门 → 删除成功，无残留

### P4 初始待办（存档）

- [x] 裁定：`rag_chat` `list_ai_models` `get_sys_config` `backup_repos` `query_backup_status` `lock_doc` `unlock_doc`（`web_search` 技能保留，与工具版并存不冲突）
- [x] store 清理机制：离线 id 黑名单（`AgentInitService.RETIRED_SKILL_IDS` + `purgeRetiredSkills()`）
- [x] （可选）"免 HTTP 直调"评估：只在"门面 + 显式 User"形态下做，且必须补齐 controller 鉴权链——见 §2.5；**本轮维持不做**
- [x] 文档与 repo 记忆更新

## 4. 固定联动点与已知坑

1. 两处 `BUILT_IN_SKILL_IDS` 必须同步；只删一处会出现"白名单不认 → 落到外部目录 → 又按目录技能加载回来"。
2. 删除只删目录文件无效：`SkillManager`/`EnhancedSkillManager` 里还有 Java 注册（帮助列表仍显示）。
3. 运行期 store：dev = `C:\DocSysReposes\skills`（`AgentSkillStorePath` 配置）；源码删除不会同步清理。
4. 重编译 → 重启 dev Tomcat（`docsys_restart.bat` 已修复）→ 复验 `/skills`。
5. 护栏基线：T9/T10 之后全量 409 项；本计划只应减少技能/工具，不应破坏既有断言（`TestWriteTools` 等不断言全量列表）。
