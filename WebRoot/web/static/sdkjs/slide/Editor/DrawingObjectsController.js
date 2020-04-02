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
var DrawingObjectsController = AscFormat.DrawingObjectsController;
var HANDLE_EVENT_MODE_HANDLE = AscFormat.HANDLE_EVENT_MODE_HANDLE;
var MOVE_DELTA = AscFormat.MOVE_DELTA;

var History = AscCommon.History;


DrawingObjectsController.prototype.getTheme = function()
{
    return this.drawingObjects.getTheme();
};

DrawingObjectsController.prototype.fitImagesToSlide = function()
{
    this.checkSelectedObjectsAndCallback(function () {
        var oApi = this.getEditorApi();
        if(!oApi)
        {
            return;
        }
        var aSelectedObjects = this.selection.groupSelection ? this.selection.groupSelection.selectedObjects : this.selectedObjects;
        var dWidth =   this.drawingObjects.Width;
        var dHeight =   this.drawingObjects.Height;
        for(var i = 0; i < aSelectedObjects.length; ++i)
        {
            var oDrawing = aSelectedObjects[i];
            if(oDrawing.getObjectType() === AscDFH.historyitem_type_ImageShape)
            {
                var sImageId = oDrawing.getImageUrl();
                if(typeof sImageId === "string")
                {
                    sImageId = AscCommon.getFullImageSrc2(sImageId);
                    var _image = oApi.ImageLoader.map_image_index[sImageId];
                    if(_image && _image.Image)
                    {
                        var __w = Math.max((_image.Image.width * AscCommon.g_dKoef_pix_to_mm), 1);
                        var __h = Math.max((_image.Image.height * AscCommon.g_dKoef_pix_to_mm), 1);
                        var fKoeff = 1.0/Math.max(__w/dWidth, __h/dHeight);
                        var _w      = Math.max(5, __w*fKoeff);
                        var _h      = Math.max(5, __h*fKoeff);
                        AscFormat.CheckSpPrXfrm(oDrawing, true);
                        oDrawing.spPr.xfrm.setOffX((dWidth - _w)/ 2.0);
                        oDrawing.spPr.xfrm.setOffY((dHeight - _h)/ 2.0);
                        oDrawing.spPr.xfrm.setExtX(_w);
                        oDrawing.spPr.xfrm.setExtY(_h);
                    }
                }
            }
        }
    }, [], false, AscDFH.historydescription_Presentation_FitImagesToSlide)
};


DrawingObjectsController.prototype.getDrawingArray = function()
{
    return this.drawingObjects.getDrawingsForController();
};


DrawingObjectsController.prototype.isViewMode = function()
{
    return this.drawingObjects.isViewerMode();
};

DrawingObjectsController.prototype.recalculateCurPos = function(bUpdateX, bUpdateY){
    var oTargetDocContent = this.getTargetDocContent(undefined, true);
    if(oTargetDocContent){
        oTargetDocContent.RecalculateCurPos(bUpdateX, bUpdateY);
        editor.WordControl.m_oLogicDocument.NeedUpdateTargetForCollaboration = true;
    }
};

DrawingObjectsController.prototype.getColorMap = function()
{

    if(this.drawingObjects )
    {
        if(this.drawingObjects.clrMap)
        {
            return this.drawingObjects.clrMap;
        }
        else if(this.drawingObjects.Layout )
        {
            if(this.drawingObjects.Layout.clrMap)
            {
                return this.drawingObjects.Layout.clrMap;
            }
            else if(this.drawingObjects.Layout.Master)
            {
                if(this.drawingObjects.Layout.Master.clrMap)
                {
                    return this.drawingObjects.Layout.Master.clrMap;
                }
            }
        }
        else if(this.drawingObjects.Master )
        {
            if(this.drawingObjects.Master.clrMap)
            {
                return this.drawingObjects.Master.clrMap;
            }
        }
    }
    return AscFormat.G_O_DEFAULT_COLOR_MAP;
};



DrawingObjectsController.prototype.handleOleObjectDoubleClick = function(drawing, oleObject, e, x, y, pageIndex)
{
    var oPresentation = editor && editor.WordControl && editor.WordControl.m_oLogicDocument;
    if(oPresentation && (false === oPresentation.Document_Is_SelectionLocked(AscCommon.changestype_Drawing_Props) || !oPresentation.CanEdit()))
    {
        var pluginData = new Asc.CPluginData();
        pluginData.setAttribute("data", oleObject.m_sData);
        pluginData.setAttribute("guid", oleObject.m_sApplicationId);
        pluginData.setAttribute("width", oleObject.extX);
        pluginData.setAttribute("height", oleObject.extY);
        pluginData.setAttribute("widthPix", oleObject.m_nPixWidth);
        pluginData.setAttribute("heightPix", oleObject.m_nPixHeight);
        pluginData.setAttribute("objectId", oleObject.Id);
        editor.asc_pluginRun(oleObject.m_sApplicationId, 0, pluginData);
    }
    this.clearTrackObjects();
    this.clearPreTrackObjects();
    this.changeCurrentState(new AscFormat.NullState(this));
    oPresentation.OnMouseUp(e, x, y, pageIndex);
};

DrawingObjectsController.prototype.checkSelectedObjectsAndCallback = function(callback, args, bNoSendProps, nHistoryPointType, aAdditionaObjects)
{
    var check_type = AscCommon.changestype_Drawing_Props, comment;
    var aCommentData = undefined;
    if(this.drawingObjects.slideComments)
    {
        comment = this.drawingObjects.slideComments.getSelectedComment();
        if(comment)
        {
            check_type = AscCommon.changestype_MoveComment;
            aCommentData = [
                {
                    comment: comment,
                    slide: this.drawingObjects
                }
            ];
        }
    }
    if(editor.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(check_type, aCommentData, undefined, aAdditionaObjects) === false)
    {
        var nPointType = AscFormat.isRealNumber(nHistoryPointType) ? nHistoryPointType : AscDFH.historydescription_CommonControllerCheckSelected;
        History.Create_NewPoint(nPointType);
        callback.apply(this, args);
        this.startRecalculate();
    }
};
DrawingObjectsController.prototype.startRecalculate = function()
{
    editor.WordControl.m_oLogicDocument.Recalculate();
//    editor.WordControl.m_oLogicDocument.Document_UpdateInterfaceState();
};

DrawingObjectsController.prototype.getDrawingObjects = function()
{
    return this.drawingObjects.cSld.spTree;
};

DrawingObjectsController.prototype.paragraphFormatPaste = function( CopyTextPr, CopyParaPr, Bool )
{
    var _this = this;
    this.checkSelectedObjectsAndCallback(function()
    {
        this.applyTextFunction(CDocumentContent.prototype.PasteFormatting, CTable.prototype.PasteFormatting, [CopyTextPr, CopyParaPr, Bool]);
    }, [CopyTextPr, CopyParaPr, Bool], false, AscDFH.historydescription_Presentation_ParaFormatPaste);
};


DrawingObjectsController.prototype.paragraphFormatPaste2 = function()
{
    return this.paragraphFormatPaste(editor.WordControl.m_oLogicDocument.CopyTextPr, null, true);
};
DrawingObjectsController.prototype.getDrawingDocument = function()
{
    return editor.WordControl.m_oDrawingDocument;
};

DrawingObjectsController.prototype.onMouseDown = function(e, x, y)
{
    var ret = this.curState.onMouseDown(e, x, y, 0);
    if(e.ClickCount < 2)
    {
        this.updateOverlay();
        this.updateSelectionState();
    }
    return ret;
};

DrawingObjectsController.prototype.OnMouseDown = DrawingObjectsController.prototype.onMouseDown;

DrawingObjectsController.prototype.onMouseMove = function(e, x, y)
{
    this.curState.onMouseMove(e, x, y, 0);
};
DrawingObjectsController.prototype.OnMouseMove = DrawingObjectsController.prototype.onMouseMove;


DrawingObjectsController.prototype.onMouseUp = function(e, x, y)
{
    this.curState.onMouseUp(e, x, y, 0);
};
DrawingObjectsController.prototype.OnMouseUp = DrawingObjectsController.prototype.onMouseUp;


DrawingObjectsController.prototype.convertPixToMM = function(pix)
{
    return editor.WordControl.m_oDrawingDocument.GetMMPerDot(pix);
};


DrawingObjectsController.prototype.resetSelect = function()
{
    this.checkChartTextSelection(true);
    this.resetSelection();
    this.clearPreTrackObjects();
    this.clearTrackObjects();
    this.changeCurrentState(new AscFormat.NullState(this));
};




DrawingObjectsController.prototype.checkSelectedObjectsAndFireCallback = function(callback, args)
{
    var check_type = AscCommon.changestype_Drawing_Props, comment;
    var aCommentData = undefined;
    if(this.drawingObjects.slideComments)
    {
        comment = this.drawingObjects.slideComments.getSelectedComment();
        if(comment)
        {
            check_type = AscCommon.changestype_MoveComment;
            aCommentData = [
                {
                    comment: comment,
                    slide: this.drawingObjects
                }
            ];
        }
    }
    if(editor.WordControl.m_oLogicDocument.Document_Is_SelectionLocked(check_type, aCommentData) === false)
    {
        callback.apply(this, args);
        this.startRecalculate();
    }
};


DrawingObjectsController.prototype.showChartSettings  =  function()
{
    editor.asc_doubleClickOnChart(this.getChartObject());
    this.changeCurrentState(new AscFormat.NullState(this));
};
DrawingObjectsController.prototype.getColorMapOverride  =  function()
{
    return this.drawingObjects.Get_ColorMap();
};
DrawingObjectsController.prototype.editChart = function(binary)
{
    var chart_space = this.getChartSpace2(binary, null);
    chart_space.setParent(this.drawingObjects);
    var by_types, i;
    by_types = AscFormat.getObjectsByTypesFromArr(this.selectedObjects, true);
    var aSelectedCharts = [];
    for(i = 0; i < by_types.charts.length; ++i)
    {
        if(by_types.charts[i].selected)
        {
            aSelectedCharts.push(by_types.charts[i]);
        }
    }
    if(aSelectedCharts.length === 1)
    {
        if(aSelectedCharts[0].group)
        {
            var parent_group = aSelectedCharts[0].group;
            var major_group = aSelectedCharts[0].getMainGroup();
            for(i = parent_group.spTree.length -1; i > -1; --i)
            {
                if(parent_group.spTree[i] === aSelectedCharts[0])
                {
                    parent_group.removeFromSpTreeByPos(i);
                    chart_space.setGroup(parent_group);
                    chart_space.spPr.xfrm.setOffX(aSelectedCharts[0].spPr.xfrm.offX);
                    chart_space.spPr.xfrm.setOffY(aSelectedCharts[0].spPr.xfrm.offY);
                    parent_group.addToSpTree(i, chart_space);
                    parent_group.updateCoordinatesAfterInternalResize();
                    major_group.recalculate();
                    if(this.selection.groupSelection)
                    {
                        this.selection.groupSelection.resetSelection();
                        this.selection.groupSelection.selectObject(chart_space, this.drawingObjects.num);
                    }
                    this.startRecalculate();
                    return;
                }
            }
        }
        else
        {
            chart_space.spPr.xfrm.setOffX(aSelectedCharts[0].x);
            chart_space.spPr.xfrm.setOffY(aSelectedCharts[0].y);
            var pos = aSelectedCharts[0].deleteDrawingBase();
            chart_space.addToDrawingObjects(pos);
            chart_space.setTitle(binary["cTitle"]);
            chart_space.setDescription(binary["cDescription"]);
            this.resetSelection();
            this.selectObject(chart_space, this.drawingObjects.num);
            this.startRecalculate();
            this.updateOverlay();
        }
    }
};

DrawingObjectsController.prototype.handleSlideComments  =  function(e, x, y, pageIndex)
{

    if(!this.drawingObjects.slideComments){
        return;
    }
    if(this.isSlideShow && this.isSlideShow())
    {
        return false;
    }
    var comments = this.drawingObjects.slideComments.comments, i, index_selected = -1;
    var ret = {result: null, selectedIndex: -1};
    if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
    {

        editor.asc_hideComments();
        for(i = comments.length - 1; i > -1; --i)
        {
            if(comments[i].selected)
            {
                index_selected = i;
            }
            comments[i].selected = false;
        }
    }

    for(i = comments.length - 1; i > -1; --i)
    {
        if(comments[i].hit(x, y))
        {
            if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
            {
                this.resetSelection();
                comments[i].selected = true;
                this.addPreTrackObject(new AscFormat.MoveComment(comments[i]));
                this.changeCurrentState(new PreMoveCommentState(this, x, y, comments[i]));
                if(i !== index_selected)
                {
                    this.drawingObjects.showDrawingObjects(true);
                }
                ret.result = true;
                ret.selectedIndex = index_selected;
                return ret;
            }
            else
            {
                ret.result = {objectId: comments[i], cursorType: "move"};
                ret.selectedIndex = index_selected;
                return ret;
            }
        }
    }
    if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
    {
        ret.result = false;
        ret.selectedIndex = index_selected;
        if(-1 !== index_selected)
        {
            this.drawingObjects.showDrawingObjects(true);
        }
        return ret;
    }
    else
    {
        ret.result = null;
        ret.selectedIndex = index_selected;
        return ret;
    }

};

function PreMoveCommentState(drawingObjects, startX, startY, comment)
{
    this.drawingObjects = drawingObjects;
    this.startX = startX;
    this.startY = startY;
    this.comment = comment;
}

PreMoveCommentState.prototype =
{
    onMouseDown: function(e, x, y, pageIndex)
    {
        if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
        {
            return true;
        }
        else
        {
            return {objectId: this.comment, cursorType: "move"}
        }
    },

    onMouseMove: function(e, x, y, pageIndex)
    {
        if(Math.abs(this.startX - x) < MOVE_DELTA && Math.abs(this.startY - y) < MOVE_DELTA)
            return;
        this.drawingObjects.swapTrackObjects();
        this.drawingObjects.changeCurrentState(new MoveCommentState(this.drawingObjects, this.startX, this.startY, this.comment));
        this.drawingObjects.onMouseMove(e, x, y);
    },

    onMouseUp: function(e, x, y, pageIndex)
    {
        var Coords = editor.WordControl.m_oDrawingDocument.ConvertCoordsToCursorWR_Comment( this.comment.x, this.comment.y, this.drawingObjects.num);
        editor.sync_HideComment();
        editor.sync_ShowComment(this.comment.Id, Coords.X, Coords.Y );
        editor.WordControl.m_oLogicDocument.noShowContextMenu = true;
        this.drawingObjects.clearPreTrackObjects();
        this.drawingObjects.changeCurrentState(new AscFormat.NullState(this.drawingObjects));
    }
};

function MoveCommentState(drawingObjects, startX, startY, comment)
{
    this.drawingObjects = drawingObjects;
    this.startX = startX;
    this.startY = startY;
    this.comment = comment;
}

MoveCommentState.prototype =
{
    onMouseDown: function(e, x, y, pageIndex)
    {
        if(this.handleEventMode === HANDLE_EVENT_MODE_HANDLE)
        {
            return true;
        }
        else
        {
            return {objectId: this.comment, cursorType: "move"}
        }
    },

    onMouseMove: function(e, x, y, pageIndex)
    {
        var dx = x - this.startX;
        var dy = y - this.startY;
        this.drawingObjects.arrTrackObjects[0].track(dx, dy);
        this.drawingObjects.updateOverlay();
    },

    onMouseUp: function(e, x, y, pageIndex)
    {
        var oPresentation = editor.WordControl.m_oLogicDocument;
        var aCommentsData = [
            {
                comment: this.comment,
                slide: this.drawingObjects.drawingObjects
            }
        ];
        if(oPresentation.Document_Is_SelectionLocked(AscCommon.changestype_MoveComment, aCommentsData, oPresentation.IsEditCommentsMode()) === false)
        {
            History.Create_NewPoint(AscDFH.historydescription_Presentation_MoveComments);
            var tracks = this.drawingObjects.arrTrackObjects;
            for(var i = 0; i < tracks.length; ++i)
            {
                tracks[i].trackEnd();
            }
            this.drawingObjects.startRecalculate();
            this.drawingObjects.drawingObjects.showDrawingObjects();
        }
        this.drawingObjects.clearTrackObjects();
        this.drawingObjects.updateOverlay();
        this.drawingObjects.changeCurrentState(new AscFormat.NullState(this.drawingObjects));

    }
};
