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

CChartSpace.prototype.recalculateTransform = CShape.prototype.recalculateTransform;
CChartSpace.prototype.recalculateBounds =  function()
{
    var t = this.localTransform;
    var arr_p_x = [];
    var arr_p_y = [];
    arr_p_x.push(t.TransformPointX(0,0));
    arr_p_y.push(t.TransformPointY(0,0));
    arr_p_x.push(t.TransformPointX(this.extX,0));
    arr_p_y.push(t.TransformPointY(this.extX,0));
    arr_p_x.push(t.TransformPointX(this.extX,this.extY));
    arr_p_y.push(t.TransformPointY(this.extX,this.extY));
    arr_p_x.push(t.TransformPointX(0,this.extY));
    arr_p_y.push(t.TransformPointY(0,this.extY));

    this.bounds.x = Math.min.apply(Math, arr_p_x);
    this.bounds.y = Math.min.apply(Math, arr_p_y);
    this.bounds.l = this.bounds.x;
    this.bounds.t = this.bounds.y;
    this.bounds.r = Math.max.apply(Math, arr_p_x);
    this.bounds.b = Math.max.apply(Math, arr_p_y);
    this.bounds.w = this.bounds.r - this.bounds.l;
    this.bounds.h = this.bounds.b - this.bounds.t;
};
CChartSpace.prototype.deselect = CShape.prototype.deselect;
CChartSpace.prototype.hitToHandles = CShape.prototype.hitToHandles;
CChartSpace.prototype.hitInBoundingRect = CShape.prototype.hitInBoundingRect;
CChartSpace.prototype.getRotateAngle = CShape.prototype.getRotateAngle;
CChartSpace.prototype.getInvertTransform = CShape.prototype.getInvertTransform;
CChartSpace.prototype.hit = CShape.prototype.hit;
CChartSpace.prototype.hitInInnerArea = CShape.prototype.hitInInnerArea;
CChartSpace.prototype.hitInPath = CShape.prototype.hitInPath;
CChartSpace.prototype.check_bounds = CShape.prototype.check_bounds;
CChartSpace.prototype.Get_Theme = CShape.prototype.Get_Theme;
CChartSpace.prototype.Get_ColorMap = CShape.prototype.Get_ColorMap;
CChartSpace.prototype.Get_AbsolutePage = CShape.prototype.Get_AbsolutePage;
CChartSpace.prototype.GetParaDrawing = CShape.prototype.GetParaDrawing;

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

CChartSpace.prototype.setRecalculateInfo = function()
{
    this.recalcInfo =
    {
        recalcTitle: null,
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
        recalculateAxisCat: true ,
        recalculateAxisTickMark: true,
        recalculateBrush: true,
        recalculatePen: true,
        recalculatePlotAreaBrush: true,
        recalculatePlotAreaPen: true,
        recalculateHiLowLines: true,
        recalculateUpDownBars: true,
        recalculateLegend: true,
        recalculateWrapPolygon: true,
        recalculatePenBrush: true,
        recalculateTextPr: true
    };

    this.chartObj = null;
    this.rectGeometry = AscFormat.ExecuteNoHistory(function(){return  AscFormat.CreateGeometry("rect");},  this, []);
    this.bNeedUpdatePosition = true;
};
CChartSpace.prototype.recalcTransform = function()
{
    this.recalcInfo.recalculateTransform = true;
};
CChartSpace.prototype.recalcBounds = function()
{
    this.recalcInfo.recalculateBounds = true;
};
CChartSpace.prototype.recalcWrapPolygon = function()
{
    this.recalcInfo.recalculateWrapPolygon = true;
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
    this.recalcInfo.recalculatePlotAreaPen = true;
    this.recalcInfo.recalculateLegend = true;
};

CChartSpace.prototype.recalcDLbls = function()
{
    this.recalcInfo.recalculateDLbls = true;
};

CChartSpace.prototype.addToSetPosition = function(dLbl)
{
    if(dLbl instanceof AscFormat.CDLbl)
        this.recalcInfo.dataLbls.push(dLbl);
    else if(dLbl instanceof AscFormat.CTitle)
        this.recalcInfo.axisLabels.push(dLbl);
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
    this.handleUpdateExtents();
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
    this.recalcInfo.recalculateLegend = true;
    this.recalcInfo.recalculatePlotAreaBrush = true;
    this.recalcInfo.recalculatePlotAreaPen = true;
    this.recalcInfo.recalculateBrush = true;
    this.recalcInfo.recalculatePen = true;
    this.recalcInfo.recalculateHiLowLines = true;
    this.recalcInfo.recalculateUpDownBars = true;
    this.recalcInfo.recalculatePenBrush = true;
    this.handleTitlesAfterChangeTheme();
    this.recalcInfo.recalculateAxisLabels = true;
    this.recalcInfo.recalculateAxisVal = true;
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


CChartSpace.prototype.recalcText = function()
{
    this.recalcInfo.recalculateAxisLabels = true;
    this.recalcTitles2();
    this.handleUpdateInternalChart(false);
};

CChartSpace.prototype.setStartPage = function(pageIndex)
{
    this.selectStartPage = pageIndex;
    var title, content;
    if(this.chart && this.chart.title)
    {
        title = this.chart.title;
        content = title.getDocContent();
        content && content.Set_StartPage(pageIndex);
    }
    if(this.chart && this.chart.plotArea)
    {
        var aAxes = this.chart.plotArea.axId;
        if(aAxes)
        {
            for(var i = 0; i < aAxes.length; ++i)
            {
                var axis = aAxes[i];
                if(axis && axis.title)
                {
                    title = axis.title;
                    content = title.getDocContent();
                    content && content.Set_StartPage(pageIndex);
                }
            }
        }
    }
};
CChartSpace.prototype.getRecalcObject = CShape.prototype.getRecalcObject;
CChartSpace.prototype.setRecalcObject = CShape.prototype.setRecalcObject;
CChartSpace.prototype.canRotate = function()
{
    return false;
};


CChartSpace.prototype.createResizeTrack = CShape.prototype.createResizeTrack;
CChartSpace.prototype.createMoveTrack = CShape.prototype.createMoveTrack;
CChartSpace.prototype.getRectBounds = CShape.prototype.getRectBounds;

CChartSpace.prototype.recalculate = function()
{
    if(this.bDeleted)
        return;
    AscFormat.ExecuteNoHistory(function()
    {
        var bOldTrackRevision =  editor.WordControl.m_oLogicDocument.TrackRevisions;
        if(bOldTrackRevision){
            editor.WordControl.m_oLogicDocument.TrackRevisions = false;
        }
        this.updateLinks();


        var bCheckLabels = false;
        if(this.recalcInfo.recalcTitle)
        {
            this.recalculateChartTitleEditMode(true);
            this.recalcInfo.recalcTitle = null;
            this.recalcInfo.bRecalculatedTitle = true;
        }
        if(this.recalcInfo.recalculateTransform)
        {
            this.recalculateTransform();
            this.rectGeometry.Recalculate(this.extX, this.extY);
            this.recalcInfo.recalculateTransform = false;
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
            this.recalcInfo.recalculatePenBrush = true;
            this.recalcInfo.recalculateLegend = true;
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
        
        if(this.recalcInfo.recalculateTextPr)
        {
            this.recalculateTextPr();
            this.recalcInfo.recalculateTextPr = false;
        }

        if(this.recalcInfo.recalculateBounds)
        {
            this.recalculateBounds();
            this.recalcInfo.recalculateBounds = false;
        }
        if(this.recalcInfo.recalculateWrapPolygon)
        {
            this.recalculateWrapPolygon();
            this.recalcInfo.recalculateWrapPolygon = false;
        }
        this.recalculateUserShapes();
        this.recalcInfo.axisLabels.length = 0;
        this.bNeedUpdatePosition = true;
        if(AscFormat.isRealNumber(this.posX) && AscFormat.isRealNumber(this.posY))
        {
            this.updatePosition(this.posX, this.posY);
        }
        if(bOldTrackRevision){
            editor.WordControl.m_oLogicDocument.TrackRevisions = true;
        }
    }, this, []);
};



CChartSpace.prototype.deselect = CShape.prototype.deselect;

CChartSpace.prototype.getDrawingDocument = CShape.prototype.getDrawingDocument;

CChartSpace.prototype.updatePosition = CShape.prototype.updatePosition;
CChartSpace.prototype.recalculateWrapPolygon = CShape.prototype.recalculateWrapPolygon;
CChartSpace.prototype.getArrayWrapPolygons = function()
{
    return this.rectGeometry.getArrayPolygons();
};



CChartSpace.prototype.checkContentDrawings = function()
{};

CChartSpace.prototype.checkShapeChildTransform = function(transform_text)
{
    if(this.parent)
    {
        if(transform_text)
        {
            if(this.chart)
            {
                if(this.chart.plotArea)
                {
                    if(this.chart.plotArea.charts[0] && this.chart.plotArea.charts[0].series)
                    {
                        var series = this.chart.plotArea.charts[0].series;
                        for(var i = 0; i < series.length; ++i)
                        {
                            var ser = series[i];
                            var pts = AscFormat.getPtsFromSeries(ser);
                            for(var j = 0; j < pts.length; ++j)
                            {
                                if(pts[j].compiledDlb)
                                {
                                    pts[j].compiledDlb.checkShapeChildTransform(transform_text);
                                }
                            }
                        }
                    }
                    if(this.chart.plotArea.catAx)
                    {
                        if(this.chart.plotArea.catAx.title)
                            this.chart.plotArea.catAx.title.checkShapeChildTransform(transform_text);
                        if(this.chart.plotArea.catAx.labels)
                            this.chart.plotArea.catAx.labels.checkShapeChildTransform(transform_text);
                    }
                    if(this.chart.plotArea.valAx)
                    {
                        if(this.chart.plotArea.valAx.title)
                            this.chart.plotArea.valAx.title.checkShapeChildTransform(transform_text);
                        if(this.chart.plotArea.valAx.labels)
                            this.chart.plotArea.valAx.labels.checkShapeChildTransform(transform_text);
                    }

                }
                if(this.chart.title)
                {
                    this.chart.title.checkShapeChildTransform(transform_text);
                }
                if(this.chart.legend)
                {
                    this.chart.legend.checkShapeChildTransform(transform_text);
                }
            }
        }

    }
};


CChartSpace.prototype.recalculateLocalTransform = CShape.prototype.recalculateLocalTransform;
CChartSpace.prototype.updateTransformMatrix  = function()
{

    var posX = this.localTransform.tx + this.posX;
    var posY = this.localTransform.ty + this.posY;

    this.transform = this.localTransform.CreateDublicate();
    AscCommon.global_MatrixTransformer.TranslateAppend(this.transform, this.posX, this.posY);

    var oParentTransform = null;
    if(this.parent && this.parent.Get_ParentParagraph)
    {
        var oParagraph = this.parent.Get_ParentParagraph();
        if(oParagraph)
        {
            oParentTransform = oParagraph.Get_ParentTextTransform();

            if(oParentTransform)
            {
                AscCommon.global_MatrixTransformer.MultiplyAppend(this.transform, oParentTransform);
            }
        }
    }

    this.invertTransform = AscCommon.global_MatrixTransformer.Invert(this.transform);
    this.updateChildLabelsTransform(posX,posY);
    this.checkShapeChildTransform(oParentTransform);
};
CChartSpace.prototype.getArrayWrapIntervals = CShape.prototype.getArrayWrapIntervals;
CChartSpace.prototype.select = CShape.prototype.select;
CChartSpace.prototype.Is_UseInDocument = CShape.prototype.Is_UseInDocument;
//CChartSpace.prototype.Refresh_RecalcData = function(data)
//{
//    this.addToRecalculate();
//};

CChartSpace.prototype.IsHdrFtr = function(bool)
{
    if(!this.group)
    {
        if(isRealObject(this.parent) && isRealObject(this.parent.DocumentContent))
            return this.parent.DocumentContent.IsHdrFtr(bool);
    }
    else
    {
        var cur_group = this.group;
        while(cur_group.group)
            cur_group = cur_group.group;
        if(isRealObject(cur_group.parent) && isRealObject(cur_group.parent.DocumentContent))
            return cur_group.parent.DocumentContent.IsHdrFtr(bool);
    }
    return bool ? null : false;
};

CChartSpace.prototype.Refresh_RecalcData2 = function(pageIndex, object)
{
    if(object && object.getObjectType && object.getObjectType() === AscDFH.historyitem_type_Title && this.selection.title === object)
    {
        this.recalcInfo.recalcTitle = object;
    }
    else
    {
        var bOldRecalculateRef = this.recalcInfo.recalculateReferences;
        this.setRecalculateInfo();
        this.recalcInfo.recalculateReferences = bOldRecalculateRef;
    }
    this.addToRecalculate();
    var HdrFtr = this.IsHdrFtr(true);
    if (HdrFtr)
        HdrFtr.Refresh_RecalcData2();
    else
    {
        if(!this.group)
        {
            if(isRealObject(this.parent) && this.parent.Refresh_RecalcData2)
                this.parent.Refresh_RecalcData2({Type: AscDFH.historyitem_Drawing_SetExtent});
        }
        else
        {
            var cur_group = this.group;
            while(cur_group.group)
                cur_group = cur_group.group;
            if(isRealObject(cur_group.parent) && cur_group.parent.Refresh_RecalcData2)
                cur_group.parent.Refresh_RecalcData2({Type: AscDFH.historyitem_Drawing_SetExtent});
        }
    }
};
function CreateUnifillSolidFillSchemeColor(colorId, tintOrShade)
{
    var unifill = new AscFormat.CUniFill();
    unifill.setFill(new AscFormat.CSolidFill());
    unifill.fill.setColor(new AscFormat.CUniColor());
    unifill.fill.color.setColor(new AscFormat.CSchemeColor());
    unifill.fill.color.color.setId(colorId);
    return AscFormat.CreateUniFillSolidFillWidthTintOrShade(unifill, tintOrShade);
}

function CreateNoFillLine()
{
    var ret = new AscFormat.CLn();
    ret.setFill(AscFormat.CreateNoFillUniFill());
    return ret;
}

function CreateNoFillUniFill()
{
    var ret = new AscFormat.CUniFill();
    ret.setFill(new AscFormat.CNoFill());
    return ret;
}

window['AscFormat'].CreateUnifillSolidFillSchemeColor = CreateUnifillSolidFillSchemeColor;
window['AscFormat'].CreateNoFillLine = CreateNoFillLine;
window['AscFormat'].CreateNoFillUniFill = CreateNoFillUniFill;
