/*
 * (c) Copyright Ascensio System SIA 2010-2019
 *
 * This program is a free software product. You can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License (AGPL)
 * version 3 as published by the Free Software Foundation. In accordance with
 * Section 7(a) of the GNU AGPL its Section 15 shall be amended to the effect
 * that Ascensio System SIA expressly excludes the warranty of non-infringement
 * of any third-party rights.
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied
 * warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR  PURPOSE. For
 * details, see the GNU AGPL at: http://www.gnu.org/licenses/agpl-3.0.html
 *
 * You can contact Ascensio System SIA at 20A-12 Ernesta Birznieka-Upisha
 * street, Riga, Latvia, EU, LV-1050.
 *
 * The  interactive user interfaces in modified source and object code versions
 * of the Program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU AGPL version 3.
 *
 * Pursuant to Section 7(b) of the License you must retain the original Product
 * logo when distributing the program. Pursuant to Section 7(e) we decline to
 * grant you any rights under trademark law for use of our trademarks.
 *
 * All the Product's GUI elements, including illustrations and icon sets, as
 * well as technical writing content are licensed under the terms of the
 * Creative Commons Attribution-ShareAlike 4.0 International. See the License
 * terms at http://creativecommons.org/licenses/by-sa/4.0/legalcode
 *
 */

"use strict";

// Import
var g_memory = AscFonts.g_memory;
var FontStyle = AscFonts.FontStyle;
var DecodeBase64Char = AscFonts.DecodeBase64Char;
var b64_decode = AscFonts.b64_decode;
var g_fontApplication = AscFonts.g_fontApplication;

var align_Right = AscCommon.align_Right;
var align_Left = AscCommon.align_Left;
var align_Center = AscCommon.align_Center;
var align_Justify = AscCommon.align_Justify;
var c_oAscWrapStyle = AscCommon.c_oAscWrapStyle;
var c_oAscSectionBreakType    = Asc.c_oAscSectionBreakType;
var Binary_CommonReader = AscCommon.Binary_CommonReader;
var BinaryCommonWriter = AscCommon.BinaryCommonWriter;
var c_oSerPaddingType = AscCommon.c_oSerPaddingType;
var c_oSerBordersType = AscCommon.c_oSerBordersType;
var c_oSerBorderType = AscCommon.c_oSerBorderType;
var c_oSerPropLenType = AscCommon.c_oSerPropLenType;
var c_oSerConstants = AscCommon.c_oSerConstants;
var pptx_content_loader = AscCommon.pptx_content_loader;
var pptx_content_writer = AscCommon.pptx_content_writer;

var c_oAscXAlign = Asc.c_oAscXAlign;
var c_oAscYAlign = Asc.c_oAscYAlign;

//dif:
//Version:2 добавлены свойства стилей qFormat, uiPriority, hidden, semiHidden, unhideWhenUsed, для более ранних бинарников считаем qFormat = true
//Version:3 все рисованные обьекты открываются через презентации
//Version:4 добавилось свойство CTablePr.TableLayout(проблема в том что если оно отсутствует, то это tbllayout_AutoFit, а у нас в любом случае считалось tbllayout_Fixed)
//Version:5 добавлены секции, учитываются флаги title и EvenAndOddHeaders, изменен формат chart
var c_oSerTableTypes = {
    Signature:0,
    Info:1,
    Media:2,
    Numbering:3,
    HdrFtr:4,
    Style:5,
    Document:6,
    Other:7,
	Comments: 8,
	Settings: 9,
	Footnotes: 10,
	Endnotes: 11,
	Background: 12,
	VbaProject: 13,
	App: 15,
	Core: 16,
	DocumentComments: 17
};
var c_oSerSigTypes = {
    Version:0
};
var c_oSerHdrFtrTypes = {
    Header:0,
    Footer:1,
    HdrFtr_First:2,
    HdrFtr_Even:3,
    HdrFtr_Odd:4,
    HdrFtr_Content:5,
    HdrFtr_Y2:6,
    HdrFtr_Y:7
};
var c_oSerNumTypes = {
    AbstractNums:0,
    AbstractNum:1,
    AbstractNum_Id:2,
    AbstractNum_Type:3,
    AbstractNum_Lvls:4,
    Lvl:5,
    lvl_Format:6,
	lvl_Jc_deprecated:7,
    lvl_LvlText:8,
    lvl_LvlTextItem:9,
    lvl_LvlTextItemText:10,
    lvl_LvlTextItemNum:11,
    lvl_Restart:12,
    lvl_Start:13,
    lvl_Suff:14,
    lvl_ParaPr:15,
    lvl_TextPr:16,
    Nums: 17,
    Num: 18,
    Num_ANumId: 19,
    Num_NumId: 20,
	lvl_PStyle: 21,
	NumStyleLink: 22,
	StyleLink: 23,
	lvl_NumFmt: 24,
	NumFmtVal: 25,
	NumFmtFormat: 26,
	Num_LvlOverride : 27,
	StartOverride: 28,
	ILvl: 29,
	Tentative: 30,
	Tplc: 31,
	IsLgl: 32,
	LvlLegacy: 33,
	Legacy: 34,
	LegacyIndent: 35,
	LegacySpace: 36,
	lvl_Jc: 37
};
var c_oSerOtherTableTypes = {
    ImageMap:0,
    ImageMap_Src:1,
	DocxTheme: 3
};
var c_oSerFontsTypes = {
    Name:0
};
var c_oSerImageMapTypes = {
    Src:0
};
var c_oSerStyleTypes = {
    Name:0,
    BasedOn:1,
    Next:2
};
var c_oSer_st = {
    DefpPr:0,
    DefrPr:1,
    Styles:2
};
var c_oSer_sts = {
    Style:0,
    Style_Id:1,
    Style_Name:2,
    Style_BasedOn:3,
    Style_Next:4,
    Style_TextPr:5,
    Style_ParaPr:6,
    Style_TablePr:7,
    Style_Default:8,
    Style_Type:9,
    Style_qFormat:10,
    Style_uiPriority:11,
    Style_hidden:12,
    Style_semiHidden:13,
    Style_unhideWhenUsed:14,
	Style_RowPr: 15,
	Style_CellPr: 16,
	Style_TblStylePr: 17,
	Style_Link: 18,
	Style_CustomStyle: 19,
	Style_Aliases: 20,
	Style_AutoRedefine: 21,
	Style_Locked: 22,
	Style_Personal: 23,
	Style_PersonalCompose: 24,
	Style_PersonalReply: 25
};
var c_oSerProp_tblStylePrType = {
	TblStylePr: 0,
	Type: 1,
	RunPr: 2,
	ParPr: 3,
	TblPr: 4,
	TrPr: 5,
	TcPr: 6
};
var c_oSerProp_tblPrType = {
    Rows:0,
    Cols:1,
    Jc:2,
    TableInd:3,
    TableW:4,
    TableCellMar:5,
    TableBorders:6,
    Shd:7,
    tblpPr:8,
	Look: 9,
	Style: 10,
	tblpPr2: 11,
	Layout: 12,
	tblPrChange: 13,
	TableCellSpacing: 14,
	RowBandSize: 15,
	ColBandSize: 16,
	tblCaption: 17,
	tblDescription: 18,
	TableIndTwips: 19,
	TableCellSpacingTwips: 20
};
var c_oSer_tblpPrType = {
    Page:0,
    X:1,//начиная с версии 2, отсчитывается от начала текста(как в docx), раньше отсчитывался от левой границы.
    Y:2,
    Paddings:3
};
var c_oSer_tblpPrType2 = {
	HorzAnchor: 0,
	TblpX: 1,
	TblpXSpec: 2,
	VertAnchor: 3,
	TblpY: 4,
	TblpYSpec: 5,
	Paddings: 6,
	TblpXTwips: 7,
	TblpYTwips: 8
};
var c_oSerProp_pPrType = {
    contextualSpacing:0,
    Ind:1,
    Ind_Left:2,
    Ind_Right:3,
    Ind_FirstLine:4,
    Jc:5,
    KeepLines:6,
    KeepNext:7,
    PageBreakBefore:8,
    Spacing:9,
    Spacing_Line:10,
    Spacing_LineRule:11,
    Spacing_Before:12,
    Spacing_After:13,
    Shd:14,
    Tab:17,
    Tab_Item:18,
    Tab_Item_Pos:19,
	Tab_Item_Val_deprecated:20,
    ParaStyle:21,
    numPr: 22,
    numPr_lvl: 23,
    numPr_id: 24,
    WidowControl:25,
    pPr_rPr: 26,
    pBdr: 27,
    Spacing_BeforeAuto: 28,
    Spacing_AfterAuto: 29,
	FramePr: 30,
	SectPr: 31,
	numPr_Ins: 32,
	pPrChange: 33,
	outlineLvl: 34,
	Tab_Item_Leader: 35,
	Ind_LeftTwips: 36,
	Ind_RightTwips: 37,
	Ind_FirstLineTwips: 38,
	Spacing_LineTwips: 39,
	Spacing_BeforeTwips: 40,
	Spacing_AfterTwips: 41,
	Tab_Item_PosTwips: 42,
	Tab_Item_Val: 43
};
var c_oSerProp_rPrType = {
    Bold:0,
    Italic:1,
    Underline:2,
    Strikeout:3,
    FontAscii:4,
    FontHAnsi:5,
    FontAE:6,
    FontCS:7,
    FontSize:8,
    Color:9,
    VertAlign:10,
    HighLight:11,
    HighLightTyped:12,
	RStyle: 13,
	Spacing: 14,
	DStrikeout: 15,
	Caps: 16,
	SmallCaps: 17,
	Position: 18,
	FontHint: 19,
	BoldCs: 20,
	ItalicCs: 21,
	FontSizeCs: 22,
	Cs: 23,
	Rtl: 24,
	Lang: 25,
	LangBidi: 26,
	LangEA: 27,
	ColorTheme: 28,
	Shd: 29,
	Vanish: 30,
	TextOutline: 31,
	TextFill : 32,
	Del: 33,
	Ins: 34,
	rPrChange: 35,
	MoveFrom: 36,
	MoveTo: 37,
	SpacingTwips:38,
	PositionHps: 39
};
var c_oSerProp_rowPrType = {
    CantSplit:0,
    GridAfter:1,
    GridBefore:2,
    Jc:3,
    TableCellSpacing:4,
    Height:5,
    Height_Rule:6,
    Height_Value:7,
    WAfter:8,
    WBefore:9,
    WAfterBefore_W:10,
    WAfterBefore_Type:11,
    After:12,
    Before:13,
    TableHeader:14,
    Del: 15,
    Ins: 16,
    trPrChange: 17,
	TableCellSpacingTwips: 18,
	Height_ValueTwips: 19
};
var c_oSerProp_cellPrType = {
    GridSpan:0,
    Shd:1,
    TableCellBorders:2,
    TableCellW:3,
    VAlign:4,
    VMerge:5,
    CellMar:6,
    CellDel: 7,
    CellIns: 8,
    CellMerge: 9,
    tcPrChange: 10,
    textDirection: 11,
    hideMark: 12,
    noWrap:13,
    tcFitText: 14,
	HMerge:15
};
var c_oSerProp_secPrType = {
    pgSz: 0,
    pgMar: 1,
    setting: 2,
	headers: 3,
	footers: 4,
	hdrftrelem: 5,
	pageNumType: 6,
	sectPrChange: 7,
	cols: 8,
	pgBorders: 9,
	footnotePr: 10,
	endnotePr: 11,
	rtlGutter: 12
};
var c_oSerProp_secPrSettingsType = {
    titlePg: 0,
    EvenAndOddHeaders: 1,
	SectionType: 2
};
var c_oSerProp_secPrPageNumType = {
	start: 0
};
var c_oSerProp_Columns = {
	EqualWidth: 0,
	Num: 1,
	Sep: 2,
	Space: 3,
	Column: 4,
	ColumnSpace: 5,
	ColumnW: 6
};
var c_oSerParType = {
    Par:0,
    pPr:1,
    Content:2,
    Table:3,
    sectPr: 4,
    Run: 5,
	CommentStart: 6,
	CommentEnd: 7,
	OMathPara: 8,
	OMath: 9,
    Hyperlink: 10,
	FldSimple: 11,
	Del: 12,
	Ins: 13,
	Background: 14,
	Sdt: 15,
	MoveFrom: 16,
	MoveTo: 17,
	MoveFromRangeStart: 18,
	MoveFromRangeEnd: 19,
	MoveToRangeStart: 20,
	MoveToRangeEnd: 21,
	JsaProject: 22,
	BookmarkStart: 23,
	BookmarkEnd: 24,
	MRun: 25
};
var c_oSerDocTableType = {
    tblPr:0,
    tblGrid:1,
    tblGrid_Item:2,
    Content:3,
    Row: 4,
    Row_Pr: 4,
    Row_Content: 5,
    Cell: 6,
    Cell_Pr: 7,
    Cell_Content: 8,
    tblGridChange: 9,
	Sdt: 10,
	BookmarkStart: 11,
	BookmarkEnd: 12,
	tblGrid_ItemTwips: 13,
	MoveFromRangeStart: 14,
	MoveFromRangeEnd: 15,
	MoveToRangeStart: 16,
	MoveToRangeEnd: 17
};
var c_oSerRunType = {
    run:0,
    rPr:1,
    tab:2,
    pagenum:3,
    pagebreak:4,
    linebreak:5,
    image:6,
    table:7,
    Content:8,
	fldstart_deprecated: 9,
	fldend_deprecated: 10,
	CommentReference: 11,
	pptxDrawing: 12,
	_LastRun: 13, //для копирования через бинарник
	object: 14,
	delText: 15,
    del: 16,
    ins: 17,
    columnbreak: 18,
	cr: 19,
	nonBreakHyphen: 20,
	softHyphen: 21,
	separator: 22,
	continuationSeparator: 23,
	footnoteRef: 24,
	endnoteRef: 25,
	footnoteReference: 26,
	endnoteReference: 27,
	arPr: 28,
	fldChar: 29,
	instrText: 30,
	delInstrText: 31
};
var c_oSerImageType = {
    MediaId:0,
    Type:1,
    Width:2,
    Height:3,
    X:4,
    Y:5,
    Page:6,
    Padding:7
};
var c_oSerImageType2 = {
	Type: 0,
	PptxData: 1,
	AllowOverlap: 2,
	BehindDoc: 3,
	DistB: 4,
	DistL: 5,
	DistR: 6,
	DistT: 7,
	Hidden: 8,
	LayoutInCell: 9,
	Locked: 10,
	RelativeHeight: 11,
	BSimplePos: 12,
	EffectExtent: 13,
	Extent: 14,
	PositionH: 15,
	PositionV: 16,
	SimplePos: 17,
	WrapNone: 18,
	WrapSquare: 19,
	WrapThrough: 20,
	WrapTight: 21,
	WrapTopAndBottom: 22,
	Chart: 23,
	ChartImg: 24,
	Chart2: 25,
	CachedImage: 26,
	SizeRelH: 27,
	SizeRelV: 28,
	GraphicFramePr: 30,
	DocPr: 31,
	DistBEmu: 32,
	DistLEmu: 33,
	DistREmu: 34,
	DistTEmu: 35
};
var c_oSerEffectExtent = {
	Left: 0,
	Top: 1,
	Right: 2,
	Bottom: 3,
	LeftEmu: 4,
	TopEmu: 5,
	RightEmu: 6,
	BottomEmu: 7
};
var c_oSerExtent = {
	Cx: 0,
	Cy: 1,
	CxEmu: 2,
	CyEmu: 3
};
var c_oSerPosHV = {
	RelativeFrom: 0,
	Align: 1,
	PosOffset: 2,
	PctOffset: 3,
	PosOffsetEmu: 4
};
var c_oSerSizeRelHV = {
	RelativeFrom: 0,
	Pct: 1
};
var c_oSerSimplePos = {
	X: 0,
	Y: 1,
	XEmu: 2,
	YEmu: 3
};
var c_oSerWrapSquare = {
	DistL: 0,
	DistT: 1,
	DistR: 2,
	DistB: 3,
	WrapText: 4,
	EffectExtent: 5,
	DistLEmu: 6,
	DistTEmu: 7,
	DistREmu: 8,
	DistBEmu: 9
};
var c_oSerWrapThroughTight = {
	DistL: 0,
	DistR: 1,
	WrapText: 2,
	WrapPolygon: 3,
	DistLEmu: 4,
	DistREmu: 5
};
var c_oSerWrapTopBottom = {
	DistT: 0,
	DistB: 1,
	EffectExtent: 2,
	DistTEmu: 3,
	DistBEmu: 4
};
var c_oSerWrapPolygon = {
	Edited: 0,
	Start: 1,
	ALineTo: 2,
	LineTo: 3
};
var c_oSerPoint2D = {
	X: 0,
	Y: 1,
	XEmu: 2,
	YEmu: 3
};
var c_oSerMarginsType = {
    left:0,
    top:1,
    right:2,
    bottom:3
};
var c_oSerWidthType = {
    Type:0,
    W:1,
	WDocx: 2
};
var c_oSer_pgSzType = {
    W:0,
    H:1,
    Orientation:2,
	WTwips: 3,
	HTwips: 4
};
var c_oSer_pgMarType = {
    Left:0,
    Top:1,
    Right:2,
    Bottom:3,
    Header:4,
    Footer:5,
	LeftTwips: 6,
	TopTwips: 7,
	RightTwips: 8,
	BottomTwips: 9,
	HeaderTwips: 10,
	FooterTwips: 11,
	GutterTwips: 12
};
var c_oSer_CommentsType = {
	Comment: 0,
	Id: 1,
	Initials: 2,
	UserName: 3,
	UserId: 4,
	Date: 5,
	Text: 6,
	QuoteText: 7,
	Solved: 8,
	Replies: 9,
	OOData: 10,
	DurableId: 11,
	ProviderId: 12
};

var c_oSer_StyleType = {
    Character: 1,
    Numbering: 2,
	Paragraph: 3,
	Table: 4
};
var c_oSer_SettingsType = {
	ClrSchemeMapping: 0,
	DefaultTabStop: 1,
	MathPr: 2,
	TrackRevisions: 3,
	FootnotePr: 4,
	EndnotePr: 5,
	SdtGlobalColor: 6,
	SdtGlobalShowHighlight: 7,
	Compat: 8,
	DefaultTabStopTwips: 9,
	DecimalSymbol: 10,
	ListSeparator: 11,
	GutterAtTop: 12,
	MirrorMargins: 13,
	PrintTwoOnOne: 14,
	BookFoldPrinting: 15,
	BookFoldPrintingSheets: 16,
	BookFoldRevPrinting: 17
};
var c_oSer_MathPrType = {
	BrkBin: 0,
	BrkBinSub: 1,
	DefJc: 2,
	DispDef: 3,
	InterSp: 4,
	IntLim: 5,
	IntraSp: 6,
	LMargin: 7,
	MathFont: 8,
	NaryLim: 9,
	PostSp: 10,
	PreSp: 11,
	RMargin: 12,
	SmallFrac: 13,
	WrapIndent: 14,
	WrapRight: 15
};
var c_oSer_ClrSchemeMappingType = {
	Accent1: 0,
	Accent2: 1,
	Accent3: 2,
	Accent4: 3,
	Accent5: 4,
	Accent6: 5,
	Bg1: 6,
	Bg2: 7,
	FollowedHyperlink: 8,
	Hyperlink: 9,
	T1: 10,
	T2: 11
};
var c_oSer_FramePrType = {
	DropCap: 0,
	H: 1,
	HAnchor: 2,
	HRule: 3,
	HSpace: 4,
	Lines: 5,
	VAnchor: 6,
	VSpace: 7,
	W: 8,
	Wrap: 9,
	X: 10,
	XAlign: 11,
	Y: 12,
	YAlign: 13
};
var c_oSer_OMathBottomNodesType = {
	Aln: 0,
	AlnScr: 1,
	ArgSz: 2,
	BaseJc: 3,
	BegChr: 4,
	Brk: 5,
	CGp: 6,
	CGpRule: 7,
	Chr: 8,
	Count: 9,
	CSp: 10,
	CtrlPr: 11,
	DegHide: 12,
	Diff: 13,
	EndChr: 14,
	Grow: 15,
	HideBot: 16,
	HideLeft: 17,
	HideRight: 18,
	HideTop: 19,
	MJc: 20,
	LimLoc: 21,
	Lit: 22,
	MaxDist: 23,
	McJc: 24,
	Mcs: 25,
	NoBreak: 26,
	Nor: 27,
	ObjDist: 28,
	OpEmu: 29,
	PlcHide: 30,
	Pos: 31,
	RSp: 32,
	RSpRule: 33,
	Scr: 34,
	SepChr: 35,
	Show: 36,
	Shp: 37,
	StrikeBLTR: 38,
	StrikeH: 39,
	StrikeTLBR: 40,
	StrikeV: 41,
	Sty: 42,
	SubHide: 43,
	SupHide: 44,
	Transp: 45,
	Type: 46,
	VertJc: 47,
	ZeroAsc: 48,
	ZeroDesc: 49,
	ZeroWid: 50,	
	Column: 51,
	Row: 52
};
var c_oSer_OMathBottomNodesValType = {
	Val: 0,
	AlnAt: 1,
	ValTwips: 2
};
var c_oSer_OMathChrType =
{
    Chr    : 0,
    BegChr : 1,
    EndChr : 2,
    SepChr : 3
};
var c_oSer_OMathContentType = {		
	Acc: 0,
	AccPr: 1,
	ArgPr: 2,
	Bar: 3,
	BarPr: 4,
	BorderBox: 5,
	BorderBoxPr: 6,
	Box: 7,
	BoxPr: 8,
	Deg: 9,
	Den: 10,
	Delimiter: 11,
	DelimiterPr: 12,
	Element: 13,
	EqArr: 14,
	EqArrPr: 15,
	FName: 16,
	Fraction: 17,
	FPr: 18,
	Func: 19,
	FuncPr: 20,
	GroupChr: 21,
	GroupChrPr: 22,
	Lim: 23,
	LimLow: 24,
	LimLowPr: 25,
	LimUpp: 26,
	LimUppPr: 27,
	Matrix: 28,
	MathPr: 29,
	Mc: 30,
	McPr: 31,		
	MPr: 32,
	Mr: 33,
	Nary: 34,
	NaryPr: 35,
	Num: 36,
	OMath: 37,
	OMathPara: 38,
	OMathParaPr: 39,
	Phant: 40,
	PhantPr: 41,
	MRun: 42,
	Rad: 43,
	RadPr: 44,
	RPr: 45,
	MRPr: 46,
	SPre: 47,
	SPrePr: 48,
	SSub: 49,
	SSubPr: 50,
	SSubSup: 51,
	SSubSupPr: 52,
	SSup: 53,
	SSupPr: 54,
	Sub: 55,
	Sup: 56,
	MText: 57,
	CtrlPr: 58,
	pagebreak: 59,
	linebreak: 60,
	Run: 61,
    Ins: 62,
	Del: 63,
	columnbreak: 64,
	ARPr: 65,
	BookmarkStart: 66,
	BookmarkEnd: 67,
	MoveFromRangeStart: 68,
	MoveFromRangeEnd: 69,
	MoveToRangeStart: 70,
	MoveToRangeEnd: 71
};
var c_oSer_HyperlinkType = {
    Content: 0,
    Link: 1,
    Anchor: 2,
    Tooltip: 3,
    History: 4,
    DocLocation: 5,
    TgtFrame: 6
};
var c_oSer_FldSimpleType = {
	Content: 0,
	Instr: 1,
	FFData: 2,
	CharType: 3
};
var c_oSerProp_RevisionType = {
    Author: 0,
    Date: 1,
    Id: 2,
	UserId: 3,
    Content: 4,
    VMerge: 5,
    VMergeOrigin: 6,
    pPrChange: 7,
    rPrChange: 8,
    sectPrChange: 9,
    tblGridChange: 10,
    tblPrChange: 11,
    tcPrChange: 12,
    trPrChange: 13,
    ContentRun: 14
};
var c_oSerPageBorders = {
	Display: 0,
	OffsetFrom: 1,
	ZOrder: 2,
	Bottom: 3,
	Left: 4,
	Right: 5,
	Top: 6,
	Color: 7,
	Frame: 8,
	Id: 9,
	Shadow: 10,
	Space: 11,
	Sz: 12,
	ColorTheme: 13,
	Val: 16
};
var c_oSerGraphicFramePr = {
	NoChangeAspect: 0,
	NoDrilldown: 1,
	NoGrp: 2,
	NoMove: 3,
	NoResize: 4,
	NoSelect: 5
};
var c_oSerNotes = {
	Note: 0,
	NoteType: 1,
	NoteId: 2,
	NoteContent: 3,
	RefCustomMarkFollows: 4,
	RefId: 5,
	PrFmt: 6,
	PrRestart: 7,
	PrStart: 8,
	PrFntPos: 9,
	PrEndPos: 10,
	PrRef: 11
};
var c_oSerApp = {
	Application: 0,
	AppVersion: 1
};
var c_oSerDocPr = {
	Id: 0,
	Name: 1,
	Hidden: 2,
	Title: 3,
	Descr: 4
};
var c_oSerBackgroundType = {
	Color: 0,
	ColorTheme: 1,
	pptxDrawing: 2
};
var c_oSerSdt = {
	Pr: 0,
	EndPr: 1,
	Content: 2,
	Type: 3,
	Alias: 4,
	ComboBox: 5,
	LastValue: 6,
	SdtListItem: 7,
	DisplayText: 8,
	Value: 9,
	DataBinding: 10,
	PrefixMappings: 11,
	StoreItemID: 12,
	XPath: 13,
	PrDate: 14,
	FullDate: 15,
	Calendar: 16,
	DateFormat: 17,
	Lid: 18,
	StoreMappedDataAs: 19,
	DocPartList: 20,
	DocPartObj: 21,
	DocPartCategory: 22,
	DocPartGallery: 23,
	DocPartUnique: 24,
	DropDownList: 25,
	Id: 26,
	Label: 27,
	Lock: 28,
	PlaceHolder: 29,
	RPr: 30,
	ShowingPlcHdr: 31,
	TabIndex: 32,
	Tag: 33,
	Temporary: 34,
	MultiLine: 35,
	Appearance: 36,
	Color: 37,
	Checkbox: 38,
	CheckboxChecked: 39,
	CheckboxCheckedFont: 40,
	CheckboxCheckedVal: 41,
	CheckboxUncheckedFont: 42,
	CheckboxUncheckedVal: 43
};
var c_oSerFFData = {
	CalcOnExit: 0,
	CheckBox: 1,
	DDList: 2,
	Enabled: 3,
	EntryMacro: 4,
	ExitMacro: 5,
	HelpText: 6,
	Label: 7,
	Name: 8,
	StatusText: 9,
	TabIndex: 10,
	TextInput: 11,
	CBChecked: 12,
	CBDefault: 13,
	CBSize: 14,
	CBSizeAuto: 15,
	DLDefault: 16,
	DLResult: 17,
	DLListEntry: 18,
	HTType: 19,
	HTVal: 20,
	TIDefault: 21,
	TIFormat: 22,
	TIMaxLength: 23,
	TIType: 24
};
var c_oSerMoveRange = {
	Author: 0,
	ColFirst: 1,
	ColLast: 2,
	Date: 3,
	DisplacedByCustomXml: 4,
	Id: 5,
	Name: 6,
	UserId: 7
};
var c_oSerCompat = {
	CompatSetting: 0,
	CompatName: 1,
	CompatUri: 2,
	CompatValue: 3,
	Flags1: 4,
	Flags2: 5,
	Flags3: 6
};
var ETblStyleOverrideType = {
	tblstyleoverridetypeBand1Horz:  0,
	tblstyleoverridetypeBand1Vert:  1,
	tblstyleoverridetypeBand2Horz:  2,
	tblstyleoverridetypeBand2Vert:  3,
	tblstyleoverridetypeFirstCol:  4,
	tblstyleoverridetypeFirstRow:  5,
	tblstyleoverridetypeLastCol:  6,
	tblstyleoverridetypeLastRow:  7,
	tblstyleoverridetypeNeCell:  8,
	tblstyleoverridetypeNwCell:  9,
	tblstyleoverridetypeSeCell: 10,
	tblstyleoverridetypeSwCell: 11,
	tblstyleoverridetypeWholeTable: 12
};
var EWmlColorSchemeIndex = {
	wmlcolorschemeindexAccent1:  0,
	wmlcolorschemeindexAccent2:  1,
	wmlcolorschemeindexAccent3:  2,
	wmlcolorschemeindexAccent4:  3,
	wmlcolorschemeindexAccent5:  4,
	wmlcolorschemeindexAccent6:  5,
	wmlcolorschemeindexDark1:  6,
	wmlcolorschemeindexDark2:  7,
	wmlcolorschemeindexFollowedHyperlink:  8,
	wmlcolorschemeindexHyperlink:  9,
	wmlcolorschemeindexLight1: 10,
	wmlcolorschemeindexLight2: 11
};
var EHint = {
	hintCs: 0,
	hintDefault: 1,
	hintEastAsia: 2
};
var ETblLayoutType = {
	tbllayouttypeAutofit: 1,
	tbllayouttypeFixed: 2
};
var ESectionMark = {
	sectionmarkContinuous: 0,
	sectionmarkEvenPage: 1,
	sectionmarkNextColumn: 2,
	sectionmarkNextPage: 3,
	sectionmarkOddPage: 4
};
var EThemeColor = {
	themecolorAccent1:  0,
	themecolorAccent2:  1,
	themecolorAccent3:  2,
	themecolorAccent4:  3,
	themecolorAccent5:  4,
	themecolorAccent6:  5,
	themecolorBackground1:  6,
	themecolorBackground2:  7,
	themecolorDark1:  8,
	themecolorDark2:  9,
	themecolorFollowedHyperlink: 10,
	themecolorHyperlink: 11,
	themecolorLight1: 12,
	themecolorLight2: 13,
	themecolorNone: 14,
	themecolorText1: 15,
	themecolorText2: 16
};
var EWrap = {
	wrapAround: 0,
	wrapAuto: 1,
	wrapNone: 2,
	wrapNotBeside: 3,
	wrapThrough: 4,
	wrapTight: 5
};

// math
var c_oAscLimLoc = {
  SubSup: 0x00,
  UndOvr: 0x01
};
var c_oAscMathJc = {
  Center: 0x00,
  CenterGroup: 0x01,
  Left: 0x02,
  Right: 0x03
};
var c_oAscTopBot = {
  Bot: 0x00,
  Top: 0x01
};
var c_oAscScript = {
  DoubleStruck: 0x00,
  Fraktur: 0x01,
  Monospace: 0x02,
  Roman: 0x03,
  SansSerif: 0x04,
  Script: 0x05
};
var c_oAscShp = {
  Centered: 0x00,
  Match: 0x01
};
var c_oAscSty = {
  Bold: 0x00,
  BoldItalic: 0x01,
  Italic: 0x02,
  Plain: 0x03
};
var c_oAscFType = {
  Bar: 0x00,
  Lin: 0x01,
  NoBar: 0x02,
  Skw: 0x03
};
var c_oAscBrkBin = {
  After: 0x00,
  Before: 0x01,
  Repeat: 0x02
};
var c_oAscBrkBinSub = {
  PlusMinus: 0x00,
  MinusPlus: 0x01,
  MinusMinus: 0x02
};

var g_sErrorCharCountMessage = "g_sErrorCharCountMessage";
var g_nErrorCharCount = 30000;
var g_nErrorParagraphCount = 1000;
var c_oToNextParType = {
	BookmarkStart: 0,
	BookmarkEnd: 1,
	MoveFromRangeStart: 2,
	MoveFromRangeEnd: 3,
	MoveToRangeStart: 4,
	MoveToRangeEnd: 5
};
var ESdtType = {
	sdttypeUnknown: 255,
	sdttypeBibliography: 0,
	sdttypeCitation: 1,
	sdttypeComboBox: 2,
	sdttypeDate: 3,
	sdttypeDocPartList: 4,
	sdttypeDocPartObj: 5,
	sdttypeDropDownList: 6,
	sdttypeEquation: 7,
	sdttypeGroup: 8,
	sdttypePicture: 9,
	sdttypeRichText: 10,
	sdttypeText: 11,
	sdttypeCheckBox: 12
};

	function getCommentAdditionalData (comment) {
		var AdditionalData = "";
		if(null != comment.m_sOOTime && "" != comment.m_sOOTime)
		{
			AdditionalData += "teamlab_data:";
			var dateStr = new Date(comment.m_sOOTime - 0).toISOString().slice(0, 19) + 'Z';
			AdditionalData += "0;" + dateStr.length + ";" + dateStr + ";";
		}
		return AdditionalData;
	};
	function ReadNextInteger(_parsed)
	{
		var _len = _parsed.data.length;
		var _found = -1;

		var _Found = ";".charCodeAt(0);
		for (var i = _parsed.pos; i < _len; i++)
		{
			if (_Found == _parsed.data.charCodeAt(i))
			{
				_found = i;
				break;
			}
		}

		if (-1 == _found)
			return -1;

		var _ret = parseInt(_parsed.data.substr(_parsed.pos, _found - _parsed.pos));
		if (isNaN(_ret))
			return -1;

		_parsed.pos = _found + 1;
		return _ret;
	};

	function ParceAdditionalData(AdditionalData, _comment_data)
	{
		if (AdditionalData.indexOf("teamlab_data:") != 0)
			return;

		var _parsed = { data : AdditionalData, pos : "teamlab_data:".length };

		while (true)
		{
			var _attr = ReadNextInteger(_parsed);
			if (-1 == _attr)
				break;

			var _len = ReadNextInteger(_parsed);
			if (-1 == _len)
				break;

			var _value = _parsed.data.substr(_parsed.pos, _len);
			_parsed.pos += (_len + 1);

			if (0 == _attr){
				var dateMs = AscCommon.getTimeISO8601(_value);
				if (isNaN(dateMs)) {
					dateMs = new Date().getTime();
				}
				_comment_data.OODate = dateMs + "";
			}
		}
	}

function CreateThemeUnifill(color, tint, shade){
	var ret = null;
	if(null != color){
		var id;
		switch(color){
			case EThemeColor.themecolorAccent1: id = 0;break;
			case EThemeColor.themecolorAccent2: id = 1;break;
			case EThemeColor.themecolorAccent3: id = 2;break;
			case EThemeColor.themecolorAccent4: id = 3;break;
			case EThemeColor.themecolorAccent5: id = 4;break;
			case EThemeColor.themecolorAccent6: id = 5;break;
			case EThemeColor.themecolorBackground1: id = 6;break;
			case EThemeColor.themecolorBackground2: id = 7;break;
			case EThemeColor.themecolorDark1: id = 8;break;
			case EThemeColor.themecolorDark2: id = 9;break;
			case EThemeColor.themecolorFollowedHyperlink: id = 10;break;
			case EThemeColor.themecolorHyperlink: id = 11;break;
			case EThemeColor.themecolorLight1: id = 12;break;
			case EThemeColor.themecolorLight2: id = 13;break;
			case EThemeColor.themecolorNone: return null;break;
			case EThemeColor.themecolorText1: id = 15;break;
			case EThemeColor.themecolorText2: id = 16;break;
		}
		ret = new AscFormat.CUniFill();
		ret.setFill(new AscFormat.CSolidFill());
		ret.fill.setColor(new AscFormat.CUniColor());
		ret.fill.color.setColor(new AscFormat.CSchemeColor());
		ret.fill.color.color.setId(id);
		if(null != tint || null != shade){
			ret.fill.color.setMods(new AscFormat.CColorModifiers());
			var mod;
			if(null != tint){
				mod = new AscFormat.CColorMod();
				mod.setName("wordTint");
				mod.setVal(tint /** 100000.0 / 0xff*/);
				ret.fill.color.Mods.addMod(mod);
			}
			if(null != shade){
				mod = new AscFormat.CColorMod();
				mod.setName("wordShade");
				mod.setVal(shade /** 100000.0 / 0xff*/);
				ret.fill.color.Mods.addMod(mod);
			}
		}
	}
	return ret;
}

function WriteTrackRevision(bs, Id, reviewInfo, options) {
	//increment id
	bs.WriteItem(c_oSerProp_RevisionType.Id, function(){bs.memory.WriteLong(Id);});
	if (reviewInfo) {
		if(null != reviewInfo.UserName){
			bs.memory.WriteByte(c_oSerProp_RevisionType.Author);
			bs.memory.WriteString2(reviewInfo.UserName);
		}
		if(reviewInfo.DateTime > 0){
			var dateStr = new Date(reviewInfo.DateTime).toISOString().slice(0, 19) + 'Z';
			bs.memory.WriteByte(c_oSerProp_RevisionType.Date);
			bs.memory.WriteString2(dateStr);
		}
		if(reviewInfo.UserId){
			bs.memory.WriteByte(c_oSerProp_RevisionType.UserId);
			bs.memory.WriteString2(reviewInfo.UserId);
		}
	}
    if(options){
        if (null != options.run) {
            bs.WriteItem(c_oSerProp_RevisionType.Content, function(){options.run();});
        }
        if (null != options.runContent) {
            bs.WriteItem(c_oSerProp_RevisionType.ContentRun, function(){options.runContent();});
        }
        if (null != options.rPr) {
            bs.WriteItem(c_oSerProp_RevisionType.rPrChange, function(){options.brPrs.Write_rPr(options.rPr, null, null);});
        }
        if (null != options.pPr) {
            bs.WriteItem(c_oSerProp_RevisionType.pPrChange, function(){options.bpPrs.Write_pPr(options.pPr);});
        }
		if (null != options.grid) {
			bs.WriteItem(c_oSerProp_RevisionType.tblGridChange, function(){options.btw.WriteTblGrid(options.grid);});
		}
		if (null != options.tblPr) {
			bs.WriteItem(c_oSerProp_RevisionType.tblPrChange, function(){options.btw.WriteTblPr(options.tblPr);});
		}
		if (null != options.trPr) {
			bs.WriteItem(c_oSerProp_RevisionType.trPrChange, function(){options.btw.WriteRowPr(options.trPr);});
		}
		if (null != options.tcPr) {
			bs.WriteItem(c_oSerProp_RevisionType.tcPrChange, function(){options.btw.WriteCellPr(options.tcPr);});
		}
    }
};

function ReadTrackRevision(type, length, stream, reviewInfo, options) {
    var res = c_oSerConstants.ReadOk;
    if(c_oSerProp_RevisionType.Author == type) {
        reviewInfo.UserName = stream.GetString2LE(length);
    } else if(c_oSerProp_RevisionType.Date == type) {
        var dateStr = stream.GetString2LE(length);
        var dateMs = AscCommon.getTimeISO8601(dateStr);
        if (isNaN(dateMs)) {
            dateMs = new Date().getTime();
        }
        reviewInfo.DateTime = dateMs;
    } else if(c_oSerProp_RevisionType.UserId == type) {
        reviewInfo.UserId = stream.GetString2LE(length);
    } else if(options) {
        if(c_oSerProp_RevisionType.Content == type) {
            res = options.bdtr.bcr.Read1(length, function (t, l) {
                return options.bdtr.ReadParagraphContent(t, l, options.parStruct);
            });
        } else if(c_oSerProp_RevisionType.ContentRun == type) {
            res = options.bmr.bcr.Read1(length, function(t, l){
                return options.bmr.ReadMathMRun(t, l, options.run, options.props, options.oElem, options.parStruct);
            });
        } else if(c_oSerProp_RevisionType.rPrChange == type) {
            res = options.brPrr.Read(length, options.rPr, null);
        } else if(c_oSerProp_RevisionType.pPrChange == type) {
            res = options.bpPrr.Read(length, options.pPr, null);
		} else if(c_oSerProp_RevisionType.tblGridChange == type) {
			res = options.btblPrr.bcr.Read2(length, function(t, l){
				return options.btblPrr.Read_tblGrid(t,l, options.grid);
			});
		} else if(c_oSerProp_RevisionType.tblPrChange == type) {
			res = options.btblPrr.bcr.Read1(length, function(t, l){
				return options.btblPrr.Read_tblPr(t,l, options.tblPr);
			});
		} else if(c_oSerProp_RevisionType.trPrChange == type) {
			res = options.btblPrr.bcr.Read2(length, function(t, l){
				return options.btblPrr.Read_RowPr(t,l, options.trPr);
			});
		} else if(c_oSerProp_RevisionType.tcPrChange == type) {
			res = options.btblPrr.bcr.Read2(length, function(t, l){
				return options.btblPrr.Read_CellPr(t,l, options.tcPr);
			});
        } else {
            res = c_oSerConstants.ReadUnknown;
        }
    } else
        res = c_oSerConstants.ReadUnknown;
    return res;
};

function WiteMoveRangeStartElem(bs, Id, moveRange) {
	//increment id
	bs.WriteItem(c_oSerMoveRange.Id, function() {
		bs.memory.WriteLong(Id);
	});
	if (null != moveRange.GetMarkId()) {
		bs.memory.WriteByte(c_oSerMoveRange.Name);
		bs.memory.WriteString2(moveRange.GetMarkId());
	}
	var reviewInfo = moveRange.GetReviewInfo();
	if (reviewInfo) {
		if (null != reviewInfo.UserName) {
			bs.memory.WriteByte(c_oSerMoveRange.Author);
			bs.memory.WriteString2(reviewInfo.UserName);
		}
		if (reviewInfo.DateTime > 0) {
			var dateStr = new Date(reviewInfo.DateTime).toISOString().slice(0, 19) + 'Z';
			bs.memory.WriteByte(c_oSerMoveRange.Date);
			bs.memory.WriteString2(dateStr);
		}
		if (reviewInfo.UserId) {
			bs.memory.WriteByte(c_oSerMoveRange.UserId);
			bs.memory.WriteString2(reviewInfo.UserId);
		}
	}
}
function WiteMoveRangeEndElem(bs, Id) {
	//increment id
	bs.WriteItem(c_oSerMoveRange.Id, function() {
		bs.memory.WriteLong(Id);
	});
}
function WiteMoveRange(bs, saveParams, elem) {
	var recordType;
	var moveRangeNameToId;
	if (elem.IsFrom()) {
		moveRangeNameToId = saveParams.moveRangeFromNameToId;
		recordType = elem.IsStart() ? c_oSerParType.MoveFromRangeStart : c_oSerParType.MoveFromRangeEnd;
	} else {
		moveRangeNameToId = saveParams.moveRangeToNameToId;
		recordType = elem.IsStart() ? c_oSerParType.MoveToRangeStart : c_oSerParType.MoveToRangeEnd;
	}
	var revisionId = moveRangeNameToId[elem.GetMarkId()];
	if (undefined === revisionId) {
		revisionId = saveParams.trackRevisionId++;
		moveRangeNameToId[elem.GetMarkId()] = revisionId;
	}
	bs.WriteItem(recordType, function() {
		if(elem.IsStart()){
			WiteMoveRangeStartElem(bs, revisionId, elem);
		} else {
			WiteMoveRangeEndElem(bs, revisionId);
		}
	});
}

function ReadMoveRangeStartElem(type, length, stream, reviewInfo, options) {
	var res = c_oSerConstants.ReadOk;
	if (c_oSerMoveRange.Author == type) {
		reviewInfo.UserName = stream.GetString2LE(length);
		// } else if (c_oSerMoveRange.ColFirst == type) {
		// 	stream.GetULongLE();
		// } else if (c_oSerMoveRange.ColLast == type) {
		// 	stream.GetULongLE();
	} else if (c_oSerMoveRange.Date == type) {
		var dateStr = stream.GetString2LE(length);
		var dateMs = AscCommon.getTimeISO8601(dateStr);
		if (isNaN(dateMs)) {
			dateMs = new Date().getTime();
		}
		reviewInfo.DateTime = dateMs;
		// } else if (c_oSerMoveRange.DisplacedByCustomXml == type) {
		// 	stream.GetUChar();
	} else if (c_oSerMoveRange.Id == type) {
		options.id = stream.GetULongLE();
	} else if (c_oSerMoveRange.Name == type) {
		options.name = stream.GetString2LE(length);
	} else if (c_oSerMoveRange.UserId == type) {
		reviewInfo.UserId = stream.GetString2LE(length);
	} else {
		res = c_oSerConstants.ReadUnknown;
	}
	return res;
}
function ReadMoveRangeEndElem(type, length, stream, options) {
	var res = c_oSerConstants.ReadOk;
	// if (c_oSerMoveRange.DisplacedByCustomXml == type) {
	// 	stream.GetUChar();
	if (c_oSerMoveRange.Id == type) {
		options.id = stream.GetULongLE();
	} else {
		res = c_oSerConstants.ReadUnknown;
	}
	return res;
}
function readMoveRangeStart(length, bcr, stream, oReadResult, oParStruct, isFrom) {
	var reviewInfo = new CReviewInfo();
	var options = {name: null, id: null};
	var res = bcr.Read1(length, function(t, l) {
		return ReadMoveRangeStartElem(t, l, stream, reviewInfo, options);
	});
	if (options.name && options.id) {
		var move = new CParaRevisionMove(true, isFrom, options.name, reviewInfo);
		oReadResult.moveRanges[options.id] = move;
		oParStruct.addToContent(move);
	}
	return res;
}
function readMoveRangeEnd(length, bcr, stream, oReadResult, oParStruct, isFrom, isRun) {
	if (!oParStruct) {
		return false;
	}
	var oldPos = stream.GetCurPos();
	var options = {id: null};
	bcr.Read1(length, function(t, l) {
		return ReadMoveRangeEndElem(t, l, stream, options);
	});
	var moveStart = oReadResult.moveRanges[options.id];
	if (moveStart) {
		if (isRun) {
			if (oParStruct.GetContentLength() > 0) {
				var run = oParStruct.GetFromContent(oParStruct.GetContentLength() - 1);
				run.Add_ToContent(run.GetElementsCount(), new CRunRevisionMove(false, isFrom, moveStart.GetMarkId()), false);
			}
		} else {
			oParStruct.addToContent(new CParaRevisionMove(false, isFrom, moveStart.GetMarkId()));
		}
	} else {
		stream.Seek2(oldPos);
		return false;
	}
	return true;
}
function readBookmarkStart(length, bcr, oReadResult, oParStruct, openParams) {
	var bookmark = oReadResult.bookmarkForRead;
	bookmark.BookmarkId = undefined;
	bookmark.BookmarkName = undefined;
	bcr.Read1(length, function(t, l){
		return bcr.ReadBookmark(t,l, bookmark);
	});
	if (undefined !== bookmark.BookmarkId && undefined !== bookmark.BookmarkName) {
		var isCopyPaste = oReadResult.bCopyPaste;
		var bookmarksManager = oReadResult.logicDocument.BookmarksManager;
		if(!isCopyPaste || (isCopyPaste && bookmarksManager && null === bookmarksManager.GetBookmarkByName(bookmark.BookmarkName))){
			var newBookmark = new CParagraphBookmark(true, bookmark.BookmarkId, bookmark.BookmarkName);
			oReadResult.bookmarksStarted[bookmark.BookmarkId] = {parent: oParStruct.getElem(), bookmark: newBookmark};
			oParStruct.addToContent(newBookmark);
		}
	}
}
function readBookmarkEnd(length, bcr, stream, oReadResult, oParStruct) {
	if (!oParStruct) {
		return false;
	}
	var oldPos = stream.GetCurPos();
	var bookmark = oReadResult.bookmarkForRead;
	bookmark.BookmarkId = undefined;
	bcr.Read1(length, function(t, l){
		return bcr.ReadBookmark(t,l, bookmark);
	});
	if (oReadResult.bookmarksStarted[bookmark.BookmarkId]) {
		delete oReadResult.bookmarksStarted[bookmark.BookmarkId];
		oParStruct.addToContent(new CParagraphBookmark(false, bookmark.BookmarkId));
	} else {
		stream.Seek2(oldPos);
		return false;
	}
	return true;
}
function addToNextPar(toNextParStruct, bcr, stream, oReadResult, oParStruct, openParams) {
	if (toNextParStruct.length > 0) {
		var oldPos = stream.GetCurPos();
		for (var i = 0; i < toNextParStruct.length; i+=3) {
			var type = toNextParStruct[i];
			stream.Seek2(toNextParStruct[i + 1]);
			var length = toNextParStruct[i + 2];
			switch (type) {
				case c_oToNextParType.BookmarkStart:
					readBookmarkStart(length, bcr, oReadResult, oParStruct, openParams);
					break;
				case c_oToNextParType.BookmarkEnd:
					readBookmarkEnd(length, bcr, stream, oReadResult, oParStruct);
					break;
				case c_oToNextParType.MoveFromRangeStart:
					readMoveRangeStart(length, bcr, stream, oReadResult, oParStruct, true);
					break;
				case c_oToNextParType.MoveFromRangeEnd:
					readMoveRangeEnd(length, bcr, stream, oReadResult, oParStruct, true);
					break;
				case c_oToNextParType.MoveToRangeStart:
					readMoveRangeStart(length, bcr, stream, oReadResult, oParStruct, false);
					break;
				case c_oToNextParType.MoveToRangeEnd:
					readMoveRangeEnd(length, bcr, stream, oReadResult, oParStruct, false);
					break;
			}
		}
		stream.Seek2(oldPos);
		toNextParStruct.length = 0;
	}
}
function initMathRevisions(elem ,props, reader) {
    if(props.del) {
        elem.SetReviewTypeWithInfo(reviewtype_Remove, props.del, false);
    } else if(props.ins) {
        elem.SetReviewTypeWithInfo(reviewtype_Add, props.ins, false);
    } else {
		return true;
	}
	return reader.oReadResult.checkReadRevisions();
};
function setNestedReviewType(elem, type, reviewInfo) {
	if (elem && elem.SetReviewTypeWithInfo && elem.GetReviewType) {
		//coping prevents self reference in case of setting one reviewInfo to multiple elems (<ins><ins><r/><r/></ins></ins>)
		reviewInfo = reviewInfo.Copy();
		if (reviewtype_Common !== elem.GetReviewType()) {
			elem.GetReviewInfo().SetPrevReviewTypeWithInfoRecursively(type, reviewInfo);
		} else {
			elem.SetReviewTypeWithInfo(type, reviewInfo, false);
		}
	}
}
function writeNestedReviewType(type, reviewInfo, fWriteRecord, fCallback) {
	if (reviewInfo.PrevInfo) {
		writeNestedReviewType(reviewInfo.PrevType, reviewInfo.PrevInfo, fWriteRecord, function(delText) {
			fWriteRecord(type, reviewInfo, delText, fCallback);
		});
	} else {
		fWriteRecord(type, reviewInfo, false, fCallback);
	}
}

function BinaryFileWriter(doc, bMailMergeDocx, bMailMergeHtml, isCompatible)
{
    this.memory = new AscCommon.CMemory();
    this.Document = doc;
    this.nLastFilePos = 0;
    this.nRealTableCount = 0;
	this.nStart = 0;
    this.bs = new BinaryCommonWriter(this.memory);
	this.copyParams = {
		bLockCopyElems: null,
		itemCount: null,
		bdtw: null,
		oUsedNumIdMap: null,
		nNumIdIndex: null,
		oUsedStyleMap: null
	};
	this.saveParams = new DocSaveParams(bMailMergeDocx, bMailMergeHtml, isCompatible);
    this.Write = function(noBase64, onlySaveBase64)
    {
        pptx_content_writer._Start();
		if (noBase64) {
			this.memory.WriteXmlString(this.WriteFileHeader(0, Asc.c_nVersionNoBase64));
		}
        this.WriteMainTable();
        pptx_content_writer._End();
		if (noBase64) {
			if (onlySaveBase64) {
				return this.memory.GetBase64Memory();
			} else {
				return this.memory.GetData();
			}
		} else {
			return this.GetResult();
		}
    }
	this.GetResult = function()
	{
		return this.WriteFileHeader(this.memory.GetCurPosition(), AscCommon.c_oSerFormat.Version) + this.memory.GetBase64Memory();
	}
    this.WriteFileHeader = function(nDataSize, version)
    {
        return AscCommon.c_oSerFormat.Signature + ";v" + version + ";" + nDataSize  + ";";
    }
    this.WriteMainTable = function()
    {
        this.WriteMainTableStart();
		this.WriteMainTableContent();
		this.WriteMainTableEnd();
    }
	this.WriteMainTableStart = function()
    {
        var nTableCount = 128;//Специально ставим большое число, чтобы не увеличивать его при добавлении очередной таблицы.
        this.nRealTableCount = 0;
        this.nStart = this.memory.GetCurPosition();
        //вычисляем с какой позиции можно писать таблицы
        var nmtItemSize = 5;//5 byte
        this.nLastFilePos = this.nStart + nTableCount * nmtItemSize;
        //Write mtLen 
        this.memory.WriteByte(0);
    }
	this.WriteMainTableContent = function()
    {
		var t = this;
        //Write SignatureTable
        this.WriteTable(c_oSerTableTypes.Signature, new BinarySigTableWriter(this.memory, this.Document));
		if (this.Document.App) {
			this.WriteTable(c_oSerTableTypes.App, {Write: function(){
				var old = new AscCommon.CMemory(true);
				pptx_content_writer.BinaryFileWriter.ExportToMemory(old);
				pptx_content_writer.BinaryFileWriter.ImportFromMemory(t.memory);
				t.Document.App.toStream(pptx_content_writer.BinaryFileWriter);
				pptx_content_writer.BinaryFileWriter.ExportToMemory(t.memory);
				pptx_content_writer.BinaryFileWriter.ImportFromMemory(old);
			}});
		}
		if (this.Document.Core) {
			this.WriteTable(c_oSerTableTypes.Core, {Write: function(){
				var old = new AscCommon.CMemory(true);
				pptx_content_writer.BinaryFileWriter.ExportToMemory(old);
				pptx_content_writer.BinaryFileWriter.ImportFromMemory(t.memory);
				t.Document.Core.toStream(pptx_content_writer.BinaryFileWriter, t.Document.DrawingDocument.m_oWordControl.m_oApi);
				pptx_content_writer.BinaryFileWriter.ExportToMemory(t.memory);
				pptx_content_writer.BinaryFileWriter.ImportFromMemory(old);
			}});
		}
		//Write Settings
		this.WriteTable(c_oSerTableTypes.Settings, new BinarySettingsTableWriter(this.memory, this.Document, this.saveParams));
		
		//Write Comments
		var oMapCommentId = {};
		var commentUniqueGuids = {};
		this.WriteTable(c_oSerTableTypes.Comments, new BinaryCommentsTableWriter(this.memory, this.Document, oMapCommentId, commentUniqueGuids, false));
		this.WriteTable(c_oSerTableTypes.DocumentComments, new BinaryCommentsTableWriter(this.memory, this.Document, oMapCommentId, commentUniqueGuids, true));
        //Write Numbering
		var oNumIdMap = {};
        this.WriteTable(c_oSerTableTypes.Numbering, new BinaryNumberingTableWriter(this.memory, this.Document, oNumIdMap, null, this.saveParams));
        //Write StyleTable
        this.WriteTable(c_oSerTableTypes.Style, new BinaryStyleTableWriter(this.memory, this.Document, oNumIdMap, null, this.saveParams));
        //Write DocumentTable
		var oBinaryHeaderFooterTableWriter = new BinaryHeaderFooterTableWriter(this.memory, this.Document, oNumIdMap, oMapCommentId, this.saveParams);
        this.WriteTable(c_oSerTableTypes.Document, new BinaryDocumentTableWriter(this.memory, this.Document, oMapCommentId, oNumIdMap, null, this.saveParams, oBinaryHeaderFooterTableWriter));
        //Write HeaderFooter
        this.WriteTable(c_oSerTableTypes.HdrFtr, oBinaryHeaderFooterTableWriter);
		//Write Footnotes
		if (this.saveParams.footnotesIndex > 0) {
			this.WriteTable(c_oSerTableTypes.Footnotes, new BinaryNotesTableWriter(this.memory, this.Document, oNumIdMap, oMapCommentId, null, this.saveParams));
		}
        //Write OtherTable
		var oBinaryOtherTableWriter = new BinaryOtherTableWriter(this.memory, this.Document)
        this.WriteTable(c_oSerTableTypes.Other, oBinaryOtherTableWriter);
    }
	this.WriteMainTableEnd = function()
    {
        //Пишем количество таблиц
        this.memory.Seek(this.nStart);
        this.memory.WriteByte(this.nRealTableCount);
        
        //seek в конец, потому что GetBase64Memory заканчивает запись на текущей позиции.
        this.memory.Seek(this.nLastFilePos);
    }
	this.CopyStart = function()
    {
		var api = this.Document.DrawingDocument.m_oWordControl.m_oApi;
		pptx_content_writer.Start_UseFullUrl();
        if (api.ThemeLoader) {
            pptx_content_writer.Start_UseDocumentOrigin(api.ThemeLoader.ThemesUrlAbs);
        }

        pptx_content_writer._Start();
		this.copyParams.bLockCopyElems = 0;
		this.copyParams.itemCount = 0;
		this.copyParams.oUsedNumIdMap = {};
		this.copyParams.nNumIdIndex = 1;
		this.copyParams.oUsedStyleMap = {};
		this.copyParams.bdtw = new BinaryDocumentTableWriter(this.memory, this.Document, null, this.copyParams.oUsedNumIdMap, this.copyParams, this.saveParams, null);
		this.copyParams.nDocumentWriterTablePos = 0;
		this.copyParams.nDocumentWriterPos = 0;
		
		this.WriteMainTableStart();
		
		var oMapCommentId = {};
		var commentUniqueGuids = {};
		this.WriteTable(c_oSerTableTypes.Comments, new BinaryCommentsTableWriter(this.memory, this.Document, oMapCommentId, commentUniqueGuids, false));
		this.WriteTable(c_oSerTableTypes.DocumentComments, new BinaryCommentsTableWriter(this.memory, this.Document, oMapCommentId, commentUniqueGuids, true));
		this.copyParams.bdtw.oMapCommentId = oMapCommentId;
		
		this.copyParams.nDocumentWriterTablePos = this.WriteTableStart(c_oSerTableTypes.Document);
		this.copyParams.nDocumentWriterPos = this.bs.WriteItemWithLengthStart();
	}
	this.CopyParagraph = function(Item, selectedAll)
    {
		//сами параграфы скопируются в методе CopyTable, нужно только проанализировать стили
		if(this.copyParams.bLockCopyElems > 0)
			return;
		var oThis = this;
        this.bs.WriteItem(c_oSerParType.Par, function(){oThis.copyParams.bdtw.WriteParapraph(Item, false, selectedAll);});
		this.copyParams.itemCount++;
	}
	this.CopyTable = function(Item, aRowElems, nMinGrid, nMaxGrid)
    {
		//сама таблица скопируются в методе CopyTable у родительской таблицы, нужно только проанализировать стили
		if(this.copyParams.bLockCopyElems > 0)
			return;
		var oThis = this;
        this.bs.WriteItem(c_oSerParType.Table, function(){oThis.copyParams.bdtw.WriteDocTable(Item, aRowElems, nMinGrid, nMaxGrid);});
		this.copyParams.itemCount++;
	}
	this.CopySdt = function(Item)
	{
		if(this.copyParams.bLockCopyElems > 0)
			return;
		var oThis = this;
		this.bs.WriteItem(c_oSerParType.Sdt, function(){oThis.copyParams.bdtw.WriteSdt(Item, 0);});
		this.copyParams.itemCount++;
	}
	this.CopyEnd = function()
    {
		this.bs.WriteItemWithLengthEnd(this.copyParams.nDocumentWriterPos);
		this.WriteTableEnd(this.copyParams.nDocumentWriterTablePos);

		//Write Footnotes
		if (this.saveParams.footnotesIndex > 0) {
			this.WriteTable(c_oSerTableTypes.Footnotes, new BinaryNotesTableWriter(this.memory, this.Document, this.copyParams.oUsedNumIdMap, null, this.copyParams, this.saveParams));
		}
        this.WriteTable(c_oSerTableTypes.Numbering, new BinaryNumberingTableWriter(this.memory, this.Document, {}, this.copyParams.oUsedNumIdMap, this.saveParams));
        this.WriteTable(c_oSerTableTypes.Style, new BinaryStyleTableWriter(this.memory, this.Document, this.copyParams.oUsedNumIdMap, this.copyParams, this.saveParams));
		
		this.WriteMainTableEnd();
		pptx_content_writer._End();
		pptx_content_writer.End_UseFullUrl();
	}
    this.WriteTable = function(type, oTableSer)
    {
		var nCurPos = this.WriteTableStart(type);
        oTableSer.Write();
		this.WriteTableEnd(nCurPos);
    }
	this.WriteTableStart = function(type)
    {
        //Write mtItem
        //Write mtiType
        this.memory.WriteByte(type);
        //Write mtiOffBits
        this.memory.WriteLong(this.nLastFilePos);
        
        //Write table
        //Запоминаем позицию в MainTable
        var nCurPos = this.memory.GetCurPosition();
        //Seek в свободную область
        this.memory.Seek(this.nLastFilePos);
		return nCurPos;
	}
	this.WriteTableEnd = function(nCurPos)
    {
		//сдвигаем позицию куда можно следующую таблицу
        this.nLastFilePos = this.memory.GetCurPosition();
        //Seek вобратно в MainTable
        this.memory.Seek(nCurPos);
        
        this.nRealTableCount++;
	}
}
function BinarySigTableWriter(memory)
{
    this.memory = memory;
    this.Write = function()
    {
        //Write stVersion
        this.memory.WriteByte(c_oSerSigTypes.Version);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.memory.WriteLong(AscCommon.c_oSerFormat.Version);
    }
};
function BinaryStyleTableWriter(memory, doc, oNumIdMap, copyParams, saveParams)
{
    this.memory = memory;
    this.Document = doc;
	this.copyParams = copyParams;
    this.bs = new BinaryCommonWriter(this.memory);
	this.btblPrs = new Binary_tblPrWriter(this.memory, oNumIdMap, saveParams);
    this.bpPrs = new Binary_pPrWriter(this.memory, oNumIdMap, null, saveParams);
    this.brPrs = new Binary_rPrWriter(this.memory, saveParams);
    this.Write = function()
    {
        var oThis = this;
        this.bs.WriteItemWithLength(function(){oThis.WriteStylesContent();});
    };
    this.WriteStylesContent = function()
    {
        var oThis = this;
        var oStyles = this.Document.Styles;
        var oDef_pPr = oStyles.Default.ParaPr;
        var oDef_rPr = oStyles.Default.TextPr;
        
        //default pPr
        this.bs.WriteItem(c_oSer_st.DefpPr, function(){oThis.bpPrs.Write_pPr(oDef_pPr);});
        //default rPr
        this.bs.WriteItem(c_oSer_st.DefrPr, function(){oThis.brPrs.Write_rPr(oDef_rPr, null, null);});
        //styles
        this.bs.WriteItem(c_oSer_st.Styles, function(){oThis.WriteStyles(oStyles.Style, oStyles.Default);});
    };
    this.WriteStyles = function(styles, oDefault)
    {
        var oThis = this;
		var oStyleToWrite = styles;
		if(this.copyParams && this.copyParams.oUsedStyleMap)
			oStyleToWrite = this.copyParams.oUsedStyleMap;
        for(var styleId in oStyleToWrite)
        {
            var style = styles[styleId];
            var bDefault = false;
			if(styleId == oDefault.Character)
                bDefault = true;
            else if(styleId == oDefault.Paragraph)
                bDefault = true;
            else if(styleId == oDefault.Numbering)
                bDefault = true;
            else if(styleId == oDefault.Table)
                bDefault = true;
            this.bs.WriteItem(c_oSer_sts.Style, function(){oThis.WriteStyle(styleId, style, bDefault);});
        }
    };
    this.WriteStyle = function(id, style, bDefault)
    {
        var oThis = this;
		var compilePr = this.copyParams ? this.Document.Styles.Get_Pr(id, style.Get_Type()) : style;
		
        //ID
        if(null != id)
        {
            this.memory.WriteByte(c_oSer_sts.Style_Id);
            this.memory.WriteString2(id.toString());
        }
        //Name
        if(null != style.Name)
        {
            this.memory.WriteByte(c_oSer_sts.Style_Name);
            this.memory.WriteString2(style.Name.toString());
        }
        //Type
        if(null != style.Type)
		{
			var nSerStyleType = c_oSer_StyleType.Paragraph;
			switch(style.Type)
			{
				case styletype_Character: nSerStyleType = c_oSer_StyleType.Character;break;
				case styletype_Numbering: nSerStyleType = c_oSer_StyleType.Numbering;break;
				case styletype_Paragraph: nSerStyleType = c_oSer_StyleType.Paragraph;break;
				case styletype_Table: nSerStyleType = c_oSer_StyleType.Table;break;
			}
            this.bs.WriteItem(c_oSer_sts.Style_Type, function(){oThis.memory.WriteByte(nSerStyleType);});
		}
        //Default
        if(true == bDefault)
            this.bs.WriteItem(c_oSer_sts.Style_Default, function(){oThis.memory.WriteBool(bDefault);});
        //BasedOn
        if(null != style.BasedOn)
        {
            this.memory.WriteByte(c_oSer_sts.Style_BasedOn);
            this.memory.WriteString2(style.BasedOn.toString());
        }
        //Next
        if(null != style.Next)
        {
            this.memory.WriteByte(c_oSer_sts.Style_Next);
            this.memory.WriteString2(style.Next.toString());
        }
		if(null != style.Link)
		{
			this.memory.WriteByte(c_oSer_sts.Style_Link);
			this.memory.WriteString2(style.Link);
		}
        //qFormat
        if(null != style.qFormat)
            this.bs.WriteItem(c_oSer_sts.Style_qFormat, function(){oThis.memory.WriteBool(style.qFormat);});
        //uiPriority
        if(null != style.uiPriority)
            this.bs.WriteItem(c_oSer_sts.Style_uiPriority, function(){oThis.memory.WriteLong(style.uiPriority);});
        //hidden
        if(null != style.hidden)
            this.bs.WriteItem(c_oSer_sts.Style_hidden, function(){oThis.memory.WriteBool(style.hidden);});
        //semiHidden
        if(null != style.semiHidden)
            this.bs.WriteItem(c_oSer_sts.Style_semiHidden, function(){oThis.memory.WriteBool(style.semiHidden);});
        //unhideWhenUsed
        if(null != style.unhideWhenUsed)
            this.bs.WriteItem(c_oSer_sts.Style_unhideWhenUsed, function(){oThis.memory.WriteBool(style.unhideWhenUsed);});

		//'style' is CStyle, 'compilePr' is object with some properties from CStyle, therefore get some property from style anyway
		//TextPr
        if(null != compilePr.TextPr)
            this.bs.WriteItem(c_oSer_sts.Style_TextPr, function(){oThis.brPrs.Write_rPr(compilePr.TextPr, null, null);});
        //ParaPr
        if(null != compilePr.ParaPr)
            this.bs.WriteItem(c_oSer_sts.Style_ParaPr, function(){oThis.bpPrs.Write_pPr(compilePr.ParaPr);});
		if(styletype_Table == style.Type){
			//TablePr
			if(null != compilePr.TablePr)
				this.bs.WriteItem(c_oSer_sts.Style_TablePr, function(){oThis.btblPrs.WriteTblPr(compilePr.TablePr, null);});
			//TableRowPr
			if(null != compilePr.TableRowPr)
				this.bs.WriteItem(c_oSer_sts.Style_RowPr, function(){oThis.btblPrs.WriteRowPr(compilePr.TableRowPr);});
			//TableCellPr
			if(null != compilePr.TableCellPr)
				this.bs.WriteItem(c_oSer_sts.Style_CellPr, function(){oThis.btblPrs.WriteCellPr(compilePr.TableCellPr);});
			//TblStylePr
			var aTblStylePr = [];
			if(null != compilePr.TableBand1Horz)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeBand1Horz, val: compilePr.TableBand1Horz});
			if(null != compilePr.TableBand1Vert)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeBand1Vert, val: compilePr.TableBand1Vert});
			if(null != compilePr.TableBand2Horz)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeBand2Horz, val: compilePr.TableBand2Horz});
			if(null != compilePr.TableBand2Vert)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeBand2Vert, val: compilePr.TableBand2Vert});
			if(null != compilePr.TableFirstCol)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeFirstCol, val: compilePr.TableFirstCol});
			if(null != compilePr.TableFirstRow)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeFirstRow, val: compilePr.TableFirstRow});
			if(null != compilePr.TableLastCol)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeLastCol, val: compilePr.TableLastCol});
			if(null != compilePr.TableLastRow)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeLastRow, val: compilePr.TableLastRow});
			if(null != compilePr.TableTLCell)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeNwCell, val: compilePr.TableTLCell});
			if(null != compilePr.TableTRCell)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeNeCell, val: compilePr.TableTRCell});
			if(null != compilePr.TableBLCell)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeSwCell, val: compilePr.TableBLCell});
			if(null != compilePr.TableBRCell)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeSeCell, val: compilePr.TableBRCell});
			if(null != compilePr.TableWholeTable)
				aTblStylePr.push({type: ETblStyleOverrideType.tblstyleoverridetypeWholeTable, val: compilePr.TableWholeTable});
			if(aTblStylePr.length > 0)
				this.bs.WriteItem(c_oSer_sts.Style_TblStylePr, function(){oThis.WriteTblStylePr(aTblStylePr);});
		}
		if(style.IsCustom())
			this.bs.WriteItem(c_oSer_sts.Style_CustomStyle, function(){oThis.memory.WriteBool(true);});
		// if(null != style.Aliases){
		// 	this.memory.WriteByte(c_oSer_sts.Style_Aliases);
		// 	this.memory.WriteString2(style.Aliases);
		// }
		// if(null != style.AutoRedefine)
		// 	this.bs.WriteItem(c_oSer_sts.Style_AutoRedefine, function(){oThis.memory.WriteBool(style.AutoRedefine);});
		// if(null != style.Locked)
		// 	this.bs.WriteItem(c_oSer_sts.Style_Locked, function(){oThis.memory.WriteBool(style.Locked);});
		// if(null != style.Personal)
		// 	this.bs.WriteItem(c_oSer_sts.Style_Personal, function(){oThis.memory.WriteBool(style.Personal);});
		// if(null != style.PersonalCompose)
		// 	this.bs.WriteItem(c_oSer_sts.Style_PersonalCompose, function(){oThis.memory.WriteBool(style.PersonalCompose);});
		// if(null != style.PersonalReply)
		// 	this.bs.WriteItem(c_oSer_sts.Style_PersonalReply, function(){oThis.memory.WriteBool(style.PersonalReply);});
    };
	this.WriteTblStylePr = function(aTblStylePr)
    {
		var oThis = this;
		for(var i = 0, length = aTblStylePr.length; i < length; ++i)
			this.bs.WriteItem(c_oSerProp_tblStylePrType.TblStylePr, function(){oThis.WriteTblStyleProperty(aTblStylePr[i]);});
	};
	this.WriteTblStyleProperty = function(oProp)
	{
		var oThis = this;
		var type = oProp.type;
		var val = oProp.val;
		this.bs.WriteItem(c_oSerProp_tblStylePrType.Type, function(){oThis.memory.WriteByte(type);});
		if(null != val.TextPr)
			this.bs.WriteItem(c_oSerProp_tblStylePrType.RunPr, function(){oThis.brPrs.Write_rPr(val.TextPr, null, null);});
		if(null != val.ParaPr)
			this.bs.WriteItem(c_oSerProp_tblStylePrType.ParPr, function(){oThis.bpPrs.Write_pPr(val.ParaPr);});
		if(null != val.TablePr)
			this.bs.WriteItem(c_oSerProp_tblStylePrType.TblPr, function(){oThis.btblPrs.WriteTblPr(val.TablePr, null);});
		if(null != val.TableRowPr)
			this.bs.WriteItem(c_oSerProp_tblStylePrType.TrPr, function(){oThis.btblPrs.WriteRowPr(val.TableRowPr);});
		if(null != val.TableCellPr)
			this.bs.WriteItem(c_oSerProp_tblStylePrType.TcPr, function(){oThis.btblPrs.WriteCellPr(val.TableCellPr);});
	};
};
function Binary_pPrWriter(memory, oNumIdMap, oBinaryHeaderFooterTableWriter, saveParams)
{
    this.memory = memory;
	this.oNumIdMap = oNumIdMap;
    this.saveParams = saveParams;
	this.oBinaryHeaderFooterTableWriter = oBinaryHeaderFooterTableWriter;
    this.bs = new BinaryCommonWriter(this.memory);
    this.brPrs = new Binary_rPrWriter(this.memory, saveParams);
    this.Write_pPr = function(pPr, pPr_rPr, EndRun, SectPr, oDocument)
    {
        var oThis = this;
        //Стили надо писать первыми, потому что применение стиля при открытии уничтажаются настройки параграфа
        if(null != pPr.PStyle)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.ParaStyle);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.memory.WriteString2(pPr.PStyle);
        }
        //Списки надо писать после стилей, т.к. при открытии в методах добавления списка проверяются стили
        if(null != pPr.NumPr)
        {
			var numPr = pPr.NumPr;
			var id = null;
			if(null != this.oNumIdMap && null != numPr.NumId)
			{
				id = this.oNumIdMap[numPr.NumId];
				if(null == id)
					id = 0;
			}
			if(null != numPr.Lvl || null != id)
			{
				this.memory.WriteByte(c_oSerProp_pPrType.numPr);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteNumPr(id, numPr.Lvl);});
			}
        }
        //contextualSpacing
        if(null != pPr.ContextualSpacing)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.contextualSpacing);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(pPr.ContextualSpacing);
        }
        //Ind
        if(null != pPr.Ind)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Ind);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteInd(pPr.Ind);});
        }
        //Jc
        if(null != pPr.Jc)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Jc);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(pPr.Jc);
        }
        //KeepLines
        if(null != pPr.KeepLines)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.KeepLines);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(pPr.KeepLines);
        }
        //KeepNext
        if(null != pPr.KeepNext)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.KeepNext);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(pPr.KeepNext);
        }
        //PageBreakBefore
        if(null != pPr.PageBreakBefore)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.PageBreakBefore);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(pPr.PageBreakBefore);
        }
        //Spacing
        if(null != pPr.Spacing)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Spacing);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteSpacing(pPr.Spacing);});
        }
        //Shd
        if(null != pPr.Shd)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Shd);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.bs.WriteShd(pPr.Shd);});
        }
        //WidowControl
        if(null != pPr.WidowControl)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.WidowControl);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(pPr.WidowControl);
        }
        //Tabs
        if(null != pPr.Tabs && pPr.Tabs.Get_Count() > 0)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Tab);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteTabs(pPr.Tabs.Tabs);});
        }
        //EndRun
        if(null != pPr_rPr && null != EndRun)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.pPr_rPr);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.brPrs.Write_rPr(pPr_rPr, EndRun.Pr, EndRun);});
        }
        //pBdr
        if(null != pPr.Brd)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.pBdr);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.bs.WriteBorders(pPr.Brd);});
        }
		//FramePr
        if(null != pPr.FramePr)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.FramePr);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteFramePr(pPr.FramePr);});
        }
        //SectPr
        if(null != SectPr && null != oDocument)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.SectPr);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteSectPr(SectPr, oDocument);});
        }

        if(null != pPr.PrChange && pPr.ReviewInfo)
        {
            var bpPrs = new Binary_pPrWriter(this.memory, this.oNumIdMap, this.oBinaryHeaderFooterTableWriter, this.saveParams);
            this.memory.WriteByte(c_oSerProp_pPrType.pPrChange);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, pPr.ReviewInfo, {bpPrs: bpPrs, pPr: pPr.PrChange});});
        }
		if(null != pPr.OutlineLvl)
		{
			this.memory.WriteByte(c_oSerProp_pPrType.outlineLvl);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.memory.WriteLong(pPr.OutlineLvl);
		}
    };
    this.WriteInd = function(Ind)
    {
        //Left
        if(null != Ind.Left)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Ind_LeftTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(Ind.Left);
        }
        //Right
        if(null != Ind.Right)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Ind_RightTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(Ind.Right);
        }
        //FirstLine
        if(null != Ind.FirstLine)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Ind_FirstLineTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(Ind.FirstLine);
        }
    };
    this.WriteSpacing = function(Spacing)
    {
        //Line
        if(null != Spacing.Line)
        {
            var line = Asc.linerule_Auto === Spacing.LineRule ? Math.round(Spacing.Line * 240) : (this.bs.mmToTwips(Spacing.Line));
            this.memory.WriteByte(c_oSerProp_pPrType.Spacing_LineTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(line);
        }
        //LineRule
        if(null != Spacing.LineRule)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Spacing_LineRule);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(Spacing.LineRule);
        }
        //Before
        if(null != Spacing.BeforeAutoSpacing)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Spacing_BeforeAuto);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(Spacing.BeforeAutoSpacing);
        }
        if(null != Spacing.Before)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Spacing_BeforeTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(Spacing.Before);
        }
        //After
        if(null != Spacing.AfterAutoSpacing)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Spacing_AfterAuto);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(Spacing.AfterAutoSpacing);
        }
        if(null != Spacing.After)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.Spacing_AfterTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(Spacing.After);
        }
    };
    this.WriteTabs = function(Tab)
    {
        var oThis = this;
        //Len
        var nLen = Tab.length;
        for(var i = 0; i < nLen; ++i)
        {
            var tab = Tab[i];
            this.memory.WriteByte(c_oSerProp_pPrType.Tab_Item);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteTabItem(tab);});
        }
    };
    this.WriteTabItem = function(TabItem)
    {
        //type
        this.memory.WriteByte(c_oSerProp_pPrType.Tab_Item_Val);
        this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteByte(TabItem.Value);

        //pos
        this.memory.WriteByte(c_oSerProp_pPrType.Tab_Item_PosTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(TabItem.Pos);

		this.memory.WriteByte(c_oSerProp_pPrType.Tab_Item_Leader);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteByte(TabItem.Leader);
    };
    this.WriteNumPr = function(id, lvl)
    {
        //type
        if(null != lvl)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.numPr_lvl);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(lvl);
        }
        //pos
        if(null != id)
        {
            this.memory.WriteByte(c_oSerProp_pPrType.numPr_id);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(id);
        }
    };
	this.WriteFramePr = function(oFramePr)
    {
        if(null != oFramePr.DropCap)
        {
            this.memory.WriteByte(c_oSer_FramePrType.DropCap);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(oFramePr.DropCap);
        }
		if(null != oFramePr.H)
        {
            this.memory.WriteByte(c_oSer_FramePrType.H);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(oFramePr.H);
        }
		if(null != oFramePr.HAnchor)
        {
            this.memory.WriteByte(c_oSer_FramePrType.HAnchor);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(oFramePr.HAnchor);
        }
		if(null != oFramePr.HRule)
        {
            this.memory.WriteByte(c_oSer_FramePrType.HRule);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(oFramePr.HRule);
        }
		if(null != oFramePr.HSpace)
        {
            this.memory.WriteByte(c_oSer_FramePrType.HSpace);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(oFramePr.HSpace);
        }
		if(null != oFramePr.Lines)
        {
            this.memory.WriteByte(c_oSer_FramePrType.Lines);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(oFramePr.Lines);
        }
		if(null != oFramePr.VAnchor)
        {
            this.memory.WriteByte(c_oSer_FramePrType.VAnchor);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(oFramePr.VAnchor);
        }
		if(null != oFramePr.VSpace)
        {
            this.memory.WriteByte(c_oSer_FramePrType.VSpace);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(oFramePr.VSpace);
        }
		if(null != oFramePr.W)
        {
            this.memory.WriteByte(c_oSer_FramePrType.W);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(oFramePr.W);
        }
		if(null != oFramePr.Wrap)
        {
			var nFormatWrap = EWrap.None;
			switch(oFramePr.Wrap){
				case wrap_Around: nFormatWrap = EWrap.wrapAround;break;
				case wrap_Auto: nFormatWrap = EWrap.wrapAuto;break;
				case wrap_None: nFormatWrap = EWrap.wrapNone;break;
				case wrap_NotBeside: nFormatWrap = EWrap.wrapNotBeside;break;
				case wrap_Through: nFormatWrap = EWrap.wrapThrough;break;
				case wrap_Tight: nFormatWrap = EWrap.wrapTight;break;
			}
            this.memory.WriteByte(c_oSer_FramePrType.Wrap);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(nFormatWrap);
        }
		if(null != oFramePr.X)
        {
            this.memory.WriteByte(c_oSer_FramePrType.X);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(oFramePr.X);
        }
		if(null != oFramePr.XAlign)
        {
            this.memory.WriteByte(c_oSer_FramePrType.XAlign);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(oFramePr.XAlign);
        }
		if(null != oFramePr.Y)
        {
            this.memory.WriteByte(c_oSer_FramePrType.Y);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(oFramePr.Y);
        }
		if(null != oFramePr.YAlign)
        {
            this.memory.WriteByte(c_oSer_FramePrType.YAlign);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(oFramePr.YAlign);
        }
    };
	this.WriteSectPr = function(sectPr, oDocument)
    {
        var oThis = this;
        //pgSz
        this.bs.WriteItem(c_oSerProp_secPrType.pgSz, function(){oThis.WritePageSize(sectPr, oDocument);});
        //pgMar
        this.bs.WriteItem(c_oSerProp_secPrType.pgMar, function(){oThis.WritePageMargin(sectPr, oDocument);});
		//setting
        this.bs.WriteItem(c_oSerProp_secPrType.setting, function(){oThis.WritePageSetting(sectPr, oDocument);});
		//header
		if(null != sectPr.HeaderFirst || null != sectPr.HeaderEven || null != sectPr.HeaderDefault)
			this.bs.WriteItem(c_oSerProp_secPrType.headers, function(){oThis.WriteHdr(sectPr);});
		//footer
		if(null != sectPr.FooterFirst || null != sectPr.FooterEven || null != sectPr.FooterDefault)
			this.bs.WriteItem(c_oSerProp_secPrType.footers, function(){oThis.WriteFtr(sectPr);});
		var PageNumType = sectPr.Get_PageNum_Start();
		if(-1 != PageNumType)
			this.bs.WriteItem(c_oSerProp_secPrType.pageNumType, function(){oThis.WritePageNumType(PageNumType);});
		if(null != sectPr.Columns)
			this.bs.WriteItem(c_oSerProp_secPrType.cols, function(){oThis.WriteColumns(sectPr.Columns);});
		if(null != sectPr.Borders && !sectPr.Borders.IsEmptyBorders())
			this.bs.WriteItem(c_oSerProp_secPrType.pgBorders, function(){oThis.WritePgBorders(sectPr.Borders);});
		if(null != sectPr.FootnotePr)
			this.bs.WriteItem(c_oSerProp_secPrType.footnotePr, function(){oThis.WriteFootnotePr(sectPr.FootnotePr);});
		if(sectPr.IsGutterRTL())
			this.bs.WriteItem(c_oSerProp_secPrType.rtlGutter, function(){oThis.memory.WriteBool(true);});
    };
	this.WriteFootnotePr = function(footnotePr)
	{
		var oThis = this;
		if (null != footnotePr.NumRestart) {
			this.bs.WriteItem(c_oSerNotes.PrRestart, function(){oThis.memory.WriteByte(footnotePr.NumRestart);});
		}
		if (null != footnotePr.NumFormat) {
			this.bs.WriteItem(c_oSerNotes.PrFmt, function(){oThis.WriteNumFmt(footnotePr.NumFormat);});
		}
		if (null != footnotePr.NumStart) {
			this.bs.WriteItem(c_oSerNotes.PrStart, function(){oThis.memory.WriteLong(footnotePr.NumStart);});
		}
		if (null != footnotePr.Pos) {
			this.bs.WriteItem(c_oSerNotes.PrFntPos, function(){oThis.memory.WriteByte(footnotePr.Pos);});
		}
	};
	this.WriteNumFmt = function(fmt)
	{
		var oThis = this;
		var val;
		switch (fmt) {
			case Asc.c_oAscNumberingFormat.None: val = 48; break;
			case Asc.c_oAscNumberingFormat.Bullet: val = 5; break;
			case Asc.c_oAscNumberingFormat.Decimal: val = 13; break;
			case Asc.c_oAscNumberingFormat.LowerRoman: val = 47; break;
			case Asc.c_oAscNumberingFormat.UpperRoman: val = 61; break;
			case Asc.c_oAscNumberingFormat.LowerLetter: val = 46; break;
			case Asc.c_oAscNumberingFormat.UpperLetter: val = 60; break;
			case Asc.c_oAscNumberingFormat.DecimalZero: val = 21; break;
			case Asc.c_oAscNumberingFormat.DecimalEnclosedCircle: val = 14; break;

			default: val = 13; break;
		}
		this.bs.WriteItem(c_oSerNumTypes.NumFmtVal, function(){oThis.memory.WriteByte(val);});
	};
    this.WritePageSize = function(sectPr, oDocument)
    {
        var oThis = this;
        //W
        this.memory.WriteByte(c_oSer_pgSzType.WTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(sectPr.GetPageWidth());
        //H
        this.memory.WriteByte(c_oSer_pgSzType.HTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(sectPr.GetPageHeight());
        //Orientation
        this.memory.WriteByte(c_oSer_pgSzType.Orientation);
        this.memory.WriteByte(c_oSerPropLenType.Byte);
        this.memory.WriteByte(sectPr.GetOrientation());
    };
    this.WritePageMargin = function(sectPr, oDocument)
    {
        //Left
        this.memory.WriteByte(c_oSer_pgMarType.LeftTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(sectPr.GetPageMarginLeft());
        //Top
        this.memory.WriteByte(c_oSer_pgMarType.TopTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(sectPr.GetPageMarginTop());
        //Right
        this.memory.WriteByte(c_oSer_pgMarType.RightTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(sectPr.GetPageMarginRight());
        //Bottom
        this.memory.WriteByte(c_oSer_pgMarType.BottomTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(sectPr.GetPageMarginBottom());
        
        //Header
        this.memory.WriteByte(c_oSer_pgMarType.HeaderTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(sectPr.GetPageMarginHeader());
        //Footer
        this.memory.WriteByte(c_oSer_pgMarType.FooterTwips);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.bs.writeMmToTwips(sectPr.GetPageMarginFooter());
		//gutter
		this.memory.WriteByte(c_oSer_pgMarType.GutterTwips);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.bs.writeMmToTwips(sectPr.GetGutter());
    };
	this.WritePageSetting = function(sectPr, oDocument)
    {
		var titlePg = sectPr.Get_TitlePage();
        //titlePg
		if(titlePg)
		{
			this.memory.WriteByte(c_oSerProp_secPrSettingsType.titlePg);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(titlePg);
		}
        //EvenAndOddHeaders
		if(EvenAndOddHeaders)
		{
			this.memory.WriteByte(c_oSerProp_secPrSettingsType.EvenAndOddHeaders);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(EvenAndOddHeaders);
		}
		var nFormatType = null;
		switch(sectPr.Get_Type())
		{
			case c_oAscSectionBreakType.Continuous: nFormatType = ESectionMark.sectionmarkContinuous;break;
			case c_oAscSectionBreakType.EvenPage: nFormatType = ESectionMark.sectionmarkEvenPage;break;
			case c_oAscSectionBreakType.Column: nFormatType = ESectionMark.sectionmarkNextColumn;break;
			case c_oAscSectionBreakType.NextPage: nFormatType = ESectionMark.sectionmarkNextPage;break;
			case c_oAscSectionBreakType.OddPage: nFormatType = ESectionMark.sectionmarkOddPage;break;
		}
		if(null != nFormatType)
		{
			this.memory.WriteByte(c_oSerProp_secPrSettingsType.SectionType);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(nFormatType);
		}
    };
	this.WriteHdr = function(sectPr)
	{
		var oThis = this;
		var nIndex;
		if(null != this.oBinaryHeaderFooterTableWriter){
			if(null != sectPr.HeaderDefault){
				nIndex = this.oBinaryHeaderFooterTableWriter.aHeaders.length;
				this.bs.WriteItem(c_oSerProp_secPrType.hdrftrelem, function(){oThis.memory.WriteLong(nIndex);});
				this.oBinaryHeaderFooterTableWriter.aHeaders.push({type: c_oSerHdrFtrTypes.HdrFtr_Odd, elem: sectPr.HeaderDefault});
			}
			if(null != sectPr.HeaderEven){
				nIndex = this.oBinaryHeaderFooterTableWriter.aHeaders.length;
				this.bs.WriteItem(c_oSerProp_secPrType.hdrftrelem, function(){oThis.memory.WriteLong(nIndex);});
				this.oBinaryHeaderFooterTableWriter.aHeaders.push({type: c_oSerHdrFtrTypes.HdrFtr_Even, elem: sectPr.HeaderEven});
			}
			if(null != sectPr.HeaderFirst){
				nIndex = this.oBinaryHeaderFooterTableWriter.aHeaders.length;
				this.bs.WriteItem(c_oSerProp_secPrType.hdrftrelem, function(){oThis.memory.WriteLong(nIndex);});
				this.oBinaryHeaderFooterTableWriter.aHeaders.push({type: c_oSerHdrFtrTypes.HdrFtr_First, elem: sectPr.HeaderFirst});
			}
		}
	}
	this.WriteFtr = function(sectPr)
	{
		var oThis = this;
		var nIndex;
		if(null != this.oBinaryHeaderFooterTableWriter){
			if(null != sectPr.FooterDefault){
				nIndex = this.oBinaryHeaderFooterTableWriter.aFooters.length;
				this.bs.WriteItem(c_oSerProp_secPrType.hdrftrelem, function(){oThis.memory.WriteLong(nIndex);});
				this.oBinaryHeaderFooterTableWriter.aFooters.push({type: c_oSerHdrFtrTypes.HdrFtr_Odd, elem: sectPr.FooterDefault});
			}
			if(null != sectPr.FooterEven){
				nIndex = this.oBinaryHeaderFooterTableWriter.aFooters.length;
				this.bs.WriteItem(c_oSerProp_secPrType.hdrftrelem, function(){oThis.memory.WriteLong(nIndex);});
				this.oBinaryHeaderFooterTableWriter.aFooters.push({type: c_oSerHdrFtrTypes.HdrFtr_Even, elem: sectPr.FooterEven});
			}
			if(null != sectPr.FooterFirst){
				nIndex = this.oBinaryHeaderFooterTableWriter.aFooters.length;
				this.bs.WriteItem(c_oSerProp_secPrType.hdrftrelem, function(){oThis.memory.WriteLong(nIndex);});
				this.oBinaryHeaderFooterTableWriter.aFooters.push({type: c_oSerHdrFtrTypes.HdrFtr_First, elem: sectPr.FooterFirst});
			}
		}
	}
	this.WritePageNumType = function(PageNumType)
	{
		var oThis = this;
		this.bs.WriteItem(c_oSerProp_secPrPageNumType.start, function(){oThis.memory.WriteLong(PageNumType);});
	}
    this.WriteColumns = function(cols)
    {
        var oThis = this;
        if (null != cols.EqualWidth) {
            this.bs.WriteItem(c_oSerProp_Columns.EqualWidth, function(){oThis.memory.WriteBool(cols.EqualWidth);});
        }
        if (null != cols.Num) {
            this.bs.WriteItem(c_oSerProp_Columns.Num, function(){oThis.memory.WriteLong(cols.Num);});
        }
        if (null != cols.Sep) {
            this.bs.WriteItem(c_oSerProp_Columns.Sep, function(){oThis.memory.WriteBool(cols.Sep);});
        }
        if (null != cols.Space) {
            this.bs.WriteItem(c_oSerProp_Columns.Space, function(){oThis.bs.writeMmToTwips(cols.Space);});
        }
        for (var i = 0; i < cols.Cols.length; ++i) {
            this.bs.WriteItem(c_oSerProp_Columns.Column, function(){oThis.WriteColumn(cols.Cols[i]);});
        }
	}
    this.WriteColumn = function(col)
    {
        var oThis = this;
        if (null != col.Space) {
            this.bs.WriteItem(c_oSerProp_Columns.ColumnSpace, function(){oThis.bs.writeMmToTwips(col.Space);});
        }
        if (null != col.W) {
            this.bs.WriteItem(c_oSerProp_Columns.ColumnW, function(){oThis.bs.writeMmToTwips(col.W);});
        }
    }
	this.WritePgBorders = function(pageBorders)
	{
		var oThis = this;
		if (null != pageBorders.Display) {
			this.bs.WriteItem(c_oSerPageBorders.Display, function(){oThis.memory.WriteByte(pageBorders.Display);});
		}
		if (null != pageBorders.OffsetFrom) {
			this.bs.WriteItem(c_oSerPageBorders.OffsetFrom, function(){oThis.memory.WriteByte(pageBorders.OffsetFrom);});
		}
		if (null != pageBorders.ZOrder) {
			this.bs.WriteItem(c_oSerPageBorders.ZOrder, function(){oThis.memory.WriteByte(pageBorders.ZOrder);});
		}
		if (null != pageBorders.Bottom && !pageBorders.Bottom.IsNone()) {
			this.bs.WriteItem(c_oSerPageBorders.Bottom, function(){oThis.WritePgBorder(pageBorders.Bottom);});
		}
		if (null != pageBorders.Left && !pageBorders.Left.IsNone()) {
			this.bs.WriteItem(c_oSerPageBorders.Left, function(){oThis.WritePgBorder(pageBorders.Left);});
		}
		if (null != pageBorders.Right && !pageBorders.Right.IsNone()) {
			this.bs.WriteItem(c_oSerPageBorders.Right, function(){oThis.WritePgBorder(pageBorders.Right);});
		}
		if (null != pageBorders.Top && !pageBorders.Top.IsNone()) {
			this.bs.WriteItem(c_oSerPageBorders.Top, function(){oThis.WritePgBorder(pageBorders.Top);});
		}
	}
	this.WritePgBorder = function(border)
	{
		var _this = this;
		if(null != border.Value)
		{
			var color = null;
			if (null != border.Color)
				color = border.Color;
			else if (null != border.Unifill && editor && editor.WordControl && editor.WordControl.m_oLogicDocument) {
				var doc = editor.WordControl.m_oLogicDocument;
				border.Unifill.check(doc.Get_Theme(), doc.Get_ColorMap());
				var RGBA = border.Unifill.getRGBAColor();
				color = new AscCommonWord.CDocumentColor(RGBA.R, RGBA.G, RGBA.B);
			}
			if (null != color && !color.Auto)
				this.bs.WriteColor(c_oSerPageBorders.Color, color);
			if (null != border.Space) {
				this.memory.WriteByte(c_oSerPageBorders.Space);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToPt(border.Space);
			}
			if (null != border.Size) {
				this.memory.WriteByte(c_oSerPageBorders.Sz);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToPt(8 * border.Size);
			}
			if (null != border.Unifill || (null != border.Color && border.Color.Auto)) {
				this.memory.WriteByte(c_oSerPageBorders.ColorTheme);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function () { _this.bs.WriteColorTheme(border.Unifill, border.Color); });
			}

			this.memory.WriteByte(c_oSerPageBorders.Val);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			if(border_None == border.Value){
				this.memory.WriteLong(-1);
			} else {
				this.memory.WriteLong(1);
			}
		}
	}
};
function Binary_rPrWriter(memory, saveParams)
{
    this.memory = memory;
    this.saveParams = saveParams;
    this.bs = new BinaryCommonWriter(this.memory);
    this.Write_rPr = function(rPr, rPrReview, EndRun)
    {
		var _this = this;
        //Bold
        if(null != rPr.Bold)
        {
            var bold = rPr.Bold;
            this.memory.WriteByte(c_oSerProp_rPrType.Bold);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(bold);
        }
        //Italic
        if(null != rPr.Italic)
        {
            var italic = rPr.Italic;
            this.memory.WriteByte(c_oSerProp_rPrType.Italic);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(italic);
        }
        //Underline
        if(null != rPr.Underline)
        {
            this.memory.WriteByte(c_oSerProp_rPrType.Underline);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.Underline);
        }
        //Strikeout
        if(null != rPr.Strikeout)
        {
            this.memory.WriteByte(c_oSerProp_rPrType.Strikeout);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.Strikeout);
        }
        //FontFamily
        if(null != rPr.RFonts)
        {
            var font = rPr.RFonts;
			if(null != font.Ascii)
			{
				this.memory.WriteByte(c_oSerProp_rPrType.FontAscii);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.memory.WriteString2(font.Ascii.Name);
			}
            if(null != font.HAnsi)
			{
				this.memory.WriteByte(c_oSerProp_rPrType.FontHAnsi);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.memory.WriteString2(font.HAnsi.Name);
			}
            if(null != font.CS)
			{
				this.memory.WriteByte(c_oSerProp_rPrType.FontCS);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.memory.WriteString2(font.CS.Name);
			}
            if(null != font.EastAsia)
			{
				this.memory.WriteByte(c_oSerProp_rPrType.FontAE);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.memory.WriteString2(font.EastAsia.Name);
			}
			if(null != font.Hint)
			{
				var nHint;
				switch(font.Hint)
				{
					case fonthint_CS:nHint = EHint.hintCs;break;
					case fonthint_EastAsia:nHint = EHint.hintEastAsia;break;
					default :nHint = EHint.hintDefault;break;
				}
				this.memory.WriteByte(c_oSerProp_rPrType.FontHint);
				this.memory.WriteByte(c_oSerPropLenType.Byte);
				this.memory.WriteByte(nHint);
			}
        }
        //FontSize
        if(null != rPr.FontSize)
        {
            this.memory.WriteByte(c_oSerProp_rPrType.FontSize);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(rPr.FontSize * 2);
        }
        //Color
        var color = null;
        if (null != rPr.Color )
            color = rPr.Color;
		else if (null != rPr.Unifill && editor && editor.WordControl && editor.WordControl.m_oLogicDocument) {
            var doc = editor.WordControl.m_oLogicDocument;
            rPr.Unifill.check(doc.Get_Theme(), doc.Get_ColorMap());
            var RGBA = rPr.Unifill.getRGBAColor();
            color = new CDocumentColor(RGBA.R, RGBA.G, RGBA.B);
        }
        if (null != color && !color.Auto)
            this.bs.WriteColor(c_oSerProp_rPrType.Color, color);
        //VertAlign
        if(null != rPr.VertAlign)
        {
            this.memory.WriteByte(c_oSerProp_rPrType.VertAlign);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(rPr.VertAlign);
        }
        //HighLight
        if(null != rPr.HighLight)
        {
            if(highlight_None == rPr.HighLight)
            {
                this.memory.WriteByte(c_oSerProp_rPrType.HighLightTyped);
                this.memory.WriteByte(c_oSerPropLenType.Byte);
                this.memory.WriteByte(AscCommon.c_oSer_ColorType.Auto);
            }
            else
            {
                this.bs.WriteColor(c_oSerProp_rPrType.HighLight, rPr.HighLight);
            }
        }
		//RStyle
        if(null != rPr.RStyle)
        {
		    this.memory.WriteByte(c_oSerProp_rPrType.RStyle);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.memory.WriteString2(rPr.RStyle);
		}
		//Spacing
        if(null != rPr.Spacing)
        {
		    this.memory.WriteByte(c_oSerProp_rPrType.SpacingTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(rPr.Spacing);
		}
		//DStrikeout
        if(null != rPr.DStrikeout)
        {
		    this.memory.WriteByte(c_oSerProp_rPrType.DStrikeout);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.DStrikeout);
		}
		//Caps
        if(null != rPr.Caps)
        {
		    this.memory.WriteByte(c_oSerProp_rPrType.Caps);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.Caps);
		}
		//SmallCaps
        if(null != rPr.SmallCaps)
        {
		    this.memory.WriteByte(c_oSerProp_rPrType.SmallCaps);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.SmallCaps);
		}
		//Position
        if(null != rPr.Position)
        {
		    this.memory.WriteByte(c_oSerProp_rPrType.PositionHps);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToPt(2 * rPr.Position);
		}
		//BoldCs
		if(null != rPr.BoldCS)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.BoldCs);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.BoldCS);
		}
		//ItalicCS
		if(null != rPr.ItalicCS)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.ItalicCs);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.ItalicCS);
		}
		//FontSizeCS
		if(null != rPr.FontSizeCS)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.FontSizeCs);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(rPr.FontSizeCS * 2);
		}
		//CS
		if(null != rPr.CS)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.Cs);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.CS);
		}
		//RTL
		if(null != rPr.RTL)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.Rtl);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.RTL);
		}
		//Lang
		if(null != rPr.Lang)
		{
			if(null != rPr.Lang.Val)
			{
				this.memory.WriteByte(c_oSerProp_rPrType.Lang);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.memory.WriteString2(Asc.g_oLcidIdToNameMap[rPr.Lang.Val]);
			}
			if(null != rPr.Lang.Bidi)
			{
				this.memory.WriteByte(c_oSerProp_rPrType.LangBidi);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.memory.WriteString2(Asc.g_oLcidIdToNameMap[rPr.Lang.Bidi]);
			}
			if(null != rPr.Lang.EastAsia)
			{
				this.memory.WriteByte(c_oSerProp_rPrType.LangEA);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.memory.WriteString2(Asc.g_oLcidIdToNameMap[rPr.Lang.EastAsia]);
			}
		}
		if (null != rPr.Unifill || (null != rPr.Color && rPr.Color.Auto)) {
		    this.memory.WriteByte(c_oSerProp_rPrType.ColorTheme);
		    this.memory.WriteByte(c_oSerPropLenType.Variable);
		    this.bs.WriteItemWithLength(function () { _this.bs.WriteColorTheme(rPr.Unifill, rPr.Color); });
		}
		if(null != rPr.Shd)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.Shd);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function () { _this.bs.WriteShd(rPr.Shd); });
		}
		if(null != rPr.Vanish)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.Vanish);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rPr.Vanish);
		}
		if(null != rPr.TextOutline)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.TextOutline);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function () { pptx_content_writer.WriteSpPr(_this.memory, rPr.TextOutline, 0); });
		}
		if(null != rPr.TextFill)
		{
			this.memory.WriteByte(c_oSerProp_rPrType.TextFill);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            if(null != rPr.TextFill.transparent)
            {
                rPr.TextFill.transparent = 255 - rPr.TextFill.transparent;
            }
			this.bs.WriteItemWithLength(function () { pptx_content_writer.WriteSpPr(_this.memory, rPr.TextFill, 1); });
            if(null != rPr.TextFill.transparent)
            {
                rPr.TextFill.transparent = 255 - rPr.TextFill.transparent;
            }
		}
        if (rPrReview && rPrReview.PrChange && rPrReview.ReviewInfo) {
            var brPrs = new Binary_rPrWriter(this.memory, this.saveParams);
            this.memory.WriteByte(c_oSerProp_rPrType.rPrChange);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){WriteTrackRevision(_this.bs, _this.saveParams.trackRevisionId++, rPrReview.ReviewInfo, {brPrs: brPrs, rPr: rPrReview.PrChange});});
        }
        if (EndRun && EndRun.ReviewInfo) {
			var ReviewType = EndRun.GetReviewType();
			var recordType;
			if (reviewtype_Remove === ReviewType) {
				recordType = EndRun.ReviewInfo.IsMovedFrom() ? c_oSerProp_rPrType.MoveFrom : c_oSerProp_rPrType.Del;
			} else if (reviewtype_Add === ReviewType) {
				recordType = EndRun.ReviewInfo.IsMovedTo() ? c_oSerProp_rPrType.MoveTo : c_oSerProp_rPrType.Ins;
			}
			if (recordType) {
				this.memory.WriteByte(recordType);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function() {WriteTrackRevision(_this.bs, _this.saveParams.trackRevisionId++, EndRun.ReviewInfo);});
			}
        }
    };
};
function Binary_oMathWriter(memory, oMathPara, saveParams)
{
    this.memory = memory;
    this.saveParams = saveParams;
    this.bs = new BinaryCommonWriter(this.memory);
	this.brPrs = new Binary_rPrWriter(this.memory, saveParams);
	
	this.WriteMathElem = function(item, isSingle)
	{
		var oThis = this;
		switch ( item.Type )
		{
			case para_Math_Composition:
				{
					switch (item.kind)
					{
						case MATH_ACCENT			: this.bs.WriteItem(c_oSer_OMathContentType.Acc, function(){oThis.WriteAcc(item);});			break;
						case MATH_BAR				: this.bs.WriteItem(c_oSer_OMathContentType.Bar, function(){oThis.WriteBar(item);});			break;
						case MATH_BORDER_BOX		: this.bs.WriteItem(c_oSer_OMathContentType.BorderBox, function(){oThis.WriteBorderBox(item);});break;
						case MATH_BOX				: this.bs.WriteItem(c_oSer_OMathContentType.Box, function(){oThis.WriteBox(item);});			break;
						case "CCtrlPr"				: this.bs.WriteItem(c_oSer_OMathContentType.CtrlPr, function(){oThis.WriteCtrlPr(item);});		break;
						case MATH_DELIMITER			: this.bs.WriteItem(c_oSer_OMathContentType.Delimiter, function(){oThis.WriteDelimiter(item);});break;
						case MATH_EQ_ARRAY			: this.bs.WriteItem(c_oSer_OMathContentType.EqArr, function(){oThis.WriteEqArr(item);});		break;
						case MATH_FRACTION			: this.bs.WriteItem(c_oSer_OMathContentType.Fraction, function(){oThis.WriteFraction(item);});	break;
						case MATH_FUNCTION			: this.bs.WriteItem(c_oSer_OMathContentType.Func, function(){oThis.WriteFunc(item);});			break;
						case MATH_GROUP_CHARACTER	: this.bs.WriteItem(c_oSer_OMathContentType.GroupChr, function(){oThis.WriteGroupChr(item);});	break;
						case MATH_LIMIT				: 
							if (LIMIT_LOW  == item.Pr.type)
								this.bs.WriteItem(c_oSer_OMathContentType.LimLow, function(){oThis.WriteLimLow(item);});
							else if (LIMIT_UP == item.Pr.type)
								this.bs.WriteItem(c_oSer_OMathContentType.LimUpp, function(){oThis.WriteLimUpp(item);});
							break;
						case MATH_MATRIX			: this.bs.WriteItem(c_oSer_OMathContentType.Matrix, function(){oThis.WriteMatrix(item);});		break;
						case MATH_NARY			: this.bs.WriteItem(c_oSer_OMathContentType.Nary, function(){oThis.WriteNary(item);});			break;
						case "OMath"			: this.bs.WriteItem(c_oSer_OMathContentType.OMath, function(){oThis.WriteArgNodes(item);});			break;
						case "OMathPara"		: this.bs.WriteItem(c_oSer_OMathContentType.OMathPara, function(){oThis.WriteOMathPara(item);});break;
						case MATH_PHANTOM		: this.bs.WriteItem(c_oSer_OMathContentType.Phant, function(){oThis.WritePhant(item);});		break;
						case MATH_RUN			: this.WriteMRunWrap(item, isSingle);break;
						case MATH_RADICAL		: this.bs.WriteItem(c_oSer_OMathContentType.Rad, function(){oThis.WriteRad(item);});			break;
						case MATH_DEGREESubSup	: 
							if (DEGREE_PreSubSup == item.Pr.type)
								this.bs.WriteItem(c_oSer_OMathContentType.SPre, function(){oThis.WriteSPre(item);});	
							else if (DEGREE_SubSup == item.Pr.type)
								this.bs.WriteItem(c_oSer_OMathContentType.SSubSup, function(){oThis.WriteSSubSup(item);});
							break;
						case MATH_DEGREE		: 
							if (DEGREE_SUBSCRIPT == item.Pr.type)
								this.bs.WriteItem(c_oSer_OMathContentType.SSub, function(){oThis.WriteSSub(item);});
							else if (DEGREE_SUPERSCRIPT == item.Pr.type)
								this.bs.WriteItem(c_oSer_OMathContentType.SSup, function(){oThis.WriteSSup(item);});
							break;
					}
					break;
				}		
			case para_Math_Text:
			case para_Math_BreakOperator:
				this.bs.WriteItem(c_oSer_OMathContentType.MText, function(){ oThis.memory.WriteString2(AscCommon.convertUnicodeToUTF16([item.value]));}); //m:t
				break;
			case para_Math_Run:
				this.WriteMRunWrap(item, isSingle);
				break;
			default:		
				break;
		}
	},
    this.WriteArgNodes = function(oElem)
	{
		if (oElem)
		{			
			var oThis = this;
			var nStart = 0;
			var nEnd   = oElem.Content.length;
			
			var argSz = oElem.GetArgSize();
			if (argSz)
				this.bs.WriteItem(c_oSer_OMathContentType.ArgPr, function(){oThis.WriteArgPr(argSz);});
			
			var isSingle = (nStart === nEnd - 1);
			for(var i = nStart; i <= nEnd - 1; i++)
			{
				var item = oElem.Content[i];
				this.WriteMathElem(item, isSingle);
			}
		}
		
	}
	this.WriteMRunWrap = function(oMRun, isSingle)
	{
		var oThis = this;
		if (!isSingle && oMRun.Is_Empty()) {
			//don't write empty run(in Excel empty run is editable and has size).Write only if it is single single in Content
			return;
		}
		this.bs.WriteItem(c_oSer_OMathContentType.MRun, function(){oThis.WriteMRun(oMRun);});
	}
	this.WriteMRun = function(oMRun)
	{
		var oThis = this;
		var reviewType = oMRun.GetReviewType();
		if (reviewtype_Common !== reviewType) {
			writeNestedReviewType(reviewType, oMRun.GetReviewInfo(), function(reviewType, reviewInfo, delText, fCallback){
				var recordType = reviewtype_Remove === reviewType ? c_oSer_OMathContentType.Del : c_oSer_OMathContentType.Ins;
				oThis.bs.WriteItem(recordType, function () {WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, reviewInfo, {runContent: function(){fCallback();}});});
			}, function() {
				oThis.WriteMRunContent(oMRun)
			});
		} else {
			this.WriteMRunContent(oMRun)
		}
    }
    this.WriteMRunContent = function(oMRun)
    {
        var oThis = this;
		var props = oMRun.getPropsForWrite();
		var oText = "";
		var ContentLen = oMRun.Content.length;
        for ( var CurPos = 0; CurPos < ContentLen; CurPos++ )
		{
			var Item = oMRun.Content[CurPos];
			switch ( Item.Type )
            {	
				case para_Math_Ampersand :		oText += "&"; break;
				case para_Math_BreakOperator:
				case para_Math_Text :			oText += AscCommon.convertUnicodeToUTF16([Item.value]); break;
            	case para_Space:
            	case para_Tab : 				oText += " "; break;
            }
		}

		if(null != props.wRPrp){
            this.bs.WriteItem(c_oSer_OMathContentType.RPr,	function(){oThis.brPrs.Write_rPr(props.wRPrp, null, null);}); // w:rPr
        }
		this.bs.WriteItem(c_oSer_OMathContentType.MRPr,	function(){oThis.WriteMRPr(props.mathRPrp);}); // m:rPr
        if(null != props.prRPrp){
            this.bs.WriteItem(c_oSer_OMathContentType.ARPr,	function(){
                pptx_content_writer.WriteRunProperties(oThis.memory, props.prRPrp);
            });
        }
		this.bs.WriteItem(c_oSer_OMathContentType.MText,function(){oThis.WriteMText(oText.toString());}); // m:t
	}
	this.WriteMText = function(sText)
	{
		if ("" != sText)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.memory.WriteString2(sText);
		}
	}
	this.WriteAcc = function(oAcc)
	{
		var oThis = this;
		var oElem = oAcc.getBase();
		var props = oAcc.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.AccPr, function(){oThis.WriteAccPr(props, oAcc);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
	}
	this.WriteAccPr = function(props,oAcc)
	{
		var oThis = this;
		if (null != props.chr)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Chr, function(){oThis.WriteChr(props.chr);});
		if (null != oAcc.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oAcc);});
	}
	this.WriteAln = function(Aln)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(Aln);
	}	
	this.WriteAlnScr = function(AlnScr)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(AlnScr);
	}
	this.WriteArgPr = function(nArgSz)
	{
		var oThis = this;
		this.bs.WriteItem(c_oSer_OMathBottomNodesType.ArgSz, function(){oThis.WriteArgSz(nArgSz);});
	}
	this.WriteArgSz = function(ArgSz)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.memory.WriteLong(ArgSz);
	}
	this.WriteBar = function(oBar)
	{
		var oThis = this;
		var oElem = oBar.getBase();
		var props = oBar.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.BarPr, function(){oThis.WriteBarPr(props, oBar);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
	}
	this.WriteBarPr = function(props,oBar)
	{
		var oThis = this;
		if (null != props.pos)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Pos, function(){oThis.WritePos(props.pos);});
		if (null != oBar.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oBar);});
	}
	this.WriteBaseJc = function(BaseJc)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);		
		var val = c_oAscYAlign.Center;
		switch (BaseJc)
		{
			case BASEJC_BOTTOM: val = c_oAscYAlign.Bottom; break;
			case BASEJC_CENTER: val = c_oAscYAlign.Center; break;
			case BASEJC_TOP:	val = c_oAscYAlign.Top;
		}
		this.memory.WriteByte(val);
	}
	this.WriteBorderBox = function(oBorderBox)
	{
		var oThis = this;
		var oElem = oBorderBox.getBase();
		var props = oBorderBox.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.BorderBoxPr, function(){oThis.WriteBorderBoxPr(props, oBorderBox);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
	}
	this.WriteBorderBoxPr = function(props,oBorderBox)
	{		
		var oThis = this;
		if (null != props.hideBot)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.HideBot, function(){oThis.WriteHideBot(props.hideBot);});
		if (null != props.hideLeft)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.HideLeft, function(){oThis.WriteHideLeft(props.hideLeft);});
		if (null != props.hideRight)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.HideRight, function(){oThis.WriteHideRight(props.hideRight);});
		if (null != props.hideTop)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.HideTop, function(){oThis.WriteHideTop(props.hideTop);});
		if (null != props.strikeBLTR)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.StrikeBLTR, function(){oThis.WriteStrikeBLTR(props.strikeBLTR);});
		if (null != props.strikeH)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.StrikeH, function(){oThis.WriteStrikeH(props.strikeH);});
		if (null != props.strikeTLBR)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.StrikeTLBR, function(){oThis.WriteStrikeTLBR(props.strikeTLBR);});
		if (null != props.strikeV)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.StrikeV, function(){oThis.WriteStrikeV(props.strikeV);});
		if (null != oBorderBox.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oBorderBox);});
	}
	this.WriteBox = function(oBox)
	{
		var oThis = this;
		var oElem = oBox.getBase();
		var props = oBox.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.BoxPr, function(){oThis.WriteBoxPr(props, oBox);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
	}
	this.WriteBoxPr = function(props,oBox)
	{
		var oThis = this;
		if (null != props.aln)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Aln, function(){oThis.WriteAln(props.aln);});
		if (null != props.brk)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Brk, function(){oThis.WriteBrk(props.brk);});
		if (null != props.diff)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Diff, function(){oThis.WriteDiff(props.diff);});
		if (null != props.noBreak)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.NoBreak, function(){oThis.WriteNoBreak(props.noBreak);});
		if (null != props.opEmu)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.OpEmu, function(){oThis.WriteOpEmu(props.opEmu);});
		if (null != oBox.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oBox);});
	}	
	this.WriteBrk = function(Brk)
	{
		if (Brk.alnAt)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.AlnAt);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.memory.WriteLong(Brk.alnAt);
		}
		else
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(false);
		}
	}
	this.WriteCGp = function(CGp)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.memory.WriteLong(CGp);
	}
	this.WriteCGpRule = function(CGpRule)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.memory.WriteLong(CGpRule);
	}
	this.WriteChr = function(Chr)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Variable);

        if (OPERATOR_EMPTY === Chr)
            this.memory.WriteString2("");
        else
		    this.memory.WriteString2(AscCommon.convertUnicodeToUTF16([Chr]));
	}
	this.WriteCount = function(Count)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.memory.WriteLong(Count);
	}
	this.WriteCSp = function(CSp)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.memory.WriteLong(CSp);
	}
	this.WriteCtrlPr = function(oElem)
	{
		var oThis = this;
        var ReviewType = reviewtype_Common;
        if (oElem.GetReviewType) {
            ReviewType = oElem.GetReviewType();
        }
		if (oElem.Is_FromDocument()) {
			if (reviewtype_Remove == ReviewType || reviewtype_Add == ReviewType && oElem.ReviewInfo) {
				var brPrs = new Binary_rPrWriter(this.memory, this.saveParams);
				var recordType = reviewtype_Remove == ReviewType ? c_oSerRunType.del : c_oSerRunType.ins;
				this.bs.WriteItem(recordType, function(){WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, oElem.ReviewInfo, {brPrs: brPrs, rPr: oElem.CtrPrp});});
			} else {
				this.bs.WriteItem(c_oSerRunType.rPr, function(){oThis.brPrs.Write_rPr(oElem.CtrPrp, null, null);});
			}
		} else {
			this.bs.WriteItem(c_oSerRunType.arPr, function() {
				pptx_content_writer.WriteRunProperties(oThis.memory, oElem.CtrPrp);
			});
		}
	}
	this.WriteDegHide = function(DegHide)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(DegHide);
	}
	this.WriteDiff = function(Diff)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(Diff);
	}
	this.WriteDelimiter = function(oDelimiter)
	{
		var oThis = this;
		var nStart = 0;
        var nEnd   = oDelimiter.nCol;
		var props = oDelimiter.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.DelimiterPr, function(){oThis.WriteDelimiterPr(props, oDelimiter);});
		
		for(var i = nStart; i < nEnd; i++)	
		{
			var oElem = oDelimiter.getBase(i);
			this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
		}
	}
	this.WriteDelimiterPr = function(props,oDelimiter)
	{
		var oThis = this;
		if (null != props.column)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Column, function(){oThis.WriteCount(props.column);});
		if (null != props.begChr)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.BegChr, function(){oThis.WriteChr(props.begChr);});
		if (null != props.endChr)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.EndChr, function(){oThis.WriteChr(props.endChr);});
		if (null != props.grow)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Grow, function(){oThis.WriteGrow(props.grow);});
		if (null != props.sepChr)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.SepChr, function(){oThis.WriteChr(props.sepChr);});
		if (null != props.shp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Shp, function(){oThis.WriteShp(props.shp);});
		if (null != oDelimiter.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oDelimiter);});
	}
	this.WriteEqArr = function(oEqArr)
	{
		var oThis = this;
		var nStart = 0;
        var nEnd   = oEqArr.elements.length;
		var props = oEqArr.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.EqArrPr, function(){oThis.WriteEqArrPr(props, oEqArr);});
		
		for(var i = nStart; i < nEnd; i++)	
		{
			var oElem = oEqArr.getElement(i);
			this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
		}
	}
	this.WriteEqArrPr = function(props,oEqArr)
	{
		var oThis = this;
		if (null != props.row)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Row, function(){oThis.WriteCount(props.row);});
		if (null != props.baseJc)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.BaseJc, function(){oThis.WriteBaseJc(props.baseJc);});
		if (null != props.maxDist)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.MaxDist, function(){oThis.WriteMaxDist(props.maxDist);});
		if (null != props.objDist)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.ObjDist, function(){oThis.WriteObjDist(props.objDist);});
		if (null != props.rSp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.RSp, function(){oThis.WriteRSp(props.rSp);});
		if (null != props.rSpRule)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.RSpRule, function(){oThis.WriteRSpRule(props.rSpRule);});
		if (null != oEqArr.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oEqArr);});
	}	
	this.WriteFraction = function(oFraction)
	{
		var oThis = this;
		var oDen = oFraction.getDenominator();
		var oNum = oFraction.getNumerator();	
		var props = oFraction.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.FPr, function(){oThis.WriteFPr(props, oFraction);});
        this.bs.WriteItem(c_oSer_OMathContentType.Num, function(){oThis.WriteArgNodes(oNum);});
		this.bs.WriteItem(c_oSer_OMathContentType.Den, function(){oThis.WriteArgNodes(oDen);});
	}
	this.WriteFPr = function(props,oFraction)
	{
		var oThis = this;
		if (null != props.type)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Type, function(){oThis.WriteType(props.type);});
		if (null != oFraction.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oFraction);});
	}
	this.WriteFunc = function(oFunc)
	{
		var oThis = this;
		var oFName = oFunc.getFName();
		var oElem = oFunc.getArgument();	
		
		this.bs.WriteItem(c_oSer_OMathContentType.FuncPr, function(){oThis.WriteFuncPr(oFunc);});		
		this.bs.WriteItem(c_oSer_OMathContentType.FName, function(){oThis.WriteArgNodes(oFName);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
	}
	this.WriteFuncPr = function(oFunc)
	{
		var oThis = this;
		if (null != oFunc.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oFunc);});
	}
	this.WriteGroupChr = function(oGroupChr)
	{
		var oThis = this;		
		var oElem = oGroupChr.getBase();
		var props = oGroupChr.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.GroupChrPr, function(){oThis.WriteGroupChrPr(props, oGroupChr);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
	}
	this.WriteGroupChrPr = function(props,oGroupChr)
	{
		var oThis = this;
		if (null != props.chr)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Chr, function(){oThis.WriteChr(props.chr);});
		if (null != props.pos)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Pos, function(){oThis.WritePos(props.pos);});
		if (null != props.vertJc)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.VertJc, function(){oThis.WriteVertJc(props.vertJc);});
		if (null != oGroupChr.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oGroupChr);});
	}
	this.WriteGrow = function(Grow)
	{
		if (!Grow)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(Grow);
		}
	}
	this.WriteHideBot = function(HideBot)
	{
		if (HideBot)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(HideBot);
		}
	}
	this.WriteHideLeft = function(HideLeft)
	{
		if (HideLeft)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(HideLeft);
		}
	}
	this.WriteHideRight = function(HideRight)
	{
		if (HideRight)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(HideRight);
		}
	}
	this.WriteHideTop = function(HideTop)
	{
		if (HideTop)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(HideTop);
		}
	}
	this.WriteLimLoc = function(LimLoc)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscLimLoc.SubSup;
		switch (LimLoc)
		{
			case NARY_SubSup: val = c_oAscLimLoc.SubSup; break;
			case NARY_UndOvr: val = c_oAscLimLoc.UndOvr;
		}
		this.memory.WriteByte(val);		
	}
	this.WriteLimLow = function(oLimLow)
	{
		var oThis = this;		
		var oElem = oLimLow.getFName();
		var oLim  = oLimLow.getIterator();
		
		this.bs.WriteItem(c_oSer_OMathContentType.LimLowPr, function(){oThis.WriteLimLowPr(oLimLow);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
		this.bs.WriteItem(c_oSer_OMathContentType.Lim, function(){oThis.WriteArgNodes(oLim);});
	}
	this.WriteLimLowPr = function(oLimLow)
	{
		var oThis = this;
		if (null != oLimLow.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oLimLow);});
	}
	this.WriteLimUpp = function(oLimUpp)
	{
		var oThis = this;		
		var oElem = oLimUpp.getFName();
		var oLim  = oLimUpp.getIterator();
		
		this.bs.WriteItem(c_oSer_OMathContentType.LimUppPr, function(){oThis.WriteLimUppPr(oLimUpp);});
		this.bs.WriteItem(c_oSer_OMathContentType.Lim, function(){oThis.WriteArgNodes(oLim);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});		
	}
	this.WriteLimUppPr = function(oLimUpp)
	{
		var oThis = this;
		if (null != oLimUpp.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oLimUpp);});
	}
	this.WriteLit = function(Lit)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(Lit);
	}
	this.WriteMaxDist = function(MaxDist)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(MaxDist);
	}
	this.WriteMatrix = function(oMatrix)
	{
		var oThis 	= this;		
		var nStart = 0;
        var nEnd   = oMatrix.nRow;
		var props = oMatrix.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.MPr, function(){oThis.WriteMPr(props, oMatrix);});
		
		for(var i = nStart; i < nEnd; i++)	
		{	
			this.bs.WriteItem(c_oSer_OMathContentType.Mr, function(){oThis.WriteMr(oMatrix,i);});
		}
	}
	this.WriteMc = function(props)
	{
		var oThis = this;
		this.bs.WriteItem(c_oSer_OMathContentType.McPr, function(){oThis.WriteMcPr(props);});
	}
	this.WriteMJc = function(MJc)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscXAlign.Left;
		switch (MJc)
		{
			case align_Center: 	val = c_oAscMathJc.Center; break;
			case align_Justify: val = c_oAscMathJc.CenterGroup; break;
			case align_Left: 	val = c_oAscMathJc.Left; break;
			case align_Right: 	val = c_oAscMathJc.Right;
		}
		this.memory.WriteByte(val);
	}
	this.WriteMcPr = function(props)
	{
		var oThis = this;
		if (null != props.mcJc)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.McJc, function(){oThis.WriteMcJc(props.mcJc);});
		if (null != props.count)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Count, function(){oThis.WriteCount(props.count);});
	}
    this.WriteMcJc = function(MJc)
    {
        this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
        this.memory.WriteByte(c_oSerPropLenType.Byte);
		
		var val = c_oAscXAlign.Center;
		switch (MJc)
		{
			case MCJC_CENTER: 	val = c_oAscXAlign.Center; 	break;
			case MCJC_INSIDE: 	val = c_oAscXAlign.Inside; 	break;
			case MCJC_LEFT: 	val = c_oAscXAlign.Left; 	break;
			case MCJC_OUTSIDE: 	val = c_oAscXAlign.Outside; break;
			case MCJC_RIGHT: 	val = c_oAscXAlign.Right; 	break;
		}
		this.memory.WriteByte(val);
		
    }
	this.WriteMcs = function(props)
	{
		var oThis = this;
		for(var Index = 0, Count = props.mcs.length; Index < Count; Index++)
			this.bs.WriteItem(c_oSer_OMathContentType.Mc, function(){oThis.WriteMc(props.mcs[Index]);});
	}
	this.WriteMPr = function(props,oMatrix)
	{
		var oThis = this;

		if (null != props.row)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Row, function(){oThis.WriteCount(props.row);});
		if (null != props.baseJc)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.BaseJc, function(){oThis.WriteBaseJc(props.baseJc);});
		if (null != props.cGp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CGp, function(){oThis.WriteCGp(props.cGp);});
		if (null != props.cGpRule)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CGpRule, function(){oThis.WriteCGpRule(props.cGpRule);});
		if (null != props.cSp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CSp, function(){oThis.WriteCSp(props.cSp);});
		if (null != props.mcs)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Mcs, function(){oThis.WriteMcs(props);});
		if (null != props.plcHide)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.PlcHide, function(){oThis.WritePlcHide(props.plcHide);});
		if (null != props.rSp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.RSp, function(){oThis.WriteRSp(props.rSp);});
		if (null != props.rSpRule)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.RSpRule, function(){oThis.WriteRSpRule(props.rSpRule);});
		if (null != oMatrix.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oMatrix);});
	}
	this.WriteMr = function(oMatrix, nRow)
	{
		var oThis 	= this;		
		var nStart = 0;
        var nEnd   = oMatrix.nCol;

		for(var i = nStart; i < nEnd; i++)	
		{	
			var oElem = oMatrix.getElement(nRow,i);
			this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
		}
	}
	this.WriteNary = function(oNary)
	{
		var oThis = this;
		var oElem = oNary.getBase();
		var oSub = oNary.getLowerIterator();
		var oSup = oNary.getUpperIterator();
		var props = oNary.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.NaryPr, function(){oThis.WriteNaryPr(props, oNary);});
		this.bs.WriteItem(c_oSer_OMathContentType.Sub, function(){oThis.WriteArgNodes(oSub);});
		this.bs.WriteItem(c_oSer_OMathContentType.Sup, function(){oThis.WriteArgNodes(oSup);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});		
	}
	this.WriteNaryPr = function(props,oNary)
	{
		var oThis = this;
		if (null != props.chr)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Chr, function(){oThis.WriteChr(props.chr);});
		if (null != props.grow)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Grow, function(){oThis.WriteGrow(props.grow);});
		if (null != props.limLoc)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.LimLoc, function(){oThis.WriteLimLoc(props.limLoc);});
		if (null != props.subHide)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.SubHide, function(){oThis.WriteSubHide(props.subHide);});
		if (null != props.supHide)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.SupHide, function(){oThis.WriteSupHide(props.supHide);});
		if (null != oNary.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oNary);});
	}	
	this.WriteNoBreak = function(NoBreak)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(NoBreak);
	}
	this.WriteNor = function(Nor)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(Nor);
	}
	this.WriteObjDist = function(ObjDist)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(ObjDist);
	}	
	this.WriteOMathPara = function(oOMathPara)
	{
		var oThis = this;
		var props = oOMathPara.getPropsForWrite();
		
		oThis.bs.WriteItem(c_oSer_OMathContentType.OMathParaPr, function(){oThis.WriteOMathParaPr(props);});	
		oThis.bs.WriteItem(c_oSer_OMathContentType.OMath, function(){oThis.WriteArgNodes(oOMathPara.Root);});
		//oThis.bs.WriteRun(item, bUseSelection);
	};
	this.WriteOMathParaPr = function(props)
	{
		var oThis = this;
		if (null != props.Jc)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.MJc, function(){oThis.WriteMJc(props.Jc);});
	}
	this.WriteOpEmu = function(OpEmu)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(OpEmu);
	}
	this.WritePhant = function(oPhant)
	{
		var oThis = this;
		var oElem = oPhant.getBase();
		var props = oPhant.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.PhantPr, function(){oThis.WritePhantPr(props, oPhant);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
	}
	this.WritePhantPr = function(props,oPhant)
	{
		var oThis = this;
		if (null != props.show)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Show, function(){oThis.WriteShow(props.show);});
		if (null != props.transp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Transp, function(){oThis.WriteTransp(props.transp);});
		if (null != props.zeroAsc)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.ZeroAsc, function(){oThis.WriteZeroAsc(props.zeroAsc);});
		if (null != props.zeroDesc)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.ZeroDesc, function(){oThis.WriteZeroDesc(props.zeroDesc);});
		if (null != props.zeroWid)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.ZeroWid, function(){oThis.WriteZeroWid(props.zeroWid);});
		if (null != oPhant.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oPhant);});
	}
	this.WritePlcHide = function(PlcHide)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(PlcHide);
	}
	this.WritePos = function(Pos)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscTopBot.Bot;
		switch (Pos)
		{
			case LOCATION_BOT: 	val = c_oAscTopBot.Bot; break;
			case LOCATION_TOP: 	val = c_oAscTopBot.Top;
		}
		this.memory.WriteByte(val);
	}
	this.WriteMRPr = function(props)
	{
		var oThis = this;
		if (null != props.aln)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Aln, function(){oThis.WriteAln(props.aln);});
		if (null != props.brk)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Brk, function(){oThis.WriteBrk(props.brk);});
		if (null != props.lit)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Lit, function(){oThis.WriteLit(props.lit);});
		if (null != props.nor)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Nor, function(){oThis.WriteNor(props.nor);});
		if (null != props.scr)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Scr, function(){oThis.WriteScr(props.scr);});
		if (null != props.sty)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.Sty, function(){oThis.WriteSty(props.sty);});
	}
	this.WriteRad = function(oRad)
	{
		var oThis = this;
		var oElem = oRad.getBase();
		var oDeg  = oRad.getDegree();
		var props = oRad.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.RadPr, function(){oThis.WriteRadPr(props, oRad);});
		this.bs.WriteItem(c_oSer_OMathContentType.Deg, function(){oThis.WriteArgNodes(oDeg);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
	}
	this.WriteRadPr = function(props,oRad)
	{
		var oThis = this;
		if (null != props.degHide)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.DegHide, function(){oThis.WriteDegHide(props.degHide);});
		if (null != oRad.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oRad);});
	}	
	this.WriteRSp = function(RSp)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.memory.WriteLong(RSp);
	}
	this.WriteRSpRule = function(RSpRule)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.memory.WriteLong(RSpRule);
	}
	this.WriteScr = function(Scr)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscScript.Roman;
		switch (Scr)
		{
			case TXT_DOUBLE_STRUCK: val = c_oAscScript.DoubleStruck; break;
			case TXT_FRAKTUR: 		val = c_oAscScript.Fraktur; break;
			case TXT_MONOSPACE: 	val = c_oAscScript.Monospace; break;
			case TXT_ROMAN: 		val = c_oAscScript.Roman; break;
			case TXT_SANS_SERIF: 	val = c_oAscScript.SansSerif; break;
			case TXT_SCRIPT: 		val = c_oAscScript.Script; break;
		}
		this.memory.WriteByte(val);
	}
	this.WriteShow = function(Show)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(Show);
	}
	this.WriteShp = function(Shp)
	{
		if (Shp != 1)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			var val = c_oAscShp.Centered;
			switch (Shp)
			{
				case DELIMITER_SHAPE_CENTERED: 	val = c_oAscShp.Centered; break;
				case DELIMITER_SHAPE_MATCH: 	val = c_oAscShp.Match;
			}
			this.memory.WriteByte(val);
		}
	}
	this.WriteSPre = function(oSPre)
	{
		var oThis = this;
		var oSub  = oSPre.getLowerIterator();
		var oSup  = oSPre.getUpperIterator();
		var oElem = oSPre.getBase();	
		
		this.bs.WriteItem(c_oSer_OMathContentType.SPrePr, function(){oThis.WriteSPrePr(oSPre);});		
		this.bs.WriteItem(c_oSer_OMathContentType.Sub, function(){oThis.WriteArgNodes(oSub);});
		this.bs.WriteItem(c_oSer_OMathContentType.Sup, function(){oThis.WriteArgNodes(oSup);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});		
	}
	this.WriteSPrePr = function(oSPre)
	{
		var oThis = this;
		if (null != oSPre.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oSPre);});
	}
	this.WriteSSub = function(oSSub)
	{
		var oThis = this;
		var oSub  = oSSub.getLowerIterator();
		var oElem = oSSub.getBase();
		
		this.bs.WriteItem(c_oSer_OMathContentType.SSubPr, function(){oThis.WriteSSubPr(oSSub);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
		this.bs.WriteItem(c_oSer_OMathContentType.Sub, function(){oThis.WriteArgNodes(oSub);});		
	}
	this.WriteSSubPr = function(oSSub)
	{
		var oThis = this;
		if (null != oSSub.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oSSub);});
	}
	this.WriteSSubSup = function(oSSubSup)
	{
		var oThis = this;
		var oSub  = oSSubSup.getLowerIterator();
		var oSup  = oSSubSup.getUpperIterator();
		var oElem = oSSubSup.getBase();
		var props = oSSubSup.getPropsForWrite();
		
		this.bs.WriteItem(c_oSer_OMathContentType.SSubSupPr, function(){oThis.WriteSSubSupPr(props, oSSubSup);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
		this.bs.WriteItem(c_oSer_OMathContentType.Sub, function(){oThis.WriteArgNodes(oSub);});
		this.bs.WriteItem(c_oSer_OMathContentType.Sup, function(){oThis.WriteArgNodes(oSup);});		
	}
	this.WriteSSubSupPr = function(props, oSSubSup)
	{
		var oThis = this;
		if (null != props.alnScr)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.AlnScr, function(){oThis.WriteAlnScr(props.alnScr);});
		if (null != oSSubSup.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oSSubSup);});
	}
	this.WriteSSup = function(oSSup)
	{
		var oThis = this;
		var oSup  = oSSup.getUpperIterator();
		var oElem = oSSup.getBase();
		
		this.bs.WriteItem(c_oSer_OMathContentType.SSupPr, function(){oThis.WriteSSupPr(oSSup);});
		this.bs.WriteItem(c_oSer_OMathContentType.Element, function(){oThis.WriteArgNodes(oElem);});
		this.bs.WriteItem(c_oSer_OMathContentType.Sup, function(){oThis.WriteArgNodes(oSup);});		
	}
	this.WriteSSupPr = function(oSSup)
	{
		var oThis = this;
		if (null != oSSup.CtrPrp)
			this.bs.WriteItem(c_oSer_OMathBottomNodesType.CtrlPr, function(){oThis.WriteCtrlPr(oSSup);});
	}
	this.WriteStrikeBLTR = function(StrikeBLTR)
	{
		if (StrikeBLTR)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(StrikeBLTR);
		}
	}
	this.WriteStrikeH = function(StrikeH)
	{
		if (StrikeH)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(StrikeH);
		}
	}
	this.WriteStrikeTLBR = function(StrikeTLBR)
	{
		if (StrikeTLBR)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(StrikeTLBR);
		}
	}
	this.WriteStrikeV = function(StrikeV)
	{
		if (StrikeV)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(StrikeV);
		}
	}
	this.WriteSty = function(Sty)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscSty.BoldItalic;
		switch (Sty)
		{
			case STY_BOLD: 		val = c_oAscSty.Bold; break;
			case STY_BI: 		val = c_oAscSty.BoldItalic; break;
			case STY_ITALIC: 	val = c_oAscSty.Italic; break;
			case STY_PLAIN: 	val = c_oAscSty.Plain;
		}
		this.memory.WriteByte(val);
	}
	this.WriteSubHide = function(SubHide)
	{
		if (SubHide)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(SubHide);
		}
	}
	this.WriteSupHide = function(SupHide)
	{
		if (SupHide)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(SupHide);
		}
	}
	this.WriteTransp = function(Transp)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(Transp);
	}
	this.WriteType = function(Type)
	{
		if ( Type != 0)
		{
			this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			var val = c_oAscFType.Bar;
			switch (Type)
			{
				case BAR_FRACTION: 		val = c_oAscFType.Bar; break;
				case LINEAR_FRACTION: 	val = c_oAscFType.Lin; break;
				case NO_BAR_FRACTION: 	val = c_oAscFType.NoBar; break;
				case SKEWED_FRACTION: 	val = c_oAscFType.Skw;
			}
			this.memory.WriteByte(val);
		}
	}	
	this.WriteVertJc = function(VertJc)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscTopBot.Bot;
		switch (VertJc)
		{
			case VJUST_BOT: 	val = c_oAscTopBot.Bot; break;
			case VJUST_TOP: 	val = c_oAscTopBot.Top;
		}
		this.memory.WriteByte(val);
	}
	this.WriteZeroAsc = function(ZeroAsc)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(ZeroAsc);
	}
	this.WriteZeroDesc = function(ZeroDesc)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(ZeroDesc);
	}
	this.WriteZeroWid = function(ZeroWid)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(ZeroWid);
	}
};
function Binary_tblPrWriter(memory, oNumIdMap, saveParams)
{
    this.memory = memory;
	this.saveParams = saveParams;
    this.bs = new BinaryCommonWriter(this.memory);
    this.bpPrs = new Binary_pPrWriter(this.memory, oNumIdMap, null, saveParams);
}
Binary_tblPrWriter.prototype = 
{
	WriteTbl: function(table)
    {
		var oThis = this;
		this.WriteTblPr(table.Pr, table);
		//Look
		var oLook = table.Get_TableLook();
		if(null != oLook)
		{
			var nLook = 0;
			if(oLook.Is_FirstCol())
				nLook |= 0x0080;
			if(oLook.Is_FirstRow())
				nLook |= 0x0020;
			if(oLook.Is_LastCol())
				nLook |= 0x0100;
			if(oLook.Is_LastRow())
				nLook |= 0x0040;
			if(!oLook.Is_BandHor())
				nLook |= 0x0200;
			if(!oLook.Is_BandVer())
				nLook |= 0x0400;
			this.bs.WriteItem(c_oSerProp_tblPrType.Look, function(){oThis.memory.WriteLong(nLook);});
		}
		//Style
		var sStyle = table.Get_TableStyle();
		if(null != sStyle && "" != sStyle)
		{
			this.memory.WriteByte(c_oSerProp_tblPrType.Style);
            this.memory.WriteString2(sStyle);
		}
	},
    WriteTblPr: function(tblPr, table)
    {
        var oThis = this;
		if (null != tblPr.TableStyleRowBandSize) {
			this.bs.WriteItem(c_oSerProp_tblPrType.RowBandSize, function(){oThis.memory.WriteLong(tblPr.TableStyleRowBandSize);});
		}
		if (null != tblPr.TableStyleColBandSize) {
			this.bs.WriteItem(c_oSerProp_tblPrType.ColBandSize, function(){oThis.memory.WriteLong(tblPr.TableStyleColBandSize);});
		}
        //Jc
        if(null != tblPr.Jc)
        {
            this.bs.WriteItem(c_oSerProp_tblPrType.Jc, function(){oThis.memory.WriteByte(tblPr.Jc);});
        }
        //TableInd
        if(null != tblPr.TableInd)
        {
            this.bs.WriteItem(c_oSerProp_tblPrType.TableIndTwips, function(){oThis.bs.writeMmToTwips(tblPr.TableInd);});
        }
        //TableW
        if(null != tblPr.TableW)
        {
            this.bs.WriteItem(c_oSerProp_tblPrType.TableW, function(){oThis.WriteW(tblPr.TableW);});
        }
        //TableCellMar
        if(null != tblPr.TableCellMar)
        {
            this.bs.WriteItem(c_oSerProp_tblPrType.TableCellMar, function(){oThis.WriteCellMar(tblPr.TableCellMar);});
        }
        //TableBorders
        if(null != tblPr.TableBorders)
        {
            this.bs.WriteItem(c_oSerProp_tblPrType.TableBorders, function(){oThis.bs.WriteBorders(tblPr.TableBorders);});
        }
        //Shd
        if(null != tblPr.Shd && Asc.c_oAscShdNil != tblPr.Shd.Value)
        {
            this.bs.WriteItem(c_oSerProp_tblPrType.Shd, function(){oThis.bs.WriteShd(tblPr.Shd);});
        }
        if(null != tblPr.TableLayout)
        {
			var nLayout = ETblLayoutType.tbllayouttypeAutofit;
			switch(tblPr.TableLayout)
			{
				case tbllayout_AutoFit: nLayout = ETblLayoutType.tbllayouttypeAutofit;break;
				case tbllayout_Fixed: nLayout = ETblLayoutType.tbllayouttypeFixed;break;
			}
            this.bs.WriteItem(c_oSerProp_tblPrType.Layout, function(){oThis.memory.WriteByte(nLayout);});
        }
        //tblpPr
        if(null != table && false == table.Inline)
        {
            this.bs.WriteItem(c_oSerProp_tblPrType.tblpPr2, function(){oThis.Write_tblpPr2(table);});
        }
		if(null != tblPr.TableCellSpacing)
		{
			this.bs.WriteItem(c_oSerProp_tblPrType.TableCellSpacingTwips, function(){oThis.bs.writeMmToTwips(tblPr.TableCellSpacing / 2);});
		}
		if(null != tblPr.TableCaption)
		{
			this.memory.WriteByte(c_oSerProp_tblPrType.tblCaption);
			this.memory.WriteString2(tblPr.TableCaption);
		}
		if(null != tblPr.TableDescription)
		{
			this.memory.WriteByte(c_oSerProp_tblPrType.tblDescription);
			this.memory.WriteString2(tblPr.TableDescription);
		}
		if (tblPr.PrChange && tblPr.ReviewInfo) {
			this.bs.WriteItem(c_oSerProp_tblPrType.tblPrChange, function(){WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, tblPr.ReviewInfo, {btw: oThis, tblPr: tblPr.PrChange});});
		}
    },
    WriteCellMar: function(cellMar)
    {
        var oThis = this;
        //Left
        if(null != cellMar.Left)
        {
            this.bs.WriteItem(c_oSerMarginsType.left, function(){oThis.WriteW(cellMar.Left);});
        }
        //Top
        if(null != cellMar.Top)
        {
            this.bs.WriteItem(c_oSerMarginsType.top, function(){oThis.WriteW(cellMar.Top);});
        }
        //Right
        if(null != cellMar.Right)
        {
            this.bs.WriteItem(c_oSerMarginsType.right, function(){oThis.WriteW(cellMar.Right);});
        }
        //Bottom
        if(null != cellMar.Bottom)
        {
            this.bs.WriteItem(c_oSerMarginsType.bottom, function(){oThis.WriteW(cellMar.Bottom);});
        }
    },
    Write_tblpPr2: function(table)
    {
        var oThis = this;
        if(null != table.PositionH)
        {
			var PositionH = table.PositionH;
			if(null != PositionH.RelativeFrom)
			{
				this.memory.WriteByte(c_oSer_tblpPrType2.HorzAnchor);
				this.memory.WriteByte(c_oSerPropLenType.Byte);
				this.memory.WriteByte(PositionH.RelativeFrom);
			}
			if(true == PositionH.Align)
			{
				this.memory.WriteByte(c_oSer_tblpPrType2.TblpXSpec);
				this.memory.WriteByte(c_oSerPropLenType.Byte);
				this.memory.WriteByte(PositionH.Value);
			}
			else
			{
				this.memory.WriteByte(c_oSer_tblpPrType2.TblpXTwips);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToTwips(PositionH.Value);
			}
        }
		if(null != table.PositionV)
        {
			var PositionV = table.PositionV;
			if(null != PositionV.RelativeFrom)
			{
				this.memory.WriteByte(c_oSer_tblpPrType2.VertAnchor);
				this.memory.WriteByte(c_oSerPropLenType.Byte);
				this.memory.WriteByte(PositionV.RelativeFrom);
			}
			if(true == PositionV.Align)
			{
				this.memory.WriteByte(c_oSer_tblpPrType2.TblpYSpec);
				this.memory.WriteByte(c_oSerPropLenType.Byte);
				this.memory.WriteByte(PositionV.Value);
			}
			else
			{
				this.memory.WriteByte(c_oSer_tblpPrType2.TblpYTwips);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToTwips(PositionV.Value);
			}
        }
		if(null != table.Distance)
		{
			this.memory.WriteByte(c_oSer_tblpPrType2.Paddings);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){oThis.bs.WritePaddings(table.Distance);});
		}
    },
    WriteRowPr: function(rowPr, row)
    {
        var oThis = this;
        //CantSplit
        if(null != rowPr.CantSplit)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.CantSplit);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rowPr.CantSplit);
        }
        //After
        if(null != rowPr.GridAfter || null != rowPr.WAfter)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.After);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteAfter(rowPr);});
        }
        //Before
        if(null != rowPr.GridBefore || null != rowPr.WBefore)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.Before);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteBefore(rowPr);});
        }
        //Jc
        if(null != rowPr.Jc)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.Jc);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(rowPr.Jc);
        }
        //TableCellSpacing
        if(null != rowPr.TableCellSpacing)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.TableCellSpacingTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(rowPr.TableCellSpacing / 2);
        }
        //Height
        if(null != rowPr.Height && Asc.linerule_Auto != rowPr.Height.HRule)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.Height);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteRowHeight(rowPr.Height);});
        }
        //Header
        if(true == rowPr.TableHeader)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.TableHeader);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(rowPr.TableHeader);
        }
		if (rowPr.PrChange && rowPr.ReviewInfo) {
			this.memory.WriteByte(c_oSerProp_rowPrType.trPrChange);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, rowPr.ReviewInfo, {btw: oThis, trPr: rowPr.PrChange});});
		}
		if (row) {
			var ReviewType = row.GetReviewType();
			if (reviewtype_Add === ReviewType || reviewtype_Remove === ReviewType) {
				var recordType = reviewtype_Remove === ReviewType ? c_oSerProp_rowPrType.Del : c_oSerProp_rowPrType.Ins;
				this.memory.WriteByte(recordType);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, row.GetReviewInfo());});
			}
		}
    },
    WriteAfter: function(After)
    {
        var oThis = this;
        //GridAfter
        if(null != After.GridAfter)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.GridAfter);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(After.GridAfter);
        }
        //WAfter
        if(null != After.WAfter)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.WAfter);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteW(After.WAfter);});
        }
    },
    WriteBefore: function(Before)
    {
        var oThis = this;
        //GridBefore
        if(null != Before.GridBefore)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.GridBefore);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(Before.GridBefore);
        }
        //WBefore
        if(null != Before.WBefore)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.WBefore);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteW(Before.WBefore);});
        }
    },
    WriteRowHeight: function(rowHeight)
    {
        //HRule
        if(null != rowHeight.HRule)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.Height_Rule);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(rowHeight.HRule);
        }
        //Value
        if(null != rowHeight.Value)
        {
            this.memory.WriteByte(c_oSerProp_rowPrType.Height_ValueTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(rowHeight.Value);
        }
    },
    WriteW: function(WAfter)
    {
		//Type
		if(null != WAfter.Type)
		{
			this.memory.WriteByte(c_oSerWidthType.Type);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(WAfter.Type);
		}
		//W
		if(null != WAfter.W)
		{
			var nVal = WAfter.W;
			if(tblwidth_Mm == WAfter.Type)
				nVal = this.bs.mmToTwips(WAfter.W);
			else if(tblwidth_Pct == WAfter.Type)
				nVal = Math.round(100 * WAfter.W / 2);
			this.memory.WriteByte(c_oSerWidthType.WDocx);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.memory.WriteLong(nVal);
		}
    },
    WriteCellPr: function(cellPr, vMerge, cell)
    {
        var oThis = this;
        //GridSpan
        if(null != cellPr.GridSpan)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.GridSpan);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(cellPr.GridSpan);
        }
        //Shd
        if(null != cellPr.Shd && Asc.c_oAscShdNil != cellPr.Shd.Value)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.Shd);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.bs.WriteShd(cellPr.Shd);});
        }
        //TableCellBorders
        if(null != cellPr.TableCellBorders)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.TableCellBorders);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.bs.WriteBorders(cellPr.TableCellBorders);});
        }
        //CellMar
        if(null != cellPr.TableCellMar)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.CellMar);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteCellMar(cellPr.TableCellMar);});
        }
        //TableCellW
        if(null != cellPr.TableCellW)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.TableCellW);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteW(cellPr.TableCellW);});
        }
        //VAlign
        if(null != cellPr.VAlign)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.VAlign);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(cellPr.VAlign);
        }
        //VMerge
		var nVMerge = null;
        if(null != cellPr.VMerge)
			nVMerge = cellPr.VMerge;
		else if(null != vMerge)
			nVMerge = vMerge;
		if(null != nVMerge)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.VMerge);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(nVMerge);
        }
		if(null != cellPr.HMerge)
		{
			this.memory.WriteByte(c_oSerProp_cellPrType.HMerge);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(cellPr.HMerge);
		}
        var textDirection = cell ? cell.Get_TextDirection() : null;
        if(null != textDirection)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.textDirection);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(textDirection);
        }
        var noWrap = cell ? cell.GetNoWrap() : null;
        if(null != noWrap)
        {
            this.memory.WriteByte(c_oSerProp_cellPrType.noWrap);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteBool(noWrap);
		}
		if (cellPr.PrChange && cellPr.ReviewInfo) {
			this.memory.WriteByte(c_oSerProp_cellPrType.tcPrChange);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, cellPr.ReviewInfo, {btw: oThis, tcPr: cellPr.PrChange});});
		}
    }
};
function BinaryHeaderFooterTableWriter(memory, doc, oNumIdMap, oMapCommentId, saveParams)
{
    this.memory = memory;
    this.Document = doc;
	this.oNumIdMap = oNumIdMap;
	this.oMapCommentId = oMapCommentId;
	this.aHeaders = [];
	this.aFooters = [];
	this.saveParams = saveParams;
    this.bs = new BinaryCommonWriter(this.memory);
    this.Write = function()
    {
        var oThis = this;
        this.bs.WriteItemWithLength(function(){oThis.WriteHeaderFooterContent();});
    };
    this.WriteHeaderFooterContent = function()
    {
        var oThis = this;
        //Header
        if(this.aHeaders.length > 0)
            this.bs.WriteItem(c_oSerHdrFtrTypes.Header,function(){oThis.WriteHdrFtrContent(oThis.aHeaders);});
        //Footer
        if(this.aFooters.length > 0)
            this.bs.WriteItem(c_oSerHdrFtrTypes.Footer,function(){oThis.WriteHdrFtrContent(oThis.aFooters);});
    };
    this.WriteHdrFtrContent = function(aHdrFtr)
    {
        var oThis = this;
		for(var i = 0, length = aHdrFtr.length; i < length; ++i)
		{
			var item = aHdrFtr[i];
			this.bs.WriteItem(item.type, function(){oThis.WriteHdrFtrItem(item.elem);});
		}
    };
    this.WriteHdrFtrItem = function(item)
    {
        var oThis = this;
        //Content
        var dtw = new BinaryDocumentTableWriter(this.memory, this.Document, this.oMapCommentId, this.oNumIdMap, null, this.saveParams, null);
        this.bs.WriteItem(c_oSerHdrFtrTypes.HdrFtr_Content, function(){dtw.WriteDocumentContent(item.Content);});
    };
};
function BinaryNumberingTableWriter(memory, doc, oNumIdMap, oUsedNumIdMap, saveParams)
{
    this.memory = memory;
    this.Document = doc;
	this.oNumIdMap = oNumIdMap;
	this.oUsedNumIdMap = oUsedNumIdMap;
	this.oANumIdToBin = {};
    this.bs = new BinaryCommonWriter(this.memory);
    this.bpPrs = new Binary_pPrWriter(this.memory, null != this.oUsedNumIdMap ? this.oUsedNumIdMap : this.oNumIdMap, null, saveParams);
    this.brPrs = new Binary_rPrWriter(this.memory, saveParams);
    this.Write = function()
    {
        var oThis = this;
        this.bs.WriteItemWithLength(function(){oThis.WriteNumberingContent();});
    };
    this.WriteNumberingContent = function()
    {
        var oThis = this;
        if(null != this.Document.Numbering)
        {
            //ANums
            this.bs.WriteItem(c_oSerNumTypes.AbstractNums, function(){oThis.WriteAbstractNums();});
            //Nums
            this.bs.WriteItem(c_oSerNumTypes.Nums, function(){oThis.WriteNums();});
        }
    };
    this.WriteNums = function()
    {
        var oThis = this;
		var i;
		var nums = this.Document.Numbering.Num;
		if(null != this.oUsedNumIdMap)
		{
			for (i in this.oUsedNumIdMap) {
				if (this.oUsedNumIdMap.hasOwnProperty(i) && nums[i]) {
					this.bs.WriteItem(c_oSerNumTypes.Num, function(){oThis.WriteNum(nums[i], oThis.oUsedNumIdMap[i]);});
				}
			}
		}
		else
		{
			var index = 1;
			for (i in nums) {
				if (nums.hasOwnProperty(i)) {
					this.bs.WriteItem(c_oSerNumTypes.Num, function(){oThis.WriteNum(nums[i], index);});
					index++;
				}
			}
		}
    };
    this.WriteNum = function(num, index)
    {
        var oThis = this;
		var ANumId = this.oANumIdToBin[num.AbstractNumId];
		if (undefined !== ANumId) {
			this.memory.WriteByte(c_oSerNumTypes.Num_ANumId);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.memory.WriteLong(ANumId);
		}
            
        this.memory.WriteByte(c_oSerNumTypes.Num_NumId);
        this.memory.WriteByte(c_oSerPropLenType.Long);
        this.memory.WriteLong(index);
		this.oNumIdMap[num.GetId()] = index;

		for (var nLvl = 0; nLvl < 9; ++nLvl)
		{
			if (num.LvlOverride[nLvl])
			{
				this.memory.WriteByte(c_oSerNumTypes.Num_LvlOverride);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteLvlOverride(num.LvlOverride[nLvl]);});
			}
		}

    };
	this.WriteLvlOverride = function(lvlOverride)
	{
		var oThis = this;
		if (lvlOverride.Lvl >= 0) {
			this.bs.WriteItem(c_oSerNumTypes.ILvl, function(){oThis.memory.WriteLong(lvlOverride.Lvl);});
		}
		if (lvlOverride.StartOverride >= 0) {
			this.bs.WriteItem(c_oSerNumTypes.StartOverride, function(){oThis.memory.WriteLong(lvlOverride.StartOverride);});
		}
		if (lvlOverride.NumberingLvl && lvlOverride.Lvl >= 0) {
			this.bs.WriteItem(c_oSerNumTypes.Lvl, function(){oThis.WriteLevel(lvlOverride.NumberingLvl, lvlOverride.Lvl);});
		}
	};
    this.WriteAbstractNums = function(ANum)
    {
        var oThis = this;
		var i;
		var index = 0;
		var ANums = this.Document.Numbering.AbstractNum;
		var nums = this.Document.Numbering.Num;
		if(null != this.oUsedNumIdMap)
		{
			for (i in this.oUsedNumIdMap) {
				if (this.oUsedNumIdMap.hasOwnProperty(i) && nums[i]) {
					var ANum = ANums[nums[i].AbstractNumId];
					if (null != ANum) {
						this.bs.WriteItem(c_oSerNumTypes.AbstractNum, function(){oThis.WriteAbstractNum(ANum, index);});
						index++;
					}
				}
			}
		}
		else
		{
			for (i in ANums) {
				if (ANums.hasOwnProperty(i)) {
					this.bs.WriteItem(c_oSerNumTypes.AbstractNum, function(){oThis.WriteAbstractNum(ANums[i], index);});
					index++;
				}
			}
		}
    };
    this.WriteAbstractNum = function(num, index)
    {
        var oThis = this;
        //Id
		this.bs.WriteItem(c_oSerNumTypes.AbstractNum_Id, function(){oThis.memory.WriteLong(index);});
		this.oANumIdToBin[num.GetId()] = index;

		if(null != num.NumStyleLink)
		{
            this.memory.WriteByte(c_oSerNumTypes.NumStyleLink);
            this.memory.WriteString2(num.NumStyleLink);
		}
        if(null != num.StyleLink)
		{
            this.memory.WriteByte(c_oSerNumTypes.StyleLink);
            this.memory.WriteString2(num.StyleLink);
		}
        //Lvl
        if(null != num.Lvl)
            this.bs.WriteItem(c_oSerNumTypes.AbstractNum_Lvls, function(){oThis.WriteLevels(num.Lvl);});
    };
    this.WriteLevels = function(lvls)
    {
        var oThis = this;    
        for(var i = 0, length = lvls.length; i < length; i++)
        {
            var lvl = lvls[i];
            this.bs.WriteItem(c_oSerNumTypes.Lvl, function(){oThis.WriteLevel(lvl, i);});
        }
    };
    this.WriteLevel = function(lvl, ILvl)
    {
        var oThis = this;
        //Format
        if(null != lvl.Format)
        {
			this.memory.WriteByte(c_oSerNumTypes.lvl_NumFmt);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){oThis.bpPrs.WriteNumFmt(lvl.Format);});
        }
        //Jc
        if(null != lvl.Jc)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_Jc);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
			switch (lvl.Jc) {
				case align_Center: this.memory.WriteByte(1);break;
				case align_Right: this.memory.WriteByte(11);break;
				case align_Justify:this.memory.WriteByte(2);break;
				default: this.memory.WriteByte(10);break;
			}
        }
        //LvlText
        if(null != lvl.LvlText)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_LvlText);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.WriteLevelText(lvl.LvlText);});
        }
        //Restart
        if(lvl.Restart >= 0)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_Restart);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(lvl.Restart);
        }
        //Start
        if(null != lvl.Start)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_Start);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.memory.WriteLong(lvl.Start);
        }
        //Suff
        if(null != lvl.Suff)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_Suff);
            this.memory.WriteByte(c_oSerPropLenType.Byte);
            this.memory.WriteByte(lvl.Suff);
        }
		//PStyle
        if(null != lvl.PStyle)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_PStyle);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.memory.WriteString2(lvl.PStyle);
        }
        //ParaPr
        if(null != lvl.ParaPr)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_ParaPr);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.bpPrs.Write_pPr(lvl.ParaPr);});
        }
        //TextPr
        if(null != lvl.TextPr)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_TextPr);
            this.memory.WriteByte(c_oSerPropLenType.Variable);
            this.bs.WriteItemWithLength(function(){oThis.brPrs.Write_rPr(lvl.TextPr, null, null);});
        }
		if(null != ILvl)
		{
			this.memory.WriteByte(c_oSerNumTypes.ILvl);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.memory.WriteLong(ILvl);
		}
		// if(null != lvl.Tentative)
		// {
		// 	this.memory.WriteByte(c_oSerNumTypes.Tentative);
		// 	this.memory.WriteByte(c_oSerPropLenType.Byte);
		// 	this.memory.WriteBool(lvl.Tentative);
		// }
		// if(null != lvl.Tplc)
		// {
		// 	this.memory.WriteByte(c_oSerNumTypes.Tplc);
		// 	this.memory.WriteByte(c_oSerPropLenType.Long);
		// 	this.memory.WriteLong(AscFonts.FT_Common.UintToInt(lvl.Tplc));
		// }
		if(null != lvl.IsLgl)
		{
			this.memory.WriteByte(c_oSerNumTypes.IsLgl);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(lvl.IsLgl);
		}
		if(null != lvl.Legacy)
		{
			this.memory.WriteByte(c_oSerNumTypes.LvlLegacy);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){oThis.WriteLvlLegacy(lvl.Legacy);});
		}
    };
	this.WriteLvlLegacy = function(lvlLegacy)
	{
		var oThis = this;
		if (null != lvlLegacy.Legacy) {
			this.bs.WriteItem(c_oSerNumTypes.Legacy, function(){oThis.memory.WriteBool(lvlLegacy.Legacy);});
		}
		if (null != lvlLegacy.Indent) {
			this.bs.WriteItem(c_oSerNumTypes.LegacyIndent, function(){oThis.memory.WriteLong(lvlLegacy.Indent);});
		}
		if (null != lvlLegacy.Space) {
			this.bs.WriteItem(c_oSerNumTypes.LegacySpace, function(){oThis.memory.WriteLong(AscFonts.FT_Common.UintToInt(lvlLegacy.Space))});
		}
	};
    this.WriteLevelText = function(aText)
    {
        var oThis = this;
        for(var i = 0, length = aText.length; i < length; i++)
        {
            var item = aText[i];
            this.bs.WriteItem(c_oSerNumTypes.lvl_LvlTextItem, function(){oThis.WriteLevelTextItem(item);});
        }
    };
    this.WriteLevelTextItem = function(oTextItem)
    {
        var oThis = this;
        if(numbering_lvltext_Text == oTextItem.Type)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_LvlTextItemText);
            oThis.memory.WriteString2(oTextItem.Value.toString());
        }
        else if(numbering_lvltext_Num == oTextItem.Type)
        {
            this.memory.WriteByte(c_oSerNumTypes.lvl_LvlTextItemNum);
            this.bs.WriteItemWithLength(function(){oThis.memory.WriteByte(oTextItem.Value);});
        }
    };
};
function BinaryDocumentTableWriter(memory, doc, oMapCommentId, oNumIdMap, copyParams, saveParams, oBinaryHeaderFooterTableWriter)
{
    this.memory = memory;
    this.Document = doc;
	this.oNumIdMap = oNumIdMap;
    this.bs = new BinaryCommonWriter(this.memory);
	this.btblPrs = new Binary_tblPrWriter(this.memory, oNumIdMap, saveParams);
    this.bpPrs = new Binary_pPrWriter(this.memory, oNumIdMap, oBinaryHeaderFooterTableWriter, saveParams);
    this.brPrs = new Binary_rPrWriter(this.memory, saveParams);
	this.boMaths = new Binary_oMathWriter(this.memory, null, saveParams);
	this.oMapCommentId = oMapCommentId;
	this.copyParams = copyParams;
	this.saveParams = saveParams;
    this.Write = function()
    {
        var oThis = this;
        this.bs.WriteItemWithLength(function(){oThis.WriteDocumentContent(oThis.Document, true);});
    };
    this.WriteDocumentContent = function(oDocument, bIsMainDoc)
    {
        var Content = oDocument.Content;
        var oThis = this;
        for ( var i = 0, length = Content.length; i < length; ++i )
        {
            var item = Content[i];
            if ( type_Paragraph === item.GetType() )
            {
                this.memory.WriteByte(c_oSerParType.Par);
                this.bs.WriteItemWithLength(function(){oThis.WriteParapraph(item);});

                this.WriteRunRevisionMove(item);
            }
            else if(type_Table === item.GetType())
            {
                this.memory.WriteByte(c_oSerParType.Table);
                this.bs.WriteItemWithLength(function(){oThis.WriteDocTable(item);});
            }
			else if(type_BlockLevelSdt === item.GetType())
			{
				this.memory.WriteByte(c_oSerParType.Sdt);
				this.bs.WriteItemWithLength(function(){oThis.WriteSdt(item, 0);});
			}
        }
        if(bIsMainDoc)
        {
            //sectPr
            this.bs.WriteItem(c_oSerParType.sectPr, function(){oThis.bpPrs.WriteSectPr(oThis.Document.SectPr, oThis.Document);});
			if (oThis.Document.Background) {
				this.bs.WriteItem(c_oSerParType.Background, function(){oThis.WriteBackground(oThis.Document.Background);});
			}
			var macros = this.Document.DrawingDocument.m_oWordControl.m_oApi.macros.GetData();
			if (macros) {
				this.bs.WriteItem(c_oSerParType.JsaProject, function() {
					oThis.memory.WriteXmlString(macros);
				});
			}
		}
    };
	this.WriteRunRevisionMove = function(par) {
		var oThis = this;
		if (par.Content && par.Content.length > 0) {
			var lastRun = par.Content[par.Content.length - 1];
			if (para_Run === lastRun.Type) {
				//first elem is ParaEnd
				for (var i = 1; i < lastRun.Content.length; ++i) {
					var runRevision = lastRun.Content[i];
					if (para_RevisionMove === runRevision.Type) {
						WiteMoveRange(oThis.bs, oThis.saveParams, runRevision);
					}
				}
			}
		}
	};
	this.WriteBackground = function(oBackground) {
		var oThis = this;
		var color = null;
		if (null != oBackground.Color)
			color = oBackground.Color;
		else if (null != oBackground.Unifill) {
			var doc = editor.WordControl.m_oLogicDocument;
			oBackground.Unifill.check(doc.Get_Theme(), doc.Get_ColorMap());
			var RGBA = oBackground.Unifill.getRGBAColor();
			color = new AscCommonWord.CDocumentColor(RGBA.R, RGBA.G, RGBA.B);
		}
		if (null != color && !color.Auto)
			this.bs.WriteColor(c_oSerBackgroundType.Color, color);
		if (null != oBackground.Unifill || (null != oBackground.Color && oBackground.Color.Auto)) {
			this.memory.WriteByte(c_oSerBackgroundType.ColorTheme);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function () { oThis.bs.WriteColorTheme(oBackground.Unifill, oBackground.Color); });
		}
		if (oBackground.shape) {
			this.memory.WriteByte(c_oSerBackgroundType.pptxDrawing);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){oThis.WriteGraphicObj(oBackground.shape);});
		}
	}
    this.WriteParapraph = function(par, bUseSelection, selectedAll)
    {
        var oThis = this;
		if(null != this.copyParams)
        {
			//анализируем используемые списки и стили
			var sParaStyle = par.Style_Get();
			if(null != sParaStyle)
				this.copyParams.oUsedStyleMap[sParaStyle] = 1;
			var oNumPr = par.GetNumPr();
			if(oNumPr && oNumPr.IsValid())
			{
				if(null == this.copyParams.oUsedNumIdMap[oNumPr.NumId])
				{
					this.copyParams.oUsedNumIdMap[oNumPr.NumId] = this.copyParams.nNumIdIndex;
					this.copyParams.nNumIdIndex++;
					//проверяем PStyle уровней списка
					var Numbering = par.Parent.Get_Numbering();
					var oNum = null;
					if(null != Numbering)
						oNum = Numbering.GetNum(oNumPr.NumId);
					if(null != oNum)
					{
						if (null != oNum.GetNumStyleLink()) {
							this.copyParams.oUsedStyleMap[oNum.GetNumStyleLink()] = 1;
						}
						if (null != oNum.GetStyleLink()) {
							this.copyParams.oUsedStyleMap[oNum.GetStyleLink()] = 1;
						}
						for(var i = 0, length = 9; i < length; ++i)
						{
							var oLvl = oNum.GetLvl(i);
							if(oLvl && oLvl.GetPStyle())
								this.copyParams.oUsedStyleMap[oLvl.GetPStyle()] = 1;
						}
					}
				}
			}
        }
        //pPr
        var ParaStyle = par.Style_Get();
        var pPr = par.Pr;
        if(null != pPr || null != ParaStyle)
        {
            if(null == pPr)
                pPr = {};
            var EndRun = par.GetParaEndRun();
            this.memory.WriteByte(c_oSerParType.pPr);
            this.bs.WriteItemWithLength(function(){oThis.bpPrs.Write_pPr(pPr, par.TextPr.Value, EndRun, par.Get_SectionPr(), oThis.Document);});
        }
        //Content
        if(null != par.Content)
        {
            this.memory.WriteByte(c_oSerParType.Content);
            this.bs.WriteItemWithLength(function(){oThis.WriteParagraphContent(par, bUseSelection ,true, selectedAll);});
        }
    };
    this.WriteParagraphContent = function (par, bUseSelection, bLastRun, selectedAll)
    {
        var ParaStart = 0;
        var ParaEnd = par.Content.length - 1;
        if (true == bUseSelection) {
            ParaStart = par.Selection.StartPos;
            ParaEnd = par.Selection.EndPos;
            if (ParaStart > ParaEnd) {
                var Temp2 = ParaEnd;
                ParaEnd = ParaStart;
                ParaStart = Temp2;
            }
        };
		
		//TODO Стоит пересмотреть флаг bUseSelection и учитывать внутри Selection флаг use.
		if(ParaEnd < 0)
			ParaEnd = 0;
		if(ParaStart < 0)
			ParaStart = 0;	
		
		var Content = par.Content;
        //todo commentStart для копирования
        var oThis = this;
        for ( var i = ParaStart; i <= ParaEnd && i < Content.length; ++i )
        {
            var item = Content[i];
            switch ( item.Type )
            {
                case para_Run:
                    var reviewType = item.GetReviewType();
                    if (reviewtype_Common !== reviewType) {
						writeNestedReviewType(reviewType, item.GetReviewInfo(), function(reviewType, reviewInfo, delText, fCallback){
							var recordType;
							if (reviewtype_Remove === reviewType) {
								if (reviewInfo.IsMovedFrom()) {
									recordType = c_oSerParType.MoveFrom;
								} else {
									recordType = c_oSerParType.Del;
									delText = true;
								}
							} else {
								recordType = reviewInfo.IsMovedTo() ? c_oSerParType.MoveTo : c_oSerParType.Ins;
							}
							oThis.bs.WriteItem(recordType, function () {WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, reviewInfo, {run: function(){fCallback(delText);}});});
						}, function(delText) {
							oThis.WriteRun(item, bUseSelection, delText);
						});
                    } else {
                        this.WriteRun(item, bUseSelection, false);
                    }
                    break;
				case para_Field:
					var Instr = null;
					var oFFData = null;
					if (fieldtype_MERGEFIELD == item.FieldType) {
						Instr = "MERGEFIELD";
					} else if (fieldtype_FORMTEXT === item.Get_FieldType()) {
						Instr = "FORMTEXT";
						oFFData = {};
					}
					else if(fieldtype_SEQ === item.Get_FieldType()) {
						Instr = "SEQ";
					}
					else if(fieldtype_STYLEREF === item.Get_FieldType()) {
						Instr = "STYLEREF";
					}
					if (null !== Instr) {
						if(this.saveParams && this.saveParams.bMailMergeDocx)
							oThis.WriteParagraphContent(item, bUseSelection, false);
						else
						{
							for(var j = 0; j < item.Arguments.length; ++j){
								var argument = item.Arguments[j];
								argument = argument.replace(/(\\|")/g, "\\$1");
								if(-1 != argument.indexOf(' '))
									argument = "\"" + argument + "\"";
								Instr += " " + argument;
							}
							for(var j = 0; j < item.Switches.length; ++j)
								Instr += " \\" + item.Switches[j];
							this.bs.WriteItem(c_oSerParType.FldSimple, function () {
								oThis.WriteFldSimple(Instr, oFFData, function(){oThis.WriteParagraphContent(item, bUseSelection, false);});
							});
						}
					}
                    break;
				case para_Hyperlink:
                    this.bs.WriteItem(c_oSerParType.Hyperlink, function () {
                        oThis.WriteHyperlink(item, bUseSelection);
                    });
                    break;
                case para_Comment:
					if(null != this.oMapCommentId)
					{
					    if (item.Start) {
					        var commentId = this.oMapCommentId[item.CommentId];
					        if (null != commentId)
					            this.bs.WriteItem(c_oSerParType.CommentStart, function () {
					                oThis.bs.WriteItem(c_oSer_CommentsType.Id, function () {
					                    oThis.memory.WriteLong(commentId);
					                })
					            });
					    }
					    else
					    {
					        var commentId = this.oMapCommentId[item.CommentId];
					        if (null != commentId) {
					            this.bs.WriteItem(c_oSerParType.CommentEnd, function () {
					                oThis.bs.WriteItem(c_oSer_CommentsType.Id, function () {
					                    oThis.memory.WriteLong(commentId);
					                })
					            });
					            this.WriteRun2(function () {
					                oThis.bs.WriteItem(c_oSerRunType.CommentReference, function () {
					                    oThis.bs.WriteItem(c_oSer_CommentsType.Id, function () {
					                        oThis.memory.WriteLong(commentId);
					                    })
					                });
					            });
					        }
					    }
					}
                    break;
				case para_Math:
					{
						if (null != item.Root)
						{
							if(this.saveParams && this.saveParams.bMailMergeHtml)
							{
								//заменяем на картинку, если бы был аналог CachedImage не надо было бы заменять
								var sSrc = item.MathToImageConverter();
								if (null != sSrc && null != sSrc.ImageUrl && sSrc.w_mm > 0 && sSrc.h_mm > 0){
									var doc = this.Document;
									//todo paragraph
									var drawing = new ParaDrawing(sSrc.w_mm, sSrc.h_mm, null, this.Document.DrawingDocument, this.Document, par);
									var Image = editor.WordControl.m_oLogicDocument.DrawingObjects.createImage(sSrc.ImageUrl, 0, 0, sSrc.w_mm, sSrc.h_mm);
									Image.cachedImage = sSrc.ImageUrl;
									drawing.Set_GraphicObject(Image);
									Image.setParent(drawing);
									this.WriteRun2( function () {
										oThis.bs.WriteItem(c_oSerRunType.pptxDrawing, function () { oThis.WriteImage(drawing); });
									});
								}
							}
							else {
								if (type_Paragraph === par.GetType() && true === par.Check_MathPara(i)) {
									this.bs.WriteItem(c_oSerParType.OMathPara, function() {oThis.boMaths.WriteOMathPara(item);});
								} else {
									this.bs.WriteItem(c_oSerParType.OMath, function(){oThis.boMaths.WriteArgNodes(item.Root);});
								}
							}
						}
					}
					break;
				case para_InlineLevelSdt:
					this.bs.WriteItem(c_oSerParType.Sdt, function () {
						oThis.WriteSdt(item, 1);
					});
					break;
				case para_Bookmark:
					var typeBookmark = item.IsStart() ? c_oSerParType.BookmarkStart : c_oSerParType.BookmarkEnd;
					this.bs.WriteItem(typeBookmark, function () {
						oThis.bs.WriteBookmark(item);
					});
					break;
				case para_RevisionMove:
					WiteMoveRange(this.bs, this.saveParams, item);
					break;
            }
        }
        if ((bLastRun && bUseSelection && !par.Selection_CheckParaEnd()) || (selectedAll != undefined && selectedAll === false) )
		{
            this.WriteRun2( function () {
                oThis.memory.WriteByte(c_oSerRunType._LastRun);
                oThis.memory.WriteLong(c_oSerPropLenType.Null);
            });
        }
    };
    this.WriteHyperlink = function (oHyperlink, bUseSelection) {
        var oThis = this;
        var sTooltip = oHyperlink.GetToolTip();
		if (oHyperlink.IsAnchor()) {
			this.memory.WriteByte(c_oSer_HyperlinkType.Anchor);
			this.memory.WriteString2(oHyperlink.GetAnchor());
		} else {
			this.memory.WriteByte(c_oSer_HyperlinkType.Link);
			this.memory.WriteString2(oHyperlink.GetValue());
		}
        //Tooltip
        if (null != sTooltip && "" != sTooltip)
        {
            this.memory.WriteByte(c_oSer_HyperlinkType.Tooltip);
            this.memory.WriteString2(sTooltip);
        }
        this.bs.WriteItem(c_oSer_HyperlinkType.History, function(){
            oThis.memory.WriteBool(true);
        });	
        //Content
        this.bs.WriteItem(c_oSer_HyperlinkType.Content, function () {
            oThis.WriteParagraphContent(oHyperlink, bUseSelection, false);
        });
    }
	this.WriteText = function (sCurText, type)
    {
        if("" != sCurText)
        {
			this.memory.WriteByte(type);
            this.memory.WriteString2(sCurText.toString());
            sCurText = "";
        }
        return sCurText;
    };
    this.WriteRun2 = function (fWriter, oRun) {
        var oThis = this;
        this.bs.WriteItem(c_oSerParType.Run, function () {
            //rPr
            if (null != oRun && null != oRun.Pr)
                oThis.bs.WriteItem(c_oSerRunType.rPr, function () { oThis.brPrs.Write_rPr(oRun.Pr, oRun.Pr, null); });
            //Content
            oThis.bs.WriteItem(c_oSerRunType.Content, function () {
                fWriter();
            });
        });
    }
    this.WriteRun = function (oRun, bUseSelection, delText) {
        //Paragraph.Selection последний элемент входит в выделение
        //Run.Selection последний элемент не входит в выделение
        var oThis = this;
		if(null != this.copyParams)
        {
			//анализируем используемые стили
			var runStyle = oRun.Pr.RStyle !== undefined ? oRun.Pr.RStyle : null;
			if(null != runStyle)
				this.copyParams.oUsedStyleMap[runStyle] = 1;
        }
		
        var ParaStart = 0;
        var ParaEnd = oRun.Content.length;
        if (true == bUseSelection) {
            ParaStart = oRun.Selection.StartPos;
            ParaEnd = oRun.Selection.EndPos;
            if (ParaStart > ParaEnd) {
                var Temp2 = ParaEnd;
                ParaEnd = ParaStart;
                ParaStart = Temp2;
            }
        }
        //разбиваем по para_PageNum на массив диапазонов.
        var nPrevIndex = ParaStart;
        var aRunRanges = [];
        for (var i = ParaStart; i < ParaEnd && i < oRun.Content.length; i++) {
            var item = oRun.Content[i];
            if (item.Type == para_PageNum || item.Type == para_PageCount) {
                var elem;
                if (nPrevIndex < i)
                    elem = { nStart: nPrevIndex, nEnd: i, pageNum: item };
                else
                    elem = { nStart: null, nEnd: null, pageNum: item };
                nPrevIndex = i + 1;
                aRunRanges.push(elem);
            }
        }
        if (nPrevIndex <= ParaEnd)
            aRunRanges.push({ nStart: nPrevIndex, nEnd: ParaEnd, pageNum: null });
        for (var i = 0, length = aRunRanges.length; i < length; i++) {
            var elem = aRunRanges[i];
            if (null != elem.nStart && null != elem.nEnd) {
                this.bs.WriteItem(c_oSerParType.Run, function () {
                    //rPr
                    if (null != oRun.Pr)
                        oThis.bs.WriteItem(c_oSerRunType.rPr, function () { oThis.brPrs.Write_rPr(oRun.Pr, oRun.Pr, null); });
                    //Content
                    oThis.bs.WriteItem(c_oSerRunType.Content, function () {
                        oThis.WriteRunContent(oRun, elem.nStart, elem.nEnd, delText);
                    });
                });
            }
            if (null != elem.pageNum) {
				var Instr;
				if (elem.pageNum.Type == para_PageCount) {
					Instr = "NUMPAGES \\* MERGEFORMAT";
				} else {
					Instr = "PAGE \\* MERGEFORMAT";
				}
				this.bs.WriteItem(c_oSerParType.FldSimple, function(){oThis.WriteFldSimple(Instr, null, function(){
                    oThis.WriteRun2(function () {
                        //todo не писать через fldsimple
						var num = elem.pageNum.Type == para_PageCount ? elem.pageNum.GetPageCountValue() : elem.pageNum.GetPageNumValue();
						var textType = delText ? c_oSerRunType.delText : c_oSerRunType.run;
						oThis.WriteText(num.toString(), textType);
                    }, oRun);
				});});
            }
        }
    }
	this.WriteFldChar = function (fldChar)
	{
		var oThis = this;
		this.bs.WriteItem(c_oSer_FldSimpleType.CharType, function() {
			oThis.memory.WriteByte(fldChar.CharType);
		});
	};
	this.WriteFldSimple = function (Instr, oFFData, fWriteContent)
    {
		var oThis = this;
		//порядок записи важен
		//Instr
		this.memory.WriteByte(c_oSer_FldSimpleType.Instr);
        this.memory.WriteString2(Instr);
		//FFData
		if (null !== oFFData) {
			this.bs.WriteItem(c_oSer_FldSimpleType.FFData, function() {
				oThis.WriteFFData(oFFData);
			});
		}
		//Content
		this.bs.WriteItem(c_oSer_FldSimpleType.Content, fWriteContent);
    };
	this.WriteFFData = function(oFFData) {
		var oThis = this;
		if (null != oFFData.CalcOnExit) {
			this.bs.WriteItem(c_oSerFFData.CalcOnExit, function() {
				oThis.memory.WriteBool(oFFData.CalcOnExit);
			});
		}
		if (null != oFFData.CheckBox) {
			this.bs.WriteItem(c_oSerFFData.CheckBox, function() {
				oThis.WriteFFCheckBox(oFFData.CheckBox);
			});
		}
		if (null != oFFData.DDList) {
			this.bs.WriteItem(c_oSerFFData.DDList, function() {
				oThis.WriteDDList(oFFData.DDList);
			});
		}
		if (null != oFFData.Enabled) {
			this.bs.WriteItem(c_oSerFFData.Enabled, function() {
				oThis.memory.WriteBool(oFFData.Enabled);
			});
		}
		if (null != oFFData.EntryMacro) {
			this.memory.WriteByte(c_oSerFFData.EntryMacro);
			this.memory.WriteString2(oFFData.EntryMacro);
		}
		if (null != oFFData.ExitMacro) {
			this.memory.WriteByte(c_oSerFFData.ExitMacro);
			this.memory.WriteString2(oFFData.ExitMacro);
		}
		if (null != oFFData.HelpText) {
			this.bs.WriteItem(c_oSerFFData.HelpText, function() {
				oThis.WriteFFHelpText(oFFData.HelpText);
			});
		}
		if (null != oFFData.Label) {
			this.bs.WriteItem(c_oSerFFData.Label, function() {
				oThis.memory.WriteLong(oFFData.Label);
			});
		}
		if (null != oFFData.Name) {
			this.memory.WriteByte(c_oSerFFData.Name);
			this.memory.WriteString2(oFFData.Name);
		}
		if (null != oFFData.StatusText) {
			this.bs.WriteItem(c_oSerFFData.StatusText, function() {
				oThis.WriteFFHelpText(oFFData.StatusText);
			});
		}
		if (null != oFFData.TabIndex) {
			this.bs.WriteItem(c_oSerFFData.TabIndex, function() {
				oThis.memory.WriteLong(oFFData.TabIndex);
			});
		}
		if (null != oFFData.TabIndex) {
			this.bs.WriteItem(c_oSerFFData.TabIndex, function() {
				oThis.memory.WriteLong(oFFData.TabIndex);
			});
		}
		if (null != oFFData.TextInput) {
			this.bs.WriteItem(c_oSerFFData.TextInput, function() {
				oThis.WriteTextInput(oFFData.TextInput);
			});
		}
	};
	this.WriteFFCheckBox = function(oCheckBox) {
		var oThis = this;
		if (null != oCheckBox.CBChecked) {
			this.bs.WriteItem(c_oSerFFData.CBChecked, function() {
				oThis.memory.WriteBool(oCheckBox.CBChecked);
			});
		}
		if (null != oCheckBox.CBDefault) {
			this.bs.WriteItem(c_oSerFFData.CBDefault, function() {
				oThis.memory.WriteBool(oCheckBox.CBDefault);
			});
		}
		if (null != oCheckBox.CBSize) {
			this.bs.WriteItem(c_oSerFFData.CBSize, function() {
				oThis.memory.WriteLong(oCheckBox.CBSize);
			});
		}
		if (null != oCheckBox.CBSizeAuto) {
			this.bs.WriteItem(c_oSerFFData.CBSizeAuto, function() {
				oThis.memory.WriteBool(oCheckBox.CBSizeAuto);
			});
		}
	};
	this.WriteDDList = function(oDDList) {
		var oThis = this;
		if (null != oDDList.DLDefault) {
			this.bs.WriteItem(c_oSerFFData.DLDefault, function() {
				oThis.memory.WriteLong(oDDList.DLDefault);
			});
		}
		if (null != oDDList.DLResult) {
			this.bs.WriteItem(c_oSerFFData.DLResult, function() {
				oThis.memory.WriteLong(oDDList.DLResult);
			});
		}
		for (var i = 0; i < oDDList.DLListEntry.length; ++i) {
			this.memory.WriteByte(c_oSerFFData.DLListEntry);
			this.memory.WriteString2(oDDList.DLListEntry[i]);
		}
	};
	this.WriteFFHelpText = function(oHelpText) {
		var oThis = this;
		if (null != oHelpText.HTType) {
			this.bs.WriteItem(c_oSerFFData.HTType, function() {
				oThis.memory.WriteByte(oHelpText.HTType);
			});
		}
		if (null != oHelpText.HTVal) {
			this.memory.WriteByte(c_oSerFFData.HTVal);
			this.memory.WriteString2(oHelpText.HTVal);
		}
	};
	this.WriteTextInput = function(oTextInput) {
		var oThis = this;
		if (null != oTextInput.TIDefault) {
			this.memory.WriteByte(c_oSerFFData.TIDefault);
			this.memory.WriteString2(oTextInput.TIDefault);
		}
		if (null != oTextInput.TIFormat) {
			this.memory.WriteByte(c_oSerFFData.TIFormat);
			this.memory.WriteString2(oTextInput.TIFormat);
		}
		if (null != oTextInput.TIMaxLength) {
			this.bs.WriteItem(c_oSerFFData.TIMaxLength, function() {
				oThis.memory.WriteLong(oTextInput.TIMaxLength);
			});
		}
		if (null != oTextInput.TIType) {
			this.bs.WriteItem(c_oSerFFData.TIType, function() {
				oThis.memory.WriteByte(oTextInput.TIType);
			});
		}
	};

    this.WriteRunContent = function (oRun, nStart, nEnd, delText)
    {
        var oThis = this;
        
        var Content = oRun.Content;
        var sCurText = "";
		var sCurInstrText = "";
		var textType = delText ? c_oSerRunType.delText : c_oSerRunType.run;
		var instrTextType = delText ? c_oSerRunType.delInstrText : c_oSerRunType.instrText;
        for (var i = nStart; i < nEnd && i < Content.length; ++i)
        {
            var item = Content[i];
            switch ( item.Type )
            {
                case para_Text:
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
                    if (item.IsNoBreakHyphen()) {
						sCurText = this.WriteText(sCurText, textType);
                        oThis.memory.WriteByte(c_oSerRunType.nonBreakHyphen);
                        oThis.memory.WriteLong(c_oSerPropLenType.Null);
                    } else {
                        sCurText += AscCommon.encodeSurrogateChar(item.Value);
                    }
                    break;
                case para_Space:
                    sCurText += " ";
                    break;
                case para_Tab:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
                    oThis.memory.WriteByte(c_oSerRunType.tab);
                    oThis.memory.WriteLong(c_oSerPropLenType.Null);
                    break;
                case para_NewLine:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
                    switch (item.BreakType) {
                        case break_Column:
                            oThis.memory.WriteByte(c_oSerRunType.columnbreak);
                            break;
                        case break_Page:
                            oThis.memory.WriteByte(c_oSerRunType.pagebreak);
                            break;
                        default:
                            oThis.memory.WriteByte(c_oSerRunType.linebreak);
                            break;
                    }
                    oThis.memory.WriteLong(c_oSerPropLenType.Null);
                    break;
				case para_Separator:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
					oThis.memory.WriteByte(c_oSerRunType.separator);
					oThis.memory.WriteLong(c_oSerPropLenType.Null);
					break;
				case para_ContinuationSeparator:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
					oThis.memory.WriteByte(c_oSerRunType.continuationSeparator);
					oThis.memory.WriteLong(c_oSerPropLenType.Null);
					break;
				case para_FootnoteRef:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
					oThis.memory.WriteByte(c_oSerRunType.footnoteRef);
					oThis.memory.WriteLong(c_oSerPropLenType.Null);
					break;
				case para_FootnoteReference:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
					oThis.bs.WriteItem(c_oSerRunType.footnoteReference, function() {oThis.WriteFootnoteRef(item);});
					break;
				case para_FieldChar:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
					oThis.bs.WriteItem(c_oSerRunType.fldChar, function() {oThis.WriteFldChar(item);});
					break;
				case para_InstrText:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText += AscCommon.encodeSurrogateChar(item.Value);
					break;
                case para_Drawing:
					sCurText = this.WriteText(sCurText, textType);
					sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
                    //if (item.Extent && item.GraphicObj && item.GraphicObj.spPr && item.GraphicObj.spPr.xfrm) {
                    //    item.Extent.W = item.GraphicObj.spPr.xfrm.extX;
                    //    item.Extent.H = item.GraphicObj.spPr.xfrm.extY;
                    //}
                    if(this.copyParams)
                    {
                        AscFormat.ExecuteNoHistory(function(){
                          AscFormat.CheckSpPrXfrm2(item.GraphicObj);
                        }, this, []);
                    }
					
					if(this.copyParams && item.ParaMath)
					{
						oThis.bs.WriteItem(c_oSerRunType.object, function () { oThis.WriteObject(item); });
					}
					else
					{
						oThis.bs.WriteItem(c_oSerRunType.pptxDrawing, function () { oThis.WriteImage(item); });
					}
                    break;
            }
        }
		sCurText = this.WriteText(sCurText, textType);
		sCurInstrText = this.WriteText(sCurInstrText, instrTextType);
    };
	this.WriteFootnoteRef = function(footnoteReference)
	{
		var oThis = this;
		var footnote = footnoteReference.GetFootnote();
		if (null != footnoteReference.CustomMark) {
			this.bs.WriteItem(c_oSerNotes.RefCustomMarkFollows, function() {oThis.memory.WriteBool(footnoteReference.CustomMark);});
		}
		var index = this.saveParams.footnotesIndex++;
		this.saveParams.footnotes[index] = {type: null, content: footnote};
		this.bs.WriteItem(c_oSerNotes.RefId, function () { oThis.memory.WriteLong(index); });
	};
	this.WriteGraphicObj = function(graphicObj) {
		var oThis = this;
		this.memory.WriteByte(c_oSerImageType2.PptxData);
		this.memory.WriteByte(c_oSerPropLenType.Variable);
		this.bs.WriteItemWithLength(function(){pptx_content_writer.WriteDrawing(oThis.memory, graphicObj, oThis.Document, oThis.oMapCommentId, oThis.oNumIdMap, oThis.copyParams, oThis.saveParams);});
	}
    this.WriteImage = function(img)
    {
		var oThis = this;
		if(drawing_Inline == img.DrawingType)
		{
			this.memory.WriteByte(c_oSerImageType2.Type);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(c_oAscWrapStyle.Inline);
			
			this.memory.WriteByte(c_oSerImageType2.Extent);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){oThis.WriteExtent(img.Extent);});
			if(img.EffectExtent)
			{
				this.memory.WriteByte(c_oSerImageType2.EffectExtent);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteEffectExtent(img.EffectExtent);});
			}
			if (null != img.GraphicObj.locks) {
				this.memory.WriteByte(c_oSerImageType2.GraphicFramePr);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteGraphicFramePr(img.GraphicObj.locks);});
			}
			if (null != img.docPr) {
				this.memory.WriteByte(c_oSerImageType2.DocPr);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteDocPr(img.docPr);});
			}
			if(null != img.GraphicObj.chart)
			{
				this.memory.WriteByte(c_oSerImageType2.Chart2);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				
				var oBinaryChartWriter = new AscCommon.BinaryChartWriter(this.memory);
				this.bs.WriteItemWithLength(function () { oBinaryChartWriter.WriteCT_ChartSpace(img.GraphicObj); });
			} else {
				this.WriteGraphicObj(img.GraphicObj);
			}
		}
		else
		{
			this.memory.WriteByte(c_oSerImageType2.Type);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(c_oAscWrapStyle.Flow);
			
			if(null != img.behindDoc)
			{
				this.memory.WriteByte(c_oSerImageType2.BehindDoc);
				this.memory.WriteByte(c_oSerPropLenType.Byte);
				this.memory.WriteBool(img.behindDoc);
			}
			if(null != img.Distance.L)
			{
				this.memory.WriteByte(c_oSerImageType2.DistLEmu);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToUEmu(AscFonts.FT_Common.UintToInt(img.Distance.L));
			}
			if(null != img.Distance.T)
			{
				this.memory.WriteByte(c_oSerImageType2.DistTEmu);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToUEmu(AscFonts.FT_Common.UintToInt(img.Distance.T));
			}
			if(null != img.Distance.R)
			{
				this.memory.WriteByte(c_oSerImageType2.DistREmu);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToUEmu(AscFonts.FT_Common.UintToInt(img.Distance.R));
			}
			if(null != img.Distance.B)
			{
				this.memory.WriteByte(c_oSerImageType2.DistBEmu);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToUEmu(AscFonts.FT_Common.UintToInt(img.Distance.B));
			}
            if(null != img.LayoutInCell)
            {
                this.memory.WriteByte(c_oSerImageType2.LayoutInCell);
                this.memory.WriteByte(c_oSerPropLenType.Byte);
                this.memory.WriteBool(img.LayoutInCell);
            }
			if(null != img.RelativeHeight)
			{
				this.memory.WriteByte(c_oSerImageType2.RelativeHeight);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.memory.WriteLong(img.RelativeHeight);
			}
			if(null != img.SimplePos.Use)
			{
				this.memory.WriteByte(c_oSerImageType2.BSimplePos);
				this.memory.WriteByte(c_oSerPropLenType.Byte);
				this.memory.WriteBool(img.SimplePos.Use);
			}
			if(img.EffectExtent)
			{
				this.memory.WriteByte(c_oSerImageType2.EffectExtent);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteEffectExtent(img.EffectExtent);});
			}
			if(null != img.Extent)
			{
				this.memory.WriteByte(c_oSerImageType2.Extent);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteExtent(img.Extent);});
			}
			if(null != img.PositionH)
			{
				this.memory.WriteByte(c_oSerImageType2.PositionH);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WritePositionHV(img.PositionH);});
			}
			if(null != img.PositionV)
			{
				this.memory.WriteByte(c_oSerImageType2.PositionV);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WritePositionHV(img.PositionV);});
			}
			if(null != img.SimplePos)
			{
				this.memory.WriteByte(c_oSerImageType2.SimplePos);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteSimplePos(img.SimplePos);});
			}
			if(null != img.SizeRelH)
			{
				 this.memory.WriteByte(c_oSerImageType2.SizeRelH);
				 this.memory.WriteByte(c_oSerPropLenType.Variable);
				 this.bs.WriteItemWithLength(function(){oThis.WriteSizeRelHV(img.SizeRelH);});
			}
			if(null != img.SizeRelV)
			{
				this.memory.WriteByte(c_oSerImageType2.SizeRelV);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteSizeRelHV(img.SizeRelV);});
			}
			switch(img.wrappingType)
			{
				case WRAPPING_TYPE_NONE:
					this.memory.WriteByte(c_oSerImageType2.WrapNone);
					this.memory.WriteByte(c_oSerPropLenType.Null);
					break;
				case WRAPPING_TYPE_SQUARE:
					this.memory.WriteByte(c_oSerImageType2.WrapSquare);
					this.memory.WriteByte(c_oSerPropLenType.Null);
					break;
				case WRAPPING_TYPE_THROUGH:
					this.memory.WriteByte(c_oSerImageType2.WrapThrough);
					this.memory.WriteByte(c_oSerPropLenType.Variable);
					this.bs.WriteItemWithLength(function(){oThis.WriteWrapThroughTight(img.wrappingPolygon, img.getWrapContour());});
					break;
				case WRAPPING_TYPE_TIGHT:
					this.memory.WriteByte(c_oSerImageType2.WrapTight);
					this.memory.WriteByte(c_oSerPropLenType.Variable);
					this.bs.WriteItemWithLength(function(){oThis.WriteWrapThroughTight(img.wrappingPolygon, img.getWrapContour());});
					break;
				case WRAPPING_TYPE_TOP_AND_BOTTOM:
					this.memory.WriteByte(c_oSerImageType2.WrapTopAndBottom);
					this.memory.WriteByte(c_oSerPropLenType.Null);
					break;
			}
			if (null != img.GraphicObj.locks) {
				this.memory.WriteByte(c_oSerImageType2.GraphicFramePr);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteGraphicFramePr(img.GraphicObj.locks);});
			}
			if (null != img.docPr) {
				this.memory.WriteByte(c_oSerImageType2.DocPr);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteDocPr(img.docPr);});
			}
			if(null != img.GraphicObj.chart)
			{
				this.memory.WriteByte(c_oSerImageType2.Chart2);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				var oBinaryChartWriter = new AscCommon.BinaryChartWriter(this.memory);
				this.bs.WriteItemWithLength(function () { oBinaryChartWriter.WriteCT_ChartSpace(img.GraphicObj); });
			} else {
				this.WriteGraphicObj(img.GraphicObj);
			}
		}
		if(this.saveParams && this.saveParams.bMailMergeHtml)
		{
			this.memory.WriteByte(c_oSerImageType2.CachedImage);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.memory.WriteString2(img.getBase64Img());
		}
    };
	this.WriteGraphicFramePr = function(locks)
	{
		if (locks & AscFormat.LOCKS_MASKS.noChangeAspect) {
			this.memory.WriteByte(c_oSerGraphicFramePr.NoChangeAspect);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(!!(locks & AscFormat.LOCKS_MASKS.noChangeAspect << 1));
		}
		if (locks & AscFormat.LOCKS_MASKS.noDrilldown) {
			this.memory.WriteByte(c_oSerGraphicFramePr.NoDrilldown);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(!!(locks & AscFormat.LOCKS_MASKS.noDrilldown << 1));
		}
		if (locks & AscFormat.LOCKS_MASKS.noGrp) {
			this.memory.WriteByte(c_oSerGraphicFramePr.NoGrp);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(!!(locks & AscFormat.LOCKS_MASKS.noGrp << 1));
		}
		if (locks & AscFormat.LOCKS_MASKS.noMove) {
			this.memory.WriteByte(c_oSerGraphicFramePr.NoMove);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(!!(locks & AscFormat.LOCKS_MASKS.noMove << 1));
		}
		if (locks & AscFormat.LOCKS_MASKS.noResize) {
			this.memory.WriteByte(c_oSerGraphicFramePr.NoResize);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(!!(locks & AscFormat.LOCKS_MASKS.noResize << 1));
		}
		if (locks & AscFormat.LOCKS_MASKS.noSelect) {
			this.memory.WriteByte(c_oSerGraphicFramePr.NoSelect);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteBool(!!(locks & AscFormat.LOCKS_MASKS.noSelect << 1));
		}
	}
	this.WriteDocPr = function(docPr)
	{
		var oThis = this;
		this.bs.WriteItem(c_oSerDocPr.Id, function(){oThis.memory.WriteLong(oThis.saveParams.docPrId++);});
		if (null != docPr.name) {
			this.memory.WriteByte(c_oSerDocPr.Name);
			this.memory.WriteString2(docPr.name);
		}
		if (null != docPr.isHidden) {
			this.bs.WriteItem(c_oSerDocPr.Hidden, function(){oThis.memory.WriteBool(docPr.isHidden);});
		}
		if (null != docPr.title) {
			this.memory.WriteByte(c_oSerDocPr.Title);
			this.memory.WriteString2(docPr.title);
		}
		if (null != docPr.descr) {
			this.memory.WriteByte(c_oSerDocPr.Descr);
			this.memory.WriteString2(docPr.descr);
		}
	}
	this.WriteEffectExtent = function(EffectExtent)
	{
		if(null != EffectExtent.L)
		{
			this.memory.WriteByte(c_oSerEffectExtent.LeftEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToEmu(EffectExtent.L);
		}
		if(null != EffectExtent.T)
		{
			this.memory.WriteByte(c_oSerEffectExtent.TopEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToEmu(EffectExtent.T);
		}
		if(null != EffectExtent.R)
		{
			this.memory.WriteByte(c_oSerEffectExtent.RightEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToEmu(EffectExtent.R);
		}
		if(null != EffectExtent.B)
		{
			this.memory.WriteByte(c_oSerEffectExtent.BottomEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToEmu(EffectExtent.B);
		}
	}
	this.WriteExtent = function(Extent)
	{
		if(null != Extent.W)
		{
			this.memory.WriteByte(c_oSerExtent.CxEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToUEmu(Extent.W);
		}
		if(null != Extent.H)
		{
			this.memory.WriteByte(c_oSerExtent.CyEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToUEmu(Extent.H);
		}
	}
	this.WritePositionHV = function(PositionH)
	{
		if(null != PositionH.RelativeFrom)
		{
			this.memory.WriteByte(c_oSerPosHV.RelativeFrom);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(PositionH.RelativeFrom);
		}
		if(true == PositionH.Align)
		{
			this.memory.WriteByte(c_oSerPosHV.Align);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(PositionH.Value);
		}
		else
		{
			if (true == PositionH.Percent) {
				this.memory.WriteByte(c_oSerPosHV.PctOffset);
				this.memory.WriteByte(c_oSerPropLenType.Double);
				this.memory.WriteDouble(PositionH.Value);
			} else {
				this.memory.WriteByte(c_oSerPosHV.PosOffsetEmu);
				this.memory.WriteByte(c_oSerPropLenType.Long);
				this.bs.writeMmToEmu(PositionH.Value);
			}
		}
	}
	this.WriteSizeRelHV = function(SizeRelHV)
	{
		if(null != SizeRelHV.RelativeFrom) {
			this.memory.WriteByte(c_oSerSizeRelHV.RelativeFrom);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(SizeRelHV.RelativeFrom);
		}
		if (null != SizeRelHV.Percent) {
			this.memory.WriteByte(c_oSerSizeRelHV.Pct);
			this.memory.WriteByte(c_oSerPropLenType.Double);
			this.memory.WriteDouble((SizeRelHV.Percent*100) >> 0);
		}
	}
	this.WriteSimplePos = function(oSimplePos)
	{
		if(null != oSimplePos.X)
		{
			this.memory.WriteByte(c_oSerSimplePos.XEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToEmu(oSimplePos.X);
		}
		if(null != oSimplePos.Y)
		{
			this.memory.WriteByte(c_oSerSimplePos.YEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToEmu(oSimplePos.Y);
		}
	}
	this.WriteWrapThroughTight = function(wrappingPolygon, Contour)
	{
		var oThis = this;
		this.memory.WriteByte(c_oSerWrapThroughTight.WrapPolygon);
		this.memory.WriteByte(c_oSerPropLenType.Variable);
		this.bs.WriteItemWithLength(function(){oThis.WriteWrapPolygon(wrappingPolygon, Contour)});
	}
	this.WriteWrapPolygon = function(wrappingPolygon, Contour)
	{
		var oThis = this;
		//всегда пишем Edited == true потому что наш контур отличается от word.
		this.memory.WriteByte(c_oSerWrapPolygon.Edited);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(true);
		if(Contour.length > 0)
		{
			this.memory.WriteByte(c_oSerWrapPolygon.Start);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){oThis.WritePolygonPoint(Contour[0]);});
			
			if(Contour.length > 1)
			{
				this.memory.WriteByte(c_oSerWrapPolygon.ALineTo);
				this.memory.WriteByte(c_oSerPropLenType.Variable);
				this.bs.WriteItemWithLength(function(){oThis.WriteLineTo(Contour);});
			}
		}
	}
	this.WriteLineTo = function(Contour)
	{
		var oThis = this;
		for(var i = 1, length = Contour.length; i < length; ++i)
		{
			this.memory.WriteByte(c_oSerWrapPolygon.LineTo);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){oThis.WritePolygonPoint(Contour[i]);});
		}
	}
	this.WritePolygonPoint = function(oPoint)
	{
		if(null != oPoint.x)
		{
			this.memory.WriteByte(c_oSerPoint2D.XEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToEmu(oPoint.x);
		}
		if(null != oPoint.y)
		{
			this.memory.WriteByte(c_oSerPoint2D.YEmu);
			this.memory.WriteByte(c_oSerPropLenType.Long);
			this.bs.writeMmToEmu(oPoint.y);
		}
	}
	this.WriteDocTable = function(table, aRowElems, nMinGrid, nMaxGrid)
    {
        var oThis = this;
		if(null != this.copyParams)
		{
			//анализируем используемые списки и стили
			var sTableStyle = table.Get_TableStyle();
			if(null != sTableStyle)
				this.copyParams.oUsedStyleMap[sTableStyle] = 1;
		}
        //tblPr
        //tblPr должна идти раньше Content
        if(null != table.Pr)
            this.bs.WriteItem(c_oSerDocTableType.tblPr, function(){oThis.btblPrs.WriteTbl(table);});
        //tblGrid
        if(null != table.TableGrid)
		{
			var aGrid = table.TableGrid;
			if(null != nMinGrid && null != nMaxGrid && 0 != nMinGrid && aGrid.length - 1 != nMaxGrid)
				aGrid = aGrid.slice( nMinGrid, nMaxGrid + 1);
            this.bs.WriteItem(c_oSerDocTableType.tblGrid, function(){oThis.WriteTblGrid(aGrid, table.TableGridChange);});
		}
        //Content
        if(null != table.Content && table.Content.length > 0)
            this.bs.WriteItem(c_oSerDocTableType.Content, function(){oThis.WriteTableContent(table.Content, aRowElems);});
    };
    this.WriteTblGrid = function(grid, tableGridChange)
    {
        var oThis = this;
        for(var i = 0, length = grid.length; i < length; i++)
        {
            this.memory.WriteByte(c_oSerDocTableType.tblGrid_ItemTwips);
            this.memory.WriteByte(c_oSerPropLenType.Long);
            this.bs.writeMmToTwips(grid[i]);
        }
		if (tableGridChange) {
			this.memory.WriteByte(c_oSerDocTableType.tblGridChange);
			this.memory.WriteByte(c_oSerPropLenType.Variable);
			this.bs.WriteItemWithLength(function(){WriteTrackRevision(oThis.bs, oThis.saveParams.trackRevisionId++, undefined, {btw: oThis, grid: tableGridChange});});
		}
    };
    this.WriteTableContent = function(Content, aRowElems)
    {
        var oThis = this;
		var nStart = 0;
		var nEnd = Content.length - 1;
		if(null != aRowElems && aRowElems.length > 0)
		{
			nStart = aRowElems[0].row;
			nEnd = aRowElems[aRowElems.length - 1].row;
		}
        for(var i = nStart; i <= nEnd && i < Content.length; ++i)
		{
			var oRowElem = null;
			if(null != aRowElems)
				oRowElem = aRowElems[i - nStart];
            this.bs.WriteItem(c_oSerDocTableType.Row, function(){oThis.WriteRow(Content[i], i, oRowElem);});
		}
    };
    this.WriteRow = function(Row, nRowIndex, oRowElem)
    {
        var oThis = this;
        //Pr
        if(null != Row.Pr)
        {
			var oRowPr = Row.Pr;
			if(null != oRowElem)
			{
				oRowPr = oRowPr.Copy();
				oRowPr.WAfter = null;
				oRowPr.WBefore = null;
				if(null != oRowElem.after)
					oRowPr.GridAfter = oRowElem.after;
				else
					oRowPr.GridAfter = null;
				if(null != oRowElem.before)
					oRowPr.GridBefore = oRowElem.before;
				else
					oRowPr.GridBefore = null;
			}
            this.bs.WriteItem(c_oSerDocTableType.Row_Pr, function(){oThis.btblPrs.WriteRowPr(oRowPr, Row);});
        }
        //Content
        if(null != Row.Content)
        {
            this.bs.WriteItem(c_oSerDocTableType.Row_Content, function(){oThis.WriteRowContent(Row.Content, nRowIndex, oRowElem);});
        }
    };
    this.WriteRowContent = function(Content, nRowIndex, oRowElem)
    {
        var oThis = this;
		var nStart = 0;
		var nEnd = Content.length - 1;
		if(null != oRowElem)
		{
			nStart = oRowElem.indexStart;
			nEnd = oRowElem.indexEnd;
		}
        for(var i = nStart; i <= nEnd && i < Content.length; i++)
        {
            this.bs.WriteItem(c_oSerDocTableType.Cell, function(){oThis.WriteCell(Content[i], nRowIndex, i);});
        }
    };
    this.WriteCell = function(cell, nRowIndex, nColIndex)
    {
        var oThis = this;
        //Pr
        if(null != cell.Pr)
        {
			var vMerge = null;
			if(vmerge_Continue != cell.Pr.VMerge)
			{
				var row = cell.Row;
				var table = row.Table;
				var oCellInfo = row.Get_CellInfo( nColIndex );
				var StartGridCol = 0;
				if(null != oCellInfo)
					StartGridCol = oCellInfo.StartGridCol;
				else
				{
					var BeforeInfo = row.Get_Before();
					StartGridCol = BeforeInfo.GridBefore;
					for(var i = 0; i < nColIndex; ++i)
					{
						var cellTemp = row.Get_Cell( i );
						StartGridCol += cellTemp.Get_GridSpan();
					}
				}
				if(table.Internal_GetVertMergeCount( nRowIndex, StartGridCol, cell.Get_GridSpan() ) > 1)
					vMerge = vmerge_Restart;
			}
			this.bs.WriteItem(c_oSerDocTableType.Cell_Pr, function(){oThis.btblPrs.WriteCellPr(cell.Pr, vMerge, cell);});
        }
        //Content
        if(null != cell.Content)
        {
            var oInnerDocument = new BinaryDocumentTableWriter(this.memory, this.Document, this.oMapCommentId, this.oNumIdMap, this.copyParams, this.saveParams, this.oBinaryHeaderFooterTableWriter);
            this.bs.WriteItem(c_oSerDocTableType.Cell_Content, function(){oInnerDocument.WriteDocumentContent(cell.Content);});
        }
    };
	this.WriteObject = function (obj)
    {
        var oThis = this;
		
		oThis.bs.WriteItem(c_oSerParType.OMath, function(){oThis.boMaths.WriteArgNodes(obj.ParaMath.Root);});
		oThis.bs.WriteItem(c_oSerRunType.pptxDrawing, function () { oThis.WriteImage(obj); });
	};
	this.WriteSdt = function (oSdt, type)
	{
		var oThis = this;
		if (oSdt.Pr) {
			oThis.bs.WriteItem(c_oSerSdt.Pr, function () { oThis.WriteSdtPr(oSdt.Pr, oSdt); });
		}
		// if (oSdt.EndPr) {
		// 	this.bs.WriteItem(c_oSerSdt.EndPr, function(){oThis.brPrs.Write_rPr(oSdt.EndPr, null, null);});
		// }
		if (0 === type) {
			var oInnerDocument = new BinaryDocumentTableWriter(this.memory, this.Document, this.oMapCommentId, this.oNumIdMap, this.copyParams, this.saveParams, this.oBinaryHeaderFooterTableWriter);
			this.bs.WriteItem(c_oSerSdt.Content, function(){oInnerDocument.WriteDocumentContent(oSdt.Content);});
		} else if (1 === type) {
			this.bs.WriteItem(c_oSerSdt.Content, function(){oThis.WriteParagraphContent(oSdt, false, false);});
		}
	};
	this.WriteSdtPr = function (val, oSdt)
	{
		var oThis = this;
		var type;
		if (null != val.Alias) {
			this.memory.WriteByte(c_oSerSdt.Alias);
			this.memory.WriteString2(val.Alias);
		}
		if (null != val.Appearance) {
			oThis.bs.WriteItem(c_oSerSdt.Appearance, function (){oThis.memory.WriteByte(val.Appearance);});
		}
		if (null != val.Color) {
			var rPr = new CTextPr();
			rPr.Color = val.Color;
			oThis.bs.WriteItem(c_oSerSdt.Color, function (){oThis.brPrs.Write_rPr(rPr, null, null);});
		}
		// if (null != val.DataBinding) {
		// 	oThis.bs.WriteItem(c_oSerSdt.DataBinding, function (){oThis.WriteSdtPrDataBinding(val.DataBinding);});
		// }
		// if (null != val.DocPartList) {
		// 	oThis.bs.WriteItem(c_oSerSdt.DocPartList, function (){oThis.WriteDocPartList(val.DocPartList);});
		// }
		if (null != val.Id) {
			oThis.bs.WriteItem(c_oSerSdt.Id, function (){oThis.memory.WriteLong(val.Id);});
		}
		if (null != val.Label) {
			oThis.bs.WriteItem(c_oSerSdt.Label, function (){oThis.memory.WriteLong(val.Label);});
		}
		if (null != val.Lock) {
			oThis.bs.WriteItem(c_oSerSdt.Lock, function (){oThis.memory.WriteByte(val.Lock);});
		}
		// if (null != val.PlaceHolder) {
		// 	this.memory.WriteByte(c_oSerSdt.PlaceHolder);
		// 	this.memory.WriteString2(val.PlaceHolder);
		// }
		var rPr = oSdt.GetDefaultTextPr();
		if (rPr) {
			this.bs.WriteItem(c_oSerSdt.RPr, function(){oThis.brPrs.Write_rPr(rPr, null, null);});
		}
		// if (null != val.ShowingPlcHdr) {
		// 	oThis.bs.WriteItem(c_oSerSdt.ShowingPlcHdr, function (){oThis.memory.WriteBool(val.ShowingPlcHdr);});
		// }
		// if (null != val.TabIndex) {
		// 	oThis.bs.WriteItem(c_oSerSdt.TabIndex, function (){oThis.memory.WriteLong(val.TabIndex);});
		// }
		if (null != val.Tag) {
			this.memory.WriteByte(c_oSerSdt.Tag);
			this.memory.WriteString2(val.Tag);
		}
		// if (null != val.Temporary) {
		// 	oThis.bs.WriteItem(c_oSerSdt.Temporary, function (){oThis.memory.WriteBool(val.Temporary);});
		// }
		// if (null != val.MultiLine) {
		// 	oThis.bs.WriteItem(c_oSerSdt.MultiLine, function (){oThis.memory.WriteBool(val.MultiLine);});
		// }
		if (oSdt.IsComboBox()) {
			type = ESdtType.sdttypeComboBox;
			oThis.bs.WriteItem(c_oSerSdt.ComboBox, function (){oThis.WriteSdtComboBox(oSdt.GetComboBoxPr());});
		} else if (oSdt.IsPicture()) {
			type = ESdtType.sdttypePicture;
		} else if (val.IsBuiltInDocPart()) {
			type = ESdtType.sdttypeDocPartObj;
			oThis.bs.WriteItem(c_oSerSdt.DocPartObj, function (){oThis.WriteDocPartList(val.DocPartObj);});
		} else if (oSdt.IsDropDownList()) {
			type = ESdtType.sdttypeDropDownList;
			oThis.bs.WriteItem(c_oSerSdt.DropDownList, function (){oThis.WriteSdtComboBox(oSdt.GetDropDownListPr());});
		} else if (oSdt.IsDatePicker()) {
			type = ESdtType.sdttypeDate;
			oThis.bs.WriteItem(c_oSerSdt.PrDate, function (){oThis.WriteSdtPrDate(oSdt.GetDatePickerPr());});
		} else if (undefined !== val.CheckBox) {
			type = ESdtType.sdttypeCheckBox;
			oThis.bs.WriteItem(c_oSerSdt.Checkbox, function (){oThis.WriteSdtCheckBox(val.CheckBox);});
		}
		if (undefined !== type) {
			oThis.bs.WriteItem(c_oSerSdt.Type, function (){oThis.memory.WriteByte(type);});
		}
	};
	this.WriteSdtCheckBox = function (val)
	{
		var oThis = this;
		if (null != val.Checked) {
			oThis.bs.WriteItem(c_oSerSdt.CheckboxChecked, function (){oThis.memory.WriteBool(val.Checked);});
		}
		if (null != val.CheckedFont) {
			oThis.bs.WriteItem(c_oSerSdt.CheckboxCheckedFont, function (){oThis.memory.WriteString3(val.CheckedFont);});
		}
		if (null != val.CheckedSymbol) {
			oThis.bs.WriteItem(c_oSerSdt.CheckboxCheckedVal, function (){oThis.memory.WriteLong(val.CheckedSymbol);});
		}
		if (null != val.UncheckedFont) {
			oThis.bs.WriteItem(c_oSerSdt.CheckboxUncheckedFont, function (){oThis.memory.WriteString3(val.UncheckedFont);});
		}
		if (null != val.UncheckedSymbol) {
			oThis.bs.WriteItem(c_oSerSdt.CheckboxUncheckedVal, function (){oThis.memory.WriteLong(val.UncheckedSymbol);});
		}
	};
	this.WriteSdtComboBox = function (val)
	{
		var oThis = this;
		// if (null != val.LastValue) {
		// 	this.memory.WriteByte(c_oSerSdt.LastValue);
		// 	this.memory.WriteString2(val.LastValue);
		// }
		if (null != val.ListItems) {
			for(var  i = 0 ; i < val.ListItems.length; ++i){
				oThis.bs.WriteItem(c_oSerSdt.SdtListItem, function (){oThis.WriteSdtListItem(val.ListItems[i]);});
			}
		}
	};
	this.WriteSdtListItem = function (val)
	{
		var oThis = this;
		if (null != val.DisplayText && "" !== val.DisplayText) {
			this.memory.WriteByte(c_oSerSdt.DisplayText);
			this.memory.WriteString2(val.DisplayText);
		}
		if (null != val.Value) {
			this.memory.WriteByte(c_oSerSdt.Value);
			this.memory.WriteString2(val.Value);
		}
	};
	this.WriteSdtPrDataBinding = function (val)
	{
		var oThis = this;
		if (null != val.PrefixMappings) {
			this.memory.WriteByte(c_oSerSdt.PrefixMappings);
			this.memory.WriteString2(val.PrefixMappings);
		}
		if (null != val.StoreItemID) {
			this.memory.WriteByte(c_oSerSdt.StoreItemID);
			this.memory.WriteString2(val.StoreItemID);
		}
		if (null != val.XPath) {
			this.memory.WriteByte(c_oSerSdt.XPath);
			this.memory.WriteString2(val.XPath);
		}
	};
	this.WriteSdtPrDate = function (val)
	{
		var oThis = this;
		if (null != val.FullDate) {
			this.memory.WriteByte(c_oSerSdt.FullDate);
			this.memory.WriteString2(val.FullDate);
		}
		if (null != val.Calendar) {
			oThis.bs.WriteItem(c_oSerSdt.Calendar, function (){oThis.memory.WriteByte(val.Calendar);});
		}
		if (null != val.DateFormat) {
			this.memory.WriteByte(c_oSerSdt.DateFormat);
			this.memory.WriteString2(val.DateFormat);
		}
		var lid = Asc.g_oLcidIdToNameMap[val.LangId];
		if (lid) {
			this.memory.WriteByte(c_oSerSdt.Lid);
			this.memory.WriteString2(lid);
		}
		// if (null != val.StoreMappedDataAs) {
		// 	oThis.bs.WriteItem(c_oSerSdt.StoreMappedDataAs, function (){oThis.memory.WriteByte(val.StoreMappedDataAs);});
		// }
	};
	this.WriteDocPartList = function (val)
	{
		var oThis = this;
		if (null != val.Category) {
			this.memory.WriteByte(c_oSerSdt.DocPartCategory);
			this.memory.WriteString2(val.Category);
		}
		if (null != val.Gallery) {
			this.memory.WriteByte(c_oSerSdt.DocPartGallery);
			this.memory.WriteString2(val.Gallery);
		}
		if (null != val.Unique) {
			oThis.bs.WriteItem(c_oSerSdt.DocPartUnique, function (){oThis.memory.WriteBool(val.Unique);});
		}
	};
};
function BinaryOtherTableWriter(memory, doc)
{
    this.memory = memory;
    this.Document = doc;
    this.bs = new BinaryCommonWriter(this.memory);
    this.Write = function()
    {
        var oThis = this;
        this.bs.WriteItemWithLength(function(){oThis.WriteOtherContent();});
    };
    this.WriteOtherContent = function()
    {
        var oThis = this;
        //delete ImageMap
		//DocxTheme
		this.bs.WriteItem(c_oSerOtherTableTypes.DocxTheme, function(){pptx_content_writer.WriteTheme(oThis.memory, oThis.Document.theme);});
    };
};
function BinaryCommentsTableWriter(memory, doc, oMapCommentId, commentUniqueGuids, isDocument)
{
    this.memory = memory;
    this.Document = doc;
    this.oMapCommentId = oMapCommentId;
	this.commentUniqueGuids = commentUniqueGuids;
	this.isDocument = isDocument;
    this.bs = new BinaryCommonWriter(this.memory);
    this.Write = function()
    {
        var oThis = this;
        this.bs.WriteItemWithLength(function(){oThis.WriteComments();});
    };
    this.WriteComments = function()
    {
        var oThis = this;
		var nIndex = 0;
        for(var i in this.Document.Comments.m_aComments)
		{
			var oComment = this.Document.Comments.m_aComments[i];
			if (this.isDocument === oComment.IsGlobalComment()) {
				this.bs.WriteItem(c_oSer_CommentsType.Comment, function () { oThis.WriteComment(oComment.Data, oComment.Id, nIndex++); });
			}

		}
    };
    this.WriteComment = function(comment, sCommentId, nFileId)
    {
		var oThis = this;
        if(null != sCommentId && null != nFileId)
		{
			this.oMapCommentId[sCommentId] = nFileId;
			this.bs.WriteItem(c_oSer_CommentsType.Id, function(){oThis.memory.WriteLong(nFileId);});
		}
		if(null != comment.m_sUserName && "" != comment.m_sUserName)
		{
			this.memory.WriteByte(c_oSer_CommentsType.UserName);
			this.memory.WriteString2(comment.m_sUserName);
		}
		if(null != comment.m_sInitials && "" != comment.m_sInitials)
		{
			this.memory.WriteByte(c_oSer_CommentsType.Initials);
			this.memory.WriteString2(comment.m_sInitials);
		}
		if(null != comment.m_sUserId && "" != comment.m_sUserId && null != comment.m_sProviderId && "" != comment.m_sProviderId)
		{
			this.memory.WriteByte(c_oSer_CommentsType.UserId);
			this.memory.WriteString2(comment.m_sUserId);

			this.memory.WriteByte(c_oSer_CommentsType.ProviderId);
			this.memory.WriteString2(comment.m_sProviderId);
		}
		if(null != comment.m_sTime && "" != comment.m_sTime)
		{
			var dateStr = new Date(comment.m_sTime - 0).toISOString().slice(0, 19) + 'Z';
			this.memory.WriteByte(c_oSer_CommentsType.Date);
			this.memory.WriteString2(dateStr);
		}
		if(null != comment.m_bSolved)
		{
			this.bs.WriteItem(c_oSer_CommentsType.Solved, function(){oThis.memory.WriteBool(comment.m_bSolved);});
		}
		if(null != comment.m_nDurableId)
		{
			while (this.commentUniqueGuids[comment.m_nDurableId]) {
				comment.m_nDurableId = AscCommon.CreateUInt32();
			}
			this.commentUniqueGuids[comment.m_nDurableId] = 1;
			this.bs.WriteItem(c_oSer_CommentsType.DurableId, function(){oThis.memory.WriteULong(comment.m_nDurableId);});
		}
		if(null != comment.m_sText && "" != comment.m_sText)
		{
			this.memory.WriteByte(c_oSer_CommentsType.Text);
			this.memory.WriteString2(comment.m_sText);
		}
		if(null != comment.m_aReplies && comment.m_aReplies.length > 0)
		{
			this.bs.WriteItem(c_oSer_CommentsType.Replies, function(){oThis.WriteReplies(comment.m_aReplies);});
		}
		var dataStr = getCommentAdditionalData(comment);
		if (dataStr)
		{
			this.memory.WriteByte(c_oSer_CommentsType.OOData);
			this.memory.WriteString2(dataStr);
		}
    };
	this.WriteReplies = function(aComments)
	{
        var oThis = this;
		var nIndex = 0;
        for(var i  = 0, length = aComments.length;  i < length; ++i)
            this.bs.WriteItem(c_oSer_CommentsType.Comment, function(){oThis.WriteComment(aComments[i]);});
	}
};
function BinarySettingsTableWriter(memory, doc, saveParams)
{
    this.memory = memory;
    this.Document = doc;
	this.saveParams = saveParams;
    this.bs = new BinaryCommonWriter(this.memory);
	this.bpPrs = new Binary_pPrWriter(this.memory, null, null, saveParams);
	this.brPrs = new Binary_rPrWriter(this.memory, saveParams);
    this.Write = function()
    {
        var oThis = this;
        this.bs.WriteItemWithLength(function(){oThis.WriteSettings();});
    }
    this.WriteSettings = function()
    {
        var oThis = this;
		this.bs.WriteItem(c_oSer_SettingsType.ClrSchemeMapping, function(){oThis.WriteColorSchemeMapping();});
		this.bs.WriteItem(c_oSer_SettingsType.DefaultTabStopTwips, function(){oThis.bs.writeMmToTwips(AscCommonWord.Default_Tab_Stop);});
		this.bs.WriteItem(c_oSer_SettingsType.MathPr, function(){oThis.WriteMathPr();});
		this.bs.WriteItem(c_oSer_SettingsType.TrackRevisions, function(){oThis.memory.WriteBool(oThis.Document.IsTrackRevisions());});
		this.bs.WriteItem(c_oSer_SettingsType.FootnotePr, function(){oThis.WriteFootnotePr();});
		if (oThis.Document.Settings && oThis.Document.Settings.DecimalSymbol) {
			this.bs.WriteItem(c_oSer_SettingsType.DecimalSymbol, function() {oThis.memory.WriteString3(oThis.Document.Settings.DecimalSymbol);});
		}
		if (oThis.Document.Settings && oThis.Document.Settings.ListSeparator) {
			this.bs.WriteItem(c_oSer_SettingsType.ListSeparator, function() {oThis.memory.WriteString3(oThis.Document.Settings.ListSeparator);});
		}
		if (oThis.Document.IsGutterAtTop()) {
			this.bs.WriteItem(c_oSer_SettingsType.GutterAtTop, function() {oThis.memory.WriteBool(true);});
		}
		if (oThis.Document.IsMirrorMargins()) {
			this.bs.WriteItem(c_oSer_SettingsType.MirrorMargins, function() {oThis.memory.WriteBool(true);});
		}
		// if (oThis.Document.Settings && null != oThis.Document.Settings.PrintTwoOnOne) {
		// 	this.bs.WriteItem(c_oSer_SettingsType.PrintTwoOnOne, function() {oThis.memory.WriteBool(oThis.Document.Settings.PrintTwoOnOne);});
		// }
		// if (oThis.Document.Settings && null != oThis.Document.Settings.BookFoldPrinting) {
		// 	this.bs.WriteItem(c_oSer_SettingsType.BookFoldPrinting, function() {oThis.memory.WriteBool(oThis.Document.Settings.BookFoldPrinting);});
		// }
		// if (oThis.Document.Settings && null != oThis.Document.Settings.BookFoldPrintingSheets) {
		// 	this.bs.WriteItem(c_oSer_SettingsType.BookFoldPrintingSheets, function() {oThis.memory.WriteLong(oThis.Document.Settings.BookFoldPrintingSheets);});
		// }
		// if (oThis.Document.Settings && null != oThis.Document.Settings.BookFoldRevPrinting) {
		// 	this.bs.WriteItem(c_oSer_SettingsType.BookFoldRevPrinting, function() {oThis.memory.WriteBool(oThis.Document.Settings.BookFoldRevPrinting);});
		// }
		if (!oThis.Document.IsSdtGlobalSettingsDefault()) {
			var rPr = new CTextPr();
			rPr.Color = oThis.Document.GetSdtGlobalColor();
			this.bs.WriteItem(c_oSer_SettingsType.SdtGlobalColor, function (){oThis.brPrs.Write_rPr(rPr, null, null);});
			this.bs.WriteItem(c_oSer_SettingsType.SdtGlobalShowHighlight, function(){oThis.memory.WriteBool(oThis.Document.GetSdtGlobalShowHighlight());});
		}
		this.bs.WriteItem(c_oSer_SettingsType.Compat, function (){oThis.WriteCompat();});
    }
	this.WriteCompat = function()
	{
		var oThis = this;
		var compatibilityMode =  false === this.saveParams.isCompatible ? document_compatibility_mode_Word15 : oThis.Document.GetCompatibilityMode();
		this.bs.WriteItem(c_oSerCompat.CompatSetting, function() {oThis.WriteCompatSetting("compatibilityMode", "http://schemas.microsoft.com/office/word", compatibilityMode.toString());});
		this.bs.WriteItem(c_oSerCompat.CompatSetting, function() {oThis.WriteCompatSetting("overrideTableStyleFontSizeAndJustification", "http://schemas.microsoft.com/office/word", "1");});
		this.bs.WriteItem(c_oSerCompat.CompatSetting, function() {oThis.WriteCompatSetting("enableOpenTypeFeatures", "http://schemas.microsoft.com/office/word", "1");});
		this.bs.WriteItem(c_oSerCompat.CompatSetting, function() {oThis.WriteCompatSetting("doNotFlipMirrorIndents", "http://schemas.microsoft.com/office/word", "1");});
		var flags1 = 0;
		if (this.saveParams.isCompatible) {
			flags1 |= (oThis.Document.IsDoNotExpandShiftReturn() ? 1 : 0) << 10;
		}
		this.bs.WriteItem(c_oSerCompat.Flags1, function() {oThis.memory.WriteULong(flags1);});
		var flags2 = 0;
		if (this.saveParams.isCompatible) {
			flags2 |= (oThis.Document.IsSplitPageBreakAndParaMark() ? 1 : 0) << 27;
		}
		this.bs.WriteItem(c_oSerCompat.Flags2, function() {oThis.memory.WriteULong(flags2);});
	};
	this.WriteCompatSetting = function(name, uri, value)
	{
		var oThis = this;
		this.bs.WriteItem(c_oSerCompat.CompatName, function() {oThis.memory.WriteString3(name);});
		this.bs.WriteItem(c_oSerCompat.CompatUri, function() {oThis.memory.WriteString3(uri);});
		this.bs.WriteItem(c_oSerCompat.CompatValue, function() {oThis.memory.WriteString3(value);});
	};
	this.WriteFootnotePr = function()
	{
		var oThis = this;
		this.bpPrs.WriteFootnotePr(this.Document.Footnotes.FootnotePr);
		var index = -1;
		if (this.Document.Footnotes.SeparatorFootnote) {
			this.saveParams.footnotes[index] = {type: 3, content: this.Document.Footnotes.SeparatorFootnote};
			this.bs.WriteItem(c_oSerNotes.PrRef, function() {oThis.memory.WriteLong(index);});
			index++
		}
		if (this.Document.Footnotes.ContinuationSeparatorFootnote) {
			this.saveParams.footnotes[index] = {type: 1, content: this.Document.Footnotes.ContinuationSeparatorFootnote};
			this.bs.WriteItem(c_oSerNotes.PrRef, function() {oThis.memory.WriteLong(index);});
			index++
		}
		if (this.Document.Footnotes.ContinuationNoticeFootnote) {
			this.saveParams.footnotes[index] = {type: 0, content: this.Document.Footnotes.ContinuationNoticeFootnote};
			this.bs.WriteItem(c_oSerNotes.PrRef, function() {oThis.memory.WriteLong(index);});
			index++
		}
		if (index > this.saveParams.footnotesIndex) {
			this.saveParams.footnotesIndex = index;
		}
	}
	this.WriteMathPr = function()
	{
		var oThis = this;
		var oMathPr = editor.WordControl.m_oLogicDocument.Settings.MathSettings.GetPr();
		if ( null != oMathPr.brkBin)
			this.bs.WriteItem(c_oSer_MathPrType.BrkBin, function(){oThis.WriteMathBrkBin(oMathPr.brkBin);});
		if ( null != oMathPr.brkBinSub)
			this.bs.WriteItem(c_oSer_MathPrType.BrkBinSub, function(){oThis.WriteMathBrkBinSub(oMathPr.brkBinSub);});
		if ( null != oMathPr.defJc)
			this.bs.WriteItem(c_oSer_MathPrType.DefJc, function(){oThis.WriteMathDefJc(oMathPr.defJc);});
		if ( null != oMathPr.dispDef)
			this.bs.WriteItem(c_oSer_MathPrType.DispDef, function(){oThis.WriteMathDispDef(oMathPr.dispDef);});
		if ( null != oMathPr.interSp)
			this.bs.WriteItem(c_oSer_MathPrType.InterSp, function(){oThis.WriteMathInterSp(oMathPr.interSp);});
		if ( null != oMathPr.intLim)
			this.bs.WriteItem(c_oSer_MathPrType.IntLim, function(){oThis.WriteMathIntLim(oMathPr.intLim);});
		if ( null != oMathPr.intraSp)
			this.bs.WriteItem(c_oSer_MathPrType.IntraSp, function(){oThis.WriteMathIntraSp(oMathPr.intraSp);});	
		if ( null != oMathPr.lMargin)
			this.bs.WriteItem(c_oSer_MathPrType.LMargin, function(){oThis.WriteMathLMargin(oMathPr.lMargin);});	
		if ( null != oMathPr.mathFont)
			this.bs.WriteItem(c_oSer_MathPrType.MathFont, function(){oThis.WriteMathMathFont(oMathPr.mathFont);});	
		if ( null != oMathPr.naryLim)
			this.bs.WriteItem(c_oSer_MathPrType.NaryLim, function(){oThis.WriteMathNaryLim(oMathPr.naryLim);});	
		if ( null != oMathPr.postSp)
			this.bs.WriteItem(c_oSer_MathPrType.PostSp, function(){oThis.WriteMathPostSp(oMathPr.postSp);});	
		if ( null != oMathPr.preSp)
			this.bs.WriteItem(c_oSer_MathPrType.PreSp, function(){oThis.WriteMathPreSp(oMathPr.preSp);});	
		if ( null != oMathPr.rMargin)
			this.bs.WriteItem(c_oSer_MathPrType.RMargin, function(){oThis.WriteMathRMargin(oMathPr.rMargin);});
		if ( null != oMathPr.smallFrac)
			this.bs.WriteItem(c_oSer_MathPrType.SmallFrac, function(){oThis.WriteMathSmallFrac(oMathPr.smallFrac);});
		if ( null != oMathPr.wrapIndent)
			this.bs.WriteItem(c_oSer_MathPrType.WrapIndent, function(){oThis.WriteMathWrapIndent(oMathPr.wrapIndent);});
		if ( null != oMathPr.wrapRight)
			this.bs.WriteItem(c_oSer_MathPrType.WrapRight, function(){oThis.WriteMathWrapRight(oMathPr.wrapRight);});
	}
	this.WriteMathBrkBin = function(BrkBin)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscBrkBin.Repeat;
		switch (BrkBin)
		{
			case BREAK_AFTER: 	val = c_oAscBrkBin.After; break;
			case BREAK_BEFORE: 	val = c_oAscBrkBin.Before;	break;
			case BREAK_REPEAT: 	val = c_oAscBrkBin.Repeat; 
		}
		this.memory.WriteByte(val);
	}
	this.WriteMathBrkBinSub = function(BrkBinSub)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscBrkBinSub.MinusMinus;
		switch (BrkBinSub)
		{
			case BREAK_PLUS_MIN: 	val = c_oAscBrkBinSub.PlusMinus; break;
			case BREAK_MIN_PLUS: 	val = c_oAscBrkBinSub.MinusPlus;	break;
			case BREAK_MIN_MIN: 	val = c_oAscBrkBinSub.MinusMinus; 
		}
		this.memory.WriteByte(val);
	}
	this.WriteMathDefJc = function(DefJc)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscMathJc.CenterGroup;
		switch (DefJc)
		{
			case align_Center: 			val = c_oAscMathJc.Center; break;
			case align_Justify: 		val = c_oAscMathJc.CenterGroup;	break;
			case align_Left: 			val = c_oAscMathJc.Left;	break;
			case align_Right: 			val = c_oAscMathJc.Right; 
		}
		this.memory.WriteByte(val);
	}
	this.WriteMathDispDef = function(DispDef)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(DispDef);
	}
	this.WriteMathInterSp = function(InterSp)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.ValTwips);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.bs.writeMmToTwips(InterSp);
	}
	this.WriteMathIntLim = function(IntLim)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscLimLoc.SubSup;
		switch (IntLim)
		{
			case NARY_SubSup: 	val = c_oAscLimLoc.SubSup; break;
			case NARY_UndOvr: 	val = c_oAscLimLoc.UndOvr;
		}
		this.memory.WriteByte(val);
	}
	this.WriteMathIntraSp = function(IntraSp)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.ValTwips);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.bs.writeMmToTwips(IntraSp);
	}
	this.WriteMathLMargin = function(LMargin)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.ValTwips);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.bs.writeMmToTwips(LMargin);
	}
	this.WriteMathMathFont = function(MathFont)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Variable);
		this.memory.WriteString2(MathFont.Name);
	}
	this.WriteMathNaryLim = function(NaryLim)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		var val = c_oAscLimLoc.SubSup;
		switch (NaryLim)
		{
			case NARY_SubSup: 	val = c_oAscLimLoc.SubSup; break;
			case NARY_UndOvr: 	val = c_oAscLimLoc.UndOvr;
		}
		this.memory.WriteByte(val);
	}
	this.WriteMathPostSp = function(PostSp)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.ValTwips);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.bs.writeMmToTwips(PostSp);
	}
	this.WriteMathPreSp = function(PreSp)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.ValTwips);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.bs.writeMmToTwips(PreSp);
	}
	this.WriteMathRMargin = function(RMargin)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.ValTwips);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.bs.writeMmToTwips(RMargin);
	}
	this.WriteMathSmallFrac = function(SmallFrac)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(SmallFrac);
	}
	this.WriteMathWrapIndent = function(WrapIndent)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.ValTwips);
		this.memory.WriteByte(c_oSerPropLenType.Long);
		this.bs.writeMmToTwips(WrapIndent);
	}
	this.WriteMathWrapRight = function(WrapRight)
	{
		this.memory.WriteByte(c_oSer_OMathBottomNodesValType.Val);
		this.memory.WriteByte(c_oSerPropLenType.Byte);
		this.memory.WriteBool(WrapRight);
	}
    this.WriteColorSchemeMapping = function()
    {
		var oThis = this;
		for(var i in this.Document.clrSchemeMap.color_map)
		{
			var nScriptType = i - 0;
			var nScriptVal = this.Document.clrSchemeMap.color_map[i];
			var nFileType = c_oSer_ClrSchemeMappingType.Accent1;
			var nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexAccent1;
			switch(nScriptType)
			{
				case 0: nFileType = c_oSer_ClrSchemeMappingType.Accent1; break;
				case 1: nFileType = c_oSer_ClrSchemeMappingType.Accent2; break;
				case 2: nFileType = c_oSer_ClrSchemeMappingType.Accent3; break;
				case 3: nFileType = c_oSer_ClrSchemeMappingType.Accent4; break;
				case 4: nFileType = c_oSer_ClrSchemeMappingType.Accent5; break;
				case 5: nFileType = c_oSer_ClrSchemeMappingType.Accent6; break;
				case 6: nFileType = c_oSer_ClrSchemeMappingType.Bg1; break;
				case 7: nFileType = c_oSer_ClrSchemeMappingType.Bg2; break;
				case 10: nFileType = c_oSer_ClrSchemeMappingType.FollowedHyperlink; break;
				case 11: nFileType = c_oSer_ClrSchemeMappingType.Hyperlink; break;
				case 15: nFileType = c_oSer_ClrSchemeMappingType.T1; break;
				case 16: nFileType = c_oSer_ClrSchemeMappingType.T2; break;
			}
			switch(nScriptVal)
			{
				case 0: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexAccent1; break;
				case 1: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexAccent2; break;
				case 2: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexAccent3; break;
				case 3: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexAccent4; break;
				case 4: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexAccent5; break;
				case 5: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexAccent6; break;
				case 8: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexDark1; break;
				case 9: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexDark2; break;
				case 10: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexFollowedHyperlink; break;
				case 11: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexHyperlink; break;
				case 12: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexLight1; break;
				case 13: nFileVal = EWmlColorSchemeIndex.wmlcolorschemeindexLight2; break;
			}
			this.memory.WriteByte(nFileType);
			this.memory.WriteByte(c_oSerPropLenType.Byte);
			this.memory.WriteByte(nFileVal);
		}
    }
}
function BinaryNotesTableWriter(memory, doc, oNumIdMap, oMapCommentId, copyParams, saveParams)
{
	this.memory = memory;
	this.Document = doc;
	this.oNumIdMap = oNumIdMap;
	this.oMapCommentId = oMapCommentId;
	this.saveParams = saveParams;
	this.copyParams = copyParams;
	this.bs = new BinaryCommonWriter(this.memory);
	this.Write = function()
	{
		var oThis = this;
		this.bs.WriteItemWithLength(function(){oThis.WriteNotes();});
	};
	this.WriteNotes = function()
	{
		var oThis = this;
		var indexes = [];
		for (var i in this.saveParams.footnotes) {
			indexes.push(i);
		}
		indexes.sort(AscCommon.fSortAscending);
		var nIndex = 0;
		for (var i = 0; i < indexes.length; ++i) {
			var index = indexes[i];
			var footnote = this.saveParams.footnotes[index];
			this.bs.WriteItem(c_oSerNotes.Note, function() {oThis.WriteNote(index, footnote.type, footnote.content);});
		}
	};
	this.WriteNote = function(index, type, footnote) {
		var oThis = this;
		if (null != type) {
			this.bs.WriteItem(c_oSerNotes.NoteType, function() {oThis.memory.WriteByte(type);});
		}
		this.bs.WriteItem(c_oSerNotes.NoteId, function() {oThis.memory.WriteLong(index);});
		var dtw = new BinaryDocumentTableWriter(this.memory, this.Document, this.oMapCommentId, this.oNumIdMap, this.copyParams, this.saveParams, null);
		this.bs.WriteItem(c_oSerNotes.NoteContent, function(){dtw.WriteDocumentContent(footnote);});
	};
};
function BinaryFileReader(doc, openParams)
{
    this.Document = doc;
	this.openParams = openParams;
    this.stream;
	this.oReadResult = new DocReadResult(doc);
	this.oReadResult.bCopyPaste = openParams.bCopyPaste;
	this.oReadResult.disableRevisions = openParams.disableRevisions;
    
    this.getbase64DecodedData = function(szSrc)
    {
		var isBase64 = typeof szSrc === 'string';
        var srcLen = isBase64 ? szSrc.length : szSrc.length;
        var nWritten = 0;

        var nType = 0;
        var index = AscCommon.c_oSerFormat.Signature.length;
        var version = "";
        var dst_len = "";
        while (true)
        {
            index++;
            var _c = isBase64 ? szSrc.charCodeAt(index) : szSrc[index];
            if (_c == ";".charCodeAt(0))
            {
                
                if(0 == nType)
                {
                    nType = 1;
                    continue;
                }
                else
                {
                    index++;
                    break;
                }
            }
            if(0 == nType)
                version += String.fromCharCode(_c);
            else
                dst_len += String.fromCharCode(_c);
        }
		if(version.length > 1)
        {
            var nTempVersion = version.substring(1) - 0;
            if(nTempVersion)
              AscCommon.CurFileVersion = nTempVersion;
        }
		var stream;
		if (Asc.c_nVersionNoBase64 !== AscCommon.CurFileVersion) {
			var dstLen = parseInt(dst_len);

			var pointer = g_memory.Alloc(dstLen);
			stream = new AscCommon.FT_Stream2(pointer.data, dstLen);
			stream.obj = pointer.obj;

			var dstPx = stream.data;

			if (window.chrome)
			{
				while (index < srcLen)
				{
					var dwCurr = 0;
					var i;
					var nBits = 0;
					for (i=0; i<4; i++)
					{
						if (index >= srcLen)
							break;
						var nCh = DecodeBase64Char(isBase64 ? szSrc.charCodeAt(index++) : szSrc[index++]);
						if (nCh == -1)
						{
							i--;
							continue;
						}
						dwCurr <<= 6;
						dwCurr |= nCh;
						nBits += 6;
					}

					dwCurr <<= 24-nBits;
					for (i=0; i<nBits/8; i++)
					{
						dstPx[nWritten++] = ((dwCurr & 0x00ff0000) >>> 16);
						dwCurr <<= 8;
					}
				}
			}
			else
			{
				var p = b64_decode;
				while (index < srcLen)
				{
					var dwCurr = 0;
					var i;
					var nBits = 0;
					for (i=0; i<4; i++)
					{
						if (index >= srcLen)
							break;
						var nCh = p[isBase64 ? szSrc.charCodeAt(index++) : szSrc[index++]];
						if (nCh == undefined)
						{
							i--;
							continue;
						}
						dwCurr <<= 6;
						dwCurr |= nCh;
						nBits += 6;
					}

					dwCurr <<= 24-nBits;
					for (i=0; i<nBits/8; i++)
					{
						dstPx[nWritten++] = ((dwCurr & 0x00ff0000) >>> 16);
						dwCurr <<= 8;
					}
				}
			}
		} else {
			stream = new AscCommon.FT_Stream2(szSrc, szSrc.length);
			//skip header
			stream.EnterFrame(index);
			stream.Seek(index);
		}
        return stream;
    };
    this.Read = function(data)
    {
		try{
			this.stream = this.getbase64DecodedData(data);
			this.PreLoadPrepare();
			this.ReadMainTable();
			this.PostLoadPrepare();
		}
		catch(e)
		{
			if(e.message == g_sErrorCharCountMessage)
				return false;
			else
				throw e;
		}

		return true;
    };
	this.PreLoadPrepare = function()
	{
		var styles = this.Document.Styles.Style;
        
        var stDefault = this.Document.Styles.Default;
		stDefault.Character = null;
        stDefault.Numbering = null;
        stDefault.Paragraph = null;
		stDefault.Table = null;

        //надо сбросить то, что остался после открытия документа(повторное открытие в Version History)
        pptx_content_loader.Clear();
	}
    this.ReadMainTable = function()
	{	
        var res = c_oSerConstants.ReadOk;
        //mtLen
        res = this.stream.EnterFrame(1);
        if(c_oSerConstants.ReadOk != res)
            return res;
        var mtLen = this.stream.GetUChar();
        var aSeekTable = [];
        var nOtherTableSeek = -1;
        var nNumberingTableSeek = -1;
		var nCommentTableSeek = -1;
		var nDocumentCommentTableSeek = -1;
		var nSettingTableSeek = -1;
		var nDocumentTableSeek = -1;
		var nFootnoteTableSeek = -1;
		var fileStream;
		for(var i = 0; i < mtLen; ++i)
        {
            //mtItem
            res = this.stream.EnterFrame(5);
            if(c_oSerConstants.ReadOk != res)
                return res;
            var mtiType = this.stream.GetUChar();
            var mtiOffBits = this.stream.GetULongLE();
            if(c_oSerTableTypes.Other == mtiType)
                nOtherTableSeek = mtiOffBits;
            else if(c_oSerTableTypes.Numbering == mtiType)
                nNumberingTableSeek = mtiOffBits;
			else if(c_oSerTableTypes.Comments == mtiType)
                nCommentTableSeek = mtiOffBits;
			else if(c_oSerTableTypes.DocumentComments == mtiType)
				nDocumentCommentTableSeek = mtiOffBits;
			else if(c_oSerTableTypes.Settings == mtiType)
                nSettingTableSeek = mtiOffBits;
			else if(c_oSerTableTypes.Document == mtiType)
                nDocumentTableSeek = mtiOffBits;
			else if(c_oSerTableTypes.Footnotes == mtiType)
				nFootnoteTableSeek = mtiOffBits;
            else
                aSeekTable.push( {type: mtiType, offset: mtiOffBits} );
        }
        if(-1 != nOtherTableSeek)
        {
            res = this.stream.Seek(nOtherTableSeek);
            if(c_oSerConstants.ReadOk != res)
                return res;
			//todo сделать зачитывание в oReadResult, одновременно с кодом презентаций
			if(!this.oReadResult.bCopyPaste)
			{
				res = (new Binary_OtherTableReader(this.Document, this.oReadResult, this.stream)).Read();
			}
            if(c_oSerConstants.ReadOk != res)
                return res;
        }
		if(-1 != nCommentTableSeek)
        {
            res = this.stream.Seek(nCommentTableSeek);
            if(c_oSerConstants.ReadOk != res)
                return res;
            res = (new Binary_CommentsTableReader(this.Document, this.oReadResult, this.stream, this.oReadResult.oComments)).Read();
            if(c_oSerConstants.ReadOk != res)
                return res;
        }
		if(-1 != nDocumentCommentTableSeek)
		{
			res = this.stream.Seek(nDocumentCommentTableSeek);
			if(c_oSerConstants.ReadOk != res)
				return res;
			res = (new Binary_CommentsTableReader(this.Document, this.oReadResult, this.stream, this.oReadResult.oComments)).Read();
			if(c_oSerConstants.ReadOk != res)
				return res;
		}
		if(-1 != nFootnoteTableSeek)
		{
			res = this.stream.Seek(nFootnoteTableSeek);
			if(c_oSerConstants.ReadOk != res)
				return res;
			res = (new Binary_NotesTableReader(this.Document, this.oReadResult, this.openParams, this.stream)).Read();
			if(c_oSerConstants.ReadOk != res)
				return res;
		}
		if(-1 != nSettingTableSeek)
        {
            res = this.stream.Seek(nSettingTableSeek);
            if(c_oSerConstants.ReadOk != res)
                return res;
			//todo сделать зачитывание в oReadResult, одновременно с кодом презентаций
			if(!this.oReadResult.bCopyPaste)
			{
				res = (new Binary_SettingsTableReader(this.Document, this.oReadResult, this.stream)).Read();
			}
            if(c_oSerConstants.ReadOk != res)
                return res;
        }
		
        //Читаем Numbering, чтобы была возможность заполнить его даже в стилях
        if(-1 != nNumberingTableSeek)
        {
            res = this.stream.Seek(nNumberingTableSeek);
            if(c_oSerConstants.ReadOk != res)
                return res;
            res = (new Binary_NumberingTableReader(this.Document, this.oReadResult, this.stream)).Read();
            if(c_oSerConstants.ReadOk != res)
                return res;
        }
        var oBinary_DocumentTableReader = new Binary_DocumentTableReader(this.Document, this.oReadResult, this.openParams, this.stream, null, this.oReadResult.oCommentsPlaces);
        for(var i = 0, length = aSeekTable.length; i < length; ++i)
        {
            var item = aSeekTable[i];
            var mtiType = item.type;
            var mtiOffBits = item.offset;
            res = this.stream.Seek(mtiOffBits);
            if(c_oSerConstants.ReadOk != res)
                return res;
            switch(mtiType)
            {
                case c_oSerTableTypes.Signature:break;
                case c_oSerTableTypes.Info:break;
                case c_oSerTableTypes.Style:
                    res = (new BinaryStyleTableReader(this.Document, this.oReadResult, this.stream)).Read();
                    break;
                // case c_oSerTableTypes.Document:
                    // res = oBinary_DocumentTableReader.ReadAsTable(this.oReadResult.DocumentContent);
                    // break;
                case c_oSerTableTypes.HdrFtr:
					//todo сделать зачитывание в oReadResult
					if(!this.oReadResult.bCopyPaste)
					{
						res = (new Binary_HdrFtrTableReader(this.Document, this.oReadResult,  this.openParams, this.stream)).Read();
					}
                    break;
                // case c_oSerTableTypes.Numbering:
                    // res = (new Binary_NumberingTableReader(this.Document, this.stream, oDocxNum)).Read();
                    // break;
                // case c_oSerTableTypes.Other:
                    // res = (new Binary_OtherTableReader(this.Document, this.stream)).Read();
                    // break;
				case c_oSerTableTypes.App:
					this.stream.Seek2(mtiOffBits);
					fileStream = this.stream.ToFileStream();
					this.Document.App = new AscCommon.CApp();
					this.Document.App.fromStream(fileStream);
					this.stream.FromFileStream(fileStream);
					break;
				case c_oSerTableTypes.Core:
					this.stream.Seek2(mtiOffBits);
					fileStream = this.stream.ToFileStream();
					this.Document.Core = new AscCommon.CCore();
					this.Document.Core.fromStream(fileStream);
					this.stream.FromFileStream(fileStream);
					break;
            }
            if(c_oSerConstants.ReadOk != res)
                return res;
        }
		if(-1 != nDocumentTableSeek)
        {
            res = this.stream.Seek(nDocumentTableSeek);
            if(c_oSerConstants.ReadOk != res)
                return res;
            res = oBinary_DocumentTableReader.ReadAsTable(this.oReadResult.DocumentContent);
            if(c_oSerConstants.ReadOk != res)
                return res;
        }
        return res;
    };
	this.PostLoadPrepareCheckStylesRecursion = function(stId, aStylesGrey, styles){
		var stylesGrey = aStylesGrey[stId];
		if(0 != stylesGrey){
			var stObj = styles[stId];
			if(stObj){
				if(1 == stylesGrey)
					stObj.Set_BasedOn(null);
				else{
					if(null != stObj.BasedOn){
						aStylesGrey[stId] = 1;
						this.PostLoadPrepareCheckStylesRecursion(stObj.BasedOn, aStylesGrey, styles);
					}
					aStylesGrey[stId] = 0;
				}
			}
		}
	};
    this.PostLoadPrepare = function(setting)
    {
		//списки
		for(var i in this.oReadResult.numToANumClass) {
			this.Document.Numbering.AddAbstractNum(this.oReadResult.numToANumClass[i]);
		}
		for(var i in this.oReadResult.numToNumClass) {
			this.Document.Numbering.AddNum(this.oReadResult.numToNumClass[i]);
		}

		for(var i = 0, length = this.oReadResult.paraNumPrs.length; i < length; ++i)
		{
			var numPr = this.oReadResult.paraNumPrs[i];
			var oNumClass = this.oReadResult.numToNumClass[numPr.NumId];
			if(null != oNumClass && 0 !== numPr.NumId)
				numPr.NumId = oNumClass.Get_Id();
			else
				numPr.NumId = 0;
		}
		var oDocStyle = this.Document.Styles;
		var styles = this.Document.Styles.Style;
        var stDefault = this.Document.Styles.Default;
		if(AscCommon.CurFileVersion < 2){
			for(var i in this.oReadResult.styles)
				this.oReadResult.styles[i].style.qFormat = true;
		}		
		//запоминаем имена стилей, которые были изначально в нашем документе, чтобы потом подменить их
		var aStartDocStylesNames = {};
		for(var stId in styles)
		{
			var style = styles[stId];
			if(style && style.Name)
				aStartDocStylesNames[style.Name.toLowerCase().replace(/\s/g,"")] = style;
		}
		//запоминаем default стили имена или id которых совпали с стилями открываемого документа и ссылки на них надо подменить
		var oIdRenameMap = {};
		var oIdMap = {};
		//Удаляем стили с тем же именем
		for(var i in this.oReadResult.styles)
		{
			var elem = this.oReadResult.styles[i];
			var oNewStyle = elem.style;
			var sNewStyleId = oNewStyle.Get_Id();
			var oNewId = elem.param;
			oIdMap[oNewId.id] = sNewStyleId;
            //такой код для сранения имен есть в DrawingDocument.js
            // как только меняется DrawingDocument - меняется и код здесь.
            var sNewStyleName = oNewStyle.Name.toLowerCase().replace(/\s/g,"");
			var oStartDocStyle = aStartDocStylesNames[sNewStyleName];
            if(oStartDocStyle)
            {
				var stId = oStartDocStyle.Get_Id();
				oNewStyle.Set_Name(oStartDocStyle.Name);
				oIdRenameMap[stId] = {id: sNewStyleId, def: oNewId.def, type: oNewStyle.Type, newName: sNewStyleName};
				oDocStyle.Remove(stId);
			}
		}
		//меняем BasedOn и Next
		for(var stId in styles)
        {
            var stObj = styles[stId];
			var oNewId;
			if(null != stObj.BasedOn){
				oNewId = oIdRenameMap[stObj.BasedOn];
				if(null != oNewId)
					stObj.Set_BasedOn(oNewId.id);
			}
			if(null != stObj.Next){
				oNewId = oIdRenameMap[stObj.Next];
				if(null != oNewId)
					stObj.Set_Next(oNewId.id);
			}
			if(null != stObj.Link){
				oNewId = oIdRenameMap[stObj.Link];
				if(null != oNewId)
					stObj.Set_Link(oNewId.id);
			}
        }
		//меняем Headings
		for(var i = 0, length = stDefault.Headings.length; i < length; ++i)
        {
            var sHeading = stDefault.Headings[i];
			var oNewId = oIdRenameMap[sHeading];
			if(null != oNewId)
				stDefault.Headings[i] = oNewId.id;
        }
		//TOC
		for(var i = 0, length = stDefault.TOC.length; i < length; ++i)
		{
			var sTOC = stDefault.TOC[i];
			var oNewId = oIdRenameMap[sTOC];
			if(null != oNewId)
				stDefault.TOC[i] = oNewId.id;
		}
		//TOCHeading
		var sTOCHeading = stDefault.TOCHeading;
		var oNewId = oIdRenameMap[sTOCHeading];
		if(null != oNewId)
			stDefault.TOCHeading = oNewId.id;

		var localHyperlink = AscCommon.translateManager.getValue("Hyperlink").toLowerCase().replace(/\s/g,"");
		//меняем старые id
		for(var sOldId in oIdRenameMap)
		{
			var oNewId = oIdRenameMap[sOldId];
			var sNewStyleName = oNewId.newName;
			var stId = sOldId;
			if(stDefault.Character == stId)
                stDefault.Character = null;
            if(stDefault.Paragraph == stId)
                stDefault.Paragraph = null;
            if(stDefault.Numbering == stId)
                stDefault.Numbering = null;
            if(stDefault.Table == stId)
                stDefault.Table = null;
            if(stDefault.ParaList == stId)
                stDefault.ParaList = oNewId.id;
            if(stDefault.Header == stId || "header" == sNewStyleName)
                stDefault.Header = oNewId.id;
            if(stDefault.Footer == stId || "footer" == sNewStyleName)
                stDefault.Footer = oNewId.id;
			if(stDefault.Hyperlink == stId || "hyperlink" === sNewStyleName || localHyperlink === sNewStyleName)
                stDefault.Hyperlink = oNewId.id;
            if(stDefault.TableGrid == stId || "tablegrid" == sNewStyleName)
                stDefault.TableGrid = oNewId.id;
			if(stDefault.FootnoteText == stId || "footnotetext" == sNewStyleName)
				stDefault.FootnoteText = oNewId.id;
			if(stDefault.FootnoteTextChar == stId || "footnotetextchar" == sNewStyleName)
				stDefault.FootnoteTextChar = oNewId.id;
			if(stDefault.FootnoteReference == stId || "footnotereference" == sNewStyleName)
				stDefault.FootnoteReference = oNewId.id;
			if (stDefault.NoSpacing == stId)
				stDefault.NoSpacing = oNewId.id;
			if (stDefault.Title == stId)
				stDefault.Title = oNewId.id;
			if (stDefault.Subtitle == stId)
				stDefault.Subtitle = oNewId.id;
			if (stDefault.Quote == stId)
				stDefault.Quote = oNewId.id;
			if (stDefault.IntenseQuote == stId)
				stDefault.IntenseQuote = oNewId.id;

            if(true == oNewId.def)
            {
                switch(oNewId.type)
                {
                    case styletype_Character:stDefault.Character = oNewId.id;break;
                    case styletype_Numbering:stDefault.Numbering = oNewId.id;break;
                    case styletype_Paragraph:stDefault.Paragraph = oNewId.id;break;
                    case styletype_Table:stDefault.Table = oNewId.id;break;
                }
            }
		}
		//will be default if there is no def attribute
		var characterNameId, numberingNameId, paragraphNameId, tableNameId;
		//добавляем новые стили
		for(var i in this.oReadResult.styles)
		{
			var elem = this.oReadResult.styles[i];
			var oNewStyle = elem.style;
			var sNewStyleId = oNewStyle.Get_Id();
			if(null != oNewStyle.BasedOn){
				var oStyleBasedOn = this.oReadResult.styles[oNewStyle.BasedOn];
				if(oStyleBasedOn)
					oNewStyle.Set_BasedOn(oStyleBasedOn.style.Get_Id());
				else
					oNewStyle.Set_BasedOn(null);
			}
			if(null != oNewStyle.Next){
				var oStyleNext = this.oReadResult.styles[oNewStyle.Next];
				if(oStyleNext)
					oNewStyle.Set_Next(oStyleNext.style.Get_Id());
				else
					oNewStyle.Set_Next(null);
			}
			if(null != oNewStyle.Link){
				var oStyleNext = this.oReadResult.styles[oNewStyle.Link];
				if(oStyleNext)
					oNewStyle.Set_Link(oStyleNext.style.Get_Id());
				else
					oNewStyle.Set_Link(null);
			}
			var oNewId = elem.param;
			var sNewStyleName = oNewStyle.Name.toLowerCase().replace(/\s/g,"");
			if(true == oNewId.def)
            {
                switch(oNewStyle.Type)
                {
                    case styletype_Character:stDefault.Character = sNewStyleId;break;
                    case styletype_Numbering:stDefault.Numbering = sNewStyleId;break;
                    case styletype_Paragraph:stDefault.Paragraph = sNewStyleId;break;
                    case styletype_Table:stDefault.Table = sNewStyleId;break;
                }
            }
            if("header" == sNewStyleName)
                stDefault.Header = sNewStyleId;
            if("footer" == sNewStyleName)
                stDefault.Footer = sNewStyleId;
            if("hyperlink" === sNewStyleName || localHyperlink === sNewStyleName)
                stDefault.Hyperlink = sNewStyleId;
            if("tablegrid" == sNewStyleName)
                stDefault.TableGrid = sNewStyleId;
			if("footnotetext" == sNewStyleName)
				stDefault.FootnoteText = sNewStyleId;
			if("footnotetextchar" == sNewStyleName)
				stDefault.FootnoteTextChar = sNewStyleId;
			if("footnotereference" == sNewStyleName)
				stDefault.FootnoteReference = sNewStyleId;
			if("defaultparagraphfont" == sNewStyleName)
				characterNameId = sNewStyleId;
			if("normal" == sNewStyleName)
				paragraphNameId = sNewStyleId;
			if("nolist" == sNewStyleName)
				numberingNameId = sNewStyleId;
			if("normaltable" == sNewStyleName)
				tableNameId = sNewStyleId;
			oDocStyle.Add(oNewStyle);
		}
		var oStyleTypes = {par: 1, table: 2, lvl: 3, run: 4, styleLink: 5, numStyleLink: 6};
		var fParseStyle = function(aStyles, oDocumentStyles, nStyleType)
		{
			for(var i = 0, length = aStyles.length; i < length; ++i)
			{
				var elem = aStyles[i];
				var sStyleId = oIdMap[elem.style];
				if(null != sStyleId && null != oDocumentStyles[sStyleId])
				{
					if(oStyleTypes.run == nStyleType)
						elem.pPr.RStyle = sStyleId;
					else if(oStyleTypes.par == nStyleType)
						elem.pPr.PStyle = sStyleId;
					else if(oStyleTypes.table == nStyleType)
						elem.pPr.TableStyle = sStyleId;
					else if(oStyleTypes.styleLink == nStyleType)
						elem.pPr.StyleLink = sStyleId;
					else if(oStyleTypes.numStyleLink == nStyleType)
						elem.pPr.NumStyleLink = sStyleId;
					else
						elem.pPr.PStyle = sStyleId;
				}
			}
		}
		fParseStyle(this.oReadResult.runStyles, styles, oStyleTypes.run);
		fParseStyle(this.oReadResult.paraStyles, styles, oStyleTypes.par);
		fParseStyle(this.oReadResult.tableStyles, styles, oStyleTypes.table);
		fParseStyle(this.oReadResult.lvlStyles, styles, oStyleTypes.lvl);
		fParseStyle(this.oReadResult.styleLinks, styles, oStyleTypes.styleLink);
		fParseStyle(this.oReadResult.numStyleLinks, styles, oStyleTypes.numStyleLink);
		if (null == stDefault.Character) {
			if (!characterNameId) {
				var oNewStyle = new CStyle("Default Paragraph Font", null, null, styletype_Character );
				oNewStyle.CreateDefaultParagraphFont();
				characterNameId = oDocStyle.Add(oNewStyle);
				//remove style with same name
				var oStartDocStyle = aStartDocStylesNames[oNewStyle.Name.toLowerCase().replace(/\s/g,"")];
				if(oStartDocStyle) {
					oDocStyle.Remove(oStartDocStyle.Get_Id());
				}
			}
			stDefault.Character = characterNameId;
		}
		if (null == stDefault.Numbering) {
			if (!numberingNameId) {
				var oNewStyle = new CStyle("No List", null, null, styletype_Numbering);
				oNewStyle.CreateNoList();
				numberingNameId = oDocStyle.Add(oNewStyle);
				//remove style with same name
				var oStartDocStyle = aStartDocStylesNames[oNewStyle.Name.toLowerCase().replace(/\s/g,"")];
				if(oStartDocStyle) {
					oDocStyle.Remove(oStartDocStyle.Get_Id());
				}
			}
			stDefault.Numbering = numberingNameId;
		}
		if (null == stDefault.Paragraph) {
			if (!paragraphNameId) {
				var oNewStyle = new CStyle("Normal", null, null, styletype_Paragraph);
				oNewStyle.CreateNormal();
				paragraphNameId = oDocStyle.Add(oNewStyle);
				//remove style with same name
				var oStartDocStyle = aStartDocStylesNames[oNewStyle.Name.toLowerCase().replace(/\s/g,"")];
				if(oStartDocStyle) {
					oDocStyle.Remove(oStartDocStyle.Get_Id());
				}
			}
			stDefault.Paragraph = paragraphNameId;
		}
		if (null == stDefault.Table) {
			if (!tableNameId) {
				var oNewStyle = new CStyle("Normal Table", null, null, styletype_Table);
				oNewStyle.Create_NormalTable();
				oNewStyle.Set_TablePr(new CTablePr());
				tableNameId = oDocStyle.Add(oNewStyle);
				//remove style with same name
				var oStartDocStyle = aStartDocStylesNames[oNewStyle.Name.toLowerCase().replace(/\s/g,"")];
				if(oStartDocStyle) {
					oDocStyle.Remove(oStartDocStyle.Get_Id());
				}
			}
			stDefault.Table = tableNameId;
		}
		//проверяем циклы в styles по BasedOn
		var aStylesGrey = {};
		for(var stId in styles)
		{
			this.PostLoadPrepareCheckStylesRecursion(stId, aStylesGrey, styles);
		}
		//DefpPr, DefrPr
		//важно чтобы со списками разобрались выше чем этот код
		if(null != this.oReadResult.DefpPr)
			this.Document.Styles.Default.ParaPr.Merge( this.oReadResult.DefpPr );
		if(null != this.oReadResult.DefrPr)
			this.Document.Styles.Default.TextPr.Merge( this.oReadResult.DefrPr );
		//Footnotes strict after style
		if (this.oReadResult.logicDocument) {
			this.oReadResult.logicDocument.Footnotes.ResetSpecialFootnotes();
			for (var i = 0; i < this.oReadResult.footnoteRefs.length; ++i) {
				var footnote = this.oReadResult.footnotes[this.oReadResult.footnoteRefs[i]];
				if (0 == footnote.type) {
					this.oReadResult.logicDocument.Footnotes.SetContinuationNotice(footnote.content);
				} else if (1 == footnote.type) {
					this.oReadResult.logicDocument.Footnotes.SetContinuationSeparator(footnote.content);
				} else if (3 == footnote.type) {
					this.oReadResult.logicDocument.Footnotes.SetSeparator(footnote.content);
				}
			}
		}
		//split runs after styles because rPr can have a RStyle
		for (var i = 0; i < this.oReadResult.runsToSplit.length; ++i) {
			var run = this.oReadResult.runsToSplit[i];
			var runParent = run.Get_Parent();
			var runPos = run.private_GetPosInParent(runParent);
			while (run.GetElementsCount() > Asc.c_dMaxParaRunContentLength) {
				run.Split2(run.GetElementsCount() - Asc.c_dMaxParaRunContentLength, runParent, runPos);
			}
		}

		var setting = this.oReadResult.setting;        
		var fInitCommentData = function(comment)
		{
			var oCommentObj = new AscCommon.CCommentData();
			if(null != comment.UserName)
				oCommentObj.m_sUserName = comment.UserName;
			if(null != comment.Initials)
				oCommentObj.m_sInitials = comment.Initials;
			if(null != comment.UserId)
				oCommentObj.m_sUserId = comment.UserId;
			if(null != comment.ProviderId)
				oCommentObj.m_sProviderId = comment.ProviderId;
			if(null != comment.Date)
				oCommentObj.m_sTime = comment.Date;
			if(null != comment.OODate)
				oCommentObj.m_sOOTime = comment.OODate;
			if(null != comment.Text)
				oCommentObj.m_sText = comment.Text;
			if(null != comment.Solved)
				oCommentObj.m_bSolved = comment.Solved;
			if(null != comment.DurableId)
				oCommentObj.m_nDurableId = comment.DurableId;
			if(null != comment.Replies)
			{
				for(var  i = 0, length = comment.Replies.length; i < length; ++i)
					oCommentObj.Add_Reply(fInitCommentData(comment.Replies[i]));
			}
			return oCommentObj;
		}
		var oCommentsNewId = {};
		for(var i in this.oReadResult.oComments)
		{
			var oOldComment = this.oReadResult.oComments[i];
			var oNewComment = new AscCommon.CComment(this.Document.Comments, fInitCommentData(oOldComment));
			this.Document.Comments.Add(oNewComment);
			oCommentsNewId[oOldComment.Id] = oNewComment;
		}
		for(var commentIndex in this.oReadResult.oCommentsPlaces)
		{
			var item = this.oReadResult.oCommentsPlaces[commentIndex];
			var bToDelete = true;
			if(null != item.Start && null != item.End){
				var oCommentObj = oCommentsNewId[item.Start.Id];
				if(oCommentObj)
				{
					bToDelete = false;
					if(null != item.QuoteText)
						oCommentObj.Data.m_sQuoteText = item.QuoteText;
					item.Start.oParaComment.SetCommentId(oCommentObj.Get_Id());
					item.End.oParaComment.SetCommentId(oCommentObj.Get_Id());
				}
			}
			if(bToDelete){
				if(null != item.Start && null != item.Start.oParent)
				{
					var oParent = item.Start.oParent;
					var oParaComment = item.Start.oParaComment;
					for (var i = OpenParStruct.prototype._GetContentLength(oParent) - 1; i >= 0; --i)
					{
					    if (oParaComment == OpenParStruct.prototype._GetFromContent(oParent, i)){
							OpenParStruct.prototype._removeFromContent(oParent, i, 1);
							break;
						}
					}
				}
				if(null != item.End && null != item.End.oParent)
				{
					var oParent = item.End.oParent;
					var oParaComment = item.End.oParaComment;
					for (var i = OpenParStruct.prototype._GetContentLength(oParent) - 1; i >= 0; --i)
					{
					    if (oParaComment == OpenParStruct.prototype._GetFromContent(oParent, i)){
							OpenParStruct.prototype._removeFromContent(oParent, i, 1);
							break;
						}
					}
				}
			}
		}
		//посылаем событие о добавлении комментариев
		for(var i in oCommentsNewId)
		{
			var oNewComment = oCommentsNewId[i];
			oNewComment.CreateNewCommentsGuid();
			this.Document.DrawingDocument.m_oWordControl.m_oApi.sync_AddComment( oNewComment.Id, oNewComment.Data );
		}
		//remove bookmarks without end
		for(var bookmarkIndex in this.oReadResult.bookmarksStarted)
		{
			var elem = this.oReadResult.bookmarksStarted[bookmarkIndex];
			for (var i = 0; i < OpenParStruct.prototype._GetContentLength(elem.parent); ++i)
			{
				if (elem.bookmark === OpenParStruct.prototype._GetFromContent(elem.parent, i)){
					OpenParStruct.prototype._removeFromContent(elem.parent, i, 1);
					break;
				}
			}
		}
		this.Document.Content = this.oReadResult.DocumentContent;
		if(this.Document.Content.length == 0)
        {
            var oNewParagraph = new Paragraph(this.Document.DrawingDocument, this.Document);
            this.Document.Content.push(oNewParagraph);
        }
		// for(var i = 0, length = this.oReadResult.aPostOpenStyleNumCallbacks.length; i < length; ++i)
			// this.oReadResult.aPostOpenStyleNumCallbacks[i].call();
		if (null != this.oReadResult.trackRevisions) {
			this.Document.DrawingDocument.m_oWordControl.m_oApi.asc_SetTrackRevisions(this.oReadResult.trackRevisions);
		}
		for (var i = 0; i < this.oReadResult.drawingToMath.length; ++i) {
			this.oReadResult.drawingToMath[i].Convert_ToMathObject(true);
		}
		for (var i = 0, length = this.oReadResult.aTableCorrect.length; i < length; ++i) {
			var table = this.oReadResult.aTableCorrect[i];
			table.ReIndexing(0);
			table.Correct_BadTable();
		}
		if (null !== this.oReadResult.compatibilityMode) {
			this.Document.Settings.CompatibilityMode = this.oReadResult.compatibilityMode;
		}
		if (this.oReadResult.SplitPageBreakAndParaMark) {
			this.Document.Settings.SplitPageBreakAndParaMark = this.oReadResult.SplitPageBreakAndParaMark;
		}
		if (this.oReadResult.DoNotExpandShiftReturn) {
			this.Document.Settings.DoNotExpandShiftReturn = this.oReadResult.DoNotExpandShiftReturn;
		}

        this.Document.On_EndLoad();
		//чтобы удалялся stream с бинарником
		pptx_content_loader.Clear(true);
    };
    this.ReadFromString = function (sBase64, copyPasteObj) {
        //надо сбросить то, что остался после открытия документа
		var isWordCopyPaste = copyPasteObj ? copyPasteObj.wordCopyPaste : null;
		var isExcelCopyPaste = copyPasteObj ? copyPasteObj.excelCopyPaste : null;
		var isCopyPaste = isWordCopyPaste || isExcelCopyPaste;
		var api = isWordCopyPaste ? this.Document.DrawingDocument.m_oWordControl.m_oApi : null;
		var insertDocumentUrlsData = api ? api.insertDocumentUrlsData : null;
        pptx_content_loader.Clear();
        pptx_content_loader.Start_UseFullUrl(insertDocumentUrlsData);
        this.stream = this.getbase64DecodedData(sBase64);
        this.ReadMainTable();
        var oReadResult = this.oReadResult;
        //обрабатываем списки
        for (var i in oReadResult.numToANumClass) {
            var oNumClass = oReadResult.numToANumClass[i];
            var documentANum = this.Document.Numbering.AbstractNum;
            //проверка на уже существующий такой же AbstractNum
            /*var isAlreadyContains = false;
            for (var n in documentANum) {
                var isEqual = documentANum[n].isEqual(oNumClass);
                if (isEqual == true) {
                    isAlreadyContains = true;
                    break;
                }
            }
            if (!isAlreadyContains) {
                this.Document.Numbering.AddAbstractNum(oNumClass);
            }
            else
                oReadResult.numToNumClass[i] = documentANum[n];*/
			
			//убираю проверку на существующий такой же AbstractNum
			//такая проверка может иметь смысл только если numToNumClass содержит 1 элемент
			//если там более 1 одного элемента - это разные списки. будет проверка на существуюший AbstractNum - они могут стать одним списком, если у них одинаковая структура
			//возможно, нужно сравнивать только numid и в пределах одного документа
			//TODO просмотреть все ситуации со списками
			this.Document.Numbering.AddAbstractNum(oNumClass);
        }
		for(var i in this.oReadResult.numToNumClass) {
			this.Document.Numbering.AddNum(this.oReadResult.numToNumClass[i]);
		}
        for (var i = 0, length = oReadResult.paraNumPrs.length; i < length; ++i) {
            var numPr = oReadResult.paraNumPrs[i];
            var oNumClass = oReadResult.numToNumClass[numPr.NumId];
            if (null != oNumClass)
                numPr.NumId = oNumClass.Get_Id();
            else
                numPr.NumId = 0;
        }
        //обрабатываем стили
        var isAlreadyContainsStyle;
        var oStyleTypes = { par: 1, table: 2, lvl: 3, run: 4, styleLink: 5, numStyleLink: 6};
        var addNewStyles = false;
        var fParseStyle = function (aStyles, oDocumentStyles, oReadResult, nStyleType) {
            if (aStyles == undefined)
                return;
            for (var i = 0, length = aStyles.length; i < length; ++i) {
                var elem = aStyles[i];
                var stylePaste = oReadResult.styles[elem.style];
                var isEqualName = null;
                if (null != stylePaste && null != stylePaste.style && oDocumentStyles) {
                    for (var j in oDocumentStyles.Style) {
                        var styleDoc = oDocumentStyles.Style[j];
                        isAlreadyContainsStyle = styleDoc.isEqual(stylePaste.style);
                        if (styleDoc.Name == stylePaste.style.Name)
                            isEqualName = j;
                        if (isAlreadyContainsStyle) 
						{
                            if (oStyleTypes.par == nStyleType)
                                elem.pPr.PStyle = j;
                            else if (oStyleTypes.table == nStyleType)
                                elem.pPr.Set_TableStyle2(j);
							else if (oStyleTypes.run == nStyleType)
							{
								//TODO сделать аналогично для Pstyle
								if(elem.run)
								{
									elem.run.Set_RStyle(j);
								}
								else
								{
									elem.pPr.RStyle = j;
								}
							}	
                            else if(oStyleTypes.styleLink == nStyleType)
                                elem.pPr.StyleLink = j;
                            else if(oStyleTypes.numStyleLink == nStyleType)
                                elem.pPr.NumStyleLink = j;
							else
                                elem.pPr.PStyle = j;
                            break;
                        }
                    }
                    if (!isAlreadyContainsStyle && isEqualName != null)//если нашли имя такого же стиля
                    {
                        if (nStyleType == oStyleTypes.par || nStyleType == oStyleTypes.lvl)
                            elem.pPr.PStyle = isEqualName;
                        else if (nStyleType == oStyleTypes.table)
                            elem.pPr.Set_TableStyle2(isEqualName);
						else if (nStyleType == oStyleTypes.run)
						{
							if(elem.run)
							{
								elem.run.Set_RStyle(isEqualName);
							}
							else
							{
								elem.pPr.RStyle = isEqualName;
							}
						}	
                        else if(nStyleType == oStyleTypes.styleLink)
                            elem.pPr.StyleLink = isEqualName;
                        else if(nStyleType == oStyleTypes.numStyleLink)
                            elem.pPr.NumStyleLink = isEqualName;
                    }
                    else if (!isAlreadyContainsStyle && isEqualName == null)//нужно добавить новый стиль
                    {
                        //todo править и BaseOn
						stylePaste.style.BasedOn = null;
                        var nStyleId = oDocumentStyles.Add(stylePaste.style);
                        if (nStyleType == oStyleTypes.par || nStyleType == oStyleTypes.lvl)
                            elem.pPr.PStyle = nStyleId;
                        else if (nStyleType == oStyleTypes.table)
                            elem.pPr.Set_TableStyle2(nStyleId);
						else if (nStyleType == oStyleTypes.run)
						{
							if(elem.run)
							{
								elem.run.Set_RStyle(nStyleId);
							}
							else
							{
								elem.pPr.RStyle = nStyleId;
							}
						}
                        else if(nStyleType == oStyleTypes.styleLink)
                            elem.pPr.StyleLink = nStyleId;
                        else if(nStyleType == oStyleTypes.numStyleLink)
                            elem.pPr.NumStyleLink = nStyleId;
						
                        addNewStyles = true;
                    }
                }
            }
        };
		
		fParseStyle(this.oReadResult.runStyles, this.Document.Styles, this.oReadResult, oStyleTypes.run);
        fParseStyle(this.oReadResult.paraStyles, this.Document.Styles, this.oReadResult, oStyleTypes.par);
        fParseStyle(this.oReadResult.tableStyles, this.Document.Styles, this.oReadResult, oStyleTypes.table);
        fParseStyle(this.oReadResult.lvlStyles, this.Document.Styles, this.oReadResult, oStyleTypes.lvl);
        fParseStyle(this.oReadResult.styleLinks, this.Document.Styles, this.oReadResult, oStyleTypes.styleLink);
		fParseStyle(this.oReadResult.numStyleLinks, this.Document.Styles, this.oReadResult, oStyleTypes.numStyleLink);
        var aContent = this.oReadResult.DocumentContent;
        for (var i = 0, length = this.oReadResult.aPostOpenStyleNumCallbacks.length; i < length; ++i)
            this.oReadResult.aPostOpenStyleNumCallbacks[i].call();
        var bInBlock;
        if (oReadResult.bLastRun)
            bInBlock = false;
        else
            bInBlock = true;
        //создаем список используемых шрифтов
        var AllFonts = {};
		
		if(this.Document.Numbering)
			this.Document.Numbering.GetAllFontNames(AllFonts);
		if(this.Document.Styles)	
        this.Document.Styles.Document_Get_AllFontNames(AllFonts);
		
        for (var Index = 0, Count = aContent.length; Index < Count; Index++)
            aContent[Index].Document_Get_AllFontNames(AllFonts);
        var aPrepeareFonts = [];
		
		var oDocument = this.Document && this.Document.LogicDocument ? this.Document.LogicDocument : this.Document;
		
		var fontScheme;
		var m_oLogicDocument = editor.WordControl.m_oLogicDocument;
		//для презентаций находим fontScheme
		if(m_oLogicDocument && m_oLogicDocument.slideMasters && m_oLogicDocument.slideMasters[0] && m_oLogicDocument.slideMasters[0].Theme && m_oLogicDocument.slideMasters[0].Theme.themeElements)
			fontScheme = m_oLogicDocument.slideMasters[0].Theme.themeElements.fontScheme;
		else
			fontScheme = m_oLogicDocument.theme.themeElements.fontScheme;

		AscFormat.checkThemeFonts(AllFonts, fontScheme);
		
        for (var i in AllFonts)
            aPrepeareFonts.push(new AscFonts.CFont(i, 0, "", 0));
        //создаем список используемых картинок
        var oPastedImagesUnique = {};
        var aPastedImages = pptx_content_loader.End_UseFullUrl();
        for (var i = 0, length = aPastedImages.length; i < length; ++i) {
            var elem = aPastedImages[i];
            oPastedImagesUnique[elem.Url] = 1;
        }
        var aPrepeareImages = [];
        for (var i in oPastedImagesUnique)
            aPrepeareImages.push(i);
			
		if(!isCopyPaste)
		{
			this.Document.Content = this.oReadResult.DocumentContent;
			
			if(this.Document.Content.length == 0)
			{
				var oNewParagraph = new Paragraph(this.Document.DrawingDocument, this.Document);
				this.Document.Content.push(oNewParagraph);
			}
			
			this.Document.On_EndLoad();
		}
		//split runs after styles because rPr can have a RStyle
		for (var i = 0; i < this.oReadResult.runsToSplit.length; ++i) {
			var run = this.oReadResult.runsToSplit[i];
			var runParent = run.Get_Parent();
			var runPos = run.private_GetPosInParent(runParent);
			while (run.GetElementsCount() > Asc.c_dMaxParaRunContentLength) {
				run.Split2(run.GetElementsCount() - Asc.c_dMaxParaRunContentLength, runParent, runPos);
			}
		}
		//add comments
		var setting = this.oReadResult.setting;        
		var fInitCommentData = function(comment)
		{
			var oCommentObj = new AscCommon.CCommentData();
			if(null != comment.UserName)
				oCommentObj.m_sUserName = comment.UserName;
			if(null != comment.Initials)
				oCommentObj.m_sInitials = comment.Initials;
			if(null != comment.UserId)
				oCommentObj.m_sUserId = comment.UserId;
			if(null != comment.ProviderId)
				oCommentObj.m_sProviderId = comment.ProviderId;
			if(null != comment.Date)
				oCommentObj.m_sTime = comment.Date;
			if(null != comment.m_sQuoteText)
				oCommentObj.m_sQuoteText = comment.m_sQuoteText;
			if(null != comment.Text)
				oCommentObj.m_sText = comment.Text;
			if(null != comment.Solved)
				oCommentObj.m_bSolved = comment.Solved;
			if(null != comment.DurableId)
				oCommentObj.m_nDurableId = comment.DurableId;
			if(null != comment.Replies)
			{
				for(var  i = 0, length = comment.Replies.length; i < length; ++i)
					oCommentObj.Add_Reply(fInitCommentData(comment.Replies[i]));
			}
			return oCommentObj;
		};
		
		var oCommentsNewId = {};
		//меняем CDocumentContent на Document для возможности вставки комментариев в колонтитул и таблицу
		var isIntoShape = this.Document && this.Document.Parent && this.Document.Parent instanceof AscFormat.CShape;
		var isIntoDocumentContent = this.Document instanceof CDocumentContent;
		var document = this.Document && isIntoDocumentContent && !isIntoShape ? this.Document.LogicDocument : this.Document;
		for(var i in this.oReadResult.oComments)
		{
			if(this.oReadResult.oCommentsPlaces && this.oReadResult.oCommentsPlaces[i] && this.oReadResult.oCommentsPlaces[i].Start != null && this.oReadResult.oCommentsPlaces[i].End != null && document && document.Comments && isCopyPaste === true)
			{
				var oOldComment = this.oReadResult.oComments[i];
				
				var m_sQuoteText = this.oReadResult.oCommentsPlaces[i].QuoteText;
				if(m_sQuoteText)
					oOldComment.m_sQuoteText = m_sQuoteText;
				
				var oNewComment = new AscCommon.CComment(document.Comments, fInitCommentData(oOldComment))
				document.Comments.Add(oNewComment);
				oCommentsNewId[oOldComment.Id] = oNewComment;
			}
		}
		for(var commentIndex in this.oReadResult.oCommentsPlaces)
		{
			var item = this.oReadResult.oCommentsPlaces[commentIndex];
			var bToDelete = true;
			if(null != item.Start && null != item.End){
				var oCommentObj = oCommentsNewId[item.Start.Id];
				if(oCommentObj)
				{
					bToDelete = false;
					item.Start.oParaComment.SetCommentId(oCommentObj.Get_Id());
					item.End.oParaComment.SetCommentId(oCommentObj.Get_Id());
				}
			}
			if(bToDelete){
				if(null != item.Start && null != item.Start.oParent)
				{
					var oParent = item.Start.oParent;
					var oParaComment = item.Start.oParaComment;
					for (var i = OpenParStruct.prototype._GetContentLength(oParent) - 1; i >= 0; --i)
					{
					    if (oParaComment == OpenParStruct.prototype._GetFromContent(oParent, i)){
							OpenParStruct.prototype._removeFromContent(oParent, i, 1);
							break;
						}
					}
				}
				if(null != item.End && null != item.End.oParent)
				{
					var oParent = item.End.oParent;
					var oParaComment = item.End.oParaComment;
					for (var i = OpenParStruct.prototype._GetContentLength(oParent) - 1; i >= 0; --i)
					{
					    if (oParaComment == OpenParStruct.prototype._GetFromContent(oParent, i)){
							OpenParStruct.prototype._removeFromContent(oParent, i, 1);
							break;
						}
					}
				}
			}
		}
		//посылаем событие о добавлении комментариев
		if(api)
		{
			for(var i in oCommentsNewId)
			{
				var oNewComment = oCommentsNewId[i];
				oNewComment.CreateNewCommentsGuid();
				api.sync_AddComment( oNewComment.Id, oNewComment.Data );
			}
		}
		//remove bookmarks without end
		for(var bookmarkIndex in this.oReadResult.bookmarksStarted)
		{
			var elem = this.oReadResult.bookmarksStarted[bookmarkIndex];
			for (var i = 0; i < OpenParStruct.prototype._GetContentLength(elem.parent); ++i)
			{
				if (elem.bookmark === OpenParStruct.prototype._GetFromContent(elem.parent, i)){
					OpenParStruct.prototype._removeFromContent(elem.parent, i, 1);
					break;
				}
			}
		}
		for (var i = 0, length = this.oReadResult.aTableCorrect.length; i < length; ++i) {
			var table = this.oReadResult.aTableCorrect[i];
			table.ReIndexing(0);
			
			//при вставке вложенных таблиц из документов в презентации и создании cDocumentContent не проставляется CStyles
			if(editor && !editor.isDocumentEditor && !table.Parent.Styles)
			{
				var oldStyles = table.Parent.Styles;
				table.Parent.Styles = this.Document.Styles;
				table.Correct_BadTable();
				table.Parent.Styles = oldStyles;
			}
			else
			{
				table.Correct_BadTable();
			}
		}
		//чтобы удалялся stream с бинарником
		pptx_content_loader.Clear(true);
        return { content: aContent, fonts: aPrepeareFonts, images: aPrepeareImages, bAddNewStyles: addNewStyles, aPastedImages: aPastedImages, bInBlock: bInBlock };
    }
}
function BinaryStyleTableReader(doc, oReadResult, stream)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
    this.stream = stream;
    this.bcr = new Binary_CommonReader(this.stream);
    this.brPrr = new Binary_rPrReader(this.Document, this.oReadResult, this.stream);
    this.bpPrr = new Binary_pPrReader(this.Document, this.oReadResult, this.stream);
	this.btblPrr = new Binary_tblPrReader(this.Document, this.oReadResult, this.stream);
    this.Read = function()
    {
        var oThis = this;
        return this.bcr.ReadTable(function(t, l){
                return oThis.ReadStyleTableContent(t,l);
            });
    };
    this.ReadStyleTableContent = function(type, length)
    {
        var res = c_oSerConstants.ReadOk;
        if(c_oSer_st.Styles == type)
        {
            var oThis = this;
            res = this.bcr.Read1(length, function(t,l){
                    return oThis.ReadStyle(t,l);
                });
        }
        else if(c_oSer_st.DefpPr == type)
        {
            var ParaPr = new CParaPr();
            res = this.bpPrr.Read(length, ParaPr);
			this.oReadResult.DefpPr = ParaPr;
        }
        else if(c_oSer_st.DefrPr == type)
        {
            var TextPr = new CTextPr();
            res = this.brPrr.Read(length, TextPr, null);
			this.oReadResult.DefrPr = TextPr;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadStyle = function(type, length)
    {
        var res = c_oSerConstants.ReadOk;
        if(c_oSer_sts.Style == type)
        {
            var oThis = this;
            var oNewStyle = new CStyle(null, null, null, null);
            var oNewId = {};
            res = this.bcr.Read1(length, function(t, l){
                    return oThis.ReadStyleContent(t, l, oNewStyle, oNewId);
                });
            if(c_oSerConstants.ReadOk != res)
                return res;
            if(null != oNewId.id)
				this.oReadResult.styles[oNewId.id] = {style: oNewStyle, param: oNewId};
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadStyleContent = function(type, length, style, oId)
    {
        var res = c_oSerConstants.ReadOk;
		var oThis = this;
        if(c_oSer_sts.Style_Name == type)
            style.Set_Name(this.stream.GetString2LE(length));
        else if(c_oSer_sts.Style_Id == type)
            oId.id = this.stream.GetString2LE(length);
        else if(c_oSer_sts.Style_Type == type)
		{
			var nStyleType = styletype_Paragraph;
			switch(this.stream.GetUChar())
			{
				case c_oSer_StyleType.Character: nStyleType = styletype_Character;break;
				case c_oSer_StyleType.Numbering: nStyleType = styletype_Numbering;break;
				case c_oSer_StyleType.Paragraph: nStyleType = styletype_Paragraph;break;
				case c_oSer_StyleType.Table: nStyleType = styletype_Table;break;
			}
            style.Set_Type(nStyleType);
		}
        else if(c_oSer_sts.Style_Default == type)
            oId.def = this.stream.GetBool();
        else if(c_oSer_sts.Style_BasedOn == type)
            style.Set_BasedOn(this.stream.GetString2LE(length));
        else if(c_oSer_sts.Style_Next == type)
            style.Set_Next(this.stream.GetString2LE(length));
		else if(c_oSer_sts.Style_Link == type)
			style.Set_Link(this.stream.GetString2LE(length));
        else if(c_oSer_sts.Style_qFormat == type)
            style.Set_QFormat(this.stream.GetBool());
        else if(c_oSer_sts.Style_uiPriority == type)
            style.Set_UiPriority(this.stream.GetULongLE());
        else if(c_oSer_sts.Style_hidden == type)
            style.Set_Hidden(this.stream.GetBool());
        else if(c_oSer_sts.Style_semiHidden == type)
            style.Set_SemiHidden(this.stream.GetBool());
        else if(c_oSer_sts.Style_unhideWhenUsed == type)
            style.Set_UnhideWhenUsed(this.stream.GetBool());
        else if(c_oSer_sts.Style_TextPr == type)
        {
			var oNewTextPr = new CTextPr();
            res = this.brPrr.Read(length, oNewTextPr, null);
			style.Set_TextPr(oNewTextPr);
        }
        else if(c_oSer_sts.Style_ParaPr == type)
        {
			var oNewParaPr = new CParaPr();
            res = this.bpPrr.Read(length, oNewParaPr, null);
			style.ParaPr = oNewParaPr;
			this.oReadResult.aPostOpenStyleNumCallbacks.push(function(){
				style.Set_ParaPr(oNewParaPr);
			});
        }
		else if(c_oSer_sts.Style_TablePr == type)
        {
			var oNewTablePr = new CTablePr();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.btblPrr.Read_tblPr(t,l, oNewTablePr);
            });
			style.Set_TablePr(oNewTablePr);
		}
		else if(c_oSer_sts.Style_RowPr == type)
        {
			var oNewTableRowPr = new CTableRowPr();
            res = this.bcr.Read2(length, function(t, l){
                return oThis.btblPrr.Read_RowPr(t,l, oNewTableRowPr);
            });
			style.Set_TableRowPr(oNewTableRowPr);
		}
		else if(c_oSer_sts.Style_CellPr == type)
        {
			var oNewTableCellPr = new CTableCellPr();
            res = this.bcr.Read2(length, function(t, l){
                return oThis.btblPrr.Read_CellPr(t,l, oNewTableCellPr);
            });
            style.Set_TableCellPr(oNewTableCellPr);
		}
		else if(c_oSer_sts.Style_TblStylePr == type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadTblStylePr(t,l, style);
            });
		}
		else if(c_oSer_sts.Style_CustomStyle == type)
		{
			style.SetCustom(this.stream.GetBool());
		}
		// else if(c_oSer_sts.Style_Aliases == type)
		// {
		// 	style.Aliases = this.stream.GetString2LE(length);
		// }
		// else if(c_oSer_sts.Style_AutoRedefine == type)
		// {
		// 	style.AutoRedefine = this.stream.GetBool();
		// }
		// else if(c_oSer_sts.Style_Locked == type)
		// {
		// 	style.Locked = this.stream.GetBool();
		// }
		// else if(c_oSer_sts.Style_Personal == type)
		// {
		// 	style.Personal = this.stream.GetBool();
		// }
		// else if(c_oSer_sts.Style_PersonalCompose == type)
		// {
		// 	style.PersonalCompose = this.stream.GetBool();
		// }
		// else if(c_oSer_sts.Style_PersonalReply == type)
		// {
		// 	style.PersonalReply = this.stream.GetBool();
		// }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadTblStylePr = function(type, length, style)
    {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
        if(c_oSerProp_tblStylePrType.TblStylePr == type)
        {
			var oRes = {nType: null};
			var oNewTableStylePr = new CTableStylePr();
			res = this.bcr.Read1(length, function(t, l){
					return oThis.ReadTblStyleProperty(t, l, oNewTableStylePr, oRes);
				});
			if(null != oRes.nType)
			{
				switch(oRes.nType)
				{
					case ETblStyleOverrideType.tblstyleoverridetypeBand1Horz: style.TableBand1Horz = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeBand1Vert: style.TableBand1Vert = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeBand2Horz: style.TableBand2Horz = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeBand2Vert: style.TableBand2Vert = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeFirstCol: style.TableFirstCol = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeFirstRow: style.TableFirstRow = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeLastCol: style.TableLastCol = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeLastRow: style.TableLastRow = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeNeCell: style.TableTRCell = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeNwCell: style.TableTLCell = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeSeCell: style.TableBRCell = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeSwCell: style.TableBLCell = oNewTableStylePr;break;
					case ETblStyleOverrideType.tblstyleoverridetypeWholeTable: style.TableWholeTable = oNewTableStylePr;break;
				}
			}
			this.oReadResult.aPostOpenStyleNumCallbacks.push(function(){
				if(null != oRes.nType)
				{
					switch(oRes.nType)
					{
						case ETblStyleOverrideType.tblstyleoverridetypeBand1Horz: style.Set_TableBand1Horz(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeBand1Vert: style.Set_TableBand1Vert(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeBand2Horz: style.Set_TableBand2Horz(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeBand2Vert: style.Set_TableBand2Vert(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeFirstCol: style.Set_TableFirstCol(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeFirstRow: style.Set_TableFirstRow(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeLastCol: style.Set_TableLastCol(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeLastRow: style.Set_TableLastRow(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeNeCell: style.Set_TableTRCell(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeNwCell: style.Set_TableTLCell(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeSeCell: style.Set_TableBRCell(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeSwCell: style.Set_TableBLCell(oNewTableStylePr);break;
						case ETblStyleOverrideType.tblstyleoverridetypeWholeTable: style.Set_TableWholeTable(oNewTableStylePr);break;
					}
				}
			});
			if(c_oSerConstants.ReadOk != res)
				return res;
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
	};
	this.ReadTblStyleProperty = function(type, length, oNewTableStylePr, oRes)
    {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
        if(c_oSerProp_tblStylePrType.Type == type)
			oRes.nType = this.stream.GetUChar();
		else if(c_oSerProp_tblStylePrType.RunPr == type)
		{
            res = this.brPrr.Read(length, oNewTableStylePr.TextPr, null);
		}
		else if(c_oSerProp_tblStylePrType.ParPr == type)
		{
            res = this.bpPrr.Read(length, oNewTableStylePr.ParaPr, null);
		}
		else if(c_oSerProp_tblStylePrType.TblPr == type)
		{
            res = this.bcr.Read1(length, function(t, l){
                return oThis.btblPrr.Read_tblPr(t,l, oNewTableStylePr.TablePr);
            });
		}
		else if(c_oSerProp_tblStylePrType.TrPr == type)
		{
            res = this.bcr.Read2(length, function(t, l){
                return oThis.btblPrr.Read_RowPr(t,l, oNewTableStylePr.TableRowPr);
            });
		}
		else if(c_oSerProp_tblStylePrType.TcPr == type)
		{
            res = this.bcr.Read2(length, function(t, l){
                return oThis.btblPrr.Read_CellPr(t,l, oNewTableStylePr.TableCellPr);
            });
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
	};
};
function Binary_pPrReader(doc, oReadResult, stream)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
    this.stream = stream;
    this.pPr;
    this.paragraph;
    this.bcr = new Binary_CommonReader(this.stream);
    this.brPrr = new Binary_rPrReader(this.Document, this.oReadResult, this.stream);
    this.Read = function(stLen, pPr, par)
    {
        this.pPr = pPr;
        this.paragraph = par;
        var oThis = this;
        return this.bcr.Read2(stLen, function(type, length){
                return oThis.ReadContent(type, length);
            });
    };
    this.ReadContent = function(type, length)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        var pPr = this.pPr;
        switch(type)
        {
            case c_oSerProp_pPrType.contextualSpacing:
				pPr.ContextualSpacing = this.stream.GetBool();
                break;
            case c_oSerProp_pPrType.Ind:
                res = this.bcr.Read2(length, function(t, l){
                        return oThis.ReadInd(t, l, pPr.Ind);
                    });
                break;
            case c_oSerProp_pPrType.Jc:
				pPr.Jc = this.stream.GetUChar();
                break;
            case c_oSerProp_pPrType.KeepLines:
				pPr.KeepLines = this.stream.GetBool();
                break;
            case c_oSerProp_pPrType.KeepNext:
				pPr.KeepNext = this.stream.GetBool();
                break;
            case c_oSerProp_pPrType.PageBreakBefore:
				pPr.PageBreakBefore = this.stream.GetBool();
                break;
            case c_oSerProp_pPrType.Spacing:
            	var spacingTmp = {lineTwips: null};
                res = this.bcr.Read2(length, function(t, l){
                        return oThis.ReadSpacing(t, l, pPr.Spacing, spacingTmp);
                    });
				if (null !== spacingTmp.lineTwips) {
					if (spacingTmp.lineTwips < 0) {
						spacingTmp.lineTwips = -spacingTmp.lineTwips;
						pPr.Spacing.LineRule = Asc.linerule_Exact;
					}
					if (Asc.linerule_Auto == pPr.Spacing.LineRule) {
						pPr.Spacing.Line = spacingTmp.lineTwips / 240;
					} else {
						pPr.Spacing.Line = g_dKoef_twips_to_mm * spacingTmp.lineTwips;
					}
				}
                break;
            case c_oSerProp_pPrType.Shd:
                pPr.Shd = new CDocumentShd();
				var themeColor = {Auto: null, Color: null, Tint: null, Shade: null};
                res = this.bcr.Read2(length, function(t, l){
                        return oThis.bcr.ReadShd(t, l, pPr.Shd, themeColor);
                    });
				if(true == themeColor.Auto && null != pPr.Shd.Color)
					pPr.Shd.Color.Auto = true;//todo менять полностью цвет
				var unifill = CreateThemeUnifill(themeColor.Color, themeColor.Tint, themeColor.Shade);
				if(null != unifill)
					pPr.Shd.Unifill = unifill;
				else if (null != pPr.Shd.Color && !pPr.Shd.Color.Auto)
				    pPr.Shd.Unifill = AscFormat.CreteSolidFillRGB(pPr.Shd.Color.r, pPr.Shd.Color.g, pPr.Shd.Color.b);
                break;
            case c_oSerProp_pPrType.WidowControl:
				pPr.WidowControl = this.stream.GetBool();
                break;
            case c_oSerProp_pPrType.Tab:
                pPr.Tabs = new CParaTabs();
                res = this.bcr.Read2(length, function(t, l){
                        return oThis.ReadTabs(t, l, pPr.Tabs);
                    });
                break;
            case c_oSerProp_pPrType.ParaStyle:
                var ParaStyle = this.stream.GetString2LE(length);
				this.oReadResult.paraStyles.push({pPr: pPr, style: ParaStyle});
                break;
            case c_oSerProp_pPrType.numPr:
                var numPr = new CNumPr();
				numPr.NumId = undefined;
				numPr.Lvl = undefined;
                res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadNumPr(t, l, numPr);
                });
                if(null != numPr.NumId || null != numPr.Lvl)
                {
					if(null != numPr.NumId)
						this.oReadResult.paraNumPrs.push(numPr);
					pPr.NumPr = numPr;
                }
                break;
            case c_oSerProp_pPrType.pBdr:
                res = this.bcr.Read1(length, function(t, l){
                        return oThis.ReadBorders(t, l, pPr.Brd);
                    });
                break;
            case c_oSerProp_pPrType.pPr_rPr:
                if(null != this.paragraph)
				{
                    var EndRun = this.paragraph.GetParaEndRun();
                    var rPr = this.paragraph.TextPr.Value;
                    res = this.brPrr.Read(length, rPr, EndRun);
                    var trackRevision = this.brPrr.trackRevision;
                    if (trackRevision) {
                        if(trackRevision.del) {
                            EndRun.SetReviewTypeWithInfo(reviewtype_Remove, trackRevision.del, false);
                        } else if(trackRevision.ins) {
                            EndRun.SetReviewTypeWithInfo(reviewtype_Add, trackRevision.ins, false);
                        } 
                    }
                    this.paragraph.TextPr.Apply_TextPr(rPr);
				}
				else
					res = c_oSerConstants.ReadUnknown;
                break;
			case c_oSerProp_pPrType.FramePr:
				pPr.FramePr = new CFramePr();
                res = this.bcr.Read2(length, function(t, l){
                        return oThis.ReadFramePr(t, l, pPr.FramePr);
                    });
                break;
			case c_oSerProp_pPrType.SectPr:
				if(null != this.paragraph && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting()))
				{
					var oNewSectionPr = new CSectionPr(this.oReadResult.logicDocument);
					var oAdditional = {EvenAndOddHeaders: null};
					res = this.bcr.Read1(length, function(t, l){
							return oThis.Read_SecPr(t, l, oNewSectionPr, oAdditional);
						});
					this.paragraph.Set_SectionPr(oNewSectionPr);
				}
				else
					res = c_oSerConstants.ReadUnknown;
                break;
            case c_oSerProp_pPrType.numPr_Ins:
                res = c_oSerConstants.ReadUnknown;//todo
                break;
            case c_oSerProp_pPrType.pPrChange:
                if(null != this.paragraph && this.oReadResult.checkReadRevisions() && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting())) {
                    var pPrChange = new CParaPr();
                    var reviewInfo = new CReviewInfo();
                    var bpPrr = new Binary_pPrReader(this.Document, this.oReadResult, this.stream);
                    res = this.bcr.Read1(length, function(t, l){
                        return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {bpPrr: bpPrr, pPr: pPrChange});
                    });
                    this.paragraph.SetPrChange(pPrChange, reviewInfo);
                } else {
                    res = c_oSerConstants.ReadUnknown;
                }
                break;
			case c_oSerProp_pPrType.outlineLvl:
				pPr.OutlineLvl = this.stream.GetLongLE();
				break;
            default:
                res = c_oSerConstants.ReadUnknown;
                break;
        }
        return res;
    };
    this.ReadBorder = function(type, length, Border)
    {
        var res = c_oSerConstants.ReadOk;
		var oThis = this;
        if( c_oSerBorderType.Color === type )
        {
            Border.Color = this.bcr.ReadColor();
        }
        else if( c_oSerBorderType.Space === type )
        {
            Border.Space = this.bcr.ReadDouble();
        }
		else if( c_oSerBorderType.SpacePoint === type )
		{
			Border.Space = g_dKoef_pt_to_mm * this.stream.GetULongLE();
		}
        else if( c_oSerBorderType.Size === type )
        {
            Border.Size = this.bcr.ReadDouble();
        }
		else if( c_oSerBorderType.Size8Point === type )
		{
			Border.Size = g_dKoef_pt_to_mm * this.stream.GetULongLE() / 8;
		}
        else if( c_oSerBorderType.Value === type )
        {
            Border.Value = this.stream.GetUChar();
        }
		else if( c_oSerBorderType.ColorTheme === type )
        {
			var themeColor = {Auto: null, Color: null, Tint: null, Shade: null};
			res = this.bcr.Read2(length, function(t, l){
				return oThis.bcr.ReadColorTheme(t, l, themeColor);
			});
			if(true == themeColor.Auto)
				Border.Color = new CDocumentColor(0, 0, 0, true);
			var unifill = CreateThemeUnifill(themeColor.Color, themeColor.Tint, themeColor.Shade);
			if(null != unifill)
				Border.Unifill = unifill;
			else if (null != Border.Color && !Border.Color.Auto)
			    Border.Unifill = AscFormat.CreteSolidFillRGB(Border.Color.r, Border.Color.g, Border.Color.b);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.NormalizeBorder = function(border)
    {
        if(null == border.Color)
            border.Color = new CDocumentColor(0, 0, 0, true);
        else
            border.Color = new CDocumentColor(border.Color.r, border.Color.g, border.Color.b, border.Color.Auto);
        if(null == border.Space)
            border.Space = 0;
        if(null == border.Size)
            border.Size = 0.5 * g_dKoef_pt_to_mm;
        if(null == border.Value)
            border.Value = border_None;
        return border;
    };
    this.ReadBorders = function(type, length, Borders)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        var oNewBorber = new CDocumentBorder();
        if( c_oSerBordersType.left === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadBorder(t, l, oNewBorber);
            });
            if(null != oNewBorber.Value)
                Borders.Left = this.NormalizeBorder(oNewBorber);
        }
        else if( c_oSerBordersType.top === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadBorder(t, l, oNewBorber);
            });
            if(null != oNewBorber.Value)
                Borders.Top = this.NormalizeBorder(oNewBorber);
        }
        else if( c_oSerBordersType.right === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadBorder(t, l, oNewBorber);
            });
            if(null != oNewBorber.Value)
                Borders.Right = this.NormalizeBorder(oNewBorber);
        }
        else if( c_oSerBordersType.bottom === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadBorder(t, l, oNewBorber);
            });
            if(null != oNewBorber.Value)
                Borders.Bottom = this.NormalizeBorder(oNewBorber);
        }
        else if( c_oSerBordersType.insideV === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadBorder(t, l, oNewBorber);
            });
            if(null != oNewBorber.Value)
                Borders.InsideV = this.NormalizeBorder(oNewBorber);
        }
        else if( c_oSerBordersType.insideH === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadBorder(t, l, oNewBorber);
            });
            if(null != oNewBorber.Value)
                Borders.InsideH = this.NormalizeBorder(oNewBorber);
            
        }
        else if( c_oSerBordersType.between === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadBorder(t, l, oNewBorber);
            });
            if(null != oNewBorber.Value)
                Borders.Between = this.NormalizeBorder(oNewBorber);
            
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadInd = function(type, length, Ind)
    {
        var res = c_oSerConstants.ReadOk;
        switch(type)
        {
            case c_oSerProp_pPrType.Ind_Left: Ind.Left = this.bcr.ReadDouble();break;
            case c_oSerProp_pPrType.Ind_Right: Ind.Right = this.bcr.ReadDouble();break;
            case c_oSerProp_pPrType.Ind_FirstLine: Ind.FirstLine = this.bcr.ReadDouble();break;
			case c_oSerProp_pPrType.Ind_LeftTwips: Ind.Left = g_dKoef_twips_to_mm * this.stream.GetULongLE();break;
			case c_oSerProp_pPrType.Ind_RightTwips: Ind.Right = g_dKoef_twips_to_mm * this.stream.GetULongLE();break;
			case c_oSerProp_pPrType.Ind_FirstLineTwips: Ind.FirstLine = g_dKoef_twips_to_mm * this.stream.GetULongLE();break;
            default:
                res = c_oSerConstants.ReadUnknown;
                break;
        }
        return res;
    };
    this.ReadSpacing = function(type, length, Spacing, spacingTmp)
    {
        var res = c_oSerConstants.ReadOk;
        switch(type)
        {
            case c_oSerProp_pPrType.Spacing_Line: Spacing.Line = this.bcr.ReadDouble();break;
			case c_oSerProp_pPrType.Spacing_LineTwips: spacingTmp.lineTwips = this.stream.GetULongLE();break;
            case c_oSerProp_pPrType.Spacing_LineRule: Spacing.LineRule = this.stream.GetUChar();break;
            case c_oSerProp_pPrType.Spacing_Before: Spacing.Before = this.bcr.ReadDouble();break;
			case c_oSerProp_pPrType.Spacing_BeforeTwips: Spacing.Before = g_dKoef_twips_to_mm * this.stream.GetULongLE();break;
            case c_oSerProp_pPrType.Spacing_After: Spacing.After = this.bcr.ReadDouble();break;
			case c_oSerProp_pPrType.Spacing_AfterTwips: Spacing.After = g_dKoef_twips_to_mm * this.stream.GetULongLE();break;
            case c_oSerProp_pPrType.Spacing_BeforeAuto: Spacing.BeforeAutoSpacing = (this.stream.GetUChar() != 0);break;
            case c_oSerProp_pPrType.Spacing_AfterAuto: Spacing.AfterAutoSpacing = (this.stream.GetUChar() != 0);break;
            default:
                res = c_oSerConstants.ReadUnknown;
                break;
        }
        return res;
    };
    this.ReadTabs = function(type, length, Tabs)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if(c_oSerProp_pPrType.Tab_Item == type)
        {
            var oNewTab = new CParaTab();
            res = this.bcr.Read2(length, function(t, l){
                        return oThis.ReadTabItem(t, l, oNewTab);
                    });
            if(null != oNewTab.Pos && null != oNewTab.Value && tab_Bar != oNewTab.Value && tab_Decimal != oNewTab.Value)
            {
				if (4 === oNewTab.Value) {
					oNewTab.Value = tab_Right;
				} else if (6 === oNewTab.Value) {
					oNewTab.Value = tab_Left;
				}
                Tabs.Add(oNewTab);
            }
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadTabItem = function(type, length, tab)
    {
        var res = c_oSerConstants.ReadOk;
        if(c_oSerProp_pPrType.Tab_Item_Val === type)
			tab.Value = this.stream.GetUChar();
		else if(c_oSerProp_pPrType.Tab_Item_Val_deprecated === type) {
			switch (this.stream.GetUChar())
			{
				case 1 : tab.Value = tab_Right;break;
				case 2 : tab.Value = tab_Center;break;
				case 3 : tab.Value = tab_Clear;break;
				default: tab.Value = tab_Left;
			}
		} else if(c_oSerProp_pPrType.Tab_Item_Pos === type)
			tab.Pos = this.bcr.ReadDouble();
		else if(c_oSerProp_pPrType.Tab_Item_PosTwips === type)
			tab.Pos = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		else if(c_oSerProp_pPrType.Tab_Item_Leader === type)
			tab.Leader = this.stream.GetUChar();
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadNumPr = function(type, length, numPr)
    {
        var res = c_oSerConstants.ReadOk;
        if(c_oSerProp_pPrType.numPr_lvl == type)
            numPr.Lvl = this.stream.GetULongLE();
        else if(c_oSerProp_pPrType.numPr_id == type)
            numPr.NumId = this.stream.GetULongLE();
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadFramePr = function(type, length, oFramePr)
    {
        var res = c_oSerConstants.ReadOk;
        if(c_oSer_FramePrType.DropCap == type)
            oFramePr.DropCap = this.stream.GetUChar();
		else if(c_oSer_FramePrType.H == type)
            oFramePr.H = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		else if(c_oSer_FramePrType.HAnchor == type)
            oFramePr.HAnchor = this.stream.GetUChar();
		else if(c_oSer_FramePrType.HRule == type)
            oFramePr.HRule = this.stream.GetUChar();
		else if(c_oSer_FramePrType.HSpace == type)
            oFramePr.HSpace = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		else if(c_oSer_FramePrType.Lines == type)
            oFramePr.Lines = this.stream.GetULongLE();
		else if(c_oSer_FramePrType.VAnchor == type)
            oFramePr.VAnchor = this.stream.GetUChar();
		else if(c_oSer_FramePrType.VSpace == type)
            oFramePr.VSpace = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		else if(c_oSer_FramePrType.W == type)
            oFramePr.W = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		else if(c_oSer_FramePrType.Wrap == type){
			var nEditorWrap = wrap_None;
			switch(this.stream.GetUChar()){
				case EWrap.wrapAround: nEditorWrap = wrap_Around;break;
				case EWrap.wrapAuto: nEditorWrap = wrap_Auto;break;
				case EWrap.wrapNone: nEditorWrap = wrap_None;break;
				case EWrap.wrapNotBeside: nEditorWrap = wrap_NotBeside;break;
				case EWrap.wrapThrough: nEditorWrap = wrap_Through;break;
				case EWrap.wrapTight: nEditorWrap = wrap_Tight;break;
			}
			oFramePr.Wrap = nEditorWrap;
		}
		else if(c_oSer_FramePrType.X == type) {
			var xTw = this.stream.GetULongLE();
			if (-4 === xTw) {
				oFramePr.XAlign = c_oAscXAlign.Center;
			} else {
				oFramePr.X = g_dKoef_twips_to_mm * xTw;
			}
		} else if(c_oSer_FramePrType.XAlign == type)
            oFramePr.XAlign = this.stream.GetUChar();
		else if(c_oSer_FramePrType.Y == type) {
			var yTw = this.stream.GetULongLE();
			if (-4 === yTw) {
				oFramePr.YAlign = c_oAscYAlign.Top;
			} else {
				oFramePr.Y = g_dKoef_twips_to_mm * yTw;
			}
		} else if(c_oSer_FramePrType.YAlign == type)
            oFramePr.YAlign = this.stream.GetUChar();
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.Read_SecPr = function(type, length, oSectPr, oAdditional)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerProp_secPrType.pgSz === type )
        {
            var oSize = {W: null, H: null, Orientation: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.Read_pgSz(t, l, oSize);
            });
            if(null != oSize.W && null != oSize.H)
            {
                oSectPr.SetPageSize(oSize.W, oSize.H);
            }
            if(null != oSize.Orientation)
                oSectPr.SetOrientation(oSize.Orientation, false);
        }
        else if( c_oSerProp_secPrType.pgMar === type )
        {
			var oMar = {L: null, T: null, R: null, B: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.Read_pgMar(t, l, oSectPr, oMar, oAdditional);
            });
			if(null != oMar.L && null != oMar.T && null != oMar.R && null != oMar.B)
				oSectPr.SetPageMargins(oMar.L, oMar.T, oMar.R, oMar.B);
        }
        else if( c_oSerProp_secPrType.setting === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.Read_setting(t, l, oSectPr, oAdditional);
            });
        }
		else if( c_oSerProp_secPrType.headers === type )
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.Read_pgHdrFtr(t, l, oSectPr, oThis.oReadResult.headers, true);
            });
        }
		else if( c_oSerProp_secPrType.footers === type )
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.Read_pgHdrFtr(t, l, oSectPr, oThis.oReadResult.footers, false);
            });
        }
		else if( c_oSerProp_secPrType.pageNumType === type )
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.Read_pageNumType(t, l, oSectPr);
            });
        }
        else if( c_oSerProp_secPrType.sectPrChange === type )
            res = c_oSerConstants.ReadUnknown;//todo
        else if( c_oSerProp_secPrType.cols === type ) {
            //todo clear;
            res = this.bcr.Read1(length, function(t, l){
                return oThis.Read_cols(t, l, oSectPr);
            });
        }
		else if( c_oSerProp_secPrType.pgBorders === type ) {
			res = this.bcr.Read1(length, function(t, l){
				return oThis.Read_pgBorders(t, l, oSectPr.Borders);
			});
		}
		else if( c_oSerProp_secPrType.footnotePr === type ) {
			var props = {Format: null, restart: null, start: null, pos: null};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadFootnotePr(t, l, props);
			});
			if (null != props.Format) {
				oSectPr.SetFootnoteNumFormat(props.Format);
			}
			if (null != props.restart) {
				oSectPr.SetFootnoteNumRestart(props.restart);
			}
			if (null != props.start) {
				oSectPr.SetFootnoteNumStart(props.start);
			}
			if (null != props.pos) {
				oSectPr.SetFootnotePos(props.pos);
			}
		} else if( c_oSerProp_secPrType.rtlGutter === type ) {
			oSectPr.SetGutterRTL(this.stream.GetBool());
		} else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadFootnotePr = function(type, length, props) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerNotes.PrFmt === type) {
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadNumFmt(t, l, props);
			});
		} else if (c_oSerNotes.PrRestart === type) {
			props.restart = this.stream.GetByte();
		} else if (c_oSerNotes.PrStart === type) {
			props.start = this.stream.GetULongLE();
		} else if (c_oSerNotes.PrFntPos === type) {
			props.pos = this.stream.GetByte();
		} else if (c_oSerNotes.PrRef === type) {
			this.oReadResult.footnoteRefs.push(this.stream.GetULongLE());
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadNumFmt = function(type, length, props) {
		var res = c_oSerConstants.ReadOk;
		if (c_oSerNumTypes.NumFmtVal === type) {
			switch (this.stream.GetByte()) {
				case 48: props.Format = Asc.c_oAscNumberingFormat.None; break;
				case 5: props.Format = Asc.c_oAscNumberingFormat.Bullet; break;
				case 13: props.Format = Asc.c_oAscNumberingFormat.Decimal; break;
				case 47: props.Format = Asc.c_oAscNumberingFormat.LowerRoman; break;
				case 61: props.Format = Asc.c_oAscNumberingFormat.UpperRoman; break;
				case 46: props.Format = Asc.c_oAscNumberingFormat.LowerLetter; break;
				case 60: props.Format = Asc.c_oAscNumberingFormat.UpperLetter; break;
				case 21: props.Format = Asc.c_oAscNumberingFormat.DecimalZero; break;
				case 14: props.Format = Asc.c_oAscNumberingFormat.DecimalEnclosedCircle; break;
				case 15: props.Format = Asc.c_oAscNumberingFormat.DecimalEnclosedCircle; break;
				default: props.Format = Asc.c_oAscNumberingFormat.Decimal; break;
			}
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
    this.Read_setting = function(type, length, oSectPr, oAdditional)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerProp_secPrSettingsType.titlePg === type )
        {
            oSectPr.Set_TitlePage(this.stream.GetBool());
        }
        else if( c_oSerProp_secPrSettingsType.EvenAndOddHeaders === type )
        {
            oAdditional.EvenAndOddHeaders = this.stream.GetBool();
        }
		else if( c_oSerProp_secPrSettingsType.SectionType === type && typeof c_oAscSectionBreakType != "undefined" )
        {
			var nEditorType = null;
			switch(this.stream.GetByte())
			{
				case ESectionMark.sectionmarkContinuous: nEditorType = c_oAscSectionBreakType.Continuous;break;
				case ESectionMark.sectionmarkEvenPage: nEditorType = c_oAscSectionBreakType.EvenPage;break;
				case ESectionMark.sectionmarkNextColumn: nEditorType = c_oAscSectionBreakType.Column;break;
				case ESectionMark.sectionmarkNextPage: nEditorType = c_oAscSectionBreakType.NextPage;break;
				case ESectionMark.sectionmarkOddPage: nEditorType = c_oAscSectionBreakType.OddPage;break;
			}
			if(null != nEditorType)
				oSectPr.Set_Type(nEditorType);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
    this.Read_pgSz = function(type, length, oSize)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSer_pgSzType.Orientation === type )
        {
            oSize.Orientation = this.stream.GetUChar();
        }
        else if( c_oSer_pgSzType.W === type )
        {
            oSize.W = this.bcr.ReadDouble();
        }
		else if( c_oSer_pgSzType.WTwips === type )
		{
			oSize.W = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
        else if( c_oSer_pgSzType.H === type )
        {
            oSize.H = this.bcr.ReadDouble();
        }
		else if( c_oSer_pgSzType.HTwips === type )
		{
			oSize.H = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
    this.Read_pgMar = function(type, length, oSectPr, oMar, oAdditional)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSer_pgMarType.Left === type )
        {
            oMar.L = this.bcr.ReadDouble();
        }
		else if( c_oSer_pgMarType.LeftTwips === type )
		{
			oMar.L = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
        else if( c_oSer_pgMarType.Top === type )
        {
            oMar.T = this.bcr.ReadDouble();
        }
		else if( c_oSer_pgMarType.TopTwips === type )
		{
			oMar.T = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
        else if( c_oSer_pgMarType.Right === type )
        {
            oMar.R = this.bcr.ReadDouble();
        }
		else if( c_oSer_pgMarType.RightTwips === type )
		{
			oMar.R = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
        else if( c_oSer_pgMarType.Bottom === type )
        {
            oMar.B = this.bcr.ReadDouble();
        }
		else if( c_oSer_pgMarType.BottomTwips === type )
		{
			oMar.B = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else if( c_oSer_pgMarType.Header === type )
        {
			oSectPr.SetPageMarginHeader(this.bcr.ReadDouble());
        }
		else if( c_oSer_pgMarType.HeaderTwips === type )
		{
			oSectPr.SetPageMarginHeader(g_dKoef_twips_to_mm * this.stream.GetULongLE());
		}
		else if( c_oSer_pgMarType.Footer === type )
        {
			oSectPr.SetPageMarginFooter(this.bcr.ReadDouble());
        }
		else if( c_oSer_pgMarType.FooterTwips === type )
		{
			oSectPr.SetPageMarginFooter(g_dKoef_twips_to_mm * this.stream.GetULongLE());
		}
		else if( c_oSer_pgMarType.GutterTwips === type )
		{
			oSectPr.SetGutter(g_dKoef_twips_to_mm * this.stream.GetULongLE());
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
	this.Read_pgHdrFtr = function(type, length, oSectPr, aHdrFtr, bHeader)
    {
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerProp_secPrType.hdrftrelem === type )
        {
			var nIndex = this.stream.GetULongLE();
			if(nIndex >= 0 && nIndex < aHdrFtr.length)
			{
				var item = aHdrFtr[nIndex];
				if(bHeader){
					switch(item.type)
					{
						case c_oSerHdrFtrTypes.HdrFtr_First: oSectPr.Set_Header_First(item.elem);break;
						case c_oSerHdrFtrTypes.HdrFtr_Even: oSectPr.Set_Header_Even(item.elem);break;
						case c_oSerHdrFtrTypes.HdrFtr_Odd: oSectPr.Set_Header_Default(item.elem);break;
					}
				}
				else{
					switch(item.type)
					{
						case c_oSerHdrFtrTypes.HdrFtr_First: oSectPr.Set_Footer_First(item.elem);break;
						case c_oSerHdrFtrTypes.HdrFtr_Even: oSectPr.Set_Footer_Even(item.elem);break;
						case c_oSerHdrFtrTypes.HdrFtr_Odd: oSectPr.Set_Footer_Default(item.elem);break;
					}
				}
			}
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.Read_pageNumType = function(type, length, oSectPr)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerProp_secPrPageNumType.start === type )
        {
            oSectPr.Set_PageNum_Start(this.stream.GetULongLE());
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
    this.Read_cols = function(type, length, oSectPr)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if (c_oSerProp_Columns.EqualWidth === type) {
            oSectPr.Set_Columns_EqualWidth(this.stream.GetBool());
        } else if (c_oSerProp_Columns.Num === type) {
            oSectPr.Set_Columns_Num(this.stream.GetULongLE());
        } else if (c_oSerProp_Columns.Sep === type) {
            oSectPr.Set_Columns_Sep(this.stream.GetBool());
        } else if (c_oSerProp_Columns.Space === type) {
            oSectPr.Set_Columns_Space(g_dKoef_twips_to_mm * this.stream.GetULongLE());
        } else if (c_oSerProp_Columns.Column === type) {
            var col = new CSectionColumn();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.Read_col(t, l, col);
            });
            oSectPr.Set_Columns_Col(oSectPr.Columns.Cols.length, col.W, col.Space);
        } else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
    this.Read_col = function(type, length, col)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if (c_oSerProp_Columns.ColumnSpace === type) {
            col.Space = g_dKoef_twips_to_mm * this.stream.GetULongLE();
        } else if (c_oSerProp_Columns.ColumnW === type) {
            col.W = g_dKoef_twips_to_mm * this.stream.GetULongLE();
        } else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
	this.Read_pgBorders = function(type, length, pgBorders)
	{
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerPageBorders.Display === type) {
			pgBorders.Display = this.stream.GetUChar();
		} else if (c_oSerPageBorders.OffsetFrom === type) {
			pgBorders.OffsetFrom = this.stream.GetUChar();
		} else if (c_oSerPageBorders.ZOrder === type) {
			pgBorders.ZOrder = this.stream.GetUChar();
		} else if (c_oSerPageBorders.Bottom === type) {
			var oNewBorber = new CDocumentBorder();
			res = this.bcr.Read2(length, function(t, l){
				return oThis.Read_pgBorder(t, l, oNewBorber);
			});
			if(null != oNewBorber.Value)
				pgBorders.Bottom = this.NormalizeBorder(oNewBorber);
		} else if (c_oSerPageBorders.Left === type) {
			var oNewBorber = new CDocumentBorder();
			res = this.bcr.Read2(length, function(t, l){
				return oThis.Read_pgBorder(t, l, oNewBorber);
			});
			if(null != oNewBorber.Value)
				pgBorders.Left = this.NormalizeBorder(oNewBorber);
		} else if (c_oSerPageBorders.Right === type) {
			var oNewBorber = new CDocumentBorder();
			res = this.bcr.Read2(length, function(t, l){
				return oThis.Read_pgBorder(t, l, oNewBorber);
			});
			if(null != oNewBorber.Value)
				pgBorders.Right = this.NormalizeBorder(oNewBorber);
		} else if (c_oSerPageBorders.Top === type) {
			var oNewBorber = new CDocumentBorder();
			res = this.bcr.Read2(length, function(t, l){
				return oThis.Read_pgBorder(t, l, oNewBorber);
			});
			if(null != oNewBorber.Value)
				pgBorders.Top = this.NormalizeBorder(oNewBorber);
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	}
	this.Read_pgBorder = function(type, length, Border)
	{
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if( c_oSerPageBorders.Color === type )
		{
			Border.Color = this.bcr.ReadColor();
		}
		else if( c_oSerPageBorders.Space === type )
		{
			Border.Space = this.stream.GetLongLE() * g_dKoef_pt_to_mm;
		}
		else if( c_oSerPageBorders.Sz === type )
		{
			Border.Size = this.stream.GetLongLE() * g_dKoef_pt_to_mm / 8;
		}
		else if( c_oSerPageBorders.Val === type )
		{
			var val = this.stream.GetLongLE();
			if (-1 == val || 0 == val) {
				Border.Value = border_None;
			} else {
				Border.Value = border_Single;
			}
		}
		else if( c_oSerPageBorders.ColorTheme === type )
		{
			var themeColor = {Auto: null, Color: null, Tint: null, Shade: null};
			res = this.bcr.Read2(length, function(t, l){
				return oThis.bcr.ReadColorTheme(t, l, themeColor);
			});
			if(true == themeColor.Auto)
				Border.Color = new CDocumentColor(0, 0, 0, true);
			var unifill = CreateThemeUnifill(themeColor.Color, themeColor.Tint, themeColor.Shade);
			if(null != unifill)
				Border.Unifill = unifill;
			else if (null != Border.Color && !Border.Color.Auto)
				Border.Unifill = AscFormat.CreteSolidFillRGB(Border.Color.r, Border.Color.g, Border.Color.b);
		}
		else
			res = c_oSerConstants.ReadUnknown;
		return res;
	};
};
function Binary_rPrReader(doc, oReadResult, stream)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
    this.stream = stream;
    this.rPr;
    this.trackRevision = null;
    this.bcr = new Binary_CommonReader(this.stream);
    this.Read = function(stLen, rPr, run)
    {
        this.rPr = rPr;
        this.trackRevision = null;
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        res = this.bcr.Read2(stLen, function(type, length){
                return oThis.ReadContent(type, length, run);
            });
        return res;
    };
    this.ReadContent = function(type, length, run)
    {
        var res = c_oSerConstants.ReadOk;
		var oThis = this;
        var rPr = this.rPr;
        switch(type)
        {
            case c_oSerProp_rPrType.Bold:
                rPr.Bold = (this.stream.GetUChar() != 0);
                break;
            case c_oSerProp_rPrType.Italic:
                rPr.Italic = (this.stream.GetUChar() != 0);
                break;
            case c_oSerProp_rPrType.Underline:
                rPr.Underline = (this.stream.GetUChar() != 0);
                break;
            case c_oSerProp_rPrType.Strikeout:
                rPr.Strikeout = (this.stream.GetUChar() != 0);
                break;
            case c_oSerProp_rPrType.FontAscii:
                if ( undefined === rPr.RFonts )
                    rPr.RFonts = {};
                rPr.RFonts.Ascii = { Name : this.stream.GetString2LE(length), Index : -1 };
                break;
            case c_oSerProp_rPrType.FontHAnsi:
                if ( undefined === rPr.RFonts )
                    rPr.RFonts = {};
                rPr.RFonts.HAnsi = { Name : this.stream.GetString2LE(length), Index : -1 };
                break;
            case c_oSerProp_rPrType.FontAE:
                if ( undefined === rPr.RFonts )
                    rPr.RFonts = {};
                rPr.RFonts.EastAsia = { Name : this.stream.GetString2LE(length), Index : -1 };
                break;
            case c_oSerProp_rPrType.FontCS:
                if ( undefined === rPr.RFonts )
                    rPr.RFonts = {};
                rPr.RFonts.CS = { Name : this.stream.GetString2LE(length), Index : -1 };
                break;
            case c_oSerProp_rPrType.FontSize:
                rPr.FontSize = this.stream.GetULongLE() / 2;
                break;
            case c_oSerProp_rPrType.Color:
                rPr.Color = this.bcr.ReadColor();
                break;
            case c_oSerProp_rPrType.VertAlign:
                rPr.VertAlign = this.stream.GetUChar();
                break;
            case c_oSerProp_rPrType.HighLight:
                rPr.HighLight = this.bcr.ReadColor();
                break;
            case c_oSerProp_rPrType.HighLightTyped:
                var nHighLightTyped = this.stream.GetUChar();
                if(nHighLightTyped == AscCommon.c_oSer_ColorType.Auto)
                    rPr.HighLight = highlight_None;
                break;
			case c_oSerProp_rPrType.RStyle:
				var RunStyle = this.stream.GetString2LE(length);
				this.oReadResult.runStyles.push({pPr: rPr, style: RunStyle, run: run});
                break;
			case c_oSerProp_rPrType.Spacing:
				rPr.Spacing = this.bcr.ReadDouble();
                break;
			case c_oSerProp_rPrType.SpacingTwips:
				rPr.Spacing = g_dKoef_twips_to_mm * this.stream.GetULongLE();
				break;
			case c_oSerProp_rPrType.DStrikeout:
				rPr.DStrikeout = (this.stream.GetUChar() != 0);
                break;
			case c_oSerProp_rPrType.Caps:
				rPr.Caps = (this.stream.GetUChar() != 0);
                break;
			case c_oSerProp_rPrType.SmallCaps:
				rPr.SmallCaps = (this.stream.GetUChar() != 0);
                break;
			case c_oSerProp_rPrType.Position:
				rPr.Position = this.bcr.ReadDouble();
                break;
			case c_oSerProp_rPrType.PositionHps:
				rPr.Position = g_dKoef_pt_to_mm * this.stream.GetULongLE() / 2;
				break;
			case c_oSerProp_rPrType.FontHint:
				var nHint;
				switch(this.stream.GetUChar())
				{
					case EHint.hintCs: nHint = fonthint_CS;break;
					case EHint.hintEastAsia: nHint = fonthint_EastAsia;break;
					default : nHint = fonthint_Default;break;
				}
				rPr.RFonts.Hint = nHint;
                break;
			case c_oSerProp_rPrType.BoldCs:
				rPr.BoldCS = this.stream.GetBool();
                break;
			case c_oSerProp_rPrType.ItalicCs:
				rPr.ItalicCS = this.stream.GetBool();
                break;
			case c_oSerProp_rPrType.FontSizeCs:
				rPr.FontSizeCS = this.stream.GetULongLE() / 2;
                break;
			case c_oSerProp_rPrType.Cs:
				rPr.CS = this.stream.GetBool();
                break;
			case c_oSerProp_rPrType.Rtl:
				rPr.RTL = this.stream.GetBool();
                break;
			case c_oSerProp_rPrType.Lang:
				if(null == rPr.Lang)
					rPr.Lang = new CLang();
				var sLang = this.stream.GetString2LE(length);
				var nLcid = Asc.g_oLcidNameToIdMap[sLang];
				if(null != nLcid)
					rPr.Lang.Val = nLcid;
                break;
			case c_oSerProp_rPrType.LangBidi:
				if(null == rPr.Lang)
					rPr.Lang = new CLang();
				var sLang = this.stream.GetString2LE(length);
				var nLcid = Asc.g_oLcidNameToIdMap[sLang];
				if(null != nLcid)
					rPr.Lang.Bidi = nLcid;
                break;
			case c_oSerProp_rPrType.LangEA:
				if(null == rPr.Lang)
					rPr.Lang = new CLang();
				var sLang = this.stream.GetString2LE(length);
				var nLcid = Asc.g_oLcidNameToIdMap[sLang];
				if(null != nLcid)
					rPr.Lang.EastAsia = nLcid;
                break;
			case c_oSerProp_rPrType.ColorTheme:
                var themeColor = {Auto: null, Color: null, Tint: null, Shade: null};
				res = this.bcr.Read2(length, function(t, l){
					return oThis.bcr.ReadColorTheme(t, l, themeColor);
				});
				if(true == themeColor.Auto)
					rPr.Color = new CDocumentColor(0, 0, 0, true);
				var unifill = CreateThemeUnifill(themeColor.Color, themeColor.Tint, themeColor.Shade);
				if(null != unifill)
					rPr.Unifill = unifill;
				else if (null != rPr.Color && !rPr.Color.Auto)
				    rPr.Unifill = AscFormat.CreteSolidFillRGB(rPr.Color.r, rPr.Color.g, rPr.Color.b);
				break;
            case c_oSerProp_rPrType.Shd:
                rPr.Shd = new CDocumentShd();
                var themeColor = { Auto: null, Color: null, Tint: null, Shade: null };
                res = this.bcr.Read2(length, function (t, l) {
                    return oThis.bcr.ReadShd(t, l, rPr.Shd, themeColor);
                });
                if (true == themeColor.Auto && null != rPr.Shd.Color)
                    rPr.Shd.Color.Auto = true;//todo менять полностью цвет
                var unifill = CreateThemeUnifill(themeColor.Color, themeColor.Tint, themeColor.Shade);
                if (null != unifill)
                    rPr.Shd.Unifill = unifill;
                else if (null != rPr.Shd.Color && !rPr.Shd.Color.Auto)
                    rPr.Shd.Unifill = AscFormat.CreteSolidFillRGB(rPr.Shd.Color.r, rPr.Shd.Color.g, rPr.Shd.Color.b);
                break;
			case c_oSerProp_rPrType.Vanish:
                rPr.Vanish = this.stream.GetBool();
                break;
			case c_oSerProp_rPrType.TextOutline:
				if(length > 0){
					var TextOutline = pptx_content_loader.ReadShapeProperty(this.stream, 0);
					if(null != TextOutline)
						rPr.TextOutline = TextOutline;
				}
				else
					res = c_oSerConstants.ReadUnknown;
				break;
			case c_oSerProp_rPrType.TextFill:
				if(length > 0){
					var TextFill = pptx_content_loader.ReadShapeProperty(this.stream, 1);
					if(null != TextFill){
                        rPr.TextFill = TextFill;
                        if(null != TextFill.transparent){
                            TextFill.transparent = 255 - TextFill.transparent;
                        }
                    }
				}
				else
					res = c_oSerConstants.ReadUnknown;
				break;
            case c_oSerProp_rPrType.Del:
                this.trackRevision = {del: new CReviewInfo()};
                res = this.bcr.Read1(length, function(t, l){
                    return ReadTrackRevision(t, l, oThis.stream, oThis.trackRevision.del, null);
                });
				break;
            case c_oSerProp_rPrType.Ins:
				if (this.oReadResult.checkReadRevisions()) {
					this.trackRevision = {ins: new CReviewInfo()};
					res = this.bcr.Read1(length, function(t, l){
						return ReadTrackRevision(t, l, oThis.stream, oThis.trackRevision.ins, null);
					});
				} else {
					res = c_oSerConstants.ReadUnknown;
				}
				break;
			case c_oSerProp_rPrType.MoveFrom:
				this.trackRevision = {del: new CReviewInfo()};
				this.trackRevision.del.SetMove(Asc.c_oAscRevisionsMove.MoveFrom);
				res = this.bcr.Read1(length, function(t, l){
					return ReadTrackRevision(t, l, oThis.stream, oThis.trackRevision.del, null);
				});
				break;
			case c_oSerProp_rPrType.MoveTo:
				if (this.oReadResult.checkReadRevisions()) {
					this.trackRevision = {ins: new CReviewInfo()};
					this.trackRevision.ins.SetMove(Asc.c_oAscRevisionsMove.MoveTo);
					res = this.bcr.Read1(length, function(t, l){
						return ReadTrackRevision(t, l, oThis.stream, oThis.trackRevision.ins, null);
					});
				} else {
					res = c_oSerConstants.ReadUnknown;
				}
				break;
            case c_oSerProp_rPrType.rPrChange:
				if (this.oReadResult.checkReadRevisions()) {
					var rPrChange = new CTextPr();
					var reviewInfo = new CReviewInfo();
					var brPrr = new Binary_rPrReader(this.Document, this.oReadResult, this.stream);
					res = this.bcr.Read1(length, function(t, l){
						return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {brPrr: brPrr, rPr: rPrChange});
					});
					if (run) {
						run.SetPrChange(rPrChange, reviewInfo);
					}
				} else {
					res = c_oSerConstants.ReadUnknown;
				}
				break;
            default:
                res = c_oSerConstants.ReadUnknown;
                break;
        }
        return res;
    }
};
function Binary_tblPrReader(doc, oReadResult, stream)
{
	this.Document = doc;
	this.oReadResult = oReadResult;
    this.stream = stream;
	this.bcr = new Binary_CommonReader(this.stream);
    this.bpPrr = new Binary_pPrReader(this.Document, this.oReadResult, this.stream);
}
Binary_tblPrReader.prototype = 
{
	Read_tblPr: function(type, length, Pr, table)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if ( c_oSerProp_tblPrType.RowBandSize === type ) {
			Pr.TableStyleRowBandSize = this.stream.GetLongLE();
		} else if ( c_oSerProp_tblPrType.ColBandSize === type ) {
			Pr.TableStyleColBandSize = this.stream.GetLongLE();
		} else if ( c_oSerProp_tblPrType.Jc === type )
        {
            Pr.Jc = this.stream.GetUChar();
        }
        else if( c_oSerProp_tblPrType.TableInd === type )
        {
            Pr.TableInd = this.bcr.ReadDouble();
        }
		else if( c_oSerProp_tblPrType.TableIndTwips === type )
		{
			Pr.TableInd = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
        else if( c_oSerProp_tblPrType.TableW === type )
        {
            var oW = {Type: null, W: null, WDocx: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadW(t, l, oW);
            });
			if(null == Pr.TableW)
                Pr.TableW = new CTableMeasurement(tblwidth_Auto, 0);
			this.ParseW(oW, Pr.TableW);
        }
        else if( c_oSerProp_tblPrType.TableCellMar === type )
        {
            if(null == Pr.TableCellMar)
                Pr.TableCellMar = this.GetNewMargin();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadCellMargins(t, l, Pr.TableCellMar);
            });
        }
        else if( c_oSerProp_tblPrType.TableBorders === type )
        {
            if(null == Pr.TableBorders)
                Pr.TableBorders =
                {
                    Bottom  : undefined,
                    Left    : undefined,
                    Right   : undefined,
                    Top     : undefined,
                    InsideH : undefined,
                    InsideV : undefined
                };
            res = this.bcr.Read1(length, function(t, l){
                return oThis.bpPrr.ReadBorders(t, l, Pr.TableBorders);
            });
        }
        else if( c_oSerProp_tblPrType.Shd === type )
        {
            if(null == Pr.Shd)
                Pr.Shd = new CDocumentShd();
			var themeColor = {Auto: null, Color: null, Tint: null, Shade: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.bcr.ReadShd(t, l, Pr.Shd, themeColor);
            });
			if(true == themeColor.Auto && null != Pr.Shd.Color)
				Pr.Shd.Color.Auto = true;//todo менять полностью цвет
			var unifill = CreateThemeUnifill(themeColor.Color, themeColor.Tint, themeColor.Shade);
			if(null != unifill)
				Pr.Shd.Unifill = unifill;
			else if (null != Pr.Shd.Color && !Pr.Shd.Color.Auto)
			    Pr.Shd.Unifill = AscFormat.CreteSolidFillRGB(Pr.Shd.Color.r, Pr.Shd.Color.g, Pr.Shd.Color.b);
        }
		else if( c_oSerProp_tblPrType.Layout === type )
		{
			var nLayout = this.stream.GetUChar();
			switch(nLayout)
			{
				case ETblLayoutType.tbllayouttypeAutofit: Pr.TableLayout = tbllayout_AutoFit;break;
				case ETblLayoutType.tbllayouttypeFixed: Pr.TableLayout = tbllayout_Fixed;break;
			}
		}
		else if( c_oSerProp_tblPrType.TableCellSpacing === type )
		{
			Pr.TableCellSpacing = this.bcr.ReadDouble();
		}
		else if( c_oSerProp_tblPrType.TableCellSpacingTwips === type )
		{
			//different understanding of TableCellSpacing with Word
			Pr.TableCellSpacing = 2 * g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else if( c_oSerProp_tblPrType.tblCaption === type )
		{
			Pr.TableCaption = this.stream.GetString2LE(length);
		}
		else if( c_oSerProp_tblPrType.tblDescription === type )
		{
			Pr.TableDescription = this.stream.GetString2LE(length);
		}
		else if( c_oSerProp_tblPrType.tblPrChange === type && this.oReadResult.checkReadRevisions() && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting()))
		{
			var tblPrChange = new CTablePr();
			var reviewInfo = new CReviewInfo();
			res = this.bcr.Read1(length, function(t, l) {
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {btblPrr: oThis, tblPr: tblPrChange});
			});
			Pr.SetPrChange(tblPrChange, reviewInfo);
		}
		else if(null != table)
		{
			if( c_oSerProp_tblPrType.tblpPr === type )
			{
				table.Set_Inline(false);
				var oAdditionalPr = {PageNum: null, X: null, Y: null, Paddings: null};
				res = this.bcr.Read2(length, function(t, l){
					return oThis.Read_tblpPr(t, l, oAdditionalPr);
				});
				if(null != oAdditionalPr.X)
					table.Set_PositionH(Asc.c_oAscHAnchor.Page, false, oAdditionalPr.X);
				if(null != oAdditionalPr.Y)
					table.Set_PositionV(Asc.c_oAscVAnchor.Page, false, oAdditionalPr.Y);
				if(null != oAdditionalPr.Paddings)
				{
					var Paddings = oAdditionalPr.Paddings;
					table.Set_Distance(Paddings.L, Paddings.T, Paddings.R, Paddings.B);
				}
			}
			else if( c_oSerProp_tblPrType.tblpPr2 === type )
			{
				table.Set_Inline(false);
				var oAdditionalPr = {HRelativeFrom: null, HAlign: null, HValue: null, VRelativeFrom: null, VAlign: null, VValue: null, Distance: null};
				res = this.bcr.Read2(length, function(t, l){
					return oThis.Read_tblpPr2(t, l, oAdditionalPr);
				});
				if(null != oAdditionalPr.HRelativeFrom && null != oAdditionalPr.HAlign && null != oAdditionalPr.HValue)
					table.Set_PositionH(oAdditionalPr.HRelativeFrom, oAdditionalPr.HAlign, oAdditionalPr.HValue);
				if(null != oAdditionalPr.VRelativeFrom && null != oAdditionalPr.VAlign && null != oAdditionalPr.VValue)
					table.Set_PositionV(oAdditionalPr.VRelativeFrom, oAdditionalPr.VAlign, oAdditionalPr.VValue);
				if(null != oAdditionalPr.Distance)
				{
					var Distance = oAdditionalPr.Distance;
					table.Set_Distance(Distance.L, Distance.T, Distance.R, Distance.B);
				}
			}
			else if( c_oSerProp_tblPrType.Look === type )
			{
				var nLook = this.stream.GetULongLE();
				var bFC = 0 != (nLook & 0x0080);
				var bFR = 0 != (nLook & 0x0020);
				var bLC = 0 != (nLook & 0x0100);
				var bLR = 0 != (nLook & 0x0040);
				var bBH = 0 != (nLook & 0x0200);
				var bBV = 0 != (nLook & 0x0400);
				table.Set_TableLook(new CTableLook(bFC, bFR, bLC, bLR, !bBH, !bBV));
			}
			else if( c_oSerProp_tblPrType.Style === type )
				this.oReadResult.tableStyles.push({pPr: table, style: this.stream.GetString2LE(length)});
			else
				res = c_oSerConstants.ReadUnknown;
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    BordersNull: function(Borders)
    {
        Borders.Left    = new CDocumentBorder();
        Borders.Top     = new CDocumentBorder();
        Borders.Right   = new CDocumentBorder();
        Borders.Bottom  = new CDocumentBorder();
        Borders.InsideV = new CDocumentBorder();
        Borders.InsideH = new CDocumentBorder();
    },
    ReadW: function(type, length, Width)
    {
        var res = c_oSerConstants.ReadOk;
        if( c_oSerWidthType.Type === type )
        {
            Width.Type = this.stream.GetUChar();
        }
        else if( c_oSerWidthType.W === type )
        {
            Width.W = this.bcr.ReadDouble();
        }
		else if( c_oSerWidthType.WDocx === type )
        {
            Width.WDocx = this.stream.GetULongLE();
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
	ParseW: function(input, output)
    {
		if(input.Type)
			output.Type = input.Type;
		if(input.W)
			output.W = input.W;
		if(input.WDocx)
		{
			if(tblwidth_Mm == input.Type)
				output.W = g_dKoef_twips_to_mm * input.WDocx;
			else if(tblwidth_Pct == input.Type)
				output.W = 2 * input.WDocx / 100;
			else
				output.W = input.WDocx;
		}
	},
    ReadCellMargins: function(type, length, Margins)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerMarginsType.left === type )
        {
            var oW = {Type: null, W: null, WDocx: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadW(t, l, oW);
            });
			if(null == Margins.Left)
                Margins.Left = new CTableMeasurement(tblwidth_Auto, 0);
			this.ParseW(oW, Margins.Left);
        }
        else if( c_oSerMarginsType.top === type )
        {
			var oW = {Type: null, W: null, WDocx: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadW(t, l, oW);
            });
			if(null == Margins.Top)
                Margins.Top = new CTableMeasurement(tblwidth_Auto, 0);
			this.ParseW(oW, Margins.Top);
        }
        else if( c_oSerMarginsType.right === type )
        {
			var oW = {Type: null, W: null, WDocx: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadW(t, l, oW);
            });
			if(null == Margins.Right)
                Margins.Right = new CTableMeasurement(tblwidth_Auto, 0);
			this.ParseW(oW, Margins.Right);
        }
        else if( c_oSerMarginsType.bottom === type )
        {
			var oW = {Type: null, W: null, WDocx: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadW(t, l, oW);
            });
			if(null == Margins.Bottom)
                Margins.Bottom = new CTableMeasurement(tblwidth_Auto, 0);
			this.ParseW(oW, Margins.Bottom);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    Read_tblpPr: function(type, length, oAdditionalPr)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSer_tblpPrType.Page === type )
            oAdditionalPr.PageNum = this.stream.GetULongLE();
        else if( c_oSer_tblpPrType.X === type )
            oAdditionalPr.X = this.bcr.ReadDouble();
        else if( c_oSer_tblpPrType.Y === type )
            oAdditionalPr.Y = this.bcr.ReadDouble();
        else if( c_oSer_tblpPrType.Paddings === type )
        {
            if(null == oAdditionalPr.Paddings)
                oAdditionalPr.Paddings = {L : 0, T : 0, R : 0, B : 0};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadPaddings(t, l, oAdditionalPr.Paddings);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
	Read_tblpPr2: function(type, length, oAdditionalPr)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSer_tblpPrType2.HorzAnchor === type )
            oAdditionalPr.HRelativeFrom = this.stream.GetUChar();
		else if( c_oSer_tblpPrType2.TblpX === type )
		{
			oAdditionalPr.HAlign = false;
            oAdditionalPr.HValue = this.bcr.ReadDouble();
		}
		else if( c_oSer_tblpPrType2.TblpXTwips === type )
		{
			oAdditionalPr.HAlign = false;
			oAdditionalPr.HValue = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else if( c_oSer_tblpPrType2.TblpXSpec === type )
		{
			oAdditionalPr.HAlign = true;
            oAdditionalPr.HValue = this.stream.GetUChar();
		}
		else if( c_oSer_tblpPrType2.VertAnchor === type )
            oAdditionalPr.VRelativeFrom = this.stream.GetUChar();
		else if( c_oSer_tblpPrType2.TblpY === type )
		{
			oAdditionalPr.VAlign = false;
            oAdditionalPr.VValue = this.bcr.ReadDouble();
		}
		else if( c_oSer_tblpPrType2.TblpYTwips === type )
		{
			oAdditionalPr.VAlign = false;
			oAdditionalPr.VValue = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else if( c_oSer_tblpPrType2.TblpYSpec === type )
		{
			oAdditionalPr.VAlign = true;
            oAdditionalPr.VValue = this.stream.GetUChar();
		}
		else if( c_oSer_tblpPrType2.Paddings === type )
		{
			oAdditionalPr.Distance = {L: 0, T: 0, R: 0, B:0};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadPaddings2(t, l, oAdditionalPr.Distance);
            });
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
	Read_RowPr: function(type, length, Pr, row)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerProp_rowPrType.CantSplit === type )
        {
            Pr.CantSplit = (this.stream.GetUChar() != 0);
        }
        else if( c_oSerProp_rowPrType.After === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadAfter(t, l, Pr);
            });
        }
        else if( c_oSerProp_rowPrType.Before === type )
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadBefore(t, l, Pr);
            });
        }
        else if( c_oSerProp_rowPrType.Jc === type )
        {
            Pr.Jc = this.stream.GetUChar();
        }
        else if( c_oSerProp_rowPrType.TableCellSpacing === type )
        {
            Pr.TableCellSpacing = this.bcr.ReadDouble();
        }
		else if( c_oSerProp_rowPrType.TableCellSpacingTwips === type )
		{
			//different understanding of TableCellSpacing with Word
			Pr.TableCellSpacing = 2 * g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
        else if( c_oSerProp_rowPrType.Height === type )
        {
            if(null == Pr.Height)
                Pr.Height = new CTableRowHeight(0,Asc.linerule_Auto);
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadHeight(t, l, Pr.Height);
            });
        }
        else if( c_oSerProp_rowPrType.TableHeader === type )
        {
            Pr.TableHeader = (this.stream.GetUChar() != 0);
        }
        else if(c_oSerProp_rowPrType.Del === type && row && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting())){
			var reviewInfo = new CReviewInfo();
			res = this.bcr.Read1(length, function(t, l){
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, null);
			});
			row.SetReviewTypeWithInfo(reviewtype_Remove, reviewInfo);
        }
        else if(c_oSerProp_rowPrType.Ins === type && row && this.oReadResult.checkReadRevisions() && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting())){
			var reviewInfo = new CReviewInfo();
			res = this.bcr.Read1(length, function(t, l){
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, null);
			});
			row.SetReviewTypeWithInfo(reviewtype_Add, reviewInfo);
        }
        else if( c_oSerProp_rowPrType.trPrChange === type && this.oReadResult.checkReadRevisions() && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting())){
			var trPr = new CTableRowPr();
			var reviewInfo = new CReviewInfo();
			res = this.bcr.Read1(length, function(t, l) {
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {btblPrr: oThis, trPr: trPr});
			});
			Pr.SetPrChange(trPr, reviewInfo);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    ReadAfter: function(type, length, After)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerProp_rowPrType.GridAfter === type )
        {
            After.GridAfter = this.stream.GetULongLE();
        }
        else if( c_oSerProp_rowPrType.WAfter === type )
        {
			var oW = {Type: null, W: null, WDocx: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadW(t, l, oW);
            });
			if(null == After.WAfter)
                After.WAfter = new CTableMeasurement(tblwidth_Auto, 0);
			this.ParseW(oW, After.WAfter);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    ReadBefore: function(type, length, Before)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerProp_rowPrType.GridBefore === type )
        {
            Before.GridBefore = this.stream.GetULongLE();
        }
        else if( c_oSerProp_rowPrType.WBefore === type )
        {
			var oW = {Type: null, W: null, WDocx: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadW(t, l, oW);
            });
			if(null == Before.WBefore)
                Before.WBefore = new CTableMeasurement(tblwidth_Auto, 0);
			this.ParseW(oW, Before.WBefore);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    ReadHeight: function(type, length, Height)
    {
        var res = c_oSerConstants.ReadOk;
        if( c_oSerProp_rowPrType.Height_Rule === type )
        {
            Height.HRule = this.stream.GetUChar();
        }
        else if( c_oSerProp_rowPrType.Height_Value === type )
        {
            Height.Value = this.bcr.ReadDouble();
        }
		else if( c_oSerProp_rowPrType.Height_ValueTwips === type )
		{
			Height.Value = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    Read_CellPr : function(type, length, Pr)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerProp_cellPrType.GridSpan === type )
        {
            Pr.GridSpan = this.stream.GetULongLE();
        }
        else if( c_oSerProp_cellPrType.Shd === type )
        {
            if(null == Pr.Shd)
                Pr.Shd = new CDocumentShd();
            var oNewShd = {Value: undefined, Color: undefined, Unifill: undefined};
			var themeColor = {Auto: null, Color: null, Tint: null, Shade: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.bcr.ReadShd(t, l, oNewShd, themeColor);
            });
            var unifill = CreateThemeUnifill(themeColor.Color, themeColor.Tint, themeColor.Shade);
            if (true == themeColor.Auto) {
                if (!oNewShd.Color) {
                    oNewShd.Color = new CDocumentColor(255, 255, 255);
                }
                oNewShd.Color.Auto = true;
            }
			if(null != unifill)
				oNewShd.Unifill = unifill;
			else if (null != oNewShd.Color && !oNewShd.Color.Auto)
			    oNewShd.Unifill = AscFormat.CreteSolidFillRGB(oNewShd.Color.r, oNewShd.Color.g, oNewShd.Color.b);
            //если есть themeColor или Color, то Value по умолчанию ShdClear(Тарифы_на_комплексное_обслуживание_клиен.docx)
            if (undefined == oNewShd.Value && oNewShd.Unifill) {
                oNewShd.Value = Asc.c_oAscShdClear;
            }
            Pr.Shd.Set_FromObject(oNewShd);
        }
        else if( c_oSerProp_cellPrType.TableCellBorders === type )
        {
            if(null == Pr.TableCellBorders)
                Pr.TableCellBorders =
                {
                    Bottom : undefined,
                    Left   : undefined,
                    Right  : undefined,
                    Top    : undefined
                };
            res = this.bcr.Read1(length, function(t, l){
                return oThis.bpPrr.ReadBorders(t, l, Pr.TableCellBorders);
            });
        }
        else if( c_oSerProp_cellPrType.CellMar === type )
        {
			if(null == Pr.TableCellMar)
                Pr.TableCellMar = this.GetNewMargin();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadCellMargins(t, l, Pr.TableCellMar);
            });
        }
        else if( c_oSerProp_cellPrType.TableCellW === type )
        {
			var oW = {Type: null, W: null, WDocx: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadW(t, l, oW);
            });
			if(null == Pr.TableCellW)
                Pr.TableCellW = new CTableMeasurement(tblwidth_Auto, 0);
			this.ParseW(oW, Pr.TableCellW);
        }
        else if( c_oSerProp_cellPrType.VAlign === type )
        {
            Pr.VAlign = this.stream.GetUChar();
        }
        else if( c_oSerProp_cellPrType.VMerge === type )
        {
            Pr.VMerge = this.stream.GetUChar();
        }
		else if( c_oSerProp_cellPrType.HMerge === type )
		{
			Pr.HMerge = this.stream.GetUChar();
		}
        else if( c_oSerProp_cellPrType.CellDel === type ){
            res = c_oSerConstants.ReadUnknown;//todo
        }
        else if( c_oSerProp_cellPrType.CellIns === type ){
            res = c_oSerConstants.ReadUnknown;//todo
        }
        else if( c_oSerProp_cellPrType.CellMerge === type ){
            res = c_oSerConstants.ReadUnknown;//todo
        }
        else if( c_oSerProp_cellPrType.tcPrChange === type && this.oReadResult.checkReadRevisions() && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting())){
			var tcPr = new CTableCellPr();
			var reviewInfo = new CReviewInfo();
			res = this.bcr.Read1(length, function(t, l) {
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {btblPrr: oThis, tcPr: tcPr});
			});
			Pr.SetPrChange(tcPr, reviewInfo);
        }
        else if( c_oSerProp_cellPrType.textDirection === type ){
            Pr.TextDirection = this.stream.GetUChar();
        }
        else if( c_oSerProp_cellPrType.noWrap === type ){
            Pr.NoWrap = (this.stream.GetUChar() != 0);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
	GetNewMargin: function()
    {
        return { Left : new CTableMeasurement(tblwidth_Auto, 0), Top: new CTableMeasurement(tblwidth_Auto, 0), Right: new CTableMeasurement(tblwidth_Auto, 0), Bottom: new CTableMeasurement(tblwidth_Auto, 0)};
    },
	ReadPaddings: function(type, length, paddings)
    {
        var res = c_oSerConstants.ReadOk;
        if (c_oSerPaddingType.left === type)
            paddings.Left = this.bcr.ReadDouble();
        else if (c_oSerPaddingType.top === type)
            paddings.Top = this.bcr.ReadDouble();
        else if (c_oSerPaddingType.right === type)
            paddings.Right = this.bcr.ReadDouble();
        else if (c_oSerPaddingType.bottom === type)
            paddings.Bottom = this.bcr.ReadDouble();
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
	ReadPaddings2: function(type, length, paddings)
    {
        var res = c_oSerConstants.ReadOk;
        if (c_oSerPaddingType.left === type)
            paddings.L = this.bcr.ReadDouble();
		else if (c_oSerPaddingType.leftTwips === type)
			paddings.L = g_dKoef_twips_to_mm * this.stream.GetULongLE();
        else if (c_oSerPaddingType.top === type)
            paddings.T = this.bcr.ReadDouble();
		else if (c_oSerPaddingType.topTwips === type)
			paddings.T = g_dKoef_twips_to_mm * this.stream.GetULongLE();
        else if (c_oSerPaddingType.right === type)
            paddings.R = this.bcr.ReadDouble();
		else if (c_oSerPaddingType.rightTwips === type)
			paddings.R = g_dKoef_twips_to_mm * this.stream.GetULongLE();
        else if (c_oSerPaddingType.bottom === type)
            paddings.B = this.bcr.ReadDouble();
		else if (c_oSerPaddingType.bottomTwips === type)
			paddings.B = g_dKoef_twips_to_mm * this.stream.GetULongLE();
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
}
function Binary_NumberingTableReader(doc, oReadResult, stream)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
    this.stream = stream;
	this.m_oANums = {};
    this.bcr = new Binary_CommonReader(this.stream);
    this.brPrr = new Binary_rPrReader(this.Document, this.oReadResult, this.stream);
    this.bpPrr = new Binary_pPrReader(this.Document, this.oReadResult, this.stream);
    this.Read = function()
    {
        var oThis = this;
        var res = this.bcr.ReadTable(function(t, l){
                return oThis.ReadNumberingContent(t,l);
            });
        return res;
    };
    this.ReadNumberingContent = function(type, length)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.AbstractNums === type )
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadAbstractNums(t, l);
            });
        }
        else if ( c_oSerNumTypes.Nums === type )
        {
			var tmpNum = {NumId: null, Num: null};
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadNums(t, l, tmpNum);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    this.ReadNums = function(type, length, tmpNum)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.Num === type )
        {
			tmpNum.NumId = null;
			tmpNum.Num = new CNum(this.oReadResult.logicDocument.GetNumbering());
			res = this.bcr.Read2(length, function(t, l) {
				return oThis.ReadNum(t, l, tmpNum);
			});
			if (null != tmpNum.NumId) {
				this.oReadResult.numToNumClass[tmpNum.NumId] = tmpNum.Num;
			}
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    this.ReadNum = function(type, length, tmpNum)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.Num_ANumId === type )
        {
			var ANum = this.m_oANums[this.stream.GetULongLE()];
			if (ANum) {
				tmpNum.Num.SetAbstractNumId(ANum.GetId());
				this.oReadResult.numToANumClass[ANum.GetId()] = ANum;
			}
        }
        else if ( c_oSerNumTypes.Num_NumId === type )
        {
			tmpNum.NumId = this.stream.GetULongLE();
        }
		else if ( c_oSerNumTypes.Num_LvlOverride === type )
		{
			var tmpOverride = {nLvl: undefined, StartOverride: undefined, Lvl: undefined};
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadLvlOverride(t, l, tmpOverride);
			});
			tmpNum.Num.SetLvlOverride(tmpOverride.Lvl, tmpOverride.nLvl, tmpOverride.StartOverride);
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
	this.ReadLvlOverride = function(type, length, lvlOverride) {
		var oThis = this;
		var res = c_oSerConstants.ReadOk;
		if (c_oSerNumTypes.ILvl === type) {
			lvlOverride.nLvl = this.stream.GetULongLE();
		} else if (c_oSerNumTypes.StartOverride === type) {
			lvlOverride.StartOverride = this.stream.GetULongLE();
		} else if (c_oSerNumTypes.Lvl === type) {
			lvlOverride.Lvl = new CNumberingLvl();
			var tmp = {nLevelNum: 0};
			res = this.bcr.Read2(length, function(t, l){
				return oThis.ReadLevel(t, l, lvlOverride.Lvl, tmp);
			});
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	},
    this.ReadAbstractNums = function(type, length)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.AbstractNum === type )
        {
            var oNewAbstractNum = new CAbstractNum();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadAbstractNum(t, l, oNewAbstractNum);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    },
    this.ReadAbstractNum = function(type, length, oNewNum)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.AbstractNum_Lvls === type )
        {
            var nLevelNum = 0;
            res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadLevels(t, l, nLevelNum++, oNewNum);
            });
        }
		else if ( c_oSerNumTypes.NumStyleLink === type ) {
			this.oReadResult.numStyleLinks.push({pPr: oNewNum, style: this.stream.GetString2LE(length)});
		}
		else if ( c_oSerNumTypes.StyleLink === type ) {
			this.oReadResult.styleLinks.push({pPr: oNewNum, style: this.stream.GetString2LE(length)});
		}
        else if ( c_oSerNumTypes.AbstractNum_Id === type )
        {
			this.m_oANums[this.stream.GetULongLE()] = oNewNum;
            //oNewNum.Id = this.stream.GetULongLE();
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
    this.ReadLevels = function(type, length, nLevelNum, oNewNum)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.Lvl === type )
        {
			if(nLevelNum < oNewNum.Lvl.length)
			{
				var oOldLvl = oNewNum.Lvl[nLevelNum];
				var oNewLvl = oOldLvl.Copy();
				//сбрасываем свойства
				oNewLvl.ParaPr = new CParaPr();
				oNewLvl.TextPr = new CTextPr();
				var tmp = {nLevelNum: nLevelNum};
				res = this.bcr.Read2(length, function(t, l){
					return oThis.ReadLevel(t, l, oNewLvl, tmp);
				});
				oNewNum.Lvl[tmp.nLevelNum] = oNewLvl;
				this.oReadResult.aPostOpenStyleNumCallbacks.push(function(){
					oNewNum.SetLvl(tmp.nLevelNum, oNewLvl);
				});
			}
			else
				res = c_oSerConstants.ReadUnknown;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
    this.ReadLevel = function(type, length, oNewLvl, tmp)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.lvl_Format === type )
        {
            oNewLvl.Format = this.stream.GetULongLE();
        }
		else if ( c_oSerNumTypes.lvl_NumFmt === type )
		{
			res = this.bcr.Read1(length, function(t, l){
				return oThis.bpPrr.ReadNumFmt(t, l, oNewLvl);
			});
		}
		else if ( c_oSerNumTypes.lvl_Jc_deprecated === type )
		{
			oNewLvl.Jc = this.stream.GetUChar();
		}
		else if ( c_oSerNumTypes.lvl_Jc === type )
		{
			var jc = this.stream.GetUChar();
			switch(jc) {
				case 1: oNewLvl.Jc = align_Center;break;
				case 8:
				case 10: oNewLvl.Jc = align_Left;break;
				case 3:
				case 11: oNewLvl.Jc = align_Right;break;
				case 0:
				case 9:
				case 2: oNewLvl.Jc = align_Justify;break;
				default: oNewLvl.Jc = align_Left;break;
			}
        }
        else if ( c_oSerNumTypes.lvl_LvlText === type )
        {
            oNewLvl.LvlText = [];
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadLevelText(t, l, oNewLvl.LvlText);
            });
        }
        else if ( c_oSerNumTypes.lvl_Restart === type )
        {
            oNewLvl.Restart = this.stream.GetLongLE();
        }
        else if ( c_oSerNumTypes.lvl_Start === type )
        {
            oNewLvl.Start = this.stream.GetULongLE();
        }
        else if ( c_oSerNumTypes.lvl_Suff === type )
        {
            oNewLvl.Suff = this.stream.GetUChar();
        }
		else if ( c_oSerNumTypes.lvl_PStyle === type )
        {
			this.oReadResult.lvlStyles.push({pPr: oNewLvl, style: this.stream.GetString2LE(length)});
        }
        else if ( c_oSerNumTypes.lvl_ParaPr === type )
        {
            res = this.bpPrr.Read(length, oNewLvl.ParaPr, null);
        }
        else if ( c_oSerNumTypes.lvl_TextPr === type )
        {
            res = this.brPrr.Read(length, oNewLvl.TextPr, null);
        }
		else if ( c_oSerNumTypes.ILvl === type )
		{
			tmp.nLevelNum = this.stream.GetULongLE();
		}
		// else if ( c_oSerNumTypes.Tentative === type )
		// {
		// 	oNewLvl.Tentative = this.stream.GetBool();
		// }
		// else if ( c_oSerNumTypes.Tplc === type )
		// {
		// 	oNewLvl.Tplc = AscFonts.FT_Common.IntToUInt(this.stream.GetULongLE());
		// }
		else if ( c_oSerNumTypes.IsLgl === type )
		{
			oNewLvl.IsLgl = this.stream.GetBool();
		}
		else if ( c_oSerNumTypes.LvlLegacy === type )
		{
			oNewLvl.Legacy = new CNumberingLvlLegacy();
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadLvlLegacy(t, l, oNewLvl.Legacy);
			});
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
	this.ReadLvlLegacy = function(type, length, lvlLegacy) {
		var res = c_oSerConstants.ReadOk;
		if ( c_oSerNumTypes.Legacy === type ) {
			lvlLegacy.Legacy = this.stream.GetBool();
		} else if ( c_oSerNumTypes.LegacyIndent === type ) {
			lvlLegacy.Indent = this.stream.GetULongLE();
		} else if ( c_oSerNumTypes.LegacySpace === type ) {
			lvlLegacy.Space = AscFonts.FT_Common.IntToUInt(this.stream.GetULongLE());
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	}
    this.ReadLevelText = function(type, length, aNewText)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.lvl_LvlTextItem === type )
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadLevelTextItem(t, l, aNewText);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
    this.ReadLevelTextItem = function(type, length, aNewText)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerNumTypes.lvl_LvlTextItemText === type )
        {
            var oNewTextItem = new CNumberingLvlTextString( this.stream.GetString2LE(length) );
            aNewText.push(oNewTextItem);
        }
        else if ( c_oSerNumTypes.lvl_LvlTextItemNum === type )
        {
            var oNewTextItem = new CNumberingLvlTextNum( this.stream.GetUChar() );
            aNewText.push(oNewTextItem);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
};
function Binary_HdrFtrTableReader(doc, oReadResult, openParams, stream)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
	this.openParams = openParams;
    this.stream = stream;
    this.bcr = new Binary_CommonReader(this.stream);
    this.bdtr = new Binary_DocumentTableReader(this.Document, this.oReadResult, this.openParams, this.stream, null, this.oReadResult.oCommentsPlaces);
    this.Read = function()
    {
        var oThis = this;
        var res = this.bcr.ReadTable(function(t, l){
                return oThis.ReadHdrFtrContent(t,l);
            });
        return res;
    };
    this.ReadHdrFtrContent = function(type, length)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerHdrFtrTypes.Header === type || c_oSerHdrFtrTypes.Footer === type )
        {
            var oHdrFtrContainer;
            var nHdrFtrType;
            if(c_oSerHdrFtrTypes.Header === type)
            {
                oHdrFtrContainer = this.oReadResult.headers;
                nHdrFtrType = AscCommon.hdrftr_Header;
            }
            else
            {
                oHdrFtrContainer = this.oReadResult.footers;
                nHdrFtrType = AscCommon.hdrftr_Footer;
            }
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadHdrFtrFEO(t, l, oHdrFtrContainer, nHdrFtrType);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadHdrFtrFEO = function(type, length, oHdrFtrContainer, nHdrFtrType)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerHdrFtrTypes.HdrFtr_First === type || c_oSerHdrFtrTypes.HdrFtr_Even === type || c_oSerHdrFtrTypes.HdrFtr_Odd === type )
        {
            var hdrftr;
			if(AscCommon.hdrftr_Header == nHdrFtrType)
				hdrftr = new CHeaderFooter(this.Document.HdrFtr, this.Document, this.Document.DrawingDocument, nHdrFtrType );
			else
				hdrftr = new CHeaderFooter(this.Document.HdrFtr, this.Document, this.Document.DrawingDocument, nHdrFtrType );
            this.bdtr.Document = hdrftr.Content;
            var oNewItem = {Content: null};
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadHdrFtrItem(t, l, oNewItem);
            });
            if(null != oNewItem.Content)
            {
                hdrftr.Content.Content = oNewItem.Content;
				oHdrFtrContainer.push({type: type, elem: hdrftr});
            }
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadHdrFtrItem = function(type, length, oNewItem)
    {
        var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerHdrFtrTypes.HdrFtr_Content === type )
        {
			oNewItem.Content = [];
			oThis.bdtr.Read(length, oNewItem.Content);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
};
function Binary_DocumentTableReader(doc, oReadResult, openParams, stream, curFootnote, oComments)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
	this.oReadResult.bdtr = this;
	this.openParams = openParams;
    this.stream = stream;
    this.bcr = new Binary_CommonReader(this.stream);
	this.boMathr = new Binary_oMathReader(this.stream, this.oReadResult, curFootnote, openParams);
    this.brPrr = new Binary_rPrReader(this.Document, this.oReadResult, this.stream);
    this.bpPrr = new Binary_pPrReader(this.Document, this.oReadResult, this.stream);
	this.btblPrr = new Binary_tblPrReader(this.Document, this.oReadResult, this.stream);
    this.lastPar = null;
    this.oComments = oComments;
    this.aFields = [];
	this.nCurCommentsCount = 0;
	this.oCurComments = {};//вспомогательный массив  для заполнения QuotedText
	this.curFootnote = curFootnote;
	this.lastParStruct = null;
	this.toNextParStruct = [];
    this.Reset = function()
    {
        this.lastPar = null;
    }
    this.ReadAsTable = function(OpenContent)
    {
        this.Reset();
		
        var oThis = this;
        return this.bcr.ReadTable(function(t, l){
                return oThis.ReadDocumentContent(t, l, OpenContent);
            });
    };
	this.Read = function(length, OpenContent)
    {
        this.Reset();
		
        var oThis = this;
        return this.bcr.Read1(length, function(t, l){
                return oThis.ReadDocumentContent(t, l, OpenContent);
            });
    };
    this.ReadDocumentContent = function(type, length, Content)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if ( c_oSerParType.Par === type )
        {
			if(null != this.openParams && true == this.openParams.checkFileSize)
			{
				this.openParams.parCount += 1;
				if(this.openParams.parCount >= g_nErrorParagraphCount)
					throw new Error(g_sErrorCharCountMessage);
			}
            var oNewParagraph = new Paragraph(this.Document.DrawingDocument, this.Document);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadParagraph(t,l, oNewParagraph, Content);
            });
			if (reviewtype_Common === oNewParagraph.GetReviewType() || this.oReadResult.checkReadRevisions()) {
				oNewParagraph.Correct_Content();
				//Prev/Next
				if(null != this.lastPar)
				{
					oNewParagraph.Set_DocumentPrev(this.lastPar);
					this.lastPar.Set_DocumentNext(oNewParagraph);
				}
				this.lastPar = oNewParagraph;
				Content.push(oNewParagraph);
			}
        }
        else if ( c_oSerParType.Table === type )
        {
            var doc = this.Document;
			var oNewTable = new CTable(doc.DrawingDocument, doc, true, 0, 0, []);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadDocTable(t, l, oNewTable);
            });
            if (oNewTable.Content.length > 0) {
				this.oReadResult.aTableCorrect.push(oNewTable);
              if(2 == AscCommon.CurFileVersion && false == oNewTable.Inline)
              {
                  //делаем смещение левой границы
                  if(false == oNewTable.PositionH.Align)
                  {
                      var dx = GetTableOffsetCorrection(oNewTable);
                      oNewTable.PositionH.Value += dx;
                  }
              }
              if(null != this.lastPar)
              {
                  oNewTable.Set_DocumentPrev(this.lastPar);
                  this.lastPar.Set_DocumentNext(oNewTable);
              }
              this.lastPar = oNewTable;
              Content.push(oNewTable);
            }
        }
        else if ( c_oSerParType.sectPr === type && !this.oReadResult.bCopyPaste)
		{
			var oSectPr = oThis.Document.SectPr;
			var oAdditional = {EvenAndOddHeaders: null};
            res = this.bcr.Read1(length, function(t, l){
                return oThis.bpPrr.Read_SecPr(t, l, oSectPr, oAdditional);
            });
			if(null != oAdditional.EvenAndOddHeaders)
				this.Document.Set_DocumentEvenAndOddHeaders(oAdditional.EvenAndOddHeaders);
			if(AscCommon.CurFileVersion < 5)
			{
				for(var i = 0; i < this.oReadResult.headers.length; ++i)
				{
					var item = this.oReadResult.headers[i];
					switch(item.type)
					{
						case c_oSerHdrFtrTypes.HdrFtr_First: oSectPr.Set_Header_First(item.elem);break;
						case c_oSerHdrFtrTypes.HdrFtr_Even: oSectPr.Set_Header_Even(item.elem);break;
						case c_oSerHdrFtrTypes.HdrFtr_Odd: oSectPr.Set_Header_Default(item.elem);break;
					}
				}
				for(var i = 0; i < this.oReadResult.footers.length; ++i)
				{
					var item = this.oReadResult.footers[i];
					switch(item.type)
					{
						case c_oSerHdrFtrTypes.HdrFtr_First: oSectPr.Set_Footer_First(item.elem);break;
						case c_oSerHdrFtrTypes.HdrFtr_Even: oSectPr.Set_Footer_Even(item.elem);break;
						case c_oSerHdrFtrTypes.HdrFtr_Odd: oSectPr.Set_Footer_Default(item.elem);break;
					}
				}
			}
		} else if ( c_oSerParType.Sdt === type) {
			var oSdt = new AscCommonWord.CBlockLevelSdt(this.oReadResult.logicDocument, this.Document);
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadSdt(t,l, oSdt, 0);
			});
			//Prev/Next
			if(null != this.lastPar)
			{
				oSdt.Set_DocumentPrev(this.lastPar);
				this.lastPar.Set_DocumentNext(oSdt);
			}
			this.lastPar = oSdt;
			Content.push(oSdt);
		// } else if ( c_oSerParType.Background === type ) {
			// oThis.Document.Background = {Color: null, Unifill: null, shape: null};
			// res = this.bcr.Read2(length, function(t, l){
				// return oThis.ReadBackground(t,l, oThis.Document.Background);
			// });
		} else if (c_oSerParType.BookmarkStart === type) {
			this.toNextParStruct.push(c_oToNextParType.BookmarkStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerParType.BookmarkEnd === type) {
			if (!readBookmarkEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct)) {
				this.toNextParStruct.push(c_oToNextParType.BookmarkEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else if (c_oSerParType.MoveFromRangeStart === type) {
			this.toNextParStruct.push(c_oToNextParType.MoveFromRangeStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerParType.MoveFromRangeEnd === type) {
			if (!readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct, true, true)) {
				this.toNextParStruct.push(c_oToNextParType.MoveFromRangeEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else if (c_oSerParType.MoveToRangeStart === type && this.oReadResult.checkReadRevisions()) {
			this.toNextParStruct.push(c_oToNextParType.MoveToRangeStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerParType.MoveToRangeEnd === type && this.oReadResult.checkReadRevisions()) {
			if (!readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct, false, true)) {
				this.toNextParStruct.push(c_oToNextParType.MoveToRangeEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else if (c_oSerParType.JsaProject === type) {
			this.Document.DrawingDocument.m_oWordControl.m_oApi.macros.SetData(AscCommon.GetStringUtf8(this.stream, length));
		} else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadBackground = function(type, length, oBackground)
	{
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerBackgroundType.Color === type){
			oBackground.Color = this.bcr.ReadColor();
		} else if(c_oSerBackgroundType.ColorTheme === type) {
			var themeColor = {Auto: null, Color: null, Tint: null, Shade: null};
			res = this.bcr.Read2(length, function(t, l){
				return oThis.bcr.ReadColorTheme(t, l, themeColor);
			});
			if(true == themeColor.Auto)
				oBackground.Color = new CDocumentColor(0, 0, 0, true);
			var unifill = CreateThemeUnifill(themeColor.Color, themeColor.Tint, themeColor.Shade);
			if(null != unifill)
				oBackground.Unifill = unifill;
			else if (null != oBackground.Color && !oBackground.Color.Auto)
				oBackground.Unifill = AscFormat.CreteSolidFillRGB(oBackground.Color.r, oBackground.Color.g, oBackground.Color.b);
		} else if(c_oSerBackgroundType.pptxDrawing === type) {
			var oDrawing = {};
			var oParStruct = new OpenParStruct(null, null);
			res = this.ReadDrawing (type, length, oParStruct, oDrawing);
			if(null != oDrawing.content.GraphicObj)
				oBackground.shape = oDrawing.content.GraphicObj;
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	}
    this.ReadParagraph = function(type, length, paragraph, Content)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if ( c_oSerParType.pPr === type )
        {
			var oNewParaPr = paragraph.Pr;
            res = this.bpPrr.Read(length, oNewParaPr, paragraph);
			this.oReadResult.aPostOpenStyleNumCallbacks.push(function(){
				paragraph.Set_Pr(oNewParaPr);
			});
        }
        else if ( c_oSerParType.Content === type )
        {
			var oParStruct = new OpenParStruct(paragraph, paragraph);
			//todo also execute after reading document content
			addToNextPar(this.toNextParStruct, this.bcr, this.stream, this.oReadResult, oParStruct, this.openParams);
            //для случая гиперссылок на несколько строк в конце параграфа завершаем начатые, а начале - продолжаем незавершенные
            if (this.aFields.length > 0) {
                for (var i = 0; i < this.aFields.length; ++i) {
					var oField = this.aFields[i];
					if (null != oField && para_Hyperlink == oField.Get_Type()) {
						var oHyperlink = new ParaHyperlink();
						oHyperlink.SetParagraph(paragraph);
						oHyperlink.SetValue(oField.GetValue());
						oHyperlink.SetToolTip(oField.GetToolTip());
						oParStruct.addElem(oHyperlink);
					} else {
                        //зануляем, чтобы когда придет fldend ничего не делать
                        this.aFields[i] = null;
                    }
                }
            }
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadParagraphContent(t, l, oParStruct);
            });
            //завершаем гиперссылки
            oParStruct.commitAll();
            this.lastParStruct = oParStruct;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadParagraphContent = function (type, length, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        var oCurContainer = oParStruct.getElem();
        if (c_oSerParType.Run === type)
        {
			oParStruct.addElemToContentStart();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadRun(t, l, oParStruct);
            });
			var run = oParStruct.addElemToContentFinish();
			if (run.GetElementsCount() > Asc.c_dMaxParaRunContentLength) {
				this.oReadResult.runsToSplit.push(run);
			}
        }
		else if (c_oSerParType.CommentStart === type)
        {
			var oCommon = {};
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadComment(t,l, oCommon);
			});
			if(null != oCommon.Id && null != oCurContainer)
			{
			    oCommon.oParent = oCurContainer;
				var item = this.oComments[oCommon.Id];
				if(item)
					item.Start = oCommon;
				else
					this.oComments[oCommon.Id] = {Start: oCommon};
				if(null == this.oCurComments[oCommon.Id])
				{
					this.nCurCommentsCount++;
					this.oCurComments[oCommon.Id] = "";
				}
				oCommon.oParaComment = new AscCommon.ParaComment(true, oCommon.Id);
				oParStruct.addToContent(oCommon.oParaComment);
			}
        }
		else if (c_oSerParType.CommentEnd === type)
        {
			var oCommon = {};
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadComment(t,l, oCommon);
            });
			if(null != oCommon.Id && null != oCurContainer)
			{
			    oCommon.oParent = oCurContainer;
				var item = this.oComments[oCommon.Id];
				if(!item)
				{
					item = {};
					this.oComments[oCommon.Id] = item;
				}
				item.End = oCommon;
				var sQuoteText = this.oCurComments[oCommon.Id];
				if(null != sQuoteText)
				{
					item.QuoteText = sQuoteText;
					this.nCurCommentsCount--;
					delete this.oCurComments[oCommon.Id];
				}
				oCommon.oParaComment = new AscCommon.ParaComment(false, oCommon.Id);
				oParStruct.addToContent(oCommon.oParaComment);
			}
        }
		else if ( c_oSerParType.OMathPara == type )
		{
			var props = {};
			res = this.bcr.Read1(length, function(t, l){
                return oThis.boMathr.ReadMathOMathPara(t,l,oParStruct, props);
			});
		}
		else if ( c_oSerParType.OMath == type )
		{	
			var oMath = new ParaMath();
			oParStruct.addToContent(oMath);
			
			res = this.bcr.Read1(length, function(t, l){
                return oThis.boMathr.ReadMathArg(t,l,oMath.Root, oParStruct);
			});

            oMath.Root.Correct_Content(true);
		}
		else if ( c_oSerParType.MRun == type )
		{
			var props = {};
			var oMRun = new ParaRun(oParStruct.paragraph, true);
			res = this.bcr.Read1(length, function(t, l){
				return oThis.boMathr.ReadMathMRun(t,l,oMRun,props,oParStruct,oParStruct);
			});
			oParStruct.addToContent(oMRun);
		}
		else if (c_oSerParType.Hyperlink == type) {
		    var oHyperlinkObj = {Link: null, Anchor: null, Tooltip: null, History: null, DocLocation: null, TgtFrame: null};
		    var oNewHyperlink = new ParaHyperlink();
		    oNewHyperlink.SetParagraph(oParStruct.paragraph);
		    res = this.bcr.Read1(length, function (t, l) {
		        return oThis.ReadHyperlink(t, l, oHyperlinkObj, oNewHyperlink, oParStruct);
		    });
			if (null != oHyperlinkObj.Link)
				oNewHyperlink.SetValue(oHyperlinkObj.Link);
			if (null != oHyperlinkObj.Tooltip)
				 oNewHyperlink.SetToolTip(oHyperlinkObj.Tooltip);
			if (null != oHyperlinkObj.Anchor)
				oNewHyperlink.SetAnchor(oHyperlinkObj.Anchor);
			oParStruct.addToContent(oNewHyperlink);
            oNewHyperlink.Check_Content();
		}
		else if (c_oSerParType.FldSimple == type) {
			var oFldSimpleObj = {ParaField: null};
		    res = this.bcr.Read1(length, function (t, l) {
		        return oThis.ReadFldSimple(t, l, oFldSimpleObj, oParStruct);
		    });
			if(null != oFldSimpleObj.ParaField){
                //чтобы не писать здесь логику для pagenum
                oParStruct.addElem(oFldSimpleObj.ParaField);
                oParStruct.commitElem();
			}
		} else if (c_oSerParType.Del == type && this.oReadResult.checkReadRevisions()) {
            var reviewInfo = new CReviewInfo();
            var startPos = oParStruct.getCurPos();
			res = this.bcr.Read1(length, function(t, l){
                return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {parStruct: oParStruct, bdtr: oThis});
			});
            var endPos = oParStruct.getCurPos();
            for(var i = startPos; i < endPos; ++i) {
				setNestedReviewType(oParStruct.GetFromContent(i), reviewtype_Remove, reviewInfo);
            }
        } else if (c_oSerParType.Ins == type) {
            var reviewInfo = new CReviewInfo();
            var startPos = oParStruct.getCurPos();
			res = this.bcr.Read1(length, function(t, l){
                return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {parStruct: oParStruct, bdtr: oThis});
			});
			if (this.oReadResult.checkReadRevisions()) {
				var endPos = oParStruct.getCurPos();
				for(var i = startPos; i < endPos; ++i) {
					setNestedReviewType(oParStruct.GetFromContent(i), reviewtype_Add, reviewInfo);
				}
			}
		} else if (c_oSerParType.MoveFrom == type && this.oReadResult.checkReadRevisions()) {
			var reviewInfo = new CReviewInfo();
			reviewInfo.SetMove(Asc.c_oAscRevisionsMove.MoveFrom);
			var startPos = oParStruct.getCurPos();
			res = this.bcr.Read1(length, function(t, l){
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {parStruct: oParStruct, bdtr: oThis});
			});
			var endPos = oParStruct.getCurPos();
			for(var i = startPos; i < endPos; ++i) {
				setNestedReviewType(oParStruct.GetFromContent(i), reviewtype_Remove, reviewInfo);
			}
		} else if (c_oSerParType.MoveTo == type) {
			var reviewInfo = new CReviewInfo();
			reviewInfo.SetMove(Asc.c_oAscRevisionsMove.MoveTo);
			var startPos = oParStruct.getCurPos();
			res = this.bcr.Read1(length, function(t, l){
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {parStruct: oParStruct, bdtr: oThis});
			});
			if (this.oReadResult.checkReadRevisions()) {
				var endPos = oParStruct.getCurPos();
				for(var i = startPos; i < endPos; ++i) {
					setNestedReviewType(oParStruct.GetFromContent(i), reviewtype_Add, reviewInfo);
				}
			}
		} else if ( c_oSerParType.Sdt === type) {
			var oSdt = new AscCommonWord.CInlineLevelSdt();
			oSdt.RemoveFromContent(0, oSdt.GetElementsCount());
			oSdt.SetParagraph(oParStruct.paragraph);
			var oSdtStruct = new OpenParStruct(oSdt, oParStruct.paragraph);
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadSdt(t,l, oSdt, 1, oSdtStruct);
			});
			oSdtStruct.commitAll();
			if (oSdt.IsEmpty())
				oSdt.ReplaceContentWithPlaceHolder();
			oParStruct.addToContent(oSdt);
		} else if ( c_oSerParType.BookmarkStart === type) {
			readBookmarkStart(length, this.bcr, this.oReadResult, oParStruct, this.openParams);
		} else if ( c_oSerParType.BookmarkEnd === type) {
			readBookmarkEnd(length, this.bcr, this.stream, this.oReadResult, oParStruct);
		} else if ( c_oSerParType.MoveFromRangeStart === type) {
			readMoveRangeStart(length, this.bcr, this.stream, this.oReadResult, oParStruct, true);
		} else if ( c_oSerParType.MoveFromRangeEnd === type) {
			readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, oParStruct, true);
		} else if ( c_oSerParType.MoveToRangeStart === type && this.oReadResult.checkReadRevisions()) {
			readMoveRangeStart(length, this.bcr, this.stream, this.oReadResult, oParStruct, false);
		} else if ( c_oSerParType.MoveToRangeEnd === type && this.oReadResult.checkReadRevisions()) {
			readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, oParStruct, false);
		} else
		    res = c_oSerConstants.ReadUnknown;
        return res;
    };
	
	this.ReadFldChar = function (type, length, oParStruct) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSer_FldSimpleType.CharType === type) {
			oParStruct.addElemToContent(new ParaFieldChar(this.stream.GetUChar(), this.oReadResult.logicDocument));
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	}
	this.ReadFldSimple = function (type, length, oFldSimpleObj, oParStruct) {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if (c_oSer_FldSimpleType.Instr === type) {
			var Instr = this.stream.GetString2LE(length);
			oFldSimpleObj.ParaField = this.parseField(Instr, oParStruct.paragraph);
		// } else  if (c_oSer_FldSimpleType.FFData === type) {
		// 	var FFData = {};
		// 	res = this.bcr.Read1(length, function (t, l) {
		// 		return oThis.ReadFFData(t, l, FFData);
		// 	});
		// 	oFldSimpleObj.ParaField.FFData = FFData;
		} else if (c_oSer_FldSimpleType.Content === type) {
			if(null != oFldSimpleObj.ParaField) {
				var oFldStruct = new OpenParStruct(oFldSimpleObj.ParaField, oParStruct.paragraph);
				res = this.bcr.Read1(length, function (t, l) {
					return oThis.ReadParagraphContent(t, l, oFldStruct);
				});
				oFldStruct.commitAll();
			} else {
				res = this.bcr.Read1(length, function (t, l) {
					return oThis.ReadParagraphContent(t, l, oParStruct);
				});
			}
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
	this.ReadFFData = function(type, length, oFFData) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerFFData.CalcOnExit === type) {
			oFFData.CalcOnExit = this.stream.GetBool();
		} else if (c_oSerFFData.CheckBox === type) {
			oFFData.CheckBox = {};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadFFCheckBox(t, l, oFFData.CheckBox);
			});
		} else if (c_oSerFFData.DDList === type) {
			oFFData.DDList = {DLListEntry: []};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadDDList(t, l, oFFData.DDList);
			});
		} else if (c_oSerFFData.Enabled === type) {
			oFFData.Enabled = this.stream.GetBool();
		} else if (c_oSerFFData.EntryMacro === type) {
			oFFData.EntryMacro = this.stream.GetString2LE(length);
		} else if (c_oSerFFData.ExitMacro === type) {
			oFFData.ExitMacro = this.stream.GetString2LE(length);
		} else if (c_oSerFFData.HelpText === type) {
			oFFData.HelpText = {};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadFFHelpText(t, l, oFFData.HelpText);
			});
		} else if (c_oSerFFData.Label === type) {
			oFFData.Label = this.stream.GetLong();
		} else if (c_oSerFFData.Name === type) {
			oFFData.Name = this.stream.GetString2LE(length);
		} else if (c_oSerFFData.StatusText === type) {
			oFFData.StatusText = {};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadFFHelpText(t, l, oFFData.StatusText);
			});
		} else if (c_oSerFFData.TabIndex === type) {
			oFFData.TabIndex = this.stream.GetLong();
		} else if (c_oSerFFData.TextInput === type) {
			oFFData.TextInput = {};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadTextInput(t, l, oFFData.TextInput);
			});
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadFFCheckBox = function(type, length, oFFCheckBox) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerFFData.CBChecked === type) {
			oFFCheckBox.CBChecked = this.stream.GetBool();
		} else if (c_oSerFFData.CBDefault === type) {
			oFFCheckBox.CBDefault = this.stream.GetBool();
		} else if (c_oSerFFData.CBSize === type) {
			oFFCheckBox.CBSize = this.stream.GetULongLE();
		} else if (c_oSerFFData.CBSizeAuto === type) {
			oFFCheckBox.CBSizeAuto = this.stream.GetBool();
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadDDList = function(type, length, oDDList) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerFFData.DLDefault === type) {
			oDDList.DLDefault = this.stream.GetULongLE();
		} else if (c_oSerFFData.DLResult === type) {
			oDDList.DLResult = this.stream.GetULongLE();
		} else if (c_oSerFFData.DLListEntry === type) {
			oDDList.DLListEntry.push(this.stream.GetString2LE(length));
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadFFHelpText = function(type, length, oHelpText) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerFFData.HTType === type) {
			oHelpText.HTType = this.stream.GetUChar();
		} else if (c_oSerFFData.HTVal === type) {
			oHelpText.HTVal = this.stream.GetString2LE(length);
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadTextInput = function(type, length, oTextInput) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerFFData.TIDefault === type) {
			oTextInput.TIDefault = this.stream.GetString2LE(length);
		} else if (c_oSerFFData.TIFormat === type) {
			oTextInput.TIFormat = this.stream.GetString2LE(length);
		} else if (c_oSerFFData.TIMaxLength === type) {
			oTextInput.TIMaxLength = this.stream.GetULongLE();
		} else if (c_oSerFFData.TIType === type) {
			oTextInput.TIType = this.stream.GetUChar();
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
    this.ReadHyperlink = function (type, length, oHyperlinkObj, oNewHyperlink, oParStruct) {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if (c_oSer_HyperlinkType.Link === type) {
            oHyperlinkObj.Link = this.stream.GetString2LE(length);
        }
        else if (c_oSer_HyperlinkType.Anchor === type) {
            oHyperlinkObj.Anchor = this.stream.GetString2LE(length);
        }
        else if (c_oSer_HyperlinkType.Tooltip === type) {
            oHyperlinkObj.Tooltip = this.stream.GetString2LE(length);
        }
        else if (c_oSer_HyperlinkType.History === type) {
            oHyperlinkObj.History = this.stream.GetBool();
        }
        else if (c_oSer_HyperlinkType.DocLocation === type) {
            oHyperlinkObj.DocLocation = this.stream.GetString2LE(length);
        }
        else if (c_oSer_HyperlinkType.TgtFrame === type) {
            oHyperlinkObj.TgtFrame = this.stream.GetString2LE(length);
        }
        else if (c_oSer_HyperlinkType.Content === type) {
			var oHypStruct = new OpenParStruct(oNewHyperlink, oParStruct.paragraph);
            res = this.bcr.Read1(length, function (t, l) {
                return oThis.ReadParagraphContent(t, l, oHypStruct);
            });
            oHypStruct.commitAll();
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
	this.ReadComment = function(type, length, oComments)
	{
		var res = c_oSerConstants.ReadOk;
		if (c_oSer_CommentsType.Id === type)
			oComments.Id = this.stream.GetULongLE();
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	};
	this.ReadRun = function (type, length, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if (c_oSerRunType.rPr === type)
        {
            var rPr = oParStruct.curRun.Pr;
            res = this.brPrr.Read(length, rPr, oParStruct.curRun);
			oParStruct.curRun.Set_Pr(rPr);
        }
        else if (c_oSerRunType.Content === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadRunContent(t, l, oParStruct);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadText = function(text, oParStruct, isInstrText){
		for (var i = 0; i < text.length; ++i)
		{
			var nUnicode = null;
			var nCharCode = text.charCodeAt(i);
			if (AscCommon.isLeadingSurrogateChar(nCharCode))
			{
				if(i + 1 < text.length)
				{
					i++;
					var nTrailingChar = text.charCodeAt(i);
					nUnicode = AscCommon.decodeSurrogateChar(nCharCode, nTrailingChar);
				}
			}
			else
				nUnicode = nCharCode;

			if (null !== nUnicode) {
				if(isInstrText){
					oParStruct.addElemToContent(new ParaInstrText(nUnicode));
				} else {
					if (0x20 === nUnicode || 0x0A === nUnicode) {
						oParStruct.addElemToContent(new ParaSpace());
					} else if (0x0D === nUnicode) {
						if (i + 1 < text.length && 0x0A === text.charCodeAt(i + 1)) {
							i++;
						}
						oParStruct.addElemToContent(new ParaSpace());
					} else if (0x09 === nUnicode) {
						oParStruct.addElemToContent(new ParaTab());
					} else {
						oParStruct.addElemToContent(new ParaText(nUnicode));
					}
				}
			}
		}
	};
	this.ReadRunContent = function (type, length, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        var oNewElem = null;
        if (c_oSerRunType.run === type || c_oSerRunType.delText === type)
        {
            var text = this.stream.GetString2LE(length);
			if(null != this.openParams && true == this.openParams.checkFileSize)
			{
				this.openParams.charCount += length / 2;
				if(this.openParams.charCount >= g_nErrorCharCount)
					throw new Error(g_sErrorCharCountMessage);
			}
			if(this.nCurCommentsCount > 0)
			{
				for(var i in this.oCurComments)
					this.oCurComments[i] += text;
			}

			this.ReadText(text, oParStruct, false);
        }
        else if (c_oSerRunType.tab === type)
        {
            oNewElem = new ParaTab();
        }
        else if (c_oSerRunType.pagenum === type)
        {
            oNewElem = new ParaPageNum();
        }
        else if (c_oSerRunType.pagebreak === type)
        {
            oNewElem = new ParaNewLine( break_Page );
        }
        else if (c_oSerRunType.linebreak === type)
        {
            oNewElem = new ParaNewLine( break_Line );
        }
        else if (c_oSerRunType.columnbreak === type)
        {
            oNewElem = new ParaNewLine( break_Column );
        }
        else if(c_oSerRunType.image === type)
        {
            var oThis = this;
            var image = {page: null, Type: null, MediaId: null, W: null, H: null, X: null, Y: null, Paddings: null};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadImage(t,l, image);
            });
            if((c_oAscWrapStyle.Inline == image.Type && null != image.MediaId && null != image.W && null != image.H) ||
				(c_oAscWrapStyle.Flow == image.Type && null != image.MediaId && null != image.W && null != image.H && null != image.X && null != image.Y))
            {
                var doc = this.Document;
                //todo paragraph
                var drawing = new ParaDrawing(image.W, image.H, null, doc.DrawingDocument, doc,  oParStruct.paragraph);

                var src = this.oReadResult.ImageMap[image.MediaId];
                var Image = editor.WordControl.m_oLogicDocument.DrawingObjects.createImage(src, 0, 0, image.W, image.H);
                drawing.Set_GraphicObject(Image);
                Image.setParent(drawing);
                if(c_oAscWrapStyle.Flow == image.Type)
                {
                    drawing.Set_DrawingType(drawing_Anchor);
                    drawing.Set_PositionH(Asc.c_oAscRelativeFromH.Page, false, image.X, false);
                    drawing.Set_PositionV(Asc.c_oAscRelativeFromV.Page, false, image.Y, false);
                    if(image.Paddings)
                        drawing.Set_Distance(image.Paddings.Left, image.Paddings.Top, image.Paddings.Right, image.Paddings.Bottom);
                }
                if(null != drawing.GraphicObj)
                {
                    pptx_content_loader.ImageMapChecker[src] = true;
                    oNewElem = drawing;
                }
            }
        }
        else if(c_oSerRunType.pptxDrawing === type)
        {
			var oDrawing = new Object();
			this.ReadDrawing (type, length, oParStruct, oDrawing, res);
			if(null != oDrawing.content.GraphicObj)
				oNewElem = oDrawing.content;
        }
		else if(c_oSerRunType.fldstart_deprecated === type)
        {
			var sField = this.stream.GetString2LE(length);
			var oField = this.parseField(sField, oParStruct.paragraph);
			if (null != oField) {
				oParStruct.addElem(oField);
			}
            this.aFields.push(oField);
        }
		else if(c_oSerRunType.fldend_deprecated === type)
        {
			var elem = this.aFields.pop();
			if (elem) {
                oParStruct.commitElem();
            }
        }
		else if(c_oSerRunType.fldChar === type)
		{
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadFldChar(t,l,oParStruct);
			});
		}
		else if(c_oSerRunType.instrText === type || c_oSerRunType.delInstrText === type)
		{
			this.ReadText(this.stream.GetString2LE(length), oParStruct, true);
		}
        else if (c_oSerRunType._LastRun === type)
            this.oReadResult.bLastRun = true;
		else if (c_oSerRunType.object === type)
		{	
			var oDrawing = new Object();
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadObject(t,l,oParStruct,oDrawing);
			});
			if (null != oDrawing.content.GraphicObj) {
				oNewElem = oDrawing.content;
				//todo do another check
				if (oDrawing.ParaMath && oNewElem.GraphicObj.getImageUrl && 'image-1.jpg' === oNewElem.GraphicObj.getImageUrl()) {
					//word 95 ole without image
					this.oReadResult.drawingToMath.push(oNewElem);
				}
			}
		}
        else if (c_oSerRunType.cr === type)
        {
            oNewElem = new ParaNewLine( break_Line );
        }
        else if (c_oSerRunType.nonBreakHyphen === type)
        {
            oNewElem = new ParaText(0x002D);
            oNewElem.Set_SpaceAfter(false);
        }
        else if (c_oSerRunType.softHyphen === type)
        {
            //todo
        }
		else if (c_oSerRunType.separator === type)
		{
			oNewElem = new ParaSeparator();
		}
		else if (c_oSerRunType.continuationSeparator === type)
		{
			oNewElem = new ParaContinuationSeparator();
		}
		else if (c_oSerRunType.footnoteRef === type)
		{
			if (this.curFootnote) {
				oNewElem = new ParaFootnoteRef(this.curFootnote);
			}
			else if(this.oReadResult && this.oReadResult.bCopyPaste && this.openParams.oDocument){
				oNewElem = new ParaFootnoteRef(this.openParams.oDocument);
			}
		}
		else if (c_oSerRunType.footnoteReference === type)
		{
			var ref = {id: null, customMark: null};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadFootnoteRef(t, l, ref);
			});
			var footnote = this.oReadResult.footnotes[ref.id];
			if (footnote && this.oReadResult.logicDocument) {
				this.oReadResult.logicDocument.Footnotes.AddFootnote(footnote.content);
				oNewElem = new ParaFootnoteReference(footnote.content, ref.customMark);
			}
		}
        else
            res = c_oSerConstants.ReadUnknown;
        if (null != oNewElem)
        {
			oParStruct.addElemToContent(oNewElem);
        }
        return res;
    };
	this.ReadFootnoteRef = function (type, length, ref)
	{
		var res = c_oSerConstants.ReadOk;
		if(c_oSerNotes.RefCustomMarkFollows === type) {
			ref.customMark = this.stream.GetBool();
		} else if(c_oSerNotes.RefId === type) {
			ref.id = this.stream.GetULongLE();
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	};
	this.ReadDrawing = function (type, length, oParStruct, oDrawing, res)
	{
		var oThis = this;
		var doc = this.Document;
		var graphicFramePr = {locks: 0};
        var oParaDrawing = new ParaDrawing(null, null, null, doc.DrawingDocument, doc, oParStruct.paragraph);
        res = this.bcr.Read2(length, function(t, l){
            return oThis.ReadPptxDrawing(t, l, oParaDrawing, graphicFramePr);
        });
        if(null != oParaDrawing.SimplePos)
            oParaDrawing.setSimplePos(oParaDrawing.SimplePos.Use, oParaDrawing.SimplePos.X, oParaDrawing.SimplePos.Y);
        if(null != oParaDrawing.Extent)
            oParaDrawing.setExtent(oParaDrawing.Extent.W, oParaDrawing.Extent.H);
        if(null != oParaDrawing.wrappingPolygon)
            oParaDrawing.addWrapPolygon(oParaDrawing.wrappingPolygon);
		if (oDrawing.ParaMath)
			oParaDrawing.Set_ParaMath(oDrawing.ParaMath);

        if(oParaDrawing.GraphicObj)
        {
			if (oParaDrawing.GraphicObj.setLocks && graphicFramePr.locks > 0) {
				oParaDrawing.GraphicObj.setLocks(graphicFramePr.locks);
			}
            if(oParaDrawing.GraphicObj.getObjectType() !== AscDFH.historyitem_type_ChartSpace)//диаграммы могут быть без spPr
            {
                if(!oParaDrawing.GraphicObj.spPr)
                {
                    oParaDrawing.GraphicObj = null;
                }
            }
            if(AscCommon.isRealObject(oParaDrawing.docPr) && oParaDrawing.docPr.isHidden)
            {
                oParaDrawing.GraphicObj = null;
            }
            if(oParaDrawing.GraphicObj)
            {
                if(oParaDrawing.GraphicObj.bEmptyTransform)
                {
                    var oXfrm = new AscFormat.CXfrm();
                    oXfrm.setOffX(0);
                    oXfrm.setOffY(0);
                    oXfrm.setChOffX(0);
                    oXfrm.setChOffY(0);
                    oXfrm.setExtX(oParaDrawing.Extent.W);
                    oXfrm.setExtY(oParaDrawing.Extent.H);
                    oXfrm.setChExtX(oParaDrawing.Extent.W);
                    oXfrm.setChExtY(oParaDrawing.Extent.H);
                    oXfrm.setParent(oParaDrawing.GraphicObj.spPr);
                    oParaDrawing.GraphicObj.spPr.setXfrm(oXfrm);
                    delete oParaDrawing.GraphicObj.bEmptyTransform;
                }
                if(drawing_Anchor == oParaDrawing.DrawingType && typeof AscCommon.History.RecalcData_Add === "function")//TODO некорректная проверка typeof
                  AscCommon.History.RecalcData_Add( { Type : AscDFH.historyitem_recalctype_Flow, Data : oParaDrawing});
            }
        }
		oDrawing.content = oParaDrawing;
	}
	this.ReadObject = function (type, length, oParStruct, oDrawing)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if (c_oSerParType.OMath === type)
		{
			if ( length > 0 )
			{
				var oMathPara = new ParaMath();
				oDrawing.ParaMath = oMathPara;
				
				res = this.bcr.Read1(length, function(t, l){
					return oThis.boMathr.ReadMathArg(t,l,oMathPara.Root, oParStruct);
				});
				oMathPara.Root.Correct_Content(true);
			}
		}
		else if(c_oSerRunType.pptxDrawing === type)
		{
			this.ReadDrawing (type, length, oParStruct, oDrawing, res);
		}
		else
			res = c_oSerConstants.ReadUnknown;
		return res;
	}
    this.parseField = function(fld, paragraph)
    {
		var sFieldType = "";
		var aArguments = [];
		var aSwitches = [];
		var aParts = this.splitFieldArguments(fld);
		if(aParts.length > 0){
			sFieldType = aParts[0].toUpperCase();
			var bSwitch = false;
			var sCurSwitch = "";
			for(var i = 1; i < aParts.length; ++i){
				var part = aParts[i];
				if(part.length > 1 && '\\' == part[0] && '\"' != part[1] && '\\' != part[1]){
					if(sCurSwitch.length > 0)
						aSwitches.push(sCurSwitch)
					bSwitch = true;
					sCurSwitch = part.substring(1);
				}
				else{
					if(bSwitch)
						sCurSwitch += " " + part;
					else
						aArguments.push(this.parseFieldArgument(part));
				}
			}
			if(sCurSwitch.length > 0)
				aSwitches.push(sCurSwitch)
		}
		//обрабатывает известные field
		return this.initField(sFieldType, aArguments, aSwitches, paragraph);
    };
	this.splitFieldArguments = function(sVal){
		var temp = String.fromCharCode(5);
		//заменяем '\"' , чтобы было проше регулярное выражение,можно написать более быстрый код
		sVal = sVal.replace(/\\"/g, temp);
		var aMatch = sVal.match(/[^\s"]+|"[^"]*"/g);
		if(null != aMatch){
			for(var i = 0; i < aMatch.length; ++i)
				aMatch[i] = aMatch[i].replace(new RegExp(temp, 'g'), "\\\"");
			}
		else
			aMatch = [];
		return aMatch;
	};
	this.parseFieldArgument = function(sVal){
		//trim
		sVal = sVal.replace(/^\s+|\s+$/g,'');
		//remove surrounded quote
		if(sVal.length > 1 && "\"" == sVal[0] && "\"" == sVal[sVal.length - 1])
			sVal = sVal.substring(1, sVal.length - 1);
		//replace '\\' and '\"'
		sVal = sVal.replace(/\\([\\\"])/g, '$1');
		return sVal
	};
	this.initField = function(sFieldType, aArguments, aSwitches, paragraph)
    {
		var oRes = null;
		if("HYPERLINK" == sFieldType){
			var sLink = null;
			var sLocation = null;
			var sTooltip = null;
			if(aArguments.length > 0)
				sLink = aArguments[0];
			for(var i = 0; i < aSwitches.length; ++i){
				var sSwitch = aSwitches[i];
				if(sSwitch.length > 0){
					var cFirstChar = sSwitch[0].toLowerCase();
					var sFieldArgument = this.parseFieldArgument(sSwitch.substring(1));
					if("l" == cFirstChar)
						sLocation = sFieldArgument;
					else if("o" == cFirstChar)
						sTooltip = sFieldArgument;
				}
			}
			if(!(null != sLocation && sLocation.length > 0)){
				oRes = new ParaHyperlink();
				oRes.SetParagraph(paragraph);
				if(null != sLink && sLink.length > 0)
					oRes.SetValue(sLink);
				if(null != sTooltip && sTooltip.length > 0)
					oRes.SetToolTip(sTooltip);
			}
		}
		else if("PAGE" == sFieldType){
            oRes = new ParaField(fieldtype_PAGENUM, aArguments, aSwitches);
		}
		else if("NUMPAGES" == sFieldType){
			oRes = new ParaField(fieldtype_PAGECOUNT, aArguments, aSwitches);
		}
		else if("MERGEFIELD" == sFieldType){
			oRes = new ParaField(fieldtype_MERGEFIELD, aArguments, aSwitches);
            if (editor)
               editor.WordControl.m_oLogicDocument.Register_Field(oRes);
		}
		else if ("FORMTEXT" == sFieldType){
			oRes = new ParaField(fieldtype_FORMTEXT, aArguments, aSwitches);
			if (editor)
				editor.WordControl.m_oLogicDocument.Register_Field(oRes);
		}
		else if ("SEQ" == sFieldType){
			oRes = new ParaField(fieldtype_SEQ, aArguments, aSwitches);
			if (editor)
				editor.WordControl.m_oLogicDocument.Register_Field(oRes);
		}
		else if ("STYLEREF" == sFieldType){
			oRes = new ParaField(fieldtype_STYLEREF, aArguments, aSwitches);
			if (editor)
				editor.WordControl.m_oLogicDocument.Register_Field(oRes);
		}
		return oRes;
	}
    this.ReadImage = function(type, length, img)
    {
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerImageType.Page === type )
        {
            img.page = this.stream.GetULongLE();
        }
        else if ( c_oSerImageType.MediaId === type )
        {
            img.MediaId = this.stream.GetULongLE();
        }
        else if ( c_oSerImageType.Type === type )
        {
            img.Type = this.stream.GetUChar();
        }
        else if ( c_oSerImageType.Width === type )
        {
            img.W = this.bcr.ReadDouble();
        }
        else if ( c_oSerImageType.Height === type )
        {
            img.H = this.bcr.ReadDouble();
        }
        else if ( c_oSerImageType.X === type )
        {
            img.X = this.bcr.ReadDouble();
        }
        else if ( c_oSerImageType.Y === type )
        {
            img.Y = this.bcr.ReadDouble();
        }
        else if ( c_oSerImageType.Padding === type )
        {
            var oThis = this;
            img.Paddings = {Left:0, Top: 0, Right: 0, Bottom: 0};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.btblPrr.ReadPaddings(t, l, img.Paddings);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadPptxDrawing = function(type, length, oParaDrawing, graphicFramePr)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
		var emu;
        if( c_oSerImageType2.Type === type )
        {
			var nDrawingType = null;
			switch(this.stream.GetUChar())
			{
			case c_oAscWrapStyle.Inline: nDrawingType = drawing_Inline;break;
			case c_oAscWrapStyle.Flow: nDrawingType = drawing_Anchor;break;
			}
			if(null != nDrawingType)
				oParaDrawing.Set_DrawingType(nDrawingType);
		}
		else if( c_oSerImageType2.PptxData === type )
        {
			if(length > 0){
				var grObject = pptx_content_loader.ReadDrawing(this, this.stream, this.Document, oParaDrawing);
				if(null != grObject)
					oParaDrawing.Set_GraphicObject(grObject);
			}
			else
				res = c_oSerConstants.ReadUnknown;
		}
		else if( c_oSerImageType2.Chart2 === type )
        {
			res = c_oSerConstants.ReadUnknown;
			var oNewChartSpace = new AscFormat.CChartSpace();
            var oBinaryChartReader = new AscCommon.BinaryChartReader(this.stream);
            res = oBinaryChartReader.ExternalReadCT_ChartSpace(length, oNewChartSpace, this.Document);
            oNewChartSpace.setBDeleted(false);
            oParaDrawing.Set_GraphicObject(oNewChartSpace);
            oNewChartSpace.setParent(oParaDrawing);
		}
		else if( c_oSerImageType2.AllowOverlap === type )
			var AllowOverlap = this.stream.GetBool();
		else if( c_oSerImageType2.BehindDoc === type )
			oParaDrawing.Set_BehindDoc(this.stream.GetBool());
		else if( c_oSerImageType2.DistL === type )
        {
            oParaDrawing.Set_Distance(Math.abs(this.bcr.ReadDouble()), null, null, null);
        }
		else if( c_oSerImageType2.DistLEmu === type )
		{
			emu = AscFonts.FT_Common.IntToUInt(this.stream.GetULongLE());
			oParaDrawing.Set_Distance(Math.abs(g_dKoef_emu_to_mm * emu), null, null, null);
		}
		else if( c_oSerImageType2.DistT === type )
        {
            oParaDrawing.Set_Distance(null, Math.abs(this.bcr.ReadDouble()), null, null);
        }
		else if( c_oSerImageType2.DistTEmu === type )
		{
			emu = AscFonts.FT_Common.IntToUInt(this.stream.GetULongLE());
			oParaDrawing.Set_Distance(null, Math.abs(g_dKoef_emu_to_mm * emu), null, null);
		}
		else if( c_oSerImageType2.DistR === type )
        {
            oParaDrawing.Set_Distance(null, null, Math.abs(this.bcr.ReadDouble()), null);
        }
		else if( c_oSerImageType2.DistREmu === type )
		{
			emu = AscFonts.FT_Common.IntToUInt(this.stream.GetULongLE());
			oParaDrawing.Set_Distance(null, null, Math.abs(g_dKoef_emu_to_mm * emu), null);
		}
		else if( c_oSerImageType2.DistB === type )
        {
            oParaDrawing.Set_Distance(null, null, null, Math.abs(this.bcr.ReadDouble()));
        }
		else if( c_oSerImageType2.DistBEmu === type )
		{
			emu = AscFonts.FT_Common.IntToUInt(this.stream.GetULongLE());
			oParaDrawing.Set_Distance(null, null, null, Math.abs(g_dKoef_emu_to_mm * emu));
		}
		else if( c_oSerImageType2.Hidden === type )
        {
            var Hidden = this.stream.GetBool();
        }
        else if( c_oSerImageType2.LayoutInCell === type )
        {
            oParaDrawing.Set_LayoutInCell(this.stream.GetBool());
        }
		else if( c_oSerImageType2.Locked === type )
            oParaDrawing.Set_Locked(this.stream.GetBool());
		else if( c_oSerImageType2.RelativeHeight === type )
			oParaDrawing.Set_RelativeHeight(AscFonts.FT_Common.IntToUInt(this.stream.GetULongLE()));
		else if( c_oSerImageType2.BSimplePos === type )
			oParaDrawing.SimplePos.Use = this.stream.GetBool();
		else if( c_oSerImageType2.EffectExtent === type )
		{
			var oReadEffectExtent = {Left: null, Top: null, Right: null, Bottom: null};
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadEffectExtent(t, l, oReadEffectExtent);
                });
            oParaDrawing.setEffectExtent(oReadEffectExtent.L, oReadEffectExtent.T, oReadEffectExtent.R, oReadEffectExtent.B);
		}
		else if( c_oSerImageType2.Extent === type )
		{
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadExtent(t, l, oParaDrawing.Extent);
                });
		}
		else if( c_oSerImageType2.PositionH === type )
		{
			var oNewPositionH = {
				RelativeFrom      : Asc.c_oAscRelativeFromH.Column, // Относительно чего вычисляем координаты
				Align             : false,                      // true : В поле Value лежит тип прилегания, false - в поле Value лежит точное значени
				Value             : 0,                          //
                Percent           : false
			};
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadPositionHV(t, l, oNewPositionH);
                });
			oParaDrawing.Set_PositionH(oNewPositionH.RelativeFrom , oNewPositionH.Align , oNewPositionH.Value, oNewPositionH.Percent);
		}
		else if( c_oSerImageType2.PositionV === type )
		{
			var oNewPositionV = {
				RelativeFrom      : Asc.c_oAscRelativeFromV.Paragraph, // Относительно чего вычисляем координаты
				Align             : false,                         // true : В поле Value лежит тип прилегания, false - в поле Value лежит точное значени
				Value             : 0,                             //
                Percent           : false
			};
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadPositionHV(t, l, oNewPositionV);
                });
			oParaDrawing.Set_PositionV(oNewPositionV.RelativeFrom , oNewPositionV.Align , oNewPositionV.Value, oNewPositionV.Percent);
		}
		else if( c_oSerImageType2.SimplePos === type )
		{
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadSimplePos(t, l, oParaDrawing.SimplePos);
                });
		}
		else if( c_oSerImageType2.WrapNone === type )
		{
			oParaDrawing.Set_WrappingType(WRAPPING_TYPE_NONE);
		}
        else if( c_oSerImageType2.SizeRelH === type )
        {
            var oNewSizeRel = {RelativeFrom: null, Percent: null};
            res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadSizeRelHV(t, l, oNewSizeRel);
                });
            oParaDrawing.SetSizeRelH(oNewSizeRel);
        }
        else if( c_oSerImageType2.SizeRelV === type )
        {
            var oNewSizeRel = {RelativeFrom: null, Percent: null};
            res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadSizeRelHV(t, l, oNewSizeRel);
                });
            oParaDrawing.SetSizeRelV(oNewSizeRel);
        }
		else if( c_oSerImageType2.WrapSquare === type )
		{
			oParaDrawing.Set_WrappingType(WRAPPING_TYPE_SQUARE);
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadWrapSquare(t, l,  oParaDrawing.wrappingPolygon);
                });
		}
		else if( c_oSerImageType2.WrapThrough === type )
		{
			oParaDrawing.Set_WrappingType(WRAPPING_TYPE_THROUGH);
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadWrapThroughTight(t, l,  oParaDrawing.wrappingPolygon);
                });
		}
		else if( c_oSerImageType2.WrapTight === type )
		{
			oParaDrawing.Set_WrappingType(WRAPPING_TYPE_TIGHT);
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadWrapThroughTight(t, l,  oParaDrawing.wrappingPolygon);
                });
		}
		else if( c_oSerImageType2.WrapTopAndBottom === type )
		{
			oParaDrawing.Set_WrappingType(WRAPPING_TYPE_TOP_AND_BOTTOM);
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadWrapTopBottom(t, l,  oParaDrawing.wrappingPolygon);
                });
		}
		else if( c_oSerImageType2.GraphicFramePr === type )
		{
			res = this.bcr.Read2(length, function(t, l){
					return oThis.ReadNvGraphicFramePr(t, l, graphicFramePr);
				});
		} else if( c_oSerImageType2.DocPr === type ) {
			res = this.bcr.Read1(length, function(t, l){
					return oThis.ReadDocPr(t, l, oParaDrawing.docPr);
				});
		}
		else if( c_oSerImageType2.CachedImage === type )
		{
			if(null != oParaDrawing.GraphicObj)
				oParaDrawing.GraphicObj.cachedImage = this.stream.GetString2LE(length);
			else
				res = c_oSerConstants.ReadUnknown;
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadNvGraphicFramePr = function(type, length, graphicFramePr) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		var value;
		if (c_oSerGraphicFramePr.NoChangeAspect === type) {
			value = this.stream.GetBool();
			graphicFramePr.locks |= (AscFormat.LOCKS_MASKS.noChangeAspect | (value ? AscFormat.LOCKS_MASKS.noChangeAspect << 1 : 0));
		} else if (c_oSerGraphicFramePr.NoDrilldown === type) {
			value = this.stream.GetBool();
			graphicFramePr.locks |= (AscFormat.LOCKS_MASKS.noDrilldown | (value ? AscFormat.LOCKS_MASKS.noDrilldown << 1 : 0));
		} else if (c_oSerGraphicFramePr.NoGrp === type) {
			value = this.stream.GetBool();
			graphicFramePr.locks |= (AscFormat.LOCKS_MASKS.noGrp | (value ? AscFormat.LOCKS_MASKS.noGrp << 1 : 0));
		} else if (c_oSerGraphicFramePr.NoMove === type) {
			value = this.stream.GetBool();
			graphicFramePr.locks |= (AscFormat.LOCKS_MASKS.noMove | (value ? AscFormat.LOCKS_MASKS.noMove << 1 : 0));
		} else if (c_oSerGraphicFramePr.NoResize === type) {
			value = this.stream.GetBool();
			graphicFramePr.locks |= (AscFormat.LOCKS_MASKS.noResize | (value ? AscFormat.LOCKS_MASKS.noResize << 1 : 0));
		} else if (c_oSerGraphicFramePr.NoSelect === type) {
			value = this.stream.GetBool();
			graphicFramePr.locks |= (AscFormat.LOCKS_MASKS.noSelect | (value ? AscFormat.LOCKS_MASKS.noSelect << 1 : 0));
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	}
	this.ReadDocPr = function(type, length, docPr) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerDocPr.Id === type) {
			docPr.setId(this.stream.GetLongLE());
		} else if (c_oSerDocPr.Name === type) {
			docPr.setName(this.stream.GetString2LE(length));
		} else if (c_oSerDocPr.Hidden === type) {
			docPr.setIsHidden(this.stream.GetBool());
		} else if (c_oSerDocPr.Title === type) {
			docPr.setTitle(this.stream.GetString2LE(length));
		} else if (c_oSerDocPr.Descr === type) {
			docPr.setDescr(this.stream.GetString2LE(length));
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	}
	this.ReadEffectExtent = function(type, length, oEffectExtent)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerEffectExtent.Left === type )
			oEffectExtent.L = this.bcr.ReadDouble();
		else if( c_oSerEffectExtent.Top === type )
			oEffectExtent.T = this.bcr.ReadDouble();
		else if( c_oSerEffectExtent.Right === type )
			oEffectExtent.R = this.bcr.ReadDouble();
		else if( c_oSerEffectExtent.Bottom === type )
			oEffectExtent.B = this.bcr.ReadDouble();
		else if( c_oSerEffectExtent.LeftEmu === type )
			oEffectExtent.L = g_dKoef_emu_to_mm * this.stream.GetLongLE();
		else if( c_oSerEffectExtent.TopEmu === type )
			oEffectExtent.T = g_dKoef_emu_to_mm * this.stream.GetLongLE();
		else if( c_oSerEffectExtent.RightEmu === type )
			oEffectExtent.R = g_dKoef_emu_to_mm * this.stream.GetLongLE();
		else if( c_oSerEffectExtent.BottomEmu === type )
			oEffectExtent.B = g_dKoef_emu_to_mm * this.stream.GetLongLE();
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadExtent = function(type, length, oExtent)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerExtent.Cx === type )
			oExtent.W = this.bcr.ReadDouble();
		else if( c_oSerExtent.Cy === type )
			oExtent.H = this.bcr.ReadDouble();
		else if( c_oSerExtent.CxEmu === type )
			oExtent.W = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerExtent.CyEmu === type )
			oExtent.H = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadPositionHV = function(type, length, PositionH)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerPosHV.RelativeFrom === type )
			PositionH.RelativeFrom = this.stream.GetUChar();
		else if( c_oSerPosHV.Align === type )
		{
			PositionH.Align = true;
			PositionH.Value = this.stream.GetUChar();
		}
		else if( c_oSerPosHV.PosOffset === type )
		{
			PositionH.Align = false;
			PositionH.Value = this.bcr.ReadDouble();
		}
		else if( c_oSerPosHV.PosOffsetEmu === type )
		{
			PositionH.Align = false;
			PositionH.Value = g_dKoef_emu_to_mm * this.stream.GetLongLE();
		}
		else if( c_oSerPosHV.PctOffset === type )
		{
			PositionH.Percent = true;
			PositionH.Value = this.bcr.ReadDouble();
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
    this.ReadSizeRelHV = function(type, length, SizeRel)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if (c_oSerSizeRelHV.RelativeFrom === type) {
            SizeRel.RelativeFrom = this.stream.GetUChar();
        } else if (c_oSerSizeRelHV.Pct === type) {
            SizeRel.Percent = this.bcr.ReadDouble()/100.0;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }
	this.ReadSimplePos = function(type, length, oSimplePos)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerSimplePos.X === type )
			oSimplePos.X = this.bcr.ReadDouble();
		else if( c_oSerSimplePos.Y === type )
			oSimplePos.Y = this.bcr.ReadDouble();
		else if( c_oSerSimplePos.XEmu === type )
			oSimplePos.X = g_dKoef_emu_to_mm * this.stream.GetLongLE();
		else if( c_oSerSimplePos.YEmu === type )
			oSimplePos.Y = g_dKoef_emu_to_mm * this.stream.GetLongLE();
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadWrapSquare = function(type, length, wrappingPolygon)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerWrapSquare.DistL === type )
			var DistL = this.bcr.ReadDouble();
		else if( c_oSerWrapSquare.DistT === type )
			var DistT = this.bcr.ReadDouble();
		else if( c_oSerWrapSquare.DistR === type )
			var DistR = this.bcr.ReadDouble();
		else if( c_oSerWrapSquare.DistB === type )
			var DistB = this.bcr.ReadDouble();
		else if( c_oSerWrapSquare.DistLEmu === type )
			var DistL = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerWrapSquare.DistTEmu === type )
			var DistT = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerWrapSquare.DistREmu === type )
			var DistR = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerWrapSquare.DistBEmu === type )
			var DistB = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerWrapSquare.WrapText === type )
			var WrapText = this.stream.GetUChar();
		else if( c_oSerWrapSquare.EffectExtent === type )
		{
			var EffectExtent = {Left: null, Top: null, Right: null, Bottom: null};
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadEffectExtent(t, l, EffectExtent);
                });
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadWrapThroughTight = function(type, length, wrappingPolygon)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerWrapThroughTight.DistL === type )
			var DistL = this.bcr.ReadDouble();
		else if( c_oSerWrapThroughTight.DistR === type )
			var DistR = this.bcr.ReadDouble();
		else  if( c_oSerWrapThroughTight.DistLEmu === type )
			var DistL = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerWrapThroughTight.DistREmu === type )
			var DistR = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerWrapThroughTight.WrapText === type )
			var WrapText = this.stream.GetUChar();
		else if( c_oSerWrapThroughTight.WrapPolygon === type && wrappingPolygon !== undefined)
		{
            wrappingPolygon.tempArrPoints = [];
			var oStartRes = {start: null};
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadWrapPolygon(t, l, wrappingPolygon, oStartRes);
                });
            if(null != oStartRes.start)
                wrappingPolygon.tempArrPoints.unshift(oStartRes.start);
            wrappingPolygon.setArrRelPoints(wrappingPolygon.tempArrPoints);
            delete wrappingPolygon.tempArrPoints;
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadWrapTopBottom = function(type, length, wrappingPolygon)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerWrapTopBottom.DistT === type )
			var DistT = this.bcr.ReadDouble();
		else if( c_oSerWrapTopBottom.DistB === type )
			var DistB = this.bcr.ReadDouble();
		else if( c_oSerWrapTopBottom.DistTEmu === type )
			var DistT = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerWrapTopBottom.DistBEmu === type )
			var DistB = g_dKoef_emu_to_mm * this.stream.GetULongLE();
		else if( c_oSerWrapTopBottom.EffectExtent === type )
		{
			var EffectExtent = {L: null, T: null, R: null, B: null};
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadEffectExtent(t, l, EffectExtent);
                });
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadWrapPolygon = function(type, length, wrappingPolygon, oStartRes)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerWrapPolygon.Edited === type )
			wrappingPolygon.setEdited(this.stream.GetBool());
		else if( c_oSerWrapPolygon.Start === type )
		{
			oStartRes.start = new CPolygonPoint();
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadPolygonPoint(t, l, oStartRes.start);
                });
		}
		else if( c_oSerWrapPolygon.ALineTo === type )
		{
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadLineTo(t, l, wrappingPolygon.tempArrPoints);
                });
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadLineTo = function(type, length, arrPoints)
	{
		var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerWrapPolygon.LineTo === type )
		{
			var oPoint = new CPolygonPoint();
			res = this.bcr.Read2(length, function(t, l){
                    return oThis.ReadPolygonPoint(t, l, oPoint);
                });
			arrPoints.push(oPoint);
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadPolygonPoint = function(type, length, oPoint)
	{
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerPoint2D.X === type )
            oPoint.x = (this.bcr.ReadDouble()*36000 >> 0);
        else if( c_oSerPoint2D.Y === type )
            oPoint.y = (this.bcr.ReadDouble()*36000 >> 0);
		else if( c_oSerPoint2D.XEmu === type )
			oPoint.x = this.stream.GetLongLE();
		else if( c_oSerPoint2D.YEmu === type )
			oPoint.y = this.stream.GetLongLE();
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
	}
	this.ReadDocTable = function(type, length, table, tableFlow)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerDocTableType.tblPr === type )
        {
			table.Set_TableStyle2(null);
			var oNewTablePr = new CTablePr();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.btblPrr.Read_tblPr(t,l, oNewTablePr, table);
            });
			table.Pr = oNewTablePr;
			this.oReadResult.aPostOpenStyleNumCallbacks.push(function(){
				table.Set_Pr(oNewTablePr);
			});
        }
        else if( c_oSerDocTableType.tblGrid === type )
        {
			var aNewGrid = [];
            res = this.bcr.Read2(length, function(t, l){
                return oThis.Read_tblGrid(t,l, aNewGrid, table);
            });
			table.SetTableGrid(aNewGrid);
        }
        else if( c_oSerDocTableType.Content === type )
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.Read_TableContent(t, l, table);
            });
			if(table.Content.length > 0)
				table.CurCell = table.Content[0].Get_Cell( 0 );
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.Read_tblGrid = function(type, length, tblGrid, table)
    {
		var oThis = this;
        var res = c_oSerConstants.ReadOk;
        if( c_oSerDocTableType.tblGrid_Item === type )
        {
            tblGrid.push(this.bcr.ReadDouble());
        }
        else if( c_oSerDocTableType.tblGrid_ItemTwips === type )
		{
			tblGrid.push(g_dKoef_twips_to_mm * this.stream.GetULongLE());
		}
		else if( c_oSerDocTableType.tblGridChange === type && table && this.oReadResult.checkReadRevisions() && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting()))
		{
			var tblGridChange = [];
			var reviewInfo = new CReviewInfo();
			res = this.bcr.Read1(length, function(t, l) {
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {btblPrr: oThis, grid: tblGridChange});
			});
			table.SetTableGridChange(tblGridChange);
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.Read_TableContent = function(type, length, table)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        var Content = table.Content;
        if( c_oSerDocTableType.Row === type )
        {
            var row = table.private_AddRow(table.Content.length, 0);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.Read_Row(t, l, row);
            });
			if (!(reviewtype_Common === row.GetReviewType() || this.oReadResult.checkReadRevisions())) {
				table.private_RemoveRow(table.Content.length - 1);
			}
		} else if( c_oSerDocTableType.Sdt === type ) {
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadSdt(t,l, null, 2, table);
			});
		} else if (c_oSerDocTableType.BookmarkStart === type) {
			this.toNextParStruct.push(c_oToNextParType.BookmarkStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerDocTableType.BookmarkEnd === type) {
			if (!readBookmarkEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct)) {
				this.toNextParStruct.push(c_oToNextParType.BookmarkEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else if (c_oSerDocTableType.MoveFromRangeStart === type) {
			this.toNextParStruct.push(c_oToNextParType.MoveFromRangeStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerDocTableType.MoveFromRangeEnd === type) {
			if (!readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct, true, true)) {
				this.toNextParStruct.push(c_oToNextParType.MoveFromRangeEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else if (c_oSerDocTableType.MoveToRangeStart === type && this.oReadResult.checkReadRevisions()) {
			this.toNextParStruct.push(c_oToNextParType.MoveToRangeStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerDocTableType.MoveToRangeEnd === type && this.oReadResult.checkReadRevisions()) {
			if (!readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct, false, true)) {
				this.toNextParStruct.push(c_oToNextParType.MoveToRangeEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.Read_Row = function(type, length, Row)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerDocTableType.Row_Pr === type )
        {
			var oNewRowPr = new CTableRowPr();
            res = this.bcr.Read2(length, function(t, l){
                return oThis.btblPrr.Read_RowPr(t, l, oNewRowPr, Row);
            });
			Row.Set_Pr(oNewRowPr);
        }
        else if( c_oSerDocTableType.Row_Content === type )
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadRowContent(t, l, Row);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadRowContent = function(type, length, row)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        var Content = row.Content;
        if( c_oSerDocTableType.Cell === type )
        {
			var oCell = row.Add_Cell(row.Get_CellsCount(), row, null, false);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadCell(t, l, oCell);
            });
		} else if( c_oSerDocTableType.Sdt === type ) {
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadSdt(t,l, null, 3, row);
			});
		} else if (c_oSerDocTableType.BookmarkStart === type) {
			this.toNextParStruct.push(c_oToNextParType.BookmarkStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerDocTableType.BookmarkEnd === type) {
			if (!readBookmarkEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct)) {
				this.toNextParStruct.push(c_oToNextParType.BookmarkEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else if (c_oSerDocTableType.MoveFromRangeStart === type) {
			this.toNextParStruct.push(c_oToNextParType.MoveFromRangeStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerDocTableType.MoveFromRangeEnd === type) {
			if (!readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct, true, true)) {
				this.toNextParStruct.push(c_oToNextParType.MoveFromRangeEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else if (c_oSerDocTableType.MoveToRangeStart === type && this.oReadResult.checkReadRevisions()) {
			this.toNextParStruct.push(c_oToNextParType.MoveToRangeStart, this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
		} else if (c_oSerDocTableType.MoveToRangeEnd === type && this.oReadResult.checkReadRevisions()) {
			if (!readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, this.lastParStruct, false, true)) {
				this.toNextParStruct.push(c_oToNextParType.MoveToRangeEnd, this.stream.GetCurPos(), length);
				res = c_oSerConstants.ReadUnknown;
			}
		} else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadCell = function(type, length, cell)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if( c_oSerDocTableType.Cell_Pr === type )
        {
			var oNewCellPr = new CTableCellPr();
            res = this.bcr.Read2(length, function(t, l){
                return oThis.btblPrr.Read_CellPr(t, l, oNewCellPr);
            });
			cell.Set_Pr(oNewCellPr);
        }
        else if( c_oSerDocTableType.Cell_Content === type )
        {
			var oCellContent = [];
			var oCellContentReader = new Binary_DocumentTableReader(cell.Content, this.oReadResult, this.openParams, this.stream, this.curFootnote, this.oComments);
			oCellContentReader.aFields = this.aFields;
			oCellContentReader.nCurCommentsCount = this.nCurCommentsCount;
			oCellContentReader.oCurComments = this.oCurComments;
			oCellContentReader.toNextParStruct = this.toNextParStruct;
			oCellContentReader.lastParStruct = this.lastParStruct;
			oCellContentReader.Read(length, oCellContent);
			this.nCurCommentsCount = oCellContentReader.nCurCommentsCount;
			if(oCellContent.length > 0)
			{
				for(var i = 0; i < oCellContent.length; ++i)
				{
					if(i == oCellContent.length - 1)
						cell.Content.Internal_Content_Add(i + 1, oCellContent[i], true);
					else
						cell.Content.Internal_Content_Add(i + 1, oCellContent[i], false);
				}
				cell.Content.Internal_Content_Remove(0, 1);
			}
			this.toNextParStruct = oCellContentReader.toNextParStruct;
			this.lastParStruct = oCellContentReader.lastParStruct;
			//если 0 == oCellContent.length в ячейке остается параграф который был там при создании.
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadSdt = function(type, length, oSdt, typeContainer, container) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerSdt.Pr === type && (!this.oReadResult.bCopyPaste || this.oReadResult.isDocumentPasting())) {
			if (oSdt) {
				var sdtPr = new AscCommonWord.CSdtPr();
				res = this.bcr.Read1(length, function(t, l) {
					return oThis.ReadSdtPr(t, l, sdtPr, oSdt);
				});
				oSdt.SetPr(sdtPr);
			} else {
				res = c_oSerConstants.ReadUnknown;
			}
		} else if (c_oSerSdt.EndPr === type) {
			res = c_oSerConstants.ReadUnknown;
			// if (0 === typeContainer) {
			// 	oSdt.EndPr = new CTextPr();
			// 	res = this.brPrr.Read(length, oSdt.EndPr, null);
			// } else {
			// 	res = c_oSerConstants.ReadUnknown;
			// }
		} else if (c_oSerSdt.Content === type) {
			if (0 === typeContainer) {
				var oSdtContent = [];
				var oSdtContentReader = new Binary_DocumentTableReader(oSdt.Content, this.oReadResult, this.openParams,
					this.stream, this.curFootnote, this.oComments);
				oSdtContentReader.aFields = this.aFields;
				oSdtContentReader.nCurCommentsCount = this.nCurCommentsCount;
				oSdtContentReader.oCurComments = this.oCurComments;
				oSdtContentReader.toNextParStruct = this.toNextParStruct;
				oSdtContentReader.lastParStruct = this.lastParStruct;
				oSdtContentReader.Read(length, oSdtContent);
				this.nCurCommentsCount = oSdtContentReader.nCurCommentsCount;
				if (oSdtContent.length > 0) {
					for (var i = 0; i < oSdtContent.length; ++i) {
						if (i == oSdtContent.length - 1) {
							oSdt.Content.Internal_Content_Add(i + 1, oSdtContent[i], true);
						} else {
							oSdt.Content.Internal_Content_Add(i + 1, oSdtContent[i], false);
						}
					}
					oSdt.Content.Internal_Content_Remove(0, 1);
				}
				this.toNextParStruct = oSdtContentReader.toNextParStruct;
				this.lastParStruct = oSdtContentReader.lastParStruct;
			} else if (1 === typeContainer) {
				res = this.bcr.Read1(length, function(t, l) {
					return oThis.ReadParagraphContent(t, l, container);
				});
			} else if (2 === typeContainer) {
				res = this.bcr.Read1(length, function(t, l) {
					return oThis.Read_TableContent(t, l, container);
				});
			} else if (3 === typeContainer) {
				res = this.bcr.Read1(length, function(t, l) {
					return oThis.ReadRowContent(t, l, container);
				});
			}
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadSdtPr = function(type, length, oSdtPr, oSdt) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerSdt.Type === type) {
			var type = this.stream.GetByte();
			if (ESdtType.sdttypePicture === type) {
				oSdt.SetPicturePr(true);
			}
		} else if (c_oSerSdt.Alias === type) {
			oSdtPr.Alias = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.Appearance === type) {
			var Appearance = this.stream.GetByte();
			if(Appearance == Asc.c_oAscSdtAppearance.Frame || Appearance == Asc.c_oAscSdtAppearance.Hidden){
				oSdtPr.Appearance = Appearance;
			}
		} else if (c_oSerSdt.ComboBox === type) {
			var comboBox = new CSdtComboBoxPr();
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadSdtComboBox(t, l, comboBox);
			});
			oSdt.SetComboBoxPr(comboBox);
		} else if (c_oSerSdt.Color === type) {
			var textPr = new CTextPr();
			res = this.brPrr.Read(length, textPr, null);
			if(textPr.Color){
				oSdtPr.Color = textPr.Color;
			}
		// } else if (c_oSerSdt.DataBinding === type) {
		// 	oSdtPr.DataBinding = {};
		// 	res = this.bcr.Read1(length, function(t, l) {
		// 		return oThis.ReadSdtPrDataBinding(t, l, oSdtPr.DataBinding);
		// 	});
		} else if (c_oSerSdt.PrDate === type) {
			var datePicker = new CSdtDatePickerPr();
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadSdtPrDate(t, l, datePicker);
			});
			oSdt.SetDatePickerPr(datePicker);
		// } else if (c_oSerSdt.DocPartList === type) {
		// 	oSdtPr.DocPartList = {};
		// 	res = this.bcr.Read1(length, function(t, l) {
		// 		return oThis.ReadDocPartList(t, l, oSdtPr.DocPartList);
		// 	});
		} else if (c_oSerSdt.DocPartObj === type) {
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadDocPartList(t, l, oSdtPr.DocPartObj);
			});
		} else if (c_oSerSdt.DropDownList === type) {
			var comboBox = new CSdtComboBoxPr();
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadSdtComboBox(t, l, comboBox);
			});
			oSdt.SetDropDownListPr(comboBox);
		} else if (c_oSerSdt.Id === type) {
			oSdtPr.Id = this.stream.GetLongLE();
		} else if (c_oSerSdt.Label === type) {
			oSdtPr.Label = this.stream.GetLongLE();
		} else if (c_oSerSdt.Lock === type) {
			oSdtPr.Lock = this.stream.GetByte();
		// } else if (c_oSerSdt.PlaceHolder === type) {
		// 	oSdtPr.PlaceHolder = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.RPr === type) {
			var rPr = new CTextPr();
			res = this.brPrr.Read(length, rPr, null);
			oSdt.SetDefaultTextPr(rPr);
		// } else if (c_oSerSdt.ShowingPlcHdr === type) {
		// 	oSdtPr.ShowingPlcHdr = (this.stream.GetUChar() != 0);
		// } else if (c_oSerSdt.TabIndex === type) {
		// 	oSdtPr.TabIndex = this.stream.GetLongLE();
		} else if (c_oSerSdt.Tag === type) {
			oSdtPr.Tag = this.stream.GetString2LE(length);
		// } else if (c_oSerSdt.Temporary === type) {
		// 	oSdtPr.Temporary = (this.stream.GetUChar() != 0);
		// } else if (c_oSerSdt.MultiLine === type) {
		// 	oSdtPr.MultiLine = (this.stream.GetUChar() != 0);
		} else if (c_oSerSdt.Checkbox === type && oSdt.SetCheckBoxPr) {
			var checkBoxPr = new CSdtCheckBoxPr();
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadSdtCheckBox(t, l, checkBoxPr);
			});
			oSdt.SetCheckBoxPr(checkBoxPr);
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadSdtCheckBox = function(type, length, val) {
		var res = c_oSerConstants.ReadOk;
		if (c_oSerSdt.CheckboxChecked === type) {
			val.Checked = this.stream.GetBool();
		} else if (c_oSerSdt.CheckboxCheckedFont === type) {
			val.CheckedFont = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.CheckboxCheckedVal === type) {
			val.CheckedSymbol = this.stream.GetLong();
		} else if (c_oSerSdt.CheckboxUncheckedFont === type) {
			val.UncheckedFont = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.CheckboxUncheckedVal === type) {
			val.UncheckedSymbol = this.stream.GetLong();
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadSdtComboBox = function(type, length, val) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		/*if (c_oSerSdt.LastValue === type) {
			val.LastValue = this.stream.GetString2LE(length);
		} else */if (c_oSerSdt.SdtListItem === type) {
			var listItem = new CSdtListItem();
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadSdtListItem(t, l, listItem);
			});
			val.ListItems.push(listItem);
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadSdtListItem = function(type, length, val) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerSdt.DisplayText === type) {
			val.DisplayText = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.Value === type) {
			val.Value = this.stream.GetString2LE(length);
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadSdtPrDataBinding = function(type, length, val) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerSdt.PrefixMappings === type) {
			val.PrefixMappings = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.StoreItemID === type) {
			val.StoreItemID = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.XPath === type) {
			val.XPath = this.stream.GetString2LE(length);
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadSdtPrDate = function(type, length, val) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerSdt.FullDate === type) {
			val.FullDate = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.Calendar === type) {
			val.Calendar = this.stream.GetUChar();
		} else if (c_oSerSdt.DateFormat === type) {
			val.DateFormat = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.Lid === type) {
			var langId = Asc.g_oLcidNameToIdMap[this.stream.GetString2LE(length)];
			val.LangId = langId || val.LangId;
		// } else if (c_oSerSdt.StoreMappedDataAs === type) {
		// 	val.StoreMappedDataAs = this.stream.GetUChar();
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
	this.ReadDocPartList = function(type, length, val) {
		var res = c_oSerConstants.ReadOk;
		if (c_oSerSdt.DocPartCategory === type) {
			val.Category = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.DocPartGallery === type) {
			val.Gallery = this.stream.GetString2LE(length);
		} else if (c_oSerSdt.DocPartUnique === type) {
			val.Unique = (this.stream.GetUChar() != 0);
		} else {
			res = c_oSerConstants.ReadUnknown;
		}
		return res;
	};
};
function Binary_oMathReader(stream, oReadResult, curFootnote, openParams)
{	
    this.stream = stream;
	this.oReadResult = oReadResult;
	this.curFootnote = curFootnote;
	this.openParams = openParams;
	this.bcr = new Binary_CommonReader(this.stream);
	this.brPrr = new Binary_rPrReader(null, oReadResult, this.stream);
	
	this.ReadRun = function (type, length, oRunObject, oParStruct, oRes)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        if (c_oSerRunType.rPr === type)
        {
            var rPr = oRunObject.Pr;
            res = this.brPrr.Read(length, rPr, oRunObject);
            oRunObject.Set_Pr(rPr);
        }
        else if (c_oSerRunType.Content === type)
        {
            var oPos = { run: oRunObject , pos: 0};
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadRunContent(t, l, oPos, oParStruct, oRes);
            });
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadRunContent = function (type, length, oPos, oParStruct, oRes)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
        var oNewElem = null;
        if (c_oSerRunType.run === type)
        {
            var text = this.stream.GetString2LE(length);

			for (var i = 0; i < text.length; ++i)
			{
			    var nUnicode = null;
			    var nCharCode = text.charCodeAt(i);
			    if (AscCommon.isLeadingSurrogateChar(nCharCode))
			    {
			        if(i + 1 < text.length)
			        {
			            i++;
			            var nTrailingChar = text.charCodeAt(i);
			            nUnicode = AscCommon.decodeSurrogateChar(nCharCode, nTrailingChar);
			        }
			    }
			    else
			        nUnicode = nCharCode;

			    if (null != nUnicode) {
					if (0x20 === nUnicode || 0x0A === nUnicode) {
						oPos.run.AddToContent(oPos.pos, new ParaSpace(), false);
					} else if (0x0D === nUnicode) {
						if (i + 1 < text.length && 0x0A === text.charCodeAt(i + 1)) {
							i++;
						}
						oPos.run.AddToContent(oPos.pos, new ParaSpace(), false);
					} else if (0x09 === nUnicode) {
						oPos.run.AddToContent(oPos.pos, new ParaTab(), false);
					} else {
						oPos.run.AddToContent(oPos.pos, new ParaText(nUnicode), false);
					}
					oPos.pos++;
			    }
            }
        }
        else if (c_oSerRunType.tab === type)
        {
            oNewElem = new ParaTab();
        }
        else if (c_oSerRunType.pagenum === type)
        {
            oNewElem = new ParaPageNum();
        }
        else if (c_oSerRunType.pagebreak === type)
        {
            oNewElem = new ParaNewLine( break_Page );
        }
        else if (c_oSerRunType.linebreak === type)
        {
            oNewElem = new ParaNewLine( break_Line );
        }
        else if (c_oSerRunType.columnbreak === type)
        {
            oNewElem = new ParaNewLine( break_Column );
        }
        else if (c_oSerRunType.cr === type)
        {
            oNewElem = new ParaNewLine( break_Line );
        }
        else if (c_oSerRunType.nonBreakHyphen === type)
        {
            oNewElem = new ParaText(0x002D);
            oNewElem.Set_SpaceAfter(false);
        }
        else if (c_oSerRunType.softHyphen === type)
        {
            //todo
        }
		else if (c_oSerRunType.separator === type)
		{
			oNewElem = new ParaSeparator();
		}
		else if (c_oSerRunType.continuationSeparator === type)
		{
			oNewElem = new ParaContinuationSeparator();
		}
		else if (c_oSerRunType.footnoteRef === type)
		{
			if (this.curFootnote) {
				oNewElem = new ParaFootnoteRef(this.curFootnote);
			}
		}
		else if (c_oSerRunType.footnoteReference === type)
		{
			var ref = {id: null, customMark: null};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.ReadFootnoteRef(t, l, ref);
			});
			var footnote = this.oReadResult.footnotes[ref.id];
			if (footnote) {
				this.oReadResult.logicDocument.Footnotes.AddFootnote(footnote.content);
				oNewElem = new ParaFootnoteReference(footnote.content, ref.customMark);
			}
		}
        else if (c_oSerRunType._LastRun === type)
            this.oReadResult.bLastRun = true;
        else
            res = c_oSerConstants.ReadUnknown;
        if (null != oNewElem)
        {
            oPos.run.Add_ToContent(oPos.pos, oNewElem, false);
            oPos.pos++;
        }
        return res;
    };
	this.ReadMathAccInit = function(props, oParent, oContent, oParStruct) {
		if (!oContent.content) {
			var oMathAcc = new CAccent(props);
			if (initMathRevisions(oMathAcc, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oMathAcc);
				}
				if (oParStruct) {
					oMathAcc.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oMathAcc.getBase();
			}
		}
	};
	this.ReadMathAcc = function(type, length, props, oParent, oContent, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.AccPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathAccPr(t,l,props);
            });
			this.ReadMathAccInit(props, oParent, oContent, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathAccInit(props, oParent, oContent, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathAccPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Chr === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathChr(t,l,props, c_oSer_OMathChrType.Chr);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathAln = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		props.aln = false;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.aln = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathAlnScr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.alnScr = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathArg = function(type, length, oElem, oParStruct)
    {
		var bLast = this.bcr.stream.bLast;
			
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		var props = {};
		if (c_oSer_OMathContentType.Acc === type)
        {
			var oContent = {};
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathAcc(t,l,props,oElem,oContent, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.ArgPr === type)
        {
			//этой обертки пока нет
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArgPr(t,l,oElem);
            });
        }		
		else if (c_oSer_OMathContentType.Bar === type)
        {
			var oContent = {};
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathBar(t,l,props,oElem, oContent, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.BorderBox === type)
        {			
			var oContent = {};
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathBorderBox(t,l,props,oElem, oContent, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Box === type)
        {
			var oContent = {};
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathBox(t,l,props,oElem,oContent, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.CtrlPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });
			oElem.setCtrPrp(props.ctrlPr);
        }
		else if (c_oSer_OMathContentType.Delimiter === type)
        {
			var offsets = [];
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathDelimiter(t,l,props,offsets);
            });
			if (!props.column) {
				props.column = offsets.length / 2;
			}
			var oDelimiter = new CDelimiter(props);
			if (initMathRevisions(oDelimiter, props, this)) {
				oElem.addElementToContent(oDelimiter);
				if(oParStruct)
					oDelimiter.Paragraph = oParStruct.paragraph;
				var oOldPos = this.stream.GetCurPos();
				for (var i = 0; i < offsets.length / 2; i++) {
					this.stream.Seek2(offsets[2 * i]);
					res = this.bcr.Read1(offsets[2 * i + 1], function(t, l){
						return oThis.ReadMathArg(t,l,oDelimiter.getBase(i), oParStruct);
					});
				}
				this.stream.Seek2(oOldPos);
			}
        }	
		else if (c_oSer_OMathContentType.Del === type && this.oReadResult.checkReadRevisions())
		{
			var reviewInfo = new CReviewInfo();
			var oSdt = new AscCommonWord.CInlineLevelSdt();
			oSdt.RemoveFromContent(0, oSdt.GetElementsCount());
			oSdt.SetParagraph(oParStruct.paragraph);
			var oSdtStruct = new OpenParStruct(oSdt, oParStruct.paragraph);
			res = this.bcr.Read1(length, function(t, l){
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {parStruct: oSdtStruct, bdtr: oThis.oReadResult.bdtr});
			});
			if (oElem) {
				for (var i = 0; i < oSdtStruct.GetContentLength(); ++i) {
					var elem = oSdtStruct.GetFromContent(i);
					setNestedReviewType(elem, reviewtype_Remove, reviewInfo);
					oElem.addElementToContent(elem);
				}
			}
		}
		else if (c_oSer_OMathContentType.EqArr === type)
        {				
			var offsets = [];
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathEqArr(t,l,props,offsets);
            });
			if (!props.row) {
				props.row = offsets.length / 2;
			}
			if (!props.ctrPrp)
				props.ctrPrp = new CTextPr();
			var oEqArr = new CEqArray(props);
			if (initMathRevisions(oEqArr, props, this)) {
				oElem.addElementToContent(oEqArr);
				if(oParStruct)
					oEqArr.Paragraph = oParStruct.paragraph;

				var nOldPos = this.stream.GetCurPos();
				for (var i = 0; i < offsets.length / 2; i++) {
					this.stream.Seek2(offsets[2 * i]);
					res = this.bcr.Read1(offsets[2 * i + 1], function(t, l) {
						return oThis.ReadMathArg(t, l, oEqArr.getElement(i), oParStruct);
					});
				}
				this.stream.Seek2(nOldPos);

				if (props.mcJc)
				{
					var oEqArr = oElem.Content[oElem.Content.length-1];
					for(var j=0; j<oEqArr.Content.length; j++)
					{
						var oContentElem = oEqArr.Content[j];
						if (oContentElem.Content.length == 0)
							oContentElem.SetPlaceholder();
					}
					oEqArr.setJustificationForConversion(props.mcJc);
				}
			}
        }
		else if (c_oSer_OMathContentType.Fraction === type)
        {
			var oElemDen = {};
			var oElemNum = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathFraction(t,l,props,oElem,oElemDen,oElemNum, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Func === type)
        {
			var oContent = {};
			var oName = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathFunc(t,l,props,oElem,oContent,oName, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.GroupChr === type)
        {
			var oContent = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathGroupChr(t,l,props,oElem,oContent, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Ins === type)
		{
			var reviewInfo = new CReviewInfo();
			var oSdt = new AscCommonWord.CInlineLevelSdt();
			oSdt.RemoveFromContent(0, oSdt.GetElementsCount());
			oSdt.SetParagraph(oParStruct.paragraph);
			var oSdtStruct = new OpenParStruct(oSdt, oParStruct.paragraph);
			res = this.bcr.Read1(length, function(t, l){
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {parStruct: oSdtStruct, bdtr: oThis.oReadResult.bdtr});
			});
			if (oElem) {
				for (var i = 0; i < oSdtStruct.GetContentLength(); ++i) {
					var elem = oSdtStruct.GetFromContent(i);
					if (this.oReadResult.checkReadRevisions()) {
						setNestedReviewType(elem, reviewtype_Add, reviewInfo);
					}
					oElem.addElementToContent(elem);
				}
			}
		}
		else if (c_oSer_OMathContentType.LimLow === type)
        {
			var oContent = {};
			var oLim = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathLimLow(t,l,props,oElem,oContent,oLim, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.LimUpp === type)
        {
			var oContent = {};
			var oLim = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathLimUpp(t,l,props,oElem,oContent,oLim, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Matrix === type)
        {
			var arrContent = [];
			props.mcs = [];
            res = this.bcr.Read1(length, function(t, l){				
				return oThis.ReadMathMatrix(t, l, props, arrContent, oParStruct);
			});
			if (oElem) {
				//create props by content, important  before creation matrix
				var rowMax = arrContent.length;
				var colMax = 0;
				for (var i = 0; i < arrContent.length; ++i) {
					var row = arrContent[i];
					if(colMax < row.length) {
						colMax = row.length;
					}
				}
				props.row = rowMax;
				var colMaxMc = 0;
				for (var i = 0; i < props.mcs.length; ++i) {
					colMaxMc += props.mcs[i].count;
				}
				if (colMaxMc < colMax) {
					props.mcs.push({count: colMax - colMaxMc, mcJc: MCJC_CENTER});
				}
				//create matrix
				var oMatrix = new CMathMatrix(props);
				if (initMathRevisions(oMatrix, props, this)) {
					oElem.addElementToContent(oMatrix);
					//read rows
					var nOldPos = this.stream.GetCurPos();
					for (var i = 0; i < arrContent.length; ++i) {
						var row = arrContent[i];
						for (var j = 0 ; j < row.length; ++j) {
							var cell = row[j];
							this.stream.Seek2(cell.pos);
							res = this.bcr.Read1(cell.length, function(t, l){
								return oThis.ReadMathArg(t, l, oMatrix.getElement(i, j), oParStruct);
							});	
						}
					}
					this.stream.Seek2(nOldPos);
				}
			}
        }			
		else if (c_oSer_OMathContentType.Nary === type)
        {
			var oContent = {};
			var oSub = {};
			var oSup = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathNary(t,l,props,oElem,oContent,oSub,oSup, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.OMath === type)
        {		
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathArg(t,l,oElem, oParStruct);
            });
        }
		else if (c_oSer_OMathContentType.Phant === type)
        {
			var oContent = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathPhant(t,l,props,oElem,oContent, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.MRun === type)
        {
            var oParagraph = oParStruct ? oParStruct.paragraph : null;
			var oMRun = new ParaRun(oParagraph, true);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathMRun(t,l,oMRun,props,oElem,oParStruct);
            });
			if (oElem)	
				oElem.addElementToContent(oMRun);
        }
		else if (c_oSer_OMathContentType.Rad === type)
        {
			var oContent = {};
			var oDeg = {};
			var oRad = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathRad(t,l,props,oElem,oRad,oContent,oDeg, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.SPre === type)
        {
			var oContent = {};
			var oSub = {};
			var oSup = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathSPre(t,l,props,oElem,oContent,oSub,oSup, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.SSub === type)
        {
			var oContent = {};
			var oSub = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathSSub(t,l,props,oElem,oContent,oSub, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.SSubSup === type)
        {
			var oContent = {};
			var oSub = {};
			var oSup = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathSSubSup(t,l,props,oElem,oContent,oSub,oSup, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.SSup === type)
        {
			var oContent = {};
			var oSup = {};
            res = this.bcr.Read1(length, function(t, l){				
                return oThis.ReadMathSSup(t,l,props,oElem,oContent,oSup, oParStruct);
            });
		} else if ( c_oSer_OMathContentType.BookmarkStart === type) {
			//todo put elems inside math(now it leads to crush)
			readBookmarkStart(length, this.bcr, this.oReadResult, oParStruct, this.openParams);
		} else if ( c_oSer_OMathContentType.BookmarkEnd === type) {
			readBookmarkEnd(length, this.bcr, this.stream, this.oReadResult, oParStruct);
		} else if (c_oSer_OMathContentType.MoveFromRangeStart === type) {
			readMoveRangeStart(length, this.bcr, this.stream, this.oReadResult, oParStruct, true);
		} else if (c_oSer_OMathContentType.MoveFromRangeEnd === type) {
			readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, oParStruct, true);
		} else if (c_oSer_OMathContentType.MoveToRangeStart === type && this.oReadResult.checkReadRevisions()) {
			readMoveRangeStart(length, this.bcr, this.stream, this.oReadResult, oParStruct, false);
		} else if (c_oSer_OMathContentType.MoveToRangeEnd === type && this.oReadResult.checkReadRevisions()) {
			readMoveRangeEnd(length, this.bcr, this.stream, this.oReadResult, oParStruct, false);
		} else
            res = c_oSerConstants.ReadUnknown;
			
		if (oElem && bLast)
			oElem.Correct_Content(false);

        return res;
    };		
	this.ReadMathArgPr = function(type, length, oElem)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.ArgSz === type)
        {
			var props = {};
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathArgSz(t,l,props);
            });
			oElem.SetArgSize(props.argSz);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathArgSz = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.argSz = this.stream.GetULongLE();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBarInit = function(props, oParent, oContent, oParStruct) {
		if (!oContent.content) {
			var oBar = new CBar(props);
			if (initMathRevisions(oBar, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oBar);
				}

				if (oParStruct) {
					oBar.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oBar.getBase();
			}
		}
	};
	this.ReadMathBar = function(type, length,props, oParent, oContent, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.BarPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathBarPr(t,l,props);
            });		
			this.ReadMathBarInit(props, oParent, oContent, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathBarInit(props, oParent, oContent, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBarPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Pos === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathPos(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBaseJc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var baseJc = this.stream.GetUChar(length);
			switch (baseJc)
			{
				case c_oAscYAlign.Bottom:	props.baseJc = BASEJC_BOTTOM; break;
				case c_oAscYAlign.Center:	props.baseJc = BASEJC_CENTER; break;
				case c_oAscYAlign.Top:		props.baseJc = BASEJC_TOP; break;
				default: props.baseJc = BASEJC_TOP;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBorderBoxInit = function(props, oParent, oContent, oParStruct) {
		if (!oContent.content) {
			var oBorderBox = new CBorderBox(props);
			if (initMathRevisions(oBorderBox, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oBorderBox);
				}
				if (oParStruct) {
					oBorderBox.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oBorderBox.getBase();
			}
		}
	};
	this.ReadMathBorderBox = function(type, length, props, oParent, oContent, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.BorderBoxPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathBorderBoxPr(t,l,props);
            });	
			this.ReadMathBorderBoxInit(props, oParent, oContent, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathBorderBoxInit(props, oParent, oContent, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBorderBoxPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.HideBot === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathHideBot(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.HideLeft === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathHideLeft(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.HideRight === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathHideRight(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.HideTop === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathHideTop(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.StrikeBLTR === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathStrikeBLTR(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.StrikeH === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathStrikeH(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.StrikeTLBR === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathStrikeTLBR(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.StrikeV === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathStrikeV(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBoxInit = function(props, oParent, oContent, oParStruct) {
		if (!oContent.content) {
			var oBox = new CBox(props);
			if (initMathRevisions(oBox, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oBox);
				}
				if (oParStruct) {
					oBox.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oBox.getBase();
			}
		}
	};
	this.ReadMathBox = function(type, length, props, oParent, oContent, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.BoxPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathBoxPr(t,l,props);
            });
			this.ReadMathBoxInit(props, oParent, oContent, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathBoxInit(props, oParent, oContent, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBoxPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Aln === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathAln(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Brk === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathBrk(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Diff === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathDiff(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.NoBreak === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathNoBreak(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.OpEmu === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathOpEmu(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBrk = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var brk = this.stream.GetBool();
			props.brk = {};
        }
		else if (c_oSer_OMathBottomNodesValType.AlnAt === type)
        {
			var aln = this.stream.GetULongLE();
			props.brk = { alnAt:aln};
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathCGp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
		
		if(c_oSer_OMathBottomNodesValType.Val == type)
            props.cGp = this.stream.GetULongLE();

        return res;
    };
	this.ReadMathCGpRule = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
		
        if(c_oSer_OMathBottomNodesValType.Val == type)
            props.cGpRule = this.stream.GetULongLE();
			
        return res;
    };
	this.ReadMathCSp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
		
		if(c_oSer_OMathBottomNodesValType.Val == type)
            props.cSp = this.stream.GetULongLE();

        return res;
    };
	this.ReadMathColumn = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
		props.column = 0;
		
		if(c_oSer_OMathBottomNodesValType.Val == type)
            props.column = this.stream.GetULongLE();

        return res;
    };
	this.ReadMathCount = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
		props.count = 0;
		
		if(c_oSer_OMathBottomNodesValType.Val == type)
            props.count = this.stream.GetULongLE();

        return res;
    };
	this.ReadMathChr = function(type, length, props, typeChr)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var text = this.stream.GetString2LE(length);
            var aUnicode = AscCommon.convertUTF16toUnicode(text);

            var chr = (aUnicode.length <= 0 ? OPERATOR_EMPTY : aUnicode[0]);

            switch (typeChr)
            {
                default:
                case c_oSer_OMathChrType.Chr:    props.chr    = chr; break;
                case c_oSer_OMathChrType.BegChr: props.begChr = chr; break;
                case c_oSer_OMathChrType.EndChr: props.endChr = chr; break;
                case c_oSer_OMathChrType.SepChr: props.sepChr = chr; break;
            }
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathCtrlPr = function(type, length, props) {
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerRunType.rPr === type) {
			var MathTextRPr = new CTextPr();
			res = this.brPrr.Read(length, MathTextRPr, null);
			props.ctrPrp = MathTextRPr;
		} else if (c_oSerRunType.arPr === type) {
			props.ctrPrp = pptx_content_loader.ReadRunProperties(this.stream);
		} else if (c_oSerRunType.del === type) {
            var rPrChange = new CTextPr();
            var reviewInfo = new CReviewInfo();
            var brPrr = new Binary_rPrReader(this.Document, this.oReadResult, this.stream);
            res = this.bcr.Read1(length, function(t, l){
                return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {brPrr: brPrr, rPr: rPrChange});
            });
            props.del = reviewInfo;
		} else if (c_oSerRunType.ins === type) {
            var rPrChange = new CTextPr();
            var reviewInfo = new CReviewInfo();
            var brPrr = new Binary_rPrReader(this.Document, this.oReadResult, this.stream);
            res = this.bcr.Read1(length, function(t, l){
                return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {brPrr: brPrr, rPr: rPrChange});
            });
			if(this.oReadResult.checkReadRevisions()){
				props.ins = reviewInfo;
			}
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathDelimiter = function(type, length, props, offsets)
    {		
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.DelimiterPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathDelimiterPr(t,l,props);
            });
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			offsets.push(this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathDelimiterPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Column === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathColumn(t,l,props);
            });	
        }
		else if (c_oSer_OMathBottomNodesType.BegChr === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathChr(t,l,props, c_oSer_OMathChrType.BegChr);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.EndChr === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathChr(t,l,props, c_oSer_OMathChrType.EndChr);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.Grow === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathGrow(t,l,props);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.SepChr === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathChr(t,l,props, c_oSer_OMathChrType.SepChr);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.Shp === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathShp(t,l,props);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathDegHide = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.degHide = this.stream.GetBool();
        }		
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathDiff = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.diff = this.stream.GetBool();
        }		
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathEqArr = function(type, length, props, offsets)
    {		
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.EqArrPr === type)
        {			
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathEqArrPr(t,l,props);
            });
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			offsets.push(this.stream.GetCurPos(), length);
			res = c_oSerConstants.ReadUnknown;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathEqArrPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Row === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathRow(t,l,props);
            });	
        }
		else if (c_oSer_OMathBottomNodesType.BaseJc === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathBaseJc(t,l,props);
            });	
        }		
		else if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.MaxDist === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathMaxDist(t,l,props);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.McJc === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathMcJc(t,l,props);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.ObjDist === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathObjDist(t,l,props);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.RSp === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathRSp(t,l,props);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.RSpRule === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathRSpRule(t,l,props);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathFractionInit = function(props, oParent, oElemDen, oElemNum, oParStruct) {
		if (!oElemDen.content && !oElemNum.content) {
			var oFraction = new CFraction(props);
			if (initMathRevisions(oFraction, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oFraction);
				}

				if (oParStruct) {
					oFraction.Paragraph = oParStruct.paragraph;
				}
				oElemDen.content = oFraction.getDenominator();
				oElemNum.content = oFraction.getNumerator();
			}
		}
	};
	this.ReadMathFraction = function(type, length, props, oParent, oElemDen, oElemNum, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.FPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathFPr(t,l,props);
            });
			this.ReadMathFractionInit(props, oParent, oElemDen, oElemNum, oParStruct);
        }
		else if (c_oSer_OMathContentType.Den === type)
        {
			this.ReadMathFractionInit(props, oParent, oElemDen, oElemNum, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oElemDen.content, oParStruct);
            });
        }
		else if (c_oSer_OMathContentType.Num === type)
        {
			this.ReadMathFractionInit(props, oParent, oElemDen, oElemNum, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oElemNum.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathFPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Type === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathType(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathFuncInit = function(props, oParent, oContent, oName, oParStruct) {
		if (!oContent.content && !oName.content) {
			var oFunc = new CMathFunc(props);
			if (initMathRevisions(oFunc, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oFunc);
				}
				if (oParStruct) {
					oFunc.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oFunc.getArgument();
				oName.content = oFunc.getFName();
			}
		}
	};
	this.ReadMathFunc = function(type, length, props, oParent, oContent, oName, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.FuncPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathFuncPr(t,l,props);
            });
			this.ReadMathFuncInit(props, oParent, oContent, oName, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathFuncInit(props, oParent, oContent, oName, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.FName === type)
        {
			this.ReadMathFuncInit(props, oParent, oContent, oName, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oName.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathFuncPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathHideBot = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.hideBot = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathGroupChrInit = function(props, oParent, oContent, oParStruct) {
		if (!oContent.content) {
			var oGroupChr = new CGroupCharacter(props);
			if (initMathRevisions(oGroupChr, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oGroupChr);
				}
				if (oParStruct) {
					oGroupChr.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oGroupChr.getBase();
			}
		}
	};
	this.ReadMathGroupChr = function(type, length, props, oParent, oContent, oParStruct)
    {		
        var res = c_oSerConstants.ReadOk;
        var oThis = this;	
		if (c_oSer_OMathContentType.GroupChrPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathGroupChrPr(t,l,props);
            });
			this.ReadMathGroupChrInit(props, oParent, oContent, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathGroupChrInit(props, oParent, oContent, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathGroupChrPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Chr === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathChr(t,l,props, c_oSer_OMathChrType.Chr);
            });	
        }	
		else if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.Pos === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathPos(t,l,props);
            });			
        }
		else if (c_oSer_OMathBottomNodesType.VertJc === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathVertJc(t,l,props);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathGrow = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.grow = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathHideLeft = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.hideLeft = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathHideRight = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.hideRight = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathHideTop = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.hideTop = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathLimLoc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var limLoc = this.stream.GetUChar(length);
			switch (limLoc)
			{
				case c_oAscLimLoc.SubSup:	props.limLoc = NARY_SubSup ; break;
				case c_oAscLimLoc.UndOvr:	props.limLoc = NARY_UndOvr; break;
				default: props.limLoc = NARY_SubSup ;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathLimLowInit = function(props, oParent, oContent, oLim, oParStruct) {
		if (!oContent.content && !oLim.content) {
			props.type = LIMIT_LOW;
			var oLimLow = new CLimit(props);
			if (initMathRevisions(oLimLow, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oLimLow);
				}

				if (oParStruct) {
					oLimLow.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oLimLow.getFName();
				oLim.content = oLimLow.getIterator();
			}
		}
	};
	this.ReadMathLimLow = function(type, length, props, oParent, oContent, oLim, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.LimLowPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathLimLowPr(t,l,props);
            });
			this.ReadMathLimLowInit(props, oParent, oContent, oLim, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathLimLowInit(props, oParent, oContent, oLim, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Lim === type)
        {
			this.ReadMathLimLowInit(props, oParent, oContent, oLim, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oLim.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathLimLowPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathLimUppInit = function(props, oParent, oContent, oLim, oParStruct) {
		if (!oContent.content && !oLim.content) {
			props.type = LIMIT_UP;
			var oLimUpp = new CLimit(props);
			if (initMathRevisions(oLimUpp, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oLimUpp);
				}
				if (oParStruct) {
					oLimUpp.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oLimUpp.getFName();
				oLim.content = oLimUpp.getIterator();
			}
		}
	};
	this.ReadMathLimUpp = function(type, length, props, oParent, oContent, oLim, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.LimUppPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathLimUppPr(t,l,props);
            });
			this.ReadMathLimUppInit(props, oParent, oContent, oLim, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathLimUppInit(props, oParent, oContent, oLim, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Lim === type)
        {
			this.ReadMathLimUppInit(props, oParent, oContent, oLim, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oLim.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathLimUppPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathLit = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.lit = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathMatrix = function(type, length, props, arrContent)
    {		
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.MPr === type)
        {			
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathMPr(t,l,props);
            });			
        }
		else if (c_oSer_OMathContentType.Mr === type)
        {
			var row = [];
            res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadMathMr(t, l, row);
            });
			if (row.length > 0) {
				arrContent.push(row);
			}
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathMc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.McPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathMcPr(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathMcJc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var mcJc = this.stream.GetUChar(length);
			switch (mcJc)
			{
				case c_oAscXAlign.Center:	props.mcJc = MCJC_CENTER; break;
				case c_oAscXAlign.Inside:	props.mcJc = MCJC_INSIDE; break;
				case c_oAscXAlign.Left:		props.mcJc = MCJC_LEFT; break;
				case c_oAscXAlign.Outside:	props.mcJc = MCJC_OUTSIDE; break;
				case c_oAscXAlign.Right:	props.mcJc = MCJC_RIGHT; break;
				default: props.mcJc = MCJC_CENTER;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathMcPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Count === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathCount(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.McJc === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathMcJc(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathMcs = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.Mc === type)
        {
			var mc = {};
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathMc(t,l,mc);
            });	
			props.mcs.push(mc);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathMJc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var mJc = this.stream.GetUChar(length);
			switch (mJc)
			{
				case c_oAscMathJc.Center:		props.mJc = JC_CENTER; break;
				case c_oAscMathJc.CenterGroup:	props.mJc = JC_CENTERGROUP; break;
				case c_oAscMathJc.Left:			props.mJc = JC_LEFT; break;
				case c_oAscMathJc.Right:		props.mJc = JC_RIGHT; break;
				default: props.mJc = JC_CENTERGROUP;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathMPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Row === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathRow(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.BaseJc === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathBaseJc(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.CGp === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathCGp(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.CGpRule === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathCGpRule(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.CSp === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathCSp(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Mcs === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathMcs(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.PlcHide === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathPlcHide(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.RSp === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathRSp(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.RSpRule === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathRSpRule(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathMr = function(type, length, arrContent)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.Element === type)
        {
			arrContent.push({pos: this.stream.GetCurPos(), length: length});
			res = c_oSerConstants.ReadUnknown;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathMaxDist = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.maxDist = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathText = function(type, length, oMRun)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var aUnicodes = [];
            if (length > 0)
                aUnicodes = AscCommon.convertUTF16toUnicode(this.stream.GetString2LE(length));

			for (var nPos = 0, nCount = aUnicodes.length; nPos < nCount; ++nPos)
            {
                var nUnicode = aUnicodes[nPos];

                var oText = null;
                if (0x0026 == nUnicode)
                    oText = new CMathAmp();
                else
                {
                    oText = new CMathText(false);
                    oText.add(nUnicode);
                }
                if (oText)
                    oMRun.Add_ToContent(nPos, oText, false, true);
            }
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathMRun = function(type, length, oMRun, props, oParent, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		var oNewElem = null;

		if (c_oSer_OMathContentType.MText === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathText(t,l,oMRun);
            });            
        }
		else if (c_oSer_OMathContentType.MRPr === type)
        {
			//<m:rPr>
			var mrPr = new CMPrp();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathMRPr(t,l,mrPr);
            });
			oMRun.Set_MathPr(mrPr);
        }
		else if (c_oSer_OMathContentType.ARPr === type)
		{
			var rPr = pptx_content_loader.ReadRunProperties(this.stream);
            oMRun.Set_Pr(rPr);
		}
		else if (c_oSer_OMathContentType.RPr === type)
		{
			//<w:rPr>
			var rPr = oMRun.Pr;
			res = this.brPrr.Read(length, rPr, oMRun);	
			oMRun.Set_Pr(rPr);
		}
		else if (c_oSer_OMathContentType.pagebreak === type)
        {
            oNewElem = new ParaNewLine( break_Page );
        }
        else if (c_oSer_OMathContentType.linebreak === type)
        {
            oNewElem = new ParaNewLine();
        }
        else if (c_oSer_OMathContentType.columnbreak === type)
        {
            oNewElem = new ParaNewLine( break_Column );
        } else if (c_oSer_OMathContentType.Del === type && this.oReadResult.checkReadRevisions()) {
			var reviewInfo = new CReviewInfo();
			res = this.bcr.Read1(length, function(t, l){
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {run: oMRun, props: props, oParent: oParent, parStruct: oParStruct, bmr: oThis});
			});
			oMRun.SetReviewTypeWithInfo(reviewtype_Remove, reviewInfo, false);
        } else if (c_oSer_OMathContentType.Ins === type) {
			var reviewInfo = new CReviewInfo();
			res = this.bcr.Read1(length, function(t, l){
				return ReadTrackRevision(t, l, oThis.stream, reviewInfo, {run: oMRun, props: props, oParent: oParent, parStruct: oParStruct, bmr: oThis});
			});
			if (this.oReadResult.checkReadRevisions()) {
				oMRun.SetReviewTypeWithInfo(reviewtype_Add, reviewInfo, false);
			}
        }
        else
            res = c_oSerConstants.ReadUnknown;
			
		if (null != oNewElem)
        {
			var oNewRun = new ParaRun(oParStruct.paragraph);
			oNewRun.Add_ToContent(0, oNewElem, false);
			oParStruct.addToContent(oNewRun);
        }
		
        return res;
    };
    this.ReadMathMRPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Aln === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathAln(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Brk === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathBrk(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Lit === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathLit(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Nor === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathNor(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Scr === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathScr(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.Sty === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathSty(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathNaryInit = function(props, oParent, oContent, oSub, oSup, oParStruct) {
		if (!oSub.content && !oSup.content && !oContent.content) {
			if (!props.ctrPrp) {
				props.ctrPrp = new CTextPr();
			}
			var oNary = new CNary(props);
			if (initMathRevisions(oNary, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oNary);
				}
				if (oParStruct) {
					oNary.Paragraph = oParStruct.paragraph;
				}
				oSub.content = oNary.getLowerIterator();
				oSup.content = oNary.getUpperIterator();
				oContent.content = oNary.getBase();
			}
		}
	};
	this.ReadMathNary = function(type, length, props, oParent, oContent, oSub, oSup, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.NaryPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathNaryPr(t,l,props);
            });
			this.ReadMathNaryInit(props, oParent, oContent, oSub, oSup, oParStruct);
        }
		else if (c_oSer_OMathContentType.Sub === type)
        {
			this.ReadMathNaryInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oSub.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Sup === type)
        {
			this.ReadMathNaryInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oSup.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathNaryInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.CtrlPr)
		{			
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });
			oParent.Content[oParent.Content.length-1].setCtrPrp(props.ctrPrp);
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathNaryPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.Chr === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathChr(t,l,props, c_oSer_OMathChrType.Chr);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.Grow === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathGrow(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.LimLoc === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathLimLoc(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.SubHide === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathSubHide(t,l,props);
            });		
        }
		else if (c_oSer_OMathBottomNodesType.SupHide === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathSupHide(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathNoBreak = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.noBreak = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathNor = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.nor = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathObjDist = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.objDist = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathOMathPara = function(type, length, oParStruct, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		
		if (c_oSer_OMathContentType.OMath === type)
        {
			var oMath = new ParaMath();
            oMath.Set_Align(props.mJc === JC_CENTER ? align_Center : props.mJc === JC_CENTERGROUP ? align_Justify : (props.mJc === JC_LEFT ? align_Left : (props.mJc === JC_RIGHT ? align_Right : props.mJc)));
			oParStruct.addToContent(oMath);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oMath.Root,oParStruct);
            });

            oMath.Root.Correct_Content(true);
        }
		else if (c_oSer_OMathContentType.OMathParaPr === type)
		{
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathOMathParaPr(t,l,props);
            });
		}
		else if (c_oSer_OMathContentType.Run === type)
		{
			var oNewRun = new ParaRun(oParStruct.paragraph);
            var oRes = { bRes: true };
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadRun(t, l, oNewRun, oParStruct, oRes);
            });
            //if (oRes.bRes && oNewRun.Content.length > 0)
                oParStruct.addToContent(oNewRun);
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathOMathParaPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.MJc === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathMJc(t,l,props);
            });		
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathOpEmu = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.opEmu = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathPhantInit = function(props, oParent, oContent, oParStruct) {
		if (!oContent.content) {
			var oPhant = new CPhantom(props);
			if (initMathRevisions(oPhant, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oPhant);
				}
				if (oParStruct) {
					oPhant.Paragraph = oParStruct.paragraph;
				}
				oContent.content = oPhant.getBase();
			}
		}
	};
	this.ReadMathPhant = function(type, length, props, oParent, oContent, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.PhantPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathPhantPr(t,l,props);
            });
			this.ReadMathPhantInit(props, oParent, oContent, oParStruct);
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathPhantInit(props, oParent, oContent, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathPhantPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.Show === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathShow(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.Transp === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathTransp(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.ZeroAsc === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathZeroAsc(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.ZeroDesc === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathZeroDesc(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.ZeroWid === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathZeroWid(t,l,props);
            });	           	
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathPlcHide = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.plcHide = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathPos = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var pos = this.stream.GetUChar(length);
			switch (pos)
			{
				case c_oAscTopBot.Bot:	props.pos = LOCATION_BOT; break;
				case c_oAscTopBot.Top:	props.pos = LOCATION_TOP; break;
				default: props.pos = LOCATION_BOT;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathRadInit = function(props, oParent, oRad, oContent, oDeg, oParStruct) {
		if (!oDeg.content && !oContent.content) {
			oRad.content = new CRadical(props);
			if (initMathRevisions(oRad.content, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oRad.content);
				}
				if (oParStruct) {
					oRad.Paragraph = oParStruct.paragraph;
				}
				oDeg.content = oRad.content.getDegree();
				oContent.content = oRad.content.getBase();
			}
		}
	};
	this.ReadMathRad = function(type, length, props, oParent, oRad, oContent, oDeg, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.RadPr === type)
        {			
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathRadPr(t,l,props);
            });
			this.ReadMathRadInit(props, oParent, oRad, oContent, oDeg, oParStruct);
        }
		else if (c_oSer_OMathContentType.Deg === type)
        {
			this.ReadMathRadInit(props, oParent, oRad, oContent, oDeg, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oDeg.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathRadInit(props, oParent, oRad, oContent, oDeg, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathRadPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.DegHide === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathDegHide(t,l,props);
            });	           	
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathRow = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
		props.row = 0;
		
		if(c_oSer_OMathBottomNodesValType.Val == type)
            props.row = this.stream.GetULongLE();

        return res;
    };
	this.ReadMathRSp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
		
		if(c_oSer_OMathBottomNodesValType.Val == type)
            props.rSp = this.stream.GetULongLE();

        return res;
    };
	this.ReadMathRSpRule = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
		
        if(c_oSer_OMathBottomNodesValType.Val == type)
            props.rSpRule = this.stream.GetULongLE();
			
        return res;
    };
	this.ReadMathScr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var scr = this.stream.GetUChar(length);
			switch (scr)
			{
				case c_oAscScript.DoubleStruck:	props.scr = TXT_DOUBLE_STRUCK; break;
				case c_oAscScript.Fraktur:		props.scr = TXT_FRAKTUR; break;
				case c_oAscScript.Monospace:	props.scr = TXT_MONOSPACE; break;
				case c_oAscScript.Roman:		props.scr = TXT_ROMAN; break;
				case c_oAscScript.SansSerif:	props.scr = TXT_SANS_SERIF; break;
				case c_oAscScript.Script:		props.scr = TXT_SCRIPT; break;
				default: props.scr = TXT_ROMAN;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathShow = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.show = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathShp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var shp = this.stream.GetUChar(length);
			switch (shp)
			{
				case c_oAscShp.Centered:	props.shp = DELIMITER_SHAPE_CENTERED; break;
				case c_oAscShp.Match:		props.shp = DELIMITER_SHAPE_MATCH; break;
				default: 					props.shp = DELIMITER_SHAPE_CENTERED;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSPreInit = function(props, oParent, oContent, oSub, oSup, oParStruct) {
		if (!oSub.content && !oSup.content && !oContent.content) {
			props.type = DEGREE_PreSubSup;
			var oSPre = new CDegreeSubSup(props);
			if (initMathRevisions(oSPre, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oSPre);
				}

				if (oParStruct) {
					oSPre.Paragraph = oParStruct.paragraph;
				}
				oSub.content = oSPre.getLowerIterator();
				oSup.content = oSPre.getUpperIterator();
				oContent.content = oSPre.getBase();
			}
		}
	};
	this.ReadMathSPre = function(type, length, props, oParent, oContent, oSub, oSup, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.SPrePr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathSPrePr(t,l,props);
            });
			this.ReadMathSPreInit(props, oParent, oContent, oSub, oSup, oParStruct);
        }
		else if (c_oSer_OMathContentType.Sub === type)
        {
			this.ReadMathSPreInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oSub.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Sup === type)
        {
			this.ReadMathSPreInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oSup.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathSPreInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSPrePr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSSubInit = function(props, oParent, oContent, oSub, oParStruct) {
		if (!oSub.content && !oContent.content) {
			props.type = DEGREE_SUBSCRIPT;
			var oSSub = new CDegree(props);
			if (initMathRevisions(oSSub, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oSSub);
				}
				if (oParStruct) {
					oSSub.Paragraph = oParStruct.paragraph;
				}
				oSub.content = oSSub.getLowerIterator();
				oContent.content = oSSub.getBase();
			}
		}
	};
	this.ReadMathSSub = function(type, length, props, oParent, oContent, oSub, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.SSubPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathSSubPr(t,l,props);
            });
			this.ReadMathSSubInit(props, oParent, oContent, oSub, oParStruct);
        }
		else if (c_oSer_OMathContentType.Sub === type)
        {
			this.ReadMathSSubInit(props, oParent, oContent, oSub, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oSub.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathSSubInit(props, oParent, oContent, oSub, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSSubPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSSubSupInit = function(props, oParent, oContent, oSub, oSup, oParStruct) {
		if (!oSub.content && !oSup.content && !oContent.content) {
			props.type = DEGREE_SubSup;
			var oSSubSup = new CDegreeSubSup(props);
			if (initMathRevisions(oSSubSup, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oSSubSup);
				}
				if (oParStruct) {
					oSSubSup.Paragraph = oParStruct.paragraph;
				}
				oSub.content = oSSubSup.getLowerIterator();
				oSup.content = oSSubSup.getUpperIterator();
				oContent.content = oSSubSup.getBase();
			}
		}
	};
	this.ReadMathSSubSup = function(type, length, props, oParent, oContent, oSub, oSup, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.SSubSupPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathSSubSupPr(t,l,props);
            });
			this.ReadMathSSubSupInit(props, oParent, oContent, oSub, oSup, oParStruct);
        }
		else if (c_oSer_OMathContentType.Sub === type)
        {
			this.ReadMathSSubSupInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oSub.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Sup === type)
        {
			this.ReadMathSSubSupInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oSup.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathSSubSupInit(props, oParent, oContent, oSub, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSSubSupPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.AlnScr === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathAlnScr(t,l,props);
            });	           	
        }
		else if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSSupInit = function(props, oParent, oContent, oSup, oParStruct) {
		if (!oSup.content && !oContent.content) {
			props.type = DEGREE_SUPERSCRIPT;
			var oSSup = new CDegree(props);
			if (initMathRevisions(oSSup, props, this)) {
				if (oParent) {
					oParent.addElementToContent(oSSup);
				}
				if (oParStruct) {
					oSSup.Paragraph = oParStruct.paragraph;
				}
				oSup.content = oSSup.getUpperIterator();
				oContent.content = oSSup.getBase();
			}
		}
	};
	this.ReadMathSSup = function(type, length, props, oParent, oContent, oSup, oParStruct)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathContentType.SSupPr === type)
        {
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathSSupPr(t,l,props);
            });
			this.ReadMathSSupInit(props, oParent, oContent, oSup, oParStruct);
        }
		else if (c_oSer_OMathContentType.Sup === type)
        {
			this.ReadMathSSupInit(props, oParent, oContent, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oSup.content, oParStruct);
            });			
        }
		else if (c_oSer_OMathContentType.Element === type)
        {
			this.ReadMathSSupInit(props, oParent, oContent, oSup, oParStruct);
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathArg(t,l,oContent.content, oParStruct);
            });			
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSSupPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesType.CtrlPr === type)
        {
			res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathCtrlPr(t,l,props);
            });	           	
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathStrikeBLTR = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.strikeBLTR = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathStrikeH = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.strikeH = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathStrikeTLBR = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.strikeTLBR = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathStrikeV = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.strikeV = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSty = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var sty = this.stream.GetUChar(length);
			switch (sty)
			{
				case c_oAscSty.Bold:		props.sty = STY_BOLD; break;
				case c_oAscSty.BoldItalic:	props.sty = STY_BI; break;
				case c_oAscSty.Italic:		props.sty = STY_ITALIC; break;
				case c_oAscSty.Plain:		props.sty = STY_PLAIN; break;
				default: 					props.sty = STY_ITALIC;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSubHide = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.subHide = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSupHide = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.supHide = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathTransp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.transp = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathType = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var type = this.stream.GetUChar(length);
			switch (type)
			{
				case c_oAscFType.Bar:	props.type = BAR_FRACTION; break;
				case c_oAscFType.Lin:	props.type = LINEAR_FRACTION; break;
				case c_oAscFType.NoBar:	props.type = NO_BAR_FRACTION; break;
				case c_oAscFType.Skw:	props.type = SKEWED_FRACTION; break;
				default: 				props.type = BAR_FRACTION;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathVertJc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var vertJc = this.stream.GetUChar(length);
			switch (vertJc)
			{
				case c_oAscTopBot.Bot:	props.vertJc = VJUST_BOT; break;
				case c_oAscTopBot.Top:	props.vertJc = VJUST_TOP; break;
				default: 				props.vertJc = VJUST_BOT;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathZeroAsc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.zeroAsc = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathZeroDesc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.zeroDesc = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathZeroWid = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.zeroWid = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
};
function Binary_OtherTableReader(doc, oReadResult, stream)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
    this.stream = stream;
    this.bcr = new Binary_CommonReader(this.stream);
    this.ImageMapIndex = 0;
    this.Read = function()
    {
        var oThis = this;
        return this.bcr.ReadTable(function(t, l){
                return oThis.ReadOtherContent(t,l);
            });
    };
    this.ReadOtherContent = function(type, length)
    {
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerOtherTableTypes.ImageMap === type )
        {
            var oThis = this;
            this.ImageMapIndex = 0;
            res = this.bcr.Read1(length, function(t,l){
                    return oThis.ReadImageMapContent(t,l);
                });
        }
		else if ( c_oSerOtherTableTypes.DocxTheme === type )
        {
		    this.Document.theme = pptx_content_loader.ReadTheme(this, this.stream);
		    res = c_oSerConstants.ReadUnknown;
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadImageMapContent = function(type, length, oNewImage)
    {
        var res = c_oSerConstants.ReadOk;
        if ( c_oSerOtherTableTypes.ImageMap_Src === type )
        {
            this.oReadResult.ImageMap[this.ImageMapIndex] = this.stream.GetString2LE(length); 
            this.ImageMapIndex++;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
};
function Binary_CommentsTableReader(doc, oReadResult, stream, oComments)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
    this.stream = stream;
	this.oComments = oComments;
    this.bcr = new Binary_CommonReader(this.stream);
    this.Read = function()
    {
        var oThis = this;
        return this.bcr.ReadTable(function(t, l){
                return oThis.ReadComments(t,l);
            });
    };
    this.ReadComments = function(type, length)
    {
        var res = c_oSerConstants.ReadOk;
		var oThis = this;
        if ( c_oSer_CommentsType.Comment === type )
        {
            var oNewComment = {};
            res = this.bcr.Read1(length, function(t,l){
                    return oThis.ReadCommentContent(t,l,oNewComment);
                });
			if(null != oNewComment.Id)
				this.oComments[oNewComment.Id] = oNewComment;
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadCommentContent = function(type, length, oNewImage)
    {
        var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if ( c_oSer_CommentsType.Id === type )
			oNewImage.Id = this.stream.GetULongLE();
        else if ( c_oSer_CommentsType.UserName === type )
            oNewImage.UserName = this.stream.GetString2LE(length);
		else if ( c_oSer_CommentsType.Initials === type )
			oNewImage.Initials = this.stream.GetString2LE(length);
		else if ( c_oSer_CommentsType.UserId === type )
            oNewImage.UserId = this.stream.GetString2LE(length);
		else if ( c_oSer_CommentsType.ProviderId === type )
			oNewImage.ProviderId = this.stream.GetString2LE(length);
		else if ( c_oSer_CommentsType.Date === type )
		{
			var dateStr = this.stream.GetString2LE(length);
            var dateMs = AscCommon.getTimeISO8601(dateStr);
            if (isNaN(dateMs)) {
                dateMs = new Date().getTime();
            }
			oNewImage.Date = dateMs + "";
		}
		else if ( c_oSer_CommentsType.Text === type )
			oNewImage.Text = this.stream.GetString2LE(length);
		else if ( c_oSer_CommentsType.Solved === type )
			oNewImage.Solved = (this.stream.GetUChar() != 0);
		else if ( c_oSer_CommentsType.Replies === type )
		{
			oNewImage.Replies = [];
			res = this.bcr.Read1(length, function(t,l){
                    return oThis.ReadReplies(t,l,oNewImage.Replies);
                });
		}
		else if ( c_oSer_CommentsType.OOData === type )
		{
			ParceAdditionalData(this.stream.GetString2LE(length), oNewImage);
		}
		else if ( c_oSer_CommentsType.DurableId === type )
		{
			oNewImage.DurableId = AscFonts.FT_Common.IntToUInt(this.stream.GetULong());
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadReplies = function(type, length, Replies)
    {
        var res = c_oSerConstants.ReadOk;
		var oThis = this;
        if ( c_oSer_CommentsType.Comment === type )
        {
            var oNewComment = {};
            res = this.bcr.Read1(length, function(t,l){
                    return oThis.ReadCommentContent(t,l,oNewComment);
                });
			Replies.push(oNewComment);
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
};
function Binary_SettingsTableReader(doc, oReadResult, stream)
{
    this.Document = doc;
	this.oReadResult = oReadResult;
    this.stream = stream;
	this.trackRevisions = null;
    this.bcr = new Binary_CommonReader(this.stream);
	this.bpPrr = new Binary_pPrReader(this.Document, this.oReadResult, this.stream);
	this.brPrr = new Binary_rPrReader(this.Document, this.oReadResult, this.stream);
    this.Read = function()
    {
        var oThis = this;
        return this.bcr.ReadTable(function(t, l){
                return oThis.ReadSettingsContent(t,l);
            });
    };
    this.ReadSettingsContent = function(type, length)
    {
        var res = c_oSerConstants.ReadOk;
		var oThis = this;
        if ( c_oSer_SettingsType.ClrSchemeMapping === type )
        {
            res = this.bcr.Read2(length, function(t,l){
                    return oThis.ReadColorSchemeMapping(t,l);
                });
        }
		else if ( c_oSer_SettingsType.DefaultTabStop === type )
        {
			var dNewTab_Stop = this.bcr.ReadDouble();
			//word поддерживает 0, но наш редактор к такому не готов.
			if(dNewTab_Stop > 0)
				AscCommonWord.Default_Tab_Stop = dNewTab_Stop;
        }
		else if ( c_oSer_SettingsType.DefaultTabStopTwips === type )
		{
			var dNewTab_Stop = g_dKoef_twips_to_mm * this.stream.GetULongLE();
			//word поддерживает 0, но наш редактор к такому не готов.
			if(dNewTab_Stop > 0)
				AscCommonWord.Default_Tab_Stop = dNewTab_Stop;
		}
		else if ( c_oSer_SettingsType.MathPr === type )
        {			
			var props = new CMathPropertiesSettings();
            res = this.bcr.Read1(length, function(t, l){
                return oThis.ReadMathPr(t,l,props);
            });
			editor.WordControl.m_oLogicDocument.Settings.MathSettings.SetPr(props);
        }
		else if ( c_oSer_SettingsType.TrackRevisions === type && !this.oReadResult.disableRevisions)
		{
			this.oReadResult.trackRevisions = this.stream.GetBool();
		}
		else if ( c_oSer_SettingsType.FootnotePr === type )
		{
			var props = {Format: null, restart: null, start: null, pos: null};
			res = this.bcr.Read1(length, function(t, l) {
				return oThis.bpPrr.ReadFootnotePr(t, l, props);
			});
			if (this.oReadResult.logicDocument) {
				var footnotes = this.oReadResult.logicDocument.Footnotes;
				if (null != props.Format) {
					footnotes.SetFootnotePrNumFormat(props.Format);
				}
				if (null != props.restart) {
					footnotes.SetFootnotePrNumRestart(props.restart);
				}
				if (null != props.start) {
					footnotes.SetFootnotePrNumStart(props.start);
				}
				if (null != props.pos) {
					footnotes.SetFootnotePrPos(props.pos);
				}
			}
		}
		else if ( c_oSer_SettingsType.SdtGlobalColor === type )
		{
			var textPr = new CTextPr();
			res = this.brPrr.Read(length, textPr, null);
			if (textPr.Color && !textPr.Color.Auto) {
				this.Document.SetSdtGlobalColor(textPr.Color.r, textPr.Color.g, textPr.Color.b);
			}
		}
		else if ( c_oSer_SettingsType.SdtGlobalShowHighlight === type )
		{
			this.Document.SetSdtGlobalShowHighlight(this.stream.GetBool());
		}
		else if ( c_oSer_SettingsType.Compat === type )
		{
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadCompat(t,l);
			});
		}
		else if ( c_oSer_SettingsType.DecimalSymbol === type )
		{
			editor.WordControl.m_oLogicDocument.Settings.DecimalSymbol = this.stream.GetString2LE(length);
		}
		else if ( c_oSer_SettingsType.ListSeparator === type )
		{
			editor.WordControl.m_oLogicDocument.Settings.ListSeparator = this.stream.GetString2LE(length);
		}
		else if ( c_oSer_SettingsType.GutterAtTop === type )
		{
			editor.WordControl.m_oLogicDocument.SetGutterAtTop(this.stream.GetBool());
		}
		else if ( c_oSer_SettingsType.MirrorMargins === type )
		{
			editor.WordControl.m_oLogicDocument.SetMirrorMargins(this.stream.GetBool());
		}
		// else if ( c_oSer_SettingsType.PrintTwoOnOne === type )
		// {
		// 	editor.WordControl.m_oLogicDocument.Settings.PrintTwoOnOne = this.stream.GetBool();
		// }
		// else if ( c_oSer_SettingsType.BookFoldPrinting === type )
		// {
		// 	editor.WordControl.m_oLogicDocument.Settings.BookFoldPrinting = this.stream.GetBool();
		// }
		// else if ( c_oSer_SettingsType.BookFoldPrintingSheets === type )
		// {
		// 	editor.WordControl.m_oLogicDocument.Settings.BookFoldPrintingSheets = this.stream.GetLong();
		// }
		// else if ( c_oSer_SettingsType.BookFoldRevPrinting === type )
		// {
		// 	editor.WordControl.m_oLogicDocument.Settings.BookFoldRevPrinting = this.stream.GetBool();
		// }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathPr = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_MathPrType.BrkBin === type)
        {
            res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathBrkBin(t,l,props);
            });			
        }
		else if (c_oSer_MathPrType.BrkBinSub === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathBrkBinSub(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.DefJc === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathDefJc(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.DispDef === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathDispDef(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.InterSp === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathInterSp(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.IntLim === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathIntLim(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.IntraSp === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathIntraSp(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.LMargin === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathLMargin(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.MathFont === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathMathFont(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.NaryLim === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathNaryLim(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.PostSp === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathPostSp(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.PreSp === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathPreSp(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.RMargin === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathRMargin(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.SmallFrac === type)
        {
			props.smallFrac = true;
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathSmallFrac(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.WrapIndent === type)
        {
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathWrapIndent(t,l,props);
            });	           	
        }
		else if (c_oSer_MathPrType.WrapRight === type)
        {
			props.wrapRight = true;
			res = this.bcr.Read2(length, function(t, l){
                return oThis.ReadMathWrapRight(t,l,props);
            });	           	
        }
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };	
	this.ReadMathBrkBin = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var brkBin = this.stream.GetUChar(length);
			switch (brkBin)
			{
				case c_oAscBrkBin.After:	props.brkBin = BREAK_AFTER; break;
				case c_oAscBrkBin.Before:	props.brkBin = BREAK_BEFORE; break;
				case c_oAscBrkBin.Repeat:	props.brkBin = BREAK_REPEAT; break;
				default: 					props.brkBin = BREAK_REPEAT;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathBrkBinSub = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var brkBinSub = this.stream.GetUChar(length);
			switch (brkBinSub)
			{
				case c_oAscBrkBinSub.PlusMinus:		props.brkBinSub = BREAK_PLUS_MIN; break;
				case c_oAscBrkBinSub.MinusPlus:		props.brkBinSub = BREAK_MIN_PLUS; break;
				case c_oAscBrkBinSub.MinusMinus:	props.brkBinSub = BREAK_MIN_MIN; break;
				default: 							props.brkBinSub = BREAK_MIN_MIN;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathDefJc = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var defJc = this.stream.GetUChar(length);
			switch (defJc)
			{
				case c_oAscMathJc.Center:		props.defJc = align_Center; break;
				case c_oAscMathJc.CenterGroup:	props.defJc = align_Justify; break;
				case c_oAscMathJc.Left:			props.defJc = align_Left; break;
				case c_oAscMathJc.Right: 		props.defJc = align_Right; break;
				default: 						props.defJc = align_Justify;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathDispDef = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.dispDef = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }; 
	this.ReadMathInterSp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.interSp = this.bcr.ReadDouble();
        }
        else if (c_oSer_OMathBottomNodesValType.ValTwips === type)
		{
			props.interSp = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathMathFont = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.mathFont = {Name : this.stream.GetString2LE(length), Index : -1};
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    }; 
	this.ReadMathIntLim = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var intLim = this.stream.GetUChar(length);
			switch (intLim)
			{
				case c_oAscLimLoc.SubSup:	props.intLim = NARY_SubSup; break;
				case c_oAscLimLoc.UndOvr:	props.intLim = NARY_UndOvr; break;
				default: 					props.intLim = NARY_SubSup;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathIntraSp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.intraSp = this.bcr.ReadDouble();
        }
		else if (c_oSer_OMathBottomNodesValType.ValTwips === type)
		{
			props.intraSp = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathLMargin = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.lMargin = this.bcr.ReadDouble();
        }
		else if (c_oSer_OMathBottomNodesValType.ValTwips === type)
		{
			props.lMargin = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathNaryLim = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			var naryLim = this.stream.GetUChar(length);
			switch (naryLim)
			{
				case c_oAscLimLoc.SubSup:	props.naryLim = NARY_SubSup; break;
				case c_oAscLimLoc.UndOvr:	props.naryLim = NARY_UndOvr; break;
				default: 					props.naryLim = NARY_SubSup;
			}
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathPostSp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.postSp = this.bcr.ReadDouble();
        }
		else if (c_oSer_OMathBottomNodesValType.ValTwips === type)
		{
			props.postSp = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathPreSp = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.preSp = this.bcr.ReadDouble();
        }
		else if (c_oSer_OMathBottomNodesValType.ValTwips === type)
		{
			props.preSp = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathRMargin = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.rMargin = this.bcr.ReadDouble();
        }
		else if (c_oSer_OMathBottomNodesValType.ValTwips === type)
		{
			props.rMargin = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathSmallFrac = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.smallFrac = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathWrapIndent = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.wrapIndent = this.bcr.ReadDouble();
        }
		else if (c_oSer_OMathBottomNodesValType.ValTwips === type)
		{
			props.wrapIndent = g_dKoef_twips_to_mm * this.stream.GetULongLE();
		}
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ReadMathWrapRight = function(type, length, props)
    {
        var res = c_oSerConstants.ReadOk;
        var oThis = this;
		if (c_oSer_OMathBottomNodesValType.Val === type)
        {
			props.wrapRight = this.stream.GetBool();
        }
		else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
    this.ReadColorSchemeMapping = function(type, length)
    {
        var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if ( c_oSer_ClrSchemeMappingType.Accent1 <= type && type <= c_oSer_ClrSchemeMappingType.T2 )
		{
			var val = this.stream.GetUChar();
			this.ApplyColorSchemeMappingItem(type, val);
		}
        else
            res = c_oSerConstants.ReadUnknown;
        return res;
    };
	this.ApplyColorSchemeMappingItem = function(type, val)
    {
		var nScriptType = 0;
		var nScriptVal = 0;
		switch(type)
		{
			case c_oSer_ClrSchemeMappingType.Accent1: nScriptType = 0; break;
			case c_oSer_ClrSchemeMappingType.Accent2: nScriptType = 1; break;
			case c_oSer_ClrSchemeMappingType.Accent3: nScriptType = 2; break;
			case c_oSer_ClrSchemeMappingType.Accent4: nScriptType = 3; break;
			case c_oSer_ClrSchemeMappingType.Accent5: nScriptType = 4; break;
			case c_oSer_ClrSchemeMappingType.Accent6: nScriptType = 5; break;
			case c_oSer_ClrSchemeMappingType.Bg1: nScriptType = 6; break;
			case c_oSer_ClrSchemeMappingType.Bg2: nScriptType = 7; break;
			case c_oSer_ClrSchemeMappingType.FollowedHyperlink: nScriptType = 10; break;
			case c_oSer_ClrSchemeMappingType.Hyperlink: nScriptType = 11; break;
			case c_oSer_ClrSchemeMappingType.T1: nScriptType = 15; break;
			case c_oSer_ClrSchemeMappingType.T2: nScriptType = 16; break;
		}
		switch(val)
		{
			case EWmlColorSchemeIndex.wmlcolorschemeindexAccent1: nScriptVal = 0; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexAccent2: nScriptVal = 1; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexAccent3: nScriptVal = 2; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexAccent4: nScriptVal = 3; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexAccent5: nScriptVal = 4; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexAccent6: nScriptVal = 5; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexDark1: nScriptVal = 8; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexDark2: nScriptVal = 9; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexFollowedHyperlink: nScriptVal = 10; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexHyperlink: nScriptVal = 11; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexLight1: nScriptVal = 12; break;
			case EWmlColorSchemeIndex.wmlcolorschemeindexLight2: nScriptVal = 13; break;
		}
		
		this.Document.clrSchemeMap.color_map[nScriptType] = nScriptVal;
	};
	this.ReadCompat = function(type, length)
	{
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerCompat.CompatSetting === type)
		{
			var compat = {name: null, url: null, value: null};
			res = this.bcr.Read1(length, function(t, l){
				return oThis.ReadCompatSetting(t,l,compat);
			});
			if ("compatibilityMode" === compat.name && "http://schemas.microsoft.com/office/word" === compat.url) {
				this.oReadResult.compatibilityMode = parseInt(compat.value);
			}
		} else if (c_oSerCompat.Flags1 === type) {
			var flags1 = this.stream.GetULong(length);
			this.oReadResult.DoNotExpandShiftReturn = 0 != ((flags1 >> 10) & 1);
		} else if (c_oSerCompat.Flags2 === type) {
			var flags2 = this.stream.GetULong(length);
			this.oReadResult.SplitPageBreakAndParaMark = 0 != ((flags2 >> 27) & 1);
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	};
	this.ReadCompatSetting = function(type, length, compat)
	{
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerCompat.CompatName === type) {
			compat.name = this.stream.GetString2LE(length);
		} else if (c_oSerCompat.CompatUri === type) {
			compat.url = this.stream.GetString2LE(length);
		} else if (c_oSerCompat.CompatValue === type) {
			compat.value = this.stream.GetString2LE(length);
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	};
};
function Binary_NotesTableReader(doc, oReadResult, openParams, stream)
{
	this.Document = doc;
	this.oReadResult = oReadResult;
	this.openParams = openParams;
	this.stream = stream;
	this.trackRevisions = null;
	this.bcr = new Binary_CommonReader(this.stream);
	this.Read = function()
	{
		var oThis = this;
		return this.bcr.ReadTable(function(t, l){
				return oThis.ReadNotes(t,l);
			});
	};
	this.ReadNotes = function(type, length)
	{
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerNotes.Note === type) {
			var note = {id: null,type:null, content: null};
			res = this.bcr.Read1(length, function(t,l){
					return oThis.ReadNote(t, l, note);
				});
			if (null !== note.id && null !== note.content) {
				this.oReadResult.footnotes[note.id] = note;
			}
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	};
	this.ReadNote = function(type, length, note)
	{
		var res = c_oSerConstants.ReadOk;
		var oThis = this;
		if (c_oSerNotes.NoteType === type) {
			note.type = this.stream.GetUChar();
		} else if (c_oSerNotes.NoteId === type) {
			note.id = this.stream.GetULongLE();
		} else if (c_oSerNotes.NoteContent === type) {
			var footnote = new CFootEndnote(this.oReadResult.logicDocument.Footnotes);
			var footnoteContent = [];
			var bdtr = new Binary_DocumentTableReader(footnote, this.oReadResult, this.openParams, this.stream, footnote, this.oReadResult.oCommentsPlaces);
			bdtr.Read(length, footnoteContent);
			if(footnoteContent.length > 0)
			{
				for(var i = 0; i < footnoteContent.length; ++i)
				{
					if(i == length - 1)
						footnote.Internal_Content_Add(i + 1, footnoteContent[i], true);
					else
						footnote.Internal_Content_Add(i + 1, footnoteContent[i], false);
				}
				footnote.Internal_Content_Remove(0, 1);
			}
			//если 0 == footnoteContent.length в ячейке остается параграф который был там при создании.
			note.content = footnote;
		} else
			res = c_oSerConstants.ReadUnknown;
		return res;
	};
};
function GetTableOffsetCorrection(tbl)
{
    var X = 0;

    var Row = tbl.Content[0];
    var Cell = Row.Get_Cell( 0 );
    var Margins = Cell.GetMargins();

    var CellSpacing = Row.Get_CellSpacing();
    if ( null != CellSpacing )
    {
        var TableBorder_Left = tbl.Get_Borders().Left;
        if ( border_None != TableBorder_Left.Value )
            X += TableBorder_Left.Size / 2;

        X += CellSpacing;

        var CellBorder_Left = Cell.Get_Borders().Left;
        if ( border_None != CellBorder_Left.Value )
            X += CellBorder_Left.Size;

        X += Margins.Left.W;
    }
    else
    {
        var TableBorder_Left = tbl.Get_Borders().Left;
        var CellBorder_Left  = Cell.Get_Borders().Left;
        var Result_Border = tbl.Internal_CompareBorders( TableBorder_Left, CellBorder_Left, true, false );

        if ( border_None != Result_Border.Value )
            X += Math.max( Result_Border.Size / 2, Margins.Left.W );
        else
            X += Margins.Left.W;
    }

    return -X;
};

function CFontCharMap()
{
    this.Name       = "";
    this.Id         = "";
    this.FaceIndex  = -1;
    this.IsEmbedded = false;
    this.CharArray  = {};
}

function CFontsCharMap()
{
    this.CurrentFontName = "";
    this.CurrentFontInfo = null;

    this.map_fonts = {};
}

CFontsCharMap.prototype =
{
    StartWork : function()
    {
    },

    EndWork : function()
    {
        var mem = new AscCommon.CMemory();
        mem.Init();

        for (var i in this.map_fonts)
        {
            var _font = this.map_fonts[i];

            mem.WriteByte(0xF0);

            mem.WriteByte(0xFA);

            mem.WriteByte(0); mem.WriteString2(_font.Name);
            mem.WriteByte(1); mem.WriteString2(_font.Id);
            mem.WriteByte(2); mem.WriteString2(_font.FaceIndex);
            mem.WriteByte(3); mem.WriteBool(_font.IsEmbedded);

            mem.WriteByte(0xFB);

            mem.WriteByte(0);

            var _pos = mem.pos;
            var _len = 0;
            for (var c in _font.CharArray)
            {
                mem.WriteLong(parseInt(c));
                _len++;
            }

            var _new_pos = mem.pos;

            mem.pos = _pos;
            mem.WriteLong(_len);
            mem.pos = _new_pos;

            mem.WriteByte(0xF1);
        }

        return mem.GetBase64Memory();
    },

    StartFont : function(family, bold, italic, size)
    {
        var font_info = g_fontApplication.GetFontInfo(family);

        var bItalic = (true === italic);
        var bBold   = (true === bold);

        var oFontStyle = FontStyle.FontStyleRegular;
        if ( !bItalic && bBold )
            oFontStyle = FontStyle.FontStyleBold;
        else if ( bItalic && !bBold )
            oFontStyle = FontStyle.FontStyleItalic;
        else if ( bItalic && bBold )
            oFontStyle = FontStyle.FontStyleBoldItalic;

        var _id = font_info.GetFontID(AscCommon.g_font_loader, oFontStyle);

        var _find_index = _id.id + "_teamlab_" + _id.faceIndex;
        if (this.CurrentFontName != _find_index)
        {
            var _find = this.map_fonts[_find_index];
            if (_find !== undefined)
            {
                this.CurrentFontInfo = _find;
            }
            else
            {
                _find = new CFontCharMap();
                _find.Name = family;
                _find.Id = _id.id;
                _find.FaceIndex = _id.faceIndex;
                _find.IsEmbedded = (font_info.type == AscFonts.FONT_TYPE_EMBEDDED);

                this.CurrentFontInfo = _find;
                this.map_fonts[_find_index] = _find;
            }
            this.CurrentFontName = _find_index;
        }
    },

    AddChar : function(char1)
    {
        var _find = "" + char1.charCodeAt(0);
        var map_ind = this.CurrentFontInfo.CharArray[_find];
        if (map_ind === undefined)
            this.CurrentFontInfo.CharArray[_find] = true;
    },
    AddChar2 : function(char2)
    {
        var _find = "" + char2.charCodeAt(0);
        var map_ind = this.CurrentFontInfo.CharArray[_find];
        if (map_ind === undefined)
            this.CurrentFontInfo.CharArray[_find] = true;
    }
}
function getStyleFirstRun(oField){
    var res = null;
    //берем первый с непустым Content, потому что в случае fldstart первым будет run fldstart
    for (var i = 0 ; i < oField.Content.length; ++i) {
        var run = oField.Content[i];
        if (run.Content.length > 0) {
            res = run.Get_FirstTextPr();
            break;
        }
    }
    return res;
}
function OpenParStruct(oContainer, paragraph) {
    this.paragraph = paragraph;
    this.cur = oContainer;
    this.stack = [this.cur];
	this.curRun = null;
}
OpenParStruct.prototype = {
    _GetFromContent: function (elem, nIndex) {
        return elem.Content[nIndex];
    },
    _GetContentLength: function (elem) {
        return elem.Content.length;
    },
	_removeFromContent: function (elem, pos, count) {
        if (elem.Remove_FromContent)
            elem.Remove_FromContent(pos, count);
    },
	addElemToContentStart: function () {
		this.curRun = new ParaRun(this.paragraph);
	},
	addElemToContent: function (elem) {
		this.curRun.Add_ToContent(this.curRun.GetElementsCount(), elem, false);
	},
	addElemToContentFinish: function () {
		var res = this.curRun;
		this.addToContent(this.curRun);
		return res;
	},
    addToContent: function (oItem) {
		if (this.cur && this.cur.Add_ToContent) {
			this.cur.Add_ToContent(this.getCurPos(), oItem, false);
		}
    },
    GetFromContent: function (nIndex) {
		if(null != this.cur)
			return this._GetFromContent(this.cur, nIndex);
		return null;
    },
    GetContentLength: function () {
		if(null != this.cur)
			return this._GetContentLength(this.cur);
		return null;
    },
    addElem: function (oElem) {
		if(null != this.cur){
			this.cur = oElem;
			this.stack.push(this.cur);
		}
    },
	getElem: function () {
        return this.cur;
    },
    commitElem: function () {
        var bRes = false;
        if (this.stack.length > 1) {
            var oPrevElem = this.stack.pop();
            this.cur = this.stack[this.stack.length - 1];
            var elem = oPrevElem;
            if (null != elem && elem.Content) {
                if (para_Field == elem.Get_Type() && (fieldtype_PAGENUM == elem.Get_FieldType() || fieldtype_PAGECOUNT == elem.Get_FieldType())) {
                    var oNewRun = new ParaRun(this.paragraph);
                    var rPr = getStyleFirstRun(elem);
                    if (rPr) {
                        oNewRun.Set_Pr(rPr);
                    }
					if (fieldtype_PAGENUM == elem.Get_FieldType()) {
						oNewRun.Add_ToContent(0, new ParaPageNum());
					} else {
						var pageCount = parseInt(elem.GetSelectedText(true));
						oNewRun.Add_ToContent(0, new ParaPageCount(isNaN(pageCount) ? undefined : pageCount));
					}
                    this.addToContent(oNewRun);
                } else if(elem.Content.length > 0) {
                    this.addToContent(elem);
                }
            }
            bRes = true;
        }
        return bRes;
    },
    commitAll: function () {
        while (this.commitElem())
            ;
    },
    getCurPos: function(){
		if (this.cur && type_Paragraph === this.cur.GetType()) {
			return this.GetContentLength() - 1;
		} else {
			return this.GetContentLength();
		}
    }
};
function DocSaveParams(bMailMergeDocx, bMailMergeHtml, isCompatible) {
	this.bMailMergeDocx = bMailMergeDocx;
	this.bMailMergeHtml = bMailMergeHtml;
	this.trackRevisionId = 0;
	this.footnotes = {};
	this.footnotesIndex = 0;
	this.docPrId = 1;
	this.moveRangeFromNameToId = {};
	this.moveRangeToNameToId = {};
	this.isCompatible = isCompatible;
};
function DocReadResult(doc) {
	this.logicDocument = doc;
	this.ImageMap = {};
	this.oComments = {};
	this.oCommentsPlaces = {};
	this.setting = {titlePg: false, EvenAndOddHeaders: false};
	this.numToNumClass = {};
	this.numToANumClass = {};
	this.paraNumPrs = [];
	this.styles = [];
	this.runStyles = [];
	this.paraStyles = [];
	this.tableStyles = [];
	this.lvlStyles = [];
	this.styleLinks = [];
	this.numStyleLinks = [];
	this.DefpPr = null;
	this.DefrPr = null;
	this.DocumentContent = [];
	this.bLastRun = null;
	this.aPostOpenStyleNumCallbacks = [];
	this.headers = [];
	this.footers = [];
	this.trackRevisions = null;
	this.hasRevisions = false;
	this.disableRevisions = false;
	this.drawingToMath = [];
	this.aTableCorrect = [];
	this.footnotes = {};
	this.footnoteRefs = [],
	this.bookmarkForRead = typeof CParagraphBookmark !== "undefined" ? new CParagraphBookmark() : {};
	this.bookmarksStarted = {};
	this.moveRanges = {};
	this.Application;
	this.AppVersion;
	this.compatibilityMode = null;
	this.SplitPageBreakAndParaMark = false;
	this.DoNotExpandShiftReturn = false;
	this.bdtr = null;
	this.runsToSplit = [];
	this.bCopyPaste = false;
};
DocReadResult.prototype = {
	isDocumentPasting: function(){
		var api = window["Asc"]["editor"] || editor;
		if(api) {
			return this.bCopyPaste && AscCommon.c_oEditorId.Word === api.getEditorId();
		}
		return false;
	},
	checkReadRevisions: function() {
		this.hasRevisions = true;
		return !this.disableRevisions;
	}
};
//---------------------------------------------------------export---------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window["AscCommonWord"].BinaryFileReader = BinaryFileReader;
window["AscCommonWord"].BinaryFileWriter = BinaryFileWriter;
window["AscCommonWord"].EThemeColor = EThemeColor;
window["AscCommonWord"].DocReadResult = DocReadResult;
window["AscCommonWord"].DocSaveParams = DocSaveParams;
window["AscCommonWord"].CreateThemeUnifill = CreateThemeUnifill;
