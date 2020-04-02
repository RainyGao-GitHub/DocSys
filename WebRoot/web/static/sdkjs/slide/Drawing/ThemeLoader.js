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

function CAscThemes()
{
    this.EditorThemes = [];
    this.DocumentThemes = [];

    this._init();
}
CAscThemes.prototype._init = function()
{
    var _defaultThemes = AscCommon["g_defaultThemes"] || [];

    var _count = _defaultThemes.length;
    for (var i = 0; i < _count; i++)
    {
        this.EditorThemes[i] = new CAscThemeInfo({
            Name : _defaultThemes[i],
            Url : ("/theme" + (i + 1) + "/")
        });
        this.EditorThemes[i].Index = i;
    }
};
CAscThemes.prototype.get_EditorThemes = function(){ return this.EditorThemes; };
CAscThemes.prototype.get_DocumentThemes = function(){ return this.DocumentThemes; };

function CThemeLoadInfo()
{
    this.FontMap = null;
    this.ImageMap = null;

    this.Theme = null;
    this.Master = null;
    this.Layouts = [];
}

function CThemeLoader()
{
    this.Themes = new CAscThemes();
    this.ThemesCached = [];

    // editor themes info
    this.themes_info_editor     = [];
    var count = this.Themes.EditorThemes.length;
    for (var i = 0; i < count; i++)
        this.themes_info_editor[i] = null;

    this.themes_info_document   = [];

    this.Api = null;
    this.CurrentLoadThemeIndex = -1;
    this.ThemesUrl = "";
    this.ThemesUrlAbs = "";

    this.IsReloadBinaryThemeEditorNow = false;

    var oThis = this;

    this.StartLoadTheme = function(indexTheme)
    {
        var theme_info = null;
        var theme_load_info = null;

        this.Api.StartLoadTheme();
        this.CurrentLoadThemeIndex = -1;

        if (indexTheme >= 0)
        {
            theme_info = this.Themes.EditorThemes[indexTheme];
            theme_load_info = this.themes_info_editor[indexTheme];
            this.CurrentLoadThemeIndex = indexTheme;
        }
        else
        {
            theme_info = this.Themes.DocumentThemes[-indexTheme - 1];
            theme_load_info = this.themes_info_document[-indexTheme - 1];
            // при загрузке документа все данные загрузились
            this.Api.EndLoadTheme(theme_load_info);
            return;
        }

        // применяется тема из стандартных.
        if (null != theme_load_info)
        {
            if (indexTheme >= 0 && theme_load_info.Master.sldLayoutLst.length === 0)
            {
                // мега схема. нужно переоткрыть бинарник, чтобы все открылось с историей
                this.IsReloadBinaryThemeEditorNow = true;
                this._callback_theme_load();
                return;
            }

			this.Api.sync_StartAction(Asc.c_oAscAsyncActionType.BlockInteraction, Asc.c_oAscAsyncAction.LoadTheme);
            this.Api.EndLoadTheme(theme_load_info);
            return;
        }

        this.Api.sync_StartAction(Asc.c_oAscAsyncActionType.BlockInteraction, Asc.c_oAscAsyncAction.LoadTheme);

        // значит эта тема еще не загружалась
        var theme_src = this.ThemesUrl + "theme" + (this.CurrentLoadThemeIndex + 1) + "/theme.bin";
        this.LoadThemeJSAsync(theme_src);

        this.Api.StartLoadTheme();
    };

    this.LoadThemeJSAsync = function(theme_src)
    {
        if (!window["NATIVE_EDITOR_ENJINE"])
        {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', theme_src, true);

            if (typeof ArrayBuffer !== 'undefined' && !window.opera)
                xhr.responseType = 'arraybuffer';

            if (xhr.overrideMimeType)
                xhr.overrideMimeType('text/plain; charset=x-user-defined');
            else
                xhr.setRequestHeader('Accept-Charset', 'x-user-defined');

            xhr.onload = function()
            {
                if (this.readyState == 4 && (this.status == 200 || location.href.indexOf("file:") == 0))
                {
                    if (typeof ArrayBuffer !== 'undefined' && !window.opera && this.response)
                    {
                        oThis._callback_theme_load(new Uint8Array(this.response));
                    }
                    else if (AscCommon.AscBrowser.isIE)
                    {
                        var _response = new VBArray(this["responseBody"]).toArray();
                        var srcLen = _response.length;
                        var _responseNative = new Uint8Array(srcLen);

                        for (var i = 0; i < srcLen; i++)
                        {
                            _responseNative[i] = _response[i];
                        }

                        oThis._callback_theme_load(_responseNative);
                    }
                    else
                    {
                        var srcLen = this.responseText.length;
                        var _responseNative = new Uint8Array(srcLen);

                        for (var i = 0; i < srcLen; i++)
                        {
                            _responseNative[i] = (this.responseText.charCodeAt(i) & 0xFF);
                        }

                        oThis._callback_theme_load(_responseNative);
                    }
                }
            };

            xhr.send(null);
        }
        else
        {
            this._callback_theme_load(window['native']['WC_LoadTheme'](theme_src));
        }
    };

    this._callback_theme_load = function(_binary)
    {
        if (_binary)
            oThis.ThemesCached[oThis.CurrentLoadThemeIndex] = _binary;

        _binary = oThis.ThemesCached[oThis.CurrentLoadThemeIndex];

        if (_binary)
        {
            var _loader = new AscCommon.BinaryPPTYLoader();
            _loader.Api = oThis.Api;
            _loader.IsThemeLoader = true;

            var pres = {};
            pres.slideMasters = [];
            pres.DrawingDocument = editor.WordControl.m_oDrawingDocument;

            AscCommon.History.MinorChanges = true;
            _loader.Load(_binary, pres);
            for(var i = 0; i < pres.slideMasters.length; ++i)
            {
                pres.slideMasters[i].setThemeIndex(oThis.CurrentLoadThemeIndex);
            }
            AscCommon.History.MinorChanges = false;

            if (oThis.IsReloadBinaryThemeEditorNow || window["NATIVE_EDITOR_ENJINE"])
            {
                oThis.asyncImagesEndLoaded();
                oThis.IsReloadBinaryThemeEditorNow = false;
                return;
            }

            // теперь объект this.themes_info_editor[this.CurrentLoadThemeIndex]
            oThis.Api.FontLoader.ThemeLoader = oThis;
            oThis.Api.FontLoader.LoadDocumentFonts2(oThis.themes_info_editor[oThis.CurrentLoadThemeIndex].FontMap);
            return;
        }
        // ошибка!!!
    };

    this.asyncFontsStartLoaded = function()
    {
        // началась загрузка шрифтов
    };

    this.asyncFontsEndLoaded = function()
    {
        // загрузка шрифтов
        this.Api.FontLoader.ThemeLoader = null;
        this.Api.ImageLoader.ThemeLoader = this;

        this.Api.ImageLoader.LoadDocumentImages(this.themes_info_editor[this.CurrentLoadThemeIndex].ImageMap);
    };

    this.asyncImagesStartLoaded = function()
    {
        // началась загрузка картинок
    };

    this.asyncImagesEndLoaded = function()
    {
        this.Api.ImageLoader.ThemeLoader = null;

        this.Api.EndLoadTheme(this.themes_info_editor[this.CurrentLoadThemeIndex]);
        this.CurrentLoadThemeIndex = -1;
    };
}

//-------------------------------------------------------------export---------------------------------------------------
window['AscCommonSlide'] = window['AscCommonSlide'] || {};
window['AscCommonSlide'].CThemeLoader = CThemeLoader;
window['AscCommonSlide'].CThemeLoadInfo = CThemeLoadInfo;
CAscThemes.prototype['get_EditorThemes'] = CAscThemes.prototype.get_EditorThemes;
CAscThemes.prototype['get_DocumentThemes'] = CAscThemes.prototype.get_DocumentThemes;
