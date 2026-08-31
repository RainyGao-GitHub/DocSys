# CURRENT_STATE — 当前工作卡

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。小而新鲜，随当前开发任务随手更新。压缩后读这里即可恢复方向；细节回落到 references。**此文件是会话级产物，不挂在任何任务仓库下。**

## 必读上下文（开工前读）
- `src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md`（office 仓库）：JDK 路径、编译命令、类路径、运行时目录等前提。

## 当前任务
apply_changes JS→Java 全量移植（Slide 线已收官，**当前 Excel 长尾线**，按 2026-08-27 验收节奏逐节点推进）。**E3-R4b 完成**：**AutoFilter(class=8) Apply(action=5) 两求值分支**——ColorFilter=ThemeColor（新建 JXlsyThemePalette 语义解析 PPTX clrScheme→RGB）+ DynamicFilter 日期范围（default→false / Val·MaxVal presence-gated）。**下一步：E3-R1 Worksheet 长尾 action**（`ChangeMerge(25)=合并单元格`最迫切；见清单 §2/§10）。

## References（读这里取细节）
- 计划：`devDocs/apply_changes-JS移植Java开发计划.md`（office 仓库 `src/com/DocSystem/websocket/office`）→ W3-11 节点
- 上下文（权威续接锚点）：`docs/apply_changes-JS移植Java开发上下文.md`（office 仓库）→ 「当前续接锚点」
- memory：`porting-faithfulness-principle`（忠实性）、`docsys-multi-git-repos`（多仓库提交归属）

## 开工约束
- 先确认仓库 dirty 状态；有改动先提交再开工（本任务如此）。提交归属见 CLAUDE.md「仓库结构」。
- **★ 验收节奏（用户 2026-08-27 决定）**：先全量移植剩余 ~148 类型（Word 89/Slide 26/Excel 33），边移边做**轻量验证**（编译+蓝本对照/单类型字节往返/模型值断言，不写 golden），**重型三门回归压到最后一环**。完整细则见上下文 §6 首块「验收节奏调整」，计划「验证策略」已同步。

## 当前进展
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

## 下一步
1. **Excel 长尾逐节点推进**（2026-08-31 全量盘点：Slide 已收官、Word 残余 Skip 全为有意边界，缺口全在 Excel）。
   权威可勾选清单：`devDocs/apply_changes-JS移植Java-Excel修改类型清单.md`（office 仓库；原
   `Excel_apply_changes剩余DEFRRED清单.md` 已于 2026-08-31 并入此文件并删除，避免命名二义）。
   缺口见 §10 待办汇总 E3-R1..R7：~~E3-R4 Cell Error 值~~（✅ 完成 2026-08-31）→ ~~E3-R2b Workbook DefinedNamesChange(7)~~（✅ 完成 2026-08-31）→
   ~~E3-R4b ColorFilter ThemeColor + DynamicFilter 日期求值~~（✅ 完成 2026-08-31）→ **E3-R1 Worksheet 长尾 action（下一个，ChangeMerge=合并单元格最迫切）** /
   E3-R5 Slicer/PivotTables/PivotFields（Pivot 须先定 scope）/ E3-R6 ProtectedRange/ProtectedWorkbook/NamedSheetViews /
   E3-R7 Drawing 变更（复用 PPT DrawingML）。
2. **重型三门回归压到最后一环**（验收节奏见「开工约束」）：category A 全部清零后进最终三门回归。
3. （备忘）P8 边界遗留：空段落/initial-kept-para 段标写出未覆盖；4|8 Word HighLight 保持 apply-only 写出 no-op（DrawingML 无表示，忠实）。
