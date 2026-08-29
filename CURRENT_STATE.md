# CURRENT_STATE — 当前工作卡

> 本文件是会话恢复协议的第 1 步（见 `CLAUDE.md`）。小而新鲜，随当前开发任务随手更新。压缩后读这里即可恢复方向；细节回落到 references。**此文件是会话级产物，不挂在任何任务仓库下。**

## 必读上下文（开工前读）
- `src/com/DocSystem/websocket/office/docs/MxsOffice工程上下文.md`（office 仓库）：JDK 路径、编译命令、类路径、运行时目录等前提。

## 当前任务
apply_changes JS→Java 全量移植（Word 线）。**W4 defer 桶第四个节点完成**：**W4 OLE（ImageShape OLE 图片对象 7 sub）完成**。下一个节点：**W4 桶其余**（oMath base=26/SmartArt/DataValidation），或按计划切 PPT/Excel 缺口。

## References（读这里取细节）
- 计划：`devDocs/apply_changes-JS移植Java开发计划.md`（office 仓库 `src/com/DocSystem/websocket/office`）→ W3-11 节点
- 上下文（权威续接锚点）：`docs/apply_changes-JS移植Java开发上下文.md`（office 仓库）→ 「当前续接锚点」
- memory：`porting-faithfulness-principle`（忠实性）、`docsys-multi-git-repos`（多仓库提交归属）

## 开工约束
- 先确认仓库 dirty 状态；有改动先提交再开工（本任务如此）。提交归属见 CLAUDE.md「仓库结构」。
- **★ 验收节奏（用户 2026-08-27 决定）**：先全量移植剩余 ~148 类型（Word 89/Slide 26/Excel 33），边移边做**轻量验证**（编译+蓝本对照/单类型字节往返/模型值断言，不写 golden），**重型三门回归压到最后一环**。完整细则见上下文 §6 首块「验收节奏调整」，计划「验证策略」已同步。

## 当前进展
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
1. **W4 桶其余节点**（OLE/oMath base=26/SmartArt/修订/Slicer/Pivot/DataValidation），或按计划切 PPT/Excel 缺口。
2. 重型三门回归压到最后一环（验收节奏见「开工约束」）。
