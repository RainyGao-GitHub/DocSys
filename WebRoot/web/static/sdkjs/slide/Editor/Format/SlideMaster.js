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
var History = AscCommon.History;


 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterSetThemeIndex]     = AscDFH.CChangesDrawingsLong            ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterSetSize]           = AscDFH.CChangesDrawingsObjectNoId      ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterSetTheme]          = AscDFH.CChangesDrawingsObject          ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterAddToSpTree]       = AscDFH.CChangesDrawingsContent         ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterSetBg]             = AscDFH.CChangesDrawingsObjectNoId      ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterSetTxStyles]       = AscDFH.CChangesDrawingsObjectNoId      ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterSetCSldName]       = AscDFH.CChangesDrawingsString          ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterSetClrMapOverride] = AscDFH.CChangesDrawingsObject          ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterSetHF]             = AscDFH.CChangesDrawingsObject          ;
 AscDFH.changesFactory[AscDFH.historyitem_SlideMasterAddLayout]         = AscDFH.CChangesDrawingsContent         ;

 AscDFH.drawingsChangesMap[AscDFH.historyitem_SlideMasterSetThemeIndex]     = function(oClass, value){oClass.ThemeIndex = value;};
 AscDFH.drawingsChangesMap[AscDFH.historyitem_SlideMasterSetSize]           = function(oClass, value){oClass.Width = value.a; oClass.Height = value.b;};
 AscDFH.drawingsChangesMap[AscDFH.historyitem_SlideMasterSetTheme]          = function(oClass, value){oClass.Theme = value;};

 AscDFH.drawingsChangesMap[AscDFH.historyitem_SlideMasterSetBg]             = function(oClass, value, FromLoad){
     oClass.cSld.Bg = value;
     if(FromLoad){
         var Fill;
         if(oClass.cSld.Bg && oClass.cSld.Bg.bgPr && oClass.cSld.Bg.bgPr.Fill)
         {
             Fill = oClass.cSld.Bg.bgPr.Fill;
         }
         if(typeof AscCommon.CollaborativeEditing !== "undefined")
         {
             if(Fill && Fill.fill && Fill.fill.type === Asc.c_oAscFill.FILL_TYPE_BLIP && typeof Fill.fill.RasterImageId === "string" && Fill.fill.RasterImageId.length > 0)
             {
                 AscCommon.CollaborativeEditing.Add_NewImage(Fill.fill.RasterImageId);
             }
         }
     }
 };
 AscDFH.drawingsChangesMap[AscDFH.historyitem_SlideMasterSetTxStyles]       = function(oClass, value){oClass.txStyles = value;};
 AscDFH.drawingsChangesMap[AscDFH.historyitem_SlideMasterSetCSldName]       = function(oClass, value){oClass.cSld.name = value;};
 AscDFH.drawingsChangesMap[AscDFH.historyitem_SlideMasterSetClrMapOverride] = function(oClass, value){oClass.clrMap = value;};
 AscDFH.drawingsChangesMap[AscDFH.historyitem_SlideMasterSetHF]             = function(oClass, value){oClass.hf = value;};


AscDFH.drawingsConstructorsMap[AscDFH.historyitem_SlideMasterSetSize]      = AscFormat.CDrawingBaseCoordsWritable;
AscDFH.drawingsConstructorsMap[AscDFH.historyitem_SlideMasterSetBg]        = AscFormat.CBg;
AscDFH.drawingsConstructorsMap[AscDFH.historyitem_SlideMasterSetTxStyles]  = AscFormat.CTextStyles;


AscDFH.drawingContentChanges[AscDFH.historyitem_SlideMasterAddToSpTree]       = function(oClass){return oClass.cSld.spTree;};
AscDFH.drawingContentChanges[AscDFH.historyitem_SlideMasterAddLayout]         = function(oClass){return oClass.sldLayoutLst;};


function MasterSlide(presentation, theme)
{
    this.cSld = new AscFormat.CSld();
    this.clrMap = new AscFormat.ClrMap();

    this.hf = null;

    this.sldLayoutLst = [];

    this.txStyles = null;
    this.preserve = false;

    this.ImageBase64 = "";
    this.Width64 = 0;
    this.Height64 = 0;

    this.ThemeIndex = 0;

    // pointers
    this.Theme = null;
    this.TableStyles = null;
    this.Vml = null;

    this.Width = 254;
    this.Height = 190.5;
    this.recalcInfo = {};
    this.DrawingDocument = editor.WordControl.m_oDrawingDocument;
    this.maxId = 1000;
    this.m_oContentChanges = new AscCommon.CContentChanges(); // список изменений(добавление/удаление элементов)

    this.bounds = new AscFormat.CGraphicBounds(0, 0, this.Width, this.Height);

//----------------------------------------------
    this.presentation = editor.WordControl.m_oLogicDocument;
    this.theme = theme;

    this.kind = AscFormat.TYPE_KIND.MASTER;
    this.recalcInfo =
    {
        recalculateBackground: true,
        recalculateSpTree: true,
        recalculateBounds: true

    };


    this.lastRecalcSlideIndex = -1;
    this.Id = AscCommon.g_oIdCounter.Get_NewId();
    AscCommon.g_oTableId.Add(this, this.Id);
}

MasterSlide.prototype =
    {
        addLayout: function (layout) {
            this.addToSldLayoutLstToPos(this.sldLayoutLst.length, layout);
        },

        getObjectType: function () {
            return AscDFH.historyitem_type_SlideMaster;
        },

        setThemeIndex: function (index) {
            History.Add(new AscDFH.CChangesDrawingsLong(this, AscDFH.historyitem_SlideMasterSetThemeIndex, this.ThemeIndex, index));
            this.ThemeIndex = index;
        },

        Write_ToBinary2: function (w) {
            w.WriteLong(AscDFH.historyitem_type_SlideMaster);
            w.WriteString2(this.Id);
            AscFormat.writeObject(w, this.theme);
        },

        Read_FromBinary2: function (r) {
            this.Id = r.GetString2();
            this.theme = AscFormat.readObject(r);
        },

        draw: function (graphics, slide) {
            if(slide){
                if(slide.num !== this.lastRecalcSlideIndex){
                    this.lastRecalcSlideIndex = slide.num;
                    this.handleAllContents(function (oContent) {
                        if(oContent){
                            if(oContent.AllFields && oContent.AllFields.length > 0){
                                for(var j = 0; j < oContent.AllFields.length; j++){
                                    oContent.AllFields[j].RecalcInfo.Measure = true;
                                    oContent.AllFields[j].Refresh_RecalcData2();
                                }
                            }
                        }
                    });
                    this.recalculate();

                }
            }
            for (var i = 0; i < this.cSld.spTree.length; ++i) {
                if (this.cSld.spTree[i].isPlaceholder && !this.cSld.spTree[i].isPlaceholder())
                    this.cSld.spTree[i].draw(graphics);
            }
        },

        getMatchingLayout: function (type, matchingName, cSldName, themeFlag) {
            var layoutType = type;

            var _layoutName = null, _layout_index, _layout;

            if (type === AscFormat.nSldLtTTitle && !(themeFlag === true)) {
                layoutType = AscFormat.nSldLtTObj;
            }
            if (layoutType != null) {
                for (var i = 0; i < this.sldLayoutLst.length; ++i) {
                    if (this.sldLayoutLst[i].type == layoutType) {
                        return this.sldLayoutLst[i];
                    }
                }
            }

            if (type === AscFormat.nSldLtTTitle && !(themeFlag === true)) {
                layoutType = AscFormat.nSldLtTTx;
                for (i = 0; i < this.sldLayoutLst.length; ++i) {
                    if (this.sldLayoutLst[i].type == layoutType) {
                        return this.sldLayoutLst[i];
                    }
                }
            }


            if (matchingName != "" && matchingName != null) {
                _layoutName = matchingName;
            }
            else {
                if (cSldName != "" && cSldName != null) {
                    _layoutName = cSldName;
                }
            }
            if (_layoutName != null) {
                var _layout_name;
                for (_layout_index = 0; _layout_index < this.sldLayoutLst.length; ++_layout_index) {
                    _layout = this.sldLayoutLst[_layout_index];
                    _layout_name = null;

                    if (_layout.matchingName != null && _layout.matchingName != "") {
                        _layout_name = _layout.matchingName;
                    }
                    else {
                        if (_layout.cSld.name != null && _layout.cSld.name != "") {
                            _layout_name = _layout.cSld.name;
                        }
                    }
                    if (_layout_name == _layoutName) {
                        return _layout;
                    }
                }
            }
            for (_layout_index = 0; _layout_index < this.sldLayoutLst.length; ++_layout_index) {
                _layout = this.sldLayoutLst[_layout_index];
                _layout_name = null;

                if (_layout.type != AscFormat.nSldLtTTitle) {
                    return _layout;
                }

            }

            return this.sldLayoutLst[0];
        },

        handleAllContents: Slide.prototype.handleAllContents,
        getMatchingShape: Slide.prototype.getMatchingShape, /*function(type, idx, bSingleBody)
    {
        var _input_reduced_type;
        if(type == null)
        {
            _input_reduced_type = AscFormat.phType_body;
        }
        else
        {
            if(type == AscFormat.phType_ctrTitle)
            {
                _input_reduced_type = AscFormat.phType_title;
            }
            else
            {
                _input_reduced_type = type;
            }
        }

        var _input_reduced_index;
        if(idx == null)
        {
            _input_reduced_index = 0;
        }
        else
        {
            _input_reduced_index = idx;
        }


        var _sp_tree = this.cSld.spTree;
        var _shape_index;
        var _index, _type;
        var _final_index, _final_type;
        var _glyph;
        var body_count = 0;
        var last_body;
        for(_shape_index = 0; _shape_index < _sp_tree.length; ++_shape_index)
        {
            _glyph = _sp_tree[_shape_index];
            if(_glyph.isPlaceholder())
            {
                if(_glyph instanceof CShape)
                {
                    _index = _glyph.nvSpPr.nvPr.ph.idx;
                    _type = _glyph.nvSpPr.nvPr.ph.type;
                }
                if(_glyph instanceof CImageShape)
                {
                    _index = _glyph.nvPicPr.nvPr.ph.idx;
                    _type = _glyph.nvPicPr.nvPr.ph.type;
                }
                if(_glyph instanceof  CGroupShape)
                {
                    _index = _glyph.nvGrpSpPr.nvPr.ph.idx;
                    _type = _glyph.nvGrpSpPr.nvPr.ph.type;
                }
                if(_type == null)
                {
                    _final_type = AscFormat.phType_body;
                }
                else
                {
                    if(_type == AscFormat.phType_ctrTitle)
                    {
                        _final_type = AscFormat.phType_title;
                    }
                    else
                    {
                        _final_type = _type;
                    }
                }

                if(_index == null)
                {
                    _final_index = 0;
                }
                else
                {
                    _final_index = _index;
                }

                if(_input_reduced_type == _final_type && _input_reduced_index == _final_index)
                {
                    return _glyph;
                }
                if(_input_reduced_type == AscFormat.phType_title && _input_reduced_type == _final_type)
                {
                    return _glyph;
                }
                if(AscFormat.phType_body === _type)
                {
                    ++body_count;
                    last_body = _glyph;
                }
            }
        }


        if(_input_reduced_type == AscFormat.phType_sldNum || _input_reduced_type == AscFormat.phType_dt || _input_reduced_type == AscFormat.phType_ftr || _input_reduced_type == AscFormat.phType_hdr)
        {
            for(_shape_index = 0; _shape_index < _sp_tree.length; ++_shape_index)
            {
                _glyph = _sp_tree[_shape_index];
                if(_glyph.isPlaceholder())
                {
                    if(_glyph instanceof CShape)
                    {
                        _type = _glyph.nvSpPr.nvPr.ph.type;
                    }
                    if(_glyph instanceof CImageShape)
                    {
                        _type = _glyph.nvPicPr.nvPr.ph.type;
                    }
                    if(_glyph instanceof  CGroupShape)
                    {
                        _type = _glyph.nvGrpSpPr.nvPr.ph.type;
                    }

                    if(_input_reduced_type == _type)
                    {
                        return _glyph;
                    }
                }
            }
        }

        if(body_count === 1 && type === AscFormat.phType_body  && bSingleBody)
        {
            return last_body;
        }
        return null;
    },        */

        recalculate: function () {
            var _shapes = this.cSld.spTree;
            var _shape_index;
            var _shape_count = _shapes.length;
            var bRecalculateBounds = this.recalcInfo.recalculateBounds;
            if (bRecalculateBounds) {
                this.bounds.reset(this.Width + 100.0, this.Height + 100.0, -100.0, -100.0);
            }
            var bChecked = false;
            for (_shape_index = 0; _shape_index < _shape_count; ++_shape_index) {
                if (!_shapes[_shape_index].isPlaceholder()) {
                    _shapes[_shape_index].recalculate();
                    if (bRecalculateBounds) {
                        this.bounds.checkByOther(_shapes[_shape_index].bounds);
                    }
                    bChecked = true;
                }
            }
            if (bRecalculateBounds) {
                if (bChecked) {
                    this.bounds.checkWH();
                }
                else {
                    this.bounds.reset(0.0, 0.0, 0.0, 0.0);
                }
                this.recalcInfo.recalculateBounds = false;
            }


        },

        checkSlideSize: Slide.prototype.checkSlideSize,
        checkDrawingUniNvPr: Slide.prototype.checkDrawingUniNvPr,
        checkSlideColorScheme: function () {
            this.recalcInfo.recalculateSpTree = true;
            this.recalcInfo.recalculateBackground = true;
            for (var i = 0; i < this.cSld.spTree.length; ++i) {
                if (!this.cSld.spTree[i].isPlaceholder()) {
                    this.cSld.spTree[i].handleUpdateFill();
                    this.cSld.spTree[i].handleUpdateLn();
                }
            }
        },

        needRecalc: function(){
            var recalcInfo = this.recalcInfo;
            return recalcInfo.recalculateBackground ||
                recalcInfo.recalculateSpTree ||
                recalcInfo.recalculateBounds;
        },

        setSlideSize: function (w, h) {
            History.Add(new AscDFH.CChangesDrawingsObjectNoId(this, AscDFH.historyitem_SlideMasterSetSize, new AscFormat.CDrawingBaseCoordsWritable(this.Width, this.Height), new AscFormat.CDrawingBaseCoordsWritable(w, h)));
            this.Width = w;
            this.Height = h;
        },

        changeSize: Slide.prototype.changeSize,

        setTheme: function (theme) {
            History.Add(new AscDFH.CChangesDrawingsObject(this, AscDFH.historyitem_SlideMasterSetTheme, this.Theme, theme));
            this.Theme = theme;
        },

        shapeAdd: function (pos, item) {
            this.checkDrawingUniNvPr(item);
            History.Add(new AscDFH.CChangesDrawingsContent(this, AscDFH.historyitem_SlideMasterAddToSpTree, pos, [item], true));
            this.cSld.spTree.splice(pos, 0, item);
        },

        changeBackground: function (bg) {
            History.Add(new AscDFH.CChangesDrawingsObjectNoId(this, AscDFH.historyitem_SlideMasterSetBg, this.cSld.Bg, bg));
            this.cSld.Bg = bg;
        },

        setHF: function(pr) {
            History.Add(new AscDFH.CChangesDrawingsObject(this, AscDFH.historyitem_SlideMasterSetHF, this.hf, pr));
            this.hf = pr;
        },

        setTxStyles: function (txStyles) {
            History.Add(new AscDFH.CChangesDrawingsObjectNoId(this, AscDFH.historyitem_SlideMasterSetTxStyles, this.txStyles, txStyles));
            this.txStyles = txStyles;
        },

        setCSldName: function (name) {
            History.Add(new AscDFH.CChangesDrawingsString(this, AscDFH.historyitem_SlideMasterSetCSldName, this.cSld.name, name));
            this.cSld.name = name;
        },
        setClMapOverride: function (clrMap) {
            History.Add(new AscDFH.CChangesDrawingsObject(this, AscDFH.historyitem_SlideMasterSetClrMapOverride, this.clrMap, clrMap));
            this.clrMap = clrMap;
        },

        addToSldLayoutLstToPos: function (pos, obj) {
            History.Add(new AscDFH.CChangesDrawingsContent(this, AscDFH.historyitem_SlideMasterAddLayout, pos, [obj], true));
            this.sldLayoutLst.splice(pos, 0, obj);
        },

        getAllImages: function (images) {
            if (this.cSld.Bg && this.cSld.Bg.bgPr && this.cSld.Bg.bgPr.Fill && this.cSld.Bg.bgPr.Fill.fill instanceof AscFormat.CBlipFill && typeof this.cSld.Bg.bgPr.Fill.fill.RasterImageId === "string") {
                images[AscCommon.getFullImageSrc2(this.cSld.Bg.bgPr.Fill.fill.RasterImageId)] = true;
            }
            for (var i = 0; i < this.cSld.spTree.length; ++i) {
                if (typeof this.cSld.spTree[i].getAllImages === "function") {
                    this.cSld.spTree[i].getAllImages(images);
                }
            }
        },

        Get_Id: function () {
            return this.Id;
        },


        Refresh_RecalcData: function () {
        },


        getAllFonts: function (fonts) {
            var i;
            if (this.Theme) {
                this.Theme.Document_Get_AllFontNames(fonts);
            }

            if (this.txStyles) {
                this.txStyles.Document_Get_AllFontNames(fonts);
            }

            for (i = 0; i < this.sldLayoutLst.length; ++i) {
                this.sldLayoutLst[i].getAllFonts(fonts);
            }

            for (i = 0; i < this.cSld.spTree.length; ++i) {
                if (typeof  this.cSld.spTree[i].getAllFonts === "function")
                    this.cSld.spTree[i].getAllFonts(fonts);
            }
        },

        createDuplicate: function (IdMap) {
            var copy = new MasterSlide(null, null);
            var oIdMap = IdMap || {};
            var oPr = new AscFormat.CCopyObjectProperties();
            oPr.idMap = oIdMap;
            var i;

            if (this.clrMap) {
                copy.setClMapOverride(this.clrMap.createDuplicate());
            }
            if (typeof this.cSld.name === "string" && this.cSld.name.length > 0) {
                copy.setCSldName(this.cSld.name);
            }
            if (this.cSld.Bg) {
                copy.changeBackground(this.cSld.Bg.createFullCopy());
            }
            if(this.hf) {
                copy.setHF(this.hf.createDuplicate());
            }
            for (i = 0; i < this.cSld.spTree.length; ++i) {
                var _copy = this.cSld.spTree[i].copy(oPr);
                oIdMap[this.cSld.spTree[i].Id] = _copy.Id;
                copy.shapeAdd(copy.cSld.spTree.length, _copy);
                copy.cSld.spTree[copy.cSld.spTree.length - 1].setParent2(copy);
            }
            if (this.txStyles) {
                copy.setTxStyles(this.txStyles.createDuplicate());
            }
            return copy;
        },
      
        Clear_ContentChanges : function()
        {
        },

        Add_ContentChanges : function(Changes)
        {
        },

        Refresh_ContentChanges : function()
        {
        },

        scale: function (kw, kh) {
            for(var i = 0; i < this.cSld.spTree.length; ++i)
            {
                this.cSld.spTree[i].changeSize(kw, kh);
            }
        }
    };


function CMasterThumbnailDrawer()
{
    this.CanvasImage    = null;
    this.IsRetina       = false;
    this.WidthMM        = 0;
    this.HeightMM       = 0;

    this.WidthPx        = 0;
    this.HeightPx       = 0;

    this.DrawingDocument = null;

    this.Draw2 = function(g, _master, use_background, use_master_shapes, params) {
        var w_px = this.WidthPx;
        var h_px = this.HeightPx;

        var _params = [
            6,  // color_w
            3,  // color_h,
            4,  // color_x
            31, // color_y
            1,  // color_delta,
            8,  // text_x
            11, // text_y (from bottom)
            18  // font_size
        ];

        if (params && params.length)
        {
            // first 2 - width & height
            for (var i = 2, len = params.length; i < len; i++) {
                _params[i - 2] = params[i];
            }
        }

        var koefScale = Math.max(w_px / 85, h_px / 38);

        var dKoefPixToMM = this.HeightMM / h_px;
        var _back_fill = null;
        var RGBA = {R:0, G:0, B:0, A:255};
        var _layout = null;
        for (var i = 0; i < _master.sldLayoutLst.length; i++) {
            if (_master.sldLayoutLst[i].type == AscFormat.nSldLtTTitle) {
                _layout = _master.sldLayoutLst[i];
                break;
            }
        }
        var _theme = _master.Theme;
        if (_layout != null && _layout.cSld.Bg != null) {
            if (null != _layout.cSld.Bg.bgPr) {
                _back_fill = _layout.cSld.Bg.bgPr.Fill;
            } else {
                if (_layout.cSld.Bg.bgRef != null) {
                    _layout.cSld.Bg.bgRef.Color.Calculate(_theme, null, _layout, _master, RGBA);
                    RGBA = _layout.cSld.Bg.bgRef.Color.RGBA;
                    _back_fill = _theme.themeElements.fmtScheme.GetFillStyle(_layout.cSld.Bg.bgRef.idx, _layout.cSld.Bg.bgRef.Color);
                }
            }
        } else {
            if (_master != null) {
                if (_master.cSld.Bg != null) {
                    if (null != _master.cSld.Bg.bgPr) {
                        _back_fill = _master.cSld.Bg.bgPr.Fill;
                    } else {
                        if (_master.cSld.Bg.bgRef != null) {
                            _master.cSld.Bg.bgRef.Color.Calculate(_theme, null, _layout, _master, RGBA);
                            RGBA = _master.cSld.Bg.bgRef.Color.RGBA;
                            _back_fill = _theme.themeElements.fmtScheme.GetFillStyle(_master.cSld.Bg.bgRef.idx, _master.cSld.Bg.bgRef.Color);
                        }
                    }
                } else {
                    _back_fill = new AscFormat.CUniFill;
                    _back_fill.fill = new AscFormat.CSolidFill;
                    _back_fill.fill.color = new AscFormat.CUniColor;
                    _back_fill.fill.color.color = new AscFormat.CRGBColor;
                    _back_fill.fill.color.color.RGBA = {R:255, G:255, B:255, A:255};
                }
            }
        }

        _master.changeSize(this.WidthMM, this.HeightMM);
        _master.recalculate();
        if (_layout)
        {
            _layout.changeSize(this.WidthMM, this.HeightMM);
            _layout.recalculate();
        }

        if (_back_fill != null) {
            _back_fill.calculate(_theme, null, _layout, _master, RGBA);
        }
        if (use_background !== false) {
            DrawBackground(g, _back_fill, this.WidthMM, this.HeightMM);
        }

        if (use_master_shapes !== false)
        {
            if (null == _layout)
            {
                if(_master.needRecalc && _master.needRecalc())
                {
                    _master.recalculate();
                }
                _master.draw(g);
            }
            else
            {
                if (_layout.showMasterSp == true || _layout.showMasterSp == undefined)
                {
                    if(_master.needRecalc && _master.needRecalc())
                    {
                        _master.recalculate();
                    }
                    _master.draw(g);
                }
                _layout.recalculate();
                _layout.draw(g);
            }
        }
        g.reset();
        var _color_w = _params[0] * dKoefPixToMM;
        var _color_h = _params[1] * dKoefPixToMM;
        var _color_x = _params[2] * dKoefPixToMM;
        var _color_y = _params[3] * dKoefPixToMM;
        var _color_delta = _params[4] * dKoefPixToMM;

        g.p_color(255, 255, 255, 255);
        g.b_color1(255, 255, 255, 255);
        g._s();
        g.rect(_color_x - _color_delta, _color_y - _color_delta, _color_w * 6 + 7 * _color_delta, _color_h + 2 * _color_delta);
        g.df();
        g._s();
        var _color = new AscFormat.CSchemeColor;
        for (var i = 0; i < 6; i++) {
            g._s();
            _color.id = i;
            _color.Calculate(_theme, null, null, _master, RGBA);
            g.b_color1(_color.RGBA.R, _color.RGBA.G, _color.RGBA.B, 255);
            g.rect(_color_x, _color_y, _color_w, _color_h);
            g.df();
            _color_x += _color_w + _color_delta;
        }
        g._s();

        var _api = this.DrawingDocument.m_oWordControl.m_oApi;
        AscFormat.ExecuteNoHistory(function(){
            var _oldTurn = _api.isViewMode;
            _api.isViewMode = true;
            _color.id = 15;
            _color.Calculate(_theme, null, null, _master, RGBA);
            var nFontSize = _params[7];
            var _textPr1 = new CTextPr;
            _textPr1.FontFamily = {Name:_theme.themeElements.fontScheme.majorFont.latin, Index:-1};
            _textPr1.RFonts.Ascii = {Name: _theme.themeElements.fontScheme.majorFont.latin, Index: -1};
            _textPr1.FontSize = nFontSize;
            _textPr1.Color = new CDocumentColor(_color.RGBA.R, _color.RGBA.G, _color.RGBA.B);
            var _textPr2 = new CTextPr;
            _textPr2.FontFamily = {Name:_theme.themeElements.fontScheme.minorFont.latin, Index:-1};
            _textPr2.RFonts.Ascii = {Name: _theme.themeElements.fontScheme.minorFont.latin, Index: -1};
            _textPr2.FontSize = nFontSize;
            _textPr2.Color = new CDocumentColor(_color.RGBA.R, _color.RGBA.G, _color.RGBA.B);
            var docContent = new CDocumentContent(editor.WordControl.m_oLogicDocument, editor.WordControl.m_oDrawingDocument, 0, 0, 1000, 1000, false, false, true);
            var par = docContent.Content[0];
            par.MoveCursorToStartPos();
            var _paraPr = new CParaPr;
            par.Pr = _paraPr;
            var parRun = new ParaRun(par);
            parRun.Set_Pr(_textPr1);
            parRun.AddText("A");
            par.Add_ToContent(0, parRun);
            parRun = new ParaRun(par);
            parRun.Set_Pr(_textPr2);
            parRun.AddText("a");
            par.Add_ToContent(1, parRun);
            par.Reset(0, 0, 1000, 1000, 0, 0, 1);
            par.Recalculate_Page(0);

            var _text_x = _params[5] * dKoefPixToMM;
            var _text_y = (h_px - _params[6]) * dKoefPixToMM;
            par.Lines[0].Ranges[0].XVisible = _text_x;
            par.Lines[0].Y = _text_y;
            var old_marks = _api.ShowParaMarks;
            _api.ShowParaMarks = false;
            par.Draw(0, g);
            _api.ShowParaMarks = old_marks;

            _api.isViewMode = _oldTurn;
        }, this, []);
    };

    this.Draw = function(g, _master, use_background, use_master_shapes) {
        var w_px = this.WidthPx;
        var h_px = this.HeightPx;
        var dKoefPixToMM = this.HeightMM / h_px;
        var _back_fill = null;
        var RGBA = {R:0, G:0, B:0, A:255};
        var _layout = null;
        for (var i = 0; i < _master.sldLayoutLst.length; i++) {
          if (_master.sldLayoutLst[i].type == AscFormat.nSldLtTTitle) {
            _layout = _master.sldLayoutLst[i];
            break;
          }
        }
        var _theme = _master.Theme;
        if (_layout != null && _layout.cSld.Bg != null) {
          if (null != _layout.cSld.Bg.bgPr) {
            _back_fill = _layout.cSld.Bg.bgPr.Fill;
          } else {
            if (_layout.cSld.Bg.bgRef != null) {
              _layout.cSld.Bg.bgRef.Color.Calculate(_theme, null, _layout, _master, RGBA);
              RGBA = _layout.cSld.Bg.bgRef.Color.RGBA;
              _back_fill = _theme.themeElements.fmtScheme.GetFillStyle(_layout.cSld.Bg.bgRef.idx, _layout.cSld.Bg.bgRef.Color);
            }
          }
        } else {
          if (_master != null) {
            if (_master.cSld.Bg != null) {
              if (null != _master.cSld.Bg.bgPr) {
                _back_fill = _master.cSld.Bg.bgPr.Fill;
              } else {
                if (_master.cSld.Bg.bgRef != null) {
                  _master.cSld.Bg.bgRef.Color.Calculate(_theme, null, _layout, _master, RGBA);
                  RGBA = _master.cSld.Bg.bgRef.Color.RGBA;
                  _back_fill = _theme.themeElements.fmtScheme.GetFillStyle(_master.cSld.Bg.bgRef.idx, _master.cSld.Bg.bgRef.Color);
                }
              }
            } else {
              _back_fill = new AscFormat.CUniFill;
              _back_fill.fill = new AscFormat.CSolidFill;
              _back_fill.fill.color = new AscFormat.CUniColor;
              _back_fill.fill.color.color = new AscFormat.CRGBColor;
              _back_fill.fill.color.color.RGBA = {R:255, G:255, B:255, A:255};
            }
          }
        }
        if (_back_fill != null) {
          _back_fill.calculate(_theme, null, _layout, _master, RGBA);
        }
        if (use_background !== false) {
          DrawBackground(g, _back_fill, this.WidthMM, this.HeightMM);
        }

        if (use_master_shapes !== false)
        {
            if (null == _layout)
            {
                if(_master.needRecalc && _master.needRecalc())
                {
                    _master.recalculate();
                }
                _master.draw(g);
            }
            else
            {
                if (_layout.showMasterSp == true || _layout.showMasterSp == undefined)
                {
                    if(_master.needRecalc && _master.needRecalc())
                    {
                        _master.recalculate();
                    }
                    _master.draw(g);
                }
                _layout.recalculate();
                _layout.draw(g);
            }
        }
        g.reset();
        g.SetIntegerGrid(true);
        var _text_x = 8 * dKoefPixToMM;
        var _text_y = (h_px - 10) * dKoefPixToMM;
        var _color_w = 6;
        var _color_h = 3;
        var _color_x = 4;
        var _color_y = 31;
        var _color_delta = 1;
        if (!window["NATIVE_EDITOR_ENJINE"]) {
          g.p_color(255, 255, 255, 255);
          g.init(g.m_oContext, w_px, h_px, w_px, h_px);
          g.CalculateFullTransform();
          g.m_bIntegerGrid = true;
          g.b_color1(255, 255, 255, 255);
          g._s();
          g.rect(_color_x - _color_delta, _color_y - _color_delta, _color_w * 6 + 7 * _color_delta, 5);
          g.df();
          g._s();
          var _color = new AscFormat.CSchemeColor;
          for (var i = 0; i < 6; i++) {
            g._s();
            _color.id = i;
            _color.Calculate(_theme, null, null, _master, RGBA);
            g.b_color1(_color.RGBA.R, _color.RGBA.G, _color.RGBA.B, 255);
            g.rect(_color_x, _color_y, _color_w, _color_h);
            g.df();
            _color_x += _color_w + _color_delta;
          }
          g._s();
        } else {
          _color_w = this.WidthMM/8.0;
          _color_h = this.HeightMM/10.0;
          _color_x = this.WidthMM/20.0;
          _color_y = this.HeightMM - _color_x*(w_px/this.WidthMM)*(this.HeightMM/h_px) - _color_h;
          _color_delta = 2 * dKoefPixToMM;
            var __color_x = _color_x;
          g.p_color(255, 255, 255, 255);
          g.m_bIntegerGrid = true;
          g.b_color1(255, 255, 255, 255);
          g._s();
          g.rect(_color_x - _color_delta, _color_y - _color_delta, _color_w * 6 + 7 * _color_delta, _color_h + 2 * _color_delta);
          g.df();
          g._s();
          var _color = new AscFormat.CSchemeColor;
          for (var i = 0; i < 6; i++) {
            g._s();
            _color.id = i;
            _color.Calculate(_theme, null, null, _master, RGBA);
            g.b_color1(_color.RGBA.R, _color.RGBA.G, _color.RGBA.B, 255);
            g.rect(_color_x, _color_y, _color_w, _color_h);
            g.df();
            _color_x += _color_w + _color_delta;
          }
          g._s();
          _color_x = __color_x;
        }
        var _api = this.DrawingDocument.m_oWordControl.m_oApi;
        AscFormat.ExecuteNoHistory(function(){
            var _oldTurn = _api.isViewMode;
            _api.isViewMode = true;
            _color.id = 15;
            _color.Calculate(_theme, null, null, _master, RGBA);
            var nFontSize = 18;
            if (window["NATIVE_EDITOR_ENJINE"]) {
                nFontSize = 600;
            }
            var _textPr1 = new CTextPr;
            _textPr1.FontFamily = {Name:_theme.themeElements.fontScheme.majorFont.latin, Index:-1};
            _textPr1.RFonts.Ascii = {Name: _theme.themeElements.fontScheme.majorFont.latin, Index: -1};
            _textPr1.FontSize = nFontSize;
            _textPr1.Color = new CDocumentColor(_color.RGBA.R, _color.RGBA.G, _color.RGBA.B);
            var _textPr2 = new CTextPr;
            _textPr2.FontFamily = {Name:_theme.themeElements.fontScheme.minorFont.latin, Index:-1};
            _textPr2.RFonts.Ascii = {Name: _theme.themeElements.fontScheme.minorFont.latin, Index: -1};
            _textPr2.FontSize = nFontSize;
            _textPr2.Color = new CDocumentColor(_color.RGBA.R, _color.RGBA.G, _color.RGBA.B);
            var docContent = new CDocumentContent(editor.WordControl.m_oLogicDocument, editor.WordControl.m_oDrawingDocument, 0, 0, 1000, 1000, false, false, true);
            var par = docContent.Content[0];
            par.MoveCursorToStartPos();
            var _paraPr = new CParaPr;
            par.Pr = _paraPr;
            var parRun = new ParaRun(par);
            parRun.Set_Pr(_textPr1);
            parRun.AddText("A");
            par.Add_ToContent(0, parRun);
            parRun = new ParaRun(par);
            parRun.Set_Pr(_textPr2);
            parRun.AddText("a");
            par.Add_ToContent(1, parRun);
            par.Reset(0, 0, 1000, 1000, 0, 0, 1);
            par.Recalculate_Page(0);
            if (!window["NATIVE_EDITOR_ENJINE"]) {
                g.init(g.m_oContext, w_px, h_px, w_px * AscCommon.g_dKoef_pix_to_mm, h_px * AscCommon.g_dKoef_pix_to_mm);
                g.CalculateFullTransform();
                _text_x = 8 * AscCommon.g_dKoef_pix_to_mm;
                _text_y = (h_px - 11) * AscCommon.g_dKoef_pix_to_mm;
                par.Lines[0].Ranges[0].XVisible = _text_x;
                par.Lines[0].Y = _text_y;
                var old_marks = _api.ShowParaMarks;
                _api.ShowParaMarks = false;
                par.Draw(0, g);
                _api.ShowParaMarks = old_marks;
            } else {
                _text_x = _color_x;
                _text_y = _color_y - _color_h;
                par.Lines[0].Ranges[0].XVisible = _text_x;
                par.Lines[0].Y = _text_y;
                var old_marks = _api.ShowParaMarks;
                _api.ShowParaMarks = false;
                par.Draw(0, g);
                _api.ShowParaMarks = old_marks;
            }
            _api.isViewMode = _oldTurn;
        }, this, []);
      };

    this.GetThumbnail = function(_master, use_background, use_master_shapes)
    {
        if(window["NATIVE_EDITOR_ENJINE"])
        {
            return "";
        }
        var h_px = 38;
        var w_px = 85;//(this.WidthMM * h_px / this.HeightMM) >> 0;

        // пока не будем генерить для ретины
        /*
        if (this.IsRetina)
        {
            w_px <<= 1;
            h_px <<= 1;
        }
        */

        this.WidthPx  = w_px;
        this.HeightPx = h_px;

        if (this.CanvasImage == null)
            this.CanvasImage = document.createElement('canvas');

        this.CanvasImage.width = w_px;
        this.CanvasImage.height = h_px;

        var _ctx = this.CanvasImage.getContext('2d');

        var g = new AscCommon.CGraphics();
        g.init(_ctx, w_px, h_px, this.WidthMM, this.HeightMM);
        g.m_oFontManager = AscCommon.g_fontManager;

        g.transform(1,0,0,1,0,0);

        this.Draw(g, _master, use_background, use_master_shapes);

        try
        {
            return this.CanvasImage.toDataURL("image/png");
        }
        catch (err)
        {
            this.CanvasImage = null;
            if (undefined === use_background && undefined === use_master_shapes)
                return this.GetThumbnail(_master, true, false);
            else if (use_background && !use_master_shapes)
                return this.GetThumbnail(_master, false, false);
        }
        return "";
    }
}

//--------------------------------------------------------export----------------------------------------------------
window['AscCommonSlide'] = window['AscCommonSlide'] || {};
window['AscCommonSlide'].MasterSlide = MasterSlide;
