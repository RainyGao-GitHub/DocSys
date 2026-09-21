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

#### R1-2 `create_doc_share` 指向不存在的端点 —— ✅ 已完成（2026-09-20，走方案 A：改端点）
- **现状**：`DocSysClient` 调 `/Doc/createDocShare.do`；**服务端无此映射**（`DocController` 只有 `getDocShareList/verifyDocSharePwd/getDocShare`），真实创建分享在 `BussinessController:/addDocShare.do`（另有 `updateDocShare/deleteDocShare`）。
- **后果**：模型一旦调用必 404，工具 100% 不可用（记忆中 T8.2 "用户撤销回滚"即此项）。
- **实测真实签名**（`BussinessController:165`）：
  `addDocShare(taskId, reposId, path, name, isAdmin, access, editEn, addEn, deleteEn, downloadEn, heritable, sharePwd, shareHours, mailSubject)`
  —— **本身就是 path/name 定位，无 docId**；成功时 `rt.setData(docShare)`，里面带 `shareId` 与 `shareLink`
  （链接形如 `http://<host>:<port>/DocSystem/web/project.html?vid=<vid>&shareId=<id>`，见 `buildShareLink`）。
- **本次实现**：
  - `DocSysClient.createDocShare(...)` → 换成 `addDocShare(reposId, path, name, sharePwd, shareHours)`，默认权限与 web 端
    `project.js` 一致（`access=1, downloadEn=1, 其余 0, heritable=1`）；新增 `deleteDocShare(shareId)` 与之配对（CLI `share delete` 使用）。
  - 工具 `create_doc_share` → `required {vid, path, name}` + 可选 `sharePwd`/`shareHours`（默认 **168h = 7 天**），
    schema 不再暴露 `docId/shareType/expireTime`；描述里写明“不要传 docId”“默认只读+可下载、7 天后过期”
    以及“分享是对外链接，请先确认”；仍为 `isWrite+needsConfirm`。
  - 新增 `formatShareCreated`：输出 `shareId / 对象 / 链接 / 有效期至 / 密码 / 权限`，失败时转调 `fmt()` 保留错误码。
- **验收（已过）**：★ 护栏 `TestDocShareFormat` **60/60**（含源码 lint：不得再出现旧端点/旧方法）；
  探针 `ShareToolE2E` **23/23**：真环境创建成功（shareId 1767499191）→ **把返回的 shareLink 不带任何 cookie 打开，HTTP 200 且不是登录页**
  （证明链接真可用，而非假字符串）→ 列表能查到 → 撤销后分享数恢复原样；
  **页面 E2E**：说“把 66666/README.md 生成一个分享链接” → 确认弹窗批准 → `create_doc_share{vid:5,path:"66666/",name:"README.md"}`
  返回 `shareId=540833249` + 链接 + `有效期至 2026-09-27 16:16` + 密码无 + 只读可下载，模型还主动提醒“该链接对外访问、无需登录”。
- ❗ **新发现（列入 R3）**：确认弹窗只显示**工具名**，不显示参数 —— 创建分享这种对外动作，用户看不到“到底在分享哪个文件”。

#### R1-3 `get_doc_share_list` 语义错位 —— ✅ 已完成（2026-09-20）
- **现状**：工具要求 `vid`+`docId`（标为必填），描述"获取文档的分享列表"；但 `/Doc/getDocShareList.do` **不接任何参数**，返回的是"当前用户分享过的所有文档"。
- **后果**：模型按描述传参、拿到的是另一回事，容易误判；必填参数纯属误导。实测该接口在 dev 返回 **32 条 / 11414 字符**（远超 `MAX_SUMMARY_LEN` 4000）→ 裸倒 JSON 也会被截断。
- **本次实现（方案① + 紧凑渲染）**：
  - `DocSysClient.getDocShareList()` 改为**无参**（服务端不读参数）；删掉误导性的 `(reposId, docId, path, name)` 签名。
  - 工具 `get_doc_share_list` 去掉必填项，描述如实写“列出**当前用户创建的全部分享**；服务端不接受任何参数，
    path/name 只是在结果里**过滤**”；新增可选 `path`/`name`（客户端过滤）与 `offset`/`limit`（默认 50 / 最大 200）。
  - 新增 `formatSharePage` / `renderShares` / `shareAuthSummary`：每行 `shareId / 仓库+对象路径 / 有效期（或已过期）/ 权限`；
    整库分享（path+name 都空）写“整库”；`shareAuth` 的 12 字段 JSON 压成 `只读+可下载`（常见形态短写）或带位描述；
    字符预算 3600（与目录列表同级，32 条能一页列全）；失败转调 `fmt()` 保错误码。
- **验收（已过）**：护栏 `TestDocShareFormat`（schema 无必填/无 vid·docId、描述与真实语义一致、渲染与分页、过滤、错误码）；
  探针 `ShareToolE2E` 列表断言；**页面 E2E**：问“我目前有哪些分享？列出最新几条，并告诉我总数”→ **1 步** `get_doc_share_list{}`，
  输出首行 `分享列表：匹配（全部分享）共 33 条，本次显示第 1-33 条`；模型答“共 33 条，仅 1 条有效、32 条已过期”，
  并列出最新 5 条（shareId/对象/状态/权限全对）。
- ❗ **新发现（列入 R3）**：分享列表里“整库分享”不少（旧数据 path/name 为空），模型需要能分辨“整库”与“某文件”——已在渲染里写明“整库”。

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
  | `create_doc_share` | `{vid, docId}` | docId（端点本身还错 → R1-2） | ✅ `{vid, path, name}` + 真实端点（R1-2） |
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


#### R1-5 `list_repos` 也被截断（同类）——✅ 已完成（2026-09-20）
- **现状**：`list_repos` 用 `fmt()` 裸 JSON；仓库对象含 `localSvnPath/svnPwd/remoteStorage/localSvnPath1/…` 20+ 字段。
- **证据**：2026-09-19 22:48 日志 `[ToolUseLoop][PARSE] ... head=[当前用户可见的仓库列表（接口返回在第 9 个后被截断，以下为可确认部分）` —— 18 个仓库只看到 9 个。
  - **探针实测（可复现的硬证据）**：dev 环境 17 个仓库的原始 JSON **7716 字符** > `MAX_SUMMARY_LEN` 4000；
    把原始 JSON 截到 4000 后，**最后一个仓库 `MxsDoc产品介绍` 根本不在前缀里**（`ReposListE2E` 直接断言这一点）。
- **方案（已实现）**：仿 `formatDocListPage` 新增 `formatReposPage` / `renderRepos` / `formatOneRepos`：
  - 每行只留 `vid / 名称 / 类型 / 版本控制 / 本地路径`（`info` 与 `name` 不同时才补“说明=…”）；
  - `offset/limit` 分页（默认 50 / 最大 200）＋字符预算 3000（低于 fmt 上限，确保永远不会被砍成半截）；
  - 失败时**转调 `fmt()`** 保留 `errorCode` + 处置提示（原来直接拼 `msgInfo` 会把错误码丢掉——`formatDocListPage` 同样修了）；
  - **顺带不再把敏感字段倒进上下文**：原文含 `svnPwd/svnPwd1`（明文密码）、`localSvnPath/svnPath/svnUser`、`remoteStorage` 等，现已全不进输出；
  - `get_repos` 也换紧凑渲染（`类型/版本控制/本地路径/归属/说明` + `list_docs(vid=…)` 提示）。
  - 类型/版本控制文案与 `manager/addRepos.html` 选项对齐：类型 1=文件管理系统 / 3=SVN前置 / 4=GIT前置 / 5=文件服务器前置；verCtrl 0=无 / 1=SVN / 2=GIT / 3=磁盘。
- **验收（已过）**：
  - 新护栏 `TestListReposFormat` **50/50**（紧凑/分页/越界/空列表/失败带码/敏感字段不出/标签映射/schema 无必填）；
  - 探针 `ReposListE2E` **28/28**（真环境）：原始 JSON 7716 → 新输出 **856 字符**，17 个仓库名与 vid **0 缺失**，
    最后那个仓库出现了；分页两页拼齐；`svnPwd` 字段名与真实值都不出现；`get_repos` 输出不到原文 1/5；
  - **页面 E2E**：问“列出所有仓库，并说明每个仓库的版本控制类型，一共几个？”→ **1 步工具调用** `list_repos{}`，
    输出首行 `仓库列表：共 17 个，本次显示第 1-17 个`；模型答“共 17 个”，按 GIT 4 / 磁盘 3 / 无 10 分类**完全正确**
    （与实测 verCtrl 分布一致），并引用页脚提示主动提出可用 `get_repos(vid=…)` 看单个仓库；无 pageerror。

### R2 — P1：大结果 / 长文本的统一策略（✅ 2026-09-20 完成，commit 见工作卡）

#### R2-1 抽公共渲染 helper，统一"工具输出"规范（✅ 已落地）
- **现状**：工厂里 **23 处**仍用 `fmt()` 裸 JSON（`get_login_user` `list_repos` `get_repos` `get_doc` `get_doc_history` `search_files` `grep_files` `get_doc_share_list` `query_backup_status` `create_repos` `delete_repos` `update_repos` `create_folder` `write_file` `write_note` `delete_doc` `rename_doc` `move_doc` `copy_doc` `create_doc_share` `backup_repos` `run_skill`）。
- **规范（定为不变量）**：
  1. **列表类** → 紧凑表格 + 表头命中数 + `offset/limit` 分页（`list_docs` 已落地，作为模板）；
  2. **内容/长文本类** → `maxChars`/`offset` 参数 + 明确"已截断，总长 N，续读 offset=X"；
  3. **写操作回执** → 只回关键字段（`status/docId/name/path/新位置`）+ 失败原因，不回整包 JSON；
  4. 任何工具输出都**不允许**超过 `MAX_SUMMARY_LEN` 后被硬截断成半截结构。
- **已抽出的公共件**（`DocSysToolFactory` 内）：
  - `RowRenderer`（`render(from,to)` 函数式接口）+ `PageBody`（end + body）；
  - `fitPage(total, offset, limit, budget, rows)`：**条数自适应**——先按 limit 排，超出预算就乘 3/4 逐次回收（至少留 1 条）；
  - `paged(title, scope, all, offsetArg, limitArg, budget, toolName, serverCap, rows)`：统一表头（命中数 / 本次区间）+ 正文 + 续页提示；
  - `moreHint(remain, toolName, nextOffset)`：全工具统一句式"⚠️ 还有 N 条未显示：继续调用 X 传 offset=N。"。
  - 已改走公共件的工具：`list_repos` `get_repos` `list_docs` `get_doc` `get_doc_share_list` `search_files` `grep_files`。
- **验收（已过）**：护栏 `TestToolOutputContract` **82/82**，内含源码 lint：列表类工具不得再出现 `fmt(client.getDocList(` / `fmt(client.getReposList(` / `fmt(client.getDocShareList(` / `fmt(client.agentSearchDocs(` / `fmt(client.grepFiles(` / `fmt(client.getRepos(`。
- **剩余**：写操作回执类（`write_file`/`write_note`/`create_folder`/`rename_doc`/`move_doc`/`copy_doc`/`delete_doc`）当时仍是 `fmt()` 整包 JSON
  → **✅ 已于 R3-2 批 2a 完成**（`writeReceipt`/`failReceipt`，见下文 R3-2 节）；仓库/备份类已在批 1 完成。

#### R2-2 `get_doc` 内容 4000 字上限（✅ 已落地）
- **原状**：内容被 `truncate()` 截到 4000 并附 `...(truncated)`（模型能看出被截，但拿不到后文）。
- **落地**：`get_doc` 新增 `offset` / `maxChars`（默认 `DOC_TEXT_DEFAULT_MAX=3000`，上限 `DOC_TEXT_MAX=20000`）；
  表头 `文件内容：… （大小 X，正文共 N 字符）` + `本次显示第 a-b 字符：`（一次读完时写`已显示全文（第 1-N 字符）`）；
  正文用 `────────` 围栏包裹，页脚给 `⚠️ 还有 N 字符未显示：继续调用 get_doc(vid=…, path=…, name=…, offset=…)`。
- **验收（已过）**：探针 `OutputContractE2E`——写入 31390 字符真实文件，**分 11 个窗口读全后与原文逐字符完全一致**；
  单页输出 3187 字符 < 4000；`maxChars=20000` 一次读 20000 字符。

#### R2-3 `search_files` / `grep_files` 结果集验证（✅ 已落地）
- **实测原始体积（dev，仓库 5）**：
  - `search_files` 宽泛查询（`name=`.` wildcard）：命中 **100 条 / JSON 19840 字符**（旧实现被截成 4000 字的半截 JSON）；
  - `grep_files` 关键词“测试”：16 个命中文件 / **JSON 687130 字符**，其中**单条就 272035 字符**——
    因为服务端 `line` 字段**无上限**（`snippet` 只有 200 字上限，但工具把 `line` 也倒出去了）。
- **落地**：两个工具都改为紧凑分页（`offset`/`limit`）：
  - `search_files` 每行 `序号. <name>  path="…"  <size>  命中=<文件名|内容|备注>`；
  - `grep_files` 每行 `序号. <path><name>  <size>` + 缩进的 `片段：<≤120 字符>`，**不再输出原始 `line` 字段**；
  - 每页字符预算 `SEARCH_LIST_CHAR_BUDGET=3400`（低于 4000，确保不被 `truncate` 砍）。
- **验收（已过）**：探针 `OutputContractE2E`——search 19840 → **2746 字符/页**，**翻 5 页去重后覆盖全部 100 条**；
  grep 687130 → **3122 字符**，16 行 + 16 个片段一个不少；两者均 < 4000 且无 `(truncated)`。

#### R2-4 命中数语义与 `match` 引导修正（✅ 已在页面 E2E 中发现并修复）
- **发现（页面 E2E，非探针）**：模型把表头 `共 20 条` 当成“总共就 20 条”，又花一轮重查才发现是 34 条；
  另外它按旧描述先试 `fuzzy`/`wildcard`/`prefix` 三种 match，**全部 0 条**，白烧 3 轮。
- **根因（实测）**：
  1. 服务端 **不返回真实总数**（`dataEx` 就是 `data.size()`），只把命中截到 `maxResults`；
     `maxResults<=0`→**20**，`>100`→**100**（传 300/1000 均只回 100）；写完“共 N 条”就是在报一个可能被截的数。
  2. `wildcard`/`prefix`/`fuzzy` **仅对 `field=name` 生效**，且**索引侧是小写的**——
     `prefix`/`wildcard` 传大写必 0 条（实测：`prefix README`→0、`prefix readme`→34；`wildcard *README*`→0、`*eadme*`→34；
     `fuzzy README`→0、`fuzzy readme`→3）；默认 `term` 模式大小写不敏感（`README`→34）。
- **修复**：
  - 表头区分两态：未到上限写 `共 N 条（全部命中）`；等于上限写 `服务端返回 N 条（已达 maxResults=N 上限，可能还有更多命中）`，
    并补一行下一步（未到 100：`调大 maxResults（当前 N，上限 100）重查`；已到 100：`缩小范围（加 must / 限定 path）`）；
  - 新增 `effectiveMaxResults()`（null/<=0→20、超 100 按 100 计）与 `SERVER_DEFAULT_RESULTS=20` / `SERVER_MAX_RESULTS=100` 常量；
  - `search_files` 描述/参数说明改写：`maxResults` 明写“**取回多少条**而不是总数”、`query` 明写“**关键字必须全小写**，不确定就用 term”；
  - 零命中的建议不再推荐 `fuzzy/wildcard`（旧文案正是把模型带偏的元凶）。
- **验收（已过，同样问题同样问法对照）**：页面 E2E 同一句提示词，**7 步 → 4 步**：
  `grep_files` 一次到位（`共 16 条（全部命中）`）；`search_files` 默认调用即看到 `已达 maxResults=20 上限，可能还有更多命中`，
  模型当轮就按提示用 `maxResults=100` 重查（得 `共 34 条（全部命中）`）并翻第二页；**0 次 match 模式试错**。

### R3 — P2：一致性、体检、清理（进行中：批 1 ✅ 2026-09-20）

#### R3-0 工具体检的**系统性发现**（批 1 抽出来的，影响全部 24 个工具）
- **❗必填参数校验对全部工具都失效**（已修）：`objSchema(props, String[])` 把 `String[]` 直接塞进 schema，
  而 `ToolRegistry.validateParams` 只认 `instanceof List` → **所有真实工具的必填校验被静默跳过**。
  实测症状：`create_repos{}` 不报“缺必填”，而抛 `Parameter specified as non-null is null: method okhttp3.FormBody$Builder.add`（模型看不懂）。
  为什么护栏没拦住：`TestToolRegistry.testExecuteMissingParam` 是**手搓 JSONArray**（`JSON.parseArray`）的测试桩，
  永远测不到工厂产出的 `String[]` —— 典型的“测试自己造了个正确的 fixture，把生产者 bug 盖住”。
  → 修：`objSchema` 输出 `JSONArray`；`validateParams` 兼容 `Iterable`/`Object[]`；错误文案改为
  `missing required parameter 'x'（参数确实为空时请显式传空串 ""）`；新增 **直接查工厂产出** 的回归锁（`TestToolRegistry` 29→36）。
- **❗非 JSON 响应直接变成模型的“推理负担”**（已修）：服务端 500 时 Tomcat 回 HTML 错误页，
  各调用点 `JSON.parseObject` 抛 fastjson 语法错，工具报给模型的是 `syntax error, pos 1, line 1, column 2<html>…`。
  → 修：`DocSysClient.responseBodyString` 统一兜底成 `{"status":"fail","errorCode":"INTERNAL","msgInfo":"…"}`，
  并把 HTML 里 `<h1>` 提炼成一句人话（30+ 个调用点无需改动）。
- **❗描述过短的工具体（模型无从下手）**：`create_repos` 5 字、`update_repos` 6 字、`backup_repos`/`query_backup_status` 8 字、
  `get_login_user` 10 字。→ 本批已重写这 5 个；**其余工具的描述质量 lint 归 R3-2 后续批次**。
- ✅ **实测环境提示**：仓库管理类工具的临时仓库**不能放在 `D:/test/` 下**——那是仓库 5 的存储目录，
  服务端按前缀判定 "已被使用"（`newRealDocPath duplicated: repos id=5 name=test realDocPath=D:/test/`）；
  也不存在 “all repos” 列表项字段叫 `vid`：**列表项主键字段是 `id`**。

#### R3-1 工具参数命名一致性（✅ 已随批 1 完成）
- `update_repos` 的孤例参数名 `reposId` → 统一为 **`vid`**（必填），并**直接删掉 `reposId` 属性**。
  - 为什么没按原计划“保留兼容别名”：本工具的唯一调用方是 LLM，它每次读 schema，不存在旧调用方缓存；
    留一个已废弃的参数名只会让模型偶尔用错，正是 R3-1 要消除的问题。
- 顺带校对：`backup_repos(vid)` / `query_backup_status(taskId)` / `delete_repos(vid)` / `create_repos(name,path)` 描述与实际一致。

#### R3-2 全工具"体检"（逐个最小真实调用，含失败路径）——**批 1 ✅ / 批 2 ⬜**

**批 1（已完成）：仓库管理 4 + 备份 2 + 当前用户 1**

| 工具 | 端点 | 真机结果 | 本批修正 |
|------|------|----------|----------|
| `get_login_user` | `/User/getLoginUser.do` | ok，231 字符含 `tel`(手机号)/`email` | 改紧凑回执（2 行，无 PII）；补描述 |
| `create_repos` | `/Repos/addRepos.do` | 创建成功（仓库 17→18）；**服务端不拦同名/同路径重复创建，会生成第 2 条记录** | 工具层前查重（命中报 `REPOS_EXISTS`）；回执给 vid；描述补 type/verCtrl 取值与 path 语义 |
| `get_repos` | `/Repos/getRepos.do` | ok，113 字符，不泄露 `svnPwd/localSvnPath` | 无（R1-5 已改） |
| `update_repos` | `/Repos/updateReposInfo.do` | ok；“没有任何可改字段”原来会发空请求 | 参数名统一 `vid`；空字段直接报错；回执只列改了什么；改 path 提醒旧目录不会搬 |
| `delete_repos` | `/Repos/deleteRepos.do` | ok；**实测只删记录与权限/授权，磁盘文件目录保留** | 描述改为如实（不再写“不可恢复”）；回执给仓库名 + 保留目录 + 彻底清理办法 |
| `backup_repos` | `/Repos/backupRepos.do` | ok，原始响应 **1047 字符**，内嵌 `repos` + `reposAccess.accessUser`（含 **`pwd` 密码哈希、email、tel、requestIP**） | 新增 `formatBackupTask`：只留任务ID/状态/目标文件/存储目录（**183 字符**），不再泄露凭据；描述说明 taskId 来源 |
| `query_backup_status` | `/Repos/queryReposFullBackupTask.do` | 不存在的 ID → `TASK_NOT_FOUND`（已经带码，R1-1 成果）；**任务 ID 字段是 `id`（形如 `19-20260920201904`），响应里没有 `taskId` 字段** | 描述写清“taskId 只能来自 backup_repos 回执”；回执改紧凑；状态码映射 `0/1/2`+`stopFlag` |

- **服务端附带修复**：`ReposController.deleteRepos` 在 `getReposEx(vid)` 返回 null 时直接 `repos.getId()` → **NPE → HTTP 500 + HTML 错误页**；
  已加存在性检查，回 **`REPOS_NOT_FOUND`**（对齐 R1-1 打码模式）。
- **验收（已过）**：
  - 新护栏 `TestReposToolsFormat` **46/46**（schema/必填/描述长度与关键事实/6 个渲染器的成功+失败+敏感字段不外泄）；
  - 探针 `ReposToolsE2E` **31/31**（真环境，建临时仓库→查重→改名→改描述→备份→查任务→删不存在→删除→**仓库集合与 17 个基线逐项一致**）；
  - 全量 20 套护栏 **856 项断言** 全绿（新增 TestReposToolsFormat 46；TestToolRegistry 29→36；TestAgentSearchWriteTools 55→56）；
  - **页面 E2E**（4 步、1 次确认弹窗）：`list_repos`（17 个，含“没有 vid=15”这种真实细节）→ `get_repos{vid:5}` →
    `query_backup_status{5-20260101000000}` → 模型复述“`TASK_NOT_FOUND`，需用 backup_repos 重新发起，不要沿用旧 ID”；
    `delete_repos{vid:999999}` → 确认弹窗批准 → `REPOS_NOT_FOUND`，模型答“并没有真的删掉任何东西”。
- ⚠️ **探针工程教训**：破坏性体检探针必须把“删除临时对象”放进 `finally`。第一版本没写，探针中途
  `NumberFormatException`（列表主键字段猜错）→ **留下 2 个临时仓库**，需手工清理。
- ⚠️ **顺带发现**：备份任务进行中对同一仓库调 `getRepos` 会失败（仓库忙）→ 回执取名称/目录必须回退 `getReposList`
  （已实现，否则 `delete_repos` 回执会丢名称与目录）。

**批 2a（✅ 2026-09-20）：7 个文档写工具的回执紧凑化 + 两个真缺陷**

| 工具 | 改造前 | 改造后 |
|------|--------|--------|
| `create_folder` | 560 字符 | **97** |
| `write_file` | **1091 字符** | **75** |
| `write_note` | **HTTP 500 NPE** | **51** |
| `rename_doc` | 444 字符 | **48** |
| `move_doc` | 417 字符 | **46** |
| `copy_doc` | 41 字符 | **63**（多了人话） |
| `delete_doc` | 454 字符 | **76** |

- **原文里的内部噪声（全部去掉）**：`localRootPath`/`reposPath`/`localVRootPath`/`remotePath`/`offsetPath`/
  `sortIndex`/`autoCharsetDetect`/`creatorName`/`latestEditorName`/`isBussiness`/`officeType`/`checkSum`/
  `dataEx.actionList`（整个内部动作列表）/`debugLog`（含远端推送日志）。
- **更坑的一点**：`write_file` 的响应把**写入的正文原样回显**（`data.content`）——写大文件时模型上下文会被自己刚写的正文塞满，
  超 4000 后被 `truncate` 截断，真正的结果字段反而看不到。回执已不再回显正文（改成给大小 + “用 get_doc 读回核对”）。
- 公共件：`writeReceipt(resp, action, target[, extraLine])` 成功回执 + `failReceipt(resp)` 失败回执
  （只留 `msgInfo` + `[错误码: X]` + 处置提示，丢掉 `debugLog`/`dataEx`）。

**❗缺陷 A：`write_note` 对已有文档 100% 失败（服务端 500 NPE）**
- 根因：`DocController.updateDocContent` 里 `if(docType == 1)` 对 **null 拆箱**；而 `docType=null` 正是客户端约定的
  “更新备注（虚拟内容）”语义 → 必 NPE。只有“文档不存在”分支能走通（工具会回退到 `addDoc`），所以看起来
  “新建文档写备注”能用、“给已有文档写备注”必挂。
- 修：`if(docType != null && docType == 1)`；护栏 `TestWriteReceiptFormat` 用源码 lint 锁死这一行。

**❗缺陷 B（安全）：写确认门可以被“工具名不在白名单”绕过**
- **现象（页面 E2E 抓的）**：“新建文件 + 读回 + 写备注 + 删除”四步全程**只弹了 1 次确认框**（只有 `delete_doc`）。
- 根因链：`AuditWriteConfirmGate.confirm()` → `createPendingEntry()` → `isWriteOperation(工具名)`，
  而 `isWriteOperation` 是早期用 **skill 名字子串** 拼的启发式（`contains("delete"/"add_"/"create_"/"upload"/
  "backup"/"restore"/"wipe"/"rename"/"move_"/"copy_")`）→ `write_file`/`write_note`/`update_repos`/`run_skill`
  **一个都不命中** → 返回 null → 门内 `return true`（**静默放行，且不留审计**）。
- 修：① 审计白名单补齐真实工具名；② 新增 `createPendingEntry(..., boolean force)`，确认门永远传 `true`
  （`ToolRegistry` 本就只对 `needsConfirm=true` 的工具调门，再拿名字猜一次既多余又危险）；
  ③ 拿不到 token 时改为 **fail-closed**（`return false` + 错误日志），不再静默放行。
- 验证：护栏 `TestWriteConfirmGateCoverage` **13/13**（数据驱动：注册表里每个 `needsConfirm` 工具名都要被
  `isWriteOperation` 收录；结构锁：门必须用 force 入口、不得在拿不到 token 时放行）；
  页面 E2E 重跑同一句话 → 弹窗 **1 次 → 3 次**（`write_file`/`write_note`/`delete_doc` 各一次）。

- **验收（已过）**：探针 `WriteToolsE2E` **31/31**（真环境，走工具层含锁重试）：
  建目录→写文件→读回校对→写备注→改名→移动→复制→逐个删除，回执均 < 4000、不含内部字段、不回显正文；
  结尾仓库根目录 79 项 / `66666/` 3 项与基线逐项一致，磁盘无残留。
- ⚠️ **实测附带结论**：`write_file` 直接调客户端会报 `DOC_LOCKED` 失败（同一请求内先锁后再次锁），
  但**工具层 `callWithLockRetry` 能自动重试成功** —— 所以模型侧看到的是成功（这层保护是必要的）。

**批 2b（✅ 2026-09-20）：条件注册的 4 个工具真机装配验证 + R3-3 `run_skill`**

- **工具面实测：28 个**（模型自报清单，与代码一致）：只读 10 + 写 12 + `memory_set/get/list` + `web_search` +`run_skill` + `attachment`。
  即：条件注册的四个（需 `UserMemoryService` / `WebSearchService` / `SkillExecutorRegistry` / 会话目录）在 dev 全部到位。
- **`memory_*` 跨会话有效** ✓：会话 A 写 `user.preference`，**新会话 B** 用 `memory_list` 读到同一值（DB-backed `UserMemoryService` 正常）。
  - ⚠️ 清理：本次与早前探针在用户记忆里留的 `probe.key` / `user.preference` 已从 `agent_user_memory` 删掉（共 2 行），
    其余 4 条（`user_preferences`/`月度总结偏好`/`每日早间习惯`/`优化需求记录`）保持不动。
  - ⚠️ 无删除工具：`UserMemoryService.delete` 有方法但**没有对应工具**，清探针只能直连 DB（本次就是这么做的）。
- **`web_search` 真能联网** ✓：返回真实结果（如 `cdn.deepseek.com`）；模型正确地判定“本次搜索没查到有效结果”并**未臆造**，
  而是明确区分“搜索结果”与“我自身知识（可能已过时）”。
  - ❗小遗留（列 R3-12）：**摘要里带 HTML 实体**（`&ensp;` / `&#0183;`），进上下文是噪声，渲染时应 unescape。
- **`attachment`** ✓：上传 200 → `action=list` 列出 `attach_probe.txt`（107B/文本）→ `action=read` 读出全文，
  **唯一关键字 `ZQ7X-ATTACH-KEY-2026` 被原样复述**（没有臆造内容）。
- **R3-3 `run_skill`**：
  - 未知技能 → `No executor found for skill: not_exist_skill_xyz` ✓（符合 P3b 验收标准）；确认门对 `run_skill` 生效 ✓（每次弹窗）。
  - ❗❗**`system_help` 曾是死技能**（实测）：它**不在任何内置白名单**（`DocSysSkillExecutor` / `ExternalSkillExecutor` 都没有），
    于是落到外部 CLI 执行器，被当成 SKILL.md 里写的 `docsys help` 命令去跑 —— dev 根本没有 `docsys` 可执行文件 → 必然失败。
  - ❗❗**子进程输出乱码**（通用缺陷）：`cmd.exe` 输出是系统码页（中文 Windows = GBK/CP936），
    而 `ExternalSkillExecutor` 四处读取点都写死 UTF-8 → 模型看到
    `'docsys' �����ڲ����ⲿ���Ҳ���ǿ����еĳ���…`，**无法判断到底是“命令不存在”还是“脚本报错”**。
  - **修**：① 新增 `readProcessOutput`/`detectCharset`（UTF-8 严格可解则 UTF-8，否则回退系统默认码页）并替换四处读取点；
    ② `system_help` 由 `DocSysSkillExecutor` 接管（白名单 + 别名分支），并从外部执行器的排除集里声明；
    ③ **重写内置 `help` 正文**：原来是 docId 时代的 CLI 说明（`delete-doc <vid> <docId>`、`download-doc`、`ai-models`、
    `chat-with-docs` 等**已下线**命令）→ 会把模型带偏；现改为“当前实现的 28 个工具 + 5 条关键约定”。
  - **验证（已过）**：护栏 `TestSkillExecEncoding` **34/34**（GBK 字节回退可读 + UTF-8 原样 + 两个执行器的接管/排除集 +
    help 正文不再含 8 个过期条目、含当前工具与约定）；**页面 E2E 复验**：`run_skill(system_help)` 成功且输出可读的中文速查，
    模型还如实指出“【关键约定】实际有 5 条，不是你说的三条”。
  - ❗遗留（列 R3-11）：`WebRoot/WEB-INF/skills/system_help` 自身的演示件已过期（SKILL.md 让跑 `docsys` CLI；
    `scripts/run.bat` 指向 `http://localhost:8080/api/help` 与 `admin/admin2026`）—— 现在虽然不再被执行，但内容仍会误导。

**批 2 完成**：写回执与条件工具的体检已全部做完（剩 R3-3 的遗留项转入 R3-11/12）。

> ⚠️ **本节结论已被 R3-11 取代**：当时对 `system_help` 的处置是“修”（补进白名单 + 重写正文），
> 但 2026-09-20 核查发现整个 help 族都过期/编造（含三个没注册但猜 id 可命中的 sibling、
> `SubAgent` 里更陈旧的一份）→ 用户裁定 **(A)+(C)：整族删除**，调用它们得到明确的“未知技能”。
> 唯一仍然成立的结论是：**子进程输出编码修复（GBK/UTF-8）**与帮助内容无关，保留。

#### R3-9 确认弹窗显示参数（✅ 2026-09-20 已修）
- **问题**（连续三轮页面 E2E 印证）：弹窗只写 `此操作将执行写操作 [delete_repos]，是否继续？`——
  用户看不到“到底要删哪个仓库/分享哪个文件”，只能盲批；对外动作（`create_doc_share`）尤其危险。
- **根因**：`AuditWriteConfirmGate.confirm(toolName, args)` **手上就有 args**，但只把工具名拼进了文案（SSE 也不带参数）。
- **修**：新增 `summarizeArgs(args)` 并拼进确认文案（弹窗的 `.confirm-msg` 本来就是 `white-space: pre-wrap`，多行能正常显示）：
  - 敏感键（`pwd`/`sharePwd`/`token`/`apiKey`…）→ `***`；
  - 长值（> 60 字符）→ **只给长度** `<1234 字符>`（写 1MB 文件不能把正文堆进弹窗）；
  - 空值跳过、换行压平、整串预算 400 字符。
- **验收（已过）**：
  - 护栏 `TestWriteConfirmGateCoverage` **13 → 27**（新增 14 条：短值原样/长文本只给长度/不含正文/敏感键脱敏/不含原文/
    空值与 null 跳过/空参/null 不炸/换行压平/总预算/源码 lint 确认文案拼了摘要）；
  - **页面 E2E**：`write_file` 弹窗 → `参数：vid=5；path=66666/；name=modal_probe_…md；content=确认弹窗参数验证`；
    `delete_doc` 弹窗 → `参数：vid=5；path=66666/；name=modal_probe_…md`（两次均 `hasParamLine=true`）。

#### R3-10 跨仓库按路径/名字找（✅ 2026-09-20 已做）
- **现象**：模型为了找 `66666/` 在哪个仓库连调 6 次 `list_docs`。
- **根因（全部实测）**：
  - **索引不是磁盘镜像**：repo 5 索引 20731 条（文件 19825 / 目录 905，目录**入库**），但按 path 前缀查：`MxsDoc/` 有，
    `培训资料/`、`正常工作的Office文件/`、`临时目录/`、`知识库/`、`空文件夹上传测试/`、`66666/` **全部 0 命中**
    （`66666/` 里 3 个文件也不在索引里）；而磁盘 `D:/test/66666`（repo 5 realDocPath）真实存在。
  - **17 仓逐仓调旧 `search_files` 也没用**：`term` 写法 0 命中；`wildcard` 写法只 1 条无关 png（文件）。
  - **`grep_files` 救不了**：只匹配**文件内容**，不匹配名字、从不返回目录（实测 20 条全是 css/js 里的颜色值噪声）——
    旧描述却把模型往这边引（文档误导）。
  - **人类接口早就能答**：`/Doc/searchDoc.do` 的 `reposId=-1` 即跨全部可访问仓库，第一步 `getHitDoc` →
    `buildBasicDoc` + `docSysGetDoc`（O(1) stat）。实测一次调用返回 `vid=5 path="" name=66666 type=2`。
    缺的只是 agent 工具层没接这条腿。
  - 性能不是瓶颈：逐仓打满 17 仓服务端仅 **725ms（43ms/仓）**；贵的是每次工具调用 = 一次 LLM 往返。
- **用户裁定**：①`search_files` 的 `vid` 改**可选**（不在仓库详情页时确实不知道该选哪个仓库）；
  ②`grep_files` 保持 `vid` 必填（跨仓 grep = 逐仓全盘扫描）；③**增/删/改/查/读文件的工具一律必须明确 vid**
  （没有 vid 的文件访问会操作到错误对象，用户忘了说明的概率远大于他想“随便找个仓库”）；
  ④跨仓分支必须含**不依赖索引的直查**，单仓也补同一路（避免“缺 vid 反而能找到、给 vid 反而不行”）。
  - 因此**否定**了原候选“让 `list_docs` 在缺 vid 时跨仓库搜索”（浏览/操作语义不该跨仓，会诱导模型随手挑仓库）。
- **实现**：
  - 服务端 `DocController.agentSearchDoc`：`reposId` 省略/-1 → `getAccessableReposList`（与 `searchDoc.do` 同权限口径）逐仓
    ①`buildBasicDoc` + **`docSysGetDoc`** 直查（本机 stat / 前置远程确认）②索引搜索；逐仓 try/catch 失败隔离 + 20s 总耗时上限
    （超时/命中满则如实报“未扫描”）；`path` 逐仓前缀过滤；`msgData` 回传跨仓元信息；按 path+name 去重；grep 分支明确拒绝跨仓。
  - `AgentSearchQuery.exactNameCandidate()`：只有“恰好一个 name 条件 + 值不含 `*`/`?` + 无 mustNot”才拿去做直查（宁缺勿滥）。
  - 工具层：`search_files` required `["vid","query"]` → `["query"]`；描述写明可跨仓 + 直查语义 + “拿到 vid 后要显式传下去”；
    `grep_files` 描述如实说明“只匹配文件内容 / 从不返回目录 / 只支持单仓库”；渲染加 `vid=5(test)`、`[目录] name/`、`命中=直查`、
    未扫完与失败仓库如实披露、跨仓命中后追加下一步提示。
- **验证**：
  - 护栏 `TestSearchCrossRepo` **45 项**（含源码 lint：直查必须经 `docSysGetDoc`，`agentFindDocDirect` 内不得出现 `fsGetDoc(`，
    因为 `fsGetDoc` 只覆盖 `type<3` 本机仓库、对前置仓库 100% 假阴性）→ **全量 32 套 / 1186+45 项断言 0 失败**。
  - 真探针 `FindCrossRepoE2E` **22/22 PASS**：含 raw Lucene 对照（索引 0 命中 vs 磁盘存在）、跨仓 1 次调用命中
    `vid=5 / [目录] 66666/ / 命中=直查`、单仓同样命中、vid=11 不串味、跨仓空结果如实、跨仓 grep 被拒、
    成本对照（跨仓 1 次 93ms vs 逐仓 17 次 366ms）。
  - **页面 E2E**（deepseek-v4-flash）：问“66666/ 在哪个仓库” → **1 步工具调用**（`search_files` 不带 vid）答出
    “仓库 test（vid=5）”；追问“里面有哪些文件” → `list_docs({"vid":5,"path":"66666/"})` **1 步**（vid 正确带过去了）。
    对照改造前的 6 次 `list_docs`。
- **遗留**：①前置仓库（`remoteServerGetDoc`）dev 无 type≥3 仓库，**无法 E2E**，仅由源码 lint 锁住调用方式；
  ②实测发现 repo 5 索引只覆盖 `MxsDoc/` 子树 —— 疑似索引同步/重建的覆盖缺陷，已单列为 **R3-13**。

#### R3-11 help 技能族：整族删除（✅ 2026-09-20，用户裁定 A+C）
- **发现过程**：R3-2 批 2b 只记了"`WebRoot/WEB-INF/skills/system_help` 演示件过期"。本次核查时发现整族都烂，且比原记录严重：
  - **磁盘演示件是编造的**：`SKILL.md` 教模型跑 `docsys help`（dev 根本没有这个可执行文件）、
    `scripts/run.bat` 指向 `http://localhost:8080/api/help` + 占位凭据、`references/api.md` 写了一个不存在的
    `GET /System/help.do`、`references/related-skills.md` 指向并不存在的兄弟技能目录。
  - **三个 sibling 同族**：`help-repos`/`help-docs`/`help-search` 在 `DocSysSkillExecutor.BUILT_IN_SKILL_IDS` 里
    **但从未被注册**（模型看不见技能列表里没有它们）→ **猜 id 就能命中**，返回的却是 docId 时代的 CLI 命令表
    （`create-repos <name> <desc> <path>`、**`delete-doc <vid> <docId>`**、`search <query> [vid]`）——
    工具名全都不存在，且 `docId` 定位已在 R1-6 下线 → **会把模型引回废弃用法**。
  - **`SubAgent` 里还有最陈旧的一份**：`handleHelp/handleHelpRepos/handleHelpDocs/handleHelpSearch` 四个方法，
    命令表里含硬编码 `login admin admin2026` 示例、`chat-with-docs`/`ai-models` 等已下线 CLI，
    而 `taskType="help*"` 是**可达的**（`MainAgent.executeSubTasks` → `subAgent.execute`）。
- **用户裁定（A + C）**：`system_help` 的实际用途不大（返回的工具速查 + 约定与工具 schema 重复）→ **整族删除**。
  删前核对过：那 5 条"关键约定"逐条都在工具描述里有对应表述（path/name 定位在 `get_doc`/`list_docs`/写工具参数里、
  续读在 `get_doc`、search→grep 在两个搜索工具里、docId 已从参数面彻底移除），所以删除**不丢信息**。
- **实现**：
  - `DocSysSkillExecutor`：白名单去掉 `help`/`system_help`/`help-repos`/`help-docs`/`help-search`，
    删除 `handleHelp`/`handleHelpRepos`/`handleHelpDocs`/`handleHelpSearch` 四个方法；
  - `ExternalSkillExecutor`：排除集同步去掉这 5 个 id（留着会挡住将来同名的外部技能）；
  - `SkillManager`：不再注册 `system_help`（人类"命令帮助"列表里少一条）；
  - `SubAgent`：删除 4 个 handler + 4 个 taskType 分支 + `getCategory` 里的 help 分类
    （这些 taskType 现在落到 `handleUnknownTask` → 注册表报"未知技能"）；
  - 磁盘：`git rm -r WebRoot/WEB-INF/skills/system_help`（源码树整目录删除）+
    手工删除运行期副本 `C:\DocSysReposes\skills\system_help`（**源码删了 store 不会自动删**）。
- **验证**：
  - 护栏 `TestSkillExecEncoding` 重写为 **46 项**（旧 34 项的"system_help 必须被接管"断言被删除）：
    5 个 id 逐个断言 `canHandle=false` 且 `execute` 返回 `Unknown skill`；`banner`/`web_search`/`playwright` 仍正常；
    源码 lint 锁住四个文件（白名单/排除集/SubAgent handler/SkillManager 注册）不得复活 + 技能目录已删除。
    → **全量 32 套 / 1199 项断言 0 失败**。
  - **live 验证**：`GET /agent/skills` 技能数 **7 → 6**（`java-expert, browser_use, web_search, playwright, ant-expert, banner`）。
  - **页面 E2E**：让模型"执行 system_help 技能" → 模型先判断列表里没有它、为稳妥仍实际调用一次（确认弹窗 ✓）→
    **`❌ run_skill 失败：No executor found for skill: system_help`** → 如实回答"技能不存在"并列出 6 个真实技能、
    建议改用 `banner`（**未臆造输出**，正是 R3-3/P3b 要的口径）。
- **⚠️ 踩坑（护栏自己的教训）**：`external.canHandle("help-repos")` 在不含排除集后**不再短路**，会走到外部技能目录查找
  → 触碰 `BaseFunction.<clinit>` → 裸 JVM 里 `Log` 写文件失败递归 StackOverflow（已踩，栈全是 `Log.info`）。
  因此"外部执行器也不再接管它们"改成**源码 lint**断言；另：源码 lint 断言方法时要用**方法定义形式**
  （`private SkillExecutionResult handleHelp`），裸名字会被注释里的历史记录命中（本次两处都踩过）。
- **相关观察（未做，留 R3-4）**：`banner` 技能保留，但它的"快速开始"仍是旧 CLI 味道
  （`login <user> <pwd>`、`list-repos`、`search <关键词>`、`help`）——与本次删除同源，属旧编排清理范围。

#### R3-12 `web_search` 摘要未清理 HTML 实体（✅ 2026-09-21）
- **根因**：`WebSearchService.stripHtml` 只硬编码了 6 个实体（`&nbsp; &amp; &lt; &gt; &quot; &#39;`），
  而 Bing 摘要里高频出现 `&ensp;`（U+2002）、`&#0183;`（·）、`&hellip;`、`&mdash;` 等 → **原样漏进模型上下文**。
  实测原始 HTML：`DocSys 文档管理系统` 113 处实体（`&ensp;`=14、数字实体=7）、`kafka 消息队列 原理` 69 处、
  `中文 编码 GBK UTF-8 区别` 58 处。
- **修**：`stripHtml` 改为 ①去标签 ②`unescapeHtmlEntities`（**数字实体十进制/十六进制** + 常见具名实体表；
  未收录的具名实体**原样保留**，不瞎猜不丢信息；缺分号/过长片段当普通字符）③`normalizeUnicodeSpaces`
  （nbsp/ensp/emsp/thinsp/U+2000–200B/全角空格/BOM → 普通空格）④折叠空白。
- **验证**：
  - 护栏 `TestWebSearchTool` **30 → 50 项**（新增真实形态 Bing 片段：`&ensp;`/`&#0183;`/`&#183;`/`&hellip;`/
    `&#x25CF;`/`&nbsp;&nbsp;`/`&mdash;`/未知实体/坏数字实体/标签）＋ 源码 lint（必须走通用解码、
    不得退回硬编码 6 实体）→ **全量 32 套 / 1219 项断言 0 失败**。
  - 真探针 `WebSearchEntityE2E` **8/8**（自带对照：直抓 Bing HTML 数实体 113/69/58 处 → 服务输出 15 条摘要/标题
    **实体残留 = 0**，无 U+00A0/U+2002 残留）。
  - **页面 E2E**（deepseek-v4-flash）：让模型用 `web_search` 查 DocSys → 1 步返回，摘要里 `·`、`…` 已是正常字符、
    **全卡无 `&ensp;`/`&#…;`**；模型还如实标注"第 5 条是另一个同名项目"。
- **同类隐患排查**：agent 包内只找到一处同类（见 R3-14），未做（用户要求不扩范围）。

#### R3-14 `DocSysClient.serverErrorSummary` 提炼 HTML 错误页的问题（✅ 2026-09-21 修复，用户裁定「那就修掉」）

**位置**：`DocSysClient.serverErrorSummary(Response, String)`（`responseBodyString` 的唯一调用方；非 JSON 响应统一兜底成
`{"status":"fail","errorCode":"INTERNAL","msgInfo":"服务端返回非 JSON 响应（HTTP xxx）：<h1>…；这通常是服务端内部错误，可改用 list_repos/get_repos 确认对象是否存在，不要重试同一调用"}`）。

**已实测（真实 dev 服务器取证）**
- 取一张真实容器错误页（`curl /Doc/getDoc.do?reposId=5&docId=abc` → HTTP 400，968 字节）：
  `<h1>HTTP Status 400 - </h1> … <p><b>message</b> <u></u></p><p><b>description</b> <u>The request sent by the client was syntactically incorrect.</u></p>`。
- 该页 **h1 里没有原因**（message 为空）→ 现在给模型的是
  `服务端返回非 JSON 响应（HTTP 400）：HTTP Status 400 -`：**状态重复一遍、原因一个字没有**；
  真正有用的 `<b>description</b>`（"请求语法错误"）被整段丢弃。
- 追加的处置建议在 4xx 场景**方向是错的**：参数格式错被说成"服务端内部错误"，还把模型往"改用 list_repos 确认对象是否存在"引（实测 400/404 两个形状都是这样）。
- 这一组页面上**没有任何实体**（实测 `&xxx;` 出现 0 次）→ 实体问题在这些页面上不会发生（见下条）。

**代码级证据（尚未端到端复现）**
- Tomcat 7.0.56 的 `ErrorReportValve` 把 `RequestUtil.filter(response.getMessage())`（null 时取 `throwable.getMessage()`）
  同时放进 `<h1>` 的 `{1}` 与 `<p><b>message</b>`；而 `RequestUtil.filter` 字节码明确把
  `<`→`&lt;`、`>`→`&gt;`、`&`→`&amp;`、`"`→`&quot;`（`javap` 实测）→ **异常消息进入错误页时是实体形态**。
- 因此**真实 500**（有异常消息）时，`serverErrorSummary` 只 `replaceAll("<[^>]+>", "")` 去标签、**不解码实体**
  → `&lt;`/`&amp;` 会进模型上下文（与 R3-12 同类）。
- 复现条件：需要一个真实抛异常的 500（dev 里 DocSys 对非法参数一律返回 JSON；`docId=abc` 是 Spring 绑定失败 → 容器 400，
  message 为空）→ **待有真 500 才能采到页面**。

**修法（已做）**：
1. **抽公共清洗件** `com.DocSystem.agent.util.HtmlText`（`stripTags`/`decodeEntities`/`normalizeSpaces`/`clean`/`oneLine`）：
   R3-12 写在 `WebSearchService` 里的实体解码整体搬过去（`WebSearchService.stripHtml` 变成一行转发），
   两个消费者共用同一口径 —— 避免“一处修了另一处忘”。
2. **逐级取原因**：`<p><b>message</b>>` → `<p><b>description</b>>` → h1 里 `HTTP Status 400 - ` 之后的部分 → 原文截断 120 字符；
   每一级都过 `HtmlText.clean`（去标签 + 解码实体 + 空白归一）。
3. **处置提示/错误码按状态分类**：400/405/406/415 → `INVALID_PARAM` + “请求本身的问题…修正后再试，不要原样重试”；
   401→`NOT_LOGIN`、403→`NO_PERMISSION`；404 → `INTERNAL` + “接口地址不存在（客户端调错路径，属实现缺陷）”；
   5xx → `INTERNAL` + “服务端内部错误…不要重试同一调用”。

**验证（三件套齐）**：
- 护栏新增 `TestServerErrorSummary` **33 项**：用**真实 Tomcat 页形态**做输入（真 400/404 页、500 页含转义异常消息），
  断言 ①400 页给出 description 里的真原因、`INVALID_PARAM`、不再说“服务端内部错误”；②404 指向接口地址不存在；
  ③500 的 `&lt;name&gt;`/`&amp;`/`&quot;q&quot;` 被解码（无实体残留）、且带引号的消息不破坏 JSON；
  ④逐级退化（h1 正文/原文截断）；⑤已 JSON 的响应原样返回、空响应体不硬造错误；⑥共用件基础行为
  （具名/十进制/十六进制实体、未收录实体原样保留、Unicode 空白归一）；⑦源码 lint：两个消费者都必须走共用件。
  → **全量 34 套 / 1291 项 0 失败**（修前 33 套 / 1257 项）。
- **真实探针 `R314Probe`（真 HTTP + 真代码路径）**：登录 → `getReposList` 仍走 JSON（status=ok，回归）→
  curl 级请求 `/Doc/getDoc.do?reposId=5&docId=abc` 拿到真容器 400 页 → 反射调用真实的 `responseBodyString(Response)`：
  - 修后：`{"status":"fail","errorCode":"INVALID_PARAM","msgInfo":"服务端返回非 JSON 响应（HTTP 400）：
    The request sent by the client was syntactically incorrect.；这是请求本身的问题：请检查调用参数/路径是否正确…修正后再试，不要原样重试"}`
  - 修前（同一张页）：`…（HTTP 400）：HTTP Status 400 -；这通常是服务端内部错误，可改用 list_repos/get_repos 确认对象是否存在，不要重试同一调用`
  → **10/10 PASS**（含“无实体残留”“无整页 HTML 噪声”）。
- **页面 E2E（回归）**：让模型 `web_search` 查 DocSys → 1 步、摘要里 `·`/`…` 正常字符、
  工具卡片里 `&xxx;` 实体残留 **0**、U+00A0/U+2002 残留 **0** —— 即“解码逻辑搬家后 web_search 未回退”。

**未覆盖（如实记录）**：真 500 页（异常消息带转义）**仍未端到端采到**（dev 里 DocSys 对非法参数一律返 JSON），
该形态由护栏的合成页 + `javap` 核实的 Tomcat 行为共同锁定；真 4xx 路径已由探针端到端覆盖。

#### R3-3 `run_skill` 对已下线 DocSys 能力的表现
- P3b 验收标准里写了"`run_skill("<DocSys能力>")` 应明确报 No executor"，但**未实测**。→ 补一次页面验证并记录。

#### R3-4 旧编排处置 + R3-5 `DocSysClient` 遗留方法（✅ 2026-09-21，用户裁定「方案 1 = 保守封口」）

**裁定前的可达性取证（实测，避免把"看着像死代码"当死代码）**

| 集群 | 规模 | 可达性 |
|---|---|---|
| `ToolUseLoop`（主路径） | 672 行 | **活**：dev 日志 `[ToolUseLoop]` 479 条 |
| 旧编排 = `SubAgent` + `LLMIntentParser` + `MainAgent` legacy 段 | **~3130 行**（SubAgent 1432 含 **34 个 `handle*`**；`decomposeTask` 单方法 493 行、53 处 `addSubTask`；MainAgent 1425） | **可达但从未跑过**：日志里 `SubAgent`/`Decomposed into`/`legacy` **全 0 次** |
| `DocSysCLI` | 475 行 | **无生产调用者**（全仓只有它自己 + `TestDocShareFormat` 读源码做 lint）；它正是 R3-5 那批方法留存的唯一理由 |
| 零调用者 client 方法 | — | `getManagerReposList` / `getSessionCookie` / `getSystemEmailConfig`（纯死代码） |

旧编排的三条入口逐条核过：① ToolLoop 失败兜底 —— `runToolUseLoop` 返回 null 只有"抛异常"或"畸形终止重试一次仍失败"两种**运行期真会发生**的情况（不是配置问题），日志里 `falling back to legacy` = 0 次；
② `POST /agent/execute` —— 全仓（前端/文档/脚本）**无调用者**；③ 灰度开关 `agent.tool-loop.enabled=false`（默认 true，`devDocs/Agent工具化改造开发上下文.md` 明写它是回退开关）。

**用户裁定（2026-09-21）：方案 1 = 保守封口**（"这部分代码没什么实质影响"）——不删旧编排（保留 ToolLoop 失败时的降级答案），但**冻结**；CLI 不动。

**做了什么**
- **R3-5 删零调用者方法**（3 个）：`getManagerReposList()`、`getSystemEmailConfig(String)`、`getSessionCookie()`。
  **只被 `DocSysCLI` 用的方法一律保留**（`getAiModelList`/`getDocSysConfig`/`ragChat`/`lockDoc`/`unlockDoc`/`searchDocs`/`getBannerConfig`/`getSystemConfig`）——方案 1 不动 CLI。
- **R3-4 封口三件套**：
  ① `MainAgent.process(...)` 三个重载 + `SubAgent` 类 + `LLMIntentParser` 类 → `@Deprecated`（javadoc 写明"仅兜底、禁止新增能力"）；
  ② 旧编排内部（`extractIntent`/`decomposeTask`/`executeSubTasks`/`getOrCreateSubAgent`/`TaskDecomposition`）→ `LEGACY-FALLBACK` 标记注释；
  ③ **兜底触发率可观测**：新增 `MainAgent.LEGACY_FALLBACK_TAG` + `MainAgent.logLegacyFallback(event, detail)`，旧编排进入点与 SSE 两处回退站点统一打点。
- **顺带**：修正 `SubAgent` 类注释里过期的分类说明（`7. SysOps - help, config, banner` → help 族已在 R3-11 删除）；
  `devDocs/tool-inventory.md` 中指向已删方法的 R3/R14 两行与 `getSessionCookie()` 标注为已下线。

**⚠️⚠️ 打点必须走 `com.DocSystem.common.Log`（本次踩坑）**
第一版用 slf4j `log.warn("{} LEGACY-FALLBACK …")` —— **在应用日志里一条都看不到**。原因：本工程 `log4j.rootLogger=info,stdout`，
slf4j 只落 stdout/Eclipse 控制台；**只有 `com.DocSystem.common.Log` 才写 docsys.log**（与 `[ToolUseLoop][STEP]` 同渠道，早有记录）。
正因如此，"兜底触发率"这类**要靠 grep 统计的日志必须用 Log**，否则等于没打。

**验证证据（三件套齐）**
- **护栏**：新增 `TestLegacyFallbackGuard` **38 项**（反射断言 3 个方法确已删除 + 相邻方法未误删；3 个 `process` 重载全部 `@Deprecated`；
  `SubAgent`/`LLMIntentParser` 类 `@Deprecated`；封口标记齐全；标记日志走 `Log` 而非 slf4j；**冻结基线 tripwire**：
  `SubAgent.handle*` = 34、`MainAgent.addSubTask` = 53，涨了就是有人往旧编排加能力）。
  → **全量 33 套 / 1255 项 0 失败**（R3-12 后为 32 套 / 1219 项）。
- **真实探针（正向触发兜底）**：临时挂 `tomcat/bin/setenv.bat`（`CATALINA_OPTS=-Dagent.tool-loop.enabled=false`，
  即文档里的回退开关）重启 → 页面发「列出所有仓库」，得**旧编排原始输出**（无工具卡片、无分页/紧凑渲染）：
  `Repositories: [1] 测试仓库2 - 测试仓库2 (type:1, path:C:/DocSysReposes/) …`（**17 个仓库全列**（vid 1–14/16–18），
  格式即 `SubAgent.handleListRepos` 的裸文本）；
  应用日志出现 **`2026-09-21 11:18:42 [warn] [LEGACY-FALLBACK] legacy-orchestration-entered (reason=tool-loop-disabled)`** ✓
  → 标记机制、reason 取值、`Log` 渠道三件事同时得证；**顺带取得"旧编排今天到底答成什么样"的实证**（比工具路径明显退化）。
  探针后删除 `setenv.bat` 并重启回默认（已核对 `Test-Path` = False）。
- **页面 E2E（正常路径回归，重启回默认后）**：
  ① 「列出仓库 5 根目录下 66666/ 里的文件」→ **1 步** `list_docs({vid:5, path:"66666/"})`，答"3 个文件"并给紧凑表格（1111.txt / README.md / 中文.txt）；
  ② 「读取仓库 5 根目录下 test111.txt 的内容」→ **4 步** `list_docs(path="")` → `search_files`（**命中=直查**）→ `list_docs(offset=50)` → `get_doc`，
  读出正文`大家好，我是测试文件` + "大小 20B，正文共 10 字符（已显示全文）" → **读写通道未受 R3-5 删除影响**；
  ③ 日志复核：`LEGACY-FALLBACK` **仍为 1 条**（探针那次），`[ToolUseLoop][NATIVE]` 164 → 168 → **正常路径不会误打兜底标记**（无误报），
  且探针钩子已删除（`Test-Path` = False、JVM 命令行无 `tool-loop` 属性）。

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
| **R1** | R1-1 errCode ✅ → R1-1b ✅ → R1-1c ✅ → R1-4 ✅ → **R1-6 定位全面 path/name ✅** → **R1-5 list_repos ✅** → **R1-2 create_doc_share ✅** → **R1-3 get_doc_share_list ✅** → R2（统一输出/大结果）→ R3 | 无 | 一提交一项，每项都过五步验证 |
| **R2** | R2-1 抽 helper 并定规范 → R2-3 search/grep → R2-2 get_doc 长文 | R1-1（错误码）建议先落 | 输出规范定型 + 护栏 `TestToolOutputContract` |
| **R3** | R3-2 全工具体检（批 1/2a/2b 全 ✅）→ R3-1 命名 ✅ → R3-3 run_skill ✅ → **R3-9 确认弹窗 ✅** → **R3-10 跨仓库找 ✅** → **R3-11 help 技能族删除 ✅** → **R3-12 摘要实体清理 ✅** → **R3-4/5 旧编排封口 + 零调用方法删除 ✅**（用户裁定方案 1）→ **R3-14 错误页提炼修复 ✅** → R3-13（用户暂缓）→ R3-6 检查单 | R1/R2 完成后 | 体检表（本页 R3-2 节）+ 检查单文档 |

> 每完成一项：更新本文状态列 → 更新工作卡"当前进展/未提交改动" → 提交（`devInt` 主干）。

---

## 3. 验证口径（三件套，缺一不可）

1. **护栏**（纯 JVM）：`java -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" com.DocSystem.agent.tool.TestXxx`
   - 现基线（2026-09-20 R3-9 后，**23 套 / 963 项断言全绿**）：`TestWriteConfirmGateCoverage 27` / `TestSkillExecEncoding 34` / `TestWriteReceiptFormat 47` / `TestReposToolsFormat 46` / `TestToolRegistry 36` / `TestToolOutputContract 82` / `TestListReposFormat 50` / `TestListDocsFormat 25` / `TestDocShareFormat 60` / `TestDocHistoryLocator 80` / `TestAgentFocusSupport 111` / `TestWriteTools 52` / `TestAgentSearchWriteTools 56` / `TestUserMemoryTools 26` / `TestWebSearchTool 30` / `TestToolCallParser 55` / `TestReturnAjaxErrorCode 23` / `TestPermissionErrorCoding 24` / `TestLockRetry 13` / `TestToolUseLoop 36` / `TestToolUseLoopNative 17` / `TestToolUseLoopStreaming 26` / `TestToolSchemaBuilder 7`
   - 注意 `TestAgentFocusSupport` 在 `com.DocSystem.agent.focus` 包，其余在 `com.DocSystem.agent.tool`
2. **真实探针**（Java 直连 8100，走工具层）：`%TEMP%\docsys_chk\*.java`（`MoveToolPathE2E` `ReposListE2E` `ShareToolE2E` `OutputContractE2E` `MatchProbe` `TotalProbe` `SearchProbe2`），用**真实数据**（仓库 5 根目录 79 项、仓库 1 大仓）
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
| R1-2 | P0 | create_doc_share 端点不存在 | ✅ | 改调 /Bussiness/addDocShare.do + path/name；链接实测无 cookie 可访问 |
| R1-3 | P0 | get_doc_share_list 语义错位 | ✅ | 改“我的分享列表”（无必填）+ 紧凑分页 + path/name 过滤 |
| R1-4 | P0 | get_doc_history 静默返回仓库根历史 | ✅ | 见本次提交 |
| R1-6 | P0 | 定位方式全面改为 path/name（✅ 全部工具 + `@` 注入块 + 导入冲突 + 删反查过渡层 + CLI） | ✅ | 见本次提交 |
| R1-5 | P0 | list_repos 截断（18 仓只看 9） | ✅ | 紧凑分页渲染 + 不再泄露 svnPwd；探针 28/28、页面 E2E 列全 17 个 |
| R2-1 | P1 | 统一工具输出规范 + 抽公共渲染件（`RowRenderer`/`fitPage`/`paged`/`moreHint`） | ✅ | 列表类 7 个工具已改走公共件；护栏 82/82 + 源码 lint；写操作回执类并入 R3-2 |
| R2-2 | P1 | get_doc 长文 maxChars/offset | ✅ | 探针：31390 字符分 11 窗口读全且逐字符一致 |
| R2-3 | P1 | search_files/grep_files 大结果验证与紧凑化 | ✅ | 探针：search 19840→2746/页（5 页覆盖 100 条）；grep 687130→3122 |
| R2-4 | P1 | 命中数语义（服务端不给总数）+ match 大小写引导（页面 E2E 发现） | ✅ | 表头区分“全部命中/已达上限”；页面 E2E 同问法 7 步→4 步、0 次 match 试错 |
| R3-1 | P2 | 参数命名一致（update_repos.reposId → vid） | ✅ | 统一为 vid 并删掉旧属性；护栏 TestReposToolsFormat 锁定 |
| R3-2 | P2 | 全工具体检表（28 工具）——**批 1 ✅ / 批 2a ✅ / 批 2b ✅** | ✅ | 批 1：仓库/备份/当前用户；批 2a：写回执 + 确认门安全洞；批 2b：memory/attachment/web_search/run_skill |
| R3-3 | P2 | run_skill 对已下线 DocSys 能力的表现 | ✅ | 未知技能报 `No executor found` ✓；子进程乱码已修（护栏 34/34）。当时的"`system_help` 死技能已修"已被 R3-11 接管——最终处置是**整族删除** |
| R3-11 | P2 | help 技能族过期/编造内容（演示件教跑不存在的 CLI、端点、占位凭据；三 sibling 是 docId 时代 CLI 文案） | ✅ | 用户裁定 (A)+(C)：整族删除 → 调用得到明确"未知技能"；护栏 TestSkillExecEncoding 46 + 全量 32 套/1199 项 |
| R3-12 | P2 | `web_search` 摘要未清理 HTML 实体（`&ensp;`/`&#0183;`） | ✅ | 改为通用实体解码 + Unicode 空白归一；护栏 30→50、探针 8/8（源 113 处实体 → 清洗后 0 残留）、页面 E2E 干净 |
| R3-14 | P2 | `DocSysClient.serverErrorSummary` 非 JSON 错误页提炼：只取 h1（丢掉 message/description）、不解码实体、4xx 误报为“服务端内部错误” | ✅ | 改为 message→description→h1正文逐级取 + 走共用件 `util/HtmlText`（R3-12 解码搬家）+ 按 4xx/5xx 分类提示与错误码；护栏 33 项、全量 34 套/1291 项 0 失败、真探针 10/10（真 400 页）、页面 E2E web_search 实体残留 0 |
| R3-13 | P2 | repo 5 的 Lucene 索引只覆盖 `MxsDoc/` 子树（`培训资料/`、`66666/` 等磁盘上存在但索引 0 条）—— 疑似索引同步/重建的覆盖缺陷 | ⬜（用户暂缓） | R3-10 实测发现。用户判断"应是其他原因导致"，**先不查** |
| R3-4 | P2 | 旧编排（SubAgent/MainAgent/LLMIntentParser）处置：**用户裁定方案 1 = 保守封口** | ✅ | 不删（ToolLoop 失败的安全网），改：入口 `@Deprecated` + 封口注释 + 新增 `[LEGACY-FALLBACK]` 打点；护栏 38 项（含冻结基线 tripwire）、探针（回退开关强制触发）1 条标记 + 旧编排实际输出、全量 33 套/1255 项 0 失败 |
| R3-5 | P2 | DocSysClient 遗留方法清理 | ✅ | 只删**零调用者** 3 个（`getManagerReposList`/`getSessionCookie`/`getSystemEmailConfig`）；CLI 专属方法全保留（方案 1 不动 CLI）；`tool-inventory.md` 同步标注 |
| R3-6 | P2 | 新工具上线检查单（流程固化） | ⬜ | |
| R3-7 | P2 | `getLoginUser()` 自写响应 → 双写隐患 | ⬜ | |
| R3-8 | P2 | 移除 `isLockBusy` 文案兜底（R1-1 收尾） | ⬜ | |
| R3-9 | P2 | 确认弹窗只显示工具名、不显示参数（R2 页面 E2E 发现） | ✅ | 加 `summarizeArgs`（脉敏 + 长值只给长度）；护栏 13→27，页面 E2E 两次弹窗均带参数行 |
| R3-10 | P2 | 无“跨仓库按路径/名字找”的能力（R2 页面 E2E 发现） | ✅ | `search_files` 的 vid 改可选（跨仓）+ 不依赖索引的 `docSysGetDoc` 直查；护栏 45 项、探针 22/22、页面 E2E 1 步（旧 6 步）；写/读类工具 vid 仍必填 |
