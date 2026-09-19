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

- **P1 死代码/垃圾清理 — ✅ 完成（2026-09-19）**
  - 删 `DocSysToolFactory.aiChat`（未注册死定义）、`get_banner_config`（注册+定义；client/端点保留给 CLI 与 Banner.js）
  - 删技能目录 `darwin-eval`（无 skill.md）、`backup_repo`（与 backup_repos 重复，且不在任何白名单）——仓库与运行期 store 均已删
  - 实测：工具 **28→27**；`/skills` **37→36**；护栏 TestWriteTools 58/0（断言同步为 27）、TestAgentSearchWriteTools 55/0、TestToolRegistry 29/0、TestUserMemoryTools 26/0、TestWebSearchTool 30/0；重启 dev Tomcat 后 200 复验
  - 未做：`test-skill/` 去留待用户裁定
- P2/P3/P4 未开始。

## 下一步

1. 用户确认后进入 **P2**：下线 `download_doc` / `upload_doc` / `ai_chat`（目录 + 两个 Manager 注册 + 两处白名单 + `DocSysSkillExecutor` 分发与 handler + store 清理 + 遗留引用）
2. 每阶段完成后按里程碑约定更新本卡与计划勾选

## 未提交改动

- 主仓库 `devInt`：本任务改动（`devDocs/Agent技能与工具清理计划.md`、本卡、`CLAUDE.md` 指针、`DocSysToolFactory.java`、`TestWriteTools.java`、技能目录删除）——尚未提交
- 此前遗留未提交：`SkillManager/EnhancedSkillManager/ExternalSkillExecutor/SkillScriptParser` 的 UTF-8 编码修复（2026-09-19，ant-expert 乱码）
- office 仓库：与本任务无关

## 生效约束

- 无前置提交要求；是否提交由用户决定（建议本任务分阶段提交，message 见各阶段完成时记录）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`。
- 运行期技能 store：dev = `C:\DocSysReposes\skills`（配置 `AgentSkillStorePath`），源码删除后必须手工清理同名目录。
