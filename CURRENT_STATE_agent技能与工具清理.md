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

## R1-6 第 2 步：move_doc / copy_doc 改 path/name 口径（2026-09-20）— ✅ 已提交 `614a1c7a5`

### 改动
- 工具 `move_doc`/`copy_doc`：`required {vid, srcPath, srcName, dstPath}`，`dstName` 可选（= 新名）；**不再暴露 docId/dstPid/srcPid**
  - `srcPath`/`srcName` = 源所在目录 path + 源名；`dstPath` = **目标目录自己的路径**（根 = `""`，子目录 = `"父/子/"`）
  - `dstName` 语义与 `rename_doc` 一致（都是“新名字”），避免两个工具里 dstName 含义不同
  - 描述里明写“不要用 docId/dstPid”
- `normalizeDocPath()` 硬化：折叠重复斜杠、丢弃 `.` 段（与服务端 `Path.seperatePathAndName` 同口径）
- **服务端一行未改**：`buildBasicDocBase` 在 `level==null` 时会自己从 path/name 规范化并反推 level

### 验证
- 护栏 `TestDocHistoryLocator` **48/48**（新增 move/copy schema 断言：无 docId/dstPid/srcPid、required 四项、dstName 描述=新名；归一化硬化 3 项）
- 新探针 `MoveToolPathE2E` **16/16**（全程不传 docId/dstPid）：建两目录 → 移入（dstPath="B/"）→ 从子目录移回（srcPath="B/" 非空）→ 复制并改名 → 重命名 → path/name 逐个删除 → 磁盘无残留
- **页面 E2E**：模型 6 步完成“建→移入→移回→删”，并主动说明“严格按 srcPath+srcName / dstPath 操作，未依赖 docId/dstPid” ✓
- 全量护栏 48/25/13/11/23/24/52/55/29/26/30/55 全绿；磁盘无残留

### 关键认知（重要）
- **工具层不要乱传 level**：服务端只在 `level==null` 时才规范化 path；一旦传了 level，它就不再规范化，反而可能因斜杠差异算出另一个 docId（静默错位）

## R1-6 第 3 步：其余文档工具去 docId / path 必填（2026-09-20）

### 改动（均只动工具层）
- `delete_doc` → required `{vid, path, name}`；`rename_doc` → required `{vid, path, name, dstName}`（均去 docId/pid）
- `list_docs`：**删掉 docId 参数**（实测服务端从来不读）；行内不再输出 `docId=`（定位 = 表头的 path + 行内 name）
- `get_doc` → 删 docId；`create_folder` → `pid` 改 `path`（required）；`write_file`/`write_note` → `path` 提为必填、去 docId
- 所有 path 入参统一过 `normalizeDocPath()`；`list_docs` 传空 path 时仍发 null（保持服务端“path==null 即根”的已证行为）

### 验证
- 护栏 `TestDocHistoryLocator` **74/74**（新增 `checkPathNameOnly`：六个工具逐一断言“无 docId/pid/dstPid + path 必填 + required 集合 + 描述提醒”）；`TestListDocsFormat` 改为“不再输出 docId 列”
- 探针 `MoveToolPathE2E` **20/20**（新增“用 path 在子目录 66666/ 里建目录并删除”）
- **页面 E2E**：在 `66666/` 下建目录 → 写 `note.md` → `get_doc(path="66666/R6T_.../", name="note.md")` 读回一致 → `delete_doc` 连目录带文件删除；四步全 ok，模型自述“全程按 path+name 定位，未使用 docId” ✓
- 全量护栏 74/25/13/11/23/24/52/55/29/26/30/55 全绿；磁盘无残留（66666/ 仍为原三文件）
- 已提交 `a2eb58b7d`

## R1-6 第 4 步：收尾——注入块 / 导入冲突 / 删反查层 / CLI（2026-09-20）

### 改动
- **注入块去 docId**：`AgentFocusSupport.describe()` 不再输出 `docId=`（只用 `vid + 完整相对路径`）；`parseInjectedBlock` 的 docId 分组**保留**，仅供回读旧消息
- **导入同名冲突（真 bug）**：`AgentController.findNameConflict` 原传 `folderDocId/pid` + `path=null`，而 `getSubDocList` **只看 path** → 子目录导入永远只查仓库根，冲突探测形同虚设（同名上传是“直接覆盖+新生版本”，会静默改掉用户文件）；改为按 path 查询，并把入库 path 归一化
- **删服务端反查层**：`BaseController` 的 `resolveRealDocByDocId`/`deriveDocLevelFromDocId`/`verifyResolvedDoc`/`findDocInFileSystemByDocId`/`walkDocTreeForDocId`（~180 行）全删；删 `TestDocIdResolve`；删 `DocSysClient` 的 `@Deprecated getDocHistory(reposId, docId)` 两参重载
- **docId-only 不再静默变“仓库根”**：`DocController` 四个写接口缺 path+name（源名）时直接 `INVALID_PARAM` + “docId 定位已下线…请改用 path+name”；`move/copy` 另拦“给非 0 dstPid 却不给 dstPath”（`dstPath=""` 合法 = 仓库根）
- **CLI 去 docId**：`doc list|delete|rename|move|copy|get|history` 全改 path/name（根目录写 `.` 或 `/`）；`SubAgent.handleDocHistory` 改用 8 参重载
- 新增护栏 `TestDocHistoryLocator.testDocIdResolverRetired()`：源码 lint（反查层不得再出现 / docId-only 错误出口 / describe 不输出 docId / client 无两参重载）

### 验证
- 护栏：`TestDocHistoryLocator` **80/80**、`TestAgentFocusSupport` **111/111**（新增 `normalizePath` 10 项 + describe 不带 docId + 新块不含 docId / 旧块仍可解析）；全量 80/25/23/24/13/52/55/29/26/30/55 全绿
- HTTP 探针（重启后真接口）：五个 docId-only / dstPid-only 请求全部 `INVALID_PARAM` + 路径提示，**磁盘未被误删**（`66666/`、`test111.txt` 完好）
- 探针 `MoveToolPathE2E` **20/20**
- **页面 E2E**：`@` 选 `66666/README.md` → 问“读取我关注的这个文件” → 2 步工具调用全按 path/name（`get_doc{vid:5,path:"66666/",name:"README.md"}`、`list_docs{path:"66666/"}`），模型如实答“0 字节空文件”；回读该会话消息：`focus[0].docId = null`（证注入块已无 `docId=`）
- **导入冲突真 API**：同名 `1111.txt` → `DOC_EXISTS`（原文件字节/时间未变）；新文件 → 成功，服务端回 `path=66666/ level=1 docId=204085893585`，与 `Path.buildDocIdByName(1,"66666/","probe_r16_new.txt")` **逐位一致**；用 path/name 删除后磁盘无残留
- 已提交 `a2eb58b7d`（第 3 步）；**第 4 步 = `79b04752f`**

## R1-5：list_repos / get_repos 紧凑分页渲染（2026-09-20）

### 问题（真数据）
dev 环境 **17 个仓库的原始 JSON = 7716 字符** > `MAX_SUMMARY_LEN` 4000 → `fmt()` 截到 4000 后
**最后一个仓库 `MxsDoc产品介绍` 根本不在前缀里**（模型只能看到前 9 个）；原文还含 `svnPwd/svnPwd1` **明文密码**。

### 改动（只动工具层）
- 新增 `formatReposPage` / `renderRepos` / `formatOneRepos` / `reposTypeLabel` / `verCtrlLabel`：
  - 每行只留 `vid / 名称 / 类型 / 版本控制 / 本地路径`（`info` 与 `name` 不同时才补“说明=…”）；
  - `offset/limit` 分页（默认 50 / 最大 200）＋字符预算 3000（< fmt 上限，永不产生半截 JSON）；
  - 失败时**转调 `fmt()`** 保留 `errorCode` + 处置提示（`formatDocListPage` 的失败分支同样修了——原来直接拼 `msgInfo` 会把错误码丢掉）；
  - `svnPwd/svnPwd1/localSvnPath/svnPath/svnUser/remoteStorage/lockBy` 等一律不进输出；
  - 标签与 `manager/addRepos.html` 选项对齐：type 1=文件管理系统/3=SVN前置/4=GIT前置/5=文件服务器前置；verCtrl 0=无/1=SVN/2=GIT/3=磁盘。
- `list_repos` schema 加可选 `offset/limit`（无必填）；`get_repos` 改紧凑渲染。

### 验证
- 新护栏 `TestListReposFormat` **50/50**（紧凑/分页/越界/空列表/失败带码/敏感字段不出/标签映射/schema）；
- 探针 `ReposListE2E` **28/28**（真环境）：7716 → **856 字符**，17 个仓库名与 vid **0 缺失**，分页两页拼齐，`svnPwd` 字段名与真实值都不出现；
- **页面 E2E**：问“列出所有仓库，并说明版本控制类型，一共几个？”→ **1 步** `list_repos{}`，
  首行 `仓库列表：共 17 个，本次显示第 1-17 个`；模型答“共 17 个”、GIT 4 / 磁盘 3 / 无 10 **完全正确**，
  并引用页脚提示主动提出可用 `get_repos(vid=…)`；无 pageerror。  - 已提交 `e8d04b505`
## R1-2 / R1-3：分享工具修正（2026-09-20）

### 问题（均已实测）
- **R1-2**：`create_doc_share` 调的 `/Doc/createDocShare.do` **服务端根本没这个映射** → 工具 100% 404（T8.2 “撤销回滚”就是它）。真实端点是 `BussinessController:/addDocShare.do`，参数本来就是 `reposId/path/name + 权限/有效期`（**无 docId**）。
- **R1-3**：`get_doc_share_list` 把 `vid`+`docId` 标成必填、描述“文档的分享列表”，而 `/Doc/getDocShareList.do` **不接受任何参数**（返回当前用户全部分享）；dev 实测 **32 条 / 11414 字符** → 裸倒 JSON 也会被截断。

### 改动
- `DocSysClient`：`createDocShare(...)` → `addDocShare(reposId, path, name, sharePwd, shareHours)`（默认与 web 端一致：只读+可下载+7 天）；
  新增 `deleteDocShare(shareId)`（能创建就要能撤销）；`getDocShareList()` 改**无参**（删掉误导性的 4 参签名）。
- 工具 `create_doc_share` → `required {vid, path, name}` + 可选 `sharePwd`/`shareHours`（默认 168h）；去 `docId/shareType/expireTime`；
  新增 `formatShareCreated`（shareId/对象/链接/有效期/密码/权限）；仍 `isWrite+needsConfirm`。
- 工具 `get_doc_share_list` → 无必填；可选 `path`/`name`（客户端过滤）+ `offset`/`limit`；描述如实说明“服务端口不接受参数”；
  新增 `formatSharePage`/`renderShares`/`shareAuthSummary`（shareAuth JSON 压成“只读+可下载”；整库分享写“整库”；预算 3600）。
- CLI：`share list` 改无参、`share create <vid> <dir-path> <name> [pwd] [hours]`、**新增 `share delete <share-id>`**。

### 验证
- 护栏 `TestDocShareFormat` **60/60**（含源码 lint：不得回退到旧端点/旧方法）；全量 60/50/80/111/25/13/23/24/52/55/29/26/30/55 全绿。
- 探针 `ShareToolE2E` **23/23**（真环境）：创建成功 → **shareLink 不带 cookie 打开 HTTP 200 且非登录页**（链接真可用）→ 列表能查到 → 撤销后恢复原样。
- **页面 E2E**：①“把 66666/README.md 生成分享链接”→ 确认弹窗批准 → `create_doc_share{vid:5,path:"66666/",name:"README.md"}`，
  返回 `shareId=540833249` + 链接 + 有效期至 2026-09-27 16:16 + 密码无 + 只读可下载；模型主动提醒“链接对外、无需登录”。
  ②“我目前有哪些分享？列出最新几条，并告诉我总数” → **1 步** `get_doc_share_list{}`，首行“共 33 条，本次显示第 1-33 条”，
  模型答“33 条，1 条有效 / 32 条已过期”并列出最新 5 条（shareId/对象/状态/权限全对）。
- 环境已清理（页面 E2E 创建的 shareId=540833249 已撤销，分享数回到 32）。
- 已提交 `270166139`

### 新发现（待记入 R3）
- **确认弹窗只显示工具名**，不显示参数 —— 创建分享这种对外动作，用户看不到“到底在分享哪个文件”。
- 模型为了找 `66666/` 在哪个仓库，连调了 6 个 `list_docs`（逐仓库试）；当前工具集没有“跨仓库按路径/名字找”的能力（R2/R3 可考虑）。

## R2：大结果 / 长文本统一策略（2026-09-20）

### 实测原始体积（真数据，仓库 5）
- `search_files` 宽泛查询（`name=`.` wildcard）：**100 条 / 19840 字符** → 旧实现 `truncate` 后只剩半截 JSON。
- `grep_files` 关键词“测试”：16 个命中文件 / **687130 字符（0.7MB）**，**单条就 272035 字符**——
  服务端 `snippet` 只有 200 字上限，但**`line` 字段无上限**，旧实现把 `line` 也倒了出去。
- `get_doc` 内容：任何 > 4000 字的文本都只能看到开头 4000 字 + `...(truncated)`，后文无法取。

### 改动（只动工具层 + 一个护栏）
- **公共渲染件**（`DocSysToolFactory` 内）：`RowRenderer` + `PageBody` + `fitPage(...)`（超出字符预算时按 3/4 逐次回收条数，至少 1 条）
  + `paged(title, scope, all, offset, limit, budget, toolName, serverCap, rows)` + `moreHint(...)`（全工具统一“还有 N 条未显示”句式）。
- **R2-2 `get_doc`**：新增 `offset`/`maxChars`（默认 3000，上限 20000）；表头给总字符数与本次区间，页脚给下一次 `offset`。
- **R2-3 `search_files`/`grep_files`**：新增 `offset`/`limit`；search 每行 `序号. name path="…" size 命中=…`；
  grep 每行 `序号. path+name size` + `片段：≤120 字符`，**不再输出 `line`**；预算 3400。
- **R2-4（页面 E2E 发现后补修）**：
  - 服务端**不给真实总数**（`dataEx` 就是 `data.size()`），`maxResults<=0`→20、`>100`→100；
    改为：等于上限时写 `服务端返回 N 条（已达 maxResults=N 上限，可能还有更多命中）` + `调大 maxResults（当前 N，上限 100）重查`，
    不足上限才写 `共 N 条（全部命中）`；新增 `effectiveMaxResults()`。
  - `wildcard`/`prefix`/`fuzzy` 仅对 `field=name` 且**索引侧是小写**：`prefix README`→0、`prefix readme`→34、`wildcard *README*`→0、`*eadme*`→34；
    默认 `term` 大小写不敏感（`README`→34）。→ 参数说明改写为“不确定就用 term；要用通配必须全小写”，零命中建议不再推 `fuzzy/wildcard`。

### 验证
- 护栏 `TestToolOutputContract` **82/82**（含 list 型不得裸 `fmt` 的源码 lint）；全量 **82/60/50/25/80/111/52/55/29/26/30/55/23/24/13** 全绿。
- 探针 `OutputContractE2E` **33/33**（真环境）：31390 字符文件**分 11 窗口读全且逐字符一致**；`maxChars=20000` 一次读 20000 字；
  search 19840→**2746 字符/页**、**翻 5 页去重覆盖全部 100 条**；grep 687130→**3122 字符**、16 行+16 片段完整；两种上限提示各验一次。
- **页面 E2E（同一句提示词，改造前 7 步 → 改造后 4 步）**：
  `grep_files` → `共 16 条（全部命中）`；`search_files` 默认调用即报 `已达 maxResults=20 上限，可能还有更多命中`，
  模型当轮改 `maxResults=100` 重查得 `共 34 条（全部命中）`并翻第二页；**0 次 match 模式试错**。
- 已提交 `353565ee0`（R2-1/R2-2/R2-3/R2-4）

## R3-2 批 1：工具体检（仓库管理 + 备份 + 当前用户，2026-09-20）

### 抽出来的系统性缺陷（影响全部 24 个工具）
- **❗必填参数校验对全部工具都失效**：`objSchema(props, String[])` 把 `String[]` 直接塞进 schema，
  而 `ToolRegistry.validateParams` 只认 `instanceof List` → 全部真实工具的必填校验被静默跳过。
  症状：`create_repos{}` 不报缺必填，而抛 `Parameter specified as non-null is null: method okhttp3.FormBody$Builder.add`。
  为何护栏没拦住：`TestToolRegistry.testExecuteMissingParam` 是**手搓 JSONArray 的测试桩**，测不到工厂产出。
- **❗非 JSON 响应（500 HTML 页）变成模型的推理负担**：`delete_repos{vid:不存在}` 让服务端 NPE → HTTP 500 + HTML（4136 字符），
  工具报的是 fastjson 语法错（模型看不懂）。
- **❗描述过短的工具体**：`create_repos` 5 字、`update_repos` 6 字、`backup_repos`/`query_backup_status` 8 字、`get_login_user` 10 字。

### 改动
- `DocSysToolFactory.objSchema`：`required` 改输出 `JSONArray`（一行修全部工具）；`ToolRegistry.validateParams` 兼容 `Iterable`/`Object[]`，
  错误文案改为 `missing required parameter 'x'（参数确实为空时请显式传空串 ""）`。
- `DocSysClient.responseBodyString`：非 JSON 响应统一兜底成 `{"status":"fail","errorCode":"INTERNAL","msgInfo":"…"}`，
  并从 HTML 里提炼 `<h1>` 人话（30+ 调用点无需改动）。
- `ReposController.deleteRepos`：`getReposEx(vid)` 为 null 时直接 `repos.getId()` → NPE/500；已加存在性检查回 `REPOS_NOT_FOUND`。
- `create_repos`：**服务端不拦同名/同路径重复创建（实测会生成第 2 条记录）** → 工具层前查重报 `REPOS_EXISTS`；
  新增 `formatReposCreated`（给名称/路径/vid/下一步）；描述补 type/verCtrl 取值与 path 语义。
- `update_repos`（R3-1）：必填改为 `vid` 并**删掉 `reposId` 属性**（唯一调用方是 LLM，不存在旧调用方缓存）；
  空字段直接报错；新增 `formatReposUpdated`（只列改了什么；改 path 提醒旧目录不会搬）。
- `delete_repos`：描述改为如实（**实测只删记录/权限，磁盘文件目录保留**）；新增 `formatReposDeleted`
  （仓库名 + 保留目录 + 彻底清理办法）；名称/路径取不到时回退 `getReposList`（备份进行中 `getRepos` 会失败）。
- `backup_repos`/`query_backup_status`：新增 `formatBackupTask`/`backupStateText`——原始响应 **1047 字符**且内嵌
  `reposAccess.accessUser`（含 **`pwd` 密码哈希 / email / tel / requestIP**），现只留任务ID/状态/目标文件/存储目录（**183 字符**）；
  描述写清 taskId 只能来自 backup_repos 回执（**任务 ID 字段是 `id`，形如 `19-20260920201904`，响应里没有 taskId 字段**）。
- `get_login_user`：改紧凑回执（原来倒 231 字符 JSON，含手机号/邮箱），新增 `formatLoginUser`/`userTypeLabel`。

### 验证
- 新护栏 `TestReposToolsFormat` **46/46**（schema/必填/描述长度与关键事实/6 个渲染器的成功+失败+敏感字段不外泄）。
- `TestToolRegistry` 29→**36**（新增“**直接查工厂产出**”的回归锁，正是它本应拦住上述系统性缺陷）。
- 探针 `ReposToolsE2E` **31/31**（真环境）：建临时仓库→查重拒建→改名/改描述→备份→查任务→删不存在（REPOS_NOT_FOUND）→
  删除→**仓库集合与 17 个基线逐项一致**；删后磁盘目录仍在（系统设计）由探针自己清理。
- 全量 **20 套 / 856 项断言**全绿；**页面 E2E**（4 步、1 次确认弹窗）：`list_repos`（17 个）→ `get_repos{vid:5}` →
  `query_backup_status{5-20260101000000}` → 模型答“TASK_NOT_FOUND，需用 backup_repos 重新发起，不要沿用旧 ID”；
  `delete_repos{vid:999999}` → 批准 → `REPOS_NOT_FOUND`，模型答“并没有真的删掉任何东西”。
- 已提交 `8599083bd`（R3-2 批 1 / R3-1）

### 遗留 / 教训
- **探针教训**：破坏性探针必须把删除临时对象放进 `finally`。第一版没写，中途 `NumberFormatException`（列表主键字段猜错）
  → 留下 2 个临时仓库，已手工清理。
- **实测细节（下次直接用）**：仓库列表项主键字段是 **`id`**（不是 vid/reposId）；临时仓库不能放 `D:/test/` 下
  （那是仓库 5 的存储目录，服务端按前缀判“已被使用”）；备份进行中对同一仓库 `getRepos` 会失败（仓库忙）。
- **R3-2 批 2 待做**：`write_note`/`write_file`/`create_folder`/`delete_doc`/`rename_doc`/`move_doc`/`copy_doc`/`create_doc_share`/`get_doc_share_list`
  的**写回执紧凑化**（R2 遗留）+ `memory_*`/`attachment`/`web_search` 的真实装配验证（与 R3-3 合并）。
- **页面 E2E 再次印证 R3-9**：`delete_repos{vid:999999}` 的确认弹窗只写“此操作将执行写操作 [delete_repos]”，
  用户看不到到底要删哪个仓库。

## R3-2 批 2a：写回执紧凑化 + 两个真缺陷（2026-09-20）

### 体积对比（真机，仓库 5 走完整生命周期）
| 工具 | 改造前 | 改造后 |
|------|--------|--------|
| create_folder | 560 字符 | **97** |
| write_file | **1091 字符** | **75** |
| write_note | **HTTP 500 NPE** | **51** |
| rename_doc | 444 | **48** |
| move_doc | 417 | **46** |
| copy_doc | 41 | **63** |
| delete_doc | 454 | **76** |

- 原文噪声（已全去掉）：`localRootPath`/`reposPath`/`localVRootPath`/`remotePath`/`offsetPath`/`sortIndex`/
  `autoCharsetDetect`/`creatorName`/`latestEditorName`/`isBussiness`/`officeType`/`checkSum`/
  `dataEx.actionList`（整个内部动作列表）/`debugLog`。
- 更坑：`write_file` 把**写入的正文原样回显**（`data.content`）——写大文件时上下文被自己的正文塞满。
- 公共件：`writeReceipt(...)`（成功）+ `failReceipt(...)`（只留 msgInfo + `[错误码: X]` + 处置提示）。

### ❗缺陷 A：`write_note` 对已有文档 100% 500 NPE（已修）
- 根因：`DocController.updateDocContent` 的 `if(docType == 1)` 对 **null 拆箱**，而 `docType=null` 正是“写备注”的约定语义。
- 修：`if(docType != null && docType == 1)`；护栏用源码 lint 锁死这一行。

### ❗缺陷 B（安全）：写确认门可被“名字不在白名单”绕过（已修）
- 现象（页面 E2E）： “新建文件+读回+写备注+删除” 四步**只弹了 1 次确认框**（只有 delete_doc）。
- 根因：`AuditWriteConfirmGate.confirm()` → `createPendingEntry()` → `isWriteOperation(名字)`，
  而它是早期用 **skill 名字子串** 拼的启发式（delete/add_/create_/upload/backup/restore/wipe/rename/move_/copy_），
  `write_file`/`write_note`/`update_repos`/`run_skill` 一个都不命中 → 返回 null → 门内 `return true`（静默放行且无审计）。
- 修：① 白名单补真实工具名；② 新增 `createPendingEntry(..., force)`，门永远传 true；③ 拿不到 token 改 **fail-closed**。

### 验证
- 护栏 `TestWriteReceiptFormat` **47/47**、`TestWriteConfirmGateCoverage` **13/13**（数据驱动 + 结构锁）；全量 **22 套 / 915 项**全绿。
- 探针 `WriteToolsE2E` **31/31**（走工具层含锁重试）：建目录→写→读回校对→备注→改名→移动→复制→逐个删除；
  仓库根 79 项 / `66666/` 3 项与基线逐项一致，磁盘无残留。
- **页面 E2E 重跑同一句话**：确认弹窗 **1 次 → 3 次**（write_file / write_note / delete_doc 各一次），
  回执全部为“✅ 已…”，删后目录回到 3 项。
- 已提交 `79db72883`（R3-2 批 2a）

### 实测附带结论
- `write_file` 直调客户端会报 `DOC_LOCKED`（同一请求内先锁后再次锁）但**文件已写入**；
  工具层 `callWithLockRetry` 能自动重试成功 —— 模型侧看到的是成功（这层保护必须保留）。

## 全阶段完成情况

P1 ✅ `a3b2da425` / P2 ✅ `7621521ca` / P3a ✅ `fcf727d5f` / P3b-读 ✅ `72963c8f0` / P3b-写 ✅ `f364529e4` / P4 ✅ `8a776af35`；文档 `92b81351c` / `a6ad776dd`
技能：37 → **7**（`ant-expert` `java-expert` `playwright` `browser_use` `web_search` `system_help` `banner`）；工具：35 定义 → **22**（10R+12W，另含条件工具 memory_*3/web_search/run_skill/attachment）

## 下一步

**以 `devDocs/Agent工具与接口可靠性计划.md` 为准**（2026-09-20 建立的总清单，含全部待办与验收口径）。摘要：

- **R1（P0）**：R1-1/1b/1c ✅；R1-4 ✅；**R1-6 ✅**；**R1-5 ✅**；**R1-2 ✅ / R1-3 ✅**；R1 全部完成
- **R2（P1）**：**R2-1 ✅ / R2-2 ✅ / R2-3 ✅ / R2-4 ✅（本轮）** — 剩余：写操作回执类仍为 `fmt()` 整包 JSON，归入 R3-2 工具体检一并做
- **R3（P2）**：**R3-2 批 1 ✅ / R3-1 ✅ / R3-2 批 2a ✅（本轮）**；下一步 **R3-2 批 2b**（memory/attachment/web_search 真实装配）→ R3-3 `run_skill` → R3-9 确认弹窗显示参数 → R3-10 跨仓库按路径/名字找 → R3-4/5 清理裁定 → R3-6 检查单
  新增两条（R2 页面 E2E 发现）：**R3-9 确认弹窗只显示工具名不显示参数**、**R3-10 缺“跨仓库按路径/名字找”能力**

## 未提交改动

- 无（R3-2 批 2a 已提交 `79db72883`）
- 已提交：R3-2 批 2a = `79db72883`；R3-2 批 1 = `8599083bd`；R2 = `353565ee0`；R1-2/R1-3 = `270166139`；R1-5 = `e8d04b505`；R1-6 第 4 步 = `79b04752f`；R1-6 第 3 步 = `a2eb58b7d`；R1-6 move/copy = `614a1c7a5`；R1-4/R1-6 试点 = `6d625166c`；R1-1c = `22687f84b`/`b16c72f4`；R1-1b = `16ac39a43`/`142c2014`；R1-1 = `eda22474b`
- office 仓库：与本任务无关

## 生效约束

- 无前置提交要求；是否提交由用户决定（建议本任务分阶段提交，message 见各阶段完成时记录）。
- 编译输出目录铁律：`-d WebRoot/WEB-INF/classes`，源码树不得出现 `.class`。
- 运行期技能 store：dev = `C:\DocSysReposes\skills`（配置 `AgentSkillStorePath`），源码删除后必须手工清理同名目录。
- 测试/探针产物写 `%TEMP%\docsys_chk\`；**绝不写工程根 `tmp/`**（计划 §5 不变量 3）。
- **`src/com/DocSystem/websocket` 是独立 git 仓库（master）**，主仓库 `.gitignore` 排除它；`BussinessController.java`/`BusinessBaseController.java` 在那里，改完要分开提交。
