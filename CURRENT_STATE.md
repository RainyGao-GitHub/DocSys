# CURRENT_STATE — 当前工作卡

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。小而新鲜，随当前开发任务随手更新。压缩后读这里即可恢复方向；细节回落到 references。**此文件是会话级产物，不挂在任何任务仓库下。**

## 必读上下文（开工前读）
- `src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md`（office 仓库）：JDK 路径、编译命令、类路径、运行时目录等前提。

## 当前任务
apply_changes JS→Java 全量移植（Word 线）。**W2-6 已完成**，下一个：**W2-7 TextPr/ParaRun 字体族整体属性（RFonts/Lang 整体 blob/Unifill/Shd）**。

## References（读这里取细节）
- 计划：`devDocs/apply_changes-JS移植Java开发计划.md`（office 仓库 `src/com/DocSystem/websocket/office`）→ W2-7 节点
- 上下文（权威续接锚点）：`docs/apply_changes-JS移植Java开发上下文.md`（office 仓库）→ 「当前续接锚点 —— 2026-08-28 W2-6 Paragraph 剩余属性全部完成，下一步：W2-7 TextPr/ParaRun 字体族整体属性」
- memory：`porting-faithfulness-principle`（忠实性）、`docsys-multi-git-repos`（多仓库提交归属）

## 开工约束
- 先确认仓库 dirty 状态；有改动先提交再开工（本任务如此）。提交归属见 CLAUDE.md「仓库结构」。
- **★ 验收节奏（用户 2026-08-27 决定）**：先全量移植剩余 ~148 类型（Word 89/Slide 26/Excel 33），边移边做**轻量验证**（编译+蓝本对照/单类型字节往返/模型值断言，不写 golden），**重型三门回归压到最后一环**。完整细则见上下文 §6 首块「验收节奏调整」，计划「验证策略」已同步。

## 当前进展
- **W2-6 Paragraph 剩余属性全部完成**（2026-08-28）：
  - `JParaPrPropChanges` 新增 `BaseByte`/`BaseObject` 基类 + 17 类：Numbering(3)/Shd_Value(18,★fix 原误用 BaseLong)/Shd_Color(19)/Shd_Unifill(20)/Shd(21)/Tabs(23)/Borders×5(25-29)/Bullet(31)/FramePr(33)/DefaultTabSize(38)/Shd_Fill(40)/Shd_ThemeFill(41)
  - `JPropWriter.writePPr` 新增 numPr/Tab/FramePr 容器 + writeNumPr/writeTabs/writeFramePr + writeShd Color/Fill 派生 + editorWrapToBinar；`JPropReader.readShd` 补存 ThemeFill
  - `JChangesFactory` 14 类替换 SkipProperty
  - 验收（轻量）：编译零错误；`TestJParaPropChangesW26` 10/10（两 fixture base=3 段属性 item 全部 handled、skip{noFactory/unsupported/error}=0）；蓝本逐分支对照一致

## 下一步
1. W2-7 TextPr/ParaRun 字体族整体属性（RFonts 整体 blob / Lang 整体 blob / Unifill / Shd；JS 蓝本 `ParaTextPrChanges.js`/`RunChanges.js`）。
