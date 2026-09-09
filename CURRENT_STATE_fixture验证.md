# CURRENT_STATE — apply_changes fixture 验证（工作卡）

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。**当前激活的工作卡不是这一份**——激活卡由 `CLAUDE.md` 指向决定，现在是 `CURRENT_STATE_id分配.md`。仅当切回 fixture 验证阶段时激活本卡。**只描述 fixture 验证任务，勿混入 id 分配修复状态**（见 `CURRENT_STATE_id分配.md`）。

## 当前任务
apply_changes Java 移植**代码验证阶段**：用真实编辑器录制的变更流 fixture，逐个验证 Java apply_changes 实现，对比 x2t / Nashorn golden，发现并修正代码缺陷。

## References
- 验证计划（权威进度跟踪）：`devDocs/apply_changes-移植后代码验证计划.md`（office 仓库）
- 移植开发计划（历史背景）：`devDocs/apply_changes-JS移植Java开发计划.md`（office 仓库）
- 上下文（权威续接锚点）：`docs/apply_changes-JS移植Java开发上下文.md` → 「当前续接锚点」
- 记忆：`porting-faithfulness-principle`、`docsys-multi-git-repos`、`revision-envelope-id-alignment`
- 编译/提交前提见 CLAUDE.md

## ★ 验证节奏约束（2026-09-05 用户决定）
每完成一个 fixture 的验证和修复后，**必须等用户手动确认通过后**才能开始下一个 fixture。禁止自行连续推进多个 fixture。

## ★ 移植忠实性原则（2026-09-07 确认）
Java apply_changes 必须忠实还原 JS 三步管道（读 bin → 应用变更 → 序列化回 bin）。
- x2t C++ 调 JS（V8）：`asc_nativeOpenFile` → `asc_nativeApplyChanges2` → `asc_nativeGetFileData`
- Java FileConverter 用纯 Java 实现相同三步；**Java 输出 bin 必须与 C++/JS 管道输出的 bin 字节一致**
- 发现 Java 自创逻辑（未对应 JS 源码）→ 先改成忠实实现再重新测试，无例外
- 检查顺序：蓝本对照先于测试

## 开工约束
- 先确认仓库 dirty 状态；有改动先提交再开工。提交归属见 CLAUDE.md「仓库结构」。
- 当前验证按验证计划文件中的 fixture 列表顺序推进；每 fixture 完成后等用户确认。

## 当前进展
- **✅ fixture2（粗体_斜体_段落 compact DOCT bin）**：14/14 PASS + MS Word OPENED OK（office `2d47abb4` / test `0b43d71`）。已用户确认闭环。
- **✅ fixture3（图片放大/移动/水平翻转/旋转）**：18/18 PASS（office 修复 `JChangesDrawingSetGraphicObject` nFlags 位编码）。**等待用户手动确认**。
- **✅ W2-4（景观 A3 文档）**：8/8 PASS（office `34eb5a47`）。两处忠实移植违规修复：① parseCols Read1 vs Read2 格式；② patchPgSzOnly orient 用 sdkjs type=2（非 x2t native type=5）。**等待用户手动确认**。

### W2-4 续：第二页缺失——已修复（2026-09-08，未提交）
用户反馈 W2-4 只渲染一页（缺第二页），根因已定位并修复：
- **根因**：分页符不在 base Editor.bin，而是变更 `ParaRun_AddItem`(28<<16|1) 引入；idx=41 changes3.json `[pos=0 elemType=NewLine(0x10)]` breakType=2(break_Page)。
- **违规**：`JParaItemReader` 对 `NewLine` 返回 null → `JChangesRunAddItem.apply()` `if(el==null) continue;` 静默丢弃分页符。同时 JS `Read_FromBinary`(ParagraphContent.js:1417) 对 page/column break 还读 1 个 Flags.NewLine bool（载荷里实测 `01`），Java 此前未消费→color 读错位。
- **修复**：`JParaItemReader.NewLine` 读 breakType + 消费 Flags bool，并按 Serialize2.js WriteRunContent 把段级 breakType 映射为 run 级（break_Page→pagebreak=4 / break_Column→columnbreak=18 / 默认→linebreak=5），返回 `JModel.NewLine`（不再 null）。新增 `SerBreakType` 常量类。
- **验证**：TmpBreakDiag 对照——Nashorn `p4 breaks=[NL(4)]`；Java 修复前 `p4 breaks=[]`，修复后 `p4 breaks=[NL(4)]` 一致。W2-4 golden 8/8 PASS。
- **回归**：TestJMergeJavaGolden 6/6、Golden3 18/18 PASS；Golden2 7/7 失败，但已证实与本次无关（临时 revert 修复→仍 7/7，是段落属性 SpacingLine/IndLeft 等既有缺陷，非本修复引入）。
- **待用户手动确认**；确认后再提交 office 核心仓库（`JParaItemReader.java` M + `SerBreakType.java` 新增）。

## 下一步
见验证计划 `devDocs/apply_changes-移植后代码验证计划.md` 中的「当前优先队列」。**id 分配对齐未闭环前不开启下一个 fixture**。

## 未提交改动
- office 核心仓库（dev/office）：`JParaItemReader.java`（M）、`SerBreakType.java`（新增）
