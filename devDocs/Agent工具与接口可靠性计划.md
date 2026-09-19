# Agent 工具与接口可靠性计划

> 建立于 2026-09-20。本文是 **Agent 工具链待办的总清单**，避免遗漏；每项都带"现状/证据/方案/验收"，做完即勾选并记 commit。
> 关联：工作卡 `CURRENT_STATE_agent技能与工具清理.md`（会话恢复入口）、记忆 `/memories/repo/agent-tools.md`、`/memories/repo/agent-skill-tool-cleanup.md`。

## 0. 背景与目标

**触发**：修复 `move_doc`（commit `b5c85bf9f`）与 `list_docs`（commit `10f9e21f8`）时发现，缺陷不是孤立的，而是**成类出现**：

| 缺陷类型 | 已实证的实例 |
|---|---|
| **docId-only 调用塌缩**：服务端 `buildBasicDoc` 在 path+name 全空时把文档改写成仓库根，传入的 docId 被丢弃 | `move_doc`/`copy_doc`/`rename_doc`/`delete_doc`（已修）→ **`get_doc_history` 仍在**（静默返回"根目录历史"） |
| **原始 JSON 被 4000 字截断成半截**：`fmt()` 全局上限 4000，而 DocSys 接口单项动辄数百字符 | `list_docs`（已修）、**`list_repos`（日志实证：模型输出"接口返回在第 9 个后被截断"）** |
| **工具与接口对不上** | `create_doc_share` 指向**不存在**的端点；`get_doc_share_list` 描述/参数与接口语义**错位** |
| **失败无错误码**：`ReturnAjax` 只有 status/msgInfo/debugLog，工具靠**文案嗅探**判定 | `DocSysToolFactory.LOCK_BUSY_MARK = "请稍后重试"` |
| **未体检**：注册即广告给模型，但从未真实调用过 | `create_repos` `delete_repos` `update_repos` `backup_repos` `query_backup_status` `write_note` `create_doc_share` `get_doc_share_list` `memory_*` `attachment` `run_skill` |

**目标**：22 个常驻工具"**每个都真实可用、失败可归因、大结果可分页**"，并把"新工具上线前必须过体检"固化成流程。

**原则**（沿用既有决策，勿破）：
1. **不改共享 `.do` 接口的既有语义**——Web UI 必须零回归；新增逻辑只出现在"调用方缺参 / 结果过大 / 错误归因"三处；
2. 不引入"服务端只给 Agent 用"的第二条实现路径（Agent 走 REST，不直调 Service）；
3. 每轮改动必须过「编译 → 护栏 → 重启 → **真实页面 E2E** → 提交」五步。

---

## 1. 问题清单

### R1 — P0：模型一用就错（先做）

#### R1-1 后端补错误码（**用户点名优先**）
- **现状**：写操作失败只有文案；工具层用 `LOCK_BUSY_MARK="请稍后重试"` 嗅探文案判定"可重试"。文案一改即失效，且无法区分锁冲突/无权限/不存在/参数错。
- **证据**：`src/util/ReturnAjax.java` 无 `errorCode`；`DocSysToolFactory.isLockBusy()` 依赖 `describe(resp)` 文本匹配。
- **方案**：
  1. `ReturnAjax` 增字段 `errorCode`（+getter/setter）→ JSON 多一个字段，**UI 不读、向后兼容**；
  2. 打码点：`isDocForceLocked`/`buildLockFailMsg` → `DOC_LOCKED`；`checkUserDeleteRight`/`checkUserAddRight`/`checkUseAccessRight` → `NO_PERMISSION`；`docSysGetDoc==null` 类 → `NOT_FOUND`；参数校验 → `INVALID_PARAM`；
  3. 工具层改为优先看 `errorCode`（过渡期保留文案兜底），`callWithLockRetry` 只在 `DOC_LOCKED` 时重试。
- **验收**：锁窗口内 `move_doc` 仍自动重试成功；无权限写操作返回 `NO_PERMISSION` 且**不重试**；护栏补 `TestReturnAjaxErrorCode`（纯 JVM）。
- **涉及**：`util/ReturnAjax.java`、`controller/BaseController.java`（`common/BaseFunction.java` 锁/权限判定）、`agent/tool/DocSysToolFactory.java`

#### R1-2 `create_doc_share` 指向不存在的端点
- **现状**：`DocSysClient:1066` 调 `/Doc/createDocShare.do`；**服务端无此映射**（`DocController` 只有 `getDocShareList/verifyDocSharePwd/getDocShare`），真实创建分享在 `BussinessController:/addDocShare.do`（另有 `updateDocShare/deleteDocShare`）。
- **后果**：模型一旦调用必 404，工具 100% 不可用（记忆中 T8.2 "用户撤销回滚"即此项）。
- **方案**（二选一，建议 A）：
  - **A** 改端点：`/Bussiness/addDocShare.do` + 对齐其参数（需先读该接口签名，确认 shareType/pwd/expire 字段名）；
  - **B** 下线该工具（若分享不在 Agent 目标能力内）→ 同时更新 `TestWriteTools` 计数。
- **验收**：页面上"把 X 生成分享链接"能真实创建出分享，且分享列表能查到；或（若选 B）工具数 22→21 且护栏同步。

#### R1-3 `get_doc_share_list` 语义错位
- **现状**：工具要求 `vid`+`docId`（标为必填），描述"获取文档的分享列表"；但 `/Doc/getDocShareList.do` **不接任何参数**，返回的是"当前用户分享过的所有文档"。
- **后果**：模型按描述传参、拿到的是另一回事，容易误判；必填参数纯属误导。
- **方案**：明确语义二选一 —— ① 改成"我的分享列表"（去掉必填参数、改描述）；② 若要"某文档的分享"，改调 `/Doc/getDocShare.do`（需核对其参数）或 `getDocShareList` 后按 docId 过滤。
- **验收**：护栏断言描述与参数一致；页面问"这个文件有哪些分享"能得到正确答案。

#### R1-4 `get_doc_history` 静默返回仓库根的历史
- **现状**：`get_doc_history` 只传 `vid`+`docId`；服务端 `getDocHistory.do → getRealDocHistory()` 用 `buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, ...)`，**path/name 为空 → 塌缩为仓库根**（与 move_doc 同源缺陷），于是返回"根目录的历史"而不是该文件的历史——**静默错误**，比报错更危险。
- **方案**：把 R1 的解析能力复用过来 —— 在 `getDocHistory.do`（以及 `getDocShareList` 等同类 doc 接口）用 `resolveRealDocByDocId()` 补全 path/name；工具侧可选加 `path`/`name` 参数。
- **验收**：对 `test111.txt` 取历史，返回的条目 path/name 指向该文件；护栏 `TestDocHistoryResolve`（或并入现有探针）；页面 E2E 记录一次。
- **涉及**：`controller/DocController.java`（`getDocHistory.do`）、`agent/tool/DocSysToolFactory.java`

#### R1-5 `list_repos` 也被截断（同类）
- **现状**：`list_repos` 用 `fmt()` 裸 JSON；仓库对象含 `localSvnPath/svnPwd/remoteStorage/localSvnPath1/…` 20+ 字段。
- **证据**：2026-09-19 22:48 日志 `[ToolUseLoop][PARSE] ... head=[当前用户可见的仓库列表（接口返回在第 9 个后被截断，以下为可确认部分）` —— 18 个仓库只看到 9 个。
- **方案**：仿 `formatDocListPage` 做 `formatReposPage`：只留 `id/name/type/verCtrl/realDocPath/info`，分页（默认 50）。顺带把 `get_repos` 也换成紧凑渲染。
- **验收**：护栏 + 真实探针（18 个仓库一次列全，无截断）；页面"列出所有仓库"能列全并说明版本控制类型。

### R2 — P1：大结果 / 长文本的统一策略

#### R2-1 抽公共渲染 helper，统一"工具输出"规范
- **现状**：工厂里 **23 处**仍用 `fmt()` 裸 JSON（`get_login_user` `list_repos` `get_repos` `get_doc` `get_doc_history` `search_files` `grep_files` `get_doc_share_list` `query_backup_status` `create_repos` `delete_repos` `update_repos` `create_folder` `write_file` `write_note` `delete_doc` `rename_doc` `move_doc` `copy_doc` `create_doc_share` `backup_repos` `run_skill`）。
- **规范（建议定为不变量）**：
  1. **列表类** → 紧凑表格 + 表头总数 + `offset/limit` 分页（`list_docs` 已落地，作为模板）；
  2. **内容/长文本类** → `maxChars`/`offset` 参数 + 明确"已截断，总长 N，续读 offset=X"；
  3. **写操作回执** → 只回关键字段（`status/docId/name/path/新位置`）+ 失败原因，不回整包 JSON；
  4. 任何工具输出都**不允许**超过 `MAX_SUMMARY_LEN` 后被硬截断成半截结构。
- **验收**：把 23 处逐一改造；新增护栏 `TestToolOutputContract`（扫描工厂：列表类工具必须走紧凑渲染，禁止对 `List` 型 data 直接 `fmt`）。

#### R2-2 `get_doc` 内容 4000 字上限
- **现状**：内容被 `truncate()` 截到 4000 并附 `...(truncated)`（模型能看出被截，但拿不到后文）。
- **方案**：加 `maxChars`（默认 4000，上限如 20000）与 `offset`；表头给出"总长/本次区间/续读方式"。
- **验收**：护栏 + 页面读一个较长文件分两次取全。

#### R2-3 `search_files` / `grep_files` 结果集验证
- **现状**：`maxResults` ≤100，带 snippet 时单条数百字符 → 极易超 4000。
- **方案**：紧凑渲染（`序号. path/name  docId  「片段…」`）+ 分页/上限提示；顺带核对 `mode=index` 与 `mode=grep` 的字段差异。
- **验收**：在大仓库（仓库 1 / 仓库 5）用宽泛关键词搜索，输出完整可解析且给出"还有 N 条"。

### R3 — P2：一致性、体检、清理

#### R3-1 工具参数命名一致性
- `update_repos` 用 `reposId`，其余工具用 `vid` → 统一为 `vid`（保留 `reposId` 作为兼容别名）；顺带核对 `backup_repos(vid)`/`query_backup_status(taskId)`/`delete_repos(vid)` 等描述与实际一致。

#### R3-2 全工具"体检"（逐个最小真实调用，含失败路径）
- 名单：`create_repos` `delete_repos` `update_repos` `backup_repos` `query_backup_status` `write_note` `write_file` `create_doc_share` `get_doc_share_list` `get_doc_history` `get_doc` `get_repos` `list_repos` `memory_set/get/list` `attachment` `run_skill` `web_search` `create_folder` `delete_doc` `rename_doc` `move_doc` `copy_doc`
- 每项检查：**端点存在性 → 参数名 → docId-only 场景 → 大目录/大结果场景 → 确认门 → 失败归因**。
- 产出：一张"工具体检表"（工具 / 端点 / 最小调用命令 / 结果 / 遗留问题）追加入本文档。
- 注意：写操作会真实改数据 —— 一律在仓库 5（test，`D:/test/`）用一次性名字做，并清理还原。

#### R3-3 `run_skill` 对已下线 DocSys 能力的表现
- P3b 验收标准里写了"`run_skill("<DocSys能力>")` 应明确报 No executor"，但**未实测**。→ 补一次页面验证并记录。

#### R3-4 旧编排死代码处置
- `SubAgent` / `MainAgent` / `LLMIntentParser` 仍有旧分类编排（P2 时"未动"）。→ 裁定：下线 / 保留但标注 deprecated / 仅保留 CLI 入口。

#### R3-5 `DocSysClient` 中已下线工具的方法
- `getAiModelList` / `getDocSysConfig` / `ragChat` / `lockDoc` / `unlockDoc` 已无工具引用，仅 CLI/SubAgent 用（`DocSysCLI:220`、`SubAgent:728`）。→ 随 R3-4 一并裁定。

#### R3-6 流程固化：新工具上线检查单（写进 devDocs 复用）
- 端点存在性核对（`@RequestMapping` grep）
- 参数名核对（服务端签名 vs 客户端 put key）
- **docId-only 调用**必须能工作（否则要求 path+name）
- 输出是否可能超 4000（列表/长文本一律紧凑渲染 + 分页）
- 写工具是否 `isWrite+needsConfirm`，确认门是否真的弹出
- 失败是否**可归因**（有错误码/明确文案），不能退化成"稍后重试"
- 护栏 + 真实探针 + 页面 E2E 三件套

---

## 2. 建议执行顺序

| 阶段 | 内容 | 依赖 | 交付 |
|---|---|---|---|
| **R1** | R1-1 errCode（用户点名）→ R1-4 get_doc_history → R1-5 list_repos → R1-2 create_doc_share → R1-3 get_doc_share_list | 无 | 一提交一项，每项都过五步验证 |
| **R2** | R2-1 抽 helper 并定规范 → R2-3 search/grep → R2-2 get_doc 长文 | R1-1（错误码）建议先落 | 输出规范定型 + 护栏 `TestToolOutputContract` |
| **R3** | R3-2 全工具体检（产出体检表）→ R3-1 命名 → R3-3 run_skill → R3-4/5 清理裁定 → R3-6 检查单 | R1/R2 完成后 | 体检表 + 检查单文档 |

> 每完成一项：更新本文状态列 → 更新工作卡"当前进展/未提交改动" → 提交（`devInt` 主干）。

---

## 3. 验证口径（三件套，缺一不可）

1. **护栏**（纯 JVM）：`java -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" com.DocSystem.agent.tool.TestXxx`
   - 现基线（2026-09-20）：`TestListDocsFormat 25` / `TestLockRetry 9` / `TestDocIdResolve 11` / `TestWriteTools 52` / `TestAgentSearchWriteTools 55` / `TestToolRegistry 29` / `TestUserMemoryTools 26` / `TestWebSearchTool 30` / `TestToolCallParser 55`
2. **真实探针**（Java 直连 8100，走工具层）：`%TEMP%\docsys_chk\*.java`（`MoveToolE2E` `ListDocsProbe` `ToolChk` `IdProbe` `LockProbe`），用**真实数据**（仓库 5 根目录 79 项、仓库 1 大仓）
3. **Agent 页面 E2E**（`Admin`/`Admin`，真实 LLM + 确认门）：每轮至少 1 读 1 写，结果贴进提交说明
   - 登录/发消息/确认弹窗/读取回复的 Playwright 配方见 `/memories/repo/agent-skill-tool-cleanup.md`

---

## 4. 代码锚点

| 关注点 | 位置 |
|---|---|
| 工具定义与输出渲染 | `src/com/DocSystem/agent/tool/DocSysToolFactory.java`（`formatDocListPage` / `callWithLockRetry` / `fmt` / `truncate`） |
| HTTP 客户端（端点与参数名） | `src/com/DocSystem/agent/client/DocSysClient.java` |
| 文档解析 / 异步解锁 / 权限 | `src/com/DocSystem/controller/BaseController.java`（`resolveRealDocByDocId` / `executeCommonActionListAsyncEx` / `docSysGetDoc`） |
| 文档接口 | `src/com/DocSystem/controller/DocController.java`（`moveDoc` `copyDoc` `renameDoc` `deleteDoc` `getDocHistory` `getDocShareList`） |
| 仓库接口 | `src/com/DocSystem/controller/ReposController.java`（`addRepos` `deleteRepos` `updateReposInfo` `backupRepos` `queryReposFullBackupTask`） |
| 分享接口 | `src/com/DocSystem/websocket/BussinessController.java`（`addDocShare` `updateDocShare` `deleteDocShare`） |
| 回执对象（错误码落点） | `src/util/ReturnAjax.java` |
| 锁与事件 | `src/com/DocSystem/common/BaseFunction.java`（`doLockDoc` `isDocForceLocked` `unlockDoc`）、`src/com/DocSystem/common/EVENT.java` |

---

## 5. 不变量（不可破）

1. **共享 `.do` 接口的既有语义不变**（Web UI 零回归）——所有加固都在"缺参/过大/归因"三处做加法；改完必须回归一次 UI 关键路径（列目录、上传、移动、删除）。
2. `.class` 一律输出到 `D:/Dev/DocSys/WebRoot/WEB-INF/classes`，源码树不留 `.class`。
3. 测试产物写 `%TEMP%\docsys_chk\`（本议题）或 `office/test/tmp/`；**绝不写工程根 `tmp/`**。
4. 写操作测试只在仓库 5（test）用一次性名字，结束必须清理还原并核对磁盘。
5. 工具数量变化必须同步 `TestWriteTools` 的 `full registry size` 断言。
6. dev Tomcat 重启后 HttpSession 清空 → 页面验证前必须重新登录。

---

## 6. 状态总览（随进展更新）

| ID | 级别 | 摘要 | 状态 | commit |
|---|---|---|---|---|
| — | — | move_doc / copy / rename / delete 的 docId-only 塌缩 + 工具层锁占用重试 | ✅ | `b5c85bf9f` |
| — | — | list_docs 大目录截断 → 紧凑分页清单 | ✅ | `10f9e21f8` |
| R1-1 | P0 | 后端补 errorCode（替代文案嗅探） | ⬜ | |
| R1-2 | P0 | create_doc_share 端点不存在 | ⬜ | |
| R1-3 | P0 | get_doc_share_list 语义错位 | ⬜ | |
| R1-4 | P0 | get_doc_history 静默返回仓库根历史 | ⬜ | |
| R1-5 | P0 | list_repos 截断（18 仓只看 9） | ⬜ | |
| R2-1 | P1 | 统一工具输出规范 + 抽 helper（23 处 fmt 裸 JSON） | ⬜ | |
| R2-2 | P1 | get_doc 长文 maxChars/offset | ⬜ | |
| R2-3 | P1 | search_files/grep_files 大结果验证与紧凑化 | ⬜ | |
| R3-1 | P2 | 参数命名一致（update_repos.reposId → vid） | ⬜ | |
| R3-2 | P2 | 全工具体检表（22 工具） | ⬜ | |
| R3-3 | P2 | run_skill 对已下线能力的表现 | ⬜ | |
| R3-4 | P2 | 旧编排死代码（SubAgent/MainAgent/LLMIntentParser）处置 | ⬜ | |
| R3-5 | P2 | DocSysClient 遗留方法清理 | ⬜ | |
| R3-6 | P2 | 新工具上线检查单（流程固化） | ⬜ | |
