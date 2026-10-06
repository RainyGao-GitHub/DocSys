# CURRENT_STATE_LDAP设置（工作卡）

> 状态：**已实施 + 已 E2E 验证，待用户确认提交**（2026-10-04）
> 方案文档：`devDocs/LDAP配置改造方案.md`（§7 裁定/§7.1 D9 核实/§7.2 放宽说明/§8 实施记录）
> 前卡：`DevAgentControl/已完成/CURRENT_STATE_AI接入设置.md`（已收尾归档，随 `1facc4460` 提交）

## 任务

「系统管理 → LDAP设置」原来的配置方式是**一条长字符串**
（`ldap://host:port/basedn; name=..; loginMode=..; ...` 用 `||` 分隔多台服务器），
字段含义晦涩、多服务器增删靠手工编辑、测试只能测第 1 台且必须把测试账号写进串里。
改为**多服务器列表 UI + 编辑弹窗**，结构化配置入库为权威源，运行期渲染回老格式串（消费方零改动）。

## 用户裁定（2026-10-04）

1. **D1 存储**：`system_setting`（键 `ldap.servers`，JSON）—— 与邮件/短信同表，自动进「系统参数」页与备份/导入导出
2. **D2**：支持每台「启用/停用」（停用 = 不进运行期串，配置保留）
3. **D3**：测试连接**复用 `ldapTest.do`**
4. **D4**：鉴权密码**明文**显示（与 AI接入设置同一口径）
5. **D5**：过滤条件 + 5 项属性映射放「高级参数」，默认收起
6. **D6**：服务器地址拆成 `协议 + 主机 + 端口`（自动拼 URL，带 ldap/ldaps 与缺省端口）
7. **D7**：未知键（`authMode`/`CaseType`/`testUser` 等）**原样保留**、不展示
8. **D8**：页面上加提示语（多域登录用「域名/账号」等）
9. **D9**：存库即天然支持集群（**已核实**：集群检查要求各节点 `DB_URL` 一致 ⇒ 共用库 ⇒ `system_setting` 自动共享；只有仓库相关设置走 Redis）

## 存储与运行期设计（关键结论）

| 角色 | 位置 | 说明 |
| --- | --- | --- |
| **权威源** | `system_setting.name='ldap.servers'` | `{version, servers:[{...}]}` JSON；与「邮件服务」「短信服务」同表同服务（`SystemSettingService`） |
| 运行期镜像 | `docSys.ini/docSysConfig.properties` + `WEB-INF/classes/docSysConfig.properties` 的 `ldapConfig` | 由 JSON **渲染**出的老格式串；两边都写（`getSystemInfo.do` 与集群检查读的是 classes 副本） |
| 运行期内存 | `BaseFunction.systemLdapConfig` | 保存后立即 `applySystemLdapConfig()` 覆盖 → **不重启即生效**（仍走原方法 ⇒ 保留「仅企业版启用」门禁）；启动时 `docSysInit` 成功后由 `triggerSystemSettingInit()` 用 JSON 覆盖一次 |
| 首跑迁移 | `LdapConfigStore.ensureSeeded()` | 表内无任何 `ldap.*` 行 → 用现有 ini 串**播种**；ini 也为空 → **不写任何行**（幂等） |

- **渲染规则**：只输出**启用**的服务器，顺序即「不带域名登录」的尝试顺序；
  `scheme://host[:port]/baseDn; name=..; [authentication=..]; loginMode=..; userAccount=..; userPassword=..; filter=..; [domainCheck=1]; <5 个 *Attribute>; <未知键原样>` 用 ` || ` 连接
  ⇒ 必须能被 `util.LDAPUtil.getSystemLdapConfig()` 解析 ⇒ 登录链路 / 集群检查 / `getSystemInfo.do` **全部零改动**。
- **`authentication` 缺省不渲染**（`simple` 是运行期默认）；`domainCheck=1` 只在勾选时渲染；端口留空则省略 `:port`。
- **空列表**：渲染出空串 → `systemLdapConfig.ldapConfigList` 为空 → `loginCheck` 回落本地账号登录（= 关闭 LDAP 登录）。
- **域名规则（实施时放宽）**：原名「多台启用时域名必填」判定为**过度限制**（主备/同域多台是合法部署，会拦住现有配置保存）
  → 最终：**域名非空时不得重复（大小写无关）；允许为空**。
- **鉴权密码**：明文入库 + 明文回显（用户裁定）。

## 实施清单（已改文件）

**后端（已编译进 `WebRoot/WEB-INF/classes`）**

- 新增 `src/com/DocSystem/commonService/ldap/{LdapAttributeMapping,LdapServerConfig,LdapServersConfig}.java`
- 新增 `src/com/DocSystem/service/ldap/LdapConfigStore.java`（`@Component`）
  纯函数 `fromLegacyString/parseServerSegment/toLegacyString/toServerString/buildTestConfigString/validate/normalize/parsePort/countEnabled`
  + IO `load/ensureSeeded/save/applyToRuntime`；`KEY_LDAP_SERVERS="ldap.servers"`、`MAX_SERVERS=20`
- `BaseFunction`：新增 `getLdapConfigString()` + `applyLdapConfigMirror(String)`（与 `applyLLMConfigMirror` 同构）
- `BaseController.triggerSystemSettingInit()`：邮件种子之后追加 LDAP `ensureSeeded()` + `applyToRuntime()`（try/catch 兜底，失败不影响启动）
- `ManageController`：新增 `POST /Manage/getSystemLdapConfig.do`、`POST /Manage/setSystemLdapConfig.do`、`POST /Manage/renderSystemLdapServer.do`
  （均走 `superAdminAccessCheck`）；`buildSystemLdapData()` 返回 `servers/legacy/maxServers/默认值/docSysType/ldapSupported/runtimeEnabled/runtimeServerCount`
  ⚠️ **不改** `ldapTest.do`（复用）；`setSystemInfo.do` 的 `ldapConfig` 分支保留（老入口/集群兼容）

**前端（无需编译）**

- `WebRoot/manager/main.js`：LDAP 段整段重写（`SYSTEM_LDAP_FIELDS`、`enableSystemLdapSet`、旧 `ldapTest()` 删除）
  新增 `showSystemLdap / loadSystemLdapServers / systemLdapCanonical / systemLdapSnapshot / renderSystemLdapView / systemLdapServerUrl / isSystemLdapDirty / updateSystemLdapButtons / systemLdapHasSeparator / validateSystemLdapServer / add|edit|delete|toggle|move SystemLdapServer / showSystemLdapServerEditPanel / buildSystemLdapOtherSettingsText / applySystemLdapServerEditResult / cancelSystemLdapSet / saveSystemLdapSet / sendSystemLdapServerTest / buildSystemLdapTestHtml / testSystemLdapServer / testSystemLdapServerObj`
  （**改动判定用固定字段顺序的规范化快照**，不依赖 JSON 键顺序）
- `WebRoot/manager/tmpl/systemLdap{,_en}.html`：列表页（4 列：域名 150px / 服务器地址·基础DN·鉴权 自适应 / 状态 76px / 操作 76px）+ 表头「新增服务器·保存·取消（后两者默认置灰）」+ 非企业版提示条 + 5 条说明文字
- 新增对话框 `WebRoot/manager/systemLdapServerEdit{,_en}.html` + `WebRoot/manager/systemLdapServerEdit.js`
  （域名 / 协议+主机+端口 / 基础DN / 鉴权方式 / 登录标识 / 鉴权账号+密码 / 必须带域名登录 / 高级参数[过滤条件+5 项属性映射+其他设置] / 状态 / 测试账号+密码 / 测试连接·保存·取消 + 结果区）
- `WebRoot/manager/static/style/style.css`：`#systemLdapTable` 行内按钮紧凑纵向 + `.systemLdapServerForm` 标签左对齐 + `#systemLdapForm .help-block` 间距
- `WebRoot/web/lang/en.js`：补 22 条英文词条

## 验证

### 已完成（全部通过）

- **纯函数探针 85/85**（`%TEMP%\docsys_chk\LdapConfigProbe.java`，产物 `ldapcls`）：
  A 解析 25 项（协议/主机/端口/基础DN/域名/登录标识/绑定账号密码/过滤/domainCheck/id/缺省值/非法段/`=` 值）；
  B 渲染 5 项（最小串/端口缺省/simple 与 filter 的缺省不冗余/GSSAPI/属性映射）；C 往返 **字节相等** + 二次往返稳定；
  D 未知键 4 项（解析/渲染/normalize 后仍保留，渲染与原文完全相同）；E 启用位 5 项（停用不渲染、全停用为空、空/ null 为空）；
  F 校验 17 项（企业版/空配置/非企业版拦截/停用放行/空主机/非法协议/非法端口/越界端口/空基础DN/值含分隔符/域名重复(大小写无关)/域名可空/超上限/未知键与内置键重名）；
  G 测试串 5 项（`testUser`/`testUserPassword` 注入、单台、解析回流）；H **与运行期解析器交叉核对 16 项**（`LDAPUtil.getSystemLdapConfig` 得到的 url/basedn/name/loginMode/userAccount/filter/domainCheck/attributesMap 默认值全对）；
  I 规范化 6 项（尾分号容错、`||` 两侧空格容错、短段丢弃与运行期一致）
- **启动钩子（ini 为空档）**：日志 `ensureSeeded() docSysConfig.properties 无 ldapConfig，不写入任何 ldap.* 行` + `未配置 ldap.servers，保持 docSysConfig.properties 的引导值` ✅（幂等且不影响启动）
- **接口级 E2E（dev 8100，企业版 docSysType=1）**：
  - `getSystemLdapConfig.do`：`servers:[]` / `legacy:""` / `ldapSupported:true` / 默认值字段齐全 ✅
  - `setSystemLdapConfig.do`：保存 2 台（1 启用含高级参数 + 1 停用）→ `legacy` 只含启用项且顺序与渲染规则一致
    （`...; domainCheck=1; realNameAttribute=cn; authMode=1`；`simple` 与缺省 `filter` 不冗余输出 ✅）
  - **不重启即生效**：`runtimeServerCount` 随保存即时变化（0 → 1 → 2 → 0），无需重启 ✅
  - **落盘镜像**：`docSys.ini` 与 classes 副本同时写入同一串（`\:`/`\=` 转义正确）✅
  - **校验拦截 5 例**：端口越界 / 非法协议 / 域名重复（大小写无关）/ 值含 `;` / `servers` 非 JSON → 均返回明确中文错误 ✅
  - `renderSystemLdapServer.do`：单台串 + `testUser`/`testUserPassword` 注入 ✅；交给 `ldapTest.do` 能正确解析（url/basedn/attributesMap 全对）✅
- **页面 E2E（真实浏览器 + 真实点击）**：
  - 侧边栏「系统管理 → LDAP设置」进入；列表 4 列渲染正确（启用/停用行、`未设域名` 占位、`ldaps://host/` 无端口、鉴权与登录标识带默认值提示）✅
  - 「保存/取消」默认置灰，改一处即启用；「取消」能完整回滚（改域名 / 切启用均验证）✅
  - 「编辑」弹窗字段全部正确回填（含高级参数块按内容自动展开、`authMode=1` 回显在其他设置）✅
  - 弹窗「测试连接」用**未保存的表单值**渲染（含 `realNameAttribute=cn`）✅
  - 「新增服务器」空主机保存 → 拦截并提示「服务器地址不能为空」，弹窗保持打开 ✅；填完整后新增成功（`ldaps://ad.dev.local/...` 无端口）✅
  - 「置顶」把末行移到首位、首行置灰 ✅；「删除」走确认框并显示域名，确认后行移除 ✅
  - 窄屏 480px：无横向溢出（`scrollWidth - innerWidth = -15`），操作按钮仍纵向排列 ✅
  - 英文页（`main_en.html`）：标题/表头/按钮/说明文字全英文（`Auth: simple · Login ID: sAMAccountName · Domain required`），页面无中文残留（仅语言选择器里的「中文」）✅
  - **未保存的改动只在前端**：中文页删除一行后切英文页，服务端仍是 3 台 ✅（保存才落盘）

### 已完成（续）

- **JSON 权威 over ini（实测）**：先把 ini 写成 `BOGUS-INI-VALUE`（确认落盘）→ 重启 → 日志
  `ensureSeeded() 表内已有 ldap.* 配置，跳过种子迁移` + `已用 ldap.servers 覆盖运行期配置（3 台，启用 2 台）`；
  ini 与 classes 副本**都被重写回**渲染串（两份内容一致）✅
- **消费方回归**：`getSystemInfo.do` 回传的 `ldapConfig` 与保存后的渲染串**逐字符相等**（`match=true`）✅；
  清空后该字段随 fastjson 惯例省略（改造前即如此，老页面用 `|| ""` 兜底），本地账号登录仍正常 ✅
- **`ldapTest.do` 改进后的行为**：不可达服务器 → `status=fail` + 「连接测试失败：无法连接LDAP服务器或绑定账号被拒」+ 检查清单 ✅；
  空配置 → `fail` + 「配置内容为空」✅；测试密码不再出现在日志/响应中 ✅
- **dev 环境已还原**：`ldapConfig=` 为空（ini + classes 两份）；`system_setting` 保留一行 `ldap.servers`（内容 = 空列表 → LDAP 关闭）

## 用户反馈后的调整（2026-10-04 第 2 轮）

用户反馈：① 配置说明太复杂（都是废话）；② 额外的保存/取消太麻烦；③ 问「域名」逻辑与时下 DB 存储的关系。

已改（仅前端，无需重启）：

1. **删掉列表页 6 条配置说明**（含「手工改 ini 会被覆盖」「删除全部即关闭LDAP」等）。
   保留了两个非「说明」的元素：非企业版告警条（不满足时会解释保存为何被拒）与空态行（「还没有配置LDAP服务器…」）。
   **对话框里的字段级提示暂保留**（域名语义、AD 常用 `sAMAccountName`、端口默认值、鉴权账号留空含义），若也嫌罗嗦可再删。
2. **去掉页面级「保存/取消」→ 每次操作即时落盘**：
   - 新增/编辑：对话框「保存」后立即 POST（成功则关面板 + 一条成功提示；**失败则面板保持打开**并把错误红字写在面板里）
   - 启用/停用、置顶、删除：改完立即 POST（删除仍走确认框）；**不弹成功提示**（列表自身变化即反馈，避免连续操作时弹窗堆积）
   - 失败时一律**回读服务端状态**（放弃本地改动），保证页面与服务端一致；`gSystemLdapSaving` 防连点
   - 随之删掉脏值判定体系：`systemLdapSnapshot/systemLdapCanonical/isSystemLdapDirty/updateSystemLdapButtons/cancelSystemLdapSet/saveSystemLdapSet/gSystemLdapOriginal*`
   - 编辑目标改为**按 id 定位**（`systemLdapSelfIndex()`）而非行号——失败回读后行号会变，按 id 才不会写错行
3. **域名语义已向用户解释**（回答第 3 问）：`name` 是**登录路由键**（`LDAPUtil.multiLdapLoginCheck`）：带域名按 `name` 精确匹配；不带域名按列表顺序逐台试（跳过 `domainCheck=1`，遇密码错误即终止）；登录成功后系统用户名归一化为 `域名/账号` 或 `账号`。
   与存储方式**无关**：每台服务器的 host/端口/基础DN/鉴权/登录标识/绑定账号/过滤/属性映射/其他键都是**逐台独立**存储的，改 DB 不会降低表达能力（未知键原样保留）。

验证（浏览器实测）：新增→立即入库（`runtimeServerCount` 1→2）✅；置顶→服务端顺序变化 ✅；停用→服务端 `enabled=false` 且运行期 1 ✅；
删除→确认框后行消失、服务端仅剩 1 台、**0 个提示弹窗** ✅；服务端拒绝（其他设置用了内置键名）→面板保持打开 + 红字错误 + 列表回读为服务端状态 ✅；
页面仅剩「新增服务器」按钮、`help-block` 计数 = 0 ✅；dev 环境再次还原为空 ✅

## 追加产出：参数存储策略文档（2026-10-06）

用户提出「改造参数设置时甚至忘了存储方式与工作机制，需要一份说明文档」→ 产出
**`devDocs/参数存储策略与参数清单.md`**（按用户定的结构：**一、存储策略** / **二、参数清单** / 附：实现细节与排障）：

- **一、存储策略**：三个存储位置（`jdbc.properties` 框架层须重启 + **启动脚本在启 Tomcat 前把 ini 的 jdbc.properties 拷到 classes（`docsys_start.bat:31-40`，`docsys_restart.bat:55`/`docsys_start_hidden.bat:26` 都 call 它）** + 应用内 checksum 兜底（没走脚本时用，会写 needRestart）；`docSysConfig.properties` 业务参数可立即生效 + 为何不直接改 classes（在线升级会替换整个 DocSystem 目录）；数据库 `system_setting`：复杂结构入库、但 per-node 参数（日志调试开关、集群设置）不得入库）；
  含 5 条硬性约束，防止后人随意改代码；并回答了「改文件会不会触发 Tomcat 重启」（本部署未开 `reloadable`、只监听 web.xml → 不会）与「换 SpringBoot 是否能免重启」（能少写代码，但仍需主动 refresh，不是自动重读文件）。
- **二、参数清单**：按 A 库/system_setting、B 库/agent_config、C `docSysConfig.properties`（含 ini 键名别名与三种生效方式）、D ini 目录独立文件、E `jdbc.properties`\；
  并单列 **6 处「同类存储但处理方式不一致」**（`ldapConfig`/`llmConfig` 双轨、`mail.*`/`sms.*` 旧键仅首播、三种生效时机、日志配置在 ini 独立文件、键名别名、checksum 同步只覆盖两个文件）。
- 附：两个副本的读法与同步方向、8 条实测坑、启动顺序/集群/备份要点。
- `CLAUDE.md` 会话恢复协议第 4 条指针已同步更新为新文件名与要点。

## 生效约束

- **未提交**（用户确认后才提交；提交归属：主仓库 `D:/Dev/DocSys`，本任务全部改动都在主仓库）
- 编译不变量：`.class` 只进 `WebRoot/WEB-INF/classes`；Java 改动必须先编译再重启
- 测试产物只落 `%TEMP%\docsys_chk\`；dev 环境验证后**恢复 `ldapConfig` 为空**（否则每次登录都要先试一次不可达的 LDAP）

## 遗留（待裁定/待办）

- **真实 LDAP 服务器未联调**（本机无环境）：只跑通了「解析/渲染/保存/运行期生效/测试连接的失败归因」；
  因此 `ldapTest.do` 改动中「绑定成功但账号不存在/密码错」那一分支**未在真环境验证**（预检失败分支已验证）
- 集群多节点场景未实测（D9 为静态核实 + `getSystemInfo.do` 一致性已测）
- 服务端返回的测试结果仍是中文 HTML（英文页也中文）；彻底 i18n 需「文案码 + 参数」（与短信 `warnings` 同一遗留）
- 移动版导航（`#navMobile`）选中高亮；调试日志「下载」500；Agent 侧「每用户自定义模型」是否与系统级列表统一
