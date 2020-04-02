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

// Import
var c_oAscSizeRelFromH = AscCommon.c_oAscSizeRelFromH;
var c_oAscSizeRelFromV = AscCommon.c_oAscSizeRelFromV;
var c_oAscLockTypes = AscCommon.c_oAscLockTypes;
var parserHelp = AscCommon.parserHelp;
var isRealObject = AscCommon.isRealObject;
    var History = AscCommon.History;

var c_oAscError = Asc.c_oAscError;
var c_oAscChartTitleShowSettings = Asc.c_oAscChartTitleShowSettings;
var c_oAscChartHorAxisLabelShowSettings = Asc.c_oAscChartHorAxisLabelShowSettings;
var c_oAscChartVertAxisLabelShowSettings = Asc.c_oAscChartVertAxisLabelShowSettings;
var c_oAscChartLegendShowSettings = Asc.c_oAscChartLegendShowSettings;
var c_oAscChartDataLabelsPos = Asc.c_oAscChartDataLabelsPos;
var c_oAscGridLinesSettings = Asc.c_oAscGridLinesSettings;
var c_oAscChartTypeSettings = Asc.c_oAscChartTypeSettings;
var c_oAscRelativeFromH = Asc.c_oAscRelativeFromH;
var c_oAscRelativeFromV = Asc.c_oAscRelativeFromV;
var c_oAscFill = Asc.c_oAscFill;


var HANDLE_EVENT_MODE_HANDLE = 0;
var HANDLE_EVENT_MODE_CURSOR = 1;

var DISTANCE_TO_TEXT_LEFTRIGHT = 3.2;

    var BAR_DIR_BAR = 0;
    var BAR_DIR_COL = 1;

    var BAR_GROUPING_CLUSTERED = 0;
    var BAR_GROUPING_PERCENT_STACKED = 1;
    var BAR_GROUPING_STACKED = 2;
    var BAR_GROUPING_STANDARD = 3;

    var GROUPING_PERCENT_STACKED = 0;
    var GROUPING_STACKED = 1;
    var GROUPING_STANDARD = 2;

    var SCATTER_STYLE_LINE = 0;
    var SCATTER_STYLE_LINE_MARKER = 1;
    var SCATTER_STYLE_MARKER = 2;
    var SCATTER_STYLE_NONE = 3;
    var SCATTER_STYLE_SMOOTH = 4;
    var SCATTER_STYLE_SMOOTH_MARKER = 5;

    var CARD_DIRECTION_N = 0;
    var CARD_DIRECTION_NE = 1;
    var CARD_DIRECTION_E = 2;
    var CARD_DIRECTION_SE = 3;
    var CARD_DIRECTION_S = 4;
    var CARD_DIRECTION_SW = 5;
    var CARD_DIRECTION_W = 6;
    var CARD_DIRECTION_NW = 7;

    var CURSOR_TYPES_BY_CARD_DIRECTION = [];
    CURSOR_TYPES_BY_CARD_DIRECTION[CARD_DIRECTION_N]  = "n-resize";
    CURSOR_TYPES_BY_CARD_DIRECTION[CARD_DIRECTION_NE] = "ne-resize";
    CURSOR_TYPES_BY_CARD_DIRECTION[CARD_DIRECTION_E]  = "e-resize";
    CURSOR_TYPES_BY_CARD_DIRECTION[CARD_DIRECTION_SE] = "se-resize";
    CURSOR_TYPES_BY_CARD_DIRECTION[CARD_DIRECTION_S]  = "s-resize";
    CURSOR_TYPES_BY_CARD_DIRECTION[CARD_DIRECTION_SW] = "sw-resize";
    CURSOR_TYPES_BY_CARD_DIRECTION[CARD_DIRECTION_W]  = "w-resize";
    CURSOR_TYPES_BY_CARD_DIRECTION[CARD_DIRECTION_NW] = "nw-resize";

    function fillImage(image, rasterImageId, x, y, extX, extY, sVideoUrl, sAudioUrl)
    {
        image.setSpPr(new AscFormat.CSpPr());
        image.spPr.setParent(image);
        image.spPr.setGeometry(AscFormat.CreateGeometry("rect"));
        image.spPr.setXfrm(new AscFormat.CXfrm());
        image.spPr.xfrm.setParent(image.spPr);
        image.spPr.xfrm.setOffX(x);
        image.spPr.xfrm.setOffY(y);
        image.spPr.xfrm.setExtX(extX);
        image.spPr.xfrm.setExtY(extY);

        var blip_fill = new AscFormat.CBlipFill();
        blip_fill.setRasterImageId(rasterImageId);
        blip_fill.setStretch(true);
        image.setBlipFill(blip_fill);
        image.setNvPicPr(new AscFormat.UniNvPr());


        var sMediaName = sVideoUrl || sAudioUrl;
        if(sMediaName)
        {
            var sExt = AscCommon.GetFileExtension(sMediaName);
            var oUniMedia = new AscFormat.UniMedia();
            oUniMedia.type = sVideoUrl ? 7 : 8;
            oUniMedia.media = "maskFile." + sExt;
            image.nvPicPr.nvPr.setUniMedia(oUniMedia);
        }
        image.setNoChangeAspect(true);
        image.setBDeleted(false);
    }

    function removeDPtsFromSeries(series)
    {
        if(Array.isArray(series.dPt))
        {
            for(var i = series.dPt.length - 1; i > -1; --i)
            {
                series.removeDPt(i);
            }
        }
    }

    function fApproxEqual(a, b, fDelta){
        if ( a === b ) {
            return true;
        }
        if(AscFormat.isRealNumber(fDelta)){
            return Math.abs( a - b ) < fDelta;
        }
        return Math.abs( a - b ) < 1e-15;
    }


	function fSolveQuadraticEquation(a, b, c){
		var oResult = {x1: null, x2: null, bError: true};
		var D = b*b - 4*a*c;
        if(D < 0){
            return oResult;
        }
		oResult.bError = false;
        oResult.x1 = (-b + Math.sqrt(D))/(2*a);
        oResult.x2 = (-b - Math.sqrt(D))/(2*a);
		return oResult;
	}

    function fCheckBoxIntersectionSegment(fX, fY, fWidth, fHeight, x1, y1, x2, y2){
        return fCheckSegementIntersection(fX, fY, fX + fWidth, fY, x1, y1, x2, y2) ||
            fCheckSegementIntersection(fX + fWidth, fY, fX + fWidth, fY + fHeight, x1, y1, x2, y2) ||
            fCheckSegementIntersection(fX + fWidth, fY + fHeight, fX, fY + fHeight, x1, y1, x2, y2) ||
            fCheckSegementIntersection(fX, fY + fHeight, fX, fY, x1, y1, x2, y2);

    }

    function fCheckSegementIntersection(x11, y11, x12, y12, x21, y21, x22, y22){
        //check bounding boxes intersection
        if(Math.max(x11, x12) < Math.min(x21, x22)){
            return false;
        }
        if(Math.min(x11, x12) > Math.max(x21, x22)){
            return false;
        }
        if(Math.max(y11, y12) < Math.min(y21, y22)){
            return false;
        }
        if(Math.min(y11, y12) > Math.max(y21, y22)){
            return false;
        }

        var oCoeffs = fResolve2LinearSystem(x12-x11, -(x22-x21), y12-y11, -(y22-y21), x21-x11, y21-y11);
        if(oCoeffs.bError){
            return false;
        }
        return (oCoeffs.x1 >= 0 && oCoeffs.x1 <= 1
            && oCoeffs.x2 >= 0 && oCoeffs.x2 <= 1);
    }


    function fResolve2LinearSystem(a11, a12, a21, a22, t1, t2){
        var oResult = {bError: true};
        var D = a11*a22 - a12*a21;
        if(fApproxEqual(D,  0)){
            return oResult;
        }
        oResult.bError = false;
        oResult.x1 = (t1*a22 - a12*t2)/D;
        oResult.x2 = (a11*t2 - t1*a21)/D;
        return oResult;
    }

    function checkParagraphDefFonts(map, par)
    {
        par && par.Pr && par.Pr.DefaultRunPr && checkRFonts(map, par.Pr.DefaultRunPr.RFonts);
    }
    function checkTxBodyDefFonts(map, txBody)
    {
        txBody && txBody.content && txBody.content.Content[0] && checkParagraphDefFonts(map, txBody.content.Content[0]);
    }

    function checkRFonts(map, rFonts)
    {
        if(rFonts)
        {
            if(rFonts.Ascii && typeof rFonts.Ascii.Name && rFonts.Ascii.Name.length > 0)
                map[rFonts.Ascii.Name] = true;
            if(rFonts.EastAsia && typeof rFonts.EastAsia.Name && rFonts.EastAsia.Name.length > 0)
                map[rFonts.EastAsia.Name] = true;
            if(rFonts.CS && typeof rFonts.CS.Name && rFonts.CS.Name.length > 0)
                map[rFonts.CS.Name] = true;
            if(rFonts.HAnsi && typeof rFonts.HAnsi.Name && rFonts.HAnsi.Name.length > 0)
                map[rFonts.HAnsi.Name] = true;
        }
    }

function CheckShapeBodyAutoFitReset(oShape, bNoResetRelSize)
{
    var oParaDrawing = AscFormat.getParaDrawing(oShape);
    if(oParaDrawing && !(bNoResetRelSize === true))
    {
        if(oParaDrawing.SizeRelH)
        {
            oParaDrawing.SetSizeRelH(undefined);
        }
        if(oParaDrawing.SizeRelV)
        {
            oParaDrawing.SetSizeRelV(undefined);
        }
    }
    if(oShape instanceof AscFormat.CShape)
    {
        var oPropsToSet = null;
        if(oShape.bWordShape)
        {
            if(!oShape.textBoxContent)
                return;
            if(oShape.bodyPr)
            {
                oPropsToSet = oShape.bodyPr.createDuplicate();
            }
            else
            {
                oPropsToSet = new AscFormat.CBodyPr();
            }
        }
        else
        {
            if(!oShape.txBody)
                return;
            if(oShape.txBody.bodyPr)
            {
                oPropsToSet = oShape.txBody.bodyPr.createDuplicate();
            }
            else
            {
                oPropsToSet = new AscFormat.CBodyPr();
            }
        }
        var oBodyPr = oShape.getBodyPr();
        if(oBodyPr.textFit && oBodyPr.textFit.type === AscFormat.text_fit_Auto)
        {
            if(!oPropsToSet.textFit)
            {
                oPropsToSet.textFit = new AscFormat.CTextFit();
            }
            oPropsToSet.textFit.type = AscFormat.text_fit_No;
        }
        if(oBodyPr.wrap === AscFormat.nTWTNone)
        {
            oPropsToSet.wrap = AscFormat.nTWTSquare;
        }
        if(oShape.bWordShape)
        {
           oShape.setBodyPr(oPropsToSet);
        }
        else
        {
            oShape.txBody.setBodyPr(oPropsToSet);
        }
    }
}

function CDistance(L, T, R, B)
{
    this.L = L;
    this.T = T;
    this.R = R;
    this.B = B;
}


function ConvertRelPositionHToRelSize(nRelPosition)
{
    switch(nRelPosition)
    {
        case c_oAscRelativeFromH.InsideMargin:
        {
            return c_oAscSizeRelFromH.sizerelfromhInsideMargin;
        }
        case c_oAscRelativeFromH.LeftMargin:
        {
            return c_oAscSizeRelFromH.sizerelfromhLeftMargin;
        }
        case c_oAscRelativeFromH.Margin:
        {
            return c_oAscSizeRelFromH.sizerelfromhMargin;
        }
        case c_oAscRelativeFromH.OutsideMargin:
        {
            return c_oAscSizeRelFromH.sizerelfromhOutsideMargin;
        }
        case c_oAscRelativeFromH.Page:
        {
            return c_oAscSizeRelFromH.sizerelfromhPage;
        }
        case c_oAscRelativeFromH.RightMargin:
        {
            return c_oAscSizeRelFromH.sizerelfromhRightMargin;
        }
        default:
        {
            return c_oAscSizeRelFromH.sizerelfromhPage;
        }
    }
}

function ConvertRelPositionVToRelSize(nRelPosition)
{
    switch(nRelPosition)
    {
        case c_oAscRelativeFromV.BottomMargin:
        {
            return c_oAscSizeRelFromV.sizerelfromvBottomMargin;
        }
        case c_oAscRelativeFromV.InsideMargin:
        {
            return c_oAscSizeRelFromV.sizerelfromvInsideMargin;
        }
        case c_oAscRelativeFromV.Margin:
        {
            return c_oAscSizeRelFromV.sizerelfromvMargin;
        }
        case c_oAscRelativeFromV.OutsideMargin:
        {
            return c_oAscSizeRelFromV.sizerelfromvOutsideMargin;
        }
        case c_oAscRelativeFromV.Page:
        {
            return c_oAscSizeRelFromV.sizerelfromvPage;
        }
        case c_oAscRelativeFromV.TopMargin:
        {
            return c_oAscSizeRelFromV.sizerelfromvTopMargin;
        }
        default:
        {
            return c_oAscSizeRelFromV.sizerelfromvMargin;
        }
    }
}

function ConvertRelSizeHToRelPosition(nRelSize)
{
    switch(nRelSize)
    {
        case c_oAscSizeRelFromH.sizerelfromhMargin:
        {
            return c_oAscRelativeFromH.Margin;
        }
        case c_oAscSizeRelFromH.sizerelfromhPage:
        {
            return c_oAscRelativeFromH.Page;
        }
        case c_oAscSizeRelFromH.sizerelfromhLeftMargin:
        {
            return c_oAscRelativeFromH.LeftMargin;
        }
        case c_oAscSizeRelFromH.sizerelfromhRightMargin:
        {
            return c_oAscRelativeFromH.RightMargin;
        }
        case c_oAscSizeRelFromH.sizerelfromhInsideMargin:
        {
            return c_oAscRelativeFromH.InsideMargin;
        }
        case c_oAscSizeRelFromH.sizerelfromhOutsideMargin:
        {
            return c_oAscRelativeFromH.OutsideMargin;
        }
        default:
        {
            return c_oAscRelativeFromH.Margin;
        }
    }
}


function ConvertRelSizeVToRelPosition(nRelSize)
{
    switch(nRelSize)
    {
        case c_oAscSizeRelFromV.sizerelfromvMargin:
        {
            return c_oAscRelativeFromV.Margin;
        }
        case c_oAscSizeRelFromV.sizerelfromvPage:
        {
            return c_oAscRelativeFromV.Page;
        }
        case c_oAscSizeRelFromV.sizerelfromvTopMargin:
        {
            return c_oAscRelativeFromV.TopMargin;
        }
        case c_oAscSizeRelFromV.sizerelfromvBottomMargin:
        {
            return c_oAscRelativeFromV.BottomMargin;
        }
        case c_oAscSizeRelFromV.sizerelfromvInsideMargin:
        {
            return c_oAscRelativeFromV.InsideMargin;
        }
        case c_oAscSizeRelFromV.sizerelfromvOutsideMargin:
        {
            return c_oAscRelativeFromV.OutsideMargin;
        }
        default:
        {
            return c_oAscRelativeFromV.Margin;
        }
    }
}

function checkObjectInArray(aObjects, oObject)
{
    var i;
    for(i = 0; i < aObjects.length; ++i)
    {
        if(aObjects[i] === oObject)
        {
            return;
        }
    }
    aObjects.push(oObject);
}
function getValOrDefault(val, defaultVal)
{

    if(val !== null && val !== undefined)
    {
        if(val > 558.7)
            return 0;
        return val;
    }
    return defaultVal;
}

function checkInternalSelection(selection)
{
    return !!(selection.groupSelection || selection.chartSelection || selection.textSelection);
}


function CheckStockChart(oDrawingObjects, oApi)
{
    var selectedObjectsByType = oDrawingObjects.getSelectedObjectsByTypes();
    if(selectedObjectsByType.charts[0])
    {
        var chartSpace = selectedObjectsByType.charts[0];
        if(chartSpace && chartSpace.chart && chartSpace.chart.plotArea && chartSpace.chart.plotArea.charts[0] && chartSpace.chart.plotArea.charts[0].getObjectType() !== AscDFH.historyitem_type_StockChart)
        {
            if(chartSpace.chart.plotArea.charts[0].series.length !== 4)
            {
                oApi.sendEvent("asc_onError", c_oAscError.ID.StockChartError, c_oAscError.Level.NoCritical);
                oApi.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
                return false;
            }
        }
    }
    return true;
}

function CheckLinePreset(preset)
{
    return CheckLinePresetForParagraphAdd(preset);
}

function CheckLinePresetForParagraphAdd(preset)
{
    return preset === "line" ||
    preset === "bentConnector2" ||
    preset === "bentConnector3" ||
    preset === "bentConnector4" ||
    preset === "bentConnector5" ||
    preset === "curvedConnector2" ||
    preset === "curvedConnector3" ||
    preset === "curvedConnector4" ||
    preset === "curvedConnector5" ||
    preset === "straightConnector1";

}

function CompareGroups(a, b)
{
    if(a.group == null && b.group == null)
        return 0;
    if(a.group == null)
        return 1;
    if(b.group == null)
        return -1;

    var count1 = 0;
    var cur_group = a.group;
    while(cur_group != null)
    {
        ++count1;
        cur_group = cur_group.group;
    }
    var count2 = 0;
    cur_group = b.group;
    while(cur_group != null)
    {
        ++count2;
        cur_group = cur_group.group;
    }
    return count1 - count2;
}

function CheckSpPrXfrm(object, bNoResetAutofit)
{
    if(!object.spPr)
    {
        object.setSpPr(new AscFormat.CSpPr());
        object.spPr.setParent(object);
    }
    if(!object.spPr.xfrm)
    {
        object.spPr.setXfrm(new AscFormat.CXfrm());
        object.spPr.xfrm.setParent(object.spPr);
        if(object.parent && object.parent.GraphicObj === object)
        {
            object.spPr.xfrm.setOffX(0);
            object.spPr.xfrm.setOffY(0);
        }
        else
        {
            object.spPr.xfrm.setOffX(object.x);
            object.spPr.xfrm.setOffY(object.y);
        }
        object.spPr.xfrm.setExtX(object.extX);
        object.spPr.xfrm.setExtY(object.extY);
        if(bNoResetAutofit !== true)
        {
            CheckShapeBodyAutoFitReset(object);
        }
    }
}


function CheckSpPrXfrm2(object)
{
    if(!object)
        return;
    if(!object.spPr)
    {
        object.spPr = new AscFormat.CSpPr();
        object.spPr.parent = object;
    }
    if(!object.spPr.xfrm)
    {
        object.spPr.xfrm = new AscFormat.CXfrm();
        object.spPr.xfrm.parent = object.spPr;
        object.spPr.xfrm.offX = 0;//object.x;
        object.spPr.xfrm.offY = 0;//object.y;
        object.spPr.xfrm.extX = object.extX;
        object.spPr.xfrm.extY = object.extY;
    }

}
    function CheckSpPrXfrm3(object)
    {
        if(object.recalcInfo && object.recalcInfo.recalculateTransform){
            if(!object.spPr)
            {
                object.setSpPr(new AscFormat.CSpPr());
                object.spPr.setParent(object);
            }
            if(!object.spPr.xfrm)
            {
                object.spPr.setXfrm(new AscFormat.CXfrm());
                object.spPr.xfrm.setParent(object.spPr);
                if(object.parent && object.parent.GraphicObj === object)
                {
                    object.spPr.xfrm.setOffX(0);
                    object.spPr.xfrm.setOffY(0);
                }
                else
                {
                    object.spPr.xfrm.setOffX(AscFormat.isRealNumber(object.x) ? object.x : 0);
                    object.spPr.xfrm.setOffY(AscFormat.isRealNumber(object.y) ? object.x : 0);
                }
                object.spPr.xfrm.setExtX(AscFormat.isRealNumber(object.extX) ? object.extX : 0);
                object.spPr.xfrm.setExtY(AscFormat.isRealNumber(object.extY) ? object.extY : 0);
            }
            return;
        }
        if(!object.spPr)
        {
            object.setSpPr(new AscFormat.CSpPr());
            object.spPr.setParent(object);
        }
        if(!object.spPr.xfrm) {
            object.spPr.setXfrm(new AscFormat.CXfrm());
            object.spPr.xfrm.setParent(object.spPr);
        }
        var oXfrm = object.spPr.xfrm;
        var _x = object.x;
        var _y = object.y;
        if(object.parent && object.parent.GraphicObj === object)
        {
             _x = 0.0;
             _y = 0.0;
        }
        if(oXfrm.offX === null || !AscFormat.fApproxEqual(_x, oXfrm.offX, 0.01)) {
            object.spPr.xfrm.setOffX(_x);
        }
        if(oXfrm.offY === null || !AscFormat.fApproxEqual(_y, oXfrm.offY, 0.01)) {
            object.spPr.xfrm.setOffY(_y);
        }
        if(oXfrm.extX === null || !AscFormat.fApproxEqual(object.extX, oXfrm.extX, 0.01)) {
            object.spPr.xfrm.setExtX(object.extX);
        }
        if(oXfrm.extY === null || !AscFormat.fApproxEqual(object.extY, oXfrm.extY, 0.01)) {
            object.spPr.xfrm.setExtY(object.extY);
        }
    }

function getObjectsByTypesFromArr(arr, bGrouped)
{
    var ret = {shapes: [], images: [], groups: [], charts: [], tables: [], oleObjects: []};
    var selected_objects = arr;
    for(var i = 0;  i < selected_objects.length; ++i)
    {
        var drawing = selected_objects[i];
        var type = drawing.getObjectType();
        switch(type)
        {
            case AscDFH.historyitem_type_Shape:
            case AscDFH.historyitem_type_Cnx:
            {
                ret.shapes.push(drawing);
                break;
            }
            case AscDFH.historyitem_type_ImageShape:
            {
                ret.images.push(drawing);
                break;
            }
            case AscDFH.historyitem_type_OleObject:
            {
                ret.oleObjects.push(drawing);
                break;
            }
            case AscDFH.historyitem_type_GroupShape:
            {
                ret.groups.push(drawing);
                if(bGrouped)
                {
                    var by_types = getObjectsByTypesFromArr(drawing.spTree, true);
                    ret.shapes = ret.shapes.concat(by_types.shapes);
                    ret.images = ret.images.concat(by_types.images);
                    ret.charts = ret.charts.concat(by_types.charts);
                    ret.tables = ret.tables.concat(by_types.tables);
                    ret.oleObjects = ret.oleObjects.concat(by_types.oleObjects);
                }
                break;
            }
            case AscDFH.historyitem_type_ChartSpace:
            {
                ret.charts.push(drawing);
                break;
            }
            case AscDFH.historyitem_type_GraphicFrame:
            {
                ret.tables.push(drawing);
                break;
            }
        }
    }
    return ret;
}

function CreateBlipFillUniFillFromUrl(url)
{
    var ret = new AscFormat.CUniFill();
    ret.setFill(CreateBlipFillRasterImageId(url));
    return ret;
}

function CreateBlipFillRasterImageId(url)
{
    var oBlipFill = new AscFormat.CBlipFill();
    oBlipFill.setRasterImageId(url);
    return oBlipFill;
}

function getTargetTextObject(controller)
{
    if(controller.selection.textSelection)
    {
        return  controller.selection.textSelection;
    }
    else if(controller.selection.groupSelection )
    {
        if(controller.selection.groupSelection.selection.textSelection)
        {
            return controller.selection.groupSelection.selection.textSelection;
        }
        else if(controller.selection.groupSelection.selection.chartSelection && controller.selection.groupSelection.selection.chartSelection.selection.textSelection)
        {
            return controller.selection.groupSelection.selection.chartSelection.selection.textSelection;
        }
    }
    else if(controller.selection.chartSelection && controller.selection.chartSelection.selection.textSelection)
    {
        return controller.selection.chartSelection.selection.textSelection;
    }
    return null;
}


function isConnectorPreset(sPreset){
        if(typeof sPreset === "string" && sPreset.length > 0){
            if(sPreset === "flowChartOffpageConnector" || sPreset === "flowChartConnector"){
                return false;
            }
            return (sPreset.toLowerCase().indexOf("line") > -1 || sPreset.toLowerCase().indexOf("connector") > -1);
        }
        return false;
}

function DrawingObjectsController(drawingObjects)
{
    this.drawingObjects = drawingObjects;

    this.curState = new AscFormat.NullState(this);

    this.selectedObjects = [];
    this.drawingDocument = drawingObjects.drawingDocument;
    this.selection =
    {
        selectedObjects: [],
        groupSelection: null,
        chartSelection: null,
        textSelection: null
    };
    this.arrPreTrackObjects = [];
    this.arrTrackObjects = [];

    this.objectsForRecalculate = {};

    this.chartForProps = null;

    this.handleEventMode = HANDLE_EVENT_MODE_HANDLE;
}

function CanStartEditText(oController)
{
    var oSelector = oController.selection.groupSelection ? oController.selection.groupSelection : oController;
    if(oSelector.selectedObjects.length === 1 && oSelector.selectedObjects[0].getObjectType() === AscDFH.historyitem_type_Shape)
    {
        return true;
    }
    return false;
}

DrawingObjectsController.prototype =
{

    checkDrawingHyperlink: function(drawing, e, hit_in_text_rect, x, y, pageIndex){
        var oApi = this.getEditorApi();
        if(!oApi){
            return;
        }


        //
        // if( this.document || (this.drawingObjects.cSld && !(this.noNeedUpdateCursorType === true)) )
        // {
        //     var nPageIndex = pageIndex;
        //     if(this.drawingObjects.cSld && !( this.noNeedUpdateCursorType === true ) && AscFormat.isRealNumber(this.drawingObjects.num))
        //     {
        //         nPageIndex = this.drawingObjects.num;
        //     }
        //     content.UpdateCursorType(tx, ty, 0);
        //     ret.updated = true;
        // }
        // else if(this.drawingObjects)
        // {
        //     hit_paragraph = content.Internal_GetContentPosByXY(tx, ty, 0);
        //     par = content.Content[hit_paragraph];
        //     if(isRealObject(par))
        //     {
        //         check_hyperlink = par.CheckHyperlink(tx, ty, 0);
        //         if(isRealObject(check_hyperlink))
        //         {
        //             ret.hyperlink = check_hyperlink;
        //         }
        //     }
        // }


        var oNvPr;
        if(this.document || this.drawingObjects && this.drawingObjects.cSld){
            if(/*e.CtrlKey*/true){
                oNvPr = drawing.getCNvProps();
                if(oNvPr && oNvPr.hlinkClick && oNvPr.hlinkClick.id !== null){
                    if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE){
                        if(e.CtrlKey || this.isSlideShow()){
                            editor.sync_HyperlinkClickCallback(oNvPr.hlinkClick.id);
                            return true;
                        }
                    }
                    else{
                        var ret = {objectId: drawing.Get_Id(), cursorType: "move", bMarker: false};
                        if( !(this.noNeedUpdateCursorType === true))
                        {
                            var oDD = editor &&  editor.WordControl && editor.WordControl.m_oDrawingDocument;
                            if(oDD){
                                var MMData         = new AscCommon.CMouseMoveData();
                                var Coords         = oDD.ConvertCoordsToCursorWR(x, y, pageIndex, null);
                                MMData.X_abs       = Coords.X;
                                MMData.Y_abs       = Coords.Y;
                                MMData.Type      = AscCommon.c_oAscMouseMoveDataTypes.Hyperlink;
                                MMData.Hyperlink = new Asc.CHyperlinkProperty({Text: null, Value: oNvPr.hlinkClick.id, ToolTip: oNvPr.hlinkClick.tooltip, Class: null});
                                if(this.isSlideShow())
                                {
                                    ret.cursorType = "pointer";
                                    MMData.Hyperlink = null;
                                    oDD.SetCursorType("pointer", MMData);
                                }
                                else
                                {
                                    editor.sync_MouseMoveCallback(MMData);
                                    if(hit_in_text_rect)
                                    {
                                        ret.cursorType = "text";
                                        oDD.SetCursorType("text", MMData);
                                    }
                                }

                                ret.updated = true;
                            }
                        }
                        return ret;
                    }
                }
            }
        }
        else if(this.drawingObjects && this.drawingObjects.getWorksheetModel){
            oNvPr = drawing.getCNvProps();
            if(oNvPr && oNvPr.hlinkClick && oNvPr.hlinkClick.id !== null){

                if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE) {
                    if(e.CtrlKey || this.isSlideShow()){
                        // var wsModel = this.drawingObjects.getWorksheetModel();
                        //
                        // var _link = oNvPr.hlinkClick.id;
                        // var newHyperlink = new AscCommonExcel.Hyperlink();
                        // if (_link.search('#') === 0) {
                        //     var sLink2 = _link.replace('#', '');
                        //     newHyperlink.setLocation(sLink2);
                        //     var aRanges = AscCommonExcel.getRangeByRef(sLink2, wsModel);
                        //     newHyperlink.Ref = aRanges[0];
                        // }
                        // else {
                        //     newHyperlink.Hyperlink = _link;
                        // }
                        // newHyperlink.Tooltip = oNvPr.hlinkClick.tooltip;
                        // var ascHyperlink = new Asc.asc_CHyperlink();
                        // ascHyperlink.hyperlinkModel = newHyperlink;
                        // oApi._asc_setWorksheetRange(ascHyperlink);
                        //newHyperlink.Ref.setHyperlink(newHyperlink);
                        // return AscCommonExcel.getRangeByRef(sFormula, this.worksheet);
                        // editor.sync_HyperlinkClickCallback(oNvPr.hlinkClick.id);
                        return true;
                    }
                    else{
                        return false;
                    }
                }
                else{

                    var _link = oNvPr.hlinkClick.id;
                    var sLink2;
                    if (_link.search('#') === 0) {
                        sLink2 = _link.replace('#', '');
                    }
                    else {
                        sLink2 = _link;
                    }
                    var oHyperlink = AscFormat.ExecuteNoHistory(function(){return new ParaHyperlink();}, this, []);
                    oHyperlink.Value = sLink2;
                    oHyperlink.Tooltip = oNvPr.hlinkClick.tooltip;
                    if(hit_in_text_rect){
                        return {objectId: drawing.Get_Id(), cursorType: "text", bMarker: false, hyperlink: oHyperlink};
                    }
                    else{
                        return {objectId: drawing.Get_Id(), cursorType: "move", bMarker: false, hyperlink: oHyperlink};
                    }
                }
            }
        }
        if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE) {
            return false;
        }
        else{
            return null;
        }
    },

    showVideoControl: function(sMediaFile, extX, extY, transform)
    {
        this.bShowVideoControl = true;
        var oApi = this.getEditorApi();
        oApi.showVideoControl(sMediaFile, extX, extY, transform);
    },


    getAllSignatures: function(){
        var _ret = [];
        this.getAllSignatures2(_ret, this.getDrawingArray());
        return _ret;
    },

    getAllSignatures2: function(aRet, spTree){
        var aSp = [];
        for(var i = 0; i < spTree.length; ++i){
            if(spTree[i].getObjectType() === AscDFH.historyitem_type_GroupShape){
                aSp = aSp.concat(this.getAllSignatures2(aRet, spTree[i].spTree));
            }
            else if(spTree[i].signatureLine){
                aRet.push(spTree[i].signatureLine);
                aSp.push(spTree[i]);
            }
        }
        return aSp;
    },

    getDefaultText: function(){
        return  AscCommon.translateManager.getValue('Your text here');
    },

    getAllConnectors: function(aDrawings, allDrawings){
        var _ret = allDrawings;
        if(!_ret){
            _ret = [];
        }
        for(var i = 0; i < aDrawings.length; ++i){
            if(aDrawings[i].getObjectType() === AscDFH.historyitem_type_Cnx){
                _ret.push(aDrawings[i]);
            }
            else if(aDrawings[i].getObjectType() === AscDFH.historyitem_type_GroupShape){
                aDrawings[i].getAllConnectors(aDrawings[i].spTree, _ret);
            }
        }
        return _ret;
    },

    getAllShapes:  function(aDrawings, allDrawings){
        var _ret = allDrawings;
        if(!_ret){
            _ret = [];
        }
        for(var i = 0; i < aDrawings.length; ++i){
            if(aDrawings[i].getObjectType() === AscDFH.historyitem_type_Shape){
                _ret.push(aDrawings[i]);
            }
            else if(aDrawings[i].getObjectType() === AscDFH.historyitem_type_GroupShape){
                aDrawings[i].getAllShapes(aDrawings[i].spTree, _ret);
            }
        }
        return _ret;
    },

    getAllConnectorsByDrawings: function(aDrawings, result,  aConnectors, bInsideGroup){
        var _ret;
        if(Array.isArray(result)){
            _ret = result;
        }
        else{
            _ret = [];
        }
        var _aConnectors;
        if(Array.isArray(aConnectors)){
            _aConnectors = aConnectors;
        }
        else{
            _aConnectors = this.getAllConnectors(this.getDrawingArray(), []);
        }
        for(var i = 0; i < _aConnectors.length; ++i){
            for(var j = 0; j < aDrawings.length; ++j){
                if(aDrawings[j].getObjectType() === AscDFH.historyitem_type_GroupShape){
                    if(bInsideGroup){
                        this.getAllConnectorsByDrawings(aDrawings[j].spTree, _ret, _aConnectors, bInsideGroup);
                    }
                }
                else{
                    if(aDrawings[j].Get_Id() === _aConnectors[i].getStCxnId() || aDrawings[j].Get_Id() === _aConnectors[i].getEndCxnId()){
                        _ret.push(_aConnectors[i]);
                    }
                }
            }
        }
        return _ret;
    },

    getAllSingularDrawings: function(aDrawings, _ret){
        for(var i = 0; i < aDrawings.length; ++i){
            if(aDrawings[i].getObjectType() === AscDFH.historyitem_type_GroupShape){
                this.getAllSingularDrawings(aDrawings[i].spTree, _ret);
            }
            else{
                _ret.push(aDrawings[i]);
            }
        }
    },

    checkConnectorsPreTrack: function(){

        if(this.arrPreTrackObjects.length > 0 && this.arrPreTrackObjects[0].originalObject && this.arrPreTrackObjects[0].overlayObject){

            var aAllConnectors = this.getAllConnectors(this.getDrawingArray());
            var oPreTrack;
            var stId = null, endId = null, oBeginTrack = null, oEndTrack = null, oBeginShape = null, oEndShape = null;
            var aConnectionPreTracks = [];
            for(var i = 0; i < aAllConnectors.length; ++i){
                stId = aAllConnectors[i].getStCxnId();
                endId = aAllConnectors[i].getEndCxnId();
                oBeginTrack = null;
                oEndTrack = null;
                oBeginShape = null;
                oEndShape = null;

                if(stId !== null || endId !== null){
                    for(var j = 0; j < this.arrPreTrackObjects.length; ++j){
                        if(this.arrPreTrackObjects[j].originalObject === aAllConnectors[i]){
                            oEndTrack = null;
                            oBeginTrack = null;
                            break;
                        }
                        oPreTrack = this.arrPreTrackObjects[j].originalObject;
                        if(oPreTrack.Id === stId){
                            oBeginTrack = this.arrPreTrackObjects[j];
                        }
                        if(oPreTrack.Id === endId){
                            oEndTrack = this.arrPreTrackObjects[j];
                        }
                    }
                }
                if(oBeginTrack || oEndTrack){

                    if(oBeginTrack){
                        oBeginShape = oBeginTrack.originalObject;
                    }
                    else{
                        if(stId !== null){
                            oBeginShape = AscCommon.g_oTableId.Get_ById(stId);
                            if(oBeginShape && oBeginShape.bDeleted){
                                oBeginShape = null;
                            }
                        }
                    }
                    if(oEndTrack){
                        oEndShape = oEndTrack.originalObject;
                    }
                    else if(endId !== null){
                        oEndShape = AscCommon.g_oTableId.Get_ById(endId);
                        if(oEndShape && oEndShape.bDeleted){
                            oEndShape = null;
                        }
                    }
                    aConnectionPreTracks.push(new AscFormat.CConnectorTrack(aAllConnectors[i], oBeginTrack, oEndTrack, oBeginShape, oEndShape));
                }
            }
            for(i = 0; i < aConnectionPreTracks.length; ++i){
                this.arrPreTrackObjects.push(aConnectionPreTracks[i]);
            }
        }
    },

    //for mobile spreadsheet editor
    startEditTextCurrentShape: function()
    {
        if(!CanStartEditText(this))
        {
            return;
        }
        var oSelector = this.selection.groupSelection ? this.selection.groupSelection : this;
        var oShape = oSelector.selectedObjects[0];
        var oContent = oShape.getDocContent();
        if(oContent)
        {
            oSelector.resetInternalSelection();
            oSelector.selection.textSelection = oShape;
            oContent.MoveCursorToEndPos(false);
            this.updateSelectionState();
            this.updateOverlay();
            if(this.document){
                oContent.Set_CurrentElement(0, true);
            }
        }
        else
        {
            var oThis = this;
            this.checkSelectedObjectsAndCallback(function(){
                if(!oShape.bWordShape){
                    oShape.createTextBody();
                }
                else{
                    oShape.createTextBoxContent();
                }
                var oContent = oShape.getDocContent();
                oSelector.resetInternalSelection();
                oSelector.selection.textSelection = oShape;
                oContent.MoveCursorToEndPos(false);
                oThis.updateSelectionState();
                if(this.document){
                    oContent.Set_CurrentElement(0, true);
                }
            }, [], false, AscDFH.historydescription_Spreadsheet_AddNewParagraph);
        }
    },

    getObjectForCrop: function()
    {
        var selectedObjects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects;
        if(selectedObjects.length === 1)
        {
            var oBlipFill = selectedObjects[0].getBlipFill();
            if(oBlipFill)
            {
                return selectedObjects[0];
            }
        }
        return null;
    },

    sendCropState: function(){
        var oApi = this.getEditorApi();
        if(!oApi){
            return;
        }
        var isCrop = AscCommon.isRealObject(this.selection.cropSelection);
        oApi.sendEvent("asc_ChangeCropState", isCrop);
    },

    canStartImageCrop: function()
    {
        return (this.getObjectForCrop() !== null);
    },

    startImageCrop: function()
    {
        var cropObject = this.getObjectForCrop();
        if(!cropObject)
        {
            return;
        }


        this.checkSelectedObjectsAndCallback(function () {
            cropObject.checkSrcRect();
            if(cropObject.createCropObject())
            {
                this.selection.cropSelection = cropObject;
                this.sendCropState();
                this.updateOverlay();
            }
        },[], false);
    },

    endImageCrop: function(bDoNotRedraw)
    {
        if(this.selection.cropSelection)
        {
            this.selection.cropSelection.clearCropObject();
            this.selection.cropSelection = null;
            this.sendCropState();
            if(bDoNotRedraw !== true)
            {
                this.updateOverlay();
                if(this.drawingObjects && this.drawingObjects.showDrawingObjects)
                {
                    this.drawingObjects.showDrawingObjects(true);
                }
            }
        }
    },

    cropFit: function(){
        var cropObject = this.getObjectForCrop();
        if(!cropObject)
        {
            return;
        }
        this.checkSelectedObjectsAndCallback(function () {
            cropObject.checkSrcRect();
            if(cropObject.createCropObject())
            {
                var oImgP = new Asc.asc_CImgProperty();
                oImgP.ImageUrl = cropObject.getBlipFill().RasterImageId;
                var oSize = oImgP.asc_getOriginSize(this.getEditorApi());


                var oShapeDrawer = new AscCommon.CShapeDrawer();
                oShapeDrawer.bIsCheckBounds = true;
                oShapeDrawer.Graphics = new AscFormat.CSlideBoundsChecker();
                cropObject.check_bounds(oShapeDrawer);
                var bounds_w = oShapeDrawer.max_x - oShapeDrawer.min_x;
                var bounds_h = oShapeDrawer.max_y - oShapeDrawer.min_y;
                var dScale = bounds_w/oSize.Width;
                var dTestHeight = oSize.Height*dScale;
                var srcRect = new AscFormat.CSrcRect();
                if(dTestHeight <= bounds_h)
                {
                    srcRect.l = 0;
                    srcRect.r = 100;
                    srcRect.t = -100*(bounds_h - dTestHeight)/2.0/dTestHeight;
                    srcRect.b = 100 - srcRect.t;
                }
                else
                {
                    srcRect.t = 0;
                    srcRect.b = 100;
                    dScale = bounds_h/oSize.Height;
                    var dTestWidth = oSize.Width*dScale;
                    srcRect.l = -100*(bounds_w - dTestWidth)/2.0/dTestWidth;
                    srcRect.r = 100 - srcRect.l;
                }
                cropObject.setSrcRect(srcRect);
                this.selection.cropSelection = cropObject;
                this.sendCropState();
                if(this.drawingObjects && this.drawingObjects.showDrawingObjects)
                {
                    this.drawingObjects.showDrawingObjects();
                }
                this.updateOverlay();
            }
        },[], false);
    },

    cropFill: function(){
        var cropObject = this.getObjectForCrop();
        if(!cropObject)
        {
            return;
        }
        this.checkSelectedObjectsAndCallback(function () {
            cropObject.checkSrcRect();
            if(cropObject.createCropObject())
            {
                var oImgP = new Asc.asc_CImgProperty();
                oImgP.ImageUrl = cropObject.getBlipFill().RasterImageId;
                var oSize = oImgP.asc_getOriginSize(this.getEditorApi());
                var oShapeDrawer = new AscCommon.CShapeDrawer();
                oShapeDrawer.bIsCheckBounds = true;
                oShapeDrawer.Graphics = new AscFormat.CSlideBoundsChecker();
                cropObject.check_bounds(oShapeDrawer);
                var bounds_w = oShapeDrawer.max_x - oShapeDrawer.min_x;
                var bounds_h = oShapeDrawer.max_y - oShapeDrawer.min_y;
                var dScale = bounds_w/oSize.Width;
                var dTestHeight = oSize.Height*dScale;
                var srcRect = new AscFormat.CSrcRect();
                if(dTestHeight >= bounds_h)
                {
                    srcRect.l = 0;
                    srcRect.r = 100;
                    srcRect.t = -100*(bounds_h - dTestHeight)/2.0/dTestHeight;
                    srcRect.b = 100 - srcRect.t;
                }
                else
                {
                    srcRect.t = 0;
                    srcRect.b = 100;
                    dScale = bounds_h/oSize.Height;
                    var dTestWidth = oSize.Width*dScale;
                    srcRect.l = -100*(bounds_w - dTestWidth)/2.0/dTestWidth;
                    srcRect.r = 100 - srcRect.l;
                }
                cropObject.setSrcRect(srcRect);
                this.selection.cropSelection = cropObject;
                this.sendCropState();
                if(this.drawingObjects && this.drawingObjects.showDrawingObjects)
                {
                    this.drawingObjects.showDrawingObjects();
                }
                this.updateOverlay();
            }
        },[], false);
    },

    setCropAspect: function(dAspect){
        //dAscpect = widh/height
        var cropObject = this.getObjectForCrop();
        if(!cropObject)
        {
            return;
        }
        this.checkSelectedObjectsAndCallback(function () {
            cropObject.checkSrcRect();
            if(cropObject.createCropObject())
            {
                this.selection.cropSelection = cropObject;
                this.sendCropState();
                var newW, newH;
                if(dAspect*cropObject.extX <= cropObject.extY)
                {
                    newW = cropObject.extX;
                    newH = cropObject.extY*dAspect;
                }
                else
                {

                    newW = cropObject.extX/dAspect;
                    newH = cropObject.extY;
                }

                if(this.drawingObjects && this.drawingObjects.showDrawingObjects)
                {
                    this.drawingObjects.showDrawingObjects();
                }
                this.updateOverlay();
            }
        },[], false);
    },

    canReceiveKeyPress: function()
    {
        return this.curState instanceof AscFormat.NullState;
    },

    handleAdjustmentHit: function(hit, selectedObject, group, pageIndex, bWord)
    {
        if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
        {
            this.arrPreTrackObjects.length = 0;
            if(hit.adjPolarFlag === false)
            {
                this.arrPreTrackObjects.push(new AscFormat.XYAdjustmentTrack(selectedObject, hit.adjNum, hit.warp));
            }
            else
            {
                this.arrPreTrackObjects.push(new AscFormat.PolarAdjustmentTrack(selectedObject, hit.adjNum, hit.warp));
            }
            if(!isRealObject(group))
            {

                this.resetInternalSelection();
                this.changeCurrentState(new AscFormat.PreChangeAdjState(this, selectedObject));
            }
            else
            {
                group.resetInternalSelection();
                this.changeCurrentState(new AscFormat.PreChangeAdjInGroupState(this, group));
            }
            return true;
        }
        else
        {
            if(!isRealObject(group))
                return {objectId: selectedObject.Get_Id(), cursorType: "crosshair", bMarker: true};
            else
                return {objectId: selectedObject.Get_Id(), cursorType: "crosshair", bMarker: true};
        }
    },

    handleSlideComments: function(e, x, y, pageIndex)
    {
        if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
        {
            return {result: null, selectedIndex: -1};
        }
        else
        {
            return {result: false, selectedIndex: -1};
        }
    },

    handleSignatureDblClick: function(sGuid, width, height){
        var oApi = editor || Asc['editor'];
        if(oApi){
            oApi.sendEvent("asc_onSignatureDblClick", sGuid, width, height);
        }
    },

    checkChartForProps: function(bStart)
    {
        if(bStart)
        {
            if(this.selectedObjects.length === 0){
                this.chartForProps = null;
                return;
            }
            this.chartForProps = this.getSelectionState();
            this.resetSelection();
            this.drawingObjects.getWorksheet().endEditChart();
            var oldIsStartAdd = window["Asc"]["editor"].isStartAddShape;
            window["Asc"]["editor"].isStartAddShape = true;
            this.updateOverlay();
            window["Asc"]["editor"].isStartAddShape = oldIsStartAdd;
        }
        else
        {
            if(this.chartForProps === null){
                return;
            }
            this.setSelectionState(this.chartForProps, this.chartForProps.length - 1);
            this.updateOverlay();
            this.drawingObjects.getWorksheet().setSelectionShape(true);
            this.chartForProps = null;
        }

    },

    resetInternalSelection: function(noResetContentSelect, bDoNotRedraw)
    {
        var oApi = this.getEditorApi && this.getEditorApi();
        if(oApi && oApi.hideVideoControl)
        {
            oApi.hideVideoControl();
        }
        if(this.selection.groupSelection)
        {
            this.selection.groupSelection.resetSelection(this);
            this.selection.groupSelection = null;
        }
        if(this.selection.textSelection)
        {
            if(!(noResetContentSelect  === true))
            {
                if(this.selection.textSelection.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
                {
                    if(this.selection.textSelection.graphicObject)
                    {
                        this.selection.textSelection.graphicObject.RemoveSelection();
                    }
                }
                else
                {
                    var content = this.selection.textSelection.getDocContent();
                    content && content.RemoveSelection();
                }
            }
            this.selection.textSelection = null;
        }
        if(this.selection.chartSelection)
        {
            this.selection.chartSelection.resetSelection(noResetContentSelect);
            this.selection.chartSelection = null;
        }
        if(this.selection.wrapPolygonSelection)
        {
            this.selection.wrapPolygonSelection = null;
        }
        if(this.selection.cropSelection)
        {
            this.endImageCrop && this.endImageCrop(bDoNotRedraw);
        }
    },

    handleHandleHit: function(hit, selectedObject, group, pageIndex, bWord)
    {
        if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
        {
            var selected_objects = group ? group.selectedObjects : this.selectedObjects;
            this.arrPreTrackObjects.length = 0;
            if(hit === 8)
            {
                if(selectedObject.canRotate())
                {
                    for(var i = 0; i < selected_objects.length; ++i)
                    {
                        if(selected_objects[i].canRotate())
                        {
                            this.arrPreTrackObjects.push(selected_objects[i].createRotateTrack());
                        }
                    }
                    if(!isRealObject(group))
                    {
                        this.resetInternalSelection();
                        this.updateOverlay();
                        this.changeCurrentState(new AscFormat.PreRotateState(this, selectedObject));
                    }
                    else
                    {
                        group.resetInternalSelection();
                        this.updateOverlay();
                        this.changeCurrentState(new AscFormat.PreRotateInGroupState(this, group, selectedObject));
                    }
                }
            }
            else
            {
                if(selectedObject.canResize())
                {
                    var card_direction = selectedObject.getCardDirectionByNum(hit);
                    for(var j = 0; j < selected_objects.length; ++j)
                    {
                        if(selected_objects[j].canResize())
                            this.arrPreTrackObjects.push(selected_objects[j].createResizeTrack(card_direction, selected_objects.length === 1 ? this : null));
                    }
                    if(!isRealObject(group))
                    {
                        if(!selectedObject.isCrop && !selectedObject.cropObject)
                        {
                            this.resetInternalSelection();
                        }
                        this.updateOverlay();

                        this.changeCurrentState(new AscFormat.PreResizeState(this, selectedObject, card_direction));
                    }
                    else
                    {

                        if(!selectedObject.isCrop && !selectedObject.cropObject)
                        {
                            group.resetInternalSelection();
                        }
                        this.updateOverlay();

                        this.changeCurrentState(new AscFormat.PreResizeInGroupState(this, group, selectedObject, card_direction));
                    }
                }
            }
            return true;
        }
        else
        {
            var sId = selectedObject.Get_Id();
            if(selectedObject.isCrop && selectedObject.parentCrop)
            {
                sId = selectedObject.parentCrop.Get_Id();
            }
            var card_direction = selectedObject.getCardDirectionByNum(hit);
            return {objectId: sId, cursorType: hit === 8 ? "crosshair" : CURSOR_TYPES_BY_CARD_DIRECTION[card_direction], bMarker: true};
        }
    },


    handleDblClickEmptyShape: function(oShape){
        this.checkSelectedObjectsAndCallback(function () {
            if(!oShape.getDocContent() && !CheckLinePresetForParagraphAdd(oShape.getPresetGeom())){
                if(!oShape.bWordShape){
                    oShape.createTextBody();
                }
                else{
                    oShape.createTextBoxContent();
                }
                this.recalculate();
                var oContent = oShape.getDocContent();
                oContent.Set_CurrentElement(0, true);
                this.updateSelectionState();
            }
        },[], false);
    },

    handleMoveHit: function(object, e, x, y, group, bInSelect, pageIndex, bWord)
    {
        var b_is_inline;
        if(isRealObject(group))
        {
            b_is_inline = group.parent && group.parent.Is_Inline && group.parent.Is_Inline();
        }
        else
        {
            b_is_inline = object.parent && object.parent.Is_Inline && object.parent.Is_Inline();
        }
        if(this.selection.cropSelection)
        {
            if(this.selection.cropSelection === object || this.selection.cropSelection.cropObject === object)
            {
                b_is_inline = false;
            }
        }
        var b_is_selected_inline = this.selectedObjects.length === 1 && (this.selectedObjects[0].parent && this.selectedObjects[0].parent.Is_Inline && this.selectedObjects[0].parent.Is_Inline());
        if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
        {
            var selector = group ? group : this;
            this.checkChartTextSelection();
            if(object.canMove())
            {
                this.arrPreTrackObjects.length = 0;
                var is_selected =  object.selected;
                var b_check_internal = checkInternalSelection(selector.selection);
                if(!(e.CtrlKey || e.ShiftKey) && !is_selected || b_is_inline || b_is_selected_inline)
                {
                    if(!object.isCrop && !object.cropObject)
                    {
                        selector.resetSelection();
                    }
                }
                if(!e.CtrlKey || !object.selected){
                    selector.selectObject(object, pageIndex);
                }
                if(!is_selected || b_check_internal)
                    this.updateOverlay();
                this.checkSelectedObjectsForMove(group, pageIndex);
                if(!isRealObject(group))
                {

                    if(!object.isCrop && !object.cropObject)
                    {
                        this.resetInternalSelection();
                    }
                    this.updateOverlay();
                    if(!b_is_inline)
                        this.changeCurrentState(new AscFormat.PreMoveState(this, x, y, e.ShiftKey, e.CtrlKey,  object, is_selected, /*true*/!bInSelect));
                    else
                    {
                        this.changeCurrentState(new AscFormat.PreMoveInlineObject(this, object, is_selected, !bInSelect, pageIndex, x, y));
                    }
                }
                else
                {
                    group.resetInternalSelection();
                    this.updateOverlay();
                    this.changeCurrentState(new AscFormat.PreMoveInGroupState(this, group, x, y, e.ShiftKey, e.CtrlKey, object,  is_selected));
                }
                if(e.ClickCount > 1 && !e.ShiftKey && !e.CtrlKey && ((this.selection.groupSelection && this.selection.groupSelection.selectedObjects.length === 1) || this.selectedObjects.length === 1))
                {
                    var drawing = this.selectedObjects[0].parent;

                    if (object.getObjectType() === AscDFH.historyitem_type_ChartSpace && this.handleChartDoubleClick)
                        this.handleChartDoubleClick(drawing, object, e, x, y, pageIndex);
                    if(object.getObjectType() === AscDFH.historyitem_type_Shape){
                        if(null !== object.signatureLine){
                            if(this.handleSignatureDblClick){
                                this.handleSignatureDblClick(object.signatureLine.id, object.extX, object.extY)
                            }
                        }
                        else if(this.handleDblClickEmptyShape){
                            if(!object.getDocContent()){
                                this.handleDblClickEmptyShape(object);
                            }
                        }
                    }
                    if (object.getObjectType() === AscDFH.historyitem_type_OleObject && this.handleOleObjectDoubleClick){
                        this.handleOleObjectDoubleClick(drawing, object, e, x, y, pageIndex);
                    }
                    else if (2 == e.ClickCount && drawing instanceof ParaDrawing && drawing.Is_MathEquation())
                    {
                        this.handleMathDrawingDoubleClick(drawing, e, x, y, pageIndex);
                    }
                }
            }
            return true;
        }
        else
        {
            var sId = object.Get_Id();
            if(object.isCrop && object.parentCrop)
            {
                sId = object.parentCrop.Get_Id();
            }
            var sCursorType = "move";
            if(this.isSlideShow())
            {
                var sMediaName = object.getMediaFileName();
                if(sMediaName)
                {
                    sCursorType = "pointer";
                }
            }
            return {objectId: sId, cursorType: sCursorType, bMarker: bInSelect};
        }
    },


    recalculateCurPos: function(bUpdateX, bUpdateY)
	{
		var oTargetDocContent = this.getTargetDocContent(undefined, true);
		if (oTargetDocContent)
			return oTargetDocContent.RecalculateCurPos(bUpdateX, bUpdateY);
        
        return {X : 0, Y : 0, Height : 0, PageNum : 0, Internal : {Line : 0, Page : 0, Range : 0}, Transform : null};
	},

    startEditCurrentOleObject: function(){
        var oSelector = this.selection.groupSelection ? this.selection.groupSelection : this;
        var oThis = this;
        if(oSelector.selectedObjects.length === 1 && oSelector.selectedObjects[0].getObjectType() === AscDFH.historyitem_type_OleObject){
            var oleObject = oSelector.selectedObjects[0];
            this.checkSelectedObjectsAndFireCallback(function(){
                var pluginData = new Asc.CPluginData();
                pluginData.setAttribute("data", oleObject.m_sData);
                pluginData.setAttribute("guid", oleObject.m_sApplicationId);
                pluginData.setAttribute("width", oleObject.extX);
                pluginData.setAttribute("height", oleObject.extY);
                pluginData.setAttribute("widthPix", oleObject.m_nPixWidth);
                pluginData.setAttribute("heightPix", oleObject.m_nPixHeight);
                pluginData.setAttribute("objectId", oleObject.Id);

                if (window["Asc"]["editor"]) {
                    window["Asc"]["editor"].asc_pluginRun(oleObject.m_sApplicationId, 0, pluginData);
                }
                else {
                    if (editor){
                        editor.asc_pluginRun(oleObject.m_sApplicationId, 0, pluginData);
                    }
                }
            }, []);
        }
    },


    checkSelectedObjectsForMove: function(group, pageIndex)
    {
        var selected_object = group ? group.selectedObjects : this.selectedObjects;
        var b_check_page = AscFormat.isRealNumber(pageIndex);
        for(var i = 0; i < selected_object.length; ++i)
        {
            if(selected_object[i].canMove() && (!b_check_page || selected_object[i].selectStartPage === pageIndex))
            {
                this.arrPreTrackObjects.push(selected_object[i].createMoveTrack());
            }
        }
    },

    checkTargetSelection: function(oObject, x, y, invertTransform)
    {
        if(this.drawingObjects && this.drawingObjects.cSld)
        {
            var t_x = invertTransform.TransformPointX(x, y);
            var t_y = invertTransform.TransformPointY(x, y);
            if(oObject.getDocContent().CheckPosInSelection(t_x, t_y, 0, undefined))
            {
                return this.startTrackText(x, y, oObject);
            }
        }
        return false;
    },



    handleTextHit: function(object, e, x, y, group, pageIndex, bWord)
    {
        var content, invert_transform_text, tx, ty, hit_paragraph, par, check_hyperlink;
        if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
        {
            var bNotes = (this.drawingObjects && this.drawingObjects.getObjectType && this.drawingObjects.getObjectType() === AscDFH.historyitem_type_Notes);
            if((e.CtrlKey || this.isSlideShow()) && !this.document && !bNotes)
            {
                check_hyperlink = fCheckObjectHyperlink(object, x, y);
                if(!isRealObject(check_hyperlink))
                {
                    return this.handleMoveHit(object, e, x, y, group, false, pageIndex, bWord);
                }
            }
            if(!group)
            {
                if(this.selection.textSelection !== object)
                {
                    this.resetSelection(true);
                    this.selectObject(object,pageIndex);
                    this.selection.textSelection = object;
                }
                else
                {
                    if(this.checkTargetSelection(object, x, y, object.invertTransformText))
                    {
                        return true;
                    }
                }
            }
            else
            {
                if(this.selection.groupSelection !== group || group.selection.textSelection !== object)
                {
                    this.resetSelection(true);
                    group.selectObject(object,pageIndex);
                    this.selectObject(group, pageIndex);
                    this.selection.groupSelection = group;
                    group.selection.textSelection = object;
                }
                else
                {
                    if(this.checkTargetSelection(object, x, y, object.invertTransformText))
                    {
                        return true;
                    }
                }
            }

            if((e.CtrlKey || this.isSlideShow()) && !this.document && !bNotes)
            {
                check_hyperlink = fCheckObjectHyperlink(object, x, y);
                if(!isRealObject(check_hyperlink))
                {
                    return this.handleMoveHit(object, e, x, y, group, false, pageIndex, bWord);
                }
            }

            var oldCtrlKey = e.CtrlKey;
            if(this.isSlideShow() && !e.CtrlKey)
            {
                e.CtrlKey = true;
            }
            object.selectionSetStart(e, x, y, pageIndex);
            if(this.isSlideShow())
            {
                e.CtrlKey = oldCtrlKey;
            }

            this.changeCurrentState(new AscFormat.TextAddState(this, object, x, y));
            return true;
        }
        else
        {
            var ret = {objectId: object.Get_Id(), cursorType: "text"};
            content = object.getDocContent();
            invert_transform_text = object.invertTransformText;
            if(content && invert_transform_text)
            {
                tx = invert_transform_text.TransformPointX(x, y);
                ty = invert_transform_text.TransformPointY(x, y);
                if(!this.isSlideShow() && (this.document || (this.drawingObjects.cSld && !(this.noNeedUpdateCursorType === true))))
                {
                    var nPageIndex = pageIndex;
                    if(this.drawingObjects.cSld && !( this.noNeedUpdateCursorType === true ) && AscFormat.isRealNumber(this.drawingObjects.num))
                    {
                        nPageIndex = this.drawingObjects.num;
                    }
                    content.UpdateCursorType(tx, ty, 0);
                    ret.updated = true;
                }
                else if(this.drawingObjects)
                {
                    check_hyperlink = fCheckObjectHyperlink(object, x, y);
                    if(this.isSlideShow())
                    {
                        if(isRealObject(check_hyperlink))
                        {
                            ret.hyperlink = check_hyperlink;
                            ret.cursorType = "pointer";
                        }
                        else
                        {
                            return null;
                        }
                    }
                    else
                    {

                        if(isRealObject(check_hyperlink))
                        {
                            ret.hyperlink = check_hyperlink;
                        }
                    }
                }
            }
            return ret;
        }
    },


    isSlideShow: function()
    {
        if(this.drawingObjects && this.drawingObjects.cSld){
            return editor && editor.WordControl && editor.WordControl.DemonstrationManager && editor.WordControl.DemonstrationManager.Mode;
        }
        return false;
    },

    handleRotateTrack: function(e, x, y)
    {
        var angle = this.curState.majorObject.getRotateAngle(x, y);
        this.rotateTrackObjects(angle, e);
        this.updateOverlay();
    },

    getSnapArrays: function()
    {
        var drawing_objects = this.getDrawingObjects();
        var snapX = [];
        var snapY = [];
        for(var i = 0; i < drawing_objects.length; ++i)
        {
            if(drawing_objects[i].getSnapArrays)
            {
                drawing_objects[i].getSnapArrays(snapX, snapY);
            }
        }
        return {snapX: snapX, snapY: snapY};
    },

    getLeftTopSelectedFromArray: function(aDrawings, pageIndex)
    {
        var i, dX, dY;
        for(i = aDrawings.length - 1; i > -1; --i)
        {
            if(aDrawings[i].selected && pageIndex === aDrawings[i].selectStartPage)
            {
                dX = aDrawings[i].transform.TransformPointX(aDrawings[i].extX/2, aDrawings[i].extY/2) - aDrawings[i].extX/2;
                dY = aDrawings[i].transform.TransformPointY(aDrawings[i].extX/2, aDrawings[i].extY/2) - aDrawings[i].extY/2;
                return {X: dX, Y: dY, bSelected: true, PageIndex: pageIndex};
            }
        }
        return {X: 0, Y: 0, bSelected: false, PageIndex: pageIndex};
    },

    getLeftTopSelectedObject: function(pageIndex)
    {
        return this.getLeftTopSelectedFromArray(this.getDrawingObjects(), pageIndex);
    },
	
	createWatermarkImage: function(sImageUrl)
	{
        return AscFormat.ExecuteNoHistory(function(){
            return this.createImage(sImageUrl, 0, 0, 110, 61.875);
        }, this, []);
    },


	IsSelectionUse: function(){
        var content = this.getTargetDocContent();
        if(content)
        {
            return content.IsTextSelectionUse();
        }
        else
        {
            return this.selectedObjects.length > 0;
        }
    },

    getFromTargetTextObjectContextMenuPosition: function(oTargetTextObject, pageIndex)
    {
        var oTransformText = oTargetTextObject.transformText;
        var oTargetObjectOrTable = this.getTargetDocContent(false, true);
        if(oTargetTextObject && oTargetObjectOrTable && oTargetObjectOrTable.GetCursorPosXY && oTransformText){
            var oPos = oTargetObjectOrTable.GetCursorPosXY();
            return {
                X: oTransformText.TransformPointX(oPos.X, oPos.Y),
                Y: oTransformText.TransformPointY(oPos.X, oPos.Y),
                PageIndex: pageIndex
            };
        }
        return {X: 0, Y: 0, PageIndex: pageIndex};
    },



    isPointInDrawingObjects3: function(x, y, nPageIndex, bSelected, bText)
    {
        var oOldState = this.curState;
        this.changeCurrentState(new AscFormat.NullState(this));
        var oResult, bRet = false;
        this.handleEventMode = HANDLE_EVENT_MODE_CURSOR;
        oResult = this.curState.onMouseDown(AscCommon.global_mouseEvent, x, y, 0);
        this.handleEventMode = HANDLE_EVENT_MODE_HANDLE;
        if(AscCommon.isRealObject(oResult)){
            if(oResult.cursorType !== "text"){
                var object = g_oTableId.Get_ById(oResult.objectId);
                if(AscCommon.isRealObject(object)
                    && ((bSelected && object.selected) ||  !bSelected) ){
                    bRet = true;
                }
                else
                {
                    return false;
                }
            }
            else{
                if(bText){
                    return true;
                }
            }
        }
        this.changeCurrentState(oOldState);
        return bRet;
    },


    isPointInDrawingObjects4: function(x, y, pageIndex){
        var oOldState = this.curState;
        this.changeCurrentState(new AscFormat.NullState(this));
        var oResult, nRet = 0;
        this.handleEventMode = HANDLE_EVENT_MODE_CURSOR;
        oResult = this.curState.onMouseDown(AscCommon.global_mouseEvent, x, y, 0);
        this.handleEventMode = HANDLE_EVENT_MODE_HANDLE;
        var object;
        if(AscCommon.isRealObject(oResult)){
            if(oResult.cursorType === "text"){
                nRet = 0;
            }
            else if(oResult.cursorType === "move"){
                object = g_oTableId.Get_ById(oResult.objectId);
                if(object && object.hitInBoundingRect && object.hitInBoundingRect(x, y)){
                    nRet = 3;
                }
                else{
                    nRet = 2;
                }
            }
            else{
                nRet = 3;
            }
        }
        this.changeCurrentState(oOldState);
        return nRet;
    },

	GetSelectionBounds: function()
    {
        var oTargetDocContent = this.getTargetDocContent(false, true);
        if(isRealObject(oTargetDocContent))
        {
            return oTargetDocContent.GetSelectionBounds();
        }
        return null;
    },


    CreateDocContent: function(){
        var oController = this;
        if(this.selection.groupSelection){
            oController = this.selection.groupSelection;
        }
        if(oController.selection.textSelection){
            return;
        }
        if(oController.selection.chartSelection){
           if(oController.selection.chartSelection.selection.textSelection){
               oController.selection.chartSelection.selection.textSelection.checkDocContent && oController.selection.chartSelection.selection.textSelection.checkDocContent();
               return;
           }
        }
        if(oController.selectedObjects.length === 1 ){
            if(oController.selectedObjects[0].getObjectType() === AscDFH.historyitem_type_Shape){
                var oShape = oController.selectedObjects[0];
                if(oShape.bWordShape){
                    if(!oShape.textBoxContent){
                        oShape.createTextBoxContent();
                    }
                }
                else{
                    if(!oShape.txBody){
                        oShape.createTextBody();
                    }
                }
                oController.selection.textSelection = oShape;
            }
            else{
                if(oController.selection.chartSelection && oController.selection.chartSelection.selection.title){
                    oController.selection.chartSelection.selection.textSelection = oController.selection.chartSelection.selection.title;
                    oController.selection.chartSelection.selection.textSelection.checkDocContent && oController.selection.chartSelection.selection.textSelection.checkDocContent();
                }
            }
        }
    },

    getContextMenuPosition: function(pageIndex)
    {
        var i, aDrawings, dX, dY, oTargetTextObject;
        if(this.selectedObjects.length > 0)
        {
            oTargetTextObject = getTargetTextObject(this);
            if(oTargetTextObject)
            {
                return this.getFromTargetTextObjectContextMenuPosition(oTargetTextObject, pageIndex);

            }
            else if(this.selection.groupSelection)
            {
                aDrawings = this.selection.groupSelection.arrGraphicObjects;
                for(i = aDrawings.length-1; i > -1; --i)
                {
                    if(aDrawings[i].selected)
                    {
                        dX = aDrawings[i].transform.TransformPointX(aDrawings[i].extX/2, aDrawings[i].extY/2) - aDrawings[i].extX/2;
                        dY = aDrawings[i].transform.TransformPointY(aDrawings[i].extX/2, aDrawings[i].extY/2) - aDrawings[i].extY/2;
                        return {X: dX, Y: dY, PageIndex: this.selection.groupSelection.selectStartPage};
                    }
                }
            }
            else
            {
                return this.getLeftTopSelectedObject(pageIndex);
            }
        }

        return {X: 0, Y: 0, PageIndex: pageIndex};
    },

    drawSelect: function(pageIndex, drawingDocument)
    {
		if (undefined !== drawingDocument.BeginDrawTracking)
            drawingDocument.BeginDrawTracking();
		
        var i;
        if(this.selection.textSelection)
        {
            if(this.selection.textSelection.selectStartPage === pageIndex)
            {
                drawingDocument.DrawTrack(AscFormat.TYPE_TRACK.TEXT, this.selection.textSelection.getTransformMatrix(), 0, 0, this.selection.textSelection.extX, this.selection.textSelection.extY, AscFormat.CheckObjectLine(this.selection.textSelection), this.selection.textSelection.canRotate());
                if(this.selection.textSelection.drawAdjustments)
                    this.selection.textSelection.drawAdjustments(drawingDocument);
            }
        }
        else if(this.selection.cropSelection)
        {
            if(this.arrTrackObjects.length === 0)
            {
                if(this.selection.cropSelection.selectStartPage === pageIndex)
                {
                    var oCropSelection =  this.selection.cropSelection;
                    var cropObject = oCropSelection.getCropObject();
                    if(cropObject)
                    {
                        var oldGlobalAlpha;
                        if(drawingDocument.AutoShapesTrack.Graphics)
                        {
                            oldGlobalAlpha = drawingDocument.AutoShapesTrack.Graphics.globalAlpha;
                            drawingDocument.AutoShapesTrack.Graphics.put_GlobalAlpha(false, 1.0);
                        }
                        drawingDocument.AutoShapesTrack.SetCurrentPage(cropObject.selectStartPage, true);
                        cropObject.draw(drawingDocument.AutoShapesTrack);
                        drawingDocument.AutoShapesTrack.CorrectOverlayBounds();

                        drawingDocument.AutoShapesTrack.SetCurrentPage(cropObject.selectStartPage, true);
                        oCropSelection.draw(drawingDocument.AutoShapesTrack);
                        drawingDocument.AutoShapesTrack.CorrectOverlayBounds();

                        if(drawingDocument.AutoShapesTrack.Graphics)
                        {
                            drawingDocument.AutoShapesTrack.Graphics.put_GlobalAlpha(true, oldGlobalAlpha);
                        }
                        drawingDocument.DrawTrack(AscFormat.TYPE_TRACK.SHAPE, cropObject.getTransformMatrix(), 0, 0, cropObject.extX, cropObject.extY, false, false);
                        drawingDocument.DrawTrack(AscFormat.TYPE_TRACK.CROP, oCropSelection.getTransformMatrix(), 0, 0, oCropSelection.extX, oCropSelection.extY, false, false);
                    }
                }
            }
        }
        else if(this.selection.groupSelection)
        {
            if(this.selection.groupSelection.selectStartPage === pageIndex)
            {
                drawingDocument.DrawTrack(AscFormat.TYPE_TRACK.GROUP_PASSIVE, this.selection.groupSelection.getTransformMatrix(), 0, 0, this.selection.groupSelection.extX, this.selection.groupSelection.extY, false, this.selection.groupSelection.canRotate());
                if(this.selection.groupSelection.selection.textSelection)
                {
                    for(i = 0; i < this.selection.groupSelection.selectedObjects.length ; ++i)
                    {
                        drawingDocument.DrawTrack(AscFormat.TYPE_TRACK.TEXT, this.selection.groupSelection.selectedObjects[i].transform, 0, 0, this.selection.groupSelection.selectedObjects[i].extX, this.selection.groupSelection.selectedObjects[i].extY, AscFormat.CheckObjectLine(this.selection.groupSelection.selectedObjects[i]), this.selection.groupSelection.selectedObjects[i].canRotate());
                    }
                }
                else if(this.selection.groupSelection.selection.chartSelection)
                {
                    this.selection.groupSelection.selection.chartSelection.drawSelect(drawingDocument, pageIndex);
                }
                else
                {
                    for(i = 0; i < this.selection.groupSelection.selectedObjects.length ; ++i)
                    {
                        drawingDocument.DrawTrack(AscFormat.TYPE_TRACK.SHAPE, this.selection.groupSelection.selectedObjects[i].transform, 0, 0, this.selection.groupSelection.selectedObjects[i].extX, this.selection.groupSelection.selectedObjects[i].extY, AscFormat.CheckObjectLine(this.selection.groupSelection.selectedObjects[i]), this.selection.groupSelection.selectedObjects[i].canRotate());
                    }
                }

                if(this.selection.groupSelection.selectedObjects.length === 1 && this.selection.groupSelection.selectedObjects[0].drawAdjustments)
                {
                    this.selection.groupSelection.selectedObjects[0].drawAdjustments(drawingDocument);
                }
            }
        }
        else if(this.selection.chartSelection)
        {
            this.selection.chartSelection.drawSelect(drawingDocument, pageIndex);
        }
        else if(this.selection.wrapPolygonSelection)
        {
            if(this.selection.wrapPolygonSelection.selectStartPage === pageIndex)
                drawingDocument.AutoShapesTrack.DrawEditWrapPointsPolygon(this.selection.wrapPolygonSelection.parent.wrappingPolygon.calculatedPoints, new AscCommon.CMatrix());
        }
        else
        {
            for(i = 0; i < this.selectedObjects.length; ++i)
            {
                if(this.selectedObjects[i].selectStartPage === pageIndex)
                {
                    drawingDocument.DrawTrack(AscFormat.TYPE_TRACK.SHAPE, this.selectedObjects[i].getTransformMatrix(), 0, 0, this.selectedObjects[i].extX, this.selectedObjects[i].extY, AscFormat.CheckObjectLine(this.selectedObjects[i]), this.selectedObjects[i].canRotate());
                }
            }
            if(this.selectedObjects.length === 1 && this.selectedObjects[0].drawAdjustments && this.selectedObjects[0].selectStartPage === pageIndex)
            {
                this.selectedObjects[0].drawAdjustments(drawingDocument);
            }
        }
        if(this.document)
        {
            if(this.selectedObjects.length === 1 && this.selectedObjects[0].parent && !this.selectedObjects[0].parent.Is_Inline())
            {
                var anchor_pos;
                if(this.arrTrackObjects.length === 1 && !(this.arrTrackObjects[0] instanceof TrackPointWrapPointWrapPolygon || this.arrTrackObjects[0] instanceof  TrackNewPointWrapPolygon))
                {
                    var page_index = AscFormat.isRealNumber(this.arrTrackObjects[0].pageIndex) ? this.arrTrackObjects[0].pageIndex : (AscFormat.isRealNumber(this.arrTrackObjects[0].selectStartPage) ? this.arrTrackObjects[0].selectStartPage : 0);
                    if(page_index === pageIndex)
                    {
                        var bounds = this.arrTrackObjects[0].getBounds();
                        var nearest_pos = this.document.Get_NearestPos(page_index, bounds.min_x, bounds.min_y, true, this.selectedObjects[0].parent);
                        nearest_pos.Page = page_index;
                        drawingDocument.AutoShapesTrack.drawFlowAnchor(nearest_pos.X, nearest_pos.Y);
                    }
                }
                else
                {
                    var page_index = this.selectedObjects[0].selectStartPage;
                    if(page_index === pageIndex)
                    {
                        var paragraph = this.selectedObjects[0].parent.Get_ParentParagraph();
                        anchor_pos = paragraph.Get_AnchorPos(this.selectedObjects[0].parent);
                        drawingDocument.AutoShapesTrack.drawFlowAnchor(anchor_pos.X, anchor_pos.Y);
                    }
                }
            }
        }
        if(this.selectionRect)
        {
            drawingDocument.DrawTrackSelectShapes(this.selectionRect.x, this.selectionRect.y, this.selectionRect.w, this.selectionRect.h);
        }


        if(this.connector){
            this.connector.drawConnectors(drawingDocument.AutoShapesTrack);
            this.connector = null;
        }


      
		if (undefined !== drawingDocument.EndDrawTracking)
			drawingDocument.EndDrawTracking();

		return;
    },

    selectObject: function(object, pageIndex)
    {
        object.select(this, pageIndex);
    },

    deselectObject: function(object)
    {
        for(var i = 0; i < this.selectedObjects.length; ++i)
        {
            if(this.selectedObjects[i] === object){
                object.selected = false;
                this.selectedObjects.splice(i, 1);
                return;
            }
        }
    },

    recalculate: function()
    {
        for(var key in this.objectsForRecalculate)
        {
            this.objectsForRecalculate[key].recalculate();
        }
        this.objectsForRecalculate = {};
    },

    addContentChanges: function(changes)
    {
        // this.contentChanges.Add(changes);
    },

    refreshContentChanges: function()
    {
        //this.contentChanges.Refresh();
        //this.contentChanges.Clear();
    },

    getAllFontNames: function()
    {
    },


    getNearestPos: function(x, y){
        var oTragetDocContent = this.getTargetDocContent(false, false);
        if(oTragetDocContent){
            var tx = x, ty = y;
            var oTransform = oTragetDocContent.Get_ParentTextTransform();
            if(oTransform){
                var oInvertTransform = AscCommon.global_MatrixTransformer.Invert(oTransform);
                tx = oInvertTransform.TransformPointX(x, y);
                ty = oInvertTransform.TransformPointY(x, y);
                return oTragetDocContent.Get_NearestPos(0, tx, ty, false);
            }
        }
        return null;
    },

    getNearestPos2: function(x, y){
        var oTragetDocContent = this.getTargetDocContent(false, false);
        if(oTragetDocContent){
            var tx = x, ty = y;
            var oTransform = oTragetDocContent.Get_ParentTextTransform();
            if(oTransform){
                var oInvertTransform = AscCommon.global_MatrixTransformer.Invert(oTransform);
                tx = oInvertTransform.TransformPointX(x, y);
                ty = oInvertTransform.TransformPointY(x, y);
                var oNearestPos = oTragetDocContent.Get_NearestPos(0, tx, ty, false);
                return oNearestPos;
            }
        }
        return null;
    },

    getNearestPos3: function(x, y){
        var oOldState = this.curState;
        this.changeCurrentState(new AscFormat.NullState(this));
        var oResult, bRet = false;
        this.handleEventMode = HANDLE_EVENT_MODE_CURSOR;
        oResult = this.curState.onMouseDown(AscCommon.global_mouseEvent, x, y, 0);
        this.handleEventMode = HANDLE_EVENT_MODE_HANDLE;
        this.changeCurrentState(oOldState);
        if(oResult){
            if(oResult.cursorType === 'text'){
                var oObject = AscCommon.g_oTableId.Get_ById(oResult.objectId);
                if(oObject && oObject.getObjectType() === AscDFH.historyitem_type_Shape){
                    var oContent = oObject.getDocContent();
                    if(oContent){
                        var tx = oObject.invertTransformText.TransformPointX(x, y);
                        var ty = oObject.invertTransformText.TransformPointY(x, y);
                        return oContent.Get_NearestPos(0, tx, ty, false);
                    }
                }
            }
        }
        return null;
    },

    getTargetDocContent: function(bCheckChartTitle, bOrTable)
    {
        var text_object = getTargetTextObject(this);
        if(text_object)
        {
            if(bOrTable)
            {
                if(text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
                {
                    return text_object.graphicObject;
                }
            }
            if(bCheckChartTitle && text_object.checkDocContent)
            {
                text_object.checkDocContent();
            }
            return text_object.getDocContent();
        }
        return null;
    },


    addNewParagraph: function(bRecalculate)
    {
        this.applyTextFunction(CDocumentContent.prototype.AddNewParagraph, CTable.prototype.AddNewParagraph, [bRecalculate]);
    },


    paragraphClearFormatting: function(isClearParaPr, isClearTextPr)
    {
        this.applyDocContentFunction(AscFormat.CDrawingDocContent.prototype.ClearParagraphFormatting, [isClearParaPr, isClearTextPr], CTable.prototype.ClearParagraphFormatting);
    },

    applyDocContentFunction: function(f, args, tableFunction)
    {
        var oThis = this;
        function applyToArrayDrawings(arr)
        {
            var ret = false, ret2;
            for(var i = 0; i < arr.length; ++i)
            {
                if(arr[i].getObjectType() === AscDFH.historyitem_type_GroupShape)
                {
                    ret2 = applyToArrayDrawings(arr[i].arrGraphicObjects);
                    if(ret2)
                    {
                        ret = true;
                    }
                }
                else if(arr[i].getObjectType() === AscDFH.historyitem_type_GraphicFrame)
                {
                    arr[i].graphicObject.Set_ApplyToAll(true);
                    tableFunction.apply(arr[i].graphicObject, args);
                    arr[i].graphicObject.Set_ApplyToAll(false);
                    ret = true;
                }
                else if(arr[i].getObjectType() === AscDFH.historyitem_type_ChartSpace)
                {
                    if(f === CDocumentContent.prototype.AddToParagraph && args[0].Type === para_TextPr)
                    {
                        AscFormat.CheckObjectTextPr(arr[i], args[0].Value, oThis.getDrawingDocument());
                    }
                    if(f === CDocumentContent.prototype.IncreaseDecreaseFontSize)
                    {
                        arr[i].paragraphIncDecFontSize(args[0]);
                    }
                }
                else if(arr[i].getDocContent)
                {
                    var content = arr[i].getDocContent();
                    if(content)
                    {
                        content.Set_ApplyToAll(true);
                        f.apply(content, args);
                        content.Set_ApplyToAll(false);
                        ret = true;
                    }
                    else
                    {
                        if(arr[i].getObjectType() === AscDFH.historyitem_type_Shape)
                        {
                            if(arr[i].bWordShape)
                            {
                                arr[i].createTextBoxContent();
                            }
                            else
                            {
                                arr[i].createTextBody();
                            }
                            content = arr[i].getDocContent();
                            if(content)
                            {
                                content.Set_ApplyToAll(true);
                                f.apply(content, args);
                                content.Set_ApplyToAll(false);
                                ret = true;
                            }
                        }
                    }
                }

                if(arr[i].checkExtentsByDocContent)
                {
                    arr[i].checkExtentsByDocContent();
                }
            }
            return ret;
        }
        function applyToChartSelection(chart)
        {
            var content;
            if(chart.selection.textSelection)
            {
                chart.selection.textSelection.checkDocContent();
                content = chart.selection.textSelection.getDocContent();
                if(content)
                {
                    f.apply(content, args);
                }
            }
            else if(chart.selection.title)
            {
                content = chart.selection.title.getDocContent();
                if(content)
                {
                    content.Set_ApplyToAll(true);
                    f.apply(content, args);
                    content.Set_ApplyToAll(false);
                }
            }
        }
        if(this.selection.textSelection)
        {
            if(this.selection.textSelection.getObjectType() !== AscDFH.historyitem_type_GraphicFrame)
            {
                f.apply(this.selection.textSelection.getDocContent(), args);
                this.selection.textSelection.checkExtentsByDocContent();
            }
            else
            {
                tableFunction.apply(this.selection.textSelection.graphicObject, args);
            }
        }
        else if(this.selection.groupSelection)
        {
            if(this.selection.groupSelection.selection.textSelection)
            {
                if(this.selection.groupSelection.selection.textSelection.getObjectType() !== AscDFH.historyitem_type_GraphicFrame)
                {
                    f.apply(this.selection.groupSelection.selection.textSelection.getDocContent(), args);
                    this.selection.groupSelection.selection.textSelection.checkExtentsByDocContent();
                }
                else
                {
                    tableFunction.apply(this.selection.groupSelection.selection.textSelection.graphicObject, args);
                }
            }
            else if(this.selection.groupSelection.selection.chartSelection)
            {
                if(f === CDocumentContent.prototype.IncreaseDecreaseFontSize)
                {
                    this.selection.groupSelection.selection.chartSelection.paragraphIncDecFontSize(args[0]);
                }
                else
                {
                    applyToChartSelection(this.selection.groupSelection.selection.chartSelection);
                }

            }
            else
                applyToArrayDrawings(this.selection.groupSelection.selectedObjects);
        }
        else if(this.selection.chartSelection)
        {
            if(f === CDocumentContent.prototype.IncreaseDecreaseFontSize)
            {
                this.selection.chartSelection.paragraphIncDecFontSize(args[0]);
            }
            else
            {
                applyToChartSelection(this.selection.chartSelection);
            }
        }
        else
        {
            var ret = applyToArrayDrawings(this.selectedObjects);
           //if(!ret)
           //{
           //    if(f !== CDocumentContent.prototype.AddToParagraph && this.selectedObjects[0] && this.selectedObjects[0].parent && this.selectedObjects[0].parent.Is_Inline())
           //    {
           //        var parent_paragraph = this.selectedObjects[0].parent.Get_ParentParagraph();
           //        parent_paragraph
           //    }
           //}
        }
        if(this.document)
        {
            this.document.Recalculate();
        }
    },

    setParagraphSpacing: function(Spacing)
    {
        this.applyDocContentFunction(CDocumentContent.prototype.SetParagraphSpacing, [Spacing], CTable.prototype.SetParagraphSpacing);
    },

    setParagraphTabs: function(Tabs)
    {
        this.applyTextFunction(CDocumentContent.prototype.SetParagraphTabs, CTable.prototype.SetParagraphTabs, [Tabs]);
    },

    setParagraphNumbering: function(NumInfo)
    {
        this.applyDocContentFunction(CDocumentContent.prototype.SetParagraphNumbering, [NumInfo], CTable.prototype.SetParagraphNumbering);
    },

    setParagraphShd: function(Shd)
    {
        this.applyDocContentFunction(CDocumentContent.prototype.SetParagraphShd, [Shd], CTable.prototype.SetParagraphShd);
    },


    setParagraphStyle: function(Style)
    {
        this.applyDocContentFunction(CDocumentContent.prototype.SetParagraphStyle, [Style], CTable.prototype.SetParagraphStyle);
    },


    setParagraphContextualSpacing: function(Value)
    {
        this.applyDocContentFunction(CDocumentContent.prototype.SetParagraphContextualSpacing, [Value], CTable.prototype.SetParagraphContextualSpacing);
    },

    setParagraphPageBreakBefore: function(Value)
    {
        this.applyTextFunction(CDocumentContent.prototype.SetParagraphPageBreakBefore, CTable.prototype.SetParagraphPageBreakBefore, [Value]);
    },
    setParagraphKeepLines: function(Value)
    {
        this.applyTextFunction(CDocumentContent.prototype.SetParagraphKeepLines, CTable.prototype.SetParagraphKeepLines, [Value]);
    },

    setParagraphKeepNext: function(Value)
    {
        this.applyTextFunction(CDocumentContent.prototype.SetParagraphKeepNext, CTable.prototype.SetParagraphKeepNext, [Value]);
    },

    setParagraphWidowControl: function(Value)
    {
        this.applyTextFunction(CDocumentContent.prototype.SetParagraphWidowControl, CTable.prototype.SetParagraphWidowControl, [Value]);
    },

    setParagraphBorders: function(Value)
    {
        this.applyTextFunction(CDocumentContent.prototype.SetParagraphBorders, CTable.prototype.SetParagraphBorders, [Value]);
    },


    handleEnter: function(){
        var oSelector = this.selection.groupSelection ? this.selection.groupSelection : this;
        var aSelectedObjects2 = oSelector.selectedObjects;
        var nRet = 0;
        if(aSelectedObjects2.length === 1){
            var oSelectedObject = aSelectedObjects2[0];
            var nObjectType = oSelectedObject.getObjectType();
            var oContent;
            switch(nObjectType){
                case AscDFH.historyitem_type_Shape:{
                    oContent = oSelectedObject.getDocContent();
                    if(!oContent){
                        if(!CheckLinePresetForParagraphAdd(oSelectedObject.getPresetGeom())){
                            this.checkSelectedObjectsAndCallback(function () {
                                if(oSelectedObject.bWordShape){
                                    oSelectedObject.createTextBoxContent();
                                }
                                else {
                                    oSelectedObject.createTextBody();
                                }
                                oContent = oSelectedObject.getDocContent();
                                if(oContent){
                                    oContent.MoveCursorToStartPos();
                                    oSelector.selection.textSelection = oSelectedObject;
                                }
                                nRet |= 1;
                                nRet |= 2;
                            }, [], false, undefined, [], undefined);
                        }
                    }
                    else{
                        if(oContent.IsEmpty()){
                            oContent.MoveCursorToStartPos();
                        }
                        else{
                            oContent.SelectAll();
                        }
                        nRet |= 1;
                        if(oSelectedObject.isEmptyPlaceholder()){
                            nRet |= 2;
                        }
                        oSelector.selection.textSelection = oSelectedObject;
                    }
                    break;
                }
                case AscDFH.historyitem_type_ChartSpace:{
                    if(oSelector.selection.chartSelection === oSelectedObject){
                        if(oSelectedObject.selection.title){
                            oContent = oSelectedObject.selection.title.getDocContent();
                            if(oContent.IsEmpty()){
                                oContent.MoveCursorToStartPos();
                            }
                            else{
                                oContent.SelectAll();
                            }
                            nRet |= 1;
                            oSelectedObject.selection.textSelection = oSelectedObject.selection.title;
                        }
                    }
                    break;
                }
                case AscDFH.historyitem_type_GraphicFrame: {
                    var oTable = oSelectedObject.graphicObject;
                    if(oSelector.selection.textSelection === oSelectedObject){
                        var oTableSelection = oTable.Selection;
                        if(oTableSelection.Type === table_Selection_Cell){
                            this.checkSelectedObjectsAndCallback(function () {
                                oTable.Remove(-1);
                                oTable.RemoveSelection();
                                nRet |= 1;
                                nRet |= 2;
                            }, [], false, undefined, [], undefined);
                        }
                    }
                    else{
                        oTable.MoveCursorToStartPos(false);
                        var oCurCell = oTable.CurCell;
                        if(oCurCell && oCurCell.Content){
                            if(!oCurCell.Content.IsEmpty()){
                                oCurCell.Content.SelectAll();
                                oTable.Selection.Use          = true;
                                oTable.Selection.Type         = table_Selection_Text;
                                oTable.Selection.StartPos.Pos = {Row : oCurCell.Row.Index, Cell : oCurCell.Index};
                                oTable.Selection.EndPos.Pos   = {Row : oCurCell.Row.Index, Cell : oCurCell.Index};
                                oTable.Selection.CurRow       = oCurCell.Row.Index;
                            }
                            oSelector.selection.textSelection = oSelectedObject;
                            nRet |= 1;
                        }
                    }
                    break;
                }
            }
        }
        return nRet;
    },

    applyTextFunction: function(docContentFunction, tableFunction, args)
    {
        if(this.selection.textSelection)
        {
            this.selection.textSelection.applyTextFunction(docContentFunction, tableFunction, args);
        }
        else if(this.selection.groupSelection)
        {
            var oOldDoc = this.selection.groupSelection.document;
            this.selection.groupSelection.document = this.document;
            this.selection.groupSelection.applyTextFunction(docContentFunction, tableFunction, args);
            this.selection.groupSelection.document = oOldDoc;
        }
        else if(this.selection.chartSelection)
        {
            this.selection.chartSelection.applyTextFunction(docContentFunction, tableFunction, args);
            if(this.document)
            {
                this.document.Recalculate();
            }
        }
        else
        {
            if(docContentFunction === CDocumentContent.prototype.AddToParagraph && args[0].Type === para_TextPr || docContentFunction === CDocumentContent.prototype.PasteFormatting)
            {
                var fDocContentCallback = function()
                {
                    if(this.CanEditAllContentControls())
                    {
                        docContentFunction.apply(this, args);
                    }
                };
                this.applyDocContentFunction(fDocContentCallback, args, tableFunction);
            }
            else if(this.selectedObjects.length === 1 && ((this.selectedObjects[0].getObjectType() === AscDFH.historyitem_type_Shape && !CheckLinePresetForParagraphAdd(this.selectedObjects[0].getPresetGeom()) && !this.selectedObjects[0].signatureLine) || this.selectedObjects[0].getObjectType() === AscDFH.historyitem_type_GraphicFrame))
            {
                this.selection.textSelection = this.selectedObjects[0];
                if(this.selectedObjects[0].getObjectType() === AscDFH.historyitem_type_GraphicFrame)
                {
                    this.selectedObjects[0].graphicObject.MoveCursorToStartPos(false);
                    this.selectedObjects[0].applyTextFunction(docContentFunction, tableFunction, args);
                }
                else
                {
                    var oDocContent = this.selectedObjects[0].getDocContent();
                    if(oDocContent){
                        oDocContent.MoveCursorToEndPos(false);
                    }
                    this.selectedObjects[0].applyTextFunction(docContentFunction, tableFunction, args);
                    this.selection.textSelection.select(this, this.selection.textSelection.selectStartPage);
                }
            }
            else if(this.parent && this.parent.GoTo_Text)
            {
                this.parent.GoTo_Text();
                this.resetSelection();
                if(this.document && (docpostype_DrawingObjects !== this.document.GetDocPosType() || isRealObject(getTargetTextObject(this.document.DrawingObjects))) && CDocumentContent.prototype.AddNewParagraph === docContentFunction)
                {
                    this.document.AddNewParagraph(args[0]);
                }
            }
            else if(this.selectedObjects.length > 0 && this.selectedObjects[0].parent && this.selectedObjects[0].parent.GoTo_Text)
            {
                this.selectedObjects[0].parent.GoTo_Text();
                this.resetSelection();
                if(this.document && (docpostype_DrawingObjects !== this.document.GetDocPosType() || isRealObject(getTargetTextObject(this))) && CDocumentContent.prototype.AddNewParagraph === docContentFunction)
                {
                    this.document.AddNewParagraph(args[0]);
                }
            }
        }
    },

    paragraphAdd: function(paraItem, bRecalculate)
    {
        this.applyTextFunction(CDocumentContent.prototype.AddToParagraph, CTable.prototype.AddToParagraph, [paraItem, bRecalculate]);
    },

    startTrackText: function(X, Y, oObject)
    {
        if(this.drawingObjects.cSld)
        {
            this.changeCurrentState(new AscFormat.TrackTextState(this, oObject, X, Y));
           return true;
        }
        return false;
    },


    setMathProps: function(oMathProps)
    {
        var oContent = this.getTargetDocContent(false);
            if(oContent){
                this.checkSelectedObjectsAndCallback(function(){
                    var oContent2 = this.getTargetDocContent(true);
                    if(oContent2){
                        var SelectedInfo = new CSelectedElementsInfo();
                        oContent2.GetSelectedElementsInfo(SelectedInfo);
                        if (null !== SelectedInfo.Get_Math()){
                            var ParaMath = SelectedInfo.Get_Math();
                            ParaMath.Set_MenuProps(oMathProps);
                        }
                    }
            }, [], false, AscDFH.historydescription_Spreadsheet_SetCellFontName);
        }
    },

    paragraphIncDecFontSize: function(bIncrease)
    {
        this.applyDocContentFunction(CDocumentContent.prototype.IncreaseDecreaseFontSize, [bIncrease], CTable.prototype.IncreaseDecreaseFontSize);
    },

    paragraphIncDecIndent: function(bIncrease)
    {
        this.applyDocContentFunction(CDocumentContent.prototype.IncreaseDecreaseIndent, [bIncrease], CTable.prototype.IncreaseDecreaseIndent);
    },
    setDefaultTabSize: function(TabSize)
    {
        this.applyDocContentFunction(CDocumentContent.prototype.SetParagraphDefaultTabSize, [TabSize], CTable.prototype.SetParagraphDefaultTabSize);
    },

    setParagraphAlign: function(align)
    {
        if(!this.document){
            var oContent = this.getTargetDocContent(true, false);
            if(oContent){
                var oInfo = new CSelectedElementsInfo();
                oContent.GetSelectedElementsInfo(oInfo);
                var Math         = oInfo.Get_Math();
                if (null !== Math && true !== Math.Is_Inline())
                {
                    Math.Set_Align(align);
                    return;
                }
            }
        }
        this.applyDocContentFunction(CDocumentContent.prototype.SetParagraphAlign, [align], CTable.prototype.SetParagraphAlign);
    },

    setParagraphIndent: function(indent)
    {
        var content = this.getTargetDocContent(true);
        if(content)
        {
            content.SetParagraphIndent(indent);
        }
        else if(this.document)
        {
            if(this.selectedObjects.length > 0)
            {
                var parent_paragraph = this.selectedObjects[0].parent.Get_ParentParagraph();
                if(parent_paragraph)
                {
                    parent_paragraph.Set_Ind(indent, true);
                    this.document.Recalculate();
                }
            }
        }
    },

    setCellFontName: function (fontName) {

        var oThis = this;
        var callBack = function()
        {
            oThis.paragraphAdd(new ParaTextPr({ FontFamily : { Name : fontName , Index : -1 } }));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellFontName);

    },

    setCellFontSize: function (fontSize) {

        var oThis = this;
        var callBack = function()
        {
            oThis.paragraphAdd(new ParaTextPr({ FontSize : fontSize}));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellFontSize);
    },

    setCellBold: function (isBold) {
        var oThis = this;
        var callBack = function()
        {
            oThis.paragraphAdd(new ParaTextPr({ Bold : isBold}));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellBold);

    },

    setCellItalic: function (isItalic) {
        var oThis = this;
        var callBack = function()
        {
            oThis.paragraphAdd(new ParaTextPr({ Italic : isItalic}));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellItalic);
    },

    setCellUnderline: function (isUnderline) {
        var oThis = this;
        var callBack = function()
        {
            oThis.paragraphAdd(new ParaTextPr({ Underline : isUnderline}));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellUnderline);
    },

    setCellStrikeout: function (isStrikeout) {
        var oThis = this;
        var callBack = function()
        {
            oThis.paragraphAdd(new ParaTextPr({ Strikeout : isStrikeout}));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellStrikeout);
    },

    setCellSubscript: function (isSubscript) {
        var oThis = this;
        var callBack = function()
        {
            oThis.paragraphAdd(new ParaTextPr({ VertAlign : isSubscript ? AscCommon.vertalign_SubScript : AscCommon.vertalign_Baseline}));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellSubscript);
    },

    setCellSuperscript: function (isSuperscript) {
        var oThis = this;
        var callBack = function()
        {
            oThis.paragraphAdd(new ParaTextPr({ VertAlign : isSuperscript ? AscCommon.vertalign_SubScript : AscCommon.vertalign_Baseline}));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellSuperscript);
    },

    setCellAlign: function (align) {
        this.checkSelectedObjectsAndCallback(this.setParagraphAlign, [align], false, AscDFH.historydescription_Spreadsheet_SetCellAlign);
    },

    setCellVertAlign: function (align) {

        var vert_align;
        switch (align)
        {
            case Asc.c_oAscVAlign.Bottom :
            {
                vert_align = 0;
                break;
            }
            case Asc.c_oAscVAlign.Center :
            {
                vert_align = 1;
                break;
            }
            case Asc.c_oAscVAlign.Dist:
            {
                vert_align = 1;
                break;
            }
            case Asc.c_oAscVAlign.Just :
            {
                vert_align = 1;
                break;
            }
            case Asc.c_oAscVAlign.Top :
            {
                vert_align = 4
            }
        }
        this.checkSelectedObjectsAndCallback(this.applyDrawingProps, [{verticalTextAlign: vert_align}], false, AscDFH.historydescription_Spreadsheet_SetCellVertAlign);
    },

    setCellTextWrap: function (isWrapped) {
        //TODO:this.checkSelectedObjectsAndCallback(this.setCellTextWrapCallBack, [isWrapped]);

    },

    setCellTextShrink: function (isShrinked) {
        //TODO:this.checkSelectedObjectsAndCallback(this.setCellTextShrinkCallBack, [isShrinked]);

    },

    setCellTextColor: function (color) {
        var oThis = this;
        var callBack = function()
        {
            var unifill = new AscFormat.CUniFill();
            unifill.setFill(new AscFormat.CSolidFill());
            unifill.fill.setColor(AscFormat.CorrectUniColor(color, null));
            oThis.paragraphAdd(new ParaTextPr({Unifill: unifill}));
        };
        this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_SetCellTextColor);
    },

    setCellBackgroundColor: function (color)
    {
        var fill = new Asc.asc_CShapeFill();
        if(color)
        {
            fill.type = c_oAscFill.FILL_TYPE_SOLID;
            fill.fill = new Asc.asc_CFillSolid();
            fill.fill.color = color;
        }
        else
        {
            fill.type = c_oAscFill.FILL_TYPE_NOFILL;
        }

        this.checkSelectedObjectsAndCallback(this.applyDrawingProps, [{fill: fill}], false, AscDFH.historydescription_Spreadsheet_SetCellBackgroundColor);
    },


    setCellAngle: function (angle) {

        switch (angle)
        {
            case 0 :
            {
                this.checkSelectedObjectsAndCallback(this.applyDrawingProps, [{vert: null}], false, AscDFH.historydescription_Spreadsheet_SetCellVertAlign);
                break;
            }
            case 90 :
            {
                this.checkSelectedObjectsAndCallback(this.applyDrawingProps, [{vert: AscFormat.nVertTTvert}], false, AscDFH.historydescription_Spreadsheet_SetCellVertAlign);
                break;
            }
            case 270:
            {
                this.checkSelectedObjectsAndCallback(this.applyDrawingProps, [{vert: AscFormat.nVertTTvert270}], false, AscDFH.historydescription_Spreadsheet_SetCellVertAlign);
                break;
            }
        }
    },

    setCellStyle: function (name) {
        //TODO:this.checkSelectedObjectsAndCallback(this.setCellStyleCallBack, [name]);
    },

    // Увеличение размера шрифта
    increaseFontSize: function () {
        this.checkSelectedObjectsAndCallback(this.paragraphIncDecFontSize, [true], false, AscDFH.historydescription_Spreadsheet_SetCellIncreaseFontSize);

    },

    // Уменьшение размера шрифта
    decreaseFontSize: function () {
        this.checkSelectedObjectsAndCallback(this.paragraphIncDecFontSize, [false], false, AscDFH.historydescription_Spreadsheet_SetCellDecreaseFontSize);

    },

    deleteSelectedObjects: function(){
        if(Asc["editor"] && Asc["editor"].isChartEditor && (!this.selection.chartSelection)){
            return;
        }
        var oThis = this;
        this.checkSelectedObjectsAndCallback(function(){

            var oSelection  = oThis.selection.groupSelection ? oThis.selection.groupSelection.selection : oThis.selection;
            if(oSelection.chartSelection) {
                oSelection.chartSelection.resetSelection(true);
                oSelection.chartSelection = null;
            }
            if(oSelection.textSelection) {
                oSelection.textSelection = null;
            }
            oThis.removeCallback(-1, undefined, undefined, undefined, undefined, undefined);
            oThis.updateSelectionState();
        }, [], false, AscDFH.historydescription_Spreadsheet_Remove);
    },


    hyperlinkCheck: function(bCheckEnd)
    {
        var content = this.getTargetDocContent();
        if(content)
            return content.IsCursorInHyperlink(bCheckEnd);
        return null;
    },

    hyperlinkCanAdd: function(bCheckInHyperlink)
    {
        var content = this.getTargetDocContent();
        if(content)
        {
            if(this.document && content.Parent && content.Parent instanceof  AscFormat.CTextBody)
                return false;
            return content.CanAddHyperlink(bCheckInHyperlink);
        }
        return false;
    },

    hyperlinkRemove: function()
    {
        var content = this.getTargetDocContent(true);
        if(content)
        {
            var Ret = content.RemoveHyperlink();
            var target_text_object = getTargetTextObject(this);
            if(target_text_object)
            {
                target_text_object.checkExtentsByDocContent && target_text_object.checkExtentsByDocContent();
            }
            return Ret;
        }
        return undefined;
    },

    hyperlinkModify: function( HyperProps )
    {
        var content = this.getTargetDocContent(true);
        if(content)
        {
            var Ret = content.ModifyHyperlink(HyperProps);
            var target_text_object = getTargetTextObject(this);
            if(target_text_object)
            {
                target_text_object.checkExtentsByDocContent && target_text_object.checkExtentsByDocContent();
            }
            return Ret;
        }
        return undefined;
    },

    hyperlinkAdd: function( HyperProps )
    {
        var content = this.getTargetDocContent(true), bCheckExtents = false;
        if(content)
        {
            if(!this.document)
            {
                if ( null != HyperProps.Text && "" != HyperProps.Text && true === content.IsSelectionUse() )
                {
                    this.removeCallback(-1, undefined, undefined, undefined, undefined, true);
                    bCheckExtents = true;
                }
            }
            var Ret = content.AddHyperlink(HyperProps);
            if(bCheckExtents)
            {
                var target_text_object = getTargetTextObject(this);
                if(target_text_object)
                {
                    target_text_object.checkExtentsByDocContent && target_text_object.checkExtentsByDocContent();
                }
            }
            return Ret;
        }
        return null;
    },


    insertHyperlink: function (options) {
        if(!this.getHyperlinkInfo())
        {
            this.checkSelectedObjectsAndCallback(this.hyperlinkAdd, [{Text: options.text, Value: options.hyperlinkModel.Hyperlink, ToolTip: options.hyperlinkModel.Tooltip}], false, AscDFH.historydescription_Spreadsheet_SetCellHyperlinkAdd);
        }
        else
        {
            this.checkSelectedObjectsAndCallback(this.hyperlinkModify, [{Text: options.text, Value: options.hyperlinkModel.Hyperlink, ToolTip: options.hyperlinkModel.Tooltip}], false, AscDFH.historydescription_Spreadsheet_SetCellHyperlinkModify);
        }
    },

    removeHyperlink: function () {
        this.checkSelectedObjectsAndCallback(this.hyperlinkRemove, [], false, AscDFH.historydescription_Spreadsheet_SetCellHyperlinkRemove);
    },

    canAddHyperlink: function() {
        return this.hyperlinkCanAdd();
    },

    getParagraphParaPr: function()
    {
        var target_text_object = getTargetTextObject(this);
        if(target_text_object)
        {
            if(target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                return target_text_object.graphicObject.GetCalculatedParaPr();
            }
            else
            {
                var content = this.getTargetDocContent();
                if(content)
                {
                    return content.GetCalculatedParaPr();
                }
            }
        }
        else
        {
            var result, cur_pr, selected_objects, i;
            var getPropsFromArr = function(arr)
            {
                var cur_pr, result_pr, content;
                for(var i = 0; i < arr.length; ++i)
                {
                    cur_pr = null;
                    if(arr[i].getObjectType() === AscDFH.historyitem_type_GroupShape)
                    {
                        cur_pr = getPropsFromArr(arr[i].arrGraphicObjects);
                    }
                    else
                    {
                        if(arr[i].getDocContent && arr[i].getObjectType() !== AscDFH.historyitem_type_ChartSpace)
                        {
                            content = arr[i].getDocContent();
                            if(content)
                            {
                                content.Set_ApplyToAll(true);
                                cur_pr = content.GetCalculatedParaPr();
                                content.Set_ApplyToAll(false);
                            }
                        }
                    }

                    if(cur_pr)
                    {
                        if(!result_pr)
                            result_pr = cur_pr;
                        else
                            result_pr.Compare(cur_pr);
                    }
                }
                return result_pr;
            };

            if(this.selection.groupSelection)
            {
                result = getPropsFromArr(this.selection.groupSelection.selectedObjects);
            }
            else
            {
                result = getPropsFromArr(this.selectedObjects);
            }
            return result;
        }
    },

    getTheme: function()
    {
        return window["Asc"]["editor"].wbModel.theme;
    },

    getParagraphTextPr: function()
    {
        var target_text_object = getTargetTextObject(this);
        if(target_text_object)
        {
            if(target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                return target_text_object.graphicObject.GetCalculatedTextPr();
            }
            else
            {
                var content = this.getTargetDocContent();
                if(content)
                {
                    return content.GetCalculatedTextPr();
                }
            }
        }
        else
        {
            var result, cur_pr, selected_objects, i;
            var getPropsFromArr = function(arr)
            {
                var cur_pr, result_pr, content;
                for(var i = 0; i < arr.length; ++i)
                {
                    cur_pr = null;
                    if(arr[i].getObjectType() === AscDFH.historyitem_type_GroupShape)
                    {
                        cur_pr = getPropsFromArr(arr[i].arrGraphicObjects);
                    }
                    else if(arr[i].getObjectType() === AscDFH.historyitem_type_ChartSpace)
                    {
                        cur_pr = arr[i].getParagraphTextPr();
                    }
                    else
                    {
                        if(arr[i].getDocContent)
                        {
                            content = arr[i].getDocContent();
                            if(content)
                            {
                                content.Set_ApplyToAll(true);
                                cur_pr = content.GetCalculatedTextPr();
                                content.Set_ApplyToAll(false);
                            }
                        }
                    }

                    if(cur_pr)
                    {
                        if(!result_pr)
                            result_pr = cur_pr;
                        else
                            result_pr.Compare(cur_pr);
                    }
                }
                return result_pr;
            };

            if(this.selection.groupSelection)
            {
                result = getPropsFromArr(this.selection.groupSelection.selectedObjects);
            }
            else if (this.selectedObjects
				&& 1 === this.selectedObjects.length
				&& this.selectedObjects[0].getObjectType() === AscDFH.historyitem_type_ImageShape
				&& this.selectedObjects[0].parent
				&& this.selectedObjects[0].parent.Parent
				&& this.selectedObjects[0].parent.Parent.GetCalculatedTextPr)
			{
				var oParaDrawing = this.selectedObjects[0].parent;
				var oParagraph   = oParaDrawing.Parent;
				oParagraph.Cursor_MoveTo_Drawing(oParaDrawing.Get_Id(), true);
				result = oParagraph.GetCalculatedTextPr();
			}
            else
            {
                result = getPropsFromArr(this.selectedObjects);
            }
            return result;
        }
    },


    getColorMap: function()
    {
        return AscFormat.G_O_DEFAULT_COLOR_MAP;
    },


    editChartDrawingObjects: function(chart)
    {

        if(this.chartForProps)
        {
            this.resetSelection();
            if(this.chartForProps.group)
            {
                var main_group = this.chartForProps.getMainGroup();
                this.selectObject(main_group, 0);
                this.selection.groupSelection = main_group;
                main_group.selectObject(this.chartForProps, 0);
            }
            else
            {
                this.selectObject(this.chartForProps);
            }
            this.chartForProps = null;

        }
        var objects_by_types = this.getSelectedObjectsByTypes();
        if(objects_by_types.charts.length === 1)
        {
            this.checkSelectedObjectsAndCallback(this.editChartCallback, [chart], false, AscDFH.historydescription_Spreadsheet_EditChart);
        }
    },

    getTextArtPreviewManager: function()
    {
        var api = this.getEditorApi();
        return api.textArtPreviewManager;
    },

    resetConnectors: function(aShapes){
        var aAllConnectors = this.getAllConnectors(this.getDrawingArray());
        for(var  i = 0; i < aAllConnectors.length; ++i){
            for(var j = 0; j < aShapes.length; ++j){
                aAllConnectors[i].resetShape(aShapes[j]);
            }
        }
    },

    getConnectorsForCheck: function(){
        var aSelectedObjects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects;
        var aAllConnectors = this.getAllConnectorsByDrawings(aSelectedObjects, [],  undefined, true);
        var _ret = [];
        for(var i = 0;  i < aAllConnectors.length; ++i){
            if(!aAllConnectors[i].selected){
                _ret.push(aAllConnectors[i]);
            }
        }
        return _ret;
    },
    
    getConnectorsForCheck2: function(){
        var aConnectors = this.getConnectorsForCheck();
        var oGroupMaps = {};
        var _ret = [];
        for(var i = 0; i < aConnectors.length; ++i){
            var oGroup = aConnectors[i].getMainGroup();
            if(oGroup){
                oGroupMaps[oGroup.Id] = oGroup;
            }
            else{
                _ret.push(aConnectors[i]);
            }
        }
        for(i in oGroupMaps){
            if(oGroupMaps.hasOwnProperty(i)){
                _ret.push(oGroupMaps[i]);
            }
        }
        return _ret;
    },

    applyDrawingProps: function(props)
    {
        var objects_by_type = this.getSelectedObjectsByTypes(true);
        var i;
        if(AscFormat.isRealNumber(props.verticalTextAlign))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].setVerticalAlign(props.verticalTextAlign);
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].setVerticalAlign(props.verticalTextAlign);
            }
            if(objects_by_type.tables.length == 1)
            {
                var props2 = new Asc.CTableProp();
                if(props.verticalTextAlign === AscFormat.VERTICAL_ANCHOR_TYPE_BOTTOM)
                {
                    props2.put_CellsVAlign(vertalignjc_Bottom);
                }
                else if(props.verticalTextAlign === AscFormat.VERTICAL_ANCHOR_TYPE_CENTER)
                {
                    props2.put_CellsVAlign(vertalignjc_Center);
                }
                else
                {
                    props2.put_CellsVAlign(vertalignjc_Top);
                }
                var target_text_object = getTargetTextObject(this);
                if(target_text_object === objects_by_type.tables[0])
                {
                    objects_by_type.tables[0].graphicObject.Set_Props(props2);
                }
                else
                {
                    objects_by_type.tables[0].graphicObject.SelectAll();
                    objects_by_type.tables[0].graphicObject.Set_Props(props2);
                    objects_by_type.tables[0].graphicObject.RemoveSelection();
                }
                editor.WordControl.m_oLogicDocument.Check_GraphicFrameRowHeight(objects_by_type.tables[0]);
            }
        }

        if(AscFormat.isRealNumber(props.columnNumber))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].setColumnNumber(props.columnNumber);
                objects_by_type.shapes[i].recalculate();
                objects_by_type.shapes[i].checkExtentsByDocContent();
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].setColumnNumber(props.columnNumber);
                objects_by_type.groups[i].recalculate();
                objects_by_type.groups[i].checkExtentsByDocContent();
            }
        }

        if(AscFormat.isRealNumber(props.columnSpace))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].setColumnSpace(props.columnSpace);
                objects_by_type.shapes[i].recalculate();
                objects_by_type.shapes[i].checkExtentsByDocContent();
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].setColumnSpace(props.columnSpace);
                objects_by_type.groups[i].recalculate();
                objects_by_type.groups[i].checkExtentsByDocContent();
            }
        }

        if(AscFormat.isRealNumber(props.vert))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].setVert(props.vert);
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].setVert(props.vert);
            }
        }
        if(isRealObject(props.paddings))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].setPaddings(props.paddings);
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].setPaddings(props.paddings);
            }
        }
        if(typeof(props.type) === "string")
        {
            var aShapes = [];
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                if(objects_by_type.shapes[i].getObjectType() === AscDFH.historyitem_type_Shape){
                    objects_by_type.shapes[i].changePresetGeom(props.type);
                    aShapes.push(objects_by_type.shapes[i]);
                }
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].changePresetGeom(props.type);
                objects_by_type.groups[i].getAllShapes(objects_by_type.groups[i].spTree, aShapes);
            }
            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                objects_by_type.images[i].changePresetGeom(props.type);
                aShapes.push(objects_by_type.images[i]);
            }
            this.resetConnectors(aShapes);
        }
        if(isRealObject(props.stroke))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].changeLine(props.stroke);
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].changeLine(props.stroke);
            }
            for(i = 0; i < objects_by_type.charts.length; ++i)
            {
                objects_by_type.charts[i].changeLine(props.stroke);
            }
            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                objects_by_type.images[i].changeLine(props.stroke);
            }
        }
        if(isRealObject(props.fill))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].changeFill(props.fill);
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].changeFill(props.fill);
            }
            for(i = 0; i < objects_by_type.charts.length; ++i)
            {
                objects_by_type.charts[i].changeFill(props.fill);
            }
        }
        if(isRealObject(props.shadow) || props.shadow === null)
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].changeShadow(props.shadow);
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].changeShadow(props.shadow);
            }
            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                objects_by_type.images[i].changeShadow(props.shadow);
            }
        }

        if(props.title !== null && props.title !== undefined)
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].setTitle(props.title);
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].setTitle(props.title);
            }
            for(i = 0; i < objects_by_type.charts.length; ++i)
            {
                objects_by_type.charts[i].setTitle(props.title);
            }
            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                objects_by_type.images[i].setTitle(props.title);
            }
        }


        if(props.description !== null && props.description !== undefined)
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].setDescription(props.description);
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                objects_by_type.groups[i].setDescription(props.description);
            }
            for(i = 0; i < objects_by_type.charts.length; ++i)
            {
                objects_by_type.charts[i].setDescription(props.description);
            }

            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                objects_by_type.images[i].setDescription(props.description);
            }
        }

        if(props.anchor !== null && props.anchor !== undefined)
        {
            for(i = 0; i < this.selectedObjects.length; ++i)
            {
                CheckSpPrXfrm3(this.selectedObjects[i]);
                this.selectedObjects[i].setDrawingBaseType(props.anchor);
                if(props.anchor === AscCommon.c_oAscCellAnchorType.cellanchorTwoCell)
                {
                    this.selectedObjects[i].setDrawingBaseEditAs(AscCommon.c_oAscCellAnchorType.cellanchorTwoCell);
                }
                this.selectedObjects[i].checkDrawingBaseCoords();
            }
        }


        if(typeof props.ImageUrl === "string" && props.ImageUrl.length > 0)
        {
            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                objects_by_type.images[i].setBlipFill(CreateBlipFillRasterImageId(props.ImageUrl));
            }
        }
        if(props.resetCrop)
        {
            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                if(objects_by_type.images[i].blipFill)
                {
                    var oBlipFill = objects_by_type.images[i].blipFill.createDuplicate();
                    oBlipFill.tile = null;
                    oBlipFill.stretch = true;
                    oBlipFill.srcRect = null;
                    objects_by_type.images[i].setBlipFill(oBlipFill);
                }

            }
        }
        if(props.ChartProperties)
        {
            for(i = 0; i < objects_by_type.charts.length; ++i)
            {
                this.applyPropsToChartSpace(props.ChartProperties, objects_by_type.charts[i]);
            }
        }

        var aGroups = [];
        var bCheckConnectors = false;
        var oApi = editor || Asc['editor'];
        var editorId = oApi.getEditorId();
        var bMoveFlag = true;
        if(AscFormat.isRealNumber(props.Width) || AscFormat.isRealNumber(props.Height))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                CheckSpPrXfrm(objects_by_type.shapes[i]);
                if(!props.SizeRelH && AscFormat.isRealNumber(props.Width))
                {
                    objects_by_type.shapes[i].spPr.xfrm.setExtX(props.Width);
                    if(objects_by_type.shapes[i].parent instanceof ParaDrawing)
                    {
                        objects_by_type.shapes[i].parent.SetSizeRelH({RelativeFrom: c_oAscSizeRelFromH.sizerelfromhPage, Percent: 0});
                    }
                }
                if(!props.SizeRelV && AscFormat.isRealNumber(props.Height))
                {
                    objects_by_type.shapes[i].spPr.xfrm.setExtY(props.Height);
                    if(objects_by_type.shapes[i].parent instanceof ParaDrawing)
                    {
                        objects_by_type.shapes[i].parent.SetSizeRelV({RelativeFrom: c_oAscSizeRelFromV.sizerelfromvPage, Percent: 0});
                    }
                }
                if(objects_by_type.shapes[i].parent instanceof ParaDrawing)
                {
                    var oDrawing =  objects_by_type.shapes[i].parent;
                    if (oDrawing.SizeRelH && !oDrawing.SizeRelV)
                    {
                        oDrawing.SetSizeRelV({RelativeFrom: c_oAscSizeRelFromV.sizerelfromvPage, Percent: 0});
                    }
                    if (oDrawing.SizeRelV && !oDrawing.SizeRelH)
                    {
                        oDrawing.SetSizeRelH({RelativeFrom: c_oAscSizeRelFromH.sizerelfromhPage, Percent: 0});
                    }
                }
                CheckShapeBodyAutoFitReset(objects_by_type.shapes[i], true);
                if(objects_by_type.shapes[i].group)
                {
                    checkObjectInArray(aGroups, objects_by_type.shapes[i].group.getMainGroup());
                }
                objects_by_type.shapes[i].checkDrawingBaseCoords();
            }
            if(!props.SizeRelH && !props.SizeRelV && AscFormat.isRealNumber(props.Width) && AscFormat.isRealNumber(props.Height))
            {
                for(i = 0; i < objects_by_type.images.length; ++i)
                {
                    CheckSpPrXfrm3(objects_by_type.images[i]);
                    objects_by_type.images[i].spPr.xfrm.setExtX(props.Width);
                    objects_by_type.images[i].spPr.xfrm.setExtY(props.Height);
                    if(objects_by_type.images[i].group)
                    {
                        checkObjectInArray(aGroups, objects_by_type.images[i].group.getMainGroup());
                    }
                    objects_by_type.images[i].checkDrawingBaseCoords();
                }
                for(i = 0; i < objects_by_type.charts.length; ++i)
                {
                    CheckSpPrXfrm3(objects_by_type.charts[i]);
                    objects_by_type.charts[i].spPr.xfrm.setExtX(props.Width);
                    objects_by_type.charts[i].spPr.xfrm.setExtY(props.Height);
                    if(objects_by_type.charts[i].group)
                    {
                        checkObjectInArray(aGroups, objects_by_type.charts[i].group.getMainGroup());
                    }
                    objects_by_type.charts[i].checkDrawingBaseCoords();
                }
                for(i = 0; i < objects_by_type.oleObjects.length; ++i)
                {
                    CheckSpPrXfrm3(objects_by_type.oleObjects[i]);
                    objects_by_type.oleObjects[i].spPr.xfrm.setExtX(props.Width);
                    objects_by_type.oleObjects[i].spPr.xfrm.setExtY(props.Height);
                    if(objects_by_type.oleObjects[i].group)
                    {
                        checkObjectInArray(aGroups, objects_by_type.oleObjects[i].group.getMainGroup());
                    }

                    var api = window.editor || window["Asc"]["editor"];
                    if(api)
                    {
                        var pluginData = new Asc.CPluginData();
                        pluginData.setAttribute("data", objects_by_type.oleObjects[i].m_sData);
                        pluginData.setAttribute("guid", objects_by_type.oleObjects[i].m_sApplicationId);
                        pluginData.setAttribute("width", objects_by_type.oleObjects[i].spPr.xfrm.extX);
                        pluginData.setAttribute("height", objects_by_type.oleObjects[i].spPr.xfrm.extY);
                        pluginData.setAttribute("objectId", objects_by_type.oleObjects[i].Get_Id());
                        api.asc_pluginResize(pluginData);
                    }
                    objects_by_type.oleObjects[i].checkDrawingBaseCoords();
                }
            }

            if(editorId === AscCommon.c_oEditorId.Presentation || editorId === AscCommon.c_oEditorId.Spreadsheet){
                bCheckConnectors = true;
                bMoveFlag = false;
            }
        }

        if(AscFormat.isRealBool(props.lockAspect))
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                objects_by_type.shapes[i].setNoChangeAspect(props.lockAspect ? true : undefined);
            }
            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                objects_by_type.images[i].setNoChangeAspect(props.lockAspect ? true : undefined);
            }
            for(i = 0; i < objects_by_type.charts.length; ++i)
            {
                objects_by_type.charts[i].setNoChangeAspect(props.lockAspect ? true : undefined);
            }
        }
        if(isRealObject(props.Position) && AscFormat.isRealNumber(props.Position.X) && AscFormat.isRealNumber(props.Position.Y)
        || AscFormat.isRealBool(props.flipH) || AscFormat.isRealBool(props.flipV) || AscFormat.isRealBool(props.flipHInvert) || AscFormat.isRealBool(props.flipVInvert) || AscFormat.isRealNumber(props.rotAdd) || AscFormat.isRealNumber(props.rot) || AscFormat.isRealNumber(props.anchor))
        {
            var bPosition = isRealObject(props.Position) && AscFormat.isRealNumber(props.Position.X) && AscFormat.isRealNumber(props.Position.Y);
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                CheckSpPrXfrm(objects_by_type.shapes[i]);
                if(bPosition){
                    objects_by_type.shapes[i].spPr.xfrm.setOffX(props.Position.X);
                    objects_by_type.shapes[i].spPr.xfrm.setOffY(props.Position.Y);
                }
                if(AscFormat.isRealBool(props.flipH)){
                    objects_by_type.shapes[i].spPr.xfrm.setFlipH(props.flipH);
                }
                if(AscFormat.isRealBool(props.flipV)){
                    objects_by_type.shapes[i].spPr.xfrm.setFlipV(props.flipV);
                }
                if(props.flipHInvert){
                    objects_by_type.shapes[i].spPr.xfrm.setFlipH(!objects_by_type.shapes[i].flipH);
                }
                if(props.flipVInvert){
                    objects_by_type.shapes[i].spPr.xfrm.setFlipV(!objects_by_type.shapes[i].flipV);
                }
                if(AscFormat.isRealNumber(props.rotAdd)){
                    objects_by_type.shapes[i].spPr.xfrm.setRot(AscFormat.normalizeRotate(objects_by_type.shapes[i].rot + props.rotAdd));
                }
                if(AscFormat.isRealNumber(props.rot)){
                    objects_by_type.shapes[i].spPr.xfrm.setRot(AscFormat.normalizeRotate(props.rot));
                }
                if(objects_by_type.shapes[i].group)
                {
                    checkObjectInArray(aGroups, objects_by_type.shapes[i].group.getMainGroup());
                }
                objects_by_type.shapes[i].checkDrawingBaseCoords();
            }
            for(i = 0; i < objects_by_type.images.length; ++i)
            {
                CheckSpPrXfrm(objects_by_type.images[i]);
                if(bPosition){
                    objects_by_type.images[i].spPr.xfrm.setOffX(props.Position.X);
                    objects_by_type.images[i].spPr.xfrm.setOffY(props.Position.Y);
                }
                if(AscFormat.isRealBool(props.flipH)){
                    objects_by_type.images[i].spPr.xfrm.setFlipH(props.flipH);
                }
                if(AscFormat.isRealBool(props.flipV)){
                    objects_by_type.images[i].spPr.xfrm.setFlipV(props.flipV);
                }
                if(props.flipHInvert){
                    objects_by_type.images[i].spPr.xfrm.setFlipH(!objects_by_type.images[i].flipH);
                }
                if(props.flipVInvert){
                    objects_by_type.images[i].spPr.xfrm.setFlipV(!objects_by_type.images[i].flipV);
                }
                if(AscFormat.isRealNumber(props.rot)){
                    objects_by_type.images[i].spPr.xfrm.setRot(AscFormat.normalizeRotate( props.rot));
                }
                if(AscFormat.isRealNumber(props.rotAdd)){
                    objects_by_type.images[i].spPr.xfrm.setRot(AscFormat.normalizeRotate( objects_by_type.images[i].rot + props.rotAdd));
                }
                if(objects_by_type.images[i].group)
                {
                    checkObjectInArray(aGroups, objects_by_type.images[i].group.getMainGroup());
                }
                objects_by_type.images[i].checkDrawingBaseCoords();
            }
            if(bPosition){
                for(i = 0; i < objects_by_type.charts.length; ++i)
                {
                    CheckSpPrXfrm(objects_by_type.charts[i]);
                    objects_by_type.charts[i].spPr.xfrm.setOffX(props.Position.X);
                    objects_by_type.charts[i].spPr.xfrm.setOffY(props.Position.Y);
                    if(objects_by_type.charts[i].group)
                    {
                        checkObjectInArray(aGroups, objects_by_type.charts[i].group.getMainGroup());
                    }
                    objects_by_type.charts[i].checkDrawingBaseCoords();
                }
            }
            if(editorId === AscCommon.c_oEditorId.Presentation || editorId === AscCommon.c_oEditorId.Spreadsheet){
                bCheckConnectors = true;
            }
        }

        if(bCheckConnectors){
            var aConnectors = this.getConnectorsForCheck();
            for(i = 0; i < aConnectors.length; ++i){
                aConnectors[i].calculateTransform(bMoveFlag);
                var oGroup = aConnectors[i].getMainGroup();
                if(oGroup){
                    checkObjectInArray(aGroups, oGroup);
                }
            }
        }

        for(i = 0; i < aGroups.length; ++i)
        {
            aGroups[i].updateCoordinatesAfterInternalResize();
        }

        var bRecalcText = false;
        if(props.textArtProperties)
        {
            var  oAscTextArtProperties = props.textArtProperties;
            var oParaTextPr;
            var nStyle = oAscTextArtProperties.asc_getStyle();
            var bWord = (typeof CGraphicObjects !== "undefined" &&  (this instanceof CGraphicObjects));
            if(AscFormat.isRealNumber(nStyle))
            {
                var oPreviewManager = this.getTextArtPreviewManager();
                var oStyleTextPr = oPreviewManager.getStylesToApply()[nStyle].Copy();
                if(bWord)
                {
                    oParaTextPr = new ParaTextPr({TextFill: oStyleTextPr.TextFill, TextOutline: oStyleTextPr.TextOutline});
                }
                else
                {
                    oParaTextPr = new ParaTextPr({Unifill: oStyleTextPr.TextFill, TextOutline: oStyleTextPr.TextOutline});
                }
            }
            else
            {
                var oAscFill = oAscTextArtProperties.asc_getFill(), oAscStroke = oAscTextArtProperties.asc_getLine();
                if(oAscFill || oAscStroke)
                {
                    if(bWord)
                    {
                        oParaTextPr = new ParaTextPr({AscFill: oAscFill, AscLine: oAscStroke});
                    }
                    else
                    {
                        oParaTextPr = new ParaTextPr({AscUnifill: oAscFill, AscLine: oAscStroke});
                    }
                }
            }
            if(oParaTextPr)
            {
                bRecalcText = true;

                if(this.document && this.document.TurnOff_Recalculate)
                {
                    this.document.TurnOff_Recalculate();
                }

                this.paragraphAdd(oParaTextPr);

                if(this.document && this.document.TurnOn_Recalculate)
                {
                    this.document.TurnOn_Recalculate();
                }
            }
            var oPreset = oAscTextArtProperties.asc_getForm();
            if(typeof oPreset === "string")
            {
                for(i = 0; i < objects_by_type.shapes.length; ++i)
                {
                    objects_by_type.shapes[i].applyTextArtForm(oPreset);
                }
                for(i = 0; i < objects_by_type.groups.length; ++i)
                {
                    objects_by_type.groups[i].applyTextArtForm(oPreset);
                }
                this.resetTextSelection();
            }
        }
        var oApi = this.getEditorApi();
        if(oApi && oApi.noCreatePoint && !oApi.exucuteHistory)
        {
            for(i = 0; i < objects_by_type.shapes.length; ++i)
            {
                if(bRecalcText)
                {
                    objects_by_type.shapes[i].recalcText();
                    if(bWord)
                    {
                        objects_by_type.shapes[i].recalculateText();
                    }
                }
                objects_by_type.shapes[i].recalculate();
            }
            for(i = 0; i < objects_by_type.groups.length; ++i)
            {
                if(bRecalcText)
                {
                    objects_by_type.groups[i].recalcText();
                    if(bWord)
                    {
                        objects_by_type.shapes[i].recalculateText();
                    }
                }
                objects_by_type.groups[i].recalculate();
            }
        }
        return objects_by_type;
    },

    getSelectedObjectsByTypes: function(bGroupedObjects)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects;
        return getObjectsByTypesFromArr(selected_objects, bGroupedObjects);
    },

    editChartCallback: function(chartSettings)
    {
        var objects_by_types = this.getSelectedObjectsByTypes();
        if(objects_by_types.charts.length === 1)
        {
            var chart_space = objects_by_types.charts[0];
            this.applyPropsToChartSpace(chartSettings, chart_space);
        }
    },

    applyPropsToChartSpace: function(chartSettings, chartSpace)
    {
        var chart_space = chartSpace;
        var style_index = chartSettings.getStyle();
        var sRange = chartSettings.getRange();
        var b_clear_formatting = false;
        chartSpace.resetSelection(true);
        var oPr = this.getPropsFromChart(chart_space);
        if(oPr.isEqual(chartSettings)){


            var oChartType = chart_space && chart_space.chart && chart_space.chart.plotArea && chart_space.chart.plotArea.charts[0];
            if(!oChartType){
                return;
            }
            //подписи данных
            if(typeof oChartType.setDLbls === "function" && AscFormat.isRealNumber(chartSettings.getDataLabelsPos()) && chartSettings.getDataLabelsPos() !== c_oAscChartDataLabelsPos.none)
            {
                if(oChartType.dLbls && oChartType.dLbls.bDelete){
                    oChartType.dLbls.setDelete(false);
                }
                for(var i = 0; i < oChartType.series.length; ++i){
                    var oSerie = oChartType.series[i];
                    if(oSerie.dLbls){
                        if(oSerie.dLbls.bDelete){
                            oSerie.dLbls.setDelete(false);
                            for(var j = 0; j < oSerie.dLbls.dLbl.length; ++j){
                                if(oSerie.dLbls.dLbl[j].bDelete){
                                    oSerie.dLbls.dLbl[j].setDelete(false);
                                }
                            }
                        }
                    }
                }
            }

            return;
        }

        //for bug http://bugzilla.onlyoffice.com/show_bug.cgi?id=35570
        var type = chartSettings.getType();
        if(oPr.getType() === type){
            chartSettings.type = null;
            var testChartSettings = new Asc.asc_ChartSettings();
            if(testChartSettings.isEqual(chartSettings)){
                chartSettings.type = type;
                return;
            }
            chartSettings.type = type;
        }

        //Title Settings
        chart_space.setChart(chart_space.chart.createDuplicate());

        /*if(AscFormat.isRealNumber(style_index) && style_index > 0 && style_index < 49 && chart_space.style !== style_index)
        {
            if(!b_clear_formatting)
            {
                chart_space.clearFormatting();
            }
            chart_space.setStyle(style_index);
        }*/

        var chart = chart_space.chart;
        var plot_area = chart.plotArea;
        if(AscFormat.isRealNumber(style_index)){
            --style_index;
            var oCurChartSettings = oPr;
            var _cur_type = oCurChartSettings.type;
            if(AscCommon.g_oChartPresets[_cur_type] && AscCommon.g_oChartPresets[_cur_type][style_index]){

                plot_area.removeCharts(1, plot_area.charts.length - 1);
                AscFormat.ApplyPresetToChartSpace(chartSpace, AscCommon.g_oChartPresets[_cur_type][style_index], chartSettings.bCreate);
                return;
            }
        }


        chart_space.updateLinks();
        var oValAx = chart_space.chart.plotArea.valAx;
        var oCatAx = chart_space.chart.plotArea.catAx;
        chart_space.setStyle(chart_space.style);
        if(this.drawingObjects && this.drawingObjects.getWorksheet && typeof sRange === "string" && sRange.length > 0)
        {
            var ws_view = this.drawingObjects.getWorksheet();
            var parsed_formula = parserHelp.parse3DRef(sRange);
            if(parsed_formula)
            {

                var ws = ws_view.model.workbook.getWorksheetByName(parsed_formula.sheet);
                var new_bbox;
                var range_object = ws.getRange2(parsed_formula.range);
                if(range_object)
                {
                    new_bbox = range_object.bbox;
                }
                if(ws && new_bbox )
                {
                    var oCommonBBox = chart_space.getCommonBBox();
                    var b_equal_bbox = oCommonBBox && oCommonBBox.r1 === new_bbox.r1
                        && oCommonBBox.r2 === new_bbox.r2
                        && oCommonBBox.c1 === new_bbox.c1
                        && oCommonBBox.c2 === new_bbox.c2;
                    var b_equal_ws = chart_space.bbox && chart_space.bbox.worksheet === ws;
                    var b_equal_vert = chart_space.bbox && chartSettings.getInColumns() === !chart_space.bbox.seriesBBox.bVert;

                    var bLimit = (Math.abs(new_bbox.r2 - new_bbox.r1) > 4096 || Math.abs(new_bbox.c2 - new_bbox.c1) > 4096);
                    if(!(chart_space.bbox && chart_space.bbox.seriesBBox && b_equal_ws
                        && b_equal_bbox && b_equal_vert ) && !bLimit)
                    {
                        var catHeadersBBox, serHeadersBBox;
                        if(chart_space.bbox && b_equal_bbox && b_equal_ws && !b_equal_vert)
                        {
                            if(chart_space.bbox.catBBox)
                                serHeadersBBox = {r1: chart_space.bbox.catBBox.r1, r2: chart_space.bbox.catBBox.r2,
                                    c1: chart_space.bbox.catBBox.c1, c2: chart_space.bbox.catBBox.c2};
                            if(chart_space.bbox.serBBox)
                                catHeadersBBox = {r1: chart_space.bbox.serBBox.r1, r2: chart_space.bbox.serBBox.r2,
                                    c1: chart_space.bbox.serBBox.c1, c2: chart_space.bbox.serBBox.c2};
                        }
                        var chartSeries = AscFormat.getChartSeries(ws_view.model, chartSettings, catHeadersBBox, serHeadersBBox);
                        //chart_space.clearFormatting(true);
                        b_clear_formatting = true;
                        chart_space.rebuildSeriesFromAsc(chartSeries);
                        if(chart_space.pivotSource){
                            chart_space.setPivotSource(null);
                        }
                    }
                }
            }
        }


        var title_show_settings = chartSettings.getTitle();
        if(title_show_settings === c_oAscChartTitleShowSettings.none)
        {
            if(chart.title)
            {
                chart.setTitle(null);
            }
        }
        else if(title_show_settings === c_oAscChartTitleShowSettings.noOverlay
            || title_show_settings === c_oAscChartTitleShowSettings.overlay)
        {
            if(!chart.title)
            {
                chart.setTitle(new AscFormat.CTitle());
            }
            if(chart.title.overlay !== (title_show_settings === c_oAscChartTitleShowSettings.overlay))
            {
                chart.title.setOverlay(title_show_settings === c_oAscChartTitleShowSettings.overlay);
            }
        }
        //horAxisLabel


        //legend
        var legend_pos_settings =  chartSettings.getLegendPos();
        if(legend_pos_settings !== null)
        {
            if(legend_pos_settings === c_oAscChartLegendShowSettings.none)
            {
                if(chart.legend)
                {
                    chart.setLegend(null);
                }
            }
            else
            {
                if(!chart.legend)
                {
                    chart.setLegend(new AscFormat.CLegend());
                }
                if(chart.legend.legendPos !== legend_pos_settings && legend_pos_settings !== c_oAscChartLegendShowSettings.layout)
                    chart.legend.setLegendPos(legend_pos_settings);
                var b_overlay = c_oAscChartLegendShowSettings.leftOverlay === legend_pos_settings || legend_pos_settings === c_oAscChartLegendShowSettings.rightOverlay;
                if(chart.legend.overlay !== b_overlay)
                {
                    chart.legend.setOverlay(b_overlay);
                }
            }
        }


        var chart_type = plot_area.charts[0];
        plot_area.removeCharts(1, plot_area.charts.length - 1);
        //Data Labels
        var i;
        var need_groupping, need_num_fmt, need_bar_dir;
        var val_axis, new_chart_type, object_type, axis_obj ;
        var axis_by_types;
        var val_ax, cat_ax;
        object_type = chart_type.getObjectType();
        var sDefaultValAxFormatCode = null;
        if(chart_type && chart_type.series[0]){
            var aPoints = AscFormat.getPtsFromSeries(chart_type.series[0]);
            if(aPoints[0] && typeof aPoints[0].formatCode === "string" && aPoints[0].formatCode.length > 0){
                sDefaultValAxFormatCode = aPoints[0].formatCode;
            }
        }
        need_num_fmt = sDefaultValAxFormatCode;

        var checkSwapAxis = function(plotArea, chartType, newChartType)
        {
            if(chartType.getAxisByTypes )
            {
                var axis_by_types = chartType.getAxisByTypes(), cat_ax, val_ax;
                if(axis_by_types.catAx.length > 0 && axis_by_types.valAx.length > 0)
                {
                    cat_ax = axis_by_types.catAx[0];
                    val_ax = axis_by_types.valAx[0];
                }
            }
            if(!val_ax || !cat_ax)
            {
                var axis_obj = AscFormat.CreateDefaultAxises(need_num_fmt ? need_num_fmt : "General");
                cat_ax = axis_obj.catAx;
                val_ax = axis_obj.valAx;



                if(oValAx && oValAx instanceof AscFormat.CValAx){
                    oValAx.createDuplicate(val_ax);
                    val_ax.numFmt.setFormatCode(need_num_fmt);
                }
                if(oCatAx){
                    if(oCatAx.majorGridlines)
                    {
                        axis_obj.catAx.setMajorGridlines(oCatAx.majorGridlines.createDuplicate());
                    }
                    axis_obj.catAx.setMajorTickMark(oCatAx.majorTickMark);

                    if(oCatAx.minorGridlines)
                    {
                        axis_obj.catAx.setMinorGridlines(oCatAx.minorGridlines.createDuplicate());
                    }
                    axis_obj.catAx.setMinorTickMark(oCatAx.minorTickMark);

                    if(oCatAx.spPr)
                    {
                        axis_obj.catAx.setSpPr(oCatAx.spPr.createDuplicate());
                    }
                    axis_obj.catAx.setTickLblPos(oCatAx.tickLblPos);
                    if(oCatAx.title)
                    {
                        axis_obj.catAx.setTitle(oCatAx.title.createDuplicate());
                    }
                    if(oCatAx.txPr)
                    {
                        axis_obj.catAx.setTxPr(oCatAx.txPr.createDuplicate());
                    }
                }

            }
            if(cat_ax && val_ax)
            {
                if(newChartType.getObjectType() === AscDFH.historyitem_type_BarChart && newChartType.barDir === BAR_DIR_BAR)
                {
                    if(cat_ax.axPos !== AscFormat.AX_POS_L)
                    {
                        cat_ax.setAxPos(AscFormat.AX_POS_L);
                    }
                    if(val_ax.axPos !== AscFormat.AX_POS_B)
                    {
                        val_ax.setAxPos(AscFormat.AX_POS_B);
                    }
                }
                else
                {
                    if(cat_ax.axPos !== AscFormat.AX_POS_B)
                    {
                        cat_ax.setAxPos(AscFormat.AX_POS_B);
                    }
                    if(val_ax.axPos !== AscFormat.AX_POS_L)
                    {
                        val_ax.setAxPos(AscFormat.AX_POS_L);
                    }
                }
                newChartType.addAxId(cat_ax);
                newChartType.addAxId(val_ax);
                plotArea.addAxis(cat_ax);
                plotArea.addAxis(val_ax);
            }
        };

        var replaceChart = function(plotArea, chartType, newChartType)
        {
            plotArea.addChart(newChartType, 0);
            plotArea.removeCharts(1, plotArea.charts.length - 1);
            newChartType.setFromOtherChart(chartType);
            if(newChartType.getObjectType() !== AscDFH.historyitem_type_PieChart && newChartType.getObjectType() !== AscDFH.historyitem_type_DoughnutChart)
            {
                if(newChartType.setVaryColors && newChartType.varyColors === true)
                {
                    newChartType.setVaryColors(false);
                }
            }
        };

        switch(type)
        {
            case c_oAscChartTypeSettings.barNormal     :
            case c_oAscChartTypeSettings.barStacked    :
            case c_oAscChartTypeSettings.barStackedPer :
            case c_oAscChartTypeSettings.barNormal3d           :
            case c_oAscChartTypeSettings.barStacked3d          :
            case c_oAscChartTypeSettings.barStackedPer3d       :
            case c_oAscChartTypeSettings.barNormal3dPerspective:
            case c_oAscChartTypeSettings.hBarNormal    :
            case c_oAscChartTypeSettings.hBarStacked   :
            case c_oAscChartTypeSettings.hBarStackedPer:
            case c_oAscChartTypeSettings.hBarNormal3d:
            case c_oAscChartTypeSettings.hBarStacked3d:
            case c_oAscChartTypeSettings.hBarStackedPer3d:
            {
                if(type === c_oAscChartTypeSettings.barNormal || type === c_oAscChartTypeSettings.hBarNormal
                    || type === c_oAscChartTypeSettings.barNormal3d || type === c_oAscChartTypeSettings.hBarNormal3d )
                    need_groupping = BAR_GROUPING_CLUSTERED;
                else if(type === c_oAscChartTypeSettings.barStacked || type === c_oAscChartTypeSettings.hBarStacked
                    || type === c_oAscChartTypeSettings.barStacked3d || type === c_oAscChartTypeSettings.hBarStacked3d)
                    need_groupping = BAR_GROUPING_STACKED;
                else if(type === c_oAscChartTypeSettings.barNormal3dPerspective)
                    need_groupping = BAR_GROUPING_STANDARD;
                else
                    need_groupping = BAR_GROUPING_PERCENT_STACKED;

                var bNeed3D = type === c_oAscChartTypeSettings.barNormal3d || type === c_oAscChartTypeSettings.barStacked3d
                    || type === c_oAscChartTypeSettings.barStackedPer3d || type === c_oAscChartTypeSettings.barNormal3dPerspective
                    || type === c_oAscChartTypeSettings.hBarNormal3d || type === c_oAscChartTypeSettings.hBarStacked3d || type === c_oAscChartTypeSettings.hBarStackedPer3d;

                if( type === c_oAscChartTypeSettings.barNormal || type === c_oAscChartTypeSettings.barStacked
                    || type === c_oAscChartTypeSettings.barNormal3d || type === c_oAscChartTypeSettings.barStacked3d
                    || type === c_oAscChartTypeSettings.hBarNormal || type === c_oAscChartTypeSettings.hBarStacked
                    || type === c_oAscChartTypeSettings.hBarNormal3d || type === c_oAscChartTypeSettings.hBarStacked3d
                    || type === c_oAscChartTypeSettings.barNormal3dPerspective){
                    need_num_fmt = sDefaultValAxFormatCode;

                }
                else
                    need_num_fmt = "0%";

                if(type === c_oAscChartTypeSettings.barNormal || type === c_oAscChartTypeSettings.barStacked || type === c_oAscChartTypeSettings.barStackedPer
                    || type === c_oAscChartTypeSettings.barNormal3d || type === c_oAscChartTypeSettings.barStacked3d || type === c_oAscChartTypeSettings.barStackedPer3d  || type === c_oAscChartTypeSettings.barNormal3dPerspective)
                    need_bar_dir = BAR_DIR_COL;
                else
                    need_bar_dir = BAR_DIR_BAR;

                if(chart_type.getObjectType() === AscDFH.historyitem_type_BarChart)
                {
                    var bChangedGrouping = false;
                    var nOldGrouping = chart_type.grouping;
                    if(chart_type.grouping !== need_groupping)
                    {
                        chart_type.setGrouping(need_groupping);
                        bChangedGrouping = true;
                    }

                    if(!AscFormat.isRealNumber(chart_type.gapWidth))
                    {
                        chart_type.setGapWidth(150);
                    }
                    if(BAR_GROUPING_PERCENT_STACKED === need_groupping || BAR_GROUPING_STACKED === need_groupping)
                    {
                        if(!AscFormat.isRealNumber(chart_type.overlap) || nOldGrouping !== BAR_GROUPING_PERCENT_STACKED || nOldGrouping !== BAR_GROUPING_STACKED)
                        {
                            chart_type.setOverlap(100);
                        }
                    }
                    else
                    {
                        if(bChangedGrouping && chart_type.overlap !== null)
                        {
                            chart_type.setOverlap(null);
                        }
                    }

                    axis_by_types = chart_type.getAxisByTypes();
                    if(chart_type.barDir !== need_bar_dir)
                    {
                        val_axis = axis_by_types.valAx;
                        if(need_bar_dir === BAR_DIR_BAR)
                        {
                            for(i = 0; i < val_axis.length; ++i)
                                val_axis[i].setAxPos(AscFormat.AX_POS_B);

                            for(i = 0; i < axis_by_types.catAx.length; ++i)
                                axis_by_types.catAx[i].setAxPos(AscFormat.AX_POS_L);
                        }
                        else
                        {
                            for(i = 0; i < val_axis.length; ++i)
                                val_axis[i].setAxPos(AscFormat.AX_POS_L);

                            for(i = 0; i < axis_by_types.catAx.length; ++i)
                                axis_by_types.catAx[i].setAxPos(AscFormat.AX_POS_B);
                        }
                        chart_type.setBarDir(need_bar_dir);
                    }

                    if(bNeed3D)
                    {
                        if(!chart_type.b3D)
                        {
                            chart_type.set3D(true);
                        }
                        if(!chart.view3D)
                        {
                            chart.setView3D(new AscFormat.CView3d());
                        }

                        var oView3d = chart.view3D;
                        if(!AscFormat.isRealNumber(oView3d.rotX))
                        {
                            oView3d.setRotX(15);
                        }
                        if(!AscFormat.isRealNumber(oView3d.rotY))
                        {
                            oView3d.setRotY(20);
                        }
                        if(!AscFormat.isRealBool(oView3d.rAngAx))
                        {
                            oView3d.setRAngAx(true);
                        }
                        if(c_oAscChartTypeSettings.barNormal3dPerspective === type)
                        {
                            if(!AscFormat.isRealNumber(oView3d.depthPercent))
                            {
                                oView3d.setDepthPercent(100);
                            }
                        }
                        else
                        {
                            if(null !== oView3d.depthPercent)
                            {
                                oView3d.setDepthPercent(null);
                            }
                        }

                        chart.setDefaultWalls();
                    }
                    else
                    {
                        if(chart_type.b3D)
                        {
                            chart_type.set3D(false);
                        }
                        if(chart.view3D)
                        {
                            chart.setView3D(null);
                        }
                        if(chart.floor)
                        {
                            chart.setFloor(null);
                        }
                        if(chart.sideWall)
                        {
                            chart.setSideWall(null);
                        }
                        if(chart.backWall)
                        {
                            chart.setBackWall(null);
                        }
                    }
                    val_axis = axis_by_types.valAx;
                    for(i = 0; i < val_axis.length; ++i)
                    {
                        if(!val_axis[i].numFmt)
                        {
                            val_axis[i].setNumFmt(new AscFormat.CNumFmt());
                            val_axis[i].numFmt.setFormatCode(sDefaultValAxFormatCode ? sDefaultValAxFormatCode : "General");
                            val_axis[i].numFmt.setSourceLinked(true);
                        }
                        if(need_num_fmt && val_axis[i].numFmt.formatCode !== need_num_fmt)
                            val_axis[i].numFmt.setFormatCode(need_num_fmt);
                    }
                }
                else
                {
                    new_chart_type = new AscFormat.CBarChart();
                    replaceChart(plot_area, chart_type, new_chart_type);
                    new_chart_type.setBarDir(need_bar_dir);
                    checkSwapAxis(plot_area, chart_type, new_chart_type);
                    new_chart_type.setGrouping(need_groupping);
                    new_chart_type.setGapWidth(150);

                    if(BAR_GROUPING_PERCENT_STACKED === need_groupping || BAR_GROUPING_STACKED === need_groupping)
                        new_chart_type.setOverlap(100);

                    if(bNeed3D)
                    {
                        if(!chart.view3D){
                            chart.setView3D(AscFormat.CreateView3d(15, 20, true, c_oAscChartTypeSettings.barNormal3dPerspective === type ? 100 : undefined));
                            chart.setDefaultWalls();
                        }
                        if(!new_chart_type.b3D){
                            new_chart_type.set3D(true);
                        }

                    }
                    else
                    {
                        if(chart.view3D)
                        {
                            chart.setView3D(null);
                        }
                        if(chart.floor)
                        {
                            chart.setFloor(null);
                        }
                        if(chart.sideWall)
                        {
                            chart.setSideWall(null);
                        }
                        if(chart.backWall)
                        {
                            chart.setBackWall(null);
                        }
                    }

                    axis_by_types = new_chart_type.getAxisByTypes();
                    val_axis = axis_by_types.valAx;
                    for(i = 0; i < val_axis.length; ++i)
                    {
                        if(!val_axis[i].numFmt)
                        {
                            val_axis[i].setNumFmt(new AscFormat.CNumFmt());
                            val_axis[i].numFmt.setFormatCode(sDefaultValAxFormatCode ? sDefaultValAxFormatCode : "General");
                            val_axis[i].numFmt.setSourceLinked(true);
                        }
                        if(need_num_fmt && val_axis[i].numFmt.formatCode !== need_num_fmt)
                            val_axis[i].numFmt.setFormatCode(need_num_fmt);
                        if(need_bar_dir = BAR_DIR_BAR)
                            val_axis[i].setAxPos(AscFormat.AX_POS_B);
                    }
                    if(need_bar_dir = BAR_DIR_BAR)
                    {
                        for(i = 0; i < axis_by_types.catAx.length; ++i)
                            axis_by_types.catAx[i].setAxPos(AscFormat.AX_POS_L);
                    }
                }
                break;
            }
            case c_oAscChartTypeSettings.lineNormal           :
            case c_oAscChartTypeSettings.lineStacked          :
            case c_oAscChartTypeSettings.lineStackedPer      :
            case c_oAscChartTypeSettings.lineNormalMarker    :
            case c_oAscChartTypeSettings.lineStackedMarker   :
            case c_oAscChartTypeSettings.lineStackedPerMarker:
            case c_oAscChartTypeSettings.line3d:
            {
                if(type === c_oAscChartTypeSettings.lineNormal || type === c_oAscChartTypeSettings.lineNormalMarker || type === c_oAscChartTypeSettings.line3d)
                    need_groupping = GROUPING_STANDARD;
                else if(type === c_oAscChartTypeSettings.lineStacked || type === c_oAscChartTypeSettings.lineStackedMarker)
                    need_groupping = GROUPING_STACKED;
                else
                    need_groupping = GROUPING_PERCENT_STACKED;

                if(type === c_oAscChartTypeSettings.lineNormal || type === c_oAscChartTypeSettings.lineStacked  || type === c_oAscChartTypeSettings.line3d
                    || type === c_oAscChartTypeSettings.lineNormalMarker || type === c_oAscChartTypeSettings.lineStackedMarker)
                    need_num_fmt = sDefaultValAxFormatCode;
                else
                    need_num_fmt = "0%";

                var b_marker = chartSettings.getShowMarker();

                if(chart_type.getObjectType() === AscDFH.historyitem_type_LineChart)
                {
                    if(chart_type.grouping !== need_groupping)
                        chart_type.setGrouping(need_groupping);
                    val_axis = chart_type.getAxisByTypes().valAx;
                    for(i = 0; i < val_axis.length; ++i)
                    {
                        if(!val_axis[i].numFmt)
                        {
                            val_axis[i].setNumFmt(new AscFormat.CNumFmt());
                            val_axis[i].numFmt.setFormatCode(sDefaultValAxFormatCode ? sDefaultValAxFormatCode : "General");
                            val_axis[i].numFmt.setSourceLinked(true);
                        }
                        if(need_num_fmt && val_axis[i].numFmt.formatCode !== need_num_fmt)
                            val_axis[i].numFmt.setFormatCode(need_num_fmt);
                    }



                    if(type === c_oAscChartTypeSettings.line3d)
                    {

                        if(!chart.view3D)
                        {
                            chart.setView3D(new AscFormat.CView3d());
                        }

                        var oView3d = chart.view3D;
                        if(!AscFormat.isRealNumber(oView3d.rotX))
                        {
                            oView3d.setRotX(15);
                        }
                        if(!AscFormat.isRealNumber(oView3d.rotY))
                        {
                            oView3d.setRotY(20);
                        }
                        if(!AscFormat.isRealBool(oView3d.rAngAx))
                        {
                            oView3d.setRAngAx(true);
                        }
                        if(!AscFormat.isRealNumber(oView3d.depthPercent))
                        {
                            oView3d.setDepthPercent(100);
                        }
                        chart.setDefaultWalls();
                    }
                    else
                    {
                        if(chart.view3D)
                        {
                            chart.setView3D(null);
                            chartSettings.bLine = true;
                            new_chart_type = new AscFormat.CLineChart();
                            replaceChart(plot_area, chart_type, new_chart_type);
                            checkSwapAxis(plot_area, chart_type, new_chart_type);
                        }
                        if(chart.floor)
                        {
                            chart.setFloor(null);
                        }
                        if(chart.sideWall)
                        {
                            chart.setSideWall(null);
                        }
                        if(chart.backWall)
                        {
                            chart.setBackWall(null);
                        }
                    }

                   // if((AscFormat.isRealBool(chart_type.marker) && chart_type.marker) !== b_marker)
                   //     chart_type.setMarker(b_marker);
                }
                else
                {


                    new_chart_type = new AscFormat.CLineChart();
                    replaceChart(plot_area, chart_type, new_chart_type);
                    checkSwapAxis(plot_area, chart_type, new_chart_type);
                    val_axis = new_chart_type.getAxisByTypes().valAx;
                    for(i = 0; i < val_axis.length; ++i)
                    {
                        if(!val_axis[i].numFmt)
                        {
                            val_axis[i].setNumFmt(new AscFormat.CNumFmt());
                            val_axis[i].numFmt.setFormatCode(sDefaultValAxFormatCode ? sDefaultValAxFormatCode : "General");
                            val_axis[i].numFmt.setSourceLinked(true);
                        }
                        if(need_num_fmt && val_axis[i].numFmt.formatCode !== need_num_fmt)
                            val_axis[i].numFmt.setFormatCode(need_num_fmt);
                    }
                    if(type === c_oAscChartTypeSettings.line3d)
                    {
                        if(!chart.view3D){
                            chart.setView3D(AscFormat.CreateView3d(15, 20, true, 100));
                            chart.setDefaultWalls();
                        }
                    }
                    else
                    {
                        if(chart.view3D)
                        {
                            chart.setView3D(null);
                        }
                        if(chart.floor)
                        {
                            chart.setFloor(null);
                        }
                        if(chart.sideWall)
                        {
                            chart.setSideWall(null);
                        }
                        if(chart.backWall)
                        {
                            chart.setBackWall(null);
                        }
                    }
                    //new_chart_type.setMarker(b_marker);
                    new_chart_type.setGrouping(need_groupping);
                }
                break;
            }
            case c_oAscChartTypeSettings.pie:
            case c_oAscChartTypeSettings.pie3d:
            {
                if(chart_type.getObjectType() !== AscDFH.historyitem_type_PieChart)
                {
                    new_chart_type = new AscFormat.CPieChart();
                    replaceChart(plot_area, chart_type, new_chart_type);
                    new_chart_type.setVaryColors(true);
                    if(type === c_oAscChartTypeSettings.pie3d)
                    {
                        if(!chart.view3D){
                            chart.setView3D(AscFormat.CreateView3d(30, 0, true, 100));
                            chart.setDefaultWalls();
                        }
                        if(!chart.view3D.rAngAx){
                            chart.view3D.setRAngAx(true);
                        }
                        if(chart.view3D.rotX < 0){
                            chart.view3D.rotX = 30;
                        }
                    }
                    else
                    {
                        if(chart.view3D)
                        {
                            chart.setView3D(null);
                        }
                        if(chart.floor)
                        {
                            chart.setFloor(null);
                        }
                        if(chart.sideWall)
                        {
                            chart.setSideWall(null);
                        }
                        if(chart.backWall)
                        {
                            chart.setBackWall(null);
                        }
                    }
                }
                else
                {
                    if(type === c_oAscChartTypeSettings.pie3d)
                    {
                        if(!chart.view3D)
                        {
                            chart.setView3D(new AscFormat.CView3d());
                        }

                        var oView3d = chart.view3D;
                        if(!AscFormat.isRealNumber(oView3d.rotX))
                        {
                            oView3d.setRotX(30);
                        }
                        if(!AscFormat.isRealNumber(oView3d.rotY))
                        {
                            oView3d.setRotY(0);
                        }
                        if(!AscFormat.isRealBool(oView3d.rAngAx))
                        {
                            oView3d.setRAngAx(true);
                        }
                        if(!AscFormat.isRealNumber(oView3d.depthPercent))
                        {
                            oView3d.setDepthPercent(100);
                        }
                        chart.setDefaultWalls();
                    }
                    else
                    {
                        if(chart.view3D)
                        {
                            chart.setView3D(null);
                        }
                        if(chart.floor)
                        {
                            chart.setFloor(null);
                        }
                        if(chart.sideWall)
                        {
                            chart.setSideWall(null);
                        }
                        if(chart.backWall)
                        {
                            chart.setBackWall(null);
                        }
                    }
                }
                break;
            }
            case c_oAscChartTypeSettings.doughnut:
            {
                if(chart_type.getObjectType() !== AscDFH.historyitem_type_DoughnutChart)
                {
                    new_chart_type = new AscFormat.CDoughnutChart();
                    replaceChart(plot_area, chart_type, new_chart_type);
                    new_chart_type.setVaryColors(true);
                    new_chart_type.setHoleSize(50);
                }
                break;
            }
            case c_oAscChartTypeSettings.areaNormal:
            case c_oAscChartTypeSettings.areaStacked:
            case c_oAscChartTypeSettings.areaStackedPer:
            {

                if(type === c_oAscChartTypeSettings.areaNormal)
                    need_groupping = GROUPING_STANDARD;
                else if(type === c_oAscChartTypeSettings.areaStacked)
                    need_groupping = GROUPING_STACKED;
                else
                    need_groupping = GROUPING_PERCENT_STACKED;

                if(type === c_oAscChartTypeSettings.areaNormal || type === c_oAscChartTypeSettings.areaStacked)
                    need_num_fmt = sDefaultValAxFormatCode;
                else
                    need_num_fmt = "0%";

                if(chart_type.getObjectType() === AscDFH.historyitem_type_AreaChart)
                {
                    if(chart_type.grouping !== need_groupping)
                        chart_type.setGrouping(need_groupping);
                    val_axis = chart_type.getAxisByTypes().valAx;
                    for(i = 0; i < val_axis.length; ++i)
                    {
                        if(!val_axis[i].numFmt)
                        {
                            val_axis[i].setNumFmt(new AscFormat.CNumFmt());
                            val_axis[i].numFmt.setFormatCode(sDefaultValAxFormatCode ? sDefaultValAxFormatCode : "General");
                            val_axis[i].numFmt.setSourceLinked(true);
                        }
                        if(need_num_fmt && val_axis[i].numFmt.formatCode !== need_num_fmt)
                            val_axis[i].numFmt.setFormatCode(need_num_fmt);
                    }
                }
                else
                {
                    new_chart_type = new AscFormat.CAreaChart();
                    replaceChart(plot_area, chart_type, new_chart_type);
                    checkSwapAxis(plot_area, chart_type, new_chart_type);

                    val_axis = new_chart_type.getAxisByTypes().valAx;
                    for(i = 0; i < val_axis.length; ++i)
                    {
                        if(!val_axis[i].numFmt)
                        {
                            val_axis[i].setNumFmt(new AscFormat.CNumFmt());
                            val_axis[i].numFmt.setFormatCode(sDefaultValAxFormatCode ? sDefaultValAxFormatCode : "General");
                            val_axis[i].numFmt.setSourceLinked(true);
                        }
                        if(need_num_fmt && val_axis[i].numFmt.formatCode !== need_num_fmt)
                            val_axis[i].numFmt.setFormatCode(need_num_fmt);
                    }
                    new_chart_type.setGrouping(need_groupping);
                }
                chart_space.chart.setView3D(null);
                break;
            }
            case c_oAscChartTypeSettings.scatter:
            case c_oAscChartTypeSettings.scatterLine:
            case c_oAscChartTypeSettings.scatterSmooth:
            {
                if(chart_type.getObjectType() !== AscDFH.historyitem_type_ScatterChart)
                {
                    new_chart_type = new AscFormat.CScatterChart();
                    replaceChart(plot_area, chart_type, new_chart_type);
                    for(var j = 0; j < new_chart_type.series.length; ++j)
                    {
                        new_chart_type.series[j].setMarker(null);
                    }
                    new_chart_type.setScatterStyle(SCATTER_STYLE_MARKER);
                    axis_obj = AscFormat.CreateScatterAxis(); //cat - 0, val - 1
                    if(oValAx && oValAx instanceof AscFormat.CValAx){
                        oValAx.createDuplicate(axis_obj.valAx);
                        axis_obj.valAx.setAxPos(AscFormat.AX_POS_L);
                    }
                    if(oCatAx){
                        if(oCatAx.majorGridlines)
                        {
                            axis_obj.catAx.setMajorGridlines(oCatAx.majorGridlines.createDuplicate());
                        }
                        axis_obj.catAx.setMajorTickMark(oCatAx.majorTickMark);

                        if(oCatAx.minorGridlines)
                        {
                            axis_obj.catAx.setMinorGridlines(oCatAx.minorGridlines.createDuplicate());
                        }
                        axis_obj.catAx.setMinorTickMark(oCatAx.minorTickMark);

                        if(oCatAx.spPr)
                        {
                            axis_obj.catAx.setSpPr(oCatAx.spPr.createDuplicate());
                        }
                        axis_obj.catAx.setTickLblPos(oCatAx.tickLblPos);
                        if(oCatAx.title)
                        {
                            axis_obj.catAx.setTitle(oCatAx.title.createDuplicate());
                        }
                        if(oCatAx.txPr)
                        {
                            axis_obj.catAx.setTxPr(oCatAx.txPr.createDuplicate());
                        }
                    }
                    new_chart_type.addAxId(axis_obj.catAx);
                    new_chart_type.addAxId(axis_obj.valAx);
                    plot_area.addAxis(axis_obj.catAx);
                    plot_area.addAxis(axis_obj.valAx);
                }
                break;
            }
            case c_oAscChartTypeSettings.stock:
            {
                if(chart_type.getObjectType() !== AscDFH.historyitem_type_StockChart)
                {
                    new_chart_type = new AscFormat.CStockChart();
                    replaceChart(plot_area, chart_type, new_chart_type);
                    checkSwapAxis(plot_area, chart_type, new_chart_type);

                    new_chart_type.setHiLowLines(new AscFormat.CSpPr());
                    new_chart_type.setUpDownBars(new AscFormat.CUpDownBars());
                    new_chart_type.upDownBars.setGapWidth(150);
                    new_chart_type.upDownBars.setUpBars(new AscFormat.CSpPr());
                    new_chart_type.upDownBars.setDownBars(new AscFormat.CSpPr());
                    val_axis = new_chart_type.getAxisByTypes().valAx;
                    for(i = 0; i < val_axis.length; ++i)
                    {
                        if(!val_axis[i].numFmt)
                        {
                            val_axis[i].setNumFmt(new AscFormat.CNumFmt());
                            val_axis[i].numFmt.setSourceLinked(true);
                        }
                        if(val_axis[i].numFmt.formatCode !== "General")
                            val_axis[i].numFmt.setFormatCode("General");
                    }
                }
                break;
            }
        }


        var hor_axis = plot_area.getHorizontalAxis();
        var hor_axis_label_setting = chartSettings.getHorAxisLabel();
        if(hor_axis)
        {
            if(hor_axis_label_setting !== null)
            {
                switch (hor_axis_label_setting)
                {
                    case c_oAscChartHorAxisLabelShowSettings.none:
                    {
                        if(hor_axis.title)
                            hor_axis.setTitle(null);
                        break;
                    }
                    case c_oAscChartHorAxisLabelShowSettings.noOverlay:
                    {
                        var _text_body;
                        if(hor_axis.title && hor_axis.title.tx && hor_axis.title.tx.rich)
                        {
                            _text_body = hor_axis.title.tx.rich;
                        }
                        else
                        {
                            if(!hor_axis.title)
                            {
                                hor_axis.setTitle(new AscFormat.CTitle());
                            }
                            if(!hor_axis.title.txPr)
                            {
                                hor_axis.title.setTxPr(new AscFormat.CTextBody());
                            }
                            if(!hor_axis.title.txPr.bodyPr)
                            {
                                hor_axis.title.txPr.setBodyPr(new AscFormat.CBodyPr());
                            }
                            if(!hor_axis.title.txPr.content)
                            {
                                hor_axis.title.txPr.setContent(new AscFormat.CDrawingDocContent(hor_axis.title.txPr, chart_space.getDrawingDocument(), 0, 0, 100, 500, false, false, true));
                            }
                            _text_body = hor_axis.title.txPr;
                        }
                        if(hor_axis.title.overlay !== false)
                            hor_axis.title.setOverlay(false);

                        if(!_text_body.bodyPr || _text_body.bodyPr.isNotNull())
                        {
                            _text_body.setBodyPr(new AscFormat.CBodyPr());
                        }

                        break;
                    }
                }
            }
            hor_axis.setMenuProps(chartSettings.getHorAxisProps());
            if(AscFormat.isRealBool(chartSettings.getShowHorAxis())){
                hor_axis.setDelete(!chartSettings.getShowHorAxis());
            }
        }

        //vertAxis
        var vert_axis = plot_area.getVerticalAxis(); //TODO: запрашивать у chart_type
        var vert_axis_labels_settings = chartSettings.getVertAxisLabel();
        if(vert_axis)
        {
            if(vert_axis_labels_settings !== null)
            {
                switch (vert_axis_labels_settings)
                {
                    case c_oAscChartVertAxisLabelShowSettings.none:
                    {
                        if(vert_axis.title)
                        {
                            vert_axis.setTitle(null);
                        }
                        break;
                    }
                    case c_oAscChartVertAxisLabelShowSettings.vertical:
                    {
                        //TODO: пока СDocumentContent не поддерживает вертикальный текст, может быть будет когда-нибудь, хотя вряд ли.
                        break;
                    }
                    default:
                    {
                        if( vert_axis_labels_settings === c_oAscChartVertAxisLabelShowSettings.rotated
                            || vert_axis_labels_settings === c_oAscChartVertAxisLabelShowSettings.horizontal)
                        {
                            var _text_body;
                            if(vert_axis.title && vert_axis.title.tx && vert_axis.title.tx.rich)
                            {
                                _text_body = vert_axis.title.tx.rich;
                            }
                            else
                            {
                                if(!vert_axis.title)
                                {
                                    vert_axis.setTitle(new AscFormat.CTitle());
                                }
                                if(!vert_axis.title.txPr)
                                {
                                    vert_axis.title.setTxPr(new AscFormat.CTextBody());
                                }
                                _text_body =  vert_axis.title.txPr;
                            }
                            if(!_text_body.bodyPr)
                            {
                                _text_body.setBodyPr(new AscFormat.CBodyPr());
                            }
                            var _body_pr = _text_body.bodyPr.createDuplicate();
                            if(!_text_body.content)
                            {
                                _text_body.setContent(new AscFormat.CDrawingDocContent(_text_body, chart_space.getDrawingDocument(), 0, 0, 100, 500, false, false, true));
                            }
                            if(vert_axis_labels_settings === c_oAscChartVertAxisLabelShowSettings.rotated)
                            {
                                _body_pr.reset();
                            }
                            else
                            {
                                _body_pr.setVert(AscFormat.nVertTThorz);
                                _body_pr.setRot(0);
                            }
                            _text_body.setBodyPr(_body_pr);
                            if(vert_axis.title.overlay !== false)
                            {
                                vert_axis.title.setOverlay(false);
                            }
                        }
                    }
                }
            }
            vert_axis.setMenuProps(chartSettings.getVertAxisProps());
            if(AscFormat.isRealBool(chartSettings.getShowVerAxis())){
                vert_axis.setDelete(!chartSettings.getShowVerAxis());
            }
        }

        //gridLines
        //Hor GridLInes
        var setAxisGridLines = function(axis, gridLinesSettings)
        {
            if(axis)
            {
                switch(gridLinesSettings)
                {
                    case c_oAscGridLinesSettings.none:
                    {
                        if(axis.majorGridlines)
                            axis.setMajorGridlines(null);
                        if(axis.minorGridlines)
                            axis.setMinorGridlines(null);
                        break;
                    }
                    case c_oAscGridLinesSettings.major:
                    {
                        if(!axis.majorGridlines)
                            axis.setMajorGridlines(new AscFormat.CSpPr());
                        if(axis.minorGridlines)
                            axis.setMinorGridlines(null);
                        break;
                    }
                    case c_oAscGridLinesSettings.minor:
                    {
                        if(!axis.minorGridlines)
                            axis.setMinorGridlines(new AscFormat.CSpPr());
                        if(axis.majorGridlines)
                            axis.setMajorGridlines(null);
                        break;
                    }
                    case c_oAscGridLinesSettings.majorMinor:
                    {
                        if(!axis.minorGridlines)
                            axis.setMinorGridlines(new AscFormat.CSpPr());
                        if(!axis.majorGridlines)
                            axis.setMajorGridlines(new AscFormat.CSpPr());
                        break;
                    }
                }
            }
        };

        setAxisGridLines(plot_area.getVerticalAxis(), chartSettings.getHorGridLines());
        setAxisGridLines(plot_area.getHorizontalAxis(), chartSettings.getVertGridLines());

        for(var i = 0; i < plot_area.charts.length; ++i){
            chart_type = plot_area.charts[i];
            var data_labels_pos_setting = chartSettings.getDataLabelsPos();
            if(AscFormat.isRealNumber(data_labels_pos_setting)){
                if(data_labels_pos_setting === c_oAscChartDataLabelsPos.none){
                    if(chart_type.dLbls)
                        chart_type.setDLbls(null);
                    chart_type.removeDataLabels();
                }
                else{
                    var finish_dlbl_pos =  data_labels_pos_setting;
                    finish_dlbl_pos = this.checkDlblsPosition(chart, chart_type, finish_dlbl_pos);
                    if(chart_type.dLbls && chart_type.dLbls.dLblPos !== finish_dlbl_pos){
                        chart_type.dLbls.setDLblPos(finish_dlbl_pos);
                    }
                    for(var i = 0; i < chart_type.series.length; ++i){
                        if(chart_type.series[i].setDLbls){
                            if(!chart_type.series[i].dLbls){
                                var d_lbls = new AscFormat.CDLbls();
                                d_lbls.setShowVal(true);
                                chart_type.series[i].setDLbls(d_lbls);
                                chart_type.series[i].dLbls.setParent(chart_type);
                            }
                            if(chart_type.series[i].dLbls.dLblPos !== finish_dlbl_pos){
                                chart_type.series[i].dLbls.setDLblPos(finish_dlbl_pos);
                            }
                            for(var j = 0; j < chart_type.series[i].dLbls.dLbl.length; ++j){
                                if(chart_type.series[i].dLbls.dLbl[j].dLblPos !== finish_dlbl_pos){
                                    chart_type.series[i].dLbls.dLbl[j].setDLblPos(finish_dlbl_pos);
                                }
                            }
                        }
                    }
                }
            }
            else{
                if(chart_type.dLbls && AscFormat.isRealNumber(chart_type.dLbls.dLblPos)){
                    chart_type.dLbls.setDLblPos(this.checkDlblsPosition(chart, chart_type, chart_type.dLbls.dLblPos));
                }
                for(var i = 0; i < chart_type.series.length; ++i){
                    if(chart_type.series[i].dLbls){
                        if(AscFormat.isRealNumber(chart_type.series[i].dLbls.dLblPos)){
                            chart_type.series[i].dLbls.setDLblPos(this.checkDlblsPosition(chart, chart_type, chart_type.series[i].dLbls.dLblPos));
                        }
                        for(var j = 0; j < chart_type.series[i].dLbls.dLbl.length; ++j){
                            if(AscFormat.isRealNumber(chart_type.series[i].dLbls.dLbl[j].dLblPos)){
                                chart_type.series[i].dLbls.dLbl[j].setDLblPos(this.checkDlblsPosition(chart, chart_type, chart_type.series[i].dLbls.dLbl[j].dLblPos));
                            }
                        }
                    }
                }
            }
            //подписи данных
            if(typeof chart_type.setDLbls === "function" && AscFormat.isRealNumber(chartSettings.getDataLabelsPos()) && chartSettings.getDataLabelsPos() !== c_oAscChartDataLabelsPos.none)
            {
                if(AscFormat.isRealBool(chartSettings.showCatName) ||
                    AscFormat.isRealBool(chartSettings.showSerName) ||
                    AscFormat.isRealBool(chartSettings.showVal)){
                    var fCheckLbls = function(oLbl){
                        if(oLbl.setDelete && oLbl.bDelete){
                            oLbl.setDelete(false);
                        }
                        if(AscFormat.isRealBool(chartSettings.showCatName)){
                            oLbl.setShowCatName(chartSettings.showCatName);
                        }
                        if(AscFormat.isRealBool(chartSettings.showSerName)){
                            oLbl.setShowSerName(chartSettings.showSerName);
                        }
                        if(AscFormat.isRealBool(chartSettings.showVal)){
                            oLbl.setShowVal(chartSettings.showVal);
                        }
                        if(!AscFormat.isRealBool(oLbl.showLegendKey) || oLbl.showLegendKey === true)                {
                            oLbl.setShowLegendKey(false);
                        }
                        if(!AscFormat.isRealBool(oLbl.showPercent) || oLbl.showPercent === true){
                            oLbl.setShowPercent(false);
                        }
                        if(!AscFormat.isRealBool(oLbl.showBubbleSize) || oLbl.showBubbleSize === true){
                            oLbl.setShowBubbleSize(false);
                        }
                        if(typeof chartSettings.separator === "string" && chartSettings.separator.length > 0)
                            oLbl.setSeparator(chartSettings.separator);
                    };
                    for(var i = 0; i < chart_type.series.length; ++i){
                        var oSeries = chart_type.series[i];
                        if(oSeries.setDLbls){
                            if(!oSeries.dLbls){
                                oSeries.setDLbls(new AscFormat.CDLbls());
                                oSeries.dLbls.setParent(oSeries);
                            }
                        }
                        fCheckLbls(oSeries.dLbls);
                        for(var j = 0; j < oSeries.dLbls.dLbl.length; ++j){
                            fCheckLbls(oSeries.dLbls.dLbl[j]);
                        }
                    }
                }
            }

            if(chart_type.getObjectType() === AscDFH.historyitem_type_LineChart )
            {
                if(!AscFormat.isRealBool(chartSettings.showMarker) || AscFormat.CChartsDrawer.prototype._isSwitchCurrent3DChart(chartSpace))
                {
                    chartSettings.showMarker = false;
                }
                if(!AscFormat.isRealBool(chartSettings.bLine) || AscFormat.CChartsDrawer.prototype._isSwitchCurrent3DChart(chartSpace))
                {
                    chartSettings.bLine = true;
                }

                if(chartSettings.showMarker)
                {
                    if(!chart_type.marker)
                    {
                        chart_type.setMarker(true);
                    }
                    for(var j = 0; j < chart_type.series.length; ++j)
                    {
                        if(chart_type.series[j].marker && chart_type.series[j].marker.symbol === AscFormat.SYMBOL_NONE)
                        {
                            chart_type.series[j].setMarker(null);
                        }
                    }
                }
                else
                {
                    for(var j = 0; j < chart_type.series.length; ++j)
                    {
                        if(!chart_type.series[j].marker)
                        {
                            chart_type.series[j].setMarker(new AscFormat.CMarker());
                        }
                        if(chart_type.series[j].marker.symbol !== AscFormat.SYMBOL_NONE)
                        {
                            chart_type.series[j].marker.setSymbol(AscFormat.SYMBOL_NONE);
                        }
                    }
                }

                if(!chartSettings.bLine)
                {
                    for(var j = 0; j < chart_type.series.length; ++j)
                    {
                        removeDPtsFromSeries(chart_type.series[j]);
                        if(!chart_type.series[j].spPr)
                        {
                            chart_type.series[j].setSpPr(new AscFormat.CSpPr());
                        }

                        if(AscFormat.isRealBool(chart_type.series[j].smooth))
                        {
                            chart_type.series[j].setSmooth(null);
                        }
                        chart_type.series[j].spPr.setLn(AscFormat.CreateNoFillLine());
                    }
                }
                else
                {
                    for(var j = 0; j < chart_type.series.length; ++j)
                    {
                        removeDPtsFromSeries(chart_type.series[j]);
                        if(chart_type.series[j].smooth !== (chartSettings.smooth === true))
                        {
                            chart_type.series[j].setSmooth(chartSettings.smooth === true);
                        }
                        if(chart_type.series[j].spPr && chart_type.series[j].spPr.ln)
                        {
                            chart_type.series[j].spPr.setLn(null);
                        }
                    }
                }
                if(chart_type.smooth !== (chartSettings.smooth === true))
                {
                    chart_type.setSmooth(chartSettings.smooth === true);
                }
                for(var j = 0; j < chart_type.series.length; ++j)
                {
                    if(chart_type.series[j].smooth !== (chartSettings.smooth === true))
                    {
                        chart_type.series[j].setSmooth(chartSettings.smooth === true);
                    }
                }
            }
            if(chart_type.getObjectType() === AscDFH.historyitem_type_ScatterChart)
            {
                if(!AscFormat.isRealBool(chartSettings.showMarker))
                {
                    chartSettings.showMarker = true;
                }
                if(!AscFormat.isRealBool(chartSettings.bLine))
                {
                    chartSettings.bLine = false;
                }

                for(var i = 0; i < chart_type.series.length; ++i)
                {
                    if(chart_type.series[i].marker)
                    {
                        chart_type.series[i].setMarker(null);
                    }
                    if(AscFormat.isRealBool(chart_type.series[i].smooth))
                    {
                        chart_type.series[i].setSmooth(null);
                    }
                }
                var new_scatter_style;
                if(chartSettings.bLine)
                {
                    for(var j = 0; j < chart_type.series.length; ++j)
                    {
                        removeDPtsFromSeries(chart_type.series[j]);
                        if(chart_type.series[j].spPr && chart_type.series[j].spPr.ln)
                        {
                            chart_type.series[j].spPr.setLn(null);
                        }
                    }
                    if(chartSettings.smooth)
                    {
                        if(chartSettings.showMarker)
                        {
                            new_scatter_style = SCATTER_STYLE_SMOOTH_MARKER;
                            for(var j = 0; j < chart_type.series.length; ++j)
                            {
                                if(chart_type.series[j].marker)
                                {
                                    chart_type.series[j].setMarker(null);
                                }
                                chart_type.series[j].setSmooth(true);
                            }
                        }
                        else
                        {
                            new_scatter_style = SCATTER_STYLE_SMOOTH;
                            for(var j = 0; j < chart_type.series.length; ++j)
                            {
                                if(!chart_type.series[j].marker)
                                {
                                    chart_type.series[j].setMarker(new AscFormat.CMarker());
                                }
                                chart_type.series[j].marker.setSymbol(AscFormat.SYMBOL_NONE);
                                chart_type.series[j].setSmooth(true);
                            }
                        }
                    }
                    else
                    {
                        if(chartSettings.showMarker)
                        {
                            new_scatter_style = SCATTER_STYLE_LINE_MARKER;
                            for(var j = 0; j < chart_type.series.length; ++j)
                            {
                                if(chart_type.series[j].marker)
                                {
                                    chart_type.series[j].setMarker(null);
                                }
                                chart_type.series[j].setSmooth(false);
                            }
                        }
                        else
                        {
                            new_scatter_style = SCATTER_STYLE_LINE;
                            for(var j = 0; j < chart_type.series.length; ++j)
                            {
                                if(!chart_type.series[j].marker)
                                {
                                    chart_type.series[j].setMarker(new AscFormat.CMarker());
                                }
                                chart_type.series[j].marker.setSymbol(AscFormat.SYMBOL_NONE);
                                chart_type.series[j].setSmooth(false);
                            }
                        }
                    }
                }
                else
                {
                    for(var j = 0; j < chart_type.series.length; ++j)
                    {
                        removeDPtsFromSeries(chart_type.series[j]);
                        if(!chart_type.series[j].spPr)
                        {
                            chart_type.series[j].setSpPr(new AscFormat.CSpPr());
                        }
                        chart_type.series[j].spPr.setLn(AscFormat.CreateNoFillLine());
                    }
                    if(chartSettings.showMarker)
                    {
                        new_scatter_style = SCATTER_STYLE_MARKER;
                        for(var j = 0; j < chart_type.series.length; ++j)
                        {
                            if(chart_type.series[j].marker)
                            {
                                chart_type.series[j].setMarker(null);
                            }
                            chart_type.series[j].setSmooth(false);
                        }
                    }
                    else
                    {
                        new_scatter_style = SCATTER_STYLE_MARKER;
                        for(var j = 0; j < chart_type.series.length; ++j)
                        {
                            if(!chart_type.series[j].marker)
                            {
                                chart_type.series[j].setMarker(new AscFormat.CMarker());
                            }
                            chart_type.series[j].marker.setSymbol(AscFormat.SYMBOL_NONE);
                        }
                    }
                }
                chart_type.setScatterStyle(new_scatter_style);
            }
        }

    },

    checkDlblsPosition: function(chart, chart_type, position){
        var finish_dlbl_pos =  position;

        switch (chart_type.getObjectType())
        {
            case AscDFH.historyitem_type_BarChart:
            {
                if(BAR_GROUPING_CLUSTERED === chart_type.grouping)
                {
                    if(!(finish_dlbl_pos === c_oAscChartDataLabelsPos.ctr
                        || finish_dlbl_pos === c_oAscChartDataLabelsPos.inEnd
                        || finish_dlbl_pos === c_oAscChartDataLabelsPos.inBase
                        || finish_dlbl_pos === c_oAscChartDataLabelsPos.outEnd))
                    {
                        finish_dlbl_pos = c_oAscChartDataLabelsPos.ctr;
                    }
                }
                else
                {
                    if(!(finish_dlbl_pos === c_oAscChartDataLabelsPos.ctr
                        || finish_dlbl_pos === c_oAscChartDataLabelsPos.inEnd
                        || finish_dlbl_pos === c_oAscChartDataLabelsPos.inBase))
                    {
                        finish_dlbl_pos = c_oAscChartDataLabelsPos.ctr;
                    }
                }
                if(chart.view3D)
                {
                    finish_dlbl_pos = null;
                }
                break;
            }
            case AscDFH.historyitem_type_LineChart:
            case AscDFH.historyitem_type_ScatterChart:
            {
                if(!(finish_dlbl_pos === c_oAscChartDataLabelsPos.ctr
                    || finish_dlbl_pos === c_oAscChartDataLabelsPos.l
                    || finish_dlbl_pos === c_oAscChartDataLabelsPos.t
                    || finish_dlbl_pos === c_oAscChartDataLabelsPos.r
                    || finish_dlbl_pos === c_oAscChartDataLabelsPos.b))
                {
                    finish_dlbl_pos = c_oAscChartDataLabelsPos.ctr;
                }
                if(chart.view3D)
                {
                    finish_dlbl_pos = null;
                }
                break;
            }
            case AscDFH.historyitem_type_PieChart:
            {
                if(!(finish_dlbl_pos === c_oAscChartDataLabelsPos.ctr
                    || finish_dlbl_pos === c_oAscChartDataLabelsPos.inEnd
                    || finish_dlbl_pos === c_oAscChartDataLabelsPos.outEnd
                    || finish_dlbl_pos === c_oAscChartDataLabelsPos.bestFit))
                {
                    finish_dlbl_pos = c_oAscChartDataLabelsPos.ctr;
                }
                break;
            }
            case AscDFH.historyitem_type_AreaChart:
            case AscDFH.historyitem_type_DoughnutChart:
            case AscDFH.historyitem_type_StockChart:
            {
                finish_dlbl_pos = null;
                break;
            }
        }
        return finish_dlbl_pos;
    },

    getChartProps: function()
    {
        var objects_by_types = this.getSelectedObjectsByTypes();
        var ret = null;
        if(objects_by_types.charts.length === 1)
        {
            ret = this.getPropsFromChart(objects_by_types.charts[0]);
        }
        return ret;
    },

    getPropsFromChart: function(chart_space)
    {
        var chart = chart_space.chart, plot_area = chart_space.chart.plotArea;
        var ret = new Asc.asc_ChartSettings();
        var range_obj = chart_space.getRangeObjectStr();
        if(range_obj)
        {
            if(typeof range_obj.range === "string" && range_obj.range.length > 0)
            {
                ret.putRange(range_obj.range);
                ret.putInColumns(!range_obj.bVert);
            }
        }
        //ret.putStyle(AscFormat.isRealNumber(chart_space.style) ? chart_space.style : null);
        ret.putTitle(isRealObject(chart.title) ? (chart.title.overlay ? c_oAscChartTitleShowSettings.overlay : c_oAscChartTitleShowSettings.noOverlay) : c_oAscChartTitleShowSettings.none);
        var hor_axis = plot_area.getHorizontalAxis();
        var vert_axis = plot_area.getVerticalAxis();

        var calc_grid_lines = function(axis)
        {
            if(!axis || (!axis.majorGridlines && !axis.minorGridlines))
                return c_oAscGridLinesSettings.none;
            if(axis.majorGridlines && !axis.minorGridlines)
                return c_oAscGridLinesSettings.major;
            if(axis.minorGridlines && !axis.majorGridlines)
                return c_oAscGridLinesSettings.minor;
            return c_oAscGridLinesSettings.majorMinor;
        };

        var chart_type = plot_area.charts[0];
        var chart_type_object_type = chart_type.getObjectType();

        if(hor_axis)
        {
            ret.putShowHorAxis(!hor_axis.bDelete);
            ret.putHorAxisProps(hor_axis.getMenuProps());
        }
        else
        {
            if(vert_axis)
            {
                if(vert_axis.getObjectType() === AscDFH.historyitem_type_ValAx)
                {
                    ret.putShowHorAxis(false);
                    var _cat_ax_pr = new AscCommon.asc_CatAxisSettings();
                    _cat_ax_pr.setDefault();
                    ret.putHorAxisProps(_cat_ax_pr);
                }
                else
                {
                    ret.putShowHorAxis(false);
                    var _val_ax_pr = new AscCommon.asc_ValAxisSettings();
                    _val_ax_pr.setDefault();
                    ret.putHorAxisProps(_val_ax_pr);
                }
            }
        }
        ret.putHorGridLines(calc_grid_lines(vert_axis));

        if(vert_axis)
        {
            ret.putShowVerAxis(!vert_axis.bDelete);
            ret.putVertAxisProps(vert_axis.getMenuProps());
            if(chart_type.getObjectType() === AscDFH.historyitem_type_AreaChart && !AscFormat.isRealNumber(vert_axis.crossBetween))
            {
                if(ret.horAxisProps)
                {
                    ret.horAxisProps.putLabelsPosition(Asc.c_oAscLabelsPosition.byDivisions);
                }
            }
        }
        ret.putVertGridLines(calc_grid_lines(hor_axis));

        ret.putHorAxisLabel(hor_axis && hor_axis.title ? c_oAscChartHorAxisLabelShowSettings.noOverlay : c_oAscChartTitleShowSettings.none);
        var _label;
        if(vert_axis && vert_axis.title)
        {
            var tx_body;
            if(vert_axis.title.tx && vert_axis.title.tx.rich)
            {
                tx_body  =  vert_axis.title.tx.rich;
            }
            else if(vert_axis.title.txPr)
            {
                tx_body  =  vert_axis.title.txPr;
            }
            if(tx_body)
            {
                var oBodyPr = vert_axis.title.getBodyPr();
                if(oBodyPr && oBodyPr.vert === AscFormat.nVertTThorz)
                {
                    _label = c_oAscChartVertAxisLabelShowSettings.horizontal;
                }
                else
                {
                    _label = c_oAscChartVertAxisLabelShowSettings.rotated;
                }
            }
            else
            {
                _label = c_oAscChartVertAxisLabelShowSettings.none;
            }
        }
        else
        {
            _label = c_oAscChartVertAxisLabelShowSettings.none;
        }
        ret.putVertAxisLabel(_label);

        var data_labels = plot_area.charts[0].dLbls;
        var nDefaultDatalabelsPos = chart_type && chart_type.getDefaultDataLabelsPosition ? chart_type.getDefaultDataLabelsPosition() :  c_oAscChartDataLabelsPos.none;

        if(data_labels)
        {
            if(chart_type.series[0] && chart_type.series[0].dLbls){
                this.collectPropsFromDLbls(nDefaultDatalabelsPos, chart_type.series[0].dLbls, ret);
            }
            else{
                this.collectPropsFromDLbls(nDefaultDatalabelsPos, data_labels, ret);
            }
        }
        else
        {
            if(chart_type.series[0] && chart_type.series[0].dLbls){
                this.collectPropsFromDLbls(nDefaultDatalabelsPos, chart_type.series[0].dLbls, ret);
            }
            else{
                ret.putShowSerName(false);
                ret.putShowCatName(false);
                ret.putShowVal(false);
                ret.putSeparator("");
                ret.putDataLabelsPos(c_oAscChartDataLabelsPos.none);
            }
        }

        if(chart.legend)
        {
            ret.putLegendPos(AscFormat.isRealNumber(chart.legend.legendPos) ? chart.legend.legendPos : c_oAscChartLegendShowSettings.bottom);
        }
        else
        {
            ret.putLegendPos(c_oAscChartLegendShowSettings.none);
        }


        var calc_chart_type;
        if(chart_type_object_type === AscDFH.historyitem_type_PieChart)
        {
            if(!AscFormat.CChartsDrawer.prototype._isSwitchCurrent3DChart(chart_space))
            {
                calc_chart_type = c_oAscChartTypeSettings.pie;
            }
            else
            {
                calc_chart_type = c_oAscChartTypeSettings.pie3d;
            }
        }
        else if(chart_type_object_type === AscDFH.historyitem_type_DoughnutChart)
            calc_chart_type = c_oAscChartTypeSettings.doughnut;
        else if(chart_type_object_type === AscDFH.historyitem_type_StockChart)
            calc_chart_type = c_oAscChartTypeSettings.stock;
        else if(chart_type_object_type === AscDFH.historyitem_type_BarChart)
        {
            var b_hbar = chart_type.barDir === BAR_DIR_BAR;
            var bView3d = AscFormat.CChartsDrawer.prototype._isSwitchCurrent3DChart(chart_space);
            if(b_hbar)
            {
                switch(chart_type.grouping)
                {
                    case BAR_GROUPING_CLUSTERED:
                    {
                        calc_chart_type = bView3d ? c_oAscChartTypeSettings.hBarNormal3d : c_oAscChartTypeSettings.hBarNormal;
                        break;
                    }
                    case BAR_GROUPING_STACKED:
                    {
                        calc_chart_type = bView3d ? c_oAscChartTypeSettings.hBarStacked3d : c_oAscChartTypeSettings.hBarStacked;
                        break;
                    }
                    case BAR_GROUPING_PERCENT_STACKED:
                    {
                        calc_chart_type = bView3d ? c_oAscChartTypeSettings.hBarStackedPer3d : c_oAscChartTypeSettings.hBarStackedPer;
                        break;
                    }
                    default:
                    {
                        calc_chart_type = bView3d ? c_oAscChartTypeSettings.hBarNormal3d : c_oAscChartTypeSettings.hBarNormal;
                        break;
                    }
                }
            }
            else
            {
                switch(chart_type.grouping)
                {
                    case BAR_GROUPING_CLUSTERED:
                    {
                        calc_chart_type = bView3d ? c_oAscChartTypeSettings.barNormal3d : c_oAscChartTypeSettings.barNormal;
                        break;
                    }
                    case BAR_GROUPING_STACKED:
                    {
                        calc_chart_type = bView3d ? c_oAscChartTypeSettings.barStacked3d : c_oAscChartTypeSettings.barStacked;
                        break;
                    }
                    case BAR_GROUPING_PERCENT_STACKED:
                    {
                        calc_chart_type = bView3d ? c_oAscChartTypeSettings.barStackedPer3d : c_oAscChartTypeSettings.barStackedPer;
                        break;
                    }
                    default:
                    {
                        if(BAR_GROUPING_STANDARD && bView3d)
                        {
                            calc_chart_type = c_oAscChartTypeSettings.barNormal3dPerspective;
                        }
                        else
                        {
                            calc_chart_type = c_oAscChartTypeSettings.barNormal;
                        }
                        break;
                    }
                }
            }
        }
        else if(chart_type_object_type === AscDFH.historyitem_type_LineChart)
        {
            switch(chart_type.grouping)
            {
                case GROUPING_PERCENT_STACKED :
                {
                    calc_chart_type = c_oAscChartTypeSettings.lineStackedPer;
                    break;
                }
                case GROUPING_STACKED         :
                {
                    calc_chart_type = c_oAscChartTypeSettings.lineStacked;
                    break;
                }
                default        :
                {
                    if(!AscFormat.CChartsDrawer.prototype._isSwitchCurrent3DChart(chart_space))
                    {
                        calc_chart_type = c_oAscChartTypeSettings.lineNormal;
                    }
                    else
                    {
                        calc_chart_type = c_oAscChartTypeSettings.line3d;
                    }
                    break;
                }
            }
            var bShowMarker = false;
            if(chart_type.marker !== false)
            {
                for(var j = 0; j < chart_type.series.length; ++j)
                {
                    if(!chart_type.series[j].marker)
                    {
                        bShowMarker = true;
                        break;
                    }
                    if(chart_type.series[j].marker.symbol !== AscFormat.SYMBOL_NONE)
                    {
                        bShowMarker = true;
                        break;
                    }
                }
            }
            ret.putShowMarker(bShowMarker);
            var b_no_line = true;
            for(var i = 0; i < chart_type.series.length; ++i)
            {
                if(!(chart_type.series[i].spPr && chart_type.series[i].spPr.ln &&
                    chart_type.series[i].spPr.ln.Fill &&chart_type.series[i].spPr.ln.Fill.fill && chart_type.series[i].spPr.ln.Fill.fill.type === c_oAscFill.FILL_TYPE_NOFILL))
                {
                    b_no_line = false;
                    break;
                }
            }
            var b_smooth = true;
            for(var i = 0; i < chart_type.series.length; ++i)
            {
                if(chart_type.series[i].smooth === false)
                {
                    b_smooth = false;
                    break;
                }
            }
            if(!b_no_line)
            {
                ret.putLine(true);
                ret.putSmooth(b_smooth);
            }
            else
            {
                ret.putLine(false);
            }
        }
        else if(chart_type_object_type === AscDFH.historyitem_type_AreaChart)
        {
            switch(chart_type.grouping)
            {
                case GROUPING_PERCENT_STACKED :
                {
                    calc_chart_type = c_oAscChartTypeSettings.areaStackedPer;
                    break;
                }
                case GROUPING_STACKED         :
                {
                    calc_chart_type = c_oAscChartTypeSettings.areaStacked;
                    break;
                }
                default        :
                {
                    calc_chart_type = c_oAscChartTypeSettings.areaNormal;
                    break;
                }
            }
        }
        else if(chart_type_object_type === AscDFH.historyitem_type_ScatterChart)
        {
            calc_chart_type = c_oAscChartTypeSettings.scatter;
            switch(chart_type.scatterStyle)
            {
                case SCATTER_STYLE_LINE:
                {
                    ret.bLine = true;
                    ret.smooth = false;
                    ret.showMarker = false;
                    break;
                }
                case SCATTER_STYLE_LINE_MARKER:
                {
                    ret.bLine = true;
                    ret.smooth = false;
                    ret.showMarker = true;
                    break;
                }
                case SCATTER_STYLE_MARKER:
                {
                    ret.bLine = false;
                    ret.showMarker = false;
                    for(var j = 0; j < chart_type.series.length; ++j)
                    {
                        if(!(chart_type.series[j].marker && chart_type.series[j].marker.symbol === AscFormat.SYMBOL_NONE))
                        {
                            ret.showMarker = true;
                            break;
                        }
                    }
                    break;
                }
                case SCATTER_STYLE_NONE:
                {
                    ret.bLine = false;
                    ret.showMarker = false;
                    break;
                }
                case SCATTER_STYLE_SMOOTH:
                {
                    ret.bLine = true;
                    ret.smooth = true;
                    ret.showMarker = false;
                    break;
                }
                case SCATTER_STYLE_SMOOTH_MARKER:
                {
                    ret.bLine = true;
                    ret.smooth = true;
                    ret.showMarker = true;
                    break;
                }
            }
            if(ret.bLine)
            {
                for(var i = 0; i < chart_type.series.length; ++i)
                {
                    if(!(chart_type.series[i].spPr && chart_type.series[i].spPr.ln &&
                        chart_type.series[i].spPr.ln.Fill &&chart_type.series[i].spPr.ln.Fill.fill && chart_type.series[i].spPr.ln.Fill.fill.type === c_oAscFill.FILL_TYPE_NOFILL))
                    {
                        break;
                    }
                }
                if(i === chart_type.series.length)
                {
                    ret.bLine = false;
                }
                var b_smooth = ret.smooth;
                if(b_smooth)
                {
                    for(var i = 0; i < chart_type.series.length; ++i)
                    {
                        if(!chart_type.series[i].smooth)
                        {
                            b_smooth = false;
                            break;
                        }
                    }
                }
                ret.putSmooth(b_smooth);
            }
        }
        else if(chart_type_object_type === AscDFH.historyitem_type_SurfaceChart){
            var oView3D = chart_space.chart.view3D;
            if(chart_type.isWireframe()){
                if(oView3D && oView3D.rotX === 90 && oView3D.rotY === 0 && oView3D.rAngAx === false && oView3D.perspective === 0){
                    calc_chart_type = c_oAscChartTypeSettings.contourWireframe;
                }
                else{
                    calc_chart_type = c_oAscChartTypeSettings.surfaceWireframe;
                }
            }
            else{
                if(oView3D && oView3D.rotX === 90 && oView3D.rotY === 0 && oView3D.rAngAx === false && oView3D.perspective === 0){
                    calc_chart_type = c_oAscChartTypeSettings.contourNormal;
                }
                else{
                    calc_chart_type = c_oAscChartTypeSettings.surfaceNormal;
                }
            }
        }
        else
        {
            calc_chart_type = c_oAscChartTypeSettings.unknown;
        }
        ret.type = calc_chart_type;
        return ret;
    },

    collectPropsFromDLbls: function(nDefaultDatalabelsPos, data_labels, ret){
        ret.putShowSerName(data_labels.showSerName === true);
        ret.putShowCatName(data_labels.showCatName === true);
        ret.putShowVal(data_labels.showVal === true);
        ret.putSeparator(data_labels.separator);
        if(data_labels.showSerName || data_labels.showCatName || data_labels.showVal || data_labels.showPercent){
            ret.putDataLabelsPos(AscFormat.isRealNumber(data_labels.dLblPos) ? data_labels.dLblPos :  nDefaultDatalabelsPos);
        }
        else{
            ret.putDataLabelsPos(c_oAscChartDataLabelsPos.none);
        }
    },
	_getChartSpace: function (chartSeries, options, bUseCache) {
		switch (options.type) {
			case c_oAscChartTypeSettings.lineNormal:
			case c_oAscChartTypeSettings.lineNormalMarker:
				return AscFormat.CreateLineChart(chartSeries, GROUPING_STANDARD, bUseCache, options);
			case c_oAscChartTypeSettings.lineStacked:
			case c_oAscChartTypeSettings.lineStackedMarker:
				return AscFormat.CreateLineChart(chartSeries, GROUPING_STACKED, bUseCache, options);
			case c_oAscChartTypeSettings.lineStackedPer:
			case c_oAscChartTypeSettings.lineStackedPerMarker:
				return AscFormat.CreateLineChart(chartSeries, GROUPING_PERCENT_STACKED, bUseCache, options);
            case c_oAscChartTypeSettings.line3d:
                return AscFormat.CreateLineChart(chartSeries, GROUPING_STANDARD, bUseCache, options, true);
			case c_oAscChartTypeSettings.barNormal:
				return AscFormat.CreateBarChart(chartSeries, BAR_GROUPING_CLUSTERED, bUseCache, options);
			case c_oAscChartTypeSettings.barStacked:
				return AscFormat.CreateBarChart(chartSeries, BAR_GROUPING_STACKED, bUseCache, options);
			case c_oAscChartTypeSettings.barStackedPer:
				return AscFormat.CreateBarChart(chartSeries, BAR_GROUPING_PERCENT_STACKED, bUseCache, options);
            case c_oAscChartTypeSettings.barNormal3d:
                return AscFormat.CreateBarChart(chartSeries, BAR_GROUPING_CLUSTERED, bUseCache, options, true);
            case c_oAscChartTypeSettings.barStacked3d:
                return AscFormat.CreateBarChart(chartSeries, BAR_GROUPING_STACKED, bUseCache, options, true);
            case c_oAscChartTypeSettings.barStackedPer3d:
                return AscFormat.CreateBarChart(chartSeries, BAR_GROUPING_PERCENT_STACKED, bUseCache, options, true);
            case c_oAscChartTypeSettings.barNormal3dPerspective:
                return AscFormat.CreateBarChart(chartSeries, BAR_GROUPING_STANDARD, bUseCache, options, true, true);
			case c_oAscChartTypeSettings.hBarNormal:
				return AscFormat.CreateHBarChart(chartSeries, BAR_GROUPING_CLUSTERED, bUseCache, options);
			case c_oAscChartTypeSettings.hBarStacked:
				return AscFormat.CreateHBarChart(chartSeries, BAR_GROUPING_STACKED, bUseCache, options);
			case c_oAscChartTypeSettings.hBarStackedPer:
				return AscFormat.CreateHBarChart(chartSeries, BAR_GROUPING_PERCENT_STACKED, bUseCache, options);
            case c_oAscChartTypeSettings.hBarNormal3d:
                return AscFormat.CreateHBarChart(chartSeries, BAR_GROUPING_CLUSTERED, bUseCache, options, true);
            case c_oAscChartTypeSettings.hBarStacked3d:
                return AscFormat.CreateHBarChart(chartSeries, BAR_GROUPING_STACKED, bUseCache, options, true);
            case c_oAscChartTypeSettings.hBarStackedPer3d:
                return AscFormat.CreateHBarChart(chartSeries, BAR_GROUPING_PERCENT_STACKED, bUseCache, options, true);
			case c_oAscChartTypeSettings.areaNormal:
				return AscFormat.CreateAreaChart(chartSeries, GROUPING_STANDARD, bUseCache, options);
			case c_oAscChartTypeSettings.areaStacked:
				return AscFormat.CreateAreaChart(chartSeries, GROUPING_STACKED, bUseCache, options);
			case c_oAscChartTypeSettings.areaStackedPer:
				return AscFormat.CreateAreaChart(chartSeries, GROUPING_PERCENT_STACKED, bUseCache, options);
			case c_oAscChartTypeSettings.stock:
				return AscFormat.CreateStockChart(chartSeries, bUseCache, options);
			case c_oAscChartTypeSettings.doughnut:
				return AscFormat.CreatePieChart(chartSeries, true, bUseCache, options);
			case c_oAscChartTypeSettings.pie:
				return AscFormat.CreatePieChart(chartSeries, false, bUseCache, options);
            case c_oAscChartTypeSettings.pie3d:
                return AscFormat.CreatePieChart(chartSeries, false, bUseCache, options, true);
			case c_oAscChartTypeSettings.scatter:
			case c_oAscChartTypeSettings.scatterLine:
			case c_oAscChartTypeSettings.scatterLineMarker:
			case c_oAscChartTypeSettings.scatterMarker:
			case c_oAscChartTypeSettings.scatterNone:
			case c_oAscChartTypeSettings.scatterSmooth:
			case c_oAscChartTypeSettings.scatterSmoothMarker:
				return AscFormat.CreateScatterChart(chartSeries, bUseCache, options);
            case c_oAscChartTypeSettings.surfaceNormal:
                return AscFormat.CreateSurfaceChart(chartSeries, bUseCache, options, false, false);
            case c_oAscChartTypeSettings.surfaceWireframe:
                return AscFormat.CreateSurfaceChart(chartSeries, bUseCache, options, false, true);
            case c_oAscChartTypeSettings.contourNormal:
                return AscFormat.CreateSurfaceChart(chartSeries, bUseCache, options, true, false);
            case c_oAscChartTypeSettings.contourWireframe:
                return AscFormat.CreateSurfaceChart(chartSeries, bUseCache, options, true, true);
			// radar return CreateRadarChart(chartSeries);
		}

		return null;
	},

	getChartSpace: function(worksheet, options, bUseCache)
	{
		var chartSeries = AscFormat.getChartSeries(worksheet, options);
		return this._getChartSpace(chartSeries, options, bUseCache);
	},

    getChartSpace2: function(chart, options)
    {
        var ret = null;
        if(isRealObject(chart) && typeof chart["binary"] === "string" && chart["binary"].length > 0)
        {
            var asc_chart_binary = new Asc.asc_CChartBinary();
            asc_chart_binary.asc_setBinary(chart["binary"]);
            ret = asc_chart_binary.getChartSpace(editor.WordControl.m_oLogicDocument);
            if(ret.spPr && ret.spPr.xfrm)
            {
                ret.spPr.xfrm.setOffX(0);
                ret.spPr.xfrm.setOffY(0);
            }
            ret.setBDeleted(false);
        }
        else if(isRealObject(chart))
        {
            ret = DrawingObjectsController.prototype._getChartSpace.call(this, chart, options, true);
            ret.setBDeleted(false);
            ret.setStyle(2);
            ret.setSpPr(new AscFormat.CSpPr());
            ret.spPr.setParent(ret);
            ret.spPr.setXfrm(new AscFormat.CXfrm());
            ret.spPr.xfrm.setParent(ret.spPr);
            ret.spPr.xfrm.setOffX(0);
            ret.spPr.xfrm.setOffY(0);
            ret.spPr.xfrm.setExtX(152);
            ret.spPr.xfrm.setExtY(89);
        }
        return ret;
    },

	getSeriesDefault: function (type) {
		// Обновлены тестовые данные для новой диаграммы


        var series = [], seria, Cat;
        var  createItem = function(value) {
            return { numFormatStr: "General", isDateTimeFormat: false, val: value, isHidden: false };
        };
        var  createItem2 = function(value, formatCode) {
            return { numFormatStr: formatCode, isDateTimeFormat: false, val: value, isHidden: false };
        };
        if(type !== c_oAscChartTypeSettings.stock)
        {

            var bIsScatter = (c_oAscChartTypeSettings.scatter <= type && type <= c_oAscChartTypeSettings.scatterSmoothMarker);

            Cat = { Formula: "Sheet1!$A$2:$A$7", NumCache: [createItem("USA"), createItem("CHN"), createItem("RUS"), createItem("GBR"), createItem("GER"), createItem("JPN")] };
            seria = new AscFormat.asc_CChartSeria();
            seria.Val.Formula = "Sheet1!$B$2:$B$7";
            seria.Val.NumCache = [ createItem(46), createItem(38), createItem(24), createItem(29), createItem(11), createItem(7) ];
            seria.TxCache.Formula = "Sheet1!$B$1";
            seria.TxCache.Tx = "Gold";
            if (!bIsScatter)
                seria.Cat = Cat;
            else
                seria.xVal = Cat;
            series.push(seria);

            seria = new AscFormat.asc_CChartSeria();
            seria.Val.Formula = "Sheet1!$C$2:$C$7";
            seria.Val.NumCache = [ createItem(29), createItem(27), createItem(26), createItem(17), createItem(19), createItem(14) ];
            seria.TxCache.Formula = "Sheet1!$C$1";
            seria.TxCache.Tx = "Silver";
            if (!bIsScatter)
                seria.Cat = Cat;
            else
                seria.xVal = Cat;
            series.push(seria);

            seria = new AscFormat.asc_CChartSeria();
            seria.Val.Formula = "Sheet1!$D$2:$D$7";
            seria.Val.NumCache = [ createItem(29), createItem(23), createItem(32), createItem(19), createItem(14), createItem(17) ];
            seria.TxCache.Formula = "Sheet1!$D$1";
            seria.TxCache.Tx = "Bronze";
            if (!bIsScatter)
                seria.Cat = Cat;
            else
                seria.xVal = Cat;
            series.push(seria);

            return series;
        }
        else
        {
            Cat = { Formula: "Sheet1!$A$2:$A$6", NumCache: [createItem2(38719, "d\-mmm\-yy"), createItem2(38720, "d\-mmm\-yy"), createItem2(38721, "d\-mmm\-yy"), createItem2(38722, "d\-mmm\-yy"), createItem2(38723, "d\-mmm\-yy")], formatCode: "d\-mmm\-yy" };
            seria = new AscFormat.asc_CChartSeria();
            seria.Val.Formula = "Sheet1!$B$2:$B$6";
            seria.Val.NumCache = [ createItem(40), createItem(21), createItem(37), createItem(49), createItem(32)];
            seria.TxCache.Formula = "Sheet1!$B$1";
            seria.TxCache.Tx = "Open";
            seria.Cat = Cat;
            series.push(seria);

            seria = new AscFormat.asc_CChartSeria();
            seria.Val.Formula = "Sheet1!$C$2:$C$6";
            seria.Val.NumCache = [ createItem(57), createItem(54), createItem(52), createItem(59), createItem(34)];
            seria.TxCache.Formula = "Sheet1!$C$1";
            seria.TxCache.Tx = "High";
            seria.Cat = Cat;
            series.push(seria);

            seria = new AscFormat.asc_CChartSeria();
            seria.Val.Formula = "Sheet1!$D$2:$D$6";
            seria.Val.NumCache = [ createItem(10), createItem(14), createItem(14), createItem(12), createItem(6)];
            seria.TxCache.Formula = "Sheet1!$D$1";
            seria.TxCache.Tx = "Low";
            seria.Cat = Cat;
            series.push(seria);

            seria = new AscFormat.asc_CChartSeria();
            seria.Val.Formula = "Sheet1!$E$2:$E$6";
            seria.Val.NumCache = [ createItem(24), createItem(35), createItem(48), createItem(35), createItem(15)];
            seria.TxCache.Formula = "Sheet1!$E$1";
            seria.TxCache.Tx = "Close";
            seria.Cat = Cat;
            series.push(seria);

            return series;
        }

	},

    changeCurrentState: function(newState)
    {
        this.curState = newState;
    },

    updateSelectionState: function(bNoCheck)
    {
        var text_object, drawingDocument = this.drawingObjects.getDrawingDocument();
        if(this.selection.textSelection)
        {
            text_object = this.selection.textSelection;
        }
        else if(this.selection.groupSelection)
        {
            if(this.selection.groupSelection.selection.textSelection)
            {
                text_object = this.selection.groupSelection.selection.textSelection;
            }
            else if(this.selection.groupSelection.selection.chartSelection && this.selection.groupSelection.selection.chartSelection.selection.textSelection)
            {
                text_object = this.selection.groupSelection.selection.chartSelection.selection.textSelection;
            }
        }
        else if(this.selection.chartSelection && this.selection.chartSelection.selection.textSelection)
        {
            text_object = this.selection.chartSelection.selection.textSelection;
        }
        if(isRealObject(text_object))
        {
            text_object.updateSelectionState(drawingDocument);
        }
        else if(bNoCheck !== true)
        {
            drawingDocument.UpdateTargetTransform(null);
            drawingDocument.TargetEnd();
            drawingDocument.SelectEnabled(false);
            drawingDocument.SelectShow();
        }
    },

    remove: function(dir, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord)
    {
        if(Asc["editor"] && Asc["editor"].isChartEditor && (!this.selection.chartSelection))
        {
            return;
        }
        this.checkSelectedObjectsAndCallback(this.removeCallback, [dir, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord, undefined], false, AscDFH.historydescription_Spreadsheet_Remove);
    },

    removeCallback: function(dir, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord, bNoCheck)
    {
        var target_text_object = getTargetTextObject(this);
        if(target_text_object)
        {
            if(target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                target_text_object.graphicObject.Remove(dir, bOnlyText, bRemoveOnlySelection, bOnTextAdd, isWord);
            }
            else
            {
                var content = this.getTargetDocContent(true);
                if(content)
                {
                    content.Remove(dir, true, bRemoveOnlySelection, bOnTextAdd, isWord)
                }

                bNoCheck !== true && target_text_object.checkExtentsByDocContent && target_text_object.checkExtentsByDocContent();
            }
        }
        else if(this.selectedObjects.length > 0)
        {
            var worksheet = this.drawingObjects.getWorksheet();
            if(worksheet)
            {
                worksheet.endEditChart();
            }
            var aAllShapes = [];
            if(this.selection.groupSelection)
            {
                if(this.selection.groupSelection.selection.chartSelection)
                {
                    this.selection.groupSelection.selection.chartSelection.remove();
                }
                else
                {
                    this.resetConnectors(this.selection.groupSelection.selectedObjects);
                    var group_map = {}, group_arr = [], i, cur_group, sp, xc, yc, hc, vc, rel_xc, rel_yc, j;
                    for(i = 0; i < this.selection.groupSelection.selectedObjects.length; ++i)
                    {
                        this.selection.groupSelection.selectedObjects[i].group.removeFromSpTree(this.selection.groupSelection.selectedObjects[i].Get_Id());
                        group_map[this.selection.groupSelection.selectedObjects[i].group.Get_Id()+""] = this.selection.groupSelection.selectedObjects[i].group;
                        if(this.selection.groupSelection.selectedObjects[i].setBDeleted){
                            this.selection.groupSelection.selectedObjects[i].setBDeleted(true);
                        }
                    }
                    group_map[this.selection.groupSelection.Get_Id()+""] = this.selection.groupSelection;
                    for(var key in group_map)
                    {
                        if(group_map.hasOwnProperty(key))
                            group_arr.push(group_map[key]);
                    }
                    group_arr.sort(CompareGroups);
                    for(i = 0; i < group_arr.length; ++i)
                    {
                        cur_group = group_arr[i];
                        if(isRealObject(cur_group.group))
                        {
                            if(cur_group.spTree.length === 0)
                            {
                                cur_group.group.removeFromSpTree(cur_group.Get_Id());
                            }
                            else if(cur_group.spTree.length == 1)
                            {
                                sp = cur_group.spTree[0];
                                hc = sp.spPr.xfrm.extX/2;
                                vc = sp.spPr.xfrm.extY/2;
                                xc = sp.transform.TransformPointX(hc, vc);
                                yc = sp.transform.TransformPointY(hc, vc);
                                rel_xc = cur_group.group.invertTransform.TransformPointX(xc, yc);
                                rel_yc = cur_group.group.invertTransform.TransformPointY(xc, yc);
                                sp.spPr.xfrm.setOffX(rel_xc - hc);
                                sp.spPr.xfrm.setOffY(rel_yc - vc);
                                sp.spPr.xfrm.setRot(AscFormat.normalizeRotate(cur_group.rot + sp.rot));
                                sp.spPr.xfrm.setFlipH(cur_group.spPr.xfrm.flipH === true ? !(sp.spPr.xfrm.flipH === true) : sp.spPr.xfrm.flipH === true);
                                sp.spPr.xfrm.setFlipV(cur_group.spPr.xfrm.flipV === true ? !(sp.spPr.xfrm.flipV === true) : sp.spPr.xfrm.flipV === true);
                                sp.setGroup(cur_group.group);
                                for(j = 0; j < cur_group.group.spTree.length; ++j)
                                {
                                    if(cur_group.group.spTree[j] === cur_group)
                                    {
                                        cur_group.group.addToSpTree(j, sp);
                                        cur_group.group.removeFromSpTree(cur_group.Get_Id());
                                    }
                                }
                            }
                        }
                        else
                        {
                            if(cur_group.spTree.length === 0)
                            {
                                this.resetInternalSelection();
                                this.removeCallback(-1, undefined, undefined, undefined, undefined, undefined);
                                return;
                            }
                            else if(cur_group.spTree.length === 1)
                            {
                                sp = cur_group.spTree[0];
                                sp.spPr.xfrm.setOffX(cur_group.spPr.xfrm.offX + sp.spPr.xfrm.offX);
                                sp.spPr.xfrm.setOffY(cur_group.spPr.xfrm.offY + sp.spPr.xfrm.offY);
                                sp.spPr.xfrm.setRot(AscFormat.normalizeRotate(cur_group.rot + sp.rot));
                                sp.spPr.xfrm.setFlipH(cur_group.spPr.xfrm.flipH === true ? !(sp.spPr.xfrm.flipH === true) : sp.spPr.xfrm.flipH === true);
                                sp.spPr.xfrm.setFlipV(cur_group.spPr.xfrm.flipV === true ? !(sp.spPr.xfrm.flipV === true) : sp.spPr.xfrm.flipV === true);
                                sp.setGroup(null);
                                sp.addToDrawingObjects();
                                sp.checkDrawingBaseCoords();
                                cur_group.deleteDrawingBase();
                                this.resetSelection();
                                this.selectObject(sp, cur_group.selectStartPage);
                            }
                            else
                            {
                                cur_group.updateCoordinatesAfterInternalResize();
                            }
                            this.resetInternalSelection();
                            this.recalculate();
                            return;
                        }
                    }
                    this.resetInternalSelection();
                }
            }
            else if(this.selection.chartSelection)
            {
                this.selection.chartSelection.remove();
            }
            else
            {
                this.resetConnectors(this.selectedObjects);
                for(var i = 0; i < this.selectedObjects.length; ++i)
                {
                    
                    this.selectedObjects[i].deleteDrawingBase(true);                    
                    if(this.selectedObjects[i].signatureLine){
                        var oApi = this.getEditorApi();
                        if(oApi){
                            oApi.sendEvent("asc_onRemoveSignature", this.selectedObjects[i].signatureLine.id);
                        }
                    }
                    if(this.selectedObjects[i].setBDeleted){
                        this.selectedObjects[i].setBDeleted(true);
                    }

                }
                this.resetSelection();
                this.recalculate();
            }
            this.updateOverlay();
        }
        else if(this.drawingObjects.slideComments)
        {
            this.drawingObjects.slideComments.removeSelectedComment();
        }
    },


    getAllObjectsOnPage: function(pageIndex, bHdrFtr)
    {
        return this.getDrawingArray();
    },

    selectNextObject: function(direction)
    {
        var selection_array = this.selectedObjects;
        if(selection_array.length > 0)
        {
            var i, graphic_page;
            if(direction > 0)
            {
                var selectNext = function (oThis, last_selected_object)
                {
                    var search_array = oThis.getAllObjectsOnPage(last_selected_object.selectStartPage,
                        last_selected_object.parent && last_selected_object.parent.DocumentContent && last_selected_object.parent.DocumentContent.IsHdrFtr(false));

                    if(search_array.length > 0)
                    {
                        for(var i = search_array.length-1; i > -1; --i)
                        {
                            if(search_array[i] === last_selected_object)
                                break;
                        }
                        if(i > -1)
                        {
                            oThis.resetSelection();
                            oThis.selectObject(search_array[i < search_array.length - 1 ? i+1 : 0], last_selected_object.selectStartPage);
                            return;
                        }
                        else
                        {
                            return;
                        }
                    }

                };

                if(this.selection.groupSelection)
                {
                    for(i = this.selection.groupSelection.arrGraphicObjects.length - 1; i > -1; --i)
                    {
                        if(this.selection.groupSelection.arrGraphicObjects[i].selected)
                            break;
                    }
                    if(i > -1)
                    {
                        if(i < this.selection.groupSelection.arrGraphicObjects.length-1)
                        {
                            this.selection.groupSelection.resetSelection();
                            this.selection.groupSelection.selectObject(this.selection.groupSelection.arrGraphicObjects[i+1], this.selection.groupSelection.selectStartPage);
                        }
                        else
                        {
                            selectNext(this, this.selection.groupSelection);
                        }
                    }
                }
                //else if(this.selection.chartSelection)
                //{}
                else
                {
                    var last_selected_object = this.selectedObjects[this.selectedObjects.length-1];
                    if(last_selected_object.getObjectType() === AscDFH.historyitem_type_GroupShape && last_selected_object.arrGraphicObjects.length > 0)
                    {
                        this.resetSelection();
                        this.selectObject(last_selected_object, last_selected_object.selectStartPage);
                        this.selection.groupSelection = last_selected_object;
                        last_selected_object.selectObject(last_selected_object.arrGraphicObjects[0], last_selected_object.selectStartPage);
                    }
                    //else if(last_selected_object.getObjectType() === AscDFH.historyitem_type_ChartSpace)
                    //{TODO}
                    else
                    {
                        selectNext(this, last_selected_object)
                    }
                }
            }
            else
            {
                var selectPrev = function (oThis, first_selected_object)
                {
                    var search_array = oThis.getAllObjectsOnPage(first_selected_object.selectStartPage,
                        first_selected_object.parent && first_selected_object.parent.DocumentContent && first_selected_object.parent.DocumentContent.IsHdrFtr(false));

                    if(search_array.length > 0)
                    {
                        for(var i = 0; i < search_array.length; ++i)
                        {
                            if(search_array[i] === first_selected_object)
                                break;
                        }
                        if(i < search_array.length)
                        {
                            oThis.resetSelection();
                            oThis.selectObject(search_array[i > 0 ? i-1 : search_array.length-1], first_selected_object.selectStartPage);
                            return;
                        }
                        else
                        {
                            return;
                        }
                    }
                };
                if(this.selection.groupSelection)
                {
                    for(i = 0; i < this.selection.groupSelection.arrGraphicObjects.length; ++i)
                    {
                        if(this.selection.groupSelection.arrGraphicObjects[i].selected)
                            break;
                    }
                    if(i < this.selection.groupSelection.arrGraphicObjects.length)
                    {
                        if(i > 0)
                        {
                            this.selection.groupSelection.resetSelection();
                            this.selection.groupSelection.selectObject(this.selection.groupSelection.arrGraphicObjects[i-1], this.selection.groupSelection.selectStartPage);
                        }
                        else
                        {
                            selectPrev(this, this.selection.groupSelection);
                        }
                    }
                    else
                    {

                        return;
                    }
                }
                //else if(this.selection.chartSelection)
                //{
                //
                //}
                else
                {
                    var first_selected_object = this.selectedObjects[0];
                    if(first_selected_object.getObjectType() === AscDFH.historyitem_type_GroupShape && first_selected_object.arrGraphicObjects.length > 0)
                    {
                        this.resetSelection();
                        this.selectObject(first_selected_object, first_selected_object.selectStartPage);
                        this.selection.groupSelection = first_selected_object;
                        first_selected_object.selectObject(first_selected_object.arrGraphicObjects[first_selected_object.arrGraphicObjects.length-1], first_selected_object.selectStartPage);
                    }
                    //else if(last_selected_object.getObjectType() === AscDFH.historyitem_type_ChartSpace)
                    //{TODO}
                    else
                    {
                        selectPrev(this, first_selected_object)
                    }
                }
            }
            this.updateOverlay();
            if(this.drawingObjects && this.drawingObjects.sendGraphicObjectProps){
                this.drawingObjects.sendGraphicObjectProps();
            }
            else if(this.document && this.document.Document_UpdateInterfaceState){
                this.document.Document_UpdateInterfaceState();
            }
        }
    },



    moveSelectedObjects: function(dx, dy)
    {
        if(!this.canEdit())
            return;

        var oldCurState = this.curState;
        this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
        this.swapTrackObjects();
        var move_state;
        if(!this.selection.groupSelection)
            move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
        else
            move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

        for(var i = 0; i < this.arrTrackObjects.length; ++i)
            this.arrTrackObjects[i].track(dx, dy, this.arrTrackObjects[i].originalObject.selectStartPage);
        var nPageIndex  = (this.arrTrackObjects[0] && this.arrTrackObjects[0].originalObject && AscFormat.isRealNumber(this.arrTrackObjects[0].originalObject.selectStartPage)) ? this.arrTrackObjects[0].originalObject.selectStartPage : 0;
        move_state.bSamePos = false;
        move_state.onMouseUp({}, 0, 0, nPageIndex);
        this.curState = oldCurState;
    },

    cursorMoveToStartPos: function()
    {
        var content = this.getTargetDocContent(undefined, true);
        if(content)
        {
            content.MoveCursorToStartPos();
            this.updateSelectionState();
        }
    },

    cursorMoveToEndPos: function()
    {
        var content = this.getTargetDocContent(undefined, true);
        if(content)
        {
            content.MoveCursorToEndPos();
            this.updateSelectionState();
        }
    },

    getMoveDist: function(bWord){
        if(bWord){
            return this.convertPixToMM(1);
        }
        else{
            return this.convertPixToMM(5);
        }
    },

    cursorMoveLeft: function(AddToSelect/*Shift*/, Word/*Ctrl*/)
    {
        var target_text_object = getTargetTextObject(this);
        if(target_text_object)
        {
            if(target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                target_text_object.graphicObject.MoveCursorLeft(AddToSelect, Word);
            }
            else
            {
                var content = this.getTargetDocContent(undefined, true);
                if(content)
                {
                    content.MoveCursorLeft(AddToSelect, Word);
                }
            }
            this.updateSelectionState();
        }
        else
        {
            if(this.selectedObjects.length === 0)
                return;

            this.moveSelectedObjects(-this.getMoveDist(Word), 0);
        }
    },

    cursorMoveRight: function(AddToSelect, Word, bFromPaste)
    {
        var target_text_object = getTargetTextObject(this);
        if(target_text_object)
        {
            if(target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                target_text_object.graphicObject.MoveCursorRight(AddToSelect, Word, bFromPaste);
            }
            else
            {
                var content = this.getTargetDocContent(undefined, true);
                if(content)
                {
                    content.MoveCursorRight(AddToSelect, Word, bFromPaste);
                }
            }
            this.updateSelectionState();
        }
        else
        {
            if(this.selectedObjects.length === 0)
                return;
            this.moveSelectedObjects(this.getMoveDist(Word), 0);
        }
    },


    cursorMoveUp: function(AddToSelect, Word)
    {
        var target_text_object = getTargetTextObject(this);
        if(target_text_object)
        {
            if(target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                target_text_object.graphicObject.MoveCursorUp(AddToSelect);
            }
            else
            {
                var content = this.getTargetDocContent(undefined, true);
                if(content)
                {
                    content.MoveCursorUp(AddToSelect);
                }
            }
            this.updateSelectionState();
        }
        else
        {
            if(this.selectedObjects.length === 0)
                return;
            this.moveSelectedObjects(0, -this.getMoveDist(Word));
        }
    },

    cursorMoveDown: function(AddToSelect, Word)
    {
        var target_text_object = getTargetTextObject(this);
        if(target_text_object)
        {
            if(target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                target_text_object.graphicObject.MoveCursorDown(AddToSelect);
            }
            else
            {
                var content = this.getTargetDocContent(undefined, true);
                if(content)
                {
                    content.MoveCursorDown(AddToSelect);
                }
            }
            this.updateSelectionState();
        }
        else
        {
            if(this.selectedObjects.length === 0)
                return;
            this.moveSelectedObjects(0, this.getMoveDist(Word));
        }
    },

    cursorMoveEndOfLine: function(AddToSelect)
    {
        var content = this.getTargetDocContent(undefined, true);
        if(content)
        {
            content.MoveCursorToEndOfLine(AddToSelect);
            this.updateSelectionState();
        }
    },


    cursorMoveStartOfLine: function(AddToSelect)
    {

        var content = this.getTargetDocContent(undefined, true);
        if(content)
        {
            content.MoveCursorToStartOfLine(AddToSelect);
            this.updateSelectionState();
        }
    },

    cursorMoveAt: function( X, Y, AddToSelect )
    {
        var text_object;
        if(this.selection.textSelection)
        {
            text_object = this.selection.textSelection;
        }
        else if(this.selection.groupSelection && this.selection.groupSelection.selection.textSelection)
        {
            text_object = this.selection.groupSelection.selection.textSelection;
        }
        if(text_object && text_object.cursorMoveAt)
        {
            text_object.cursorMoveAt( X, Y, AddToSelect );
            this.updateSelectionState();
        }
    },

    resetTextSelection: function()
    {
        var oContent = this.getTargetDocContent();
        if(oContent)
        {
            oContent.RemoveSelection();
            var oTextSelection;
            if(this.selection.groupSelection)
            {
                oTextSelection = this.selection.groupSelection.selection.textSelection;
                this.selection.groupSelection.selection.textSelection = null;
            }

            if(this.selection.textSelection)
            {
                oTextSelection = this.selection.textSelection;
                this.selection.textSelection = null;
            }

            if(oTextSelection && oTextSelection.recalcInfo)
            {
                if(oTextSelection.recalcInfo.bRecalculatedTitle)
                {
                    oTextSelection.recalcInfo.recalcTitle = null;
                    oTextSelection.recalcInfo.bRecalculatedTitle = false;
                }
            }

            if(this.selection.chartSelection)
            {
                this.selection.chartSelection.selection.textSelection = null
            }

        }
    },

    selectAll: function()
    {
        var i;
        var target_text_object = getTargetTextObject(this);
        if(target_text_object)
        {
            if(target_text_object.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                target_text_object.graphicObject.SelectAll();
            }
            else
            {
                var content = this.getTargetDocContent();
                if(content)
                {
                    content.SelectAll();
                }
            }
        }
        else if(!this.document)
        {
            if(this.selection.groupSelection)
            {
                if(!this.selection.groupSelection.selection.chartSelection)
                {
                    this.selection.groupSelection.resetSelection();
                    for(i = this.selection.groupSelection.arrGraphicObjects.length - 1; i > -1; --i)
                    {
                        this.selection.groupSelection.selectObject(this.selection.groupSelection.arrGraphicObjects[i], 0);
                    }
                }
            }
            else if(!this.selection.chartSelection)
            {
                this.resetSelection();
                var drawings = this.getDrawingObjects();
                for(i = drawings.length - 1; i > -1; --i)
                {
                    this.selectObject(drawings[i], 0);
                }
            }
        }
        else{
            this.resetSelection();
            this.document.SetDocPosType(docpostype_Content);
            this.document.SelectAll();
        }
        this.updateSelectionState();
    },

    canEdit: function()
    {
        var oApi = this.getEditorApi();
        var _ret = true;
        if(oApi){
            _ret = oApi.canEdit();
        }
        return _ret;
    },

    onKeyDown: function(e)
    {
        var ctrlKey = e.metaKey || e.ctrlKey;
        var drawingObjectsController = this;
        var bRetValue = false;
        var state = drawingObjectsController.curState;
        var canEdit = drawingObjectsController.canEdit();
        var oApi = window["Asc"]["editor"];
        if ( e.keyCode == 8 && canEdit ) // BackSpace
        {
            var oTargetTextObject = getTargetTextObject(this);
            drawingObjectsController.remove(-1, undefined, undefined, undefined, ctrlKey);
            bRetValue = true;
        }
        else if ( e.keyCode == 9 && canEdit ) // Tab
        {
            if(this.getTargetDocContent())
            {

                var oThis = this;
                var callBack = function()
                {
                    oThis.paragraphAdd(new ParaTab());
                };
                this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_AddTab, undefined, window["Asc"]["editor"].collaborativeEditing.getFast())
            }
            else
            {
                this.selectNextObject(!e.shiftKey ? 1 : -1);
            }
            bRetValue = true;
        }
        else if ( e.keyCode == 13 && canEdit ) // Enter
        {
            var target_doc_content = this.getTargetDocContent();
            if(target_doc_content)
            {
                var hyperlink = this.hyperlinkCheck(false);
                if(hyperlink && !e.shiftKey)
                {
                    window["Asc"]["editor"].wb.handlers.trigger("asc_onHyperlinkClick", hyperlink.GetValue());
                    hyperlink.SetVisited(true);
                    this.drawingObjects.showDrawingObjects(true);
                }
                else
                {
                    var oSelectedInfo = new CSelectedElementsInfo();
                    target_doc_content.GetSelectedElementsInfo(oSelectedInfo);
                    var oMath         = oSelectedInfo.Get_Math();
                    if (null !== oMath && oMath.Is_InInnerContent())
                    {
                        this.checkSelectedObjectsAndCallback(function()
                        {
                            oMath.Handle_AddNewLine();
                        }, [], false, AscDFH.historydescription_Spreadsheet_AddNewParagraph, undefined, window["Asc"]["editor"].collaborativeEditing.getFast());
                        this.recalculate();
                    }
                    else
                    {
                        this.checkSelectedObjectsAndCallback(this.addNewParagraph, [], false, AscDFH.historydescription_Spreadsheet_AddNewParagraph, undefined, window["Asc"]["editor"].collaborativeEditing.getFast());
                        this.recalculate();
                    }

                }
            }
            else{
                var nResult = this.handleEnter();
                if(nResult & 1){
                    this.updateSelectionState();
                    if(this.drawingObjects && this.drawingObjects.sendGraphicObjectProps){
                        this.drawingObjects.sendGraphicObjectProps();
                    }
                }
            }
            bRetValue = true;
        }
        else if ( e.keyCode == 27 ) // Esc
        {
            var content = this.getTargetDocContent();
            if(content)
            {
                content.RemoveSelection();
            }

            if(this.selection.textSelection)
            {
                this.selection.textSelection = null;
                drawingObjectsController.updateSelectionState();
            }
            else if(this.selection.groupSelection)
            {
                if(this.selection.groupSelection.selection.textSelection)
                {
                    this.selection.groupSelection.selection.textSelection = null;
                }
                else if(this.selection.groupSelection.selection.chartSelection)
                {
                    if(this.selection.groupSelection.selection.chartSelection.selection.textSelection)
                    {
                        this.selection.groupSelection.selection.chartSelection.selection.textSelection = null;
                    }
                    else
                    {
                        this.selection.groupSelection.selection.chartSelection.resetSelection();
                        this.selection.groupSelection.selection.chartSelection = null;
                    }
                }
                else
                {
                    this.selection.groupSelection.resetSelection();
                    this.selection.groupSelection = null;
                }
                drawingObjectsController.updateSelectionState();
            }
            else if(this.selection.chartSelection)
            {
                if(this.selection.chartSelection.selection.textSelection)
                {
                    this.selection.chartSelection.selection.textSelection = null;
                }
                else
                {
                    this.selection.chartSelection.resetSelection();
                    this.selection.chartSelection = null;
                }
                drawingObjectsController.updateSelectionState();
            }
            else
            {
                if(!this.checkEndAddShape())
                {
                    this.resetSelection();
                    var ws = drawingObjectsController.drawingObjects.getWorksheet();
                    var isChangeSelectionShape = ws._endSelectionShape();
                    if (isChangeSelectionShape) {
                        ws._drawSelection();
                        ws._updateSelectionNameAndInfo();
                    }
                }
            }
            bRetValue = true;
        }
        else if ( e.keyCode == 33 ) // PgUp
        {
        }
        else if ( e.keyCode == 34 ) // PgDn
        {
        }
        else if ( e.keyCode == 35 ) // клавиша End
        {
            var content = this.getTargetDocContent();
            if(content)
            {
                if (ctrlKey) // Ctrl + End - переход в конец документа
                {
                    content.MoveCursorToEndPos();
                    drawingObjectsController.updateSelectionState();
                    drawingObjectsController.updateOverlay();
                    this.drawingObjects.sendGraphicObjectProps();

                }
                else // Переходим в конец строки
                {
                    content.MoveCursorToEndOfLine(e.shiftKey);
                    drawingObjectsController.updateSelectionState();
                    drawingObjectsController.updateOverlay();
                    this.drawingObjects.sendGraphicObjectProps();
                }
            }
            bRetValue = true;
        }
        else if ( e.keyCode == 36 ) // клавиша Home
        {
            var content = this.getTargetDocContent();
            if(content)
            {
                if (ctrlKey) // Ctrl + End - переход в конец документа
                {
                    content.MoveCursorToStartPos();
                    drawingObjectsController.updateSelectionState();
                    drawingObjectsController.updateOverlay();
                    this.drawingObjects.sendGraphicObjectProps();
                }
                else // Переходим в конец строки
                {
                    content.MoveCursorToStartOfLine(e.shiftKey);
                    drawingObjectsController.updateSelectionState();
                    drawingObjectsController.updateOverlay();
                    this.drawingObjects.sendGraphicObjectProps();
                }
            }
            bRetValue = true;
        }
        else if ( e.keyCode == 37 ) // Left Arrow
        {
            this.cursorMoveLeft(e.shiftKey,ctrlKey );

            drawingObjectsController.updateSelectionState();
            drawingObjectsController.updateOverlay();
            this.drawingObjects.sendGraphicObjectProps();
            bRetValue = true;
        }
        else if ( e.keyCode == 38 ) // Top Arrow
        {
            this.cursorMoveUp(e.shiftKey, ctrlKey);

            drawingObjectsController.updateSelectionState();
            drawingObjectsController.updateOverlay();
            this.drawingObjects.sendGraphicObjectProps();
            bRetValue = true;
        }
        else if ( e.keyCode == 39 ) // Right Arrow
        {
            this.cursorMoveRight(e.shiftKey,ctrlKey );

            drawingObjectsController.updateSelectionState();
            drawingObjectsController.updateOverlay();
            this.drawingObjects.sendGraphicObjectProps();
            bRetValue = true;
        }
        else if ( e.keyCode == 40 ) // Bottom Arrow
        {
            this.cursorMoveDown(e.shiftKey, ctrlKey);

            drawingObjectsController.updateSelectionState();
            drawingObjectsController.updateOverlay();
            this.drawingObjects.sendGraphicObjectProps();
            bRetValue = true;
        }
        else if ( e.keyCode == 45 ) // Insert
        {
            //TODO
        }
        else if ( e.keyCode == 46 && canEdit ) // Delete
        {
			if (!e.shiftKey)
			{
				var oTargetTextObject = getTargetTextObject(this);
				drawingObjectsController.remove(1, undefined, undefined, undefined, ctrlKey);
				bRetValue = true;
			}
        }
        else if ( e.keyCode == 65 && true === ctrlKey ) // Ctrl + A - выделяем все
        {
            this.selectAll();
            this.drawingObjects.sendGraphicObjectProps();
            bRetValue = true;
        }
        else if ( e.keyCode == 66 && canEdit && true === ctrlKey ) // Ctrl + B - делаем текст жирным
        {
            var TextPr = drawingObjectsController.getParagraphTextPr();
            if ( isRealObject(TextPr))
            {
                this.setCellBold(TextPr.Bold === true ? false : true );
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 67 && true === ctrlKey ) // Ctrl + C + ...
        {
            //TODO
        }
        else if ( e.keyCode == 69 && canEdit && true === ctrlKey ) // Ctrl + E - переключение прилегания параграфа между center и left
        {

            var ParaPr = drawingObjectsController.getParagraphParaPr();
            if ( isRealObject(ParaPr))
            {
                this.setCellAlign(ParaPr.Jc === AscCommon.align_Center ? AscCommon.align_Left : AscCommon.align_Center );
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 73 && canEdit && true === ctrlKey ) // Ctrl + I - делаем текст наклонным
        {
            var TextPr = drawingObjectsController.getParagraphTextPr();
            if ( isRealObject(TextPr))
            {
                drawingObjectsController.setCellItalic(TextPr.Italic === true ? false : true );
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 74 && canEdit && true === ctrlKey ) // Ctrl + J переключение прилегания параграфа между justify и left
        {
            var ParaPr = drawingObjectsController.getParagraphParaPr();
            if ( isRealObject(ParaPr))
            {
                drawingObjectsController.setCellAlign(ParaPr.Jc === AscCommon.align_Justify ? AscCommon.align_Left : AscCommon.align_Justify );
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 75 && canEdit && true === ctrlKey ) // Ctrl + K - добавление гиперссылки
        {
            //TODO
            bRetValue = true;
        }
        else if ( e.keyCode == 76 && canEdit && true === ctrlKey ) // Ctrl + L + ...
        {

            var ParaPr = drawingObjectsController.getParagraphParaPr();
            if ( isRealObject(ParaPr))
            {
                drawingObjectsController.setCellAlign(ParaPr.Jc === AscCommon.align_Left ? AscCommon.align_Justify : AscCommon.align_Left);
                bRetValue = true;
            }

        }
        else if ( e.keyCode == 77 && canEdit && true === ctrlKey ) // Ctrl + M + ...
        {
            bRetValue = true;

        }
        else if ( e.keyCode == 80 && true === ctrlKey ) // Ctrl + P + ...
        {
            bRetValue = true;

        }
        else if ( e.keyCode == 82 && canEdit && true === ctrlKey ) // Ctrl + R - переключение прилегания параграфа между right и left
        {
            var ParaPr = drawingObjectsController.getParagraphParaPr();
            if ( isRealObject(ParaPr))
            {
                drawingObjectsController.setCellAlign(ParaPr.Jc === AscCommon.align_Right ? AscCommon.align_Left : AscCommon.align_Right);
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 83 && canEdit && true === ctrlKey ) // Ctrl + S - save
        {
            bRetValue = false;
        }
        else if ( e.keyCode == 85 && canEdit && true === ctrlKey ) // Ctrl + U - делаем текст подчеркнутым
        {
            var TextPr = drawingObjectsController.getParagraphTextPr();
            if ( isRealObject(TextPr))
            {
                drawingObjectsController.setCellUnderline(TextPr.Underline === true ? false : true );
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 86 && canEdit && true === ctrlKey ) // Ctrl + V - paste
        {

        }
        else if ( e.keyCode == 88 && canEdit && true === ctrlKey ) // Ctrl + X - cut
        {
            //не возвращаем true чтобы не было preventDefault
        }
        else if ( e.keyCode == 89 && canEdit && true === ctrlKey ) // Ctrl + Y - Redo
        {
        }
        else if ( e.keyCode == 90 && canEdit && true === ctrlKey ) // Ctrl + Z - Undo
        {
        }
        else if ( e.keyCode == 93 || 57351 == e.keyCode /*в Opera такой код*/ ) // контекстное меню
        {
            bRetValue = true;
        }
        else if ( e.keyCode == 121 && true === e.shiftKey ) // Shift + F10 - контекстное меню
        {
        }
        else if ( e.keyCode == 144 ) // Num Lock
        {
        }
        else if ( e.keyCode == 145 ) // Scroll Lock
        {
        }
        else if ( e.keyCode == 187 && canEdit && true === ctrlKey ) // Ctrl + Shift + +, Ctrl + = - superscript/subscript
        {
            var TextPr = drawingObjectsController.getParagraphTextPr();
            if ( isRealObject(TextPr))
            {
                if ( true === e.shiftKey )
                    drawingObjectsController.setCellSuperscript(TextPr.VertAlign === AscCommon.vertalign_SuperScript ? false : true );
                else
                    drawingObjectsController.setCellSubscript(TextPr.VertAlign === AscCommon.vertalign_SubScript ? false : true );
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 188 && true === ctrlKey ) // Ctrl + ,
        {
            var TextPr = drawingObjectsController.getParagraphTextPr();
            if ( isRealObject(TextPr))
            {
                drawingObjectsController.setCellSuperscript(TextPr.VertAlign === AscCommon.vertalign_SuperScript ? false : true );
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 189 && canEdit ) // Клавиша Num-
        {

            var Item = null;
            var oThis = this;
            var callBack = function()
            {
                var Item = null;
                if ( true === ctrlKey && true === e.shiftKey )
                {
                    Item = new ParaText(0x2013);
                    Item.SpaceAfter = false;
                }
                else if ( true === e.shiftKey )
                    Item = new ParaText("_".charCodeAt(0));
                else
                    Item = new ParaText("-".charCodeAt(0));
                oThis.paragraphAdd(Item);
            };
            this.checkSelectedObjectsAndCallback(callBack, [], false, AscDFH.historydescription_Spreadsheet_AddItem, undefined, window["Asc"]["editor"].collaborativeEditing.getFast());
            bRetValue = true;
        }
        else if ( e.keyCode == 190 && true === ctrlKey ) // Ctrl + .
        {
            var TextPr = drawingObjectsController.getParagraphTextPr();
            if ( isRealObject(TextPr))
            {
                drawingObjectsController.setCellSubscript(TextPr.VertAlign === AscCommon.vertalign_SubScript ? false : true );
                bRetValue = true;
            }
        }
        else if ( e.keyCode == 219 && canEdit && true === ctrlKey ) // Ctrl + [
        {
            drawingObjectsController.decreaseFontSize();
            bRetValue = true;
        }
        else if ( e.keyCode == 221 && canEdit && true === ctrlKey ) // Ctrl + ]
        {
            drawingObjectsController.increaseFontSize();
            bRetValue = true;
        }
        else if ( e.keyCode === 113 ) // F2
        {
            // ToDo обработать эту горячую клавишу. В автофигуры можно добавлять формулу
            bRetValue = true;
        }
        if(bRetValue)
            e.preventDefault();
        return bRetValue;
    },

    checkTrackDrawings: function(){
        return this.curState instanceof  AscFormat.StartAddNewShape
        || this.curState instanceof  AscFormat.SplineBezierState
        || this.curState instanceof  AscFormat.PolyLineAddState
        || this.curState instanceof  AscFormat.AddPolyLine2State
        || this.arrTrackObjects.length > 0 || this.arrPreTrackObjects.length > 0;
    },

    checkEndAddShape: function()
    {
        if(this.curState instanceof  AscFormat.StartAddNewShape
            || this.curState instanceof  AscFormat.SplineBezierState
            || this.curState instanceof  AscFormat.PolyLineAddState
            || this.curState instanceof  AscFormat.AddPolyLine2State
            || this.arrTrackObjects.length > 0)
        {
            this.changeCurrentState(new AscFormat.NullState(this));
            if( this.arrTrackObjects.length > 0)
            {
                this.clearTrackObjects();
                this.updateOverlay();
            }
            if(Asc["editor"])
            {
                Asc["editor"].asc_endAddShape();
                var ws = Asc["editor"].wb.getWorksheet();
                if(ws){
                    var ct = ws.getCursorTypeFromXY(ws.objectRender.lastX, ws.objectRender.lastY);
                    if(ct){
                        Asc["editor"].wb._onUpdateCursor(ct.cursor);
                    }
                }
            }
            return true;
        }
        return false;
    },

    /*onKeyPress: function(e)
     {
     this.curState.onKeyPress(e);
     return true;
     },*/

    resetSelectionState: function()
    {
        if(this.bNoResetSeclectionState === true)
            return;
        this.checkChartTextSelection();
        this.resetSelection();
        this.clearPreTrackObjects();
        this.clearTrackObjects();
        this.changeCurrentState(new AscFormat.NullState(this, this.drawingObjects));
        this.updateSelectionState();
        Asc["editor"] && Asc["editor"].asc_endAddShape();
    },

    resetSelectionState2: function()
    {
        var count = this.selectedObjects.length;
        while(count > 0)
        {
            this.selectedObjects[0].deselect(this);
            --count;
        }
        this.changeCurrentState(new AscFormat.NullState(this, this.drawingObjects));
    },

    addTextWithPr: function(sText, oTextPr, isMoveCursorOutside)
    {

        this.checkSelectedObjectsAndCallback(function(){
            var oTargetDocContent = this.getTargetDocContent(true, false);
            if(oTargetDocContent) {
                oTargetDocContent.Remove(-1, true, true, true, undefined);
                var oCurrentTextPr = oTargetDocContent.GetDirectTextPr();
                var oParagraph = oTargetDocContent.GetCurrentParagraph();
                if (oParagraph && oParagraph.GetParent())
                {
                    var oTempPara = new Paragraph(this.drawingObjects.getDrawingDocument(), oParagraph.GetParent());
                    var oRun      = new ParaRun(oTempPara, false);
                    oRun.AddText(sText);
                    oTempPara.AddToContent(0, oRun);

                    oRun.SetPr(oCurrentTextPr.Copy());
                    if (oTextPr)
                        oRun.ApplyPr(oTextPr);

                    var oAnchorPos = oParagraph.GetCurrentAnchorPosition();

                    var oSelectedContent = new CSelectedContent();
                    var oSelectedElement = new CSelectedElement();

                    oSelectedElement.Element     = oTempPara;
                    oSelectedElement.SelectedAll = false;
                    oSelectedContent.Add(oSelectedElement);

                    oSelectedContent.On_EndCollectElements(oTargetDocContent, false);

                    oParagraph.GetParent().InsertContent(oSelectedContent, oAnchorPos);

                    if (oTargetDocContent.IsSelectionUse())
                    {
                        if (isMoveCursorOutside)
                        {
                            oTargetDocContent.RemoveSelection();
                            oRun.MoveCursorOutsideElement(false);
                        }
                        else
                        {
                            oTargetDocContent.MoveCursorRight(false, false, true);
                        }
                    }
                    else if (isMoveCursorOutside)
                    {
                        oRun.MoveCursorOutsideElement(false);
                    }
                    var oTargetTextObject = getTargetTextObject(this);
                    if(oTargetTextObject && oTargetTextObject.checkExtentsByDocContent)
                    {
                        oTargetTextObject.checkExtentsByDocContent();
                    }
                }

            }
        }, [], false, AscDFH.historydescription_Document_AddTextWithProperties);
    },

    getColorMapOverride: function()
    {
        return null;
    },

    Document_UpdateInterfaceState: function()
    {},

    getChartObject: function(type, w, h)
    {
        if(null != type)
        {
            return AscFormat.ExecuteNoHistory(function()
            {
                var options = new Asc.asc_ChartSettings();
                options.type = type;
                options.style = 1;
                options.putTitle(c_oAscChartTitleShowSettings.noOverlay);
                var chartSeries = {series: DrawingObjectsController.prototype.getSeriesDefault.call(this, type),
                    parsedHeaders: {bLeft: true, bTop: true}};
                var ret = this.getChartSpace2(chartSeries, options);
                if (!ret) {
                    chartSeries = {series: DrawingObjectsController.prototype.getSeriesDefault.call(this,
                        c_oAscChartTypeSettings.barNormal), parsedHeaders: {bLeft: true, bTop: true}};
                    ret = this.getChartSpace2(chartSeries, options);
                }
                if(type === c_oAscChartTypeSettings.scatter)
                {
                    var new_hor_axis_settings = new AscCommon.asc_ValAxisSettings();
                    new_hor_axis_settings.setDefault();
                    options.putHorAxisProps(new_hor_axis_settings);
                    var new_vert_axis_settings = new AscCommon.asc_ValAxisSettings();
                    new_vert_axis_settings.setDefault();
                    options.putVertAxisProps(new_vert_axis_settings);
                    options.putHorGridLines(c_oAscGridLinesSettings.major);
                    options.putVertGridLines(c_oAscGridLinesSettings.major);
                    options.putShowMarker(true);
                    options.putSmooth(null);
                    options.putLine(false);
                }
                options.type = null;
                options.bCreate = true;
                this.applyPropsToChartSpace(options, ret);
                options.bCreate = false;
                this.applyPropsToChartSpace(options, ret);
                ret.theme = this.getTheme();
                CheckSpPrXfrm(ret);
                ret.spPr.xfrm.setOffX(0);
                ret.spPr.xfrm.setOffY(0);
                if(AscFormat.isRealNumber(w) && w > 0.0){
                    var dAspect = w/ret.spPr.xfrm.extX;
                    if(dAspect < 1.0){
                        ret.spPr.xfrm.setExtX(w);
                        ret.spPr.xfrm.setExtY(ret.spPr.xfrm.extY*dAspect);
                    }
                }
                ret.theme = this.getTheme();
                ret.colorMapOverride = this.getColorMapOverride();
                return ret;
            }, this, []);
        }
        else
        {
            var by_types = getObjectsByTypesFromArr(this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, true);
            if(by_types.charts.length === 1)
            {
                by_types.charts[0].theme = this.getTheme();
                by_types.charts[0].colorMapOverride = this.getColorMapOverride();
                AscFormat.ExecuteNoHistory(function()
                {
                    CheckSpPrXfrm2(by_types.charts[0]);
                }, this, []);
                return by_types.charts[0];
            }
        }
        return null;
    },


    checkNeedResetChartSelection: function(e, x, y, pageIndex, bTextFlag)
    {
        var oTitle, oCursorInfo, oTargetTextObject = getTargetTextObject(this);
        if(oTargetTextObject instanceof AscFormat.CTitle)
        {
            oTitle = oTargetTextObject;
        }
        if(!oTitle)
            return true;

        this.handleEventMode = HANDLE_EVENT_MODE_CURSOR;
        oCursorInfo = this.curState.onMouseDown(e, x, y, pageIndex, bTextFlag);
        this.handleEventMode = HANDLE_EVENT_MODE_HANDLE;

        return !(isRealObject(oCursorInfo) && oTitle === oCursorInfo.title);
    },

    checkChartTextSelection: function(bNoRedraw)
    {
        if(this.bNoCheckChartTextSelection === true)
            return false;
        var chart_selection, bRet = false;
        var nPageNum1, nPageNum2;
        if(this.selection.chartSelection)
        {
            chart_selection = this.selection.chartSelection;
        }
        else if(this.selection.groupSelection && this.selection.groupSelection.selection.chartSelection)
        {
            chart_selection = this.selection.groupSelection.selection.chartSelection;
        }
        if(chart_selection && (chart_selection.selection.textSelection || chart_selection.selection.title))
        {
            var oTitle = chart_selection.selection.textSelection;
            if(!oTitle){
                oTitle = chart_selection.selection.title;
                nPageNum2 = this.drawingObjects.num;
            }
            var content = oTitle.getDocContent(), bDeleteTitle = false;
            if(content)
            {
                if(content.Is_Empty())
                {
                    if(chart_selection.selection.title && chart_selection.selection.title.parent)
                    {
                        History.Create_NewPoint(AscDFH.historydescription_CommonControllerCheckChartText);
                        chart_selection.selection.title.parent.setTitle(null);
                        bDeleteTitle = true;
                    }
                }
            }
            if(chart_selection.recalcInfo.bRecalculatedTitle || bDeleteTitle)
            {
                chart_selection.recalcInfo.recalcTitle = null;
                chart_selection.handleUpdateInternalChart(false);
                if(this.document)
                {
                    chart_selection.recalculate();
                    nPageNum1  = chart_selection.selectStartPage;
                }
                else if(this.drawingObjects.cSld)
                {
                    chart_selection.recalculate();
                    if(!(bNoRedraw === true))
                    {
                        nPageNum1 = this.drawingObjects.num;
                    }
                }
                else
                {
                    nPageNum1 = 0;
                    chart_selection.recalculate();
                }
                chart_selection.recalcInfo.bRecalculatedTitle = false;
            }
        }
        var oTargetTextObject = getTargetTextObject(this);
        var nSelectStartPage = 0, bNoNeedRecalc = false;
        if(oTargetTextObject)
        {
            nSelectStartPage = oTargetTextObject.selectStartPage;
        }
        if((!(oTargetTextObject instanceof AscFormat.CShape)) && this.document)
        {
            if(this.selectedObjects.length === 1 && this.selectedObjects[0].parent)
            {
                var oShape =  this.selectedObjects[0].parent.isShapeChild(true);
                if(oShape)
                {
                    oTargetTextObject = oShape;
                    nSelectStartPage = this.selectedObjects[0].selectStartPage;
                    bNoNeedRecalc = true;
                }
            }
        }
        if (oTargetTextObject) {

            var warpGeometry = oTargetTextObject.recalcInfo && oTargetTextObject.recalcInfo.warpGeometry;
            if(warpGeometry && warpGeometry.preset !== "textNoShape" || oTargetTextObject.worksheet)
            {
                if (oTargetTextObject.recalcInfo.bRecalculatedTitle)
                {
                    oTargetTextObject.recalcInfo.recalcTitle = null;
                    oTargetTextObject.recalcInfo.bRecalculatedTitle = false;
                    AscFormat.ExecuteNoHistory(function()
                    {
                        if(oTargetTextObject.bWordShape)
                        {
                            if(!bNoNeedRecalc)
                            {
                                oTargetTextObject.recalcInfo.oContentMetrics = oTargetTextObject.recalculateTxBoxContent();
                                oTargetTextObject.recalcInfo.recalculateTxBoxContent = false;
                                oTargetTextObject.recalcInfo.AllDrawings = [];
                                var oContent = oTargetTextObject.getDocContent();
                                if(oContent)
                                {
                                    oContent.GetAllDrawingObjects(oTargetTextObject.recalcInfo.AllDrawings);
                                }
                            }
                        }
                        else
                        {
                            oTargetTextObject.recalcInfo.oContentMetrics = oTargetTextObject.recalculateContent();
                            oTargetTextObject.recalcInfo.recalculateContent = false;
                        }
                    }, this, []);

                }
                if (this.document)
                {
                    nPageNum2 = nSelectStartPage;
                }
                else if (this.drawingObjects.cSld)
                {
                 //   if (!(bNoRedraw === true))
                    {
                        nPageNum2 = this.drawingObjects.num;
                    }
                }
                else
                {
                    nPageNum2 = 0;
                }
            }

        }

        if(AscFormat.isRealNumber(nPageNum1))
        {
            bRet = true;
            if(this.document)
            {
                this.document.DrawingDocument.OnRecalculatePage( nPageNum1, this.document.Pages[nPageNum1] );
                this.document.DrawingDocument.OnEndRecalculate( false, true );
            }
            else if(this.drawingObjects.cSld)
            {
                if(!(bNoRedraw === true))
                {
                    editor.WordControl.m_oDrawingDocument.OnRecalculatePage( nPageNum1, this.drawingObjects );
                    editor.WordControl.m_oDrawingDocument.OnEndRecalculate( false, true );
                }
            }
            else
            {
                this.drawingObjects.showDrawingObjects(true);
            }
        }
        if(AscFormat.isRealNumber(nPageNum2) && nPageNum2 !== nPageNum1)
        {

            bRet = true;
            if(this.document)
            {
                this.document.DrawingDocument.OnRecalculatePage( nPageNum2, this.document.Pages[nPageNum2] );
                this.document.DrawingDocument.OnEndRecalculate( false, true );
            }
            else if(this.drawingObjects.cSld)
            {
                if(!(bNoRedraw === true))
                {
                    editor.WordControl.m_oDrawingDocument.OnRecalculatePage( nPageNum2, this.drawingObjects );
                    editor.WordControl.m_oDrawingDocument.OnEndRecalculate( false, true );
                }
            }
            else
            {
                this.drawingObjects.showDrawingObjects(true);
            }
        }
        return bRet;
    },

    resetSelection: function(noResetContentSelect, bNoCheckChart, bDoNotRedraw)
    {
        if(bNoCheckChart !== true)
        {
            this.checkChartTextSelection();
        }
        this.resetInternalSelection(noResetContentSelect, bDoNotRedraw);
        for(var i = 0; i < this.selectedObjects.length; ++i)
        {
            this.selectedObjects[i].selected = false;
        }
        this.selectedObjects.length = 0;
        this.selection =
        {
            selectedObjects: [],
            groupSelection: null,
            chartSelection: null,
            textSelection: null,
            cropSelection: null
        };
    },

    clearPreTrackObjects: function()
    {
        this.arrPreTrackObjects.length = 0;
    },

    addPreTrackObject: function(preTrackObject)
    {
        this.arrPreTrackObjects.push(preTrackObject);
    },

    clearTrackObjects: function()
    {
        this.arrTrackObjects.length = 0;
    },

    addTrackObject: function(trackObject)
    {
        this.arrTrackObjects.push(trackObject);
    },

    swapTrackObjects: function()
    {
        this.checkConnectorsPreTrack();
        this.clearTrackObjects();
        for(var i = 0; i < this.arrPreTrackObjects.length; ++i)
            this.addTrackObject(this.arrPreTrackObjects[i]);
        this.clearPreTrackObjects();
    },

    rotateTrackObjects: function(angle, e)
    {
        for(var i = 0; i < this.arrTrackObjects.length; ++i)
            this.arrTrackObjects[i].track(angle, e);
    },

    trackResizeObjects: function(kd1, kd2, e, x, y)
    {
        for(var i = 0; i < this.arrTrackObjects.length; ++i)
            this.arrTrackObjects[i].track(kd1, kd2, e, x, y);
    },

    trackEnd: function()
    {
        var oOriginalObjects = [];
        for(var i = 0; i < this.arrTrackObjects.length; ++i){
            this.arrTrackObjects[i].trackEnd();
            if(this.arrTrackObjects[i].originalObject && !this.arrTrackObjects[i].processor3D){
                oOriginalObjects.push(this.arrTrackObjects[i].originalObject);
            }
        }
        var aAllConnectors = this.getAllConnectorsByDrawings(oOriginalObjects, [],  undefined, true);
        for(i = 0; i < aAllConnectors.length; ++i){
            aAllConnectors[i].calculateTransform();
        }
        this.drawingObjects.showDrawingObjects(true);
    },

    canGroup: function()
    {
        return this.getArrayForGrouping().length > 1;
    },

    getArrayForGrouping: function()
    {
        var graphic_objects = this.getDrawingObjects();
        var grouped_objects = [];
        for(var i = 0; i < graphic_objects.length; ++i)
        {
            var cur_graphic_object = graphic_objects[i];
            if(cur_graphic_object.selected)
            {
                if(!cur_graphic_object.canGroup())
                {
                    return [];
                }
                grouped_objects.push(cur_graphic_object);
            }
        }
        return grouped_objects;
    },


    getBoundsForGroup: function(arrDrawings)
    {
        var bounds = arrDrawings[0].getBoundsInGroup();
        var max_x = bounds.r;
        var max_y = bounds.b;
        var min_x = bounds.l;
        var min_y = bounds.t;
        for(var i = 1; i < arrDrawings.length; ++i)
        {
            bounds = arrDrawings[i].getBoundsInGroup();
            if(max_x < bounds.r)
                max_x = bounds.r;
            if(max_y < bounds.b)
                max_y = bounds.b;
            if(min_x > bounds.l)
                min_x = bounds.l;
            if(min_y > bounds.t)
                min_y = bounds.t;
        }
        return new AscFormat.CGraphicBounds(min_x, min_y, max_x, max_y);
    },


    getGroup: function(arrDrawings)
    {
        if(!Array.isArray(arrDrawings))
            arrDrawings = this.getArrayForGrouping();
        if(arrDrawings.length < 2)
            return null;
        var bounds = this.getBoundsForGroup(arrDrawings);
        var max_x = bounds.r;
        var max_y = bounds.b;
        var min_x = bounds.l;
        var min_y = bounds.t;
        var group = new AscFormat.CGroupShape();
        group.setSpPr(new AscFormat.CSpPr());
        group.spPr.setParent(group);
        group.spPr.setXfrm(new AscFormat.CXfrm());
        var xfrm = group.spPr.xfrm;
        xfrm.setParent(group.spPr);
        xfrm.setOffX(min_x);
        xfrm.setOffY(min_y);
        xfrm.setExtX(max_x-min_x);
        xfrm.setExtY(max_y-min_y);
        xfrm.setChExtX(max_x-min_x);
        xfrm.setChExtY(max_y-min_y);
        xfrm.setChOffX(0);
        xfrm.setChOffY(0);
        for(var i = 0; i < arrDrawings.length; ++i)
        {
            CheckSpPrXfrm(arrDrawings[i]);
            arrDrawings[i].spPr.xfrm.setOffX(arrDrawings[i].x - min_x);
            arrDrawings[i].spPr.xfrm.setOffY(arrDrawings[i].y - min_y);
            arrDrawings[i].setGroup(group);
            group.addToSpTree(group.spTree.length, arrDrawings[i]);
        }
        group.setBDeleted(false);
        return group;
    },

    unGroup: function()
    {
        this.checkSelectedObjectsAndCallback(this.unGroupCallback, null, false, AscDFH.historydescription_CommonControllerUnGroup);
    },

    getSelectedObjectsBounds: function(isTextSelectionUse)
    {
        if((!this.getTargetDocContent() || true === isTextSelectionUse) && this.selectedObjects.length > 0)
        {
            var nPageIndex, aDrawings, oRes, aSelectedCopy, i;
            if(this.selection.groupSelection)
            {
                aDrawings = this.selection.groupSelection.selectedObjects;
                nPageIndex = this.selection.groupSelection.selectStartPage;

            }
            else
            {
                aSelectedCopy = [].concat(this.selectedObjects);
                aSelectedCopy.sort(function(a, b){return a.selectStartPage - b.selectStartPage});
                nPageIndex = aSelectedCopy[0].selectStartPage;
                aDrawings = [];
                for(i = 0; i < aSelectedCopy.length; ++i)
                {
                    if(nPageIndex === aSelectedCopy[i].selectStartPage)
                    {
                        aDrawings.push(aSelectedCopy[i]);
                    }
                    else
                    {
                        break;
                    }
                }
            }
            oRes = getAbsoluteRectBoundsArr(aDrawings);
            oRes.pageIndex = nPageIndex;
            return oRes;
        }
        return null;
    },

    unGroupCallback: function()
    {
        var ungroup_arr = this.canUnGroup(true), aGraphicObjects;
        if(ungroup_arr.length > 0)
        {
            this.resetSelection();
            var i, j,   cur_group, sp_tree, sp, nInsertPos;
            for(i = 0; i < ungroup_arr.length; ++i)
            {
                cur_group = ungroup_arr[i];
                cur_group.normalize();

                aGraphicObjects = this.getDrawingObjects();
                nInsertPos = undefined;
                for(j = 0; j < aGraphicObjects.length; ++j)
                {
                    if(aGraphicObjects[j] === cur_group)
                    {
                        nInsertPos = j;
                        break;
                    }
                }



                sp_tree = cur_group.spTree;
                var xc, yc;
                for(j = 0; j < sp_tree.length; ++j)
                {
                    sp = sp_tree[j];
                    sp.spPr.xfrm.setRot(AscFormat.normalizeRotate(sp.rot + cur_group.rot));
                    xc = sp.transform.TransformPointX(sp.extX/2.0, sp.extY/2.0);
                    yc = sp.transform.TransformPointY(sp.extX/2.0, sp.extY/2.0);
                    sp.spPr.xfrm.setOffX(xc - sp.extX/2.0);
                    sp.spPr.xfrm.setOffY(yc - sp.extY/2.0);
                    sp.spPr.xfrm.setFlipH(cur_group.spPr.xfrm.flipH === true ? !(sp.spPr.xfrm.flipH === true) : sp.spPr.xfrm.flipH === true);
                    sp.spPr.xfrm.setFlipV(cur_group.spPr.xfrm.flipV === true ? !(sp.spPr.xfrm.flipV === true) : sp.spPr.xfrm.flipV === true);
                    sp.setGroup(null);
                    if(sp.spPr.Fill && sp.spPr.Fill.fill && sp.spPr.Fill.fill.type === Asc.c_oAscFill.FILL_TYPE_GRP && cur_group.spPr && cur_group.spPr.Fill)
                    {
                        sp.spPr.setFill(cur_group.spPr.Fill.createDuplicate());
                    }
                    if(AscFormat.isRealNumber(nInsertPos)){
                        sp.addToDrawingObjects(nInsertPos + j);
                    }
                    else {
                        sp.addToDrawingObjects();
                    }
                    sp.checkDrawingBaseCoords();
                    this.selectObject(sp, 0);
                }
                cur_group.setBDeleted(true);
                cur_group.deleteDrawingBase();
            }
        }
    },

    canUnGroup: function(bRetArray)
    {
        var _arr_selected_objects = this.selectedObjects;
        var ret_array = [];
        for(var _index = 0; _index < _arr_selected_objects.length; ++_index)
        {
            if(_arr_selected_objects[_index].getObjectType() === AscDFH.historyitem_type_GroupShape
                && (!_arr_selected_objects[_index].parent || _arr_selected_objects[_index].parent && (!_arr_selected_objects[_index].parent.Is_Inline || !_arr_selected_objects[_index].parent.Is_Inline())))
            {
                if(!(bRetArray === true))
                    return true;
                ret_array.push(_arr_selected_objects[_index]);

            }
        }
        return bRetArray === true ? ret_array : false;
    },

    startTrackNewShape: function(presetGeom)
    {
        switch (presetGeom)
        {
            case "spline":
            {
                this.changeCurrentState(new AscFormat.SplineBezierState(this));
                break;
            }
            case "polyline1":
            {
                this.changeCurrentState(new AscFormat.PolyLineAddState(this));
                break;
            }
            case "polyline2":
            {
                this.changeCurrentState(new AscFormat.AddPolyLine2State(this));
                break;
            }
            default :
            {
                this.changeCurrentState(new AscFormat.StartAddNewShape(this, presetGeom));
                break;
            }
        }
    },


    getHyperlinkInfo: function()
    {
        var content = this.getTargetDocContent();
        if(content)
        {
            if ( ( true === content.Selection.Use && content.Selection.StartPos == content.Selection.EndPos) || false == content.Selection.Use )
            {
                var paragraph;
                if ( true == content.Selection.Use )
                    paragraph = content.Content[content.Selection.StartPos];
                else
                    paragraph = content.Content[content.CurPos.ContentPos];

                var HyperPos = -1;
                if ( true === paragraph.Selection.Use )
                {
                    var StartPos = paragraph.Selection.StartPos;
                    var EndPos   = paragraph.Selection.EndPos;
                    if ( StartPos > EndPos )
                    {
                        StartPos = paragraph.Selection.EndPos;
                        EndPos   = paragraph.Selection.StartPos;
                    }

                    for ( var CurPos = StartPos; CurPos <= EndPos; CurPos++ )
                    {
                        var Element = paragraph.Content[CurPos];

                        if ( true !== Element.IsSelectionEmpty() && para_Hyperlink !== Element.Type )
                            break;
                        else if ( true !== Element.IsSelectionEmpty() && para_Hyperlink === Element.Type )
                        {
                            if ( -1 === HyperPos )
                                HyperPos = CurPos;
                            else
                                break;
                        }
                    }

                    if ( paragraph.Selection.StartPos === paragraph.Selection.EndPos && para_Hyperlink === paragraph.Content[paragraph.Selection.StartPos].Type )
                        HyperPos = paragraph.Selection.StartPos;
                }
                else
                {
                    if (para_Hyperlink === paragraph.Content[paragraph.CurPos.ContentPos].Type)
                        HyperPos = paragraph.CurPos.ContentPos;
                }
                if ( -1 !== HyperPos )
                {
                   return  paragraph.Content[HyperPos];
                }

            }
        }
        return null;
    },

    setSelectionState: function( state, stateIndex )
    {
        if(!Array.isArray(state)){
            return;
        }
        var _state_index = AscFormat.isRealNumber(stateIndex) ? stateIndex : state.length-1;
        var selection_state = state[_state_index];
        this.clearPreTrackObjects();
        this.clearTrackObjects();
        this.resetSelection(undefined, true, undefined);
        this.changeCurrentState(new AscFormat.NullState(this));
        if(selection_state.textObject && !selection_state.textObject.bDeleted)
        {
            this.selectObject(selection_state.textObject, selection_state.selectStartPage);
            this.selection.textSelection = selection_state.textObject;
            if(selection_state.textObject.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                selection_state.textObject.graphicObject.SetSelectionState(selection_state.textSelection, selection_state.textSelection.length-1);
            }
            else
            {
                selection_state.textObject.getDocContent().SetSelectionState(selection_state.textSelection, selection_state.textSelection.length-1);
            }
        }
        else if(selection_state.groupObject && !selection_state.groupObject.bDeleted)
        {
            this.selectObject(selection_state.groupObject, selection_state.selectStartPage);
            this.selection.groupSelection = selection_state.groupObject;
            selection_state.groupObject.setSelectionState(selection_state.groupSelection);
        }
        else if(selection_state.chartObject && !selection_state.chartObject.bDeleted)
        {
            this.selectObject(selection_state.chartObject, selection_state.selectStartPage);
            this.selection.chartSelection = selection_state.chartObject;
            selection_state.chartObject.setSelectionState(selection_state.chartSelection);
        }
        else if(selection_state.wrapObject && !selection_state.wrapObject.bDeleted)
        {
            this.selectObject(selection_state.wrapObject, selection_state.selectStartPage);
            this.selection.wrapPolygonSelection = selection_state.wrapObject;
        }
        else if(selection_state.cropObject && !selection_state.cropObject.bDeleted)
        {
            this.selectObject(selection_state.cropObject, selection_state.selectStartPage);
            this.selection.cropSelection = selection_state.cropObject;
            this.sendCropState();
            if(this.selection.cropSelection){
                this.selection.cropSelection.cropObject = null;
            }
        }
        else
        {
            if(Array.isArray(selection_state.selection)){
                for(var i = 0; i < selection_state.selection.length; ++i)
                {
                    if(!selection_state.selection[i].object.bDeleted)
                    {
                        this.selectObject(selection_state.selection[i].object, selection_state.selection[i].pageIndex);
                    }
                }
            }
        }
    },


    getSelectionState: function()
    {
        var selection_state = {};
        if(this.selection.textSelection)
        {
            selection_state.focus = true;
            selection_state.textObject = this.selection.textSelection;
            selection_state.selectStartPage = this.selection.textSelection.selectStartPage;
            if(this.selection.textSelection.getObjectType() === AscDFH.historyitem_type_GraphicFrame)
            {
                selection_state.textSelection = this.selection.textSelection.graphicObject.GetSelectionState();
            }
            else
            {
                selection_state.textSelection = this.selection.textSelection.getDocContent().GetSelectionState();
            }
        }
        else if(this.selection.groupSelection)
        {
            selection_state.focus = true;
            selection_state.groupObject = this.selection.groupSelection;
            selection_state.selectStartPage = this.selection.groupSelection.selectStartPage;
            selection_state.groupSelection = this.selection.groupSelection.getSelectionState();
        }
        else if(this.selection.chartSelection)
        {
            selection_state.focus = true;
            selection_state.chartObject = this.selection.chartSelection;
            selection_state.selectStartPage = this.selection.chartSelection.selectStartPage;
            selection_state.chartSelection = this.selection.chartSelection.getSelectionState();
        }
        else if(this.selection.wrapPolygonSelection)
        {
            selection_state.focus = true;
            selection_state.wrapObject = this.selection.wrapPolygonSelection;
            selection_state.selectStartPage = this.selection.wrapPolygonSelection.selectStartPage;
        }
        else if(this.selection.cropSelection)
        {
            selection_state.focus = true;
            selection_state.cropObject = this.selection.cropSelection;
            selection_state.cropImage = this.selection.cropSelection.cropObject;
            selection_state.selectStartPage = this.selection.cropSelection.selectStartPage;
        }
        else
        {
            selection_state.focus = this.selectedObjects.length > 0;
            selection_state.selection = [];
            for(var i = 0; i < this.selectedObjects.length; ++i)
            {
                selection_state.selection.push({object: this.selectedObjects[i], pageIndex: this.selectedObjects[i].selectStartPage});
            }
        }
        if(this.drawingObjects && this.drawingObjects.getWorksheet)
        {
            var worksheetView = this.drawingObjects.getWorksheet();
            if(worksheetView)
            {
                selection_state.worksheetId = worksheetView.model.getId();
            }
        }
        return [selection_state];
    },

    Save_DocumentStateBeforeLoadChanges: function(oState)
    {
        var oTargetDocContent = this.getTargetDocContent(undefined, true);
        if(oTargetDocContent)
        {
            oState.Pos      = oTargetDocContent.GetContentPosition(false, false, undefined);
            oState.StartPos = oTargetDocContent.GetContentPosition(true, true, undefined);
            oState.EndPos   = oTargetDocContent.GetContentPosition(true, false, undefined);
            oState.DrawingSelection = oTargetDocContent.Selection.Use;
        }
        oState.DrawingsSelectionState = this.getSelectionState()[0];
    },

    loadDocumentStateAfterLoadChanges: function(oSelectionState, PageIndex)
    {
        var bDocument = isRealObject(this.document), bNeedRecalculateCurPos = false;
        var nPageIndex = 0;
        var bSlide = false;
        if(AscFormat.isRealNumber(PageIndex)){
            nPageIndex = PageIndex;
        }
        else if(!bDocument)
        {
            if(this.drawingObjects.getObjectType && this.drawingObjects.getObjectType() === AscDFH.historyitem_type_Slide)
            {
                nPageIndex = 0;
                bSlide = true;
            }
        }
        if(oSelectionState && oSelectionState.DrawingsSelectionState)
        {
            var oDrawingSelectionState = oSelectionState.DrawingsSelectionState;
            if(oDrawingSelectionState.textObject)
            {
                if(oDrawingSelectionState.textObject.Is_UseInDocument()
                    && (!oDrawingSelectionState.textObject.group || oDrawingSelectionState.textObject.group === this)
                && (!bSlide || oDrawingSelectionState.textObject.parent === this.drawingObjects))
                {
                    this.selectObject(oDrawingSelectionState.textObject, bDocument ? (oDrawingSelectionState.textObject.parent ? oDrawingSelectionState.textObject.parent.PageNum : nPageIndex) : nPageIndex);
                    var oDocContent;
                    if(oDrawingSelectionState.textObject instanceof AscFormat.CGraphicFrame){
                        oDocContent = oDrawingSelectionState.textObject.graphicObject;
                    }
                    else {
                        oDocContent = oDrawingSelectionState.textObject.getDocContent();
                    }

                    if(oDocContent){
                        if (true === oSelectionState.DrawingSelection)
                        {
                            oDocContent.SetContentPosition(oSelectionState.StartPos, 0, 0);
                            oDocContent.SetContentSelection(oSelectionState.StartPos, oSelectionState.EndPos, 0, 0, 0);
                        }
                        else
                        {
                            oDocContent.SetContentPosition(oSelectionState.Pos, 0, 0);
                            bNeedRecalculateCurPos = true;
                        }
                        this.selection.textSelection = oDrawingSelectionState.textObject;
                    }
                }
            }
            else if(oDrawingSelectionState.groupObject)
            {
                if(oDrawingSelectionState.groupObject.Is_UseInDocument() && !oDrawingSelectionState.groupObject.group
                    && (!bSlide || oDrawingSelectionState.groupObject.parent === this.drawingObjects))
                {
                    this.selectObject(oDrawingSelectionState.groupObject, bDocument ? (oDrawingSelectionState.groupObject.parent ? oDrawingSelectionState.groupObject.parent.PageNum : nPageIndex) : nPageIndex);
                    oDrawingSelectionState.groupObject.resetSelection(this);

                    var oState =
                    {
                        DrawingsSelectionState: oDrawingSelectionState.groupSelection,
                        Pos: oSelectionState.Pos,
                        StartPos: oSelectionState.StartPos,
                        EndPos: oSelectionState.EndPos,
                        DrawingSelection: oSelectionState.DrawingSelection
                    };
                    if(oDrawingSelectionState.groupObject.loadDocumentStateAfterLoadChanges(oState, nPageIndex))
                    {
                        this.selection.groupSelection = oDrawingSelectionState.groupObject;
                        if(!oSelectionState.DrawingSelection){
                            bNeedRecalculateCurPos = true;
                        }
                    }
                }
            }
            else if(oDrawingSelectionState.chartObject)
            {
                if(oDrawingSelectionState.chartObject.Is_UseInDocument()
                    && (!bSlide || oDrawingSelectionState.chartObject.parent === this.drawingObjects))
                {
                    this.selectObject(oDrawingSelectionState.chartObject, bDocument ? (oDrawingSelectionState.chartObject.parent ? oDrawingSelectionState.chartObject.parent.PageNum : nPageIndex) : nPageIndex);
                    oDrawingSelectionState.chartObject.resetSelection(undefined, true, undefined);
                    if(oDrawingSelectionState.chartObject.loadDocumentStateAfterLoadChanges(oSelectionState))
                    {
                        this.selection.chartSelection = oDrawingSelectionState.chartObject;
                        if(!oSelectionState.DrawingSelection){
                            bNeedRecalculateCurPos = true;
                        }
                    }
                }
            }
            else if(oDrawingSelectionState.wrapObject)
            {
                if(oDrawingSelectionState.wrapObject.parent && oDrawingSelectionState.wrapObject.parent.Is_UseInDocument && oDrawingSelectionState.wrapObject.parent.Is_UseInDocument())
                {
                    this.selectObject(oDrawingSelectionState.wrapObject, oDrawingSelectionState.wrapObject.parent.PageNum);
                    if(oDrawingSelectionState.wrapObject.canChangeWrapPolygon && oDrawingSelectionState.wrapObject.canChangeWrapPolygon() && !oDrawingSelectionState.wrapObject.parent.Is_Inline())
                    {
                        this.selection.wrapPolygonSelection = oDrawingSelectionState.wrapObject;
                    }
                }
            }
            else if(oDrawingSelectionState.cropObject)
            {
                if(oDrawingSelectionState.cropObject.Is_UseInDocument()
                    && (!bSlide || oDrawingSelectionState.cropObject.parent === this.drawingObjects))
                {
                    this.selectObject(oDrawingSelectionState.cropObject, bDocument ? (oDrawingSelectionState.cropObject.parent ? oDrawingSelectionState.cropObject.parent.PageNum : nPageIndex) : nPageIndex);
                    this.selection.cropSelection = oDrawingSelectionState.cropObject;
                    this.sendCropState();
                    if(this.selection.cropSelection){
                        this.selection.cropSelection.cropObject = oDrawingSelectionState.cropImage;
                    }
                    if(!oSelectionState.DrawingSelection){
                        bNeedRecalculateCurPos = true;
                    }
                }
            }
            else
            {
                for(var i = 0; i < oDrawingSelectionState.selection.length; ++i)
                {
                    var oSp = oDrawingSelectionState.selection[i].object;
                    if(oSp.Is_UseInDocument() && !oSp.group
                        && (!bSlide || oSp.parent === this.drawingObjects))
                    {
                        this.selectObject(oSp, bDocument ? (oSp.parent ? oSp.parent.PageNum : nPageIndex) : nPageIndex);
                    }
                }
            }
        }

        if(this.document && bNeedRecalculateCurPos){
            this.document.NeedUpdateTarget = true;
            this.document.RecalculateCurPos();
        }
        return this.selectedObjects.length > 0;
    },


    drawTracks: function(overlay)
    {
        for(var i = 0; i < this.arrTrackObjects.length; ++i)
            this.arrTrackObjects[i].draw(overlay);
    },

    DrawOnOverlay: function(overlay)
    {
        this.drawTracks(overlay);
    },

    needUpdateOverlay: function()
    {
        return this.arrTrackObjects.length > 0;
    },

    drawSelection: function(drawingDocument)
    {
        DrawingObjectsController.prototype.drawSelect.call(this, 0, drawingDocument);
        //this.drawTextSelection();
    },

    getTargetTransform: function()
    {
        var oRet = null;
        if(this.selection.textSelection)
        {
            oRet =  this.selection.textSelection.transformText;
        }
        else if(this.selection.groupSelection )
        {
            if(this.selection.groupSelection.selection.textSelection)
                oRet = this.selection.groupSelection.selection.textSelection.transformText;
            else if(this.selection.groupSelection.selection.chartSelection && this.selection.groupSelection.selection.chartSelection.selection.textSelection)
            {
                oRet = this.selection.groupSelection.selection.chartSelection.selection.textSelection.transformText;
            }
        }
        else if(this.selection.chartSelection && this.selection.chartSelection.selection.textSelection)
        {
            oRet = this.selection.chartSelection.selection.textSelection.transformText;
        }
        if(oRet)
        {
            oRet = oRet.CreateDublicate();
            return oRet;
        }
        return new AscCommon.CMatrix();
    },

    drawTextSelection: function(num)
    {
        var content = this.getTargetDocContent(undefined, true);
        if(content)
        {
            this.drawingObjects.getDrawingDocument().UpdateTargetTransform(this.getTargetTransform());

            content.DrawSelectionOnPage(0);
        }
    },

    getSelectedObjects: function()
    {
        return this.selectedObjects;
    },

    getDrawingPropsFromArray: function(drawings)
    {
        var image_props, shape_props, chart_props, table_props = undefined, new_image_props, new_shape_props, new_chart_props, new_table_props, shape_chart_props, locked;
        var drawing;
        for(var i = 0; i < drawings.length; ++i)
        {
            drawing = drawings[i];
            locked = undefined;
            if(!drawing.group)
            {
                locked = drawing.lockType !== c_oAscLockTypes.kLockTypeNone && drawing.lockType !== c_oAscLockTypes.kLockTypeMine ;
                if(typeof editor !== "undefined" && isRealObject(editor) && editor.isPresentationEditor)
                {
                    if(drawing.Lock)
                    {
                        locked = drawing.Lock.Is_Locked();
                    }
                }
            }
            else
            {
                var oParentGroup = drawing.group.getMainGroup();
                if(oParentGroup)
                {
                    locked = oParentGroup.lockType !== c_oAscLockTypes.kLockTypeNone && oParentGroup.lockType !== c_oAscLockTypes.kLockTypeMine ;
                    if(typeof editor !== "undefined" && isRealObject(editor) && editor.isPresentationEditor)
                    {
                        if(oParentGroup.Lock)
                        {
                            locked = oParentGroup.Lock.Is_Locked();
                        }
                    }
                }
            }
            var lockAspect = drawing.getNoChangeAspect();
            switch(drawing.getObjectType())
            {
                case AscDFH.historyitem_type_Shape:
                case AscDFH.historyitem_type_Cnx:
                {

                    new_shape_props =
                    {
                        canFill: drawing.canFill(),
                        type: drawing.getPresetGeom(),
                        fill: drawing.getFill(),
                        stroke: drawing.getStroke(),
                        paddings: drawing.getPaddings(),
                        verticalTextAlign: drawing.getBodyPr().anchor,
                        vert: drawing.getBodyPr().vert,
                        w: drawing.extX,
                        h: drawing.extY,
                        rot: drawing.rot,
                        flipH: drawing.flipH,
                        flipV: drawing.flipV,
                        canChangeArrows: drawing.canChangeArrows(),
                        bFromChart: false,
                        locked: locked,
                        textArtProperties: drawing.getTextArtProperties(),
                        lockAspect: lockAspect,
                        title: drawing.getTitle(),
                        description: drawing.getDescription(),
                        columnNumber: drawing.getColumnNumber(),
                        columnSpace: drawing.getColumnSpace(),
                        signatureId: drawing.getSignatureLineGuid(),
                        shadow: drawing.getOuterShdw(),
                        anchor: drawing.getDrawingBaseType()
                    };
                    if(!shape_props)
                        shape_props = new_shape_props;
                    else
                    {
                        shape_props = AscFormat.CompareShapeProperties(shape_props, new_shape_props);
                    }
                    break;
                }
                case AscDFH.historyitem_type_ImageShape:
                {
                    new_image_props =
                    {
                        ImageUrl: drawing.getImageUrl(),
                        w: drawing.extX,
                        h: drawing.extY,
                        rot: drawing.rot,
                        flipH: drawing.flipH,
                        flipV: drawing.flipV,
                        locked: locked,
                        x: drawing.x,
                        y: drawing.y,
                        lockAspect: lockAspect,
                        title: drawing.getTitle(),
                        description: drawing.getDescription(),
                        anchor: drawing.getDrawingBaseType()
                    };
                    if(!image_props)
                        image_props = new_image_props;
                    else
                    {
                        if(image_props.ImageUrl !== null && image_props.ImageUrl !== new_image_props.ImageUrl)
                            image_props.ImageUrl = null;
                        if(image_props.w != null && image_props.w !== new_image_props.w)
                            image_props.w = null;
                        if(image_props.h != null && image_props.h !== new_image_props.h)
                            image_props.h = null;
                        if(image_props.x != null && image_props.x !== new_image_props.x)
                            image_props.x = null;
                        if(image_props.y != null && image_props.y !== new_image_props.y)
                            image_props.y = null;
                        if(image_props.rot != null && image_props.rot !== new_image_props.rot)
                            image_props.rot = null;
                        if(image_props.flipH != null && image_props.flipH !== new_image_props.flipH)
                            image_props.flipH = null;
                        if(image_props.flipV != null && image_props.flipV !== new_image_props.flipV)
                            image_props.flipV = null;

                        if(image_props.locked || new_image_props.locked)
                            image_props.locked = true;
                        if(image_props.lockAspect || new_image_props.lockAspect)
                            image_props.lockAspect = false;
                        if(image_props.title !== new_image_props.title)
                            image_props.title = undefined;
                        if(image_props.description !== new_image_props.description)
                            image_props.description = undefined;
                        if(image_props.anchor !== new_image_props.anchor)
                            image_props.anchor = undefined;
                        
                    }


                    new_shape_props =
                    {
                        canFill: false,
                        type: drawing.getPresetGeom(),
                        fill: drawing.getFill(),
                        stroke: drawing.getStroke(),
                        paddings: null,
                        verticalTextAlign: null,
                        vert: null,
                        w: drawing.extX,
                        h: drawing.extY ,
                        rot: drawing.rot,
                        flipH: drawing.flipH,
                        flipV: drawing.flipV,
                        canChangeArrows: drawing.canChangeArrows(),
                        bFromChart: false,
                        bFromImage: true,
                        locked: locked,
                        textArtProperties: null,
                        lockAspect: lockAspect,
                        title: drawing.getTitle(),
                        description: drawing.getDescription(),
                        columnNumber: null,
                        columnSpace: null,
                        signatureId: null,
                        shadow: drawing.getOuterShdw(),
                        anchor: drawing.getDrawingBaseType()
                    };
                    if(!shape_props)
                        shape_props = new_shape_props;
                    else
                    {
                        shape_props = AscFormat.CompareShapeProperties(shape_props, new_shape_props);
                    }
                    break;
                }
                case AscDFH.historyitem_type_OleObject:
                {
                    var pluginData = new Asc.CPluginData();
                    pluginData.setAttribute("data", drawing.m_sData);
                    pluginData.setAttribute("guid", drawing.m_sApplicationId);
                    pluginData.setAttribute("width", drawing.extX);
                    pluginData.setAttribute("height", drawing.extY);
                    pluginData.setAttribute("widthPix", drawing.m_nPixWidth);
                    pluginData.setAttribute("heightPix", drawing.m_nPixHeight);
                    pluginData.setAttribute("objectId", drawing.Id);
                    new_image_props =
                    {
                        ImageUrl: drawing.getImageUrl(),
                        w: drawing.extX,
                        h: drawing.extY,
                        locked: locked,
                        x: drawing.x,
                        y: drawing.y,
                        lockAspect: lockAspect,
                        pluginGuid: drawing.m_sApplicationId,
                        pluginData: pluginData,
                        oleWidth: drawing.m_fDefaultSizeX,
                        oleHeight: drawing.m_fDefaultSizeY,
                        title: drawing.getTitle(),
                        description: drawing.getDescription(),
                        anchor: drawing.getDrawingBaseType()
                    };
                    if(!image_props)
                        image_props = new_image_props;
                    else
                    {
                        image_props.ImageUrl = null;
                        if(image_props.w != null && image_props.w !== new_image_props.w)
                            image_props.w = null;
                        if(image_props.h != null && image_props.h !== new_image_props.h)
                            image_props.h = null;
                        if(image_props.x != null && image_props.x !== new_image_props.x)
                            image_props.x = null;
                        if(image_props.y != null && image_props.y !== new_image_props.y)
                            image_props.y = null;

                        if(image_props.locked || new_image_props.locked)
                            image_props.locked = true;
                        if(image_props.lockAspect || new_image_props.lockAspect)
                            image_props.lockAspect = false;
                        image_props.pluginGuid = null;
                        image_props.pluginData = undefined;
                        image_props.oleWidth = undefined;
                        image_props.oleHeight = undefined;
                        if(image_props.title !== new_image_props.title)
                            image_props.title = undefined;
                        if(image_props.description !== new_image_props.description)
                            image_props.description = undefined;
                        if(image_props.anchor !== new_image_props.anchor)
                            image_props.anchor = undefined;
                    }
                    break;
                }
                case AscDFH.historyitem_type_ChartSpace:
                {
                    var type_subtype = drawing.getTypeSubType();
                    new_chart_props =
                    {
                        type: type_subtype.type,
                        subtype: type_subtype.subtype,
                        styleId: drawing.style,
                        w: drawing.extX,
                        h: drawing.extY,
                        locked: locked,
                        lockAspect: lockAspect,
                        title: drawing.getTitle(),
                        description: drawing.getDescription(),
                        anchor: drawing.getDrawingBaseType()
                    };
                    if(!chart_props)
                    {
                        chart_props = new_chart_props;
                        chart_props.chartProps = this.getPropsFromChart(drawing);
                        chart_props.severalCharts = false;
                        chart_props.severalChartStyles = false;
                        chart_props.severalChartTypes = false;
                    }
                    else
                    {
                        chart_props.chartProps = null;
                        chart_props.severalCharts = true;
                        if(!chart_props.severalChartStyles)
                        {
                            chart_props.severalChartStyles = (chart_props.styleId !== new_chart_props.styleId);
                        }
                        if(!chart_props.severalChartTypes)
                        {
                            chart_props.severalChartTypes = (chart_props.type !== new_chart_props.type);
                        }

                        if(chart_props.w != null && chart_props.w !== new_chart_props.w)
                            chart_props.w = null;
                        if(chart_props.h != null && chart_props.h !== new_chart_props.h)
                            chart_props.h = null;

                        if(chart_props.locked || new_chart_props.locked)
                            chart_props.locked = true;
                        if(!chart_props.lockAspect || !new_chart_props.lockAspect)
                            chart_props.locked = false;


                        if(chart_props.title !== new_chart_props.title)
                            chart_props.title = undefined;
                        if(chart_props.description !== new_chart_props.description)
                            chart_props.description = undefined;
                        if(chart_props.anchor !== new_chart_props.anchor)
                            chart_props.anchor = undefined;
                    }

                    new_shape_props =
                    {
                        canFill: drawing.canFill(),
                        type: null,
                        fill: drawing.getFill(),
                        stroke: drawing.getStroke(),
                        paddings: null,
                        verticalTextAlign: null,
                        vert: null,
                        w: drawing.extX,
                        h: drawing.extY ,
                        canChangeArrows: false,
                        bFromChart: true,
                        locked: locked,
                        textArtProperties: null,
                        lockAspect: lockAspect,
                        title: drawing.getTitle(),
                        description: drawing.getDescription(),
                        signatureId: drawing.getSignatureLineGuid(),
                        anchor: drawing.getDrawingBaseType()
                    };
                    if(!shape_props)
                        shape_props = new_shape_props;
                    else
                    {
                        shape_props = AscFormat.CompareShapeProperties(shape_props, new_shape_props);
                    }

                    if(!shape_chart_props)
                    {
                        shape_chart_props = new_shape_props;
                    }
                    else
                    {
                        shape_chart_props = AscFormat.CompareShapeProperties(shape_chart_props, new_shape_props);
                    }
                    break;
                }
                case AscDFH.historyitem_type_GraphicFrame:
                {
                    if(table_props === undefined)
                    {
                        new_table_props = drawing.graphicObject.Get_Props();
                        table_props = new_table_props;
                        new_table_props.Locked = locked;
                        if(new_table_props.CellsBackground)
                        {
                            if(new_table_props.CellsBackground.Unifill && new_table_props.CellsBackground.Unifill.fill && new_table_props.CellsBackground.Unifill.fill.type !== c_oAscFill.FILL_TYPE_NONE)
                            {
                                new_table_props.CellsBackground.Unifill.check(drawing.Get_Theme(), drawing.Get_ColorMap());
                                var RGBA = new_table_props.CellsBackground.Unifill.getRGBAColor();
                                new_table_props.CellsBackground.Color = new CDocumentColor(RGBA.R, RGBA.G, RGBA.B, false);
                                new_table_props.CellsBackground.Value = Asc.c_oAscShdClear;
                            }
                            else
                            {
                                new_table_props.CellsBackground.Color = new CDocumentColor(0, 0, 0, false);
                                new_table_props.CellsBackground.Value = Asc.c_oAscShdNil;
                            }
                        }
                        if(new_table_props.CellBorders)
                        {
                            var checkBorder = function (border)
                            {
                                if(!border)
                                    return;
                                if(border.Unifill && border.Unifill.fill && border.Unifill.fill.type !== c_oAscFill.FILL_TYPE_NONE)
                                {
                                    border.Unifill.check(drawing.Get_Theme(), drawing.Get_ColorMap());
                                    var RGBA = border.Unifill.getRGBAColor();
                                    border.Color = new CDocumentColor(RGBA.R, RGBA.G, RGBA.B, false);
                                    border.Value = border_Single;
                                }
                                else
                                {
                                    border.Color = new CDocumentColor(0, 0, 0, false);
                                    border.Value = border_Single;
                                }
                            };
                            checkBorder(new_table_props.CellBorders.Top);
                            checkBorder(new_table_props.CellBorders.Bottom);
                            checkBorder(new_table_props.CellBorders.Right);
                            checkBorder(new_table_props.CellBorders.Left);
                        }
                        new_table_props.TableDescription = drawing.getDescription();
                        new_table_props.TableCaption = drawing.getTitle();
                    }
                    else
                    {
                        table_props = null;
                    }
                    break;
                }
                case AscDFH.historyitem_type_GroupShape:
                {
                    var anchor = drawing.getDrawingBaseType();

                    var group_drawing_props = this.getDrawingPropsFromArray(drawing.spTree);

                    if(group_drawing_props.shapeProps)
                    {
                        group_drawing_props.shapeProps.anchor = anchor;
                        if(!shape_props)
                            shape_props = group_drawing_props.shapeProps;
                        else
                        {
                            shape_props = AscFormat.CompareShapeProperties(shape_props, group_drawing_props.shapeProps);
                        }
                    }

                    if(group_drawing_props.shapeChartProps)
                    {
                        group_drawing_props.shapeChartProps.anchor = anchor;
                        if(!shape_chart_props)
                        {
                            shape_chart_props = group_drawing_props.shapeChartProps;
                        }
                        else
                        {
                            shape_chart_props = AscFormat.CompareShapeProperties(shape_chart_props, group_drawing_props.shapeChartProps);
                        }
                    }
                    if(group_drawing_props.imageProps)
                    {
                        group_drawing_props.imageProps.anchor = anchor;
                        if(!image_props)
                            image_props = group_drawing_props.imageProps;
                        else
                        {
                            if(image_props.ImageUrl !== null && image_props.ImageUrl !== group_drawing_props.imageProps.ImageUrl)
                                image_props.ImageUrl = null;

                            if(image_props.w != null && image_props.w !== group_drawing_props.imageProps.w)
                                image_props.w = null;
                            if(image_props.h != null && image_props.h !== group_drawing_props.imageProps.h)
                                image_props.h = null;
                            if(image_props.x != null && image_props.x !== group_drawing_props.imageProps.x)
                                image_props.x = null;
                            if(image_props.y != null && image_props.y !== group_drawing_props.imageProps.y)
                                image_props.y = null;
                            if(image_props.rot != null && image_props.rot !== group_drawing_props.imageProps.rot)
                                image_props.rot = null;
                            if(image_props.flipH != null && image_props.flipH !== group_drawing_props.imageProps.flipH)
                                image_props.flipH = null;
                            if(image_props.flipV != null && image_props.flipV !== group_drawing_props.imageProps.flipV)
                                image_props.flipV = null;

                            if(image_props.locked || group_drawing_props.imageProps.locked)
                                image_props.locked = true;
                            if(!image_props.lockAspect || !group_drawing_props.imageProps.lockAspect)
                                image_props.lockAspect = false;
                            if(image_props.title !== group_drawing_props.imageProps.title)
                                image_props.title = undefined;
                            if(image_props.description !== group_drawing_props.imageProps.description)
                                image_props.description = undefined;


                        }
                    }
                    if(group_drawing_props.chartProps)
                    {
                        group_drawing_props.chartProps.anchor = anchor;
                        if(!chart_props)
                        {
                            chart_props = group_drawing_props.chartProps;
                        }
                        else
                        {
                            chart_props.chartProps = null;
                            chart_props.severalCharts = true;
                            if(!chart_props.severalChartStyles)
                            {
                                chart_props.severalChartStyles = (chart_props.styleId !== group_drawing_props.chartProps.styleId);
                            }
                            if(!chart_props.severalChartTypes)
                            {
                                chart_props.severalChartTypes = (chart_props.type !== group_drawing_props.chartProps.type);
                            }
                            if(chart_props.w != null && chart_props.w !== group_drawing_props.chartProps.w)
                                chart_props.w = null;
                            if(chart_props.h != null && chart_props.h !== group_drawing_props.chartProps.h)
                                chart_props.h = null;



                            if(chart_props.title !== group_drawing_props.title)
                                chart_props.title = undefined;
                            if(chart_props.description !== group_drawing_props.chartProps.description)
                                chart_props.description = undefined;


                            if(chart_props.locked || group_drawing_props.chartProps.locked)
                                chart_props.locked = true;
                        }
                    }
                    if(group_drawing_props.tableProps)
                    {
                        if(!table_props)
                        {
                            table_props = group_drawing_props.tableProps;
                        }
                        else
                        {
                            table_props = null;
                        }
                    }
                    break;
                }
            }
        }
        if(shape_props && shape_props.textArtProperties)
        {
            var oTextArtProperties = shape_props.textArtProperties;
            var oTextPr = this.getParagraphTextPr();
            if(oTextPr)
            {
                if(oTextPr.TextFill)
                {
                    oTextArtProperties.Fill = oTextPr.TextFill;
                }
                else if(oTextPr.Unifill)
                {
                    oTextArtProperties.Fill = oTextPr.Unifill;
                }
                else if(oTextPr.Color)
                {
                    oTextArtProperties.Fill = AscFormat.CreateUnfilFromRGB(oTextPr.Color.r, oTextPr.Color.g, oTextPr.Color.b);
                }
                if(oTextPr.TextOutline){
                    oTextArtProperties.Line = oTextPr.TextOutline;
                }
                else{
                    oTextArtProperties.Line = AscFormat.CreateNoFillLine();
                }
                if(oTextArtProperties.Fill)
                {
                    oTextArtProperties.Fill.check(this.getTheme(), this.getColorMap());
                }
                if(oTextArtProperties.Line && oTextArtProperties.Line.Fill)
                {
                    oTextArtProperties.Line.Fill.check(this.getTheme(), this.getColorMap());
                }
            }
        }
        return {imageProps: image_props, shapeProps: shape_props, chartProps: chart_props, tableProps: table_props, shapeChartProps: shape_chart_props};
    },

    getDrawingProps: function()
    {
        if(this.selection.groupSelection)
        {
            return this.getDrawingPropsFromArray(this.selection.groupSelection.selectedObjects);
        }
        return this.getDrawingPropsFromArray(this.selectedObjects);
    },

    getEditorApi: function()
    {
        if(window["Asc"] && window["Asc"]["editor"])
        {
            return window["Asc"]["editor"];
        }
        else
        {
            return editor;
        }
    },

    getGraphicObjectProps: function()
    {
        var  props = this.getDrawingProps();

        var api = this.getEditorApi();
        var shape_props, image_props, chart_props;
        var ascSelectedObjects = [];

        var ret = [], i, bParaLocked = false;
        var oDrawingDocument = this.drawingObjects && this.drawingObjects.drawingDocument;
        if(isRealObject(props.shapeChartProps))
        {
            shape_props = new Asc.asc_CImgProperty();
            shape_props.fromGroup = props.shapeChartProps.fromGroup;
            shape_props.ShapeProperties = new Asc.asc_CShapeProperty();
            shape_props.ShapeProperties.type =  props.shapeChartProps.type;
            shape_props.ShapeProperties.fill = props.shapeChartProps.fill;
            shape_props.ShapeProperties.stroke = props.shapeChartProps.stroke;
            shape_props.ShapeProperties.canChangeArrows = props.shapeChartProps.canChangeArrows;
            shape_props.ShapeProperties.bFromChart = props.shapeChartProps.bFromChart;
            shape_props.ShapeProperties.bFromImage = props.shapeChartProps.bFromImage;
            shape_props.ShapeProperties.lockAspect = props.shapeChartProps.lockAspect;
            shape_props.ShapeProperties.anchor = props.shapeChartProps.anchor;

            if(props.shapeChartProps.paddings)
            {
                shape_props.ShapeProperties.paddings = new Asc.asc_CPaddings(props.shapeChartProps.paddings);
            }
            shape_props.verticalTextAlign = props.shapeChartProps.verticalTextAlign;
            shape_props.vert = props.shapeChartProps.vert;
            shape_props.ShapeProperties.canFill = props.shapeChartProps.canFill;
            shape_props.Width = props.shapeChartProps.w;
            shape_props.Height = props.shapeChartProps.h;
            var pr = shape_props.ShapeProperties;
            var oTextArtProperties;
            if (!isRealObject(props.shapeProps) && oDrawingDocument)
            {
                if (pr.fill != null && pr.fill.fill != null && pr.fill.fill.type == c_oAscFill.FILL_TYPE_BLIP)
                {
                    if(api)
                    {
                        oDrawingDocument.InitGuiCanvasShape(api.shapeElementId);
                    }
                    oDrawingDocument.LastDrawingUrl = null;
                    oDrawingDocument.DrawImageTextureFillShape(pr.fill.fill.RasterImageId);
                }
                else
                {
                    if(api)
                    {
                        oDrawingDocument.InitGuiCanvasShape(api.shapeElementId);
                    }
                    oDrawingDocument.DrawImageTextureFillShape(null);
                }


                if(pr.textArtProperties)
                {
                    oTextArtProperties = pr.textArtProperties;
                    if(oTextArtProperties && oTextArtProperties.Fill && oTextArtProperties.Fill.fill  && oTextArtProperties.Fill.fill.type == c_oAscFill.FILL_TYPE_BLIP)
                    {
                        if(api)
                        {
                            oDrawingDocument.InitGuiCanvasTextArt(api.textArtElementId);
                        }
                        oDrawingDocument.LastDrawingUrlTextArt = null;
                        oDrawingDocument.DrawImageTextureFillTextArt(oTextArtProperties.Fill.fill.RasterImageId);
                    }
                    else
                    {
                        oDrawingDocument.DrawImageTextureFillTextArt(null);
                    }
                }

            }
            shape_props.ShapeProperties.fill = AscFormat.CreateAscFill(shape_props.ShapeProperties.fill);
            shape_props.ShapeProperties.stroke = AscFormat.CreateAscStroke(shape_props.ShapeProperties.stroke, shape_props.ShapeProperties.canChangeArrows === true);
            shape_props.ShapeProperties.stroke.canChangeArrows = shape_props.ShapeProperties.canChangeArrows === true;
            shape_props.Locked = props.shapeChartProps.locked === true;

            ret.push(shape_props);
        }
        if (isRealObject(props.shapeProps))
        {
            shape_props = new Asc.asc_CImgProperty();
            shape_props.fromGroup = CanStartEditText(this);
            shape_props.ShapeProperties = new Asc.asc_CShapeProperty();
            shape_props.ShapeProperties.type =  props.shapeProps.type;
            shape_props.ShapeProperties.fill = props.shapeProps.fill;
            shape_props.ShapeProperties.stroke = props.shapeProps.stroke;
            shape_props.ShapeProperties.canChangeArrows = props.shapeProps.canChangeArrows;
            shape_props.ShapeProperties.bFromChart = props.shapeProps.bFromChart;
            shape_props.ShapeProperties.bFromImage = props.shapeProps.bFromImage;
            shape_props.ShapeProperties.lockAspect = props.shapeProps.lockAspect;
            shape_props.ShapeProperties.description = props.shapeProps.description;
            shape_props.ShapeProperties.title = props.shapeProps.title;
            shape_props.ShapeProperties.rot = props.shapeProps.rot;
            shape_props.ShapeProperties.flipH = props.shapeProps.flipH;
            shape_props.ShapeProperties.flipV = props.shapeProps.flipV;
            shape_props.description = props.shapeProps.description;
            shape_props.title = props.shapeProps.title;
            shape_props.ShapeProperties.textArtProperties = AscFormat.CreateAscTextArtProps(props.shapeProps.textArtProperties);
            shape_props.lockAspect = props.shapeProps.lockAspect;
            shape_props.anchor = props.shapeProps.anchor;

            shape_props.ShapeProperties.columnNumber = props.shapeProps.columnNumber;
            shape_props.ShapeProperties.columnSpace = props.shapeProps.columnSpace;
            shape_props.ShapeProperties.shadow = props.shapeProps.shadow;
            if(props.shapeProps.textArtProperties && oDrawingDocument)
            {
                oTextArtProperties = props.shapeProps.textArtProperties;
                if(oTextArtProperties && oTextArtProperties.Fill && oTextArtProperties.Fill.fill  && oTextArtProperties.Fill.fill.type == c_oAscFill.FILL_TYPE_BLIP)
                {
                    if(api)
                    {
                        oDrawingDocument.InitGuiCanvasTextArt(api.textArtElementId);
                    }
                    oDrawingDocument.LastDrawingUrlTextArt = null;
                    oDrawingDocument.DrawImageTextureFillTextArt(oTextArtProperties.Fill.fill.RasterImageId);
                }
                else
                {
                    oDrawingDocument.DrawImageTextureFillTextArt(null);
                }
            }

            if(props.shapeProps.paddings)
            {
                shape_props.ShapeProperties.paddings = new Asc.asc_CPaddings(props.shapeProps.paddings);
            }
            shape_props.verticalTextAlign = props.shapeProps.verticalTextAlign;
            shape_props.vert = props.shapeProps.vert;
            shape_props.ShapeProperties.canFill = props.shapeProps.canFill;
            shape_props.Width = props.shapeProps.w;
            shape_props.Height = props.shapeProps.h;
            shape_props.rot = props.shapeProps.rot;
            shape_props.flipH = props.shapeProps.flipH;
            shape_props.flipV = props.shapeProps.flipV;
            var pr = shape_props.ShapeProperties;
            if(oDrawingDocument)
            {
                if (pr.fill != null && pr.fill.fill != null && pr.fill.fill.type == c_oAscFill.FILL_TYPE_BLIP)
                {
                    if(api)
                    {
                        oDrawingDocument.InitGuiCanvasShape(api.shapeElementId);
                    }
                    oDrawingDocument.LastDrawingUrl = null;
                    oDrawingDocument.DrawImageTextureFillShape(pr.fill.fill.RasterImageId);
                }
                else
                {
                    if(api)
                    {
                        oDrawingDocument.InitGuiCanvasShape(api.shapeElementId);
                    }
                    oDrawingDocument.DrawImageTextureFillShape(null);
                }
            }
            shape_props.ShapeProperties.fill = AscFormat.CreateAscFill(shape_props.ShapeProperties.fill);
            shape_props.ShapeProperties.stroke = AscFormat.CreateAscStroke(shape_props.ShapeProperties.stroke, shape_props.ShapeProperties.canChangeArrows === true);
            shape_props.ShapeProperties.stroke.canChangeArrows  = shape_props.ShapeProperties.canChangeArrows === true;
            shape_props.Locked = props.shapeProps.locked === true;

            if(!bParaLocked)
            {
                bParaLocked = shape_props.Locked;
            }
            ret.push(shape_props);
        }
        if (isRealObject(props.imageProps))
        {
            image_props = new Asc.asc_CImgProperty();
            image_props.Width = props.imageProps.w;
            image_props.Height = props.imageProps.h;
            image_props.rot = props.imageProps.rot;
            image_props.flipH = props.imageProps.flipH;
            image_props.flipV = props.imageProps.flipV;
            image_props.ImageUrl = props.imageProps.ImageUrl;
            image_props.Locked = props.imageProps.locked === true;
            image_props.lockAspect = props.imageProps.lockAspect;
            image_props.anchor = props.imageProps.anchor;


            image_props.pluginGuid = props.imageProps.pluginGuid;
            image_props.pluginData = props.imageProps.pluginData;

            image_props.oleWidth = props.imageProps.oleWidth;
            image_props.oleHeight = props.imageProps.oleHeight;

            image_props.description = props.imageProps.description;
            image_props.title = props.imageProps.title;

            if(!bParaLocked)
            {
                bParaLocked = image_props.Locked;
            }
            ret.push(image_props);
            this.sendCropState();
        }
        if (isRealObject(props.chartProps) && isRealObject(props.chartProps.chartProps))
        {
            chart_props = new Asc.asc_CImgProperty();
            chart_props.Width = props.chartProps.w;
            chart_props.Height = props.chartProps.h;
            chart_props.ChartProperties = props.chartProps.chartProps;
            chart_props.Locked = props.chartProps.locked === true;
            chart_props.lockAspect = props.chartProps.lockAspect;
            chart_props.anchor = props.chartProps.anchor;
            if(!bParaLocked)
            {
                bParaLocked = chart_props.Locked;
            }

            chart_props.description = props.chartProps.description;
            chart_props.title = props.chartProps.title;
            ret.push(chart_props);
        }
        for (i = 0; i < ret.length; i++)
        {
            ascSelectedObjects.push(new AscCommon.asc_CSelectedObject ( Asc.c_oAscTypeSelectElement.Image, new Asc.asc_CImgProperty(ret[i]) ));
        }

        // Текстовые свойства объекта
        var ParaPr = this.getParagraphParaPr();
        var TextPr = this.getParagraphTextPr();
        if ( ParaPr && TextPr ) {
            var theme = this.getTheme();
            if(theme && theme.themeElements && theme.themeElements.fontScheme)
            {
                TextPr.ReplaceThemeFonts(theme.themeElements.fontScheme);
                var oBullet = ParaPr.Bullet;
                if(oBullet && oBullet.bulletColor)
                {
                    if(oBullet.bulletColor.UniColor)
                    {
                        oBullet.bulletColor.UniColor.check(theme, this.getColorMap());
                    }
                }
                if(TextPr.Unifill)
                {
                    ParaPr.Unifill = TextPr.Unifill;
                }
            }

            if(bParaLocked)
            {
                ParaPr.Locked = true;
            }
            this.prepareParagraphProperties(ParaPr, TextPr, ascSelectedObjects);
        }
        var oTargetDocContent = this.getTargetDocContent(false, false);
        if(oTargetDocContent)
        {
            if (( true === oTargetDocContent.Selection.Use && oTargetDocContent.Selection.StartPos == oTargetDocContent.Selection.EndPos && type_Paragraph == oTargetDocContent.Content[oTargetDocContent.Selection.StartPos].GetType() ) || ( false == oTargetDocContent.Selection.Use && type_Paragraph == oTargetDocContent.Content[oTargetDocContent.CurPos.ContentPos].GetType() ))
            {
                var oParagraph;
                if (true == oTargetDocContent.Selection.Use)
                    oParagraph = oTargetDocContent.Content[oTargetDocContent.Selection.StartPos];
                else
                    oParagraph = oTargetDocContent.Content[oTargetDocContent.CurPos.ContentPos];
                if ( true === oParagraph.Selection.Use )
                {
                    var StartPos = oParagraph.Selection.StartPos;
                    var EndPos   = oParagraph.Selection.EndPos;
                    if ( StartPos > EndPos )
                    {
                        StartPos = oParagraph.Selection.EndPos;
                        EndPos   = oParagraph.Selection.StartPos;
                    }

                    for ( var CurPos = StartPos; CurPos <= EndPos; CurPos++ )
                    {
                        var Element = oParagraph.Content[CurPos];

                        if (true !== Element.IsSelectionEmpty() && (para_Math === Element.Type))
                        {
                            ascSelectedObjects.push(new AscCommon.asc_CSelectedObject(Asc.c_oAscTypeSelectElement.Math, Element.Get_MenuProps()));
                        }
                    }
                }
                else
                {
                    var CurType = oParagraph.Content[oParagraph.CurPos.ContentPos].Type;
                    if (para_Math === CurType)
                    {
                        ascSelectedObjects.push(new AscCommon.asc_CSelectedObject(Asc.c_oAscTypeSelectElement.Math, oParagraph.Content[oParagraph.CurPos.ContentPos].Get_MenuProps()));
                    }
                }
            }
        }

        return ascSelectedObjects;
    },

    prepareParagraphProperties: function(ParaPr, TextPr, ascSelectedObjects)
    {
        var _this = this;
        var trigger = this.drawingObjects.callTrigger;

        ParaPr.Subscript   = ( TextPr.VertAlign === AscCommon.vertalign_SubScript   ? true : false );
        ParaPr.Superscript = ( TextPr.VertAlign === AscCommon.vertalign_SuperScript ? true : false );
        ParaPr.Strikeout   = TextPr.Strikeout;
        ParaPr.DStrikeout  = TextPr.DStrikeout;
        ParaPr.AllCaps     = TextPr.Caps;
        ParaPr.SmallCaps   = TextPr.SmallCaps;
        ParaPr.TextSpacing = TextPr.Spacing;
        ParaPr.Position    = TextPr.Position;
        //-----------------------------------------------------------------------------

        if ( true === ParaPr.Spacing.AfterAutoSpacing )
            ParaPr.Spacing.After = spacing_Auto;
        else if ( undefined === ParaPr.Spacing.AfterAutoSpacing )
            ParaPr.Spacing.After = UnknownValue;

        if ( true === ParaPr.Spacing.BeforeAutoSpacing )
            ParaPr.Spacing.Before = spacing_Auto;
        else if ( undefined === ParaPr.Spacing.BeforeAutoSpacing )
            ParaPr.Spacing.Before = UnknownValue;

        if ( -1 === ParaPr.PStyle )
            ParaPr.StyleName = "";

        if ( null == ParaPr.NumPr || 0 === ParaPr.NumPr.NumId )
            ParaPr.ListType = {Type: -1, SubType : -1};

        // ParaPr.Spacing
        if ( true === ParaPr.Spacing.AfterAutoSpacing )
            ParaPr.Spacing.After = spacing_Auto;
        else if ( undefined === ParaPr.Spacing.AfterAutoSpacing )
            ParaPr.Spacing.After = UnknownValue;

        if ( true === ParaPr.Spacing.BeforeAutoSpacing )
            ParaPr.Spacing.Before = spacing_Auto;
        else if ( undefined === ParaPr.Spacing.BeforeAutoSpacing )
            ParaPr.Spacing.Before = UnknownValue;

        trigger("asc_onParaSpacingLine", new AscCommon.asc_CParagraphSpacing( ParaPr.Spacing ));

        // ParaPr.Jc
        trigger("asc_onPrAlign", ParaPr.Jc);

        ascSelectedObjects.push(new AscCommon.asc_CSelectedObject ( Asc.c_oAscTypeSelectElement.Paragraph, new Asc.asc_CParagraphProperty( ParaPr ) ));
    },


    createImage: function(rasterImageId, x, y, extX, extY, sVideoUrl, sAudioUrl)
    {
        var image = new AscFormat.CImageShape();
        AscFormat.fillImage(image, rasterImageId, x, y, extX, extY, sVideoUrl, sAudioUrl);
        return image;
    },

    createOleObject: function(data, sApplicationId, rasterImageId, x, y, extX, extY, nWidthPix, nHeightPix)
    {
        var oleObject = new AscFormat.COleObject();
        AscFormat.fillImage(oleObject, rasterImageId, x, y, extX, extY);
        oleObject.setData(data);
        oleObject.setApplicationId(sApplicationId);
        oleObject.setPixSizes(nWidthPix, nHeightPix);
        return oleObject;
    },

    createTextArt: function(nStyle, bWord, wsModel, sStartString)
    {
        var MainLogicDocument = (editor && editor.WordControl && editor.WordControl.m_oLogicDocument ? editor && editor.WordControl && editor.WordControl.m_oLogicDocument : null);
        var TrackRevisions = (MainLogicDocument ? MainLogicDocument.IsTrackRevisions() : false);

        if (MainLogicDocument && true === TrackRevisions)
            MainLogicDocument.SetTrackRevisions(false);

        var oShape = new AscFormat.CShape();
        oShape.setWordShape(bWord === true);
        oShape.setBDeleted(false);
        if(wsModel)
            oShape.setWorksheet(wsModel);
        var nFontSize;
        if(bWord)
        {
            nFontSize = 36;
            oShape.createTextBoxContent();
        }
        else
        {
            nFontSize = 54;
            oShape.createTextBody();
        }
        var bUseStartString = (typeof sStartString === "string");
		if(bUseStartString)
		{
			nFontSize = undefined;
		}
        var oSpPr = new AscFormat.CSpPr();
        var oXfrm = new AscFormat.CXfrm();
        oXfrm.setOffX(0);
        oXfrm.setOffY(0);
        oXfrm.setExtX(1828800/36000);
        oXfrm.setExtY(1828800/36000);
        oSpPr.setXfrm(oXfrm);
        oXfrm.setParent(oSpPr);
        oSpPr.setFill(AscFormat.CreateNoFillUniFill());
        oSpPr.setLn(AscFormat.CreateNoFillLine());
        oSpPr.setGeometry(AscFormat.CreateGeometry("rect"));
        oShape.setSpPr(oSpPr);
        oSpPr.setParent(oShape);
        var oContent = oShape.getDocContent();
        var sText, oSelectedContent, oNearestPos, sSelectedText;
        if(this.document)
        {
            sSelectedText = this.document.GetSelectedText(false, {});
            oSelectedContent = this.document.GetSelectedContent(true);
            oContent.Recalculate_Page(0, true);
            oContent.MoveCursorToStartPos(false);
            oNearestPos = oContent.Get_NearestPos(0, 0, 0, false, undefined);
            oNearestPos.Paragraph.Check_NearestPos( oNearestPos );
            if(typeof sSelectedText === "string" && sSelectedText.length > 0)
            {
                if(oSelectedContent && this.document.Can_InsertContent(oSelectedContent, oNearestPos))
                {
                    oSelectedContent.MoveDrawing = true;
                    if(oSelectedContent.Elements.length > 1 && oSelectedContent.Elements[oSelectedContent.Elements.length - 1].Element.GetType() === AscCommonWord.type_Paragraph
                    && oSelectedContent.Elements[oSelectedContent.Elements.length - 1].Element.IsEmpty()){
                        oSelectedContent.Elements.splice(oSelectedContent.Elements.length - 1, 1);
                    }
                    if(oSelectedContent.Elements.length > 0){
                        oSelectedContent.Elements[oSelectedContent.Elements.length - 1].SelectedAll = false;
                    }
                    oContent.InsertContent(oSelectedContent, oNearestPos);
                    oContent.Selection.Start    = false;
                    oContent.Selection.Use      = false;
                    oContent.Selection.StartPos = 0;
                    oContent.Selection.EndPos   = 0;
                    oContent.Selection.Flag     = selectionflag_Common;
                    oContent.SetDocPosType(docpostype_Content);
                    oContent.CurPos.ContentPos = 0;
                    oShape.bSelectedText = true;
                }
                else
                {
                    sText = this.getDefaultText();
                    AscFormat.AddToContentFromString(oContent, sText);
                    oShape.bSelectedText = false;
                }
            }
            else
            {
                sText = this.getDefaultText();
                AscFormat.AddToContentFromString(oContent, sText);
                oShape.bSelectedText = false;
            }
        }
        else if(this.drawingObjects.cSld)
        {
            oShape.setParent(this.drawingObjects);
            var oTargetDocContent = this.getTargetDocContent();
            if(oTargetDocContent && oTargetDocContent.Selection.Use && oTargetDocContent.GetSelectedText(false, {}).length > 0)
            {
                oSelectedContent = new CSelectedContent();
                oTargetDocContent.GetSelectedContent(oSelectedContent);
                oSelectedContent.MoveDrawing = true;
                if(oSelectedContent.Elements.length > 1 && oSelectedContent.Elements[oSelectedContent.Elements.length - 1].Element.GetType() === AscCommonWord.type_Paragraph
                    && oSelectedContent.Elements[oSelectedContent.Elements.length - 1].Element.IsEmpty()){
                    oSelectedContent.Elements.splice(oSelectedContent.Elements.length - 1, 1);
                }
                if(oSelectedContent.Elements.length > 0){
                    oSelectedContent.Elements[oSelectedContent.Elements.length - 1].SelectedAll = false;
                }

                oContent.Recalculate_Page(0, true);
                oContent.MoveCursorToStartPos(false);
                var paragraph = oContent.Content[oContent.CurPos.ContentPos];
                if (null != paragraph && type_Paragraph == paragraph.GetType())
                {
                    oNearestPos = { Paragraph: paragraph, ContentPos: paragraph.Get_ParaContentPos(false, false) };
                    paragraph.Check_NearestPos(oNearestPos);
                    oContent.InsertContent(oSelectedContent, oNearestPos);
                    oShape.bSelectedText = false;
                }
                else
                {
                    sText = this.getDefaultText();
                    AscFormat.AddToContentFromString(oContent, sText);
                    oShape.bSelectedText = false;
                }
            }
            else
            {
                oShape.bSelectedText = false;
                sText = bUseStartString ? sStartString : this.getDefaultText();
                AscFormat.AddToContentFromString(oContent, sText);
            }
        }
        else
        {
            sText = bUseStartString ? sStartString : this.getDefaultText();
            AscFormat.AddToContentFromString(oContent, sText);
        }
        var oTextPr;
        if(!bUseStartString)
        {
            oTextPr = oShape.getTextArtPreviewManager().getStylesToApply()[nStyle].Copy();
            oTextPr.FontSize = nFontSize;
            oTextPr.RFonts.Ascii = undefined;
            if(!((typeof CGraphicObjects !== "undefined") && (this instanceof CGraphicObjects)))
            {
                oTextPr.Unifill = oTextPr.TextFill;
                oTextPr.TextFill = undefined;
            }
        }
        else
        {
            oTextPr = new CTextPr();
            oTextPr.FontSize = nFontSize;
            oTextPr.RFonts.Ascii = {Name: "Cambria Math", Index: -1};
            oTextPr.RFonts.HAnsi = {Name: "Cambria Math", Index: -1};
            oTextPr.RFonts.CS = {Name: "Cambria Math", Index: -1};
            oTextPr.RFonts.EastAsia = {Name: "Cambria Math", Index: -1};
        }
        oContent.Set_ApplyToAll(true);
        oContent.AddToParagraph(new ParaTextPr(oTextPr));
        oContent.SetParagraphAlign(AscCommon.align_Center);
        oContent.Set_ApplyToAll(false);
        var oBodyPr = oShape.getBodyPr().createDuplicate();
        oBodyPr.rot = 0;
        oBodyPr.spcFirstLastPara = false;
        oBodyPr.vertOverflow = AscFormat.nOTOwerflow;
        oBodyPr.horzOverflow = AscFormat.nOTOwerflow;
        oBodyPr.vert = AscFormat.nVertTThorz;
        oBodyPr.wrap = AscFormat.nTWTNone;
        oBodyPr.lIns = 2.54;
        oBodyPr.tIns = 1.27;
        oBodyPr.rIns = 2.54;
        oBodyPr.bIns = 1.27;
        oBodyPr.numCol = 1;
        oBodyPr.spcCol = 0;
        oBodyPr.rtlCol = 0;
        oBodyPr.fromWordArt = false;
        oBodyPr.anchor = 4;
        oBodyPr.anchorCtr = false;
        oBodyPr.forceAA = false;
        oBodyPr.compatLnSpc = true;
        oBodyPr.prstTxWarp = AscFormat.ExecuteNoHistory(function(){return AscFormat.CreatePrstTxWarpGeometry("textNoShape");}, this, []);
        oBodyPr.textFit = new AscFormat.CTextFit();
        oBodyPr.textFit.type = AscFormat.text_fit_Auto;
        if(bWord)
        {
            oShape.setBodyPr(oBodyPr);
        }
        else
        {
            oShape.txBody.setBodyPr(oBodyPr);
        }

        if (MainLogicDocument && true === TrackRevisions)
            MainLogicDocument.SetTrackRevisions(true);

        return oShape;
    },

	GetSelectedText: function(bCleartText, oPr)
    {
        var content = this.getTargetDocContent();
        if(content)
        {
            return content.GetSelectedText(bCleartText, oPr);
        }
        else
        {
            return "";
        }
    },

    putPrLineSpacing: function(type, value)
    {
        this.checkSelectedObjectsAndCallback(this.setParagraphSpacing, [{ LineRule : type,  Line : value }], false, AscDFH.historydescription_Spreadsheet_PutPrLineSpacing);
        //TODO
    },


    putLineSpacingBeforeAfter: function(type, value)
    {
        var arg;
        switch (type)
        {
            case 0:
            {
                if ( spacing_Auto === value )
                    arg = { BeforeAutoSpacing : true };
                else
                    arg = { Before : value, BeforeAutoSpacing : false };

                break;
            }
            case 1:
            {
                if ( spacing_Auto === value )
                    arg = { AfterAutoSpacing : true };
                else
                    arg = { After : value, AfterAutoSpacing : false };

                break;
            }
        }
        if(arg)
        {
            this.checkSelectedObjectsAndCallback(this.setParagraphSpacing, [arg], false, AscDFH.historydescription_Spreadsheet_SetParagraphSpacing);
        }
    },


    setGraphicObjectProps: function(props)
    {
        if(typeof Asc.asc_CParagraphProperty !== "undefined" && !(props instanceof Asc.asc_CParagraphProperty))
        {
            if(props && props.ChartProperties && typeof props.ChartProperties.getRange() === "string")
            {
                var editor = window["Asc"]["editor"];
                var check = parserHelp.checkDataRange(editor.wbModel, editor.wb, Asc.c_oAscSelectionDialogType.Chart, props.ChartProperties.getRange(), true, !props.ChartProperties.getInColumns(), props.ChartProperties.getType());
                if(check === c_oAscError.ID.StockChartError || check === c_oAscError.ID.DataRangeError
                    || check === c_oAscError.ID.MaxDataSeriesError)
                {
                    editor.wbModel.handlers.trigger("asc_onError", check, c_oAscError.Level.NoCritical);
                    this.drawingObjects.sendGraphicObjectProps();
                    return;
                }
            }

            var aAdditionalObjects = null;
            if(AscFormat.isRealNumber(props.Width) && AscFormat.isRealNumber(props.Height)){
                aAdditionalObjects = this.getConnectorsForCheck2();
            }
            this.checkSelectedObjectsAndCallback(this.setGraphicObjectPropsCallBack, [props], false, AscDFH.historydescription_Spreadsheet_SetGraphicObjectsProps, aAdditionalObjects);
            var oApplyProps = null;
            if(props)
            {
                if(props.ShapeProperties)
                {
                    oApplyProps = props.ShapeProperties;
                }
                else
                {
                    oApplyProps = props;
                }
            }
            if(oApplyProps &&  (oApplyProps.textArtProperties && typeof oApplyProps.textArtProperties.asc_getForm() === "string"  || oApplyProps.ChartProperties))
            {
                this.updateSelectionState();
            }
        }
        else
        {
            this.checkSelectedObjectsAndCallback(this.paraApplyCallback, [props], false, AscDFH.historydescription_Spreadsheet_ParaApply);
        }
    },



    checkSelectedObjectsAndCallback: function(callback, args, bNoSendProps, nHistoryPointType, aAdditionalObjects, bNoCheckLock)
    {
        var oApi = Asc.editor;
        if(oApi && oApi.collaborativeEditing && oApi.collaborativeEditing.getGlobalLock()){
            return;
        }
        var selection_state = this.getSelectionState();
        if(!(bNoCheckLock === true))
        {
            this.drawingObjects.objectLocker.reset();
            for(var i = 0; i < this.selectedObjects.length; ++i)
            {
                this.drawingObjects.objectLocker.addObjectId(this.selectedObjects[i].Get_Id());
            }
            if(aAdditionalObjects){
                for(var i = 0; i < aAdditionalObjects.length; ++i){
                    this.drawingObjects.objectLocker.addObjectId(aAdditionalObjects[i].Get_Id());
                }
            }
        }
        var _this = this;
        var callback2 = function(bLock, bSync)
        {
            if(bLock)
            {
                var nPointType = AscFormat.isRealNumber(nHistoryPointType) ? nHistoryPointType : AscDFH.historydescription_CommonControllerCheckSelected;
                History.Create_NewPoint(nPointType);
                if(bSync !== true)
                {
                    _this.setSelectionState(selection_state);
                    for(var i = 0; i < _this.selectedObjects.length; ++i)
                    {
                        _this.selectedObjects[i].lockType = c_oAscLockTypes.kLockTypeMine;
                    }
                    if(aAdditionalObjects){
                        for(var i = 0; i < aAdditionalObjects.length; ++i){
                            aAdditionalObjects[i].lockType = c_oAscLockTypes.kLockTypeMine;
                        }
                    }
                }
                callback.apply(_this, args);
                _this.startRecalculate();
                if(!(bNoSendProps === true))
                {
                    _this.drawingObjects.sendGraphicObjectProps();
                }
            }
        };
        if(!(bNoCheckLock === true))
        {
            return this.drawingObjects.objectLocker.checkObjects(callback2);
        }
        callback2(true, true);
        return true;
    },

    checkSelectedObjectsAndCallbackNoCheckLock: function(callback, args, bNoSendProps, nHistoryPointType)
    {
        var nPointType = AscFormat.isRealNumber(nHistoryPointType) ? nHistoryPointType : AscDFH.historydescription_CommonControllerCheckSelected;
        History.Create_NewPoint(nPointType);

        callback.apply(this, args);
        this.startRecalculate();
        if(!(bNoSendProps === true))
        {
            this.drawingObjects.sendGraphicObjectProps();
        }
    },

    checkSelectedObjectsAndCallback2: function(callback)
    {
        var selection_state = this.getSelectionState();
        this.drawingObjects.objectLocker.reset();
        for(var i = 0; i < this.selectedObjects.length; ++i)
        {
            this.drawingObjects.objectLocker.addObjectId(this.selectedObjects[i].Get_Id());
        }
        var _this = this;
        var callback2 = function(bLock)
        {
            if(bLock)
            {
                History.Create_NewPoint();
            }
            callback.apply(_this, [bLock]);
            if(bLock)
            {
                _this.startRecalculate();
                _this.drawingObjects.sendGraphicObjectProps();
            }

        };
        return this.drawingObjects.objectLocker.checkObjects(callback2);
    },

    setGraphicObjectPropsCallBack: function(props)
    {
        var apply_props;
        if(AscFormat.isRealNumber(props.Width) && AscFormat.isRealNumber(props.Height))
        {
            apply_props = props;
        }
        else
        {
            apply_props = props.ShapeProperties ? props.ShapeProperties : props;
        }
        var objects_by_types = this.applyDrawingProps(apply_props);
    },

    paraApplyCallback: function(Props)
    {
            if ( "undefined" != typeof(Props.ContextualSpacing) && null != Props.ContextualSpacing )
                this.setParagraphContextualSpacing( Props.ContextualSpacing );

            if ( "undefined" != typeof(Props.Ind) && null != Props.Ind )
                this.setParagraphIndent( Props.Ind );

            if ( "undefined" != typeof(Props.Jc) && null != Props.Jc )
                this.setParagraphAlign( Props.Jc );

            if ( "undefined" != typeof(Props.KeepLines) && null != Props.KeepLines )
                this.setParagraphKeepLines( Props.KeepLines );

            if ( undefined != Props.KeepNext && null != Props.KeepNext )
                this.setParagraphKeepNext( Props.KeepNext );

            if ( undefined != Props.WidowControl && null != Props.WidowControl )
                this.setParagraphWidowControl( Props.WidowControl );

            if ( "undefined" != typeof(Props.PageBreakBefore) && null != Props.PageBreakBefore )
                this.setParagraphPageBreakBefore( Props.PageBreakBefore );

            if ( "undefined" != typeof(Props.Spacing) && null != Props.Spacing )
                this.setParagraphSpacing( Props.Spacing );

            if ( "undefined" != typeof(Props.Shd) && null != Props.Shd )
                this.setParagraphShd( Props.Shd );

            if ( "undefined" != typeof(Props.Brd) && null != Props.Brd )
            {
                if(Props.Brd.Left && Props.Brd.Left.Color)
                {
                    Props.Brd.Left.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.Left.Color, 1);
                }
                if(Props.Brd.Top && Props.Brd.Top.Color)
                {
                    Props.Brd.Top.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.Top.Color, 1);
                }
                if(Props.Brd.Right && Props.Brd.Right.Color)
                {
                    Props.Brd.Right.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.Right.Color, 1);
                }
                if(Props.Brd.Bottom && Props.Brd.Bottom.Color)
                {
                    Props.Brd.Bottom.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.Bottom.Color, 1);
                }
                if(Props.Brd.InsideH && Props.Brd.InsideH.Color)
                {
                    Props.Brd.InsideH.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.InsideH.Color, 1);
                }
                if(Props.Brd.InsideV && Props.Brd.InsideV.Color)
                {
                    Props.Brd.InsideV.Unifill = AscFormat.CreateUnifillFromAscColor(Props.Brd.InsideV.Color, 1);
                }

                this.setParagraphBorders( Props.Brd );
            }

            if ( undefined != Props.Tabs )
            {
                var Tabs = new CParaTabs();
                Tabs.Set_FromObject( Props.Tabs.Tabs );
                this.setParagraphTabs( Tabs );
            }

            if ( undefined != Props.DefaultTab )
            {
                //AscCommonWord.Default_Tab_Stop = Props.DefaultTab;
                this.setDefaultTabSize( Props.DefaultTab );
            }

            if(undefined != Props.BulletSize || undefined != Props.BulletColor || undefined != Props.NumStartAt
                || undefined != Props.BulletSymbol && undefined != Props.BulletFont)
            {
              //  if()
                this.setParagraphNumbering(null, Props)
            }

            // TODO: как только разъединят настройки параграфа и текста переделать тут
            var TextPr = new CTextPr();

            if ( true === Props.Subscript )
                TextPr.VertAlign = AscCommon.vertalign_SubScript;
            else if ( true === Props.Superscript )
                TextPr.VertAlign = AscCommon.vertalign_SuperScript;
            else if ( false === Props.Superscript || false === Props.Subscript )
                TextPr.VertAlign = AscCommon.vertalign_Baseline;

            if ( undefined != Props.Strikeout )
            {
                TextPr.Strikeout  = Props.Strikeout;
                TextPr.DStrikeout = false;
            }

            if ( undefined != Props.DStrikeout )
            {
                TextPr.DStrikeout = Props.DStrikeout;
                if ( true === TextPr.DStrikeout )
                    TextPr.Strikeout = false;
            }

            if ( undefined != Props.SmallCaps )
            {
                TextPr.SmallCaps = Props.SmallCaps;
                TextPr.AllCaps   = false;
            }

            if ( undefined != Props.AllCaps )
            {
                TextPr.Caps = Props.AllCaps;
                if ( true === TextPr.AllCaps )
                    TextPr.SmallCaps = false;
            }

            if ( undefined != Props.TextSpacing )
                TextPr.Spacing = Props.TextSpacing;

            if ( undefined != Props.Position )
                TextPr.Position = Props.Position;

            this.paragraphAdd( new ParaTextPr(TextPr) );
        this.startRecalculate();
    },

    // layers
    setGraphicObjectLayer: function(layerType)
    {
        if(this.selection.groupSelection)
        {
            this.checkSelectedObjectsAndCallback(this.setGraphicObjectLayerCallBack, [layerType], false, AscDFH.historydescription_Spreadsheet_GraphicObjectLayer);
        }
        else
        {
            this.checkSelectedObjectsAndCallback(this.setGraphicObjectLayerCallBack, [layerType], false, AscDFH.historydescription_Spreadsheet_GraphicObjectLayer);
        }
       // this.checkSelectedObjectsAndCallback(this.setGraphicObjectLayerCallBack, [layerType]);
        //oAscDrawingLayerType
    },

    setGraphicObjectAlign: function(alignType)
    {
        this.checkSelectedObjectsAndCallback(this.setGraphicObjectAlignCallBack, [alignType], false, AscDFH.historydescription_Spreadsheet_GraphicObjectLayer);
    },
    distributeGraphicObjectHor: function()
    {
        this.checkSelectedObjectsAndCallback(this.distributeHor, [true], false, AscDFH.historydescription_Spreadsheet_GraphicObjectLayer);
    },

    distributeGraphicObjectVer: function()
    {
        this.checkSelectedObjectsAndCallback(this.distributeVer, [true], false, AscDFH.historydescription_Spreadsheet_GraphicObjectLayer);
    },

    setGraphicObjectLayerCallBack: function(layerType)
    {
        switch (layerType)
        {
            case 0:
            {
                this.bringToFront();
                break;
            }
            case 1:
            {
                this.sendToBack();
                break;
            }
            case 2:
            {
                this.bringForward();
                break;
            }
            case 3:
            {
                this.bringBackward();
            }
        }
    },

    setGraphicObjectAlignCallBack: function(alignType)
    {
        switch (alignType)
        {
            case 0:
            {
                this.alignLeft(true);
                break;
            }
            case 1:
            {
                this.alignRight(true);
                break;
            }
            case 2:
            {
                this.alignBottom(true);
                break;
            }
            case 3:
            {
                this.alignTop(true);
                break;
            }
            case 4:
            {
                this.alignCenter(true);
                break;
            }
            case 5:
            {
                this.alignMiddle(true);
                break;
            }
        }
    },


    alignLeft : function(bSelected)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, i, boundsObject, leftPos, arrBounds;
        if(selected_objects.length > 0)
        {
            boundsObject = getAbsoluteRectBoundsArr(selected_objects);
            arrBounds = boundsObject.arrBounds;
            if(bSelected && selected_objects.length > 1 )
            {
                leftPos = boundsObject.minX;
            }
            else
            {
                leftPos = 0;
            }
            this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
            this.swapTrackObjects();
            var move_state;
            if(!this.selection.groupSelection)
                move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
            else
                move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

            for(i = 0; i < this.arrTrackObjects.length; ++i)
                this.arrTrackObjects[i].track(leftPos - arrBounds[i].minX, 0, this.arrTrackObjects[i].originalObject.selectStartPage);
            move_state.bSamePos = false;
            move_state.onMouseUp({}, 0, 0, 0);
        }
    },

    alignRight : function(bSelected)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, i, boundsObject, rightPos, arrBounds;
        if(selected_objects.length > 0)
        {
            boundsObject = getAbsoluteRectBoundsArr(selected_objects);
            arrBounds = boundsObject.arrBounds;
            if(bSelected && selected_objects.length > 1 )
            {
                rightPos = boundsObject.maxX;
            }
            else
            {
                rightPos = this.drawingObjects.Width;
            }
            this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
            this.swapTrackObjects();
            var move_state;
            if(!this.selection.groupSelection)
                move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
            else
                move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

            for(i = 0; i < this.arrTrackObjects.length; ++i)
                this.arrTrackObjects[i].track(rightPos - arrBounds[i].maxX, 0, this.arrTrackObjects[i].originalObject.selectStartPage);
            move_state.bSamePos = false;
            move_state.onMouseUp({}, 0, 0, 0);
        }
    },


    alignTop : function(bSelected)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, i, boundsObject, topPos, arrBounds;
        if(selected_objects.length > 0)
        {
            boundsObject = getAbsoluteRectBoundsArr(selected_objects);
            arrBounds = boundsObject.arrBounds;
            if(bSelected && selected_objects.length > 1 )
            {
                topPos = boundsObject.minY;
            }
            else
            {
                topPos = 0;
            }
            this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
            this.swapTrackObjects();
            var move_state;
            if(!this.selection.groupSelection)
                move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
            else
                move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

            for(i = 0; i < this.arrTrackObjects.length; ++i)
                this.arrTrackObjects[i].track(0, topPos - arrBounds[i].minY, this.arrTrackObjects[i].originalObject.selectStartPage);
            move_state.bSamePos = false;
            move_state.onMouseUp({}, 0, 0, 0);
        }
    },


    alignBottom : function(bSelected)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, i, boundsObject, bottomPos, arrBounds;
        if(selected_objects.length > 0)
        {
            boundsObject = getAbsoluteRectBoundsArr(selected_objects);
            arrBounds = boundsObject.arrBounds;
            if(bSelected && selected_objects.length > 1 )
            {
                bottomPos = boundsObject.maxY;
            }
            else
            {
                bottomPos = this.drawingObjects.Height;
            }
            this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
            this.swapTrackObjects();
            var move_state;
            if(!this.selection.groupSelection)
                move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
            else
                move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

            for(i = 0; i < this.arrTrackObjects.length; ++i)
                this.arrTrackObjects[i].track(0, bottomPos - arrBounds[i].maxY, this.arrTrackObjects[i].originalObject.selectStartPage);
            move_state.bSamePos = false;
            move_state.onMouseUp({}, 0, 0, 0);
        }
    },


    alignCenter : function(bSelected)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, i, boundsObject, centerPos, arrBounds;
        if(selected_objects.length > 0)
        {
            boundsObject = getAbsoluteRectBoundsArr(selected_objects);
            arrBounds = boundsObject.arrBounds;
            if(bSelected && selected_objects.length > 1 )
            {
                centerPos = boundsObject.minX +(boundsObject.maxX - boundsObject.minX)/2;
            }
            else
            {
                centerPos = this.drawingObjects.Width/2;
            }
            this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
            this.swapTrackObjects();
            var move_state;
            if(!this.selection.groupSelection)
                move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
            else
                move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

            for(i = 0; i < this.arrTrackObjects.length; ++i)
                this.arrTrackObjects[i].track(centerPos - (arrBounds[i].maxX - arrBounds[i].minX)/2 - arrBounds[i].minX, 0, this.arrTrackObjects[i].originalObject.selectStartPage);
            move_state.bSamePos = false;
            move_state.onMouseUp({}, 0, 0, 0);
        }
    },

    alignMiddle : function(bSelected)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, i, boundsObject, middlePos, arrBounds;
        if(selected_objects.length > 0)
        {
            boundsObject = getAbsoluteRectBoundsArr(selected_objects);
            arrBounds = boundsObject.arrBounds;
            if(bSelected && selected_objects.length > 1 )
            {
                middlePos = boundsObject.minY +(boundsObject.maxY - boundsObject.minY)/2;
            }
            else
            {
                middlePos = this.drawingObjects.Height/2;
            }
            this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
            this.swapTrackObjects();
            var move_state;
            if(!this.selection.groupSelection)
                move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
            else
                move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

            for(i = 0; i < this.arrTrackObjects.length; ++i)
                this.arrTrackObjects[i].track(0, middlePos - (arrBounds[i].maxY - arrBounds[i].minY)/2 - arrBounds[i].minY, this.arrTrackObjects[i].originalObject.selectStartPage);
            move_state.bSamePos = false;
            move_state.onMouseUp({}, 0, 0, 0);
        }
    },

    distributeHor : function(bSelected)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, i, boundsObject, arrBounds, pos1, pos2, gap, sortObjects, lastPos;
        if(selected_objects.length > 0)
        {
            boundsObject = getAbsoluteRectBoundsArr(selected_objects);
            arrBounds = boundsObject.arrBounds;
            this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
            this.swapTrackObjects();
            sortObjects = [];
            for(i = 0; i < selected_objects.length; ++i)
            {
                sortObjects.push({trackObject: this.arrTrackObjects[i], boundsObject: arrBounds[i]});
            }
            sortObjects.sort(function(obj1, obj2){return (obj1.boundsObject.maxX + obj1.boundsObject.minX)/2 - (obj2.boundsObject.maxX + obj2.boundsObject.minX)/2});
            if(bSelected && selected_objects.length > 2)
            {
                pos1 = sortObjects[0].boundsObject.minX;
                pos2 = sortObjects[sortObjects.length - 1].boundsObject.maxX;
                gap = (pos2 - pos1 - boundsObject.summWidth)/(sortObjects.length - 1);
            }
            else
            {
                if(boundsObject.summWidth < this.drawingObjects.Width)
                {
                    gap = (this.drawingObjects.Width - boundsObject.summWidth)/(sortObjects.length + 1);
                    pos1 = gap;
                    pos2 = this.drawingObjects.Width - gap;
                }
                else
                {
                    pos1 = 0;
                    pos2 = this.drawingObjects.Width;
                    gap = (this.drawingObjects.Width - boundsObject.summWidth)/(sortObjects.length - 1);
                }
            }
            var move_state;
            if(!this.selection.groupSelection)
                move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
            else
                move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

            lastPos = pos1;
            for(i = 0; i < sortObjects.length; ++i)
            {
                sortObjects[i].trackObject.track(lastPos -  sortObjects[i].trackObject.originalObject.x, 0, sortObjects[i].trackObject.originalObject.selectStartPage);
                lastPos += (gap + (sortObjects[i].boundsObject.maxX - sortObjects[i].boundsObject.minX));
            }
            move_state.bSamePos = false;
            move_state.onMouseUp({}, 0, 0, 0);
        }
    },
    distributeVer : function(bSelected)
    {
        var selected_objects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects, i, boundsObject, arrBounds, pos1, pos2, gap, sortObjects, lastPos;
        if(selected_objects.length > 0)
        {
            boundsObject = getAbsoluteRectBoundsArr(selected_objects);
            arrBounds = boundsObject.arrBounds;
            this.checkSelectedObjectsForMove(this.selection.groupSelection ? this.selection.groupSelection : null);
            this.swapTrackObjects();
            sortObjects = [];
            for(i = 0; i < selected_objects.length; ++i)
            {
                sortObjects.push({trackObject: this.arrTrackObjects[i], boundsObject: arrBounds[i]});
            }
            sortObjects.sort(function(obj1, obj2){return (obj1.boundsObject.maxY + obj1.boundsObject.minY)/2 - (obj2.boundsObject.maxY + obj2.boundsObject.minY)/2});
            if(bSelected && selected_objects.length > 2)
            {
                pos1 = sortObjects[0].boundsObject.minY;
                pos2 = sortObjects[sortObjects.length - 1].boundsObject.maxY;
                gap = (pos2 - pos1 - boundsObject.summHeight)/(sortObjects.length - 1);
            }
            else
            {
                if(boundsObject.summHeight < this.drawingObjects.Height)
                {
                    gap = (this.drawingObjects.Height - boundsObject.summHeight)/(sortObjects.length + 1);
                    pos1 = gap;
                    pos2 = this.drawingObjects.Height - gap;
                }
                else
                {
                    pos1 = 0;
                    pos2 = this.drawingObjects.Height;
                    gap = (this.drawingObjects.Height - boundsObject.summHeight)/(sortObjects.length - 1);
                }
            }
            var move_state;
            if(!this.selection.groupSelection)
                move_state = new AscFormat.MoveState(this, this.selectedObjects[0], 0, 0);
            else
                move_state = new AscFormat.MoveInGroupState(this, this.selection.groupSelection.selectedObjects[0], this.selection.groupSelection, 0, 0);

            lastPos = pos1;
            for(i = 0; i < sortObjects.length; ++i)
            {
                sortObjects[i].trackObject.track(0, lastPos -  sortObjects[i].trackObject.originalObject.y, sortObjects[i].trackObject.originalObject.selectStartPage);
                lastPos += (gap + (sortObjects[i].boundsObject.maxY - sortObjects[i].boundsObject.minY));
            }
            move_state.bSamePos = false;
            move_state.onMouseUp({}, 0, 0, 0);
        }
    },


    bringToFront : function()
    {
        var sp_tree = this.getDrawingObjects();
        if(!(this.selection.groupSelection))
        {
            var selected = [];
            for(var i = 0; i < sp_tree.length; ++i)
            {
                if(sp_tree[i].selected)
                {
                    selected.push(sp_tree[i]);
                }
            }
            for(var i = sp_tree.length-1; i > -1 ; --i)
            {
                if(sp_tree[i].selected)
                {
                    sp_tree[i].deleteDrawingBase();
                }
            }
            for(i = 0; i < selected.length; ++i)
            {
                selected[i].addToDrawingObjects(sp_tree.length);
            }
        }
        else
        {
            this.selection.groupSelection.bringToFront();
        }
        this.drawingObjects.showDrawingObjects(true);
    },

    bringForward : function()
    {
        var sp_tree = this.getDrawingObjects();
        if(!(this.selection.groupSelection))
        {
            for(var i = sp_tree.length - 1;i > -1; --i)
            {
                var sp = sp_tree[i];
                if(sp.selected && i < sp_tree.length - 1 && !sp_tree[i+1].selected)
                {
                    sp.deleteDrawingBase();
                    sp.addToDrawingObjects(i+1);
                }
            }
        }
        else
        {
            this.selection.groupSelection.bringForward();
        }
        this.drawingObjects.showDrawingObjects(true);
    },

    sendToBack : function()
    {
        var sp_tree = this.getDrawingObjects();

        if(!(this.selection.groupSelection))
        {
            var  j = 0;
            for(var i = 0; i < sp_tree.length; ++i)
            {
                if(sp_tree[i].selected)
                {
                    var object = sp_tree[i];
                    object.deleteDrawingBase();
                    object.addToDrawingObjects(j);
                    ++j;
                }
            }
        }
        else
        {
            this.selection.groupSelection.sendToBack();
        }
        this.drawingObjects.showDrawingObjects(true);
    },


    bringBackward : function()
    {
        var sp_tree = this.getDrawingObjects();
        if(!(this.selection.groupSelection))
        {
            for(var i = 0;i < sp_tree.length; ++i)
            {
                var sp = sp_tree[i];
                if(sp.selected && i > 0 && !sp_tree[i-1].selected)
                {
                    sp.deleteDrawingBase();
                    sp.addToDrawingObjects(i-1);
                }
            }
        }
        else
        {
            this.selection.groupSelection.bringBackward();
        }
        this.drawingObjects.showDrawingObjects(true);
    }
};



function CBoundsController()
{
    this.min_x = 0xFFFF;
    this.min_y = 0xFFFF;
    this.max_x = -0xFFFF;
    this.max_y = -0xFFFF;

    this.Rects = [];
}

CBoundsController.prototype =
{
    ClearNoAttack : function()
    {
        this.min_x = 0xFFFF;
        this.min_y = 0xFFFF;
        this.max_x = -0xFFFF;
        this.max_y = -0xFFFF;

        if (0 != this.Rects.length)
            this.Rects.splice(0, this.Rects.length);
    },

    CheckPageRects : function(rects, ctx)
    {
        var _bIsUpdate = false;
        if (rects.length != this.Rects.length)
        {
            _bIsUpdate = true;
        }
        else
        {
            for (var i = 0; i < rects.length; i++)
            {
                var _1 = this.Rects[i];
                var _2 = rects[i];

                if (_1.x != _2.x || _1.y != _2.y || _1.w != _2.w || _1.h != _2.h)
                    _bIsUpdate = true;
            }
        }

        if (!_bIsUpdate)
            return;

        this.Clear(ctx);

        if (0 != this.Rects.length)
            this.Rects.splice(0, this.Rects.length);

        for (var i = 0; i < rects.length; i++)
        {
            var _r = rects[i];
            this.CheckRect(_r.x, _r.y, _r.w, _r.h);
            this.Rects.push(_r);
        }
    },

    Clear : function(ctx)
    {
        if (this.max_x != -0xFFFF && this.max_y != -0xFFFF)
        {
            ctx.fillRect(this.min_x - 5, this.min_y - 5, this.max_x - this.min_x + 10, this.max_y - this.min_y + 10);
        }
        this.min_x = 0xFFFF;
        this.min_y = 0xFFFF;
        this.max_x = -0xFFFF;
        this.max_y = -0xFFFF;
    },

    CheckPoint1 : function(x,y)
    {
        if (x < this.min_x)
            this.min_x = x;
        if (y < this.min_y)
            this.min_y = y;
    },
    CheckPoint2 : function(x,y)
    {
        if (x > this.max_x)
            this.max_x = x;
        if (y > this.max_y)
            this.max_y = y;
    },
    CheckPoint : function(x,y)
    {
        if (x < this.min_x)
            this.min_x = x;
        if (y < this.min_y)
            this.min_y = y;
        if (x > this.max_x)
            this.max_x = x;
        if (y > this.max_y)
            this.max_y = y;
    },
    CheckRect : function(x,y,w,h)
    {
        this.CheckPoint1(x,y);
        this.CheckPoint2(x + w,y + h);
    },

    fromBounds : function(_bounds)
    {
        this.min_x = _bounds.min_x;
        this.min_y = _bounds.min_y;
        this.max_x = _bounds.max_x;
        this.max_y = _bounds.max_y;
    }
};

function CSlideBoundsChecker()
{
    this.map_bounds_shape = {};
    this.map_bounds_shape["heart"] = true;

    this.IsSlideBoundsCheckerType = true;

    this.Bounds = new CBoundsController();

    this.m_oCurFont     = null;
    this.m_oTextPr      = null;

    this.m_oCoordTransform  = new AscCommon.CMatrixL();
    this.m_oTransform       = new AscCommon.CMatrixL();
    this.m_oFullTransform   = new AscCommon.CMatrixL();

    this.IsNoSupportTextDraw = true;

    this.LineWidth = null;
    this.AutoCheckLineWidth = false;
}

CSlideBoundsChecker.prototype =
{
    DrawLockParagraph: function()
    {},

    GetIntegerGrid: function()
    {
        return false;
    },

    AddSmartRect: function()
    {},

    drawCollaborativeChanges: function()
    {},

    drawSearchResult : function(x, y, w, h)
    {},

    IsShapeNeedBounds : function(preset)
    {
        if (preset === undefined || preset == null)
            return true;
        return (true === this.map_bounds_shape[preset]) ? false : true;
    },

    init : function(width_px, height_px, width_mm, height_mm)
    {
        this.m_lHeightPix   = height_px;
        this.m_lWidthPix    = width_px;
        this.m_dWidthMM     = width_mm;
        this.m_dHeightMM    = height_mm;
        this.m_dDpiX        = 25.4 * this.m_lWidthPix / this.m_dWidthMM;
        this.m_dDpiY        = 25.4 * this.m_lHeightPix / this.m_dHeightMM;

        this.m_oCoordTransform.sx   = this.m_dDpiX / 25.4;
        this.m_oCoordTransform.sy   = this.m_dDpiY / 25.4;

        this.Bounds.ClearNoAttack();
    },

    SetCurrentPage: function()
    {},

    EndDraw : function(){},
    put_GlobalAlpha : function(enable, alpha)
    {
    },
    Start_GlobalAlpha : function()
    {
    },
    End_GlobalAlpha : function()
    {
    },
    // pen methods
    p_color : function(r,g,b,a)
    {
    },
    p_width : function(w)
    {
    },
    p_dash : function(params)
    {
    },
    // brush methods
    b_color1 : function(r,g,b,a)
    {
    },
    b_color2 : function(r,g,b,a)
    {
    },

    SetIntegerGrid : function()
    {
    },

    transform : function(sx,shy,shx,sy,tx,ty)
    {
        this.m_oTransform.sx    = sx;
        this.m_oTransform.shx   = shx;
        this.m_oTransform.shy   = shy;
        this.m_oTransform.sy    = sy;
        this.m_oTransform.tx    = tx;
        this.m_oTransform.ty    = ty;

        this.CalculateFullTransform();
    },
    CalculateFullTransform : function()
    {
        this.m_oFullTransform.sx = this.m_oTransform.sx;
        this.m_oFullTransform.shx = this.m_oTransform.shx;
        this.m_oFullTransform.shy = this.m_oTransform.shy;
        this.m_oFullTransform.sy = this.m_oTransform.sy;
        this.m_oFullTransform.tx = this.m_oTransform.tx;
        this.m_oFullTransform.ty = this.m_oTransform.ty;
        AscCommon.global_MatrixTransformer.MultiplyAppend(this.m_oFullTransform, this.m_oCoordTransform);
    },
    // path commands
    _s : function()
    {
    },
    _e : function()
    {
    },
    _z : function()
    {
    },
    _m : function(x,y)
    {
        var _x = this.m_oFullTransform.TransformPointX(x,y);
        var _y = this.m_oFullTransform.TransformPointY(x,y);

        this.Bounds.CheckPoint(_x, _y);
    },
    _l : function(x,y)
    {
        var _x = this.m_oFullTransform.TransformPointX(x,y);
        var _y = this.m_oFullTransform.TransformPointY(x,y);

        this.Bounds.CheckPoint(_x, _y);
    },
    _c : function(x1,y1,x2,y2,x3,y3)
    {
        var _x1 = this.m_oFullTransform.TransformPointX(x1,y1);
        var _y1 = this.m_oFullTransform.TransformPointY(x1,y1);

        var _x2 = this.m_oFullTransform.TransformPointX(x2,y2);
        var _y2 = this.m_oFullTransform.TransformPointY(x2,y2);

        var _x3 = this.m_oFullTransform.TransformPointX(x3,y3);
        var _y3 = this.m_oFullTransform.TransformPointY(x3,y3);

        this.Bounds.CheckPoint(_x1, _y1);
        this.Bounds.CheckPoint(_x2, _y2);
        this.Bounds.CheckPoint(_x3, _y3);
    },
    _c2 : function(x1,y1,x2,y2)
    {
        var _x1 = this.m_oFullTransform.TransformPointX(x1,y1);
        var _y1 = this.m_oFullTransform.TransformPointY(x1,y1);

        var _x2 = this.m_oFullTransform.TransformPointX(x2,y2);
        var _y2 = this.m_oFullTransform.TransformPointY(x2,y2);

        this.Bounds.CheckPoint(_x1, _y1);
        this.Bounds.CheckPoint(_x2, _y2);
    },
    ds : function()
    {
    },
    df : function()
    {
    },

    // canvas state
    save : function()
    {
    },
    restore : function()
    {
    },
    clip : function()
    {
    },

    reset : function()
    {
        this.m_oTransform.Reset();
        this.CalculateFullTransform();
    },

    transform3 : function(m)
    {
        this.m_oTransform = m.CreateDublicate();
        this.CalculateFullTransform();
    },

    transform00 : function(m)
    {
        this.m_oTransform = m.CreateDublicate();
        this.m_oTransform.tx = 0;
        this.m_oTransform.ty = 0;
        this.CalculateFullTransform();
    },

    // images
    drawImage2 : function(img,x,y,w,h)
    {
        var _x1 = this.m_oFullTransform.TransformPointX(x,y);
        var _y1 = this.m_oFullTransform.TransformPointY(x,y);

        var _x2 = this.m_oFullTransform.TransformPointX(x+w,y);
        var _y2 = this.m_oFullTransform.TransformPointY(x+w,y);

        var _x3 = this.m_oFullTransform.TransformPointX(x+w,y+h);
        var _y3 = this.m_oFullTransform.TransformPointY(x+w,y+h);

        var _x4 = this.m_oFullTransform.TransformPointX(x,y+h);
        var _y4 = this.m_oFullTransform.TransformPointY(x,y+h);

        this.Bounds.CheckPoint(_x1, _y1);
        this.Bounds.CheckPoint(_x2, _y2);
        this.Bounds.CheckPoint(_x3, _y3);
        this.Bounds.CheckPoint(_x4, _y4);
    },
    drawImage : function(img,x,y,w,h)
    {
        return this.drawImage2(img, x, y, w, h);
    },

    // text
    font : function(font_id,font_size)
    {
        this.m_oFontManager.LoadFontFromFile(font_id, font_size, this.m_dDpiX, this.m_dDpiY);
    },
    GetFont : function()
    {
        return this.m_oCurFont;
    },
    SetFont : function(font)
    {
        this.m_oCurFont = font;
    },
    SetTextPr : function(textPr)
    {
        this.m_oTextPr = textPr;
    },
    SetFontSlot : function(slot, fontSizeKoef)
    {
    },
    GetTextPr : function()
    {
        return this.m_oTextPr;
    },
    FillText : function(x,y,text)
    {
        // убыстеренный вариант. здесь везде заточка на то, что приходит одна буква
        if (this.m_bIsBreak)
            return;

        // TODO: нужен другой метод отрисовки!!!
        var _x = this.m_oFullTransform.TransformPointX(x, y);
        var _y = this.m_oFullTransform.TransformPointY(x, y);
        this.Bounds.CheckRect(_x, _y, 1, 1);
    },
    FillTextCode : function(x, y, lUnicode)
    {
        // убыстеренный вариант. здесь везде заточка на то, что приходит одна буква
        if (this.m_bIsBreak)
            return;

        // TODO: нужен другой метод отрисовки!!!
        var _x = this.m_oFullTransform.TransformPointX(x, y);
        var _y = this.m_oFullTransform.TransformPointY(x, y);
        this.Bounds.CheckRect(_x, _y, 1, 1);
    },
    t : function(text,x,y)
    {
        if (this.m_bIsBreak)
            return;

        // TODO: нужен другой метод отрисовки!!!
        var _x = this.m_oFullTransform.TransformPointX(x, y);
        var _y = this.m_oFullTransform.TransformPointY(x, y);
        this.Bounds.CheckRect(_x, _y, 1, 1);
    },
    FillText2 : function(x,y,text,cropX,cropW)
    {
        // убыстеренный вариант. здесь везде заточка на то, что приходит одна буква
        if (this.m_bIsBreak)
            return;

        // TODO: нужен другой метод отрисовки!!!
        var _x = this.m_oFullTransform.TransformPointX(x, y);
        var _y = this.m_oFullTransform.TransformPointY(x, y);
        this.Bounds.CheckRect(_x, _y, 1, 1);
    },
    t2 : function(text,x,y,cropX,cropW)
    {
        if (this.m_bIsBreak)
            return;

        // TODO: нужен другой метод отрисовки!!!
        var _x = this.m_oFullTransform.TransformPointX(x, y);
        var _y = this.m_oFullTransform.TransformPointY(x, y);
        this.Bounds.CheckRect(_x, _y, 1, 1);
    },
    charspace : function(space)
    {
    },

    // private methods
    DrawHeaderEdit : function(yPos)
    {
    },
    DrawFooterEdit : function(yPos)
    {
    },

    DrawEmptyTableLine : function(x1,y1,x2,y2)
    {
    },

    DrawSpellingLine : function(y0, x0, x1, w)
    {
    },

    // smart methods for horizontal / vertical lines
    drawHorLine : function(align, y, x, r, penW)
    {
        var _x1 = this.m_oFullTransform.TransformPointX(x,y-penW);
        var _y1 = this.m_oFullTransform.TransformPointY(x,y-penW);

        var _x2 = this.m_oFullTransform.TransformPointX(x,y+penW);
        var _y2 = this.m_oFullTransform.TransformPointY(x,y+penW);

        var _x3 = this.m_oFullTransform.TransformPointX(r,y-penW);
        var _y3 = this.m_oFullTransform.TransformPointY(r,y-penW);

        var _x4 = this.m_oFullTransform.TransformPointX(r,y+penW);
        var _y4 = this.m_oFullTransform.TransformPointY(r,y+penW);

        this.Bounds.CheckPoint(_x1, _y1);
        this.Bounds.CheckPoint(_x2, _y2);
        this.Bounds.CheckPoint(_x3, _y3);
        this.Bounds.CheckPoint(_x4, _y4);
    },
    drawHorLine2 : function(align, y, x, r, penW)
    {
        return this.drawHorLine(align, y, x, r, penW);
    },
    drawVerLine : function(align, x, y, b, penW)
    {
        var _x1 = this.m_oFullTransform.TransformPointX(x-penW,y);
        var _y1 = this.m_oFullTransform.TransformPointY(x-penW,y);

        var _x2 = this.m_oFullTransform.TransformPointX(x+penW,y);
        var _y2 = this.m_oFullTransform.TransformPointY(x+penW,y);

        var _x3 = this.m_oFullTransform.TransformPointX(x-penW,b);
        var _y3 = this.m_oFullTransform.TransformPointY(x-penW,b);

        var _x4 = this.m_oFullTransform.TransformPointX(x+penW,b);
        var _y4 = this.m_oFullTransform.TransformPointY(x+penW,b);

        this.Bounds.CheckPoint(_x1, _y1);
        this.Bounds.CheckPoint(_x2, _y2);
        this.Bounds.CheckPoint(_x3, _y3);
        this.Bounds.CheckPoint(_x4, _y4);
    },

    // мега крутые функции для таблиц
    drawHorLineExt : function(align, y, x, r, penW, leftMW, rightMW)
    {
        this.drawHorLine(align, y, x + leftMW, r + rightMW);
    },

    rect : function(x,y,w,h)
    {
        var _x1 = this.m_oFullTransform.TransformPointX(x,y);
        var _y1 = this.m_oFullTransform.TransformPointY(x,y);

        var _x2 = this.m_oFullTransform.TransformPointX(x+w,y);
        var _y2 = this.m_oFullTransform.TransformPointY(x+w,y);

        var _x3 = this.m_oFullTransform.TransformPointX(x+w,y+h);
        var _y3 = this.m_oFullTransform.TransformPointY(x+w,y+h);

        var _x4 = this.m_oFullTransform.TransformPointX(x,y+h);
        var _y4 = this.m_oFullTransform.TransformPointY(x,y+h);

        this.Bounds.CheckPoint(_x1, _y1);
        this.Bounds.CheckPoint(_x2, _y2);
        this.Bounds.CheckPoint(_x3, _y3);
        this.Bounds.CheckPoint(_x4, _y4);
    },

    rect2 : function(x,y,w,h)
    {
        var _x1 = this.m_oFullTransform.TransformPointX(x,y);
        var _y1 = this.m_oFullTransform.TransformPointY(x,y);

        var _x2 = this.m_oFullTransform.TransformPointX(x+w,y);
        var _y2 = this.m_oFullTransform.TransformPointY(x+w,y);

        var _x3 = this.m_oFullTransform.TransformPointX(x+w,y-h);
        var _y3 = this.m_oFullTransform.TransformPointY(x+w,y-h);

        var _x4 = this.m_oFullTransform.TransformPointX(x,y-h);
        var _y4 = this.m_oFullTransform.TransformPointY(x,y-h);

        this.Bounds.CheckPoint(_x1, _y1);
        this.Bounds.CheckPoint(_x2, _y2);
        this.Bounds.CheckPoint(_x3, _y3);
        this.Bounds.CheckPoint(_x4, _y4);
    },

    TableRect : function(x,y,w,h)
    {
        this.rect(x, y, w, h);
    },

    // функции клиппирования
    AddClipRect : function(x, y, w, h)
    {
    },
    RemoveClipRect : function()
    {
    },

    SetClip : function(r)
    {
    },
    RemoveClip : function()
    {
    },

    SavePen : function()
    {
    },
    RestorePen : function()
    {
    },

    SaveBrush : function()
    {
    },
    RestoreBrush : function()
    {
    },

    SavePenBrush : function()
    {
    },
    RestorePenBrush : function()
    {
    },

    SaveGrState : function()
    {
    },
    RestoreGrState : function()
    {
    },

    StartClipPath : function()
    {
    },

    EndClipPath : function()
    {
    },

    CorrectBounds : function()
    {
        if (this.LineWidth != null)
        {
            var _correct = this.LineWidth / 2.0;

            this.Bounds.min_x -= _correct;
            this.Bounds.min_y -= _correct;
            this.Bounds.max_x += _correct;
            this.Bounds.max_y += _correct;
        }
    },

    CorrectBounds2 : function()
    {
        if (this.LineWidth != null)
        {
            var _correct = this.LineWidth * this.m_oCoordTransform.sx / 2;

            this.Bounds.min_x -= _correct;
            this.Bounds.min_y -= _correct;
            this.Bounds.max_x += _correct;
            this.Bounds.max_y += _correct;
        }
    },

    CheckLineWidth : function(shape)
    {
        if (!shape)
            return;
        var _ln = shape.pen;
        if (_ln != null && _ln.Fill != null && _ln.Fill.fill != null)
        {
            this.LineWidth = (_ln.w == null) ? 12700 : parseInt(_ln.w);
            this.LineWidth /= 36000.0;
        }
    },

    DrawLockObjectRect : function()
    {
    },

    DrawPresentationComment : function(type, x, y, w, h)
    {
        this.rect(x, y, w, h);
    }
};
//-----------------------------------------------------------------------------------
// ASC Classes
//-----------------------------------------------------------------------------------

function GetMinSnapDistanceXObject(pointX, arrGrObjects)
{
    var min_dx = null;
    var ret = null;
    for(var i = 0; i < arrGrObjects.length; ++i)
    {
        var cur_snap_arr_x = arrGrObjects[i].snapArrayX;
        var count = cur_snap_arr_x.length;
        for(var snap_index  = 0; snap_index < count; ++snap_index)
        {
            var dx = cur_snap_arr_x[snap_index] - pointX;
            if(min_dx === null)
            {
                ret = {dist: dx, pos: cur_snap_arr_x[snap_index]};
                min_dx = dx;
            }
            else
            {
                if(Math.abs(dx) < Math.abs(min_dx))
                {
                    min_dx = dx;
                    ret = {dist: dx, pos: cur_snap_arr_x[snap_index]};
                }
            }
        }
    }
    return ret;
}

function GetMinSnapDistanceYObject(pointY, arrGrObjects)
{
    var min_dy = null;
    var ret = null;
    for(var i = 0; i < arrGrObjects.length; ++i)
    {
        var cur_snap_arr_y = arrGrObjects[i].snapArrayY;
        var count = cur_snap_arr_y.length;
        for(var snap_index  = 0; snap_index < count; ++snap_index)
        {
            var dy = cur_snap_arr_y[snap_index] - pointY;
            if(min_dy === null)
            {
                min_dy = dy;
                ret = {dist: dy, pos: cur_snap_arr_y[snap_index]};
            }
            else
            {
                if(Math.abs(dy) < Math.abs(min_dy))
                {
                    min_dy = dy;
                    ret = {dist: dy, pos: cur_snap_arr_y[snap_index]};
                }
            }
        }
    }
    return ret;
}

function GetMinSnapDistanceXObjectByArrays(pointX, snapArrayX)
{
    var min_dx = null;
    var ret = null;
    var cur_snap_arr_x = snapArrayX;
    var count = cur_snap_arr_x.length;
    for(var snap_index  = 0; snap_index < count; ++snap_index)
    {
        var dx = cur_snap_arr_x[snap_index] - pointX;
        if(min_dx === null)
        {
            ret = {dist: dx, pos: cur_snap_arr_x[snap_index]};
            min_dx = dx;
        }
        else
        {
            if(Math.abs(dx) < Math.abs(min_dx))
            {
                min_dx = dx;
                ret = {dist: dx, pos: cur_snap_arr_x[snap_index]};
            }
        }
    }
    return ret;
}

function GetMinSnapDistanceYObjectByArrays(pointY, snapArrayY)
{
    var min_dy = null;
    var ret = null;
    var cur_snap_arr_y = snapArrayY;
    var count = cur_snap_arr_y.length;
    for(var snap_index  = 0; snap_index < count; ++snap_index)
    {
        var dy = cur_snap_arr_y[snap_index] - pointY;
        if(min_dy === null)
        {
            min_dy = dy;
            ret = {dist: dy, pos: cur_snap_arr_y[snap_index]};
        }
        else
        {
            if(Math.abs(dy) < Math.abs(min_dy))
            {
                min_dy = dy;
                ret = {dist: dy, pos: cur_snap_arr_y[snap_index]};
            }
        }
    }
    return ret;
}

function getAbsoluteRectBoundsObject(drawing)
{
    var transform = drawing.transform;
    var arrX = [], arrY = [];
    arrX.push(transform.TransformPointX(0, 0));
    arrX.push(transform.TransformPointX(drawing.extX, 0));
    arrX.push(transform.TransformPointX(drawing.extX, drawing.extY));
    arrX.push(transform.TransformPointX(0, drawing.extY));

    arrY.push(transform.TransformPointY(0, 0));
    arrY.push(transform.TransformPointY(drawing.extX, 0));
    arrY.push(transform.TransformPointY(drawing.extX, drawing.extY));
    arrY.push(transform.TransformPointY(0, drawing.extY));
    return {minX: Math.min.apply(Math, arrX), minY: Math.min.apply(Math, arrY), maxX: Math.max.apply(Math, arrX), maxY: Math.max.apply(Math, arrY)};
}

function getAbsoluteRectBoundsArr(aDrawings)
{
    var arrBounds = [], minX, minY, maxX, maxY, i, bounds;
    var summWidth = 0.0;
    var summHeight = 0.0;
    for(i = 0; i < aDrawings.length; ++i)
    {
        bounds = getAbsoluteRectBoundsObject(aDrawings[i]);
        arrBounds.push(bounds);
        if(i === 0)
        {
            minX = bounds.minX;
            minY = bounds.minY;
            maxX = bounds.maxX;
            maxY = bounds.maxY;
        }
        else
        {
            if(minX > bounds.minX)
            {
                minX = bounds.minX;
            }
            if(minY > bounds.minY)
            {
                minY = bounds.minY;
            }
            if(maxX < bounds.maxX)
            {
                maxX = bounds.maxX;
            }
            if(maxY < bounds.maxY)
            {
                maxY = bounds.maxY;
            }
        }
        summWidth += (bounds.maxX - bounds.minX);
        summHeight += (bounds.maxY - bounds.minY);
    }
    return {arrBounds: arrBounds, minX: minX, maxX: maxX, minY: minY, maxY: maxY, summWidth: summWidth, summHeight: summHeight};
}

function CalcLiterByLength(aAlphaBet, nLength)
{
    var modulo = nLength;
    var sResultLiter = '';
    while(modulo > 0)
    {
        sResultLiter = aAlphaBet[modulo%aAlphaBet.length] + sResultLiter;
        modulo = (modulo/aAlphaBet.length) >> 0;
    }
    return sResultLiter;
}




function CollectUniColor(oUniColor)
{
    if(!oUniColor || !oUniColor.color)
    {
        return 0;
    }
    var ret = [];
    var oColor = oUniColor.color;
    var oColorTypes = window['Asc'].c_oAscColor;
    ret.push(oColor.type);

    switch(oColor.type)
    {
        case oColorTypes.COLOR_TYPE_NONE:
        {
            break;
        }
        case oColorTypes.COLOR_TYPE_SRGB:
        {
            ret.push(((oColor.RGBA.R << 16) & 0xFF0000) + ((oColor.RGBA.G << 8) & 0xFF00) + oColor.RGBA.B);
            break;
        }
        case oColorTypes.COLOR_TYPE_PRST:
        case oColorTypes.COLOR_TYPE_SCHEME:
        case oColorTypes.COLOR_TYPE_SYS:
        {
            ret.push(oColor.id);
            break;
        }
    }
    if(!oUniColor.Mods)
    {
        ret.push(0);
    }
    else
    {
        var aMods = oUniColor.Mods.Mods;
        ret.push(aMods.length);
        for(var i = 0; i < aMods.length; ++ i)
        {
            ret.push([aMods[i].name, aMods[i].val]);
        }
    }
    return ret;
}


function CollectGs(oGs)
{
    if(!oGs)
    {
        return 0;
    }
    return [oGs.pos, CollectUniColor(oGs.color)];
}

function CreateGsFromParams(aParams, index, aBaseColors, bAccent1Background){
    if(!aParams){
        return null;
    }
    var oRet = new AscFormat.CGs();
    oRet.pos = aParams[0];
    oRet.color = CreateUniColorFromPreset(aParams[1], index, aBaseColors, bAccent1Background);
    return oRet;
}

function CollectSettingsUniFill(oUniFill)
{
    if(!oUniFill || !oUniFill.fill){
        return 0;
    }
    var ret = [];
    var oFill = oUniFill.fill;
    ret.push(oFill.type);
    ret.push(oUniFill.transparent);
    var oFillTypes = window['Asc'].c_oAscFill;
    switch(oFill.type)
    {
        case oFillTypes.FILL_TYPE_NONE:{
            break;
        }
        case oFillTypes.FILL_TYPE_BLIP:{
            ret.push(oFill.RasterImageId);
            break;
        }
        case oFillTypes.FILL_TYPE_NOFILL:{
            break;
        }
        case oFillTypes.FILL_TYPE_SOLID:{
            ret.push(CollectUniColor(oUniFill.fill.color));
            break;
        }
        case oFillTypes.FILL_TYPE_GRAD:{
            ret.push(oFill.lin ? [oFill.lin.angle, oFill.lin.scale] : 0);
            ret.push(oFill.path ? [] : 0);
            ret.push(oFill.rotateWithShape ? [] : 0);
            ret.push(oFill.colors.length);
            for(var i = 0; i < oFill.colors.length; ++i)
            {
                ret.push(CollectGs(oFill.colors[i]));
            }
            break;
        }
        case oFillTypes.FILL_TYPE_PATT:{
            ret.push(oFill.ftype);
            ret.push(CollectUniColor(oFill.fgClr));
            ret.push(CollectUniColor(oFill.bgClr));
            break;
        }
        case oFillTypes.FILL_TYPE_GRP:{
            break;
        }
    }
    return ret;
}


    function CreateUniColorFromPreset(aPreset, index, aBaseColors, bAccent1Background){
        if(!aPreset){
            return null;
        }
        var oRet = new AscFormat.CUniColor();
        var oColorTypes = window['Asc'].c_oAscColor;
        switch (aPreset[0]){
            case oColorTypes.COLOR_TYPE_NONE:
            {
                oRet.color =  new AscFormat.CRGBColor();
                break;
            }
            case oColorTypes.COLOR_TYPE_SRGB:
            {
                oRet.color =  new AscFormat.CRGBColor();
                oRet.color.RGBA.R = (aPreset[1] >> 16) & 0xFF;
                oRet.color.RGBA.G = (aPreset[1] >> 8) & 0xFF;
                oRet.color.RGBA.R = aPreset[1] & 0xFF;
                break;
            }
            case oColorTypes.COLOR_TYPE_PRST:
            {
                oRet.color = new AscFormat.CPrstColor();
                oRet.color.id = aPreset[1];
                break;
            }
            case oColorTypes.COLOR_TYPE_SCHEME:{
                oRet.color = new AscFormat.CSchemeColor();
                oRet.color.id = aPreset[1];
                if(AscFormat.isRealNumber(index) && Array.isArray(aBaseColors) && aBaseColors[index]){
                    if(aBaseColors[index].fill && aBaseColors[index].fill.color && aBaseColors[index].fill.color.color
                        && aBaseColors[index].fill.color.color.type === oColorTypes.COLOR_TYPE_SCHEME
                    &&  oRet.color.id === 0 && !bAccent1Background){
                        oRet.color.id = aBaseColors[index].fill.color.color.id;
                        if(aBaseColors[index].fill.color.Mods){
                            oRet.Mods = aBaseColors[index].fill.color.Mods.createDuplicate();
                        }
                    }
                }
                break;
            }
            case oColorTypes.COLOR_TYPE_SYS:
            {
                oRet.color = new AscFormat.CSysColor();
                oRet.color.id = aPreset[2];
                break;
            }
        }
        if(aPreset[2]){
            if(!oRet.Mods){
                oRet.Mods = new AscFormat.CColorModifiers();
            }
            for(var i = 0; i < aPreset[2]; ++i){
                var oMod = new AscFormat.CColorMod();
                oMod.name = aPreset[i + 3][0];
                oMod.val = aPreset[i + 3][1];
                oRet.Mods.Mods.push(oMod)
            }

        }
        return oRet;
    }


    function CreateUnifillFromPreset(aPreset, index, aBaseColors, bAccent1Background){
        var oRet = null;
        if(!aPreset){
            return oRet;
        }

        var oUnifill = new AscFormat.CUniFill();
        oUnifill.transparent = aPreset[1];
        var oFillTypes = window['Asc'].c_oAscFill;
        switch(aPreset[0]){
            case oFillTypes.FILL_TYPE_NONE:{
                oUnifill.fill = new AscFormat.CNoFill();
                break;
            }
            case oFillTypes.FILL_TYPE_BLIP:{
                oUnifill.fill =  new AscFormat.CBlipFill();
                oUnifill.fill.RasterImageId = aPreset[2];
                break;
            }
            case oFillTypes.FILL_TYPE_NOFILL:{
                oUnifill.fill = new AscFormat.CNoFill();
                break;
            }
            case oFillTypes.FILL_TYPE_SOLID:{
                oUnifill.fill =  new AscFormat.CSolidFill();
                oUnifill.fill.color = CreateUniColorFromPreset(aPreset[2], index, aBaseColors, bAccent1Background);
                break;
            }
            case oFillTypes.FILL_TYPE_GRAD:{
                oUnifill.fill = new AscFormat.CGradFill();
                if(aPreset[2]){
                    oUnifill.fill.lin = new AscFormat.GradLin();
                    oUnifill.fill.lin.angle = aPreset[2][0];
                    oUnifill.fill.lin.scale = aPreset[2][1];
                }
                if(Array.isArray(aPreset[3])){
                    oUnifill.fill.path = new AscFormat.GradPath();
                }
                if(Array.isArray(aPreset[4])){
                    oUnifill.fill.rotateWithShape = true;
                }
                for(var i = 0; i < aPreset[5]; ++i)
                {
                    oUnifill.fill.colors.push(CreateGsFromParams(aPreset[6+i], index, aBaseColors, bAccent1Background));
                }
                break;
            }
            case oFillTypes.FILL_TYPE_PATT:{
                oUnifill.fill = new AscFormat.CPattFill();
                oUnifill.fill.ftype = aPreset[2];
                oUnifill.fill.fgClr = CreateUniColorFromPreset(aPreset[3], index, aBaseColors, bAccent1Background);
                oUnifill.fill.bgClr = CreateUniColorFromPreset(aPreset[4], index, aBaseColors, bAccent1Background);
                break;
            }
            case oFillTypes.FILL_TYPE_GRP:{
                break;
            }
        }
        return oUnifill;
    }


function CollectSettingsLn(oLn)
{
    if(!oLn)
    {
        return 0;
    }
    var ret = [];
    ret.push(CollectSettingsUniFill(oLn.Fill));
    ret.push(oLn.prstDash);

    if(!oLn.Join)
    {
        ret.push(0);
    }
    else
    {
        ret.push([oLn.Join.type, oLn.Join.limit]);
    }

    if(oLn.headEnd)
    {
        ret.push([oLn.headEnd.type, oLn.headEnd.len, oLn.headEnd.w]);
    }
    else
    {
        ret.push(0);
    }

    if(oLn.tailEnd)
    {
        ret.push([oLn.tailEnd.type, oLn.tailEnd.len, oLn.tailEnd.w]);
    }
    else
    {
        ret.push(0);
    }
    ret.push(oLn.algn);
    ret.push(oLn.cap);
    ret.push(oLn.cmpd);
    ret.push(oLn.w);
    return ret;
}


function CollectSettingsSpPr(oSpPr)
{
    if(!oSpPr)
    {
        return 0;
    }
    return [CollectSettingsUniFill(oSpPr.Fill), CollectSettingsLn(oSpPr.ln)];

}

function CollectTextPr(oTxPr) {
    if(!oTxPr || !oTxPr.content || !oTxPr.content.Content[0].Pr || !oTxPr.content.Content[0].Pr.DefaultRunPr){
        return 0;
    }
    var oRet = [];
    var oTextPr = oTxPr.content.Content[0].Pr.DefaultRunPr;
    oRet.push(oTextPr.FontSize);
    oRet.push(oTextPr.Bold);
    oRet.push(oTextPr.Italic);
    oRet.push(CollectSettingsUniFill(oTextPr.Unifill));
    oRet.push(oTextPr.Caps);
    if(oTxPr.bodyPr){
        oRet.push([oTxPr.bodyPr.anchor, oTxPr.bodyPr.anchorCtr, oTxPr.bodyPr.rot, oTxPr.bodyPr.vert, oTxPr.bodyPr.horzOverflow, oTxPr.bodyPr.spcFirstLastPara, oTxPr.bodyPr.vertOverflow, oTxPr.bodyPr.wrap]);
    }
    else{
        oRet.push(0);
    }
    return oRet;
}

function CollectCatAxisPr(oAxis){
    var oRet = 0;
    if(!oAxis){
        return oRet;
    }
    oRet = [];
    oRet.push(CollectTextPr(oAxis.txPr));
    oRet.push(CollectSettingsSpPr(oAxis.spPr));
    oRet.push(CollectSettingsSpPr(oAxis.majorGridlines));
    oRet.push(CollectSettingsSpPr(oAxis.minorGridlines));
    oRet.push(oAxis.majorTickMark);
    oRet.push(oAxis.minorTickMark);
    oRet.push(oAxis.bDelete);
    oRet.push(oAxis.crossBetween);
    oRet.push(oAxis.crosses);
    return oRet;
}
function CollectValAxisPr(oAxis){
    var oRet = 0;
    if(!oAxis){
        return oRet;
    }
    oRet = [];
    oRet.push(CollectTextPr(oAxis.txPr));
    oRet.push(CollectSettingsSpPr(oAxis.spPr));
    oRet.push(CollectSettingsSpPr(oAxis.majorGridlines));
    oRet.push(CollectSettingsSpPr(oAxis.minorGridlines));
    oRet.push(oAxis.majorTickMark);
    oRet.push(oAxis.minorTickMark);
    oRet.push(oAxis.bDelete);
    oRet.push(oAxis.crossBetween);
    oRet.push(oAxis.crosses);
    return oRet;
}

function CollectLegendPr(oLegend){
    var oRet = 0;
    if(!oLegend){
        return oRet;
    }

    oRet = [];
    oRet.push(CollectTextPr(oLegend.txPr));
    oRet.push(CollectSettingsSpPr(oLegend.spPr));
    oRet.push(oLegend.legendPos);
    return oRet;
}


function CollectDLbls(oDlbls){
    var oRet = 0;
    if(!oDlbls){
        return oRet;
    }

    oRet = [];
    oRet.push(CollectTextPr(oDlbls.txPr));
    oRet.push(CollectSettingsSpPr(oDlbls.spPr));
    oRet.push(oDlbls.dLblPos);
    oRet.push(oDlbls.separator);
    oRet.push(oDlbls.showBubbleSize);
    oRet.push(oDlbls.showCatName);
    oRet.push(oDlbls.showLeaderLines);
    oRet.push(oDlbls.showLegendKey);
    oRet.push(oDlbls.showPercent);
    oRet.push(oDlbls.showSerName);
    oRet.push(oDlbls.showVal);
    return oRet;
}

function CollectMarker(oMarker){
    if(!oMarker){
        return 0;
    }
    return [oMarker.size, CollectSettingsSpPr(oMarker.spPr), oMarker.symbol];
}

function ApplyMarker(aPreset, oObject, index, aBaseColors){

    if(!oObject || !oObject.setMarker || (oObject instanceof AscFormat.CLineChart)){
        return;
    }
    if(!aPreset){
        oObject.setMarker(null);
        return;
    }
    if(!oObject.marker){
        oObject.setMarker(new AscFormat.CMarker());
    }
    oObject.marker.setSize(aPreset[0]);
    ApplySpPr(aPreset[1], oObject.marker, index, aBaseColors);
    oObject.marker.setSymbol(aPreset[2]);
    if(AscFormat.MARKER_SYMBOL_TYPE[0] === oObject.marker.symbol){
        oObject.marker.setSymbol(AscFormat.MARKER_SYMBOL_TYPE[index % 9]);
    }
}

function CollectSettingsFromChart(oChartSpace)
{
    var oRet = [];
    if(!oChartSpace){
        return oRet;
    }
    oRet.push(oChartSpace.style);
    oRet.push(CollectSettingsSpPr(oChartSpace.spPr));
    oRet.push(CollectTextPr(oChartSpace.txPr));
    if(oChartSpace.chart.title){
        oRet.push(CollectSettingsSpPr(oChartSpace.chart.title.spPr));
        oRet.push(CollectTextPr(oChartSpace.chart.title.txPr));
    }
    else{
        oRet.push(0);
        oRet.push(0);
    }
    oRet.push(CollectLegendPr(oChartSpace.chart.legend));
    if(oChartSpace.chart.plotArea){
        var oPlotArea = oChartSpace.chart.plotArea;
        oRet.push(CollectSettingsSpPr(oPlotArea.spPr));
        oRet.push(CollectTextPr(oPlotArea.txPr));
        var oValAxData = 0, oCatAxData = 0;
        for(var i = 0;  i < oPlotArea.axId.length; ++i){
            if(oPlotArea.axId[i].getObjectType() === AscDFH.historyitem_type_CatAx
            || oPlotArea.axId[i].getObjectType() === AscDFH.historyitem_type_DateAx
            || oPlotArea.axId[i].getObjectType() === AscDFH.historyitem_type_SerAx){
                oCatAxData = CollectCatAxisPr(oPlotArea.axId[i]);
            }
            if(oPlotArea.axId[i].getObjectType() === AscDFH.historyitem_type_ValAx ){
                oValAxData = CollectValAxisPr(oPlotArea.axId[i]);
            }

        }
        oRet.push(oCatAxData);
        oRet.push(oValAxData);
        var oChart = oPlotArea.charts[0];
        oRet.push(CollectDLbls(oChart.dLbls));
        if(oChart.getObjectType() === AscDFH.historyitem_type_PieChart || oChart.getObjectType() === AscDFH.historyitem_type_DoughnutChart){
            oRet.push(CollectSettingsSpPr(oChart.series[0] && oChart.series[0].dPt[0] && oChart.series[0].dPt[0].spPr));
        }
        else{
            oRet.push(CollectSettingsSpPr(oChart.series[0] && oChart.series[0].spPr));
        }

        if(oChart.getObjectType() === AscDFH.historyitem_type_PieChart || oChart.getObjectType() === AscDFH.historyitem_type_DoughnutChart){
            if(oChart.series[0] && oChart.series[0].dLbls && oChart.series[0].dLbls.dLbl[0]){
                oRet.push(CollectDLbls(oChart.series[0].dLbls && oChart.series[0].dLbls.dLbl[0] && oChart.series[0].dLbls.dLbl[0]));
            }
            else{
                oRet.push(CollectDLbls(oChart.series[0] && oChart.series[0].dLbls));
            }

        }
        else{
            oRet.push(CollectDLbls(oChart.series[0] && oChart.series[0].dLbls));
        }


        oRet.push(oChart.gapWidth);
        oRet.push(oChart.overlap);
        oRet.push(oChart.gapDepth);
        oRet.push(oChart.grouping);
        if(oChartSpace.chart.view3D){
            var oView3D = oChartSpace.chart.view3D;
            oRet.push([oView3D.depthPercent, oView3D.hPercent, oView3D.perspective, oView3D.rAngAx, oView3D.rotX, oView3D.rotY]);
        }
        else{
            oRet.push(0);
        }
    }
    else{
        oRet.push(0);
    }

    if(oChartSpace.chart.backWall){
        oRet.push([CollectSettingsSpPr(oChartSpace.chart.backWall.spPr), oChartSpace.chart.backWall.thickness]);
    }
    else{
        oRet.push(0);
    }

    if(oChartSpace.chart.floor){
        oRet.push([CollectSettingsSpPr(oChartSpace.chart.floor.spPr), oChartSpace.chart.floor.thickness]);
    }
    else{
        oRet.push(0);
    }

    if(oChartSpace.chart.sideWall){
        oRet.push([CollectSettingsSpPr(oChartSpace.chart.sideWall.spPr), oChartSpace.chart.sideWall.thickness]);
    }
    else{
        oRet.push(0);
    }
    oRet.push(CollectMarker(oChart.marker));
    oRet.push(CollectMarker(oChart.series[0] && oChart.series[0].marker));
    oRet.push(CollectSettingsSpPr(oChart.hiLowLines));
    if(oChart.upDownBars){
        oRet.push([CollectSettingsSpPr(oChart.upDownBars.downBars), oChart.upDownBars.gapWidth, CollectSettingsSpPr(oChart.upDownBars.upBars)]);
    }
    else{
        oRet.push(0);
    }
    return oRet;
}

function CreateLnFromPreset(aPreset, index, aBaseColors, bAccent1Background){
    var oRet = null;
    if(!aPreset){
        return oRet;
    }
    var oLn = new AscFormat.CLn();
    oLn.Fill = CreateUnifillFromPreset(aPreset[0], index, aBaseColors, bAccent1Background);
    oLn.prstDash = aPreset[1];
    if(aPreset[2]){
        oLn.Join = new AscFormat.LineJoin();
        oLn.Join.type = aPreset[2][0];
        oLn.Join.limit = aPreset[2][1];
    }
    if(aPreset[3]){
        oLn.headEnd = new AscFormat.EndArrow();
        oLn.headEnd.type = aPreset[3][0];
        oLn.headEnd.len = aPreset[3][1];
        oLn.headEnd.w = aPreset[3][2];
    }
    if(aPreset[4]){
        oLn.headEnd = new AscFormat.EndArrow();
        oLn.headEnd.type = aPreset[4][0];
        oLn.headEnd.len = aPreset[4][1];
        oLn.headEnd.w = aPreset[4][2];
    }
    oLn.algn = aPreset[5];
    oLn.cap = aPreset[6];
    oLn.cmpd = aPreset[7];
    oLn.w = aPreset[8];
    return oLn;
}

function ApplySpPr(aSpPrPr, oObject, index, aBaseColors, bAccent1Background){
    if(!aSpPrPr){
        if(oObject.spPr && oObject.spPr.xfrm){
            oObject.spPr.setFill(null);
            oObject.spPr.setLn(null);
            return
        }
        oObject.setSpPr(null);
        return;
    }
    if(!oObject.spPr){
        oObject.setSpPr(new AscFormat.CSpPr());
    }
    oObject.spPr.setParent(oObject);
    oObject.spPr.setFill(CreateUnifillFromPreset(aSpPrPr[0], index, aBaseColors, bAccent1Background));
    oObject.spPr.setLn(CreateLnFromPreset(aSpPrPr[1], index, aBaseColors, bAccent1Background));
}

function ApplyTxPr(aTextPr, oObject, oDrawingDocument, i, baseFills, bAccent1Background){
    if(!aTextPr){
        return;
    }
    if(!oObject.txPr){
        oObject.setTxPr(AscFormat.CreateTextBodyFromString("", oDrawingDocument, oObject));
    }
    var Pr = oObject.txPr.content.Content[0].Pr.Copy();
    if(!Pr.DefaultRunPr){
        Pr.DefaultRunPr = new CTextPr();
    }
    Pr.DefaultRunPr.FontSize = aTextPr[0];
    Pr.DefaultRunPr.Bold = aTextPr[1];
    Pr.DefaultRunPr.Italic = aTextPr[2];
    Pr.DefaultRunPr.Unifill = CreateUnifillFromPreset(aTextPr[3], i, baseFills, bAccent1Background);
    Pr.DefaultRunPr.Caps = aTextPr[4];
    oObject.txPr.content.Content[0].Set_Pr(Pr);
    if(aTextPr[5]){
        var oBodyPr = new AscFormat.CBodyPr();
        oBodyPr.anchor = aTextPr[5][0];
        oBodyPr.anchorCtr = aTextPr[5][1];
        oBodyPr.rot = aTextPr[5][2];
        oBodyPr.vert = aTextPr[5][3];
        oBodyPr.horzOverflow = aTextPr[5][4];
        oBodyPr.spcFirstLastPara = aTextPr[5][5];
        oBodyPr.vertOverflow = aTextPr[5][6];
        oBodyPr.wrap = aTextPr[5][7];
        oObject.txPr.setBodyPr(oBodyPr);
    }
}

function ApplyPropsToCatAxis(aPr, oAxis, oDrawingDocument, bCreate){
    if(!aPr){
        return;
    }
    ApplyTxPr(aPr[0], oAxis, oDrawingDocument);
    ApplySpPr(aPr[2], oAxis);
    if(oAxis.spPr){
        if(!bCreate || oAxis.majorGridlines){
            oAxis.setMajorGridlines(oAxis.spPr);
        }
        oAxis.setSpPr(null);
    }
    else{
        if(!bCreate){
            oAxis.setMajorGridlines(null);
        }
    }
    ApplySpPr(aPr[3], oAxis);
    if(oAxis.spPr){
        if(!bCreate || oAxis.minorGridlines){
            oAxis.setMinorGridlines(oAxis.spPr);
        }
        oAxis.setSpPr(null);
    }
    else{
        if(!bCreate){
            oAxis.setMinorGridlines(null);
        }
    }
    ApplySpPr(aPr[1], oAxis);

    if(!bCreate){
        oAxis.setMajorTickMark(aPr[4]);
        oAxis.setMinorTickMark(aPr[5]);
        oAxis.setDelete(aPr[6]);
        if(aPr.length > 7){
            oAxis.setCrossBetween && oAxis.setCrossBetween(aPr[7]);
            oAxis.setCrosses && oAxis.setCrosses(aPr[8]);
        }
    }
}
function ApplyPropsToValAxis(aPr, oAxis, oDrawingDocument, bCreate){
    if(!aPr){
        return;
    }
    ApplyTxPr(aPr[0], oAxis, oDrawingDocument);
    ApplySpPr(aPr[2], oAxis);
    if(oAxis.spPr){
        if(!bCreate || oAxis.majorGridlines){
            oAxis.setMajorGridlines(oAxis.spPr);
        }
        oAxis.setSpPr(null);
    }
    else{
        if(!bCreate){
            oAxis.setMajorGridlines(null);
        }
    }
    ApplySpPr(aPr[3], oAxis);
    if(oAxis.spPr){
        if(!bCreate || oAxis.minorGridlines){
            oAxis.setMinorGridlines(oAxis.spPr);
        }
        oAxis.setSpPr(null);
    }
    else {
        if(!bCreate){
            oAxis.setMinorGridlines(null);
        }
    }
    ApplySpPr(aPr[1], oAxis);
    if(!bCreate){
        oAxis.setMajorTickMark(aPr[4]);
        oAxis.setMinorTickMark(aPr[5]);
        oAxis.setDelete(aPr[6]);
        if(aPr.length > 7){
            oAxis.setCrossBetween && oAxis.setCrossBetween(aPr[7]);
            oAxis.setCrosses && oAxis.setCrosses(aPr[8]);
        }
    }
}

function ApplyLegendProps(aPr, oLegend, oDrawingDocument, bCreate){
    if(!aPr || !oLegend){
        return;
    }
    ApplyTxPr(aPr[0], oLegend, oDrawingDocument);
    ApplySpPr(aPr[1], oLegend);
    if(!bCreate){
        oLegend.setLegendPos(aPr[2]);
    }
    oLegend.setLayout(null);
}

function ApplyDLblsProps(aPr, oObj, oDrawingDocument, i, baseFills, bCreate){
    if(!aPr || !oObj){
        if(oObj){
            oObj.setDLbls(null);
        }
        return;
    }
    //if(!bCreate)
    {
        if(!oObj.dLbls){
            oObj.setDLbls(new AscFormat.CDLbls());
        }
    }
    if(oObj.dLbls){
        var lbls = oObj.dLbls;
        lbls.setParent(oObj);
        if(oObj.dLbls.bDelete){
            if(oObj.dLbls.setDelete){
                oObj.dLbls.setDelete(false);
            }
        }

        ApplyTxPr(aPr[0], lbls, oDrawingDocument, i, baseFills);
        ApplySpPr(aPr[1], lbls, i, baseFills);
        //if(!bCreate)
        {
            lbls.setDLblPos(aPr[2]);
            lbls.setSeparator(aPr[3]);
            lbls.setShowBubbleSize(aPr[4]);
            lbls.setShowCatName(aPr[5]);
            lbls.setShowLeaderLines(aPr[6]);
            lbls.setShowLegendKey(aPr[7]);
            lbls.setShowPercent(aPr[8]);
            lbls.setShowSerName(aPr[9]);
            lbls.setShowVal(aPr[10]);
        }
    }
}
function ApplyPresetToChartSpace(oChartSpace, aPreset, bCreate){
    var oDrawingDocument = oChartSpace.getDrawingDocument();
    oChartSpace.setStyle(aPreset[0]);
    ApplySpPr(aPreset[1], oChartSpace);
    ApplyTxPr(aPreset[2], oChartSpace, oDrawingDocument);
    var bAccent1Background = false;
    if(oChartSpace.spPr && oChartSpace.spPr.Fill && oChartSpace.spPr.Fill.fill && oChartSpace.spPr.Fill.fill.color && oChartSpace.spPr.Fill.fill.color.color
        && oChartSpace.spPr.Fill.fill.color.color.type === window['Asc'].c_oAscColor.COLOR_TYPE_SCHEME &&  oChartSpace.spPr.Fill.fill.color.color.id === 0){
        bAccent1Background = true;
    }
    if(bCreate && !oChartSpace.chart.title){
        oChartSpace.chart.setTitle(new AscFormat.CTitle());
        oChartSpace.chart.title.setOverlay(false);
    }
    if(oChartSpace.chart.title){
        ApplySpPr(aPreset[3], oChartSpace.chart.title);
        ApplyTxPr(aPreset[4], oChartSpace.chart.title, oDrawingDocument);
        if(oChartSpace.chart.title.layout){
            oChartSpace.chart.title.setLayout(null);
        }
    }


    var style = AscFormat.CHART_STYLE_MANAGER.getStyleByIndex(aPreset[0]);

    if(!aPreset[5] && !bCreate){
        oChartSpace.chart.setLegend(null);
    }
    else{
        if(!bCreate && aPreset[5]){
            // if(!oChartSpace.chart.legend){
            //     oChartSpace.chart.setLegend(new AscFormat.CLegend());
            // }
            oChartSpace.chart.legend && oChartSpace.chart.legend.setOverlay(false);
        }
    }
    ApplyLegendProps(aPreset[5], oChartSpace.chart.legend, oDrawingDocument, bCreate);

    var oPlotArea = oChartSpace.chart.plotArea;
    if(oPlotArea.layout){
        oPlotArea.setLayout(null);
    }
    ApplySpPr(aPreset[6], oPlotArea);
    ApplyTxPr(aPreset[7], oPlotArea, oDrawingDocument);
    var oAxisByTypes = oPlotArea.getAxisByTypes();
    for(var i = 0; i < oAxisByTypes.catAx.length; ++i){
        ApplyPropsToCatAxis(aPreset[8], oAxisByTypes.catAx[i], oDrawingDocument, bCreate);
    }
    for(i = 0; i < oAxisByTypes.valAx.length; ++i){
        ApplyPropsToValAxis(aPreset[9], oAxisByTypes.valAx[i], oDrawingDocument, bCreate);
    }

    var oChart = oPlotArea.charts[0], base_fills;
    var ser, lit = null, val = null;
    ApplyDLblsProps(aPreset[10], oChart, oDrawingDocument, undefined, undefined, bCreate);
    for(i = 0; i < oChart.series.length; ++i){
        lit = null;
        ser = oChart.series[i];
        val = ser.val || ser.yVal;
        var pts = AscFormat.getPtsFromSeries(ser);
        if(val){
            if(val.numRef && val.numRef.numCache)
            {
                lit = val.numRef.numCache;
            }
            else if(val.numLit)
            {
                lit = val.numLit;
            }
        }
        var ptCount;
        if(lit && AscFormat.isRealNumber(lit.ptCount)){
            ptCount = Math.max(lit.ptCount, AscFormat.getMaxIdx(pts));
        }
        else{
            ptCount = AscFormat.getMaxIdx(pts);
        }

        var oDPt;
        if(oChart.getObjectType() === AscDFH.historyitem_type_PieChart || oChart.getObjectType() === AscDFH.historyitem_type_DoughnutChart){
            base_fills = AscFormat.getArrayFillsFromBase(style.fill2, ptCount);
            for(j = 0; j < ptCount; ++j){
                oDPt = null;
                if(oChart.series[i].getDptByIdx){
                    oDPt = oChart.series[i].getDptByIdx(j);
                }
                if(!oDPt){
                    oDPt = new AscFormat.CDPt();
                    oDPt.setIdx(j);
                    oChart.series[i].addDPt(oDPt);
                }
                if(oDPt.bubble3D !== false){
                    oDPt.setBubble3D(false);
                }
                ApplySpPr(aPreset[11], oDPt, j, base_fills, bAccent1Background);

            }
            for (j = 0; j < oChart.series[i].dPt.length; ++j ){
                if(oChart.series[i].dPt[j].idx >= ptCount){
                    oChart.series[i].removeDPt(j);
                }
            }
        }
        else{
            for(var j = oChart.series[i].dPt.length - 1; j > -1; --j){
                oChart.series[i].removeDPt(j);
            }
            base_fills = AscFormat.getArrayFillsFromBase(style.fill2, oChart.series.length);
            ApplySpPr(aPreset[11], oChart.series[i], i, base_fills, bAccent1Background);
        }
        if(oChart.getObjectType() === AscDFH.historyitem_type_PieChart || oChart.getObjectType() === AscDFH.historyitem_type_DoughnutChart){
            ApplyDLblsProps(aPreset[12], oChart.series[i], oDrawingDocument, i, base_fills, true);
            if(oChart.series[i].dLbls){
                for(var j = 0; j < ptCount; ++j){
                    var oDLbl = oChart.series[i].dLbls.findDLblByIdx(j);
                    if(!oDLbl) {
                        oDLbl = new AscFormat.CDLbl();
                        oChart.series[i].dLbls.addDLbl(oDLbl);
                        oDLbl.setIdx(j);
                    }
                    ApplyTxPr(aPreset[12][0], oDLbl, oDrawingDocument, j, base_fills, bAccent1Background);
                    ApplySpPr(aPreset[12][1], oDLbl, j, base_fills, bAccent1Background);
                    oDLbl.setDLblPos(aPreset[12][2]);
                    oDLbl.setSeparator(aPreset[12][3]);
                    oDLbl.setShowBubbleSize(aPreset[12][4]);
                    oDLbl.setShowCatName(aPreset[12][5]);
                    oDLbl.setShowLegendKey(aPreset[12][7]);
                    oDLbl.setShowPercent(aPreset[12][8]);
                    oDLbl.setShowSerName(aPreset[12][9]);
                    oDLbl.setShowVal(aPreset[12][10]);
                }
            }
        }
        else{
            ApplyDLblsProps(aPreset[12], oChart.series[i], oDrawingDocument, i, base_fills, true);
        }
    }


    if(oChart.getObjectType() === AscDFH.historyitem_type_PieChart || oChart.getObjectType() === AscDFH.historyitem_type_DoughnutChart){
        oChart.setVaryColors(true);
    }
    else{
        if(oChart.setVaryColors){
            oChart.setVaryColors(false);
        }
    }

    if(oChart.setGapWidth){
        oChart.setGapWidth(aPreset[13]);
    }
    if(oChart.setOverlap){
        oChart.setOverlap(aPreset[14]);
    }
    if(oChart.setGapDepth){
        oChart.setGapDepth(aPreset[15]);
    }
    if(oChart.setGrouping){
        oChart.setGrouping(aPreset[16]);
    }

    if(aPreset[17]){
        if(!oChartSpace.chart.view3D){
            oChartSpace.chart.setView3D(new AscFormat.CView3d());
        }
        oChartSpace.chart.view3D.setDepthPercent(aPreset[17][0]);
        oChartSpace.chart.view3D.setHPercent(aPreset[17][1]);
        oChartSpace.chart.view3D.setPerspective(aPreset[17][2]);
        oChartSpace.chart.view3D.setRAngAx(aPreset[17][3]);
        oChartSpace.chart.view3D.setRotX(aPreset[17][4]);
        oChartSpace.chart.view3D.setRotY(aPreset[17][5]);
    }
    else{
        oChartSpace.chart.setView3D(null);
    }
    if(aPreset[18]){
        if(!oChartSpace.chart.backWall){
            oChartSpace.chart.setBackWall(new AscFormat.CChartWall());
        }
        ApplySpPr(aPreset[18][0], oChartSpace.chart.backWall);
        oChartSpace.chart.backWall.setThickness(aPreset[18][1]);
    }
    else{
        oChartSpace.chart.setBackWall(null);
    }

    if(aPreset[19]){
        if(!oChartSpace.chart.floor){
            oChartSpace.chart.setFloor(new AscFormat.CChartWall());
        }
        ApplySpPr(aPreset[19][0], oChartSpace.chart.floor);
        oChartSpace.chart.floor.setThickness(aPreset[19][1]);
    }
    else{
        oChartSpace.chart.setFloor(null);
    }

    if(aPreset[20]){
        if(!oChartSpace.chart.sideWall){
            oChartSpace.chart.setSideWall(new AscFormat.CChartWall());
        }
        ApplySpPr(aPreset[20][0], oChartSpace.chart.sideWall);
        oChartSpace.chart.sideWall.setThickness(aPreset[20][1]);
    }
    else{
        oChartSpace.chart.setSideWall(null);
    }
    ApplyMarker(aPreset[21], oChart);
    for(var i = 0; i < oChart.series.length; ++i){
        ApplyMarker(aPreset[22], oChart.series[i], i, base_fills, bCreate);
    }


    if(oChart.getObjectType() === AscDFH.historyitem_type_StockChart){
        var oSpPr = oChartSpace.spPr;
        if(oChart.hiLowLines){
            oChartSpace.spPr = oChart.hiLowLines;
            ApplySpPr(aPreset[23], oChartSpace);
        }
        else{
            oChartSpace.spPr = new AscFormat.CSpPr();
            ApplySpPr(aPreset[23], oChartSpace);
            oChart.setHiLowLines(oChartSpace.spPr);
        }

        if(!aPreset[24]){
            oChart.setUpDownBars(null);
        }
        else{
            if(!oChart.upDownBars){
                oChart.setUpDownBars(new AscFormat.CUpDownBars());
            }

            if(oChart.upDownBars.downBars){
                oChartSpace.spPr = oChart.upDownBars.downBars;
                ApplySpPr(aPreset[24][0], oChartSpace);
            }
            else{
                oChartSpace.spPr = new AscFormat.CSpPr();
                ApplySpPr(aPreset[24][0], oChartSpace);
                oChart.upDownBars.setDownBars(oChartSpace.spPr);
            }

            oChart.upDownBars.setGapWidth(aPreset[24][1]);

            if(oChart.upDownBars.upBars){
                oChartSpace.spPr = oChart.upDownBars.upBars;
                ApplySpPr(aPreset[24][2], oChartSpace);
            }
            else{
                oChartSpace.spPr = new AscFormat.CSpPr();
                ApplySpPr(aPreset[24][2], oChartSpace);
                oChart.upDownBars.setUpBars(oChartSpace.spPr);
            }
        }
        oChartSpace.spPr = oSpPr;
    }
}
    function CMathPainter(_api)
    {
        this.Api = _api;

        this.StartLoad = function ()
        {
            var loader = AscCommon.g_font_loader;
            var fontinfo = g_fontApplication.GetFontInfo("Cambria Math");
            if (undefined === fontinfo)
            {
                // нет Cambria Math - нет и формул
                return;
            }

            var isasync = loader.LoadFont(fontinfo, this.Api.asyncFontEndLoaded_MathDraw, this);

            if (false === isasync)
            {
                this.Generate();
            }
        };

        this.Generate2 = function ()
        {
            // GENERATE IMAGES & JSON
            var bTurnOnId = false;
            if (false === g_oTableId.m_bTurnOff)
            {
                g_oTableId.m_bTurnOff = true;
                bTurnOnId = true;
            }

            History.TurnOff();

            var _math = new AscCommon.CAscMathCategory();

            var _canvas = document.createElement('canvas');

            var _sizes =
                [
                    {w: 25, h: 25}, // Symbols
                    {w: 50, h: 50}, // Fraction
                    {w: 50, h: 50}, // Script
                    {w: 115, h: 55}, // Radical
                    {w: 60, h: 60}, // Integral
                    {w: 100, h: 75}, // LargeOperator
                    {w: 80, h: 75}, // Bracket, //{ w : 150, h : 75 }
                    {w: 100, h: 50}, // Function
                    {w: 100, h: 40}, // Accent
                    {w: 100, h: 60}, // LimitLog
                    {w: 60, h: 40}, // Operator
                    {w: 100, h: 70} // Matrix
                ];

            var _excluded_arr = [c_oAscMathType.Bracket_Custom_5];
            var _excluded_obj = {};
            for (var k = 0; k < _excluded_arr.length; k++)
            {
                _excluded_obj["" + _excluded_arr[k]] = true;
            }

            var _types = [];
            for (var _name in c_oAscMathType)
            {
                if (_excluded_obj["" + c_oAscMathType[_name]] !== undefined)
                    continue;

                _types.push(c_oAscMathType[_name]);
            }
            _types.sort(function (a, b)
            {
                return a - b;
            });

            var raster_koef = 1;

            // retina
            //raster_koef = 2;

            // CREATE image!!!
            var _total_image = new AscFonts.CRasterHeapTotal();
            _total_image.CreateFirstChuck(1500 * raster_koef, 5000 * raster_koef);

            _total_image.Chunks[0].FindOnlyEqualHeight = true;
            _total_image.Chunks[0].CanvasCtx.globalCompositeOperation = "source-over";

            var _types_len = _types.length;
            for (var t = 0; t < _types_len; t++)
            {
                var _type = _types[t];
                var _category1 = (_type >> 24) & 0xFF;
                var _category2 = (_type >> 16) & 0xFF;
                _type &= 0xFFFF;

                if (undefined == _math.Data[_category1])
                {
                    _math.Data[_category1] = new AscCommon.CAscMathCategory();
                    _math.Data[_category1].Id = _category1;

                    _math.Data[_category1].W = _sizes[_category1].w;
                    _math.Data[_category1].H = _sizes[_category1].h;
                }

                if (undefined == _math.Data[_category1].Data[_category2])
                {
                    _math.Data[_category1].Data[_category2] = new AscCommon.CAscMathCategory();
                    _math.Data[_category1].Data[_category2].Id = _category2;

                    _math.Data[_category1].Data[_category2].W = _sizes[_category1].w;
                    _math.Data[_category1].Data[_category2].H = _sizes[_category1].h;
                }

                var _menuType = new AscCommon.CAscMathType();
                _menuType.Id = _types[t];

                var _paraMath = new ParaMath();
                _paraMath.Root.Load_FromMenu(_menuType.Id);
                _paraMath.Root.Correct_Content(true);

                _paraMath.MathToImageConverter(false, _canvas, _sizes[_category1].w, _sizes[_category1].h, raster_koef);

                var _place = _total_image.Alloc(_canvas.width, _canvas.height);
                var _x = _place.Line.Height * _place.Index;
                var _y = _place.Line.Y;

                _menuType.X = _x;
                _menuType.Y = _y;

                _math.Data[_category1].Data[_category2].Data.push(_menuType);

                _total_image.Chunks[0].CanvasCtx.drawImage(_canvas, _x, _y);
            }

            var _total_w = _total_image.Chunks[0].CanvasImage.width;
            var _total_h = _total_image.Chunks[0].LinesFree[0].Y;

            var _total_canvas = document.createElement('canvas');
            _total_canvas.width = _total_w;
            _total_canvas.height = _total_h;
            _total_canvas.getContext('2d').drawImage(_total_image.Chunks[0].CanvasImage, 0, 0);

            var _url_total = _total_canvas.toDataURL("image/png");
            var _json_formulas = JSON.stringify(_math);

            _canvas = null;

            if (true === bTurnOnId)
                g_oTableId.m_bTurnOff = false;

            History.TurnOn();

            this.Api.sendMathTypesToMenu(_math);
        };

        this.Generate = function ()
        {
            var _math_json = JSON.parse('{"Id":0,"Data":[{"Id":0,"Data":[{"Id":0,"Data":[{"Id":0,"X":0,"Y":0},{"Id":1,"X":25,"Y":0},{"Id":2,"X":50,"Y":0},{"Id":3,"X":75,"Y":0},{"Id":4,"X":100,"Y":0},{"Id":5,"X":125,"Y":0},{"Id":6,"X":150,"Y":0},{"Id":7,"X":175,"Y":0},{"Id":8,"X":200,"Y":0},{"Id":9,"X":225,"Y":0},{"Id":10,"X":250,"Y":0},{"Id":11,"X":275,"Y":0},{"Id":12,"X":300,"Y":0},{"Id":13,"X":325,"Y":0},{"Id":14,"X":350,"Y":0},{"Id":15,"X":375,"Y":0},{"Id":16,"X":400,"Y":0},{"Id":17,"X":425,"Y":0},{"Id":18,"X":450,"Y":0},{"Id":19,"X":475,"Y":0},{"Id":20,"X":500,"Y":0},{"Id":21,"X":525,"Y":0},{"Id":22,"X":550,"Y":0},{"Id":23,"X":575,"Y":0},{"Id":24,"X":600,"Y":0},{"Id":25,"X":625,"Y":0},{"Id":26,"X":650,"Y":0},{"Id":27,"X":675,"Y":0},{"Id":28,"X":700,"Y":0},{"Id":29,"X":725,"Y":0},{"Id":30,"X":750,"Y":0},{"Id":31,"X":775,"Y":0},{"Id":32,"X":800,"Y":0},{"Id":33,"X":825,"Y":0},{"Id":34,"X":850,"Y":0},{"Id":35,"X":875,"Y":0},{"Id":36,"X":900,"Y":0},{"Id":37,"X":925,"Y":0},{"Id":38,"X":950,"Y":0},{"Id":39,"X":975,"Y":0},{"Id":40,"X":1000,"Y":0},{"Id":41,"X":1025,"Y":0},{"Id":42,"X":1050,"Y":0},{"Id":43,"X":1075,"Y":0},{"Id":44,"X":1100,"Y":0},{"Id":45,"X":1125,"Y":0},{"Id":46,"X":1150,"Y":0},{"Id":47,"X":1175,"Y":0},{"Id":48,"X":1200,"Y":0},{"Id":49,"X":1225,"Y":0},{"Id":50,"X":1250,"Y":0},{"Id":51,"X":1275,"Y":0},{"Id":52,"X":1300,"Y":0},{"Id":53,"X":1325,"Y":0},{"Id":54,"X":1350,"Y":0},{"Id":55,"X":1375,"Y":0}],"W":25,"H":25},{"Id":1,"Data":[{"Id":65536,"X":1400,"Y":0},{"Id":65537,"X":1425,"Y":0},{"Id":65538,"X":1450,"Y":0},{"Id":65539,"X":1475,"Y":0},{"Id":65540,"X":0,"Y":25},{"Id":65541,"X":25,"Y":25},{"Id":65542,"X":50,"Y":25},{"Id":65543,"X":75,"Y":25},{"Id":65544,"X":100,"Y":25},{"Id":65545,"X":125,"Y":25},{"Id":65546,"X":150,"Y":25},{"Id":65547,"X":175,"Y":25},{"Id":65548,"X":200,"Y":25},{"Id":65549,"X":225,"Y":25},{"Id":65550,"X":250,"Y":25},{"Id":65551,"X":275,"Y":25},{"Id":65552,"X":300,"Y":25},{"Id":65553,"X":325,"Y":25},{"Id":65554,"X":350,"Y":25},{"Id":65555,"X":375,"Y":25},{"Id":65556,"X":400,"Y":25},{"Id":65557,"X":425,"Y":25},{"Id":65558,"X":450,"Y":25},{"Id":65559,"X":475,"Y":25},{"Id":65560,"X":500,"Y":25},{"Id":65561,"X":525,"Y":25},{"Id":65562,"X":550,"Y":25},{"Id":65563,"X":575,"Y":25},{"Id":65564,"X":600,"Y":25},{"Id":65565,"X":625,"Y":25}],"W":25,"H":25},{"Id":2,"Data":[{"Id":131072,"X":650,"Y":25},{"Id":131073,"X":675,"Y":25},{"Id":131074,"X":700,"Y":25},{"Id":131075,"X":725,"Y":25},{"Id":131076,"X":750,"Y":25},{"Id":131077,"X":775,"Y":25},{"Id":131078,"X":800,"Y":25},{"Id":131079,"X":825,"Y":25},{"Id":131080,"X":850,"Y":25},{"Id":131081,"X":875,"Y":25},{"Id":131082,"X":900,"Y":25},{"Id":131083,"X":925,"Y":25},{"Id":131084,"X":950,"Y":25},{"Id":131085,"X":975,"Y":25},{"Id":131086,"X":1000,"Y":25},{"Id":131087,"X":1025,"Y":25},{"Id":131088,"X":1050,"Y":25},{"Id":131089,"X":1075,"Y":25},{"Id":131090,"X":1100,"Y":25},{"Id":131091,"X":1125,"Y":25},{"Id":131092,"X":1150,"Y":25},{"Id":131093,"X":1175,"Y":25},{"Id":131094,"X":1200,"Y":25},{"Id":131095,"X":1225,"Y":25}],"W":25,"H":25}],"W":25,"H":25},{"Id":1,"Data":[{"Id":0,"Data":[{"Id":16777216,"X":0,"Y":50},{"Id":16777217,"X":50,"Y":50},{"Id":16777218,"X":100,"Y":50},{"Id":16777219,"X":150,"Y":50}],"W":50,"H":50},{"Id":1,"Data":[{"Id":16842752,"X":200,"Y":50},{"Id":16842753,"X":250,"Y":50},{"Id":16842754,"X":300,"Y":50},{"Id":16842755,"X":350,"Y":50},{"Id":16842756,"X":400,"Y":50}],"W":50,"H":50}],"W":50,"H":50},{"Id":2,"Data":[{"Id":0,"Data":[{"Id":33554432,"X":450,"Y":50},{"Id":33554433,"X":500,"Y":50},{"Id":33554434,"X":550,"Y":50},{"Id":33554435,"X":600,"Y":50}],"W":50,"H":50},{"Id":1,"Data":[{"Id":33619968,"X":650,"Y":50},{"Id":33619969,"X":700,"Y":50},{"Id":33619970,"X":750,"Y":50},{"Id":33619971,"X":800,"Y":50}],"W":50,"H":50}],"W":50,"H":50},{"Id":3,"Data":[{"Id":0,"Data":[{"Id":50331648,"X":0,"Y":100},{"Id":50331649,"X":115,"Y":100},{"Id":50331650,"X":230,"Y":100},{"Id":50331651,"X":345,"Y":100}],"W":115,"H":55},{"Id":1,"Data":[{"Id":50397184,"X":460,"Y":100},{"Id":50397185,"X":575,"Y":100}],"W":115,"H":55}],"W":115,"H":55},{"Id":4,"Data":[{"Id":0,"Data":[{"Id":67108864,"X":690,"Y":100},{"Id":67108865,"X":805,"Y":100},{"Id":67108866,"X":920,"Y":100},{"Id":67108867,"X":1035,"Y":100},{"Id":67108868,"X":1150,"Y":100},{"Id":67108869,"X":1265,"Y":100},{"Id":67108870,"X":1380,"Y":100},{"Id":67108871,"X":0,"Y":215},{"Id":67108872,"X":60,"Y":215}],"W":60,"H":60},{"Id":1,"Data":[{"Id":67174400,"X":120,"Y":215},{"Id":67174401,"X":180,"Y":215},{"Id":67174402,"X":240,"Y":215},{"Id":67174403,"X":300,"Y":215},{"Id":67174404,"X":360,"Y":215},{"Id":67174405,"X":420,"Y":215},{"Id":67174406,"X":480,"Y":215},{"Id":67174407,"X":540,"Y":215},{"Id":67174408,"X":600,"Y":215}],"W":60,"H":60},{"Id":2,"Data":[{"Id":67239936,"X":660,"Y":215},{"Id":67239937,"X":720,"Y":215},{"Id":67239938,"X":780,"Y":215}],"W":60,"H":60}],"W":60,"H":60},{"Id":5,"Data":[{"Id":0,"Data":[{"Id":83886080,"X":0,"Y":275},{"Id":83886081,"X":100,"Y":275},{"Id":83886082,"X":200,"Y":275},{"Id":83886083,"X":300,"Y":275},{"Id":83886084,"X":400,"Y":275}],"W":100,"H":75},{"Id":1,"Data":[{"Id":83951616,"X":500,"Y":275},{"Id":83951617,"X":600,"Y":275},{"Id":83951618,"X":700,"Y":275},{"Id":83951619,"X":800,"Y":275},{"Id":83951620,"X":900,"Y":275},{"Id":83951621,"X":1000,"Y":275},{"Id":83951622,"X":1100,"Y":275},{"Id":83951623,"X":1200,"Y":275},{"Id":83951624,"X":1300,"Y":275},{"Id":83951625,"X":1400,"Y":275}],"W":100,"H":75},{"Id":2,"Data":[{"Id":84017152,"X":0,"Y":375},{"Id":84017153,"X":100,"Y":375},{"Id":84017154,"X":200,"Y":375},{"Id":84017155,"X":300,"Y":375},{"Id":84017156,"X":400,"Y":375},{"Id":84017157,"X":500,"Y":375},{"Id":84017158,"X":600,"Y":375},{"Id":84017159,"X":700,"Y":375},{"Id":84017160,"X":800,"Y":375},{"Id":84017161,"X":900,"Y":375}],"W":100,"H":75},{"Id":3,"Data":[{"Id":84082688,"X":1000,"Y":375},{"Id":84082689,"X":1100,"Y":375},{"Id":84082690,"X":1200,"Y":375},{"Id":84082691,"X":1300,"Y":375},{"Id":84082692,"X":1400,"Y":375},{"Id":84082693,"X":0,"Y":475},{"Id":84082694,"X":100,"Y":475},{"Id":84082695,"X":200,"Y":475},{"Id":84082696,"X":300,"Y":475},{"Id":84082697,"X":400,"Y":475}],"W":100,"H":75},{"Id":4,"Data":[{"Id":84148224,"X":500,"Y":475},{"Id":84148225,"X":600,"Y":475},{"Id":84148226,"X":700,"Y":475},{"Id":84148227,"X":800,"Y":475},{"Id":84148228,"X":900,"Y":475}],"W":100,"H":75}],"W":100,"H":75},{"Id":6,"Data":[{"Id":0,"Data":[{"Id":100663296,"X":1000,"Y":475},{"Id":100663297,"X":1100,"Y":475},{"Id":100663298,"X":1200,"Y":475},{"Id":100663299,"X":1300,"Y":475},{"Id":100663300,"X":1400,"Y":475},{"Id":100663301,"X":0,"Y":575},{"Id":100663302,"X":80,"Y":575},{"Id":100663303,"X":160,"Y":575},{"Id":100663304,"X":240,"Y":575},{"Id":100663305,"X":320,"Y":575},{"Id":100663306,"X":400,"Y":575},{"Id":100663307,"X":480,"Y":575}],"W":80,"H":75},{"Id":1,"Data":[{"Id":100728832,"X":560,"Y":575},{"Id":100728833,"X":640,"Y":575},{"Id":100728834,"X":720,"Y":575},{"Id":100728835,"X":800,"Y":575}],"W":80,"H":75},{"Id":2,"Data":[{"Id":100794368,"X":880,"Y":575},{"Id":100794369,"X":960,"Y":575},{"Id":100794370,"X":1040,"Y":575},{"Id":100794371,"X":1120,"Y":575},{"Id":100794372,"X":1200,"Y":575},{"Id":100794373,"X":1280,"Y":575},{"Id":100794374,"X":1360,"Y":575},{"Id":100794375,"X":0,"Y":655},{"Id":100794376,"X":80,"Y":655},{"Id":100794377,"X":160,"Y":655},{"Id":100794378,"X":240,"Y":655},{"Id":100794379,"X":320,"Y":655},{"Id":100794380,"X":400,"Y":655},{"Id":100794381,"X":480,"Y":655},{"Id":100794382,"X":560,"Y":655},{"Id":100794383,"X":640,"Y":655},{"Id":100794384,"X":720,"Y":655},{"Id":100794385,"X":800,"Y":655}],"W":80,"H":75},{"Id":3,"Data":[{"Id":100859904,"X":880,"Y":655},{"Id":100859905,"X":960,"Y":655},{"Id":100859906,"X":1040,"Y":655},{"Id":100859907,"X":1120,"Y":655}],"W":80,"H":75},{"Id":4,"Data":[{"Id":100925441,"X":1200,"Y":655},{"Id":100925442,"X":1280,"Y":655}],"W":80,"H":75}],"W":80,"H":75},{"Id":7,"Data":[{"Id":0,"Data":[{"Id":117440512,"X":0,"Y":735},{"Id":117440513,"X":100,"Y":735},{"Id":117440514,"X":200,"Y":735},{"Id":117440515,"X":300,"Y":735},{"Id":117440516,"X":400,"Y":735},{"Id":117440517,"X":500,"Y":735}],"W":100,"H":50},{"Id":1,"Data":[{"Id":117506048,"X":600,"Y":735},{"Id":117506049,"X":700,"Y":735},{"Id":117506050,"X":800,"Y":735},{"Id":117506051,"X":900,"Y":735},{"Id":117506052,"X":1000,"Y":735},{"Id":117506053,"X":1100,"Y":735}],"W":100,"H":50},{"Id":2,"Data":[{"Id":117571584,"X":1200,"Y":735},{"Id":117571585,"X":1300,"Y":735},{"Id":117571586,"X":1400,"Y":735},{"Id":117571587,"X":0,"Y":835},{"Id":117571588,"X":100,"Y":835},{"Id":117571589,"X":200,"Y":835}],"W":100,"H":50},{"Id":3,"Data":[{"Id":117637120,"X":300,"Y":835},{"Id":117637121,"X":400,"Y":835},{"Id":117637122,"X":500,"Y":835},{"Id":117637123,"X":600,"Y":835},{"Id":117637124,"X":700,"Y":835},{"Id":117637125,"X":800,"Y":835}],"W":100,"H":50},{"Id":4,"Data":[{"Id":117702656,"X":900,"Y":835},{"Id":117702657,"X":1000,"Y":835},{"Id":117702658,"X":1100,"Y":835}],"W":100,"H":50}],"W":100,"H":50},{"Id":8,"Data":[{"Id":0,"Data":[{"Id":134217728,"X":1200,"Y":835},{"Id":134217729,"X":1300,"Y":835},{"Id":134217730,"X":1400,"Y":835},{"Id":134217731,"X":0,"Y":935},{"Id":134217732,"X":100,"Y":935},{"Id":134217733,"X":200,"Y":935},{"Id":134217734,"X":300,"Y":935},{"Id":134217735,"X":400,"Y":935},{"Id":134217736,"X":500,"Y":935},{"Id":134217737,"X":600,"Y":935},{"Id":134217738,"X":700,"Y":935},{"Id":134217739,"X":800,"Y":935},{"Id":134217740,"X":900,"Y":935},{"Id":134217741,"X":1000,"Y":935},{"Id":134217742,"X":1100,"Y":935},{"Id":134217743,"X":1200,"Y":935},{"Id":134217744,"X":1300,"Y":935},{"Id":134217745,"X":1400,"Y":935},{"Id":134217746,"X":0,"Y":1035},{"Id":134217747,"X":100,"Y":1035}],"W":100,"H":40},{"Id":1,"Data":[{"Id":134283264,"X":200,"Y":1035},{"Id":134283265,"X":300,"Y":1035}],"W":100,"H":40},{"Id":2,"Data":[{"Id":134348800,"X":400,"Y":1035},{"Id":134348801,"X":500,"Y":1035}],"W":100,"H":40},{"Id":3,"Data":[{"Id":134414336,"X":600,"Y":1035},{"Id":134414337,"X":700,"Y":1035},{"Id":134414338,"X":800,"Y":1035}],"W":100,"H":40}],"W":100,"H":40},{"Id":9,"Data":[{"Id":0,"Data":[{"Id":150994944,"X":900,"Y":1035},{"Id":150994945,"X":1000,"Y":1035},{"Id":150994946,"X":1100,"Y":1035},{"Id":150994947,"X":1200,"Y":1035},{"Id":150994948,"X":1300,"Y":1035},{"Id":150994949,"X":1400,"Y":1035}],"W":100,"H":60},{"Id":1,"Data":[{"Id":151060480,"X":0,"Y":1135},{"Id":151060481,"X":100,"Y":1135}],"W":100,"H":60}],"W":100,"H":60},{"Id":10,"Data":[{"Id":0,"Data":[{"Id":167772160,"X":840,"Y":215},{"Id":167772161,"X":900,"Y":215},{"Id":167772162,"X":960,"Y":215},{"Id":167772163,"X":1020,"Y":215},{"Id":167772164,"X":1080,"Y":215},{"Id":167772165,"X":1140,"Y":215},{"Id":167772166,"X":1200,"Y":215}],"W":60,"H":40},{"Id":1,"Data":[{"Id":167837696,"X":1260,"Y":215},{"Id":167837697,"X":1320,"Y":215},{"Id":167837698,"X":1380,"Y":215},{"Id":167837699,"X":1440,"Y":215},{"Id":167837700,"X":1360,"Y":655},{"Id":167837701,"X":200,"Y":1135},{"Id":167837702,"X":300,"Y":1135},{"Id":167837703,"X":400,"Y":1135},{"Id":167837704,"X":500,"Y":1135},{"Id":167837705,"X":600,"Y":1135},{"Id":167837706,"X":700,"Y":1135},{"Id":167837707,"X":800,"Y":1135}],"W":60,"H":40},{"Id":2,"Data":[{"Id":167903232,"X":900,"Y":1135},{"Id":167903233,"X":1000,"Y":1135}],"W":60,"H":40}],"W":60,"H":40},{"Id":11,"Data":[{"Id":0,"Data":[{"Id":184549376,"X":1100,"Y":1135},{"Id":184549377,"X":1200,"Y":1135},{"Id":184549378,"X":1300,"Y":1135},{"Id":184549379,"X":1400,"Y":1135},{"Id":184549380,"X":0,"Y":1235},{"Id":184549381,"X":100,"Y":1235},{"Id":184549382,"X":200,"Y":1235},{"Id":184549383,"X":300,"Y":1235}],"W":100,"H":70},{"Id":1,"Data":[{"Id":184614912,"X":400,"Y":1235},{"Id":184614913,"X":500,"Y":1235},{"Id":184614914,"X":600,"Y":1235},{"Id":184614915,"X":700,"Y":1235}],"W":100,"H":70},{"Id":2,"Data":[{"Id":184680448,"X":800,"Y":1235},{"Id":184680449,"X":900,"Y":1235},{"Id":184680450,"X":1000,"Y":1235},{"Id":184680451,"X":1100,"Y":1235}],"W":100,"H":70},{"Id":3,"Data":[{"Id":184745984,"X":1200,"Y":1235},{"Id":184745985,"X":1300,"Y":1235},{"Id":184745986,"X":1400,"Y":1235},{"Id":184745987,"X":0,"Y":1335}],"W":100,"H":70},{"Id":4,"Data":[{"Id":184811520,"X":100,"Y":1335},{"Id":184811521,"X":200,"Y":1335}],"W":100,"H":70}],"W":100,"H":70}],"W":0,"H":0}');

            var _math = new AscCommon.CAscMathCategory();

            var _len1 = _math_json["Data"].length;
            for (var i1 = 0; i1 < _len1; i1++)
            {
                var _catJS1 = _math_json["Data"][i1];
                var _cat1 = new AscCommon.CAscMathCategory();

                _cat1.Id = _catJS1["Id"];
                _cat1.W = _catJS1["W"];
                _cat1.H = _catJS1["H"];

                var _len2 = _catJS1["Data"].length;
                for (var i2 = 0; i2 < _len2; i2++)
                {
                    var _catJS2 = _catJS1["Data"][i2];
                    var _cat2 = new AscCommon.CAscMathCategory();

                    _cat2.Id = _catJS2["Id"];
                    _cat2.W = _catJS2["W"];
                    _cat2.H = _catJS2["H"];

                    var _len3 = _catJS2["Data"].length;
                    for (var i3 = 0; i3 < _len3; i3++)
                    {
                        var _typeJS = _catJS2["Data"][i3];
                        var _type = new AscCommon.CAscMathType();

                        _type.Id = _typeJS["Id"];
                        _type.X = _typeJS["X"];
                        _type.Y = _typeJS["Y"];

                        _cat2.Data.push(_type);
                    }

                    _cat1.Data.push(_cat2);
                }

                _math.Data.push(_cat1);
            }

            this.Api.sendMathTypesToMenu(_math);
        }
    }


    function fCreateSignatureShape(sGuid, sSigner, sSigner2, sEmail, bWord, wsModel, Width, Height, sImgUrl){
        var oShape = new AscFormat.CShape();
        oShape.setWordShape(bWord === true);
        oShape.setBDeleted(false);
        if(wsModel)
            oShape.setWorksheet(wsModel);
        var oSpPr = new AscFormat.CSpPr();
        var oXfrm = new AscFormat.CXfrm();
        oXfrm.setOffX(0);
        oXfrm.setOffY(0);
        if(AscFormat.isRealNumber(Width) && AscFormat.isRealNumber(Height)){
            oXfrm.setExtX(Width);
			oXfrm.setExtY(Height);
        }
        else{
			oXfrm.setExtX(1828800/36000);
			oXfrm.setExtY(1828800/36000);
        }
        if(typeof sImgUrl === "string" && sImgUrl.length > 0){
            var oBlipFillUnifill = AscFormat.CreateBlipFillUniFillFromUrl(sImgUrl);
            oSpPr.setFill(oBlipFillUnifill);
        }
        else {
			oSpPr.setFill(AscFormat.CreateNoFillUniFill());
        }
        oSpPr.setXfrm(oXfrm);
        oXfrm.setParent(oSpPr);
        oSpPr.setLn(AscFormat.CreateNoFillLine());
        oSpPr.setGeometry(AscFormat.CreateGeometry("rect"));
        oShape.setSpPr(oSpPr);
        oSpPr.setParent(oShape);
        var oSignatureLine = new AscFormat.CSignatureLine();
        oSignatureLine.id = sGuid;
        oSignatureLine.signer = sSigner;
        oSignatureLine.signer2 = sSigner2;
        oSignatureLine.email = sEmail;
        oShape.setSignature(oSignatureLine);

        return oShape;
    }


    function fGetListTypeFromBullet(Bullet) {

        var ListType = {
            Type    : -1,
            SubType : -1
        };
        if (Bullet)
        {
            if (Bullet && Bullet.bulletType)
            {
                switch (Bullet.bulletType.type)
                {
                    case AscFormat.BULLET_TYPE_BULLET_CHAR:
                    {
                        ListType.Type    = 0;
                        ListType.SubType = undefined;
                        switch (Bullet.bulletType.Char)
                        {
                            case "•":
                            {
                                ListType.SubType = 1;
                                break;
                            }
                            case  "o":
                            {
                                ListType.SubType = 2;
                                break;
                            }
                            case  "§":
                            {
                                ListType.SubType = 3;
                                break;
                            }
                            case  String.fromCharCode(0x0076):
                            {
                                ListType.SubType = 4;
                                break;
                            }
                            case  String.fromCharCode(0x00D8):
                            {
                                ListType.SubType = 5;
                                break;
                            }
                            case  String.fromCharCode(0x00FC):
                            {
                                ListType.SubType = 6;
                                break;
                            }
                            case String.fromCharCode(119):
                            {
                                ListType.SubType = 7;
                                break;
                            }
                            case String.fromCharCode(0x2013):
                            {
                                ListType.SubType = 8;
                                break;
                            }
                        }
                        break;
                    }
                    case AscFormat.BULLET_TYPE_BULLET_BLIP:
                    {
                        ListType.Type    = 0;
                        ListType.SubType = undefined;
                        break;
                    }
                    case AscFormat.BULLET_TYPE_BULLET_AUTONUM:
                    {
                        ListType.Type    = 1;
                        ListType.SubType = undefined;
                        if (AscFormat.isRealNumber(Bullet.bulletType.AutoNumType))
                        {
                            var AutoNumType = AscCommonWord.g_NumberingArr[Bullet.bulletType.AutoNumType] - 99;
                            switch (Bullet.bulletType.AutoNumType)
                            {
                                case 1:
                                {
                                    AutoNumType = 5;
                                    break;
                                }
                                case 2:
                                {
                                    AutoNumType = 6;
                                    break;
                                }
                                case 5:
                                {
                                    AutoNumType = 4;
                                    break;
                                }
                                case 11:
                                {
                                    AutoNumType = 2;
                                    break;
                                }
                                case 12:
                                {
                                    AutoNumType = 1;
                                    break;
                                }
                                case 31:
                                {
                                    AutoNumType = 7;
                                    break;
                                }
                                case 34:
                                {
                                    AutoNumType = 3;
                                    break;
                                }
                            }
                            if (AscFormat.isRealNumber(AutoNumType) && AutoNumType > 0 && AutoNumType < 9)
                            {
                                ListType.SubType = AutoNumType;
                            }
                        }
                        break;
                    }
                }
            }
        }
        return ListType;
    }


    function fGetFontByNumInfo(Type, SubType){
        if(!AscFormat.isRealNumber(Type) || !AscFormat.isRealNumber(SubType))
        {
            return null;
        }
        if(SubType >= 0){
            if(Type === 0){
                switch(SubType)
                {
                    case 0:
                    case 1:
                    case 8:
                    {
                        return "Arial";
                    }
                    case 2:
                    {
                        return "Courier New";
                    }
                    case 3:
                    case 4:
                    case 5:
                    case 6:
                    case 7:
                    {
                        return "Wingdings";
                    }
                }
            }
        }
        return null;
    }

    function fGetPresentationBulletByNumInfo(NumInfo){
        if(!AscFormat.isRealNumber(NumInfo.Type) && !AscFormat.isRealNumber(NumInfo.SubType))
        {
            return null;
        }
        var bullet = new AscFormat.CBullet();
        if(NumInfo.SubType < 0)
        {
            bullet.bulletType = new AscFormat.CBulletType();
            bullet.bulletType.type = AscFormat.BULLET_TYPE_BULLET_NONE;
        }
        else
        {
            switch (NumInfo.Type)
            {
                case 0 : /*bulletChar*/
                {
                    switch(NumInfo.SubType)
                    {
                        case 0:
                        case 1:
                        {
                            var bulletText = "•";
                            bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                            bullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
                            bullet.bulletTypeface.typeface = "Arial";
                            break;
                        }
                        case 2:
                        {
                            bulletText = "o";
                            bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                            bullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
                            bullet.bulletTypeface.typeface = "Courier New";
                            break;
                        }
                        case 3:
                        {
                            bulletText = "§";
                            bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                            bullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
                            bullet.bulletTypeface.typeface = "Wingdings";
                            break;
                        }
                        case 4:
                        {
                            bulletText = String.fromCharCode( 0x0076 );
                            bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                            bullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
                            bullet.bulletTypeface.typeface = "Wingdings";
                            break;
                        }
                        case 5:
                        {
                            bulletText = String.fromCharCode( 0x00D8 );
                            bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                            bullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
                            bullet.bulletTypeface.typeface = "Wingdings";
                            break;
                        }
                        case 6:
                        {
                            bulletText = String.fromCharCode( 0x00FC );
                            bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                            bullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
                            bullet.bulletTypeface.typeface = "Wingdings";
                            break;
                        }
                        case 7:
                        {

                            bulletText = String.fromCharCode(119);
                            bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                            bullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
                            bullet.bulletTypeface.typeface = "Wingdings";
                            break;
                        }
                        case 8:
                        {
                            bulletText = String.fromCharCode(0x2013);
                            bullet.bulletTypeface = new AscFormat.CBulletTypeface();
                            bullet.bulletTypeface.type = AscFormat.BULLET_TYPE_TYPEFACE_BUFONT;
                            bullet.bulletTypeface.typeface = "Arial";
                            break;
                        }
                    }
                    bullet.bulletType = new AscFormat.CBulletType();
                    bullet.bulletType.type = AscFormat.BULLET_TYPE_BULLET_CHAR;
                    bullet.bulletType.Char = bulletText;
                    break;
                }
                case 1 : /*autonum*/
                {
                    switch(NumInfo.SubType)
                    {
                        case 0 :
                        case 1 :
                        {
                            var numberingType = 12;//numbering_numfmt_arabicPeriod;
                            break;
                        }
                        case 2:
                        {
                            numberingType = 11;//numbering_numfmt_arabicParenR;
                            break;
                        }
                        case 3 :
                        {
                            numberingType = 34;//numbering_numfmt_romanUcPeriod;
                            break;
                        }
                        case 4 :
                        {
                            numberingType = 5;//numbering_numfmt_alphaUcPeriod;
                            break;
                        }
                        case 5 :
                        {
                            numberingType = 1;
                            break;
                        }
                        case 6 :
                        {
                            numberingType = 2;
                            break;
                        }
                        case 7 :
                        {
                            numberingType = 31;//numbering_numfmt_romanLcPeriod;
                            break;
                        }
                    }
                    bullet.bulletType = new AscFormat.CBulletType();
                    bullet.bulletType.type = AscFormat.BULLET_TYPE_BULLET_AUTONUM;
                    bullet.bulletType.AutoNumType = numberingType;
                    break;
                }
                default :
                {
                    break;
                }
            }
        }
        return bullet;
    }



    function fResetConnectorsIds(aCopyObjects, oIdMaps){
        for(var i = 0; i < aCopyObjects.length; ++i){
            var oDrawing = aCopyObjects[i].Drawing ? aCopyObjects[i].Drawing : aCopyObjects[i];
            if(oDrawing.getObjectType){
                if(oDrawing.getObjectType() === AscDFH.historyitem_type_Cnx){
                    var sStId = oDrawing.getStCxnId();
                    var sEndId = oDrawing.getEndCxnId();
                    var sStCnxId = null, sEndCnxId = null;
                    if(oIdMaps[sStId]){
                        sStCnxId = oIdMaps[sStId];
                    }
                    if(oIdMaps[sEndId]){
                        sEndCnxId = oIdMaps[sEndId];
                    }
                    if(sStId !==  sStCnxId || sEndCnxId !== sEndId){

                        var nvUniSpPr = oDrawing.nvSpPr.nvUniSpPr.copy();
                        if(!sStCnxId){
                            nvUniSpPr.stCnxIdx = null;
                            nvUniSpPr.stCnxId  = null;
                        }
                        else{
                            nvUniSpPr.stCnxId  = sStCnxId;
                        }
                        if(!sEndCnxId){
                            nvUniSpPr.endCnxIdx = null;
                            nvUniSpPr.endCnxId  = null;
                        }
                        else{
                            nvUniSpPr.endCnxId  = sEndCnxId;
                        }
                        oDrawing.nvSpPr.setUniSpPr(nvUniSpPr);
                    }
                }
                else if(oDrawing.getObjectType() === AscDFH.historyitem_type_GroupShape){
                    fResetConnectorsIds(oDrawing.spTree, oIdMaps);
                }
            }
        }
    }


    function fCheckObjectHyperlink(object, x, y){
        var content =  object.getDocContent && object.getDocContent();
        var invert_transform_text = object.invertTransformText, tx, ty, hit_paragraph, check_hyperlink, par;
        if(content && invert_transform_text)
        {
            tx = invert_transform_text.TransformPointX(x, y);
            ty = invert_transform_text.TransformPointY(x, y);
            hit_paragraph = content.Internal_GetContentPosByXY(tx, ty, 0);
            par = content.Content[hit_paragraph];
            if(isRealObject(par))
            {
                if(par.IsInText && par.IsInText(tx, ty, 0))
                {
                    check_hyperlink = par.CheckHyperlink(tx, ty, 0);
                    if(isRealObject(check_hyperlink))
                    {
                        return check_hyperlink;
                    }
                }
            }
        }
        return null;
    }

    //--------------------------------------------------------export----------------------------------------------------
    window['AscFormat'] = window['AscFormat'] || {};
    window['AscFormat'].HANDLE_EVENT_MODE_HANDLE = HANDLE_EVENT_MODE_HANDLE;
    window['AscFormat'].HANDLE_EVENT_MODE_CURSOR = HANDLE_EVENT_MODE_CURSOR;
    window['AscFormat'].DISTANCE_TO_TEXT_LEFTRIGHT = DISTANCE_TO_TEXT_LEFTRIGHT;
    window['AscFormat'].BAR_DIR_BAR = BAR_DIR_BAR;
    window['AscFormat'].BAR_DIR_COL = BAR_DIR_COL;
    window['AscFormat'].BAR_GROUPING_CLUSTERED = BAR_GROUPING_CLUSTERED;
    window['AscFormat'].BAR_GROUPING_PERCENT_STACKED = BAR_GROUPING_PERCENT_STACKED;
    window['AscFormat'].BAR_GROUPING_STACKED = BAR_GROUPING_STACKED;
    window['AscFormat'].BAR_GROUPING_STANDARD = BAR_GROUPING_STANDARD;
    window['AscFormat'].GROUPING_PERCENT_STACKED = GROUPING_PERCENT_STACKED;
    window['AscFormat'].GROUPING_STACKED = GROUPING_STACKED;
    window['AscFormat'].GROUPING_STANDARD = GROUPING_STANDARD;
    window['AscFormat'].SCATTER_STYLE_LINE = SCATTER_STYLE_LINE;
    window['AscFormat'].SCATTER_STYLE_LINE_MARKER = SCATTER_STYLE_LINE_MARKER;
    window['AscFormat'].SCATTER_STYLE_MARKER = SCATTER_STYLE_MARKER;
    window['AscFormat'].SCATTER_STYLE_NONE = SCATTER_STYLE_NONE;
    window['AscFormat'].SCATTER_STYLE_SMOOTH = SCATTER_STYLE_SMOOTH;
    window['AscFormat'].SCATTER_STYLE_SMOOTH_MARKER = SCATTER_STYLE_SMOOTH_MARKER;
    window['AscFormat'].CARD_DIRECTION_N = CARD_DIRECTION_N;
    window['AscFormat'].CARD_DIRECTION_NE = CARD_DIRECTION_NE;
    window['AscFormat'].CARD_DIRECTION_E = CARD_DIRECTION_E;
    window['AscFormat'].CARD_DIRECTION_SE = CARD_DIRECTION_SE;
    window['AscFormat'].CARD_DIRECTION_S = CARD_DIRECTION_S;
    window['AscFormat'].CARD_DIRECTION_SW = CARD_DIRECTION_SW;
    window['AscFormat'].CARD_DIRECTION_W = CARD_DIRECTION_W;
    window['AscFormat'].CARD_DIRECTION_NW = CARD_DIRECTION_NW;


    window['AscFormat'].CURSOR_TYPES_BY_CARD_DIRECTION = CURSOR_TYPES_BY_CARD_DIRECTION;
    window['AscFormat'].removeDPtsFromSeries = removeDPtsFromSeries;
    window['AscFormat'].checkTxBodyDefFonts = checkTxBodyDefFonts;
    window['AscFormat'].CheckShapeBodyAutoFitReset = CheckShapeBodyAutoFitReset;
    window['AscFormat'].CDistance = CDistance;
    window['AscFormat'].ConvertRelPositionHToRelSize = ConvertRelPositionHToRelSize;
    window['AscFormat'].ConvertRelPositionVToRelSize = ConvertRelPositionVToRelSize;
    window['AscFormat'].ConvertRelSizeHToRelPosition = ConvertRelSizeHToRelPosition;
    window['AscFormat'].ConvertRelSizeVToRelPosition = ConvertRelSizeVToRelPosition;
    window['AscFormat'].checkObjectInArray = checkObjectInArray;
    window['AscFormat'].getValOrDefault = getValOrDefault;
    window['AscFormat'].CheckStockChart = CheckStockChart;
    window['AscFormat'].CheckLinePreset = CheckLinePreset;
    window['AscFormat'].CompareGroups = CompareGroups;
    window['AscFormat'].CheckSpPrXfrm = CheckSpPrXfrm;
    window['AscFormat'].CheckSpPrXfrm2 = CheckSpPrXfrm2;
    window['AscFormat'].CheckSpPrXfrm3 = CheckSpPrXfrm3;
    window['AscFormat'].getObjectsByTypesFromArr = getObjectsByTypesFromArr;
    window['AscFormat'].getTargetTextObject = getTargetTextObject;
    window['AscFormat'].DrawingObjectsController = DrawingObjectsController;
    window['AscFormat'].CBoundsController = CBoundsController;
    window['AscFormat'].CSlideBoundsChecker = CSlideBoundsChecker;
    window['AscFormat'].GetMinSnapDistanceXObject = GetMinSnapDistanceXObject;
    window['AscFormat'].GetMinSnapDistanceYObject = GetMinSnapDistanceYObject;
    window['AscFormat'].GetMinSnapDistanceXObjectByArrays = GetMinSnapDistanceXObjectByArrays;
    window['AscFormat'].GetMinSnapDistanceYObjectByArrays = GetMinSnapDistanceYObjectByArrays;
    window['AscFormat'].CalcLiterByLength = CalcLiterByLength;
    window['AscFormat'].fillImage = fillImage;
	window['AscFormat'].fSolveQuadraticEquation = fSolveQuadraticEquation;
	window['AscFormat'].fApproxEqual = fApproxEqual;
	window['AscFormat'].fCheckBoxIntersectionSegment = fCheckBoxIntersectionSegment;
	window['AscFormat'].CMathPainter = CMathPainter;
	window['AscFormat'].CollectSettingsFromChart = CollectSettingsFromChart;
	window['AscFormat'].ApplyPresetToChartSpace = ApplyPresetToChartSpace;
	window['AscFormat'].ApplySpPr = ApplySpPr;
	window['AscFormat'].ApplyDLblsProps = ApplyDLblsProps;
	window['AscFormat'].CollectDLbls = CollectDLbls;
	window['AscFormat'].CollectSettingsSpPr = CollectSettingsSpPr;
	window['AscFormat'].CheckLinePresetForParagraphAdd = CheckLinePresetForParagraphAdd;
	window['AscFormat'].isConnectorPreset = isConnectorPreset;
	window['AscFormat'].fCreateSignatureShape = fCreateSignatureShape;
	window['AscFormat'].CreateBlipFillUniFillFromUrl = CreateBlipFillUniFillFromUrl;
	window['AscFormat'].fGetListTypeFromBullet = fGetListTypeFromBullet;
	window['AscFormat'].fGetPresentationBulletByNumInfo = fGetPresentationBulletByNumInfo;
	window['AscFormat'].fGetFontByNumInfo = fGetFontByNumInfo;
	window['AscFormat'].CreateBlipFillRasterImageId = CreateBlipFillRasterImageId;
	window['AscFormat'].fResetConnectorsIds = fResetConnectorsIds;
	window['AscFormat'].getAbsoluteRectBoundsArr = getAbsoluteRectBoundsArr;
	window['AscFormat'].fCheckObjectHyperlink = fCheckObjectHyperlink;
})(window);
