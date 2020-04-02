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
var c_oAscSectionBreakType    = Asc.c_oAscSectionBreakType;
CTable.prototype.Recalculate_Page = function(PageIndex)
{
	this.SetIsRecalculated(true);

	if (0 === PageIndex)
	{
		// TODO: Внутри функции private_RecalculateBorders происходит персчет метрик каждой ячейки, это надо бы
		//       вынести в отдельную функцию. Из-за этого функцию private_RecalculateHeader приходится запускать позже.

		this.private_RecalculateGrid();
		this.private_RecalculateBorders();
		this.private_RecalculateHeader();
	}

	this.private_RecalculatePageXY(PageIndex);

	if (true !== this.private_RecalculateCheckPageColumnBreak(PageIndex))
		return recalcresult_NextPage | recalcresultflags_Column;

	this.private_RecalculatePositionX(PageIndex);

	var Result = this.private_RecalculatePage(PageIndex);
	if (Result & recalcresult_CurPage)
		return Result;

	this.private_RecalculatePositionY(PageIndex);

	if (Result & recalcresult_NextElement)
		this.RecalcInfo.Reset(false);

	if (Result & recalcresult_NextElement && window['AscCommon'].g_specialPasteHelper && window['AscCommon'].g_specialPasteHelper.showButtonIdParagraph === this.GetId())
		window['AscCommon'].g_specialPasteHelper.SpecialPasteButtonById_Show();

	return Result;
};
CTable.prototype.Recalculate_SkipPage = function(PageIndex)
{
	if (0 === PageIndex)
	{
		this.StartFromNewPage();
	}
	else
	{
		var PrevPage = this.Pages[PageIndex - 1];

		var LastRow      = Math.max(PrevPage.FirstRow, PrevPage.LastRow); // На случай, если предыдущая страница тоже пустая
		var NewPage      = new CTablePage(PrevPage.X, PrevPage.Y, PrevPage.XLimit, PrevPage.YLimit, LastRow, PrevPage.MaxTopBorder);
		NewPage.FirstRow = LastRow;
		NewPage.LastRow  = LastRow - 1;

		this.Pages[PageIndex] = NewPage;
	}
};
CTable.prototype.Recalculate_Grid = function()
{
	this.private_RecalculateGrid();
};
CTable.prototype.SaveRecalculateObject = function()
{
	var RecalcObj = new CTableRecalculateObject();
	RecalcObj.Save(this);
	return RecalcObj;
};
CTable.prototype.LoadRecalculateObject = function(RecalcObj)
{
	RecalcObj.Load(this);
};
CTable.prototype.PrepareRecalculateObject = function()
{
	this.TableSumGrid  = [];
	this.TableGridCalc = [];

	this.TableRowsBottom = [];
	this.RowsInfo        = [];

	this.HeaderInfo = {
		Count     : 0,
		H         : 0,
		PageIndex : 0,
		Pages     : []
	};

	this.Pages = [];

	this.MaxTopBorder = [];
	this.MaxBotBorder = [];
	this.MaxBotMargin = [];

	this.RecalcInfo.Reset(true);

	var Count = this.Content.length;
	for (var Index = 0; Index < Count; Index++)
	{
		this.Content[Index].PrepareRecalculateObject();
	}
};
CTable.prototype.StartFromNewPage = function()
{
	this.Pages.length     = 1;
	this.Pages[0]         = new CTablePage(0, 0, 0, 0, 0, 0);
	this.Pages[0].LastRow = -1;

	this.HeaderInfo.Pages[0]      = {};
	this.HeaderInfo.Pages[0].Draw = false;

	this.RowsInfo[0] = new CTableRowsInfo();
	this.RowsInfo[0].Init();

	// Обнуляем таблицу суммарных высот ячеек
	for (var Index = -1; Index < this.Content.length; Index++)
	{
		this.TableRowsBottom[Index]    = [];
		this.TableRowsBottom[Index][0] = 0;
	}

	this.Pages[0].MaxBotBorder = 0;
	this.Pages[0].BotBorders   = [];

	if (this.Content.length > 0)
	{
		var CellsCount = this.Content[0].Get_CellsCount();
		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell = this.Content[0].Get_Cell(CurCell);
			Cell.Content.StartFromNewPage();
			Cell.PagesCount = 2;
		}
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Приватные функции связанные с рассчетом таблицы.
//----------------------------------------------------------------------------------------------------------------------
CTable.prototype.private_RecalculateCheckPageColumnBreak = function(CurPage)
{
    if (true !== this.Is_Inline()) // Случай Flow разбирается в Document.js
        return true;

    if (!this.LogicDocument || this.Parent !== this.LogicDocument)
        return true;

    var isPageBreakOnPrevLine   = false;
    var isColumnBreakOnPrevLine = false;

    var PrevElement = this.Get_DocumentPrev();

	while (PrevElement && (PrevElement instanceof CBlockLevelSdt))
		PrevElement = PrevElement.GetLastElement();

    if (null !== PrevElement && type_Paragraph === PrevElement.Get_Type() && true === PrevElement.Is_Empty() && undefined !== PrevElement.Get_SectionPr())
	{
		var PrevSectPr = PrevElement.Get_SectionPr();
		var CurSectPr  = this.LogicDocument.SectionsInfo.Get_SectPr(this.Index).SectPr;
		if (c_oAscSectionBreakType.Continuous === CurSectPr.Get_Type() && true === CurSectPr.Compare_PageSize(PrevSectPr))
			PrevElement = PrevElement.Get_DocumentPrev();
	}

    if ((0 === CurPage || true === this.Check_EmptyPages(CurPage - 1)) && null !== PrevElement && type_Paragraph === PrevElement.Get_Type())
    {
        var bNeedPageBreak = true;
        if (undefined !== PrevElement.Get_SectionPr())
        {
            var PrevSectPr = PrevElement.Get_SectionPr();
            var CurSectPr  = this.LogicDocument.SectionsInfo.Get_SectPr(this.Index).SectPr;
            if (c_oAscSectionBreakType.Continuous !== CurSectPr.Get_Type() || true !== CurSectPr.Compare_PageSize(PrevSectPr))
                bNeedPageBreak = false;
        }

        if (true === bNeedPageBreak)
        {
            var EndLine = PrevElement.Pages[PrevElement.Pages.length - 1].EndLine;
            if (-1 !== EndLine && PrevElement.Lines[EndLine].Info & paralineinfo_BreakRealPage)
                isPageBreakOnPrevLine = true;
        }
    }

    // ColumnBreak для случая CurPage > 0 не разбираем здесь, т.к. он срабатывает автоматически
    if (0 === CurPage && null !== PrevElement && type_Paragraph === PrevElement.Get_Type())
    {
        var EndLine = PrevElement.Pages[PrevElement.Pages.length - 1].EndLine;
        if (-1 !== EndLine && !(PrevElement.Lines[EndLine].Info & paralineinfo_BreakRealPage) && PrevElement.Lines[EndLine].Info & paralineinfo_BreakPage)
            isColumnBreakOnPrevLine = true;
    }

    if ((true === isPageBreakOnPrevLine && (0 !== this.private_GetColumnIndex(CurPage) || (0 === CurPage && null !== PrevElement)))
        || (true === isColumnBreakOnPrevLine && 0 === CurPage))
    {
        this.private_RecalculateSkipPage(CurPage);
        return false;
    }

    return true;
};
CTable.prototype.private_RecalculateGrid = function()
{
    //if ( true != this.RecalcInfo.TableGrid )
    //    return;

    if ( this.Content.length <= 0 )
        return;

    //---------------------------------------------------------------------------
    // 1 часть пересчета ширины таблицы : Рассчитываем фиксированную ширину
    //---------------------------------------------------------------------------
    var TablePr = this.Get_CompiledPr(false).TablePr;

    var Grid    = this.TableGrid;
    var SumGrid = [];

    var TempSum = 0;
    SumGrid[-1] = 0;
    for ( var Index = 0; Index < Grid.length; Index++ )
    {
        TempSum += Grid[Index];
        SumGrid[Index] = TempSum;
    }

    var PctWidth = this.private_RecalculatePercentWidth();
    var MinWidth = this.Internal_Get_TableMinWidth();

    var TableW = 0;
    if (tblwidth_Auto === TablePr.TableW.Type)
    {
        TableW = 0;
    }
    else if (tblwidth_Nil === TablePr.TableW.Type)
    {
        TableW = MinWidth;
    }
    else
    {
        if (tblwidth_Pct === TablePr.TableW.Type)
        {
            TableW = PctWidth * TablePr.TableW.W / 100;
        }
        else
        {
            TableW = TablePr.TableW.W;
        }

        if (0.001 > TableW)
        	TableW = 0;
        else if (TableW < MinWidth)
            TableW = MinWidth;
    }

	var CurGridCol = 0;
	for (var Index = 0; Index < this.Content.length; Index++)
	{
		var Row = this.Content[Index];
		Row.Set_Index(Index);

		// Смотрим на ширину пропущенных колонок сетки в начале строки
		var BeforeInfo = Row.Get_Before();
		CurGridCol     = BeforeInfo.GridBefore;
		if (CurGridCol > 0 && SumGrid[CurGridCol - 1] < BeforeInfo.WBefore.W)
		{
			var nTempDiff = BeforeInfo.WBefore.W - SumGrid[CurGridCol - 1];
			for (var nTempIndex = CurGridCol - 1; nTempIndex < SumGrid.length; ++nTempIndex)
				SumGrid[nTempIndex] += nTempDiff;
		}

		var nCellSpacing = Row.GetCellSpacing();

		var CellsCount = Row.Get_CellsCount();
		for (var CellIndex = 0; CellIndex < CellsCount; CellIndex++)
		{
			var Cell = Row.Get_Cell(CellIndex);
			Cell.Set_Index(CellIndex);
			var CellW    = Cell.Get_W();
			var GridSpan = Cell.Get_GridSpan();

			if (CurGridCol + GridSpan - 1 > SumGrid.length)
			{
				for (var AddIndex = SumGrid.length; AddIndex <= CurGridCol + GridSpan - 1; AddIndex++)
					SumGrid[AddIndex] = SumGrid[AddIndex - 1] + 20; // Добавляем столбик шириной в 2 см
			}

			if (tblwidth_Auto !== CellW.Type && tblwidth_Nil !== CellW.Type)
			{
				var CellWidth = 0;
				if (tblwidth_Pct === CellW.Type)
					CellWidth = PctWidth * CellW.W / 100;
				else
					CellWidth = CellW.W;

				if (null !== nCellSpacing)
				{
					if (0 === CellIndex)
						CellWidth += nCellSpacing / 2;

					CellWidth += nCellSpacing;

					if (CellsCount - 1 === CellIndex)
						CellWidth += nCellSpacing / 2;
				}

				if (CellWidth + SumGrid[CurGridCol - 1] > SumGrid[CurGridCol + GridSpan - 1])
				{
					var nTempDiff = CellWidth + SumGrid[CurGridCol - 1] - SumGrid[CurGridCol + GridSpan - 1];
					for (var nTempIndex = CurGridCol + GridSpan - 1; nTempIndex < SumGrid.length; ++nTempIndex)
						SumGrid[nTempIndex] += nTempDiff;
				}
			}

			CurGridCol += GridSpan;
		}

		// Смотрим на ширину пропущенных колонок сетки в конце строки
		var AfterInfo = Row.Get_After();
		if (CurGridCol + AfterInfo.GridAfter - 1 > SumGrid.length)
		{
			for (var AddIndex = SumGrid.length; AddIndex <= CurGridCol + AfterInfo.GridAfter - 1; AddIndex++)
				SumGrid[AddIndex] = SumGrid[AddIndex - 1] + 20; // Добавляем столбик шириной в 2 см
		}

		if (SumGrid[CurGridCol + AfterInfo.GridAfter - 1] < AfterInfo.WAfter + SumGrid[CurGridCol - 1])
		{
			var nTempDiff = AfterInfo.WAfter + SumGrid[CurGridCol - 1] - SumGrid[CurGridCol + AfterInfo.GridAfter - 1];
			for (var nTempIndex = CurGridCol + AfterInfo.GridAfter - 1; nTempIndex < SumGrid.length; ++nTempIndex)
				SumGrid[nTempIndex] += nTempDiff;
		}
	}

    // TODO: разобраться с минимальной шириной таблицы и ячеек

    // Задана общая ширина таблицы и последняя ячейка вышла за пределы
    // данной ширины. Уменьшаем все столбцы сетки пропорционально, чтобы
    // суммарная ширина стала равной заданной ширине таблицы.
    if ( TableW > 0 && Math.abs( SumGrid[SumGrid.length - 1] - TableW ) > 0.01 )
    {
        SumGrid = this.Internal_ScaleTableWidth( SumGrid, TableW );
    }
    else if ( MinWidth > SumGrid[SumGrid.length - 1] )
        SumGrid = this.Internal_ScaleTableWidth( SumGrid, SumGrid[SumGrid.length - 1] );

    // По массиву SumGrid восстанавливаем ширины самих колонок
    this.TableGridCalc = [];
	this.TableGridCalc[0] = SumGrid[0];
    for ( var Index = 1; Index < SumGrid.length; Index++ )
		this.TableGridCalc[Index] = SumGrid[Index] - SumGrid[Index - 1];

    this.TableSumGrid = SumGrid;

    var TopTable = this.Parent.Is_InTable(true);
    if ( ( null === TopTable && tbllayout_AutoFit === TablePr.TableLayout) || ( null != TopTable && tbllayout_AutoFit === TopTable.Get_CompiledPr(false).TablePr.TableLayout ) )
    {
        //---------------------------------------------------------------------------
        // 2 часть пересчета ширины таблицы : Рассчитываем ширину по содержимому
        //---------------------------------------------------------------------------
        var MinMargin = [], MinContent = [], MaxContent = [], MaxFlags = [];

        var GridCount = this.TableGridCalc.length;
        for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
        {
            MinMargin[CurCol]  = 0;
            MinContent[CurCol] = 0;
            MaxContent[CurCol] = 0;
            MaxFlags[CurCol]   = false; // false - ориентируемся на содержимое ячеек, true - ориентируемся только на ширину ячеек записанную в свойствах
        }

        // 1. Рассчитаем MinContent и MinMargin для всех колонок таблицы, причем, если
        //    у ячейки GridSpan > 1, тогда MinMargin учитывается только в первую колнонку,
        //    а MinContent распределяется равномерно по всем колонкам.

        this.private_RecalculateGridMinMargins(MinMargin);

		var RowsCount = this.Content.length;
		for ( var CurRow = 0; CurRow < RowsCount; CurRow++ )
        {
            var Row = this.Content[CurRow];

            var Spacing  = Row.Get_CellSpacing();
            var SpacingW = ( null != Spacing ? Spacing : 0 );

            var CurGridCol = 0;

            // Смотрим на ширину пропущенных колонок сетки в начале строки
            var BeforeInfo = Row.Get_Before();
            var GridBefore = BeforeInfo.GridBefore;
            var WBefore    = BeforeInfo.WBefore;

            var WBeforeW   = null;
            if (tblwidth_Mm === WBefore.Type)
                WBeforeW = WBefore.W;
            else if (tblwidth_Pct === WBefore.Type)
                WBeforeW = PctWidth * WBefore.W / 100;

            if ( 1 === GridBefore )
            {
                if (null !== WBeforeW)
                {
                    if (MinContent[CurGridCol] < WBeforeW)
                        MinContent[CurGridCol] = WBeforeW;

                    if (false === MaxFlags[CurGridCol])
                    {
                        MaxFlags[CurGridCol] = true;
                        MaxContent[CurGridCol] = WBeforeW;
                    }
                    else if (MaxContent[CurGridCol] < WBeforeW)
                        MaxContent[CurGridCol] = WBeforeW;
                }
            }
            else if ( GridBefore > 1 )
            {
                var SumSpanMinContent = 0;
                var SumSpanMaxContent = 0;
                var SumSpanCurContent = 0;
                var SumSpanMinMargin  = 0;
                for ( var CurSpan = CurGridCol; CurSpan < CurGridCol + GridBefore; CurSpan++ )
                {
                    SumSpanMinContent += MinContent[CurSpan];
                    SumSpanMaxContent += MaxContent[CurSpan];
                    SumSpanMinMargin  += MinMargin[CurSpan];
                    SumSpanCurContent += this.TableGridCalc[CurSpan];
                }

                if (null !== WBeforeW && SumSpanMinContent < WBeforeW - SumSpanMinMargin)
                {
					for (var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++)
						MinContent[CurSpan] = WBeforeW * this.TableGridCalc[CurSpan] / SumSpanCurContent - MinMargin[CurSpan];
                }

                // Если у нас в объединении несколько колонок, тогда явно записанная ширина ячейки не
                // перекрывает ширину ни одной из колонок, она всего лишь учавствует в определении
                // максимальной ширины.
                if (null !== WBeforeW && WBeforeW > SumSpanMaxContent)
                {
                    // TODO: На самом деле, распределение здесь идет в каком-то отношении.
                    //       Неплохо было бы выяснить как именно.
                    for ( var CurSpan = CurGridCol; CurSpan < CurGridCol + GridBefore; CurSpan++ )
                        MaxContent[CurSpan] = WBeforeW * this.TableGridCalc[CurSpan] / SumSpanCurContent;
                }
            }


            CurGridCol = BeforeInfo.GridBefore;

            var CellsCount = Row.Get_CellsCount();
            for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
            {
                var Cell         = Row.Get_Cell( CurCell );
                var CellMinMax   = Cell.Content_RecalculateMinMaxContentWidth(false);
                var CellMin      = CellMinMax.Min;
                var CellMax      = CellMinMax.Max;
                var GridSpan     = Cell.Get_GridSpan();
                var CellW        = Cell.Get_W();
                var CellWW       = null;

                var Add = ( ( 0 === CurCell || CellsCount - 1 === CurCell ) ? 3 / 2 * SpacingW : SpacingW );

                CellMin += Add;
                CellMax += Add;

                if (tblwidth_Mm === CellW.Type)
                    CellWW = CellW.W + Add;
                else if (tblwidth_Pct === CellW.Type)
                    CellWW = PctWidth * CellW.W / 100 + Add;

                // На самом деле, случай 1 === GridSpan нормально обработается и как случай GridSpan > 1,
                // но поскольку он наиболее распространен, делаем его обработку максимально быстрой (без циклов)
                if ( 1 === GridSpan )
                {
                    if ( MinContent[CurGridCol] < CellMin )
                        MinContent[CurGridCol] = CellMin;

                    if ( false === MaxFlags[CurGridCol] && MaxContent[CurGridCol] < CellMax )
                        MaxContent[CurGridCol] = CellMax;

                    // Согласно спецификации, если где-то задана ширина, то используется только первое значение
                    if (null !== CellWW && false === MaxFlags[CurGridCol])
                    {
						MaxFlags[CurGridCol]   = true;
						MaxContent[CurGridCol] = CellWW;
                    }
                }
                else
                {
                    var SumSpanMinContent = 0;
                    var SumSpanMaxContent = 0;
                    var SumSpanCurContent = 0;
                    var SumSpanMinMargin  = 0;
                    for ( var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++ )
                    {
                        SumSpanMinContent += MinContent[CurSpan];
                        SumSpanMaxContent += MaxContent[CurSpan];
                        SumSpanMinMargin  += MinMargin[CurSpan];
                        SumSpanCurContent += this.TableGridCalc[CurSpan];
                    }

					if (SumSpanMinContent < CellMin - SumSpanMinMargin)
					{
						for (var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++)
							MinContent[CurSpan] = CellMin * this.TableGridCalc[CurSpan] / SumSpanCurContent - MinMargin[CurSpan];
					}

                    // Если у нас в объединении несколько колонок, тогда явно записанная ширина ячейки не
                    // перекрывает ширину ни одной из колонок, она всего лишь учавствует в определении
                    // максимальной ширины.
                    if (null !== CellWW && CellWW > CellMax)
					{
						CellMax = CellWW;
						for (var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; ++CurSpan)
						{
							// Согласно спецификации, если где-то задана ширина, то используется только первое значение
							if (false === MaxFlags[CurSpan])
							{
								MaxFlags[CurSpan]   = true;
								MaxContent[CurSpan] = this.TableGridCalc[CurSpan];
							}
						}
					}
					else
					{
						if (SumSpanMaxContent < CellMax)
						{
							// TODO: На самом деле, распределение здесь идет в каком-то отношении.
							//       Неплохо было бы выяснить как именно.
							for (var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++)
							{
								// Согласно спецификации, если где-то задана ширина, то используется только первое значение
								if (true !== MaxFlags[CurSpan])
									MaxContent[CurSpan] = CellMax * this.TableGridCalc[CurSpan] / SumSpanCurContent;
							}
						}
					}
                }

                CurGridCol += GridSpan;
            }

            var AfterInfo = Row.Get_After();
            var GridAfter = AfterInfo.GridAfter;
            var WAfter    = AfterInfo.WAfter;

            var WAfterW   = null;
            if (tblwidth_Mm === WAfter.Type)
                WAfterW = WAfter.W;
            else if (tblwidth_Pct === WAfter.Type)
                WAfterW = PctWidth * WAfter.W / 100;

            if ( 1 === GridAfter )
            {
                if (null !== WAfterW)
                {
                    if (MinContent[CurGridCol] < WAfterW)
                        MinContent[CurGridCol] = WAfterW;

                    if ( false === MaxFlags[CurGridCol] )
                    {
                        MaxFlags[CurGridCol] = true;
                        MaxContent[CurGridCol] = WAfterW;
                    }
                    else if (MaxContent[CurGridCol] < WAfterW)
                    {
                        MaxContent[CurGridCol] = WAfterW;
                    }
                }
            }
            else if ( GridAfter > 1 )
            {
                var SumSpanMinContent = 0;
                var SumSpanMaxContent = 0;
                var SumSpanCurContent = 0;
                for ( var CurSpan = CurGridCol; CurSpan < CurGridCol + GridAfter; CurSpan++ )
                {
                    SumSpanMinContent += MinContent[CurSpan];
                    SumSpanMaxContent += MaxContent[CurSpan];
                    SumSpanCurContent += this.TableGridCalc[CurSpan];
                }

                if (null !== WAfterW && SumSpanMinContent < WAfterW)
                {
                    for ( var CurSpan = CurGridCol; CurSpan < CurGridCol + GridSpan; CurSpan++ )
                        MinContent[CurSpan] = WAfterW * this.TableGridCalc[CurSpan] / SumSpanCurContent;
                }

                // Если у нас в объединении несколько колонок, тогда явно записанная ширина ячейки не
                // перекрывает ширину ни одной из колонок, она всего лишь учавствует в определении
                // максимальной ширины.
                if (null !== WAfterW && WAfterW > SumSpanMaxContent )
                {
                    // TODO: На самом деле, распределение здесь идет в каком-то отношении.
                    //       Неплохо было бы выяснить как именно.
                    for ( var CurSpan = CurGridCol; CurSpan < CurGridCol + GridAfter; CurSpan++ )
                        MaxContent[CurSpan] = WAfterW * this.TableGridCalc[CurSpan] / SumSpanCurContent;
                }
            }
        }

        for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
        {
            if ( true === MaxFlags[CurCol] )
                MaxContent[CurCol] = Math.max( 0, MaxContent[CurCol] - MinMargin[CurCol] );

            if (MaxContent[CurCol] < MinContent[CurCol])
                MaxContent[CurCol] = MinContent[CurCol];
        }

        // 2. Проследим, чтобы значения MinContent + MinMargin и MaxContent + MinMargin не превосходили
        //    значение 55,87см(так работает Word)
        for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
        {
            if ( MinMargin[CurCol] + MinContent[CurCol] > 558.7 )
                MinContent[CurCol] = Math.max(558.7 - MinMargin[CurCol] , 0);

            if ( MinMargin[CurCol] + MaxContent[CurCol] > 558.7 )
                MaxContent[CurCol] = Math.max(558.7 - MinMargin[CurCol] , 0);
        }

        // 3. Рассчитаем максимально допустимую ширину под всю таблицу

		var PageFields;

		// Случай, когда таблица лежит внутри CBlockLevelSdt
		if (this.Parent instanceof CDocumentContent && this.LogicDocument && this.Parent.IsBlockLevelSdtContent() && this.Parent.GetTopDocumentContent() === this.LogicDocument && !this.Parent.IsTableCellContent())
		{
			var nTopIndex = -1;
			var arrPos    = this.GetDocumentPositionFromObject();
			if (arrPos.length > 0)
				nTopIndex = arrPos[0].Position;

			if (-1 !== nTopIndex)
				PageFields = this.LogicDocument.Get_ColumnFields(nTopIndex, this.Get_AbsoluteColumn(this.PageNum), this.GetAbsolutePage(this.PageNum));
		}

		if (!PageFields)
			PageFields = this.Parent.Get_ColumnFields ? this.Parent.Get_ColumnFields(this.Get_Index(), this.Get_AbsoluteColumn(this.PageNum), this.GetAbsolutePage(this.PageNum)) : this.Parent.Get_PageFields(this.private_GetRelativePageIndex(this.PageNum));

		var MaxTableW = PageFields.XLimit - PageFields.X - TablePr.TableInd - this.GetTableOffsetCorrection() + this.GetRightTableOffsetCorrection();

        // 4. Рассчитаем желаемую ширину таблицы таблицы
        // Цифра 2 означает добавочная разница
        var MaxContent2 = [];
        var SumMin = 0, SumMinMargin = 0, SumMinContent = 0, SumMax = 0, SumMaxContent2 = 0;
        var TableGrid2 = [];
        for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
        {
            var Temp = MinMargin[CurCol] + MinContent[CurCol];
            TableGrid2[CurCol] = this.TableGridCalc[CurCol];
            if ( Temp < this.TableGridCalc[CurCol] )
            {
                TableGrid2[CurCol] = this.TableGridCalc[CurCol];
            }
            else
            {
                TableGrid2[CurCol] = Temp;
            }

            MaxContent2[CurCol] = Math.max( 0, MaxContent[CurCol] - MinContent[CurCol] );

            SumMin         += Temp;
            SumMaxContent2 += MaxContent2[CurCol];
            SumMinMargin   += MinMargin[CurCol];
            SumMinContent  += MinContent[CurCol];
            SumMax         += MinMargin[CurCol] + MinContent[CurCol] + MaxContent2[CurCol];
        }

        if ((tblwidth_Mm === TablePr.TableW.Type || tblwidth_Pct === TablePr.TableW.Type) && MaxTableW < TableW)
            MaxTableW = TableW;

        if ( SumMin < MaxTableW )
        {
            // SumMin < MaxTableW, значит у нас есть свободное пространство для распределения
            // У нас есть три типа ширины: Min < Preffered < Max

            var SumMin = 0, SumPreffered = 0, SumMax = 0;
            var PreffOverMin = [], MaxOverPreff = [];
            var SumPreffOverMin = 0, SumMaxOverPreff = 0;
            var PreffContent = [];

            for (var CurCol = 0; CurCol < GridCount; ++CurCol)
            {
                var MinW   = MinMargin[CurCol] + MinContent[CurCol];
                var MaxW   = MinMargin[CurCol] + MaxContent[CurCol];
                var PreffW = (true === MaxFlags[CurCol] ? MaxW : MinW);

                SumMin       += MinW;
                SumPreffered += PreffW;
                SumMax       += MaxW;

                PreffContent[CurCol] = PreffW - MinMargin[CurCol];
                PreffOverMin[CurCol] = Math.max(0, PreffW - MinW);
                MaxOverPreff[CurCol] = Math.max(0, MaxW - PreffW);

                SumPreffOverMin += PreffOverMin[CurCol];
                SumMaxOverPreff += MaxOverPreff[CurCol];
            }

            if ( SumMax <= MaxTableW || SumMaxContent2 < 0.001 )
            {
                for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
                {
                    this.TableGridCalc[CurCol] = MinMargin[CurCol] + Math.max(MinContent[CurCol], MaxContent[CurCol]);
                }
            }
            else
            {
                for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
                {
                    this.TableGridCalc[CurCol] = MinMargin[CurCol] + MinContent[CurCol] + (MaxTableW - SumMin) * MaxContent2[CurCol] / SumMaxContent2;
                }
            }

            // Если у таблицы задана ширина, тогда ориентируемся по ширине, а если нет, тогда ориентируемся по
            // максимальным значениям.
            if (tblwidth_Mm === TablePr.TableW.Type || tblwidth_Pct === TablePr.TableW.Type)
            {
                if (SumMin < 0.001 && SumMax < 0.001)
                {
                    // Распределяем ширину по количеству колонок
                    for (var CurCol = 0; CurCol < GridCount; ++CurCol)
                    {
                        this.TableGridCalc[CurCol] = TableW / GridCount;
                    }
                }
                else if (SumMin >= TableW)
                {
                    // Выставляем минимальные значения
                    for (var CurCol = 0; CurCol < GridCount; ++CurCol)
                    {
                        this.TableGridCalc[CurCol] = MinMargin[CurCol] + MinContent[CurCol];
                    }
                }
                else if (SumPreffered >= TableW && SumPreffOverMin > 0.001)
                {
                    // Растягиваем только те колонки, в которых заданы предпочитаемые ширины
                    for (var CurCol = 0; CurCol < GridCount; ++CurCol)
                    {
                        this.TableGridCalc[CurCol] = MinMargin[CurCol] + MinContent[CurCol] + (TableW - SumMin) * PreffOverMin[CurCol] / SumPreffOverMin;
                    }
                }
                else
                {
                    // Если данное условие выполняется, значит у нас все ячейки с предпочитаемыми значениями, тогда
                    // мы растягиваем все ячейки равномерно. Если не выполняется, значит есть ячейки, в которых
                    // предпочитаемое значение не задано, и тогда растягиваем только такие ячейки.
                    if (Math.abs(SumMax - SumPreffered) < 0.001)
                    {
                        if (SumMax >= TableW)
                        {
                            for (var CurCol = 0; CurCol < GridCount; ++CurCol)
                            {
                                this.TableGridCalc[CurCol] = MinMargin[CurCol] + MinContent[CurCol] + (TableW - SumMin) * MaxContent2[CurCol] / SumMaxContent2;
                            }
                        }
                        else
                        {
                            for (var CurCol = 0; CurCol < GridCount; CurCol++)
                            {
                                this.TableGridCalc[CurCol] = MinMargin[CurCol] + MaxContent[CurCol] + (TableW - SumMax) * (MinMargin[CurCol] + MaxContent[CurCol]) / SumMax;
                            }
                        }
                    }
                    else
                    {
                        for (var CurCol = 0; CurCol < GridCount; ++CurCol)
                        {
                            this.TableGridCalc[CurCol] = MinMargin[CurCol] + PreffContent[CurCol] + (TableW - SumPreffered) * MaxOverPreff[CurCol] / SumMaxOverPreff;
                        }
                    }
                }
            }
        }
        else
        {
            // 5. Если в таблице сделать все ячейки нулевой ширины (для контента), и все равно она получается шире
            //    максимальной допустимой ширины, тогда выставляем ширины всех колоно по минимальному значению
            //    маргинов и оставляем так как есть
            if (MaxTableW - SumMinMargin < 0.001)
            {
                for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
                {
                    this.TableGridCalc[CurCol] = MinMargin[CurCol];
                }
            }
            else
            {
                // 6. Равномерно уменьшаем все колонки до достижения суммарного значения MaxTableW
                var ColsDiff = [];
                var SumColsDiff = 0;
                for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
                {
                    var Temp = TableGrid2[CurCol] - MinMargin[CurCol];
                    ColsDiff[CurCol] = Temp;
                    SumColsDiff += Temp;
                }

                for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
                {
                    TableGrid2[CurCol] = MinMargin[CurCol] + (MaxTableW - SumMinMargin) * ColsDiff[CurCol] / SumColsDiff;
                }

                // 7. Ищем колонки, у которых текущая ширина меньше MinContent (заодно ищем недостоющую сумму).
                //    Также запоминаем остальные колонки и находим у них избыточную сумму.
                var SumN = 0, SumI = 0;
                var GridCols = [];
                for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
                {
                    var Temp = TableGrid2[CurCol] - (MinMargin[CurCol] + MinContent[CurCol]);
                    if ( Temp >= 0 )
                    {
                        GridCols[CurCol] = Temp;
                        SumI += Temp;
                    }
                    else
                    {
                        GridCols[CurCol] = -1;
                        SumN -= Temp;
                    }
                }

                // 8. Если недостающего пространста больше, чем избыточного, тогда ищем разницу
                //    (MaxTableW - SumMinMargin) и распределяем ее в отношении, как соотносятся
                //    значения MinContent между собой.
                if (SumN > SumI || SumI < 0.001)
                {
                    if (SumMinContent > 0.001)
                    {
                        var SumDiff = MaxTableW - SumMinMargin;
                        for (var CurCol = 0; CurCol < GridCount; CurCol++)
                        {
                            this.TableGridCalc[CurCol] = MinMargin[CurCol] + SumDiff * MinContent[CurCol] / SumMinContent;
                        }
                    }
                    else
                    {
                        for (var CurCol = 0; CurCol < GridCount; CurCol++)
                        {
                            this.TableGridCalc[CurCol] = MinMargin[CurCol];
                        }
                    }
                }
                else
                {
                    for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
                    {
                        if ( GridCols[CurCol] < 0 )
                        {
                            this.TableGridCalc[CurCol] = MinMargin[CurCol] + MinContent[CurCol];
                        }
                        else
                        {
                            this.TableGridCalc[CurCol] = TableGrid2[CurCol] - SumN * GridCols[CurCol] / SumI;
                        }
                    }
                }
            }
        }


        this.TableSumGrid[-1] = 0;
        for ( var CurCol = 0; CurCol < GridCount; CurCol++ )
            this.TableSumGrid[CurCol] = this.TableSumGrid[CurCol - 1] + this.TableGridCalc[CurCol];
    }

    this.RecalcInfo.TableGrid = false;
};
CTable.prototype.private_RecalculateGridMinMargins = function(arrMinMargins)
{
	for (var nCurRow = 0, nRowsCount = this.GetRowsCount(); nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow      = this.GetRow(nCurRow);
		var isSpacing = null !== oRow.GetCellSpacing();

		var nCurGridCol = oRow.GetBefore().Grid;
		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell        = oRow.GetCell(nCurCell);
			var nGridSpan    = oCell.GetGridSpan();
			var oCellMargins = oCell.GetMargins();
			var oCellRBorder = oCell.GetBorder(1);
			var oCellLBorder = oCell.GetBorder(3);

			var nCellMarginsLeftW  = 0;
			var nCellMarginsRightW = 0;

			if (isSpacing)
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
				if (arrMinMargins[nCurGridCol] < nCellMarginsLeftW + nCellMarginsRightW)
					arrMinMargins[nCurGridCol] = nCellMarginsLeftW + nCellMarginsRightW;
			}
			else
			{
				// Мы не можем быть уверены в какой промежуток попадают отступы ячейки
			}

			nCurGridCol += nGridSpan;
		}
	}
};
CTable.prototype.private_RecalculateBorders = function()
{
    if ( true != this.RecalcInfo.TableBorders )
        return;

    // Обнуляем таблицу суммарных высот ячеек
    for ( var Index = -1; Index < this.Content.length; Index++ )
    {
        this.TableRowsBottom[Index] = [];
        this.TableRowsBottom[Index][0] = 0;
    }

    // Изначально найдем верхние границы и (если нужно) нижние границы
    // для каждой ячейки.
    var MaxTopBorder = [];
    var MaxBotBorder = [];
    var MaxBotMargin = [];

    for ( var Index = 0; Index < this.Content.length; Index++ )
    {
        MaxBotBorder[Index] = 0;
        MaxTopBorder[Index] = 0;
        MaxBotMargin[Index] = 0;
    }

    var TablePr = this.Get_CompiledPr(false).TablePr;
    var TableBorders = this.Get_Borders();

    for ( var CurRow = 0; CurRow < this.Content.length; CurRow++ )
    {
        var Row         = this.Content[CurRow];
        var CellsCount  = Row.Get_CellsCount();
        var CellSpacing = Row.Get_CellSpacing();

        var BeforeInfo = Row.Get_Before();
        var AfterInfo  = Row.Get_After();
        var CurGridCol = BeforeInfo.GridBefore;

        // Нам нужно пробежаться по текущей строке и выяснить максимальное значение ширины верхней
        // границы и ширины нижней границы, заодно рассчитаем вид границы у каждой ячейки,
        // также надо рассчитать максимальное значение нижнего отступа всей строки.

        var bSpacing_Top = false;
        var bSpacing_Bot = false;

        if ( null != CellSpacing )
        {
            bSpacing_Bot = true;
            bSpacing_Top = true;
        }
        else
        {
            if ( 0 != CurRow )
            {
                var PrevCellSpacing = this.Content[CurRow - 1].Get_CellSpacing();
                if ( null != PrevCellSpacing )
                    bSpacing_Top = true;
            }

            if ( this.Content.length - 1 != CurRow )
            {
                var NextCellSpacing = this.Content[CurRow + 1].Get_CellSpacing();
                if ( null != NextCellSpacing )
                    bSpacing_Bot = true;
            }
        }

        Row.Set_SpacingInfo( bSpacing_Top, bSpacing_Bot );

        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            var Cell     = Row.Get_Cell( CurCell );
            var GridSpan = Cell.Get_GridSpan();
            var Vmerge   = Cell.GetVMerge();

            Row.Set_CellInfo( CurCell, CurGridCol, 0, 0, 0, 0, 0, 0 );

            // Bug 32418 ячейки, участвующие в вертикальном объединении, все равно участвуют в определении границы
            // строки, поэтому здесь мы их не пропускаем.

            var VMergeCount = this.Internal_GetVertMergeCount( CurRow, CurGridCol, GridSpan );

            var CellMargins = Cell.GetMargins();
            if ( CellMargins.Bottom.W > MaxBotMargin[CurRow + VMergeCount - 1] )
                MaxBotMargin[CurRow + VMergeCount - 1] = CellMargins.Bottom.W;

            var CellBorders = Cell.Get_Borders();
            if ( true === bSpacing_Top )
            {
                if ( border_Single === CellBorders.Top.Value && MaxTopBorder[CurRow] < CellBorders.Top.Size )
                    MaxTopBorder[CurRow] = CellBorders.Top.Size;

                Cell.Set_BorderInfo_Top( [ CellBorders.Top ] );
            }
            else
            {
                if ( 0 === CurRow )
                {
                    // Сравним границы
                    var Result_Border = this.Internal_CompareBorders( TableBorders.Top, CellBorders.Top, true, false );
                    if ( border_Single === Result_Border.Value && MaxTopBorder[CurRow] < Result_Border.Size )
                        MaxTopBorder[CurRow] = Result_Border.Size;

                    var BorderInfo_Top = [];
                    for ( var TempIndex = 0; TempIndex < GridSpan; TempIndex++ )
                        BorderInfo_Top.push( Result_Border );

                    Cell.Set_BorderInfo_Top( BorderInfo_Top );
                }
                else
                {
                    // Ищем в предыдущей строке первую ячейку, пересекающуюся с [CurGridCol, CurGridCol + GridSpan]
                    var Prev_Row = this.Content[CurRow - 1];
                    var Prev_CellsCount = Prev_Row.Get_CellsCount();
                    var Prev_BeforeInfo = Prev_Row.Get_Before();
                    var Prev_AfterInfo  = Prev_Row.Get_After();

                    var Prev_Pos = -1;

                    var Prev_GridCol = Prev_BeforeInfo.GridBefore;
                    for ( var PrevCell = 0; PrevCell < Prev_CellsCount; PrevCell++ )
                    {
                        var Prev_Cell      = Prev_Row.Get_Cell( PrevCell );
                        var Prev_GridSpan  = Prev_Cell.Get_GridSpan();

                        if ( Prev_GridCol <= CurGridCol + GridSpan - 1 && Prev_GridCol + Prev_GridSpan - 1 >= CurGridCol )
                        {
                            Prev_Pos = PrevCell;
                            break;
                        }

                        Prev_GridCol += Prev_GridSpan;
                    }

                    var Border_Top_Info = [];

                    // Сначала посмотрим пересечение с GridBefore предыдущей строки
                    if ( CurGridCol <= Prev_BeforeInfo.GridBefore - 1 )
                    {
                        var Result_Border = this.Internal_CompareBorders( TableBorders.Left, CellBorders.Top, true, false );
                        if ( border_Single === Result_Border.Value && MaxTopBorder[CurRow] < Result_Border.Size )
                            MaxTopBorder[CurRow] = Result_Border.Size;

                        var AddCount = Math.min( Prev_BeforeInfo.GridBefore - CurGridCol, GridSpan );
                        for ( var TempIndex = 0; TempIndex < AddCount; TempIndex++ )
                            Border_Top_Info.push( Result_Border );
                    }

                    if ( -1 != Prev_Pos )
                    {
                        while ( Prev_GridCol <= CurGridCol + GridSpan - 1 && Prev_Pos < Prev_CellsCount )
                        {
                            var Prev_Cell      = Prev_Row.Get_Cell( Prev_Pos );
                            var Prev_GridSpan  = Prev_Cell.Get_GridSpan();

                            // Если данная ячейка учавствует в вертикальном объединении,
                            // тогда найдем нижнюю ячейку.

                            var Prev_VMerge = Prev_Cell.GetVMerge();
                            if ( vmerge_Continue === Prev_VMerge )
                                Prev_Cell = this.Internal_Get_EndMergedCell(CurRow - 1, Prev_GridCol, Prev_GridSpan);

                            var PrevBorders = Prev_Cell.Get_Borders();

                            // Сравним границы
                            var Result_Border = this.Internal_CompareBorders( PrevBorders.Bottom, CellBorders.Top, false, false );
                            if ( border_Single === Result_Border.Value && MaxTopBorder[CurRow] < Result_Border.Size )
                                MaxTopBorder[CurRow] = Result_Border.Size;

                            // Надо добавить столько раз, сколько колонок находится в пересечении этих двух ячееки
                            var AddCount = 0;
                            if ( Prev_GridCol >= CurGridCol )
                            {
                                if ( Prev_GridCol + Prev_GridSpan - 1 > CurGridCol + GridSpan - 1 )
                                    AddCount = CurGridCol + GridSpan - Prev_GridCol;
                                else
                                    AddCount = Prev_GridSpan;
                            }
                            else if ( Prev_GridCol + Prev_GridSpan - 1 > CurGridCol + GridSpan - 1 )
                                AddCount = GridSpan;
                            else
                                AddCount = Prev_GridCol + Prev_GridSpan - CurGridCol;

                            for ( var TempIndex = 0; TempIndex < AddCount; TempIndex++ )
                                Border_Top_Info.push( Result_Border );

                            Prev_Pos++;
                            Prev_GridCol += Prev_GridSpan;
                        }
                    }

                    // Посмотрим пересечение с GridAfter предыдущей строки
                    if ( Prev_AfterInfo.GridAfter > 0 )
                    {
                        var StartAfterGrid = Prev_Row.Get_CellInfo( Prev_CellsCount - 1 ).StartGridCol + Prev_Row.Get_Cell( Prev_CellsCount - 1 ).Get_GridSpan();

                        if ( CurGridCol + GridSpan - 1 >= StartAfterGrid )
                        {
                            var Result_Border = this.Internal_CompareBorders( TableBorders.Right, CellBorders.Top, true, false );
                            if ( border_Single === Result_Border.Value && MaxTopBorder[CurRow] < Result_Border.Size )
                                MaxTopBorder[CurRow] = Result_Border.Size;

                            var AddCount = Math.min( CurGridCol + GridSpan - StartAfterGrid, GridSpan );
                            for ( var TempIndex = 0; TempIndex < AddCount; TempIndex++ )
                                Border_Top_Info.push( Result_Border );
                        }
                    }

                    Cell.Set_BorderInfo_Top( Border_Top_Info );
                }
            }

            var CellBordersBottom = CellBorders.Bottom;
            if (VMergeCount > 1)
            {
                // Берем нижнюю границу нижней ячейки вертикального объединения.
                var BottomCell = this.Internal_Get_EndMergedCell(CurRow, CurGridCol, GridSpan);
                if (null !== BottomCell)
                    CellBordersBottom = BottomCell.Get_Borders().Bottom;
            }

            if ( true === bSpacing_Bot )
            {
                Cell.Set_BorderInfo_Bottom( [CellBordersBottom], -1, -1 );

                if ( border_Single === CellBordersBottom.Value && CellBordersBottom.Size > MaxBotBorder[CurRow + VMergeCount - 1] )
                    MaxBotBorder[CurRow + VMergeCount - 1] = CellBordersBottom.Size;
            }
            else
            {
                if ( this.Content.length - 1 === CurRow + VMergeCount - 1 )
                {
                    // Сравним границы
                    var Result_Border = this.Internal_CompareBorders( TableBorders.Bottom, CellBordersBottom, true, false );

                    if ( border_Single === Result_Border.Value && Result_Border.Size > MaxBotBorder[CurRow + VMergeCount - 1] )
                        MaxBotBorder[CurRow + VMergeCount - 1] = Result_Border.Size;

                    if ( GridSpan > 0 )
                    {
                        for ( var TempIndex = 0; TempIndex < GridSpan; TempIndex++ )
                            Cell.Set_BorderInfo_Bottom( [ Result_Border ], -1, -1 );
                    }
                    else
                        Cell.Set_BorderInfo_Bottom( [ ], -1, -1 );
                }
                else
                {
                    // Мы должны проверить нижнюю границу ячейки, на предмет того, что со следующей строкой
                    // она может пересекаться по GridBefore и/или GridAfter. Везде в таких местах мы должны
                    // нарисовать нижнюю границу. Пересечение с ячейками нам неинтересено, потому что этот
                    // случай будет учтен при обсчете следующей строки (там будет случай bSpacing_Top = false
                    // и 0 != CurRow )

                    var Next_Row = this.Content[CurRow + VMergeCount];
                    var Next_CellsCount = Next_Row.Get_CellsCount();
                    var Next_BeforeInfo = Next_Row.Get_Before();
                    var Next_AfterInfo  = Next_Row.Get_After();

                    var Border_Bottom_Info = [];

                    // Сначала посмотрим пересечение с GridBefore предыдущей строки
                    var BeforeCount = 0;
                    if ( CurGridCol <= Next_BeforeInfo.GridBefore - 1 )
                    {
                        var Result_Border = this.Internal_CompareBorders( TableBorders.Left, CellBordersBottom, true, false );
                        BeforeCount = Math.min( Next_BeforeInfo.GridBefore - CurGridCol, GridSpan );

                        for ( var TempIndex = 0; TempIndex < BeforeCount; TempIndex++ )
                            Border_Bottom_Info.push( Result_Border );
                    }

                    var Next_GridCol = Next_BeforeInfo.GridBefore;
                    for ( var NextCell = 0; NextCell < Next_CellsCount; NextCell++ )
                    {
                        var Next_Cell     = Next_Row.Get_Cell( NextCell );
                        var Next_GridSpan = Next_Cell.Get_GridSpan();
                        Next_GridCol += Next_GridSpan;
                    }

                    // Посмотрим пересечение с GridAfter предыдущей строки
                    var AfterCount = 0;
                    if ( Next_AfterInfo.GridAfter > 0 )
                    {
                        var StartAfterGrid = Next_GridCol;

                        if ( CurGridCol + GridSpan - 1 >= StartAfterGrid )
                        {
                            var Result_Border = this.Internal_CompareBorders( TableBorders.Right, CellBordersBottom, true, false );
                            AfterCount = Math.min( CurGridCol + GridSpan - StartAfterGrid, GridSpan );
                            for ( var TempIndex = 0; TempIndex < AfterCount; TempIndex++ )
                                Border_Bottom_Info.push( Result_Border );
                        }
                    }

                    Cell.Set_BorderInfo_Bottom( Border_Bottom_Info, BeforeCount, AfterCount );
                }
            }

            CurGridCol += GridSpan;
        }
    }

    this.MaxTopBorder = MaxTopBorder;
    this.MaxBotBorder = MaxBotBorder;
    this.MaxBotMargin = MaxBotMargin;

    // Также для каждой ячейки обсчитаем ее метрики и левую и правую границы
    for ( var CurRow = 0; CurRow < this.Content.length; CurRow++  )
    {
        var Row         = this.Content[CurRow];
        var CellsCount  = Row.Get_CellsCount();
        var CellSpacing = Row.Get_CellSpacing();

        var BeforeInfo  = Row.Get_Before();
        var AfterInfo   = Row.Get_After();
        var CurGridCol  = BeforeInfo.GridBefore;

        var Row_x_max = 0;
        var Row_x_min = 0;

        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            var Cell     = Row.Get_Cell( CurCell );
            var GridSpan = Cell.Get_GridSpan();
            var Vmerge   = Cell.GetVMerge();

            // начальная и конечная точки данного GridSpan'a
            var X_grid_start = this.TableSumGrid[CurGridCol - 1];
            var X_grid_end   = this.TableSumGrid[CurGridCol + GridSpan - 1];

            // границы самой ячейки
            var X_cell_start = X_grid_start;
            var X_cell_end   = X_grid_end;

            if ( null != CellSpacing )
            {

                if ( 0 === CurCell )
                {
                    if ( 0 === BeforeInfo.GridBefore )
                    {
                        if ( border_None === TableBorders.Left.Value || CellSpacing > TableBorders.Left.Size / 2 )
                            X_cell_start += CellSpacing;
                        else
                            X_cell_start += TableBorders.Left.Size / 2;
                    }
                    else
                    {
                        if ( border_None === TableBorders.Left.Value || CellSpacing > TableBorders.Left.Size ) // CellSpacing / 2 > TableBorders.Left.Size / 2
                            X_cell_start += CellSpacing / 2;
                        else
                            X_cell_start += TableBorders.Left.Size / 2;
                    }
                }
                else
                    X_cell_start += CellSpacing / 2;

                if ( CellsCount - 1 === CurCell )
                {
                    if ( 0 === AfterInfo.GridAfter )
                    {
                        if ( border_None === TableBorders.Right.Value || CellSpacing > TableBorders.Right.Size / 2 )
                            X_cell_end -= CellSpacing;
                        else
                            X_cell_end -= TableBorders.Right.Size / 2;
                    }
                    else
                    {
                        if ( border_None === TableBorders.Right.Value || CellSpacing > TableBorders.Right.Size ) // CellSpacing / 2 > TableBorders.Right.Size / 2
                            X_cell_end -= CellSpacing / 2;
                        else
                            X_cell_end -= TableBorders.Right.Size / 2;
                    }
                }
                else
                    X_cell_end -= CellSpacing / 2;
            }

            var CellMar = Cell.GetMargins();

            var VMergeCount = this.Internal_GetVertMergeCount( CurRow, CurGridCol, GridSpan );

            // начальная и конечная точка для содержимого данной ячейки
            var X_content_start = X_cell_start;
            var X_content_end   = X_cell_end;

            // Левая и правая границы ячейки рисуются вовнутрь ячейки, если Spacing != null.
            var CellBorders = Cell.Get_Borders();
            if ( null != CellSpacing )
            {
                X_content_start += CellMar.Left.W;
                X_content_end   -= CellMar.Right.W;

                if ( border_Single === CellBorders.Left.Value )
                    X_content_start += CellBorders.Left.Size;

                if ( border_Single === CellBorders.Right.Value )
                    X_content_end -= CellBorders.Right.Size;
            }
            else
            {
                if ( vmerge_Continue === Vmerge )
                {
                    X_content_start += CellMar.Left.W;
                    X_content_end   -= CellMar.Right.W;
                }
                else
                {
                    // Линии правой и левой границы рисуются ровно по сетке
                    // (середина линии(всмысле толщины линии) совпадает с линией сетки).
                    // Мы должны найти максимальную толщину линии, учавствущую в правой/левой
                    // границах. Если данная толщина меньше соответствующего отступа, тогда
                    // она не влияет на расположение содержимого ячейки, в противном случае,
                    // максимальная толщина линии и задает отступ для содержимого.

                    // Поэтому первым шагом определим максимальную толщину правой и левой границ.

                    var Max_r_w = 0;
                    var Max_l_w = 0;
                    var Borders_Info =
                        {
                            Right     : [],
                            Left      : [],

                            Right_Max : 0,
                            Left_Max  : 0
                        };

                    for ( var Temp_CurRow = 0; Temp_CurRow < VMergeCount; Temp_CurRow++ )
                    {
                        var Temp_Row = this.Content[CurRow + Temp_CurRow];
                        var Temp_CellsCount = Temp_Row.Get_CellsCount();

                        // ищем ячейку текущего объединения
                        var Temp_CurCell = this.private_GetCellIndexByStartGridCol( CurRow + Temp_CurRow, CurGridCol );
                        if ( Temp_CurCell < 0 )
                            continue;

                        // левая граница
                        if ( 0 === Temp_CurCell )
                        {
                            var LeftBorder = this.Internal_CompareBorders( TableBorders.Left, CellBorders.Left, true, false );
                            if ( border_Single === LeftBorder.Value && LeftBorder.Size > Max_l_w )
                                Max_l_w = LeftBorder.Size;

                            Borders_Info.Left.push( LeftBorder );
                        }
                        else
                        {
                            var Temp_Prev_Cell = Temp_Row.Get_Cell( Temp_CurCell - 1 );
                            var Temp_Prev_VMerge = Temp_Prev_Cell.GetVMerge();
                            if ( 0 != Temp_CurRow && vmerge_Continue === Temp_Prev_VMerge )
                            {
                                Borders_Info.Left.push( Borders_Info.Left[Borders_Info.Left.length - 1] );
                            }
                            else
                            {
                                var Temp_Prev_Main_Cell = this.Internal_Get_StartMergedCell( CurRow + Temp_CurRow, CurGridCol - Temp_Prev_Cell.Get_GridSpan(), Temp_Prev_Cell.Get_GridSpan() );
                                var Temp_Prev_Main_Cell_Borders = Temp_Prev_Main_Cell.Get_Borders();

                                var LeftBorder = this.Internal_CompareBorders( Temp_Prev_Main_Cell_Borders.Right, CellBorders.Left, false, false );
                                if ( border_Single === LeftBorder.Value && LeftBorder.Size > Max_l_w )
                                    Max_l_w = LeftBorder.Size;

                                Borders_Info.Left.push( LeftBorder );
                            }
                        }

                        if ( Temp_CellsCount - 1 === Temp_CurCell )
                        {
                            var RightBorder = this.Internal_CompareBorders( TableBorders.Right, CellBorders.Right, true, false );
                            if ( border_Single === RightBorder.Value && RightBorder.Size > Max_r_w )
                                Max_r_w = RightBorder.Size;

                            Borders_Info.Right.push( RightBorder );
                        }
                        else
                        {
                            var Temp_Next_Cell = Temp_Row.Get_Cell( Temp_CurCell + 1 );
                            var Temp_Next_VMerge = Temp_Next_Cell.GetVMerge();
                            if ( 0 != Temp_CurRow && vmerge_Continue === Temp_Next_VMerge )
                            {
                                Borders_Info.Right.push( Borders_Info.Right[Borders_Info.Right.length - 1] );
                            }
                            else
                            {
                                var Temp_Next_Main_Cell = this.Internal_Get_StartMergedCell( CurRow + Temp_CurRow, CurGridCol + GridSpan, Temp_Next_Cell.Get_GridSpan() );
                                var Temp_Next_Main_Cell_Borders = Temp_Next_Main_Cell.Get_Borders();

                                var RightBorder = this.Internal_CompareBorders( Temp_Next_Main_Cell_Borders.Left, CellBorders.Right, false, false );
                                if ( border_Single === RightBorder.Value && RightBorder.Size > Max_r_w )
                                    Max_r_w = RightBorder.Size;

                                Borders_Info.Right.push( RightBorder );
                            }
                        }
                    }

                    Borders_Info.Right_Max = Max_r_w;
                    Borders_Info.Left_Max  = Max_l_w;

                    if ( Max_l_w / 2 > CellMar.Left.W )
                        X_content_start += Max_l_w / 2;
                    else
                        X_content_start += CellMar.Left.W;

                    if ( Max_r_w / 2 > CellMar.Right.W )
                        X_content_end -= Max_r_w / 2;
                    else
                        X_content_end -= CellMar.Right.W;

                    Cell.Set_BorderInfo_Left ( Borders_Info.Left,  Max_l_w );
                    Cell.Set_BorderInfo_Right( Borders_Info.Right, Max_r_w );
                }
            }

            if ( 0 === CurCell )
            {
                if ( null != CellSpacing )
                {
                    Row_x_min = X_grid_start;
                    if ( border_Single === TableBorders.Left.Value )
                        Row_x_min -= TableBorders.Left.Size / 2;
                }
                else
                {
                    var BorderInfo = Cell.Get_BorderInfo();
                    Row_x_min = X_grid_start - BorderInfo.MaxLeft / 2;
                }
            }

            if ( CellsCount - 1 === CurCell )
            {
                if ( null != CellSpacing )
                {
                    Row_x_max = X_grid_end;
                    if ( border_Single === TableBorders.Right.Value )
                        Row_x_max += TableBorders.Right.Size / 2;
                }
                else
                {
                    var BorderInfo = Cell.Get_BorderInfo();
                    Row_x_max = X_grid_end + BorderInfo.MaxRight / 2;
                }
            }

            Cell.Set_Metrics( CurGridCol, X_grid_start, X_grid_end, X_cell_start, X_cell_end, X_content_start, X_content_end );

            CurGridCol += GridSpan;
        }

        Row.Set_Metrics_X( Row_x_min, Row_x_max );
    }

    this.RecalcInfo.TableBorders = false;
};
CTable.prototype.private_RecalculateHeader = function()
{
    // Если у нас таблица внутри таблицы, тогда в ней заголовочных строк не должно быть,
    // потому что так делает Word.
    if ( true === this.Parent.IsTableCellContent() )
    {
        this.HeaderInfo.Count = 0;
        return;
    }

    // Здесь мы подготавливаем информацию для пересчета заголовка таблицы
    var Header_RowsCount = 0;
    var Rows_Count = this.Content.length;
    for ( var Index = 0; Index < Rows_Count; Index++ )
    {
        var Row = this.Content[Index];
        if ( true != Row.IsHeader() )
            break;

        Header_RowsCount++;
    }

    // Избавимся от строк, в которых есть вертикально объединенные ячейки, которые одновременно есть в заголовке
    // и не в заголовке
    for ( var CurRow = Header_RowsCount - 1; CurRow >= 0; CurRow-- )
    {
        var Row = this.Content[CurRow];
        var Cells_Count = Row.Get_CellsCount();

        var bContinue = false;
        for ( var CurCell = 0; CurCell < Cells_Count; CurCell++ )
        {
            var Cell        = Row.Get_Cell( CurCell );
            var GridSpan    = Cell.Get_GridSpan();
            var CurGridCol  = Cell.Metrics.StartGridCol;
            var VMergeCount = this.Internal_GetVertMergeCount( CurRow, CurGridCol, GridSpan );

            // В данной строке нашли вертикально объединенную ячейку с ячейкой не из заголовка
            // Поэтому выкидываем данную строку и проверяем предыдущую
            if ( VMergeCount > 1 )
            {
                Header_RowsCount--;
                bContinue = true;
                break;
            }
        }

        if ( true != bContinue )
        {
            // Если дошли до этого места, значит данная строка, а, следовательно, и все строки выше
            // нормальные в плане объединенных вертикально ячеек.
            break;
        }
    }

    this.HeaderInfo.Count = Header_RowsCount;
};
CTable.prototype.private_RecalculatePageXY = function(CurPage)
{
    var FirstRow = 0;
    if (0 !== CurPage)
    {
        if (true === this.IsEmptyPage(CurPage - 1))
            FirstRow = this.Pages[CurPage - 1].FirstRow;
        else if (true === this.Pages[CurPage - 1].LastRowSplit)
            FirstRow = this.Pages[CurPage - 1].LastRow;
        else
            FirstRow = Math.min(this.Pages[CurPage - 1].LastRow + 1, this.Content.length - 1);
    }

    var TempMaxTopBorder = this.Get_MaxTopBorder(FirstRow);
    this.Pages.length = Math.max(CurPage, 0);
    if (0 === CurPage)
    {
        this.Pages[CurPage] = new CTablePage(this.X, this.Y, this.XLimit, this.YLimit, FirstRow, TempMaxTopBorder);
    }
    else
    {
        var StartPos = this.Parent.Get_PageContentStartPos2(this.PageNum, this.ColumnNum, CurPage, this.Index);
        this.Pages[CurPage] = new CTablePage(StartPos.X, StartPos.Y, StartPos.XLimit, StartPos.YLimit, FirstRow, TempMaxTopBorder);
    }
};
CTable.prototype.private_RecalculatePositionX = function(CurPage)
{
    var TablePr = this.Get_CompiledPr(false).TablePr;
    var PageLimits = this.Parent.Get_PageLimits(this.PageNum);
    var PageFields = this.Parent.Get_PageFields(this.PageNum);

    var LD_PageLimits = this.LogicDocument.Get_PageLimits( this.Get_StartPage_Absolute() );
    var LD_PageFields = this.LogicDocument.Get_PageFields( this.Get_StartPage_Absolute() );

    if ( true === this.Is_Inline() )
    {
        var Page = this.Pages[CurPage];
        if (0 === CurPage)
        {
            this.AnchorPosition.CalcX = this.X_origin + TablePr.TableInd;
            this.AnchorPosition.Set_X(this.TableSumGrid[this.TableSumGrid.length - 1], this.X_origin, LD_PageFields.X, LD_PageFields.XLimit, LD_PageLimits.XLimit, PageLimits.X, PageLimits.XLimit);
        }

        switch (TablePr.Jc)
        {
            case AscCommon.align_Left :
            {
                Page.X = Page.X_origin + this.GetTableOffsetCorrection() + TablePr.TableInd;
                break;
            }
            case AscCommon.align_Right :
            {
                var TableWidth = this.TableSumGrid[this.TableSumGrid.length - 1];

                if (false === this.Parent.IsTableCellContent())
                    Page.X = Page.XLimit - TableWidth + 1.9; // 1.9мм всегда добавляется справа от таблицы
                else
                    Page.X = Page.XLimit - TableWidth;
                break;
            }
            case AscCommon.align_Center :
            {
                var TableWidth = this.TableSumGrid[this.TableSumGrid.length - 1];
                var RangeWidth = Page.XLimit - Page.X_origin;

                Page.X = Page.X_origin + ( RangeWidth - TableWidth ) / 2;
                break;
            }
        }
    }
    else
    {
        if (0 === CurPage)
        {
        	var oSectPr = this.Get_SectPr();
        	if (oSectPr)
			{
				var oFrame = oSectPr.GetContentFrame(this.GetAbsolutePage(CurPage));

				PageFields.Y      = oFrame.Top;
				PageFields.YLimit = oFrame.Bottom;
				PageFields.X      = oFrame.Left;
				PageFields.XLimit = oFrame.Right;
			}

            var OffsetCorrection_Left  = this.GetTableOffsetCorrection();
            var OffsetCorrection_Right = this.GetRightTableOffsetCorrection();

            this.X = this.X_origin + OffsetCorrection_Left;
            this.AnchorPosition.Set_X(this.TableSumGrid[this.TableSumGrid.length - 1], this.X_origin, PageFields.X + OffsetCorrection_Left, PageFields.XLimit + OffsetCorrection_Right, LD_PageLimits.XLimit, PageLimits.X + OffsetCorrection_Left, PageLimits.XLimit + OffsetCorrection_Right);

            // Непонятно по какой причине, но Word для плавающих таблиц добаляется значение TableInd
			this.AnchorPosition.Calculate_X(this.PositionH.RelativeFrom, this.PositionH.Align, this.PositionH.Value);
			this.AnchorPosition.CalcX += TablePr.TableInd;

            this.X        = this.AnchorPosition.CalcX;
            this.X_origin = this.X - OffsetCorrection_Left;

			if (undefined != this.PositionH_Old)
            {
                // Восстанови старые значения, чтобы в историю изменений все нормально записалось
                this.PositionH.RelativeFrom = this.PositionH_Old.RelativeFrom;
                this.PositionH.Align        = this.PositionH_Old.Align;
                this.PositionH.Value        = this.PositionH_Old.Value;

                // Рассчитаем сдвиг с учетом старой привязки
                var Value = this.AnchorPosition.Calculate_X_Value(this.PositionH_Old.RelativeFrom);
                this.Set_PositionH(this.PositionH_Old.RelativeFrom, false, Value);

                // На всякий случай пересчитаем заново координату
				this.X        = this.AnchorPosition.Calculate_X(this.PositionH.RelativeFrom, this.PositionH.Align, this.PositionH.Value);
                this.X_origin = this.X - OffsetCorrection_Left;

                this.PositionH_Old = undefined;
            }
        }

        this.Pages[CurPage].X        = this.X;
        this.Pages[CurPage].XLimit   = this.XLimit;
        this.Pages[CurPage].X_origin = this.X_origin;
    }
};
CTable.prototype.private_RecalculatePage = function(CurPage)
{
    if ( true === this.TurnOffRecalc )
        return;

	var isInnerTable       = this.Parent.IsTableCellContent();
	var oTopDocument       = this.Parent.Is_TopDocument(true);
	var isTopLogicDocument = (oTopDocument instanceof CDocument ? true : false);
	var oFootnotes         = (isTopLogicDocument && !isInnerTable ? oTopDocument.Footnotes : null);
	var nPageAbs           = this.Get_AbsolutePage(CurPage);
	var nColumnAbs         = this.Get_AbsoluteColumn(CurPage);

    this.TurnOffRecalc = true;

    var FirstRow = 0;
    var LastRow  = 0;

    var ResetStartElement = false;
    if ( 0 === CurPage )
    {
        // Обнуляем таблицу суммарных высот ячеек
        for ( var Index = -1; Index < this.Content.length; Index++ )
        {
            this.TableRowsBottom[Index] = [];
            this.TableRowsBottom[Index][0] = 0;
        }
    }
    else
    {
        if (true === this.IsEmptyPage(CurPage - 1))
        {
            ResetStartElement = false;
            FirstRow = this.Pages[CurPage - 1].FirstRow;
        }
        else if (true === this.Pages[CurPage - 1].LastRowSplit)
        {
            ResetStartElement = false;
            FirstRow = this.Pages[CurPage - 1].LastRow;
        }
        else
        {
            ResetStartElement = true;
            FirstRow = Math.min(this.Pages[CurPage - 1].LastRow + 1, this.Content.length - 1);
        }

        LastRow = FirstRow;
    }

    var MaxTopBorder     = this.MaxTopBorder;
    var MaxBotBorder     = this.MaxBotBorder;
    var MaxBotMargin     = this.MaxBotMargin;

    var StartPos = this.Pages[CurPage];
    if (true === this.Check_EmptyPages(CurPage - 1))
        this.HeaderInfo.PageIndex = -1;

    var Page = this.Pages[CurPage];
    var TempMaxTopBorder = Page.MaxTopBorder;

    var Y = StartPos.Y;
    var TableHeight = 0;

    var TableBorders = this.Get_Borders();

    var X_max = -1;
    var X_min = -1;
	if (this.HeaderInfo.Count > 0 && this.HeaderInfo.PageIndex != -1 && CurPage > this.HeaderInfo.PageIndex && this.IsInline())
    {
    	this.HeaderInfo.HeaderRecalculate = true;
        this.HeaderInfo.Pages[CurPage] = {};
        this.HeaderInfo.Pages[CurPage].RowsInfo = [];
        var HeaderPage = this.HeaderInfo.Pages[CurPage];

        // Рисуем ли заголовок на данной странице
        HeaderPage.Draw = true;

        // Скопируем целиком строки
        HeaderPage.Rows = [];

        // Временно отключаем регистрацию новых классов
        AscCommon.g_oTableId.m_bTurnOff = true;
        AscCommon.History.TurnOff();

		this.LogicDocument.RecalcTableHeader = true;

		var aContentDrawings = [];
        for ( var Index = 0; Index < this.HeaderInfo.Count; Index++ )
        {
            HeaderPage.Rows[Index] = this.Content[Index].Copy(this);
            HeaderPage.Rows[Index].Index = Index;
            for(var CellIndex = 0; CellIndex < HeaderPage.Rows[Index].Content.length; ++CellIndex)
            {
                HeaderPage.Rows[Index].Content[CellIndex].Content.GetAllDrawingObjects(aContentDrawings);
            }
        }
        for(var DrawingIndex = 0; DrawingIndex < aContentDrawings.length; ++DrawingIndex)
        {
            if(aContentDrawings[DrawingIndex] && aContentDrawings[DrawingIndex].GraphicObj)
            {
                aContentDrawings[DrawingIndex].GraphicObj.recalculate();
                if(aContentDrawings[DrawingIndex].GraphicObj.recalculateText)
                {
                    aContentDrawings[DrawingIndex].GraphicObj.recalculateText();
                }
            }
        }

        AscCommon.g_oTableId.m_bTurnOff = false;
        AscCommon.History.TurnOn();

        var bHeaderNextPage = false;
        for ( var CurRow = 0; CurRow < this.HeaderInfo.Count; CurRow++  )
        {
            HeaderPage.RowsInfo[CurRow] = {};
            HeaderPage.RowsInfo[CurRow].Y               = 0;
            HeaderPage.RowsInfo[CurRow].H               = 0;
            HeaderPage.RowsInfo[CurRow].TopDy           = 0;
            HeaderPage.RowsInfo[CurRow].MaxTopBorder    = 0;
            HeaderPage.RowsInfo[CurRow].TableRowsBottom = 0;

            var Row         = HeaderPage.Rows[CurRow];
            var CellsCount  = Row.Get_CellsCount();
            var CellSpacing = Row.Get_CellSpacing();

            var BeforeInfo  = Row.Get_Before();
            var CurGridCol  = BeforeInfo.GridBefore;

            // Добавляем ширину верхней границы у текущей строки (используем MaxTopBorder самой таблицы)
            Y           += MaxTopBorder[CurRow];
            TableHeight += MaxTopBorder[CurRow];

            // Если таблица с расстоянием между ячейками, тогда добавляем его
            if ( 0 === CurRow )
            {
                if ( null != CellSpacing )
                {
                    var TableBorder_Top = this.Get_Borders().Top;
                    if ( border_Single === TableBorder_Top.Value )
                    {
                        Y           += TableBorder_Top.Size;
                        TableHeight += TableBorder_Top.Size;
                    }

                    Y           += CellSpacing;
                    TableHeight += CellSpacing;
                }
            }
            else
            {
                var PrevCellSpacing = HeaderPage.Rows[CurRow - 1].Get_CellSpacing();

                if ( null != CellSpacing && null != PrevCellSpacing )
                {
                    Y           += (PrevCellSpacing + CellSpacing) / 2;
                    TableHeight += (PrevCellSpacing + CellSpacing) / 2;
                }
                else if ( null != CellSpacing )
                {
                    Y           += CellSpacing / 2;
                    TableHeight += CellSpacing / 2;
                }
                else if ( null != PrevCellSpacing )
                {
                    Y           += PrevCellSpacing / 2;
                    TableHeight += PrevCellSpacing / 2;
                }
            }

            var Row_x_max = Row.Metrics.X_max;
            var Row_x_min = Row.Metrics.X_min;

            if ( -1 === X_min || Row_x_min < X_min )
                X_min = Row_x_min;

            if ( -1 === X_max || Row_x_max > X_max )
                X_max = Row_x_max;

            // Дополнительный параметр для случая, если данная строка начнется с новой страницы.
            // Мы запоминаем максимальное значение нижней границы(первой страницы (текущей)) у ячеек,
            // объединенных вертикально так, чтобы это объединение заканчивалось на данной строке.
            // И если данная строка начнется сразу с новой страницы (Pages > 0, FirstPage = false), тогда
            // мы должны данный параметр сравнить со значением нижней границы предыдущей строки.
            var MaxBotValue_vmerge = -1;

            var RowH = Row.Get_Height();
            var VerticallCells = [];

            for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
            {
                var Cell     = Row.Get_Cell( CurCell );
                var GridSpan = Cell.Get_GridSpan();
                var Vmerge   = Cell.GetVMerge();
                var CellMar  = Cell.GetMargins();

                Row.Update_CellInfo(CurCell);

                var CellMetrics = Row.Get_CellInfo( CurCell );

                var X_content_start = Page.X + CellMetrics.X_content_start;
                var X_content_end   = Page.X + CellMetrics.X_content_end;

                var Y_content_start = Y + CellMar.Top.W;
                var Y_content_end   = this.Pages[CurPage].YLimit;

                // TODO: При расчете YLimit для ячейки сделать учет толщины нижних
                //       границ ячейки и таблицы
                if ( null != CellSpacing )
                {
                    if ( this.Content.length - 1 === CurRow )
                        Y_content_end -= CellSpacing;
                    else
                        Y_content_end -= CellSpacing / 2;
                }

                var VMergeCount = this.Internal_GetVertMergeCount( CurRow, CurGridCol, GridSpan );
                var BottomMargin = this.MaxBotMargin[CurRow + VMergeCount - 1];
                Y_content_end -= BottomMargin;

                // Такие ячейки мы обсчитываем, если либо сейчас происходит переход на новую страницу, либо
                // это последняя ячейка в объединении.
                // Обсчет такик ячеек произошел ранее

                Cell.Temp.Y = Y_content_start;

                if ( VMergeCount > 1 )
                {
                    CurGridCol += GridSpan;
                    continue;
                }
                else
                {
                    // Возьмем верхнюю ячейку теккущего объединения
                    if ( vmerge_Restart != Vmerge )
                    {
                        // Найдем ячейку в самой таблице, а дальше по индексам ячейки и строки получим ее в скопированном заголовке
                        Cell    = this.Internal_Get_StartMergedCell( CurRow, CurGridCol, GridSpan );
                        var cIndex = Cell.Index;
                        var rIndex = Cell.Row.Index;

                        Cell = HeaderPage.Rows[rIndex].Get_Cell( cIndex );

                        CellMar = Cell.GetMargins();

                        Y_content_start = Cell.Temp.Y + CellMar.Top.W;
                    }
                }

                if (true === Cell.Is_VerticalText())
                {
                    VerticallCells.push(Cell);
                    CurGridCol += GridSpan;
                    continue;
                }

                Cell.Content.Set_StartPage( CurPage );
                Cell.Content.Reset( X_content_start, Y_content_start, X_content_end, Y_content_end );
                Cell.Content.Set_ClipInfo(0, Page.X + CellMetrics.X_cell_start, Page.X + CellMetrics.X_cell_end);

                if ( recalcresult2_NextPage === Cell.Content.Recalculate_Page( 0, true ) )
                {
                    bHeaderNextPage = true;
                    break;
                }

                var CellContentBounds = Cell.Content.Get_PageBounds( 0, undefined, true );
                var CellContentBounds_Bottom = CellContentBounds.Bottom + BottomMargin;

                if ( undefined === HeaderPage.RowsInfo[CurRow].TableRowsBottom || HeaderPage.RowsInfo[CurRow].TableRowsBottom < CellContentBounds_Bottom )
                    HeaderPage.RowsInfo[CurRow].TableRowsBottom = CellContentBounds_Bottom;

                if ( vmerge_Continue === Vmerge )
                {
                    if ( -1 === MaxBotValue_vmerge || MaxBotValue_vmerge < CellContentBounds_Bottom )
                        MaxBotValue_vmerge = CellContentBounds_Bottom;
                }

                CurGridCol += GridSpan;
            }

            // Если заголовок целиком на странице не убирается, тогда мы его попросту не рисуем на данной странице
            if ( true === bHeaderNextPage )
            {
                Y = StartPos.Y;
                TableHeight = 0;
                HeaderPage.Draw = false;
                break;
            }


            // Здесь мы выставляем только начальную координату строки (для каждой страницы)
            // высоту строки(для каждой страницы) мы должны обсчитать после общего цикла, т.к.
            // в одной из следйющих строк может оказаться ячейка с вертикальным объединением,
            // захватывающим данную строку. Значит, ее содержимое может изменить высоту нашей строки.
            var TempY            = Y;
            var TempMaxTopBorder = MaxTopBorder[CurRow];

            if ( null != CellSpacing )
            {
                HeaderPage.RowsInfo[CurRow].Y            = TempY;
                HeaderPage.RowsInfo[CurRow].TopDy        = 0;
                HeaderPage.RowsInfo[CurRow].X0           = Row_x_min;
                HeaderPage.RowsInfo[CurRow].X1           = Row_x_max;
                HeaderPage.RowsInfo[CurRow].MaxTopBorder = TempMaxTopBorder;
                HeaderPage.RowsInfo[CurRow].MaxBotBorder = MaxBotBorder[CurRow];
            }
            else
            {
                HeaderPage.RowsInfo[CurRow].Y            = TempY - TempMaxTopBorder;
                HeaderPage.RowsInfo[CurRow].TopDy        = TempMaxTopBorder;
                HeaderPage.RowsInfo[CurRow].X0           = Row_x_min;
                HeaderPage.RowsInfo[CurRow].X1           = Row_x_max;
                HeaderPage.RowsInfo[CurRow].MaxTopBorder = TempMaxTopBorder;
                HeaderPage.RowsInfo[CurRow].MaxBotBorder = MaxBotBorder[CurRow];
            }

            var CellHeight = HeaderPage.RowsInfo[CurRow].TableRowsBottom - Y;

            // TODO: улучшить проверку на высоту строки (для строк разбитых на страницы)
            if (false === bHeaderNextPage && (Asc.linerule_AtLeast === RowH.HRule || Asc.linerule_Exact === RowH.HRule) && CellHeight < RowH.Value - MaxTopBorder[CurRow])
            {
                CellHeight = RowH.Value - MaxTopBorder[CurRow];
                HeaderPage.RowsInfo[CurRow].TableRowsBottom = Y + CellHeight;
            }

            // Рассчитываем ячейки с вертикальным текстом
            var CellsCount2 = VerticallCells.length;
            for (var TempCellIndex = 0; TempCellIndex < CellsCount2; TempCellIndex++)
            {
                var Cell       = VerticallCells[TempCellIndex];
                var CurCell    = Cell.Index;
                var GridSpan   = Cell.Get_GridSpan();
                var CurGridCol = Cell.Metrics.StartGridCol;

                // Возьмем верхнюю ячейку текущего объединения
                Cell = this.Internal_Get_StartMergedCell(CurRow, CurGridCol, GridSpan);
                var cIndex = Cell.Index;
                var rIndex = Cell.Row.Index;
                Cell = HeaderPage.Rows[rIndex].Get_Cell( cIndex );

                var CellMar     = Cell.GetMargins();
                var CellMetrics = Cell.Row.Get_CellInfo(CurCell);

                var X_content_start = Page.X + CellMetrics.X_content_start;
                var X_content_end   = Page.X + CellMetrics.X_content_end;
                var Y_content_start = Cell.Temp.Y;
                var Y_content_end   = HeaderPage.RowsInfo[CurRow].TableRowsBottom;

                // TODO: При расчете YLimit для ячейки сделать учет толщины нижних
                //       границ ячейки и таблицы
                if (null != CellSpacing)
                {
                    if (this.Content.length - 1 === CurRow)
                        Y_content_end -= CellSpacing;
                    else
                        Y_content_end -= CellSpacing / 2;
                }

                var VMergeCount = this.Internal_GetVertMergeCount(CurRow, CurGridCol, GridSpan);
                var BottomMargin = this.MaxBotMargin[CurRow + VMergeCount - 1];
                Y_content_end -= BottomMargin;

                Cell.PagesCount = 1;
                Cell.Content.Set_StartPage(CurPage);
                Cell.Content.Reset(0, 0, Y_content_end - Y_content_start, 10000);
                Cell.Temp.X_start = X_content_start;
                Cell.Temp.Y_start = Y_content_start;
                Cell.Temp.X_end   = X_content_end;
                Cell.Temp.Y_end   = Y_content_end;

                Cell.Temp.X_cell_start = Page.X + CellMetrics.X_cell_start;
                Cell.Temp.X_cell_end   = Page.X + CellMetrics.X_cell_end;
                Cell.Temp.Y_cell_start = Y_content_start - CellMar.Top.W;
                Cell.Temp.Y_cell_end   = Y_content_end + BottomMargin;


                // Какие-то ячейки в строке могут быть не разбиты на строки, а какие то разбиты.
                // Здесь контролируем этот момент, чтобы у тех, которые не разбиты не вызывать
                // Recalculate_Page от несуществующих страниц.
                var CellPageIndex = CurPage - Cell.Content.Get_StartPage_Relative();
                if (0 === CellPageIndex)
                {
                    Cell.Content.Recalculate_Page(CellPageIndex, true);
                }
            }

            if ( null != CellSpacing )
                HeaderPage.RowsInfo[CurRow].H = CellHeight;
            else
                HeaderPage.RowsInfo[CurRow].H = CellHeight + TempMaxTopBorder;

            Y           += CellHeight;
            TableHeight += CellHeight;

            Row.Height   = CellHeight;

            Y           += MaxBotBorder[CurRow];
            TableHeight += MaxBotBorder[CurRow];

            // Сделаем вертикальное выравнивание ячеек в таблице. Делаем как Word, если ячейка разбилась на несколько
            // страниц, тогда вертикальное выравнивание применяем только к первой странице.
        }

        if ( false === bHeaderNextPage )
        {
            // Сделаем вертикальное выравнивание ячеек в таблице. Делаем как Word, если ячейка разбилась на несколько
            // страниц, тогда вертикальное выравнивание применяем только к первой странице.
            // Делаем это не в общем цикле, потому что объединенные вертикально ячейки могут вносить поправки в значения
            // this.TableRowsBottom, в последней строке.
            for ( var CurRow = 0; CurRow < this.HeaderInfo.Count; CurRow++ )
            {
                var Row = HeaderPage.Rows[CurRow];
                var CellsCount = Row.Get_CellsCount();
                for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
                {
                    var Cell = Row.Get_Cell( CurCell );
                    var VMergeCount = this.Internal_GetVertMergeCount( CurRow, Cell.Metrics.StartGridCol, Cell.Get_GridSpan() );

                    if ( VMergeCount > 1 )
                        continue;
                    else
                    {
                        var Vmerge = Cell.GetVMerge();
                        // Возьмем верхнюю ячейку теккущего объединения
                        if ( vmerge_Restart != Vmerge )
                        {
                            Cell = this.Internal_Get_StartMergedCell( CurRow, Cell.Metrics.StartGridCol, Cell.Get_GridSpan() );
                            var cIndex = Cell.Index;
                            var rIndex = Cell.Row.Index;

                            Cell = HeaderPage.Rows[rIndex].Get_Cell( cIndex );
                        }
                    }

                    var CellMar       = Cell.GetMargins();
                    var VAlign        = Cell.Get_VAlign();
                    var CellPageIndex = CurPage - Cell.Content.Get_StartPage_Relative();

                    if ( CellPageIndex >= Cell.PagesCount )
                        continue;

                    // Для прилегания к верху или для второй страницы ничего не делаем (так изначально рассчитывалось)
                    if ( vertalignjc_Top === VAlign || CellPageIndex > 1 )
                    {
                        Cell.Temp.Y_VAlign_offset[CellPageIndex] = 0;
                        continue;
                    }

                    // Рассчитаем имеющуюся в распоряжении высоту ячейки
                    var TempCurRow = Cell.Row.Index;
                    var TempCellSpacing = HeaderPage.Rows[TempCurRow].Get_CellSpacing();
                    var Y_0 = HeaderPage.RowsInfo[TempCurRow].Y;

                    if ( null === TempCellSpacing )
                        Y_0 += MaxTopBorder[TempCurRow];

                    Y_0 += CellMar.Top.W;

                    var Y_1 = HeaderPage.RowsInfo[CurRow].TableRowsBottom - CellMar.Bottom.W;
                    var CellHeight = Y_1 - Y_0;

                    var CellContentBounds = Cell.Content.Get_PageBounds( CellPageIndex, CellHeight, true );
                    var ContentHeight = CellContentBounds.Bottom - CellContentBounds.Top;

                    var Dy = 0;

                    if (true === Cell.Is_VerticalText())
                    {
                        var CellMetrics = Cell.Row.Get_CellInfo(Cell.Index);
                        CellHeight = CellMetrics.X_cell_end - CellMetrics.X_cell_start - CellMar.Left.W - CellMar.Right.W;
                    }

                    if ( CellHeight - ContentHeight > 0.001 )
                    {
                        if ( vertalignjc_Bottom === VAlign )
                            Dy = CellHeight - ContentHeight;
                        else if ( vertalignjc_Center === VAlign )
                            Dy = (CellHeight - ContentHeight) / 2;

                        Cell.Content.Shift( CellPageIndex, 0, Dy );
                    }

                    Cell.Temp.Y_VAlign_offset[CellPageIndex] = Dy;
                }
            }
        }

		this.LogicDocument.RecalcTableHeader = false;
    }
    else
    {
        this.HeaderInfo.Pages[CurPage] = {};
        this.HeaderInfo.Pages[CurPage].Draw = false;
    }
    this.HeaderInfo.HeaderRecalculate = false;

    var bNextPage = false;

    // Блок переменных для учета сносок
	var nFootnotesHeight     = 0;
	var arrSavedY            = [];
	var arrSavedTableHeight  = [];
	var arrFootnotesObject   = [];
	var nResetFootnotesIndex = -1;

    for (var CurRow = FirstRow; CurRow < this.Content.length; ++CurRow)
    {
		if (oFootnotes && (-1 === nResetFootnotesIndex || CurRow > nResetFootnotesIndex))
		{
			nFootnotesHeight            = oFootnotes.GetHeight(nPageAbs, nColumnAbs);
			arrFootnotesObject[CurRow]  = oFootnotes.SaveRecalculateObject(nPageAbs, nColumnAbs);
			arrSavedY[CurRow]           = Y;
			arrSavedTableHeight[CurRow] = TableHeight;

			this.Pages[CurPage].FootnotesH = nFootnotesHeight;
		}

		if ((0 === CurRow && true === this.Check_EmptyPages(CurPage - 1)) || CurRow != FirstRow || (CurRow === FirstRow && true === ResetStartElement))
        {
            this.RowsInfo[CurRow] = new CTableRowsInfo();
            this.RowsInfo[CurRow].StartPage = CurPage;
            this.TableRowsBottom[CurRow]    = [];
        }
        else
        {
            this.RowsInfo[CurRow].Pages = CurPage - this.RowsInfo[CurRow].StartPage + 1;
        }

        this.TableRowsBottom[CurRow][CurPage] = Y;

        var Row         = this.Content[CurRow];
        var CellsCount  = Row.Get_CellsCount();
        var CellSpacing = Row.Get_CellSpacing();

        var BeforeInfo  = Row.Get_Before();
        var AfterInfo   = Row.Get_After();
        var CurGridCol  = BeforeInfo.GridBefore;

        // Добавляем ширину верхней границы у текущей строки
        Y           += MaxTopBorder[CurRow];
        TableHeight += MaxTopBorder[CurRow];

        // Если таблица с расстоянием между ячейками, тогда добавляем его
        if (FirstRow === CurRow)
        {
            if (null != CellSpacing)
            {
                var TableBorder_Top = this.Get_Borders().Top;
                if (border_Single === TableBorder_Top.Value)
                {
                    Y           += TableBorder_Top.Size;
                    TableHeight += TableBorder_Top.Size;
                }

                if (true === this.HeaderInfo.Pages[CurPage].Draw || (0 === CurRow && (0 === CurPage || (1 === CurPage && false === this.RowsInfo[0].FirstPage))))
                {
                    Y           += CellSpacing;
                    TableHeight += CellSpacing;
                }
                else
                {
                    Y           += CellSpacing / 2;
                    TableHeight += CellSpacing / 2;
                }
            }
        }
        else
        {
            var PrevCellSpacing = this.Content[CurRow - 1].Get_CellSpacing();

            if (null != CellSpacing && null != PrevCellSpacing)
            {
                Y           += (PrevCellSpacing + CellSpacing) / 2;
                TableHeight += (PrevCellSpacing + CellSpacing) / 2;
            }
            else if (null != CellSpacing)
            {
                Y           += CellSpacing / 2;
                TableHeight += CellSpacing / 2;
            }
            else if (null != PrevCellSpacing)
            {
                Y           += PrevCellSpacing / 2;
                TableHeight += PrevCellSpacing / 2;
            }
        }

        var Row_x_max = Row.Metrics.X_max;
        var Row_x_min = Row.Metrics.X_min;

        if (-1 === X_min || Row_x_min < X_min)
            X_min = Row_x_min;

        if (-1 === X_max || Row_x_max > X_max)
            X_max = Row_x_max;

		var MaxTopMargin = 0;

		for (var CurCell = 0; CurCell < CellsCount; CurCell++)
		{
			var Cell    = Row.Get_Cell(CurCell);
			var Vmerge  = Cell.GetVMerge();
			var CellMar = Cell.GetMargins();
			if (vmerge_Restart === Vmerge && CellMar.Top.W > MaxTopMargin)
				MaxTopMargin = CellMar.Top.W;
		}

		var RowH = Row.Get_Height();
		var RowHValue = RowH.Value;
		// В данном значении не учитываются маргины
		RowHValue = RowH.Value + this.MaxBotMargin[CurRow] + MaxTopMargin;

		// В таблице с отступами размер отступа входит в значение высоты строки
		if (null !== CellSpacing)
			RowHValue -= CellSpacing;

		if (oFootnotes && (Asc.linerule_AtLeast === RowH.HRule || Asc.linerule_Exact == RowH.HRule))
		{
			oFootnotes.PushCellLimit(Y + RowHValue);
		}

        // Дополнительный параметр для случая, если данная строка начнется с новой страницы.
        // Мы запоминаем максимальное значение нижней границы(первой страницы (текущей)) у ячеек,
        // объединенных вертикально так, чтобы это объединение заканчивалось на данной строке.
        // И если данная строка начнется сразу с новой страницы (Pages > 0, FirstPage = false), тогда
        // мы должны данный параметр сравнить со значением нижней границы предыдущей строки.
        var MaxBotValue_vmerge = -1;

        var Merged_Cell  = [];
        var VerticallCells = [];
        var bAllCellsVertical = true;
        var bFootnoteBreak = false;
        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            var Cell     = Row.Get_Cell( CurCell );
            var GridSpan = Cell.Get_GridSpan();
            var Vmerge   = Cell.GetVMerge();
            var CellMar  = Cell.GetMargins();

            Row.Update_CellInfo(CurCell);

            var CellMetrics   = Row.Get_CellInfo( CurCell );

            var X_content_start = Page.X + CellMetrics.X_content_start;
            var X_content_end   = Page.X + CellMetrics.X_content_end;

            var Y_content_start = Y + CellMar.Top.W;
            var Y_content_end   = this.Pages[CurPage].YLimit - nFootnotesHeight;

            // TODO: При расчете YLimit для ячейки сделать учет толщины нижних
            //       границ ячейки и таблицы
            if ( null != CellSpacing )
            {
                if ( this.Content.length - 1 === CurRow )
                    Y_content_end -= CellSpacing;
                else
                    Y_content_end -= CellSpacing / 2;
            }

            var VMergeCount = this.Internal_GetVertMergeCount( CurRow, CurGridCol, GridSpan );
            var BottomMargin = this.MaxBotMargin[CurRow + VMergeCount - 1];
            Y_content_end -= BottomMargin;

            // Такие ячейки мы обсчитываем, если либо сейчас происходит переход на новую страницу, либо
            // это последняя ячейка в объединении.
            // Обсчет такик ячеек произошел ранее

            Cell.Temp.Y = Y_content_start;

            // Сохраняем ссылку на исходную ячейку
			var oOriginCell = Cell;
            if ( VMergeCount > 1 )
            {
                CurGridCol += GridSpan;
                Merged_Cell.push( Cell );
                continue;
            }
            else
            {
                // Возьмем верхнюю ячейку текущего объединения
                if ( vmerge_Restart != Vmerge )
                {
                    Cell = this.Internal_Get_StartMergedCell( CurRow, CurGridCol, GridSpan );
                    CellMar = Cell.GetMargins();

                    var oTempRow         = Cell.GetRow();
					var oTempCellMetrics = oTempRow.GetCellInfo(Cell.GetIndex());

					X_content_start = Page.X + oTempCellMetrics.X_content_start;
					X_content_end   = Page.X + oTempCellMetrics.X_content_end;

                    Y_content_start = Cell.Temp.Y + CellMar.Top.W;
                }
            }

            if (true === Cell.Is_VerticalText())
            {
                VerticallCells.push(Cell);
                CurGridCol += GridSpan;
                continue;
            }

            bAllCellsVertical = false;

            var bCanShift = false;
            var ShiftDy   = 0;
            var ShiftDx   = 0;

            if ((0 === Cell.Row.Index && true === this.Check_EmptyPages(CurPage - 1)) || Cell.Row.Index > FirstRow || (Cell.Row.Index === FirstRow && true === ResetStartElement))
            {
                Cell.Content.Set_StartPage( CurPage );

                if (  true === this.Is_Inline() && 1 === Cell.PagesCount && 1 === Cell.Content.Pages.length && true != this.RecalcInfo.Check_Cell( Cell ) )
                {
                    var X_content_start_old  = Cell.Content.Pages[0].X;
                    var X_content_end_old    = Cell.Content.Pages[0].XLimit;
                    var Y_content_height_old = Cell.Content.Pages[0].Bounds.Bottom - Cell.Content.Pages[0].Bounds.Top;

					// Проверим по X, Y
                    if ( Math.abs( X_content_start - X_content_start_old ) < 0.001 && Math.abs( X_content_end_old - X_content_end ) < 0.001 && Y_content_start + Y_content_height_old < Y_content_end )
                    {
                        bCanShift = true;
                        ShiftDy   = -Cell.Content.Pages[0].Y + Y_content_start;

						// Если в ячейке есть ссылки на сноски, тогда такую ячейку нужно пересчитывать
						var arrFootnotes = Cell.Content.GetFootnotesList(null, null);
						if (arrFootnotes && arrFootnotes.length > 0)
							bCanShift = false;
                    }
                }

                Cell.PagesCount = 1;
                Cell.Content.Reset(X_content_start, Y_content_start, X_content_end, Y_content_end);
            }

            // Какие-то ячейки в строке могут быть не разбиты на строки, а какие то разбиты.
            // Здесь контролируем этот момент, чтобы у тех, которые не разбиты не вызывать
            // Recalculate_Page от несуществующих страниц.
            var CellPageIndex = CurPage - Cell.Content.Get_StartPage_Relative();
            Cell.Content.Set_ClipInfo(CellPageIndex, Page.X + CellMetrics.X_cell_start, Page.X + CellMetrics.X_cell_end);
            if ( CellPageIndex < Cell.PagesCount )
            {
                if ( true === bCanShift )
                {
                    Cell.Content.Shift( 0, ShiftDx, ShiftDy );
                    Cell.Content.UpdateEndInfo();
                }
                else
                {
					var RecalcResult = Cell.Content.Recalculate_Page(CellPageIndex, true);
					if (recalcresult2_CurPage & RecalcResult)
					{
						var _RecalcResult = recalcresult_CurPage;

						if (RecalcResult & recalcresultflags_Column)
							_RecalcResult |= recalcresultflags_Column;

						if (RecalcResult & recalcresultflags_Footnotes)
							_RecalcResult |= recalcresultflags_Footnotes;

						this.TurnOffRecalc = false;
						return _RecalcResult;
					}
					else if (recalcresult2_NextPage & RecalcResult)
					{
						Cell.PagesCount = Cell.Content.Pages.length + 1;
						bNextPage       = true;
					}
					else if (recalcresult2_End & RecalcResult)
					{
						// Ничего не делаем
					}
                }

                var CellContentBounds = Cell.Content.Get_PageBounds( CellPageIndex, undefined, true );
                var CellContentBounds_Bottom = CellContentBounds.Bottom + BottomMargin;

                if ( undefined === this.TableRowsBottom[CurRow][CurPage] || this.TableRowsBottom[CurRow][CurPage] < CellContentBounds_Bottom )
                    this.TableRowsBottom[CurRow][CurPage] = CellContentBounds_Bottom;

                if ( vmerge_Continue === Vmerge )
                {
                    if ( -1 === MaxBotValue_vmerge || MaxBotValue_vmerge < CellContentBounds_Bottom )
                        MaxBotValue_vmerge = CellContentBounds_Bottom;
                }
            }

			var nCurFootnotesHeight = oFootnotes ? oFootnotes.GetHeight(nPageAbs, nColumnAbs) : 0;
			if (oFootnotes && nCurFootnotesHeight > nFootnotesHeight + 0.001)
			{
				this.Pages[CurPage].FootnotesH = nCurFootnotesHeight;

				nFootnotesHeight     = nCurFootnotesHeight;
				nResetFootnotesIndex = CurRow;
				Y                    = arrSavedY[oOriginCell.Row.Index];
				TableHeight          = arrSavedTableHeight[oOriginCell.Row.Index];
				oFootnotes.LoadRecalculateObject(nPageAbs, nColumnAbs, arrFootnotesObject[oOriginCell.Row.Index]);

				CurRow = oOriginCell.Row.Index - 1;

				bFootnoteBreak = true;
				break;
			}

            CurGridCol += GridSpan;
        }

		if (oFootnotes && (Asc.linerule_AtLeast === RowH.HRule || Asc.linerule_Exact == RowH.HRule))
		{
			oFootnotes.PopCellLimit();
		}

		if (bFootnoteBreak)
			continue;

        if (undefined === this.TableRowsBottom[CurRow][CurPage])
            this.TableRowsBottom[CurRow][CurPage] = Y;

        // Если в строке все ячейки с вертикальным выравниванием
        if (true === bAllCellsVertical && Asc.linerule_Auto === RowH.HRule)
            this.TableRowsBottom[CurRow][CurPage] = Y + 4.5 + this.MaxBotMargin[CurRow] + MaxTopMargin;

        if ((Asc.linerule_AtLeast === RowH.HRule || Asc.linerule_Exact == RowH.HRule) && Y + RowHValue > Y_content_end && ((0 === CurRow && 0 === CurPage && null !== this.Get_DocumentPrev() && !this.Parent.IsFirstElementOnPage(this.private_GetRelativePageIndex(CurPage), this.GetIndex())) || CurRow != FirstRow))
        {
            bNextPage = true;

            for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
            {
                var Cell   = Row.Get_Cell( CurCell );
                var Vmerge = Cell.GetVMerge();

                var VMergeCount = this.Internal_GetVertMergeCount( CurRow, Cell.Metrics.StartGridCol, Cell.Get_GridSpan() );

                // Проверяем только начальные ячейки вертикального объединения..
                if ( vmerge_Continue === Vmerge || VMergeCount > 1 )
                    continue;

                Cell.Content.StartFromNewPage();
                Cell.PagesCount = 2;
            }
        }

        // Данная строка разбилась на несколько страниц. Нам нужно сделать несколько дополнительных действий:
        // 1. Проверяем есть ли хоть какой-либо контент данной строки на первой странице, т.е. реально данная
        //    строка начинается со 2-ой страницы.
        // 2. Пересчитать все смерженные вертикально ячейки, которые также разбиваются на несколько страниц,
        //    но у которых вертикальное объединение не заканчивается на данной странице.
        if ( true === bNextPage )
        {
            var bContentOnFirstPage   = false;
            var bNoContentOnFirstPage = false;
            for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
            {
                var Cell   = Row.Get_Cell( CurCell );
                var Vmerge = Cell.GetVMerge();

                var VMergeCount = this.Internal_GetVertMergeCount( CurRow, Cell.Metrics.StartGridCol, Cell.Get_GridSpan() );

                // Проверяем только начальные ячейки вертикального объединения..
                if ( vmerge_Continue === Vmerge || VMergeCount > 1 )
                    continue;

                if (true === Cell.Is_VerticalText() || true === Cell.Content_Is_ContentOnFirstPage())
                {
                    bContentOnFirstPage = true;
                }
                else
                {
                    bNoContentOnFirstPage = true;
                }
            }

            if ( true === bContentOnFirstPage && true === bNoContentOnFirstPage )
            {
                for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
                {
                    var Cell   = Row.Get_Cell( CurCell );
                    var Vmerge = Cell.GetVMerge();

                    var VMergeCount = this.Internal_GetVertMergeCount( CurRow, Cell.Metrics.StartGridCol, Cell.Get_GridSpan() );

                    // Проверяем только начальные ячейки вертикального объединения..
                    if ( vmerge_Continue === Vmerge || VMergeCount > 1 )
                        continue;

                    Cell.Content.StartFromNewPage();
                    Cell.PagesCount = 2;
                }

                bContentOnFirstPage = false;
            }

            this.RowsInfo[CurRow].FirstPage = bContentOnFirstPage;

            // Не сраниваем MaxBotValue_vmerge с -1, т.к. значения в this.TableRowsBottom в любом случае неотрицательные
            if ( 0 != CurRow && false === this.RowsInfo[CurRow].FirstPage )
            {
                if ( this.TableRowsBottom[CurRow - 1][CurPage] < MaxBotValue_vmerge )
                {
                    // Поскольку мы правим настройку не текущей строки, надо подправить и
                    // запись о рассчитанной высоте строки
                    var Diff = MaxBotValue_vmerge - this.TableRowsBottom[CurRow - 1][CurPage];
                    this.TableRowsBottom[CurRow - 1][CurPage] = MaxBotValue_vmerge;
                    this.RowsInfo[CurRow - 1].H[CurPage] += Diff;
                }
            }

            // Здесь мы должны рассчитать ячейки, которые попали в вертикальное объединение и из-за этого не были рассчитаны
            var CellsCount2 = Merged_Cell.length;
            var bFootnoteBreak = false;
            for (var TempCellIndex = 0; TempCellIndex < CellsCount2; TempCellIndex++)
            {
                var Cell = Merged_Cell[TempCellIndex];
                var CurCell = Cell.Index;
                var GridSpan = Cell.Get_GridSpan();
                var CurGridCol = Cell.Metrics.StartGridCol;

                // Возьмем верхнюю ячейку теккущего объединения
                Cell = this.Internal_Get_StartMergedCell(CurRow, CurGridCol, GridSpan);

                if (true === Cell.Is_VerticalText())
                {
                    VerticallCells.push(Cell);
                    CurGridCol += GridSpan;
                    continue;
                }

                var CellMar = Cell.GetMargins();
                var CellMetrics = Row.Get_CellInfo(CurCell);

                var X_content_start = Page.X + CellMetrics.X_content_start;
                var X_content_end   = Page.X + CellMetrics.X_content_end;

                // Если в текущей строке на данной странице не убралось ничего из других ячеек, тогда
                // рассчитываем вертикально объединенные ячейки до начала данной строки.
                var Y_content_start = Cell.Temp.Y;
                var Y_content_end   = false === bContentOnFirstPage ? Y : this.Pages[CurPage].YLimit - nFootnotesHeight;

                // TODO: При расчете YLimit для ячейки сделать учет толщины нижних
                //       границ ячейки и таблицы
                if (null != CellSpacing)
                {
                    if (this.Content.length - 1 === CurRow)
                        Y_content_end -= CellSpacing;
                    else
                        Y_content_end -= CellSpacing / 2;
                }

                var VMergeCount = this.Internal_GetVertMergeCount(CurRow, CurGridCol, GridSpan);
                var BottomMargin = this.MaxBotMargin[CurRow + VMergeCount - 1];
                Y_content_end -= BottomMargin;

                if ((0 === Cell.Row.Index && 0 === CurPage) || Cell.Row.Index > FirstRow)
                {
                    Cell.PagesCount = 1;
                    Cell.Content.Set_StartPage(CurPage);
                    Cell.Content.Reset(X_content_start, Y_content_start, X_content_end, Y_content_end);
                }

                // Какие-то ячейки в строке могут быть не разбиты на строки, а какие то разбиты.
                // Здесь контролируем этот момент, чтобы у тех, которые не разбиты не вызывать
                // Recalculate_Page от несуществующих страниц.
                var CellPageIndex = CurPage - Cell.Content.Get_StartPage_Relative();
                if (CellPageIndex < Cell.PagesCount)
                {
                    if (recalcresult2_NextPage === Cell.Content.Recalculate_Page(CellPageIndex, true))
                    {
                        Cell.PagesCount = Cell.Content.Pages.length + 1;
                        bNextPage = true;
                    }

                    var CellContentBounds = Cell.Content.Get_PageBounds(CellPageIndex, undefined, true);
                    var CellContentBounds_Bottom = CellContentBounds.Bottom + BottomMargin;

                    if (0 != CurRow && false === this.RowsInfo[CurRow].FirstPage)
                    {
                        if (this.TableRowsBottom[CurRow - 1][CurPage] < CellContentBounds_Bottom)
                        {
                            // Поскольку мы правим настройку не текущей строки, надо подправить и
                            // запись о рассчитанной высоте строки
                            var Diff = CellContentBounds_Bottom - this.TableRowsBottom[CurRow - 1][CurPage];
                            this.TableRowsBottom[CurRow - 1][CurPage] = CellContentBounds_Bottom;
                            this.RowsInfo[CurRow - 1].H[CurPage] += Diff;
                        }
                    }
                    else
                    {
                        if (undefined === this.TableRowsBottom[CurRow][CurPage] || this.TableRowsBottom[CurRow][CurPage] < CellContentBounds_Bottom)
                            this.TableRowsBottom[CurRow][CurPage] = CellContentBounds_Bottom;
                    }
                }

				// Проверяем наличие сносок, т.к. они могли появится в смерженных ячейках
				var nCurFootnotesHeight = oFootnotes ? oFootnotes.GetHeight(nPageAbs, nColumnAbs) : 0;
				if (oFootnotes && nCurFootnotesHeight > nFootnotesHeight + 0.001 && Cell.Row.Index >= FirstRow)
				{
					this.Pages[CurPage].FootnotesH = nCurFootnotesHeight;

					nFootnotesHeight     = nCurFootnotesHeight;
					nResetFootnotesIndex = CurRow;
					Y                    = arrSavedY[Cell.Row.Index];
					TableHeight          = arrSavedTableHeight[Cell.Row.Index];
					oFootnotes.LoadRecalculateObject(nPageAbs, nColumnAbs, arrFootnotesObject[Cell.Row.Index]);

					CurRow = Cell.Row.Index - 1;

					bFootnoteBreak = true;
					break;
				}

                CurGridCol += GridSpan;
            }

            if (bFootnoteBreak)
				continue;


            // Еще раз обновляем параметр, есть ли текст на первой странице
            bContentOnFirstPage = false;
            for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
            {
                var Cell   = Row.Get_Cell( CurCell );
                var Vmerge = Cell.GetVMerge();

                // Проверяем только начальные ячейки вертикального объединения..
                if ( vmerge_Continue === Vmerge )
                    continue;

                if (true === Cell.Is_VerticalText())
                    continue;

                if ( true === Cell.Content_Is_ContentOnFirstPage() )
                {
                    bContentOnFirstPage = true;
                    break;
                }
            }

            this.RowsInfo[CurRow].FirstPage = bContentOnFirstPage;
        }

        // Выставляем так, чтобы высота была равна 0
        if (true !== this.RowsInfo[CurRow].FirstPage && CurPage === this.RowsInfo[CurRow].StartPage)
            this.TableRowsBottom[CurRow][CurPage] = Y;

        // Здесь мы выставляем только начальную координату строки (для каждой страницы)
        // высоту строки(для каждой страницы) мы должны обсчитать после общего цикла, т.к.
        // в одной из следйющих строк может оказаться ячейка с вертикальным объединением,
        // захватывающим данную строку. Значит, ее содержимое может изменить высоту нашей строки.
        var TempY            = Y;
        var TempMaxTopBorder = MaxTopBorder[CurRow];

        if ( null != CellSpacing )
        {
            this.RowsInfo[CurRow].Y[CurPage]            = TempY;
            this.RowsInfo[CurRow].TopDy[CurPage]        = 0;
            this.RowsInfo[CurRow].X0                    = Row_x_min;
            this.RowsInfo[CurRow].X1                    = Row_x_max;
            this.RowsInfo[CurRow].MaxTopBorder[CurPage] = TempMaxTopBorder;
            this.RowsInfo[CurRow].MaxBotBorder          = MaxBotBorder[CurRow];
        }
        else
        {
            this.RowsInfo[CurRow].Y[CurPage]            = TempY - TempMaxTopBorder;
            this.RowsInfo[CurRow].TopDy[CurPage]        = TempMaxTopBorder;
            this.RowsInfo[CurRow].X0                    = Row_x_min;
            this.RowsInfo[CurRow].X1                    = Row_x_max;
            this.RowsInfo[CurRow].MaxTopBorder[CurPage] = TempMaxTopBorder;
            this.RowsInfo[CurRow].MaxBotBorder          = MaxBotBorder[CurRow];
        }

        var CellHeight = this.TableRowsBottom[CurRow][CurPage] - Y;

		// TODO: улучшить проверку на высоту строки (для строк разбитых на страницы)
		// Условие Y + RowHValue < Y_content_end добавлено из-за сносок.
		if (false === bNextPage && (Asc.linerule_AtLeast === RowH.HRule || Asc.linerule_Exact === RowH.HRule) && CellHeight < RowHValue && (nFootnotesHeight < 0.001 || Y + RowHValue < Y_content_end))
		{
			CellHeight                            = RowHValue;
			this.TableRowsBottom[CurRow][CurPage] = Y + CellHeight;
		}

        // Рассчитываем ячейки с вертикальным текстом
        var CellsCount2 = VerticallCells.length;
        for (var TempCellIndex = 0; TempCellIndex < CellsCount2; TempCellIndex++)
        {
            var Cell       = VerticallCells[TempCellIndex];
            var CurCell    = Cell.Index;
            var GridSpan   = Cell.Get_GridSpan();
            var CurGridCol = Cell.Metrics.StartGridCol;

            // Возьмем верхнюю ячейку текущего объединения
            Cell = this.Internal_Get_StartMergedCell(CurRow, CurGridCol, GridSpan);

            var CellMar     = Cell.GetMargins();
            var CellMetrics = Cell.Row.Get_CellInfo(Cell.Index);

            var X_content_start = Page.X + CellMetrics.X_content_start;
            var X_content_end   = Page.X + CellMetrics.X_content_end;
            var Y_content_start = Cell.Temp.Y;
            var Y_content_end   = this.TableRowsBottom[CurRow][CurPage];

            // TODO: При расчете YLimit для ячейки сделать учет толщины нижних
            //       границ ячейки и таблицы
            if (null != CellSpacing)
            {
                if (this.Content.length - 1 === CurRow)
                    Y_content_end -= CellSpacing;
                else
                    Y_content_end -= CellSpacing / 2;
            }

            var VMergeCount = this.Internal_GetVertMergeCount(CurRow, CurGridCol, GridSpan);
            var BottomMargin = this.MaxBotMargin[CurRow + VMergeCount - 1];
            Y_content_end -= BottomMargin;

            if ((0 === Cell.Row.Index && true === this.Check_EmptyPages(CurPage - 1)) || Cell.Row.Index > FirstRow || (Cell.Row.Index === FirstRow && true === ResetStartElement))
            {
                // TODO: Здесь надо сделать, чтобы ячейка не билась на страницы
                Cell.PagesCount = 1;
                Cell.Content.Set_StartPage(CurPage);
                Cell.Content.Reset(0, 0, Y_content_end - Y_content_start, 10000);
                Cell.Temp.X_start = X_content_start;
                Cell.Temp.Y_start = Y_content_start;
                Cell.Temp.X_end   = X_content_end;
                Cell.Temp.Y_end   = Y_content_end;

                Cell.Temp.X_cell_start = Page.X + CellMetrics.X_cell_start;
                Cell.Temp.X_cell_end   = Page.X + CellMetrics.X_cell_end;
                Cell.Temp.Y_cell_start = Y_content_start - CellMar.Top.W;
                Cell.Temp.Y_cell_end   = Y_content_end + BottomMargin;
            }

            // Какие-то ячейки в строке могут быть не разбиты на строки, а какие то разбиты.
            // Здесь контролируем этот момент, чтобы у тех, которые не разбиты не вызывать
            // Recalculate_Page от несуществующих страниц.
            var CellPageIndex = CurPage - Cell.Content.Get_StartPage_Relative();
            if (0 === CellPageIndex)
            {
                Cell.Content.Recalculate_Page(CellPageIndex, true);
            }
        }

		// Еще раз проверим, были ли сноски
		var nCurFootnotesHeight = oFootnotes ? oFootnotes.GetHeight(nPageAbs, nColumnAbs) : 0;
		if (oFootnotes && nCurFootnotesHeight > nFootnotesHeight + 0.001)
		{
			this.Pages[CurPage].FootnotesH = nCurFootnotesHeight;

			nFootnotesHeight     = nCurFootnotesHeight;
			nResetFootnotesIndex = CurRow;
			Y                    = arrSavedY[CurRow];
			TableHeight          = arrSavedTableHeight[CurRow];
			oFootnotes.LoadRecalculateObject(nPageAbs, nColumnAbs, arrFootnotesObject[CurRow]);

			CurRow--;
			continue;
		}

        if ( null != CellSpacing )
            this.RowsInfo[CurRow].H[CurPage] = CellHeight;
        else
            this.RowsInfo[CurRow].H[CurPage] = CellHeight + TempMaxTopBorder;

        Y           += CellHeight;
        TableHeight += CellHeight;

        Row.Height   = CellHeight;

        Y           += MaxBotBorder[CurRow];
        TableHeight += MaxBotBorder[CurRow];

        if ( this.Content.length - 1 === CurRow )
        {
            if ( null != CellSpacing )
            {
                TableHeight += CellSpacing;

                var TableBorder_Bottom = this.Get_Borders().Bottom;
                if ( border_Single === TableBorder_Bottom.Value )
                    TableHeight += TableBorder_Bottom.Size;
            }
        }

        if ( true === bNextPage )
        {
            LastRow = CurRow;
            this.Pages[CurPage].LastRow = CurRow;

            if  ( -1 === this.HeaderInfo.PageIndex && this.HeaderInfo.Count > 0 && CurRow >= this.HeaderInfo.Count )
                this.HeaderInfo.PageIndex = CurPage;

            break;
        }
        else if ( this.Content.length - 1 === CurRow )
        {
            LastRow = this.Content.length - 1;
            this.Pages[CurPage].LastRow = this.Content.length - 1;
        }
    }

    // Сделаем вертикальное выравнивание ячеек в таблице. Делаем как Word, если ячейка разбилась на несколько
    // страниц, тогда вертикальное выравнивание применяем только к первой странице.
    // Делаем это не в общем цикле, потому что объединенные вертикально ячейки могут вносить поправки в значения
    // this.TableRowsBottom, в последней строке.
    for ( var CurRow = FirstRow; CurRow <= LastRow; CurRow++ )
    {
        var Row = this.Content[CurRow];
        var CellsCount = Row.Get_CellsCount();
        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            var Cell = Row.Get_Cell( CurCell );
            var VMergeCount = this.Internal_GetVertMergeCount( CurRow, Cell.Metrics.StartGridCol, Cell.Get_GridSpan() );

            if ( VMergeCount > 1 && CurRow != LastRow )
                continue;
            else
            {
                var Vmerge = Cell.GetVMerge();
                // Возьмем верхнюю ячейку текущего объединения
                if ( vmerge_Restart != Vmerge )
                {
                    Cell = this.Internal_Get_StartMergedCell( CurRow, Cell.Metrics.StartGridCol, Cell.Get_GridSpan() );
                }
            }

            var CellMar       = Cell.GetMargins();
            var VAlign        = Cell.Get_VAlign();
            var CellPageIndex = CurPage - Cell.Content.Get_StartPage_Relative();

            if ( CellPageIndex >= Cell.PagesCount )
                continue;

            // Рассчитаем имеющуюся в распоряжении высоту ячейки
            var TempCurRow = Cell.Row.Index;

            // Для прилегания к верху или для второй страницы ничего не делаем (так изначально рассчитывалось)
            if ( vertalignjc_Top === VAlign || CellPageIndex > 1 || (1 === CellPageIndex && true === this.RowsInfo[TempCurRow].FirstPage ) )
            {
                Cell.Temp.Y_VAlign_offset[CellPageIndex] = 0;
                continue;
            }

            var TempCellSpacing = this.Content[TempCurRow].Get_CellSpacing();
            var Y_0 = this.RowsInfo[TempCurRow].Y[CurPage];

            if ( null === TempCellSpacing )
                Y_0 += MaxTopBorder[TempCurRow];

            Y_0 += CellMar.Top.W;

            var Y_1 = this.TableRowsBottom[CurRow][CurPage] - CellMar.Bottom.W;
            var CellHeight = Y_1 - Y_0;

            var CellContentBounds = Cell.Content.Get_PageBounds( CellPageIndex, CellHeight, true );
            var ContentHeight = CellContentBounds.Bottom - CellContentBounds.Top;

            var Dy = 0;

            if (true === Cell.Is_VerticalText())
            {
                var CellMetrics = Row.Get_CellInfo(CurCell);
                CellHeight = CellMetrics.X_cell_end - CellMetrics.X_cell_start - CellMar.Left.W - CellMar.Right.W;
            }

            if (CellHeight - ContentHeight > 0.001)
            {
                if (vertalignjc_Bottom === VAlign)
                    Dy = CellHeight - ContentHeight;
                else if (vertalignjc_Center === VAlign)
                    Dy = (CellHeight - ContentHeight) / 2;

                Cell.Content.Shift(CellPageIndex, 0, Dy);
            }

            Cell.Temp.Y_VAlign_offset[CellPageIndex] = Dy;
        }
    }


    // Просчитаем нижнюю границу таблицы на данной странице
    var CurRow = LastRow;
    if ( 0 === CurRow && false === this.RowsInfo[CurRow].FirstPage && 0 === CurPage )
    {
        // Таблица сразу переносится на следующую страницу
        this.Pages[0].MaxBotBorder = 0;
        this.Pages[0].BotBorders   = [];
    }
    else
    {
        // Если последняя строка на данной странице не имеет контента, тогда рассчитываем
        // границу у предыдущей строки.
        if ( false === this.RowsInfo[CurRow].FirstPage && CurPage === this.RowsInfo[CurRow].StartPage )
            CurRow--;

        var MaxBotBorder = 0;
        var BotBorders   = [];

        if (CurRow >= this.Pages[CurPage].FirstRow)
        {
            // Для ряда CurRow вычисляем нижнюю границу
            if (this.Content.length - 1 === CurRow)
            {
                // Для последнего ряда уже есть готовые нижние границы
                var Row        = this.Content[CurRow];
                var CellsCount = Row.Get_CellsCount();
                for (var CurCell = 0; CurCell < CellsCount; CurCell++)
                {
                    var Cell = Row.Get_Cell(CurCell);
                    if (vmerge_Continue === Cell.GetVMerge())
                        Cell = this.Internal_Get_StartMergedCell(CurRow, Row.Get_CellInfo(CurCell).StartGridCol, Cell.Get_GridSpan());

                    var Border_Info = Cell.Get_BorderInfo().Bottom;

                    for (var BorderId = 0; BorderId < Border_Info.length; BorderId++)
                    {
                        var Border = Border_Info[BorderId];
                        if (border_Single === Border.Value && MaxBotBorder < Border.Size)
                            MaxBotBorder = Border.Size;

                        BotBorders.push(Border);
                    }
                }
            }
            else
            {
                var Row         = this.Content[CurRow];
                var CellSpacing = Row.Get_CellSpacing();
                var CellsCount  = Row.Get_CellsCount();

                if (null != CellSpacing)
                {
                    // BotBorders можно не заполнять, т.к. у каждой ячейки своя граница,
                    // нам надо только посчитать максимальную толщину.
                    for (var CurCell = 0; CurCell < CellsCount; CurCell++)
                    {
                        var Cell   = Row.Get_Cell(CurCell);
                        var Border = Cell.Get_Borders().Bottom;

                        if (border_Single === Border.Value && MaxBotBorder < Border.Size)
                            MaxBotBorder = Border.Size;
                    }
                }
                else
                {
                    // Сравниваем нижнюю границу ячейки и нижнюю границу таблицы
                    for (var CurCell = 0; CurCell < CellsCount; CurCell++)
                    {
                        var Cell = Row.Get_Cell(CurCell);

                        if (vmerge_Continue === Cell.GetVMerge())
                        {
                            Cell = this.Internal_Get_StartMergedCell(CurRow, Row.Get_CellInfo(CurCell).StartGridCol, Cell.Get_GridSpan());
                            if (null === Cell)
                            {
                                BotBorders.push(TableBorders.Bottom);
                                continue;
                            }
                        }

                        var Border = Cell.Get_Borders().Bottom;

                        // Сравним границы
                        var Result_Border = this.Internal_CompareBorders(Border, TableBorders.Bottom, false, true);
                        if (border_Single === Result_Border.Value && MaxBotBorder < Result_Border.Size)
                            MaxBotBorder = Result_Border.Size;

                        BotBorders.push(Result_Border);
                    }
                }
            }
        }

        this.Pages[CurPage].MaxBotBorder = MaxBotBorder;
        this.Pages[CurPage].BotBorders   = BotBorders;
    }

    this.Pages[CurPage].Bounds.Bottom = this.Pages[CurPage].Bounds.Top + TableHeight;
    this.Pages[CurPage].Bounds.Left   = X_min + this.Pages[CurPage].X;
    this.Pages[CurPage].Bounds.Right  = X_max + this.Pages[CurPage].X;
    this.Pages[CurPage].Height        = TableHeight;

    if (true === bNextPage)
    {
        var LastRow = this.Pages[CurPage].LastRow;
        if (false === this.RowsInfo[LastRow].FirstPage)
            this.Pages[CurPage].LastRow = LastRow - 1;
        else
            this.Pages[CurPage].LastRowSplit = true;
    }

    this.TurnOffRecalc = false;

    this.Bounds = this.Pages[this.Pages.length - 1].Bounds;

    if ( true == bNextPage )
        return recalcresult_NextPage;
    else
        return recalcresult_NextElement;
};
CTable.prototype.private_RecalculatePositionY = function(CurPage)
{
    var PageLimits = this.Parent.Get_PageLimits(this.PageNum + CurPage);
    var PageFields = this.Parent.Get_PageFields(this.PageNum + CurPage);
    var LD_PageFields = this.LogicDocument.Get_PageFields(this.Get_StartPage_Absolute() + CurPage);
    var LD_PageLimits = this.LogicDocument.Get_PageLimits(this.Get_StartPage_Absolute() + CurPage);

    if ( true === this.Is_Inline() && 0 === CurPage )
    {
        this.AnchorPosition.CalcY = this.Y;
        this.AnchorPosition.Set_Y(this.Pages[CurPage].Height, this.Y, LD_PageFields.Y, LD_PageFields.YLimit, LD_PageLimits.YLimit, PageLimits.Y, PageLimits.YLimit, PageLimits.Y, PageLimits.YLimit);
    }
    else if ( true != this.Is_Inline() && ( 0 === CurPage || ( 1 === CurPage && false === this.RowsInfo[0].FirstPage ) ) )
    {
        this.AnchorPosition.Set_Y(this.Pages[CurPage].Height, this.Pages[CurPage].Y, PageFields.Y, PageFields.YLimit, LD_PageLimits.YLimit, PageLimits.Y, PageLimits.YLimit, PageLimits.Y, PageLimits.YLimit);

        var OtherFlowTables = !this.bPresentation ? editor.WordControl.m_oLogicDocument.DrawingObjects.getAllFloatTablesOnPage( this.Get_StartPage_Absolute() ) : [];
        this.AnchorPosition.Calculate_Y(this.PositionV.RelativeFrom, this.PositionV.Align, this.PositionV.Value);
        this.AnchorPosition.Correct_Values( PageLimits.X, PageLimits.Y, PageLimits.XLimit, PageLimits.YLimit, this.AllowOverlap, OtherFlowTables, this );

        if ( undefined != this.PositionV_Old )
        {
            // Восстанови старые значения, чтобы в историю изменений все нормально записалось
            this.PositionV.RelativeFrom = this.PositionV_Old.RelativeFrom;
            this.PositionV.Align        = this.PositionV_Old.Align;
            this.PositionV.Value        = this.PositionV_Old.Value;

            // Рассчитаем сдвиг с учетом старой привязки
            var Value = this.AnchorPosition.Calculate_Y_Value(this.PositionV_Old.RelativeFrom);
            this.Set_PositionV( this.PositionV_Old.RelativeFrom, false, Value );
            // На всякий случай пересчитаем заново координату
            this.AnchorPosition.Calculate_Y(this.PositionV.RelativeFrom, this.PositionV.Align, this.PositionV.Value);

            this.PositionV_Old = undefined;
        }

        var NewX = this.AnchorPosition.CalcX;
        var NewY = this.AnchorPosition.CalcY;

        this.Shift( CurPage, NewX - this.Pages[CurPage].X, NewY - this.Pages[CurPage].Y );
    }
};
CTable.prototype.private_RecalculateSkipPage = function(CurPage)
{
    this.HeaderInfo.Pages[CurPage] = {};
    this.HeaderInfo.Pages[CurPage].Draw = false;

    for ( var Index = -1; Index < this.Content.length; Index++ )
    {
        if (!this.TableRowsBottom[Index])
            this.TableRowsBottom[Index] = [];

        this.TableRowsBottom[Index][CurPage] = 0;
    }

    this.Pages[CurPage].MaxBotBorder = 0;
    this.Pages[CurPage].BotBorders   = [];

    if (0 === CurPage)
    {
        this.Pages[CurPage].FirstRow = 0;
        this.Pages[CurPage].LastRow  = -1;
    }
    else
    {
        var FirstRow;
        if (true === this.IsEmptyPage(CurPage - 1))
            FirstRow = this.Pages[CurPage - 1].FirstRow;
        else
            FirstRow = this.Pages[CurPage - 1].LastRow;

        this.Pages[CurPage].FirstRow = FirstRow;
        this.Pages[CurPage].LastRow  = FirstRow -1;
    }
};
CTable.prototype.private_RecalculatePercentWidth = function()
{
    return this.XLimit - this.X - this.GetTableOffsetCorrection() + this.GetRightTableOffsetCorrection();
};
CTable.prototype.private_RecalculateGridCols = function()
{
	for (var nCurRow = 0, nRowsCount = this.Content.length; nCurRow < nRowsCount; ++nCurRow)
	{
		var oRow        = this.Content[nCurRow];
		var oBeforeInfo = oRow.Get_Before();
		var nCurGridCol = oBeforeInfo.GridBefore;

		for (var nCurCell = 0, nCellsCount = oRow.GetCellsCount(); nCurCell < nCellsCount; ++nCurCell)
		{
			var oCell = oRow.GetCell(nCurCell);
			oRow.Set_CellInfo(nCurCell, nCurGridCol, 0, 0, 0, 0, 0, 0);
			oCell.Set_Metrics(nCurGridCol, 0, 0, 0, 0, 0, 0);
			nCurGridCol += oCell.Get_GridSpan();
		}
	}
};
//----------------------------------------------------------------------------------------------------------------------
// Класс CTablePage
//----------------------------------------------------------------------------------------------------------------------
function CTablePage(X, Y, XLimit, YLimit, FirstRow, MaxTopBorder)
{
    this.X_origin     = X;
    this.X            = X;
    this.Y            = Y;
    this.XLimit       = XLimit;
    this.YLimit       = YLimit;
    this.Bounds       = new CDocumentBounds(X, Y, XLimit, Y);
    this.MaxTopBorder = MaxTopBorder;
    this.FirstRow     = FirstRow;
    this.LastRow      = FirstRow;
    this.Height       = 0;
    this.LastRowSplit = false;
	this.FootnotesH   = 0;
}
CTablePage.prototype.Shift = function(Dx, Dy)
{
    this.X += Dx;
    this.Y += Dy;
    this.XLimit += Dx;
    this.YLimit += Dy;
    this.Bounds.Shift(Dx, Dy);
};
//----------------------------------------------------------------------------------------------------------------------
// Класс CTableRecalcInfo
//----------------------------------------------------------------------------------------------------------------------
function CTableRecalcInfo()
{
    this.TableGrid     = true;
    this.TableBorders  = true;

    this.CellsToRecalc = {};
    this.CellsAll      = true;
}
CTableRecalcInfo.prototype.Recalc_Borders = function()
{
    this.TableBorders = true;
};
CTableRecalcInfo.prototype.Add_Cell = function(Cell)
{
    this.CellsToRecalc[Cell.Get_Id()] = Cell;
};
CTableRecalcInfo.prototype.Check_Cell = function(Cell)
{
    if ( true === this.CellsAll || undefined != this.CellsToRecalc[Cell.Get_Id()] )
        return true;

    return false;
};
CTableRecalcInfo.prototype.Recalc_AllCells = function()
{
    this.CellsAll = true;
};
CTableRecalcInfo.prototype.Reset = function(bCellsAll)
{
    this.TableGrid     = true;
    this.TableBorders  = true;
    this.CellsAll      = bCellsAll;
    this.CellsToRecalc = {};
};
//----------------------------------------------------------------------------------------------------------------------
// Класс CTableRecalculateObject
//----------------------------------------------------------------------------------------------------------------------
function CTableRecalculateObject()
{
    this.TableSumGrid    = [];
    this.TableGridCalc   = [];

    this.TableRowsBottom = [];
    this.HeaderInfo      = {};
    this.RowsInfo        = [];

    this.X_origin = 0;
    this.X        = 0;
    this.Y        = 0;
    this.XLimit   = 0;
    this.YLimit   = 0;

    this.Pages    = [];

    this.MaxTopBorder = [];
    this.MaxBotBorder = [];
    this.MaxBotMargin = [];

    this.Content = [];
}
CTableRecalculateObject.prototype.Save = function(Table)
{
    this.TableSumGrid    = Table.TableSumGrid;
    this.TableGridCalc   = Table.TableGridCalc;

    this.TableRowsBottom = Table.TableRowsBottom;
    this.HeaderInfo      = Table.HeaderInfo;
    this.RowsInfo        = Table.RowsInfo;

    this.X_origin        = Table.X_origin;
    this.X               = Table.X;
    this.Y               = Table.Y;
    this.XLimit          = Table.XLimit;
    this.YLimit          = Table.YLimit;

    this.Pages           = Table.Pages;

    this.MaxTopBorder    = Table.MaxTopBorder;
    this.MaxBotBorder    = Table.MaxBotBorder;
    this.MaxBotMargin    = Table.MaxBotBorder;

    var Count = Table.Content.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        this.Content[Index] = Table.Content[Index].SaveRecalculateObject();
    }
};
CTableRecalculateObject.prototype.Load = function(Table)
{
    Table.TableSumGrid    = this.TableSumGrid;
    Table.TableGridCalc   = this.TableGridCalc;

    Table.TableRowsBottom = this.TableRowsBottom;
    Table.HeaderInfo      = this.HeaderInfo;
    Table.RowsInfo        = this.RowsInfo;

    Table.X_origin        = this.X_origin;
    Table.X               = this.X;
    Table.Y               = this.Y;
    Table.XLimit          = this.XLimit;
    Table.YLimit          = this.YLimit;

    Table.Pages           = this.Pages;

    Table.MaxTopBorder    = this.MaxTopBorder;
    Table.MaxBotBorder    = this.MaxBotBorder;
    Table.MaxBotMargin    = this.MaxBotBorder;

    var Count = this.Content.length;
    for ( var Index = 0; Index < Count; Index++ )
    {
        Table.Content[Index].LoadRecalculateObject( this.Content[Index] );
    }
};
CTableRecalculateObject.prototype.Get_DrawingFlowPos = function(FlowPos)
{
    var Count = this.Content.length;
    for (var Index = 0; Index < Count; Index++)
    {
        this.Content[Index].Get_DrawingFlowPos(FlowPos);
    }
};
