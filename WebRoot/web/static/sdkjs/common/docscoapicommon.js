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
  /**
   * Класс user для совместного редактирования/просмотра документа
   * -----------------------------------------------------------------------------
   *
   * @constructor
   * @memberOf Asc
   */
  function asc_CUser(val) {
    this.id = null;					// уникальный id - пользователя
    this.idOriginal = null;	// уникальный id - пользователя
    this.userName = null;		// имя пользователя
    this.state = undefined;	// состояние (true - подключен, false - отключился)
    this.indexUser = -1;		// Индекс пользователя (фактически равно числу заходов в документ на сервере)
    this.color = null;			// цвет пользователя
    this.view = false;			// просмотр(true), редактор(false)

    this._setUser(val);
    return this;
  }

  asc_CUser.prototype._setUser = function(val) {
    if (val) {
      this.id = val['id'];
      this.idOriginal = val['idOriginal'];
      this.userName = val['username'];
      this.indexUser = val['indexUser'];
      this.color = window['AscCommon'].getUserColorById(this.idOriginal, this.userName, false, true);
      this.view = val['view'];
    }
  };
  asc_CUser.prototype.asc_getId = function() {
    return this.id;
  };
  asc_CUser.prototype.asc_getIdOriginal = function() {
    return this.idOriginal;
  };
  asc_CUser.prototype.asc_getUserName = function() {
    return this.userName;
  };
  asc_CUser.prototype.asc_getFirstName = function() {
    return this.firstName;
  };
  asc_CUser.prototype.asc_getLastName = function() {
    return this.lastName;
  };
  asc_CUser.prototype.asc_getState = function() {
    return this.state;
  };
  asc_CUser.prototype.asc_getColor = function() {
    return '#' + ('000000' + this.color.toString(16)).substr(-6);
  };
  asc_CUser.prototype.asc_getView = function() {
    return this.view;
  };
  asc_CUser.prototype.setId = function(val) {
    this.id = val;
  };
  asc_CUser.prototype.setUserName = function(val) {
    this.userName = val;
  };
  asc_CUser.prototype.setFirstName = function(val) {
    this.firstName = val;
  };
  asc_CUser.prototype.setLastName = function(val) {
    this.lastName = val;
  };
  asc_CUser.prototype.setState = function(val) {
    this.state = val;
  };

  var ConnectionState = {
    Reconnect: -1,	// reconnect state
    None: 0,	// not initialized
    WaitAuth: 1,	// waiting session id
    Authorized: 2,	// authorized
    ClosedCoAuth: 3,	// closed coauthoring
    ClosedAll: 4,	// closed all

    SaveChanges: 10,	    // save
    AskSaveChanges: 11		// ask save
  };

  var c_oEditorId = {
    Word:0,
    Spreadsheet:1,
    Presentation:2
  };

  var c_oCloseCode = {
    serverShutdown: 4001,
    sessionIdle: 4002,
    sessionAbsolute: 4003,
	accessDeny: 4004,
	jwtExpired: 4005,
	jwtError: 4006,
	drop: 4007,
	updateVersion: 4008
  };
  
	var c_oAscServerCommandErrors = {
		NoError: 0,
		DocumentIdError: 1,
		ParseError: 2,
		UnknownError: 3,
		NotModified: 4,
		UnknownCommand: 5,
		Token: 6,
		TokenExpire: 7
	};
	
	var c_oAscForceSaveTypes = {
		Command: 0,
		Button: 1,
		Timeout: 2
	};

	function getDisconnectErrorCode (isDocumentLoadComplete, opt_closeCode) {
		var code = Asc.c_oAscError.ID.CoAuthoringDisconnect;
		if (c_oCloseCode.serverShutdown === opt_closeCode) {
			code = Asc.c_oAscError.ID.CoAuthoringDisconnect;
		} else if (c_oCloseCode.sessionIdle === opt_closeCode) {
			code = Asc.c_oAscError.ID.SessionIdle;
		} else if (c_oCloseCode.sessionAbsolute === opt_closeCode) {
			code = Asc.c_oAscError.ID.SessionAbsolute;
		} else if (c_oCloseCode.accessDeny === opt_closeCode) {
			code = Asc.c_oAscError.ID.AccessDeny;
		} else if (c_oCloseCode.jwtExpired === opt_closeCode) {
			code = isDocumentLoadComplete ? Asc.c_oAscError.ID.SessionToken : Asc.c_oAscError.ID.KeyExpire;
		} else if (c_oCloseCode.jwtError === opt_closeCode) {
			code = Asc.c_oAscError.ID.VKeyEncrypt;
		} else if (c_oCloseCode.drop === opt_closeCode) {
			code = Asc.c_oAscError.ID.UserDrop;
		} else if (c_oCloseCode.updateVersion === opt_closeCode) {
			code = Asc.c_oAscError.ID.UpdateVersion;
		}
		return code;
	}

  /*
   * Export
   * -----------------------------------------------------------------------------
   */
  var prot;
  window['AscCommon'] = window['AscCommon'] || {};
  window["AscCommon"].asc_CUser = asc_CUser;
  prot = asc_CUser.prototype;
  prot["asc_getId"] = prot.asc_getId;
  prot["asc_getIdOriginal"] = prot.asc_getIdOriginal;
  prot["asc_getUserName"] = prot.asc_getUserName;
  prot["asc_getState"] = prot.asc_getState;
  prot["asc_getColor"] = prot.asc_getColor;
  prot["asc_getView"] = prot.asc_getView;

  window["AscCommon"].getDisconnectErrorCode = getDisconnectErrorCode;

  window["AscCommon"].ConnectionState = ConnectionState;
  window["AscCommon"].c_oEditorId = c_oEditorId;
  window["AscCommon"].c_oCloseCode = c_oCloseCode;
  window["AscCommon"].c_oAscServerCommandErrors = c_oAscServerCommandErrors;
  window["AscCommon"].c_oAscForceSaveTypes = c_oAscForceSaveTypes;
})(window);
