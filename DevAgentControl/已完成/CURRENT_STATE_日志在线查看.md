# CURRENT_STATE_日志在线查看（工作卡）

建立于 2026-09-30。**状态：进行中（①⑤已提交：`548b6da49`/`d6b7eff85`/`f8727cd03`/`11b1a83f9`/`b95a0a19c`/`d01307d8c`；⑥补充「再点父级收起」+ ⑦子项选中风格统一，已实现+验证，**待用户确认提交**）。**

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

## 子项② 调试日志升为「系统管理」子项（2026-09-30 第二里程碑）

### 用户裁定
1. 原「系统设置」页那一行：**A 整行搬走** ✓
2. 子项名：**「调试日志」/ `Debug Log`**（沿用现有措辞）✓
3. 位置：**末尾**（「系统迁移」之后）✓
4. 移动版侧边栏缺的「系统参数」：**补** ✓
5. 页头额外说明（docsys.log / catalina）：**不要**（已标明是调试日志）✓

### 实施
- `tmpl/sidebar{,_en}.html`：`#nav` + `#navMobile` 各加「调试日志」子项；`#navMobile` 补「系统参数」。
- 新增 `tmpl/systemDebugLog.html` / `systemDebugLog_en.html`（原「系统设置」页那一行原样搬来：级别 / 输出到指定文件 / 路径 + 在线查看·下载·清除）。
- `tmpl/systemUpgrade{,_en}.html`：删除该行。
- `main.js`：新增 `case "systemDebugLog"`（`showContentPage` + `showSystemPage` 两处）+ `showSystemDebugLog` / `enableSystemDebugLogSet` / `cancelSystemDebugLogSet` / `saveSystemDebugLogSet`；
  并清理「系统设置」页对已搬走字段的残留引用（`enable/cancel/saveSystemInfoSet`、`updateSystemInfo` 错误回滚块）。

### 关键约束（务必记住）
`setSystemInfo.do` 里 **只有 `logFile` 是「传 null = 清空配置」**，其余字段传 null 一律表示「不改」。因此：
- 新页保存**只提交 `logLevel` + `logFile`**（两个都必须传），不能复用 `saveSystemInfoSet()`（它从 DOM 全量取值，缺字段会被当成 `undefined` 提交）。
- 「系统设置」页保存时必须**回传当前 `logFile`**（`var logFile = systemInfo.logFile`），否则会把日志文件配置清空。

### 验证（dev，8100，admin）
- 侧边栏模板：中/英各 2 处（桌面+移动）；渲染后两个子菜单顺序一致 `…系统参数/数据库设置/系统迁移/调试日志`（末位 idx=7/8）。
- 新页：`#systemDebugLogTable` 渲染、子项高亮、级别=info、路径空、三个按钮「在线查看/下载/清除」。
- 系统设置页：`#logLevel`/`#logFile`/`#outputToFileEn` 已不在 DOM，无「调试日志」行，其余字段（`#maxThreadCount`/`#redisEn`/`#tomcatPath`）正常。
- **回归（核心）**：新页打开「输出到指定文件」+ 设路径 + 级别改 error → 保存生效（`logFile=…/logs/docsys.log`、`logLevel=3`）；
  再去「系统设置」页「编辑→保存」→ `logFile`/`logLevel` **仍为刚设置的值**（未被清空）→ PASS；最后新页还原（关闭输出 + 级别回 info）→ 配置回到 `logFile=null`/`logLevel=1`。
- 取消：改级别 + 改路径后点「取消」→ 下拉与输入框都回到当前配置、字段重新禁用、后端配置未变。
- 英文：`systemDebugLog_en.html` 3.2KB（Debug Log / View / Download / Clean / logLevel / outputToFileEn 齐全），`logViewer_en.html`、`main_en.html` 均 200。
- 按钮命中：三个按钮 `elementFromPoint` 中心点均命中按钮本身（真人可点）；Playwright `page.click` 因元素“不稳定”超时属工具侧现象，非产品问题。
- ⚠️ **踩坑记录 3（自己改出的真 bug，E2E 抓到）**：新页「取消」用 `$("#logLevel option[...]").attr("selected","selected")` 回滚**无效**——
  select 被 `.val()`/用户交互置为 dirty 后，改 `selected` 属性不再改变当前选中项（复测：取消后仍是 3，应为 1）。改为 `.val(systemInfo.logLevel)` 后复测通过。
  同类写法在遗留的 `cancelSystemInfoSet()`（`#maxThreadCount`/`#logLevel`）里**同样失效**（实测：1 → 改成 8 → 取消后仍是 8），属**既有缺陷**，未擅自改动，待用户裁定是否一并修。
- ⚠️ **发现（既有缺陷，非本次引入）**：「下载」按钮在这套 dev 环境会 500。`downloadLogFile.do` 返回
  `/DocSystem/Doc/downloadDoc.do?...&targetPath=Qzov&targetName=<base64 绝对路径>`，`downloadDoc.do` 把两者拼成 `C:/D:\…` → “文件不存在”。
  与 `HEAD~1` 的实现一致（原实现也是 `Path.seperatePathAndName(logFilePath, temp)`），即**改动前就存在**；debug / catalina 源都会命中。
  未擅自改动，待用户裁定。

## 子项③ 布局重排：按「邮件服务」的样式拆行（2026-09-30 第三里程碑）

用户反馈：「调试日志既然已经独立出来了，参数就没必要挤在一行里，参考一下邮件服务的布局」。

- 参考页 `tmpl/systemEmailConfig.html` 的布局：`参数(220px) / 配置值` **两列**表，**每个参数一行**；
  控件带显式宽度（`form-control` + `style="width:220px/320px/440px"`），勾选框用 `<label class="checkbox-inline">`；
  整表包在 `<div id="xxxForm" style="margin-top: 20px;">` 里，**页级操作按钮放表格下方**（如「发送测试邮件」）。
- 改造 `tmpl/systemDebugLog.html` / `_en.html`：
  - 表头由 `参数/配置值/操作` 三列 → `参数/配置值` 两列；
  - 原「调试日志」一行拆为三行：`日志级别`（select 220px）/ `日志输出`（checkbox「输出到指定文件」）/ `日志文件路径`（input 520px）；
  - `在线查看 / 下载 / 清除` 三按钮移到表格下方（与「发送测试邮件」同位）；
  - 控件 id 不变（`logLevel` / `outputToFileEn` / `logFile`）→ **JS 零改动**。
- 验证（dev 8100）：表头 2 列；3 行参数分别为 220px select、`checkbox-inline`、520px input；按钮 3 个在表下且 `elementFromPoint` 均命中按钮；
  无 `td.edit` 残留；页面无横向溢出；编辑→勾选「输出到指定文件」才解禁路径输入；取消能回滚（level=1、取消勾选、全部禁用）；截图留档目视确认与「邮件服务」同一观感。
- 踩坑：该模板 `<td>` 内部的缩进是「tab + 空格」混排，手工抄写容易多/少一个 tab 导致替换失败 → 先用
  `Get-Content ... -replace "`t",'<TAB>'` 把空白可视化后再构造替换串。

## 子项④ 5 个参数块拆为独立子页（2026-09-30 第四里程碑）

### 用户裁定
1. Office 编辑器页：`officeEditorApi` / `openOfficePath` 是**残留配置、系统已不再使用 → 直接去掉**（不建输入框）✓
2. 集群页：`clusterInfo`（只读）+「测试/重置」**都搬** ✓
3. 命名与顺序：放在「调试日志」之前：`LDAP设置 / 安全网络设置 / AI接入设置 / 集群部署设置 / Office编辑器`
   （英文 `LDAP / Allowed Network / AI Access / Cluster Deploy / Office Editor`）✓
4. 安全网络设置不加说明/二次确认，保持现有逻辑 ✓

### 最关键的发现（决定实现方式）
`saveSystemInfoSet()` 原来**从 DOM 全量取 19 个字段**再提交，实测请求体里连页面上**不存在**的字段也在：
`…&openOfficePath=&officeEditorApi=&logLevel=&logFile=…`
（jQuery 1.10.2 把 undefined 序列化成空串，实测 `$.param({a:undefined})` == `"a="`；项目无 `StringTrimmerEditor`，空串到后端仍是 `""`）。
而 `setSystemInfo.do` 对每个参数都是 `if(x != null)` 才写 → **空串不是 null**，会被当成「把该配置改成空」。
⇒ 只要把行搬走而不改提交方式，保存「系统设置」就会把 LDAP/网络/AI/集群/Office 的配置清空。
⇒ 所以本次必须把提交改成**按页白名单**（后端零改动）。
> 存疑点（如实记录）：配置文件里也查不到 `officeEditorApi=`/`openOfficePath=`/`logFile=`/`logLevel=` 这些键，与「空串会被写入」的推理不一致。
> 本次不再提交这些字段，存疑点已无关紧要；但未彻底查清。

### 实施
- 新增 10 个模板：`tmpl/system{Ldap,Network,Llm,Cluster,OfficeEditor}{,_en}.html`（两列「参数/配置值」+ 每参数一行 + 操作按钮在表下）。
- `tmpl/sidebar{,_en}.html`：桌面 + 移动各加 5 个子项（插在「调试日志」之前，共 13 个子项）。
- `tmpl/systemUpgrade{,_en}.html`：删除 OfficeEditor / LDAP / 安全网络 / AI / 集群部署 5 个块（表 16 行 → 11 行）。
- `main.js`：
  - 新增公共逻辑 `showSystemInfoPage()` / `setSystemPageEditMode()` / `postSystemInfo()`（白名单提交 + 统一成功/失败提示与刷新）；
  - 新增 5 个页面的 `show/enable/cancel/save`（每页只提交自己的字段）+ `showContentPage`/`showSystemPage` 路由；
  - `saveSystemInfoSet()` 重写为白名单（只提交 tomcatPath/javaHome/5 个存储路径/maxThreadCount；`salesDataStorePath` 仅当页面上存在时提交）；
  - `enableSystemInfoSet()`/`cancelSystemInfoSet()` 改为复用 `setSystemPageEditMode()`（两个函数从 ~130 行缩到 ~10 行）；
  - `updateSystemInfo()` 已无调用方，**未删除**（100+ 行老函数，删它会让本次 diff 变大），已在函数头加注释说明「不要调用」。
- **后端：零改动**。

### 验证（dev 8100，admin）
- 侧边栏中/英各 5 处（桌面+移动），顺序：…系统迁移 / LDAP设置 / 安全网络设置 / AI接入设置 / 集群部署设置 / Office编辑器 / 调试日志（共 13）。
- 5 个页面渲染正确、子项高亮、控件默认只读；各页**只出现自己的字段**（如 LDAP 页没有 `#tomcatPath`）。
- 「系统设置」页行标签 = 当前版本/服务器/JavaHome/仓库默认存储位置/系统数据存储位置/Agent技能存储位置/销售数据存储位置/系统日志存储位置/最大上传线程数/系统密钥/证书密钥；
  `#ldapConfig`/`#allowedNetworkConfig`/`#llmConfig`/`#redisEn`/`#isOnlyOfficeUsed`/`#officeEditorApi`/`#openOfficePath` 均已不在 DOM。
- **核心验收：配置文件逐键比对**。跑完「5 个新页 编辑→保存」+「系统设置 编辑→保存」共 6 次保存后，
  `WebRoot/WEB-INF/classes/docSysConfig.properties` 的非注释键值**完全一致**（23 个键，含 `llmConfig`/`redisEn=0`/`isOnlyOfficeUsed=1`/各存储路径）；
  哈希变化仅因 `Properties.store` 重写时间戳注释。⇒ 拆分没有清掉任何他人的配置。
- 集群页「取消」回滚：编辑态下 `#redisEn` 可点（两个地址仍禁用）→ 勾选「启用」后地址解禁并预填 `redis://localhost:6379` → 取消后恢复未勾选+禁用+保存按钮隐藏。
- **按钮接线全量体检**：7 个页面里所有 `[onclick]` 的函数名都能在 `window` 上找到（各页 3~14 个按钮，bad=0）。
- 英文：5 个 `_en` 模板 200 + 侧边栏英文各 2 处（桌面+移动）。
- ⚠️ **踩坑记录 4（E2E 抓到）**：`systemOfficeEditor{,_en}.html` 里按钮 id/函数名写成了 `SystemOffice`，而 `main.js` 用 `SystemOfficeEditor`
  → 点「编辑」会 `ReferenceError`（按钮 id 也对不上，编辑/保存/取消都不切换）。已统一为 `SystemOfficeEditor`，复测通过。
  首轮 E2E 的信号是 `editVisible:false`（其余断言全过）——“断言按钮 id 存在”比“断言按钮可见”弱，后续 E2E 优先加一条 onclink 解析体检。

## 子项⑦ 子项选中风格统一（2026-09-30 第七里程碑）

用户反馈：子项的选中风格要统一成「背景高亮」（即子项悬浮态那种方式），目前用灰色不够明显，建议用比父级菜单浅一点的蓝色。

### 现状（`static/style/style.css`）
- 父级选中/悬浮：蓝色渐变 `#1aaef3 → #0993d3` + 白字加粗（`.sidebar #nav > li > a.open`）
- 子项悬浮：`background: #eee`（灰）——用户认可的就是这种「背景高亮」方式
- 子项选中（旧）：`background: #fff` + 蓝字加粗 + **3px 左边框**（`padding-left:27px` 抵消）

### 改动（1 条规则）
```css
.sidebar #nav li ul li a.open {
  background: #d6ecf9;   /* 比父级 #0993d3 浅的蓝 */
  color: #167cac;
  font-weight: bold;
}
```
去掉白底与左边框，文本缩进回到与其他子项一致的 30px。

### 验证（dev 8100，真实页面计算样式）
- 选中的「调试日志」：`background: rgb(214,236,249)`(#d6ecf9)、`color: #167cac`、bold、`border-left: 0`、`padding-left: 30px`（与未选中子项对齐）；
- 未选中子项：背景透明 + 灰字；父级仍为蓝色渐变 + 白字 ✅；
- **悬浮已选中的子项**：背景仍是 `#d6ecf9`（不闪灰）——`a.open` 与 `a:hover` 特异性相同、`.open` 在源码更后面，按顺序取胜。

### 遗留（未改，待裁定）
- **移动版导航（`#navMobile`，<768px 时显示）的选中项目前没有任何高亮**：JS 里所有高亮选择器写的都是 `#nav li[...]`（桌面那套），移动版拿不到 `open` 类；
  且移动版子项基础样式是 `.sidebar .sidebar-dropdown a`（深灰，与顶级项同款）。要统一的话需再补一套移动版样式 + 把高亮选择器改成两套导航都覆盖。

## 子项⑤ 新增顶级菜单「智能体设置」（2026-09-30 第五里程碑）

用户反馈：`AI接入设置` 与 `提示词管理` 应该都归到「智能体设置」下，**父级与「系统管理」平级**。

### 结构与可见性
- 顶级「智能体设置」→ 子项 `AI接入设置`、`提示词管理`；位置在原「提示词管理」处（使用统计之后、系统管理之前）。
- 英文：`Agent Settings` / `AI Access` / `Prompt Config`。
- **可见性保持不变**（未改任何权限范围）：父级 = `type > 0 && (docSysType > 0 || type == 2)`；
  AI 子项 = `type == 2`（超管，与后端 `getSystemInfo.do` 的 `superAdminAccessCheck` 一致）；
  提示词子项 = `docSysType > 0`（与后端 `/agent/config/system-prompt` 的 `type >= 1` + 原菜单条件一致）。
- 点父级：有「AI接入设置」就进它，否则进「提示词管理」（按**已渲染菜单**判断，不引入用户类型全局量）。

### 实施
- `tmpl/sidebar{,_en}.html`：桌面 `#nav` + 移动 `#navMobile` 各新增「智能体设置」父级块；「提示词管理」从顶级挪入、`AI接入设置` 从「系统管理」子项挪入。
- `main.js`：`case "systemLlm"` 从「系统管理」分组与 `showSystemPage` 移除；新增 `case "agent"/"systemLlm"/"prompt"` 分组（title=智能体设置、父级+子项高亮、展开子菜单）+ `showAgentPage()`。
- `WebRoot/web/lang/en.js`：补 `"智能体设置" : "Agent Settings"` 与 `"提示词管理" : "Prompt Config"`
  （后者是**既有缺口**：英文界面下提示词管理的页头一直显示中文）。

### 验证（dev 8100）
- **模板编译自检**（中/英，三种角色数据）：`{type:2,docSysType:1}` → 父级 2 处（桌面+移动）、子项 4 处；
  `{type:1,docSysType:1}` → 只见「提示词管理」；`{type:2,docSysType:0}` → 只见「AI接入设置」⇒ 与改动前一致。
- 真实页面（admin）：顶级 = 用户管理/用户组管理/仓库管理/日志管理/使用统计/**智能体设置**/系统管理/证书管理/订单管理；
  系统管理子项 12 项（已无 AI接入设置）；智能体设置子项 = AI接入设置/提示词管理（桌面与移动一致）。
- 点父级进「AI接入设置」（pagehead 智能体设置、父级与子项均高亮）；「提示词管理」正常（`#promptSuffix` 在）；「系统管理」不受影响（无 `#llmConfig`）。
- 英文页：顶级含 `Agent Settings`，子项 `AI Access`/`Prompt Config`，页头 `Agent Settings`。
- ⚠️ **踩坑记录 5（自己改出的真 bug，验证时立刻发现）**：`sidebar.html` 桌面段插入的新块漏了 `</li>` 与两个 `{{/if}}`
  → artTemplate 编译出**语法错误** → `$Func.render($("#sidebar"))` 抛异常 → **整个侧边栏空白**（`#nav` 无任何节点，页面上没有任何可见报错）。
  定位方式：浏览器里 `template.compile(模板文本)` 抓真实报错 + 看生成的 JS，一眼看到 `</ul>` 后面直接跟了 `if(type == 2){`。
  教训：**改完 `.html` 模板要立刻做一次「编译自检」**（`template.compile` + 渲染一次），别等页面“什么都不显示”才发现。

## 子项⑥ 带子项的菜单优化（2026-09-30 第六里程碑）

用户反馈：① 父级菜单只能有一个处于展开状态；② 处于展开状态的向右箭头应变为向下箭头。

### 根因（不是「没做」，而是「做错了」）
`showContentPage` 的分组分支里用的是 `$("ul.sublist").show();` —— **把页面上所有子菜单都展开**（系统管理 + 智能体设置，加移动版共 4 个），
所以看起来“两个父级同时展开”。箭头则一直是模板里写死的 `icon-chevron-right`，没有任何地方改过
（`font-awesome.css` 里 `icon-chevron-down`（`\f078`）是现成的）。

### 实施（`WebRoot/manager/main.js`）
- 新增 `showOnlySublist(parentPath)`：先 `$("ul.sublist").hide()`，再只显示该父级的子菜单（桌面 + 移动两套导航都算），并同步箭头；
- 两个分组分支（系统管理 / 智能体设置）由 `$("ul.sublist").show()` 改为 `showOnlySublist("system"/"agent")`；
- `showContentPage` 开头 `$("ul.sublist").hide()` 后补一次 `updateSublistArrow()`（非分组页时箭头也要回到向右）；
- `li.has_sublist` 的点击处理由“toggle 自己”改为**手风琴**：收起其它父级 + 展开自己 + 同步箭头；
- 新增 `updateSublistArrow()`：遍历 `li.has_sublist`，按自己子菜单的 `display` 在 `icon-chevron-right` / `icon-chevron-down` 之间切换。

### 验证（dev 8100，真实点击 `a.click()`）

| 操作 | 桌面 系统管理 | 桌面 智能体设置 | 移动 系统管理 | 移动 智能体设置 | 实际可见子菜单数 |
|---|---|---|---|---|---|
| 初始（用户管理） | none/右 | none/右 | none/右 | none/右 | 0 |
| 点「系统管理」父级 | **block/下** | none/右 | **block/下** | none/右 | 1 |
| 点「智能体设置」父级 | none/右 | **block/下** | none/右 | **block/下** | 1 |
| 点移动版「系统管理」父级 | **block/下** | none/右 | **block/下** | none/右 | 1 |
| 点「仓库管理」（非分组页） | none/右 | none/右 | none/右 | none/右 | 0 |

- ⚠️ **踩坑记录 6（改完第一版验证时发现）**：`updateSublistArrow()` 最初用 `$li.children("ul.sublist").is(":visible")` 判展开，
  但桌面/移动两套导航只有一套真正可见，另一套的父容器是 `display:none` → 它的子菜单永远算“不可见” → **移动版箭头一直是向右**
  （桌面端测不出来，因为移动版整块是隐藏的）。改为看元素自身的 `css("display") !== "none"` 后两套都正确。
  教训：这种“桌面 + 移动双导航”结构，判定状态要看元素自身样式，不要用 `:visible`。

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
- ✅ **子项⑧（2026-10-01）**：10 个页面 UI 打磨**已实施 + 已 E2E 验证**，已提交 `1ccaa57ee`（【优化】管理后台UI优化）；
  追加的「调试日志 保存/取消 按改动启用」也已实施 + 已验证，**未提交**（基线 `1ccaa57ee`）。

## 下一步

1. **等用户确认后提交本批**（不要自动 commit）——只改了 3 个代码文件：`WebRoot/manager/main.js`、`WebRoot/manager/tmpl/systemDebugLog.html`、`WebRoot/manager/tmpl/systemDebugLog_en.html`（⑧ 追加的按钮门控）。
2. 待用户裁定：移动版导航（`#navMobile`）选中项无高亮 + 子项与顶级项同色，是否一并统一；「下载」按钮 500 是否处理；`updateSystemInfo()` 死代码是否删。
3. 收尾：提交确认后把本卡移入 `DevAgentControl/已完成/`，并同步 `CLAUDE.md` 指针。
4. 可选后续（用户未要求）：其余子页 help-block 文案精简 / 行号 / 轮转历史文件列表 / 关键字服务端搜索。

## 生效约束

- 子项②已获用户裁定并实施完成 → 落地前仍需用户确认提交，**不要自动 commit**。
- **日志路径配置有个坑**：`setSystemInfo.do` 中 `logFile` 传 null = 清空，其余字段 null = 不改——但 **jQuery 把 undefined 序列化成空串（不是 null）**，空串会被当成「改成空」。
  任何调用该接口的地方都必须**按白名单只提交自己负责的字段**（`postSystemInfo()`）。
- **新增子页的标准写法**（照抄现有 6 个）：模板 `tmpl/systemXxx{,_en}.html`（两列参数表 + 操作按钮在表下，按钮 id = `btn{Enable,Save,Cancel}XxxSet`），
  `main.js` 里 `var SYSTEM_XXX_FIELDS = [...]` + `show/enable/cancel/save`（enable/cancel 用 `setSystemPageEditMode("Xxx", SYSTEM_XXX_FIELDS, bool)`，save 用 `postSystemInfo(data, showXxx)`），
  再在 `showContentPage`/`showSystemPage` 各加一个 `case`，最后在 `sidebar{,_en}.html` 的 `#nav` 与 `#navMobile` 各加一项。
- **新增顶级菜单分组的标准写法**：照抄「系统管理」或「智能体设置」——`sidebar{,_en}.html` 里 `#nav` + `#navMobile` 各一个 `<li ... class="has_sublist">` + `<ul class="sublist">`；
  `main.js` 的 `showContentPage` 里给该组的每个 `case` 统一设 title + 父级/子项高亮 + `$("ul.sublist").show()`，再交给一个 `showXxxPage(curPath)` 分发。
- **改完 .html 模板必须做「编译自检」**：浏览器里 `template.compile(模板文本)` + 用样例数据渲染一次。
  模板语法错（如 `{{if}}` 不配平）会让 `$Func.render` 静默抛异常 → 页面就“什么都不显示”，没有任何可见报错。
  同理改完 JS 后可用一条“按钮接线体检”（遍历 `[onclick]` 看函数名是否在 `window` 上）提前发现按钮/函数名不一致。
- **模板会走浏览器缓存**：验证模板改动必须带 cache-buster（`?t=…`）+ `Network.clearBrowserCache`，否则会读到旧模板（本次一度误判为“侧边栏没生效”）。
- 编译：Spring 控制器**必须** `-parameters -g`；`.class` 只进 `WebRoot/WEB-INF/classes`，源码树不得出现 `.class`。
- 改 Java 后必须重启 dev Tomcat（`docsys_restart.bat`；启动 2~10 分钟；重启后 session 失效，需重新登录）。
- E2E 口径：`POST /DocSystem/User/login.do`（`Admin`/`pwd=QWRtaW4=`，pwd 为 base64 明文）；探针产物写 `%TEMP%\docsys_chk\`。
- **不要自动 commit**：改完 + 验证 → 汇报 → 等用户确认。

## 未提交改动（子项⑧ 追加：「保存/取消」门控；基线 `1ccaa57ee`）

- ` M WebRoot/manager/main.js`（新增 `isSystemDebugLogDirty` / `updateSystemDebugLogButtons` / `bindSystemDebugLogDirtyCheck`；save 提交前置灰）
- ` M WebRoot/manager/tmpl/systemDebugLog.html`、` M WebRoot/manager/tmpl/systemDebugLog_en.html`（两按钮默认 `disabled`；复选框去掉 inline `onclick`）
- ` M CLAUDE.md`、` M DevAgentControl/CURRENT_STATE_日志在线查看.md`（本卡）
- 无 Java 改动 → **不需要编译、不需要重启**；静态资源有浏览器缓存，验证/上线后需刷新页面。

- 已提交里程碑：`1ccaa57ee`（⑧ 10 页 UI 打磨：按钮留白/表头上间隙/删提示/数据库表格/Office引擎下拉/调试日志去编辑）、
  `a7012b16f`（子项选中背景高亮 = ⑥补充 + ⑦）、`d01307d8c`（带子项菜单只能一个展开）、
  `b95a0a19c`（新增顶级菜单「智能体设置」）、`11b1a83f9`（5 个参数块拆子页）、`f8727cd03`（调试日志布局）、
  `d6b7eff85`（调试日志从系统设置剥离）、`548b6da49`（在线查看）。

### ⑥补充（已提交 `a7012b16f`）：再点一次父级 = 收起
- `collapseParentMenu(curPath)`：在 `showContentPage` **清空 #container 之前**判断——该父级子菜单已展开则只收起（不动内容区、不切页），
  并保留当前子项高亮（否则内容会被提前清成「载入中...」）。
- 踩坑：① 判断展开状态必须在 `hide()` 之前取，否则永远拿到“收起后”的状态；
  ② 实测点父级时 `li.has_sublist` 处理器**先于** `[data-eb-event]` 执行，所以它在父级带 `data-eb-event` 时必须直接 return，否则会与 showContentPage 互相抢。
- 验证：① 点系统管理 → 展开+进系统设置；② 再点 → 收起（`ul.sublist:visible`=0）且**内容区仍是系统设置**；③ 再点 → 重新展开；
  ④ 进「调试日志」后点父级 → 收起、内容仍是调试日志；⑥ 智能体设置同样行为；⑧ 点非分组页 → 全部收起。

## 子项⑧ 10 个页面 UI 打磨（2026-10-01 第八里程碑）

### 用户裁定（原文要点）

邮件服务 / 短信服务 / 数据库设置 / LDAP设置 / 安全网络设置 / 集群部署设置 / Office编辑器 / 调试日志 / AI接入设置 / 提示词管理 的 UI 优化：

1. 普遍问题：① 最后一行的操作按键前后/上下没有留白（留白大小参考右上角「编辑」按键）；② 第一行（参数/配置值所在行）竖线和顶部留有间隙，应该是个 bug。
2. 邮件服务：顶部提示语去掉；「启用邮件服务」行提示去掉（很啰嗦）；操作按键区的提示性文字去掉（数据存哪里属系统设计层面，管理员不需要知道）。
3. 短信服务：同第 2 条的②③；顶部警告块用户裁定「一并删除」。
4. 数据库设置：建议也采用表格布局（更统一）。
5. Office编辑器：第一个参数名改成「Office引擎」，配置值改成下拉框（默认 / OnlyOffice），**只改前端展示、不改真实逻辑**。
6. 调试日志：去掉「编辑」按键（不需要先点编辑才能改设置）。

### 根因（两个「普遍问题」）

- **① 按钮无留白**：表 `table` 底边与按钮顶边实测间隙 **0px**；参考口径 = `.widget-head` padding `8px 15px`（「编辑」按钮距表头顶 9px、距右侧 15px）。
- **② 表头与顶部有间隙：是我自己引入的**——9 个页面都套了 `<div id="systemXxxForm" style="margin-top: 20px;">`，
  而产品原有同类页（`WebRoot/manager/tmpl/systemUpgrade.html`）是把 `<table>` 直接放 `.widget-content` 下**紧贴表头**。
  像素取证：表头上方有 10~20px 空白带，表格首行又无上边框 → 「参数/配置值」两列之间的竖线看起来从空白带下方才开始。

### 改动

- `WebRoot/manager/static/style/style.css`（1 组规则，覆盖全部 10 页）：
  `.widget .widget-content table ~ button` → 上下 `margin: 10px`；`:first-of-type` → `margin-left: 15px`；`:last-of-type` → `margin-right: 15px`；
  `table ~ .help-block` → `margin: 10px 15px 0px 15px`（表下仍有说明文字的页面不贴边）。
- 18 个模板去掉 `style="margin-top: 20px;"`（9 页 × 中/英），表格紧贴表头（对齐 `systemUpgrade.html`）。
- 邮件/短信（中英 4 个模板）：删顶部 `{{if value.warnings.length > 0}}` 警告块、「启用邮件/短信服务」行的 help-block、按钮区两段 help-block。
  注意：`value.warnings` 仍由 `main.js` 组装，只是不再渲染（未改逻辑）。
- 数据库设置（中英）：`form-horizontal` → 两列「参数/配置值」表格（类型 / 地址 / 用户名 / 密码），5 个操作按钮移到表格下方；
  **id / onclick 全部不变**（`systemDbType/Url/User/Pwd`、`testDatabase/exportDBData/importDBData/resetDatabaseConfirm/deleteDatabaseConfirm`），
  `systemDbSetting` 相关 JS 零改动，保存仍走 `setSystemDBConfig.do`。
- Office编辑器（中英 + `main.js`）：参数名 `Office编辑器` → `Office引擎`；复选框 → `<select id="isOnlyOfficeUsed">`（`0=默认` / `1=OnlyOffice`）；
  `saveSystemOfficeEditorSet` 改 `parseInt($("#isOnlyOfficeUsed").val(),10)==1?1:0`，`cancelSystemOfficeEditorSet` 改 `.val(...)` 回滚；
  删掉复选框时代的空函数 `selectIsOnlyOfficeUsed()`。**提交字段仍是 `isOnlyOfficeUsed`（0/1）→ 存储与后端逻辑不变。**
- 调试日志（中英 + `main.js`）：删表头「编辑」按钮；`#logLevel` / `#outputToFileEn` 去掉 `disabled`（进页即可改）；
  `#logFile` 仍按「输出到指定文件」是否勾选决定可用性（模板用 `{{if value.outputToFileEn != 1}}disabled{{/if}}`，与旧编辑态一致）；
  「保存/取消」常显；删 `enableSystemDebugLogSet()`，`cancelSystemDebugLogSet()` 只回滚 `systemInfo` 快照值、`saveSystemDebugLogSet()` 不再切按钮/不再禁用字段。
  提交字段仍是 `logLevel` + `logFile`（`logFile` 始终提交的语义不变）。
- **调试日志「保存/取消」按改动启用**（用户 2026-10-01 追加要求，“不然用户（看不出）参数是否改变过”）：两个按钮默认 `disabled`，
  只有「表单当前值 ≠ 进页时拉取到的值」才启用（`isSystemDebugLogDirty()` / `updateSystemDebugLogButtons()` / `bindSystemDebugLogDirtyCheck()`），
  值改回原样会自动重新置灰；`showSystemDebugLog` 用 `$Func.render($bean, tmpl, data, cb)` 的**回调**在每次渲染后重新绑定
  （render 会替掉整块 DOM，绑定必须在之后）；复选框的 `onclick="selectOutputToFileEn()"` 改为 JS 绑定（顺序可控）；
  `saveSystemDebugLogSet` 提交前先置灰防重复提交，保存后重新拉取配置 → 又回到置灰。未勾选时 `logFile` 不参与比较（后端会清空它）。

### 验证（dev 8100，admin，2026-10-01）

- **模板编译自检**：10 页 × 中/英 = **20/20 `template.compile` PASS**（先例：`{{if}}` 不配平会让页面静默空白）。
- **几何量测（中文 9 个表格页）**：`表头↔表格 = 0px`、`表格↔首个按钮 = 10px`、首个按钮左缩进 `15px`、表格左缩进 `0px`（证明 15px 是真实留白）→ 9 页全部一致。
- **英文变体**（直接 `$Func.render` 实测真实数据）：
  `systemDbConfig_en` = Parameter/Value + `DB Type|DB URL|Account|Password` + `Test,Export,Import,Reset,Delete`；
  `systemOfficeEditor_en` = `Office Engine` 行 + 下拉 `0:Default,1:OnlyOffice`（val=1）；
  `systemDebugLog_en` = 表头只有 `Save,Cancel`，仅 `logFile` disabled。留白量测同中文。
- **Office 引擎功能**：「编辑 → 改值 → 取消」回滚到 1 ✅；下拉映射 `默认→0` / `OnlyOffice→1` ✅；
  值不变点「保存」→ 弹「更新成功！」且重渲染后仍选中 OnlyOffice、`编辑` 按钮恢复可见 ✅。
- **调试日志功能**：进页即 `#logLevel` / `#outputToFileEn` 可改（页面已无 `#btnEnableSystemDebugLogSet`）✅；
  改值 + 「保存」→ 弹「更新成功！」，保存后字段仍可改、按钮仍为「保存/取消」✅。
- **配置无抖动**：`WebRoot/WEB-INF/classes/docSysConfig.properties` 保存后仍是 **28 个键**、`isOnlyOfficeUsed=1` 不变；
  hash 变化只因文件头被重写成新的 `#Thu Oct 01 21:24:36 CST 2026` 时间戳 → 印证「按页白名单提交」的设计没被破坏。
- 截图存档：`%TEMP%\docsys_chk\system{EmailConfig,SmsConfig,DbConfig,OfficeEditor,DebugLog}.png`（含 `_bottom.png`：表下按钮留白取证）。
- **调试日志「保存/取消」门控**（追加要求，改动后重测）：载入后两按钮 `disabled=true` ✅；级别 info→error 启用 ✅；改回 info 重新置灰 ✅；
  勾选「输出到指定文件」启用（且 `#logFile` 解禁 + 预填默认路径）✅；取消勾选重新置灰 ✅；勾选+改路径启用 ✅；点「取消」回滚并置灰 ✅；
  真实保存往返：改成 warn → 保存 → 弹「更新成功！」+ 服务端 `logLevel=2` + 按钮回到置灰 ✅；再改回 info → 保存 → 服务端 `logLevel=1`（净零，已复原）✅。
  截图：`%TEMP%\docsys_chk\systemDebugLog_gated.png`（载入时按钮灰显）。
