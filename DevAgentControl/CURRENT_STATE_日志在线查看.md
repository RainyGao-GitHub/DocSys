# CURRENT_STATE_日志在线查看（工作卡）

建立于 2026-09-30。**状态：进行中（设计完成，方案待用户裁定 → 未获裁定前不要开工改代码）。**

> 本卡是**当前任务**的唯一口径处：必读上下文 / 参考计划与上下文 / 当前进展 / 生效约束（含是否需要先提交）。

## 任务

管理后台「系统设置 → 调试日志」现在只能**下载**日志；需要在操作列加「**在线查看**」按钮，点开**新页面**在线看日志。

## 现状（已取证）

- UI：`WebRoot/manager/tmpl/systemUpgrade{,_en}.html` 的「调试日志」行操作列 = **下载** `downloadLogFile()` / **清除** `cleanLogFile()`。
- 下载：`src/com/DocSystem/controller/ManageController.java:3706 downloadLogFile` —— 校验 `login_user != null && type >= 1`；
  文件 = `Log.logFile`（空则回落到 `defaultLogFilePath`）；用 `buildDownloadDocInfo(0,"","",path,name,0)` 生成
  `/Doc/downloadDoc.do?...` 链接返回，前端 `window.location.href` 触发下载。
- 清除：同文件 `:3766 cleanLogFile` —— **直接删除**日志文件。
- 路径来源：系统设置「调试日志」行（`logLevel` / `outputToFileEn` / `logFile`）→ `BaseController.initLogLevel()`(:390) →
  `Log.logFileConfig`（配置）/ `Log.logFile`（运行时）；无配置时 `defaultLogFilePath = <webapp 上溯两级>/logs/docsys.log`（`BaseFunction.java:340`）。
- 写入：`src/com/DocSystem/common/Log.java:44 toFile()` —— 文件 **> 50MB 时先把当前文件 rename 成 `<路径>-<时间戳>`**（轮转备份）再 append；
  编码固定 **UTF-8**（`appendContentToFile(..., "UTF-8")`），`RandomAccessFile` 追加。
- 部署事实：`WebRoot/WEB-INF/web.xml` —— `*.html`/`*.js` 等走 **default servlet（静态页不校验登录）**，其余走 Spring（`MyInterceptor` 对 ajax 直接放行，`.do` 里各自校验）；全局只有 encodingFilter(UTF-8)。
- 实测 dev：`C:\TomcatForDocSysDev\docsys\tomcat\logs\docsys.log` = **5.88MB**（持续增长，50MB 后轮转）；同目录还有 `docsys_console.log`、`catalina.*.log`。

## 方案（待裁定）

### 1. 入口
`systemUpgrade{,_en}.html` 操作列加 `<button onclick="viewLogFile()">在线查看</button>`；
`main.js` 新增 `viewLogFile()` = `window.open('/DocSystem/manager/logViewer' + langExt + '.html', '_blank')`（新标签页）。

### 2. 新页面
新增 `WebRoot/manager/logViewer.html` / `logViewer_en.html` / `logViewer.js`（自包含：jQuery + 少量 CSS；
参考 `WebRoot/web/textViewer.html` 的极简文本页与 `.text()` 插入方式）。
- 工具条：文件路径 / 大小 / 最后修改时间；刷新、**自动刷新开关（默认 3 秒）**、跳到末尾、向上翻页、重新加载、下载（复用现有下载接口）；
  可选：关键字过滤（前端过滤已加载内容）+ 高亮、编码切换（UTF-8/GBK）。
- 主体：`<pre>` 等宽、不折行（`white-space: pre`）、横向滚动、深色背景；**内容一律用 `.text()` / `textContent` 插入**（XSS 安全）。
- 状态行：当前窗口字节范围 / 是否已到开头 / 是否已到末尾 / "N 条新日志"提示。

### 3. 后端接口（核心）
新增 `ManageController.getLogContent.do`：
- 权限：与下载一致（`login_user != null && type >= 1`）；**只服务配置里的那一个日志文件**（`Log.logFile` ?? `defaultLogFilePath`），
  **不接受前端传路径**（避免任意文件读取漏洞）。
- 参数：`offset`(long；缺省或 `-1` = 从末尾向前取一窗)、`maxBytes`(int；缺省 256KB、上限 1MB)、`encoding`(可选 UTF-8/GBK，缺省 UTF-8)。
- 返回 `data`：`{ filePath, fileSize, lastModified, startOffset, endOffset, hasMoreBefore, content }`。
  - **行对齐**：起始处向后丢一个不完整行、结尾处向前丢一个不完整行（除非已到文件头/尾）⇒ 返回的始终是整行，且分页**不重不漏**。
  - 单行超过 `maxBytes` 时**整行返回**并标 `longLine:true`（否则会漏行/页面卡住）。
  - `offset >= fileSize` ⇒ 返回空内容 + `endOffset = fileSize`（让**增量轮询**只有一种处理路径）。
- 读取实现放**独立工具类**（建议 `src/com/DocSystem/common/LogFileUtil.java`，纯函数便于脱网单测/探针）：
  `RandomAccessFile` + `seek` 按字节窗口读；`CharsetDecoder` 用 `REPLACE` 容错（非 UTF-8 字节不抛异常）。

### 4. 增量刷新
前端轮询传上次 `endOffset` ⇒ 只取新增部分 append 到底部；若 `fileSize < 上次 endOffset` ⇒ 判定**日志被清除或被轮转**，
提示并重新从末尾加载（`cleanLogFile` 删文件、`toFile` 在 >50MB 时 rename）。

### 5. 安全 / 边界
- 文本插入（禁 `innerHTML`）；关键字高亮必须先转义再包 `<mark>`。
- 不接受路径参数；沿用管理员权限（`type >= 1`）。
- 边界用例：空文件 / 文件不存在 / 非 UTF-8 字节 / 单行超长 / offset 越界 / 清除后页面仍开着 / 权限不足 / session 过期。

## 用户裁定（2026-09-30）

1. 页面形态：**新标签独立页**（看日志需要更大的视觉空间）✓
2. **要**自动刷新（默认 3 秒、可关）与**编码切换 UTF-8/GBK** ✓
3. 历史轮转文件列表（`<日志路径>-<时间戳>`）：**不做**
4. 行号：**不做绝对行号**（用字节偏移定位，状态栏显示窗口范围）
5. `catalina.*.log` / `docsys_console.log`：**做**（白名单方式）

## 实施清单（已完成）

- **新工具类** `src/com/DocSystem/common/LogFileUtil.java`：按字节窗口读取 + 两端行对齐 + `REPLACE` 容错解码。
- **`ManageController`**：
  - 新增白名单 `getLogSourceList()`（`debug` / `console` / `catalina:yyyy-MM-dd`）+ `findLogSource` / `resolveLogFile`；
  - 新增 `getLogSources.do`（下拉数据）、`getLogContent.do`（按窗前读，**不写日志**避免轮询自我污染）；
  - `downloadLogFile.do` 增加可选 `key`（不传时行为与原来一致）。
- **新页面** `WebRoot/manager/logViewer.html` / `logViewer_en.html` / `logViewer.js`（工具条+状态栏+`<pre>`，内容一律转义插入）。
- **入口** `tmpl/systemUpgrade{,_en}.html` 操作列加「在线查看」+ `main.js` `viewLogFile()`（`window.open` 新标签）。

## 预估改动清单（实施时）

- 新增：`WebRoot/manager/logViewer.html`、`logViewer_en.html`、`logViewer.js`、`src/com/DocSystem/common/LogFileUtil.java`
- 修改：`WebRoot/manager/tmpl/systemUpgrade.html`、`systemUpgrade_en.html`、`WebRoot/manager/main.js`、`src/com/DocSystem/controller/ManageController.java`
- 归属：全部在**主仓库** `D:\Dev\DocSys`（`devInt`）

## 验证方案（实施后）

1. 编译（Spring 控制器必须 `-parameters -g`）→ `-d WebRoot/WEB-INF/classes`；重启 dev Tomcat
   （判据 = catalina `Server startup in` + 8100 Listen + 探一个 `.do`）。
2. 接口层：用探针在 `%TEMP%\docsys_chk\` 直接调 `LogFileUtil` 覆盖边界（空文件 / 1 字节 / 单行超长 / 非 UTF-8 / offset 越界 / 恰好等于 maxBytes）。
3. 页面层（浏览器工具）：点「在线查看」→ 新标签打开；默认显示末尾、向上翻页、自动刷新出现新行、关键字过滤、下载按钮；
   用现成的 5.88MB dev 日志实测，再手工 append 内容验证增量。
4. 异常路径：清除日志后页面要提示；非管理员账号调接口被拒；未登录调接口被拒。

## 必读上下文（续接锚点）

- `src/com/DocSystem/controller/ManageController.java:3706-3815`（`downloadLogFile` / `cleanLogFile`）
- `src/com/DocSystem/common/Log.java:30-70`（`logFile` / `toFile()` 的 50MB 轮转 / UTF-8 追加）
- `src/com/DocSystem/controller/BaseController.java:390-435`（`initLogLevel` / `initLogFile`）
- `src/com/DocSystem/common/BaseFunction.java:158,340`（`defaultLogFilePath`）
- `WebRoot/manager/tmpl/systemUpgrade.html:168-186`（调试日志行 + 操作列）
- `WebRoot/manager/main.js:461-525`（`downloadLogFile` / `cleanLogFile` 前端）
- `WebRoot/WEB-INF/web.xml:46-76,89-95`（`*.html` 走 default servlet；全局只有 encodingFilter）

## 当前进展（如实）

- ✅ 调研 + 方案 + 用户裁定（见上）。
- ✅ **实施完成**（见「实施清单」）。
- ✅ **编译 + 重启 + 两层验证通过**（2026-09-30 20:1x；重启后新 PID 24632）：

  **① `LogFileUtil` 探针 15/15 PASS**（`%TEMP%\docsys_chk\LogFileUtilProbe.java`）：2.59MB/40000 行文件
  “从末尾反复向上翻页拼接 == 原文逐字节相同”、顺序增量拼接 == 原文、空文件、末尾半行丢弃/补全后取回、
  200KB 超长单行、GBK 解码、offset 落在行中间的对齐。

  **② 接口层**：日志源 **12** 个（debug 5.89MB / console 4.69MB / catalina 最近10个）；
  末尾一窗、offset=0（首行 `initSystemLanguage()`）、GBK 参数（中文变乱码，证明确实生效）、
  `catalina:2026-09-30` 可读（末行 `Server startup in 36033 ms`）。
  **安全**：`../../WEB-INF/web.xml` / `C:\Windows\win.ini` / 未知 key → 均 `status=fail“日志文件不存在或不允许查看！”`。

  **③ 页面层**（浏览器）：入口按钮存在（“在线查看 / 下载 / 清除”）；打开后 12 个源、状态栏显示路径+大小+字节范围；
  自动刷新把新日志追到底部（3758 → **3760** 行，endOffset 前移）；向上翻页 3758 → **6481** 行且滚动位置保持；
  过滤 `addDocShare` → `34 / 6481` 行 + **34 个 `<mark>`**；编码切 GBK 生效；切源到 `catalina:2026-09-29` 生效；
  下载接口 `key=catalina:2026-09-30` 返回 `downloadDoc.do` 链接。

- ⚠️ **踩坑记录 1（自己改出的真 bug，E2E 抓到）**：`body` 用 flex 列布局时，`#toolbar` / `#statusBar` / `#tip`
  默认 `flex-shrink:1` 且含 `overflow:auto`（自动最小尺寸为 0）→ 被内容区挤成 13px 高，按钮被状态栏盖住、
  **连真人也点不到**（`elementFromPoint` 返回 `#statusBar`）。已改为 `flex: 0 0 auto`，复测 52px/23px、命中的是按钮本身。
- ⚠️ **踩坑记录 2（行为缺陷，已修）**：轮询只看“`offset = endOffset`”，所以“跳到开头”后视图并不在文件末尾，
  仍会每 3 秒把后续内容当“新增”追加 → 会把整个文件一路拉下来（甚至撑爆浏览器）。
  已改为**仅当 `endOffset >= fileSize`（视图已在文件末尾）时才追加**，并加上 `LOG_VIEWER_MAX_LINES` 上限。
  复测：“跳到开头”后等 8 秒行数 2832 → **2832 不变**；“回到末尾”后 2987 → **2988**（正常追加）。
- ⚠️ **已知现状（非本次引入）**：后台模板用 `$.get('tmpl/xx.html')` 无 cache-busting，
  浏览器会缓存旧模板 → 升级后需**刷新页面**才能看到新按钮（所有模板改动同理）。

## 下一步

1. **等用户确认后提交**（不要自动 commit）—— 全部改动都在**主仓库** `D:\Dev\DocSys`（`devInt`）。
2. 收尾：提交确认后把本卡移入 `DevAgentControl/已完成/`，并同步 `CLAUDE.md` 指针。
3. 可选后续（用户未要求）：行号 / 轮转历史文件列表 / 关键字服务端搜索（返回匹配行±上下文）/ 日志级导出。

## 生效约束

- **用户尚未裁定方案 → 不要自行开工改代码**。
- 编译：Spring 控制器**必须** `-parameters -g`；`.class` 只进 `WebRoot/WEB-INF/classes`，源码树不得出现 `.class`。
- 改 Java 后必须重启 dev Tomcat（`docsys_restart.bat`；启动 2~10 分钟；重启后 session 失效，需重新登录）。
- E2E 口径：`POST /DocSystem/User/login.do`（`Admin`/`pwd=QWRtaW4=`，pwd 为 base64 明文）；探针产物写 `%TEMP%\docsys_chk\`。
- **不要自动 commit**：改完 + 验证 → 汇报 → 等用户确认。

## 未提交改动

- **新增**：`src/com/DocSystem/common/LogFileUtil.java`、
  `WebRoot/manager/logViewer.html`、`logViewer_en.html`、`logViewer.js`
- **修改**：`src/com/DocSystem/controller/ManageController.java`、
  `WebRoot/manager/tmpl/systemUpgrade.html`、`systemUpgrade_en.html`、`WebRoot/manager/main.js`
- 卡片/规则：本卡（新增）、`CLAUDE.md`（指针切到本任务）
- 编译产物（不入库）：`WebRoot/WEB-INF/classes/com/DocSystem/common/LogFileUtil.class`、
  `.../controller/ManageController.class`
