# CURRENT_STATE_前端静态资源缓存（挂起卡）

> 状态：**已调研，用户裁定「暂不处理」**（2026-10-06）
> 起因：服务器端 JS/CSS/模板改动后，用户必须清空浏览器缓存才生效，问有无办法免清缓存。

## 实测诊断（2026-10-06，dev 8100）

```
GET /DocSystem/manager/main.js   → 200
  ETag: W/"250164-1791111476572"
  Last-Modified: Sun, 04 Oct 2026 10:57:56 GMT
  （无 Cache-Control，无 Expires）
GET /DocSystem/manager/main.html → 同样只有 ETag + Last-Modified
```

- **根因**：静态资源响应**没有 `Cache-Control`** → 浏览器走**启发式缓存**（按 `Last-Modified` 推算新鲜期，不回源验证）→ 改了服务端文件浏览器也不知道。
- 引用处**没有任何版本号**：`manager/main.html:258-292` 全是 `./static/js/xxx.js`、`:419` 是 `main.js`，无 `?v=`。
- 模板额外有一层**页面内存缓存**：`manager/static/js/tmpl.js` 的 `$Func.loadModule` 把编译结果存 `$Modules`（`$.get(path + module + ".html")`）→ 模板改动需**整页刷新**，光靠 HTTP 缓存策略也解决不了这一层。
- 现有代码几乎不设缓存头：仅 `ReposController.java:209`（单个接口）与 `AgentController`（API 响应）设过 `Cache-Control`；`web.xml` 只注册了 Spring 的 `encodingFilter`。

## 候选方案（已评估，未实施）

| 方案 | 做法 | 优点 | 代价 |
| --- | --- | --- | --- |
| **A（曾推荐）** | 新增 Filter，对 `.js`/`.css`/`.html` 响应加 `Cache-Control: no-cache, must-revalidate`（含 `main.html` 入口页）；web.xml 按后缀映射注册 | 文件没变 → 304（无 body）；变了 → 拉新。**改完 F5 即生效，无需清缓存**；一次改动覆盖全部静态资源、后续零维护 | 首屏每个静态文件**多一次条件请求**（~40 个文件）→ 用户判定影响性能，接受不了 |
| B | URL 版本号 cache busting（`?v=<WebRoot/version>`），入口页后端注入 + 改 `tmpl.js` 拼版本 | 命中缓存时零请求 | 要改多处引用；`main.html` 自身仍需 no-cache |
| C | `$.ajaxSetup({cache:false})` | 一行 | 只治 ajax（模板/接口），管不了 `<script src>` |
| — | Tomcat `<Resources cachingAllowed="false"/>` | — | 是**服务端**缓存，与浏览器缓存无关，不解决问题 |
| — | Tomcat `ExpiresFilter`（web.xml 配 `ExpiresByType`） | 零 Java 代码 | 按 MIME 设 max-age，表达力不如自写 filter |

## 决定与原因

- **决定：暂不处理**（2026-10-06）。
- **原因**：方案 A 会让每个静态资源多一次 304 条件请求，用户认为对性能有影响（尤其首屏文件数多）。
- **现状维持**：开发/验证时仍按老办法绕过浏览器缓存（硬刷新、或 CDP `Network.setCacheDisabled`、或 `fetch(url, {cache:'no-store'})` 先确认服务端是新版）。
- **若将来重启此议题**，先想清楚：① 是否愿意接受「多一次 304」换「免清缓存」；② 还是走 B（版本号）但要接受改多处引用；③ 是否上了 CDN/nginx（届时用 hash 文件名 + 长缓存才是正解）。
