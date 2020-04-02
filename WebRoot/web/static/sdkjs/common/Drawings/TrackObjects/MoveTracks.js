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
    var CMatrix = AscCommon.CMatrix;
    var global_MatrixTransformer = AscCommon.global_MatrixTransformer;

function MoveShapeImageTrack(originalObject)
{
    this.bIsTracked = false;
    this.originalObject = originalObject;
    this.transform = new CMatrix();
    this.x = null;
    this.y = null;
    this.pageIndex = null;
    this.originalShape = originalObject;
    this.lastDx = 0;
    this.lastDy = 0;

    if(!originalObject.isChart())
    {
        if(originalObject.blipFill)
        {
            this.brush = new AscFormat.CUniFill();
            this.brush.fill = originalObject.blipFill;
        }
        else
        {
            this.brush = originalObject.brush;
        }
        this.pen = originalObject.pen;
    }
    else
    {
        var pen_brush = AscFormat.CreatePenBrushForChartTrack();
        this.brush = pen_brush.brush;
        this.pen = pen_brush.pen;
    }
    if(this.originalObject.cropObject && this.brush)
    {
        this.brush = this.brush.createDuplicate();
    }
    if(this.originalObject.cropObject)
    {
        this.cropObject = this.originalObject.cropObject;
    }
    this.overlayObject = new AscFormat.OverlayObject(originalObject.getGeom(), this.originalObject.extX, this.originalObject.extY, this.brush, this.pen, this.transform);

    this.groupInvertMatrix = null;
    if(this.originalObject.group)
    {
        this.groupInvertMatrix = this.originalObject.group.invertTransform.CreateDublicate();
        this.groupInvertMatrix.tx = 0;
        this.groupInvertMatrix.ty = 0;
    }

    this.track = function(dx, dy, pageIndex)
    {
        this.bIsTracked = true;
        this.lastDx = dx;
        this.lastDy = dy;
        var original = this.originalObject;
        var dx2, dy2;
        if(this.groupInvertMatrix)
        {
            dx2 = this.groupInvertMatrix.TransformPointX(dx, dy);
            dy2 = this.groupInvertMatrix.TransformPointY(dx, dy);
        }
        else
        {
            dx2 = dx;
            dy2 = dy;
        }

        this.x = original.x + dx2;
        this.y = original.y + dy2;
        this.transform.Reset();
        var hc = original.extX*0.5;
        var vc = original.extY*0.5;

        global_MatrixTransformer.TranslateAppend(this.transform, -hc, -vc);
        if(original.flipH)
            global_MatrixTransformer.ScaleAppend(this.transform, -1, 1);
        if(original.flipV)
            global_MatrixTransformer.ScaleAppend(this.transform, 1, -1);
        global_MatrixTransformer.RotateRadAppend(this.transform, -original.rot);
        global_MatrixTransformer.TranslateAppend(this.transform, this.x + hc, this.y + vc);
        if(this.originalObject.group)
        {
            global_MatrixTransformer.MultiplyAppend(this.transform, this.originalObject.group.transform);
        }
        if(AscFormat.isRealNumber(pageIndex))
            this.pageIndex = pageIndex;



        if(this.originalObject.cropObject)
        {

            var oShapeDrawer = new AscCommon.CShapeDrawer();
            oShapeDrawer.bIsCheckBounds = true;
            oShapeDrawer.Graphics = new AscFormat.CSlideBoundsChecker();
            this.originalObject.check_bounds(oShapeDrawer);
            this.brush.fill.srcRect = AscFormat.CalculateSrcRect(this.transform, oShapeDrawer, global_MatrixTransformer.Invert(this.originalObject.cropObject.transform), this.originalObject.cropObject.extX, this.originalObject.cropObject.extY);
        }
    };

    this.draw = function(overlay)
    {
        if(AscFormat.isRealNumber(this.pageIndex) && overlay.SetCurrentPage)
        {
            overlay.SetCurrentPage(this.pageIndex);
        }
        if(this.originalObject.isCrop)
        {
            var dOldAlpha = null;
            var oGraphics = overlay.Graphics ? overlay.Graphics : overlay;
            if(AscFormat.isRealNumber(oGraphics.globalAlpha) && oGraphics.put_GlobalAlpha)
            {
                dOldAlpha = oGraphics.globalAlpha;
                oGraphics.put_GlobalAlpha(false, 1);
            }
            this.overlayObject.draw(overlay);
            var oldFill = this.brush.fill;
            this.brush.fill = this.originalObject.cropBrush.fill;
            this.overlayObject.shapeDrawer.Clear();
            this.overlayObject.draw(overlay);
            this.brush.fill = oldFill;
            var oldSrcRect, oldPen;
            var parentCrop = this.originalObject.parentCrop;


            var oShapeDrawer = new AscCommon.CShapeDrawer();
            oShapeDrawer.bIsCheckBounds = true;
            oShapeDrawer.Graphics = new AscFormat.CSlideBoundsChecker();
            parentCrop.check_bounds(oShapeDrawer);
            var srcRect = AscFormat.CalculateSrcRect(parentCrop.transform, oShapeDrawer, global_MatrixTransformer.Invert(this.transform), this.originalObject.extX, this.originalObject.extY);
            oldPen = this.originalObject.parentCrop.pen;
            this.originalObject.parentCrop.pen = AscFormat.CreatePenBrushForChartTrack().pen;
            if(this.originalObject.parentCrop.blipFill)
            {
                oldSrcRect = this.originalObject.parentCrop.blipFill.srcRect;
                this.originalObject.parentCrop.blipFill.srcRect = srcRect;
                this.originalObject.parentCrop.draw(overlay);
                this.originalObject.parentCrop.blipFill.srcRect = oldSrcRect;
            }
            else
            {
                oldSrcRect = this.originalObject.parentCrop.brush.fill.srcRect;
                this.originalObject.parentCrop.brush.fill.srcRect = srcRect;
                this.originalObject.parentCrop.draw(overlay);
                this.originalObject.parentCrop.brush.fill.srcRect = oldSrcRect;
            }
            this.originalObject.parentCrop.pen = oldPen;
            if(AscFormat.isRealNumber(dOldAlpha) && oGraphics.put_GlobalAlpha)
            {
                oGraphics.put_GlobalAlpha(true, dOldAlpha);
            }
            return;
        }
        if(this.originalObject.cropObject)
        {
            var dOldAlpha = null;
            var oGraphics = overlay.Graphics ? overlay.Graphics : overlay;
            if(AscFormat.isRealNumber(oGraphics.globalAlpha) && oGraphics.put_GlobalAlpha)
            {
                dOldAlpha = oGraphics.globalAlpha;
                oGraphics.put_GlobalAlpha(false, 1);
            }
            this.originalObject.cropObject.draw(overlay);
            var oldCropObj = this.originalObject.cropObject;
            var oldSrcRect, oldTransform, oldPen;
            var parentCrop = this.originalObject;
            oldTransform = parentCrop.transform;
            parentCrop.transform = this.transform;
            var oShapeDrawer = new AscCommon.CShapeDrawer();
            oShapeDrawer.bIsCheckBounds = true;
            oShapeDrawer.Graphics = new AscFormat.CSlideBoundsChecker();
            parentCrop.check_bounds(oShapeDrawer);
            var srcRect = AscFormat.CalculateSrcRect(this.transform, oShapeDrawer, global_MatrixTransformer.Invert(oldCropObj.transform), oldCropObj.extX, oldCropObj.extY);

            oldPen = this.originalObject.pen;
            this.originalObject.pen = AscFormat.CreatePenBrushForChartTrack().pen;
            if(this.originalObject.blipFill)
            {
                oldSrcRect = this.originalObject.blipFill.srcRect;
                this.originalObject.blipFill.srcRect = srcRect;
                this.originalObject.draw(overlay);
                this.originalObject.blipFill.srcRect = oldSrcRect;
            }
            else
            {
                oldSrcRect = this.originalObject.brush.fill.srcRect;
                this.originalObject.brush.fill.srcRect = srcRect;
                this.originalObject.draw(overlay);
                this.originalObject.brush.fill.srcRect = oldSrcRect;
            }
            this.originalObject.pen = oldPen;
            parentCrop.transform = oldTransform;
            if(AscFormat.isRealNumber(dOldAlpha) && oGraphics.put_GlobalAlpha)
            {
                oGraphics.put_GlobalAlpha(true, dOldAlpha);
            }
            return;
        }
        this.overlayObject.draw(overlay);
    };

    this.trackEnd = function(bWord, bNoResetCnx)
    {
        if(!this.bIsTracked)
        {
            return;
        }
        if(bWord)
        {
            if(this.originalObject.selectStartPage !== this.pageIndex)
                this.originalObject.selectStartPage = this.pageIndex;
        }
        var scale_coefficients, ch_off_x, ch_off_y;
        if(this.originalObject.isCrop)
        {
            AscFormat.ExecuteNoHistory(
                function () {
                    AscFormat.CheckSpPrXfrm(this.originalObject);
                },
                this, []
            );
        }
        else
        {
            if(!this.originalObject.group)
            {
                AscFormat.CheckSpPrXfrm3(this.originalObject, true);
            }
            else
            {
                AscFormat.CheckSpPrXfrm(this.originalObject, true);
            }
        }
        if(this.originalObject.group)
        {
            scale_coefficients = this.originalObject.group.getResultScaleCoefficients();
            ch_off_x = this.originalObject.group.spPr.xfrm.chOffX;
            ch_off_y = this.originalObject.group.spPr.xfrm.chOffY;
        }
        else
        {
            if(bWord && !this.originalObject.isCrop)
            {
                if(this.originalObject.spPr.xfrm.offX === 0 && this.originalObject.spPr.xfrm.offY === 0)
                {
                    if(this.originalObject.cropObject)
                    {
                        this.originalObject.transform = this.transform;
                        this.originalObject.invertTransform = AscCommon.global_MatrixTransformer.Invert(this.transform);
                        this.originalObject.calculateSrcRect();
                    }
                    return;
                }
            }
            scale_coefficients = {cx: 1, cy: 1};
            ch_off_x = 0;
            ch_off_y = 0;
            if(bWord && !this.originalObject.isCrop)
            {
                this.x = 0;
                this.y = 0;
            }
        }
        var _xfrm = this.originalObject.spPr.xfrm;
        var _x = _xfrm.offX;
        var _y = _xfrm.offY;
        if(this.originalObject.isCrop)
        {
            AscFormat.ExecuteNoHistory(
                function () {
                    this.originalObject.spPr.xfrm.setOffX(this.x/scale_coefficients.cx + ch_off_x);
                    this.originalObject.spPr.xfrm.setOffY(this.y/scale_coefficients.cy + ch_off_y);
                },
                this, []
            );
        }
        else
        {
            this.originalObject.spPr.xfrm.setOffX(this.x/scale_coefficients.cx + ch_off_x);
            this.originalObject.spPr.xfrm.setOffY(this.y/scale_coefficients.cy + ch_off_y);
        }

        if(this.originalObject.getObjectType() === AscDFH.historyitem_type_Cnx){
            if(!AscFormat.fApproxEqual(_x, _xfrm.offX) || !AscFormat.fApproxEqual(_y, _xfrm.offY)){
                var nvUniSpPr = this.originalObject.nvSpPr.nvUniSpPr;

                var bResetBegin = false, bResetEnd = false;
                var oBeginShape = AscCommon.g_oTableId.Get_ById(nvUniSpPr.stCnxId);
                var oEndShape = AscCommon.g_oTableId.Get_ById(nvUniSpPr.endCnxId);
                if(oBeginShape){
                    if(oBeginShape.bDeleted){
                        bResetBegin = true;
                    }
                    else{
                        if(!oBeginShape.selected){
                            bResetBegin = true;
                        }
                    }
                }
                if(oEndShape){
                    if(oEndShape.bDeleted){
                        bResetEnd = true;
                    }
                    else{
                        if(!oEndShape.selected){
                            bResetEnd = true;
                        }
                    }
                }

                if((bResetEnd || bResetBegin) && (bNoResetCnx !== false)){
                    var _copy_nv_sp_pr = nvUniSpPr.copy();
                    if(bResetBegin){
                        _copy_nv_sp_pr.stCnxId = null;
                        _copy_nv_sp_pr.stCnxIdx = null;
                    }
                    if(bResetEnd){
                        _copy_nv_sp_pr.endCnxId = null;
                        _copy_nv_sp_pr.endCnxIdx = null;
                    }
                    this.originalObject.nvSpPr.setUniSpPr(_copy_nv_sp_pr);
                }
            }
        }

        if(this.originalObject.isCrop)
        {
            AscFormat.ExecuteNoHistory(
                function () {
                    this.originalObject.checkDrawingBaseCoords();
                },
                this, []
            );
            this.originalObject.transform = this.transform;
            this.originalObject.invertTransform = AscCommon.global_MatrixTransformer.Invert(this.transform);
        }
        else
        {
            this.originalObject.checkDrawingBaseCoords();
        }
        if(this.originalObject.isCrop)
        {
            if(!this.originalObject.parentCrop.cropObject)
            {
                this.originalObject.parentCrop.cropObject = this.originalObject;
            }
            this.originalObject.parentCrop.calculateSrcRect();
        }
        if(this.cropObject && !this.originalObject.cropObject)
        {
            this.originalObject.cropObject = this.cropObject;
        }
        if(this.originalObject.cropObject)
        {
            this.originalObject.transform = this.transform;
            this.originalObject.invertTransform = AscCommon.global_MatrixTransformer.Invert(this.transform);
            this.originalObject.calculateSrcRect();
        }
    };
}

MoveShapeImageTrack.prototype.getBounds = function()
{
    var boundsChecker = new  AscFormat.CSlideBoundsChecker();
    this.draw(boundsChecker);
    var tr = this.transform;
    var arr_p_x = [];
    var arr_p_y = [];
    arr_p_x.push(tr.TransformPointX(0,0));
    arr_p_y.push(tr.TransformPointY(0,0));
    arr_p_x.push(tr.TransformPointX(this.originalObject.extX,0));
    arr_p_y.push(tr.TransformPointY(this.originalObject.extX,0));
    arr_p_x.push(tr.TransformPointX(this.originalObject.extX,this.originalObject.extY));
    arr_p_y.push(tr.TransformPointY(this.originalObject.extX,this.originalObject.extY));
    arr_p_x.push(tr.TransformPointX(0,this.originalObject.extY));
    arr_p_y.push(tr.TransformPointY(0,this.originalObject.extY));

    arr_p_x.push(boundsChecker.Bounds.min_x);
    arr_p_x.push(boundsChecker.Bounds.max_x);
    arr_p_y.push(boundsChecker.Bounds.min_y);
    arr_p_y.push(boundsChecker.Bounds.max_y);

    boundsChecker.Bounds.min_x = Math.min.apply(Math, arr_p_x);
    boundsChecker.Bounds.max_x = Math.max.apply(Math, arr_p_x);
    boundsChecker.Bounds.min_y = Math.min.apply(Math, arr_p_y);
    boundsChecker.Bounds.max_y = Math.max.apply(Math, arr_p_y);
    boundsChecker.Bounds.posX = this.x;
    boundsChecker.Bounds.posY = this.y;
    boundsChecker.Bounds.extX =  this.originalObject.extX;
    boundsChecker.Bounds.extY =  this.originalObject.extY;
    return boundsChecker.Bounds;
};

function MoveGroupTrack(originalObject)
{
    this.bIsTracked = false;
    this.x = null;
    this.y = null;
    this.originalObject = originalObject;
    this.transform = new CMatrix();

    this.pageIndex = null;
    this.overlayObjects = [];

    this.arrTransforms2 = [];
    var arr_graphic_objects = originalObject.getArrGraphicObjects();
    var group_invert_transform = originalObject.invertTransform;
    for(var i = 0; i < arr_graphic_objects.length; ++i)
    {
        var gr_obj_transform_copy = arr_graphic_objects[i].transform.CreateDublicate();
        global_MatrixTransformer.MultiplyAppend(gr_obj_transform_copy, group_invert_transform);
        this.arrTransforms2[i] = gr_obj_transform_copy;
        this.overlayObjects[i] = new AscFormat.OverlayObject(arr_graphic_objects[i].getGeom(), arr_graphic_objects[i].extX, arr_graphic_objects[i].extY,
            arr_graphic_objects[i].brush,  arr_graphic_objects[i].pen, new CMatrix());
    }



    this.track = function(dx, dy, pageIndex)
    {
        this.bIsTracked = true;
        this.pageIndex = pageIndex;
        var original = this.originalObject;
        this.x = original.x + dx;
        this.y = original.y + dy;
        this.transform.Reset();
        var hc = original.extX*0.5;
        var vc = original.extY*0.5;

        global_MatrixTransformer.TranslateAppend(this.transform, -hc, -vc);
        if(original.flipH)
            global_MatrixTransformer.ScaleAppend(this.transform, -1, 1);
        if(original.flipV)
            global_MatrixTransformer.ScaleAppend(this.transform, 1, -1);
        global_MatrixTransformer.RotateRadAppend(this.transform, -original.rot);
        global_MatrixTransformer.TranslateAppend(this.transform, this.x + hc, this.y + vc);

        for(var i = 0; i < this.overlayObjects.length; ++i)
        {
            var new_transform = this.arrTransforms2[i].CreateDublicate();
            global_MatrixTransformer.MultiplyAppend(new_transform, this.transform);
            this.overlayObjects[i].updateTransformMatrix(new_transform);
        }
    };

    this.draw = function(overlay)
    {
        if(AscFormat.isRealNumber(this.pageIndex) && overlay.SetCurrentPage)
        {
            overlay.SetCurrentPage(this.pageIndex);
        }
        for(var i = 0; i < this.overlayObjects.length; ++i)
        {
            this.overlayObjects[i].draw(overlay);
        }
    };

    this.getBounds = function()
    {
        var bounds_checker = new AscFormat.CSlideBoundsChecker();
        for(var i = 0; i < this.overlayObjects.length; ++i)
        {
            this.overlayObjects[i].draw(bounds_checker);
        }
        bounds_checker.Bounds.posX = this.x;
        bounds_checker.Bounds.posY = this.y;
        bounds_checker.Bounds.extX = this.originalObject.extX;
        bounds_checker.Bounds.extY = this.originalObject.extY;
        return bounds_checker.Bounds;
    };

    this.trackEnd = function(bWord)
    {
        if(!this.bIsTracked){
            return;
        }
        if(bWord)
        {
            this.x = 0;
            this.y = 0;
        }
        AscFormat.CheckSpPrXfrm3(this.originalObject);
        var xfrm = this.originalObject.spPr.xfrm;


        xfrm.setOffX(this.x);
        xfrm.setOffY(this.y);

        if(bWord)
        {
            if(this.originalObject.selectStartPage !== this.pageIndex)
                this.originalObject.selectStartPage = this.pageIndex;
        }
        this.originalObject.checkDrawingBaseCoords();
    };
}

function MoveComment(comment)
{
    this.bIsTracked = false;
    this.comment = comment;
    this.x = comment.x;
    this.y = comment.y;

    this.track = function(dx, dy)
    {
        this.bIsTracked = true;
        var original = this.comment;
        this.x = original.x + dx;
        this.y = original.y + dy;
    };

    this.draw = function(overlay)
    {

        var Flags = 0;
        Flags |= 1;
        if(this.comment.Data.m_aReplies.length > 0)
        {
            Flags |= 2;
        }
        var dd = editor.WordControl.m_oDrawingDocument;
        overlay.DrawPresentationComment(Flags, this.x, this.y, dd.GetCommentWidth(Flags), dd.GetCommentHeight(Flags))
    };

    this.trackEnd = function()
    {
        if(!this.bIsTracked){
            return;
        }
        this.comment.setPosition(this.x, this.y);
    };
}

    //--------------------------------------------------------export----------------------------------------------------
    window['AscFormat'] = window['AscFormat'] || {};
    window['AscFormat'].MoveShapeImageTrack = MoveShapeImageTrack;
    window['AscFormat'].MoveGroupTrack = MoveGroupTrack;
    window['AscFormat'].MoveComment = MoveComment;
})(window);
