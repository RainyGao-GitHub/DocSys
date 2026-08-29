# CURRENT_STATE — 当前工作卡

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。小而新鲜，随当前开发任务随手更新。压缩后读这里即可恢复方向；细节回落到 references。**此文件是会话级产物，不挂在任何任务仓库下。**

## 必读上下文（开工前读）
- `src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md`（office 仓库）：JDK 路径、编译命令、类路径、运行时目录等前提。

## 当前任务
apply_changes JS→Java 全量移植（Word 线）。**W3-6 已完成**（Shape/GroupShape/GraphicFrame/ChartSpace 容器对象变更类）。下一个：**W3-7 及后续**（见开发计划下一节点；ChartFormat.js 图表内部、OleObject 追加 sub、CommonChartFormat/CommonShape 等为已记录的延迟项）。

## References（读这里取细节）
- 计划：`devDocs/apply_changes-JS移植Java开发计划.md`（office 仓库 `src/com/DocSystem/websocket/office`）→ W3-5 节点
- 上下文（权威续接锚点）：`docs/apply_changes-JS移植Java开发上下文.md`（office 仓库）→ 「当前续接锚点 —— W3-4 DrawingML 文字效果完成，下一步：W3-5 其余 DrawingML 对象」
- memory：`porting-faithfulness-principle`（忠实性）、`docsys-multi-git-repos`（多仓库提交归属）

## 开工约束
- 先确认仓库 dirty 状态；有改动先提交再开工（本任务如此）。提交归属见 CLAUDE.md「仓库结构」。
- **★ 验收节奏（用户 2026-08-27 决定）**：先全量移植剩余 ~148 类型（Word 89/Slide 26/Excel 33），边移边做**轻量验证**（编译+蓝本对照/单类型字节往返/模型值断言，不写 golden），**重型三门回归压到最后一环**。完整细则见上下文 §6 首块「验收节奏调整」，计划「验证策略」已同步。

## 当前进展
- **W3-4 DrawingML 文字效果完成**（2026-08-28，office 9c4ce67a / test 79f6569）：
  - 6 类由 SkipProperty 改真实模型，`TestJTextPrPropChangesW34` 6/6

- **W3-5 其余 DrawingML 对象完成**（2026-08-29，office 6e95d0a5 / test c643653）：
  - 新增 7 个变更类：JChangesCNvPr(1022)/NvPr(1023)/UniNvPr(1025)/ShapeStyle(1087)/SpPr(1089)/Geometry(1108)/Path(1109)
  - 蓝本 sdkjs v7.0.1 Format.js changesFactory 492-534 + Geometry.js + Path.js，全量忠实移植
  - JModel：DrawingNode/OpaqueObject 去 final；新增 7 宿主类
  - JChangesFactory 注册 43 条工厂入口（lines 717-772）
  - 验收（轻量）：编译零错误；`TestJChangesW35` 33/33 + W3-4 回归 6/6

- **W3-6 DrawingML 容器对象完成**（2026-08-29，office 61335e29 / test 7b50df5）：
  - 新增 4 个变更类：JChangesShape(1104)/GroupShape(1106)/GraphicFrame(1123)/ChartSpace(1029)
  - 蓝本 sdkjs v7.0.1.34 各 Format/*.js changesFactory；忠实省略该版本不存在的 Shape sub 12-16、ChartSpace sub 13
  - Object(id-ref)/Bool/String/Long 真实建模；ObjectNoId/Content（Shape 9/11、GroupShape 3/6、ChartSpace 18/19/21）延迟安全跳到本条边界
  - JModel 增 4 宿主类（extends OpaqueObject）；HistoryItemType 增常量；JChangesFactory 注册全部 sub；JChangesApplier.createFactoryObject 增 case 1104/1106/1123/1029
  - 验收（轻量）：编译零错误；`TestJChangesW36` 41/41 + W3-5 回归 33/33

## 下一步
1. W3-7 及后续：见开发计划下一节点（ChartFormat.js ~500 图表内部、OleObject 追加 sub、CommonChartFormat/CommonShape 等已记录为 W3-6 范围外延迟项）。
   续接前先读计划确认具体范围。
