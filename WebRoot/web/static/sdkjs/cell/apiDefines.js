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

(
/**
* @param {Window} window
* @param {undefined} undefined
*/
function (window, undefined) {
// Используем [] вместо new Array() для ускорения (http://jsperf.com/creation-array)
// Используем {} вместо new Object() для ускорения (http://jsperf.com/creation-object)

  // Import
  var CColor = AscCommon.CColor;

var c_oAscConfirm = {
  ConfirmReplaceRange: 0,
  ConfirmPutMergeRange: 1
};

var c_oAscMergeOptions = {
  Disabled: -1,
  None: 0,
  Merge: 1,
  MergeCenter: 2,
  MergeAcross: 3
};

var c_oAscSortOptions = {
  Ascending: 1,
  Descending: 2,
  ByColorFill: 3,
  ByColorFont: 4,
  ByIcon: 5,
  ByValue: 6
};

var c_oAscBorderOptions = {
  Top: 0,
  Right: 1,
  Bottom: 2,
  Left: 3,
  DiagD: 4,
  DiagU: 5,
  InnerV: 6,
  InnerH: 7
};

var c_oAscCleanOptions = {
  All: 0,
  Text: 1,
  Format: 2,
  Formula: 4,
  Comments: 5,
  Hyperlinks: 6,
  Sparklines: 7,
  SparklineGroups: 8
};

// ToDo Add including cells not marked as needing to be calculated
var c_oAscCalculateType = {
  WorkbookOnlyChanged: 1,
  ActiveSheet: 2,
  Workbook: 3,
  All: 4
};

var c_oAscDrawDepOptions = {
  Master: 0,
  Slave: 1,
  Clear: 2
};

var c_oAscSelectionDialogType = {
  None: 0,
  FormatTable: 1,
  Chart: 2,
  FormatTableChangeRange: 4,
  CustomSort: 5
};

var c_oAscScrollType = {
  ScrollVertical: 1,
  ScrollHorizontal: 2
};

var c_oAscHyperlinkType = {
  WebLink: 1,
  RangeLink: 2
};

var c_oAscMouseMoveType = {
  None: 0,
  Hyperlink: 1,
  Comment: 2,
  LockedObject: 3,
  ResizeColumn: 4,
  ResizeRow: 5,
  Filter: 6
};

var c_oAscMouseMoveLockedObjectType = {
  None: -1,
  Range: 0,
  TableProperties: 1,
  Sheet: 2
};

var c_oAscLockTypeElem = {
  Range: 1,
  Object: 2,
  Sheet: 3
};

var c_oAscLockTypeElemSubType = {
  DeleteColumns: 1,
  InsertColumns: 2,
  DeleteRows: 3,
  InsertRows: 4,
  ChangeProperties: 5,
  DefinedNames: 6
};

var c_oAscRecalcIndexTypes = {
  RecalcIndexAdd: 1,
  RecalcIndexRemove: 2
};

/** @enum */
var c_oAscCustomAutoFilter = {
  equals: 1,
  isGreaterThan: 2,
  isGreaterThanOrEqualTo: 3,
  isLessThan: 4,
  isLessThanOrEqualTo: 5,
  doesNotEqual: 6,
  beginsWith: 7,
  doesNotBeginWith: 8,
  endsWith: 9,
  doesNotEndWith: 10,
  contains: 11,
  doesNotContain: 12
};

    /** @enum */
var c_oAscDynamicAutoFilter = {
    aboveAverage: 1,
    belowAverage: 2,
    lastMonth: 3,
    lastQuarter: 4,
    lastWeek: 5,
    lastYear: 6,
    m1: 7,
    m10: 8,
    m11: 9,
    m12: 10,
    m2: 11,
    m3: 12,
    m4: 13,
    m5: 14,
    m6: 15,
    m7: 16,
    m8: 17,
    m9: 18,
    nextMonth: 19,
    nextQuarter: 20,
    nextWeek: 21,
    nextYear: 22,
    q1: 23,
    q2: 24,
    q3: 25,
    q4: 26,
    thisMonth: 27,
    thisQuarter: 28,
    thisWeek: 29,
    thisYear: 30,
    today: 31,
    tomorrow: 32,
    yearToDate: 33,
    yesterday: 34
};

var c_oAscTop10AutoFilter = {
    max: 1,
    min: 2
};

var c_oAscChangeFilterOptions = {
  filter: 1,
  style: 2
};

var c_oAscChangeSelectionFormatTable = {
	all: 1,
	data: 2,
	row: 3,
	column: 4
};

var c_oAscChangeTableStyleInfo = {
	columnFirst: 1,
	columnLast: 2,
	columnBanded: 3,
	rowHeader: 4,
	rowTotal: 5,
	rowBanded: 6,
	filterButton: 7,
	advancedSettings: 8
};

// Состояние редактора ячейки
var c_oAscCellEditorState = {
  editEnd: 0,				// Окончание редактирования
  editStart: 1,				// Начало редактирования
  editEmptyCell: 2,			// Редактирование пустой ячейки (доступны функции и свойства текста)
  editText: 3,				// Редактирование текста, числа, даты и др. формата, кроме формулы
  editFormula: 4,			// Редактирование формулы
  editInFormulaBar: 5,		// Редактирование в строке формул
  editInCell: 6				// Редактирование в ячейке
};

// Состояние select-а
var c_oAscCellEditorSelectState = {
  no    : 0,
  char  : 1,
  word  : 2
};

// Пересчитывать ли ширину столбца
var c_oAscCanChangeColWidth = {
  none: 0,	// not recalc
  numbers: 1,	// only numbers
  all: 2	// numbers + text
};

// Merge cell type
var c_oAscMergeType = {
  none: 0,
  cols: 1, // Замержены ли колонки (если да, то автоподбор ширины не должен работать)
  rows: 2  // Замержены ли строки (если да, то автоподбор высоты не должен работать)
};

var c_oAscPaneState = {
  Frozen: "frozen",
  FrozenSplit: "frozenSplit",
  Split: "split"
};

var c_oAscFindLookIn = {
  Formulas: 1,
  Value: 2,
  Annotations: 3
};

var c_oTargetType = {
  None: 0,
  ColumnResize: 1,
  RowResize: 2,
  FillHandle: 3,
  MoveRange: 4,
  MoveResizeRange: 5,
  FilterObject: 6,
  ColumnHeader: 7,
  RowHeader: 8,
  Corner: 9,
  Hyperlink: 10,
  Cells: 11,
  Shape: 12,
  FrozenAnchorH: 14,
  FrozenAnchorV: 15,
  GroupRow: 16,
  GroupCol: 17
};

var c_oAscAutoFilterTypes = {
  ColorFilter: 0,
  CustomFilters: 1,
  DynamicFilter: 2,
  Top10: 3,
  Filters: 4,
  None: 5
};

var c_oAscCoAuthoringMeBorderColor = new CColor(22, 156, 0);
var c_oAscCoAuthoringOtherBorderColor = new CColor(238, 53, 37);
var c_oAscCoAuthoringLockTablePropertiesBorderColor = new CColor(255, 144, 0);
var c_oAscCoAuthoringDottedWidth = 4;
var c_oAscCoAuthoringDottedDistance = 2;

var c_oAscFormulaRangeBorderColor = [
  new CColor(95, 140, 237),
  new CColor(235, 94, 96),
  new CColor(141, 97, 194),
  new CColor(45, 150, 57),
  new CColor(191, 76, 145),
  new CColor(227, 130, 34),
  new CColor(55, 127, 158)
];

  var selectionLineType = {
    None        : 0,
    Selection   : 1,
    ActiveCell  : 2,
    Resize      : 4,
    Promote     : 8,
    Dash        : 16,
    DashThick   : 32
  };

  var c_oAscLockNameFrozenPane = "frozenPane";
  var c_oAscLockNameTabColor = "tabColor";
  var c_oAscLockAddSheet = "addSheet";
  var c_oAscLockLayoutOptions = "layoutOptions";
  var c_oAscHeaderFooterEdit = "headerFooterEdit";
  var c_oAscLockPrintScaleOptions = "printScaleOptions";

var c_oAscGetDefinedNamesList = {
  Worksheet: 0,
  WorksheetWorkbook: 1,
  All: 2
};

var c_oAscDefinedNameReason = {
  WrongName: -1,
  IsLocked: -2,
  Existed: -3,
  LockDefNameManager: -4,
  NameReserved: -5,
  OK: 0
};

var c_oAscPopUpSelectorType = {
  None: 0,
  Func: 1,
  Range: 2,
  Table: 3
};
  /** @enum */
  var c_oSerFormat = {
    Version		: 2, //1.0.0.2
    Signature	: "XLSY"
  };

  var c_oAscSparklineType = {
    Line: 0,
    Column: 1,
    Stacked: 2
  };
  var c_oAscEDispBlanksAs = {
    Span: 0,
    Gap: 1,
    Zero: 2
  };
  var c_oAscSparklineAxisMinMax = {
    Individual: 0,
    Group: 1,
    Custom: 2
  };
  var c_oAscAutoCorrectOptions = {
	UndoTableAutoExpansion: 0,
	RedoTableAutoExpansion: 1
  };

  //изменяем Print_Area
  var c_oAscChangePrintAreaType = {
      set: 0,
      clear: 1,
      add: 2
  };

  //поля header/footer
  var c_oAscHeaderFooterField = {
      pageNumber: 0,
      pageCount: 1,
      sheetName: 2,
      fileName: 3,
      filePath: 4,
      date: 5,
      time: 6,
      lineBreak: 7
  };

  var c_oAscPageHFType = {
      firstHeader: 0,
      oddHeader: 1,
      evenHeader: 2,
      firstFooter: 3,
      oddFooter: 4,
      evenFooter: 5
  };

  var c_oAscHeaderFooterType = {
      first: 0,
      odd: 1,
      even: 2
  };

  var c_oAscHeaderFooterPresets = {
      none: 0,
      page: 1,
      pageOfQuestion: 2,
      sheet: 3,
      confidential: 4,
      bookName: 5,
      //bookPath: 5
      sheetPage: 6,
      sheetConfidentialPage: 7,
      bookNamePage: 8,
      pageSheet: 9,
      pageBook: 10,
      //bookPathPage: 11;
      pageBookName: 11,
      userPageDate: 12,
      //bookPathPagePathFile: 12;
      preparedUserDatePage: 13,
      custom: 14
  };


  var c_kMaxPrintPages = 1500;

  //----------------------------------------------------------export----------------------------------------------------
  window['AscCommonExcel'] = window['AscCommonExcel'] || {};
  window['AscCommonExcel'].c_oAscDrawDepOptions = c_oAscDrawDepOptions;
  window['AscCommonExcel'].c_oAscScrollType = c_oAscScrollType;
  window['AscCommonExcel'].c_oAscLockTypeElem = c_oAscLockTypeElem;
  window['AscCommonExcel'].c_oAscLockTypeElemSubType = c_oAscLockTypeElemSubType;
  window['AscCommonExcel'].c_oAscRecalcIndexTypes = c_oAscRecalcIndexTypes;
  window['AscCommonExcel'].c_oAscCellEditorSelectState = c_oAscCellEditorSelectState;
  window['AscCommonExcel'].c_oAscCanChangeColWidth = c_oAscCanChangeColWidth;
  window['AscCommonExcel'].c_oAscMergeType = c_oAscMergeType;
  window['AscCommonExcel'].c_oAscPaneState = c_oAscPaneState;
  window['AscCommonExcel'].c_oTargetType = c_oTargetType;
  window['AscCommonExcel'].c_oAscCoAuthoringMeBorderColor = c_oAscCoAuthoringMeBorderColor;
  window['AscCommonExcel'].c_oAscCoAuthoringOtherBorderColor = c_oAscCoAuthoringOtherBorderColor;
  window['AscCommonExcel'].c_oAscCoAuthoringLockTablePropertiesBorderColor = c_oAscCoAuthoringLockTablePropertiesBorderColor;
  window['AscCommonExcel'].c_oAscCoAuthoringDottedWidth = c_oAscCoAuthoringDottedWidth;
  window['AscCommonExcel'].c_oAscCoAuthoringDottedDistance = c_oAscCoAuthoringDottedDistance;
  window['AscCommonExcel'].c_oAscFormulaRangeBorderColor = c_oAscFormulaRangeBorderColor;
  window['AscCommonExcel'].selectionLineType = selectionLineType;
  window['AscCommonExcel'].c_oAscLockNameFrozenPane = c_oAscLockNameFrozenPane;
  window['AscCommonExcel'].c_oAscLockNameTabColor = c_oAscLockNameTabColor;
  window['AscCommonExcel'].c_oAscLockAddSheet = c_oAscLockAddSheet;
  window['AscCommonExcel'].c_oAscLockLayoutOptions = c_oAscLockLayoutOptions;
  window['AscCommonExcel'].c_oAscHeaderFooterEdit = c_oAscHeaderFooterEdit;
  window['AscCommonExcel'].c_oAscLockPrintScaleOptions = c_oAscLockPrintScaleOptions;


  window['AscCommonExcel'].c_kMaxPrintPages = c_kMaxPrintPages;
  window['AscCommonExcel'].filteringMode = true;

  window['AscCommon'] = window['AscCommon'] || {};
  window['AscCommon'].c_oSerFormat = c_oSerFormat;
  window['AscCommon'].CurFileVersion = c_oSerFormat.Version;

  var prot;
  window['Asc'] = window['Asc'] || {};
  window['Asc']['c_oAscSortOptions'] = window['Asc'].c_oAscSortOptions = c_oAscSortOptions;
  prot = c_oAscSortOptions;
  prot['Ascending'] = prot.Ascending;
  prot['Descending'] = prot.Descending;
  prot['ByColorFill'] = prot.ByColorFill;
  prot['ByColorFont'] = prot.ByColorFont;
  prot['ByIcon'] = prot.ByIcon;
  prot['ByValue'] = prot.ByValue;
  window['Asc']['c_oAscConfirm'] = window['Asc'].c_oAscConfirm = c_oAscConfirm;
  prot = c_oAscConfirm;
  prot['ConfirmReplaceRange'] = prot.ConfirmReplaceRange;
  prot['ConfirmPutMergeRange'] = prot.ConfirmPutMergeRange;
  window['Asc']['c_oAscMergeOptions'] = window['Asc'].c_oAscMergeOptions = c_oAscMergeOptions;
  prot = c_oAscMergeOptions;
  prot['Disabled'] = prot.Disabled;
  prot['None'] = prot.None;
  prot['Merge'] = prot.Merge;
  prot['MergeCenter'] = prot.MergeCenter;
  prot['MergeAcross'] = prot.MergeAcross;
  window['Asc']['c_oAscBorderOptions'] = window['Asc'].c_oAscBorderOptions = c_oAscBorderOptions;
  prot = c_oAscBorderOptions;
  prot['Top'] = prot.Top;
  prot['Right'] = prot.Right;
  prot['Bottom'] = prot.Bottom;
  prot['Left'] = prot.Left;
  prot['DiagD'] = prot.DiagD;
  prot['DiagU'] = prot.DiagU;
  prot['InnerV'] = prot.InnerV;
  prot['InnerH'] = prot.InnerH;
  window['Asc']['c_oAscCleanOptions'] = window['Asc'].c_oAscCleanOptions = c_oAscCleanOptions;
  prot = c_oAscCleanOptions;
  prot['All'] = prot.All;
  prot['Text'] = prot.Text;
  prot['Format'] = prot.Format;
  prot['Formula'] = prot.Formula;
  prot['Comments'] = prot.Comments;
  prot['Hyperlinks'] = prot.Hyperlinks;
  prot['Sparklines'] = prot.Sparklines;
  prot['SparklineGroups'] = prot.SparklineGroups;
  window['Asc']['c_oAscCalculateType'] = window['Asc'].c_oAscCalculateType = c_oAscCalculateType;
  prot = c_oAscCalculateType;
  prot['WorkbookOnlyChanged'] = prot.WorkbookOnlyChanged;
  prot['ActiveSheet'] = prot.ActiveSheet;
  prot['Workbook'] = prot.Workbook;
  prot['All'] = prot.All;
  window['Asc']['c_oAscSelectionDialogType'] = window['Asc'].c_oAscSelectionDialogType = c_oAscSelectionDialogType;
  prot = c_oAscSelectionDialogType;
  prot['None'] = prot.None;
  prot['FormatTable'] = prot.FormatTable;
  prot['Chart'] = prot.Chart;
  prot['FormatTableChangeRange'] = prot.FormatTableChangeRange;
  prot['CustomSort'] = prot.CustomSort;
  window['Asc']['c_oAscHyperlinkType'] = window['Asc'].c_oAscHyperlinkType = c_oAscHyperlinkType;
  prot = c_oAscHyperlinkType;
  prot['WebLink'] = prot.WebLink;
  prot['RangeLink'] = prot.RangeLink;
  window['Asc']['c_oAscMouseMoveType'] = window['Asc'].c_oAscMouseMoveType = c_oAscMouseMoveType;
  prot = c_oAscMouseMoveType;
  prot['None'] = prot.None;
  prot['Hyperlink'] = prot.Hyperlink;
  prot['Comment'] = prot.Comment;
  prot['LockedObject'] = prot.LockedObject;
  prot['ResizeColumn'] = prot.ResizeColumn;
  prot['ResizeRow'] = prot.ResizeRow;
  prot['Filter'] = prot.Filter;
  window['Asc']['c_oAscMouseMoveLockedObjectType'] = window['Asc'].c_oAscMouseMoveLockedObjectType = c_oAscMouseMoveLockedObjectType;
  prot = c_oAscMouseMoveLockedObjectType;
  prot['None'] = prot.None;
  prot['Range'] = prot.Range;
  prot['TableProperties'] = prot.TableProperties;
  prot['Sheet'] = prot.Sheet;
  window['Asc']['c_oAscCustomAutoFilter'] = window['Asc'].c_oAscCustomAutoFilter = c_oAscCustomAutoFilter;
  prot = c_oAscCustomAutoFilter;
  prot['equals'] = prot.equals;
  prot['isGreaterThan'] = prot.isGreaterThan;
  prot['isGreaterThanOrEqualTo'] = prot.isGreaterThanOrEqualTo;
  prot['isLessThan'] = prot.isLessThan;
  prot['isLessThanOrEqualTo'] = prot.isLessThanOrEqualTo;
  prot['doesNotEqual'] = prot.doesNotEqual;
  prot['beginsWith'] = prot.beginsWith;
  prot['doesNotBeginWith'] = prot.doesNotBeginWith;
  prot['endsWith'] = prot.endsWith;
  prot['doesNotEndWith'] = prot.doesNotEndWith;
  prot['contains'] = prot.contains;
  prot['doesNotContain'] = prot.doesNotContain;
  window['Asc']['c_oAscDynamicAutoFilter'] = window['Asc'].c_oAscDynamicAutoFilter = c_oAscDynamicAutoFilter;
  prot = c_oAscDynamicAutoFilter;
  prot['aboveAverage'] = prot.aboveAverage;
  prot['belowAverage'] = prot.belowAverage;
  window['Asc']['c_oAscTop10AutoFilter'] = window['Asc'].c_oAscTop10AutoFilter = c_oAscTop10AutoFilter;
  prot = c_oAscTop10AutoFilter;
  prot['max'] = prot.max;
  prot['min'] = prot.min;
  window['Asc']['c_oAscChangeFilterOptions'] = window['Asc'].c_oAscChangeFilterOptions = c_oAscChangeFilterOptions;
  prot = c_oAscChangeFilterOptions;
  prot['filter'] = prot.filter;
  prot['style'] = prot.style;
  window['Asc']['c_oAscCellEditorState'] = window['Asc'].c_oAscCellEditorState = c_oAscCellEditorState;
  prot = c_oAscCellEditorState;
  prot['editEnd'] = prot.editEnd;
  prot['editStart'] = prot.editStart;
  prot['editEmptyCell'] = prot.editEmptyCell;
  prot['editText'] = prot.editText;
  prot['editFormula'] = prot.editFormula;
  prot['editInFormulaBar'] = prot.editInFormulaBar;
  prot['editInCell'] = prot.editInCell;
  window['Asc']['c_oAscChangeSelectionFormatTable'] = window['Asc'].c_oAscChangeSelectionFormatTable = c_oAscChangeSelectionFormatTable;
  prot = c_oAscChangeSelectionFormatTable;
  prot['all'] = prot.all;
  prot['data'] = prot.data;
  prot['row'] = prot.row;
  prot['column'] = prot.column;
  window['Asc']['c_oAscChangeTableStyleInfo'] = window['Asc'].c_oAscChangeTableStyleInfo = c_oAscChangeTableStyleInfo;
  prot = c_oAscChangeTableStyleInfo;
  prot['columnFirst'] = prot.columnFirst;
  prot['columnLast'] = prot.columnLast;
  prot['columnBanded'] = prot.columnBanded;
  prot['rowHeader'] = prot.rowHeader;
  prot['rowTotal'] = prot.rowTotal;
  prot['rowBanded'] = prot.rowBanded;
  prot['filterButton'] = prot.filterButton;
  prot['advancedSettings'] = prot.advancedSettings;
  window['Asc']['c_oAscAutoFilterTypes'] = window['Asc'].c_oAscAutoFilterTypes = c_oAscAutoFilterTypes;
  prot = c_oAscAutoFilterTypes;
  prot['ColorFilter'] = prot.ColorFilter;
  prot['CustomFilters'] = prot.CustomFilters;
  prot['DynamicFilter'] = prot.DynamicFilter;
  prot['Top10'] = prot.Top10;
  prot['Filters'] = prot.Filters;
  prot['None'] = prot.None;
  window['Asc']['c_oAscFindLookIn'] = window['Asc'].c_oAscFindLookIn = c_oAscFindLookIn;
  prot = c_oAscFindLookIn;
  prot['Formulas'] = prot.Formulas;
  prot['Value'] = prot.Value;
  prot['Annotations'] = prot.Annotations;
  window['Asc']['c_oAscGetDefinedNamesList'] = window['Asc'].c_oAscGetDefinedNamesList = c_oAscGetDefinedNamesList;
  prot = c_oAscGetDefinedNamesList;
  prot['Worksheet'] = prot.Worksheet;
  prot['WorksheetWorkbook'] = prot.WorksheetWorkbook;
  prot['All'] = prot.All;
  window['Asc']['c_oAscDefinedNameReason'] = window['Asc'].c_oAscDefinedNameReason = c_oAscDefinedNameReason;
  prot = c_oAscDefinedNameReason;
  prot['WrongName'] = prot.WrongName;
  prot['IsLocked'] = prot.IsLocked;
  prot['Existed'] = prot.Existed;
  prot['LockDefNameManager'] = prot.LockDefNameManager;
  prot['NameReserved'] = prot.NameReserved;
  prot['OK'] = prot.OK;
  window['Asc']['c_oAscPopUpSelectorType'] = window['Asc'].c_oAscPopUpSelectorType = c_oAscPopUpSelectorType;
  prot = c_oAscPopUpSelectorType;
  prot['None'] = prot.None;
  prot['Func'] = prot.Func;
  prot['Range'] = prot.Range;
  prot['Table'] = prot.Table;
  window['Asc']['c_oAscSparklineType'] = window['Asc'].c_oAscSparklineType = c_oAscSparklineType;
  prot = c_oAscSparklineType;
  prot['Line'] = prot.Line;
  prot['Column'] = prot.Column;
  prot['Stacked'] = prot.Stacked;
  window['Asc']['c_oAscEDispBlanksAs'] = window['Asc'].c_oAscEDispBlanksAs = c_oAscEDispBlanksAs;
  prot = c_oAscEDispBlanksAs;
  prot['Span'] = prot.Span;
  prot['Gap'] = prot.Gap;
  prot['Zero'] = prot.Zero;
  window['Asc']['c_oAscSparklineAxisMinMax'] = window['Asc'].c_oAscSparklineAxisMinMax = c_oAscSparklineAxisMinMax;
  prot = c_oAscSparklineAxisMinMax;
  prot['Individual'] = prot.Individual;
  prot['Group'] = prot.Group;
  prot['Custom'] = prot.Custom;
  window['Asc']['c_oAscAutoCorrectOptions'] = window['Asc'].c_oAscAutoCorrectOptions = c_oAscAutoCorrectOptions;
  prot = c_oAscAutoCorrectOptions;
  prot['UndoTableAutoExpansion'] = prot.UndoTableAutoExpansion;
  prot['RedoTableAutoExpansion'] = prot.RedoTableAutoExpansion;
  window['Asc']['c_oAscChangePrintAreaType'] = window['Asc'].c_oAscChangePrintAreaType = c_oAscChangePrintAreaType;
  prot = c_oAscChangePrintAreaType;
  prot['set'] = prot.set;
  prot['clear'] = prot.clear;
  prot['add'] = prot.add;
  window['Asc']['c_oAscHeaderFooterField'] = window['Asc'].c_oAscHeaderFooterField = c_oAscHeaderFooterField;
  prot = c_oAscHeaderFooterField;
  prot['pageNumber'] = prot.pageNumber;
  prot['pageCount'] = prot.pageCount;
  prot['sheetName'] = prot.sheetName;
  prot['fileName'] = prot.fileName;
  prot['filePath'] = prot.filePath;
  prot['date'] = prot.date;
  prot['time'] = prot.time;
  prot['lineBreak'] = prot.lineBreak;
  window['Asc']['c_oAscPageHFType'] = window['Asc'].c_oAscPageHFType = c_oAscPageHFType;
  prot = c_oAscHeaderFooterField;
  prot['firstHeader'] = prot.firstHeader;
  prot['oddHeader'] = prot.oddHeader;
  prot['evenHeader'] = prot.evenHeader;
  prot['firstFooter'] = prot.firstFooter;
  prot['oddFooter'] = prot.oddFooter;
  prot['evenFooter'] = prot.evenFooter;

  window['Asc']['c_oAscHeaderFooterType'] = window['Asc'].c_oAscHeaderFooterType = c_oAscHeaderFooterType;
  prot = c_oAscHeaderFooterType;
  prot['first'] = prot.first;
  prot['odd'] = prot.odd;
  prot['even'] = prot.even;

  window['Asc']['c_oAscHeaderFooterPresets'] = window['Asc'].c_oAscHeaderFooterPresets = c_oAscHeaderFooterPresets;
  prot = c_oAscHeaderFooterPresets;
  prot['none'] = prot.none;
  prot['page'] = prot.page;
  prot['pageOfQuestion'] = prot.pageOfQuestion;
  prot['sheet'] = prot.sheet;
  prot['confidential'] = prot.confidential;
  prot['bookName'] = prot.bookName;
  prot['sheetPage'] = prot.sheetPage;
  prot['sheetConfidentialPage'] = prot.sheetConfidentialPage;
  prot['bookNamePage'] = prot.bookNamePage;
  prot['pageSheet'] = prot.pageSheet;
  prot['pageBook'] = prot.pageBook;
  prot['pageBookName'] = prot.pageBookName;
  prot['userPageDate'] = prot.userPageDate;
  prot['preparedUserDatePage'] = prot.preparedUserDatePage;
  prot['custom'] = prot.custom;

})(window);
