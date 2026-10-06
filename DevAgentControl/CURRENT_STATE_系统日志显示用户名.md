# CURRENT_STATE_系统日志显示用户名（挂起卡）

> 状态：**用户 2026-10-06 裁定「暂时先不改」**（客户提出 → 已调研 → 两条路径均有代价 → 暂缓）
> 触发条件：客户/用户再次提出，或明确「只要名字、不要账号」时 → 按本卡「若开工需先裁定」的 5 个问题问清后开工
> 关联：日志管理/操作日志（见已归档的 `已完成/CURRENT_STATE_日志导出.md`、`devDocs/日志导出方案.md`）

## 需求

某用户反馈：**系统日志里只记录了账号名，希望支持显示「用户名」**。

## 现状结论（2026-10-06 已核对源码）

- `SystemLog`（`src/com/DocSystem/common/entity/SystemLog.java`）17 字段，写入点**只有一处**：`BaseFunction.java:5835-5841`
  - `log.userId = user.getId() + ""`（已记录数字 ID）
  - `log.userName = user.getName()` → 存的是**登录账号**（产品里「用户名」= 账号，见「用户管理」页表头：用户ID/用户名/角色/昵称/名字）
  - 另两个名字字段 `user.realName`（「名字」）、`user.nickName`（「昵称」）**没有进日志**
- 索引读写是**反射全字段**：`LuceneUtil2.buildDocumentForObject/buildObjectForDocument` 用 `getDeclaredFields()` + `Store.YES`，给 `SystemLog` 加字段**不需要改索引代码**（`src/util/LuceneUtil/LuceneUtil2.java:1985/2090`）
- 展示位置：① 日志管理列表「用户」列（`WebRoot/manager/tmpl/systemLog.html:49 {{value.userName}}`）；② 导出 CSV 的「用户/User」列（同源）；③ 关键字搜索按 `userName/action/content/event` 包含匹配（`filterSystemLogsBySearchWord`，列表与导出**共用**）
- 边界情况（做兜底时必须考虑）：
  - 未登录/系统任务 → `userId=""`、`userName="未知用户"`
  - **登录失败** → `userName` 是用户**输入的原文**（LDAP 环境可能带域名 `域名/账号`），`userId` 是字符串 **`"null"`**（`UserController:65` 附近 `tmp_user.setName(userName)`，id 为 null）→ 按 `userName` 精确反查用户表查不到，按 `userId` 反查也要兜底
  - LDAP 用户的 `realName` 只在**每次登录时**从 LDAP 刷进 session、**不落库**（`BaseController:3100 dbUser.setRealName(ldapLoginUser.getRealName())` 只改内存对象）→ 库里的 realName 可能是空/旧值
  - 写入时用的 `user` 是 **session 里的登录对象**（`login_user` 只在登录时装载，`BaseController.getLoginUser` 只读 session）→ 管理员中途改名，快照会是登录时的旧值
- 顺带：「使用统计」页（`tmpl/userUsageStats.html`）同样只显示账号（同源问题，若做可一并处理）

## 两条路径与代价（已向用户呈现）

- **A 写入时快照**（给 `SystemLog` 加 `realName`/`nickName` 字段，写日志时一起存）
  - 优点：查询/导出/搜索都不查库；是「当时是谁」的历史快照
  - 代价：**历史日志该字段为空**（补齐需重写 Lucene 索引）；snapshot 取自 session 对象，改名后旧会话内为旧值
  - 用户理解为「需要改数据库/索引结构」→ 不接受
- **B 读取时解析**（列表/导出里按 `userId` 查用户表补显示名）
  - 优点：历史日志也生效；改名后统一显示新名；不动索引
  - 代价：**要兜底**（已删除用户、`userId="null"`、LDAP 无 realName）；每次查询多一轮用户解析（`userService.geAllUsers()` 建 map 去重，成本可控）
  - 用户理解为「需要兜底」→ 不接受
- **C A+B 组合**：写时快照 + 读时为空兜底（当时我的建议）

## 用户裁定（2026-10-06）

> 「方案A需要改数据库，方案B需要兜底，暂时先不改了」

→ **暂不实施**。未获新裁定前不要改代码。

## 若将来开工：需先裁定

1. 显示哪个：**名字 `realName`** / **昵称 `nickName`** / 两者（如 `张三(zhangsan)`）？
2. 列表「用户」列**替换**成显示名，还是**新增一列**保留账号？（导出 CSV 同理：现有「用户 + 用户ID」两列）
3. 历史日志管不管 → 决定选 A（只对新日志生效）还是 B/C
4. 搜索是否也要能按显示名搜（若需要，并进 `filterSystemLogsBySearchWord`，保持列表/导出口径一致）
5. 「使用统计」页是否一起改

## 若实施：落点清单

- 写入侧：`src/com/DocSystem/common/BaseFunction.java:5816-5841`（`addSystemLog`）+ `src/com/DocSystem/common/entity/SystemLog.java`
- 读取侧：`src/com/DocSystem/controller/ManageController.java` 的 `getSystemLogList.do:4298`、`exportSystemLogList.do`（`:4408` 一带）、`filterSystemLogsBySearchWord`
- 前端：`WebRoot/manager/tmpl/systemLog.html` / `systemLog_en.html`（列定义）、`main.js` 的 `SystemLogListDisplay`、CSV 列头常量（`LOG_CSV_HEADERS_CH/EN`）
- 用户解析可用：`userService.geAllUsers()`（`UserServiceImpl:53`）、`userService.getUser(id)`（`UserServiceImpl:74` → `selectByPrimaryKey`）、`BaseController.getUserByName:3159`
