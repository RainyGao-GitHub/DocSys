# CURRENT_STATE — 当前工作卡

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。小而新鲜，随当前开发任务随手更新。压缩后读这里即可恢复方向；细节回落到 references。**此文件是会话级产物，不挂在任何任务仓库下。**

## 必读上下文（开工前读）
- `src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md`（office 仓库）：JDK 路径、编译命令、类路径、运行时目录等前提。

## 当前任务
apply_changes JS→Java 全量移植（当前 Slide 线，按 2026-08-27 验收节奏逐节点推进）。**P4 完成**：**Slide 装饰(1117|1-10,13-16) 完整建模**（SetComments/SetShow/SetShowPhAnim/SetShowMasterSp/SetLayout/SetNum/SetTransition/SetSize/SetBg/SetLocks/SetCSldName/SetClrMapOverride/SetNotes/SetTiming；ObjectNoId 嵌套读取器+SetLocks 6×readObject）。**下一个节点 P5：图表装饰(DLbls/CatAx·ValAx SetTitle/SetTxPr)**。

## References（读这里取细节）
- 计划：`devDocs/apply_changes-JS移植Java开发计划.md`（office 仓库 `src/com/DocSystem/websocket/office`）→ W3-11 节点
- 上下文（权威续接锚点）：`docs/apply_changes-JS移植Java开发上下文.md`（office 仓库）→ 「当前续接锚点」
- memory：`porting-faithfulness-principle`（忠实性）、`docsys-multi-git-repos`（多仓库提交归属）

## 开工约束
- 先确认仓库 dirty 状态；有改动先提交再开工（本任务如此）。提交归属见 CLAUDE.md「仓库结构」。
- **★ 验收节奏（用户 2026-08-27 决定）**：先全量移植剩余 ~148 类型（Word 89/Slide 26/Excel 33），边移边做**轻量验证**（编译+蓝本对照/单类型字节往返/模型值断言，不写 golden），**重型三门回归压到最后一环**。完整细则见上下文 §6 首块「验收节奏调整」，计划「验证策略」已同步。

## 当前进展
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

## 下一步
1. **P5：图表装饰**——DLbls/CatAx·ValAx SetTitle/SetTxPr。蓝本 Slide.js changesFactory 各图表装饰 sub。
2. 其后按 Slide 清单推进：P6 Notes(1129)、P7 自定义几何(1108|7 AddPath/1109 Path)、P8 TextPr para-mark apply(4|1,2,8)。
3. 重型三门回归压到最后一环（验收节奏见「开工约束」）。
