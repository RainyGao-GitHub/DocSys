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

## list_docs 截断修复（2026-09-20）—— 大目录看不到/解析不了

### 问题
`list_docs` 把 `/Repos/getSubDocList.do` 的**原始 JSON** 交给 `fmt()`，而 `fmt()` 按 `MAX_SUMMARY_LEN=4000`
截断。该接口每项 20+ 字段（localRootPath/reposPath/localVRootPath/officeType/creatorName/…），单条约 300~400 字符；
仓库 5 根目录 79 项即 ~30KB → **JSON 只剩半截**，模型既解析不了也看不到第 50 项之后的条目。

### 修法（工具层渲染，不动共享接口）
`DocSysToolFactory.formatDocListPage()`：只保留模型需要的 `类型/名称/大小/日期/docId`，输出
「表头（总数 + 本页区间）+ 紧凑条目 + 说明（path 与 get_doc 用法）+ 翻页提示」；新增 `offset`/`limit`
（默认 50、上限 200）参数；字符预算 3600（低于 4000，永不触发半截截断），超预算时按 3/4 递减条数而非截字符。

### 验证
- 护栏 `TestListDocsFormat` **25/25**：总数/区间/翻页提示、默认页 50 行、不超 4000 且无 "(truncated)"、
  目录/文件/大小/日期/docId 渲染、中文保留、不再输出原始 JSON 字段（localRootPath 等）、
  offset 越界提示、limit 超大收敛、空目录/data 非列表/失败状态、超长名 200 项只回收条数不截字符
- 真实数据探针 `ListDocsProbe`（仓库 5 根目录 **79 项**）：page1 2953 字符显示 1-50、page2 2153 字符显示 51-79，均不截断
- **Agent 页面端到端**：①「列出仓库 5 根目录全部项 + 统计」→ 2 步工具调用（自动翻完两页）→ 回答"79 项 = 目录 33 + 文件 46"并逐条列出（还主动说明 `优化计划.md`/`测试报告.md` 被系统标为目录）；
  ②「读 test111.txt + 列 66666 目录」→ 3 步：`get_doc` 拿到真实内容、用**新格式给出的 docId** 下钻 `list_docs` 列出 3 项 ✓

### 后续可选
- `get_doc` 的内容同样是 4000 字上限（会带 "(truncated)" 标记），如需读长文可加 `maxChars`/`offset`
- `search_files`/`grep_files` 的结果集也应确认在大仓库下的表现

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

## R1-1 后端错误码（2026-09-20）—— 失败原因可归因，替掉文案嗅探 — ✅ 已提交 `eda22474b`

### 问题
写操作失败只有中文文案，工具层靠 `"请稍后重试"` 串嗅探判断"可重试"：文案一改即失效，
且无法区分 **锁冲突 / 无权限 / 不存在 / 参数错**（模型会盲目重试不该重试的）。

### 实现（已落地，待提交）
- 新增 `src/com/DocSystem/common/ErrorCode.java`：8 个 String 常量（`DOC_LOCKED` `NOT_LOGIN` `NO_PERMISSION`
  `DOC_NOT_FOUND` `REPOS_NOT_FOUND` `INVALID_PARAM` `SYSTEM_BUSY` `INTERNAL`）；
- `ReturnAjax` 增 `errorCode`（`setError(msg,code)` / `setErrorCodeIfAbsent` / `getErrorCode`）；
  **`setError(msg)` 行为不变（留 null）** → Web UI 零回归；
- 打码 53 处：`BaseFunction` 锁判定 2 + `setPermissionError()` 新 helper；`BaseController` 权限 36 + 中枢 5；
  `DocController` 12（docId 解析失败 / 缺定位 / 同位置 / 权限）；
- 工具层：`errorCodeOf()` + `guidanceFor()`（每种码给中文处置提示）、`isLockBusy()` 改为**错误码优先**
  （有码且≠DOC_LOCKED 立即否，不再嗅探）、`callWithLockRetry` 只对 `DOC_LOCKED` 重试、
  `fmt()` 失败时追 `\n[错误码: X]（提示）` 且**为提示预留空间再截断**。

### 过程中发现的新问题（已写入计划）
- **`getLoginUser()` 自己写响应**（内部 `writeJson` 后 return null）→ 调用方设的码到不了客户端，
  也是"未登录"一直无码的真因 → 已就地打码 + 记入计划 **R3-7**（双写隐患）。
- **文案嗅探假阳**：`reposCheck` 的"系统维护中，请稍后重试！"含 `请稍后重试`，旧逻辑会当成可重试的锁
  → 现被"有码优先"短路；余下兜底收尾记入 **R3-8**。
- 其余未打码权限点约 40 处（`ReposController`/`BussinessController`/`BusinessBaseController`）→ **R1-1b**。

### 验证证据（全 PASS）
- 真实探针 `ErrorCodeProbe.ps1`（真 HTTP）：`DOC_LOCKED` ✓ / `REPOS_NOT_FOUND` ✓ / `NOT_LOGIN` ✓ /
  `DOC_NOT_FOUND` ✓ / `INVALID_PARAM` ✓；清理后磁盘无残留
- 护栏：`TestReturnAjaxErrorCode` **22/22**（新增，含超长响应提示不被截掉）、`TestLockRetry` **13/13**
- 工具层端到端 `MoveToolE2E` **17/17**（比修复前多 2 条：工具输出确实带 `[错误码: DOC_NOT_FOUND]` + 处置提示；
  锁窗口内 move/rename/delete 仍自动重试成功）
- **Agent 页面端到端**：建两个目录 → 立刻移入 → 移回根 → 删除两个目录，**6 步写操作全 ok**（确认门 6 次均正常），
  磁盘还原；模型还自己总结出"docId 会随移动变化、不能沿用旧值"。

## R1-1b 权限/登录/仓库不存在出口补码（2026-09-20）—— 把 R1-1 的码铺满 — ✅ 已提交（主库 `16ac39a43`、websocket 库 `142c2014`）

### 打了什么（66 处，全部人工分类）
- `ReposController`：未登录 18（NOT_LOGIN）、权限 28（`setPermissionError`）、仓库不存在 7（REPOS_NOT_FOUND）、备份任务不存在 2（新增码 TASK_NOT_FOUND）
- `DocController`：`reposAccess == null` 的 2 处 `非法访问` 改为「先 `setErrorCodeIfAbsent(NO_PERMISSION)` 再 `setError`」（保住上游更精确的码）；非法存储类型 4 处 → INVALID_PARAM
- `BussinessController`（**独立仓库，非主仓库**）：访问守卫 13、未登录 2、文档权限 8、历史回退/删除权限 2、仓库访问权限 1
- `BaseFunction.setPermissionError()` 成为权限类失败的统一出口；`ErrorCode` 新增 `TASK_NOT_FOUND`，工具层给出「不要沿用旧 taskId」提示

### 验证证据
- **护栏 `TestPermissionErrorCoding`（新增）16/16**：源码 lint（权限必须走 setPermissionError、未登录必须带 NOT_LOGIN、仓库不存在必须带 REPOS_NOT_FOUND、非法访问必须先 ifAbsent）+ 校验 helper 内部置码。
  （不造运行时无权限场景：裸 JVM 里 BaseFunction 会触发 Log 写文件递归 StackOverflow；dev 只有超级管理员）
- 全量护栏 23/16/13/25/11/52/55/29/26/30/55 全绿
- **真实 HTTP 探针**：无 cookie 请求 `/Repos/getReposList.do`、`/Repos/getReposAllGroups.do`、`/Repos/getSubDocList.do` → `errorCode=NOT_LOGIN` ✓；带 cookie 请求 `/Repos/getDocAuthList.do?reposId=999` → `errorCode=REPOS_NOT_FOUND` ✓
- 页面 E2E：建 `R11B验证` → 列目录确认 → 删除（4 步工具调用全 ok、确认门正常、磁盘无残留）

### 未覆盖（如实记录）
- `NO_PERMISSION` **只有静态/机制证据，无真实 HTTP 证据**：dev 只有 Admin（超级管理员），注册普通账号被“账号格式不正确/需验证码”挡住。需第二条账号后才能补。
- 新发现：`docSysErrorLog(<消息含“不存在”>, rt)` **66 处**未打码（Doc 44 / Bussiness 14 / Base 5 / Repos 3）→ 已记为计划的 **R1-1c**（`getDocOfficeLink` 用不存在文件名请求实测就是无码的 `{"msgInfo":"zzz_nofile.txt 不存在！"}`）。

## R1-1c “对象不存在”出口补码（2026-09-20）—— 让模型不再反复试同一个名字 — ✅ 已提交（主库 `22687f84b`、websocket 库 `b16c72f4`）

### 打了什么（64 处，按语义分码）
- `仓库 … 不存在！` → `REPOS_NOT_FOUND`：DocController 31 + BussinessController 5
- `文件 … 不存在！` / `当前版本文件 … 不存在` / `[path+name] 不存在！` → `DOC_NOT_FOUND`：Doc 11 + Base 4 + Repos 2 + Bussiness 6
- `分享信息不存在！` → **新增码 `SHARE_NOT_FOUND`**（Doc 2 + Bussiness 2；工具层提示“重新获取分享列表，不要沿用旧 shareId”）
- `仓库密钥不存在！` → `INTERNAL`（服务端配置缺失，非调用方可解；给 `INTERNAL` 补了处置提示）

### 验证证据
- 护栏 `TestPermissionErrorCoding` **24/24**（新增“不存在类出口必须带码” lint，覆盖 Repos/Doc/Base/Bussiness 四个文件）
- 真实 HTTP：`/Doc/agentSearchDoc.do?reposId=999`（`search_files` 路径）→ REPOS_NOT_FOUND；`/Doc/getDocHistory.do?reposId=999`（`get_doc_history` 路径）→ REPOS_NOT_FOUND；`/Bussiness/getDocOfficeLink.do` 传不存在文件名 → DOC_NOT_FOUND（改造前无码）
- **Agent 页面 E2E**：读 test111.txt 成功 + 读不存在的 zzz_nofile_abc.txt → 一次即报 `DOC_NOT_FOUND`，模型明确回复“已按要求不再重试” ✓

### 踩坑
- 改完 `BussinessController` **忘了重新编译该类** → 探针仍无码（“改了没生效”）；多文件改动后要逐个 javac 或核对 `.class` 时间戳

### 遗留（非 Agent 可达，如实列出）
- 全树还有 13 处“不存在”出口未打码：`ManageController 5`（banner 配置/用户/日志文件）、`SalesController 3`、`websocket/BusinessChannel 1`、`websocket/OfficeController 4`（Office 预览链路）

## R1-4 / R1-6 试点：文档定位改为 path/name（2026-09-20，用户裁定）— ✅ 已提交 `6d625166c`

### 用户裁定
- docId 本质是 `Path.buildDocIdByName(level, path+name)` 的派生 hash，**不是主键**；DocSys 不保证每个文件都有 doc/索引记录 → “由 docId 反查 path/name”不可靠，且 docId 随移动/重命名失效。
- 因此：**文件操作接口一律用 path/name 定位，docId 退出参数面**；先拿 `get_doc_history` 做试点。

### 试点做了什么
- 工具 `get_doc_history`：`required {vid, path, name}`，**schema 不再暴露 docId**；描述里写明“不要传 docId”
- `DocSysClient.getDocHistory()` 增 `path/name/level/type/maxLogNum/commitId`（服务端本来就支持），旧 2 参重载标 `@Deprecated`
- 新增工具层统一口径：`normalizeDocPath()`（根目录=空串、去前导 `/`、补尾 `/`）、`levelOfDocPath()`（= path 中 `/` 个数）、`childDocPath()`
- `list_docs` 页脚不再教 docId 下钻，改为 `list_docs(vid=…, path="<子目录名>/")`

### 实测证据（决定性）
- 改造前（只传真实 docId）：**100 条提交**，首条 `删除 [R11B验证]`（根目录历史）
- 改造后（path=""+name=test111.txt+level=0）：**2 条提交**，`新增/修改 [test111.txt]` ✓
- 页面 E2E：`get_doc_history {"vid":5,"path":"","name":"test111.txt"}` 1 步调用就答对

### 试点中发现的硬证据（又一个 docId 参数不生效）
- `ReposController.getSubDocList` 第 2301 行：`if(path == null) { doc = rootDoc; }` —— **只看 path**，path 为 null 时直接当仓库根目录，docId 根本不读
- 实测：`vid=5` / `vid=5&docId=102199016117` / `vid=5&pid=102199016117` 都返回 **79 项（根）**；只有 `vid=5&path=66666/` 返回 3 项 → **`list_docs` 的 docId 参数从来没生效过**

### 下一步（R1-6 剩余清单）
`move_doc`/`copy_doc`（需新增 srcPath/srcName，目标改 path/name）→ `delete_doc`/`rename_doc` 提必填 path+name → `list_docs` 删 docId 参数且输出改 path 为主 → `get_doc`/`write_note` 去 docId → `create_folder`/`write_file` 的 `pid` 改 `path` → `@` 注入块去 docId → 最后删除 `resolveRealDocByDocId` 过渡层

## 全阶段完成情况

P1 ✅ `a3b2da425` / P2 ✅ `7621521ca` / P3a ✅ `fcf727d5f` / P3b-读 ✅ `72963c8f0` / P3b-写 ✅ `f364529e4` / P4 ✅ `8a776af35`；文档 `92b81351c` / `a6ad776dd`
技能：37 → **7**（`ant-expert` `java-expert` `playwright` `browser_use` `web_search` `system_help` `banner`）；工具：35 定义 → **22**（10R+12W，另含条件工具 memory_*3/web_search/run_skill/attachment）

## 下一步

**以 `devDocs/Agent工具与接口可靠性计划.md` 为准**（2026-09-20 建立的总清单，含全部待办与验收口径）。摘要：

- **R1（P0，先做）**：R1-1 ✅ `eda22474b` → R1-1b ✅ → R1-1c ✅ → **R1-4 ✅（path/name 定位，试点）** → **R1-6 定位全面改 path/name（试点✅，余下见上节清单）** → R1-5 `list_repos` 截断 → R1-2 `create_doc_share` → R1-3 `get_doc_share_list`
- **R2（P1）**：统一工具输出规范（现仍有 23 处 `fmt()` 裸 JSON，会被 4000 字砍成半截）+ `get_doc` 长文 `maxChars/offset` + `search_files/grep_files` 大结果验证
- **R3（P2）**：全工具体检表、参数命名一致（`update_repos.reposId`→`vid`）、`run_skill` 实测、旧编排死代码处置、上线检查单固化

## 未提交改动

- 无（工作区干净；R1-4/R1-6 试点 = `6d625166c`）
- 已提交：R1-4/R1-6 试点 = `6d625166c`；R1-1c = `22687f84b`/`b16c72f4`；R1-1b = `16ac39a43`/`142c2014`；R1-1 = `eda22474b`；工作卡 = `78fae07f3`/`017ea08b7`；CLAUDE.md = `e3d9d9e53`；计划 = `9c675b79a`；move_doc = `b5c85bf9f`；list_docs = `10f9e21f8`
- office 仓库：与本任务无关

## 生效约束

- 无前置提交要求；是否提交由用户决定（建议本任务分阶段提交，message 见各阶段完成时记录）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`。
- 运行期技能 store：dev = `C:\DocSysReposes\skills`（配置 `AgentSkillStorePath`），源码删除后必须手工清理同名目录。
- 测试/探针产物写 `%TEMP%\docsys_chk\`；**绝不写工程根 `tmp/`**（计划 §5 不变量 3）。
- **`src/com/DocSystem/websocket` 是独立 git 仓库（master）**，主仓库 `.gitignore` 排除它；`BussinessController.java`/`BusinessBaseController.java` 在那里，改完要分开提交。
