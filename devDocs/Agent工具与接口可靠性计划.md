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

#### R1-1 后端补错误码（**用户点名优先**）— ✅ 已完成（2026-09-20）
- **现状**：写操作失败只有文案；工具层用 `LOCK_BUSY_MARK="请稍后重试"` 嗅探文案判定"可重试"。文案一改即失效，且无法区分锁冲突/无权限/不存在/参数错。
- **证据**：`src/util/ReturnAjax.java` 无 `errorCode`；`DocSysToolFactory.isLockBusy()` 依赖 `describe(resp)` 文本匹配。
- **方案**（已落地）：
  1. 新增 `src/com/DocSystem/common/ErrorCode.java`（`DOC_LOCKED`/`NOT_LOGIN`/`NO_PERMISSION`/`DOC_NOT_FOUND`/`REPOS_NOT_FOUND`/`INVALID_PARAM`/`SYSTEM_BUSY`/`INTERNAL`，String 常量，不用 enum）；
  2. `ReturnAjax` 增 `errorCode` 字段 + `setError(msg, code)` / `setErrorCodeIfAbsent` / `getErrorCode`；**`setError(msg)` 行为不变（留 null）**，保证兼容；
  3. 打码点（共 53 处）：`BaseFunction.isDocForceLocked`/`isDocLocked` → `DOC_LOCKED`；`BaseFunction.setPermissionError()` 新 helper + `BaseController` 36 处权限点 → `NO_PERMISSION`；`BaseController` 中枢 5 处（`reposCheck`→`SYSTEM_BUSY`/`REPOS_NOT_FOUND`、`checkAndGetAccessInfo`/`checkAndGetLoginUser`→`NOT_LOGIN`/`NO_PERMISSION`、`getLoginUser`→`NOT_LOGIN`）；`DocController` 12 处（docId 解析失败→`DOC_NOT_FOUND`、缺定位参数/同位置→`INVALID_PARAM`、权限 7 处）；
  4. 工具层改**错误码优先**：`errorCodeOf()` + `guidanceFor()`，`isLockBusy()` 一旦发现"有码但码≠DOC_LOCKED"立即返回 false（不再嗅探文案）；`callWithLockRetry` 只在 `DOC_LOCKED` 时重试（6 次 × 500ms）；`fmt()` 失败时追加 `\n[错误码: X]（处置提示）`，**并为提示预留空间再截断**（否则超长响应会把提示一起截掉——已由护栏钉住）。
- **验收（实测）**：
  - 真实探针 `%TEMP%\docsys_chk\ErrorCodeProbe.ps1`：`DOC_LOCKED` ✓ / `REPOS_NOT_FOUND` ✓ / `NOT_LOGIN` ✓ / `DOC_NOT_FOUND` ✓ / `INVALID_PARAM` ✓，清理后磁盘无残留；
  - 工具层 `MoveToolE2E 17/17`（含"工具输出带 `[错误码: DOC_NOT_FOUND]` + 处置提示"两条新断言），锁窗口内 move/rename/delete 仍自动重试成功；
  - 护栏：`TestReturnAjaxErrorCode 22/22`（新增）、`TestLockRetry 13/13`；
  - 页面 E2E："建 2 目录 → 立刻移入 → 移回 → 删除"六步写操作全 ok、确认门正常、磁盘还原。
- **涉及**：`util/ReturnAjax.java`、`common/ErrorCode.java`、`common/BaseFunction.java`、`controller/BaseController.java`、`controller/DocController.java`、`agent/tool/DocSysToolFactory.java`
- **过程中发现的新问题（已记入 R1-1b / R3-7 / R3-8）**：
  - ① **`getLoginUser()` 自己写响应**（内部 `writeJson` 后 return null）→ 调用方设的码根本到不了客户端；这也是"未登录"一直没码的真因。
  - ② **文案嗅探会假阳**：`reposCheck` 的"系统维护中，请稍后重试！"含 `请稍后重试`，旧嗅探会把它当**可重试的锁占用**（现在被"有码优先"短路掉）。→ 说明 `isLockBusy` 的文案兜底只能当过渡。

#### R1-1b 其余权限点/登录点/不存在点到码（**R1-1 的尾巴**）— ✅ 已完成（2026-09-20）
- **现状（改造前）**：`ReposController` / `DocController` / `websocket/BussinessController` 里仍有大量 `setError("您…")` / `setError("用户未登录…")` / `setError("仓库 … 不存在！")` 只有文案。
- **后果**：这些路径失败时无码 → 工具层退回文案兜底 → 同一个"猜失败原因"的问题在仓库/分享/业务接口上依旧存在。
- **已落地的打码（共 66 处，全部人工分类，不搞一刀切）**：
  | 位置 | 分类 | 处数 | 写法 |
  |---|---|---|---|
  | `ReposController` | 未登录 | 18 | `rt.setError("用户未登录，请先登录！", ErrorCode.NOT_LOGIN)` |
  | `ReposController` | 权限 | 28 | `setPermissionError(rt, "您…")` |
  | `ReposController` | 仓库不存在 | 7 | `rt.setError("仓库 " + reposId + " 不存在！", ErrorCode.REPOS_NOT_FOUND)` |
  | `ReposController` | 备份任务不存在 | 2 | `ErrorCode.TASK_NOT_FOUND`（新增码，工具层提示"不要沿用旧 taskId"） |
  | `DocController` | 非法访问（`reposAccess == null`） | 2 | `setErrorCodeIfAbsent(NO_PERMISSION)` **再** `setError("非法访问")`——保留 `checkAndGetAccessInfo` 已设的更具体码（如 NOT_LOGIN） |
  | `DocController` | 非法存储类型 | 4 | `ErrorCode.INVALID_PARAM` |
  | `BussinessController` | 非法访问（`reposAccess == null`） | 13 | 同上（先 ifAbsent 再 setError） |
  | `BussinessController` | 未登录 | 2 | `NOT_LOGIN` |
  | `BussinessController` | 文档权限（office/CAD 链接） | 8 | `setPermissionError` |
  | `BussinessController` | 历史回退/删除（非系统管理员） | 2 | `setPermissionError` |
  | `BussinessController` | 没有该仓库访问权限 | 1 | `setPermissionError` |
- **设计要点**：`setError(msg)` **不动 errorCode**，所以"先 `setErrorCodeIfAbsent(兜底码)`、再 `setError(粗文案)`"能保住上游更精确的码；`setPermissionError` 是"文案+NO_PERMISSION"的一步写法。
- **验收（实测）**：
  - **护栏 `TestPermissionErrorCoding 16/16`（新增）**：源码 lint —— 三个控制器里 `setError("您…")` 必须走 `setPermissionError`、未登录必须带 `NOT_LOGIN`、`仓库…不存在` 必须带 `REPOS_NOT_FOUND`、`非法访问` 前必须 `setErrorCodeIfAbsent(NO_PERMISSION)`；并校验 `BaseFunction.setPermissionError` 内部确实置了码。
    （不用运行时构造无权限场景：裸 JVM 里 `BaseFunction` 会触发 `Log` 写文件递归 StackOverflow，且 dev 只有超级管理员账号。）
  - **真实 HTTP 探针**：不带 cookie 请求 `/Repos/getReposList.do`、`/Repos/getReposAllGroups.do`、`/Repos/getSubDocList.do` → 均返回 `{"errorCode":"NOT_LOGIN"}`；带 cookie 请求 `/Repos/getDocAuthList.do?reposId=999` → `{"errorCode":"REPOS_NOT_FOUND","msgInfo":"仓库 999 不存在！"}` ✓
  - 全量护栏：23/16/13/25/11/52/55/29/26/30/55 全绿。
  - 页面 E2E：建 `R11B验证` → 列目录确认 → 删除，4 步工具调用全 ok、确认门正常、磁盘无残留。
- **未覆盖（如实记录）**：`NO_PERMISSION` 只有"源码 lint + 序列化/机制"证据，**没有真实 HTTP 证据**——dev 环境只有超级管理员 Admin，注册普通账号被"账号格式不正确/需验证码"挡住。要有第二条账号后才能补这条 E2E。
- **结构提醒**：`websocket/BussinessController.java` 与 `BusinessBaseController.java` 归属**独立仓库 `src/com/DocSystem/websocket`（分支 master）**，不在主仓库（主仓库 `.gitignore` 排除整棵 `websocket`），提交要分开。

#### R1-1c 剩余"对象不存在"出口补码 — ✅ 已完成（2026-09-20）
- **现状（改造前）**：`docSysErrorLog(<消息含"不存在">, rt)` 共 **66 处**未打码：`DocController 44` / `BussinessController 14`（含 1 处注释）/ `BaseController 5`（含 1 处早已打码）/ `ReposController 3`。样例：`docSysErrorLog("文件 " + srcDoc.getName() + " 不存在！", rt)`、`docSysErrorLog("仓库 " + reposId + " 不存在！", rt)`、`docSysErrorLog("分享信息不存在！", rt)`。
- **后果**：模型"按名字操作一个不存在的文件"时拿到的仍是纯文案，会反复重试同一个名字（正是 R1 想消灭的模式）。
- **已落地**：统一用带码重载 `docSysErrorLog(logStr, errorCode, rt)`，按语义分码：
  - `"仓库 " + reposId + " 不存在！"` → `REPOS_NOT_FOUND`（DocController 31 + BussinessController 5 = 36 处，全部是各接口入口的 repos==null 守卫）
  - `"文件 … 不存在！"` / `"当前版本文件 … 不存在"` / `"[" + path+name + "] 不存在！"` → `DOC_NOT_FOUND`（DocController 11 + BaseController 4 + ReposController 2 + BussinessController 6 = 23 处）
  - `"分享信息不存在！"` → **新增码 `SHARE_NOT_FOUND`**（DocController 2 + BussinessController 2；工具层提示"重新获取分享列表，不要沿用旧 shareId"）
  - `"仓库密钥不存在！"`（ReposController）→ `INTERNAL`（服务端配置缺失，非调用方可解；同时给 `INTERNAL` 补了处置提示）
- **验证（实测）**：
  - 护栏 `TestPermissionErrorCoding` **24/24**：新增一组"不存在类出口必须带码"的 lint（覆盖 Repos/Doc/Base/Bussiness 四个文件），全树同规则无残留
  - 真实 HTTP：`/Doc/agentSearchDoc.do?reposId=999`（= `search_files` 工具路径）→ `REPOS_NOT_FOUND`；`/Doc/getDocHistory.do?reposId=999`（= `get_doc_history` 工具路径）→ `REPOS_NOT_FOUND`；`/Bussiness/getDocOfficeLink.do` 传不存在的文件名 → `DOC_NOT_FOUND`（改造前是无码的 `{"msgInfo":"zzz_nofile.txt 不存在！"}`）
  - **Agent 页面 E2E**：「读 test111.txt + 读不存在的 zzz_nofile_abc.txt」→ 读成功；读不存在**一次即报 `DOC_NOT_FOUND` 且模型不复重试**（正是本项要达成的效果）
- **踩坑记录**：改完 `BussinessController` 后忘记重新编译该类，HTTP 探针仍拿不到码（表现为"改了没生效"）→ **跨仓库/多文件改动后必须逐个文件 javac，或核对 `WebRoot/WEB-INF/classes` 里对应 .class 的时间戳**。
- **遗留（不在本项验收范围，均为非 Agent 可达路径，如实列出）**：全树还有 **13 处** 未打码的"不存在"出口 —— `ManageController 5`（bannerConfig/用户/日志文件）、`SalesController 3`、`websocket/BusinessChannel 1`、`websocket/OfficeController 4`（Office 预览链路）。要补齐时按同一套分码规则处理即可。

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

#### R1-4 `get_doc_history` 静默返回仓库根的历史 — ✅ 已完成（2026-09-20，**按 path/name 定位实现，不再走 docId 反查**）
- **现状（改造前）**：`get_doc_history` 只传 `vid`+`docId`；服务端 `getRealDocHistory()` 用 `buildBasicDoc(repos.getId(), docId, pid, reposPath, path, name, ...)`，**path/name 为空 → 塌缩为仓库根** → `doc.getDocId()==0` → `queryCommitHistory()` 走"仓库根目录"分支，返回整个仓库的历史且 `status=ok`——**静默错误**，比报错更危险。
- **实测证据（改造前）**：`reposId=5&docId=102077805632`（test111.txt 的真实 docId）→ **100 条提交**，首条 `删除 [R11B验证]`（根目录的历史），`commitMsg` 含 `test111.txt` 的条目 **0** 条。
- **方案（用户裁定：path/name 优先，不做 docId 反查）**：
  - 工具 `get_doc_history` 改为 `required {vid, path, name}`，**schema 不再暴露 docId**；描述里明确"不要传 docId，只传 docId 会静默返回仓库根历史"。
  - `DocSysClient.getDocHistory()` 增加 `path/name/level/type/maxLogNum/commitId` 参数（服务端本来就支持），旧 2 参重载标 `@Deprecated` 留给 SubAgent/CLI。
  - 工具层新增统一口径：`normalizeDocPath()`（根目录 = 空串、去掉前导 `/`、补齐尾 `/`）与 `levelOfDocPath()`（= path 中 `/` 的个数），因为服务端 `buildBasicDoc` **不会**从 path 反推 level，level 错 = docId 算错 = 静默定位到别的对象。
- **实测证据（改造后）**：`reposId=5&path=""&name=test111.txt&level=0` → **2 条提交**，`新增 [test111.txt]` + `修改 [test111.txt]`（commitMsg 命中 2/2）✓；子目录空文件 `66666/1111.txt` → 0 条（该文件确无提交）。
- **验证口径**：护栏 `TestDocHistoryLocator` **34/34**（path 归一化 10 项 / level 推导 7 项 / childDocPath 4 项 / 线上 docId 指纹 3 项 / schema 7 项 / 页脚口径 3 项）；真实 HTTP 探针 `DocHistoryProbe.ps1`；**页面 E2E**：`get_doc_history {"vid":5,"path":"","name":"test111.txt"}` 1 步工具调用 → 回答"2 条提交，最近一次 修改 [test111.txt]" ✓

#### R1-6 定位方式全面改为 path/name（用户裁定，**试点 = get_doc_history 已完成**）
- **用户裁定（2026-09-20）**：docId 是 `Path.buildDocIdByName(level, path+name)` 算出的**派生 hash**，不是主键；DocSys 不保证每个文件都有 doc/索引记录，所以"由 docId 反查 path/name"只能靠穷举兜底，而且 docId 随移动/重命名失效。**结论：文件操作接口一律用 path/name 定位，docId 退出参数面。**
- **本次试点（get_doc_history）✅**：见 R1-4。已顺带统一 `list_docs` 页脚口径（原"进入子目录可再调 list_docs(vid=…, docId=…)"→ 改为 `list_docs(vid=…, path="<子目录名>/")`）。
- **试点中发现的第 3 个"docId 参数实际不生效"证据**：`ReposController.getSubDocList`（第 2301 行）
  ```java
  Doc doc = null;
  if(path == null) { ...doc = rootDoc; }        // ← 只看 path：path==null 直接当仓库根目录，docId 根本不读
  if(doc == null) { doc = buildBasicDoc(repos.getId(), docId, null, reposPath, path, name, null, 2, ...); }
  ```
  实测：`vid=5` / `vid=5&docId=102199016117` / `vid=5&pid=102199016117` **都返回 79 项（根目录）**，只有 `vid=5&path=66666/` 返回 3 项 ✓ —— 即 `list_docs` 的 docId 参数**从来就没生效过**（页面上模型自己也实测出这一点）。这是"docId 参数面"必须清理的又一个硬证据。
- **待改清单（下一步，按此顺序做）**：

  | 工具 | 现状（required） | docId/pid 用法 | 状态 |
  |---|---|---|---|
  | `move_doc` | `{vid, docId, dstPid}` | 源侧参数在 client 调用里被**写死 null** | ✅ 已改为 `{vid, srcPath, srcName, dstPath, dstName?}` |
  | `copy_doc` | `{vid, docId, dstPid}` | 同上 | ✅ 同上 |
  | `delete_doc` | `{vid}` | docId/pid/path/name 全可选 | ✅ required `{vid, path, name}` |
  | `rename_doc` | `{vid, dstName}` | docId/pid 可选 | ✅ required `{vid, path, name, dstName}` |
  | `get_doc_history` | `{vid, docId}` | docId | ✅ 已改为 `{vid, path, name}` |
  | `create_doc_share` | `{vid, docId}` | docId（端点本身还错 → R1-2） | ⬜ `{vid, path, name}`（与 R1-2 一起做） |
  | `list_docs` | `{vid}` | docId 参数（**已实测不生效**）＋描述推荐 docId＋输出每行 docId | ✅ 已删 docId 参数；输出不再带 docId 列 |
  | `get_doc` | `{vid, path, name}` | 已有可选 docId | ✅ 已删 docId |
  | `write_note` | `{vid, name, content}` | docId 可选 | ✅ required `{vid, path, name, content}` |
  | `create_folder` / `write_file` | `{vid, name}` / `{vid, name, content}` | `pid`（父目录 ID） | ✅ 均改为 required `{vid, path, name[, content]}`，pid 下线 |
  | `@` 关注对象注入块 | `AgentFocusSupport.describe()` 注入 `docId=99` | docId 进提示词 | ✅ 不再输出 docId（旧历史块仍可解析） |
  | `AgentController.findNameConflict` | 用 `folderDocId` 调 `getDocList` | docId | ✅ 改用 path（并修掉“子目录导入永远只查根目录”的真 bug） |
  | 旧编排/CLI 帮助文本 | `delete-doc <vid> <docId>` 等 | docId-first 语法 | ✅ CLI `doc list/delete/rename/move/copy/get/history` 全改 path/name；SubAgent 历史改 path/name |
  | 我在 R1 加的服务端反查 | `BaseController.resolveRealDocByDocId` + `TestDocIdResolve` | 过渡兼容层 | ✅ **已删除**；`DocController` 四个写接口改为“doctId-only 报 INVALID_PARAM” |

- **本次已完成（move/copy，2026-09-20）**：
  - 工具口径：`move_doc`/`copy_doc` → `required {vid, srcPath, srcName, dstPath}`（`dstName` 可选 = 新名）；
    描述的 `dstName` 语义与 `rename_doc` 一致（都是“新名字”），而 **`dstPath` 是“目标目录自己的路径”**（根目录 = `""`）
    —— 正好等于 `list_docs` 页脚教的 `childDocPath(当前目录, 子目录名)`，模型无需任何额外推理。
  - **服务端无需改**：`buildBasicDocBase` 在 `level==null` 时会调 `Path.seperatePathAndName()` 自己从 path/name
    规范化（会折叠重复斜杠、跳空段、拒 `..`）并反推 level。→ 也说明**工具层不要乱传 level**：一旦 level 非空，
    服务端就**不再规范化 path**，反而可能因斜杠差异算出另一个 docId（静默错位）。
  - 工具层 `normalizeDocPath()` 加硬化：折叠重复斜杠、丢弃 `.` 段（与服务端同口径）。
  - 验证：护栏 `TestDocHistoryLocator` **48/48**（新增 move/copy schema 断言 + 归一化硬化用例）；
    新探针 `MoveToolPathE2E` **16/16**：全程无 docId/dstPid —— 建两个目录 → 移入（dstPath="B/"）→
    从子目录移回（srcPath="B/" 非空）→ 复制并改名（dstName）→ 重命名 → 逐个 path/name 删除 → 磁盘无残留；
    **页面 E2E**：模型 6 步写完“建→移入→移回→删”，并主动说明“严格按 srcPath+srcName / dstPath 操作，未依赖 docId/dstPid” ✓

- **本次已完成（第 3 步：其余文档工具，2026-09-20）**：
  - `delete_doc` → required `{vid, path, name}`；`rename_doc` → required `{vid, path, name, dstName}`（均已去 docId/pid）
  - `list_docs`：**删掉 docId 参数**（实测该参数在服务端从来不生效）；行内不再输出 `docId=`（定位靠表头的 path + 行内 name）
  - `get_doc` → 删 docId；`create_folder` → `pid` 改 `path`（required）；`write_file`/`write_note` → path 提为必填、去 docId
  - 所有 path 入参统一过 `normalizeDocPath()`；`list_docs` 传空 path 时仍传 null（保持服务端“path==null 即根目录”的已证行为）
  - 验证：护栏 `TestDocHistoryLocator` **74/74**（新增 `checkPathNameOnly`：六个工具逐一断言“无 docId/pid/dstPid + path 必填 + required 集合 + 描述提醒”）＋ `TestListDocsFormat` 改为“不再输出 docId 列”；
    探针 `MoveToolPathE2E` **20/20**（新增“用 path 在子目录 66666/ 里建目录并删除”）；
    **页面 E2E**：在 `66666/` 下建目录 → 写 `note.md` → `get_doc(path="66666/R6T_.../", name="note.md")` 读回一致 → `delete_doc` 连目录带文件删除，4 步全 ok，模型自述“全程按 path+name 定位，未使用 docId” ✓

- **本次已完成（第 4 步：收尾——注入块 / 导入冲突 / 删反查层 / CLI，2026-09-20）**：
  - **注入块去 docId**：`AgentFocusSupport.describe()` 不再输出 `docId=`（只用 `vid + 完整相对路径`）；`parseInjectedBlock` 的 docId 分组**保留**，只为兼容已落库的旧消息。
  - **导入同名冲突探测（真 bug）**：`AgentController.findNameConflict` 原来传 `folderDocId/pid` + `path=null` —— 而 `getSubDocList` 只看 `path` → **子目录导入时永远只查仓库根目录**，同名冲突探测形同虚设（上传遇同名是“直接覆盖 + 新生版本”，会静默改掉用户文件）。改为按 `path` 查询，并把入库 path 统一归一化。
  - **删服务端反查层**：`BaseController` 的 `resolveRealDocByDocId` / `deriveDocLevelFromDocId` / `verifyResolvedDoc` / `findDocInFileSystemByDocId` / `walkDocTreeForDocId`（共 ~180 行）全删；`TestDocIdResolve` 删除；`DocSysClient` 的 `@Deprecated getDocHistory(reposId, docId)` 两参重载也删。
  - **docId-only 不再静默变成“仓库根”**：`DocController` 的 `deleteDoc/renameDoc/moveDoc/copyDoc` 在缺 `path+name`（源名）时直接回 `INVALID_PARAM` + 文案“docId 定位已下线（docId 是派生值，移动/重命名后即失效），请改用 path+name 定位”；`move/copy` 另拦“给了非 0 `dstPid` 却没给 `dstPath`”（`dstPath=""` 合法 = 仓库根）。
  - **CLI 去 docId**：`doc list|delete|rename|move|copy|get|history` 全部改 path/name（根目录写 `.` 或 `/`，归一化为空串）；`SubAgent.handleDocHistory` 改用 8 参重载传 path/name。
  - 新增护栏 `TestDocHistoryLocator.testDocIdResolverRetired()`：**源码 lint** —— DocController 不得再出现 `resolveRealDocByDocId`、BaseController 不得再有反查层定义、`dstPid 定位已下线` 错误出口恰为 2 个、DocSysClient 无两参 `getDocHistory`、`describe()` 不输出 docId。
- **第 4 步验证（全部实测）**：
  - 护栏 `TestDocHistoryLocator` **80/80**、`TestAgentFocusSupport` **111/111**（新增 `normalizePath` 10 项 + `describe` 不带 docId + “新块不含 docId、旧块仍可解析”）；全量护栏 80/25/23/24/13/52/55/29/26/30/55 全绿。
  - HTTP 探针（真接口，重启后）：`deleteDoc.do?reposId=5&docId=102199016117` / `renameDoc.do?...&dstName=zzz` / `moveDoc.do?...&dstPath=66666/` → 全部 `INVALID_PARAM` + 路径提示；`moveDoc/copyDoc` 传 `dstPid` 不传 `dstPath` → 同样拒绝；**磁盘未被误删**（`66666/` 与 `test111.txt` 完好）。
  - 探针 `MoveToolPathE2E` **20/20**（含“用 path 在子目录 `66666/` 里建目录并删除”）。
  - **页面 E2E**：`@` 选 `66666/README.md` → 发问“读取我关注的这个文件” → 2 步工具调用全按 path/name（`get_doc{vid:5,path:"66666/",name:"README.md"}` / `list_docs{vid:5,path:"66666/"}`），模型如实回答“文件存在但 0 字节为空”；回读该会话消息：`focus[0].docId = null`（证明落库的注入块已无 `docId=`）。
  - **导入冲突（真 API）**：同名 `1111.txt` 导入 `66666/` → `errorCode=DOC_EXISTS`（“目标目录已存在同名文件，请确认是否替换”），原文件字节/时间未变 ✓；无同名的新文件导入 `66666/` → 成功，服务端回 `path=66666/ level=1 docId=204085893585`，**与 `Path.buildDocIdByName(1,"66666/","probe_r16_new.txt")` 逐位一致**（证明归一化后的 path 算出的正是 canonical docId）；随后用 path/name 删除并确认磁盘无残留。

- **验收（每项）**：护栏（schema 不含 docId + path 归一化 + 线上 docId 指纹）→ 真实探针 → 页面 E2E 一条。


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

#### R3-7 `getLoginUser()` 自己写响应（R1-1 发现的隐患）
- **现状**：`BaseController.getLoginUser()` 未登录分支内部就 `writeJson(rt, response)` 然后 `return null`。后果有二：① 调用方再写的错误码/文案**永远到不了客户端**（R1-1 的真因）；② 若调用方没判 null 继续 `writeJson`，会形成**二次写响应**（已提交的响应头之后写，轻则报错重则截断）。
- **方案**：改成只返回 `null`（或抛/返回错误标记），由调用方统一 `writeJson`；调用方逐个检查在 `null` 后不再续写。
- **验收**：无 cookie 请求仍返回 `NOT_LOGIN`（R1-1 探针第 3 项）；grep 确认无第二个 `writeJson` 能落在同一分支之后。

#### R3-8 移除 `isLockBusy()` 的文案兜底（R1-1 的收尾）
- **现状**：错误码已就位，但 `isLockBusy()` 仍保留文案嗅探兜底（为了兼容未打码的约 40 处 + 非 Agent 路径）。R1-1 已实测到一次**假阳**：`reposCheck` 的"系统维护中，请稍后重试！"。
- **方案**：R1-1b 完成后，把兜底降级为**仅当 `errorCode == null` 且 msgInfo 含"正在…文件"句式**才认锁（比现在的宽泛 "请稍后重试" 紧得多）。
- **验收**：`TestLockRetry` 新增"仅含『请稍后重试』但无锁句式 → 不认锁"断言。

---

## 2. 建议执行顺序

| 阶段 | 内容 | 依赖 | 交付 |
|---|---|---|---|
| **R1** | R1-1 errCode ✅ → R1-1b ✅ → R1-1c ✅ → R1-4 get_doc_history ✅（path/name）→ **R1-6 定位全面 path/name（试点已完，余下：move/copy/delete/rename/list_docs/share/create_folder/write_* + @注入块）** → R1-5 list_repos → R1-2 create_doc_share → R1-3 get_doc_share_list | 无 | 一提交一项，每项都过五步验证 |
| **R2** | R2-1 抽 helper 并定规范 → R2-3 search/grep → R2-2 get_doc 长文 | R1-1（错误码）建议先落 | 输出规范定型 + 护栏 `TestToolOutputContract` |
| **R3** | R3-2 全工具体检（产出体检表）→ R3-1 命名 → R3-3 run_skill → R3-4/5 清理裁定 → R3-6 检查单 | R1/R2 完成后 | 体检表 + 检查单文档 |

> 每完成一项：更新本文状态列 → 更新工作卡"当前进展/未提交改动" → 提交（`devInt` 主干）。

---

## 3. 验证口径（三件套，缺一不可）

1. **护栏**（纯 JVM）：`java -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" com.DocSystem.agent.tool.TestXxx`
   - 现基线（2026-09-20 R1-6 第 4 步后）：`TestDocHistoryLocator 80` / `TestAgentFocusSupport 111` / `TestListDocsFormat 25` / `TestLockRetry 13` / `TestReturnAjaxErrorCode 23` / `TestPermissionErrorCoding 24` / `TestWriteTools 52` / `TestAgentSearchWriteTools 55` / `TestToolRegistry 29` / `TestUserMemoryTools 26` / `TestWebSearchTool 30` / `TestToolCallParser 55`
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
| 回执对象（错误码落点） | `src/util/ReturnAjax.java`、`src/com/DocSystem/common/ErrorCode.java` |
| 权限/不存在出口的统一写法 | `src/com/DocSystem/common/BaseFunction.java`（`setPermissionError` / `docSysErrorLog(msg, code, rt)` 重载） |
| 业务/分享接口（**独立仓库 `src/com/DocSystem/websocket`，master**） | `websocket/BussinessController.java`（`addDocShare` `getDocOfficeLink`…）、`websocket/BusinessBaseController.java` |
| 锁与事件 | `src/com/DocSystem/common/BaseFunction.java`（`doLockDoc` `isDocForceLocked` `unlockDoc`）、`src/com/DocSystem/common/EVENT.java` |

---

## 5. 不变量（不可破）

1. **共享 `.do` 接口的既有语义不变**（Web UI 零回归）——所有加固都在"缺参/过大/归因"三处做加法；改完必须回归一次 UI 关键路径（列目录、上传、移动、删除）。
2. **工具层的文档定位统一用 path/name**（R1-6 用户裁定）：`path` = 所在目录的相对路径、**以 `/` 结尾**、根目录用空串；`name` = 自身名；`level` = path 中 `/` 的个数（服务端不会从 path 反推 level）。工具 schema 不再暴露 docId；`path+name+level` 必须能算回与线上一致的 docId（已由 `TestDocHistoryLocator` 的线上指纹钉住）。
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
| R1-1 | P0 | 后端补 errorCode（替代文案嗅探） | ✅ | `eda22474b` |
| R1-1b | P0 | 权限/登录/仓库不存在出口补码（三控制器 66 处） | ✅ | 见本次提交 |
| R1-1c | P0 | `docSysErrorLog(…不存在！, rt)` 64 处补码（新增 SHARE_NOT_FOUND） | ✅ | 见本次提交 |
| R1-2 | P0 | create_doc_share 端点不存在 | ⬜ | |
| R1-3 | P0 | get_doc_share_list 语义错位 | ⬜ | |
| R1-4 | P0 | get_doc_history 静默返回仓库根历史 | ✅ | 见本次提交 |
| R1-6 | P0 | 定位方式全面改为 path/name（✅ 全部工具 + `@` 注入块 + 导入冲突 + 删反查过渡层 + CLI） | ✅ | 见本次提交 |
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
| R3-7 | P2 | `getLoginUser()` 自写响应 → 双写隐患 | ⬜ | |
| R3-8 | P2 | 移除 `isLockBusy` 文案兜底（R1-1 收尾） | ⬜ | |
