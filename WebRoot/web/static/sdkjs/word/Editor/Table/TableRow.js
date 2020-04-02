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
var History = AscCommon.History;

//----------------------------------------------------------------------------------------------------------------------
// Класс CTableRow
//----------------------------------------------------------------------------------------------------------------------
function CTableRow(Table, Cols, TableGrid)
{
    this.Id = AscCommon.g_oIdCounter.Get_NewId();

    this.Table = Table; // Родительский класс таблицы

    this.Next = null;
    this.Prev = null;

    this.Content = [];
    for ( var Index = 0; Index < Cols; Index++ )
    {
        var ColW = ( undefined != TableGrid && undefined != TableGrid[Index] ? TableGrid[Index] : undefined );
        this.Content[Index] = new CTableCell( this, ColW );
    }

    this.Internal_ReIndexing();

    // Информация о рассчитанных метриках ячеек
    this.CellsInfo = [];

    // Метрика строки
    this.Metrics =
    {
        X_min : 0,
        X_max : 0
    };

    // Информация о spacing до и после текущей строки
    this.SpacingInfo = { Top : false, Bottom : false };

    this.CompiledPr =
    {
        Pr         : null,
        NeedRecalc : true
    };

    this.Pr = new CTableRowPr();

    // Данные два параметра нужны для контроля кардинальности изменений, которые
    // происходят внутри ячеек данной строки.
    this.Height     = 0;
    this.PagesCount = 1;

    // Добавляем данный класс в список DocumentContent'ов
    if (typeof AscCommon.CollaborativeEditing !== "undefined")
        AscCommon.CollaborativeEditing.Add_NewDC(this);
    this.m_oContentChanges = new AscCommon.CContentChanges(); // список изменений(добавление/удаление элементов)

    this.Index = 0;

	this.ReviewType = reviewtype_Common;
	this.ReviewInfo = new CReviewInfo();

	if (editor
		&& !editor.isPresentationEditor
		&& editor.WordControl
		&& editor.WordControl.m_oLogicDocument
		&& true === editor.WordControl.m_oLogicDocument.IsTrackRevisions()
		&& !editor.WordControl.m_oLogicDocument.RecalcTableHeader)
	{
		this.ReviewType = reviewtype_Add;
		this.ReviewInfo.Update();
	}

    // Добавляем данный класс в таблицу Id (обязательно в конце конструктора)
    AscCommon.g_oTableId.Add( this, this.Id );
}

CTableRow.prototype =
{
    Get_Id : function()
    {
        return this.Id;
    },

	// Создаем копию данного объекта
	Copy : function(Table, oPr)
	{
		var Row = new CTableRow(Table, 0);

		// Копируем настройки строки
		Row.Set_Pr(this.Pr.Copy());

		// Копируем ячейки
		var CellsCount = this.Content.length;
		for (var Index = 0; Index < CellsCount; Index++)
		{
			Row.Content[Index] = this.Content[Index].Copy(Row, oPr);
			History.Add(new CChangesTableRowAddCell(Row, Index, [Row.Content[Index]]));
		}

		Row.Internal_ReIndexing();
        if(oPr && oPr.Comparison)
        {
            oPr.Comparison.updateReviewInfo(Row, reviewtype_Add, true);
        }
		return Row;
	},

    Is_UseInDocument : function(Id)
    {
        var bUse = false;
        if ( null != Id )
        {
            var Count = this.Content.length;
            for ( var Index = 0; Index < Count; Index++ )
            {
                if ( Id === this.Content[Index].Get_Id() )
                {
                    bUse = true;
                    break;
                }
            }
        }
        else
            bUse = true;

        if ( true === bUse && null != this.Table )
            return this.Table.Is_UseInDocument(this.Get_Id());

        return false;
    },

    Set_Index : function(Index)
    {
        if ( Index != this.Index )
        {
            this.Index = Index;
            this.Recalc_CompiledPr();
        }
    },

    Set_Metrics_X : function(x_min, x_max)
    {
        this.Metrics.X_min = x_min;
        this.Metrics.X_max = x_max;
    },

	GetEndInfo : function()
    {
        var CellsCount = this.Content.length;
        if ( CellsCount > 0 )
            return this.Content[CellsCount - 1].GetEndInfo();
        else
            return null;
    },

	GetPrevElementEndInfo : function(CellIndex)
	{
		if (0 === CellIndex)
			return this.Table.GetPrevElementEndInfo(this.Index);
		else
			return this.Content[CellIndex - 1].GetEndInfo();
	},

	SaveRecalculateObject : function()
	{
		var RecalcObj = new CTableRowRecalculateObject();
		RecalcObj.Save(this);
		return RecalcObj;
	},

	LoadRecalculateObject : function(RecalcObj)
    {
        RecalcObj.Load(this);
    },

	PrepareRecalculateObject : function()
	{
		this.CellsInfo   = [];
		this.Metrics     = {X_min : 0, X_max : 0};
		this.SpacingInfo = {Top : false, Bottom : false};

		var Count = this.Content.length;
		for (var Index = 0; Index < Count; Index++)
		{
			this.Content[Index].PrepareRecalculateObject();
		}
	},

    PreDelete : function()
    {
        var CellsCount = this.Get_CellsCount();
        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            var Cell = this.Get_Cell( CurCell );

            var CellContent = Cell.Content.Content;
            var ContentCount = CellContent.length;
            for ( var Pos = 0; Pos < ContentCount; Pos++ )
            {
                CellContent[Pos].PreDelete();
            }
        }
    },
    //-----------------------------------------------------------------------------------
    // Работаем с стилем строки
    //-----------------------------------------------------------------------------------
    Recalc_CompiledPr : function()
    {
        this.CompiledPr.NeedRecalc = true;
    },

    // Формируем конечные свойства параграфа на основе стиля и прямых настроек.
    Get_CompiledPr : function(bCopy)
    {
        if ( true === this.CompiledPr.NeedRecalc )
        {
            if (true === AscCommon.g_oIdCounter.m_bLoad || true === AscCommon.g_oIdCounter.m_bRead)
            {
                this.CompiledPr.Pr         = g_oDocumentDefaultTableRowPr;
                this.CompiledPr.NeedRecalc = true;
            }
            else
            {
                this.CompiledPr.Pr         = this.Internal_Compile_Pr();
                this.CompiledPr.NeedRecalc = false;
            }
        }

        if ( false === bCopy )
            return this.CompiledPr.Pr;
        else
            return this.CompiledPr.Pr.Copy(); // Отдаем копию объекта, чтобы никто не поменял извне настройки стиля
    },

    Internal_Compile_Pr : function()
    {
        var TablePr   = this.Table.Get_CompiledPr(false);
        var TableLook = this.Table.Get_TableLook();
        var CurIndex  = this.Index;

        // Сначала возьмем настройки по умолчанию для строки
        var RowPr = TablePr.TableRowPr.Copy();
        if (undefined !== TablePr.TablePr.TableCellSpacing)
            RowPr.TableCellSpacing = TablePr.TablePr.TableCellSpacing;

        // Совместим настройки с настройками для групп строк
        if ( true === TableLook.Is_BandHor() )
        {
            var RowBandSize = TablePr.TablePr.TableStyleRowBandSize;
            var _CurIndex   = ( true != TableLook.Is_FirstRow() ? CurIndex : CurIndex - 1 );
            var GroupIndex = ( 1 != RowBandSize ? Math.floor( _CurIndex / RowBandSize ) : _CurIndex );
            if ( 0 === GroupIndex % 2 )
                RowPr.Merge(TablePr.TableBand1Horz.TableRowPr);
            else
                RowPr.Merge(TablePr.TableBand2Horz.TableRowPr);
        }

        // Совместим настройки с настройками для последней строки
        if ( true === TableLook.Is_LastRow() && this.Table.Content.length - 1 === CurIndex )
        {
            RowPr.Merge(TablePr.TableLastRow.TableRowPr);
        }

        // Совместим настройки с настройками для первой строки
        if ( true === TableLook.Is_FirstRow() && ( 0 === CurIndex || true === this.Pr.TableHeader )  )
        {
            RowPr.Merge(TablePr.TableFirstRow.TableRowPr);
        }

        // Полученные настройки совместим с прямыми настройками
        RowPr.Merge(this.Pr);

        return RowPr;
    },
    //-----------------------------------------------------------------------------------
    // Работаем с настройками строки
    //-----------------------------------------------------------------------------------
    Clear_DirectFormatting : function(bClearMerge)
    {
        // Очищаем все строки и всех ее ячеек
        if (true === bClearMerge)
        {
            this.Set_After(undefined, undefined);
            this.Set_Before(undefined, undefined);
            this.Set_Height(undefined, undefined);
        }

        this.Set_CellSpacing(undefined);

        var Count = this.Content.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            this.Content[Index].Clear_DirectFormatting(bClearMerge);
        }
    },

	Set_Pr : function(RowPr)
	{
		this.private_AddPrChange();
		History.Add(new CChangesTableRowPr(this, this.Pr, RowPr));
		this.Pr = RowPr;
		this.Recalc_CompiledPr();
	},

    Get_Before : function()
    {
        var RowPr = this.Get_CompiledPr( false );

		var Before = {
			WBefore    : RowPr.WBefore.Copy(),
			GridBefore : RowPr.GridBefore
		};

        return Before;
    },

	Set_Before : function(GridBefore, WBefore)
	{
		// Если парметр WBefore === false, значит значение WBefore мы не меняем
		if (this.Pr.GridBefore !== GridBefore || this.Pr.WBefore !== WBefore)
		{
			var OldBefore = {
				GridBefore : this.Pr.GridBefore,
				WBefore    : this.Pr.WBefore
			};

			var NewBefore = {
				GridBefore : GridBefore,
				WBefore    : WBefore
			};

			if (false === WBefore)
			{
				NewBefore.WBefore = OldBefore.WBefore;
			}
			else if (undefined != WBefore)
			{
				NewBefore.WBefore = new CTableMeasurement(tblwidth_Auto, 0);
				NewBefore.WBefore.Set_FromObject(WBefore);
			}

			this.private_AddPrChange();
			History.Add(new CChangesTableRowBefore(this, OldBefore, NewBefore));

			this.Pr.GridBefore = GridBefore;
			this.Pr.WBefore    = NewBefore.WBefore;
			this.Recalc_CompiledPr();
		}
	},

    Get_After : function()
    {
        var RowPr = this.Get_CompiledPr( false );

		var After = {
			WAfter    : RowPr.WAfter.Copy(),
			GridAfter : RowPr.GridAfter
		};

        return After;
    },

	Set_After : function(GridAfter, WAfter)
	{
		// Если парметр WAfter === false, значит значение WAfter мы не меняем
		if (this.Pr.GridAfter !== GridAfter || this.Pr.WAfter !== WAfter)
		{
			var OldAfter = {
				GridAfter : this.Pr.GridAfter,
				WAfter    : this.Pr.WAfter
			};

			var NewAfter = {
				GridAfter : GridAfter,
				WAfter    : WAfter
			};

			if (false === WAfter)
			{
				NewAfter.WAfter = OldAfter.WAfter;
			}
			else if (undefined != WAfter)
			{
				NewAfter.WAfter = new CTableMeasurement(tblwidth_Auto, 0);
				NewAfter.WAfter.Set_FromObject(WAfter);
			}

			this.private_AddPrChange();
			History.Add(new CChangesTableRowAfter(this, OldAfter, NewAfter));

			this.Pr.GridAfter = GridAfter;
			this.Pr.WAfter    = NewAfter.WAfter;
			this.Recalc_CompiledPr();
		}
	},

    Get_CellSpacing : function()
    {
        return this.Get_CompiledPr(false).TableCellSpacing;
    },

	Set_CellSpacing : function(Value)
	{
		if (this.Pr.TableCellSpacing === Value)
			return;

		this.private_AddPrChange();
		History.Add(new CChangesTableRowCellSpacing(this, this.Pr.TableCellSpacing, Value));
		this.Pr.TableCellSpacing = Value;

		this.Recalc_CompiledPr();
	},

    Get_Height : function()
    {
        var RowPr = this.Get_CompiledPr( false );
        return RowPr.Height;
    },

	Set_Height : function(Value, HRule)
	{
		if ((undefined === this.Pr.Height && undefined === Value) || (undefined != this.Pr.Height && HRule === this.Pr.Height.HRule && Math.abs(Value - this.Pr.Height.Value) < 0.001))
			return;

		var OldHeight = this.Pr.Height;
		var NewHeight = undefined != Value ? new CTableRowHeight(Value, HRule) : undefined;

		this.private_AddPrChange();
		History.Add(new CChangesTableRowHeight(this, OldHeight, NewHeight));
		this.Pr.Height = NewHeight;
		this.Recalc_CompiledPr();
	},

    Copy_Pr : function(OtherPr)
    {
        // Before
        if ( undefined === OtherPr.WBefore )
            this.Set_Before( OtherPr.GridBefore, undefined );
        else
            this.Set_Before( OtherPr.GridBefore, { W : OtherPr.WBefore.W, Type : OtherPr.WBefore.Type } );

        // After
        if ( undefined === OtherPr.WAfter )
            this.Set_After( OtherPr.GridAfter, undefined );
        else
            this.Set_After( OtherPr.GridAfter, { W : OtherPr.WAfter.W, Type : OtherPr.WAfter.Type } );

        // Height
        if ( undefined === OtherPr.Height )
            this.Set_Height( undefined, undefined );
        else
            this.Set_Height( OtherPr.Height.Value, OtherPr.Height.HRule );

        // CellSpacing
        if ( undefined != OtherPr.TableCellSpacing )
            this.Set_CellSpacing( OtherPr.TableCellSpacing );
        else
            this.Set_CellSpacing( undefined );

        // TableHeader
        if ( undefined != OtherPr.TableHeader )
            this.SetHeader( OtherPr.TableHeader );
        else
            this.SetHeader( undefined );
    },

    Set_SpacingInfo : function(bSpacingTop, bSpacingBot)
    {
        this.SpacingInfo =
        {
            Top    : bSpacingTop,
            Bottom : bSpacingBot
        };
    },

    Get_SpacingInfo : function()
    {
        return this.SpacingInfo;
    },

    //-----------------------------------------------------------------------------------
    // Работаем с ячейками строки
    //-----------------------------------------------------------------------------------
    Get_Cell : function(Index)
    {
        if ( Index < 0 || Index >= this.Content.length )
            return null;

        return this.Content[Index];
    },

    Get_CellsCount : function()
    {
        return this.Content.length;
    },

    Set_CellInfo : function(Index,  StartGridCol, X_grid_start, X_grid_end, X_cell_start, X_cell_end, X_content_start, X_content_end)
    {
        this.CellsInfo[Index] =
        {
            StartGridCol    : StartGridCol,
            X_grid_start    : X_grid_start,
            X_grid_end      : X_grid_end,
            X_cell_start    : X_cell_start,
            X_cell_end      : X_cell_end,
            X_content_start : X_content_start,
            X_content_end   : X_content_end
        };
    },

    Update_CellInfo : function(Index)
    {
        var Cell = this.Content[Index];

        var StartGridCol    = Cell.Metrics.StartGridCol;
        var X_grid_start    = Cell.Metrics.X_grid_start;
        var X_grid_end      = Cell.Metrics.X_grid_end;
        var X_cell_start    = Cell.Metrics.X_cell_start;
        var X_cell_end      = Cell.Metrics.X_cell_end;
        var X_content_start = Cell.Metrics.X_content_start;
        var X_content_end   = Cell.Metrics.X_content_end;

        this.Set_CellInfo(Index, StartGridCol, X_grid_start, X_grid_end, X_cell_start, X_cell_end, X_content_start, X_content_end);
    },

    Get_CellInfo : function(Index)
    {
    	if (!this.CellsInfo[Index] || undefined === this.CellsInfo[Index].StartGridCol)
			this.GetTable().private_RecalculateGridCols();

        return this.CellsInfo[Index];
    },

    Get_StartGridCol : function(Index)
    {
        var Max = Math.min( this.Content.length - 1, Index - 1);
        var CurGridCol = this.Get_Before().GridBefore;
        for ( var CurCell = 0; CurCell <= Max; CurCell++ )
        {
            var Cell = this.Get_Cell( CurCell );
            var GridSpan = Cell.Get_GridSpan();

            CurGridCol += GridSpan;
        }

        return CurGridCol;
    },

	Remove_Cell : function(Index)
	{
		History.Add(new CChangesTableRowRemoveCell(this, Index, [this.Content[Index]]));

		this.Content.splice(Index, 1);
		this.CellsInfo.splice(Index, 1);

		this.Internal_ReIndexing(Index);

		this.private_CheckCurCell();
	},

	Add_Cell : function(Index, Row, Cell, bReIndexing)
	{
		if ("undefined" === typeof(Cell) || null === Cell)
			Cell = new CTableCell(Row);

		History.Add(new CChangesTableRowAddCell(this, Index, [Cell]));

		this.Content.splice(Index, 0, Cell);
		this.CellsInfo.splice(Index, 0, {});

		if (true === bReIndexing)
		{
			this.Internal_ReIndexing(Index);
		}
		else
		{
			if (Index > 0)
			{
				this.Content[Index - 1].Next = Cell;
				Cell.Prev                    = this.Content[Index - 1];
			}
			else
				Cell.Prev = null;

			if (Index < this.Content.length - 1)
			{
				this.Content[Index + 1].Prev = Cell;
				Cell.Next                    = this.Content[Index + 1];
			}
			else
				Cell.Next = null;
		}

		this.private_CheckCurCell();

		return Cell;
	},

    Clear_ContentChanges : function()
    {
        this.m_oContentChanges.Clear();
    },

    Add_ContentChanges : function(Changes)
    {
        this.m_oContentChanges.Add( Changes );
    },

    Refresh_ContentChanges : function()
    {
        this.m_oContentChanges.Refresh();
    },
    //-----------------------------------------------------------------------------------
    // Внутренние функции
    //-----------------------------------------------------------------------------------
    Internal_ReIndexing : function(StartIndex)
    {
        if ( "undefined" === typeof(StartIndex) )
            StartIndex = 0;

        for ( var Ind = StartIndex; Ind < this.Content.length; Ind++ )
        {
            this.Content[Ind].Set_Index( Ind );
            this.Content[Ind].Prev = ( Ind > 0 ? this.Content[Ind - 1] : null );
            this.Content[Ind].Next = ( Ind < this.Content.length - 1 ? this.Content[Ind + 1] : null );
            this.Content[Ind].Row  = this;
        }
    },

    //-----------------------------------------------------------------------------------
    // Undo/Redo функции
    //-----------------------------------------------------------------------------------
    Get_ParentObject_or_DocumentPos : function()
    {
        return this.Table.Get_ParentObject_or_DocumentPos(this.Table.Index);
    },

    Refresh_RecalcData : function(Data)
    {
        var bNeedRecalc = false;

        var Type = Data.Type;

        switch ( Type )
        {
            case AscDFH.historyitem_TableRow_Before:
            case AscDFH.historyitem_TableRow_After:
            case AscDFH.historyitem_TableRow_CellSpacing:
            case AscDFH.historyitem_TableRow_Height:
            case AscDFH.historyitem_TableRow_AddCell:
            case AscDFH.historyitem_TableRow_RemoveCell:
            case AscDFH.historyitem_TableRow_TableHeader:
            case AscDFH.historyitem_TableRow_Pr:
            {
                bNeedRecalc = true;
                break;
            }
        }

        // Добавляем все ячейки для пересчета
        var CellsCount = this.Get_CellsCount();
        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            this.Table.RecalcInfo.Add_Cell( this.Get_Cell(CurCell) );
        }

        this.Table.RecalcInfo.Recalc_Borders();

        if ( true === bNeedRecalc )
            this.Refresh_RecalcData2( 0, 0 );
    },

    Refresh_RecalcData2 : function(CellIndex, Page_rel)
    {
        this.Table.Refresh_RecalcData2( this.Index, Page_rel );
    },
    //-----------------------------------------------------------------------------------
    // Функции для работы с совместным редактирования
    //-----------------------------------------------------------------------------------
    Write_ToBinary2 : function(Writer)
	{
		Writer.WriteLong(AscDFH.historyitem_type_TableRow);

		// String        : Id строки
		// Variable      : свойства строки
		// Long          : количество ячеек
		// Array strings : Id ячеек
		// Long          : ReviewType
		// CReviewInfo   : ReviewType

		Writer.WriteString2(this.Id);
		this.Pr.Write_ToBinary(Writer);

		var Count = this.Content.length;
		Writer.WriteLong(Count);
		for (var Index = 0; Index < Count; Index++)
			Writer.WriteString2(this.Content[Index].Get_Id());

		if (!(this.ReviewInfo instanceof CReviewInfo))
			this.ReviewInfo = new CReviewInfo();

		Writer.WriteLong(this.ReviewType);
		this.ReviewInfo.WriteToBinary(Writer);
	},

    Read_FromBinary2 : function(Reader)
	{
		// String          : Id строки
		// Variable        : свойства строки
		// Long            : количество ячеек
		// Array variables : сами ячейки
		// Long            : ReviewType
		// CReviewInfo     : ReviewType

		this.Id = Reader.GetString2();
		this.Pr = new CTableRowPr();
		this.Pr.Read_FromBinary(Reader);
		this.Recalc_CompiledPr();

		var Count    = Reader.GetLong();
		this.Content = [];
		for (var Index = 0; Index < Count; Index++)
		{
			var Cell = AscCommon.g_oTableId.Get_ById(Reader.GetString2());
			this.Content.push(Cell);
		}

		this.ReviewType = Reader.GetLong();
		this.ReviewInfo = new CReviewInfo();
		this.ReviewInfo.ReadFromBinary(Reader);

		this.Internal_ReIndexing();

		AscCommon.CollaborativeEditing.Add_NewObject(this);
	},

    Load_LinkData : function(LinkData)
    {
    }
};
/**
 * Доступ к родительской таблице
 * @returns {null | CTable}
 */
CTableRow.prototype.GetTable = function()
{
	return this.Table;
};
/**
 * Получаем номер данной строки в родительской таблице
 * @returns {number}
 */
CTableRow.prototype.GetIndex = function()
{
	return this.Index;
};
CTableRow.prototype.GetDocumentPositionFromObject = function(arrPos)
{
    if (!arrPos)
		arrPos = [];

    var oTable = this.GetTable();
    if (oTable)
    {
    	if (arrPos.length > 0)
		{
			arrPos.splice(0, 0, {Class : oTable, Position : this.GetIndex()});
			oTable.GetDocumentPositionFromObject(arrPos);
		}
		else
		{
			oTable.GetDocumentPositionFromObject(arrPos);
			arrPos.push({Class : oTable, Position : this.GetIndex()});
		}
    }

    return arrPos;
};
/**
 * Получаем ячейку с заданным номером в строке
 * @param nCellIndex
 * @returns {CTableCell}
 */
CTableRow.prototype.GetCell = function(nCellIndex)
{
	return this.Get_Cell(nCellIndex);
};
CTableRow.prototype.GetCellsCount = function()
{
	return this.Get_CellsCount()
};
CTableRow.prototype.AddCell = function(nIndex, oRow, oCell, isReIndexing)
{
	this.Add_Cell(nIndex, oRow, oCell, isReIndexing);
};
CTableRow.prototype.RemoveCell = function(nIndex)
{
	this.Remove_Cell(nIndex);
};
CTableRow.prototype.GetCellInfo = function(nIndex)
{
	return this.Get_CellInfo(nIndex);
};
CTableRow.prototype.GetCellSpacing = function()
{
	return this.Get_CellSpacing();
};
/**
 * Получаем высоту строки
 * @returns {CTableRowHeight}
 */
CTableRow.prototype.GetHeight = function()
{
	return this.Get_Height();
};
/**
 * Устанавливаем высоту строки
 * @param nValue
 * @param nHRule
 */
CTableRow.prototype.SetHeight = function(nValue, nHRule)
{
	return this.Set_Height(nValue, nHRule);
};
/**
 * Получаем информацию о отступе сетки в начале строки
 * @returns {{W, Grid}}
 */
CTableRow.prototype.GetBefore = function()
{
	var oRowPr = this.Get_CompiledPr(false);

	return {
		W    : oRowPr.WBefore.Copy(),
		Grid : oRowPr.GridBefore
	};
};
/**
 * Задаем информацию об отступе сетки в начале строки
 * @param {number} Grid - сколько колонок занимает отступ
 * @param {CTableMeasurement | 'false'} W - желаемая ширина (если задано значение false, тогда не меняем ширину)
 */
CTableRow.prototype.SetBefore = function(Grid, W)
{
	this.Set_Before(Grid, W);
};
/**
 * Получаем информацию об отступе сетки в конце строки
 * @returns {{W, Grid}}
 */
CTableRow.prototype.GetAfter = function()
{
	var oRowPr = this.Get_CompiledPr(false);

	return {
		W    : oRowPr.WAfter.Copy(),
		Grid : oRowPr.GridAfter
	};
};
/**
 * Задаем информацию об отступе сетки в конце строки
 * @param {number} Grid - сколько колонок занимает отступ
 * @param {CTableMeasurement | 'false'} W - желаемая ширина (если задано значение false, тогда не меняем ширину)
 */
CTableRow.prototype.SetAfter = function(Grid, W)
{
	this.Set_After(Grid, W);
};
/**
 * Получаем общий отступ сверху у строки (максимальный отступ сверху среди всех ячеек)
 * @returns {number}
 */
CTableRow.prototype.GetTopMargin = function()
{
	var nTopMargin = 0;

	for (var nCurCell = 0, nCellsCount = this.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
	{
		var oCell = this.GetCell(nCurCell);

		if (vmerge_Restart != oCell.GetVMerge())
			continue;

		var oMargins = oCell.GetMargins();

		if (oMargins.Top.W > nTopMargin)
			nTopMargin = oMargins.Top.W;
	}

	return nTopMargin;
};
/**
 * Получаем общий отступ снизу у строки (максимальный отступ снизу среди всех ячеек)
 * @returns {number}
 */
CTableRow.prototype.GetBottomMargin = function()
{
	// Ячейки, участвующие в вертикальном объединении, не влияют на отступ снизу

	var nBottomMargin = 0;

	for (var nCurCell = 0, nCellsCount = this.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
	{
		var oCell = this.GetCell(nCurCell);

		if (vmerge_Restart != oCell.GetVMerge())
			continue;

		var nVMergeCount = this.Table.GetVMergeCount(nCurCell, this.Index);
		if (nVMergeCount > 1)
			continue;

		var oMargins = oCell.GetMargins();

		if (oMargins.Bottom.W > nBottomMargin)
			nBottomMargin = oMargins.Bottom.W;
	}

	return nBottomMargin;
};
/**
 * Проверяем является ли данная строка строкой заголовка таблицы
 * @returns {boolean}
 */
CTableRow.prototype.IsHeader = function()
{
	return this.Get_CompiledPr(false).TableHeader;
};
/**
 * Устанавливаем является ли данная строка строкой заголовка таблицы
 * @param isHeader {boolean}
 */
CTableRow.prototype.SetHeader = function(isHeader)
{
	if (isHeader === this.Pr.TableHeader)
		return;

	this.private_AddPrChange();
	History.Add(new CChangesTableRowTableHeader(this, this.Pr.TableHeader, isHeader));
	this.Pr.TableHeader = isHeader;
	this.Recalc_CompiledPr();
	this.RecalcCopiledPrCells();
};
/**
 * Пересчитываем рассчитанные настройки для ячеек
 */
CTableRow.prototype.RecalcCopiledPrCells = function()
{
	for (var nCurCell = 0, nCellsCount = this.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
	{
		this.GetCell(nCurCell).Recalc_CompiledPr();
	}
};
/**
 * Возвращаем тип рецензирования
 * @returns {reviewtype_Common | reviewtype_Add | reviewtype_Remove}
 */
CTableRow.prototype.GetReviewType = function()
{
	return this.ReviewType;
};
/**
 * Возвращаем информацию о рецензенте
 * @returns {CReviewInfo}
 */
CTableRow.prototype.GetReviewInfo = function()
{
	return this.ReviewInfo;
};
/**
 * Меняем тип рецензирования для данного рана
 * @param {number} nType
 * @param {boolean} [isCheckDeleteAdded=false] - нужно ли проверять, что происходит удаление добавленного ранее
 * @constructor
 */
CTableRow.prototype.SetReviewType = function(nType, isCheckDeleteAdded)
{
	if (nType !== this.ReviewType)
	{
		var OldReviewType = this.ReviewType;
		var OldReviewInfo = this.ReviewInfo.Copy();

		if (reviewtype_Add === this.ReviewType && reviewtype_Remove === nType && true === isCheckDeleteAdded)
		{
			this.ReviewInfo.SavePrev(this.ReviewType);
		}

		this.ReviewType = nType;
		this.ReviewInfo.Update();

		History.Add(new CChangesTableRowReviewType(this, {
			ReviewType : OldReviewType,
			ReviewInfo : OldReviewInfo
		}, {
			ReviewType : this.ReviewType,
			ReviewInfo : this.ReviewInfo.Copy()
		}));

		this.private_UpdateTrackRevisions();
	}
};
/**
 * Меняем тип рецензирования вместе с информацией о рецензента
 * @param {number} nType
 * @param {CReviewInfo} oInfo
 */
CTableRow.prototype.SetReviewTypeWithInfo = function(nType, oInfo)
{
	History.Add(new CChangesTableRowReviewType(this, {
		ReviewType : this.ReviewType,
		ReviewInfo : this.ReviewInfo ? this.ReviewInfo.Copy() : undefined
	}, {
		ReviewType : nType,
		ReviewInfo : oInfo ? oInfo.Copy() : undefined
	}));

	this.ReviewType = nType;
	this.ReviewInfo = oInfo;

	this.private_UpdateTrackRevisions();
};
CTableRow.prototype.private_UpdateTrackRevisions = function()
{
	var oTable = this.GetTable();
	if (oTable)
		oTable.UpdateTrackRevisions();
};
CTableRow.prototype.HavePrChange = function()
{
	return this.Pr.HavePrChange();
};
CTableRow.prototype.AddPrChange = function()
{
	if (false === this.HavePrChange())
	{
		this.Pr.AddPrChange();
		History.Add(new CChangesTableRowPrChange(this, {
			PrChange   : undefined,
			ReviewInfo : undefined
		}, {
			PrChange   : this.Pr.PrChange,
			ReviewInfo : this.Pr.ReviewInfo
		}));
		this.private_UpdateTrackRevisions();
	}
};
CTableRow.prototype.RemovePrChange = function()
{
	if (true === this.HavePrChange())
	{
		History.Add(new CChangesTableRowPrChange(this, {
			PrChange   : this.Pr.PrChange,
			ReviewInfo : this.Pr.ReviewInfo
		}, {
			PrChange   : undefined,
			ReviewInfo : undefined
		}));
		this.Pr.RemovePrChange();
		this.private_UpdateTrackRevisions();
	}
};
CTableRow.prototype.private_AddPrChange = function()
{
	var oTable = this.GetTable();
	if (oTable
		&& oTable.LogicDocument
		&& true === oTable.LogicDocument.IsTrackRevisions()
		&& true !== this.HavePrChange()
		&& reviewtype_Common === this.GetReviewType())
	{
		this.AddPrChange();
		oTable.AddPrChange();
	}
};
CTableRow.prototype.AcceptPrChange = function()
{
	this.RemovePrChange();
};
CTableRow.prototype.RejectPrChange = function()
{
	if (this.HavePrChange())
	{
		this.Set_Pr(this.Pr.PrChange);
		this.RemovePrChange();
	}
};
CTableRow.prototype.private_CheckCurCell = function()
{
	if (this.GetTable())
		this.GetTable().private_CheckCurCell();
};

function CTableRowRecalculateObject()
{
    this.CellsInfo   = [];
    this.Metrics     = {};
    this.SpacingInfo = {};

    this.Height      = 0;
    this.PagesCount  = 0;

    this.Content = [];
}

CTableRowRecalculateObject.prototype =
{
    Save : function(Row)
    {
        this.CellsInfo   = Row.CellsInfo;
        this.Metrics     = Row.Metrics;
        this.SpacingInfo = Row.SpacingInfo;

        this.Height      = Row.Height;
        this.PagesCount  = Row.PagesCount;

        var Count = Row.Content.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            this.Content[Index] = Row.Content[Index].SaveRecalculateObject();
        }
    },

    Load : function(Row)
    {
        Row.CellsInfo   = this.CellsInfo;
        Row.Metrics     = this.Metrics;
        Row.SpacingInfo = this.SpacingInfo;

        Row.Height      = this.Height;
        Row.PagesCount  = this.PagesCount;

        var Count = Row.Content.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            Row.Content[Index].LoadRecalculateObject( this.Content[Index] );
        }
    },

    Get_DrawingFlowPos : function(FlowPos)
    {
        var Count = this.Content.length;
        for ( var Index = 0; Index < Count; Index++ )
        {
            this.Content[Index].Get_DrawingFlowPos( FlowPos );
        }
    }
};

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonWord'] = window['AscCommonWord'] || {};
window['AscCommonWord'].CTableRow = CTableRow;
