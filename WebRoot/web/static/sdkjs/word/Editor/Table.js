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

// TODO: При расчете таблиц есть один баг, который надо будет поправить в будущем:
//       при разбиении строки на страницы возможен вариант, когда у каких-то ячеек
//       убирается содержимое на первой странице, а у каких-то - нет. В данном случае
//       надо для всех ячеек содержимое переносить на новую страницу(как в Word).

// TODO: Несовсем правильно(всмысле не как в Word) обрабатывается верхнее поле ячеек:
//       особенно это проявляется в таблицах с ненулевым расстоянием между ячейками.

    
// TODO: Оказалось, что параметр "не отрывать от следующего" влияет и на таблицы, если 
//       после параграфа с таким параметром идет таблица. (см. MSFT_FY11Q3_10Q.docx стр. 3)
    
// TODO: Поскольку, расстояния до/после параграфа для первого и последнего параграфов 
//       в ячейке зависит от следующей и предыдущей ячеек, надо включать их в пересчет

// Import
var align_Left = AscCommon.align_Left;
var CMouseMoveData = AscCommon.CMouseMoveData;
var g_oTableId = AscCommon.g_oTableId;
var History = AscCommon.History;

var linerule_AtLeast = Asc.linerule_AtLeast;
var c_oAscError = Asc.c_oAscError;
var c_oAscHAnchor = Asc.c_oAscHAnchor;
var c_oAscXAlign = Asc.c_oAscXAlign;
var c_oAscYAlign = Asc.c_oAscYAlign;
var c_oAscVAnchor = Asc.c_oAscVAnchor;
var c_oAscCellTextDirection = Asc.c_oAscCellTextDirection;
var c_oAscRevisionsChangeType = Asc.c_oAscRevisionsChangeType;
    

var table_Selection_Cell = 0x00; // Селектим целыми ячейками
var table_Selection_Text = 0x01; // Селектим текст внутри текущей ячейки

var table_Selection_Common            = 0x00;
var table_Selection_Border            = 0x01;
var table_Selection_Border_InnerTable = 0x02;
var table_Selection_Rows              = 0x03; // Селектим по строкам
var table_Selection_Columns           = 0x04; // Селектим по колонкам
var table_Selection_Cells             = 0x05; // Селектим только по ячейкам

var type_Table = 0x0002;


/**
 * Класс CTable
 * @constructor
 * @extends {CDocumentContentElementBase}
 */
function CTable(DrawingDocument, Parent, Inline, Rows, Cols, TableGrid, bPresentation)
{
	CDocumentContentElementBase.call(this, Parent);

    this.Markup = new AscCommon.CTableMarkup(this);

    this.Inline = Inline;

    this.Lock = new AscCommon.CLock();
    // TODO: Когда у g_oIdCounter будет тоже проверка на TurnOff заменить здесь
    if (false === AscCommon.g_oIdCounter.m_bLoad && true === History.Is_On())
    {
        this.Lock.Set_Type(AscCommon.locktype_Mine, false);
        if (AscCommon.CollaborativeEditing)
            AscCommon.CollaborativeEditing.Add_Unlock2(this);
    }
    
    this.DrawingDocument = null;
    this.LogicDocument   = null;
    
    if ( undefined !== DrawingDocument && null !== DrawingDocument )
    {
        this.DrawingDocument = DrawingDocument;
        this.LogicDocument   = this.DrawingDocument.m_oLogicDocument;
    }
    
    this.CompiledPr =
    {
        Pr         : null,  // Скомпилированный (окончательный стиль)
        NeedRecalc : true   // Нужно ли пересчитать скомпилированный стиль
    };

    this.Pr = new CTablePr();
    this.Pr.TableW = new CTableMeasurement(tblwidth_Auto, 0);

    this.TableGridNeedRecalc = true;
    this.bPresentation = bPresentation === true;

    // TODO: TableLook и TableStyle нужно перемесить в TablePr
    this.TableStyle = (undefined !== this.DrawingDocument && null !== this.DrawingDocument && this.DrawingDocument.m_oLogicDocument && this.DrawingDocument.m_oLogicDocument.Styles ? this.DrawingDocument.m_oLogicDocument.Styles.Get_Default_TableGrid() : null);
    this.TableLook  = new CTableLook(true, true, false, false, true, false);

    this.TableSumGrid  = []; // данный массив будет заполнен после private_RecalculateGrid
    this.TableGrid     = TableGrid ? TableGrid : [];
    this.TableGridCalc = this.private_CopyTableGrid();

    this.RecalcInfo = new CTableRecalcInfo();

    this.Rows = Rows;
    this.Cols = Cols;

    // Массив строк
    this.Content = [];
    for ( var Index = 0; Index < Rows; Index++ )
    {
        this.Content[Index] = new CTableRow( this, Cols, TableGrid );
    }

    this.Internal_ReIndexing(0);

    // Информация о строках (расположение, высота и остальные метрики)
    this.RowsInfo = [];
    this.TableRowsBottom = [];
    this.HeaderInfo =
    {
		HeaderRecalculate : false, // В данный момент идет пересчет самих заголовков
		Count             : 0,     // Количество строк, входящих в заголовок
		H                 : 0,     // Суммарная высота, занимаемая заголовком
		PageIndex         : 0,     // Страница, на которой лежит исходный заголовок (либо 0, либо 1)
		Pages             : []
	};

    this.Selection =
    {
        Start    : false,
        Use      : false,
        StartPos :
        {
            Pos        : { Row : 0, Cell : 0 },
            X          : 0,
            Y          : 0,
            PageIndex  : 0,
            MouseEvent : { ClickCount : 1, Type : AscCommon.g_mouse_event_type_down, CtrlKey : false }
        },
        EndPos   :
        {
            Pos        : { Row : 0, Cell : 0 },
            X          : 0,
            Y          : 0,
            PageIndex  : 0,
            MouseEvent : { ClickCount : 1, Type : AscCommon.g_mouse_event_type_down, CtrlKey : false }
        },
        Type     : table_Selection_Text,
        Data     : null,
        Type2    : table_Selection_Common,
        Data2    : null,
        CurRow   : 0  // Специальный параметр, используемый для стрелок вправо/влево
    };

    // this.X_origin - точка, которую нам задали как начальную для рисования таблицы
    // this.X        - фактическая начальная точка для рисования и обсчета таблицы
    this.X_origin = 0;

    this.AllowOverlap = true;

    // Позиция по горизонтали
    this.PositionH =
    {
        RelativeFrom : c_oAscHAnchor.Page, // Относительно чего вычисляем координаты
        Align        : true,               // true : В поле Value лежит тип прилегания, false - в поле Value лежит точное значени
        Value        : c_oAscXAlign.Center //
    };

    this.PositionH_Old = undefined;

    // Позиция по горизонтали
    this.PositionV =
    {
        RelativeFrom : c_oAscVAnchor.Page, // Относительно чего вычисляем координаты
        Align        : true,               // true : В поле Value лежит тип прилегания, false - в поле Value лежит точное значени
        Value        : c_oAscYAlign.Center //
    };

    this.PositionV_Old = undefined;

    // Расстояние до окружающего текста
    this.Distance =
    {
        T : 0,
        B : 0,
        L : 0,
        R : 0
    };

    this.AnchorPosition = new CTableAnchorPosition();
    
    this.Pages    = [];
    this.Pages[0] = new CTablePage(0, 0, 0, 0, 0, 0);

    this.MaxTopBorder = [];
    this.MaxBotBorder = [];
    this.MaxBotMargin = [];

    // Выставляем текущую ячейку
    if ( this.Content.length > 0 )
        this.CurCell = this.Content[0].Get_Cell( 0 );
    else
        this.CurCell = null;

    this.TurnOffRecalc = false;

    this.ApplyToAll = false; // Специальный параметр, используемый в ячейках таблицы.
                             // True, если ячейка попадает в выделение по ячейкам.

    this.m_oContentChanges = new AscCommon.CContentChanges(); // список изменений(добавление/удаление элементов)
    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    g_oTableId.Add( this, this.Id );
}

CTable.prototype = Object.create(CDocumentContentElementBase.prototype);
CTable.prototype.constructor = CTable;

CTable.prototype.GetType = function()
{
	return type_Table;
};
//----------------------------------------------------------------------------------------------------------------------
// Общие функции
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.Get_Theme = function()
{
	return this.Parent.Get_Theme();
};
CTable.prototype.Get_ColorMap = function()
{
	return this.Parent.Get_ColorMap();
};
CTable.prototype.Get_Props = function()
{
	var TablePr = this.Get_CompiledPr(false).TablePr;

	var Pr = {};

	if (tblwidth_Auto === TablePr.TableW.Type || (tblwidth_Mm === TablePr.TableW.Type && TablePr.TableW.W < 0.001))
		Pr.TableWidth = null;
	else if (tblwidth_Mm === TablePr.TableW.Type)
		Pr.TableWidth = TablePr.TableW.W;
	else// if (tblwidth_Pct === TablePr.TableW.Type)
		Pr.TableWidth = -TablePr.TableW.W;

	Pr.AllowOverlap = this.AllowOverlap;

	// Пока у нас во всей таблицы одинаковый Spacing
	Pr.TableSpacing = this.Content[0].Get_CellSpacing();

	Pr.TableDefaultMargins = {
		Left   : TablePr.TableCellMar.Left.W,
		Right  : TablePr.TableCellMar.Right.W,
		Top    : TablePr.TableCellMar.Top.W,
		Bottom : TablePr.TableCellMar.Bottom.W
	};

	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		Pr.CellSelect = true;

		var CellMargins    = null;
		var CellMarginFlag = false;

		var Border_left    = null;
		var Border_right   = null;
		var Border_top     = null;
		var Border_bottom  = null;
		var Border_insideH = null;
		var Border_insideV = null;

		var CellShd        = null;
		var CellWidth      = undefined;
		var CellWidthStart = undefined;

		var Prev_row  = -1;
		var bFirstRow = true;

		var VAlign        = null;
		var TextDirection = null;
		var NoWrap        = null;

		var nRowHeight = null;

		for (var Index = 0; Index < this.Selection.Data.length; Index++)
		{
			var Pos          = this.Selection.Data[Index];
			var Row          = this.Content[Pos.Row];
			var Cell         = Row.Get_Cell(Pos.Cell);
			var Cell_borders = Cell.Get_Borders();
			var Cell_margins = Cell.GetMargins();
			var Cell_shd     = Cell.Get_Shd();
			var Cell_w       = Cell.Get_W();

			if (0 === Index)
			{
				VAlign        = Cell.Get_VAlign();
				TextDirection = Cell.Get_TextDirection();
				NoWrap        = Cell.GetNoWrap();
			}
			else
			{
				if (VAlign !== Cell.Get_VAlign())
					VAlign = null;

				if (TextDirection !== Cell.Get_TextDirection())
					TextDirection = null;

				if (NoWrap !== Cell.GetNoWrap())
					NoWrap = null;
			}

			if (0 === Index)
			{
				CellShd = Cell_shd;
			}
			else
			{
				if (null != CellShd && ( CellShd.Value != Cell_shd.Value || CellShd.Color.r != Cell_shd.Color.r || CellShd.Color.g != Cell_shd.Color.g || CellShd.Color.b != Cell_shd.Color.b ))
					CellShd = null;
			}

			var _CellWidth;
			if (tblwidth_Auto === Cell_w.Type)
				_CellWidth = null;
			else if (tblwidth_Mm === Cell_w.Type)
				_CellWidth = Cell_w.W;
			else// if (tblwidth_Pct === Cell_w.Type)
				_CellWidth = -Cell_w.W;

			if (0 === Index)
			{
				CellWidthStart = _CellWidth;
			}
			else
			{

				if ((tblwidth_Auto === Cell_w.Type && null !== CellWidth)
					|| (undefined === CellWidth
					|| null === CellWidth
					|| Math.abs(CellWidth - _CellWidth) > 0.001))
					CellWidth = undefined;
			}

			// Крайняя левая ли данная ячейка в выделении?
			if (0 === Index || this.Selection.Data[Index - 1].Row != Pos.Row)
			{
				if (null === Border_left)
					Border_left = Cell_borders.Left;
				else
					Border_left = this.Internal_CompareBorders2(Border_left, Cell_borders.Left);
			}
			else
			{
				if (null === Border_insideV)
					Border_insideV = Cell_borders.Left;
				else
					Border_insideV = this.Internal_CompareBorders2(Border_insideV, Cell_borders.Left);
			}

			// Крайняя правая ли данная ячейка в выделении?
			if (this.Selection.Data.length - 1 === Index || this.Selection.Data[Index + 1].Row != Pos.Row)
			{
				if (null === Border_right)
					Border_right = Cell_borders.Right;
				else
					Border_right = this.Internal_CompareBorders2(Border_right, Cell_borders.Right);
			}
			else
			{
				if (null === Border_insideV)
					Border_insideV = Cell_borders.Right;
				else
					Border_insideV = this.Internal_CompareBorders2(Border_insideV, Cell_borders.Right);
			}

			if (Prev_row != Pos.Row)
			{
				if (-1 != Prev_row)
					bFirstRow = false;

				if (false === bFirstRow)
				{
					if (null === Border_insideH)
					{
						Border_insideH = Border_bottom;
						Border_insideH = this.Internal_CompareBorders2(Border_insideH, Cell_borders.Top);
					}
					else
					{
						Border_insideH = this.Internal_CompareBorders2(Border_insideH, Border_bottom);
						Border_insideH = this.Internal_CompareBorders2(Border_insideH, Cell_borders.Top);
					}
				}
				else
				{
					if (null === Border_top)
						Border_top = Cell_borders.Top;
				}

				Border_bottom = Cell_borders.Bottom;
				Prev_row      = Pos.Row;
			}
			else
			{
				if (false === bFirstRow)
				{
					if (null === Border_insideH)
						Border_insideH = Cell_borders.Top;
					else
						Border_insideH = this.Internal_CompareBorders2(Border_insideH, Cell_borders.Top);
				}
				else
				{
					if (null === Border_top)
						Border_top = Cell_borders.Top;
					else
						Border_top = this.Internal_CompareBorders2(Border_top, Cell_borders.Top);
				}

				Border_bottom = this.Internal_CompareBorders2(Border_bottom, Cell_borders.Bottom);
			}

			if (true != Cell.Is_TableMargins())
			{
				if (null === CellMargins)
				{
					CellMargins = Common_CopyObj(Cell_margins);
				}
				else
				{
					if (CellMargins.Left.W != Cell_margins.Left.W)
						CellMargins.Left.W = null;

					if (CellMargins.Right.W != Cell_margins.Right.W)
						CellMargins.Right.W = null;

					if (CellMargins.Top.W != Cell_margins.Top.W)
						CellMargins.Top.W = null;

					if (CellMargins.Bottom.W != Cell_margins.Bottom.W)
						CellMargins.Bottom.W = null;
				}
			}
			else
			{
				CellMarginFlag = true;
			}


			var nCurRowHeight;
			var oRowH = Row.GetHeight();
			if (oRowH.IsAuto())
			{
				var oRow    = Row;
				var nCurRow = oRow.GetIndex();

				var nRowSummaryH = 0;

				// Проверка на случай непересчитанной таблицы
				if (this.RowsInfo[nCurRow])
				{
					for (var nCurPage in this.RowsInfo[nCurRow].H)
						nRowSummaryH += this.RowsInfo[nCurRow].H[nCurPage];

					if (null !== Pr.TableSpacing)
						nRowSummaryH += Pr.TableSpacing;
					else if (this.RowsInfo[nCurRow].TopDy[0])
						nRowSummaryH -= this.RowsInfo[nCurRow].TopDy[0];

					nRowSummaryH -= oRow.GetTopMargin() + oRow.GetBottomMargin();
				}

				nCurRowHeight = nRowSummaryH;
			}
			else
			{
				nCurRowHeight = oRowH.GetValue();
			}

			if (null === nRowHeight)
				nRowHeight = nCurRowHeight;
			else if (undefined !== nRowHeight && Math.abs(nRowHeight - nCurRowHeight) > 0.001)
				nRowHeight = undefined;
		}

		Pr.CellsVAlign        = VAlign;
		Pr.CellsTextDirection = TextDirection;
		Pr.CellsNoWrap        = NoWrap;

		if (undefined === CellWidth)
		{
			Pr.CellsWidth         = CellWidthStart;
			Pr.CellsWidthNotEqual = true;
		}
		else
		{
			Pr.CellsWidth         = CellWidthStart;
			Pr.CellsWidthNotEqual = false;
		}

		Pr.RowHeight   = nRowHeight;

		Pr.CellBorders = {
			Left    : Border_left.Copy(),
			Right   : Border_right.Copy(),
			Top     : Border_top.Copy(),
			Bottom  : Border_bottom.Copy(),
			InsideH : null === Border_insideH ? null : Border_insideH.Copy(),
			InsideV : null === Border_insideV ? null : Border_insideV.Copy()
		};

		if (null === CellShd)
			Pr.CellsBackground = null;
		else
			Pr.CellsBackground = CellShd.Copy();

		if (null === CellMargins)
		{
			Pr.CellMargins = {
				Flag : 0
			};
		}
		else
		{
			var Flag = 2;
			if (true === CellMarginFlag)
				Flag = 1;

			Pr.CellMargins = {
				Left   : CellMargins.Left.W,
				Right  : CellMargins.Right.W,
				Top    : CellMargins.Top.W,
				Bottom : CellMargins.Bottom.W,
				Flag   : Flag
			};
		}
	}
	else
	{
		Pr.CellSelect = false;

		var Cell        = this.CurCell;
		var CellMargins = Cell.GetMargins();
		var CellBorders = Cell.Get_Borders();
		var CellShd     = Cell.Get_Shd();
		var CellW       = Cell.Get_W();

		if (true === Cell.Is_TableMargins())
		{
			Pr.CellMargins = {
				Flag : 0
			};
		}
		else
		{
			Pr.CellMargins = {
				Left   : CellMargins.Left.W,
				Right  : CellMargins.Right.W,
				Top    : CellMargins.Top.W,
				Bottom : CellMargins.Bottom.W,
				Flag   : 2
			};
		}

		Pr.CellsVAlign        = Cell.Get_VAlign();
		Pr.CellsTextDirection = Cell.Get_TextDirection();
		Pr.CellsNoWrap        = Cell.GetNoWrap();

		Pr.CellsBackground = CellShd.Copy();

		if (tblwidth_Auto === CellW.Type)
			Pr.CellsWidth = null;
		else if (tblwidth_Mm === CellW.Type)
			Pr.CellsWidth = CellW.W;
		else// if (tblwidth_Pct === CellW.Type)
			Pr.CellsWidth = -CellW.W;

		Pr.CellsWidthNotEqual = false;

		var Spacing = this.Content[0].Get_CellSpacing();

		var Border_left    = null;
		var Border_right   = null;
		var Border_top     = null;
		var Border_bottom  = null;
		var Border_insideH = null;
		var Border_insideV = null;

		var CellShd = null;

		for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
		{
			var Row         = this.Content[CurRow];
			var Cells_Count = Row.Get_CellsCount();

			for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
			{
				var Cell         = Row.Get_Cell(CurCell);
				var Cell_borders = Cell.Get_Borders();
				var Cell_shd     = Cell.Get_Shd();
				var oCellW       = Cell.GetW();

				if (0 === CurCell && Cells_Count)
				{
					CellShd = Cell_shd;
				}
				else
				{
					if (null != CellShd && ( CellShd.Value != Cell_shd.Value || CellShd.Color.r != Cell_shd.Color.r || CellShd.Color.g != Cell_shd.Color.g || CellShd.Color.b != Cell_shd.Color.b ))
						CellShd = null;
				}

				// Крайняя левая ли данная ячейка в выделении?
				if (0 === CurCell)
				{
					if (null === Border_left)
						Border_left = Cell_borders.Left;
					else
						Border_left = this.Internal_CompareBorders2(Border_left, Cell_borders.Left);
				}
				else
				{
					if (null === Border_insideV)
						Border_insideV = Cell_borders.Left;
					else
						Border_insideV = this.Internal_CompareBorders2(Border_insideV, Cell_borders.Left);
				}

				// Крайняя правая ли данная ячейка в выделении?
				if (Cells_Count - 1 === CurCell)
				{
					if (null === Border_right)
						Border_right = Cell_borders.Right;
					else
						Border_right = this.Internal_CompareBorders2(Border_right, Cell_borders.Right);
				}
				else
				{
					if (null === Border_insideV)
						Border_insideV = Cell_borders.Right;
					else
						Border_insideV = this.Internal_CompareBorders2(Border_insideV, Cell_borders.Right);
				}

				if (0 === CurCell)
				{
					if (0 != CurRow)
					{
						if (null === Border_insideH)
						{
							Border_insideH = Border_bottom;
							Border_insideH = this.Internal_CompareBorders2(Border_insideH, Cell_borders.Top);
						}
						else
						{
							Border_insideH = this.Internal_CompareBorders2(Border_insideH, Border_bottom);
							Border_insideH = this.Internal_CompareBorders2(Border_insideH, Cell_borders.Top);
						}
					}
					else
					{
						if (null === Border_top)
							Border_top = Cell_borders.Top;
					}

					Border_bottom = Cell_borders.Bottom;
				}
				else
				{
					if (0 != CurRow)
					{
						if (null === Border_insideH)
							Border_insideH = Cell_borders.Top;
						else
							Border_insideH = this.Internal_CompareBorders2(Border_insideH, Cell_borders.Top);
					}
					else
					{
						if (null === Border_top)
							Border_top = Cell_borders.Top;
						else
							Border_top = this.Internal_CompareBorders2(Border_top, Cell_borders.Top);
					}

					Border_bottom = this.Internal_CompareBorders2(Border_bottom, Cell_borders.Bottom);
				}
			}
		}

		Pr.CellBorders = {
			Left    : Border_left.Copy(),
			Right   : Border_right.Copy(),
			Top     : Border_top.Copy(),
			Bottom  : Border_bottom.Copy(),
			InsideH : null === Border_insideH ? null : Border_insideH.Copy(),
			InsideV : null === Border_insideV ? null : Border_insideV.Copy()
		};

		var oRowH = this.CurCell.Row.GetHeight();
		if (oRowH.IsAuto())
		{
			var oRow    = this.CurCell.GetRow();
			var nCurRow = oRow.GetIndex();

			var nRowSummaryH = 0;

			if (this.RowsInfo[nCurRow])
			{
				for (var nCurPage in this.RowsInfo[nCurRow].H)
					nRowSummaryH += this.RowsInfo[nCurRow].H[nCurPage];

				if (null !== Pr.TableSpacing)
					nRowSummaryH += Pr.TableSpacing;
				else if (this.RowsInfo[nCurRow].TopDy[0])
					nRowSummaryH -= this.RowsInfo[nCurRow].TopDy[0];

				nRowSummaryH -= oRow.GetTopMargin() + oRow.GetBottomMargin();
			}

			Pr.RowHeight = nRowSummaryH;
		}
		else
		{
			Pr.RowHeight = oRowH.GetValue();
		}
	}

	var arrSelectedCells = this.GetSelectionArray();

	var oCells = {};
	for (var nIndex = 0, nCount = arrSelectedCells.length; nIndex < nCount; ++nIndex)
	{
		var nCurCell = arrSelectedCells[nIndex].Cell;
		if (!oCells[nCurCell])
			oCells[nCurCell] = 1;
	}

	var nColumnWidth = null;

	var arrRowsInfo = this.private_GetRowsInfo();
	for (var nCurRow = 0, nCount = arrRowsInfo.length; nCurRow < nCount; ++nCurRow)
	{
		var nAdd = -1 === arrRowsInfo[nCurRow][0].Type ? 1 : 0;

		for (var nCurCell in oCells)
		{
			var _nCurCell = nCurCell | 0;
			if (arrRowsInfo[nCurRow][_nCurCell + nAdd])
			{
				if (null === nColumnWidth)
				{
					nColumnWidth = arrRowsInfo[nCurRow][_nCurCell + nAdd].W;
				}
				else if (Math.abs(nColumnWidth - arrRowsInfo[nCurRow][_nCurCell + nAdd].W) > 0.001)
				{
					nColumnWidth = undefined;
					break;
				}
			}
		}

		if (undefined === nColumnWidth)
			break;
	}

	Pr.ColumnWidth = nColumnWidth;

	switch (Pr.CellsVAlign)
	{
		case vertalignjc_Top    :
			Pr.CellsVAlign = c_oAscVertAlignJc.Top;
			break;
		case vertalignjc_Bottom :
			Pr.CellsVAlign = c_oAscVertAlignJc.Bottom;
			break;
		case vertalignjc_Center :
			Pr.CellsVAlign = c_oAscVertAlignJc.Center;
			break;
		default                 :
			Pr.CellsVAlign = null;
			break;
	}

	switch (Pr.CellsTextDirection)
	{
		case textdirection_LRTB  :
			Pr.CellsTextDirection = c_oAscCellTextDirection.LRTB;
			break;
		case textdirection_TBRL  :
			Pr.CellsTextDirection = c_oAscCellTextDirection.TBRL;
			break;
		case textdirection_BTLR  :
			Pr.CellsTextDirection = c_oAscCellTextDirection.BTLR;
			break;
		default                  :
			Pr.CellsTextDirection = null;
			break;
	}

	var oSelectionRowsRange = this.GetSelectedRowsRange();
	var nRowsInHeader       = this.GetRowsCountInHeader();

	if (oSelectionRowsRange.Start > nRowsInHeader)
		Pr.RowsInHeader = null;
	else if (oSelectionRowsRange.End < nRowsInHeader)
		Pr.RowsInHeader = true;
	else
		Pr.RowsInHeader = false;

	if (true === this.Is_Inline())
	{
		Pr.TableAlignment     = ( align_Left === TablePr.Jc ? 0 : ( AscCommon.align_Center === TablePr.Jc ? 1 : 2 ) );
		Pr.TableIndent        = TablePr.TableInd;
		Pr.TableWrappingStyle = AscCommon.c_oAscWrapStyle.Inline;

		Pr.Position = {
			X : this.X,
			Y : this.Y
		};

		Pr.TablePaddings = {
			Top    : 0,
			Bottom : 0,
			Left   : 3.2,
			Right  : 3.2
		};
	}
	else
	{
		var LD_PageFields = this.LogicDocument.Get_PageFields(this.Get_StartPage_Absolute());

		Pr.TableAlignment     = 0; // align_Left
		Pr.TableIndent        = this.X_origin - LD_PageFields.X;
		Pr.TableWrappingStyle = AscCommon.c_oAscWrapStyle.Flow;

		Pr.PositionH              = {};
		Pr.PositionH.RelativeFrom = this.PositionH.RelativeFrom;
		Pr.PositionH.UseAlign     = this.PositionH.Align;
		Pr.PositionH.Align        = ( true === Pr.PositionH.UseAlign ? this.PositionH.Value : undefined );
		Pr.PositionH.Value        = ( true === Pr.PositionH.UseAlign ? 0 : this.PositionH.Value );

		Pr.PositionV              = {};
		Pr.PositionV.RelativeFrom = this.PositionV.RelativeFrom;
		Pr.PositionV.UseAlign     = this.PositionV.Align;
		Pr.PositionV.Align        = ( true === Pr.PositionV.UseAlign ? this.PositionV.Value : undefined );
		Pr.PositionV.Value        = ( true === Pr.PositionV.UseAlign ? 0 : this.PositionV.Value );

		Pr.Position = {
			X : this.Parent.X,
			Y : this.Parent.Y
		};

		Pr.TablePaddings = {
			Left   : this.Distance.L,
			Right  : this.Distance.R,
			Top    : this.Distance.T,
			Bottom : this.Distance.B
		};
	}

	Pr.Internal_Position = this.AnchorPosition;

	Pr.TableBorders = Common_CopyObj(TablePr.TableBorders);

	Pr.TableBackground = TablePr.Shd.Copy();

	Pr.TableStyle = this.TableStyle;
	Pr.TableLook  = this.TableLook;

	if (true === this.Parent.Is_DrawingShape())
		Pr.CanBeFlow = false;
	else
		Pr.CanBeFlow = true;

	Pr.Locked = this.Lock.Is_Locked();

	if (true === this.Parent.Is_InTable())
		Pr.TableLayout = undefined;
	else
		Pr.TableLayout = (TablePr.TableLayout === tbllayout_AutoFit ? c_oAscTableLayout.AutoFit : c_oAscTableLayout.Fixed );

	if (!this.bPresentation)
	{
		this.DrawingDocument.CheckTableStyles(new Asc.CTablePropLook(this.TableLook));
	}

	Pr.PercentFullWidth = this.private_RecalculatePercentWidth();
	Pr.TableDescription = this.Get_TableDescription();
	Pr.TableCaption     = this.Get_TableCaption();

	return Pr;
};
CTable.prototype.Set_Props = function(Props)
{
	var TablePr            = this.Get_CompiledPr(false).TablePr;
	var bApplyToInnerTable = false;

	if (true != this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
	{
		bApplyToInnerTable = this.CurCell.Content.SetTableProps(Props);
	}

	if (true === bApplyToInnerTable)
		return true;

	var bRecalc_All = false;
	var bRedraw     = false;

	// TableStyle (стиль таблицы)
	if (undefined !== Props.TableStyle)
	{
		this.Set_TableStyle(Props.TableStyle);
		bRecalc_All = true;
	}

	// TableLook
	if ("undefined" != typeof(Props.TableLook))
	{
		var NewLook = new CTableLook(Props.TableLook.FirstCol, Props.TableLook.FirstRow, Props.TableLook.LastCol, Props.TableLook.LastRow, Props.TableLook.BandHor, Props.TableLook.BandVer);
		this.Set_TableLook(NewLook);
		bRecalc_All = true;
	}

	// AllowOverlap
	if (undefined != Props.AllowOverlap)
	{
		this.Set_AllowOverlap(Props.AllowOverlap);
		bRecalc_All = true;
	}

	// RowsInHeader
	if (undefined !== Props.RowsInHeader && null !== Props.RowsInHeader)
	{
		var oSelectionRowsRange = this.GetSelectedRowsRange();
		var nRowsInHeader       = this.GetRowsCountInHeader();

		if (oSelectionRowsRange.Start <= nRowsInHeader)
		{
			for (var nCurRow = oSelectionRowsRange.Start, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
			{
				if (nCurRow <= oSelectionRowsRange.End)
					this.Content[nCurRow].SetHeader(Props.RowsInHeader ? true : false);
				else
					this.Content[nCurRow].SetHeader(false);
			}
		}
	}

	// TableSpacing (расстояние между ячейками)
	if ("undefined" != typeof(Props.TableSpacing))
	{
		var NeedChange = false;
		for (var Index = 0; Index < this.Content.length; Index++)
		{
			if (Props.TableSpacing != this.Content[Index].Get_CellSpacing())
			{
				NeedChange = true;
				break;
			}
		}

		if (true === NeedChange)
		{
			var OldSpacing = this.Content[0].Get_CellSpacing();
			var Diff       = Props.TableSpacing - ( null === OldSpacing ? 0 : OldSpacing );

			for (var Index = 0; Index < this.Content.length; Index++)
				this.Content[Index].Set_CellSpacing(Props.TableSpacing);

			bRecalc_All = true;

			// При изменении Spacing мы должны изменить сетку таблицы
			var GridKoeff = [];
			var ColsCount = this.TableGridCalc.length;
			for (var Index = 0; Index < ColsCount; Index++)
				GridKoeff.push(1);

			for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
			{
				var Row        = this.Content[CurRow];
				var GridBefore = Row.Get_Before().GridBefore;
				var GridAfter  = Row.Get_After().GridAfter;

				GridKoeff[Math.min(GridBefore, GridKoeff.length - 1)]    = 1.5;
				GridKoeff[Math.max(GridKoeff.length - 1 - GridAfter, 0)] = 1.5;
			}

			var arrNewGrid = [];
			for (var Index = 0; Index < ColsCount; Index++)
			{
				arrNewGrid[Index] = this.TableGridCalc[Index] + GridKoeff[Index] * Diff;
			}
			this.SetTableGrid(arrNewGrid);
		}
	}

	// Определим, есть ли у таблицы Spacing, уже с учетом новых настроек
	var bSpacing = null === this.Content[0].Get_CellSpacing() ? false : true;

	// TableDefaultMargins (отступы в ячейках по умолчанию)
	if ("undefined" != typeof(Props.TableDefaultMargins))
	{
		var UsingDefaultMar = false;
		for (var Index = 0; Index < this.Content.length; Index++)
		{
			var Row        = this.Content[Index];
			var CellsCount = Row.Get_CellsCount();
			for (var CurCell = 0; CurCell < CellsCount; CurCell++)
			{
				var Cell = Row.Get_Cell(CurCell);
				if (null === Cell.Pr.TableCellMar)
				{
					UsingDefaultMar = true;
					break;
				}
			}
		}

		var NeedChange = false;

		var TDM        = Props.TableDefaultMargins;
		var Left_new   = ( "undefined" != typeof(TDM.Left) ? ( null != TDM.Left ? TDM.Left : TablePr.TableCellMar.Left.W   ) : TablePr.TableCellMar.Left.W   );
		var Right_new  = ( "undefined" != typeof(TDM.Right) ? ( null != TDM.Right ? TDM.Right : TablePr.TableCellMar.Right.W  ) : TablePr.TableCellMar.Right.W  );
		var Top_new    = ( "undefined" != typeof(TDM.Top) ? ( null != TDM.Top ? TDM.Top : TablePr.TableCellMar.Top.W    ) : TablePr.TableCellMar.Top.W    );
		var Bottom_new = ( "undefined" != typeof(TDM.Bottom) ? ( null != TDM.Bottom ? TDM.Bottom : TablePr.TableCellMar.Bottom.W ) : TablePr.TableCellMar.Bottom.W );

		if (Left_new != TablePr.TableCellMar.Left.W || Right_new != TablePr.TableCellMar.Right.W || Top_new != TablePr.TableCellMar.Top.W || Bottom_new != TablePr.TableCellMar.Bottom.W)
			NeedChange = true;

		if (true === NeedChange)
		{
			this.Set_TableCellMar(Left_new, Top_new, Right_new, Bottom_new);

			if (true === UsingDefaultMar)
			{
				bRecalc_All = true;
			}
		}
	}

	// CellMargins (отступы в ячейках)
	if ("undefined" != typeof(Props.CellMargins) && null != Props.CellMargins)
	{
		var NeedChange = false;

		switch (Props.CellMargins.Flag)
		{
			case 0:
			{
				if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
				{
					for (var Index = 0; Index < this.Selection.Data.length; Index++)
					{
						var Pos  = this.Selection.Data[Index];
						var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);

						if (null != Cell.Pr.TableCellMar)
						{
							Cell.Set_Margins(null);
							NeedChange = true;
						}
					}
				}
				else
				{
					var Cell = this.CurCell;

					if (null != Cell.Pr.TableCellMar)
					{
						Cell.Set_Margins(null);
						NeedChange = true;
					}
				}

				break;
			}
			case 1:
			{
				if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
				{
					for (var Index = 0; Index < this.Selection.Data.length; Index++)
					{
						var Pos  = this.Selection.Data[Index];
						var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);

						// Ячейки, у которых маргины дефелтовые, мы не трогаем
						if (true != Cell.Is_TableMargins())
						{
							if (null != Props.CellMargins.Left)
								Cell.Set_Margins({W : Props.CellMargins.Left, Type : tblwidth_Mm}, 3);

							if (null != Props.CellMargins.Right)
								Cell.Set_Margins({W : Props.CellMargins.Right, Type : tblwidth_Mm}, 1);

							if (null != Props.CellMargins.Top)
								Cell.Set_Margins({W : Props.CellMargins.Top, Type : tblwidth_Mm}, 0);

							if (null != Props.CellMargins.Bottom)
								Cell.Set_Margins({W : Props.CellMargins.Bottom, Type : tblwidth_Mm}, 2);

							NeedChange = true;
						}
					}
				}
				else
				{
					// Сюда вообще не должны заходить, но на всякий случай реализуем.
					var Cell = this.CurCell;
					if (true != Cell.Is_TableMargins())
					{
						if (null != Props.CellMargins.Left)
							Cell.Set_Margins({W : Props.CellMargins.Left, Type : tblwidth_Mm}, 3);

						if (null != Props.CellMargins.Right)
							Cell.Set_Margins({W : Props.CellMargins.Right, Type : tblwidth_Mm}, 1);

						if (null != Props.CellMargins.Top)
							Cell.Set_Margins({W : Props.CellMargins.Top, Type : tblwidth_Mm}, 0);

						if (null != Props.CellMargins.Bottom)
							Cell.Set_Margins({W : Props.CellMargins.Bottom, Type : tblwidth_Mm}, 2);
					}
					else
					{
						if (null != Props.CellMargins.Left)
							Cell.Set_Margins({W : Props.CellMargins.Left, Type : tblwidth_Mm}, 3);
						else
							Cell.Set_Margins({W : TablePr.TableCellMar.Left.W, Type : tblwidth_Mm}, 3);

						if (null != Props.CellMargins.Right)
							Cell.Set_Margins({W : Props.CellMargins.Right, Type : tblwidth_Mm}, 1);
						else
							Cell.Set_Margins({W : TablePr.TableCellMar.Right.W, Type : tblwidth_Mm}, 1);

						if (null != Props.CellMargins.Top)
							Cell.Set_Margins({W : Props.CellMargins.Top, Type : tblwidth_Mm}, 0);
						else
							Cell.Set_Margins({W : TablePr.TableCellMar.Top.W, Type : tblwidth_Mm}, 0);

						if (null != Props.CellMargins.Bottom)
							Cell.Set_Margins({W : Props.CellMargins.Bottom, Type : tblwidth_Mm}, 2);
						else
							Cell.Set_Margins({W : TablePr.TableCellMar.Bottom.W, Type : tblwidth_Mm}, 2);
					}

					NeedChange = true;
				}

				break;
			}
			case 2:
			{
				NeedChange = true;

				if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
				{
					for (var Index = 0; Index < this.Selection.Data.length; Index++)
					{
						var Pos  = this.Selection.Data[Index];
						var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);

						// Ячейки, у которых маргины дефелтовые, мы не трогаем
						if (true != Cell.Is_TableMargins())
						{
							if (null != Props.CellMargins.Left)
								Cell.Set_Margins({W : Props.CellMargins.Left, Type : tblwidth_Mm}, 3);

							if (null != Props.CellMargins.Right)
								Cell.Set_Margins({W : Props.CellMargins.Right, Type : tblwidth_Mm}, 1);

							if (null != Props.CellMargins.Top)
								Cell.Set_Margins({W : Props.CellMargins.Top, Type : tblwidth_Mm}, 0);

							if (null != Props.CellMargins.Bottom)
								Cell.Set_Margins({W : Props.CellMargins.Bottom, Type : tblwidth_Mm}, 2);
						}
						else
						{
							if (null != Props.CellMargins.Left)
								Cell.Set_Margins({W : Props.CellMargins.Left, Type : tblwidth_Mm}, 3);
							else
								Cell.Set_Margins({W : TablePr.TableCellMar.Left.W, Type : tblwidth_Mm}, 3);

							if (null != Props.CellMargins.Right)
								Cell.Set_Margins({W : Props.CellMargins.Right, Type : tblwidth_Mm}, 1);
							else
								Cell.Set_Margins({W : TablePr.TableCellMar.Right.W, Type : tblwidth_Mm}, 1);

							if (null != Props.CellMargins.Top)
								Cell.Set_Margins({W : Props.CellMargins.Top, Type : tblwidth_Mm}, 0);
							else
								Cell.Set_Margins({W : TablePr.TableCellMar.Top.W, Type : tblwidth_Mm}, 0);

							if (null != Props.CellMargins.Bottom)
								Cell.Set_Margins({W : Props.CellMargins.Bottom, Type : tblwidth_Mm}, 2);
							else
								Cell.Set_Margins({W : TablePr.TableCellMar.Bottom.W, Type : tblwidth_Mm}, 2);
						}
					}
				}
				else
				{
					var Cell = this.CurCell;
					if (true != Cell.Is_TableMargins())
					{
						if (null != Props.CellMargins.Left)
							Cell.Set_Margins({W : Props.CellMargins.Left, Type : tblwidth_Mm}, 3);

						if (null != Props.CellMargins.Right)
							Cell.Set_Margins({W : Props.CellMargins.Right, Type : tblwidth_Mm}, 1);

						if (null != Props.CellMargins.Top)
							Cell.Set_Margins({W : Props.CellMargins.Top, Type : tblwidth_Mm}, 0);

						if (null != Props.CellMargins.Bottom)
							Cell.Set_Margins({W : Props.CellMargins.Bottom, Type : tblwidth_Mm}, 2);
					}
					else
					{
						if (null != Props.CellMargins.Left)
							Cell.Set_Margins({W : Props.CellMargins.Left, Type : tblwidth_Mm}, 3);
						else
							Cell.Set_Margins({W : TablePr.TableCellMar.Left.W, Type : tblwidth_Mm}, 3);

						if (null != Props.CellMargins.Right)
							Cell.Set_Margins({W : Props.CellMargins.Right, Type : tblwidth_Mm}, 1);
						else
							Cell.Set_Margins({W : TablePr.TableCellMar.Right.W, Type : tblwidth_Mm}, 1);

						if (null != Props.CellMargins.Top)
							Cell.Set_Margins({W : Props.CellMargins.Top, Type : tblwidth_Mm}, 0);
						else
							Cell.Set_Margins({W : TablePr.TableCellMar.Top.W, Type : tblwidth_Mm}, 0);

						if (null != Props.CellMargins.Bottom)
							Cell.Set_Margins({W : Props.CellMargins.Bottom, Type : tblwidth_Mm}, 2);
						else
							Cell.Set_Margins({W : TablePr.TableCellMar.Bottom.W, Type : tblwidth_Mm}, 2);
					}

					NeedChange = true;
				}

				break;
			}
		}

		if (true === NeedChange)
			bRecalc_All = true;
	}

	// TableWidth (ширина таблицы)
	if (undefined !== Props.TableWidth)
	{
		if (null === Props.TableWidth)
		{
			if (tblwidth_Auto != TablePr.TableW.Type)
			{
				this.Set_TableW(tblwidth_Auto, 0);
				bRecalc_All = true;
			}
		}
		else if (Props.TableWidth > -0.001)
		{
			this.Set_TableW(tblwidth_Mm, Props.TableWidth);
			bRecalc_All = true;
		}
		else
		{
			this.Set_TableW(tblwidth_Pct, Math.abs(Props.TableWidth));
			bRecalc_All = true;
		}
	}

	// TableLayout
	if (undefined != Props.TableLayout)
	{
		this.SetTableLayout(( Props.TableLayout === c_oAscTableLayout.AutoFit ? tbllayout_AutoFit : tbllayout_Fixed ));
		bRecalc_All = true;
	}

	// TableWrappingStyle
	if (undefined != Props.TableWrappingStyle)
	{
		// При изменении flow на inline или наоборот, пересчет таблицы будет запущен позже
		if (0 === Props.TableWrappingStyle && true != this.Inline)
		{
			this.Set_Inline(true);
			bRecalc_All = true;
		}
		else if (1 === Props.TableWrappingStyle && false != this.Inline)
		{
			this.Set_Inline(false);

			if (undefined === Props.PositionH)
				this.Set_PositionH(c_oAscHAnchor.Page, false, this.AnchorPosition.Calculate_X_Value(c_oAscHAnchor.Page));

			if (undefined === Props.PositionV)
			{
				// Сдвигаемся на 1 twips вниз, чтобы не было пересечения с предыдущей строкой
				var ValueY = AscCommon.CorrectMMToTwips(this.AnchorPosition.Calculate_Y_Value(c_oAscVAnchor.Page)) + AscCommon.TwipsToMM(1);
				this.Set_PositionV(c_oAscVAnchor.Page, false, ValueY);
			}

			if (undefined === Props.TablePaddings)
				this.Set_Distance(3.2, 0, 3.2, 0);

			this.Set_TableInd(0);

			bRecalc_All = true;
		}
	}

	var _Jc = TablePr.Jc; // Запоминаем, чтобы не пересчитывать стиль
	// TableAlignment (прилегание таблицы)
	if ("undefined" != typeof(Props.TableAlignment) && true === this.Is_Inline())
	{
		var NewJc = ( 0 === Props.TableAlignment ? align_Left : ( 1 === Props.TableAlignment ? AscCommon.align_Center : AscCommon.align_Right ) );
		if (TablePr.Jc != NewJc)
		{
			_Jc = NewJc;
			this.Set_TableAlign(NewJc);
			bRecalc_All = true;
		}
	}

	// TableIndent (отступ слева)
	if ("undefined" != typeof(Props.TableIndent) && true === this.Is_Inline() && align_Left === _Jc)
	{
		if (Props.TableIndent != TablePr.TableInd)
		{
			this.Set_TableInd(Props.TableIndent);
			bRecalc_All = true;
		}
	}

	// Position
	if (undefined != Props.Position)
	{
		this.PositionH.RelativeFrom = c_oAscHAnchor.Page;
		this.PositionH.Align        = true;
		this.PositionV.RelativeFrom = c_oAscVAnchor.Page;
		this.PositionH.Align        = true;

		this.PositionH.Value = c_oAscXAlign.Center;
		this.PositionV.Value = c_oAscYAlign.Center;

		//this.PositionH.Value        = ( "undefined" != typeof(Props.Position.X) ? ( null != Props.Position.X ?
		// Props.Position.X : this.X ) : this.X ); this.PositionV.Value        = ( "undefined" !=
		// typeof(Props.Position.Y) ? ( null != Props.Position.Y ? Props.Position.Y : this.Y ) : this.Y );

		bRecalc_All = true;
	}

	if (undefined != Props.PositionH)
	{
		this.Set_PositionH(Props.PositionH.RelativeFrom, Props.PositionH.UseAlign, (true === Props.PositionH.UseAlign) ? Props.PositionH.Align : Props.PositionH.Value);
	}

	if (undefined != Props.PositionV)
	{
		this.Set_PositionV(Props.PositionV.RelativeFrom, Props.PositionV.UseAlign, (true === Props.PositionV.UseAlign) ? Props.PositionV.Align : Props.PositionV.Value);
	}

	// TablePaddings
	if (undefined != Props.TablePaddings)
	{
		var TP          = Props.TablePaddings;
		var CurPaddings = this.Distance;

		var NewPaggings_left   = ( undefined != TP.Left ? ( null != TP.Left ? TP.Left : CurPaddings.L ) : CurPaddings.L );
		var NewPaggings_right  = ( undefined != TP.Right ? ( null != TP.Right ? TP.Right : CurPaddings.R ) : CurPaddings.R );
		var NewPaggings_top    = ( undefined != TP.Top ? ( null != TP.Top ? TP.Top : CurPaddings.T ) : CurPaddings.T );
		var NewPaggings_bottom = ( undefined != TP.Bottom ? ( null != TP.Bottom ? TP.Bottom : CurPaddings.B ) : CurPaddings.B );

		if (Math.abs(CurPaddings.L - NewPaggings_left) > 0.001 || Math.abs(CurPaddings.R - NewPaggings_right) > 0.001 || Math.abs(CurPaddings.T - NewPaggings_top) > 0.001 || Math.abs(CurPaddings.B - NewPaggings_bottom) > 0.001)
		{
			this.Set_Distance(NewPaggings_left, NewPaggings_top, NewPaggings_right, NewPaggings_bottom);
			bRecalc_All = true;
		}
	}

	// TableBorders(границы таблицы)
	if ("undefined" != typeof(Props.TableBorders) && null != Props.TableBorders)
	{
		if (false === this.Internal_CheckNullBorder(Props.TableBorders.Top) && false === this.Internal_CompareBorders3(Props.TableBorders.Top, TablePr.TableBorders.Top))
		{
			this.Set_TableBorder_Top(Props.TableBorders.Top);
			bRecalc_All = true;

			if (true != bSpacing)
			{
				var Row = this.Content[0];
				for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
				{
					var Cell = Row.Get_Cell(CurCell);
					Cell.Set_Border(null, 0);
				}
			}
		}

		if (false === this.Internal_CheckNullBorder(Props.TableBorders.Bottom) && false === this.Internal_CompareBorders3(Props.TableBorders.Bottom, TablePr.TableBorders.Bottom))
		{
			this.Set_TableBorder_Bottom(Props.TableBorders.Bottom);
			bRecalc_All = true;

			if (true != bSpacing)
			{
				var Row = this.Content[this.Content.length - 1];
				for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
				{
					var Cell = Row.Get_Cell(CurCell);
					Cell.Set_Border(null, 2);
				}
			}
		}

		if (false === this.Internal_CheckNullBorder(Props.TableBorders.Left) && false === this.Internal_CompareBorders3(Props.TableBorders.Left, TablePr.TableBorders.Left))
		{
			this.Set_TableBorder_Left(Props.TableBorders.Left);
			bRecalc_All = true;

			if (true != bSpacing)
			{
				for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
				{
					var Cell = this.Content[CurRow].Get_Cell(0);
					Cell.Set_Border(null, 3);
				}
			}
		}

		if (false === this.Internal_CheckNullBorder(Props.TableBorders.Right) && false === this.Internal_CompareBorders3(Props.TableBorders.Right, TablePr.TableBorders.Right))
		{
			this.Set_TableBorder_Right(Props.TableBorders.Right);
			bRecalc_All = true;

			if (true != bSpacing)
			{
				for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
				{
					var Cell = this.Content[CurRow].Get_Cell(this.Content[CurRow].Get_CellsCount() - 1);
					Cell.Set_Border(null, 1);
				}
			}
		}

		if (false === this.Internal_CheckNullBorder(Props.TableBorders.InsideH) && false === this.Internal_CompareBorders3(Props.TableBorders.InsideH, TablePr.TableBorders.InsideH))
		{
			this.Set_TableBorder_InsideH(Props.TableBorders.InsideH);
			bRecalc_All = true;

			for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
			{
				var Row         = this.Content[CurRow];
				var Cells_Count = Row.Get_CellsCount();

				for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
				{
					var Cell = Row.Get_Cell(CurCell);

					if ((0 === CurRow && true === bSpacing) || 0 != CurRow)
						Cell.Set_Border(null, 0);

					if (( this.Content.length - 1 === CurRow && true === bSpacing ) || this.Content.length - 1 != CurRow)
						Cell.Set_Border(null, 2);

				}
			}
		}

		if (false === this.Internal_CheckNullBorder(Props.TableBorders.InsideV) && false === this.Internal_CompareBorders3(Props.TableBorders.InsideV, TablePr.TableBorders.InsideV))
		{
			this.Set_TableBorder_InsideV(Props.TableBorders.InsideV);
			bRecalc_All = true;

			for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
			{
				var Row         = this.Content[CurRow];
				var Cells_Count = Row.Get_CellsCount();

				for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
				{
					var Cell = Row.Get_Cell(CurCell);

					if ((0 === CurCell && true === bSpacing) || 0 != CurCell)
						Cell.Set_Border(null, 3);

					if (( Cells_Count - 1 === CurCell && true === bSpacing ) || Cells_Count - 1 != CurCell)
						Cell.Set_Border(null, 1);
				}
			}
		}
	}

	// CellBorders (границы ячеек)
	if ("undefined" != typeof(Props.CellBorders) && null != Props.CellBorders)
	{
		var Cells_array = null;

		// Переделаем идеальный вариант, на новый
		if (true === bSpacing)
		{
			if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
			{
				Cells_array = [];
				for (var Index = 0, Count = this.Selection.Data.length; Index < Count; Index++)
				{
					var RowIndex  = this.Selection.Data[Index].Row;
					var CellIndex = this.Selection.Data[Index].Cell;

					var StartGridCol    = this.Content[RowIndex].Get_CellInfo(CellIndex).StartGridCol;
					var GridSpan        = this.Content[RowIndex].Get_Cell(CellIndex).Get_GridSpan();
					var TempCells_array = this.private_GetCellsPosArrayByCellsArray(this.private_GetMergedCells(RowIndex, StartGridCol, GridSpan));
					Cells_array         = Cells_array.concat(TempCells_array);
				}
			}
			else if (false === Props.CellSelect)
			{
				Cells_array = [];
				for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
				{
					var Row         = this.Content[CurRow];
					var Cells_count = Row.Get_CellsCount();
					for (var CurCell = 0; CurCell < Cells_count; CurCell++)
					{
						var Cell = Row.Get_Cell(CurCell);
						if (vmerge_Continue === Cell.GetVMerge())
							continue;

						var StartGridCol    = this.Content[CurRow].Get_CellInfo(CurCell).StartGridCol;
						var GridSpan        = this.Content[CurRow].Get_Cell(CurCell).Get_GridSpan();
						var TempCells_array = this.private_GetCellsPosArrayByCellsArray(this.private_GetMergedCells(CurRow, StartGridCol, GridSpan));

						Cells_array = Cells_array.concat(TempCells_array);
					}
				}
			}
			else
			{
				var RowIndex     = this.CurCell.Row.Index;
				var CellIndex    = this.CurCell.Index;
				var StartGridCol = this.Content[RowIndex].Get_CellInfo(CellIndex).StartGridCol;
				var GridSpan     = this.Content[RowIndex].Get_Cell(CellIndex).Get_GridSpan();
				Cells_array      = this.private_GetCellsPosArrayByCellsArray(this.private_GetMergedCells(RowIndex, StartGridCol, GridSpan));
			}
		}
		else
		{
			if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
			{
				Cells_array = [];
				for (var Index = 0, Count = this.Selection.Data.length; Index < Count; Index++)
				{
					var RowIndex  = this.Selection.Data[Index].Row;
					var CellIndex = this.Selection.Data[Index].Cell;

					var StartGridCol    = this.Content[RowIndex].Get_CellInfo(CellIndex).StartGridCol;
					var GridSpan        = this.Content[RowIndex].Get_Cell(CellIndex).Get_GridSpan();
					var TempCells_array = this.private_GetCellsPosArrayByCellsArray(this.private_GetMergedCells(RowIndex, StartGridCol, GridSpan));
					Cells_array         = Cells_array.concat(TempCells_array);
				}
			}
			else
			{
				var RowIndex     = this.CurCell.Row.Index;
				var CellIndex    = this.CurCell.Index;
				var StartGridCol = this.Content[RowIndex].Get_CellInfo(CellIndex).StartGridCol;
				var GridSpan     = this.Content[RowIndex].Get_Cell(CellIndex).Get_GridSpan();
				Cells_array      = this.private_GetCellsPosArrayByCellsArray(this.private_GetMergedCells(RowIndex, StartGridCol, GridSpan));
			}
		}

		//if ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type )
		//    Cells_array = this.Selection.Data;
		//else
		//{
		//    // TODO: Если данная ячейка имеет вертикальное объединение, тогда нам надо добавить
		//    //       все ячейки в него попадающие
		//    Cells_array = [ { Row : this.CurCell.Row.Index, Cell : this.CurCell.Index } ];
		//}

		var Pos_first = Cells_array[0];
		var Pos_last  = Cells_array[Cells_array.length - 1];
		var Row_first = Pos_first.Row;
		var Row_last  = Pos_last.Row;

		var bBorder_top     = ( false === this.Internal_CheckNullBorder(Props.CellBorders.Top) ? true : false );
		var bBorder_bottom  = ( false === this.Internal_CheckNullBorder(Props.CellBorders.Bottom) ? true : false );
		var bBorder_left    = ( false === this.Internal_CheckNullBorder(Props.CellBorders.Left) ? true : false );
		var bBorder_right   = ( false === this.Internal_CheckNullBorder(Props.CellBorders.Right) ? true : false );
		var bBorder_insideh = ( false === this.Internal_CheckNullBorder(Props.CellBorders.InsideH) ? true : false );
		var bBorder_insidev = ( false === this.Internal_CheckNullBorder(Props.CellBorders.InsideV) ? true : false );

		if (true != bSpacing)
		{
			// Узначем GridCol начала и конца первой и последней строк
			var Grid_row_first_start = 0, Grid_row_first_end = 0, Grid_row_last_start = 0, Grid_row_last_end = 0;
			var Pos                  = {Row : 0, Cell : 0};

			var CurRow           = Row_first;
			var Index            = 0;
			Grid_row_first_start = this.Content[Pos_first.Row].Get_CellInfo(Pos_first.Cell).StartGridCol;
			while (Index < Cells_array.length)
			{
				Pos = Cells_array[Index];
				if (Pos.Row != Row_first)
					break;

				var Row  = this.Content[Pos.Row];
				var Cell = Row.Get_Cell(Pos.Cell);

				Grid_row_first_end = Row.Get_CellInfo(Pos.Cell).StartGridCol + Cell.Get_GridSpan() - 1;
				Index++;
			}

			Index = 0;
			while (Index < Cells_array.length)
			{
				Pos = Cells_array[Index];
				if (Pos.Row === Row_last)
					break;

				Index++;
			}

			Grid_row_last_start = this.Content[Pos.Row].Get_CellInfo(Pos.Cell).StartGridCol;
			Grid_row_last_end   = this.Content[Pos_last.Row].Get_CellInfo(Pos_last.Cell).StartGridCol + this.Content[Pos_last.Row].Get_Cell(Pos_last.Cell).Get_GridSpan() - 1;

			if (Row_first > 0 && true === bBorder_top)
			{
				var Cell_start = 0, Cell_end = 0;
				var bStart     = false;
				var bEnd       = false;

				var Row = this.Content[Row_first - 1];
				for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
				{
					var StartGridCol = Row.Get_CellInfo(CurCell).StartGridCol;
					var EndGridCol   = StartGridCol + Row.Get_Cell(CurCell).Get_GridSpan() - 1;

					if (false === bStart)
					{
						if (StartGridCol < Grid_row_first_start)
							continue;
						else if (StartGridCol > Grid_row_first_start)
							break;
						else //if ( StartGridCol === Grid_row_first_start )
						{
							Cell_start = CurCell;
							bStart     = true;

							if (EndGridCol < Grid_row_first_end)
								continue;
							else if (EndGridCol > Grid_row_first_end)
								break;
							else
							{
								Cell_end = CurCell;
								bEnd     = true;
								break;
							}
						}
					}

					if (false === bEnd)
					{
						if (EndGridCol < Grid_row_first_end)
							continue;
						else if (EndGridCol > Grid_row_first_end)
							break;
						else //if ( EndGridCol === Grid_row_first_end )
						{
							Cell_end = CurCell;
							bEnd     = true;
							break;
						}
					}
				}

				if (true === bStart && true === bEnd)
				{
					for (var CurCell = Cell_start; CurCell <= Cell_end; CurCell++)
					{
						var Cell = Row.Get_Cell(CurCell);
						Cell.Set_Border(Props.CellBorders.Top, 2);
					}
					bRecalc_All = true;
				}
			}

			if (Row_last < this.Content.length - 1 && true === bBorder_bottom)
			{
				var Cell_start = 0, Cell_end = 0;
				var bStart     = false;
				var bEnd       = false;

				var Row = this.Content[Row_last + 1];
				for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
				{
					var StartGridCol = Row.Get_CellInfo(CurCell).StartGridCol;
					var EndGridCol   = StartGridCol + Row.Get_Cell(CurCell).Get_GridSpan() - 1;

					if (false === bStart)
					{
						if (StartGridCol < Grid_row_last_start)
							continue;
						else if (StartGridCol > Grid_row_last_start)
							break;
						else //if ( StartGridCol === Grid_row_last_start )
						{
							Cell_start = CurCell;
							bStart     = true;

							if (EndGridCol < Grid_row_last_end)
								continue;
							else if (EndGridCol > Grid_row_last_end)
								break;
							else
							{
								Cell_end = CurCell;
								bEnd     = true;
								break;
							}
						}
					}

					if (false === bEnd)
					{
						if (EndGridCol < Grid_row_last_end)
							continue;
						else if (EndGridCol > Grid_row_last_end)
							break;
						else //if ( EndGridCol === Grid_row_last_end )
						{
							Cell_end = CurCell;
							bEnd     = true;
							break;
						}
					}
				}

				if (true === bStart && true === bEnd)
				{
					for (var CurCell = Cell_start; CurCell <= Cell_end; CurCell++)
					{
						var Cell = Row.Get_Cell(CurCell);
						Cell.Set_Border(Props.CellBorders.Bottom, 0);
					}
					bRecalc_All = true;
				}
			}
		}

		var PrevRow    = Row_first;
		var Cell_start = Pos_first.Cell, Cell_end = Pos_first.Cell;
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos = Cells_array[Index];
			Row     = this.Content[Pos.Row];
			Cell    = Row.Get_Cell(Pos.Cell);

			if (PrevRow != Pos.Row)
			{
				var Row_temp = this.Content[PrevRow];

				if (true != bSpacing && Cell_start > 0 && true === bBorder_left)
				{
					Row_temp.Get_Cell(Cell_start - 1).Set_Border(Props.CellBorders.Left, 1);
					bRecalc_All = true;
				}

				if (true != bSpacing && Cell_end < Row_temp.Get_CellsCount() - 1 && true === bBorder_right)
				{
					Row_temp.Get_Cell(Cell_end + 1).Set_Border(Props.CellBorders.Right, 3);
					bRecalc_All = true;
				}

				for (var CurCell = Cell_start; CurCell <= Cell_end; CurCell++)
				{
					var Cell_temp = Row_temp.Get_Cell(CurCell);

					if (Row_first === PrevRow && true === bBorder_top)
					{
						Cell_temp.Set_Border(Props.CellBorders.Top, 0);
						bRecalc_All = true;
					}
					else if (Row_first != PrevRow && true === bBorder_insideh)
					{
						Cell_temp.Set_Border(Props.CellBorders.InsideH, 0);
						bRecalc_All = true;
					}

					if (Row_last === PrevRow && true === bBorder_bottom)
					{
						Cell_temp.Set_Border(Props.CellBorders.Bottom, 2);
						bRecalc_All = true;
					}
					else if (Row_last != PrevRow && true === bBorder_insideh)
					{
						Cell_temp.Set_Border(Props.CellBorders.InsideH, 2);
						bRecalc_All = true;
					}

					if (CurCell === Cell_start && true === bBorder_left)
					{
						Cell_temp.Set_Border(Props.CellBorders.Left, 3);
						bRecalc_All = true;
					}
					else if (CurCell != Cell_start && true === bBorder_insidev)
					{
						Cell_temp.Set_Border(Props.CellBorders.InsideV, 3);
						bRecalc_All = true;
					}

					if (CurCell === Cell_end && true === bBorder_right)
					{
						Cell_temp.Set_Border(Props.CellBorders.Right, 1);
						bRecalc_All = true;
					}
					else if (CurCell != Cell_end && true === bBorder_insidev)
					{
						Cell_temp.Set_Border(Props.CellBorders.InsideV, 1);
						bRecalc_All = true;
					}
				}

				Cell_start = Pos.Cell;
				Cell_end   = Pos.Cell;
				PrevRow    = Pos.Row;
			}
			else
				Cell_end = Pos.Cell;


			if (Cells_array.length - 1 === Index)
			{
				var Row_temp = this.Content[PrevRow];
				if (true != bSpacing && Cell_start > 0 && true === bBorder_left)
				{
					Row_temp.Get_Cell(Cell_start - 1).Set_Border(Props.CellBorders.Left, 1);
					bRecalc_All = true;
				}

				if (true != bSpacing && Cell_end < Row_temp.Get_CellsCount() - 1 && true === bBorder_right)
				{
					Row_temp.Get_Cell(Cell_end + 1).Set_Border(Props.CellBorders.Right, 3);
					bRecalc_All = true;
				}

				for (var CurCell = Cell_start; CurCell <= Cell_end; CurCell++)
				{
					var Cell_temp = Row_temp.Get_Cell(CurCell);

					if (Row_first === Pos.Row && true === bBorder_top)
					{
						Cell_temp.Set_Border(Props.CellBorders.Top, 0);
						bRecalc_All = true;
					}
					else if (Row_first != Pos.Row && true === bBorder_insideh)
					{
						Cell_temp.Set_Border(Props.CellBorders.InsideH, 0);
						bRecalc_All = true;
					}

					if (Row_last === Pos.Row && true === bBorder_bottom)
					{
						Cell_temp.Set_Border(Props.CellBorders.Bottom, 2);
						bRecalc_All = true;
					}
					else if (Row_last != Pos.Row && true === bBorder_insideh)
					{
						Cell_temp.Set_Border(Props.CellBorders.InsideH, 2);
						bRecalc_All = true;
					}

					if (CurCell === Cell_start && true === bBorder_left)
					{
						Cell_temp.Set_Border(Props.CellBorders.Left, 3);
						bRecalc_All = true;
					}
					else if (CurCell != Cell_start && true === bBorder_insidev)
					{
						Cell_temp.Set_Border(Props.CellBorders.InsideV, 3);
						bRecalc_All = true;
					}

					if (CurCell === Cell_end && true === bBorder_right)
					{
						Cell_temp.Set_Border(Props.CellBorders.Right, 1);
						bRecalc_All = true;
					}
					else if (CurCell != Cell_end && true === bBorder_insidev)
					{
						Cell_temp.Set_Border(Props.CellBorders.InsideV, 1);
						bRecalc_All = true;
					}
				}
			}
		}
	}

	// TableBackground  (заливка таблицы)
	if (undefined !== Props.TableBackground)
	{
		if (Props.TableBackground.Value != TablePr.Shd.Value || Props.TableBackground.Color.r != TablePr.Shd.Color.r || Props.TableBackground.Color.g != TablePr.Shd.Color.g || Props.TableBackground.Color.b != TablePr.Shd.Color.b)
		{
			this.Set_TableShd(Props.TableBackground.Value, Props.TableBackground.Color.r, Props.TableBackground.Color.g, Props.TableBackground.Color.b);

			for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
			{
				var oRow = this.GetRow(nCurRow);
				for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
				{
					var oCell = oRow.GetCell(nCurCell);
					oCell.Set_Shd({
						Value : Props.TableBackground.Value,
						Color : {
							r : Props.TableBackground.Color.r,
							g : Props.TableBackground.Color.g,
							b : Props.TableBackground.Color.b
						}
					});
				}
			}
		}
	}

	// CellsBackground (заливка ячеек)
	if ("undefined" != typeof(Props.CellsBackground) && null != Props.CellsBackground)
	{
		if (false === Props.CellSelect && true === bSpacing)
		{
			for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
			{
				var Row = this.Content[CurRow];
				for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
				{
					var Cell   = Row.Get_Cell(CurCell);
					var NewShd =
							{
								Value : Props.CellsBackground.Value,
								Color : {
									r : Props.CellsBackground.Color.r,
									g : Props.CellsBackground.Color.g,
									b : Props.CellsBackground.Color.b
								},

								Unifill : Props.CellsBackground.Unifill.createDuplicate()
							};

					Cell.Set_Shd(NewShd);

					bRedraw = true;
				}
			}
		}
		else if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		{
			for (var Index = 0; Index < this.Selection.Data.length; Index++)
			{
				var Pos      = this.Selection.Data[Index];
				var Cell     = this.Content[Pos.Row].Get_Cell(Pos.Cell);
				var Cell_shd = Cell.Get_Shd();

				if (Props.CellsBackground.Value != Cell_shd.Value || Props.CellsBackground.Color.r != Cell_shd.Color.r || Props.CellsBackground.Color.g != Cell_shd.Color.g || Props.CellsBackground.Color.b != Cell_shd.Color.b || !AscFormat.CompareUnifillBool(Props.CellsBackground.Unifill, Cell_shd.Unifill))
				{
					var NewShd =
							{
								Value : Props.CellsBackground.Value,
								Color : {
									r : Props.CellsBackground.Color.r,
									g : Props.CellsBackground.Color.g,
									b : Props.CellsBackground.Color.b
								},

								Unifill : Props.CellsBackground.Unifill.createDuplicate()
							};

					Cell.Set_Shd(NewShd);

					bRedraw = true;
				}
			}
		}
		else
		{
			var Cell     = this.CurCell;
			var Cell_shd = Cell.Get_Shd();

			if (Props.CellsBackground.Value != Cell_shd.Value || Props.CellsBackground.Color.r != Cell_shd.Color.r || Props.CellsBackground.Color.g != Cell_shd.Color.g || Props.CellsBackground.Color.b != Cell_shd.Color.b || !AscFormat.CompareUnifillBool(Props.CellsBackground.Unifill, Cell_shd.Unifill))
			{
				var NewShd =
						{
							Value : Props.CellsBackground.Value,
							Color : {
								r : Props.CellsBackground.Color.r,
								g : Props.CellsBackground.Color.g,
								b : Props.CellsBackground.Color.b
							},

							Unifill : Props.CellsBackground.Unifill.createDuplicate()
						};

				Cell.Set_Shd(NewShd);

				bRedraw = true;
			}
		}
	}

	// CellsVAlign (вертикальное выравнивание ячеек)
	if (undefined != Props.CellsVAlign && null != Props.CellsVAlign)
	{
		if (this.Selection.Use === true && table_Selection_Cell === this.Selection.Type)
		{
			var Count = this.Selection.Data.length;
			for (var Index = 0; Index < Count; Index++)
			{
				var Pos  = this.Selection.Data[Index];
				var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
				Cell.Set_VAlign(Props.CellsVAlign);
			}
		}
		else
		{
			this.CurCell.Set_VAlign(Props.CellsVAlign);
		}

		bRecalc_All = true;
	}

	// CellsTextDirection
	if (undefined !== Props.CellsTextDirection && null !== Props.CellsTextDirection)
	{
		var TextDirection = undefined;
		switch (Props.CellsTextDirection)
		{
			case c_oAscCellTextDirection.LRTB:
				TextDirection = textdirection_LRTB;
				break;
			case c_oAscCellTextDirection.TBRL:
				TextDirection = textdirection_TBRL;
				break;
			case c_oAscCellTextDirection.BTLR:
				TextDirection = textdirection_BTLR;
				break;
		}

		if (undefined !== TextDirection)
		{
			if (this.Selection.Use === true && table_Selection_Cell === this.Selection.Type)
			{
				var Count = this.Selection.Data.length;
				for (var Index = 0; Index < Count; ++Index)
				{
					var Pos  = this.Selection.Data[Index];
					var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
					Cell.Set_TextDirectionFromApi(TextDirection);
				}
			}
			else
			{
				this.CurCell.Set_TextDirectionFromApi(TextDirection);
			}
		}
	}

	// CellsNoWrap
	if (undefined !== Props.CellsNoWrap && null !== Props.CellsNoWrap)
	{
		if (this.Selection.Use === true && table_Selection_Cell === this.Selection.Type)
		{
			var Count = this.Selection.Data.length;
			for (var Index = 0; Index < Count; ++Index)
			{
				var Pos  = this.Selection.Data[Index];
				var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
				Cell.SetNoWrap(Props.CellsNoWrap);
			}
		}
		else
		{
			this.CurCell.SetNoWrap(Props.CellsNoWrap);
		}
	}

	// CellsWidth
	if (undefined !== Props.CellsWidth)
	{
		var CellsWidth = Props.CellsWidth;
		if (null !== CellsWidth && Math.abs(CellsWidth) < 0.001)
			CellsWidth = null;

		if (this.Selection.Use === true && table_Selection_Cell === this.Selection.Type)
		{
			var Count = this.Selection.Data.length;
			for (var Index = 0; Index < Count; ++Index)
			{
				var Pos  = this.Selection.Data[Index];
				var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);

				if (null === CellsWidth)
					Cell.Set_W(new CTableMeasurement(tblwidth_Auto, 0));
				else if (CellsWidth > -0.001)
					Cell.Set_W(new CTableMeasurement(tblwidth_Mm, CellsWidth));
				else
					Cell.Set_W(new CTableMeasurement(tblwidth_Pct, Math.abs(CellsWidth)));
			}
		}
		else
		{
			if (null === CellsWidth)
				this.CurCell.Set_W(new CTableMeasurement(tblwidth_Auto, 0));
			else if (CellsWidth > -0.001)
				this.CurCell.Set_W(new CTableMeasurement(tblwidth_Mm, CellsWidth));
			else
				this.CurCell.Set_W(new CTableMeasurement(tblwidth_Pct, Math.abs(CellsWidth)));
		}
	}

	// TableDescription
	if (undefined !== Props.TableDescription && null !== Props.TableDescription)
	{
		this.Set_TableDescription(Props.TableDescription);
	}

	// TableCaption
	if (undefined !== Props.TableCaption && null !== Props.TableCaption)
	{
		this.Set_TableCaption(Props.TableCaption);
	}

	if (undefined !== Props.RowHeight)
		this.SetRowHeight(Props.RowHeight);

	if (undefined !== Props.ColumnWidth)
		this.SetColumnWidth(Props.ColumnWidth);

	return true;
};
CTable.prototype.Get_Styles = function(Lvl)
{
	return this.Parent.Get_Styles(Lvl);
};
CTable.prototype.Get_TextBackGroundColor = function()
{
	// Сначала проверим заливку данной таблицы, если ее нет, тогда спрашиваем у родительского класса
	var Shd = this.Get_Shd();

	if (Asc.c_oAscShdNil !== Shd.Value)
		return Shd.Get_Color2(this.Get_Theme(), this.Get_ColorMap());

	return this.Parent.Get_TextBackGroundColor();
};
CTable.prototype.Get_Numbering = function()
{
	return this.Parent.Get_Numbering();
};
CTable.prototype.Get_PageBounds = function(CurPage)
{
	return this.Pages[CurPage].Bounds;
};
CTable.prototype.GetPageBounds = function(nCurPage)
{
	return this.Get_PageBounds(nCurPage);
};
CTable.prototype.GetContentBounds = function(CurPage)
{
	return this.Get_PageBounds(CurPage);
};
CTable.prototype.Get_PagesCount = function()
{
	return this.Pages.length;
};
CTable.prototype.GetAllDrawingObjects = function(DrawingObjs)
{
	if (undefined === DrawingObjs)
		DrawingObjs = [];

	var Rows_Count = this.Content.length;
	for (var CurRow = 0; CurRow < Rows_Count; CurRow++)
	{
		var Row         = this.Content[CurRow];
		var Cells_Count = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			Cell.Content.GetAllDrawingObjects(DrawingObjs);
		}
	}

	return DrawingObjs;
};
CTable.prototype.GetAllComments = function(AllComments)
{
	if (undefined === AllComments)
		AllComments = [];

	var Rows_Count = this.Content.length;
	for (var CurRow = 0; CurRow < Rows_Count; CurRow++)
	{
		var Row         = this.Content[CurRow];
		var Cells_Count = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			Cell.Content.GetAllComments(AllComments);
		}
	}

	return AllComments;
};
CTable.prototype.GetAllMaths = function(AllMaths)
{
	if (undefined === AllMaths)
		AllMaths = [];

	var Rows_Count = this.Content.length;
	for (var CurRow = 0; CurRow < Rows_Count; CurRow++)
	{
		var Row         = this.Content[CurRow];
		var Cells_Count = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			Cell.Content.GetAllMaths(AllMaths);
		}
	}

	return AllMaths;
};
CTable.prototype.GetAllFloatElements = function(FloatObjs)
{
	if (undefined === FloatObjs)
		FloatObjs = [];

	var Rows_Count = this.Content.length;
	for (var CurRow = 0; CurRow < Rows_Count; CurRow++)
	{
		var Row         = this.Content[CurRow];
		var Cells_Count = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			Cell.Content.GetAllFloatElements(FloatObjs);
		}
	}

	return FloatObjs;
};
CTable.prototype.GetAllFields = function(isSelection, arrFields)
{
	if (!arrFields)
		arrFields = [];

	if (isSelection && this.IsCellSelection())
	{
		var arrCellsArray = this.GetSelectionArray();
		for (var nPos = 0, nCount = arrCellsArray.length; nPos < nCount; ++nPos)
		{
			var oCellPos     = arrCellsArray[nPos];
			var oCurCell     = this.GetRow(oCellPos.Row).GetCell(oCellPos.Cell);
			var oCellContent = oCurCell.GetContent();

			oCellContent.SelectAll();
			oCellContent.GetAllFields(true, arrFields);
			oCellContent.RemoveSelection();
		}
	}
	else
	{
		this.CurCell.Content.GetAllFields(isSelection, arrFields);
	}

	return arrFields;
};
CTable.prototype.IsTableCellSelection = function()
{
	if (this.IsInnerTable())
		return this.CurCell.GetContent().IsTableCellSelection();

	return this.IsCellSelection();
};
CTable.prototype.GetAllSeqFieldsByType = function(sType, aFields)
{
	var aRows = this.Content;
	for(var i = 0; i < aRows.length; ++i)
	{
		var aCells = aRows[i].Content;
		for(var j = 0; j < aCells.length; ++j)
		{
			var oCell = aCells[j];
			oCell.Content.GetAllSeqFieldsByType(sType, aFields);
		}
	}
};
/**
 * Данная функция запрашивает новую позицию для содержимого у ячейки, разбивающейся на несколько страниц
 */
CTable.prototype.Get_PageContentStartPos = function(CurPage, RowIndex, CellIndex)
{
	var Row      = this.Content[RowIndex];
	var Cell     = Row.Get_Cell(CellIndex);
	var CellMar  = Cell.GetMargins();
	var CellInfo = Row.Get_CellInfo(CellIndex);

	var VMerge_count = this.Internal_GetVertMergeCount(RowIndex, CellInfo.StartGridCol, Cell.Get_GridSpan());

	// Возможно первая ячейка, для которой мы рассчитваем перенос на следующую страницу
	// имеет вертикальное объединение. Поэтому строка, по которой идет перенос не RowIndex,
	// а последняя строка в объединении.
	RowIndex = RowIndex + VMerge_count - 1;
	Row      = this.Content[RowIndex];

	var Pos = this.Parent.Get_PageContentStartPos2(this.PageNum, this.ColumnNum, CurPage, this.Index);

	// На момент обращения к данной функции, у всех ячеек всех строк до текущей (включительно) должны быть
	// просчитаны верхние границы. И также должен быть просчитан заголовок на данной странице, если он есть.

	var bHeader = false;
	var Y       = Pos.Y;
	if (true !== this.HeaderInfo.HeaderRecalculate && -1 != this.HeaderInfo.PageIndex && this.HeaderInfo.Count > 0 && CurPage > this.HeaderInfo.PageIndex && true === this.HeaderInfo.Pages[CurPage].Draw)
	{
		Y       = this.HeaderInfo.Pages[CurPage].RowsInfo[this.HeaderInfo.Count - 1].TableRowsBottom;
		bHeader = true;
	}

	var CellSpacing = Row.Get_CellSpacing();
	if (null != CellSpacing)
	{
		var Table_Border_Top = this.Get_Borders().Top;
		if (border_Single === Table_Border_Top.Value)
			Y += Table_Border_Top.Size;

		if (true === bHeader || 0 === CurPage || ( 1 === CurPage && true != this.RowsInfo[0].FirstPage ))
			Y += CellSpacing;
		else
			Y += CellSpacing / 2;
	}

	// Далее вычислим маскимальную ширину верхней границы всех ячеек в данной
	// строке, учитывая ячейки, учавствующие в вертикальном объединении.

	var MaxTopBorder = 0;
	var CellsCount   = Row.Get_CellsCount();
	var TableBorders = this.Get_Borders();
	for (var CurCell = 0; CurCell < CellsCount; CurCell++)
	{
		var Cell   = Row.Get_Cell(CurCell);
		var VMerge = Cell.GetVMerge();

		if (vmerge_Continue === VMerge)
			Cell = this.Internal_Get_StartMergedCell(RowIndex, Row.Get_CellInfo(CurCell).StartGridCol, Cell.Get_GridSpan());

		var BorderInfo_Top = Cell.Get_BorderInfo().Top;
		if (null === BorderInfo_Top)
			continue;

		for (var Index = 0; Index < BorderInfo_Top.length; Index++)
		{
			var CurBorder = BorderInfo_Top[Index];

			var ResultBorder = this.Internal_CompareBorders(CurBorder, TableBorders.Top, false, true);

			if (border_Single === ResultBorder.Value && MaxTopBorder < ResultBorder.Size)
				MaxTopBorder = ResultBorder.Size;
		}
	}

	Pos.X = this.Pages[CurPage].X;

	Y += MaxTopBorder;

	// Учтем верхнее поле ячейки
	Y += CellMar.Top.W;

	var YLimit = Pos.YLimit;

	YLimit -= this.Pages[CurPage].FootnotesH;

	// TODO: Здесь надо учитывать нижнюю границу ячейки и вычесть ее ширину из YLimit
	return {X        : Pos.X + CellInfo.X_content_start,
		XLimit       : Pos.X + CellInfo.X_content_end,
		Y            : Y,
		YLimit       : YLimit,
		MaxTopBorder : MaxTopBorder
	};
};
CTable.prototype.Get_MaxTopBorder = function(RowIndex)
{
	// Вычислим маскимальную ширину верхней границы всех ячеек в данной
	// строке, учитывая ячейки, учавствующие в вертикальном объединении.

	var Row = this.Content[RowIndex];

	var MaxTopBorder = 0;
	var CellsCount   = Row.Get_CellsCount();
	var TableBorders = this.Get_Borders();
	for (var CurCell = 0; CurCell < CellsCount; CurCell++)
	{
		var Cell   = Row.Get_Cell(CurCell);
		var VMerge = Cell.GetVMerge();

		if (vmerge_Continue === VMerge)
			Cell = this.Internal_Get_StartMergedCell(RowIndex, Row.Get_CellInfo(CurCell).StartGridCol, Cell.Get_GridSpan());

		var BorderInfo_Top = Cell.Get_BorderInfo().Top;
		if (null === BorderInfo_Top)
			continue;

		for (var Index = 0; Index < BorderInfo_Top.length; Index++)
		{
			var CurBorder = BorderInfo_Top[Index];

			var ResultBorder = this.Internal_CompareBorders(CurBorder, TableBorders.Top, false, true);

			if (border_Single === ResultBorder.Value && MaxTopBorder < ResultBorder.Size)
				MaxTopBorder = ResultBorder.Size;
		}
	}

	return MaxTopBorder;
};
/**
 * Вычисляем небольшое смещение по X, необходимое для совместимости с Word разных версий
 */
CTable.prototype.GetTableOffsetCorrection = function()
{
	var X = 0;

	if (true === this.Parent.IsTableCellContent()
		|| this.bPresentation
		|| !this.LogicDocument
		|| this.LogicDocument.GetCompatibilityMode() >= document_compatibility_mode_Word15)
		return 0;

	var Row     = this.Content[0];
	var Cell    = Row.Get_Cell(0);
	var Margins = Cell.GetMargins();

	var CellSpacing = Row.Get_CellSpacing();
	if (null != CellSpacing)
	{
		var TableBorder_Left = this.Get_Borders().Left;
		if (border_None != TableBorder_Left.Value)
			X += TableBorder_Left.Size / 2;

		X += CellSpacing;

		var CellBorder_Left = Cell.Get_Borders().Left;
		if (border_None != CellBorder_Left.Value)
			X += CellBorder_Left.Size;

		X += Margins.Left.W;
	}
	else
	{
		var TableBorder_Left = this.Get_Borders().Left;
		var CellBorder_Left  = Cell.Get_Borders().Left;
		var Result_Border    = this.Internal_CompareBorders(TableBorder_Left, CellBorder_Left, true, false);

		if (border_None != Result_Border.Value)
			X += Math.max(Result_Border.Size / 2, Margins.Left.W);
		else
			X += Margins.Left.W;
	}

	return -X;
};
CTable.prototype.GetRightTableOffsetCorrection = function()
{
	var X = 0;

	if (true === this.Parent.IsTableCellContent()
		|| this.bPresentation
		|| !this.LogicDocument
		|| this.LogicDocument.GetCompatibilityMode() >= document_compatibility_mode_Word15)
		return 0;

	var Row         = this.Content[0];
	var Cell        = Row.Get_Cell(Row.Get_CellsCount() - 1);
	var Margins     = Cell.GetMargins();
	var CellSpacing = Row.Get_CellSpacing();
	if (null != CellSpacing)
	{
		var TableBorder_Right = this.Get_Borders().Right;
		if (border_None != TableBorder_Right.Value)
			X += TableBorder_Right.Size / 2;

		X += CellSpacing;

		var CellBorder_Right = Cell.Get_Borders().Right;
		if (border_None != CellBorder_Right.Value)
			X += CellBorder_Right.Size;

		X += Margins.Right.W;
	}
	else
	{
		var TableBorder_Right = this.Get_Borders().Right;
		var CellBorder_Right  = Cell.Get_Borders().Right;
		var Result_Border     = this.Internal_CompareBorders(TableBorder_Right, CellBorder_Right, true, false);

		if (border_None != Result_Border.Value)
			X += Math.max(Result_Border.Size / 2, Margins.Right.W);
		else
			X += Margins.Right.W;
	}

	return X;
};
/**
 * Получаем первый параграф первой ячейки. (Нужно, например, для контроля ContextualSpacing)
 */
CTable.prototype.Get_FirstParagraph = function()
{
	if (this.Content.length <= 0 || this.Content[0].Content.length <= 0)
		return null;

	return this.Content[0].Content[0].Content.Get_FirstParagraph();
};
CTable.prototype.GetAllParagraphs = function(Props, ParaArray)
{
	var Count = this.Content.length;
	for (var CurRow = 0; CurRow < Count; CurRow++)
	{
		var Row         = this.Content[CurRow];
		var Cells_Count = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			Cell.Content.GetAllParagraphs(Props, ParaArray);
		}
	}
};
CTable.prototype.GetEndInfo = function()
{
	var RowsCount = this.Content.length;
	if (RowsCount > 0)
		return this.Content[RowsCount - 1].GetEndInfo();

	return null;
};
CTable.prototype.GetPrevElementEndInfo = function(RowIndex)
{
	if (0 === RowIndex)
		return this.Parent.GetPrevElementEndInfo(this);
	else
		return this.Content[RowIndex - 1].GetEndInfo();
};
//----------------------------------------------------------------------------------------------------------------------
// Функции к которым идет обращение из родительского класса
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.Copy = function(Parent, DrawingDocument, oPr)
{
	var TableGrid = this.private_CopyTableGrid();
	var Table     = new CTable(this.DrawingDocument, Parent, this.Inline, 0, 0, TableGrid, this.bPresentation);

	Table.Set_Distance(this.Distance.L, this.Distance.T, this.Distance.R, this.Distance.B);
	Table.Set_PositionH(this.PositionH.RelativeFrom, this.PositionH.Align, this.PositionH.Value);
	Table.Set_PositionV(this.PositionV.RelativeFrom, this.PositionV.Align, this.PositionV.Value);

	// Копируем настройки
	var sStyle = this.TableStyle;
	if(oPr && oPr.Comparison)
	{
		sStyle = oPr.Comparison.copyStyleById(sStyle);
	}
	Table.Set_TableStyle(sStyle);
	Table.Set_TableLook(this.TableLook.Copy());
	Table.SetPr(this.Pr.Copy());

	Table.Rows = this.Rows;
	Table.Cols = this.Cols;

	// Копируем строки
	var Rows = this.Content.length;
	var Index;
	for (Index = 0; Index < Rows; Index++)
	{
		Table.Content[Index] = this.Content[Index].Copy(Table, oPr);
		History.Add(new CChangesTableAddRow(Table, Index, [Table.Content[Index]]));
	}
	Table.Internal_ReIndexing(0);

	if (Table.Content.length > 0 && Table.Content[0].Get_CellsCount() > 0)
		Table.CurCell = Table.Content[0].Get_Cell(0);

	return Table;
};
CTable.prototype.Shift = function(CurPage, Dx, Dy)
{
	this.Pages[CurPage].Shift(Dx, Dy);

	if (0 === CurPage)
	{
		this.X_origin += Dx;
		this.X += Dx;
		this.Y += Dy;
		this.XLimit += Dx;
		this.YLimit += Dy;
	}

	var StartRow = this.Pages[CurPage].FirstRow;
	var LastRow  = this.Pages[CurPage].LastRow;
	for (var CurRow = StartRow; CurRow <= LastRow; CurRow++)
	{
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell          = Row.Get_Cell(CurCell);
			var CellPageIndex = CurPage - Cell.Content.Get_StartPage_Relative();
			if (vmerge_Restart === Cell.GetVMerge())
			{
				Cell.Content_Shift(CellPageIndex, Dx, Dy);
			}
		}

		this.RowsInfo[CurRow].Y[CurPage] += Dy;
		this.TableRowsBottom[CurRow][CurPage] += Dy;
	}
};
CTable.prototype.UpdateEndInfo = function()
{
	for (var RowIndex = 0, RowsCount = this.Content.length; RowIndex < RowsCount; RowIndex++)
	{
		var Row = this.Content[RowIndex];
		for (var CellIndex = 0, CellsCount = Row.Get_CellsCount(); CellIndex < CellsCount; CellIndex++)
		{
			var Cell = Row.Get_Cell(CellIndex);
			Cell.Content.UpdateEndInfo();
		}
	}
};
CTable.prototype.Internal_UpdateFlowPosition = function(X, Y)
{
	this.X_origin = X;
	var Dx        = this.GetTableOffsetCorrection();

	this.X = X + Dx;
	this.Y = Y;

	this.Set_PositionH(c_oAscHAnchor.Page, false, this.X_origin);
	this.Set_PositionV(c_oAscVAnchor.Page, false, this.Y);
};
CTable.prototype.Move = function(X, Y, PageNum, NearestPos)
{
	var oLogicDocument = editor.WordControl.m_oLogicDocument;

	this.Document_SetThisElementCurrent(false);
	this.MoveCursorToStartPos();

	var oTargetTable = this;
	if (true != this.Is_Inline())
	{
		if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Table_Properties, null, true))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_MoveFlowTable);

			// Переносим привязку (если получается, что заносим таблицу саму в себя, тогда привязку не меняем)
			var NewDocContent = NearestPos.Paragraph.Parent;
			var OldDocContent = this.Parent;

			var oPageLimits;
			if (true != NewDocContent.CheckTableCoincidence(this))
			{
				var OldIndex = this.Index;
				var NewIndex = NearestPos.Paragraph.Index;

				// Проверим можем ли мы добавить таблицу перед параграфом так, чтобы таблица осталась на данной странице
				if (PageNum > NearestPos.Paragraph.Get_StartPage_Absolute())
				{
					if (NearestPos.Paragraph.Pages.length > 2)
					{
						// Параграф начинается до заданной страницы и заканчивается после. Нам нужно разделить его на
						// 2 параграфа в заданной точке.

						var NewParagraph = new Paragraph(NewDocContent.DrawingDocument, NewDocContent);
						NearestPos.Paragraph.Split(NewParagraph, NearestPos.ContentPos);
						NewDocContent.Internal_Content_Add(NewIndex + 1, NewParagraph);

						// Если все происходило в одном классе-документе, тогда проверяем индексы
						if (NewDocContent === OldDocContent && NewIndex + 1 <= OldIndex)
							OldIndex++;

						NewIndex++;
					}
					else
					{
						// Вставляем таблицу после найденного параграфа. Если параграф последний, тогда
						// в конец добавляем новый пустой параграф
						NewIndex++;
						if (NewIndex >= NewDocContent.Content.length - 1)
							NewDocContent.Internal_Content_Add(NewDocContent.Content.length, new Paragraph(NewDocContent.DrawingDocument, NewDocContent));
					}

				}

				oTargetTable = AscCommon.CollaborativeEditing.Is_SingleUser() ? this : this.Copy(NewDocContent);
				if (NewDocContent != OldDocContent)
				{
					// Сначала добавляем таблицу в новый класс
					NewDocContent.Internal_Content_Add(NewIndex, oTargetTable);

					// Удаляем таблицу из родительского класса
					OldDocContent.Internal_Content_Remove(OldIndex, 1);

					oTargetTable.Parent = NewDocContent;
				}
				else
				{
					if (NearestPos.Paragraph.Index > this.Index)
					{
						NewDocContent.Internal_Content_Add(NewIndex, oTargetTable);
						OldDocContent.Internal_Content_Remove(OldIndex, 1);
					}
					else
					{
						OldDocContent.Internal_Content_Remove(OldIndex, 1);
						NewDocContent.Internal_Content_Add(NewIndex, oTargetTable);
					}
				}

				oPageLimits = NewDocContent.Get_PageLimits(NearestPos.Paragraph.GetRelativePage(NearestPos.Internal.Page))
			}
			else
			{
				oPageLimits = OldDocContent.Get_PageLimits(this.GetRelativePage(0))
			}

			// Обновляем координаты

			// Здесь мы должны для первого рассчета оставить привязку относительно страницы, а после рассчета
			// изменить привязку на старую, при этом пересчитав координаты так, чтобы картинка не изменила
			// своего положения.

			oTargetTable.PositionH_Old = {
				RelativeFrom : oTargetTable.PositionH.RelativeFrom,
				Align        : oTargetTable.PositionH.Align,
				Value        : oTargetTable.PositionH.Value
			};

			oTargetTable.PositionV_Old = {
				RelativeFrom : oTargetTable.PositionV.RelativeFrom,
				Align        : oTargetTable.PositionV.Align,
				Value        : oTargetTable.PositionV.Value
			};

			oTargetTable.PositionH.RelativeFrom = c_oAscHAnchor.Page;
			oTargetTable.PositionH.Align        = false;
			oTargetTable.PositionH.Value        = X - oPageLimits.X;

			oTargetTable.PositionV.RelativeFrom = c_oAscVAnchor.Page;
			oTargetTable.PositionV.Align        = false;
			oTargetTable.PositionV.Value        = Y - oPageLimits.Y;

			oTargetTable.PageNum = PageNum;

			var nTableInd = oTargetTable.Get_TableInd();
			if (Math.abs(nTableInd) > 0.001)
				oTargetTable.Set_TableInd(0);

			this.LogicDocument.Recalculate(true);

			oTargetTable.StartTrackTable();

			// Если так случилось, что после пересчета позиции не пересчитались, тогда нам нужно оставить привязку к
			// странице, чтобы таблица правильна расположилась. Такое происходит, если перемещать таблицу больше,
			// чем на 3 страницы и до пересчета успевает пройти сохранение.
			if (undefined !== oTargetTable.PositionH_Old)
			{
				// Восстанови старые значения, чтобы в историю изменений все нормально записалось
				oTargetTable.PositionH.RelativeFrom = oTargetTable.PositionH_Old.RelativeFrom;
				oTargetTable.PositionH.Align        = oTargetTable.PositionH_Old.Align;
				oTargetTable.PositionH.Value        = oTargetTable.PositionH_Old.Value;

				oTargetTable.Set_PositionH(c_oAscHAnchor.Page, false, X);
				oTargetTable.PositionH_Old = undefined;
			}

			if (undefined !== oTargetTable.PositionV_Old)
			{
				// Восстанови старые значения, чтобы в историю изменений все нормально записалось
				oTargetTable.PositionV.RelativeFrom = oTargetTable.PositionV_Old.RelativeFrom;
				oTargetTable.PositionV.Align        = oTargetTable.PositionV_Old.Align;
				oTargetTable.PositionV.Value        = oTargetTable.PositionV_Old.Value;

				oTargetTable.Set_PositionV(c_oAscVAnchor.Page, false, Y);
				oTargetTable.PositionV_Old = undefined;
			}

			oLogicDocument.FinalizeAction();
		}
	}
	else
	{
		// Проверяем, можно ли двигать данную таблицу
		if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Table_Properties, {
				Type    : AscCommon.changestype_2_InlineObjectMove,
				PageNum : PageNum,
				X       : X,
				Y       : Y
			}, true))
		{
			oLogicDocument.StartAction(AscDFH.historydescription_Document_MoveInlineTable);

			var NewDocContent = NearestPos.Paragraph.Parent;
			var OldDocContent = this.Parent;

			if (true != NewDocContent.CheckTableCoincidence(this))
			{
				var TarParagraph   = NearestPos.Paragraph;
				var ParaContentPos = NearestPos.ContentPos;

				var OldIndex = this.Index;
				var NewIndex = NearestPos.Paragraph.Index;

				// Если позиция в начале параграфа, тогда добавляем таблицу до параграфа, если в конце, тогда
				// после параграфа, в противном случае разделяем параграф.
				if (true === TarParagraph.IsCursorAtEnd(ParaContentPos))
				{
					NewIndex++;
				}
				else if (true != TarParagraph.IsCursorAtBegin(ParaContentPos))
				{
					var NewParagraph = new Paragraph(NewDocContent.DrawingDocument, NewDocContent);
					NearestPos.Paragraph.Split(NewParagraph, NearestPos.ContentPos);
					NewDocContent.Internal_Content_Add(NewIndex + 1, NewParagraph);

					// Если все происходило в одном классе-документе, тогда проверяем индексы
					if (NewDocContent === OldDocContent && NewIndex + 1 <= OldIndex)
						OldIndex++;

					NewIndex++;
				}

				var oTargetTable = AscCommon.CollaborativeEditing.Is_SingleUser() ? this : this.Copy(NewDocContent);
				if (NewDocContent != OldDocContent)
				{
					// Сначала добавляем таблицу в новый класс
					NewDocContent.Internal_Content_Add(NewIndex, oTargetTable);

					// Удаляем таблицу из родительского класса
					OldDocContent.Internal_Content_Remove(OldIndex, 1);

					oTargetTable.Parent = NewDocContent;
				}
				else
				{
					if (NearestPos.Paragraph.Index > this.Index)
					{
						NewDocContent.Internal_Content_Add(NewIndex, oTargetTable);
						OldDocContent.Internal_Content_Remove(OldIndex, 1);
					}
					else
					{
						OldDocContent.Internal_Content_Remove(OldIndex, 1);
						NewDocContent.Internal_Content_Add(NewIndex, oTargetTable);
					}
				}

				editor.WordControl.m_oLogicDocument.Recalculate();
			}

			oTargetTable.StartTrackTable();
			oLogicDocument.FinalizeAction();

		}
	}
	editor.WordControl.m_oLogicDocument.RemoveSelection();
	oTargetTable.Document_SetThisElementCurrent(true);
	oTargetTable.MoveCursorToStartPos();
	editor.WordControl.m_oLogicDocument.Document_UpdateSelectionState();
};
CTable.prototype.Reset = function(X, Y, XLimit, YLimit, PageNum, ColumnNum, ColumnsCount, SectionY)
{
	this.X_origin = X;
	this.X        = X;
	this.Y        = Y + 0.001; // Погрешность для Flow-таблиц
	this.XLimit   = XLimit;
	this.YLimit   = YLimit;

	this.PageNum      = PageNum;
	this.ColumnNum    = ColumnNum ? ColumnNum : 0;
	this.ColumnsCount = ColumnsCount ? ColumnsCount : 1;

	this.Pages.length = 1;
	this.Pages[0]     = new CTablePage(X, Y, XLimit, YLimit, 0, 0);

	// Для плавающей таблицы, которая расположена во второй или далее колонке, текущее положение по Y - это верх
	// текущей секции
	if (!this.IsInline() && ColumnNum > 0 && undefined !== SectionY)
		this.Y = SectionY;
};
CTable.prototype.Recalculate = function()
{
	// Пересчитываем сетку колонок
	this.private_RecalculateGrid();
	this.Internal_Recalculate_1();
};
CTable.prototype.Reset_RecalculateCache = function()
{
	this.RecalcInfo.Reset(true);

	var RowsCount = this.Content.length;
	for (var RowIndex = 0; RowIndex < RowsCount; RowIndex++)
	{
		var Row        = this.Content[RowIndex];
		var CellsCount = Row.Get_CellsCount();
		for (var CellIndex = 0; CellIndex < CellsCount; CellIndex++)
		{
			var Cell = Row.Get_Cell(CellIndex);
			Cell.Content.Reset_RecalculateCache();
		}
	}
};
CTable.prototype.RecalculateCurPos = function(bUpdateX, bUpdateY)
{
	if (this.CurCell)
		return this.CurCell.Content_RecalculateCurPos(bUpdateX, bUpdateY);

	return null;
};
CTable.prototype.RecalculateMinMaxContentWidth = function(isRotated)
{
	this.private_RecalculateGrid();

	if (true === isRotated)
	{
		var MinMargin = [], MinContent = [], MaxContent = [];

		var RowsCount = this.Content.length;
		for (var CurRow = 0; CurRow < RowsCount; ++CurRow)
		{
			MinMargin[CurRow]  = 0;
			MinContent[CurRow] = 0;
			MaxContent[CurRow] = 0;
		}

		for (var CurRow = 0; CurRow < RowsCount; CurRow++)
		{
			var Row        = this.Content[CurRow];
			var CellsCount = Row.Get_CellsCount();
			for (var CurCell = 0; CurCell < CellsCount; CurCell++)
			{
				var Cell         = Row.Get_Cell(CurCell);
				var CellMinMax   = Cell.Content_RecalculateMinMaxContentWidth(isRotated);
				var CellMin      = CellMinMax.Min;
				var CellMax      = CellMinMax.Max;
				var CellMargins  = Cell.GetMargins();
				var CellMarginsW = CellMargins.Top.W + CellMargins.Bottom.W;

				if (MinMargin[CurRow] < CellMarginsW)
					MinMargin[CurRow] = CellMarginsW;

				if (MinContent[CurRow] < CellMin)
					MinContent[CurRow] = CellMin;

				if (MaxContent[CurRow] < CellMax)
					MaxContent[CurRow] = CellMax;
			}

			var RowH = Row.Get_Height();
			if (Asc.linerule_Exact === RowH.HRule || (linerule_AtLeast === RowH.HRule && MinContent[CurRow] < RowH.Value))
				MinContent[CurRow] = RowH.Value;

			if (Asc.linerule_Exact === RowH.HRule || (linerule_AtLeast === RowH.HRule && MaxContent[CurRow] < RowH.Value))
				MaxContent[CurRow] = RowH.Value;
		}

		var Min = 0;
		var Max = 0;
		for (var CurRow = 0; CurRow < RowsCount; ++CurRow)
		{
			Min += MinMargin[CurRow] + MinContent[CurRow];
			Max += MinMargin[CurRow] + MaxContent[CurRow];
		}

		return {Min : Min, Max : Max};
	}
	else
	{
		var MinMargin = [], MinContent = [], MaxContent = [], MaxFlags = [];

		var GridCount = this.TableGridCalc.length;
		for (var CurCol = 0; CurCol < GridCount; CurCol++)
		{
			MinMargin[CurCol]  = 0;
			MinContent[CurCol] = 0;
			MaxContent[CurCol] = 0;
			MaxFlags[CurCol]   = false; // false - ориентируемся на содержимое ячеек, true - ориентируемся только на
										// ширину ячеек записанную в свойствах
		}

		var RowsCount = this.Content.length;
		for (var CurRow = 0; CurRow < RowsCount; CurRow++)
		{
			var Row = this.Content[CurRow];

			// Смотрим на ширину пропущенных колонок сетки в начале строки
			var BeforeInfo = Row.Get_Before();
			var CurGridCol = BeforeInfo.GridBefore;

			var CellsCount = Row.Get_CellsCount();
			for (var CurCell = 0; CurCell < CellsCount; CurCell++)
			{
				var Cell         = Row.Get_Cell(CurCell);
				var CellMinMax   = Cell.Content_RecalculateMinMaxContentWidth(isRotated);
				var CellMin      = CellMinMax.Min;
				var CellMax      = CellMinMax.Max;
				var GridSpan     = Cell.Get_GridSpan();
				var CellMargins  = Cell.GetMargins();
				var CellMarginsW = CellMargins.Left.W + CellMargins.Right.W;
				var CellW        = Cell.Get_W();
				var CellWW       = null;

				if (tblwidth_Mm === CellW.Type)
					CellWW = CellW.W;
				else if (tblwidth_Pct === CellW.Type)
					CellWW = (this.XLimit - this.X) * CellW.W / 100;

				// Если GridSpan > 1, тогда все равно маргины учитываются в первую колоноку спана
				if (MinMargin[CurGridCol] < CellMarginsW)
					MinMargin[CurGridCol] = CellMarginsW;

				// На самом деле, случай 1 === GridSpan нормально обработается и как случай GridSpan > 1,
				// но поскольку он наиболее распространен, делаем его обработку максимально быстрой (без циклов)
				if (1 === GridSpan)
				{
					if (MinContent[CurGridCol] < CellMin)
						MinContent[CurGridCol] = CellMin;

					if (false === MaxFlags[CurGridCol] && MaxContent[CurGridCol] < CellMax)
						MaxContent[CurGridCol] = CellMax;

					if (null !== CellWW)
					{
						if (false === MaxFlags[CurGridCol])
						{
							MaxFlags[CurGridCol]   = true;
							MaxContent[CurGridCol] = Math.max(CellWW, CellMin);
						}
						else
						{
							MaxContent[CurGridCol] = Math.max(MaxContent[CurGridCol], CellWW, CellMin);
						}
					}
				}
				else
				{
					var SumSpanMinContent = 0;
					var SumSpanMaxContent = 0;
					for (var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++)
					{
						SumSpanMinContent += MinContent[CurSpan];
						SumSpanMaxContent += MaxContent[CurSpan];
					}

					if (SumSpanMinContent < CellMin)
					{
						var TempAdd = (CellMin - SumSpanMinContent) / GridSpan;
						for (var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++)
							MinContent[CurSpan] += TempAdd;
					}

					// Если у нас в объединении несколько колонок, тогда явно записанная ширина ячейки не
					// перекрывает ширину ни одной из колонок, она всего лишь участвует в определении
					// максимальной ширины.
					if (null !== CellWW && CellWW > CellMax)
						CellMax = CellWW;

					if (SumSpanMaxContent < CellMax)
					{
						// TODO: На самом деле, распределение здесь идет в каком-то отношении.
						//       Неплохо было бы выяснить как именно.
						var TempAdd = (CellMax - SumSpanMaxContent) / GridSpan;
						for (var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++)
							MaxContent[CurSpan] += TempAdd;
					}
				}

				CurGridCol += GridSpan;
			}
		}

		var Min = 0;
		var Max = 0;
		for (var CurCol = 0; CurCol < GridCount; CurCol++)
		{
			Min += MinMargin[CurCol] + MinContent[CurCol];

			if (false === MaxFlags[CurCol])
				Max += MinMargin[CurCol] + MaxContent[CurCol];
			else
				Max += MaxContent[CurCol];
		}

		var oTableW = this.GetTableW();
		if (oTableW)
		{
			var nValue = oTableW.GetValue();
			if (oTableW.IsMM())
			{
				if (Min < nValue)
					Min = nValue;

				if (Max < nValue)
					Max = nValue;
			}
			else if (oTableW.IsPercent())
			{
				var nPercentWidth = this.private_RecalculatePercentWidth();
				var mmValue = nValue  / 100 * nPercentWidth;

				if (Min < mmValue)
					Min = mmValue;

				if (Max < mmValue)
					Max = mmValue;
			}
		}

		return {Min : Min, Max : Max};
	}
};
CTable.prototype.RecalculateAllTables = function()
{
	this.private_RecalculateGrid();
	this.private_RecalculateBorders();

	var RowsCount = this.Content.length;
	for (var CurRow = 0; CurRow < RowsCount; CurRow++)
	{
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			Cell.Content.RecalculateAllTables();
		}
	}
};
CTable.prototype.GetLastRangeVisibleBounds = function()
{
	var CurPage = this.Pages.length - 1;
	var Page    = this.Pages[CurPage];
	var CurRow  = this.Content.length - 1;
	var Row     = this.Content[CurRow];

	// Ищем границы по горизонтали для последней ячейки
	var CurCell = Row.Get_CellsCount() - 1;

	var Cell     = Row.Get_Cell(CurCell);
	var CellInfo = Row.Get_CellInfo(CurCell);
	var CellMar  = Cell.GetMargins();

	var X_start = Page.X + CellInfo.X_cell_start;
	var X_end   = Page.X + CellInfo.X_cell_end;

	var Cell_PageRel = CurPage - Cell.Content.Get_StartPage_Relative();

	// Не все ячейки могут иметь страницу с номером Cell_PageRel, но хотя бы одна такая должна быть (иначе переноса
	// на новую страницу не было бы)
	var CellsCount = Row.Get_CellsCount();
	for (CurCell = 0; CurCell < CellsCount; CurCell++)
	{
		Cell = Row.Get_Cell(CurCell);

		if (Cell_PageRel <= Cell.PagesCount - 1)
			break;
	}

	if (CurCell >= CellsCount)
		return {X : X_start, Y : 0, W : X_end - X_start, H : 0, BaseLine : 0, XLimit : Page.XLimit};

	var Bounds   = Cell.Content_Get_PageBounds(Cell_PageRel);
	var Y_offset = Cell.Temp.Y_VAlign_offset[Cell_PageRel];

	var Y = 0;
	var H = 0;
	if (0 != Cell_PageRel)
	{
		// мы должны определить ряд, на котором случился перенос на новую страницу
		var TempRowIndex = this.Pages[CurPage].FirstRow;

		Y = this.RowsInfo[TempRowIndex].Y[CurPage] + this.RowsInfo[TempRowIndex].TopDy[CurPage] + CellMar.Top.W + Y_offset;
		H = this.RowsInfo[TempRowIndex].H[CurPage];
	}
	else
	{
		Y = this.RowsInfo[CurRow].Y[CurPage] + this.RowsInfo[CurRow].TopDy[CurPage] + CellMar.Top.W + Y_offset;
		H = this.RowsInfo[CurRow].H[CurPage];
	}

	return {X : X_start, Y : Y, W : X_end - X_start, H : H, BaseLine : H, XLimit : Page.XLimit};
};
CTable.prototype.FindNextFillingForm = function(isNext, isCurrent, isStart)
{
	var nCurRow  = this.Selection.Use === true ? this.Selection.StartPos.Pos.Row  : this.CurCell.Row.Index;
	var nCurCell = this.Selection.Use === true ? this.Selection.StartPos.Pos.Cell : this.CurCell.Index;

	var nStartRow = 0, nStartCell = 0, nEndRow = 0, nEndCell = 0;

	if (isCurrent)
	{
		if (isStart)
		{
			nStartRow  = nCurRow;
			nStartCell = nCurCell;

			nEndRow  = isNext ? this.Content.length - 1 : 0;
			nEndCell = isNext ? this.Content[nEndRow].Get_CellsCount() - 1 : 0;
		}
		else
		{
			nStartRow  = isNext ? 0 : this.Content.length - 1;
			nStartCell = isNext ? 0 : this.Content[nStartRow].Get_CellsCount() - 1;

			nEndRow  = nCurRow;
			nEndCell = nCurCell;
		}
	}
	else
	{
		if (isNext)
		{
			nStartRow  = 0;
			nStartCell = 0;
			nEndRow    = this.Content.length - 1;
			nEndCell   = this.Content[nEndRow].Get_CellsCount() - 1;
		}
		else
		{
			nStartRow  = this.Content.length - 1;
			nStartCell = this.Content[nEndRow].Get_CellsCount() - 1;
			nEndRow    = 0;
			nEndCell   = 0;
		}
	}

	if (isNext)
	{
		for (var nRowIndex = nStartRow; nRowIndex <= nEndRow; ++nRowIndex)
		{
			var _nStartCell = nRowIndex === nStartRow ? nStartCell : 0;
			var _nEndCell   = nRowIndex === nEndRow ? nEndCell : this.Content[nRowIndex].Get_CellsCount() - 1;
			for (var nCellIndex = _nStartCell; nCellIndex <= _nEndCell; ++nCellIndex)
			{
				var oCell = this.Content[nRowIndex].Get_Cell(nCellIndex);
				var oRes  = oCell.Content.FindNextFillingForm(true, isCurrent && nCellIndex === nCurCell && nRowIndex === nCurRow ? true : false, isStart);
				if (oRes)
					return oRes;
			}
		}
	}
	else
	{
		for (var nRowIndex = nStartRow; nRowIndex >= nEndRow; --nRowIndex)
		{
			var _nStartCell = nRowIndex === nStartRow ? nStartCell : this.Content[nRowIndex].Get_CellsCount() - 1;
			var _nEndCell   = nRowIndex === nEndRow ? nEndCell : 0;
			for (var nCellIndex = _nStartCell; nCellIndex >= _nEndCell; --nCellIndex)
			{
				var oCell = this.Content[nRowIndex].Get_Cell(nCellIndex);
				var oRes  = oCell.Content.FindNextFillingForm(false, isCurrent && nCellIndex === nCurCell && nRowIndex === nCurRow ? true : false, isStart);
				if (oRes)
					return oRes;
			}
		}
	}

	return null;
};
CTable.prototype.Get_NearestPos = function(CurPage, X, Y, bAnchor, Drawing)
{
	var Pos  = this.Internal_GetCellByXY(X, Y, CurPage);
	var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);

	return Cell.Content_Get_NearestPos(CurPage - Cell.Content.Get_StartPage_Relative(), X, Y, bAnchor, Drawing);
};
CTable.prototype.Get_ParentTextTransform = function()
{
	return this.Parent.Get_ParentTextTransform();
};
/**
 * Проверяем начинается ли текущий параграф с новой страницы.
 */
CTable.prototype.IsStartFromNewPage = function()
{
	if ((this.Pages.length > 1 && true === this.IsEmptyPage(0)) || (null === this.Get_DocumentPrev() && true === this.Parent.Is_TopDocument()))
		return true;

	return false;
};
CTable.prototype.IsContentOnFirstPage = function()
{
	if (this.Pages.length >= 1 && true === this.RowsInfo[0].FirstPage && this.Pages[0].LastRow >= this.Pages[0].FirstRow)
		return true;

	return false;
};
CTable.prototype.IsTableBorder = function(X, Y, CurPage)
{
	if (true === this.DrawingDocument.IsMobileVersion())
		return null;

	CurPage = Math.max(0, Math.min(this.Pages.length - 1, CurPage));

	if (true === this.IsEmptyPage(CurPage))
		return null;

	var Result = this.private_CheckHitInBorder(X, Y, CurPage);
	if (Result.Border != -1)
	{
		return this;
	}
	else
	{
		var Cell = this.Content[Result.Pos.Row].Get_Cell(Result.Pos.Cell);
		return Cell.Content_Is_TableBorder(X, Y, CurPage - Cell.Content.Get_StartPage_Relative());
	}
};
CTable.prototype.IsInText = function(X, Y, CurPage)
{
	if (CurPage < 0 || CurPage >= this.Pages.length)
		CurPage = 0;

	var Result = this.private_CheckHitInBorder(X, Y, CurPage);
	if (Result.Border != -1)
	{
		return null;
	}
	else
	{
		var Cell = this.Content[Result.Pos.Row].Get_Cell(Result.Pos.Cell);
		return Cell.Content_Is_InText(X, Y, CurPage - Cell.Content.Get_StartPage_Relative());
	}
};
CTable.prototype.IsInDrawing  = function(X, Y, CurPage)
{
	if (CurPage < 0 || CurPage >= this.Pages.length)
		CurPage = 0;

	var Result = this.private_CheckHitInBorder(X, Y, CurPage);
	if (Result.Border != -1)
	{
		return null;
	}
	else
	{
		var Cell = this.Content[Result.Pos.Row].Get_Cell(Result.Pos.Cell);
		return Cell.Content_Is_InDrawing(X, Y, CurPage - Cell.Content.Get_StartPage_Relative());
	}
};
CTable.prototype.IsInnerTable = function()
{
	if (this.Content.length <= 0)
		return false;

	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
		return this.CurCell.Content.Is_CurrentElementTable();

	return false;
};
CTable.prototype.Is_UseInDocument = function(Id)
{
	var bUse = false;
	if (null != Id)
	{
		var RowsCount = this.Content.length;
		for (var Index = 0; Index < RowsCount; Index++)
		{
			if (Id === this.Content[Index].Get_Id())
			{
				bUse = true;
				break;
			}
		}
	}
	else
		bUse = true;

	if (true === bUse && null != this.Parent)
		return this.Parent.Is_UseInDocument(this.Get_Id());

	return false;
};
CTable.prototype.Get_CurrentPage_Absolute = function()
{
	if (true === this.ApplyToAll || (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0))
	{
		// Проходимся по всей последней выделенной строке и находим текущую страницу с наибольшим значением
		// Если мы будет брать текущую страницу просто у последней ячейки выделения, тогда нужно переделать функцию
		// CDocument.GetCurPage

		var nCurPage = 0;
		var nRow = this.Selection.EndPos.Pos.Row;
		if (this.RowsInfo[nRow])
			nCurPage = this.RowsInfo[nRow].StartPage + this.RowsInfo[nRow].Pages - 1;

		return this.Get_AbsolutePage(nCurPage);
	}
	else
	{
		return this.CurCell.Content.Get_CurrentPage_Absolute();
	}
};
CTable.prototype.Get_CurrentPage_Relative = function()
{
	if (true === this.Selection.Use)
		return 0;

	return this.CurCell.Content.Get_CurrentPage_Absolute() - this.Get_StartPage_Absolute();
};
CTable.prototype.UpdateCursorType = function(X, Y, CurPage)
{
	if (CurPage < 0 || CurPage >= this.Pages.length)
		CurPage = 0;

	if (true === this.Lock.Is_Locked())
	{
		var _X = this.Pages[CurPage].Bounds.Left;
		var _Y = this.Pages[CurPage].Bounds.Top;

		var MMData              = new CMouseMoveData();
		var Coords              = this.DrawingDocument.ConvertCoordsToCursorWR(_X, _Y, this.Get_AbsolutePage(CurPage));
		MMData.X_abs            = Coords.X - 5;
		MMData.Y_abs            = Coords.Y - 5;
		MMData.Type             = AscCommon.c_oAscMouseMoveDataTypes.LockedObject;
		MMData.UserId           = this.Lock.Get_UserId();
		MMData.HaveChanges      = this.Lock.Have_Changes();
		MMData.LockedObjectType = c_oAscMouseMoveLockedObjectType.Common;

		editor.sync_MouseMoveCallback(MMData);
	}

	if (true === this.Selection.Start || table_Selection_Border === this.Selection.Type2 || table_Selection_Border_InnerTable === this.Selection.Type2)
		return;

	// Случай, когда у нас уже есть трэк вложенной таблицы и курсор выходит во внешнюю. Чтобы трэк сразу не пропадал,
	// пока курсор находится в области табличного трэка для вложенной таблицы.
	if (true !== this.DrawingDocument.IsCursorInTableCur(X, Y, this.GetAbsolutePage(CurPage))
		&& true === this.Check_EmptyPages(CurPage - 1)
		&& true !== this.IsEmptyPage(CurPage))
	{
		this.private_StartTrackTable(CurPage);
	}

	var oHitInfo = this.private_CheckHitInBorder(X, Y, CurPage);
	if (true === oHitInfo.RowSelection)
	{
		return this.DrawingDocument.SetCursorType("select-table-row", new CMouseMoveData());
	}
	else if (true === oHitInfo.ColumnSelection)
	{
		return this.DrawingDocument.SetCursorType("select-table-column", new CMouseMoveData());
	}
	else if (true === oHitInfo.CellSelection)
	{
		return this.DrawingDocument.SetCursorType("select-table-cell", new CMouseMoveData());
	}
	else if (-1 !== oHitInfo.Border)
	{
		var Transform = this.Get_ParentTextTransform();
		if (null !== Transform)
		{
			var dX = Math.abs(Transform.TransformPointX(0, 0) - Transform.TransformPointX(0, 1));
			var dY = Math.abs(Transform.TransformPointY(0, 0) - Transform.TransformPointY(0, 1));

			if (Math.abs(dY) > Math.abs(dX))
			{
				switch (oHitInfo.Border)
				{
					case 0:
					case 2:
						return this.DrawingDocument.SetCursorType("row-resize", new CMouseMoveData());
					case 1:
					case 3:
						return this.DrawingDocument.SetCursorType("col-resize", new CMouseMoveData());
				}
			}
			else
			{
				switch (oHitInfo.Border)
				{
					case 0:
					case 2:
						return this.DrawingDocument.SetCursorType("col-resize", new CMouseMoveData());
					case 1:
					case 3:
						return this.DrawingDocument.SetCursorType("row-resize", new CMouseMoveData());
				}
			}
		}
		else
		{
			switch (oHitInfo.Border)
			{
				case 0:
				case 2:
					return this.DrawingDocument.SetCursorType("row-resize", new CMouseMoveData());
				case 1:
				case 3:
					return this.DrawingDocument.SetCursorType("col-resize", new CMouseMoveData());
			}
		}
	}

	var Cell_Pos = this.Internal_GetCellByXY(X, Y, CurPage);
	var Cell     = this.Content[Cell_Pos.Row].Get_Cell(Cell_Pos.Cell);
	Cell.Content_UpdateCursorType(X, Y, CurPage - Cell.Content.Get_StartPage_Relative());
};
CTable.prototype.StartTrackTable = function()
{
	var CurPage = 0;
	while (CurPage < this.Pages.length)
	{
		if (true != this.IsEmptyPage(CurPage))
			break;

		CurPage++;
	}

	this.private_StartTrackTable(CurPage);
};
CTable.prototype.CollectDocumentStatistics = function(Stats)
{
	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			Row.Get_Cell(CurCell).Content.CollectDocumentStatistics(Stats);
		}
	}
};
CTable.prototype.Document_CreateFontMap = function(FontMap)
{
	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			Row.Get_Cell(CurCell).Content_Document_CreateFontMap(FontMap);
		}
	}
};
CTable.prototype.Document_CreateFontCharMap = function(FontCharMap)
{
	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			Row.Get_Cell(CurCell).Content.Document_CreateFontCharMap(0x00B7);
		}
	}
};
CTable.prototype.Document_Get_AllFontNames = function(AllFonts)
{
	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			Row.Get_Cell(CurCell).Content.Document_Get_AllFontNames(AllFonts);
		}
	}
};
CTable.prototype.Document_UpdateInterfaceState = function()
{
	// Если у нас выделено несколько ячеек, тогда данная таблица - нижний уровень
	if (true != this.Selection.Use || table_Selection_Cell != this.Selection.Type)
	{
		this.CurCell.Content.Document_UpdateInterfaceState();

		if (this.LogicDocument && !this.bPresentation)
		{
			var oTrackManager = this.LogicDocument.GetTrackRevisionsManager();

			var arrChanges = oTrackManager.GetElementChanges(this.GetId());
			if (arrChanges.length > 0)
			{
				var nCurRow = this.CurCell.GetRow().GetIndex();
				if (this.RowsInfo[nCurRow] && undefined !== this.RowsInfo[nCurRow].Y[this.RowsInfo[nCurRow].StartPage])
				{
					var nCurPage = this.RowsInfo[nCurRow].StartPage;
					var nPageAbs = this.GetAbsolutePage(nCurPage);
					var dY       = this.RowsInfo[nCurRow].Y[nCurPage];
					var dX       = this.LogicDocument.Get_PageLimits(nPageAbs).XLimit;

					for (var nChangeIndex = 0, nChangesCount = arrChanges.length; nChangeIndex < nChangesCount; ++nChangeIndex)
					{
						var oChange = arrChanges[nChangeIndex];
						var nType   = oChange.get_Type();

						if ((c_oAscRevisionsChangeType.RowsAdd !== nType
							&& c_oAscRevisionsChangeType.RowsRem !== nType)
							|| (nCurRow >= oChange.get_StartPos()
							&& nCurRow <= oChange.get_EndPos()))
						{
							oChange.put_InternalPos(dX, dY, nPageAbs);
							oTrackManager.AddVisibleChange(oChange);
						}
					}
				}
			}
		}
	}
	else
	{
		var ParaPr         = this.GetCalculatedParaPr();
		ParaPr.CanAddTable = false;
		if (null != ParaPr)
			editor.UpdateParagraphProp(ParaPr);

		var TextPr = this.GetCalculatedTextPr();
		if (null != TextPr)
		{
			var theme = this.Get_Theme();
			if (theme && theme.themeElements && theme.themeElements.fontScheme)
			{
				TextPr.ReplaceThemeFonts(theme.themeElements.fontScheme);
			}
			editor.UpdateTextPr(TextPr);
		}
	}
};
CTable.prototype.Document_UpdateRulersState = function(CurPage)
{
	if (CurPage < 0 || CurPage >= this.Pages.length)
		CurPage = 0;

	if (true == this.Selection.Use && table_Selection_Cell == this.Selection.Type)
	{
		this.private_UpdateTableMarkup(this.Selection.EndPos.Pos.Row, this.Selection.EndPos.Pos.Cell, CurPage);
	}
	else
	{
		this.private_UpdateTableMarkup(this.CurCell.Row.Index, this.CurCell.Index, CurPage);
		this.CurCell.Content.Document_UpdateRulersState(CurPage - this.CurCell.Content.Get_StartPage_Relative());
	}
};
CTable.prototype.Document_SetThisElementCurrent = function(bUpdateStates)
{
	this.Parent.Update_ContentIndexing();
	this.Parent.Set_CurrentElement(this.Index, bUpdateStates);
};
CTable.prototype.Can_CopyCut = function()
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		return true;
	else
		return this.CurCell.Content.Can_CopyCut();
};
CTable.prototype.Set_Inline = function(Value)
{
	History.Add(new CChangesTableInline(this, this.Inline, Value));
	this.Inline = Value;
};
CTable.prototype.Is_Inline = function()
{
	if (this.Parent && true === this.Parent.Is_DrawingShape())
		return true;

	return this.Inline;
};
CTable.prototype.IsInline = function()
{
	return this.Is_Inline();
};
/**
 * Функция, которую нужно вызвать перед удалением данного элемента
 */
CTable.prototype.PreDelete = function()
{
	this.DrawingDocument.EndTrackTable(this, false);

	var RowsCount = this.Content.length;
	for (var CurRow = 0; CurRow < RowsCount; CurRow++)
	{
		var Row = this.Content[CurRow];
		Row.PreDelete();
	}

	this.RemoveSelection();
};
CTable.prototype.RemoveInnerTable = function()
{
	this.CurCell.Content.RemoveTable();
};
CTable.prototype.SelectTable = function(Type)
{
	if (true === this.IsInnerTable())
	{
		this.CurCell.Content.SelectTable(Type);
		if (true === this.CurCell.Content.IsSelectionUse())
		{
			this.Selection.Use   = true;
			this.Selection.Start = false;
			this.Selection.Type  = table_Selection_Text;
			this.Selection.Data  = null;
			this.Selection.Type2 = table_Selection_Common;
			this.Selection.Data2 = null;
		}

		return;
	}

	var NewSelectionData = [];

	switch (Type)
	{
		case c_oAscTableSelectionType.Table :
		{
			for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
			{
				var Row         = this.Content[CurRow];
				var Cells_Count = Row.Get_CellsCount();
				for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
				{
					var Cell   = Row.Get_Cell(CurCell);
					var Vmerge = Cell.GetVMerge();

					if (vmerge_Continue === Vmerge)
						continue;

					NewSelectionData.push({Row : CurRow, Cell : CurCell});
				}
			}

			break;
		}

		case c_oAscTableSelectionType.Row :
		{
			var Rows_to_select = [];

			if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
			{
				var Row_prev = -1;
				for (var Index = 0; Index < this.Selection.Data.length; Index++)
				{
					var Pos = this.Selection.Data[Index];
					if (-1 === Row_prev || Row_prev != Pos.Row)
					{
						Rows_to_select.push(Pos.Row);
						Row_prev = Pos.Row;
					}
				}
			}
			else
			{
				Rows_to_select.push(this.CurCell.Row.Index);
			}

			for (var Index = 0; Index < Rows_to_select.length; Index++)
			{
				var Row         = this.Content[Rows_to_select[Index]];
				var Cells_Count = Row.Get_CellsCount();
				for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
				{
					var Cell   = Row.Get_Cell(CurCell);
					var Vmerge = Cell.GetVMerge();
					if (vmerge_Continue === Vmerge)
						continue;

					NewSelectionData.push({Cell : CurCell, Row : Rows_to_select[Index]});
				}
			}

			break;
		}

		case c_oAscTableSelectionType.Column :
		{
			var Grid_start = -1;
			var Grid_end   = -1;

			if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
			{
				for (var Index = 0; Index < this.Selection.Data.length; Index++)
				{
					var Pos  = this.Selection.Data[Index];
					var Row  = this.Content[Pos.Row];
					var Cell = Row.Get_Cell(Pos.Cell);

					var StartGridCol = Row.Get_CellInfo(Pos.Cell).StartGridCol;
					var EndGridCol   = StartGridCol + Cell.Get_GridSpan() - 1;

					if (-1 === Grid_start || Grid_start > StartGridCol)
						Grid_start = StartGridCol;

					if (-1 === Grid_end || Grid_end < EndGridCol)
						Grid_end = EndGridCol;
				}
			}
			else
			{
				Grid_start = this.Content[this.CurCell.Row.Index].Get_CellInfo(this.CurCell.Index).StartGridCol;
				Grid_end   = Grid_start + this.CurCell.Get_GridSpan() - 1;
			}

			this.private_GetColumnByGridRange(Grid_start, Grid_end, NewSelectionData);
			break;
		}

		case c_oAscTableSelectionType.Cell :
		default :
		{
			if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
				NewSelectionData = this.Selection.Data;
			else
				NewSelectionData.push({Row : this.CurCell.Row.Index, Cell : this.CurCell.Index});
			break;
		}
	}

	this.Selection.Use   = true;
	this.Selection.Start = false;
	this.Selection.Type  = table_Selection_Cell;
	this.Selection.Data  = NewSelectionData;
	this.Selection.Type2 = table_Selection_Common;
	this.Selection.Data2 = null;

	this.Selection.StartPos.Pos = {Row : NewSelectionData[0].Row, Cell : NewSelectionData[0].Cell};
	this.Selection.EndPos.Pos   = {
		Row  : NewSelectionData[NewSelectionData.length - 1].Row,
		Cell : NewSelectionData[NewSelectionData.length - 1].Cell
	};

};
CTable.prototype.CanSplitTableCells = function()
{
	if (true === this.IsInnerTable())
		return this.CurCell.Content.CanSplitTableCells();

	// Разделение ячейки работает, только если выделена ровно одна ячейка.
	if (!( false === this.Selection.Use || ( true === this.Selection.Use && ( table_Selection_Text === this.Selection.Type || ( table_Selection_Cell === this.Selection.Type && 1 === this.Selection.Data.length  ) ) ) ))
		return false;

	return true;
};
CTable.prototype.CanMergeTableCells = function()
{
	if (true === this.IsInnerTable())
		return this.CurCell.Content.CanMergeTableCells();

	if (true != this.Selection.Use || table_Selection_Cell != this.Selection.Type || this.Selection.Data.length <= 1)
		return false;

	return this.Internal_CheckMerge().bCanMerge;
};
/**
 * Выставляем селект по заданным строкам таблицы
 * @param nStartRow {number}
 * @param nEndRow {number}
 */
CTable.prototype.SelectRows = function(nStartRow, nEndRow)
{
	var nRowsCount = this.GetRowsCount();
	if (nRowsCount <= 0)
		return;

	nStartRow = Math.max(0, Math.min(nStartRow, nRowsCount - 1));
	nEndRow   = Math.max(0, Math.min(nEndRow, nRowsCount - 1), nStartRow);

	var arrSelectionData = [];

	for (var nCurRow = nStartRow; nCurRow <= nEndRow; ++nCurRow)
	{
		for (var nCurCell = 0, nCellsCount = this.GetRow(nCurRow).GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			arrSelectionData.push({
				Cell : nCurCell,
				Row  : nCurRow
			});
		}
	}


	this.Selection.Use   = true;
	this.Selection.Start = false;
	this.Selection.Type  = table_Selection_Cell;
	this.Selection.Data  = arrSelectionData;
	this.Selection.Type2 = table_Selection_Common;
	this.Selection.Data2 = null;

	this.Selection.StartPos.Pos = {
		Row  : arrSelectionData[0].Row,
		Cell : arrSelectionData[0].Cell
	};

	this.Selection.EndPos.Pos = {
		Row  : arrSelectionData[arrSelectionData.length - 1].Row,
		Cell : arrSelectionData[arrSelectionData.length - 1].Cell
	};
};
//----------------------------------------------------------------------------------------------------------------------
// Undo/Redo функции
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.GetSelectionState = function()
{
	var TableState       = {};
	TableState.Selection = {
		Start    : this.Selection.Start,
		Use      : this.Selection.Use,
		StartPos : {
			Pos        : {Row : this.Selection.StartPos.Pos.Row, Cell : this.Selection.StartPos.Pos.Cell},
			X          : this.Selection.StartPos.X,
			Y          : this.Selection.StartPos.Y,
			PageIndex  : this.Selection.StartPos.PageIndex,
			MouseEvent : {
				// TODO : Если в MouseEvent будет использоваться что-то кроме ClickCount, Type и CtrlKey, добавить
				// здесь
				ClickCount : this.Selection.StartPos.MouseEvent.ClickCount,
				Type       : this.Selection.StartPos.MouseEvent.Type,
				CtrlKey    : this.Selection.StartPos.MouseEvent.CtrlKey
			}
		},
		EndPos   : {
			Pos        : {Row : this.Selection.EndPos.Pos.Row, Cell : this.Selection.EndPos.Pos.Cell},
			X          : this.Selection.EndPos.X,
			Y          : this.Selection.EndPos.Y,
			PageIndex  : this.Selection.EndPos.PageIndex,
			MouseEvent : {
				// TODO : Если в MouseEvent будет использоваться что-то кроме ClickCount, Type и CtrlKey, добавить
				// здесь
				ClickCount : this.Selection.EndPos.MouseEvent.ClickCount,
				Type       : this.Selection.EndPos.MouseEvent.Type,
				CtrlKey    : this.Selection.EndPos.MouseEvent.CtrlKey
			}
		},
		Type     : this.Selection.Type,
		Data     : null,
		Type2    : table_Selection_Common,
		Data2    : null,
		CurRow   : this.Selection.CurRow
	};

	TableState.Selection.Data = [];
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		for (var Index = 0; Index < this.Selection.Data.length; Index++)
			TableState.Selection.Data[Index] = {
				Row  : this.Selection.Data[Index].Row,
				Cell : this.Selection.Data[Index].Cell
			};
	}

	TableState.CurCell = {Row : this.CurCell.Row.Index, Cell : this.CurCell.Index};

	var State = this.CurCell.Content.GetSelectionState();
	State.push(TableState);
	return State;
};
CTable.prototype.SetSelectionState = function(State, StateIndex)
{
	if (State.length <= 0)
		return;

	var TableState = State[StateIndex];

	this.Selection = {
		Start    : TableState.Selection.Start,
		Use      : TableState.Selection.Use,
		StartPos : {
			Pos        : {
				Row  : TableState.Selection.StartPos.Pos.Row,
				Cell : TableState.Selection.StartPos.Pos.Cell
			},
			X          : TableState.Selection.StartPos.X,
			Y          : TableState.Selection.StartPos.Y,
			PageIndex  : TableState.Selection.StartPos.PageIndex,
			MouseEvent : {
				// TODO : Если в MouseEvent будет использоваться что-то кроме ClickCount, Type и CtrlKey, добавить
				// здесь
				ClickCount : TableState.Selection.StartPos.MouseEvent.ClickCount,
				Type       : TableState.Selection.StartPos.MouseEvent.Type,
				CtrlKey    : TableState.Selection.StartPos.MouseEvent.CtrlKey
			}
		},
		EndPos   : {
			Pos        : {Row : TableState.Selection.EndPos.Pos.Row, Cell : TableState.Selection.EndPos.Pos.Cell},
			X          : TableState.Selection.EndPos.X,
			Y          : TableState.Selection.EndPos.Y,
			PageIndex  : TableState.Selection.EndPos.PageIndex,
			MouseEvent : {
				// TODO : Если в MouseEvent будет использоваться что-то кроме ClickCount, Type и CtrlKey, добавить
				// здесь
				ClickCount : TableState.Selection.EndPos.MouseEvent.ClickCount,
				Type       : TableState.Selection.EndPos.MouseEvent.Type,
				CtrlKey    : TableState.Selection.EndPos.MouseEvent.CtrlKey
			}
		},
		Type     : TableState.Selection.Type,
		Data     : null,
		Type2    : table_Selection_Common,
		Data2    : null,
		CurRow   : TableState.Selection.CurRow
	};

	this.Selection.Data = [];
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		for (var Index = 0; Index < TableState.Selection.Data.length; Index++)
			this.Selection.Data[Index] = {
				Row  : TableState.Selection.Data[Index].Row,
				Cell : TableState.Selection.Data[Index].Cell
			};
	}

	this.CurCell = this.Content[TableState.CurCell.Row].Get_Cell(TableState.CurCell.Cell);
	this.CurCell.Content.SetSelectionState(State, StateIndex - 1);
};
CTable.prototype.Get_ParentObject_or_DocumentPos = function()
{
	return this.Parent.Get_ParentObject_or_DocumentPos(this.Index);
};
CTable.prototype.Refresh_RecalcData = function(Data)
{
	var Type = Data.Type;

	var bNeedRecalc = false;
	var nRowIndex   = 0;

	switch (Type)
	{
		case AscDFH.historyitem_Table_TableShd:
		{
			break;
		}

		case AscDFH.historyitem_Table_TableW:
		case AscDFH.historyitem_Table_TableLayout:
		case AscDFH.historyitem_Table_TableCellMar:
		case AscDFH.historyitem_Table_TableAlign:
		case AscDFH.historyitem_Table_TableInd:
		case AscDFH.historyitem_Table_TableBorder_Left:
		case AscDFH.historyitem_Table_TableBorder_Right:
		case AscDFH.historyitem_Table_TableBorder_Top:
		case AscDFH.historyitem_Table_TableBorder_Bottom:
		case AscDFH.historyitem_Table_TableBorder_InsideH:
		case AscDFH.historyitem_Table_TableBorder_InsideV:
		case AscDFH.historyitem_Table_Inline:
		case AscDFH.historyitem_Table_AllowOverlap:
		case AscDFH.historyitem_Table_PositionH:
		case AscDFH.historyitem_Table_PositionV:
		case AscDFH.historyitem_Table_Distance:
		case AscDFH.historyitem_Table_TableStyleColBandSize:
		case AscDFH.historyitem_Table_TableStyleRowBandSize:
		case AscDFH.historyitem_Table_Pr:
		{
			bNeedRecalc = true;
			break;
		}
		case AscDFH.historyitem_Table_AddRow:
		case AscDFH.historyitem_Table_RemoveRow:
		{
			bNeedRecalc = true;
			nRowIndex   = Data.Pos;
			break;
		}
		case AscDFH.historyitem_Table_TableGrid:
		{
			bNeedRecalc = true;
			break;
		}
		case AscDFH.historyitem_Table_TableStyle:
		case AscDFH.historyitem_Table_TableLook:
		{
			var Count = this.Content.length;
			for (var CurRow = 0; CurRow < Count; CurRow++)
			{
				var Row         = this.Content[CurRow];
				var Cells_Count = Row.Get_CellsCount();
				for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
				{
					var Cell = Row.Get_Cell(CurCell);
					Cell.Recalc_CompiledPr();
				}
				Row.Recalc_CompiledPr();
			}
			this.Recalc_CompiledPr();
			bNeedRecalc = true;
			break;
		}
	}

	this.RecalcInfo.Recalc_AllCells();
	this.RecalcInfo.Recalc_Borders();

	if (true === bNeedRecalc)
	{
		History.Add_RecalcTableGrid(this.Get_Id());
		this.Refresh_RecalcData2(nRowIndex, 0);
	}
};
CTable.prototype.Refresh_RecalcData2 = function(nRowIndex, nCurPage)
{
	// Если Index < 0, значит данный элемент еще не был добавлен в родительский класс
	if (this.Index >= 0)
	{

		if (Math.min(nRowIndex, this.RowsInfo.length - 1) < 0)
			this.Parent.Refresh_RecalcData2(this.Index, this.private_GetRelativePageIndex(0));
		else
			this.Parent.Refresh_RecalcData2(this.Index, this.private_GetRelativePageIndex(nCurPage));
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с совместным редактирования
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.Write_ToBinary2 = function(Writer)
{
	Writer.WriteLong(AscDFH.historyitem_type_Table);

	// Long               : type_Table
	// String             : Id самой таблицы
	// String             : Id стиля (если стока пустая, то null)
	// Bool               : Inline
	// Long               : количество элементов в TableGrid
	// Array of doubles   : массив TableGrid
	// Double             : X_origin
	// Double             : X
	// Double             : Y
	// Double             : XLimit
	// Double             : YLimit
	// Variable           : свойства таблицы (TablePr)
	// Long               : количество строк
	// Array of Strings   : массив Id строк

	Writer.WriteLong(type_Table);
	Writer.WriteString2(this.Id);
	Writer.WriteString2(null === this.TableStyle ? "" : this.TableStyle);
	Writer.WriteBool(this.Inline);

	var GridCount = this.TableGrid.length;
	Writer.WriteLong(GridCount);
	for (var Index = 0; Index < GridCount; Index++)
		Writer.WriteDouble(this.TableGrid[Index]);

	Writer.WriteDouble(this.X_origin);
	Writer.WriteDouble(this.X);
	Writer.WriteDouble(this.Y);
	Writer.WriteDouble(this.XLimit);
	Writer.WriteDouble(this.YLimit);

	this.Pr.Write_ToBinary(Writer);

	var RowsCount = this.Content.length;
	Writer.WriteLong(RowsCount);
	for (var Index = 0; Index < RowsCount; Index++)
		Writer.WriteString2(this.Content[Index].Get_Id());
	Writer.WriteBool(this.bPresentation);
};
CTable.prototype.Read_FromBinary2 = function(Reader)
{
	// Long               : type_Table
	// String             : Id самой таблицы
	// String             : Id стиля (если стока пустая, то null)
	// Bool               : Inline
	// Long               : количество элементов в TableGrid
	// Array of doubles   : массив TableGrid
	// Double             : X_origin
	// Double             : X
	// Double             : Y
	// Double             : XLimit
	// Double             : YLimit
	// Variable           : свойства таблицы (TablePr)
	// Long               : количество строк
	// Array of Strings   : массив Id строк

	this.Prev = null;
	this.Next = null;

	Reader.GetLong();
	this.Id = Reader.GetString2();

	var TableStyleId = Reader.GetString2();
	this.TableStyle  = ( TableStyleId === "" ? null : TableStyleId );

	this.Inline = Reader.GetBool();

	var GridCount  = Reader.GetLong();
	this.TableGrid = [];
	for (var Index = 0; Index < GridCount; Index++)
		this.TableGrid.push(Reader.GetDouble());

	this.X_origin = Reader.GetDouble();
	this.X        = Reader.GetDouble();
	this.Y        = Reader.GetDouble();
	this.XLimit   = Reader.GetDouble();
	this.YLimit   = Reader.GetDouble();

	this.Pr = new CTablePr();
	this.Pr.Read_FromBinary(Reader);
	this.Recalc_CompiledPr();

	var Count    = Reader.GetLong();
	this.Content = [];
	for (var Index = 0; Index < Count; Index++)
	{
		var Row = g_oTableId.Get_ById(Reader.GetString2());
		this.Content.push(Row);
	}
	this.bPresentation = Reader.GetBool();

	this.Internal_ReIndexing();

	AscCommon.CollaborativeEditing.Add_NewObject(this);

	var DrawingDocument = editor.WordControl.m_oDrawingDocument;
	if (undefined !== DrawingDocument && null !== DrawingDocument)
	{
		this.DrawingDocument = DrawingDocument;
		this.LogicDocument   = this.DrawingDocument.m_oLogicDocument;
	}

	// Добавляем, чтобы в конце выставить CurCell
	var LinkData     = {};
	LinkData.CurCell = true;
	AscCommon.CollaborativeEditing.Add_LinkData(this, LinkData);
};
CTable.prototype.Load_LinkData = function(LinkData)
{
	if ("undefined" != typeof(LinkData) && "undefined" != typeof(LinkData.CurCell))
	{
		if (this.Content.length > 0 && this.Content[0].Get_CellsCount() > 0)
			this.CurCell = this.Content[0].Get_Cell(0);
	}
};
CTable.prototype.Get_SelectionState2 = function()
{
	var TableState = {};

	TableState.Id = this.Get_Id();

	TableState.CellId = ( null !== this.CurCell ? this.CurCell.Get_Id() : null );
	TableState.Data   = ( null !== this.CurCell ? this.CurCell.Content.Get_SelectionState2() : null );

	return TableState;
};
CTable.prototype.Set_SelectionState2 = function(TableState)
{
	var CellId = TableState.CellId;

	var CurCell = null;
	var Pos     = {Cell : 0, Row : 0};

	var RowsCount = this.Content.length;
	for (var RowIndex = 0; RowIndex < RowsCount; RowIndex++)
	{
		var Row        = this.Content[RowIndex];
		var CellsCount = Row.Get_CellsCount();
		for (var CellIndex = 0; CellIndex < CellsCount; CellIndex++)
		{
			var Cell = Row.Get_Cell(CellIndex);

			if (Cell.Get_Id() === CellId)
			{
				CurCell = Cell;

				Pos.Cell = CellIndex;
				Pos.Row  = RowIndex;

				break;
			}
		}

		if (null !== CurCell)
			break;
	}

	if (null == CurCell)
	{
		this.MoveCursorToStartPos(false);
	}
	else
	{
		this.CurCell = CurCell;

		this.Selection.Start        = false;
		this.Selection.Use          = false;
		this.Selection.StartPos.Pos = {Row : Pos.Row, Cell : Pos.Cell};
		this.Selection.EndPos.Pos   = {Row : Pos.Row, Cell : Pos.Cell};
		this.Selection.Type         = table_Selection_Common;
		this.Selection.Type2        = table_Selection_Common;
		this.Selection.Data         = null;
		this.Selection.Data2        = null;
		this.Selection.CurRow       = 0;

		this.CurCell.Content.Set_SelectionState2(TableState.Data);
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с гиперссылками
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.AddHyperlink = function(HyperProps)
{
	// Выделения по ячейкам быть не должно
	return this.CurCell.Content.AddHyperlink(HyperProps);
};
CTable.prototype.ModifyHyperlink = function(HyperProps)
{
	if (false === this.Selection.Use || (true === this.Selection.Use && table_Selection_Text === this.Selection.Type))
		this.CurCell.Content.ModifyHyperlink(HyperProps);

	return false;
};
CTable.prototype.RemoveHyperlink = function()
{
	if (false === this.Selection.Use || (true === this.Selection.Use && table_Selection_Text === this.Selection.Type))
		this.CurCell.Content.RemoveHyperlink();
};
CTable.prototype.CanAddHyperlink = function(bCheckInHyperlink)
{
	if (false === this.Selection.Use || (true === this.Selection.Use && table_Selection_Text === this.Selection.Type))
		return this.CurCell.Content.CanAddHyperlink(bCheckInHyperlink);

	return false;
};
CTable.prototype.IsCursorInHyperlink = function(bCheckEnd)
{
	if (false === this.Selection.Use || (true === this.Selection.Use && table_Selection_Text === this.Selection.Type))
		return this.CurCell.Content.IsCursorInHyperlink(bCheckEnd);

	return null;
};
//----------------------------------------------------------------------------------------------------------------------
// Функции для работы с комментариями
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.AddComment = function(Comment, bStart, bEnd)
{
	if (true === this.ApplyToAll)
	{
		var RowsCount  = this.Content.length;
		var CellsCount = this.Content[RowsCount - 1].Get_CellsCount();

		if (true === bStart && true === bEnd && RowsCount <= 1 && CellsCount <= 1)
		{
			var Cell_Content = this.Content[0].Get_Cell(0).Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell_Content.AddComment(Comment, true, true);
			Cell_Content.Set_ApplyToAll(false);
		}
		else
		{
			if (true === bStart)
			{
				var Cell_Content = this.Content[0].Get_Cell(0).Content;
				Cell_Content.Set_ApplyToAll(true);
				Cell_Content.AddComment(Comment, true, false);
				Cell_Content.Set_ApplyToAll(false);
			}

			if (true === bEnd)
			{
				var Cell_Content = this.Content[RowsCount - 1].Get_Cell(CellsCount - 1).Content;
				Cell_Content.Set_ApplyToAll(true);
				Cell_Content.AddComment(Comment, false, true);
				Cell_Content.Set_ApplyToAll(false);
			}

			// TODO: Пока нам приходится пересчитывать ячейки после добавления комментариев. Как только
			//       избавимся от этого, то надо будет переделать здесь.

			var RowsCount = this.Content.length;
			for (var RowIndex = 0; RowIndex < RowsCount; RowIndex++)
			{
				var Row        = this.Content[RowIndex];
				var CellsCount = Row.Get_CellsCount();

				for (var CellIndex = 0; CellIndex < CellsCount; CellIndex++)
				{
					var Cell = Row.Get_Cell(CellIndex);
					this.RecalcInfo.Add_Cell(Cell);
				}
			}
		}
	}
	else
	{
		if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		{
			if (true === bStart && true === bEnd && this.Selection.Data.length <= 1)
			{
				var Pos          = this.Selection.Data[0];
				var Cell_Content = this.Content[Pos.Row].Get_Cell(Pos.Cell).Content;
				Cell_Content.Set_ApplyToAll(true);
				Cell_Content.AddComment(Comment, true, true);
				Cell_Content.Set_ApplyToAll(false);
			}
			else
			{
				var StartPos = null, EndPos = null;

				if (true === bStart)
				{
					StartPos         = this.Selection.Data[0];
					var Cell_Content = this.Content[StartPos.Row].Get_Cell(StartPos.Cell).Content;
					Cell_Content.Set_ApplyToAll(true);
					Cell_Content.AddComment(Comment, true, false);
					Cell_Content.Set_ApplyToAll(false);
				}

				if (true === bEnd)
				{
					EndPos           = this.Selection.Data[this.Selection.Data.length - 1];
					var Cell_Content = this.Content[EndPos.Row].Get_Cell(EndPos.Cell).Content;
					Cell_Content.Set_ApplyToAll(true);
					Cell_Content.AddComment(Comment, false, true);
					Cell_Content.Set_ApplyToAll(false);
				}

				// TODO: Пока нам приходится пересчитывать ячейки после добавления комментариев. Как только
				//       избавимся от этого, то надо будет переделать здесь.

				var StartRow = 0, EndRow = -1, StartCell = 0, EndCell = -1;
				if (null !== StartPos && null !== EndPos)
				{
					StartRow  = StartPos.Row;
					EndRow    = EndPos.Row;
					StartCell = StartPos.Cell;
					EndCell   = EndPos.Cell;
				}
				else if (null !== StartPos)
				{
					StartRow  = StartPos.Row;
					StartCell = StartPos.Cell;
					EndRow    = this.Content.length - 1;
					EndCell   = this.Content[EndRow].Get_CellsCount() - 1;
				}
				else if (null !== EndPos)
				{
					StartRow  = 0;
					StartCell = 0;
					EndRow    = EndPos.Row;
					EndCell   = EndPos.Cell;
				}

				for (var RowIndex = StartRow; RowIndex <= EndRow; RowIndex++)
				{
					var Row = this.Content[RowIndex];

					var _StartCell = ( RowIndex === StartRow ? StartCell : 0 );
					var _EndCell   = ( RowIndex === EndRow ? EndCell : Row.Get_CellsCount() - 1 );

					for (var CellIndex = _StartCell; CellIndex <= _EndCell; CellIndex++)
					{
						var Cell = Row.Get_Cell(CellIndex);
						this.RecalcInfo.Add_Cell(Cell);
					}
				}
			}
		}
		else
		{
			this.CurCell.Content.AddComment(Comment, bStart, bEnd);
		}
	}
};
CTable.prototype.CanAddComment = function()
{
	if (true === this.ApplyToAll)
	{
		if (this.Content.length > 1 || this.Content[0].Get_CellsCount() > 1)
			return true;

		this.Content[0].Get_Cell(0).Content.Set_ApplyToAll(true);
		var Result = this.Content[0].Get_Cell(0).Content.CanAddComment();
		this.Content[0].Get_Cell(0).Content.Set_ApplyToAll(false);
		return Result;
	}
	else
	{
		if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		{
			if (this.Selection.Data.length > 1)
			{
				return true;
			}
			else
			{
				var oPos  = this.Selection.Data[0];
				var oCell = this.GetRow(oPos.Row).GetCell(oPos.Cell);

				var oCellContent = oCell.GetContent();
				oCellContent.Set_ApplyToAll(true);
				var isCanAdd = oCellContent.CanAddComment();
				oCellContent.Set_ApplyToAll(false);

				return isCanAdd;
			}
		}
		else
		{
			return this.CurCell.Content.CanAddComment();
		}
	}
};
CTable.prototype.Can_IncreaseParagraphLevel = function(bIncrease)
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		if (this.Selection.Data.length > 0)
		{
			var Data = this.Selection.Data;
			for (var i = 0; i < Data.length; ++i)
			{
				var Pos          = Data[i];
				var Cell_Content = this.Content[Pos.Row].Get_Cell(Pos.Cell).Content;
				if (Cell_Content)
				{
					Cell_Content.Set_ApplyToAll(true);
					var bCan = Cell_Content.Can_IncreaseParagraphLevel(bIncrease);
					Cell_Content.Set_ApplyToAll(false);
					if (!bCan)
					{
						return false;
					}
				}
			}
			return true;
		}
		else
		{
			return false;
		}
	}
	else
	{
		this.CurCell.Content.Can_IncreaseParagraphLevel(bIncrease);
	}
};
CTable.prototype.GetSelectionBounds = function(isForceCellSelection)
{
	var isUseSelection = (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0));

	var arrCells = (isUseSelection ? this.GetSelectionArray() : (isForceCellSelection ? [this.CurCell] : null));
	if (arrCells)
	{
		var arrCells = this.GetSelectionArray();

		var StartPos = arrCells[0];
		var EndPos   = arrCells[arrCells.length - 1];

		var Row  = this.Content[StartPos.Row];
		var Cell = Row.Get_Cell(StartPos.Cell);

		var X0 = Cell.Metrics.X_cell_start;
		var X1 = Cell.Metrics.X_cell_end;

		if (!this.RowsInfo[StartPos.Row] || !this.RowsInfo[EndPos.Row] || !this.Pages[this.RowsInfo[StartPos.Row].StartPage])
		{
			return {
				Start     : {X : 0, Y : 0, W : 0, H : 0, Page : 0},
				End       : {X : 0, Y : 0, W : 0, H : 0, Page : 0},
				Direction : 1
			};
		}

		var CurPage = this.RowsInfo[StartPos.Row].StartPage;

		var Y = this.RowsInfo[StartPos.Row].Y[CurPage];
		var H = this.RowsInfo[StartPos.Row].H[CurPage];

		var TableX = this.Pages[CurPage].X + this.RowsInfo[StartPos.Row].X0;

		var BeginRect = {X : TableX + X0, Y : Y, W : X1 - X0, H : H, Page : CurPage + this.Get_StartPage_Absolute()};


		Row  = this.Content[EndPos.Row];
		Cell = Row.Get_Cell(EndPos.Cell);

		X0 = Cell.Metrics.X_cell_start;
		X1 = Cell.Metrics.X_cell_end;

		CurPage = this.RowsInfo[EndPos.Row].StartPage + this.RowsInfo[EndPos.Row].Pages - 1;

		Y = this.RowsInfo[EndPos.Row].Y[CurPage];
		H = this.RowsInfo[EndPos.Row].H[CurPage];

		var Direction = 1;
		if (this.Selection.StartPos.Pos.Row < this.Selection.EndPos.Pos.Row || (this.Selection.StartPos.Pos.Row === this.Selection.EndPos.Pos.Row && this.Selection.StartPos.Pos.Cell <= this.Selection.EndPos.Pos.Cell))
			Direction = 1;
		else
			Direction = -1;

		var EndRect = {X : TableX + X0, Y : Y, W : X1 - X0, H : H, Page : CurPage + this.Get_StartPage_Absolute()};

		return {Start : BeginRect, End : EndRect, Direction : Direction};
	}
	else
	{
		return this.CurCell.Content.GetSelectionBounds();
	}
};
CTable.prototype.GetSelectionAnchorPos = function()
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();

		var Pos  = Cells_array[0];
		var Row  = this.Content[Pos.Row];
		var Cell = Row.Get_Cell(Pos.Cell);

		var X0 = Cell.Metrics.X_cell_start;
		var X1 = Cell.Metrics.X_cell_end;

		var Y    = this.RowsInfo[Pos.Row].Y[this.RowsInfo[Pos.Row].StartPage];
		var Page = this.RowsInfo[Pos.Row].StartPage + this.Get_StartPage_Absolute();

		return {X0 : X0, X1 : X1, Y : Y, Page : Page};
	}
	else
	{
		return this.CurCell.Content.GetSelectionAnchorPos();
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Работаем с текущей позицией и селектом таблицы
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.MoveCursorToXY = function(X, Y, bLine, bDontChangeRealPos, CurPage)
{
	var Pos  = this.Internal_GetCellByXY(X, Y, CurPage);
	var Row  = this.Content[Pos.Row];
	var Cell = Row.Get_Cell(Pos.Cell);

	this.Selection.Type         = table_Selection_Text;
	this.Selection.Type2        = table_Selection_Common;
	this.Selection.StartPos.Pos = {Row : Pos.Row, Cell : Pos.Cell};
	this.Selection.EndPos.Pos   = {Row : Pos.Row, Cell : Pos.Cell};
	this.Selection.CurRow       = Pos.Row;

	// Устанавливаем найденную ячейку текущей и перемещаемся в контент ячейки по координатам X,Y
	this.CurCell = Cell;
	this.DrawingDocument.TargetStart();
	this.DrawingDocument.TargetShow();
	this.CurCell.Content_MoveCursorToXY(X, Y, false, true, CurPage - this.CurCell.Content.Get_StartPage_Relative());
	if (this.LogicDocument)
	{
		this.LogicDocument.RecalculateCurPos();
	}
};
CTable.prototype.Selection_SetStart = function(X, Y, CurPage, MouseEvent)
{
	if (CurPage < 0 || CurPage >= this.Pages.length)
		CurPage = 0;

	var Page = this.Pages[CurPage];

	var oHitInfo = this.private_CheckHitInBorder(X, Y, CurPage);

	var Pos = oHitInfo.Pos;
	if (oHitInfo.ColumnSelection || oHitInfo.RowSelection || oHitInfo.CellSelection)
	{
		this.RemoveSelection();

		this.CurCell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
		this.CurCell.Content_Selection_SetStart(X, Y, CurPage - this.CurCell.Content.Get_StartPage_Relative(), MouseEvent);

		this.Selection.Use   = true;
		this.Selection.Start = true;
		this.Selection.Type  = table_Selection_Cell;
		this.Selection.Type2 = table_Selection_Cells;
		this.Selection.Data2 = null;

		this.Selection.StartPos.Pos        = Pos;
		this.Selection.StartPos.X          = X;
		this.Selection.StartPos.Y          = Y;
		this.Selection.StartPos.PageIndex  = CurPage;
		this.Selection.StartPos.MouseEvent = {
			// TODO : Если в MouseEvent будет использоваться что-то кроме ClickCount, Type и CtrlKey, добавить
			// здесь
			ClickCount : MouseEvent.ClickCount,
			Type       : MouseEvent.Type,
			CtrlKey    : MouseEvent.CtrlKey
		};

		var oEndPos = {
			Row  : Pos.Row,
			Cell : Pos.Cell
		};

		if (oHitInfo.RowSelection)
		{
			oEndPos.Cell = this.GetRow(Pos.Row).GetCellsCount() - 1;
			this.Selection.Type2 = table_Selection_Rows;
		}
		else if (oHitInfo.ColumnSelection)
		{
			var oRow     = this.GetRow(Pos.Row);
			var nEndRow  = this.GetRowsCount() - 1;
			var nEndCell = this.private_GetCellIndexByStartGridCol(nEndRow, oRow.GetCellInfo(Pos.Cell).StartGridCol, true);

			if (-1 !== nEndCell)
			{
				oEndPos.Row  = nEndRow;
				oEndPos.Cell = nEndCell;
				this.Selection.Type2 = table_Selection_Columns;
			}
		}

		this.Selection.EndPos.Pos        = oEndPos;
		this.Selection.EndPos.X          = X;
		this.Selection.EndPos.Y          = Y;
		this.Selection.EndPos.PageIndex  = CurPage;
		this.Selection.EndPos.MouseEvent = {
			// TODO : Если в MouseEvent будет использоваться что-то кроме ClickCount, Type и CtrlKey, добавить
			// здесь
			ClickCount : MouseEvent.ClickCount,
			Type       : MouseEvent.Type,
			CtrlKey    : MouseEvent.CtrlKey
		};


		this.Selection.Type = table_Selection_Cell;
		this.private_UpdateSelectedCellsArray();
	}
	else if (-1 === oHitInfo.Border)
	{
		var bInnerTableBorder = ( null != this.IsTableBorder(X, Y, CurPage) ? true : false );
		if (true === bInnerTableBorder)
		{
			// Значит двигается граница внутренней таблицы, мы не должны отменять селект
			var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
			Cell.Content_Selection_SetStart(X, Y, CurPage - Cell.Content.Get_StartPage_Relative(), MouseEvent);

			this.Selection.Type2 = table_Selection_Border_InnerTable;
			this.Selection.Data2 = Cell;
		}
		else
		{
			this.RemoveSelection();

			this.CurCell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
			this.CurCell.Content_Selection_SetStart(X, Y, CurPage - this.CurCell.Content.Get_StartPage_Relative(), MouseEvent);

			this.Selection.Use   = true;
			this.Selection.Start = true;
			this.Selection.Type  = table_Selection_Text;
			this.Selection.Type2 = table_Selection_Common;
			this.Selection.Data2 = null;

			this.Selection.StartPos.Pos        = Pos;
			this.Selection.StartPos.X          = X;
			this.Selection.StartPos.Y          = Y;
			this.Selection.StartPos.PageIndex  = CurPage;
			this.Selection.StartPos.MouseEvent = {
				// TODO : Если в MouseEvent будет использоваться что-то кроме ClickCount, Type и CtrlKey, добавить
				// здесь
				ClickCount : MouseEvent.ClickCount,
				Type       : MouseEvent.Type,
				CtrlKey    : MouseEvent.CtrlKey
			};
		}
	}
	else
	{
		this.private_UpdateTableMarkup(Pos.Row, Pos.Cell, CurPage);
		this.Selection.Type2         = table_Selection_Border;
		this.Selection.Data2         = {};
		this.Selection.Data2.PageNum = CurPage;

		var Row = this.Content[Pos.Row];

		var _X = X;
		var _Y = Y;

		if (0 === oHitInfo.Border || 2 === oHitInfo.Border)
		{
			var PageH = this.LogicDocument.Get_PageLimits(this.Get_StartPage_Absolute()).YLimit;

			var Y_min = 0;
			var Y_max = PageH;

			this.Selection.Data2.bCol = false;

			var Row_start = this.Pages[CurPage].FirstRow;
			var Row_end   = this.Pages[CurPage].LastRow;
			if (0 === oHitInfo.Border)
				this.Selection.Data2.Index = Pos.Row - Row_start;
			else
				this.Selection.Data2.Index = oHitInfo.Row - Row_start + 1;

			if (0 != this.Selection.Data2.Index)
			{
				var TempRow = this.Selection.Data2.Index + Row_start - 1;
				Y_min       = this.RowsInfo[TempRow].Y[CurPage];
			}

			// Подправим Y, чтобы первоначально точно по границе проходила линия
			if (this.Selection.Data2.Index !== Row_end - Row_start + 1)
				_Y = this.RowsInfo[this.Selection.Data2.Index + Row_start].Y[CurPage];
			else
				_Y = this.RowsInfo[this.Selection.Data2.Index + Row_start - 1].Y[CurPage] + this.RowsInfo[this.Selection.Data2.Index + Row_start - 1].H[CurPage];

			this.Selection.Data2.Min = Y_min;
			this.Selection.Data2.Max = Y_max;

			this.Selection.Data2.Pos =
				{
					Row  : Pos.Row,
					Cell : Pos.Cell
				};

			if (null != this.Selection.Data2.Min)
				_Y = Math.max(_Y, this.Selection.Data2.Min);

			if (null != this.Selection.Data2.Max)
				_Y = Math.min(_Y, this.Selection.Data2.Max);
		}
		else
		{
			var CellsCount  = Row.Get_CellsCount();
			var CellSpacing = ( null === Row.Get_CellSpacing() ? 0 : Row.Get_CellSpacing() );
			var X_min       = null;
			var X_max       = null;

			this.Selection.Data2.bCol = true;
			if (3 === oHitInfo.Border)
				this.Selection.Data2.Index = Pos.Cell;
			else
				this.Selection.Data2.Index = Pos.Cell + 1;

			if (0 != this.Selection.Data2.Index)
			{
				var Margins = Row.Get_Cell(this.Selection.Data2.Index - 1).GetMargins();
				if (0 != this.Selection.Data2.Index - 1 && this.Selection.Data2.Index != CellsCount)
					X_min = Page.X + Row.Get_CellInfo(this.Selection.Data2.Index - 1).X_grid_start + Margins.Left.W + Margins.Right.W + CellSpacing;
				else
					X_min = Page.X + Row.Get_CellInfo(this.Selection.Data2.Index - 1).X_grid_start + Margins.Left.W + Margins.Right.W + 1.5 * CellSpacing;
			}

			if (CellsCount != this.Selection.Data2.Index)
			{
				var Margins = Row.Get_Cell(this.Selection.Data2.Index).GetMargins();
				if (CellsCount - 1 != this.Selection.Data2.Index)
					X_max = Page.X + Row.Get_CellInfo(this.Selection.Data2.Index).X_grid_end - (Margins.Left.W + Margins.Right.W + CellSpacing);
				else
					X_max = Page.X + Row.Get_CellInfo(this.Selection.Data2.Index).X_grid_end - (Margins.Left.W + Margins.Right.W + 1.5 * CellSpacing);
			}

			// Подправим значение по X, чтобы первоначально точно по границе проходила линия
			if (CellsCount != this.Selection.Data2.Index)
				_X = Page.X + Row.Get_CellInfo(this.Selection.Data2.Index).X_grid_start;
			else
				_X = Page.X + Row.Get_CellInfo(this.Selection.Data2.Index - 1).X_grid_end;

			this.Selection.Data2.Min = X_min;
			this.Selection.Data2.Max = X_max;

			this.Selection.Data2.Pos =
				{
					Row  : Pos.Row,
					Cell : Pos.Cell
				};

			if (null != this.Selection.Data2.Min)
				_X = Math.max(_X, this.Selection.Data2.Min);

			if (null != this.Selection.Data2.Max)
				_X = Math.min(_X, this.Selection.Data2.Max);
		}

		this.Selection.Data2.X = _X;
		this.Selection.Data2.Y = _Y;

		this.Selection.Data2.StartCX = _X; // Начальная позиция скорректированная относительно положения границы
		this.Selection.Data2.StartCY = _Y;
		this.Selection.Data2.StartX  = X; // Начальная позиция нажатия мыши (без корректировки)
		this.Selection.Data2.StartY  = Y;
		this.Selection.Data2.Start   = true;

		this.DrawingDocument.LockCursorTypeCur();
	}
};
CTable.prototype.Selection_SetEnd = function(X, Y, CurPage, MouseEvent)
{
	var TablePr = this.Get_CompiledPr(false).TablePr;
	if (CurPage < 0 || CurPage >= this.Pages.length)
		CurPage = 0;

	var Page = this.Pages[CurPage];
	if (this.Selection.Type2 === table_Selection_Border)
	{
		var LogicDocument = this.LogicDocument;
		if (!LogicDocument || true !== LogicDocument.CanEdit() || this.Selection.Data2.PageNum != CurPage)
			return;

		var _X = X;
		var _Y = Y;

		// Проверяем, случайное нажатие на границу. (т.е. случайное однократное нажатие или с малым смещением)
		if (true !== this.Selection.Data2.Start || Math.abs(X - this.Selection.Data2.StartX) > 0.05 || Math.abs(Y - this.Selection.Data2.StartY) > 0.05)
		{
			_X                         = this.DrawingDocument.CorrectRulerPosition(X);
			_Y                         = this.DrawingDocument.CorrectRulerPosition(Y);
			this.Selection.Data2.Start = false;
		}
		else
		{
			_X = this.Selection.Data2.X;
			_Y = this.Selection.Data2.Y;
		}

		if (true === this.Selection.Data2.bCol)
			_X = this.private_UpdateTableRulerOnBorderMove(_X);
		else
			_Y = this.private_UpdateTableRulerOnBorderMove(_Y);

		this.Selection.Data2.X = _X;
		this.Selection.Data2.Y = _Y;

		if (MouseEvent.Type === AscCommon.g_mouse_event_type_up)
		{
			// Обрабатываем случай, когда граница не изменила своего первоначального положения
			if (Math.abs(_X - this.Selection.Data2.StartCX) < 0.001 && Math.abs(_Y - this.Selection.Data2.StartCY) < 0.001)
			{
				this.Selection.Type2 = table_Selection_Common;
				this.Selection.Data2 = null;

				return;
			}

			if (false === LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
					Type      : AscCommon.changestype_2_Element_and_Type,
					Element   : this,
					CheckType : AscCommon.changestype_Table_Properties
				}))
			{
				LogicDocument.StartAction(AscDFH.historydescription_Document_MoveTableBorder);

				if (true === this.Selection.Data2.bCol)
				{
					// Найдем колонку в TableGrid, с которой мы работаем
					var Index  = this.Selection.Data2.Index;
					var CurRow = this.Selection.Data2.Pos.Row;
					var Row    = this.Content[CurRow];

					var Col = 0;

					// границ на 1 больше, чем самих ячеек в строке
					if (Index === this.Markup.Cols.length)
						Col = Row.Get_CellInfo(Index - 1).StartGridCol + Row.Get_Cell(Index - 1).Get_GridSpan();
					else
						Col = Row.Get_CellInfo(Index).StartGridCol;

					var Dx = _X - (Page.X + this.TableSumGrid[Col - 1]);

					// Строим новую секту для таблицы
					var Rows_info = [];

					// Если граница, которую мы двигаем не попадает в селект, тогда работает, как будто селекта и нет
					var bBorderInSelection = false;
					if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 && !this.bPresentation)
					{
						var CellsFlag = [];
						for (CurRow = 0; CurRow < this.Content.length; CurRow++)
						{
							CellsFlag[CurRow] = [];
							Row               = this.Content[CurRow];
							var CellsCount    = Row.Get_CellsCount();
							for (var CurCell = 0; CurCell < CellsCount; CurCell++)
							{
								CellsFlag[CurRow][CurCell] = 0;
							}
						}

						var CurSelectedCell  = this.Selection.Data[0];
						var CurSelectedIndex = 0;
						for (CurRow = 0; CurRow < this.Content.length; CurRow++)
						{
							Row            = this.Content[CurRow];
							var CellsCount = Row.Get_CellsCount();
							for (var CurCell = 0; CurCell < CellsCount; CurCell++)
							{
								if (CurSelectedCell.Cell === CurCell && CurSelectedCell.Row === CurRow)
								{
									CellsFlag[CurRow][CurCell] = 1;

									var StartGridCol = Row.Get_CellInfo(CurCell).StartGridCol;
									var GridSpan     = Row.Get_Cell(CurCell).Get_GridSpan();
									var VMergeCount  = this.Internal_GetVertMergeCount(CurRow, StartGridCol, GridSpan);

									if (CurRow === this.Selection.Data2.Pos.Row && Col >= StartGridCol && Col <= StartGridCol + GridSpan)
										bBorderInSelection = true;

									for (var TempIndex = 1; TempIndex < VMergeCount; TempIndex++)
									{
										var TempCell = this.private_GetCellIndexByStartGridCol(CurRow + TempIndex, StartGridCol);
										if (-1 != TempCell)
										{
											CellsFlag[CurRow + TempIndex][TempCell] = 1;

											if (CurRow + TempIndex === this.Selection.Data2.Pos.Row && Col >= StartGridCol && Col <= StartGridCol + GridSpan)
												bBorderInSelection = true;
										}
									}

									if (CurSelectedIndex < this.Selection.Data.length - 1)
										CurSelectedCell = this.Selection.Data[++CurSelectedIndex];
									else
										CurSelectedCell = {Row : -1, Cell : -1};
								}
							}
						}

					}

					var OldTableInd = TablePr.TableInd;
					var NewTableInd = TablePr.TableInd;
					if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && true === bBorderInSelection && !this.bPresentation)
					{
						var BeforeFlag   = false;
						var BeforeSpace2 = null;
						if (0 === Col)
						{
							BeforeSpace2 = _X - Page.X;

							if (BeforeSpace2 < 0)
							{
								Page.X += BeforeSpace2;

								if (true === this.Is_Inline())
									NewTableInd = NewTableInd + BeforeSpace2;
								else
									this.Internal_UpdateFlowPosition(Page.X, Page.Y);
							}
						}

						var BeforeSpace = null;
						if (0 === Index && 0 != Col && _X < Page.X)
						{
							BeforeSpace = Page.X - _X;
							Page.X -= BeforeSpace;

							if (true === this.Is_Inline())
								NewTableInd = NewTableInd - BeforeSpace;
							else
								this.Internal_UpdateFlowPosition(Page.X, Page.Y);
						}

						for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
						{
							Rows_info[nCurRow] = [];
							oRow               = this.GetRow(nCurRow);

							var oBeforeInfo = oRow.GetBefore();
							var WBefore     = 0;

							if (null === BeforeSpace2)
							{
								if (oBeforeInfo.Grid > 0 && Col === oBeforeInfo.Grid && 1 === CellsFlag[nCurRow][0])
								{
									WBefore     = this.TableSumGrid[oBeforeInfo.Grid - 1] + Dx;
								}
								else
								{
									if (null != BeforeSpace)
										WBefore = this.TableSumGrid[oBeforeInfo.Grid - 1] + BeforeSpace;
									else
										WBefore = this.TableSumGrid[oBeforeInfo.Grid - 1];
								}
							}
							else
							{
								if (BeforeSpace2 > 0)
								{
									if (0 === oBeforeInfo.Grid && 1 === CellsFlag[nCurRow][0])
										WBefore = BeforeSpace2;
									else if (0 != oBeforeInfo.Grid)
										WBefore = this.TableSumGrid[oBeforeInfo.Grid - 1];
								}
								else
								{
									if (0 === oBeforeInfo.Grid && 1 != CellsFlag[nCurRow][0])
										WBefore = -BeforeSpace2;
									else if (0 != oBeforeInfo.Grid)
										WBefore = -BeforeSpace2 + this.TableSumGrid[oBeforeInfo.Grid - 1];
								}
							}

							if (WBefore > 0.001)
								Rows_info[nCurRow].push({W : WBefore, Type : -1, GridSpan : 1});

							var TempDx = Dx;
							var isFindLeft = true, isFindRight = false;
							for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
							{
								var oCell           = oRow.GetCell(nCurCell);
								var oCellMargins    = oCell.GetMargins();
								var nCellGridStart  = oRow.GetCellInfo(nCurCell).StartGridCol;
								var nCellGridEnd    = nCellGridStart + oCell.GetGridSpan() - 1;

								var nCellW = 0;

								if (isFindLeft)
								{
									if (nCellGridStart === Col && 1 === CellsFlag[nCurRow][nCurCell])
									{
										isFindLeft  = false;
										isFindRight = false;
										nCellW      = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[Col - 1] - Dx;
									}
									else
									{
										if (((nCellGridEnd + 1 < Col && (this.TableSumGrid[Col - 1] - this.TableSumGrid[nCellGridEnd]) < 0.635)
											|| (nCellGridEnd + 1 === Col)
											|| (nCellGridEnd + 1 > Col && (this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[Col - 1]) < 0.635))
											&& (1 === CellsFlag[nCurRow][nCurCell] || (nCurCell + 1 < nCellsCount && 1 === CellsFlag[nCurRow][nCurCell + 1])))
										{
											isFindLeft = false;
											nCellW     = this.TableSumGrid[Col - 1] - this.TableSumGrid[nCellGridStart - 1] + Dx;
										}

										if (isFindLeft)
											nCellW = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[nCellGridStart - 1];

										var _nCellW = Math.max(1, Math.max(nCellW, oCellMargins.Left.W + oCellMargins.Right.W));
										if (!isFindLeft)
										{
											TempDx      = _nCellW - (this.TableSumGrid[Col - 1] - this.TableSumGrid[nCellGridStart - 1]);
											isFindRight = true;
										}
									}
								}
								else if (isFindRight)
								{
									isFindRight = false;
									nCellW = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[Col - 1] - TempDx;
								}
								else
								{
									nCellW = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[nCellGridStart - 1];
								}

								nCellW = Math.max(1, Math.max(nCellW, oCellMargins.Left.W + oCellMargins.Right.W));

								Rows_info[nCurRow].push({W : nCellW, Type : 0, GridSpan : 1});
							}
						}

						// Возможно, что во всех рядах RowsInfo в начале есть запись BeforeGrid
						var MinBefore = 0;
						for (CurRow = 0; CurRow < this.Content.length; CurRow++)
						{
							if (-1 != Rows_info[CurRow][0].Type)
							{
								MinBefore = 0;
								break;
							}

							if (0 === MinBefore || MinBefore > Rows_info[CurRow][0].W)
								MinBefore = Rows_info[CurRow][0].W;
						}

						if (0 != MinBefore)
						{
							for (CurRow = 0; CurRow < this.Content.length; CurRow++)
							{
								if (Math.abs(MinBefore - Rows_info[CurRow][0].W) < 0.001)
									Rows_info[CurRow].splice(0, 1);
								else // if ( MinBefore < Rows_info[CurRow][0].W )
									Rows_info[CurRow][0].W -= MinBefore;
							}

							Page.X += MinBefore;
							if (true === this.Is_Inline())
								NewTableInd = NewTableInd + MinBefore;
							else
								this.Internal_UpdateFlowPosition(Page.X, Page.Y);
						}
					}
					else
					{
						var BeforeFlag   = false;
						var BeforeSpace2 = null;
						if (0 === Col)
						{
							BeforeSpace2 = Page.X - _X;

							if (-BeforeSpace2 > this.TableSumGrid[0])
							{
								BeforeFlag = true;
								Page.X += this.TableSumGrid[0];
							}
							else
								Page.X += Dx;

							if (true === this.Is_Inline())
							{
								if (-BeforeSpace2 > this.TableSumGrid[0])
									NewTableInd = NewTableInd + this.TableSumGrid[0];
								else
									NewTableInd = NewTableInd + Dx;
							}
							else
								this.Internal_UpdateFlowPosition(Page.X, Page.Y);
						}

						var BeforeSpace = null;
						if (0 === Index && 0 != Col && _X < Page.X)
						{
							BeforeSpace = Page.X - _X;
							Page.X -= BeforeSpace;
							if (true === this.Is_Inline())
								NewTableInd = NewTableInd - BeforeSpace;
							else
								this.Internal_UpdateFlowPosition(Page.X, Page.Y);
						}

						for (nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
						{
							Rows_info[nCurRow] = [];
							oRow               = this.GetRow(nCurRow);

							var oBeforeInfo = oRow.GetBefore();
							var WBefore     = 0;
							if (oBeforeInfo.Grid > 0 && Col === oBeforeInfo.Grid)
							{
								WBefore     = this.TableSumGrid[oBeforeInfo.Grid - 1] + Dx;
							}
							else
							{
								if (null != BeforeSpace)
									WBefore = this.TableSumGrid[oBeforeInfo.Grid - 1] + BeforeSpace;
								else
									WBefore = this.TableSumGrid[oBeforeInfo.Grid - 1];

								if (null != BeforeSpace2)
								{
									if (oBeforeInfo.Grid > 0)
									{
										if (true === BeforeFlag)
											WBefore = this.TableSumGrid[oBeforeInfo.Grid - 1] - this.TableSumGrid[0];
										else
											WBefore = this.TableSumGrid[oBeforeInfo.Grid - 1] + BeforeSpace2;

									}
									else if (0 === oBeforeInfo.Grid && true === BeforeFlag)
									{
										WBefore = ( -BeforeSpace2 ) - this.TableSumGrid[0];
									}
								}
							}

							if (WBefore > 0.001)
								Rows_info[nCurRow].push({W : WBefore, Type : -1, GridSpan : 1});

							var TempDx     = Dx;
							var isFindLeft = true, isFindRight = false;
							for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
							{
								var oCell           = oRow.GetCell(nCurCell);
								var oCellMargins    = oCell.GetMargins();
								var nCellGridStart  = oRow.GetCellInfo(nCurCell).StartGridCol;
								var nCellGridEnd    = nCellGridStart + oCell.GetGridSpan() - 1;

								var nCellW = 0;

								if (isFindLeft)
								{
									if (nCellGridStart === Col)
									{
										isFindLeft  = false;
										isFindRight = false;
										nCellW      = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[Col - 1] - Dx;
									}
									else
									{
										if ((nCellGridEnd + 1 < Col && (this.TableSumGrid[Col - 1] - this.TableSumGrid[nCellGridEnd]) < 0.635)
											|| (nCellGridEnd + 1 === Col)
											|| (nCellGridEnd + 1 > Col && (this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[Col - 1]) < 0.635))
										{
											isFindLeft = false;
											nCellW     = this.TableSumGrid[Col - 1] - this.TableSumGrid[nCellGridStart - 1] + Dx;
										}

										if (isFindLeft)
											nCellW = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[nCellGridStart - 1];

										var _nCellW = Math.max(1, Math.max(nCellW, oCellMargins.Left.W + oCellMargins.Right.W));
										if (!isFindLeft)
										{
											TempDx      = _nCellW - (this.TableSumGrid[Col - 1] - this.TableSumGrid[nCellGridStart - 1]);
											isFindRight = true;
										}
									}
								}
								else if (isFindRight)
								{
									isFindRight = false;
									nCellW = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[Col - 1] - TempDx;
								}
								else
								{
									nCellW = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[nCellGridStart - 1];
								}

								nCellW = Math.max(1, Math.max(nCellW, oCellMargins.Left.W + oCellMargins.Right.W));

								Rows_info[nCurRow].push({W : nCellW, Type : 0, GridSpan : 1});
							}
						}
					}

					if (Math.abs(NewTableInd - OldTableInd) > 0.001)
						this.Set_TableInd(NewTableInd);

					var oTablePr = this.Get_CompiledPr(false).TablePr;
					if (tbllayout_AutoFit === oTablePr.TableLayout)
						this.SetTableLayout(tbllayout_Fixed);

					this.Internal_CreateNewGrid(Rows_info);

					if (undefined !== oTablePr.TableW && tblwidth_Auto !== oTablePr.TableW.Type)
					{
						var nTableW = 0;
						for (var nCurCol = 0, nColsCount = this.TableGrid.length; nCurCol < nColsCount; ++nCurCol)
							nTableW += this.TableGrid[nCurCol];

						if (tblwidth_Pct === oTablePr.TableW.Type)
						{
							var nPctWidth = this.private_RecalculatePercentWidth();
							if (nPctWidth < 0.01)
								this.Set_TableW(tblwidth_Auto, 0);
							else
								this.Set_TableW(tblwidth_Pct, nTableW / nPctWidth * 100);
						}
						else
						{
							this.Set_TableW(tblwidth_Mm, nTableW);
						}
					}

					this.private_RecalculateGrid();
				}
				else
				{
					var RowIndex = this.Pages[this.Selection.Data2.PageNum].FirstRow + this.Selection.Data2.Index;
					if (0 === RowIndex)
					{
						if (true === this.Is_Inline())
						{
							// Ничего не делаем
						}
						else
						{
							var Dy = _Y - this.Markup.Rows[0].Y;
							Page.Y += Dy;
							this.Internal_UpdateFlowPosition(Page.X, Page.Y);

							//var NewH = this.Markup.Rows[0].H + Dy;
							//this.Content[0].Set_Height( NewH, Asc.linerule_AtLeast );
						}
					}
					else
					{
						if (this.Selection.Data2.PageNum > 0 && 0 === this.Selection.Data2.Index)
						{
							// Ничего не делаем
						}
						else
						{
							var _Y_old = this.Markup.Rows[this.Selection.Data2.Index - 1].Y + this.Markup.Rows[this.Selection.Data2.Index - 1].H;
							var Dy     = _Y - _Y_old;
							var NewH   = this.Markup.Rows[this.Selection.Data2.Index - 1].H + Dy;
							this.Content[RowIndex - 1].Set_Height(NewH, linerule_AtLeast);
						}
					}
				}

				LogicDocument.Recalculate();
				LogicDocument.FinalizeAction();
			}

			this.Selection.Type2 = table_Selection_Common;
			this.Selection.Data2 = null;
		}

		return;
	}
	else if (table_Selection_Border_InnerTable === this.Selection.Type2)
	{
		var Cell = this.Selection.Data2;
		Cell.Content_Selection_SetEnd(X, Y, CurPage - Cell.Content.Get_StartPage_Relative(), MouseEvent);

		if (MouseEvent.Type === AscCommon.g_mouse_event_type_up)
		{
			this.Selection.Type2 = table_Selection_Common;
			this.Selection.Data2 = null;
		}

		return;
	}

	var oTempPos = this.Internal_GetCellByXY(X, Y, CurPage);

	var Pos = {
		Row  : oTempPos.Row,
		Cell : oTempPos.Cell
	};

	if (table_Selection_Rows === this.Selection.Type2)
	{
		Pos.Cell = this.GetRow(Pos.Row).GetCellsCount() - 1;
	}
	else if (table_Selection_Columns === this.Selection.Type2)
	{
		var oRow     = this.GetRow(oTempPos.Row);
		var nEndRow  = this.GetRowsCount() - 1;
		var nEndCell = this.private_GetCellIndexByStartGridCol(nEndRow, oRow.GetCellInfo(oTempPos.Cell).StartGridCol, true);

		if (-1 !== nEndCell)
		{
			Pos.Row  = nEndRow;
			Pos.Cell = nEndCell;
		}
	}

	this.Content[Pos.Row].Get_Cell(Pos.Cell).Content_SetCurPosXY(X, Y);
	this.Selection.Data              = null;
	this.Selection.EndPos.Pos        = Pos;
	this.Selection.EndPos.X          = X;
	this.Selection.EndPos.Y          = Y;
	this.Selection.EndPos.PageIndex  = CurPage;
	this.Selection.EndPos.MouseEvent = MouseEvent;
	this.Selection.CurRow            = Pos.Row;

	// При селекте внутри ячейки мы селектим содержимое ячейки
	if (table_Selection_Common === this.Selection.Type2 && this.Parent.IsSelectedSingleElement() && this.Selection.StartPos.Pos.Row === this.Selection.EndPos.Pos.Row && this.Selection.StartPos.Pos.Cell === this.Selection.EndPos.Pos.Cell)
	{
		this.CurCell.Content_Selection_SetStart(this.Selection.StartPos.X, this.Selection.StartPos.Y, this.Selection.StartPos.PageIndex - this.CurCell.Content.Get_StartPage_Relative(), this.Selection.StartPos.MouseEvent);

		this.Selection.Type = table_Selection_Text;

		this.CurCell.Content_Selection_SetEnd(X, Y, CurPage - this.CurCell.Content.Get_StartPage_Relative(), MouseEvent);

		if (AscCommon.g_mouse_event_type_up == MouseEvent.Type)
			this.Selection.Start = false;

		if (false === this.CurCell.Content.Selection.Use)
		{
			this.Selection.Use   = false;
			this.Selection.Start = false;
			this.MoveCursorToXY(X, Y, false, false, CurPage);
			return;
		}
	}
	else
	{
		if (AscCommon.g_mouse_event_type_up === MouseEvent.Type)
		{
			this.Selection.Start = false;
			this.CurCell         = this.Content[Pos.Row].Get_Cell(Pos.Cell);

			if (table_Selection_Cells === this.Selection.Type2
				&& this.Selection.StartPos.Pos.Cell === this.Selection.EndPos.Pos.Cell
				&& this.Selection.StartPos.Pos.Row === this.Selection.EndPos.Pos.Row
				&& MouseEvent.ClickCount > 1
				&& 0 === MouseEvent.ClickCount % 2)
			{
				this.Selection.StartPos.Pos.Cell = 0;
				this.Selection.EndPos.Pos.Cell   = this.GetRow(this.Selection.StartPos.Pos.Row).GetCellsCount() - 1;
			}
		}

		this.Selection.Type = table_Selection_Cell;
		this.private_UpdateSelectedCellsArray(table_Selection_Rows === this.Selection.Type2 ? true : false);
	}
};
CTable.prototype.Selection_Stop = function()
{
	if (true != this.Selection.Use)
		return;

	this.Selection.Start = false;
	var Cell             = this.Content[this.Selection.StartPos.Pos.Row].Get_Cell(this.Selection.StartPos.Pos.Cell);
	Cell.Content_Selection_Stop();
};
CTable.prototype.DrawSelectionOnPage = function(CurPage)
{
	if (false === this.Selection.Use)
		return;

	if (CurPage < 0 || CurPage >= this.Pages.length)
		return;

	var Page    = this.Pages[CurPage];
	var PageAbs = this.private_GetAbsolutePageIndex(CurPage);

	switch (this.Selection.Type)
	{
		case table_Selection_Cell:
		{
			for (var Index = 0; Index < this.Selection.Data.length; ++Index)
			{
				var Pos      = this.Selection.Data[Index];
				var Row      = this.Content[Pos.Row];
				var Cell     = Row.Get_Cell(Pos.Cell);
				var CellInfo = Row.Get_CellInfo(Pos.Cell);
				var CellMar  = Cell.GetMargins();

				var X_start = (0 === Pos.Cell ? Page.X + CellInfo.X_content_start : Page.X + CellInfo.X_cell_start);
				var X_end   = Page.X + CellInfo.X_cell_end;

				var Cell_Pages   = Cell.Content_Get_PagesCount();
				var Cell_PageRel = CurPage - Cell.Content.Get_StartPage_Relative();
				if (Cell_PageRel < 0 || Cell_PageRel >= Cell_Pages)
					continue;

				var Bounds   = Cell.Content_Get_PageBounds(Cell_PageRel);
				var Y_offset = Cell.Temp.Y_VAlign_offset[Cell_PageRel];

				var RowIndex = 0 != Cell_PageRel ? this.Pages[CurPage].FirstRow : Pos.Row;

				if (true === Cell.Is_VerticalText())
				{
					var X_start       = Page.X + CellInfo.X_cell_start;
					var TextDirection = Cell.Get_TextDirection();

					var MergeCount = this.private_GetVertMergeCountOnPage(CurPage, RowIndex, CellInfo.StartGridCol, Cell.Get_GridSpan());
					if (MergeCount <= 0)
						continue;

					var LastRow = Math.min(RowIndex + MergeCount - 1, this.Pages[CurPage].LastRow);
					var Y_start = this.RowsInfo[RowIndex].Y[CurPage] + this.RowsInfo[RowIndex].TopDy[CurPage] + CellMar.Top.W;
					var Y_end   = this.TableRowsBottom[LastRow][CurPage] - CellMar.Bottom.W;

					if (TextDirection === textdirection_BTLR)
					{
						var SelectionW = Math.min(X_end - X_start - CellMar.Left.W, Bounds.Bottom - Bounds.Top);
						this.DrawingDocument.AddPageSelection(PageAbs, X_start + CellMar.Left.W + Y_offset, Y_start, SelectionW, Y_end - Y_start);
					}
					else if (TextDirection === textdirection_TBRL)
					{
						var SelectionW = Math.min(X_end - X_start - CellMar.Right.W, Bounds.Bottom - Bounds.Top);
						this.DrawingDocument.AddPageSelection(PageAbs, X_end - CellMar.Right.W - Y_offset - SelectionW, Y_start, SelectionW, Y_end - Y_start);
					}
				}
				else
				{
					this.DrawingDocument.AddPageSelection(PageAbs, X_start, this.RowsInfo[RowIndex].Y[CurPage] + this.RowsInfo[RowIndex].TopDy[CurPage] + CellMar.Top.W + Y_offset, X_end - X_start, Bounds.Bottom - Bounds.Top);
				}
			}
			break;
		}
		case table_Selection_Text:
		{
			var Cell         = this.Content[this.Selection.StartPos.Pos.Row].Get_Cell(this.Selection.StartPos.Pos.Cell);
			var Cell_PageRel = CurPage - Cell.Content.Get_StartPage_Relative();
			Cell.Content_DrawSelectionOnPage(Cell_PageRel);
			break;
		}
	}
};
CTable.prototype.RemoveSelection = function()
{
	if (false === this.Selection.Use)
		return;

	this.CurCell = null;
	if (this.GetRowsCount() > 0)
	{

		var oRow  = this.GetRow(this.Selection.EndPos.Pos.Row);
		var oCell = null;
		if (!oRow)
			oCell = this.GetRow(0).GetCell(0);
		else
			oCell = oRow.GetCellsCount() > this.Selection.EndPos.Pos.Cell ? oRow.GetCell(this.Selection.EndPos.Pos.Cell) : oRow.GetCell(0);

		if (oCell)
		{
			this.CurCell = oCell;
			this.CurCell.GetContent().RemoveSelection();
		}
	}

	this.Selection.Use   = false;
	this.Selection.Start = false;

	this.Selection.StartPos.Pos = {Row : 0, Cell : 0};
	this.Selection.EndPos.Pos   = {Row : 0, Cell : 0};

	this.Markup.Internal.RowIndex  = 0;
	this.Markup.Internal.CellIndex = 0;
	this.Markup.Internal.PageNum   = 0;
};
CTable.prototype.CheckPosInSelection = function(X, Y, CurPage, NearPos)
{
	if (undefined != NearPos)
	{
		if ((true === this.Selection.Use && table_Selection_Cell === this.Selection.Type) || true === this.ApplyToAll)
		{
			var Cells_array = this.GetSelectionArray();
			for (var Index = 0; Index < Cells_array.length; Index++)
			{
				var CurPos      = Cells_array[Index];
				var CurCell     = this.Content[CurPos.Row].Get_Cell(CurPos.Cell);
				var CellContent = CurCell.Content;

				CellContent.Set_ApplyToAll(true);

				if (true === CellContent.CheckPosInSelection(0, 0, 0, NearPos))
				{
					CellContent.Set_ApplyToAll(false);
					return true;
				}

				CellContent.Set_ApplyToAll(false);
			}
		}
		else
			return this.CurCell.Content_CheckPosInSelection(0, 0, 0, NearPos);

		return false;
	}
	else
	{
		if (CurPage < 0 || CurPage >= this.Pages.length)
			return false;

		var oHitInfo = this.private_CheckHitInBorder(X, Y, CurPage);
		if (oHitInfo.CellSelection || oHitInfo.RowSelection || oHitInfo.ColumnSelection)
			return false;

		var CellPos = this.Internal_GetCellByXY(X, Y, CurPage);
		if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		{
			for (var Index = 0; Index < this.Selection.Data.length; Index++)
			{
				var CurPos = this.Selection.Data[Index];

				if (CurPos.Cell === CellPos.Cell && CurPos.Row === CellPos.Row)
					return true;
			}

			return false;
		}
		else if (CellPos.Cell === this.CurCell.Index && CellPos.Row === this.CurCell.Row.Index)
			return this.CurCell.Content_CheckPosInSelection(X, Y, CurPage - this.CurCell.Content.Get_StartPage_Relative(), undefined);

		return false;
	}
};
CTable.prototype.IsSelectionEmpty = function(bCheckHidden)
{
	if (true === this.Selection.Use)
	{
		if (table_Selection_Cell === this.Selection.Type)
			return false;
		else
			return this.CurCell.Content.IsSelectionEmpty(bCheckHidden);
	}

	return true;
};
CTable.prototype.SelectAll = function(nDirection)
{
	this.Selection.Use   = true;
	this.Selection.Start = false;
	this.Selection.Type  = table_Selection_Cell;
	this.Selection.Type2 = table_Selection_Common;

	this.Selection.Data2 = null;

	if (nDirection && nDirection < 0)
	{
		this.Selection.EndPos.Pos       = {
			Row  : 0,
			Cell : 0
		};
		this.Selection.EndPos.PageIndex = 0;

		this.Selection.StartPos.Pos       = {
			Row  : this.Content.length - 1,
			Cell : this.Content[this.Content.length - 1].Get_CellsCount() - 1
		};
		this.Selection.StartPos.PageIndex = this.Pages.length - 1;
	}
	else
	{
		this.Selection.StartPos.Pos       = {
			Row  : 0,
			Cell : 0
		};
		this.Selection.StartPos.PageIndex = 0;

		this.Selection.EndPos.Pos       = {
			Row  : this.Content.length - 1,
			Cell : this.Content[this.Content.length - 1].Get_CellsCount() - 1
		};
		this.Selection.EndPos.PageIndex = this.Pages.length - 1;
	}

	this.private_UpdateSelectedCellsArray();
};
/**
 * В данной функции проверяется идет ли выделение таблицы до конца таблицы.
 */
CTable.prototype.IsSelectionToEnd = function()
{
	if (true === this.ApplyToAll || (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0))
	{
		var Cells_array = this.GetSelectionArray();
		var Len         = Cells_array.length;

		if (Len < 1)
			return false;

		var Pos = Cells_array[Len - 1];
		if (Pos.Row !== this.Content.length - 1 || Pos.Cell !== this.Content[Pos.Row].Get_CellsCount() - 1)
			return false;

		return true;
	}
	else
		return false;
};
CTable.prototype.SetSelectionUse = function(isUse)
{
	if (true === isUse)
		this.Selection.Use = true;
	else
		this.RemoveSelection();
};
CTable.prototype.SetSelectionToBeginEnd = function(isSelectionStart, isElementStart)
{
	var Pos;
	if (false === isElementStart)
	{
		var Row  = this.Content.length - 1;
		var Cell = this.Content[Row].Get_CellsCount() - 1;

		Pos = {Row : Row, Cell : Cell};
	}
	else
	{
		Pos = {Row : 0, Cell : 0};
	}

	if (isSelectionStart)
		this.Selection.StartPos.Pos = Pos;
	else
		this.Selection.EndPos.Pos = Pos;


	this.private_UpdateSelectedCellsArray();
};
CTable.prototype.MoveCursorToStartPos = function(AddToSelect)
{
	if (true === AddToSelect)
	{
		var StartRow = ( true === this.Selection.Use ? this.Selection.StartPos.Pos.Row : this.CurCell.Row.Index );
		var EndRow   = 0;

		this.Selection.Use          = true;
		this.Selection.Start        = false;
		this.Selection.Type         = table_Selection_Cell;
		this.Selection.Type2        = table_Selection_Common;
		this.Selection.StartPos.Pos = {Row : StartRow, Cell : this.Content[StartRow].Get_CellsCount() - 1};
		this.Selection.EndPos.Pos   = {Row : EndRow, Cell : 0};
		this.Selection.CurRow       = EndRow;

		this.private_UpdateSelectedCellsArray();
	}
	else
	{
		this.CurCell = this.Content[0].Get_Cell(0);

		this.Selection.Use          = false;
		this.Selection.Start        = false;
		this.Selection.StartPos.Pos = {Row : 0, Cell : 0};
		this.Selection.EndPos.Pos   = {Row : 0, Cell : 0};
		this.Selection.CurRow       = 0;

		this.CurCell.Content_MoveCursorToStartPos();
	}
};
CTable.prototype.MoveCursorToEndPos = function(AddToSelect)
{
	if (true === AddToSelect)
	{
		var StartRow = ( true === this.Selection.Use ? this.Selection.StartPos.Pos.Row : this.CurCell.Row.Index );
		var EndRow   = this.Content.length - 1;

		this.Selection.Use          = true;
		this.Selection.Start        = false;
		this.Selection.Type         = table_Selection_Cell;
		this.Selection.Type2        = table_Selection_Common;
		this.Selection.StartPos.Pos = {Row : StartRow, Cell : 0};
		this.Selection.EndPos.Pos   = {Row : EndRow, Cell : this.Content[EndRow].Get_CellsCount() - 1};
		this.Selection.CurRow       = EndRow;

		this.private_UpdateSelectedCellsArray();
	}
	else
	{
		var Row      = this.Content[this.Content.length - 1];
		this.CurCell = Row.Get_Cell(Row.Get_CellsCount() - 1);

		this.Selection.Use          = false;
		this.Selection.Start        = false;
		this.Selection.StartPos.Pos = {Row : Row.Index, Cell : this.CurCell.Index};
		this.Selection.EndPos.Pos   = {Row : Row.Index, Cell : this.CurCell.Index};
		this.Selection.CurRow       = Row.Index;

		this.CurCell.Content_MoveCursorToEndPos();
	}
};
CTable.prototype.IsCursorAtBegin = function(bOnlyPara)
{
	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
	{
		if (0 === this.CurCell.Index && 0 === this.CurCell.Row.Index)
		{
			return this.CurCell.Content.IsCursorAtBegin(bOnlyPara);
		}
	}

	return false;
};
CTable.prototype.IsCursorAtEnd = function()
{
	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
	{
		if (0 === this.CurCell.Index && 0 === this.CurCell.Row.Index)
		{
			return this.CurCell.Content.IsCursorAtEnd();
		}
	}

	return false;
};
//----------------------------------------------------------------------------------------------------------------------
// Работаем с содержимым таблицы
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.AddNewParagraph = function()
{
	this.CurCell.Content.AddNewParagraph();
};
CTable.prototype.AddInlineImage = function(W, H, Img, Chart, bFlow)
{
	this.Selection.Use  = true;
	this.Selection.Type = table_Selection_Text;
	this.CurCell.Content.AddInlineImage(W, H, Img, Chart, bFlow);
};
CTable.prototype.AddImages = function(aImages)
{
	this.Selection.Use  = true;
	this.Selection.Type = table_Selection_Text;
	this.CurCell.Content.AddImages(aImages);
};
CTable.prototype.AddSignatureLine = function(oSignatureDrawing)
{
	this.Selection.Use  = true;
	this.Selection.Type = table_Selection_Text;
	this.CurCell.Content.AddSignatureLine(oSignatureDrawing);
};
CTable.prototype.AddOleObject = function(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId)
{
	this.Selection.Use  = true;
	this.Selection.Type = table_Selection_Text;
	this.CurCell.Content.AddOleObject(W, H, nWidthPix, nHeightPix, Img, Data, sApplicationId);
};
CTable.prototype.AddTextArt = function(nStyle)
{
	this.Selection.Use  = true;
	this.Selection.Type = table_Selection_Text;
	this.CurCell.Content.AddTextArt(nStyle);
};
CTable.prototype.AddInlineTable = function(nCols, nRows, nMode)
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		return null;

	return this.CurCell.Content.AddInlineTable(nCols, nRows, nMode);
};
CTable.prototype.Add = function(ParaItem, bRecalculate)
{
	this.AddToParagraph(ParaItem, bRecalculate);
};
CTable.prototype.AddToParagraph = function(ParaItem, bRecalculate)
{
	if (para_TextPr === ParaItem.Type && ( true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ) ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.AddToParagraph(ParaItem, bRecalculate);
			Cell_Content.Set_ApplyToAll(false);
		}

		// Если в TextPr только HighLight, тогда не надо ничего пересчитывать, только перерисовываем
		if (true === ParaItem.Value.Check_NeedRecalc())
		{
			if (Cells_array[0].Row - 1 >= 0)
				this.Internal_RecalculateFrom(Cells_array[0].Row - 1, 0, true, true);
			else
			{
				this.Internal_Recalculate_1();
			}
		}
		else
		{
			this.Parent.OnContentReDraw(this.Get_AbsolutePage(0), this.Get_AbsolutePage(this.Pages.length - 1));
		}
	}
	else
	{
		this.CurCell.Content.AddToParagraph(ParaItem, bRecalculate);
	}
};
CTable.prototype.ClearParagraphFormatting = function(isClearParaPr, isClearTextPr)
{
	if (true === this.ApplyToAll || (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.ClearParagraphFormatting(isClearParaPr, isClearTextPr);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		this.CurCell.Content.ClearParagraphFormatting(isClearParaPr, isClearTextPr);
	}
};
CTable.prototype.PasteFormatting = function(TextPr, ParaPr, ApplyPara)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.PasteFormatting(TextPr, ParaPr, true);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		this.CurCell.Content.PasteFormatting(TextPr, ParaPr, false);
	}
};
CTable.prototype.Remove = function(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();

		if (true === bOnTextAdd && Cells_array.length > 0)
		{
			// Снимаем выделением со всех ячеек, кроме первой, попавшей в выделение
			var Pos  = Cells_array[0];
			var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
			Cell.Content.SelectAll();
			Cell.Content.Remove(Count, bOnlyText, bRemoveOnlySelection, true, false);

			this.CurCell = Cell;

			this.Selection.Use   = false;
			this.Selection.Start = false;

			this.Selection.StartPos.Pos = {Row : Cell.Row.Index, Cell : Cell.Index};
			this.Selection.EndPos.Pos   = {Row : Cell.Row.Index, Cell : Cell.Index};

			this.Document_SetThisElementCurrent(true);

			editor.WordControl.m_oLogicDocument.Recalculate();
		}
		else
		{
			var Cells_array = this.GetSelectionArray();
			for (var Index = 0; Index < Cells_array.length; Index++)
			{
				var Pos  = Cells_array[Index];
				var Row  = this.Content[Pos.Row];
				var Cell = Row.Get_Cell(Pos.Cell);

				var Cell_Content = Cell.Content;
				Cell_Content.Set_ApplyToAll(true);
				Cell.Content.Remove(Count, bOnlyText, bRemoveOnlySelection, false, false);
				Cell_Content.Set_ApplyToAll(false);
			}

			// Снимаем выделение
			var Pos      = Cells_array[0];
			var Cell     = this.Content[Pos.Row].Get_Cell(Pos.Cell);
			this.CurCell = Cell;

			this.Selection.Use   = false;
			this.Selection.Start = false;

			this.Selection.StartPos.Pos = {Row : Cell.Row.Index, Cell : Cell.Index};
			this.Selection.EndPos.Pos   = {Row : Cell.Row.Index, Cell : Cell.Index};

			if (Cells_array[0].Row - 1 >= 0)
				this.Internal_RecalculateFrom(Cells_array[0].Row - 1, 0, true, true);
			else
			{
				this.Internal_Recalculate_1();
			}
		}
	}
	else
	{
		this.CurCell.Content.Remove(Count, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);

		if (false === this.CurCell.Content.IsSelectionUse())
		{
			var Cell = this.CurCell;

			this.Selection.Use   = false;
			this.Selection.Start = false;

			this.Selection.StartPos.Pos = {Row : Cell.Row.Index, Cell : Cell.Index};
			this.Selection.EndPos.Pos   = {Row : Cell.Row.Index, Cell : Cell.Index};
		}
	}
};
CTable.prototype.GetCursorPosXY = function()
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		if (this.Selection.Data.length < 0)
			return {X : 0, Y : 0};

		var Pos  = this.Selection.Data[0];
		var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
		var Para = Cell.Content.Get_FirstParagraph();

		return {X : Para.X, Y : Para.Y}
	}
	else
		return this.CurCell.Content.GetCursorPosXY();
};
CTable.prototype.MoveCursorLeft = function(AddToSelect, Word)
{
	if (true === this.Selection.Use && this.Selection.Type === table_Selection_Cell)
	{
		if (true === AddToSelect)
		{
			var StartPos = this.Selection.StartPos.Pos;
			var EndPos   = this.Selection.EndPos.Pos;

			if (StartPos.Cell == EndPos.Cell && StartPos.Row == EndPos.Row && this.Parent.IsSelectedSingleElement())
			{
				// Если была выделена одна ячейка, тогда мы убираем выделение по ячейкам
				this.Selection.Type = table_Selection_Text;
				return true;
			}
			else
			{
				// Если текущая ячейка - первая в первой строке и данная таблица - первый элемент, тогда мы ничего не
				// делаем
				if (0 == EndPos.Cell && 0 == EndPos.Row && ( null === this.Get_DocumentPrev() && true === this.Parent.Is_TopDocument() ))
					return false;

				// Если текущая ячейка - первая в первой строке (и таблица не первый элемент документа),
				// тогда мы выделаяем первую строку

				var bRet = true;
				if (0 == EndPos.Cell && 0 == EndPos.Row || ( !this.Parent.IsSelectedSingleElement() && 0 == EndPos.Row && 0 == StartPos.Row ))
				{
					this.Selection.EndPos.Pos = {Cell : 0, Row : 0};
					bRet                      = false;
				}
				else if (EndPos.Cell > 0 && this.Parent.IsSelectedSingleElement())
					this.Selection.EndPos.Pos = {Cell : EndPos.Cell - 1, Row : EndPos.Row};
				else
					this.Selection.EndPos.Pos = {Cell : 0, Row : EndPos.Row - 1};

				var bForceSelectByLines = false;
				if (false === bRet && true == this.Is_Inline())
					bForceSelectByLines = true;

				this.private_UpdateSelectedCellsArray(bForceSelectByLines);

				return bRet;
			}
		}
		else
		{
			// Перемещаем курсор в начало первой выделенной ячейки
			this.Selection.Use = false;
			var Pos            = this.Selection.Data[0];
			this.CurCell       = this.Content[Pos.Row].Get_Cell(Pos.Cell);
			this.CurCell.Content_MoveCursorToStartPos();
			return true;
		}
	}
	else
	{
		if (false === this.CurCell.Content.MoveCursorLeft(AddToSelect, Word))
		{
			if (false === AddToSelect)
			{
				var nCurCell = this.CurCell.GetIndex();
				var nCurRow  = this.CurCell.GetRow().GetIndex();
				if (0 !== nCurCell || 0 !== nCurRow)
				{
					while (true)
					{
						if (nCurCell > 0)
						{
							nCurCell--;
						}
						else if (nCurRow > 0)
						{
							nCurRow--;
							nCurCell = this.GetRow(nCurRow).GetCellsCount() - 1;
						}
						else
						{
							this.CurCell = this.GetRow(0).GetCell(0);
							break;
						}

						var oTempCell = this.GetRow(nCurRow).GetCell(nCurCell);
						if (vmerge_Restart !== oTempCell.GetVMerge())
							continue;

						this.CurCell = oTempCell;
						break;
					}

					this.CurCell.Content.MoveCursorToEndPos();
				}
				else
				{
					return false;
				}
			}
			else
			{
				// Если текущая ячейка - первая в первой строке и данная таблица - первый элемент, тогда мы ничего не
				// делаем
				if (0 == this.CurCell.Index && 0 == this.CurCell.Row.Index && ( null === this.Get_DocumentPrev() && true === this.Parent.Is_TopDocument() ))
					return false;

				this.Selection.Use  = true;
				this.Selection.Type = table_Selection_Cell;

				// Если текущая ячейка - первая в первой строке (и таблица не первый элемент документа),
				// тогда мы выделаяем первую строку

				var bRet                    = true;
				this.Selection.StartPos.Pos = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};

				if (0 == this.CurCell.Index && 0 == this.CurCell.Row.Index)
				{
					this.Selection.EndPos.Pos = {Cell : this.CurCell.Row.Get_CellsCount() - 1, Row : 0};
					bRet                      = false;
				}
				else if (this.CurCell.Index > 0)
					this.Selection.EndPos.Pos = {Cell : this.CurCell.Index - 1, Row : this.CurCell.Row.Index};
				else
					this.Selection.EndPos.Pos = {Cell : 0, Row : this.CurCell.Row.Index - 1};

				this.private_UpdateSelectedCellsArray();

				return bRet;
			}
		}
		else
		{
			if (true === AddToSelect)
			{
				this.Selection.Use          = true;
				this.Selection.Type         = table_Selection_Text;
				this.Selection.StartPos.Pos = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
				this.Selection.EndPos.Pos   = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
			}

			return true;
		}
	}
};
CTable.prototype.MoveCursorLeftWithSelectionFromEnd = function(Word)
{
	if (true === this.IsSelectionUse())
		this.RemoveSelection();

	if (this.Content.length <= 0)
		return;

	var LastRow = this.Content[this.Content.length - 1];

	// Нам нужно выделить последний ряд таблицы

	this.Selection.Use          = true;
	this.Selection.Type         = table_Selection_Cell;
	this.Selection.StartPos.Pos = {
		Row  : LastRow.Index,
		Cell : LastRow.Get_CellsCount() - 1
	};
	this.Selection.EndPos.Pos   = {
		Row  : LastRow.Index,
		Cell : 0
	};
	this.CurCell                = LastRow.Get_Cell(0);
	this.Selection.Data         = [];

	for (var CellIndex = 0; CellIndex < LastRow.Get_CellsCount(); CellIndex++)
	{
		this.Selection.Data.push({Cell : CellIndex, Row : LastRow.Index});
	}
};
CTable.prototype.MoveCursorRight = function(AddToSelect, Word, FromPaste)
{
	if (true === this.Selection.Use && this.Selection.Type === table_Selection_Cell)
	{
		if (true === AddToSelect)
		{
			var StartPos = this.Selection.StartPos.Pos;
			var EndPos   = this.Selection.EndPos.Pos;

			if (StartPos.Cell == EndPos.Cell && StartPos.Row == EndPos.Row && this.Parent.IsSelectedSingleElement())
			{
				// Если была выделена одна ячейка, тогда мы убираем выделение по ячейкам
				this.Selection.Type = table_Selection_Text;
				return true;
			}
			else
			{
				// Если текущая ячейка - последняя в последней строке, тогда мы выделаяем последнюю строку
				var oLastRow = this.GetRow(this.GetRowsCount() - 1);
				var oEndRow  = this.GetRow(EndPos.Row);

				var bRet = true;

				if (EndPos.Cell < oEndRow.GetCellsCount() - 1 && this.Parent.IsSelectedSingleElement())
				{
					this.Selection.EndPos.Pos = {
						Cell : EndPos.Cell + 1,
						Row  : EndPos.Row
					};
				}
				else if (this.GetRowsCount() - 1 <= EndPos.Row)
				{
					this.Selection.EndPos.Pos = {
						Cell : oLastRow.GetCellsCount() - 1,
						Row  : oLastRow.Index
					};

					bRet = false;
				}
				else
				{
					this.Selection.EndPos.Pos = {
						Cell : this.GetRow(EndPos.Row + 1).GetCellsCount() - 1,
						Row  : EndPos.Row + 1
					};
				}

				var bForceSelectByLines = false;
				if (false === bRet && true == this.Is_Inline())
					bForceSelectByLines = true;

				this.private_UpdateSelectedCellsArray(bForceSelectByLines);

				return bRet;
			}
		}
		else
		{
			// Перемещаем курсор в конец последней выделенной ячейки
			this.Selection.Use = false;
			var Pos            = this.Selection.Data[this.Selection.Data.length - 1];
			this.CurCell       = this.Content[Pos.Row].Get_Cell(Pos.Cell);
			this.CurCell.Content_MoveCursorToEndPos();
			return true;
		}
	}
	else
	{
		if (false === this.CurCell.Content.MoveCursorRight(AddToSelect, Word, FromPaste))
		{
			if (false === AddToSelect)
			{
				var nCurCell    = this.CurCell.GetIndex();
				var nCurRow     = this.CurCell.GetRow().GetIndex();
				var nCellsCount = this.GetRow(nCurRow).GetCellsCount();
				var nRowsCount  = this.GetRowsCount();
				if (this.Content.length - 1 > nCurRow || nCellsCount - 1 > nCurCell)
				{
					while (true)
					{
						if (nCurCell < nCellsCount - 1)
						{
							nCurCell++;
						}
						else if (nCurRow < nRowsCount - 1)
						{
							nCurRow++;
							nCurCell = 0;
							nCellsCount = this.GetRow(nCurRow).GetCellsCount();
						}
						else
						{
							var oLastRow = this.GetRow(this.GetRowsCount() - 1);
							this.CurCell = oLastRow.GetCell(oLastRow.GetCellsCount() - 1);
							break;
						}

						var oTempCell = this.GetRow(nCurRow).GetCell(nCurCell);
						if (vmerge_Restart !== oTempCell.GetVMerge())
							continue;

						this.CurCell = oTempCell;
						break;
					}

					this.CurCell.Content.MoveCursorToStartPos();
				}
				else
				{
					return false;
				}
			}
			else
			{
				this.Selection.Use  = true;
				this.Selection.Type = table_Selection_Cell;

				// Если текущая ячейка - последняя в последней строке, тогда мы выделаяем последнюю строку
				var oLastRow = this.GetRow(this.GetRowsCount() - 1);
				var oCurRow  = this.CurCell.Row;

				this.Selection.StartPos.Pos = {
					Cell : this.CurCell.Index,
					Row  : this.CurCell.Row.Index
				};

				var bRet = true;

				if (this.CurCell.Index < oCurRow.Get_CellsCount() - 1)
				{
					this.Selection.EndPos.Pos = {
						Cell : this.CurCell.Index + 1,
						Row  : this.CurCell.Row.Index
					};
				}
				else if (this.CurCell.Row.Index >= this.GetRowsCount() - 1)
				{
					this.Selection.EndPos.Pos = {
						Cell : oLastRow.GetCellsCount() - 1,
						Row  : oLastRow.Index
					};

					bRet = false;
				}
				else
				{
					this.Selection.EndPos.Pos = {
						Cell : this.GetRow(this.CurCell.Row.Index + 1).GetCellsCount() - 1,
						Row  : this.CurCell.Row.Index + 1
					};
				}

				var bForceSelectByLines = false;
				if (false === bRet && true == this.Is_Inline())
					bForceSelectByLines = true;

				this.private_UpdateSelectedCellsArray(bForceSelectByLines);

				return bRet;
			}
		}
		else
		{
			if (true === AddToSelect)
			{
				this.Selection.Use          = true;
				this.Selection.Type         = table_Selection_Text;
				this.Selection.StartPos.Pos = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
				this.Selection.EndPos.Pos   = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};

			}

			return true;
		}
	}
};
CTable.prototype.MoveCursorRightWithSelectionFromStart = function(Word)
{
	if (true === this.IsSelectionUse())
		this.RemoveSelection();

	if (this.Content.length <= 0)
		return;

	var FirstRow = this.Content[0];

	// Нам нужно выделить первый ряд таблицы
	this.Selection.Use          = true;
	this.Selection.Type         = table_Selection_Cell;
	this.Selection.StartPos.Pos = {
		Row  : 0,
		Cell : 0
	};
	this.Selection.EndPos.Pos   = {
		Row  : 0,
		Cell : FirstRow.Get_CellsCount() - 1
	};
	this.CurCell                = FirstRow.Get_Cell(FirstRow.Get_CellsCount() - 1);
	this.Selection.Data         = [];

	for (var CellIndex = 0; CellIndex < FirstRow.Get_CellsCount(); CellIndex++)
	{
		this.Selection.Data.push({Cell : CellIndex, Row : 0});
	}
};
CTable.prototype.MoveCursorUp = function(AddToSelect)
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		if (true === AddToSelect)
		{
			var bRetValue = true;
			var EndPos    = this.Selection.EndPos.Pos;
			if (0 === EndPos.Row)
			{
				bRetValue = false;
			}
			else
			{
				var EndCell = this.Content[EndPos.Row].Get_Cell(EndPos.Cell);

				var X = EndCell.Content_GetCurPosXY().X;
				var Y = EndCell.Content_GetCurPosXY().Y;

				var PrevRow = this.Content[EndPos.Row - 1];
				var Cell    = null;
				for (var CurCell = 0; CurCell < PrevRow.Get_CellsCount(); CurCell++)
				{
					Cell         = PrevRow.Get_Cell(CurCell);
					var CellInfo = PrevRow.Get_CellInfo(CurCell);
					if (X <= CellInfo.X_grid_end)
						break;
				}

				if (null === Cell)
					return true;

				Cell.Content_SetCurPosXY(X, Y);
				this.CurCell              = Cell;
				this.Selection.EndPos.Pos = {Cell : Cell.Index, Row : Cell.Row.Index};
			}

			var bForceSelectByLines = false;
			if (false === bRetValue && true === this.Is_Inline())
				bForceSelectByLines = true;

			this.private_UpdateSelectedCellsArray(bForceSelectByLines);
			return bRetValue;
		}
		else
		{
			if (this.Selection.Data.length < 0)
				return true;

			var Pos  = this.Selection.Data[0];
			var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
			var Para = Cell.Content.Get_FirstParagraph();
			var X    = Para.X;
			var Y    = Para.Y;

			this.Selection.Use = false;
			if (0 === Pos.Row)
			{
				this.CurCell = Cell;
				this.CurCell.Content.MoveCursorToStartPos();
				this.CurCell.Content_SetCurPosXY(X, Y);

				return false;
			}
			else
			{
				var PrevRow  = this.Content[Pos.Row - 1];
				var PrevCell = null;
				for (var CurCell = 0; CurCell < PrevRow.Get_CellsCount(); CurCell++)
				{
					PrevCell     = PrevRow.Get_Cell(CurCell);
					var CellInfo = PrevRow.Get_CellInfo(CurCell);
					if (X <= CellInfo.X_grid_end)
						break;
				}

				if (null === PrevCell)
					return true;

				PrevCell.Content_MoveCursorUpToLastRow(X, Y, false);
				this.CurCell = PrevCell;
				return true;
			}

		}
	}
	else
	{
		if (false === this.CurCell.Content.MoveCursorUp(AddToSelect))
		{
			// Ничего не делаем, если это "плавающая" таблица или первый элемент документа
			if (0 === this.CurCell.Row.Index && (false === this.Is_Inline() || ( null === this.Get_DocumentPrev() && true === this.Parent.Is_TopDocument() )))
				return true;

			if (true === AddToSelect)
			{
				this.Selection.Use          = true;
				this.Selection.Type         = table_Selection_Cell;
				this.Selection.StartPos.Pos = {Row : this.CurCell.Row.Index, Cell : this.CurCell.Index};

				var bRetValue = true;
				if (0 === this.CurCell.Row.Index)
				{
					this.Selection.EndPos.Pos = {Row : 0, Cell : 0};
					bRetValue                 = false;
				}
				else
				{
					var X       = this.CurCell.Content_GetCurPosXY().X;
					var Y       = this.CurCell.Content_GetCurPosXY().Y;
					var PrevRow = this.Content[this.CurCell.Row.Index - 1];
					var Cell    = null;
					for (var CurCell = 0; CurCell < PrevRow.Get_CellsCount(); CurCell++)
					{
						Cell         = PrevRow.Get_Cell(CurCell);
						var CellInfo = PrevRow.Get_CellInfo(CurCell);
						if (X <= CellInfo.X_grid_end)
							break;
					}

					if (null === Cell)
						return true;

					Cell.Content_SetCurPosXY(X, Y);
					this.CurCell              = Cell;
					this.Selection.EndPos.Pos = {Cell : Cell.Index, Row : Cell.Row.Index};
				}

				var bForceSelectByLines = false;
				if (false === bRetValue && true === this.Is_Inline())
					bForceSelectByLines = true;

				this.private_UpdateSelectedCellsArray(bForceSelectByLines);
				return bRetValue;
			}
			else
			{
				if (0 === this.CurCell.Row.Index)
					return false;
				else
				{
					var X       = this.CurCell.Content_GetCurPosXY().X;
					var Y       = this.CurCell.Content_GetCurPosXY().Y;
					var PrevRow = this.Content[this.CurCell.Row.Index - 1];
					var Cell    = null;
					for (var CurCell = 0; CurCell < PrevRow.Get_CellsCount(); CurCell++)
					{
						Cell         = PrevRow.Get_Cell(CurCell);
						var CellInfo = PrevRow.Get_CellInfo(CurCell);

						if (!CellInfo)
						{
							Cell = null;
							break;
						}

						if (X <= CellInfo.X_grid_end)
							break;
					}

					if (null === Cell)
						return true;

					Cell = this.GetStartMergedCell(Cell.Index, Cell.Row.Index);
					if (!Cell)
						return true;

					Cell.Content_MoveCursorUpToLastRow(X, Y, false);
					this.CurCell              = Cell;
					this.Selection.EndPos.Pos = {Cell : Cell.Index, Row : Cell.Row.Index};
					this.Selection.CurRow     = Cell.Row.Index;

					return true;
				}
			}
		}
		else
		{
			if (true === AddToSelect)
			{
				this.Selection.Use          = true;
				this.Selection.Type         = table_Selection_Text;
				this.Selection.StartPos.Pos = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
				this.Selection.EndPos.Pos   = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
			}

			return true;
		}
	}
};
CTable.prototype.MoveCursorDown = function(AddToSelect)
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		if (true === AddToSelect)
		{
			var bRetValue = true;
			var EndPos    = this.Selection.EndPos.Pos;
			if (this.Content.length - 1 === EndPos.Row)
			{
				bRetValue = false;
			}
			else
			{
				var EndCell = this.Content[EndPos.Row].Get_Cell(EndPos.Cell);

				var X = EndCell.Content_GetCurPosXY().X;
				var Y = EndCell.Content_GetCurPosXY().Y;

				var NextRow = this.Content[EndPos.Row + 1];
				var Cell    = null;
				for (var CurCell = 0; CurCell < NextRow.Get_CellsCount(); CurCell++)
				{
					Cell         = NextRow.Get_Cell(CurCell);
					var CellInfo = NextRow.Get_CellInfo(CurCell);
					if (X <= CellInfo.X_grid_end)
						break;
				}

				if (null === Cell)
					return true;

				Cell.Content_SetCurPosXY(X, Y);
				this.CurCell              = Cell;
				this.Selection.EndPos.Pos = {Cell : Cell.Index, Row : Cell.Row.Index};
			}

			var bForceSelectByLines = false;
			if (false === bRetValue && true === this.Is_Inline())
				bForceSelectByLines = true;

			this.private_UpdateSelectedCellsArray(bForceSelectByLines);
			return bRetValue;
		}
		else
		{
			if (this.Selection.Data.length < 0)
				return true;

			var Pos  = this.Selection.Data[this.Selection.Data.length - 1];
			var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
			var Para = Cell.Content.Get_FirstParagraph();
			var X    = Para.X;
			var Y    = Para.Y;

			this.Selection.Use = false;
			if (this.Content.length - 1 === Pos.Row)
			{
				this.CurCell = Cell;
				this.CurCell.Content.MoveCursorToStartPos();
				this.CurCell.Content_SetCurPosXY(X, Y);

				return false;
			}
			else
			{
				var NextRow  = this.Content[Pos.Row + 1];
				var NextCell = null;
				for (var CurCell = 0; CurCell < NextRow.Get_CellsCount(); CurCell++)
				{
					NextCell     = NextRow.Get_Cell(CurCell);
					var CellInfo = NextRow.Get_CellInfo(CurCell);
					if (X <= CellInfo.X_grid_end)
						break;
				}

				if (null === NextCell)
					return true;

				NextCell.Content_MoveCursorDownToFirstRow(X, Y, false);
				this.CurCell = NextCell;
				return true;
			}

		}
	}
	else
	{
		if (false === this.CurCell.Content.MoveCursorDown(AddToSelect))
		{
			if (true === AddToSelect)
			{
				this.Selection.Use          = true;
				this.Selection.Type         = table_Selection_Cell;
				this.Selection.StartPos.Pos = {Row : this.CurCell.Row.Index, Cell : this.CurCell.Index};

				var bRetValue = true;
				if (this.Content.length - 1 === this.CurCell.Row.Index)
				{
					this.Selection.EndPos.Pos = {
						Row  : this.Content.length - 1,
						Cell : this.Content[this.Content.length - 1].Get_CellsCount() - 1
					};
					bRetValue                 = false;
				}
				else
				{
					var X       = this.CurCell.Content_GetCurPosXY().X;
					var Y       = this.CurCell.Content_GetCurPosXY().Y;
					var NextRow = this.Content[this.CurCell.Row.Index + 1];
					var Cell    = null;
					for (var CurCell = 0; CurCell < NextRow.Get_CellsCount(); CurCell++)
					{
						Cell         = NextRow.Get_Cell(CurCell);
						var CellInfo = NextRow.Get_CellInfo(CurCell);
						if (X <= CellInfo.X_grid_end)
							break;
					}

					if (null === Cell)
						return true;

					Cell.Content_SetCurPosXY(X, Y);
					this.CurCell              = Cell;
					this.Selection.EndPos.Pos = {Cell : Cell.Index, Row : Cell.Row.Index};
				}

				var bForceSelectByLines = false;
				if (false === bRetValue && true === this.Is_Inline())
					bForceSelectByLines = true;

				this.private_UpdateSelectedCellsArray(bForceSelectByLines);
				return bRetValue;
			}
			else
			{
				var VMerge_count = this.Internal_GetVertMergeCount(this.CurCell.Row.Index, this.CurCell.Row.Get_CellInfo(this.CurCell.Index).StartGridCol, this.CurCell.Get_GridSpan());

				if (this.Content.length - 1 === this.CurCell.Row.Index + VMerge_count - 1)
					return false;
				else
				{
					var X = this.CurCell.Content_GetCurPosXY().X;
					var Y = this.CurCell.Content_GetCurPosXY().Y;

					var NextRow = this.Content[this.CurCell.Row.Index + VMerge_count];
					var Cell    = null;
					for (var CurCell = 0; CurCell < NextRow.Get_CellsCount(); CurCell++)
					{
						Cell         = NextRow.Get_Cell(CurCell);
						var CellInfo = NextRow.Get_CellInfo(CurCell);
						if (X <= CellInfo.X_grid_end)
							break;
					}

					if (null === Cell)
						return true;

					Cell.Content_MoveCursorDownToFirstRow(X, Y, false);
					this.CurCell              = Cell;
					this.Selection.EndPos.Pos = {Cell : Cell.Index, Row : Cell.Row.Index};
					this.Selection.CurRow     = Cell.Row.Index;

					return true;
				}
			}
		}
		else
		{
			if (true === AddToSelect)
			{
				this.Selection.Use          = true;
				this.Selection.Type         = table_Selection_Text;
				this.Selection.StartPos.Pos = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
				this.Selection.EndPos.Pos   = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
			}

			return true;
		}
	}
};
CTable.prototype.MoveCursorToEndOfLine = function(AddToSelect)
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		return this.MoveCursorRight(AddToSelect, false);
	else
	{
		var bRetValue = this.CurCell.Content.MoveCursorToEndOfLine(AddToSelect);
		if (true === this.CurCell.Content.IsSelectionUse())
		{
			this.Selection.Use          = true;
			this.Selection.Type         = table_Selection_Text;
			this.Selection.StartPos.Pos = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
			this.Selection.EndPos.Pos   = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
		}
		else
		{
			this.Selection.Use = false;
		}

		return bRetValue;
	}
};
CTable.prototype.MoveCursorToStartOfLine = function(AddToSelect)
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		return this.MoveCursorLeft(AddToSelect, false);
	else
	{
		var bRetValue = this.CurCell.Content.MoveCursorToStartOfLine(AddToSelect);
		if (true === this.CurCell.Content.IsSelectionUse())
		{
			this.Selection.Use          = true;
			this.Selection.Type         = table_Selection_Text;
			this.Selection.StartPos.Pos = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
			this.Selection.EndPos.Pos   = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
		}
		else
		{
			this.Selection.Use = false;
		}

		return bRetValue;
	}
};
CTable.prototype.MoveCursorUpToLastRow = function(X, Y, AddToSelect)
{
	if (true === AddToSelect)
	{
		if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		{
			var Row  = this.Content[this.Content.length - 1];
			var Cell = null;
			for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
			{
				Cell         = Row.Get_Cell(CurCell);
				var CellInfo = Row.Get_CellInfo(CurCell);
				if (X <= CellInfo.X_grid_end)
					break;
			}

			if (null === Cell)
				return true;

			Cell.Content_SetCurPosXY(X, Y);
			this.CurCell              = Cell;
			this.Selection.EndPos.Pos = {Cell : Cell.Index, Row : Cell.Row.Index};
			this.private_UpdateSelectedCellsArray();
		}
		else
		{
			this.Selection.Use          = true;
			this.Selection.Type         = table_Selection_Cell;
			this.Selection.StartPos.Pos = {
				Row  : this.Content.length - 1,
				Cell : this.Content[this.Content.length - 1].Get_CellsCount() - 1
			};
			this.Selection.EndPos.Pos   = {Row : this.Content.length - 1, Cell : 0};

			this.private_UpdateSelectedCellsArray();

			// У последней ячейки у первого параграфа, мы выставим RealX, RealY
			var Cell = this.Content[this.Content.length - 1].Get_Cell(0);
			Cell.Content_SetCurPosXY(X, Y);
		}
	}
	else
	{
		this.RemoveSelection();
		var Row  = this.Content[this.Content.length - 1];
		var Cell = null;
		for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
		{
			Cell         = Row.Get_Cell(CurCell);
			var CellInfo = Row.Get_CellInfo(CurCell);

			if (!CellInfo)
			{
				Cell = null;
				break;
			}

			if (X <= CellInfo.X_grid_end)
				break;
		}

		if (!Cell)
			return;

		Cell = this.GetStartMergedCell(Cell.Index, Cell.Row.Index);

		if (!Cell)
			return;

		Cell.Content_MoveCursorUpToLastRow(X, Y, false);
		this.Selection.CurRow = Cell.Row.Index;

		this.CurCell = Cell;
	}
};
CTable.prototype.MoveCursorDownToFirstRow = function(X, Y, AddToSelect)
{
	if (true === AddToSelect)
	{
		if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		{
			var Row  = this.Content[0];
			var Cell = null;
			for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
			{
				Cell         = Row.Get_Cell(CurCell);
				var CellInfo = Row.Get_CellInfo(CurCell);
				if (X <= CellInfo.X_grid_end)
					break;
			}

			if (null === Cell)
				return true;

			Cell.Content_SetCurPosXY(X, Y);
			this.CurCell              = Cell;
			this.Selection.EndPos.Pos = {Cell : Cell.Index, Row : Cell.Row.Index};
			this.private_UpdateSelectedCellsArray();
		}
		else
		{
			this.Selection.Use          = true;
			this.Selection.Type         = table_Selection_Cell;
			this.Selection.StartPos.Pos = {Row : 0, Cell : 0};
			this.Selection.EndPos.Pos   = {Row : 0, Cell : this.Content[0].Get_CellsCount() - 1};

			this.private_UpdateSelectedCellsArray();

			// У последней ячейки у первого параграфа, мы выставим RealX, RealY
			var Cell = this.Content[0].Get_Cell(0);
			Cell.Content_SetCurPosXY(X, Y);
		}
	}
	else
	{
		this.RemoveSelection();
		var Row  = this.Content[0];
		var Cell = null;
		for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
		{
			Cell         = Row.Get_Cell(CurCell);
			var CellInfo = Row.Get_CellInfo(CurCell);
			if (X <= CellInfo.X_grid_end)
				break;
		}

		if (null === Cell)
			return;

		Cell.Content_MoveCursorDownToFirstRow(X, Y, false);
		this.Selection.CurRow = Cell.Row.Index;
		this.CurCell          = Cell;
	}
};
CTable.prototype.MoveCursorToCell = function(bNext)
{
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		var Pos             = this.Selection.Data[0];
		this.Selection.Type = table_Selection_Text;
		this.CurCell        = this.Content[Pos.Row].Get_Cell(Pos.Cell);
		this.CurCell.Content.SelectAll();
	}
	else
	{
		if (true === this.IsInnerTable())
			return this.CurCell.Content.MoveCursorToCell(bNext);

		var CurCell = this.CurCell;
		var Pos_c   = this.CurCell.Index;
		var Pos_r   = this.CurCell.Row.Index;
		var Pos     = {
			Cell : Pos_c,
			Row  : Pos_r
		};

		if (true === bNext)
		{
			var TempCell = this.Internal_Get_NextCell(Pos);
			while (null != TempCell && vmerge_Restart != TempCell.GetVMerge())
				TempCell = this.Internal_Get_NextCell(Pos);

			if (null != TempCell)
				CurCell = TempCell;
			else
			{
				if (false == editor.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_None, {
						Type      : AscCommon.changestype_2_Element_and_Type,
						Element   : this,
						CheckType : AscCommon.changestype_Table_Properties
					}))
				{
					this.LogicDocument.StartAction(AscDFH.historydescription_Document_TableAddNewRowByTab);
					this.AddTableRow(false);
					this.LogicDocument.Recalculate();
					this.LogicDocument.FinalizeAction();
				}
				else
					return;

				var TempCell = this.Internal_Get_NextCell(Pos);
				while (null != TempCell && vmerge_Restart != TempCell.GetVMerge())
					TempCell = this.Internal_Get_NextCell(Pos);

				if (null != TempCell)
					CurCell = TempCell;
			}
		}
		else
		{
			var TempCell = this.Internal_Get_PrevCell(Pos);
			while (null != TempCell && vmerge_Restart != TempCell.GetVMerge())
				TempCell = this.Internal_Get_PrevCell(Pos);

			if (null != TempCell)
				CurCell = TempCell;
		}

		// Предварительно очистим текущий селект
		editor.WordControl.m_oLogicDocument.RemoveSelection();

		this.CurCell = CurCell;
		this.CurCell.Content.SelectAll();

		if (true === this.CurCell.Content.IsSelectionEmpty(false))
		{
			this.CurCell.Content.MoveCursorToStartPos();

			this.Selection.Use    = false;
			this.Selection.Type   = table_Selection_Text;
			this.Selection.CurRow = CurCell.Row.Index;
		}
		else
		{
			this.Selection.Use          = true;
			this.Selection.Type         = table_Selection_Text;
			this.Selection.StartPos.Pos = {Row : CurCell.Row.Index, Cell : CurCell.Index};
			this.Selection.EndPos.Pos   = {Row : CurCell.Row.Index, Cell : CurCell.Index};
			this.Selection.CurRow       = CurCell.Row.Index;
		}

		this.Document_SetThisElementCurrent(true);
	}
};
CTable.prototype.GetCurPosXY = function()
{
	var Cell = null;
	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		Cell = this.Content[this.Selection.EndPos.Pos.Row].Get_Cell(this.Selection.EndPos.Pos.Cell);
	else
		Cell = this.CurCell;

	return Cell.Content_GetCurPosXY();
};
CTable.prototype.IsSelectionUse = function()
{
	if ((true == this.Selection.Use && table_Selection_Cell == this.Selection.Type) || table_Selection_Border == this.Selection.Type2 || table_Selection_Border_InnerTable == this.Selection.Type2)
		return true;
	else if (true == this.Selection.Use)
		return this.CurCell.Content.IsSelectionUse();

	return false;
};
CTable.prototype.IsTextSelectionUse = function()
{
	if ((true == this.Selection.Use && table_Selection_Cell == this.Selection.Type) || table_Selection_Border == this.Selection.Type2 || table_Selection_Border_InnerTable == this.Selection.Type2)
		return true;
	else if (true == this.Selection.Use)
		return this.CurCell.Content.IsTextSelectionUse();

	return false;
};
CTable.prototype.GetSelectedText = function(bClearText, oPr)
{
	if (true === bClearText && ( (true == this.Selection.Use && table_Selection_Text == this.Selection.Type) || false === this.Selection.Use ))
	{
		return this.CurCell.Content.GetSelectedText(true, oPr);
	}
	else if (false === bClearText)
	{
		if (this.IsCellSelection())
		{
			var arrSelectedCells = this.GetSelectionArray();

			var sResultText = "";
			for (var nIndex = 0, nCount = arrSelectedCells.length; nIndex < nCount; ++nIndex)
			{
				var oPos  = arrSelectedCells[nIndex];
				var oCell = this.GetRow(oPos.Row).GetCell(oPos.Cell);

				var oCellContent = oCell.GetContent();

				oCellContent.Set_ApplyToAll(true);
				sResultText += oCellContent.GetSelectedText(false, oPr);
				oCellContent.Set_ApplyToAll(false);
			}

			return sResultText;
		}
		else
		{
			return this.CurCell.Content.GetSelectedText(false, oPr);
		}
	}

	return null;
};
CTable.prototype.GetSelectedElementsInfo = function(Info)
{
	Info.Set_Table();

	if (false === this.Selection.Use || (true === this.Selection.Use && table_Selection_Text === this.Selection.Type))
	{
		this.CurCell.Content.GetSelectedElementsInfo(Info);
	}
	else if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.StartPos.Pos.Row === this.Selection.EndPos.Pos.Row && this.Selection.StartPos.Pos.Cell === this.Selection.EndPos.Pos.Cell)
	{
		var Row = this.Get_Row(this.Selection.StartPos.Pos.Row);
		if (!Row)
			return;

		var Cell = Row.Get_Cell(this.Selection.StartPos.Pos.Cell);
		if (!Cell)
			return;

		Info.Set_SingleCell(Cell);
	}
};
CTable.prototype.GetSelectedContent = function(SelectedContent)
{
	if (true !== this.Selection.Use)
		return;

	if (table_Selection_Cell === this.Selection.Type || true === this.ApplyToAll)
	{
		// Сначала проверим выделена ли таблица целиком, если да, тогда просто копируем ее.
		if (true === this.ApplyToAll)
		{
			SelectedContent.Add(new CSelectedElement(this.Copy(this.Parent), true));
			return;
		}

		var bAllSelected  = true;
		var SelectedCount = this.Selection.Data.length;

		// Собираем информацию по строкам
		var RowsInfoArray = [];

		var RowsCount = this.Content.length;
		for (var CurRow = 0; CurRow < RowsCount; CurRow++)
		{
			var Row        = this.Content[CurRow];
			var CellsCount = Row.Get_CellsCount();

			var CellsInfoArray = [];

			var bSelectedRow = false;

			CellsInfoArray.push({GridSpan : Row.Get_Before().GridBefore, Cell : null, Selected : false});

			for (var CurCell = 0; CurCell < CellsCount; CurCell++)
			{
				var Cell     = Row.Get_Cell(CurCell);
				var GridSpan = Cell.Get_GridSpan();
				var VMerge   = Cell.GetVMerge();

				var bSelected = false;
				if (VMerge === vmerge_Restart)
				{
					// Ищем текущую ячейку среди выделенных

					for (var Index = 0; Index < SelectedCount; Index++)
					{
						var TempPos = this.Selection.Data[Index];
						if (CurCell === TempPos.Cell && CurRow === TempPos.Row)
						{
							bSelected = true;
							break;
						}
						else if (CurRow < TempPos.Row)
							break;
					}
				}
				else
				{
					// Данная ячейка попала в вертикальное объединение, находим ячейку, с которой это объединение
					// началось и проверяем была ли она выделена (эту ячейку мы уже проверяли, т.к. она находится
					// выше).

					var StartMergedCell = this.GetStartMergedCell(CurCell, CurRow);
					if (StartMergedCell)
						bSelected = RowsInfoArray[StartMergedCell.Row.Index].CellsInfoArray[StartMergedCell.Index + 1].Selected;
				}

				if (false === bSelected)
					bAllSelected = false;
				else
					bSelectedRow = true;

				CellsInfoArray.push({GridSpan : GridSpan, Cell : Cell, Selected : bSelected});
			}

			CellsInfoArray.push({GridSpan : Row.Get_After().GridAfter, Cell : null, Selected : false});

			RowsInfoArray.push({CellsInfoArray : CellsInfoArray, Selected : bSelectedRow});
		}

		if (true === bAllSelected)
		{
			SelectedContent.Add(new CSelectedElement(this.Copy(this.Parent), true));
			return;
		}


		var TableGrid = this.Internal_Copy_Grid(this.TableGridCalc);

		// Посчитаем сколько слева и справа пустых спанов
		var MinBefore = -1;
		var MinAfter  = -1;
		for (var CurRow = 0; CurRow < RowsCount; CurRow++)
		{
			var CellsInfoArray = RowsInfoArray[CurRow].CellsInfoArray;

			if (true !== RowsInfoArray[CurRow].Selected)
				continue;

			var bBefore        = true;
			var BeforeGrid     = 0, AfterGrid = 0;
			var CellsInfoCount = CellsInfoArray.length;
			for (var CellIndex = 0, CurCell = 0; CellIndex < CellsInfoCount; CellIndex++)
			{
				var CellInfo = CellsInfoArray[CellIndex];
				if (true === CellInfo.Selected)
				{
					bBefore = false;
				}
				else if (true === bBefore)
				{
					BeforeGrid += CellInfo.GridSpan;
				}
				else
				{
					AfterGrid += CellInfo.GridSpan;
				}
			}

			if (MinBefore > BeforeGrid || -1 === MinBefore)
				MinBefore = BeforeGrid;

			if (MinAfter > AfterGrid || -1 === MinAfter)
				MinAfter = AfterGrid;
		}

		for (var CurRow = 0; CurRow < RowsCount; CurRow++)
		{
			var CellsInfoArray = RowsInfoArray[CurRow].CellsInfoArray;

			if (true === RowsInfoArray[CurRow].Selected)
			{
				CellsInfoArray[0].GridSpan -= MinBefore;
				CellsInfoArray[CellsInfoArray.length - 1].GridSpan -= MinAfter;
			}
		}

		if (MinAfter > 0)
			TableGrid.splice(TableGrid.length - MinAfter, MinAfter); // TableGrid.length - (MinAfter - 1) - 1

		if (MinBefore > 0)
			TableGrid.splice(0, MinBefore);

		// Формируем новую таблицу, по выделенно части.
		var Table = new CTable(this.DrawingDocument, this.Parent, this.Inline, 0, 0, TableGrid, this.bPresentation);

		// Копируем настройки
		Table.Set_TableStyle(this.TableStyle);
		Table.Set_TableLook(this.TableLook.Copy());
		Table.Set_PositionH(this.PositionH.RelativeFrom, this.PositionH.Align, this.PositionH.Value);
		Table.Set_PositionV(this.PositionV.RelativeFrom, this.PositionV.Align, this.PositionV.Value);
		Table.Set_Distance(this.Distance.L, this.Distance.T, this.Distance.R, this.Distance.B);
		Table.SetPr(this.Pr.Copy());

		// Копируем строки
		for (var CurRow = 0, CurRow2 = 0; CurRow < RowsCount; CurRow++)
		{
			var RowInfo = RowsInfoArray[CurRow];
			if (true !== RowInfo.Selected)
				continue;

			var CellsInfoArray = RowInfo.CellsInfoArray;

			var Row = new CTableRow(Table, 0);

			// Копируем настройки строки
			Row.Set_Pr(this.Content[CurRow].Pr.Copy());

			var bMergedRow     = true;
			var bBefore        = true;
			var BeforeGrid     = 0, AfterGrid = 0;
			var CellsInfoCount = CellsInfoArray.length;
			for (var CellIndex = 0, CurCell = 0; CellIndex < CellsInfoCount; CellIndex++)
			{
				var CellInfo = CellsInfoArray[CellIndex];
				if (true === CellInfo.Selected)
				{
					bBefore = false;

					// Добавляем ячейку
					Row.Content[CurCell] = CellInfo.Cell.Copy(Row);
					History.Add(new CChangesTableRowAddCell(Row, CurCell, [Row.Content[CurCell]]));
					CurCell++;

					var VMerge = CellInfo.Cell.GetVMerge();
					if (VMerge === vmerge_Restart)
						bMergedRow = false;
				}
				else if (true === bBefore)
				{
					BeforeGrid += CellInfo.GridSpan;
				}
				else
				{
					AfterGrid += CellInfo.GridSpan;
				}
			}

			// Строку, составленную полностью из вертикально объединенных ячеек не добавляем
			if (true === bMergedRow)
				continue;

			Row.Set_Before(BeforeGrid);
			Row.Set_After(AfterGrid);

			Row.Internal_ReIndexing();

			// Добавляем строку в новую таблицу
			Table.Content[CurRow2] = Row;
			History.Add(new CChangesTableAddRow(Table, CurRow2, [Table.Content[CurRow2]]));
			CurRow2++;
		}

		Table.Internal_ReIndexing(0);

		if (Table.Content.length > 0 && Table.Content[0].Get_CellsCount() > 0)
			Table.CurCell = Table.Content[0].Get_Cell(0);

		SelectedContent.Add(new CSelectedElement(Table, false));
	}
	else
	{
		this.CurCell.Content.GetSelectedContent(SelectedContent);
	}
};
CTable.prototype.SetParagraphPrOnAdd = function(oPara)
{
	this.SetApplyToAll(true);

	var oParaPr = oPara.GetDirectParaPr().Copy();
	oParaPr.Ind = new CParaInd();
	this.SetParagraphPr(oParaPr);

	var oTextPr = oPara.Get_TextPr();
	this.AddToParagraph(new ParaTextPr(oTextPr));

	this.SetApplyToAll(false);
};
CTable.prototype.SetParagraphAlign = function(Align)
{
	if (true === this.ApplyToAll || (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphAlign(Align);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphAlign(Align);
	}
};
CTable.prototype.SetParagraphDefaultTabSize = function(TabSize)
{
	if (true === this.ApplyToAll || (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphDefaultTabSize(TabSize);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphDefaultTabSize(TabSize);
	}
};
CTable.prototype.SetParagraphSpacing = function(Spacing)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphSpacing(Spacing);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphSpacing(Spacing);
	}
};
CTable.prototype.SetParagraphIndent = function(Ind)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphIndent(Ind);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphIndent(Ind);
	}
};
CTable.prototype.Set_ParagraphPresentationNumbering = function(NumInfo, Pr)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.Set_ParagraphPresentationNumbering(NumInfo, Pr);
			Cell_Content.Set_ApplyToAll(false);
		}

		if (Cells_array[0].Row - 1 >= 0)
			this.Internal_RecalculateFrom(Cells_array[0].Row - 1, 0, true, true);
		else
		{
			this.Internal_Recalculate_1();
		}
	}
	else
		return this.CurCell.Content.Set_ParagraphPresentationNumbering(NumInfo, Pr);
};
CTable.prototype.Increase_ParagraphLevel = function(bIncrease)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.Increase_ParagraphLevel(bIncrease);
			Cell_Content.Set_ApplyToAll(false);
		}

		if (Cells_array[0].Row - 1 >= 0)
			this.Internal_RecalculateFrom(Cells_array[0].Row - 1, 0, true, true);
		else
		{
			this.Internal_Recalculate_1();
		}
	}
	else
		return this.CurCell.Content.Increase_ParagraphLevel(bIncrease);
};
CTable.prototype.SetParagraphShd = function(Shd)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphShd(Shd);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphShd(Shd);
	}
};
CTable.prototype.SetParagraphStyle = function(Name)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphStyle(Name);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphStyle(Name);
	}
};
CTable.prototype.SetParagraphTabs = function(Tabs)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphTabs(Tabs);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphTabs(Tabs);
	}
};
CTable.prototype.SetParagraphContextualSpacing = function(Value)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphContextualSpacing(Value);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphContextualSpacing(Value);
	}
};
CTable.prototype.SetParagraphPageBreakBefore = function(Value)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphPageBreakBefore(Value);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphPageBreakBefore(Value);
	}
};
CTable.prototype.SetParagraphKeepLines = function(Value)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphKeepLines(Value);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphKeepLines(Value);
	}
};
CTable.prototype.SetParagraphKeepNext = function(Value)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphKeepNext(Value);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphKeepNext(Value);
	}
};
CTable.prototype.SetParagraphWidowControl = function(Value)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphWidowControl(Value);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphWidowControl(Value);
	}
};
CTable.prototype.SetParagraphBorders = function(Borders)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.SetParagraphBorders(Borders);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.SetParagraphBorders(Borders);
	}
};
CTable.prototype.SetParagraphFramePr = function(FramePr, bDelete)
{
	if (true !== this.ApplyToAll && (true !== this.Selection.Use || table_Selection_Cell !== this.Selection.Type))
	{
		this.CurCell.Content.SetParagraphFramePr(FramePr, bDelete);
	}
};
CTable.prototype.SetParagraphPr = function(oParaPr)
{
	if (this.IsCellSelection())
	{
		var arrSelectedCells = this.GetSelectionArray();
		for (var nIndex = 0, nCount = arrSelectedCells.length; nIndex < nCount; ++nIndex)
		{
			var oPos = arrSelectedCells[nIndex];
			var oRow = this.GetRow(oPos.Row);
			if (!oRow)
				continue;

			var oCell = oRow.GetCell(oPos.Cell);
			if (!oCell)
				continue;

			var oCellContent = oCell.GetContent();
			oCellContent.SetApplyToAll(true);
			oCellContent.SetParagraphPr(oParaPr);
			oCellContent.SetApplyToAll(false);
		}
	}
	else
	{
		this.CurCell.GetContent().SetParagraphPr(oParaPr);
	}
};
CTable.prototype.IncreaseDecreaseFontSize = function(bIncrease)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var Cells_array = this.GetSelectionArray();
		for (var Index = 0; Index < Cells_array.length; Index++)
		{
			var Pos  = Cells_array[Index];
			var Row  = this.Content[Pos.Row];
			var Cell = Row.Get_Cell(Pos.Cell);

			var Cell_Content = Cell.Content;
			Cell_Content.Set_ApplyToAll(true);
			Cell.Content.IncreaseDecreaseFontSize(bIncrease);
			Cell_Content.Set_ApplyToAll(false);
		}
	}
	else
	{
		return this.CurCell.Content.IncreaseDecreaseFontSize(bIncrease);
	}
};
CTable.prototype.IncreaseDecreaseIndent = function(bIncrease)
{
	if (true === this.ApplyToAll || ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type && this.Selection.Data.length > 0 ))
	{
		var TablePr = this.Get_CompiledPr(false).TablePr;

		var LeftIndOld = TablePr.TableInd;
		if (undefined === LeftIndOld || null === LeftIndOld)
		{
			LeftIndOld = 0;
		}
		else if (LeftIndOld < 0)
		{
			this.Set_TableInd(0);
			return;
		}

		var LeftIndNew = 0;
		if (true === bIncrease)
		{
			if (LeftIndOld >= 0)
			{
				LeftIndOld = 12.5 * parseInt(10 * LeftIndOld / 125);
				LeftIndNew = ( (LeftIndOld - (10 * LeftIndOld) % 125 / 10) / 12.5 + 1) * 12.5;
			}

			if (LeftIndNew < 0)
				LeftIndNew = 12.5;
		}
		else
		{
			var TempValue = (125 - (10 * LeftIndOld) % 125);
			TempValue     = ( 125 === TempValue ? 0 : TempValue );
			LeftIndNew    = Math.max(( (LeftIndOld + TempValue / 10) / 12.5 - 1 ) * 12.5, 0);
		}

		this.Set_TableInd(LeftIndNew);
	}
	else
	{
		this.CurCell.Content.IncreaseDecreaseIndent(bIncrease);
	}
};
CTable.prototype.GetCalculatedParaPr = function()
{
	if (true === this.ApplyToAll)
	{
		var Row  = this.Content[0];
		var Cell = Row.Get_Cell(0);

		Cell.Content.Set_ApplyToAll(true);
		var Result_ParaPr = Cell.Content.GetCalculatedParaPr();
		Cell.Content.Set_ApplyToAll(false);

		for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
		{
			Row            = this.Content[CurRow];
			var CellsCount = Row.Get_CellsCount();
			var StartCell  = ( CurRow === 0 ? 1 : 0 );

			for (var CurCell = StartCell; CurCell < CellsCount; CurCell++)
			{
				Cell = Row.Get_Cell(CurCell);
				Cell.Content.Set_ApplyToAll(true);
				var CurPr = Cell.Content.GetCalculatedParaPr();
				Cell.Content.Set_ApplyToAll(false);

				Result_ParaPr = Result_ParaPr.Compare(CurPr);
			}
		}

		return Result_ParaPr;
	}

	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		var Pos  = this.Selection.Data[0];
		var Row  = this.Content[Pos.Row];
		var Cell = Row.Get_Cell(Pos.Cell);

		Cell.Content.Set_ApplyToAll(true);
		var Result_ParaPr = Cell.Content.GetCalculatedParaPr();
		Cell.Content.Set_ApplyToAll(false);

		for (var Index = 1; Index < this.Selection.Data.length; Index++)
		{
			Pos  = this.Selection.Data[Index];
			Row  = this.Content[Pos.Row];
			Cell = Row.Get_Cell(Pos.Cell);

			Cell.Content.Set_ApplyToAll(true);
			var CurPr = Cell.Content.GetCalculatedParaPr();
			Cell.Content.Set_ApplyToAll(false);

			Result_ParaPr = Result_ParaPr.Compare(CurPr);
		}

		return Result_ParaPr;
	}

	return this.CurCell.Content.GetCalculatedParaPr();
};
CTable.prototype.GetCalculatedTextPr = function()
{
	if (true === this.ApplyToAll)
	{
		var Row  = this.Content[0];
		var Cell = Row.Get_Cell(0);

		Cell.Content.Set_ApplyToAll(true);
		var Result_TextPr = Cell.Content.GetCalculatedTextPr();
		Cell.Content.Set_ApplyToAll(false);

		for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
		{
			Row            = this.Content[CurRow];
			var CellsCount = Row.Get_CellsCount();
			var StartCell  = ( CurRow === 0 ? 1 : 0 );

			for (var CurCell = StartCell; CurCell < CellsCount; CurCell++)
			{
				Cell = Row.Get_Cell(CurCell);
				Cell.Content.Set_ApplyToAll(true);
				var CurPr = Cell.Content.GetCalculatedTextPr();
				Cell.Content.Set_ApplyToAll(false);

				Result_TextPr = Result_TextPr.Compare(CurPr);
			}
		}

		return Result_TextPr;
	}

	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		var Pos  = this.Selection.Data[0];
		var Row  = this.Content[Pos.Row];
		var Cell = Row.Get_Cell(Pos.Cell);

		Cell.Content.Set_ApplyToAll(true);
		var Result_TextPr = Cell.Content.GetCalculatedTextPr();
		Cell.Content.Set_ApplyToAll(false);

		for (var Index = 1; Index < this.Selection.Data.length; Index++)
		{
			Pos  = this.Selection.Data[Index];
			Row  = this.Content[Pos.Row];
			Cell = Row.Get_Cell(Pos.Cell);

			Cell.Content.Set_ApplyToAll(true);
			var CurPr = Cell.Content.GetCalculatedTextPr();
			Cell.Content.Set_ApplyToAll(false);

			Result_TextPr = Result_TextPr.Compare(CurPr);
		}

		return Result_TextPr;
	}

	return this.CurCell.Content.GetCalculatedTextPr();
};
CTable.prototype.GetDirectTextPr = function()
{
	if (true === this.ApplyToAll)
	{
		var Row  = this.Content[0];
		var Cell = Row.Get_Cell(0);

		Cell.Content.Set_ApplyToAll(true);
		var Result_TextPr = Cell.Content.GetDirectTextPr();
		Cell.Content.Set_ApplyToAll(false);

		return Result_TextPr;
	}

	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		var Pos  = this.Selection.Data[0];
		var Row  = this.Content[Pos.Row];
		var Cell = Row.Get_Cell(Pos.Cell);

		Cell.Content.Set_ApplyToAll(true);
		var Result_TextPr = Cell.Content.GetDirectTextPr();
		Cell.Content.Set_ApplyToAll(false);

		return Result_TextPr;
	}

	return this.CurCell.Content.GetDirectTextPr();
};
CTable.prototype.GetDirectParaPr = function()
{
	if (true === this.ApplyToAll)
	{
		var Row  = this.Content[0];
		var Cell = Row.Get_Cell(0);

		Cell.Content.Set_ApplyToAll(true);
		var Result_TextPr = Cell.Content.GetDirectParaPr();
		Cell.Content.Set_ApplyToAll(false);

		return Result_TextPr;
	}

	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		var Pos  = this.Selection.Data[0];
		var Row  = this.Content[Pos.Row];
		var Cell = Row.Get_Cell(Pos.Cell);

		Cell.Content.Set_ApplyToAll(true);
		var Result_TextPr = Cell.Content.GetDirectParaPr();
		Cell.Content.Set_ApplyToAll(false);

		return Result_TextPr;
	}

	return this.CurCell.Content.GetDirectParaPr();
};
CTable.prototype.GetCurrentParagraph = function(bIgnoreSelection, arrSelectedParagraphs, oPr)
{
	if (!bIgnoreSelection && oPr && oPr.ReturnSelectedTable && this.IsCellSelection())
		return this;

	if (arrSelectedParagraphs)
	{
		var arrSelectionArray = this.GetSelectionArray();
		for (var nIndex = 0, nCount = arrSelectionArray.length; nIndex < nCount; ++nIndex)
		{
			var nCurCell = arrSelectionArray[nIndex].Cell;
			var nCurRow  = arrSelectionArray[nIndex].Row;

			var oCellContent = this.GetRow(nCurRow).GetCell(nCurCell).GetContent();

			if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
			{
				oCellContent.Set_ApplyToAll(true);
				oCellContent.GetCurrentParagraph(false, arrSelectedParagraphs, oPr);
				oCellContent.Set_ApplyToAll(false);
			}
			else
			{
				oCellContent.GetCurrentParagraph(false, arrSelectedParagraphs, oPr);
			}
		}

		return arrSelectedParagraphs;
	}
	else if (true === bIgnoreSelection)
	{
		if (this.CurCell)
			return this.CurCell.Content.GetCurrentParagraph(bIgnoreSelection, null, oPr);
		else
			null;
	}
	else
	{
		var arrSelectionArray = this.GetSelectionArray();
		if (arrSelectionArray.length > 0)
		{
			var nCurCell = arrSelectionArray[0].Cell;
			var nCurRow  = arrSelectionArray[0].Row;

			var oCellContent = this.GetRow(nCurRow).GetCell(nCurCell).GetContent();

			if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
			{
				oCellContent.Set_ApplyToAll(true);
				var oRes = oCellContent.GetCurrentParagraph(bIgnoreSelection, null, oPr);
				oCellContent.Set_ApplyToAll(false);
				return oRes;
			}
			else
			{
				return oCellContent.GetCurrentParagraph(bIgnoreSelection, null, oPr);
			}
		}
	}

	return null;
};
CTable.prototype.SetImageProps = function(Props)
{
	if ((true === this.Selection.Use && table_Selection_Text === this.Selection.Type) || false === this.Selection.Use)
	{
		return this.CurCell.Content.SetImageProps(Props);
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Работаем со стилем таблицы
//----------------------------------------------------------------------------------------------------------------------
/**
 * Сообщаем таблице, что ей надо будет пересчитать скомпилированный стиль
 * (Такое может случится, если у данной таблицы задан стиль,
 * который меняется каким-то внешним образом)
 *
 */
CTable.prototype.Recalc_CompiledPr = function()
{
	this.CompiledPr.NeedRecalc = true;
};
CTable.prototype.Recalc_CompiledPr2 = function()
{
	this.Recalc_CompiledPr();

	var RowsCount = this.Content.length;
	for (var CurRow = 0; CurRow < RowsCount; CurRow++)
	{
		var Row = this.Content[CurRow];
		Row.Recalc_CompiledPr();

		var CellsCount = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			Cell.Recalc_CompiledPr();
		}
	}
};
/**
 * Формируем конечные свойства параграфа на основе стиля и прямых настроек.
 */
CTable.prototype.Get_CompiledPr = function(bCopy)
{
	if (true === this.CompiledPr.NeedRecalc)
	{
		if (true === AscCommon.g_oIdCounter.m_bLoad && true === AscCommon.g_oIdCounter.m_bRead)
		{
			this.CompiledPr.Pr         = {
				TextPr : g_oDocumentDefaultTextPr,
				ParaPr : g_oDocumentDefaultParaPr,

				TablePr     : g_oDocumentDefaultTablePr,
				TableRowPr  : g_oDocumentDefaultTableRowPr,
				TableCellPr : g_oDocumentDefaultTableCellPr,

				TableFirstCol   : g_oDocumentDefaultTableStylePr,
				TableFirstRow   : g_oDocumentDefaultTableStylePr,
				TableLastCol    : g_oDocumentDefaultTableStylePr,
				TableLastRow    : g_oDocumentDefaultTableStylePr,
				TableBand1Horz  : g_oDocumentDefaultTableStylePr,
				TableBand1Vert  : g_oDocumentDefaultTableStylePr,
				TableBand2Horz  : g_oDocumentDefaultTableStylePr,
				TableBand2Vert  : g_oDocumentDefaultTableStylePr,
				TableTLCell     : g_oDocumentDefaultTableStylePr,
				TableTRCell     : g_oDocumentDefaultTableStylePr,
				TableBLCell     : g_oDocumentDefaultTableStylePr,
				TableBRCell     : g_oDocumentDefaultTableStylePr,
				TableWholeTable : g_oDocumentDefaultTableStylePr
			};
			this.CompiledPr.NeedRecalc = true;
		}
		else
		{
			this.CompiledPr.Pr         = this.Internal_Compile_Pr();
			this.CompiledPr.NeedRecalc = false;
		}
	}

	if (false === bCopy)
		return this.CompiledPr.Pr;
	else
	{
		var Pr    = {};
		Pr.TextPr = this.CompiledPr.Pr.TextPr.Copy();
		Pr.ParaPr = this.CompiledPr.Pr.ParaPr.Copy();

		Pr.TablePr     = this.CompiledPr.Pr.TablePr.Copy();
		Pr.TableRowPr  = this.CompiledPr.Pr.TableRowPr.Copy();
		Pr.TableCellPr = this.CompiledPr.Pr.TableCellPr.Copy();

		Pr.TableFirstCol   = this.CompiledPr.Pr.TableFirstCol.Copy();
		Pr.TableFirstRow   = this.CompiledPr.Pr.TableFirstRow.Copy();
		Pr.TableLastCol    = this.CompiledPr.Pr.TableLastCol.Copy();
		Pr.TableLastRow    = this.CompiledPr.Pr.TableLastRow.Copy();
		Pr.TableBand1Horz  = this.CompiledPr.Pr.TableBand1Horz.Copy();
		Pr.TableBand1Vert  = this.CompiledPr.Pr.TableBand1Vert.Copy();
		Pr.TableBand2Horz  = this.CompiledPr.Pr.TableBand2Horz.Copy();
		Pr.TableBand2Vert  = this.CompiledPr.Pr.TableBand2Vert.Copy();
		Pr.TableTLCell     = this.CompiledPr.Pr.TableTLCell.Copy();
		Pr.TableTRCell     = this.CompiledPr.Pr.TableTRCell.Copy();
		Pr.TableBLCell     = this.CompiledPr.Pr.TableBLCell.Copy();
		Pr.TableBRCell     = this.CompiledPr.Pr.TableBRCell.Copy();
		Pr.TableWholeTable = this.CompiledPr.Pr.TableWholeTable.Copy();

		return Pr; // Отдаем копию объекта, чтобы никто не поменял извне настройки стиля
	}
};
CTable.prototype.Get_Style = function()
{
	if ("undefined" != typeof(this.TableStyle))
		return this.TableStyle;

	return null;
};
CTable.prototype.Set_Style = function(Id)
{
	this.Style_Remove();
	if (null === Id)
		return;

	// Если стиль является стилем по умолчанию для таблицы, тогда не надо его записывать.
	if (Id != this.Get_Styles().Get_Default_Table())
		this.TableStyle = Id;

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
};
CTable.prototype.Remove_Style = function()
{
	if ("undefined" != typeof(this.TableStyle))
		delete this.TableStyle;

	// Надо пересчитать конечный стиль
	this.CompiledPr.NeedRecalc = true;
};
/**
 * Формируем конечные свойства таблицы на основе стиля и прямых настроек.
 */
CTable.prototype.Internal_Compile_Pr = function()
{
	var Styles  = this.Get_Styles();
	var StyleId = this.Get_Style();

	// Считываем свойства для текущего стиля
	var Pr = Styles.Get_Pr(StyleId, styletype_Table);
	if (this.bPresentation)
	{
		this.Check_PresentationPr(Pr);
	}
	// Копируем прямые настройки параграфа.
	Pr.TablePr.Merge(this.Pr);

	return Pr;
};
CTable.prototype.Check_PresentationPr = function(Pr)
{
	var Theme = this.Get_Theme();
	Pr.TablePr.Check_PresentationPr(Theme);
	Pr.TextPr.Check_PresentationPr(Theme);
	Pr.TableCellPr.Check_PresentationPr(Theme);
	Pr.TableFirstCol.Check_PresentationPr(Theme);
	Pr.TableFirstRow.Check_PresentationPr(Theme);
	Pr.TableLastCol.Check_PresentationPr(Theme);
	Pr.TableLastRow.Check_PresentationPr(Theme);
	Pr.TableBand1Horz.Check_PresentationPr(Theme);
	Pr.TableBand1Vert.Check_PresentationPr(Theme);
	Pr.TableBand2Horz.Check_PresentationPr(Theme);
	Pr.TableBand2Vert.Check_PresentationPr(Theme);
	Pr.TableTLCell.Check_PresentationPr(Theme);
	Pr.TableTRCell.Check_PresentationPr(Theme);
	Pr.TableBLCell.Check_PresentationPr(Theme);
	Pr.TableBRCell.Check_PresentationPr(Theme);
};
//----------------------------------------------------------------------------------------------------------------------
// Устанавливаем прямые настройки таблицы
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.Clear_DirectFormatting = function(bClearMerge)
{
	// Очищаем все прямые настройки таблицы, всех ее строк и всех ее ячеек

	this.Set_TableStyleRowBandSize(undefined);
	this.Set_TableStyleColBandSize(undefined);
	this.Set_TableAlign(undefined);
	this.Set_TableShd(undefined);
	this.Set_TableBorder_Bottom(undefined);
	this.Set_TableBorder_Left(undefined);
	this.Set_TableBorder_Right(undefined);
	this.Set_TableBorder_Top(undefined);
	this.Set_TableBorder_InsideV(undefined);
	this.Set_TableBorder_InsideH(undefined);
	this.Set_TableCellMar(undefined, undefined, undefined, undefined);
	this.Set_TableInd(undefined);

	if (false !== bClearMerge)
		this.Set_TableW(undefined, undefined);

	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		this.Content[Index].Clear_DirectFormatting(bClearMerge);
	}
};
CTable.prototype.Set_Pr = function(TablePr)
{
	this.private_AddPrChange();
	History.Add(new CChangesTablePr(this, this.Pr, TablePr));
	this.Pr = TablePr;
	this.Recalc_CompiledPr2();
};
CTable.prototype.SetPr = function(oTablePr)
{
	this.Set_Pr(oTablePr);
};
CTable.prototype.Set_TableStyle = function(StyleId, bNoClearFormatting)
{
	// Здесь мы не проверяем изменился ли стиль, потому что при выставлении стиля нужно сбрасывать
	// прямые настройки, даже если мы выставляем тот же самый стиль.

	History.Add(new CChangesTableTableStyle(this, this.TableStyle, StyleId));
	this.TableStyle = StyleId;

	// Очищаем все прямое форматирование таблицы
	if (!(bNoClearFormatting === true))
	{
		this.Clear_DirectFormatting(false);
	}
	this.Recalc_CompiledPr2();
};
CTable.prototype.Set_TableStyle2 = function(StyleId)
{
	if (this.TableStyle != StyleId)
	{
		History.Add(new CChangesTableTableStyle(this, this.TableStyle, StyleId));
		this.TableStyle = StyleId;

		this.Recalc_CompiledPr2();
	}
};
CTable.prototype.Get_TableStyle = function()
{
	return this.TableStyle;
};
CTable.prototype.Set_TableLook = function(TableLook)
{
	History.Add(new CChangesTableTableLook(this, this.TableLook, TableLook));
	this.TableLook = TableLook;
	this.Recalc_CompiledPr2();
};
CTable.prototype.Get_TableLook = function()
{
	return this.TableLook;
};
CTable.prototype.Set_AllowOverlap = function(AllowOverlap)
{
	History.Add(new CChangesTableAllowOverlap(this, this.AllowOverlap, AllowOverlap));
	this.AllowOverlap = AllowOverlap;
};
CTable.prototype.Get_AllowOverlap = function()
{
	return this.AllowOverlap;
};
CTable.prototype.Set_PositionH = function(RelativeFrom, Align, Value)
{
	History.Add(new CChangesTablePositionH(this, {
		RelativeFrom : this.PositionH.RelativeFrom,
		Align        : this.PositionH.Align,
		Value        : this.PositionH.Value
	}, {
		RelativeFrom : RelativeFrom,
		Align        : Align,
		Value        : Value
	}));

	this.PositionH.RelativeFrom = RelativeFrom;
	this.PositionH.Align        = Align;
	this.PositionH.Value        = Value;
};
CTable.prototype.Set_PositionV = function(RelativeFrom, Align, Value)
{
	History.Add(new CChangesTablePositionV(this,
		{
			RelativeFrom : this.PositionV.RelativeFrom,
			Align        : this.PositionV.Align,
			Value        : this.PositionV.Value
		},
		{
			RelativeFrom : RelativeFrom,
			Align        : Align,
			Value        : Value
		}));

	this.PositionV.RelativeFrom = RelativeFrom;
	this.PositionV.Align        = Align;
	this.PositionV.Value        = Value;
};
CTable.prototype.Set_Distance = function(L, T, R, B)
{
	if (null === L || undefined === L)
		L = this.Distance.L;

	if (null === T || undefined === T)
		T = this.Distance.T;

	if (null === R || undefined === R)
		R = this.Distance.R;

	if (null === B || undefined === B)
		B = this.Distance.B;

	History.Add(new CChangesTableDistance(this, {
		Left   : this.Distance.L,
		Top    : this.Distance.T,
		Right  : this.Distance.R,
		Bottom : this.Distance.B
	}, {
		Left   : L,
		Top    : T,
		Right  : R,
		Bottom : B
	}));
	this.Distance.L = L;
	this.Distance.R = R;
	this.Distance.T = T;
	this.Distance.B = B;
};
CTable.prototype.Set_TableStyleRowBandSize = function(Value)
{
	if (this.Pr.TableStyleRowBandSize === Value)
		return;

	this.private_AddPrChange();
	History.Add(new CChangesTableTableStyleRowBandSize(this, this.Pr.TableStyleRowBandSize, Value));
	this.Pr.TableStyleRowBandSize = Value;
	this.Recalc_CompiledPr();
};
CTable.prototype.Get_TableStyleRowBandSize = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableStyleRowBandSize;
};
CTable.prototype.Set_TableStyleColBandSize = function(Value)
{
	if (this.Pr.TableStyleColBandSize === Value)
		return;

	this.private_AddPrChange();
	History.Add(new CChangesTableTableStyleColBandSize(this, this.Pr.TableStyleColBandSize, Value));
	this.Pr.TableStyleColBandSize = Value;
	this.Recalc_CompiledPr();
};
CTable.prototype.Get_TableStyleColBandSize = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableStyleColBandSize;
};
CTable.prototype.Get_ShapeStyleForPara = function()
{
	return this.Parent ? this.Parent.Get_ShapeStyleForPara() : null;
};
CTable.prototype.Set_TableW = function(Type, W)
{
	if (undefined === Type)
	{
		if (undefined === this.Pr.TableW)
			return;

		this.private_AddPrChange();
		History.Add(new CChangesTableTableW(this, this.Pr.TableW, undefined));
		this.Pr.TableW = undefined;
		this.Recalc_CompiledPr();
	}
	else if (undefined === this.Pr.TableW)
	{
		this.private_AddPrChange();
		var TableW = new CTableMeasurement(Type, W);
		History.Add(new CChangesTableTableW(this, undefined, TableW));
		this.Pr.TableW = TableW;
		this.Recalc_CompiledPr();
	}
	else if (Type != this.Pr.TableW.Type || Math.abs(this.Pr.TableW.W - W) > 0.001)
	{
		this.private_AddPrChange();
		var TableW = new CTableMeasurement(Type, W);
		History.Add(new CChangesTableTableW(this, this.Pr.TableW, TableW));
		this.Pr.TableW = TableW;
		this.Recalc_CompiledPr();
	}
};
CTable.prototype.Get_TableW = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableW;
};
/**
 * Задаем предпочитаемую ширину таблицы
 * @param nType
 * @param nW
 */
CTable.prototype.SetTableW = function(nType, nW)
{
	this.Set_TableW(nType, nW);
};
/**
 * Получаем предпочитаемую ширину таблицы
 * @returns {CTableMeasurement}
 */
CTable.prototype.GetTableW = function()
{
	return this.Get_TableW();
};
CTable.prototype.SetTableLayout = function(Value)
{
	if (this.Pr.TableLayout === Value)
		return;

	this.private_AddPrChange();
	History.Add(new CChangesTableTableLayout(this, this.Pr.TableLayout, Value));
	this.Pr.TableLayout = Value;
	this.Recalc_CompiledPr();
};
CTable.prototype.GetTableLayout = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableLayout;
};
CTable.prototype.Set_TableCellMar = function(Left, Top, Right, Bottom)
{
	var old_Left   = ( undefined === this.Pr.TableCellMar.Left ? undefined : this.Pr.TableCellMar.Left   );
	var old_Right  = ( undefined === this.Pr.TableCellMar.Right ? undefined : this.Pr.TableCellMar.Right  );
	var old_Top    = ( undefined === this.Pr.TableCellMar.Top ? undefined : this.Pr.TableCellMar.Top    );
	var old_Bottom = ( undefined === this.Pr.TableCellMar.Bottom ? undefined : this.Pr.TableCellMar.Bottom );

	var new_Left   = ( undefined === Left ? undefined : new CTableMeasurement(tblwidth_Mm, Left) );
	var new_Right  = ( undefined === Right ? undefined : new CTableMeasurement(tblwidth_Mm, Right) );
	var new_Top    = ( undefined === Top ? undefined : new CTableMeasurement(tblwidth_Mm, Top) );
	var new_Bottom = ( undefined === Bottom ? undefined : new CTableMeasurement(tblwidth_Mm, Bottom) );

	this.private_AddPrChange();
	History.Add(new CChangesTableTableCellMar(this, {
			Left   : old_Left,
			Right  : old_Right,
			Top    : old_Top,
			Bottom : old_Bottom
		}, {
			Left   : new_Left,
			Right  : new_Right,
			Top    : new_Top,
			Bottom : new_Bottom
		})
	);

	this.Pr.TableCellMar.Left   = new_Left;
	this.Pr.TableCellMar.Right  = new_Right;
	this.Pr.TableCellMar.Top    = new_Top;
	this.Pr.TableCellMar.Bottom = new_Bottom;

	this.Recalc_CompiledPr();
};
CTable.prototype.Get_TableCellMar = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableCellMar;
};
CTable.prototype.Set_TableAlign = function(Align)
{
	if (undefined === Align)
	{
		if (undefined === this.Pr.Jc)
			return;

		this.private_AddPrChange();
		History.Add(new CChangesTableTableAlign(this, this.Pr.Jc, undefined));
		this.Pr.Jc = undefined;
		this.Recalc_CompiledPr();
	}
	else if (undefined === this.Pr.Jc)
	{
		this.private_AddPrChange();
		History.Add(new CChangesTableTableAlign(this, undefined, Align));
		this.Pr.Jc = Align;
		this.Recalc_CompiledPr();
	}
	else if (Align != this.Pr.Jc)
	{
		this.private_AddPrChange();
		History.Add(new CChangesTableTableAlign(this, this.Pr.Jc, Align));
		this.Pr.Jc = Align;
		this.Recalc_CompiledPr();
	}
};
CTable.prototype.Get_TableAlign = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.Jc;
};
CTable.prototype.Set_TableInd = function(Ind)
{
	if (undefined === Ind)
	{
		if (undefined === this.Pr.TableInd)
			return;

		this.private_AddPrChange();
		History.Add(new CChangesTableTableInd(this, this.Pr.TableInd, undefined));
		this.Pr.TableInd = undefined;
		this.Recalc_CompiledPr();
	}
	else if (undefined === this.Pr.TableInd)
	{
		this.private_AddPrChange();
		History.Add(new CChangesTableTableInd(this, undefined, Ind));
		this.Pr.TableInd = Ind;
		this.Recalc_CompiledPr();
	}
	else if (Math.abs(this.Pr.TableInd - Ind) > 0.001)
	{
		this.private_AddPrChange();
		History.Add(new CChangesTableTableInd(this, this.Pr.TableInd, Ind));
		this.Pr.TableInd = Ind;
		this.Recalc_CompiledPr();
	}
};
CTable.prototype.Get_TableInd = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableInd;
};
CTable.prototype.Set_TableBorder_Left = function(Border)
{
	if (undefined === this.Pr.TableBorders.Left && undefined === Border)
		return;

	var _Border = Border;
	if (undefined !== _Border)
	{
		_Border = new CDocumentBorder();
		_Border.Set_FromObject(Border);
	}

	this.private_AddPrChange();
	History.Add(new CChangesTableTableBorderLeft(this, this.Pr.TableBorders.Left, _Border));
	this.Pr.TableBorders.Left = _Border;
	this.Recalc_CompiledPr();
};
CTable.prototype.Set_TableBorder_Right = function(Border)
{
	if (undefined === this.Pr.TableBorders.Right && undefined === Border)
		return;

	var _Border = Border;
	if (undefined !== _Border)
	{
		_Border = new CDocumentBorder();
		_Border.Set_FromObject(Border);
	}

	this.private_AddPrChange();
	History.Add(new CChangesTableTableBorderRight(this, this.Pr.TableBorders.Right, _Border));
	this.Pr.TableBorders.Right = _Border;
	this.Recalc_CompiledPr();
};
CTable.prototype.Set_TableBorder_Top = function(Border)
{
	if (undefined === this.Pr.TableBorders.Top && undefined === Border)
		return;

	var _Border = Border;
	if (undefined !== _Border)
	{
		_Border = new CDocumentBorder();
		_Border.Set_FromObject(Border);
	}

	this.private_AddPrChange();
	History.Add(new CChangesTableTableBorderTop(this, this.Pr.TableBorders.Top, _Border));
	this.Pr.TableBorders.Top = _Border;
	this.Recalc_CompiledPr();
};
CTable.prototype.Set_TableBorder_Bottom = function(Border)
{
	if (undefined === this.Pr.TableBorders.Bottom && undefined === Border)
		return;

	var _Border = Border;
	if (undefined !== _Border)
	{
		_Border = new CDocumentBorder();
		_Border.Set_FromObject(Border);
	}

	this.private_AddPrChange();
	History.Add(new CChangesTableTableBorderBottom(this, this.Pr.TableBorders.Bottom, _Border));
	this.Pr.TableBorders.Bottom = _Border;
	this.Recalc_CompiledPr();
};
CTable.prototype.Set_TableBorder_InsideH = function(Border)
{
	if (undefined === this.Pr.TableBorders.InsideH && undefined === Border)
		return;

	var _Border = Border;
	if (undefined !== _Border)
	{
		_Border = new CDocumentBorder();
		_Border.Set_FromObject(Border);
	}

	this.private_AddPrChange();
	History.Add(new CChangesTableTableBorderInsideH(this, this.Pr.TableBorders.InsideH, _Border));
	this.Pr.TableBorders.InsideH = _Border;
	this.Recalc_CompiledPr();
};
CTable.prototype.Set_TableBorder_InsideV = function(Border)
{
	if (undefined === this.Pr.TableBorders.InsideV && undefined === Border)
		return;

	var _Border = Border;
	if (undefined !== _Border)
	{
		_Border = new CDocumentBorder();
		_Border.Set_FromObject(Border);
	}

	this.private_AddPrChange();
	History.Add(new CChangesTableTableBorderInsideV(this, this.Pr.TableBorders.InsideV, _Border));
	this.Pr.TableBorders.InsideV = _Border;
	this.Recalc_CompiledPr();
};
CTable.prototype.Get_TableBorders = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableBorders;
};
CTable.prototype.GetTopTableBorder = function()
{
	return this.Get_CompiledPr(false).TablePr.TableBorders.Top;
};
CTable.prototype.GetBottomTableBorder = function()
{
	return this.Get_CompiledPr(false).TablePr.TableBorders.Bottom;
};
CTable.prototype.Set_TableShd = function(Value, r, g, b)
{
	if (undefined === Value && undefined === this.Pr.Shd)
		return;

	var _Shd = undefined;
	if (undefined !== Value)
	{
		_Shd       = new CDocumentShd();
		_Shd.Value = Value;
		_Shd.Color.Set(r, g, b);
	}

	this.private_AddPrChange();
	History.Add(new CChangesTableTableShd(this, this.Pr.Shd, _Shd));
	this.Pr.Shd = _Shd;
	this.Recalc_CompiledPr();
};
CTable.prototype.Get_Shd = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.Shd;
};
CTable.prototype.Get_Borders = function()
{
	return this.Get_TableBorders();
};
CTable.prototype.Set_TableDescription = function(sDescription)
{
	this.private_AddPrChange();
	History.Add(new CChangesTableTableDescription(this, this.Pr.TableDescription, sDescription));
	this.Pr.TableDescription = sDescription;
	this.Recalc_CompiledPr();
};
CTable.prototype.Get_TableDescription = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableDescription;
};
CTable.prototype.Set_TableCaption = function(sCaption)
{
	this.private_AddPrChange();
	History.Add(new CChangesTableTableCaption(this, this.Pr.TableCaption, sCaption));
	this.Pr.TableCaption = sCaption;
	this.Recalc_CompiledPr();
};
CTable.prototype.Get_TableCaption = function()
{
	var Pr = this.Get_CompiledPr(false).TablePr;
	return Pr.TableCaption;
};
//----------------------------------------------------------------------------------------------------------------------
// Работаем с сеткой таблицы
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.Split = function()
{
	// Пока данная функция используется только при добавлении секции. В этом случае мы делим таблицу на 2 части по
	// текущей строке. Если текущая строка первая, тогда не делим таблицу.

	var CurRow = this.CurCell.Row.Index;

	if (0 === CurRow)
		return null;

	var NewTable = new CTable(this.DrawingDocument, this.Parent, this.Inline, 0, 0, this.private_CopyTableGrid());

	var Len = this.Content.length;
	for (var RowIndex = CurRow; RowIndex < Len; RowIndex++)
	{
		NewTable.private_AddRow(RowIndex - CurRow, 0, false, this.Content[CurRow]);
		this.private_RemoveRow(CurRow);
	}

	NewTable.ReIndexing(0);
	this.ReIndexing(0);

	NewTable.SetPr(this.Pr.Copy());
	NewTable.Set_TableStyle2(this.TableStyle);
	NewTable.Set_TableLook(this.TableLook.Copy());

	// Сбросим селект и текущую позицию в таблицах
	this.MoveCursorToStartPos(false);
	NewTable.MoveCursorToStartPos(false);

	return NewTable;
};
CTable.prototype.Internal_CheckMerge = function()
{
	var bCanMerge = true;

	var Grid_start = -1;
	var Grid_end   = -1;

	var RowsInfo = [];
	var nRowMin  = -1;
	var nRowMax  = -1;

	for (var Index = 0; Index < this.Selection.Data.length; Index++)
	{
		var Pos  = this.Selection.Data[Index];
		var Row  = this.Content[Pos.Row];
		var Cell = Row.GetCell(Pos.Cell);

		var CellInfo     = Row.GetCellInfo(Pos.Cell);
		var StartGridCol = CellInfo.StartGridCol;
		var EndGridCol   = StartGridCol + Cell.GetGridSpan() - 1;

		var VMergeCount = this.Internal_GetVertMergeCount(Pos.Row, CellInfo.StartGridCol, Cell.GetGridSpan());

		for (var RowIndex = Pos.Row; RowIndex <= Pos.Row + VMergeCount - 1; RowIndex++)
		{
			if ("undefined" === typeof(RowsInfo[RowIndex]))
			{
				RowsInfo[RowIndex] = {
					Grid_start : StartGridCol,
					Grid_end   : EndGridCol
				};

				if (-1 === nRowMax || RowIndex > nRowMax)
					nRowMax = RowIndex;

				if (-1 === nRowMin || RowIndex < nRowMin)
					nRowMin = RowIndex;
			}
			else
			{
				if (StartGridCol < RowsInfo[RowIndex].Grid_start)
					RowsInfo[RowIndex].Grid_start = StartGridCol;

				if (EndGridCol > RowsInfo[RowIndex].Grid_end)
					RowsInfo[RowIndex].Grid_end = EndGridCol;
			}
		}
	}

	// Проверим, что селект строк идет без пропусков
	for (var nRowIndex = nRowMin; nRowIndex <= nRowMax; ++nRowIndex)
	{
		if (!RowsInfo[nRowIndex])
		{
			bCanMerge = false;
			break;
		}
	}

	for (var Index in RowsInfo)
	{
		if (-1 === Grid_start)
			Grid_start = RowsInfo[Index].Grid_start;
		else if (Grid_start != RowsInfo[Index].Grid_start)
		{
			bCanMerge = false;
			break;
		}

		if (-1 === Grid_end)
			Grid_end = RowsInfo[Index].Grid_end;
		else if (Grid_end != RowsInfo[Index].Grid_end)
		{
			bCanMerge = false;
			break;
		}
	}

	if (true === bCanMerge)
	{
		// Далее, мы должны убедиться, что у выеделенных ячеек верхние и нижние поля также
		// ровные (т.е. без выступов).
		// Для этого для каждой колонки, попавшей в отрезок [Grid_start, Grid_end] находим
		// верхнюю и нижнюю ячейку и смотрим на верхнюю и нижнюю строки данных ячеек,
		// соответственно

		var TopRow = -1;
		var BotRow = -1;

		for (var GridIndex = Grid_start; GridIndex <= Grid_end; GridIndex++)
		{
			var Pos_top = null;
			var Pos_bot = null;
			for (var Index = 0; Index < this.Selection.Data.length; Index++)
			{
				var Pos  = this.Selection.Data[Index];
				var Row  = this.Content[Pos.Row];
				var Cell = Row.Get_Cell(Pos.Cell);

				var StartGridCol = Row.Get_CellInfo(Pos.Cell).StartGridCol;
				var EndGridCol   = StartGridCol + Cell.Get_GridSpan() - 1;

				if (GridIndex >= StartGridCol && GridIndex <= EndGridCol)
				{
					if (null === Pos_top || Pos_top.Row > Pos.Row)
						Pos_top = Pos;

					if (null === Pos_bot || Pos_bot.Row < Pos.Row)
						Pos_bot = Pos;
				}
			}

			if (null === Pos_top || null === Pos_bot)
			{
				bCanMerge = false;
				break;
			}

			if (-1 === TopRow)
				TopRow = Pos_top.Row;
			else if (TopRow != Pos_top.Row)
			{
				bCanMerge = false;
				break;
			}

			var Row  = this.Content[Pos_bot.Row];
			var Cell = Row.Get_Cell(Pos_bot.Cell);

			var VMergeCount = this.Internal_GetVertMergeCount(Pos_bot.Row, Row.Get_CellInfo(Pos_bot.Cell).StartGridCol, Cell.Get_GridSpan());
			var CurBotRow   = Pos_bot.Row + VMergeCount - 1;

			if (-1 === BotRow)
				BotRow = CurBotRow;
			else if (BotRow != CurBotRow)
			{
				bCanMerge = false;
				break;
			}
		}

		// Объединенные ячейки образуют прямоугольник, но возможно в нем есть вырезы,
		// т.е. выделение такое, что в него попала строка с GridBefore или GridAfter > 0
		if (true === bCanMerge)
		{
			for (var RowIndex = TopRow; RowIndex <= BotRow; RowIndex++)
			{
				var Row         = this.Content[RowIndex];
				var Grid_before = Row.Get_Before().GridBefore;
				var Grid_after  = Row.Get_After().GridAfter;

				if (Grid_after <= 0 && Grid_before <= 0)
					continue;

				if (Grid_start < Grid_before)
				{
					bCanMerge = false;
					break;
				}

				var Cell         = Row.Get_Cell(Row.Get_CellsCount() - 1);
				var Row_grid_end = Cell.Get_GridSpan() - 1 + Row.Get_CellInfo(Row.Get_CellsCount() - 1).StartGridCol;
				if (Grid_end > Row_grid_end)
				{
					bCanMerge = false;
					break;
				}
			}
		}
	}

	return {Grid_start : Grid_start, Grid_end : Grid_end, RowsInfo : RowsInfo, bCanMerge : bCanMerge};
};
/**
 * Объединяем выделенные ячейки таблицы.
 * @param isClearMerge - используем или нет рассчетные данные (true - не используем, false - default value)
 */
CTable.prototype.MergeTableCells = function(isClearMerge)
{
	var bApplyToInnerTable = false;
	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
		bApplyToInnerTable = this.CurCell.Content.MergeTableCells();

	if (true === bApplyToInnerTable)
		return false;

	if (true != this.Selection.Use || table_Selection_Cell != this.Selection.Type || this.Selection.Data.length <= 1)
		return false;

	// В массиве this.Selection.Data идет список ячеек по строкам (без разрывов)
	// Перед объединением мы должны проверить совпадают ли начальная и конечная колонки
	// в сетке TableGrid для каждого ряда.
	var Temp       = this.Internal_CheckMerge();
	var bCanMerge  = Temp.bCanMerge;
	var Grid_start = Temp.Grid_start;
	var Grid_end   = Temp.Grid_end;
	var RowsInfo   = Temp.RowsInfo;

	if (false === bCanMerge)
		return false;

	// Объединяем содержимое всех ячеек в левую верхнюю ячейку. (Все выделенные
	// ячейки идут у нас последовательно, начиная с левой верхней), и объединяем
	// сами ячейки.

	var Pos_tl  = this.Selection.Data[0];
	var Cell_tl = this.Content[Pos_tl.Row].Get_Cell(Pos_tl.Cell);

	for (var Index = 0; Index < this.Selection.Data.length; Index++)
	{
		var Pos  = this.Selection.Data[Index];
		var Row  = this.Content[Pos.Row];
		var Cell = Row.Get_Cell(Pos.Cell);

		// Добавляем содержимое данной ячейки к содержимому левой верхней ячейки
		if (0 != Index)
		{
			Cell_tl.Content_Merge(Cell.Content);
			Cell.Content.Clear_Content();
		}
	}

	if (true !== isClearMerge)
	{
		// Выставим ширину результируещей ячейки
		var SumW = 0;
		for (var CurGridCol = Grid_start; CurGridCol <= Grid_end; CurGridCol++)
		{
			SumW += this.TableGridCalc[CurGridCol];
		}
		Cell_tl.Set_W(new CTableMeasurement(tblwidth_Mm, SumW));
	}

	// Теперь нам надо удалить лишние ячейки и добавить ячейки с
	// вертикальным объединением.
	for (var RowIndex in RowsInfo)
	{
		var Row = this.Content[RowIndex];
		for (var CellIndex = 0; CellIndex < Row.Get_CellsCount(); CellIndex++)
		{
			var Cell_grid_start = Row.Get_CellInfo(CellIndex).StartGridCol;

			if (Grid_start === Cell_grid_start)
			{
				if (RowIndex != Pos_tl.Row)
				{
					var Cell = Row.Get_Cell(CellIndex);
					Cell.Set_GridSpan(Grid_end - Grid_start + 1);
					Cell.SetVMerge(vmerge_Continue);
				}
				else
				{
					Cell_tl.Set_GridSpan(Grid_end - Grid_start + 1);
				}
			}
			else if (Cell_grid_start > Grid_start && Cell_grid_start <= Grid_end)
			{
				Row.Remove_Cell(CellIndex);
				CellIndex--;
			}
			else if (Cell_grid_start > Grid_end)
				break;
		}
	}

	// Удаляем лишние строки
	this.Internal_Check_TableRows(true !== isClearMerge ? true : false);
	for (var PageNum = 0; PageNum < this.Pages.length - 1; PageNum++)
	{
		if (Pos_tl.Row <= this.Pages[PageNum + 1].FirstRow)
			break;
	}

	// Выделяем полученную ячейку
	this.Selection.Use          = true;
	this.Selection.StartPos.Pos = Pos_tl;
	this.Selection.EndPos.Pos   = Pos_tl;
	this.Selection.Type         = table_Selection_Cell;
	this.Selection.Data         = [Pos_tl];

	this.CurCell = Cell_tl;

	this.CurCell.GetContent().SelectAll();

	if (true !== isClearMerge)
	{
		// Запускаем пересчет
		this.Internal_Recalculate_1();
	}

	return true;
};
/**
 * Разделяем текущую ячейку
 */
CTable.prototype.SplitTableCells = function(Cols, Rows)
{
	var bApplyToInnerTable = false;
	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
		bApplyToInnerTable = this.CurCell.Content.SplitTableCells(Cols, Rows);

	if (true === bApplyToInnerTable)
		return true;

	// Разделение ячейки работает, только если выделена ровно одна ячейка.
	if (!( false === this.Selection.Use || ( true === this.Selection.Use && ( table_Selection_Text === this.Selection.Type || ( table_Selection_Cell === this.Selection.Type && 1 === this.Selection.Data.length  ) ) ) ))
		return false;

	var Cell_pos = null;
	var Cell     = null;

	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
	{
		Cell     = this.CurCell;
		Cell_pos =
			{
				Cell : Cell.Index,
				Row  : Cell.Row.Index
			};
	}
	else
	{
		Cell_pos = this.Selection.Data[0];
		Cell     = this.Content[Cell_pos.Row].Get_Cell(Cell_pos.Cell);
	}

	var Row = this.Content[Cell_pos.Row];

	var Grid_start = Row.Get_CellInfo(Cell_pos.Cell).StartGridCol;
	var Grid_span  = Cell.Get_GridSpan();

	var VMerge_count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span);

	// Если данная ячейка имеет вертикальное объединение, тогда по вертикали мы
	// ее разбиваем максимально на VMerge_count частей, если значение Rows превышает
	// заданное максимально допустимое значение или Rows не является делителем
	// числа VMerge_count - выдаем ошибку.
	// Если данная ячейка не учавствует в вертикальном объединении, тогда мы спокойно
	// можем делить ячейку на любое количество строк.
	if (VMerge_count > 1)
	{
		if (Rows > VMerge_count)
		{
			// Сообщение об ошибке : "Value Rows must be between 1 and " + VMerge_count
			var ErrData = new AscCommon.CErrorData();
			ErrData.put_Value(VMerge_count);
			editor.sendEvent("asc_onError", c_oAscError.ID.SplitCellMaxRows, c_oAscError.Level.NoCritical, ErrData);
			return false;
		}
		else if (0 != VMerge_count % Rows)
		{
			// Сообщение об ошибке : "Value must be a divisor of the number " + VMerge_count
			var ErrData = new AscCommon.CErrorData();
			ErrData.put_Value(VMerge_count);
			editor.sendEvent("asc_onError", c_oAscError.ID.SplitCellRowsDivider, c_oAscError.Level.NoCritical, ErrData);
			return false;
		}
	}

	// Сделаем оценку макимального количества колонок
	if (Cols > 1)
	{
		var Sum_before = this.TableSumGrid[Grid_start - 1];
		var Sum_with   = this.TableSumGrid[Grid_start + Grid_span - 1];

		var Span_width = Sum_with - Sum_before;
		var Grid_width = Span_width / Cols;

		var CellSpacing = Row.Get_CellSpacing();
		var CellMar     = Cell.GetMargins();

		var MinW = CellSpacing + CellMar.Right.W + CellMar.Left.W;

		if (Grid_width < MinW)
		{
			var MaxCols = Math.floor(Span_width / MinW);

			// Сообщение об ошибке : "Value Cols must be a between 1 and " + MaxCols
			var ErrData = new AscCommon.CErrorData();
			ErrData.put_Value(MaxCols);
			editor.sendEvent("asc_onError", c_oAscError.ID.SplitCellMaxCols, c_oAscError.Level.NoCritical, ErrData);
			return false;
		}
	}


	var Cells     = [];
	var Cells_pos = [];
	var Rows_     = [];

	if (Rows <= 1)
	{
		for (var Index = 0; Index < VMerge_count; Index++)
		{
			var TempRow = this.Content[Cell_pos.Row + Index];

			Rows_[Index]     = TempRow;
			Cells[Index]     = null;
			Cells_pos[Index] = null;

			// Ищем ячейку, начинающуюся с Grid_start

			var CellsCount = TempRow.Get_CellsCount();
			for (var CurCell = 0; CurCell < CellsCount; CurCell++)
			{
				var StartGridCol = TempRow.Get_CellInfo(CurCell).StartGridCol;
				if (StartGridCol === Grid_start)
				{
					Cells[Index]     = TempRow.Get_Cell(CurCell);
					Cells_pos[Index] = {Row : Cell_pos.Row + Index, Cell : CurCell};
				}
			}
		}
	}
	else
	{
		if (VMerge_count > 1)
		{
			var New_VMerge_Count = VMerge_count / Rows;

			for (var Index = 0; Index < VMerge_count; Index++)
			{
				var TempRow = this.Content[Cell_pos.Row + Index];

				Rows_[Index]     = TempRow;
				Cells[Index]     = null;
				Cells_pos[Index] = null;

				// Ищем ячейку, начинающуюся с Grid_start
				var CellsCount = TempRow.Get_CellsCount();
				for (var CurCell = 0; CurCell < CellsCount; CurCell++)
				{
					var StartGridCol = TempRow.Get_CellInfo(CurCell).StartGridCol;
					if (StartGridCol === Grid_start)
					{
						var TempCell     = TempRow.Get_Cell(CurCell);
						Cells[Index]     = TempCell;
						Cells_pos[Index] = {Row : Cell_pos.Row + Index, Cell : CurCell};

						if (0 === Index % New_VMerge_Count)
							TempCell.SetVMerge(vmerge_Restart);
						else
							TempCell.SetVMerge(vmerge_Continue);
					}
				}
			}
		}
		else
		{
			// Делаем разбиение по вертикали

			// Нам нужно добавить несколько точных копий текущей строки, только все ячейки,
			// кроме текущей, должны быть объединены по вертикали.

			Rows_[0]     = Row;
			Cells[0]     = Cell;
			Cells_pos[0] = Cell_pos;

			var CellsCount = Row.Get_CellsCount();
			for (var Index = 1; Index < Rows; Index++)
			{
				var NewRow = this.private_AddRow(Cell_pos.Row + Index, CellsCount);
				NewRow.Copy_Pr(Row.Pr);

				Rows_[Index]     = NewRow;
				Cells[Index]     = null;
				Cells_pos[Index] = null;

				// Копируем настройки всех ячеек исходной строки в новую строку
				for (var CurCell = 0; CurCell < CellsCount; CurCell++)
				{
					var New_Cell = NewRow.Get_Cell(CurCell);
					var Old_Cell = Row.Get_Cell(CurCell);

					New_Cell.Copy_Pr(Old_Cell.Pr);

					if (CurCell === Cell_pos.Cell)
					{
						Cells[Index]     = New_Cell;
						Cells_pos[Index] = {Row : Cell_pos.Row + Index, Cell : CurCell};
					}
					else
					{
						New_Cell.SetVMerge(vmerge_Continue);
					}
				}
			}
		}
	}

	// Сделаем разбиение по горизонтали
	if (Cols > 1)
	{
		// Найдем позиции новых колонок в сетке
		var Sum_before = this.TableSumGrid[Grid_start - 1];
		var Sum_with   = this.TableSumGrid[Grid_start + Grid_span - 1];

		var Span_width = Sum_with - Sum_before;
		var Grid_width = Span_width / Cols;

		// Данный массив содержит информацию о том сколько новых колонок
		// было добавлено после i-ой колонки
		var Grid_Info = [];
		for (var Index = 0; Index < this.TableGridCalc.length; Index++)
			Grid_Info[Index] = 0;

		// Массив содержит информацию о том сколько промежутков будет в
		// новых ячейках
		var Grid_Info_new = [];
		for (var Index = 0; Index < Cols; Index++)
			Grid_Info_new[Index] = 1;

		var Grid_Info_start = [];
		for (var Index = 0; Index < this.TableGridCalc.length; Index++)
			Grid_Info_start[Index] = this.TableGridCalc[Index];

		var NewCol_Index = 0;

		var CurWidth = Sum_before + Grid_width;
		for (var Grid_index = Grid_start; Grid_index < Grid_start + Grid_span; Grid_index++)
		{
			var bNewCol = true;

			// Если мы попали в уже имеющуюся границу не добавляем новую точку
			if (Math.abs(CurWidth - this.TableSumGrid[Grid_index]) < 0.001)
			{
				NewCol_Index++;
				CurWidth += Grid_width;
				bNewCol = false;
				continue;
			}

			while (CurWidth < this.TableSumGrid[Grid_index])
			{
				if (0 === Grid_Info[Grid_index])
					Grid_Info_start[Grid_index] = CurWidth - this.TableSumGrid[Grid_index - 1];
				Grid_Info[Grid_index] += 1;

				NewCol_Index++
				CurWidth += Grid_width;

				// Если мы попали в уже имеющуюся границу не добавляем новую точку
				if (Math.abs(CurWidth - this.TableSumGrid[Grid_index]) < 0.001)
				{
					NewCol_Index++;
					CurWidth += Grid_width;
					bNewCol = false;
					break;
				}
			}

			if (true === bNewCol)
				Grid_Info_new[NewCol_Index] += 1;
		}

		// Добавим в данной строке (Cols - 1) ячеек, с теми же настроками,
		// что и исходной. Значение GridSpan мы берем из массива Grid_Info_new

		for (var Index2 = 0; Index2 < Rows_.length; Index2++)
		{
			if (null != Cells[Index2] && null != Cells_pos[Index2])
			{
				var TempRow      = Rows_[Index2];
				var TempCell     = Cells[Index2];
				var TempCell_pos = Cells_pos[Index2];

				TempCell.Set_GridSpan(Grid_Info_new[0]);
				TempCell.Set_W(new CTableMeasurement(tblwidth_Mm, Grid_width));

				for (var Index = 1; Index < Cols; Index++)
				{
					var NewCell = TempRow.Add_Cell(TempCell_pos.Cell + Index, TempRow, null, false);
					NewCell.Copy_Pr(TempCell.Pr);
					NewCell.Set_GridSpan(Grid_Info_new[Index]);
					NewCell.Set_W(new CTableMeasurement(tblwidth_Mm, Grid_width));
				}
			}
		}

		var OldTableGridLen = this.TableGridCalc.length;
		var arrNewGrid      = this.private_CopyTableGrid();

		// Добавим новые колонки в TableGrid
		// начинаем с конца, чтобы не пересчитывать номера
		for (var Index = OldTableGridLen - 1; Index >= 0; Index--)
		{
			var Summary = this.TableGridCalc[Index];

			if (Grid_Info[Index] > 0)
			{
				arrNewGrid[Index] = Grid_Info_start[Index];
				Summary -= Grid_Info_start[Index] - Grid_width;

				for (var NewIndex = 0; NewIndex < Grid_Info[Index]; NewIndex++)
				{
					Summary -= Grid_width;

					if (NewIndex != Grid_Info[Index] - 1)
						arrNewGrid.splice(Index + NewIndex + 1, 0, Grid_width);
					else
						arrNewGrid.splice(Index + NewIndex + 1, 0, Summary);
				}
			}
		}
		this.SetTableGrid(arrNewGrid);

		// Проходим по всем строкам и изменяем у ячеек GridSpan, в
		// соответствии со значениями массива Grid_Info
		for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
		{
			if (CurRow >= Cells_pos[0].Row && CurRow <= Cells_pos[Cells_pos.length - 1].Row)
				continue;

			var TempRow = this.Content[CurRow];

			var GridBefore = TempRow.Get_Before().GridBefore;
			var GridAfter  = TempRow.Get_After().GridAfter;

			if (GridBefore > 0)
			{
				var SummaryGridSpan = GridBefore;
				for (var CurGrid = 0; CurGrid < GridBefore; CurGrid++)
					SummaryGridSpan += Grid_Info[CurGrid];

				TempRow.Set_Before(SummaryGridSpan);
			}

			var LastGrid = 0;

			for (var CurCell = 0; CurCell < TempRow.Get_CellsCount(); CurCell++)
			{
				var TempCell      = TempRow.Get_Cell(CurCell);
				var TempGridSpan  = TempCell.Get_GridSpan();
				var TempStartGrid = TempRow.Get_CellInfo(CurCell).StartGridCol;

				var SummaryGridSpan = TempGridSpan;

				LastGrid = TempStartGrid + TempGridSpan;

				for (var CurGrid = TempStartGrid; CurGrid < TempStartGrid + TempGridSpan; CurGrid++)
					SummaryGridSpan += Grid_Info[CurGrid];

				TempCell.Set_GridSpan(SummaryGridSpan);
			}

			if (GridAfter > 0)
			{
				var SummaryGridSpan = GridAfter;
				for (var CurGrid = LastGrid; CurGrid < OldTableGridLen; CurGrid++)
					SummaryGridSpan += Grid_Info[CurGrid];

				TempRow.Set_After(SummaryGridSpan);
			}
		}
	}

	this.ReIndexing();
	this.Recalc_CompiledPr2();
	this.private_RecalculateGrid();
	this.Internal_Recalculate_1();

	return true;
};
/**
 * Добавление строки.
 * @param bBefore - true - до(сверху) первой выделенной строки, false - после(снизу) последней выделенной строки.
 * @param {boolean} [isCheckInnerTable=true] Выполнять ли данную функцию для внутренней таблицы
 */
CTable.prototype.AddTableRow = function(bBefore, isCheckInnerTable)
{
	if ("undefined" === typeof(bBefore))
		bBefore = true;

	var bApplyToInnerTable = false;
	if (false !== isCheckInnerTable && (false === this.Selection.Use || (true === this.Selection.Use && table_Selection_Text === this.Selection.Type)))
		bApplyToInnerTable = this.CurCell.Content.AddTableRow(bBefore);

	if (true === bApplyToInnerTable)
		return;

	var Cells_pos = [];

	// Количество, вставляемых строк зависит от того сколько содержится
	// строк в выделении. Если вставляем до, тогда копируем верхнюю строку
	// выделения, а если после, тогда последнюю.
	var Count = 1;
	var RowId = 0;

	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		Cells_pos = this.Selection.Data;

		var Prev_row = -1;
		Count        = 0;
		for (var Index = 0; Index < this.Selection.Data.length; Index++)
		{
			if (Prev_row != this.Selection.Data[Index].Row)
			{
				Count++;
				Prev_row = this.Selection.Data[Index].Row;
			}
		}
	}
	else
	{
		Cells_pos[0] = {Row : this.CurCell.Row.Index, Cell : this.CurCell.Index};
		Count        = 1;
	}

	if (Cells_pos.length <= 0)
		return;

	if (true === bBefore)
		RowId = Cells_pos[0].Row;
	else
		RowId = Cells_pos[Cells_pos.length - 1].Row;

	var Row        = this.Content[RowId];
	var CellsCount = Row.Get_CellsCount();

	// Сначала пробежимся по строке, которую мы будем копировать, и получим
	// всю необходимую информацию.
	var Cells_info = [];
	for (var CurCell = 0; CurCell < CellsCount; CurCell++)
	{
		var Cell      = Row.GetCell(CurCell);
		var Cell_info = Row.Get_CellInfo(CurCell);

		var Cell_grid_start = Cell_info.StartGridCol;
		var Cell_grid_span  = Cell.Get_GridSpan();

		var VMerge_count_before = this.Internal_GetVertMergeCount2(RowId, Cell_grid_start, Cell_grid_span);
		var VMerge_count_after  = this.Internal_GetVertMergeCount(RowId, Cell_grid_start, Cell_grid_span);

		Cells_info[CurCell] = {
			VMerge_count_before : VMerge_count_before,
			VMerge_count_after  : VMerge_count_after
		};
	}

	// TODO: Пока делаем одинаковый CellSpacing
	var CellSpacing = this.Content[0].Get_CellSpacing();

	for (var Index = 0; Index < Count; Index++)
	{
		var New_Row = null;

		if (true === bBefore)
			New_Row = this.private_AddRow(RowId, CellsCount, true);
		else
			New_Row = this.private_AddRow(RowId + 1, CellsCount, true);

		New_Row.Copy_Pr(Row.Pr);
		New_Row.Set_CellSpacing(CellSpacing);

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var New_Cell = New_Row.Get_Cell(CurCell);
			var Old_Cell = Row.Get_Cell(CurCell);

			New_Cell.Copy_Pr(Old_Cell.Pr);

			// Копируем также текстовые настройки и настройки параграфа
			var oFirstPara = Old_Cell.GetContent().GetFirstParagraph();
			if (oFirstPara)
			{
				var oNewCellContent = New_Cell.GetContent();

				var arrAllParagraphs = oNewCellContent.GetAllParagraphs({All : true});
				for (var nParaIndex = 0, nParasCount = arrAllParagraphs.length; nParaIndex < nParasCount; ++nParaIndex)
				{
					var oTempPara = arrAllParagraphs[nParaIndex];
					oTempPara.SetDirectParaPr(oFirstPara.GetDirectParaPr(true));
					oTempPara.SetDirectTextPr(oFirstPara.GetFirstRunPr(), false);
				}
			}

			if (true === bBefore)
			{
				if (Cells_info[CurCell].VMerge_count_before > 1)
					New_Cell.SetVMerge(vmerge_Continue);
				else
					New_Cell.SetVMerge(vmerge_Restart);
			}
			else
			{
				if (Cells_info[CurCell].VMerge_count_after > 1)
					New_Cell.SetVMerge(vmerge_Continue);
				else
					New_Cell.SetVMerge(vmerge_Restart);
			}
		}
	}

	// Выделим новые строки
	this.Selection.Use = true;

	if (null != this.Selection.Data)
		this.Selection.Data.length = 0;
	else
		this.Selection.Data = [];

	this.Selection.Use  = true;
	this.Selection.Type = table_Selection_Cell;

	var StartRow = ( true === bBefore ? RowId : RowId + 1 );

	this.Selection.StartPos.Pos = {
		Row  : StartRow,
		Cell : 0
	};
	this.Selection.EndPos.Pos = {
		Row  : StartRow + Count - 1,
		Cell : this.Content[StartRow + Count - 1].GetCellsCount() - 1
	};

	for (var Index = 0; Index < Count; Index++)
	{
		var Row        = this.Content[StartRow + Index];
		var CellsCount = Row.Get_CellsCount();

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			if (vmerge_Continue === Cell.GetVMerge())
				continue;

			this.Selection.Data.push({Row : StartRow + Index, Cell : CurCell});
		}
	}

	this.Recalc_CompiledPr2();
};
/**
 * Удаление строки либо по номеру Ind, либо по выделению Selection, либо по текущей ячейке.
 */
CTable.prototype.RemoveTableRow = function(Ind)
{
	var bApplyToInnerTable = false;
	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
		bApplyToInnerTable = this.CurCell.Content.RemoveTableRow(Ind);

	if (true === bApplyToInnerTable)
		return true;

	var Rows_to_delete = [];

	if ("undefined" === typeof(Ind) || null === Ind)
	{
		if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		{
			var Counter = 0;
			var PrevRow = -1;
			for (var Index = 0; Index < this.Selection.Data.length; Index++)
			{
				var CurPos = this.Selection.Data[Index];
				if (CurPos.Row != PrevRow)
					Rows_to_delete[Counter++] = CurPos.Row;

				PrevRow = CurPos.Row;
			}
		}
		else
			Rows_to_delete[0] = this.CurCell.Row.Index;
	}
	else
		Rows_to_delete[0] = Ind;

	if (Rows_to_delete.length <= 0)
		return;

	// Строки мы удаляем либо по 1, либо непрервным блоком. При удалении мы
	// смотрим на следующую строку после удаляемого блока и проверяем, если
	// какая-либо из ячеек данной строки учавствует в вертикальном объединении,
	// тогда проверяем где оно началось. Если начало объединения выше
	// строк, тогда ничего не делаем, в противном случае начинаем вертикальное
	// объединение с текущей ячейки.

	var FirstRow_to_delete = Rows_to_delete[0];
	var CurRow             = Rows_to_delete[Rows_to_delete.length - 1] + 1;
	if (CurRow < this.Content.length)
	{
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell   = Row.Get_Cell(CurCell);
			var VMerge = Cell.GetVMerge();

			if (vmerge_Continue != VMerge)
				continue;

			// Данная ячейка продолжает вертикальное объединение ячеек
			// Найдем строку, с которой начинается данное объединение.
			var VMerge_count = this.Internal_GetVertMergeCount2(CurRow, Row.Get_CellInfo(CurCell).StartGridCol, Cell.Get_GridSpan());
			if (CurRow - ( VMerge_count - 1 ) >= FirstRow_to_delete)
				Cell.SetVMerge(vmerge_Restart);
		}
	}

	this.RemoveSelection();

	var oLogicDocument   = this.LogicDocument;
	var isTrackRevisions = oLogicDocument ? oLogicDocument.IsTrackRevisions() : false;

	if (isTrackRevisions)
	{
		// Удаляем строки
		for (var nIndex = Rows_to_delete.length - 1; nIndex >= 0; --nIndex)
		{
			var oRow = this.GetRow(Rows_to_delete[nIndex]);

			var nRowReviewType = oRow.GetReviewType();
			var oRowReviewInfo = oRow.GetReviewInfo();
			if (reviewtype_Add === nRowReviewType && oRowReviewInfo.IsCurrentUser())
			{
				this.private_RemoveRow(Rows_to_delete[nIndex]);
			}
			else
			{
				for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
				{
					var oCellContent = oRow.GetCell(nCurCell).GetContent();
					oCellContent.SelectAll();
					oCellContent.Remove();
					oCellContent.RemoveSelection();
				}

				oRow.SetReviewType(reviewtype_Remove);
			}
		}
	}
	else
	{
		// Удаляем строки
		for (var Index = Rows_to_delete.length - 1; Index >= 0; Index--)
		{
			this.private_RemoveRow(Rows_to_delete[Index]);
		}
	}

	// Возвращаем курсор
	this.DrawingDocument.TargetStart();
	this.DrawingDocument.TargetShow();

	this.DrawingDocument.SelectEnabled(false);

	// При удалении последней строки, надо сообщить об этом родительскому классу
	if (this.Content.length <= 0)
		return false;

	// Перемещаем курсор в начало следующей строки
	var CurRow   = Math.min(Rows_to_delete[0], this.Content.length - 1);
	var Row      = this.Content[CurRow];
	this.CurCell = Row.Get_Cell(0);
	this.CurCell.Content.MoveCursorToStartPos();

	var PageNum = 0;
	for (PageNum = 0; PageNum < this.Pages.length - 1; PageNum++)
	{
		if (CurRow <= this.Pages[PageNum + 1].FirstRow)
			break;
	}

	this.Markup.Internal.RowIndex  = CurRow;
	this.Markup.Internal.CellIndex = 0;
	this.Markup.Internal.PageNum   = PageNum;

	this.Recalc_CompiledPr2();

	return true;
};
/**
 * Специальная функция для удаления строк таблицы, когда выделены одновременно параграф и таблица
 */
CTable.prototype.Row_Remove2 = function()
{
	if (false == this.Selection.Use || table_Selection_Text == this.Selection.Type)
		return true;

	var Rows_to_delete = [];
	for (var Index = 0; Index < this.Content.length; Index++)
		Rows_to_delete[Index] = 0;

	for (var Index = 0; Index < this.Selection.Data.length; Index++)
	{
		var Pos = this.Selection.Data[Index];
		if (0 == Rows_to_delete[Pos.Row])
			Rows_to_delete[Pos.Row] = 1;
	}

	// Удаляем строки.
	for (var Index = this.Content.length - 1; Index >= 0; Index--)
	{
		if (0 != Rows_to_delete[Index])
			this.private_RemoveRow(Index);
	}

	// При удалении последней строки, надо сообщить об этом родительскому классу
	if (this.Content.length <= 0)
		return false;

	// Проверяем текущую ячейку
	if (this.CurCell.Row.Index >= this.Content.length)
		this.CurCell = this.Content[this.Content.length - 1].Get_Cell(0);

	this.RemoveSelection();

	return true;
};
/**
 * Удаление колонки либо по выделению Selection, либо по текущей ячейке.
 */
CTable.prototype.RemoveTableColumn = function()
{
	var bApplyToInnerTable = false;
	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
		bApplyToInnerTable = this.CurCell.Content.RemoveTableColumn();

	if (true === bApplyToInnerTable)
		return true;

	// Найдем правую и левую границы выделенных ячеек.
	var Cells_pos = [];

	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
		Cells_pos = this.Selection.Data;
	else
		Cells_pos[0] = {Row : this.CurCell.Row.Index, Cell : this.CurCell.Index};

	if (Cells_pos.length <= 0)
		return;

	var Grid_start = -1;
	var Grid_end   = -1;
	for (var Index = 0; Index < Cells_pos.length; Index++)
	{
		var Row  = this.Content[Cells_pos[Index].Row];
		var Cell = Row.Get_Cell(Cells_pos[Index].Cell);

		var Cur_Grid_start = Row.Get_CellInfo(Cells_pos[Index].Cell).StartGridCol;
		var Cur_Grid_end   = Cur_Grid_start + Cell.Get_GridSpan() - 1;

		if (-1 === Grid_start || ( -1 != Grid_start && Grid_start > Cur_Grid_start ))
			Grid_start = Cur_Grid_start;

		if (-1 === Grid_end || ( -1 != Grid_end && Grid_end < Cur_Grid_end ))
			Grid_end = Cur_Grid_end;
	}

	// Пробегаемся по всем строкам и смотрим, если у какой либо ячейки
	// есть пересечение с отрезком [Grid_start, Grid_end], тогда удаляем
	// данную ячейку.

	var Delete_info = [];
	var Rows_info   = [];

	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		Delete_info[CurRow] = [];
		Rows_info[CurRow]   = [];

		var Row = this.Content[CurRow];

		var Before_Info = Row.Get_Before();
		if (Before_Info.GridBefore > 0)
			Rows_info[CurRow].push({W : this.TableSumGrid[Before_Info.GridBefore - 1], Type : -1, GridSpan : 1});

		var CellsCount = Row.Get_CellsCount();
		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell           = Row.Get_Cell(CurCell);
			var Cur_Grid_start = Row.Get_CellInfo(CurCell).StartGridCol;
			var Cur_Grid_end   = Cur_Grid_start + Cell.Get_GridSpan() - 1;

			if (Cur_Grid_start <= Grid_end && Cur_Grid_end >= Grid_start)
			{
				Delete_info[CurRow].push(CurCell);
			}
			else
			{
				var W = this.TableSumGrid[Cur_Grid_end] - this.TableSumGrid[Cur_Grid_start - 1];
				Rows_info[CurRow].push({W : W, Type : 0, GridSpan : 1});
			}
		}
	}

	// Удалим все ячейки
	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var Row = this.Content[CurRow];
		for (var Index = Delete_info[CurRow].length - 1; Index >= 0; Index--)
		{
			var CurCell = Delete_info[CurRow][Index];
			Row.Remove_Cell(CurCell);
		}
	}

	// При удалении колонки возможен случай, когда удаляется строка целиком
	for (var CurRow = this.Content.length - 1; CurRow >= 0; CurRow--)
	{
		// Строка удалена целиком, если в RowsInfo нет ни одной записи
		// о ячейках (т.е. с типом равным 0)
		var bRemove = true;
		for (var Index = 0; Index < Rows_info[CurRow].length; Index++)
		{
			if (0 === Rows_info[CurRow][Index].Type)
			{
				bRemove = false;
				break;
			}
		}

		if (true === bRemove)
		{
			this.private_RemoveRow(CurRow);
			Rows_info.splice(CurRow, 1);
		}
	}

	// Возвращаем курсор
	this.DrawingDocument.TargetStart();
	this.DrawingDocument.TargetShow();

	this.DrawingDocument.SelectEnabled(false);

	// При удалении последней строки, надо сообщить об этом родительскому классу
	if (this.Content.length <= 0)
		return false;

	// TODO: При удалении колонки надо запоминать информацию об вертикально
	//       объединенных ячейках, и в новой сетке объединять ячейки только
	//       если они были объединены изначально. Сейчас если ячейка была
	//       объединена с какой-либо ячейков, то она может после удаления колонки
	//       объединиться с совсем другой ячейкой.

	this.Internal_CreateNewGrid(Rows_info);

	// Пробегаемся по всем ячейкам и смотрим на их вертикальное объединение, было ли оно нарушено
	this.private_CorrectVerticalMerge();

	// Возможен случай, когда у нас остались строки, полностью состоящие из объединенных вертикально ячеек
	for (var CurRow = this.Content.length - 1; CurRow >= 0; CurRow--)
	{
		var bRemove    = true;
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell = Row.Get_Cell(CurCell);
			if (vmerge_Continue != Cell.GetVMerge())
			{
				bRemove = false;
				break;
			}
		}

		if (true === bRemove)
		{
			this.private_RemoveRow(CurRow);
		}
	}

	// Перемещаем курсор в начало следующей колонки
	var CurRow     = 0;
	var Row        = this.Content[CurRow];
	var CellsCount = Row.Get_CellsCount();
	var CurCell    = Delete_info[0][0] === undefined ? CellsCount - 1 : Math.min(Delete_info[0][0], CellsCount - 1);

	this.CurCell = Row.Get_Cell(CurCell);
	this.CurCell.Content.MoveCursorToStartPos();
	var PageNum = 0;

	this.Markup.Internal.RowIndex  = CurRow;
	this.Markup.Internal.CellIndex = CurCell;
	this.Markup.Internal.PageNum   = PageNum;

	this.Selection.Use          = false;
	this.Selection.Start        = false;
	this.Selection.StartPos.Pos = {Row : CurRow, Cell : CurCell};
	this.Selection.EndPos.Pos   = {Row : CurRow, Cell : CurCell};
	this.Selection.CurRow       = CurRow;

	this.private_RecalculateGrid();
	this.Internal_Recalculate_1();

	return true;
};
/**
 * Добавление колонки.
 * @param bBefore - true - до(слева) первой выделенной колонки, false - после(справа) последней выделенной колонки.
 */
CTable.prototype.AddTableColumn = function(bBefore)
{
	if ("undefined" === typeof(bBefore))
		bBefore = true;

	var bApplyToInnerTable = false;
	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
		bApplyToInnerTable = this.CurCell.Content.AddTableColumn(bBefore);

	if (true === bApplyToInnerTable)
		return;

	var Cells_pos = [];

	// Количество, вставляемых столбцов зависит от того сколько содержится
	// ячеек в первой строке выделения. Ширина берется у первой ячейки, если
	// bBefore = true, и у последней, если bBefore = false.
	var Count = 1;
	var Width = 0;

	if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		Cells_pos = this.Selection.Data;

		var Prev_row = -1;
		Count        = 0;
		for (var Index = 0; Index < this.Selection.Data.length; Index++)
		{
			if (-1 != Prev_row)
			{
				if (Prev_row === this.Selection.Data[Index].Row)
					Count++;
				else
					break;
			}
			else
			{
				Count++;
				Prev_row = this.Selection.Data[Index].Row;
			}
		}
	}
	else
	{
		Cells_pos[0] = {Row : this.CurCell.Row.Index, Cell : this.CurCell.Index};
		Count        = 1;
	}

	if (Cells_pos.length <= 0)
		return;

	if (true === bBefore)
	{
		// Вычислим ширину первой ячейки
		var FirstCell_Grid_start = this.Content[Cells_pos[0].Row].Get_CellInfo(Cells_pos[0].Cell).StartGridCol;
		var FirstCell_Grid_end   = FirstCell_Grid_start + this.Content[Cells_pos[0].Row].Get_Cell(Cells_pos[0].Cell).Get_GridSpan() - 1;
		Width                    = this.TableSumGrid[FirstCell_Grid_end] - this.TableSumGrid[FirstCell_Grid_start - 1];
	}
	else
	{
		// Вычислим ширину последней ячейки
		var LastPos = Cells_pos.length - 1;

		var LastCell_Grid_start = this.Content[Cells_pos[LastPos].Row].Get_CellInfo(Cells_pos[LastPos].Cell).StartGridCol;
		var LastCell_Grid_end   = LastCell_Grid_start + this.Content[Cells_pos[LastPos].Row].Get_Cell(Cells_pos[LastPos].Cell).Get_GridSpan() - 1;
		Width                   = this.TableSumGrid[LastCell_Grid_end] - this.TableSumGrid[LastCell_Grid_start - 1];
	}

	var Rows_info = [];
	var Add_info  = [];
	if (true === bBefore)
	{
		// Ищем левую границу выделенных ячеек
		var Grid_start = -1;
		for (var Index = 0; Index < Cells_pos.length; Index++)
		{
			var Row  = this.Content[Cells_pos[Index].Row];
			var Cell = Row.Get_Cell(Cells_pos[Index].Cell);

			var Cur_Grid_start = Row.Get_CellInfo(Cells_pos[Index].Cell).StartGridCol;

			if (-1 === Grid_start || ( -1 != Grid_start && Grid_start > Cur_Grid_start ))
				Grid_start = Cur_Grid_start;
		}

		for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
		{
			var Row           = this.Content[CurRow];
			Rows_info[CurRow] = [];
			Add_info[CurRow]  = 0;

			var Before_Info = Row.Get_Before();
			if (Before_Info.GridBefore > 0)
				Rows_info[CurRow].push({W : this.TableSumGrid[Before_Info.GridBefore - 1], Type : -1, GridSpan : 1});

			var CellsCount = Row.Get_CellsCount();
			for (var CurCell = 0; CurCell < CellsCount; CurCell++)
			{
				var Cell           = Row.Get_Cell(CurCell);
				var Cur_Grid_start = Row.Get_CellInfo(CurCell).StartGridCol;
				var Cur_Grid_end   = Cur_Grid_start + Cell.Get_GridSpan() - 1;

				if (Cur_Grid_start <= Grid_start)
					Add_info[CurRow] = CurCell;

				var W = this.TableSumGrid[Cur_Grid_end] - this.TableSumGrid[Cur_Grid_start - 1];
				Rows_info[CurRow].push({W : W, Type : 0, GridSpan : 1});
			}

			var After_Info = Row.Get_After();
			if (After_Info.GridAfter > 0)
			{
				if (Row.Get_CellInfo(CellsCount - 1).StartGridCol + Row.Get_Cell(CellsCount - 1).Get_GridSpan() <= Grid_start)
					Add_info[CurRow] = CellsCount;
			}
		}

		// Теперь нам надо добавить ячейки в найденные позиции, и в те же позиции
		// добавить элементы в массиве Rows_info
		for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
		{
			var Row = this.Content[CurRow];

			var bBefore2 = false;
			if (Rows_info.length > 0 && Rows_info[CurRow][0].Type === -1)
				bBefore2 = true;

			for (var Index = 0; Index < Count; Index++)
			{
				var NewCell = Row.Add_Cell(Add_info[CurRow], Row, null, false);

				// Скопируем свойства следующуй ячейки в данной строке, а если мы добавляем в конец, то предыдущей
				var NextCell = ( Add_info[CurRow] >= Row.Get_CellsCount() - 1 ? Row.Get_Cell(Add_info[CurRow] - 1) : Row.Get_Cell(Add_info[CurRow] + 1) );
				NewCell.Copy_Pr(NextCell.Pr, true);

				// Скопируем текстовые настройки
				var FirstPara = NextCell.Content.Get_FirstParagraph();
				var TextPr    = FirstPara.GetFirstRunPr();
				NewCell.Content.Set_ApplyToAll(true);

				// Добавляем стиль во все параграфы
				var PStyleId = FirstPara.Style_Get();
				if (undefined !== PStyleId && null !== this.LogicDocument)
				{
					var Styles = this.LogicDocument.Get_Styles();
					NewCell.Content.SetParagraphStyle(Styles.Get_Name(PStyleId));
				}

				NewCell.Content.AddToParagraph(new ParaTextPr(TextPr));
				NewCell.Content.Set_ApplyToAll(false);

				if (false === bBefore2)
					Rows_info[CurRow].splice(Add_info[CurRow], 0, {W : Width, Type : 0, GridSpan : 1});
				else
					Rows_info[CurRow].splice(Add_info[CurRow] + 1, 0, {W : Width, Type : 0, GridSpan : 1});
			}
		}
	}
	else
	{
		// Ищем правую границу выделенных ячеек
		var Grid_end = -1;
		for (var Index = 0; Index < Cells_pos.length; Index++)
		{
			var Row  = this.Content[Cells_pos[Index].Row];
			var Cell = Row.Get_Cell(Cells_pos[Index].Cell);

			var Cur_Grid_start = Row.Get_CellInfo(Cells_pos[Index].Cell).StartGridCol;
			var Cur_Grid_end   = Cur_Grid_start + Cell.Get_GridSpan() - 1;

			if (-1 === Grid_end || ( -1 != Grid_end && Grid_end < Cur_Grid_end ))
				Grid_end = Cur_Grid_end;
		}

		for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
		{
			var Row           = this.Content[CurRow];
			Rows_info[CurRow] = [];
			Add_info[CurRow]  = -1;

			var Before_Info = Row.Get_Before();
			if (Before_Info.GridBefore > 0)
				Rows_info[CurRow].push({W : this.TableSumGrid[Before_Info.GridBefore - 1], Type : -1, GridSpan : 1});

			var CellsCount = Row.Get_CellsCount();
			for (var CurCell = 0; CurCell < CellsCount; CurCell++)
			{
				var Cell           = Row.Get_Cell(CurCell);
				var Cur_Grid_start = Row.Get_CellInfo(CurCell).StartGridCol;
				var Cur_Grid_end   = Cur_Grid_start + Cell.Get_GridSpan() - 1;

				if (Cur_Grid_end <= Grid_end)
					Add_info[CurRow] = CurCell;

				var W = this.TableSumGrid[Cur_Grid_end] - this.TableSumGrid[Cur_Grid_start - 1];
				Rows_info[CurRow].push({W : W, Type : 0, GridSpan : 1});
			}
		}

		// Теперь нам надо добавить ячейки в найденные позиции, и в те же позиции
		// добавить элементы в массиве Rows_info
		for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
		{
			var Row = this.Content[CurRow];

			var bBefore2 = false;
			if (Rows_info.length > 0 && Rows_info[CurRow][0].Type === -1)
				bBefore2 = true;

			for (var Index = 0; Index < Count; Index++)
			{
				var NewCell = Row.Add_Cell(Add_info[CurRow] + 1, Row, null, false);

				// Скопируем свойства следующуй ячейки в данной строке, а если мы добавляем в конец, то предыдущей
				var NextCell = ( Add_info[CurRow] + 1 >= Row.Get_CellsCount() - 1 ? Row.Get_Cell(Add_info[CurRow]) : Row.Get_Cell(Add_info[CurRow] + 2) );
				NewCell.Copy_Pr(NextCell.Pr, true);

				// Скопируем текстовые настройки
				var FirstPara = NextCell.Content.Get_FirstParagraph();
				var TextPr    = FirstPara.GetFirstRunPr();
				NewCell.Content.Set_ApplyToAll(true);

				// Добавляем стиль во все параграфы
				var PStyleId = FirstPara.Style_Get();
				if (undefined !== PStyleId && null !== this.LogicDocument)
				{
					var Styles = this.LogicDocument.Get_Styles();
					NewCell.Content.SetParagraphStyle(Styles.Get_Name(PStyleId));
				}

				NewCell.Content.AddToParagraph(new ParaTextPr(TextPr));
				NewCell.Content.Set_ApplyToAll(false);


				if (false === bBefore2)
					Rows_info[CurRow].splice(Add_info[CurRow] + 1, 0, {W : Width, Type : 0, GridSpan : 1});
				else
					Rows_info[CurRow].splice(Add_info[CurRow] + 2, 0, {W : Width, Type : 0, GridSpan : 1});
			}
		}
	}

	this.Internal_CreateNewGrid(Rows_info);

	// Выделим новые строки
	this.Selection.Use = true;

	if (null != this.Selection.Data)
		this.Selection.Data.length = 0;
	else
		this.Selection.Data = [];

	this.Selection.Use  = true;
	this.Selection.Type = table_Selection_Cell;

	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var StartCell = ( true === bBefore ? Add_info[CurRow] : Add_info[CurRow] + 1 );
		for (var Index = 0; Index < Count; Index++)
		{
			this.Selection.Data.push({Row : CurRow, Cell : StartCell + Index});
		}
	}

	this.private_RecalculateGrid();
	this.Internal_Recalculate_1();
};
CTable.prototype.DrawTableCells = function(X1, Y1, X2, Y2, CurPageStart, CurPageEnd, drawMode)
{
	this.RemoveSelection(); // сбрасываем выделение

	var curColumn = CurPageStart;
	// Приводим к координатам таблицы
	X1 					= X1 - this.Pages[curColumn].X; 
	X2 					= X2 - this.Pages[curColumn].X;

	if (Y1 < 0)
		Y1 = 0;
	if (Y2 < 0)
		Y2 = 0;
		
	// Если рисуем (ctrl + F1)
	if (drawMode === true)
	{
		// Если делаем просто щелчок по границе
		if (X1 === X2 && Y1 === Y2)
		{
			// Проверка, была ли выбрана граница (для случая, когда щелкаем по границе); 
			// Проверка, были ли выбраны начало и конец выделения
			// *Необходимо для случаев, когда у ячейки VMerge_count > 1*
			var SelectedCells = this.GetCellAndBorderByClick(X1, Y1, curColumn, drawMode);
			if (SelectedCells === undefined)
				return;
			var isVSelect  = SelectedCells.isVSelect;  // Была ли выбрана вертикальная граница
			var isHSelect  = SelectedCells.isHSelect;   // Была ли выбрана горизонтальная граница

			var isRightBorder  = SelectedCells.isRightBorder; 
			var isLeftBorder   = SelectedCells.isLeftBorder; 
			var isTopBorder    = SelectedCells.isTopBorder;
			var isBottomBorder = SelectedCells.isBottomBorder;

			if (SelectedCells.Cells.length > 0)
			{
				click = true;
				this.Selection.Data = SelectedCells.Cells;
			}
			else 
			{
				return;
			}
				
			//отрисовка бордеров 
			if (this.Selection.Data.length === 1)
			{
				var border	 = new CDocumentBorder();
				border.Value = 0x0001;

				var Cell_pos 	 = this.Selection.Data[0];
				var Row 		 = this.GetRow(Cell_pos.Row);
				var Cell 		 = Row.Get_Cell(this.Selection.Data[0].Cell);
				var Grid_start 	 = Row.Get_CellInfo(Cell_pos.Cell).StartGridCol;
				var Grid_span 	 = Cell.Get_GridSpan();
				var VMerge_Count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span);
				var rowHSum 	 = 0;

				// Отрисовка горизонтальных внешних границ
				if (isHSelect)
				{
					if (isTopBorder)
					{
						if (Cell.Get_Border(0).Value === 0)
							Cell.Set_Border(border, 0);
					}
						
					else if (isBottomBorder)
					{
						if (Cell.Get_Border(2).Value === 0)
							Cell.Set_Border(border, 2);
					}
				}

				// Отрисовка вертикальных внешних границ
				else if (isVSelect)
				{
					if (isRightBorder)
					{
						if (Cell.Get_Border(1).Value === 0)
							Cell.Set_Border(border, 1);
					}
						
					else if (isLeftBorder)
					{
						if (Cell.Get_Border(3).Value === 0)
							Cell.Set_Border(border, 3);
					}
				}
			}
			else if (this.Selection.Data.length === 2)
			{
				var border   = new CDocumentBorder();
				border.Value = 0x0001;

				if (isHSelect)
				{
					var Cell_1_pos     = this.Selection.Data[0];
					var Cell_2_pos     = this.Selection.Data[1];
					var Row_1 	       = this.GetRow(Cell_1_pos.Row);
					var Row_2          = this.GetRow(Cell_2_pos.Row);
					var Cell_1         = Row_1.Get_Cell(Cell_1_pos.Cell); 
					var Cell_2         = Row_2.Get_Cell(Cell_2_pos.Cell);
					var Grid_start_1   = Row_1.Get_CellInfo(Cell_1_pos.Cell).StartGridCol;
					var Grid_span_1    = Cell_1.Get_GridSpan();
					var VMerge_count_1 = this.Internal_GetVertMergeCount(Cell_1_pos.Row, Grid_start_1, Grid_span_1);

					if (VMerge_count_1 > 1)
					{
						Cell_1 = this.GetRow(Cell_1_pos.Row + VMerge_count_1 -1).Get_Cell(Cell_1_pos.Cell);
					}
					
					// Рисуем границу
					if (Cell_1.Get_Border(2).Value === 0)
						Cell_1.Set_Border(border, 2);
					if (Cell_2.Get_Border(0).Value === 0)	
						Cell_2.Set_Border(border, 0);
				}
				else if (isVSelect)
				{
					if (this.Selection.Data.length === 1)
					{
						var Cell = this.GetRow(this.Selection.Data[0].Row).Get_Cell(this.Selection.Data[0].Cell);
						Cell.Set_Border(border, 3);
					}
					var Cell_1 = this.GetRow(this.Selection.Data[0].Row).Get_Cell(this.Selection.Data[0].Cell); 
					var Cell_2 = this.GetRow(this.Selection.Data[1].Row).Get_Cell(this.Selection.Data[1].Cell);
					
					// Рисуем границу
					if (Cell_1.Get_Border(1).Value === 0)
						Cell_1.Set_Border(border, 1);
					if (Cell_2.Get_Border(3).Value === 0)
						Cell_2.Set_Border(border, 3);
				}
			}
		}
		// Если рисуем вертикальную линию
		else if (Math.abs(Y2 - Y1) > 2 && Math.abs(X2 - X1) < 3)
		{
			//если рисуем линию снизу вверх
			if (Y1 > Y2) 
			{
				var cache;
				cache = Y2;
				Y2    = Y1;
				Y1    = cache;
			}

			if (Y2 < this.Pages[curColumn].Bounds.Bottom && Y2 > this.Pages[curColumn].Bounds.Top && Y1 < this.Pages[curColumn].Bounds.Top)
			{
				Y1 = this.Pages[curColumn].Bounds.Top;
			}

			var CellAdded  = false;
			var Rows	   = [];        // массив строк подлежащих делению (которые мы режем)
			var rowsInfo   = []; // масив строк с ширинами ячеейк (используется для создания новой сетки таблицы)
			var Grid_spans = [];  //массив грид спанов ячеек, подлежащих делению (используется при добавлении ячеек в таблицу)
			var NarrowCell = false; // является ли делимая ячейка узкой (неделимой (равной минимальной ширине))

			Rows = this.GetAffectedRows(X1, Y1, X2, Y2, curColumn, 0);

			//если массив строк подлежащих делению пуст, выходим    
			if (Rows.length === 0)
				return;

			// заполняем массив rowsInfo строк с ширинами ячеек 	
			for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++) 
			{
				var cellsInfo = []; // информация о ячейке
				for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++) 
				{
					if ((X1 - this.GetRow(curRow).CellsInfo[curCell].X_cell_start > 1.5) && (this.GetRow(curRow).CellsInfo[curCell].X_cell_end - X1 > 1.5)) 
					{
						if (Rows.indexOf(curRow) != -1) //проверка на наличие строки curRow в массиве строк которые мы выделили 
						{
							var Row     	 = this.GetRow(curRow);
							var Cell    	 = Row.Get_Cell(curCell);  //текущая ячейка
							var X_start		 = Row.CellsInfo[curCell].X_cell_start;
							var X_end   	 = Row.CellsInfo[curCell].X_cell_end;
							var Grid_start   = Row.Get_CellInfo(curCell).StartGridCol;
							var Grid_span    = Cell.Get_GridSpan();
							var VMerge_count = this.Internal_GetVertMergeCount(curRow, Grid_start, Grid_span);
							
							//сделаем разбиение по горизонтали
							// Найдем позиции новых колонок в сетке
							var Span_width   = X_end - X_start; //ширина текущей ячейки
							var Grid_width_1 = X1 - X_start;
							var Grid_width_2 = X_end - X1;

							var CellSpacing = Row.Get_CellSpacing();
							var CellMar     = Cell.GetMargins();
							var MinW        = CellSpacing + CellMar.Right.W + CellMar.Left.W;
							if (X2 - X1 > MinW)
								return;
							
							for (var Index = 0; Index < this.TableSumGrid.length; Index++)
							{
								if (Math.abs(this.TableSumGrid[Index] - X1) < 1.5)
								{
									X1		     = this.TableSumGrid[Index];
									Grid_width_1 = X1 - this.TableSumGrid[Grid_start - 1];
									Grid_width_2 = this.TableSumGrid[Grid_start + Grid_span - 1] - X1;
									break;
								}
							}

							// В этих условиях мы проверяем допустимая ли ширина ячеек нами нарисована, 
							// если меньше допустимой, устанавливаем ширину равную минимальной допустимой
							// если ширина делимой ячейки Span_width < Minw*2 то выдаем ошибку
							if (Grid_width_1 > 0 && Grid_width_2 > 0)
							{
								if (Grid_width_1 < MinW) 
								{
									Grid_width_1 = MinW;
									Grid_width_2 = Span_width - Grid_width_1;
									if (Grid_width_2 < MinW)
									{
										Grid_width_2 = MinW;
										NarrowCell = true;
									}
										
									if (Span_width < Grid_width_1 + Grid_width_2) 
									{
										Span_width = Grid_width_1 + Grid_width_2;
									}
								}
								else if (Grid_width_2 < MinW) 
								{
									Grid_width_2 = MinW;
									Grid_width_1 = Span_width - Grid_width_2;
									if (Grid_width_1 < MinW)
									{
										Grid_width_1 = MinW;
										NarrowCell = true;
									}
										
									if (Span_width < Grid_width_1 + Grid_width_2) 
									{
										Span_width = Grid_width_1 + Grid_width_2;
									}
								}
							}
							

							//Проверяем есть ли GridBefore у строки перед первой ячейкой, если да, то учитываем это в сетке
							//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
							if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) 
							{
								var cell_Indent = 
								{
									W: X_end - Span_width,
									Type: -1,
									Grid_span: 1
								}
								cellsInfo[cellsInfo.length] = cell_Indent;
							}

							var cell_1 = 
							{
								W: Grid_width_1,
								Type: 0,
								GridSpan: 1
							};
							var cell_2 = 
							{
								W: Grid_width_2,
								Type: 0,
								GridSpan: 1
							};

							if (cell_1.W != 0)
							{
								cellsInfo[cellsInfo.length] = cell_1;
							}
							
							if (cell_2.W != 0)
							{
								cellsInfo[cellsInfo.length] = cell_2;
							}

							if (NarrowCell && Cell.GetVMerge() !== 2)
							{
								
								for (var Index = curCell + 1; Index < this.GetRow(curRow).Get_CellsCount(); Index++)
								{
									var Temp_Row1 		   = this.GetRow(curRow);
									var Temp_Cell1 		   = Temp_Row1.Get_Cell(Index);  
									var Temp_Grid_start1   = Temp_Row1.Get_CellInfo(Index).StartGridCol;
									var Temp_Grid_span1    = Temp_Cell1.Get_GridSpan();
									var Temp_VMerge_count1 = this.Internal_GetVertMergeCount(curRow, Temp_Grid_start1, Temp_Grid_span1);

									var Temp_Row2 		   = this.GetRow(curRow + VMerge_count);

									if (Temp_Row2 !== null && Temp_Row2 !== undefined)
									{
										for (var newIndex = 0; newIndex < Temp_Row2.Get_CellsCount(); newIndex++)
										{
											var Temp_Cell2		   = Temp_Row2.Get_Cell(newIndex);  
											var Temp_Grid_start2   = Temp_Row2.Get_CellInfo(newIndex).StartGridCol;
											var Temp_Grid_span2    = Temp_Cell2.Get_GridSpan();

											if (Temp_Grid_start2 === Temp_Grid_start1)
											{
												if (Temp_Cell2.GetVMerge() === 2)
												{
													Temp_Cell2.SetVMerge(vmerge_Restart);
												}
											}
										}
									}
									
									if (Temp_Cell1.GetVMerge() === 2)
									{
										Temp_Cell1.SetVMerge(vmerge_Restart);
									}
								}
							}
						}
						else 
						{
							var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;
							var X_start    = this.GetRow(curRow).CellsInfo[curCell].X_cell_start;
							var X_end      = this.GetRow(curRow).CellsInfo[curCell].X_cell_end;
							var cellWidth  = X_end - X_start;

							//Проверяем есть ли GridBefore у строки перед первой ячейкой, если да, то учитываем это в сетке
							//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
							if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore)
							{
								var cell_Indent =
								{
									W: X_end - cellWidth,
									Type: -1,
									Grid_span: 1
								}
								cellsInfo[cellsInfo.length] = cell_Indent;
							}

							var cell = 
							{
								W: cellWidth,
								Type: 0,
								GridSpan: 1
							};
							cellsInfo[cellsInfo.length] = cell;
						}
					}
					else 
					{
						var X_start    = this.GetRow(curRow).CellsInfo[curCell].X_cell_start;
						var X_end      = this.GetRow(curRow).CellsInfo[curCell].X_cell_end;
						var cellWidth  = X_end - X_start;
						var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;

						var Row  = this.GetRow(curRow);
						var Cell = Row.Get_Cell(curCell);  //текущая ячейка

						if (Math.abs(X1 - this.GetRow(curRow).CellsInfo[curCell].X_cell_start) < 1.5)
						{
							if (Cell.Get_Border(3).Value === 0)
							{
								var border   = new CDocumentBorder();
								border.Value = 0x0001;

								Cell.Set_Border(border, 3);
							}
						}
						else if (Math.abs(this.GetRow(curRow).CellsInfo[curCell].X_cell_end - X1) < 1.5)
						{
							if (Cell.Get_Border(1).Value === 0)
							{
								var border  = new CDocumentBorder();
								border.Value = 0x0001;

								Cell.Set_Border(border, 1);
							}
						}
						
						//Проверяем есть ли отступ у строки перед первой ячейкой,  если да, то учитываем это в сетке
						//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
						if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) 
						{
							var cell_Indent = 
							{
								W: X_end - cellWidth,
								Type: -1,
								Grid_span: 1
							}
							cellsInfo[cellsInfo.length] = cell_Indent;
						}

						var cell =
						{
							W: cellWidth,
							Type: 0,
							GridSpan: 1
						};
						cellsInfo[cellsInfo.length] = cell;
					}
					rowsInfo[curRow] = cellsInfo;
				}
			}

			//заполнение массива Grid_spans (используется в горизонтальном разбиении)
			for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++) 
			{
				for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++) 
				{
					if ((X1 >= this.GetRow(curRow).CellsInfo[curCell].X_cell_start) && (X2 <= this.GetRow(curRow).CellsInfo[curCell].X_cell_end)) 
					{
						if (Rows.indexOf(curRow) != -1) 
						{
							var Cell = this.GetRow(curRow).Get_Cell(curCell);  //текущая ячейка
							var Cell_pos = 											//позиция текущей ячейки
							{
								Cell: curCell,
								Row: curRow
							};
							Grid_spans[curRow] = Cell.Get_GridSpan();
						}
					}
				}
			}

			//Добавляем новые ячейки в горизонтальном разбиении 
			for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++) 
			{
				for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++) 
				{
					if ((X1 - this.GetRow(curRow).CellsInfo[curCell].X_cell_start > 1.5) && (this.GetRow(curRow).CellsInfo[curCell].X_cell_end - X1 > 1.5)) 
					{
						//проверка текущей строки на наличие в массиве Rows
						if (Rows.indexOf(curRow) != -1) 
						{
							CellAdded   = true;
							var Row 	= this.GetRow(curRow);					//строка текущей ячейки
							var Cell    = Row.Get_Cell(curCell);  //текущая ячейка
							var X_start = Row.CellsInfo[curCell].X_grid_start;
							var X_end   = Row.CellsInfo[curCell].X_grid_end;
							
							var Cell_pos = 											//позиция текущей ячейки
							{
								Cell: curCell,
								Row: curRow
							};
							
							var Grid_start = Row.Get_CellInfo(Cell_pos.Cell).StartGridCol;//столбец, с которого начинается ячейка
							var Grid_span  = Grid_spans[curRow];				//кол-во столбцов, охваченных текущей ячейкой

							var VMerge_count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span); //кол-во строк охваченных тек. ячейкой

							var Cells     = [];
							var Cells_pos = [];
							var Rows_     = [];

							for (var Index = 0; Index < VMerge_count; Index++)
							{
								var TempRow 	 = this.GetRow(Cell_pos.Row + Index);
								Rows_[Index] 	 = TempRow;
								Cells[Index] 	 = null;
								Cells_pos[Index] = null;

								// Ищем ячейку, начинающуюся с Grid_start
								var CellsCount = TempRow.Get_CellsCount();

								for (var CurCell = 0; CurCell < CellsCount; CurCell++) 
								{
									var StartGridCol = TempRow.Get_CellInfo(CurCell).StartGridCol;

									if (StartGridCol === Grid_start) 
									{
										Cells[Index] = TempRow.Get_Cell(CurCell);
										Cells_pos[Index] = { Row: Cell_pos.Row + Index, Cell: CurCell };
									}
								}
							}

							//сделаем разбиение по горизонтали
							// Найдем позиции новых колонок в сетке
							var Sum_before = this.TableSumGrid[Grid_start - 1]; //координаты конца предыдущей ячейки
							var Sum_with   = this.TableSumGrid[Grid_start + Grid_span - 1]; //координаты конца текущей ячейки

							var Span_width = Sum_with - Sum_before; //ширина текущей ячейки
							var Grid_width_1 = X1 - X_start;
							var Grid_width_2 = X_end - X1;

							var CellSpacing = Row.Get_CellSpacing();
							var CellMar = Cell.GetMargins();
							var MinW = CellSpacing + CellMar.Right.W + CellMar.Left.W;

							// В этих условиях мы проверяем допустимая ли ширина ячеек нами нарисована, 
							// если меньше допустимой, устанавливаем ширину равную минимальной допустимой
							// если ширина делимой ячейки Span_width < Minw*2 то выдаем ошибку
							if (Grid_width_1 < MinW)
							{
								Grid_width_1 = MinW;
								Grid_width_2 = Span_width - Grid_width_1;
								if (Grid_width_2 < MinW)
								{
									Grid_width_2 = MinW;
								}
								if (Span_width < Grid_width_1 + Grid_width_2) 
								{
									Span_width = Grid_width_1 + Grid_width_2;
								}
							}
							else if (Grid_width_2 < MinW) 
							{
								Grid_width_2 = MinW;
								Grid_width_1 = Span_width - Grid_width_2;
								if (Grid_width_1 < MinW)
								{
									Grid_width_1 = MinW;
								}
								if (Span_width < Grid_width_1 + Grid_width_2) 
								{
									Span_width = Grid_width_1 + Grid_width_2;
								}
							}

							// Данный массив содержит информацию о том сколько новых колонок
							// было добавлено после i-ой колонки
							var Grid_Info  = [];
							for (var Index = 0; Index < this.TableGridCalc.length; Index++)
								Grid_Info[Index] = 0;

							// Массив содержит информацию о том сколько промежутков будет в
							// новых ячейках
							var Grid_Info_new = [];
							for (var Index = 0; Index < 2; Index++)
								Grid_Info_new[Index] = 1;

							var Grid_Info_start = [];
							for (var Index = 0; Index < this.TableGridCalc.length; Index++)
								Grid_Info_start[Index] = this.TableGridCalc[Index];

							var NewCol_Index = 0;

							var CurWidth = Sum_before + Grid_width_1;

							for (var Grid_index = Grid_start; Grid_index < Grid_start + Grid_span; Grid_index++) 
							{
								var bNewCol = true;

								// Если мы попали в уже имеющуюся границу не добавляем новую точку
								if (Math.abs(CurWidth - this.TableSumGrid[Grid_index]) < 0.001) 
								{
									NewCol_Index++;
									CurWidth += Grid_width_2;
									bNewCol = false;
									continue;
								}

								while (CurWidth < this.TableSumGrid[Grid_index]) 
								{
									if (0 === Grid_Info[Grid_index])
										Grid_Info_start[Grid_index] = CurWidth - this.TableSumGrid[Grid_index - 1];

									Grid_Info[Grid_index] += 1;

									NewCol_Index++
									CurWidth += Grid_width_2;

									// Если мы попали в уже имеющуюся границу не добавляем новую точку
									if (Math.abs(CurWidth - this.TableSumGrid[Grid_index]) < 0.001) 
									{
										NewCol_Index++;
										CurWidth += Grid_width_2;
										bNewCol = false;
										break;
									}
								}

								if (true === bNewCol)
									Grid_Info_new[NewCol_Index] += 1;
							}
							// Добавим в данной строке (Cols - 1) ячеек, с теми же настроками,
							// что и исходной. Значение GridSpan мы берем из массива Grid_Info_new

							for (var Index2 = 0; Index2 < Rows_.length; Index2++)
							{
								if (null != Cells[Index2] && null != Cells_pos[Index2]) 
								{
									var TempRow      = Rows_[Index2];
									var TempCell     = Cells[Index2];
									var TempCell_pos = Cells_pos[Index2];

									TempCell.Set_GridSpan(Grid_Info_new[0]);
									TempCell.Set_W(new CTableMeasurement(tblwidth_Mm, Grid_width_1));

									var NewCell = TempRow.Add_Cell(TempCell_pos.Cell + 1, TempRow, null, false);
									NewCell.Copy_Pr(TempCell.Pr);
									NewCell.Set_GridSpan(Grid_Info_new[1]);
									NewCell.Set_W(new CTableMeasurement(tblwidth_Mm, Grid_width_2));

								}
							}
							if (VMerge_count > 1) 
							{
								curRow += VMerge_count - 1;
							}
							break;
						}
					}
				}
			}
			if (!CellAdded)
				return; 

			this.SetTableGrid(this.Internal_CreateNewGrid(rowsInfo));
		}
		// Если рисуем горизонтальную линию 
		else if (Math.abs(X2 - X1) > 2 && Math.abs(Y2 - Y1) < 3)
		{
			if (X1 > X2)
			{
				var cache; 
				cache = X2;
				X2 = X1;
				X1 = cache;
			}

			var RowNumb = []; // Строка, попавшая в вертикальное разбиение 
			var CellsNumb = []; // Массив номеров ячеек, попавших в вертикальное разбиение

			RowNumb = this.GetAffectedRows(X1, Y1, X2, Y2, curColumn, 1);

			if (RowNumb.length === 0)
				return; 
				
			if (X1 < 0 )
				X1 = this.GetRow(RowNumb[0]).CellsInfo[0].X_cell_start;
			
			
			for (var curCell = 0; curCell < this.GetRow(RowNumb[0]).Get_CellsCount(); curCell++)
			{
				if (X1 > this.GetRow(RowNumb[0]).CellsInfo[curCell].X_cell_start && X1 < this.GetRow(RowNumb[0]).CellsInfo[curCell].X_cell_end)
					CellsNumb.push(curCell);
				else if (CellsNumb.length === 0)
					continue;
				else if (this.GetRow(RowNumb[0]).CellsInfo[curCell].X_cell_start < X2)
					CellsNumb.push(curCell);
			}
			
			if (CellsNumb.length === 0)
				return;

			// Если хотим разделить ячейку с VMerge > 1 и линия находится близка к линии строки, то делим ячейку по этой линии 
			for (var curCell = 0; curCell < this.GetRow(RowNumb[0]).Get_CellsCount(); curCell++)
			{
				if (CellsNumb.indexOf(curCell) != -1) //проверка ячейки на наличие в массиве Cells 
				{
					var Cell = this.GetRow(RowNumb[0]).Get_Cell(curCell);
					var Cell_pos = 
					{
						Cell : curCell,
						Row  : RowNumb[0]
					};
					var Row = this.GetRow(Cell_pos.Row);
					
					var Grid_start = Row.Get_CellInfo(Cell_pos.Cell).StartGridCol;
					var Grid_span  = Cell.Get_GridSpan();

					var VMerge_count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span);
					
					var Cells	  = [];
					var Cells_pos = [];
					var Rows_     = [];

					if (VMerge_count > 1)
					{
						// Если попадаем в окрестность верхней границы ячейки, то добавляем границу сверху
						if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] - Y1) < 2) 
						{
							var TempRow	     = this.GetRow(Cell_pos.Row);
							var TempCell	 = TempRow.Get_Cell(Cell_pos.Cell);
							TempCell.SetVMerge(vmerge_Restart);
						}
						// Если попадаем в окрестность нижней границы, то добавляем границу снизу
						else if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn]- Y1) < 2) 
						{
							if (RowNumb[0] != this.Get_RowsCount() - 1)
							{
								var TempRow 	 = this.GetRow(Cell_pos.Row + 1);
								var TempCell	 = TempRow.Get_Cell(Cell_pos.Cell);

								TempCell.SetVMerge(vmerge_Restart);
							}
						}
					} 
					else 
					{
						// Если попадаем в окрестность верхней границы ячейки, то добавляем границу сверху
						// необходимо для последней строки из строк которые входят в VMerge
						if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] - Y1) < 2) 
						{
							var TempRow 	 = this.GetRow(Cell_pos.Row);
							var TempCell	 = TempRow.Get_Cell(Cell_pos.Cell);

							if (TempCell.Get_Border(0).Value === 0)
							{
								var border = new CDocumentBorder();
								border.Value = 0x0001;
								TempCell.Set_Border(border, 0);
							}
							if (TempCell.GetVMerge() === 2)
								TempCell.SetVMerge(vmerge_Restart);
							else
								continue;
						}
						// Если попадаем в нижнюю границу, выходим
						else if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn]  - Y1) < 2)
						{
							var TempRow		 = this.GetRow(Cell_pos.Row);
							var TempCell	 = TempRow.Get_Cell(Cell_pos.Cell);

							if (TempCell.Get_Border(2).Value === 0)
							{
								var border = new CDocumentBorder();
								border.Value = 0x0001;
								TempCell.Set_Border(border, 2);
							}
							continue;
						}
					}
				}
			}
			
			// Вертикальное разбиение (условие, что мы не попадаем в горизонтальные границы других ячеек)
			if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] - Y1) > 2 && Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn] - Y1) > 2)
			{
				var Cell 	 = this.GetRow(RowNumb[0]).Get_Cell(CellsNumb[0]);
				var Cell_pos = 
				{
					Cell : CellsNumb[0],
					Row  : RowNumb[0]
				};
				var Row = this.GetRow(Cell_pos.Row);
				
				var Grid_start = Row.Get_CellInfo(Cell_pos.Cell).StartGridCol;
				var Grid_span  = Cell.Get_GridSpan();

				var VMerge_count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span);
				
				var Cells	  = [];
				var Cells_pos = [];
				var Rows_     = [];

				Rows_[0]     = Row;
				Cells[0]     = Cell;
				Cells_pos[0] = Cell_pos;

				var SumRowH = 0; // суммарная длина строки 
				for (Index = 0; Index < curColumn; Index++)
				{
					SumRowH += this.RowsInfo[RowNumb[0]].H[Index];

				}

				var Border_Height = this.GetBottomTableBorder().Size;
				var rowHeight_1   = Y1 - this.RowsInfo[Cell_pos.Row].Y[curColumn] - Border_Height;
				var rowHeight_2   = this.RowsInfo[Cell_pos.Row].Y[curColumn] + this.RowsInfo[Cell_pos.Row].H[curColumn] - Y1 - Border_Height;
			
				var CellsCount = Row.Get_CellsCount();

				var NewRow = this.private_AddRow(Cell_pos.Row + 1, CellsCount);
				NewRow.Copy_Pr(Row.Pr);

				Row.Set_Height(rowHeight_1, linerule_AtLeast);
				NewRow.Set_Height(rowHeight_2, linerule_AtLeast);
				
				Rows_[1]     = NewRow;
				Cells[1]     = null;
				Cells_pos[1] = null;

				// Копируем настройки всех ячеек исходной строки в новую строку
				for (var CurCell = 0; CurCell < CellsCount; CurCell++)
				{
					var border   = new CDocumentBorder();
					border.Value = 0x0001;

					var New_Cell = NewRow.Get_Cell(CurCell);
					var Old_Cell = Row.Get_Cell(CurCell);

					New_Cell.Copy_Pr(Old_Cell.Pr);

					if (CurCell === Cell_pos.Cell)
					{
						Cells[1]     = New_Cell;
						Cells_pos[1] = {Row : Cell_pos.Row + 1, Cell : CurCell};
						New_Cell.SetVMerge(vmerge_Restart);
					}
					else
					{
						New_Cell.SetVMerge(vmerge_Continue);
					}
					if (CellsNumb.indexOf(CurCell) != -1)
					{
						if (CurCell != CellsNumb[0])
							New_Cell.SetVMerge(vmerge_Restart);
					}
					
					Old_Cell.Set_Border(border, 2);
					New_Cell.Set_Border(border, 0);
				}
			}

			this.ReIndexing();
			this.Recalc_CompiledPr2();
			this.private_RecalculateGrid();
			this.Internal_Recalculate_1();
		}
		else
		{
			if (Y1 > Y2)
			{
				var cache = Y2;

				Y2 = Y1;
				Y1 = cache;
			}

			if (X1 > X2)
			{
				var cache = X2;

				X2 = X1;
				X1 = cache;
			}

			var Cell_pos = this.Internal_GetCellByXY(X1 + this.Pages[curColumn].X, Y1, curColumn);

			var oRow  = this.GetRow(Cell_pos.Row);
			var oCell = oRow.GetCell(Cell_pos.Cell);  //текущая ячейка

			var oCellContent = oCell.GetContent();
			var nInnerPos    = oCellContent.Internal_GetContentPosByXY(X1 + this.Pages[curColumn].X, Y1, CurPageStart - oCellContent.Get_StartPage_Relative());
			var nInnerCount  = oCellContent.GetElementsCount();
			while (!oCellContent.GetElement(nInnerPos).IsParagraph())
			{
				nInnerPos++;

				if (nInnerPos >= nInnerCount)
				{
					// Такого не должно происходить, последний элемент всегда должен быть параграф
					return;
				}
			}

			var oParagraph = oCellContent.GetElement(nInnerPos);
			if (!oParagraph || !oParagraph.IsParagraph())
				return;

			oCellContent.CurPos.ContentPos = nInnerPos;
			oParagraph.MoveCursorToStartPos();

			var oCellInfo = oRow.GetCellInfo(Cell_pos.Cell);
			if (!oCellInfo)
				return;

			var X_start      = oCellInfo.X_cell_start;
			var X_end        = oCellInfo.X_cell_end;
			var Cell_width   = X_end - X_start;
			var Grid_start   = oCellInfo.StartGridCol;
			var Grid_span    = oCell.GetGridSpan();
			var VMerge_count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span);
			var CellMar      = oCell.GetMargins();
			var MinW         = oRow.GetCellSpacing() + CellMar.Right.W + CellMar.Left.W;

			var rowHSum = 0;
			if (VMerge_count >= 1)
			{
				for (Index = Cell_pos.Row; Index < Cell_pos.Row + VMerge_count; Index++)
				{
					rowHSum += this.RowsInfo[Index].H[curColumn]
				}
			}

			// Если выходим за пределы текущей ячейки, не создаем новую 
			if (X2 > X_end || X1 < X_start || Y1 < this.RowsInfo[Cell_pos.Row].Y[curColumn] || Y2 > this.RowsInfo[Cell_pos.Row].Y[curColumn] + rowHSum)
			{
				return;
			}

			if (Cell_width >= MinW * 1.5 && X2 - X1 > MinW * 1.5 && rowHSum >= 4.63864881727431 * 1.5 && Y2 - Y1 >= 4.63864881727431 * 1.5)
			{
				var oTable = oCellContent.AddInlineTable(1, 1);
				if (oTable && oTable.GetRowsCount() > 0)
				{
					oTable.Set_Inline(false);
					oTable.Set_PositionH(c_oAscHAnchor.Page, false, X1 - X_start);
					oTable.Set_PositionV(c_oAscVAnchor.Page, false, Y1 - this.RowsInfo[Cell_pos.Row].Y[curColumn]);
					oTable.GetRow(0).SetHeight(Math.abs(this.LogicDocument.DrawTableMode.EndY - this.LogicDocument.DrawTableMode.StartY), Asc.linerule_AtLeast);
					oTable.Set_TableW(tblwidth_Mm, Math.abs(this.LogicDocument.DrawTableMode.EndX - this.LogicDocument.DrawTableMode.StartX - new CDocumentBorder().Size * 2));
					oTable.Set_Distance(3.2, undefined, 3.2, undefined);
					oTable.MoveCursorToStartPos();
					oTable.Document_SetThisElementCurrent();
				}
			}
		}
	}
	// Если стираем (ctrl + F2)
	else if (drawMode === false)
	{
		var rowsInfo 	  = []; // масив строк, каждая из которых содержит массив cellsInfo (используется для создания новой сетки таблицы)
		var Cells         = []; // ячейки, подлежащие объединению
		var isClearMerge  = false;
		var canDel 		  = false;
		var oldRows  	  = []; 
		var oldCells 	  = [];
		
		for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
		{
			oldCells[curRow] = [];
			for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
			{
				oldCells[curRow].push(this.GetRow(curRow).Get_Cell(curCell));
			}
		}
	
		for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
		{
			oldRows.push(this.GetRow(curRow));
		}

		// Проверка, была ли выбрана граница (для случая, когда щелкаем по границе); 
		// Проверка, были ли выбраны начало и конец выделения
		// *Необходимо для случаев, когда у ячейки VMerge_count > 1*
		var isSelected = false; // Для щелчка по границе
		var isVSelect  = false;  // Была ли выбрана вертикальная граница
		var isHSelect  = false;   // Была ли выбрана горизонтальная граница

		var isRightBorder  = false; 
		var isLeftBorder   = false; 
		var isTopBorder    = false;
		var isBottomBorder = false;

		var click   = false; // ключ, по которому определяем, был совершен клик или было совершено выделение (true - Был клик)
		var Y_Over  = false; // выделение начинается выше таблицы
		var Y_Under = false; // выделение заканчивается ниже таблицы
		var X_Front = false; // выделение начинается левее таблицы
		var X_After = false; // выделение заканчивается правее таблицы

		// Если делаем просто щелчок по границе
		if (X1 === X2 && Y1 === Y2)
		{
			var SelectedCells = this.GetCellAndBorderByClick(X1, Y1, curColumn, drawMode);
			if (SelectedCells === undefined)
				return;

			isVSelect  = SelectedCells.isVSelect;  // Была ли выбрана вертикальная граница
			isHSelect  = SelectedCells.isHSelect;   // Была ли выбрана горизонтальная граница

			isRightBorder  = SelectedCells.isRightBorder; 
			isLeftBorder   = SelectedCells.isLeftBorder; 
			isTopBorder    = SelectedCells.isTopBorder;
			isBottomBorder = SelectedCells.isBottomBorder;

			if (SelectedCells.Cells.length > 0)
			{
				isSelected = true;
				click = true;
			}
			this.Selection.Data = SelectedCells.Cells;
		}
		// Если выделяем несколько ячеек
		else 
		{	
			this.Selection.Data = this.GetCellsByRect(X1, Y1, X2, Y2, curColumn);

			if (this.Selection.Data.length != 0)
				isSelected = true;

			// Если выделение справа налево
			if (X1 > X2) 
			{
				var cache;
				cache = X2;
				X2    = X1;
				X1    = cache;
			}
			// Если выделение снизу вверх
			if (Y1 > Y2) 
			{
				var cache;
				cache = Y2;
				Y2    = Y1;
				Y1    = cache;
			}

			if (Y2 >= this.RowsInfo[this.Pages[curColumn].LastRow].Y[curColumn] + this.RowsInfo[this.Pages[curColumn].LastRow].H[curColumn])
				Y_Under = true;
			if (Y1 <= this.RowsInfo[this.Pages[curColumn].FirstRow].Y[curColumn])
				Y_Over = true;

			if (X1 <= this.TableSumGrid[-1])
				X_Front = true;
			if (X2 >= this.TableSumGrid[this.TableSumGrid.length - 1])
				X_After = true;

			// Если вся таблица внутри выделения - удаляем её 
			if (X_Front && X_After && Y_Over && Y_Under)
			{
				for (var Index = 0, rowsCount = this.GetRowsCount(); Index < rowsCount; Index++)
				{
					this.RemoveTableRow(0);
				}

				return;
			}
		}

		// Если границы не выбраны - выходим 
		if (isSelected === false)
			return;
		
		if (this.Selection.Data === null)
			return;
		
		// В массиве this.Selection.Data идет список ячеек по строкам (без разрывов)
		// Перед объединением мы должны проверить совпадают ли начальная и конечная колонки
		// в сетке TableGrid для каждого ряда.
		var Temp       = this.Internal_CheckMerge();
		var bCanMerge  = Temp.bCanMerge;
		var Grid_start = Temp.Grid_start;
		var Grid_end   = Temp.Grid_end;
		var RowsInfo   = Temp.RowsInfo;

		var newSelectionData = []; 
		newSelectionData.push(this.Selection.Data);  // Массив из групп ячеек, которые можно будет объеденить

		var newTempSelectionData  = [];
		var TempSelectionData = this.Selection.Data; // Массив ячеек, которые были выделены 
		
		// Если выделяем целиком колонку - удаляем её 
		if (Y_Over && Y_Under && bCanMerge)
		{
			var Sel_Cells_Count = 0; 
			for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
			{
				Sel_Cells_Count += this.GetRow(curRow).Get_CellsCount();
			}
			
			if (Sel_Cells_Count === this.Selection.Data.length)
			{
				for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
				{
					this.RemoveTableRow(curRow);
					curRow = -1;
				}
				return true;
			}
			
			this.Selection.Use = true;
			this.Selection.Type = 0;
			this.RemoveTableColumn();
			return true;
		}

		// Если выделяем строку или несколько строк
		if (X_Front && X_After && bCanMerge)
		{
			var del_count   = 0;
			for (var curRow = this.Selection.Data[0].Row; curRow <= this.Selection.Data[this.Selection.Data.length - 1].Row; curRow++)
			{
				if (del_count === this.Selection.Data[this.Selection.Data.length - 1].Row - this.Selection.Data[0].Row + 1)
					return true;
				this.RemoveTableRow(curRow);
				curRow = this.Selection.Data[0].Row - 1;
				del_count += 1;
			}
		}
		
		// Удаление внешних границ, 
		// в выделении должна быть только одна ячейка
		if (this.Selection.Data.length === 1)
		{
			// Пустая граница (без отрисовки)
			var borderNan 	 = new CDocumentBorder();

			var Cell_pos 	 = this.Selection.Data[0];
			var Row 		 = this.GetRow(Cell_pos.Row);
			var Cell 		 = Row.Get_Cell(Cell_pos.Cell);
			var Grid_start 	 = Row.Get_CellInfo(Cell_pos.Cell).StartGridCol;
			var Grid_span 	 = Cell.Get_GridSpan();
			var VMerge_Count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span);
			var rowHSum 	 = 0;

			var rowNumber 	 = 0;
			if (VMerge_Count >= 1)
			{
				for (Index = Cell_pos.Row; Index < Cell_pos.Row + VMerge_Count; Index++)
				{
					rowHSum += this.RowsInfo[Index].H[curColumn]
				}
			}

			if (this.RowsInfo[Cell.Row.Index].Y[curColumn] + rowHSum < Y2)
				Y_Under = true;
			if (this.RowsInfo[Cell.Row.Index].Y[curColumn] > Y1)
				Y_Over  = true;
			if (Cell.Index === 0 && this.GetRow(Cell.Row.Index).CellsInfo[Cell.Index].X_cell_start > X1)
				X_Front = true;
			if (Cell.Index === this.GetRow(Cell.Row.Index).Get_CellsCount() - 1 && this.GetRow(Cell.Row.Index).CellsInfo[Cell.Index].X_cell_end < X2)
				X_After = true;


			// Удаление горизонтальных внешних границ
			if (isHSelect)
			{
				if (isTopBorder)
				{
					if (Cell.Get_Border(0).Value != 0)
						Cell.Set_Border(borderNan, 0);
				}
					
				else if (isBottomBorder)
				{
					if (Cell.Get_Border(2).Value != 0)
						Cell.Set_Border(borderNan, 2);
				}
					
			}
			// Удаление вертикальных внешних границ
			else if (isVSelect)
			{
				if (isRightBorder)
				{
					if (Cell.Get_Border(1).Value != 0)
						Cell.Set_Border(borderNan, 1);
				}
					
				else if (isLeftBorder)
				{
					if (Cell.Get_Border(3).Value != 0)
						Cell.Set_Border(borderNan, 3);
				}
					
			}

			if (!click)
			{
				if (X_Front)
				{
					if (Cell.Get_Border(3).Value != 0)
						Cell.Set_Border(borderNan, 3);
				}
				if (X_After)
				{
					if (Cell.Get_Border(1).Value != 0)
						Cell.Set_Border(borderNan, 1);
				}
				if (Y_Over)
				{
					if (Cell.Get_Border(0).Value != 0)
						Cell.Set_Border(borderNan, 0);
				}
				if (Y_Under)
				{
					var Cell_pos	 = this.Selection.Data[0];
					var Row 		 = this.GetRow(Cell_pos.Row);
					var Grid_start   = Row.Get_CellInfo(Cell_pos.Cell).StartGridCol;
					var Grid_span 	 = Cell.Get_GridSpan();
					var VMerge_Count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span);
					var TempCell 	 = null;

					for (var Index = 0; Index < this.GetRow(Cell_pos.Row + VMerge_Count - 1).Get_CellsCount(); Index++)
					{
						var View_Row 		 	 = this.GetRow(Cell_pos.Row + VMerge_Count - 1);
						var View_Grid_start   	 = View_Row.Get_CellInfo(Index).StartGridCol;

						if (View_Grid_start === Grid_start)
							TempCell 			 = this.GetRow(Cell_pos.Row + VMerge_Count - 1).Get_Cell(Index);
					}
					
					if (TempCell.Get_Border(2).Value != 0)
						Cell.Set_Border(borderNan, 2);
					TempCell.Set_Border(borderNan, 2);

					rowNumber 		 = TempCell.Row.Index; // номер строки ячейки в которой нужно удалить границу
				}
			}
			
			if (click)
			{
				// удаление строки
				if (Cell.Row.Get_CellsCount() === 1 && Cell.Row.Index === 0)
				{	
					if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(1).Value === 0 && Cell.Get_Border(2).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
					if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(1).Value === 0 && Cell.Get_Border(3).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
					if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(2).Value === 0 && Cell.Get_Border(3).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
				}
				else if (Cell.Row.Get_CellsCount() === 1 && Cell.Row.Index === this.Get_RowsCount() - 1)
				{	
					if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(1).Value === 0 && Cell.Get_Border(2).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
					if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(3).Value === 0 && Cell.Get_Border(2).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
					if (Cell.Get_Border(1).Value === 0 && Cell.Get_Border(3).Value === 0 && Cell.Get_Border(2).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
				}
				else if (Cell.Row.Get_CellsCount() === 1)
				{	
					if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(1).Value === 0 && Cell.Get_Border(2).Value === 0 && Cell.Get_Border(3).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
				}
				// Столбца. Удаляем столбец, если в нем только 1 ячейка, 
				// объединяющая все строки и отсутсвуют внешние границы
				else 
				{
					var Row 		   = this.GetRow(0);
					var Cell_1 		   = Row.Get_Cell(0);
					var Cell_2	       = Row.Get_Cell(Row.Get_CellsCount() - 1);
					
					var Grid_start_1   = Row.Get_CellInfo(0).StartGridCol;
					var Grid_start_2   = Row.Get_CellInfo(Row.Get_CellsCount() - 1).StartGridCol;
					var Grid_span_1    = Cell_1.Get_GridSpan();
					var Grid_span_2    = Cell_2.Get_GridSpan();
					var VMerge_count_1 = this.Internal_GetVertMergeCount(0, Grid_start_1, Grid_span_1);
					var VMerge_count_2 = this.Internal_GetVertMergeCount(0, Grid_start_2, Grid_span_2);

					if (VMerge_count_1  === this.Get_RowsCount() || VMerge_count_2 === this.Get_RowsCount())
					{
						var TempCell_1 = this.GetRow(VMerge_count_1 - 1).Get_Cell(0);
						var TempCell_2 = this.GetRow(VMerge_count_2 - 1).Get_Cell(this.GetRow(VMerge_count_2 - 1).Get_CellsCount() - 1);

						if (Cell_1.Get_Border(3).Value === 0 && Cell_1.Get_Border(0).Value === 0 && TempCell_1.Get_Border(2).Value === 0)
						{
							this.CurCell = Cell_1;
							this.RemoveTableColumn();
							return;
						}
						else if (Cell_2.Get_Border(1).Value === 0 && Cell_2.Get_Border(0).Value === 0 && TempCell_2.Get_Border(2).Value === 0)
						{
							this.CurCell = Cell_2;
							this.RemoveTableColumn();
							return;
						}
					}
				}
			}
			else if (!click)
			{
				if (Cell.Row.Get_CellsCount() === 1)
				{
					if (Cell.Get_Border(1).Value === 0 && Cell.Get_Border(3).Value === 0 && X_Front && X_After)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
					else if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(1).Value === 0 && Cell.Get_Border(2).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
					else if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(3).Value === 0 && Cell.Get_Border(2).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							this.RemoveTableRow(curRow);
						}
						
						return;
					}
				}
			}

			
			
			// Удаление ячейки
			// Слева
			if (Cell.Index === 0)
			{
				var Cells 	 = []; // ячейки, которые будут удалены, при условии, что все внешние границы стерты
				var rowsInfo = []; // т.к. исп. функцию RemoveTableCells, при удалении ячейки слева, сетка смещается влево, 
				// поэтому генерируем свою сетку 

				if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(3).Value === 0)
				{
					for (var viewRow = Cell.Row.Index; viewRow < this.Get_RowsCount(); viewRow++)
					{
						var TempRow  = this.GetRow(viewRow);
						var TempCell = TempRow.Get_Cell(0);
						
						// т.к. ячейка может иметь верт. объединение необходимо это учитывать 
						// и добавить в Cells все ячейки входящие в это объединение
						if (TempCell.GetVMerge() === 2)
						{
							Cells.push(TempCell);
							
							// если рассматриваемая ячейка - последняя из верт. объединения, удаляем все ячейки которые попали в Cells
							if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
							{
								if (TempCell.Get_Border(2).Value === 0)
								{
									// генерация новой сетки
									for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
									{
										var cellsInfo = [];
										for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
										{
											if (curCell === Cell.Index && curRow >= Cells[0].Row.Index && curRow <= Cells[Cells.length - 1].Row.Index)
											{
												var cell = 
												{
													W: this.GetRow(curRow).CellsInfo[curCell].X_cell_end,
													Type: - 1,
													Grid_span : 1
												};
												cellsInfo[cellsInfo.length] = cell;
												
												
												if (curCell === this.GetRow(curRow).Get_CellsCount() - 1)
													this.RemoveTableRow(curRow);

												continue;
											}

											var X_start    = this.GetRow(curRow).CellsInfo[curCell].X_cell_start;
											var X_end      = this.GetRow(curRow).CellsInfo[curCell].X_cell_end;
											var cellWidth  = X_end - X_start;
											var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;

											//Проверяем есть ли отступ у строки перед первой ячейкой,  если да, то учитываем это в сетке
											//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
											if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) {
												var cell_Indent =
												{
													W: X_end - cellWidth,
													Type: -1,
													Grid_span: 1
												};
												cellsInfo[cellsInfo.length] = cell_Indent;
											}

											var cell =
											{
												W: cellWidth,
												Type: 0,
												GridSpan: 1
											};
											cellsInfo[cellsInfo.length] = cell;

											rowsInfo[curRow] = cellsInfo;
											
										}

									}
									Cells.reverse();
									for (var i = 0; i < Cells.length; ++i)
									{
										var cell = Cells[i];
										cell.Row.RemoveCell(cell.Index);
									}
									this.SetTableGrid(this.Internal_CreateNewGrid(rowsInfo));
									return true;
								}
							}
						}
						
						else if (TempCell.GetVMerge() === 1)
						{
							// Если рассматриваемая ячейка - первая из верт объединения, добавляем её
							if (TempCell.Row.Index === Cell.Row.Index)
							{
								Cells.push(TempCell);
							}
							// Случай, когда вертикальное объединение имет ровно 1 ячейку, сразу удаляем ячейку
							if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
							{
								if (TempCell.Get_Border(2).Value === 0)
								{
									// Генерация новой сетки
									for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
									{
										var cellsInfo   = [];

										for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
										{
											if (curCell === Cell.Index && curRow >= Cells[0].Row.Index && curRow <= Cells[Cells.length - 1].Row.Index)
											{
												var cell = 
												{
													W: this.GetRow(curRow).CellsInfo[curCell].X_cell_end,
													Type: - 1,
													Grid_span : 1
												};
												cellsInfo[cellsInfo.length] = cell;
												continue;
											}
											var X_start    = this.GetRow(curRow).CellsInfo[curCell].X_cell_start;
											var X_end      = this.GetRow(curRow).CellsInfo[curCell].X_cell_end;
											var cellWidth  = X_end - X_start;
											var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;

											//Проверяем есть ли отступ у строки перед первой ячейкой,  если да, то учитываем это в сетке
											//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
											if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) {
												var cell_Indent =
												{
													W: X_end - cellWidth,
													Type: -1,
													Grid_span: 1
												};
												cellsInfo[cellsInfo.length] = cell_Indent;
											}

											var cell =
											{
												W: cellWidth,
												Type: 0,
												GridSpan: 1
											};
											cellsInfo[cellsInfo.length] = cell;

											rowsInfo[curRow] = cellsInfo;
										}
									}
									Cells.reverse();
									for (var i = 0; i < Cells.length; ++i)
									{
										var cell = Cells[i];
										cell.Row.RemoveCell(cell.Index);
									}
									this.SetTableGrid(this.Internal_CreateNewGrid(rowsInfo));
									return true;
								}
							}
						}
					}
				}
				else if (Cell.Get_Border(2).Value === 0 && Cell.Row.Index === rowNumber)
				{
					for (var viewRow = Cell.Row.Index; viewRow >= 0; viewRow-- )
					{
						if (this.Get_RowsCount() === 0)
							return;
							
						var TempRow  =  this.GetRow(viewRow);
						if (TempRow === undefined || TempRow === null)
							continue;

						var TempCell = TempRow.Get_Cell(0);
						if (TempCell === undefined || TempCell === null)
							continue;
						
						if (TempCell.GetVMerge() === 2)
						{
							Cells.push(TempCell);
						}
						else if (TempCell.GetVMerge() === 1)
						{
							if (TempCell.Row.Index === Cell.Row.Index)
							{
								Cells.push(TempCell);
								return true;
							}
							if (TempCell.Get_Border(0).Value === 0 && TempCell.Get_Border(3).Value === 0)
							{
								Cells.push(TempCell);
								Cells.reverse();

								// Генерируем новую сетку таблицы
								for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
								{
									var cellsInfo = [];
									for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
									{
										if (curCell === Cell.Index && curRow >= Cells[0].Row.Index && curRow <= Cells[Cells.length - 1].Row.Index)
										{
											var cell = 
											{
												W: this.GetRow(curRow).CellsInfo[curCell].X_cell_end,
												Type: - 1,
												Grid_span : 1
											};
											cellsInfo[cellsInfo.length] = cell;
											continue;
										}
										var X_start    = this.GetRow(curRow).CellsInfo[curCell].X_cell_start;
										var X_end      = this.GetRow(curRow).CellsInfo[curCell].X_cell_end;
										var cellWidth  = X_end - X_start;
										var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;

										//Проверяем есть ли отступ у строки перед первой ячейкой,  если да, то учитываем это в сетке
										//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
										if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) 
										{
											var cell_Indent =
											{
												W: X_end - cellWidth,
												Type: -1,
												Grid_span: 1
											};
											cellsInfo[cellsInfo.length] = cell_Indent;
										}

										var cell =
										{
											W: cellWidth,
											Type: 0,
											GridSpan: 1
										};
										cellsInfo[cellsInfo.length] = cell;

										rowsInfo[curRow] = cellsInfo;
									}
								}
								
								// Удаление ячеек
								for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
								{
									var cell = Cells[nTempCellIndex];
									cell.Row.RemoveCell(cell.Index);
								}
								this.SetTableGrid(this.Internal_CreateNewGrid(rowsInfo));
								return true;
							}
						}
					}
				}
			} 
			// Справа
			else if (Cell.Index === this.GetRow(Cell.Row.Index).Get_CellsCount() - 1)
			{
				var Cells = [];
				
				if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(1).Value === 0)
				{
					for (var curRow = Cell.Row.Index; curRow < this.Get_RowsCount(); curRow++)
					{
						var TempRow  = this.GetRow(curRow);
						var TempCell = TempRow.Get_Cell(Cell.Index);
						
						if (TempCell === null)
							continue;

						if (TempCell.GetVMerge() === 2)
						{
							Cells.push(TempCell);
							
							if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
							{
								if (TempCell.Get_Border(2).Value === 0)
								{	
									Cells.reverse();

									for (var i = 0; i < Cells.length; ++i)
									{
										var cell = Cells[i];
										this.CurCell = cell;
										this.RemoveTableCells();
									}
									return true;
								}
							}
						}
						else if (TempCell.GetVMerge() === 1)
						{
							if (TempCell.Row.Index === Cell.Row.Index)
							{
								Cells.push(TempCell);
							}

							if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
							{
								if (TempCell.Get_Border(2).Value === 0)
								{
									Cells.reverse();
									for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
									{
										var cell = Cells[nTempCellIndex];
										this.CurCell = cell;
										this.RemoveTableCells();
									}
									return true;
								}
								return true;
							}
						}
					}
				}
				else  if (Cell.Get_Border(2).Value === 0 && Cell.Row.Index === rowNumber)
				{
					for (var curRow = Cell.Row.Index; curRow >= 0; curRow--)
					{
						var TempRow  = this.GetRow(curRow);
						var TempCell = this.GetRow(curRow).Get_Cell(Cell.Index);
						
						if (TempCell.GetVMerge() === 2)
						{
							Cells.push(TempCell);
						}
						else if (TempCell.GetVMerge() === 1)
						{
							
							if (TempCell.Row.Index === Cell.Row.Index)
							{
								Cells.push(TempCell);
								return true;
							}
							if (TempCell.Get_Border(0).Value === 0 && TempCell.Get_Border(1).Value === 0)
							{
								Cells.push(TempCell);
								Cells.reverse();
								for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
								{
									var cell = Cells[nTempCellIndex];
									this.CurCell = cell;
									this.RemoveTableCells();
								}
								return true;
							}
						}
							
						
					}
				}
				
			}

			return; 
		}	
		
		// Если текущее выделение невозможно объеденить, 
		// пробуем из него выделить группы, которые объеденить можно
		if (false === bCanMerge)
		{
			if (click)
			{
				if (this.Selection.Data.length === 2)
				{
					var Cell_1_pos	   = this.Selection.Data[0];
					var Cell_2_pos	   = this.Selection.Data[1];
					var Row_1  		   = this.GetRow(Cell_1_pos.Row);
					var Row_2 		   = this.GetRow(Cell_2_pos.Row);
					var Cell_1 		   = Row_1.Get_Cell(Cell_1_pos.Cell); 
					var Cell_2		   = Row_2.Get_Cell(Cell_2_pos.Cell);

					if (isHSelect)
					{
						var Grid_start_1   = Row_1.Get_CellInfo(Cell_1_pos.Cell).StartGridCol;
						var Grid_span_1    = Cell_1.Get_GridSpan();
						var VMerge_count_1 = this.Internal_GetVertMergeCount(Cell_1_pos.Row, Grid_start_1, Grid_span_1);

						if (VMerge_count_1 > 1)
						{
							for (var Index = 0; Index < this.GetRow(Cell_1_pos.Row + VMerge_count_1 - 1).Get_CellsCount(); Index++)
							{
								var TempRow  		= this.GetRow(Cell_1_pos.Row + VMerge_count_1 -1);
								var TempCell 		= TempRow.Get_Cell(Index);
								var Temp_Grid_start = TempRow.Get_CellInfo(Index).StartGridCol;

								if (Grid_start === Temp_Grid_start)
								{
									Cell_1 = TempCell;
								}
							}
						}
						
						// Пустая граница (без отрисовки)
						var borderNan = new CDocumentBorder(); 
						
						// Стираем границу
						if (Cell_1.Get_Border(2).Value != 0)
							Cell_1.Set_Border(borderNan,2);
						if (Cell_2.Get_Border(0).Value != 0)	
							Cell_2.Set_Border(borderNan, 0);
					}
					else if (isVSelect)
					{
						// Пустая граница (без отрисовки)
						var borderNan = new CDocumentBorder();
						
						if (this.Selection.Data.length === 1)
						{
							var Cell = this.GetRow(this.Selection.Data[0].Row).Get_Cell(this.Selection.Data[0].Cell);
							Cell.Set_Border(borderNan, 3);
						}

						// Стираем границу
						if (Cell_1.Get_Border(1).Value != 0)
							Cell_1.Set_Border(borderNan, 1);
						if (Cell_2.Get_Border(3).Value != 0)
							Cell_2.Set_Border(borderNan, 3);
						
					}
					// Если отсутвуют все внутренние и внешние границы у строки - удаляем её
					for (var i = 0; i < this.Selection.Data.length; ++i)
					{
						var cur_pos = this.Selection.Data[i];

						if (this.GetRow(cur_pos.Row).Get_CellsCount() === 1)
						{
							var Cell = this.GetRow(cur_pos.Row).Get_Cell(0);

							if (cur_pos.Row === 0)
							{
								if (Cell.Get_Border(1).Value === 0 && Cell.Get_Border(3).Value === 0 && Cell.Get_Border(0).Value === 0)
								{
									this.RemoveTableRow(cur_pos.Row);
								}
								else if (Cell.Get_Border(3).Value === 0 && Cell.Get_Border(0).Value === 0 && Cell.Get_Border(2).Value === 0)
								{
									this.RemoveTableRow(cur_pos.Row);
								}
							}
							else if (cur_pos.Row === this.Get_RowsCount() - 1)
							{
								if (Cell.Get_Border(1).Value === 0 && Cell.Get_Border(3).Value === 0 && Cell.Get_Border(2).Value === 0)
								{
									this.RemoveTableRow(cur_pos.Row);
								}
							}
							else if (Cell.Get_Border(1).Value === 0 && Cell.Get_Border(3).Value === 0 && Cell.Get_Border(0).Value === 0 && Cell.Get_Border(2).Value === 0)
							{
								this.RemoveTableRow(cur_pos.Row);
							}
						}
					}
					for (var nSelectionIndex = 0, nSelectionLen = this.Selection.Data.length; nSelectionIndex < nSelectionLen; ++nSelectionIndex)
					{
						var cur_pos 	 = this.Selection.Data[nSelectionIndex];
						var Row 		 = this.GetRow(cur_pos.Row);
						var Cell 		 = Row.Get_Cell(cur_pos.Cell);
						var Grid_start 	 = Row.Get_CellInfo(cur_pos.Cell).StartGridCol;
						var Grid_span 	 = Cell.Get_GridSpan();
						var VMerge_Count = this.Internal_GetVertMergeCount(cur_pos.Row, Grid_start, Grid_span);
						
						// Удаление ячейки
						// Слева
						if (Cell.Index === 0)
						{
							var Cells 	 = []; // ячейки, которые будут удалены, при условии, что все внешние границы стерты
							var rowsInfo = []; // т.к. исп. функцию RemoveTableCells, при удалении ячейки слева, сетка смещается влево, поэтому генерируем свою сетку 
							

							if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(3).Value === 0)
							{
								for (var viewRow = Cell.Row.Index; viewRow < this.Get_RowsCount(); viewRow++)
								{
									var TempRow  = this.GetRow(viewRow);
									var TempCell = TempRow.Get_Cell(0);
									
									// т.к. ячейка может иметь верт. объединение необходимо это учитывать 
									// и добавить в Cells все ячейки входящие в это объединение
									if (TempCell.GetVMerge() === 2)
									{
										Cells.push(TempCell);
										
										// если рассматриваемая ячейка - последняя из верт. объединения, удаляем все ячейки которые попали в Cells
										if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
										{
											if (TempCell.Get_Border(2).Value === 0)
											{
												// генерация новой сетки
												for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
												{
													var cellsInfo = [];
													for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
													{
														if (curCell === Cell.Index && curRow >= Cells[0].Row.Index && curRow <= Cells[Cells.length - 1].Row.Index)
														{
															var cell = 
															{
																W: this.GetRow(curRow).CellsInfo[curCell].X_cell_end,
																Type: - 1,
																Grid_span : 1
															};
															cellsInfo[cellsInfo.length] = cell;
															continue;
														}

														var X_start    = this.GetRow(curRow).CellsInfo[curCell].X_cell_start;
														var X_end      = this.GetRow(curRow).CellsInfo[curCell].X_cell_end;
														var cellWidth  = X_end - X_start;
														var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;

														//Проверяем есть ли отступ у строки перед первой ячейкой,  если да, то учитываем это в сетке
														//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
														if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) {
															var cell_Indent =
															{
																W: X_end - cellWidth,
																Type: -1,
																Grid_span: 1
															};
															cellsInfo[cellsInfo.length] = cell_Indent;
														}

														var cell =
														{
															W: cellWidth,
															Type: 0,
															GridSpan: 1
														};
														cellsInfo[cellsInfo.length] = cell;

														rowsInfo[curRow] = cellsInfo;
													}
												}
												Cells.reverse();
												for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
												{
													var cell = Cells[nTempCellIndex];
													cell.Row.RemoveCell(cell.Index);
												}
												this.SetTableGrid(this.Internal_CreateNewGrid(rowsInfo));
												return true;
											}
										}
									}
									else if (TempCell.GetVMerge() === 1)
									{
										// Если рассматриваемая ячейка - первая из верт объединения, добавляем её
										if (TempCell.Row.Index === Cell.Row.Index)
										{
											Cells.push(TempCell);
										}

										// Случай, когда вертикальное объединение имет ровно 1 ячейку, сразу удаляем ячейку
										if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
										{
											if (TempCell.Get_Border(2).Value === 0)
											{
												// Генерация новой сетки
												for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
												{
													
													var cellsInfo = [];
													for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
													{
														//if (this.GetRow(curRow).Get_Cell(curCell).Id = )
														if (curCell === Cell.Index && curRow >= Cells[0].Row.Index && curRow <= Cells[Cells.length - 1].Row.Index)
														{
															var cell = 
															{
																W: this.GetRow(curRow).CellsInfo[curCell].X_cell_end,
																Type: - 1,
																Grid_span : 1
															};
															cellsInfo[cellsInfo.length] = cell;
															continue;
														}

														var X_start    = this.GetRow(curRow).CellsInfo[curCell].X_cell_start;
														var X_end 	   = this.GetRow(curRow).CellsInfo[curCell].X_cell_end;
														var cellWidth  = X_end - X_start;
														var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;

														//Проверяем есть ли отступ у строки перед первой ячейкой,  если да, то учитываем это в сетке
														//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
														if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) 
														{
															var cell_Indent =
															{
																W: X_end - cellWidth,
																Type: -1,
																Grid_span: 1
															};
															cellsInfo[cellsInfo.length] = cell_Indent;
														}

														var cell =
														{
															W: cellWidth,
															Type: 0,
															GridSpan: 1
														};
														cellsInfo[cellsInfo.length] = cell;

														rowsInfo[curRow] = cellsInfo;
													}
												}
												Cells.reverse();
												
												for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
												{
													var cell = Cells[nTempCellIndex];
													if (cell.Row.Get_CellsCount() === 1)
													{
														this.RemoveTableRow(cell.Row.Index);
													}
													else
													{
														cell.Row.RemoveCell(cell.Index);
													}
												}

												this.SetTableGrid(this.Internal_CreateNewGrid(rowsInfo));
												return true;
											}
										}
									}
								}
							}
							else if (Cell.Get_Border(2).Value === 0 && Cell.Row.Index === rowNumber)
							{
								for (var viewRow = Cell.Row.Index; viewRow >= 0; viewRow-- )
								{
									var TempRow  = this.GetRow(viewRow);
									var TempCell = TempRow.Get_Cell(0);
									
									if (TempCell.GetVMerge() === 2)
									{
										Cells.push(TempCell);
									}
									else if (TempCell.GetVMerge() === 1)
									{
										
										if (TempCell.Row.Index === Cell.Row.Index)
										{
											Cells.push(TempCell);
											return true;
										}
										if (TempCell.Get_Border(0).Value === 0 && TempCell.Get_Border(3).Value === 0)
										{
											Cells.push(TempCell);
											Cells.reverse();

											// Генерируем новую сетку таблицы
											for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
											{
												var cellsInfo = [];
												for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
												{
													if (curCell === Cell.Index && curRow >= Cells[0].Row.Index && curRow <= Cells[Cells.length - 1].Row.Index)
													{
														var cell = 
														{
															W: this.GetRow(curRow).CellsInfo[curCell].X_cell_end,
															Type: - 1,
															Grid_span : 1
														};
														cellsInfo[cellsInfo.length] = cell;
														continue;
													}

													var X_start    = this.GetRow(curRow).CellsInfo[curCell].X_cell_start;
													var X_end 	   = this.GetRow(curRow).CellsInfo[curCell].X_cell_end;
													var cellWidth  = X_end - X_start;
													var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;

													//Проверяем есть ли отступ у строки перед первой ячейкой,  если да, то учитываем это в сетке
													//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
													if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) 
													{
														var cell_Indent =
														{
															W: X_end - cellWidth,
															Type: -1,
															Grid_span: 1
														};
														cellsInfo[cellsInfo.length] = cell_Indent;
													}

													var cell =
													{
														W: cellWidth,
														Type: 0,
														GridSpan: 1
													};
													cellsInfo[cellsInfo.length] = cell;

													rowsInfo[curRow] = cellsInfo;
												}
											}
											
											// Удаление ячеек
											for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
											{
												var cell = Cells[nTempCellIndex];
												cell.Row.RemoveCell(cell.Index);
											}

											this.SetTableGrid(this.Internal_CreateNewGrid(rowsInfo));
											return true;
										}
									}
								}
							}
						} 
						// Справа
						else if (Cell.Index === this.Content[Cell.Row.Index].Get_CellsCount() - 1)
						{
							var Cells = [];
							
							if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(1).Value === 0)
							{
								for (var curRow = Cell.Row.Index; curRow < this.Get_RowsCount(); curRow++)
								{
									var TempRow  = this.GetRow(curRow);
									var TempCell = TempRow.Get_Cell(Cell.Index);
									
									if (TempCell === null)
										continue

									if (TempCell.GetVMerge() === 2)
									{
										Cells.push(TempCell);
										
										if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
										{
											if (TempCell.Get_Border(2).Value === 0)
											{	
												Cells.reverse();
												for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
												{
													var cell = Cells[nTempCellIndex];
													this.CurCell = cell;
													this.RemoveTableCells();
												}
												return true;
											}
										}
									}
									else if (TempCell.GetVMerge() === 1)
									{
										if (TempCell.Row.Index === Cell.Row.Index)
										{
											Cells.push(TempCell);
										}
										if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
										{
											if (TempCell.Get_Border(2).Value === 0)
											{
												Cells.reverse();
												for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
												{
													var cell = Cells[nTempCellIndex];
													this.CurCell = cell;
													this.RemoveTableCells();
												}
												return true;
											}
										}
									}
								}
							}
							else  if (Cell.Get_Border(2).Value === 0 && Cell.Row.Index === rowNumber)
							{
								for (var curRow = Cell.Row.Index; curRow >= 0; curRow--)
								{
									var TempRow  = this.GetRow(curRow);
									var TempCell = TempRow.Get_Cell(Cell.Index);
									
									if (TempCell.GetVMerge() === 2)
									{
										Cells.push(TempCell);
									}
									else if (TempCell.GetVMerge() === 1)
									{
										if (TempCell.Row.Index === Cell.Row.Index)
										{
											Cells.push(TempCell);
											return true;
										}
										if (TempCell.Get_Border(0).Value === 0 && TempCell.Get_Border(1).Value === 0)
										{
											Cells.push(TempCell);
											Cells.reverse();

											for (var nTempCellIndex = 0, nTempCellsLen = Cells.length; nTempCellIndex < nTempCellsLen; ++nTempCellIndex)
											{
												var cell = Cells[nTempCellIndex];
												this.CurCell = cell;
												this.RemoveTableCells();
											}

											return true;
										}
									}
								}
							}
						}
					}
					return true;
				}
			}
			else 
			{
				newSelectionData = []; 
				var try_again = false;

				// Ищем ячейки которые можно будет объеденить
				for (var curCell = 0; curCell < TempSelectionData.length; curCell++)
				{
					this.Selection.Data = [];
					
					// Добавляем в this.Selection.Data ячейку, с которой будем пытаться объеденить следующие
					var Cell_1_pos = TempSelectionData[curCell];
					this.Selection.Data.push(Cell_1_pos);

					for (var curCell2 = 0; curCell2 < TempSelectionData.length; curCell2++)
					{
						var Cell_2_pos = TempSelectionData[curCell2];

						// Исключаем случаи когда рассматриваем объединение ячейки самой с собой
						if (Cell_1_pos.Row === Cell_2_pos.Row && Cell_1_pos.Cell === Cell_2_pos.Cell)
							continue;

						// добавляем ячейку в группу ячеек
						this.Selection.Data.push(Cell_2_pos);

						// Проверяем, можно ли объединить получившуюся группу ячеек, если да
						// удаляем только что добавленную ячейку из массива TempSelectionData, т.к. она уже образовывает объединение
						var newTemp 	   = this.Internal_CheckMerge();
						var new_bCanMerge  = newTemp.bCanMerge;
						if (!new_bCanMerge)
							this.Selection.Data.pop();
						else 
						{
							TempSelectionData.splice(curCell2, 1);
							curCell2 = -1;
						}
					}

					// Если объединений с ячейкой, с которой пытались получить объединение, не было получено, пытаемся со следующей
					if (this.Selection.Data.length <= 1)
						continue;

					// Если объединение было получено, добавляем в массив объединений
					newSelectionData.push(this.Selection.Data);
					
					// Удаляем из TempSelectionData ячейку, с которой пытались получить объединение, т.к. она в него
					if (newSelectionData[newSelectionData.length - 1].length > 1)
					{
						for (var Item = 0; Item < TempSelectionData.length; Item++)
							if (TempSelectionData[Item].Row === Cell_1_pos.Row && TempSelectionData[Item].Cell === Cell_1_pos.Cell)
								TempSelectionData.splice(Item, 1);
						curCell--;
					}
				}
				
				// Пробуем полученные объединения объединить между собой 
				// если выходит, перезаполняем объединения
				for (var Index = 0; Index < newSelectionData.length; Index++)
				{
					this.Selection.Data = [];
					try_again 			= false;

					for (var nPosIndex = 0, nPosLen = newSelectionData[Index].length; nPosIndex < nPosLen; ++nPosIndex)
					{
						var cell_pos = newSelectionData[Index][nPosIndex];
						this.Selection.Data.push(cell_pos);
					}

					for (var Index2 = 0; Index < newSelectionData.length; Index2++)
					{
						if (Index === Index2)
							continue;
						if ("undefined" === typeof(newSelectionData[Index2]))
							break;

						for (var nPosIndex2 = 0, nPosLen2 = newSelectionData[Index2].length; nPosIndex2 < nPosLen2; ++nPosIndex2)
						{
							var cell_pos2 = newSelectionData[Index2][nPosIndex2];
							this.Selection.Data.push(cell_pos2);
						}
						
						var newTemp 	   = this.Internal_CheckMerge();
						var new_bCanMerge  = newTemp.bCanMerge;

						if (!new_bCanMerge)
							for (var Item = 0; Item < newSelectionData[Index2].length; Item++)
								this.Selection.Data.pop();
						else 
						{
							newSelectionData.splice(Index2, 1);
							Index2--;
						}
					}
					
					for (var curCell3 = 0; curCell3 < TempSelectionData.length; curCell3++)
					{
						this.Selection.Data.push(TempSelectionData[curCell3]);

						var newTemp = this.Internal_CheckMerge();
						var new_bCanMerge  = newTemp.bCanMerge;

						if (!new_bCanMerge)
							this.Selection.Data.pop();
						else 
						{
							TempSelectionData.splice(curCell3, 1);
							curCell3--;
							
							// Т.к. мы можем объеденить ячейки, стоит попытаться снова рассмотреть ячейки, которые уже были рассмотрены
							// но с которыми объединение нельзя было получить
							try_again = true;
						}
					}
					newSelectionData[Index] = this.Selection.Data;
					
					// Сортировка NewSelectionData
					newSelectionData[Index].sort(function(a, b)
					{
						if (a.Row > b.Row)
							return 1;
						if (a.Row < b.Row)
							return -1;
						if (a.Row === b.Row)
							return 0;
					});
					newSelectionData[Index].sort(function(a, b)
					{
						if (a.Cell > b.Cell && a.Row === b.Row)
							return 1;
						if (a.Cell < b.Cell && a.Row === b.Row)
							return -1;
						if (a.Cell === b.Cell && a.Row === b.Row)
							return 0;
					});
					
					// Начинаем сначала 
					if (try_again)
						Index = -1;
				}
				newTempSelectionData = TempSelectionData;
			}
		}
		
		// При объединении двух ячеек следующих друг за другом,
		// необходимо, чтобы правый Border ячейки справа сохранился в новой ячейке
		if (this.Selection.Data.length === 2)
		{
			if (isVSelect)
			{
				var Pos1 	  = this.Selection.Data[0];
				var Pos2 	  = this.Selection.Data[1];
				var TempCell1 = this.GetRow(Pos1.Row).Get_Cell(Pos1.Cell);
				var TempCell2 = this.GetRow(Pos2.Row).Get_Cell(Pos2.Cell);

				TempCell1.Set_Border(TempCell2.Get_Border(1), 1);
			}
			if (isHSelect)
			{
				var Pos1 	  = this.Selection.Data[0];
				var Pos2 	  = this.Selection.Data[1];
				var TempCell1 = this.GetRow(Pos1.Row).Get_Cell(Pos1.Cell);
				var TempCell2 = this.GetRow(Pos2.Row).Get_Cell(Pos2.Cell);

				TempCell1.Set_Border(TempCell2.Get_Border(2), 2);
			}
		}
		
		// Для каждой группы из newSelectionData объединяем ячейки
		for (var Selection = 0; Selection < newSelectionData.length; Selection++)
		{
			var curRows 	  = [];
			var curCells 	  = [];
			X_Front 		  = false;
			X_After  		  = false;
			
			this.Selection.Data = newSelectionData[Selection];

			var Temp       = this.Internal_CheckMerge();
			var bCanMerge  = Temp.bCanMerge;
			var Grid_start = Temp.Grid_start;
			var Grid_end   = Temp.Grid_end;
			var RowsInfo   = Temp.RowsInfo;

			var Pos_tl  = this.Selection.Data[0];
			var Cell_tl = this.GetRow(Pos_tl.Row).Get_Cell(Pos_tl.Cell);
			
			if (Y_Over)
			{
				if (this.Selection.Data[0].Row === 0)
				{
					var borderNan = new CDocumentBorder();
					if (Cell_tl.Get_Border(0).Value != 0)
						Cell_tl.Set_Border(borderNan, 0);
				}
			}
			if (Y_Under)
			{
				var Cell_pos_ = 
				{
					Cell : this.Selection.Data[this.Selection.Data.length - 1].Cell,
					Row  : this.Selection.Data[this.Selection.Data.length - 1].Row
				};

				for (var Index = 0; Index < this.GetRow(Cell_pos_.Row).Get_CellsCount(); Index++)
				{
					var ViewCell 		 	  = this.GetRow(Cell_pos_.Row).Get_Cell(Index);
					var View_Grid_start_      = this.GetRow(Cell_pos_.Row).Get_CellInfo(ViewCell.Index).StartGridCol;
					if (Grid_start === View_Grid_start_)
						Cell_pos_.Cell 		 = ViewCell.Index;
				}

				var Row_ 			 = this.GetRow(Cell_pos_.Row);
				var Cell_ 			 = Row_.Get_Cell(Cell_pos_.Cell);
				var Grid_start_      = Row_.Get_CellInfo(Cell_pos_.Cell).StartGridCol;
				var Grid_span_ 	     = Cell_.Get_GridSpan();
				var VMerge_Count_    = this.Internal_GetVertMergeCount(Cell_pos_.Row, Grid_start_, Grid_span_);
				var TempCell 	     = null;
				
				for (var Index = 0; Index < this.GetRow(Cell_pos_.Row + VMerge_Count_ - 1).Get_CellsCount(); Index++)
				{
					var TempRow 	  = this.GetRow(Cell_pos_.Row + VMerge_Count_ - 1);
					var TempGridStart = TempRow.Get_CellInfo(Index).StartGridCol;

					if (TempGridStart === Grid_start_)
					{
						TempCell = this.GetRow(Cell_pos_.Row + VMerge_Count_ - 1).Get_Cell(Index);
						break;
					}
				}
				
				var borderNan 		 = new CDocumentBorder();

				if (TempCell.Get_Border(2).Value != 0)
					TempCell.Set_Border(borderNan, 2);
			}

			var end_pos = this.Selection.Data[this.Selection.Data.length - 1];

			if (Cell_tl.Index === 0 && this.GetRow(Cell_tl.Row.Index).CellsInfo[Cell_tl.Index].X_cell_start > X1)
				X_Front = true;
			if (end_pos.Cell === this.GetRow(end_pos.Row).Get_CellsCount() - 1 && this.GetRow(end_pos.Row).CellsInfo[end_pos.Cell].X_cell_end < X2)
				X_After = true;

			if (X_Front)
			{
				if (this.Selection.Data[0].Cell === 0)
				{
					var borderNan = new CDocumentBorder();
					if (Cell_tl.Get_Border(3).Value != 0)
						Cell_tl.Set_Border(borderNan, 3);
				}
			}
			if (X_After)
			{
				var borderNan = new CDocumentBorder();
				if (Cell_tl.Get_Border(1).Value != 0)
					Cell_tl.Set_Border(borderNan, 1);
			}

			// Объединяем содержимое всех ячеек в левую верхнюю ячейку. (Все выделенные
			// ячейки идут у нас последовательно, начиная с левой верхней), и объединяем
			// сами ячейки.
			for (var Index = 0; Index < this.Selection.Data.length; Index++)
			{
				var Pos  = this.Selection.Data[Index];
				var Row  = this.GetRow(Pos.Row);
				var Cell = Row.Get_Cell(Pos.Cell);

				// Добавляем содержимое данной ячейки к содержимому левой верхней ячейки
				if (0 != Index)
				{
					Cell_tl.Content_Merge(Cell.Content);
					Cell.Content.Clear_Content();
				}
			}

			if (true !== isClearMerge)
			{
				// Выставим ширину результируещей ячейки
				var SumW = 0;
				for (var CurGridCol = Grid_start; CurGridCol <= Grid_end; CurGridCol++)
				{
					SumW += this.TableGridCalc[CurGridCol];
				}
				Cell_tl.Set_W(new CTableMeasurement(tblwidth_Mm, SumW));
			}

			// Теперь нам надо удалить лишние ячейки и добавить ячейки с
			// вертикальным объединением.
			for (var RowIndex in RowsInfo)
			{
				var Row = this.GetRow(RowIndex);
				for (var CellIndex = 0; CellIndex < Row.Get_CellsCount(); CellIndex++)
				{
					var Cell_grid_start = Row.Get_CellInfo(CellIndex).StartGridCol;

					if (Grid_start === Cell_grid_start)
					{
						if (RowIndex != Pos_tl.Row)
						{
							var Cell = Row.Get_Cell(CellIndex);
							Cell.Set_GridSpan(Grid_end - Grid_start + 1);
							Cell.SetVMerge(vmerge_Continue);
						}
						else
						{
							Cell_tl.Set_GridSpan(Grid_end - Grid_start + 1);
						}
					}
					else if (Cell_grid_start > Grid_start && Cell_grid_start <= Grid_end)
					{
						Row.Remove_Cell(CellIndex);
						CellIndex--;
					}
					else if (Cell_grid_start > Grid_end)
						break;
				}
			}

			// Удаляем лишние строки
			this.Internal_Check_TableRows(true !== isClearMerge ? true : false);
			for (var PageNum = 0; PageNum < this.Pages.length - 1; PageNum++)
			{
				if (Pos_tl.Row <= this.Pages[PageNum + 1].FirstRow)
					break;
			}

			this.CurCell = Cell_tl;

			this.CurCell.GetContent().SelectAll();

			if (true !== isClearMerge)
			{
				// Запускаем пересчет
				this.Internal_Recalculate_1();
			}
			this.Selection.Data = newSelectionData[Selection][0];
			if (Selection === 0 && X_Front && X_After)
				canDel = true;

			if (canDel && X_Front && X_After && this.GetRow(Pos_tl.Row).Get_CellsCount() === 1)
				this.RemoveTableRow(Pos_tl.Row);
			
			
			for (var Index = 0; Index < this.Get_RowsCount(); Index++)
			{
				curRows.push(this.GetRow(Index));
			}
			for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
			{
				curCells[curRow] = [];

				for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
				{
					curCells[curRow].push(this.GetRow(curRow).Get_Cell(curCell));
				}
			}
			// Если количество строк уменьшилось, мы должны изменить координаты ячеек в следующих объединениях
			for (var Index = 0; Index < curRows.length; Index++)
			{
				if (oldRows[Index].Id != curRows[Index].Id)
				{
					for (var newIndex = Selection; newIndex < newSelectionData.length; newIndex++)
					{
						for (var Index2 = 0; Index2 < newSelectionData[newIndex].length; Index2++)
						{
							if (newSelectionData[newIndex][Index2].Row > Index) 
								newSelectionData[newIndex][Index2].Row -= 1;
						}

					}
					
					for (var Index2 = 0; Index2 < newTempSelectionData.length; Index2++)
					{
						if (newTempSelectionData[Index2].Row > Index)
							newTempSelectionData[Index2].Row -= 1;
					}

					oldRows.splice(Index, 1);
					oldCells.splice(Index, 1);
					Index = -1;
				}
			}
			for (var Index = 0; Index < curCells.length; Index++)
			{
				for (var Index2 = 0; Index2 < curCells[Index].length; Index2++)
				{
					if (oldCells[Index][Index2] != curCells[Index][Index2])
					{
						for (var newIndex = Selection; newIndex < newSelectionData.length; newIndex++)
						{

							for (var Index3 = 0; Index3 < newSelectionData[newIndex].length; Index3++)
							{
								if (newSelectionData[newIndex][Index3].Row === Index && newSelectionData[newIndex][Index3].Cell > Index2)
									newSelectionData[newIndex][Index3].Cell -= 1;
							}
						}
						
						for (var Index3 = 0; Index3 < newTempSelectionData.length; Index3++)
						{
							if (newTempSelectionData[Index3].Row === Index && newTempSelectionData[Index3].Cell > Index2)
							newTempSelectionData[Index3].Cell -= 1;
						}

						oldCells[Index].splice(Index2, 1);
						Index2 = -1;
					}
				}
			}
		}
		
		if (newSelectionData.length >= 1)
		{
			for (var nTempIndex = 0, nTempLen = newSelectionData.length; nTempIndex < nTempLen; ++nTempIndex)
			{
				var Item = newSelectionData[nTempIndex];
				newTempSelectionData.push(Item[0]);
			}
		}

		// если остались ячейки которые нельзя объединить, удаляем между ними и между объединенными границы
		if (newTempSelectionData.length > 1)
		{
			var borderNan = new CDocumentBorder();
			var Cells 	  = [];
			var rowsInfo  = []; // т.к. исп. функцию RemoveTableCells, при удалении ячейки слева, сетка смещается влево, 
			var isRigth   = false;
			var isLeft    = false;
			for (var Index = 0; Index < newTempSelectionData.length; Index++)
			{
				Y_Over  = false;
				Y_Under = false;
				X_Front = false;
				X_After = false;
				var Cell_pos_1     = newTempSelectionData[Index];
				var Row_1          = this.GetRow(Cell_pos_1.Row);
				if (Row_1 === undefined || Row_1 === null)
					continue;

				var Cell_1         = Row_1.Get_Cell(Cell_pos_1.Cell);
				if (Cell_1 === undefined || Cell_1 === null)
					continue;

				var Grid_start_1   = Row_1.Get_CellInfo(Cell_pos_1.Cell).StartGridCol;
				var Grid_span_1    = Cell_1.Get_GridSpan();
				var Grid_end_1     = Grid_start_1 + Grid_span_1 - 1;
				var VMerge_count_1 = this.Internal_GetVertMergeCount(Cell_pos_1.Row, Grid_start_1, Grid_span_1);
				var rowHSum 	   = 0;

				var absoluteCellPos = Cell_pos_1.Cell; // абсолютный номер позиции ячейки в сетке

				if (VMerge_count_1 >= 1)
				{
					for (var newIndex = Cell_pos_1.Row; newIndex < Cell_pos_1.Row + VMerge_count_1; newIndex++)
					{
						rowHSum += this.RowsInfo[newIndex].H[curColumn]
					}
					if (VMerge_count_1 > 1)
					{
						for (var Index2 = 0; Index2 < this.GetRow(Row_1.Index + VMerge_count_1 - 1).Get_CellsCount(); Index2++)
						{
							var TempRow  		= this.GetRow(Row_1.Index + VMerge_count_1 - 1);
							var TempCell 		= TempRow.Get_Cell(Index2);
							var Temp_Grid_start = TempRow.Get_CellInfo(TempCell.Index).StartGridCol;

							if (Grid_start_1 === Temp_Grid_start)
							{
								absoluteCellPos = TempCell.Index;
								break;
							}
						}
					}
				}

				if (this.RowsInfo[Cell_pos_1.Row].Y[curColumn] + rowHSum < Y2)
					Y_Under = true;
				if (this.RowsInfo[Cell_pos_1.Row].Y[curColumn] > Y1)
					Y_Over = true;

				if (Y_Over)
				{
					if (Cell_1.Get_Border(0).Value != 0)
						Cell_1.Set_Border(borderNan, 0);
				}
				if (Y_Under)
				{
					var TempCell = this.GetRow(Cell_pos_1.Row + VMerge_count_1 - 1).Get_Cell(absoluteCellPos);
					if (TempCell.Get_Border(2).Value != 0)
						TempCell.Set_Border(borderNan, 2);
				}

				if (Cell_pos_1.Cell === 0 && this.GetRow(Cell_pos_1.Row).CellsInfo[Cell_pos_1.Cell].X_cell_start > X1)
					X_Front = true;
				if (Cell_pos_1.Cell === this.GetRow(Cell_pos_1.Row).Get_CellsCount() - 1 && this.TableSumGrid[Grid_end_1] < X2)
					X_After = true;

				if (X_Front)
				{
					if (Cell_pos_1.Cell === 0)
						if (Cell_1.Get_Border(3).Value != 0)
							Cell_1.Set_Border(borderNan, 3);
				}
				if (X_After)
				{
					if (Cell_1.Get_Border(1).Value != 0)
						Cell_1.Set_Border(borderNan, 1);
				}

				for (var Index2 = 0; Index2 < newTempSelectionData.length; Index2++)
				{
					if (Index === Index2)
						continue;

					var Cell_pos_2     = newTempSelectionData[Index2];
					var Row_2          = this.GetRow(Cell_pos_2.Row);
					if (Row_2 === undefined || Row_2 === null)
						continue;
					var Cell_2         = Row_2.Get_Cell(Cell_pos_2.Cell);
					if (Cell_2 === undefined || Cell_2 === null)
						continue;
					var Grid_start_2   = Row_2.Get_CellInfo(Cell_pos_2.Cell).StartGridCol;
					var Grid_span_2    = Cell_2.Get_GridSpan();
					var Grid_end_2     = Grid_start_2 + Grid_span_2 - 1;
					var VMerge_count_2 = this.Internal_GetVertMergeCount(Cell_pos_2.Row, Grid_start_2, Grid_span_2);

					// Определяем взаимное расположение ячеек, удаляем нужные границы
					if (Grid_end_1 === Grid_start_2 - 1 && ((Cell_pos_2.Row >= Cell_pos_1.Row && Cell_pos_2.Row <= Cell_pos_1.Row + VMerge_count_1 -1) ||
						Cell_pos_1.Row >= Cell_pos_2.Row && Cell_pos_1.Row <= Cell_pos_2.Row + VMerge_count_2 -1))
					{
						// Стираем границу
						if (Cell_1.Get_Border(1).Value != 0)
							Cell_1.Set_Border(borderNan, 1);
						if (Cell_2.Get_Border(3).Value != 0)
							Cell_2.Set_Border(borderNan, 3);
					}
					// Определяем взаимное расположение ячеек, удаляем нужные границы
					else if ((Grid_start_1 === Grid_start_2 || Grid_end_1 === Grid_end_2) && (Cell_pos_1.Row + VMerge_count_1 - 1 === Cell_pos_2.Row - 1))
					{
						var Cell = this.GetRow(Cell_pos_1.Row + VMerge_count_1 - 1).Get_Cell(absoluteCellPos);
						// Стираем границу
						if (Cell.Get_Border(2).Value != 0)
							Cell.Set_Border(borderNan, 2);
						if (Cell_2.Get_Border(0).Value != 0)
							Cell_2.Set_Border(borderNan, 0);
					}

				}
			}
			
			// Если объединить ячейки нельзя, стираем все границы под выделением, 
			// если у ячейки отсутсвуют все внешние границы - удаляем её
			for (var nTempIndex = 0, nTempLen = newTempSelectionData.length; nTempIndex < nTempLen; ++nTempIndex)
			{
				var cur_pos = newTempSelectionData[nTempIndex];
				var Row          = this.GetRow(cur_pos.Row);
				if (Row === undefined || Row === null)
					continue;
				var Cell         = Row.Get_Cell(cur_pos.Cell);
				if (Cell === undefined || Cell === null)
					continue;
				var Grid_start 	 = Row.Get_CellInfo(cur_pos.Cell).StartGridCol;
				var Grid_span 	 = Cell.Get_GridSpan();
				var VMerge_Count = this.Internal_GetVertMergeCount(cur_pos.Row, Grid_start, Grid_span);
				
				// Проверка какие ячейки стоит удалить
				// Если ячейка находится внешне слева
				if (Cell.Index === 0)
				{
					if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(3).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							var TempRow  =  this.GetRow(curRow);
							var TempCell = null;
							
							for (var Index = 0; Index < TempRow.Get_CellsCount(); Index++)
							{
								var ViewCell 		= this.GetRow(curRow).Get_Cell(Index);
								var Temp_Grid_start = TempRow.Get_CellInfo(ViewCell.Index).StartGridCol;
								
								if (Temp_Grid_start === Grid_start)
								{
									TempCell = ViewCell;
									break;
								}
							}
							
							if (TempCell === null)
								continue;

							// т.к. ячейка может иметь верт. объединение необходимо это учитывать 
							// и добавить в Cells все ячейки входящие в это объединение
							if (TempCell.GetVMerge() === 2)
							{
								Cells.push(TempCell);
								
								// если рассматриваемая ячейка - последняя из верт. объединения, удаляем все ячейки которые попали в Cells
								if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
								{
									if (TempCell.Get_Border(2).Value === 0)
									{
										break;
									}
									else 
										Cells = [];
								}
							}
							
							else if (TempCell.GetVMerge() === 1)
							{
								// Если рассматриваемая ячейка - первая из верт объединения, добавляем её
								if (TempCell.Row.Index === Cell.Row.Index)
								{
									Cells.push(TempCell);
								}
								// Случай, когда вертикальное объединение имет ровно 1 ячейку, сразу удаляем ячейку
								if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
								{
									if (TempCell.Get_Border(2).Value === 0)
									{
										break;
									}
									else 
									{
										Cells.pop();
									}
								}
							}
						}
					}
					else if (Cell.Get_Border(2).Value === 0 && Cell.Row.Index === rowNumber)
					{
						for (var curRow = Cell.Row.Index; curRow >= 0; curRow-- )
						{
							var TempRow  = this.GetRow(curRow);
							var TempCell = null;
							
							for (var Index = 0; Index < TempRow.Get_CellsCount(); Index++)
							{
								var ViewCell = this.GetRow(curRow).Get_Cell(Index);
								var Temp_Grid_start 	 = TempRow.Get_CellInfo(ViewCell.Index).StartGridCol;
								
								if (Temp_Grid_start === Grid_start)
								{
									TempCell = ViewCell;
									break;
								}
							}
							
							if (TempCell.GetVMerge() === 2)
							{
								Cells.push(TempCell);
							}
							else if (TempCell.GetVMerge() === 1)
							{
								
								if (TempCell.Row.Index === Cell.Row.Index)
								{
									Cells.push(TempCell);
									return true;
								}
								if (TempCell.Get_Border(0).Value === 0 && TempCell.Get_Border(3).Value === 0)
								{
									Cells.push(TempCell);
									Cells.reverse();

									break;
								}
							}
						}
					}
					if (Cells.length != 0)
					{
						isLeft = true;
					}
				} 

				// Если ячейка находится внешне справа
				else if (Cell.Index === this.GetRow(Cell.Row.Index).Get_CellsCount() - 1) 
				{
					if (Cell.Get_Border(0).Value === 0 && Cell.Get_Border(1).Value === 0)
					{
						for (var curRow = Cell.Row.Index; curRow < Cell.Row.Index + VMerge_Count; curRow++)
						{
							var TempRow  =  this.GetRow(curRow);
							var TempCell = null;
							
							for (var Index = 0; Index < TempRow.Get_CellsCount(); Index++)
							{
								var ViewCell = this.GetRow(curRow).Get_Cell(Index);
								var Temp_Grid_start 	 = TempRow.Get_CellInfo(ViewCell.Index).StartGridCol;
								
								if (Temp_Grid_start === Grid_start)
								{
									TempCell = ViewCell;
									break;
								}
							}
							
							if (TempCell == null)
								continue;
							
							if (TempCell.GetVMerge() === 2)
							{
								Cells.push(TempCell);
								
								if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
								{
									if (TempCell.Get_Border(2).Value === 0)
									{	
										break;
									}
									else 
									{
										Cells = [];
									}
								}
							}
							else if (TempCell.GetVMerge() === 1)
							{
								if (TempCell.Row.Index === Cell.Row.Index)
								{
									Cells.push(TempCell);
								}
								if (TempCell.Row.Index === Cell.Row.Index + VMerge_Count - 1)
								{
									if (TempCell.Get_Border(2).Value === 0)
									{
										break;
									}
									else 
									{
										Cells.pop();
									}
								}
							}
						}
					}
					else  if (Cell.Get_Border(2).Value === 0 && Cell.Row.Index === rowNumber)
					{
						for (var curRow = Cell.Row.Index; curRow >= 0; curRow--)
						{
							var TempRow  = this.GetRow(curRow);
							var TempCell = null;
							
							for (var Index = 0; Index < TempRow.Get_CellsCount(); Index++)
							{
								var ViewCell 		= this.GetRow(curRow).Get_Cell(Index);
								var Temp_Grid_start = TempRow.Get_CellInfo(ViewCell.Index).StartGridCol;
								
								if (Temp_Grid_start === Grid_start)
								{
									TempCell = ViewCell;
									break;
								}
							}
							
							if (TempCell.GetVMerge() === 2)
							{
								Cells.push(TempCell);
							}
							else if (TempCell.GetVMerge() === 1)
							{
								if (TempCell.Row.Index === Cell.Row.Index)
								{
									Cells.push(TempCell);
									return true;
								}
								if (TempCell.Get_Border(0).Value === 0 && TempCell.Get_Border(1).Value === 0)
								{
									Cells.push(TempCell);
									break;
								}
							}
						}
					}
					if (Cells.length != 0)
					{
						isRigth   = true;
					}
				}
			}
			
			// Генерация новой сетки
			// учитывая ячейки, которые будем удалять
			if (Cells.length > 0)
			{
				for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
				{
					var cellsInfo = [];
					for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
					{
						var isContinue = false;
						var ViewCell   = this.GetRow(curRow).Get_Cell(curCell);

						for (var nTempCellIndex = 0, nTempCellsLength = Cells.length; nTempCellIndex < nTempCellsLength; ++nTempCellIndex)
						{
							var cur_cell = Cells[nTempCellIndex];

							if (ViewCell.Id === cur_cell.Id && cur_cell.Index === 0)
							{
								var grid_span  = cur_cell.Get_GridSpan();
								var grid_start = cur_cell.Row.Get_CellInfo(cur_cell.Index).StartGridCol;
								
								if (this.GetRow(curRow).Get_CellsCount() != 1)
								{
									var cell = 
									{
										W         : this.TableSumGrid[grid_start + grid_span - 1],
										Type      : -1,
										Grid_span : 1
									};
									cellsInfo[cellsInfo.length] = cell;
									isContinue                  = true;

									cur_cell.Row.RemoveCell(cur_cell.Index);
									
									curCell--;
									break;
								}
							}
							else if (ViewCell.Id === cur_cell.Id && cur_cell.Index === cur_cell.Row.Get_CellsCount() - 1)
							{
								this.CurCell = cur_cell;
								cur_cell.Row.RemoveCell(cur_cell.Index);
								isContinue = true;
							}
						}

						if (isContinue) 
							continue;
						
						var Grid_start = this.GetRow(curRow).Get_CellInfo(curCell).StartGridCol;
						var Grid_span   = this.GetRow(curRow).Get_Cell(curCell).Get_GridSpan();	

						var X_start = this.TableSumGrid[Grid_start - 1];
						var X_end = this.TableSumGrid[Grid_start + Grid_span - 1];
						
						var cellWidth = X_end - X_start;

						//Проверяем есть ли отступ у строки перед первой ячейкой,  если да, то учитываем это в сетке
						//GridBefore строки должен совпадать с Grid_Start ячейки(перед которой отступ), чтобы условие выполнилось ровно один раз
						if (this.GetRow(curRow).Get_Before().GridBefore >= 1 && Grid_start === this.GetRow(curRow).Get_Before().GridBefore) 
						{
							var cell_Indent =
							{
								W: X_end - cellWidth,
								Type: -1,
								Grid_span: 1
							};
							cellsInfo[cellsInfo.length] = cell_Indent;
						}

						var cell =
						{
							W: cellWidth,
							Type: 0,
							GridSpan: 1
						};
						cellsInfo[cellsInfo.length] = cell;

						rowsInfo[curRow] = cellsInfo;
					}

				}	
				this.SetTableGrid(this.Internal_CreateNewGrid(rowsInfo));
			}	
		}
	}
};
CTable.prototype.GetDrawLine = function(X1, Y1, X2, Y2, CurPageStart, CurPageEnd, drawMode)
{
	var X1_origin = 0;
	var X2_origin = 0;
	X1_origin += X1; 
	X2_origin += X2;

	var Y1_origin = 0;
	var Y2_origin = 0;
	Y1_origin += Y1; 
	Y2_origin += Y2;

	var curColumn = CurPageStart;
	// Приводим к координатам таблицы
	X1 					= X1 - this.Pages[curColumn].X; 
	X2 					= X2 - this.Pages[curColumn].X;


	var Y_Under = false;
	var Y_Over 	= false;
	
	if (X1 > X2)
	{
		var cache; 
		cache = X2;
		X2 = X1;
		X1 = cache;
	}

	if (drawMode === true)
	{
		if (X1 < 0 )
			X1 = 0;
		if (X2 < 0)
			X2 = 0;
		if (Y1 < 0)
			Y1 = 0;
		if (Y2 < 0)
			Y2 = 0;
			
		var borders = [];

		if (Y1 > this.Pages[curColumn].Bounds.Bottom || Y1 < this.Pages[curColumn].Bounds.Top)
		{
			var Line = 
			{
				X1  : X1_origin,
				X2  : X2_origin,
				Y1 : Y1,
				Y2 : Y2,
				Color : "Red",
				Bold  : false
			};

			borders.push(Line);

			return borders;
		}
		// Рисуем вертикальную линию
		if (Math.abs(Y2 - Y1) > 2 && Math.abs(X2 - X1) < 3)
		{
			//если поставили просто точку => выход из функции
			if (Y1 === Y2)
				return;

			//если рисуем линию снизу вверх
			if (Y1 > Y2) 
			{
				var cache;
				cache = Y2;
				Y2 	  = Y1;
				Y1 	  = cache;
			}

			var Rows 	  = [];        // массив номеров строк подлежащих делению (которые мы режем)
			var CellsNumb = [];

			for (var curRow = this.Pages[curColumn].FirstRow; curRow <= this.Pages[curColumn].LastRow; curRow++) 
			{
				if (Y1 <= this.RowsInfo[this.Pages[curColumn].FirstRow].Y[curColumn] && this.RowsInfo[curRow].Y[curColumn] <= Y2)
					Rows.push(curRow);
				else if (this.RowsInfo[curRow].Y[curColumn] <= Y1 && Y1 < this.RowsInfo[curRow].Y[curColumn] + this.RowsInfo[curRow].H[curColumn]) 
					Rows.push(curRow);
				else if (Rows.length === 0)
					continue;
				else if (this.RowsInfo[curRow].Y[curColumn] <= Y2)
					Rows.push(curRow);
			}
			
			for (var Index = 0; Index < Rows.length; Index++)
			{
				for (var curCell = 0; curCell < this.GetRow(Rows[Index]).Get_CellsCount(); curCell++)
				{
					if (X1 > this.GetRow(Rows[Index]).CellsInfo[curCell].X_cell_start && X1 < this.GetRow(Rows[Index]).CellsInfo[curCell].X_cell_end)
						CellsNumb[Rows[Index]] = curCell;
					else if (CellsNumb.length === 0)
						continue;
					else if (this.GetRow(Rows[Index]).CellsInfo[curCell].X_cell_start < X2)
						CellsNumb[Rows[Index]] = curCell;
				}
			}

			if (CellsNumb.length === 0)
			{
				var Line = 
				{
					X1  : X1_origin,
					X2  : X2_origin,
					Y1 : Y1_origin,
					Y2 : Y2_origin,
					Color : "Red",
					Bold  : false
				};

				borders.push(Line);

				return borders;
			} 
			
			var firstRowHeight = 0;
			
			var Row 	 = this.GetRow(Rows[0]);
			var Cell     = null;

			for (var Index = 0; Index < CellsNumb.length; Index++)
			{
				if (CellsNumb[Index] !== undefined)
				{
					Cell = this.GetRow(Index).Get_Cell(CellsNumb[Index]);
					break;
				}
			}
			
			
			var StartRow = Rows[0]; // строка, с которой стартует линия
			var EndRow 	 = Rows[Rows.length - 1]; // строка на которой должна заканчиватся линия (может отличаться от физического конца)


			if (CellsNumb[Rows[0]] !== undefined) // если ячейка не выступ
			{
				label1 : for (var Index = Rows[0]; Index >= 0; Index--)
				{
					var CurStartRow = this.GetRow(Rows[Rows.length - 1]); // Строка, на которой физически заканчиваем линию
					if (CellsNumb[Rows[Rows.length - 1]] === undefined)
						continue;

					var StartRowCellGridStart = CurStartRow.Get_CellInfo(CellsNumb[Rows[Rows.length - 1]]).StartGridCol;

					for (var Index2 = 0; Index2 < this.GetRow(Index).Get_CellsCount(); Index2++)
					{
						var TempCell = this.GetRow(Index).Get_Cell(Index2);
						var TempRow  = this.GetRow(Index);
						var Temp_Grid_start   = TempRow.Get_CellInfo(Index2).StartGridCol;

						if (Temp_Grid_start === StartRowCellGridStart)
						{
							if (TempCell.GetVMerge() === 1)
							{
								StartRow = Index;
								break label1;
							}
							else 
								continue;
						}
					}
				}
			}
			
			label2 : for (var Index = Rows[Rows.length - 1]; Index < this.Get_RowsCount(); Index++)
			{
				var CurEndRow = this.GetRow(Rows[Rows.length - 1]); // Строка, на которой физически заканчиваем линию

				if (CellsNumb[Rows[Rows.length - 1]] === undefined)
				{
					EndRow = Index;
					break;
				}
				var EndRowCellGridStart = CurEndRow.Get_CellInfo(CellsNumb[Rows[Rows.length - 1]]).StartGridCol;
				
				for (var Index2 = 0; Index2 < this.GetRow(Index).Get_CellsCount(); Index2++)
				{
					var TempRow  = this.GetRow(Index);
					var TempCell = TempRow.Get_Cell(Index2);
					var Temp_Grid_start   = TempRow.Get_CellInfo(Index2).StartGridCol;
					var Temp_Grid_span    = TempCell.Get_GridSpan();
					var Temp_VMerge_count = this.Internal_GetVertMergeCount(Index, Temp_Grid_start, Temp_Grid_span);
					
					if (Temp_Grid_start === EndRowCellGridStart)
					{
						if (Temp_VMerge_count === 1)
						{
							EndRow = Index + Temp_VMerge_count - 1;
							break label2;
						}
						else 
							continue;
					}
				}
			}

			if (Y2 - Y1 >= this.RowsInfo[Rows[0]].H[curColumn]/2)
			{
				if (Math.abs(Cell.Metrics.X_cell_start - X1)<= 1.5)
				{
					var Vline = 
					{
						X1  : Cell.Metrics.X_cell_start + this.Pages[curColumn].X,
						X2  : Cell.Metrics.X_cell_start + this.Pages[curColumn].X,
						Y1 : this.RowsInfo[StartRow].Y[curColumn],
						Y2 : this.RowsInfo[EndRow].Y[curColumn] + this.RowsInfo[EndRow].H[curColumn],
						Color : "Grey",
						Bold  : true
					};

					borders.push(Vline);
				}
				else if (Math.abs(Cell.Metrics.X_cell_end - X1) <= 1.5)
				{
					var Vline = 
					{
						X1  : Cell.Metrics.X_cell_end + this.Pages[curColumn].X,
						X2  : Cell.Metrics.X_cell_end + this.Pages[curColumn].X,
						Y1 : this.RowsInfo[StartRow].Y[curColumn],
						Y2 : this.RowsInfo[EndRow].Y[curColumn] + this.RowsInfo[EndRow].H[curColumn],
						Color : "Grey",
						Bold  : true
					};

					borders.push(Vline);
				}
				else 
				{
					var Vline = 
					{
						X1  : X1_origin,
						X2  : X1_origin,
						Y1 : this.RowsInfo[StartRow].Y[curColumn],
						Y2 : this.RowsInfo[EndRow].Y[curColumn] + this.RowsInfo[EndRow].H[curColumn],
						Color : "Grey",
						Bold  : false
					};

					borders.push(Vline);
				}
				
			}
			else if (Y2 - Y1 < this.RowsInfo[Rows[0]].H[curColumn]/2)
			{
				var Vline = 
				{
					X1  : X1_origin,
					X2  : X2_origin,
					Y1 : Y1_origin,
					Y2 : Y2_origin,
					Color : "Red",
					Bold  : false
				};

				borders.push(Vline);
			}
			
			return borders;
		}	
		// Рисуем горизонтальную линию 
		else if (Math.abs(X2 - X1) > 2 && Math.abs(Y2 - Y1) < 3)
		{
			if (X1 === X2)
			
				return;
			if (X1 > X2)
			{
				var cache; 
				cache = X2;
				X2 = X1;
				X1 = cache;
			}

			var RowNumb = []; // Строка, попавшая в вертикальное разбиение 
			var CellsNumb = []; // Массив номеров ячеек, попавших в вертикальное разбиение

			// Вычисление Row
			for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
			{
				if (Y1 > this.RowsInfo[curRow].Y[curColumn] && Y1 < (this.RowsInfo[curRow].Y[curColumn] + this.RowsInfo[curRow].H[curColumn]))
					RowNumb[0] = curRow;
			}

			if (X1 < 0 )
				X1 = this.GetRow(RowNumb[0]).CellsInfo[0].X_cell_start;

			// Заполнение Cells 
			if (RowNumb.length === 0)
			{
				var Line = 
				{
					X1  : X1_origin,
					X2  : X2_origin,
					Y1 : Y1,
					Y2 : Y2,
					Color : "Red",
					Bold  : false
				};

				borders.push(Line);

				return borders;
			}
				
			for (var curCell = 0; curCell < this.GetRow(RowNumb[0]).Get_CellsCount(); curCell++)
			{
				if (X1 >= this.GetRow(RowNumb[0]).CellsInfo[curCell].X_cell_start && X1 <= this.GetRow(RowNumb[0]).CellsInfo[curCell].X_cell_end)
					CellsNumb.push(curCell);
				else if (CellsNumb.length === 0)
					continue;
				else if (this.GetRow(RowNumb[0]).CellsInfo[curCell].X_cell_start < X2)
					CellsNumb.push(curCell);
			}
			
			if (CellsNumb.length === 0)
			{
				var Line = 
				{
					X1  : X1_origin,
					X2  : X2_origin,
					Y1 : Y1,
					Y2 : Y2,
					Color : "Red",
					Bold  : false
				};

				borders.push(Line);

				return borders;
			} 
			
			if (Math.abs(X2_origin - X1_origin) >= (this.GetRow(RowNumb[0]).Get_Cell(CellsNumb[0]).Metrics.X_cell_end - this.GetRow(RowNumb[0]).Get_Cell(CellsNumb[0]).Metrics.X_cell_start)/2)
			{
				if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] - Y1) < 2)
				{
					var Row 	  = this.GetRow(RowNumb[0]);
					var startCell = Row.Get_Cell(CellsNumb[0]);
					var endCell   = Row.Get_Cell(CellsNumb[CellsNumb.length - 1]);

					if (startCell.GetVMerge() === 2)
					{
						var Hline = 
						{
							Y1 : this.RowsInfo[RowNumb[0]].Y[curColumn],
							Y2 : this.RowsInfo[RowNumb[0]].Y[curColumn],
							X1 : startCell.Metrics.X_cell_start + this.Pages[curColumn].X,
							X2 : endCell.Metrics.X_cell_end + this.Pages[curColumn].X,
							Color : "Grey",
							Bold  : false
						};

						borders.push(Hline);
					}
					else 
					{
						var Hline = 
						{
							Y1 : this.RowsInfo[RowNumb[0]].Y[curColumn],
							Y2 : this.RowsInfo[RowNumb[0]].Y[curColumn],
							X1 : startCell.Metrics.X_cell_start + this.Pages[curColumn].X,
							X2 : endCell.Metrics.X_cell_end + this.Pages[curColumn].X,
							Color : "Grey",
							Bold  : true
						};

						borders.push(Hline);
					}
					
				}
				else if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn] - Y1) < 2)
				{
					var Row 	  = this.GetRow(RowNumb[0]);
					var startCell = Row.Get_Cell(CellsNumb[0]);
					var endCell   = Row.Get_Cell(CellsNumb[CellsNumb.length - 1]);
					
					var Grid_start   = Row.Get_CellInfo(startCell.Index).StartGridCol;
					var Grid_span    = startCell.Get_GridSpan();
					var VMerge_count = this.Internal_GetVertMergeCount(Row.Index, Grid_start, Grid_span);

					if (VMerge_count > 1)
					{
						var Hline = 
						{
							Y1 : this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn],
							Y2 : this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn],
							X1 : startCell.Metrics.X_cell_start + this.Pages[curColumn].X,
							X2 : endCell.Metrics.X_cell_end + this.Pages[curColumn].X,
							Color : "Grey",
							Bold  : false
						};

						borders.push(Hline);
					}
					else 
					{
						var Hline = 
						{
							Y1 : this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn],
							Y2 : this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn],
							X1 : startCell.Metrics.X_cell_start + this.Pages[curColumn].X,
							X2 : endCell.Metrics.X_cell_end + this.Pages[curColumn].X,
							Color : "Grey",
							Bold  : true
						};

						borders.push(Hline);
					}
					
				}
				else 
				{
					var Hline = 
					{
						Y1 : Y1,
						Y2 : Y1,
						X1 : this.GetRow(RowNumb[0]).Get_Cell(CellsNumb[0]).Metrics.X_cell_start + this.Pages[curColumn].X,
						X2 : this.GetRow(RowNumb[0]).Get_Cell(CellsNumb[CellsNumb.length - 1]).Metrics.X_cell_end + this.Pages[curColumn].X,
						Color : "Grey",
						Bold  : false
					};

					borders.push(Hline);
				}
				
			}
			else if (Math.abs(X2_origin - X1_origin) < (this.GetRow(RowNumb[0]).Get_Cell(CellsNumb[0]).Metrics.X_cell_end - this.GetRow(RowNumb[0]).Get_Cell(CellsNumb[0]).Metrics.X_cell_start)/2)
			{
				if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] - Y1) < 2)
				{
					var Row 	  = this.GetRow(RowNumb[0]);
					var startCell = Row.Get_Cell(CellsNumb[0]);
					var endCell   = Row.Get_Cell(CellsNumb[CellsNumb.length - 1]);

					if (startCell.GetVMerge() === 2)
					{
						var Hline = 
						{
							Y1 : this.RowsInfo[RowNumb[0]].Y[curColumn],
							Y2 : this.RowsInfo[RowNumb[0]].Y[curColumn],
							X1 : startCell.Metrics.X_cell_start + this.Pages[curColumn].X,
							X2 : endCell.Metrics.X_cell_end + this.Pages[curColumn].X,
							Color : "Grey",
							Bold  : false
						};

						borders.push(Hline);
					}
					else 
					{
						var Hline = 
						{
							Y1 : this.RowsInfo[RowNumb[0]].Y[curColumn],
							Y2 : this.RowsInfo[RowNumb[0]].Y[curColumn],
							X1 : startCell.Metrics.X_cell_start + this.Pages[curColumn].X,
							X2 : endCell.Metrics.X_cell_end + this.Pages[curColumn].X,
							Color : "Grey",
							Bold  : true
						};

						borders.push(Hline);
					}
					
				}
				else if (Math.abs(this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn] - Y1) < 2)
				{
					
					var Row 	  = this.GetRow(RowNumb[0]);
					var startCell = Row.Get_Cell(CellsNumb[0]);
					var endCell   = Row.Get_Cell(CellsNumb[CellsNumb.length - 1]);
					
					var Grid_start   = Row.Get_CellInfo(startCell.Index).StartGridCol;
					var Grid_span    = startCell.Get_GridSpan();
					var VMerge_count = this.Internal_GetVertMergeCount(Row.Index, Grid_start, Grid_span);

					if (VMerge_count > 1)
					{
						var Hline = 
						{
							Y1 : this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn],
							Y2 : this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn],
							X1 : startCell.Metrics.X_cell_start + this.Pages[curColumn].X,
							X2 : endCell.Metrics.X_cell_end + this.Pages[curColumn].X,
							Color : "Grey",
							Bold  : false
						};

						borders.push(Hline);
					}
					else 
					{
						var Hline = 
						{
							Y1 : this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn],
							Y2 : this.RowsInfo[RowNumb[0]].Y[curColumn] + this.RowsInfo[RowNumb[0]].H[curColumn],
							X1 : startCell.Metrics.X_cell_start + this.Pages[curColumn].X,
							X2 : endCell.Metrics.X_cell_end + this.Pages[curColumn].X,
							Color : "Grey",
							Bold  : true
						};

						borders.push(Hline);
					}
				}
				else 
				{
					var Hline = 
					{
						Y1 : Y1,
						Y2 : Y2,
						X1 : X1_origin,
						X2 : X2_origin,
						Color : "Red",
						Bold  : false
					};

					borders.push(Hline);
				}
			}
			
			return borders;
		}
		else 
		{
			var Cell_pos = this.Internal_GetCellByXY(X1 + this.Pages[curColumn].X, Y1, curColumn);

			var Row              = this.GetRow(Cell_pos.Row);
			var Cell         	 = Row.Get_Cell(Cell_pos.Cell);  //текущая ячейка
			
			var X_start      = Row.CellsInfo[Cell_pos.Cell].X_cell_start;
            var X_end        = Row.CellsInfo[Cell_pos.Cell].X_cell_end;
			var Cell_width   = X_end - X_start;

			var Grid_start   = Row.Get_CellInfo(Cell_pos.Cell).StartGridCol;
            var Grid_span    = Cell.Get_GridSpan();
            var VMerge_count = this.Internal_GetVertMergeCount(Cell_pos.Row, Grid_start, Grid_span);
            var rowHSum      = 0;

            var CellSpacing  = Row.Get_CellSpacing();
            
            var CellMar = Cell.GetMargins();
            var MinW 	= CellSpacing + CellMar.Right.W + CellMar.Left.W;

            if (VMerge_count >= 1)
            {
                for (Index = Cell_pos.Row; Index < Cell_pos.Row + VMerge_count; Index++)
                {
                    rowHSum += this.RowsInfo[Index].H[curColumn]
                }
			}
			
			// Если рисуемая ячейка соответствует минимальным размерам и не выходит за границы ячейки, в котором рисуем, тогда отрисовываем контуры новой ячейки
			if (Cell_width >= MinW * 1.5 && X2 - X1 > MinW * 1.5 && rowHSum >= 4.63864881727431 * 1.5 && Math.abs(Y2 - Y1) >= 4.63864881727431 * 1.5 && !(X2 > X_end || Y2 < this.RowsInfo[Cell_pos.Row].Y[curColumn] || Y2 > this.RowsInfo[Cell_pos.Row].Y[curColumn] + rowHSum))
			{
				var tLine = 
				{
					X1 : X1_origin, 
					X2 : X2_origin,
					Y1 : Y1,
					Y2 : Y1,
					Color : "Grey",
					Bold : false
				};

				var lLine = 
				{
					X1 : X1_origin, 
					X2 : X1_origin,
					Y1 : Y1,
					Y2 : Y2,
					Color : "Grey",
					Bold : false
				};
				
				var rLine = 
				{
					X1 : X2_origin, 
					X2 : X2_origin,
					Y1 : Y1,
					Y2 : Y2,
					Color : "Grey",
					Bold : false
				};

				var bLine = 
				{
					X1 : X1_origin, 
					X2 : X2_origin,
					Y1 : Y2,
					Y2 : Y2,
					Color : "Grey",
					Bold : false
				};

				borders.push(tLine, lLine, rLine, bLine);
			}
			else 
			{
				var Line = 
				{
					X1 : X1_origin,
					X2 : X2_origin,
					Y1 : Y1,
					Y2 : Y2,
					Color : "Red", 
					Bold  : false
				};

				borders.push(Line);
			}

			return borders;
		}
	}
	else if (drawMode === false)
	{
		if (X1 > X2)
		{
			var cache; 
			cache = X2;
			X2 = X1;
			X1 = cache;
		}

		if (Y1 > Y2) 
		{
			var cache;
			cache = Y2;
			Y2 = Y1;
			Y1 = cache;
		}

		var Rows 	  	    = []; // Строки попавшие под линию удаления(объединения)
		var Borders	 	    = [];
		this.Selection.Data = [];
		var SizeOfIndent	= this.Pages[0].X;

		SizeOfIndent += (this.Pages[curColumn].X - this.Pages[curColumn].X - (this.Pages[0].X - this.Pages[curColumn].X));

		for (var curRow = this.Pages[curColumn].FirstRow; curRow <= this.Pages[curColumn].LastRow; curRow++) 
		{
			if (Y1 <= this.RowsInfo[this.Pages[curColumn].FirstRow].Y[curColumn] && this.RowsInfo[curRow].Y[curColumn] <= Y2)
				Rows.push(curRow);
			else if (this.RowsInfo[curRow].Y[curColumn] <= Y1 && Y1 < this.RowsInfo[curRow].Y[curColumn] + this.RowsInfo[curRow].H[curColumn]) 
				Rows.push(curRow);
			else if (Rows.length === 0)
				continue;
			else if (this.RowsInfo[curRow].Y[curColumn] <= Y2)
				Rows.push(curRow);
		}

		// Далее мы определяем, какие ячейки в строках(попавших под выделение) попадают под выделение
		// и заполняем this.Selection.Data
		for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
		{
			var check_first = false; // была ли определена первая ячейка, попавшая под выделение
			for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
			{
				// Проверка строки на наличие в массиве Rows 
				if (Rows.indexOf(curRow) != -1)
				{
					var Cell 		 = this.GetRow(curRow).Get_Cell(curCell);
					var Row 	   	 = this.GetRow(curRow);
					var Grid_start   = Row.Get_CellInfo(curCell).StartGridCol;
					var Grid_span    = Cell.Get_GridSpan();
					var VMerge_count = this.Internal_GetVertMergeCount(curRow, Grid_start, Grid_span);
					
					if (X1 < this.GetRow(curRow).CellsInfo[0].X_cell_start && X2 > this.GetRow(curRow).CellsInfo[curCell].X_cell_start)
					{
						var check = false;
						for (var curRow2 = curRow; curRow2 >= 0; curRow2--)
						{
							if (check)
								break;
							for (var curCell2 = 0; curCell2 < this.GetRow(curRow2).Get_CellsCount(); curCell2++)
							{
								var TempRow			  = this.GetRow(curRow2);
								var TempCell 		  = TempRow.Get_Cell(curCell2);
								
								var Temp_Grid_start   = TempRow.Get_CellInfo(curCell2).StartGridCol;
								var Temp_Grid_span    = TempCell.Get_GridSpan();
								var Temp_VMerge_count = this.Internal_GetVertMergeCount(curRow2, Temp_Grid_start, Temp_Grid_span);
								var rowHsum = 0;

								if (Temp_VMerge_count >= 1)
								{
									for (Index = curRow2; Index < curRow2 + Temp_VMerge_count; Index++)
									{
										rowHsum += this.RowsInfo[Index].H[curColumn]
									}
								}
								if (Grid_start === Temp_Grid_start)
								{
									if (TempCell.GetVMerge() === 1)
									{
										var cell_pos = 
										{
											Cell : curCell2,
											Row  : curRow2,
										}
										
										for (var Index = 0; Index < this.Selection.Data.length; Index++)
										{
											if (cell_pos.Row === this.Selection.Data[Index].Row && cell_pos.Cell === this.Selection.Data[Index].Cell)
											{
												check = true;
												break;
											}
										}
										if (check)
											break;

										this.Selection.Data.push(cell_pos);

										if (X1 <= TempCell.Metrics.X_cell_start)
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Color : "Red",
												Bold  : false
											};

											Borders.push(Line);
										}
										if (X2 >= TempCell.Metrics.X_cell_end)
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Color : "Red",
												Bold  : false
											};

											Borders.push(Line);
										}
										if (Y1 <= this.RowsInfo[TempCell.Row.Index].Y[curColumn]  && Y2 > this.RowsInfo[TempCell.Row.Index].Y[curColumn] )
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Color : "Red",
												Bold  : false
											};

											Borders.push(Line);
										}
										if (Y2 >= this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum && Y1 < this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum)
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Color : "Red",
												Bold  : false
											};

											Borders.push(Line);
										}
											
										check = true;
									}
								}
							}
						}
					}
					// Ищем первую в строке ячейку попавшую под выделение
					else if (this.GetRow(curRow).CellsInfo[curCell].X_cell_start < X1 && X1 < this.GetRow(curRow).CellsInfo[curCell].X_cell_end)
					{
						for (var curRow2 = curRow; curRow2 >= 0; curRow2--)
						{
							if (check_first)
								break;

							for (var curCell2 = 0; curCell2 < this.GetRow(curRow2).Get_CellsCount(); curCell2++)
							{
								var TempRow 		  = this.GetRow(curRow2);
								var TempCell 		  = TempRow.Get_Cell(curCell2);
								var Temp_Grid_start   = TempRow.Get_CellInfo(curCell2).StartGridCol;
								var Temp_Grid_span    = TempCell.Get_GridSpan();
								var Temp_VMerge_count = this.Internal_GetVertMergeCount(curRow2, Temp_Grid_start, Temp_Grid_span);
								var rowHsum = 0;

								if (Temp_VMerge_count >= 1)
								{
									for (Index = curRow2; Index < curRow2 + Temp_VMerge_count; Index++)
									{
										rowHsum += this.RowsInfo[Index].H[curColumn]
									}
								}

								if (Grid_start === Temp_Grid_start)
								{
									if (TempCell.GetVMerge() === 1)
									{
										var cell_pos = 
										{
											Cell : curCell2,
											Row  : curRow2,
										}
										for (var Index = 0; Index < this.Selection.Data.length; Index++)
										{
											if (cell_pos.Row === this.Selection.Data[Index].Row && cell_pos.Cell === this.Selection.Data[Index].Cell)
											{
												check_first = true;
												break;
											}

										}
										if (check_first)
											break;
										//this.Selection.Data.push(cell_pos);

										if (X1 <= TempCell.Metrics.X_cell_start)
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Color : "Red",
												Bold  : false
											};
											Borders.push(Line);
										}
										if (X2 >= TempCell.Metrics.X_cell_end)
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Color : "Red",
												Bold  : false
											};
											Borders.push(Line);
										}
										if (Y1 <= this.RowsInfo[TempCell.Row.Index].Y[curColumn] && Y2 > this.RowsInfo[TempCell.Row.Index].Y[curColumn])
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Color : "Red",
												Bold  : false
											};
											Borders.push(Line);
										}
										if (Y2 >= this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum && Y1 < this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum)
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Color : "Red",
												Bold  : false
											};
											Borders.push(Line);
										}
										check_first = true;
										break;
									}
								}
							}
						}
					}
					else if (!check_first)
						continue;
					else if (this.GetRow(curRow).CellsInfo[curCell].X_cell_start < X2)
					{
						var check = false;
						for (var curRow2 = curRow; curRow2 >= 0; curRow2--)
						{
							if (check)
								break;
							for (var curCell2 = 0; curCell2 < this.GetRow(curRow2).Get_CellsCount(); curCell2++)
							{
								var TempRow			  = this.GetRow(curRow2);
								var TempCell 		  = TempRow.Get_Cell(curCell2);
								var Temp_Grid_start   = TempRow.Get_CellInfo(curCell2).StartGridCol;
								var Temp_Grid_span    = TempCell.Get_GridSpan();
								var Temp_VMerge_count = this.Internal_GetVertMergeCount(curRow2, Temp_Grid_start, Temp_Grid_span);
								var rowHsum = 0;

								if (Temp_VMerge_count >= 1){
									for (Index = curRow2; Index < curRow2 + Temp_VMerge_count; Index++){
										rowHsum += this.RowsInfo[Index].H[curColumn]
									}
								}
								if (Grid_start === Temp_Grid_start)
								{
									if (TempCell. GetVMerge() === 1)
									{
										var cell_pos = 
										{
											Cell : curCell2,
											Row  : curRow2,
										}
										for (var Index = 0; Index < this.Selection.Data.length; Index++)
										{
											if (cell_pos.Row === this.Selection.Data[Index].Row && cell_pos.Cell === this.Selection.Data[Index].Cell)
											{
												check = true;
												break;
											}
										}

										if (check)
											break;

										this.Selection.Data.push(cell_pos);

										if (X2 >= TempCell.Metrics.X_cell_end)
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Color : "Red",
												Bold  : false
											};
											Borders.push(Line);
										}
										if (Y1 <= this.RowsInfo[TempCell.Row.Index].Y[curColumn] && Y2 > this.RowsInfo[TempCell.Row.Index].Y[curColumn])
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn],
												Color : "Red",
												Bold  : false
											};
											Borders.push(Line);
										}
										if (Y2 >= this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum && Y1 < this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum)
										{
											var Line = 
											{
												X1 : TempCell.Metrics.X_cell_start + SizeOfIndent,
												X2 : TempCell.Metrics.X_cell_end + SizeOfIndent,
												Y1 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Y2 : this.RowsInfo[TempCell.Row.Index].Y[curColumn] + rowHsum,
												Color : "Red",
												Bold  : false
											};
											Borders.push(Line);
										}
										check = true;
									}
								}
							}
						}
					}
				}
				else 	
					break;
			}
		}

		// Удаление одинаковых линий
		for (var Index1 = 0; Index1 <= Borders.length - 1; Index1++)
		{
			for (var Index2 = Index1 + 1; Index2 < Borders.length; Index2++)
			{
				if (Borders[Index1].X1 == Borders[Index2].X1)
				{
					if (Borders[Index1].X2 == Borders[Index2].X2)
					{
						if (Borders[Index1].Y1 == Borders[Index2].Y1)
						{
							if (Borders[Index1].Y2 == Borders[Index2].Y2)
							{
								Borders.splice(Index2, 1);
								Index2--;
							}
						}
					}
				}
			}
		}

		return Borders;
	}
};
/**
 * Get cells whose borders were clicked, as well as the type of these borders
 * @param {number} X - coordinate
 * @param {number} Y - coordinate
 * @param {number} curColumn - page number of clicked page
 * @param {boolean} drawMode - pencil or eraser
 * @return {object} - an object containing cells whose borders were clicked, as well as the type of these borders
 */
CTable.prototype.GetCellAndBorderByClick = function(X, Y, curColumn, drawMode)
{
	var X1 = X;
	var Y1 = Y;
	// Проверка, была ли выбрана граница (для случая, когда щелкаем по границе); 
	// Проверка, были ли выбраны начало и конец выделения
	// *Необходимо для случаев, когда у ячейки VMerge_count > 1*
	var isSelected = false; // Для щелчка по границе
	var isVSelect  = false;  // Была ли выбрана вертикальная граница
	var isHSelect  = false;   // Была ли выбрана горизонтальная граница

	var isRightBorder  = false; 
	var isLeftBorder   = false; 
	var isTopBorder    = false;
	var isBottomBorder = false;

	var two_cells = false;

	var SelectedCells = {
		Cells : [],
		isVSelect : false,
		isHSelect : false,
		isRightBorder : false,
		isLeftBorder  : false,
		isTopBorder   : false,
		isBottomBorder : false
	};
	// Начинаем поиск границы по которой произведен щелчок
	for (var curRow = this.Pages[curColumn].FirstRow; curRow <= this.Pages[curColumn].LastRow; curRow++)
	{
		// Если граница уже выбрана, смысла искать больше нет
		if (isSelected)
			break;

		for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
		{
			if (isSelected)
				break;

			var Row 		 = this.GetRow(curRow);
			var Cell         = Row.Get_Cell(curCell);
			var Grid_start   = Row.Get_CellInfo(curCell).StartGridCol;
			var Grid_span    = Cell.Get_GridSpan();
			var VMerge_count = this.Internal_GetVertMergeCount(curRow, Grid_start, Grid_span);
			var rowHSum      = 0; // Высота строки

			// Считаем rowHSum с учетом VMerge_count
			if (VMerge_count >= 1)
			{
				for (Index = curRow; Index < curRow + VMerge_count; Index++)
				{
					rowHSum += this.RowsInfo[Index].H[curColumn]
				}
			}
			
			// Идем по строке и проверяем в границу какой ячейки попадаем ластиком 
			if (this.RowsInfo[curRow].Y[curColumn] < Y1 && Y1 < this.RowsInfo[curRow].Y[curColumn] + rowHSum) 
			{
				// Проверка на попадание в окрестность вертикальной границы
				// для внутреннего содержания таблицы
				if (Math.abs(X1 - this.GetRow(curRow).CellsInfo[curCell].X_cell_end) < 1.5)
				{
					// Должна быть выбрана только одна граница
					if (isSelected === false)
					{
						// Две позиции ячеек (слева от границы и справа от границы)
						var cell_pos1 = 
						{
							Cell: curCell,
							Row : curRow
						};

						var cell_pos2 = 
						{
							Cell: null,
							Row : null
						};
						
						// Была ли выбрана ячейка справа от границы
						var isSelected_second = false;
						if (!isSelected_second)
						{
							
							
							var Grid_start_second = Grid_start + Grid_span;

							// Поиск второй ячейки 
							for (var curRow2 = this.Pages[curColumn].FirstRow; curRow2 <= this.Pages[curColumn].LastRow; curRow2++)
							{
								for (var curCell2 = 0; curCell2 < this.GetRow(curRow2).Get_CellsCount(); curCell2++)
								{
									if(isSelected)
										break;
									
									var TempRow 		= this.GetRow(curRow2);
									var Temp_Grid_start = TempRow.Get_CellInfo(curCell2).StartGridCol;
									var TempCell 		= TempRow.Get_Cell(curCell2);

									if (Temp_Grid_start != Grid_start_second)
										continue;

									var Temp_Grid_span      = TempCell.Get_GridSpan();
									var VMerge_count_second = this.Internal_GetVertMergeCount(curRow2, Temp_Grid_start, Temp_Grid_span);
									var rowHSum_second 		= 0;

									// Считаем rowHSum с учетом VMerge_count_second
									if (VMerge_count_second >= 1)
									{
										for (var Index2 = curRow2; Index2 < curRow2 + VMerge_count_second; Index2++)
										{
											rowHSum_second += this.RowsInfo[Index2].H[curColumn]
										}
									}

									if (this.RowsInfo[curRow2].Y[curColumn] < Y1 && Y1 < this.RowsInfo[curRow2].Y[curColumn] + rowHSum_second)
									{
										for (var Row2 = curRow2; Row2 >= 0; Row2-- )
										{
											if (isSelected_second)
												break;
											for (var curCell2 = 0; curCell2 < this.GetRow(Row2).Get_CellsCount(); curCell2++)
											{
												var TempRow  		= this.GetRow(Row2);
												var TempCell 		= TempRow.Get_Cell(curCell2);
												var Temp_Grid_start = TempRow.Get_CellInfo(curCell2).StartGridCol;

												if (Temp_Grid_start === Grid_start_second)
												{
													if (TempCell.GetVMerge() === 1)
													{
														cell_pos2 = 
														{
															Cell: curCell2,
															Row : Row2
														};
														isSelected_second = true;
														two_cells = true;
														break;
													}
												}
											}
										}
									}
								}
							}
						}

						// Т.к. граница выбрана меняем на true
						isSelected = true;
						isVSelect  = true;

						// Добавление в "выделенные ячейки" 
						if (two_cells)
						{
							SelectedCells.Cells.push(cell_pos1, cell_pos2);
						}
						else 
						{
							SelectedCells.Cells.push(cell_pos1);
							isRightBorder = true;
						}
						
						SelectedCells.isVSelect = isVSelect;
						SelectedCells.isHSelect = isHSelect;
						SelectedCells.isTopBorder = isTopBorder;
						SelectedCells.isBottomBorder = isBottomBorder;
						SelectedCells.isLeftBorder = isLeftBorder;
						SelectedCells.isRightBorder = isRightBorder;

						// Пропускаем следующую ячейку, т.к. она уже добавлена в выделенные 
						curCell++;
					}
					
					
				}
				// Для верхних горизонтальных границ
				else if (Math.abs(Y1 - this.RowsInfo[curRow].Y[curColumn]) < 1.5)
				{
					if (isSelected === false)
					{
						for (var Index = 0; Index < this.GetRow(curRow).Get_CellsCount(); Index++)
						{
							if (this.GetRow(curRow).CellsInfo[Index].X_cell_start < X1  &&  X1 < this.GetRow(curRow).CellsInfo[Index].X_cell_end)
							{
								if (Cell.GetVMerge() === 2)
									return;

								var cell_pos = 
								{
									Cell: Index,
									Row : curRow
								};
								
								isSelected  = true;
								isHSelect   = true;
								isTopBorder = true;

								SelectedCells.Cells.push(cell_pos);

								SelectedCells.isVSelect      = isVSelect;
								SelectedCells.isHSelect	     = isHSelect;
								SelectedCells.isTopBorder    = isTopBorder;
								SelectedCells.isBottomBorder = isBottomBorder;
								SelectedCells.isLeftBorder   = isLeftBorder;
								SelectedCells.isRightBorder  = isRightBorder;
								break;
							}
						}								
					}
				}
				
				// для внешних границ слева
				else if (Math.abs(X1 - this.GetRow(curRow).CellsInfo[curCell].X_cell_start) < 1.5 && curCell === 0)
				{
					// Должна быть выбрана только одна граница
					if (isSelected === false)
					{
						// Позициями ячейки 
						var cell_pos = 
						{
							Cell: curCell,
							Row : curRow
						};

						// Т.к. граница выбрана меняем на true
						isSelected    = true;
						isVSelect     = true;
						isLeftBorder  = true;


						SelectedCells.Cells.push(cell_pos);

						SelectedCells.isVSelect 	 = isVSelect;
						SelectedCells.isHSelect 	 = isHSelect;
						SelectedCells.isTopBorder 	 = isTopBorder;
						SelectedCells.isBottomBorder = isBottomBorder;
						SelectedCells.isLeftBorder 	 = isLeftBorder;
						SelectedCells.isRightBorder  = isRightBorder;
						// Пропускаем следующую ячейку, т.к. она уже добавлена в выделенные 
						break;
					}
				}
				// Проверка на попадание в окрестность горизонтальной границы
				// для внутреннего содержимого таблицы
				else if (Math.abs(Y1 - (this.RowsInfo[curRow].Y[curColumn] + rowHSum)) < 1.5)
				{
					if (drawMode)
					{
						if (curRow != this.Get_RowsCount() - 1)
						{
							if (isSelected === false)
							{
								// Если строка текущей ячейки не последняя, но ячейка имеет вертикальное объединение
								// до последней строки включительно, добавляем в Selection.Data
								if (curRow + VMerge_count - 1 === this.Get_RowsCount() - 1)
								{
									var cell_pos = 
									{
										Cell: curCell,
										Row : curRow + VMerge_count - 1
									};
									
									if (Cell.GetVMerge() === 2)
										return;
									
									isSelected  = true;
									isHSelect   = true;
									isBottomBorder = true;

									SelectedCells.Cells.push(cell_pos);

									SelectedCells.isVSelect 	 = isVSelect;
									SelectedCells.isHSelect 	 = isHSelect;
									SelectedCells.isTopBorder 	 = isTopBorder;
									SelectedCells.isBottomBorder = isBottomBorder;
									SelectedCells.isLeftBorder   = isLeftBorder;
									SelectedCells.isRightBorder  = isRightBorder;

									break;

								}

								if (Cell.GetVMerge() === 2)
									return;

								var cell_pos1 = 
								{
									Cell: curCell,
									Row : curRow
								};

								var cell_pos2 = 
								{
									Cell : null,
									Row :  null
								};

								if (curRow + VMerge_count <= this.Pages[curColumn].LastRow)
								{
									for (Index = 0; Index < this.GetRow(curRow + VMerge_count).Get_CellsCount(); Index++)
									{
										if (this.GetRow(curRow + VMerge_count).CellsInfo[Index].X_cell_start < X1  &&  X1 < this.GetRow(curRow + VMerge_count).CellsInfo[Index].X_cell_end)
										{
											cell_pos2 = 
											{
												Cell: Index,
												Row : curRow + VMerge_count
											};
											two_cells = true;
										}
									}
								}
								
								isSelected = true;
								isHSelect  = true;

								if (two_cells)
								{
									SelectedCells.Cells.push(cell_pos1, cell_pos2);
								}
								else 
								{
									SelectedCells.Cells.push(cell_pos1);
								}
								
								SelectedCells.isVSelect 	 = isVSelect;
								SelectedCells.isHSelect 	 = isHSelect;
								SelectedCells.isTopBorder	 = isTopBorder;
								SelectedCells.isBottomBorder = isBottomBorder;
								SelectedCells.isLeftBorder 	 = isLeftBorder;
								SelectedCells.isRightBorder  = isRightBorder;

								curRow++;
							}
						}
						// для нижней внешней границы
						else 
						{
							if (isSelected === false)
							{
								var cell_pos = 
								{
									Cell: curCell,
									Row : curRow
								};
								
								isSelected  = true;
								isHSelect   = true;
								isBottomBorder = true;

								SelectedCells.Cells.push(cell_pos);

								SelectedCells.isVSelect		 = isVSelect;
								SelectedCells.isHSelect 	 = isHSelect;
								SelectedCells.isTopBorder 	 = isTopBorder;
								SelectedCells.isBottomBorder = isBottomBorder;
								SelectedCells.isLeftBorder 	 = isLeftBorder;
								SelectedCells.isRightBorder  = isRightBorder;
							}
						}
					}
					
				}
			}
			// Идем по столбцу и проверяем в границу какой ячейки попадаем ластиком
			else if (this.GetRow(curRow).CellsInfo[curCell].X_cell_start < X1  &&  X1 < this.GetRow(curRow).CellsInfo[curCell].X_cell_end)
			{
				if (drawMode)
				{
					// Для верхних горизонтальных границ
					if (Math.abs(Y1 - this.RowsInfo[curRow].Y[curColumn]) < 1.5)
					{
						if (isSelected === false)
						{
							for (var Index = 0; Index < this.GetRow(curRow).Get_CellsCount(); Index++)
							{
								if (this.GetRow(curRow).CellsInfo[Index].X_cell_start < X1  &&  X1 < this.GetRow(curRow).CellsInfo[Index].X_cell_end)
								{
									if (Cell.GetVMerge() === 2)
										return;

									var cell_pos = 
									{
										Cell: Index,
										Row : curRow
									};
									
									isSelected  = true;
									isHSelect   = true;
									isTopBorder = true;

									SelectedCells.Cells.push(cell_pos);

									SelectedCells.isVSelect 	 = isVSelect;
									SelectedCells.isHSelect 	 = isHSelect;
									SelectedCells.isTopBorder	 = isTopBorder;
									SelectedCells.isBottomBorder = isBottomBorder;
									SelectedCells.isLeftBorder 	 = isLeftBorder;
									SelectedCells.isRightBorder  = isRightBorder;

									break;
								}
							}								
						}
					}
				}
				
				// Проверка на попадание в окрестность горизонтальной границы
				// для внутреннего содержимого таблицы
				if (Math.abs(Y1 - (this.RowsInfo[curRow].Y[curColumn] + rowHSum)) < 1.5)
				{
					if (curRow != this.Get_RowsCount() - 1)
					{
						if (isSelected === false)
						{
							// Если строка текущей ячейки не последняя, но ячейка имеет вертикальное объединение
							// до последней строки включительно, добавляем в Selection.Data
							if (curRow + VMerge_count - 1 === this.Get_RowsCount() - 1)
							{
								var ViewRow = this.GetRow(curRow + VMerge_count - 1);

								for (var Index = 0; Index < ViewRow.GetCellsCount(); Index++)
								{
									var View_Grid_start = ViewRow.Get_CellInfo(Index).StartGridCol;

									if (Grid_start === View_Grid_start)
									{
										var cell_pos = 
										{
											Cell: Index,
											Row : curRow + VMerge_count - 1
										};
									}
								}
								
								if (Cell.GetVMerge() === 2)
									return;
								
								
								isSelected  = true;
								isHSelect   = true;
								isBottomBorder = true;

								SelectedCells.Cells.push(cell_pos);

								SelectedCells.isVSelect 	 = isVSelect;
								SelectedCells.isHSelect 	 = isHSelect;
								SelectedCells.isTopBorder	 = isTopBorder;
								SelectedCells.isBottomBorder = isBottomBorder;
								SelectedCells.isLeftBorder   = isLeftBorder;
								SelectedCells.isRightBorder  = isRightBorder;

								break;
							}

							if (Cell.GetVMerge() === 2)
								return;

							var cell_pos1 = 
							{
								Cell: curCell,
								Row : curRow
							};

							var cell_pos2 = 
							{
								Cell : null,
								Row :  null
							};

							if (curRow + VMerge_count <= this.Pages[curColumn].LastRow)
								for (Index = 0; Index < this.GetRow(curRow + VMerge_count).Get_CellsCount(); Index++)
								{
									if (this.GetRow(curRow + VMerge_count).CellsInfo[Index].X_cell_start < X1  &&  X1 < this.GetRow(curRow + VMerge_count).CellsInfo[Index].X_cell_end)
									{
										cell_pos2 = 
										{
											Cell: Index,
											Row : curRow + VMerge_count
										};
										two_cells = true;
									}
								}
							
							isSelected = true;
							isHSelect  = true;

							if (two_cells)
							{
								SelectedCells.Cells.push(cell_pos1, cell_pos2);
							}
							else 
							{
								SelectedCells.Cells.push(cell_pos1);
								isBottomBorder = true;
							}
							
							SelectedCells.isVSelect 	 = isVSelect;
							SelectedCells.isHSelect 	 = isHSelect;
							SelectedCells.isTopBorder	 = isTopBorder;
							SelectedCells.isBottomBorder = isBottomBorder;
							SelectedCells.isLeftBorder	 = isLeftBorder;
							SelectedCells.isRightBorder  = isRightBorder;

							curRow++;
						}
					}
					// для нижней внешней границы
					else 
					{
						if (isSelected === false)
						{
							var cell_pos = 
							{
								Cell: curCell,
								Row : curRow
							};
							
							isSelected  = true;
							isHSelect   = true;
							isBottomBorder = true;

							SelectedCells.Cells.push(cell_pos);
							
							SelectedCells.isVSelect 	 = isVSelect;
							SelectedCells.isHSelect 	 = isHSelect;
							SelectedCells.isTopBorder 	 = isTopBorder;
							SelectedCells.isBottomBorder = isBottomBorder;
							SelectedCells.isLeftBorder   = isLeftBorder;
							SelectedCells.isRightBorder  = isRightBorder;
						}
					}
				}
			}
		}
	}
	
	return SelectedCells;
};
/**
 * Get cells whose borders were clicked, as well as the type of these borders
 * @param {number} X1 - coordinate
 * @param {number} Y1 - coordinate
 * @param {number} curColumn - page number of clicked page
 * @param {boolean} typeOfDrawing - type of drawing
 * @return {Array} - Array of affected rows
 */
CTable.prototype.GetAffectedRows = function(X1, Y1, X2, Y2, curColumn, typeOfDrawing)
{
	// Если typeOfDrawing равен
	// 0: Рисование вертикальных линий
	// 1: Рисование горизонтальных линий
	// 2: Ластик

	var Rows = [];

	if (typeOfDrawing === 0)
	{
		// заполняем массив Rows строками, которые попали под режущую линии 
		for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++) 
		{
			for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++) 
			{
				var Row 		 = this.GetRow(curRow);
				var Cell 		 = Row.Get_Cell(curCell);
				var Grid_start   = Row.Get_CellInfo(curCell).StartGridCol;
				var Grid_span    = Cell.Get_GridSpan();
				var VMerge_count = this.Internal_GetVertMergeCount(curRow, Grid_start, Grid_span);
				var rowHSum		 = 0; //высота строки

				if (VMerge_count >= 1)
				{
					for (var Index = curRow; Index < curRow + VMerge_count; Index++)
					{
						rowHSum += this.RowsInfo[Index].H[curColumn]
					}
				}
				
				if ((X1 >= this.GetRow(curRow).CellsInfo[curCell].X_cell_start) && (X2 <= this.GetRow(curRow).CellsInfo[curCell].X_cell_end)) 
				{
					if (this.RowsInfo[curRow].Y[curColumn] <= Y1 && Y1 < this.RowsInfo[curRow].Y[curColumn] + rowHSum) 
					{
						if (VMerge_count > 1)
						{
							for (Index = curRow; Index < curRow + VMerge_count; Index++)
							{
								Rows.push(Index);
							}

							curRow += VMerge_count - 1;
							break;
						}
						else
						{
							Rows.push(curRow);
						}
							
					}
					else if (Rows.length === 0)
					{
						continue;
					}
					else if (this.RowsInfo[curRow].Y[curColumn] <= Y2)
					{
						if (VMerge_count > 1)
						{
							for (Index = curRow; Index < curRow + VMerge_count; Index++)
							{
								Rows.push(Index);
							}

							curRow += VMerge_count - 1;
							break;
						}
						else 
						{
							Rows.push(curRow);
						}
					}
				}
			}
		}
		return Rows;
	}
	else if (typeOfDrawing === 1)
	{
		// Вычисление Row
		for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
		{
			if (Y1 > this.RowsInfo[curRow].Y[curColumn] && Y1 < (this.RowsInfo[curRow].Y[curColumn] + this.RowsInfo[curRow].H[curColumn]))
			{
				Rows.push(curRow);
				break;
			}
		}
		return Rows;
	}
	else if (typeOfDrawing === 2)
	{
		// Заполняем массив Rows строками, которые попали под выделение 
		for (var curRow = this.Pages[curColumn].FirstRow; curRow <= this.Pages[curColumn].LastRow; curRow++) 
		{
			if (Y1 <= this.RowsInfo[this.Pages[curColumn].FirstRow].Y[curColumn] && this.RowsInfo[curRow].Y[curColumn] <= Y2)
				Rows.push(curRow);
			else if (this.RowsInfo[curRow].Y[curColumn] <= Y1 && Y1 < this.RowsInfo[curRow].Y[curColumn] + this.RowsInfo[curRow].H[curColumn]) 
				Rows.push(curRow);
			else if (Rows.length === 0)
				continue;
			else if (this.RowsInfo[curRow].Y[curColumn] <= Y2)
				Rows.push(curRow);
		}
		return Rows;
	}
};
/**
 * Get an array of cells that fall under the selection.
 * @param {number} X1 - coordinate
 * @param {number} Y1 - coordinate
 * @param {number} curColumn - page number of clicked page
 * @return {Array} - cells array
 */
CTable.prototype.GetCellsByRect = function(X1, Y1, X2, Y2, curColumn)
{
	// Если выделение справа налево
	if (X1 > X2) 
	{
		var cache;
		cache = X2;
		X2    = X1;
		X1    = cache;
	}
	// Если выделение снизу вверх
	if (Y1 > Y2) 
	{
		var cache;
		cache = Y2;
		Y2    = Y1;
		Y1    = cache;
	}

	var Rows = this.GetAffectedRows(X1, Y1, X2, Y2, curColumn, 2);
	var SelectionData = [];

	if (Rows.length === 0)
		return SelectionData;
	
	// Далее мы определяем, какие ячейки в строках(попавших под выделение) попадают под выделение
	// и заполняем SelectionData
	for (var curRow = 0; curRow < this.Get_RowsCount(); curRow++)
	{
		var check_first = false; // была ли определена первая ячейка, попавшая под выделение
		for (var curCell = 0; curCell < this.GetRow(curRow).Get_CellsCount(); curCell++)
		{
			// Проверка строки на наличие в массиве Rows 
			if (Rows.indexOf(curRow) != -1)
			{
				var Row 	   	 = this.GetRow(curRow);
				var Cell 		 = Row.Get_Cell(curCell);
				var Grid_start   = Row.Get_CellInfo(curCell).StartGridCol;
				var Grid_span    = Cell.Get_GridSpan();
				var VMerge_count = this.Internal_GetVertMergeCount(curRow, Grid_start, Grid_span);
				
				if (X1 < this.GetRow(curRow).CellsInfo[0].X_cell_start && X2 > this.GetRow(curRow).CellsInfo[curCell].X_cell_start)
				{
					var check = false;
					for (var curRow2 = curRow; curRow2 >= 0; curRow2--)
					{
						if (check)
							break;

						for (var curCell2 = 0; curCell2 < this.GetRow(curRow2).Get_CellsCount(); curCell2++)
						{
							var TempRow			  = this.GetRow(curRow2);
							var TempCell 		  = TempRow.Get_Cell(curCell2);
							var Temp_Grid_start   = TempRow.Get_CellInfo(curCell2).StartGridCol;
							var Temp_Grid_span    = TempCell.Get_GridSpan();
							var Temp_VMerge_count = this.Internal_GetVertMergeCount(curRow2, Temp_Grid_start, Temp_Grid_span);

							if (Grid_start === Temp_Grid_start)
							{
								if (TempCell. GetVMerge() === 1)
								{
									var cell_pos = 
									{
										Cell : curCell2,
										Row  : curRow2,
									}

									for (var Index = 0; Index < SelectionData.length; Index++)
									{
										if (cell_pos.Row === SelectionData[Index].Row && cell_pos.Cell === SelectionData[Index].Cell)
										{
											check = true;
											break;
										}
									}

									if (check)
										break;

									SelectionData.push(cell_pos);
									check = true;
								}
							}
						}
					}
				}
				// Ищем первую в строке ячейку попавшую под выделение
				else if (this.GetRow(curRow).CellsInfo[curCell].X_cell_start < X1 && X1 < this.GetRow(curRow).CellsInfo[curCell].X_cell_end)
				{
					for (var curRow2 = curRow; curRow2 >= 0; curRow2--)
					{
						if (check_first)
							break;

						for (var curCell2 = 0; curCell2 < this.GetRow(curRow2).Get_CellsCount(); curCell2++)
						{
							var TempRow 		  = this.GetRow(curRow2);
							var TempCell 		  = TempRow.Get_Cell(curCell2);
							var Temp_Grid_start   = TempRow.Get_CellInfo(curCell2).StartGridCol;
							var Temp_Grid_span    = TempCell.Get_GridSpan();
							var Temp_VMerge_count = this.Internal_GetVertMergeCount(curRow2, Temp_Grid_start, Temp_Grid_span);

							if (Grid_start === Temp_Grid_start)
							{
								if (TempCell.GetVMerge() === 1)
								{
									var cell_pos = 
									{
										Cell : curCell2,
										Row  : curRow2,
									}

									for (var Index = 0; Index < SelectionData.length; Index++)
									{
										if (cell_pos.Row === SelectionData[Index].Row && cell_pos.Cell === SelectionData[Index].Cell)
										{
											check_first = true;
											break;
										}
									}

									if (check_first)
										break;

									SelectionData.push(cell_pos);
									check_first = true;

									break;
								}
							}
						}
					}
				}
				else if (!check_first)
					continue;
				else if (this.GetRow(curRow).CellsInfo[curCell].X_cell_start < X2)
				{
					var check = false;
					for (var curRow2 = curRow; curRow2 >= 0; curRow2--)
					{
						if (check)
							break;
						for (var curCell2 = 0; curCell2 < this.GetRow(curRow2).Get_CellsCount(); curCell2++)
						{
							var TempRow			  = this.GetRow(curRow2);
							var TempCell 		  = TempRow.Get_Cell(curCell2);
							var Temp_Grid_start   = TempRow.Get_CellInfo(curCell2).StartGridCol;
							var Temp_Grid_span    = TempCell.Get_GridSpan();
							var Temp_VMerge_count = this.Internal_GetVertMergeCount(curRow2, Temp_Grid_start, Temp_Grid_span);

							if (Grid_start === Temp_Grid_start)
							{
								if (TempCell. GetVMerge() === 1)
								{
									var cell_pos = 
									{
										Cell : curCell2,
										Row  : curRow2,
									}

									for (var Index = 0; Index < SelectionData.length; Index++)
									{
										if (cell_pos.Row === SelectionData[Index].Row && cell_pos.Cell === SelectionData[Index].Cell)
										{
											check = true;
											break;
										}

									}

									if (check)
										break;

									SelectionData.push(cell_pos);
									check = true;
								}
							}
						}
					}
				}
			}
			else 	
				break;
		}
	}
	return SelectionData;
};
/**
 * @param NewMarkup - новая разметка таблицы
 * @param bCol      - где произошли изменения (в колонках или строках)
 * @param Index     - номер границы колонок(строк), у которой произошли изменения
 */
CTable.prototype.Update_TableMarkupFromRuler = function(NewMarkup, bCol, Index)
{
	var TablePr = this.Get_CompiledPr(false).TablePr;
	if (true === bCol)
	{
		var RowIndex = NewMarkup.Internal.RowIndex;
		var Row      = this.Content[RowIndex];
		var Col      = 0;

		var Dx = 0;

		// границ на 1 больше, чем самих ячеек в строке
		if (Index === NewMarkup.Cols.length)
		{
			Col = Row.Get_CellInfo(Index - 1).StartGridCol + Row.Get_Cell(Index - 1).Get_GridSpan();

			Dx = NewMarkup.Cols[Index - 1] - this.Markup.Cols[Index - 1];
		}
		else
		{
			Col = Row.Get_CellInfo(Index).StartGridCol;

			if (0 != Index)
				Dx = NewMarkup.Cols[Index - 1] - this.Markup.Cols[Index - 1];
			else
				Dx = NewMarkup.X - this.Markup.X;
		}

		if (0 === Dx)
			return;

		// Пока сделаем так, в будущем надо будет менять ширину таблицы
		if (0 != Index && TablePr.TableW.Type != tblwidth_Auto)
		{
			var TableW   = TablePr.TableW.W;
			var MinWidth = this.Internal_Get_TableMinWidth();

			if (TableW < MinWidth)
				TableW = MinWidth;

			this.Set_TableW(tblwidth_Mm, TableW + Dx);
		}

		if (0 === Col)
		{
			Dx = this.Markup.X - NewMarkup.X;
			this.X_origin -= Dx;

			if (true === this.Is_Inline())
			{
				this.Set_TableAlign(align_Left);
				this.Set_TableInd(TablePr.TableInd - Dx);
				this.private_SetTableLayoutFixedAndUpdateCellsWidth(-1);
				this.SetTableGrid(this.private_CopyTableGridCalc());
			}
			else
			{
				this.Internal_UpdateFlowPosition(this.X_origin, this.Y);
			}
		}
		else
		{
			var GridSpan = 1;
			if (Dx > 0)
			{
				if (Index != NewMarkup.Cols.length)
				{
					var Cell = Row.Get_Cell(Index);
					GridSpan = Cell.Get_GridSpan();
				}
				else
				{
					var GridAfter = Row.Get_After().GridAfter;
					GridSpan      = GridAfter;
				}

				this.TableGridCalc[Col - 1] = this.TableGridCalc[Col - 1] + Dx;
				this.Internal_UpdateCellW(Col - 1);
				this.private_SetTableLayoutFixedAndUpdateCellsWidth(Col - 1);
				this.SetTableGrid(this.private_CopyTableGridCalc());
			}
			else
			{
				if (0 != Index)
				{
					var Cell = Row.Get_Cell(Index - 1);
					GridSpan = Cell.Get_GridSpan();
				}
				else
				{
					var GridBefore = Row.Get_Before().GridBefore;
					// Если GridBefore = 0, тогда мы попадем в случай 0 === Col
					GridSpan       = GridBefore;
				}

				if (1 === GridSpan || -Dx < this.TableSumGrid[Col - 1] - this.TableSumGrid[Col - 2])
				{
					this.TableGridCalc[Col - 1] = this.TableGridCalc[Col - 1] + Dx;
					this.Internal_UpdateCellW(Col - 1);
					this.private_SetTableLayoutFixedAndUpdateCellsWidth(Col - 1);
					this.SetTableGrid(this.private_CopyTableGridCalc());
				}
				else
				{
					var Rows_info = [];

					for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
					{
						Rows_info[CurRow] = [];

						var Row = this.Content[CurRow];

						var Before_Info = Row.Get_Before();


						if (Before_Info.GridBefore > 0)
						{
							if (Before_Info.GridBefore >= Col)
							{
								var W = Math.max(0, this.TableSumGrid[Before_Info.GridBefore - 1] + Dx);
								if (W > 0.001)
									Rows_info[CurRow].push({W : W, Type : -1, GridSpan : 1});
							}
							else
								Rows_info[CurRow].push({
									W        : this.TableSumGrid[Before_Info.GridBefore - 1],
									Type     : -1,
									GridSpan : 1
								});
						}

						var CellsCount = Row.Get_CellsCount();
						for (var CurCell = 0; CurCell < CellsCount; CurCell++)
						{
							var Cell           = Row.Get_Cell(CurCell);
							var CellMargins    = Cell.GetMargins();
							var Cur_Grid_start = Row.Get_CellInfo(CurCell).StartGridCol;
							var Cur_Grid_end   = Cur_Grid_start + Cell.Get_GridSpan() - 1;

							if (Cur_Grid_start <= Col - 1 && Cur_Grid_end >= Col - 1)
							{
								var W = this.TableSumGrid[Cur_Grid_end] - this.TableSumGrid[Cur_Grid_start - 1] + Dx;

								W = Math.max(1, Math.max(W, CellMargins.Left.W + CellMargins.Right.W));
								Rows_info[CurRow].push({W : W, Type : 0, GridSpan : 1});
							}
							else
							{
								var W = this.TableSumGrid[Cur_Grid_end] - this.TableSumGrid[Cur_Grid_start - 1];

								W = Math.max(1, Math.max(W, CellMargins.Left.W + CellMargins.Right.W));
								Rows_info[CurRow].push({W : W, Type : 0, GridSpan : 1});
							}
						}
					}

					this.Internal_CreateNewGrid(Rows_info);
				}
			}

			this.private_RecalculateGrid();
		}
	}
	else
	{
		var RowIndex = this.Pages[NewMarkup.Internal.PageNum].FirstRow + Index;
		if (0 === RowIndex)
		{
			if (true === this.Is_Inline())
			{
				// ничего не делаем, позиция по Y в инлайновой таблице изменить нельзя таким способом
			}
			else
			{
				var Dy = this.Markup.Rows[0].Y - NewMarkup.Rows[0].Y;
				this.Y -= Dy;
				this.Internal_UpdateFlowPosition(this.X_origin, this.Y);
				var NewH = NewMarkup.Rows[0].H;
				this.Content[0].Set_Height(NewH, linerule_AtLeast);
			}
		}
		else
		{
			if (NewMarkup.Internal.PageNum > 0 && 0 === Index)
			{
				// ничего не делаем
			}
			else
			{
				var NewH = NewMarkup.Rows[Index - 1].H;
				this.Content[RowIndex - 1].Set_Height(NewH, linerule_AtLeast);
			}
		}
	}

	if (this.LogicDocument)
	{
		this.LogicDocument.Recalculate();
		this.LogicDocument.UpdateSelection();
	}
};
/**
 * Распраделяем выделенные ячейки по ширине или высоте
 * @param isHorizontally
 * @returns {boolean} Возвращаем false, если операция невозможна
 */
CTable.prototype.DistributeTableCells = function(isHorizontally)
{
	if (isHorizontally)
		return this.DistributeColumns();
	else
		return this.DistributeRows();
};
/**
 * Удаляем выделенные ячейки таблицы со сдвигом влево
 * @returns {boolean}
 */
CTable.prototype.RemoveTableCells = function()
{
	var bApplyToInnerTable = false;
	if (false === this.Selection.Use || ( true === this.Selection.Use && table_Selection_Text === this.Selection.Type ))
		bApplyToInnerTable = this.CurCell.Content.RemoveTableColumn();

	if (true === bApplyToInnerTable)
		return true;

	var arrSelectedCells = this.GetSelectionArray(true);

	var arrDeleteInfo = [];
	var arrRowsInfo   = [];

	var oDeletedFirstCellPos = null;

	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		arrDeleteInfo[nCurRow] = [];
		arrRowsInfo[nCurRow]   = [];

		var oRow = this.GetRow(nCurRow);

		var oBeforeInfo = oRow.GetBefore();
		if (oBeforeInfo.Grid > 0)
			arrRowsInfo[nCurRow].push({W : this.TableSumGrid[oBeforeInfo.Grid - 1], Type : -1, GridSpan : 1});

		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var isDeleted = false;
			for (var nSelectedIndex = 0, nSelectedCount = arrSelectedCells.length; nSelectedIndex < nSelectedCount; ++nSelectedIndex)
			{
				var oPos = arrSelectedCells[nSelectedIndex];
				if (oPos.Cell === nCurCell && oPos.Row === nCurRow)
				{
					isDeleted = true;
					break;
				}
			}

			if (isDeleted)
			{
				arrDeleteInfo[nCurRow].push(nCurCell);

				if (!oDeletedFirstCellPos)
					oDeletedFirstCellPos = {Row : nCurRow, Cell : nCurCell};
			}
			else
			{
				var oCell          = oRow.GetCell(nCurCell);
				var nCellGridStart = oRow.GetCellInfo(nCurCell).StartGridCol;
				var nCellGridEnd   = nCellGridStart + oCell.GetGridSpan() - 1;

				var W = this.TableSumGrid[nCellGridEnd] - this.TableSumGrid[nCellGridStart - 1];
				arrRowsInfo[nCurRow].push({W : W, Type : 0, GridSpan : 1});
			}
		}
	}

	if (!oDeletedFirstCellPos)
		oDeletedFirstCellPos = {Row : 0, Cell : 0};

	// Удалим все ячейки
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.Content[nCurRow];
		for (var nIndex = arrDeleteInfo[nCurRow].length - 1; nIndex >= 0; --nIndex)
		{
			var nCurCell = arrDeleteInfo[nCurRow][nIndex];
			oRow.RemoveCell(nCurCell);
		}
	}

	// При удалении колонки возможен случай, когда удаляется строка целиком
	for (var nCurRow = this.GetRowsCount() - 1; nCurRow >= 0; --nCurRow)
	{
		// Строка удалена целиком, если в RowsInfo нет ни одной записи
		// о ячейках (т.е. с типом равным 0)
		var isRemove = true;
		for (var nIndex = 0; nIndex < arrRowsInfo[nCurRow].length; ++nIndex)
		{
			if (0 === arrRowsInfo[nCurRow][nIndex].Type)
			{
				isRemove = false;
				break;
			}
		}

		if (isRemove)
		{
			this.private_RemoveRow(nCurRow);
			arrRowsInfo.splice(nCurRow, 1);
		}
	}

	// При удалении последней строки, надо сообщить об этом родительскому классу
	if (this.GetRowsCount() <= 0)
		return false;

	// TODO: При удалении ячеек надо запоминать информацию об вертикально
	//       объединенных ячейках, и в новой сетке объединять ячейки только
	//       если они были объединены изначально. Сейчас если ячейка была
	//       объединена с какой-либо ячейкой, то она может после удаления
	//       объединиться с совсем другой ячейкой.

	this.private_CreateNewGrid(arrRowsInfo);

	// Пробегаемся по всем ячейкам и смотрим на их вертикальное объединение, было ли оно нарушено
	this.private_CorrectVerticalMerge();

	// Возможен случай, когда у нас остались строки, полностью состоящие из объединенных вертикально ячеек
	for (var nCurRow = this.GetRowsCount() - 1; nCurRow >= 0; --nCurRow)
	{
		var isRemove = true;
		var oRow     = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.GetCell(nCurCell);
			if (vmerge_Continue !== oCell.GetVMerge())
			{
				isRemove = false;
				break;
			}
		}

		if (isRemove)
			this.private_RemoveRow(nCurRow);
	}

	var nCurRow  = oDeletedFirstCellPos.Row;
	var nCurCell = 0;
	if (nCurRow >= this.GetRowsCount())
		nCurRow = this.GetRowsCount() - 1;
	else
		nCurCell = Math.min(oDeletedFirstCellPos.Cell, this.GetRow(nCurRow).GetCellsCount() - 1);

	var oRow     = this.GetRow(nCurRow);
	this.CurCell = oRow.GetCell(nCurCell);
	this.CurCell.Content.MoveCursorToStartPos();

	this.Markup.Internal.RowIndex  = nCurRow;
	this.Markup.Internal.CellIndex = nCurCell;
	this.Markup.Internal.PageNum   = 0;

	this.Selection.Use          = false;
	this.Selection.Start        = false;
	this.Selection.StartPos.Pos = {Row : nCurRow, Cell : nCurCell};
	this.Selection.EndPos.Pos   = {Row : nCurRow, Cell : nCurCell};
	this.Selection.CurRow       = nCurRow;

	this.private_RecalculateGrid();

	return true;
};
//----------------------------------------------------------------------------------------------------------------------
// Внутренние функции
//----------------------------------------------------------------------------------------------------------------------
/**
 * TODO: Удалить данную функцию
 */
CTable.prototype.Internal_Recalculate_1 = function()
{
	return editor.WordControl.m_oLogicDocument.Recalculate();
};
/**
 * TODO: Удалить данную функцию
 * Данная функция вызывается после изменений внутри ячейки, а это означает, что с момента
 * последнего пересчета не изменилась ни сетка, ни границы, и ни расстояние между ячейками в таблицу.
 * Следовательно, нам надо пересчитать высоту ячейки, в которой произошли изменения,  и если
 * это приведет к изменению высоты строки, то пересчитываем все строки дальше.
 */
CTable.prototype.Internal_RecalculateFrom = function(RowIndex, CellIndex, bChange, bForceRecalc)
{
	return editor.WordControl.m_oLogicDocument.Recalculate();
};
CTable.prototype.Internal_GetCellByXY = function(X, Y, PageIndex)
{
	// Сначала определяем колонку в которую мы попали
	var CurGrid = 0;

	var CurPage   = Math.min(this.Pages.length - 1, Math.max(0, PageIndex));
	var Page      = this.Pages[CurPage];
	var ColsCount = this.TableGridCalc.length;

	var twX     = AscCommon.MMToTwips(X);
	var twPageX = AscCommon.MMToTwips(Page.X);
	if (twX >= twPageX)
	{
		for (CurGrid = 0; CurGrid < ColsCount; CurGrid++)
		{
			var twColStart = AscCommon.MMToTwips(Page.X + this.TableSumGrid[CurGrid - 1]);
			var twColEnd   = AscCommon.MMToTwips(Page.X + this.TableSumGrid[CurGrid]);
			if (twColStart <= twX && twX < twColEnd)
				break;
		}
	}

	if (CurGrid >= ColsCount)
		CurGrid = ColsCount - 1;

	// Найдем промежуток строк по PageIndex среди которых нам надо искать
	var PNum = PageIndex;

	var Row_start, Row_last;

	if (PNum < 0)
	{
		Row_start = 0;
		Row_last  = 0;
	}
	else if (PNum >= this.Pages.length)
	{
		Row_start = this.Content.length - 1;
		Row_last  = this.Content.length - 1;
	}
	else
	{
		Row_start = this.Pages[PNum].FirstRow;
		Row_last  = this.Pages[PNum].LastRow;
	}

	if (Row_last < Row_start)
		return {Row : 0, Cell : 0};

	for (var CurRow = Row_start; CurRow <= Row_last; CurRow++)
	{
		var Row        = this.Content[CurRow];
		var CellsCount = Row.Get_CellsCount();
		var BeforeInfo = Row.Get_Before();
		var CurGridCol = BeforeInfo.GridBefore;

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell     = Row.Get_Cell(CurCell);
			var GridSpan = Cell.Get_GridSpan();
			var Vmerge   = Cell.GetVMerge();

			// Обсчет такик ячеек произошел ранее
			if (vmerge_Continue === Vmerge && Row_start != CurRow)
			{
				CurGridCol += GridSpan;
				continue;
			}

			var VMergeCount = this.private_GetVertMergeCountOnPage(PNum, CurRow, CurGridCol, GridSpan);
			if (VMergeCount <= 0)
			{
				CurGridCol += GridSpan;
				continue;
			}

			// Проверяем по X
			if (CurGrid >= CurGridCol && CurGrid < CurGridCol + GridSpan)
			{
				// Проверяем по Y
				if ("undefined" != typeof(this.RowsInfo[CurRow + VMergeCount - 1].Y[PNum]) && "undefined" != typeof(this.RowsInfo[CurRow + VMergeCount - 1].H[PNum]) && (Y <= (this.RowsInfo[CurRow + VMergeCount - 1].Y[PNum] + this.RowsInfo[CurRow + VMergeCount - 1].H[PNum]) || CurRow + VMergeCount - 1 >= Row_last ))
				{
					if (vmerge_Continue === Vmerge && Row_start === CurRow)
					{
						Cell = this.Internal_Get_StartMergedCell(CurRow, CurGridCol, GridSpan);
						if (null != Cell)
							return {Row : Cell.Row.Index, Cell : Cell.Index};
						else
							return {Row : 0, Cell : 0};
					}
					else
						return {Row : CurRow, Cell : CurCell};
				}
			}

			CurGridCol += GridSpan;
		}
	}

	return {Row : 0, Cell : 0};
};
/**
 * Считаем количество соединенных вертикально ячеек
 */
CTable.prototype.Internal_GetVertMergeCount = function(StartRow, StartGridCol, GridSpan)
{
	// начинаем с 1, потому что предполагается, что соединение начинается с исходной ячейки
	var VmergeCount = 1;
	for (var Index = StartRow + 1; Index < this.Content.length; Index++)
	{
		var Row        = this.Content[Index];
		var BeforeInfo = Row.Get_Before();
		var CurGridCol = BeforeInfo.GridBefore;
		var CurCell    = 0;
		var CellsCount = Row.Get_CellsCount();

		var bWasMerged = false;
		while (CurGridCol <= StartGridCol && CurCell < CellsCount)
		{
			var Cell         = Row.Get_Cell(CurCell);
			var CellGridSpan = Cell.Get_GridSpan();
			var Vmerge       = Cell.GetVMerge();

			if (CurGridCol === StartGridCol && GridSpan === CellGridSpan && vmerge_Continue === Vmerge)
			{
				bWasMerged = true;
				VmergeCount++;
				break;
			}
			else if (CurGridCol === StartGridCol && GridSpan === CellGridSpan && vmerge_Continue != Vmerge)
			{
				bWasMerged = true;
				return VmergeCount;
			}
			// Если данная ячейка имеет пересечение с заданным промежутком, но польностью с ним не совпадает
			else if (CurGridCol <= StartGridCol + GridSpan - 1 && CurGridCol + CellGridSpan - 1 >= StartGridCol)
				break;

			CurGridCol += CellGridSpan;
			CurCell++;
		}

		if (false === bWasMerged)
			break;
	}

	return VmergeCount;
};
/**
 * Считаем количество соединенных вертикально ячеек, но в обратную сторону (т.е. снизу вверх)
 */
CTable.prototype.Internal_GetVertMergeCount2 = function(StartRow, StartGridCol, GridSpan)
{
	// начинаем с 1, потому что предполагается, что соединение начинается с исходной ячейки
	var VmergeCount = 1;

	// сначала проверим VMerge текущей ячейки
	var Start_Row        = this.Content[StartRow];
	var Start_VMerge     = vmerge_Restart;
	var Start_CellsCount = Start_Row.Get_CellsCount();
	for (var Index = 0; Index < Start_CellsCount; Index++)
	{
		var Temp_Grid_start = Start_Row.Get_CellInfo(Index).StartGridCol;
		if (Temp_Grid_start === StartGridCol)
		{
			Start_VMerge = Start_Row.Get_Cell(Index).GetVMerge();
			break;
		}
	}

	if (vmerge_Restart === Start_VMerge)
		return VmergeCount;

	for (var Index = StartRow - 1; Index >= 0; Index--)
	{
		var Row        = this.Content[Index];
		var BeforeInfo = Row.Get_Before();
		var CurGridCol = BeforeInfo.GridBefore;
		var CurCell    = 0;
		var CellsCount = Row.Get_CellsCount();

		var bWasMerged = false;
		while (CurGridCol <= StartGridCol && CurCell < CellsCount)
		{
			var Cell         = Row.Get_Cell(CurCell);
			var CellGridSpan = Cell.Get_GridSpan();
			var Vmerge       = Cell.GetVMerge();

			if (CurGridCol === StartGridCol && GridSpan === CellGridSpan && vmerge_Continue === Vmerge)
			{
				bWasMerged = true;
				VmergeCount++;
				break;
			}
			else if (CurGridCol === StartGridCol && GridSpan === CellGridSpan && vmerge_Continue != Vmerge)
			{
				bWasMerged = true;
				VmergeCount++;
				return VmergeCount;
			}
			// Если данная ячейка имеет пересечение с заданным промежутком, но польностью с ним не совпадает
			else if (CurGridCol <= StartGridCol + GridSpan - 1 && CurGridCol + CellGridSpan - 1 >= StartGridCol)
				break;

			CurGridCol += CellGridSpan;
			CurCell++;
		}

		if (false === bWasMerged)
			break;
	}

	return VmergeCount;
};
/**
 * Проверяем, нужно ли удалить ненужные строки из нашей таблицы.
 * Такое может произойти после объединения ячеек или после изменения сетки
 * таблицы.
 * @returns {boolean} произошли ли изменения в таблице
 */
CTable.prototype.Internal_Check_TableRows = function(bSaveHeight)
{
	// Пробегаемся по всем строкам, если в какой-то строке у всех ячеек стоит
	// вертикальное объединение, тогда такую строку удаляем, а у предыдущей
	// строки выставляем минимальную высоту - сумму высот этих двух строк.
	// Кроме этого нам надо выставить минимальную высоту у строк, в которых
	// все ячейки состоят в вертикальном объединении, а у самой строки
	// параметр WBefore или WAfter ненулевой

	// Сначала пробежимся по строкам и узнаем, какие строки нужно удалить
	var Rows_to_Delete = [];
	var Rows_to_CalcH  = [];
	var Rows_to_CalcH2 = [];
	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var Row = this.Content[CurRow];

		var bVmerge_Restart  = false;
		var bVmerge_Continue = false;
		var bNeedDeleteRow   = true;
		var bNeedCalcHeight  = false;

		if (Row.Get_Before().GridBefore > 0 || Row.Get_After().GridAfter > 0)
			bNeedCalcHeight = true;

		for (var CurCell = 0; CurCell < Row.Get_CellsCount(); CurCell++)
		{
			var Cell   = Row.Get_Cell(CurCell);
			var VMerge = Cell.GetVMerge();

			if (VMerge != vmerge_Continue)
			{
				var VMergeCount = this.Internal_GetVertMergeCount(CurRow, Row.Get_CellInfo(CurCell).StartGridCol, Cell.Get_GridSpan());
				if (VMergeCount > 1)
					bVmerge_Restart = true;

				bNeedDeleteRow = false;

				if (true === bNeedCalcHeight)
				{
					if (1 === VMergeCount)
						bNeedCalcHeight = false;
				}
			}
			else
				bVmerge_Continue = true;
		}

		if (true === bVmerge_Continue && true === bVmerge_Restart)
			Rows_to_CalcH2.push(CurRow);
		else if (true === bNeedCalcHeight)
			Rows_to_CalcH.push(CurRow);

		if (true === bNeedDeleteRow)
			Rows_to_Delete.push(CurRow);
	}

	// Сначала разберемся со строками, у которых надо проставить минимальную высоту
	for (var Index = 0; Index < Rows_to_CalcH2.length; Index++)
	{
		var RowIndex  = Rows_to_CalcH2[Index];
		var MinHeight = -1;

		var Row        = this.Content[RowIndex];
		var CellsCount = Row.Get_CellsCount()
		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell   = Row.Get_Cell(CurCell);
			var VMerge = Cell.GetVMerge();
			if (vmerge_Restart === VMerge)
			{
				var CurMinHeight = Cell.Content.Get_EmptyHeight();
				if (CurMinHeight < MinHeight || MinHeight === -1)
					MinHeight = CurMinHeight;
			}
		}

		var OldHeight = this.Content[RowIndex].Get_Height();

		if (undefined === OldHeight || Asc.linerule_Auto == OldHeight.HRule || ( MinHeight > OldHeight.Value ))
			this.Content[RowIndex].Set_Height(MinHeight, linerule_AtLeast);
	}

	if (Rows_to_Delete.length <= 0)
		return false;

	if (true === bSaveHeight)
	{
		// Сначала разберемся со строками, у которых надо проставить минимальную высоту
		for (var nIndex = 0, nCount = Rows_to_CalcH.length; nIndex < nCount; ++nIndex)
		{
			var nCurRow = Rows_to_CalcH[nIndex];

			var nHeightValue = null;
			for (var nCurPage in this.RowsInfo[nCurRow].H)
			{
				if (null === nHeightValue)
				{
					nHeightValue = this.RowsInfo[nCurRow].H[nCurPage];
				}
				else
				{
					nHeightValue = null;
					break;
				}
			}

			if (null !== nHeightValue)
				this.GetRow(nCurRow).SetHeight(nHeightValue, linerule_AtLeast);
		}

		// Рассчитаем высоты строк, так чтобы после удаления, общий вид таблицы не менялся
		for (var Counter = 0; Counter < Rows_to_Delete.length;)
		{
			var CurRowSpan = 1;

			var StartRow = Rows_to_Delete[Counter];
			while (Counter + CurRowSpan < Rows_to_Delete.length && Rows_to_Delete[Counter] + CurRowSpan === Rows_to_Delete[Counter + CurRowSpan])
				CurRowSpan++;

			if (this.RowsInfo[StartRow - 1 + CurRowSpan].StartPage === this.RowsInfo[StartRow - 1].StartPage)
			{
				var StartPage      = this.RowsInfo[StartRow - 1 + CurRowSpan].StartPage;
				var Summary_Height = this.RowsInfo[StartRow - 1 + CurRowSpan].H[StartPage] + this.RowsInfo[StartRow - 1 + CurRowSpan].Y[StartPage] - this.RowsInfo[StartRow - 1].Y[StartPage];
				this.Content[StartRow - 1].Set_Height(Summary_Height, linerule_AtLeast);
			}

			Counter += CurRowSpan;
		}
	}

	// Удаляем, начиная с последней строки, чтобы не пересчитывать номера строк
	for (var Index = Rows_to_Delete.length - 1; Index >= 0; Index--)
	{
		var Row_to_Delete = Rows_to_Delete[Index];
		this.private_RemoveRow(Row_to_Delete);
	}

	return true;
};
CTable.prototype.private_RemoveRow = function(nIndex)
{
	if (nIndex >= this.Content.length || nIndex < 0)
		return;

	this.Content[nIndex].PreDelete();

	History.Add(new CChangesTableRemoveRow(this, nIndex, [this.Content[nIndex]]));

	this.Rows--;
	this.Content.splice(nIndex, 1);
	this.TableRowsBottom.splice(nIndex, 1);
	this.RowsInfo.splice(nIndex, 1);

	this.Internal_ReIndexing(nIndex);

	this.private_CheckCurCell();
};
CTable.prototype.private_AddRow = function(Index, CellsCount, bReIndexing, _NewRow)
{
	if (Index < 0)
		Index = 0;

	if (Index >= this.Content.length)
		Index = this.Content.length;

	this.Rows++;

	var NewRow = ( undefined === _NewRow ? new CTableRow(this, CellsCount) : _NewRow );

	History.Add(new CChangesTableAddRow(this, Index, [NewRow]));

	this.Content.splice(Index, 0, NewRow);
	this.TableRowsBottom.splice(Index, 0, {});
	this.RowsInfo.splice(Index, 0, new CTableRowsInfo());

	if (true === bReIndexing)
	{
		this.Internal_ReIndexing(Index);
	}
	else
	{
		if (Index > 0)
		{
			this.Content[Index - 1].Next = NewRow;
			NewRow.Prev                  = this.Content[Index - 1];
		}
		else
			NewRow.Prev = null;

		if (Index < this.Content.length - 1)
		{
			this.Content[Index + 1].Prev = NewRow;
			NewRow.Next                  = this.Content[Index + 1];
		}
		else
			NewRow.Next = null;
	}

	NewRow.Table = this;

	this.private_CheckCurCell();

	return NewRow;
};
CTable.prototype.Clear_ContentChanges = function()
{
	this.m_oContentChanges.Clear();
};
CTable.prototype.Add_ContentChanges = function(Changes)
{
	this.m_oContentChanges.Add(Changes);
};
CTable.prototype.Refresh_ContentChanges = function()
{
	this.m_oContentChanges.Refresh();
};
CTable.prototype.Internal_ReIndexing = function(StartIndex)
{
	if ("undefined" === typeof(StartIndex))
		StartIndex = 0;

	for (var Ind = StartIndex; Ind < this.Content.length; Ind++)
	{
		this.Content[Ind].Set_Index(Ind);
		this.Content[Ind].Prev  = ( Ind > 0 ? this.Content[Ind - 1] : null );
		this.Content[Ind].Next  = ( Ind < this.Content.length - 1 ? this.Content[Ind + 1] : null );
		this.Content[Ind].Table = this;
	}
};
CTable.prototype.ReIndexing = function(StartIndex)
{
	this.Internal_ReIndexing(0);

	var Count = this.Content.length;
	for (var Ind = StartIndex; Ind < Count; Ind++)
	{
		this.Content[Ind].Internal_ReIndexing(0);
	}
};
/**
 * Переделываем сетку таблицы заново, исходя из массива RowsInfo
 * В данном массиве заданы для каждой строки ширины всех ячеек (либо
 * пропусков до или после строк GridBefore/GridAfter).
 * На выходе мы отдаем новую сетку TableGrid и массив RowsInfo, в
 * котором для каждой ячейки(пропуска) указан GridSpan.
 */
CTable.prototype.private_CreateNewGrid = function(arrRowsInfo)
{
	return this.Internal_CreateNewGrid(arrRowsInfo);
};
CTable.prototype.Internal_CreateNewGrid = function(RowsInfo)
{
	var nCellSpacing = this.Content[0].GetCellSpacing();

	var CurPos = [];
	var CurX   = [];
	for (var Index = 0; Index < RowsInfo.length; Index++)
	{
		CurPos[Index] = 0;
		CurX[Index]   = RowsInfo[Index][0].W;

		for (var Index2 = 0; Index2 < RowsInfo[Index].length; Index2++)
		{
			RowsInfo[Index][Index2].GridSpan = 1;

			// Последние элемент всегда должен означать GridAfter, но с
			// нулевыем начальным значением.
			if (1 != RowsInfo[Index][RowsInfo[Index].length - 1].Type)
			{
				RowsInfo[Index].push({W : 0, Type : 1, GridSpan : 0});
			}
			else
			{
				RowsInfo[Index][RowsInfo[Index].length - 1] = {W : 0, Type : 1, GridSpan : 0};
			}
		}
	}

	var TableGrid = [];
	var bEnd      = false;
	var PrevX     = 0;
	while (true != bEnd)
	{
		var MinX = -1;
		for (var Index = 0; Index < RowsInfo.length; Index++)
		{
			if ((MinX === -1 || CurX[Index] < MinX) && !( RowsInfo[Index].length - 1 === CurPos[Index] && 1 === RowsInfo[Index][CurPos[Index]].Type ))
				MinX = CurX[Index];
		}

		for (var Index = 0; Index < RowsInfo.length; Index++)
		{
			if (RowsInfo[Index].length - 1 === CurPos[Index] && 1 === RowsInfo[Index][CurPos[Index]].Type)
				RowsInfo[Index][CurPos[Index]].GridSpan++;
			else
			{
				if (Math.abs(MinX - CurX[Index]) < 0.001)
				{
					CurPos[Index]++;
					CurX[Index] += RowsInfo[Index][CurPos[Index]].W;
				}
				else
				{
					RowsInfo[Index][CurPos[Index]].GridSpan++;
				}
			}
		}

		TableGrid.push(MinX - PrevX);
		PrevX = MinX;

		bEnd = true;
		for (var Index = 0; Index < RowsInfo.length; Index++)
		{
			if (RowsInfo[Index].length - 1 != CurPos[Index])
			{
				bEnd = false;
				break;
			}
		}
	}

	for (var CurRow = 0; CurRow < RowsInfo.length; CurRow++)
	{
		var RowInfo = RowsInfo[CurRow];
		var Row     = this.Content[CurRow];

		var CurIndex = 0;
		if (-1 === RowInfo[0].Type)
		{
			if (RowInfo[0].GridSpan > 0)
			{
				Row.Set_Before(RowInfo[0].GridSpan);
			}
			CurIndex++;
		}
		else
		{
			Row.Set_Before(0);
		}

		for (var CurCell = 0; CurIndex < RowInfo.length; CurIndex++, CurCell++)
		{
			if (1 === RowInfo[CurIndex].Type)
				break;

			var Cell = Row.Get_Cell(CurCell);
			Cell.Set_GridSpan(RowInfo[CurIndex].GridSpan);
			var WType = Cell.Get_W().Type;
			if (tblwidth_Auto != WType && tblwidth_Nil != WType)
			{
				var nW = RowInfo[CurIndex].W;
				if (null !== nCellSpacing)
				{
					if (0 === CurCell || (1 === CurCell && RowInfo[0].Type === -1))
						nW -= nCellSpacing / 2;

					nW -= nCellSpacing;

					if (RowInfo.length - 2 === CurCell)
						nW -= nCellSpacing / 2;
				}

				Cell.Set_W(new CTableMeasurement(tblwidth_Mm, nW));
			}
		}

		CurIndex = RowInfo.length - 1;
		if (1 === RowInfo[CurIndex].Type)
		{
			Row.Set_After(RowInfo[CurIndex].GridSpan);
		}
		else
		{
			Row.Set_After(0);
		}
	}
	this.SetTableGrid(TableGrid);
	return TableGrid;
};
/**
 * Получаем информацию о всех строках, используемую для генерации ширин колонок
 * @returns {Array}
 */
CTable.prototype.private_GetRowsInfo = function()
{
	var arrRowsInfo = [];

	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		arrRowsInfo[nCurRow] = [];

		var oRow = this.GetRow(nCurRow);

		var oBeforeInfo = oRow.GetBefore();
		if (oBeforeInfo.GridBefore > 0)
			arrRowsInfo[nCurRow].push({W : this.TableSumGrid[oBeforeInfo.Grid - 1], Type : -1, GridSpan : 1});

		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell     = oRow.GetCell(nCurCell);
			var oCellInfo = oRow.GetCellInfo(nCurCell);

			if (!oCellInfo)
			{
				arrRowsInfo[nCurRow].push({
					W        : 0,
					Type     : 0,
					GridSpan : 1
				});
			}
			else
			{
				var nCurGridStart = oCellInfo.StartGridCol;
				var nCurGridEnd   = nCurGridStart + oCell.GetGridSpan() - 1;

				if (undefined === this.TableSumGrid[nCurGridEnd] || undefined === this.TableSumGrid[nCurGridStart - 1])
				{
					arrRowsInfo[nCurRow].push({
						W        : 0,
						Type     : 0,
						GridSpan : 1
					});
				}
				else
				{
					arrRowsInfo[nCurRow].push({
						W        : this.TableSumGrid[nCurGridEnd] - this.TableSumGrid[nCurGridStart - 1],
						Type     : 0,
						GridSpan : 1
					});
				}
			}
		}
	}

	return arrRowsInfo;
};
/**
 * Добавляем в массив информации о строках новую ячейку в заданной строке
 * @param arrRowsInfo
 * @param nRowIndex
 * @param nCellIndex
 * @param {number} nW - заданная ширина ячейка
 * @returns {boolean} Удалось ли добавить информацию
 */
CTable.prototype.private_AddCellToRowsInfo = function(arrRowsInfo, nRowIndex, nCellIndex, nW)
{
	if (!arrRowsInfo || !arrRowsInfo[nRowIndex])
		return false;

	var nPos = nCellIndex;
	if (-1 === arrRowsInfo[nRowIndex][0].Type)
		nPos++;

	if (nPos > arrRowsInfo[nRowIndex].length)
		return false;

	arrRowsInfo[nRowIndex].splice(nPos, 0, {
		W        : nW,
		Type     : 0,
		GridSpan : 1
	});

	return true;
};
CTable.prototype.Internal_UpdateCellW = function(Col)
{
	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var Row         = this.Content[CurRow];
		var Cells_Count = Row.Get_CellsCount();
		var CurGridCol  = Row.Get_Before().GridBefore;

		for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
		{
			var Cell     = Row.Get_Cell(CurCell);
			var GridSpan = Cell.Get_GridSpan();

			if (Col >= CurGridCol && Col < CurGridCol + GridSpan)
			{
				var CellWType = Cell.Get_W().Type;
				if (tblwidth_Auto != CellWType && tblwidth_Nil != CellWType)
				{
					var W = 0;
					for (var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++)
						W += this.TableGridCalc[CurSpan];

					Cell.Set_W(new CTableMeasurement(tblwidth_Mm, W));
				}

				break;
			}

			CurGridCol += GridSpan;
		}
	}
};
/**
 * Сравниваем границы двух соседних ячеек.
 * @param Border1
 * @param Border2
 * @param bTableBorder1 - является ли граница границей всей таблицы
 * @param bTableBorder2 - является ли граница границей всей таблицы
 */
CTable.prototype.Internal_CompareBorders = function(Border1, Border2, bTableBorder1, bTableBorder2)
{
	if ("undefined" === typeof(bTableBorder1))
		bTableBorder1 = false;

	if ("undefined" === typeof(bTableBorder2))
		bTableBorder2 = false;

	// Граница ячейки всегда побеждает границу таблицы, если первая задана
	if (true === bTableBorder1)
		return Border2;

	if (true === bTableBorder2)
		return Border1;

	// Всегда побеждает непустая граница
	if (border_None === Border1.Value)
		return Border2;

	if (border_None === Border2.Value)
		return Border1;

	// TODO: Как только мы реализуем рисование не только простых границ,
	//       сделать здесь обработку. W_b = Border.Size * Border_Num,
	//       где Border_Num зависит от Border.Value

	var W_b_1 = Border1.Size;
	var W_b_2 = Border2.Size;
	if (W_b_1 > W_b_2)
		return Border1;
	else if (W_b_2 > W_b_1)
		return Border2;

	var Brightness_1_1 = Border1.Color.r + Border1.Color.b + 2 * Border1.Color.g;
	var Brightness_1_2 = Border2.Color.r + Border2.Color.b + 2 * Border2.Color.g;

	if (Brightness_1_1 < Brightness_1_2)
		return Border1;
	else if (Brightness_1_2 < Brightness_1_1)
		return Border2;

	var Brightness_2_1 = Border1.Color.b + 2 * Border1.Color.g;
	var Brightness_2_2 = Border2.Color.b + 2 * Border2.Color.g;

	if (Brightness_2_1 < Brightness_2_2)
		return Border1;
	else if (Brightness_2_2 < Brightness_2_1)
		return Border2;

	var Brightness_3_1 = Border1.Color.g;
	var Brightness_3_2 = Border2.Color.g;

	if (Brightness_3_1 < Brightness_3_2)
		return Border1;
	else if (Brightness_3_2 < Brightness_3_1)
		return Border2;

	// Две границы функционально идентичны, нам все равно какую рисовать.
	return Border1;
};
/**
 * Получаем левую верхнюю ячейку в текущем объединении
 */
CTable.prototype.Internal_Get_StartMergedCell = function(StartRow, StartGridCol, GridSpan)
{
	var Result = null;
	for (var Index = StartRow; Index >= 0; Index--)
	{
		var Row        = this.Content[Index];
		var BeforeInfo = Row.Get_Before();
		var CurGridCol = BeforeInfo.GridBefore;
		var CurCell    = 0;
		var CellsCount = Row.Get_CellsCount();

		var bWasMerged = false;
		while (CurGridCol <= StartGridCol && CurCell < CellsCount)
		{
			var Cell         = Row.Get_Cell(CurCell);
			var CellGridSpan = Cell.Get_GridSpan();
			var Vmerge       = Cell.GetVMerge();

			if (CurGridCol === StartGridCol && GridSpan === CellGridSpan && vmerge_Continue === Vmerge)
			{
				bWasMerged = true;
				Result     = Cell;
				break;
			}
			else if (CurGridCol === StartGridCol && GridSpan === CellGridSpan && vmerge_Continue != Vmerge)
			{
				bWasMerged = true;
				Result     = Cell;
				return Result;
			}
			// Если данная ячейка имеет пересечение с заданным промежутком, но польностью с ним не совпадает
			else if (CurGridCol <= StartGridCol + GridSpan - 1 && CurGridCol + CellGridSpan - 1 >= StartGridCol)
				break;

			CurGridCol += CellGridSpan;
			CurCell++;
		}

		if (false === bWasMerged)
			break;
	}

	return Result;
};
/**
 * Получаем левую верхнюю ячейку в текущем объединении
 */
CTable.prototype.Internal_Get_EndMergedCell = function(StartRow, StartGridCol, GridSpan)
{
	var Result = null;
	for (var Index = StartRow, Count = this.Content.length; Index < Count; Index++)
	{
		var Row        = this.Content[Index];
		var BeforeInfo = Row.Get_Before();
		var CurGridCol = BeforeInfo.GridBefore;
		var CurCell    = 0;
		var CellsCount = Row.Get_CellsCount();

		var bWasMerged = false;
		while (CurGridCol <= StartGridCol && CurCell < CellsCount)
		{
			var Cell         = Row.Get_Cell(CurCell);
			var CellGridSpan = Cell.Get_GridSpan();
			var Vmerge       = Cell.GetVMerge();

			if (CurGridCol === StartGridCol && GridSpan === CellGridSpan)
			{
				if (vmerge_Continue === Vmerge || Index === StartRow)
				{
					bWasMerged = true;
					Result     = Cell;
					break;
				}
				else
					return Result;
			}
			// Если данная ячейка имеет пересечение с заданным промежутком, но польностью с ним не совпадает
			else if (CurGridCol <= StartGridCol + GridSpan - 1 && CurGridCol + CellGridSpan - 1 >= StartGridCol)
				break;

			CurGridCol += CellGridSpan;
			CurCell++;
		}

		if (false === bWasMerged)
			break;
	}

	return Result;
};
/**
 * Получаем массив ячеек попадающих в заданное вертикальное объединение
 */
CTable.prototype.private_GetMergedCells = function(RowIndex, StartGridCol, GridSpan)
{
	// Сначала проверим данну строку
	var Row       = this.Content[RowIndex];
	var CellIndex = this.private_GetCellIndexByStartGridCol(RowIndex, StartGridCol);
	if (-1 === CellIndex)
		return [];

	var Cell = Row.Get_Cell(CellIndex);
	if (GridSpan !== Cell.Get_GridSpan())
		return [];

	var CellsArray = [Cell];

	// Ищем ячейки вверх
	for (var Index = RowIndex - 1; Index >= 0; Index--)
	{
		var CellIndex = this.private_GetCellIndexByStartGridCol(Index, StartGridCol);
		if (-1 === CellIndex)
			break;

		var Cell = this.Content[Index].Get_Cell(CellIndex);
		if (GridSpan !== Cell.Get_GridSpan())
			break;

		var Vmerge = Cell.GetVMerge();
		if (vmerge_Continue !== Vmerge)
			break;

		CellsArray.splice(0, 0, Cell);
	}

	// Ищем ячейки вниз
	for (var Index = RowIndex + 1, Count = this.Content.length; Index < Count; Index++)
	{
		var CellIndex = this.private_GetCellIndexByStartGridCol(Index, StartGridCol);
		if (-1 === CellIndex)
			break;

		var Cell = this.Content[Index].Get_Cell(CellIndex);
		if (GridSpan !== Cell.Get_GridSpan())
			break;

		var Vmerge = Cell.GetVMerge();
		if (vmerge_Continue !== Vmerge)
			break;

		CellsArray.push(Cell);
	}

	return CellsArray;
};
CTable.prototype.private_GetCellsPosArrayByCellsArray = function(CellsArray)
{
	var Result = [];
	for (var Index = 0, Count = CellsArray.length; Index < Count; Index++)
	{
		var Cell = CellsArray[Index];
		Result.push({Cell : Cell.Index, Row : Cell.Row.Index});
	}

	return Result;
};
/**
 * Получаем левую верхнюю ячейку в текущем объединении
 * @param {number} nCellIndex
 * @param {number} nRowIndex
 * @returns {?CTableCell}
 */
CTable.prototype.GetStartMergedCell = function(nCellIndex, nRowIndex)
{
	var oRow = this.GetRow(nRowIndex);
	if (!oRow)
		return null;

	var oCell     = oRow.GetCell(nCellIndex);
	var oCellInfo = oRow.GetCellInfo(nCellIndex);

	if (!oCell || !oCellInfo)
		return null;

	return this.Internal_Get_StartMergedCell(nRowIndex, oCellInfo.StartGridCol, oCell.GetGridSpan());
};
/**
 * Получаем количество ячеек (=количество строк) попавших в вертикальное объединения, начиная с заданной ячейки внизю
 * @param nCellIndex номер ячейки в строке
 * @param nRowIndex номер строки
 * @returns {number}
 */
CTable.prototype.GetVMergeCount = function(nCellIndex, nRowIndex)
{
	var oRow = this.GetRow(nRowIndex);
	if (!oRow)
		return 1;

	var oCell = oRow.GetCell(nCellIndex);
	if (!oCell)
		return 1;

	var oCellInfo = oRow.GetCellInfo(nCellIndex);
	if (!oCellInfo)
		return 1;

	return this.Internal_GetVertMergeCount(nRowIndex, oCellInfo.StartGridCol, oCell.GetGridSpan());
};
/**
 * Получаем номер ячейки в заданной строке по заданной колонке
 * @param {number} nCurRow
 * @param {number} nStartGridCol
 * @param {boolean} [isAllowOverlap = false] true - ищем ячейку, в которой началась данная колонка, false - ищем ячейку, строго начавшуюся с заданной колонки
 * @returns {number} Возвращаем -1, если не найдена ячейка
 */
CTable.prototype.private_GetCellIndexByStartGridCol = function(nCurRow, nStartGridCol, isAllowOverlap)
{
	var oRow = this.GetRow(nCurRow);
	if (!oRow)
		return -1;

	var nCurGridCol = oRow.GetBefore().Grid;
	if (isAllowOverlap)
	{
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			if (nStartGridCol === nCurGridCol)
				return nCurCell;
			else if (nCurGridCol > nStartGridCol)
				return nCurCell - 1;

			var oCell = oRow.GetCell(nCurCell);
			nCurGridCol += oCell.GetGridSpan();
		}

		return oRow.GetCellsCount() - 1;
	}
	else
	{
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			if (nStartGridCol === nCurGridCol)
				return nCurCell;
			else if (nCurGridCol > nStartGridCol)
				return -1;

			var oCell = oRow.GetCell(nCurCell);
			nCurGridCol += oCell.GetGridSpan();
		}
	}

	return -1;
};
CTable.prototype.private_UpdateTableMarkup = function(nRowIndex, nCellIndex, nCurPage)
{
	this.Markup.Internal = {
		RowIndex  : nRowIndex,
		CellIndex : nCellIndex,
		PageNum   : nCurPage
	};

	var oPage = this.Pages[nCurPage];
	if (!oPage || !this.IsRecalculated())
		return;

	this.Markup.X = oPage.X;

	var oRow         = this.GetRow(nRowIndex);
	var nCellSpacing = null === oRow.GetCellSpacing() ? 0 : oRow.GetCellSpacing();
	var nCellsCount  = oRow.GetCellsCount();
	var nGridBefore  = oRow.GetBefore().Grid;

	this.Markup.X += this.TableSumGrid[nGridBefore - 1];
	this.Markup.Cols    = [];
	this.Markup.Margins = [];

	for (var nCurCell = 0; nCurCell < nCellsCount; ++nCurCell)
	{
		var oCell     = oRow.GetCell(nCurCell);
		var oCellInfo = oRow.GetCellInfo(nCurCell);

		var nStartGridCol = oCellInfo.StartGridCol;
		var nGridSpan     = oCell.GetGridSpan();
		var oCellMargin   = oCell.GetMargins();

		this.Markup.Cols.push(this.TableSumGrid[nStartGridCol + nGridSpan - 1] - this.TableSumGrid[nStartGridCol - 1]);

		var nMarginLeft  = oCellMargin.Left.W;
		var nMarginRight = oCellMargin.Right.W;

		if (0 === nCurCell)
			nMarginLeft += nCellSpacing;
		else
			nMarginLeft += nCellSpacing / 2;

		if (nCellsCount - 1 === nCurCell)
			nMarginRight += nCellSpacing;
		else
			nMarginRight += nCellSpacing / 2;

		this.Markup.Margins.push({Left : nMarginLeft, Right : nMarginRight});
	}

	// Определим какие строки попадают на данную страницу
	var Row_start = this.Pages[nCurPage].FirstRow;
	var Row_last  = Row_start;

	if (nCurPage + 1 < this.Pages.length)
	{
		Row_last = this.Pages[nCurPage + 1].FirstRow;

		// Возможно, на данной странице строку, с которой началось разбиение на стрнице,
		// не надо рисовать. (Если начальная и конечная строки совпадают, тогда это 2
		// или более страница данной строки)
		if ((Row_start != Row_last || ( 0 === Row_start && 0 === Row_last ) ) && false === this.RowsInfo[Row_last].FirstPage)
			Row_last--;
	}
	else
		Row_last = this.Content.length - 1;

	this.Markup.Rows = [];
	for (var CurRow = Row_start; CurRow <= Row_last; CurRow++)
	{
		if (this.RowsInfo[CurRow] && this.RowsInfo[CurRow].Y[nCurPage] && this.RowsInfo[CurRow].H[nCurPage])
			this.Markup.Rows.push({Y : this.RowsInfo[CurRow].Y[nCurPage], H : this.RowsInfo[CurRow].H[nCurPage]});
	}

	this.Markup.CurCol = nCellIndex;
	this.Markup.CurRow = nRowIndex - Row_start;

	var Transform = this.Get_ParentTextTransform();
	this.DrawingDocument.Set_RulerState_Table(this.Markup, Transform);
};
/**
 * Проверяем попадание в границу и определяем дополнительно попадание во вспомогательные области
 * Значения для поля Border: -1 - не попали в границу
 *      0
 *    |---|
 *   3|   |1
 *    |---|
 *      2
 * @param X
 * @param Y
 * @param nCurPage
 * @returns {{Pos: {Row, Cell}, Border: number, Row: number, RowSelection: boolean, ColumnSelection: boolean, CellSelection: boolean}}
 */
CTable.prototype.private_CheckHitInBorder = function(X, Y, nCurPage)
{
	// Сначала определим ячейку, у которой границы мы будем проверять
	var oCellPos = this.Internal_GetCellByXY(X, Y, nCurPage);

	var oResult = {
		Pos             : oCellPos,
		Border          : -1,
		Row             : oCellPos.Row,
		RowSelection    : false,
		ColumnSelection : false,
		CellSelection   : false
	};

	var nCurRow  = oCellPos.Row;
	var nCurCell = oCellPos.Cell;

	var oRow      = this.GetRow(nCurRow);
	var oCell     = oRow.GetCell(nCurCell);
	var oCellInfo = oRow.GetCellInfo(nCurCell);

	var nVMergeCount       = this.GetVMergeCount(nCurCell, nCurRow);
	var nVMergeCountOnPage = this.private_GetVertMergeCountOnPage(nCurPage, nCurRow, oCellInfo.StartGridCol, oCell.GetGridSpan());
	if (nVMergeCountOnPage <= 0)
		return oResult;

	var oPage = this.Pages[nCurPage];

	var X_cell_start = oPage.X + oCellInfo.X_grid_start;
	var X_cell_end   = oPage.X + oCellInfo.X_grid_end;

	var Y_cell_start = this.RowsInfo[nCurRow].Y[nCurPage];
	var Y_cell_end   = this.RowsInfo[nCurRow + nVMergeCountOnPage - 1].Y[nCurPage] + this.RowsInfo[nCurRow + nVMergeCountOnPage - 1].H[nCurPage];

	var nRadius = this.DrawingDocument.GetMMPerDot(3); // 3 px

	if (Y <= Y_cell_start + nRadius && Y >= Y_cell_start - nRadius)
	{
		oResult.Border = 0;
	}
	else if (Y <= Y_cell_end + nRadius && Y >= Y_cell_end - nRadius)
	{
		if (nVMergeCountOnPage !== nVMergeCount)
		{
			oResult.Border = -1;
		}
		else
		{
			oResult.Border = 2;
			oResult.Row    = nCurRow + nVMergeCount - 1;
		}
	}
	else if (X <= X_cell_start + nRadius && X >= X_cell_start - nRadius)
	{
		oResult.Border = 3;
	}
	else if (X <= X_cell_end + nRadius && X >= X_cell_end - nRadius)
	{
		oResult.Border = 1;
	}

	if (0 === nCurCell && X <= X_cell_start)
	{
		oResult.RowSelection = true;
		oResult.Border       = -1;
	}
	else if (0 === nCurRow && Y <= Y_cell_start + nRadius)
	{
		oResult.ColumnSelection = true;
		oResult.Border          = -1;
	}
	else if (X_cell_start + nRadius <= X && X <= X_cell_end)
	{
		var oLeftMargin   = oCell.GetMargins().Left;
		var nCellSpacing  = oRow.GetCellSpacing();
		var nSpacingShift = null === nCellSpacing ? 0 : nCellSpacing / 2;

		if (X <= X_cell_start + nSpacingShift + oLeftMargin.W)
		{
			oResult.CellSelection = true;
			oResult.Border        = -1;
		}
	}

	return oResult;
};
/**
 * Обновляем массив выделенных ячеек
 * @param {boolean} [bForceSelectByLines=false] использовать ли выделение по строкам
 */
CTable.prototype.private_UpdateSelectedCellsArray = function(bForceSelectByLines)
{
	if (undefined === bForceSelectByLines)
		bForceSelectByLines = false;

	this.Selection.Type = table_Selection_Cell;
	this.Selection.Data = [];

	if (this.Parent.IsSelectedSingleElement() && false == bForceSelectByLines)
	{
		// Определяем ячейки, которые попали в наш селект
		// Алгоритм следующий:
		//  1. Находим максимальную левую и правую границы, у начальной и конечной
		//     ячеек селекта. Границы мы находим по сетке таблицы (TableGrid).
		//  2. Бежим по строкам и добавляем все ячейки, которые имеют непустое пересечение
		//     с нашим диапазоном в сетке.

		var StartRow  = this.Selection.StartPos.Pos.Row;
		var StartCell = this.Selection.StartPos.Pos.Cell;
		var EndRow    = this.Selection.EndPos.Pos.Row;
		var EndCell   = this.Selection.EndPos.Pos.Cell;

		if (EndRow < StartRow)
		{
			var TempRow = StartRow;
			StartRow    = EndRow;
			EndRow      = TempRow;

			var TempCell = StartCell;
			StartCell    = EndCell;
			EndCell      = TempCell;
		}

		if (StartRow === EndRow)
		{
			if (EndCell < StartCell)
			{
				var TempCell = StartCell;
				StartCell    = EndCell;
				EndCell      = TempCell;
			}

			var Row = this.Content[StartRow];
			for (var CurCell = StartCell; CurCell <= EndCell; CurCell++)
			{
				var Cell   = Row.Get_Cell(CurCell);
				var Vmerge = Cell.GetVMerge();

				// Обсчет такик ячеек произошел ранее
				if (vmerge_Continue === Vmerge)
					continue;

				this.Selection.Data.push({Row : StartRow, Cell : CurCell});
			}
		}
		else
		{
			var Cell_s = this.Content[StartRow].Get_Cell(StartCell);
			var Cell_e = this.Content[EndRow].Get_Cell(EndCell);

			var GridCol_cs_start = this.Content[StartRow].Get_StartGridCol(StartCell);
			var GridCol_cs_end   = Cell_s.Get_GridSpan() - 1 + GridCol_cs_start;
			var GridCol_ce_start = this.Content[EndRow].Get_StartGridCol(EndCell);
			var GridCol_ce_end   = Cell_e.Get_GridSpan() - 1 + GridCol_ce_start;

			var GridCol_start = GridCol_cs_start;
			if (GridCol_ce_start < GridCol_start)
				GridCol_start = GridCol_ce_start;

			var GridCol_end = GridCol_cs_end;
			if (GridCol_end < GridCol_ce_end)
				GridCol_end = GridCol_ce_end;

			// Ориентируемся не только по логическому расположению колонок, но и по визуальному:
			// если между колонками расстояние меньше 6 твипсов (примерно 0.1мм), тогда они визуально сольются в
			// одну колонку, поэтому нам нужно учесть эту погрешность, при учете попадания колонки в селект.
			// Расстояние 6 твипсов получено с учетом максимального зума в 500%

			var nMaxError = 0.1;
			while (GridCol_start < this.TableSumGrid.length - 1 && GridCol_start < GridCol_end)
			{
				if (this.TableSumGrid[GridCol_start] - this.TableSumGrid[GridCol_start - 1] < nMaxError)
				{
					nMaxError -= this.TableSumGrid[GridCol_start] - this.TableSumGrid[GridCol_start - 1];
					GridCol_start++;
				}
				else
				{
					break;
				}
			}

			nMaxError = 0.1;
			while (GridCol_end > 0  && GridCol_end > GridCol_start)
			{
				if (this.TableSumGrid[GridCol_end] - this.TableSumGrid[GridCol_end - 1] < nMaxError)
				{
					nMaxError -= this.TableSumGrid[GridCol_end] - this.TableSumGrid[GridCol_end - 1];
					GridCol_end--;
				}
				else
				{
					break;
				}
			}

			for (var CurRow = StartRow; CurRow <= EndRow; CurRow++)
			{
				var Row        = this.Content[CurRow];
				var BeforeInfo = Row.Get_Before();
				var CurGridCol = BeforeInfo.GridBefore;
				var CellsCount = Row.Get_CellsCount();
				for (var CurCell = 0; CurCell < CellsCount; CurCell++)
				{
					var Cell     = Row.Get_Cell(CurCell);
					var GridSpan = Cell.Get_GridSpan();
					var Vmerge   = Cell.GetVMerge();

					// Обсчет такик ячеек произошел ранее
					if (vmerge_Continue === Vmerge)
					{
						CurGridCol += GridSpan;
						continue;
					}

					// У первой строки мы не селектим ячейки до начальной.
					// Аналогично, у последней строки мы не селектим ничего после
					// конечной ячейки.
					if (( StartRow === CurRow /*&& CurCell >= StartCell*/ ) || ( EndRow === CurRow /*&& CurCell <= EndCell*/ ) || ( CurRow > StartRow && CurRow < EndRow ))
					{
						if (( CurGridCol >= GridCol_start && CurGridCol <= GridCol_end ) || ( CurGridCol + GridSpan - 1 >= GridCol_start && CurGridCol + GridSpan - 1 <= GridCol_end ))
							this.Selection.Data.push({Row : CurRow, Cell : CurCell});
					}

					CurGridCol += GridSpan;
				}
			}
		}
	}
	else
	{
		var RowsCount = this.Content.length;

		var StartRow = Math.min(Math.max(0, this.Selection.StartPos.Pos.Row), RowsCount - 1);
		var EndRow   = Math.min(Math.max(0, this.Selection.EndPos.Pos.Row), RowsCount - 1);

		if (EndRow < StartRow)
		{
			var TempRow = StartRow;
			StartRow    = EndRow;
			EndRow      = TempRow;
		}

		for (var CurRow = StartRow; CurRow <= EndRow; CurRow++)
		{
			var Row        = this.Content[CurRow];
			var CellsCount = Row.Get_CellsCount();
			for (var CurCell = 0; CurCell < CellsCount; CurCell++)
			{
				var Cell   = Row.Get_Cell(CurCell);
				var Vmerge = Cell.GetVMerge();

				if (vmerge_Continue === Vmerge)
					continue;

				this.Selection.Data.push({Row : CurRow, Cell : CurCell});
			}
		}
	}

	if (this.Selection.Data.length > 1)
		this.Selection.CurRow = this.Selection.Data[this.Selection.Data.length - 1].Row;

	// В "flow" таблице обновляем значения настроек для параграфа и текста
	if (true != this.Is_Inline() && true === this.Selection.Use && false === this.Selection.Start)
	{
		var ParaPr = this.GetCalculatedParaPr();
		if (null != ParaPr)
			editor.UpdateParagraphProp(ParaPr);

		var TextPr = this.GetCalculatedTextPr();
		if (null != TextPr)
			editor.UpdateTextPr(TextPr);
	}
};
CTable.prototype.Internal_CompareBorders2 = function(Border1, Border2)
{
	var ResultBorder = new CDocumentBorder();
	if (Border1.Value != Border2.Value)
		ResultBorder.Value = undefined;
	else
		ResultBorder.Value = Border1.Value;

	if (Border1.Size != Border2.Size)
		ResultBorder.Size = undefined;
	else
		ResultBorder.Size = Border1.Size;

	if (undefined === Border1.Color || undefined === Border2.Color || Border1.Color.r != Border2.Color.r || Border1.Color.g != Border2.Color.g || Border1.Color.b != Border2.Color.b)
		ResultBorder.Color = undefined;
	else
		ResultBorder.Color.Set(Border1.Color.r, Border1.Color.g, Border1.Color.b);

	return ResultBorder;
};
CTable.prototype.Internal_CompareBorders3 = function(Border1, Border2)
{
	if (Border1.Value != Border2.Value)
		return false;

	if (Border1.Size != Border2.Size)
		return false;

	if (Border1.Color.r != Border2.Color.r || Border1.Color.g != Border2.Color.g || Border1.Color.b != Border2.Color.b)
		return false;

	return true;
};
CTable.prototype.Internal_CheckNullBorder = function(Border)
{
	if (null === Border || undefined === Border)
		return true;

	if (null != Border.Value)
		return false;

	if (null != Border.Size)
		return false;

	if (null != Border.Color && ( null != Border.Color.r || null != Border.Color.g || null != Border.Color.b ) || Border.Unifill != null)
		return false;

	return true;
};
CTable.prototype.Internal_Get_TableMinWidth = function()
{
	var MinWidth = 0;
	// Оценим минимально возможную ширину
	for (var CurRow = 0; CurRow < this.Content.length; CurRow++)
	{
		var Row         = this.Content[CurRow];
		var Cells_Count = Row.Get_CellsCount();

		var CellSpacing = Row.Get_CellSpacing();
		if (null === CellSpacing)
			CellSpacing = 0;

		var RowWidth = CellSpacing * ( Cells_Count + 1 );

		for (var CurCell = 0; CurCell < Cells_Count; CurCell++)
		{
			var Cell         = Row.Get_Cell(CurCell);
			var Cell_Margins = Cell.GetMargins();

			RowWidth += Cell_Margins.Left.W + Cell_Margins.Right.W;
		}

		if (MinWidth < RowWidth)
			MinWidth = RowWidth;
	}

	return MinWidth;
};
/**
 * Рассчитываем минимальные знаяения для сетки таблицы
 * @returns {Array}
 */
CTable.prototype.private_GetMinGrid = function()
{
	var nColsCount = this.TableGrid.length;
	var arrSumGrid = [];
	for (var nIndex = -1; nIndex < nColsCount; ++nIndex)
	{
		arrSumGrid[nIndex] = 0;
	}

	var arrMinCols = [];
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow         = this.GetRow(nCurRow);
		var nCellSpacing = oRow.GetCellSpacing();
		if (null === nCellSpacing)
			nCellSpacing = 0;

		var nCurGridCol = 0;

		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell        = oRow.GetCell(nCurCell);
			var oCellMargins = oCell.GetMargins();
			var nGridSpan    = oCell.GetGridSpan();

			var nCellMinWidth = oCellMargins.Left.W + oCellMargins.Right.W;

			if (0 === nCurCell || nCellsCount - 1 === nCurCell)
				nCellMinWidth += nCellSpacing * 1.5;
			else
				nCellMinWidth += nCellSpacing;

			if (!arrMinCols[nGridSpan])
				arrMinCols[nGridSpan] = [];

			arrMinCols[nGridSpan].push({Col : nCurGridCol, W : nCellMinWidth});

			nCurGridCol += nGridSpan;
		}
	}

	for (var nGridSpan = 0; nGridSpan < nColsCount; ++nGridSpan)
	{
		var arrCols = arrMinCols[nGridSpan];
		if (arrCols)
		{
			for (var nIndex = 0, nCount = arrCols.length; nIndex < nCount; ++nIndex)
			{
				var nCurGridCol = arrCols[nIndex].Col;
				var nMinW       = arrCols[nIndex].W;

				if (arrSumGrid[nCurGridCol + nGridSpan - 1] < arrSumGrid[nCurGridCol - 1] + nMinW)
				{
					var nDiff = arrSumGrid[nCurGridCol - 1] + nMinW - arrSumGrid[nCurGridCol + nGridSpan - 1];
					for (var nCol = nCurGridCol + nGridSpan - 1; nCol < nColsCount; ++nCol)
					{
						arrSumGrid[nCol] += nDiff;
					}
				}
			}
		}
	}

	var arrTableGridMin = [];
	arrTableGridMin[0]  = arrSumGrid[0];
	for (var nIndex = 1, nCount = arrSumGrid.length; nIndex < nCount; ++nIndex)
		arrTableGridMin[nIndex] = arrSumGrid[nIndex] - arrSumGrid[nIndex - 1];

	return arrTableGridMin;
};
CTable.prototype.Internal_ScaleTableWidth = function(SumGrid, TableW)
{
	// Массив означает, какие колонки таблицы нам надо изменить
	var Grids_to_scale = [];
	for (var Index = 0; Index < SumGrid.length; Index++)
		Grids_to_scale[Index] = true;

	var Grids_to_scale_count = Grids_to_scale.length;

	var TableGrid = [];
	TableGrid[0]  = SumGrid[0];
	for (var Index = 1; Index < SumGrid.length; Index++)
		TableGrid[Index] = SumGrid[Index] - SumGrid[Index - 1];

	var TableGrid_min = this.private_GetMinGrid();

	var CurrentW = SumGrid[SumGrid.length - 1];
	while (Grids_to_scale_count > 0 && CurrentW > 0.001)
	{
		// Пробуем ужать колонки таблицы
		var Koef = TableW / CurrentW;

		var TableGrid_cur = [];
		for (var Index = 0; Index < TableGrid.length; Index++)
			TableGrid_cur[Index] = TableGrid[Index];

		for (var AddIndex = 0; AddIndex <= TableGrid_cur.length - 1; AddIndex++)
		{
			if (true === Grids_to_scale[AddIndex])
				TableGrid_cur[AddIndex] = TableGrid_cur[AddIndex] * Koef;
		}

		var bBreak = true;

		// Проверяем, не стали ли некоторые колонки меньше минимально возможной ширины
		for (var AddIndex = 0; AddIndex <= TableGrid_cur.length - 1; AddIndex++)
		{
			if (true === Grids_to_scale[AddIndex] && TableGrid_cur[AddIndex] - TableGrid_min[AddIndex] < 0.001)
			{
				bBreak                   = false;
				Grids_to_scale[AddIndex] = false;
				Grids_to_scale_count--;

				CurrentW -= TableGrid[AddIndex];
				TableW -= TableGrid_min[AddIndex];

				TableGrid[AddIndex] = TableGrid_min[AddIndex];
			}
		}

		if (true === bBreak)
		{
			for (var AddIndex = 0; AddIndex <= TableGrid_cur.length - 1; AddIndex++)
			{
				if (true === Grids_to_scale[AddIndex])
					TableGrid[AddIndex] = TableGrid_cur[AddIndex];
			}

			break;
		}
	}

	var SumGrid_new = [];
	SumGrid_new[-1] = 0;
	for (var Index = 0; Index < TableGrid.length; Index++)
		SumGrid_new[Index] = TableGrid[Index] + SumGrid_new[Index - 1];

	return SumGrid_new;
};
CTable.prototype.Internal_Get_NextCell = function(Pos)
{
	var Cell_Index = Pos.Cell;
	var Row_Index  = Pos.Row;

	if (Cell_Index < this.Content[Row_Index].Get_CellsCount() - 1)
	{
		Pos.Cell = Cell_Index + 1;
		return this.Content[Pos.Row].Get_Cell(Pos.Cell);
	}
	else if (Row_Index < this.Content.length - 1)
	{
		Pos.Row  = Row_Index + 1;
		Pos.Cell = 0;
		return this.Content[Pos.Row].Get_Cell(Pos.Cell);
	}
	else
		return null;
};
CTable.prototype.Internal_Get_PrevCell = function(Pos)
{
	var Cell_Index = Pos.Cell;
	var Row_Index  = Pos.Row;

	if (Cell_Index > 0)
	{
		Pos.Cell = Cell_Index - 1;
		return this.Content[Pos.Row].Get_Cell(Pos.Cell);
	}
	else if (Row_Index > 0)
	{
		Pos.Row  = Row_Index - 1;
		Pos.Cell = this.Content[Row_Index - 1].Get_CellsCount() - 1;
		return this.Content[Pos.Row].Get_Cell(Pos.Cell);
	}
	else
		return null;
};
CTable.prototype.Internal_Copy_Grid = function(Grid)
{
	if (undefined !== Grid && null !== Grid)
	{
		var Count   = Grid.length;
		var NewGrid = new Array(Count);
		var Index   = 0;
		for (; Index < Count; Index++)
			NewGrid[Index] = Grid[Index];

		return NewGrid;
	}

	return [];
};
CTable.prototype.private_UpdateTableRulerOnBorderMove = function(Pos)
{
	if (null != this.Selection.Data2.Min)
		Pos = Math.max(Pos, this.Selection.Data2.Min);

	if (null != this.Selection.Data2.Max)
		Pos = Math.min(Pos, this.Selection.Data2.Max);

	// Обновляем Markup по ячейке в которой мы двигаем границу. Так делаем, потому что мы можем находится изначально
	// на другой странице данной таблице, а там Markup может быть совершенно другим. В конце движения границы
	// произойдет обновление селекта, и Markup обновится по текущему положению курсора.
	this.private_UpdateTableMarkup(this.Selection.Data2.Pos.Row, this.Selection.Data2.Pos.Cell, this.Selection.Data2.PageNum);
	this.DrawingDocument.UpdateTableRuler(this.Selection.Data2.bCol, this.Selection.Data2.Index, Pos);

	return Pos;
};
/**
 * Получаем массив позиций ячеек, попавших в выделение
 * @param {boolean} isAddMergedCells - добавляем ли в массив смерженные вертикально ячейки
 * @returns {{Cell : number, Row : number}[]}
 */
CTable.prototype.GetSelectionArray = function(isAddMergedCells)
{
	var arrSelectionArray = [];
	if (true === this.ApplyToAll)
	{
		arrSelectionArray = [];
		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			var oRow = this.GetRow(nCurRow);
			for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
			{
				var oCell = oRow.GetCell(nCurCell);
				if (vmerge_Continue !== oCell.GetVMerge() || isAddMergedCells)
				{
					arrSelectionArray.push({
						Cell : nCurCell,
						Row  : nCurRow
					});
				}
			}
		}
	}
	else if (true === this.Selection.Use && table_Selection_Cell === this.Selection.Type)
	{
		arrSelectionArray = this.Selection.Data;

		if (isAddMergedCells)
		{
			for (var nIndex = 0, nCount = this.Selection.Data.length; nIndex < nCount; ++nIndex)
			{
				var nCurRow  = this.Selection.Data[nIndex].Row;
				var nCurCell = this.Selection.Data[nIndex].Cell;

				var oRow  = this.GetRow(nCurRow);
				var oCell = oRow.GetCell(nCurCell);

				var arrMergedCells = this.private_GetMergedCells(nCurRow, oRow.GetCellInfo(nCurCell).StartGridCol, oCell.GetGridSpan());
				for (var nMergeIndex = 0, nMergedCount = arrMergedCells.length; nMergeIndex < nMergedCount; ++nMergeIndex)
				{
					var nMCell = arrMergedCells[nMergeIndex].GetIndex();
					var nMRow  = arrMergedCells[nMergeIndex].GetRow().GetIndex();

					var isAdded = false;
					for (var nTempIndex = 0, nTempCount = arrSelectionArray.length; nTempIndex < nTempCount; ++nTempIndex)
					{
						if (nMRow === arrSelectionArray[nTempIndex].Row && nMCell === arrSelectionArray[nTempIndex].Cell)
						{
							isAdded = true;
							break;
						}
						else if (nMRow < arrSelectionArray[nTempIndex].Row || (nMRow === arrSelectionArray[nTempIndex].Row && nMCell < arrSelectionArray[nTempIndex].Cell))
						{
							isAdded = true;
							arrSelectionArray.splice(nTempIndex, 0, {
								Cell : nMCell,
								Row  : nMRow
							});
							break;
						}
					}

					if (!isAdded)
					{
						arrSelectionArray.push({
							Cell : nMCell,
							Row  : nMRow
						});
					}
				}
			}
		}
	}
	else if (this.CurCell)
	{
		arrSelectionArray = [{
			Cell : this.CurCell.Index,
			Row  : this.CurCell.Row.Index
		}];
	}

	return arrSelectionArray;
};
/**
 * Считаем количество соединенных вертикально ячеек на заданной странице
 */
CTable.prototype.private_GetVertMergeCountOnPage = function(CurPage, CurRow, StartGridCol, GridSpan)
{
	var VMergeCount = this.Internal_GetVertMergeCount(CurRow, StartGridCol, GridSpan);

	if (true !== this.IsEmptyPage(CurPage) && CurRow + VMergeCount - 1 >= this.Pages[CurPage].LastRow)
	{
		VMergeCount = this.Pages[CurPage].LastRow + 1 - CurRow;
		if (false === this.RowsInfo[CurRow + VMergeCount - 1].FirstPage && CurPage === this.RowsInfo[CurRow + VMergeCount - 1].StartPage)
			VMergeCount--;
	}

	return VMergeCount;
};
/**
 * Получаем отрезок выделенных строк
 * @returns {{Start: number, End: number}}
 */
CTable.prototype.GetSelectedRowsRange = function()
{
	var arrSelectedCells = this.GetSelectionArray();

	var nStartRow = -1,
		nEndRow   = -2;

	for (var nIndex = 0, nCount = arrSelectedCells.length; nIndex < nCount; ++nIndex)
	{
		var nRowIndex = arrSelectedCells[nIndex].Row;

		if (-1 === nStartRow || nStartRow > nRowIndex)
			nStartRow = nRowIndex;

		if (-1 === nEndRow || nEndRow < nRowIndex)
			nEndRow = nRowIndex;
	}

	return {
		Start : nStartRow,
		End   : nEndRow
	};
};
/**
 * Получаем количество строк в заголовке таблицы
 * @returns {number}
 */
CTable.prototype.GetRowsCountInHeader = function()
{
	var nRowsInHeader = 0;
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		if (true === this.Content[nCurRow].IsHeader())
			nRowsInHeader++;
		else
			break;
	}

	return nRowsInHeader;
};
CTable.prototype.Get_RowsCount = function()
{
    return this.Content.length;
};
CTable.prototype.Get_Row = function(Index)
{
    return this.Content[Index];
};
CTable.prototype.GetRowsCount = function()
{
	return this.Content.length;
};
/**
 * Получаем строку с заданным номером
 * @param {number} nIndex
 * @returns {CTableRow}
 */
CTable.prototype.GetRow = function(nIndex)
{
	return this.Get_Row(nIndex);
};
CTable.prototype.CompareDrawingsLogicPositions = function(CompareObject)
{
    for (var CurRow = 0, RowsCount = this.Get_RowsCount(); CurRow < RowsCount; CurRow++)
    {
        var Row = this.Get_Row(CurRow);
        for (var CurCell = 0, CellsCount = Row.Get_CellsCount(); CurCell < CellsCount; CurCell++)
        {
            var Cell = Row.Get_Cell(CurCell);
            Cell.Content.CompareDrawingsLogicPositions(CompareObject);

            if (0 !== CompareObject.Result)
                return;
        }
    }
};
CTable.prototype.StartSelectionFromCurPos = function()
{
	this.Selection.Use = true;

	this.Selection.StartPos.Pos = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
	this.Selection.EndPos.Pos   = {Cell : this.CurCell.Index, Row : this.CurCell.Row.Index};
	this.private_UpdateSelectedCellsArray();

	var oLogicDocument = this.LogicDocument;
	if (oLogicDocument)
	{
		var oRealPos              = oLogicDocument.GetCursorRealPosition();
		this.Selection.StartPos.X = oRealPos.X;
		this.Selection.StartPos.Y = oRealPos.Y;
	}

	// В функции private_UpdateSelectedCellsArray выставляется тип по ячеейкам, но нам нужен внутри ячейки изначальный селект
	this.Selection.Type   = table_Selection_Text;
	this.Selection.CurRow = this.CurCell.Row.Index;


	this.CurCell.Content.StartSelectionFromCurPos();
};
CTable.prototype.GetStyleFromFormatting = function()
{
    var SelectionArray = this.GetSelectionArray();
    if (SelectionArray.length > 0)
    {
        var Pos = SelectionArray[0];
        var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);
        return Cell.Content.GetStyleFromFormatting();
    }
    return null;
};
CTable.prototype.SetReviewType = function(ReviewType)
{

};
CTable.prototype.GetReviewType = function()
{
    return reviewtype_Common;
};
CTable.prototype.Get_SectPr = function()
{
    if (this.Parent && this.Parent.Get_SectPr)
    {
        this.Parent.Update_ContentIndexing();
        return this.Parent.Get_SectPr(this.Index);
    }

    return null;
};
CTable.prototype.IsSelectedAll = function()
{
	if (!this.IsCellSelection())
		return false;

	var nArrayPos         = 0;
	var arrSelectionArray = this.Selection.Data;
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell, ++nArrayPos)
		{
			if (nArrayPos >= arrSelectionArray.length)
				return false;

			var oPos = arrSelectionArray[nArrayPos];
			if (oPos.Row !== nCurRow || oPos.Cell !== nCurCell)
				return false;
		}
	}

	return true;
};
CTable.prototype.AcceptRevisionChanges = function(nType, bAll)
{
	var arrSelectionArray = this.GetSelectionArray();
	var nFirstRow         = arrSelectionArray.length > 0 ? arrSelectionArray[0].Row : 0;
	var isCellSelection   = this.IsCellSelection();
	var isAllSelected     = this.IsSelectedAll();

	if (bAll)
	{
		nFirstRow = 0;
		arrSelectionArray = [];
		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			var oRow = this.GetRow(nCurRow);
			for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
			{
				arrSelectionArray.push({Row : nCurRow, Cell : nCurCell});
			}
		}

		isAllSelected   = true;
		isCellSelection = true;
	}

	if ((bAll || (isCellSelection && !this.ApplyToAll)) && (undefined === nType || c_oAscRevisionsChangeType.TablePr === nType || c_oAscRevisionsChangeType.RowsAdd === nType || c_oAscRevisionsChangeType.RowsRem === nType))
	{
		if (isAllSelected && (undefined === nType || c_oAscRevisionsChangeType.TablePr === nType) && this.HavePrChange())
		{
			this.AcceptPrChange();
		}

		var arrSelectedRows = [];
		for (var nIndex = arrSelectionArray.length - 1; nIndex >= 0; --nIndex)
		{
			var nCurRow = arrSelectionArray[nIndex].Row;
			if (arrSelectedRows.length <= 0 || arrSelectedRows[arrSelectedRows.length - 1] > nCurRow)
				arrSelectedRows.push(nCurRow);
		}

		for (var nSelectedRowIndex = 0, nSelectedRowsCount = arrSelectedRows.length; nSelectedRowIndex < nSelectedRowsCount; ++nSelectedRowIndex)
		{
			var nCurRow        = arrSelectedRows[nSelectedRowIndex];
			var oRow           = this.GetRow(nCurRow);
			var nRowReviewType = oRow.GetReviewType();
			if (reviewtype_Add === nRowReviewType && (undefined === nType || c_oAscRevisionsChangeType.RowsAdd === nType))
			{
				oRow.SetReviewType(reviewtype_Common);
			}
			else if (reviewtype_Remove === nRowReviewType && (undefined === nType || c_oAscRevisionsChangeType.RowsRem === nType))
			{
				oRow.SetReviewType(reviewtype_Common);
				this.private_RemoveRow(nCurRow);

				for (var nIndex = arrSelectionArray.length - 1; nIndex >= 0; --nIndex)
				{
					if (arrSelectionArray[nIndex].Row === nCurRow)
					{
						arrSelectionArray.splice(nIndex, 1);
					}
					else if (arrSelectionArray[nIndex].Row > nCurRow)
					{
						arrSelectionArray[nIndex].Row--;
					}
				}
			}
		}
	}

	if (this.GetRowsCount() <= 0)
		return;

	if (arrSelectionArray.length <= 0)
	{
		this.RemoveSelection();
		var nCurRow = nFirstRow < this.GetRowsCount() ? nFirstRow : this.GetRowsCount() - 1;
		this.CurCell = this.GetRow(nCurRow).GetCell(0);
		this.Document_SetThisElementCurrent(false);
	}
	else
	{
		if (isCellSelection)
			this.SelectRows(arrSelectionArray[0].Row, arrSelectionArray[arrSelectionArray.length - 1].Row);
		else
			this.CurCell = this.GetRow(arrSelectionArray[0].Row).GetCell(arrSelectionArray[0].Cell);
	}

	if (!bAll && this.IsCellSelection() && (c_oAscRevisionsChangeType.TablePr === nType || c_oAscRevisionsChangeType.RowsAdd === nType || c_oAscRevisionsChangeType.RowsRem === nType))
		return;

	for (var nIndex = 0, nCount = arrSelectionArray.length; nIndex < nCount; ++nIndex)
	{
		var oRow  = this.GetRow(arrSelectionArray[nIndex].Row);
		var oCell = oRow.GetCell(arrSelectionArray[nIndex].Cell);

		var oCellContent = oCell.GetContent();
		if (isCellSelection)
			oCellContent.SelectAll();

		oCell.GetContent().AcceptRevisionChanges(nType, bAll);

		if (isCellSelection)
			oCellContent.RemoveSelection();
	}
};
CTable.prototype.RejectRevisionChanges = function(nType, bAll)
{
	var arrSelectionArray = this.GetSelectionArray();
	var nFirstRow         = arrSelectionArray.length > 0 ? arrSelectionArray[0].Row : 0;
	var isCellSelection   = this.IsCellSelection();
	var isAllSelected     = this.IsSelectedAll();

	if (bAll)
	{
		nFirstRow = 0;
		arrSelectionArray = [];
		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			var oRow = this.GetRow(nCurRow);
			for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
			{
				arrSelectionArray.push({Row : nCurRow, Cell : nCurCell});
			}
		}

		isAllSelected   = true;
		isCellSelection = true;
	}

	if ((bAll || (this.IsCellSelection() && !this.ApplyToAll)) && (undefined === nType || c_oAscRevisionsChangeType.TablePr === nType || c_oAscRevisionsChangeType.RowsAdd === nType || c_oAscRevisionsChangeType.RowsRem === nType))
	{
		if (isAllSelected && (undefined === nType || c_oAscRevisionsChangeType.TablePr === nType) && this.HavePrChange())
		{
			this.RejectPrChange();
		}

		var arrSelectedRows = [];
		for (var nIndex = arrSelectionArray.length - 1; nIndex >= 0; --nIndex)
		{
			var nCurRow = arrSelectionArray[nIndex].Row;
			if (arrSelectedRows.length <= 0 || arrSelectedRows[arrSelectedRows.length - 1] > nCurRow)
				arrSelectedRows.push(nCurRow);
		}

		for (var nSelectedRowIndex = 0, nSelectedRowsCount = arrSelectedRows.length; nSelectedRowIndex < nSelectedRowsCount; ++nSelectedRowIndex)
		{
			var nCurRow        = arrSelectedRows[nSelectedRowIndex];
			var oRow           = this.GetRow(nCurRow);
			var nRowReviewType = oRow.GetReviewType();
			if (reviewtype_Add === nRowReviewType && (undefined === nType || c_oAscRevisionsChangeType.RowsAdd === nType))
			{
				oRow.SetReviewType(reviewtype_Common);
				this.private_RemoveRow(nCurRow);

				for (var nIndex = arrSelectionArray.length - 1; nIndex >= 0; --nIndex)
				{
					if (arrSelectionArray[nIndex].Row === nCurRow)
					{
						arrSelectionArray.splice(nIndex, 1);
					}
					else if (arrSelectionArray[nIndex].Row > nCurRow)
					{
						arrSelectionArray[nIndex].Row--;
					}
				}
			}
			else if (reviewtype_Remove === nRowReviewType && (undefined === nType || c_oAscRevisionsChangeType.RowsRem === nType))
			{
				oRow.SetReviewType(reviewtype_Common);
			}
		}
	}

	if (this.GetRowsCount() <= 0)
		return;

	if (arrSelectionArray.length <= 0)
	{
		this.RemoveSelection();
		var nCurRow = nFirstRow < this.GetRowsCount() ? nFirstRow : this.GetRowsCount() - 1;
		this.CurCell = this.GetRow(nCurRow).GetCell(0);
		this.Document_SetThisElementCurrent(false);
	}
	else
	{
		if (isCellSelection)
			this.SelectRows(arrSelectionArray[0].Row, arrSelectionArray[arrSelectionArray.length - 1].Row);
		else
			this.CurCell = this.GetRow(arrSelectionArray[0].Row).GetCell(arrSelectionArray[0].Cell);
	}

	if (!bAll && this.IsCellSelection() && (c_oAscRevisionsChangeType.TablePr === nType || c_oAscRevisionsChangeType.RowsAdd === nType || c_oAscRevisionsChangeType.RowsRem === nType))
		return;

	for (var nIndex = 0, nCount = arrSelectionArray.length; nIndex < nCount; ++nIndex)
	{
		var oRow  = this.GetRow(arrSelectionArray[nIndex].Row);
		var oCell = oRow.GetCell(arrSelectionArray[nIndex].Cell);

		var oCellContent = oCell.GetContent();
		if (isCellSelection)
			oCellContent.SelectAll();

		oCell.GetContent().RejectRevisionChanges(nType, bAll);

		if (isCellSelection)
			oCellContent.RemoveSelection();
	}
};
CTable.prototype.GetRevisionsChangeElement = function(oSearchEngine)
{
	if (true === oSearchEngine.IsFound())
		return;

	if (!oSearchEngine.IsCurrentFound())
	{
		if (this === oSearchEngine.GetCurrentElement())
		{
			oSearchEngine.SetCurrentFound();
			if (oSearchEngine.GetDirection() < 0)
				return;
		}
	}
	else if (oSearchEngine.GetDirection() > 0)
	{
		oSearchEngine.SetFoundedElement(this);
		if (true === oSearchEngine.IsFound())
			return;
	}

	var nCurCell = 0, nCurRow = 0;
	if (!oSearchEngine.IsCurrentFound())
	{
		var arrSelectedCells = this.GetSelectionArray();
		if (arrSelectedCells.length <= 0)
			return;

		nCurRow  = arrSelectedCells[0].Row;
		nCurCell = arrSelectedCells[0].Cell;
	}
	else
	{
		if (oSearchEngine.GetDirection() > 0)
		{
			nCurRow  = 0;
			nCurCell = 0;
		}
		else
		{
			nCurRow  = this.GetRowsCount() - 1;
			nCurCell = this.GetRow(nCurRow).GetCellsCount() - 1;
		}
	}

	var oCell = this.GetRow(nCurRow).GetCell(nCurCell);

	while (oCell && vmerge_Restart !== oCell.GetVMerge())
	{
		oCell = this.private_GetPrevCell(nCurRow, nCurCell);
	}

	oCell.GetContent().GetRevisionsChangeElement(oSearchEngine);
	while (!oSearchEngine.IsFound())
	{
		if (oSearchEngine.GetDirection() > 0)
		{
			oCell = this.private_GetNextCell(oCell.GetRow().GetIndex(), oCell.GetIndex());
			while (oCell && vmerge_Restart !== oCell.GetVMerge())
			{
				oCell = this.private_GetNextCell(oCell.GetRow().GetIndex(), oCell.GetIndex());
			}
		}
		else
		{
			oCell = this.private_GetPrevCell(oCell.GetRow().GetIndex(), oCell.GetIndex());
			while (oCell && vmerge_Restart !== oCell.GetVMerge())
			{
				oCell = this.private_GetPrevCell(oCell.GetRow().GetIndex(), oCell.GetIndex());
			}
		}

		if (!oCell)
			break;

		oCell.GetContent().GetRevisionsChangeElement(oSearchEngine);
	}

	if (!oSearchEngine.IsFound() && oSearchEngine.GetDirection() < 0)
	{
		oSearchEngine.SetFoundedElement(this);
	}
};
CTable.prototype.private_GetNextCell = function(RowIndex, CellIndex)
{
    return this.Internal_Get_NextCell({Cell : CellIndex, Row : RowIndex});
};
CTable.prototype.private_GetPrevCell = function(RowIndex, CellIndex)
{
    return this.Internal_Get_PrevCell({Cell : CellIndex, Row : RowIndex});
};
CTable.prototype.Check_ChangedTableGrid = function()
{
    var TableGrid_old = this.Internal_Copy_Grid(this.TableGridCalc);
    this.private_RecalculateGrid();
    var TableGrid_new = this.TableGridCalc;
    for (var CurCol = 0, ColsCount = this.TableGridCalc.length; CurCol < ColsCount; CurCol++)
    {
        if (Math.abs(TableGrid_old[CurCol] - TableGrid_new[CurCol]) > 0.001)
        {
            this.RecalcInfo.TableBorders = true;
            return true;
        }
    }

    return false;
};
CTable.prototype.GetContentPosition = function(bSelection, bStart, PosArray)
{
    if (!PosArray)
        PosArray = [];

    var CurRow  = (true === bSelection ? (true === bStart ? this.Selection.StartPos.Pos.Row  : this.Selection.EndPos.Pos.Row)  : this.CurCell.Row.Index);
    var CurCell = (true === bSelection ? (true === bStart ? this.Selection.StartPos.Pos.Cell : this.Selection.EndPos.Pos.Cell) : this.CurCell.Index);

    var Row = this.Get_Row(CurRow);
    PosArray.push({Class : this, Position : CurRow, Type : this.Selection.Type, Type2 : this.Selection.Type2});
    PosArray.push({Class : this.Get_Row(CurRow), Position : CurCell});

    if (Row && CurCell >= 0 && CurCell < Row.Get_CellsCount())
    {
        var Cell = Row.Get_Cell(CurCell);
        Cell.Content.GetContentPosition(bSelection, bStart, PosArray);
    }

    return PosArray;
};
CTable.prototype.Get_Index = function()
{
    if (!this.Parent)
        return -1;

    this.Parent.Update_ContentIndexing();
    return this.Index;
};
CTable.prototype.SetContentSelection = function(StartDocPos, EndDocPos, Depth, StartFlag, EndFlag)
{
    if ((0 === StartFlag && (!StartDocPos[Depth] || this !== StartDocPos[Depth].Class)) || (0 === EndFlag && (!EndDocPos[Depth] || this !== EndDocPos[Depth].Class)))
        return;

    var isOneElement = true;
    var StartRow = 0;
    switch (StartFlag)
    {
        case 0 : StartRow = StartDocPos[Depth].Position; break;
        case 1 : StartRow = 0; isOneElement = false; break;
        case -1: StartRow = this.Content.length - 1; isOneElement = false; break;
    }

    var EndRow = 0;
    switch (EndFlag)
    {
        case 0 : EndRow = EndDocPos[Depth].Position; break;
        case 1 : EndRow = 0; isOneElement = false; break;
        case -1: EndRow = this.Content.length - 1; isOneElement = false; break;
    }

    var _StartDocPos = StartDocPos, _StartFlag = StartFlag;
    if (null !== StartDocPos && true === StartDocPos[Depth].Deleted)
    {
        if (StartRow < this.Content.length)
        {
            _StartDocPos = null;
            _StartFlag = 1;
        }
        else if (StartRow > 0)
        {
            StartRow--;
            _StartDocPos = null;
            _StartFlag = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    var _EndDocPos = EndDocPos, _EndFlag = EndFlag;
    if (null !== EndDocPos && true === EndDocPos[Depth].Deleted)
    {
        if (EndRow < this.Content.length)
        {
            _EndDocPos = null;
            _EndFlag = 1;
        }
        else if (EndRow > 0)
        {
            EndRow--;
            _EndDocPos = null;
            _EndFlag = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    var StartCell = 0;
    switch (_StartFlag)
    {
        case 0 : StartCell = _StartDocPos[Depth + 1].Position; break;
        case 1 : StartCell = 0; break;
        case -1: StartCell = this.Content[StartRow].Get_CellsCount() - 1; break;
    }

    var EndCell = 0;
    switch (_EndFlag)
    {
        case 0 : EndCell = _EndDocPos[Depth + 1].Position; break;
        case 1 : EndCell = 0; break;
        case -1: EndCell = this.Content[EndRow].Get_CellsCount() - 1; break;
    }

    var __StartDocPos = _StartDocPos, __StartFlag = _StartFlag;
    if (null !== _StartDocPos && true === _StartDocPos[Depth + 1].Deleted)
    {
        if (StartCell < this.Content[StartRow].Get_CellsCount())
        {
            __StartDocPos = null;
            __StartFlag = 1;
        }
        else if (StartCell > 0)
        {
            StartCell--;
            __StartDocPos = null;
            __StartFlag = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    var __EndDocPos = _EndDocPos, __EndFlag = _EndFlag;
    if (null !== _EndDocPos && true === _EndDocPos[Depth + 1].Deleted)
    {
        if (EndCell < this.Content[EndCell].Get_CellsCount())
        {
            __EndDocPos = null;
            __EndFlag   = 1;
        }
        else if (EndCell > 0)
        {
            EndCell--;
            __EndDocPos = null;
            __EndFlag   = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    this.Selection.Use          = true;
    this.Selection.StartPos.Pos = {Row : StartRow, Cell : StartCell};
    this.Selection.EndPos.Pos   = {Row : EndRow, Cell : EndCell};
    this.Selection.CurRow       = EndRow;
    this.Selection.Data         = null;
    this.Selection.Type2        = table_Selection_Common;
    this.Selection.Data2        = null;

    if (StartRow === EndRow && StartCell === EndCell && null !== __StartDocPos && null !== __EndDocPos)
    {
        this.CurCell = this.Get_Row(StartRow).Get_Cell(StartCell);
        this.Selection.Type = table_Selection_Text;
        this.CurCell.Content.SetContentSelection(__StartDocPos, __EndDocPos, Depth + 2, __StartFlag, __EndFlag);
    }
    else
    {
        this.Selection.Type = table_Selection_Cell;
        this.private_UpdateSelectedCellsArray(isOneElement ? false : true);
    }

    if (null !== EndDocPos && undefined !== EndDocPos[Depth].Type && undefined !== EndDocPos[Depth].Type2)
	{
		this.Selection.Type  = EndDocPos[Depth].Type;
		this.Selection.Type2 = EndDocPos[Depth].Type2;

		if (table_Selection_Cell === this.Selection.Type)
			this.private_UpdateSelectedCellsArray(!isOneElement || table_Selection_Rows === this.Selection.Type2 ? true : false);
	}
};
CTable.prototype.SetContentPosition = function(DocPos, Depth, Flag)
{
	if (this.GetRowsCount() <= 0)
		return;

    if (0 === Flag && (!DocPos[Depth] || this !== DocPos[Depth].Class))
        return;

    var CurRow = 0;
    switch (Flag)
    {
        case 0 : CurRow = DocPos[Depth].Position; break;
        case 1 : CurRow = 0; break;
        case -1: CurRow = this.Content.length - 1; break;
    }

    var _DocPos = DocPos, _Flag = Flag;
    if (null !== DocPos && true === DocPos[Depth].Deleted)
    {
        if (CurRow < this.Content.length)
        {
            _DocPos = null;
            _Flag = 1;
        }
        else if (CurRow > 0)
        {
            CurRow--;
            _DocPos = null;
            _Flag = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    if (CurRow >= this.GetRowsCount())
	{
		CurRow  = this.GetRowsCount() - 1;
		_DocPos = null;
		_Flag   = -1;
	}
	else if (CurRow < 0)
	{
		CurRow  = 0;
		_DocPos = null;
		_Flag   = 1;
	}

	var Row = this.GetRow(CurRow);
    if (!Row)
    	return;

    var CurCell = 0;
    switch (_Flag)
    {
        case 0 : CurCell = _DocPos[Depth + 1].Position; break;
        case 1 : CurCell = 0; break;
        case -1: CurCell = Row.GetCellsCount() - 1; break;
    }

    var __DocPos = _DocPos, __Flag = _Flag;
    if (null !== _DocPos && true === _DocPos[Depth + 1].Deleted)
    {
        if (CurCell < Row.GetCellsCount())
        {
            __DocPos = null;
            __Flag = 1;
        }
        else if (CurCell > 0)
        {
            CurCell--;
            __DocPos = null;
            __Flag = -1;
        }
        else
        {
            // Такого не должно быть
            return;
        }
    }

    if (CurCell >= Row.GetCellsCount())
	{
		CurCell  = Row.GetCellsCount() - 1;
		__DocPos = null;
		__Flag   = -1;
	}
	else if (CurCell < 0)
	{
		CurCell  = 0;
		__DocPos = null;
		__Flag   = 1;
	}

    var Cell = Row.GetCell(CurCell);
    if (!Cell)
        return;

    this.CurCell = Cell;
    this.CurCell.Content.SetContentPosition(__DocPos, Depth + 2, __Flag);
};
CTable.prototype.Set_CurCell = function(Cell)
{
    if (!Cell || this !== Cell.Get_Table())
        return;

    this.CurCell = Cell;
};
CTable.prototype.IsEmptyPage = function(CurPage)
{
    if (!this.Pages[CurPage]
        || (this.Pages[CurPage].LastRow < this.Pages[CurPage].FirstRow)
        || (0 === CurPage && (!this.RowsInfo[0] || true !== this.RowsInfo[0].FirstPage)))
        return true;

    return false;
};
CTable.prototype.Check_EmptyPages = function(CurPage)
{
    for (var _CurPage = CurPage; _CurPage >= 0; --_CurPage)
    {
        if (true !== this.IsEmptyPage(_CurPage))
            return false;
    }

    return true;
};
CTable.prototype.private_StartTrackTable = function(CurPage)
{
    if (CurPage < 0 || CurPage >= this.Pages.length)
        return;

    var Bounds     = this.Get_PageBounds(CurPage);
    var NewOutline = new AscCommon.CTableOutline(this, this.Get_AbsolutePage(CurPage), Bounds.Left, Bounds.Top, Bounds.Right - Bounds.Left, Bounds.Bottom - Bounds.Top);

    var Transform = this.Get_ParentTextTransform();
    this.DrawingDocument.StartTrackTable(NewOutline, Transform);
};
CTable.prototype.Correct_BadTable = function()
{
    // TODO: Пока оставим эту заглушку на случай загрузки плохих таблиц. В будущем надо будет
    //       сделать нормальный обсчет для случая, когда у нас есть "пустые" строки (составленные
    //       из вертикально объединенных ячеек).
    this.Internal_Check_TableRows(false);
	this.CorrectBadGrid();
	this.CorrectHMerge();
	this.CorrectVMerge();
};
/**
 * Специальная функция, которая обрабатывает устаревший параметр HMerge и заменяет его на GridSpan во время открытия файла
 */
CTable.prototype.CorrectHMerge = function()
{
	// HACK: При загрузке мы запрещаем компилировать стили, но нам все-таки это здесь нужно
	var bLoad = AscCommon.g_oIdCounter.m_bLoad;
	var bRead = AscCommon.g_oIdCounter.m_bRead;
	AscCommon.g_oIdCounter.m_bLoad = false;
	AscCommon.g_oIdCounter.m_bRead = false;

	var nColsCount = this.TableGrid.length;

	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);

		var nCurGridCol = oRow.GetBefore().Grid;
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.GetCell(nCurCell);

			var nGridSpan = oCell.GetGridSpan();

			var nWType    = oCell.GetW().Type;
			var nWValue   = oCell.GetW().W;

			if (nCurCell < nCellsCount - 1)
			{
				var nNextCurCell = nCurCell + 1;
				while (nNextCurCell < nCellsCount)
				{
					var oNextCell = oRow.GetCell(nNextCurCell);

					if (vmerge_Continue === oNextCell.GetHMerge())
					{
						nGridSpan += oNextCell.GetGridSpan();
						oRow.RemoveCell(nNextCurCell);
						nCellsCount--;
						nNextCurCell--;

						if (nWType === oNextCell.GetW().Type)
							nWValue += oNextCell.GetW().Value;
					}
					else
					{
						break;
					}

					nNextCurCell++;
				}
			}

			if (nGridSpan !== oCell.GetGridSpan())
			{
				if (nGridSpan + nCurGridCol > nColsCount)
					nGridSpan = Math.max(1, nColsCount - nCurGridCol);

				oCell.SetGridSpan(nGridSpan);
				oCell.SetW(new CTableMeasurement(nWType, nWValue));
			}

			nCurGridCol += nGridSpan;
		}
	}

	// HACK: Восстанавливаем флаги и выставляем, что стиль всей таблицы нужно пересчитать
	AscCommon.g_oIdCounter.m_bLoad = bLoad;
	AscCommon.g_oIdCounter.m_bRead = bRead;
	this.Recalc_CompiledPr2();
};
/**
 * Специальная функция, проверяющая, чтобы в первой строке не было ячеек с параметром vmerge_Continue
 * @constructor
 */
CTable.prototype.CorrectVMerge = function()
{
	if (this.GetRowsCount() <= 0)
		return;

	// HACK: При загрузке мы запрещаем компилировать стили, но нам все-таки это здесь нужно
	var bLoad = AscCommon.g_oIdCounter.m_bLoad;
	var bRead = AscCommon.g_oIdCounter.m_bRead;
	AscCommon.g_oIdCounter.m_bLoad = false;
	AscCommon.g_oIdCounter.m_bRead = false;

	var oRow = this.GetRow(0);

	for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
	{
		var oCell   = oRow.GetCell(nCurCell);
		var nVMerge = oCell.GetVMerge();

		if (vmerge_Continue === oCell.GetVMerge())
			oCell.SetVMerge(vmerge_Restart);
	}

	// HACK: Восстанавливаем флаги и выставляем, что стиль всей таблицы нужно пересчитать
	AscCommon.g_oIdCounter.m_bLoad = bLoad;
	AscCommon.g_oIdCounter.m_bRead = bRead;
	this.Recalc_CompiledPr2();
};
CTable.prototype.GetNumberingInfo = function(oNumberingEngine)
{
	if (oNumberingEngine.IsStop())
		return;

	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.GetCell(nCurCell);
			if (oCell.IsMergedCell())
				continue;

			oCell.GetContent().GetNumberingInfo(oNumberingEngine);

			if (oNumberingEngine.IsStop())
				return;
		}
	}
};
CTable.prototype.IsTableFirstRowOnNewPage = function(CurRow)
{
    for (var CurPage = 0, PagesCount = this.Pages.length; CurPage < PagesCount; ++CurPage)
    {
        if (CurRow === this.Pages[CurPage].FirstRow && CurRow <= this.Pages[CurPage].LastRow)
        {
            if (0 === CurPage
				&& (null != this.Get_DocumentPrev()
				|| (true === this.Parent.IsTableCellContent() && true !== this.Parent.IsTableFirstRowOnNewPage())
				|| (true === this.Parent.IsBlockLevelSdtContent() && true !== this.Parent.IsBlockLevelSdtFirstOnNewPage())))
                return false;

            return true;
        }
    }

    return false;
};
CTable.prototype.private_UpdateCellsGrid = function()
{
    for (var nCurRow = 0, nRowsCount = this.Content.length; nCurRow < nRowsCount; ++nCurRow)
    {
        var Row        = this.Content[nCurRow];
        var BeforeInfo = Row.Get_Before();
        var CurGridCol = BeforeInfo.GridBefore;

        for (var nCurCell = 0, nCellsCount = Row.Get_CellsCount(); nCurCell < nCellsCount; ++nCurCell)
        {
            var Cell = Row.Get_Cell(nCurCell);
            var GridSpan = Cell.Get_GridSpan();
            Cell.Set_Metrics(CurGridCol, 0, 0, 0, 0, 0, 0);
            Row.Update_CellInfo(nCurCell);
            CurGridCol += GridSpan;
        }
    }
};
CTable.prototype.SetTableGrid = function(arrGrid)
{
	var isChanged = false;
	if (arrGrid.length != this.TableGrid.length)
	{
		isChanged = true;
	}
	else
	{
		for (var nIndex = 0, nCount = arrGrid.length; nIndex < nCount; ++nIndex)
		{
			if (Math.abs(arrGrid[nIndex] - this.TableGrid[nIndex]) > 0.001)
			{
				isChanged = true;
				break;
			}
		}
	}

	if (!isChanged)
		return;

	var oLogicDocument = this.LogicDocument;
	if (oLogicDocument && oLogicDocument.IsTrackRevisions() && !this.TableGridChange)
	{
		this.SetTableGridChange(this.private_CopyTableGrid());
		this.private_AddPrChange();
	}

	History.Add(new CChangesTableTableGrid(this, this.TableGrid, arrGrid));
	this.TableGrid = arrGrid;
};
/**
 * Выставляем поле для рецензирования, запоминающее исходное состояние сетки таблицы
 * @param {Array | undefined} arrTableGridChange
 */
CTable.prototype.SetTableGridChange = function(arrTableGridChange)
{
	History.Add(new CChangesTableTableGridChange(this, this.TableGridChange, arrTableGridChange));
	this.TableGridChange = arrTableGridChange;
};
/**
 * Получаем ширину заданного промежутка в сетке таблицы
 * @param nStartCol
 * @param nGridSpan
 * @returns {number}
 */
CTable.prototype.GetSpanWidth = function(nStartCol, nGridSpan)
{
	if (nStartCol < 0 || nStartCol + nGridSpan < 0 || nGridSpan <= 0 || nStartCol + nGridSpan > this.TableGrid.length)
		return 0;

	var nSum = 0;
	for (var nCurCol = nStartCol; nCurCol < nStartCol + nGridSpan; ++nCurCol)
	{
		nSum += this.TableGrid[nCurCol];
	}

	return nSum;
};
CTable.prototype.private_CopyTableGrid = function()
{
	var arrGrid = [];
	for (var nIndex = 0, nCount = this.TableGrid.length; nIndex < nCount; ++nIndex)
	{
		arrGrid[nIndex] = this.TableGrid[nIndex];
	}
	return arrGrid;
};
CTable.prototype.private_CopyTableGridCalc = function()
{
	var arrGrid = [];
	for (var nIndex = 0, nCount = this.TableGridCalc.length; nIndex < nCount; ++nIndex)
	{
		arrGrid[nIndex] = this.TableGridCalc[nIndex];
	}
	return arrGrid;
};
CTable.prototype.CorrectBadGrid = function()
{
	// HACK: При загрузке мы запрещаем компилировать стили, но нам все-таки это здесь нужно
	var bLoad = AscCommon.g_oIdCounter.m_bLoad;
	var bRead = AscCommon.g_oIdCounter.m_bRead;
	AscCommon.g_oIdCounter.m_bLoad = false;
	AscCommon.g_oIdCounter.m_bRead = false;

	// Сначала пробежимся по всем ячейкам и посмотрим, чтобы у них были корректные GridSpan (т.е. >= 1)
	for (var Index = 0; Index < this.Content.length; Index++)
	{
		var Row        = this.Content[Index];
		var CellsCount = Row.Get_CellsCount();
		for (var CellIndex = 0; CellIndex < CellsCount; CellIndex++)
		{
			var Cell     = Row.Get_Cell(CellIndex);
			var GridSpan = Cell.Get_GridSpan();
			if (GridSpan <= 0)
				Cell.Set_GridSpan(1);
		}
	}

	var RowGrid   = [];
	var GridCount = 0;
	for (var Index = 0; Index < this.Content.length; Index++)
	{
		var Row = this.Content[Index];
		Row.Set_Index(Index);

		// Смотрим на ширину пропущенных колонок сетки в начале строки
		var BeforeInfo = Row.Get_Before();
		var CurGridCol = BeforeInfo.GridBefore;

		var CellsCount = Row.Get_CellsCount();
		for (var CellIndex = 0; CellIndex < CellsCount; CellIndex++)
		{
			var Cell     = Row.Get_Cell(CellIndex);
			var GridSpan = Cell.Get_GridSpan();
			CurGridCol += GridSpan;
		}

		// Смотрим на ширину пропущенных колонок сетки в конце строки
		var AfterInfo = Row.Get_After();
		CurGridCol += AfterInfo.GridAfter;

		if (GridCount < CurGridCol)
			GridCount = CurGridCol;

		RowGrid[Index] = CurGridCol;
	}

	for (var Index = 0; Index < this.Content.length; Index++)
	{
		var Row       = this.Content[Index];
		var AfterInfo = Row.Get_After();

		if (RowGrid[Index] < GridCount)
		{
			Row.Set_After(AfterInfo.GridAfter + GridCount - RowGrid[Index], AfterInfo.WAfter);
		}
	}

	var arrGrid = this.private_CopyTableGrid();
	if (arrGrid.length != GridCount)
	{
		if (arrGrid.length < GridCount)
		{
			for (var nIndex = 0; nIndex < GridCount; ++nIndex)
				arrGrid[nIndex] = 20;
		}
		else
		{
			arrGrid.splice(GridCount, arrGrid.length - GridCount);
		}
		this.SetTableGrid(arrGrid);
	}

	// HACK: Восстанавливаем флаги и выставляем, что стиль всей таблицы нужно пересчитать
	AscCommon.g_oIdCounter.m_bLoad = bLoad;
	AscCommon.g_oIdCounter.m_bRead = bRead;
	this.Recalc_CompiledPr2();
};
CTable.prototype.private_CorrectVerticalMerge = function()
{
	// Пробегаемся по всем ячейкам и смотрим на их вертикальное объединение, было ли оно нарушено
	for (var nCurRow = 0, nRowsCount = this.Content.length; nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow     = this.Content[nCurRow];
		var nGridCol = oRow.Get_Before().GridBefore;
		for (var nCurCell = 0, nCellsCount = oRow.Get_CellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell       = oRow.Get_Cell(nCurCell);
			var nVMergeType = oCell.GetVMerge();
			var nGridSpan   = oCell.Get_GridSpan();

			if (vmerge_Continue === nVMergeType)
			{
				var bNeedReset = true;
				if (0 !== nCurRow)
				{
					var oPrevRow     = this.Content[nCurRow - 1];
					var nPrevGridCol = oPrevRow.Get_Before().GridBefore;
					for (var nPrevCell = 0, nPrevCellsCount = oPrevRow.Get_CellsCount(); nPrevCell < nPrevCellsCount; ++nPrevCell)
					{
						var oPrevCell     = oPrevRow.Get_Cell(nPrevCell);
						var nPrevGridSpan = oPrevCell.Get_GridSpan();

						if (nPrevGridCol === nGridCol)
						{
							if (nPrevGridSpan === nGridSpan)
								bNeedReset = false;

							break;
						}
						else if (nPrevGridCol > nGridCol)
							break;

						nPrevGridCol += nPrevGridSpan;
					}
				}

				if (true === bNeedReset)
					oCell.SetVMerge(vmerge_Restart);
			}

			nGridCol += nGridSpan;
		}
	}
};
CTable.prototype.private_SetTableLayoutFixedAndUpdateCellsWidth = function(nExceptColNum)
{
	if (tbllayout_AutoFit === this.Get_CompiledPr(false).TablePr.TableLayout)
	{
		this.SetTableLayout(tbllayout_Fixed);

		// Обновляем ширины ячеек
		var nColsCount = this.TableGrid.length;
		for (var nColIndex = 0; nColIndex < nColsCount; nColIndex++)
		{
			if (nColIndex != nExceptColNum)
				this.Internal_UpdateCellW(nColIndex);
		}
	}
};
CTable.prototype.GotoFootnoteRef = function(isNext, isCurrent)
{
	var nRow = 0, nCell = 0;
	if (true === isCurrent)
	{
		if (true === this.Selection.Use)
		{
			var nStartRow  = this.Selection.StartPos.Pos.Row;
			var nStartCell = this.Selection.StartPos.Pos.Cell;

			var nEndRow  = this.Selection.EndPos.Pos.Row;
			var nEndCell = this.Selection.EndPos.Pos.Cell;

			if (nStartRow < nEndRow || (nStartRow === nEndRow && nStartCell <= nEndCell))
			{
				nRow  = nStartRow;
				nCell = nStartCell;
			}
			else
			{
				nRow  = nEndRow;
				nCell = nEndCell;
			}
		}
		else
		{
			nCell = this.CurCell.Index;
			nRow  = this.CurCell.Row.Index;
		}
	}
	else
	{
		if (true === isNext)
		{
			nRow = 0;
			nCell = 0;
		}
		else
		{
			nRow  = this.Content.length - 1;
			nCell = this.Content[nRow].Get_CellsCount() - 1;
		}
	}

	if (true === isNext)
	{
		for (var nCurRow = nRow, nRowsCount = this.Content.length; nCurRow < nRowsCount; ++nCurRow)
		{
			var oRow = this.Content[nCurRow];
			var nStartCell = (nCurRow === nRow ? nCell : 0);
			for (var nCurCell = nStartCell, nCellsCount = oRow.Get_CellsCount(); nCurCell < nCellsCount; ++nCurCell)
			{
				var oCell = oRow.Get_Cell(nCurCell);
				if (oCell.Content.GotoFootnoteRef(true, true === isCurrent && nCurRow === nRow && nCurCell === nCell))
					return true;
			}
		}
	}
	else
	{
		for (var nCurRow = nRow; nCurRow >= 0; --nCurRow)
		{
			var oRow = this.Content[nCurRow];
			var nStartCell = (nCurRow === nRow ? nCell : oRow.Get_CellsCount() - 1);
			for (var nCurCell = nStartCell; nCurCell >= 0; --nCurCell)
			{
				var oCell = oRow.Get_Cell(nCurCell);
				if (oCell.Content.GotoFootnoteRef(false, true === isCurrent && nCurRow === nRow && nCurCell === nCell))
					return true;
			}
		}
	}

	return false;
};
/**
 * Проверяем можно ли обновлять положение курсора на заданной странице
 * @param nCurPage
 * @returns {boolean}
 */
CTable.prototype.CanUpdateTarget = function(nCurPage)
{
	if (this.Pages.length <= 0)
		return false;

	var oRow, oCell;
	if (this.IsSelectionUse())
	{
		oRow  = this.GetRow(this.Selection.EndPos.Pos.Row);
		oCell = oRow.GetCell(this.Selection.EndPos.Pos.Cell);
	}
	else
	{
		oCell = this.CurCell;
		oRow  = this.CurCell.GetRow();
	}

	if (!oRow || !oCell)
		return false;

	if (nCurPage >= this.Pages.length)
	{
		var nLastPage = this.Pages.length - 1;

		if (this.Pages[nLastPage].LastRow >= oRow.Index)
			return true;

		return false;
	}
	else
	{
		if (this.Pages[nCurPage].LastRow > oRow.Index)
			return true;
		else if (this.Pages[nCurPage].LastRow < oRow.Index)
			return false;

		return oCell.Content.CanUpdateTarget(nCurPage - oCell.Content.Get_StartPage_Relative());
	}
};
/**
 * Проверяем, выделение идет по  ячейкам или нет
 * @returns {boolean}
 */
CTable.prototype.IsCellSelection = function()
{
	if (true === this.ApplyToAll
		|| (true === this.Selection.Use
		&& table_Selection_Cell === this.Selection.Type
		&& this.Selection.Data.length > 0))
		return true;

	return false;
};
CTable.prototype.SetTableProps = function(oProps)
{
	return this.Set_Props(oProps);
};
CTable.prototype.GetTableProps = function()
{
	return this.Get_Props();
};
CTable.prototype.AddContentControl = function(nContentControlType)
{
	if (this.CurCell)
		return this.CurCell.Content.AddContentControl(nContentControlType);

	return null;
};
CTable.prototype.GetAllContentControls = function(arrContentControls)
{
	for (var nCurRow = 0, nRowsCount = this.Content.length; nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.Content[nCurRow];
		for (var nCurCell = 0, nCellsCount = oRow.Get_CellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.Get_Cell(nCurCell);
			oCell.Content.GetAllContentControls(arrContentControls);
		}
	}
};
CTable.prototype.GetOutlineParagraphs = function(arrOutline, oPr)
{
	if (oPr && oPr.SkipTables)
		return;

	for (var nCurRow = 0, nRowsCount = this.Content.length; nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.Content[nCurRow];
		for (var nCurCell = 0, nCellsCount = oRow.Get_CellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.Get_Cell(nCurCell);
			if (oCell)
				oCell.Content.GetOutlineParagraphs(arrOutline, oPr);
		}
	}
};
CTable.prototype.GetSimilarNumbering = function(oContinueNumbering)
{
	if (oContinueNumbering.IsFound())
		return;

	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			oRow.GetCell(nCurCell).GetContent().GetSimilarNumbering(oContinueNumbering);

			if (oContinueNumbering.IsFound())
				break;
		}
	}
};
CTable.prototype.UpdateBookmarks = function(oManager)
{
	for (var nCurRow = 0, nRowsCount = this.Content.length; nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.Content[nCurRow];
		for (var nCurCell = 0, nCellsCount = oRow.Get_CellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			oRow.Get_Cell(nCurCell).Content.UpdateBookmarks(oManager);
		}
	}
};
/**
 * Вставляем содержимое заданной таблицы в текущую (специальная вставка)
 * @param _nRowIndex - Номер
 * @param _nCellIndex
 * @param oTable
 */
CTable.prototype.InsertTableContent = function(_nCellIndex, _nRowIndex, oTable)
{
	// Нужно пересчитать сетку, чтобы если придется добавлять новые ячейки сетка была рассчитана
	oTable.private_RecalculateGrid();
	oTable.private_RecalculateGridCols();

	var oCell = this.GetStartMergedCell(_nCellIndex, _nRowIndex);
	if (!oCell)
		return;

	var nCellIndex = oCell.Index;
	var nRowIndex  = oCell.Row.Index;

	if (nRowIndex >= this.GetRowsCount())
		return;

	// Добавляем новые строки, если необходимо
	var nAddRows = oTable.GetRowsCount() + nRowIndex - this.GetRowsCount();
	while (nAddRows > 0)
	{
		this.RemoveSelection();
		this.CurCell = this.GetRow(this.GetRowsCount() - 1).GetCell(0);
		this.AddTableRow(false, false);
		nAddRows--;

		this.private_RecalculateGridCols();
	}

	var arrClearedCells = [];
	function private_IsProcessedCell(oCell)
	{
		for (var nIndex = 0, nCount = arrClearedCells.length; nIndex < nCount; ++nIndex)
		{
			if (arrClearedCells[nIndex] === oCell)
				return true;
		}

		return false;
	}

	var isNeedRebuildGrid = false,
		arrRowsInfo       = this.private_GetRowsInfo();

	var oFirstCell = null;
	for (var nCurRow = 0, nRowsCount = oTable.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oInsertedRow = oTable.GetRow(nCurRow);
		var oCurRow = this.GetRow(nRowIndex + nCurRow);
		for (var nCurCell = 0, nCellsCount = oInsertedRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oCurRow.GetCell(nCellIndex + nCurCell);
			var oInsertedCell = oInsertedRow.GetCell(nCurCell);

			if (!oFirstCell)
				oFirstCell = oCell;

			if (!oCell)
			{
				var nCellPos = oCurRow.GetCellsCount();
				oCell = oInsertedCell.Copy(oCurRow);
				oCurRow.AddCell(nCellPos, oCurRow, oCell, true);
				isNeedRebuildGrid = true;
				this.private_AddCellToRowsInfo(arrRowsInfo, oCurRow.Index, nCellPos, oInsertedCell.GetCalculatedW());
			}
			else if (oCell)
			{
				var oTopCell = this.GetStartMergedCell(oCell.Index, oCell.Row.Index);
				if (oTopCell === oCell)
				{
					oCell.Content.ClearContent(false);
					oCell.Content.AddContent(oInsertedCell.Content.Content);
					arrClearedCells.push(oCell);
				}
				else
				{
					if (private_IsProcessedCell(oTopCell))
						oTopCell.Content.AddContent(oInsertedCell.Content.Content);
				}
			}
		}
	}

	if (true === isNeedRebuildGrid)
		this.private_CreateNewGrid(arrRowsInfo);


	this.RemoveSelection();
	if (oFirstCell)
	{
		this.CurCell = oFirstCell;
		this.SelectTable(c_oAscTableSelectionType.Cell);
	}
	else
	{
		this.MoveCursorToStartPos(false);
	}
	this.Document_SetThisElementCurrent(false);
};
/**
 * Изменяем размер тширину и высоту таблицы
 * @param nWidth
 * @param nHeight
 */
CTable.prototype.Resize = function(nWidth, nHeight)
{
	var nMinWidth  = this.GetMinWidth();
	var nMinHeight = this.GetMinHeight();

	var nSummaryHeight = this.GetSummaryHeight();

	var nCellSpacing = this.Content[0].GetCellSpacing();
	if (null !== nCellSpacing)
	{
		nSummaryHeight -= nCellSpacing * (this.GetRowsCount() + 1);
		nMinHeight     -= nCellSpacing * (this.GetRowsCount() + 1);

		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			if (!this.RowsInfo[nCurRow])
				continue;

			nSummaryHeight -= this.RowsInfo[nCurRow].MaxTopBorder[0] + this.RowsInfo[nCurRow].MaxBotBorder;
			nMinHeight     -= this.RowsInfo[nCurRow].MaxTopBorder[0] + this.RowsInfo[nCurRow].MaxBotBorder;
		}

		var oTopBorder    = this.GetTopTableBorder();
		var oBottomBorder = this.GetBottomTableBorder();

		nSummaryHeight -= oTopBorder.GetWidth() + oBottomBorder.GetWidth();
		nMinHeight     -= oTopBorder.GetWidth() + oBottomBorder.GetWidth();
	}
	else
	{
		nSummaryHeight -= this.RowsInfo[this.RowsInfo.length - 1].MaxBotBorder;
		nMinHeight     -= this.RowsInfo[this.RowsInfo.length - 1].MaxBotBorder;
	}

	if (this.Pages.length <= 0)
		return;

	var oBounds = this.GetPageBounds(this.Pages.length - 1);
	var nDiffX  = nWidth - oBounds.Right + oBounds.Left;
	var nDiffY  = nHeight - oBounds.Bottom + oBounds.Top;

	var nSummaryWidth = oBounds.Right - oBounds.Left;

	if (nSummaryWidth + nDiffX < nMinWidth)
		nDiffX = nMinWidth - nSummaryWidth;

	if (nSummaryHeight + nDiffY < nMinHeight)
		nDiffY = nMinHeight - nSummaryHeight;

	if (nDiffY > 0.01)
	{
		var arrRowsH   = [];
		var nTableSumH = 0;

		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			var nRowSummaryH = 0;
			for (var nCurPage in this.RowsInfo[nCurRow].H)
				nRowSummaryH += this.RowsInfo[nCurRow].H[nCurPage];

			arrRowsH[nCurRow] = nRowSummaryH;
			nTableSumH += nRowSummaryH;
		}

		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			var oRow  = this.GetRow(nCurRow);
			var oRowH = oRow.GetHeight();
			var nNewH = arrRowsH[nCurRow] / nTableSumH * (nSummaryHeight + nDiffY);

			if (null !== nCellSpacing)
				nNewH += nCellSpacing;
			else if (this.RowsInfo[nCurRow] && this.RowsInfo[nCurRow].TopDy[0])
				nNewH -= this.RowsInfo[nCurRow].TopDy[0];

			var nTopMargin = 0,
				nBotMargin = 0;
			for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
			{
				var oCell    = oRow.GetCell(nCurCell);
				var oMargins = oCell.GetMargins();

				if (oMargins.Top.W > nTopMargin)
					nTopMargin = oMargins.Top.W;

				if (oMargins.Bottom.W > nBotMargin)
					nBotMargin = oMargins.Bottom.W;
			}

			nNewH -= nTopMargin + nBotMargin;

			oRow.SetHeight(nNewH, oRowH.HRule === Asc.linerule_Exact ? Asc.linerule_Exact : Asc.linerule_AtLeast);
		}
	}
	else if (nDiffY < -0.01)
	{
		var nNewTableH  = nSummaryHeight + nDiffY;
		var arrRowsMinH = [];
		var arrRowsH    = [];
		var nTableSumH  = 0;
		var arrRowsFlag = [];

		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			var nRowSummaryH = 0;
			for (var nCurPage in this.RowsInfo[nCurRow].H)
				nRowSummaryH += this.RowsInfo[nCurRow].H[nCurPage];

			arrRowsH[nCurRow]    = nRowSummaryH;
			arrRowsMinH[nCurRow] = this.GetMinRowHeight(nCurRow);
			arrRowsFlag[nCurRow] = true;
			nTableSumH += nRowSummaryH;
		}

		var arrNewH = [];
		while (true)
		{
			var isForceBreak = false;
			var isContinue   = false;
			for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
			{
				if (arrRowsFlag[nCurRow])
				{
					arrNewH[nCurRow] = arrRowsH[nCurRow] / nTableSumH * nNewTableH;
					if (arrNewH[nCurRow] < arrRowsMinH[nCurRow])
					{
						nTableSumH -= arrRowsH[nCurRow];
						nNewTableH -= arrRowsMinH[nCurRow];
						arrNewH[nCurRow]  = arrRowsMinH[nCurRow];
						arrRowsFlag[nCurRow] = false;

						if (nNewTableH < 0.01 || nTableSumH < 0.01)
							isForceBreak = true;

						isContinue = true;
					}
				}
			}

			if (isForceBreak || !isContinue)
				break;
		}

		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			if (undefined !== arrNewH[nCurRow])
			{
				var oRow  = this.GetRow(nCurRow);
				var oRowH = oRow.GetHeight();
				var nNewH = arrNewH[nCurRow];

				if (null !== nCellSpacing)
					nNewH += nCellSpacing;
				else if (this.RowsInfo[nCurRow] && this.RowsInfo[nCurRow].TopDy[0])
					nNewH -= this.RowsInfo[nCurRow].TopDy[0];

				var nTopMargin = 0,
					nBotMargin = 0;
				for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
				{
					var oCell    = oRow.GetCell(nCurCell);
					var oMargins = oCell.GetMargins();

					if (oMargins.Top.W > nTopMargin)
						nTopMargin = oMargins.Top.W;

					if (oMargins.Bottom.W > nBotMargin)
						nBotMargin = oMargins.Bottom.W;
				}

				nNewH -= nTopMargin + nBotMargin;

				oRow.SetHeight(nNewH, oRowH.HRule === Asc.linerule_Exact ? Asc.linerule_Exact : Asc.linerule_AtLeast);
			}
		}
	}

	this.private_RecalculateGrid();

	var nFinalTableSum = null;
	if (nDiffX > 0.001)
	{
		var arrColsW   = [];
		var nTableSumW = 0;

		for (var nCurCol = 0, nColsCount = this.TableGridCalc.length; nCurCol < nColsCount; ++nCurCol)
		{
			arrColsW[nCurCol] = this.TableGridCalc[nCurCol];
			nTableSumW       += arrColsW[nCurCol];
		}

		nFinalTableSum = 0;
		var arrNewGrid = [];
		for (var nCurCol = 0, nColsCount = this.TableGridCalc.length; nCurCol < nColsCount; ++nCurCol)
		{
			arrNewGrid[nCurCol] = arrColsW[nCurCol] / nTableSumW * (nTableSumW + nDiffX);
			nFinalTableSum += arrNewGrid[nCurCol];
		}

		this.SetTableGrid(arrNewGrid);
	}
	else if (nDiffX < -0.01)
	{
		var arrColsMinW = this.GetMinWidth(true);
		var arrColsW    = [];
		var nTableSumW  = 0;
		var arrColsFlag = [];

		for (var nCurCol = 0, nColsCount = this.TableGridCalc.length; nCurCol < nColsCount; ++nCurCol)
		{
			arrColsW[nCurCol]    = this.TableGridCalc[nCurCol];
			nTableSumW          += arrColsW[nCurCol];
			arrColsFlag[nCurCol] = true;
		}

		var nNewTableW = nTableSumW + nDiffX;
		var arrNewGrid = [];
		while (true)
		{
			var isForceBreak = false;
			var isContinue   = false;
			for (var nCurCol = 0, nColsCount = this.TableGridCalc.length; nCurCol < nColsCount; ++nCurCol)
			{
				if (arrColsFlag[nCurCol])
				{
					arrNewGrid[nCurCol] = arrColsW[nCurCol] / nTableSumW * nNewTableW;
					if (arrNewGrid[nCurCol] < arrColsMinW[nCurCol])
					{
						nTableSumW -= arrColsW[nCurCol];
						nNewTableW -= arrColsMinW[nCurCol];
						arrNewGrid[nCurCol]  = arrColsMinW[nCurCol];
						arrColsFlag[nCurCol] = false;

						if (nNewTableW < 0.01 || nTableSumW < 0.01)
							isForceBreak = true;

						isContinue = true;
					}
				}
			}

			if (isForceBreak || !isContinue)
				break;
		}

		nFinalTableSum = 0;
		for (var nCurCol = 0, nColsCount = this.TableGridCalc.length; nCurCol < nColsCount; ++nCurCol)
		{
			nFinalTableSum += arrNewGrid[nCurCol];
		}

		this.SetTableGrid(arrNewGrid);
	}

	var nPercentWidth = this.private_RecalculatePercentWidth();
	if (null !== nFinalTableSum)
	{
		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			var oRow    = this.GetRow(nCurRow);
			var oBefore = oRow.GetBefore();
			if (oBefore.W && oBefore.Grid > 0)
			{
				var nW = this.GetSpanWidth(0, oBefore.Grid);
				if (oBefore.W.IsMM())
					oRow.SetBefore(oBefore.Grid, new CTableMeasurement(tblwidth_Mm, nW));
				else if (oBefore.W.IsPercent() && nPercentWidth > 0.001)
					oRow.SetBefore(oBefore.Grid, new CTableMeasurement(tblwidth_Pct, nW / nPercentWidth * 100));
				else
					oRow.SetBefore(oBefore.Grid, new CTableMeasurement(tblwidth_Auto, 0));
			}

			var nCellSpacing = oRow.GetCellSpacing();
			var nCurCol      = oBefore.Grid;
			for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
			{
				var oCell     = oRow.GetCell(nCurCell);
				var oCellW    = oCell.GetW();
				var nGridSpan = oCell.GetGridSpan();

				if (oCellW)
				{
					var nW = this.GetSpanWidth(nCurCol, nGridSpan);

					if (null !== nCellSpacing)
					{
						if (0 === nCurCell)
							nW -= nCellSpacing / 2;

						nW -= nCellSpacing;

						if (nCellsCount - 1 === nCurCell)
							nW -= nCellSpacing / 2;
					}

					if (oCellW.IsMM())
						oCell.SetW(new CTableMeasurement(tblwidth_Mm, nW));
					else if (oCellW.IsPercent() && nPercentWidth > 0.001)
						oCell.SetW(new CTableMeasurement(tblwidth_Pct, nW / nPercentWidth * 100));
					else
						oCell.SetW(new CTableMeasurement(tblwidth_Auto, 0));
				}

				nCurCol += nGridSpan;
			}

			var oAfter = oRow.GetAfter();
			if (oAfter.W && oAfter.Grid > 0)
			{
				var nW = this.GetSpanWidth(nCurCol, oAfter.Grid);
				if (oAfter.W.IsMM())
					oRow.SetAfter(oAfter.Grid, new CTableMeasurement(tblwidth_Mm, nW));
				else if (oAfter.W.IsPercent() && nPercentWidth > 0.001)
					oRow.SetAfter(oAfter.Grid, new CTableMeasurement(tblwidth_Pct, nW / nPercentWidth * 100));
				else
					oRow.SetAfter(oAfter.Grid, new CTableMeasurement(tblwidth_Auto, 0));
			}

		}

		var oTableW = this.GetTableW();
		if (oTableW)
		{
			if (oTableW.IsMM())
				this.SetTableW(tblwidth_Mm, nFinalTableSum);
			else if (oTableW.IsPercent() && nPercentWidth > 0.001)
				this.SetTableW(tblwidth_Pct, nFinalTableSum / nPercentWidth * 100);
			else
				this.SetTableW(tblwidth_Auto, 0);
		}
	}
};
/**
 * Изменяем размер тширину и высоту таблицы в документе (создается точка в истории и запускается пересчет)
 * @param nWidth
 * @param nHeight
 */
CTable.prototype.ResizeTableInDocument = function(nWidth, nHeight)
{
	if (!this.LogicDocument)
		return;

	if (true === this.LogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Table_Properties, null, true))
		return;

	this.LogicDocument.StartAction(AscDFH.historydescription_Document_ResizeTable);

	this.Resize(nWidth, nHeight);

	this.LogicDocument.Recalculate();
	this.StartTrackTable();
	this.LogicDocument.UpdateSelection();
	this.LogicDocument.FinalizeAction();
};
/**
 * Получаем минимальную ширину таблицы
 * @param {number} [isReturnByColumns=false]
 * @returns {number}
 */
CTable.prototype.GetMinWidth = function(isReturnByColumns)
{
	var arrMinMargin = [];

	var nGridCount = this.TableGrid.length;
	for (var nCurCol = 0; nCurCol < nGridCount; ++nCurCol)
	{
		arrMinMargin[nCurCol]  = 0;
	}

	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.Content[nCurRow];

		var nSpacing  = oRow.GetCellSpacing();

		var nCurGridCol = oRow.Get_Before().GridBefore;
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell         = oRow.GetCell(nCurCell);
			var nGridSpan     = oCell.GetGridSpan();
			var oCellMargins  = oCell.GetMargins();
			var oCellRBorder  = oCell.GetBorder(1);
			var oCellLBorder  = oCell.GetBorder(3);

			var nCellMarginsLeftW = 0, nCellMarginsRightW = 0;
			if (null !== nSpacing)
			{
				nCellMarginsLeftW  = oCellMargins.Left.W;
				nCellMarginsRightW = oCellMargins.Right.W;

				if (border_None !== oCellRBorder.Value)
					nCellMarginsRightW += oCellRBorder.Size;

				if (border_None !== oCellLBorder.Value)
					nCellMarginsLeftW += oCellLBorder.Size;
			}
			else
			{
				if (border_None !== oCellRBorder.Value)
					nCellMarginsRightW += Math.max(oCellRBorder.Size / 2, oCellMargins.Right.W);
				else
					nCellMarginsRightW += oCellMargins.Right.W;

				if (border_None !== oCellLBorder.Value)
					nCellMarginsLeftW += Math.max(oCellLBorder.Size / 2, oCellMargins.Left.W);
				else
					nCellMarginsLeftW += oCellMargins.Left.W;
			}

			if (nGridSpan <= 1)
			{
				if (arrMinMargin[nCurGridCol] < nCellMarginsLeftW + nCellMarginsRightW)
					arrMinMargin[nCurGridCol] = nCellMarginsLeftW + nCellMarginsRightW;
			}
			else
			{
				if (arrMinMargin[nCurGridCol] < nCellMarginsLeftW)
					arrMinMargin[nCurGridCol] = nCellMarginsLeftW;

				if (arrMinMargin[nCurGridCol + nGridSpan - 1] < nCellMarginsRightW)
					arrMinMargin[nCurGridCol + nGridSpan - 1] = nCellMarginsRightW;
			}

			nCurGridCol += nGridSpan;
		}
	}

	if (isReturnByColumns)
		return arrMinMargin;

	var nSumMin = 0;
	for (var nCurCol = 0; nCurCol < nGridCount; ++nCurCol)
	{
		nSumMin += arrMinMargin[nCurCol];
	}

	return nSumMin;
};
/**
 * Получаем минимальную высоту таблицы
 * @returns {number}
 */
CTable.prototype.GetMinHeight = function()
{
	var nSumMin = 0;
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.Content[nCurRow];

		var nSpacing = oRow.GetCellSpacing();

		var nMaxTopMargin    = 0,
			nMaxBottomMargin = 0,
			nMaxTopBorder    = 0,
			nMaxBottomBorder = 0;

		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell         = oRow.GetCell(nCurCell);
			var oCellMargins  = oCell.GetMargins();
			var oCellTBorder  = oCell.GetBorder(0);
			var oCellBBorder  = oCell.GetBorder(2);


			if (border_None !== oCellTBorder.Value && nMaxTopBorder < oCellTBorder.Size)
				nMaxTopBorder = oCellTBorder.Size;

			if (border_None !== oCellBBorder.Value && nMaxBottomBorder < oCellBBorder.Size)
				nMaxBottomBorder = oCellBBorder.Size;

			if (nMaxTopMargin < oCellMargins.Top.W)
				nMaxTopMargin = oCellMargins.Top.W;

			if (nMaxBottomMargin < oCellMargins.Bottom.W)
				nMaxBottomMargin = oCellMargins.Bottom.W;
		}

		nSumMin += 4.5; // Стандартная минимальная высота строки в таблице без учета границ и отступов

		if (null !== nSpacing)
		{
			if (0 === nCurRow)
				nSumMin += this.GetTopTableBorder().GetWidth();

			nSumMin += nSpacing;
			nSumMin += nMaxTopBorder;
			nSumMin += nMaxTopMargin;
			nSumMin += nMaxBottomMargin;
			nSumMin += nMaxBottomBorder;
			nSumMin += nRowsCount - 1 === nCurRow ? nSpacing : 0;

			if (nRowsCount - 1 === nCurRow)
				nSumMin += this.GetBottomTableBorder().GetWidth();
		}
		else
		{
			nSumMin += Math.max(nMaxTopBorder, nMaxTopMargin);
			nSumMin += nMaxBottomMargin;

			if (nRowsCount - 1 === nCurRow)
				nSumMin += nMaxBottomBorder;
		}
	}

	return nSumMin;
};
/**
 * Получаем минимальную высоту для заданной строки таблицы
 * @param nCurRow
 * @returns {number}
 */
CTable.prototype.GetMinRowHeight = function(nCurRow)
{
	var nSumMin = 0;
	var oRow    = this.Content[nCurRow];

	var nMaxTopMargin    = 0,
		nMaxBottomMargin = 0,
		nMaxTopBorder    = 0;

	for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
	{
		var oCell        = oRow.GetCell(nCurCell);
		var oCellMargins = oCell.GetMargins();
		var oCellTBorder = oCell.GetBorder(0);
		var oCellBBorder = oCell.GetBorder(2);

		if (border_None !== oCellTBorder.Value && nMaxTopBorder < oCellTBorder.Size)
			nMaxTopBorder = oCellTBorder.Size;

		if (nMaxTopMargin < oCellMargins.Top.W)
			nMaxTopMargin = oCellMargins.Top.W;

		if (nMaxBottomMargin < oCellMargins.Bottom.W)
			nMaxBottomMargin = oCellMargins.Bottom.W;
	}

	nSumMin += 4.5; // Стандартная минимальная высота строки в таблице без учета границ и отступов

	nSumMin += Math.max(nMaxTopBorder, nMaxTopMargin);
	nSumMin += nMaxBottomMargin;

	return nSumMin;
};
/**
 * Получаем суммарную высоту таблицы, с учетом ее разбиения на нескольких страницах
 * @returns {number}
 */
CTable.prototype.GetSummaryHeight = function()
{
	var nSum = 0;
	for (var nCurPage = 0, nPagesCount = this.Pages.length; nCurPage < nPagesCount; ++nCurPage)
	{
		var oBounds = this.GetPageBounds(nCurPage);
		nSum += oBounds.Bottom - oBounds.Top;
	}

	return nSum;
};
CTable.prototype.GetTableOfContents = function(isUnique, isCheckFields)
{
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oResult = oRow.GetCell(nCurCell).Content.GetTableOfContents(isUnique, isCheckFields);
			if (oResult)
				return oResult;
		}
	}

	return null;
};
/**
 * Делаем выделенные ячейки равными по ширине
 * @returns {boolean} Возрвщаем false, если операция невозможна
 */
CTable.prototype.DistributeColumns = function()
{
	var isApplyToAll = this.ApplyToAll;
	if (!this.Selection.Use || table_Selection_Text === this.Selection.Type)
		this.ApplyToAll = true;

	var arrSelectedCells = this.GetSelectionArray();
	this.ApplyToAll = isApplyToAll;

	if (arrSelectedCells.length <= 1)
		return false;

	var arrRows = [];
	var arrCheckMergedCells = [];
	for (var nIndex = 0, nCount = arrSelectedCells.length; nIndex < nCount; ++nIndex)
	{
		var nCurCell = arrSelectedCells[nIndex].Cell;
		var nCurRow  = arrSelectedCells[nIndex].Row;
		if (!arrRows[nCurRow])
		{
			arrRows[nCurRow] = {
				Start : nCurCell,
				End   : nCurCell
			};
		}
		else
		{
			if (arrRows[nCurRow].Start > nCurCell)
				arrRows[nCurRow].Start = nCurCell;

			if (arrRows[nCurRow].End < nCurCell)
				arrRows[nCurRow].End = nCurCell;
		}

		var oCell = this.Content[nCurRow].GetCell(nCurCell);
		if (oCell)
		{
			var oCellInfo      = this.Content[nCurRow].GetCellInfo(nCurCell);
			var arrMergedCells = this.private_GetMergedCells(nCurRow, oCellInfo.StartGridCol, oCell.GetGridSpan());

			if (arrMergedCells.length > 1)
			{
				arrCheckMergedCells.push([nCurRow]);
			}


			for (var nMergeIndex = 1, nMergedCount = arrMergedCells.length; nMergeIndex < nMergedCount; ++nMergeIndex)
			{
				var nCurCell2 = arrMergedCells[nMergeIndex].Index;
				var nCurRow2  = arrMergedCells[nMergeIndex].Row.Index;

				if (!arrRows[nCurRow2])
				{
					arrRows[nCurRow2] = {
						Start : nCurCell2,
						End   : nCurCell2
					};
				}
				else
				{
					if (arrRows[nCurRow2].Start > nCurCell2)
						arrRows[nCurRow2].Start = nCurCell2;

					if (arrRows[nCurRow2].End < nCurCell2)
						arrRows[nCurRow2].End = nCurCell2;
				}

				arrCheckMergedCells[arrCheckMergedCells.length - 1].push(nCurRow2);
			}
		}
	}

	for (var nIndex = 0, nCount = arrCheckMergedCells.length; nIndex < nCount; ++nIndex)
	{
		var nFirstStartGridCol = null,
			arrFirstGridSpans  = null;

		for (var nRowIndex = 0, nRowsCount = arrCheckMergedCells[nIndex].length; nRowIndex < nRowsCount; ++nRowIndex)
		{
			var nCurRow = arrCheckMergedCells[nIndex][nRowIndex];
			var oRow = this.GetRow(nCurRow);

			var nStartGridCol = this.Content[nCurRow].GetBefore().Grid;
			var arrGridSpans  = [];

			for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
			{
				var nGridSpan = oRow.GetCell(nCurCell).GetGridSpan();
				if (nCurCell < arrRows[nCurRow].Start)
					nStartGridCol += nGridSpan;
				else if (nCurCell <= arrRows[nCurRow].End)
					arrGridSpans.push(nGridSpan);
				else
					break;
			}


			if (null === nFirstStartGridCol)
			{
				nFirstStartGridCol = nStartGridCol;
				arrFirstGridSpans  = arrGridSpans;
			}
			else
			{
				if (nStartGridCol !== nFirstStartGridCol || arrFirstGridSpans.length !== arrGridSpans.length)
				{
					return false;
				}
				else
				{
					for (var nSpanIndex = 0, nSpansCount = arrGridSpans.length; nSpanIndex < nSpansCount; ++nSpanIndex)
					{
						if (arrFirstGridSpans[nSpanIndex] !== arrGridSpans[nSpanIndex])
							return false;
					}
				}
			}
		}
	}

	var isAutofitLayout    = this.GetTableLayout() === tbllayout_AutoFit;
	var isNeedChangeLayout = false;
	var arrRowsInfo        = this.private_GetRowsInfo();
	for (nCurRow in arrRows)
	{
		if (!arrRowsInfo[nCurRow] || arrRowsInfo[nCurRow].length <= 0)
			continue;

		var nStartCell = arrRows[nCurRow].Start;
		var nEndCell   = arrRows[nCurRow].End;

		var nSum = 0;
		var nAdd = -1 === arrRowsInfo[nCurRow][0].Type ? 1 : 0;

		for (var nCurCell = nStartCell; nCurCell <= nEndCell; ++nCurCell)
		{
			nSum += arrRowsInfo[nCurRow][nCurCell + nAdd].W;
		}

		for (var nCurCell = nStartCell; nCurCell <= nEndCell; ++nCurCell)
		{
			var nNewW = nSum / (nEndCell - nStartCell + 1);
			arrRowsInfo[nCurRow][nCurCell + nAdd].W = nNewW;

			// TODO: Надо поправить баг в рассчете AutoFit из-за которого тут сдвиг происходит
			var oRow = this.GetRow(nCurRow);
			if (!oRow)
				continue;

			var oCell = oRow.GetCell(nCurCell);
			if (!oCell)
				continue;

			if (isAutofitLayout
				&& !isNeedChangeLayout
				&& oCell.Content_RecalculateMinMaxContentWidth(false).Max - 0.001 > nNewW)
					isNeedChangeLayout = true;
		}
	}

	if (isAutofitLayout && isNeedChangeLayout)
		this.SetTableLayout(tbllayout_Fixed);

	this.private_CreateNewGrid(arrRowsInfo);
	this.private_RecalculateGrid();

	return true;
};
/**
 * Делаем выделенные ячейки равными по высоте
 * @returns {boolean}
 */
CTable.prototype.DistributeRows = function()
{
	var isApplyToAll = this.ApplyToAll;
	if (!this.Selection.Use || table_Selection_Text === this.Selection.Type)
		this.ApplyToAll = true;

	var arrSelectedCells = this.GetSelectionArray();
	this.ApplyToAll = isApplyToAll;

	if (arrSelectedCells.length <= 1)
		return false;

	var arrRows = [], nRowsCount = 0;
	for (var nIndex = 0, nCount = arrSelectedCells.length; nIndex < nCount; ++nIndex)
	{
		if (true !== arrRows[arrSelectedCells[nIndex].Row])
		{
			arrRows[arrSelectedCells[nIndex].Row] = true;
			nRowsCount++;
		}

		var oCell = this.GetStartMergedCell(arrSelectedCells[nIndex].Cell, arrSelectedCells[nIndex].Row);
		if (oCell)
		{
			var nVMergeCount = this.GetVMergeCount(oCell.Index, oCell.Row.Index);
			if (nVMergeCount > 1)
			{
				for (var nCurRow = oCell.Row.Index; nCurRow < oCell.Row.Index + nVMergeCount - 1; ++nCurRow)
				{
					if (true !== arrRows[nCurRow])
					{
						arrRows[nCurRow] = true;
						nRowsCount++;
					}
				}
			}
		}
	}

	if (nRowsCount <= 0)
		return false;

	var nCellSpacing = this.GetRow(0).GetCellSpacing();

	var nSumH = 0;
	for (var nCurRow in arrRows)
	{
		var nRowSummaryH = 0;
		for (var nCurPage in this.RowsInfo[nCurRow].H)
			nRowSummaryH += this.RowsInfo[nCurRow].H[nCurPage];

		for (var nCurPage in this.RowsInfo[nCurRow].TopDy)
			nRowSummaryH -= this.RowsInfo[nCurRow].TopDy[nCurPage];

		var oRow      = this.GetRow(nCurRow);
		nRowSummaryH -= oRow.GetTopMargin() + oRow.GetBottomMargin();

		nSumH += nRowSummaryH;
	}

	var nNewValueH = nSumH / nRowsCount;
	for (var nCurRow in arrRows)
	{
		nCurRow = parseInt(nCurRow);

		var oRow = this.GetRow(nCurRow);

		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.GetCell(nCurCell);
			if (vmerge_Restart !== oCell.GetVMerge())
				continue;

			var nVMergeCount = this.GetVMergeCount(nCurCell, nCurRow);

			var nNewH = nNewValueH;

			if (null !== nCellSpacing)
				nNewH += nCellSpacing;

			var nContentH = oCell.GetContent().GetSummaryHeight();
			if (nNewH * nVMergeCount < nContentH)
				nNewValueH += (nContentH / nVMergeCount - nNewH);
		}
	}

	for (var nCurRow in arrRows)
	{
		nCurRow = parseInt(nCurRow);

		var oRow  = this.GetRow(nCurRow);
		var oRowH = oRow.GetHeight();
		var nNewH = nNewValueH;

		if (null !== nCellSpacing)
			nNewH += nCellSpacing;

		oRow.SetHeight(nNewH, oRowH.HRule === Asc.linerule_Exact ? Asc.linerule_Exact : Asc.linerule_AtLeast);
	}

	return true;
};
/**
 * Выставляем ширину текущей колонки
 * @param nWidth
 */
CTable.prototype.SetColumnWidth = function(nWidth)
{
	if (nWidth < 4.2)
		nWidth = 4.2;

	if (nWidth > 558.8)
		nWidth = 558.8;

	var arrSelectedCells = this.GetSelectionArray();

	var oCells = {};
	for (var nIndex = 0, nCount = arrSelectedCells.length; nIndex < nCount; ++nIndex)
	{
		var nCurCell = arrSelectedCells[nIndex].Cell;
		if (!oCells[nCurCell])
			oCells[nCurCell] = 1;
	}

	var arrRowsInfo = this.private_GetRowsInfo();
	for (var nCurRow = 0, nCount = arrRowsInfo.length; nCurRow < nCount; ++nCurRow)
	{
		var nAdd = -1 === arrRowsInfo[nCurRow][0].Type ? 1 : 0;

		for (var nCurCell in oCells)
		{
			var _nCurCell = nCurCell | 0;
			if (arrRowsInfo[nCurRow][_nCurCell + nAdd])
				arrRowsInfo[nCurRow][_nCurCell + nAdd].W = nWidth;
		}
	}

	this.private_CreateNewGrid(arrRowsInfo);
};
/**
 * Выставляем высоту текущей строки
 * @param nHeight
 */
CTable.prototype.SetRowHeight = function(nHeight)
{
	var oRowsRange = this.GetSelectedRowsRange();

	for (var nCurRow = oRowsRange.Start; nCurRow <= oRowsRange.End; ++nCurRow)
	{
		var oRow  = this.GetRow(nCurRow);
		var oRowH = oRow.GetHeight();

		if (oRowH.IsAuto())
			oRow.SetHeight(nHeight, Asc.linerule_AtLeast);
		else
			oRow.SetHeight(nHeight, oRowH.GetRule());
	}
};
/**
 * Проверяем попадает ли данная строка в заголовок таблицы
 * @param nRow
 * @returns {boolean}
 */
CTable.prototype.IsInHeader = function(nRow)
{
	for (var nCurRow = 0; nCurRow <= nRow; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		if (!oRow.IsHeader())
			return false;
	}

	return true;
};
CTable.prototype.GetLastParagraph = function()
{
	var nRowsCount = this.GetRowsCount();
	if (nRowsCount <= 0)
		return null;

	var oRow = this.GetRow(nRowsCount - 1);
	var nCellsCount = oRow.GetCellsCount();
	if (nCellsCount <= 0)
		return null;

	return oRow.GetCell(nCellsCount - 1).GetContent().GetLastParagraph();
};
CTable.prototype.GetPlaceHolderObject = function()
{
	if (this.IsCellSelection())
		return null;

	return this.CurCell.GetContent().GetPlaceHolderObject();
};
CTable.prototype.GetPresentationField = function()
{
	if (this.IsCellSelection())
		return null;

	return this.CurCell.GetContent().GetPresentationField();
};
/**
 * Получаем колонку в виде массива ячеек
 * @returns {[CTableCell]}
 */
CTable.prototype.GetColumn = function(nCurCell, nCurRow)
{
	if (null === nCurRow || undefined === nCurRow)
		nCurRow = 0;

	var oRow = this.GetRow(nCurRow);
	if (!oRow)
		return [];

	if (nCurCell < 0)
		nCurCell = 0;

	if (nCurCell >= oRow.GetCellsCount())
		nCurCell = oRow.GetCellsCount() - 1;

	var oCell = oRow.GetCell(nCurCell);
	if (!oCell)
		return [];

	var nGridStart = oRow.GetCellInfo(nCurCell).StartGridCol;
	var nGridEnd   = nGridStart + oCell.GetGridSpan() - 1;

	var arrCells = [];
	var arrPoses = this.private_GetColumnByGridRange(nGridStart, nGridEnd);
	for (var nIndex = 0, nCount = arrPoses.length; nIndex < nCount; ++nIndex)
	{
		var oPos = arrPoses[nIndex];

		arrCells.push(this.GetRow(oPos.Row).GetCell(oPos.Cell));
	}

	return arrCells;
};
CTable.prototype.private_GetColumnByGridRange = function(nGridStart, nGridEnd, arrPos)
{
	if (!arrPos)
		arrPos = [];

	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.GetCell(nCurCell);
			if (vmerge_Continue === oCell.GetVMerge())
				continue;

			var nStartGridCol = oRow.GetCellInfo(nCurCell).StartGridCol;
			var nEndGridCol   = nStartGridCol + oCell.GetGridSpan() - 1;

			if (nEndGridCol >= nGridStart && nStartGridCol <= nGridEnd)
				arrPos.push({Cell : nCurCell, Row : nCurRow});
		}
	}

	return arrPos;
};
CTable.prototype.HavePrChange = function()
{
	return this.Pr.HavePrChange();
};
CTable.prototype.AddPrChange = function()
{
	if (false === this.HavePrChange())
	{
		this.Pr.AddPrChange();
		History.Add(new CChangesTablePrChange(this, {
			PrChange   : undefined,
			ReviewInfo : undefined
		}, {
			PrChange   : this.Pr.PrChange,
			ReviewInfo : this.Pr.ReviewInfo
		}));
		this.UpdateTrackRevisions();
	}
};
CTable.prototype.RemovePrChange = function()
{
	if (true === this.HavePrChange())
	{
		History.Add(new CChangesTablePrChange(this, {
			PrChange   : this.Pr.PrChange,
			ReviewInfo : this.Pr.ReviewInfo
		}, {
			PrChange   : undefined,
			ReviewInfo : undefined
		}));
		this.Pr.RemovePrChange();
		this.UpdateTrackRevisions();
	}
};
CTable.prototype.private_AddPrChange = function()
{
	if (this.LogicDocument && true === this.LogicDocument.IsTrackRevisions() && true !== this.HavePrChange())
		this.AddPrChange();
};
CTable.prototype.UpdateTrackRevisions = function()
{
	if (this.LogicDocument && this.LogicDocument.GetTrackRevisionsManager)
	{
		var oRevisionsManager = this.LogicDocument.GetTrackRevisionsManager();
		oRevisionsManager.CheckElement(this);
	}
};
CTable.prototype.GetPrReviewColor = function()
{
	if (this.Pr.ReviewInfo)
		return this.Pr.ReviewInfo.Get_Color();

	return REVIEW_COLOR;
};
CTable.prototype.CheckRevisionsChanges = function(oRevisionsManager)
{
	var nRowsCount = this.GetRowsCount();
	if (nRowsCount <= 0)
		return;

	var sTableId = this.GetId();
	if (true === this.HavePrChange())
	{
		var oChange = new CRevisionsChange();
		oChange.put_Paragraph(this);
		oChange.put_StartPos(0);
		oChange.put_EndPos(nRowsCount - 1);
		oChange.put_Type(c_oAscRevisionsChangeType.TablePr);
		oChange.put_UserId(this.Pr.ReviewInfo.GetUserId());
		oChange.put_UserName(this.Pr.ReviewInfo.GetUserName());
		oChange.put_DateTime(this.Pr.ReviewInfo.GetDateTime());
		oRevisionsManager.AddChange(sTableId, oChange);
	}

	var oTable = this;
	function private_FlushTableChange(nType, nStartRow, nEndRow)
	{
		if (reviewtype_Common === nType)
			return;

		var oRow           = oTable.GetRow(nStartRow);
		var oRowReviewInfo = oRow.GetReviewInfo();

		var oChange = new CRevisionsChange();
		oChange.put_Paragraph(oTable);
		oChange.put_StartPos(nStartRow);
		oChange.put_EndPos(nEndRow);
		oChange.put_Type(nType === reviewtype_Add ? c_oAscRevisionsChangeType.RowsAdd : c_oAscRevisionsChangeType.RowsRem);
		oChange.put_UserId(oRowReviewInfo.GetUserId());
		oChange.put_UserName(oRowReviewInfo.GetUserName());
		oChange.put_DateTime(oRowReviewInfo.GetDateTime());
		oRevisionsManager.AddChange(sTableId, oChange);
	}

	var nType     = reviewtype_Common;
	var nStartRow = 0;
	var nEndRow   = 0;
	var sUserId   = "";

	for (var nCurRow = 0; nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow           = this.GetRow(nCurRow);
		var nRowReviewType = oRow.GetReviewType();
		var oRowReviewInfo = oRow.GetReviewInfo();

		if (reviewtype_Common === nType)
		{
			if (reviewtype_Common !== nRowReviewType)
			{
				nType     = nRowReviewType;
				nStartRow = nCurRow;
				nEndRow   = nCurRow;
				sUserId   = oRowReviewInfo.GetUserId();
			}
		}
		else
		{
			if (nType === nRowReviewType && oRowReviewInfo.GetUserId() == sUserId)
			{
				nEndRow = nCurRow;
			}
			else if (reviewtype_Common === nRowReviewType)
			{
				private_FlushTableChange(nType, nStartRow, nEndRow);
				nType = reviewtype_Common;
			}
			else
			{
				private_FlushTableChange(nType, nStartRow, nEndRow);
				nType     = nRowReviewType;
				nStartRow = nCurRow;
				nEndRow   = nCurRow;
				sUserId   = oRowReviewInfo.GetUserId();
			}
		}
	}

	private_FlushTableChange(nType, nStartRow, nEndRow);
};
CTable.prototype.AcceptPrChange = function()
{
	this.RemovePrChange();
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.GetCell(nCurCell);
			oCell.RemovePrChange();
		}
		oRow.AcceptPrChange();
	}

	this.SetTableGridChange(undefined);
};
CTable.prototype.RejectPrChange = function()
{
	if (true === this.HavePrChange())
	{
		this.SetPr(this.Pr.PrChange);
		this.RemovePrChange();
	}

	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.GetCell(nCurCell);
			oCell.RejectPrChange();
		}

		oRow.RejectPrChange();
	}


	if (undefined !== this.TableGridChange)
	{
		// Важно сначала выставить обычную сетку, т.к. там идет проверка на наличие TableGridChange
		this.SetTableGrid(this.TableGridChange);
		this.SetTableGridChange(undefined);

		// Может так случиться, что сетка станет некорректной для текущего состояния таблицы, поэтому нужно
		// произвести корректировку
		this.CorrectBadGrid();
	}
};
CTable.prototype.private_CheckCurCell = function()
{
	if (this.CurCell)
	{
		var oRow = this.CurCell.GetRow();
		if (!oRow || oRow.GetTable() !== this || this.GetRow(oRow.GetIndex()) !== oRow || this.CurCell !== oRow.GetCell(this.CurCell.GetIndex()))
			this.CurCell = null;
	}

	if (!this.CurCell)
	{
		for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
		{
			var oRow = this.GetRow(nCurRow);
			if (oRow.GetCellsCount() > 0)
			{
				this.CurCell = oRow.GetCell(0);
				return;
			}
		}
	}
};
CTable.prototype.CheckRunContent = function(fCheck)
{
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			if (oRow.GetCell(nCurCell).GetContent().CheckRunContent(fCheck))
			{
				return true;
			}
		}
	}

	return false;
};
CTable.prototype.Document_Is_SelectionLocked = function(CheckType, bCheckInner)
{
	var bCheckContentControl = false;
	switch (CheckType)
	{
		case AscCommon.changestype_Paragraph_Content:
		case AscCommon.changestype_Paragraph_Properties:
		case AscCommon.changestype_Paragraph_AddText:
		case AscCommon.changestype_Paragraph_TextProperties:
		case AscCommon.changestype_ContentControl_Add:
		case AscCommon.changestype_Document_Content:
		case AscCommon.changestype_Document_Content_Add:
		case AscCommon.changestype_Delete:
		case AscCommon.changestype_Image_Properties:
		{
			if (this.IsCellSelection())
			{
				var arrCells = this.GetSelectionArray();
				var Count = arrCells.length;
				for (var Index = 0; Index < Count; Index++)
				{
					var Pos  = arrCells[Index];
					var Cell = this.Content[Pos.Row].Get_Cell(Pos.Cell);

					Cell.Content.Set_ApplyToAll(true);
					Cell.Content.Document_Is_SelectionLocked(CheckType);
					Cell.Content.Set_ApplyToAll(false);
				}
			}
			else if (this.CurCell)
			{
				this.CurCell.Content.Document_Is_SelectionLocked(CheckType);
			}

			bCheckContentControl = true;
			break;
		}
		case AscCommon.changestype_Remove:
		{
			if (this.IsCellSelection())
			{
				this.Lock.Check(this.Get_Id());

				var arrCells = this.GetSelectionArray();
				for (var nIndex = 0, nCellsCount = arrCells.length; nIndex < nCellsCount; ++nIndex)
				{
					var oPos         = arrCells[nIndex];
					var oCell        = this.GetRow(oPos.Row).GetCell(oPos.Cell);
					var oCellContent = oCell.GetContent();

					oCellContent.Set_ApplyToAll(true);
					oCellContent.Document_Is_SelectionLocked(CheckType);
					oCellContent.Set_ApplyToAll(false);
				}
			}
			else if (this.CurCell)
			{
				this.CurCell.Content.Document_Is_SelectionLocked(CheckType);
			}

			bCheckContentControl = true;
			break;
		}
		case AscCommon.changestype_Table_Properties:
		{
			if ( false != bCheckInner && true === this.IsInnerTable() )
				this.CurCell.Content.Document_Is_SelectionLocked( CheckType );
			else
				this.Lock.Check( this.Get_Id() );

			bCheckContentControl = true;
			break;
		}
		case AscCommon.changestype_Table_RemoveCells:
		{
			/*
			 // Проверяем все ячейки
			 if ( true === this.Selection.Use && table_Selection_Cell === this.Selection.Type )
			 {
			 var Count = this.Selection.Data.length;
			 for ( var Index = 0; Index < Count; Index++ )
			 {
			 var Pos = this.Selection.Data[Index];
			 var Cell = this.Content[Pos.Row].Get_Cell( Pos.Cell );
			 Cell.Content.Document_Is_SelectionLocked( CheckType );
			 }
			 }
			 else
			 this.CurCell.Content.Document_Is_SelectionLocked( CheckType );
			 */

			// Проверяем саму таблицу

			if ( false != bCheckInner && true === this.IsInnerTable() )
				this.CurCell.Content.Document_Is_SelectionLocked( CheckType );
			else
				this.Lock.Check( this.Get_Id() );

			bCheckContentControl = true;
			break;
		}
		case AscCommon.changestype_Document_SectPr:
		{
			AscCommon.CollaborativeEditing.Add_CheckLock(true);
			break;
		}
	}

	if (bCheckContentControl && this.Parent && this.Parent.CheckContentControlEditingLock)
		this.Parent.CheckContentControlEditingLock();
};
CTable.prototype.GetAllTablesOnPage = function(nPageAbs, arrTables)
{
	if (!arrTables)
		return arrTables = [];

	var nFirstRow = -1;
	var nLastRow  = -2;
	for (var nCurPage = 0, nPagesCount = this.Pages.length; nCurPage < nPagesCount; ++nCurPage)
	{
		var nTempPageAbs = this.GetAbsolutePage(nCurPage);

		if (nPageAbs === nTempPageAbs)
		{
			if (-1 === nFirstRow)
			{
				nFirstRow = this.Pages[nCurPage].FirstRow;
			}

			nLastRow = this.Pages[nCurPage].LastRow;

			arrTables.push({Table : this, Page : nCurPage});
		}
		else if (nTempPageAbs > nPageAbs)
		{
			break;
		}
	}

	for (var nCurRow = nFirstRow; nCurRow <= nLastRow; ++nCurRow)
	{
		var oRow = this.GetRow(nCurRow);
		if (oRow)
		{
			for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
			{
				var oCell = oRow.GetCell(nCurCell);
				if (oCell.IsMergedCell())
					continue;

				oCell.GetContent().GetAllTablesOnPage(nPageAbs, arrTables);
			}
		}
	}

	return arrTables;
};

//----------------------------------------------------------------------------------------------------------------------
// Класс  CTableLook
//----------------------------------------------------------------------------------------------------------------------
function CTableLook(bFC, bFR, bLC, bLR, bBH, bBV)
{
    this.m_bFirst_Col = ( true === bFC ? true : false );
    this.m_bFirst_Row = ( true === bFR ? true : false );
    this.m_bLast_Col  = ( true === bLC ? true : false );
    this.m_bLast_Row  = ( true === bLR ? true : false );
    this.m_bBand_Hor  = ( true === bBH ? true : false );
    this.m_bBand_Ver  = ( true === bBV ? true : false );
}
CTableLook.prototype =
{

    Set : function(bFC, bFR, bLC, bLR, bBH, bBV)
    {
        this.m_bFirst_Col = ( true === bFC ? true : false );
        this.m_bFirst_Row = ( true === bFR ? true : false );
        this.m_bLast_Col  = ( true === bLC ? true : false );
        this.m_bLast_Row  = ( true === bLR ? true : false );
        this.m_bBand_Hor  = ( true === bBH ? true : false );
        this.m_bBand_Ver  = ( true === bBV ? true : false );
    },

    Copy : function()
    {
        return new CTableLook( this.m_bFirst_Col, this.m_bFirst_Row, this.m_bLast_Col, this.m_bLast_Row, this.m_bBand_Hor, this.m_bBand_Ver );
    },

    Is_FirstCol : function()
    {
        return this.m_bFirst_Col;
    },

    Is_FirstRow : function()
    {
        return this.m_bFirst_Row;
    },

    Is_LastCol : function()
    {
        return this.m_bLast_Col;
    },

    Is_LastRow : function()
    {
        return this.m_bLast_Row;
    },

    Is_BandHor : function()
    {
        return this.m_bBand_Hor;
    },

    Is_BandVer : function()
    {
        return this.m_bBand_Ver;
    },

    Write_ToBinary : function(Writer)
    {
        // Bool : m_bFirst_Col
        // Bool : m_bFirst_Row
        // Bool : m_bLast_Col
        // Bool : m_bLast_Row
        // Bool : m_bBand_Hor
        // Bool : m_bBand_Ver

        Writer.WriteBool( this.m_bFirst_Col );
        Writer.WriteBool( this.m_bFirst_Row );
        Writer.WriteBool( this.m_bLast_Col );
        Writer.WriteBool( this.m_bLast_Row );
        Writer.WriteBool( this.m_bBand_Hor );
        Writer.WriteBool( this.m_bBand_Ver );
    },

    Read_FromBinary : function(Reader)
    {
        // Bool : m_bFirst_Col
        // Bool : m_bFirst_Row
        // Bool : m_bLast_Col
        // Bool : m_bLast_Row
        // Bool : m_bBand_Hor
        // Bool : m_bBand_Ver

        this.m_bFirst_Col = Reader.GetBool();
        this.m_bFirst_Row = Reader.GetBool();
        this.m_bLast_Col  = Reader.GetBool();
        this.m_bLast_Row  = Reader.GetBool();
        this.m_bBand_Hor  = Reader.GetBool();
        this.m_bBand_Ver  = Reader.GetBool();
    }
};
//----------------------------------------------------------------------------------------------------------------------
// Класс  CTableAnchorPosition
//----------------------------------------------------------------------------------------------------------------------
function CTableAnchorPosition()
{
    // Рассчитанные координаты
    this.CalcX         = 0;
    this.CalcY         = 0;

    // Данные для Flow-объектов
    this.W             = 0;
    this.H             = 0;
    this.X             = 0;
    this.Y             = 0;
    this.Left_Margin   = 0;
    this.Right_Margin  = 0;
    this.Top_Margin    = 0;
    this.Bottom_Margin = 0;
    this.Page_W        = 0;
    this.Page_H        = 0;

    this.Page_Top      = 0;
    this.Page_Bottom   = 0;

    this.X_min         = 0;
    this.Y_min         = 0;
    this.X_max         = 0;
    this.Y_max         = 0;
}
CTableAnchorPosition.prototype =
{
    Set_X : function(W, X, Left_Margin, Right_Margin, Page_W, X_min, X_max)
    {
        this.W             = W;
        this.X             = X;
        this.Left_Margin   = Left_Margin;
        this.Right_Margin  = Right_Margin;
        this.Page_W        = Page_W;
        this.X_min         = X_min;
        this.X_max         = X_max;
    },

    Set_Y : function(H, Y, Top_Margin, Bottom_Margin, Page_H, Y_min, Y_max, Page_Top, Page_Bottom)
    {
        this.H             = H;
        this.Y             = Y;
        this.Top_Margin    = Top_Margin;
        this.Bottom_Margin = Bottom_Margin;
        this.Page_H        = Page_H;
        this.Y_min         = Y_min;
        this.Y_max         = Y_max;
        this.Page_Top      = Page_Top;
        this.Page_Bottom   = Page_Bottom;
    },

    Calculate_X : function(RelativeFrom, bAlign, Value)
    {
        // Вычисляем координату по X
        switch(RelativeFrom)
        {
            // TODO: пока нет колонок варианты Text и Margin ничем не отличаются,
            //       когда появятся колонки доделать тут
            case c_oAscHAnchor.Text:
            case c_oAscHAnchor.Margin:
            {
                if ( true === bAlign )
                {
                    switch ( Value )
                    {
                        case c_oAscXAlign.Center:
                        {
                            this.CalcX = (this.Left_Margin + this.Right_Margin - this.W) / 2;
                            break;
                        }

                        case c_oAscXAlign.Inside:
                        case c_oAscXAlign.Outside:
                        case c_oAscXAlign.Left:
                        {
                            this.CalcX = this.Left_Margin;
                            break;
                        }

                        case c_oAscXAlign.Right:
                        {
                            this.CalcX = this.Right_Margin - this.W;
                            break;
                        }
                    }
                }
                else
                    this.CalcX = this.Left_Margin + Value;

                break;
            }

            case c_oAscHAnchor.Page:
            {
                var W = this.X_max - this.X_min;
                if ( true === bAlign )
                {
                    switch ( Value )
                    {
                        case c_oAscXAlign.Center:
                        {
                            this.CalcX = this.X_min + (W - this.W) / 2;
                            break;
                        }

                        case c_oAscXAlign.Inside:
                        case c_oAscXAlign.Outside:
                        case c_oAscXAlign.Left:
                        {
                            this.CalcX = this.X_min;
                            break;
                        }

                        case c_oAscXAlign.Right:
                        {
                            this.CalcX = this.X_max - this.W;
                            break;
                        }
                    }
                }
                else
                    this.CalcX = this.X_min + Value;

                break;
            }
        }

        return this.CalcX;
    },

    Calculate_Y : function(RelativeFrom, bAlign, Value)
    {
        // Вычисляем координату по Y
        switch(RelativeFrom)
        {
            case c_oAscVAnchor.Margin:
            {
                if ( true === bAlign )
                {
                    switch(Value)
                    {
                        case c_oAscYAlign.Bottom:
                        {
                            this.CalcY = this.Bottom_Margin - this.H;
                            break;
                        }
                        case c_oAscYAlign.Center:
                        {
                            this.CalcY = (this.Bottom_Margin + this.Top_Margin - this.H) / 2;
                            break;
                        }
                        case c_oAscYAlign.Inline:
                        case c_oAscYAlign.Inside:
                        case c_oAscYAlign.Outside:
                        case c_oAscYAlign.Top:
                        {
                            this.CalcY = this.Top_Margin;
                            break;
                        }
                    }
                }
                else
                    this.CalcY = this.Top_Margin + Value;

                break;
            }

            case c_oAscVAnchor.Page:
            {
                if ( true === bAlign )
                {
                    switch(Value)
                    {
                        case c_oAscYAlign.Bottom:
                        {
                            this.CalcY = this.Page_Bottom - this.H;
                            break;
                        }
                        case c_oAscYAlign.Center:
                        {
                            this.CalcY = (this.Page_Bottom - this.H) / 2;
                            break;
                        }
                        case c_oAscYAlign.Inline:
                        case c_oAscYAlign.Inside:
                        case c_oAscYAlign.Outside:
                        case c_oAscYAlign.Top:
                        {
                            this.CalcY = this.Page_Top;
                            break;
                        }
                    }
                }
                else
                    this.CalcY = this.Page_Top + Value;

                break;
            }

            case c_oAscVAnchor.Text:
            {
                if ( true === bAlign )
                {
                    // Word не дает делать прилегания в данном случае
                    this.CalcY = this.Y;
                }
                else
                    this.CalcY = this.Y + Value;

                break;
            }
        }

        return this.CalcY;
    },

    Correct_Values : function(X_min, Y_min, X_max, Y_max, AllowOverlap, OtherFlowTables, CurTable)
    {
        var W = this.W;
        var H = this.H;

        var CurX = this.CalcX;
        var CurY = this.CalcY;

        var bBreak = false;
        while ( true != bBreak )
        {
            bBreak = true;
            for ( var Index = 0; Index < OtherFlowTables.length; Index++ )
            {
                var FlowTable = OtherFlowTables[Index];

                if ( FlowTable.Table != CurTable && ( false === AllowOverlap || false === FlowTable.Table.Get_AllowOverlap() ) && ( CurX <= FlowTable.X + FlowTable.W && CurX + W >= FlowTable.X && CurY <= FlowTable.Y + FlowTable.H && CurY + H >= FlowTable.Y ) )
                {
                    /*
                     // Если убирается справа, размещаем справа от картинки
                     if ( FlowTable.X + FlowTable.W < X_max - W - 0.001 )
                     CurX = FlowTable.X + FlowTable.W + 0.001;
                     else
                     {
                     CurX = this.CalcX;
                     CurY = FlowTable.Y + FlowTable.H + 0.001;
                     }
                     */

                    // TODO: Пока у нас смещение по X плохо работает(смотри CTable.Shift), поэтому смещаем таблицу сразу по Y
                    CurY = FlowTable.Y + FlowTable.H + 0.001;

                    bBreak = false;
                }
            }
        }

        // TODO: Пока у нас смещение по X плохо работает(смотри CTable.Shift), поэтому смещаем таблицу сразу по Y
        /*
         // Скорректируем рассчитанную позицию, так чтобы объект не выходил за заданные пределы
         if ( CurX + W > X_max )
         CurX = X_max - W;

         if ( CurX < X_min )
         CurX = X_min;
         */

        // Скорректируем рассчитанную позицию, так чтобы объект не выходил за заданные пределы
        if ( CurY + H > Y_max )
            CurY = Y_max - H;

        if ( CurY < this.Y_min )
            CurY = this.Y_min;

        this.CalcY = CurY;
        this.CalcX = CurX;
    },

    // По значению CalcX получем Value
    Calculate_X_Value : function(RelativeFrom)
    {
        var Value = 0;

        switch(RelativeFrom)
        {
            case c_oAscHAnchor.Text:
            case c_oAscHAnchor.Margin:
            {
                Value = this.CalcX - this.Left_Margin;

                break;
            }

            case c_oAscHAnchor.Page:
            {
                Value = this.CalcX - this.X_min;

                break;
            }
        }

        return Value;
    },

    // По значению CalcY и заданному RelativeFrom получем Value
    Calculate_Y_Value : function(RelativeFrom)
    {
        var Value = 0;

        switch(RelativeFrom)
        {
            case c_oAscVAnchor.Margin:
            {
                Value = this.CalcY - this.Top_Margin;

                break;
            }

            case c_oAscVAnchor.Page:
            {
                Value = this.CalcY - this.Page_Top;

                break;
            }

            case c_oAscVAnchor.Text:
            {
                Value = this.CalcY - this.Y;

                break;
            }
        }

        return Value;
    }
};

function CTableRowsInfo()
{
	this.Pages        = 1;
	this.Y            = [];
	this.H            = [];
	this.TopDy        = [];
	this.MaxTopBorder = [];
	this.FirstPage    = true;
	this.StartPage    = 0;
	this.X0           = 0;
	this.X1           = 0;
	this.MaxBotBorder = 0;
}
CTableRowsInfo.prototype.Init = function()
{
	this.Y[0]            = 0.0;
	this.H[0]            = 0.0;
	this.TopDy[0]        = 0.0;
	this.MaxTopBorder[0] = 0.0;
};

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CTable = CTable;
window['AscCommonWord'].type_Table = type_Table;
