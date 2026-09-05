# CURRENT_STATE — 当前工作卡

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。小而新鲜，随当前开发任务随手更新。压缩后读这里即可恢复方向；细节回落到 references。**此文件是会话级产物，不挂在任何任务仓库下。**

## 必读上下文（开工前读）
- `src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md`（office 仓库）：JDK 路径、编译命令、类路径、运行时目录等前提。

## 当前任务
apply_changes JS→Java 全量移植（Slide 线已收官，Excel 线已收官）。**Word/Slide 真实 fixture 录制轮已全部完成**（2026-09-03，S-1/S-2/S-3 + W-1~W-5 全入库，见 Word 清单 §14 / Slide 清单 §11）。**当前阶段：复用清单 skip 升级**（P1 优先：Slide RemoveFromSpTree=**1117|11** 部署版漂移 → 实现+注册断言；图片 fixture 5|15/18/19/20、1107|1/4、1113|2、1000|106；S-2 树已兑现 1197/1198 ChartStyle、1108/1109 Path 等 fallback）→ 最后 Word/Slide 汇总 golden 门收敛。

**S-3 golden 门已全部通过**（2026-09-04，office ac9f346e / test 8fb600b）：TestJSlideMergeGoldenNew S-3 realDiff=0（same=36）。1117|7 Transition + 1117|9 Bg Java 序列化闭环。

### ★ 验证节奏约束（2026-09-05 用户决定）
每完成一个 fixture 的验证和修复后，**必须等用户手动确认通过后**才能开始下一个 fixture。禁止自行连续推进多个 fixture。

## References（读这里取细节）
- 计划：`devDocs/apply_changes-JS移植Java开发计划.md`（office 仓库 `src/com/DocSystem/websocket/office`）→ W3-11 节点
- 上下文（权威续接锚点）：`docs/apply_changes-JS移植Java开发上下文.md`（office 仓库）→ 「当前续接锚点」
- memory：`porting-faithfulness-principle`（忠实性）、`docsys-multi-git-repos`（多仓库提交归属）

## 开工约束
- 先确认仓库 dirty 状态；有改动先提交再开工（本任务如此）。提交归属见 CLAUDE.md「仓库结构」。
- **★ 验收节奏（用户 2026-08-27 决定）**：先全量移植剩余 ~148 类型（Word 89/Slide 26/Excel 33），边移边做**轻量验证**（编译+蓝本对照/单类型字节往返/模型值断言，不写 golden），**重型三门回归压到最后一环**。完整细则见上下文 §6 首块「验收节奏调整」，计划「验证策略」已同步。

## 当前进展
- **Word/Slide 覆盖盘点 + 批次计划写入清单并提交**（2026-09-03，office `147675aa`）：用 Python 直方图解码 8 棵现有 Word/Slide fixture 变更流 → Word 清单 §14 / Slide 清单 §11 增补「真实 fixture 覆盖矩阵 + 待录制批次」（W-1..W-5 / S-1..S-3 + 复用清单）。
- **S-1 fixture 录制入库**（2026-09-03，test `bee1190`）：`测试文件/EditorBinWithChanges_S1删除形状阴影备注.pptx/-2103341622`（data/Editor.bin 46288B + changes0-5.json + output/output.pptx 32826B）。要点：1117|12 AddToSpTree×2、**1117|11 RemoveFromSpTree×1（部署版 v7.0.1.71 漂移，≠清单的 13）**、1089|7 EffectPr×2、1108|7/8+1109 Path、1110|1/3、备注=28|1/28|2 run 变更（无 1129 base）。竖排文字未录成（控件 0 尺寸不可达，如实记录）。
- **W-1 段落属性全家桶 fixture 录制入库**（2026-09-03，test `bee1190` / office doc `aa3a1856`）：`测试文件/EditorBinWithChanges_W1段落属性全家桶.docx/280084512`（Editor.bin 139141B + changes0-3 + output/output.docx 22921B）。单会话 39 条变更 33 类型直方图（Word 清单 §14.4 全表）。**录制方法论教训**：① 段落对话框 checkbox 须点外层 `label`（含 `input.checkbox__native`）并回读 checked 状态；② 颜色菜单选色后**不要按 Escape**（会整个关对话框，本轮丢过一次）；③ 段落选择用「点击首段 + End + ArrowDown」键盘定位第二段（坐标点击不可靠）；④ **部署版 v7.0.1.71 漂移：默认制表位走 2|3 Document.DefaultTab 而非 3|38**；⑤ 同会话勾选再反勾不产生净变更记录。
- 录制配方（沿用）：编辑器 URL `http://localhost:8100/DocSystem/web/office.html?reposId=5&docId=<id>&path=&name=<b64>&langType=ch`；保存=navigate about:blank+等 15s；dockey 按 `C:\DocSysReposes\5\data\OfficeEdit\<docId>\` LastWriteTime 找；fixture 布局=data/{Editor.bin,changes}+output/output.<ext>。
- **W-2 字体全家桶 fixture 录制入库**（2026-09-03，test `422b0e8` / office doc `27219c8f`）：`测试文件/EditorBinWithChanges_W2字体全家桶.docx/1818486778`（Editor.bin 45540B + changes0-9 + output 22663B）。单会话 320 条变更 54 类型（Word 清单 §14.5 全表）：ParaRun 28|1-6/8/10/11/13/14/15/16/17/21/22/23/24/29/30 + ParaTextPr 4|1-5/7/8/10-15/17-20/22/26。**录制方法**：run 级=工具栏按钮（bold/italic/underline/strikeout/上标/下标/fontcolor/highlight/inc·decfont/字体名/字号/change-case）；段落标 rPr=段落-高级设置→字体页（6 复选框+2 spinner）。**教训**：① DE 无独立字体对话框，只有段落高级设置的字体页+工具栏；② 首段点击若落在页眉区会把文本打进页眉（页眉区≈页顶 50px）；③ 文本选择须拖拽，定位用截图像素扫描（截图 2× DPI，CSS 坐标=像素/2）；④ 工具栏「大写」是文本变换非 caps flag，caps 只能走对话框「全部大写」
- **W-3 表格属性全家桶 fixture 录制入库**（2026-09-03，test `023fc4f` / office doc `e0f687cb`）：`测试文件/EditorBinWithChanges_W3表格属性全家桶.docx/115364904`（Editor.bin 45540B + changes0-3 + output 21669B）。单会话 172 条变更 23 类型（清单 §14.6）：Table 9|2/5/6/7/8/11/15/25、TableRow 10|3/4、TableCell 11|3/5/6/7/8、单元格内段落 3|1/30。**教训**：表格边框按钮图标 `borders-twin-*`；自动调整取消后宽度 spinner 仍 disabled；无 id spinner 按行上下文定位。
- **W-4 特殊家族 fixture 录制入库**（2026-09-03，test `305b3ac` / office doc `c5b995b0`）：`测试文件/EditorBinWithChanges_W4特殊家族.docx/-1733997211`（output 41395B，含 comments/footnotes/endnotes 部件）。单会话 247 条变更 32 类型（清单 §14.7）：批注 17|4/5+回复 18|1、脚注 55|1/2、尾注 56|1、内容控件 60|13/15/16/17、样式 3|24、**意外收获 28|40/41 OnStart/EndSplit×5（当前 🟡 Skip 组，可供升级验证）**。
- **W-5 分栏✅/行内公式❌**（2026-09-03，test `44a8f1b` / office doc `20845605`）：`测试文件/EditorBinWithChanges_W5分栏公式.docx/2100343981`（30|22/23/24 分栏 cols num=2）。**行内公式两次录制未落盘**：方程式→分数模板插入后 DocSys 与编辑器 websocket 保存链路异常（Editor.bin 有内容但 changes/output 不 flush，`window.close()` 恶化），公式类型（26 oMath 树/28|42/43）待补录，清单 §14.8 已如实记录。
- ⚠️ **W-5 文档 websocket 保存链路疑似损坏**：该 docId 的后续会话只产生 Editor.bin；下一轮若补录公式建议**新建文档**重录（勿复用 100085323331）。
- **W-5 行内公式补录成功**（2026-09-03，test `0d689e8` / office doc `28421cb0`）：`测试文件/EditorBinWithChanges_W5行内公式补录.docx/-455783043`（26|101/102 oMath+28|40/41+28|33/34）。**★关键突破：方程式 UI 点击在 v7.0.1.37 不可靠，改用 `window.editor.asc_AddMath('fraction')` 一次成功（成功标志=字体框切 Cambria Math）**。
- **S-2 图表装饰修改录制入库**（2026-09-03，test `8a83842` / office doc `57ff5e14`）：`测试文件/EditorBinWithChanges_S2图表装饰修改.pptx/560394054`（1896 条 181 类型！）：1042|3/7-15 标签编辑、1111|22 轴、1112|4；**同时兑现复用清单 1197|1-31/1198|1-9 ChartStyle 全家、1108/1109 Path、图表数据族 1028-1076**。录制方法：图表编辑器内嵌 spreadsheeteditor iframe，单元格=textarea#area_id 输入 Enter 提交。
- **S-3 幻灯片装饰录制入库**（2026-09-03，test `1e533af` / office doc `d6267c17`）：`测试文件/EditorBinWithChanges_S3幻灯片装饰.pptx/1536879443`（1117|7 切换淡化+持续时间 3S、1117|9 背景渐变）。教训：幻灯片背景调色板点击瞬关，改填充类型下拉可靠。


- **去 [UNVALIDATED-E2E] 收口：浏览器录制 15 个真实 fixture 全绿 + 勾销 16 个 marker**（2026-09-03）：
  - 可行性验证 + 录制：DocSys 切 OnlyOffice native 路径（`isOnlyOfficeUsed=1`），浏览器驱动编辑器逐分支编辑，采集真实变更流（`orgChanges/` → fixture 树 `测试文件/EditorBinWithChanges_<名>.xlsx/<dockey>/{data,output}`）+ native golden（x2t `output/output.xlsx`）。
  - 15 fixture：SetTabColor/ChangeMerge/ChangeFrozenCell/Hide/SheetView/SummaryBool/FitToPage/GroupRowCol/StructOps/DataValidation/WorksheetSort/DefinedNames/SheetAddCopy/ProtectedWorkbook/AfColor —— 全部注册进 `TestT8XlsyMergeGolden`（FIXTURES + keyCellExpect），**门全绿（零失败）**。
  - **注册过程修复 4 个真实缺陷**（详见清单 §11.6）：① runtime-id 偏移按文档推断 `inferRuntimeOffset`（新建文档=4/加载=5，原固定 5 对录制文档全报 sheetId 未找到）；② 空表 XLSB 载体保障 `ensureCellDataTargets`（新建空文档无 XLSB 块，ChangeValue 无落点）；③ ShiftCellsRight/AddCols 腾空列样式继承（对偶 JS `_shiftCellsRight` copyRange(prev)+clearDataKeepXf，golden B1/C2 带样空格即源于此）；④ `Integer wsIdx = cond ? map.get : 0` 三元拆箱 NPE 隐患 → `Integer.valueOf(0)`。
  - 门结果：`TestT8XlsyMergeGolden` 21 fixture = **20 全绿 + 批注增删改 5-fail（G2-G5 已知，见清单 §11.3）**。
  - 勾销 16 个 `TestJXlsy*` marker → `[E2E: covered by <fixture> @ TestT8XlsyMergeGolden 2026-09-03]`；保留 4 处（AutoFilterApply.ColorFilter 子路径 / PivotSlicerSkip / ProtectedRange / ThemeFilter.{date/ThemeColor}，录制不可行或未录制）。
  - 未提交：改动含 office 核心（JXlsyApplyChanges/JXlsbWorksheetData + 清单 + fixture 树）+ test 仓库（TestT8XlsyMergeGolden + 16 个 marker 文件 + 15 fixture 树）。按 CLAUDE.md 多仓库规则待提交。

  - **注册 AutoFilter 真实 fixture 进 `TestT8XlsyMergeGolden`（第 6 个）**：变更流早在盘上（`733577657/data/changes`），只缺约定名 golden。参数化 `ConvertBinWithChangesToXLSXwithX2t`（`args[0]=fixtureBaseDir`）→ x2t native 铸 `output/output.xlsx`；删 stale `outpu.xlsx` typo；`assertAutoFilterEffect` 硬断 `<autoFilter>` 定义（数值归一，`10.0≡10`）+ hidden 行数。
  - **覆盖直方图（`TestT703XlsxGaps` 扩至 6 fixture）**：产出 {class/action→fixture} 矩阵（详见清单 §11.1）。**决定性推论**：AutoFilter样本变更流**只有 RowHide(28)×32 + AutoFilters(8)×16，零移动 op**，故其 9 sheet 12694 格重定位**证明不可能来自 apply**（base 转换层分歧）→ Tier3 对该 fixture 降 informational 并如实记录 `[RESIDUAL-GAP]`。
  - **合法勾销/锐化 21 个 marker**（勾销纪律=只清「真实 fixture 命中 + 过门」）：仅 `TestJXlsyAutoFilterApply` 主路径（value-list/custom/top10/dynamic）得真实 E2E 背书 → 改写为 `[E2E: covered by AutoFilter样本 @ TestT8XlsyMergeGolden]`（sheet1/2/3 定义字节级匹配 + hidden 行匹配）；其余 20 分支在 6 fixture 零命中 → 锐化为 `[NO-REAL-FIXTURE: 需编辑器录制]`（19 文件经子代理机械替换 + AutoFilterApply.ColorFilter 子路径 + ThemeFilter.{date/ThemeColor}）。
  - **真实门曝出 2 类真缺口（如实记录，本轮不修）**：① **belowAverage 的 val 未重算列平均**（AutoFilter样本 sheet4：mine val=28 vs golden 28.952380952380953，`AUTOFILTER-DEF-GAP`）；② **★5-fail baseline 归因更正**——`TestT8XlsyMergeGolden` 的 5-fail 全落在**批注增删改 fixture**，实为 {threaded comment 全丢(mine=0/golden=2) + legacy D7 run 文本 + schema new=1 + E7↔H6/F14↔G7 协同重定位}，**非** memory `t76-cell-format-changes` 所记「Java 写出器基线格式 sz11.0」——其中 threaded 全丢/D7/schema new=1 是真实批注 apply/写出缺口。按 W2-4 范式本轮只曝光+文档化，不修复。
  - 门结果：`TestT8XlsyMergeGolden` passed=63 failed=5（5-fail 全在批注 fixture，AutoFilter样本通过）；抽查 `TestJXlsyAutoFilterApply` 52/52 + `TestJXlsyThemeFilter` 22/22（注释改写不动逻辑）全绿。
  - 产物：清单 §11（覆盖矩阵 + 残余缺口表 + 录制配方，含 `OfficeBase.saveOrgChanges:3986` 等 class:line 锚点）。**残余缺口需人工编辑器录制，另起一轮**。

- **最终重型三门回归跑通**（2026-09-02，E3-R5 收官后验收节奏最后一环，无代码改动）：
  - Gate 2（W2 语义门 `TestJMergeJavaGolden_W2`）：**19/19 PASS**（语义断言 + document.xml 体积比 0.89 在 80~120% 容差内）。
  - Gate 3（PPTX `TestComplexFixtureMergeGolden`）：**22/22 PASS**（same=34/benign=1/chartDiff=3 均 T6.6.2c 预期；slide10 形状/连接器全序列化）。
  - Gate 1（Word golden `TestJMergeJavaGolden`）：5/6 —— **唯一 realDiff 在 `word/document.xml`，成分纯为 sectPr（ref 5 节 vs mine 1 节，连带 headerReference/footerReference/pgMar/pgSz/cols/titlePg/pgNumType）**，即 W2-4 已知遗留（用户 2026-08-27 裁定「分节 sectPr 缺失按忠实即通过处理，不再追查」，见 memory `w2-4-sectpr-known-issue`）。**非 E3-R5 引入**（工作树 clean，E3-R5 为 Excel-only 包路径），非新回归；该 golden 门 `realDiff==0` 硬指标早于 W2 sectPr 裁定，为陈旧断言而非代码退化。
  - 结论：三门就「E3-R5 有无破坏既有能力」而言全绿；Word golden 门唯一差异是已裁定接受的 W2-4 sectPr 遗留。Excel 用 x2t 参考对比（各 apply 护栏内已含 round-trip，无独立重型 Excel golden 门）。
- **E3-R5 Slicer(15)/PivotTables(16)/PivotFields(17) 变更跳过完成**（2026-09-02，office `ebe76640` / test `bdd31aa`）：
  - 缺口：三类原落在 `parseOne` 末尾 `else` 兜底 `recordDrop("unhandled-class-action")` → apply fail-loud，阻塞所有含 pivot/slicer 变更的 Excel 文件。
  - 蓝本调查（sdkjs v7.0.1，UndoRedo.js）：`UndoRedoPivotTables`(L3819)/`UndoRedoPivotFields`(L4036) 均调 `ws.getPivotTableById(Data.pivot)`+`pivotTable.stashCurReportRange()`（30+/12 action types，须完整 pivot 对象模型 + 布局重算）；`UndoRedoSlicer`(L4117) 调 `oModel.getSlicerByName(Data.name)`（20+ action types，须 slicer 对象模型）。三者均非二进制层可实现的编辑。
  - 实现：`JXlsyChangeReader` 新增 `else if (classType==15||16||17)` 分支 → 记入新 `pivotSlicerSkips` 列表（"cls=X act=Y"）+ `skipODataNoop`（消费 oData 字节不进 drops）；`else` 兜底保留给真正未知 class。`JXlsyApplyChanges` 对 `pivotSlicerSkips` 非空时打印 stderr 警告，不抛异常（同 drawingSkips 范式）。cell/worksheet 变更在同 buffer 中照常应用。
  - 验收（轻量）：编译零错误 + 蓝本对照忠实（OrgPath 标注三 UndoRedo 类）；新增 `TestJXlsyPivotSlicerSkip` 15/15（A1-A3 单条 15/16/17→pivotSlicerSkips=1/drops=0/items=0 + A4 三条混合=3 + A5 skip 条目含 cls/act + A6 多条累计）；回归 AutoFilter 52/52 + CellError 35/35 + Comment 19/19 + DefinedNames 21/21 全绿
  - ⚠ [PIVOT-SLICER-MODEL-PENDING]：object model 缺失，变更跳过不应用不 fail-loud；[UNVALIDATED-E2E]：无真实 fixture，合成 round-trip

- **E3-R2 SheetAdd wbSheetIdFrom 工作簿内复制场景完成**（2026-09-02，office `dd120fdc` / test `451eb65`）：
  - 缺口：`applySheetAdd` 对 `wbSheetIdFrom≠null`（工作簿内 sheet 复制）直接 throw；wbOptSheet（剪贴板粘贴）亦 throw。
  - 实现：wbSheetIdFrom≠null 路径——按 sheetIdMap 找源 wsIdx，深克隆 `Cont` 树（`deepCloneWorksheetCont` / `deepCloneWsNode`：替换 WS_WORKSHEETPROP body 为新名/新 internalSid，重置所有 WS_XLSBPOS(35) 为 MAX_VALUE，其余 Raw 按 `.clone()` 字节复制，Cont 递归处理）；克隆 XLSB 数据（`cloneXlsbData`：逐条 body 独立复制）；插入、shiftXlsbMap、rebuild maps。wbOptSheet 仍 fail-loud。
  - 验收（轻量）：编译零错误；新增 `TestJXlsySheetAddCopy` 15/15（A1 deepCloneWorksheetCont 替换 WS_WORKSHEETPROP 名/sid + A2 WS_XLSBPOS 重置 MAX_VALUE + A3 Cont 树引用独立；B1 apply 后 2 sheet + B2 insertBefore=0 克隆在前 + B3 alias 注册 + B4 空新建 smoke + B5 opt_sheet 仍 throw）；回归 AutoFilter 52/52 + CellError 35/35 + Comment 19/19 + DefinedNames 21/21 全绿
  - ⚠ [UNVALIDATED-E2E]：无真实含 sheet 复制变更 fixture，合成 round-trip

- **E3-R7 Drawing 变更(bNoDrawing=false)清洁解析完成**（2026-09-02，office `6bfd8220` / test `12c0330`）：
  - 缺口：`parseOne` 对 `!noDrawing` 一律 `recordDrop`（"drawing/AscDFH-family"）→ apply fail-loud，阻塞所有含 drawing 变更的 Excel 文件。
  - 实现：`!noDrawing` 分支改为：读 `String2` changedObjectId（4B 字节数 + UTF-16LE）+ `GetLong` nChangesType（base<<16|sub），记入新 `drawingSkips` 列表（不进 `drops`），return；外层 `s.Seek2(itemEnd)` 消费剩余 change_data 字节。apply() 对 `drawingSkips` 非空时打印 stderr 警告，不抛异常。
  - oracle 问题：`sChangedObjectId` 为运行时 `g_oIdCounter` 瞬态 ID，未持久化到 XLSY binary；Java 侧 oracle 映射（ID→drawing blob 位置）未实现，故当前跳过变更；cell/worksheet 变更在同 buffer 中照常应用。[DRAWING-ORACLE-PENDING]
  - 验收（轻量）：编译零错误 + 蓝本格式对照忠实（OrgPath: UndoRedo.js ~L252-260 / History.js ~L525）；新增 TestJXlsyDrawingSkip 14/14（A1 单条跳过/A2 id+base+sub 提取/A3 两条/A4 空 id/A5 截断边界保护）；回归 ProtectedWorkbook 57/57 + ProtectedRange 25/25 + GroupRow 39/39 + DataValidation 54/54 + FitToPage 20/20 + AutoFilter 52/52 + CellError 35/35 + CommentApply 19/19 + DefinedNames 21/21 + MoveRange 54/54 + ShiftCells 81/81 全绿
  - ⚠ [DRAWING-ORACLE-PENDING]：oracle 基础设施缺失，drawing 变更跳过不应用；[UNVALIDATED-E2E]：无真实 fixture

- **E3-R1 Worksheet(class=1) SetFitToPage(39) + ProtectedRange(56/57) apply 完成**（2026-09-02，office `1fdabc5b` / test `83c3864`）：
  - SetFitToPage(39)：`UndoRedoData_FromTo(bool,bool)` → 落 SheetPr(24)→PageSetUpPr(10)→FitToPage(12)（1字节 WriteBool）；复用 parseSummaryBoolChange 读取路径，新增 applyFitToPageChange（PageSetUpPr 容器代替 OutlinePr，升序插在 TabColor(9) 之后/OutlinePr(13) 之前）；护栏 TestJXlsyFitToPage 20/20
  - AddProtectedRange(56)/DelProtectedRange(57)：`UndoRedoData_ProtectedRange{id:0(数值),to:2(SER_OBJECT)}`，落 ProtectedRanges(42)→ProtectedRange(43)（Read2 attr：AlgorithmName/SpinCount/HashValue/SaltValue/Name/SqRef）；session-local prId→prName map 追踪本会话新增 PR，Delete 靠 Name(4) 字段匹配，文件既存 PR → fail-loud；prList 空→删节点；护栏 TestJXlsyProtectedRange 25/25
  - ⚠ [UNVALIDATED-E2E]：无真实 fixture，合成 round-trip
- **E3-R1 Worksheet(class=1) GroupRow(33)/CollapsedRow(34)=行大纲级别/折叠 apply 完成**（2026-09-02，office `7dd63ee2` / test `27d7749`）：
  - 缺口：`parseWorksheetChange` 对 action 33/34 fail-loud。同 GroupCol(35/36)，Data=`UndoRedoData_IndexSimpleProp(index,oNewVal)` 变更流只含 index+oNewVal 标量（bRow/oOldVal 不序列化，UndoRedo.js:942）。redo（:3082/:3117）：GroupRow(33)→`row.setOutlineLevel(oNewVal)`（clamp[0,7]，WorkbookElems.js:5160）、CollapsedRow(34)→`row.setCollapsed(oNewVal)`（:6052，纯 flag，无 hidden 级联）
  - reader：dispatch 33/34 → `parseGroupIndexScalar`（与 35/36 共用，蓝本 UndoRedo.js:3082/:3117）；产 groupSet/propIndex/groupNewVal
  - model（`JXlsbWorksheetData`）：新增 `setRowOutlineLevel(row, level)`（clamp[0,7]，读改写 body[11] bits0-2，0 则清零）、`setRowCollapsed(row, boolean)`（body[11] bit3=0x08，纯 flag）；
    - Row 落 XLSB ROW_HDR body[11] flags 字节（对偶 Row.toXLSB WorkbookElems.js:5274：bits0-2=outlineLevel>0，bit3=collapsed）；
    - 新增 `dropRowHdrIfTrivial`：全默认无 cell → 丢弃（对偶 JS toXLSB 不写空行）；clamp[0, c_maxOutlineLevel=7]（:57）
  - apply：新增 `applyGroupRow(data, item)` data-path（对偶 applyGroupCol 的 wsCont-path）；dispatch case 33/34 → applyGroupRow；
    - `convertInlineRowsToXlsb` 补 OutLevel(7)=Long/Collapsed(8)=Byte 保留（蓝本 Serialize.js:9180/9182），editor 能改的属性不能在 inline→XLSB 转换时丢失
  - 验收（轻量）：编译零错误无 .class 撒入 src + 蓝本逐分支对照忠实（标 OrgPath）；新增 `TestJXlsyGroupRow` 39/39（A 解析 4 项 + B applyGroupRow 8 项[新建/clamp9→7/level0丢弃/level0保留hidden/collapsed置清/preserve hidden/group+collapsed同时] + C convertInlineRowsToXlsb OutLevel/Collapsed保留 4 项）；回归 GroupCol26/ShiftCells81/MoveRange54/DataValidation54 全绿
  - ⚠ [UNVALIDATED-E2E]：无真实含 GroupRow/Collapsed 变更 fixture，合成 round-trip
- **E3-R1 Worksheet(class=1) DataValidation(48/49/50)=数据验证增删改 apply 完成**（2026-09-02，office `b2e15cf5` / test `84a68d6`）：
  - 缺口：`parseWorksheetChange` 对 action 48/49/50 fail-loud。Data=`UndoRedoData_DataValidation{id:0, to:2}`（property-map），redo：Add(48)→`ws.addDataValidation(to, id)`（UndoRedo.js:3230）、Change(49)→`elems[getById(id).index]=to`（3250）、Delete(50)→`ws.deleteDataValidationById(id)`（3267）。`to`=SER_OBJECT 包 `CDataValidation.Write_ToBinary2`（bool hasRanges+[N+N×{r1,c1,r2,c2}]+4bool+4Long+4presence-str+2presence-formula；CDataFormula=`WriteBool(text!=null)+[WriteString2(text)]`）
  - reader（`JXlsyChangeReader`）：`ACTION_WS_DV_ADD/CHANGE/DELETE=48/49/50` + DV_ID=0/DV_TO=2 + `parseDV`/`parseCDataValidation`/`parseDvString`/`parseDvFormula`（外层 SER_OBJECT bool + 内层 CDataFormula bool 双 bool）；`JXlsyChangeItem` 增 dvSet/dvDelete/dvId/dvRanges[N][4]/4bool/4enum/4str/2formula
  - apply（`JXlsyApplyChanges`）：dispatch 48/49/50 → `applyDataValidation`（findRawChild(32)→parseDvSectionBody→session map）：**session-local `Map<wsIdx, Map<dvId, listIdx>>` 仅追踪本会话 Add 的 DV**（XLSY 无运行时 id 存储，文件已载项 Change/Delete → fail-loud）。Delete=remove+索引右移-1；Change=set(idx)；Add=put(id,size)+add；updateDvRaw 重建外层 body 插在 tag≥40（NamedSheetView/ProtectionSheet/ProtectedRanges）前，全空则不写节点
  - `serializeDvXlsy`（对偶 WriteDataValidation Serialize.js:4000）：**8 恒写**（AllowBlank6/Type5/ErrorStyle9/ImeMode10/Operator11/ShowDropDown14/ShowErrorMessage15/ShowInputMessage16，LEN_BYTE）**+7 null-gated**（Error7/ErrorTitle8/Prompt12/PromptTitle13/SqRef17=sqRefString(ranges)/Formula1 18/Formula2 19，LEN_VARIABLE=WriteString2）；SqRef 范围索引序 `{r1,c1,r2,c2}`→rangeName(c1,r1,c2,r2)
  - 验收（轻量）：编译零错误无 .class 撒入 src + 蓝本逐分支对照忠实（标 OrgPath）；新增 `TestJXlsyDataValidationApply` 54/54（A 解析 Add/Delete + B 建节点/8 恒写+7 null-gated/双项索引/Change 替换/Delete 首项索引右移/未知 id fail-loud×2/插在 ProtectionSheet 前 端到端反射）；回归 MoveRange54/ShiftCells81/MergeApply31/Hide13/FrozenCell40/SetTabColor37/AddCols32 全绿
  - ⚠ [UNVALIDATED-E2E]：无真实 DataValidation fixture，合成 round-trip
- **E3-R1 Worksheet(class=1) MoveRange(13)=区块搬移 apply 完成**（2026-09-01，office `b64e0c0e` / test `9ff39e6`）：
  - 缺口：`parseWorksheetChange` 对 action 13 fail-loud。redo=ws._moveRange(from,to,copyRange,wsTo)（UndoRedo.js:2909 → Workbook.js:6688 `_moveRange`/6542 `_moveCells`），Data=`UndoRedoData_FromTo(from:BBox(0),to:BBox(1),copyRange:Bool(2),sheetIdTo:String(3))`
  - reader：新增 `ACTION_WS_MOVE_RANGE=13` + `FT_COPYRANGE=2/FT_SHEETIDTO=3` + `parseMoveRange`（FT_FROM/FT_TO 走 readBBox4，copyRange 取 int≠0，sheetIdTo 走 String `GetULongLE`+`GetString2LE`）；`JXlsyChangeItem` 增 moveSet/moveFrom{C1,R1,C2,R2}/moveTo{C1,R1,C2,R2}/moveCopyRange/moveSheetIdTo
  - model：`JXlsbWorksheetData.moveRange(fromC1..R2,toC1,toR1,copyRange,dest)` snapshot-first 区块搬移：①先整块快照源带 [fromC1,fromC2]×[fromR1,fromR2]（col 移 colOffset=toC1-fromC1、row 移 rowOffset=toR1-fromR1）②剪切(copyRange=false)清整源带 ③最后写目标带。同表 from==to 早退；目标带恒覆写（空源清目标）。cell-only 忠实边界：不搬样式/边框/合并/超链接/公式依赖，保留 ROW_HDR
  - apply：dispatch case 13 → data.moveRange；sheetIdTo≠null 时经 sheetIdMap→xlsbMap 解析 dest（缺则 fail-loud），跨表 dest 为另一 JXlsbWorksheetData
  - 验收（轻量）：编译零错误无 .class 撒入 src + 蓝本逐分支对照忠实（标 OrgPath）；新增 `TestJXlsyMoveRange` 54/54（A 解析剪切/复制跨表 → class/action/moveFrom·To/copyRange/sheetIdTo/moveSet + B 剪切/复制/重叠/空源清目标/跨表/同表 no-op 端到端逐格断言）；回归 ShiftCells81/AddCols32/GroupCol26/Hide13/FrozenCell40/AutoFilter52/CellError35/Comment/DefinedNames/WorksheetSort38 全绿，T8 golden 49/5 baseline 不变
  - ⚠ [UNVALIDATED-E2E]：无真实 MoveRange fixture，合成 round-trip（同表重叠净结果已手工对照 JS `_moveCells` 列循环）
- **E3-R1 Worksheet(class=1) ShiftCells(6-9)=四方向单元格搬移 apply 完成**（2026-09-01，office `de819d18` / test `10f7853`）：
  - 缺口：`parseWorksheetChange` 对 action 6/7/8/9 fail-loud（unhandled-worksheet-action）。redo=range.deleteCellsShiftLeft/Up、addCellsShiftRight/Bottom（UndoRedo.js:2812/2836/2870/2872 → Workbook.js:6724/6767/6806/6866 `_shiftCells*`），Data=`UndoRedoData_BBox(c1,r1,c2,r2)`
  - reader：新增 `ACTION_WS_SHIFT_CELLS_LEFT/TOP/RIGHT/BOTTOM=6/7/8/9` + `parseShiftCells` 直接读 BBox 成员 c1(0)/r1(1)/c2(2)/r2(3)（dataClassType+len 已被 parseWorksheetChange 消费，故不复用 readBBox4）；`JXlsyChangeItem` 增 shiftBBoxSet/shiftC1..R2
  - model：`JXlsbWorksheetData` 新增 shiftCellsLeft/Right（行区间 [r1,r2] 列向搬移：Left 删 [c1,c2]+col>c2 左移 w、Right col>=c1 右移 w）、shiftCellsTop/Bottom（列区间 [c1,c2] 跨行搬移，snapshot/putRowCells 同 sortRows：Top row>r2 上移 h、Bottom row>=r1 下移 h）。cell-only 忠实边界：不搬样式/边框/合并/超链接，保留 ROW_HDR
  - apply：dispatch case 6/7/8/9 → data.shiftCells*（data-only，shiftBBoxSet 守护）
  - 验收（轻量）：编译零错误无 .class 撒入 src + 蓝本逐分支对照忠实（标 OrgPath）；新增 `TestJXlsyShiftCells` 81/81（A 解析四 action → class/action/shiftC1..R2/shiftBBoxSet + B 四方向端到端逐格搬移断言）；回归 AddCols32/GroupCol26/Hide13/FrozenCell40/AutoFilter52/CellError35/Comment/DefinedNames/WorksheetSort38 全绿，T8 golden 49/5 baseline 不变
  - ⚠ [UNVALIDATED-E2E]：无真实 ShiftCells fixture，合成 round-trip
- **E3-R1 Worksheet(class=1) AddCols(5)=插入列 apply 完成**（2026-09-01，office `efb966ac` / test `8babd55`）：
  - 缺口：`parseWorksheetChange` 对 action 5 fail-loud（AddRows/RemoveCols/RemoveRows 已有，AddCols 不对称缺失）。redo=`ws.insertColsBefore(from, to-from+1)`（UndoRedo.js:2790 → Workbook.js:5412 insertColsBefore → getRange3(...).addCellsShiftRight），Data 与 RemoveCols 同 `UndoRedoData_FromToRowCol` 格式（from/to=列索引）
  - reader（`JXlsyChangeReader`）：`ACTION_WS_ADD_COLS=5` 常量并入现有 `parseFromToRowCol` 分派组（与 RemoveRows/RemoveCols/AddRows/RowHide 共用同一数据格式）；产 item.fromIdx/toIdx
  - apply（`JXlsyApplyChanges`）：dispatch case 5→`data.addCols(item.fromIdx, item.toIdx-item.fromIdx+1)`，与 case 3 RemoveCols 同为 data-only 路径（无 wsCont 路径）
  - `JXlsbWorksheetData.addCols(from,count)`：对称取反 removeCols——`col>=from` 的 cell `setCellCol(c+count)` 右移，**不删任何记录、不清 ROW_HDR（插入后行不变空）、cell-only 不动列宽**（与 removeCols 一致；JS aCols moveHor/clone-prev-col 不在本 record-list 模型内，忠实保持不动）
  - 验收（轻量）：编译零错误无 .class 撒入 src + 蓝本逐分支对照忠实（标 OrgPath）；新增 `TestJXlsyAddCols` 32/32（A 解析 FromToRowCol → class/action/fromIdx/toIdx + B addCols 右移/from=0 边界/无删除无 ROW_HDR 变动/多行独立 端到端）；回归 GroupCol26/Hide13/FrozenCell40/AutoFilter/CellError35/Comment/DefinedNames/WorksheetSort38 全绿，T8 golden 49/5 baseline 不变
  - ⚠ [UNVALIDATED-E2E]：无真实含 AddCols 变更 fixture（T8「增删Sheet_列_行」样本的列差异是协同坐标重映射，无字面 AddCols op），合成 round-trip
- **E3-R1 Worksheet(class=1) Hide(19)=工作表可见性 apply 完成**（2026-09-01，office `d6b1c68d` / test `2c31229`）：
  - 缺口：`parseWorksheetChange` 对 action 19 fail-loud。Hide = `UndoRedoData_FromTo(oldBool,newBool)`，redo 应用 `Data.to` → `ws.setHidden(Data.to)`（UndoRedo.js:2961 / Workbook.js:5001）。工作表激活切换（findSheetNoHidden/setActive）是编辑器 UI 态，不影响 bin 字节
  - reader（`JXlsyChangeReader`）：`ACTION_WS_HIDE=19` 常量 + dispatch→`parseHideChange`（复用 `decodeFromToBool`：取 to→hiddenBool，from 忠实跳过）；产 `JXlsyChangeItem.hiddenSet/hiddenBool`
  - apply（`JXlsyApplyChanges`）：dispatch 19→`applyHide`（复用 applyWorksheetRename 的 WORKSHEETPROP 改写范式）：WorksheetProp(1) body（Read2）内 upsert State(2)=`[2][Byte][EVisibleType]`，hidden→visibleHidden(0)/visible→visibleVisible(2)；State 缺失时追加在 Name/SheetId 之后（对偶 WriteWorksheetProp 写序）；Name/SheetId 等其它属性原样保留
  - 落盘对偶 WriteWorksheetProp（Serialize.js:4257）：`setHidden(bool)` 令 bHidden 恒非 null → State 记录恒写（不删除）
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（各方法标 OrgPath）；新增 `TestJXlsyHide` 13/13（A 解析 hide-true/false → hiddenSet/hiddenBool 断言 + B applyHide 新建 hidden(0)/visible(2)/原位替换/Name+SheetId 保留 端到端反射）；回归 GroupCol26/FrozenCell40/AF52/CellError35/Comment19/DefinedNames21 全绿，T8 golden 49/5 baseline 不变
  - ⚠ [UNVALIDATED-E2E]：无真实含 Hide 变更 fixture，合成 round-trip
- **E3-R1 Worksheet(class=1) GroupCol(36)/CollapsedCol(35)=列大纲级别/折叠 apply 完成**（2026-09-01，office `f5006adf` / test `4916311`）：
  - 缺口：`parseWorksheetChange` 对 action 35/36 fail-loud。Group = `UndoRedoData_IndexSimpleProp(index,bRow,oOldVal,oNewVal)`，`Properties={index:0,oNewVal:1}`——变更流只含 index(成员0)+oNewVal(成员1 标量)，bRow/oOldVal 不序列化（UndoRedo.js:942）。redo（UndoRedo.js:3099/3133）：GroupCol(36)→`col.setOutlineLevel(oNewVal)`（clamp[0,7]，WorkbookElems.js:4750）、CollapsedCol(35)→`ws.setCollapsedCol(oNewVal,index)`→`col.setCollapsed(oNewVal)`（4776，纯 flag 无 hidden 级联）
  - reader（`JXlsyChangeReader`）：`ACTION_WS_GROUP_COL=36`/`ACTION_WS_COLLAPSED_COL=35`（33/34 Row 侧注明暂缓）+ dispatch→`parseGroupIndexScalar`（遍历成员：ISP_INDEX(0)→propIndex、ISP_ONEWVAL(1)→groupNewVal 标量；其余 skipValue）；产 `JXlsyChangeItem.groupSet/groupNewVal`（propIndex 复用 0-based 列号）
  - apply（`JXlsyApplyChanges`）：dispatch 35/36→`applyGroupCol`（复用 ColRecord 基建）：定位/新建 Col@propIndex+1；GroupCol→`lvl=clamp(newVal,0,7); lvl>0 set(OUTLEVEL=7,Long) else remove`；CollapsedCol→`newVal≠0 set(COLLAPSED=8,Byte=1) else remove`；`hasOnlyMinMax()`→整条丢弃；其余列属性（width/hidden 等）显式保留（对偶 setOutlineLevel/setCollapsed 只碰单字段，不同于 applyColProp 的整列重写）
  - 落盘格式：Col OutLevel=`[7][Long][4B LE]`（仅 level>0，对偶 WriteWorksheetCol Serialize.js:4425）、Collapsed=`[8][Byte][1B=1]`（仅真）；均 Read2 框架（tag+lenType+value）
  - **Row 侧 GroupRow(33)/CollapsedRow(34) 暂缓**：XLSB `BrtRowHdr` outlineLevel/collapsed 位布局 + inline Row(10) 路径未核实，避免自创逻辑，拆为后续片
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（各方法标 OrgPath）；新增 `TestJXlsyGroupCol` 26/26（A 解析 GroupCol/GroupCol-0/Collapsed-true/false → groupSet/propIndex/groupNewVal 断言 + B applyGroupCol 新建/level0删记录/clamp9→7/Collapsed-true/false删/保留 width/多列范围命中 端到端反射）；回归 TestJXlsyAutoFilterApply 52/52 + TestJXlsyCellError 35/35 + TestJXlsyCommentApply 19/19 + TestJXlsyDefinedNames 21/21 + TestJXlsyChangeFrozenCell 40/40 全绿，TestT8XlsyMergeGolden 与既有 5-fail baseline 一致
  - ⚠ [UNVALIDATED-E2E]：无真实含 group/collapse 变更 fixture，合成 round-trip 自证字节格式 + 解析数学忠实
- **E3-R1 Worksheet(class=1) ChangeFrozenCell(30)=冻结窗格 apply 完成**（2026-09-01，office d73e91e9 / test ea82bc8）：
  - 缺口：`parseWorksheetChange` 对 action 30 fail-loud。ChangeFrozenCell = `UndoRedoData_FromTo(FrozenBBox(old),FrozenBBox(new),null)`，redo 应用 `Data.to` → `worksheetView._updateFreezePane(to.c1,to.r1)`（UndoRedo.js:3057 / WorksheetView.js:5384）；`to.c1`=冻结列数、`to.r1`=冻结行数（均 0-based），`(0,0)`=清除冻结（pane=null）
  - ★关键：`FrozenBBox extends UndoRedoData_BBox`（成员 c1:0/r1:1/c2:2/r2:3）→ reader **复用 readBBox4**，col=to.c1=bb[0]、row=to.r1=bb[1]；目标 `sheetViews[0].pane` → 落盘 `SheetViews(22)→SheetView(23)→Pane(19)`（对偶 WriteSheetViewPane Serialize.js:4461）
  - reader（`JXlsyChangeReader`）：`ACTION_WS_CHANGE_FROZEN_CELL=30` 常量 + dispatch→`parseChangeFrozenCell`（遍历 FromTo 成员：to(1)=SER_OBJECT→readBBox4→frozenCol=bb[0]/frozenRow=bb[1]；from(0)/copyRange(2)=null 忠实跳过）；产 `JXlsyChangeItem.frozenSet/frozenCol/frozenRow`
  - apply（`JXlsyApplyChanges`）：`SV_PANE=19`+`PANE_*`+`EACTIVEPANE_*` 常量 + dispatch→`applyChangeFrozenCell`/`buildPaneContent`（复用 parseRead1Body/serializeRead1Body/findRawChild/upsertSheetViewsRaw/colLetter/doubleLE）：Pane 内容 = ActivePane（col&row>0=bottomRight/仅row=bottomLeft/仅col=topRight，都=0 不写）+ State 恒`"frozen"`（WriteString3=裸 UTF-16LE）+ TopLeftCell=`colLetter(col)+(row+1)`（CellAddress.getID）+ XSplit=col（col>0 才写）+ YSplit=row（row>0 才写，WriteDouble2=8B LE）；写序插在 `{ShowGridLines(4),ShowRowColHeaders(6),ZoomScale(15)}` 最后一个之后；`(0,0)`=删 Pane 记录（缺 SheetViews/SheetView 时 no-op）
  - ★忠实边界：只应用 redo 的 to；FromTo.from 读后忠实跳过。清除(0,0) vs 设色可区分（col==0&&row==0）。字节格式经 ReadPane(SerializeCommonWordExcel.js:10107) 反查确认：State/TopLeftCell=GetString2LE(len) 裸串、XSplit/YSplit=GetDoubleLE 8B、ActivePane=GetUChar
  - 蓝本 sdkjs v7.0.1.34：UndoRedo.js:3057 / WorksheetView.js:5384 / Serialize.js:4461(WriteSheetViewPane),4444(WriteSheetView 写序) / SerializeCommonWordExcel.js:1111(CellAddress.getID),10107(ReadPane)
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（reader/apply 各方法标 OrgPath）；新增 `TestJXlsyChangeFrozenCell` 40/40（A 解析 freeze/row-only/col-only/clear → frozenSet/frozenCol/frozenRow 断言 + B applyChangeFrozenCell 新建/写序/替换/清除删记录/清除 no-op/row-only bottomLeft/col-only topRight 端到端反射）；回归 TestJXlsyMergeApply 31/31 + TestJXlsySheetViewApply 23/23 + TestJXlsySummaryBool 27/27 + TestJXlsySetTabColor 37/37 + TestJXlsyAutoFilterApply 52/52 + TestJXlsyCellError 35/35 + TestJXlsyCommentApply 19/19 + TestJXlsyDefinedNames 21/21 + TestJXlsyThemeFilter 22/22 全绿，TestT8XlsyMergeGolden 与既有 5-fail baseline 一致（不新增失败）
  - ⚠ [UNVALIDATED-E2E]：现有样例无 frozen 变更，验证为合成 round-trip（自指基线），只证字节格式忠实、非 MS Office 端到端；纳入清单 §10「去 [UNVALIDATED]」贯穿项
- **E3-R1 Worksheet(class=1) SetTabColor(27) apply 完成**（2026-09-01，office ad3d9baf / test d4806da）：
  - 缺口：`parseWorksheetChange` 对 action 27 fail-loud。SetTabColor = `UndoRedoData_FromTo(oldColor|null, newColor|null)`，redo 应用 `Data.to`（`ws.setTabColor(Data.to)`），目标 `ws.sheetPr.TabColor`（工作表标签颜色）
  - ★关键区分：**与 summary 布尔(OutlinePr 内)不同**——TabColor 是 **SheetPr(24) 直属子记录 TabColor(9)**（两级 Read1：SheetPr(24) body→TabColor(9) 记录；record body = WriteColorSpreadsheet **内容**）；写序在 PageSetUpPr(10)/OutlinePr(13) 之前（WriteSheetPr 升序 tag，Serialize.js:4521）
  - reader（`JXlsyChangeReader`）：`ACTION_WS_SET_TAB_COLOR=27` 常量 + dispatch case→`parseSetTabColor`（遍历 FromTo 成员：to(1)=SER_OBJECT 时 `parseColorToBytes` 得 WriteColorSpreadsheet Variable 字节 `[4Blen][content]`→`tabColorBytes`、`tabColorRemove=false`；to=SER_NULL/缺省→`tabColorRemove` 保持 true；from(0) 忠实跳过）；产 `JXlsyChangeItem.tabColorSet/tabColorRemove/tabColorBytes`
  - apply（`JXlsyApplyChanges`）：`SHEETPR_TABCOLOR=9` 常量 + dispatch case→`applySetTabColorChange`（复用 parseRead1Body/serializeRead1Body/findRawChild/upsertSheetPrRaw：设色=剥 Variable 前 4B len 得记录 body→升序位插入 or 原位替换 TabColor(9)；清除=删记录；缺 SheetPr 节点时建节点插在 WorksheetProp(1)/Cols(2)/SheetViews(22) 之后）
  - ★忠实边界：只应用 redo 的 to；FromTo.from 读后忠实跳过。to=null（SER_NULL）与设色可区分（member 显式发 SER_NULL），故清除 vs 设色不混淆。★框架细节：`parseColorToBytes` 出 Variable 形（Styles 直用），但 Read1 记录 body 只需 content，apply 剥前 4B
  - 蓝本 sdkjs v7.0.1.34：UndoRedo.js:3076-3077(Redo Data.to → setTabColor) / Workbook.js:4965-4973(setTabColor 构造 FromTo，赋 sheetPr.TabColor) / Serialize.js:4521(WriteSheetPr → WriteItem(TabColor=9, WriteColorSpreadsheet)) / SerializeCommonWordExcel.js:328(WriteColorSpreadsheet Rgb=0/Theme=2/Tint=3)
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（reader/apply 各方法标 OrgPath）；新增 `TestJXlsySetTabColor` 37/37（A 解析 to=Rgb/Theme(无 tint)/null→tabColorSet/tabColorRemove/tabColorBytes 字节断言 + B applySetTabColorChange 新建插 OutlinePr 前/原位替换/无 SheetPr 建节点/清除删记录/清除无 TabColor 保留其它/建节点插 SheetViews 后，反射调私有 apply）；回归 TestJXlsyMergeApply 31/31 + TestJXlsySheetViewApply 23/23 + TestJXlsySummaryBool 27/27 + TestJXlsyAutoFilterApply 52/52 + TestJXlsyCellError 35/35 + TestJXlsyCommentApply 19/19 + TestJXlsyDefinedNames 21/21 + TestJXlsyThemeFilter 22/22 全绿，TestT8XlsyMergeGolden 与既有 5-fail baseline 一致（不新增失败）
  - ⚠ [UNVALIDATED-E2E]：现有样例无 tabColor 变更，验证为合成 round-trip（自指基线），只证字节格式忠实、非 MS Office 端到端；纳入清单 §10「去 [UNVALIDATED]」贯穿项

- **E3-R1 Worksheet(class=1) SheetPr summary 布尔 37/38 apply 完成**（2026-09-01，office 2318bd57 / test 84a83dd）：
  - 缺口：`parseWorksheetChange` 对 action 37/38 fail-loud。二者 = SetSummaryRight(37)/SetSummaryBelow(38)，均 `UndoRedoData_FromTo(oldBool,newBool)`，redo 应用 `Data.to`，目标 `ws.sheetPr.SummaryRight/SummaryBelow`（大纲/分级显示 summary 方向）
  - ★关键区分：**与 SheetView 屏显布尔簇(SheetViews=22)分属不同分节**——summary 布尔落在 Worksheet 分节的 **SheetPr(24)** 容器，且**内嵌于 OutlinePr(13)**，故是**三级 Read1**：SheetPr(24) body→OutlinePr(13) 记录→attr 记录（tag=c_oSer_SheetPr{SummaryBelow=16/SummaryRight=17}，bool 值 1B WriteBool）
  - reader（`JXlsyChangeReader`）：ACTION 常量 37/38 + SHEETPR_SUMMARY_* tag 常量 16/17；2 dispatch case→`parseSummaryBoolChange`（抽出 `decodeFromToBool` 与 parseSheetViewChange 共用：member==1(to) 取 redo 值、member==0(from) 忠实跳过）；产 `JXlsyChangeItem.spSet/spAttrTag/spBool`
  - apply（`JXlsyApplyChanges`）：WS_SHEETPR=24 + SHEETPR_OUTLINEPR=13/SUMMARY_BELOW=16/SUMMARY_RIGHT=17 常量 + 2 dispatch case→`applySummaryBoolChange`（复用 parseRead1Body/serializeRead1Body/findRawChild：找 SheetPr(24) raw→OutlinePr(13) 记录→attr 列表→替换或追加目标 tag→回写；缺 OutlinePr 记录时建记录、缺 SheetPr 节点时 `upsertSheetPrRaw` 建节点并插在 WorksheetProp(1)/Cols(2)/**SheetViews(22)** 之后——对偶 WriteWorksheet 元素序 Serialize.js:3855 SheetPr 在 SheetViews 之后）
  - ★忠实边界：二者只应用 redo 的 to；FromTo.from 读后忠实跳过。落盘对偶 WriteSheetPr（OutlinePr 门控 Serialize.js:4525）/WriteOutlinePr（4528，各属性 `if null!==` WriteBool）
  - ★蓝本坑（更正压缩前误记）：`c_oSerWorksheetsTypes.SheetPr = 24` **非 0**（Serialize.js:305）；summary 布尔**非** SheetPr 直属而是 OutlinePr(13) 子记录（故三级非两级）
  - 蓝本 sdkjs v7.0.1.34：UndoRedo.js:3078/3080(Redo Data.to) / Workbook.js:5726/5738(setSummaryRight/Below 构造 FromTo) / Serialize.js:951(c_oSer_SheetPr OutlinePr=13/SummaryBelow=16/SummaryRight=17)/:4525 WriteSheetPr/:4528 WriteOutlinePr/:3855 WriteWorksheet 序
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（reader/apply 各方法标 OrgPath）；新增 `TestJXlsySummaryBool` 27/27（A 解析 37/38→spSet/spAttrTag(16/17)/spBool=to + B 三级 Read1 往返 + C applySummaryBoolChange 替换已存在 attr/追加保留其他/无 OutlinePr 记录建记录/无 SheetPr 节点建节点并定位[SheetViews 后 / 无 SheetViews 时 WorksheetProp 后]/幂等末值胜出）；回归 TestJXlsyMergeApply 31/31 + TestJXlsySheetViewApply 23/23 + TestJXlsyAutoFilterApply 52/52 + TestJXlsyCellError 35/35 + TestJXlsyCommentApply 19/19 + TestJXlsyDefinedNames 21/21 + TestJXlsyThemeFilter 22/22 全绿，TestT8XlsyMergeGolden 与既有 5-fail baseline 一致（不新增失败）
  - ⚠ [UNVALIDATED-E2E]：现有样例无 sheetPr summary 变更，验证为合成 round-trip（自指基线），只证字节格式忠实、非 MS Office 端到端；纳入清单 §10「去 [UNVALIDATED]」贯穿项

- **E3-R1 Worksheet(class=1) SheetView 屏显布尔簇 31/32/54 apply 完成**（2026-09-01，office bfd11dd9 / test d9b15c7）：
  - 缺口：`parseWorksheetChange` 对 action 31/32/54 fail-loud。三者 = SetDisplayGridlines(31)/SetDisplayHeadings(32)/SetShowZeros(54)，均 `UndoRedoData_FromTo(oldBool,newBool)`，redo 应用 `Data.to`，目标 `sheetViews[0]` 的 showGridLines/showRowColHeaders/showZeros
  - ★关键区分：**与 Layout(class=11) 的 PrintOptions 打印网格线/标题(WS_PRINTOPT=16)截然不同**——本簇是**屏幕显示**，落在 Worksheet 分节的 **SheetViews(22)** 容器（两级 Read1：SheetViews(22)→SheetView(23) 记录→attr 记录，attr tag=c_oSer_SheetView{ShowGridLines=4/ShowRowColHeaders=6/ShowZeros=9}，bool 值 1B WriteBool）
  - reader（`JXlsyChangeReader`）：ACTION 常量 31/32/54 + SV_* tag 常量 4/6/9；3 dispatch case→`parseSheetViewChange`（遍历 FromTo 成员，member==1(to) 取为 redo 值、member==0(from) 忠实跳过）；产 `JXlsyChangeItem.svSet/svAttrTag/svBool`
  - apply（`JXlsyApplyChanges`）：WS_SHEETVIEWS=22/WS_SHEETVIEW=23 常量 + 3 dispatch case→`applySheetViewChange`（复用 parseRead1Body/serializeRead1Body/findRawChild：找 SheetViews(22) raw→首个 SheetView(23) 记录→attr 列表→替换或追加目标 tag→回写；缺 SheetView 记录时建记录、缺 SheetViews 节点时 `upsertSheetViewsRaw` 建节点并插在 WorksheetProp(1)/Cols(2) 之后——对偶 WriteWorksheet 元素序）
  - ★忠实边界：三者只应用 redo 的 to；FromTo.from 读后忠实跳过（撤销用，此路径不需）。SheetViews 缺失时新建走 WriteWorksheet 元素序定位
  - 蓝本 sdkjs v7.0.1.34：UndoRedo.js:2963/2965/3286(Redo Data.to) / Workbook.js:5014/5028/5042(oData 构造) / Serialize.js:863(c_oSer_SheetView tags)/WriteSheetViews/WriteSheetView
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（reader/apply 各方法标 OrgPath）；新增 `TestJXlsySheetViewApply` 23/23（A 解析 3 action→svSet/svAttrTag(4/6/9)/svBool=to + B 两级 Read1 往返 + C applySheetViewChange 替换已存在 attr/追加保留其他/无 SheetView 记录建记录/无 SheetViews 节点建节点并定位 WorksheetProp 后，反射调私有 apply）；回归 TestJXlsyMergeApply 31/31 + TestJXlsyAutoFilterApply 52/52 + TestJXlsyCellError 35/35 + TestJXlsyCommentApply 19/19 + TestJXlsyDefinedNames 21/21 + TestJXlsyThemeFilter 全绿，TestT8XlsyMergeGolden 与既有 5-fail baseline 一致（不新增失败）
  - ⚠ [UNVALIDATED-E2E]：现有样例无 sheetView 屏显变更，验证为合成 round-trip（自指基线），只证字节格式忠实、非 MS Office 端到端；纳入清单 §10「去 [UNVALIDATED]」贯穿项

- **E3-R1 Worksheet(class=1) ChangeMerge(25)=合并单元格 apply 完成**（2026-09-01，office 70931a47 / test 512295b）：
  - 缺口：`parseWorksheetChange` 对 action 25 fail-loud；合并单元格 range 存放在 Worksheet 分节的 **MergeCells(7)** 容器（子记录 MergeCell(8)，body=裸 UTF-16LE A1 ref 如 "A1:B2"）。结构建模仿已通的 ChangeHyperlink(26) 但更简（MergeCell 无子字段）
  - 变更语义（蓝本 UndoRedo.js:2967 redo，bUndo=false）：oData=`UndoRedoData_FromTo`（Workbook.js:4005，仅 from(0)/to(1) 两 BBox，copyRange/sheetIdTo=null 不序列化）；`from≠null`→删 bbox==from 的合并、`to≠null`→加合并 to。**merge=只 to / unmerge=只 from / change·move=两者**
  - reader（`JXlsyChangeReader`）：`ACTION_WS_CHANGE_MERGE=25` 常量 + case→`parseChangeMerge`；`parseBBoxObj` 重构抽 `readBBox4`（dataClassType+len+成员 c1:0/r1:1/c2:2/r2:3）；产 `JXlsyChangeItem.mergeFrom*/mergeTo*`（-1=null）
  - apply（`JXlsyApplyChanges`）：`applyChangeMerge` 找 WS_MERGECELLS(7) raw→`parseMergeCellsBody`（`[8][len:4][UTF-16LE ref]`）→List<String>；hasFrom 删 `rangeName(from)`、hasTo 去重+加 `rangeName(to)`→`serializeMergeCellsBody`（对偶 WriteMergeCells：`isOneCell`(无冒号)跳过 + WriteByte(8)+WriteString2）→`updateMergeCellsRaw`（删旧节点，body 空则不插；否则插在 Hyperlinks(5) 后、无则 SheetData(9) 后——对偶 WriteWorksheet 元素序）
  - ★忠实边界：`WriteMergeCells` 的 `getDisjointMerged` 重叠归一化未移植（仅重叠输入触发，编辑器阻止重叠；每条 ChangeMerge 携离散非重叠范围）；list 增删（A1 ref 相等）是 mergeManager.add/removeElement 忠实核心
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（reader/apply 各方法标 OrgPath）；新增 `TestJXlsyMergeApply` 31/31（A 解析 merge/unmerge/change 三态 + B body 往返/字节布局/isOneCell 跳过 + C applyChangeMerge 合并·取消·改移·去重·插入顺序[Hyperlinks 后 / 无则 SheetData 后]，反射调私有 parse/serialize/apply）；回归 TestJXlsyAutoFilterApply 52/52 + TestJXlsyCellError 35/35 + TestJXlsyCommentApply 19/19 + TestJXlsyDefinedNames 21/21 + TestJXlsyThemeFilter 22/22 全绿，TestT8XlsyMergeGolden 与既有 5-fail baseline 一致（不新增失败）
  - ⚠ [UNVALIDATED-E2E]：现有样例均无合并动作，验证为合成 round-trip（自指基线），只证字节格式忠实、非 MS Office 端到端；纳入清单 §10「去 [UNVALIDATED]」贯穿项

- **E3-R6 class=19/21/22 ProtectedRange 属性编辑 + ProtectedWorkbook + NamedSheetViews 完成**（2026-09-01，office 404aee68 / test 46871fc）：
  - class=19 UndoRedoProtectedRange 属性变更：SetSqref(1) fail-loud；SetName(2)→Name(4)/AlgorithmName(3)→AlgoName(0)/HashValue(4)→Hash(2)/SaltValue(5)→Salt(3)/SpinCount(6)→Spin(1) 落 ProtectedRanges(42)→PR(43) Read2 body upsert；prSessionMaps 按 wsIdx/prId 追踪名称 + 回写 updatePrRaw；updateSingleRead2Prop 新 helper
  - class=21 UndoRedoProtectedWorkbook：wire format 同 UndoRedoData_ProtectedRange(id=null/to=属性值)；动 23-34 个 workbook protection 属性（LockStructure/Windows/Revision/AlgorithmName/SpinCount/HashValue/SaltValue/Password 等）→ JXlsyWorkbookModel WorkbookProtection(21) Rec 新建/在位 upsert；wbModel 懒加载触发条件扩展含 class=21；applyProtectedWorkbookChange
  - class=22 UndoRedoNamedSheetViews：DeleteFilter(2) redo 是 JS no-op → skipODataNoop；SetName(1) 涉 PPTX binary writer → fail-loud skipOData
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（标 OrgPath）；新建 TestJXlsyProtectedWorkbook 57/57（A 解析 9 项：LockStructure bool/AlgoName byte/SpinCount Long/HashValue Var + NSV DeleteFilter noop/SetName fail-loud + PR SetName/SetSqref fail-loud；B apply 6 项：创建 WbProt Rec/追加第二属性/覆写已有/SpinCount Long/HashValue Variable/round-trip toBytes 自证）；回归 AutoFilterApply 52/52 + DefinedNames 21/21 + CommentApply 19/19 + ProtectedRange 25/25 全绿
  - ⚠ [UNVALIDATED-E2E]：无真实 fixture，合成 round-trip

- **E3-R4b AutoFilter(class=8) Apply(action=5) 两求值分支完成**（2026-08-31，office 431268f4 / test 2d8da5e）：
  - 缺口：AF Apply 的两个求值分支此前均 fail-loud——① DynamicFilter 日期范围 `isHideValueDynamic` 走 `default: throw`（自创逻辑）；② ColorFilter filter 色为 theme 型时 `applyAfColorFilter` 直接 throw。清单原判「框架已在仅补求值」，调查后两半工作量不同（用户 2026-08-31 裁定：两半都做、为 ColorFilter 建主题调色板，不留 fail-loud）
  - **Half 1 DynamicFilter 日期范围**（蓝本 WorkbookElems.js:9339 isHideValue / :9400 Write_ToBinary2 / Serialize.js:1941 WriteDynamicFilter）：`isHideValueDynamic` default→`return false`（对偶 JS `var res=false; switch{above/below}; return res`，日期类型编辑器不隐藏）；`DecodedFilter` 增 `dynValSet/dynMaxVal/dynMaxValSet`，decode case 75 三字段 presence-gated 读回（MaxVal 不再丢弃）；`buildDynamicBody` 对偶 WriteDynamicFilter null-gated（Type 恒写、Val/MaxVal 仅存在才写）——**日期 filter 不再产 JS 会省略的伪 `Val=0.0`**。above/belowAverage 现有语义不变（init 恒算出 Val）
  - **Half 2 ColorFilter ThemeColor**（新建 `JXlsyThemePalette` 语义解析器，office core）：`parse` 扫 MT_OTHER 顶层 Read1 记录找 Theme(5)→PPTX theme blob→`ReadThemeElements`→`ReadClrScheme`→`ReadUniColor`（srgbClr 直接 RGB / sysClr lastClr）逐槽解析出基础 RGB；`resolveExcelTheme` 对偶 `ThemeColor.rebuild`（WorkbookElems.js:542）——`map_themeExcel_to_themePresentation[excelIdx]`→槽→基础 RGB→tint≠0 走 `rgb2hsl/hsl2rgb`（对偶 `AscFormat.CColorModifiers`，g_nHSLMaxValue=255）。`extractRgbFromColorVar` 扩展 theme 型（offset4==0x02）：读 themeIdx+可选 tint(0x03/0x05/8B)→`palette.resolveExcelTheme`；`applyAfColorFilter` 双侧 palette-aware 比 RGB，删 ThemeColor fail-loud 块
  - apply() 懒加载：仅存在 AF Apply(8/5) 变更时才 `JXlsyThemePalette.parse(MT_OTHER 原始字节)`；`PALETTE_HOLDER` ThreadLocal 传入解析路径，finally remove
  - ★忠实性：`resolveExcelTheme` 对「缺槽/不可解析槽（SCHEME/PRST/STYLE/NONE 或空色）」fail-loud（JS rebuild 静默产黑，但本路径 [UNVALIDATED-E2E]，宁暴露不确定性，遵「Java 路径报错不降级」）；`readUniColor` 解析失败返回 -1 哨兵不抛（避免与本次 ColorFilter 无关的槽误爆），真正 resolve 到该槽才 fail-loud；palette==null 遇 theme 色 → IllegalStateException
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（每方法标 OrgPath）；新增 `TestJXlsyThemeFilter` 22/22（独立-oracle 合成字节：①日期不隐藏 ②日期 filter 只落 Type 无伪 Val ③Type+Val+MaxVal 三字段 Double 往返 ④above/below 语义不变 ⑤14 槽 clrScheme 逐 excelIdx 命中 map 槽 RGB ⑥tint 精确手算锚点[黑+0.5→0x7F7F7F/白-0.5→0x7F7F7F/灰保持灰/tint=0≡null] ⑦filter vs cell theme 同/异 idx→不隐藏/隐藏 ⑧palette==null 抛异常）；回归 TestJXlsyAutoFilterApply 52/52 + TestJXlsyCellError 35/35 + TestJXlsyCommentApply 19/19 + TestJXlsyDefinedNames 21/21 全绿，TestT8XlsyMergeGolden 与既有 5-fail baseline 一致（不新增失败）
  - ⚠ [UNVALIDATED-E2E]：无真实 fixture，验证为合成 round-trip（自指基线），只证字节格式 + 解析数学忠实、非 MS Office 端到端；纳入清单 §10「去 [UNVALIDATED]」贯穿项

- **E3-R2b Workbook DefinedNamesChange(action=7) apply 完成**（2026-08-31，office 50fb3d0b / test 0f33884）：
  - 缺口：`JXlsyChangeReader.parseWorkbookChange` 对 action 7 走 recordDrop("DEFERRED") → apply fail-loud。定义名称存放在 **Workbook 分节（MT_WORKBOOK=3）** 的 DefinedNames(3) 子记录；apply 侧此前从不改动 Workbook 分节（rebuildXlsy 只重建 WORKSHEETS/SHAREDSTRINGS/STYLES，MT_WORKBOOK 原样透传）
  - 变更语义（蓝本 UndoRedo.js:2411 UndoRedoWorkbook redo，bUndo=false）：oData=UndoRedoData_FromTo{from,to}；`to==null`→删 from、`from==null`→增 to、两者非空→改（同名原地/改名删旧+追加末尾）。match key=(sheetId, name.toLowerCase())
  - **新建 `JXlsyWorkbookModel`**（office core，MT_WORKBOOK 第 4 可重建分节，参照 JXlsyTableModel）：parse 读 4B outerLen 包裹→顶层 Read1 记录（保原序 raw）→深解析 DefinedNames(3) 为 DefName 列表；toBytes 原序 re-emit、DefinedNames(3) 用列表重写；无 DefinedNames 记录且需新增时插在 BookViews(1) 后。byte-exact 自证
  - reader `parseWorkbookDefinedNames`：FromTo(dataType=5)→DefinedName(dataType=39, {name:0,ref:1,sheetId:2,type:4,isXLNM:5})；产 JXlsyChangeItem.wbDefNameFrom/To
  - apply `applyDefinedNamesChange`：sheetId(runtime GUID)→sheetIdMap→LocalSheetId(0-based wsIndex，null=工作簿级)；增/删/改调 wbModel；**★hidden**：addDefName/setUndoDefName 恒置 false（非 null）→ 落盘恒写 Hidden(3)=false，故所有 to 名 hidden=Boolean.FALSE；**★_xlnm. 前缀**：仅 Print_Area 本地 xlnm 名回加前缀（对偶 WriteDefinedNames:3417），其余 isXLNM 名 fail-loud；未知 sheetId fail-loud
  - rebuildXlsy 增 `byte[] newWbBytes` 参数，8e delta/8f totalSize/8f secBytes 三处比照 MT_STYLES 加 MT_WORKBOOK 分支（懒加载：仅存在 action=7 变更时建 wbModel，否则 null 走原透传）
  - ★忠实性：type 字段(c_oAscDefNameType)不进 XLSY DefinedName 二进制，读入即丢（WriteDefinedName 无 type 字段）
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（每方法标 OrgPath）；新增 `TestJXlsyDefinedNames` 21/21（①无改动 byte-exact ②add+1/Name/Ref 框 ③edit 改 ref 原地 ④delete -1 ⑤Print_Area+isXLNM 前缀 ⑥未知 sheetId 抛异常，⑤⑥反射走 apply 全路径）；回归 TestJXlsyCellError 35/35 + TestJXlsyAutoFilterApply 52/52 + TestJXlsyCommentApply 19/19 全绿
  - ⚠ [UNVALIDATED-E2E]：无真实 fixture，验证为合成 round-trip（自指基线），只证字节格式忠实、非 MS Office 端到端；纳入清单 §10「去 [UNVALIDATED]」贯穿项

- **E3-R4 Cell 错误值 apply 完成（Excel 长尾线首节点）**（2026-08-31，office ca289e08 / test 4f0a339）：
  - 缺口：`JXlsyApplyChanges.applyCellItem` case 3（cellValueType=3 Error）原直接抛"尚未实现"。变更流把错误字符串放在 CCellValue.text(g_oCCellValueProperties.text=0)、type=CellValueType.Error(3)
  - JXlsbWorksheetData：新增 `makeErrorValueBytes`/`errorStringToBErr`/`bErrToErrorString`。字符串↔BErr 单字节映射逐条对偶 x2t **Bes.cpp** fromString/toString（大写比较）：#NULL!=0x00 #DIV/0!=0x07 #VALUE!=0x0F #REF!=0x17 #NAME?=0x1D #NUM!=0x24 #N/A=0x2A #GETTING_DATA=0x2B
  - JXlsyApplyChanges：case 3 写 `upsertCell(row,col,rt_CELL_ERROR, makeErrorValueBytes(text))`（body=col4+style4+BErr1+flags2=11B，BErr@offset8）；缺错误串抛 IllegalStateException。decodeCellValue 补 rt_CELL_ERROR/rt_FMLA_ERROR 读回分支
  - ★忠实性：未识别错误串 / #UNSUPPORTED_FUNCTION!（非标准 XLSB 错误，x2t 亦不映射）→ 抛异常，遵「Java 路径报错不降级」，不静默写 0=#NULL! 产错值
  - 验收（轻量）：编译零错误 + 蓝本逐字段对照 Bes.cpp 忠实；新增 `TestJXlsyCellError` 35/35（8 串→字节对照权威表 + round-trip + 大小写不敏感 + 单字节 + null/空/未识别/#UNSUPPORTED_FUNCTION! 抛异常 + upsertCell 端到端字节布局）；回归 TestJXlsyCommentApply 19/19 + TestJXlsyAutoFilterApply 52/52 全绿
  - ⚠ 既存基线问题（与本节点无关，stash/javac 双向确认）：`TestT8XlsyMergeGolden` 5 fail（[批注增删改] fixture 预存）、`TestT722CellChangeApplier` 编译雷（`reader.unsupportedCount` 字段→方法，Eclipse Unresolved compilation problem，memory 已记）

- **P8 段标(endParaRPr) rPr 变更写出完成**（2026-08-31，office a891e0d5 / test 082781f）：
  - 缺口：apply 侧 ad38513e 已把段标属性变更落到 `JParTextPrNode.prObj`（JTextPr），但**写出侧从不消费**——段落 Rec(1) endParaRPr 在 apply/merge 路径为原样透传 Raw，applied 的 Bold/Italic/Highlight 被丢弃
  - ★**范围修正**（偏离旧记「4|1 Bold/4|2 Italic/4|8 HighLight」）：4|8 是误判——演示编辑器高亮 `AddToParagraph(ParaTextPr{HighlightColor: CreateUniColorRGB})` 发 **CUniColor（TextPr|30）**，从不发 Word HighLight(JColor,sub8)；DrawingML `WriteHighlightColor` 只从 rPr.HighlightColor 发**子记录12**，Word HighLight 在 DrawingML **无表示**。故段标可忠实往返高亮 = **4|30 HighlightColor(CUniColor)**；4|8 保持 apply-only、写出 no-op（忠实）
  - JSlideChangesFactory：`TextPr_HighlightColor(4|30)` 注册 → `JTextPrPropChanges.WholeHighlightColor`（复用 W3-4 建的类，`Base.tp()` 同 dispatch JParTextPrNode）
  - JSlideModelBuilder：新 `ParaMarkLink`（JParTextPrNode↔Rec(1)）+ `paraMarkLinks` + navShapes 捕获 `endParaRPrRec=firstRec(paraSeq,1)` + allocShape 配对 + `materializeIdMapParaMarks()`（对偶 run 的 materializeIdMapProps，合并进 bare content 的 Raw body）
  - JSlideRunPropsCodec：新 `mergeContent(bareContent, delta)`（Bold=attr1/Italic=attr7/Underline=attr18/FontSize=attr17 + HighlightColor=子记录12）+ `setSub`；bare content 格式（0xFA attrs 0xFB subs，无外层 Rec 头，区别 mergeRPr 的 0xFB+Rec(0) rest）
  - JSlideRunPropsWriter：抽出 `writeUniColor`（buildUniFill DRY，字节等价）+ 新 `writeHighlightColorContent`（蓝本 WriteHighlightColor：0xFA 0xFB + Rec(0){WriteUniColor}）
  - JMergeEngine PPTT 路径：materializeIdMapProps 旁增 materializeIdMapParaMarks
  - 蓝本 sdkjs v7.0.1.71：WriteRunProperties(2164)/WriteHighlightColor(2254)/WriteUniColor(2398)；CChangesParaTextPrHighlightColor(ParaTextPrChanges.js:536)
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实；`TestJSlideEndParaRPr` 22/22（A apply 派发 4|30→prObj.highlightColor + B 写出 mergeContent SRGB/SCHEME/子记录12/attr 顺序，独立 mini-parser 交叉校验 + 无 delta 逐字节不变）；回归 Applier 12/12(noHost/error/noFactory=0) + MergeGolden 12/12(零 id 漂移) + TextMutation 5/5 + ContentRoundTrip 10/10 + SpPrEffectPr 40 + TextBodyP2 38 全绿
  - ⚠ 边界未覆盖：空段落/initial-kept-para 无 binary endParaRPr Rec，段标写出不触及（如需另从零构造 Rec(1)）；无真实含段标高亮 fixture，验证为合成 round-trip

- **P4 Slide 装饰(1117|1-10,13-16) 完整建模完成**（2026-08-30）：
  - 蓝本 sdkjs v7.0.1.71：Slide.js changesFactory 91-109 → CSlide 各 sub；HistoryCommon.js 2865-2880 变更类型表
  - 14 sub 接线（JSlideChangesFactory 275-309）：SetShow/SetShowPhAnim/SetShowMasterSp→`JChartChanges.ApplyBool`、SetNum→`ApplyLong`、SetTransition/SetSize/SetBg→`JSlideChangesSlideObjectNoId`、SetLocks→`JSlideChangesSlideSetLocks`、SetCSldName→`ApplyString`、SetComments/SetLayout/SetClrMapOverride/SetNotes/SetTiming→`ApplyObjectRef`
  - 新增：`JSlideChangesSlideObjectNoId`（ObjectNoId 变更类，sub7→transition/sub8→size/sub9→bg，nFlags 门 New/Old）、`JSlideChangesSlideSetLocks`（6×readObject，无 nFlags 头——蓝本 CChangesDrawingSlideLocks DrawingsChanges.js:761）、`JSlideSlideReader`（readBgPr/readBg/readBaseCoords/readSlideTransition/readSlideLocks）
  - JSlideModel.Slide 增 16 字段（show/showMasterPhAnim/showMasterSp/num/transition/width/height/bg/6 lock/slideComments/layout/cSldName/clrMap/notes/timing）
  - ★**修正常量**：RemoveFromSpTree 由误标 `|13` 更正为 `|11`（蓝本 HistoryCommon.js:2875-2877，原 `|13` 与 SetCSldName 冲突），SetCSldName=`|13`
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实；`TestJSlideSlideDecoration` 33/33（14 sub 读取+wiring 值断言）；回归 `TestJSlideRemoveFromSpTree` 13/13（常量修正后重新编译首跑 13/13，先前失败为陈旧 .class）、Applier 12/12、MergeGolden 12/12

- **Slide_RemoveFromSpTree(1117|13) 真实注册 + ApplyContent.remove 对齐蓝本 identity 语义完成**（2026-08-30，office aeb084de / test 4544374）：
  - JSlideChangesFactory：Slide_RemoveFromSpTree 由 ⏭ fallback SKIP（删除形状不生效）改真实注册为 `JChartChanges.ApplyContent(→slide.spTree)`，与 AddToSpTree(12) 同宿主导流路径（蓝本 Slide.js:145-146 二者都映射 `oClass.cSld.spTree`）
  - JChartChanges.ApplyContent.apply() remove 分支：『下标硬删 arr.remove(pos)』改为蓝本 `CChangesDrawingsContentPresentation.Load()` remove 分支的 **identity 语义**——先试 `aContent[Pos]===item` 处 splice，不符则从尾部反向扫第一个 `===item` 处 splice，删一即 break
  - 忠实性核对：`CChangesBaseContentChange.ReadFromBinary`(HistoryCommon:3937) 恒设 `UseArray=true` 按 nCount 填 PosArray → Java `posList.get(i)` 与 JS `this.PosArray[nIndex]` 完全一致，无单 pos/数组基准分歧；5 个 ApplyContent 现有消费者全为 `isAdd=true`（add 路径），此改动不波及
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实；新增 `TestJSlideRemoveFromSpTree` 13/13（Pos命中/反向扫/仅一条删空/多id各删/id解析不到不NPE）；回归 TestJSlideChangesApplier 12/12(noFactory/noHost/error 全0) + TestJSlideMergeGolden 12/12

- **P3 SpPr_SetEffectPr(1089|7) 完整建模完成**（2026-08-31，office 4579062a / test 30c015b）：
  - 蓝本 sdkjs v7.0.1.71：CEffectProperties.Read_FromBinary(Format.js:7614)→CEffectLst(Format.js:7747)→8效果类；WriteEffect(SerializeWriter.js:2578)/WriteEffectLst(4307)
  - JSlideSpPrModel：新增 EffectPr/EffectLst + 8效果类(Blur/FillOverlay/Glow/InnerShdw/OuterShdw/PrstShdw/Reflection/SoftEdge) + EFFECT_* 常量
  - JSlideSpPrReader：readEffectPr/readEffectLst/8个per-effect读取方法；skipEffect 从旧stub改为真实dispatch（修复readBlipFill编译漏洞）
  - JSlideSpPrWriter：移除rawBytes透传stub，新增buildEffectPrRecord/writeEffectPr_toSub/writeEffectLst/8个writeEffect_*方法
  - 接线：JSlideChangesSpPrObjectNoId private readEffectPr→委托JSlideSpPrReader.readEffectPr；JSlideContentReader writeEffectPrRaw_toSub→writeEffectPr_toSub
  - 验收（轻量）：编译零错误 + 蓝本逐字段对照忠实；新增 TestJSlideSpPrEffectPr 40/40；回归 Applier 12/12(error=0) + MergeGolden 12/12 + ContentRoundTrip 10/10 + TextMutation 5/5 + TextBodyP2 38/38 + RemoveFromSpTree 13/13

- **P2 TextBody SetBodyPr/SetLstStyle 完整建模完成**（2026-08-30，office 8c9d835e / test 63c6731）：
  - 蓝本 sdkjs v7.0.1.71：`CChangesDrawingsObjectNoId`(DrawingsChanges.js:298) → `CChangesBaseObjectProperty`(HistoryCommon:4273) nFlags+New/Old 内联对象；New=CBodyPr(Format.js:10011)/New=TextListStyle(Format.js:11531)
  - 新增：`JBodyPrModel`（CBodyPr 20 属性+prstTxWarp+textFit 模型+readBodyPr）/`JTextListStyleModel`（10 级模型+readTextListStyle）/`JSlideChangesTextBodyObjectNoId`（ObjectNoId 变更类，sub=1→bodyPr，sub=2→lstStyle）
  - 复用关键：CParaPr 是全局类——TextListStyle 与 Word 共用同一 `Read_FromBinary`(Styles.js:16799)，故 `JTextListStyleModel` 直接复用 Word `JPropReader.readParaPr`+`JParaPr`，不重新建模（忠实性依据：format.js:11537 `new CParaPr()` 直接引用全局 CParaPr）
  - TextBody 增 bodyPr/lstStyle 字段（JSlideModel）；factory 1110|1/2 由 SkipProperty 改真实建模
  - 验收（轻量）：编译零告警 + 蓝本逐字段对照忠实；新增 `TestJSlideTextBodyP2` 38/38（bodyPr 20属性+prstTxWarp preset/avLst+textFit type/fontScale/lnSpcReduction、lstStyle 10级 0/2 级有值其余 null、nFlags=0 时 New+Old 只 New 施加、未知 sub 安全）；回归 TestJSlideChangesApplier 12/12(skipByType={}) + TestJSlideTextMutation 5/5 + TestSlideBodyPrCodec 3/3 + TestJSlideContentRoundTrip 10/10 + TestJSlideMergeGolden 12/12

- **Slide 文本属性 11 类由 SkipProperty 改真实 Word 实现完成**（2026-08-30，office ad38513e）：
  - JSlideChangesFactory：TextPr Bold/Italic/HighLight/Value/RFonts(Ascii/HAnsi/EastAsia)/Lang/Unifill + ParaRun OnStartSplit/OnEndSplit 由 SkipProperty/StringProperty stub 改指向 Word 侧 `JTextPrPropChanges.*` 真实类
  - 复用前提：`JTextPrPropChanges.Base.tp()` 同时 dispatch `JModel.Run` 与 `JBinIdAllocator.JParTextPrNode`，Slide 宿主可直接复用不 no-op（编辑前已核实，避开「看似移植实则 no-op」陷阱）
  - 保持不动：TextPr sub=4（未知语义，fixture×1）SkipProperty；ParaRun_ReviewType SkipProperty；ParaRun_Lang_Val JChangesBaseStringProperty
  - 验收（轻量）：编译零错误；`TestJSlideChangesApplier` 12/12（noFactory=0/noHost=0/error=0，368 项无字节错位）+ `TestJSlideMergeGolden` 12/12（slide2 非空文本节点与 Nashorn golden 完全等价）+ `TestJSlideTextMutation` 5/5（RunText 重建+目标 run 改值+其余保留）

- **Shape_SetBDeleted(1104|1) 完成**（2026-08-30，office 0a1b39a3 / test cad96ae）：
  - CShape 的 SetBDeleted 是渲染相关变更（bDeleted 决定形状是否渲染，非纯外观），原走 DRAWING_PARENT_1104_Sub1 SkipProperty 静默丢弃，改为真实读+落位
  - 蓝本 v7.0.1.71 GraphicObjectBase.js:45 CChangesDrawingsBool（nFlags bit1=New undef/bit2=New true），与 SetWordShape(1104|10)/Xfrm flipH/V 同格式
  - JChangesShape 扩 case 1（reader 读位打包 Bool + apply 写 ShapeHost.bDeleted）；JModel.ShapeHost 增 bDeleted；JChangesFactory 注册 TYPE_Shape|1 并移除失效的 DRAWING_PARENT_1104_Sub1（与 TYPE_Shape|1 同 key，已被覆盖）
  - 验收（轻量）：编译零错误 + 蓝本对照忠实；`TestJChangesW36` 42/42（新增 Shape_SetBDeleted 断言）+ 回归 ParaDrawing6 21/21 + ApplierRun noHost/noFactory/createReadError 全 0
  - **SkipProperty 残余扫查结论**：Word 线已无遗漏。剩余 SkipProperty 均为有意边界——ImageShape 容器 graph（1107|1/4/5/6）与 DrawingML 父类 ref（1113|2, 1000|106）属不透明对象图、Section Header/Footer ref（12-17）为几何优先 DEFERRED，皆非 Word 文本保真缺口

- **W4 ParaDrawing 剩余 6 sub 完成**（2026-08-30，office aaeff82c / test 47c70c3）：
  - JChangesFactory：SetWrapPolygon(5|11)/SetParent(5|15)/SetParaMath(5|16)/SetSizeRelH(5|18)/SetSizeRelV(5|19)/Form(5|20) 由 SkipProperty 改真实类
  - 三种字节格式（蓝本 v7.0.1.71 ParaDrawingChanges.js 逐分支对照）：
    - WrapPolygon/Parent → readObject(Format.js:757)=Bool(isReal)+[String2 id]，经 resolver.getById 解析（新 JChangesDrawingObjectRef）
    - ParaMath → ★自定义 nFlags bit1=New undef/bit2=Old undef + String2 id（新 JChangesDrawingParaMath，非标准 0x02/0x04）
    - SizeRelH/V → ★裸格式（无 nFlags）Bool(undef)→[Long From+Double Pct]（新 JChangesDrawingSizeRel）
    - Form → CChangesBaseBoolValue，复用 JChangesDrawingBoolProperty 加 FORM 分支（并补上原 apply() 漏掉的 case FORM 落位）
  - JModel.Drawing 增 6 字段（wrappingPolygon/parent/paraMath/sizeRelH{From,Pct}/sizeRelV{From,Pct}/drawingForm），apply 写入并置 dirty
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实；`TestJChangesParaDrawing6` 21/21 + 回归 W27FontFamily 27/27 + W27Split 18/18 + W41a/W41b 无失败 + ApplierRun noHost/noFactory/createReadError 全 0（id 漂移探针全绿）

- **W2-7 ParaRun split/数学断点 4 类完成**（2026-08-30，office 334601ac / test b1bd5f7）：
  - JTextPrPropChanges：新增 OnStartSplit(28|40)、OnEndSplit(28|41)、MathAlnAt(28|42)、MathForcedBreak(28|43)
  - OnStartSplit/OnEndSplit：CChangesBase，协作编辑信令，apply=no-op
  - MathAlnAt：★自定义 nFlags（bit1=New undef/bit2=Old undef，非标准 0x02/0x04）；apply 复刻 Apply_AlnAt：仅 brk 已存在时写 brk.alnAt
  - MathForcedBreak：CChangesBase，nFlags bit1=bInsert/bit2=alnAt undef；apply=Redo（bInsert→建 brk；else→brk=null）
  - JChangesFactory：4 条由 SkipProperty 改真实类；HistoryItemType：4 行注释更新
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实；`TestJChangesW27Split` 18/18 + 回归 W27FontFamily 27/27 + W4Ole 22/22 + W41a 37/37 + W41b 87/87 全绿

- **W2-7 字体族整体属性完成（204 系列节点）**（2026-08-30，office 11a273cf / test 7a3d150）：
  - JTextPrPropChanges：新增 RFontsAscii/HAnsi/CS/EastAsiaTheme（nFlags bit1=Color/bit2=New undef/bit4=Old undef + String2 New/Old，落 run.Pr.RFonts.*Theme；TextPr 31-34 与 ParaRun 45-48 共用同字节格式）+ MathStyle（LongProperty→run.MathPrp.sty）+ MathPrp（ObjectProperty，IsCreateEmptyObject=true→undef 建空 CMPrp；CMPrp/CMathBreak 自长格式）
  - JModel：Run 增 mathPrp（恒 new JMPrp()，镜像 JS new CMPrp()）+ JMPrp/JMPrpBreak 模型类
  - JChangesFactory：10 条 SkipProperty 注册改真实类（TextPr 31-34 + ParaRun 32/33/45-48）；HistoryItemType 10 处注释修正
  - 蓝本 sdkjs v7.0.1.71：RunChanges.js CChangesRunRFontsThemeBase(2632)/AsciiTheme(2698)/MathStyle(1987)/MathPrp(2016)；mathContent.js CMPrp(945)；borderBox.js CMathBreak(109)；HistoryCommon.js CChangesBaseObjectProperty(4259)/LongProperty(4348)
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实；`TestJChangesW27FontFamily` 27/27 + 回归 ApplierRun 19/19 + W3-5~13 全绿 + W4-1a/b/Ole/oMath/修订 全绿

- **W4 oMath（base=26，57 sub，树读取+变更+护栏）完成（W4 defer 桶第五节点）**（2026-08-30，office d944d688 / test ec05208）：
  - JMathReader：镜像 Serialize2.js ReadMathArg ~30 handler，id 分配顺序与 JS Get_NewId() 精确一致；Delimiter/EqArr/Matrix 用两步法（先收 offset 再 alloc，Seek2 读内容）；alloc 改 package-private
  - JModel：新增 CEqArray、CDelimiter.hideBegOper/hideEndOper（Integer）、CLimit.lim（CMathContent）字段；CMathContent.content 改 List<Elem>（允许 Run 入内容列表）；补 import JProps
  - JBinIdAllocator：readParContent 前置 OMathPara(8)/OMath(9)/MRun(25) 分支
  - JChangesMath：57 sub 统一 dispatcher；LongProperty/BoolProperty/ContentChange/RFontsName/HighLight/ReviewType/ObjectProperty/GroupChrPr/MatrixAddRm/ColumnJc/Interval 七大格式
  - JChangesFactory：注册 57 条（TYPE_Math | 101~1401）；HistoryItemType 801/802 注释修正（LongProperty, raw_HideBegOperator）
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（sdkjs v7.0.1.71）；`TestJChangesW4OMath` 90/90 + W4Ole 22/22 + W4-1a 37/37 + W4-1b 87/87 + ApplierRun 19/19 + W3-12 40/40 + W3-13 21/21 全绿

- **W4 OLE（ImageShape OLE 图片对象 7 sub）完成（W4 defer 桶第四节点）**（2026-08-30）：
  - 新增：JChangesImageShapeOle（单 dispatcher），替换 ImageShape 1107|7-13 的 6 个 SkipProperty 静默丢弃（其中 7-13 原未注册/跳过）
  - 字节格式忠实蓝本（OleObject.js + DrawingsChanges.js）：SetData(7)/SetApplicationId(8)/SetObjectFile(10)=CChangesDrawingsString(Long nFlags+String2 New/Old)；SetPixSizes(9)=CChangesDrawingsObjectNoId→COleSize(双 Long w/h)；SetOleType(11)=CChangesDrawingsLong；SetBinaryData(12)=CChangesOleObjectBinary(GetBool(hasData)+[Long len+Buffer])；SetMathObject(13)=CChangesDrawingsObject(String2 id→resolver 解析对象，同 Drawing.graphicObj 约定)
  - 注意：COleObject.getObjectType()=historyitem_type_OleObject(1125<<16)，但 Set* 变更记录仍以 1107|sub；故只注册 1107 base，未建 1125 createFactoryObject 分支
  - 宿主模型：JModel.ImageShape 增 oleData/oleApplicationId/olePixWidth/olePixHeight/oleObjectFile/oleOleType/oleBinaryData/oleMathObject；HistoryItemType 增 ImageShape_SetData/ApplicationId/PixSizes/ObjectFile/OleType/BinaryData/MathObject 七常量；JChangesFactory 注册 7 条
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（nFlags 门位/COleSize 双 Long/Binary Bool 门均核对）；`TestJChangesW4Ole` 22/22 + W4-1a 37/37 + W4-1b 87/87 + W3-5~13 全绿（33/41/10/32/7/10/31/40/21）+ ApplierRun 19/19

- **W4-1b SdtPr 嵌套表单对象完成（W4 defer 桶第二节点；9/10/12/13/14/15/21/22/23，SdtPr 全部 24 sub 真实实现）**（2026-08-29）：
  - 新增：JChangesSdtPr 六嵌套对象对偶读器 readCheckBoxPr/readComboBoxPr/readDatePickerPr/readTextFormPr/readFormPr/readPictureFormPr（字段读序一一对偶 SdtPr.js ReadFromBinary），替换 W4-1a 的 9 个 UnsupportedOperationException fail-loud defer
  - 基类语义忠实（HistoryCommon.js:4273 CChangesBaseObjectProperty）：New/Old undef 且 IsCreateEmptyObject=false（各子未 override）→ 无字节；★Old present 照样消费读进弃对象防流错位
  - apply 对偶 private_SetValue：9 CheckBox→Pr.CheckBox、10 CheckBox_Checked→Pr.CheckBox.Checked（仅非空才写，蓝本 SdtPrChanges.js:456 有 guard）、12→Pr.ComboBox、13→Pr.DropDown、14→Pr.Date、15→Pr.TextPr、21→Pr.TextForm、22→Pr.FormPr、23→Pr.PictureFormPr
  - 改动：JModel SdtPr 增 9 字段 + 6 模型类（SdtCheckBoxPr/SdtListItem/SdtComboBoxPr/SdtDatePickerPr/SdtTextFormPr/SdtFormPr/SdtPictureFormPr）；TextPr(15) 复用 JPropReader.readTextPr、CombBorder/Border 复用 readBorder、FormPr Shd 复用 readShd
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（6 读器逐字段核对 SdtPr.js；IsCreateEmptyObject 无 override、SetValue 全部核对）；`TestJChangesW41b` 87/87（含 Old+New 双 present 消费、New undef 覆写、CheckBox_Checked null-host 不 NPE）+ W4-1a 37/37 + W3-5~13 回归全绿（33/41/10/32/7/10/31/40/21）

- **W4-1a SdtPr(base=60) 扁平子集完成（W4 defer 桶首节点）**（2026-08-29，office f768bbbc / test 61becb0）：
  - 新增：JChangesSdtPr（单 dispatcher，24 sub 全注册）。宿主 JModel.Sdt 经 allocSdt 注册进 idMap，private_SetValue→Class.Pr.*
  - 实建 14 扁平子：String(1 Alias/3 Tag/16 Placeholder)、Long(2 Id/4 Label/5 Lock/7 Appearance)、Bool(11 Picture/17 ShowingPlcHdr/18 Equation/19 Text/20 Temporary)、DocPartObj(6 自定义 6 位 nFlags)、Color(8 ObjectProperty CDocumentColor,IsCreateEmptyObject=false)
  - 改动：JModel SdtPr/SdtDocPartObj + Sdt.sdtPr、HistoryItemType TYPE_SdtPr+23 常量、JChangesFactory 循环注册
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（base 类归属/DocPartObj 位编码/Color 默认 false 均核对 SdtPrChanges.js v7.0.1.x）；`TestJChangesW41a` 37/37（defer fail-loud 断言已随 W4-1b 移除）+ W3-7~13 回归全绿

- **W3-13 Glossary/DocPart 完成（Word W3 家族收官）**（2026-08-29，office a69f14c3 / test 977b9c5）：
  - 新增：JChangesGlossary(67，1 sub AddDocPart：String2 id→Redo DocParts[Id]=Get_ById(Id))、JChangesDocPart(68，7 subs)
  - DocPart 属性：Name/Style/Description/GUID=CChangesBaseStringProperty、Types/Behavior=CChangesBaseLongProperty、Category=CChangesBaseObjectProperty(IsCreateEmptyObject=false，CDocPartCategory{Name String2+Gallery Long}) 全→ Pr.*
  - 改动：HistoryItemType 常量 8 条、JModel GlossaryDocumentHost/DocPartHost/DocPartCategory、JChangesApplier case 67/68、JChangesFactory 8 条
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（Category Name+Gallery 顺序/IsCreateEmptyObject 默认 false 均已核对 HistoryCommon.js+GlossaryDocument.js）；`TestJChangesW313` 21/21 + W3-12 40/40 + W3-11 31/31 + W3-10 10/10 + W3-9 7/7 + W3-8 32/32 + W3-7 10/10 全绿

- **W3-12 Document 文档级设置完成**（2026-08-29，office d11b163c / test 249a2dc）：
  - 新增：JChangesDocument(9 subs 3-11)——DefaultTab/EvenAndOddHeaders/DefaultLanguage/MathSettings/SdtGlobalSettings/GutterAtTop/MirrorMargins/SpecialFormsGlobalSettings/TrackRevisions
  - 混合基类：CChangesBase(3/4/5/6/11)+CChangesBaseObjectProperty(7/10,IsCreateEmptyObject=true)+CChangesBaseBoolProperty(8/9)；宿主经 owner id="2" 解析到 topDoc DocContent（AddItem/RemoveItem 同宿主，无需 createFactoryObject case）
  - 嵌套对象忠实对偶：CMathPropertiesSettings(16 位可选)/CSdtGlobalSettings(Color+ShowHighlight)/CSpecialFormsGlobalSettings(nFlags&1→Highlight)/CDocumentColor(复用 JPropReader.readColor)
  - 改动：HistoryItemType 常量 9 条、JModel DocContent 增 9 字段+3 holder、JChangesFactory 9 条
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实；`TestJChangesW312` 40/40 + W3-11 回归 31/31 + W3-10 10/10 + W3-9 7/7 + W3-8 32/32 + W3-7 10/10

- **W3-11 Footnote/Endnote 容器完成**（2026-08-29，office dd0b2c52 / test 075ad4d）：
  - 新增：JChangesFootnotes(5 subs 1-5)、JChangesEndnotes(2 subs 1-2)
  - Footnotes(56)：Add/Remove(String2 id→put/remove)、SetSeparator/ContSep/ContNotice(Long nFlags+可选 New/Old id-ref)
  - ★SetSeparator 忠实复现 JS 原生 bug（New/Old 两分支都赋 this.New，最终值仅由 Old 决定；nFlags=2 丢弃 New）
  - 改动：HistoryItemType 常量、JModel FootnotesHost/EndnotesHost、JChangesApplier case 56/69、JChangesFactory 7条
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实；`TestJChangesW311` 31/31 + W3-10 回归 10/10 + W3-9 7/7 + W3-8 32/32 + W3-7 10/10

- **W3-10 Field 域完成**（2026-08-29，office 846d3a8e / test 08d85f4）：
  - 新增：JChangesField(4 subs)——AddItem/RemoveItem(id 引用+splice)、FormFieldName/FormFieldDefaultText(BaseStringProperty)
  - AddItem/RemoveItem 走 CChangesBaseContentChange（count+{pos,id}+color）；RemoveItem 按流序 raw-pos 删除复现 JS identity-check
  - 改动：HistoryItemType 常量、JModel FieldHost、JChangesApplier case 55、JChangesFactory 4条
  - 验收（轻量）：编译零错误；`TestJChangesW310` 10/10 + W3-9 回归 7/7 + W3-8 32/32 + W3-7 10/10

- **W3-9 Numbering 编号定义完成**（2026-08-29，office 64225f6e / test 951bb39）：
  - 新增：JChangesAbstractNum(5 subs)、JChangesNum(2 subs)、JNumberingLvl(+LvlText 2 元素类)、JNumOverride
  - 改动：HistoryItemType 常量、JPropReader.readNumberingLvl/readNumOverride、JModel AbstractNumHost/ListNumHost、JChangesApplier case 16/63、JChangesFactory 7条
  - 验收（轻量）：编译零错误；`TestJChangesW39` 7/7 + W3-8 回归 32/32 + W3-7 回归 10/10

- **W3-8 Style(23)/Styles(24) 完成**（2026-08-29，office c9233c67 / test 9a3338d）：
  - 新增：JChangesStyle(29 subs 1-18+101-111)、JChangesStyles(26 subs)、JTableStylePr(5子)
  - 改动：HistoryItemType 常量、JPropReader.readTableStylePr、JModel StyleHost/StylesHost、JChangesApplier case 23/24、JChangesFactory 55条
  - 验收（轻量）：编译零错误；`TestJChangesW38` 32/32 + W3-7 回归 10/10

- **W3-4 DrawingML 文字效果完成**（2026-08-28，office 9c4ce67a / test 79f6569）：
  - 6 类由 SkipProperty 改真实模型，`TestJTextPrPropChangesW34` 6/6

- **W3-5 其余 DrawingML 对象完成**（2026-08-29，office 6e95d0a5 / test c643653）：
  - 新增 7 个变更类：JChangesCNvPr(1022)/NvPr(1023)/UniNvPr(1025)/ShapeStyle(1087)/SpPr(1089)/Geometry(1108)/Path(1109)
  - 蓝本 sdkjs v7.0.1 Format.js changesFactory 492-534 + Geometry.js + Path.js，全量忠实移植
  - JModel：DrawingNode/OpaqueObject 去 final；新增 7 宿主类
  - JChangesFactory 注册 43 条工厂入口（lines 717-772）
  - 验收（轻量）：编译零错误；`TestJChangesW35` 33/33 + W3-4 回归 6/6

- **W3-7 Comment/批注完成**（2026-08-29，office df4c162b / test 3eebb45）：
  - 新增 7 个变更类：Comment(17) Change/TypeInfo/RangeStart/RangeEnd、Comments(18) Add/Remove、ParaComment(54) CommentId
  - 蓝本 sdkjs v7.0.1.34 word/Editor/CommentsChanges.js；忠实省略未注册的 Comment sub 3 Position
  - Change 逐字段读 CCommentData(含递归回复)；JModel 增 CommentHost/CommentsHost/ParaCommentHost + CommentData 建模
  - 验收（轻量）：编译零错误；`TestJChangesW37` 10/10 + W3-6 回归 41/41

- **W3-6 DrawingML 容器对象完成**（2026-08-29，office 61335e29 / test 7b50df5）：
  - 新增 4 个变更类：JChangesShape(1104)/GroupShape(1106)/GraphicFrame(1123)/ChartSpace(1029)
  - 蓝本 sdkjs v7.0.1.34 各 Format/*.js changesFactory；忠实省略该版本不存在的 Shape sub 12-16、ChartSpace sub 13
  - Object(id-ref)/Bool/String/Long 真实建模；ObjectNoId/Content（Shape 9/11、GroupShape 3/6、ChartSpace 18/19/21）延迟安全跳到本条边界
  - JModel 增 4 宿主类（extends OpaqueObject）；HistoryItemType 增常量；JChangesFactory 注册全部 sub；JChangesApplier.createFactoryObject 增 case 1104/1106/1123/1029
  - 验收（轻量）：编译零错误；`TestJChangesW36` 41/41 + W3-5 回归 33/33

- **P5 图表装饰：JDlbls(1042) 全量建模 + CatAx_SetTitle/SetTxPr(1111|21-22) 完成**（2026-08-31，office 60a7baf3 / test 3f3694d）：
  - JChartObjects: 新增 JDlbls（15字段：8 Bool / 1 Content dLbl 列表 / 1 Long dLblPos / 1 String separator / 4 ObjectRef leaderLines/numFmt/spPr/txPr）
  - JChartObjects: JBaseAx 新增 title/txPr 字段（1111|21-22；CAxisBase.prototype.setTitle/setTxPr 恒用 CatAx 常量 → JValAx 也走 1111 收到这两个变更）
  - ChartHistoryItemType: 新增 DLbls_* 15 个常量 + CatAx_SetTitle/SetTxPr；ValAx 注释修正（无 1112 sub）
  - JSlideChangesApplier: createFactoryObject case 1042 → JDlbls
  - JSlideChangesFactory: DLbls 15 sub 注册（含 DLbls_SetDLbl 走 ApplyContent 内联 JChangesBaseSkipProperty fallback，规避 SKIP_CTOR 前向引用编译错）+ CatAx_SetTitle/SetTxPr 注册
  - ★ 测试坑：str2() 须写**字节数**（len×2）而非字符数——BinStreamReader.GetString2 读字节数前缀（GetLong()→字节数→GetString2LE(byteLen)），写字符数导致流错位全部 noHost
  - 验收（轻量）：编译零错误 + 蓝本逐分支对照忠实（sdkjs v7.0.1.71 ChartFormat.js CDLbls changesFactory + CAxisBase.prototype）；TestJChartDecoration 41/41（8 Bool + 1 Long + 1 String + 4 ObjectRef + 1 Content + CatAx/JValAx title/txPr）

### ★ 当前验证阶段进度（2026-09-05）

**阶段**：用真实 fixture 测试数据验证 apply_changes Java 代码，通过和参考输出（Nashorn/x2t golden）对比确定是否要修正 Java 代码。每个 fixture 完成后等用户手动确认再开始下一个。

**当前 fixture：TestJMergeJavaGolden3（图片放大/移动/翻转/旋转）— 根因已确认，修复待实施**
- fixture：`测试文件/EditorBinWithChanges_图片_放大_移动_水平翻转_旋转_base.docx/-746750271`（107 条变更）
- **表现**：输出 docx 中图片完全缺失（Drawing '0_697' 不写入输出）
- **根因链**：
  1. TABLEID_ADD [4]（Drawing '0_697' elemType=5）→ `readDrawingInit()` 执行，调 `resolver.getById('0_700')` → null（ImageShape '0_700' 在 change [7] 才 TABLEID_ADD，forward reference）→ `drawing.graphicObj` 未设置
  2. Change [68] `5|8` SetGraphicObject nFlags=2 → `(2&2)==0` = false → New absent（不读 new id）→ `newGraphicObj=null` → `apply()` no-op → `drawing.graphicObj` 仍为 null
  3. `buildForNewImage()` 检查 `d.graphicObj == null` → return null → drawing 不写入输出
- **待解决的不确定点**：readDrawingInit 的 W/H 格式（当前 GetDouble/8字节，解码值 2.654e-301 明显错误，可能是 int32/4字节），影响 hasGO 的判断位置
- **修复方向**：deferred graphicObj 解析（readDrawingInit 只存 graphicObjId 字符串，所有 TABLEID_ADD 完成后统一解析），同时确认 W/H 格式
- **状态：等用户确认后实施修复**

---

## 下一步
1. **Excel 长尾逐节点推进**（2026-08-31 全量盘点：Slide 已收官、Word 残余 Skip 全为有意边界，缺口全在 Excel）。
   权威可勾选清单：`devDocs/apply_changes-JS移植Java-Excel修改类型清单.md`（office 仓库；原
   `Excel_apply_changes剩余DEFRRED清单.md` 已于 2026-08-31 并入此文件并删除，避免命名二义）。
   缺口见 §10 待办汇总 E3-R1..R7：~~E3-R4 Cell Error 值~~（✅ 完成 2026-08-31）→ ~~E3-R2b Workbook DefinedNamesChange(7)~~（✅ 完成 2026-08-31）→
   ~~E3-R4b ColorFilter ThemeColor + DynamicFilter 日期求值~~（✅ 完成 2026-08-31）→ **E3-R1 Worksheet 长尾 action（进行中）**：
   ~~ChangeMerge(25)=合并单元格~~（✅ 完成 2026-09-01，TestJXlsyMergeApply 31/31）→ ~~SheetView 屏显布尔簇(31/32/54)~~（✅ 完成 2026-09-01，TestJXlsySheetViewApply 23/23）→ ~~SheetPr summary 布尔(37/38)~~（✅ 完成 2026-09-01，TestJXlsySummaryBool 27/27）→ ~~SetTabColor(27)~~（✅ 完成 2026-09-01，TestJXlsySetTabColor 37/37）→ ~~ChangeFrozenCell(30)~~（✅ 完成 2026-09-01，TestJXlsyChangeFrozenCell 40/40）→ ~~GroupCol/CollapsedCol(35/36)~~（✅ 完成 2026-09-01，TestJXlsyGroupCol 26/26）→ ~~Hide(19)~~（✅ 完成 2026-09-01，TestJXlsyHide 13/13）→ ~~AddCols(5)~~（✅ 完成 2026-09-01，TestJXlsyAddCols 32/32）→ ~~ShiftCells(6-9)~~（✅ 完成 2026-09-01，TestJXlsyShiftCells 81/81）→ ~~MoveRange(13)~~（✅ 完成 2026-09-01，TestJXlsyMoveRange 54/54）→ 余下
   ~~GroupRow/CollapsedRow(33/34)~~（✅ 完成 2026-09-02，TestJXlsyGroupRow 39/39）→ ~~DataValidation(48/49/50)~~（✅ 完成 2026-09-02，TestJXlsyDataValidationApply 54/54）→ ~~SetFitToPage(39)+ProtectedRange(56/57)~~（✅ 完成 2026-09-02，TestJXlsyFitToPage 20/20 + TestJXlsyProtectedRange 25/25）→ **E3-R1 实质完成**（ChangeHyperlink ✅ 已在 T7.6-3，余 action 40-47/51 属 E3-R5 scope）/
   ~~E3-R5 Slicer/PivotTables/PivotFields~~（✅ 完成 2026-09-02，skipODataNoop，object model 缺失变更跳过不 fail-loud，TestJXlsyPivotSlicerSkip 15/15）/ ~~E3-R6 ProtectedWorkbook/NamedSheetViews~~（✅ 完成 2026-09-01，office 404aee68 / test 46871fc）/
   ~~E3-R7 Drawing 变更（复用 PPT DrawingML）~~（✅ 完成 2026-09-02，office 6bfd8220 / test 12c0330；[DRAWING-ORACLE-PENDING]）。
   ~~E3-R2 SheetAdd wbSheetIdFrom 复制场景~~（✅ 完成 2026-09-02，TestJXlsySheetAddCopy 15/15；wbOptSheet 仍 fail-loud [UNVALIDATED-E2E]）。
2. **重型三门回归压到最后一环**（验收节奏见「开工约束」）：category A 全部清零后进最终三门回归。
3. （备忘）P8 边界遗留：空段落/initial-kept-para 段标写出未覆盖；4|8 Word HighLight 保持 apply-only 写出 no-op（DrawingML 无表示，忠实）。
