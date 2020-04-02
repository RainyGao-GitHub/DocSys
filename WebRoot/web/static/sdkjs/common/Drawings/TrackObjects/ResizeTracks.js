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
    var global_MatrixTransformer = AscCommon.global_MatrixTransformer;

var TRANSLATE_HANDLE_NO_FLIP = [];
TRANSLATE_HANDLE_NO_FLIP[0] = 0;
TRANSLATE_HANDLE_NO_FLIP[1] = 1;
TRANSLATE_HANDLE_NO_FLIP[2] = 2;
TRANSLATE_HANDLE_NO_FLIP[3] = 3;
TRANSLATE_HANDLE_NO_FLIP[4] = 4;
TRANSLATE_HANDLE_NO_FLIP[5] = 5;
TRANSLATE_HANDLE_NO_FLIP[6] = 6;
TRANSLATE_HANDLE_NO_FLIP[7] = 7;

var TRANSLATE_HANDLE_FLIP_H = [];
TRANSLATE_HANDLE_FLIP_H[0] = 2;
TRANSLATE_HANDLE_FLIP_H[1] = 1;
TRANSLATE_HANDLE_FLIP_H[2] = 0;
TRANSLATE_HANDLE_FLIP_H[3] = 7;
TRANSLATE_HANDLE_FLIP_H[4] = 6;
TRANSLATE_HANDLE_FLIP_H[5] = 5;
TRANSLATE_HANDLE_FLIP_H[6] = 4;
TRANSLATE_HANDLE_FLIP_H[7] = 3;

var TRANSLATE_HANDLE_FLIP_V = [];
TRANSLATE_HANDLE_FLIP_V[0] = 6;
TRANSLATE_HANDLE_FLIP_V[1] = 5;
TRANSLATE_HANDLE_FLIP_V[2] = 4;
TRANSLATE_HANDLE_FLIP_V[3] = 3;
TRANSLATE_HANDLE_FLIP_V[4] = 2;
TRANSLATE_HANDLE_FLIP_V[5] = 1;
TRANSLATE_HANDLE_FLIP_V[6] = 0;
TRANSLATE_HANDLE_FLIP_V[7] = 7;

var TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V = [];
TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[0] = 4;
TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[1] = 5;
TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[2] = 6;
TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[3] = 7;
TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[4] = 0;
TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[5] = 1;
TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[6] = 2;
TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[7] = 3;

var SHAPE_EXT = {};
SHAPE_EXT["can"] = 3616635/36000;
SHAPE_EXT["moon"] = 457200/36000;
SHAPE_EXT["leftBracket"] = 73152/36000;
SHAPE_EXT["rightBracket"] = 73152/36000;
SHAPE_EXT["leftBrace"] = 155448/36000;
SHAPE_EXT["rightBrace"] = 155448/36000;
SHAPE_EXT["triangle"] = 1060704/36000;
SHAPE_EXT["parallelogram"] = 1216152/36000;
SHAPE_EXT["trapezoid"] = 914400/36000;
SHAPE_EXT["pentagon"] = 960120/36000;
SHAPE_EXT["hexagon"] = 1060704/36000;
SHAPE_EXT["bracePair"] = 1069848/36000;
SHAPE_EXT["rightArrow"] = 978408/36000;
SHAPE_EXT["leftArrow"] = 978408/36000;
SHAPE_EXT["upArrow"] = 484632/36000;
SHAPE_EXT["downArrow"] = 484632/36000;
SHAPE_EXT["leftRightArrow"] = 1216152/36000;
SHAPE_EXT["upDownArrow"] = 484632/36000;
SHAPE_EXT["bentArrow"] = 813816/36000;
SHAPE_EXT["uturnArrow"] = 886968/36000;
SHAPE_EXT["bentUpArrow"] = 850392/36000;
SHAPE_EXT["curvedRightArrow"] = 731520/36000;
SHAPE_EXT["curvedLeftArrow"] = 731520/36000;
SHAPE_EXT["curvedUpArrow"] = 1216152/36000;
SHAPE_EXT["curvedDownArrow"] = 1216152/36000;
SHAPE_EXT["stripedRightArrow"] = 978408/36000;
SHAPE_EXT["notchedRightArrow"] = 978408/36000;
SHAPE_EXT["homePlate"] = 978408/36000;
SHAPE_EXT["leftRightArrowCallout"] = 1216152/36000;
SHAPE_EXT["flowChartProcess"] = 914400/36000;
SHAPE_EXT["flowChartAlternateProcess"] = 914400/36000;
SHAPE_EXT["flowChartDecision"] = 914400/36000;
SHAPE_EXT["flowChartInputOutput"] = 914400/36000;
SHAPE_EXT["flowChartPredefinedProcess"] = 914400/36000;
SHAPE_EXT["flowChartDocument"] = 914400/36000;
SHAPE_EXT["flowChartMultidocument"] = 1060704/36000;
SHAPE_EXT["flowChartTerminator"] = 914400/36000;
SHAPE_EXT["flowChartPreparation"] = 1060704/36000;
SHAPE_EXT["flowChartManualInput"] = 914400/36000;
SHAPE_EXT["flowChartManualOperation"] = 914400/36000;
SHAPE_EXT["flowChartPunchedCard"] = 914400/36000;
SHAPE_EXT["flowChartPunchedTape"] = 914400/36000;
SHAPE_EXT["flowChartPunchedTape"] = 457200/36000;
SHAPE_EXT["flowChartSort"] = 457200/36000;
SHAPE_EXT["flowChartOnlineStorage"] = 914400/36000;
SHAPE_EXT["flowChartMagneticDisk"] = 914400/36000;
SHAPE_EXT["flowChartMagneticDrum"] = 914400/36000;
SHAPE_EXT["flowChartDisplay"] = 914400/36000;
SHAPE_EXT["ribbon2"] = 1216152/36000;
SHAPE_EXT["ribbon"] = 1216152/36000;
SHAPE_EXT["ellipseRibbon2"] = 1216152/36000;
SHAPE_EXT["ellipseRibbon"] = 1216152/36000;
SHAPE_EXT["verticalScroll"] = 1033272/36000;
SHAPE_EXT["horizontalScroll"] = 1143000/36000;
SHAPE_EXT["wedgeRectCallout"] = 914400/36000;
SHAPE_EXT["wedgeRoundRectCallout"] = 914400/36000;
SHAPE_EXT["wedgeEllipseCallout"] = 914400/36000;
SHAPE_EXT["cloudCallout"] = 914400/36000;
SHAPE_EXT["borderCallout1"] = 914400/36000;
SHAPE_EXT["borderCallout2"] = 914400/36000;
SHAPE_EXT["borderCallout3"] = 914400/36000;
SHAPE_EXT["accentCallout1"] = 914400/36000;
SHAPE_EXT["accentCallout2"] = 914400/36000;
SHAPE_EXT["accentCallout3"] = 914400/36000;
SHAPE_EXT["callout1"] = 914400/36000;
SHAPE_EXT["callout2"] = 914400/36000;
SHAPE_EXT["callout3"] = 914400/36000;
SHAPE_EXT["accentBorderCallout1"] = 914400/36000;
SHAPE_EXT["accentBorderCallout2"] = 914400/36000;
SHAPE_EXT["accentBorderCallout3"] = 914400/36000;
SHAPE_EXT["cube"] = 1216152/36000;
SHAPE_EXT["bevel"] = 1042416/36000;
SHAPE_EXT["quadArrow"] = 1216152/36000;
SHAPE_EXT["leftUpArrow"] = 850392/36000;
SHAPE_EXT["chevron"] = 484632/36000;
SHAPE_EXT["quadArrowCallout"] = 1216152/36000;
SHAPE_EXT["circularArrow"] = 978408/36000;
SHAPE_EXT["flowChartInternalStorage"] = 612648/36000;
SHAPE_EXT["flowChartConnector"] = 457200/36000;
SHAPE_EXT["flowChartOffpageConnector"] = 612648/36000;
SHAPE_EXT["flowChartSummingJunction"] = 612648/36000;
SHAPE_EXT["flowChartOr"] = 612648/36000;
SHAPE_EXT["flowChartExtract"] = 685800/36000;
SHAPE_EXT["flowChartMerge"] = 685800/36000;
SHAPE_EXT["flowChartDelay"] = 612648/36000;
SHAPE_EXT["flowChartMagneticTape"] = 612648/36000;
SHAPE_EXT["actionButtonHome"] = 1042416/36000;

var MIN_SHAPE_SIZE = 1.27;//размер меньше которого нельзя уменшить автофигуру или картинку по горизонтали или вертикали

function CreatePenBrushForChartTrack()
{
    return AscFormat.ExecuteNoHistory(function()
        {
            var brush = new AscFormat.CUniFill();
            brush.setFill(new AscFormat.CSolidFill());
            brush.fill.setColor(new AscFormat.CUniColor());
            brush.fill.color.RGBA = {R:255, G:255, B:255, A:255};
            brush.fill.color.setColor(new AscFormat.CRGBColor());
            brush.fill.color.color.RGBA = {R:255, G:255, B:255, A:255};
            var pen = new AscFormat.CLn();
            pen.setFill(new AscFormat.CUniFill());
            pen.Fill.setFill(new AscFormat.CSolidFill());
            pen.Fill.fill.setColor(new AscFormat.CUniColor());
            pen.Fill.fill.color.setColor(new AscFormat.CRGBColor());
            return {brush: brush, pen: pen};
        },
        this, []);
}

function ResizeTrackShapeImage(originalObject, cardDirection, drawingsController)
{
    AscFormat.ExecuteNoHistory(function()
    {
        this.bLastCenter = false;
        this.bIsTracked = false;
        this.originalObject = originalObject;
        this.numberHandle = originalObject.getNumByCardDirection(cardDirection);
        this.lastSpPr = null;
        this.startShape = null;
        this.endShape = null;

        this.beginShapeId = null;
        this.beginShapeIdx = null;

        this.endShapeId = null;
        this.endShapeIdx = null;
        if(drawingsController && drawingsController.selectedObjects.length === 1){
            if(originalObject.getObjectType() === AscDFH.historyitem_type_Cnx){
                this.drawingsController = drawingsController;
                var stId = originalObject.nvSpPr.nvUniSpPr.stCnxId;
                var endId = originalObject.nvSpPr.nvUniSpPr.endCnxId;
                this.startShape  = AscCommon.g_oTableId.Get_ById(stId);
                this.endShape = AscCommon.g_oTableId.Get_ById(endId);
                this.bConnector = true;
               // if(this.startShape || this.endShape){
               //     this.bConnector = true;
               // }
            }
        }

        this.pageIndex = null;
        var numberHandle = this.numberHandle;
        this.flipH = originalObject.flipH;
        this.flipV = originalObject.flipV;
        var _flip_h = originalObject.flipH;
        var _flip_v = originalObject.flipV;
        var _half_height = originalObject.extY*0.5;
        var _half_width = originalObject.extX*0.5;

        var _sin = Math.sin(originalObject.rot);
        var _cos = Math.cos(originalObject.rot);

        var _translated_num_handle;

        if(!_flip_h && !_flip_v)
        {
            _translated_num_handle = numberHandle;
        }
        else if(_flip_h && !_flip_v)
        {
            _translated_num_handle = TRANSLATE_HANDLE_FLIP_H[numberHandle];
        }
        else if(!_flip_h && _flip_v)
        {
            _translated_num_handle = TRANSLATE_HANDLE_FLIP_V[numberHandle];
        }
        else
        {
            _translated_num_handle = TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[numberHandle];
        }

        this.bAspect = numberHandle % 2 === 0;
        this.aspect = this.bAspect === true ? this.originalObject.getAspect(_translated_num_handle) : 0;

        this.sin = _sin;
        this.cos = _cos;
        this.translatetNumberHandle = _translated_num_handle;

        switch (_translated_num_handle)
        {
            case 0:
            case 1:
            {
                this.fixedPointX = (_half_width*_cos - _half_height*_sin) + _half_width + originalObject.x;
                this.fixedPointY = (_half_width*_sin + _half_height*_cos) + _half_height + originalObject.y;
                break;
            }
            case 2:
            case 3:
            {
                this.fixedPointX = (-_half_width*_cos - _half_height*_sin) + _half_width + originalObject.x;
                this.fixedPointY = (-_half_width*_sin + _half_height*_cos) + _half_height + originalObject.y;
                break;
            }
            case 4:
            case 5:
            {
                this.fixedPointX = (-_half_width*_cos + _half_height*_sin) + _half_width + originalObject.x;
                this.fixedPointY = (-_half_width*_sin - _half_height*_cos) + _half_height + originalObject.y;
                break;
            }
            case 6:
            case 7:
            {
                this.fixedPointX = (_half_width*_cos + _half_height*_sin) + _half_width + originalObject.x;
                this.fixedPointY = (_half_width*_sin - _half_height*_cos) + _half_height + originalObject.y;
                break;
            }
        }

        this.mod = this.translatetNumberHandle % 4;
        this.centerPointX = originalObject.x + _half_width;
        this.centerPointY = originalObject.y + _half_height;

        //this.lineFlag = originalObject.checkLine();

        this.originalExtX = originalObject.extX;
        this.originalExtY = originalObject.extY;
        this.originalFlipH = _flip_h;
        this.originalFlipV = _flip_v;

        this.usedExtX =  this.originalExtX === 0 ? (/*this.lineFlag ? this.originalExtX :*/ 0.01) : this.originalExtX;
        this.usedExtY =  this.originalExtY === 0 ? (/*this.lineFlag ? this.originalExtY :*/ 0.01) : this.originalExtY;

        this.resizedExtX = this.originalExtX;
        this.resizedExtY = this.originalExtY;
        this.resizedflipH = _flip_h;
        this.resizedflipV = _flip_v;
        this.resizedPosX = originalObject.x;
        this.resizedPosY = originalObject.y;
        this.resizedRot = originalObject.rot;

        this.transform = originalObject.transform.CreateDublicate();
        this.geometry = AscFormat.ExecuteNoHistory(function(){ return originalObject.getGeom().createDuplicate();}, this, []);
        this.cropObject = originalObject.cropObject;
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
            var pen_brush = CreatePenBrushForChartTrack();
            this.brush = pen_brush.brush;
            this.pen = pen_brush.pen;
        }



        this.isLine = originalObject.spPr && originalObject.spPr.geometry && originalObject.spPr.geometry.preset === "line";
        this.bChangeCoef = this.translatetNumberHandle % 2 === 0 && this.originalFlipH !== this.originalFlipV;

        if(this.originalObject.cropObject)
        {
            if(this.brush)
            {
                this.brush = this.brush.createDuplicate();
            }
            this.pen = AscFormat.CreatePenBrushForChartTrack().pen;
        }
        this.overlayObject = new AscFormat.OverlayObject(this.geometry, this.resizedExtX, this.resizedExtY, this.brush, this.pen, this.transform);


        this.resizeConnector = function(kd1, kd2, e, x, y){

            var oConnectorInfo = this.originalObject.nvSpPr.nvUniSpPr;
            var oBeginShape =  AscCommon.g_oTableId.Get_ById(oConnectorInfo.stCnxId);
            if(oBeginShape && oBeginShape.bDeleted){
                oBeginShape = null;
            }
            var oEndShape = AscCommon.g_oTableId.Get_ById(oConnectorInfo.endCnxId);
            if(oEndShape && oEndShape.bDeleted){
                oEndShape = null;
            }
            var aDrawings = [];
            this.drawingsController.getAllSingularDrawings(this.drawingsController.getDrawingArray(), aDrawings);
            var oConnectionInfo = null;
            var oNewShape = null;
            this.oNewShape = null;
            this.beginShapeId = null;
            this.beginShapeIdx = null;

            this.endShapeId = null;
            this.endShapeIdx = null;
            for(var i = aDrawings.length-1; i > -1; --i) {
                if(aDrawings[i] === this.originalObject){
                    continue;
                }
                oConnectionInfo = aDrawings[i].findConnector(x, y);
                if (oConnectionInfo) {
                    oNewShape = aDrawings[i];
                    this.oNewShape = oNewShape;
                    break;
                }
            }
            if(!this.oNewShape){
                for(var i = aDrawings.length - 1; i > -1; --i){
                    if(aDrawings[i] === this.originalObject){
                        continue;
                    }
                    var oCs = aDrawings[i].findConnectionShape(x, y);
                    if(oCs ){
                        this.oNewShape = oCs;
                        break;
                    }
                }
            }

            var _beginConnectionInfo, _endConnectionInfo;
            if(this.numberHandle === 0){
                if(oEndShape){
                    var oConectionObject = oEndShape.getGeom().cnxLst[oConnectorInfo.endCnxIdx];
                    var g_conn_info =  {idx: oConnectorInfo.endCnxIdx, ang: oConectionObject.ang, x: oConectionObject.x, y: oConectionObject.y};
                    var _flipH = oEndShape.flipH;
                    var _flipV = oEndShape.flipV;
                    var _rot   = oEndShape.rot;

                    if(oEndShape.group){
                        _rot = AscFormat.normalizeRotate(oEndShape.group.getFullRotate() + _rot);
                        if(oEndShape.group.getFullFlipH()){
                            _flipH = !_flipH;
                        }
                        if(oEndShape.group.getFullFlipV()){
                            _flipV = !_flipV;
                        }
                    }
                    _endConnectionInfo = oEndShape.convertToConnectionParams(_rot, _flipH, _flipV, oEndShape.transform, oEndShape.bounds, g_conn_info);
                }
                _beginConnectionInfo = oConnectionInfo;
                if(_beginConnectionInfo){
                    this.beginShapeId = this.oNewShape.Id;
                    this.beginShapeIdx = _beginConnectionInfo.idx;
                }
            }
            else{
                if(oBeginShape){
                    var oConectionObject = oBeginShape.getGeom().cnxLst[oConnectorInfo.stCnxIdx];
                    var g_conn_info =  {idx: oConnectorInfo.stCnxIdx, ang: oConectionObject.ang, x: oConectionObject.x, y: oConectionObject.y};
                    var _flipH = oBeginShape.flipH;
                    var _flipV = oBeginShape.flipV;
                    var _rot   = oBeginShape.rot;
                    if(oBeginShape.group){
                        _rot = AscFormat.normalizeRotate(oBeginShape.group.getFullRotate() + _rot);
                        if(oBeginShape.group.getFullFlipH()){
                            _flipH = !_flipH;
                        }
                        if(oBeginShape.group.getFullFlipV()){
                            _flipV = !_flipV;
                        }
                    }
                    _beginConnectionInfo = oBeginShape.convertToConnectionParams(_rot, _flipH, _flipV, oBeginShape.transform, oBeginShape.bounds, g_conn_info);
                }
                _endConnectionInfo = oConnectionInfo;

                if(_endConnectionInfo){
                    this.endShapeId = this.oNewShape.Id;
                    this.endShapeIdx = _endConnectionInfo.idx;
                }
            }
            var _x, _y;
            if(_beginConnectionInfo || _endConnectionInfo){

                if(!_beginConnectionInfo){
                    if(this.numberHandle === 0){
                        _beginConnectionInfo = AscFormat.fCalculateConnectionInfo(_endConnectionInfo, x, y);
                    }
                    else{
                        _x = this.originalObject.transform.TransformPointX(0, 0);
                        _y = this.originalObject.transform.TransformPointY(0, 0);
                        _beginConnectionInfo = AscFormat.fCalculateConnectionInfo(_endConnectionInfo, _x, _y);
                    }
                }
                if(!_endConnectionInfo){
                    if(this.numberHandle === 0){
                        _x = this.originalObject.transform.TransformPointX(this.originalObject.extX, this.originalObject.extY);
                        _y = this.originalObject.transform.TransformPointY(this.originalObject.extX, this.originalObject.extY);
                        _endConnectionInfo = AscFormat.fCalculateConnectionInfo(_beginConnectionInfo, _x, _y);

                    }
                    else{
                        _endConnectionInfo = AscFormat.fCalculateConnectionInfo(_beginConnectionInfo, x, y);
                    }
                }
            }

            if(_beginConnectionInfo && _endConnectionInfo){
                this.oSpPr = AscFormat.fCalculateSpPr(_beginConnectionInfo, _endConnectionInfo, this.originalObject.spPr.geometry.preset, this.overlayObject.pen.w);

                if(this.originalObject.group){
                    var _xc = this.oSpPr.xfrm.offX + this.oSpPr.xfrm.extX / 2.0;
                    var _yc = this.oSpPr.xfrm.offY + this.oSpPr.xfrm.extY / 2.0;
                    var xc = this.originalObject.group.invertTransform.TransformPointX(_xc, _yc);
                    var yc = this.originalObject.group.invertTransform.TransformPointY(_xc, _yc);
                    this.oSpPr.xfrm.setOffX(xc - this.oSpPr.xfrm.extX / 2.0);
                    this.oSpPr.xfrm.setOffY(yc - this.oSpPr.xfrm.extY / 2.0);
                    this.oSpPr.xfrm.setFlipH(this.originalObject.group.getFullFlipH() ? !this.oSpPr.xfrm.flipH : this.oSpPr.xfrm.flipH);
                    this.oSpPr.xfrm.setFlipV(this.originalObject.group.getFullFlipV() ? !this.oSpPr.xfrm.flipV : this.oSpPr.xfrm.flipV);
                    this.oSpPr.xfrm.setRot(AscFormat.normalizeRotate(this.oSpPr.xfrm.rot - this.originalObject.group.getFullRotate()));
                }

                var _xfrm = this.oSpPr.xfrm;
                this.resizedExtX = _xfrm.extX;
                this.resizedExtY = _xfrm.extY;
                this.resizedflipH = _xfrm.flipH;
                this.resizedflipV = _xfrm.flipV;
                this.resizedPosX = _xfrm.offX;
                this.resizedPosY = _xfrm.offY;
                this.resizedRot = _xfrm.rot;
                this.recalculateTransform();
                this.geometry = this.oSpPr.geometry;
                this.overlayObject.geometry = this.geometry;
                this.geometry.Recalculate(this.oSpPr.xfrm.extX, this.oSpPr.xfrm.extY);

            }
            else{
                this.oSpPr = null;
                this.resizedRot = this.originalObject.rot;
                this.geometry = AscFormat.ExecuteNoHistory(function(){
                    return originalObject.spPr.geometry.createDuplicate();
                }, this, []);
                this.overlayObject.geometry = this.geometry;
                this.resize(kd1, kd2, e.ShiftKey);
            }
        };

        this.track = function(kd1, kd2, e, x, y){
            AscFormat.ExecuteNoHistory(function () {
                this.bIsTracked = true;
                if(this.bConnector){
                    this.resizeConnector(kd1, kd2, e, x, y);
                }
                else if(!e.CtrlKey){
                    this.resize(kd1, kd2, e.ShiftKey);
                }
                else{
                    this.resizeRelativeCenter(kd1, kd2, e.ShiftKey)
                }
            }, this, []);
        };

        this.resize = function(kd1, kd2, ShiftKey)
        {
            this.bLastCenter = false;
            var _cos = this.cos;
            var _sin = this.sin;

            var _real_height, _real_width;
            var _abs_height, _abs_width;
            var _new_resize_half_width;
            var _new_resize_half_height;
            var _new_used_half_width;
            var _new_used_half_height;
            var _temp;

           if(this.originalObject.getObjectType && this.originalObject.getObjectType() === AscDFH.historyitem_type_GraphicFrame){
               if(kd1 < 0){
                   kd1 = 0;
               }
               if(kd2 < 0){
                   kd2 = 0;
               }
           }
            var isCrop = (this.originalObject.isCrop || !!this.originalObject.cropObject);
            if((ShiftKey === true || (window.AscAlwaysSaveAspectOnResizeTrack === true && !this.isLine) || (!isCrop && this.originalObject.getNoChangeAspect())) && this.bAspect === true)
            {
                var _new_aspect = this.aspect*(Math.abs(kd1/ kd2));

                if (_new_aspect >= this.aspect)
                    kd2 = Math.abs(kd1)*(kd2 >= 0 ? 1 : -1 );
                else
                    kd1 = Math.abs(kd2)*(kd1 >= 0 ? 1 : -1);
            }

            if(this.bChangeCoef)
            {
                _temp = kd1;
                kd1 = kd2;
                kd2 = _temp;
            }
            switch (this.translatetNumberHandle)
            {
                case 0:
                case 1:
                {
                    if(this.translatetNumberHandle === 0)
                    {
                        _real_width = this.usedExtX*kd1;
                        _abs_width = Math.abs(_real_width);
                        if(!this.isLine)
                        {
                            this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE  ? _abs_width : MIN_SHAPE_SIZE;
                        }
                        else
                        {
                            this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE  ? _abs_width : 0;
                        }
                        if(_real_width < 0 )
                        {
                            this.resizedflipH = !this.originalFlipH;
                        }
                        else
                            this.resizedflipH = this.originalFlipH;
                    }
                    if(this.translatetNumberHandle === 1)
                    {
                        _temp = kd1;
                        kd1 = kd2;
                        kd2 = _temp;
                    }

                    _real_height = this.usedExtY*kd2;
                    _abs_height = Math.abs(_real_height);

                    if(!this.isLine)
                    {
                        this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE  ? _abs_height : MIN_SHAPE_SIZE;
                    }
                    else
                    {
                        this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE  ? _abs_height : 0;
                    }

                    this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE  || this.isLine  ? _abs_height : MIN_SHAPE_SIZE;
                    if(_real_height < 0 )
                    {
                        this.resizedflipV = !this.originalFlipV;
                        if(this.isLine && ShiftKey)
                        {
                            this.resizedflipH = !this.originalFlipH;
                        }
                    }
                    else
                    {
                        this.resizedflipV = this.originalFlipV;
                        if(this.isLine && ShiftKey && this.resizedflipH !== this.originalFlipH)
                        {
                            this.resizedflipV = !this.originalFlipV;
                        }
                    }


                    _new_resize_half_width = this.resizedExtX*0.5;
                    _new_resize_half_height = this.resizedExtY*0.5;
                    if(this.resizedflipH !== this.originalFlipH)
                    {
                        _new_used_half_width = -_new_resize_half_width;
                    }
                    else
                    {
                        _new_used_half_width = _new_resize_half_width;
                    }

                    if(this.resizedflipV !== this.originalFlipV)
                    {
                        _new_used_half_height = -_new_resize_half_height;
                    }
                    else
                    {
                        _new_used_half_height = _new_resize_half_height;
                    }

                    this.resizedPosX = this.fixedPointX + (-_new_used_half_width*_cos + _new_used_half_height*_sin) - _new_resize_half_width;
                    this.resizedPosY = this.fixedPointY + (-_new_used_half_width*_sin - _new_used_half_height*_cos) - _new_resize_half_height;
                    break;
                }
                case 2:
                case 3:
                {
                    if(this.translatetNumberHandle === 2)
                    {
                        _temp = kd2;
                        kd2 = kd1;
                        kd1 = _temp;
                        _real_height = this.usedExtY*kd2;
                        _abs_height = Math.abs(_real_height);
                        this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE  ? _abs_height : (this.isLine ? 0 : MIN_SHAPE_SIZE);
                        if(_real_height < 0 )
                            this.resizedflipV = !this.originalFlipV;
                        else
                            this.resizedflipV = this.originalFlipV;
                    }

                    _real_width = this.usedExtX*kd1;
                    _abs_width = Math.abs(_real_width);
                    this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE  ? _abs_width : (this.isLine ? 0 : MIN_SHAPE_SIZE);
                    if(_real_width < 0 )
                    {
                        this.resizedflipH = !this.originalFlipH;
                        if(this.isLine && ShiftKey)
                        {
                            this.resizedflipV = !this.originalFlipV;
                        }
                    }
                    else
                    {
                        this.resizedflipH = this.originalFlipH;
                        if(this.isLine && ShiftKey && this.resizedflipV !== this.originalFlipV)
                        {
                            this.resizedflipH = !this.originalFlipH;
                        }
                    }


                    _new_resize_half_width = this.resizedExtX*0.5;
                    _new_resize_half_height = this.resizedExtY*0.5;
                    if(this.resizedflipH !== this.originalFlipH)
                    {
                        _new_used_half_width = -_new_resize_half_width;
                    }

                    else
                    {
                        _new_used_half_width = _new_resize_half_width;
                    }

                    if(this.resizedflipV !== this.originalFlipV)
                    {
                        _new_used_half_height = -_new_resize_half_height;
                    }
                    else
                    {
                        _new_used_half_height = _new_resize_half_height;
                    }

                    this.resizedPosX = this.fixedPointX + (_new_used_half_width*_cos + _new_used_half_height*_sin) - _new_resize_half_width;
                    this.resizedPosY = this.fixedPointY + (_new_used_half_width*_sin - _new_used_half_height*_cos) - _new_resize_half_height;
                    break;
                }

                case 4:
                case 5:
                {
                    if(this.translatetNumberHandle === 4)
                    {
                        _real_width = this.usedExtX*kd1;
                        _abs_width = Math.abs(_real_width);
                        this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE   ? _abs_width : (this.isLine ? 0 :MIN_SHAPE_SIZE);
                        if(_real_width < 0 )
                            this.resizedflipH = !this.originalFlipH;
                        else
                            this.resizedflipH = this.originalFlipH;
                    }
                    else
                    {
                        _temp = kd2;
                        kd2 = kd1;
                        kd1 = _temp;
                    }

                    _real_height = this.usedExtY*kd2;
                    _abs_height = Math.abs(_real_height);
                    this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE  ? _abs_height :  (this.isLine ? 0 : MIN_SHAPE_SIZE);
                    if(_real_height < 0 )
                    {
                        this.resizedflipV = !this.originalFlipV;
                        if(this.isLine && ShiftKey)
                        {
                            this.resizedflipH = !this.originalFlipH;
                        }
                    }
                    else
                    {
                        this.resizedflipV = this.originalFlipV;
                        if(this.isLine && ShiftKey && this.resizedflipH !== this.originalFlipH)
                        {
                            this.resizedflipV = !this.originalFlipV;
                        }
                    }

                    _new_resize_half_width = this.resizedExtX*0.5;
                    _new_resize_half_height = this.resizedExtY*0.5;
                    if(this.resizedflipH !== this.originalFlipH)
                    {
                        _new_used_half_width = -_new_resize_half_width;
                    }
                    else
                    {
                        _new_used_half_width = _new_resize_half_width;
                    }

                    if(this.resizedflipV !== this.originalFlipV)
                    {
                        _new_used_half_height = -_new_resize_half_height;
                    }
                    else
                    {
                        _new_used_half_height = _new_resize_half_height;
                    }

                    this.resizedPosX = this.fixedPointX + (_new_used_half_width*_cos - _new_used_half_height*_sin) - _new_resize_half_width;
                    this.resizedPosY = this.fixedPointY + (_new_used_half_width*_sin + _new_used_half_height*_cos) - _new_resize_half_height;

                    break;
                }

                case 6:
                case 7:
                {
                    if(this.translatetNumberHandle === 6)
                    {
                        _real_height = this.usedExtY*kd1;
                        _abs_height = Math.abs(_real_height);
                        this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE   ? _abs_height : (this.isLine ? 0 : MIN_SHAPE_SIZE);
                        if(_real_height < 0 )
                            this.resizedflipV = !this.originalFlipV;
                        else
                            this.resizedflipV = this.originalFlipV;
                    }
                    else
                    {
                        _temp = kd2;
                        kd2 = kd1;
                        kd1 = _temp;
                    }

                    _real_width = this.usedExtX*kd2;
                    _abs_width = Math.abs(_real_width);
                    this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE   ? _abs_width : (this.isLine ? 0 : MIN_SHAPE_SIZE);
                    if(_real_width < 0 )
                    {
                        this.resizedflipH = !this.originalFlipH;
                        if(this.isLine && ShiftKey)
                        {
                            this.resizedflipV = !this.originalFlipV;
                        }
                    }
                    else
                    {
                        this.resizedflipH = this.originalFlipH;
                        if(this.isLine && ShiftKey && this.resizedflipV !== this.originalFlipV)
                        {
                            this.resizedflipH = !this.originalFlipH;
                        }
                    }

                    _new_resize_half_width = this.resizedExtX*0.5;
                    _new_resize_half_height = this.resizedExtY*0.5;
                    if(this.resizedflipH !== this.originalFlipH)
                    {
                        _new_used_half_width = -_new_resize_half_width;
                    }
                    else
                    {
                        _new_used_half_width = _new_resize_half_width;
                    }

                    if(this.resizedflipV !== this.originalFlipV)
                    {
                        _new_used_half_height = -_new_resize_half_height;
                    }
                    else
                    {
                        _new_used_half_height = _new_resize_half_height;
                    }

                    this.resizedPosX = this.fixedPointX + (-_new_used_half_width*_cos - _new_used_half_height*_sin) - _new_resize_half_width;
                    this.resizedPosY = this.fixedPointY + (-_new_used_half_width*_sin + _new_used_half_height*_cos) - _new_resize_half_height;
                    break;
                }
            }


            if(isCrop){
                this.resizedflipH = this.originalFlipH;
                this.resizedflipV = this.originalFlipV;
            }
            if(this.originalObject.getObjectType() && this.originalObject.getObjectType() === AscDFH.historyitem_type_OleObject){
                this.resizedflipH = false;
                this.resizedflipV = false;
            }
            this.geometry.Recalculate(this.resizedExtX, this.resizedExtY);
            this.overlayObject.updateExtents(this.resizedExtX, this.resizedExtY);

            this.recalculateTransform();

            if(this.bConnector){
                if(this.numberHandle === 0){
                    this.beginShapeIdx = null;
                    this.beginShapeId = null;
                }
                else{
                    this.endShapeIdx = null;
                    this.endShapeId = null;
                }
            }
        };

        this.resizeRelativeCenter = function(kd1, kd2, ShiftKey)
        {
            if(this.isLine)
            {
                this.resize(kd1, kd2, ShiftKey);
                return;
            }
            this.bLastCenter = true;
            kd1 = 2*kd1 - 1;
            kd2 = 2*kd2 - 1;

            if(this.originalObject.getObjectType && this.originalObject.getObjectType() === AscDFH.historyitem_type_GraphicFrame){
                if(kd1 < 0){
                    kd1 = 0;
                }
                if(kd2 < 0){
                    kd2 = 0;
                }
            }
            var _real_height, _real_width;
            var _abs_height, _abs_width;

            var isCrop = (this.originalObject.isCrop || !!this.originalObject.cropObject);
            if((ShiftKey === true || window.AscAlwaysSaveAspectOnResizeTrack === true || (!isCrop && this.originalObject.getNoChangeAspect())) && this.bAspect === true)
            {
                var _new_aspect = this.aspect*(Math.abs(kd1/ kd2));

                if (_new_aspect >= this.aspect)
                    kd2 = Math.abs(kd1)*(kd2 >= 0 ? 1 : -1 );
                else
                    kd1 = Math.abs(kd2)*(kd1 >= 0 ? 1 : -1);
            }

            var _temp;
            if(this.bChangeCoef)
            {
                _temp = kd1;
                kd1 = kd2;
                kd2 = _temp;
            }
            if(this.mod === 0 || this.mod === 1)
            {
                if(this.mod === 0)
                {
                    _real_width = this.usedExtX*kd1;
                    _abs_width = Math.abs(_real_width);
                    this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE  || this.isLine ? _abs_width : MIN_SHAPE_SIZE;
                    this.resizedflipH  = _real_width < 0 ? !this.originalFlipH : this.originalFlipH;

                }
                else
                {
                    _temp = kd1;
                    kd1 = kd2;
                    kd2 = _temp;
                }

                _real_height = this.usedExtY*kd2;
                _abs_height = Math.abs(_real_height);
                this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE  || this.isLine ? _abs_height : MIN_SHAPE_SIZE;
                this.resizedflipV  = _real_height < 0 ? !this.originalFlipV : this.originalFlipV;


            }
            else
            {
                if(this.mod === 2)
                {
                    _temp = kd1;
                    kd1 = kd2;
                    kd2 = _temp;

                    _real_height = this.usedExtY*kd2;
                    _abs_height = Math.abs(_real_height);
                    this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE  || this.isLine ? _abs_height : MIN_SHAPE_SIZE;
                    this.resizedflipV  = _real_height < 0 ? !this.originalFlipV : this.originalFlipV;

                }
                _real_width = this.usedExtX*kd1;
                _abs_width = Math.abs(_real_width);
                this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE  || this.isLine ? _abs_width : MIN_SHAPE_SIZE;
                this.resizedflipH  = _real_width < 0 ? !this.originalFlipH : this.originalFlipH;

            }


            if(isCrop){
                this.resizedflipH = this.originalFlipH;
                this.resizedflipV = this.originalFlipV;
            }
            this.resizedPosX = this.centerPointX - this.resizedExtX*0.5;
            this.resizedPosY = this.centerPointY - this.resizedExtY*0.5;

            this.geometry.Recalculate(this.resizedExtX, this.resizedExtY);
            this.overlayObject.updateExtents(this.resizedExtX, this.resizedExtY);

            this.recalculateTransform();
        };

        this.recalculateTransform = function(){
            var _transform = this.transform;
            _transform.Reset();

            var _horizontal_center = this.resizedExtX*0.5;
            var _vertical_center = this.resizedExtY*0.5;
            global_MatrixTransformer.TranslateAppend(_transform, -_horizontal_center, -_vertical_center);

            if(this.resizedflipH)
            {
                global_MatrixTransformer.ScaleAppend(_transform, -1, 1);
            }
            if(this.resizedflipV)
            {
                global_MatrixTransformer.ScaleAppend(_transform, 1, -1);
            }

            global_MatrixTransformer.RotateRadAppend(_transform, -this.resizedRot);


            global_MatrixTransformer.TranslateAppend(_transform, this.resizedPosX, this.resizedPosY);
            global_MatrixTransformer.TranslateAppend(_transform, _horizontal_center, _vertical_center);
            if(this.originalObject.group)
            {
                global_MatrixTransformer.MultiplyAppend(_transform, this.originalObject.group.transform);
            }

            if(this.originalObject.parent)
            {
                var parent_transform = this.originalObject.parent.Get_ParentTextTransform && this.originalObject.parent.Get_ParentTextTransform();
                if(parent_transform)
                {
                    global_MatrixTransformer.MultiplyAppend(_transform, parent_transform);
                }

            }
            if(this.originalObject.cropObject)
            {
                var oShapeDrawer = new AscCommon.CShapeDrawer();
                oShapeDrawer.bIsCheckBounds = true;
                oShapeDrawer.Graphics = new AscFormat.CSlideBoundsChecker();
                this.overlayObject.check_bounds(oShapeDrawer);
                this.brush.fill.srcRect = AscFormat.CalculateSrcRect(_transform, oShapeDrawer, this.originalObject.cropObject.invertTransform, this.originalObject.cropObject.extX, this.originalObject.cropObject.extY);
            }
        };

        this.draw = function(overlay, transform)
        {
            if(AscFormat.isRealNumber(this.originalObject.selectStartPage) && overlay.SetCurrentPage)
            {
                overlay.SetCurrentPage(this.originalObject.selectStartPage);
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
                var srcRect = AscFormat.CalculateSrcRect(parentCrop.transform, oShapeDrawer, global_MatrixTransformer.Invert(this.transform), this.resizedExtX, this.resizedExtY);
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
                this.overlayObject.pen = AscFormat.CreatePenBrushForChartTrack().pen;
                this.overlayObject.draw(overlay, transform);
                if(AscFormat.isRealNumber(dOldAlpha) && oGraphics.put_GlobalAlpha)
                {
                    oGraphics.put_GlobalAlpha(true, dOldAlpha);
                }
                return;
            }


            if(this.oNewShape){
                this.oNewShape.drawConnectors(overlay);
            }
            this.overlayObject.draw(overlay, transform);
        };

        this.getBounds = function()
        {
            var boundsChecker = new  AscFormat.CSlideBoundsChecker();
            var tr = null;
            if(this.originalObject && this.originalObject.parent)
            {
                var parent_transform = this.originalObject.parent.Get_ParentTextTransform && this.originalObject.parent.Get_ParentTextTransform();
                if(parent_transform)
                {
                    tr = this.transform.CreateDublicate();
                    global_MatrixTransformer.MultiplyAppend(tr, global_MatrixTransformer.Invert(parent_transform));
                }

            }
            this.draw(boundsChecker, tr ? tr : null);
            tr = this.transform;
            var arr_p_x = [];
            var arr_p_y = [];
            arr_p_x.push(tr.TransformPointX(0,0));
            arr_p_y.push(tr.TransformPointY(0,0));
            arr_p_x.push(tr.TransformPointX(this.resizedExtX,0));
            arr_p_y.push(tr.TransformPointY(this.resizedExtX,0));
            arr_p_x.push(tr.TransformPointX(this.resizedExtX,this.resizedExtY));
            arr_p_y.push(tr.TransformPointY(this.resizedExtX,this.resizedExtY));
            arr_p_x.push(tr.TransformPointX(0,this.resizedExtY));
            arr_p_y.push(tr.TransformPointY(0,this.resizedExtY));

            arr_p_x.push(boundsChecker.Bounds.min_x);
            arr_p_x.push(boundsChecker.Bounds.max_x);
            arr_p_y.push(boundsChecker.Bounds.min_y);
            arr_p_y.push(boundsChecker.Bounds.max_y);

            boundsChecker.Bounds.min_x = Math.min.apply(Math, arr_p_x);
            boundsChecker.Bounds.max_x = Math.max.apply(Math, arr_p_x);
            boundsChecker.Bounds.min_y = Math.min.apply(Math, arr_p_y);
            boundsChecker.Bounds.max_y = Math.max.apply(Math, arr_p_y);

            boundsChecker.Bounds.posX = this.resizedPosX;
            boundsChecker.Bounds.posY = this.resizedPosY;
            boundsChecker.Bounds.extX = this.resizedExtX;
            boundsChecker.Bounds.extY = this.resizedExtY;
            return boundsChecker.Bounds;
        };


        this.trackEnd = function(bWord)
        {
            if(!this.bIsTracked){
                return;
            }
            if(!this.bConnector || !this.oSpPr){
                var scale_coefficients, ch_off_x, ch_off_y;
                if(this.originalObject.group)
                {
                    scale_coefficients = this.originalObject.group.getResultScaleCoefficients();
                    ch_off_x = this.originalObject.group.spPr.xfrm.chOffX;
                    ch_off_y = this.originalObject.group.spPr.xfrm.chOffY;
                }
                else
                {
                    scale_coefficients = {cx: 1, cy: 1};
                    ch_off_x = 0;
                    ch_off_y = 0;
                    if(bWord)
                    {
                        this.resizedPosX = 0;
                        this.resizedPosY = 0;
                    }
                }
                if(!this.originalObject.isCrop){
                    AscFormat.CheckSpPrXfrm(this.originalObject);
                }
                else{
                    AscFormat.ExecuteNoHistory(function () {
                        AscFormat.CheckSpPrXfrm(this.originalObject);
                    }, this, []);
                }
                var xfrm = this.originalObject.spPr.xfrm;

                if(this.originalObject.getObjectType() !== AscDFH.historyitem_type_GraphicFrame)
                {
                    if(!this.originalObject.isCrop)
                    {
                        xfrm.setOffX(this.resizedPosX/scale_coefficients.cx + ch_off_x);
                        xfrm.setOffY(this.resizedPosY/scale_coefficients.cy + ch_off_y);
                        xfrm.setExtX(this.resizedExtX/scale_coefficients.cx);
                        xfrm.setExtY(this.resizedExtY/scale_coefficients.cy);
                    }
                    else
                    {
                        AscFormat.ExecuteNoHistory(function () {
                            xfrm.setOffX(this.resizedPosX/scale_coefficients.cx + ch_off_x);
                            xfrm.setOffY(this.resizedPosY/scale_coefficients.cy + ch_off_y);
                            xfrm.setExtX(this.resizedExtX/scale_coefficients.cx);
                            xfrm.setExtY(this.resizedExtY/scale_coefficients.cy);
                        }, this, []);
                    }
                }
                else
                {
                    var oldX = xfrm.offX;
                    var oldY = xfrm.offY;
                    var newX = this.resizedPosX/scale_coefficients.cx + ch_off_x;
                    var newY = this.resizedPosY/scale_coefficients.cy + ch_off_y;
                    this.originalObject.graphicObject.Resize(this.resizedExtX, this.resizedExtY);
                    this.originalObject.recalculateTable();
                    this.originalObject.recalculateSizes();
                    if(!this.bLastCenter){
                        if(!AscFormat.fApproxEqual(oldX, newX, 0.5)){
                            xfrm.setOffX(this.resizedPosX/scale_coefficients.cx + ch_off_x - this.originalObject.extX + this.resizedExtX);
                        }
                        if(!AscFormat.fApproxEqual(oldY, newY, 0.5)){
                            xfrm.setOffY(this.resizedPosY/scale_coefficients.cy + ch_off_y - this.originalObject.extY + this.resizedExtY);
                        }
                    }
                    else{
                        xfrm.setOffX(this.resizedPosX + this.resizedExtX/2.0  - this.originalObject.extX/2);
                        xfrm.setOffY(this.resizedPosY + this.resizedExtY/2.0  - this.originalObject.extY/2);
                    }
                }
                if(this.originalObject.getObjectType() !== AscDFH.historyitem_type_ChartSpace && this.originalObject.getObjectType() !== AscDFH.historyitem_type_GraphicFrame)
                {

                    if(!this.originalObject.isCrop)
                    {
                        xfrm.setFlipH(this.resizedflipH);
                        xfrm.setFlipV(this.resizedflipV);
                    }
                    else
                    {
                        AscFormat.ExecuteNoHistory(function () {
                            xfrm.setFlipH(this.resizedflipH);
                            xfrm.setFlipV(this.resizedflipV);
                        }, this, []);
                    }
                }
                if(this.originalObject.getObjectType && this.originalObject.getObjectType() === AscDFH.historyitem_type_OleObject)
                {
                    var api = window.editor || window["Asc"]["editor"];
                    if(api)
                    {
                        var pluginData = new Asc.CPluginData();
                        pluginData.setAttribute("data", this.originalObject.m_sData);
                        pluginData.setAttribute("guid", this.originalObject.m_sApplicationId);
                        pluginData.setAttribute("width", xfrm.extX);
                        pluginData.setAttribute("height", xfrm.extY);
                        pluginData.setAttribute("objectId", this.originalObject.Get_Id());
                        api.asc_pluginResize(pluginData);
                    }
                }

                if(this.bConnector){
                    var nvUniSpPr = this.originalObject.nvSpPr.nvUniSpPr.copy();
                    if(this.numberHandle === 0){
                        nvUniSpPr.stCnxIdx = this.beginShapeIdx;
                        nvUniSpPr.stCnxId  = this.beginShapeId;
                        this.originalObject.nvSpPr.setUniSpPr(nvUniSpPr);
                    }
                    else{
                        nvUniSpPr.endCnxIdx = this.endShapeIdx;
                        nvUniSpPr.endCnxId  = this.endShapeId;
                        this.originalObject.nvSpPr.setUniSpPr(nvUniSpPr);
                    }
                }
                if(this.originalObject.isCrop)
                {
                    AscFormat.ExecuteNoHistory(function(){
                        this.originalObject.recalculateGeometry();
                    }, this, [])

                    this.originalObject.transform = this.transform;
                    this.originalObject.invertTransform = AscCommon.global_MatrixTransformer.Invert(this.transform);

                    this.originalObject.extX = this.resizedExtX;
                    this.originalObject.extY = this.resizedExtY;

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
                    this.originalObject.extX = this.resizedExtX;
                    this.originalObject.extY = this.resizedExtY;
                    this.originalObject.calculateSrcRect();
                }
            }
            else{
                var _xfrm = this.originalObject.spPr.xfrm;
                var _xfrm2 = this.oSpPr.xfrm;
                _xfrm.setOffX(_xfrm2.offX);
                _xfrm.setOffY(_xfrm2.offY);
                _xfrm.setExtX(_xfrm2.extX);
                _xfrm.setExtY(_xfrm2.extY);
                _xfrm.setFlipH(_xfrm2.flipH);
                _xfrm.setFlipV(_xfrm2.flipV);
                _xfrm.setRot(_xfrm2.rot);
                this.originalObject.spPr.setGeometry(this.oSpPr.geometry.createDuplicate());


                var nvUniSpPr = this.originalObject.nvSpPr.nvUniSpPr.copy();
                if(this.numberHandle === 0){
                    nvUniSpPr.stCnxIdx = this.beginShapeIdx;
                    nvUniSpPr.stCnxId  = this.beginShapeId;
                    this.originalObject.nvSpPr.setUniSpPr(nvUniSpPr);
                }
                else{
                    nvUniSpPr.endCnxIdx = this.endShapeIdx;
                    nvUniSpPr.endCnxId  = this.endShapeId;
                    this.originalObject.nvSpPr.setUniSpPr(nvUniSpPr);
                }
            }
            if(!this.originalObject.isCrop)
            {
                AscFormat.CheckShapeBodyAutoFitReset(this.originalObject);
                this.originalObject.checkDrawingBaseCoords();
            }
            else
            {
                AscFormat.ExecuteNoHistory(function () {
                    AscFormat.CheckShapeBodyAutoFitReset(this.originalObject);
                    this.originalObject.checkDrawingBaseCoords();
                }, this, []);
            }
        };
    }, this, []);
}

function ResizeTrackGroup(originalObject, cardDirection, parentTrack)
{
    AscFormat.ExecuteNoHistory(function()
    {
        this.bIsTracked = false;
        this.original = originalObject;

        this.originalObject = originalObject;
        this.parentTrack = parentTrack;
        var numberHandle;
        if(AscFormat.isRealNumber(cardDirection))
        {
            this.numberHandle = originalObject.getNumByCardDirection(cardDirection);
            numberHandle =  this.numberHandle;
        }
        this.x = originalObject.x;
        this.y = originalObject.y;

        this.extX = originalObject.extX;
        this.extY = originalObject.extY;
        this.rot = originalObject.rot;
        this.flipH = originalObject.flipH;
        this.flipV = originalObject.flipV;
        this.transform = originalObject.transform.CreateDublicate();
        this.bSwapCoef = !(AscFormat.checkNormalRotate(this.rot));
        this.childs = [];
        var a = originalObject.spTree;
        for(var i = 0; i < a.length; ++i)
        {
            if(a[i].isGroup())
                this.childs[i] = new ResizeTrackGroup(a[i], null, this);
            else
                this.childs[i] = new ShapeForResizeInGroup(a[i], this);
        }
        if(typeof numberHandle === "number")
        {
            var _translated_num_handle;
            var _flip_h = this.flipH;
            var _flip_v = this.flipV;
            var _sin = Math.sin(this.rot);
            var _cos = Math.cos(this.rot);
            var _half_width = this.extX*0.5;
            var _half_height = this.extY*0.5;
            if(!_flip_h && !_flip_v)
            {
                _translated_num_handle = numberHandle;
            }
            else if(_flip_h && !_flip_v)
            {
                _translated_num_handle = TRANSLATE_HANDLE_FLIP_H[numberHandle];
            }
            else if(!_flip_h && _flip_v)
            {
                _translated_num_handle = TRANSLATE_HANDLE_FLIP_V[numberHandle];
            }
            else
            {
                _translated_num_handle = TRANSLATE_HANDLE_FLIP_H_AND_FLIP_V[numberHandle];
            }

            this.bAspect = numberHandle % 2 === 0;
            this.aspect = this.bAspect === true ? this.original.getAspect(_translated_num_handle) : 0;

            this.sin = _sin;
            this.cos = _cos;
            this.translatetNumberHandle = _translated_num_handle;

            switch (_translated_num_handle)
            {
                case 0:
                case 1:
                {
                    this.fixedPointX = (_half_width*_cos - _half_height*_sin) + _half_width + this.x;
                    this.fixedPointY = (_half_width*_sin + _half_height*_cos) + _half_height + this.y;
                    break;
                }
                case 2:
                case 3:
                {
                    this.fixedPointX = (-_half_width*_cos - _half_height*_sin) + _half_width + this.x;
                    this.fixedPointY = (-_half_width*_sin + _half_height*_cos) + _half_height + this.y;
                    break;
                }
                case 4:
                case 5:
                {
                    this.fixedPointX = (-_half_width*_cos + _half_height*_sin) + _half_width + this.x;
                    this.fixedPointY = (-_half_width*_sin - _half_height*_cos) + _half_height + this.y;
                    break;
                }
                case 6:
                case 7:
                {
                    this.fixedPointX = (_half_width*_cos + _half_height*_sin) + _half_width + this.x;
                    this.fixedPointY = (_half_width*_sin - _half_height*_cos) + _half_height + this.y;
                    break;
                }
            }

            this.mod = this.translatetNumberHandle % 4;
            this.centerPointX = this.x + _half_width;
            this.centerPointY = this.y + _half_height;

            this.lineFlag = false;

            this.originalExtX = this.extX;
            this.originalExtY = this.extY;
            this.originalFlipH = _flip_h;
            this.originalFlipV = _flip_v;

            this.usedExtX =  this.originalExtX === 0 ? (/*this.lineFlag ? this.originalExtX :*/ 0.01) : this.originalExtX;
            this.usedExtY =  this.originalExtY === 0 ? (/*this.lineFlag ? this.originalExtY :*/ 0.01) : this.originalExtY;

            this.resizedExtX = this.originalExtX;
            this.resizedExtY = this.originalExtY;
            this.resizedflipH = _flip_h;
            this.resizedflipV = _flip_v;
            this.resizedPosX = this.x;
            this.resizedPosY = this.y;
            this.resizedRot = this.rot;

            this.bChangeCoef = this.translatetNumberHandle % 2 === 0 && this.originalFlipH !== this.originalFlipV;


        }

        if(this.parentTrack)
        {
            this.centerDistX = this.x + this.extX*0.5 - this.parentTrack.extX*0.5;
            this.centerDistY = this.y + this.extY*0.5 - this.parentTrack.extY*0.5;
        }

        this.track = function(kd1, kd2, e)
        {
            AscFormat.ExecuteNoHistory(function () {

                this.bIsTracked = true;
                if(!e.CtrlKey)
                    this.resize(kd1, kd2, e.ShiftKey);
                else
                    this.resizeRelativeCenter(kd1, kd2, e.ShiftKey)
            }, this, [])
        };

        this.resize = function(kd1, kd2, ShiftKey)
        {
            var _cos = this.cos;
            var _sin = this.sin;

            var _real_height, _real_width;
            var _abs_height, _abs_width;
            var _new_resize_half_width;
            var _new_resize_half_height;
            var _new_used_half_width;
            var _new_used_half_height;
            var _temp;

            var isCrop = (this.originalObject.isCrop || !!this.originalObject.cropObject);
            if((ShiftKey === true || window.AscAlwaysSaveAspectOnResizeTrack === true || (!isCrop && this.originalObject.getNoChangeAspect())) && this.bAspect === true)
            {
                var _new_aspect = this.aspect*(Math.abs(kd1/ kd2));

                if (_new_aspect >= this.aspect)
                    kd2 = Math.abs(kd1)*(kd2 >= 0 ? 1 : -1 );
                else
                    kd1 = Math.abs(kd2)*(kd1 >= 0 ? 1 : -1);
            }

            if(this.bChangeCoef)
            {
                _temp = kd1;
                kd1 = kd2;
                kd2 = _temp;
            }
            switch (this.translatetNumberHandle)
            {
                case 0:
                case 1:
                {
                    if(this.translatetNumberHandle === 0)
                    {
                        _real_width = this.usedExtX*kd1;
                        _abs_width = Math.abs(_real_width);
                        this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_width : MIN_SHAPE_SIZE;
                        if(_real_width < 0)
                            this.resizedflipH = !this.originalFlipH;
                        else
                            this.resizedflipH = this.originalFlipH;
                    }
                    if(this.translatetNumberHandle === 1)
                    {
                        _temp = kd1;
                        kd1 = kd2;
                        kd2 = _temp;
                    }

                    _real_height = this.usedExtY*kd2;
                    _abs_height = Math.abs(_real_height);
                    this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_height : MIN_SHAPE_SIZE;
                    if(_real_height < 0)
                        this.resizedflipV = !this.originalFlipV;
                    else
                        this.resizedflipV = this.originalFlipV;


                    _new_resize_half_width = this.resizedExtX*0.5;
                    _new_resize_half_height = this.resizedExtY*0.5;
                    if(this.resizedflipH !== this.originalFlipH)
                    {
                        _new_used_half_width = -_new_resize_half_width;
                    }
                    else
                    {
                        _new_used_half_width = _new_resize_half_width;
                    }

                    if(this.resizedflipV !== this.originalFlipV)
                    {
                        _new_used_half_height = -_new_resize_half_height;
                    }
                    else
                    {
                        _new_used_half_height = _new_resize_half_height;
                    }

                    this.resizedPosX = this.fixedPointX + (-_new_used_half_width*_cos + _new_used_half_height*_sin) - _new_resize_half_width;
                    this.resizedPosY = this.fixedPointY + (-_new_used_half_width*_sin - _new_used_half_height*_cos) - _new_resize_half_height;
                    break;
                }
                case 2:
                case 3:
                {
                    if(this.translatetNumberHandle === 2)
                    {
                        _temp = kd2;
                        kd2 = kd1;
                        kd1 = _temp;
                        _real_height = this.usedExtY*kd2;
                        _abs_height = Math.abs(_real_height);
                        this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_height : MIN_SHAPE_SIZE;
                        if(_real_height < 0)
                            this.resizedflipV = !this.originalFlipV;
                        else
                            this.resizedflipV = this.originalFlipV;
                    }

                    _real_width = this.usedExtX*kd1;
                    _abs_width = Math.abs(_real_width);
                    this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_width : MIN_SHAPE_SIZE;
                    if(_real_width < 0)
                        this.resizedflipH = !this.originalFlipH;
                    else
                        this.resizedflipH = this.originalFlipH;


                    _new_resize_half_width = this.resizedExtX*0.5;
                    _new_resize_half_height = this.resizedExtY*0.5;
                    if(this.resizedflipH !== this.originalFlipH)
                    {
                        _new_used_half_width = -_new_resize_half_width;
                    }

                    else
                    {
                        _new_used_half_width = _new_resize_half_width;
                    }

                    if(this.resizedflipV !== this.originalFlipV)
                    {
                        _new_used_half_height = -_new_resize_half_height;
                    }
                    else
                    {
                        _new_used_half_height = _new_resize_half_height;
                    }

                    this.resizedPosX = this.fixedPointX + (_new_used_half_width*_cos + _new_used_half_height*_sin) - _new_resize_half_width;
                    this.resizedPosY = this.fixedPointY + (_new_used_half_width*_sin - _new_used_half_height*_cos) - _new_resize_half_height;
                    break;
                }

                case 4:
                case 5:
                {
                    if(this.translatetNumberHandle === 4)
                    {
                        _real_width = this.usedExtX*kd1;
                        _abs_width = Math.abs(_real_width);
                        this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_width : MIN_SHAPE_SIZE;
                        if(_real_width < 0)
                            this.resizedflipH = !this.originalFlipH;
                        else
                            this.resizedflipH = this.originalFlipH;
                    }
                    else
                    {
                        _temp = kd2;
                        kd2 = kd1;
                        kd1 = _temp;
                    }

                    _real_height = this.usedExtY*kd2;
                    _abs_height = Math.abs(_real_height);
                    this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_height : MIN_SHAPE_SIZE;
                    if(_real_height < 0)
                        this.resizedflipV = !this.originalFlipV;
                    else
                        this.resizedflipV = this.originalFlipV;

                    _new_resize_half_width = this.resizedExtX*0.5;
                    _new_resize_half_height = this.resizedExtY*0.5;
                    if(this.resizedflipH !== this.originalFlipH)
                    {
                        _new_used_half_width = -_new_resize_half_width;
                    }
                    else
                    {
                        _new_used_half_width = _new_resize_half_width;
                    }

                    if(this.resizedflipV !== this.originalFlipV)
                    {
                        _new_used_half_height = -_new_resize_half_height;
                    }
                    else
                    {
                        _new_used_half_height = _new_resize_half_height;
                    }

                    this.resizedPosX = this.fixedPointX + (_new_used_half_width*_cos - _new_used_half_height*_sin) - _new_resize_half_width;
                    this.resizedPosY = this.fixedPointY + (_new_used_half_width*_sin + _new_used_half_height*_cos) - _new_resize_half_height;

                    break;
                }

                case 6:
                case 7:
                {
                    if(this.translatetNumberHandle === 6)
                    {
                        _real_height = this.usedExtY*kd1;
                        _abs_height = Math.abs(_real_height);
                        this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_height : MIN_SHAPE_SIZE;
                        if(_real_height < 0)
                            this.resizedflipV = !this.originalFlipV;
                        else
                            this.resizedflipV = this.originalFlipV;
                    }
                    else
                    {
                        _temp = kd2;
                        kd2 = kd1;
                        kd1 = _temp;
                    }

                    _real_width = this.usedExtX*kd2;
                    _abs_width = Math.abs(_real_width);
                    this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_width : MIN_SHAPE_SIZE;
                    if(_real_width < 0)
                        this.resizedflipH = !this.originalFlipH;
                    else
                        this.resizedflipH = this.originalFlipH;

                    _new_resize_half_width = this.resizedExtX*0.5;
                    _new_resize_half_height = this.resizedExtY*0.5;
                    if(this.resizedflipH !== this.originalFlipH)
                    {
                        _new_used_half_width = -_new_resize_half_width;
                    }
                    else
                    {
                        _new_used_half_width = _new_resize_half_width;
                    }

                    if(this.resizedflipV !== this.originalFlipV)
                    {
                        _new_used_half_height = -_new_resize_half_height;
                    }
                    else
                    {
                        _new_used_half_height = _new_resize_half_height;
                    }

                    this.resizedPosX = this.fixedPointX + (-_new_used_half_width*_cos - _new_used_half_height*_sin) - _new_resize_half_width;
                    this.resizedPosY = this.fixedPointY + (-_new_used_half_width*_sin + _new_used_half_height*_cos) - _new_resize_half_height;
                    break;
                }
            }


            this.x = this.resizedPosX;
            this.y = this.resizedPosY;
            this.extX = this.resizedExtX;
            this.extY = this.resizedExtY;
            this.flipH = this.resizedflipH;
            this.flipV = this.resizedflipV;
            var _transform = this.transform;
            _transform.Reset();

            var _horizontal_center = this.resizedExtX*0.5;
            var _vertical_center = this.resizedExtY*0.5;
            global_MatrixTransformer.TranslateAppend(_transform, -_horizontal_center, -_vertical_center);

            if(this.resizedflipH)
            {
                global_MatrixTransformer.ScaleAppend(_transform, -1, 1);
            }
            if(this.resizedflipV)
            {
                global_MatrixTransformer.ScaleAppend(_transform, 1, -1);
            }

            global_MatrixTransformer.RotateRadAppend(_transform, -this.resizedRot);


            global_MatrixTransformer.TranslateAppend(_transform, this.resizedPosX, this.resizedPosY);
            global_MatrixTransformer.TranslateAppend(_transform, _horizontal_center, _vertical_center);




            var originalExtX, originalExtY;
            if(AscFormat.isRealNumber(this.original.extX) && AscFormat.isRealNumber(this.original.extY)){
                originalExtX = this.original.extX;
                originalExtY = this.original.extY;
                if(AscFormat.fApproxEqual(0.0, originalExtX)){
                    originalExtX = 1;
                }
                if(AscFormat.fApproxEqual(0.0, originalExtY)){
                    originalExtY = 1;
                }
            }
            else {
                var xfrm = this.original.spPr.xfrm;
                if(xfrm){
                    originalExtX = xfrm.extX;
                    originalExtY = xfrm.extY;
                }

                if(!AscFormat.isRealNumber(originalExtX)){
                    originalExtX = 1;
                }
                if(!AscFormat.isRealNumber(originalExtY)){
                    originalExtY = 1;
                }
            }

            if(AscFormat.fApproxEqual(0.0, originalExtX)){
                originalExtX = 1;
            }
            if(AscFormat.fApproxEqual(0.0, originalExtY)){
                originalExtY = 1;
            }
            var kw = this.resizedExtX/originalExtX;
            var kh = this.resizedExtY/originalExtY;
            for(var i = 0; i < this.childs.length; ++i)
            {
                var cur_child = this.childs[i];
                cur_child.updateSize(kw, kh);
            }

        };

        this.resizeRelativeCenter = function(kd1, kd2, ShiftKey)
        {
            kd1 = 2*kd1 - 1;
            kd2 = 2*kd2 - 1;
            var _real_height, _real_width;
            var _abs_height, _abs_width;

            var isCrop = (this.originalObject.isCrop || !!this.originalObject.cropObject);
            if((ShiftKey === true || window.AscAlwaysSaveAspectOnResizeTrack === true || (!isCrop && this.originalObject.getNoChangeAspect())) && this.bAspect === true)
            {
                var _new_aspect = this.aspect*(Math.abs(kd1/ kd2));

                if (_new_aspect >= this.aspect)
                    kd2 = Math.abs(kd1)*(kd2 >= 0 ? 1 : -1 );
                else
                    kd1 = Math.abs(kd2)*(kd1 >= 0 ? 1 : -1);
            }

            var _temp;
            if(this.bChangeCoef)
            {
                _temp = kd1;
                kd1 = kd2;
                kd2 = _temp;
            }
            if(this.mod === 0 || this.mod === 1)
            {
                if(this.mod === 0)
                {
                    _real_width = this.usedExtX*kd1;
                    _abs_width = Math.abs(_real_width);
                    this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_width : MIN_SHAPE_SIZE;
                    this.resizedflipH  = _real_width < 0 ? !this.originalFlipH : this.originalFlipH;

                }
                else
                {
                    _temp = kd1;
                    kd1 = kd2;
                    kd2 = _temp;
                }

                _real_height = this.usedExtY*kd2;
                _abs_height = Math.abs(_real_height);
                this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_height : MIN_SHAPE_SIZE;
                this.resizedflipV  = _real_height < 0 ? !this.originalFlipV : this.originalFlipV;


            }
            else
            {
                if(this.mod === 2)
                {
                    _temp = kd1;
                    kd1 = kd2;
                    kd2 = _temp;

                    _real_height = this.usedExtY*kd2;
                    _abs_height = Math.abs(_real_height);
                    this.resizedExtY = _abs_height >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_height : MIN_SHAPE_SIZE;
                    this.resizedflipV  = _real_height < 0 ? !this.originalFlipV : this.originalFlipV;

                }
                _real_width = this.usedExtX*kd1;
                _abs_width = Math.abs(_real_width);
                this.resizedExtX = _abs_width >= MIN_SHAPE_SIZE || this.lineFlag ? _abs_width : MIN_SHAPE_SIZE;
                this.resizedflipH  = _real_width < 0 ? !this.originalFlipH : this.originalFlipH;

            }

            this.resizedPosX = this.centerPointX - this.resizedExtX*0.5;
            this.resizedPosY = this.centerPointY - this.resizedExtY*0.5;


            this.x = this.resizedPosX;
            this.y = this.resizedPosY;
            this.extX = this.resizedExtX;
            this.extY = this.resizedExtY;
            this.flipH = this.resizedflipH;
            this.flipV = this.resizedflipV;

            var _transform = this.transform;
            _transform.Reset();

            var _horizontal_center = this.resizedExtX*0.5;
            var _vertical_center = this.resizedExtY*0.5;
            global_MatrixTransformer.TranslateAppend(_transform, -_horizontal_center, -_vertical_center);

            if(this.resizedflipH)
            {
                global_MatrixTransformer.ScaleAppend(_transform, -1, 1);
            }
            if(this.resizedflipV)
            {
                global_MatrixTransformer.ScaleAppend(_transform, 1, -1);
            }

            global_MatrixTransformer.RotateRadAppend(_transform, -this.resizedRot);


            global_MatrixTransformer.TranslateAppend(_transform, this.resizedPosX, this.resizedPosY);
            global_MatrixTransformer.TranslateAppend(_transform, _horizontal_center, _vertical_center);


            var xfrm = this.original.spPr.xfrm;
            var kw = this.resizedExtX/xfrm.extX;
            var kh = this.resizedExtY/xfrm.extY;
            for(var  i = 0; i< this.childs.length; ++i)
            {
                this.childs[i].updateSize(kw, kh);
            }
        };

        this.updateSize = function(kw, kh)
        {
            this.bIsTracked = true;
            var _kw, _kh;
            if(this.bSwapCoef)
            {
                _kw = kh;
                _kh = kw;
            }
            else
            {
                _kw = kw;
                _kh = kh;
            }
            var xfrm = this.original.spPr.xfrm;
            this.extX = xfrm.extX*_kw;
            this.extY = xfrm.extY*_kh;

            this.x = this.centerDistX*kw + this.parentTrack.extX*0.5 - this.extX*0.5;
            this.y = this.centerDistY*kh + this.parentTrack.extY*0.5 - this.extY*0.5;

            this.transform.Reset();
            var t = this.transform;

            global_MatrixTransformer.TranslateAppend(t, -this.extX*0.5, -this.extY*0.5);
            if(xfrm.flipH == null ? false : xfrm.flipH)
            {
                global_MatrixTransformer.ScaleAppend(t, -1, 1);
            }
            if(xfrm.flipV == null ? false : xfrm.flipV)
            {
                global_MatrixTransformer.ScaleAppend(t, 1, -1);
            }
            global_MatrixTransformer.RotateRadAppend(t, xfrm.rot == null ? 0 : -xfrm.rot);
            global_MatrixTransformer.TranslateAppend(t, this.x + this.extX*0.5, this.y+this.extY*0.5);
            global_MatrixTransformer.MultiplyAppend(t, this.parentTrack.transform);
            for(var i = 0; i < this.childs.length; ++i)
            {
                this.childs[i].updateSize(_kw, _kh);
            }
        };

        this.draw = function(graphics)
        {
            if( AscFormat.isRealNumber(this.originalObject.selectStartPage) && graphics.SetCurrentPage)
            {
                graphics.SetCurrentPage(this.originalObject.selectStartPage);
            }
            for(var  i = 0; i < this.childs.length; ++i)
            {
                this.childs[i].draw(graphics);
            }
        };
        this.getBounds = function()
        {
            var boundsChecker = new  AscFormat.CSlideBoundsChecker();
            this.draw(boundsChecker);
            var tr = this.transform;
            var arr_p_x = [];
            var arr_p_y = [];
            arr_p_x.push(tr.TransformPointX(0,0));
            arr_p_y.push(tr.TransformPointY(0,0));
            arr_p_x.push(tr.TransformPointX(this.resizedExtX,0));
            arr_p_y.push(tr.TransformPointY(this.resizedExtX,0));
            arr_p_x.push(tr.TransformPointX(this.resizedExtX,this.resizedExtY));
            arr_p_y.push(tr.TransformPointY(this.resizedExtX,this.resizedExtY));
            arr_p_x.push(tr.TransformPointX(0,this.resizedExtY));
            arr_p_y.push(tr.TransformPointY(0,this.resizedExtY));

            arr_p_x.push(boundsChecker.Bounds.min_x);
            arr_p_x.push(boundsChecker.Bounds.max_x);
            arr_p_y.push(boundsChecker.Bounds.min_y);
            arr_p_y.push(boundsChecker.Bounds.max_y);

            boundsChecker.Bounds.min_x = Math.min.apply(Math, arr_p_x);
            boundsChecker.Bounds.max_x = Math.max.apply(Math, arr_p_x);
            boundsChecker.Bounds.min_y = Math.min.apply(Math, arr_p_y);
            boundsChecker.Bounds.max_y = Math.max.apply(Math, arr_p_y);


            boundsChecker.Bounds.posX = this.resizedPosX;
            boundsChecker.Bounds.posY = this.resizedPosY;

            boundsChecker.Bounds.extX = this.resizedExtX;
            boundsChecker.Bounds.extY = this.resizedExtY;

            return boundsChecker.Bounds;
        };



        this.trackEnd = function(bWord)
        {
            if(!this.bIsTracked){
                return;
            }
            if(!AscCommon.isRealObject(this.original.group))
            {
                this.original.normalize();
            }

            if(!this.original.spPr)
            {
                this.original.setSpPr(new AscFormat.CSpPr());
            }
            if(!this.original.spPr.xfrm)
            {
                this.original.spPr.setXfrm(new AscFormat.CXfrm());
                this.original.spPr.xfrm.setParent(this.original.spPr);
            }
            var xfrm = this.original.spPr.xfrm;

            if(bWord)
            {
                this.x = 0;
                this.y = 0;
            }
            xfrm.setOffX(this.x);
            xfrm.setOffY(this.y);
            xfrm.setExtX(this.extX);
            xfrm.setExtY(this.extY);
            xfrm.setChExtX(this.extX);
            xfrm.setChExtY(this.extY);
            xfrm.setFlipH(this.flipH);
            xfrm.setFlipV(this.flipV);
            for(var i = 0; i < this.childs.length; ++i)
            {
                this.childs[i].trackEnd();
            }
            this.original.checkDrawingBaseCoords();

            AscFormat.CheckShapeBodyAutoFitReset(this.original);


        };
    }, this, []);


}

function ShapeForResizeInGroup(originalObject, parentTrack)
{
    AscFormat.ExecuteNoHistory(function()
    {
        this.originalObject = originalObject;
        this.parentTrack = parentTrack;
        this.x = originalObject.x;
        this.y = originalObject.y;
        this.extX = originalObject.extX;
        this.extY = originalObject.extY;
        this.rot = originalObject.rot;
        this.flipH = originalObject.flipH;
        this.flipV = originalObject.flipV;
        this.transform = originalObject.transform.CreateDublicate();
        this.bSwapCoef = !(AscFormat.checkNormalRotate(this.rot));
        this.centerDistX = this.x + this.extX*0.5 - this.parentTrack.extX*0.5;
        this.centerDistY = this.y + this.extY*0.5 - this.parentTrack.extY*0.5;

        this.geometry = AscFormat.ExecuteNoHistory(function(){ return originalObject.getGeom().createDuplicate();}, this, []);
        if(this.geometry)
        {
            this.geometry.Recalculate(this.extX, this.extY);
        }
        var brush;
        if(originalObject.blipFill)
        {
            brush = new AscFormat.CUniFill();
            brush.fill = originalObject.blipFill;
        }
        else
        {
            brush = originalObject.brush;
        }
        this.overlayObject = new AscFormat.OverlayObject(this.geometry, this.extX, this.extY, brush, originalObject.pen, this.transform);
        this.updateSize = function(kw, kh)
        {
            var _kw, _kh;
            if(this.bSwapCoef)
            {
                _kw = kh;
                _kh = kw;
            }
            else
            {
                _kw = kw;
                _kh = kh;
            }

            this.extX = this.originalObject.extX*_kw;
            this.extY = this.originalObject.extY*_kh;

            this.x = this.centerDistX*kw + this.parentTrack.extX*0.5 - this.extX*0.5;
            this.y = this.centerDistY*kh + this.parentTrack.extY*0.5 - this.extY*0.5;

           //if(this.geometry)
           //{
           //    this.geometry.Recalculate(this.extX, this.extY);
           //}
            this.overlayObject.updateExtents(this.extX, this.extY);
            this.transform.Reset();
            var t = this.transform;

            global_MatrixTransformer.TranslateAppend(t, -this.extX*0.5, -this.extY*0.5);
            if(this.flipH)
            {
                global_MatrixTransformer.ScaleAppend(t, -1, 1);
            }
            if(this.flipV)
            {
                global_MatrixTransformer.ScaleAppend(t, 1, -1);
            }
            global_MatrixTransformer.RotateRadAppend(t, -this.rot);
            global_MatrixTransformer.TranslateAppend(t, this.x + this.extX*0.5, this.y+this.extY*0.5);
            global_MatrixTransformer.MultiplyAppend(t, this.parentTrack.transform);
        };

        this.draw = function(overlay)
        {
            this.overlayObject.draw(overlay);
        };

        this.getBounds = function()
        {
            var bounds_checker = new  AscFormat.CSlideBoundsChecker();
            bounds_checker.init(Page_Width, Page_Height, Page_Width, Page_Height);
            this.draw(bounds_checker);
            return {l: bounds_checker.Bounds.min_x, t: bounds_checker.Bounds.min_y, r: bounds_checker.Bounds.max_x , b: bounds_checker.Bounds.max_y};
        };

        this.trackEnd = function()
        {

            if(!this.originalObject.spPr.xfrm)
            {
                this.originalObject.spPr.setXfrm(new AscFormat.CXfrm());
                this.originalObject.spPr.xfrm.setParent(this.originalObject.spPr);
            }
            var xfrm = this.originalObject.spPr.xfrm;
            xfrm.setOffX(this.x);
            xfrm.setOffY(this.y);
            xfrm.setExtX(this.extX);
            xfrm.setExtY(this.extY);

            AscFormat.CheckShapeBodyAutoFitReset(this.originalObject);
        };

        this.updateTransform = function()
        {
            this.transform.Reset();
            var t = this.transform;

            global_MatrixTransformer.TranslateAppend(t, -this.extX*0.5, -this.extY*0.5);
            if(this.flipH)
            {
                global_MatrixTransformer.ScaleAppend(t, -1, 1);
            }
            if(this.flipV)
            {
                global_MatrixTransformer.ScaleAppend(t, 1, -1);
            }
            global_MatrixTransformer.RotateRadAppend(t, -this.rot);
            global_MatrixTransformer.TranslateAppend(t, this.x + this.extX*0.5, this.y+this.extY*0.5);
            if(this.parentTrack)
                global_MatrixTransformer.MultiplyAppend(t, this.parentTrack.transform);
        };
    }, this, []);
}

    //--------------------------------------------------------export----------------------------------------------------
    window['AscFormat'] = window['AscFormat'] || {};
    window['AscFormat'].SHAPE_EXT = SHAPE_EXT;
    window['AscFormat'].CreatePenBrushForChartTrack = CreatePenBrushForChartTrack;
    window['AscFormat'].ResizeTrackShapeImage = ResizeTrackShapeImage;
    window['AscFormat'].ResizeTrackGroup = ResizeTrackGroup;
})(window);
