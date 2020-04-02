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
        this.library = AscFonts.CreateLibrary();
        this.manager = null;

        this.openFont = function(stream, faceindex)
        {
            var face = AscFonts.FT_Open_Face(this.library, stream, faceindex);
            if (!face)
                return null;

            var font = new AscFonts.CFontFile();
            font.SetFace(face, this.manager);

            if (!font.IsSuccess())
            {
                font = null;
                face = null;
                return null;
            }

            return font;
        };

        this.setHintsProps = function(bIsHinting, bIsSubpixHinting)
        {
            var REND_MODE_SUBPIX = (bIsHinting && bIsSubpixHinting) ? AscFonts.TT_INTERPRETER_VERSION_40 : AscFonts.TT_INTERPRETER_VERSION_35;
            this.manager.LOAD_MODE = bIsHinting ? AscFonts.LOAD_MODE_HINTING : AscFonts.LOAD_MODE_DEFAULT;

            AscFonts.FT_Set_TrueType_HintProp(this.library, REND_MODE_SUBPIX);
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
