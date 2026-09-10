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
- 记忆：`revision-envelope-id-alignment`（子项 1 完成、子项 2 + 风险开放）、`jbin-id-allocator-ccore-pitfall`、`binstream-getstring2-byte-count`、`porting-faithfulness-principle`、`sdkjs-version-pin-7.0.1`（蓝本源码位置＋版本钉）
- 编译/提交前提见 CLAUDE.md（.class → `WebRoot/WEB-INF/classes`；核心代码 → office 仓库，测试 → office/test）

### ★ JS 蓝本源码位置（对照移植的唯一权威源，勿再找错）
- **原始源码（唯一可对照蓝本）＝ `D:/Dev/onlyoffice-study/sdkjs`**。已确认存在，`git checkout v7.0.1.x`，当前 HEAD＝**v7.0.1.34 / `d2baeb9714`**。
  - `Serialize2.js`（§14 全篇引用的行号基准）＝ `D:/Dev/onlyoffice-study/sdkjs/word/Editor/Serialize2.js`。
  - 主题/绘图反序列化：`common/Drawings/Format/Format.js`、`common/Shapes/Serialize.js`、`slide/Drawing/ThemeLoader.js`、`common/Drawings/Format/ChartFormat.js`。
- **`WebRoot/web/static/office-editor/sdkjs/`（含 `sdk-all.js`）＝编译打包后的产物，不是蓝本**：它是部署版 v7.0.1.71（build:37）的 bundle，只有 11308 行、**缺全部反序列化函数**（grep `Get_NewId`/`ReadTheme`/`CFootEndnote` 均 0 命中）。**绝不拿它当移植对照源**——本会话曾误 grep 它得 0 命中而卡壳。
- 版本口径区分：部署/运行的编辑器 bundle＝v7.0.1.71（见记忆 `sdkjs-version-pin-7.0.1`，classId 漂移防线）；对照蓝本 checkout＝v7.0.1.34。两者同属 7.0.1 线，行号以 checkout 源为准。

## ★ 节奏约束
- 2026-09-05 用户决定：每完成一个 fixture 的验证和修复后，必须等用户手动确认通过才能开始下一个 fixture；禁止自行连续推进。
- **id 分配对齐未闭环前，不开启下一个 fixture**。
- **2026-09-09 用户决定（改代码前的讲解门禁）**：开始修改代码**之前**，必须先**对照 JS 源码**把要移植的逻辑讲清楚，并把讲解**写成文档放 `src/com/DocSystem/websocket/office/docs`**，**等用户确认后再开工**。目的＝保证用户也能理解代码。适用于候选二及以后每一次修改，无例外。

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

### ✅ 完成：确证错位 2（忠实路径内部计数与 JS 不符，2026-09-10）
- **根因**：`CDocumentContent` 构造器（DocumentContent.js:112）调用 `Correct_Content()`，新建段落 Content=[EndRun] 长度=1，触发尾部规则（Paragraph.js:6957-6962）追加 1 个 `new ParaRun`。故 CDocContent 初始化 = 5 id（自身+par_base+ParaTextPr+EndRun+CC_run），三种容器均应为 1+5=**6**。
- **修复**：`doHdrFtr` skipN(5→6)；`walkTableContent` cell skipN(5→6)；`walkDocContent` Sdt skipN(5→6)；同步更新注释与行头说明。
- **验证**：`TestRevisionIdAlloc` 仍 **6 PASS / 1 FAIL**（不变，符合预期——`USE_CALIBRATED_PRE_DOC=true` 不走这三处）。
- **提交**：office 仓库 `4c3b5079`，含讲解文档 `docs/id分配候选一-忠实路径5改6计数.md`。

### ✅ 完成：风险 1（§14.5 建议 2，用真实遍历替换 CALIBRATED_PRE_DOC_IDS，2026-09-10）
- **根因**：`CALIBRATED_PRE_DOC_IDS=481` 是单 fixture 常量（docStart=883 只对当前 fixture 成立）；随文档变化的主题对象树/脚注/页眉页脚数量不同 → 换文档后所有 id 整体错位。
- **Fix A**：`doNotes` skipN(4→5)——CFootEndnote 只调 CDocumentContent.call()，无独立 id，应为 5。
- **Fix B**：`doOther()` 用真实 PPTX binary 遍历 CTheme id 树（new CTheme=1 + themeElements=0 + per spDef/lnDef/txDef: CSpPr+DefId+optional xfrm+geom+CShapeStyle + per ExtraClrScheme: 1+optional ClrMap=1）。
- **Fix C**：删除 Java 自创脚手架（`CALIBRATED_PRE_DOC_IDS`、`USE_CALIBRATED_PRE_DOC`、`instancePreDocOverride`、`globalCalibrationOverride`、`countStyles()`），从测试文件清除全部调用点（5 个测试文件）。
- **验证**：`TestRevisionIdAlloc` 仍 **6 PASS / 1 FAIL**（docStart=402，符合预期——revision fixture 无 Other/Notes 分节，真实遍历产出 pre-doc=0）。
- **提交**：office `a99958ab`（Fix A/B/C），office/test `845e2c0`（5 测试文件移除 calibration）。讲解文档：`docs/id分配候选二-真实遍历替换481常量.md`。

### ✅ 完成：风险 1 实现雷修复（Seek2+no+4，2026-09-10）
- **雷 1 根因**：`doOther` 用 `stream.Seek(off)` 只设 `pos`（帧锚点），不改 `cur`（实际读位置）；`GetULong()` 从旧 `cur` 处读到 0，CTheme 计数为 0，`docStart` 整体偏低，所有 owner 映射错对象。修复：`stream.Seek2(off)`。
- **雷 2 根因**：`countThemeIds/countDefaultShapeDef/countSpPr/countExtraClrSchemes` 对 PPTX record `end` 边界多加 `+4`。PPTX `EndRecord` 写的是纯内容长度（不含 4B 长度字段本身），读完 4B len 后 `cur` 在内容起始，`end = cur + len` 即可；`+4` 导致越界进入相邻记录，CShapeStyle/CXfrm/CGeometry 计数偏大。全部去掉 `+4`。
- **验证**：Golden3 `noHost=0`（真实遍历给出 docStart=634 = oracle，preDocIds=232）；剩余 7 error 为 Drawing xfrm/flip 处理器未实现（classId=5/3，预存在缺口，不是 id 分配问题）。Golden2/W2/W2_4/RevisionIdAlloc 无回归（各 noHost=0/error=0）。
- **提交**：office `34429f3f`，讲解文档 `docs/id分配候选二-BinStreamReader两处雷.md`。同时清理候选二调试用临时 Log 输出（JMergeEngine.java 的 docStart 打印 + JBinIdAllocator 内 doOther/countThemeIds/aSeekTable/allocate 各调试输出）。

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
- 候选三（§14.4 风险 2-5）：Drawing 估算、Correct_Content 删除分支、pre-doc change noHost、bootstrap 常量。
- 是否继续推进、先做哪个，等用户指示（遵守"未确认前不自推进"）。

## 提交状态（2026-09-10）
- **office 核心仓库（dev/office）** —— ✅ 已提交 4 条：
  - `c9c0cabe`：子项 1（确证错位 1：Del/Ins/MoveFrom/MoveTo 0-id）。
  - `4c3b5079`：子项 2（确证错位 2：doHdrFtr/cell/Sdt skipN 5→6 + 讲解文档）。
  - `a99958ab`：风险 1（真实遍历替换 481 常量：Fix A/B/C + 讲解文档）。
  - `34429f3f`：风险 1 实现雷修复（Seek2+no+4 + 清理调试 Log + 讲解文档）。
- **office/test 仓库（master）** —— ✅ `845e2c0`：5 个测试文件移除 globalCalibrationOverride。
- **root 仓库（devInt）** —— ⏳ 未提交：`CLAUDE.md`（M）+ 本工作卡（M）。
