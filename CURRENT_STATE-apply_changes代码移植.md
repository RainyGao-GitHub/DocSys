# CURRENT_STATE — 当前工作卡（归档：apply_changes 代码移植阶段）

> 本文件已于 2026-09-07 归档。apply_changes JS→Java 全量移植已完成（Word/Slide/Excel 三端），
> 当前阶段已切换为「移植后代码验证」。续接请读当前激活卡 `CURRENT_STATE_id分配.md`（id 分配对齐修复），
> fixture 验证见 `CURRENT_STATE_fixture验证.md`。

---

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
- **TestJMergeJavaGolden2 闭环**（2026-09-05，office `2d47abb4` / test `0b43d71`）：fixture2 粗体_斜体_段落（compact DOCT bin）14/14 语义断言通过 + MS Word OPENED OK。
  - 根因：compact bin → x2t 产出 footer/header 三处缺陷：① wps:wsp 直接在 wp:anchor 下（缺 a:graphic/a:graphicData 包装）；② 引用未定义紧凑数字样式 ID（"9"/"10"/"15"）；③ 缺 word/_rels/footer*.xml.rels。
  - 修复：新建 JDocxCompactBinFixer.fix()（三项后处理）+ JStyleSectionReWriter Pass 4（dedup SSTS_Style）；测试侧在 FileConverter.convert() 后调用。
  - **等待用户确认后再推进下一 fixture。**

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
  - Gate 1（Word golden `TestJMergeJavaGolden`）：**6/6 PASS**（2026-09-06，office `c5f7321a`）——三处修复：① `JBinIdAllocator.readParagraph` pPr type=31 注册 JModel.Section（使 Section 变更能按 ID 找到宿主）；② Hyperlink LINK/ANCHOR/TOOLTIP 属性改从 base binary 读取（修 TOC 超链接约 2832 字节差异）；③ JMergeEngine 移除 `fixSectPrOrientation`（W>H 推断错误，base binary orient 字节须透传，landscape=1 被错误覆盖为 0 导致 5 字节差）。同步修正 JChangesParagraphSectionPr nFlags 位约定。
  - 结论：三门就「E3-R5 有无破坏既有能力」而言全绿；Word golden 门唯一差异是已裁定接受的 W2-4 sectPr 遗留。Excel 用 x2t 参考对比（各 apply 护栏内已含 round-trip，无独立重型 Excel golden 门）。

### ★ 当前验证阶段进度（2026-09-06）

**阶段**：用真实 fixture 测试数据验证 apply_changes Java 代码，通过和参考输出（Nashorn/x2t golden）对比确定是否要修正 Java 代码。每个 fixture 完成后等用户手动确认再开始下一个。

**✅ sectPr 二进制透传修复（2026-09-06，office `1a57c3d6`）**
- **问题**：`JDocumentWriter.writeParagraph()` 对全部段落无差别调用 `JSectionCodec.stripSectPrFromPPr()`，导致中间节（non-final section）段落的 pPr type=31 sectPr 记录被一律剥除，fixture1 realDiff=4319 字节。
- **修复**：三部分联动：①`JBinIdAllocator` 记录 `docSectionParagraph`（末段落，其 type=31 是 body-level type=4 的副本）；②`JDocumentWriter` 新增 `docSectionParagraph` 字段并在 `writeParagraph()` 中：dirty p.section → rebuildPPrWithSection，`p==docSectionParagraph` → strip，其余段落 → 原样透传（保留中间节 sectPr）；③`JMergeEngine` 传递 `alloc.docSectionParagraph`。
- **结果**：fixture1 realDiff 降至 2837 字节，剩余差异=`Paragraph_SectionPr`（sub=34，仍 SkipProperty，方向不更新）+ TOC 超链接 tooltip/anchor 属性缺失；其余 4 个 fixture 无回归（fixture2/3/W2/W2-4 均通过）。

**✅ TestJMergeJavaGolden3（图片放大/移动/翻转/旋转）— 18/18 PASS（2026-09-05）**
- fixture：`测试文件/EditorBinWithChanges_图片_放大_移动_水平翻转_旋转_base.docx/-746750271`（107 条变更）
- **根因 & 修复**：`JChangesDrawingSetGraphicObject` 使用错误的 flag 位编码。OrgPath 误记为 `CChangesDrawingsObject`（CChangesBaseStringProperty，bit1=New-undef/bit2=Old-undef），实际蓝本是 `CChangesParaDrawingGraphicObject`（ParaDrawingChanges.js），其 ReadFromBinary **bit0(1)=New-null/bit1(2)=Old-null，写序 New 在前 Old 在后**。旧代码 `(nFlags&2)==0` 对 nFlags=2 → false → New 未读；修正为 `(nFlags&1)==0` → New="0_700" 正常读出 → `drawing.graphicObj = ImageShape '0_700'` → `buildForNewImage()` 写出完整图片锚点。
- **顺带确认**：WriteDouble 在变更流中是 4 字节定点（val*100000 as int32），BinStreamReader.GetDouble() 已正确实现；hasGO 在 init data 中为 0（false），Drawing '0_697' 的 graphicObj 全部由 SetGraphicObject 变更设置。
- **等用户确认后继续下一个 fixture。**
