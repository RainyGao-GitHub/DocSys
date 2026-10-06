# CURRENT_STATE_用户管理搜索排序（工作卡）

> 状态：**已实施并验证，等用户确认提交**（2026-10-06；改动需重编译+重启，已重启）
> 前卡：`DevAgentControl/已完成/CURRENT_STATE_证书订单时间筛选.md`（已收尾：主仓库 `2beb1f71e`、sales 仓库 `b1cd075`）

## 任务

用户 2026-10-06：
1. **搜索优化**：支持部分信息匹配（现在要求完整匹配，对用户不友好）
2. **增加排序选择**（创建日期、用户名，升序和降序），**默认创建时间降序**（最近创建的在前）

用户要求：**先出方案，确认后开工**。

## 调研结论（全部已取证）

### 1. 搜索为什么"必须完整匹配"

链路（全部在同一调用链上）：

```
WebRoot/manager/main.js:6895  showUserList()  → POST /DocSystem/Manage/getUserList.do {userName, pageIndex, pageSize}
  ↓
ManageController.java:2833  getUserList(String userName, Integer pageIndex, Integer pageSize)
    有 userName 时：user.setName/realName/nickName/email/tel = userName（同一关键字塞进 5 个字段）
    无 userName 时：user = null
  ↓
BaseController.java:3213  getUserListOnPage(user, pageIndex, pageSize, queryResult)
    user != null → getCountWithParamLike(param) + getUserListWithParamLike(param)   ← 走 "Like" 分支
    user == null → getCountWithParam / getListWithParam                          ← 走精确分支
  ↓
BaseController.java:23130  buildQueryParamForObj()  ← 反射取字段，**把原值直接放进 param，不拼 `%`**
  ↓
UserMapper.xml:375  queryUserWithParamLike： where 1=1 and ( NAME like #{name} or REAL_NAME like #{realName} or NICK_NAME like #{nickName} or EMAIL like #{email} or TEL like #{tel} )
UserMapper.xml:353  getCountWithParamLike：同条件（**count 与 list 是两处 SQL，必须同步改**）
```

**根因**：SQL 用了 `like`，但参数值不带 `%` → `like 'Admi'` 在 SQLite/MySQL 里等价于 `= 'Admi'` → 只有完整匹配命中。

实测（dev 8100 真实接口，5 个用户 `Admin/System/test/test2/wangwu`）：

| 关键字 | 命中 | 说明 |
| --- | --- | --- |
| `Admin`（完整） | 1 ✅ | 现在只有这种能用 |
| `Admi`（前缀） | **0** ❌ | |
| `dmin`（中间子串） | **0** ❌ | |
| `admin`（大小写反转） | 1 ✅ | 大小写不敏感（SQLite LIKE 对 ASCII 不敏感；MySQL collation 同样） |
| `652055239`（邮箱前缀） | **0** ❌ | |

SQL 层对照（SQLite 探针）：`like 'Admi'`→0，`like '%Admi%'`→**1**，`like '%admin%'`→**1**，`REAL_NAME like '%王%'`→**1** → 加 `%` 即可解决。

### 2. 排序现状

- 同一 SQL 末尾**写死** `ORDER BY NAME ASC, CREATE_TIME DESC`（`UserMapper.xml:375` 附近）→ 实测列表返回顺序 = **用户名升序**（Admin, System, test, test2, wangwu），与创建时间无关；`NAME ASC` 是主排序。
- 页面（`tmpl/user.html` / `user_en.html`）**没有「创建时间」列**（表头：`# 用户ID 用户名 角色 昵称 名字 手机 邮箱 网络限制 操作`）→ 即使改了默认排序，用户也看不出依据。
- 排序可靠性（SQLite 探针实测）：
  - `CREATE_TIME` 是 **`VARCHAR(50)`**，写入格式一律 `yyyy-MM-dd HH:mm:ss`（定长 19；dev 5/5 行合规、无空值、distinct=5）→ **字典序 = 时间序** ✅
  - `order by CREATE_TIME desc` → `System(10-06 20:49) → wangwu(10-06 15:49) → Admin(07-31 19:04) → test2(06-05) → test(2025-12-26)` ✅ 正确
  - `order by ID desc` → `System → wangwu → test2 → test → Admin` ❌ **与时间序不同 → 不能靠 ID 排序**
  - 所有创建路径都写同一格式：`ManageController:2922`（首个管理员）、`:3182`/`addUser`、批量导入（`ManageController:3182` 附近，`SimpleDateFormat("yyyy-MM-dd HH:mm:ss")`）、LDAP 导入（`BaseController:474`、`ManageController:3012`）

### 3. 数据库与 SQL 可移植性（关键约束）

- **默认/dev 库是 SQLite**：`src/jdbc.properties` = `jdbc:sqlite:${catalina.home}/DocSystem.db`；dev 实际文件 `C:\TomcatForDocSysDev\docsys\tomcat\DocSystem.db`（CATALINA_HOME=`…\docsys\tomcat`，见 `docsys_restart.bat`）。产品也提供 MySQL（`C:\TomcatForDocSysDev\docsys\mysql`、`mysql_start.bat`）。
- ⇒ **不能用 `concat('%', #{x}, '%')`**（SQLite 无 `CONCAT()`）→ **`%` 必须在 Java 侧拼进参数值**，SQL 保持 `like #{name}` 不变 ✅ 双库通吃。
- 大小写：两库都"ASCII 大小写不敏感"；SQLite 非 ASCII 走二进制比较、MySQL 依 collation → 中文按原样匹配 ✅ 无需处理。
- 性能：`%kw%` 无法用索引 → 全表扫描；`user` 表规模小（dev 5 行、客户通常几十~几百行）✅ 可接受。

### 4. mapper XML 有"双份"（实施必踩的坑）

- `spring-mybatis.xml:55-58` 用 `mapperLocations = classpath:com/DocSystem/mapping/*.xml` + `classpath:mapper/*.xml` → **运行时加载的是 `WebRoot/WEB-INF/classes/com/DocSystem/mapping/*.xml`**，不是 `src/…`。
- 两份当前 MD5 完全一致（Eclipse 构建会把 src 资源复制到 classes）；`WebRoot/WEB-INF/classes` 被 `WebRoot/WEB-INF/.gitignore` 忽略（不入 git）。
- ⇒ 改 `src/com/DocSystem/mapping/UserMapper.xml` 后**必须同步复制到 classes**，否则重启也不生效（且 XML 改动需重编译+重启）。
- `src/mapper/*.xml` 是 Agent 的 12 个 mapper，与本任务无关。

### 5. 其他受影响面

| 位置 | 关系 |
| --- | --- |
| `UserMapper.xml:353 getCountWithParamLike` | 与 list 是**两处 SQL**，条件必须同步改（历史教训：日志导出口径漂移） |
| `BussinessController.java:5332`（**websocket 仓库**） | **导出用户同源**：`getUserList(user)` → 同一 Like SQL ⇒ 搜索语义变化会同时改变导出范围/顺序 |
| `ManageController:3726` `queryReposMemberWithParamLike`（`ReposAuthMapper.xml:334`） | 仓库成员搜索，同一"like 不带 `%`"写法 → 同样只能完整匹配 |
| `GroupMemberMapper.xml:112 queryGroupMemberWithParamLike` | 用户组成员搜索，同上 |
| `getCountWithParamLike` 的 `where 1 = 1 and ( <if name> NAME like ...</if> <if realName> or …` | 若 `name` 为 null 而其它字段有值 → 拼出 `and ( or REAL_NAME like ?)` **语法错误**；当前调用链总是 5 字段同设 ✅ 不触发，但改参数结构时要防 |

## 裁定（用户 2026-10-06）

- **D1 排序控件形态**：先定「工具栏下拉」→ 用户 2026-10-06 复核后改为 **表头点击排序**（下拉方案不友好）✅
- **D2 不补「创建时间」列**，改用**用户ID / 用户名**排序 → 落地为：排序字段 `id`/`name`，**默认 `id` 降序**（新增用户 ID 递增 ⇒ 等价「最近创建在前」）
- **D3 导出跟随列表排序** ✅
- **D4** 用户组/仓库成员搜索同类问题 → **本轮不动，另立任务**
- **D5** `%`/`_` 转义 → **不做**
- **D6** 空格分隔多关键字 AND → **不做**

## 实现

### 后端（主仓库）
- `BaseController.java`：新增 `getUserListOnPage(..., sortField, sortOrder, queryResult)` 与 `getUserList(user, sortField, sortOrder)`，**旧签名保留并委托**（websocket 仓库 `BussinessController:1222` 也在调，不能改签名）；新增 `addUserSearchAndSortParam()`：① 对 `{name, realName, nickName, email, tel}` 的值包 `%…%`（部分匹配，**Java 侧拼**）② 排序白名单 `id|name` × `asc|desc`（默认 id/desc）放进 param。
- `ManageController.getUserList.do`：新增 `sortField`/`sortOrder` 参数并透传。
- `src/com/DocSystem/mapping/UserMapper.xml`：新增 `<sql id="User_List_OrderBy">`（`<choose>` 拼固定 ORDER BY，**无 `${}`**：name desc/name asc/id asc/otherwise id desc，均带 `ID DESC` 作第二键）；`queryUserWithParamLike` **与** `queryUserWithParam` 两处写死的 `ORDER BY NAME ASC, CREATE_TIME DESC` 都换成 `<include>`（**两条 SQL 都要改**：无关键字时走另一条）。
- **同步复制** `UserMapper.xml` 到 `WebRoot/WEB-INF/classes/com/DocSystem/mapping/`（`spring-mybatis.xml:55-58` 从 classpath 加载，运行时读的是这份）。

### 前端（主仓库）
- `tmpl/user.html` / `user_en.html`：「用户ID」「用户名」表头改为可点击（`#th-userId` / `#th-userName`，`class="user-sort-th"`，`onclick="changeUserSort('id'|'name')"`，内含 `<span class="user-sort-arrow"></span>`）；**无下拉框**。
- `static/style/style.css`：新增 `th.user-sort-th` 的 `cursor:pointer` / hover 底色 / 箭头样式。
- `main.js`：全局 `userSortField`/`userSortOrder`；`updateUserSortUi()`（把箭头 `icon-chevron-up/down` 画到当前排序列）、`changeUserSort(field)`（同列反向；新列用默认方向：ID=降序、用户名=升序；回第一页重查）、`showUserList()` 请求带 `sortField`/`sortOrder`、`UserListDisplay` 渲染回调调 `updateUserSortUi()`、`case "user"` 进页面重置默认。
- `exportUser.js`：导出请求带排序参数。

### 导出链路（websocket 仓库）
- `BussinessController.exportUserList`：新增 `sortField`/`sortOrder` → `getUserList(user, sortField, sortOrder)`（同一白名单），保证导出顺序与列表一致。

**生效**：javac → `WebRoot/WEB-INF/classes`；mapper XML 同步复制；**已重启**（`Server startup in 31388 ms`，日志无 mapper/OGNL 错误）。

## 验证（dev 8100 实测）

| 用例 | 结果 |
| --- | --- |
| 默认排序 | `8:System, 7:wangwu, 3:test2, 2:test, 1:Admin`（ID 降序）✅ |
| id asc / name asc / name desc | 三种均符合预期 ✅ |
| **非法排序值** `evil; drop table user` + `sortOrder=xx` | 无异常，回落默认 ✅（白名单生效）|
| 分页连续性（pageSize=2, name asc） | `Admin,System` / `test,test2` / `wangwu` ✅ |
| **部分匹配** | `Admi`→1、`dmin`→1、`admin`→1、`652055239`→1、`13777479349`→1、`王`→1、`王五`→1、`test`→2 ✅ |
| 搜索+排序组合 | `t` + name desc → `test2, test, System` ✅ |
| 中文页表头 | 无下拉框；「用户ID」「用户名」可点（`cursor:pointer` 生效），默认箭头在「用户ID」= `icon-chevron-down`（降序）✅ |
| 点「用户名」表头 | 一次 → `icon-chevron-up` + `Admin, System, test, test2, wangwu`；再点 → `icon-chevron-down` + `wangwu, test2, test, System, Admin` ✅ |
| 点「用户ID」表头（切列） | 先 → 降序 `8,7,3,2,1`（新列默认方向）；再 → 升序 `1,2,3,7,8` ✅ |
| 输入 `dmi` 点搜索 | 1 行 `Admin`，箭头仍在「用户ID ↑」✅ |
| 英文页 | `title`=`Click to sort by User ID / User Name`；默认 ID 降序；点 `Name` → `Admin, System, test, test2, wangwu` ✅ |
| 排序状态保持 | 切换/搜索后列表重渲染，箭头均在正确列 ✅；分页/删改后同样保持（代码级）|
| **D3 导出** | name asc → CSV 行顺序 `1,8,2,3,7`（与页面一致）；id desc → `8,7,3,2,1`；`searchWord=dmi` → 导出 1 行（部分匹配也生效）✅ |

未做 E2E：「新增/编辑/删除/导入后仍按当前排序」——**代码级确认**（这些回调都调 `showUserList()`，读同一批全局变量），未写入真实数据以避免在 dev 造测试账号。

## 方案/实施文档

`devDocs/用户管理搜索排序方案.md`（调研取证 / 裁定 / 实现 / 验证 / 坑 / 未做项）

## 未提交改动（等用户确认）

- **主仓库**：`src/com/DocSystem/controller/BaseController.java`、`src/com/DocSystem/controller/ManageController.java`、`src/com/DocSystem/mapping/UserMapper.xml`（+ classes 副本，未跟踪）、`WebRoot/manager/tmpl/user.html`、`user_en.html`、`WebRoot/manager/main.js`、`WebRoot/manager/exportUser.js`、`WebRoot/manager/static/style/style.css`、`devDocs/用户管理搜索排序方案.md`、本卡、`CLAUDE.md`、证书订单卡归档（删除+新增到 `已完成/`）
- **websocket 仓库**：`BussinessController.java`（导出接收排序参数）

## 遗留 / 未做

- D4：`GroupMemberMapper.xml:112`（用户组成员搜索）、`ReposAuthMapper.xml:334`（仓库成员搜索）同类「like 无通配」问题 → 另立任务
- 侧影响（已确认可接受）：`BussinessController.getPreferLinkAccessUsers.do:1222`（分享链接可访问用户列表）也变成部分匹配 + 默认按用户ID 降序
- `getCountWithParamLike` 的 `and ( <if name>…` 结构在「首个条件为空」时会拼出语法错误（当前不可触发，未动）

## 旧调研记录（实施时的取证，保留）

### A. 部分匹配

- **做法**：在 `BaseController.getUserListOnPage` / `getUserList(User)` 里把关键字包成 `%kw%` 后再进 param（5 个字段各包一次）；**SQL 不动**（保持 `like #{x}`）。
- 匹配范围不变：用户名 / 名字 / 昵称 / 手机 / 邮箱，5 字段 OR。
- 天然一致：count 与 list 用同一批 param ✅；导出与列表同 SQL ✅。
- 顺带加固（可选）：`getCountWithParamLike` 的 `and (` 用 `<trim prefixOverrides="or ">` 防"首个条件为空"时语法错误。
- 通配符（可选）：用户输入的 `%`/`_` 会被当通配符（输入 `%` 命中全部）。若要转义，**必须用 `ESCAPE '!'`**（`'\'` 在 MySQL 里是转义字符、SQLite 不处理反斜杠 → `ESCAPE '\'` 双库写法不兼容；`'!'` 两库都安全）。

### B. 排序选择

- 参数：`ManageController.getUserList.do` 加 `sortField` + `sortOrder` → `getUserListOnPage(..., sortField, sortOrder)` → mapper 动态 `ORDER BY`。
- **白名单**（防注入）：`sortField ∈ {createTime, name}`、`sortOrder ∈ {asc, desc}`，非法值回落默认；mapper 用 `<choose>/<if>` 拼固定片段（**不用 `${}` 直拼用户输入**）。
- 默认：`CREATE_TIME DESC`，并加 `ID DESC` 作同秒 tie-breaker（`ORDER BY CREATE_TIME DESC, ID DESC`）。
- UI：工具栏加「排序」下拉（创建时间↓ / 创建时间↑ / 用户名↑ / 用户名↓，默认第一项）；**备选**是表头点击排序（更直觉，但要处理箭头状态）。
- 建议同时给表格加「**创建时间**」列（否则默认按创建时间降序却看不出依据）。
- 状态保持：`case "user"` 进页面重置默认；`searchUser()`/翻页/删除/编辑/重置密码/网络限制 后的刷新都读全局变量保持；**每次 render 后回填下拉**（tmpl 整块重渲染，同证书/订单那套）。
- 导出：建议把 `sortField/sortOrder` 一起传到导出接口，保证**导出顺序与列表一致**（改 `exportUser.js` + websocket 仓库 `BussinessController`）。

### C. 落点

- 主仓库：`BaseController.java`（`%` 包装 + 排序参数）、`ManageController.java`（`getUserList.do` 参数）、`src/com/DocSystem/mapping/UserMapper.xml`（动态 ORDER BY + `<trim>` 加固）、`WebRoot/manager/tmpl/user{,_en}.html`（排序下拉 + 创建时间列）、`WebRoot/manager/main.js`、`WebRoot/manager/exportUser.js`
- websocket 仓库（若导出跟随排序）：`BussinessController.java`
- **同步复制** `src/com/DocSystem/mapping/UserMapper.xml` → `WebRoot/WEB-INF/classes/com/DocSystem/mapping/UserMapper.xml`
- 编译：javac → `WebRoot/WEB-INF/classes`；**需要重启**（Java + mapper XML 都改了）

### D. 待裁定项

| 编号 | 问题 | 我的建议 |
| --- | --- | --- |
| D1 | 排序控件形态：工具栏下拉 / 表头点击 | 下拉（简单、与既有工具栏一致、状态好保持） |
| D2 | 是否补「创建时间」列 | 补（否则看不出排序依据） |
| D3 | 导出是否跟随列表排序 | 跟随（导出与列表口径一致，同时间筛选那次的裁定思路） |
| D4 | 用户组/仓库成员搜索那两处同类问题是否一并修 | 本轮不动，另立任务（避免改动面扩大） |
| D5 | `%` / `_` 是否做通配符转义 | 暂不做（用 `ESCAPE '!'` 才双库安全，等客户反馈） |
| D6 | 是否要"空格分隔多关键字 AND" | 不做（保持单关键字 OR 五字段） |

## 验证计划（实施后）

1. 接口级（真实 HTTP + 直连库对照）：`Admi`/`dmin`/`王`/手机片段 各自命中数正确；五字段各自 部分匹配 均命中；`sortField` 非法值回落；四种排序组合的顺序断言；分页第 2 页与排序连续。
2. 页面级（中/英）：排序下拉出现且默认"创建时间↓"；切换后列表顺序变化 + 翻页/搜索保持；新增/删除/编辑后仍在当前排序；创建时间列显示。
3. 导出：CSV/xlsx 前几行顺序与列表一致；导出内容仍能被导入回灌（回归）。
4. 回归：批量导入、删除用户、重置密码等不受影响。

## 当前进展

- ✅ 调研 + 取证 + 方案（本卡）
- ⏳ 等用户对 D1~D6 裁定 → 然后开工
