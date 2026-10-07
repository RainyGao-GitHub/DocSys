# DocSys 项目规则

## 会话恢复协议（每个会话 / 每次上下文压缩后必须先做）

上下文压缩会丢失关键信息（当前任务、参考计划、当前进展、生效约束）。以下步骤写入本文件以便压缩后自动重新触发——本文件每个会话都会被重新注入。

1. **读当前工作卡**：当前任务 `DevAgentControl/CURRENT_STATE_war打包.md`（导出可发布的 `DocSystem.war`：**必须排除字体库生成物**（清单以 `C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 为准）+ `.git`/`.gitignore`/开发期探针 class；2026-10-07 建立，**已产出并校验通过**）。工作卡是**当前任务**相关信息的唯一定义处：必读上下文、参考计划与上下文、当前进展、生效约束（含是否需要先提交）。
   - 前卡 `CURRENT_STATE_提示词管理编辑态.md` **已收尾**（智能体设置→提示词管理 改为「先点编辑才能改」，与 系统管理-系统设置 页一致；主仓库 `38595cd6a`），已移入 `DevAgentControl/已完成/`。该卡要点：① 复用 main.js 既有通用助手 `setSystemPageEditMode(prefix, fieldIds, editing)`（约定按钮 id `btnEnable<prefix>Set`/`btnSave<prefix>Set`/`btnCancel<prefix>Set`），prefix 用 `PromptConfig`；② 落点只有 3 个前端文件：`tmpl/promptConfig{,_en}.html`（三按钮 + 两个 textarea 默认 `disabled`）与 `main.js` 提示词段落（`PROMPT_CONFIG_FIELDS`、`promptConfigData` 缓存、`enablePromptConfigSet`/`cancelPromptConfigSet`，`savePromptConfig` 成功后才重渲染、**失败留在编辑态**）；③ POST 仍是 JSON body 到 `/DocSystem/agent/config/system-prompt`；④ 纯前端 → 无需编译/重启；⑤ ⚠️ **dev 服务常被用户主动停掉**：E2E 前先确认 8100 在监听，否则浏览器会用缓存页面"假装成功"；已重启验证过（E2E 全通过：默认只读 / 点编辑可改 / 取消还原 / 保存落库且回到只读 / 重新进入仍只读 / 英文页文案）。
   - 前卡 `CURRENT_STATE_用户管理搜索排序.md` **已收尾**（用户管理：搜索改**部分匹配** + 排序改**表头点击**（用户ID/用户名 × 升/降序，默认用户ID降序）；主仓库 `7814f27df`、websocket 仓库 `f61e03d6`），已移入 `DevAgentControl/已完成/`。该卡要点：① **搜索根因**：`ManageController.getUserList.do:2833` 把关键字同时塞进 `User` 的 name/realName/nickName/email/tel 五个字段 → `BaseController.getUserListOnPage:3213` → `UserMapper.xml:375 queryUserWithParamLike` 的 `NAME like #{name}`（五字段 OR），而 `buildQueryParamForObj:23130` **只把原值放进 param、不带 `%`** → `like 'Admi'` 等价于 `= 'Admi'`（实测 `Admi`/`dmin`/`652055239` 命中 0，`Admin` 命中 1）→ 只需在 Java 侧包 `%`；② **排序现状**：同一 SQL 末尾写死 `ORDER BY NAME ASC, CREATE_TIME DESC`（实测列表顺序 = 用户名升序）→ 要做成可选排序需动态 ORDER BY + 白名单；页面**没有「创建时间」列**；③ 库事实：**默认/dev 库是 SQLite**（`jdbc:sqlite:${catalina.home}/DocSystem.db`，产品亦支持 MySQL）→ **禁用 `CONCAT()` 之类 MySQL 专有函数**，`%` 必须 Java 侧拼；`CREATE_TIME VARCHAR(50)` 一律 `yyyy-MM-dd HH:mm:ss`（定长 19、5/5 合规）→ 字典序 = 时间序，实测 `order by CREATE_TIME desc` 正确而 `order by ID desc` 不同（不能靠 ID）；④ **mapper XML 是双份**：`spring-mybatis.xml:55-58` 从 classpath 加载 → 运行时读的是 `WebRoot/WEB-INF/classes/com/DocSystem/mapping/*.xml`（被 `WebRoot/WEB-INF/.gitignore` 忽略、与 src 当前一致）→ 改 `src/com/DocSystem/mapping/UserMapper.xml` 后**必须同步复制到 classes**，否则不生效；⑤ 影响面：`getCountWithParamLike:353` 与 `queryUserWithParamLike:375` 两处条件必须同步改（日志导出踩过口径漂移）；**导出用户同源**（websocket 仓库 `BussinessController:5332` 调 `getUserList(user)`）；同族问题还有 `GroupMemberMapper.xml:112`、`ReposAuthMapper.xml:334`；⑥ 裁定 D1~D6（**表头点击排序**（先定下拉、用户复核后改）/ 不补创建时间列改用用户ID+用户名 / 导出跟随排序 / 用户组·仓库成员搜索本轮不动 / 不做通配符转义 / 不做多关键字）→ **已实施并验证**（后端部分匹配 + 排序白名单 + mapper `<choose>` ORDER BY + 表头点击排序+箭头 + 导出带排序；后端需重编译+重启，已重启；前端改完硬刷新即可）；方案/实施文档 `devDocs/用户管理搜索排序方案.md`。
   - 前卡 `CURRENT_STATE_证书订单时间筛选.md` **已收尾**（证书/订单加时间范围筛选 + `SalesBase` 三处过期注释修正；主仓库 `2beb1f71e`、sales 仓库 `b1cd075`），已移入 `DevAgentControl/已完成/`。该卡要点：① 起因「证书超过 3 年看不到」的**根因是服务端默认时间窗口**——证书 `SalesBase.getLicenseListOnPage:460` = `now - 36*CONST_MONTH`（36×30 天 ≈ 2.96 年）、订单 `getOrderListOnPage:1774` = `now - 12*CONST_MONTH`（仅 1 年），而前端 `showLicenseList/showOrderList` **从不传时间** → 永远走默认窗口；② **数据没被删**（单一累积 Lucene 索引 `<SaleDataStorePath>/License/licensesIndex/`、`<SaleDataStorePath>/OderInfo/`，销售模块无任何清理代码），接口一直接受 `startTime/endTime`（仅 `null` 时用默认；`startTime=0` 即「全部」）→ 只需前端传参；③ 裁定 A：照日志管理页加时间筛选；**默认值与服务端原默认保持一致**（证书=近3年、订单=近1年）；④ 落点：`tmpl/license{,_en}.html`、`order{,_en}.html`（按钮+日期输入）、`main.js`（每组页面 4 个函数 `clear/highlight/init/setXxxTimeRange` + `searchXxx` 三态处理 + 请求带参 + 渲染回调恢复高亮）；⑤ 服务端默认窗口**本次未动**（要放宽需另裁定）；其三处过期注释已按用户指示修正（2026-10-06，属 **`src/com/DocSystem/sales/` 独立仓库**的改动，需与该仓库单独提交；纯注释、已重编译、无需重启）；⑥ 全程纯前端 + 注释，无 Java 逻辑改动。
   - 前卡 `CURRENT_STATE_导出用户修复.md` **已收尾**（导出用户：去掉 `pwd`/`serialVersionUID`、修 `\t`/无转义、新增 xlsx 导出 + 导入失败明细下载；websocket 仓库 `627b98ee`，主仓库 `baa263e34`/`3075240b1`/`9875be2ff`/`70b6b723c`），已移入 `DevAgentControl/已完成/`。该卡要点：① 导出接口在 **websocket 仓库** `BussinessController`（`POST /Bussiness/exportUserList.do`，格式成因是 `LuceneUtil2.buildCsv{Title,}StrForObject` 反射全字段 + String 值尾随 `\t` + 无转义；**这两个通用 util 保持原样**，用户导出已改为**列白名单**实现）；② 导出列 = 客户友好 14 列、列头跟随 `lang`、角色/创建方式输出文案；CSV 标准转义 + UTF-8+BOM；xlsx 用 POI（首行加粗+冻结、列宽自适应、**数据列全部文本**）；文件名 `userList_<yyyyMMddHHmmssSSS>`（毫秒，避免同秒覆盖）+ 清理 24h 旧文件；③ **列头↔导入别名必须一致**：英文 `User ID` 归一化成 `userid` 与导入账号别名冲突 → 已从 `UserListImporter` 去掉 `userid`，并补角色别名 `superadministrator`/`superuser`；④ 导入失败明细下载：`MAX_DETAIL_ROWS` 提到 5000（不截断）、`importUser.js` 新增 `exportImportUserDetailCsv()`（含转义 + BOM）；⑤ 回归验证含“导出的文件（中/英 CSV 与 xlsx）直接回灌导入”。
   - 前卡 `CURRENT_STATE_用户批量导入.md` **已收尾**（客户名单批量创建用户：csv/xls/xlsx/et + 列名别名兼容；已提交 `09ffeb19c`），已移入 `DevAgentControl/已完成/`。该卡要点：新增 `UserListImporter`（编码识别 BOM→严格UTF-8→GBK、标准 CSV 状态机、列名归一化+主/次别名、角色文本→数字、手机归一化、长度校验、模板生成）+ `POST /Manage/importUserList.do`（逐行复用 `addUser` 的校验：越权/证书用户数/`userCheck`；已存在账号跳过；汇总记 1 条日志）+ `GET /Manage/downloadUserImportTemplate.do` + 前端 `importUser{,_en}.html`/`importUser.js`；探针 66/66、真实页面 E2E 全通过（含**旧导出文件回灌**）。未做：无表头解析、预检、更新已存在账号（按裁定）；**失败明细下载已于 2026-10-06 追加实现**（`devDocs/用户批量导入方案.md` §9）。
   - 其余为**挂起卡**（均已调研/已裁定暂不处理，**未获新裁定前不要改代码**）：
   - 挂起卡 `CURRENT_STATE_系统日志显示用户名.md`：日志「用户」列只存账号（`BaseFunction:5835-5841` 的 `log.userName = user.getName()`），客户希望显示「名字/昵称」；A 写入时快照（要加索引字段，老日志补不了）/ B 读取时按 `userId` 查库补名（要兜底已删除用户、`userId="null"` 的失败登录、LDAP 无 realName），**用户 2026-10-06 裁定暂不改**。
   - 挂起卡 `CURRENT_STATE_agent工具技能规模化.md`（同在 `DevAgentControl/`）：P0 调研+方案已完成并提交 `6fbb9e7fd`，**实施等用户裁定** → 未获裁定前不要开工改代码。
   - 挂起卡 `CURRENT_STATE_前端静态资源缓存.md`（同在 `DevAgentControl/`）：静态资源响应无 `Cache-Control`（只有 ETag/Last-Modified）→ 改 JS/CSS/模板必须清浏览器缓存；方案 A（Filter 加 `no-cache`，改完 F5 即生效）代价是每个静态文件多一次 304 条件请求，**用户 2026-10-06 裁定暂不处理** → 未获新裁定前不要实施。
   - 挂起卡 `CURRENT_STATE_短信验证码收不到.md`（同在 `DevAgentControl/`）：「短信配置测试显示成功但手机收不到」— **已定性为云片/运营商侧**（用户 2026-10-06 在云片后台看到“发送成功”且**已扣费**，已提交云片客服单等回复）。已取证：`SmsSender` 把云片 `code==0` 判为成功（= **受理成功≠送达**，`YunpianSmsProvider:25`）；日志 `SmsSender.send() 场景:resetPwd 手机:137****9349 运营商:yunpian 结果:成功 返回码:0`；4 个场景 tplId 全是云片**示例模板** `1341175`、apikey 与工程硬编码示例 key 相同（`JavaSmsApi`）—— 这两个属于**客户上线时必须换成自己申请的 key/签名/模板**；该 key 查云片 API 返回 `code=-3 IP没有权限`（账号开了 IP 白名单）。**代码侧待办（待用户点头）**：记 `sid` 进日志 + 测试成功文案改成「已提交（受理成功），送达请到运营商控制台确认」。
   - 挂起卡 `CURRENT_STATE_测试邮件发送失败.md`（同在 `DevAgentControl/`）：「邮件配置测试总是失败」— **已定性为网易免费企业邮侧不给 SMTP 发信权限**（实测：STARTTLS OK、`AUTH LOGIN` **235 认证成功**、`MAIL FROM` 被拒 `550 5.8.2 user can not use SMTP service`；同账号 IMAP/POP3 登录均正常；DNS 显示 smtp/imap/pop 均 CNAME 到 `*.ym.163.com`）。**用户 2026-10-07 裁定：改由客户自行申请/配置邮件通道**（阿里云 DirectMail 需配发信子域名 DNS，嫌麻烦）→ 未获新裁定前不要动手；卡里已备好「给客户的要点」（SMTP 用授权码、阿里云必须用子域名+四项 DNS 验证+区域一致）。
   - 前卡 `CURRENT_STATE_日志导出.md` **已收尾**（「日志管理」加导出 + 顺手修调试日志下载；已提交 `06505f8e0`），已移入 `DevAgentControl/已完成/`，保留供查询。该卡要点（压缩后仍有用的上下文）：
     - ①「日志管理」= **操作日志**，存 **Lucene 按月索引** `<SystemLogStorePath>/SystemLog-<年>-<月>/`（**per-node**，导出的是本机日志）；② 新增 `POST /Manage/exportSystemLogList.do`：服务端**流式写 CSV**（UTF-8+BOM、列头跟随 `lang`、`time` 倒序、全 17 字段、超 10 万条或空结果回 JSON 错误、不记系统日志）；前端 `tmpl/systemLog{,_en}.html` 加「导出」按钮 + `main.js` 的 `exportSystemLog()`（`fetch` 按 Content-Type 分流 + Blob 下载）；③ 顺手修掉「调试日志下载 500」：原 `downloadLogFile.do` 返回的是 `/DocSystem/Doc/downloadDoc.do?...`（日志不在仓库里→缺上下文→失败），改为返回新增的 `streamLogFile.do`（白名单 key + 字节流回写），前端契约未变；④ `filterSystemLogsBySearchWord()` 被列表与导出共用，避免两侧口径漂移；⑤ 验证期又修两处：前端 fetch 补 `X-Requested-With`（否则未登录时被 `MyInterceptor` 白名单外的 302 重定向成 404 HTML）＋ 判断改正向 `text/csv`；`streamLogFile.do` 去掉自身调试日志（原会写进正在下载的日志）。方案文档 `devDocs/日志导出方案.md`（§5 裁定 / §6 实施记录 + 验证结果/坑）。
     - 该卡**遗留（待裁定/待办）**：服务端错误文案仍是中文（英文页同）；集群下只导出**本机**日志；超 10 万条分支本机数据量不足未实测。
   - 前卡 `CURRENT_STATE_LDAP设置.md` **已收尾**（LDAP设置改多服务器列表 + 后台级保存/取消去掉改为即时落盘 + 调试日志下载修复以外的 LDAP 部分；已提交 `37596dda9`），已移入 `DevAgentControl/已完成/`，保留供查询。
   - 前卡 `CURRENT_STATE_AI接入设置.md` **已收尾**（AI接入设置改多模型列表：6 轮 UI 反馈 + 标签对齐，共 5 项裁定全部实现；已提交 `1facc4460`），已移入 `DevAgentControl/已完成/`，保留供查询。
   - 前卡 `CURRENT_STATE_日志在线查看.md` **已收尾**（日志在线查看 + 调试日志搬移/布局/拆页/菜单优化/10 页 UI 打磨；已提交 `1ccaa57ee`、`a7012b16f`、`d01307d8c`、`b95a0a19c`、`11b1a83f9`、`f8727cd03`、`d6b7eff85`、`548b6da49`），已移入 `DevAgentControl/已完成/`，保留供查询。
   - 前卡 `CURRENT_STATE_用户使用统计修复.md` **已收尾**（用户维度统计 + 会话推断时长 + 活动上报；已提交主仓库 `677952484`），已移入 `DevAgentControl/已完成/`，保留供查询。
   - 前卡 `CURRENT_STATE_文件分享通知异步化.md` **已收尾**（通知邮件异步化：`addDocShare.do` 响应 6000ms→805ms、弹窗内容 6553ms→857ms；已提交 websocket 仓库 `edb88511` / 主仓库 `bcca467c4`），已移入 `DevAgentControl/已完成/`。
   - 前卡 `CURRENT_STATE_agent产物链接.md` **已收尾**（产物链接 + 多选 @ + 「清空」防误操作，三项均验证并已提交），保留供查询。
   - 前卡 `CURRENT_STATE_agentOffice读写选型.md` **已收尾**（P1 读 / P2 新建 / P2 修改全部完成并验证），保留供查询。
   - 更早的卡 `CURRENT_STATE_agent任务续接与轮数上限.md` **已收尾**（P4 挂起），保留供查询。
2. **按工作卡续接**：读工作卡里列出的必读上下文与计划/上下文文档的续接锚点（不必全文重读）。
3. 以上完成后才开工。
4. **参数存储策略与参数清单（动任何「参数/配置」相关功能前必读）**：`devDocs/参数存储策略与参数清单.md` —— ① 存储策略：三个存储位置（`jdbc.properties` 框架层、须重启；`docSysConfig.properties` 业务参数、可立即生效；数据库 `system_setting` / `agent_config` 存复杂结构）**为什么这么设计** + 5 条硬性约束（per-node 参数不得入库、不得直接改 classes、复杂结构别塞 properties、启动期静态读取的键不得宣称保存即生效、同类参数用同一种处理方式）；② 参数清单 + **同类参数处理方式不一致的 6 处**（`ldapConfig`/`llmConfig` 双轨、`mail.*`/`sms.*` 旧键仅首跑播种、三种生效时机并存、日志配置在 ini 目录独立文件、键名别名/大小写、checksum 自动同步只覆盖两个文件）。2026-10-06 建立（起因：改 LDAP 配置时差点忘了存储与工作机制）。

### ★ 工作卡更新时机：里程碑驱动（不是压缩驱动）

**模型侧观察不到"即将压缩"**（无上下文余量指标、无预警信号），所以「压缩前抢救一次」的约定等于永不触发。改为**里程碑驱动**：出现下列任一事件，**立即**更新当前工作卡，不攒批、不等收尾。

- 定位到根因（写清根因 + 证据位置）
- 得到验证结果（PASS/FAIL 数字、realDiff、字节差等具体值）
- 一个子项结论**成立或被推翻**（被推翻时必须删改原结论，不留过期描述）
- 用户给出裁定 / 纠正 / 确认
- 提交代码（记 commit 号与归属仓库）
- 开始新子任务或切换子项

更新落到工作卡的「当前进展」「下一步」「未提交改动」三处。这样卡永远最多落后一个里程碑——压缩何时发生、压缩是否失败、是否换新会话，都能从卡无损续接。

**如实性要求**：卡里的状态描述必须与实际完成范围一致。完成子项 1 不得写成"该缺陷已修复"；未验证的不得写"已验证"；FAIL 要写明数字和归因。宁可写"未完成/未验证"，不可夸大——下个会话会把卡当事实续接。

## 仓库结构（通用，与具体任务无关）

DocSys 是**多 git 仓库**，office 相关共三条提交路径：

- 主仓库 `D:/Dev/DocSys`（`devInt`）：`.gitignore` 排除整棵 `src/com/DocSystem/websocket`；office 相关对它 clean，根目录 `git commit` 是空操作。
- **销售模块 `src/com/DocSystem/sales/`（独立仓库，`master`）**：`SalesBase.java`/`SalesController.java`/`PayController.java` 等（**不属于**主仓库——`git ls-files` 对该路径报 `did not match any file(s)`，改动要单独提交）。
- **业务/WebSocket 层 `src/com/DocSystem/websocket`（独立仓库，`master`）**：`BussinessController.java`、`BusinessBaseController.java`、`BussinessBase.java`、`OfficeController.java` 等（**不属于**主仓库，改动要单独提交；该仓库未跟踪 `office/`）。
- office 核心 `src/com/DocSystem/websocket/office`（`dev/office`）：核心 Java 代码 + `docs/`/`devDocs/`；`.gitignore` 只排除 `/原始CPP代码` 和 `/test`。
- **test 仓库独立** `src/com/DocSystem/websocket/office/test`（`master`）：测试类 + fixture。

提交归属：核心代码/文档 → `git -C src/com/DocSystem/websocket/office`；测试 → `git -C src/com/DocSystem/websocket/office/test`。此处只描述结构；**是否开工前先提交、提交哪些，由工作卡决定**。

## 编译输出目录（不变量，务必遵守）

`.class` **一律输出到 `D:/Dev/DocSys/WebRoot/WEB-INF/classes`**（相对工程根 `WebRoot/WEB-INF/classes`），**绝不落在源码树 `src/...` 里**。命令行编译必须带 `-d WebRoot/WEB-INF/classes`；这是 Eclipse 工程本身的输出目录，与 IDE auto-build 共享同一份 `.class`。

- javac：`C:\docsysRel\docsys-WDK\docsys\tomcat\Java\jdk\bin\javac`（JDK 8）
- 运行测试：工作目录切到 `D:/Dev/DocSys`，classpath=`WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*`
- 源码树里出现 `.class` = 编译命令漏了 `-d`，须 `git clean -fd -- '*.class'` 清掉。**无例外**：office 核心仓库 `.gitignore` 已加 `*.class`，源码树里不该有任何 `.class`（原误提交的 `PdfFile/CPdfReader.class` 已于 2026-08-29 从版本控制移除）。

## 测试 scratch 输出目录（不变量，务必遵守）

测试运行产物（诊断输出、临时 bin/docx/xml、对比中间物）**一律写到 `src/com/DocSystem/websocket/office/test/tmp/<测试名>/`**（office/test 仓库 `.gitignore` 已忽略该目录）。**绝不写工程根 `tmp/`、`tmp_xxx/`**——这是绝大多数已跟踪测试的既定约定。

- 正式 fixture（需版本控制的测试输入）不适用本条：进 `src/com/DocSystem/websocket/office/test/测试文件/`，**不能**放任何 `tmp/`（tmp 被 gitignore，而 fixture 必须被跟踪）。
- **一旦在工程根发现 `tmp` 相关路径（`tmp/`、`tmp_*`、`tmp_test_output.txt` 等）**：立即提醒用户，并回查是哪个测试把 `OUT`/输出路径写成了工程根相对路径（应改成 `src/com/DocSystem/websocket/office/test/tmp/...`）。先例：`TestS3Diag.java:18` 曾把 `OUT="tmp/TestS3Diag/"` 吐到工程根，2026-09-09 已改回 office/test/tmp。
