# CURRENT_STATE_用户使用统计修复（工作卡）

建立于 2026-09-30。**状态：进行中（用户已裁定：P0+P1+P2 全做 → 可开工；改完 + 验证后等用户确认再提交）。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 参考计划与上下文 / 当前进展 / 生效约束（含是否需要先提交）。

## 任务

管理后台「使用统计」（左侧菜单 使用统计 → `WebRoot/manager/tmpl/userUsageStats.html`）客户反馈两个问题：

1. 最多只能显示 90 个用户的记录；
2. 用户不登出就统计不出时间。

用户要求：先调研根因 + 出修复方案，**确认后再动手**。

## 现状实现（唯一实现，勿再找第二份）

- 前端：`WebRoot/manager/main.js` `queryUserUsageStats()`（:4999）→ POST `/DocSystem/Doc/queryUserUsageStats.do`（参数 `startTime`/`endTime`）；
  渲染模板 `WebRoot/manager/tmpl/userUsageStats{,_en}.html` —— **无分页、无行数上限**。
- 后端：`src/com/DocSystem/controller/DocController.java:8560 queryUserUsageStats()`：
  - 取日志：`querySystemLogsByTimeRange()`（`src/com/DocSystem/common/BaseFunction.java:5871`）→ 按月读 Lucene 索引 `SystemLog-<year>-<month>`，
    `isearcher.search(builder, 500000)`（**日志条数上限，不是用户数上限**；已用 `javap` 对比 2.02.87 发布包字节码，同为 500000）
  - 计数：仅 `event=login 且 result=成功` 才 `loginCount++`
  - 过滤：`loginCount == 0` 的用户**整条丢弃**（:8668-8675）
  - 时长：把该用户 login/logout 时间各自排序后**按位次配对**（:8645-8665，注释称 FIFO）；**配不到 logout 的登录贡献 0**

## 根因（已取证，本机 8100 实测）

- **#2 时长算不出**：时长只来自 `login`→`logout` 配对，而 `logout` 日志**只在用户点「退出」时写**
  （`UserController.java:203-206`；直接关浏览器 / session 超时都不写）。
  dev 实测（2026 全年）：Admin `loginOK=778`，但 `logout=18` → **97.7% 的会话没有登出 → 这些登录全部计 0**。
- **#2 附加失真（严重）**：按位次配对会把相隔很远的登录与登出配成一对。
  dev 实测 Admin `loginDuration = 245526333638 ms ≈ 2841 天`，而查询窗口只有 365 天 → 数值荒谬。
- **#1 用户不全**：列表基底是"日志里出现过的 userName"，再丢掉 `loginCount==0` 的用户
  → **窗口内没重新登录、但有上传/下载/编辑等活动的用户整条消失**（时长也一起丢）；`userName` 为空/未知的行同样被混入再丢弃。
  dev 实测（2026 全年 4704 条日志）：日志里共 **8** 个 userName，统计只返回 **3** 个（有成功登录的）；
  被丢掉的 5 个中，`(none)` 有 **32 次上传 + 15 次下载**、`CoEditUser` 174 条、`System` 1698 条。
- ⚠️ **代码里不存在"90 个用户"这种硬上限**（链路已通读 + 发布包字节码对比）。"90" 最可能来自：
  ① 客户许可证「用户数量」档位恰为 90（`WebRoot/manager/addLicense.html:44` 有 `90人` 档；
  `BaseFunction.systemLicenseInfoCheck()` 用 `usersCount` 校验用户数，见 `BusinessChannel.java:1096-1115`），
  ② 客户看到的是"所选窗口内登录过的用户数"。**需向客户核实（见「待用户裁定」第 4 条）。**

## 修复方案（待裁定）

### P0 时长算法重写（纯后端；修 #2 与 "2841 天" 失真）

以该用户在窗口内的**可归因活动日志**（login/logout/上传/下载/编辑…，**排除系统任务类**如 `ReposCacheClean`/`DBBackup`/`ReposAutoSyncup`）+ 会话推断：

1. 成功 `login` 开启一个会话，起点 = login 时间；
2. 后续事件距上一条 ≤ **空闲阈值**（默认 30 分钟）→ 视为同一会话（把会话终点更新为该事件时间）；
3. 遇 `logout` 即闭合该会话；间隔 > 阈值 → 闭合旧会话，并从当前事件另起一个"隐式会话"（覆盖"不登出"场景）；
4. 计时长封顶 `min(会话终点, login + 会话超时上限)`（与 `session.setMaxInactiveInterval(24*60*60)` 对齐），再按查询窗口裁剪；
5. 总时长 = 各会话之和（**区间不重叠** → 不会再出现 2841 天这种累加）。

阈值与上限做成可配置常量（`docSysConfig.properties` 或常量类）。

### P1 统计维度改为"用户维度"（修 #1）

- 基底由"日志里出现过的 userName"改为 `userService.geAllUsers()`，再用日志填充活动；`loginCount` 允许为 0；
- 内置/匿名用户（`System`、`CoEditUser`、空 userName、`未知用户`）单独归并或标注，不与真实用户混在一起；
- 建议加"包含无活动用户"开关（默认列出全部用户，无活动显示 0/—）。

### P2 可选：轻量活动上报（解决"登录后只浏览、不登出"无信号）

- 现状**纯浏览/预览不写日志**（日志只覆盖写操作 + 管理操作）→ 不加信号时，"只读用户"的时长仍算不出；
- 方案：前端定时（如 5 分钟）调一个轻量接口（或挂在 `getLoginUser.do` 上），服务端仅在"该会话距上次记录 > 阈值"时写一条 `activity` 日志
  （每用户每 30 分钟 ≤ 1 条，日志量可控）。

### P3 可选：展示层

加"最后活动时间 / 会话数"列、按列排序、导出 CSV，并在页面上说明"空闲 30 分钟视为会话结束"。

## 用户裁定（2026-09-30）

1. **P2（活动上报）也做**。用户原话：若后台压力过大，只要**前端去掉定时调用**即可接受 → 所以「前端定时调用」就是唯一的开关，要单一、易摘除。
2. **「登录后无任何后续日志、也没登出」的会话时长 = 0**（保守口径）。
3. 空闲阈值 **30 分钟**、单会话上限 **24 小时**（与会话配置对齐）→ OK。
4. “90” **不追查**，判定为客户误解（许可证档位/所选窗口导致）。

## 实施清单（据上述裁定）

- **P0**：`DocController.queryUserUsageStats()` 重写时长算法（会话推断 + 区间合并 + 封顶 + 窗口裁剪，排除系统任务类日志）。
- **P1**：统计基底改为 `userService.geAllUsers()`；日志里不在用户表中的 userName（含空 userName / `未知用户` / `CoEditUser`）归并成一行「(未登录来源)」。
- **P2**：新增 `User/activityReport.do`（session 内节流，30 分钟才写一条 `activity` 日志）＋ 前端定时调用（`WebRoot/web/project.js`、`WebRoot/manager/main.js`）。

## 必读上下文（续接锚点）

- `src/com/DocSystem/controller/DocController.java:8560-8700`（`queryUserUsageStats` + `UserUsageStats` 内部类）
- `src/com/DocSystem/common/BaseFunction.java:5871-5930`（`querySystemLogsByTimeRange`，500000）
- `src/com/DocSystem/controller/UserController.java:52-105`（写 login 日志）、`:203-206`（写 logout 日志）
- `WebRoot/manager/main.js:4999-5043`（`queryUserUsageStats` / `formatDuration`）、`WebRoot/manager/tmpl/userUsageStats.html`
- 记忆：`/memories/repo/dev-tomcat.md`（编译 / 重启 / E2E 口径）

## 当前进展（如实）

- ✅ 调研完成：现状链路、两处根因、dev 实测数据（见上）。
- ✅ 用户已裁定（2026-09-30，见上）。
- ✅ **实施完成**（4 类改动）：
  1. `DocController.queryUserUsageStats()`：统计基底改为 `userService.geAllUsers()`（**所有用户都出现**，含从未活动的）；
     日志取 `[startTime-24h, endTime]`（接续跨窗口会话）；**计数只算窗口内**；
     时长改为**会话推断**（login 起点 + 活动延续 + logout 闭合 + 空闲 30 分钟切分 + 单会话封顶 24h + 窗口裁剪）；
     系统/伪账号（`System`/`CoEditUser`）排除；空 userName / `未知用户` / 已删除用户归并为 `(未登录来源)`（排最后，无活动不出行）。
  2. `BaseFunction.java`：新增 `USAGE_IDLE_GAP_MS(30min)` / `USAGE_SESSION_MAX_MS(24h)` /
     `USAGE_ACTIVITY_REPORT_INTERVAL_MS(20min)` / `SESSION_ATTR_LAST_ACTIVITY_REPORT`。
  3. `UserController.activityReport.do`（新增）：未登录不记；同一 session 20 分钟节流；写 `event=activity` 日志。
  4. 前端：新增 `WebRoot/web/js/UsageActivityReporter.js`（5 分钟轮询，标签页隐藏 / 用户 10 分钟无操作则不上报），
     在 `project.html/_en`、`manager/main.html/_en` 引入，并在 `project.js` / `main.js` 初始化时调用。
- ✅ **编译 + 重启 + E2E 验证通过**（dev 8100，2026-09-30 17:1x；新 PID 20472）：

  | 项 | 修复前 | 修复后 |
  |---|---|---|
  | 近一年返回用户 | 3（仅有成功登录记录的） | **5** = 4 个用户（含从无日志的 `test2`）+ `(未登录来源)`（32 上传 / 15 下载） |
  | Admin 近一年时长 | **2841 天**（错配） | **1.50 天**（≤365 天上限内，量级合理） |
  | 今天（Admin 当天 0 次登出） | 0 / 不显示 | **0:17:32**，不登出也能算出 |
  | `activityReport.do` 连调 2 次 | — | 只落 **1** 条 `activity` 日志（节流生效） |
  | 后台「使用统计」页 | 3 行 | **全部 4 个用户**（含 0 活动的） |
  | 仓库页 / 后台页上报 | — | 均发出 `/User/activityReport.do` 200（隐藏标签页不上报，符合设计） |

- ⚠️ **踩坑记录**：上报调用处必须加 `typeof UsageActivityReporterInit == "function"` 守卫。
  实测“浏览器缓存了旧版 HTML（里面没有该脚本标签）+ 新版 main.js（里面有调用）”会让 `pageInit` 抛
  `ReferenceError: UsageActivityReporterInit is not defined` → 后台页白屏/不初始化。加上守卫后兼容旧缓存。
- ⚠️ 未提交；**P3（列表排序 / 导出 CSV / 页面说明）未做**（用户未要求）。

## 下一步

1. **等用户确认后提交**（不要自动 commit）—— 全部改动都在**主仓库** `D:\Dev\DocSys`（`devInt`），无独立仓库改动：
   `git add -A` → commit（当前工作区只含本任务改动 + 上一步的工作卡指针）。
2. 收尾：提交确认后把本卡移入 `DevAgentControl/已完成/`，并同步 `CLAUDE.md` 指针。
3. 可选后续（用户未要求）：P3（列排序 / 导出 CSV / 页面说明）；或把“包含无活动用户”做成开关。
4. 上线注意事项：`event=activity` 会出现在「日志管理」页，每个活跃用户每 20 分钟 ≤ 1 条；
   若客户嫌日志多，把 `WebRoot/web/js/UsageActivityReporter.js` 的 `USAGE_ACTIVITY_REPORT_ENABLED` 置 false
   或去掉两个初始化调用即可（不影响时长推断以外的一切）。

## 生效约束

- **用户尚未裁定方案 → 不要自行开工改代码**。
- 代码改动归属：`DocController.java` / `BaseFunction.java` / `UserController.java` / `WebRoot/manager/**` 全在**主仓库** `D:\Dev\DocSys`（`devInt`）。
- 编译：Spring 控制器**必须** `-parameters -g`，输出 `-d WebRoot/WEB-INF/classes`；源码树不得出现 `.class`。
- 改 Java 后必须重启 dev Tomcat（`docsys_restart.bat`；启动 2~10 分钟，判据 = catalina `Server startup in` + 8100 Listen + 探一个 `.do`）；
  重启后 session 失效，需重新登录。
- E2E 口径：`POST /DocSystem/User/login.do`（`Admin`/`pwd=QWRtaW4=`，pwd 是 base64 明文）；探针产物写 `%TEMP%\docsys_chk\`。
- **不要自动 commit**：改完 + 验证 → 汇报 → 等用户确认。

## 未提交改动

- **主仓库** `D:\Dev\DocSys`（`devInt`）—— 全部未提交：
  - `src/com/DocSystem/controller/DocController.java`（统计重写：用户维度 + 会话推断时长）
  - `src/com/DocSystem/controller/UserController.java`（新增 `activityReport.do`）
  - `src/com/DocSystem/common/BaseFunction.java`（使用统计常量）
  - `WebRoot/web/js/UsageActivityReporter.js`（**新增**）
  - `WebRoot/web/project.html` / `project_en.html`（引入脚本）
  - `WebRoot/manager/main.html` / `main_en.html`（引入脚本）
  - `WebRoot/web/project.js` / `WebRoot/manager/main.js`（初始化调用 + 守卫）
  - `DevAgentControl/CURRENT_STATE_用户使用统计修复.md`（本卡）、`CLAUDE.md`（指针）
- 编译产物（不入库）：`WebRoot/WEB-INF/classes/com/DocSystem/{controller/DocController,controller/UserController,common/BaseFunction}.class`
