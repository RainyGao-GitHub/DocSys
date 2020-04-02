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
var CShape = AscFormat.CShape;
var CImageShape = AscFormat.CImageShape;

CImageShape.prototype.addToDrawingObjects =  CShape.prototype.addToDrawingObjects;
CImageShape.prototype.setDrawingObjects = CShape.prototype.setDrawingObjects;
CImageShape.prototype.setDrawingBase = CShape.prototype.setDrawingBase;
CImageShape.prototype.deleteDrawingBase = CShape.prototype.deleteDrawingBase;
CImageShape.prototype.addToRecalculate = CShape.prototype.addToRecalculate;
CImageShape.prototype.convertPixToMM = CShape.prototype.convertPixToMM;
CImageShape.prototype.getCanvasContext = CShape.prototype.getCanvasContext;
CImageShape.prototype.getHierarchy = CShape.prototype.getHierarchy;
CImageShape.prototype.getParentObjects = CShape.prototype.getParentObjects;
CImageShape.prototype.recalculateTransform = CShape.prototype.recalculateTransform;
CImageShape.prototype.recalculateBounds = CShape.prototype.recalculateBounds;
CImageShape.prototype.deselect = CShape.prototype.deselect;
CImageShape.prototype.hitToHandles = CShape.prototype.hitToHandles;
CImageShape.prototype.hitInBoundingRect = CShape.prototype.hitInBoundingRect;
CImageShape.prototype.getRotateAngle = CShape.prototype.getRotateAngle;
CImageShape.prototype.setWorksheet = CShape.prototype.setWorksheet;
CImageShape.prototype.getDrawingObjectsController = CShape.prototype.getDrawingObjectsController;
CImageShape.prototype.Is_UseInDocument = CShape.prototype.Is_UseInDocument;
    CImageShape.prototype.getEditorType = function()
    {
        return 0;
    };
CImageShape.prototype.setRecalculateInfo = function()
{
    this.recalcInfo =
    {
        recalculateBrush:          true,
        recalculatePen:            true,
        recalculateTransform:      true,
        recalculateBounds:         true,
        recalculateGeometry:       true,
        recalculateStyle:          true,
        recalculateFill:           true,
        recalculateLine:           true,
        recalculateTransparent:    true
    };
    this.lockType = AscCommon.c_oAscLockTypes.kLockTypeNone;
};

    CImageShape.prototype.checkNeedRecalculate = function(){
        return this.recalcInfo.recalculateTransform === true;
    };

CImageShape.prototype.recalcBrush = function()
{
    this.recalcInfo.recalculateBrush = true;
};

CImageShape.prototype.recalcPen = function()
{
    this.recalcInfo.recalculatePen = true;
};
CImageShape.prototype.recalcTransform = function()
{
    this.recalcInfo.recalculateTransform = true;
};
CImageShape.prototype.recalcBounds = function()
{
    this.recalcInfo.recalculateBounds = true;
};
CImageShape.prototype.recalcGeometry = function()
{
    this.recalcInfo.recalculateGeometry = true;
};
CImageShape.prototype.recalcStyle = function()
{
    this.recalcInfo.recalculateStyle = true;
};
CImageShape.prototype.recalcFill = function()
{
    this.recalcInfo.recalculateFill = true;
};
CImageShape.prototype.recalcLine = function()
{
    this.recalcInfo.recalculateLine = true;
};
CImageShape.prototype.recalcTransparent = function()
{
    this.recalcInfo.recalculateTransparent = true;
};
CImageShape.prototype.handleUpdatePosition = function()
{
    this.recalcTransform();
	this.recalcBounds();
    this.addToRecalculate();
};
CImageShape.prototype.handleUpdateExtents = function()
{
    this.recalcGeometry();
    this.recalcBounds();
    this.recalcTransform();
    this.addToRecalculate();
};
CImageShape.prototype.handleUpdateRot = function()
{
    this.recalcTransform();
    this.recalcBounds();
    this.addToRecalculate();
};
CImageShape.prototype.handleUpdateFlip = function()
{
    this.recalcTransform();
    this.addToRecalculate();
};
CImageShape.prototype.handleUpdateFill = function()
{
    this.recalcBrush();
    this.addToRecalculate();
};
CImageShape.prototype.handleUpdateGeometry = function()
{
	this.recalcBounds();
    this.recalcGeometry();
    this.addToRecalculate();
};
CImageShape.prototype.convertPixToMM = CShape.prototype.convertPixToMM;
CImageShape.prototype.getCanvasContext = CShape.prototype.getCanvasContext;
CImageShape.prototype.getCompiledStyle = CShape.prototype.getCompiledStyle;
CImageShape.prototype.getHierarchy = CShape.prototype.getHierarchy;
CImageShape.prototype.getParentObjects = CShape.prototype.getParentObjects;
CImageShape.prototype.recalculate = function () 
{
    if(this.bDeleted)
        return;
    AscFormat.ExecuteNoHistory(function(){
        var bRecalcShadow = this.recalcInfo.recalculateBrush ||
            this.recalcInfo.recalculatePen ||
            this.recalcInfo.recalculateTransform ||
            this.recalcInfo.recalculateGeometry ||
            this.recalcInfo.recalculateBounds;
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
    if(this.recalcInfo.recalculateBounds)
    {
        this.recalculateBounds();
        this.recalcInfo.recalculateBounds = false;
    }
    if(bRecalcShadow)
    {
        this.recalculateShdw();
    }
    this.clearCropObject();
    }, this, []);
};
CImageShape.prototype.recalculateBounds = CShape.prototype.recalculateBounds;
CImageShape.prototype.hitInInnerArea = CShape.prototype.hitInInnerArea;
CImageShape.prototype.hitInPath = CShape.prototype.hitInPath;
CImageShape.prototype.hitToHandles = CShape.prototype.hitToHandles;
CImageShape.prototype.hitInBoundingRect = CShape.prototype.hitInBoundingRect;
CImageShape.prototype.check_bounds = CShape.prototype.check_bounds;


    CImageShape.prototype.Clear_ContentChanges = function(){
        if(this.worksheet && this.worksheet.contentChanges){
            this.worksheet.contentChanges.Clear();
        }
    };

    CImageShape.prototype.Add_ContentChanges = function(Changes){
        if(this.worksheet && this.worksheet.contentChanges){
            this.worksheet.contentChanges.Add( Changes );
        }
    };

    CImageShape.prototype.Refresh_ContentChanges = function(){
        if(this.worksheet && this.worksheet.contentChanges){
            this.worksheet.contentChanges.Refresh();
        }
    };

})(window);
