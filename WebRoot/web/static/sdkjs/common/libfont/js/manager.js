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

    var AscFonts = window['AscFonts'];

    function CFontManagerEngine()
    {
        this.library = new AscFonts.FT_Library();
        this.library.Init();
        this.manager = null;

        this.openFont = function(stream, faceindex)
        {
            var args = new AscFonts.FT_Open_Args();
            args.flags = 0x02;
            args.stream = new AscFonts.FT_Stream(stream.data, stream.size);

            var face = this.library.FT_Open_Face(args, faceindex);
            if (null == face)
                return null;

            var font = new AscFonts.CFontFile();

            font.m_lUnits_Per_Em = face.units_per_EM;
            font.m_lAscender = face.ascender;
            font.m_lDescender = face.descender;
            font.m_lLineHeight = face.height;

            if (this.manager.IsUseWinOS2Params && face.os2 && face.os2.version != 0xFFFF)
            {
                var _os2 = face.os2;
                if (this.IsCellMode)
                {
                    /*
                    // что-то типо этого в экселе... пока выключаем
                    var _addidive = (0.15 * font.m_lLineHeight) >> 0;
                    font.m_lAscender += ((_addidive + 1) >> 1);
                    font.m_lDescender -= (_addidive >> 1);
                    font.m_lLineHeight += _addidive;
                    */

                    var _winAscent = face.os2.usWinAscent;
                    var _winDescent = -face.os2.usWinDescent;

                    // experimantal: for cjk fonts lineheight *= 1.3
                    if ((face.os2.ulUnicodeRange2 & 0x2DF00000) != 0)
                    {
                        var _addidive = (0.3 * (_winAscent - _winDescent)) >> 0;
                        _winAscent += ((_addidive + 1) >> 1);
                        _winDescent -= (_addidive >> 1);
                    }

                    // TODO:
                    // https://www.microsoft.com/typography/otspec/recom.htm - hhea, not typo!!!
                    if (font.m_lLineHeight < (_winAscent - _winDescent))
                    {
                        font.m_lAscender = _winAscent;
                        font.m_lDescender = _winDescent;
                        font.m_lLineHeight = _winAscent - _winDescent;
                    }
                }
                else
                {
                    var bIsUseTypeAttack = ((_os2.fsSelection & 128) == 128) ? true : false;
                    if (bIsUseTypeAttack)
                    {
                        font.m_lAscender  = face.os2.sTypoAscender;
                        font.m_lDescender = face.os2.sTypoDescender;

                        font.m_lLineHeight = (face.os2.sTypoAscender - face.os2.sTypoDescender + face.os2.sTypoLineGap);
                    }
                    else if (false)
                    {
                        font.m_lAscender  = face.os2.usWinAscent;
                        font.m_lDescender = -face.os2.usWinDescent;

                        font.m_lLineHeight = (face.os2.usWinAscent + face.os2.usWinDescent);
                    }
                }
            }

            font.m_nNum_charmaps = face.num_charmaps;

            font.m_pFace = face;
            font.LoadDefaultCharAndSymbolicCmapIndex();
            font.m_nError = AscFonts.FT_Set_Char_Size(face, 0, font.m_fSize * 64, 0, 0);

            if (!font.IsSuccess())
            {
                font = null;
                face = null;
                return null;
            }

            font.ResetTextMatrix();
            font.ResetFontMatrix();

            if (true === font.m_bUseKerning)
            {
                font.m_bUseKerning = ((face.face_flags & 64) != 0 ? true : false);
            }

            return font;
        };

        this.setHintsProps = function(bIsHinting, bIsSubpixHinting)
        {
            if (undefined === this.library.tt_hint_props)
                return;

            this.library.tt_hint_props.TT_USE_BYTECODE_INTERPRETER = true;
            this.library.tt_hint_props.TT_CONFIG_OPTION_SUBPIXEL_HINTING = (bIsHinting && bIsSubpixHinting) ? true : false;
            this.manager.LOAD_MODE = bIsHinting ? 40968 : 40970;
        };
    }

    window['AscFonts'].engine_Create = function(fontManager)
    {
        var engine = new CFontManagerEngine();
        engine.manager = fontManager;
        engine.setHintsProps(fontManager.bIsHinting, fontManager.bIsSubpixHinting);
        fontManager._engine = engine;
        AscFonts.initVariables();
    };

    window['AscFonts'].engine_Destroy = function(fontManager)
    {
    };

    window['AscFonts'].onLoadModule();
})(window);
