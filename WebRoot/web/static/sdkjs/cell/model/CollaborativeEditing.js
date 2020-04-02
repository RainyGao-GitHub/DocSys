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

(function (window, undefined) {
		/*
		 * Import
		 * -----------------------------------------------------------------------------
		 */
		var asc_applyFunction	= AscCommonExcel.applyFunction;

		var c_oAscLockTypes = AscCommon.c_oAscLockTypes;

		var c_oAscRecalcIndexTypes = AscCommonExcel.c_oAscRecalcIndexTypes;
		var c_oAscLockTypeElemSubType = AscCommonExcel.c_oAscLockTypeElemSubType;
		var c_oAscLockTypeElem = AscCommonExcel.c_oAscLockTypeElem;

		/**
		 * Отвечает за совместное редактирование
		 * -----------------------------------------------------------------------------
		 *
		 * @constructor
		 * @memberOf AscCommonExcel
		 */
		function CCollaborativeEditing (handlers, isViewerMode) {
			if ( !(this instanceof CCollaborativeEditing) ) {
				return new CCollaborativeEditing ();
			}

			this.m_nUseType					= 1;  // 1 - 1 клиент и мы сохраняем историю, -1 - несколько клиентов, 0 - переход из -1 в 1

			this.handlers					= new AscCommonExcel.asc_CHandlersList(handlers);
			this.m_bIsViewerMode			= !!isViewerMode; // Режим Viewer-а
			this.m_bGlobalLock				= false; // Глобальный lock
			this.m_bGlobalLockEditCell		= false; // Глобальный lock (для редактирования ячейки) - отключаем смену select-а, но разрешаем сразу вводить
			this.m_arrCheckLocks			= [];    // Массив для проверки залоченности объектов, которые мы собираемся изменять

			this.m_arrNeedUnlock			= []; // Массив со списком залоченных объектов(которые были залочены другими пользователями)
			this.m_arrNeedUnlock2			= []; // Массив со списком залоченных объектов(которые были залочены на данном клиенте)

			this.m_arrChanges				= []; // Массив с изменениями других пользователей

			this.m_oRecalcIndexColumns		= {};
			this.m_oRecalcIndexRows			= {};

			this.m_oInsertColumns			= {}; // Массив листов с массивами списков добавленных колонок
			this.m_oInsertRows				= {}; // Массив листов с массивами списков добавленных строк

      this.m_bFast  = false;

			this.init();

			return this;
		}

		CCollaborativeEditing.prototype.init = function () {
		};

		// Очищаем индексы пересчета (при открытии это необходимо)
		CCollaborativeEditing.prototype.clearRecalcIndex = function () {
			this.m_oRecalcIndexColumns = {};
			this.m_oRecalcIndexRows = {};
		};

		// Начало совместного редактирования
		CCollaborativeEditing.prototype.startCollaborationEditing = function() {
			this.m_nUseType = -1;
		};

		// Временное окончание совместного редактирования
		CCollaborativeEditing.prototype.endCollaborationEditing = function() {
			if (this.m_nUseType <= 0)
				this.m_nUseType = 0;
		};

		// Выставление режима view
		CCollaborativeEditing.prototype.setViewerMode = function (isViewerMode) {
			this.m_bIsViewerMode = isViewerMode;
		};

  CCollaborativeEditing.prototype.setFast = function (bFast) {
    return this.m_bFast = bFast;
  };
  CCollaborativeEditing.prototype.getFast = function () {
    return this.m_bFast;
  };
		CCollaborativeEditing.prototype.Is_SingleUser = function () {
			return !this.getCollaborativeEditing();
		};
		CCollaborativeEditing.prototype.getCollaborativeEditing = function () {
			if (this.m_bIsViewerMode)
				return false;
			return 1 !== this.m_nUseType;
		};

  CCollaborativeEditing.prototype.haveOtherChanges = function () {
    return 0 < this.m_arrChanges.length;
  };

		CCollaborativeEditing.prototype.getOwnLocksLength = function () {
			return this.m_arrNeedUnlock2.length;
		};

		//-----------------------------------------------------------------------------------
		// Функции для проверки залоченности объектов
		//-----------------------------------------------------------------------------------
		CCollaborativeEditing.prototype.getGlobalLock = function () {
			return this.m_bGlobalLock;
		};
		CCollaborativeEditing.prototype.getGlobalLockEditCell = function () {
			return this.m_bGlobalLockEditCell;
		};
		CCollaborativeEditing.prototype.onStartEditCell = function () {
			// Вызывать эту функцию только в случае редактирования ячейки и если мы не одни редактируем!!!
			if (this.getCollaborativeEditing())
				this.m_bGlobalLockEditCell = true;
		};
		CCollaborativeEditing.prototype.onStopEditCell = function () {
			// Вызывать эту функцию только в случае окончания редактирования ячейки!!!
			this.m_bGlobalLockEditCell = false;
		};
		CCollaborativeEditing.prototype.lock = function (arrLocks, callback) {
			var type;
			callback = this._checkCollaborative(callback);

			this.onStartCheckLock();
			for (var i = 0; i < arrLocks.length; ++i) {
				type = this._addCheckLock(arrLocks[i], callback);
				if (c_oAscLockTypes.kLockTypeNone !== type) {
					// Снимаем глобальный лок (для редактирования ячейки)
					this.m_bGlobalLockEditCell = false;
					return c_oAscLockTypes.kLockTypeMine === type;
				}
			}
			this.onEndCheckLock(callback);
			return true;
		};
		CCollaborativeEditing.prototype._checkCollaborative = function (callback) {
			if (false === this.getCollaborativeEditing()) {
				// Пользователь редактирует один: не ждем ответа, а сразу продолжаем редактирование
				AscCommonExcel.applyFunction(callback, true);
				callback = undefined;
			}
			return callback;
		};
		CCollaborativeEditing.prototype._addCheckLock = function (lockInfo, callback) {
			if (false !== this.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeMine, false)) {
				// Редактируем сами
				AscCommonExcel.applyFunction(callback, true);
				return c_oAscLockTypes.kLockTypeMine;
			} else if (false !== this.getLockIntersection(lockInfo, c_oAscLockTypes.kLockTypeOther, false)) {
				// Уже ячейку кто-то редактирует
				AscCommonExcel.applyFunction(callback, false);
				return c_oAscLockTypes.kLockTypeOther;
			}

			this.m_arrCheckLocks.push(lockInfo);
			return c_oAscLockTypes.kLockTypeNone;
		};
		CCollaborativeEditing.prototype.onStartCheckLock = function () {
			this.m_arrCheckLocks.length = 0;
		};
		CCollaborativeEditing.prototype.addCheckLock = function (oItem) {
			this.m_arrCheckLocks.push (oItem);
		};
		CCollaborativeEditing.prototype.onEndCheckLock = function (callback) {
			var t = this;
			if (this.m_arrCheckLocks.length > 0) {
				// Отправляем запрос на сервер со списком элементов
				this.handlers.trigger("askLock", this.m_arrCheckLocks, function (result) {t.onCallbackAskLock (result, callback);});

				if (undefined !== callback) {
					// Ставим глобальный лок (только если мы не одни и ждем ответа!)
					this.m_bGlobalLock = true;
				}
			}
			else {
				asc_applyFunction(callback, true);

				// Снимаем глобальный лок (для редактирования ячейки)
				this.m_bGlobalLockEditCell = false;
			}
		};

		CCollaborativeEditing.prototype.onCallbackAskLock = function(result, callback) {
			// Снимаем глобальный лок
			this.m_bGlobalLock = false;
			// Снимаем глобальный лок (для редактирования ячейки)
			this.m_bGlobalLockEditCell = false;

			if (result["lock"]) {
				// Пробегаемся по массиву и проставляем, что залочено нами
				var count = this.m_arrCheckLocks.length;
				for (var i = 0; i < count; ++i) {
					var oItem = this.m_arrCheckLocks[i];

					if (true !== oItem && false !== oItem) // сравниваем по значению и типу обязательно
					{
						var oNewLock = new CLock(oItem);
						oNewLock.setType (c_oAscLockTypes.kLockTypeMine);
						this.addUnlock2 (oNewLock);
					}
				}

				asc_applyFunction(callback, true);
			} else if (result["error"]) {
				asc_applyFunction(callback, false);
			}
		};
		CCollaborativeEditing.prototype.addUnlock = function (LockClass) {
			this.m_arrNeedUnlock.push (LockClass);
		};
		CCollaborativeEditing.prototype.addUnlock2 = function (Lock) {
			this.m_arrNeedUnlock2.push (Lock);
			this.handlers.trigger("updateDocumentCanSave");
		};

		CCollaborativeEditing.prototype.removeUnlock = function (Lock) {
			for (var i = 0; i < this.m_arrNeedUnlock.length; ++i)
				if (Lock.Element["guid"] === this.m_arrNeedUnlock[i].Element["guid"]) {
					this.m_arrNeedUnlock.splice(i, 1);
					return true;
				}
			return false;
		};

		CCollaborativeEditing.prototype.addChanges = function (oChanges) {
			this.m_arrChanges.push (oChanges);
		};

		// Возвращает - нужно ли отправлять end action
		CCollaborativeEditing.prototype.applyChanges = function () {
			var t = this;
			var length = this.m_arrChanges.length;
			// Принимаем изменения
			if (0 < length) {
				//splice to prevent double apply other changes in case of load fonts
				var changes = t.m_arrChanges.splice(0, length);
				this.handlers.trigger("applyChanges", changes, function () {
					t.handlers.trigger("updateAfterApplyChanges");
				});

				return false;
			}

			return true;
		};

		CCollaborativeEditing.prototype.sendChanges = function (IsUserSave, isAfterAskSave) {
			// Когда не совместное редактирование чистить ничего не нужно, но отправлять нужно.
			var bIsCollaborative = this.getCollaborativeEditing();

			var bCheckRedraw = false, bRedrawGraphicObjects = false, bUnlockDefName = false;
			var oLock = null;
			if (bIsCollaborative) {
				if (0 < this.m_arrNeedUnlock.length || 0 < this.m_arrNeedUnlock2.length) {
					bCheckRedraw = true;
					this.handlers.trigger("cleanSelection");
				}

				// Очищаем свои изменения
				while (0 < this.m_arrNeedUnlock2.length) {
					oLock = this.m_arrNeedUnlock2.shift();
					oLock.setType(c_oAscLockTypes.kLockTypeNone, false);

					var drawing = AscCommon.g_oTableId.Get_ById(oLock.Element["rangeOrObjectId"]);
					if(drawing && drawing.lockType !== c_oAscLockTypes.kLockTypeNone) {
						var bLocked = drawing.lockType !== c_oAscLockTypes.kLockTypeNone && drawing.lockType !== c_oAscLockTypes.kLockTypeMine;
						drawing.lockType = c_oAscLockTypes.kLockTypeNone;
						bRedrawGraphicObjects = true;
						if(drawing instanceof AscCommon.CCore) {
							if(bLocked) {
								Asc.editor && Asc.editor.sendEvent("asc_onLockCore", false);
							}
						}
					}
					if(!bUnlockDefName){
						bUnlockDefName = this.handlers.trigger("checkDefNameLock", oLock);
					}

					this.handlers.trigger("releaseLocks", oLock.Element["guid"]);
				}

				// Очищаем примененные чужие изменения
				var nIndex = 0;
				var nCount = this.m_arrNeedUnlock.length;
				for (;nIndex < nCount; ++nIndex) {
					oLock = this.m_arrNeedUnlock[nIndex];
					if (c_oAscLockTypes.kLockTypeOther2 === oLock.getType()) {
						if (!this.handlers.trigger("checkCommentRemoveLock", oLock.Element)) {
							drawing = AscCommon.g_oTableId.Get_ById(oLock.Element["rangeOrObjectId"]);
							if(drawing && drawing.lockType !== c_oAscLockTypes.kLockTypeNone) {
								var bLocked = drawing.lockType !== c_oAscLockTypes.kLockTypeNone && drawing.lockType !== c_oAscLockTypes.kLockTypeMine;
								drawing.lockType = c_oAscLockTypes.kLockTypeNone;
								bRedrawGraphicObjects = true;
								if(drawing instanceof AscCommon.CCore) {
									if(bLocked) {
										Asc.editor && Asc.editor.sendEvent("asc_onLockCore", false);
									}
								}
							}
							if(!bUnlockDefName){
								bUnlockDefName = this.handlers.trigger("checkDefNameLock", oLock);
							}
						}

						this.m_arrNeedUnlock.splice(nIndex, 1);
						--nIndex;
						--nCount;
					}
				}
			}

			// Отправляем на сервер изменения
			this.handlers.trigger("sendChanges", this.getRecalcIndexSave(this.m_oRecalcIndexColumns), this.getRecalcIndexSave(this.m_oRecalcIndexRows), isAfterAskSave);

			if (bIsCollaborative) {
				// Пересчитываем lock-и от чужих пользователей
				this._recalcLockArrayOthers();

				// Очищаем свои изменения (удаляем массив добавленных строк/столбцов)
				delete this.m_oInsertColumns;
				delete this.m_oInsertRows;
				this.m_oInsertColumns = {};
				this.m_oInsertRows = {};
				// Очищаем свои пересчетные индексы
				this.clearRecalcIndex();

				// Чистим Undo/Redo
				AscCommon.History.Clear();

				// Перерисовываем
				if (bCheckRedraw) {
					this.handlers.trigger("drawSelection");
					this.handlers.trigger("drawFrozenPaneLines");
					this.handlers.trigger("updateAllSheetsLock");
					this.handlers.trigger("showComments");
				}

				if (bCheckRedraw || bRedrawGraphicObjects)
					this.handlers.trigger("showDrawingObjects");

//                if(bUnlockDefName){
                    this.handlers.trigger("unlockDefName");
//                }

				this.handlers.trigger("updateAllLayoutsLock");
				this.handlers.trigger("asc_onLockPrintArea");
				this.handlers.trigger("updateAllHeaderFooterLock");
				this.handlers.trigger("onUpdateAllPrintScaleLock");


				if (0 === this.m_nUseType)
					this.m_nUseType = 1;
			} else {
				// Обновляем точку последнего сохранения в истории
				AscCommon.History.Reset_SavedIndex(IsUserSave);
			}
		};

		CCollaborativeEditing.prototype.getRecalcIndexSave = function (oRecalcIndex) {
			var bHasIndex = false;
			var result = {};
			var element = null;
			for (var sheetId in oRecalcIndex) {
				if (!oRecalcIndex.hasOwnProperty(sheetId))
					continue;
				result[sheetId] = {"_arrElements": []};
				for (var i = 0, length = oRecalcIndex[sheetId]._arrElements.length; i < length; ++i) {
					bHasIndex = true;
					element = oRecalcIndex[sheetId]._arrElements[i];
					result[sheetId]["_arrElements"].push({"_recalcType" : element._recalcType,
						"_position" : element._position, "_count" : element._count,
						"m_bIsSaveIndex" : element.m_bIsSaveIndex});
				}
			}

			return bHasIndex ? result : null;
		};

		CCollaborativeEditing.prototype.S4 = function () {
			return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
		};
		CCollaborativeEditing.prototype.createGUID = function () {
			return (this.S4() + this.S4() + "-" + this.S4() + "-" + this.S4() + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4());
		};

		CCollaborativeEditing.prototype.getLockInfo = function (typeElem, subType, sheetId, info) {
			var oLockInfo = new AscCommonExcel.asc_CLockInfo();
			oLockInfo["sheetId"] = sheetId;
			oLockInfo["type"] = typeElem;
			oLockInfo["subType"] = subType;
			oLockInfo["guid"] = this.createGUID();
			oLockInfo["rangeOrObjectId"] = info;
			return oLockInfo;
		};

		CCollaborativeEditing.prototype.getLockByElem = function (element, type) {
			var arrayElements = (c_oAscLockTypes.kLockTypeMine === type) ? this.m_arrNeedUnlock2 : this.m_arrNeedUnlock;
			for (var i = 0; i < arrayElements.length; ++i)
				if (element["guid"] === arrayElements[i].Element["guid"])
					return arrayElements[i];
			return null;
		};

		/**
		 * Проверка lock для элемента
		 * @param {asc_CLockInfo} element  элемент для проверки lock
		 * @param {c_oAscLockTypes} type сами(kLockTypeMine) или кто-то другой
		 * @param {Boolean} bCheckOnlyLockAll проверять только lock для свойств всего листа (либо только проверять удален ли лист, а не просто залочен)
		 */
		CCollaborativeEditing.prototype.getLockIntersection = function (element, type, bCheckOnlyLockAll) {
			var arrayElements = (c_oAscLockTypes.kLockTypeMine === type) ? this.m_arrNeedUnlock2 : this.m_arrNeedUnlock;
			var oUnlockElement = null, rangeTmp1, rangeTmp2;
			for (var i = 0; i < arrayElements.length; ++i) {
				oUnlockElement = arrayElements[i].Element;
				if (c_oAscLockTypeElem.Sheet === element["type"] && element["type"] === oUnlockElement["type"]) {
					// Проверка только на удаление листа (если проверка для себя, то выходим не сразу, т.к. нужно проверить lock от других элементов)
					if ((c_oAscLockTypes.kLockTypeMine !== type && false === bCheckOnlyLockAll) ||
						element["sheetId"] === oUnlockElement["sheetId"]) {
						// Если кто-то залочил sheet, то больше никто не может лочить sheet-ы (иначе можно удалить все листы)
						return arrayElements[i];
					}
				}
				if (element["sheetId"] !== oUnlockElement["sheetId"])
					continue;

				if (null !== element["subType"] && null !== oUnlockElement["subType"])
					return arrayElements[i];

				// Не учитываем lock от ChangeProperties (только если это не lock листа)
				if (true === bCheckOnlyLockAll ||
					(c_oAscLockTypeElemSubType.ChangeProperties === oUnlockElement["subType"]
						&& c_oAscLockTypeElem.Sheet !== element["type"]))
					continue;

				if (element["type"] === oUnlockElement["type"]) {
					if (element["type"] === c_oAscLockTypeElem.Object) {
						if (element["rangeOrObjectId"] === oUnlockElement["rangeOrObjectId"])
							return arrayElements[i];
					} else if (element["type"] === c_oAscLockTypeElem.Range) {
						// Не учитываем lock от Insert
						if (c_oAscLockTypes.kLockTypeMine === type || c_oAscLockTypeElemSubType.InsertRows === oUnlockElement["subType"] || c_oAscLockTypeElemSubType.InsertColumns === oUnlockElement["subType"])
							continue;
						rangeTmp1 = oUnlockElement["rangeOrObjectId"];
						rangeTmp2 = element["rangeOrObjectId"];
						if (rangeTmp2["c1"] > rangeTmp1["c2"] || rangeTmp2["c2"] < rangeTmp1["c1"] || rangeTmp2["r1"] > rangeTmp1["r2"] || rangeTmp2["r2"] < rangeTmp1["r1"])
							continue;
						return arrayElements[i];
					}
				} else if (oUnlockElement["type"] === c_oAscLockTypeElem.Sheet ||
					(element["type"] === c_oAscLockTypeElem.Sheet && c_oAscLockTypes.kLockTypeMine !== type)) {
					// Если кто-то уже залочил лист или мы пытаемся сами залочить и проверяем на чужие lock
					return arrayElements[i];
				}
			}
			return false;
		};

		CCollaborativeEditing.prototype.getLockElem = function (typeElem, type, sheetId) {
			var arrayElements = (c_oAscLockTypes.kLockTypeMine === type) ? this.m_arrNeedUnlock2 : this.m_arrNeedUnlock;
			var count = arrayElements.length;
			var element = null, oRangeOrObjectId = null;
			var result = [];
			var c1, c2, r1, r2;

			if (!this.m_oRecalcIndexColumns.hasOwnProperty(sheetId)) {
				this.m_oRecalcIndexColumns[sheetId] = new CRecalcIndex();
			}
			if (!this.m_oRecalcIndexRows.hasOwnProperty(sheetId)) {
				this.m_oRecalcIndexRows[sheetId] = new CRecalcIndex();
			}

			for (var i = 0; i < count; ++i) {
				element = arrayElements[i].Element;
				if (element["sheetId"] !== sheetId || element["type"] !== typeElem)
					continue;

				// Отображать залоченность удаленных текущим пользователем строк/столбцов не нужно (уже нечего отображать)
				if (c_oAscLockTypes.kLockTypeMine === type && c_oAscLockTypeElem.Range === typeElem &&
					(c_oAscLockTypeElemSubType.DeleteColumns === element["subType"] ||
						c_oAscLockTypeElemSubType.DeleteRows === element["subType"]))
					continue;
				// Отображать залоченность добавленных другим пользователем строк/столбцов не нужно (еще нечего отображать)
				if (c_oAscLockTypeElem.Range === typeElem &&
					(c_oAscLockTypeElemSubType.InsertColumns === element["subType"] ||
						c_oAscLockTypeElemSubType.InsertRows === element["subType"]))
					continue;
				// Отображать lock-диапазон для lockAll(всего листа) не нужно
				if (c_oAscLockTypeElemSubType.ChangeProperties === element["subType"])
					continue;

				oRangeOrObjectId = element["rangeOrObjectId"];
				// Для диапазона нужно сделать пересчет с учетом удаленных или добавленных строк/столбцов
				if (c_oAscLockTypeElem.Range === typeElem) {
					// Пересчитывать для удаленных строк/столбцов у другого пользователя не нужно
					if (c_oAscLockTypes.kLockTypeMine !== type && c_oAscLockTypeElem.Range === typeElem &&
						(c_oAscLockTypeElemSubType.DeleteColumns === element["subType"] ||
							c_oAscLockTypeElemSubType.DeleteRows === element["subType"])) {
						c1 = oRangeOrObjectId["c1"];
						c2 = oRangeOrObjectId["c2"];
						r1 = oRangeOrObjectId["r1"];
						r2 = oRangeOrObjectId["r2"];
					} else {
						c1 = this.m_oRecalcIndexColumns[sheetId].getLockOther(oRangeOrObjectId["c1"], type);
						c2 = this.m_oRecalcIndexColumns[sheetId].getLockOther(oRangeOrObjectId["c2"], type);
						r1 = this.m_oRecalcIndexRows[sheetId].getLockOther(oRangeOrObjectId["r1"], type);
						r2 = this.m_oRecalcIndexRows[sheetId].getLockOther(oRangeOrObjectId["r2"], type);
					}
					if (null === c1 || null === c2 || null === r1 || null === r2)
						continue;

					oRangeOrObjectId = new Asc.Range(c1, r1, c2, r2);
				}

				result.push(oRangeOrObjectId);
			}

			return result;
		};

		CCollaborativeEditing.prototype.getLockCellsMe = function (sheetId) {
			return this.getLockElem(c_oAscLockTypeElem.Range, c_oAscLockTypes.kLockTypeMine, sheetId);
		};
		CCollaborativeEditing.prototype.getLockCellsOther = function (sheetId) {
			return this.getLockElem(c_oAscLockTypeElem.Range, c_oAscLockTypes.kLockTypeOther, sheetId);
		};
		CCollaborativeEditing.prototype.getLockObjectsMe = function (sheetId) {
			return this.getLockElem(c_oAscLockTypeElem.Object, c_oAscLockTypes.kLockTypeMine, sheetId);
		};
		CCollaborativeEditing.prototype.getLockObjectsOther = function (sheetId) {
			return this.getLockElem(c_oAscLockTypeElem.Object, c_oAscLockTypes.kLockTypeOther, sheetId);
		};
		/**
		 * Проверка lock для всего листа
		 * @param {Number} sheetId  элемент для проверки lock
		 * @return {Asc.c_oAscMouseMoveLockedObjectType} oLockedObjectType
		 */
		CCollaborativeEditing.prototype.isLockAllOther = function (sheetId) {
			var arrayElements = this.m_arrNeedUnlock;
			var count = arrayElements.length;
			var element = null;
			var oLockedObjectType = Asc.c_oAscMouseMoveLockedObjectType.None;

			for (var i = 0; i < count; ++i) {
				element = arrayElements[i].Element;
				if (element["sheetId"] === sheetId) {
					if (element["type"] === c_oAscLockTypeElem.Sheet) {
						oLockedObjectType = Asc.c_oAscMouseMoveLockedObjectType.Sheet;
						break;
					} else if (element["type"] === c_oAscLockTypeElem.Range && null !== element["subType"])
						oLockedObjectType = Asc.c_oAscMouseMoveLockedObjectType.TableProperties;
				}
			}
			return oLockedObjectType;
		};

		CCollaborativeEditing.prototype._recalcLockArray = function (typeLock, oRecalcIndexColumns, oRecalcIndexRows) {
			var arrayElements = (c_oAscLockTypes.kLockTypeMine === typeLock) ? this.m_arrNeedUnlock2 : this.m_arrNeedUnlock;
			var count = arrayElements.length;
			var element = null, oRangeOrObjectId = null;
			var i;
			var sheetId = -1;

			for (i = 0; i < count; ++i) {
				element = arrayElements[i].Element;
				// Для удаления пересчитывать индексы не нужно
				if (c_oAscLockTypeElem.Range !== element["type"] ||
					c_oAscLockTypeElemSubType.InsertColumns === element["subType"] ||
					c_oAscLockTypeElemSubType.InsertRows === element["subType"] ||
					c_oAscLockTypeElemSubType.DeleteColumns === element["subType"] ||
					c_oAscLockTypeElemSubType.DeleteRows === element["subType"])
					continue;
				sheetId = element["sheetId"];

				oRangeOrObjectId = element["rangeOrObjectId"];

				if (oRecalcIndexColumns && oRecalcIndexColumns.hasOwnProperty(sheetId)) {
					// Пересчет колонок
					oRangeOrObjectId["c1"] = oRecalcIndexColumns[sheetId].getLockMe(oRangeOrObjectId["c1"]);
					oRangeOrObjectId["c2"] = oRecalcIndexColumns[sheetId].getLockMe(oRangeOrObjectId["c2"]);
				}
				if (oRecalcIndexRows && oRecalcIndexRows.hasOwnProperty(sheetId)) {
					// Пересчет строк
					oRangeOrObjectId["r1"] = oRecalcIndexRows[sheetId].getLockMe(oRangeOrObjectId["r1"]);
					oRangeOrObjectId["r2"] = oRecalcIndexRows[sheetId].getLockMe(oRangeOrObjectId["r2"]);
				}
			}
		};
		// Пересчет только для чужих Lock при сохранении на клиенте, который добавлял/удалял строки или столбцы
		CCollaborativeEditing.prototype._recalcLockArrayOthers = function () {
			var typeLock = c_oAscLockTypes.kLockTypeOther;
			var arrayElements = (c_oAscLockTypes.kLockTypeMine === typeLock) ? this.m_arrNeedUnlock2 : this.m_arrNeedUnlock;
			var count = arrayElements.length;
			var element = null, oRangeOrObjectId = null;
			var i;
			var sheetId = -1;

			for (i = 0; i < count; ++i) {
				element = arrayElements[i].Element;
				if (c_oAscLockTypeElem.Range !== element["type"] ||
					c_oAscLockTypeElemSubType.InsertColumns === element["subType"] ||
					c_oAscLockTypeElemSubType.InsertRows === element["subType"])
					continue;
				sheetId = element["sheetId"];

				oRangeOrObjectId = element["rangeOrObjectId"];

				if (this.m_oRecalcIndexColumns.hasOwnProperty(sheetId)) {
					// Пересчет колонок
					oRangeOrObjectId["c1"] = this.m_oRecalcIndexColumns[sheetId].getLockOther(oRangeOrObjectId["c1"]);
					oRangeOrObjectId["c2"] = this.m_oRecalcIndexColumns[sheetId].getLockOther(oRangeOrObjectId["c2"]);
				}
				if (this.m_oRecalcIndexRows.hasOwnProperty(sheetId)) {
					// Пересчет строк
					oRangeOrObjectId["r1"] = this.m_oRecalcIndexRows[sheetId].getLockOther(oRangeOrObjectId["r1"]);
					oRangeOrObjectId["r2"] = this.m_oRecalcIndexRows[sheetId].getLockOther(oRangeOrObjectId["r2"]);
				}
			}
		};

		CCollaborativeEditing.prototype.addRecalcIndex = function (type, oRecalcIndex) {
			if (null == oRecalcIndex)
				return null;
			var nIndex = 0;
			var nRecalcType = c_oAscRecalcIndexTypes.RecalcIndexAdd;
			var oRecalcIndexElement = null;
			var oRecalcIndexResult = {};

			var oRecalcIndexTmp = ("0" === type) ? this.m_oRecalcIndexColumns : this.m_oRecalcIndexRows;
			for (var sheetId in oRecalcIndex) {
				if (oRecalcIndex.hasOwnProperty(sheetId)) {
					if (!oRecalcIndexTmp.hasOwnProperty(sheetId)) {
						oRecalcIndexTmp[sheetId] = new CRecalcIndex();
					}
					if (!oRecalcIndexResult.hasOwnProperty(sheetId)) {
						oRecalcIndexResult[sheetId] = new CRecalcIndex();
					}
					for (; nIndex < oRecalcIndex[sheetId]["_arrElements"].length; ++nIndex) {
						oRecalcIndexElement = oRecalcIndex[sheetId]["_arrElements"][nIndex];
						if (true === oRecalcIndexElement["m_bIsSaveIndex"])
							continue;
						nRecalcType = (c_oAscRecalcIndexTypes.RecalcIndexAdd === oRecalcIndexElement["_recalcType"]) ?
							c_oAscRecalcIndexTypes.RecalcIndexRemove : c_oAscRecalcIndexTypes.RecalcIndexAdd;
						oRecalcIndexTmp[sheetId].add(nRecalcType, oRecalcIndexElement["_position"],
							oRecalcIndexElement["_count"], /*bIsSaveIndex*/true);
						// Дублируем для возврата результата (нам нужно пересчитать только по последнему индексу
						oRecalcIndexResult[sheetId].add(nRecalcType, oRecalcIndexElement["_position"],
							oRecalcIndexElement["_count"], /*bIsSaveIndex*/true);
					}
				}
			}

			return oRecalcIndexResult;
		};

		// Undo для добавления/удаления столбцов
		CCollaborativeEditing.prototype.undoCols = function (sheetId, count) {
      if (!this.m_oRecalcIndexColumns.hasOwnProperty(sheetId))
        return;
      this.m_oRecalcIndexColumns[sheetId].remove(count);
		};
		// Undo для добавления/удаления строк
		CCollaborativeEditing.prototype.undoRows = function (sheetId, count) {
      if (!this.m_oRecalcIndexRows.hasOwnProperty(sheetId))
        return;
      this.m_oRecalcIndexRows[sheetId].remove(count);
		};

		CCollaborativeEditing.prototype.removeCols = function (sheetId, position, count) {
      if (!this.m_oRecalcIndexColumns.hasOwnProperty(sheetId)) {
        this.m_oRecalcIndexColumns[sheetId] = new CRecalcIndex();
      }
      this.m_oRecalcIndexColumns[sheetId].add(c_oAscRecalcIndexTypes.RecalcIndexRemove, position,
        count, /*bIsSaveIndex*/false);
		};
		CCollaborativeEditing.prototype.addCols = function (sheetId, position, count) {
      if (!this.m_oRecalcIndexColumns.hasOwnProperty(sheetId)) {
        this.m_oRecalcIndexColumns[sheetId] = new CRecalcIndex();
      }
      this.m_oRecalcIndexColumns[sheetId].add(c_oAscRecalcIndexTypes.RecalcIndexAdd, position,
        count, /*bIsSaveIndex*/false);
		};
		CCollaborativeEditing.prototype.removeRows = function (sheetId, position, count) {
      if (!this.m_oRecalcIndexRows.hasOwnProperty(sheetId)) {
        this.m_oRecalcIndexRows[sheetId] = new CRecalcIndex();
      }
      this.m_oRecalcIndexRows[sheetId].add(c_oAscRecalcIndexTypes.RecalcIndexRemove, position,
        count, /*bIsSaveIndex*/false);
		};
		CCollaborativeEditing.prototype.addRows = function (sheetId, position, count) {
      if (!this.m_oRecalcIndexRows.hasOwnProperty(sheetId)) {
        this.m_oRecalcIndexRows[sheetId] = new CRecalcIndex();
      }
      this.m_oRecalcIndexRows[sheetId].add(c_oAscRecalcIndexTypes.RecalcIndexAdd, position,
        count, /*bIsSaveIndex*/false);
		};
		CCollaborativeEditing.prototype.addColsRange = function (sheetId, range) {
			if (!this.m_oInsertColumns.hasOwnProperty(sheetId)) {
				this.m_oInsertColumns[sheetId] = [];
			}
			var arrInsertColumns = this.m_oInsertColumns[sheetId];
			// Перед добавлением нужно передвинуть имеющиеся
			var countCols = range.c2 - range.c1 + 1;
			var isAddNewRange = true;
			for (var i = 0; i < arrInsertColumns.length; ++i) {
				if (arrInsertColumns[i].c1 > range.c1) {
					arrInsertColumns[i].c1 += countCols;
					arrInsertColumns[i].c2 += countCols;
				} else if (arrInsertColumns[i].c1 <= range.c1 && arrInsertColumns[i].c2 >= range.c1) {
					arrInsertColumns[i].c2 += countCols;
					isAddNewRange = false;
				}
			}
			if (isAddNewRange)
				arrInsertColumns.push(range);
		};
		CCollaborativeEditing.prototype.addRowsRange = function (sheetId, range) {
			if (!this.m_oInsertRows.hasOwnProperty(sheetId)) {
				this.m_oInsertRows[sheetId] = [];
			}
			var arrInsertRows = this.m_oInsertRows[sheetId];
			// Перед добавлением нужно передвинуть имеющиеся
			var countRows = range.r2 - range.r1 + 1;
			var isAddNewRange = true;
			for (var i = 0; i < arrInsertRows.length; ++i) {
				if (arrInsertRows[i].r1 > range.r1) {
					arrInsertRows[i].r1 += countRows;
					arrInsertRows[i].r2 += countRows;
				} else if (arrInsertRows[i].r1 <= range.r1 && arrInsertRows[i].r2 >= range.r1) {
					arrInsertRows[i].r2 += countRows;
					isAddNewRange = false;
				}
			}
			if (isAddNewRange)
				arrInsertRows.push(range);
		};
		CCollaborativeEditing.prototype.removeColsRange = function (sheetId, range) {
			if (!this.m_oInsertColumns.hasOwnProperty(sheetId))
				return;
			var arrInsertColumns = this.m_oInsertColumns[sheetId];
			// Нужно убрать те колонки, которые входят в диапазон
			var countCols = range.c2 - range.c1 + 1;
			for (var i = 0; i < arrInsertColumns.length; ++i) {
				if (arrInsertColumns[i].c1 > range.c2) {
					// Справа от удаляемого диапазона
					arrInsertColumns[i].c1 -= countCols;
					arrInsertColumns[i].c2 -= countCols;
				} else if (arrInsertColumns[i].c1 >= range.c1 && arrInsertColumns[i].c2 <= range.c2) {
					// Полностью включение в удаляемый диапазон
					arrInsertColumns.splice(i, 1);
					i -= 1;
				} else if (arrInsertColumns[i].c1 >= range.c1 && arrInsertColumns[i].c1 <= range.c2 && arrInsertColumns[i].c2 > range.c2) {
					// Частичное включение начала диапазона
					arrInsertColumns[i].c1 = range.c2 + 1;
					arrInsertColumns[i].c1 -= countCols;
					arrInsertColumns[i].c2 -= countCols;
				} else if (arrInsertColumns[i].c1 < range.c1 && arrInsertColumns[i].c2 >= range.c1 && arrInsertColumns[i].c2 <= range.c2) {
					// Частичное включение окончания диапазона
					arrInsertColumns[i].c2 = range.c1 - 1;
				} else if (arrInsertColumns[i].c1 < range.c1 && arrInsertColumns[i].c2 > range.c2) {
					// Удаляемый диапазон внутри нашего диапазона
					arrInsertColumns[i].c2 -= countCols;
				}
			}
		};
		CCollaborativeEditing.prototype.removeRowsRange = function (sheetId, range) {
			if (!this.m_oInsertRows.hasOwnProperty(sheetId))
				return;
			var arrInsertRows = this.m_oInsertRows[sheetId];
			// Нужно убрать те строки, которые входят в диапазон
			var countRows = range.r2 - range.r1 + 1;
			for (var i = 0; i < arrInsertRows.length; ++i) {
				if (arrInsertRows[i].r1 > range.r2) {
					// Снизу от удаляемого диапазона
					arrInsertRows[i].r1 -= countRows;
					arrInsertRows[i].r2 -= countRows;
				} else if (arrInsertRows[i].r1 >= range.r1 && arrInsertRows[i].r2 <= range.r2) {
					// Полностью включение в удаляемый диапазон
					arrInsertRows.splice(i, 1);
					i -= 1;
				} else if (arrInsertRows[i].r1 >= range.r1 && arrInsertRows[i].r1 <= range.r2 && arrInsertRows[i].r2 > range.r2) {
					// Частичное включение начала диапазона
					arrInsertRows[i].r1 = range.r2 + 1;
					arrInsertRows[i].r1 -= countRows;
					arrInsertRows[i].r2 -= countRows;
				} else if (arrInsertRows[i].r1 < range.r1 && arrInsertRows[i].r2 >= range.r1 && arrInsertRows[i].r2 <= range.r2) {
					// Частичное включение окончания диапазона
					arrInsertRows[i].r2 = range.r1 - 1;
				} else if (arrInsertRows[i].r1 < range.r1 && arrInsertRows[i].r2 > range.r2) {
					// Удаляемый диапазон внутри нашего диапазона
					arrInsertRows[i].r2 -= countRows;
				}
			}
		};
		CCollaborativeEditing.prototype.isIntersectionInCols = function (sheetId, col) {
			if (!this.m_oInsertColumns.hasOwnProperty(sheetId))
				return false;
			var arrInsertColumns = this.m_oInsertColumns[sheetId];
			for (var i = 0; i < arrInsertColumns.length; ++i) {
				if (arrInsertColumns[i].c1 <= col && col <= arrInsertColumns[i].c2)
					return true;
			}
			return false;
		};
		CCollaborativeEditing.prototype.isIntersectionInRows = function (sheetId, row) {
			if (!this.m_oInsertRows.hasOwnProperty(sheetId))
				return false;
			var arrInsertRows = this.m_oInsertRows[sheetId];
			for (var i = 0; i < arrInsertRows.length; ++i) {
				if (arrInsertRows[i].r1 <= row && row <= arrInsertRows[i].r2)
					return true;
			}
			return false;
		};
		CCollaborativeEditing.prototype.getArrayInsertColumnsBySheetId = function (sheetId) {
			if (!this.m_oInsertColumns.hasOwnProperty(sheetId))
				return [];

			return this.m_oInsertColumns[sheetId];
		};
		CCollaborativeEditing.prototype.getArrayInsertRowsBySheetId = function (sheetId) {
			if (!this.m_oInsertRows.hasOwnProperty(sheetId))
				return [];

			return this.m_oInsertRows[sheetId];
		};
		CCollaborativeEditing.prototype.getLockMeColumn = function (sheetId, col) {
			if (!this.m_oRecalcIndexColumns.hasOwnProperty(sheetId))
				return col;
			return this.m_oRecalcIndexColumns[sheetId].getLockMe(col);
		};
		CCollaborativeEditing.prototype.getLockMeRow = function (sheetId, row) {
			if (!this.m_oRecalcIndexRows.hasOwnProperty(sheetId))
				return row;
			return this.m_oRecalcIndexRows[sheetId].getLockMe(row);
		};
		// Только когда от других пользователей изменения колонок (для пересчета)
		CCollaborativeEditing.prototype.getLockMeColumn2 = function (sheetId, col) {
			if (!this.m_oRecalcIndexColumns.hasOwnProperty(sheetId))
				return col;
			return this.m_oRecalcIndexColumns[sheetId].getLockMe2(col);
		};
		// Только когда от других пользователей изменения строк (для пересчета)
		CCollaborativeEditing.prototype.getLockMeRow2 = function (sheetId, row) {
			if (!this.m_oRecalcIndexRows.hasOwnProperty(sheetId))
				return row;
			return this.m_oRecalcIndexRows[sheetId].getLockMe2(row);
		};
		// Только для принятия изменений от других пользователей! (для пересчета только в сохранении)
		CCollaborativeEditing.prototype.getLockOtherColumn2 = function (sheetId, col) {
			if (!this.m_oRecalcIndexColumns.hasOwnProperty(sheetId))
				return col;
			return this.m_oRecalcIndexColumns[sheetId].getLockSaveOther(col);
		};
		// Только для принятия изменений от других пользователей! (для пересчета только в сохранении)
		CCollaborativeEditing.prototype.getLockOtherRow2 = function (sheetId, row) {
			if (!this.m_oRecalcIndexRows.hasOwnProperty(sheetId))
				return row;
			return this.m_oRecalcIndexRows[sheetId].getLockSaveOther(row);
		};

		/**
		 * Отвечает за лок в совместном редактировании
		 * -----------------------------------------------------------------------------
		 *
		 * @constructor
		 * @memberOf Asc
		 */
		function CLock(element) {
			this.Type   = c_oAscLockTypes.kLockTypeNone;
			this.UserId = null;
			this.Element = element;

			this.init();

			return this;
		}

		CLock.prototype.init = function () {
		};
		CLock.prototype.getType = function () {
			return this.Type;
		};
		CLock.prototype.setType = function (newType) {
			if (newType === c_oAscLockTypes.kLockTypeNone)
				this.UserId = null;

			this.Type = newType;
		};

		CLock.prototype.Lock = function(bMine) {
			if (c_oAscLockTypes.kLockTypeNone === this.Type)
			{
				if (true === bMine)
					this.Type = c_oAscLockTypes.kLockTypeMine;
				else
					this.Type = c_oAscLockTypes.kLockTypeOther;
			}
		};

		CLock.prototype.setUserId = function(UserId) {
			this.UserId = UserId;
		};

		function CRecalcIndexElement(recalcType, position, bIsSaveIndex) {
			if ( !(this instanceof CRecalcIndexElement) ) {
				return new CRecalcIndexElement (recalcType, position, bIsSaveIndex);
			}

			this._recalcType	= recalcType;		// Тип изменений (удаление или добавление)
			this._position		= position;			// Позиция, в которой произошли изменения
			this._count			= 1;				// Считаем все изменения за простейшие
			this.m_bIsSaveIndex	= !!bIsSaveIndex;	// Это индексы из изменений других пользователей (которые мы еще не применили)

			return this;
		}

		// Пересчет для других
		CRecalcIndexElement.prototype.getLockOther = function (position, type) {
			var inc = (c_oAscRecalcIndexTypes.RecalcIndexAdd === this._recalcType) ? +1 : -1;
			if (position === this._position && c_oAscRecalcIndexTypes.RecalcIndexRemove === this._recalcType &&
				true === this.m_bIsSaveIndex) {
				// Мы еще не применили чужие изменения (поэтому для insert не нужно отрисовывать)
				// RecalcIndexRemove (потому что перевертываем для правильной отработки, от другого пользователя
				// пришло RecalcIndexAdd
				return null;
			} else if (position === this._position &&
				c_oAscRecalcIndexTypes.RecalcIndexRemove === this._recalcType &&
				c_oAscLockTypes.kLockTypeMine === type && false === this.m_bIsSaveIndex) {
				// Для пользователя, который удалил столбец, рисовать залоченные ранее в данном столбце ячейки
				// не нужно
				return null;
			} else if (position < this._position)
				return position;
			else
				return (position + inc);
		};
		// Пересчет для других (только для сохранения)
		CRecalcIndexElement.prototype.getLockSaveOther = function (position, type) {
			if (this.m_bIsSaveIndex)
				return position;

			var inc = (c_oAscRecalcIndexTypes.RecalcIndexAdd === this._recalcType) ? +1 : -1;
			if (position === this._position && c_oAscRecalcIndexTypes.RecalcIndexRemove === this._recalcType &&
				true === this.m_bIsSaveIndex) {
				// Мы еще не применили чужие изменения (поэтому для insert не нужно отрисовывать)
				// RecalcIndexRemove (потому что перевертываем для правильной отработки, от другого пользователя
				// пришло RecalcIndexAdd
				return null;
			} else if (position === this._position &&
				c_oAscRecalcIndexTypes.RecalcIndexRemove === this._recalcType &&
				c_oAscLockTypes.kLockTypeMine === type && false === this.m_bIsSaveIndex) {
				// Для пользователя, который удалил столбец, рисовать залоченные ранее в данном столбце ячейки
				// не нужно
				return null;
			} else if (position < this._position)
				return position;
			else
				return (position + inc);
		};
		// Пересчет для себя
		CRecalcIndexElement.prototype.getLockMe = function (position) {
			var inc = (c_oAscRecalcIndexTypes.RecalcIndexAdd === this._recalcType) ? -1 : +1;
			if (position < this._position)
				return position;
			else
				return (position + inc);
		};
		// Только когда от других пользователей изменения (для пересчета)
		CRecalcIndexElement.prototype.getLockMe2 = function (position) {
			var inc = (c_oAscRecalcIndexTypes.RecalcIndexAdd === this._recalcType) ? -1 : +1;
			if (true !== this.m_bIsSaveIndex || position < this._position)
				return position;
			else
				return (position + inc);
		};

		function CRecalcIndex() {
			if ( !(this instanceof CRecalcIndex) ) {
				return new CRecalcIndex ();
			}

			this._arrElements = [];		// Массив CRecalcIndexElement

			return this;
		}

		CRecalcIndex.prototype.add = function (recalcType, position, count, bIsSaveIndex) {
			for (var i = 0; i < count; ++i)
				this._arrElements.push(new CRecalcIndexElement(recalcType, position, bIsSaveIndex));
		};
		// Удаляет из пересчета, для undo
		CRecalcIndex.prototype.remove = function (count) {
			for (var i = 0; i < count; ++i)
				this._arrElements.pop();
		};
		CRecalcIndex.prototype.clear = function () {
			this._arrElements.length = 0;
		};

		// Пересчет для других
		CRecalcIndex.prototype.getLockOther = function (position, type) {
			var newPosition = position;
			/*var count = this._arrElements.length;
			 for (var i = 0; i < count; ++i) {
			 newPosition = this._arrElements[i].getLockOther(newPosition, type);
			 if (null === newPosition)
			 break;
			 }*/

			var count = this._arrElements.length;
			if (0 >= count)
				return newPosition;
			// Для пересчета, когда добавил сам - обратный порядок
			// Для пересчета, когда добавил кто-то другой - прямой
			var bIsDirect = !this._arrElements[0].m_bIsSaveIndex;
			var i;
			if (bIsDirect) {
				for (i = 0; i < count; ++i) {
					newPosition = this._arrElements[i].getLockOther(newPosition, type);
					if (null === newPosition)
						break;
				}
			} else {
				for (i = count - 1; i >= 0; --i) {
					newPosition = this._arrElements[i].getLockOther(newPosition, type);
					if (null === newPosition)
						break;
				}
			}

			return newPosition;
		};
		// Пересчет для других (только для сохранения)
		CRecalcIndex.prototype.getLockSaveOther = function (position, type) {
			var newPosition = position;
			var count = this._arrElements.length;
			for (var i = 0; i < count; ++i) {
				newPosition = this._arrElements[i].getLockSaveOther(newPosition, type);
				if (null === newPosition)
					break;
			}

			return newPosition;
		};
		// Пересчет для себя
		CRecalcIndex.prototype.getLockMe = function (position) {
			var newPosition = position;
			var count = this._arrElements.length;
			if (0 >= count)
				return newPosition;
			// Для пересчета, когда добавил сам - обратный порядок
			// Для пересчета, когда добавил кто-то другой - прямой
			var bIsDirect = this._arrElements[0].m_bIsSaveIndex;
			var i;
			if (bIsDirect) {
				for (i = 0; i < count; ++i) {
					newPosition = this._arrElements[i].getLockMe(newPosition);
					if (null === newPosition)
						break;
				}
			} else {
				for (i = count - 1; i >= 0; --i) {
					newPosition = this._arrElements[i].getLockMe(newPosition);
					if (null === newPosition)
						break;
				}
			}

			return newPosition;
		};
		// Только когда от других пользователей изменения (для пересчета)
		CRecalcIndex.prototype.getLockMe2 = function (position) {
			var newPosition = position;
			var count = this._arrElements.length;
			if (0 >= count)
				return newPosition;
			// Для пересчета, когда добавил сам - обратный порядок
			// Для пересчета, когда добавил кто-то другой - прямой
			var bIsDirect = this._arrElements[0].m_bIsSaveIndex;
			var i;
			if (bIsDirect) {
				for (i = 0; i < count; ++i) {
					newPosition = this._arrElements[i].getLockMe2(newPosition);
					if (null === newPosition)
						break;
				}
			} else {
				for (i = count - 1; i >= 0; --i) {
					newPosition = this._arrElements[i].getLockMe2(newPosition);
					if (null === newPosition)
						break;
				}
			}

			return newPosition;
		};

		//----------------------------------------------------------export----------------------------------------------------
		window['Asc'] = window['Asc'] || {};
		window['AscCommonExcel'] = window['AscCommonExcel'] || {};
		window['AscCommonExcel'].CLock = CLock;

		window['AscCommonExcel'].CCollaborativeEditing = CCollaborativeEditing;
		window['Asc'].CRecalcIndexElement = CRecalcIndexElement;
		window['Asc'].CRecalcIndex = CRecalcIndex;
	}
)(window);
