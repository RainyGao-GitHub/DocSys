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
    var DrawingObjectsController = AscFormat.DrawingObjectsController;

    var History = AscCommon.History;

if(window.editor === "undefined" && window["Asc"]["editor"])
{
    window.editor = window["Asc"]["editor"];
	window.editor;
}

// ToDo убрать это отсюда!!!
AscCommon.CContentChangesElement.prototype.Refresh_BinaryData = function()
{
    if(this.m_aPositions.length > 0){
        this.m_pData.Pos = this.m_aPositions[0];
    }
    this.m_pData.UseArray = true;
    this.m_pData.PosArray = this.m_aPositions;
	if(editor && editor.isPresentationEditor)
	{
		var Binary_Writer = History.BinaryWriter;
		var Binary_Pos = Binary_Writer.GetCurPosition();

        this.m_pData.Data.UseArray = true;
        this.m_pData.Data.PosArray = this.m_aPositions;

        Binary_Writer.WriteString2(this.m_pData.Class.Get_Id());
        Binary_Writer.WriteLong(this.m_pData.Data.Type);
        this.m_pData.Data.WriteToBinary(Binary_Writer);
		var Binary_Len = Binary_Writer.GetCurPosition() - Binary_Pos;

		this.m_pData.Binary.Pos = Binary_Pos;
		this.m_pData.Binary.Len = Binary_Len;
	}
};

function CheckIdSatetShapeAdd(state)
{
    return !(state instanceof AscFormat.NullState);
}
DrawingObjectsController.prototype.getTheme = function()
{
    return window["Asc"]["editor"].wbModel.theme;
};

DrawingObjectsController.prototype.getDrawingArray = function()
{
    var ret = [];
    var drawing_bases = this.drawingObjects.getDrawingObjects();
    for(var i = 0; i < drawing_bases.length; ++i)
    {
        ret.push(drawing_bases[i].graphicObject);
    }
    return ret;
};

DrawingObjectsController.prototype.setTableProps = function(props)
{
    var by_type = this.getSelectedObjectsByTypes();
    if(by_type.tables.length === 1)
    {
        var sCaption = props.TableCaption;
        var sDescription = props.TableDescription;
        var dRowHeight = props.RowHeight;
        by_type.tables[0].setTitle(sCaption);
        by_type.tables[0].setDescription(sDescription);
        props.TableCaption = undefined;
        props.TableDescription = undefined;
        var bIgnoreHeight = false;
        if(AscFormat.isRealNumber(props.RowHeight))
        {
            if(AscFormat.fApproxEqual(props.RowHeight, 0.0))
            {
                props.RowHeight = 1.0;
            }
            bIgnoreHeight = false;
        }
        var target_text_object = AscFormat.getTargetTextObject(this);
        if(target_text_object === by_type.tables[0])
        {
            by_type.tables[0].graphicObject.Set_Props(props);
        }
        else
        {
            by_type.tables[0].graphicObject.SelectAll();
            by_type.tables[0].graphicObject.Set_Props(props);
            by_type.tables[0].graphicObject.RemoveSelection();
        }
        props.TableCaption = sCaption;
        props.TableDescription = sDescription;
        props.RowHeight = dRowHeight;
        editor.WordControl.m_oLogicDocument.Check_GraphicFrameRowHeight(by_type.tables[0], bIgnoreHeight);
    }
};

DrawingObjectsController.prototype.RefreshAfterChangeColorScheme = function()
{
    var drawings = this.getDrawingArray();
    for(var i = 0; i < drawings.length; ++i)
    {
        if(drawings[i])
        {
            drawings[i].handleUpdateFill();
            drawings[i].handleUpdateLn();
            drawings[i].addToRecalculate();
        }
    }
};
DrawingObjectsController.prototype.updateOverlay = function()
{
    this.drawingObjects.OnUpdateOverlay();
};
DrawingObjectsController.prototype.recalculate = function(bAll, Point, bCheckPoint)
{
    if(bCheckPoint !== false)
    {
        History.Get_RecalcData(Point);//Только для таблиц
    }
    if(bAll)
    {
        var drawings = this.getDrawingObjects();
        for(var i = 0; i < drawings.length; ++i)
        {
            if(drawings[i].recalcText)
            {
                drawings[i].recalcText();
            }
            drawings[i].recalculate();
        }
    }
    else
    {
        for(var key in this.objectsForRecalculate)
        {
            this.objectsForRecalculate[key].recalculate();
        }
    }
    this.objectsForRecalculate = {};
};

DrawingObjectsController.prototype.recalculate2 = function(bAll)
{
    if(bAll)
    {
        var drawings = this.getDrawingObjects();
        for(var i = 0; i < drawings.length; ++i)
        {
            if(drawings[i].recalcText)
            {
                drawings[i].recalcText();
            }
            drawings[i].recalculate();
        }
    }
    else
    {
        for(var key in this.objectsForRecalculate)
        {
            this.objectsForRecalculate[key].recalculate();
        }
    }
    this.objectsForRecalculate = {};
};


DrawingObjectsController.prototype.updateRecalcObjects = function()
{};
DrawingObjectsController.prototype.getTheme = function()
{
    return window["Asc"]["editor"].wbModel.theme;
};

DrawingObjectsController.prototype.startRecalculate = function(bCheckPoint)
{
    this.recalculate(undefined, undefined, bCheckPoint);
    this.drawingObjects.showDrawingObjects(true);
    //this.updateSelectionState();
};

DrawingObjectsController.prototype.getDrawingObjects = function()
{
    //TODO: переделать эту функцию. Нужно где-то паралельно с массивом DrawingBas'ов хранить масси graphicObject'ов.
    var ret = [];
    var drawing_bases = this.drawingObjects.getDrawingObjects();
    for(var i = 0; i < drawing_bases.length; ++i)
    {
        ret.push(drawing_bases[i].graphicObject);
    }
    return ret;
};
DrawingObjectsController.prototype.checkSelectedObjectsForMove = function(group)
{
    var selected_object = group ? group.selectedObjects : this.selectedObjects;
    for(var i = 0; i < selected_object.length; ++i)
    {
        if(selected_object[i].canMove())
        {
            this.arrPreTrackObjects.push(selected_object[i].createMoveTrack());
        }
    }
};

DrawingObjectsController.prototype.checkSelectedObjectsAndFireCallback = function(callback, args)
{
    if(!this.canEdit()){
        return;
    }
    var oApi = Asc.editor;
    if(oApi && oApi.collaborativeEditing && oApi.collaborativeEditing.getGlobalLock()){
        return;
    }
    var selection_state = this.getSelectionState();
    this.drawingObjects.objectLocker.reset();
    for(var i = 0; i < this.selectedObjects.length; ++i)
    {
        this.drawingObjects.objectLocker.addObjectId(this.selectedObjects[i].Get_Id());
    }
    var _this = this;
    var callback2 = function(bLock, bSync)
    {
        if(bLock)
        {
            if(bSync !== true)
            {
                _this.setSelectionState(selection_state);
            }
            callback.apply(_this, args);
        }
    };
    this.drawingObjects.objectLocker.checkObjects(callback2);
};
DrawingObjectsController.prototype.onMouseDown = function(e, x, y)
{
    e.ShiftKey = e.shiftKey;
    e.CtrlKey = e.metaKey || e.ctrlKey;
    e.Button = e.button;
    e.Type = AscCommon.g_mouse_event_type_down;
    var ret = this.curState.onMouseDown(e, x, y, 0);
    if(e.ClickCount < 2)
    {
        if(this.drawingObjects && this.drawingObjects.getWorksheet){
            var ws = this.drawingObjects.getWorksheet();
            if(Asc.editor.wb.getWorksheet() !== ws){
                return ret;
            }
        }
        this.updateOverlay();
        this.updateSelectionState();
    }
    return ret;
};

DrawingObjectsController.prototype.OnMouseDown = DrawingObjectsController.prototype.onMouseDown;

DrawingObjectsController.prototype.onMouseMove = function(e, x, y)
{
    e.ShiftKey = e.shiftKey;
    e.CtrlKey = e.metaKey || e.ctrlKey;
    e.Button = e.button;
    e.Type = AscCommon.g_mouse_event_type_move;
    this.curState.onMouseMove(e, x, y, 0);
};
DrawingObjectsController.prototype.OnMouseMove = DrawingObjectsController.prototype.onMouseMove;


DrawingObjectsController.prototype.onMouseUp = function(e, x, y)
{
    e.ShiftKey = e.shiftKey;
    e.CtrlKey = e.metaKey || e.ctrlKey;
    e.Button = e.button;
    e.Type = AscCommon.g_mouse_event_type_up;
    this.curState.onMouseUp(e, x, y, 0);
};
DrawingObjectsController.prototype.OnMouseUp = DrawingObjectsController.prototype.onMouseUp;

DrawingObjectsController.prototype.createGroup = function()
{
    var group = this.getGroup();
    if(group)
    {
        var group_array = this.getArrayForGrouping();
        for(var i = group_array.length - 1; i > -1; --i)
        {
            group_array[i].deleteDrawingBase();
        }
        this.resetSelection();
        this.drawingObjects.getWorksheetModel && group.setWorksheet(this.drawingObjects.getWorksheetModel());
        group.setDrawingObjects(this.drawingObjects);
        if(this.drawingObjects && this.drawingObjects.cSld)
        {
            group.setParent(this.drawingObjects);
        }
        group.addToDrawingObjects();
        group.checkDrawingBaseCoords();
        this.selectObject(group, 0);
        group.addToRecalculate();
        this.startRecalculate();
    }
};
DrawingObjectsController.prototype.handleChartDoubleClick = function()
{
    var drawingObjects = this.drawingObjects;
    var oThis = this;
    this.checkSelectedObjectsAndFireCallback(function(){
        oThis.clearTrackObjects();
        oThis.clearPreTrackObjects();
        oThis.changeCurrentState(new AscFormat.NullState(this));
        drawingObjects.showChartSettings();
    }, []);
};


DrawingObjectsController.prototype.handleOleObjectDoubleClick = function(drawing, oleObject, e, x, y, pageIndex)
{
    var drawingObjects = this.drawingObjects;
    var oThis = this;
    var fCallback = function(){
        var pluginData = new Asc.CPluginData();
        pluginData.setAttribute("data", oleObject.m_sData);
        pluginData.setAttribute("guid", oleObject.m_sApplicationId);
        pluginData.setAttribute("width", oleObject.extX);
        pluginData.setAttribute("height", oleObject.extY);
        pluginData.setAttribute("widthPix", oleObject.m_nPixWidth);
        pluginData.setAttribute("heightPix", oleObject.m_nPixHeight);
        pluginData.setAttribute("objectId", oleObject.Id);
        window["Asc"]["editor"].asc_pluginRun(oleObject.m_sApplicationId, 0, pluginData);
        oThis.clearTrackObjects();
        oThis.clearPreTrackObjects();
        oThis.changeCurrentState(new AscFormat.NullState(oThis));
        oThis.onMouseUp(e, x, y);
    };
    if(!this.canEdit()){
        fCallback();
        return;
    }
    this.checkSelectedObjectsAndFireCallback(fCallback, []);
};

DrawingObjectsController.prototype.addChartDrawingObject = function(options)
{
    History.Create_NewPoint();
    var chart = this.getChartSpace(this.drawingObjects.getWorksheetModel(), options, true);
    if(chart)
    {
        chart.setWorksheet(this.drawingObjects.getWorksheetModel());
        chart.setStyle(2);
        chart.setBDeleted(false);
        this.resetSelection();
        var w, h;
        if(AscCommon.isRealObject(options) && AscFormat.isRealNumber(options.width) && AscFormat.isRealNumber(options.height))
        {
            w = this.drawingObjects.convertMetric(options.width, 0, 3);
            h = this.drawingObjects.convertMetric(options.height, 0, 3);
        }
        else
        {
            w = this.drawingObjects.convertMetric(AscCommon.AscBrowser.convertToRetinaValue(AscCommon.c_oAscChartDefines.defaultChartWidth, true), 0, 3);
            h = this.drawingObjects.convertMetric(AscCommon.AscBrowser.convertToRetinaValue(AscCommon.c_oAscChartDefines.defaultChartHeight, true), 0, 3);
        }

        var chartLeft, chartTop;
        if(options && AscFormat.isRealNumber(options.left) && options.left >= 0 && AscFormat.isRealNumber(options.top) && options.top >= 0)
        {
            chartLeft = this.drawingObjects.convertMetric(options.left, 0, 3);
            chartTop = this.drawingObjects.convertMetric(options.top, 0, 3);
        }
        else
        {
            chartLeft =  -this.drawingObjects.convertMetric(this.drawingObjects.getScrollOffset().getX(), 0, 3) + this.drawingObjects.convertMetric((this.drawingObjects.getContextWidth()  - w) / 2, 0, 3);
            if(chartLeft < 0)
            {
                chartLeft = 0;
            }
            chartTop =  -this.drawingObjects.convertMetric(this.drawingObjects.getScrollOffset().getY(), 0, 3) + this.drawingObjects.convertMetric((this.drawingObjects.getContextHeight()  - h) / 2, 0, 3);
            if(chartTop < 0)
            {
                chartTop = 0;
            }
        }


        chart.setSpPr(new AscFormat.CSpPr());
        chart.spPr.setParent(chart);
        chart.spPr.setXfrm(new AscFormat.CXfrm());
        chart.spPr.xfrm.setParent(chart.spPr);
        chart.spPr.xfrm.setOffX(chartLeft);
        chart.spPr.xfrm.setOffY(chartTop);
        chart.spPr.xfrm.setExtX(w);
        chart.spPr.xfrm.setExtY(h);

        chart.setDrawingObjects(this.drawingObjects);
        chart.setWorksheet(this.drawingObjects.getWorksheetModel());
        chart.addToDrawingObjects();
        this.resetSelection();
        this.selectObject(chart, 0);
        if(options)
        {
            var old_range = options.getRange();
            options.putRange(null);
            options.style = null;
            options.horAxisProps = null;
            options.vertAxisProps = null;
            options.showMarker = null;
            this.editChartCallback(options);
            options.style = 1;
           // options.bCreate = true;
            this.editChartCallback(options);
            options.putRange(old_range);
        }
        chart.addToRecalculate();
        chart.checkDrawingBaseCoords();
        this.startRecalculate();
        this.drawingObjects.sendGraphicObjectProps();
    }
};

DrawingObjectsController.prototype.isPointInDrawingObjects = function(x, y, e)
{
    this.handleEventMode = AscFormat.HANDLE_EVENT_MODE_CURSOR;
    var ret = this.curState.onMouseDown(e || {}, x, y, 0);
    this.handleEventMode = AscFormat.HANDLE_EVENT_MODE_HANDLE;
    return ret;
};

DrawingObjectsController.prototype.handleDoubleClickOnChart = function(chart)
{
    this.changeCurrentState(new AscFormat.NullState());
};

DrawingObjectsController.prototype.addImageFromParams = function(rasterImageId, x, y, extX, extY)
{
    var image = this.createImage(rasterImageId, x, y, extX, extY);
    image.setWorksheet(this.drawingObjects.getWorksheetModel());
    image.setDrawingObjects(this.drawingObjects);
    image.addToDrawingObjects(undefined, AscCommon.c_oAscCellAnchorType.cellanchorOneCell);
    image.checkDrawingBaseCoords();
    this.selectObject(image, 0);
    image.addToRecalculate();
};

DrawingObjectsController.prototype.addOleObjectFromParams = function(fPosX, fPosY, fWidth, fHeight, nWidthPix, nHeightPix, sLocalUrl, sData, sApplicationId){
    var oOleObject = this.createOleObject(sData, sApplicationId, sLocalUrl, fPosX, fPosY, fWidth, fHeight, nWidthPix, nHeightPix);
    this.resetSelection();
    oOleObject.setWorksheet(this.drawingObjects.getWorksheetModel());
    oOleObject.setDrawingObjects(this.drawingObjects);
    oOleObject.addToDrawingObjects();
    oOleObject.checkDrawingBaseCoords();
    this.selectObject(oOleObject, 0);
    oOleObject.addToRecalculate();
    this.startRecalculate();
};

DrawingObjectsController.prototype.editOleObjectFromParams = function(oOleObject, sData, sImageUrl, nPixWidth, nPixHeight, bResize){
    oOleObject.setData(sData);
    var _blipFill           = new AscFormat.CBlipFill();
    _blipFill.RasterImageId = sImageUrl;
    oOleObject.setBlipFill(_blipFill);
    oOleObject.setPixSizes(nPixWidth, nPixHeight);
    this.startRecalculate();
};


DrawingObjectsController.prototype.addTextArtFromParams = function(nStyle, dRectX, dRectY, dRectW, dRectH, wsmodel)
{
    History.Create_NewPoint();
    var oTextArt = this.createTextArt(nStyle, false, wsmodel);
    this.resetSelection();
    oTextArt.setWorksheet(this.drawingObjects.getWorksheetModel());
    oTextArt.setDrawingObjects(this.drawingObjects);
    oTextArt.addToDrawingObjects();
    oTextArt.checkExtentsByDocContent();
    var dNewPoX = dRectX + (dRectW - oTextArt.spPr.xfrm.extX) / 2;
    if(dNewPoX < 0)
        dNewPoX = 0;
    var dNewPoY = dRectY + (dRectH - oTextArt.spPr.xfrm.extY) / 2;
    if(dNewPoY < 0)
        dNewPoY = 0;
    oTextArt.spPr.xfrm.setOffX(dNewPoX);
    oTextArt.spPr.xfrm.setOffY(dNewPoY);

    oTextArt.checkDrawingBaseCoords();
    this.selectObject(oTextArt, 0);
    var oContent = oTextArt.getDocContent();
    this.selection.textSelection = oTextArt;
    oContent.SelectAll();
    oTextArt.addToRecalculate();
    this.startRecalculate();
};


DrawingObjectsController.prototype.getDrawingDocument = function()
{
    return this.drawingObjects.drawingDocument;
};
DrawingObjectsController.prototype.convertPixToMM = function(pix)
{
    var _ret = this.drawingObjects ? this.drawingObjects.convertMetric(pix, 0, 3) : 0;
    if(AscCommon.AscBrowser.isRetina){
        _ret *= 2;
    }
    return _ret;
};

DrawingObjectsController.prototype.setParagraphNumbering = function(Bullet, Pr)
{
    this.applyDocContentFunction(CDocumentContent.prototype.Set_ParagraphPresentationNumbering, [Bullet, Pr], CTable.prototype.Set_ParagraphPresentationNumbering);
};

DrawingObjectsController.prototype.setParagraphIndent = function(Indent)
{
    if(AscCommon.isRealObject(Indent) && AscFormat.isRealNumber(Indent.Left) && Indent.Left < 0)
    {
        Indent.Left = 0;
    }
    this.applyDocContentFunction(CDocumentContent.prototype.SetParagraphIndent, [Indent], CTable.prototype.SetParagraphIndent);
};

DrawingObjectsController.prototype.paragraphIncDecIndent = function(bIncrease)
{
    this.applyDocContentFunction(CDocumentContent.prototype.Increase_ParagraphLevel, [bIncrease], CTable.prototype.Increase_ParagraphLevel);
};

DrawingObjectsController.prototype.canIncreaseParagraphLevel = function(bIncrease)
{
    var content = this.getTargetDocContent();
    if(content)
    {
        var target_text_object = AscFormat.getTargetTextObject(this);
        if(target_text_object && target_text_object.getObjectType() === AscDFH.historyitem_type_Shape)
        {
            if(target_text_object.isPlaceholder() && (target_text_object.getPhType() === AscFormat.phType_title || target_text_object.getPhType() === AscFormat.phType_ctrTitle))
            {
                return false;
            }
            return content.Can_IncreaseParagraphLevel(bIncrease);
        }
    }
    return false;
};


    DrawingObjectsController.prototype.checkMobileCursorPosition = function () {
        if(!this.drawingObjects){
            return;
        }
        var oWorksheet = this.drawingObjects.getWorksheet();
        if(!oWorksheet){
            return;
        }
        if(window["Asc"]["editor"].isMobileVersion){
            var oTargetDocContent = this.getTargetDocContent(false, false);
            if(oTargetDocContent){
                var oPos = oTargetDocContent.GetCursorPosXY();
                var oParentTextTransform = oTargetDocContent.Get_ParentTextTransform();
                var _x, _y;
                if(oParentTextTransform){
                    _x = oParentTextTransform.TransformPointX(oPos.X, oPos.Y);
                    _y = oParentTextTransform.TransformPointY(oPos.X, oPos.Y);
                }
                else{
                    _x = oPos.X;
                    _y = oPos.Y;
                }
                _x = this.drawingObjects.convertMetric(_x, 3, 0);
                _y = this.drawingObjects.convertMetric(_y, 3, 0);
                var oCell = oWorksheet.findCellByXY(_x, _y, true, false, false);
                if(oCell && oCell.col !== null && oCell.row !== null){
                    var oRange = new Asc.Range(oCell.col, oCell.row, oCell.col, oCell.row, false);
                    var oVisibleRange = oWorksheet.getVisibleRange();
                    if(!oRange.isIntersect(oVisibleRange)){
                        oWorksheet._scrollToRange(oRange);
                    }
                }
            }
        }
    };

DrawingObjectsController.prototype.onKeyPress = function(e)
{
    if (!this.canEdit())
        return false;
    if(e.CtrlKey || e.AltKey)
        return false;

    var Code;
    if (null != e.Which)
        Code = e.Which;
    else if (e.KeyCode)
        Code = e.KeyCode;
    else
        Code = 0;//special char

    var bRetValue = false;
    if ( Code > 0x20 )
    {
        var oApi = window["Asc"] && window["Asc"]["editor"];
        var fCallback = function(){
            this.paragraphAdd( new ParaText(Code), false );
            this.checkMobileCursorPosition();
        };
        this.checkSelectedObjectsAndCallback(fCallback, [], false, AscDFH.historydescription_Spreadsheet_ParagraphAdd, undefined, window["Asc"]["editor"].collaborativeEditing.getFast());

        bRetValue = true;
    }
    else if ( Code == 0x20 )
    {
        var oApi = window["Asc"] && window["Asc"]["editor"];
        var fCallback = function(){
            this.paragraphAdd(new ParaSpace(1));
            this.checkMobileCursorPosition();
        };
        this.checkSelectedObjectsAndCallback(fCallback, [], false, AscDFH.historydescription_Spreadsheet_AddSpace, undefined, window["Asc"]["editor"].collaborativeEditing.getFast());

        bRetValue = true;
    }

    return bRetValue;
};
//------------------------------------------------------------export---------------------------------------------------
window['AscCommonExcel'] = window['AscCommonExcel'] || {};
window['AscCommonExcel'].CheckIdSatetShapeAdd = CheckIdSatetShapeAdd;
})(window);
