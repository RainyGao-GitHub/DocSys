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
var CShape = AscFormat.CShape;
var CChartSpace = AscFormat.CChartSpace;
var CreateUnifillSolidFillSchemeColor = AscFormat.CreateUnifillSolidFillSchemeColor;

CChartSpace.prototype.addToDrawingObjects =  CShape.prototype.addToDrawingObjects;
CChartSpace.prototype.setDrawingObjects = CShape.prototype.setDrawingObjects;
CChartSpace.prototype.setDrawingBase = CShape.prototype.setDrawingBase;
CChartSpace.prototype.deleteDrawingBase = CShape.prototype.deleteDrawingBase;
CChartSpace.prototype.setParent2 = CShape.prototype.setParent2;
CChartSpace.prototype.getDrawingObjectsController = CShape.prototype.getDrawingObjectsController;
CChartSpace.prototype.handleUpdateTheme = CShape.prototype.handleUpdateTheme;
CChartSpace.prototype.getIsSingleBody = CShape.prototype.getIsSingleBody;
CChartSpace.prototype.getSlideIndex = CShape.prototype.getSlideIndex;
CChartSpace.prototype.Is_UseInDocument = CShape.prototype.Is_UseInDocument;
CChartSpace.prototype.getEditorType = function()
{
    return 0;
};

CChartSpace.prototype.recalculateTransform = function()
{
    CShape.prototype.recalculateTransform.call(this);
    this.localTransform.Reset();
};


CChartSpace.prototype.recalculatePlotAreaChartBrush = function()
{
    if(this.chart && this.chart.plotArea)
    {
        var plot_area = this.chart.plotArea;
        var default_brush;
        var tint = 0.20000;
        if(this.style >=1 && this.style <=32)
        {
            if(this.bPreview)
            {
                default_brush = CreateUnifillSolidFillSchemeColor(6, tint);
            }
            else
            {
                default_brush = AscFormat.CreateNoFillUniFill();
            }
        }
        else if(this.style >=33 && this.style <= 34)
            default_brush = CreateUnifillSolidFillSchemeColor(8, 0.20000);
        else if(this.style >=35 && this.style <=40)
            default_brush = CreateUnifillSolidFillSchemeColor(this.style - 35, 0 + tint);
        else
            default_brush = CreateUnifillSolidFillSchemeColor(8, 0.95000);

        if(plot_area.spPr && plot_area.spPr.Fill)
        {
            default_brush.merge(plot_area.spPr.Fill);
        }
        var parents = this.getParentObjects();
        default_brush.calculate(parents.theme, parents.slide, parents.layout, parents.master, {R: 0, G: 0, B: 0, A: 255}, this.clrMapOvr);
        plot_area.brush = default_brush;
    }
};


CChartSpace.prototype.recalculateChartBrush = function()
{
    var default_brush;
    if(this.style >=1 && this.style <=32)
    {

        if(this.bPreview)
        {
            default_brush = CreateUnifillSolidFillSchemeColor(6, 0);
        }
        else
        {
            default_brush = AscFormat.CreateNoFillUniFill();
        }
    }
    else if(this.style >=33 && this.style <= 40)
        default_brush = CreateUnifillSolidFillSchemeColor(12, 0);
    else
        default_brush = CreateUnifillSolidFillSchemeColor(8, 0);

    if(this.spPr && this.spPr.Fill)
    {
        default_brush.merge(this.spPr.Fill);
    }
    var parents = this.getParentObjects();
    default_brush.calculate(parents.theme, parents.slide, parents.layout, parents.master, {R: 0, G: 0, B: 0, A: 255}, this.clrMapOvr);
    this.brush = default_brush;

};

CChartSpace.prototype.recalculateChartPen = function()
{
    var parent_objects = this.getParentObjects();
    var default_line = new AscFormat.CLn();
    if(parent_objects.theme  && parent_objects.theme.themeElements
        && parent_objects.theme.themeElements.fmtScheme
        && parent_objects.theme.themeElements.fmtScheme.lnStyleLst)
    {
        default_line.merge(parent_objects.theme.themeElements.fmtScheme.lnStyleLst[0]);
    }

    var fill;
    if(this.style >= 1 && this.style <= 32)
    {
        if(this.bPreview)
        {
            fill = CreateUnifillSolidFillSchemeColor(15, 0.75000);
        }
        else
        {
            fill = AscFormat.CreateNoFillUniFill();
        }
    }
    else if(this.style >= 33 && this.style <= 40)
        fill = CreateUnifillSolidFillSchemeColor(8, 0.75000);
    else
        fill = CreateUnifillSolidFillSchemeColor(12, 0);
    default_line.setFill(fill);
    if(this.spPr && this.spPr.ln)
        default_line.merge(this.spPr.ln);
    var parents = this.getParentObjects();
    default_line.calculate(parents.theme, parents.slide, parents.layout, parents.master, {R: 0, G: 0, B: 0, A: 255}, this.clrMapOvr);
    this.pen = default_line;
    AscFormat.checkBlackUnifill(this.pen.Fill, true);
};
CChartSpace.prototype.recalcText = function()
{
    this.recalcInfo.recalculateAxisLabels = true;
    this.recalcTitles2();
    this.handleUpdateInternalChart(false);
};

CChartSpace.prototype.recalculateBounds = CShape.prototype.recalculateBounds;
CChartSpace.prototype.deselect = CShape.prototype.deselect;
CChartSpace.prototype.hitToHandles = CShape.prototype.hitToHandles;
CChartSpace.prototype.hitInBoundingRect = CShape.prototype.hitInBoundingRect;
CChartSpace.prototype.getRotateAngle = CShape.prototype.getRotateAngle;
CChartSpace.prototype.getInvertTransform = CShape.prototype.getInvertTransform;
CChartSpace.prototype.hit = CShape.prototype.hit;
CChartSpace.prototype.hitInInnerArea = CShape.prototype.hitInInnerArea;
CChartSpace.prototype.hitInPath = CShape.prototype.hitInPath;
CChartSpace.prototype.check_bounds = CShape.prototype.check_bounds;
CChartSpace.prototype.setWorksheet = CShape.prototype.setWorksheet;
CChartSpace.prototype.handleUpdateLn = function()
{
    this.recalcInfo.recalculatePenBrush = true;
    this.recalcInfo.recalculatePlotAreaPen = true;
    this.addToRecalculate();
};
CChartSpace.prototype.setRecalculateInfo = function()
{
    this.recalcInfo =
    {
        recalcTitle: null,
        bRecalculatedTitle: false,
        recalculateTransform: true,
        recalculateBounds:    true,
        recalculateChart:     true,
        recalculateSeriesColors: true,
        recalculateMarkers: true,
        recalculateGridLines: true,
        recalculateDLbls: true,
        recalculateAxisLabels: true,
        dataLbls:[],
        axisLabels: [],
        recalculateAxisVal: true,
        recalculateAxisTickMark: true,
        recalculateBrush: true,
        recalculatePen: true,
        recalculatePlotAreaBrush: true,
        recalculatePlotAreaPen: true,
        recalculateHiLowLines: true,
        recalculateUpDownBars: true,
        recalculateLegend: true,
        recalculateReferences: true,
        recalculateBBox: true,
        recalculateFormulas: true,
        recalculatePenBrush: true,
        recalculateTextPr : true,
        recalculateBBoxRange: true
    };
    this.chartObj = null;
    this.rectGeometry = AscFormat.ExecuteNoHistory(function(){return  AscFormat.CreateGeometry("rect");},  this, []);
    this.lockType = AscCommon.c_oAscLockTypes.kLockTypeNone;
};
CChartSpace.prototype.recalcTransform = function()
{
    this.recalcInfo.recalculateTransform = true;
};
CChartSpace.prototype.recalcBounds = function()
{
    this.recalcInfo.recalculateBounds = true;
};
CChartSpace.prototype.recalcChart = function()
{
    this.recalcInfo.recalculateChart = true;
};
CChartSpace.prototype.recalcSeriesColors = function()
{
    this.recalcInfo.recalculateSeriesColors = true;
    this.recalcInfo.recalculatePenBrush = true;
    this.recalcInfo.recalculatePlotAreaBrush = true;
    this.recalcInfo.recalculateLegend = true;
};

CChartSpace.prototype.recalcDLbls = function()
{
    this.recalcInfo.recalculateDLbls = true;
};

CChartSpace.prototype.addToRecalculate = CShape.prototype.addToRecalculate;

CChartSpace.prototype.handleUpdatePosition = function()
{
    this.recalcTransform();
    this.recalcBounds();
    for(var i = 0; i < this.userShapes.length; ++i)
    {
        if(this.userShapes[i].object)
        {
            this.userShapes[i].object.handleUpdateExtents();
        }
    }
    this.addToRecalculate();
};
CChartSpace.prototype.handleUpdateFlip = function()
{
    this.recalcTransform();
    //this.setRecalculateInfo();
    this.addToRecalculate();
};
CChartSpace.prototype.handleUpdateChart = function()
{
    this.recalcChart();
    this.setRecalculateInfo();
    this.addToRecalculate();
};
CChartSpace.prototype.handleUpdateStyle = function()
{
    this.recalcInfo.recalculateSeriesColors = true;
    this.recalcInfo.recalculatePenBrush = true;
    this.recalcInfo.recalculateLegend = true;
    this.recalcInfo.recalculatePlotAreaBrush = true;
    this.recalcInfo.recalculatePlotAreaPen = true;
    this.recalcInfo.recalculateBrush = true;
    this.recalcInfo.recalculatePen = true;
    this.recalcInfo.recalculateHiLowLines = true;
    this.recalcInfo.recalculateUpDownBars = true;
    this.handleTitlesAfterChangeTheme();
    this.recalcInfo.recalculateAxisLabels = true;
    this.recalcInfo.recalculateAxisVal = true;
    this.addToRecalculate();
};
CChartSpace.prototype.handleUpdateFill = function()
{
    this.recalcInfo.recalculatePenBrush = true;
    this.recalcInfo.recalculatePlotAreaBrush = true;
    this.recalcInfo.recalculateBrush = true;
    this.recalcInfo.recalculateChart = true;
    this.recalcInfo.recalculateSeriesColors = true;
    this.recalcInfo.recalculateLegend = true;
	this.recalcInfo.recalculateMarkers = true;
    this.addToRecalculate();
};
CChartSpace.prototype.handleUpdateLn = function()
{
    this.recalcInfo.recalculatePenBrush = true;
    this.recalcInfo.recalculatePlotAreaPen = true;
    this.recalcInfo.recalculatePen = true;
    this.recalcInfo.recalculateChart = true;
    this.recalcInfo.recalculateSeriesColors = true;
    this.recalcInfo.recalculateLegend = true;
	this.recalcInfo.recalculateMarkers = true;
    this.addToRecalculate();
};
CChartSpace.prototype.canGroup = CShape.prototype.canGroup;
CChartSpace.prototype.convertPixToMM = CShape.prototype.convertPixToMM;
CChartSpace.prototype.getCanvasContext = CShape.prototype.getCanvasContext;
CChartSpace.prototype.getHierarchy = CShape.prototype.getHierarchy;
CChartSpace.prototype.getParentObjects = CShape.prototype.getParentObjects;
CChartSpace.prototype.recalculateTransform = CShape.prototype.recalculateTransform;
CChartSpace.prototype.canResize = CShape.prototype.canResize;
CChartSpace.prototype.canMove = CShape.prototype.canMove;
CChartSpace.prototype.canRotate = function()
{
    return false;
};


CChartSpace.prototype.createResizeTrack = CShape.prototype.createResizeTrack;
CChartSpace.prototype.createMoveTrack = CShape.prototype.createMoveTrack;
CChartSpace.prototype.getRectBounds = CShape.prototype.getRectBounds;

CChartSpace.prototype.recalculateBounds = function()
{
    var transform = this.transform;
    var a_x = [];
    var a_y = [];
    a_x.push(transform.TransformPointX(0, 0));
    a_y.push(transform.TransformPointY(0, 0));
    a_x.push(transform.TransformPointX(this.extX, 0));
    a_y.push(transform.TransformPointY(this.extX, 0));
    a_x.push(transform.TransformPointX(this.extX, this.extY));
    a_y.push(transform.TransformPointY(this.extX, this.extY));
    a_x.push(transform.TransformPointX(0, this.extY));
    a_y.push(transform.TransformPointY(0, this.extY));
    this.bounds.l = Math.min.apply(Math, a_x);
    this.bounds.t = Math.min.apply(Math, a_y);
    this.bounds.r = Math.max.apply(Math, a_x);
    this.bounds.b = Math.max.apply(Math, a_y);
    this.bounds.w = this.bounds.r - this.bounds.l;
    this.bounds.h = this.bounds.b - this.bounds.t;
    this.bounds.x = this.bounds.l;
    this.bounds.y = this.bounds.t;
};




CChartSpace.prototype.recalculate = function()
{
    if(this.bDeleted || !this.parent)
        return;
    AscFormat.ExecuteNoHistory(function()
    {
        this.updateLinks();

        if(this.recalcInfo.recalcTitle)
        {
            this.recalculateChartTitleEditMode();
            this.recalcInfo.recalcTitle.updatePosition(this.transform.tx, this.transform.ty);
            this.recalcInfo.recalcTitle = null;
            this.recalcInfo.bRecalculatedTitle = true;
        }
        var b_transform = false;
        var bCheckLabels = false;
        if(this.recalcInfo.recalculateTransform)
        {
            this.recalculateTransform();
            this.rectGeometry.Recalculate(this.extX, this.extY);
            this.recalcInfo.recalculateTransform = false;
            this.recalculateSnapArrays();
            b_transform = true;
        }
        if(this.recalcInfo.recalculateReferences)
        {
            this.recalculateReferences();
            this.recalcInfo.recalculateReferences = false;
        }
        if(this.recalcInfo.recalculateBBox)
        {
            this.recalculateBBox();
            this.recalcInfo.recalculateBBox = false;
        }
        if(this.recalcInfo.recalculateMarkers)
        {
            this.recalculateMarkers();
            this.recalcInfo.recalculateMarkers = false;
        }
        if(this.recalcInfo.recalculateSeriesColors)
        {
            this.recalculateSeriesColors();
            this.recalcInfo.recalculateSeriesColors = false;
            this.recalcInfo.recalculateLegend = true;
            this.recalcInfo.recalculatePenBrush = true;
        }
        if(this.recalcInfo.recalculateGridLines)
        {
            this.recalculateGridLines();
            this.recalcInfo.recalculateGridLines = false;
        }
        if(this.recalcInfo.recalculateAxisTickMark)
        {
            this.recalculateAxisTickMark();
            this.recalcInfo.recalculateAxisTickMark = false;
        }
        if(this.recalcInfo.recalculateDLbls)
        {
            this.recalculateDLbls();
            this.recalcInfo.recalculateDLbls = false;
        }

        if(this.recalcInfo.recalculateBrush)
        {
            this.recalculateChartBrush();
            this.recalcInfo.recalculateBrush = false;
        }

        if(this.recalcInfo.recalculatePen)
        {
            this.recalculateChartPen();
            this.recalcInfo.recalculatePen = false;
        }

        if(this.recalcInfo.recalculateHiLowLines)
        {
            this.recalculateHiLowLines();
            this.recalcInfo.recalculateHiLowLines = false;
        }
        if(this.recalcInfo.recalculatePlotAreaBrush)
        {
            this.recalculatePlotAreaChartBrush();
            this.recalculateWalls();
            this.recalcInfo.recalculatePlotAreaBrush = false;
        }
        if(this.recalcInfo.recalculatePlotAreaPen)
        {
            this.recalculatePlotAreaChartPen();
            this.recalcInfo.recalculatePlotAreaPen = false;
        }
        if(this.recalcInfo.recalculateUpDownBars)
        {
            this.recalculateUpDownBars();
            this.recalcInfo.recalculateUpDownBars = false;
        }


        var b_recalc_labels = false;
        if(this.recalcInfo.recalculateAxisLabels)
        {
            this.recalculateAxisLabels();
            this.recalcInfo.recalculateAxisLabels = false;
            b_recalc_labels = true;
        }

        var b_recalc_legend = false;
        if(this.recalcInfo.recalculateLegend)
        {
            this.recalculateLegend();
            this.recalcInfo.recalculateLegend = false;
            b_recalc_legend = true;
        }

        if(this.recalcInfo.recalculateAxisVal)
        {
            if(AscFormat.CChartsDrawer.prototype._isSwitchCurrent3DChart(this)){
                //old variant
                this.recalculateAxis();
            }
            else{
                this.recalculateAxes();
            }
            this.recalcInfo.recalculateAxisVal = false;
            bCheckLabels = true;
        }
        if(this.recalcInfo.recalculatePenBrush)
        {
            this.recalculatePenBrush();
            this.recalcInfo.recalculatePenBrush = false;
        }

        if(this.recalcInfo.recalculateChart)
        {
            this.recalculateChart();
            this.recalcInfo.recalculateChart = false;
            if(bCheckLabels && this.chartObj.nDimensionCount === 3)
            {
                this.checkAxisLabelsTransform();
            }
        }
        this.calculateLabelsPositions(b_recalc_labels, b_recalc_legend);
        if(this.recalcInfo.recalculateBounds)
        {
            this.recalculateBounds();
            this.recalcInfo.recalculateBounds = false;
        }

        if(this.recalcInfo.recalculateTextPr)
        {
            this.recalculateTextPr();
            this.recalcInfo.recalculateTextPr = false;
        }

        this.recalculateUserShapes();
        // if(b_transform)
        {
            this.updateChildLabelsTransform(this.transform.tx, this.transform.ty);
        }
        this.recalcInfo.dataLbls.length = 0;
        this.recalcInfo.axisLabels.length = 0;
        this.bNeedUpdatePosition = true;

    }, this, []);
};



CChartSpace.prototype.deselect = CShape.prototype.deselect;
CChartSpace.prototype.getDrawingDocument = CShape.prototype.getDrawingDocument;
CChartSpace.prototype.recalculateLocalTransform = CShape.prototype.recalculateLocalTransform;

CChartSpace.prototype.Get_Theme = CShape.prototype.Get_Theme;
CChartSpace.prototype.Get_ColorMap = CShape.prototype.Get_ColorMap;

CTable.prototype.GetTableOffsetCorrection = function()
{
    return 0;
};
CTable.prototype.GetRightTableOffsetCorrection = function()
{
    return 0;
};
CTable.prototype.DrawSelectionOnPage = function(CurPage)
{
    if (false === this.Selection.Use)
        return;

    if (CurPage < 0 || CurPage >= this.Pages.length)
        return;

    var Page    = this.Pages[CurPage];
    var PageAbs = this.private_GetAbsolutePageIndex(CurPage);

    var H;
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
                var X_start = Page.X + CellInfo.X_cell_start;
                var X_end   = Page.X + CellInfo.X_cell_end;

                var Cell_Pages   = Cell.Content_Get_PagesCount();
                var Cell_PageRel = CurPage - Cell.Content.Get_StartPage_Relative();
                if (Cell_PageRel < 0 || Cell_PageRel >= Cell_Pages)
                    continue;

                if (0 != Cell_PageRel)
                {
                    // мы должны определить ряд, на котором случился перенос на новую страницу
                    var TempRowIndex = this.Pages[CurPage].FirstRow;
                    this.DrawingDocument.AddPageSelection(PageAbs, X_start, this.RowsInfo[TempRowIndex].Y[CurPage] + this.RowsInfo[TempRowIndex].TopDy[CurPage], X_end - X_start,  this.RowsInfo[TempRowIndex].H[CurPage]);
                }
                else
                {
                    H = this.RowsInfo[Pos.Row].H[CurPage];
                    for(var i = Pos.Row + 1; i < this.Content.length; ++i){
                        var Row2      = this.Content[i];
                        var Cell2     = Row2.Get_Cell(Pos.Cell);

                        if(!Cell2){
                            break;
                        }
                        var VMerge = Cell2.GetVMerge();
                        if (vmerge_Continue === VMerge){
                            H += this.RowsInfo[i].H[CurPage];
                        }
                        else{
                            break;
                        }
                    }
                    this.DrawingDocument.AddPageSelection(PageAbs, X_start, this.RowsInfo[Pos.Row].Y[CurPage] + this.RowsInfo[Pos.Row].TopDy[CurPage], X_end - X_start, H );
                }


            }
            break;
        }
        case table_Selection_Text:
        {
            var Cell = this.Content[this.Selection.StartPos.Pos.Row].Get_Cell(this.Selection.StartPos.Pos.Cell);
            var Cell_PageRel = CurPage - Cell.Content.Get_StartPage_Relative();
            Cell.Content_DrawSelectionOnPage(Cell_PageRel);
            break;
        }
    }
};

CTable.prototype.Internal_UpdateFlowPosition = function(X, Y)
{
    this.X_origin = 0.0;

    this.X = 0.0;
    this.Y = 0.0;
    var oGraphicFrame = this.Parent;
    if (oGraphicFrame.spPr && oGraphicFrame.spPr.xfrm && oGraphicFrame.spPr.xfrm.isNotNull()) {
        var xfrm = oGraphicFrame.spPr.xfrm;
        xfrm.setOffX(xfrm.offX + X);
        xfrm.setOffY(xfrm.offY + Y);
    }
};

CTableCell.prototype.Content_DrawSelectionOnPage = function(CurPage)
{
    var Transform       = this.private_GetTextDirectionTransform();
    var DrawingDocument = this.Row.Table.DrawingDocument;
    var OldTextMatrix = null;
    if (null !== Transform && DrawingDocument){
        if(DrawingDocument.TextMatrix)
        {
            OldTextMatrix = DrawingDocument.TextMatrix;
            DrawingDocument.TextMatrix = DrawingDocument.TextMatrix.CreateDublicate();
        }
        DrawingDocument.MultiplyTargetTransform(Transform.CreateDublicate());

    }

    this.Content.DrawSelectionOnPage(CurPage);


    if (null !== Transform && DrawingDocument){
        DrawingDocument.TextMatrix = OldTextMatrix;
    }
};

CTableCell.prototype.Content_RecalculateCurPos = function()
{
    var Transform = this.private_GetTextDirectionTransform();
    var DrawingDocument = this.Row.Table.DrawingDocument;
    var OldTextMatrix = null;
    if (null !== Transform && DrawingDocument)
    {
        if(DrawingDocument.TextMatrix)
        {
            OldTextMatrix = DrawingDocument.TextMatrix;
            DrawingDocument.TextMatrix = DrawingDocument.TextMatrix.CreateDublicate();
        }
        DrawingDocument.MultiplyTargetTransform(Transform.CreateDublicate());
    }

    var ret = this.Content.RecalculateCurPos();
    if (null !== Transform && DrawingDocument){
        DrawingDocument.TextMatrix = OldTextMatrix;
    }
    return ret;
};

CStyle.prototype.Create_NormalTable = function()
{
    var TablePr =
    {
        TableInd :
        {
            W    : 0,
            Type : tblwidth_Mm
        },
        TableCellMar :
        {
            Top :
            {
                W    : 1.27,
                Type : tblwidth_Mm
            },

            Left :
            {
                W    : 2.54, // 5.4pt
                Type : tblwidth_Mm
            },

            Bottom :
            {
                W    : 1.27,
                Type : tblwidth_Mm
            },

            Right :
            {
                W    : 2.54, // 5.4pt
                Type : tblwidth_Mm
            }
        }
    };

    this.Set_UiPriority( 99 );
    this.Set_SemiHidden( true );
    this.Set_UnhideWhenUsed( true );
    this.Set_TablePr( TablePr );
};

CTablePr.prototype.Init_Default = function()
{
    this.TableStyleColBandSize = 1;
    this.TableStyleRowBandSize = 1;
    this.Jc                    = AscCommon.align_Left;
    this.Shd                   = new CDocumentShd();
    this.TableBorders.Bottom   = new CDocumentBorder();
    this.TableBorders.Left     = new CDocumentBorder();
    this.TableBorders.Right    = new CDocumentBorder();
    this.TableBorders.Top      = new CDocumentBorder();
    this.TableBorders.InsideH  = new CDocumentBorder();
    this.TableBorders.InsideV  = new CDocumentBorder();
    this.TableCellMar.Bottom   = new CTableMeasurement(tblwidth_Mm, 1.27);
    this.TableCellMar.Left     = new CTableMeasurement(tblwidth_Mm, 2.54/*5.4 * g_dKoef_pt_to_mm*/); // 5.4pt
    this.TableCellMar.Right    = new CTableMeasurement(tblwidth_Mm, 2.54/*5.4 * g_dKoef_pt_to_mm*/); // 5.4pt
    this.TableCellMar.Top      = new CTableMeasurement(tblwidth_Mm, 1.27);
    this.TableCellSpacing      = null;
    this.TableInd              = 0;
    this.TableW                = new CTableMeasurement(tblwidth_Auto, 0);
    this.TableLayout           = tbllayout_AutoFit;
};
