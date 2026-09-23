# Agent 产物链接（写入结果 → 可点击打开）方案与实施记录

建立于 2026-09-23。**一句话**：Agent 写入文件后，在本轮**最终回答**末尾给一个「图标 + 文件名」的链接，
点击按规则打开文件——在 project 页内且文件属于当前仓库 → **当前页**打开（复用 project 页的 openDoc 弹层）；
否则 → **新窗口**打开。

## 0. 用户裁定（2026-09-23）

1. **方案 B**：链接放在**本轮最终回答**里（随回答落库 → 刷新/切会话后仍在），不是只放（易失的）工具卡片
2. **覆盖范围**：`write_office`、`edit_office`、`write_file` 三者纳入；
   `rename_doc` / `move_doc` / `copy_doc` **不纳入**（目录整理场景会刷屏）；目录/备注类不纳入（打开无意义）
3. **图标**：复用「@ 关注对象」那套按后缀映射的文件图标（`focusFileIconName()`）
4. **点击落点**：Agent 在 project 页面打开**且**文件在当前仓库 → 当前页调 DocSys.js 的 open；否则新窗口

## 1. 关键事实（实现前已读代码核实）

| 事项 | 事实 |
|---|---|
| 同页打开入口 | `WebRoot/web/js/DocSys.js:1739 openDoc(doc, showUnknownFile, openInNewPage, preview, shareId, authCode)`；project 页人类双击文件走的是 `openDoc(gDocInfo, false, "openInArtDialog", "open", gShareId)`（`WebRoot/web/project.js:1387/2662`）→ 在**当前页**弹 artDialog 查看/编辑器 |
| 新窗口 URL | 与 `DocSys.js:1717 openDocInNewPage` 同款：`project.html?vid=&doc=<docId>&path=<base64>&name=<base64>`（`project.js:4491/4501` 用 `base64_decode` 读） |
| 文件是否需 docId | 不需要：`buildRequestParamStrForDoc` / `openOffice` 只按 `vid/path/name` 取链；`docId` 仅影响 `edit` 开关（project.js `setGInitDocInfo`） |
| Agent 怎么知道自己从哪打开 | project 页 iframe 带 `ctxVid`（`WebRoot/web/project.html:509`），Agent 页已解析（`index.html:5281 initFocusFromContext`）；projects.html 入口不带 ctx |
| ⚠️ 工具卡片不落库 | `loadSessionMessages` 重建时 `toolCalls: []` → 这就是选"回答落库"而不是"卡片里显示"的原因 |
| 注入漏斗 | `ToolUseLoop.runInternal` 的两条带模型文本出口（正常回答 496 / 预算收尾 529）；其上唯一汇合点是 `MainAgent.loopResponse`（`MainAgent.java:637-651`）→ 文本同时进 SSE `done.fullContent`（`AgentController.java:1434`）与 `saveExchange`（1438-1440） |
| 回灌剥离先例 | `MainAgent.loadSessionHistory`（941-968）按 role 过滤 `reasoning`；本次新增按**内容**剥离 |

## 2. 设计

### 2.1 标记格式（回答末尾单独一行）

```
[[ds-products]]{"items":[{"vid":1,"path":"","name":"a.docx","docId":123,"action":"new"}]}[[/ds-products]]
```

- `action`: `new`（新建）/ `modified`（修改）——回执与 tooltip 用
- 为什么用"标记 + 落库"而不是结构化字段：消息表没有 metadata 列，而项目既有做法就是"持久化文本里带机器标记，前端/服务端反解"（关注对象注入块同理）

### 2.2 数据流

1. **登记**：`ToolUseLoop.executeCall`（唯一工具执行漏斗）成功后，按白名单（`AgentProductLink.isProductTool`）
   取产物——优先用工具放在 `ToolResult.data` 里的（自带 `docId`，三个写工具都带），否则从参数 `vid/path/name` 重建；
   同一文件多次操作**去重**（保留首次位置、末次 action）；一轮最多 20 条
2. **追加**：`runInternal` 的两条文本出口调 `AgentProductLink.appendFooter(...)`（无产物 → 原样返回，绝不产生空标记）。
   ⚠️ 只在**返回值**上追加，**不进 transcript**（回灌模型的消息列表），重试/续接不受影响
3. **落库与推送**：该文本经 `MainAgent.loopResponse` → SSE `done.fullContent` + `saveExchange`（前端渲染链接、刷新后仍在）
4. **回灌剥离**：`MainAgent.loadSessionHistory`（历史）与 `savePendingContinuation`（续接上下文）两处 `strip(...)`
   → 模型看不到机器标记

### 2.3 前端（`WebRoot/web/agent/index.html`）

- 解析：`extractProducts(content)` → `{text, items}`（正则 `[[ds-products]]…[[/ds-products]]`；坏 JSON/旧会话无标记 → 当普通文本）
- 渲染：正文照旧走 `renderContent`，随后 `renderProductLinks(items)` 渲染「本轮产物」+ 每个产物一个 chip
  （`img.fi` 用 `focusFileIconName(name)` + 文件名；`title` 给"已新建/已修改：xxx（点击打开）"）
- 路由：`openProduct(item)` → `openProductInParent(item)`：
  `window.parent !== window && typeof parent.openDoc === 'function' && parent.gReposInfo.id == item.vid`
  → `parent.openDoc({vid,docId,path,name,type:1}, false, "openInArtDialog", "open", parent.gShareId)`；
  否则 `window.open('/DocSystem/web/project.html?vid=…&doc=…&path=<b64>&name=<b64>')`（跨域/异常一律回落新窗口）
- 交互：点击用**委托**绑定在 `#messagesList`（重渲染后仍有效）；为 new-window URL 引入 `/DocSystem/web/js/base64.js`
  （与 `openDocInNewPage` 同一套编码）

## 3. 改动清单

| 文件 | 改动 |
|---|---|
| `src/com/DocSystem/agent/tool/AgentProductLink.java`（新） | 白名单 `PRODUCT_TOOLS`、`Product`、`of/fromArgs/fromResult/add/marker/appendFooter/strip/parse/describe` |
| `src/com/DocSystem/agent/orchestrator/ToolUseLoop.java` | 每轮登记产物（`products` 列表，`run` 开始清空）；两个文本出口 `withProductFooter(...)` |
| `src/com/DocSystem/agent/tool/DocSysToolFactory.java` | `write_file`/`write_office`/`edit_office` 三个工具返回 `ToolResult.ok(receipt, AgentProductLink.of(...))`（带 docId） |
| `src/com/DocSystem/agent/orchestrator/MainAgent.java` | `loadSessionHistory` / `savePendingContinuation` 剥离标记 |
| `WebRoot/web/agent/index.html` | `extractProducts` / `renderProductLinks` / `openProduct(InParent)`、CSS、委托点击、引入 `base64.js`、`renderMessages` 渲染链接行 |

**守约**：新增 `agent/tool/TestAgentProductLink`（**89 断言**：覆盖范围矩阵、参数提取与 path 归一化、去重与上限、
标记编解码（中文/引号/坏 JSON/幂等）、剥离语义、回执文案，以及**服务端 + 前端源码 lint**——
只有 3 个工具带产物、rename/move/copy 不得带、循环两个出口必须带 footer、两处回灌必须 strip、
前端必须"同仓库判等 + 回落新窗口 + 委托点击"）；
`TestToolUseLoop` 增 `testProductFooter`（+9：footer 出现在最终回答、解析回读、不进 transcript、rename_doc 不登记、无写入无标记）。
全量：**43 套 / 1836 断言 / 0 失败**（改造前 42 套 / 1738）。

## 4. 验证（浏览器，真 LLM）

| 场景 | 结果 |
|---|---|
| 新建 docx（`write_office`） | 回答末尾出现「本轮产物 📄 link_test.docx」；页面文本**不含** `ds-products` 标记（已剥离） |
| **独立打开**（Agent 是顶层页） | 点击 → `window.open('/DocSystem/web/project.html?vid=1&doc=102238356502&path=&name=bGlua190ZXN0LmRvY3g=')`；未调父页 openDoc |
| **project 页内嵌 + 同仓库** | 点击 → `parent.openDoc({vid:1,docId:102238356502,path:'',name:'link_test.docx',type:1}, …, "openInArtDialog","open")`；**未** window.open；实测 project 页内弹出 **ONLYOFFICE 编辑器**并正确显示正文「链接测试」（截图留档 `%TEMP%\docsys_chk\prodlink_inpage3.png`） |
| **project 页内嵌 + 跨仓库** | vid=5 的产物 chip → `window.open('…project.html?vid=5&doc=103732492435&path=&name=Y3Jvc3NfcmVwby5tZA==')`；**未**调父页 openDoc |
| **刷新/换页持久** | 在另一个页面打开 Agent（project 页 iframe）时，历史消息里直接显示上一会话的 chip → 证明随回答落库 |
| `write_file` 产物 | `cross_repo.md` 也生成 chip（图标为 markdown 图标） |
| 非白名单 | rename/move/copy 不登记（护栏断言锁定；本轮未在浏览器复现） |

E2E 痕迹已清理（vid=1 的 `link_test.docx`、vid=5 的 `cross_repo.md` 均已删除并核对磁盘无残留；
被拒的 `note_link.md` 未产生）。

## 5. 坑

1. **护栏改了 main 类必须重编译进 `WebRoot/WEB-INF/classes`**，否则 `run_guards.ps1` 跑旧类（本轮再次踩到：
   手跑 87 绿、脚本编译前先报错）。
2. `TestToolUseLoop` 原本只有 2 参 `check` → 新断言要用 detail 必须先补 3 参重载（同类坑在 R3-12 记过）。
3. `strip()` 语义要明确：**无标记时不得改动原文（含空白）**；有标记时收掉标记留下的行尾空行
   （第一版实现"非空就原样返回未 trim"，导致 `已写入。` 后残留 `\n`，被护栏抓到）。
4. dev Tomcat **重启期间**打开页面会拿到 404（`.do` 无映射）：静态页 200 ≠ Spring 就绪；
   且新开的浏览器页可能没有会话（cookie 为空）→ 需在本页 `POST /User/login.do` 后再用。
5. Playwright 里 `window.open` 会被拦截（弹窗策略）→ 验证"新窗口"要**打桩记录 URL**，别等 popup 事件。
6. 验证"同页打开"时不要用 `#ArtDialog<docId>` 取弹层内容——那个 id 在**标题栏**上，正文在
   `div[aria-describedby='content:ArtDialog<docId>']` 里（第一版误判成"空弹层"）。另外该弹层会**遮挡**
   Agent 的确认弹窗 → 测完先 `artDialog.list[...].close()`。

## 6. 不在本期范围

- 工具卡片里也显示链接（卡片本就不落库，刷新即失；用户选的是回答里给链接）
- `rename_doc` / `move_doc` / `copy_doc` 的产物（用户明确不要）
- 链接直接给 Office 预览的深链（现在是"打开文件"，具体查看方式由 project 页既有 openDoc 决定）
- 分享链接形态（`create_doc_share` 已有独立工具）
