# CURRENT_STATE — 当前工作卡

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。小而新鲜，随当前开发任务随手更新。压缩后读这里即可恢复方向；细节回落到 references。**此文件是会话级产物，不挂在任何任务仓库下。**

## 必读上下文（开工前读）
- `src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md`（office 仓库）：JDK 路径、编译命令、类路径、运行时目录等前提。

## 当前任务
apply_changes JS→Java 全量移植（Word 线）。当前在 **W2-4 Section（type_base=30，38 项变更）**：代码已写完并跑通，剩「测试断言对齐 golden」+「三门零回归」两道收尾工序。

## References（读这里取细节）
- 计划：`devDocs/apply_changes-JS移植Java开发计划.md`（office 仓库 `src/com/DocSystem/websocket/office`）→ W2-4 节点（~549 行）
- 上下文（权威续接锚点）：`docs/apply_changes-JS移植Java开发上下文.md`（office 仓库 `src/com/DocSystem/websocket/office`）→ 顶部「当前续接锚点 2026-08-27 W2-4」（~496 行）
- memory：`w2-4-sectpr-known-issue`（已知遗留裁定）、`porting-faithfulness-principle`（忠实性）、`docsys-multi-git-repos`（多仓库提交归属）

## 开工约束
- 先确认仓库 dirty 状态；有改动先提交再开工（本任务如此）。提交归属见 CLAUDE.md「仓库结构」。

## 当前进展
- W2-4 代码已写完并跑通：新增 `JChangesSectionPropChanges.java`、`JChangesParagraphSectionPr.java`（`doctrenderer/jmerge/word/change/`）、`JSectionCodec.java`（`doctrenderer/jmerge/word/props/`）+ 7 修改文件（JModel/JBinIdAllocator/JChangesApplier/JChangesFactory/JDocumentReader/JDocumentWriter/JParaItemReader）。
- CFldSimple NPE 已修（`CFldSimple_init()` 补 `sInstr=""; writer=CStringBuilder.Init();`）。
- **序列化侧已对照 C++ `BinWriters.cpp` 确认忠实**（外层结构 pgSz→pgMar→setting 无条件、prop id 全对齐）。
- 已知遗留（**用户 2026-08-27 裁定不再追查**）：Java 输出 pgMar 表现为 left=0/gutter=722944 且分节 sectPr 缺失。x2t 分离实验已定这是 **apply_changes 产出 bin 字节层面**的问题，非序列化代码。按「忠实还原即通过」原则处理数值偏差。
- 测试 `TestJMergeJavaGolden_W2_4` 断言还是旧单节 golden，**未对齐两节 golden**。

## 下一步
1. 重写 `TestJMergeJavaGolden_W2_4` 断言对齐两节 golden（按忠实原则处理数值偏差）。
2. 三门零回归：W2 19/19 + Word golden 6/6 + PPTX 22/22。
3. （可选）转 W2-5 Hyperlink。
