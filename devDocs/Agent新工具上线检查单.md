# Agent 新工具 / 新接口上线检查单（可复用）

> 建立于 2026-09-21（计划条目 R3-6）。**用途**：给 Agent 新增或改动一个工具（或它依赖的 `.do` 接口）时，
> 按 0 → 3 逐项走一遍；每项都要留下可核对的结果（命令输出 / 探针数字 / 页面截图描述）。
> 关联：`devDocs/Agent工具与接口可靠性计划.md`（待办总清单）、`CURRENT_STATE_agent技能与工具清理.md`（工作卡）、
> `devDocs/tool-inventory.md`（工具↔端点↔client 方法对照表）、`/memories/repo/agent-tools.md`（踩坑记忆）。

## 用法（两条命令 + 一个人工核对）

```powershell
# ① 机械项一次性自检（端点存在性 / schema 结构 / 描述质量 / 本检查单本身）
$jre='C:\TomcatForDocSysDev\docsys\tomcat\java\jre\bin\java.exe'
& $jre -cp 'WebRoot\WEB-INF\classes;WebRoot\WEB-INF\lib\*' com.DocSystem.agent.tool.TestToolOnboarding

# ② 全量护栏回归（基线 34 套 / 1291 项 0 失败 → 见计划文档 §3）
Get-ChildItem -Path 'src\com\DocSystem\agent' -Recurse -Filter 'Test*.java' | ForEach-Object { ... }
```

> ⚠️ **改了源码/测试类必须重新编译**，否则护栏跑的是旧 class（"假绿"）。判断办法：**断言总数必须按预期变化**
> （先例：R3-10 时 `TestSearchCrossRepo` 少编译了一次，断言数停在 44 却全绿）。

---

## 0. 设计期（写代码前先定，避免返工）

| # | 检查项 | 为什么（先例） |
|---|---|---|
| 0.1 | **能力归属**：DocSys 自有能力做成**工具**；只有"外部可执行/可进化插件"才做成**技能** | R3-11：help 技能族整族过期/编造（教模型跑不存在的 `docsys` CLI、指向不存在的端点），整族删除。技能没有 schema 约束，容易悄悄烂掉 |
| 0.2 | **定位口径一律 path/name**：`path` = 所在目录相对路径、**以 `/` 结尾**、根目录 = 空串；`name` = 自身名。**schema 不得出现 `docId` / `pid` / `dstPid`** | R1-6（用户裁定）：docId 是 `Path.buildDocIdByName(level, path+name)` 的**派生 hash**、不是主键，随移动/重命名失效；`buildBasicDoc` 在 path+name 全空时会把文档**塌缩成仓库根**（曾导致"删根"风险）。服务端 docId-only 调用现在必须回 `INVALID_PARAM`，不许静默成功 |
| 0.3 | **"不知道在哪个仓库"**：先用 `search_files`（`vid` 可省 = 跨全部可访问仓库，含不依赖索引的直查）拿到 `vid`，再**把 vid 显式传给**后续工具 | R3-10：模型曾为找 `66666/` 连调 6 次 `list_docs`；跨仓搜索 1 次即可（93ms vs 366ms）。但**增/删/改/查/读文件一律必须明确 vid**（否则会操作到错误对象） |
| 0.4 | **读写分类与确认门**：写工具必须 `isWrite(true) + needsConfirm(true)`；描述里提醒"先与用户确认"（分享/删除这类对外或破坏性动作尤其） | R3-2 批 2a：确认门曾因"工具名不在白名单"被静默绕过；R3-9：弹窗必须显示参数，用户不能盲批 |
| 0.5 | **输出体量先估上限**：列表类/长文本类一律**紧凑渲染 + `offset`/`limit` 分页**，单页预算 ≤ 3600 字符（全局上限 4000），**禁止裸 `fmt()` 倒原始 JSON** | R1-5/R2-1/R2-3：`list_repos` 原始 JSON 7716 字符被截成半截（18 个仓库只看得到 9 个）；`grep_files` 曾单条 272035 字符。R2-4：命中数写"共 N 条"会被模型当总数 → 必须区分"全部命中 / 已达 maxResults 上限" |
| 0.6 | **失败要可归因**：服务端失败出口带 `ErrorCode`；工具层给**处置提示**（"不要重试同一调用"/"改用 X 确认对象是否存在"） | R1-1/1b/1c：曾靠文案嗅探判"可重试"，文案一改即失效，且锁冲突/无权限/不存在分不开。R3-14：4xx 被误报成"服务端内部错误"会把模型引向错误方向 |
| 0.7 | **名字/参数命名**：参数名与既有工具体系一致（仓库 ID 统一 `vid`，不是 `reposId`）；一个概念只用一个名字 | R3-1：`update_repos` 的孤例 `reposId` 会让模型偶尔用错；只删不留"兼容别名"（唯一调用方是 LLM，每轮重新读 schema） |

---

## 1. 实现期自检（写完立刻做）

| # | 检查项 | 怎么查 |
|---|---|---|
| 1.1 | **端点存在性**（R1-2 类 bug 的自动拦截） | `TestToolOnboarding` 自动比对：`DocSysClient` 里每个 `"/Xxx/yyy.do"` 必须能在控制器里找到（**类级 `@RequestMapping` 前缀 + 方法级 mapping** 拼接）。先例：`create_doc_share` 曾指向不存在的 `/Doc/createDocShare.do`，工具 100% 不可用 |
| 1.2 | **参数名对齐**：服务端签名 vs client `params.put` 的 key | 人工核对 + 探针各跑一次成功路径；先例：`R1-3` 的 `getDocShareList` 描述/参数与接口语义完全错位（接口根本不收参数） |
| 1.3 | **`required` ⊆ `properties`**（schema 自洽） | `TestToolOnboarding` 自动；先例：`objSchema` 曾把 `String[]` 塞进 schema → **全部工具的必填校验静默失效**（R3-0） |
| 1.4 | **描述质量**：不得过短（模型无从下手）；**不得教已下线用法**；不得编造命令 | `TestToolOnboarding` 自动查长度与禁用词，外加人读一遍："只看描述，模型能知道什么时候用、参数怎么填吗？" 先例：`create_repos` 描述曾只有 5 个字；help 族编造 `docsys help` |
| 1.5 | **client 新方法有调用者** | grep 一遍；零调用者要么删要么标注（R3-5：靠这个找出 3 个死方法） |
| 1.6 | **契约类护栏必须直接检查"工厂产出"** | 只测手搓 JSON 的桩测试会漏掉生产者的 bug（R3-0 的教训：测试自己造了个正确的 fixture，把 `objSchema` 的 bug 盖住了） |
| 1.7 | **工具数量变化**同步 `TestWriteTools` 的 `full registry size` 断言 | 计划文档 §5 不变量 5 |

---

## 2. 三件套验收（缺一不可）

### 2.1 护栏（纯 JVM）
- 新工具自己的断言 + **全量回归**（框定范围：`src\com\DocSystem\agent` 下的 `Test*.java`）。
- 源码 lint 断言**方法定义形式**（`private XxxResult handleFoo`），裸名字会被注释里的历史记录命中（R3-11 两处踩过）。
- 涉及共享 util 的改动，lint 要指向**唯一实现**处（R3-14：实体解码搬到 `util/HtmlText` 后，lint 改指该文件）。

### 2.2 真实探针（`%TEMP%\docsys_chk\*.java`）
- 用**真实数据**（如仓库 5 根目录 79 项、`66666/` 3 项），不走 mock。
- 要有**对照**：改造前后的数字/行为并列（例：19840 → 2746 字符/页）。
- **破坏性动作放 `finally` 清理**，结束核对磁盘无残留（R3-2 批 1 曾留 2 个临时仓库需手工清）。
- 临时对象只用仓库 5 + 一次性名字。

### 2.3 Agent 页面 E2E（真实 LLM + 确认门）
- `Admin`/`Admin`（**重启后 HttpSession 清空 → 必须先重新登录**）。
- 每轮至少 **1 读 1 写**，写操作要看到确认弹窗并**读到弹窗参数行**。
- 看三件事：①工具调用步数（与改造前对照）②输出是否被模型正确理解 ③模型有没有被描述带偏（R2-4 就是从这句问法里发现"共 N 条"歧义的）。

---

## 3. 提交与上线

| # | 检查项 | 说明 |
|---|---|---|
| 3.1 | 编译输出到 `WebRoot/WEB-INF/classes` | 源码树不得出现 `.class`（`Get-ChildItem -Path src -Recurse -Filter *.class` 应为 0） |
| 3.2 | **重启后做真机装配验证** | 条件注册的工具（依赖 `UserMemoryService`/`WebSearchService`/`SkillExecutorRegistry`/会话目录）在 dev 是否真的注册上了（R3-2 批 2b：工具面 28 个逐个确认） |
| 3.3 | **多仓库归属** | 主库 `D:/Dev/DocSys`（`devInt`）/ `src/com/DocSystem/websocket`（独立仓库 master）/ `office` + `office/test`（各自仓库）→ 分开提交 |
| 3.4 | 文档与提交信息纪律 | 文档保持 **CRLF + 无 BOM**；提交信息用 `[IO.File]::WriteAllText(p, m, New-Object System.Text.UTF8Encoding($false))` + `git commit -F`（PowerShell 的 `Out-File -Encoding UTF8` 会**加 BOM**） |
| 3.5 | **日志渠道**：凡是要靠 grep 统计/排障的日志，**必须走 `com.DocSystem.common.Log`** | 本工程 `log4j.rootLogger=info,stdout` → slf4j 只落 stdout；只有 `Log` 才写 `docsys.log`（R3-4 第一版打点用 slf4j，日志里一条都看不到） |
| 3.6 | 上线后观察一轮 | 用一句真实提问看模型是否按预期使用；要留可 grep 的标记（如 `[LEGACY-FALLBACK]`）便于事后统计 |

---

## 4. 验收记录模板（复制到计划文档 / 工作卡）

```markdown
### <工具名>（<日期>）
- 能力归属：工具 / 技能；定位口径：path/name（vid 必填/可省：…）
- 端点：`/Xxx/yyy.do`（存在性：TestToolOnboarding ✅）
- schema：required={…}；无 docId/pid；isWrite=…/needsConfirm=…
- 护栏：<TestXxx> <N>/<N>；全量 <N> 套 / <N> 项 0 失败
- 探针：<%TEMP%\docsys_chk\XxxE2E> <N>/<N>（对照：改造前 <数字> → 改造后 <数字>）
- 页面 E2E：<问法> → <N> 步工具调用 + 确认门 <N> 次 → 结果 <摘要>；磁盘核对无残留
- 未覆盖 / 遗留：<如实写>
- commit：<hash>
```

**填写示例（2026-09-21 R3-14）**

```markdown
### DocSysClient 非 JSON 错误页提炼（2026-09-21）
- 定位口径：不涉及（客户端内部兜底逻辑）
- 端点：不新增端点（复用 /Doc/getDoc.do 的真实 400 页做取证）
- schema：不涉及
- 护栏：TestServerErrorSummary 33/33；全量 34 套 / 1291 项 0 失败
- 探针：R314Probe 10/10（对照：修前 "HTTP Status 400 -"+误报服务端错误 → 修后 description 真原因 + INVALID_PARAM）
- 页面 E2E：web_search 查 DocSys → 1 步 + 0 次确认门 → 摘要实体残留 0
- 未覆盖：真 500 页未端到端采到（由合成页 + javap 核实的行为锁定）
- commit：55c9a243e
```

---

## 5. 常见坑索引（先例）

| 坑 | 后果 / 先例 |
|---|---|
| 工具输出的原始 JSON 超 4000 字符 | 被 `truncate` 砍成半截、后半段条目直接丢失（R1-5 / R2-1 / R2-3） |
| `write_file` 回显写入正文 | 模型上下文被自己刚写的正文塞满，真正的结果字段反而看不到（R3-2 批 2a） |
| 裸 JVM 里触碰 `BaseFunction.<clinit>` 或 `LuceneUtil2` | `Log` 写文件失败 → catch 里再 `Log` → **StackOverflow**；护栏只能改用源码 lint（R3-11 / R1-1b） |
| okhttp `response.header("Set-Cookie")` | 只返回**最后一个**同名头 → 登录后取到 `dstoken` 而非 `JSESSIONID`（R3-14 探针） |
| PowerShell `Select-String` 默认**忽略大小写** | `DocSysCLI` 会假匹配 `DocSysClient`（R3-4 取证时踩过）；要 `-CaseSensitive` |
| 用 PowerShell 重写 md | `Get-Content -Encoding UTF8` + `WriteAllText` 会把 CRLF 变 LF → 整文件 diff（R3-10 触发过） |
| `git commit --amend` | 会**改 hash** → 文档里记的 hash 立刻失效；要等最终提交后再记（R3-4 因此重做 3 个提交） |
| 大仓库全树 grep | 输出被淹没/截断；应写到文件再读，或先缩小范围（R3-4 取证时踩过） |
| 重启 dev Tomcat | ~5 分钟；`curl --retry 120 --retry-delay 3 --retry-connrefused`；就绪判据 = `/DocSystem/` 返回 **302**（R3-4 实测 200 也可能已就绪，但 302 是标准口径） |
