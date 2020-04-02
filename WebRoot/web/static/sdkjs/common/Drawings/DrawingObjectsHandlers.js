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

(function(window, undefined){

// Import
var HANDLE_EVENT_MODE_HANDLE = AscFormat.HANDLE_EVENT_MODE_HANDLE;

function CheckCoordsNeedPage(x, y, pageIndex, needPageIndex, drawingDocument)
{
    if(pageIndex === needPageIndex)
        return {x:x, y:y};
    else
    {
        var  t = drawingDocument.ConvertCoordsToAnotherPage(x,y, pageIndex, needPageIndex);
        return {x: t.X, y: t.Y};
    }
}


function handleSelectedObjects(drawingObjectsController, e, x, y, group, pageIndex, bWord)
{
    if(drawingObjectsController.isSlideShow())
    {
        return false;
    }
    var selected_objects = group ? group.selectedObjects : drawingObjectsController.getSelectedObjects();
    var oCropSelection = drawingObjectsController.selection.cropSelection ? drawingObjectsController.selection.cropSelection : null;
    var tx, ty, t, hit_to_handles;
    var ret = null;
    var drawing = null;
    if(oCropSelection && !window["IS_NATIVE_EDITOR"])
    {
        var oCropObject = oCropSelection.getCropObject();
        if(oCropObject)
        {
            if(bWord && pageIndex !== oCropSelection.selectStartPage)
            {
                t = drawingObjectsController.drawingDocument.ConvertCoordsToAnotherPage(x, y, pageIndex, oCropSelection.selectStartPage);
                tx = t.X;
                ty = t.Y;
            }
            else
            {
                tx = x;
                ty = y;
            }
            hit_to_handles = oCropSelection.hitToHandles(tx, ty);
            if(hit_to_handles > -1)
            {
                ret = drawingObjectsController.handleHandleHit(hit_to_handles, oCropSelection, group);
                drawing = oCropSelection;
            }

            if(!ret)
            {
                if(oCropSelection.hitInBoundingRect(tx, ty))
                {
                    ret = drawingObjectsController.handleMoveHit(oCropSelection, e, tx, ty, group, true, oCropSelection.selectStartPage, true);
                }
            }


            var oldSelectedObjects;
            if(group)
            {
                oldSelectedObjects = group.selectedObjects;
                group.selectedObjects = [oCropObject];
            }
            else
            {
                oldSelectedObjects = drawingObjectsController.selectedObjects;
                drawingObjectsController.selectedObjects = [oCropObject];
            }
            if(!ret)
            {
                hit_to_handles = oCropObject.hitToHandles(tx, ty);
                if(hit_to_handles > -1)
                {
                    ret = drawingObjectsController.handleHandleHit(hit_to_handles, oCropObject, group);
                    drawing = oCropObject;
                }
            }
            if(!ret)
            {
                if(oCropObject.hitInBoundingRect(tx, ty))
                {
                    ret = drawingObjectsController.handleMoveHit(oCropObject, e, tx, ty, group, true, oCropSelection.selectStartPage, true);
                }
            }
            if(!ret)
            {
                if(oCropSelection.hit(tx, ty))
                {
                    ret = drawingObjectsController.handleMoveHit(oCropObject, e, tx, ty, group, true, oCropSelection.selectStartPage, true);
                }
            }
            if(!ret)
            {
                if(oCropObject.hit(tx, ty))
                {
                    ret = drawingObjectsController.handleMoveHit(oCropObject, e, tx, ty, group, true, oCropSelection.selectStartPage, true);
                }
            }
            if(group)
            {
                group.selectedObjects = oldSelectedObjects;
            }
            else
            {
                drawingObjectsController.selectedObjects = oldSelectedObjects;
            }
        }
    }
    if(!ret)
    {
        if(selected_objects.length === 1)
        {
            if(window["IS_NATIVE_EDITOR"] && e.ClickCount > 1)
            {
                if(selected_objects[0].getObjectType() === AscDFH.historyitem_type_Shape)
                {
                    return null;
                }
            }
            if(bWord && pageIndex !== selected_objects[0].selectStartPage)
            {
                t = drawingObjectsController.drawingDocument.ConvertCoordsToAnotherPage(x, y, pageIndex, selected_objects[0].selectStartPage);
                tx = t.X;
                ty = t.Y;
            }
            else
            {
                tx = x;
                ty = y;
            }
            var hit_to_adj = selected_objects[0].hitToAdjustment(tx, ty);
            if(hit_to_adj.hit)
            {
                ret = drawingObjectsController.handleAdjustmentHit(hit_to_adj, selected_objects[0], group, pageIndex);
                drawing = selected_objects[0];
            }
        }
    }

    if(!ret)
    {
        for(var i = selected_objects.length - 1; i > -1; --i)
        {
            if(bWord && pageIndex !== selected_objects[i].selectStartPage)
            {
                t = drawingObjectsController.drawingDocument.ConvertCoordsToAnotherPage(x, y, pageIndex, selected_objects[i].selectStartPage);
                tx = t.X;
                ty = t.Y;
            }
            else
            {
                tx = x;
                ty = y;
            }

            if(selected_objects[i].getObjectType() === AscDFH.historyitem_type_ChartSpace)
            {
                ret = handleInternalChart(selected_objects[i], drawingObjectsController, e, tx, ty, group, pageIndex, bWord);
                if(ret)
                {
                    drawing = selected_objects[i];
                    break;
                }
            }
            if(!ret)
            {
                hit_to_handles = selected_objects[i].hitToHandles(tx, ty);
                if(hit_to_handles > -1)
                {

                    if(window["IS_NATIVE_EDITOR"] && e.ClickCount > 1)
                    {
                        if(selected_objects[i].getObjectType() === AscDFH.historyitem_type_Shape)
                        {
                            return null;
                        }
                    }
                    ret = drawingObjectsController.handleHandleHit(hit_to_handles, selected_objects[i], group);
                    drawing = selected_objects[i];
                    break;
                }
            }
        }
    }

    if(!ret)
    {
        for(i = selected_objects.length - 1; i > -1; --i)
        {
            if(bWord && pageIndex !== selected_objects[i].selectStartPage)
            {
                t = drawingObjectsController.drawingDocument.ConvertCoordsToAnotherPage(x, y, pageIndex, selected_objects[i].selectStartPage);
                tx = t.X;
                ty = t.Y;
            }
            else
            {
                tx = x;
                ty = y;
            }
            if(selected_objects[i].getObjectType() === AscDFH.historyitem_type_ChartSpace)
            {
                ret = handleInternalChart(selected_objects[i], drawingObjectsController, e, tx, ty, group, pageIndex, bWord);
                drawing = selected_objects[i];
            }
            if(!ret)
            {

                if(selected_objects[i].hitInBoundingRect(tx, ty))
                {
                    if(window["IS_NATIVE_EDITOR"])
                    {
                        if(selected_objects[i] === AscFormat.getTargetTextObject(drawingObjectsController))
                        {
                            return null;
                        }
                    }
                    if(bWord && selected_objects[i].parent && selected_objects[i].parent.Is_Inline())
                        ret = handleInlineHitNoText(selected_objects[i], drawingObjectsController, e, tx, ty, pageIndex, true);
                    else
                        ret = drawingObjectsController.handleMoveHit(selected_objects[i], e, tx, ty, group, true, selected_objects[i].selectStartPage, true);

                }
            }
            if(ret)
            {
                drawing = selected_objects[i];
                break;
            }
        }
    }
    if(ret && drawing)
    {
        if(drawingObjectsController.handleEventMode === AscFormat.HANDLE_EVENT_MODE_CURSOR  && drawingObjectsController &&
            drawingObjectsController.drawingObjects && drawingObjectsController.drawingObjects.cSld)
        {
            if(drawing.Lock.Is_Locked())
            {
                var MMData              = new AscCommon.CMouseMoveData();
                var Coords              =  drawingObjectsController.getDrawingDocument().ConvertCoordsToCursorWR(drawing.bounds.x, drawing.bounds.y, pageIndex, null);
                MMData.X_abs            = Coords.X - 5;
                MMData.Y_abs            = Coords.Y;
                MMData.Type             = AscCommon.c_oAscMouseMoveDataTypes.LockedObject;
                MMData.UserId           = drawing.Lock.Get_UserId();
                MMData.HaveChanges      = drawing.Lock.Have_Changes();
                editor.sync_MouseMoveCallback(MMData);
            }
        }
    }
    return ret;
}


function handleFloatObjects(drawingObjectsController, drawingArr, e, x, y, group, pageIndex, bWord)
{
    var ret = null, drawing;
    for(var i = drawingArr.length-1; i > -1; --i)
    {
        drawing = drawingArr[i];
        switch(drawing.getObjectType())
        {
            case AscDFH.historyitem_type_Shape:
            case AscDFH.historyitem_type_ImageShape:
            case AscDFH.historyitem_type_OleObject:
            case AscDFH.historyitem_type_Cnx:
            case AscDFH.historyitem_type_LockedCanvas:
            {
                ret = handleShapeImage(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord);
                break;
            }
            case AscDFH.historyitem_type_ChartSpace:
            {
                ret = handleChart(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord);
                break;
            }
            case AscDFH.historyitem_type_GroupShape:
            {
                ret = handleGroup(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord);
                break;
            }
            case AscDFH.historyitem_type_GraphicFrame:
            {
                ret = !drawingObjectsController.isSlideShow() && handleFloatTable(drawing, drawingObjectsController, e, x, y, group, pageIndex);
                break;
            }
        }

        if(ret)
        {
            if(drawingObjectsController.handleEventMode === AscFormat.HANDLE_EVENT_MODE_CURSOR  && drawingObjectsController &&
                drawingObjectsController.drawingObjects && drawingObjectsController.drawingObjects.cSld)
            {
                if(drawing.Lock.Is_Locked())
                {
                    var MMData              = new AscCommon.CMouseMoveData();
                    var Coords              =  drawingObjectsController.getDrawingDocument().ConvertCoordsToCursorWR(drawing.bounds.x, drawing.bounds.y, pageIndex, null);
                    MMData.X_abs            = Coords.X - 5;
                    MMData.Y_abs            = Coords.Y;
                    MMData.Type             = AscCommon.c_oAscMouseMoveDataTypes.LockedObject;
                    MMData.UserId           = drawing.Lock.Get_UserId();
                    MMData.HaveChanges      = drawing.Lock.Have_Changes();
                    editor.sync_MouseMoveCallback(MMData);
                }
            }
            return ret;
        }
    }
    return ret;
}

function handleShapeImage(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord)
{
    var hit_in_inner_area = drawing.hitInInnerArea(x, y);
    var hit_in_path = drawing.hitInPath(x, y);
    var hit_in_text_rect = drawing.hitInTextRect(x, y);
    if(hit_in_inner_area || hit_in_path)
    {
        if(drawingObjectsController.checkDrawingHyperlink){
            var ret =  drawingObjectsController.checkDrawingHyperlink(drawing, e, hit_in_text_rect, x, y, pageIndex);
            if(ret){
                return ret;
            }
        }
    }


    if(window["IS_NATIVE_EDITOR"])
    {
        if(drawing.getObjectType() === AscDFH.historyitem_type_Shape && drawing.getDocContent && drawing.getDocContent())
        {
            if(e.ClickCount > 1 && !e.ShiftKey && !e.CtrlKey && ((drawingObjectsController.selection.groupSelection && drawingObjectsController.selection.groupSelection.selectedObjects.length === 1) || drawingObjectsController.selectedObjects.length === 1))
            {
                if(!hit_in_text_rect && (hit_in_inner_area || hit_in_path))
                {
                    hit_in_text_rect = true;
                    hit_in_inner_area = false;
                    hit_in_path = false;
                }
            }
        }
    }
    if(!hit_in_text_rect && (hit_in_inner_area || hit_in_path))
    {
        if(drawingObjectsController.isSlideShow())
        {
            var sMediaFile = drawing.getMediaFileName && drawing.getMediaFileName();
            if(!sMediaFile)
            {
                return false;
            }
        }
        return drawingObjectsController.handleMoveHit(drawing, e, x, y, group, false, pageIndex, bWord);
    }
    else if(hit_in_text_rect)
    {
        if(bWord/* && (!drawing.txWarpStruct || drawingObjectsController.curState.startTargetTextObject === drawing || drawing.haveSelectedDrawingInContent && drawing.haveSelectedDrawingInContent())*/)
        {
            var all_drawings = drawing.getDocContent().GetAllDrawingObjects();
            var drawings2 = [];
            for(var i = 0; i < all_drawings.length; ++i)
            {
                drawings2.push(all_drawings[i].GraphicObj);
            }
            var ret = handleInlineObjects(drawingObjectsController, drawings2, e, x, y, pageIndex, bWord);
            if(ret)
                return ret;
        }
        if(drawingObjectsController.isSlideShow())
        {
            if(!AscFormat.fCheckObjectHyperlink(drawing,x, y))
            {
                return false
            }
        }
        var oTextObject = AscFormat.getTargetTextObject(drawingObjectsController);
        if(!e.CtrlKey && !e.ShiftKey || oTextObject === drawing)
        {
            return drawingObjectsController.handleTextHit(drawing, e, x, y, group, pageIndex, bWord);
        }
        else
        {
            return drawingObjectsController.handleMoveHit(drawing, e, x, y, group, false, pageIndex, bWord);
        }
    }
    return false;
}


function handleShapeImageInGroup(drawingObjectsController, drawing, shape, e, x, y, pageIndex, bWord)
{
    var hit_in_inner_area = shape.hitInInnerArea && shape.hitInInnerArea(x, y);
    var hit_in_path = shape.hitInPath && shape.hitInPath(x, y);
    var hit_in_text_rect = shape.hitInTextRect && shape.hitInTextRect(x, y);
    var ret;
    if(hit_in_inner_area || hit_in_path)
    {
        if(drawingObjectsController.checkDrawingHyperlink){
            var ret =  drawingObjectsController.checkDrawingHyperlink(shape, e, hit_in_text_rect, x, y, pageIndex);
            if(ret){
                return ret;
            }
        }
    }
    if(!hit_in_text_rect && (hit_in_inner_area || hit_in_path))
    {
        if(drawingObjectsController.isSlideShow())
        {
            var sMediaFile = drawing.getMediaFileName && drawing.getMediaFileName();
            if(!sMediaFile)
            {
                return false;
            }
        }
        return drawingObjectsController.handleMoveHit(drawing, e, x, y, null, false, pageIndex, true);
    }
    else if(hit_in_text_rect)
    {
        if(bWord/* &&
            (!shape.txWarpStruct || drawingObjectsController.curState.startTargetTextObject === shape || shape.haveSelectedDrawingInContent && shape.haveSelectedDrawingInContent())*/) {
            var all_drawings = shape.getDocContent().GetAllDrawingObjects();
            var drawings2 = [];
            for (var i = 0; i < all_drawings.length; ++i) {
                drawings2.push(all_drawings[i].GraphicObj);
            }
            ret = handleInlineObjects(drawingObjectsController, drawings2, e, x, y, pageIndex, true);
            if (ret)
                return ret;
        }
        if(drawingObjectsController.isSlideShow())
        {
            if(!AscFormat.fCheckObjectHyperlink(drawing,x, y))
            {
                return false
            }
        }
        var oTextObject = AscFormat.getTargetTextObject(drawingObjectsController);
        if(!e.CtrlKey && !e.ShiftKey || oTextObject === drawing)
        {
            return drawingObjectsController.handleTextHit(shape, e, x, y, drawing, pageIndex, bWord);
        }
        else
        {
            return drawingObjectsController.handleMoveHit(drawing, e, x, y, null, false, pageIndex, true);
        }
    }
}

function handleGroup(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord)
{
    var grouped_objects = drawing.getArrGraphicObjects();
    var ret;
    for(var j = grouped_objects.length - 1; j > -1; --j)
    {
        var cur_grouped_object = grouped_objects[j];
        switch (cur_grouped_object.getObjectType())
        {
            case AscDFH.historyitem_type_Shape:
            case AscDFH.historyitem_type_ImageShape:
            case AscDFH.historyitem_type_OleObject:
            case AscDFH.historyitem_type_Cnx:
            case AscDFH.historyitem_type_LockedCanvas:
            {
                ret = handleShapeImageInGroup(drawingObjectsController, drawing, cur_grouped_object, e, x, y, pageIndex, bWord);
                if(ret)
                    return ret;
                break;
            }
            case AscDFH.historyitem_type_ChartSpace:
            {
                if(!drawingObjectsController.isSlideShow())
                {
                    var ret, i, title;
                    if(cur_grouped_object.hit(x, y))
                    {
                        var chart_titles = cur_grouped_object.getAllTitles();
                        for(i = 0; i < chart_titles.length; ++i)
                        {
                            title = chart_titles[i];
                            var hit_in_inner_area = title.hitInInnerArea(x, y);
                            var hit_in_path = title.hitInPath(x, y);
                            var hit_in_text_rect = title.hitInTextRect(x, y);
                            if(hit_in_inner_area && !hit_in_text_rect || hit_in_path)
                            {
                                if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                                {
                                    drawingObjectsController.checkChartTextSelection();
                                    drawingObjectsController.resetSelection();
                                    drawingObjectsController.selectObject(drawing, pageIndex);
                                    drawingObjectsController.selection.groupSelection = drawing;
                                    drawing.selectObject(cur_grouped_object, pageIndex);
                                    drawing.chartSelection = cur_grouped_object;
                                    drawing.selection.title = title;
                                    cur_grouped_object.selectTitle(title, pageIndex);
                                    drawingObjectsController.updateSelectionState();
                                    return true;
                                }
                                else
                                {
                                    return {objectId: drawing.Get_Id(), cursorType: "move", bMarker: false};
                                }
                            }
                            else if(hit_in_text_rect)
                            {
                                if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                                {
                                    drawingObjectsController.checkChartTextSelection();
                                    drawingObjectsController.resetSelection();
                                    drawingObjectsController.selectObject(drawing, pageIndex);
                                    drawingObjectsController.selection.groupSelection = drawing;
                                    drawing.selectObject(cur_grouped_object, pageIndex);
                                    drawing.selection.chartSelection = cur_grouped_object;
                                    cur_grouped_object.selectTitle(title, pageIndex);
                                    cur_grouped_object.selection.textSelection = title;
                                    title.selectionSetStart(e, x, y, pageIndex);
                                    drawingObjectsController.changeCurrentState(new AscFormat.TextAddState(drawingObjectsController, title, x, y));
                                    if(e.ClickCount <= 1)
                                    {
                                        drawingObjectsController.updateSelectionState();
                                    }
                                    return true;
                                }
                                else
                                {
                                    if(drawingObjectsController.document)
                                    {
                                        var content = title.getDocContent();
                                        var invert_transform_text = title.invertTransformText, tx, ty;
                                        if(content && invert_transform_text)
                                        {
                                            tx = invert_transform_text.TransformPointX(x, y);
                                            ty = invert_transform_text.TransformPointY(x, y);
                                            content.UpdateCursorType(tx, ty, 0);
                                        }
                                    }
                                    return {objectId: drawing.Get_Id(), cursorType: "text"};
                                }
                            }
                        }
                    }
                }
                ret = handleShapeImageInGroup(drawingObjectsController, drawing, cur_grouped_object, e, x, y, pageIndex, bWord);
                if(ret)
                    return ret;
                break;
            }
        }
    }
    return false;
}

function handleChartElements(drawing, drawingObjectsController, e, dTx, dTy, group, pageIndex, bWord) {

    var selector = group ? group : drawingObjectsController;
    var bSeries = false;
    if(drawing.chartObj)
    {
        var t = drawing.chartObj;
        var sortCharts = t._sortChartsForDrawing(drawing);
        var oCanvas = drawing.getCanvasContext();
        if( !Array.isArray(t.chart.sortZIndexPaths) || t.chart.sortZIndexPaths.length === 0)
        {
            for(var j = sortCharts.length - 1; j > -1; j--) {
                var id = sortCharts[j];
                var chartModel = t._getChartModelById(drawing.chart.plotArea, id);
                if(!chartModel) {
                    continue;
                }
                var oDrawChart = t.charts[id];

                var pointsPaths = oDrawChart.paths.points;
                if(Array.isArray(pointsPaths))
                {
                    for(var k = pointsPaths.length - 1; k > - 1 ; --k)
                    {
                        if(Array.isArray(pointsPaths[k]))
                        {
                            var aPointsPaths = pointsPaths[k];
                            for(var l = 0; l < aPointsPaths.length; ++l)
                            {
                                if(AscCommon.isRealObject(aPointsPaths[l]))
                                {
                                    if(AscFormat.isRealNumber(aPointsPaths[l].path))
                                    {
                                        var oPath = drawing.pathMemory.GetPath(aPointsPaths[l].path);
                                        if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
                                        {
                                            bSeries = true;
                                        }
                                    }

                                    if(bSeries)
                                    {

                                        if(drawing.selection.chart === id && drawing.selection.series === k)
                                        {
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.chart = id;
                                            drawing.selection.series = k;
                                            drawing.selection.markers = true;
                                            drawing.selection.datPoint = l;
                                        }
                                        else
                                        {
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.chart = id;
                                            drawing.selection.series = k;
                                            drawing.selection.markers = true;
                                            drawing.selection.datPoint = null;
                                        }
                                        break;
                                    }
                                }
                            }
                            if(l < aPointsPaths.length)
                            {
                                break;
                            }
                        }
                    }
                    if(k > -1)
                    {
                        break;
                    }
                }
                var seriesPaths = oDrawChart.paths.series;
                var bPie = chartModel.getObjectType() === AscDFH.historyitem_type_PieChart;

                if(Array.isArray(seriesPaths))
                {
                    for(var k = seriesPaths.length - 1; k > - 1 ; --k)
                    {
                        if(Array.isArray(seriesPaths[k]))
                        {
                            var aPointsPaths = seriesPaths[k];
                            for(var l = 0; l < aPointsPaths.length; ++l)
                            {
                                if(AscFormat.isRealNumber(aPointsPaths[l]))
                                {
                                    var oPath = drawing.pathMemory.GetPath(aPointsPaths[l]);
                                    if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
                                    {
                                        bSeries = true;
                                        if(bPie)
                                        {
                                            if(drawing.selection.series === 0)
                                            {
                                                selector.resetSelection();
                                                selector.selectObject(drawing, pageIndex);
                                                selector.selection.chartSelection = drawing;
                                                drawing.selection.chart = id;
                                                drawing.selection.series = 0;
                                                drawing.selection.datPoint = k;
                                            }
                                            else
                                            {
                                                selector.resetSelection();
                                                selector.selectObject(drawing, pageIndex);
                                                selector.selection.chartSelection = drawing;
                                                drawing.selection.chart = id;
                                                drawing.selection.series = 0;
                                                drawing.selection.datPoint = null;
                                            }
                                        }
                                        else
                                        {
                                            if(drawing.selection.chart === id && drawing.selection.series === k)
                                            {
                                                selector.resetSelection();
                                                selector.selectObject(drawing, pageIndex);
                                                selector.selection.chartSelection = drawing;
                                                drawing.selection.chart = id;
                                                drawing.selection.series = k;
                                                drawing.selection.datPoint = l;
                                            }
                                            else
                                            {
                                                selector.resetSelection();
                                                selector.selectObject(drawing, pageIndex);
                                                selector.selection.chartSelection = drawing;
                                                drawing.selection.chart = id;
                                                drawing.selection.series = k;
                                                drawing.selection.datPoint = null;
                                            }
                                        }
                                        break;
                                    }
                                }
                                if(Array.isArray(aPointsPaths[l]))
                                {
                                    var aPointsPaths2 = aPointsPaths[l];
                                    for(var z = 0; z < aPointsPaths2.length; ++z)
                                    {
                                        if(AscFormat.isRealNumber(aPointsPaths2[z]))
                                        {
                                            var oPath = drawing.pathMemory.GetPath(aPointsPaths2[z]);
                                            if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
                                            {
                                                bSeries = true;
                                                if(bPie)
                                                {
                                                    if(drawing.selection.series === 0)
                                                    {
                                                        selector.resetSelection();
                                                        selector.selectObject(drawing, pageIndex);
                                                        selector.selection.chartSelection = drawing;
                                                        drawing.selection.chart = id;
                                                        drawing.selection.series = 0;
                                                        drawing.selection.datPoint = k;
                                                    }
                                                    else
                                                    {
                                                        selector.resetSelection();
                                                        selector.selectObject(drawing, pageIndex);
                                                        selector.selection.chartSelection = drawing;
                                                        drawing.selection.chart = id;
                                                        drawing.selection.series = 0;
                                                        drawing.selection.datPoint = null;
                                                    }
                                                }
                                                else
                                                {

                                                    if(drawing.selection.chart === id && drawing.selection.series === k)
                                                    {
                                                        selector.resetSelection();
                                                        selector.selectObject(drawing, pageIndex);
                                                        selector.selection.chartSelection = drawing;
                                                        drawing.selection.chart = id;
                                                        drawing.selection.series = k;
                                                        drawing.selection.datPoint = l;
                                                    }
                                                    else
                                                    {
                                                        selector.resetSelection();
                                                        selector.selectObject(drawing, pageIndex);
                                                        selector.selection.chartSelection = drawing;
                                                        drawing.selection.chart = id;
                                                        drawing.selection.series = k;
                                                        drawing.selection.datPoint = null;
                                                    }
                                                }
                                                break;
                                            }
                                        }
                                    }
                                    if(z < aPointsPaths2.length)
                                    {
                                        break;
                                    }
                                }
                                else if(AscCommon.isRealObject(aPointsPaths[l]))
                                {
                                    // downPath: 1230
                                    // frontPath: []
                                    // insidePath: 1188
                                    // upPath: 1213
                                    if(AscFormat.isRealNumber(aPointsPaths[l].upPath))
                                    {
                                        var oPath = drawing.pathMemory.GetPath(aPointsPaths[l].upPath);
                                        if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
                                        {
                                            bSeries = true;
                                        }
                                    }
									var aFrontPaths = aPointsPaths[l].frontPath ||  aPointsPaths[l].frontPaths;
                                    if(!bSeries && Array.isArray(aFrontPaths))
                                    {
                                        for(var s = 0; s < aFrontPaths.length; ++s)
                                        {
											if(AscFormat.isRealNumber(aFrontPaths[s]))
											{
												var oPath = drawing.pathMemory.GetPath(aFrontPaths[s]);
												if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
												{
													bSeries = true;
													break;
												}
											}
                                        }
                                    }

									aFrontPaths = aPointsPaths[l].darkPaths;
									  if(!bSeries && Array.isArray(aFrontPaths))
                                    {
                                        for(var s = 0; s < aFrontPaths.length; ++s)
                                        {
											if(AscFormat.isRealNumber(aFrontPaths[s]))
											{
												var oPath = drawing.pathMemory.GetPath(aFrontPaths[s]);
												if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
												{
													bSeries = true;
													break;
												}
											}
                                        }
                                    }

                                    if(bSeries)
                                    {
                                        if(bPie)
                                        {
                                            if(drawing.selection.series === 0)
                                            {
                                                selector.resetSelection();
                                                selector.selectObject(drawing, pageIndex);
                                                selector.selection.chartSelection = drawing;
                                                drawing.selection.chart = id;
                                                drawing.selection.series = 0;
                                                drawing.selection.datPoint = k;
                                            }
                                            else
                                            {
                                                selector.resetSelection();
                                                selector.selectObject(drawing, pageIndex);
                                                selector.selection.chartSelection = drawing;
                                                drawing.selection.chart = id;
                                                drawing.selection.series = 0;
                                                drawing.selection.datPoint = null;
                                            }
                                        }
                                        else
                                        {
                                            if(drawing.selection.chart === id && drawing.selection.series === k)
                                            {
                                                selector.resetSelection();
                                                selector.selectObject(drawing, pageIndex);
                                                selector.selection.chartSelection = drawing;
                                                drawing.selection.chart = id;
                                                drawing.selection.series = k;
                                                drawing.selection.datPoint = l;
                                            }
                                            else
                                            {
                                                selector.resetSelection();
                                                selector.selectObject(drawing, pageIndex);
                                                selector.selection.chartSelection = drawing;
                                                drawing.selection.chart = id;
                                                drawing.selection.series = k;
                                                drawing.selection.datPoint = null;
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                            if(l < aPointsPaths.length)
                            {
                                break;
                            }
                        }
                        else
                        {
                            if(AscFormat.isRealNumber(seriesPaths[k]))
                            {
                                var oPath = drawing.pathMemory.GetPath(seriesPaths[k]);
                                if(oPath.hitInInnerArea(oCanvas, dTx, dTy))
                                {
                                    bSeries = true;
                                    if(bPie)
                                    {
                                        if(drawing.selection.series === 0)
                                        {
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.chart = id;
                                            drawing.selection.series = 0;
                                            drawing.selection.datPoint = k;
                                        }
                                        else
                                        {
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.chart = id;
                                            drawing.selection.series = 0;
                                            drawing.selection.datPoint = null;
                                        }
                                    }
                                    else
                                    {
                                        selector.resetSelection();
                                        selector.selectObject(drawing, pageIndex);
                                        selector.selection.chartSelection = drawing;
                                        drawing.selection.plotArea = null;
                                        drawing.selection.chart = id;
                                        drawing.selection.series = k;
                                        drawing.selection.datPoint = null;
                                    }
                                    break;
                                }
                            }
                        }
                    }
                    if(k > -1)
                    {
                        break;
                    }
                }
                else
                {
                    if(chartModel.getObjectType() === AscDFH.historyitem_type_StockChart)
                    {
                        seriesPaths = oDrawChart.paths.values;
                        if(Array.isArray(seriesPaths))
                        {
                            for(var k = 0; k < seriesPaths.length; ++k)
                            {
                                if(AscFormat.isRealNumber(seriesPaths[k].upBars))
                                {
                                    var oPath = drawing.pathMemory.GetPath(seriesPaths[k].upBars);
                                    if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
                                    {
                                        if(chartModel && chartModel.upDownBars && chartModel.upDownBars.upBars)
                                        {

                                            bSeries = true;
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.chart = id;
                                            drawing.selection.upBars = chartModel.upDownBars.upBars ;
                                            break;
                                        }
                                    }
                                }
                                else if(AscFormat.isRealNumber(seriesPaths[k].downBars))
                                {
                                    var oPath = drawing.pathMemory.GetPath(seriesPaths[k].downBars);
                                    if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
                                    {
                                        if(chartModel && chartModel.upDownBars && chartModel.upDownBars.downBars)
                                        {
                                            bSeries = true;
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.chart = id;
                                            drawing.selection.downBars = chartModel.upDownBars.downBars;
                                            break;
                                        }
                                    }
                                }
                                if(!bSeries && AscFormat.isRealNumber(seriesPaths[k].lowLines))
                                {
                                    var oPath = drawing.pathMemory.GetPath(seriesPaths[k].lowLines);
                                    if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
                                    {
                                        if(chartModel && chartModel.hiLowLines)
                                        {
                                            bSeries = true;
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.chart = id;
                                            drawing.selection.hiLowLines = chartModel.hiLowLines;
                                            break;
                                        }
                                    }
                                    var oPath = drawing.pathMemory.GetPath(seriesPaths[k].highLines);
                                    if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy))
                                    {
                                        if(chartModel && chartModel.hiLowLines)
                                        {
                                            bSeries = true;
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.chart = id;
                                            drawing.selection.hiLowLines = chartModel.hiLowLines;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

        }
        else
        {
            for(var i = t.chart.sortZIndexPaths.length - 1; i > -1; i--) {
                var oPathsObject = t.chart.sortZIndexPaths[i];
                if(AscFormat.isRealNumber(t.chart.sortZIndexPaths[i].paths))
                {
                    var oPath = drawing.pathMemory.GetPath(t.chart.sortZIndexPaths[i].paths);
                    if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy)) {
                        bSeries = true;
                    }
                }
                else
                {

                    if(!bSeries && AscFormat.isRealNumber(t.chart.sortZIndexPaths[i].frontPaths))
                    {
                        var oPath = drawing.pathMemory.GetPath(t.chart.sortZIndexPaths[i].frontPaths);
                        if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy)) {
                            bSeries = true;
                        }
                    }
                    if(!bSeries && AscFormat.isRealNumber(t.chart.sortZIndexPaths[i].darkPaths))
                    {
                        var oPath = drawing.pathMemory.GetPath(t.chart.sortZIndexPaths[i].darkPaths);
                        if(oPath.hitInInnerArea(oCanvas, dTx, dTy) || oPath.hitInPath(oCanvas, dTx, dTy)) {
                            bSeries = true;
                        }
                    }
                }
                if(bSeries)
                {
                    if(drawing.selection.chart === t.chart.chart.Id && drawing.selection.series === t.chart.sortZIndexPaths[i].seria)
                    {
                        selector.resetSelection();
                        selector.selectObject(drawing, pageIndex);
                        selector.selection.chartSelection = drawing;
                        drawing.selection.chart = t.chart.chart.Id;
                        drawing.selection.series = t.chart.sortZIndexPaths[i].seria;
                        drawing.selection.datPoint = t.chart.sortZIndexPaths[i].point;
                    }
                    else
                    {
                        selector.resetSelection();
                        selector.selectObject(drawing, pageIndex);
                        selector.selection.chartSelection = drawing;
                        drawing.selection.chart = t.chart.chart.Id;
                        drawing.selection.series = t.chart.sortZIndexPaths[i].seria;
                        drawing.selection.datPoint = null;
                    }
                    break;
                }
            }
        }

        if(!bSeries)
        {
			j = 0;
			if(Array.isArray(t.catAxisChart))
			{
				for(j = 0; j < t.catAxisChart.length; ++j)
				{
					var oAxObj = t.catAxisChart[j];
					if(oAxObj && oAxObj.paths)
					{
						if(oAxObj.catAx && oAxObj.catAx.compiledMajorGridLines && oAxObj.catAx.compiledMajorGridLines.isVisible()
							&& AscFormat.isRealNumber(oAxObj.paths.gridLines))//TODo Date Ax vehicle log book1.xlsx
						{
							var oPath = drawing.pathMemory.GetPath(oAxObj.paths.gridLines);
							if(oPath.hitInPath(oCanvas, dTx, dTy))
							{
								bSeries = true;
								selector.resetSelection();
								selector.selectObject(drawing, pageIndex);
								selector.selection.chartSelection = drawing;
								drawing.selection.axis = oAxObj.catAx;
								drawing.selection.majorGridlines = true;
								break;
							}
						}
						if(!bSeries && oAxObj.catAx && oAxObj.catAx.compiledMinorGridLines && oAxObj.catAx.compiledMinorGridLines.isVisible()
							&& AscFormat.isRealNumber(oAxObj.paths.minorGridLines))
						{
							var oPath = drawing.pathMemory.GetPath(oAxObj.paths.minorGridLines);
							if(oPath.hitInPath(oCanvas, dTx, dTy))
							{
								bSeries = true;
								selector.resetSelection();
								selector.selectObject(drawing, pageIndex);
								selector.selection.chartSelection = drawing;
								drawing.selection.axis = oAxObj.catAx;
								drawing.selection.minorGridlines = true;
								break;
							}
						}
					}
				}
			}
            if(!Array.isArray(t.catAxisChart) || j ===  t.catAxisChart.length)
            {
				if(Array.isArray(t.valAxisChart))
				{
					for(j = 0; j < t.valAxisChart.length; ++j)
					{
						var oAxObj = t.valAxisChart[j];
						if(oAxObj && oAxObj.paths)
						{
							if(oAxObj.valAx.compiledMajorGridLines && oAxObj.valAx.compiledMajorGridLines.isVisible() &&
								AscFormat.isRealNumber(oAxObj.paths.gridLines))
							{
								var oPath = drawing.pathMemory.GetPath(oAxObj.paths.gridLines);
								if(oPath.hitInPath(oCanvas, dTx, dTy))
								{
									bSeries = true;
									selector.resetSelection();
									selector.selectObject(drawing, pageIndex);
									selector.selection.chartSelection = drawing;
									drawing.selection.axis = oAxObj.valAx;
									drawing.selection.majorGridlines = true;
									break;
								}
							}
							if(!bSeries && oAxObj.valAx.compiledMinorGridLines && oAxObj.valAx.compiledMinorGridLines.isVisible() &&
								AscFormat.isRealNumber(oAxObj.paths.minorGridLines))
							{
								var oPath = drawing.pathMemory.GetPath(oAxObj.paths.minorGridLines);
								if(oPath.hitInPath(oCanvas, dTx, dTy))
								{
									bSeries = true;
									selector.resetSelection();
									selector.selectObject(drawing, pageIndex);
									selector.selection.chartSelection = drawing;
									drawing.selection.axis = oAxObj.valAx;
									drawing.selection.minorGridlines = true;
									break;
								}
							}
						}
					}
				}
            }
        }
    }
    return bSeries;
}

function handleInternalChart(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord)
{
    if(e.CtrlKey || (e.Button === AscCommon.g_mouse_button_right && drawingObjectsController.selectedObjects.length > 1)){
        return false;
    }
    var ret = false, i, title;
    if(drawing.hit(x, y))
    {
        var bClickFlag =  !window["IS_NATIVE_EDITOR"] && (drawingObjectsController.handleEventMode === AscFormat.HANDLE_EVENT_MODE_CURSOR || e.ClickCount < 2);
        var selector = group ? group : drawingObjectsController;
        var legend = drawing.getLegend();
        if(legend && legend.hit(x, y) && bClickFlag)
        {
            if(drawing.selection.legend !== legend)
            {
                if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                {
                    drawingObjectsController.checkChartTextSelection();
                    selector.resetSelection();
                    selector.selectObject(drawing, pageIndex);
                    selector.selection.chartSelection = drawing;
                    drawing.selection.legend = legend;
                    drawingObjectsController.updateSelectionState();
                    drawingObjectsController.updateOverlay();
                    return true;
                }
                else
                {
                    return {objectId: drawing.Get_Id(), cursorType: "move", bMarker: false};
                }
            }
            else
            {
                var aCalcEntries = legend.calcEntryes;
                for(var i = 0; i < aCalcEntries.length; ++i)
                {
                    if(aCalcEntries[i].hit(x, y))
                    {
                        if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                        {
                            drawingObjectsController.checkChartTextSelection();
                            selector.resetSelection();
                            selector.selectObject(drawing, pageIndex);
                            selector.selection.chartSelection = drawing;
                            drawing.selection.legend = legend;
                            drawing.selection.legendEntry = aCalcEntries[i].idx;
                            drawingObjectsController.updateSelectionState();
                            drawingObjectsController.updateOverlay();
                            return true;
                        }
                        else
                        {
                            return {objectId: drawing.Get_Id(), cursorType: "default", bMarker: false};
                        }
                    }
                }
                if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                {
                    if(AscFormat.isRealNumber(drawing.selection.legendEntry))
                    {
                        drawing.selection.legendEntry = null;
                        drawingObjectsController.updateSelectionState();
                        drawingObjectsController.updateOverlay();
                    }
                    return true;
                }
                else
                {
                    return {objectId: drawing.Get_Id(), cursorType: "move", bMarker: false};
                }
            }
        }


        if(bClickFlag){

            var aCharts = drawing.chart.plotArea.charts;
            var series = drawing.getAllSeries();
            var _len = aCharts.length === 1 && aCharts[0].getObjectType() === AscDFH.historyitem_type_PieChart ? 1 : series.length;
            for(var i = _len - 1; i > -1; --i)
            {
                var ser = series[i];
                var pts = AscFormat.getPtsFromSeries(ser);
                for(var j = 0; j < pts.length; ++j)
                {
                    if(pts[j].compiledDlb)
                    {
                        if(pts[j].compiledDlb.hit(x, y))
                        {
                            var nDlbl = drawing.selection.dataLbls;
                            if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                            {
                                drawingObjectsController.checkChartTextSelection();
                                selector.resetSelection();
                                selector.selectObject(drawing, pageIndex);
                                selector.selection.chartSelection = drawing;
                                drawing.selection.dataLbls = i;
                                if(nDlbl === i)
                                {
                                    drawing.selection.dataLbl = j;
                                }
                                drawingObjectsController.updateSelectionState();
                                drawingObjectsController.updateOverlay();
                                return true;
                            }
                            else
                            {
                                return {objectId: drawing.Get_Id(), cursorType: "default", bMarker: false};
                            }
                        }
                    }

                }
            }

        }

        var chart_titles = drawing.getAllTitles();
        var oApi = editor || Asc['editor'];
        var bIsMobileVersion = oApi && oApi.isMobileVersion;
        for(i = 0; i < chart_titles.length; ++i)
        {
            title = chart_titles[i];
            var hit_in_inner_area = title.hitInInnerArea(x, y);
            var hit_in_path = title.hitInPath(x, y);
            var hit_in_text_rect = title.hitInTextRect(x, y);
            if((hit_in_inner_area && (!hit_in_text_rect || drawing.selection.title !== title) || (hit_in_path && bIsMobileVersion !== true)) && !window["NATIVE_EDITOR_ENJINE"])
            {
                if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                {
                    var is_selected =  drawing.selected;
                    drawingObjectsController.checkChartTextSelection();
                    selector.resetSelection();
                    selector.selectObject(drawing, pageIndex);
                    selector.selection.chartSelection = drawing;
                    drawing.selectTitle(title, pageIndex);
                    drawingObjectsController.updateSelectionState();
                    drawingObjectsController.updateOverlay();

                    if(Asc["editor"] && Asc["editor"].wb)
                    {
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
                else
                {
                    return {objectId: drawing.Get_Id(), cursorType: "move", bMarker: false};
                }
            }
            else if(hit_in_text_rect)
            {
                if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                {
                    var oTargetTextObject = AscFormat.getTargetTextObject(drawingObjectsController);
                    if(title !== oTargetTextObject)
                    {
                        drawingObjectsController.checkChartTextSelection();
                        selector.resetSelection();
                        selector.selectObject(drawing, pageIndex);
                        selector.selection.chartSelection = drawing;
                        drawing.selectTitle(title, pageIndex);
                        drawing.selection.textSelection = title;
                    }
                    title.selectionSetStart(e, x, y, pageIndex);
                    drawingObjectsController.changeCurrentState(new AscFormat.TextAddState(drawingObjectsController, title, x, y));
                    if(e.ClickCount <= 1)
                    {
                        drawingObjectsController.updateSelectionState();
                    }
                    return true;
                }
                else
                {
                    if(drawingObjectsController.document)
                    {
                        var content = title.getDocContent();
                        var invert_transform_text = title.invertTransformText, tx, ty;
                        if(content && invert_transform_text)
                        {
                            tx = invert_transform_text.TransformPointX(x, y);
                            ty = invert_transform_text.TransformPointY(x, y);
                            content.UpdateCursorType(tx, ty, 0);
                        }
                    }
                    return {objectId: drawing.Get_Id(), cursorType: "text", title: title};
                }
            }
        }

        //todo gridlines

        //plotArea
        if(bClickFlag){
            var oChartSizes = drawing.getChartSizes(true);
            var oInvertTransform = drawing.invertTransform;
            var dTx = oInvertTransform.TransformPointX(x, y);
            var dTy = oInvertTransform.TransformPointY(x, y);
            if(dTx >= oChartSizes.startX && dTx <= oChartSizes.startX + oChartSizes.w
                && dTy >= oChartSizes.startY && dTy <= oChartSizes.startY + oChartSizes.h)
            {
                if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                {
                    if(drawing.selection.plotArea == null || !AscFormat.CChartsDrawer.prototype._isSwitchCurrent3DChart(drawing) || !drawing.chartObj  || !drawing.chartObj.processor3D || !drawingObjectsController.canEdit())
                    {
                        drawingObjectsController.checkChartTextSelection();

                        var bSeries =  handleChartElements(drawing, drawingObjectsController, e, dTx, dTy, group, pageIndex, bWord);

                        if(!bSeries)
                        {
                            var oLabels;
                            var aAxes = drawing.chart.plotArea.axId;
                            for(var i = 0; i < aAxes.length; ++i){
                                if(aAxes[i].labels){
                                    oLabels = aAxes[i].labels;
                                    if(oLabels.hit(x, y))
                                    {
                                        if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                                        {
                                            drawingObjectsController.checkChartTextSelection();
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.axisLbls = oLabels.axis;
                                            drawingObjectsController.updateSelectionState();
                                            drawingObjectsController.updateOverlay();
                                            return true;
                                        }
                                        else
                                        {
                                            return {objectId: drawing.Get_Id(), cursorType: "default", bMarker: false};
                                        }
                                    }
                                }
                            }
                            selector.resetSelection();
                            selector.selectObject(drawing, pageIndex);
                            selector.selection.chartSelection = drawing;
                            drawing.selection.plotArea = drawing.chart.plotArea;
                        }
                    }
                    else
                    {

                        var bSeries = false;
                        if(AscFormat.CChartsDrawer.prototype._isSwitchCurrent3DChart(drawing))
                        {
                            bSeries = handleChartElements(drawing, drawingObjectsController, e, dTx, dTy, group, pageIndex, bWord);
                        }
                        if(!bSeries)
                        {

                            var oLabels;
                            var aAxes = drawing.chart.plotArea.axId;
                            for(var i = 0; i < aAxes.length; ++i){
                                if(aAxes[i].labels){
                                    oLabels = aAxes[i].labels;
                                    if(oLabels.hit(x, y))
                                    {
                                        if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                                        {
                                            drawingObjectsController.checkChartTextSelection();
                                            selector.resetSelection();
                                            selector.selectObject(drawing, pageIndex);
                                            selector.selection.chartSelection = drawing;
                                            drawing.selection.axisLbls = oLabels.axis;
                                            drawingObjectsController.updateSelectionState();
                                            drawingObjectsController.updateOverlay();
                                            return true;
                                        }
                                        else
                                        {
                                            return {objectId: drawing.Get_Id(), cursorType: "default", bMarker: false};
                                        }
                                    }
                                }
                            }


                            drawing.selection.plotArea = drawing.chart.plotArea;
                            drawing.selection.rotatePlotArea = true;

                            drawingObjectsController.updateSelectionState();
                            drawingObjectsController.updateOverlay();

                            drawingObjectsController.arrPreTrackObjects.length = 0;
                            drawingObjectsController.arrPreTrackObjects.push(new AscFormat.Chart3dAdjustTrack(drawing, 0, x, y));
                            if(!isRealObject(group))
                            {
                                drawingObjectsController.changeCurrentState(new AscFormat.PreChangeAdjState(drawingObjectsController, drawing));
                            }
                            else
                            {
                                drawingObjectsController.changeCurrentState(new AscFormat.PreChangeAdjInGroupState(drawingObjectsController, group));
                            }
                            var bOldIsLocked = e.IsLocked;
                            e.IsLocked = true;
                            drawingObjectsController.OnMouseMove(e, x, y, pageIndex);
                            e.IsLocked = bOldIsLocked;
                            return true;
                        }
                    }



                    drawingObjectsController.updateSelectionState();
                    drawingObjectsController.updateOverlay();
                    return true;
                }
                else
                {
                    return {objectId: drawing.Get_Id(), cursorType: "default", bMarker: false};
                }
            }
        }

        var oLabels;
        var aAxes = drawing.chart.plotArea.axId;
        for(var i = 0; i < aAxes.length; ++i){
            if(aAxes[i].labels){
                oLabels = aAxes[i].labels;
                if(oLabels.hit(x, y))
                {
                    if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
                    {
                        drawingObjectsController.checkChartTextSelection();
                        selector.resetSelection();
                        selector.selectObject(drawing, pageIndex);
                        selector.selection.chartSelection = drawing;
                        drawing.selection.axisLbls = oLabels.axis;
                        drawingObjectsController.updateSelectionState();
                        drawingObjectsController.updateOverlay();
                        return true;
                    }
                    else
                    {
                        return {objectId: drawing.Get_Id(), cursorType: "default", bMarker: false};
                    }
                }
            }
        }

    }
    return ret;
}

function handleChart(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord)
{
    var ret = !drawingObjectsController.isSlideShow() && handleInternalChart(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord);
    if(ret)
    {
        return ret;
    }
    ret = handleShapeImage(drawing, drawingObjectsController, e, x, y, group, pageIndex, bWord);
    if(ret)
        return ret;
    return false;
}


function handleInlineShapeImage(drawing, drawingObjectsController, e, x, y, pageIndex)
{
    var _hit = drawing.hit && drawing.hit(x, y);
    var _hit_to_path = drawing.hitInPath && drawing.hitInPath(x, y);
    var b_hit_to_text = drawing.hitInTextRect && drawing.hitInTextRect(x, y);
    if((_hit && !b_hit_to_text) || _hit_to_path)
    {
        return handleInlineHitNoText(drawing, drawingObjectsController, e, x, y, pageIndex, false);
    }
    else if(b_hit_to_text)
    {
        if(drawing.bWordShape /*&& (!drawing.txWarpStruct || drawingObjectsController.curState.startTargetTextObject === drawing || drawing.haveSelectedDrawingInContent && drawing.haveSelectedDrawingInContent())*/)
        {
            var all_drawings = drawing.getDocContent().GetAllDrawingObjects();
            var drawings2 = [];
            for(var i = 0; i < all_drawings.length; ++i)
            {
                drawings2.push(all_drawings[i].GraphicObj);
            }
            var ret = handleInlineObjects(drawingObjectsController, drawings2, e, x, y, pageIndex, true);
            if(ret)
                return ret;
        }
        return drawingObjectsController.handleTextHit(drawing, e, x, y, null, pageIndex, true);
    }
}

function handleInlineChart(drawing, drawingObjectsController, e, x, y, pageIndex)
{
    var ret = handleInternalChart(drawing, drawingObjectsController, e, x, y, null, pageIndex, true);
    if(ret)
    {
        return ret;
    }
    return handleInlineShapeImage(drawing, drawingObjectsController, e, x, y, pageIndex);
}

function handleInlineHitNoText(drawing, drawingObjects, e, x, y, pageIndex, bInSelect)
{
    var selected_objects = drawingObjects.selectedObjects;
    if(!(e.CtrlKey || e.ShiftKey)
        || selected_objects.length === 0 ||
        selected_objects.length === 1 && selected_objects[0] === drawing)
    {
        if(drawingObjects.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
        {
            var bIsSelected = drawing.selected;
            drawingObjects.checkChartTextSelection();
            drawingObjects.resetSelection();
            drawing.select(drawingObjects, pageIndex);
            drawingObjects.changeCurrentState(new AscFormat.PreMoveInlineObject(drawingObjects, drawing, bIsSelected, !bInSelect, pageIndex, x, y));
            if(e.ClickCount > 1 && !e.ShiftKey && !e.CtrlKey && ((drawingObjects.selection.groupSelection && drawingObjects.selection.groupSelection.selectedObjects.length === 1) || drawingObjects.selectedObjects.length === 1))
            {
                if (drawing.getObjectType() === AscDFH.historyitem_type_ChartSpace && drawingObjects.handleChartDoubleClick)
                    drawingObjects.handleChartDoubleClick(drawing.parent, drawing, e, x, y, pageIndex);
                else if (drawing.getObjectType() === AscDFH.historyitem_type_OleObject && drawingObjects.handleChartDoubleClick){
                    drawingObjects.handleOleObjectDoubleClick(drawing.parent, drawing, e, x, y, pageIndex);
                }
                else if (drawing.signatureLine && drawingObjects.handleSignatureDblClick){
                    drawingObjects.handleSignatureDblClick(drawing.signatureLine.id, drawing.extX, drawing.extY);
                }
                else if (2 == e.ClickCount && drawing.parent instanceof ParaDrawing && drawing.parent.Is_MathEquation())
                {
                    drawingObjects.handleMathDrawingDoubleClick(drawing.parent, e, x, y, pageIndex);
                }
            }
            drawingObjects.updateOverlay();
            return true;
        }
        else
        {
            return {objectId: drawing.Get_Id(), cursorType:"move"};
        }
    }
    if(drawingObjects.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
    {
        return {objectId: drawing.Get_Id(), cursorType:"move"};
    }
    return false;
}
function handleInlineObjects(drawingObjectsController, drawingArr, e, x, y, pageIndex, bWord)
{
    var i;
    var drawing, ret;
    for(i = drawingArr.length-1; i > -1; --i)
    {
        drawing = drawingArr[i];

        if(drawing.parent && AscFormat.isRealNumber(drawing.parent.LineTop) && AscFormat.isRealNumber(drawing.parent.LineBottom))
        {
            if(y < drawing.parent.LineTop || y > drawing.parent.LineBottom)
            {
                continue;
            }
        }
        switch(drawing.getObjectType())
        {
            case AscDFH.historyitem_type_Shape:
            case AscDFH.historyitem_type_ImageShape:
            case AscDFH.historyitem_type_OleObject:
            case AscDFH.historyitem_type_Cnx:
            case AscDFH.historyitem_type_LockedCanvas:
            {
                ret = handleInlineShapeImage(drawing, drawingObjectsController, e, x, y, pageIndex);
                if(ret)
                    return ret;
                break;
            }
            case AscDFH.historyitem_type_ChartSpace:
            {
                ret  = handleInlineChart(drawing, drawingObjectsController, e, x, y, pageIndex);
                if(ret)
                    return ret;
                break;
            }
            case AscDFH.historyitem_type_GroupShape:
            {
                ret = handleGroup(drawing, drawingObjectsController, e, x, y, null, pageIndex, bWord);
                if(ret)
                    return ret;
                break;
            }
        }
    }
    return false;
}

function handleMouseUpPreMoveState(drawingObjects, e, x, y, pageIndex, bWord)
{
    var state = drawingObjects.curState;
    state.drawingObjects.clearPreTrackObjects();
    state.drawingObjects.changeCurrentState(new AscFormat.NullState(state.drawingObjects));
    var bHandle = false;
    if(!state.shift && !state.ctrl && state.bInside && state.majorObjectIsSelected && e.Button !== AscCommon.g_mouse_button_right)
    {
        switch (state.majorObject.getObjectType())
        {
            case AscDFH.historyitem_type_GroupShape:
            {
                state.drawingObjects.checkChartTextSelection();
                state.drawingObjects.resetSelection();
                state.drawingObjects.selectObject(state.majorObject, pageIndex);
                state.drawingObjects.selection.groupSelection = state.majorObject;
                state.drawingObjects.OnMouseDown(e,x, y,pageIndex);
                state.drawingObjects.OnMouseUp(e, x, y, pageIndex);
                state.drawingObjects.drawingObjects && state.drawingObjects.drawingObjects.sendGraphicObjectProps &&  state.drawingObjects.drawingObjects.sendGraphicObjectProps();
                state.drawingObjects.document && state.drawingObjects.document.Document_UpdateInterfaceState();
                bHandle = true;
                break;
            }
            case AscDFH.historyitem_type_ChartSpace:
            {
                break;
            }
            case AscDFH.historyitem_type_ImageShape:
            {

                break;
            }
        }
    }
    if(!bHandle)
    {
        if(!state.shift && !state.ctrl && state.bInside && state.majorObject.getObjectType() === AscDFH.historyitem_type_ImageShape)
        {
            var sMediaName = state.majorObject.getMediaFileName();
            if(sMediaName)
            {
                var oApi = state.drawingObjects.getEditorApi();
                if(oApi && oApi.showVideoControl)
                {
                    oApi.showVideoControl(sMediaName, state.majorObject.extX, state.majorObject.extY, state.majorObject.transform);
                    bHandle = true;
                }
            }
        }
    }
    if(!bHandle)
    {


        if(e.CtrlKey && state.majorObjectIsSelected)
        {
            drawingObjects.deselectObject(state.majorObject);
            state.drawingObjects.drawingObjects && state.drawingObjects.drawingObjects.sendGraphicObjectProps &&  state.drawingObjects.drawingObjects.sendGraphicObjectProps();
            state.drawingObjects.document && state.drawingObjects.document.Document_UpdateInterfaceState();
            drawingObjects.updateOverlay();
        }
    }
}

function handleFloatTable(drawing, drawingObjectsController, e, x, y, group, pageIndex)
{
    if(drawing.hitInBoundingRect(x, y))
    {
        return drawingObjectsController.handleMoveHit(drawing, e, x, y, group, false, pageIndex, false);
    }
    else
    {
        if(drawing.hitInInnerArea(x, y))
        {
            var content, invert_transform_text, tx, ty, hit_paragraph, par, check_hyperlink;
            if(drawingObjectsController.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
            {
                drawingObjectsController.resetSelection(true);
                (group ? group : drawingObjectsController).selectObject(drawing,pageIndex);
                if(!group)
                {
                    drawingObjectsController.selection.textSelection = drawing;
                    drawing.selectionSetStart(e, x, y, pageIndex);
                }
                else
                {
                    group.selection.textSelection = drawing;
                    drawing.selectionSetStart(e, x, y, pageIndex);
                    drawingObjectsController.selectObject(group, pageIndex);
                    drawingObjectsController.selection.groupSelection = group;
                }
                drawingObjectsController.changeCurrentState(new AscFormat.TextAddState(drawingObjectsController, drawing, x, y));
                return true;
            }
            else
            {
                drawing.updateCursorType(x, y, e);
                return {objectId: drawing.Get_Id(), cursorType: "text", updated: true};
            }
        }
    }
    return false;
}

    //--------------------------------------------------------export----------------------------------------------------
    window['AscFormat'] = window['AscFormat'] || {};
    window['AscFormat'].CheckCoordsNeedPage = CheckCoordsNeedPage;
    window['AscFormat'].handleSelectedObjects = handleSelectedObjects;
    window['AscFormat'].handleFloatObjects = handleFloatObjects;
    window['AscFormat'].handleInlineObjects = handleInlineObjects;
    window['AscFormat'].handleMouseUpPreMoveState = handleMouseUpPreMoveState;
})(window);
