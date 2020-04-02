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
  'use strict';

  var Asc = window['Asc'];
  var AscCommon = window['AscCommon'];

  var ConnectionState = AscCommon.ConnectionState;
  var c_oEditorId = AscCommon.c_oEditorId;
  var c_oCloseCode = AscCommon.c_oCloseCode;
  var c_oAscServerCommandErrors = AscCommon.c_oAscServerCommandErrors;
  var c_oAscForceSaveTypes = AscCommon.c_oAscForceSaveTypes;

  // Класс надстройка, для online и offline работы
  function CDocsCoApi(options) {
    this._CoAuthoringApi = new DocsCoApi();
    this._onlineWork = false;

    if (options) {
      this.onAuthParticipantsChanged = options.onAuthParticipantsChanged;
      this.onParticipantsChanged = options.onParticipantsChanged;
      this.onMessage = options.onMessage;
      this.onServerVersion = options.onServerVersion;
      this.onCursor =  options.onCursor;
      this.onMeta =  options.onMeta;
      this.onSession =  options.onSession;
      this.onExpiredToken =  options.onExpiredToken;
	  this.onForceSave =  options.onForceSave;
      this.onHasForgotten =  options.onHasForgotten;
      this.onLocksAcquired = options.onLocksAcquired;
      this.onLocksReleased = options.onLocksReleased;
      this.onLocksReleasedEnd = options.onLocksReleasedEnd; // ToDo переделать на массив release locks
      this.onDisconnect = options.onDisconnect;
      this.onWarning = options.onWarning;
      this.onFirstLoadChangesEnd = options.onFirstLoadChangesEnd;
      this.onConnectionStateChanged = options.onConnectionStateChanged;
      this.onSetIndexUser = options.onSetIndexUser;
      this.onSpellCheckInit = options.onSpellCheckInit;
      this.onSaveChanges = options.onSaveChanges;
      this.onStartCoAuthoring = options.onStartCoAuthoring;
      this.onEndCoAuthoring = options.onEndCoAuthoring;
      this.onUnSaveLock = options.onUnSaveLock;
      this.onRecalcLocks = options.onRecalcLocks;
      this.onDocumentOpen = options.onDocumentOpen;
      this.onFirstConnect = options.onFirstConnect;
      this.onLicense = options.onLicense;
      this.onLicenseChanged = options.onLicenseChanged;
    }
  }

  CDocsCoApi.prototype.init = function(user, docid, documentCallbackUrl, token, editorType, documentFormatSave, docInfo) {
    if (this._CoAuthoringApi && this._CoAuthoringApi.isRightURL()) {
      var t = this;
      this._CoAuthoringApi.onAuthParticipantsChanged = function(e, id) {
        t.callback_OnAuthParticipantsChanged(e, id);
      };
      this._CoAuthoringApi.onParticipantsChanged = function(e) {
        t.callback_OnParticipantsChanged(e);
      };
      this._CoAuthoringApi.onMessage = function(e, clear) {
        t.callback_OnMessage(e, clear);
      };
      this._CoAuthoringApi.onServerVersion = function(e) {
      	t.callback_OnServerVersion(e);
	  };
      this._CoAuthoringApi.onCursor = function(e) {
        t.callback_OnCursor(e);
      };
      this._CoAuthoringApi.onMeta = function(e) {
        t.callback_OnMeta(e);
      };
      this._CoAuthoringApi.onSession = function(e) {
        t.callback_OnSession(e);
      };
      this._CoAuthoringApi.onExpiredToken = function(e) {
        t.callback_OnExpiredToken(e);
      };
      this._CoAuthoringApi.onHasForgotten = function(e) {
        t.callback_OnHasForgotten(e);
      };
	  this._CoAuthoringApi.onForceSave = function(e) {
        t.callback_OnForceSave(e);
      };
      this._CoAuthoringApi.onLocksAcquired = function(e) {
        t.callback_OnLocksAcquired(e);
      };
      this._CoAuthoringApi.onLocksReleased = function(e, bChanges) {
        t.callback_OnLocksReleased(e, bChanges);
      };
      this._CoAuthoringApi.onLocksReleasedEnd = function() {
        t.callback_OnLocksReleasedEnd();
      };
      this._CoAuthoringApi.onDisconnect = function(e, code) {
        t.callback_OnDisconnect(e, code);
      };
      this._CoAuthoringApi.onWarning = function(e) {
        t.callback_OnWarning(e);
      };
      this._CoAuthoringApi.onFirstLoadChangesEnd = function() {
        t.callback_OnFirstLoadChangesEnd();
      };
      this._CoAuthoringApi.onConnectionStateChanged = function(e) {
        t.callback_OnConnectionStateChanged(e);
      };
      this._CoAuthoringApi.onSetIndexUser = function(e) {
        t.callback_OnSetIndexUser(e);
      };
      this._CoAuthoringApi.onSpellCheckInit = function(e) {
        t.callback_OnSpellCheckInit(e);
      };
      this._CoAuthoringApi.onSaveChanges = function(e, userId, bFirstLoad) {
        t.callback_OnSaveChanges(e, userId, bFirstLoad);
      };
      // Callback есть пользователей больше 1
      this._CoAuthoringApi.onStartCoAuthoring = function(e, isWaitAuth) {
        t.callback_OnStartCoAuthoring(e, isWaitAuth);
      };
      this._CoAuthoringApi.onEndCoAuthoring = function(e) {
        t.callback_OnEndCoAuthoring(e);
      };
      this._CoAuthoringApi.onUnSaveLock = function() {
        t.callback_OnUnSaveLock();
      };
      this._CoAuthoringApi.onRecalcLocks = function(e) {
        t.callback_OnRecalcLocks(e);
      };
      this._CoAuthoringApi.onDocumentOpen = function(data) {
        t.callback_OnDocumentOpen(data);
      };
      this._CoAuthoringApi.onFirstConnect = function() {
        t.callback_OnFirstConnect();
      };
      this._CoAuthoringApi.onLicense = function(res) {
        t.callback_OnLicense(res);
      };
      this._CoAuthoringApi.onLicenseChanged = function(res) {
        t.callback_OnLicenseChanged(res);
	  };

      this._CoAuthoringApi.init(user, docid, documentCallbackUrl, token, editorType, documentFormatSave, docInfo);
      this._onlineWork = true;
    } else {
      // Фиктивные вызовы
      this.onFirstConnect();
      this.onLicense(null);
    }
  };

  CDocsCoApi.prototype.getDocId = function() {
    if (this._CoAuthoringApi) {
      return this._CoAuthoringApi.getDocId()
    }
    return undefined;
  };
  CDocsCoApi.prototype.setDocId = function(docId) {
    if (this._CoAuthoringApi) {
      return this._CoAuthoringApi.setDocId(docId)
    }
  };

  CDocsCoApi.prototype.auth = function(isViewer, opt_openCmd, opt_isIdle) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.auth(isViewer, opt_openCmd, opt_isIdle);
    } else {
      // Фиктивные вызовы
      this.callback_OnSpellCheckInit('');
      this.callback_OnSetIndexUser('123');
      this.onFirstLoadChangesEnd();
    }
  };

  CDocsCoApi.prototype.set_url = function(url) {
    if (this._CoAuthoringApi) {
      this._CoAuthoringApi.set_url(url);
    }
  };

  CDocsCoApi.prototype.get_onlineWork = function() {
    return this._onlineWork;
  };

  CDocsCoApi.prototype.get_state = function() {
    if (this._CoAuthoringApi) {
      return this._CoAuthoringApi.get_state();
    }

    return 0;
  };

  CDocsCoApi.prototype.openDocument = function(data) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.openDocument(data);
    }
  };

  CDocsCoApi.prototype.sendRawData = function(data) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.sendRawData(data);
    }
  };

  CDocsCoApi.prototype.getMessages = function() {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.getMessages();
    }
  };

  CDocsCoApi.prototype.sendMessage = function(message) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.sendMessage(message);
    }
  };

  CDocsCoApi.prototype.sendCursor = function(cursor) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.sendCursor(cursor);
    }
  };

  CDocsCoApi.prototype.sendChangesError = function(data) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.sendChangesError(data);
    }
  };

  CDocsCoApi.prototype.askLock = function(arrayBlockId, callback) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.askLock(arrayBlockId, callback);
    } else {
      var t = this;
      window.setTimeout(function() {
        if (callback) {
          var lengthArray = (arrayBlockId) ? arrayBlockId.length : 0;
          if (0 < lengthArray) {
            callback({"lock": arrayBlockId[0]});
            // Фиктивные вызовы
            for (var i = 0; i < lengthArray; ++i) {
              t.callback_OnLocksAcquired({"state": 2, "block": arrayBlockId[i]});
            }
          }
        }
      }, 1);
    }
  };

  CDocsCoApi.prototype.askSaveChanges = function(callback) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.askSaveChanges(callback);
    } else {
      window.setTimeout(function() {
        if (callback) {
          // Фиктивные вызовы
          callback({"saveLock": false});
        }
      }, 100);
    }
  };

  CDocsCoApi.prototype.unSaveLock = function() {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.unSaveLock();
    } else {
      var t = this;
      window.setTimeout(function() {
        // Фиктивные вызовы
        t.callback_OnUnSaveLock();
      }, 100);
    }
  };

  CDocsCoApi.prototype.saveChanges = function(arrayChanges, deleteIndex, excelAdditionalInfo, canUnlockDocument, canReleaseLocks) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.canUnlockDocument = canUnlockDocument;
      this._CoAuthoringApi.canReleaseLocks = canReleaseLocks;
      this._CoAuthoringApi.saveChanges(arrayChanges, null, deleteIndex, excelAdditionalInfo);
    }
  };

  CDocsCoApi.prototype.unLockDocument = function(isSave, canUnlockDocument, deleteIndex, canReleaseLocks) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.canUnlockDocument = canUnlockDocument;
      this._CoAuthoringApi.canReleaseLocks = canReleaseLocks;
      this._CoAuthoringApi.unLockDocument(isSave, deleteIndex);
    }
  };

  CDocsCoApi.prototype.getUsers = function() {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.getUsers();
    }
  };

  CDocsCoApi.prototype.getUserConnectionId = function() {
    if (this._CoAuthoringApi && this._onlineWork) {
      return this._CoAuthoringApi.getUserConnectionId();
    }
    return null;
  };
  
  CDocsCoApi.prototype.get_indexUser = function() {
    if (this._CoAuthoringApi && this._onlineWork) {
      return this._CoAuthoringApi.get_indexUser();
    }
    return null;
  };

  CDocsCoApi.prototype.get_isAuth = function() {
    if (this._CoAuthoringApi && this._onlineWork) {
      return this._CoAuthoringApi.get_isAuth();
    }
    return null;
  };
  
  CDocsCoApi.prototype.get_jwt = function() {
    if (this._CoAuthoringApi && this._onlineWork) {
      return this._CoAuthoringApi.get_jwt();
    }
    return null;
  };

  CDocsCoApi.prototype.releaseLocks = function(blockId) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.releaseLocks(blockId);
    }
  };

  CDocsCoApi.prototype.disconnect = function(opt_code, opt_reason) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.disconnect(opt_code, opt_reason);
    }
  };

  CDocsCoApi.prototype.extendSession = function(idleTime) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.extendSession(idleTime);
    }
  };

  CDocsCoApi.prototype.versionHistory = function(data) {
    if (this._CoAuthoringApi && this._onlineWork) {
      this._CoAuthoringApi.versionHistory(data);
    }
  };

	CDocsCoApi.prototype.forceSave = function() {
		if (this._CoAuthoringApi && this._onlineWork) {
			return this._CoAuthoringApi.forceSave();
		}
		return false;
	};

  CDocsCoApi.prototype.callback_OnAuthParticipantsChanged = function(e, id) {
    if (this.onAuthParticipantsChanged) {
      this.onAuthParticipantsChanged(e, id);
    }
  };

  CDocsCoApi.prototype.callback_OnParticipantsChanged = function(e) {
    if (this.onParticipantsChanged) {
      this.onParticipantsChanged(e);
    }
  };

  CDocsCoApi.prototype.callback_OnMessage = function(e, clear) {
    if (this.onMessage) {
      this.onMessage(e, clear);
    }
  };

  CDocsCoApi.prototype.callback_OnServerVersion = function(e) {
  	if (this.onServerVersion) {
      this.onServerVersion(e);
	}
  };

  CDocsCoApi.prototype.callback_OnCursor = function(e) {
    if (this.onCursor) {
      this.onCursor(e);
    }
  };

  CDocsCoApi.prototype.callback_OnMeta = function(e) {
    if (this.onMeta) {
      this.onMeta(e);
    }
  };

  CDocsCoApi.prototype.callback_OnSession = function(e) {
    if (this.onSession) {
      this.onSession(e);
    }
  };

  CDocsCoApi.prototype.callback_OnExpiredToken = function(e) {
    if (this.onExpiredToken) {
      this.onExpiredToken(e);
    }
  };
  
  CDocsCoApi.prototype.callback_OnForceSave = function(e) {
    if (this.onForceSave) {
      this.onForceSave(e);
    }
  };

  CDocsCoApi.prototype.callback_OnHasForgotten = function(e) {
    if (this.onHasForgotten) {
      this.onHasForgotten(e);
    }
  };

  CDocsCoApi.prototype.callback_OnLocksAcquired = function(e) {
    if (this.onLocksAcquired) {
      this.onLocksAcquired(e);
    }
  };

  CDocsCoApi.prototype.callback_OnLocksReleased = function(e, bChanges) {
    if (this.onLocksReleased) {
      this.onLocksReleased(e, bChanges);
    }
  };

  CDocsCoApi.prototype.callback_OnLocksReleasedEnd = function() {
    if (this.onLocksReleasedEnd) {
      this.onLocksReleasedEnd();
    }
  };

  /**
   * Event об отсоединении от сервера
   * @param {jQuery} e  event об отсоединении с причиной
   * @param {code: AscCommon.c_oCloseCode.drop} code
   */
  CDocsCoApi.prototype.callback_OnDisconnect = function(e, code) {
    if (this.onDisconnect) {
      this.onDisconnect(e, code);
    }
  };

  CDocsCoApi.prototype.callback_OnWarning = function(e) {
    if (this.onWarning) {
      this.onWarning(e);
    }
  };

  CDocsCoApi.prototype.callback_OnFirstLoadChangesEnd = function() {
    if (this.onFirstLoadChangesEnd) {
      this.onFirstLoadChangesEnd();
    }
  };

  CDocsCoApi.prototype.callback_OnConnectionStateChanged = function(e) {
    if (this.onConnectionStateChanged) {
      this.onConnectionStateChanged(e);
    }
  };

  CDocsCoApi.prototype.callback_OnSetIndexUser = function(e) {
    if (this.onSetIndexUser) {
      this.onSetIndexUser(e);
    }
  };
  CDocsCoApi.prototype.callback_OnSpellCheckInit = function(e) {
    if (this.onSpellCheckInit) {
      this.onSpellCheckInit(e);
    }
  };

  CDocsCoApi.prototype.callback_OnSaveChanges = function(e, userId, bFirstLoad) {
    if (this.onSaveChanges) {
      this.onSaveChanges(e, userId, bFirstLoad);
    }
  };
  CDocsCoApi.prototype.callback_OnStartCoAuthoring = function(e, isWaitAuth) {
    if (this.onStartCoAuthoring) {
      this.onStartCoAuthoring(e, isWaitAuth);
    }
  };
  CDocsCoApi.prototype.callback_OnEndCoAuthoring = function(e) {
    if (this.onEndCoAuthoring) {
      this.onEndCoAuthoring(e);
    }
  };

  CDocsCoApi.prototype.callback_OnUnSaveLock = function() {
    if (this.onUnSaveLock) {
      this.onUnSaveLock();
    }
  };

  CDocsCoApi.prototype.callback_OnRecalcLocks = function(e) {
    if (this.onRecalcLocks) {
      this.onRecalcLocks(e);
    }
  };
  CDocsCoApi.prototype.callback_OnDocumentOpen = function(e) {
    if (this.onDocumentOpen) {
      this.onDocumentOpen(e);
    }
  };
  CDocsCoApi.prototype.callback_OnFirstConnect = function() {
    if (this.onFirstConnect) {
      this.onFirstConnect();
    }
  };
  CDocsCoApi.prototype.callback_OnLicense = function(res) {
    if (this.onLicense) {
      this.onLicense(res);
    }
  };
  CDocsCoApi.prototype.callback_OnLicenseChanged = function(res) {
    if (this.onLicenseChanged) {
      this.onLicenseChanged(res);
    }
  };

  function LockBufferElement(arrayBlockId, callback) {
    this._arrayBlockId = arrayBlockId ? arrayBlockId.slice() : null;
    this._callback = callback;
  }

  function DocsCoApi(options) {
    if (options) {
      this.onAuthParticipantsChanged = options.onAuthParticipantsChanged;
      this.onParticipantsChanged = options.onParticipantsChanged;
      this.onMessage = options.onMessage;
      this.onServerVersion = options.onServerVersion;
      this.onCursor = options.onCursor;
      this.onMeta = options.onMeta;
      this.onSession =  options.onSession;
      this.onExpiredToken =  options.onExpiredToken;
	  this.onForceSave =  options.onForceSave;
      this.onHasForgotten =  options.onHasForgotten;
      this.onLocksAcquired = options.onLocksAcquired;
      this.onLocksReleased = options.onLocksReleased;
      this.onLocksReleasedEnd = options.onLocksReleasedEnd; // ToDo переделать на массив release locks
      this.onRelockFailed = options.onRelockFailed;
      this.onDisconnect = options.onDisconnect;
      this.onWarning = options.onWarning;
      this.onSetIndexUser = options.onSetIndexUser;
      this.onSpellCheckInit = options.onSpellCheckInit;
      this.onSaveChanges = options.onSaveChanges;
      this.onFirstLoadChangesEnd = options.onFirstLoadChangesEnd;
      this.onConnectionStateChanged = options.onConnectionStateChanged;
      this.onUnSaveLock = options.onUnSaveLock;
      this.onRecalcLocks = options.onRecalcLocks;
      this.onDocumentOpen = options.onDocumentOpen;
      this.onFirstConnect = options.onFirstConnect;
      this.onLicense = options.onLicense;
      this.onLicenseChanged = options.onLicenseChanged;
    }
    this._state = ConnectionState.None;
    // Online-пользователи в документе
    this._participants = {};
    this._participantsTimestamp;
    this._countEditUsers = 0;
    this._countUsers = 0;

    this.isLicenseInit = false;
    this._locks = {};
    this._msgBuffer = [];
    this._msgInputBuffer = [];
    this._lockCallbacks = {};
    this._lockCallbacksErrorTimerId = {};
    this._saveCallback = [];
    this.saveLockCallbackErrorTimeOutId = null;
    this.saveCallbackErrorTimeOutId = null;
    this.unSaveLockCallbackErrorTimeOutId = null;
    this._id = null;
    this._sessionTimeConnect = null;
	this._allChangesSaved = null;
	this._lastForceSaveButtonTime = null;
	this._lastForceSaveTimeoutTime = null;
    this._indexUser = -1;
    // Если пользователей больше 1, то совместно редактируем
    this.isCoAuthoring = false;
    // Мы сами отключились от совместного редактирования
    this.isCloseCoAuthoring = false;

    //websocket payload size is limited by https://github.com/faye/faye-websocket-node#initialization-options (64 MiB)
    //xhr payload size is limited by nginx param client_max_body_size (current 100MB)
    //"1.5MB" is choosen to avoid disconnect(after 25s) while downloading/uploading oversized changes with 0.5Mbps connection
    this.websocketMaxPayloadSize = 1572864;
    // Текущий индекс для колличества изменений
    this.currentIndex = 0;
    this.currentIndexEnd = 0;
    // Индекс, с которого мы начинаем сохранять изменения
    this.deleteIndex = 0;
    // Массив изменений
    this.arrayChanges = null;
    // Время последнего сохранения (для разрыва соединения)
    this.lastOtherSaveTime = -1;
	this.lastOwnSaveTime = -1;
    // Локальный индекс изменений
    this.changesIndex = 0;
    // Дополнительная информация для Excel
    this.excelAdditionalInfo = null;
    // Unlock document
    this.canUnlockDocument = false;
    // Release locks
    this.canReleaseLocks = false;

    this._url = "";

    this.reconnectTimeout = null;
    this.attemptCount = 0;
    this.maxAttemptCount = 50;
    this.reconnectInterval = 2000;
    this.errorTimeOut = 10000;
    this.errorTimeOutSave = 60000;	// ToDo стоит переделать это, т.к. могут дублироваться изменения...

    this._docid = null;
    this._documentCallbackUrl = null;
    this._token = null;
    this._user = null;
    this._userId = "Anonymous";
    this.ownedLockBlocks = [];
    this.sockjs_url = null;
    this.sockjs = null;
    this.editorType = -1;
    this._isExcel = false;
    this._isPresentation = false;
    this._isAuth = false;
    this._documentFormatSave = 0;
    this.mode = undefined;
    this.permissions = undefined;
    this.lang = undefined;
    this.jwtOpen = undefined;
    this.jwtSession = undefined;
    this.encrypted = undefined;
    this._isViewer = false;
    this._isReSaveAfterAuth = false;	// Флаг для сохранения после повторной авторизации (для разрыва соединения во время сохранения)
    this._lockBuffer = [];
    this._authChanges = [];
    this._authOtherChanges = [];
  }

  DocsCoApi.prototype.isRightURL = function() {
    return ("" != this._url);
  };

  DocsCoApi.prototype.set_url = function(url) {
    this._url = url;
  };

  DocsCoApi.prototype.get_state = function() {
    return this._state;
  };

	DocsCoApi.prototype.check_state = function () {
		return ConnectionState.Authorized === this._state || ConnectionState.SaveChanges === this._state ||
			ConnectionState.AskSaveChanges === this._state;
	};

  DocsCoApi.prototype.get_indexUser = function() {
    return this._indexUser;
  };

  DocsCoApi.prototype.get_isAuth = function() {
    return this._isAuth;
  };

  DocsCoApi.prototype.get_jwt = function() {
    return this.jwtSession || this.jwtOpen;
  };

  DocsCoApi.prototype.getSessionId = function() {
    return this._id;
  };

  DocsCoApi.prototype.getUserConnectionId = function() {
    return this._userId;
  };

  DocsCoApi.prototype.getLocks = function() {
    return this._locks;
  };

  DocsCoApi.prototype._sendBufferedLocks = function() {
    var elem;
    for (var i = 0, length = this._lockBuffer.length; i < length; ++i) {
      elem = this._lockBuffer[i];
      this.askLock(elem._arrayBlockId, elem._callback);
    }
    this._lockBuffer = [];
  };

  DocsCoApi.prototype.askLock = function(arrayBlockId, callback) {
    if (ConnectionState.SaveChanges === this._state || ConnectionState.AskSaveChanges === this._state) {
      // Мы в режиме сохранения. Lock-и запросим после окончания.
      this._lockBuffer.push(new LockBufferElement(arrayBlockId, callback));
      return;
    }

    // ask all elements in array
    var t = this;
    var i = 0;
    var lengthArray = (arrayBlockId) ? arrayBlockId.length : 0;
    var isLock = false;
    var idLockInArray = null;
    for (; i < lengthArray; ++i) {
      idLockInArray = (this._isExcel || this._isPresentation) ? arrayBlockId[i]['guid'] : arrayBlockId[i];
      if (this._locks[idLockInArray] && 0 !== this._locks[idLockInArray].state) {
        isLock = true;
        break;
      }
    }
    if (0 === lengthArray) {
      isLock = true;
    }

    idLockInArray = (this._isExcel || this._isPresentation) ? arrayBlockId[0]['guid'] : arrayBlockId[0];

    if (!isLock) {
      if (this._lockCallbacksErrorTimerId.hasOwnProperty(idLockInArray)) {
        // Два раза для одного id нельзя запрашивать lock, не дождавшись ответа
        return;
      }
      //Ask
      this._locks[idLockInArray] = {'state': 1};//1-asked for block
      if (callback) {
        this._lockCallbacks[idLockInArray] = callback;

        //Set reconnectTimeout
        this._lockCallbacksErrorTimerId[idLockInArray] = window.setTimeout(function() {
          if (t._lockCallbacks.hasOwnProperty(idLockInArray)) {
            //Not signaled already
            t._lockCallbacks[idLockInArray]({error: 'Timed out'});
            delete t._lockCallbacks[idLockInArray];
            delete t._lockCallbacksErrorTimerId[idLockInArray];
          }
        }, this.errorTimeOut);
      }
      this._send({"type": 'getLock', 'block': arrayBlockId});
    } else {
      // Вернем ошибку, т.к. залочены элементы
      window.setTimeout(function() {
        if (callback) {
          callback({error: idLockInArray + '-lock'});
        }
      }, 100);
    }
  };

  DocsCoApi.prototype.askSaveChanges = function(callback) {
    if (this._saveCallback[this._saveCallback.length - 1]) {
      // Мы еще не отработали старый callback и ждем ответа
      return;
    }

    // Очищаем предыдущий таймер
    if (null !== this.saveLockCallbackErrorTimeOutId) {
      clearTimeout(this.saveLockCallbackErrorTimeOutId);
    }

    // Проверим состояние, если мы не подсоединились, то сразу отправим ошибку
    if (ConnectionState.Authorized !== this._state) {
      this.saveLockCallbackErrorTimeOutId = window.setTimeout(function() {
        if (callback) {
          // Фиктивные вызовы
          callback({error: "No connection"});
        }
      }, 100);
      return;
    }
    if (callback) {
      var t = this;
      var indexCallback = this._saveCallback.length;
      this._saveCallback[indexCallback] = callback;

      //Set reconnectTimeout
      this.saveLockCallbackErrorTimeOutId = window.setTimeout(function() {
        t.saveLockCallbackErrorTimeOutId = null;
        var oTmpCallback = t._saveCallback[indexCallback];
        if (oTmpCallback) {
          t._saveCallback[indexCallback] = null;
          //Not signaled already
          oTmpCallback({error: "Timed out"});
          t._state = ConnectionState.Authorized;
          // Делаем отложенные lock-и
          t._sendBufferedLocks();
        }
      }, this.errorTimeOut);
    }
    this._state = ConnectionState.AskSaveChanges;
    this._send({"type": "isSaveLock"});
  };

  DocsCoApi.prototype.unSaveLock = function() {
    // ToDo при разрыве соединения нужно перестать делать unSaveLock!
    var t = this;
    this.unSaveLockCallbackErrorTimeOutId = window.setTimeout(function() {
      t.unSaveLockCallbackErrorTimeOutId = null;
      t.unSaveLock();
    }, this.errorTimeOut);
    this._send({"type": "unSaveLock"});
  };

  DocsCoApi.prototype.releaseLocks = function(blockId) {
    if (this._locks[blockId] && 2 === this._locks[blockId].state /*lock is ours*/) {
      //Ask
      this._locks[blockId] = {"state": 0};//0-released
    }
  };

  DocsCoApi.prototype._reSaveChanges = function(reSaveType) {
    this.saveChanges(this.arrayChanges, this.currentIndex, undefined, undefined, reSaveType);
  };

  DocsCoApi.prototype.saveChanges = function(arrayChanges, currentIndex, deleteIndex, excelAdditionalInfo, reSave) {
    if (null === currentIndex) {
      this.deleteIndex = deleteIndex;
      if (null != this.deleteIndex && -1 !== this.deleteIndex) {
        this.deleteIndex += this.changesIndex;
      }
      this.currentIndex = 0;
      this.arrayChanges = arrayChanges;
      this.excelAdditionalInfo = excelAdditionalInfo;
    } else {
      this.currentIndex = currentIndex;
    }
    var startIndex, endIndex;
    startIndex = endIndex = this.currentIndex;
    var curBytes = 0;
    for (; endIndex < arrayChanges.length && curBytes < this.websocketMaxPayloadSize; ++endIndex) {
      curBytes += arrayChanges[endIndex].length + 9;//9 - for JSON overhead + escape
    }
    this.currentIndexEnd = endIndex;
    if (endIndex === arrayChanges.length) {
      for (var key in this._locks) if (this._locks.hasOwnProperty(key)) {
        if (2 === this._locks[key].state /*lock is ours*/) {
          delete this._locks[key];
        }
      }
    }

    //Set errorTimeout
    var t = this;
    this.saveCallbackErrorTimeOutId = window.setTimeout(function() {
      t.saveCallbackErrorTimeOutId = null;
      t._reSaveChanges(1);
    }, this.errorTimeOutSave);

    // Выставляем состояние сохранения
    this._state = ConnectionState.SaveChanges;

    this._send({'type': 'saveChanges', 'changes': JSON.stringify(arrayChanges.slice(startIndex, endIndex)),
      'startSaveChanges': (startIndex === 0), 'endSaveChanges': (endIndex === arrayChanges.length),
      'isCoAuthoring': this.isCoAuthoring, 'isExcel': this._isExcel, 'deleteIndex': this.deleteIndex,
      'excelAdditionalInfo': this.excelAdditionalInfo ? JSON.stringify(this.excelAdditionalInfo) : null,
        'unlock': this.canUnlockDocument, 'releaseLocks': this.canReleaseLocks, 'reSave': reSave});
  };

  DocsCoApi.prototype.unLockDocument = function(isSave, deleteIndex) {
    this.deleteIndex = deleteIndex;
    if (null != this.deleteIndex && -1 !== this.deleteIndex) {
      this.deleteIndex += this.changesIndex;
    }
    this._send({'type': 'unLockDocument', 'isSave': isSave, 'unlock': this.canUnlockDocument,
      'deleteIndex': this.deleteIndex, 'releaseLocks': this.canReleaseLocks});
  };

  DocsCoApi.prototype.getUsers = function() {
    // Специально для возможности получения после прохождения авторизации (Стоит переделать)
    if (this.onAuthParticipantsChanged) {
      this.onAuthParticipantsChanged(this._participants, this._userId);
    }
  };

  DocsCoApi.prototype.disconnect = function(opt_code, opt_reason) {
    // Отключаемся сами
    this.isCloseCoAuthoring = true;
    if (opt_code) {
      this.sockjs.close(opt_code, opt_reason);
    } else {
      this._send({"type": "close"});
      this._state = ConnectionState.ClosedCoAuth;
    }
  };

  DocsCoApi.prototype.extendSession = function(idleTime) {
    this._send({'type': 'extendSession', 'idletime': idleTime});
  };

  DocsCoApi.prototype.versionHistory = function(data) {
    this._send({'type': 'versionHistory', 'cmd': data});
  };

	DocsCoApi.prototype.forceSave = function() {
        var res = false;
		var newForceSaveButtonTime = Math.max(this.lastOtherSaveTime, this.lastOwnSaveTime);
		if (this._lastForceSaveButtonTime < newForceSaveButtonTime) {
			this._lastForceSaveButtonTime = newForceSaveButtonTime;
			this._send({'type': 'forceSaveStart'});
            res = true;
		}
		return res;
	};

  DocsCoApi.prototype.openDocument = function(data) {
    this._send({"type": "openDocument", "message": data});
  };

  DocsCoApi.prototype.sendRawData = function(data) {
    this._sendRaw(data);
  };

  DocsCoApi.prototype.getMessages = function() {
    this._send({"type": "getMessages"});
  };

  DocsCoApi.prototype.sendMessage = function(message) {
    if (typeof message === 'string') {
      this._send({"type": "message", "message": message});
    }
  };

  DocsCoApi.prototype.sendCursor = function(cursor) {
    if (typeof cursor === 'string') {
      this._send({"type": "cursor", "cursor": cursor});
    }
  };

  DocsCoApi.prototype.sendChangesError = function(data) {
    if (typeof data === 'string') {
      this._send({'type': 'changesError', 'stack': data});
    }
  };

  DocsCoApi.prototype._applyPrebuffered = function () {
    for (var i = 0; i < this._msgInputBuffer.length; ++i) {
      this._msgInputBuffer[i]();
    }
    this._msgInputBuffer = [];
  };
  DocsCoApi.prototype._sendPrebuffered = function() {
    for (var i = 0; i < this._msgBuffer.length; i++) {
      this._sendRaw(this._msgBuffer[i]);
    }
    this._msgBuffer = [];
  };

  DocsCoApi.prototype._send = function(data, useEncryption) {
    if (!useEncryption && data && data["type"] == "saveChanges" && AscCommon.EncryptionWorker && AscCommon.EncryptionWorker.isInit())
      return AscCommon.EncryptionWorker.sendChanges(this, data, AscCommon.EncryptionMessageType.Encrypt);

    if (data !== null && typeof data === "object") {
      if (this._state > 0) {
        this.sockjs.send(JSON.stringify(data));
      } else {
        this._msgBuffer.push(JSON.stringify(data));
      }
    }
  };

  DocsCoApi.prototype._sendRaw = function(data) {
    if (data !== null && typeof data === "string") {
      if (this._state > 0) {
        this.sockjs.send(data);
      } else {
        this._msgBuffer.push(data);
      }
    }
  };

  DocsCoApi.prototype._onMessages = function(data, clear) {
    if (this.check_state() && data["messages"] && this.onMessage) {
      this.onMessage(data["messages"], clear);
    }
  };

  DocsCoApi.prototype._onServerVersion = function (data) {
  	if (this.onServerVersion) {
		this.onServerVersion(data['buildVersion'], data['buildNumber']);
	}
  };

  DocsCoApi.prototype._onCursor = function(data) {
    if (this.check_state() && data["messages"] && this.onCursor) {
      this.onCursor(data["messages"]);
    }
  };

  DocsCoApi.prototype._onMeta = function(data) {
    if (data["messages"] && this.onMeta) {
      this.onMeta(data["messages"]);
    }
  };

  DocsCoApi.prototype._onSession = function(data) {
    if (this.check_state() && data["messages"] && this.onSession) {
      this.onSession(data["messages"]);
    }
  };

  DocsCoApi.prototype._onExpiredToken = function(data) {
    if (this.onExpiredToken) {
      this.onExpiredToken(data);
    }
  };

  DocsCoApi.prototype._onHasForgotten = function(data) {
    if (this.onHasForgotten) {
      this.onHasForgotten();
    }
  };

  DocsCoApi.prototype._onRefreshToken = function(jwt) {
    this.jwtOpen = undefined;
    if (jwt) {
      this.jwtSession = jwt;
    }
  };

	DocsCoApi.prototype._onForceSaveStart = function(data) {
	    var code = data['code'];
		if (code === c_oAscServerCommandErrors.NoError) {
			this._lastForceSaveButtonTime = data['time'];
            this.onForceSave({type: c_oAscForceSaveTypes.Button, start: true});
        } else if (code === c_oAscServerCommandErrors.NotModified) {
            this.onForceSave({type: c_oAscForceSaveTypes.Button, refuse: true});
		} else {
			this.onWarning(Asc.c_oAscError.ID.Unknown);
		}
	};
	DocsCoApi.prototype._onForceSave = function(data) {
        var type = data['type'];
		if (c_oAscForceSaveTypes.Button === type) {
			if (this._lastForceSaveButtonTime == data['time']) {
				this.onForceSave({type: type, success: data['success']});
			}
		} else {
			if (data['start']) {
                this.onForceSave({type: type, start: true});
				this._lastForceSaveTimeoutTime = data['time'];
			} else {
				if (this._lastForceSaveTimeoutTime == data['time']) {
					this.onForceSave({type: type, success: data['success']});
				}
			}
		}
	};

  DocsCoApi.prototype._onGetLock = function(data) {
    if (this.check_state() && data["locks"]) {
      for (var key in data["locks"]) {
        if (data["locks"].hasOwnProperty(key)) {
          var lock = data["locks"][key], blockTmp = (this._isExcel || this._isPresentation) ? lock["block"]["guid"] : key, blockValue = (this._isExcel || this._isPresentation) ? lock["block"] : key;
          if (lock !== null) {
            var changed = true;
            if (this._locks[blockTmp] && 1 !== this._locks[blockTmp].state /*asked for it*/) {
              //Exists
              //Check lock state
              changed = !(this._locks[blockTmp].state === (lock["user"] === this._userId ? 2 : 3) && this._locks[blockTmp]["user"] === lock["user"] && this._locks[blockTmp]["time"] === lock["time"] && this._locks[blockTmp]["block"] === blockTmp);
            }

            if (changed) {
              this._locks[blockTmp] = {"state": lock["user"] === this._userId ? 2 : 3, "user": lock["user"], "time": lock["time"], "block": blockTmp, "blockValue": blockValue};//2-acquired by me!
            }
            if (this._lockCallbacks.hasOwnProperty(blockTmp)) {
              if (lock["user"] === this._userId) {
                //Do call back
                this._lockCallbacks[blockTmp]({"lock": this._locks[blockTmp]});
              } else {
                this._lockCallbacks[blockTmp]({"error": "Already locked by " + lock["user"]});
              }
              if (this._lockCallbacksErrorTimerId.hasOwnProperty(blockTmp)) {
                clearTimeout(this._lockCallbacksErrorTimerId[blockTmp]);
                delete this._lockCallbacksErrorTimerId[blockTmp];
              }
              delete this._lockCallbacks[blockTmp];
            }
            if (this.onLocksAcquired && changed) {
              this.onLocksAcquired(this._locks[blockTmp]);
            }
          }
        }
      }
    }
  };

  DocsCoApi.prototype._onReleaseLock = function(data) {
    if (this.check_state() && data["locks"]) {
      var bSendEnd = false;
      for (var block in data["locks"]) {
        if (data["locks"].hasOwnProperty(block)) {
          var lock = data["locks"][block], blockTmp = (this._isExcel || this._isPresentation) ? lock["block"]["guid"] : lock["block"];
          if (lock !== null) {
            this._locks[blockTmp] = {"state": 0, "user": lock["user"], "time": lock["time"], "changes": lock["changes"], "block": lock["block"]};
            if (this.onLocksReleased) {
              // false - user not save changes
              this.onLocksReleased(this._locks[blockTmp], false);
              bSendEnd = true;
            }
          }
        }
      }
      if (bSendEnd && this.onLocksReleasedEnd) {
        this.onLocksReleasedEnd();
      }
    }
  };

  DocsCoApi.prototype._documentOpen = function(data) {
    this.onDocumentOpen(data);
  };

  DocsCoApi.prototype._onSaveChanges = function(data, useEncryption) {
    if (!this.check_state()) {
      if (!this.get_isAuth()) {
        this._authOtherChanges.push(data);
      }
      return;
    }
    if (!useEncryption && AscCommon.EncryptionWorker && AscCommon.EncryptionWorker.isInit())
      return AscCommon.EncryptionWorker.sendChanges(this, data, AscCommon.EncryptionMessageType.Decrypt);
    if (data["locks"]) {
      var bSendEnd = false;
      for (var block in data["locks"]) {
        if (data["locks"].hasOwnProperty(block)) {
          var lock = data["locks"][block], blockTmp = (this._isExcel || this._isPresentation) ? lock["block"]["guid"] : lock["block"];
          if (lock !== null) {
            this._locks[blockTmp] = {"state": 0, "user": lock["user"], "time": lock["time"], "changes": lock["changes"], "block": lock["block"]};
            if (this.onLocksReleased) {
              // true - lock with save
              this.onLocksReleased(this._locks[blockTmp], true);
              bSendEnd = true;
            }
          }
        }
      }
      if (bSendEnd && this.onLocksReleasedEnd) {
        this.onLocksReleasedEnd();
      }
    }
    this._updateChanges(data["changes"], data["changesIndex"], false);

    if (this.onRecalcLocks) {
      this.onRecalcLocks(data["excelAdditionalInfo"]);
    }
  };

  DocsCoApi.prototype._onStartCoAuthoring = function(isStartEvent, isWaitAuth) {
    if (isWaitAuth && false === this.isCoAuthoring && !this.onStartCoAuthoring) {
      var errorMsg = 'Error: connection state changed waitAuth' +
          ';this.onStartCoAuthoring:' + !!this.onStartCoAuthoring;
      this.sendChangesError(errorMsg);
    }
    if (false === this.isCoAuthoring) {
      this.isCoAuthoring = true;
      if (this.onStartCoAuthoring) {
        this.onStartCoAuthoring(isStartEvent, isWaitAuth);
      }
    } else if (isWaitAuth) {
      //it is a stub for unexpected situation(no direct reproduce scenery)
      //isCoAuthoring is true when more then one editor, but isWaitAuth mean than server has one editor
      this.canUnlockDocument = true;
      this.unLockDocument(false);
    }
  };

  DocsCoApi.prototype._onEndCoAuthoring = function(isStartEvent) {
    if (true === this.isCoAuthoring) {
      this.isCoAuthoring = false;
      if (this.onEndCoAuthoring) {
        this.onEndCoAuthoring(isStartEvent);
      }
    }
  };

	DocsCoApi.prototype._onSaveLock = function (data) {
		if (null != data["saveLock"]) {
			var indexCallback = this._saveCallback.length - 1;
			var oTmpCallback = this._saveCallback[indexCallback];
			if (oTmpCallback) {
				// Очищаем предыдущий таймер
				if (null !== this.saveLockCallbackErrorTimeOutId) {
					clearTimeout(this.saveLockCallbackErrorTimeOutId);
					this.saveLockCallbackErrorTimeOutId = null;
				}

				this._saveCallback[indexCallback] = null;
				oTmpCallback(data);
			}
		}
		if (null == data["saveLock"] || data['error'] || data["saveLock"]) {
			this._state = ConnectionState.Authorized;
			// Делаем отложенные lock-и
			this._sendBufferedLocks();
		}
	};

  DocsCoApi.prototype._onUnSaveLock = function(data) {
    // Очищаем предыдущий таймер сохранения
    if (null !== this.saveCallbackErrorTimeOutId) {
      clearTimeout(this.saveCallbackErrorTimeOutId);
      this.saveCallbackErrorTimeOutId = null;
    }
    // Очищаем предыдущий таймер снятия блокировки
    if (null !== this.unSaveLockCallbackErrorTimeOutId) {
      clearTimeout(this.unSaveLockCallbackErrorTimeOutId);
      this.unSaveLockCallbackErrorTimeOutId = null;
    }

    // Возвращаем состояние
    this._state = ConnectionState.Authorized;

    // Делаем отложенные lock-и
    this._sendBufferedLocks();

    if (-1 !== data['index']) {
      this.changesIndex = data['index'];
    }
	
    if (-1 !== data['time']) {
      this.lastOwnSaveTime = data['time'];
    }
	
    if (this.onUnSaveLock) {
      this.onUnSaveLock();
    }
  };

  DocsCoApi.prototype._updateChanges = function(allServerChanges, changesIndex, bFirstLoad) {
    if (this.onSaveChanges) {
      this.changesIndex = changesIndex;
      if (allServerChanges) {
        for (var i = 0; i < allServerChanges.length; ++i) {
          var change = allServerChanges[i];
          var changesOneUser = change['change'];
          if (changesOneUser) {
            if (change['user'] !== this._userId) {
              this.lastOtherSaveTime = change['time'];
            }
            this.onSaveChanges(JSON.parse(changesOneUser), change['useridoriginal'], bFirstLoad);
          }
        }
      }
    }
  };

  DocsCoApi.prototype._onSetIndexUser = function(data) {
    if (this.onSetIndexUser) {
      this.onSetIndexUser(data);
    }
  };
  DocsCoApi.prototype._onSpellCheckInit = function(data) {
    if (this.onSpellCheckInit) {
      this.onSpellCheckInit(data);
    }
  };

  DocsCoApi.prototype._onSavePartChanges = function(data) {
    // Очищаем предыдущий таймер
    if (null !== this.saveCallbackErrorTimeOutId) {
      clearTimeout(this.saveCallbackErrorTimeOutId);
      this.saveCallbackErrorTimeOutId = null;
    }

    if (-1 !== data['changesIndex']) {
      this.changesIndex = data['changesIndex'];
    }

    this.saveChanges(this.arrayChanges, this.currentIndexEnd);
  };

  DocsCoApi.prototype._onPreviousLocks = function(locks, previousLocks) {
    var i = 0;
    if (locks && previousLocks) {
      for (var block in locks) {
        if (locks.hasOwnProperty(block)) {
          var lock = locks[block];
          if (lock !== null && lock["block"]) {
            //Find in previous
            for (i = 0; i < previousLocks.length; i++) {
              if (previousLocks[i] === lock["block"] && lock["user"] === this._userId) {
                //Lock is ours
                previousLocks.remove(i);
                break;
              }
            }
          }
        }
      }
      if (previousLocks.length > 0 && this.onRelockFailed) {
        this.onRelockFailed(previousLocks);
      }
      previousLocks = [];
    }
  };

  DocsCoApi.prototype._onParticipantsChanged = function(participants, needChanged) {
    var participantsNew = {};
    var countEditUsersNew = 0;
    var countUsersNew = 0;
    var tmpUser;
    var i;
    var usersStateChanged = [];
    if (participants) {
      for (i = 0; i < participants.length; ++i) {
        tmpUser = new AscCommon.asc_CUser(participants[i]);
        participantsNew[tmpUser.asc_getId()] = tmpUser;
        if (!tmpUser.asc_getView()) {
          ++countEditUsersNew;
        }
        ++countUsersNew;
      }
    }
    if (needChanged) {
      for (i in participantsNew) {
        if (!this._participants[i]) {
          tmpUser = participantsNew[i];
          tmpUser.setState(true);
          usersStateChanged.push(tmpUser);
        }
      }
      for (i in this._participants) {
        if (!participantsNew[i]) {
          tmpUser = this._participants[i];
          tmpUser.setState(false);
          usersStateChanged.push(tmpUser);
        }
      }
    }
    this._participants = participantsNew;
    this._countEditUsers = countEditUsersNew;
    this._countUsers = countUsersNew;
    return usersStateChanged;
  };
  DocsCoApi.prototype._onAuthParticipantsChanged = function(participants) {
    this._participants = {};
    this._countEditUsers = 0;
    this._countUsers = 0;

    if (participants) {
      this._onParticipantsChanged(participants);

      if (this.onAuthParticipantsChanged) {
        this.onAuthParticipantsChanged(this._participants, this._userId);
      }

      // Посылаем эвент о совместном редактировании
      if (1 < this._countEditUsers) {
        this._onStartCoAuthoring(/*isStartEvent*/true);
      } else {
        this._onEndCoAuthoring(/*isStartEvent*/true);
      }
    }
  };

  DocsCoApi.prototype._onConnectionStateChanged = function(data) {
    var t = this;
    if (!this.check_state()) {
      this._msgInputBuffer.push(function () {
        t._onConnectionStateChanged(data);
      });
      return;
    }
    var isWaitAuth = data['waitAuth'];
    var usersStateChanged;
    if(isWaitAuth && !(this.onConnectionStateChanged && (!this._participantsTimestamp || this._participantsTimestamp <= data['participantsTimestamp']))) {
      var errorMsg = 'Error: connection state changed waitAuth' +
          ';onConnectionStateChanged:' + !!this.onConnectionStateChanged +
          ';this._participantsTimestamp:' + this._participantsTimestamp +
          ';data.participantsTimestamp:' + data['participantsTimestamp'];
      this.sendChangesError(errorMsg);
    }
    if (this.onConnectionStateChanged && (!this._participantsTimestamp || this._participantsTimestamp <= data['participantsTimestamp'])) {
      this._participantsTimestamp = data['participantsTimestamp'];
      usersStateChanged = this._onParticipantsChanged(data['participants'], true);

      if (isWaitAuth && !(usersStateChanged.length > 0 && 1 < this._countEditUsers)) {
        var errorMsg = 'Error: connection state changed waitAuth' +
            ';usersStateChanged:' + JSON.stringify(usersStateChanged) +
            ';this._countEditUsers:' + this._countEditUsers;
        this.sendChangesError(errorMsg);
      }
      if (usersStateChanged.length > 0) {
        // Посылаем эвент о совместном редактировании
        if (1 < this._countEditUsers) {
          this._onStartCoAuthoring(/*isStartEvent*/false, isWaitAuth);
        } else {
          this._onEndCoAuthoring(/*isStartEvent*/false);
        }

        this.onParticipantsChanged(this._participants);
        for (var i = 0; i < usersStateChanged.length; ++i) {
          this.onConnectionStateChanged(usersStateChanged[i]);
        }
      }
    }
  };

  DocsCoApi.prototype._onLicenseChanged = function (data) {
    this.onLicenseChanged(data['licenseType']);
  };

  DocsCoApi.prototype._onDrop = function(data) {
    this.disconnect();
    var code = data && data['code'] || c_oCloseCode.drop;
    this.onDisconnect(data ? data['description'] : '', code);
  };

  DocsCoApi.prototype._onWarning = function(data) {
    this.onWarning(Asc.c_oAscError.ID.Warning);
  };

  DocsCoApi.prototype._onLicense = function(data) {
    if (!this.isLicenseInit) {
      this.isLicenseInit = true;
      this.onLicense(data['license']);
    }
  };

  DocsCoApi.prototype._onAuth = function(data) {
    var t = this;
    this._onRefreshToken(data['jwt']);
    if (true === this._isAuth) {
      this._state = ConnectionState.Authorized;
      // Мы должны только соединиться для получения файла. Совместное редактирование уже было отключено.
      if (this.isCloseCoAuthoring) {
		  return;
	  }

	  this._onServerVersion(data);

      this._onLicenseChanged(data);
      // Мы уже авторизовывались, нужно обновить пользователей (т.к. пользователи могли входить и выходить пока у нас не было соединения)
      this._onAuthParticipantsChanged(data['participants']);

      //if (this.ownedLockBlocks && this.ownedLockBlocks.length > 0) {
      //	this._onPreviousLocks(data["locks"], this.ownedLockBlocks);
      //}
      this._onMessages(data, true);
      this._onGetLock(data);

      //Apply prebuffered
      this._applyPrebuffered();

      if (this._isReSaveAfterAuth) {
        this._isReSaveAfterAuth = false;
        var callbackAskSaveChanges = function(e) {
          if (false === e["saveLock"]) {
            t._reSaveChanges(2);
          } else {
            setTimeout(function() {
              t.askSaveChanges(callbackAskSaveChanges);
            }, 1000);
          }
        };
        this.askSaveChanges(callbackAskSaveChanges);
      }

      return;
    }
    if (data['result'] === 1) {
      // Выставляем флаг, что мы уже авторизовывались
      this._isAuth = true;

      //TODO: add checks
      this._state = ConnectionState.Authorized;
      this._id = data['sessionId'];
      this._indexUser = data['indexUser'];
      this._userId = this._user.asc_getId() + this._indexUser;
      this._sessionTimeConnect = data['sessionTimeConnect'];
      if (data['settings']) {
        if (data['settings']['reconnection']) {
          this.maxAttemptCount = data['settings']['reconnection']['attempts'];
          this.reconnectInterval = data['settings']['reconnection']['delay'];
        }
        if (data['settings']['websocketMaxPayloadSize']) {
          this.websocketMaxPayloadSize = data['settings']['websocketMaxPayloadSize'];
        }
      }
      this._onLicenseChanged(data);
      this._onAuthParticipantsChanged(data['participants']);

      this._onSpellCheckInit(data['g_cAscSpellCheckUrl']);
      this._onSetIndexUser(this._indexUser);

      this._onMessages(data, false);
      this._onGetLock(data);
      if (data['hasForgotten']) {
        this._onHasForgotten();
      }

      // Применения изменений пользователя
      if (window['AscApplyChanges'] && window['AscChanges']) {
        var userOfflineChanges = window['AscChanges'], changeOneUser;
        for (var i = 0; i < userOfflineChanges.length; ++i) {
          changeOneUser = userOfflineChanges[i];
          for (var j = 0; j < changeOneUser.length; ++j)
            this.onSaveChanges(changeOneUser[j], null, true);
        }
      }
      this._updateAuthChanges();
      // Посылать нужно всегда, т.к. на это рассчитываем при открытии
      if (this.onFirstLoadChangesEnd) {
        this.onFirstLoadChangesEnd();
      }

      //Apply prebuffered
      this._applyPrebuffered();

      //Send prebuffered
      this._sendPrebuffered();
    }
    //TODO: Add errors
  };
  DocsCoApi.prototype._onAuthChanges = function(data) {
    this._authChanges.push(data["changes"]);
  };
  DocsCoApi.prototype._updateAuthChanges = function() {
    //todo apply changes with chunk on arrival
    var changesIndex = 0, i, changes, data, indexDiff;
    for (i = 0; i < this._authChanges.length; ++i) {
      changes = this._authChanges[i];
      changesIndex += changes.length;
      this._updateChanges(changes, changesIndex, true);
    }
    this._authChanges = [];
    for (i = 0; i < this._authOtherChanges.length; ++i) {
      data = this._authOtherChanges[i];
      indexDiff = data["changesIndex"] - changesIndex;
      if (indexDiff > 0) {
        if (indexDiff >= data["changes"].length) {
          changes = data["changes"];
        } else {
          changes = data["changes"].splice(data["changes"].length - indexDiff, indexDiff);
        }
        changesIndex += changes.length;
        this._updateChanges(changes, changesIndex, true);
      }
    }
    this._authOtherChanges = [];
  };

  DocsCoApi.prototype.init = function(user, docid, documentCallbackUrl, token, editorType, documentFormatSave, docInfo) {
    this._user = user;
    this._docid = null;
    this._documentCallbackUrl = documentCallbackUrl;
    this._token = token;
    this.ownedLockBlocks = [];
    this.sockjs_url = null;
    this.editorType = editorType;
    this._isExcel = c_oEditorId.Spreadsheet === editorType;
    this._isPresentation = c_oEditorId.Presentation === editorType;
    this._isAuth = false;
    this._documentFormatSave = documentFormatSave;
	this.mode = docInfo.get_Mode();
	this.permissions = docInfo.get_Permissions();
	this.lang = docInfo.get_Lang();
	this.jwtOpen = docInfo.get_Token();
    this.encrypted = docInfo.get_Encrypted();

    this.setDocId(docid);
    this._initSocksJs();
  };
  DocsCoApi.prototype.getDocId = function() {
    return this._docid;
  };
  DocsCoApi.prototype.setDocId = function(docid) {
    //todo возможно надо менять sockjs_url
    this._docid = docid;
    this.sockjs_url = AscCommon.getBaseUrl() + '../../../../doc/' + docid + '/c';
  };
  // Авторизация (ее нужно делать после выставления состояния редактора view-mode)
  DocsCoApi.prototype.auth = function(isViewer, opt_openCmd, opt_isIdle) {
    this._isViewer = isViewer;
    if (this._locks) {
      this.ownedLockBlocks = [];
      //If we already have locks
      for (var block in this._locks) if (this._locks.hasOwnProperty(block)) {
        var lock = this._locks[block];
        if (lock["state"] === 2) {
          //Our lock.
          this.ownedLockBlocks.push(lock["blockValue"]);
        }
      }
      this._locks = {};
    }
    this._send({
      'type': 'auth',
      'docid': this._docid,
      'documentCallbackUrl': this._documentCallbackUrl,
      'token': this._token,
      'user': {
        'id': this._user.asc_getId(),
        'username': this._user.asc_getUserName(),
        'firstname': this._user.asc_getFirstName(),
        'lastname': this._user.asc_getLastName(),
        'indexUser': this._indexUser
      },
      'editorType': this.editorType,
      'lastOtherSaveTime': this.lastOtherSaveTime,
      'block': this.ownedLockBlocks,
      'sessionId': this._id,
	  'sessionTimeConnect': this._sessionTimeConnect,
      'sessionTimeIdle': opt_isIdle >= 0 ? opt_isIdle : 0,
      'documentFormatSave': this._documentFormatSave,
      'view': this._isViewer,
      'isCloseCoAuthoring': this.isCloseCoAuthoring,
      'openCmd': opt_openCmd,
      'lang': this.lang,
      'mode': this.mode,
      'permissions': this.permissions,
      'encrypted': this.encrypted,
      'jwtOpen': this.jwtOpen,
      'jwtSession': this.jwtSession
    });
  };

	DocsCoApi.prototype._initSocksJs = function () {
		var t = this;
		var sockjs;
		if (window['IS_NATIVE_EDITOR']) {
			sockjs = this.sockjs = window['SockJS'];
			sockjs.open();
		} else {
			//ограничиваем transports WebSocket и XHR / JSONP polling, как и engine.io https://github.com/socketio/engine.io
			//при переборе streaming transports у клиента с wirewall происходило зацикливание(не повторялось в версии sock.js 0.3.4)
			sockjs = this.sockjs = new (AscCommon.getSockJs())(this.sockjs_url, null,
				{'transports': ['websocket', 'xdr-polling', 'xhr-polling', 'iframe-xhr-polling', 'jsonp-polling']});

			sockjs.onopen = function () {
				t._onServerOpen();
			};
			sockjs.onmessage = function (e) {
				t._onServerMessage(e.data);
			};
			sockjs.onclose = function (e) {
				t._onServerClose(e);
			};
        }

		return sockjs;
	};

	DocsCoApi.prototype._onServerOpen = function () {
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			this.reconnectTimeout = null;
			this.attemptCount = 0;
		}

		this._state = ConnectionState.WaitAuth;
		this.onFirstConnect();
	};
	DocsCoApi.prototype._onServerMessage = function (data) {
		//TODO: add checks and error handling
		//Get data type
		var dataObject = JSON.parse(data);
		switch (dataObject['type']) {
			case 'auth'        :
				this._onAuth(dataObject);
				break;
			case 'message'      :
				this._onMessages(dataObject, false);
				break;
			case 'cursor'       :
				this._onCursor(dataObject);
				break;
			case 'meta' :
				this._onMeta(dataObject);
				break;
			case 'getLock'      :
				this._onGetLock(dataObject);
				break;
			case 'releaseLock'    :
				this._onReleaseLock(dataObject);
				break;
			case 'connectState'    :
				this._onConnectionStateChanged(dataObject);
				break;
			case 'saveChanges'    :
				this._onSaveChanges(dataObject);
				break;
			case 'authChanges' :
				this._onAuthChanges(dataObject);
				break;
			case 'saveLock'      :
				this._onSaveLock(dataObject);
				break;
			case 'unSaveLock'    :
				this._onUnSaveLock(dataObject);
				break;
			case 'savePartChanges'  :
				this._onSavePartChanges(dataObject);
				break;
			case 'drop'        :
				this._onDrop(dataObject);
				break;
			case 'waitAuth'      : /*Ждем, когда придет auth, документ залочен*/
				break;
			case 'error'      : /*Старая версия sdk*/
				this._onDrop(dataObject);
				break;
			case 'documentOpen'    :
				this._documentOpen(dataObject);
				break;
			case 'warning':
				this._onWarning(dataObject);
				break;
			case 'license':
				this._onLicense(dataObject);
				break;
			case 'session' :
				this._onSession(dataObject);
				break;
			case 'refreshToken' :
				this._onRefreshToken(dataObject["messages"]);
				break;
			case 'expiredToken' :
				this._onExpiredToken(dataObject);
				break;
			case 'forceSaveStart' :
				this._onForceSaveStart(dataObject["messages"]);
				break;
			case 'forceSave' :
				this._onForceSave(dataObject["messages"]);
				break;
		}
	};
	DocsCoApi.prototype._onServerClose = function (evt) {
		if (ConnectionState.SaveChanges === this._state) {
			// Мы сохраняли изменения и разорвалось соединение
			this._isReSaveAfterAuth = true;
			// Очищаем предыдущий таймер
			if (null !== this.saveCallbackErrorTimeOutId) {
				clearTimeout(this.saveCallbackErrorTimeOutId);
				this.saveCallbackErrorTimeOutId = null;
			}
		}
		this._state = ConnectionState.Reconnect;
		var bIsDisconnectAtAll = ((c_oCloseCode.serverShutdown <= evt.code && evt.code <= c_oCloseCode.drop) ||
			this.attemptCount >= this.maxAttemptCount);
		var code = null;
		if (bIsDisconnectAtAll) {
			this._state = ConnectionState.ClosedAll;
			code = evt.code;
		}
		if (this.onDisconnect) {
			this.onDisconnect(evt.reason, code);
		}
		//Try reconect
		if (!bIsDisconnectAtAll) {
			this._tryReconnect();
		}
	};
	DocsCoApi.prototype._reconnect = function () {
		delete this.sockjs;
		this._initSocksJs();
	};
	DocsCoApi.prototype._tryReconnect = function () {
		var t = this;
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
			t.reconnectTimeout = null;
		}
		++this.attemptCount;
		this.reconnectTimeout = setTimeout(function () {
			t._reconnect();
		}, this.reconnectInterval);
	};

  //----------------------------------------------------------export----------------------------------------------------
  window['AscCommon'] = window['AscCommon'] || {};
  window['AscCommon'].CDocsCoApi = CDocsCoApi;
})(window);
