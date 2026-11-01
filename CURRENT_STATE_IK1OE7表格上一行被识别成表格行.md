# Gitee issue IK1OE7：doc 表格上一行文字被识别成表格的一行（分析完成）

状态：**✅ 根因已定案（2026-11-01），等用户裁定是否需要后续动作**。
结论：**非转换器 bug**——源 .doc 里标题"#2热机控制系统"本来就真实存在于表格第一行
（无边框、跨全列的行）；Word 里"看似独立段落"是该行隐藏边框的视觉效果。
Java 转换链、C++ x2t、MS Word COM 三方裁判结论完全一致。详见 §七。
- Issue：https://gitee.com/RainyGao/DocSys/issues/IK1OE7
  【Bug】doc文件里的表格上一行文件被识别成了表格中的一行（"文件"应为"文字"笔误）
  2026-07-17 由 Rainy 创建，状态 待办的，无文字描述、无附件文档，仅 2 张截图。
- 用户原话（2026-11-01）：**"在MxsDoc系统上 表格的上一行 文字 被识别成了 表格的第一行，你帮我分析一下什么原因"**
  ——本卡当前是**分析任务**：交付根因结论；修复需用户看过分析后再开工。
- 前情：FileConverter .doc 打开/保存 NPE 系列已全部收尾，
  见 `DevAgentControl/已完成/CURRENT_STATE_FileConverter打开doc失败NPE.md`
  和 `DevAgentControl/已完成/CURRENT_STATE_FileConverter遗留问题.md`（P1/P2/P3/放大器，5 个 commit）。

## 一、现象（两张截图已解析，视觉模型完成）

截图存于 `C:\Users\65205\AppData\Local\Temp\issue_IK1OE7\`（img1.png 问题现象 / img2.png 正确效果）：

- **正确效果（img2，Word 打开的期望视图）**："#2 热机控制系统"是表格上方的**普通居中段落**
  （带段落标记 ↵），独立于表格；表格 6 列，第一行是表头：序号/设备名称/设备型号/制造厂家/
  联系人/技术参数，数据行含 Symphony、ABB 等设备。
- **问题现象（img1，MxsDoc 编辑器内）**：标题"#2热机控制系统"显示为表格上方一个
  **带选择虚线框+移动光标的浮动对象**（截图时处于选中状态），红圈标注在标题+表头行左侧。
  ——表象像是标题段落被包成了 textbox/shape 一类对象，或被并入表格结构。
  issue 标题的说法是"被识别成了表格中的一行（第一行）"。

**待确认**（新 session 优先问清或用 x2t 交叉验证）：img1 是哪个引擎的编辑器视图
（FileConverter/Java 还是 OnlyOffice 引擎）？本任务线上下文默认 FileConverter 引擎。

## 二、样本文件（已定位、已校验，可直接开工）

| 项 | 值 |
|----|----|
| 权威位置（仓库 1） | `C:\DocSysReposes\1\data\rdata\doc文件里的表格上一行文件被识别成了表格中的一行\热机控制系统型号参数.doc` |
| 暂存工作副本 | `src/com/DocSystem/websocket/office/test/tmp/IK1OE7/sample.doc`（22,016B，OLE2 .doc） |
| md5（三者一致） | `e9a03bf8eff6d02e10ef1393b9833147` |
| 其他同源副本 | `test/tmp/TestDocNpeRepro/inputs/#2热机控制系统型号参数.doc`（回归样本之一）；WeChat 原件 `C:\Users\65205\Documents\xwechat_files\...\2026-07\` |

注意：该文件**已在前序任务的打开链路回归样本集里**（verify_doc_pipeline.ps1 全量 9 样本之一，
doc→bin 基准 16,028B）——即"能转成功、无异常"，本 issue 是**转换内容正确性**问题，不是崩溃问题。

## 三、分析切入点（工作假设，未经代码证实）

doc→docx 转换（`MsBinaryFile/DocFileFormat/DocumentMapping.java`，C++ 原版
`D:/Dev/onlyoffice-study/core/MsBinaryFile/DocFile/DocumentMapping.cpp`）中，
**表格前段落被误判为表格行**的典型机制是 PAPX 的 fInTable/itap 属性处理
（Word 二进制里表格归属由段落属性决定，表格前段落若 fInTable=1 会并入表格）。
img1 的"浮动文本框"表象也可能指向 VML shape/textbox 包裹路径（VMLPictureMapping/VMLShapeMapping，
前序任务改过）。**这只是假设，以中间产物 diff 为准，不要先入为主。**

## 四、建议执行顺序（新 session 从这里继续）

1. **取中间产物定性**：用现成 harness 跑 `test/tmp/IK1OE7/sample.doc`：
   - `test/TestDocNpeRepro.java`（doc→bin，自动判格式）拿到 Editor.bin；
   - 需要中间 docx 的话参考 `test/TestBin2Docx.java`（bin→docx）或直接让转换链落 docx。
   解包中间 docx 的 `word/document.xml`，检查标题段落：
   a) 变成了 `<w:tbl>` 第一个 `<w:tr>`？b) 被包进 `<w:pict>`/`<v:shape>`/textbox？c) 正常 `<w:p>`？
2. **C++ 裁判（四格矩阵法）**：`WebRoot/web/static/office-editor/server/FileConverter/bin/x2t.exe`
   + params.xml（用法见 `test/CompareWithX2t.java`）转同一 doc→docx，对比 document.xml：
   - C++ 正确 + Java 错 → Java 移植 bug，diff 定位到 DocumentMapping（或 VML 映射）逐段对照 C++；
   - C++ 也同样错 → OnlyOffice 上游行为，结论改写（向用户报告，另议）。
3. **锁定分歧点后**：Java 源 ↔ C++ 源逐函数对照（前序任务的移植残留税目参考
   `src/com/DocSystem/websocket/office/docs/CppToJava常见问题与解决方案.md`）。
4. **产出根因分析报告给用户**（含证据链：截图、中间产物 diff、代码对照），等用户裁定是否修复。
5. 若开工修复：遵守下方验证规矩，修复后**该样本要新增内容正确性断言**（标题段落独立于表格），
   不能只看转换不报错；同时全量回归 13 项必须 PASS（该样本 bin 基准 16,028B 可能因修复漂移，
   漂移时按脚本规约人工确认后更新基准表）。

## 五、工作规矩（用户明确要求，延续前卡，违反=返工）

> "我希望我们每次修改都可以进行验证"——每次代码修改的完成定义 = 验证通过。

1. 增量编译：javac 必带 `-g -encoding UTF-8 -cp "WebRoot/WEB-INF/classes;WebRoot/WEB-INF/lib/*" -d WebRoot/WEB-INF/classes`
2. 最小复现（harness 重跑，现象消失/复现）；
3. 全链路回归 `test/tools/verify_doc_pipeline.ps1`（-Fast 约 12 分钟；全量 9 样本约 30 分钟；
   退出码 0=全过；PS5.1 陷阱已内置：.ps1 带 UTF-8 BOM、java 用参数数组+Start-Process）；
4. 运行时行为由用户在 Eclipse 实例（8100）端到端实测。

环境红线：
- `C:\MxsDoc` 正式实例**绝不碰**；Eclipse 实例由用户启停（需要浏览器验证可自己起 8100 服务）；
- office 核心代码独立 git 仓库：`git -C src/com/DocSystem/websocket/office`，测试 → 其下 `test`；
- 源码树不得留 .class；scratch 只写 `test/tmp/<测试名>/`；
- 保存时 doc 落成 docx（回落到 65）是正常设计不要改；
- `WebRoot/WEB-INF/classes/com/.../office/test/` 下旧测试 class 会遮蔽 `test/bin`，行为诡异先查这里。

## 六、里程碑（随进度更新本卡）

- [x] 2026-11-01 issue 元信息 + 截图解析 + 样本定位校验（本卡建立）
- [x] 2026-11-01 中间产物定性：Java 链 doc→bin→docx，body 第一个元素就是 w:tbl，
  标题是表格第一行（gridSpan 跨全列单元格，边框 top/left/right=none、仅 bottom=single）
- [x] 2026-11-01 x2t 交叉验证：C++ 产物结构相同（标题同样在表格第一行）
- [x] 2026-11-01 源二进制定案：`test/DiagIk1oe7Papx.java`（新增诊断工具）逐段 dump PAPX——
  标题段落 grpprl 含 sprmPFInTable(0x2416)=01、sprmPItap(0x6649)=1，段落以 cell mark(0x07)
  结尾，下一段是 row mark(fTtp=1) → **源文件里标题就在表格第一行**
- [x] 2026-11-01 MS Word 权威裁判：Word COM 打开 sample.doc，
  `Paragraphs(1).Information(wdWithInTable)=True`，另存 word_ref.docx 后 body 首元素
  也是 w:tbl、第一行就是标题 → **Word 同样把它当表格第一行**
- [x] 2026-11-01 根因报告已交付，等用户裁定
- [ ] （如用户要求）处理附带发现 tblGrid 差异

## 七、根因结论（证据链）

**现象归属：文档本身的结构，不是 MxsDoc 转换 bug。**

1. **源 .doc 二进制**（DiagIk1oe7Papx.log）：标题段落 PAPX 明确
   fInTable=1/itap=1，以 cell mark 结尾，其后是 fTtp 行标记——.doc 格式里这就是
   "表格第一行第一格"的规范表达，无歧义。
2. **三方产物完全一致**（test/tmp/IK1OE7/ 下 java_docx、cpp_docx、word_ref）：
   body 首元素均为 w:tbl；表格 7 行；第一行=标题（跨全列，边框 top/left/right=nil、
   bottom=single）；第二行=表头。Java 与 C++/Word 仅属性表达细节不同，结构语义一致。
3. **为什么 Word 里"看起来"是独立段落**（img2 的误解来源）：标题行是制表时的常见手法——
   无边框（三边 nil）+ 跨全列 + 表格居中（tblInd=-1083/jc=center），视觉上与独立标题段落
   无法区分；Word 未开"查看网格线"时完全一样。但结构上它就在表格内（第 2 条已证）。
4. **img1 的"浮动对象/虚线选择框"表象**：用户点击标题即选中了表格第一行单元格，
   编辑器显示单元格选中框+表格移动手柄——是表格选中 UI，不是 textbox/shape。
5. **附带发现（与本 issue 无关，建议另立任务）**：Java 产物 tblGrid 只有 3 列
   [2917,3553,4209]，C++/Word 均为 6 列 [797,2120,1852,1701,1701,2508]（与各行 6 个 tc
   的 tcW 吻合）。疑似 DocumentMapping.buildTableGrid 的 mapBoundaries 收集移植差异，
   tblLayout=fixed 时可能影响前端列宽计算。样本：同一 sample.doc，三方对比脚本见
   test/tmp/IK1OE7/ 内 python 片段（无独立文件）。

**给用户的答复口径**：这份文档制作时标题就是表格第一行（隐藏边框的跨列行），Word 与
MxsDoc 的结构理解一致；MxsDoc 无需也无法把它"改回"独立段落（那会改变文档结构）。
若用户不接受视觉效果，可选方案是编辑器渲染层优化（如无边框行的网格线提示），属前端任务。

证据文件：`test/tmp/IK1OE7/`（sample.doc、java_docx/、cpp_docx/、word_ref/、
DiagIk1oe7Papx.log）；诊断工具 `test/DiagIk1oe7Papx.java`（已编译至
WebRoot/WEB-INF/classes，按惯例保留）。
