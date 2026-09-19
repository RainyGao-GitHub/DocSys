# Agent 技能与工具清理计划（定稿 2026-09-19）

> 背景：Agent 代码已并入 DocSys 主仓库（同进程），早期为"进程外 Agent"设计的 DocSys-API 类技能，已可用工具（Java 直连 `DocSysClient` → REST）替代。本计划把"工具/技能"两套能力面收敛：**DocSys 自有能力走工具，技能体系保留给外部/可进化插件**。
> 跟踪工作卡：`CURRENT_STATE_agent技能与工具清理.md`。

## 0. 原则（用户 2026-09-19 确认）

1. 工具是给智能体的**仓库与文件基本能力**（查找 / 增 / 删 / 读 / 写）；非基本能力（运维、展示、会话管理）一律不进工具表。
2. DocSys-API 类技能与工具**不要两份**；同名时保留工具。
3. 技能体系保留用途：外部插件（Python/CLI/LLM 引导）、自主进化产物、技能市场/可见性元数据。
4. 不绕开 REST：工具继续走 `DocSysClient`（带用户 session → controller 层鉴权），**不改**为直调 Service。

## 1. 工具清单（35 个定义 = 28 常驻 + 6 条件 + 1 死代码）

| 分组 | 工具 | 处置 |
|---|---|---|
| 核心查找/读（8） | `list_repos` `get_repos` `list_docs` `get_doc` `get_doc_history` `search_files` `grep_files` `get_login_user` | 保留 |
| 核心增删改写（7） | `create_folder` `write_file` `write_note` `delete_doc` `rename_doc` `move_doc` `copy_doc` | 保留 |
| 仓库管理（3） | `create_repos` `delete_repos` `update_repos` | 保留 |
| 分享（2） | `create_doc_share` `get_doc_share_list` | 保留（替代 download 的"生成下载链接"） |
| 框架（6） | `attachment` `run_skill` `memory_set/get/list` `web_search` | 保留 |
| **P1 删除（1）** | `get_banner_config`（`DocSysToolFactory:44` 注册 + `:254-262` 定义） | **删**（banner 属展示，不进工具表） |
| **P1 删除（1，死代码）** | `ai_chat` 定义（`DocSysToolFactory:302-317`，从未注册，`TestWriteTools:148` 断言不注册） | **删** |
| 待裁定（7） | `rag_chat`、`list_ai_models`、`get_sys_config`、`backup_repos` + `query_backup_status`、`lock_doc`、`unlock_doc` | **P4 裁定** |

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

> ⚠️ `lock_doc` `unlock_doc` `share_doc` `status` `system_help` `test-skill` `backup_repo` **不在任何内置白名单内**（两个 executor 的 `BUILT_IN_SKILL_IDS` 都没有），实际走"目录技能 → 外部策略 2（CLI `docsys …`）"，而该 CLI 命令在本环境不存在 → 执行必失败。删除无功能损失。

### S2 无工具、建议删/不暴露（3，P3）

`user_login` `user_logout`（会话由页面管理）、`status`（会话状态，用 `get_login_user` 即可）

### S3 保留（8）

`system_help`（帮助技能，保留）、`banner`（欢迎横幅，保留或并入 UI）、`test-skill`（E2E 测试件，**待定**：全仓库仅其自身 skill.md 引用）、`ant-expert` `java-expert`（外部插件）、`playwright` `browser_use` `web_search`（外部能力；`web_search` 另有 T8.4 工具版，两版并存待 P4 一并裁定）

### S4 非技能待清理（1，P1）

`darwin-eval/`（只有 `EVALUATE.md`，无 skill.md，不构成技能）

### 无文件的 Java 内置注册（同步删）

- `SkillManager.loadBuiltInSkills()`：27 条（list_repos … browser_use）
- `EnhancedSkillManager`：9 条（`setId`：list_repos / create_repos / delete_repos / list_docs / search_doc / upload_doc / download_doc / whoami / chat）

## 3. 阶段计划

### P1 死代码 / 垃圾清理（零行为变化）— ✅ 完成（2026-09-19）

- [x] 删 `DocSysToolFactory.aiChat`（原 `:302-317`，未注册的死定义）
- [x] 删 `get_banner_config`（原 `:44` 注册 + `:254-262` 定义）；`DocSysClient.getBannerConfig` 与后端端点保留（`DocSysCLI` / `Banner.js` 仍用）
- [x] 删 `WebRoot/WEB-INF/skills/darwin-eval/` 与 `WebRoot/WEB-INF/skills/backup_repo/`（+ 运行期 store 同名目录）
- [x] `test-skill/` 去留**待定**（未删；全仓库仅其自身 skill.md 引用）
- **实测验收**：工具 28 → **27**（`ToolChk` 打印，`get_banner_config` 已不在）；`/skills` 37 → **36**（`backup_repo` 消失、`backup_repos` 保留）；护栏 `TestWriteTools 58/0`（断言 size 28→27 已同步）、`TestAgentSearchWriteTools 55/0`、`TestToolRegistry 29/0`、`TestUserMemoryTools 26/0`、`TestWebSearchTool 30/0`；重启 dev Tomcat 后 HTTP 200 复验通过
- 目录计数：仓库技能目录 38 → 36；store `C:\DocSysReposes\skills` 37（36 技能 + `data`）

### P2 已定 3 技能下线

`download_doc` / `upload_doc` / `ai_chat`：
- [ ] 目录（`WebRoot/WEB-INF/skills/<id>/`）+ 运行期 store
- [ ] `SkillManager` 内置注册（`:110` dd、`:126` ai_chat）+ `EnhancedSkillManager`（`:114/115/117` 与 `setId` 方法）
- [ ] 两处 `BUILT_IN_SKILL_IDS`
- [ ] `DocSysSkillExecutor`：分发（`:151/157-158`）+ handler（`:581` handleDownloadDoc、`:666` handleChat）
- [ ] 遗留引用清理（可选）：`SubAgent`、`MainAgent`、`LLMIntentParser`
- 验收：`run_skill` 这 3 个 id → "No executor found"；`/skills` 再减 3

### P3 同名技能大去重（S1 23 个 + S2 3 个）

逐项同步（每个技能 6 处）：目录 / `SkillManager` 注册 / `EnhancedSkillManager` 注册 / `DocSysSkillExecutor` 白名单+分发+handler / `ExternalSkillExecutor` 白名单 / store 副本。
- 验收：`/skills` 只剩插件类；真实对话回归"找/读/写/移/删"；护栏全绿

### P4 工具瘦身裁定 + 机制加固

- [ ] 裁定：`rag_chat` `list_ai_models` `get_sys_config` `backup_repos` `query_backup_status` `lock_doc` `unlock_doc` `web_search`（技能版）
- [ ] store 清理机制：下线 id 黑名单 / 升级清理（`AgentInitService` 是"已存在跳过"的单向拷贝，老环境副本清不掉）
- [ ] 文档与 repo 记忆更新

## 4. 固定联动点与已知坑

1. 两处 `BUILT_IN_SKILL_IDS` 必须同步；只删一处会出现"白名单不认 → 落到外部目录 → 又按目录技能加载回来"。
2. 删除只删目录文件无效：`SkillManager`/`EnhancedSkillManager` 里还有 Java 注册（帮助列表仍显示）。
3. 运行期 store：dev = `C:\DocSysReposes\skills`（`AgentSkillStorePath` 配置）；源码删除不会同步清理。
4. 重编译 → 重启 dev Tomcat（`docsys_restart.bat` 已修复）→ 复验 `/skills`。
5. 护栏基线：T9/T10 之后全量 409 项；本计划只应减少技能/工具，不应破坏既有断言（`TestWriteTools` 等不断言全量列表）。
