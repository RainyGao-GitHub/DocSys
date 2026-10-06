# CURRENT_STATE_日志导出（工作卡）

> 状态：**已实施，E2E 验证进行中**（2026-10-06）
> 方案文档：`devDocs/日志导出方案.md`（§5 裁定 / §6 实施记录）
> 前卡：`DevAgentControl/已完成/CURRENT_STATE_LDAP设置.md`（已收尾归档）

## 任务

「管理后台 → 日志管理」增加**日志导出**：把当前筛选条件（时间范围 + 关键字）下的**全量操作日志**导出成 CSV。

## 用户裁定（2026-10-06）

1. **D1 落地方式**：B **服务端流式 CSV**
2. **D2 格式**：先只做 CSV（UTF-8 + BOM）
3. **D3 范围**：当前筛选条件的**全量**（不是当前页）
4. **D4 字段**：**全部字段**（17 列，含 id）
5. **D5 列头语言**：跟随界面语言（前端传 `lang=ch/en`）
6. **D6 行序**：时间倒序（最新在前）
7. **D7 超上限（10 万）**：**直接报错**让用户缩小范围
8. **D8 空结果**：报「没有可导出的日志！」
9. **D9** 导出**不记**系统日志
10. **D10** 顺带处理调试日志的下载（修掉已知「下载 500」）

## 现状关键结论（调研）

- 「日志管理」= **操作日志**，存 **Lucene 按月索引**：`<SystemLogStorePath>/SystemLog-<年>-<月>/`（`Date.getYear()/getMonth()` 的旧语义：dev 里是 `SystemLog-126-9` = 2026-10）
- `SystemLogStorePath` 是 **per-node ini 键**（默认 `C:/DocSysLog/SystemLog/`）⇒ **导出的是本机日志**
- `BaseFunction.querySystemLogsByTimeRange(startTime, endTime)`：逐月开索引 → `NumericRangeQuery("time")` → `TopDocs(500000)` → **全量载入内存**
- `Manage/getSystemLogList.do` **每次请求都重新全量查询**再内存过滤/分页（`pageSize` 无上限，页面每页 15）
- `SystemLog` 17 字段：`id/time/ip/userId/userName/event/subEvent/action/result/reposName/path/name/newPath/newName/content/queryId/commitInfo`

## 实施清单

**后端**（`src/com/DocSystem/controller/ManageController.java`，已编译进 `WebRoot/WEB-INF/classes`）

- 新增 `POST /Manage/exportSystemLogList.do`（`startTime`/`endTime`/`searchWord`/`lang`/`authCode`）
  - 权限同 `getSystemLogList.do`；空结果与超上限都返回 **JSON 错误**（前端按 Content-Type 区分）
  - `LOG_EXPORT_MAX_ROWS = 100000`；超限报「结果共 N 条，超过导出上限 100000 条，请缩小时间范围或增加搜索条件！」
  - **流式写 CSV**：`text/csv;charset=UTF-8` + `Content-Disposition: attachment; filename="SystemLog_<起>-<止>.csv"` + `Cache-Control: no-cache`；首字节 `\uFEFF`(BOM)；每 1000 行 flush
  - 列头中/英常量按 `lang` 选；`csvField()` 做 CSV 转义；行序 `time` 倒序（null 当 0）
  - **不写系统日志**（D9）
- 抽出 `filterSystemLogsBySearchWord(list, searchWord)`，**列表与导出共用**（口径不漂移）
- **D10 调试日志下载**：
  - 根因：原 `downloadLogFile.do` 返回 `/DocSystem/Doc/downloadDoc.do?...`（日志不在仓库里 → 缺上下文 → 下载失败 = 「下载 500」）
  - `downloadLogFile.do` 改为返回 `/DocSystem/Manage/streamLogFile.do?key=<urlencoded>`
  - 新增 `streamLogFile.do`：session+管理员校验 → `resolveLogFile(key)`（白名单）→ `text/plain` + `attachment` + `Content-Length`(<2GB) → 8KB 缓冲回写
  - 新增 `docSysErrorLog(String, HttpServletResponse)`（文件流接口不能回 JSON 文件）

**前端**（无需编译）

- `tmpl/systemLog{,_en}.html`：搜索旁加「导出 / Export」按钮（`#btnExportSystemLog`）
- `main.js`：`exportSystemLog()`（`fetch` + **正向判断 `text/csv`**（非 CSV 一律错误分支）+ `downloadBlobAsFile()`；导出中按钮置灰；文件名取 `Content-Disposition`）
  - 请求头加 `X-Requested-With: XMLHttpRequest`（原因见「验证 / 坑 1」）；错误分支兼容 JSON 与 HTML 响应
- 后端补修：`streamLogFile.do` **去掉自身的调试日志写入**（原 `Log.infoHead` 会落进正在下载的那份日志里）
- `web/lang/en.js`：补「正在导出，请稍等...」
- `logViewer.js` / `main.js` 的下载调用**无需改动**（契约未变）

## 验证

### 结果（2026-10-06，dev 8100 实测：接口脚本直调 + 页面 E2E）

- 导出正确性：行数 330 == 列表 `dataEx` 330 ✅；`Content-Type: text/csv;charset=UTF-8` ✅；`Content-Disposition: attachment; filename="SystemLog_20260929142332-20261006142332.csv"` ✅
- BOM：首 3 字节 `239,187,191`（EF BB BF）✅（`res.text()` 会吃掉 BOM，必须用 `arrayBuffer()` 验）
- 列头：中文 17 列 ✅；`lang=en` 英文 17 列（Time,User,User ID,IP,Event,Sub Event,Action,Result,Repository,Path,Name,New Path,New Name,Content,Query ID,Commit Info,ID）✅
- 行序：`time` 倒序 2026-10-06 → 2026-09-29 ✅；样例行 `2026-10-06 14:23:32,Admin,1,127.0.0.1,login,login,登录,成功,,,,,,,,,Admin-login-login-1791267812014` ✅
- 关键字过滤：导出 67 行 == 列表 `dataEx` 67，且每行都含 `login` ✅（列表/导出同口径）
- CSV 转义：30 天窗口 1641 行，按 RFC 解析后**每行恰好 17 字段**（0 行异常），其中 **1088 个字段含逗号**被正确包裹/还原 ✅
- 空结果：`{"msgInfo":"没有可导出的日志！","status":"fail"}` ✅
- 页面 E2E（日志管理页，硬刷新）：点「导出」→ Blob `text/csv` / 66073 字节 / 名 `SystemLog_20260930000000-20261006235959.csv` / 首行中文列头 / 324 行 / `revokeObjectURL` 已调 / toast「导出成功」✅
- 页面错误分支：窗口改到 2020 年 → toast「导出失败 : 没有可导出的日志！」，**无 Blob、无下载** ✅
- 未登录分支（重启 Tomcat 使 session 全部失效，在同一页面上点导出）：toast「导出失败 : 用户未登录，请先登录！」，**无 Blob、无下载**，按钮随后恢复可用 ✅
- 英文页（`main_en.html`）：`langExt=_en`、按钮 `Export`、toast「Exporting, please wait...」→「Exported」、Blob `text/csv` 66445 字节 / 327 行 / **英文列头** ✅
- 重启后仍生效 ✅（重启后重跑英文页导出 + D10）
- **D10**：`downloadLogFile.do?key=debug` → `data=/DocSystem/Manage/streamLogFile.do?key=debug` ✅；`Content-Type: text/plain;charset=UTF-8` + `Content-Disposition: attachment; filename="docsys.log"` ✅；**严格字节比对**（先磁盘快照再立即下载）：长度 6393943 == 6393943、SHA-256 `f1b4488f…f019f9` == `f1b4488f…f019f9` ✅，且下载尾部不再出现自身标记行 ✅

### 验证中发现并已修的两处

1. **`MyInterceptor` 地址白名单是包含匹配**（`spring-mvc.xml:70-77`，`path="/**"`）：白名单含 `Manage/getSystemLog` 故列表接口匿名能拿 JSON；`exportSystemLogList.do` 不在白名单 + `fetch` 不带 `X-Requested-With` → 未登录时 302 到 `tologin.do?option=reload`（无该映射）→ **404 HTML**。已让 fetch 带 `X-Requested-With`（jQuery 本来就会带），不改白名单。
2. **`streamLogFile.do` 原本 `Log.infoHead(...)` 写进自己下载的日志**（下载内容多一行标记）。已按 `getLogContent.do` 约定去掉该接口所有调试日志写入；修前/修后可对比：修前下载尾部含新增的 `streamLogFile.do` 标记行。

### 已知无法在本机验证

- **超上限（>10 万条）分支**：dev 日志量不足，只能静态确认逻辑（`filteredList.size() > LOG_EXPORT_MAX_ROWS`）

## 生效约束

- **未提交**（用户确认后才提交；改动全在主仓库）
- 编译不变量：`.class` 只进 `WebRoot/WEB-INF/classes`；Java 改动必须先编译再重启
- 测试产物只落 `%TEMP%\docsys_chk\`

## 遗留 / 待裁定

- 服务端返回的错误文案是中文（英文页也会是中文）：彻底 i18n 需「文案码 + 参数」（同短信 `warnings`）
- 集群下导出的只是**本机**日志（`SystemLogStorePath` 是 per-node），跨节点导出未做
- 静态资源缓存（改 JS 需清浏览器缓存）**用户已裁定暂不处理**：`DevAgentControl/CURRENT_STATE_前端静态资源缓存.md`
