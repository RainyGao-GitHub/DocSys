# CURRENT_STATE — id 分配对齐修复（工作卡）

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。**当前激活的工作卡是这一份**。小而新鲜，随手更新；细节回落 references。**只描述 id 分配对齐修复任务，勿混入 fixture 验证状态**（fixture 验证见 `CURRENT_STATE_fixture验证.md`）。

## 当前任务
apply_changes Java 移植中 **id 分配与 JS（sdkjs v7.0.1）对齐**。这是一**大类**缺陷，范围按 `docs/apply_changes代码逻辑分析.md` **§14** 界定：
- §14.2 每类对象 id 消耗清单（对齐基准）
- §14.3 两处确证错位
- §14.4 五条结构性风险
- §14.5 六条修正建议（按优先级）

> ⚠️ 切勿把本任务描述为"已修复整个 id 分配缺陷"。当前只完成「确证错位 1」。

## References
- 权威范围：`docs/apply_changes代码逻辑分析.md` §14（office 仓库）
- 续接上下文：`docs/apply_changes-JS移植Java开发上下文.md`
- 记忆：`revision-envelope-id-alignment`（子项 1 完成、子项 2 + 风险开放）、`jbin-id-allocator-ccore-pitfall`、`binstream-getstring2-byte-count`、`porting-faithfulness-principle`
- 编译/提交前提见 CLAUDE.md（.class → `WebRoot/WEB-INF/classes`；核心代码 → office 仓库，测试 → office/test）

## ★ 节奏约束
- 2026-09-05 用户决定：每完成一个 fixture 的验证和修复后，必须等用户手动确认通过才能开始下一个 fixture；禁止自行连续推进。
- **id 分配对齐未闭环前，不开启下一个 fixture**。

## 当前进展（按 §14.3 / §14.4 逐条）

### ✅ 完成：确证错位 1（Del/Ins/MoveFrom/MoveTo 0-id，2026-09-08）
- **根因**：`JBinIdAllocator.isContainer()`（或 `walkParContent()` switch）把 Del/Ins/MoveFrom/MoveTo 与 Hyperlink/FldSimple 一并当作容器各分配 1 id。JS 实际（`Serialize2.js:11564-11608`）：这四种类型不创建任何对象，只包 ReviewInfo，内容经 oParStruct 直接加入段落，id 消耗 = 0。
- **后果**：基线 bin 含修订时，从第一条 Del/Ins 起后续所有对象 id 整体偏移 → owner 命中错误对象或 noHost。fail-loud 只抓 type-2(noHost)，抓不住 type-1(静默错对象)。
- **修复**：读侧 `JBinIdAllocator.readRevision`（0-id + REV payload Author=0/Date=1/Id=2/UserId=3/Content=4 + 内容扁平化入段落 + `[start,end)` 标 reviewType Remove=1/Add=2）；写侧 `JDocumentWriter.writeTrackRevision` 把 Id 写在最前且从局部计数器 0 重新生成（非读回原 Id）。
- **验证**：`TestRevisionIdAlloc.java`（office/test）用 x2t 从带 `<w:ins>/<w:del>` 的 docx 转出的真实 base bin（fixture 已正式入库，见下节）判定，**6 PASS / 1 FAIL**。
  - 6 PASS：docStart=402、runs=4、envelope 容器 id 数=0（Del/Ins 各 0 id）、'old'=Remove(1)、'new'=Add(2)；run 流=Hello(405)/old(406)/new(407)/world.(408)，无容器 id 混入。
  - 唯一 FAIL：round-trip 字节等价——与修改无关：两 envelope 原/重写均恰 95 字节，差量全来自 `Correct_Content`(Serialize2.js:11154) 段尾注入的空 run（`05 05 00 00 00 08 00 00 00 00`，10 字节）。
  - **数字口径坑（勿误判回归）**：测试打印 `roundtrip 长度=338  原始 Document 分节长度=324`，看着是 +14。但重写串开头多一个 4 字节外层长度前缀（`4e010000`=334），原始串没有；**净载荷 334 vs 324 = +10**，与上面的归因一致。别把 338−324 当成新增缺陷。
- **判定准则坑**：不能以 x2t 字节等价作 round-trip 判据。x2t(C++) 字段序=(Author,Date,Id,Content)，JS `WriteTrackRevision`=(Id,Author,Date,Content) 且 Id 从 0 重生成（Del=0/Ins=1；x2t 为 Del=1/Ins=2）。权威判据 = Java 镜像 sdkjs v7.0.1。

### ❌ 未完成：确证错位 2（忠实路径内部计数与 JS 不符）
- `doHdrFtr` 用 `skipN(5)`，JS 实际 **6**（CHeaderFooter 1 + CDocumentContent 5）。
- `walkTableContent` 的 cell 用 5，而 `allocCell` 用 6。
- `walkDocContent` 的 Sdt 用 5，而 `allocSdt` 用 6。
- 当前 calibrated 路径不执行这些函数；一旦启用忠实路径（`USE_CALIBRATED_PRE_DOC=false`）立即错位。

### ❌ 未完成：风险 1（§14.5 建议 2 必修，最可能翻车）
- `CALIBRATED_PRE_DOC_IDS=481` 是**单 fixture 常量**（docStart=883 只对当前 fixture 成立）。主题对象树（CTheme 默认形状几何/路径/填充/效果）、脚注/尾注/编号/页眉页脚数量随文档变化 → 换文档后正文所有 id 整体错位。
- **须用真实遍历替换**：已有 `doOther/doNotes/doNumbering/doASeekTable/doHdrFtr` 骨架，需补 **CTheme 树的 id 分配**（大头，≈移植 pptx 主题反序列化器的 id 计数部分），并把 HdrFtr=6、cell=6、Sdt=6 修正统一；`docStart` 改由真实遍历算出。

### ❌ 未完成：风险 2-5
- **风险 2**：Drawing 子对象用字节级估算（`countPptxSubObjects`）；JS 是每个 `CBaseObject` 构造 1 id，数量取决于 shape 类型（Fill/Stroke/Geometry/Path/Effect/Text…）。某类估算不一致 → 后续 id 漂移。
- **风险 3**：`Correct_Content` 删除分支未模拟——基线含相邻空 run/空超链接时 JS 会删除对象（减 id），Java 不删 → 漂移。
- **风险 4**：pre-doc 对象（脚注/尾注/页眉页脚正文/编号）在 calibrated 路径只"跳过 counter 不建模"；针对它们的 change 会 noHost → 抛异常。安全但覆盖窄于 JS（fail-loud）。
- **风险 5**：bootstrap=401 为 oracle 常量，依赖 sdkjs 版本一致；升级即失效。

## 如何重跑子项 1 的验证
工作目录 `D:/Dev/DocSys`（`.class` 必须 `-d` 到 `WebRoot/WEB-INF/classes`，勿落 src 树）：
```
C:/docsysRel/docsys-WDK/docsys/tomcat/Java/jdk/bin/javac -encoding UTF-8 \
  -d WebRoot/WEB-INF/classes \
  -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" \
  src/com/DocSystem/websocket/office/test/TestRevisionIdAlloc.java

java -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" \
  com.DocSystem.websocket.office.test.TestRevisionIdAlloc
```
期望：`passed=6 failed=1`（唯一 FAIL = round-trip 净 +10，已归因 `Correct_Content`；注意 338/324 的口径坑，见上）。

## ✅ 测试 fixture 已正式入库（2026-09-09，原 scratch 坑已消除）
`TestRevisionIdAlloc` 的 base bin 已从未跟踪的 root `tmp/revtest/` 迁入 office/test 仓库正式 fixture 目录：

`src/com/DocSystem/websocket/office/test/测试文件/RevisionBase修订id分配/`
- `binsrc/Editor.bin`（993B，测试直接读）、`fromdocx/input.docx`（1093B）
- `makerev.py` + `params.xml`（路径已改成指向本目录，可原地重跑重生成）、`README.md`

同时做了两处加固：
- `BIN_PATH` 改指入库路径（原 `tmp/revtest/binsrc/Editor.bin`）。
- **静默跳过坑已修**：原先 fixture 缺失时走 `[SKIP]` 分支直接 return，表现为 "0 failed" 会被误读成通过；现改为抛 `IllegalStateException`（fail-loud），报错里带绝对路径 + 重生成方法 + "工作目录须为 D:/Dev/DocSys" 提示。

> 注意：office/test 的 `.gitignore` 忽略 `tmp/` 与 `/tmp`，且 `office/test/tmp/` 已被各测试当 scratch 输出目录用——**fixture 不能放那里**，否则只是把"未跟踪易丢"的坑平移。正式 fixture 一律进 `测试文件/`。

## 下一步（待用户确认后再动）
- 候选一（§14.5 建议 3）：修忠实路径 5/6 计数——改动小、边界清晰。
- 候选二（§14.5 建议 2，风险最高）：用真实遍历替换 481 常量——补 CTheme 树 id 分配，工作量大。
- 是否继续推进、先做哪个，等用户指示（遵守"未确认前不自推进"）。

## 未提交改动（2026-09-09 实测 git status，待按归属提交）
- **office 核心仓库（dev/office）** —— 3 项未提交：
  - `doctrenderer/jmerge/word/JBinIdAllocator.java`（M，`readRevision` 等）
  - `doctrenderer/jmerge/word/JDocumentWriter.java`（M，`writeTrackRevision` 等）
  - `devDocs/apply_changes-移植后代码验证计划.md`（M，F1 条目范围更正）
- **office/test 仓库（master）** —— 3 项未提交：
  - `TestRevisionIdAlloc.java`（M，BIN_PATH 入库路径 + fail-loud 改造）
  - `测试文件/RevisionBase修订id分配/`（??，新增 fixture 目录 5 文件）
  - `TestS3Diag.java`（M，第18行 OUT 从工程根 `tmp/TestS3Diag/` 改回 `office/test/tmp/`，与另 63 个测试对齐；已重编译过）
- **root 仓库（devInt）** —— 2 项未提交：`CLAUDE.md`（M，新增「测试 scratch 输出目录（不变量）」节，与 .class 不变量并列）、本工作卡。root `tmp/`、`tmp_diff/`、`tmp_w24/`、`tmp_test_output.txt` 已由用户删除。
- 提交归属见 CLAUDE.md「仓库结构」。
