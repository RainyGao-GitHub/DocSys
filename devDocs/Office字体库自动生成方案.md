# Office 字体库自动检测与生成方案

> 建立于 2026-10-10。**状态：调研完成；方案待用户逐条裁定（D1–D9），未开工。**
> 工作卡：[CURRENT_STATE_Office字体库自动生成.md](../DevAgentControl/CURRENT_STATE_Office字体库自动生成.md)
> 需求（用户原话要点）：新安装 / 在线升级后，Office 编辑所需的**字体库**必须由管理员手动执行「管理后台 → 系统管理 → Office 编辑器 → **重置字体库**」；管理员一旦忘记，用户会在 Office 编辑时撞上"字体库不存在"才回头找管理员。希望改成**自动检测 + 自动生成**。
> 两条硬约束：① **不能放回系统启动初始化路径**（历史上放那里，失败时甚至导致整个初始化无法完成，影响面更大）；② 参照「**首次安装创建超级管理员**」那种**由前端发起**、失败也不影响系统本身的模式。
> 本方案所有「现状」结论均来自当前源码（给 `文件:行号`），不是推测。

---

## 1. 现状

### 1.1 字体库是什么：产物清单、输入、就绪判据

发布清理脚本 [CleanOfficeFonts.bat](<C:/TomcatForDocSysDev/CleanOfficeFonts.bat>) 是产物清单的权威说明（它删的就是"会被打进 war、且必须在目标机器上重新生成"的东西）：
> ⚠️ 2026-10-14 更新：权威副本已移入仓库 `Docs/scripts/CleanOfficeFonts.bat`（`Docs` 子模块，与打包脚本 `Docs/scripts/BuildWar.bat`、对比工具 `Docs/scripts/CompareWar.py` 同目录，见 `Docs/scripts/README.md`）；仓库外 `C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 改为指路桩，仅保留兼容。

| # | 产物（相对 `web/static/office-editor/`） | 作用 | dev 现状 |
|---|---|---|---|
| 1 | `sdkjs/common/AllFonts.js` | **Web 字体库**，浏览器直接加载（约 172 KB） | 存在 |
| 2 | `server/FileConverter/bin/AllFonts.js` | 转换引擎（bin）字体库 | 存在 |
| 3 | `server/FileConverter/bin/font_selection.bin` | 字体选择表 | 存在 |
| 4 | `server/FileConverter/bin/fonts.log` | 字体文件名指纹（判断"是否需要重新生成"） | 存在 |
| 5 | `fonts/` | Web 字体文件（000、001…） | 552 个文件 |
| 6 | `sdkjs/common/Images/fonts_thumbnail*` | 字体预览缩略图 | 20 个文件 |

- **输入**：`core-fonts/`（215 个文件）—— 清理脚本**不删**（脚本注释："Not deleted: core-fonts\ (input fonts)"）。⇒ 目标机器上具备原地重新生成的条件，这是整套自动方案成立的前提。
- **就绪判据（已存在于代码里）**：`OfficeBase.isAllFontsReady(officeEditorPath)`（[OfficeBase.java:257](../src/com/DocSystem/websocket/OfficeBase.java:257)）检查 4 项：`fonts/` 目录、`sdkjs/common/AllFonts.js`、`server/FileConverter/bin/AllFonts.js`、`server/FileConverter/bin/font_selection.bin`。
  ⚠️ 注意：**不含** `fonts.log`、也不含缩略图。
- **生成链路**：`OfficeBase.checkAndGenerateFonts(needThumbnails, force)`（[OfficeBase.java:303](../src/com/DocSystem/websocket/OfficeBase.java:303)）→ `FontGenerator.generate(true, 4 个输出路径, core-fonts/, 3, needThumbnails, force)`（[FontGenerator.java:15](../src/com/DocSystem/websocket/office/FontGenerator/FontGenerator.java:15)）→ `CApplicationFontsWorker.CheckAndGenerateFonts(force)`（[CApplicationFontsWorker.java:284](../src/com/DocSystem/websocket/office/fontengine/CApplicationFontsWorker.java:284)）→ native（JNI）字体引擎。
- **两条重要性质**（后面设计依赖它们）：
  - **廉价跳过**：`force=false` 时 `needGenerateFonts()`（[CApplicationFontsWorker.java:339](../src/com/DocSystem/websocket/office/fontengine/CApplicationFontsWorker.java:339)）若 `font_selection.bin` 存在且 `fonts.log` 记录与当前字体文件列表一致 → **直接跳过生成**（日志 `skip generation!!`）⇒ 状态正常时重复调用几乎零成本。
  - **返回值不可当成功判据**：`OfficeBase.checkAndGenerateFonts()` 只要没抛异常就 `return true`（[OfficeBase.java:344-347](../src/com/DocSystem/websocket/OfficeBase.java:344)），**即使内部跳过了生成**。⇒ 自动机制必须以"生成后 `isAllFontsReady()` 复查"为成功判据（见 §1.6 R1）。
- 缩略图只在 `needThumbnails=true` 且真的走了生成分支时才会重建。

### 1.2 为什么"新安装 / 在线升级后必缺"

现存的自动生成调用点**只有安装 Office 编辑器的两条路径**：

| 位置 | 场景 | 行为 |
|---|---|---|
| [BussinessController.java:5689](../src/com/DocSystem/websocket/BussinessController.java:5689) `onlineInstallOffice.do` | **在线安装**（从 gitee 拉 office-editor） | 目录已存在 → **直接拒绝**「您已安装Office，请勿重复安装！」（:5706）；否则克隆后调用 `BussinessBase.checkAndGenerateFonts(false, false)`（:5751） |
| [BussinessController.java:6000](../src/com/DocSystem/websocket/BussinessController.java:6000) `installOffice.do` | **上传安装包安装/重装** | 目录已存在 → **先备份再重装**（:6077 "Office已安装，开始备份！"）；解压安装完成后调用 `checkAndGenerateFonts(false, false)`（:6132） |

⇒ 结论：真正**没有任何环节生成字体库**的是这两类场景 ——
1. **war 替换 / 在线升级**：`web/static/office-editor` 已存在，管理员不会（也无法）走"在线安装"（被拒绝），升级流程又不碰字体库；
2. **首次部署**：发布包已带 office-editor（只是被清理脚本抽掉了产物），页面已显示"Office 已安装"，不会触发 `installOffice.do`。

这正是用户描述的问题成因。同时发布脚本把自己的注释写成"After cleaning: the files are regenerated on first start"（**已不准确**，需要修正，见 D7）。

### 1.3 现状唯一的人工入口（重置字体库）

| 层 | 位置 | 行为 |
|---|---|---|
| 页面 | [systemOfficeEditor.html:38](../WebRoot/manager/tmpl/systemOfficeEditor.html:38) | 「重置字体库」按钮 → `generateOfficeFontsConfirm()` |
| 前端 | [main.js:5695](../WebRoot/manager/main.js:5695) `generateOfficeFontsConfirm` / `:5735` `startGenerateOfficeFonts` / `:5762` `startGenerateOfficeFontsQueryTask` / `:5777` `doQueryGenerateOfficeFontsTask` | 确认框「重新生成字体库大约需要10分钟, 期间将无法使用Office, 是否重置？」，随后轮询 `POST /DocSystem/Manage/queryLongTermTask.do`（初始 2s，每次 +5s，最长 60s 间隔） |
| 后端 | [BussinessController.java:5760](../src/com/DocSystem/websocket/BussinessController.java:5760) `generateOfficeFonts.do` | ① `superAdminAccessCheck(null,"docSysInit",...)` 仅超管；② office-editor 不存在 → "您未安装Office"；③ `createLongTermTask("generateOfficeFonts","生成字体库")`；④ 回 JSON 后**在请求线程里同步执行** `officeDisabled=1` → `BussinessBase.checkAndGenerateFonts(true, true)`（force=true 全量重建，含缩略图）→ `officeDisabled=0` |
| 忙状态 | `main.js` 全局 `gStatus`（5 = 正在重置字体库；5 处分支文案"正在重置字体库，请稍后重试!"，:4118/:4731/:5139/:5560/:5713） | Office 禁用期间挡住其它操作 |

### 1.4 曾经被移除的启动期机制（为什么不能回到启动路径）

主仓库提交 `4ea4beaf2`（2026-06-21，作者 Rainy，「【优化】Office编辑字体库初始化改为手动触发」）删掉了三处：

1. `BaseController.docSysInit()` 里的**两次** `initOfficeEditorFonts()` 调用（"首次安装"分支与"数据库已存在"分支各一次）；
2. `BaseController.initOfficeEditorFonts()` 私有方法（内容：`if(channel == null) return true; return channel.initOfficeEditorFonts(false);`）；
3. `Channel.generateFont(...)` 接口声明。

链路是：`docSysInit()` → `channel.initOfficeEditorFonts(false)` → [OfficeBase.java:142](../src/com/DocSystem/websocket/OfficeBase.java:142) `initOfficeEditorFonts(needThumbnails)` = `officeDisabled=1` → `checkAndGenerateFonts(needThumbnails, false)` → `officeDisabled=0`。

⇒ 这就是"位置不合适"的准确形态：**同步跑在系统初始化线程上**，跑的是 native（JNI）字体引擎，慢则数分钟；一旦异常/挂起，整个 `docSysInit` 完不成（`docSysIniState` 写不下去、后续初始化步骤不执行），而且期间 `officeDisabled=1` 全局禁 Office。

⇒ **现状死代码（全仓库无调用者，已核实）**：`Channel.initOfficeEditorFonts`（[Channel.java:241](../src/com/DocSystem/common/channels/Channel.java:241)）、`BusinessChannel.initOfficeEditorFonts`（[BusinessChannel.java:2247](../src/com/DocSystem/websocket/BusinessChannel.java:2247)）、`OfficeBase.initOfficeEditorFonts`（:142）。本方案建议**复用**它作为自动生成的执行入口（见 D8）。

### 1.5 可复用的现成机制（不用新造轮子）

| 机制 | 位置 | 说明 |
|---|---|---|
| 长任务 | `LongTermTask`（[LongTermTask.java](../src/com/DocSystem/common/entity/LongTermTask.java)）、`createLongTermTask`（[BaseController.java:26363](../src/com/DocSystem/controller/BaseController.java:26363)）、`queryLongTermTask.do`（[ManageController.java:2837](../src/com/DocSystem/controller/ManageController.java:2837)） | `status`：0 未开始 / 200 成功 / -1 失败 / 其它进行中；`info` 为状态文本；`id = event + "-" + 毫秒`（重复即拒绝）；`.do` 在 200/-1 后 2 分钟自动删除任务、超 1000 个先清理过期任务。**前端已有轮询套路** |
| 就绪判据 | `isAllFontsReady`（:257，现 `private`） | 只读、廉价（4 次 `File.exists()`），可直接复用为检测口径；只需放宽可见性 |
| 廉价跳过 | `needGenerateFonts`（:339） | 见 §1.1 |
| Web 端编辑器唯一咽喉 | [OfficeEditorLoader.js:61](../WebRoot/web/js/OfficeEditorLoader.js:61) `loadRuntimeConfig()` → `POST /DocSystem/Manage/getOfficeEditorConfig.do`（:77）；三条入口（弹窗 `showOfficeInDialog` [DocSys.js:3026](../WebRoot/web/js/DocSys.js:3026) → `initBootstrapDialog` [DocSys.js:3044-3046](../WebRoot/web/js/DocSys.js:3044)、新建页、ArtDialog）**全部**经由它；失败时 `fail()`（:23）在 `#placeholder` 显示 + `alert` | ⇒ 这里是"检测 + 提示/等待"的天然落点 |
| 「首次安装建超管」范式 | `ManageController.addFirstAdminUser`（[ManageController.java:3003](../src/com/DocSystem/controller/ManageController.java:3003)）+ `isFirstAdminUserExists()` 幂等守卫（[BaseController.java:3201](../src/com/DocSystem/controller/BaseController.java:3201)）+ 前端面板 [logon.js:25](../WebRoot/web/js/logon.js:25) `showAddFirstAdminUserPanel()` → `WebRoot/web/addFirstAdminUser.{html,js}` → POST | 即：**前端在合适时机探测状态 → 前端发起 → 后端幂等守卫**，失败只影响该次请求 |
| 配置落点 | `docSysConfig.properties`（ini 目录 + `WEB-INF/classes` 镜像，`ReadProperties.getValue/read` 调用时读取 ⇒ 可立即生效）；后台页编辑态套路 `setSystemPageEditMode` / `postSystemInfo`（[main.js:3431-3456](../WebRoot/manager/main.js:3431)） | 新开关按 [[参数存储策略与参数清单](参数存储策略与参数清单.md)] 落这里（per-node 参数不得入库） |
| 登录成功钩子 | [login.js:64](../WebRoot/web/login.js:64) `login()` 的 `success` 分支 | 成功即 `window.location.href = url` 刷新页面 ⇒ **同一 tick 内发出的 fire-and-forget 请求可能被导航取消**，登录页不是好的触发点；T1 应落在登录后的**主界面初始化**里 |

### 1.6 设计必须处理的风险点

| # | 风险 | 事实 | 对策（本方案要求） |
|---|---|---|---|
| R1 | **"自检通过"≠"状态好"** | 若只有 `sdkjs/common/AllFonts.js` 缺失、而 `font_selection.bin` 与 `fonts.log` 还在，`needGenerateFonts(force=false)` 会**跳过**生成 ⇒ 编辑器仍然是坏的 | 生成后**复查** `isAllFontsReady()`；不就绪 → `deleteAllFontsFiles()`（删两个 AllFonts.js + font_selection.bin）+ `force=true` 再生成一次（D9） |
| R2 | **native 引擎跑挂/跑久** | 生成走 JNI（`CApplicationFonts`）；这正是当初不能放启动路径的原因 | ① 生成放**独立后台线程**，`try/finally` 复位 `officeDisabled`；② 自动机制**有限次**（D4：落盘记 attempts，默认只自动尝试 1 次），失败后不再自动重试，避免"重启→自动→再崩"的循环；③ 全过程写系统日志与长任务状态，可追溯 |
| R3 | **浏览器缓存** | 文档 `office/docs/CppToJava常见问题与解决方案.md:639-662` 记录：症状常是浏览器缓存了旧的/空的 `AllFonts.js` | 前端**先等就绪再加载编辑器**，首次即拿到新文件；已打开过坏页面的用户可能仍需硬刷新（如实写入文档） |
| R4 | **集群为 per-node** | 字体库产物、`officeDisabled`（[BaseFunction.java:197](../src/com/DocSystem/common/BaseFunction.java:197)）都在**本机文件系统/本 JVM 内** | 检测与生成只对**处理该请求的那台机器**有效（与现状「重置字体库」一致）。文档写明；不做跨节点广播 |
| R5 | 生成期间 Office 全局不可用 | 现状即 `officeDisabled=1` | 沿用（D5）；期间前端给"字体库初始化中"的明确提示，而不是让用户看到坏掉的编辑器 |
| R6 | **鉴权** | [MyInterceptor.java:133](../src/com/DocSystem/controller/MyInterceptor.java:133) 对任何带 `X-Requested-With: XMLHttpRequest` 的请求**直接放行**（全站既有设计）⇒ 新接口必须**自校验**登录/角色，不能依赖拦截器 | 新接口内联 `login_user` 校验（D2 决定是否再要求超管） |

---

## 2. 方案

### 2.1 一句话

**新增"字体库就绪自检 + 后台异步生成"，由前端在需要时发起，全部走已有长任务机制；完全不触碰系统启动路径。**

```
主界面加载 / 打开 Office 编辑器
        │  (前端发起)
        ▼
POST /Bussiness/getOfficeFontsStatus.do   ← 只读、廉价（File.exists × 4 + 内存标志）
        │
        ├─ installed=false ────────────────► 维持现状（"Office编辑器不可用"，不触发）
        ├─ ready=true ─────────────────────► 直接继续（零成本，什么也不做）
        ├─ generating=true ────────────────► 显示"字体库初始化中…"，轮询到位后自动继续
        └─ !ready && !generating && 允许自动
                    │
                    ▼
        POST /Bussiness/autoGenerateOfficeFonts.do   ← 幂等启动后台线程，立即返回 taskId
                    │
                    ▼  (后台线程：officeDisabled=1 → 生成 → 复查 → 兜底 → 复查 → finally 复位)
        POST /DocSystem/Manage/queryLongTermTask.do  ← 前端轮询（已有接口）
                    │
                    ▼
              ready → 自动继续加载编辑器 / 后台页显示"已就绪"；失败 → 提示管理员手动「重置字体库」
```

### 2.2 后端（均落在 **websocket 仓库**，字体域所在处）

| 项 | 内容 |
|---|---|
| 新接口 1 | `POST /Bussiness/getOfficeFontsStatus.do`：**纯只读**。返回 `{installed, ready, missing:[...], generating, taskId, autoEnabled, autoFailed, lastError, lastAttemptTime}`。任何**已登录**用户可调（自校验 `login_user`）。`installed` = `web/static/office-editor` 是否存在；`ready` = `OfficeBase.isAllFontsReady()`（放宽为 `protected static`，**判据本身不改**）；`missing` 便于排障与页面展示 |
| 新接口 2 | `POST /Bussiness/autoGenerateOfficeFonts.do`：**幂等启动**。已在生成中 → 返回现有 `taskId`（不重复启动）；未安装 / 已就绪 / 自动开关关闭 / 已达尝试上限 → 返回 `noop=true` + 原因，不启动。启动成功立即返回 `{taskId, generating:true}`（**不在请求线程里等**） |
| 并发保护 | 进程内 `AtomicBoolean officeFontsGenerating` + 当前 `taskId`（`ConcurrentHashMap` 之上的 `longTermTaskHashMap` 已可查任务） |
| 后台生成流程 | 新方法（建议 `BussinessBase.autoGenerateOfficeFonts(...)`，复用 `OfficeBase.initOfficeEditorFonts(true)` 语义）：`officeDisabled=1` → `checkAndGenerateFonts(needThumbnails, force=false)` → **复查 `isAllFontsReady()`** → 仍不就绪则 `deleteAllFontsFiles()` + `checkAndGenerateFonts(needThumbnails, true)` → 再复查 → 同步 `LongTermTask.status/info` → `finally { officeDisabled=0; 释放标志位; 写状态文件; 写系统日志 }` |
| 状态文件（落盘，跨重启生效） | 建议 ini 目录下 `officeFontsAutoGen.properties`（键：`lastAttemptTime`、`attempts`、`lastResult`、`lastError`）。作用：**避免 R2 的崩溃循环**——重启后若上次自动生成失败/中断，达到上限即不再自动重试，只提示管理员手动重置（D4） |
| 手动入口 | **不改**。`generateOfficeFonts.do`（超管、全量 force=true 含缩略图）保留为最终兜底 |

### 2.3 前端（主仓库）

| 落点 | 改动 |
|---|---|
| [OfficeEditorLoader.js](../WebRoot/web/js/OfficeEditorLoader.js) | `loadRuntimeConfig()` 里在拿到 `getOfficeEditorConfig.do` 的配置后、`loadScript(api.js)` 之前插入 `ensureOfficeFontsReady(cb)`：调 status → 就绪即继续；未就绪且允许自动 → 调 `autoGenerateOfficeFonts.do` → 在 `#placeholder` 显示「字体库正在初始化（首次约 10 分钟），完成后本页面会自动继续，也可稍后重试」→ 每 15s 轮询 status（上限 30 分钟）→ 就绪后 `flushCallbacks()` 照常加载；失败/超时 → `fail("字体库初始化失败，请联系管理员在管理后台点「重置字体库」")`。**status 接口异常/404 一律 fail-open（当作就绪继续）**，保证开源版或接口缺失时不引入新故障 |
| 主界面初始化（T1，建议） | 登录后首页初始化时静默调一次 status（用 `sessionStorage` 标记"本次会话只查一次"，避免每次刷新都请求）；未就绪则 fire-and-forget 触发一次自动生成，**不弹窗、不阻塞**（提前预热，让用户在真正编辑前就把字体库备好） |
| 管理后台 [systemOfficeEditor.html](../WebRoot/manager/tmpl/systemOfficeEditor.html)（+`_en.html`）/ [main.js](../WebRoot/manager/main.js) | ① 表格新增**只读状态行**「字体库状态」：已就绪 / **生成中（附 taskId 与进度文本）** / 缺失（列缺失项）/ 上次自动生成失败（附原因）；② 新增可编辑项「缺失时自动生成」（默认开，走既有 `setSystemPageEditMode("SystemOfficeEditor", SYSTEM_OFFICE_FIELDS, ...)` + `postSystemInfo` 套路，需把字段加进 [SYSTEM_OFFICE_FIELDS](../WebRoot/manager/main.js:3431)）；③ 生成中沿用 `gStatus=5`（"正在重置字体库，请稍后重试!"）挡住冲突操作；④ 「重置字体库」按钮与文案**行为不变** |

### 2.4 配置

| 键（建议名，D6 可改） | 默认 | 含义 | 生效 |
|---|---|---|---|
| `OfficeAutoGenerateFonts` | `true` | 字体库缺失时是否允许自动生成（关闭 = 完全保持现状，只提示） | 调用时读取 ⇒ 立即生效 |
| `OfficeAutoGenerateFontsMaxAttempts` | `1` | 自动生成最多尝试次数（跨重启累计，达上限后只提示手动重置） | 同上 |

落点：`docSysIniPath/docSysConfig.properties`（真实生效）+ `WEB-INF/classes/docSysConfig.properties`（默认值镜像，随发布），并在 [参数存储策略与参数清单.md](参数存储策略与参数清单.md) 的清单里登记（per-node 参数不入库的约束照旧）。

### 2.5 与发布流程 / 文档的配合

- **不改** `CleanOfficeFonts.bat` 的清理清单（产物仍然不进 war —— 这是体积考虑，正确）；只**修正它的注释**：`regenerated on first start` → `自动生成：首次被需要时（打开 Office 编辑器 / 主界面静默预检）由前端发起；也可由管理后台「重置字体库」手动触发`（D7）。
- 更新 `office/docs/CppToJava常见问题与解决方案.md` 字体库一节：补"自动检测/自动生成机制、状态查询接口、仍失败时的手动步骤、集群 per-node 注意"。
- 更新 `devDocs/参数存储策略与参数清单.md` 清单。

### 2.6 明确不做

- ❌ 不把生成放回 `docSysInit` / `@PostConstruct` / 静态块 / `ContextRefreshedEvent` 等任何启动路径（R2 的根因）。
- ❌ 不改 `isAllFontsReady` 的判据（4 项维持现状）——只在**外面**加"生成后复查 + 兜底重生成"。
- ❌ 不改 `FontGenerator` / `CApplicationFontsWorker` 等 native 侧逻辑。
- ❌ 不改手动「重置字体库」的行为与文案。
- ❌ 不做集群广播 / 分布式锁。
- ❌ 不动发布包的清理清单。

---

## 3. 裁定项（待用户逐条确认；附推荐）

| # | 问题 | 选项 | 推荐 |
|---|---|---|---|
| **D1** | 自动检测/生成的**触发点** | (a) 登录后主界面静默预检一次（提前预热，非阻塞）<br>(b) 打开 Office 编辑器时检测（未就绪则显示"初始化中"，就绪后自动继续）<br>(c) 管理后台 Office 编辑器页显示状态（可见性）<br>(d) 额外在 Office 相关后端接口做懒触发兜底 | **a + b + c**（d 视裁定；b 是底线，必须做） |
| **D2** | 谁可以**触发自动生成** | (A) 任意已登录用户（字体库缺失 = 全体 Office 都用不了；一次性免费操作，加开关+尝试上限）<br>(B) 仅超管（普通用户只看到"字体库未就绪，请联系管理员"） | **(A)**，与"管理员忘了也不影响用户"的目标一致；若担心被滥用可选 (B) |
| **D3** | 自动生成的**力度** | (A) `checkAndGenerateFonts(needThumbnails=true, force=false)`：**缺才建、含缩略图、就绪时廉价跳过**<br>(B) 沿用旧启动口径 `(false,false)`：更快但**不产缩略图**（字体预览可能空白）<br>(C) `(true,true)`：每次全量重建（最慢，≈10 分钟） | **(A)** |
| **D4** | 失败与重试 | 落盘记 attempts/lastError；**自动最多 1 次**（可配），失败/中断后不再自动重试，改为提示管理员手动「重置字体库」；可加 30 分钟冷却防抖 | **按此实现**（防 R2 崩溃循环） |
| **D5** | 生成期间 | `officeDisabled=1` 全局禁用 Office（沿用现状）+ 前端明确提示 | **沿用** |
| **D6** | 开关 | `docSysConfig.properties` 加 `OfficeAutoGenerateFonts`（默认 true）+ `OfficeAutoGenerateFontsMaxAttempts`（默认 1）；后台页可编辑 | **是**（若不要开关，则取消 D6 只留硬编码默认） |
| **D7** | 发布脚本注释 | 修正 `CleanOfficeFonts.bat` 里已过期的 "regenerated on first start" | **改** |
| **D8** | 三处死代码 `initOfficeEditorFonts` | (A) 复用为自动生成的执行入口<br>(B) 删除 | **(A)** |
| **D9** | 自检后的兜底 | 生成后复查不就绪 → `deleteAllFontsFiles()` + `force=true` 再生成一次；仍不就绪则判失败 | **是**（防 R1） |

---

## 4. 开工清单（文件级，待裁定后执行）

**websocket 仓库**（`git -C src/com/DocSystem/websocket`，`master`）

- [ ] `BussinessController.java`：新增 `getOfficeFontsStatus.do`、`autoGenerateOfficeFonts.do`（含登录自校验、幂等、状态文件读写）
- [ ] `OfficeBase.java`：`isAllFontsReady` → `protected static`；新增 `getMissingOfficeFonts()`（列缺失项）；`initOfficeEditorFonts(boolean)` 补齐返回值/日志（复用为执行入口）
- [ ] `BussinessBase.java`：后台生成线程封装（`officeEnabled` 复位、长任务状态推进、异常兜底）

**主仓库**（`D:/Dev/DocSys`）

- [ ] `WebRoot/web/js/OfficeEditorLoader.js`：`ensureOfficeFontsReady()` + 等待文案 + 轮询 + fail-open
- [ ] 主界面初始化处（`WebRoot/web/js/DocSys.js` 或首页 onload）：静默预检（sessionStorage 每会话一次）
- [ ] `WebRoot/manager/tmpl/systemOfficeEditor{,_en}.html` + `WebRoot/manager/main.js`：状态行、开关项、字段注册、进度显示
- [ ] `src/docSysConfig.properties` + `WebRoot/WEB-INF/classes/docSysConfig.properties`：两个新键
- [ ] `devDocs/参数存储策略与参数清单.md`：登记新键
- [ ] `devDocs/Office字体库自动生成方案.md`：本方案补 §实施记录与证据
- [ ] `office/docs/CppToJava常见问题与解决方案.md`（**office 仓库** `dev/office`）：补充排查与自动机制说明
- [ ] `DevAgentControl/CURRENT_STATE_Office字体库自动生成.md`：进展
- [ ] （工作区外，需用户确认）`C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 注释修正

**编译/部署约束**：Java 改动编译输出到 `WebRoot/WEB-INF/classes`（`-d`，绝不落源码树）；`office/docs` 属 office 仓库需单独提交；前端改动硬刷新即可。

---

## 5. 验收项

| # | 验收项 | 判据 |
|---|---|---|
| V1 | 检测准确 | 临时删掉 `sdkjs/common/AllFonts.js` → status 返回 `ready=false, missing=["sdkjs/common/AllFonts.js"]`；恢复后 `ready=true` |
| V2 | 自动生成闭环（核心） | 按 `CleanOfficeFonts.bat` 清单清空 6 类产物（模拟发布包状态）→ 打开 Office 编辑器 → 页面显示"初始化中"→ 生成完成后**自动继续加载**且可正常编辑；`isAllFontsReady()`=true；`fonts/`、两个 `AllFonts.js`、`font_selection.bin`、缩略图均重建 |
| V3 | 幂等/低成本 | `ready=true` 时调 status/auto → 不产生生成动作（响应 < 1s，无长任务；日志无 `SaveAllFontsJS Start`） |
| V4 | 并发保护 | 并发 5 次 `autoGenerateOfficeFonts.do` → 只启动 1 个任务，其余返回同一 `taskId`；期间 `generating=true` |
| V5 | R1 兜底 | 人为构造"仅缺 `sdkjs/common/AllFonts.js`、`font_selection.bin`+`fonts.log` 完好"→ 自动流程必须在**兜底分支**里把它修好（日志可见 `deleteAllFontsFiles` + force 生成） |
| V6 | R2 失败上限 | 模拟生成失败（如临时改名 `core-fonts/`）→ 任务 `status=-1`、状态文件 `attempts=1`；再次调 status **不再自动尝试**，返回 `autoFailed=true`；后台页显示失败原因与手动入口 |
| V7 | 不触碰启动路径 | 全仓静态检查：无任何启动期（`docSysInit`/静态块/`@PostConstruct`/`ContextRefreshedEvent`）调用字体生成；`getOfficeFontsStatus` 之外的字体生成入口只有"手动重置 / 安装 Office / 自动生成"三处 |
| V8 | 鉴权 | 未登录 → 明确报错（`NOT_LOGGED_IN`）且不启动任务；按 D2 结论校验角色 |
| V9 | 未安装 Office | `web/static/office-editor` 不存在 → `installed=false`，不触发；页面维持"Office编辑器不可用" |
| V10 | 回归 | 手动「重置字体库」全流程（含 `gStatus` 提示、成功/失败文案）与改前一致；Office 编辑/新建/转换不受影响 |

---

## 6. 影响面与回归

- **新增**：2 个接口 + 1 个后台线程 + 2 个配置键 + 1 个状态文件 + 前端等待态。
- **修改**：`OfficeBase.isAllFontsReady` 可见性（不加逻辑）；`OfficeEditorLoader` 加载时序（新增"等待就绪"分支）；后台页新增行。
- **不改**：native 生成逻辑、就绪判据、手动重置行为、发布清理清单、启动路径。
- 风险最高的两处已在 §1.6 给出对策：R1（自检≠好状态）由 D9 兜底，R2（native 跑挂）由 D4 上限 + 独立线程 + 落盘记录控制。**若用户对 R2 要求更强保证**（例如"绝不允许自动生成把服务拖慢/拖垮"），可在 D3/D4 上收紧为"仅提示 + 一键生成"，本方案结构不变。

## 7. 待补充 / 未确认

1. **"字体库不存在"的确切文案来源未定位**：该提示应在 office-editor 前端（`sdkjs`/`web-apps` 压缩产物）或浏览器 404 之后弹出，源码里搜不到 DocSys 侧的同名文案；本方案不依赖它（服务端判据 + 编辑器唯一加载咽喉已足够定位问题），如实记录。
2. 生成耗时只知经验值"约 10 分钟"（确认框文案），未在本机实测分解（含/不含缩略图各多久）——开工后可顺手测一次并回填本文档。
3. `docSysConfig.properties` 键名风格在本项目里不统一（`mail.smtp.*` / `sms_*` / `AgentSkillStorePath`），D6 的键名只是建议，最终以用户裁定为准。

---

## 8. 实施记录（2026-10-10）

> 用户 2026-10-10 裁定：**按 §3 推荐项 D1–D9 全部采纳，开工**。以下为实际落地内容与证据。

### 8.1 落地清单（D1–D9 已全部实施）

| # | 裁定项 | 落地 |
|---|---|---|
| D1 | 触发点 = 首页静默预检 + 编辑器入口等待 + 后台页状态 | ① `WebRoot/web/js/common.js` 末尾新增 `officeFontsAutoCheck()`（原生 XHR，随页面加载跑一次，未就绪即触发自动生成，**不弹窗不阻塞**）② `WebRoot/web/js/OfficeEditorLoader.js` 新增 `ensureOfficeFontsReady()`，在加载 `api.js` **之前**自检/触发/轮询，就绪后才 `flushCallbacks()` ③ 管理后台「Office编辑器」页新增「字体库状态」行（`refreshOfficeFontsStatus()`，生成中每 15 秒自动刷新） |
| D2 | 任意已登录用户可触发 | 两个新端点各自校验 `session.login_user`（不依赖 `MyInterceptor`——它对 ajax 一律放行） |
| D3 | `needThumbnails=true, force=false` | `BussinessController.doAutoGenerateOfficeFonts()` → `BussinessBase.initOfficeEditorFonts(true)` |
| D4 | 落盘记尝试次数，自动最多 1 次 | ini 目录 `officeFontsAutoGen.json`（`attempts`/`lastResult`/`lastError`/`lastAttemptTime`）；**开工前先记账**（native 跑挂也算一次）；成功即 `attempts=0`；达上限后 `noopReason=attemptsExceeded` + 提示手动重置 |
| D5 | 沿用 `officeDisabled=1` | `OfficeBase.initOfficeEditorFonts(...)` 内 `try/finally` 置位/复位（异常、Error 也复位） |
| D6 | 开关 + 上限（可编辑） | `OfficeAutoGenerateFonts`（默认 `true`）、`OfficeAutoGenerateFontsMaxAttempts`（默认 `1`）；`Path.getOfficeAutoGenerateFonts()/getOfficeAutoGenerateFontsMaxAttempts()` 读取；管理后台下拉框写入（`setSystemInfo` 新增参数 + 回拷 classes） |
| D7 | 修正发布脚本注释 | `C:\TomcatForDocSysDev\CleanOfficeFonts.bat` 两处注释改为"由浏览器首次需要时自动生成，或管理后台手动重置" |
| D8 | 复用死代码 `initOfficeEditorFonts` | `OfficeBase.initOfficeEditorFonts(needThumbnails[, force])`（原三处死代码中的**实现层**）成为唯一生成入口（含 `officeDisabled` 与复查），自动生成与手动重置共用。`Channel.initOfficeEditorFonts` / `BusinessChannel.initOfficeEditorFonts` 两个**未被调用的旧接口声明保持原样**（属发布版兼容面，本次不动） |
| D9 | 生成后复查 + 兜底强生成 | `OfficeBase.generateFontsWithVerify()`：生成 → `isAllFontsReady()` → 不就绪则 `deleteAllFontsFiles()` + `force=true` 再生成 → 再复查；**返回值一律以复查为准**（不用 `checkAndGenerateFonts()` 的布尔值） |

新增/修改文件：

- **websocket 仓库**：`OfficeBase.java`（可见性 + `generateFontsWithVerify` + `getOfficeFontsMissingItems`）、`BussinessController.java`（`getOfficeFontsStatus.do`、`autoGenerateOfficeFonts.do`、状态文件读写、后台线程；顺带让 `generateOfficeFonts.do` 用**复查结果**上报成功/失败）。<br>（`BussinessBase.java` **未改动**：后台线程与状态文件都放在 `BussinessController`，与两个新端点同处，便于对照阅读）
- **主仓库**：`src/com/DocSystem/common/Path.java`（两个配置读取）、`src/com/DocSystem/controller/ManageController.java`（`getSystemInfo` 返回开关值、`setSystemInfo` 新增参数并写入）、`WebRoot/web/js/common.js`、`WebRoot/web/js/OfficeEditorLoader.js`、`WebRoot/manager/main.js`、`WebRoot/manager/tmpl/systemOfficeEditor{,_en}.html`、`WebRoot/web/lang/en.js`（英文词条）、`src/docSysConfig.properties`（默认值注释）、**`src/com/DocSystem/test/TestOfficeFontsAutoGenGuard.java`（新增源码级护栏测试，21 项）**
- **office 仓库**：`docs/CppToJava常见问题与解决方案.md` §9.4（自动生成机制与排查要点）

护栏测试（`com.DocSystem.test.TestOfficeFontsAutoGenGuard`，21 项）覆盖：启动容器类（`BaseController`/`BaseFunction`）不得出现字体生成符号、两个新端点必须自带登录校验、自动生成必须在 daemon 后台线程、幂等/officeBusy/attemptsExceeded 三个短路分支、`officeDisabled` 必须 finally 复位、成败判据必须复查 `isAllFontsReady()`、手动重置必须共用同一套复查、前端"先等字体库再加载编辑器"与 fail-open。
运行：`javac -g -encoding UTF-8 -cp "WebRoot\WEB-INF\classes;WebRoot\WEB-INF\lib\*" -d WebRoot\WEB-INF\classes src\com\DocSystem\test\TestOfficeFontsAutoGenGuard.java` → `java -cp "WebRoot\WEB-INF\classes;WebRoot\WEB-INF\lib\*" com.DocSystem.test.TestOfficeFontsAutoGenGuard`（工作目录须为工程根）。
**负向验证**：故意在 `BaseFunction.java` 注入 `checkAndGenerateFonts` 字样 → 该测试 FAIL 且 `exit 1`；还原后 21 项全过、`exit 0`（证明护栏真的会拦）。

### 8.2 接口契约（实测响应）

```jsonc
// POST /DocSystem/Bussiness/getOfficeFontsStatus.do  （只读，任何已登录用户）
{"status":"ok","data":{
  "installed":true,"ready":true,"missing":[],
  "officeDisabled":0,"generating":false,"taskId":"","taskInfo":"",
  "autoEnabled":true,"autoMaxAttempts":1,"autoAttempts":0,"autoFailed":false,
  "lastResult":"none","lastError":"","lastAttemptTime":""
}}
// 未登录 → {"status":"fail","msgInfo":"用户未登录，请先登录！"}

// POST /DocSystem/Bussiness/autoGenerateOfficeFonts.do
// 已就绪 → {"status":"ok","data":{... "noop":true,"noopReason":"fontsReady"}}
// 缺产物 → 立即返回（不等待）{"status":"ok","data":{... "generating":true,"taskId":"autoGenerateOfficeFonts-<毫秒>"}}
// 已在生成中 → 复用同一 taskId（幂等）
// 达尝试上限 → {"status":"fail","msgInfo":"字体库自动生成已尝试 N 次仍未成功，请…手动重置字体库"}
```

### 8.3 验证结果（详见 §8.4 原始证据）

| # | 验收项 | 结果 |
|---|---|---|
| V1 | 检测准确 | ✅ 基线 `ready:true,missing:[]`；移走 4 类产物后 `ready:false` 且 `missing` 精确列出 4 项 |
| V2 | 自动生成闭环 | ✅ 两轮都通过：② 第二轮（终版代码）23:23:26 触发 → 23:49 完成（**约 26 分钟**），`ready:true / generating:false / officeDisabled:0 / lastResult:success / attempts:0`；产物与备份**字节级一致**（详见 §8.4） |
| V3 | 幂等/低成本 | ✅ 就绪状态下 `autoGenerate` 返回 `noop:true,noopReason:fontsReady`（无 native 生成）；触发后 92 ms 返回 |
| V4 | 并发保护 | ✅ 修复后复验：并发 4 次 `autoGenerate` **全部返回同一 `taskId`、`status:ok`、`noop:false`**，无 `attemptsExceeded`（首轮缺陷见 §8.6-1） |
| V5 | R1 兜底 | ⚠️ 逻辑已落地但仍**未触发实测**（两轮清理都包含 `font_selection.bin` ⇒ 首次生成即真实执行）；见 §8.5-4 |
| V6 | 失败上限 | ✅ 预置 `attempts:1,lastResult:fail` → `autoFailed:true` + `noopReason:attemptsExceeded`（不启动任务）；预置 `lastResult:running`（模拟被中断/进程崩）→ 同样被挡；清空状态文件后 `autoAttempts:0` 可再次自动生成 |
| V7 | 不触碰启动路径 | ✅ 静态清单：生成入口仅 手动重置 / `installOffice` / `onlineInstallOffice` / 前端发起的自动生成；启动期（静态块、`docSysInit`、`@PostConstruct`、`ContextRefreshedEvent`）无任何调用 |
| V8 | 鉴权 | ✅ 未登录两个端点均返回 `用户未登录，请先登录！` 且不启动任务 |
| V9 | 未安装 Office | ✅ 临时移走 `web/static/office-editor` → `installed:false, ready:false, missing:[], autoFailed:false`；`autoGenerate` → `您未安装Office, 请先完成安装！`（不启动任务） |
| V10 | 回归 | ✅ 前端契约不变 + 真机全流程：手动「重置字体库」→ 确认框 → `generateOfficeFonts.do` → 轮询 `queryLongTermTask.do` → 页面弹 **"字体库重置成功"**、`gStatus` 5→0、状态行回到**"已就绪"**（force=true 全量重建实测 **约 20 分钟**，00:06:29 完成，`officeDisabled` 1→0）；新增并发保护后"生成中再次点击"被挡（`已有字体库生成任务正在进行，请稍后再试！`）；手动成功会清零自动生成的失败计数（状态文件回到 `attempts:0 / lastResult:none`） |

**前端真实浏览器验证（Playwright）**

| 项 | 结果 |
|---|---|
| 编辑器入口等待态（D1-T2） | ✅ 打开 `web/index.html` 后注入 `OfficeEditorLoader` 并调 `initBootstrapDialog()`，占位区显示：`字体库正在生成中（首次可能需要 10-30 分钟），完成后本页面会自动打开，也可稍后重试`，并按 15 秒轮询等待就绪 |
| 首页静默预检（D1-T1） | ✅ 随 `common.js` 加载执行；生成中时按设计**静默返回**（控制台无触发日志、未产生重复任务） |
| 管理后台状态行 + 开关（D1-T3 / D6） | ✅ 实测渲染出 3 行：`Office引擎` / `字体库状态`（显示`生成中（首次约 10-30 分钟），期间无法使用Office（…）`）/ `字体库缺失时自动生成`（下拉`开启`选中、只读态禁用） |

### 8.4 实测记录（dev Tomcat 8100，2026-10-10 22:52–23:2x）

**基线（生成前，产物完整）**

| 产物 | 大小 | MD5 |
|---|---|---|
| `sdkjs/common/AllFonts.js` | 172518 | `47013FE8…` |
| `server/FileConverter/bin/AllFonts.js` | 203652 | `4F2E10A5…` |
| `server/FileConverter/bin/font_selection.bin` | 130402 | `4FDB7859…` |
| `server/FileConverter/bin/fonts.log` | 42512 | `B20934C6…` |
| `fonts/` | 552 个文件 | — |
| `fonts_thumbnail*`（Images） | 20 个文件（6 个分辨率档 + `_ea` 变体） | — |

**模拟发布包清理**：把上述 4 个文件与 `fonts/` 目录改名成 `*.bak`（等效于"缺失"，且可恢复），缩略图留在原地。

**① 检测（V1）** —— `getOfficeFontsStatus.do`：

```json
{"installed":true,"ready":false,"officeDisabled":0,"generating":false,
 "missing":["fonts","sdkjs/common/AllFonts.js","server/FileConverter/bin/AllFonts.js","server/FileConverter/bin/font_selection.bin"],
 "autoEnabled":true,"autoMaxAttempts":1,"autoAttempts":0,"autoFailed":false,"lastResult":"none"}
```

**② 触发自动生成** —— 响应 **704 ms** 返回（未阻塞请求线程）：

```json
{"status":"ok","data":{"generating":true,"taskId":"autoGenerateOfficeFonts-1791643956081",
 "officeDisabled":1,"autoAttempts":1,"lastResult":"running","taskInfo":"正在生成字体库…"}}
```

**③ 生成过程**（`docsys.log`）与耗时分解：

- `checkAndGenerateFonts() → SaveAllFontsJS Start → mapFontFiles.size:552 → mapFonts.size:376`（真实执行了生成，未走"跳过"分支）
- **文件部分 ≈ 3 分钟**：`AllFonts.js` / `font_selection.bin` 于 22:55:31 写出
- **缩略图部分 ≈ 22 分钟**：`fonts_thumbnail@1x → @1.25x → @1.5x → @1.75x → @2x → _ea@1x …`（每档约 2 分钟）
- 全程 `officeDisabled=1`（其它 Office 操作被既有逻辑挡住）

**④ 产物保真**（生成后 vs 备份，字节级）：

| 产物 | 生成后 | 备份 | 一致 |
|---|---|---|---|
| `sdkjs/common/AllFonts.js` | 172518 B / `47013FE8…` | 172518 B / `47013FE8…` | ✅ 完全一致 |
| `server/FileConverter/bin/AllFonts.js` | 203652 B / `4F2E10A5…` | 203652 B / `4F2E10A5…` | ✅ 完全一致 |
| `server/FileConverter/bin/font_selection.bin` | 130402 B / `4FDB7859…` | 130402 B / `4FDB7859…` | ✅ 完全一致 |
| `fonts/` | 552 个 | 552 个 | ✅ |

**⑤ 收尾状态（第一轮）**：23:19 生成结束 → `ready:true, generating:false, officeDisabled:0, lastResult:"success", attempts:0`，任务 `status=200`；状态文件 `{"lastError":"","lastAttemptTime":"…","lastResult":"success","attempts":0}`；`fonts.log` 42512 B 于 23:18:45 最后写出 ✓

**⑥ 第二轮（终版代码，23:23:26 触发 → 23:49 完成，约 26 分钟）**

- 触发响应 **92 ms**，`taskId=autoGenerateOfficeFonts-1791645806491`，`autoFailed:false`
- **并发 4 次**：全部 `status:"ok"`、`noop:false`、**同一 taskId**（V4 复验通过）
- 生成中调手动「重置字体库」→ `已有字体库生成任务正在进行，请稍后再试！`（新并发保护生效）
- 结束：`ready:true, generating:false, officeDisabled:0, lastResult:"success", attempts:0`；`fonts/` 552、`fonts_thumbnail*` 20、`Images` 27（与清理前完全一致）
- 备份文件已清理（无残留 `*.bak`）

**⑦ 验证期间发现并修掉的自身缺陷**：`attemptsExceeded` 判定顺序（§8.6-1）、手动/自动并发跑 native 生成（§8.6-2）、`generating` 未覆盖手动重置（§8.6-3）、等待上限与文案（§8.6-4）、后台页状态行取 DOM 早于渲染（§8.6-5）、手动重置无条件报成功（§8.6-6）

**⑧ 手动「重置字体库」全流程（force=true）真机浏览器实测（V10-b，23:46 起）**

在管理后台「Office编辑器」页真实点击「重置字体库」：
- 确认框文案（既有）：`重新生成字体库大约需要10分钟, 期间将无法使用Office, 是否重置？`；点「确认」后
- 网络：`POST /Bussiness/generateOfficeFonts.do` → `POST /Manage/queryLongTermTask.do`（前端轮询启动 ✓）
- 提示：`字体库生成中，可能需要花费较长时间，您可先关闭当前窗口！`，`gStatus = 5`（挡住其它 Office 操作 ✓）
- 同页「字体库状态」行在点击前显示 `已就绪`（= 第二轮自动生成的结果被后台页正确显示 ✓）
- 结论：✅ **全流程通过**（00:06:29 结束，force=true 全量重建实测 **约 20 分钟**）
  - 过程：`officeDisabled` 1→0；状态行在生成中显示"生成中…"，结束后回到 **"已就绪"**（后台页 15 秒轮询生效）
  - 前端结果：页面弹 **"字体库重置成功"**，`gStatus` 5→0
  - 服务端：状态文件被手动成功路径清零 → `{"lastError":"","lastAttemptTime":"","lastResult":"none","attempts":0}`；
    `fonts.log` 于 00:06:13 重写（42512 B，与基准一致）

### 8.5 已知限制 / 未验证项

1. **缩略图**：自动生成走 `needThumbnails=true`，但仅当真的走了生成分支才会重建；若产物只因某一项缺失而触发，缩略图可能仍是旧的（与手动全量重置的差别在此）。
2. **集群 per-node**：检测与生成只作用于处理该请求的节点；其它节点需各自被访问到才会自愈。
3. **浏览器缓存**：已就绪前打开过编辑器的页面可能仍持有旧的/404 的 `AllFonts.js`，需要刷新（既有现象，见 `office/docs` §9.1）。
4. **"生成后仍未就绪 → 删产物 + force 重建"这一兜底分支未在本轮实测中触发**（本轮清理已包含 `font_selection.bin`，首次生成即真实执行）；若要实测，需构造"只缺某个 `AllFonts.js`、而 `font_selection.bin`+`fonts.log` 完好"的场景。
5. **`officeDisabled == 1` 也是"已有生成/安装/升级在进行"的判据** ⇒ 管理员手动「禁用 Office」期间自动生成不会启动（Office 被禁用时生成也没意义）；重新启用后下次检测即会补上。这是刻意的取舍（避免与安装/升级并发跑 native 生成）。
6. 实测耗时远高于界面文案的"约10分钟"：**自动生成（force=false，缺则建）两轮实测 26 / 23 分钟；手动重置（force=true 全量重建）实测 20 分钟**（dev 机器，缩略图档位占大头，文件部分仅约 3 分钟）。已相应把前端等待上限从 30 分钟提到 60 分钟、新文案改为"10-30 分钟"；**手动重置对话框里既有的"大约需要10分钟"文案未改**（属既有文案，避免扩大改动面）。
7. 管理后台**英文页**（`systemOfficeEditor_en.html`）与英文词条已同步，但只做了静态核对（`node --check` + 词条唯一性检查），未做英文页真机浏览器验证。

### 8.6 实施期间的追加修正（都是本次改动直接引出/放大的问题）

| # | 问题 | 处理 |
|---|---|---|
| 1 | **并发请求拿到 `attemptsExceeded` 而不是复用运行中的 taskId**（尝试上限判断排在"是否有运行中任务"之前；首轮实测复现） | 调整判定顺序：先复用运行中任务，再判上限；并把 `autoFailed` 限定为"非生成中"才成立 |
| 2 | **手动「重置字体库」与自动生成可能并发跑 native 生成**（自动机制引入的第二个触发源；安装/升级路径同理） | 新增共用标志 `AtomicBoolean officeFontsGenerating`（自动生成与手动重置都置位，`finally` 复位）+ 以 `officeDisabled == 1` 兜住安装/升级/手动禁用；`autoGenerateOfficeFonts.do` 命中时返回 `noopReason:"officeBusy"`，手动端点在冲突时直接报"已有字体库生成任务正在进行" |
| 3 | `generating` 以前只看自动任务 ⇒ 管理后台在**手动重置期间**显示"缺失"而非"生成中" | `buildOfficeFontsStatus()` 的 `generating` 改为 `officeFontsGenerating \|\| officeDisabled == 1`，`taskId/taskInfo` 仍来自自动任务 |
| 4 | 等待上限 30 分钟 < 实测 25 分钟 + 文案"约10分钟"与实测不符 | `OFFICE_FONTS_MAX_WAIT` 30 → 60 分钟；新增文案统一为"10-30 分钟"（中/英，含后台页说明文字） |
| 5 | **管理后台「字体库状态」一直停在"正在获取..."**（首轮浏览器实测发现） | 根因：`showSystemInfoPage()` 是先调 `normalize()`（渲染前修正 `systemInfo`）再 `$Func.render()`，我把 `refreshOfficeFontsStatus()` 写在了 normalize 里 ⇒ 取 DOM 时模板还没渲染。修法：`showSystemInfoPage()` 增加第 3 个参数 `afterRender`（渲染完成后调用，既有调用方不受影响），状态刷新移入 `afterRender`；下拉框初值本来由模板 `{{if value.officeAutoGenerateFonts ...}}` 渲染，无需 JS 回填 |
| 6 | 手动「重置字体库」原来**无条件报成功**（生成返回 true 即 200，即使实际没就绪） | 与自动生成共用 `initOfficeEditorFonts(true, true)` 的复查结果：就绪才 `status=200`，否则 `status=-1` + 明确文案（前端既有 `-1` 失败分支照旧可用）；成功时顺带清零自动生成的失败计数 |

