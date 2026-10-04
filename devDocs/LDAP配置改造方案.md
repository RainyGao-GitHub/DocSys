# LDAP 配置改造方案（友好配置界面 + 结构化存储）

> 状态：**已裁定并实施**（调研 2026-10-03，裁定/实施 2026-10-04）
> 目标：把「系统管理 → LDAP设置」从「一条 `;`+`||` 长串」改成**多服务器列表 + 编辑弹窗**，并让结构化配置成为权威源，运行期行为零变化。
> 裁定：D1=B（`system_setting.ldap.servers`）、D2=支持停用、D3=复用 `ldapTest.do`、D4=鉴权密码明文、D5=高级参数默认收起、D6=协议+主机+端口拆分、D7=未知键原样保留、D8=页面加提示语、D9=存库即自然支持集群（已核实，见 §7）。
> 参照先例：AI接入设置改造（`devDocs/Agent大模型接入设置改造方案.md`）、邮件/短信（`devDocs/邮件服务多供应商配置方案.md`、`devDocs/短信服务多运营商配置方案.md`）。

---

## 1. 现状与问题

现状：整个 LDAP 配置是 `docSys.ini/docSysConfig.properties` 里的**一个键** `ldapConfig`，值是一条长串：

```
ldap://10.0.0.5:389/ou=users,dc=corp,dc=com; name=corp; loginMode=sAMAccountName; userAccount=cn=admin,dc=corp,dc=com; userPassword=xxx; filter=(objectClass=person); domainCheck=1 || ldap://10.0.0.6:389/ou=staff,dc=corp,dc=com; name=dev
```

问题：

1. **字段含义不可见**：`authentication / loginMode / domainCheck / nameAttribute / *Attribute` 等键只能靠文档或源码猜；拼错/漏 `;` 直接导致登录失效，且无校验无提示。
2. **多服务器靠 `||` 手工分隔**：增删/排序/停用一台服务器要手工编辑长串，容易破坏分隔符。
3. **测试账号藏在串里**：页面「测试」按钮只能测**第 1 台**，且必须把 `testUser`/`testUserPassword` 手工写进串（见 §2），否则拿默认 `test` 去试，基本必失败。
4. **没有停用语义**：一台服务器临时不可用只能整段删掉（配置丢失），或保留在那里导致每次登录都白跑一次连接。
5. **结构化数据无处落盘**：备份/导出、系统迁移、集群一致性检查都只覆盖「那一条串」，人改错后无法回滚到「上一个合法配置」。

---

## 2. 现状取证

### 2.1 关键路径

| 环节 | 现状 | 位置 |
| --- | --- | --- |
| 存储 | ini 单键 `ldapConfig`（`docSys.ini/docSysConfig.properties`）+ classes 副本 | `BaseFunction.initLdapConfig()` :2456、`getLdapConfig()` :5603（读 classes 副本） |
| 解析 | `||` 切服务器 → `;` 切字段 → 第 0 段是 URL（`scheme://host:port/basedn`），其余是 `k=v` | `LDAPUtil.getSystemLdapConfig()` :37、`parseLdapConfig()` :63 |
| URL 拆解 | `url = scheme://host:port/`（**不含 basedn**），`basedn = URL 路径段` | `LDAPUtil.getUrlInfoFromUrl()` :135、`parseLdapConfig()` :93 |
| 运行期 | `BaseFunction.systemLdapConfig`（static，`enabled` **仅企业版**为 true） | `applySystemLdapConfig()` :2507 |
| 登录消费 | `BaseController.loginCheck()` :2959 → `LDAPUtil.ldapLoginCheck()` :333 → `multiLdapLoginCheck()` :399（按 `name` 匹配域名 / `domainCheck` 决定是否允许不带域名）→ 用用户 DN 二次绑定验密 → `convertToUser()`；**DB 无此用户则自动建号**（受用户数授权 + `userCheck`） | `BaseController` :3024、:3050 |
| 管理消费 | `getSystemInfo.do` 把 `ldapConfig` 塞进 systemInfo；`setSystemInfo.do` 写 ini + 立即 apply；**非企业版且值非空直接报错拦截** | `ManageController` :1434、:1858-1871、:1961 |
| 集群一致性 | `clusterDeployCheckGlobal_ConfigCheck("ldapConfig", getLdapConfig())` 逐节点比对 ini 串 | `BaseController` :15772、:309 |
| 测试 | `Manage/ldapTest.do`：解析 → 回显 JSON → **只用第 1 台**做登录测试；测试账号取自串里的 `testUser`/`testUserPassword`（默认 `test`） | `ManageController` :2159-2257 |
| 页面 | 单行文本框 + 一个「测试」按钮 | `tmpl/systemLdap{,_en}.html`；`main.js` :2355-2380、:2909 |

### 2.2 settings 键全表（新 UI 需要逐项表达）

| 键 | 含义 | 缺省 | 消费点 |
| --- | --- | --- | --- |
| （URL 第 0 段） | `scheme://host:port/basedn` | — | `getLDAPConnection()` :551（`PROVIDER_URL=url`）、`searchInLdap()` :780（`ctx.search(basedn, …)`） |
| `name` | 域名（多域登录时用 `域名/账号`） | — | `multiLdapLoginCheck()` :456 |
| `authentication` | 鉴权方式：`simple`(默认) / `none` / `DIGEST-MD5` / `CRAM-MD5` / `EXTERNAL` / `GSSAPI` / 其他→General | `simple` | `getLDAPConnection()` :578 |
| `loginMode` | 登录用户属性（查询条件用） | `uid` | `searchInLdap()` :798（`(&filter(loginMode=userName))`）；`nameAttribute` 的默认值 |
| `userAccount` / `userPassword` | 绑定账号（留空=用登录用户自身绑定） | 空 | `ldapLoginCheck()` :474、`getLDAPConnection_Simple()` |
| `filter` | 过滤条件 | `(objectClass=*)` | `searchInLdap()` :795 |
| `domainCheck` | 是否必须带域名登录（`1`=必须） | `0` | `multiLdapLoginCheck()` :408 |
| `nameAttribute` / `realNameAttribute` / `nickNameAttribute` / `mailAttribute` / `descriptionAttribute` | 用户属性映射（5 项） | `loginMode` / `cn` / `displayName` / `mail` / `description` | `getAttributeName()` :170、`buildLdapUserAttributesAndMap()` :107 |
| `testUser` / `testUserPassword` | **仅 `ldapTest.do` 用**的测试账号 | `test` | `ManageController` :2208 |
| `authMode` | 密码校验方式 | `0` | **无调用方**（`getLdapAuthMode()` :213 是非静态方法且全工程无人调用）→ **死键** |
| `CaseType` | 用户名大小写归一 | — | 已注释掉的死键（`multiLdapLoginCheck()` :415） |

结论：真正参与运行期的键共 15 个（含 5 个属性映射）；新 UI 必须**原样保留**未知键（`authMode`/`CaseType`/历史键），避免保存即丢数据。

### 2.3 解析侧的坑（新 UI 要绕开）

- `getSystemLdapConfig()` 丢弃 `length() <= 10` 的段 → 形如 `ldap://a` 的短串会被静默忽略。
- 值里出现 `;` 或 `|` 会破坏切分（`userPassword` 含 `;` 是真实风险）→ 新 UI 必须校验拦截。
- URL 里多一段 `/` 会让 `basedn` 被截断（现状行为，非本次目标）。
- `authMode` 被读但无人消费 → 不暴露、不丢失。

---

## 3. 存储方案对比

| 方案 | 结构化数据落点 | 优点 | 缺点 |
| --- | --- | --- | --- |
| **A. 只改前端** | 不存在（每次从串解析，保存仍走 `postSystemInfo({ldapConfig})`） | 0 后端改动，风险最低 | 无结构化持久化 → 无法保存「已停用」服务器；校验只能在前端；行内解析失败即无法展示；无备份覆盖 |
| **B. `system_setting`（推荐）** | 表 `system_setting`，键 `ldap.servers`（JSON） | 与「邮件服务」「短信服务」同表同模式（`*ConfigStore` + `seedIfAbsent` + 读异常不外抛）；**自动进「系统参数」页**可查看/导入导出；自动纳入备份（`ExtraDBTabNameMap={system_setting}` 已在 `backupDatabase()` 覆盖） | 需新增 Store + 端点 |
| C. `agent_config` | `agent_config(scope=global, key=ldap_servers)` | 与 AI接入设置同表，代码可照抄 | LDAP 不属于 agent 域；不会出现在「系统参数」页；语义不符 |

**推荐 B**：LDAP 是系统级配置，与它并列的邮件/短信都在 `system_setting`；且 B 顺带得到「系统参数」页与备份/迁移覆盖。
（B、C 都会被备份覆盖——`AgentDBTabNameMap` 也在 `buildExtraDBTabList()` 里——差异在语义与管理入口。）

运行期仍**只认 ini 镜像**（`systemLdapConfig` static 由 `applySystemLdapConfig()` 从串解析），因此三种方案都保持：

```
system_setting.ldap.servers (JSON，权威)
        │ 渲染
        ▼
老格式串 ──写──> docSys.ini/docSysConfig.properties + WEB-INF/classes/docSysConfig.properties（运行期镜像）
        │ applySystemLdapConfig()
        ▼
BaseFunction.systemLdapConfig  ← 登录/集群检查全部消费方零改动
```

---

## 4. 详细设计（方案 B）

### 4.1 数据模型

```java
// com.DocSystem.commonService.ldap.LdapServersConfig
int version;                 // 结构版本，便于后续演进
List<LdapServerConfig> servers;

// com.DocSystem.commonService.ldap.LdapServerConfig
String  id;                  // 稳定 id（编辑/删除用）
String  name;                // = name，域名
String  scheme;              // ldap / ldaps
String  host;                // host
String  port;                // port（缺省 389；ldaps 缺省 636）
String  baseDn;              // = basedn
boolean enabled = true;      // 停用 → 不渲染进运行期串（配置保留）
String  authentication;      // simple(默认)/none/DIGEST-MD5/CRAM-MD5/EXTERNAL/GSSAPI
boolean domainCheck;         // = domainCheck=1
String  loginMode;           // 默认 uid
String  bindAccount;         // = userAccount，留空 = 用登录用户绑定
String  bindPassword;        // = userPassword
String  filter;              // 默认 (objectClass=*)
LdapAttributeMapping attributes;  // name/realName/nickName/mail/description 5 项
Map<String,String> extraSettings; // 未知键原样保留（authMode/CaseType/…），不展示
```

渲染规则（与现有解析严格互逆）：
`scheme://host:port/baseDn` + `; name=…; authentication=…; loginMode=…; userAccount=…; userPassword=…; filter=…; domainCheck=1; xxxAttribute=…; <extraSettings 逐条>`，多台以 ` || ` 连接；**`port` 为空则省略 `:port`**；空值键不输出（与现有串风格一致）。所有值校验禁止 `;` 与 `|`。

### 4.2 后端改动

| 文件 | 改动 |
| --- | --- |
| `src/com/DocSystem/commonService/ldap/LdapServersConfig.java`、`LdapServerConfig.java`、`LdapAttributeMapping.java` | 新增数据类（纯数据，便于离线探针） |
| `src/com/DocSystem/service/ldap/LdapConfigStore.java` | 新增 `@Component`（放 `service` 子包才能被 root 容器扫描，同 `MailConfigStore`）。纯函数：`fromLegacyString()` / `toLegacyString()` / `validate()` / `normalize()`；IO：`load()` / `save()` / `ensureSeeded()` |
| `src/com/DocSystem/common/BaseFunction.java` | 新增 `public static String getLdapConfigString()`（读 ini 优先、回落 classes）与 `public static void applyLdapConfigMirror(String)`（写两处 properties + 更新 `systemLdapConfig`，**复用 `applySystemLdapConfig()` 以保留「仅企业版启用」的门禁**），与 `applyLLMConfigMirror()` 同构 |
| `src/com/DocSystem/agent/config/AgentInitService.java` 或新增 `LdapConfigInitializer` | 启动钩子：`ensureSeeded()` → 用 JSON 渲染并 `applyLdapConfigMirror()`（覆盖 ini）。挂载点与邮件/短信初始化同层，**不**碰 `BaseFunction` 静态块顺序 |
| `src/com/DocSystem/controller/ManageController.java` | 新增 `GET /Manage/systemLdapConfig.do`（返回 `servers/legacy/maxServers/edition{docSysType,ldapSupported}/runtime{enabled,serverCount}`）、`POST /Manage/systemLdapConfig.do`（`validate()` → 存表 → 渲染 → 写镜像 → 立即生效）；测试沿用 **`ldapTest.do`**（见 4.4） |

存储细节：
- 键名 `ldap.servers`（点分命名空间，与 `mail.*`/`sms.*` 一致），值 = `LdapServersConfig` 的 JSON。
- **首跑播种（幂等）**：`SystemSettingService.countByPrefix("ldap.") == 0` 且现有 ini 串非空 → 解析老串写入一行；老串为空 → **不写任何行**（与短信 M3 裁定一致）。已是新格式后重启不再改写。
- 老接口 `setSystemInfo.do` 的 `ldapConfig` 分支**保留不动**（兼容其它入口/老页面/集群检查），仅页面不再走它。

### 4.3 前端改动

| 文件 | 改动 |
| --- | --- |
| `tmpl/systemLdap{,_en}.html` | 整页重写：4~5 列列表（`域名` 150px / `服务器地址`（第二行 `基础DN · 鉴权方式 · 登录标识`）/ `状态`（启用复选）/ `操作`（测试·编辑·置顶·删除，窄屏竖排））+ 表头按钮 `新增服务器 / 保存(默认禁用) / 取消(默认禁用)` + 空态行 + 版本限制提示条 |
| `manager/systemLdapServerEdit{,_en}.html` + `systemLdapServerEdit.js` | 新增编辑弹窗（照 `systemLlmModelEdit` 结构）：基础（域名/协议+主机+端口/基础DN）、鉴权（鉴权方式下拉/登录标识/鉴权账号+密码/必须带域名登录）、**高级（默认收起）**（过滤条件/5 项属性映射/其他设置 `k=v`）、状态（启用）；按钮 `测试连接 / 保存 / 取消` + 结果区 |
| `manager/main.js` | LDAP 段重写（`showSystemLdap/enable/cancel/save` → 列表渲染 + 脏值判定 + 弹窗编排 + 测试），移除 `SYSTEM_LDAP_FIELDS` 走 `postSystemInfo` 的旧路径 |
| `manager/static/style/style.css` | 复用已加的 `.systemLlmModelForm .control-label{text-align:left}` 等同族规则（可提取公共类名） |
| `web/lang/en.js` | 补词条（字段名、提示语、状态文案） |

页面提示语（重要，替代长串里的隐性约定）：
- 「修改后请点击『保存』生效；停用的服务器不参与登录。」
- 「多台服务器时，登录需填 `域名/账号`（域名=此处的『域名』）。」
- 「鉴权账号留空 = 使用登录用户自身绑定校验；填了则先用它查询用户 DN，再用用户 DN 校验密码。」
- 「首次 LDAP 登录会在本系统自动创建用户（受用户数授权限制）。」
- 非企业版：「当前版本不支持 LDAP 登录认证，无法保存启用的服务器。」

### 4.4 测试连接

沿用现有 `ldapTest.do`（零后端改动）：前端把**当前这一台**渲染成单串，并注入 `testUser`/`testUserPassword` 后提交；现有端点会回显解析结果 + 六种失败归因（密码错误/用户不存在/重名/域名不存在/未知错误）。弹窗内提供「测试账号/测试密码」两个**仅测试用、不入库**的输入框（默认取鉴权账号，留空则用默认 `test`）。
（可选增强：新增结构化测试端点，把步骤与状态码化以便 i18n——见 §7 D3。）

---

## 5. 验证方案

1. **纯函数探针**（离线，`%TEMP%\docsys_chk\`）：`fromLegacyString ↔ toLegacyString` 往返（多台、未知键、空 port、`filter` 含 `&`/`(`、属性映射缺省值）+ `validate()` 用例（`;`/`|` 注入、域名重复、非数字端口、空主机、非企业版拦截）。
2. **迁移/播种**：注入真实老串夹具 → 启动 → 断言 `system_setting` 出现 `ldap.servers` 且**渲染回的老串与原串语义等价**（逐键比对，非字节比对）；再启动 → 「跳过播种」；老串置空 → 「不写任何行」；夹具还原。
3. **运行期**：保存后**不重启** → 断言 `BaseFunction.systemLdapConfig.ldapConfigList` 数量/字段随页面改动立即变化（容器内临时 JSP 探针，参考短信 M5 做法）。
4. **页面 E2E**（真实浏览器）：列表渲染 / 新增 / 编辑（含高级收起展开）/ 校验拦截 / 停用不渲染 / 保存 / 取消回滚 / 测试连接失败路径与成功路径 / 只读态全 `disabled` / 窄屏 480px 无横向溢出 / 英文页无中文残留 / 无 JS 报错。
5. **登录链路**：`ldapTest.do` 对不可达服务器验证失败归因；成功路径需**真实 LDAP 服务器**（本机无环境）→ 记录为「待真环境联调」，口径同邮件/短信。
6. **回归**：`getSystemInfo.do` 仍返回 `ldapConfig`；`setSystemInfo.do` 老路径仍可写；集群一致性检查读到的串等于页面配置。

---

## 6. 工作量

新增 ~5 个文件（3 数据类 + Store + 2 弹窗文件 + 测试类）、改 ~6 个文件。整体小于 AI接入设置改造（UI 更简单、测试端点复用、无 Provider 矩阵）。1 个里程碑 + 验证。

---

## 7. 待裁定项

| # | 问题 | 建议 |
| --- | --- | --- |
| **D1** | 存储位置：B `system_setting.ldap.servers` / C `agent_config` / A 只改前端 | **B**（与邮件/短信同表，自动进系统参数页与备份） |
| **D2** | 是否支持每台服务器「启用/停用」（停用=不写入运行期串，配置保留） | 支持 |
| **D3** | 测试连接：复用 `ldapTest.do`（前端注入测试账号，0 后端改动）/ 新增结构化测试端点 | 复用；若要多语言/更友好结果再新增 |
| **D4** | 鉴权密码是否明文显示在页面（LLM 那轮裁定明文显示） | 与 LLM 一致：明文 |
| **D5** | 过滤条件 + 5 项属性映射放「高级」默认收起 | 是 |
| **D6** | 服务器地址：拆成 `协议+主机+端口`（推荐，自动拼 URL）/ 直接填完整 URL | 拆分，带 `ldap`/`ldaps` 下拉与缺省端口 |
| **D7** | 未知键（`authMode`/`CaseType`）原样保留且不展示 | **已裁定：是**（避免保存丢数据） |
| **D8** | 是否需要登录页「多域时填 `域名/账号`」提示 | **已裁定：要**（仅页面提示语，不改登录页） |
| **D9** | 集群部署时 `system_setting` 是否随集群同步 | **已裁定/已核实：存库即天然一致** |

### 7.1 D9 核实结论（2026-10-04）

- 集群一致性检查本身要求各节点 **`DB_URL` 完全一致**（`BaseController.clusterDeployCheckGlobal_ConfigCheck("DB_URL", DB_URL)` :15765）。
  即集群节点共用同一个数据库 ⇒ `system_setting` 里的 `ldap.servers` **天然共享**，不需要额外同步 ✅。
- 与仓库相关的设置走 Redis 同步（`redisSyncLock`/仓库锁等），全局配置走库 + 本机 ini 镜像，这与用户判断一致。
- 一处**现状即如此**的注意点：集群检查会比对各节点**本机** `getLdapConfig()`（读 classes 副本）与 Redis 里缓存的全局值
  （`clusterDeployCheckGlobal_ConfigCheck("ldapConfig", ...)` :15773）。新页面写镜像时**本机**的 ini + classes 都会同步更新
  （与改造前的 `setSystemInfo.do` 行为一致）；**其他节点**仍需各自点一次保存或同步 `docSys.ini`（这是既有行为，本次未改变，也未新增差异）。

### 7.2 实施中的一处方案放宽（域名不再强制必填）

原方案拟「多台服务器同时启用时域名必填」。实施时判定为**过度限制**：
两台服务器指向同一个目录（主备/failover）或同一域的多台 AD 是合法部署，强制填域名会让这类**现有配置保存不了**（迁移即被拦）。
最终规则：**域名非空时不得重复（大小写无关，仅约束启用项）；允许为空**。
运行时 `multiLdapLoginCheck()` 本就会按顺序逐个尝试不带域名的登录（`:404-452`），语义与放宽后的规则一致。

---

## 8. 实施记录（2026-10-04）

### 8.1 文件清单

**后端**

| 文件 | 说明 |
| --- | --- |
| `commonService/ldap/LdapAttributeMapping.java`（新） | 5 项属性映射（`name/realName/nickName/mail/description`，空 = 用运行期默认） |
| `commonService/ldap/LdapServerConfig.java`（新） | 单台服务器：`id/name/scheme/host/port/baseDn/enabled/authentication/domainCheck/loginMode/bindAccount/bindPassword/filter/attributes/extraSettings` |
| `commonService/ldap/LdapServersConfig.java`（新） | `{version, servers[]}`（入库 JSON 的根） |
| `service/ldap/LdapConfigStore.java`（新） | `@Component`：纯函数 `fromLegacyString/parseServerSegment/toLegacyString/toServerString/buildTestConfigString/validate/normalize/parsePort/countEnabled` + IO `load/ensureSeeded/save/applyToRuntime` |
| `common/BaseFunction.java` | +`getLdapConfigString()`、+`applyLdapConfigMirror(String)`（与 `applyLLMConfigMirror` 同构） |
| `controller/BaseController.java` | `triggerSystemSettingInit()` 邮件种子后追加 LDAP `ensureSeeded()` + `applyToRuntime()` |
| `controller/ManageController.java` | +`getSystemLdapConfig.do`、+`setSystemLdapConfig.do`、+`renderSystemLdapServer.do`、`buildSystemLdapData()`；**改进** `ldapTest.do` |

**前端**

| 文件 | 说明 |
| --- | --- |
| `manager/main.js` | LDAP 段重写（删 `SYSTEM_LDAP_FIELDS`/`enableSystemLdapSet`/`ldapTest()`；新增列表+弹窗+测试共 ~25 个函数） |
| `manager/tmpl/systemLdap{,_en}.html` | 列表页重写 |
| `manager/systemLdapServerEdit{,_en}.html` + `manager/systemLdapServerEdit.js`（新） | 编辑弹窗 |
| `manager/static/style/style.css` | `#systemLdapTable` 按钮紧凑纵向、`.systemLdapServerForm` 标签左对齐、说明文字间距 |
| `web/lang/en.js` | +22 条词条 |

### 8.2 实施中的有意偏离 / 增补

1. **域名规则放宽**（见 §7.2）。
2. **新增 `renderSystemLdapServer.do`**：D3 裁定「复用 `ldapTest.do`」，但前端自己拼串会与后端渲染逻辑分叉
   （测试通过≠保存后一样）→ 改为**服务端渲染**单台串（含 `testUser`/`testUserPassword` 注入）返回给页面，
   页面再提交给 `ldapTest.do` 做解析/登录测试。**测试端点本身未新增、未改流程**，渲染逻辑全工程只有一份。
3. **`ldapTest.do` 三处改进**（E2E 实测发现，不属于原裁定范围但是明显的可用性/安全问题）：
   - 登录测试失败时原来仍返回 `status=ok` → 页面会显示绿字「测试成功」而正文写「未知错误」✗ →
     改为失败走 `rt.setError()`（现只有解析/连接问题与登录失败两种终态）。
   - 原来不可达服务器只能报「未知错误」→ 新增**连通性预检**（`LDAPUtil.getLDAPConnection`），失败时给出
     「无法连接LDAP服务器或绑定账号被拒」+ 检查清单（地址/端口/协议、基础DN、鉴权账号密码）。
   - 不再把**测试密码**写进日志与响应（原来 `Log.debug` 与响应正文都会回显密码）；另外测试账号留空密码时给出明确提示。

### 8.3 踩坑（本次新增）

- **脏值快照 ≠ 接口载荷**：自查时发现把「固定字段顺序的快照」直接当接口 JSON 提交，会把嵌套 `attributes`
  展平成 `nameAttribute/...`、把 `extraSettings` 变成字符串数组 → 保存/测试会**静默丢失高级参数**。
  已拆为 `systemLdapCanonical()`（仅判定改动）与 `systemLdapApiServer()`（接口格式）。
- **fastjson 序列化会省略 `null` 字段**：页面拿到的 `name/baseDn/loginMode/...` 可能是 `undefined`，前端一律 `|| ""` 兼容；
  `getSystemInfo.do` 里的 `ldapConfig` 同理（若为空则整个字段不出现在 JSON 里——改造前即如此）。
- **properties 写的值带 `:`/`=` 会被转义**（`ldap\://`、`userAccount\=cn\=admin...`）——这是 `ReadProperties` 的正常行为，
  读回时无需手工反转义。
- 服务端返回的测试结果是中文 HTML（英文页也会是中文）：彻底 i18n 需服务端返回「文案码 + 参数」，与短信 `warnings` 同一遗留。

### 8.4 验证结果（dev 8100，2026-10-04）

| 项 | 结果 |
| --- | --- |
| 纯函数探针 `LdapConfigProbe` | **85/85 PASS**（含与 `util.LDAPUtil` 的 16 项交叉核对、往返字节相等） |
| 启动钩子（ini 为空） | `不写入任何 ldap.* 行` + `保持 ini 引导值` ✅ |
| 启动覆盖（ini 被写成 BOGUS 后重启） | `跳过种子迁移` + `已用 ldap.servers 覆盖运行期配置（3 台，启用 2 台）`；ini/classes **被重写回**渲染串 ✅ |
| 保存即生效 | `runtimeServerCount` 0→1→2→0 即时变化（不重启）✅ |
| 镜像一致性 | `getSystemInfo.do` 的 `ldapConfig` 与保存串**逐字符相等** ✅ |
| 校验拦截 | 5 例（端口/协议/域名重复/分隔符/非 JSON）均返回明确错误 ✅ |
| 测试连接 | 服务端渲染单台串 + `ldapTest.do` 解析正确；失败归因可读（连接预检）✅ |
| 页面（真实点击） | 新增/编辑/置顶/删除/脏值门控/取消回滚/空态/窄屏 480px/英文页 全通过 ✅ |
| 未验证 | 真实 LDAP 服务器联调（含「绑定成功但账号不存在/密码错」分支）；集群多节点 |

### 8.5 第二轮调整（用户反馈，2026-10-04）

| 反馈 | 处理 |
| --- | --- |
| 配置说明太复杂（都是废话） | 删掉列表页 6 条说明；保留非企业版告警条与空态行；对话框字段级提示暂留 |
| 额外的保存/取消太麻烦 | **去掉页面级「保存/取消」**，新增/编辑/启停/置顶/删除均**即时落盘**；仅显式保存（对话框）弹成功提示，其余靠列表变化反馈；失败回读服务端状态；编辑目标按 id 定位（失败回读后行号会变） |
| 「域名」逻辑与 DB 存储的关系 | `name` 仅是**登录路由键**（`LDAPUtil.multiLdapLoginCheck`），与存储无关；每台服务器所有字段（含未知键）逐台独立存储 |
