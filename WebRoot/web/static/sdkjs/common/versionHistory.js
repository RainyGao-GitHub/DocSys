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
(/**
 * @param {Window} window
 * @param {undefined} undefined
 */
  function(window, undefined) {
  /** @constructor */
  function asc_CVersionHistory(newObj) {
    this.docId = null;
    this.url = null;
    this.urlChanges = null;
    this.currentChangeId = -1;
    this.newChangeId = -1;
    this.colors = null;
    this.changes = null;
	this.token = null;
	this.isRequested = null;
	this.serverVersion = null;

    if (newObj) {
      this.update(newObj);
    }
  }

  asc_CVersionHistory.prototype.update = function(newObj) {
    var bUpdate = (this.docId !== newObj.docId || this.url !== newObj.url || this.urlChanges !== newObj.urlChanges || this.currentChangeId > newObj.currentChangeId);
    if (bUpdate) {
      this.docId = newObj.docId;
      this.url = newObj.url;
      this.urlChanges = newObj.urlChanges;
      this.currentChangeId = -1;
      this.changes = null;
	  this.token = newObj.token;
    }
    this.colors = newObj.colors;
    this.newChangeId = newObj.currentChangeId;
	this.isRequested = newObj.isRequested;
	this.serverVersion = newObj.serverVersion;
    return bUpdate;
  };
  asc_CVersionHistory.prototype.applyChanges = function(editor) {
    var color;
    this.newChangeId = (null == this.newChangeId) ? (this.changes.length - 1) : this.newChangeId;
    for (var i = this.currentChangeId + 1; i <= this.newChangeId && i < this.changes.length; ++i) {
      color = this.colors[i];
      editor._coAuthoringSetChanges(this.changes[i], i !== this.newChangeId ? null : (color ? new CDocumentColor((color >> 16) & 0xFF, (color >> 8) & 0xFF, color & 0xFF) : new CDocumentColor(191, 255, 199)));
    }
    this.currentChangeId = this.newChangeId;
  };
  asc_CVersionHistory.prototype.asc_setDocId = function(val) {
    this.docId = val;
  };
  asc_CVersionHistory.prototype.asc_setUrl = function(val) {
    this.url = val;
  };
  asc_CVersionHistory.prototype.asc_setUrlChanges = function(val) {
    this.urlChanges = val;
  };
  asc_CVersionHistory.prototype.asc_setCurrentChangeId = function(val) {
    this.currentChangeId = val;
  };
  asc_CVersionHistory.prototype.asc_setArrColors = function(val) {
    this.colors = val;
  };
  asc_CVersionHistory.prototype.asc_setToken = function(val) {
    this.token = val;
  };
  asc_CVersionHistory.prototype.asc_setIsRequested = function(val) {
    this.isRequested = val;
  };
  asc_CVersionHistory.prototype.asc_setServerVersion = function(val) {
    this.serverVersion = val;
  };

  window["Asc"].asc_CVersionHistory = window["Asc"]["asc_CVersionHistory"] = asc_CVersionHistory;
  prot = asc_CVersionHistory.prototype;
  prot["asc_setDocId"] = prot.asc_setDocId;
  prot["asc_setUrl"] = prot.asc_setUrl;
  prot["asc_setUrlChanges"] = prot.asc_setUrlChanges;
  prot["asc_setCurrentChangeId"] = prot.asc_setCurrentChangeId;
  prot["asc_setArrColors"] = prot.asc_setArrColors;
  prot["asc_setToken"] = prot.asc_setToken;
  prot["asc_setIsRequested"] = prot.asc_setIsRequested;
  prot["asc_setServerVersion"] = prot.asc_setServerVersion;
})(window);
