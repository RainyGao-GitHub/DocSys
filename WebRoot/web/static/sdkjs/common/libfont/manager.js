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

(function(window, undefined) {

    function CFontFilesCache()
    {
        this.m_lMaxSize = 1000;
        this.m_lCurrentSize = 0;
        this.Fonts = {};

        this.LoadFontFile = function(stream_index, name, faceindex, fontManager)
        {
            if (!fontManager._engine)
                AscFonts.engine_Create(fontManager);

            // correct native stream
            if (AscFonts.CreateNativeStreamByIndex)
                AscFonts.CreateNativeStreamByIndex(stream_index);

            if (!AscFonts.g_fonts_streams[stream_index])
                return null;

            return fontManager._engine.openFont(AscFonts.g_fonts_streams[stream_index], faceindex);
        };

        this.LockFont = function(stream_index, fontName, faceIndex, fontSize, _ext, fontManager)
        {
            var key = fontName + faceIndex + fontSize;
            if (undefined !== _ext)
                key += _ext;
            var pFontFile = this.Fonts[key];
            if (pFontFile)
                return pFontFile;

            pFontFile = this.Fonts[key] = this.LoadFontFile(stream_index, fontName, faceIndex, fontManager);
            return pFontFile;
        };
    }

    // params: { mode: "cell" };
    function CFontManager(params)
    {
        this._engine = null;

        this.m_pFont = null;
        this.m_oGlyphString = new AscFonts.CGlyphString();

        this.error = 0;

        this.fontName = undefined;

        this.m_fCharSpacing = 0.0;
        this.m_bStringGID = false;

        this.m_oFontsCache = null;

        this.m_lUnits_Per_Em = 0;
        this.m_lAscender = 0;
        this.m_lDescender = 0;
        this.m_lLineHeight = 0;

        this.RasterMemory = null;

        this.IsCellMode = (params && params.mode == "cell") ? true : false;
        this.IsAdvanceNeedBoldFonts = this.IsCellMode;
        this.IsUseWinOS2Params = true;

        this.bIsHinting = false;
        this.bIsSubpixHinting = false;

        this.LOAD_MODE = 40970;
    }

    CFontManager.prototype =
    {
        AfterLoad : function()
        {
            if (null == this.m_pFont)
            {
                this.m_lUnits_Per_Em = 0;
                this.m_lAscender = 0;
                this.m_lDescender = 0;
                this.m_lLineHeight = 0;
            }
            else
            {
                var f = this.m_pFont;
                this.m_lUnits_Per_Em = f.m_lUnits_Per_Em;
                this.m_lAscender = f.m_lAscender;
                this.m_lDescender = f.m_lDescender;
                this.m_lLineHeight = f.m_lLineHeight;

                f.CheckHintsSupport();
            }
        },

        Initialize : function(is_init_raster_memory)
        {
            this.m_oFontsCache = new CFontFilesCache();

            if (is_init_raster_memory === true)
            {
                AscFonts.registeredFontManagers.push(this);
                this.InitializeRasterMemory();
            }
        },

        InitializeRasterMemory : function()
        {
			if (AscFonts.use_map_blitting)
			{
			    if (!this.RasterMemory)
			    {
					this.RasterMemory = new AscFonts.CRasterHeapTotal();
					this.RasterMemory.CreateFirstChuck();
				}
			}
			else
            {
                if (this.RasterMemory)
                {
                    this.RasterMemory = null;
                }
            }
        },

        ClearFontsRasterCache : function()
        {
            for (var i in this.m_oFontsCache.Fonts)
            {
                if (this.m_oFontsCache.Fonts[i])
                    this.m_oFontsCache.Fonts[i].ClearCache();
            }
            this.ClearRasterMemory();
        },

        ClearRasterMemory : function()
        {
            // быстрая очистка всей памяти (убирание всех дыр)
            if (null == this.RasterMemory || null == this.m_oFontsCache)
                return;

            var _fonts = this.m_oFontsCache.Fonts;
            for (var i in _fonts)
            {
                if (_fonts[i] !== undefined && _fonts[i] != null)
                    _fonts[i].ClearCacheNoAttack();
            }

            this.RasterMemory.Clear();
        },

        UpdateSize : function(dOldSize, dDpi, dNewDpi)
        {
            if (0 == dNewDpi)
                dNewDpi = 72.0;
            if (0 == dDpi)
                dDpi = 72.0;

            return dOldSize * dDpi / dNewDpi;
        },

        LoadString : function(wsBuffer, fX, fY)
        {
            if (!this.m_pFont)
                return false;

            this.m_oGlyphString.SetString(wsBuffer, fX, fY);
            this.m_pFont.GetString(this.m_oGlyphString);

            return true;
        },

        LoadString2 : function(wsBuffer, fX, fY)
        {
            if (!this.m_pFont)
                return false;

            this.m_oGlyphString.SetString(wsBuffer, fX, fY);
            this.m_pFont.GetString2(this.m_oGlyphString);

            return true;
        },

        LoadString3 : function(gid, fX, fY)
        {
            if (!this.m_pFont)
                return false;

            this.SetStringGID(true);
            this.m_oGlyphString.SetStringGID (gid, fX, fY);
            this.m_pFont.GetString2(this.m_oGlyphString);
            this.SetStringGID(false);

            return true;
        },

        LoadString3C : function(gid, fX, fY)
        {
            if (!this.m_pFont)
                return false;

            this.SetStringGID(true);

            // это SetString
            var string = this.m_oGlyphString;

            string.m_fX = fX + string.m_fTransX;
            string.m_fY = fY + string.m_fTransY;

            string.m_nGlyphsCount = 1;
            string.m_nGlyphIndex  = 0;

            var _g = string.GetFirstGlyph();
            _g.bBitmap = false;
            _g.oBitmap = null;
            _g.eState = AscFonts.EGlyphState.glyphstateNormal;
            _g.lUnicode = gid;

            this.m_pFont.GetString2C(string);

            this.SetStringGID(false);
            return true;
        },

        LoadString2C : function(wsBuffer, fX, fY)
        {
            if (!this.m_pFont)
                return false;

            // это SetString
            var string = this.m_oGlyphString;

            string.m_fX = fX + string.m_fTransX;
            string.m_fY = fY + string.m_fTransY;

            string.m_nGlyphsCount = 1;
            string.m_nGlyphIndex  = 0;

            var _g = string.GetFirstGlyph();
            _g.bBitmap = false;
            _g.oBitmap = null;
            _g.eState = AscFonts.EGlyphState.glyphstateNormal;
            _g.lUnicode = wsBuffer.charCodeAt(0);

            this.m_pFont.GetString2C(string);
            return string.m_fEndX;
        },

        LoadString4C : function(lUnicode, fX, fY)
        {
            if (!this.m_pFont)
                return false;

            // это SetString
            var string = this.m_oGlyphString;

            string.m_fX = fX + string.m_fTransX;
            string.m_fY = fY + string.m_fTransY;

            string.m_nGlyphsCount = 1;
            string.m_nGlyphIndex  = 0;

            var _g = string.GetFirstGlyph();
            _g.bBitmap = false;
            _g.oBitmap = null;
            _g.eState = AscFonts.EGlyphState.glyphstateNormal;
            _g.lUnicode = lUnicode;

            this.m_pFont.GetString2C(string);
            return string.m_fEndX;
        },

        LoadStringPathCode : function(code, isGid, fX, fY, worker)
        {
            if (!this.m_pFont)
                return false;

            this.SetStringGID(isGid);

            // это SetString
            var string = this.m_oGlyphString;

            string.m_fX = fX + string.m_fTransX;
            string.m_fY = fY + string.m_fTransY;

            string.m_nGlyphsCount = 1;
            string.m_nGlyphIndex  = 0;

            var _g = string.GetFirstGlyph();
            _g.bBitmap = false;
            _g.oBitmap = null;
            _g.eState = AscFonts.EGlyphState.glyphstateNormal;
            _g.lUnicode = code;

            this.m_pFont.GetStringPath(string, worker);

            this.SetStringGID(false);

            return true;
        },

        LoadChar : function(lUnicode)
        {
            if (!this.m_pFont)
                return false;

            return this.m_pFont.GetChar2(lUnicode);
        },

        MeasureChar : function(lUnicode, is_raster_distances)
        {
            if (!this.m_pFont)
                return;

            return this.m_pFont.GetChar(lUnicode, is_raster_distances);
        },

        GetKerning : function(unPrevGID, unGID)
        {
            if (!this.m_pFont)
                return;

            return this.m_pFont.GetKerning(unPrevGID, unGID);
        },

        MeasureString : function()
        {
            var oPoint = new AscFonts.CGlyphRect();
            var len = this.m_oGlyphString.GetLength();
            if (len <= 0)
                return oPoint;

            var fTop = 0xFFFF, fBottom = -0xFFFF, fLeft = 0xFFFF, fRight = -0xFFFF;
            for (var nIndex = 0; nIndex < len; ++nIndex)
            {
                var oSizeTmp = this.m_oGlyphString.GetBBox (nIndex);

                if (fBottom < oSizeTmp.fBottom)
                    fBottom = oSizeTmp.fBottom;

                if (fTop > oSizeTmp.fTop)
                    fTop = oSizeTmp.fTop;

                if (fLeft > oSizeTmp.fLeft)
                    fLeft = oSizeTmp.fLeft;

                if (fRight < oSizeTmp.fRight)
                    fRight = oSizeTmp.fRight;
            }

            oPoint.fX = fLeft;
            oPoint.fY = fTop;

            oPoint.fWidth  = Math.abs((fRight - fLeft));
            oPoint.fHeight = Math.abs((fTop - fBottom));

            return oPoint;
        },

        MeasureString2 : function()
        {
            var oPoint = new AscFonts.CGlyphRect();

            if (this.m_oGlyphString.GetLength() <= 0)
                return oPoint;

            var oSizeTmp = this.m_oGlyphString.GetBBox2();

            oPoint.fX = oSizeTmp.fLeft;
            oPoint.fY = oSizeTmp.fTop;

            oPoint.fWidth  = Math.abs((oSizeTmp.fRight - oSizeTmp.fLeft));
            oPoint.fHeight = Math.abs((oSizeTmp.fTop - oSizeTmp.fBottom));

            return oPoint;
        },

        GetNextChar2 : function()
        {
            return this.m_oGlyphString.GetNext();
        },

        IsSuccess : function()
        {
            return (0 == this.error);
        },

        SetTextMatrix : function(fA, fB, fC, fD, fE, fF)
        {
            if (!this.m_pFont)
                return false;

            if (this.m_pFont.SetTextMatrix (fA, fB, fC, fD, 0, 0))
                this.m_oGlyphString.SetCTM(fA, fB, fC, fD, 0, 0);
            this.m_oGlyphString.SetTrans(fE, fF);

            return true;
        },

        SetTextMatrix2 : function(fA, fB, fC, fD, fE, fF)
        {
            if (!this.m_pFont)
                return false;

            this.m_pFont.SetTextMatrix (fA, fB, fC, fD, 0, 0);
            this.m_oGlyphString.SetCTM(fA, fB, fC, fD, 0, 0);
            this.m_oGlyphString.SetTrans(fE, fF);

            return true;
        },

        SetStringGID : function(bStringGID)
        {
            this.m_bStringGID = bStringGID;

            if (!this.m_pFont)
                return;

            this.m_pFont.SetStringGID(this.m_bStringGID);
        },

        SetHintsProps : function(bIsHinting, bIsSubpixHinting)
        {
            this.bIsHinting = bIsHinting;
            this.bIsSubpixHinting = bIsSubpixHinting;

            if (this._engine)
                this._engine.setHintsProps(bIsHinting, bIsSubpixHinting);

            this.ClearFontsRasterCache();
        },

        SetAdvanceNeedBoldFonts : function(value)
        {
            this.IsAdvanceNeedBoldFonts = value;
        },

        LoadFont : function(fontFile, faceIndex, size, isBold, isItalic, needBold, needItalic, isNoSetupToManager)
        {
            var _ext = "";
            if (needBold)
                _ext += "nbold";
            if (needItalic)
                _ext += "nitalic";

            var pFontFile = this.m_oFontsCache.LockFont(fontFile.stream_index, fontFile.Id, faceIndex, size, _ext, this);
            if (!pFontFile)
                return null;

            pFontFile.m_oFontManager = this;

            pFontFile.SetNeedBold(needBold);
            pFontFile.SetNeedItalic(needItalic);

            pFontFile.SetStringGID(this.m_bStringGID);
            pFontFile.SetCharSpacing(this.m_fCharSpacing);

            if (isNoSetupToManager !== true)
            {
				this.m_pFont = pFontFile;
				this.m_oGlyphString.ResetCTM();
                this.AfterLoad();
            }

            return pFontFile;
        }
    }

    window['AscFonts'].CFontManager = CFontManager;
    window['AscFonts'].CFontFilesCache = CFontFilesCache;
    window['AscFonts'].onLoadModule();
})(window);
