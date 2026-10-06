# CURRENT_STATE_证书订单时间筛选（工作卡）

> 状态：**已实施并验证（待用户确认提交）**（2026-10-06，纯前端改动，无需重启）
> 前卡：`DevAgentControl/已完成/CURRENT_STATE_导出用户修复.md`（已收尾）

## 任务 / 起因

用户反馈「证书管理 和 订单管理 好像超过 3 年的数据显示不了」→ 调研确认后裁定 **方案 A：给这两个页面加时间范围筛选**。

## 现状关键结论（调研，2026-10-06）

| 页面 | 接口 → 查询实现 | **默认时间窗口** | 索引位置 |
| --- | --- | --- | --- |
| 证书管理 | `POST /Sales/getLicenseList.do` → `SalesBase.getLicenseListOnPage:451` | **最近 36 个月** = `36*CONST_MONTH` = 36×30 = **1080 天**（≈2.96 年） | `<SalesDataStorePath>/License/licensesIndex/` |
| 订单管理 | `POST /pay/getOrderList.do` → `SalesBase.getOrderListOnPage:1765` | **最近 12 个月** = **360 天** | `<SalesDataStorePath>/OderInfo/` |

- `CONST_MONTH = 30*CONST_DAY`（`BaseFunction:128`）→ 按 30 天/月，**不是自然月**
- 前端 `showLicenseList()` / `showOrderList()` **只传 `searchWord/pageIndex/pageSize`，从不传时间** → 永远落进默认窗口；两个页面**都没有时间筛选控件**（对比：日志管理/使用统计有）
- 代码里的注释**曾经**全部过期，**已于 2026-10-06 修正**（见下「服务端注释修正」）：证书侧原写「最近12个月」实际 36 个月；订单侧原写「最近12个月的**证书**」实际查订单；`getLicenseList` 另一处原写「最近一个月」实际 12 个月
- **数据本身没被删**：证书/订单都是**单一累积 Lucene 索引**（不按月、不分区），销售模块内**没有任何索引清理/过期删除代码** → 3 年前的记录仍在索引里，只是被时间范围过滤掉
- 接口**一直接受 `startTime`/`endTime`**（可空；仅当为 `null` 时才用默认窗口）→ **只需要前端传参**
- 反例（另类"看不到"）：`deperacateLicense.do`「作废证书」会把记录从索引里删掉（dev 的 `licensesIndex` 里能看到 `.del`）
- 遗留：`SalesBase.getLicenseList(JSONObject qLicense, String indexLib)`（约 708 行，窗口写死在 `:730` 的 `NumericRangeQuery.newLongRange("createTime", curTime - 12*CONST_MONTH, curTime, …)`）还有一个写死 12 个月窗口的证书查询方法，未找到调用方

## 裁定（用户 2026-10-06）

**A**：照「日志管理」页样式给两个页面加**时间范围筛选**（快捷按钮 + 日期输入 + 搜索）。
- 快捷范围：**近30天 / 近1年 / 近3年 / 全部**
- **默认值保持与服务端原默认一致**（证书=近3年、订单=近1年）→ 页面打开时的表现和以前一致，想看更早的点「全部」即可（不改「A 之外」的默认行为，是刻意选择）
- 服务端默认窗口本次**不动**（要放宽需另裁定）

## 实施

**纯前端（主仓库），无 Java 改动 → 不需要重启，硬刷新即可**

| 文件 | 改动 |
| --- | --- |
| `WebRoot/manager/tmpl/license.html` / `license_en.html` | 工具栏加 4 个快捷按钮（`#license-btn-{last30days,last1year,last3years,all}`）+ 日期输入（`#licenseStartDate/#licenseEndDate`，`onfocus` 清除快捷高亮） |
| `WebRoot/manager/tmpl/order.html` / `order_en.html` | 同上（`#order-btn-*`、`#orderStartDate/#orderEndDate`） |
| `WebRoot/manager/main.js` | ① 新增状态 `licenseStartTime/EndTime/ActiveRange`、`orderStartTime/EndTime/ActiveRange`；② 每个页面 4 个函数：`clearXxxQuickButtons()` / `highlightXxxButton()`（渲染后恢复高亮+日期）/ `initXxxTimeRange()`（页面打开时设默认范围）/ `setXxxTimeRange(range)`（last30days·last1year·last3years·all·custom）；③ 页面切换 `case "license"/"order"` 改为调 `initXxxTimeRange()`；④ `searchLicense()/searchOrder()` 照 `searchSystemLog()` 做三态处理（日期框被改过→按 custom；只填一边→提示「请选择开始和结束日期」且不发请求；「全部」时日期框为空→保持 all）；⑤ `showXxxList()` 请求带 `startTime/endTime`（**范围未初始化时不传**，回落到服务端默认窗口；「全部」传 `startTime=0`）；⑥ `LicenseListDisplay/OrderListDisplay` 渲染回调里调 `highlightXxxButton()` |

细节：`last1year/last3years` 用自然年回退（`new Date(y,m,d)`），`last30days` 用「今天往前 29 天 0 点 ~ 今天 23:59:59.999」；「全部」时日期框**清空**（避免显示 1970-01-01）。

## 服务端注释修正（2026-10-06，用户指示「修正一下注释」）

只改注释、**不改逻辑**（默认窗口仍与服务端原样一致，`36*CONST_MONTH` / `12*CONST_MONTH` 未动）。共修 3 处 + 各补1行语义说明：

| 位置 | 原文（错） | 改为 |
| --- | --- | --- |
| `getLicenseListOnPage:452` | `不指定时间范围则查询最近12个月的证书` | `……最近36个月（36*CONST_MONTH，按 CONST_MONTH=30天 计约3年）的证书` |
| `getLicenseList:727` | `默认查询最近一个月的证书列表` | `默认查询最近12个月（12*CONST_MONTH，按 CONST_MONTH=30天 计约1年）的证书列表` |
| `getOrderListOnPage:1767` | `不指定时间范围则查询最近12个月的证书` | `……最近12个月（12*CONST_MONTH，按 CONST_MONTH=30天 计约1年）的订单` |

另在 `getLicenseListOnPage` / `getOrderListOnPage` 各补一行：`startTime=0 表示不限制起始时间（createTime 时间戳恒大于 0），用于「全部」查询`（时间范围是 `buildBooleanQueryForLicense/Order` 里对 `createTime` 的 Long range）。

> ⚠️ **`src/com/DocSystem/sales/` 是另一个独立 git 仓库（`master`）**，主仓库**不跟踪**该路径（`git ls-files` 报 `did not match any file(s)`）→ 这三处注释改动**必须在 sales 仓库单独提交**。

编译：`javac … src/com/DocSystem/sales/SalesBase.java` → **exit=0**（仅存量 deprecation 提示）；源码树 `.class` = 0；**纯注释改动、无需重启**。

其他：`PayController:112 getOrderList.do` / `SalesController:943 getLicenseList.do` 本身没有过期注释（只有 `///getLicenseList` 标记），无需改。

## 验证结果（dev 8100 真实页面）

| 用例 | 结果 |
| --- | --- |
| 证书页默认 | 「近3年」高亮，日期 `2023-10-06 ~ 2026-10-06` ✅ |
| 近30天 / 近1年 / 近3年 请求参数 | `startTime` = 对应天数起点、`endTime` = 今天 23:59:59.999 ✅ |
| **全部** | 请求 `startTime=0`、日期框清空 ✅ |
| **筛选真的过滤**（dev 有 1 条 2026-06-23 的证书） | 近30天 = **0 行**、近1年 = **1 行**、全部 = **1 行** ✅ |
| 自定义日期 `2026-06-01 ~ 2026-06-30` → 搜索 | 发出的时间戳与预期完全一致（`1780243200000 / 1782835199000`）✅ |
| 只填开始日期 → 搜索 | toast「请选择开始和结束日期」且**不发请求** ✅ |
| 订单页 | 4 个按钮、「近1年」默认高亮、日期 `2025-10-06 ~ 2026-10-06`、请求带参 ✅；「全部」→ `startTime=0` ✅ |
| 英文页 | `Last 30 Days / Last Year / Last 3 Years / All`，默认高亮正确 ✅ |

（未验证项：分页翻页是否保持当前范围 —— 代码上分页回调仍调 `showXxxList()` 读同一组全局变量 ✅，dev 数据不足 2 页无法实测）

## 未提交改动（等用户确认）

主仓库：`WebRoot/manager/main.js`、`WebRoot/manager/tmpl/license.html`、`license_en.html`、`order.html`、`order_en.html`、本卡、`CLAUDE.md`

**sales 独立仓库**：`SalesBase.java`（仅 3 处注释 + 2 行说明）
