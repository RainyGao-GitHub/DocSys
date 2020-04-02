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

var isRealObject = AscCommon.isRealObject;
var global_MatrixTransformer = AscCommon.global_MatrixTransformer;

CShape.prototype.setRecalculateInfo = function()
{
    this.recalcInfo =
    {
        recalculateContent:        true,
        recalculateTxBoxContent:   true,
        recalculateBrush:          true,
        recalculatePen:            true,
        recalculateTransform:      true,
        recalculateTransformText:  true,
        recalculateBounds:         true,
        recalculateGeometry:       true,
        recalculateStyle:          true,
        recalculateFill:           true,
        recalculateLine:           true,
        recalculateTransparent:    true,
        recalculateTextStyles:     [true, true, true, true, true, true, true, true, true],
        recalculateShapeStyleForParagraph: true,
        recalculateWrapPolygon: true,
        oContentMetrics: null,
        AllDrawings: []
    };

    this.bNeedUpdatePosition = true;
    this.textStyleForParagraph = null;
    this.contentWidth = null;
    this.contentHeight = null;
    this.compiledStyles = [];
    this.posX = null;
    this.posY = null;

    this.localTransform = new AscCommon.CMatrix();
    this.localTransformText = new AscCommon.CMatrix();
};

CShape.prototype.recalcContent = function()
{
    if(this.bWordShape)
    {
        this.recalcInfo.recalculateTxBoxContent = true;
        this.recalcInfo.AllDrawings = [];
        if(this.checkAutofit && this.checkAutofit())
        {
            this.recalcGeometry();
            this.recalcWrapPolygon();
            this.recalcBounds();
            this.recalcTransform();
        }
    }
    else
    {
        this.recalcInfo.recalculateContent = true;
    }
};

CShape.prototype.getDrawingDocument = function()
{
    return editor.WordControl.m_oDrawingDocument;
};


CShape.prototype.getTextArtPreviewManager = function()
{
    return editor.textArtPreviewManager;
};

CShape.prototype.recalcBrush = function()
{
    this.recalcInfo.recalculateBrush = true;
};


CShape.prototype.recalcPen = function()
{
    this.recalcInfo.recalculatePen = true;
};

CShape.prototype.recalcTransform = function()
{
    this.recalcInfo.recalculateTransform = true;
    this.snapArrayX.length = 0;
    this.snapArrayY.length = 0;
};
CShape.prototype.recalcTransformText = function()
{
    this.recalcInfo.recalculateTransformText = true;
};
CShape.prototype.recalcBounds = function()
{
    this.recalcInfo.recalculateBounds = true;
};
CShape.prototype.recalcGeometry = function()
{
    this.recalcInfo.recalculateGeometry = true;
};
CShape.prototype.recalcStyle = function()
{
    this.recalcInfo.recalculateStyle = true;
};
CShape.prototype.recalcFill = function()
{
    this.recalcInfo.recalculateFill = true;
};
CShape.prototype.recalcLine = function()
{
    this.recalcInfo.recalculateLine = true;
};
CShape.prototype.recalcTransparent = function()
{
    this.recalcInfo.recalculateTransparent = true;
};
CShape.prototype.recalcTextStyles = function()
{
    this.recalcInfo.recalculateTextStyles = true;
};
CShape.prototype.recalcTxBoxContent = function()
{
    this.recalcInfo.recalculateTxBoxContent = true;
    this.recalcInfo.AllDrawings = [];
    if(this.checkAutofit && this.checkAutofit() && (!editor || !editor.noCreatePoint || editor.exucuteHistory))
    {
        this.recalcGeometry();
        this.recalcWrapPolygon();
        this.recalcBounds();
        this.recalcTransform();
    }
};

CShape.prototype.recalcWrapPolygon = function()
{
    this.recalcInfo.recalculateWrapPolygon = true;
};

CShape.prototype.addToRecalculate = function()
{
    var oLogicDoc = this.getLogicDocument();
    if(oLogicDoc && oLogicDoc.DrawingObjects)
    {
        oLogicDoc.DrawingObjects.addToRecalculate(this);//TODO: надо уходить от editor'а;
    }
};
CShape.prototype.handleUpdatePosition = function()
{
    this.recalcTransform();
    this.recalcBounds();
    this.recalcTransformText();
    this.addToRecalculate();
};
CShape.prototype.handleUpdateExtents = function()
{
    this.recalcContent();
    this.recalcGeometry();
    this.recalcBounds();
    this.recalcWrapPolygon();
    this.recalcContent();
    this.recalcTxBoxContent();
    this.recalcTransform();
    this.recalcTransformText();
    this.addToRecalculate();
};
CShape.prototype.handleUpdateRot = function()
{
    this.recalcTransform();
    if(this.bodyPr && this.bodyPr.upright)
    {
        this.recalcContent();
    }
    this.recalcTransformText();
    this.recalcBounds();
    this.recalcWrapPolygon();
    this.addToRecalculate();
};
CShape.prototype.handleUpdateFlip = function()
{
    this.recalcTransform();
    this.recalcTransformText();
    this.recalcContent();
    this.recalcWrapPolygon();
    this.addToRecalculate();
};
CShape.prototype.handleUpdateFill = function()
{
    this.recalcBrush();
    this.recalcFill();
    this.recalcTransparent();
    this.addToRecalculate();
};
CShape.prototype.handleUpdateLn = function()
{
    this.recalcLine();
    this.recalcPen();
    this.recalcBounds();
    this.recalcWrapPolygon();
    this.recalcContent();
    this.recalcTransformText();
    this.addToRecalculate();
    if(this.recalcInfo && this.recalcInfo.recalculateTransform){
        if(this.group)
        {
            var oMainGroup = this.getMainGroup && this.getMainGroup();
            if(oMainGroup.parent && oMainGroup.parent.Refresh_RecalcData)
            {
                oMainGroup.parent.Refresh_RecalcData({Type: AscDFH.historyitem_Drawing_SetExtent});
            }
        }
        else
        {
            if(this.parent && this.parent.Refresh_RecalcData)
            {
                this.parent.Refresh_RecalcData({Type: AscDFH.historyitem_Drawing_SetExtent});
            }
        }
    }
};
CShape.prototype.handleUpdateGeometry = function()
{
    this.recalcGeometry();
    this.recalcBounds();
    this.recalcWrapPolygon();
    this.recalcContent();
    this.recalcTransformText();
    this.addToRecalculate();
};
CShape.prototype.convertPixToMM = function(pix)
{
    return this.getDrawingDocument().GetMMPerDot(pix);
};
CShape.prototype.getCanvasContext = function()
{
    return this.getDrawingDocument().CanvasHitContext;
};
CShape.prototype.getCompiledStyle = function()
{
    return this.style;
};
CShape.prototype.getHierarchy = function()
{
    return [];
};
CShape.prototype.getParentObjects = function ()
{
    var oTheme;
    var oLogicDoc = this.getLogicDocument();
    if(oLogicDoc)
    {
        oTheme = oLogicDoc.theme;
    }
    if(!oTheme)
    {
        oTheme = AscFormat.GenerateDefaultTheme(null, null);
    }
    return {slide: null, layout: null, master: null, theme: oTheme};
};


CShape.prototype.recalculateTxBoxContent = function()
{
    if(this.textBoxContent === null || this.textBoxContent.Parent !== this)
    {
        this.txWarpStructParamarks = null;
        this.txWarpStruct = null;
        this.txWarpStructParamarksNoTransform = null;
        this.txWarpStructNoTransform = null;
        this.recalcInfo.warpGeometry = null;
        return;
    }
    this.txWarpStruct = null;
    var oBodyPr = this.getBodyPr();
    var oRecalcObj = this.recalculateDocContent(this.textBoxContent, oBodyPr);
    this.contentHeight = oRecalcObj.contentH;
    this.contentWidth = oRecalcObj.w;
    if(this.recalcInfo.recalcTitle)
    {
        this.recalcInfo.bRecalculatedTitle = true;
        this.recalcInfo.recalcTitle = null;

        var oTextWarpContent = this.checkTextWarp(this.textBoxContent, oBodyPr, oRecalcObj.w, oRecalcObj.h, true, false);
        this.txWarpStructParamarks = oTextWarpContent.oTxWarpStructParamarksNoTransform;
        this.txWarpStruct = oTextWarpContent.oTxWarpStructNoTransform;

        this.txWarpStructParamarksNoTransform = oTextWarpContent.oTxWarpStructParamarksNoTransform;
        this.txWarpStructNoTransform = oTextWarpContent.oTxWarpStructNoTransform;
    }
    else
    {
        var oTextWarpContent = this.checkTextWarp(this.textBoxContent, oBodyPr, oRecalcObj.w, oRecalcObj.h, true, true);
        this.txWarpStructParamarks = oTextWarpContent.oTxWarpStructParamarks;
        this.txWarpStruct = oTextWarpContent.oTxWarpStruct;

        this.txWarpStructParamarksNoTransform = oTextWarpContent.oTxWarpStructParamarksNoTransform;
        this.txWarpStructNoTransform = oTextWarpContent.oTxWarpStructNoTransform;
    }
    return oRecalcObj;
};



CShape.prototype.recalculatePresentation = function ()
{

    AscFormat.ExecuteNoHistory(function(){

        if (this.recalcInfo.recalculateBrush) {
            this.recalculateBrush();
            this.recalcInfo.recalculateBrush = false;
        }

        if (this.recalcInfo.recalculatePen) {
            this.recalculatePen();
            this.recalcInfo.recalculatePen = false;
        }
        if (this.recalcInfo.recalculateTransform) {
            this.recalculateTransform();
            this.recalculateSnapArrays();
            this.recalcInfo.recalculateTransform = false;
        }

        if (this.recalcInfo.recalculateGeometry) {
            this.recalculateGeometry();
            this.recalcInfo.recalculateGeometry = false;
        }

        if (this.recalcInfo.recalculateContent) {
            this.recalcInfo.oContentMetrics = this.recalculateContent();
            this.recalcInfo.recalculateContent = false;
        }
        if (this.recalcInfo.recalculateTransformText) {
            this.recalculateTransformText();
            this.recalcInfo.recalculateTransformText = false;
        }
        if(this.recalcInfo.recalculateBounds)
        {
            this.recalculateBounds();
            this.recalcInfo.recalculateBounds = false;
            this.recalculateShdw();
        }

    }, this, []);
};

CShape.prototype.recalculate = function ()
{
    if(this.bDeleted)
        return;
    if(!this.bWordShape){
        this.recalculatePresentation();
       return;
    }
    AscFormat.ExecuteNoHistory(function()
    {
        var bRecalcShadow = this.recalcInfo.recalculateBrush ||
            this.recalcInfo.recalculatePen ||
            this.recalcInfo.recalculateTransform ||
            this.recalcInfo.recalculateGeometry ||
            this.recalcInfo.recalculateBounds;
        if(this.bWordShape)
        {
            if (this.recalcInfo.recalculateBrush) {
                this.recalculateBrush();
                this.recalcInfo.recalculateBrush = false;
            }

            if (this.recalcInfo.recalculatePen) {
                this.recalculatePen();
                this.recalcInfo.recalculatePen = false;
            }
            if (this.recalcInfo.recalculateTransform) {
                this.recalculateTransform();
                this.recalcInfo.recalculateTransform = false;
            }

            if (this.recalcInfo.recalculateGeometry) {
                this.recalculateGeometry();
                this.recalcInfo.recalculateGeometry = false;
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
            if(bRecalcShadow)
            {
                this.recalculateShdw();
            }
        }
        else
        {
            if (this.recalcInfo.recalculateBrush) {
                this.recalculateBrush();
                this.recalcInfo.recalculateBrush = false;
            }

            if (this.recalcInfo.recalculatePen) {
                this.recalculatePen();
                this.recalcInfo.recalculatePen = false;
            }
            if (this.recalcInfo.recalculateTransform) {
                this.recalculateTransform();
                this.recalculateSnapArrays();
                this.recalcInfo.recalculateTransform = false;
            }

            if (this.recalcInfo.recalculateGeometry) {
                this.recalculateGeometry();
                this.recalcInfo.recalculateGeometry = false;
            }

            if (this.recalcInfo.recalculateContent) {
                this.recalcInfo.oContentMetrics = this.recalculateContent();
                this.recalcInfo.recalculateContent = false;
            }

            if (this.recalcInfo.recalculateTransformText) {
                this.recalculateTransformText();
                this.recalcInfo.recalculateTransformText = false;
            }

            if(this.recalcInfo.recalculateBounds)
            {
                this.recalculateBounds();
                this.recalcInfo.recalculateBounds = false;
            }

            if(bRecalcShadow)
            {
                this.recalculateShdw();
            }
        }
        this.clearCropObject();
        this.bNeedUpdatePosition = true;
    }, this, []);

};

CShape.prototype.recalculateText = function()
{
    if(!this.bWordShape)
        return;
    AscFormat.ExecuteNoHistory(function()
    {
        if(this.bWordShape)
        {
            if (this.recalcInfo.recalculateTxBoxContent)
            {
                this.recalcInfo.oContentMetrics = this.recalculateTxBoxContent();
                this.recalcInfo.recalculateTxBoxContent = false;
                this.recalcInfo.AllDrawings = [];
                var oContent = this.getDocContent();
                if(oContent)
                {
                    oContent.GetAllDrawingObjects(this.recalcInfo.AllDrawings);
                }
            }
        }
        else
        {
            if (this.recalcInfo.recalculateContent)
            {
                this.recalcInfo.oContentMetrics = this.recalculateContent();
                this.recalcInfo.recalculateContent = false;
            }
        }

        if (this.recalcInfo.recalculateTransformText) {
            this.recalculateTransformText();
        }
    }, this, []);
};

CShape.prototype.recalculateWrapPolygon = function()
{
    if(this.parent && this.parent.wrappingPolygon)
    {
        this.parent.wrappingPolygon.calculateRelToAbs(this.localTransform, this);
    }
};

CShape.prototype.getArrayWrapPolygons = function()
{
    var ret;
    if(this.spPr && this.spPr.geometry)
        ret =  this.spPr.geometry.getArrayPolygons();
    else
        ret = [];
    var t = this.localTransform;
    for(var i = 0; i < ret.length; ++i)
    {
        var polygon = ret[i];
        for(var j = 0; j < polygon.length; ++j)
        {
            var p = polygon[j];
            var x = t.TransformPointX(p.x, p.y);
            var y = t.TransformPointY(p.x, p.y);
            p.x = x;
            p.y = y;
        }
    }
    return ret;
};

CShape.prototype.recalculateContent = function()
{
    var content = this.getDocContent();
    if(content)
    {
        var body_pr = this.getBodyPr();
        var oRecalcObj = this.recalculateDocContent(content, body_pr);
        this.contentHeight = oRecalcObj.contentH;
        this.contentWidth = oRecalcObj.w;
        return oRecalcObj;
    }
    return null;
};

CShape.prototype.recalculateTransform =  function()
{
    this.recalculateLocalTransform(this.localTransform);
};



CShape.prototype.updatePosition = function(x, y)
{
    this.posX = x;
    this.posY = y;
    if(!this.group)
    {
        this.x = this.localX + x;
        this.y = this.localY + y;
    }
    else
    {
        this.x = this.localX;
        this.y = this.localY;
    }
    this.updateTransformMatrix();
};

CShape.prototype.checkShapeChild = function()
{
    return false;
};

CShape.prototype.checkShapeChildTransform = function()
{
};
CShape.prototype.GetAllParagraphs = function(Props, ParaArray)
{
    var oContent = this.getDocContent();
    oContent && oContent.GetAllParagraphs(Props, ParaArray);
};



CShape.prototype.getArrayWrapIntervals = function(x0,y0, x1, y1, Y0Sp, Y1Sp, LeftField, RightField, arr_intervals, bMathWrap)
{
    return this.parent.getArrayWrapIntervals(x0,y0, x1, y1, Y0Sp, Y1Sp, LeftField, RightField, arr_intervals, bMathWrap);
};
CShape.prototype.updateTransformMatrix = function()
{
    var oParentTransform = null;
    if(this.parent && this.parent.Get_ParentParagraph)
    {
        var oParagraph = this.parent.Get_ParentParagraph();
        if(oParagraph)
        {
            oParentTransform = oParagraph.Get_ParentTextTransform();
        }
    }
    this.transform = this.localTransform.CreateDublicate();
    global_MatrixTransformer.TranslateAppend(this.transform, this.posX, this.posY);
    if(oParentTransform)
    {
        global_MatrixTransformer.MultiplyAppend(this.transform, oParentTransform);
    }
    this.invertTransform = global_MatrixTransformer.Invert(this.transform);

    if(this.localTransformText)
    {
        this.transformText = this.localTransformText.CreateDublicate();
        global_MatrixTransformer.TranslateAppend(this.transformText, this.posX, this.posY);
        if(oParentTransform)
        {
            global_MatrixTransformer.MultiplyAppend(this.transformText, oParentTransform);
        }
        this.invertTransformText = global_MatrixTransformer.Invert(this.transformText);
    }
    if(this.localTransformTextWordArt)
    {
        this.transformTextWordArt = this.localTransformTextWordArt.CreateDublicate();
        global_MatrixTransformer.TranslateAppend(this.transformTextWordArt, this.posX, this.posY);
        if(oParentTransform)
        {
            global_MatrixTransformer.MultiplyAppend(this.transformTextWordArt, oParentTransform);
        }
        this.invertTransformTextWordArt = global_MatrixTransformer.Invert(this.transformTextWordArt);
    }

    this.checkShapeChildTransform();
    this.checkContentDrawings();
};

CShape.prototype.checkContentDrawings = function()
{
    if(this.textBoxContent)
    {
        var all_drawings = this.textBoxContent.GetAllDrawingObjects([]);
        for(var i = 0; i < all_drawings.length; ++i)
        {
            all_drawings[i].GraphicObj.updateTransformMatrix();
        }
    }
};

CShape.prototype.applyParentTransform = function(transform)
{
    global_MatrixTransformer.MultiplyAppend(this.transform, transform);
    global_MatrixTransformer.MultiplyAppend(this.transformText, transform);
    this.invertTransform = global_MatrixTransformer.Invert(this.transform);
    this.invertTransformText = global_MatrixTransformer.Invert(this.transformText);
};

CShape.prototype.recalculateShapeStyleForParagraph = function()
{
    this.textStyleForParagraph = {TextPr: g_oDocumentDefaultTextPr.Copy(), ParaPr: g_oDocumentDefaultParaPr.Copy()};
    var styles = this.Get_Styles();
    if(styles)
    {
        this.textStyleForParagraph.ParaPr.Merge( styles.Default.ParaPr.Copy() );
        this.textStyleForParagraph.TextPr.Merge( styles.Default.TextPr.Copy() );
    }
    if(this.style && this.style.fontRef)
    {
        //this.textStyleForParagraph.ParaPr.Spacing.Line = 1;
        this.textStyleForParagraph.TextPr.Color.Auto = false;
        var shape_text_pr = new CTextPr();
        if(this.style.fontRef.Color)
        {
            shape_text_pr.Unifill = AscFormat.CreateUniFillByUniColorCopy(this.style.fontRef.Color);
        }
        if(this.style.fontRef.idx === AscFormat.fntStyleInd_major)
        {
            shape_text_pr.RFonts.Ascii = { Name: "+mj-lt", Index : -1 };
            shape_text_pr.RFonts.EastAsia = { Name: "+mj-ea", Index : -1 };
            shape_text_pr.RFonts.CS = { Name: "+mj-cs", Index : -1 };
        }
        else if( this.style.fontRef.idx === AscFormat.fntStyleInd_minor)
        {
            shape_text_pr.RFonts.Ascii = { Name: "+mn-lt", Index : -1 };
            shape_text_pr.RFonts.EastAsia = { Name: "+mn-ea", Index : -1 };
            shape_text_pr.RFonts.CS = { Name: "+mn-cs", Index : -1 };
        }
        shape_text_pr.FontRef = this.style.fontRef.createDuplicate();
        this.textStyleForParagraph.TextPr.Merge(shape_text_pr);
    }
};
CShape.prototype.Get_ShapeStyleForPara = function()
{
    if(this.recalcInfo.recalculateShapeStyleForParagraph)
    {
        this.recalculateShapeStyleForParagraph();
        this.recalcInfo.recalculateShapeStyleForParagraph = false;
    }
    return this.textStyleForParagraph;
};

CShape.prototype.Refresh_RecalcData = function(data)
{
    this.recalcTxBoxContent();
    this.recalcTransformText();
    this.Refresh_RecalcData2();
};

CShape.prototype.Refresh_RecalcData2 = function()
{

    var oController = this.getDrawingObjectsController();
    if(oController && AscFormat.getTargetTextObject(oController) === this)
    {
        this.recalcInfo.recalcTitle = this.getDocContent();
        this.recalcInfo.bRecalculatedTitle = true;
    }
    if(this.checkAutofit && this.checkAutofit())
    {
        this.handleUpdateExtents();
        if(this.group)
        {
            var oMainGroup = this.getMainGroup();
            if(oMainGroup.parent)
            {
                oMainGroup.parent.Refresh_RecalcData({Type: AscDFH.historyitem_Drawing_SetExtent});
            }
        }
        else
        {
            if(this.parent)
            {
                this.parent.Refresh_RecalcData({Type: AscDFH.historyitem_Drawing_SetExtent});
            }
        }
        return;
    }
    this.recalcTxBoxContent();
    this.recalcTransformText();
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

CShape.prototype.Get_StartPage_Absolute = function()
{
    return 0;
};
CShape.prototype.Get_AbsolutePage = function(CurPage)
{
    var oDrawing = this.GetParaDrawing();
    if(oDrawing)
    {
        return oDrawing.PageNum;
    }
    return 0;
};
CShape.prototype.Get_AbsoluteColumn = function(CurPage)
{
    return 0;
};
CShape.prototype.Get_Numbering = function()
{
    var oLogicDoc = this.getLogicDocument();
    if(oLogicDoc)
    {
        return oLogicDoc.Numbering;
    }
    return new CNumbering();
};
CShape.prototype.IsCell = function(isReturnCell)
{
	if (true === isReturnCell)
		return null;

    return false;
};

CShape.prototype.hitInTextRect = function(x, y)
{
    return this.hitInTextRectWord(x, y);
};

CShape.prototype.Set_CurrentElement = function(bUpdate, pageIndex)
{
    var oLogicDoc = this.getLogicDocument();
    if(!oLogicDoc)
    {
        return;
    }
	var para_drawing;
	if (this.group)
	{
		var main_group = this.group.getMainGroup();
		para_drawing   = main_group.parent;
	}
	else
	{
		para_drawing = this.parent;
	}

	if (para_drawing && para_drawing.DocumentContent)
	{
		var drawing_objects = oLogicDoc.DrawingObjects;
		drawing_objects.resetSelection(true);
		if (this.group)
		{
			var main_group = this.group.getMainGroup();
			drawing_objects.selectObject(main_group, pageIndex);
			main_group.selectObject(this, pageIndex);
			main_group.selection.textSelection       = this;
			drawing_objects.selection.groupSelection = main_group;
		}
		else
		{
			drawing_objects.selectObject(this, pageIndex);
			drawing_objects.selection.textSelection = this;
		}

		if (para_drawing && para_drawing.Parent instanceof Paragraph)
			para_drawing.Parent.Document_SetThisElementCurrent(false);

		var hdr_ftr = para_drawing.DocumentContent.IsHdrFtr(true);
		if (hdr_ftr)
		{
			hdr_ftr.Content.SetDocPosType(docpostype_DrawingObjects);
			hdr_ftr.Set_CurrentElement(bUpdate);
		}
		else
		{
			drawing_objects.document.SetDocPosType(docpostype_DrawingObjects);
			drawing_objects.document.Selection.Use = true;

			if (true === bUpdate)
			{
				drawing_objects.document.Document_UpdateInterfaceState();
				drawing_objects.document.Document_UpdateRulersState();
				drawing_objects.document.Document_UpdateSelectionState();
			}
		}
	}
};

CShape.prototype.GetParaDrawing = function()
{
    if(this.group)
    {
        var cur_group = this.group;
        while(cur_group.group)
        {
            cur_group = cur_group.group;
        }
        if(cur_group.parent)
        {
            return cur_group.parent;
        }
    }
    else
    {
        if(this.parent)
        {
            return this.parent;
        }
    }
    return null;
};


CShape.prototype.Get_StartPage_Relative = function()
{
    return 0;
};
CShape.prototype.CheckTableCoincidence = function(table)
{
    var para_drawing = this.GetParaDrawing();
    if(para_drawing && para_drawing.DocumentContent)
    {
        return para_drawing.DocumentContent.CheckTableCoincidence(table);
    }
    return false;
};

CShape.prototype.GetPrevElementEndInfo = function(CurElement)
{
    var para_drawing = this.GetParaDrawing();
    if(isRealObject(para_drawing) && isRealObject(para_drawing.DocumentContent) && (para_drawing.DocumentContent.GetPrevElementEndInfo) )
    {
        var parent_paragraph = para_drawing.Get_ParentParagraph();
        if(parent_paragraph)
            return para_drawing.DocumentContent.GetPrevElementEndInfo(parent_paragraph);
    }
    return null;
};
CShape.prototype.Is_ThisElementCurrent = function(CurElement)
{
    var oLogicDoc = this.getLogicDocument();
    if(!oLogicDoc)
    {
        return false;
    }
    return oLogicDoc.DrawingObjects.getTargetDocContent() === this.getDocContent();
};
CShape.prototype.Is_UseInDocument = function()
{
    if(this.group)
    {
        var aSpTree = this.group.spTree;
        for(var i = 0; i < aSpTree.length; ++i)
        {
            if(aSpTree[i] === this)
            {
                return this.group.Is_UseInDocument();
            }
        }
        return false;
    }
    if(this.parent && this.parent.Is_UseInDocument && this.parent.GraphicObj === this)
    {
        return this.parent.Is_UseInDocument();
    }
    return false;
};
CShape.prototype.IsHdrFtr = function(bool)
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
CShape.prototype.IsFootnote = function(bReturnFootnote)
{
	if(!this.group)
	{
		if(isRealObject(this.parent) && isRealObject(this.parent.DocumentContent))
			return this.parent.DocumentContent.IsFootnote(bReturnFootnote);
	}
	else
	{
		var cur_group = this.group;
		while(cur_group.group)
			cur_group = cur_group.group;
		if(isRealObject(cur_group.parent) && isRealObject(cur_group.parent.DocumentContent))
			return cur_group.parent.DocumentContent.IsFootnote(bReturnFootnote);
	}
	return bReturnFootnote ? null : false;
};
CShape.prototype.OnContentReDraw = function()
{
    if(!isRealObject(this.group))
    {
        if(isRealObject(this.parent) && this.parent.OnContentReDraw)
        {
            this.parent.OnContentReDraw();
        }
    }
    else
    {
        var cur_group = this.group;
        while(isRealObject(cur_group.group))
            cur_group = cur_group.group;

        if(isRealObject(cur_group) && isRealObject(cur_group.parent))
            cur_group.parent.OnContentReDraw();
    }

};


CShape.prototype.Get_TextBackGroundColor = function()
{
    return undefined;
};
CShape.prototype.documentStatistics = function(stats)
{
    var content = this.getDocContent();
    return content && content.CollectDocumentStatistics(stats);
};

CShape.prototype.checkPosTransformText = function()
{
    if(AscFormat.isRealNumber(this.posX) && AscFormat.isRealNumber(this.posY))
    {
        this.transformText = this.localTransformText.CreateDublicate();
        global_MatrixTransformer.TranslateAppend(this.transformText, this.posX, this.posY);
        this.invertTransformText = global_MatrixTransformer.Invert(this.transformText);

        if(this.localTransformTextWordArt)
        {
            this.transformTextWordArt = this.localTransformTextWordArt.CreateDublicate();
            global_MatrixTransformer.TranslateAppend(this.transformTextWordArt, this.posX, this.posY);
            this.invertTransformTextWordArt = global_MatrixTransformer.Invert(this.transformTextWordArt);
        }
    }
};
CShape.prototype.getNearestPos = function(x, y, pageIndex)
{
    if(isRealObject(this.textBoxContent) && this.invertTransformText)
    {
        var t_x = this.invertTransformText.TransformPointX(x, y);
        var t_y = this.invertTransformText.TransformPointY(x, y);
        var nearest_pos = this.textBoxContent.Get_NearestPos(0, t_x, t_y, false);
        return nearest_pos;
    }
    return null;
};


CShape.prototype.cursorGetPos = function()
{
    var content = this.getDocContent();
    if(isRealObject(content))
    {
        var pos = content.GetCursorPosXY();
        var transform = this.transformText;
        var x = transform.TransformPointX(pos.X, pos.Y);
        var y = transform.TransformPointY(pos.X, pos.Y);
        return {X: x, Y: y};
    }
    return {X: 0, Y: 0};
};


CShape.prototype.cursorMoveAt = function( X, Y, AddToSelect )
{
    var content = this.getDocContent();
    if(isRealObject(content) && this.invertTransformText)
    {
        var t_x = this.invertTransformText.TransformPointX(X, Y);
        var t_y = this.invertTransformText.TransformPointY(X, Y);
        content.MoveCursorToXY(t_x, t_y, AddToSelect, undefined, AscFormat.isRealNumber(this.selectStartPage) ? this.selectStartPage : 0);
    }
};


CShape.prototype.Get_Styles = function()
{
    var oLogicDoc = this.getLogicDocument();
    if(oLogicDoc)
    {
        return oLogicDoc.Styles;
    }
    return new CStyles(true);
};
CShape.prototype.Is_InTable = function(bReturnTopTable)
{
    if ( true === bReturnTopTable )
        return null;

    return false;
};

CShape.prototype.Get_TableStyleForPara = function()
{
    var oLogicDoc = this.getLogicDocument();
    if(oLogicDoc)
    {
        return oLogicDoc.Get_TableStyleForPara();
    }
    return null;
};

CShape.prototype.Is_DrawingShape = function(bRetShape)
{
    if(bRetShape === true)
    {
        return this;
    }
    return true;
};

CShape.prototype.Is_InTable = function(bReturnTopTable)
{
    if ( true === bReturnTopTable )
        return null;

    return false;
};

CShape.prototype.canChangeWrapPolygon = function(bReturnTopTable)
{
    return true;
};

CShape.prototype.Get_ColorMap = function()
{
    var oLogicDoc = this.getLogicDocument();
    if(oLogicDoc)
    {
        return oLogicDoc.Get_ColorMap();
    }
    return AscFormat.DEFAULT_COLOR_MAP;
};

CShape.prototype.Is_TopDocument = function(bReturn)
{
    if(!bReturn)
    {
        return false;
    }
    else
    {
        var para_drawing;
        if (this.group)
        {
            var main_group = this.group.getMainGroup();
            para_drawing   = main_group.parent;
        }
        else
        {
            para_drawing = this.parent;
        }

        if (para_drawing && para_drawing.DocumentContent)
        {
            return para_drawing.DocumentContent.Is_TopDocument(bReturn);
        }
        return null;
    }
};

CShape.prototype.recalcText = function(bResetRecalcCache)
{
    if(this.recalculateText && this.recalcTxBoxContent && this.recalculateText)
    {
        this.recalcTxBoxContent();
        this.recalcTransformText();
        if(bResetRecalcCache){
            var oContent = this.getDocContent();
            if(oContent){
                oContent.Reset_RecalculateCache();
            }
        }
        if(this.checkAutofit && this.checkAutofit())
        {
            this.recalcGeometry();
            this.recalcWrapPolygon();
            this.recalcBounds();

            this.recalcTransform();

            if(!this.group){
                if(this.parent && this.parent.Parent){
                    var Run = this.parent.Parent.Get_DrawingObjectRun( this.parent.Id );
                    if(Run){
                        Run.RecalcInfo.Measure = true;
                    }
                }
            }
        }
    }
};

CShape.prototype.getRecalcObject = function()
{
    var content = this.getDocContent && this.getDocContent();
    if(content)
    {
        return content.SaveRecalculateObject();
    }
    if(this.spTree)
    {
        var ret = [];
        for(var i = 0; i < this.spTree.length; ++i)
        {
            ret.push(this.spTree[i].getRecalcObject())
        }
        return ret;
    }
    return null;
};

CShape.prototype.setRecalcObject =  function(object)
{
    if(!object)
        return;
    var content = this.getDocContent && this.getDocContent();
    if(content)
    {
        content.LoadRecalculateObject(object);
    }
    if(Array.isArray(object) && this.spTree && this.spTree.length === object.length)
    {
        for(var i = 0;  i < this.spTree.length; ++i)
        {
            this.spTree[i].setRecalcObject(object[i]);
        }
    }
};


CShape.prototype.setStartPage = function(pageIndex, bNoResetSelectPage, bCheckContent)
{
    if(!(bNoResetSelectPage === true))
        this.selectStartPage = pageIndex;
    var content = this.getDocContent && this.getDocContent();
    if(content)
    {
        content.Set_StartPage(pageIndex);
        if(true === bCheckContent)
        {
            if(this.bWordShape && content.CheckRunContent(function(oRun)
				{
				    if(oRun instanceof AscCommon.ParaComment)
                    {
                        return true;
                    }
					for (var i = 0; i < oRun.Content.length; ++i)
					{
						var oItem = oRun.Content[i];
						if (para_PageNum === oItem.Type || para_PageCount === oItem.Type)
						{
							return true;
						}
						else if (para_FieldChar === oItem.Type && oItem.IsSeparate())
						{
							var oComplexField = oItem.GetComplexField();
							if (oComplexField)
							{
								var oInstruction = oComplexField.GetInstruction();
								if (oInstruction && (fieldtype_NUMPAGES === oInstruction.GetType() || fieldtype_PAGE === oInstruction.GetType()))
								{
									return true;
								}
							}
						}
					}

					return false;
				}
            ))
            {
                this.recalcInfo.recalculateTxBoxContent = true;
                this.recalcInfo.recalculateTransformText = true;
                this.recalculateText();
            }
        }
    }
    if(Array.isArray(this.spTree))
    {
        for(var i = 0; i < this.spTree.length; ++i)
        {
            this.spTree[i].setStartPage && this.spTree[i].setStartPage(pageIndex, undefined, bCheckContent);
        }
    }
};
CShape.prototype.getStyles = function()
{
    var oLogicDoc = this.getLogicDocument();
    var oStyles;
    if(oLogicDoc)
    {
        oStyles = oLogicDoc.Styles;
    }
    else
    {
        oStyles = new CStyles(true);
    }
    return {styles: oStyles, styleId: null};
};


CShape.prototype.getDrawingObjectsController = function()
{
    var oLogicDoc = this.getLogicDocument();
    if(oLogicDoc)
    {
        return oLogicDoc.DrawingObjects;
    }
    return null;
};
