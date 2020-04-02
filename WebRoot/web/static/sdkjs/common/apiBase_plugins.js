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

(function(window, undefined)
{
    /**
     * Plugin config
     * @typedef {Object} Config
	 *
     * @property {string} name
	 * Plugin name which will be visible at the plugin toolbar.
     *
	 * @property {?Object} nameLocale
	 * Plugin name translations. Example: { "fr" : "trFr", "de" : "deTr" }
     *
	 * @property {string} guid Plugin id
	 * Plugin identifier. It must be of the asc.{UUID} type.
	 *
	 * @property {?string} [baseUrl=""]
	 * Path to the plugin. All the other paths are calculated relative to this path. In case the plugin is installed on the server, an additional parameter (path to the plugins) is added there. If baseUrl == "" the path to all plugins will be used.
     *
	 * @property {Variation[]}
	 * Plugin variations or "subplugins" - see the Plugin variations section
     */

    /**
     * Editors possible values
     * @typedef {("word" | "slide" | "cell")} EditorType
     */

    /**
	 * Init data types
	 * @typedef {("none" | "text" | "ole" | "html" | "desktop")} InitDataType
     */

    /**
     * Event types
     * @typedef {("onDocumentContentReady" | "onTargetPositionChanged" | "onClick" | "onInputHelperClear" | "onInputHelperInput")} EventType
     */

    /**
     * Plugin variation
     * @typedef {Object} Variation
     * @property {string} description
	 * The description, i.e. what describes your plugin the best way.
	 *
     * @property {?Object} descriptionLocale
	 * The description translations (see config.nameLocale)
	 *
     * @property {string} url
	 * Plugin entry point, i.e. HTML file which connects the pluginBase.js (the base file needed for work with plugins) file and launches the plugin code.
	 *
     * @property {string[]} icons List icons (with support hi-dpi)
	 * Plugin icon image files used in the editors: for common screens and with doubled resolution for retina screens.
	 *
     * @property {?boolean} [isViewer=true]
	 * Specifies if the plugin is available when the document is available in viewer mode only or not.
	 *
	 * @property {boolean} isDisplayedInViewer
	 * Specifies if the plugin will be displayed in viewer mode as well as in editor mode (isDisplayedInViewer == true) or in the editor mode only (isDisplayedInViewer == false).
	 *
     * @property {EditorType[]} EditorsSupport
	 * The editors which the plugin is available for.
	 *
     * @property {boolean} [isVisual=true]
	 * Specifies if the plugin is visual (will open a window for some action, or introduce some additions to the editor panel interface) or non-visual (will provide a button (or buttons) which is going to apply some transformations or manipulations to the document).
     *
	 * @property {boolean} [isModal=true]
	 * Specifies if the opened plugin window is modal, i.e. a separate modal window must be opened, or not (used for visual plugins only). The following rule must be observed at all times: isModal != isInsideMode.
	 *
	 * @property {boolean} [isInsideMode=false]
	 * Specifies if the plugin must be displayed inside the editor panel instead of its own window (used for visual non-modal plugins only). The following rule must be observed at all times: isModal != isInsideMode.
     *
	 * @property {boolean} isCustomWindow
	 * For modal plugins only. Is using custom window, without standard borders & buttons.
	 *
	 * @property {boolean} isSystem
	 * Specifies if the plugin is not displayed in the editor interface and is started in background with the server (or desktop editors start) not interfering with the other plugins, so that they can work simultaneously.
     *
	 * @property {InitDataType} initDataType
	 * The data type selected in the editor and sent to the plugin: "text" - the text data, "html" - HTML formatted code, "ole" - OLE object data, "none" - no data will be send to the plugin from the editor.
     *
	 * @property {string} initData
     * Is always equal to "" - this is the data which is sent from the editor to the plugin at the plugin start (e.g. if initDataType == "text", the plugin will receive the selected text when run).
	 *
	 * @property {?boolean} isUpdateOleOnResize
	 * Specifies if the OLE object must be redrawn when resized in the editor using the vector object draw type or not (used for OLE objects only, i.e. initDataType == "ole").
     *
	 * @property {?Button[]} buttons
	 * The list of skinnable plugin buttons used in the plugin interface (used for visual plugins with their own window only, i.e. isVisual == true && isInsideMode == false). The buttons can be primary or not, the primary flag affecting the button skin only.
	 *
	 * @property {?boolean} [initOnSelectionChanged=true]
	 * Specifies if the plugin watches the text selection events in the editor window.
	 *
	 * @property {number[]} size
	 * Size window on start
	 *
	 * @property {EventType[]} events
     */

    /**
	 * Plugin buttons
	 * @typedef Button
	 * @property {string} text
	 * @property {string} textLocale
	 * @property {boolean} primary
	 */

    /**
     * Base class
     * @global
     * @class
     * @name Api
     */

    var Api = window["AscCommon"].baseEditorsApi;

    /**
     * Adding ole object to editor
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
	 * @alias AddOleObject
	 * @this Api
     * @param {Object} data The properties for object.
     * @param {number} data.width Width object in millimeters.
     * @param {number} data.height Height object in millimeters.
     * @param {string} data.data Data for ole object (internal format).
     * @param {string} data.guid Ole object program identifier
     * @param {string} data.imgSrc Ole object graphic presentation
     * @param {number} data.widthPix Width imgSrc in pixels
     * @param {number} data.heightPix Height imgSrc in pixels
    */
    Api.prototype["pluginMethod_AddOleObject"] = function(data) { return this.asc_addOleObject(data); };

    /**
     * Edit ole object to editor
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias EditOleObject
     * @param {Object} data The properties for object.
     * @param {number} data.width Width object in millimeters.
     * @param {number} data.height Height object in millimeters.
     * @param {string} data.data Data for ole object (internal format).
     * @param {string} data.objectId Ole object identifier
     * @param {string} data.imgSrc Ole object graphic presentation
     * @param {number} data.widthPix Width imgSrc in pixels
     * @param {number} data.heightPix Height imgSrc in pixels
     */
    Api.prototype["pluginMethod_EditOleObject"] = function(data) { return this.asc_editOleObject(data); };

    /**
	 * @typedef {Object} FontInfo
     * @property {string} m_wsFontName
     * @property {string} m_wsFontPath
	 * @property {number} m_lIndex
	 * @property {boolean} m_bBold
	 * @property {boolean} m_bItalic
	 * @property {boolean} m_bIsFixed
	 * @property {number[]} m_aPanose
	 * @property {number} m_ulUnicodeRange1
	 * @property {number} m_ulUnicodeRange2
	 * @property {number} m_ulUnicodeRange3
	 * @property {number} m_ulUnicodeRange4
	 * @property {number} m_ulCodePageRange1
	 * @property {number} m_ulCodePageRange2
	 * @property {number} m_usWeigth
	 * @property {number} m_usWidth
	 * @property {string} m_sFamilyClass
	 * @property {string} m_eFontFormat
	 * @property {number} m_shAvgCharWidth
	 * @property {number} m_shAscent
	 * @property {number} m_shDescent
	 * @property {number} m_shLineGap
	 * @property {number} m_shXHeight
	 * @property {number} m_shCapHeight
     */

    /**
     * Get fonts list
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias GetFontList
     * @returns {FontInfo[]}
     */
    Api.prototype["pluginMethod_GetFontList"] = function()
    {
        return AscFonts.g_fontApplication.g_fontSelections.SerializeList();
    };

    /**
     * Insert text to editor
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias InputText
	 * @param {string} text Text for insert
	 * @param {string} textReplace Replace last text
     */
    Api.prototype["pluginMethod_InputText"] = function(text, textReplace)
    {
        if (this.isViewMode || !AscCommon.g_inputContext)
            return;

        var codes = [];
        for (var i = text.getUnicodeIterator(); i.check(); i.next())
            codes.push(i.value());

        if (textReplace)
        {
            for (var i = 0; i < textReplace.length; i++)
                AscCommon.g_inputContext.emulateKeyDownApi(8);
        }

        AscCommon.g_inputContext.apiInputText(codes);
        AscCommon.g_inputContext.keyPressInput = "";
    };

    /**
     * Paste <html> into editor
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias PasteHtml
     * @param {string} htmlText Text in html format
     */
    Api.prototype["pluginMethod_PasteHtml"] = function(htmlText)
    {
        if (!AscCommon.g_clipboardBase)
            return null;

        var _elem = document.getElementById("pmpastehtml");
        if (_elem)
            return;

        _elem = document.createElement("div");
        _elem.id = "pmpastehtml";

        if (this.editorId == AscCommon.c_oEditorId.Word || this.editorId == AscCommon.c_oEditorId.Presentation)
        {
            var textPr = this.get_TextProps();
            if (textPr)
            {
                if (undefined !== textPr.TextPr.FontSize)
                    _elem.style.fontSize = textPr.TextPr.FontSize + "pt";

                _elem.style.fontWeight = (true === textPr.TextPr.Bold) ? "bold" : "normal";
                _elem.style.fontStyle = (true === textPr.TextPr.Italic) ? "italic" : "normal";

                var _color = textPr.TextPr.Color;
                if (_color)
                    _elem.style.color = "rgb(" + _color.r + "," + _color.g + "," + _color.b + ")";
                else
                    _elem.style.color = "rgb(0,0,0)";
            }
        }
        else if (this.editorId == AscCommon.c_oEditorId.Spreadsheet)
        {
            var props = this.asc_getCellInfo();

            if (props && props.font)
            {
                if (undefined != props.font.size)
                    _elem.style.fontSize = props.font.size + "pt";

                _elem.style.fontWeight = (true === props.font.bold) ? "bold" : "normal";
                _elem.style.fontStyle = (true === props.font.italic) ? "italic" : "normal";
            }
        }

        _elem.innerHTML = htmlText;
        document.body.appendChild(_elem);
        this.incrementCounterLongAction();
        var b_old_save_format = AscCommon.g_clipboardBase.bSaveFormat;
        AscCommon.g_clipboardBase.bSaveFormat = true;
        this.asc_PasteData(AscCommon.c_oAscClipboardDataFormat.HtmlElement, _elem);
        this.decrementCounterLongAction();

        if (true)
        {
            var fCallback = function ()
            {
                document.body.removeChild(_elem);
                _elem = null;
                AscCommon.g_clipboardBase.bSaveFormat = b_old_save_format;
            };
            if(this.checkLongActionCallback(fCallback, null)){
                fCallback();
            }
        }
        else
        {
            document.body.removeChild(_elem);
            _elem = null;
            AscCommon.g_clipboardBase.bSaveFormat = b_old_save_format;
        }
    };

    /**
     * Paste text into editor
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias PasteText
     * @param {string} text Text
     */
    Api.prototype["pluginMethod_PasteText"] = function(text)
    {
        if (!AscCommon.g_clipboardBase)
            return null;

        this.asc_PasteData(AscCommon.c_oAscClipboardDataFormat.Text, text);
    };

    /**
     * @typedef {Object} Macros
     * @property {string[]} macrosArray Macros codes
     * @property {number} current Current index
     */

    /**
     * Get all macroses in document
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias GetMacros
     * @returns {Macros} Document macroses
     */
    Api.prototype["pluginMethod_GetMacros"] = function()
    {
        return this.asc_getMacros();
    };

    /**
     * Set all macroses in document
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias SetMacros
     * @param {Macros} data Document macroses
     */
    Api.prototype["pluginMethod_SetMacros"] = function(data)
    {
        return this.asc_setMacros(data);
    };

    /**
     * Loader for long operations
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias StartAction
     * @param {number} type Type action: 0 = Information, 1 = BlockInteraction
	 * @param {string} description Description text for action
     */
    Api.prototype["pluginMethod_StartAction"] = function(type, description)
    {
        this.sync_StartAction((type == "Block") ? Asc.c_oAscAsyncActionType.BlockInteraction : Asc.c_oAscAsyncActionType.Information, description);
    };

    /**
     * Loader for long operations
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias EndAction
     * @param {number} type Type action: 0 = Information, 1 = BlockInteraction
     * @param {string} description Description text for action
     */
    Api.prototype["pluginMethod_EndAction"] = function(type, description, status)
    {
        this.sync_EndAction((type == "Block") ? Asc.c_oAscAsyncActionType.BlockInteraction : Asc.c_oAscAsyncActionType.Information, description);

        if (window["AscDesktopEditor"] && status != null && status != "")
        {
            // error!!!
            if (!window["AscDesktopEditor"]["IsLocalFile"]())
            {
                this.sendEvent("asc_onError", "Encryption error: " + status + ". The file was not compiled.", c_oAscError.Level.Critical);
                window["AscDesktopEditor"]["CryptoMode"] = 0;
            }
            else
            {
                this.sendEvent("asc_onError", "Encryption error: " + status + ". End-to-end encryption mode is disabled.", c_oAscError.Level.NoCritical);
                window["AscDesktopEditor"]["CryptoMode"] = 0;

                if (undefined !== window.LastUserSavedIndex)
                {
                    AscCommon.History.UserSavedIndex = window.LastUserSavedIndex;

                    if (this.editorId == AscCommon.c_oEditorId.Spreadsheet)
                        this.onUpdateDocumentModified(AscCommon.History.Have_Changes());
                    else
                        this.UpdateInterfaceState();
                }
            }

            window.LastUserSavedIndex = undefined;
            setTimeout(function() {

                window["AscDesktopEditor"]["buildCryptedEnd"](false);

            }, 500);

            return;
        }

        window.LastUserSavedIndex = undefined;
        if (this._callbackPluginEndAction)
        {
            this._callbackPluginEndAction.call(this);
        }
    };

    /**
     * OnEncryption event (for crypto plugins)
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias OnEncryption
     * @param {object} obj Properties
     */
    Api.prototype["pluginMethod_OnEncryption"] = function(obj)
    {
        var _editor = window["Asc"]["editor"] ? window["Asc"]["editor"] : window.editor;
        switch (obj.type)
        {
            case "generatePassword":
            {
                if ("" == obj["password"])
                {
                    _editor.sendEvent("asc_onError", "There is no connection with the blockchain", c_oAscError.Level.Critical);
                    return;
                }

                var _ret = _editor.asc_nativeGetFile3();
                AscCommon.EncryptionWorker.isPasswordCryptoPresent = true;
                _editor.currentDocumentInfoNext = obj["docinfo"];
                window["AscDesktopEditor"]["buildCryptedStart"](_ret.data, _ret.header, obj["password"], obj["docinfo"] ? obj["docinfo"] : "");
                break;
            }
            case "getPasswordByFile":
            {
                if ("" != obj["password"])
                {
                    var _param = ("<m_sPassword>" + AscCommon.CopyPasteCorrectString(obj["password"]) + "</m_sPassword>");
                    _editor.currentPassword = obj["password"];
                    _editor.currentDocumentHash = obj["hash"];
                    _editor.currentDocumentInfo = obj["docinfo"];

                    AscCommon.EncryptionWorker.isPasswordCryptoPresent = true;

                    if (window.isNativeOpenPassword)
                    {
                        window["AscDesktopEditor"]["NativeViewerOpen"](obj["password"]);
                    }
                    else
                    {
                        window["AscDesktopEditor"]["SetAdvancedOptions"](_param);
                    }
                }
                else
                {
                    this._onNeedParams(undefined, true);
                }
                break;
            }
            case "encryptData":
            case "decryptData":
            {
                AscCommon.EncryptionWorker.receiveChanges(obj);
                break;
            }
        }
    };

    /**
     * Set properties for editor
	 * see {@link https://github.com/ONLYOFFICE/sdkjs-plugins/tree/master/examples/settings examples}
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias SetProperties
     * @param {object} obj
	 * @param {?boolean} obj.copyoutenabled Disable copying from editor if true
	 * @param {?boolean} obj.hideContentControlTrack Disable content control track if true
	 * @param {?string} obj.watermark_on_draw Watermark in json format
     */
    Api.prototype["pluginMethod_SetProperties"] = function(obj)
    {
        if (!obj)
            return;

        for (var prop in obj)
        {
            switch (prop)
            {
                case "copyoutenabled":
                {
                    this.copyOutEnabled = obj[prop];
                    break;
                }
                case "watermark_on_draw":
                {
                    this.watermarkDraw = obj[prop] ? new AscCommon.CWatermarkOnDraw(obj[prop], this) : null;
                    this.watermarkDraw.checkOnReady();
                    break;
                }
                case "hideContentControlTrack":
                {
                    if (this.editorId === AscCommon.c_oEditorId.Word && this.WordControl && this.WordControl.m_oLogicDocument)
                        this.WordControl.m_oLogicDocument.SetForceHideContentControlTrack(obj[prop]);

                    break;
                }
                case "disableAutostartMacros":
                {
                    this.disableAutostartMacros = true;
                }
                default:
                    break;
            }
        }
    };

    /**
     * Show input helper
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias ShowInputHelper
     * @param {string} guid Guid helper
     * @param {number} w Width
     * @param {number} h Height
	 * @param {boolean} isKeyboardTake Is catch keyboard
     */
    Api.prototype["pluginMethod_ShowInputHelper"] = function(guid, w, h, isKeyboardTake)
    {
        var _frame = document.getElementById("iframe_" + guid);
        if (!_frame)
            return;

        var _offset = this.getTargetOnBodyCoords();
        if (w > _offset.W)
            w = _offset.W;
        if (h > _offset.H)
            h = _offset.H;

        var _offsetToFrame = 10;
        var _r = _offset.X + _offsetToFrame + w;
        var _t = _offset.Y - _offsetToFrame - h;
        var _b = _offset.Y + _offset.TargetH + _offsetToFrame + h;

        var _x = _offset.X + _offsetToFrame;
        if (_r > _offset.W)
            _x += (_offset.W - _r);

        var _y = 0;

        if (_b < _offset.H)
        {
            _y = _offset.Y + _offset.TargetH + _offsetToFrame;
        }
        else if (_t > 0)
        {
            _y = _t;
        }
        else
        {
            _y = _offset.Y + _offset.TargetH + _offsetToFrame;
            h += (_offset.H - _b);
        }

        _frame.style.left = _x + "px";
        _frame.style.top = _y + "px";
        _frame.style.width = w + "px";
        _frame.style.height = h + "px";

        if (!this.isMobileVersion)
            _frame.style.zIndex = 1000;
        else
            _frame.style.zIndex = 5001;

        if (!_frame.style.boxShadow)
        {
            _frame.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.175)";
            _frame.style.webkitBoxShadow = "0 6px 12px rgba(0, 0, 0, 0.175)";
            //_frame.style.borderRadius = "3px";
        }


        if (isKeyboardTake)
        {
            _frame.setAttribute("oo_editor_input", "true");
            _frame.focus();
        }
        else
        {
            _frame.removeAttribute("oo_editor_input");
            if (AscCommon.g_inputContext)
            {
                AscCommon.g_inputContext.isNoClearOnFocus = true;
                AscCommon.g_inputContext.HtmlArea.focus();
            }
        }

        if (AscCommon.g_inputContext)
        {
            AscCommon.g_inputContext.isInputHelpersPresent = true;
            AscCommon.g_inputContext.isInputHelpers[guid] = true;
        }
    };

    /**
     * Unshow input helper
     * @memberof Api
     * @typeofeditors ["CDE", "CSE", "CPE"]
     * @alias UnShowInputHelper
     * @param {string} guid Guid helper
     */
    Api.prototype["pluginMethod_UnShowInputHelper"] = function(guid, isclear)
    {
        var _frame = document.getElementById("iframe_" + guid);
        if (!_frame)
            return;

        _frame.style.width = "10px";
        _frame.style.height = "10px";
        _frame.removeAttribute("oo_editor_input");

        _frame.style.zIndex = -1000;

        if (AscCommon.g_inputContext && AscCommon.g_inputContext.HtmlArea)
        {
            AscCommon.g_inputContext.HtmlArea.focus();

            if (AscCommon.g_inputContext.isInputHelpers[guid])
                delete AscCommon.g_inputContext.isInputHelpers[guid];

            var count = 0;
            for (var test in AscCommon.g_inputContext.isInputHelpers)
            {
                if (AscCommon.g_inputContext.isInputHelpers[test])
                    count++;
            }

            AscCommon.g_inputContext.isInputHelpersPresent = (0 != count);
        }

        if (AscCommon.g_inputContext && isclear)
        {
            AscCommon.g_inputContext.keyPressInput = "";
        }
    };

})(window);
