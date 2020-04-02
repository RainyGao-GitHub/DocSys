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
var c_oAscLineDrawingRule = AscCommon.c_oAscLineDrawingRule;
var global_MatrixTransformer = AscCommon.global_MatrixTransformer;

CTable.prototype.ReDraw = function()
{
    this.Parent.OnContentReDraw( this.Get_StartPage_Absolute(), this.Get_StartPage_Absolute() + this.Pages.length - 1 );
};
CTable.prototype.Draw = function(CurPage, pGraphics, isDrawContent)
{
    if (CurPage < 0 || CurPage >= this.Pages.length)
        return 0;

    if (true === this.IsEmptyPage(CurPage))
        return;

    var Page = this.Pages[CurPage];

    // Определим какие строки попадают на данную страницу
    var Row_start = this.Pages[CurPage].FirstRow;
    var Row_last  = this.Pages[CurPage].LastRow;

    if (Row_last < Row_start)
        return -1;

    // Возможно, на данной странице строку, с которой началось разбиение на странице,
    // не надо рисовать. (Если начальная и конечная строки совпадают, тогда это 2
    // или более страница данной строки)
    if ((Row_start != Row_last || (0 === Row_start && 0 === Row_last && 0 === CurPage)) && false === this.RowsInfo[Row_last].FirstPage)
        Row_last--;

    if (Row_last < Row_start)
        return -1;

    // Данный случай добавлен из-за сносок. Когда у таблицы на данной страницы ничего не убирается.
	// TODO: Надо улучшить данную проверку, т.к. она не учитывает ситуацию с вложенными таблицами.
    if (Row_start === Row_last && Math.abs(this.RowsInfo[Row_last].H[CurPage] - this.RowsInfo[Row_last].TopDy[CurPage]) < 0.001)
        return -1;

    pGraphics.SaveGrState();

    var bIsSmartGrForcing = false;
    if (pGraphics.StartCheckTableDraw)
        bIsSmartGrForcing = pGraphics.StartCheckTableDraw();

    //-------------------------------------------------------------------------------------
    // 1. Сначала заливаем таблицу и если есть Spacing, тогда обводим внешнюю рамку таблицы
    //-------------------------------------------------------------------------------------
    this.private_DrawTableBackgroundAndOuterBorder(pGraphics, CurPage, Row_start, Row_last);
    //-------------------------------------------------------------------------------------
    // 2. Рисуем заливку всех ячеек таблицы
    //-------------------------------------------------------------------------------------
    this.private_DrawCellsBackground(pGraphics, CurPage, Row_start, Row_last);
    //-------------------------------------------------------------------------------------
    // 3. Рисуем содержимое ячеек
    //-------------------------------------------------------------------------------------
    if (false !== isDrawContent)
        this.private_DrawCellsContent(pGraphics, CurPage, Row_start, Row_last);
    //-------------------------------------------------------------------------------------
    // 4. Рисуем границы всех ячеек таблицы
    //-------------------------------------------------------------------------------------
    this.private_DrawCellsBorders(pGraphics, CurPage, Row_start, Row_last);

    if (pGraphics.EndCheckTableDraw)
        pGraphics.EndCheckTableDraw(bIsSmartGrForcing);

    pGraphics.RestoreGrState();

    if (CurPage < this.Pages.length - 1)
        return -1;

    return 0;
};
CTable.prototype.private_DrawTableBackgroundAndOuterBorder = function(pGraphics, PNum, Row_start, Row_last)
{
    var CurPage = PNum;
    var TableShd = this.Get_Shd();

    var X_left_old  = null;
    var X_right_old = null;

    var Page = this.Pages[CurPage];

    var Y_top    = this.Pages[PNum].Bounds.Top;
    var Y_bottom = this.Pages[PNum].Bounds.Top;

    var LockType = this.Lock.Get_Type();
    if ( AscCommon.locktype_None != LockType )
    {
        pGraphics.DrawLockObjectRect(this.Lock.Get_Type(), this.Pages[PNum].Bounds.Left, this.Pages[PNum].Bounds.Top, this.Pages[PNum].Bounds.Right - this.Pages[PNum].Bounds.Left, this.Pages[PNum].Bounds.Bottom - this.Pages[PNum].Bounds.Top );
    }

	// Если данный параграф был изменен в режиме рецензирования, тогда рисуем специальный знак
	if (true === this.HavePrChange())
	{
		if (CurPage > 0 || false === this.IsStartFromNewPage() || null === this.Get_DocumentPrev())
		{
			var _X_min    = -3 + this.Pages[CurPage].Bounds.Left;
			var _Y_top    = this.Pages[CurPage].Bounds.Top;
			var _Y_bottom = this.Pages[CurPage].Bounds.Bottom;

			var ReviewColor = this.GetPrReviewColor();
			pGraphics.p_color(ReviewColor.r, ReviewColor.g, ReviewColor.b, 255);
			pGraphics.drawVerLine(0, _X_min, _Y_top, _Y_bottom, 0);
		}
	}

    var TableBorders = this.Get_Borders();

    // Заголовок
    var bHeader = false;
    if(this.bPresentation)
    {
        var Row         = this.Content[0];
        var CellSpacing = Row.Get_CellSpacing();
        var CellsCount  = Row.Get_CellsCount();
        var X_left_new  = Page.X + Row.Get_CellInfo(0).X_grid_start;
        var X_right_new = Page.X + Row.Get_CellInfo(CellsCount - 1).X_grid_end;
        pGraphics.SaveGrState();
        pGraphics.SetIntegerGrid(false);
        var ShapeDrawer = new AscCommon.CShapeDrawer();
        TableShd.Unifill && TableShd.Unifill.check(this.Get_Theme(), this.Get_ColorMap());
        var Transform = this.Parent.transform.CreateDublicate();
        global_MatrixTransformer.TranslateAppend(Transform, Math.min(X_left_new, X_right_new), Math.min(Y_top, Y_bottom));
        pGraphics.transform3(Transform, false);
        ShapeDrawer.fromShape2(new AscFormat.ObjectToDraw(TableShd.Unifill, null, Math.abs(X_right_new - X_left_new), Math.abs(this.Pages[0].Bounds.Bottom - Y_top), null, Transform), pGraphics, null);
        ShapeDrawer.draw(null);
        pGraphics.RestoreGrState();
    }

	var arrFrames = Asc.c_oAscShdNil !== TableShd.Value ? this.private_GetTableCellsBackgroundFrames(CurPage, Row_start, Row_last) : [];
	if ( this.HeaderInfo.Count > 0 && PNum > this.HeaderInfo.PageIndex && true === this.HeaderInfo.Pages[PNum].Draw )
    {
        bHeader = true;

        var HeaderPage = this.HeaderInfo.Pages[PNum];
        for ( var CurRow = 0; CurRow < this.HeaderInfo.Count; CurRow++ )
        {
            var Row         = HeaderPage.Rows[CurRow];
            var CellSpacing = Row.Get_CellSpacing();
            var CellsCount  = Row.Get_CellsCount();
            var X_left_new  = Page.X + Row.Get_CellInfo(0).X_grid_start;
            var X_right_new = Page.X + Row.Get_CellInfo(CellsCount - 1).X_grid_end;

            if (!CellSpacing)
            	continue;

            Y_bottom = HeaderPage.RowsInfo[CurRow].Y + HeaderPage.RowsInfo[CurRow].H;

            var PrevCellSpacing = ( CurRow < this.HeaderInfo.Count - 1 ? HeaderPage.Rows[CurRow + 1].Get_CellSpacing() : this.Content[Row_start].Get_CellSpacing() );
            Y_bottom += (PrevCellSpacing + CellSpacing) / 4;

            this.private_DrawRowBackground(pGraphics, TableShd, CellSpacing, Math.min(X_left_new, X_right_new), Math.min(Y_top, Y_bottom), Math.abs(X_right_new - X_left_new), Math.abs(Y_bottom - Y_top), Row, arrFrames);
            this.private_DrawRowOuterBorder(pGraphics, TableBorders, X_left_new, X_left_old, X_right_new, X_right_old, Y_top, Y_bottom, ( 0 === CurRow ? true : false), false );

            X_left_old  = X_left_new;
            X_right_old = X_right_new;

            Y_top = Y_bottom;
        }
    }

    for ( var CurRow = Row_start; CurRow <= Row_last; CurRow++ )
    {
        var Row         = this.GetRow(CurRow);
        var CellSpacing = Row.Get_CellSpacing();
        var CellsCount  = Row.Get_CellsCount();
        var X_left_new  = Page.X + Row.Get_CellInfo(0).X_grid_start;
        var X_right_new = Page.X + Row.Get_CellInfo(CellsCount - 1).X_grid_end;

        if (null === CellSpacing)
        	continue;

        Y_bottom = this.RowsInfo[CurRow].Y[PNum] + this.RowsInfo[CurRow].H[PNum];
        if ( this.Content.length - 1 === CurRow )
        {
            Y_bottom += Row.Get_CellSpacing();
        }
        else
        {
            var CellSpacing = Row.Get_CellSpacing();
            var PrevCellSpacing = this.Content[CurRow + 1].Get_CellSpacing();
            Y_bottom += (PrevCellSpacing + CellSpacing) / 4;
        }

        Y_bottom += this.RowsInfo[CurRow].MaxBotBorder;

        if ( null != CellSpacing && PNum != this.Pages.length - 1 && CurRow === Row_last )
            Y_bottom += this.Pages[PNum].MaxBotBorder;

        this.private_DrawRowBackground(pGraphics, TableShd, CellSpacing, Math.min(X_left_new, X_right_new), Math.min(Y_top, Y_bottom), Math.abs(X_right_new - X_left_new), Math.abs(Y_bottom - Y_top), Row, arrFrames);
        this.private_DrawRowOuterBorder(pGraphics, TableBorders, X_left_new, X_left_old, X_right_new, X_right_old, Y_top, Y_bottom, ( true != bHeader && Row_start === CurRow ? true : false), (Row_last === CurRow ? true : false) );

        X_left_old  = X_left_new;
        X_right_old = X_right_new;

        Y_top = Y_bottom;
    }
};
CTable.prototype.private_DrawRowBackground = function(oGraphics, oTableShd, nCellsSpacing, nX, nY, nW, nH, oRow, arrFrames)
{
	if (!nCellsSpacing || this.bPresentation || Asc.c_oAscShdNil === oTableShd.Value)
		return;

	var RGBA = oTableShd.Get_Color2(this.Get_Theme(), this.Get_ColorMap());

	if (oGraphics.SetShd)
		oGraphics.SetShd(oTableShd);

	oGraphics.b_color1(RGBA.r, RGBA.g, RGBA.b, 255);


	var nCurGridCol = oRow.GetBefore().Grid;
	var nEndGrid    = this.TableGrid.length - oRow.GetAfter().Grid;

	var nCurrentX = nX;

	while (nCurGridCol < nEndGrid)
	{
		var isFind = false;
		for (var nIndex = 0, nCount = arrFrames.length; nIndex < nCount; ++nIndex)
		{
			var oFrame = arrFrames[nIndex];

			if (oFrame.GridCol <= nCurGridCol && nCurGridCol < oFrame.GridCol + oFrame.GridSpan && oFrame.Y < nY + nH && oFrame.Y + oFrame.H > nY)
			{
				oGraphics.TableRect(nCurrentX, nY, oFrame.X - nCurrentX, nH);
				nCurrentX = oFrame.X + oFrame.W;
				nCurGridCol = oFrame.GridCol + oFrame.GridSpan;

				if (oFrame.Y > nY + 0.001)
					oGraphics.TableRect(oFrame.X, nY, oFrame.W, oFrame.Y - nY);

				if (oFrame.Y + oFrame.H + 0.001 < nY + nH)
					oGraphics.TableRect(oFrame.X, oFrame.Y + oFrame.H, oFrame.W, nY + nH - oFrame.Y - oFrame.H);

				isFind = true;
				break;
			}
		}

		if (!isFind)
			nCurGridCol++;
	}

	if (nCurrentX < nX + nW)
		oGraphics.TableRect(nCurrentX, nY, nX + nW - nCurrentX, nH);
};
CTable.prototype.private_DrawRowOuterBorder = function(pGraphics, TableBorders, X_left_new, X_left_old, X_right_new, X_right_old, Y_top, Y_bottom, bStartRow, bLastRow)
{
	var Theme    = this.Get_Theme();
	var ColorMap = this.Get_ColorMap();
	var RGBA;

	// Левая граница
	if (border_Single === TableBorders.Left.Value)
	{
		RGBA = TableBorders.Left.Get_Color2(Theme, ColorMap);
		pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);
		if (pGraphics.SetBorder)
		{
			pGraphics.SetBorder(TableBorders.Left);
		}
		if (null === X_left_old || Math.abs(X_left_new - X_left_old) < 0.001)
		{
			pGraphics.drawVerLine(c_oAscLineDrawingRule.Center, X_left_new, Y_top, Y_bottom, TableBorders.Left.Size);
		}
		else
		{
			if (X_left_new > X_left_old)
			{
				pGraphics.drawHorLineExt(c_oAscLineDrawingRule.Top, Y_top, X_left_old, X_left_new, TableBorders.Left.Size, -TableBorders.Left.Size / 2, 0);
			}
			else
			{
				pGraphics.drawHorLineExt(c_oAscLineDrawingRule.Bottom, Y_top, X_left_old, X_left_new, TableBorders.Left.Size, +TableBorders.Left.Size / 2, -TableBorders.Left.Size / 2);
			}

			pGraphics.drawVerLine(c_oAscLineDrawingRule.Center, X_left_new, Y_top, Y_bottom, TableBorders.Left.Size);
		}
	}
	else //if ( border_None === TableBorders.Left.Value )
	{
		if (null === X_left_old || Math.abs(X_left_new - X_left_old) < 0.001)
		{
			pGraphics.DrawEmptyTableLine(X_left_new, Y_top, X_left_new, Y_bottom);
		}
		else
		{
			pGraphics.DrawEmptyTableLine(X_left_old, Y_top, X_left_new, Y_top);
			pGraphics.DrawEmptyTableLine(X_left_new, Y_top, X_left_new, Y_bottom);
		}
	}

	// Правая граница
	if (border_Single === TableBorders.Right.Value)
	{
		RGBA = TableBorders.Right.Get_Color2(Theme, ColorMap);
		pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);
		if (pGraphics.SetBorder)
		{
			pGraphics.SetBorder(TableBorders.Right);
		}
		if (null === X_right_old || Math.abs(X_right_new - X_right_old) < 0.001)
		{
			pGraphics.drawVerLine(c_oAscLineDrawingRule.Center, X_right_new, Y_top, Y_bottom, TableBorders.Right.Size);
		}
		else
		{
			if (X_right_new > X_right_old)
			{
				pGraphics.drawHorLineExt(c_oAscLineDrawingRule.Bottom, Y_top, X_right_old, X_right_new, TableBorders.Right.Size, -TableBorders.Right.Size / 2, +TableBorders.Right.Size / 2);
			}
			else
			{
				pGraphics.drawHorLineExt(c_oAscLineDrawingRule.Top, Y_top, X_right_old, X_right_new, TableBorders.Right.Size, +TableBorders.Right.Size / 2, 0);
			}

			pGraphics.drawVerLine(c_oAscLineDrawingRule.Center, X_right_new, Y_top, Y_bottom, TableBorders.Right.Size);
		}
	}
	else //if ( border_None === TableBorders.Right.Value )
	{
		if (null === X_right_old || Math.abs(X_right_new - X_right_old) < 0.001)
		{
			pGraphics.DrawEmptyTableLine(X_right_new, Y_top, X_right_new, Y_bottom);
		}
		else
		{
			pGraphics.DrawEmptyTableLine(X_right_old, Y_top, X_right_new, Y_top);
			pGraphics.DrawEmptyTableLine(X_right_new, Y_top, X_right_new, Y_bottom);
		}
	}

	if (true === bStartRow)
	{
		// Верхняя граница
		if (border_Single === TableBorders.Top.Value)
		{
			RGBA = TableBorders.Top.Get_Color2(Theme, ColorMap);
			pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);
			if (pGraphics.SetBorder)
			{
				pGraphics.SetBorder(TableBorders.Top);
			}
			// Добавочные значения толщины правой и левой границ
			var LeftMW = 0;
			if (border_Single === TableBorders.Left.Value)
				LeftMW = -TableBorders.Left.Size / 2;

			var RightMW = 0;
			if (border_Single === TableBorders.Right.Value)
				RightMW = +TableBorders.Right.Size / 2;

			pGraphics.drawHorLineExt(c_oAscLineDrawingRule.Top, Y_top, X_left_new, X_right_new, TableBorders.Top.Size, LeftMW, RightMW);
		}
		else //if ( border_None === TableBorders.Top.Value )
		{
			pGraphics.DrawEmptyTableLine(X_left_new, Y_top, X_right_new, Y_top);
		}
	}

	if (true === bLastRow)
	{
		// Нижняя граница
		if (border_Single === TableBorders.Bottom.Value)
		{
			RGBA = TableBorders.Bottom.Get_Color2(Theme, ColorMap);
			pGraphics.p_color(RGBA.r, RGBA.g, RGBA.b, 255);
			if (pGraphics.SetBorder)
			{
				pGraphics.SetBorder(TableBorders.Bottom);
			}
			// Добавочные значения толщины правой и левой границ
			var LeftMW = 0;
			if (border_Single === TableBorders.Left.Value)
				LeftMW = -TableBorders.Left.Size / 2;

			var RightMW = 0;
			if (border_Single === TableBorders.Right.Value)
				RightMW = +TableBorders.Right.Size / 2;

			pGraphics.drawHorLineExt(c_oAscLineDrawingRule.Top, Y_bottom, X_left_new, X_right_new, TableBorders.Bottom.Size, LeftMW, RightMW);
		}
		else //if ( border_None === TableBorders.Bottom.Value )
		{
			pGraphics.DrawEmptyTableLine(X_left_new, Y_bottom, X_right_new, Y_bottom);
		}
	}
};
CTable.prototype.private_DrawCellsBackground = function(pGraphics, PNum, Row_start, Row_last)
{
    var CurPage = PNum;
    var Page = this.Pages[CurPage];

    // Рисуем заливку всех ячеек на странице
    var Theme = this.Get_Theme();
    var ColorMap = this.Get_ColorMap();
    if(this.bPresentation)
    {
        pGraphics.SaveGrState();
        pGraphics.SetIntegerGrid(false);
    }
    if ( this.HeaderInfo.Count > 0 && PNum > this.HeaderInfo.PageIndex && true === this.HeaderInfo.Pages[PNum].Draw )
    {
        var HeaderPage = this.HeaderInfo.Pages[PNum];
        // Рисуем заливку всех ячеек на странице
        for ( var CurRow = 0; CurRow < this.HeaderInfo.Count; CurRow++ )
        {
            var Row        = HeaderPage.Rows[CurRow];
            var CellsCount = Row.Get_CellsCount();
            var Y          = HeaderPage.RowsInfo[CurRow].Y;

            // Рисуем ячейки начиная с последней, потому что левая ячейка
            // должна рисоваться поверх правой при конфликте границ.
            for ( var CurCell = CellsCount - 1; CurCell >= 0; CurCell-- )
            {
                var Cell       = Row.Get_Cell( CurCell );
                var GridSpan   = Cell.Get_GridSpan();
                var VMerge     = Cell.GetVMerge();
                var CurGridCol = Row.Get_CellInfo( CurCell ).StartGridCol;

                if ( vmerge_Continue === VMerge )
                    continue;

                var CellInfo     = Row.Get_CellInfo( CurCell );
                var X_cell_start = Page.X + CellInfo.X_cell_start;
                var X_cell_end   = Page.X + CellInfo.X_cell_end;

                var VMergeCount  = this.Internal_GetVertMergeCount( CurRow, CurGridCol, GridSpan );
                var RealHeight   = HeaderPage.RowsInfo[CurRow + VMergeCount - 1].Y + HeaderPage.RowsInfo[CurRow + VMergeCount - 1].H - Y;

                // Заливаем ячейку
                var CellShd = Cell.Get_Shd();
                if(!this.bPresentation)
                {
                    var RGBA = CellShd.Get_Color2(Theme, ColorMap);
                    if (true !== RGBA.Auto)
                    {
                        pGraphics.b_color1(RGBA.r, RGBA.g, RGBA.b, 255);
                        if(pGraphics.SetShd)
                        {
                            pGraphics.SetShd(CellShd);

                        }
                        pGraphics.TableRect(Math.min(X_cell_start, X_cell_end), Math.min(Y, Y + RealHeight), Math.abs(X_cell_end - X_cell_start), Math.abs(RealHeight));
                    }
                }
                else
                {
                    if(CellShd.Unifill && CellShd.Unifill.fill)
                    {
                        //if(CellShd.Unifill.fill.type === FILL_TYPE_SOLID)
                        //{
                        //    var Alpha, RGBA = CellShd.Get_Color3(Theme, ColorMap);
                        //    if(AscFormat.isRealNumber(CellShd.Unifill.transparent))
                        //    {
                        //        Alpha = CellShd.Unifill.transparent;
                        //    }
                        //    else
                        //    {
                        //        Alpha = 255;
                        //    }
                        //    pGraphics.b_color1( RGBA.R, RGBA.G, RGBA.B, Alpha );
                        //    pGraphics.TableRect(Math.min(X_cell_start, X_cell_end), Math.min(Y, Y + RealHeight), Math.abs(X_cell_end - X_cell_start), Math.abs(RealHeight));
                        //}
                        //else TODO: Сделать нормальную отрисовку.
                        {
                            var ShapeDrawer = new AscCommon.CShapeDrawer();
                            CellShd.Unifill.check(Theme, ColorMap);
                            var Transform = this.Parent.transform.CreateDublicate();
                            global_MatrixTransformer.TranslateAppend(Transform, Math.min(X_cell_start, X_cell_end), Math.min(Y, Y + RealHeight));

                            pGraphics.transform3(Transform, false);
                            ShapeDrawer.fromShape2(new AscFormat.ObjectToDraw(CellShd.Unifill, null, Math.abs(X_cell_end - X_cell_start), Math.abs(RealHeight), null, Transform), pGraphics, null);
                            ShapeDrawer.draw(null);
                        }
                    }
                }
            }
        }
    }


    // Рисуем заливку всех ячеек на странице
    for ( var CurRow = Row_start; CurRow <= Row_last; CurRow++ )
    {
        var Row = this.Content[CurRow];
        var CellsCount = Row.Get_CellsCount();
        var Y = this.RowsInfo[CurRow].Y[PNum];

        var nReviewType = Row.GetReviewType();

        // Рисуем ячейки начиная с последней, потому что левая ячейка
        // должна рисоваться поверх правой при конфликте границ.
        for ( var CurCell = CellsCount - 1; CurCell >= 0; CurCell-- )
        {
            var Cell = Row.Get_Cell( CurCell );
            var GridSpan = Cell.Get_GridSpan();
            var VMerge = Cell.GetVMerge();
            var CurGridCol = Row.Get_CellInfo( CurCell ).StartGridCol;

            if ( vmerge_Continue === VMerge )
            {
                if ( Row_start === CurRow  )
                {
                    Cell = this.Internal_Get_StartMergedCell( CurRow, CurGridCol, GridSpan );
                    if ( null === Cell )
                        continue;

                    // Параметры GridSpan и CurGridCol должны остаться такими же
                }
                else
                    continue;
            }

            var CellInfo     = Row.Get_CellInfo( CurCell );
            var X_cell_start = Page.X + CellInfo.X_cell_start;
            var X_cell_end   = Page.X + CellInfo.X_cell_end;

            var VMergeCount = this.private_GetVertMergeCountOnPage(PNum, CurRow, CurGridCol, GridSpan);
            if (VMergeCount <= 0)
                continue;

            var RealHeight  = this.RowsInfo[CurRow + VMergeCount - 1].Y[PNum] + this.RowsInfo[CurRow + VMergeCount - 1].H[PNum] - Y;

            // Заливаем ячейку
            var CellShd = Cell.Get_Shd();
			if (Asc.c_oAscShdNil != CellShd.Value || (!this.bPresentation && reviewtype_Common !== nReviewType))
			{
				if (!this.bPresentation)
				{
					if (reviewtype_Common !== nReviewType)
					{
						if (reviewtype_Add === nReviewType)
							pGraphics.b_color1(225, 242, 250, 255);
						else if (reviewtype_Remove === nReviewType)
							pGraphics.b_color1(252, 230, 244, 255);

						pGraphics.TableRect(Math.min(X_cell_start, X_cell_end), Math.min(Y, Y + RealHeight), Math.abs(X_cell_end - X_cell_start), Math.abs(RealHeight));
					}
					else
					{

						var RGBA = CellShd.Get_Color2(Theme, ColorMap);
						if (true !== RGBA.Auto)
						{
							pGraphics.b_color1(RGBA.r, RGBA.g, RGBA.b, 255);

							if (pGraphics.SetShd)
							{
								pGraphics.SetShd(CellShd);

							}
							pGraphics.TableRect(Math.min(X_cell_start, X_cell_end), Math.min(Y, Y + RealHeight), Math.abs(X_cell_end - X_cell_start), Math.abs(RealHeight));
						}
					}
				}
                else
                {
                    if(CellShd.Unifill && CellShd.Unifill.fill)
                    {
                        //if(CellShd.Unifill.fill.type === FILL_TYPE_SOLID)
                        //{
                        //    var Alpha, RGBA = CellShd.Get_Color3(Theme, ColorMap);
                        //    if(AscFormat.isRealNumber(CellShd.Unifill.transparent))
                        //    {
                        //        Alpha = CellShd.Unifill.transparent;
                        //    }
                        //    else
                        //    {
                        //        Alpha = 255;
                        //    }
                        //    pGraphics.b_color1( RGBA.R, RGBA.G, RGBA.B, Alpha );
                        //    pGraphics.TableRect(Math.min(X_cell_start, X_cell_end), Math.min(Y, Y + RealHeight), Math.abs(X_cell_end - X_cell_start), Math.abs(RealHeight));
                        //}
                        //else TODO: Сделать нормальную отрисовку.
                        {
                            var ShapeDrawer = new AscCommon.CShapeDrawer();
                            CellShd.Unifill.check(Theme, ColorMap);
                            var Transform = this.Parent.transform.CreateDublicate();
                            global_MatrixTransformer.TranslateAppend(Transform, Math.min(X_cell_start, X_cell_end), Math.min(Y, Y + RealHeight));
                            pGraphics.transform3(Transform, false);
                            ShapeDrawer.fromShape2(new AscFormat.ObjectToDraw(CellShd.Unifill, null, Math.abs(X_cell_end - X_cell_start), Math.abs(RealHeight), null, Transform), pGraphics, null);
                            ShapeDrawer.draw(null);
                        }
                    }
                }
            }
        }
    }

    if(this.bPresentation)
    {
        pGraphics.RestoreGrState();
    }
};
CTable.prototype.private_DrawCellsContent = function(pGraphics, PNum, Row_start, Row_last)
{
    if ( this.HeaderInfo.Count > 0 && PNum > this.HeaderInfo.PageIndex && true === this.HeaderInfo.Pages[PNum].Draw )
    {
        if(pGraphics.Start_Command)
        {
            pGraphics.Start_Command(AscFormat.DRAW_COMMAND_TABLE_ROW);
        }
        var HeaderPage = this.HeaderInfo.Pages[PNum];
        for ( var CurRow = 0; CurRow < this.HeaderInfo.Count; CurRow++ )
        {
            var Row        = HeaderPage.Rows[CurRow];
            var CellsCount = Row.Get_CellsCount();

            for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
            {
                var Cell   = Row.Get_Cell( CurCell );
                var VMerge = Cell.GetVMerge();

                if ( vmerge_Continue === VMerge )
                    continue;

                // Выводим содержимое таблицы
                Cell.Content_Draw(PNum, pGraphics);
            }
        }
        if(pGraphics.End_Command)
        {
            pGraphics.End_Command();
        }
    }

    // Рисуем содержимое всех ячеек. Его рисуем в нормальном порядке, потому что некоторые элементы
    // могут начинаться внутри одной ячейки, а заканчиваться в другой
    for ( var CurRow = Row_start; CurRow <= Row_last; CurRow++ )
    {
        var Row = this.Content[CurRow];
        var CellsCount = Row.Get_CellsCount();

        if(pGraphics.Start_Command)
        {
            pGraphics.Start_Command(AscFormat.DRAW_COMMAND_TABLE_ROW);
        }
        for ( var CurCell = 0; CurCell < CellsCount; CurCell++ )
        {
            var Cell = Row.Get_Cell( CurCell );
            var GridSpan = Cell.Get_GridSpan();
            var VMerge = Cell.GetVMerge();
            var CurGridCol = Row.Get_CellInfo( CurCell ).StartGridCol;

            if ( vmerge_Continue === VMerge )
            {
                if ( Row_start === CurRow  )
                {
                    Cell = this.Internal_Get_StartMergedCell( CurRow, CurGridCol, GridSpan );
                    if ( null === Cell )
                        continue;

                    // Параметры GridSpan и CurGridCol должны остаться такими же
                }
                else
                    continue;
            }

            var VMergeCount = this.private_GetVertMergeCountOnPage(PNum, CurRow, CurGridCol, GridSpan);
            if (VMergeCount <= 0)
                continue;

            // Выводим содержимое таблицы
            Cell.Content_Draw(PNum, pGraphics);
        }

        if(pGraphics.End_Command)
        {
            pGraphics.End_Command();
        }
    }
};
CTable.prototype.private_DrawCellsBorders = function(pGraphics, PNum, Row_start, Row_last)
{
    var CurPage = PNum;
    var Page = this.Pages[CurPage];

    var TableBorders = this.Get_Borders();
    var Theme = this.Get_Theme();
    var ColorMap = this.Get_ColorMap();
    var RGBA;
    if ( this.HeaderInfo.Count > 0 && PNum > this.HeaderInfo.PageIndex && true === this.HeaderInfo.Pages[PNum].Draw )
    {
        var Y = this.Y;
        var HeaderPage = this.HeaderInfo.Pages[PNum];
        for ( var CurRow = 0; CurRow < this.HeaderInfo.Count; CurRow++ )
        {
            var Row         = HeaderPage.Rows[CurRow];
            var CellsCount  = Row.Get_CellsCount();
            var CellSpacing = Row.Get_CellSpacing();

            Y = HeaderPage.RowsInfo[CurRow].Y;

            var LastBorderTop = { W : 0, L : 0 };

            // Рисуем ячейки начиная с последней, потому что левая ячейка
            // должна рисоваться поверх правой при конфликте границ.
            for ( var CurCell = CellsCount - 1; CurCell >= 0; CurCell-- )
            {
                var Cell = Row.Get_Cell( CurCell );
                var GridSpan = Cell.Get_GridSpan();
                var VMerge = Cell.GetVMerge();
                var CurGridCol = Row.Get_CellInfo( CurCell ).StartGridCol;

                if ( vmerge_Continue === VMerge )
                {
                    LastBorderTop = { W : 0, L : 0 };
                    continue;
                }

                var CellInfo     = Row.Get_CellInfo( CurCell );
                var X_cell_start = Page.X + CellInfo.X_cell_start;
                var X_cell_end   = Page.X + CellInfo.X_cell_end;
                var VMergeCount  = this.Internal_GetVertMergeCount( CurRow, CurGridCol, GridSpan );
                var RealHeight   = HeaderPage.RowsInfo[CurRow + VMergeCount - 1].Y + HeaderPage.RowsInfo[CurRow + VMergeCount - 1].H - Y;

                // Обводим ячейку
                var CellBorders = Cell.Get_Borders();

                if ( null != CellSpacing )
                {
                    // Левая граница
                    if ( border_Single === CellBorders.Left.Value )
                    {
                        RGBA = CellBorders.Left.Get_Color2(Theme, ColorMap);
                        pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                        if(pGraphics.SetBorder)
                        {
                            pGraphics.SetBorder(CellBorders.Left);
                        }
                        pGraphics.drawVerLine( c_oAscLineDrawingRule.Left, X_cell_start, Y, Y + RealHeight, CellBorders.Left.Size );
                    }
                    else //if ( border_None === CellBorders.Left.Value )
                    {
                        pGraphics.DrawEmptyTableLine( X_cell_start, Y, X_cell_start, Y + RealHeight );
                    }

                    // Правая граница
                    if ( border_Single === CellBorders.Right.Value )
                    {
                        RGBA = CellBorders.Right.Get_Color2(Theme, ColorMap);
                        pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                        if(pGraphics.SetBorder)
                        {
                            pGraphics.SetBorder(CellBorders.Right);
                        }
                        pGraphics.drawVerLine( c_oAscLineDrawingRule.Right, X_cell_end, Y, Y + RealHeight, CellBorders.Right.Size );
                    }
                    else //if ( border_None === CellBorders.Right.Value )
                    {
                        pGraphics.DrawEmptyTableLine( X_cell_end, Y, X_cell_end, Y + RealHeight );
                    }

                    // Верхняя граница
                    if ( border_Single === CellBorders.Top.Value )
                    {
                        RGBA = CellBorders.Top.Get_Color2(Theme, ColorMap);
                        pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                        if(pGraphics.SetBorder)
                        {
                            pGraphics.SetBorder(CellBorders.Top);
                        }
                        pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Top, Y - CellBorders.Top.Size, X_cell_start, X_cell_end, CellBorders.Top.Size, 0, 0 );
                    }
                    else //if ( border_None === CellBorders.Top.Value )
                    {
                        pGraphics.DrawEmptyTableLine( X_cell_start, Y, X_cell_end, Y );
                    }

                    // Нижняя граница
                    if ( border_Single === CellBorders.Bottom.Value )
                    {
                        RGBA = CellBorders.Bottom.Get_Color2(Theme, ColorMap);
                        pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                        if(pGraphics.SetBorder)
                        {
                            pGraphics.SetBorder(CellBorders.Bottom);
                        }
                        pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Bottom, Y + RealHeight + CellBorders.Bottom.Size, X_cell_start, X_cell_end, CellBorders.Bottom.Size, 0, 0 );
                    }
                    else //if ( border_None === CellBorders.Bottom.Value )
                    {
                        pGraphics.DrawEmptyTableLine( X_cell_start, Y + RealHeight, X_cell_end, Y + RealHeight );
                    }
                }
                else
                {
                    var CellBordersInfo = Cell.Get_BorderInfo();

                    // Левая граница
                    var BorderInfo_Left = CellBordersInfo.Left;
                    // Это значение может не совпадать с CurRow
                    var TempCurRow = Cell.Row.Index;

                    var Row_side_border_start = 0;
                    var Row_side_border_end   = BorderInfo_Left.length - 1;

                    for ( var Index = Row_side_border_start; Index <= Row_side_border_end; Index++ )
                    {
                        var CurBorderInfo = BorderInfo_Left[Index];
                        var Y0 = HeaderPage.RowsInfo[TempCurRow + Index].Y;
                        var Y1 = HeaderPage.RowsInfo[TempCurRow + Index].Y + HeaderPage.RowsInfo[TempCurRow + Index].H;

                        if ( border_Single === CurBorderInfo.Value )
                        {
                            RGBA = CurBorderInfo.Get_Color2(Theme, ColorMap);
                            pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                            if(pGraphics.SetBorder)
                            {
                                pGraphics.SetBorder(CurBorderInfo);
                            }
                            pGraphics.drawVerLine( c_oAscLineDrawingRule.Center, X_cell_start, Y0, Y1, CurBorderInfo.Size );
                        }
                        else //if ( border_None === CurBorderInfo.Value )
                        {
                            if ( 0 === CurCell )
                            {
                                pGraphics.DrawEmptyTableLine( X_cell_start, Y0, X_cell_start, Y1 );
                            }

                            // Для остальных ячеек невидимые границы мы рисуем как правые
                        }
                    }

                    // Правая граница
                    var BorderInfo_Right = CellBordersInfo.Right;
                    for ( var Index = Row_side_border_start; Index <= Row_side_border_end; Index++ )
                    {
                        var CurBorderInfo = BorderInfo_Right[Index];
                        var Y0 = HeaderPage.RowsInfo[TempCurRow + Index].Y;
                        var Y1 = HeaderPage.RowsInfo[TempCurRow + Index].Y + HeaderPage.RowsInfo[TempCurRow + Index].H;

                        // Мы должны проверить последняя ли данная ячейка в строке
                        var TempCellIndex  = this.private_GetCellIndexByStartGridCol( TempCurRow + Index, CellInfo.StartGridCol );
                        var TempCellsCount = HeaderPage.Rows[TempCurRow + Index].Get_CellsCount();

                        if ( TempCellsCount - 1 === TempCellIndex )
                        {
                            if ( border_Single === CurBorderInfo.Value )
                            {
                                RGBA = CurBorderInfo.Get_Color2(Theme, ColorMap);
                                pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                                if(pGraphics.SetBorder)
                                {
                                    pGraphics.SetBorder(CurBorderInfo);
                                }
                                pGraphics.drawVerLine( c_oAscLineDrawingRule.Center, X_cell_end, Y0, Y1, CurBorderInfo.Size );
                            }
                            else //if ( border_None === CurBorderInfo.Value )
                            {
                                pGraphics.DrawEmptyTableLine( X_cell_end, Y0, X_cell_end, Y1 );
                            }
                        }
                        else if ( border_None === CurBorderInfo.Value )
                        {
                            pGraphics.DrawEmptyTableLine( X_cell_end, Y0, X_cell_end, Y1 );
                        }
                    }

                    // Верхняя граница
                    var LastBorderTop_prev = { W : LastBorderTop.W, H : LastBorderTop.H };
                    var BorderInfo_Top = CellBordersInfo.Top;
                    for ( var Index = 0; Index < BorderInfo_Top.length; Index++ )
                    {
                        var CurBorderInfo = BorderInfo_Top[Index];

                        // Верхняя граница первой строки на новой странице должна рисоваться, либо
                        // как задано в ячейке, либо как задано в таблице.
                        if ( 0 != PNum && CurRow === Row_start )
                            CurBorderInfo = this.Internal_CompareBorders( TableBorders.Top, CurBorderInfo, true, false );

                        var X0 = Page.X + this.TableSumGrid[Index + CurGridCol - 1];
                        var X1 = Page.X + this.TableSumGrid[Index + CurGridCol];

                        var LeftMW = 0;
                        var RightMW = 0;
                        if ( BorderInfo_Top.length - 1 === Index )
                        {
                            var Max_r = 0;
                            if ( 0 != CurRow )
                            {
                                var Prev_Row = HeaderPage.Rows[CurRow - 1];
                                var Prev_CellsCount = Prev_Row.Get_CellsCount();
                                for ( var TempIndex = 0; TempIndex < Prev_CellsCount; TempIndex++ )
                                {
                                    var Prev_Cell = Prev_Row.Get_Cell( TempIndex );
                                    var Prev_GridCol = Prev_Row.Get_CellInfo( TempIndex ).StartGridCol;
                                    var Prev_GridSpan = Prev_Cell.Get_GridSpan();

                                    var bLeft = null;
                                    if ( Prev_GridCol === Index + CurGridCol + 1 )
                                    {
                                        bLeft = true;
                                    }
                                    else if ( Prev_GridCol + Prev_GridSpan === Index + CurGridCol + 1 )
                                    {
                                        bLeft = false;
                                    }
                                    else if ( Prev_GridCol > CurGridCol )
                                        break;

                                    if ( null != bLeft )
                                    {
                                        var Prev_VMerge = Prev_Cell.GetVMerge();
                                        if ( vmerge_Continue === Prev_VMerge )
                                            Prev_Cell = this.Internal_Get_StartMergedCell( CurRow - 1, Prev_GridCol, Prev_GridSpan );

                                        if ( null === Prev_Cell )
                                            break;

                                        var Num = CurRow - 1 - Prev_Cell.Row.Index;
                                        if ( Num < 0 )
                                            break;

                                        if ( true === bLeft )
                                        {
                                            var Prev_Cell_BorderInfo_Left = Prev_Cell.Get_BorderInfo().Left;
                                            if( null != Prev_Cell_BorderInfo_Left && Prev_Cell_BorderInfo_Left.length > Num && border_Single === Prev_Cell_BorderInfo_Left[Num].Value )
                                                Max_r = Prev_Cell_BorderInfo_Left[Num].Size / 2;
                                        }
                                        else
                                        {
                                            var Prev_Cell_BorderInfo_Right = Prev_Cell.Get_BorderInfo().Right;
                                            if( null != Prev_Cell_BorderInfo_Right && Prev_Cell_BorderInfo_Right.length > Num && border_Single === Prev_Cell_BorderInfo_Right[Num].Value )
                                                Max_r = Prev_Cell_BorderInfo_Right[Num].Size / 2;
                                        }

                                        break;
                                    }
                                }
                            }

                            if ( BorderInfo_Right.length > 0 && border_Single === BorderInfo_Right[0].Value && BorderInfo_Right[0].Size / 2 > Max_r )
                                Max_r = BorderInfo_Right[0].Size / 2;

                            // Отдаем предпочтение более широкой границе
                            if ( border_Single === CurBorderInfo.Value && CurBorderInfo.Size > LastBorderTop_prev.W )
                                RightMW = Max_r;
                            else
                                RightMW = -Max_r;
                        }

                        if ( 0 === Index )
                        {
                            var Max_l = 0;
                            if ( 0 != CurRow )
                            {
                                var Prev_Row = this.Content[CurRow - 1];
                                var Prev_CellsCount = Prev_Row.Get_CellsCount();
                                for ( var TempIndex = 0; TempIndex < Prev_CellsCount; TempIndex++ )
                                {
                                    var Prev_Cell = Prev_Row.Get_Cell( TempIndex );
                                    var Prev_GridCol = Prev_Row.Get_CellInfo( TempIndex ).StartGridCol;
                                    var Prev_GridSpan = Prev_Cell.Get_GridSpan();

                                    var bLeft = null;
                                    if ( Prev_GridCol === CurGridCol )
                                    {
                                        bLeft = true;
                                    }
                                    else if ( Prev_GridCol + Prev_GridSpan === CurGridCol )
                                    {
                                        bLeft = false;
                                    }
                                    else if ( Prev_GridCol > CurGridCol )
                                        break;

                                    if ( null != bLeft )
                                    {
                                        var Prev_VMerge = Prev_Cell.GetVMerge();
                                        if ( vmerge_Continue === Prev_VMerge )
                                            Prev_Cell = this.Internal_Get_StartMergedCell( CurRow - 1, Prev_GridCol, Prev_GridSpan );

                                        if ( null === Prev_Cell )
                                            break;

                                        var Num = CurRow - 1 - Prev_Cell.Row.Index;
                                        if ( Num < 0 )
                                            break;

                                        if ( true === bLeft )
                                        {
                                            var Prev_Cell_BorderInfo_Left = Prev_Cell.Get_BorderInfo().Left;
                                            if( null != Prev_Cell_BorderInfo_Left && Prev_Cell_BorderInfo_Left.length > Num && border_Single === Prev_Cell_BorderInfo_Left[Num].Value )
                                                Max_l = Prev_Cell_BorderInfo_Left[Num].Size / 2;

                                        }
                                        else
                                        {
                                            var Prev_Cell_BorderInfo_Right = Prev_Cell.Get_BorderInfo().Right;
                                            if( null != Prev_Cell_BorderInfo_Right && Prev_Cell_BorderInfo_Right.length > Num && border_Single === Prev_Cell_BorderInfo_Right[Num].Value )
                                                Max_l = Prev_Cell_BorderInfo_Right[Num].Size / 2;
                                        }

                                        break;
                                    }
                                }
                            }

                            if( BorderInfo_Left.length > 0 && border_Single === BorderInfo_Left[0].Value && BorderInfo_Left[0].Size / 2 > Max_l )
                                Max_l = BorderInfo_Left[0].Size / 2;

                            LastBorderTop.L = Max_l;
                            LastBorderTop.W = 0;

                            if ( border_Single === CurBorderInfo.Value )
                                LastBorderTop.W = CurBorderInfo.Size;
                        }

                        if ( border_Single === CurBorderInfo.Value )
                        {
                            RGBA = CurBorderInfo.Get_Color2(Theme, ColorMap);
                            pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                            if(pGraphics.SetBorder)
                            {
                                pGraphics.SetBorder(CurBorderInfo);
                            }
                            pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Top, Y, X0, X1, CurBorderInfo.Size, LeftMW, RightMW );
                        }
                        else //if ( border_None === CurBorderInfo.Value )
                        {
                            pGraphics.DrawEmptyTableLine( X0 + LeftMW, Y, X1 + RightMW , Y );
                        }
                    }
                }
            }
        }
    }

    var Y = this.Y;
    for ( var CurRow = Row_start; CurRow <= Row_last; CurRow++ )
    {
        var Row = this.Content[CurRow];
        var CellsCount = Row.Get_CellsCount();
        Y = this.RowsInfo[CurRow].Y[PNum];
        var CellSpacing = Row.Get_CellSpacing();

        var LastBorderTop = { W : 0, L : 0 };

        // Рисуем ячейки начиная с последней, потому что левая ячейка
        // должна рисоваться поверх правой при конфликте границ.
        for ( var CurCell = CellsCount - 1; CurCell >= 0; CurCell-- )
        {
            var Cell = Row.Get_Cell( CurCell );
            var GridSpan = Cell.Get_GridSpan();
            var VMerge = Cell.GetVMerge();
            var CurGridCol = Row.Get_CellInfo( CurCell ).StartGridCol;

            if ( vmerge_Continue === VMerge )
            {
                if ( Row_start === CurRow  )
                {
                    Cell = this.Internal_Get_StartMergedCell( CurRow, CurGridCol, GridSpan );
                    if ( null === Cell )
                    {
                        LastBorderTop = { W : 0, L : 0 };
                        continue;
                    }

                    // Параметры GridSpan и CurGridCol должны остаться такими же
                }
                else
                {
                    LastBorderTop = { W : 0, L : 0 };
                    continue;
                }
            }

            var CellInfo     = Row.Get_CellInfo( CurCell );
            var X_cell_start = Page.X + CellInfo.X_cell_start;
            var X_cell_end   = Page.X + CellInfo.X_cell_end;

            var VMergeCount = this.private_GetVertMergeCountOnPage(PNum, CurRow, CurGridCol, GridSpan);
            if (VMergeCount <= 0)
            {
                LastBorderTop = {W : 0, L : 0};
                continue;
            }

            var RealHeight  = this.RowsInfo[CurRow + VMergeCount - 1].Y[PNum] + this.RowsInfo[CurRow + VMergeCount - 1].H[PNum] - Y;

            // Обводим ячейку
            var CellBorders = Cell.Get_Borders();

            if ( null != CellSpacing )
            {
                // Левая граница
                if ( border_Single === CellBorders.Left.Value )
                {
                    RGBA =  CellBorders.Left.Get_Color2(Theme, ColorMap);
                    pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                    if(pGraphics.SetBorder)
                    {
                        pGraphics.SetBorder(CellBorders.Left);
                    }
                    pGraphics.drawVerLine( c_oAscLineDrawingRule.Left, X_cell_start, Y - CellBorders.Top.Size, Y + RealHeight + CellBorders.Bottom.Size, CellBorders.Left.Size );
                }
                else //if ( border_None === CellBorders.Left.Value )
                {
                    pGraphics.DrawEmptyTableLine( X_cell_start, Y, X_cell_start, Y + RealHeight);
                }

                // Правая граница
                if ( border_Single === CellBorders.Right.Value )
                {
                    RGBA =  CellBorders.Right.Get_Color2(Theme, ColorMap);
                    pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                    if(pGraphics.SetBorder)
                    {
                        pGraphics.SetBorder(CellBorders.Right);
                    }
                    pGraphics.drawVerLine( c_oAscLineDrawingRule.Right, X_cell_end, Y - CellBorders.Top.Size, Y + RealHeight + CellBorders.Bottom.Size, CellBorders.Right.Size );
                }
                else //if ( border_None === CellBorders.Right.Value )
                {
                    pGraphics.DrawEmptyTableLine( X_cell_end, Y, X_cell_end, Y + RealHeight);
                }

                // Верхняя граница
                if ( border_Single === CellBorders.Top.Value )
                {

                    RGBA =  CellBorders.Top.Get_Color2(Theme, ColorMap);
                    pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                    if(pGraphics.SetBorder)
                    {
                        pGraphics.SetBorder(CellBorders.Top);
                    }
                    pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Top, Y - CellBorders.Top.Size, X_cell_start, X_cell_end, CellBorders.Top.Size, 0, 0 );
                }
                else //if ( border_None === CellBorders.Top.Value )
                {
                    pGraphics.DrawEmptyTableLine( X_cell_start, Y, X_cell_end, Y );
                }

                // Нижняя граница
                if ( border_Single === CellBorders.Bottom.Value )
                {
                    RGBA =  CellBorders.Bottom.Get_Color2(Theme, ColorMap);
                    pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                    if(pGraphics.SetBorder)
                    {
                        pGraphics.SetBorder(CellBorders.Bottom);
                    }
                    pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Bottom, Y + RealHeight + CellBorders.Bottom.Size, X_cell_start, X_cell_end, CellBorders.Bottom.Size, 0, 0 );
                }
                else //if ( border_None === CellBorders.Bottom.Value )
                {
                    pGraphics.DrawEmptyTableLine( X_cell_start, Y + RealHeight, X_cell_end, Y + RealHeight );
                }
            }
            else
            {
                var CellBordersInfo = Cell.Get_BorderInfo();

                // Левая граница
                var BorderInfo_Left  = CellBordersInfo.Left;

                // Это значение может не совпадать с CurRow
                var TempCurRow = Cell.Row.Index;

                var Row_side_border_start = ( TempCurRow < Row_start ? Row_start - TempCurRow : 0 );
                var Row_side_border_end   = ( BorderInfo_Left.length - 1 + TempCurRow > Row_last ? Row_last - TempCurRow + 1 : BorderInfo_Left.length - 1 );
                for ( var Index = Row_side_border_start; Index <= Row_side_border_end; Index++ )
                {
                    var CurBorderInfo = BorderInfo_Left[Index];
                    var Y0 = this.RowsInfo[TempCurRow + Index].Y[PNum];
                    var Y1 = this.RowsInfo[TempCurRow + Index].Y[PNum] + this.RowsInfo[TempCurRow + Index].H[PNum];

                    if ( border_Single === CurBorderInfo.Value )
                    {
                        RGBA =  CurBorderInfo.Get_Color2(Theme, ColorMap);
                        pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                        //pGraphics.p_width( CurBorderInfo.Size * 1000 );
                        //pGraphics._s();
                        if(pGraphics.SetBorder)
                        {
                            pGraphics.SetBorder(CurBorderInfo);
                        }

                        pGraphics.drawVerLine( c_oAscLineDrawingRule.Center, X_cell_start, Y0, Y1, CurBorderInfo.Size );
                        //pGraphics._m( X_cell_start * 100, Y0 * 100 );
                        //pGraphics._l( X_cell_start * 100, Y1 * 100 );

                        //pGraphics.ds();
                    }
                    else //if ( border_None === CurBorderInfo.Value )
                    {
                        if ( 0 === CurCell )
                        {
                            pGraphics.DrawEmptyTableLine( X_cell_start, Y0, X_cell_start, Y1 );
                        }

                        // Для остальных ячеек невидимые границы мы рисуем как правые
                    }
                }


                // Правая граница
                var BorderInfo_Right = CellBordersInfo.Right;
                for ( var Index = Row_side_border_start; Index <= Row_side_border_end; Index++ )
                {
                    var CurBorderInfo = BorderInfo_Right[Index];
                    var Y0 = this.RowsInfo[TempCurRow + Index].Y[PNum];
                    var Y1 = this.RowsInfo[TempCurRow + Index].Y[PNum] + this.RowsInfo[TempCurRow + Index].H[PNum];

                    // Мы должны проверить последняя ли данная ячейка в строке
                    var TempCellIndex  = this.private_GetCellIndexByStartGridCol( TempCurRow + Index, CellInfo.StartGridCol );
                    var TempCellsCount = this.Content[TempCurRow + Index].Get_CellsCount();

                    if ( TempCellsCount - 1 === TempCellIndex )
                    {
                        if ( border_Single === CurBorderInfo.Value )
                        {

                            RGBA =  CurBorderInfo.Get_Color2(Theme, ColorMap);
                            pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                            //pGraphics.p_width( CurBorderInfo.Size * 1000 );
                            //pGraphics._s();
                            if(pGraphics.SetBorder)
                            {
                                pGraphics.SetBorder(CurBorderInfo);
                            }

                            pGraphics.drawVerLine( c_oAscLineDrawingRule.Center, X_cell_end, Y0, Y1, CurBorderInfo.Size );
                            //pGraphics._m( X_cell_end * 100, Y0 * 100 );
                            //pGraphics._l( X_cell_end * 100, Y1 * 100 );

                            //pGraphics.ds();
                        }
                        else //if ( border_None === CurBorderInfo.Value )
                        {
                            pGraphics.DrawEmptyTableLine( X_cell_end, Y0, X_cell_end, Y1 );
                        }
                    }
                    else if ( border_None === CurBorderInfo.Value )
                    {
                        pGraphics.DrawEmptyTableLine( X_cell_end, Y0, X_cell_end, Y1 );
                    }
                }


                // Верхняя граница
                var BorderInfo_Top   = CellBordersInfo.Top;
                var LastBorderTop_prev = { W : LastBorderTop.W, H : LastBorderTop.H };
                for ( var Index = 0; Index < BorderInfo_Top.length; Index++ )
                {
                    var CurBorderInfo = BorderInfo_Top[Index];

                    // Верхняя граница первой строки на новой странице должна рисоваться, либо
                    // как задано в ячейке, либо как задано в таблице.
                    if ( 0 != PNum && CurRow === Row_start )
                        CurBorderInfo = this.Internal_CompareBorders( TableBorders.Top, CurBorderInfo, true, false );

                    var X0 = Page.X + this.TableSumGrid[Index + CurGridCol - 1];
                    var X1 = Page.X + this.TableSumGrid[Index + CurGridCol];

                    var LeftMW = 0;
                    var RightMW = 0;
                    if ( BorderInfo_Top.length - 1 === Index )
                    {
                        var Max_r = 0;
                        if ( 0 != CurRow )
                        {
                            var Prev_Row = this.Content[CurRow - 1];
                            var Prev_CellsCount = Prev_Row.Get_CellsCount();
                            for ( var TempIndex = 0; TempIndex < Prev_CellsCount; TempIndex++ )
                            {
                                var Prev_Cell = Prev_Row.Get_Cell( TempIndex );
                                var Prev_GridCol = Prev_Row.Get_CellInfo( TempIndex ).StartGridCol;
                                var Prev_GridSpan = Prev_Cell.Get_GridSpan();

                                var bLeft = null;
                                if ( Prev_GridCol === Index + CurGridCol + 1 )
                                {
                                    bLeft = true;
                                }
                                else if ( Prev_GridCol + Prev_GridSpan === Index + CurGridCol + 1 )
                                {
                                    bLeft = false;
                                }
                                else if ( Prev_GridCol > CurGridCol )
                                    break;

                                if ( null != bLeft )
                                {
                                    var Prev_VMerge = Prev_Cell.GetVMerge();
                                    if ( vmerge_Continue === Prev_VMerge )
                                        Prev_Cell = this.Internal_Get_StartMergedCell( CurRow - 1, Prev_GridCol, Prev_GridSpan );

                                    if ( null === Prev_Cell )
                                        break;

                                    var Num = CurRow - 1 - Prev_Cell.Row.Index;
                                    if ( Num < 0 )
                                        break;

                                    if ( true === bLeft )
                                    {
                                        var Prev_Cell_BorderInfo_Left = Prev_Cell.Get_BorderInfo().Left;
                                        if( null != Prev_Cell_BorderInfo_Left && Prev_Cell_BorderInfo_Left.length > Num && border_Single === Prev_Cell_BorderInfo_Left[Num].Value )
                                            Max_r = Prev_Cell_BorderInfo_Left[Num].Size / 2;
                                    }
                                    else
                                    {
                                        var Prev_Cell_BorderInfo_Right = Prev_Cell.Get_BorderInfo().Right;
                                        if( null != Prev_Cell_BorderInfo_Right && Prev_Cell_BorderInfo_Right.length > Num && border_Single === Prev_Cell_BorderInfo_Right[Num].Value )
                                            Max_r = Prev_Cell_BorderInfo_Right[Num].Size / 2;
                                    }

                                    break;
                                }
                            }
                        }

                        if ( BorderInfo_Right.length > 0 && border_Single === BorderInfo_Right[0].Value && BorderInfo_Right[0].Size / 2 > Max_r )
                            Max_r = BorderInfo_Right[0].Size / 2;

                        // Отдаем предпочтение более широкой границе
                        if ( border_Single === CurBorderInfo.Value && CurBorderInfo.Size > LastBorderTop_prev.W )
                            RightMW = Max_r;//X1 += Max_r;
                        else
                            RightMW = -Max_r;//X1 -= Max_r;

                        if ( border_Single === BorderInfo_Right[0].Value && CurBorderInfo.Size <= BorderInfo_Right[0].Size )
                            RightMW = -BorderInfo_Right[0].Size / 2;
                    }

                    if ( 0 === Index )
                    {
                        var Max_l = 0;
                        if ( 0 != CurRow )
                        {
                            var Prev_Row = this.Content[CurRow - 1];
                            var Prev_CellsCount = Prev_Row.Get_CellsCount();
                            for ( var TempIndex = 0; TempIndex < Prev_CellsCount; TempIndex++ )
                            {
                                var Prev_Cell = Prev_Row.Get_Cell( TempIndex );
                                var Prev_GridCol = Prev_Row.Get_CellInfo( TempIndex ).StartGridCol;
                                var Prev_GridSpan = Prev_Cell.Get_GridSpan();

                                var bLeft = null;
                                if ( Prev_GridCol === CurGridCol )
                                {
                                    bLeft = true;
                                }
                                else if ( Prev_GridCol + Prev_GridSpan === CurGridCol )
                                {
                                    bLeft = false;
                                }
                                else if ( Prev_GridCol > CurGridCol )
                                    break;

                                if ( null != bLeft )
                                {
                                    var Prev_VMerge = Prev_Cell.GetVMerge();
                                    if ( vmerge_Continue === Prev_VMerge )
                                        Prev_Cell = this.Internal_Get_StartMergedCell( CurRow - 1, Prev_GridCol, Prev_GridSpan );

                                    if ( null === Prev_Cell )
                                        break;

                                    var Num = CurRow - 1 - Prev_Cell.Row.Index;
                                    if ( Num < 0 )
                                        break;

                                    if ( true === bLeft )
                                    {
                                        var Prev_Cell_BorderInfo_Left = Prev_Cell.Get_BorderInfo().Left;
                                        if( null != Prev_Cell_BorderInfo_Left && Prev_Cell_BorderInfo_Left.length > Num && border_Single === Prev_Cell_BorderInfo_Left[Num].Value )
                                            Max_l = Prev_Cell_BorderInfo_Left[Num].Size / 2;

                                    }
                                    else
                                    {
                                        var Prev_Cell_BorderInfo_Right = Prev_Cell.Get_BorderInfo().Right;
                                        if( null != Prev_Cell_BorderInfo_Right && Prev_Cell_BorderInfo_Right.length > Num && border_Single === Prev_Cell_BorderInfo_Right[Num].Value )
                                            Max_l = Prev_Cell_BorderInfo_Right[Num].Size / 2;
                                    }

                                    break;
                                }
                            }
                        }

                        if( BorderInfo_Left.length > 0 && border_Single === BorderInfo_Left[0].Value && BorderInfo_Left[0].Size / 2 > Max_l )
                            Max_l = BorderInfo_Left[0].Size / 2;

                        //X0 -= Max_l;
                        LeftMW = -Max_l;

                        if ( border_Single === BorderInfo_Left[0].Value && CurBorderInfo.Size <= BorderInfo_Left[0].Size )
                            LeftMW = BorderInfo_Left[0].Size / 2;

                        LastBorderTop.L = Max_l;
                        LastBorderTop.W = 0;

                        if ( border_Single === CurBorderInfo.Value )
                            LastBorderTop.W = CurBorderInfo.Size;
                    }

                    if ( border_Single === CurBorderInfo.Value )
                    {

                        RGBA =  CurBorderInfo.Get_Color2(Theme, ColorMap);
                        pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                        //pGraphics.p_width( CurBorderInfo.Size * 1000 );
                        //pGraphics._s();
                        if(pGraphics.SetBorder)
                        {
                            pGraphics.SetBorder(CurBorderInfo);
                        }

                        pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Top, Y, X0, X1, CurBorderInfo.Size, LeftMW, RightMW );
                        //pGraphics._m( X0 * 100, ( Y + CurBorderInfo.Size / 2 ) * 100 );
                        //pGraphics._l( X1 * 100, ( Y + CurBorderInfo.Size / 2 ) * 100 );

                        //pGraphics.ds();
                    }
                    else //if ( border_None === CurBorderInfo.Value )
                    {
                        pGraphics.DrawEmptyTableLine( X0 + LeftMW, Y, X1 + RightMW , Y );
                        //pGraphics.DrawEmptyTableLine( X0, Y, X1, Y );
                    }
                }

                // Нижняя граница
                if ( PNum != this.Pages.length - 1 && CurRow + VMergeCount - 1 === Row_last )
                {
                    var X0 = X_cell_start;
                    var X1 = X_cell_end;

                    var LowerCell = this.private_GetCellIndexByStartGridCol( CurRow + VMergeCount - 1, Row.Get_CellInfo( CurCell ).StartGridCol );

                    var BottomBorder = ( -1 === LowerCell ? this.Pages[PNum].BotBorders[0] : this.Pages[PNum].BotBorders[LowerCell] );
                    if ( border_Single === BottomBorder.Value )
                    {

                        RGBA =  BottomBorder.Get_Color2(Theme, ColorMap);
                        pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                        //pGraphics.p_width( BottomBorder.Size * 1000 );
                        //pGraphics._s();
                        if(pGraphics.SetBorder)
                        {
                            pGraphics.SetBorder(BottomBorder);
                        }

                        var X0 = X_cell_start;
                        var X1 = X_cell_end;

                        var LeftMW = 0;
                        if ( BorderInfo_Left.length > 0 && border_Single === BorderInfo_Left[BorderInfo_Left.length - 1].Value )
                            LeftMW = -BorderInfo_Left[BorderInfo_Left.length - 1].Size / 2;

                        var RightMW = 0;
                        if ( BorderInfo_Right.length > 0 && border_Single === BorderInfo_Right[BorderInfo_Right.length - 1].Value )
                            RightMW = +BorderInfo_Right[BorderInfo_Right.length - 1].Size / 2;

                        pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Top, Y + RealHeight, X0, X1, BottomBorder.Size, LeftMW, RightMW );

                        //var X0 = X_cell_start;
                        //var X1 = X_cell_end;

                        //if ( BorderInfo_Left.length > 0 && border_Single === BorderInfo_Left[BorderInfo_Left.length - 1].Value )
                        //    X0 -= BorderInfo_Left[BorderInfo_Left.length - 1].Size / 2;

                        //if ( BorderInfo_Right.length > 0 && border_Single === BorderInfo_Right[BorderInfo_Right.length - 1].Value )
                        //    X1 += BorderInfo_Right[BorderInfo_Right.length - 1].Size / 2;

                        //pGraphics._m( X0 * 100, ( Y + RealHeight + BottomBorder.Size / 2 ) * 100 );
                        //pGraphics._l( X1 * 100, ( Y + RealHeight + BottomBorder.Size / 2 ) * 100 );

                        //pGraphics.ds();
                    }
                    else //if ( border_None === CellBorders.Bottom.Value )
                    {
                        pGraphics.DrawEmptyTableLine( X_cell_start, Y + RealHeight, X_cell_end, Y + RealHeight );
                    }
                }
                else
                {
                    var BorderInfo_Bottom = CellBordersInfo.Bottom;
                    var BorderInfo_Bottom_BeforeCount = CellBordersInfo.Bottom_BeforeCount;
                    var BorderInfo_Bottom_AfterCount  = CellBordersInfo.Bottom_AfterCount;

                    if ( null != BorderInfo_Bottom && BorderInfo_Bottom.length > 0 )
                    {
                        // Значит это последняя строка
                        if ( -1 === BorderInfo_Bottom_BeforeCount && -1 === BorderInfo_Bottom_AfterCount )
                        {
                            var BottomBorder = BorderInfo_Bottom[0];
                            if ( border_Single === BottomBorder.Value )
                            {

                                RGBA =  BottomBorder.Get_Color2(Theme, ColorMap);
                                pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                                //pGraphics.p_width( BottomBorder.Size * 1000 );
                                //pGraphics._s();
                                if(pGraphics.SetBorder)
                                {
                                    pGraphics.SetBorder(BottomBorder);
                                }

                                var X0 = X_cell_start;
                                var X1 = X_cell_end;

                                var LeftMW = 0;
                                if ( BorderInfo_Left.length > 0 && border_Single === BorderInfo_Left[BorderInfo_Left.length - 1].Value )
                                    LeftMW = -BorderInfo_Left[BorderInfo_Left.length - 1].Size / 2;

                                var RightMW = 0;
                                if ( BorderInfo_Right.length > 0 && border_Single === BorderInfo_Right[BorderInfo_Right.length - 1].Value )
                                    RightMW = +BorderInfo_Right[BorderInfo_Right.length - 1].Size / 2;

                                pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Top, Y + RealHeight, X0, X1, BottomBorder.Size, LeftMW, RightMW );

                                //var X0 = X_cell_start;
                                //var X1 = X_cell_end;

                                //if ( BorderInfo_Left.length > 0 && border_Single === BorderInfo_Left[BorderInfo_Left.length - 1].Value )
                                //    X0 -= BorderInfo_Left[BorderInfo_Left.length - 1].Size / 2;

                                //if ( BorderInfo_Right.length > 0 && border_Single === BorderInfo_Right[BorderInfo_Right.length - 1].Value )
                                //    X1 += BorderInfo_Right[BorderInfo_Right.length - 1].Size / 2;

                                //pGraphics._m( X0 * 100, ( Y + RealHeight + BottomBorder.Size / 2 ) * 100 );
                                //pGraphics._l( X1 * 100, ( Y + RealHeight + BottomBorder.Size / 2 ) * 100 );

                                //pGraphics.ds();
                            }
                            else //if ( border_None === CellBorders.Bottom.Value )
                            {
                                pGraphics.DrawEmptyTableLine( X_cell_start, Y + RealHeight, X_cell_end, Y + RealHeight );
                            }
                        }
                        else
                        {
                            for ( var Index = 0; Index < BorderInfo_Bottom_BeforeCount; Index++ )
                            {
                                var BottomBorder = BorderInfo_Bottom[Index];

                                if ( border_Single === BottomBorder.Value )
                                {

                                    RGBA =  BottomBorder.Get_Color2(Theme, ColorMap);
                                    pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                                    if(pGraphics.SetBorder)
                                    {
                                        pGraphics.SetBorder(BottomBorder);
                                    }

                                    pGraphics.p_width( BottomBorder.Size * 1000 );
                                    pGraphics._s();

                                    var X0 = Page.X + this.TableSumGrid[Index + CurGridCol - 1];
                                    var X1 = Page.X + this.TableSumGrid[Index + CurGridCol];

                                    var LeftMW = 0;
                                    if ( 0 === Index && BorderInfo_Left.length > 0 && border_Single === BorderInfo_Left[BorderInfo_Left.length - 1].Value )
                                        LeftMW = -BorderInfo_Left[BorderInfo_Left.length - 1].Size / 2;

                                    pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Top, Y + RealHeight, X0, X1, BottomBorder.Size, LeftMW, 0 );

                                    //var X0 = Page.X + this.TableSumGrid[Index + CurGridCol - 1];
                                    //var X1 = Page.X + this.TableSumGrid[Index + CurGridCol];

                                    //if ( 0 === Index && BorderInfo_Left.length > 0 && border_Single === BorderInfo_Left[BorderInfo_Left.length - 1].Value )
                                    //    X0 -= BorderInfo_Left[BorderInfo_Left.length - 1].Size / 2;

                                    //pGraphics._m( X0 * 100, ( Y + RealHeight + BottomBorder.Size / 2 ) * 100 );
                                    //pGraphics._l( X1 * 100, ( Y + RealHeight + BottomBorder.Size / 2 ) * 100 );

                                    //pGraphics.ds();
                                }
                                else //if ( border_None === CellBorders.Bottom.Value )
                                {
                                    pGraphics.DrawEmptyTableLine( X_cell_start, Y + RealHeight, X_cell_end, Y + RealHeight );
                                }
                            }

                            for ( var Index = 0; Index < BorderInfo_Bottom_AfterCount; Index++ )
                            {
                                var BottomBorder = BorderInfo_Bottom[BorderInfo_Bottom.length - 1 - Index];

                                if ( border_Single === BottomBorder.Value )
                                {
                                    RGBA =  BottomBorder.Get_Color2(Theme, ColorMap);
                                    pGraphics.p_color( RGBA.r, RGBA.g, RGBA.b, 255 );
                                    if(pGraphics.SetBorder)
                                    {
                                        pGraphics.SetBorder(BottomBorder);
                                    }

                                    pGraphics.p_width( BottomBorder.Size * 1000 );
                                    pGraphics._s();

                                    var X0 = Page.X + this.TableSumGrid[CurGridCol + GridSpan - 2 - Index];
                                    var X1 = Page.X + this.TableSumGrid[CurGridCol + GridSpan - 1 - Index];

                                    var RightMW = 0;
                                    if ( 0 === Index && BorderInfo_Right.length > 0 && border_Single === BorderInfo_Right[BorderInfo_Right.length - 1].Value )
                                        RightMW = +BorderInfo_Right[BorderInfo_Right.length - 1].Size / 2;

                                    pGraphics.drawHorLineExt( c_oAscLineDrawingRule.Top, Y + RealHeight, X0, X1, BottomBorder.Size, 0, RightMW );

                                    //var X0 = Page.X + this.TableSumGrid[CurGridCol + GridSpan - 2 - Index];
                                    //var X1 = Page.X + this.TableSumGrid[CurGridCol + GridSpan - 1 - Index];

                                    //if ( 0 === Index && BorderInfo_Right.length > 0 && border_Single === BorderInfo_Right[BorderInfo_Right.length - 1].Value )
                                    //    X1 += BorderInfo_Right[BorderInfo_Right.length - 1].Size / 2;

                                    //pGraphics._m( X0 * 100, ( Y + RealHeight + BottomBorder.Size / 2 ) * 100 );
                                    //pGraphics._l( X1 * 100, ( Y + RealHeight + BottomBorder.Size / 2 ) * 100 );

                                    //pGraphics.ds();
                                }
                                else //if ( border_None === CellBorders.Bottom.Value )
                                {
                                    pGraphics.DrawEmptyTableLine( X_cell_start, Y + RealHeight, X_cell_end, Y + RealHeight );
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
CTable.prototype.private_GetTableCellsBackgroundFrames = function(nCurPage, nStartRow, nLastRow)
{
	var arrFrames = [];

	var oPage = this.Pages[nCurPage];

	if (this.HeaderInfo.Count > 0 && nCurPage > this.HeaderInfo.PageIndex && true === this.HeaderInfo.Pages[nCurPage].Draw)
	{
		var oHeaderPage = this.HeaderInfo.Pages[nCurPage];
		for (var nCurRow = 0; nCurRow < this.HeaderInfo.Count; ++nCurRow)
		{
			var oRow        = oHeaderPage.Rows[nCurRow];
			var nCellsCount = oRow.GetCellsCount();
			var nY          = oHeaderPage.RowsInfo[nCurRow].Y;

			for (var nCurCell = nCellsCount - 1; nCurCell >= 0; --nCurCell)
			{
				var oCell       = oRow.GetCell(nCurCell);
				var nGridSpan   = oCell.GetGridSpan();
				var nVMerge     = oCell.GetVMerge();
				var nCurGridCol = oRow.GetCellInfo(nCurCell).StartGridCol;
				var oBorders    = oCell.GetBorders();

				var nTopBorderSize    = border_Single === oBorders.Top.Value ? oBorders.Top.Size : 0;
				var nBottomBorderSize = border_Single === oBorders.Bottom.Value ? oBorders.Bottom.Size : 0;

				if (vmerge_Continue === nVMerge)
					continue;

				var oCellInfo    = oRow.GetCellInfo(nCurCell);
				var X_cell_start = oPage.X + oCellInfo.X_cell_start;
				var X_cell_end   = oPage.X + oCellInfo.X_cell_end;

				var nVMergeCount = this.Internal_GetVertMergeCount(nCurRow, nCurGridCol, nGridSpan);
				var nRealHeight  = oHeaderPage.RowsInfo[nCurRow + nVMergeCount - 1].Y + HeaderPage.RowsInfo[nCurRow + nVMergeCount - 1].H - nY;

				arrFrames.push({
					X        : X_cell_start,
					Y        : nY - nTopBorderSize,
					W        : X_cell_end - X_cell_start,
					H        : nRealHeight + nBottomBorderSize + nTopBorderSize,
					GridCol  : nCurGridCol,
					GridSpan : nGridSpan
				});
			}
		}
	}

	for (var nCurRow = nStartRow; nCurRow <= nLastRow; ++nCurRow)
	{
		var oRow        = this.GetRow(nCurRow);
		var nCellsCount = oRow.GetCellsCount();
		var nY          = this.RowsInfo[nCurRow].Y[nCurPage];

		for (var nCurCell = nCellsCount - 1; nCurCell >= 0; --nCurCell)
		{
			var oCell       = oRow.GetCell(nCurCell);
			var nGridSpan   = oCell.GetGridSpan();
			var nVMerge     = oCell.GetVMerge();
			var nCurGridCol = oRow.GetCellInfo(nCurCell).StartGridCol;
			var oBorders    = oCell.GetBorders();

			var nTopBorderSize    = border_Single === oBorders.Top.Value ? oBorders.Top.Size : 0;
			var nBottomBorderSize = border_Single === oBorders.Bottom.Value ? oBorders.Bottom.Size : 0;

			if (vmerge_Continue === nVMerge)
			{
				if (nStartRow === nCurRow)
				{
					oCell = this.Internal_Get_StartMergedCell(nCurRow, nCurGridCol, nGridSpan);
					if (null === oCell)
						continue;

					// Параметры GridSpan и CurGridCol должны остаться такими же
				}
				else
				{
					continue;
				}
			}

			var oCellInfo    = oRow.GetCellInfo(nCurCell);
			var X_cell_start = oPage.X + oCellInfo.X_cell_start;
			var X_cell_end   = oPage.X + oCellInfo.X_cell_end;

			var nVMergeCount = this.private_GetVertMergeCountOnPage(nCurPage, nCurRow, nCurGridCol, nGridSpan);
			if (nVMergeCount <= 0)
				continue;

			var nRealHeight = this.RowsInfo[nCurRow + nVMergeCount - 1].Y[nCurPage] + this.RowsInfo[nCurRow + nVMergeCount - 1].H[nCurPage] - nY;
			arrFrames.push({
				X        : X_cell_start,
				Y        : nY - nTopBorderSize,
				W        : X_cell_end - X_cell_start,
				H        : nRealHeight + nBottomBorderSize + nTopBorderSize,
				GridCol  : nCurGridCol,
				GridSpan : nGridSpan
			});
		}
	}

	return arrFrames;
};
