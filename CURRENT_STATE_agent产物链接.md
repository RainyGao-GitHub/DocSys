# CURRENT_STATE — Agent 产物链接（工作卡）

建立于 2026-09-23。**当前任务：Agent 写入产物在最终回答里给可点击链接（图标 + 文件名），点击打开文件。**

- 前卡 `CURRENT_STATE_agentOffice读写选型.md`：P1 读 ✅、P2 新建 ✅、P2 修改 ✅，**已收尾**（保留供查询）
- 本卡是**当前任务**的唯一口径处：必读上下文 / 当前进展 / 生效约束（含是否先提交）

## 用户裁定（2026-09-23）

1. **方案 B**：链接放在**本轮最终回答**里（跟随回答落库 → 刷新/切会话后仍在），不是只放（易失的）工具卡片
2. **覆盖范围**：`write_office`、`edit_office`、`write_file` 三个工具纳入；
   `rename_doc` / `move_doc` / `copy_doc` **不纳入**（目录整理场景数量太多，会刷屏）
3. **图标**：复用「@ 关注对象」那套按后缀映射的文件图标（`focusFileIconName()`）
4. 点击落点（用户原话）：Agent 在 project 页面打开**且**文件在当前仓库 → 在**当前页面**调用 DocSys.js 的 open；
   否则（不在 project 页 / 文件不属于当前仓库）→ **新窗口**打开

## 已查清的事实（实现依据，均已读代码核实）

- **同页打开**：`WebRoot/web/js/DocSys.js:1739 openDoc(doc, showUnknownFile, openInNewPage, preview, shareId, authCode)`；
  project 页人类双击文件走的就是 `openDoc(gDocInfo, false, "openInArtDialog", "open", gShareId)`（`WebRoot/web/project.js:1387/2662`）
  → Agent 页只要 `window.parent.openDoc({vid,docId,path,name,type:1}, false, "openInArtDialog", "open", parent.gShareId)`
- **新窗口**：与 `DocSys.js:1717 openDocInNewPage` 同款 URL ——
  `project.html?vid=<vid>&doc=<docId>&path=<base64(path)>&name=<base64(name)>`（project.js:4491/4501 用 `base64_decode` 读）
- **Agent 怎么知道自己从哪打开**：project 页 iframe URL 带 `ctxVid`（`WebRoot/web/project.html:509`），
  Agent 页已解析（`WebRoot/web/agent/index.html:5281 initFocusFromContext`）；projects.html 的入口不带 ctx
- **判定**：`window.parent !== window && typeof parent.openDoc === 'function' && parent.gReposInfo.id == 目标 vid`
  → 当前页；否则新窗口（跨域/异常一律回落新窗口）
- **Agent 页没有 base64 工具**（只引了 marked/mermaid）→ 需加 `<script src="/DocSystem/web/js/base64.js">`
- ⚠️ **工具卡片不落库**：`loadSessionMessages` 重建时 `toolCalls: []` → 这正是选方案 B 的原因
- **落点（注入漏斗）**：`MainAgent.loopResponse`（`MainAgent.java:637-651`）是 streaming/非流式**唯一**的
  `AgentResponse.ok(answer)` 漏斗；其文本同时进 SSE `done.fullContent`（`AgentController.java:1434`）
  与 `saveExchange`（`1438-1440`）→ 在这里追加 footer，两处自动都有
- **累计点**：`ToolUseLoop.executeCall`（`ToolUseLoop.java:611-612` 执行工具）是唯一漏斗；
  `runInternal`（382-539）有两条带模型文本的出口：496（`success`）与 529（budget `partial`）
- **回灌剥离先例**：`MainAgent.loadSessionHistory`（`MainAgent.java:941-968`，953-956 按 role 过滤 reasoning）
  → footer 按**内容**剥离（尚无先例，本次新增）

## 当前进展

1. ✅ 方案与实施记录已成文：`devDocs/Agent产物链接方案.md`（事实依据 / 设计 / 改动清单 / 验证 / 坑）
2. ✅ 服务端实施：
   - 新增 `agent/tool/AgentProductLink`（白名单 + Product + marker/appendFooter/strip/parse/describe）
   - `ToolUseLoop` 每轮登记产物（`products`，`run` 时 clear）+ 两个文本出口 `withProductFooter(...)`
   - `write_file`/`write_office`/`edit_office` 返回 `ToolResult.ok(receipt, AgentProductLink.of(...))`（带 docId）
   - `MainAgent` 两处回灌剥离（`loadSessionHistory` / `savePendingContinuation`）
3. ✅ 前端实施（`WebRoot/web/agent/index.html`）：`extractProducts`/`renderProductLinks`/`openProduct(InParent)` + CSS
   + 引入 `/DocSystem/web/js/base64.js` + 委托点击 + `renderMessages` 渲染「本轮产物」行
4. ✅ 守约：新增 `TestAgentProductLink`（89）+ `TestToolUseLoop.testProductFooter`（+9）
   → **全量 43 套 / 1836 断言 / 0 失败**（改造前 42 套 / 1738）
5. ✅ **浏览器 E2E（真 LLM）全部通过**：
   - 新建 Office → 回答末尾「本轮产物 📄 link_test.docx」，正文无标记残留
   - 独立打开（顶层页）→ 点击进新窗口：`project.html?vid=1&doc=…&path=&name=<base64>`（打桩核实，Playwright 拦弹窗）
   - **project 页内嵌 + 同仓库** → 点击调 `parent.openDoc(…, "openInArtDialog", "open")`，**未** window.open；
     实测 project 页内弹出 ONLYOFFICE 编辑器并显示正文「链接测试」（截图 `%TEMP%\docsys_chk\prodlink_inpage3.png`）
   - **project 页内嵌 + 跨仓库（vid=5）** → 点击走新窗口 `project.html?vid=5&doc=…`，**未**调父页 openDoc
   - 刷新/换页后链接仍在（history 里持久化）；`write_file` 产物同样有链接（markdown 图标）
   - E2E 痕迹已清理（vid=1 link_test.docx / vid=5 cross_repo.md 已删并核对磁盘无残留）

## 下一步

- 待用户验收后收尾本卡（如需调整：是否需要 rename/move/copy 也纳入、是否要卡片内也显示链接）
- 可选后续：把该链接机制推广到“分享链接”形态（现在已有 `create_doc_share` 工具，不重复）

## 必读上下文（续接锚点）

1. 方案与实施记录：`devDocs/Agent产物链接方案.md`（事实依据 / 设计 / 改动清单 / 浏览器 E2E / 坑）
2. 代码锚点：
   - `src/com/DocSystem/agent/tool/AgentProductLink.java`（白名单 `PRODUCT_TOOLS` / 标记常量 / `strip` 语义）
   - `src/com/DocSystem/agent/orchestrator/ToolUseLoop.java`：`executeCall` 登记 + `withProductFooter` 两个出口
   - `src/com/DocSystem/agent/orchestrator/MainAgent.java`：`loadSessionHistory` / `savePendingContinuation` 两处剥离
   - `src/com/DocSystem/agent/tool/DocSysToolFactory.java`：三个写工具 `ToolResult.ok(receipt, AgentProductLink.of(...))`
   - `WebRoot/web/agent/index.html`：`extractProducts`(~L3294) / `renderProductLinks` / `openProduct` / `openProductInParent`；`renderMessages` 里的链接行；`#messagesList` 委托点击
   - 共用口径：`WebRoot/web/js/DocSys.js` 的 `openDoc`(1739) 与 `openDocInNewPage`(1717)；`WebRoot/web/project.html` 的 ctxVid(509)
3. 守约：`agent/tool/TestAgentProductLink.java`（89）、`agent/orchestrator/TestToolUseLoop.java`（`testProductFooter`）
4. 既有约定/记忆：`/memories/repo/dev-tomcat.md`（重启 / `.do` 302 就绪判据）、`/memories/repo/agent-tools.md`（前端内联 JS 改完必须整体语法校验：`node %TEMP%\check_html_js.js <html>`）

## 生效约束

- 编译：`.class` 一律进 `WebRoot/WEB-INF/classes`；Spring 控制器必须 `-parameters -g`
  （`%TEMP%\docsys_chk\do_compile.ps1 -Spring`）；改了 main 类必须重编译再跑护栏/重启
- 重启 dev Tomcat（`docsys_restart.bat`，启动可能 150s+；静态页 200 ≠ Spring 就绪，探 `.do` 认 302）
- E2E 脚本 ASCII-only（PS 5.1 按 ANSI 解无 BOM 的 .ps1）；中文请求体交 Java 生成器写 UTF-8 无 BOM
- 浏览器 E2E 必须同时覆盖：① 独立打开（新窗口路径）② project 页内嵌（当前页路径）③ 刷新后链接仍在
- 提交归属：本任务全在主仓库 `D:/Dev/DocSys`（前端 `WebRoot/web/agent/index.html` 也在主仓库）

## 未提交改动

- 主仓库待提交：
  - 新增：`src/com/DocSystem/agent/tool/AgentProductLink.java`、`src/com/DocSystem/agent/tool/TestAgentProductLink.java`、`devDocs/Agent产物链接方案.md`
  - 修改：`ToolUseLoop.java`、`MainAgent.java`、`DocSysToolFactory.java`、`TestToolUseLoop.java`、
    `WebRoot/web/agent/index.html`、`CLAUDE.md`、本工作卡
