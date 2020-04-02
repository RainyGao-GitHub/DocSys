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
     * Base class
     * @global
     * @class
     * @name Api
     */

    /**
     * @typedef {Object} ContentControl
     * @property {string} Tag
     * @property {string} Id
     * @property {number} Lock
     * @property {string} InternalId
     */

    var Api = window["asc_docs_api"];

    /**
     * Open file with fields
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias OpenFile
     * @param {Uint8Array} binaryFile
     * File bytes
     * @param {string[]} fields
     * List fields values
     */
    window["asc_docs_api"].prototype["pluginMethod_OpenFile"] = function(binaryFile, fields)
    {
        this.asc_CloseFile();

        this.FontLoader.IsLoadDocumentFonts2 = true;
        this.OpenDocument2(this.DocumentUrl, binaryFile);

        if (fields)
            this.asc_SetBlockChainData(fields);

        this.restrictions = Asc.c_oAscRestrictionType.OnlyForms;
    };
    /**
     * Get all fields as text
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias OpenFile
     * @returns {string[]}
     */
    window["asc_docs_api"].prototype["pluginMethod_GetFields"] = function()
    {
        return this.asc_GetBlockChainData();
    };
    /**
     * Insert and replace content controls
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias InsertAndReplaceContentControls
     * @param {object} arrDocuments
     */
    window["asc_docs_api"].prototype["pluginMethod_InsertAndReplaceContentControls"] = function(arrDocuments)
    {
        var _worker = new AscCommon.CContentControlPluginWorker(this, arrDocuments);
        return _worker.start();
    };
    /**
     * Remove content controls
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias RemoveContentControls
     * @param {object} arrDocuments
     */
    window["asc_docs_api"].prototype["pluginMethod_RemoveContentControls"] = function(arrDocuments)
    {
        var _worker = new AscCommon.CContentControlPluginWorker(this, arrDocuments);
        return _worker.delete();
    };
    /**
     * Get all content controls
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias GetAllContentControls
     * @returns {ContentControl[]}
     */
    window["asc_docs_api"].prototype["pluginMethod_GetAllContentControls"] = function()
    {
        var _blocks = this.WordControl.m_oLogicDocument.GetAllContentControls();
        var _ret = [];
        var _obj = null;
        for (var i = 0; i < _blocks.length; i++)
        {
            _obj = _blocks[i].GetContentControlPr();
            _ret.push({"Tag" : _obj.Tag, "Id" : _obj.Id, "Lock" : _obj.Lock, "InternalId" : _obj.InternalId});
        }
        return _ret;
    };
    /**
     * Add content control
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias AddContentControl
     * @param {number} type Type: 1 = Block, 2 = Inline, 3 = Row, 4 = Cell
     * @param {object} pr Properties
     * @param {string} pr.Id Id
     * @param {string} pr.Tag Tag
     * @param {string} pr.Lock Lock
     * @param {string} pr.Alias Alias
     * @param {string} pr.Appearance Appearance
     * @param {object} pr.Color Color
     * @param {number} pr.Color.R R
     * @param {number} pr.Color.G G
     * @param {number} pr.Color.B B
     * @returns {ContentControl}
     */
    window["asc_docs_api"].prototype["pluginMethod_AddContentControl"] = function(type, pr)
    {
        var _content_control_pr;
        if (pr)
        {
            _content_control_pr = new AscCommon.CContentControlPr();
            _content_control_pr.Id = pr["Id"];
            _content_control_pr.Tag = pr["Tag"];
            _content_control_pr.Lock = pr["Lock"];

            _content_control_pr.Alias = pr["Alias"];

            if (undefined !== pr["Appearance"])
                _content_control_pr.Appearance = pr["Appearance"];

            if (undefined !== pr["Color"])
                _content_control_pr.Color = new Asc.asc_CColor(pr["Color"]["R"], pr["Color"]["G"], pr["Color"]["B"]);
        }

        var _obj = this.asc_AddContentControl(type, _content_control_pr);
        if (!_obj)
            return undefined;
        return {"Tag" : _obj.Tag, "Id" : _obj.Id, "Lock" : _obj.Lock, "InternalId" : _obj.InternalId};
    };
    /**
     * Remove specified content control
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias RemoveContentControl
     * @returns {Object}
     */
    window["asc_docs_api"].prototype["pluginMethod_RemoveContentControl"] = function(id)
    {
        return this.asc_RemoveContentControlWrapper(id);
    };
    /**
     * Get current content control
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias GetCurrentContentControl
     * @returns {Object}
     */
    window["asc_docs_api"].prototype["pluginMethod_GetCurrentContentControl"] = function()
    {
        return this.asc_GetCurrentContentControl();
    };
    /**
     * Get current content control properties
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias GetCurrentContentControlPr
     * @param {string} contentFormat
     * @returns {Object}
     */
	window["asc_docs_api"].prototype["pluginMethod_GetCurrentContentControlPr"] = function(contentFormat)
	{
		var oLogicDocument = this.private_GetLogicDocument();

		var oState;
		var prop = this.asc_GetContentControlProperties();
		if (!prop)
			return null;

		if (oLogicDocument && prop.CC)
		{
			oState = oLogicDocument.SaveDocumentState();
			prop.CC.SelectContentControl();
		}

		if (prop && prop.CC) delete prop.CC;

		if (contentFormat)
		{
			var copy_data = {
				data     : "",
				pushData : function(format, value)
				{
					this.data = value;
				}
			};
			var copy_format = 1;
			if (contentFormat == Asc.EPluginDataType.html)
				copy_format = 2;
			this.asc_CheckCopy(copy_data, copy_format);
			prop["content"] = copy_data.data;
		}

		if (oState)
		{
			oLogicDocument.LoadDocumentState(oState);
			oLogicDocument.UpdateSelection();
		}

		return prop;
	};
    /**
     * Select specified content control
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias SelectContentControl
     * @param {string} id Content control identifier
     */
    window["asc_docs_api"].prototype["pluginMethod_SelectContentControl"] = function(id)
    {
        var oLogicDocument = this.private_GetLogicDocument();
        if (!oLogicDocument)
            return;

        oLogicDocument.SelectContentControl(id);
    };
    /**
     * Move cursor to specified content control
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias MoveCursorToContentControl
     * @param {string} id Content control identifier
     * @param {boolean} isBegin
     */
    window["asc_docs_api"].prototype["pluginMethod_MoveCursorToContentControl"] = function(id, isBegin)
    {
        var oLogicDocument = this.private_GetLogicDocument();
        if (!oLogicDocument)
            return;

        oLogicDocument.MoveCursorToContentControl(id, isBegin);
    };
    /**
     * Get selection in document in text format
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias GetSelectedText
     */
    window["asc_docs_api"].prototype["pluginMethod_GetSelectedText"] = function()
    {
        var oLogicDocument = this.private_GetLogicDocument();
        if (!oLogicDocument)
            return;

        return oLogicDocument.GetSelectedText(false, {NewLine : true, NewLineParagraph : true});
    };
    /**
     * Remove selection in document
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias RemoveSelectedContent
     */
    window["asc_docs_api"].prototype["pluginMethod_RemoveSelectedContent"] = function()
    {
        var oLogicDocument = this.private_GetLogicDocument();
        if (!oLogicDocument || !oLogicDocument.IsSelectionUse())
            return;

        if (false === oLogicDocument.Document_Is_SelectionLocked(AscCommon.changestype_Remove, null, true, oLogicDocument.IsFormFieldEditing()))
        {
            oLogicDocument.StartAction(AscDFH.historydescription_Document_BackSpaceButton);
            oLogicDocument.Remove(-1, true);
            oLogicDocument.FinalizeAction();
        }
    };
    /**
     * Add comment to document
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias AddComment
     * @param {string} sMessage Message
     * @param {string} sAuthorName Author
     */
    window["asc_docs_api"].prototype["pluginMethod_AddComment"] = function(sMessage, sAuthorName)
    {
        var oData = new asc_CCommentDataWord();

        if (sMessage)
            oData.asc_putText(sMessage);

        if (sAuthorName)
            oData.asc_putUserName(sAuthorName);

        this.asc_addComment(oData);
    };
    /**
     * Move cursor to Start
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias MoveCursorToStart
     * @param {boolean} isMoveToMainContent
     */
    window["asc_docs_api"].prototype["pluginMethod_MoveCursorToStart"] = function(isMoveToMainContent)
    {
        var oLogicDocument = this.private_GetLogicDocument();
        if (oLogicDocument)
        {
            if (isMoveToMainContent)
                oLogicDocument.MoveCursorToStartOfDocument();
            else
                oLogicDocument.MoveCursorToStartPos(false);
        }
    };
    /**
     * Move cursor to End
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias MoveCursorToEnd
     * @param {boolean} isMoveToMainContent
     */
    window["asc_docs_api"].prototype["pluginMethod_MoveCursorToEnd"] = function(isMoveToMainContent)
    {
        var oLogicDocument = this.private_GetLogicDocument();
        if (oLogicDocument)
        {
            if (isMoveToMainContent)
                oLogicDocument.MoveCursorToStartOfDocument();

            oLogicDocument.MoveCursorToEndPos(false);
        }
    };
    /**
     * Find and replace text.
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias SearchAndReplace
     * @param {Object} oProperties The properties for find and replace.
     * @param {string} oProperties.searchString Search string.
     * @param {string} oProperties.replaceString Replacement string.
     * @param {boolean} [oProperties.matchCase=true]
     */
    window["asc_docs_api"].prototype["pluginMethod_SearchAndReplace"] = function(oProperties)
    {
        var sSearch     = oProperties["searchString"];
        var sReplace    = oProperties["replaceString"];
        var isMatchCase = undefined !== oProperties["matchCase"] ? oProperties.matchCase : true;

        var oSearchEngine = this.WordControl.m_oLogicDocument.Search(sSearch, {MatchCase : isMatchCase});
        if (!oSearchEngine)
            return;

        this.WordControl.m_oLogicDocument.Search_Replace(sReplace, true, null, false);
    };
    /**
     * Get file content in html format
     * @memberof Api
     * @typeofeditors ["CDE"]
     * @alias GetFileHTML
     * @return {string}
     */
    window["asc_docs_api"].prototype["pluginMethod_GetFileHTML"] = function()
    {
        return this.ContentToHTML(true);
    };
})(window);
