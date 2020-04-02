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

var FOCUS_OBJECT_THUMBNAILS     = 0;
var FOCUS_OBJECT_MAIN           = 1;
var FOCUS_OBJECT_NOTES          = 2;

var COMMENT_WIDTH   = 18;
var COMMENT_HEIGHT  = 16;

var global_mouseEvent = AscCommon.global_mouseEvent;


var THEME_TH_WIDTH = 140;
var THEME_TH_HEIGHT = 112;//THEME_TH_WIDTH*0.8

function check_KeyboardEvent(e)
{
    AscCommon.global_keyboardEvent.AltKey     = ((e["Flags"] & 0x01) == 0x01);
    AscCommon.global_keyboardEvent.CtrlKey    = ((e["Flags"] & 0x02) == 0x02);
    AscCommon.global_keyboardEvent.ShiftKey   = ((e["Flags"] & 0x04) == 0x04);

    AscCommon.global_keyboardEvent.Sender = null;

    AscCommon.global_keyboardEvent.CharCode   = e["CharCode"];
    AscCommon.global_keyboardEvent.KeyCode    = e["KeyCode"];
    AscCommon.global_keyboardEvent.Which      = null;
}
function check_KeyboardEvent_Array(_params, i)
{
    AscCommon.global_keyboardEvent.AltKey     = ((_params[i + 1] & 0x01) == 0x01);
    AscCommon.global_keyboardEvent.CtrlKey    = ((_params[i + 1] & 0x02) == 0x02);
    AscCommon.global_keyboardEvent.ShiftKey   = ((_params[i + 1] & 0x04) == 0x04);

    AscCommon.global_keyboardEvent.Sender = null;

    AscCommon.global_keyboardEvent.CharCode   = _params[i + 3];
    AscCommon.global_keyboardEvent.KeyCode    = _params[i + 2];
    AscCommon.global_keyboardEvent.Which      = null;
}

function check_MouseDownEvent(e, isClicks)
{
    global_mouseEvent.X = e["X"];
    global_mouseEvent.Y = e["Y"];

    global_mouseEvent.AltKey     = ((e["Flags"] & 0x01) == 0x01);
    global_mouseEvent.CtrlKey    = ((e["Flags"] & 0x02) == 0x02);
    global_mouseEvent.ShiftKey   = ((e["Flags"] & 0x04) == 0x04);

    global_mouseEvent.Type      = AscCommon.g_mouse_event_type_down;
    global_mouseEvent.Button    = e["Button"];

    global_mouseEvent.Sender    = null;

    if (isClicks)
    {
        global_mouseEvent.ClickCount = e["ClickCount"];
    }
    else
    {
        global_mouseEvent.ClickCount     = 1;
    }
    global_mouseEvent.KoefPixToMM = e["PixToMM"];
    global_mouseEvent.IsLocked = true;
}

function check_MouseMoveEvent(e)
{
    global_mouseEvent.X = e["X"];
    global_mouseEvent.Y = e["Y"];

    global_mouseEvent.AltKey     = ((e["Flags"] & 0x01) == 0x01);
    global_mouseEvent.CtrlKey    = ((e["Flags"] & 0x02) == 0x02);
    global_mouseEvent.ShiftKey   = ((e["Flags"] & 0x04) == 0x04);

    global_mouseEvent.Type      = AscCommon.g_mouse_event_type_move;
    global_mouseEvent.Button    = e["Button"];
    global_mouseEvent.KoefPixToMM = e["PixToMM"];
}

function check_MouseUpEvent(e)
{
    global_mouseEvent.X = e["X"];
    global_mouseEvent.Y = e["Y"];

    global_mouseEvent.AltKey     = ((e["Flags"] & 0x01) == 0x01);
    global_mouseEvent.CtrlKey    = ((e["Flags"] & 0x02) == 0x02);
    global_mouseEvent.ShiftKey   = ((e["Flags"] & 0x04) == 0x04);

    global_mouseEvent.Type      = AscCommon.g_mouse_event_type_up;
    global_mouseEvent.Button    = e["Button"];

    global_mouseEvent.Sender    = null;

    global_mouseEvent.IsLocked  = false;
    global_mouseEvent.KoefPixToMM = e["PixToMM"];
}


function CDrawingDocument()
{
    this.IsLockObjectsEnable = false;

    this.m_oWordControl     = null;
    this.m_oLogicDocument   = null;

    this.SlidesCount        = 0;
    this.IsEmptyPresentation = false;

    this.SlideCurrent       = -1;

    this.Native = window["native"];

    this.m_sLockedCursorType = "";

    this.UpdateTargetFromPaint = false;
    this.TextMatrix = null;

    this.CanvasHitContext = CreateHitControl();

    this.TargetCursorColor = {R: 0, G: 0, B: 0};

    this.TargetPos = {X: 0.0, Y: 0.0, Page: 0};

    this.LockEvents = false;

    this.AutoShapesTrack = new AscCommon.CAutoshapeTrack();

    this.m_lCurrentRendererPage = -1;
    this.m_oDocRenderer         = null;

    this.isCreatedDefaultTableStyles = false;

	this.CollaborativeTargets            = [];
	this.CollaborativeTargetsUpdateTasks = [];
};

CDrawingDocument.prototype.Notes_GetWidth = function()
{
    return 100;
};

CDrawingDocument.prototype.Notes_OnRecalculate = function()
{
    return 100;
};

CDrawingDocument.prototype.RenderPage = function(nPageIndex, bTh, bIsPlayMode)
{
    var _graphics = new CDrawingStream();
    _graphics.IsThumbnail = (!!bTh);
    _graphics.IsDemonstrationMode = (!!bIsPlayMode);
    _graphics.IsNoDrawingEmptyPlaceholder = (bIsPlayMode || bTh);
    this.m_oWordControl.m_oLogicDocument.DrawPage(nPageIndex, _graphics);
};

CDrawingDocument.prototype.AfterLoad = function()
{
    this.Api = window.editor;
    this.m_oApi = this.Api;
    this.m_oApi.DocumentUrl = "";
    this.LogicDocument = window.editor.WordControl.m_oLogicDocument;
    this.LogicDocument.DrawingDocument = this;
};
CDrawingDocument.prototype.Start_CollaborationEditing = function()
{
    this.Native["DD_Start_CollaborationEditing"]();
};

CDrawingDocument.prototype.IsMobileVersion = function()
{
    return true;
};

CDrawingDocument.prototype.ConvertCoordsToAnotherPage = function(x, y)
{
    return {X: x, Y: y};
};

CDrawingDocument.prototype.SetCursorType = function(sType, Data)
{
    var sResultCursorType = sType;
    if ("" === this.m_sLockedCursorType)
    {
        if (this.m_oWordControl.m_oApi.isPaintFormat && (("default" === sType) || ("text" === sType)))
            sResultCursorType = AscCommon.kCurFormatPainterWord;
        else
            sResultCursorType = sType;
    }
    else
        sResultCursorType = this.m_sLockedCursorType;
    if ( "undefined" === typeof(Data) || null === Data )
        Data = new AscCommon.CMouseMoveData();
    this.Native["DD_SetCursorType"](sResultCursorType, Data);
};
CDrawingDocument.prototype.LockCursorType = function(sType)
{
    this.m_sLockedCursorType = sType;

    this.Native["DD_LockCursorType"](sType);
};
CDrawingDocument.prototype.LockCursorTypeCur = function()
{
    this.m_sLockedCursorType = this.Native["DD_LockCursorType"]();
};
CDrawingDocument.prototype.UnlockCursorType = function()
{
    this.m_sLockedCursorType = "";
    this.Native["DD_UnlockCursorType"]();
};

CDrawingDocument.prototype.OnStartRecalculate = function(pageCount)
{
    if(this.LockEvents)
    {
        return;
    }
    this.Native["DD_OnStartRecalculate"](pageCount, this.LogicDocument.Width, this.LogicDocument.Height);
};

CDrawingDocument.prototype.SetTargetColor = function(r, g, b)
{
    this.Native["DD_SetTargetColor"](r, g, b);
};

CDrawingDocument.prototype.StartTrackTable = function()
{};
// track text (inline)
CDrawingDocument.prototype.StartTrackText = function ()
{
};
CDrawingDocument.prototype.EndTrackText = function (isOnlyMoveTarget)
{
};

CDrawingDocument.prototype.IsTrackText = function ()
{
};

CDrawingDocument.prototype.CancelTrackText = function ()
{
};

CDrawingDocument.prototype.OnRecalculatePage = function(index, pageObject)
{
    if(this.LockEvents)
    {
        return;
    }
    var l, t, r, b, bIsHidden = !pageObject.isVisible();
    if(index === this.m_oLogicDocument.CurPage)
    {
        var oBoundsChecker = new AscFormat.CSlideBoundsChecker();
        pageObject.draw(oBoundsChecker);
        r = oBoundsChecker.Bounds.max_x;
        l = oBoundsChecker.Bounds.min_x;
        b = oBoundsChecker.Bounds.max_y;
        t = oBoundsChecker.Bounds.min_y;
    }
    else
    {
        r = this.m_oLogicDocument.Width;
        l = 0.0;
        b = this.m_oLogicDocument.Height;
        t = 0.0;
    }
    this.Native["DD_OnRecalculatePage"](index, l, t, r, b, bIsHidden, pageObject.Get_Id());
};

CDrawingDocument.prototype.OnEndRecalculate = function()
{
    this.SlidesCount = this.m_oLogicDocument.Slides.length;
    this.SlideCurrent = this.m_oLogicDocument.CurPage;

    if(this.LockEvents)
    {
        return;
    }
    this.Native["DD_OnEndRecalculate"]();
};

CDrawingDocument.prototype.ChangePageAttack = function(pageIndex)
{
};

CDrawingDocument.prototype.RenderDocument = function(Renderer)
{
    for (var i = 0; i < this.SlidesCount; i++)
    {
        Renderer.BeginPage(this.m_oLogicDocument.Width, this.m_oLogicDocument.Height);
        this.m_oLogicDocument.DrawPage(i, Renderer);
        Renderer.EndPage();
    }
};

CDrawingDocument.prototype.ToRenderer = function()
{
    var Renderer                             = new AscCommon.CDocumentRenderer();
    Renderer.IsNoDrawingEmptyPlaceholder     = true;
    Renderer.VectorMemoryForPrint            = new AscCommon.CMemory();
    var old_marks                            = this.m_oWordControl.m_oApi.ShowParaMarks;
    this.m_oWordControl.m_oApi.ShowParaMarks = false;
    this.RenderDocument(Renderer);
    this.m_oWordControl.m_oApi.ShowParaMarks = old_marks;
    var ret                                  = Renderer.Memory.GetBase64Memory();

    // DEBUG
    //console.log(ret);

    return ret;
};

CDrawingDocument.prototype.ToRenderer2    = function()
{
    var Renderer = new AscCommon.CDocumentRenderer();

    var old_marks                            = this.m_oWordControl.m_oApi.ShowParaMarks;
    this.m_oWordControl.m_oApi.ShowParaMarks = false;

    var ret = "";
    for (var i = 0; i < this.SlidesCount; i++)
    {
        Renderer.BeginPage(this.m_oLogicDocument.Width, this.m_oLogicDocument.Height);
        this.m_oLogicDocument.DrawPage(i, Renderer);
        Renderer.EndPage();

        ret += Renderer.Memory.GetBase64Memory();
        Renderer.Memory.Seek(0);
    }

    this.m_oWordControl.m_oApi.ShowParaMarks = old_marks;
    return ret;
};

CDrawingDocument.prototype.ToRendererPart = function(noBase64)
{
    var watermark = this.m_oWordControl.m_oApi.watermarkDraw;

    var pagescount = this.SlidesCount;

    if (-1 == this.m_lCurrentRendererPage)
    {
        if (watermark)
            watermark.StartRenderer();

        this.m_oDocRenderer                             = new AscCommon.CDocumentRenderer();
        this.m_oDocRenderer.VectorMemoryForPrint        = new AscCommon.CMemory();
        this.m_lCurrentRendererPage                     = 0;
        this.m_bOldShowMarks                            = this.m_oWordControl.m_oApi.ShowParaMarks;
        this.m_oWordControl.m_oApi.ShowParaMarks        = false;
        this.m_oDocRenderer.IsNoDrawingEmptyPlaceholder = true;
    }

    var start = this.m_lCurrentRendererPage;
    var end   = pagescount - 1;

    var renderer = this.m_oDocRenderer;
    renderer.Memory.Seek(0);
    renderer.VectorMemoryForPrint.ClearNoAttack();

    for (var i = start; i <= end; i++)
    {
        renderer.BeginPage(this.m_oLogicDocument.Width, this.m_oLogicDocument.Height);
        this.m_oLogicDocument.DrawPage(i, renderer);
        renderer.EndPage();

        if (watermark)
            watermark.DrawOnRenderer(renderer, this.m_oLogicDocument.Width, this.m_oLogicDocument.Height);
    }

    if (end == -1)
    {
        renderer.BeginPage(this.m_oLogicDocument.Width, this.m_oLogicDocument.Height);
        renderer.EndPage()
    }

    this.m_lCurrentRendererPage = end + 1;

    if (this.m_lCurrentRendererPage >= pagescount)
    {
        if (watermark)
            watermark.EndRenderer();

        this.m_lCurrentRendererPage              = -1;
        this.m_oDocRenderer                      = null;
        this.m_oWordControl.m_oApi.ShowParaMarks = this.m_bOldShowMarks;
    }

    if (noBase64) {
        return renderer.Memory.GetData();
    } else {
        return renderer.Memory.GetBase64Memory();
    }
};


CDrawingDocument.prototype.InitGuiCanvasTextProps = function(div_id)
{

};

CDrawingDocument.prototype.DrawGuiCanvasTextProps = function(props)
{

};

CDrawingDocument.prototype.DrawSearch = function(overlay)
{
};

CDrawingDocument.prototype.DrawSearchCur = function(overlay, place)
{
};

CDrawingDocument.prototype.StopRenderingPage = function(pageIndex)
{

};

CDrawingDocument.prototype.ClearCachePages = function()
{
    this.Native["DD_ClearCachePages"]();
};

CDrawingDocument.prototype.FirePaint = function()
{
    this.Native["DD_FirePaint"]();
};



CDrawingDocument.prototype.ConvertCoordsFromCursor2 = function(x, y)
{
    return this.Native["DD_ConvertCoordsFromCursor2"]();
};

CDrawingDocument.prototype.IsCursorInTableCur = function(x, y, page)
{

    return false;
};

CDrawingDocument.prototype.ConvertCoordsToCursorWR = function(x, y, pageIndex, transform)
{
    var m11, m22, m12, m21, tx, ty, _page_index;
    if(transform)
    {
        m11 = transform.sx;
        m22 = transform.sy;
        m12 = transform.shx;
        m21 = transform.shy;
        tx = transform.tx;
        ty = transform.ty;
    }
    else
    {
        m11 = 1.0;
        m22 = 1.0;
        m12 = 0.0;
        m21 = 0.0;
        tx = 0.0;
        ty = 0.0;
    }
    if(AscFormat.isRealNumber(pageIndex))
    {
        _page_index = pageIndex;
    }
    else
    {
        _page_index = 0;
    }
    return this.Native["DD_ConvertCoordsToCursor"](x, y, _page_index, m11, m21, m12, m22, tx, ty);
};

CDrawingDocument.prototype.ConvertCoordsToCursorWR_2 = function(x, y)
{
    return this.Native["DD_ConvertCoordsToCursor"]();
};

CDrawingDocument.prototype.ConvertCoordsToCursorWR_Comment = function(x, y)
{
    return this.Native["DD_ConvertCoordsToCursorWR_Comment"]();
};

CDrawingDocument.prototype.ConvertCoordsToCursor = function(x, y)
{
    return this.Native["DD_ConvertCoordsToCursor"](x, y, 0);
};

CDrawingDocument.prototype.TargetStart = function()
{
    return this.Native["DD_TargetStart"]();
};
CDrawingDocument.prototype.TargetEnd = function()
{
    return this.Native["DD_TargetEnd"]();
};
CDrawingDocument.prototype.UpdateTargetNoAttack = function()
{
};

CDrawingDocument.prototype.CheckTargetDraw = function(x, y)
{
    return this.Native["DD_CheckTargetDraw"](x, y);
};

CDrawingDocument.prototype.UpdateTarget = function(x, y, pageIndex)
{
    this.TargetPos.X = x;
    this.TargetPos.Y = y;
    this.TargetPos.Page = pageIndex;
    return this.Native["DD_UpdateTarget"](x, y, pageIndex);
};

CDrawingDocument.prototype.SetTargetSize = function(size)
{
    return this.Native["DD_SetTargetSize"](size);
};
CDrawingDocument.prototype.DrawTarget = function()
{
    return this.Native["DD_DrawTarget"]();
};
CDrawingDocument.prototype.TargetShow = function()
{
    return this.Native["DD_TargetShow"]();
};
CDrawingDocument.prototype.CheckTargetShow = function()
{
    return this.Native["DD_CheckTargetShow"]();
};

CDrawingDocument.prototype.SetCurrentPage = function(PageIndex)
{
    return this.Native["DD_SetCurrentPage"](PageIndex);
};

CDrawingDocument.prototype.SelectEnabled = function(bIsEnabled)
{
    this.m_bIsSelection = bIsEnabled;
    if (false === this.m_bIsSelection)
    {
        this.SelectClear();
//            //this.m_oWordControl.CheckUnShowOverlay();
//            //this.drawingObjects.OnUpdateOverlay();
//            this.drawingObjects.getOverlay().m_oContext.globalAlpha = 1.0;
    }
    //return this.Native["DD_SelectEnabled"](bIsEnabled);
};
CDrawingDocument.prototype.SelectClear = function()
{
    if (!this.SelectClearLock)
    {
        this.SelectDrag = -1;
        this.SelectRect1 = null;
        this.SelectRect2 = null;
    }
    return this.Native["DD_SelectClear"]();
};
CDrawingDocument.prototype.SearchClear = function()
{
    return this.Native["DD_SearchClear"]();
};
CDrawingDocument.prototype.AddPageSearch = function(findText, rects)
{
    return this.Native["DD_AddPageSearch"](findText, rects);
};

CDrawingDocument.prototype.StartSearch = function()
{
    this.Native["DD_StartSearch"]();
};
CDrawingDocument.prototype.EndSearch = function(bIsChange)
{
    this.Native["DD_EndSearch"](bIsChange);
};
CDrawingDocument.prototype.AddPageSelection = function(pageIndex, x, y, width, height)
{
    this.Native["DD_AddPageSelection"](pageIndex, x, y, width, height);
};
CDrawingDocument.prototype.SelectShow = function()
{
    this.m_oWordControl.OnUpdateOverlay();
};

CDrawingDocument.prototype.Set_RulerState_Table = function(markup, transform)
{
    this.Native["DD_Set_RulerState_Table"](markup, transform);
};

CDrawingDocument.prototype.Set_RulerState_Paragraph = function(obj, margins)
{
    this.Native["DD_Set_RulerState_Paragraph"](obj, margins);
};


CDrawingDocument.prototype.Update_ParaTab = function(Default_Tab, ParaTabs)
{
    this.Native["DD_Update_ParaTab"](Default_Tab, ParaTabs);
};

CDrawingDocument.prototype.UpdateTableRuler = function(isCols, index, position)
{
    this.Native["DD_UpdateTableRuler"](isCols, index, position);
};
CDrawingDocument.prototype.GetDotsPerMM = function(value)
{
    return this.Native["DD_GetDotsPerMM"](value);
};

CDrawingDocument.prototype.GetMMPerDot = function(value)
{
    return value / this.GetDotsPerMM( 1 );
};
CDrawingDocument.prototype.GetVisibleMMHeight = function()
{
    return this.Native["DD_GetVisibleMMHeight"]();
};

// вот оооочень важная функция. она выкидывает из кэша неиспользуемые шрифты
CDrawingDocument.prototype.CheckFontCache = function()
{
    return this.Native["DD_CheckFontCache"]();
};

CDrawingDocument.prototype.CheckFontNeeds = function()
{
    this.m_oWordControl.m_oLogicDocument.Fonts = [];
};

CDrawingDocument.prototype.CorrectRulerPosition = function(pos)
{
    return this.Native["DD_CorrectRulerPosition"](pos);
};

// вот здесь весь трекинг
CDrawingDocument.prototype.DrawTrack = function(type, matrix, left, top, width, height, isLine, canRotate, isNoMove)
{
    this.AutoShapesTrack.DrawTrack(type, matrix, left, top, width, height, isLine, canRotate, isNoMove);
};

CDrawingDocument.prototype.LockSlide = function(slideNum)
{
    //this.Native["DD_LockSlide"](slideNum);
};

CDrawingDocument.prototype.UnLockSlide = function(slideNum)
{
    //this.Native["DD_UnLockSlide"](slideNum);
};

CDrawingDocument.prototype.DrawTrackSelectShapes = function(x, y, w, h)
{
    this.AutoShapesTrack.DrawTrackSelectShapes(x, y, w, h);
};

CDrawingDocument.prototype.DrawAdjustment = function(matrix, x, y, bTextWarp)
{
    this.AutoShapesTrack.DrawAdjustment(matrix, x, y, bTextWarp);
};

// cursor
CDrawingDocument.prototype.UpdateTargetTransform = function(matrix)
{
    if (matrix)
    {
        if (null == this.TextMatrix)
            this.TextMatrix = new AscCommon.CMatrix();
        this.TextMatrix.sx = matrix.sx;
        this.TextMatrix.shy = matrix.shy;
        this.TextMatrix.shx = matrix.shx;
        this.TextMatrix.sy = matrix.sy;
        this.TextMatrix.tx = matrix.tx;
        this.TextMatrix.ty = matrix.ty;

        this.Native["DD_UpdateTargetTransform"](matrix.sx, matrix.shy, matrix.shx, matrix.sy, matrix.tx, matrix.ty);
    }
    else
    {
        this.TextMatrix = null;
        this.Native["DD_RemoveTargetTransform"]();
    }
};

CDrawingDocument.prototype.UpdateThumbnailsAttack = function()
{
    var aSlides = this.m_oWordControl.m_oLogicDocument.Slides;
    var DrawingDocument = this.m_oWordControl.m_oLogicDocument.DrawingDocument;
    DrawingDocument.OnStartRecalculate(aSlides.length);
    if(this.LockEvents !== true)
    {
        for(var i = 0; i < aSlides.length; ++i)
        {
            var oSlide = aSlides[i];
            this.Native["DD_UpdateThumbnailAttack"](i, oSlide.Id, !oSlide.isVisible());
            DrawingDocument.OnRecalculatePage(i, aSlides[i]);
        }
    }
    DrawingDocument.OnEndRecalculate();
};

CDrawingDocument.prototype.CheckGuiControlColors = function(bIsAttack)
{
};

CDrawingDocument.prototype.SendControlColors = function(bIsAttack)
{
};

CDrawingDocument.prototype.DrawImageTextureFillShape = function(url)
{
};

CDrawingDocument.prototype.DrawImageTextureFillSlide = function(url)
{
};



CDrawingDocument.prototype.DrawImageTextureFillTextArt = function(url)
{
};

CDrawingDocument.prototype.InitGuiCanvasShape = function(div_id)
{
};

CDrawingDocument.prototype.InitGuiCanvasSlide = function(div_id)
{
};

CDrawingDocument.prototype.InitGuiCanvasTextArt = function(div_id)
{
};

CDrawingDocument.prototype.CheckTableStyles = function()
{   
    var logicDoc = this.m_oWordControl.m_oLogicDocument;
    var _dst_styles = [];

    // NOTE: need check

    var page_w_mm = 90 * 2.54 / (72.0 / 96.0);
    var page_h_mm = 70 * 2.54 / (72.0 / 96.0);
    var page_w_px = 90 * 2;
    var page_h_px = 70 * 2;

    var stream = global_memory_stream_menu;
    var graphics = new CDrawingStream();

    this.Native["DD_PrepareNativeDraw"]();

    AscCommon.History.TurnOff();
    AscCommon.g_oTableId.m_bTurnOff = true;

    for (var i = 0; i < logicDoc.TablesForInterface.length; i++)
    {
        this.Native["DD_StartNativeDraw"](page_w_px, page_h_px, page_w_mm, page_h_mm);
        
        logicDoc.TablesForInterface[i].graphicObject.Draw(0, graphics);

        stream["ClearNoAttack"]();

        stream["WriteByte"](2);
        stream["WriteString2"]("" + logicDoc.TablesForInterface[i].graphicObject.TableStyle);

        this.Native["DD_EndNativeDraw"](stream);
        graphics.ClearParams();
    }

    AscCommon.g_oTableId.m_bTurnOff = false;
    AscCommon.History.TurnOn();

    stream["ClearNoAttack"]();
    stream["WriteByte"](3);

    this.Native["DD_EndNativeDraw"](stream);

    this.isCreatedDefaultTableStyles = true;
};

CDrawingDocument.prototype.CheckThemes = function(){   

    window["native"]["ClearCacheThemeThumbnails"]();
    var logicDoc = this.m_oWordControl.m_oLogicDocument;
    var _dst_styles = [];

    // NOTE: need check

    var page_w_mm = THEME_TH_WIDTH * 2.54 / (72.0 / 96.0);
    var page_h_mm = THEME_TH_HEIGHT * 2.54 / (72.0 / 96.0);
    var page_w_px = THEME_TH_WIDTH * 3;
    var page_h_px = THEME_TH_HEIGHT * 3;

    var stream = global_memory_stream_menu;
    var graphics = new CDrawingStream();
    var thDrawer = new CMasterThumbnailDrawer();
    thDrawer.DrawingDocument = this;

    this.Native["DD_PrepareNativeDraw"]();

    AscCommon.History.TurnOff();
    AscCommon.g_oTableId.m_bTurnOff = true;

    for (var i = 0; i < logicDoc.slideMasters.length; i++)
    {
        var oMaster = logicDoc.slideMasters[i];
        if(oMaster.ThemeIndex < 0){
            var oTheme = oMaster.Theme;
            this.Native["DD_StartNativeDraw"](page_w_px, page_h_px, page_w_mm, page_h_mm);
            thDrawer.WidthMM = page_w_mm;
            thDrawer.HeightMM = page_h_mm;
            thDrawer.WidthPx = page_w_px;
            thDrawer.HeightPx = page_h_px;
            var oldW = oMaster.Width;
            var oldH = oMaster.Height;
            var oLayout = null;
            oMaster.changeSize(page_w_mm, page_h_mm);
            oMaster.recalculate();

            for (var j = 0; j < oMaster.sldLayoutLst.length; j++) {
                if (oMaster.sldLayoutLst[j].type == AscFormat.nSldLtTTitle) {
                    oLayout = oMaster.sldLayoutLst[j];
                  break;
                }
              }
              if(oLayout){
                oLayout.changeSize(page_w_mm, page_h_mm);
                oLayout.recalculate();
              }

            thDrawer.Draw(graphics, oMaster, undefined, undefined);
            oMaster.changeSize(oldW, oldH);
            oMaster.recalculate();
            if(oLayout){
                oLayout.changeSize(oldW, oldH);
                oLayout.recalculate();
            }

            stream["ClearNoAttack"]();
            stream["WriteByte"](6);
            stream["WriteLong"](oMaster.ThemeIndex);
            var sThemeName = typeof oTheme.name === "string" && oTheme.name.length > 0 ? oTheme.name : "Doc theme " + (i + 1);
            stream["WriteString2"](sThemeName);
    
            this.Native["DD_EndNativeDraw"](stream);
            graphics.ClearParams();
        }
    }

    AscCommon.g_oTableId.m_bTurnOff = false;
    AscCommon.History.TurnOn();

    stream["ClearNoAttack"]();
    stream["WriteByte"](7);

    this.Native["DD_EndNativeDraw"](stream);



    var _masters = logicDoc.slideMasters;
    var aDocumentThemes = logicDoc.Api.ThemeLoader.Themes.DocumentThemes;
    var aThemeInfo = logicDoc.Api.ThemeLoader.themes_info_document;
    aDocumentThemes.length = 0;
    aThemeInfo.length = 0;
    for (var i = 0; i < _masters.length; i++)
    {
        if (_masters[i].ThemeIndex < 0)//только темы презентации
        {
            var theme_load_info    = new AscCommonSlide.CThemeLoadInfo();
            theme_load_info.Master = _masters[i];
            theme_load_info.Theme  = _masters[i].Theme;
            var _lay_cnt = _masters[i].sldLayoutLst.length;
            for (var j = 0; j < _lay_cnt; j++)
            {
                theme_load_info.Layouts[j] = _masters[i].sldLayoutLst[j];
            }
            var th_info       = {};
            th_info.Name      = "Doc Theme " + i;
            th_info.Url       = "";
            th_info.Thumbnail = _masters[i].ImageBase64;
            var th = new AscCommonSlide.CAscThemeInfo(th_info);
            aDocumentThemes[aDocumentThemes.length] = th;
            th.Index = -logicDoc.Api.ThemeLoader.Themes.DocumentThemes.length;
            aThemeInfo[aDocumentThemes.length - 1] = theme_load_info;
        }
    }


};

CDrawingDocument.prototype.CheckLayouts = function(oMaster){   

    window["native"]["ClearCacheLayoutThumbnails"]();
    var logicDoc = this.m_oWordControl.m_oLogicDocument;
    var _dst_styles = [];

    // NOTE: need check

    var page_w_mm = logicDoc.Width;//THEME_TH_WIDTH * 2.54 / (72.0 / 96.0);
    var page_h_mm = logicDoc.Height;//THEME_TH_HEIGHT * 2.54 / (72.0 / 96.0);
    var page_w_px = THEME_TH_WIDTH * 2;
    var page_h_px = THEME_TH_HEIGHT * 2;

    var stream = global_memory_stream_menu;
    var graphics = new CDrawingStream();
    var thDrawer = new CLayoutThumbnailDrawer();
    thDrawer.DrawingDocument = this;

    this.Native["DD_PrepareNativeDraw"]();

    AscCommon.History.TurnOff();
    AscCommon.g_oTableId.m_bTurnOff = true;

    for (var i = 0; i < oMaster.sldLayoutLst.length; i++)
    {
        var oLayout = oMaster.sldLayoutLst[i];
        this.Native["DD_StartNativeDraw"](page_w_px, page_h_px, page_w_mm, page_h_mm);
        thDrawer.WidthMM = page_w_mm;
        thDrawer.HeightMM = page_h_mm;
        thDrawer.WidthPx = page_w_px;
        thDrawer.HeightPx = page_h_px;

        graphics.init(null, page_w_px, page_h_px, page_w_px, page_h_px);
        graphics.CalculateFullTransform();
        thDrawer.Draw(graphics, oLayout, undefined, undefined, undefined);
        stream["ClearNoAttack"]();
        stream["WriteByte"](8);
        stream["WriteLong"](i);
        var sLayoutName = typeof oLayout.cSld.name === "string" && oLayout.cSld.name.length > 0 ? oLayout.cSld.name : "Layout " + (i + 1);
        stream["WriteString2"](sLayoutName);

        this.Native["DD_EndNativeDraw"](stream);
        graphics.ClearParams();
    }

    AscCommon.g_oTableId.m_bTurnOff = false;
    AscCommon.History.TurnOn();

    stream["ClearNoAttack"]();
    stream["WriteByte"](9);

    this.Native["DD_EndNativeDraw"](stream);
};

CDrawingDocument.prototype.OnSelectEnd = function()
{
};

CDrawingDocument.prototype.GetCommentWidth = function(type)
{
};

CDrawingDocument.prototype.GetCommentHeight = function(type)
{
};

CDrawingDocument.prototype.GetMouseMoveCoords = function()
{
    return {X: global_mouseEvent.X, Y: global_mouseEvent.Y, Page: this.LogicDocument.CurPage};
};

CDrawingDocument.prototype.StartUpdateOverlay = function()
{
    this.IsUpdateOverlayOnlyEnd = true;
};

CDrawingDocument.prototype.EndUpdateOverlay = function()
{
    if (this.IsUpdateOverlayOnlyEndReturn)
        return;

    this.IsUpdateOverlayOnlyEnd = false;
    if (this.IsUpdateOverlayOnEndCheck)
        this.m_oWordControl.OnUpdateOverlay();

    this.IsUpdateOverlayOnEndCheck = false;
};

CDrawingDocument.prototype.OnMouseDown = function(e)
{
    check_MouseDownEvent(e, true);

    // у Илюхи есть проблема при вводе с клавы, пока нажата кнопка мыши
    if ((0 == global_mouseEvent.Button) || (undefined == global_mouseEvent.Button))
        this.m_bIsMouseLock = true;

    this.StartUpdateOverlay();

    if ((0 == global_mouseEvent.Button) || (undefined == global_mouseEvent.Button))
    {
        var pos = {X: global_mouseEvent.X, Y: global_mouseEvent.Y, Page: this.LogicDocument.CurPage};

        // if (pos.Page == -1)
        // {
        //     this.EndUpdateOverlay();
        //     return;
        // }

        // if (this.IsFreezePage(pos.Page))
        // {
        //     this.EndUpdateOverlay();
        //     return;
        // }

        // теперь проверить трек таблиц
        /*
         var ret = this.Native["checkMouseDown_Drawing"](pos.X, pos.Y, pos.Page);
         if (ret === true)
         return;
         */
        // var is_drawing = this.checkMouseDown_Drawing(pos);
        // if (is_drawing === true) {
        //     return;
        // }

        //this.Native["DD_NeedScrollToTargetFlag"](true);
        this.LogicDocumentOnMouseDown(global_mouseEvent, pos.X, pos.Y, pos.Page);
        //this.Native["DD_NeedScrollToTargetFlag"](false);
    }

    //this.Native["DD_CheckTimerScroll"](true);
    this.EndUpdateOverlay();
};

CDrawingDocument.prototype.OnMouseMove = function(e)
    {
        check_MouseMoveEvent(e);

        var pos = this.GetMouseMoveCoords();
        if (pos.Page == -1)
            return;

        // if (this.IsFreezePage(pos.Page))
        //     return;

        // if (this.m_sLockedCursorType != "")
        //     this.SetCursorType("default");

        this.StartUpdateOverlay();

        /*
         var is_drawing = this.Native["checkMouseMove_Drawing"](pos.X, pos.Y, pos.Page);
         if (is_drawing === true)
         return;
         */
        // var is_drawing = this.checkMouseMove_Drawing(pos);
        // if (is_drawing === true)
        //     return;

        //this.TableOutlineDr.bIsNoTable = true;

        if (this.SelectDrag == 1 || this.SelectDrag == 2)
        {
            var oController = this.LogicDocument.GetCurrentController();
            if(oController)
            {
                this.SelectClearLock = true;
                var oTargetTextObject = AscFormat.getTargetTextObject(oController);
                if(oTargetTextObject){
                    var _oldShift = global_mouseEvent.ShiftKey;
                    global_mouseEvent.ShiftKey = true;
                    oTargetTextObject.selectionSetStart(global_mouseEvent, pos.X, pos.Y, 0);
                    oTargetTextObject.selectionSetEnd(global_mouseEvent, pos.X, pos.Y, 0);
                    global_mouseEvent.ShiftKey = _oldShift;
                    this.LogicDocument.Document_UpdateSelectionState();
                    this.m_oWordControl.OnUpdateOverlay();
                }
                this.SelectClearLock = false;
            }
        }
        else
        {
            this.LogicDocument.OnMouseMove(global_mouseEvent, pos.X, pos.Y, pos.Page);
        }

        this.EndUpdateOverlay();
    };


    CDrawingDocument.prototype.OnMouseUp = function(e)
    {
        check_MouseUpEvent(e);

        var pos = this.GetMouseMoveCoords();
        var _is_select = false;
        if (this.SelectDrag == 1 || this.SelectDrag == 2)
        {
            _is_select = true;
        }
        this.SelectDrag = -1;

        if (pos.Page == -1)
            return this.CheckReturnMouseUp();

        // if (this.IsFreezePage(pos.Page))
        //     return this.CheckReturnMouseUp();

        // this.UnlockCursorType();

        this.StartUpdateOverlay();

        // восстанавливаем фокус
        this.m_bIsMouseLock = false;

        /*
         var is_drawing = this.Native["checkMouseUp_Drawing"](pos.X, pos.Y, pos.Page);
         if (is_drawing === true)
         return;
         */
        // var is_drawing = this.checkMouseUp_Drawing(pos);
        // if (is_drawing === true)
        //     return this.CheckReturnMouseUp();

        // this.Native["DD_CheckTimerScroll"](false);

        // this.Native.m_bIsMouseUpSend = true;

        // this.Native["DD_NeedScrollToTargetFlag"](true);

        if (_is_select)
        {
            var oController = this.LogicDocument.GetCurrentController();
            if(oController)
            {
                this.SelectClearLock = true;
                var oTargetTextObject = AscFormat.getTargetTextObject(oController);
                if(oTargetTextObject){
                    var _oldShift = global_mouseEvent.ShiftKey;
                    global_mouseEvent.ShiftKey = true;
                    oTargetTextObject.selectionSetStart(global_mouseEvent, pos.X, pos.Y, 0);
                    oTargetTextObject.selectionSetEnd(global_mouseEvent, pos.X, pos.Y, 0);
                    global_mouseEvent.ShiftKey = _oldShift;
                    this.LogicDocument.Document_UpdateSelectionState();
                    this.m_oWordControl.OnUpdateOverlay();
                }
                this.SelectClearLock = false;
            }
        }
        else
        {
            this.LogicDocumentOnMouseUp(global_mouseEvent, pos.X, pos.Y, pos.Page);
            this.LogicDocument.Document_UpdateSelectionState();
            this.m_oWordControl.OnUpdateOverlay();
        }
        // this.Native["DD_NeedScrollToTargetFlag"](false);

        // this.Native.m_bIsMouseUpSend = false;
        this.LogicDocument.Document_UpdateInterfaceState();
        this.LogicDocument.Document_UpdateRulersState();

        this.EndUpdateOverlay();
        return this.CheckReturnMouseUp();
    };




CDrawingDocument.prototype.CheckReturnMouseUp = function()
    {
        // return: array
        // first: type (0 - none, 1 - onlytarget, 2 - select, 3 - tracks)
        // type = 0: none
        // type = 1: (double)x, (double)y, (int)page, [option: transform (6 double values)]
        // type = 2: (double)x1, (double)y1, (int)page1, (double)x2, (double)y2, (int)page2, [option: transform (6 double values)]
        // type = 3: (double)x, (double)y, (double)w, (double)h, (int)page, [option: transform (6 double values)]


        var _ret = [];
        _ret.push(0);

        this.SelectRect1 = null;
        this.SelectRect2 = null;

		var oController = this.m_oLogicDocument.GetCurrentController();



		var oTargetContent = oController.getTargetDocContent();

		if(oTargetContent)
		{
			var _target = oTargetContent.IsSelectionUse();
			var oTextTransform = oTargetContent.Get_ParentTextTransform();
			if (_target === false)
			{
				_ret[0] = 1;

				_ret.push(this.TargetPos.X);
				_ret.push(this.TargetPos.Y);
				_ret.push(this.TargetPos.Page);

				if (oTextTransform && !oTextTransform.IsIdentity())
				{
					_ret.push(oTextTransform.sx);
					_ret.push(oTextTransform.shy);
					_ret.push(oTextTransform.shx);
					_ret.push(oTextTransform.sy);
					_ret.push(oTextTransform.tx);
					_ret.push(oTextTransform.ty);
				}

				return _ret;
			}

			var _select = oTargetContent.GetSelectionBounds();
			if (_select)
			{

				_ret[0] = 2;
				var _rect1 = _select.Start;
				var _rect2 = _select.End;
				this.SelectRect1 = _rect1;
				this.SelectRect2 = _rect2;

				var _x1 = _rect1.X;
				var _y1 = _rect1.Y;
				var _y11 = _rect1.Y + _rect2.H;
				var _x2 = _rect2.X + _rect2.W;
				var _y2 = _rect2.Y;
				var _y22 = _rect2.Y + _rect2.Y;

				var _eps = 0.0001;
				if (Math.abs(_x1 - _x2) < _eps &&
					Math.abs(_y1 - _y2) < _eps &&
					Math.abs(_y11 - _y22) < _eps)
				{
					_ret[0] = 0;

				}
				else
				{
					_ret.push(_select.Start.X);
					_ret.push(_select.Start.Y);
					_ret.push(_select.Start.Page);
					_ret.push(_select.End.X + _select.End.W);
					_ret.push(_select.End.Y + _select.End.H);
					_ret.push(_select.End.Page);

					if (oTextTransform && !oTextTransform.IsIdentity())
					{

						_ret.push(oTextTransform.sx);
						_ret.push(oTextTransform.shy);
						_ret.push(oTextTransform.shx);
						_ret.push(oTextTransform.sy);
						_ret.push(oTextTransform.tx);
						_ret.push(oTextTransform.ty);
					}

					return _ret;
				}
			}
		}

        var _object_bounds = oController.getSelectedObjectsBounds();
        if (_object_bounds)
        {

            _ret[0] = 3;
            _ret.push(_object_bounds.minX);
            _ret.push(_object_bounds.minY);
            _ret.push(_object_bounds.maxX);
            _ret.push(_object_bounds.maxY);
            _ret.push(_object_bounds.pageIndex);

            return _ret;
        }


        return _ret;
    };

    CDrawingDocument.prototype.EndTrackTable = function()
    {};

// collaborative targets
CDrawingDocument.prototype.Collaborative_UpdateTarget = function (_id, _shortId, _x, _y, _size, _page, _transform, is_from_paint)
  	{
  		if (is_from_paint !== true)
  		{
  			this.CollaborativeTargetsUpdateTasks.push([_id, _shortId, _x, _y, _size, _page, _transform]);
            this.m_oWordControl.OnUpdateOverlay();
            this.m_oWordControl.EndUpdateOverlay();
  			return;
  		}
      else
      {
        var color = AscCommon.getUserColorById(_shortId, null, true);

        if (null != _transform) {
          this.Native["collaborativeUpdateTarget"](_id, _shortId, _x, _y, _size, _page,
            _transform.sx, _transform.shy, _transform.shx, _transform.sy, _transform.tx, _transform.ty,
            color.r, color.g, color.b
          );
        } else {
          this.Native["collaborativeUpdateTarget"](_id, _shortId, _x, _y, _size, _page,
             1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
             color.r, color.g, color.b
           );
        }
  		}

  		for (var i = 0; i < this.CollaborativeTargets.length; i++)
  		{
  			if (_id == this.CollaborativeTargets[i].Id)
  			{
  				this.CollaborativeTargets[i].CheckPosition(this, _x, _y, _size, _page, _transform);
  				return;
  			}
  		}
  		var _target = new CDrawingCollaborativeTarget();
  		_target.Id = _id;
  		_target.ShortId = _shortId;
  		_target.CheckPosition(this, _x, _y, _size, _page, _transform);
  		this.CollaborativeTargets[this.CollaborativeTargets.length] = _target;
      };
      CDrawingDocument.prototype.Collaborative_RemoveTarget = function (_id)
  	{
        this.Native["collaborativeRemoveTarget"](_id);

 		for (var i = 0; i < this.CollaborativeTargets.length; i++)
  		{
  			if (_id == this.CollaborativeTargets[i].Id)
  			{
  				this.CollaborativeTargets[i].Remove(this);
  				this.CollaborativeTargets.splice(i, 1);
  			}
  		}

          this.m_oWordControl.OnUpdateOverlay();
          this.m_oWordControl.EndUpdateOverlay();
      };
      CDrawingDocument.prototype.Collaborative_TargetsUpdate = function (bIsChangePosition)
  	{
  		var _len_tasks = this.CollaborativeTargetsUpdateTasks.length;
  		var i = 0;
  		for (i = 0; i < _len_tasks; i++)
  		{
  			var _tmp = this.CollaborativeTargetsUpdateTasks[i];
  			this.Collaborative_UpdateTarget(_tmp[0], _tmp[1], _tmp[2], _tmp[3], _tmp[4], _tmp[5], _tmp[6], true);
  		}
  		if (_len_tasks != 0)
  			this.CollaborativeTargetsUpdateTasks.splice(0, _len_tasks);

  		if (bIsChangePosition)
  		{
  			for (i = 0; i < this.CollaborativeTargets.length; i++)
  			{
  				this.CollaborativeTargets[i].Update(this);
  			}
  		}
  	};
  	CDrawingDocument.prototype.Collaborative_GetTargetPosition = function (UserId)
  	{
  		for (var i = 0; i < this.CollaborativeTargets.length; i++)
  		{
  			if (UserId == this.CollaborativeTargets[i].Id)
  				return {X: this.CollaborativeTargets[i].HtmlElementX, Y: this.CollaborativeTargets[i].HtmlElementY};
  		}

  		return null;
  	};

CDrawingDocument.prototype.DrawHorAnchor = function(pageIndex, x)
{
};
CDrawingDocument.prototype.DrawVerAnchor = function(pageIndex, y)
{
};

CDrawingDocument.prototype.CheckSelectMobile = function()
{
    this.SelectRect1 = null;
    this.SelectRect2 = null;

    var _select = this.LogicDocument.GetSelectionBounds();
    if (!_select)
        return;

    var _rect1 = _select.Start;
    var _rect2 = _select.End;

    if (!_rect1 || !_rect2)
        return;

    this.SelectRect1 = _rect1;
    this.SelectRect2 = _rect2;

    this.Native["DD_DrawMobileSelection"](_rect1.X, _rect1.Y, _rect1.W, _rect1.H, _rect1.Page,
        _rect2.X, _rect2.Y, _rect2.W, _rect2.H, _rect2.Page);
};


CDrawingDocument.prototype.LogicDocumentOnMouseDown = function(e, x, y, page)
{
    if (this.m_bIsMouseLockDocument)
    {
        this.LogicDocument.OnMouseUp(e, x, y, page);
        this.m_bIsMouseLockDocument = false;
    }
    this.LogicDocument.OnMouseDown(e, x, y, page);
    this.m_bIsMouseLockDocument = true;
};

CDrawingDocument.prototype.LogicDocumentOnMouseUp = function(e, x, y, page)
{
    if (!this.m_bIsMouseLockDocument)
    {
        this.LogicDocument.OnMouseDown(e, x, y, page);
        this.m_bIsMouseLockDocument = true;
    }
    this.LogicDocument.OnMouseUp(e, x, y, page);
    this.m_bIsMouseLockDocument = false;
};

CDrawingDocument.prototype.GetInvertTextMatrix = function(oController){
    
};

CDrawingDocument.prototype.OnCheckMouseDown = function(e)
{
    // 0 - none
    // 1 - select markers
    // 2 - drawing track

    var oController = this.LogicDocument.GetCurrentController();
    check_MouseDownEvent(e, false);
    if(!oController){
        return -1;
    }

    var oTargetTextObject = AscFormat.getTargetTextObject(oController);
    var matrixCheck = oController.getTargetTransform();
    var oInvertMaxtrix;
    if(oTargetTextObject && oTargetTextObject.invertTransformText){
        oInvertMaxtrix = oTargetTextObject.invertTransformText;
    }
    else{
        oInvertMaxtrix =  AscCommon.global_MatrixTransformer.Invert(matrixCheck);
    }
    var oDocContent;
    var pos = {X: global_mouseEvent.X, Y: global_mouseEvent.Y, Page: this.LogicDocument.CurPage};
    if (pos.Page == -1)
        return 0;

    this.SelectDrag = -1;
    if (this.SelectRect1 && this.SelectRect2)
    {
        // проверям попадание в селект
        var radiusMM = 5;
        if (this.IsRetina)
            radiusMM *= 2;
        radiusMM /= this.Native["DD_GetDotsPerMM"]();

        var _circlePos1_x = 0;
        var _circlePos1_y = 0;
        var _circlePos2_x = 0;
        var _circlePos2_y = 0;

        if (!matrixCheck)
        {
            _circlePos1_x = this.SelectRect1.X;
            _circlePos1_y = this.SelectRect1.Y - radiusMM;

            _circlePos2_x = this.SelectRect2.X + this.SelectRect2.W;
            _circlePos2_y = this.SelectRect2.Y + this.SelectRect2.H + radiusMM;
        }
        else
        {
            var _circlePos1_x_mem = this.SelectRect1.X;
            var _circlePos1_y_mem = this.SelectRect1.Y - radiusMM;

            var _circlePos2_x_mem = this.SelectRect2.X + this.SelectRect2.W;
            var _circlePos2_y_mem = this.SelectRect2.Y + this.SelectRect2.H + radiusMM;

            _circlePos1_x = matrixCheck.TransformPointX(_circlePos1_x_mem, _circlePos1_y_mem);
            _circlePos1_y = matrixCheck.TransformPointY(_circlePos1_x_mem, _circlePos1_y_mem);
            _circlePos2_x = matrixCheck.TransformPointX(_circlePos2_x_mem, _circlePos2_y_mem);
            _circlePos2_y = matrixCheck.TransformPointY(_circlePos2_x_mem, _circlePos2_y_mem);
        }

        var _selectCircleEpsMM = 10; // 1cm;
        var _selectCircleEpsMM_square = _selectCircleEpsMM * _selectCircleEpsMM;

        var _distance1 = ((pos.X - _circlePos1_x) * (pos.X - _circlePos1_x) + (pos.Y - _circlePos1_y) * (pos.Y - _circlePos1_y));
        var _distance2 = ((pos.X - _circlePos2_x) * (pos.X - _circlePos2_x) + (pos.Y - _circlePos2_y) * (pos.Y - _circlePos2_y));

        var candidate = 1;
        if (_distance2 < _distance1)
            candidate = 2;


        if (1 == candidate && _distance1 < _selectCircleEpsMM_square)
        {
            this.SelectClearLock = true;
            this.SelectDrag = 1;

            var oTargetTextObject = AscFormat.getTargetTextObject(oController);
            if(oTargetTextObject){
                var _oldShift = global_mouseEvent.ShiftKey;
                global_mouseEvent.ShiftKey = true;
                oController.cursorMoveRight(false, false);
                oTargetTextObject.selectionSetStart(global_mouseEvent, pos.X, pos.Y, 0);
                oTargetTextObject.selectionSetEnd(global_mouseEvent, pos.X, pos.Y, 0);
                global_mouseEvent.ShiftKey = _oldShift;
                this.LogicDocument.Document_UpdateSelectionState();
                this.m_oWordControl.OnUpdateOverlay();
            }
            this.SelectClearLock = false;
        }

        if (2 == candidate && _distance2 < _selectCircleEpsMM_square)
        {
            this.SelectClearLock = true;
            this.SelectDrag = 2;
            var oTargetTextObject = AscFormat.getTargetTextObject(oController);
            if(oTargetTextObject){
                var _oldShift = global_mouseEvent.ShiftKey;
                global_mouseEvent.ShiftKey = true;
                oController.cursorMoveLeft(false, false);
                oTargetTextObject.selectionSetStart(global_mouseEvent, pos.X, pos.Y, 0);
                oTargetTextObject.selectionSetEnd(global_mouseEvent, pos.X, pos.Y, 0);
                global_mouseEvent.ShiftKey = _oldShift;
                this.LogicDocument.Document_UpdateSelectionState();
                this.m_oWordControl.OnUpdateOverlay();
            }

            this.SelectClearLock = false;
        }

        if (this.SelectDrag != -1)
            return 1;
    }

    if (true)
    {
        // проверям н]а попадание в графические объекты (грубо говоря - треки)
        if (!this.IsViewMode)
        {
            global_mouseEvent.KoefPixToMM = 5;

            if (this.Native["GetDeviceDPI"])
            {
                // 1см
                global_mouseEvent.AscHitToHandlesEpsilon = 5 * this.Native["GetDeviceDPI"]() / (25.4 * this.Native["DD_GetDotsPerMM"]() );
            }

            var oController = this.LogicDocument.GetCurrentController();
            var _isDrawings = false;
            _isDrawings = oController.isPointInDrawingObjects4(pos.X, pos.Y, pos.Page, true);
            

            if (_isDrawings) {
                this.OnMouseDown(e);
            }

            global_mouseEvent.KoefPixToMM = 1;

            if (_isDrawings)
                return 2;
        }
    }

    return 0;
}


CDrawingDocument.prototype.OnKeyboardEvent = function(_params){
    var _len = _params.length / 4;


    for (var i = 0; i < _len; i++)
    {
        var _offset = i * 4;
        switch (_params[_offset])
        {
            case 4: // down
            {
                this.IsKeyDownButNoPress = true;
                check_KeyboardEvent_Array(_params, _offset);
                this.bIsUseKeyPress = (this.LogicDocument.OnKeyDown(AscCommon.global_keyboardEvent) === true) ? false : true;
                break;
            }
            case 5: // Press
            {
                check_KeyboardEvent_Array(_params, _offset);
                this.LogicDocument.OnKeyPress(AscCommon.global_keyboardEvent);
                break;
            }
            case 6: // up
            {
                AscCommon.global_keyboardEvent.AltKey = false;
                AscCommon.global_keyboardEvent.CtrlKey = false;
                AscCommon.global_keyboardEvent.ShiftKey = false;
                break;
            }
            default:
                break;
        }
    }
    this.m_oWordControl.OnUpdateOverlay();
};



function DrawBackground(graphics, unifill, w, h)
{
    // первым делом рисуем белый рект!
    if (true)
    {
        // ну какой-то бэкграунд должен быть
        graphics.SetIntegerGrid(false);

        var _l = 0;
        var _t = 0;
        var _r = (0 + w);
        var _b = (0 + h);

        graphics._s();
        graphics._m(_l, _t);
        graphics._l(_r, _t);
        graphics._l(_r, _b);
        graphics._l(_l, _b);
        graphics._z();

        graphics.b_color1(255, 255, 255, 255);
        graphics.df();
        graphics._e();
    }

    if (unifill == null || unifill.fill == null)
        return;

    graphics.SetIntegerGrid(false);

    var _shape = {};

    _shape.brush           = unifill;
    _shape.pen             = null;
    _shape.TransformMatrix = new AscCommon.CMatrix();
    _shape.extX            = w;
    _shape.extY            = h;
    _shape.check_bounds    = function(checker)
    {
        checker._s();
        checker._m(0, 0);
        checker._l(this.extX, 0);
        checker._l(this.extX, this.extY);
        checker._l(0, this.extY);
        checker._z();
        checker._e();
    };

    var shape_drawer = new AscCommon.CShapeDrawer();
    shape_drawer.fromShape2(_shape, graphics, null);
    shape_drawer.draw(null);
}

function CSlideDrawer()
{
	this.CONST_BORDER               = 10; // in px

	this.CheckRecalculateSlide = function()
	{
	};

	this.CheckSlideSize = function(zoom, slideNum)
	{
	};

	this.CheckSlide = function(slideNum)
	{
		
	};

	this.DrawSlide = function(outputCtx, scrollX, scrollX_max, scrollY, scrollY_max, slideNum)
	{
	};
}

function CDrawingCollaborativeTarget()
{
	this.Id = "";
	this.ShortId = "";

	this.X = 0;
	this.Y = 0;
	this.Size = 0;
	this.Page = -1;

	this.Color = null;
	this.Transform = null;

	this.HtmlElement = null;
	this.HtmlElementX = 0;
	this.HtmlElementY = 0;

	this.Color = null;

	this.Style = "";
}
CDrawingCollaborativeTarget.prototype =
{
	CheckPosition: function (_drawing_doc, _x, _y, _size, _page, _transform)
	{
		 // 2) определяем размер
		 this.Transform = _transform;
		 this.Size = _size;

		 var _old_x = this.X;
		 var _old_y = this.Y;
		 var _old_page = this.Page;

		 this.X = _x;
		 this.Y = _y;
		 this.Page = _page;
	},

	Remove: function (_drawing_doc)
	{

  },

	Update: function (_drawing_doc)
	{

  }
};
//--------------------------------------------------------export----------------------------------------------------
window['AscCommon'] = window['AscCommon'] || {};
window['AscCommon'].CDrawingDocument = CDrawingDocument;
