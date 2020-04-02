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

(function(window, undefined){

// Import
	var g_memory = AscFonts.g_memory;

	var CellValueType = AscCommon.CellValueType;
	var c_oAscBorderStyles = AscCommon.c_oAscBorderStyles;
	var fSortAscending = AscCommon.fSortAscending;
	var parserHelp = AscCommon.parserHelp;
	var oNumFormatCache = AscCommon.oNumFormatCache;
	var gc_nMaxRow0 = AscCommon.gc_nMaxRow0;
	var gc_nMaxCol0 = AscCommon.gc_nMaxCol0;
	var g_oCellAddressUtils = AscCommon.g_oCellAddressUtils;
	var CellAddress = AscCommon.CellAddress;
	var isRealObject = AscCommon.isRealObject;
	var History = AscCommon.History;
	var cBoolLocal = AscCommon.cBoolLocal;
	var cErrorLocal = AscCommon.cErrorLocal;
	var cErrorOrigin = AscCommon.cErrorOrigin;
	var c_oAscNumFormatType = Asc.c_oAscNumFormatType;

	var UndoRedoItemSerializable = AscCommonExcel.UndoRedoItemSerializable;
	var UndoRedoData_CellSimpleData = AscCommonExcel.UndoRedoData_CellSimpleData;
	var UndoRedoData_CellValueData = AscCommonExcel.UndoRedoData_CellValueData;
	var UndoRedoData_FromToRowCol = AscCommonExcel.UndoRedoData_FromToRowCol;
	var UndoRedoData_FromTo = AscCommonExcel.UndoRedoData_FromTo;
	var UndoRedoData_IndexSimpleProp = AscCommonExcel.UndoRedoData_IndexSimpleProp;
	var UndoRedoData_BBox = AscCommonExcel.UndoRedoData_BBox;
	var UndoRedoData_SheetAdd = AscCommonExcel.UndoRedoData_SheetAdd;
	var UndoRedoData_DefinedNames = AscCommonExcel.UndoRedoData_DefinedNames;
	var g_oDefaultFormat = AscCommonExcel.g_oDefaultFormat;
	var g_StyleCache = AscCommonExcel.g_StyleCache;
	var Border = AscCommonExcel.Border;
	var RangeDataManager = AscCommonExcel.RangeDataManager;

	var cElementType = AscCommonExcel.cElementType;

	var parserFormula = AscCommonExcel.parserFormula;

	var c_oAscError = Asc.c_oAscError;
	var c_oAscInsertOptions = Asc.c_oAscInsertOptions;
	var c_oAscDeleteOptions = Asc.c_oAscDeleteOptions;
	var c_oAscGetDefinedNamesList = Asc.c_oAscGetDefinedNamesList;
	var c_oAscDefinedNameReason = Asc.c_oAscDefinedNameReason;
	var c_oNotifyType = AscCommon.c_oNotifyType;
	var g_cCalcRecursion = AscCommonExcel.g_cCalcRecursion;

	var g_nVerticalTextAngle = 255;
	//определяется в WorksheetView.js
	var oDefaultMetrics = {
		ColWidthChars: 0,
		RowHeight: 0
	};
	var g_sNewSheetNamePattern = "Sheet";
	var g_nSheetNameMaxLength = 31;
	var g_nDefNameMaxLength = 255;
	var g_nAllColIndex = -1;
	var g_nAllRowIndex = -1;
	var aStandartNumFormats = [];
	var aStandartNumFormatsId = {};
	var oFormulaLocaleInfo = {
		Parse: true,
		DigitSep: true
	};

	(function(){
		aStandartNumFormats[0] = "General";
		aStandartNumFormats[1] = "0";
		aStandartNumFormats[2] = "0.00";
		aStandartNumFormats[3] = "#,##0";
		aStandartNumFormats[4] = "#,##0.00";
		aStandartNumFormats[9] = "0%";
		aStandartNumFormats[10] = "0.00%";
		aStandartNumFormats[11] = "0.00E+00";
		aStandartNumFormats[12] = "# ?/?";
		aStandartNumFormats[13] = "# ??/??";
		aStandartNumFormats[14] = "m/d/yyyy";
		aStandartNumFormats[15] = "d-mmm-yy";
		aStandartNumFormats[16] = "d-mmm";
		aStandartNumFormats[17] = "mmm-yy";
		aStandartNumFormats[18] = "h:mm AM/PM";
		aStandartNumFormats[19] = "h:mm:ss AM/PM";
		aStandartNumFormats[20] = "h:mm";
		aStandartNumFormats[21] = "h:mm:ss";
		aStandartNumFormats[22] = "m/d/yyyy h:mm";
		aStandartNumFormats[37] = "#,##0_);(#,##0)";
		aStandartNumFormats[38] = "#,##0_);[Red](#,##0)";
		aStandartNumFormats[39] = "#,##0.00_);(#,##0.00)";
		aStandartNumFormats[40] = "#,##0.00_);[Red](#,##0.00)";
		aStandartNumFormats[45] = "mm:ss";
		aStandartNumFormats[46] = "[h]:mm:ss";
		aStandartNumFormats[47] = "mm:ss.0";
		aStandartNumFormats[48] = "##0.0E+0";
		aStandartNumFormats[49] = "@";
		for(var i in aStandartNumFormats)
		{
			aStandartNumFormatsId[aStandartNumFormats[i]] = i - 0;
		}
	})();

	var c_oRangeType =
		{
			Range:0,
			Col:1,
			Row:2,
			All:3
		};
	var c_oSharedShiftType = {
		Processed: 1,
		NeedTransform: 2,
		PreProcessed: 3
	};
	var emptyStyleComponents = {table: [], conditional: []};
	function getRangeType(oBBox){
		if(null == oBBox)
			oBBox = this.bbox;
		if(oBBox.c1 == 0 && gc_nMaxCol0 == oBBox.c2 && oBBox.r1 == 0 && gc_nMaxRow0 == oBBox.r2)
			return c_oRangeType.All;
		if(oBBox.c1 == 0 && gc_nMaxCol0 == oBBox.c2)
			return c_oRangeType.Row;
		else if(oBBox.r1 == 0 && gc_nMaxRow0 == oBBox.r2)
			return c_oRangeType.Col;
		else
			return c_oRangeType.Range;
	}

	function getCompiledStyleFromArray(xf, xfs) {
		for (var i = 0; i < xfs.length; ++i) {
			if (null == xf) {
				xf = xfs[i];
			} else {
				xf = xf.merge(xfs[i]);
			}
		}
		return xf;
	}
	function getCompiledStyle(sheetMergedStyles, hiddenManager, nRow, nCol, opt_cell, opt_ws, opt_styleComponents) {
		var styleComponents = opt_styleComponents ? opt_styleComponents : sheetMergedStyles.getStyle(hiddenManager, nRow, nCol, opt_ws);
		var xf = getCompiledStyleFromArray(null, styleComponents.table);
		if (opt_cell) {
			if (null === xf) {
				xf = opt_cell.xfs;
			} else if (opt_cell.xfs) {
				xf = xf.merge(opt_cell.xfs, true);
			}
		} else if (opt_ws) {
			opt_ws._getRowNoEmpty(nRow, function(row){
				if(row && null != row.xfs){
					xf = null === xf ? row.xfs : xf.merge(row.xfs, true);
				} else {
					var col = opt_ws._getColNoEmptyWithAll(nCol);
					if(null != col && null != col.xfs){
						xf = null === xf ? col.xfs : xf.merge(col.xfs, true);
					}
				}
			});

		}
		xf = getCompiledStyleFromArray(xf, styleComponents.conditional);
		return xf;
	}

	function getDefNameIndex(name) {
		//uniqueness is checked without capitalization
		return name ? name.toLowerCase() : name;
	}

	function getDefNameId(sheetId, name) {
		if (sheetId) {
			return sheetId + AscCommon.g_cCharDelimiter + getDefNameIndex(name);
		} else {
			return getDefNameIndex(name);
		}
	}

	var g_FDNI = {sheetId: null, name: null};

	function getFromDefNameId(nodeId) {
		var index = nodeId ? nodeId.indexOf(AscCommon.g_cCharDelimiter) : -1;
		if (-1 != index) {
			g_FDNI.sheetId = nodeId.substring(0, index);
			g_FDNI.name = nodeId.substring(index + 1);
		} else {
			g_FDNI.sheetId = null;
			g_FDNI.name = nodeId;
		}
	}

	function DefName(wb, name, ref, sheetId, hidden, isTable, isXLNM) {
		this.wb = wb;
		this.name = name;
		this.ref = ref;
		this.sheetId = sheetId;
		this.hidden = hidden;
		this.isTable = isTable;

		this.isXLNM = isXLNM;

		this.isLock = null;
		this.parsedRef = null;
	}

	DefName.prototype = {
		clone: function(wb){
			return new DefName(wb, this.name, this.ref, this.sheetId, this.hidden, this.isTable, this.isXLNM);
		},
		removeDependencies: function() {
			if (this.parsedRef) {
				this.parsedRef.removeDependencies();
				this.parsedRef = null;
			}
		},
		setRef: function(ref, opt_noRemoveDependencies, opt_forceBuild, opt_open) {
			if(!opt_noRemoveDependencies){
				this.removeDependencies();
			}
			//для R1C1: ref - всегда строка в виде A1B1
			//флаг opt_open - на открытие, undo/redo, принятие изменений - строка приходит в виде A1B1 - преобразовывать не нужно
			//во всех остальных случаях парсим ref и заменяем на формат A1B1
			opt_open = opt_open || this.wb.bRedoChanges || this.wb.bUndoChanges;

			this.ref = ref;
			//all ref should be 3d, so worksheet can be anyone
			this.parsedRef = new parserFormula(ref, this, AscCommonExcel.g_DefNameWorksheet);
			this.parsedRef.setIsTable(this.isTable);
			if (opt_forceBuild) {
				var oldR1C1mode = AscCommonExcel.g_R1C1Mode;
				if(opt_open) {
					AscCommonExcel.g_R1C1Mode = false;
				}
				this.parsedRef.parse();
				if(opt_open) {
					AscCommonExcel.g_R1C1Mode = oldR1C1mode;
				}
				this.parsedRef.buildDependencies();
			} else {
				if(!opt_open) {
					this.parsedRef.parse();
					this.ref = this.parsedRef.assemble();
				}
				this.wb.dependencyFormulas.addToBuildDependencyDefName(this);
			}
		},
		getRef: function(bLocale) {
			//R1C1 - отдаём в зависимости от флага bLocale(для меню в виде R1C1)
			var res;
			if(!this.parsedRef.isParsed) {
				var oldR1C1mode = AscCommonExcel.g_R1C1Mode;
				AscCommonExcel.g_R1C1Mode = false;
				this.parsedRef.parse();
				AscCommonExcel.g_R1C1Mode = oldR1C1mode;
			}
			if(bLocale) {
				res = this.parsedRef.assembleLocale(AscCommonExcel.cFormulaFunctionToLocale, true);
			} else {
				res = this.parsedRef.assemble();
			}
			return res;
		},
		getNodeId: function() {
			return getDefNameId(this.sheetId, this.name);
		},
		getAscCDefName: function(bLocale) {
			var index = null;
			if (this.sheetId) {
				var sheet = this.wb.getWorksheetById(this.sheetId);
				index = sheet.getIndex();
			}
			return new Asc.asc_CDefName(this.name, this.getRef(bLocale), index, this.isTable, this.hidden, this.isLock, this.isXLNM);
		},
		getUndoDefName: function() {
			return new UndoRedoData_DefinedNames(this.name, this.ref, this.sheetId, this.isTable, this.isXLNM);
		},
		setUndoDefName: function(newUndoName) {
			this.name = newUndoName.name;
			this.sheetId = newUndoName.sheetId;
			this.hidden = false;
			this.isTable = newUndoName.isTable;
			if (this.ref != newUndoName.ref) {
				this.setRef(newUndoName.ref);
			}
			this.isXLNM = newUndoName.isXLNM;
		},
		onFormulaEvent: function (type, eventData) {
			if (AscCommon.c_oNotifyParentType.IsDefName === type) {
				return null;
			} else if (AscCommon.c_oNotifyParentType.Change === type) {
				this.wb.dependencyFormulas.addToChangedDefName(this);
			} else if (AscCommon.c_oNotifyParentType.ChangeFormula === type) {
				var notifyType = eventData.notifyData.type;
				if (!(this.isTable && (c_oNotifyType.Shift === notifyType || c_oNotifyType.Move === notifyType || c_oNotifyType.Delete === notifyType))) {
					var oldUndoName = this.getUndoDefName();
					this.parsedRef.setFormulaString(this.ref = eventData.assemble);
					this.wb.dependencyFormulas.addToChangedDefName(this);
					var newUndoName = this.getUndoDefName();
					History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_DefinedNamesChangeUndo,
						null, null, new UndoRedoData_FromTo(oldUndoName, newUndoName), true);
				}
			}
		}
	};

	function getCellIndex(row, col) {
		return row * AscCommon.gc_nMaxCol + col;
	}

	var g_FCI = {row: null, col: null};

	function getFromCellIndex(cellIndex) {
		g_FCI.row = Math.floor(cellIndex / AscCommon.gc_nMaxCol);
		g_FCI.col = cellIndex % AscCommon.gc_nMaxCol;
	}

	function getVertexIndex(bbox) {
		//without $
		//значения в areaMap хранятся в виде A1B1
		//данная функция используется только для получения данных из areaMap
		var res;
		AscCommonExcel.executeInR1C1Mode(false, function () {
			res = bbox.getName(AscCommonExcel.referenceType.R);
		});
		return res;
	}

	function DependencyGraph(wb) {
		this.wb = wb;
		//listening
		this.sheetListeners = {};
		this.volatileListeners = {};
		this.defNameListeners = {};
		this.tempGetByCells = [];
		//set dirty
		this.isInCalc = false;
		this.changedCell = null;
		this.changedCellRepeated = null;
		this.changedRange = null;
		this.changedRangeRepeated = null;
		this.changedDefName = null;
		this.changedDefNameRepeated = null;
		this.changedShared = {};
		this.buildCell = {};
		this.buildDefName = {};
		this.buildShared = {};
		this.buildArrayFormula = [];
		this.cleanCellCache = {};
		//lock
		this.lockCounter = 0;
		//defined name
		this.defNames = {wb: {}, sheet: {}};
		this.tableNamePattern = "Table";
		this.tableNameIndex = 0;
	}

	DependencyGraph.prototype = {
		maxSharedRecursion: 100,
		//listening
		startListeningRange: function(sheetId, bbox, listener) {
			//todo bbox clone or bbox immutable
			var listenerId = listener.getListenerId();
			var sheetContainer = this.sheetListeners[sheetId];
			if (!sheetContainer) {
				sheetContainer = {cellMap: {}, areaMap: {}, defName3d: {}, rangesTop: null, rangesBottom: null, cells: null};
				this.sheetListeners[sheetId] = sheetContainer;
			}
			if (bbox.isOneCell()) {
				var cellIndex = getCellIndex(bbox.r1, bbox.c1);
				var cellMapElem = sheetContainer.cellMap[cellIndex];
				if (!cellMapElem) {
					cellMapElem = {cellIndex: cellIndex, count: 0, listeners: {}};
					sheetContainer.cellMap[cellIndex] = cellMapElem;
					sheetContainer.cells = null;
				}
				if (!cellMapElem.listeners[listenerId]) {
					cellMapElem.listeners[listenerId] = listener;
					cellMapElem.count++;
				}
			} else {
				var vertexIndex = getVertexIndex(bbox);
				var areaSheetElem = sheetContainer.areaMap[vertexIndex];
				if (!areaSheetElem) {
					//todo clone inside or outside startListeningRange?
					bbox = bbox.clone();
					areaSheetElem = {bbox: bbox, count: 0, listeners: {}, isActive: true};
					if (true) {
						areaSheetElem.sharedBroadcast = {changedBBox: null, prevChangedBBox: null, recursion: 0};
					}
					sheetContainer.areaMap[vertexIndex] = areaSheetElem;
					sheetContainer.rangesTop = null;
					sheetContainer.rangesBottom = null;
				}
				if (!areaSheetElem.listeners[listenerId]) {
					areaSheetElem.listeners[listenerId] = listener;
					areaSheetElem.count++;
				}
			}
		},
		endListeningRange: function(sheetId, bbox, listener) {
			var listenerId = listener.getListenerId();
			if (null != listenerId) {
				var sheetContainer = this.sheetListeners[sheetId];
				if (sheetContainer) {
					if (bbox.isOneCell()) {
						var cellIndex = getCellIndex(bbox.r1, bbox.c1);
						var cellMapElem = sheetContainer.cellMap[cellIndex];
						if (cellMapElem && cellMapElem.listeners[listenerId]) {
							delete cellMapElem.listeners[listenerId];
							cellMapElem.count--;
							if (cellMapElem.count <= 0) {
								delete sheetContainer.cellMap[cellIndex];
								sheetContainer.cells = null;
							}
						}
					} else {
						var vertexIndex = getVertexIndex(bbox);
						var areaSheetElem = sheetContainer.areaMap[vertexIndex];
						if (areaSheetElem && areaSheetElem.listeners[listenerId]) {
							delete areaSheetElem.listeners[listenerId];
							areaSheetElem.count--;
							if (areaSheetElem.count <= 0) {
								delete sheetContainer.areaMap[vertexIndex];
								sheetContainer.rangesTop = null;
								sheetContainer.rangesBottom = null;
							}
						}
					}
				}
			}
		},
		startListeningVolatile: function(listener) {
			var listenerId = listener.getListenerId();
			this.volatileListeners[listenerId] = listener;
		},
		endListeningVolatile: function(listener) {
			var listenerId = listener.getListenerId();
			if (null != listenerId) {
				delete this.volatileListeners[listenerId];
			}
		},
		startListeningDefName: function(name, listener, opt_sheetId) {
			var listenerId = listener.getListenerId();
			var nameIndex = getDefNameIndex(name);
			var container = this.defNameListeners[nameIndex];
			if (!container) {
				container = {count: 0, listeners: {}};
				this.defNameListeners[nameIndex] = container;
			}
			if (!container.listeners[listenerId]) {
				container.listeners[listenerId] = listener;
				container.count++;
			}
			if(opt_sheetId){
				var sheetContainer = this.sheetListeners[opt_sheetId];
				if (!sheetContainer) {
					sheetContainer = {cellMap: {}, areaMap: {}, defName3d: {}, rangesTop: null, rangesBottom: null, cells: null};
					this.sheetListeners[opt_sheetId] = sheetContainer;
				}
				sheetContainer.defName3d[listenerId] = listener;
			}
		},
		isListeningDefName: function(name) {
			return null != this.defNameListeners[getDefNameIndex(name)];
		},
		endListeningDefName: function(name, listener, opt_sheetId) {
			var listenerId = listener.getListenerId();
			if (null != listenerId) {
				var nameIndex = getDefNameIndex(name);
				var container = this.defNameListeners[nameIndex];
				if (container && container.listeners[listenerId]) {
					delete container.listeners[listenerId];
					container.count--;
					if (container.count <= 0) {
						delete this.defNameListeners[nameIndex];
					}
				}
				if(opt_sheetId){
					var sheetContainer = this.sheetListeners[opt_sheetId];
					if (sheetContainer) {
						delete sheetContainer.defName3d[listenerId];
					}
				}
			}
		},
		//shift, move
		deleteNodes: function(sheetId, bbox) {
			this.buildDependency();
			this._shiftMoveDelete(c_oNotifyType.Delete, sheetId, bbox, null);
			this.addToChangedRange(sheetId, bbox);
		},
		shift: function(sheetId, bbox, offset) {
			this.buildDependency();
			return this._shiftMoveDelete(c_oNotifyType.Shift, sheetId, bbox, offset);
		},
		move: function(sheetId, bboxFrom, offset, sheetIdTo) {
			this.buildDependency();
			this._shiftMoveDelete(c_oNotifyType.Move, sheetId, bboxFrom, offset, sheetIdTo);
			this.addToChangedRange(sheetId, bboxFrom);
		},
		prepareChangeSheet: function(sheetId, data, tableNamesMap) {
			this.buildDependency();
			var listeners = {};
			var sheetContainer = this.sheetListeners[sheetId];
			if (sheetContainer) {
				for (var cellIndex in sheetContainer.cellMap) {
					var cellMapElem = sheetContainer.cellMap[cellIndex];
					for (var listenerId in cellMapElem.listeners) {
						listeners[listenerId] = cellMapElem.listeners[listenerId];
					}
				}
				for (var vertexIndex in sheetContainer.areaMap) {
					var areaSheetElem = sheetContainer.areaMap[vertexIndex];
					for (var listenerId in areaSheetElem.listeners) {
						listeners[listenerId] = areaSheetElem.listeners[listenerId];
					}
				}
				for (var listenerId in sheetContainer.defName3d) {
					listeners[listenerId] = sheetContainer.defName3d[listenerId];
				}
			}
			if(tableNamesMap){
				for (var tableName in tableNamesMap) {
					var nameIndex = getDefNameIndex(tableName);
					var container = this.defNameListeners[nameIndex];
					if (container) {
						for (var listenerId in container.listeners) {
							listeners[listenerId] = container.listeners[listenerId];
						}
					}
				}
			}
			var notifyData = {
				type: c_oNotifyType.Prepare, actionType: c_oNotifyType.ChangeSheet, data: data, transformed: {},
				preparedData: {}
			};
			for (var listenerId in listeners) {
				listeners[listenerId].notify(notifyData);
			}
			for (var listenerId in notifyData.transformed) {
				if (notifyData.transformed.hasOwnProperty(listenerId)) {
					delete listeners[listenerId];
					var elems = notifyData.transformed[listenerId];
					for (var i = 0; i < elems.length; ++i) {
						var elem = elems[i];
						listeners[elem.getListenerId()] = elem;
						elem.notify(notifyData);
					}
				}
			}
			return {listeners: listeners, data: data, preparedData: notifyData.preparedData};
		},
		changeSheet: function(prepared) {
			var notifyData = {type: c_oNotifyType.ChangeSheet, data: prepared.data, preparedData: prepared.preparedData};
			for (var listenerId in prepared.listeners) {
				prepared.listeners[listenerId].notify(notifyData);
			}
		},
		prepareRemoveSheet: function(sheetId, tableNames) {
			var t = this;
			//cells
			var formulas = [];
			this.wb.getWorksheetById(sheetId).getAllFormulas(formulas);
			for (var i = 0; i < formulas.length; ++i) {
				formulas[i].removeDependencies();
			}
			//defnames
			this._foreachDefNameSheet(sheetId, function(defName){
				if (!defName.isTable) {
					t._removeDefName(sheetId, defName.name, AscCH.historyitem_Workbook_DefinedNamesChangeUndo);
					}
			});
			//tables
			var tableNamesMap = {};
			for (var i = 0; i < tableNames.length; ++i) {
				var tableName = tableNames[i];
				this._removeDefName(null, tableName, null);
				tableNamesMap[tableName] = 1;
			}
			//dependence
			return this.prepareChangeSheet(sheetId, {remove: sheetId, tableNamesMap: tableNamesMap}, tableNamesMap);
		},
		removeSheet: function(prepared) {
			this.changeSheet(prepared);
		},
		//lock
		lockRecal: function() {
			++this.lockCounter;
		},
		isLockRecal: function() {
			return this.lockCounter > 0;
		},
		unlockRecal: function() {
			if (0 < this.lockCounter) {
				--this.lockCounter;
			}
			if (0 >= this.lockCounter) {
				this.calcTree();
			}
		},
		lockRecalExecute: function(callback) {
			this.lockRecal();
			callback();
			this.unlockRecal();
		},
		//defined name
		getDefNameByName: function(name, sheetId, opt_exact) {
			var res = null;
			var nameIndex = getDefNameIndex(name);
			if (sheetId) {
				var sheetContainer = this.defNames.sheet[sheetId];
				if (sheetContainer) {
					res = sheetContainer[nameIndex];
				}
			}
			if (!res && !(opt_exact && sheetId)) {
				res = this.defNames.wb[nameIndex];
			}
			return res;
		},
		getDefNameByNodeId: function(nodeId) {
			getFromDefNameId(nodeId);
			return this.getDefNameByName(g_FDNI.name, g_FDNI.sheetId, true);
		},
		getDefNameByRef: function(ref, sheetId, bLocale) {
			var getByRef = function(defName) {
				if (!defName.hidden && defName.ref == ref) {
					return defName.name;
				}
			};
			var res = this._foreachDefNameSheet(sheetId, getByRef);
			if(res && bLocale) {
				res = AscCommon.translateManager.getValue(res);
			}
			if (!res) {
				res = this._foreachDefNameBook(getByRef);
			}
			return res;
		},
		getDefinedNamesWB: function(type, bLocale) {
			var names = [], activeWS;

			function getNames(defName) {
				if (defName.ref && !defName.hidden && (defName.name.indexOf("_xlnm") < 0)) {
					names.push(defName.getAscCDefName(bLocale));
				}
			}

			function sort(a, b) {
				if (a.name > b.name) {
					return 1;
				} else if (a.name < b.name) {
					return -1;
				} else {
					return 0;
				}
			}

			switch (type) {
				case c_oAscGetDefinedNamesList.Worksheet:
				case c_oAscGetDefinedNamesList.WorksheetWorkbook:
					activeWS = this.wb.getActiveWs();
					this._foreachDefNameSheet(activeWS.getId(), getNames);
					if (c_oAscGetDefinedNamesList.WorksheetWorkbook) {
						this._foreachDefNameBook(getNames);
					}
					break;
				case c_oAscGetDefinedNamesList.All:
				default:
					this._foreachDefName(getNames);
					break;
			}
			return names.sort(sort);
		},
		getDefinedNamesWS: function(sheetId) {
			var names = [];

			function getNames(defName) {
				if (defName.ref) {
					names.push(defName);
				}
			}

			this._foreachDefNameSheet(sheetId, getNames);
			return names;
		},
		addDefNameOpen: function(name, ref, sheetIndex, hidden, isTable) {
			var sheetId = this.wb.getSheetIdByIndex(sheetIndex);
			var isXLNM = null;
			if(name === "_xlnm.Print_Area") {
				name = "Print_Area";
				isXLNM = true;
			}
			var defName = new DefName(this.wb, name, ref, sheetId, hidden, isTable, isXLNM);
			this._addDefName(defName);
			return defName;
		},
		addDefName: function(name, ref, sheetId, hidden, isTable, isXLNM) {
			var defName = new DefName(this.wb, name, ref, sheetId, hidden, isTable, isXLNM);
			defName.setRef(defName.ref, true);
			this._addDefName(defName);
			return defName;
		},
		removeDefName: function(sheetId, name) {
			this._removeDefName(sheetId, name, AscCH.historyitem_Workbook_DefinedNamesChange);
		},
		editDefinesNames: function(oldUndoName, newUndoName) {
			var res = null;
			if (!AscCommon.rx_defName.test(getDefNameIndex(newUndoName.name)) || !newUndoName.ref ||
				newUndoName.ref.length == 0 || newUndoName.name.length > g_nDefNameMaxLength) {
				return res;
			}
			if (oldUndoName) {
				res = this.getDefNameByName(oldUndoName.name, oldUndoName.sheetId);
			} else {
				res = this.addDefName(newUndoName.name, newUndoName.ref, newUndoName.sheetId, false, false, newUndoName.isXLNM);
			}
			History.Create_NewPoint();
			if (res && oldUndoName) {
				if (oldUndoName.name != newUndoName.name) {
					this.buildDependency();

					res = this._delDefName(res.name, res.sheetId);
					res.setUndoDefName(newUndoName);
					this._addDefName(res);

					var notifyData = {type: c_oNotifyType.ChangeDefName, from: oldUndoName, to: newUndoName};
					this._broadcastDefName(oldUndoName.name, notifyData);

					this.addToChangedDefName(res);
				} else {
					res.setUndoDefName(newUndoName);
				}
			}
			History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_DefinedNamesChange, null, null,
				new UndoRedoData_FromTo(oldUndoName, newUndoName));
			return res;
		},
		checkDefName: function (name, sheetIndex) {
			var res = new Asc.asc_CCheckDefName();
			var range = AscCommonExcel.g_oRangeCache.getRange3D(name) ||
				AscCommonExcel.g_oRangeCache.getAscRange(name);
			if(!range) {
				//проверяем на совпадение с именем диапазона в другом формате
				AscCommonExcel.executeInR1C1Mode(!AscCommonExcel.g_R1C1Mode, function () {
					range = AscCommonExcel.g_oRangeCache.getRange3D(name) ||
						AscCommonExcel.g_oRangeCache.getAscRange(name);
				});
			}
			if (range || !AscCommon.rx_defName.test(name.toLowerCase()) || name.length > g_nDefNameMaxLength) {
				res.status = false;
				res.reason = c_oAscDefinedNameReason.WrongName;
				return res;
			}

			var sheetId = this.wb.getSheetIdByIndex(sheetIndex);
			var defName = this.getDefNameByName(name, sheetId, true);
			if (defName) {
				res.status = false;
				if (defName.isLock) {
					res.reason = c_oAscDefinedNameReason.IsLocked;
				} else {
					res.reason = c_oAscDefinedNameReason.Existed;
				}
			} else {
				if (this.isListeningDefName(name)) {
					res.status = false;
					res.reason = c_oAscDefinedNameReason.NameReserved;
				} else {
					res.status = true;
					res.reason = c_oAscDefinedNameReason.OK;
				}
			}

			return res;
		},
		copyDefNameByWorksheet: function(wsFrom, wsTo, renameParams) {
			var sheetContainerFrom = this.defNames.sheet[wsFrom.getId()];
			if (sheetContainerFrom) {
				for (var name in sheetContainerFrom) {
					var defNameOld = sheetContainerFrom[name];
					if (!defNameOld.isTable && defNameOld.parsedRef) {
						var parsedRefNew = defNameOld.parsedRef.clone();
						parsedRefNew.renameSheetCopy(renameParams);
						var refNew = parsedRefNew.assemble(true);
						this.addDefName(defNameOld.name, refNew, wsTo.getId(), defNameOld.hidden, defNameOld.isTable);
					}
				}
			}
		},
		saveDefName: function() {
			var list = [];
			this._foreachDefName(function(defName) {
				if (!defName.isTable && defName.ref) {
					list.push(defName.getAscCDefName());
				}
			});
			return list;
		},
		unlockDefName: function() {
			this._foreachDefName(function(defName) {
				defName.isLock = null;
			});
		},
		unlockCurrentDefName: function(name, sheetId) {
			var defName = this.getDefNameByName(name, sheetId);
			if(defName) {
				defName.isLock = null;
			}
		},
		checkDefNameLock: function() {
			return this._foreachDefName(function(defName) {
				return defName.isLock;
			});
		},
		//defined name table
		getNextTableName: function() {
			var sNewName;
			var collaborativeIndexUser = "";
			if (this.wb.oApi.collaborativeEditing.getCollaborativeEditing()) {
				collaborativeIndexUser = "_" + this.wb.oApi.CoAuthoringApi.get_indexUser();
			}
			do {
				this.tableNameIndex++;
				var tableName = AscCommon.translateManager.getValue(this.tableNamePattern)
				sNewName = tableName + this.tableNameIndex + collaborativeIndexUser;
			} while (this.getDefNameByName(sNewName, null) || this.isListeningDefName(sNewName));
			return sNewName;
		},
		addTableName: function(ws, table, opt_isOpen) {
			var ref = table.getRangeWithoutHeaderFooter();

			var defNameRef = parserHelp.get3DRef(ws.getName(), ref.getAbsName());
			var defName = this.getDefNameByName(table.DisplayName, null);
			if (!defName) {
				if(opt_isOpen){
					this.addDefNameOpen(table.DisplayName, defNameRef, null, null, true);
				} else {
					this.addDefName(table.DisplayName, defNameRef, null, null, true);
				}
			} else {
				defName.setRef(defNameRef);
			}
		},
		changeTableRef: function(table) {
			var defName = this.getDefNameByName(table.DisplayName, null);
			if (defName) {
				this.buildDependency();
				var oldUndoName = defName.getUndoDefName();
				var newUndoName = defName.getUndoDefName();
				var ref = table.getRangeWithoutHeaderFooter();
				newUndoName.ref = defName.ref.split('!')[0] + '!' + ref.getAbsName();
				History.TurnOff();
				this.editDefinesNames(oldUndoName, newUndoName);
				var notifyData = {type: c_oNotifyType.ChangeDefName, from: oldUndoName, to: newUndoName};
				this._broadcastDefName(defName.name, notifyData);
				History.TurnOn();
				this.addToChangedDefName(defName);
				this.calcTree();
			}
		},
		changeTableName: function(tableName, newName) {
			var defName = this.getDefNameByName(tableName, null);
			if (defName) {
				var oldUndoName = defName.getUndoDefName();
				var newUndoName = defName.getUndoDefName();
				newUndoName.name = newName;
				History.TurnOff();
				this.editDefinesNames(oldUndoName, newUndoName);
				History.TurnOn();
			}
		},
		delTableName: function(tableName, bConvertTableFormulaToRef) {
			this.buildDependency();
			var defName = this.getDefNameByName(tableName);
			
			this.addToChangedDefName(defName);
			var notifyData = {type: c_oNotifyType.ChangeDefName, from: defName.getUndoDefName(), to: null, bConvertTableFormulaToRef: bConvertTableFormulaToRef};
			this._broadcastDefName(tableName, notifyData);
			
			this._delDefName(tableName, null);
			if (defName) {
				defName.removeDependencies();
			}
		},
		delColumnTable: function(tableName, deleted) {
			this.buildDependency();
			var notifyData = {type: c_oNotifyType.DelColumnTable, tableName: tableName, deleted: deleted};
			this._broadcastDefName(tableName, notifyData);
		},
		renameTableColumn: function(tableName) {
			var defName = this.getDefNameByName(tableName, null);
			if (defName) {
				this.buildDependency();
				var notifyData = {type: c_oNotifyType.RenameTableColumn, tableName: tableName};
				this._broadcastDefName(defName.name, notifyData);
			}
			this.calcTree();
		},
		//set dirty
		addToChangedRange2: function(sheetId, bbox) {
			if (!this.changedRange) {
				this.changedRange = {};
			}
			var changedSheet = this.changedRange[sheetId];
			if (!changedSheet) {
				//{}, а не [], потому что при сборке может придти сразу много одинаковых ячеек
				changedSheet = {};
				this.changedRange[sheetId] = changedSheet;
			}
			var name = getVertexIndex(bbox);
			if (this.isInCalc && !changedSheet[name]) {
				if (!this.changedRangeRepeated) {
					this.changedRangeRepeated = {};
				}
				var changedSheetRepeated = this.changedRangeRepeated[sheetId];
				if (!changedSheetRepeated) {
					changedSheetRepeated = {};
					this.changedRangeRepeated[sheetId] = changedSheetRepeated;
				}
				changedSheetRepeated[name] = bbox;
			}
			changedSheet[name] = bbox;
		},
		addToChangedCell: function(cell) {
			var t = this;
			var sheetId = cell.ws.getId();
			if (!this.changedCell) {
				this.changedCell = {};
			}
			var changedSheet = this.changedCell[sheetId];
			if (!changedSheet) {
				//{}, а не [], потому что при сборке может придти сразу много одинаковых ячеек
				changedSheet = {};
				this.changedCell[sheetId] = changedSheet;
			}

			var addChangedSheet = function(row, col) {
				var cellIndex = getCellIndex(row, col);
				if (t.isInCalc && undefined === changedSheet[cellIndex]) {
					if (!t.changedCellRepeated) {
						t.changedCellRepeated = {};
					}
					var changedSheetRepeated = t.changedCellRepeated[sheetId];
					if (!changedSheetRepeated) {
						changedSheetRepeated = {};
						t.changedCellRepeated[sheetId] = changedSheetRepeated;
					}
					changedSheetRepeated[cellIndex] = cellIndex;
				}
				changedSheet[cellIndex] = cellIndex;
			};

			addChangedSheet(cell.nRow, cell.nCol);
		},
		addToChangedDefName: function(defName) {
			if (!this.changedDefName) {
				this.changedDefName = {};
			}
			var nodeId = defName.getNodeId();
			if (this.isInCalc && !this.changedDefName[nodeId]) {
				if (!this.changedDefNameRepeated) {
					this.changedDefNameRepeated = {};
				}
				this.changedDefNameRepeated[nodeId] = 1;
			}
			this.changedDefName[nodeId] = 1;
		},
		addToChangedRange: function(sheetId, bbox) {
			var notifyData = {type: c_oNotifyType.Dirty};
			var sheetContainer = this.sheetListeners[sheetId];
			if (sheetContainer) {
				for (var cellIndex in sheetContainer.cellMap) {
					getFromCellIndex(cellIndex);
					if (bbox.contains(g_FCI.col, g_FCI.row)) {
						var cellMapElem = sheetContainer.cellMap[cellIndex];
						for (var listenerId in cellMapElem.listeners) {
							cellMapElem.listeners[listenerId].notify(notifyData);
						}
					}
				}
				for (var areaIndex in sheetContainer.areaMap) {
					var areaMapElem = sheetContainer.areaMap[areaIndex];
					var isIntersect = bbox.isIntersect(areaMapElem.bbox);
					if (isIntersect) {
						for (var listenerId in areaMapElem.listeners) {
							areaMapElem.listeners[listenerId].notify(notifyData);
						}
					}
				}
			}
		},
		addToChangedHiddenRows: function() {
			//notify hidden rows
			var tmpRange = new Asc.Range(0, 0, gc_nMaxCol0, 0);
			for (var i = 0; i < this.wb.aWorksheets.length; ++i) {
				var ws = this.wb.aWorksheets[i];
				var hiddenRange = ws.hiddenManager.getHiddenRowsRange();
				if (hiddenRange) {
					tmpRange.r1 = hiddenRange.r1;
					tmpRange.r2 = hiddenRange.r2;
					this.addToChangedRange(ws.getId(), tmpRange);
				}
			}
		},
		addToBuildDependencyCell: function(cell) {
			var sheetId = cell.ws.getId();
			var unparsedSheet = this.buildCell[sheetId];
			if (!unparsedSheet) {
				//{}, а не [], потому что при сборке может придти сразу много одинаковых ячеек
				unparsedSheet = {};
				this.buildCell[sheetId] = unparsedSheet;
			}
			unparsedSheet[getCellIndex(cell.nRow, cell.nCol)] = 1;
		},
		addToBuildDependencyDefName: function(defName) {
			this.buildDefName[defName.getNodeId()] = 1;
		},
		addToBuildDependencyShared: function(shared) {
			this.buildShared[shared.getIndexNumber()] = shared;
		},
		addToBuildDependencyArray: function(f) {
			//TODO переммотреть! добавлять по индексу!
			//добавляю не по индексу потому на момент вызова(setValue) ещё не проставились индексы формулам
			//происходит это позже - в Cell.prototype.saveContent
			this.buildArrayFormula.push(f);
		},
		addToCleanCellCache: function(sheetId, row, col) {
			var sheetArea = this.cleanCellCache[sheetId];
			if (sheetArea) {
				sheetArea.union3(col, row);
			} else {
				this.cleanCellCache[sheetId] = new Asc.Range(col, row, col, row);
			}
		},
		addToChangedShared: function(parsed) {
			this.changedShared[parsed.getIndexNumber()] = parsed;
		},
		notifyChanged: function(changedFormulas) {
			var notifyData = {type: c_oNotifyType.Dirty};
			for (var listenerId in changedFormulas) {
				changedFormulas[listenerId].notify(notifyData);
			}
		},
		//build, calc
		buildDependency: function() {
			for (var sheetId in this.buildCell) {
				var ws = this.wb.getWorksheetById(sheetId);
				if (ws) {
					var unparsedSheet = this.buildCell[sheetId];
					for (var cellIndex in unparsedSheet) {
						getFromCellIndex(cellIndex);
						ws._getCellNoEmpty(g_FCI.row, g_FCI.col, function(cell) {
							if (cell) {
								cell._BuildDependencies(true, true);
							}
						});
					}
				}
			}
			for (var defNameId in this.buildDefName) {
				var defName = this.getDefNameByNodeId(defNameId);
				if (defName && defName.parsedRef) {
					defName.parsedRef.parse();
					defName.parsedRef.buildDependencies();
					this.addToChangedDefName(defName);
				}
			}
			for (var index in this.buildShared) {
				if (this.buildShared.hasOwnProperty(index)) {
					var parsed = this.wb.workbookFormulas.get(index - 0);
					if (parsed) {
						parsed.parse();
						parsed.buildDependencies();
						var shared = parsed.getShared();
						this.wb.dependencyFormulas.addToChangedRange2(parsed.getWs().getId(), shared.ref);
					}
				}
			}
			for (var index in this.buildArrayFormula) {
				var parsed = this.buildArrayFormula[index];
				if (parsed) {
					parsed.parse();
					parsed.buildDependencies();
					var array = parsed.getArrayFormulaRef();
					this.wb.dependencyFormulas.addToChangedRange2(parsed.getWs().getId(), array);
				}
			}
			this.buildCell = {};
			this.buildDefName = {};
			this.buildShared = {};
			this.buildArrayFormula = [];
		},
		calcTree: function() {
			if (this.lockCounter > 0) {
				return;
			}
			this.buildDependency();
			this.addToChangedHiddenRows();
			if (!(this.changedCell || this.changedRange || this.changedDefName)) {
				return;
			}
			var notifyData = {type: c_oNotifyType.Dirty, areaData: undefined};
			this._broadscastVolatile(notifyData);
			this._broadcastCellsStart();
			while (this.changedCellRepeated || this.changedRangeRepeated || this.changedDefNameRepeated) {
				this._broadcastDefNames(notifyData);
				this._broadcastCells(notifyData);
				this._broadcastRanges(notifyData);
			}
			this._broadcastCellsEnd();

			this._calculateDirty();
			this.updateSharedFormulas();
			//copy cleanCellCache to prevent recursion in trigger("cleanCellCache")
			var tmpCellCache = this.cleanCellCache;
			this.cleanCellCache = {};
			for (var i in tmpCellCache) {
				this.wb.handlers.trigger("cleanCellCache", i, [tmpCellCache[i]], true);
			}
			AscCommonExcel.g_oVLOOKUPCache.clean();
			AscCommonExcel.g_oHLOOKUPCache.clean();
			AscCommonExcel.g_oMatchCache.clean();
			AscCommonExcel.g_oSUMIFSCache.clean();
		},
		initOpen: function() {
			this._foreachDefName(function(defName) {
				defName.setRef(defName.ref, true, true, true);
			});
		},
		getSnapshot: function(wb) {
			var res = new DependencyGraph(wb);
			this._foreachDefName(function(defName){
				//_addDefName because we don't need dependency
				//include table defNames too.
				res._addDefName(defName.clone(wb));
			});
			res.tableNameIndex = this.tableNameIndex;
			return res;
		},
		getAllFormulas: function(formulas) {
			this._foreachDefName(function(defName) {
				if (defName.parsedRef) {
					formulas.push(defName.parsedRef);
				}
			});
		},
		updateSharedFormulas: function() {
			var newRef;
			for (var indexNumber in this.changedShared) {
				var parsed = this.changedShared[indexNumber];
				var shared = parsed.getShared();
				if (shared) {
					var ws = parsed.getWs();
					var ref = shared.ref;
					var r1 = gc_nMaxRow0;
					var c1 = gc_nMaxCol0;
					var r2 = 0;
					var c2 = 0;
					ws.getRange3(ref.r1, ref.c1, ref.r2, ref.c2)._foreachNoEmpty(function(cell) {
						if (parsed === cell.getFormulaParsed()) {
							r1 = Math.min(r1, cell.nRow);
							c1 = Math.min(c1, cell.nCol);
							r2 = Math.max(r2, cell.nRow);
							c2 = Math.max(c2, cell.nCol);
						}
					});
					newRef = undefined;
					if (r1 <= r2 && c1 <= c2) {
						newRef = new Asc.Range(c1, r1, c2, r2);
					}
					parsed.setSharedRef(newRef);
				}
			}
			this.changedShared = {};
		},
		//internal
		_addDefName: function(defName) {
			var nameIndex = getDefNameIndex(defName.name);
			var container;
			var sheetId = defName.sheetId;
			if (sheetId) {
				container = this.defNames.sheet[sheetId];
				if (!container) {
					container = {};
					this.defNames.sheet[sheetId] = container;
				}
			} else {
				container = this.defNames.wb;
			}
			var cur = container[nameIndex];
			if (cur) {
				cur.removeDependencies();
			}
			container[nameIndex] = defName;
		},
		_removeDefName: function(sheetId, name, historyType) {
			var defName = this._delDefName(name, sheetId);
			if (defName) {
				if (null != historyType) {
					History.Create_NewPoint();
					History.Add(AscCommonExcel.g_oUndoRedoWorkbook, historyType, null, null,
								new UndoRedoData_FromTo(defName.getUndoDefName(), null));
				}

				defName.removeDependencies();
				this.addToChangedDefName(defName);
			}
		},
		_delDefName: function(name, sheetId) {
			var res = null;
			var nameIndex = getDefNameIndex(name);
			var sheetContainer;
			if (sheetId) {
				sheetContainer = this.defNames.sheet[sheetId];
			}
			else {
				sheetContainer = this.defNames.wb;
			}
			if (sheetContainer) {
				res = sheetContainer[nameIndex];
				delete sheetContainer[nameIndex];
			}
			return res;
		},
		_foreachDefName: function(action) {
			var containerSheet;
			var sheetId;
			var name;
			var res;
			for (sheetId in this.defNames.sheet) {
				containerSheet = this.defNames.sheet[sheetId];
				for (name in containerSheet) {
					res = action(containerSheet[name], containerSheet);
					if (res) {
						break;
					}
				}
			}
			if (!res) {
				res = this._foreachDefNameBook(action);
			}
			return res;
		},
		_foreachDefNameSheet: function(sheetId, action) {
			var name;
			var res;
			var containerSheet = this.defNames.sheet[sheetId];
			if (containerSheet) {
				for (name in containerSheet) {
					res = action(containerSheet[name], containerSheet);
					if (res) {
						break;
					}
				}
			}
			return res;
		},
		_foreachDefNameBook: function(action) {
			var containerSheet;
			var name;
			var res;
			for (name in this.defNames.wb) {
				res = action(this.defNames.wb[name], this.defNames.wb);
				if (res) {
					break;
				}
			}
			return res;
		},
		_broadscastVolatile: function(notifyData) {
			for (var i in this.volatileListeners) {
				this.volatileListeners[i].notify(notifyData);
			}
		},
		_broadcastDefName: function(name, notifyData) {
			var nameIndex = getDefNameIndex(name);
			var container = this.defNameListeners[nameIndex];
			if (container) {
				for (var listenerId in container.listeners) {
					container.listeners[listenerId].notify(notifyData);
				}
			}
		},
		_broadcastDefNames: function(notifyData) {
			if (this.changedDefNameRepeated) {
				var changedDefName = this.changedDefNameRepeated;
				this.changedDefNameRepeated = null;
				for (var nodeId in changedDefName) {
					getFromDefNameId(nodeId);
					this._broadcastDefName(g_FDNI.name, notifyData);
				}
			}
		},
		_broadcastCells: function(notifyData) {
			if (this.changedCellRepeated) {
				var changedCell = this.changedCellRepeated;
				this.changedCellRepeated = null;
				for (var sheetId in changedCell) {
					var changedSheet = changedCell[sheetId];
					var sheetContainer = this.sheetListeners[sheetId];
					if (sheetContainer) {
						var cells = [];
						for (var cellIndex in changedSheet) {
							cells.push(changedSheet[cellIndex]);
						}
						cells.sort(AscCommon.fSortAscending);
						this._broadcastCellsByCells(sheetContainer, cells, notifyData);
						this._broadcastRangesByCells(sheetContainer, cells, notifyData);
					}
				}
			}
		},
		_broadcastRanges: function(notifyData) {
			if (this.changedRangeRepeated) {
				var changedRange = this.changedRangeRepeated;
				this.changedRangeRepeated = null;
				for (var sheetId in changedRange) {
					var changedSheet = changedRange[sheetId];
					var sheetContainer = this.sheetListeners[sheetId];
					if (sheetContainer) {
						if (sheetContainer) {
							var rangesTop = [];
							var rangesBottom = [];
							for (var name in changedSheet) {
								var range = changedSheet[name];
								rangesTop.push(range);
								rangesBottom.push(range);
							}
							rangesTop.sort(Asc.Range.prototype.compareByLeftTop);
							rangesBottom.sort(Asc.Range.prototype.compareByRightBottom);
							this._broadcastCellsByRanges(sheetContainer, rangesTop, rangesBottom, notifyData);
							this._broadcastRangesByRanges(sheetContainer, rangesTop, rangesBottom, notifyData);
						}
					}
				}
			}
		},
		_broadcastCellsStart: function() {
			this.isInCalc = true;
			this.changedCellRepeated = this.changedCell;
			this.changedRangeRepeated = this.changedRange;
			this.changedDefNameRepeated = this.changedDefName;
			for (var sheetId in this.sheetListeners) {
				var sheetContainer = this.sheetListeners[sheetId];
				if (!sheetContainer.cells) {
					sheetContainer.cells = [];
					for (var cellIndex in sheetContainer.cellMap) {
						sheetContainer.cells.push(sheetContainer.cellMap[cellIndex]);
					}
					sheetContainer.cells.sort(function(a, b) {
						return a.cellIndex - b.cellIndex
					});
				}
				if (!sheetContainer.rangesTop || !sheetContainer.rangesBottom) {
					sheetContainer.rangesTop = [];
					sheetContainer.rangesBottom = [];
					for (var name in sheetContainer.areaMap) {
						var elem = sheetContainer.areaMap[name];
						sheetContainer.rangesTop.push(elem);
						sheetContainer.rangesBottom.push(elem);
					}

					sheetContainer.rangesTop.sort(function(a, b) {
						return Asc.Range.prototype.compareByLeftTop(a.bbox, b.bbox)
					});
					sheetContainer.rangesBottom.sort(function(a, b) {
						return Asc.Range.prototype.compareByRightBottom(a.bbox, b.bbox)
					});
				}
			}
		},
		_broadcastCellsEnd: function() {
			this.isInCalc = false;
			this.changedDefName = null;
			for (var i = 0; i < this.tempGetByCells.length; ++i) {
				for (var j = 0; j < this.tempGetByCells[i].length; ++j) {
					var temp = this.tempGetByCells[i][j];

					temp.isActive = true;
					if (temp.sharedBroadcast) {
						temp.sharedBroadcast.changedBBox = null;
						temp.sharedBroadcast.prevChangedBBox = null;
						temp.sharedBroadcast.recursion = 0;
					}
				}
			}
			this.tempGetByCells = [];
		},
		_calculateDirty: function() {
			var t = this;
			this._foreachChanged(function(cell){
				if (cell && cell.isFormula()) {
					cell.setIsDirty(true);
				}
			});
			this._foreachChanged(function(cell){
				cell && cell._checkDirty();
			});
			this.changedCell = null;
			this.changedRange = null;
		},
		_foreachChanged: function(callback) {
			var sheetId, changedSheet, ws, bbox;
			for (sheetId in this.changedCell) {
				if (this.changedCell.hasOwnProperty(sheetId)) {
					changedSheet = this.changedCell[sheetId];
					ws = this.wb.getWorksheetById(sheetId);
					if (changedSheet && ws) {
						for (var cellIndex in changedSheet) {
							if (changedSheet.hasOwnProperty(cellIndex)) {
								getFromCellIndex(cellIndex);
								ws._getCell(g_FCI.row, g_FCI.col, callback);
							}
						}
					}
				}
			}
			for (sheetId in this.changedRange) {
				if (this.changedRange.hasOwnProperty(sheetId)) {
					changedSheet = this.changedRange[sheetId];
					ws = this.wb.getWorksheetById(sheetId);
					if (changedSheet && ws) {
						for (var name in changedSheet) {
							if (changedSheet.hasOwnProperty(name)) {
								bbox = changedSheet[name];
								ws.getRange3(bbox.r1, bbox.c1, bbox.r2, bbox.c2)._foreachNoEmpty(callback);
							}
						}
					}
				}
			}
		},
		_shiftMoveDelete: function(notifyType, sheetId, bbox, offset, sheetIdTo) {
			var listeners = {};
			var res = {changed: listeners, shiftedShared: {}};
			var sheetContainer = this.sheetListeners[sheetId];
			if (sheetContainer) {
				var bboxShift;
				if (c_oNotifyType.Shift === notifyType) {
					var bHor = 0 !== offset.col;
					bboxShift = AscCommonExcel.shiftGetBBox(bbox, bHor);
				}
				var isIntersect;
				for (var cellIndex in sheetContainer.cellMap) {
					getFromCellIndex(cellIndex);
					if (c_oNotifyType.Shift === notifyType) {
						isIntersect = bboxShift.contains(g_FCI.col, g_FCI.row);
					} else {
						isIntersect = bbox.contains(g_FCI.col, g_FCI.row);
					}
					if (isIntersect) {
						var cellMapElem = sheetContainer.cellMap[cellIndex];
						for (var listenerId in cellMapElem.listeners) {
							listeners[listenerId] = cellMapElem.listeners[listenerId];
						}
					}
				}
				for (var areaIndex in sheetContainer.areaMap) {
					var areaMapElem = sheetContainer.areaMap[areaIndex];
					if (c_oNotifyType.Shift === notifyType) {
						isIntersect = bboxShift.isIntersect(areaMapElem.bbox)
					} else if (c_oNotifyType.Move === notifyType || c_oNotifyType.Delete === notifyType) {
						isIntersect = bbox.isIntersect(areaMapElem.bbox);
					}
					if (isIntersect) {
						for (var listenerId in areaMapElem.listeners) {
							listeners[listenerId] = areaMapElem.listeners[listenerId];
						}
					}
				}
				var notifyData = {
					type: notifyType, sheetId: sheetId, sheetIdTo: sheetIdTo, bbox: bbox, offset: offset, shiftedShared: res.shiftedShared
				};
				for (var listenerId in listeners) {
					listeners[listenerId].notify(notifyData);
				}
			}
			return res;
		},
		_broadcastCellsByCells: function(sheetContainer, cellsChanged, notifyData) {
			var cells = sheetContainer.cells;
			var indexCell = 0;
			var indexCellChanged = 0;
			var row, col, rowChanged, colChanged;
			if (indexCell < cells.length) {
				getFromCellIndex(cells[indexCell].cellIndex);
				row = g_FCI.row;
				col = g_FCI.col;
			}
			if (indexCellChanged < cellsChanged.length) {
				getFromCellIndex(cellsChanged[indexCellChanged]);
				rowChanged = g_FCI.row;
				colChanged = g_FCI.col;
			}
			while (indexCell < cells.length && indexCellChanged < cellsChanged.length) {
				var cmp = Asc.Range.prototype.compareCell(col, row, colChanged, rowChanged);
				if (cmp > 0) {
					indexCellChanged++;
					if (indexCellChanged < cellsChanged.length) {
						getFromCellIndex(cellsChanged[indexCellChanged]);
						rowChanged = g_FCI.row;
						colChanged = g_FCI.col;
					}
				} else {
					if (0 === cmp) {
						this._broadcastNotifyListeners(cells[indexCell].listeners, notifyData);
					}
					indexCell++;
					if (indexCell < cells.length) {
						getFromCellIndex(cells[indexCell].cellIndex);
						row = g_FCI.row;
						col = g_FCI.col;
					}
				}
			}
		},
		_broadcastRangesByCells: function(sheetContainer, cells, notifyData) {
			if (0 === sheetContainer.rangesTop.length || 0 === cells.length) {
				return;
			}
			var rangesTop = sheetContainer.rangesTop;
			var rangesBottom = sheetContainer.rangesBottom;
			var indexTop = 0;
			var indexBottom = 0;
			var indexCell = 0;
			var tree = new AscCommon.DataIntervalTree();
			var affected = [];
			var curY, elem;
			if (indexCell < cells.length) {
				getFromCellIndex(cells[indexCell]);
			}
			//scanline by Y
			while (indexBottom < rangesBottom.length && indexCell < cells.length) {
				//next curY
				if (indexTop < rangesTop.length) {
					curY = Math.min(rangesTop[indexTop].bbox.r1, rangesBottom[indexBottom].bbox.r2);
				} else {
					curY = rangesBottom[indexBottom].bbox.r2;
				}
				//process cells before curY
				while (indexCell < cells.length && g_FCI.row < curY) {
					this._broadcastRangesByCellsIntersect(tree, g_FCI.row, g_FCI.col, affected);
					indexCell++;
					if (indexCell < cells.length) {
						getFromCellIndex(cells[indexCell]);
					}
				}
				while (indexTop < rangesTop.length && curY === rangesTop[indexTop].bbox.r1) {
					elem = rangesTop[indexTop];
					if (elem.isActive) {
						tree.insert(elem.bbox.c1, elem.bbox.c2, elem);
					}
					indexTop++;
				}
				while (indexCell < cells.length && g_FCI.row <= curY) {
					this._broadcastRangesByCellsIntersect(tree, g_FCI.row, g_FCI.col, affected);
					indexCell++;
					if (indexCell < cells.length) {
						getFromCellIndex(cells[indexCell]);
					}
				}
				while (indexBottom < rangesBottom.length && curY === rangesBottom[indexBottom].bbox.r2) {
					elem = rangesBottom[indexBottom];
					if (elem.isActive) {
						tree.remove(elem.bbox.c1, elem.bbox.c2, elem);
					}
					indexBottom++;
				}
			}
			this._broadcastNotifyRanges(affected, notifyData);
		},
		_broadcastCellsByRanges: function(sheetContainer, rangesTop, rangesBottom, notifyData) {
			if (0 === sheetContainer.cells.length || 0 === rangesTop.length) {
				return;
			}
			var cells = sheetContainer.cells;
			var indexTop = 0;
			var indexBottom = 0;
			var indexCell = 0;
			var tree = new AscCommon.DataIntervalTree();
			var curY, bbox;
			if (indexCell < cells.length) {
				getFromCellIndex(cells[indexCell].cellIndex);
			}
			//scanline by Y
			while (indexBottom < rangesBottom.length && indexCell < cells.length) {
				//next curY
				if (indexTop < rangesTop.length) {
					curY = Math.min(rangesTop[indexTop].r1, rangesBottom[indexBottom].r2);
				} else {
					curY = rangesBottom[indexBottom].r2;
				}
				//process cells before curY
				while (indexCell < cells.length && g_FCI.row < curY) {
					if (tree.searchAny(g_FCI.col, g_FCI.col)) {
						this._broadcastNotifyListeners(cells[indexCell].listeners, notifyData);
					}
					indexCell++;
					if (indexCell < cells.length) {
						getFromCellIndex(cells[indexCell].cellIndex);
					}
				}
				while (indexTop < rangesTop.length && curY === rangesTop[indexTop].r1) {
					bbox = rangesTop[indexTop];
					tree.insert(bbox.c1, bbox.c2, bbox);
					indexTop++;
				}
				while (indexCell < cells.length && g_FCI.row <= curY) {
					if (tree.searchAny(g_FCI.col, g_FCI.col)) {
						this._broadcastNotifyListeners(cells[indexCell].listeners, notifyData);
					}
					indexCell++;
					if (indexCell < cells.length) {
						getFromCellIndex(cells[indexCell].cellIndex);
					}
				}
				while (indexBottom < rangesBottom.length && curY === rangesBottom[indexBottom].r2) {
					bbox = rangesBottom[indexBottom];
					tree.remove(bbox.c1, bbox.c2, bbox);
					indexBottom++;
				}
			}
		},
		_broadcastRangesByRanges: function(sheetContainer, rangesTopChanged, rangesBottomChanged, notifyData) {
			if (0 === sheetContainer.rangesTop.length || 0 === rangesTopChanged.length) {
				return;
			}
			var rangesTop = sheetContainer.rangesTop;
			var rangesBottom = sheetContainer.rangesBottom;
			var indexTop = 0;
			var indexBottom = 0;
			var indexTopChanged = 0;
			var indexBottomChanged = 0;
			var tree = new AscCommon.DataIntervalTree();
			var treeChanged = new AscCommon.DataIntervalTree();
			var affected = [];
			var curY, elem, bbox;
			//scanline by Y
			while (indexBottom < rangesBottom.length && indexBottomChanged < rangesBottomChanged.length) {
				//next curY
				curY = Math.min(rangesBottomChanged[indexBottomChanged].r2, rangesBottom[indexBottom].bbox.r2);
				if (indexTop < rangesTop.length) {
					curY = Math.min(curY, rangesTop[indexTop].bbox.r1);
				}
				if (indexTopChanged < rangesTopChanged.length) {
					curY = Math.min(curY, rangesTopChanged[indexTopChanged].r1);
				}

				while (indexTopChanged < rangesTopChanged.length && curY === rangesTopChanged[indexTopChanged].r1) {
					bbox = rangesTopChanged[indexTopChanged];
					treeChanged.insert(bbox.c1, bbox.c2, bbox);
					this._broadcastRangesByRangesIntersect(bbox, tree, affected);
					indexTopChanged++;
				}
				while (indexTop < rangesTop.length && curY === rangesTop[indexTop].bbox.r1) {
					elem = rangesTop[indexTop];
					if (elem.isActive) {
						tree.insert(elem.bbox.c1, elem.bbox.c2, elem);
						if (treeChanged.searchAny(elem.bbox.c1, elem.bbox.c2)) {
							this._broadcastNotifyListeners(elem.listeners, notifyData);
						}
					}
					indexTop++;
				}

				while (indexBottomChanged < rangesBottomChanged.length &&
				curY === rangesBottomChanged[indexBottomChanged].r2) {
					bbox = rangesBottomChanged[indexBottomChanged];
					treeChanged.remove(bbox.c1, bbox.c2, bbox);
					indexBottomChanged++;
				}
				while (indexBottom < rangesBottom.length && curY === rangesBottom[indexBottom].bbox.r2) {
					elem = rangesBottom[indexBottom];
					if (elem.isActive) {
						tree.remove(elem.bbox.c1, elem.bbox.c2, elem);
					}
					indexBottom++;
				}
			}
			this._broadcastNotifyRanges(affected, notifyData);
		},
		_broadcastRangesByCellsIntersect: function(tree, row, col, output) {
			var intervals = tree.searchNodes(col, col);
			for(var i = 0; i < intervals.length; ++i){
				var interval = intervals[i];
				var elem = interval.data;
				var sharedBroadcast = elem.sharedBroadcast;
				if (!sharedBroadcast) {
					output.push(elem);
					elem.isActive = false;
					tree.remove(elem.bbox.c1, elem.bbox.c2, elem);
				} else if (!(sharedBroadcast.changedBBox && sharedBroadcast.changedBBox.contains(col, row))) {
					if (!sharedBroadcast.changedBBox ||
						sharedBroadcast.changedBBox.isEqual(sharedBroadcast.prevChangedBBox)) {
						sharedBroadcast.recursion++;
						if (sharedBroadcast.recursion >= this.maxSharedRecursion) {
							sharedBroadcast.changedBBox = elem.bbox.clone();
						}
						output.push(elem);
					}
					if (sharedBroadcast.changedBBox) {
						sharedBroadcast.changedBBox.union3(col, row);
					} else {
						sharedBroadcast.changedBBox = new Asc.Range(col, row, col, row);
					}
					if (sharedBroadcast.changedBBox.isEqual(elem.bbox)) {
						elem.isActive = false;
						tree.remove(elem.bbox.c1, elem.bbox.c2, elem);
					}
				}
			}
		},
		_broadcastRangesByRangesIntersect: function(bbox, tree, output) {
			var intervals = tree.searchNodes(bbox.c1, bbox.c2);
			for(var i = 0; i < intervals.length; ++i){
				var interval = intervals[i];
				var elem = interval.data;
				if (elem) {
					var intersect = elem.bbox.intersectionSimple(bbox);
					var sharedBroadcast = elem.sharedBroadcast;
					if (!sharedBroadcast) {
						output.push(elem);
						elem.isActive = false;
						tree.remove(elem.bbox.c1, elem.bbox.c2, elem);
					} else if (!(sharedBroadcast.changedBBox && sharedBroadcast.changedBBox.containsRange(intersect))) {
						if (!sharedBroadcast.changedBBox ||
							sharedBroadcast.changedBBox.isEqual(sharedBroadcast.prevChangedBBox)) {
							sharedBroadcast.recursion++;
							if (sharedBroadcast.recursion >= this.maxSharedRecursion) {
								sharedBroadcast.changedBBox = elem.bbox.clone();
							}
							output.push(elem);
						}
						if (sharedBroadcast.changedBBox) {
							sharedBroadcast.changedBBox.union2(intersect);
						} else {
							sharedBroadcast.changedBBox = intersect;
						}
						if (sharedBroadcast.changedBBox.isEqual(elem.bbox)) {
							elem.isActive = false;
							tree.remove(elem.bbox.c1, elem.bbox.c2, elem);
						}
					}
				}
			}
		},
		_broadcastNotifyRanges: function(affected, notifyData) {
			var areaData = {bbox: null, changedBBox: null};
			for (var i = 0; i < affected.length; ++i) {
				var elem = affected[i];
				var shared = elem.sharedBroadcast;
				if (shared && shared.changedBBox) {
					areaData.bbox = elem.bbox;
					notifyData.areaData = areaData;
					if (!shared.prevChangedBBox) {
						areaData.changedBBox = shared.changedBBox;
						this._broadcastNotifyListeners(elem.listeners, notifyData);
					} else {
						var ranges = shared.prevChangedBBox.difference(shared.changedBBox);
						for (var j = 0; j < ranges.length; ++j) {
							areaData.changedBBox = ranges[j];
							this._broadcastNotifyListeners(elem.listeners, notifyData);
						}
					}
					notifyData.areaData = undefined;
					shared.prevChangedBBox = shared.changedBBox.clone();
				} else {
					this._broadcastNotifyListeners(elem.listeners, notifyData);
				}
			}
			this.tempGetByCells.push(affected);
		},
		_broadcastNotifyListeners: function(listeners, notifyData) {
			for (var listenerId in listeners) {
				listeners[listenerId].notify(notifyData);
			}
		}
	};

	function ForwardTransformationFormula(elem, formula, parsed) {
		this.elem = elem;
		this.formula = formula;
		this.parsed = parsed;
	}
	ForwardTransformationFormula.prototype = {
		onFormulaEvent: function(type, eventData) {
			if (AscCommon.c_oNotifyParentType.ChangeFormula === type) {
				this.formula = eventData.assemble;
			}
		}
	};
	function angleFormatToInterface(val)
	{
		var nRes = 0;
		if(0 <= val && val <= 180)
			nRes = val <= 90 ? val : 90 - val;
		return nRes;
	}
	function angleFormatToInterface2(val)
	{
		if(g_nVerticalTextAngle == val)
			return val;
		else
			return angleFormatToInterface(val);
	}
	function angleInterfaceToFormat(val)
	{
		var nRes = val;
		if(-90 <= val && val <= 90)
		{
			if(val < 0)
				nRes = 90 - val;
		}
		else if(g_nVerticalTextAngle != val)
			nRes = 0;
		return nRes;
	}
	function getUniqueKeys(array) {
		var i, o = {};
		for (i = 0; i < array.length; ++i) {
			o[array[i].v] = o.hasOwnProperty(array[i].v);
		}
		return o;
	}
//-------------------------------------------------------------------------------------------------
	function CT_Workbook() {
		//Members
		this.sheets = null;
		this.pivotCaches = null;
	}
	CT_Workbook.prototype.onStartNode = function(elem, attr, uq) {
		var newContext = this;
		if ("workbook" === elem) {
			if (newContext.readAttributes) {
				newContext.readAttributes(attr, uq);
			}
		} else if ("sheets" === elem) {
			//todo check name duplication
			this.sheets = [];
		} else if ("sheet" === elem) {
			newContext = new CT_Sheet();
			if (newContext.readAttributes) {
				newContext.readAttributes(attr, uq);
			}
			this.sheets.push(newContext);
		} else if ("pivotCaches" === elem) {
			//todo check name duplication
			this.pivotCaches = [];
		} else if ("pivotCache" === elem) {
			newContext = new CT_PivotCache();
			if (newContext.readAttributes) {
				newContext.readAttributes(attr, uq);
			}
			this.pivotCaches.push(newContext);
		} else {
			newContext = null;
		}
		return newContext;
	};
	function CT_Sheet() {
		//Attributes
		this.id = null;
	}
	CT_Sheet.prototype.readAttributes = function(attr, uq) {
		if (attr()) {
			var vals = attr();
			var val;
			val = vals["r:id"];
			if (undefined !== val) {
				this.id = AscCommon.unleakString(uq(val));
			}
		}
	};
	function CT_PivotCache() {
		//Attributes
		this.cacheId = null;
		this.id = null;
	}
	CT_PivotCache.prototype.readAttributes = function(attr, uq) {
		if (attr()) {
			var vals = attr();
			var val;
			val = vals["cacheId"];
			if (undefined !== val) {
				this.cacheId = val - 0;
			}
			val = vals["r:id"];
			if (undefined !== val) {
				this.id = AscCommon.unleakString(uq(val));
			}
		}
	};
	/**
	 * @constructor
	 */
	function Workbook(eventsHandlers, oApi){
		this.oApi = oApi;
		this.handlers = eventsHandlers;
		this.dependencyFormulas = new DependencyGraph(this);
		this.nActive = 0;
		this.App = null;
		this.Core = null;

		this.theme = null;
		this.clrSchemeMap = null;

		this.CellStyles = new AscCommonExcel.CCellStyles();
		this.TableStyles = new Asc.CTableStyles();
		this.oStyleManager = new AscCommonExcel.StyleManager();
		this.sharedStrings = new AscCommonExcel.CSharedStrings();
		this.workbookFormulas = new AscCommonExcel.CWorkbookFormulas();
		this.loadCells = [];//to return one object when nested _getCell calls

		this.aComments = [];	// Комментарии к документу
		this.aWorksheets = [];
		this.aWorksheetsById = {};
		this.aCollaborativeActions = [];
		this.bCollaborativeChanges = false;
		this.bUndoChanges = false;
		this.bRedoChanges = false;
		this.aCollaborativeChangeElements = [];
		this.externalReferences = [];
		this.calcPr = {
			calcId: null, calcMode: null, fullCalcOnLoad: null, refMode: null, iterate: null, iterateCount: null,
			iterateDelta: null, fullPrecision: null, calcCompleted: null, calcOnSave: null, concurrentCalc: null,
			concurrentManualCount: null, forceFullCalc: null
		};
		this.connections = null;

		this.wsHandlers = null;

		this.openErrors = [];

		this.maxDigitWidth = 0;
		this.paddingPlusBorder = 0;

		this.lastFindOptions = null;
		this.lastFindCells = {};
	}
	Workbook.prototype.init=function(tableCustomFunc, bNoBuildDep, bSnapshot){
		if(this.nActive < 0)
			this.nActive = 0;
		if(this.nActive >= this.aWorksheets.length)
			this.nActive = this.aWorksheets.length - 1;

		var self = this;

		this.wsHandlers = new AscCommonExcel.asc_CHandlersList( /*handlers*/{
			"changeRefTablePart"   : function (table) {
				self.dependencyFormulas.changeTableRef(table);
			},
			"changeColumnTablePart": function ( tableName ) {
				self.dependencyFormulas.renameTableColumn( tableName );
			},
			"deleteColumnTablePart": function(tableName, deleted) {
				self.dependencyFormulas.delColumnTable(tableName, deleted);
			}, 'onFilterInfo' : function () {
				self.handlers.trigger("asc_onFilterInfo");
			}
		} );
		for(var i = 0, length = tableCustomFunc.length; i < length; ++i) {
			var elem = tableCustomFunc[i];
			elem.column.applyTotalRowFormula(elem.formula, elem.ws, !bNoBuildDep);
		}
		//ws
		this.forEach(function (ws) {
			ws.initPostOpen(self.wsHandlers);
		});
		//show active if it hidden
		var wsActive = this.getActiveWs();
		if (wsActive && wsActive.getHidden()) {
			wsActive.setHidden(false);
		}

		if(!bNoBuildDep){
			this.dependencyFormulas.initOpen();
			this.dependencyFormulas.calcTree();
		}
		if (bSnapshot) {
			this.snapshot = this._getSnapshot();
		}
	};
	Workbook.prototype.forEach = function (callback, isCopyPaste) {
		//if copy/paste - use only actve ws
		if (isCopyPaste) {
			callback(this.getActiveWs(), this.getActive());
		} else {
			for (var i = 0, l = this.aWorksheets.length; i < l; ++i) {
				callback(this.aWorksheets[i], i);
			}
		}
	};
	Workbook.prototype.rebuildColors=function(){
		AscCommonExcel.g_oColorManager.rebuildColors();
		this.forEach(function (ws) {
			ws.rebuildColors();
		});
	};
	Workbook.prototype.getDefaultFont=function(){
		return g_oDefaultFormat.Font.getName();
	};
	Workbook.prototype.getDefaultSize=function(){
		return g_oDefaultFormat.Font.getSize();
	};
	Workbook.prototype.getActive=function(){
		return this.nActive;
	};
	Workbook.prototype.getActiveWs = function () {
		return this.getWorksheet(this.nActive);
	};
	Workbook.prototype.setActive=function(index){
		if(index >= 0 && index < this.aWorksheets.length){
			this.nActive = index;
			// Must clean find
			this.cleanFindResults();
			return true;
		}
		return false;
	};
	Workbook.prototype.setActiveById=function(sheetId){
		var ws = this.getWorksheetById(sheetId);
		return this.setActive(ws.getIndex());
	};
	Workbook.prototype.getSheetIdByIndex = function(index) {
		var ws = this.getWorksheet(index);
		return ws ? ws.getId() : null;
	};
	Workbook.prototype.getWorksheet=function(index){
		//index 0-based
		if(index >= 0 && index < this.aWorksheets.length){
			return this.aWorksheets[index];
		}
		return null;
	};
	Workbook.prototype.getWorksheetById=function(id){
		return this.aWorksheetsById[id];
	};
	Workbook.prototype.getWorksheetByName=function(name){
		for(var i = 0; i < this.aWorksheets.length; i++)
			if(this.aWorksheets[i].getName() == name){
				return this.aWorksheets[i];
			}
		return null;
	};
	Workbook.prototype.getWorksheetIndexByName=function(name){
		for(var i = 0; i < this.aWorksheets.length; i++)
			if(this.aWorksheets[i].getName() == name){
				return i;
			}
		return null;
	};
	Workbook.prototype.getWorksheetCount=function(){
		return this.aWorksheets.length;
	};
	Workbook.prototype.createWorksheet=function(indexBefore, sName, sId){
		this.dependencyFormulas.lockRecal();
		History.Create_NewPoint();
		History.TurnOff();
		var wsActive = this.getActiveWs();
		var oNewWorksheet = new Worksheet(this, this.aWorksheets.length, sId);
		if (this.checkValidSheetName(sName))
			oNewWorksheet.sName = sName;
		oNewWorksheet.initPostOpen(this.wsHandlers);
		if(null != indexBefore && indexBefore >= 0 && indexBefore < this.aWorksheets.length)
			this.aWorksheets.splice(indexBefore, 0, oNewWorksheet);
		else
		{
			indexBefore = this.aWorksheets.length;
			this.aWorksheets.push(oNewWorksheet);
		}
		this.aWorksheetsById[oNewWorksheet.getId()] = oNewWorksheet;
		this._updateWorksheetIndexes(wsActive);
		History.TurnOn();
		this._insertWorksheetFormula(oNewWorksheet.index);
		History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_SheetAdd, null, null, new UndoRedoData_SheetAdd(indexBefore, oNewWorksheet.getName(), null, oNewWorksheet.getId()));
		History.SetSheetUndo(wsActive.getId());
		History.SetSheetRedo(oNewWorksheet.getId());
		this.dependencyFormulas.unlockRecal();
		return oNewWorksheet.index;
	};
	Workbook.prototype.copyWorksheet=function(index, insertBefore, sName, sId, bFromRedo, tableNames){
		//insertBefore - optional
		if(index >= 0 && index < this.aWorksheets.length){
			//buildRecalc вызываем чтобы пересчиталося cwf(может быть пустым если сделать сдвиг формул и скопировать лист)
			this.dependencyFormulas.buildDependency();
			History.TurnOff();
			var wsActive = this.getActiveWs();
			var wsFrom = this.aWorksheets[index];
			var newSheet = new Worksheet(this, -1, sId);
			if(null != insertBefore && insertBefore >= 0 && insertBefore < this.aWorksheets.length){
				//помещаем новый sheet перед insertBefore
				this.aWorksheets.splice(insertBefore, 0, newSheet);
			}
			else{
				//помещаем новый sheet в конец
				this.aWorksheets.push(newSheet);
			}
			this.aWorksheetsById[newSheet.getId()] = newSheet;
			this._updateWorksheetIndexes(wsActive);
			//copyFrom after sheet add because formula assemble dependce on sheet structure
			var renameParams = newSheet.copyFrom(wsFrom, sName, tableNames);
			newSheet.initPostOpen(this.wsHandlers);
			History.TurnOn();

			this.dependencyFormulas.copyDefNameByWorksheet(wsFrom, newSheet, renameParams);
			//для формул. создаем копию this.cwf[this.Id] для нового листа.
			//newSheet._BuildDependencies(wsFrom.getCwf());

			//now insertBefore is index of inserted sheet
			this._insertWorksheetFormula(insertBefore);

			if (!tableNames) {
				tableNames = newSheet.getTableNames();
			}

			History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_SheetAdd, null, null, new UndoRedoData_SheetAdd(insertBefore, newSheet.getName(), wsFrom.getId(), newSheet.getId(), tableNames));
			History.SetSheetUndo(wsActive.getId());
			History.SetSheetRedo(newSheet.getId());
			if(!(bFromRedo === true))
			{
				wsFrom.copyObjects(newSheet, wsFrom);
			}
			this.sortDependency();
		}
	};
	Workbook.prototype.insertWorksheet = function (index, sheet) {
		var wsActive = this.getActiveWs();
		if(null != index && index >= 0 && index < this.aWorksheets.length){
			//помещаем новый sheet перед insertBefore
			this.aWorksheets.splice(index, 0, sheet);
		}
		else{
			//помещаем новый sheet в конец
			this.aWorksheets.push(sheet);
		}
		this.aWorksheetsById[sheet.getId()] = sheet;
		this._updateWorksheetIndexes(wsActive);
		this._insertWorksheetFormula(index);
		this._insertTablePartsName(sheet);
		//восстанавливаем список ячеек с формулами для sheet
		sheet._BuildDependencies(sheet.getCwf());
		this.sortDependency();
	};
	Workbook.prototype._insertTablePartsName = function (sheet) {
		if(sheet && sheet.TableParts && sheet.TableParts.length)
		{
			for(var i = 0; i < sheet.TableParts.length; i++)
			{
				var tablePart = sheet.TableParts[i];
				this.dependencyFormulas.addTableName(sheet, tablePart);
				tablePart.buildDependencies();
			}
		}
	};
	Workbook.prototype._insertWorksheetFormula=function(index){
		if( index > 0 && index < this.aWorksheets.length ) {
			var oWsBefore = this.aWorksheets[index - 1];
			this.dependencyFormulas.changeSheet(this.dependencyFormulas.prepareChangeSheet(oWsBefore.getId(), {insert: index}));
		}
	};
	Workbook.prototype.replaceWorksheet=function(indexFrom, indexTo){
		if(indexFrom >= 0 && indexFrom < this.aWorksheets.length &&
			indexTo >= 0 && indexTo < this.aWorksheets.length){
			var wsActive = this.getActiveWs();
			var oWsFrom = this.aWorksheets[indexFrom];
			var tempW = {
				wF: oWsFrom,
				wFI: indexFrom,
				wTI: indexTo
			};
			//wTI index insert before
			if(tempW.wFI < tempW.wTI)
				tempW.wTI++;
			this.dependencyFormulas.lockRecal();
			var prepared = this.dependencyFormulas.prepareChangeSheet(oWsFrom.getId(), {replace: tempW}, null);
			//move sheets
			var movedSheet = this.aWorksheets.splice(indexFrom, 1);
			this.aWorksheets.splice(indexTo, 0, movedSheet[0]);
			this._updateWorksheetIndexes(wsActive);
			this.dependencyFormulas.changeSheet(prepared);

			this._insertWorksheetFormula(indexTo);

			History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_SheetMove, null, null, new UndoRedoData_FromTo(indexFrom, indexTo));
			this.dependencyFormulas.unlockRecal();
		}
	};
	Workbook.prototype.findSheetNoHidden = function (nIndex) {
		var i, ws, oRes = null, bFound = false, countWorksheets = this.getWorksheetCount();
		for (i = nIndex; i < countWorksheets; ++i) {
			ws = this.getWorksheet(i);
			if (false === ws.getHidden()) {
				oRes = ws;
				bFound = true;
				break;
			}
		}
		// Не нашли справа, ищем слева от текущего
		if (!bFound) {
			for (i = nIndex - 1; i >= 0; --i) {
				ws = this.getWorksheet(i);
				if (false === ws.getHidden()) {
					oRes = ws;
					break;
				}
			}
		}
		return oRes;
	};
	Workbook.prototype.removeWorksheet=function(nIndex, outputParams){
		//проверяем останется ли хоть один нескрытый sheet
		var bEmpty = true;
		for(var i = 0, length = this.aWorksheets.length; i < length; ++i)
		{
			var worksheet = this.aWorksheets[i];
			if(false == worksheet.getHidden() && i != nIndex)
			{
				bEmpty = false;
				break;
			}
		}
		if(bEmpty)
			return -1;

		var removedSheet = this.getWorksheet(nIndex);
		if(removedSheet)
		{
			var removedSheetId = removedSheet.getId();
			this.dependencyFormulas.lockRecal();
			var prepared = this.dependencyFormulas.prepareRemoveSheet(removedSheetId, removedSheet.getTableNames());
			//delete sheet
			var wsActive = this.getActiveWs();
			var oVisibleWs = null;
			this.aWorksheets.splice(nIndex, 1);
			delete this.aWorksheetsById[removedSheetId];

			if (nIndex == this.getActive()) {
				oVisibleWs = this.findSheetNoHidden(nIndex);
				if (null != oVisibleWs)
					wsActive = oVisibleWs;
			}
			History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_SheetRemove, null, null, new AscCommonExcel.UndoRedoData_SheetRemove(nIndex, removedSheetId, removedSheet));
			if (null != oVisibleWs) {
				History.SetSheetUndo(removedSheetId);
				History.SetSheetRedo(wsActive.getId());
			}
			if(null != outputParams)
			{
				outputParams.sheet = removedSheet;
			}
			this._updateWorksheetIndexes(wsActive);
			this.dependencyFormulas.removeSheet(prepared);
			this.dependencyFormulas.unlockRecal();
			return wsActive.getIndex();
		}
		return -1;
	};
	Workbook.prototype._updateWorksheetIndexes = function (wsActive) {
		this.forEach(function (ws, index) {
			ws._setIndex(index);
		});
		if (null != wsActive) {
			this.setActive(wsActive.getIndex());
		}
	};
	Workbook.prototype.checkUniqueSheetName=function(name){
		var workbookSheetCount = this.getWorksheetCount();
		for (var i = 0; i < workbookSheetCount; i++){
			if (this.getWorksheet(i).getName() == name)
				return i;
		}
		return -1;
	};
	Workbook.prototype.checkValidSheetName=function(name){
		return (name && name.length < g_nSheetNameMaxLength);
	};
	Workbook.prototype.getUniqueSheetNameFrom=function(name, bCopy){
		var nIndex = 1;
		var sNewName = "";
		var fGetPostfix = null;
		if(bCopy)
		{

			var result = /^(.*)\((\d)\)$/.exec(name);
			if(result)
			{
				fGetPostfix = function(nIndex){return "(" + nIndex +")";};
				name = result[1];
			}
			else
			{
				fGetPostfix = function(nIndex){return " (" + nIndex +")";};
				name = name;
			}
		}
		else
		{
			fGetPostfix = function(nIndex){return nIndex.toString();};
		}
		var workbookSheetCount = this.getWorksheetCount();
		while(nIndex < 10000)
		{
			var sPosfix = fGetPostfix(nIndex);
			sNewName = name + sPosfix;
			if(sNewName.length > g_nSheetNameMaxLength)
			{
				name = name.substring(0, g_nSheetNameMaxLength - sPosfix.length);
				sNewName = name + sPosfix;
			}
			var bUniqueName = true;
			for (var i = 0; i < workbookSheetCount; i++){
				if (this.getWorksheet(i).getName() == sNewName)
				{
					bUniqueName = false;
					break;
				}
			}
			if(bUniqueName)
				break;
			nIndex++;
		}
		return sNewName;
	};
	Workbook.prototype._generateFontMap=function(){
		var oFontMap = {
			"Arial"		: 1
		};
		var i;

		oFontMap[g_oDefaultFormat.Font.getName()] = 1;

		//theme
		if(null != this.theme)
			AscFormat.checkThemeFonts(oFontMap, this.theme.themeElements.fontScheme);
		//xfs
		for (i = 1; i <= g_StyleCache.getXfCount(); ++i) {
			var xf = g_StyleCache.getXf(i);
			if (xf.font) {
				oFontMap[xf.font.getName()] = 1;
			}
		}
		//sharedStrings
		this.sharedStrings.generateFontMap(oFontMap);

		this.forEach(function (ws) {
			ws.generateFontMap(oFontMap);
		});
		this.CellStyles.generateFontMap(oFontMap);

		return oFontMap;
	};
	Workbook.prototype.generateFontMap=function(){
		var oFontMap = this._generateFontMap();

		var aRes = [];
		for(var i in oFontMap)
			aRes.push(i);
		return aRes;
	};
	Workbook.prototype.generateFontMap2=function(){
		var oFontMap = this._generateFontMap();

		var aRes = [];
		for(var i in oFontMap)
			aRes.push(new AscFonts.CFont(i, 0, "", 0));
		AscFonts.FontPickerByCharacter.extendFonts(aRes);
		return aRes;
	};
	Workbook.prototype.getAllImageUrls = function(){
		var aImageUrls = [];
		this.forEach(function (ws) {
			ws.getAllImageUrls(aImageUrls);
		});
		return aImageUrls;
	};
	Workbook.prototype.reassignImageUrls = function(oImages){
		this.forEach(function (ws) {
			ws.reassignImageUrls(oImages);
		});
	};
	Workbook.prototype.calculate = function (type, sheetId) {
		var formulas;
		if (type === Asc.c_oAscCalculateType.All) {
			formulas = this.getAllFormulas();
			for (var i = 0; i < formulas.length; ++i) {
				var formula = formulas[i];
				formula.removeDependencies();
				formula.setFormula(formula.getFormula());
				formula.parse();
				formula.buildDependencies();
			}
		} else if (type === Asc.c_oAscCalculateType.ActiveSheet) {
			formulas = [];
			var ws = sheetId !== undefined ? this.getWorksheetById(sheetId) : this.getActiveWs();
			ws.getAllFormulas(formulas);
			sheetId = ws.getId();
		} else {
			formulas = this.getAllFormulas();
		}
		this.dependencyFormulas.notifyChanged(formulas);
		this.dependencyFormulas.calcTree();
		History.Create_NewPoint();
		History.StartTransaction();
		History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_Calculate, sheetId,
			null, new AscCommonExcel.UndoRedoData_SingleProperty(type));
		History.EndTransaction();
	};
	Workbook.prototype.checkDefName = function (checkName, scope) {
		return this.dependencyFormulas.checkDefName(checkName, scope);
	};
	Workbook.prototype.getDefinedNamesWB = function (defNameListId, bLocale) {
		return this.dependencyFormulas.getDefinedNamesWB(defNameListId, bLocale);
	};
	Workbook.prototype.getDefinedNamesWS = function (sheetId) {
		return this.dependencyFormulas.getDefinedNamesWS(sheetId);
	};
	Workbook.prototype.addDefName = function (name, ref, sheetId, hidden, isTable) {
		return this.dependencyFormulas.addDefName(name, ref, sheetId, hidden, isTable);
	};
	Workbook.prototype.getDefinesNames = function ( name, sheetId ) {
		return this.dependencyFormulas.getDefNameByName( name, sheetId );
	};
	Workbook.prototype.getDefinedName = function(name) {
		var sheetId = this.getSheetIdByIndex(name.LocalSheetId);
		return this.dependencyFormulas.getDefNameByName(name.Name, sheetId);
	};
	Workbook.prototype.delDefinesNames = function ( defName ) {
		this.delDefinesNamesUndoRedo(this.getUndoDefName(defName));
	};
	Workbook.prototype.delDefinesNamesUndoRedo = function ( defName ) {
		this.dependencyFormulas.removeDefName( defName.sheetId, defName.name );
		this.dependencyFormulas.calcTree();
	};
	Workbook.prototype.editDefinesNames = function ( oldName, newName ) {
		return this.editDefinesNamesUndoRedo(this.getUndoDefName(oldName), this.getUndoDefName(newName));
	};
	Workbook.prototype.editDefinesNamesUndoRedo = function ( oldName, newName ) {
		var res = this.dependencyFormulas.editDefinesNames( oldName, newName );
		this.dependencyFormulas.calcTree();
		return res;
	};
	Workbook.prototype.findDefinesNames = function ( ref, sheetId, bLocale ) {
		return this.dependencyFormulas.getDefNameByRef( ref, sheetId, bLocale );
	};
	Workbook.prototype.unlockDefName = function(){
		this.dependencyFormulas.unlockDefName();
	};
	Workbook.prototype.unlockCurrentDefName = function(name, sheetId){
		this.dependencyFormulas.unlockCurrentDefName(name, sheetId);
	};
	Workbook.prototype.checkDefNameLock = function(){
		return this.dependencyFormulas.checkDefNameLock();
	};
	Workbook.prototype._SerializeHistoryBase64 = function (oMemory, item, aPointChangesBase64) {
		if (!item.LocalChange) {
			var nPosStart = oMemory.GetCurPosition();
			item.Serialize(oMemory, this.oApi.collaborativeEditing);
			var nPosEnd = oMemory.GetCurPosition();
			var nLen = nPosEnd - nPosStart;
			if (nLen > 0)
				aPointChangesBase64.push(nLen + ";" + oMemory.GetBase64Memory2(nPosStart, nLen));
		}
	};
	Workbook.prototype.SerializeHistory = function(){
		var aRes = [];
		//соединяем изменения, которые были до приема данных с теми, что получились после.

		var t, j, length2;

		// Пересчитываем позиции
		AscCommon.CollaborativeEditing.Refresh_DCChanges();

		var aActions = this.aCollaborativeActions.concat(History.GetSerializeArray());
		if(aActions.length > 0)
		{
			var oMemory = new AscCommon.CMemory();
			for(var i = 0, length = aActions.length; i < length; ++i)
			{
				var aPointChanges = aActions[i];
				for (j = 0, length2 = aPointChanges.length; j < length2; ++j) {
					var item = aPointChanges[j];
					this._SerializeHistoryBase64(oMemory, item, aRes);
				}
			}
			this.aCollaborativeActions = [];
			this.snapshot = this._getSnapshot();
		}
		return aRes;
	};
	Workbook.prototype._getSnapshot = function() {
		var wb = new Workbook(new AscCommonExcel.asc_CHandlersList(), this.oApi);
		wb.dependencyFormulas = this.dependencyFormulas.getSnapshot(wb);
		this.forEach(function (ws) {
			ws = ws.getSnapshot(wb);
			wb.aWorksheets.push(ws);
			wb.aWorksheetsById[ws.getId()] = ws;
		});
		//init trigger
		wb.init({}, true, false);
		return wb;
	};
	Workbook.prototype.getAllFormulas = function() {
		var res = [];
		this.dependencyFormulas.getAllFormulas(res);
		this.forEach(function (ws) {
			ws.getAllFormulas(res);
		});
		return res;
	};
	Workbook.prototype._forwardTransformation = function(wbSnapshot, changesMine, changesTheir) {
		History.TurnOff();
		//first mine changes to resolve conflict sheet names
		var res1 = this._forwardTransformationGetTransform(wbSnapshot, changesTheir, changesMine);
		var res2 = this._forwardTransformationGetTransform(wbSnapshot, changesMine, changesTheir);
		//modify formulas at the end - to prevent negative effect during tranformation
		var i, elem, elemWrap;
		for (i = 0; i < res1.modify.length; ++i) {
			elemWrap = res1.modify[i];
			elem = elemWrap.elem;
			elem.oClass.forwardTransformationSet(elem.nActionType, elem.oData, elem.nSheetId, elemWrap);
		}
		for (i = 0; i < res2.modify.length; ++i) {
			elemWrap = res2.modify[i];
			elem = elemWrap.elem;
			elem.oClass.forwardTransformationSet(elem.nActionType, elem.oData, elem.nSheetId, elemWrap);
		}
		//rename current wb
		for (var oldName in res1.renameSheet) {
			var ws = this.getWorksheetByName(oldName);
			if (ws) {
				ws.setName(res1.renameSheet[oldName]);
			}
		}
		History.TurnOn();
	};
	Workbook.prototype._forwardTransformationGetTransform = function(wbSnapshot, changesMaster, changesModify) {
		var res = {modify: [], renameSheet: {}};
		var changesMasterSelected = [];
		var i, elem;
		if (changesModify.length > 0) {
			//select useful master changes
			for ( i = 0; i < changesMaster.length; ++i) {
				elem = changesMaster[i];
				if (elem.oClass && elem.oClass.forwardTransformationIsAffect &&
					elem.oClass.forwardTransformationIsAffect(elem.nActionType)) {
					changesMasterSelected.push(elem);
				}
			}
		}
		if (changesMasterSelected.length > 0 && changesModify.length > 0) {
			var wbSnapshotCur = wbSnapshot._getSnapshot();
			var formulas = [];
			for (i = 0; i < changesModify.length; ++i) {
				elem = changesModify[i];
				var renameRes = null;
				if (elem.oClass && elem.oClass.forwardTransformationGet) {
					var getRes = elem.oClass.forwardTransformationGet(elem.nActionType, elem.oData, elem.nSheetId);
					if (getRes && getRes.formula) {
						//inserted formulas
						formulas.push(new ForwardTransformationFormula(elem, getRes.formula, null));
					}
					if (getRes && getRes.name) {
						//add/rename sheet
						//get getUniqueSheetNameFrom if need
						renameRes = this._forwardTransformationRenameStart(wbSnapshotCur._getSnapshot(),
																		   changesMasterSelected, getRes);
					}
				}
				if (elem.oClass && elem.oClass.forwardTransformationIsAffect &&
					elem.oClass.forwardTransformationIsAffect(elem.nActionType)) {
					if (formulas.length > 0) {
						//modify all formulas before apply next change
						this._forwardTransformationFormula(wbSnapshotCur._getSnapshot(), formulas,
														   changesMasterSelected, res);
						formulas = [];
					}
					//apply useful mine change
					elem.oClass.Redo(elem.nActionType, elem.oData, elem.nSheetId, wbSnapshotCur);
				}
				if (renameRes) {
					this._forwardTransformationRenameEnd(renameRes, res.renameSheet, getRes, elem);
				}
			}
			this._forwardTransformationFormula(wbSnapshotCur, formulas, changesMasterSelected, res);
		}
		return res;
	};
	Workbook.prototype._forwardTransformationRenameStart = function(wbSnapshot, changes, getRes) {
		var res = {newName: null};
		for (var i = 0; i < changes.length; ++i) {
			var elem = changes[i];
			elem.oClass.Redo(elem.nActionType, elem.oData, elem.nSheetId, wbSnapshot);
		}
		if (-1 != wbSnapshot.checkUniqueSheetName(getRes.name)) {
			res.newName = wbSnapshot.getUniqueSheetNameFrom(getRes.name, true);
		}
		return res;
	};
	Workbook.prototype._forwardTransformationRenameEnd = function(renameRes, renameSheet, getRes, elemCur) {
		var isChange = false;
		if (getRes.from) {
			var renameCur = renameSheet[getRes.from];
			if (renameCur) {
				//no need rename next formulas
				delete renameSheet[getRes.from];
				getRes.from = renameCur;
				isChange = true;
			}
		}
		if (renameRes && renameRes.newName) {
			renameSheet[getRes.name] = renameRes.newName;
			getRes.name = renameRes.newName;
			isChange = true;
		}
		//apply immediately cause it is conflict
		if (isChange && elemCur.oClass.forwardTransformationSet) {
			elemCur.oClass.forwardTransformationSet(elemCur.nActionType, elemCur.oData, elemCur.nSheetId, getRes);
		}
	};
	Workbook.prototype._forwardTransformationFormula = function(wbSnapshot, formulas, changes, res) {
		if (formulas.length > 0) {
			var i, elem, ftFormula, ws;
			//parse formulas
			for (i = 0; i < formulas.length; ++i) {
				ftFormula = formulas[i];
				ws = wbSnapshot.getWorksheetById(ftFormula.elem.nSheetId);
				if(!ws) {
					ws = new AscCommonExcel.Worksheet(wbSnapshot, -1);
				}
				if (ws) {
					ftFormula.parsed = new parserFormula(ftFormula.formula, ftFormula, ws);
					ftFormula.parsed.parse();
					ftFormula.parsed.buildDependencies();
				}
			}
			//rename sheet first to prevent name conflict
			for (var oldName in res.renameSheet) {
				ws = wbSnapshot.getWorksheetByName(oldName);
				if (ws) {
					ws.setName(res.renameSheet[oldName]);
				}
			}
			//apply useful theirs changes
			for (i = 0; i < changes.length; ++i) {
				elem = changes[i];
				elem.oClass.Redo(elem.nActionType, elem.oData, elem.nSheetId, wbSnapshot);
			}
			//assemble
			for (i = 0; i < formulas.length; ++i) {
				ftFormula = formulas[i];
				if (ftFormula.parsed) {
					ftFormula.parsed.removeDependencies();
					res.modify.push(ftFormula);
				}
			}
		}
	};
	Workbook.prototype.DeserializeHistory = function(aChanges, fCallback){
		var oThis = this;
		//сохраняем те изменения, которые были до приема данных, потому что дальше undo/redo будет очищено
		this.aCollaborativeActions = this.aCollaborativeActions.concat(History.GetSerializeArray());
		if(aChanges.length > 0)
		{
			this.bCollaborativeChanges = true;
			//собираем общую длину
			var dstLen = 0;
			var aIndexes = [], i, length = aChanges.length, sChange;
			for(i = 0; i < length; ++i)
			{
				sChange = aChanges[i];
				var nIndex = sChange.indexOf(";");
				if (-1 != nIndex) {
					dstLen += parseInt(sChange.substring(0, nIndex));
					nIndex++;
				}
				aIndexes.push(nIndex);
			}
			var pointer = g_memory.Alloc(dstLen);
			var stream = new AscCommon.FT_Stream2(pointer.data, dstLen);
			stream.obj = pointer.obj;
			var nCurOffset = 0;
			var aUndoRedoElems = [];
			for (i = 0; i < length; ++i) {
				sChange = aChanges[i];
				var oBinaryFileReader = new AscCommonExcel.BinaryFileReader();
				nCurOffset = oBinaryFileReader.getbase64DecodedData2(sChange, aIndexes[i], stream, nCurOffset);
				var item = new UndoRedoItemSerializable();
				item.Deserialize(stream);
				aUndoRedoElems.push(item);
			}
			var wsViews = window["Asc"]["editor"].wb.wsViews;
			if(oThis.oApi.collaborativeEditing.getFast()){
				AscCommon.CollaborativeEditing.Clear_DocumentPositions();
			}
			for (var i in wsViews) {
				if (isRealObject(wsViews[i]) && isRealObject(wsViews[i].objectRender) &&
					isRealObject(wsViews[i].objectRender.controller)) {
					wsViews[i].endEditChart();
					if (oThis.oApi.collaborativeEditing.getFast()) {
						var oState = wsViews[i].objectRender.saveStateBeforeLoadChanges();
						if (oState) {
							if (oState.Pos) {
								AscCommon.CollaborativeEditing.Add_DocumentPosition(oState.Pos);
							}
							if (oState.StartPos) {
								AscCommon.CollaborativeEditing.Add_DocumentPosition(oState.StartPos);
							}
							if (oState.EndPos) {
								AscCommon.CollaborativeEditing.Add_DocumentPosition(oState.EndPos);
							}
						}
					}
					wsViews[i].objectRender.controller.resetSelection();
				}
			}
			oFormulaLocaleInfo.Parse = false;
			oFormulaLocaleInfo.DigitSep = false;
			AscFonts.IsCheckSymbols = true;
			History.Clear();
			History.TurnOff();
			var history = new AscCommon.CHistory();
			history.init(this);
			history.Create_NewPoint();

			history.SetSelection(null);
			history.SetSelectionRedo(null);
			var oRedoObjectParam = new AscCommonExcel.RedoObjectParam();
			history.UndoRedoPrepare(oRedoObjectParam, false);
			var changesMine = [].concat.apply([], oThis.aCollaborativeActions);
			oThis._forwardTransformation(oThis.snapshot, changesMine, aUndoRedoElems);
			for (var i = 0, length = aUndoRedoElems.length; i < length; ++i)
			{
				var item = aUndoRedoElems[i];
				if ((null != item.oClass || (item.oData && typeof item.oData.sChangedObjectId === "string")) && null != item.nActionType) {
					if (window["NATIVE_EDITOR_ENJINE"] === true && window["native"]["CheckNextChange"]) {
						if (!window["native"]["CheckNextChange"]())
							break;
					}
					// TODO if(g_oUndoRedoGraphicObjects == item.oClass && item.oData.drawingData)
					//     item.oData.drawingData.bCollaborativeChanges = true;
					AscCommonExcel.executeInR1C1Mode(false, function () {
						history.RedoAdd(oRedoObjectParam, item.oClass, item.nActionType, item.nSheetId, item.oRange, item.oData);
					});
				}
			}
			AscFonts.IsCheckSymbols = false;

			var oFontMap = this._generateFontMap();
			window["Asc"]["editor"]._loadFonts(oFontMap, function(){
				if(oThis.oApi.collaborativeEditing.getFast()){


					for(var i in wsViews){
						if(isRealObject(wsViews[i]) && isRealObject(wsViews[i].objectRender) && isRealObject(wsViews[i].objectRender.controller)){
							var oState = wsViews[i].objectRender.getStateBeforeLoadChanges();
							if(oState){
								if (oState.Pos)
									AscCommon.CollaborativeEditing.Update_DocumentPosition(oState.Pos);
								if (oState.StartPos)
									AscCommon.CollaborativeEditing.Update_DocumentPosition(oState.StartPos);
								if (oState.EndPos)
									AscCommon.CollaborativeEditing.Update_DocumentPosition(oState.EndPos);
							}
							wsViews[i].objectRender.loadStateAfterLoadChanges();
						}
					}
				}
				oFormulaLocaleInfo.Parse = true;
				oFormulaLocaleInfo.DigitSep = true;
				history.UndoRedoEnd(null, oRedoObjectParam, false);
				History.TurnOn();
				oThis.bCollaborativeChanges = false;
				//make snapshot for faormulas
				oThis.snapshot = oThis._getSnapshot();
				if(null != fCallback)
					fCallback();
			});
		} else if(null != fCallback) {
			fCallback();
		}
	};
	Workbook.prototype.DeserializeHistoryNative = function(oRedoObjectParam, data, isFull){
		if(null != data)
		{
			this.bCollaborativeChanges = true;

			if(null == oRedoObjectParam)
			{
				var wsViews = window["Asc"]["editor"].wb.wsViews;
				for (var i in wsViews) {
					if (isRealObject(wsViews[i]) && isRealObject(wsViews[i].objectRender) &&
						isRealObject(wsViews[i].objectRender.controller)) {
						wsViews[i].endEditChart();
						wsViews[i].objectRender.controller.resetSelection();
					}
				}

				History.Clear();
				History.Create_NewPoint();
				History.SetSelection(null);
				History.SetSelectionRedo(null);
				oRedoObjectParam = new AscCommonExcel.RedoObjectParam();
				History.UndoRedoPrepare(oRedoObjectParam, false);
			}

			var stream = new AscCommon.FT_Stream2(data, data.length);
			stream.obj = null;
			// Применяем изменения, пока они есть
			var _count = stream.GetLong();
			var _pos = 4;
			for (var i = 0; i < _count; i++)
			{
				if (window["NATIVE_EDITOR_ENJINE"] === true && window["native"]["CheckNextChange"])
				{
					if (!window["native"]["CheckNextChange"]())
						break;
				}

				var _len = stream.GetLong();

				_pos += 4;
				stream.size = _pos + _len;
				stream.Seek(_pos);
				stream.Seek2(_pos);

				var item = new UndoRedoItemSerializable();
				item.Deserialize(stream);
				if ((null != item.oClass || (item.oData && typeof item.oData.sChangedObjectId === "string")) && null != item.nActionType){
					AscCommonExcel.executeInR1C1Mode(false, function () {
						History.RedoAdd(oRedoObjectParam, item.oClass, item.nActionType, item.nSheetId, item.oRange, item.oData);
					});
				}

				_pos += _len;
				stream.Seek2(_pos);
				stream.size = data.length;
			}

			if(isFull){
				History.UndoRedoEnd(null, oRedoObjectParam, false);
				History.Clear();
				oRedoObjectParam = null;
			}
			this.bCollaborativeChanges = false;
		}
		return oRedoObjectParam;
	};
	Workbook.prototype.getTableRangeForFormula = function(name, objectParam){
		var res = null;
		for(var i = 0, length = this.aWorksheets.length; i < length; ++i)
		{
			var ws = this.aWorksheets[i];
			res = ws.getTableRangeForFormula(name, objectParam);
			if(res !== null){
				res = {wsID:ws.getId(),range:res};
				break;
			}
		}
		return res;
	};
	Workbook.prototype.getTableIndexColumnByName = function(tableName, columnName){
		var res = null;
		for(var i = 0, length = this.aWorksheets.length; i < length; ++i)
		{
			var ws = this.aWorksheets[i];
			res = ws.getTableIndexColumnByName(tableName, columnName);
			//получаем имя через getTableNameColumnByIndex поскольку tableName приходит в том виде
			//в котором набрал пользователь, те регистр может быть произвольным
			//todo для того, чтобы два раза не бежать по колонкам можно сделать функцию которая возвращает полную информацию о колонке
			//
			if(res !== null){
				res = {wsID:ws.getId(), index: res, name: ws.getTableNameColumnByIndex(tableName, res)};
				break;
			}
		}
		return res;
	};
	Workbook.prototype.getTableNameColumnByIndex = function(tableName, columnIndex){
		var res = null;
		for(var i = 0, length = this.aWorksheets.length; i < length; ++i)
		{
			var ws = this.aWorksheets[i];
			res = ws.getTableNameColumnByIndex(tableName, columnIndex);
			if(res !== null){
				res = {wsID:ws.getId(), columnName: res};
				break;
			}
		}
		return res;
	};
	Workbook.prototype.getTableByName = function(tableName, wsID){
		var res = null;
		var ws = this.getWorksheetById(wsID);
		return ws.getTableByName(tableName);
	};
	Workbook.prototype.updateSparklineCache = function (sheet, ranges) {
		this.forEach(function (ws) {
			ws.updateSparklineCache(sheet, ranges);
		});
	};
	Workbook.prototype.sortDependency = function () {
		this.dependencyFormulas.calcTree();
	};
	/**
	 * Вычисляет ширину столбца для заданного количества символов
	 * @param {Number} count  Количество символов
	 * @returns {Number}      Ширина столбца в символах
	 */
	Workbook.prototype.charCountToModelColWidth = function (count) {
		if (count <= 0) {
			return 0;
		}
		return Asc.floor((count * this.maxDigitWidth + this.paddingPlusBorder) / this.maxDigitWidth * 256) / 256;
	};
	/**
	 * Вычисляет ширину столбца в px
	 * @param {Number} mcw  Количество символов
	 * @returns {Number}    Ширина столбца в px
	 */
	Workbook.prototype.modelColWidthToColWidth = function (mcw) {
		return Asc.floor(((256 * mcw + Asc.floor(128 / this.maxDigitWidth)) / 256) * this.maxDigitWidth);
	};
	/**
	 * Вычисляет количество символов по ширине столбца
	 * @param {Number} w  Ширина столбца в px
	 * @returns {Number}  Количество символов
	 */
	Workbook.prototype.colWidthToCharCount = function (w) {
		var pxInOneCharacter = this.maxDigitWidth + this.paddingPlusBorder;
		// Когда меньше 1 символа, то просто считаем по пропорции относительно размера 1-го символа
		return w < pxInOneCharacter ?
			(1 - Asc.floor(100 * (pxInOneCharacter - w) / pxInOneCharacter + 0.49999) / 100) :
			Asc.floor((w - this.paddingPlusBorder) / this.maxDigitWidth * 100 + 0.5) / 100;
	};
	Workbook.prototype.getUndoDefName = function(ascName) {
		if (!ascName) {
			return ascName;
		}
		var sheetId = this.getSheetIdByIndex(ascName.LocalSheetId);
		return new UndoRedoData_DefinedNames(ascName.Name, ascName.Ref, sheetId, ascName.isTable, ascName.isXLNM);
	};
	Workbook.prototype.changeColorScheme = function (sSchemeName) {
		var scheme = AscCommon.getColorSchemeByName(sSchemeName);
		if (!scheme) {
			scheme = this.theme.getExtraClrScheme(sSchemeName);
		}
		if(!scheme)
		{
			return;
		}
		History.Create_NewPoint();
		//не делаем Duplicate потому что предполагаем что схема не будет менять частями, а только обьектом целиком.
		History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_ChangeColorScheme, null,
			null, new AscCommonExcel.UndoRedoData_ClrScheme(this.theme.themeElements.clrScheme, scheme));
		this.theme.changeColorScheme(scheme);
		this.rebuildColors();
		return true;
	};
	Workbook.prototype.changeColorSchemeByIdx = function (nIdx) {

		var scheme = this.oApi.getColorSchemeByIdx(nIdx);
		if(!scheme) {
			return;
		}
		History.Create_NewPoint();
		//не делаем Duplicate потому что предполагаем что схема не будет менять частями, а только обьектом целиком.
		History.Add(AscCommonExcel.g_oUndoRedoWorkbook, AscCH.historyitem_Workbook_ChangeColorScheme, null,
			null, new AscCommonExcel.UndoRedoData_ClrScheme(this.theme.themeElements.clrScheme, scheme));
		this.theme.changeColorScheme(scheme);
		this.rebuildColors();
		return true;
	};
	// ----- Search -----
	Workbook.prototype.cleanFindResults = function () {
		this.lastFindOptions = null;
		this.lastFindCells = {};
	};
	Workbook.prototype.findCellText = function (options) {
		var ws = this.getActiveWs();
		var result = ws.findCellText(options), result2 = null;
		if (!options.scanOnOnlySheet) {
			// Search on workbook
			var key = result && (result.col + "-" + result.row);
			if (!key || (options.isEqual(this.lastFindOptions) && this.lastFindCells[key])) {
				// Мы уже находили данную ячейку, попробуем на другом листе
				var i, active = this.getActive(), start = 0, end = this.getWorksheetCount();
				var inc = options.scanForward ? +1 : -1;
				for (i = active + inc; i < end && i >= start; i += inc) {
					ws = this.getWorksheet(i);
					if (ws.getHidden()) {
						continue;
					}
					result2 = ws.findCellText(options);
					if (result2) {
						break;
					}
				}
				if (!result2) {
					// Мы дошли до конца или начала (в зависимости от направления, теперь пойдем до активного)
					if (options.scanForward) {
						i = 0;
						end = active;
					} else {
						i = end - 1;
						start = active + 1;
					}
					inc *= -1;
					for (; i < end && i >= start; i += inc) {
						ws = this.getWorksheet(i);
						if (ws.getHidden()) {
							continue;
						}
						result2 = ws.findCellText(options);
						if (result2) {
							break;
						}
					}
				}

				if (result2) {
					this.handlers.trigger('undoRedoHideSheet', i);
					key = result2.col + "-" + result2.row;
				}
			}

			if (key) {
				this.lastFindOptions = options.clone();
				this.lastFindCells[key] = true;
			}
		}
		if (!result2 && !result) {
			this.cleanFindResults();
		}
		return result2 || result;
	};
	//Comments
	Workbook.prototype.getComment = function (id) {
		if (id) {
			var sheet;
			for (var i = 0; i < this.aWorksheets.length; ++i) {
				sheet = this.aWorksheets[i];
				for (var j = 0; j < sheet.aComments.length; ++j) {
					if (id === sheet.aComments[j].asc_getGuid()) {
						return sheet.aComments[j];
					}
				}
			}
		}
		return null;
	};
//-------------------------------------------------------------------------------------------------
	var tempHelp = new ArrayBuffer(8);
	var tempHelpUnit = new Uint8Array(tempHelp);
	var tempHelpFloat = new Float64Array(tempHelp);
	function SheetMemory(structSize, maxIndex) {
		this.data = null;
		this.count = 0;
		this.structSize = structSize;
		this.maxIndex = maxIndex;
	}
	SheetMemory.prototype.checkSize = function(index) {
		var allocatedCount = this.data ? this.data.length / this.structSize : 0;
		if (allocatedCount < index + 1) {
			var newAllocatedCount = Math.min(Math.max((1.5 * this.count) >> 0, index + 1), (this.maxIndex + 1));
			if (newAllocatedCount > allocatedCount) {
				var oldData = this.data;
				this.data = new Uint8Array(newAllocatedCount * this.structSize);
				if (oldData) {
					this.data.set(oldData);
				}
			}
		}
		this.count = Math.min(Math.max(this.count, index + 1), this.maxIndex + 1);
	};
	SheetMemory.prototype.hasSize = function(index) {
		return index + 1 <= this.count;
	};
	SheetMemory.prototype.getSize = function() {
		return this.count;
	};
	SheetMemory.prototype.clone = function() {
		var sheetMemory = new SheetMemory(this.structSize, this.maxIndex);
		sheetMemory.data = this.data ? new Uint8Array(this.data) : null;
		sheetMemory.count = this.count;
		return sheetMemory;
	};
	SheetMemory.prototype.deleteRange = function(start, deleteCount) {
		if (start < this.count) {
			var startOffset = start * this.structSize;
			if (start + deleteCount < this.count) {
				var endOffset = (start + deleteCount) * this.structSize;
				this.data.set(this.data.subarray(endOffset), startOffset);
				this.data.fill(0, (this.count - deleteCount) * this.structSize);
				this.count -= deleteCount;
			} else {
				this.data.fill(0, startOffset);
				this.count = start;
			}
		}
	};
	SheetMemory.prototype.insertRange = function(start, insertCount) {
		if (start < this.count) {
			this.checkSize(this.count - 1 + insertCount);
			var startOffset = start * this.structSize;
			if (start + insertCount < this.count) {
				var endOffset = (start + insertCount) * this.structSize;
				var endData = (this.count - insertCount) * this.structSize;
				this.data.set(this.data.subarray(startOffset, endData), endOffset);
				this.data.fill(0, startOffset, endOffset);
			} else {
				this.data.fill(0, startOffset);
			}
		}
	};
	SheetMemory.prototype.copyRange = function(sheetMemory, startFrom, startTo, count) {
		var countCopied = 0;
		if (startFrom < sheetMemory.count) {
			countCopied = Math.min(count, sheetMemory.count - startFrom);
			this.checkSize(startTo + countCopied);
			countCopied = Math.min(countCopied, this.count - startTo);
			if (countCopied > 0) {
				var startOffsetFrom = startFrom * this.structSize;
				var endOffsetFrom = (startFrom + countCopied) * this.structSize;
				var startOffsetTo = startTo * this.structSize;

				this.data.set(sheetMemory.data.subarray(startOffsetFrom, endOffsetFrom), startOffsetTo);
			}
		}
		var countErase = Math.min(count - countCopied, this.count - (startTo + countCopied));
		if (countErase > 0) {
			var startOffsetErase = (startTo + countCopied) * this.structSize;
			var endOffsetErase = (startTo + countCopied + countErase) * this.structSize;
			this.data.fill(0, startOffsetErase, endOffsetErase);
		}
	};
	SheetMemory.prototype.copyRangeByChunk = function(from, fromCount, to, toCount) {
		if (from < this.count) {
			this.checkSize(to + toCount - 1);
			var fromStartOffset = from * this.structSize;
			var fromEndOffset = Math.min((from + fromCount), this.count) * this.structSize;
			var fromSubArray = this.data.subarray(fromStartOffset, fromEndOffset);
			for (var i = to; i < to + toCount && i < this.count; i += fromCount) {
				this.data.set(fromSubArray, i * this.structSize);
			}
		}
	};
	SheetMemory.prototype.clear = function(start, end) {
		end = Math.min(end, this.count);
		if (start < end) {
			this.data.fill(0, start * this.structSize, end * this.structSize);
		}
	};
	SheetMemory.prototype.getUint8 = function(index, offset) {
		offset += index * this.structSize;
		return this.data[offset];
	};
	SheetMemory.prototype.setUint8 = function(index, offset, val) {
		offset += index * this.structSize;
		this.data[offset] = val;
	};
	SheetMemory.prototype.getUint16 = function(index, offset) {
		offset += index * this.structSize;
		return AscFonts.FT_Common.IntToUInt(this.data[offset] | this.data[offset + 1] << 8);
	};
	SheetMemory.prototype.setUint16 = function(index, offset, val) {
		offset += index * this.structSize;
		this.data[offset] = (val) & 0xFF;
		this.data[offset + 1] = (val >>> 8) & 0xFF;
	};
	SheetMemory.prototype.getUint32 = function(index, offset) {
		offset += index * this.structSize;
		return AscFonts.FT_Common.IntToUInt(this.data[offset] | this.data[offset + 1] << 8 | this.data[offset + 2] << 16 | this.data[offset + 3] << 24);
	};
	SheetMemory.prototype.setUint32 = function(index, offset, val) {
		offset += index * this.structSize;
		this.data[offset] = (val) & 0xFF;
		this.data[offset + 1] = (val >>> 8) & 0xFF;
		this.data[offset + 2] = (val >>> 16) & 0xFF;
		this.data[offset + 3] = (val >>> 24) & 0xFF;
	};
	SheetMemory.prototype.getFloat64 = function(index, offset) {
		offset += index * this.structSize;
		tempHelpUnit[0] = this.data[offset];
		tempHelpUnit[1] = this.data[offset + 1];
		tempHelpUnit[2] = this.data[offset + 2];
		tempHelpUnit[3] = this.data[offset + 3];
		tempHelpUnit[4] = this.data[offset + 4];
		tempHelpUnit[5] = this.data[offset + 5];
		tempHelpUnit[6] = this.data[offset + 6];
		tempHelpUnit[7] = this.data[offset + 7];
		return tempHelpFloat[0];
	};
	SheetMemory.prototype.setFloat64 = function(index, offset, val) {
		offset += index * this.structSize;
		tempHelpFloat[0] = val;
		this.data[offset] = tempHelpUnit[0];
		this.data[offset + 1] = tempHelpUnit[1];
		this.data[offset + 2] = tempHelpUnit[2];
		this.data[offset + 3] = tempHelpUnit[3];
		this.data[offset + 4] = tempHelpUnit[4];
		this.data[offset + 5] = tempHelpUnit[5];
		this.data[offset + 6] = tempHelpUnit[6];
		this.data[offset + 7] = tempHelpUnit[7];
	};
	/**
	 * @constructor
	 */
	function Worksheet(wb, _index, sId){
		this.workbook = wb;
		this.sName = this.workbook.getUniqueSheetNameFrom(g_sNewSheetNamePattern, false);
		this.bHidden = false;
		this.oSheetFormatPr = new AscCommonExcel.SheetFormatPr();
		this.index = _index;
		this.Id = null != sId ? sId : AscCommon.g_oIdCounter.Get_NewId();
		this.nRowsCount = 0;
		this.nColsCount = 0;
		this.rowsData = new SheetMemory(AscCommonExcel.g_nRowStructSize, gc_nMaxRow0);
		this.cellsByCol = [];
		this.cellsByColRowsCount = 0;//maximum rows count in cellsByCol
		this.aCols = [];// 0 based
		this.hiddenManager = new HiddenManager(this);
		this.Drawings = [];
		this.TableParts = [];
		this.AutoFilter = null;
		this.oAllCol = null;
		this.aComments = [];
		var oThis = this;
		this.bExcludeHiddenRows = false;
		this.bIgnoreWriteFormulas = false;
		this.mergeManager = new RangeDataManager(function(data, from, to){
			if(History.Is_On() && (null != from || null != to))
			{
				if(null != from)
					from = from.clone();
				if(null != to)
					to = to.clone();
				var oHistoryRange = from;
				if(null == oHistoryRange)
					oHistoryRange = to;
				History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ChangeMerge, oThis.getId(), oHistoryRange, new UndoRedoData_FromTo(new UndoRedoData_BBox(from), new UndoRedoData_BBox(to)));
			}
			//расширяем границы
			if(null != to){
				var maxRow = gc_nMaxRow0 !== to.r2 ? to.r2 : to.r1;
				var maxCol = gc_nMaxCol0 !== to.c2 ? to.c2 : to.c1;
				if(maxRow >= oThis.nRowsCount)
					oThis.nRowsCount = maxRow + 1;
				if(maxCol >= oThis.nColsCount)
					oThis.nColsCount = maxCol + 1;
			}
		});
		this.mergeManager.worksheet = this;
		this.hyperlinkManager = new RangeDataManager(function(data, from, to, oChangeParam){
			if(History.Is_On() && (null != from || null != to))
			{
				if(null != from)
					from = from.clone();
				if(null != to)
					to = to.clone();
				var oHistoryRange = from;
				if(null == oHistoryRange)
					oHistoryRange = to;
				var oHistoryData = null;
				if(null == from || null == to)
					oHistoryData = data.clone();
				History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ChangeHyperlink, oThis.getId(), oHistoryRange, new AscCommonExcel.UndoRedoData_FromToHyperlink(from, to, oHistoryData));
			}
			if (null != to)
				data.Ref = oThis.getRange3(to.r1, to.c1, to.r2, to.c2);
			else if (oChangeParam && oChangeParam.removeStyle && null != data.Ref)
				data.Ref.cleanFormat();
			//расширяем границы
			if(null != to){
				var maxRow = gc_nMaxRow0 !== to.r2 ? to.r2 : to.r1;
				var maxCol = gc_nMaxCol0 !== to.c2 ? to.c2 : to.c1;
				if(maxRow >= oThis.nRowsCount)
					oThis.nRowsCount = maxRow + 1;
				if(maxCol >= oThis.nColsCount)
					oThis.nColsCount = maxCol + 1;
			}
		});
		this.hyperlinkManager.setDependenceManager(this.mergeManager);
		this.DrawingDocument = new AscCommon.CDrawingDocument();
		this.sheetViews = [];
		this.aConditionalFormattingRules = [];
		this.updateConditionalFormattingRange = null;
		this.dataValidations = null;
		this.sheetPr = null;
		this.aFormulaExt = null;

		this.autoFilters = AscCommonExcel.AutoFilters !== undefined ? new AscCommonExcel.AutoFilters(this) : null;
		this.sortState = null;

		this.oDrawingOjectsManager = new DrawingObjectsManager(this);
		this.contentChanges = new AscCommon.CContentChanges();

		this.aSparklineGroups = [];

		this.selectionRange = new AscCommonExcel.SelectionRange(this);
		this.sheetMergedStyles = new AscCommonExcel.SheetMergedStyles();
		this.pivotTables = [];
		this.headerFooter = new Asc.CHeaderFooter(this);
		this.rowBreaks = null;
		this.colBreaks = null;
		this.legacyDrawingHF = null;
		this.picture = null;

		this.PagePrintOptions = new Asc.asc_CPageOptions(this);
		//***array-formula***
		//TODO пересмотреть. нужно для того, чтобы хранить ссылку на parserFormula главной ячейки при проходе по range массива
		this.formulaArrayLink = null;

		this.lastFindOptions = null;

		//чтобы разделять ситуации, когда группы скрываются/открываются из меню(в данном случае не скрываются внутренние группы)
		//и ситуацию, когда группы скрываются/открываются при скрытии строк/столбцов(все внутренние группы скрываются)
		//этот флаг проставляются в true при скрытии групп из меню группировки(нажатие на +/- и скрытие целиком всего уровня)
		//в данном случае не нужно при скрытии строк делать setCollapsed(из-за внутренних групп) и заносить данные в историю
		//во всех остальных ситуациях это делать необходимо
		this.bExcludeCollapsed = false;

		/*handlers*/
		this.handlers = null;
	}

	Worksheet.prototype.getCompiledStyle = function (row, col, opt_cell, opt_styleComponents) {
		return getCompiledStyle(this.sheetMergedStyles, this.hiddenManager, row, col, opt_cell, this, opt_styleComponents);
	};
	Worksheet.prototype.getCompiledStyleCustom = function(row, col, needTable, needCell, needConditional, opt_cell) {
		var res;
		var styleComponents = this.sheetMergedStyles.getStyle(this.hiddenManager, row, col, this);
		var ws = this;
		if (!needTable) {
			styleComponents.table = [];
		}
		if (!needConditional) {
			styleComponents.conditional = [];
		}
		if (!needCell) {
			res = getCompiledStyle(undefined, undefined, row, col, undefined, undefined, styleComponents);
		} else if (opt_cell) {
			res = getCompiledStyle(undefined, undefined, row, col, opt_cell, ws, styleComponents);
		} else {
			this._getCellNoEmpty(row, col, function(cell) {
				res = getCompiledStyle(undefined, undefined, row, col, cell, ws, styleComponents);
			});
		}
		return res;
	};
	Worksheet.prototype.getColData = function(index) {
		var sheetMemory = this.cellsByCol[index];
		if(!sheetMemory){
			sheetMemory = new SheetMemory(g_nCellStructSize, gc_nMaxRow0);
			this.cellsByCol[index] = sheetMemory;
		}
		return sheetMemory;
	};
	Worksheet.prototype.getColDataNoEmpty = function(index) {
		return this.cellsByCol[index];
	};
	Worksheet.prototype.getColDataLength = function() {
		return this.cellsByCol.length;
	};
	Worksheet.prototype.getSnapshot = function(wb) {
		var ws = new Worksheet(wb, this.index, this.Id);
		ws.sName = this.sName;
		for (var i = 0; i < this.TableParts.length; ++i) {
			var table = this.TableParts[i];
			ws.addTablePart(table.clone(null), false);
		}
		for (i = 0; i < this.sheetViews.length; ++i) {
			ws.sheetViews.push(this.sheetViews[i].clone());
		}
		return ws;
	};
	Worksheet.prototype.addContentChanges = function (changes) {
		this.contentChanges.Add(changes);
	};
	Worksheet.prototype.refreshContentChanges = function () {
		this.contentChanges.Refresh();
		this.contentChanges.Clear();
	};
	Worksheet.prototype.rebuildColors=function(){
		this.rebuildTabColor();

		for (var i = 0; i < this.aSparklineGroups.length; ++i) {
			this.aSparklineGroups[i].cleanCache();
		}
	};
	Worksheet.prototype.generateFontMap=function(oFontMap){
		//пробегаемся по Drawing
		for(var i = 0, length = this.Drawings.length; i < length; ++i)
		{
			var drawing = this.Drawings[i];
			if(drawing)
				drawing.getAllFonts(oFontMap);
		}

		//пробегаемся по header/footer
		if(this.headerFooter){
			this.headerFooter.getAllFonts(oFontMap);
		}
	};
	Worksheet.prototype.getAllImageUrls = function(aImages){
		for(var i = 0; i < this.Drawings.length; ++i){
			this.Drawings[i].graphicObject.getAllRasterImages(aImages);
		}
	};
	Worksheet.prototype.reassignImageUrls = function(oImages){
		for(var i = 0; i < this.Drawings.length; ++i){
			this.Drawings[i].graphicObject.Reassign_ImageUrls(oImages);
		}
	};
	Worksheet.prototype.copyFrom=function(wsFrom, sName, tableNames){	var i, elem, range;
		var t = this;
		this.sName = this.workbook.checkValidSheetName(sName) ? sName : this.workbook.getUniqueSheetNameFrom(wsFrom.sName, true);
		this.bHidden = wsFrom.bHidden;
		this.oSheetFormatPr = wsFrom.oSheetFormatPr.clone();
		//this.index = wsFrom.index;
		this.nRowsCount = wsFrom.nRowsCount;
		this.nColsCount = wsFrom.nColsCount;
		var renameParams = {lastName: wsFrom.getName(), newName: this.getName(), tableNameMap: {}};
		for (i = 0; i < wsFrom.TableParts.length; ++i)
		{
			var tableFrom = wsFrom.TableParts[i];
			var tableTo = tableFrom.clone(null);
			if(tableNames && tableNames.length) {
				tableTo.changeDisplayName(tableNames[i]);
			} else {
				tableTo.changeDisplayName(this.workbook.dependencyFormulas.getNextTableName());
			}
			this.addTablePart(tableTo, true);
			renameParams.tableNameMap[tableFrom.DisplayName] = tableTo.DisplayName;
		}
		for (i = 0; i < this.TableParts.length; ++i) {
			this.TableParts[i].renameSheetCopy(this, renameParams);
		}
		if(wsFrom.AutoFilter)
			this.AutoFilter = wsFrom.AutoFilter.clone();
		for (i in wsFrom.aCols) {
			var col = wsFrom.aCols[i];
			if(null != col)
				this.aCols[i] = col.clone(this);
		}
		if(null != wsFrom.oAllCol)
			this.oAllCol = wsFrom.oAllCol.clone(this);

		//copy row/cell data
		this.rowsData = wsFrom.rowsData.clone();
		wsFrom._forEachColData(function(sheetMemory, index){
			t.cellsByCol[index] = sheetMemory.clone();
		});
		this.cellsByColRowsCount = wsFrom.cellsByColRowsCount;

		var aMerged = wsFrom.mergeManager.getAll();
		for(i in aMerged)
		{
			elem = aMerged[i];
			range = this.getRange3(elem.bbox.r1, elem.bbox.c1, elem.bbox.r2, elem.bbox.c2);
			range.mergeOpen();
		}
		var aHyperlinks = wsFrom.hyperlinkManager.getAll();
		for(i in aHyperlinks)
		{
			elem = aHyperlinks[i];
			range = this.getRange3(elem.bbox.r1, elem.bbox.c1, elem.bbox.r2, elem.bbox.c2);
			range.setHyperlinkOpen(elem.data);
		}
		if(null != wsFrom.aComments) {
			for (i = 0; i < wsFrom.aComments.length; i++) {
				var comment = wsFrom.aComments[i].clone(true);
				comment.wsId = this.getId();
				comment.nId = "sheet" + comment.wsId + "_" + (i + 1);
				this.aComments.push(comment);
			}
		}
		for (i = 0; i < wsFrom.sheetViews.length; ++i) {
			this.sheetViews.push(wsFrom.sheetViews[i].clone());
		}
		for (i = 0; i < wsFrom.aConditionalFormattingRules.length; ++i) {
			this.aConditionalFormattingRules.push(wsFrom.aConditionalFormattingRules[i].clone());
		}
		if (wsFrom.dataValidations)
			this.dataValidations = wsFrom.dataValidations.clone();
		if (wsFrom.sheetPr)
			this.sheetPr = wsFrom.sheetPr.clone();

		this.selectionRange = wsFrom.selectionRange.clone(this);

		//change cell formulas
		var oldNewArrayFormulaMap = [];
		this._forEachCell(function(cell) {
			if (cell.isFormula()) {
				var parsed, notMainArrayCell;
				if (cell.transformSharedFormula()) {
					parsed = cell.getFormulaParsed();
				} else {
					parsed = cell.getFormulaParsed();
					if(parsed.getArrayFormulaRef()) {//***array-formula***
						var listenerId = parsed.getListenerId();
						//formula-array: parsed object one of all array cells
						if(oldNewArrayFormulaMap[listenerId]) {
							parsed = oldNewArrayFormulaMap[listenerId];
							notMainArrayCell = true;
						} else {
							parsed = parsed.clone(null, new CCellWithFormula(t, cell.nRow, cell.nCol), t);
							oldNewArrayFormulaMap[listenerId] = parsed;
						}
					} else {
						parsed = parsed.clone(null, new CCellWithFormula(t, cell.nRow, cell.nCol), t);
					}
				}
				if(!notMainArrayCell) {
					parsed.renameSheetCopy(renameParams);
					parsed.setFormulaString(parsed.assemble(true));
				}
				cell.setFormulaInternal(parsed, true);
				t.workbook.dependencyFormulas.addToBuildDependencyCell(cell);
			}
		});
		
		if(wsFrom.PagePrintOptions) {
			this.PagePrintOptions = wsFrom.PagePrintOptions.clone(this);
		}

		//copy headers/footers
		if(wsFrom.headerFooter) {
			this.headerFooter = wsFrom.headerFooter.clone(this);
		}

		return renameParams;
	};
	Worksheet.prototype.copyObjects = function (oNewWs, wsFrom) {
		var i;
		if (null != this.Drawings && this.Drawings.length > 0) {
			var drawingObjects = new AscFormat.DrawingObjects();
			oNewWs.Drawings = [];
			AscFormat.NEW_WORKSHEET_DRAWING_DOCUMENT = oNewWs.DrawingDocument;
			for (i = 0; i < this.Drawings.length; ++i) {
				var drawingObject = drawingObjects.cloneDrawingObject(this.Drawings[i]);
				drawingObject.graphicObject = this.Drawings[i].graphicObject.copy(undefined);
				drawingObject.graphicObject.setWorksheet(oNewWs);
				drawingObject.graphicObject.addToDrawingObjects();
				var drawingBase = this.Drawings[i];
				drawingObject.graphicObject.setDrawingBaseCoords(drawingBase.from.col, drawingBase.from.colOff,
																 drawingBase.from.row, drawingBase.from.rowOff, drawingBase.to.col, drawingBase.to.colOff,
																 drawingBase.to.row, drawingBase.to.rowOff, drawingBase.Pos.X, drawingBase.Pos.Y, drawingBase.ext.cx,
																 drawingBase.ext.cy);
				if(drawingObject.graphicObject.setDrawingBaseType){
					drawingObject.graphicObject.setDrawingBaseType(drawingBase.Type);
					if(drawingBase.Type === AscCommon.c_oAscCellAnchorType.cellanchorTwoCell)
					{
						drawingObject.graphicObject.setDrawingBaseEditAs(AscCommon.c_oAscCellAnchorType.cellanchorTwoCell);
					}
				}
				oNewWs.Drawings[oNewWs.Drawings.length - 1] = drawingObject;
			}
			AscFormat.NEW_WORKSHEET_DRAWING_DOCUMENT = null;
			drawingObjects.pushToAObjects(oNewWs.Drawings);
			drawingObjects.updateChartReferences2(parserHelp.getEscapeSheetName(wsFrom.sName),
												  parserHelp.getEscapeSheetName(oNewWs.sName));
		}

		var newSparkline;
		for (i = 0; i < this.aSparklineGroups.length; ++i) {
			newSparkline = this.aSparklineGroups[i].clone();
			newSparkline.setWorksheet(oNewWs, wsFrom);
			oNewWs.aSparklineGroups.push(newSparkline);
		}
	};
	Worksheet.prototype.initColumn = function (column) {
		if (column) {
			if (null !== column.width && 0 !== column.width) {
				column.widthPx = this.modelColWidthToColWidth(column.width);
				column.charCount = this.colWidthToCharCount(column.widthPx);
			} else {
				column.widthPx = column.charCount = null;
			}
		}
	};
	Worksheet.prototype.initColumns = function () {
		this.initColumn(this.oAllCol);
		this.aCols.forEach(this.initColumn, this);
	};
	Worksheet.prototype.initPostOpen = function (handlers) {
		this.PagePrintOptions.init();
		this.headerFooter.init();

		// Sheet Views
		if (0 === this.sheetViews.length) {
			// Даже если не было, создадим
			this.sheetViews.push(new AscCommonExcel.asc_CSheetViewSettings());
		}
		//this.setTableFormulaAfterOpen();
		this.hiddenManager.initPostOpen();
		this.oSheetFormatPr.correction();

		this.handlers = handlers;
		this._setHandlersTablePart();
	};
	Worksheet.prototype._getValuesForConditionalFormatting = function(ranges, numbers) {
		var res = [];
		for (var i = 0; i < ranges.length; ++i) {
			var elem = ranges[i];
			var range = this.getRange3(elem.r1, elem.c1, elem.r2, elem.c2);
			res = res.concat(range._getValues(numbers));
		}
		return res;
	};
	Worksheet.prototype._isConditionalFormattingIntersect = function(range, ranges) {
		for (var i = 0; i < ranges.length; ++i) {
			if (range.isIntersect(ranges[i])) {
				return true;
			}
		}
		return false;
	};
	Worksheet.prototype.setDirtyConditionalFormatting = function(range) {
		if (!range) {
			range = new AscCommonExcel.MultiplyRange([new Asc.Range(0, 0, gc_nMaxCol0, gc_nMaxRow0)]);
		}
		if (this.updateConditionalFormattingRange) {
			this.updateConditionalFormattingRange.union2(range);
		} else {
			this.updateConditionalFormattingRange = range.clone();
		}
	};
	Worksheet.prototype._updateConditionalFormatting = function() {
		if (!this.updateConditionalFormattingRange) {
			return;
		}
		var range = this.updateConditionalFormattingRange;
		this.updateConditionalFormattingRange = null;
		var t = this;
		var aRules = this.aConditionalFormattingRules.sort(function(v1, v2) {
			return v2.priority - v1.priority;
		});
		var oGradient1, oGradient2, aWeights, oRule, multiplyRange, oRuleElement, bboxCf, formulaParent, parsed1, parsed2;
		var o, l, cell, ranges, values, value, tmp, dxf, compareFunction, nc, sum;
		this.sheetMergedStyles.clearConditionalStyle(range);
		var getCacheFunction = function(rule, setFunc) {
			var cache = {
				cache: {},
				get: function(row, col) {
					var cacheVal;
					var cacheRow = this.cache[row];
					if (!cacheRow) {
						cacheRow = {};
						this.cache[row] = cacheRow;
					} else {
						cacheVal = cacheRow[col];
					}
					if(undefined ===cacheVal){
						cacheVal = this.set(row, col);
						cacheRow[col] = cacheVal;
					}
					return cacheVal;
				},
				set: function(row, col) {
					if(rule){
						return setFunc(row, col) ? rule.dxf : null;
					} else {
						return setFunc(row, col);
					}
				}
			};
			return function(row, col) {
				return cache.get(row, col);
			};
		};
		for (var i = 0; i < aRules.length; ++i) {
			oRule = aRules[i];
			ranges = oRule.ranges;
			if (this._isConditionalFormattingIntersect(range, ranges)) {
				multiplyRange = new AscCommonExcel.MultiplyRange(ranges);
					// ToDo expression, iconSet (page 2679)
					if (AscCommonExcel.ECfType.colorScale === oRule.type) {
						if (1 !== oRule.aRuleElements.length) {
							continue;
						}
						oRuleElement = oRule.aRuleElements[0];
						if (!oRuleElement || oRule.type !== oRuleElement.type) {
							continue;
						}
						values = this._getValuesForConditionalFormatting(ranges, true);

						// ToDo CFVO Type formula (page 2681)
						l = oRuleElement.aColors.length;
						if (0 < values.length && 2 <= l) {
							aWeights = [];
							oGradient1 = new AscCommonExcel.CGradient(oRuleElement.aColors[0], oRuleElement.aColors[1]);
							aWeights.push(oRule.getMin(values, t), oRule.getMax(values, t));
							if (2 < l) {
								oGradient2 = new AscCommonExcel.CGradient(oRuleElement.aColors[1], oRuleElement.aColors[2]);
								aWeights.push(oRule.getMid(values, t));

								aWeights.sort(AscCommon.fSortAscending);
								oGradient1.init(aWeights[0], aWeights[1]);
								oGradient2.init(aWeights[1], aWeights[2]);
							} else {
								oGradient2 = null;
								aWeights.sort(AscCommon.fSortAscending);
								oGradient1.init(aWeights[0], aWeights[1]);
							}

							compareFunction = (function (oGradient1, oGradient2) {
								return function (row, col) {
									var val, color, gradient;
									t._getCellNoEmpty(row, col, function (cell) {
										val = cell && cell.getNumberValue();
									});
									dxf = null;
									if (null !== val) {
										dxf = new AscCommonExcel.CellXfs();
										gradient = oGradient2 ? oGradient2 : oGradient1;
										if (val >= gradient.max) {
											color = gradient.getMaxColor();
										} else if (val <= oGradient1.min) {
											color = oGradient1.getMinColor();
										} else {
											gradient = (oGradient2 && val > oGradient1.max) ? oGradient2 : oGradient1;
											color = gradient.calculateColor(val);
										}
										dxf.fill = new AscCommonExcel.Fill();
										dxf.fill.fromColor(color);
										dxf = g_StyleCache.addXf(dxf, true);
									}
									return dxf;
								};
							})(oGradient1, oGradient2);
						}
					} else if (AscCommonExcel.ECfType.dataBar === oRule.type) {
						continue;
					} else if (AscCommonExcel.ECfType.top10 === oRule.type) {
						if (oRule.rank > 0 && oRule.dxf) {
							nc = 0;
							values = this._getValuesForConditionalFormatting(ranges, false);
							o = oRule.bottom ? Number.MAX_VALUE : -Number.MAX_VALUE;
							for (cell = 0; cell < values.length; ++cell) {
								value = values[cell];
								if (CellValueType.Number === value.type && !isNaN(tmp = parseFloat(value.v))) {
									++nc;
									value.v = tmp;
								} else {
									value.v = o;
								}
							}
							values.sort((function(condition) {
								return function(v1, v2) {
									return condition * (v2.v - v1.v);
								}
							})(oRule.bottom ? -1 : 1));

							nc = Math.max(1, oRule.percent ? Math.floor(nc * oRule.rank / 100) : oRule.rank);
							var threshold = values.length >= nc ? values[nc - 1].v : o;
							compareFunction = (function(rule, threshold) {
								return function(row, col) {
									var val;
									t._getCellNoEmpty(row, col, function(cell) {
										val = cell ? cell.getNumberValue() : null;
									});
									return (null !== val && (rule.bottom ? val <= threshold : val >= threshold)) ? rule.dxf : null;
								};
							})(oRule, threshold);
						}
					} else if (AscCommonExcel.ECfType.aboveAverage === oRule.type) {
						if (!oRule.dxf) {
							continue;
						}
						values = this._getValuesForConditionalFormatting(ranges, false);
						sum = 0;
						nc = 0;
						for (cell = 0; cell < values.length; ++cell) {
							value = values[cell];
							if (CellValueType.Number === value.type && !isNaN(tmp = parseFloat(value.v))) {
								++nc;
								value.v = tmp;
								sum += tmp;
							} else {
								value.v = null;
							}
						}

						tmp = sum / nc;
						/*if (oRule.hasStdDev()) {
						 sum = 0;
						 for (cell = 0; cell < values.length; ++cell) {
						 value = values[cell];
						 if (null !== value.v) {
						 sum += (value.v - tmp) * (value.v - tmp);
						 }
						 }
						 sum = Math.sqrt(sum / (nc - 1));
						 }*/
						compareFunction = (function(rule, average, stdDev) {
							return function(row, col) {
								var val;
								t._getCellNoEmpty(row, col, function(cell) {
									val = cell ? cell.getNumberValue() : null;
								});
								return (null !== val && rule.getAverage(val, average, stdDev)) ? rule.dxf : null;
							};
						})(oRule, tmp, sum);
					} else {
						if (!oRule.dxf) {
							continue;
						}
						switch (oRule.type) {
							case AscCommonExcel.ECfType.duplicateValues:
							case AscCommonExcel.ECfType.uniqueValues:
								o = getUniqueKeys(this._getValuesForConditionalFormatting(ranges, false));
								compareFunction = (function(rule, obj, condition) {
									return function(row, col) {
										var val;
										t._getCellNoEmpty(row, col, function(cell) {
											val = cell ? cell.getValueWithoutFormat() : "";
										});
										return (val.length > 0 ? condition === obj[val] : false) ? rule.dxf : null;
									};
								})(oRule, o, oRule.type === AscCommonExcel.ECfType.duplicateValues);
								break;
							case AscCommonExcel.ECfType.containsText:
							case AscCommonExcel.ECfType.notContainsText:
							case AscCommonExcel.ECfType.beginsWith:
							case AscCommonExcel.ECfType.endsWith:
								var operator;
								switch (oRule.type) {
									case AscCommonExcel.ECfType.containsText:
										operator = AscCommonExcel.ECfOperator.Operator_containsText;
										break;
									case AscCommonExcel.ECfType.notContainsText:
										operator = AscCommonExcel.ECfOperator.Operator_notContains;
										break;
									case AscCommonExcel.ECfType.beginsWith:
										operator = AscCommonExcel.ECfOperator.Operator_beginsWith;
										break;
									case AscCommonExcel.ECfType.endsWith:
										operator = AscCommonExcel.ECfOperator.Operator_endsWith;
										break;
								}
								formulaParent = new AscCommonExcel.CConditionalFormattingFormulaParent(this, oRule, true);
								oRuleElement = oRule.getFormulaCellIs();
								parsed1 = oRuleElement && oRuleElement.getFormula && oRuleElement.getFormula(this, formulaParent);
								if (parsed1 && parsed1.hasRelativeRefs()) {
									bboxCf = oRule.getBBox();
									compareFunction = getCacheFunction(oRule, (function(rule, operator, formulaParent, rowLT, colLT) {
										return function(row, col) {
											var offset = new AscCommon.CellBase(row - rowLT, col - colLT);
											var bboxCell = new Asc.Range(col, row, col, row);
											var v1 = rule.getValueCellIs(t, formulaParent, bboxCell, offset, false);
											var res;
											t._getCellNoEmpty(row, col, function(cell) {
												res = rule.cellIs(operator, cell, v1) ? rule.dxf : null;
											});
											return res;
										};
									})(oRule, operator,
										new AscCommonExcel.CConditionalFormattingFormulaParent(this, oRule, true),
										bboxCf ? bboxCf.r1 : 0, bboxCf ? bboxCf.c1 : 0));
								} else {
									compareFunction = (function(rule, operator, v1) {
										return function(row, col) {
											var res;
											t._getCellNoEmpty(row, col, function(cell) {
												res = rule.cellIs(operator, cell, v1) ? rule.dxf : null;
											});
											return res;
										};
									})(oRule, operator, oRule.getValueCellIs(this));
								}
								break;
							case AscCommonExcel.ECfType.containsErrors:
								compareFunction = (function(rule) {
									return function(row, col) {
										var val;
										t._getCellNoEmpty(row, col, function(cell) {
											val = (cell ? CellValueType.Error === cell.getType() : false);
										});
										return val ? rule.dxf : null;
									};
								})(oRule);
								break;
							case AscCommonExcel.ECfType.notContainsErrors:
								compareFunction = (function(rule) {
									return function(row, col) {
										var val;
										t._getCellNoEmpty(row, col, function(cell) {
											val = (cell ? CellValueType.Error !== cell.getType() : true);
										});
										return val ? rule.dxf : null;
									};
								})(oRule);
								break;
							case AscCommonExcel.ECfType.containsBlanks:
								compareFunction = (function(rule) {
									return function(row, col) {
										var val;
										t._getCellNoEmpty(row, col, function(cell) {
											if (cell) {
												//todo LEN(TRIM(A1))=0
												val = "" === cell.getValueWithoutFormat().replace(/^ +| +$/g, '');
											} else {
												val = true;
											}
										});
										return val ? rule.dxf : null;
									};
								})(oRule);
								break;
							case AscCommonExcel.ECfType.notContainsBlanks:
								compareFunction = (function(rule) {
									return function(row, col) {
										var val;
										t._getCellNoEmpty(row, col, function(cell) {
											if (cell) {
												//todo LEN(TRIM(A1))=0
												val = "" !== cell.getValueWithoutFormat().replace(/^ +| +$/g, '');
											} else {
												val = false;
											}
										});
										return val ? rule.dxf : null;
									};
								})(oRule);
								break;
							case AscCommonExcel.ECfType.timePeriod:
								if (oRule.timePeriod) {
									compareFunction = (function(rule, period) {
										return function(row, col) {
											var val;
											t._getCellNoEmpty(row, col, function(cell) {
												val = cell ? cell.getValueWithoutFormat() : "";
											});
											var n = parseFloat(val);
											return (period.start <= n && n < period.end) ? rule.dxf : null;
										};
									})(oRule, oRule.getTimePeriod());
								} else {
									continue;
								}
								break;
							case AscCommonExcel.ECfType.cellIs:
								formulaParent = new AscCommonExcel.CConditionalFormattingFormulaParent(this, oRule, true);
								oRuleElement = oRule.aRuleElements[0];
								parsed1 = oRuleElement && oRuleElement.getFormula && oRuleElement.getFormula(this, formulaParent);
								oRuleElement = oRule.aRuleElements[1];
								parsed2 = oRuleElement && oRuleElement.getFormula && oRuleElement.getFormula(this, formulaParent);
								if ((parsed1 && parsed1.hasRelativeRefs()) || (parsed2 && parsed2.hasRelativeRefs())) {
									bboxCf = oRule.getBBox();
									compareFunction = getCacheFunction(oRule, (function(rule, ruleElem1, ruleElem2, formulaParent, rowLT, colLT) {
										return function(row, col) {
											var offset = new AscCommon.CellBase(row - rowLT, col - colLT);
											var bboxCell = new Asc.Range(col, row, col, row);
											var v1 = ruleElem1 && ruleElem1.getValue(t, formulaParent, bboxCell, offset, false);
											var v2 = ruleElem2 && ruleElem2.getValue(t, formulaParent, bboxCell, offset, false);
											var res;
											t._getCellNoEmpty(row, col, function(cell) {
												res = rule.cellIs(rule.operator, cell, v1, v2) ? rule.dxf : null;
											});
											return res;
										};
									})(oRule, oRule.aRuleElements[0], oRule.aRuleElements[1],
										new AscCommonExcel.CConditionalFormattingFormulaParent(this, oRule, true),
										bboxCf ? bboxCf.r1 : 0, bboxCf ? bboxCf.c1 : 0));
								} else {
									compareFunction = (function(rule, v1, v2) {
										return function(row, col) {
											var res;
											t._getCellNoEmpty(row, col, function(cell) {
												res = rule.cellIs(rule.operator, cell, v1, v2) ? rule.dxf : null;
											});
											return res;
										};
									})(oRule, oRule.aRuleElements[0] && oRule.aRuleElements[0].getValue(this),
										oRule.aRuleElements[1] && oRule.aRuleElements[1].getValue(this));
								}
								break;
							case AscCommonExcel.ECfType.expression:
								bboxCf = oRule.getBBox();
								compareFunction = getCacheFunction(oRule, (function(rule, formulaCF, formulaParent, rowLT, colLT) {
									return function(row, col) {
										var offset = new AscCommon.CellBase(row - rowLT, col - colLT);
										var bboxCell = new Asc.Range(col, row, col, row);
										var res = formulaCF && formulaCF.getValue(t, formulaParent, bboxCell, offset, true);
										if (res && res.tocBool) {
											res = res.tocBool();
											if (res && res.toBool) {
												return res.toBool();
											}
										}
										return false;
									};
								})(oRule, oRule.aRuleElements[0],
									new AscCommonExcel.CConditionalFormattingFormulaParent(this, oRule, true),
									bboxCf ? bboxCf.r1 : 0, bboxCf ? bboxCf.c1 : 0));
								break;
							default:
								continue;
								break;
						}
					}
					if (compareFunction) {
						this.sheetMergedStyles.setConditionalStyle(multiplyRange, compareFunction);
					}
				}
			}
	};
	Worksheet.prototype._forEachRow = function(fAction) {
		this.getRange3(0, 0, gc_nMaxRow0, 0)._foreachRowNoEmpty(fAction);
	};
	Worksheet.prototype._forEachCol = function(fAction) {
		this.getRange3(0, 0, 0, gc_nMaxCol0)._foreachColNoEmpty(fAction);
	};
	Worksheet.prototype._forEachColData = function(fAction) {
		for (var i = 0; i < this.cellsByCol.length; ++i) {
			var sheetMemory = this.cellsByCol[i];
			if (sheetMemory) {
				fAction(sheetMemory, i);
			}
		}
	};
	Worksheet.prototype._forEachCell = function(fAction) {
		this.getRange3(0, 0, gc_nMaxRow0, gc_nMaxCol0)._foreachNoEmpty(fAction);
	};
	Worksheet.prototype.getId=function(){
		return this.Id;
	};
	Worksheet.prototype.getIndex=function(){
		return this.index;
	};
	Worksheet.prototype.getName=function(){
		return this.sName !== undefined && this.sName.length > 0 ? this.sName : "";
	};
	Worksheet.prototype.setName=function(name, bFromUndoRedo){
		if(name.length <= g_nSheetNameMaxLength)
		{
			var lastName = this.sName;
			History.Create_NewPoint();
			var prepared = this.workbook.dependencyFormulas.prepareChangeSheet(this.getId(), {rename: {from: lastName, to: name}});
			this.sName = name;
			this.workbook.dependencyFormulas.changeSheet(prepared);

			History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_Rename, this.getId(), null, new UndoRedoData_FromTo(lastName, name));
			if(!bFromUndoRedo)
			{
				var _lastName = parserHelp.getEscapeSheetName(lastName);
				var _newName = parserHelp.getEscapeSheetName(this.sName);

				for (var key in this.workbook.aWorksheets)
				{
					var wsModel = this.workbook.aWorksheets[key];
					if ( wsModel )
						wsModel.oDrawingOjectsManager.updateChartReferencesWidthHistory(_lastName, _newName, true);
				}
			}
			this.workbook.dependencyFormulas.calcTree();
		} else {
			console.log(new Error('The sheet name must be less than 31 characters.'));
		}
	};
	Worksheet.prototype.getTabColor=function(){
		return this.sheetPr && this.sheetPr.TabColor ? Asc.colorObjToAscColor(this.sheetPr.TabColor) : null;
	};
	Worksheet.prototype.setTabColor=function(color){
		if (!this.sheetPr)
			this.sheetPr = new AscCommonExcel.asc_CSheetPr();

		History.Create_NewPoint();
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_SetTabColor, this.getId(), null,
					new UndoRedoData_FromTo(this.sheetPr.TabColor ? this.sheetPr.TabColor.clone() : null, color ? color.clone() : null));

		this.sheetPr.TabColor = color;
		if (!this.workbook.bUndoChanges && !this.workbook.bRedoChanges)
			this.workbook.handlers.trigger("asc_onUpdateTabColor", this.getIndex());
	};
	Worksheet.prototype.rebuildTabColor = function() {
		if (this.sheetPr && this.sheetPr.TabColor) {
			this.workbook.handlers.trigger("asc_onUpdateTabColor", this.getIndex());
		}
	};
	Worksheet.prototype.getHidden=function(){
		return true === this.bHidden;
	};
	Worksheet.prototype.setHidden = function (hidden) {
		var bOldHidden = this.bHidden, wb = this.workbook, wsActive = wb.getActiveWs(), oVisibleWs = null;
		this.bHidden = hidden;
		if (bOldHidden != hidden) {
			if (true == this.bHidden && this.getIndex() == wsActive.getIndex()) {
				oVisibleWs = wb.findSheetNoHidden(this.getIndex());
			} else if (false == this.bHidden && this.getIndex() !== wsActive.getIndex()) {
				oVisibleWs = this;
			}
			if (null != oVisibleWs) {
				var nNewIndex = oVisibleWs.getIndex();
				wb.setActive(nNewIndex);
				if (!wb.bUndoChanges && !wb.bRedoChanges)
					wb.handlers.trigger("undoRedoHideSheet", nNewIndex);
			}
			History.Create_NewPoint();
			History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_Hide, this.getId(), null, new UndoRedoData_FromTo(bOldHidden, hidden));
			if (null != oVisibleWs) {
				History.SetSheetUndo(wsActive.getId());
				History.SetSheetRedo(oVisibleWs.getId());
			}
		}
	};
	Worksheet.prototype.getSheetView = function () {
		return this.sheetViews[0];
	};
	Worksheet.prototype.getSheetViewSettings = function () {
		return this.sheetViews[0].clone();
	};
	Worksheet.prototype.setDisplayGridlines = function (value) {
		var view = this.sheetViews[0];
		if (value !== view.showGridLines) {
			History.Create_NewPoint();
			History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_SetDisplayGridlines,
				this.getId(), null, new UndoRedoData_FromTo(view.showGridLines, value));
			view.showGridLines = value;

			if (!this.workbook.bUndoChanges && !this.workbook.bRedoChanges) {
				this.workbook.handlers.trigger("asc_onUpdateSheetViewSettings");
			}
		}
	};
	Worksheet.prototype.setDisplayHeadings = function (value) {
		var view = this.sheetViews[0];
		if (value !== view.showRowColHeaders) {
			History.Create_NewPoint();
			History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_SetDisplayHeadings,
				this.getId(), null, new UndoRedoData_FromTo(view.showRowColHeaders, value));
			view.showRowColHeaders = value;

			if (!this.workbook.bUndoChanges && !this.workbook.bRedoChanges) {
				this.workbook.handlers.trigger("asc_onUpdateSheetViewSettings");
			}
		}
	};
	Worksheet.prototype.getRowsCount=function(){
		var result = this.nRowsCount;
		var pane = this.sheetViews.length && this.sheetViews[0].pane;
		if (pane && pane.topLeftFrozenCell)
			result = Math.max(result, pane.topLeftFrozenCell.getRow0());
		return result;
	};
	Worksheet.prototype.removeRows=function(start, stop, bExcludeHiddenRows){
		var removeRowsArr = bExcludeHiddenRows ? this._getNoHiddenRowsArr(start, stop) : [{start: start, stop: stop}];
		for(var i = removeRowsArr.length - 1; i >= 0; i--) {
			var oRange = this.getRange(new CellAddress(removeRowsArr[i].start, 0, 0), new CellAddress(removeRowsArr[i].stop, gc_nMaxCol0, 0));
			oRange.deleteCellsShiftUp();
		}
	};
	Worksheet.prototype._getNoHiddenRowsArr=function(start, stop){
		var res = [];
		var elem = null;
		for (var i = start; i <= stop; i++) {
			if (this.getRowHidden(i)) {
				if (elem) {
					res.push(elem);
					elem = null;
				}
			} else {
				if (!elem) {
					elem = {};
					elem.start = i;
					elem.stop = i;
				} else {
					elem.stop++;
				}
				if (i === stop) {
					res.push(elem);
				}
			}
		}
		return res;
	};
	Worksheet.prototype._updateFormulasParents = function(r1, c1, r2, c2, bbox, offset, shiftedShared) {
		var t = this;
		var cellWithFormula;
		var shiftedArrayFormula = {};
		this.getRange3(r1, c1, r2, c2)._foreachNoEmpty(function(cell){
			var newNRow = cell.nRow + offset.row;
			var newNCol = cell.nCol + offset.col;
			var bHor = 0 !== offset.col;
			var toDelete = offset.col < 0 || offset.row < 0;

			if (cell.isFormula()) {
				var processed = c_oSharedShiftType.NeedTransform;
				var parsed = cell.getFormulaParsed();
				var shared = parsed.getShared();
				var arrayFormula = parsed.getArrayFormulaRef();
				var formulaRefObj = null;
				if (shared) {
					processed = shiftedShared[parsed.getListenerId()];
					var isPreProcessed = c_oSharedShiftType.PreProcessed === processed;
					if (!processed || isPreProcessed) {
						if (!processed) {
							var bboxShift = AscCommonExcel.shiftGetBBox(bbox, bHor);
							//if shared not completly in shift range - transform
							//if shared intersect delete range - transform
							if (bboxShift.containsRange(shared.ref) && (!toDelete || !bbox.isIntersect(shared.ref))) {
								processed = c_oSharedShiftType.Processed;
							} else {
								processed = c_oSharedShiftType.NeedTransform;
							}
						} else if(isPreProcessed) {
							//At PreProcessed stage all required formula was transformed. here we need to shift shared
							processed = c_oSharedShiftType.Processed;
						}
						if (c_oSharedShiftType.Processed === processed) {
							var newRef = shared.ref.clone();
							newRef.forShift(bbox, offset, t.workbook.bUndoChanges);
							parsed.setSharedRef(newRef, !isPreProcessed);
							t.workbook.dependencyFormulas.addToChangedRange2(t.getId(), newRef);
						}
						shiftedShared[parsed.getListenerId()] = processed;
					}
				} else if(arrayFormula) {
					//***array-formula***
					if(!shiftedArrayFormula[parsed.getListenerId()] && parsed.checkFirstCellArray(cell)) {
						shiftedArrayFormula[parsed.getListenerId()] = 1;
						var newArrayRef = arrayFormula.clone();
						newArrayRef.setOffset(offset);
						parsed.setArrayFormulaRef(newArrayRef);
					} else {
						processed = c_oSharedShiftType.Processed;
					}
				}

				if (c_oSharedShiftType.NeedTransform === processed) {
					var isTransform = cell.transformSharedFormula();
					parsed = cell.getFormulaParsed();
					if (isTransform) {
						parsed.buildDependencies();
					}

					cellWithFormula = parsed.getParent();
					cellWithFormula.nRow = newNRow;
					cellWithFormula.nCol = newNCol;
					t.workbook.dependencyFormulas.addToChangedCell(cellWithFormula);
				}
			}
			t.cellsByColRowsCount = Math.max(t.cellsByColRowsCount, newNRow + 1);
			t.nRowsCount = Math.max(t.nRowsCount, t.cellsByColRowsCount);
			t.nColsCount = Math.max(t.nColsCount, newNCol + 1);
		});
	};
	Worksheet.prototype._removeRows=function(start, stop){
		var t = this;
		this.workbook.dependencyFormulas.lockRecal();
		History.Create_NewPoint();
		//start, stop 0 based
		var nDif = -(stop - start + 1);
		var oActualRange = new Asc.Range(0, start, gc_nMaxCol0, stop);
		var offset = new AscCommon.CellBase(nDif, 0);
		//renameDependencyNodes before move cells to store current location in history
		var renameRes = this.renameDependencyNodes(offset, oActualRange);
		var redrawTablesArr = this.autoFilters.insertRows("delCell", oActualRange, c_oAscDeleteOptions.DeleteRows);
		this.updatePivotOffset(oActualRange, offset);
		if (false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			this.updateSortStateOffset(oActualRange, offset);
			History.LocalChange = false;
		}

		var collapsedInfo = null, lastRowIndex;
		var oDefRowPr = new AscCommonExcel.UndoRedoData_RowProp();
		this.getRange3(start,0,stop,gc_nMaxCol0)._foreachRowNoEmpty(function(row){
			var oOldProps = row.getHeightProp();
			lastRowIndex = row.index;
			if (false === oOldProps.isEqual(oDefRowPr))
				History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RowProp, t.getId(), row._getUpdateRange(), new UndoRedoData_IndexSimpleProp(row.getIndex(), true, oOldProps, oDefRowPr));
			row.setStyle(null);

			if(!t.workbook.bRedoChanges) {
				if(collapsedInfo !== null && collapsedInfo < row.getOutlineLevel()) {
					collapsedInfo = null;
				}
				if(row.getCollapsed()) {
					collapsedInfo = row.getOutlineLevel();
					t.setCollapsedRow(false, null, row);
				}
			}

		}, function(cell){
			t._removeCell(null, null, cell);
		});

		//ms не удаляет collapsed с удаляемой строки, он наследует это свойство следующей
		if(collapsedInfo !== null && lastRowIndex === stop) {
			this._getRow(stop + 1, function(row) {
				//TODO проверить!!!
				//if(collapsedInfo >= row.getOutlineLevel()) {
					//row.setCollapsed(true);
					t.setCollapsedRow(true, null, row);
				//}
			});
		}

		this._updateFormulasParents(start, 0, gc_nMaxRow0, gc_nMaxCol0, oActualRange, offset, renameRes.shiftedShared);
		this.rowsData.deleteRange(start, (-nDif));
		this._forEachColData(function(sheetMemory) {
			sheetMemory.deleteRange(start, (-nDif));
		});
		//notifyChanged after move cells to get new locations(for intersect ranges)
		this.workbook.dependencyFormulas.notifyChanged(renameRes.changed);
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RemoveRows, this.getId(), new Asc.Range(0, start, gc_nMaxCol0, gc_nMaxRow0), new UndoRedoData_FromToRowCol(true, start, stop));

		this.autoFilters.redrawStylesTables(redrawTablesArr);

		this.workbook.dependencyFormulas.unlockRecal();

		return true;
	};
	Worksheet.prototype.insertRowsBefore=function(index, count){
		var oRange = this.getRange(new CellAddress(index, 0, 0), new CellAddress(index + count - 1, gc_nMaxCol0, 0));
		oRange.addCellsShiftBottom();
	};
	Worksheet.prototype._getBordersForInsert = function(bbox, bRow) {
		var t = this;
		var borders = {};
		var offsetRow = (bRow && bbox.r1 > 0) ? -1 : 0;
		var offsetCol = (!bRow && bbox.c1 > 0) ? -1 : 0;
		var r2 = bRow ? bbox.r1 : bbox.r2;
		var c2 = !bRow ? bbox.c1 : bbox.c2;
		if(0 !== offsetRow || 0 !== offsetCol){
			this.getRange3(bbox.r1, bbox.c1, r2, c2)._foreachNoEmpty(function(cell) {
				if (cell.xfs && cell.xfs.border) {
					t._getCellNoEmpty(cell.nRow + offsetRow, cell.nCol + offsetCol, function(neighbor) {
						if (neighbor && neighbor.xfs && neighbor.xfs.border) {
							var newBorder = neighbor.xfs.border.clone();
							newBorder.intersect(cell.xfs.border, g_oDefaultFormat.BorderAbs, true);
							borders[bRow ? cell.nCol : cell.nRow] = newBorder;
						}
					});
				}
			});
		}
		return borders;
	};
	Worksheet.prototype._insertRowsBefore=function(index, count){
		var t = this;
		this.workbook.dependencyFormulas.lockRecal();
		var oActualRange = new Asc.Range(0, index, gc_nMaxCol0, index + count - 1);
		History.Create_NewPoint();
		var offset = new AscCommon.CellBase(count, 0);
		//renameDependencyNodes before move cells to store current location in history
		var renameRes = this.renameDependencyNodes(offset, oActualRange);
		var redrawTablesArr = this.autoFilters.insertRows("insCell", oActualRange, c_oAscInsertOptions.InsertColumns);
		this.updatePivotOffset(oActualRange, offset);
		if (false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			this.updateSortStateOffset(oActualRange, offset);
			History.LocalChange = false;
		}

		this._updateFormulasParents(index, 0, gc_nMaxRow0, gc_nMaxCol0, oActualRange, offset, renameRes.shiftedShared);
		var borders;
		if (index > 0 && !this.workbook.bUndoChanges) {
			borders = this._getBordersForInsert(oActualRange, true);
		}
		//insert new row/cell
		this.rowsData.insertRange(index, count);
		this.nRowsCount = Math.max(this.nRowsCount, this.rowsData.getSize());
		this._forEachColData(function(sheetMemory) {
			sheetMemory.insertRange(index, count);
			t.cellsByColRowsCount = Math.max(t.cellsByColRowsCount, sheetMemory.getSize());
		});
		this.nRowsCount = Math.max(this.nRowsCount, this.cellsByColRowsCount);
		//copy property from row/cell above
		if (index > 0 && !this.workbook.bUndoChanges)
		{
			this.rowsData.copyRangeByChunk((index - 1), 1, index, count);
			this.nRowsCount = Math.max(this.nRowsCount, this.rowsData.getSize());
			this._forEachColData(function(sheetMemory) {
				sheetMemory.copyRangeByChunk((index - 1), 1, index, count);
				t.cellsByColRowsCount = Math.max(t.cellsByColRowsCount, sheetMemory.getSize());
			});
			this.nRowsCount = Math.max(this.nRowsCount, this.cellsByColRowsCount);
			//show rows and remain only cell xf property
			this.getRange3(index, 0, index + count - 1, gc_nMaxCol0)._foreachRowNoEmpty(function(row) {
				row.setHidden(false);
			},function(cell) {
				cell.clearDataKeepXf(borders[cell.nCol]);
			});
		}
		//notifyChanged after move cells to get new locations(for intersect ranges)
		this.workbook.dependencyFormulas.notifyChanged(renameRes.changed);
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_AddRows, this.getId(), new Asc.Range(0, index, gc_nMaxCol0, gc_nMaxRow0), new UndoRedoData_FromToRowCol(true, index, index + count - 1));

		this.autoFilters.redrawStylesTables(redrawTablesArr);

		this.workbook.dependencyFormulas.unlockRecal();
		return true;
	};
	Worksheet.prototype.insertRowsAfter=function(index, count){
		//index 0 based
		return this.insertRowsBefore(index + 1, count);
	};
	Worksheet.prototype.getColsCount=function(){
		var result = this.nColsCount;
		var pane = this.sheetViews.length && this.sheetViews[0].pane;
		if (pane && pane.topLeftFrozenCell)
			result = Math.max(result, pane.topLeftFrozenCell.getCol0());
		return result;
	};
	Worksheet.prototype.removeCols=function(start, stop){
		var oRange = this.getRange(new CellAddress(0, start, 0), new CellAddress(gc_nMaxRow0, stop, 0));
		oRange.deleteCellsShiftLeft();
	};
	Worksheet.prototype._removeCols=function(start, stop){
		var t = this;
		this.workbook.dependencyFormulas.lockRecal();
		History.Create_NewPoint();
		//start, stop 0 based
		var nDif = -(stop - start + 1), i, j, length;
		var oActualRange = new Asc.Range(start, 0, stop, gc_nMaxRow0);
		var offset = new AscCommon.CellBase(0, nDif);
		//renameDependencyNodes before move cells to store current location in history
		var renameRes = this.renameDependencyNodes(offset, oActualRange);
		var redrawTablesArr = this.autoFilters.insertColumn(oActualRange, nDif);
		this.updatePivotOffset(oActualRange, offset);
		if (false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			this.updateSortStateOffset(oActualRange, offset);
			History.LocalChange = false;
		}

		var collapsedInfo = null, lastRowIndex;
		var oDefColPr = new AscCommonExcel.UndoRedoData_ColProp();
		this.getRange3(0, start, gc_nMaxRow0,stop)._foreachColNoEmpty(function(col){
			var nIndex = col.getIndex();
			var oOldProps = col.getWidthProp();
			if(false === oOldProps.isEqual(oDefColPr))
				History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ColProp, t.getId(), new Asc.Range(nIndex, 0, nIndex, gc_nMaxRow0), new UndoRedoData_IndexSimpleProp(nIndex, false, oOldProps, oDefColPr));
			col.setStyle(null);

			lastRowIndex = col.index;
			if(!t.workbook.bRedoChanges) {
				if(collapsedInfo !== null && collapsedInfo < col.getOutlineLevel()) {
					collapsedInfo = null;
				}
				if(col.getCollapsed()) {
					collapsedInfo = col.getOutlineLevel();
					t.setCollapsedCol(false, null, col);
				}
			}
		}, function(cell){
			t._removeCell(null, null, cell);
		});

		if(collapsedInfo !== null && lastRowIndex === stop) {
			var curCol = this._getCol(stop + 1);
			//TODO проверить!!!
			if(curCol /*&& collapsedInfo >= curCol.getOutlineLevel()*/) {
				t.setCollapsedCol(true, null, curCol);
			}
		}

		this._updateFormulasParents(0, start, gc_nMaxRow0, gc_nMaxCol0, oActualRange, offset, renameRes.shiftedShared);
		this.cellsByCol.splice(start, stop - start + 1);
		this.aCols.splice(start, stop - start + 1);
		for(i = start, length = this.aCols.length; i < length; ++i)
		{
			var elem = this.aCols[i];
			if(null != elem)
				elem.moveHor(nDif);
		}
		//notifyChanged after move cells to get new locations(for intersect ranges)
		this.workbook.dependencyFormulas.notifyChanged(renameRes.changed);
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RemoveCols, this.getId(), new Asc.Range(start, 0, gc_nMaxCol0, gc_nMaxRow0), new UndoRedoData_FromToRowCol(false, start, stop));

		this.autoFilters.redrawStylesTables(redrawTablesArr);

		this.workbook.dependencyFormulas.unlockRecal();

		return true;
	};
	Worksheet.prototype.insertColsBefore=function(index, count){
		var oRange = this.getRange3(0, index, gc_nMaxRow0, index + count - 1);
		oRange.addCellsShiftRight();
	};
	Worksheet.prototype._insertColsBefore=function(index, count){
		this.workbook.dependencyFormulas.lockRecal();
		var oActualRange = new Asc.Range(index, 0, index + count - 1, gc_nMaxRow0);
		History.Create_NewPoint();
		var offset = new AscCommon.CellBase(0, count);
		//renameDependencyNodes before move cells to store current location in history
		var renameRes = this.renameDependencyNodes(offset, oActualRange);
		var redrawTablesArr = this.autoFilters.insertColumn(oActualRange, count);
		this.updatePivotOffset(oActualRange, offset);
		if (false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			this.updateSortStateOffset(oActualRange, offset);
			History.LocalChange = false;
		}

		this._updateFormulasParents(0, index, gc_nMaxRow0, gc_nMaxCol0, oActualRange, offset, renameRes.shiftedShared);
		var borders;
		if (index > 0 && !this.workbook.bUndoChanges) {
			borders = this._getBordersForInsert(oActualRange, false);
		}
		//remove tail
		this.cellsByCol.splice(gc_nMaxCol0 - count + 1, count);
		for(var i = this.cellsByCol.length - 1; i >= index; --i) {
			this.cellsByCol[i + count] = this.cellsByCol[i];
			this.cellsByCol[i] = undefined;
		}
		this.nColsCount = Math.max(this.nColsCount, this.getColDataLength());
		this.aCols.splice(gc_nMaxCol0 - count + 1, count);
		for(var i = this.aCols.length - 1; i >= index; --i) {
			this.aCols[i + count] = this.aCols[i];
			this.aCols[i] = undefined;
			if (this.aCols[i + count]) {
				this.aCols[i + count].moveHor(count);
			}
		}
		this.nColsCount = Math.max(this.nColsCount, this.aCols.length);
		if (!this.workbook.bUndoChanges) {
			//copy property from col/cell above
			var oPrevCol = null;
			if (index > 0)
				oPrevCol = this.aCols[index - 1];
			if (null == oPrevCol && null != this.oAllCol)
				oPrevCol = this.oAllCol;
			if (null != oPrevCol) {
				History.LocalChange = true;
				for (var i = index; i < index + count; ++i) {
					var oNewCol =  oPrevCol.clone();
					oNewCol.setHidden(null);
					oNewCol.BestFit = null;
					oNewCol.index = i;
					this.aCols[i] = oNewCol;
				}
				History.LocalChange = false;
			}
			var prevCellsByCol = index > 0 ? this.cellsByCol[index - 1] : null;
			if (prevCellsByCol) {
				for(var i = index; i < index + count; ++i) {
					this.cellsByCol[i] = prevCellsByCol.clone();
				}
				this.nColsCount = Math.max(this.nColsCount, this.getColDataLength());
				//show rows and remain only cell xf property
				this.getRange3(0, index, gc_nMaxRow0, index + count - 1)._foreachNoEmpty(function(cell) {
					cell.clearDataKeepXf(borders[cell.nRow]);
				});
			}
		}

		//notifyChanged after move cells to get new locations(for intersect ranges)
		this.workbook.dependencyFormulas.notifyChanged(renameRes.changed);
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_AddCols, this.getId(), new Asc.Range(index, 0, gc_nMaxCol0, gc_nMaxRow0), new UndoRedoData_FromToRowCol(false, index, index + count - 1));

		this.autoFilters.redrawStylesTables(redrawTablesArr);

		this.workbook.dependencyFormulas.unlockRecal();
		return true;
	};
	Worksheet.prototype.insertColsAfter=function(index, count){
		//index 0 based
		return this.insertColsBefore(index + 1, count);
	};
	Worksheet.prototype.getDefaultWidth=function(){
		return this.oSheetFormatPr.dDefaultColWidth;
	};
	Worksheet.prototype.getDefaultFontName=function(){
		return this.workbook.getDefaultFont();
	};
	Worksheet.prototype.getDefaultFontSize=function(){
		return this.workbook.getDefaultSize();
	};
	Worksheet.prototype.getBaseColWidth = function () {
		return this.oSheetFormatPr.nBaseColWidth || 8; // Число символов для дефалтовой ширины (по умолчинию 8)
	};
	Worksheet.prototype.charCountToModelColWidth = function (count) {
		return this.workbook.charCountToModelColWidth(count);
	};
	Worksheet.prototype.modelColWidthToColWidth = function (mcw) {
		return this.workbook.modelColWidthToColWidth(mcw);
	};
	Worksheet.prototype.colWidthToCharCount = function (w) {
		return this.workbook.colWidthToCharCount(w);
	};
	Worksheet.prototype.getColWidth=function(index){
		//index 0 based
		//Результат в пунктах
		var col = this._getColNoEmptyWithAll(index);
		if(null != col && null != col.width)
			return col.width;
		var dResult = this.oSheetFormatPr.dDefaultColWidth;
		if(dResult === undefined || dResult === null || dResult == 0)
		//dResult = (8) + 5;//(EMCA-376.page 1857.)defaultColWidth = baseColumnWidth + {margin padding (2 pixels on each side, totalling 4 pixels)} + {gridline (1pixel)}
			dResult = -1; // calc default width at presentation level
		return dResult;
	};
	Worksheet.prototype.setColWidth=function(width, start, stop){
		width = this.charCountToModelColWidth(width);
		if(0 == width)
			return this.setColHidden(true, start, stop);

		//start, stop 0 based
		if(null == start)
			return;
		if(null == stop)
			stop = start;
		History.Create_NewPoint();
		var oSelection = History.GetSelection();
		if(null != oSelection)
		{
			oSelection = oSelection.clone();
			oSelection.assign(start, 0, stop, gc_nMaxRow0);
			History.SetSelection(oSelection);
			History.SetSelectionRedo(oSelection);
		}

		var bNotAddCollapsed = true == this.workbook.bUndoChanges || true == this.workbook.bRedoChanges || this.bExcludeCollapsed;
		var _summaryRight = this.sheetPr ? this.sheetPr.SummaryRight : true;
		var oThis = this, prevCol;
		var fProcessCol = function(col){
			if(col.width != width)
			{
				if(_summaryRight && !bNotAddCollapsed && col.getCollapsed()) {
					oThis.setCollapsedCol(false, null, col);
				} else if(!_summaryRight && !bNotAddCollapsed && prevCol && prevCol.getCollapsed()) {
					oThis.setCollapsedCol(false, null, prevCol);
				}
				prevCol = col;

				var oOldProps = col.getWidthProp();
				col.width = width;
				col.CustomWidth = true;
				col.BestFit = null;
				col.setHidden(null);
				oThis.initColumn(col);
				var oNewProps = col.getWidthProp();
				if(false == oOldProps.isEqual(oNewProps))
					History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ColProp, oThis.getId(),
								col._getUpdateRange(),
								new UndoRedoData_IndexSimpleProp(col.index, false, oOldProps, oNewProps));
			}
		};
		if(0 == start && gc_nMaxCol0 == stop)
		{
			var col = this.getAllCol();
			fProcessCol(col);
			for(var i in this.aCols){
				var col = this.aCols[i];
				if (null != col)
					fProcessCol(col);
			}
		}
		else
		{
			if(!_summaryRight) {
				if(!bNotAddCollapsed && start > 0) {
					prevCol = this._getCol(start - 1);
				}
			}

			for(var i = start; i <= stop; i++){
				var col = this._getCol(i);
				fProcessCol(col);
			}

			if(_summaryRight && !bNotAddCollapsed && prevCol) {
				col = this._getCol(stop + 1);
				if(col.getCollapsed()) {
					this.setCollapsedCol(false, null, col);
				}
			}
		}
	};
	Worksheet.prototype.getColHidden=function(index){
		var col = this._getColNoEmptyWithAll(index);
		return col ? col.getHidden() : false;
	};
	Worksheet.prototype.setColHidden=function(bHidden, start, stop){
		//start, stop 0 based
		if(null == start)
			return;
		if(null == stop)
			stop = start;
		History.Create_NewPoint();
		var oThis = this, outlineLevel;
		var bNotAddCollapsed = true == this.workbook.bUndoChanges || true == this.workbook.bRedoChanges || this.bExcludeCollapsed;
		var _summaryRight = this.sheetPr ? this.sheetPr.SummaryRight : true;
		var fProcessCol = function(col){

			if(col && !bNotAddCollapsed && outlineLevel !== undefined && outlineLevel !== col.getOutlineLevel()) {
				if(!_summaryRight) {
					oThis.setCollapsedCol(bHidden, col.index - 1);
				} else {
					oThis.setCollapsedCol(bHidden, null, col);
				}
			}
			outlineLevel = col ? col.getOutlineLevel() : null;

			if(col.getHidden() != bHidden)
			{
				var oOldProps = col.getWidthProp();
				if(bHidden)
				{
					col.setHidden(bHidden);
					if(null == col.width || true != col.CustomWidth)
						col.width = 0;
					col.CustomWidth = true;
					col.BestFit = null;
				}
				else
				{
					col.setHidden(null);
					if(0 >= col.width)
						col.width = null;
				}
				var oNewProps = col.getWidthProp();
				if(false == oOldProps.isEqual(oNewProps))
					History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ColProp, oThis.getId(),
								col._getUpdateRange(),
								new UndoRedoData_IndexSimpleProp(col.index, false, oOldProps, oNewProps));
			}
		};

		if(!bNotAddCollapsed && !_summaryRight && start > 0) {
			col = this._getCol(start - 1);
			outlineLevel = col.getOutlineLevel();
		}

		if(0 != start && gc_nMaxCol0 == stop)
		{
			var col = null;
			if(false == bHidden)
				col = this.oAllCol;
			else
				col = this.getAllCol();
			if(null != col)
				fProcessCol(col);
			for(var i in this.aCols){
				var col = this.aCols[i];
				if (null != col)
					fProcessCol(col);
			}
		}
		else
		{
			for(var i = start; i <= stop; i++){
				var col = null;
				if(false == bHidden)
					col = this._getColNoEmpty(i);
				else
					col = this._getCol(i);
				if(null != col)
					fProcessCol(col);
			}
		}

		if(!bNotAddCollapsed && outlineLevel && _summaryRight) {
			col = this._getCol(stop + 1);
			if(col && outlineLevel !== col.getOutlineLevel()) {
				oThis.setCollapsedCol(bHidden, null, col);
			}
		}
	};
	//TODO если collapsed не будет выставляться и заносится, удалить
	Worksheet.prototype.setCollapsedCol = function (bCollapse, colIndex, curCol) {
		var oThis = this;
		var fProcessCol = function(col){
			var oOldProps = col.getCollapsed();
			col.setCollapsed(bCollapse);
			var oNewProps = col.getCollapsed();

			if(oOldProps !== oNewProps) {
				History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_CollapsedCol, oThis.getId(), col._getUpdateRange(), new UndoRedoData_IndexSimpleProp(col.index, true, oOldProps, oNewProps));
			}
		};

		if(curCol) {
			fProcessCol(curCol);
		} else {
			this.getRange3(0, colIndex,0, colIndex)._foreachCol(fProcessCol);
		}
	};
	Worksheet.prototype.setSummaryRight = function (val) {
		if (!this.sheetPr){
			this.sheetPr = new AscCommonExcel.asc_CSheetPr();
		}

		History.Create_NewPoint();
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_SetSummaryRight, this.getId(), null,
			new UndoRedoData_FromTo(this.sheetPr.SummaryRight, val));

		this.sheetPr.SummaryRight = val;
	};
	Worksheet.prototype.setSummaryBelow = function (val) {
		if (!this.sheetPr){
			this.sheetPr = new AscCommonExcel.asc_CSheetPr();
		}

		History.Create_NewPoint();
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_SetSummaryBelow, this.getId(), null,
			new UndoRedoData_FromTo(this.sheetPr.SummaryBelow, val));

		this.sheetPr.SummaryBelow = val;
	};
	Worksheet.prototype.setFitToPage = function (val) {
		if((this.sheetPr && val !== this.sheetPr.FitToPage) || (!this.sheetPr && val)) {
			if (!this.sheetPr){
				this.sheetPr = new AscCommonExcel.asc_CSheetPr();
			}

			History.Create_NewPoint();
			History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_SetFitToPage, this.getId(), null,
				new UndoRedoData_FromTo(this.sheetPr.FitToPage, val));

			this.sheetPr.FitToPage = val;
		}
	};
	Worksheet.prototype.setGroupCol = function (bDel, start, stop) {
		var oThis = this;
		var fProcessCol = function(col){
			col.setOutlineLevel(null, bDel);
		};

		this.getRange3(0, start, 0, stop)._foreachCol(fProcessCol);
	};
	Worksheet.prototype.setOutlineCol = function (val, start, stop) {
		var oThis = this;

		var fProcessCol = function(col){
			col.setOutlineLevel(val);
		};

		this.getRange3(0, start, 0, stop)._foreachCol(fProcessCol);
	};
	Worksheet.prototype.getColCustomWidth = function (index) {
		var isBestFit;
		var column = this._getColNoEmptyWithAll(index);
		if (!column) {
			isBestFit = true;
		} else if (column.getHidden()) {
			isBestFit = false;
		} else {
			isBestFit = !!(column.BestFit || (null === column.BestFit && null === column.CustomWidth));
		}
		return !isBestFit;
	};
	Worksheet.prototype.setColBestFit=function(bBestFit, width, start, stop){
		//start, stop 0 based
		if(null == start)
			return;
		if(null == stop)
			stop = start;
		History.Create_NewPoint();
		var oThis = this;
		var fProcessCol = function(col){
			var oOldProps = col.getWidthProp();
			if(bBestFit)
			{
				col.BestFit = bBestFit;
				col.setHidden(null);
			}
			else
				col.BestFit = null;
			col.width = width;
			oThis.initColumn(col);
			var oNewProps = col.getWidthProp();
			if(false == oOldProps.isEqual(oNewProps))
				History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ColProp, oThis.getId(),
							col._getUpdateRange(),
							new UndoRedoData_IndexSimpleProp(col.index, false, oOldProps, oNewProps));
		};
		if(0 != start && gc_nMaxCol0 == stop)
		{
			var col = null;
			if(bBestFit && oDefaultMetrics.ColWidthChars == width)
				col = this.oAllCol;
			else
				col = this.getAllCol();
			if(null != col)
				fProcessCol(col);
			for(var i in this.aCols){
				var col = this.aCols[i];
				if (null != col)
					fProcessCol(col);
			}
		}
		else
		{
			for(var i = start; i <= stop; i++){
				var col = null;
				if(bBestFit && oDefaultMetrics.ColWidthChars == width)
					col = this._getColNoEmpty(i);
				else
					col = this._getCol(i);
				if(null != col)
					fProcessCol(col);
			}
		}
	};
	Worksheet.prototype.isDefaultHeightHidden=function(){
		return null != this.oSheetFormatPr.oAllRow && this.oSheetFormatPr.oAllRow.getHidden();
	};
	Worksheet.prototype.isDefaultWidthHidden=function(){
		return null != this.oAllCol && this.oAllCol.getHidden();
	};
	Worksheet.prototype.setDefaultHeight = function (h){
		// ToDo refactoring this
		if (this.oSheetFormatPr.oAllRow && !this.oSheetFormatPr.oAllRow.getCustomHeight()) {
			this.oSheetFormatPr.oAllRow.h = h;
		}
	};
	Worksheet.prototype.getDefaultHeight=function(){
		// ToDo http://bugzilla.onlyoffice.com/show_bug.cgi?id=19666 (флага CustomHeight нет)
		var dRes = null;
		// Нужно возвращать выставленную, только если флаг CustomHeight = true
		if(null != this.oSheetFormatPr.oAllRow && this.oSheetFormatPr.oAllRow.getCustomHeight())
			dRes = this.oSheetFormatPr.oAllRow.h;
		return dRes;
	};
	Worksheet.prototype.getRowHeight = function(index) {
		var res;
		this._getRowNoEmptyWithAll(index, function(row){
			res = row ? row.getHeight() : -1;
		});
		return res;
	};
	Worksheet.prototype.setRowHeight=function(height, start, stop, isCustom){
		if(0 == height)
			return this.setRowHidden(true, start, stop);
		//start, stop 0 based
		if(null == start)
			return;
		if(null == stop)
			stop = start;
		History.Create_NewPoint();
		var oThis = this, i;
		var oSelection = History.GetSelection();
		if(null != oSelection)
		{
			oSelection = oSelection.clone();
			oSelection.assign(0, start, gc_nMaxCol0, stop);
			History.SetSelection(oSelection);
			History.SetSelectionRedo(oSelection);
		}
		var prevRow;
		var bNotAddCollapsed = true == this.workbook.bUndoChanges || true == this.workbook.bRedoChanges || this.bExcludeCollapsed;
		var _summaryBelow = this.sheetPr ? this.sheetPr.SummaryBelow : true;
		var fProcessRow = function(row){
			if(row)
			{
				if(_summaryBelow && !bNotAddCollapsed && row.getCollapsed()) {
					oThis.setCollapsedRow(false, null, row);
				} else if(!_summaryBelow && !bNotAddCollapsed && prevRow && prevRow.getCollapsed()) {
					oThis.setCollapsedRow(false, null, prevRow);
				}
				prevRow = row;

				var oOldProps = row.getHeightProp();
				row.setHeight(height);
				if (isCustom) {
					row.setCustomHeight(true);
				}
				row.setCalcHeight(true);
				row.setHidden(false);
				var oNewProps = row.getHeightProp();
				if(false === oOldProps.isEqual(oNewProps))
					History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RowProp, oThis.getId(), row._getUpdateRange(), new UndoRedoData_IndexSimpleProp(row.index, true, oOldProps, oNewProps));
			}
		};
		if(0 == start && gc_nMaxRow0 == stop)
		{
			fProcessRow(this.getAllRow());
			this._forEachRow(fProcessRow);
		}
		else
		{
			if(!_summaryBelow) {
				if(!bNotAddCollapsed && start > 0) {
					this._getRow(start - 1, function(row) {
						prevRow = row;
					});
				}
			}

			this.getRange3(start,0,stop, 0)._foreachRow(fProcessRow);

			if(_summaryBelow) {
				if(!bNotAddCollapsed && prevRow) {
					this._getRow(stop + 1, function(row) {
						if(row.getCollapsed()) {
							oThis.setCollapsedRow(false, null, row);
						}
					});
				}
			}
		}
		if(this.needRecalFormulas(start, stop)) {
			this.workbook.dependencyFormulas.calcTree();
		}
	};
	Worksheet.prototype.getRowHidden=function(index){
		var res;
		this._getRowNoEmptyWithAll(index, function(row){
			res = row ? row.getHidden() : false;
		});
		return res;
	};
	Worksheet.prototype.setRowHidden=function(bHidden, start, stop){
		//start, stop 0 based
		if(null == start)
			return;
		if(null == stop)
			stop = start;
		History.Create_NewPoint();
		var oThis = this, i;
		var startIndex = null, endIndex = null, updateRange, outlineLevel;
		var bNotAddCollapsed = true == this.workbook.bUndoChanges || true == this.workbook.bRedoChanges || this.bExcludeCollapsed;
		var _summaryBelow = this.sheetPr ? this.sheetPr.SummaryBelow : true;
		var fProcessRow = function(row){
			if(row && !bNotAddCollapsed && outlineLevel !== undefined && outlineLevel !== row.getOutlineLevel()) {
				if(!_summaryBelow) {
					oThis.setCollapsedRow(bHidden, row.index - 1);
				} else {
					oThis.setCollapsedRow(bHidden, null, row);
				}
			}
			outlineLevel = row ? row.getOutlineLevel() : null;

			if(row && bHidden != row.getHidden())
			{
				row.setHidden(bHidden);

				if(row.index === endIndex + 1 && startIndex !== null)
					endIndex++;
				else
				{
					if(startIndex !== null)
					{
						updateRange = new Asc.Range(0, startIndex, gc_nMaxCol0, endIndex);
						History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RowHide, oThis.getId(), updateRange, new UndoRedoData_FromToRowCol(bHidden, startIndex, endIndex));
					}

					startIndex = row.index;
					endIndex = row.index;
				}
			}
		};
		if(0 == start && gc_nMaxRow0 == stop)
		{
			// ToDo реализовать скрытие всех строк!
		}
		else
		{
			if(!_summaryBelow && start > 0 && !bNotAddCollapsed) {
				this._getRow(start - 1, function(row) {
					if(row) {
						outlineLevel = row.getOutlineLevel();
					}
				});
			}

			for (i = start; i <= stop; ++i) {
				false == bHidden ? this._getRowNoEmpty(i, fProcessRow) : this._getRow(i, fProcessRow);
			}

			if(_summaryBelow && outlineLevel && !bNotAddCollapsed) {
				this._getRow(stop + 1, function(row) {
					if(row && outlineLevel !== row.getOutlineLevel()) {
						oThis.setCollapsedRow(bHidden, null, row);
					}
				});
			}

			if(startIndex !== null)//заносим последние строки
			{
				updateRange = new Asc.Range(0, startIndex, gc_nMaxCol0, endIndex);
				History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RowHide, oThis.getId(),updateRange, new UndoRedoData_FromToRowCol(bHidden, startIndex, endIndex));
			}
		}
		if(this.needRecalFormulas(start, stop)) {
			this.workbook.dependencyFormulas.calcTree();
		}
	};
	//TODO
	Worksheet.prototype.setCollapsedRow = function (bCollapse, rowIndex, curRow) {
		var oThis = this;
		var fProcessRow = function(row, bSave){
			var oOldProps = row.getCollapsed();
			row.setCollapsed(bCollapse);
			var oNewProps = row.getCollapsed();

			if(oOldProps !== oNewProps) {
				History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_CollapsedRow, oThis.getId(), row._getUpdateRange(), new UndoRedoData_IndexSimpleProp(row.index, true, oOldProps, oNewProps));
			}
			if(bSave) {
				row.saveContent(true);
			}
		};

		if(curRow) {
			fProcessRow(curRow, true);
		} else {
			this.getRange3(rowIndex,0,rowIndex, 0)._foreachRow(fProcessRow);
		}
	};
	Worksheet.prototype.setGroupRow = function (bDel, start, stop) {
		var oThis = this;
		var fProcessRow = function(row){
			row.setOutlineLevel(null, bDel);
		};

		this.getRange3(start,0,stop, 0)._foreachRow(fProcessRow);
	};
	Worksheet.prototype.setOutlineRow = function (val, start, stop) {
		var oThis = this;
		var fProcessRow = function(row){
			row.setOutlineLevel(val);
		};

		this.getRange3(start,0,stop, 0)._foreachRow(fProcessRow);
	};
	Worksheet.prototype.getRowCustomHeight = function (index) {
		var isCustomHeight = false;
		this._getRowNoEmptyWithAll(index, function (row) {
			if (!row) {
				isCustomHeight = false;
			} else if (row.getHidden()) {
				isCustomHeight = true;
			} else {
				isCustomHeight = row.getCustomHeight();
			}
		});
		return isCustomHeight;
	};
	Worksheet.prototype.setRowBestFit=function(bBestFit, height, start, stop){
		//start, stop 0 based
		if(null == start)
			return;
		if(null == stop)
			stop = start;
		History.Create_NewPoint();
		var oThis = this, i;
		var isDefaultProp = (true == bBestFit && oDefaultMetrics.RowHeight == height);
		var fProcessRow = function(row){
			if(row)
			{
				var oOldProps = row.getHeightProp();
				row.setCustomHeight(!bBestFit);
				row.setCalcHeight(true);
				row.setHeight(height);
				var oNewProps = row.getHeightProp();
				if(false == oOldProps.isEqual(oNewProps))
					History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RowProp, oThis.getId(), row._getUpdateRange(), new UndoRedoData_IndexSimpleProp(row.index, true, oOldProps, oNewProps));
			}
		};
		if(0 == start && gc_nMaxRow0 == stop) {
			fProcessRow(isDefaultProp ? this.oSheetFormatPr.oAllRow : this.getAllRow());
			this._forEachRow(fProcessRow);
		} else {
			var range = this.getRange3(start,0,stop, 0);
			if (isDefaultProp) {
				range._foreachRowNoEmpty(fProcessRow);
			} else {
				range._foreachRow(fProcessRow);
			}
		}
		this.workbook.dependencyFormulas.calcTree();
	};
	Worksheet.prototype.getCell=function(oCellAdd){
		return this.getRange(oCellAdd, oCellAdd);
	};
	Worksheet.prototype.getCell2=function(sCellAdd){
		if( sCellAdd.indexOf("$") > -1)
			sCellAdd = sCellAdd.replace(/\$/g,"");
		return this.getRange2(sCellAdd);
	};
	Worksheet.prototype.getCell3=function(r1, c1){
		return this.getRange3(r1, c1, r1, c1);
	};
	Worksheet.prototype.getRange=function(cellAdd1, cellAdd2){
		//Если range находится за границами ячеек расширяем их
		var nRow1 = cellAdd1.getRow0();
		var nCol1 = cellAdd1.getCol0();
		var nRow2 = cellAdd2.getRow0();
		var nCol2 = cellAdd2.getCol0();
		return this.getRange3(nRow1, nCol1, nRow2, nCol2);
	};
	Worksheet.prototype.getRange2=function(sRange){
		var bbox = AscCommonExcel.g_oRangeCache.getAscRange(sRange);
		if(null != bbox)
			return Range.prototype.createFromBBox(this, bbox);
		return null;
	};
	Worksheet.prototype.getRange3=function(r1, c1, r2, c2){
		var nRowMin = r1;
		var nRowMax = r2;
		var nColMin = c1;
		var nColMax = c2;
		if(r1 > r2){
			nRowMax = r1;
			nRowMin = r2;
		}
		if(c1 > c2){
			nColMax = c1;
			nColMin = c2;
		}
		return new Range(this, nRowMin, nColMin, nRowMax, nColMax);
	};
	Worksheet.prototype.getRange4=function(r, c){
		return new Range(this, r, c, r, c);
	};
	Worksheet.prototype.getRowIterator=function(r1, c1, c2, callback){
		var it = new RowIterator();
		it.init(this, r1, c1, c2);
		callback(it);
		it.release();
	};
	Worksheet.prototype._removeCell=function(nRow, nCol, cell){
		var t = this;
		var processCell = function(cell) {
			if(null != cell)
			{
				var sheetId = t.getId();
				if (false == cell.isEmpty()) {
					var oUndoRedoData_CellData = new AscCommonExcel.UndoRedoData_CellData(cell.getValueData(), null);
					if (null != cell.xfs)
						oUndoRedoData_CellData.style = cell.xfs.clone();
					cell.setFormulaInternal(null);
					History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RemoveCell, sheetId, new Asc.Range(nCol, nRow, nCol, nRow), new UndoRedoData_CellSimpleData(nRow, nCol, oUndoRedoData_CellData, null));
				}
				t.workbook.dependencyFormulas.addToChangedCell(cell);

				cell.clearData();
				cell.saveContent(true);
			}
		};
		if(null != cell)
		{
			nRow = cell.nRow;
			nCol = cell.nCol;
			processCell(cell);
		} else {
			this._getCellNoEmpty(nRow, nCol, processCell);
		}
	};
	Worksheet.prototype._getCell=function(row, col, fAction){
		var wb = this.workbook;
		var targetCell = null;
		for (var k = 0; k < wb.loadCells.length; ++k) {
			var elem = wb.loadCells[k];
			if (elem.nRow == row && elem.nCol == col && this === elem.ws) {
				targetCell = elem;
				break;
			}
		}
		if(null === targetCell){
			var cell = new Cell(this);
			wb.loadCells.push(cell);
			if (!cell.loadContent(row, col)) {
				this._initCell(cell, row, col);
			}
			fAction(cell);
			cell.saveContent(true);
			wb.loadCells.pop();
		} else {
			fAction(targetCell);
		}
	};
	Worksheet.prototype._initRow=function(row, index){
		var t = this;
		row.setChanged(true);
		if (null != this.oSheetFormatPr.oAllRow) {
			row.copyFrom(this.oSheetFormatPr.oAllRow);
			row.setIndex(index);
		}
		this.nRowsCount = index >= this.nRowsCount ? index + 1 : this.nRowsCount;
	};
	Worksheet.prototype._initCell=function(cell, nRow, nCol){
		var t = this;
		cell.setChanged(true);
		this._getRowNoEmpty(nRow, function(row) {
			var oCol = t._getColNoEmptyWithAll(nCol);
			var xfs = null;
			if (row && null != row.xfs)
				xfs = row.xfs.clone();
			else if (null != oCol && null != oCol.xfs)
				xfs = oCol.xfs.clone();
			cell.setStyleInternal(xfs);
			t.cellsByColRowsCount = Math.max(t.cellsByColRowsCount, nRow + 1);
			t.nRowsCount = Math.max(t.nRowsCount, t.cellsByColRowsCount);
			if (nCol >= t.nColsCount)
				t.nColsCount = nCol + 1;
		});
		//init ColData otherwise all 'foreach' will not return this cell until saveContent(loadCells)
		var sheetMemory = this.getColData(nCol);
		sheetMemory.checkSize(nRow);
	};
	Worksheet.prototype._getCellNoEmpty=function(row, col, fAction){
		var wb = this.workbook;
		var targetCell = null;
		for (var k = 0; k < wb.loadCells.length; ++k) {
			var elem = wb.loadCells[k];
			if (elem.nRow == row && elem.nCol == col && this === elem.ws) {
				targetCell = elem;
				break;
			}
		}
		if (null === targetCell) {
			var cell = new Cell(this);
			var res = cell.loadContent(row, col) ? cell : null;
			if (res && fAction) {
				wb.loadCells.push(cell);
			}
			fAction(res);
			cell.saveContent(true);
			if (res) {
				wb.loadCells.pop();
			}
		} else {
			fAction(targetCell);
		}
	};
	Worksheet.prototype._getRowNoEmpty=function(nRow, fAction){
		//0-based
		var row = new AscCommonExcel.Row(this);
		if(row.loadContent(nRow)){
			fAction(row);
			row.saveContent(true);
		} else {
			fAction(null);
		}
	};
	Worksheet.prototype._getRowNoEmptyWithAll=function(nRow, fAction){
		var t = this;
		this._getRowNoEmpty(nRow, function(row){
			if(!row)
				row = t.oSheetFormatPr.oAllRow;
			fAction(row);
		});

	};
	Worksheet.prototype._getColNoEmpty = function (col) {
		//0-based
		return this.aCols[col] || null;
	};
	Worksheet.prototype._getColNoEmptyWithAll = function (col) {
		return this._getColNoEmpty(col) || this.oAllCol;
	};
	Worksheet.prototype._getRow = function(index, fAction) {
		//0-based
		var row = null;
		if (g_nAllRowIndex == index)
			row = this.getAllRow();
		else {
			row = new AscCommonExcel.Row(this);
			if (!row.loadContent(index)) {
				this._initRow(row, index);
			}
		}
		fAction(row);
		row.saveContent(true);
	};
	Worksheet.prototype._getCol=function(index){
		//0-based
		var oCurCol;
		if (g_nAllColIndex == index)
			oCurCol = this.getAllCol();
		else
		{
			oCurCol = this.aCols[index];
			if(null == oCurCol)
			{
				if(null != this.oAllCol)
				{
					oCurCol = this.oAllCol.clone();
					oCurCol.index = index;
				}
				else
					oCurCol = new AscCommonExcel.Col(this, index);
				this.aCols[index] = oCurCol;
				this.nColsCount = index >= this.nColsCount ? index + 1 : this.nColsCount;
			}
		}
		return oCurCol;
	};
	Worksheet.prototype._prepareMoveRangeGetCleanRanges=function(oBBoxFrom, oBBoxTo, wsTo){
		var intersection = oBBoxFrom.intersectionSimple(oBBoxTo);
		var aRangesToCheck = [];
		if(null != intersection && this === wsTo)
		{
			var oThis = this;
			var fAddToRangesToCheck = function(aRangesToCheck, r1, c1, r2, c2)
			{
				if(r1 <= r2 && c1 <= c2)
					aRangesToCheck.push(oThis.getRange3(r1, c1, r2, c2));
			};
			if(intersection.r1 == oBBoxTo.r1 && intersection.c1 == oBBoxTo.c1)
			{
				fAddToRangesToCheck(aRangesToCheck, oBBoxTo.r1, intersection.c2 + 1, intersection.r2, oBBoxTo.c2);
				fAddToRangesToCheck(aRangesToCheck, intersection.r2 + 1, oBBoxTo.c1, oBBoxTo.r2, oBBoxTo.c2);
			}
			else if(intersection.r2 == oBBoxTo.r2 && intersection.c1 == oBBoxTo.c1)
			{
				fAddToRangesToCheck(aRangesToCheck, oBBoxTo.r1, oBBoxTo.c1, intersection.r1 - 1, oBBoxTo.c2);
				fAddToRangesToCheck(aRangesToCheck, intersection.r1, intersection.c2 + 1, oBBoxTo.r2, oBBoxTo.c2);
			}
			else if(intersection.r1 == oBBoxTo.r1 && intersection.c2 == oBBoxTo.c2)
			{
				fAddToRangesToCheck(aRangesToCheck, oBBoxTo.r1, oBBoxTo.c1, intersection.r2, intersection.c1 - 1);
				fAddToRangesToCheck(aRangesToCheck, intersection.r2 + 1, oBBoxTo.c1, oBBoxTo.r2, oBBoxTo.c2);
			}
			else if(intersection.r2 == oBBoxTo.r2 && intersection.c2 == oBBoxTo.c2)
			{
				fAddToRangesToCheck(aRangesToCheck, oBBoxTo.r1, oBBoxTo.c1, intersection.r1 - 1, oBBoxTo.c2);
				fAddToRangesToCheck(aRangesToCheck, intersection.r1, oBBoxTo.c1, oBBoxTo.r2, intersection.c1 - 1);
			}
		}
		else
			aRangesToCheck.push(wsTo.getRange3(oBBoxTo.r1, oBBoxTo.c1, oBBoxTo.r2, oBBoxTo.c2));
		return aRangesToCheck;
	};
	Worksheet.prototype._prepareMoveRange=function(oBBoxFrom, oBBoxTo, wsTo){
		var res = 0;
		if (!wsTo) {
			wsTo = this;
		}
		if (oBBoxFrom.isEqual(oBBoxTo) && this === wsTo)
			return res;
		var range = wsTo.getRange3(oBBoxTo.r1, oBBoxTo.c1, oBBoxTo.r2, oBBoxTo.c2);
		var aMerged = wsTo.mergeManager.get(range.getBBox0());
		if(aMerged.outer.length > 0)
			return -2;
		var aRangesToCheck = this._prepareMoveRangeGetCleanRanges(oBBoxFrom, oBBoxTo, wsTo);
		for(var i = 0, length = aRangesToCheck.length; i < length; i++)
		{
			range = aRangesToCheck[i];
			range._foreachNoEmpty(
				function(cell){
					if(!cell.isNullTextString())
					{
						res = -1;
						return res;
					}
				});
			if(0 != res)
				return res;
		}
		return res;
	};
	Worksheet.prototype._moveMergedAndHyperlinksPrepare = function(oBBoxFrom, oBBoxTo, copyRange, wsTo, offset) {
		var res = {merged: [], hyperlinks: []};
		if (!(false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges))) {
			return res;
		}
		var i, elem, bbox, data, wsFrom = this;
		var intersection = oBBoxFrom.intersectionSimple(oBBoxTo);
		History.LocalChange = true;
		//merged
		var merged = wsFrom.mergeManager.get(oBBoxFrom).inner;
		var mergedToRemove;
		if (!copyRange) {
			mergedToRemove = merged;
		} else if (null !== intersection) {
			mergedToRemove = wsFrom.mergeManager.get(intersection).all;
		}
		if(mergedToRemove){
			for (i = 0; i < mergedToRemove.length; i++) {
				wsFrom.mergeManager.removeElement(mergedToRemove[i]);
			}
		}

		//hyperlinks
		var hyperlinks = wsFrom.hyperlinkManager.get(oBBoxFrom).inner;
		if (!copyRange) {
			for (i = 0; i < hyperlinks.length; i++) {
				wsFrom.hyperlinkManager.removeElement(hyperlinks[i]);
			}
		}
		History.LocalChange = false;
		res.merged = merged;
		res.hyperlinks = hyperlinks;
		return res;
	};
	Worksheet.prototype._moveMergedAndHyperlinks = function(prepared, oBBoxFrom, oBBoxTo, copyRange, wsTo, offset) {
		var i, elem, bbox, data;
		var intersection = oBBoxFrom.intersectionSimple(oBBoxTo);
		History.LocalChange = true;
		for (i = 0; i < prepared.merged.length; i++) {
			elem = prepared.merged[i];
			bbox = copyRange ? elem.bbox.clone() : elem.bbox;
			bbox.setOffset(offset);
			wsTo.mergeManager.add(bbox, elem.data);
		}
		//todo сделать для пересечения
		if (!copyRange || null === intersection) {
			for (i = 0; i < prepared.hyperlinks.length; i++) {
				elem = prepared.hyperlinks[i];
				if (copyRange) {
					bbox = elem.bbox.clone();
					data = elem.data.clone();
				}
				else {
					bbox = elem.bbox;
					data = elem.data;
				}
				bbox.setOffset(offset);
				wsTo.hyperlinkManager.add(bbox, data);
			}
		}
		History.LocalChange = false;
	};
	Worksheet.prototype._moveCleanRanges = function(oBBoxFrom, oBBoxTo, copyRange, wsTo) {
		//удаляем to через историю, для undo
		var cleanRanges = this._prepareMoveRangeGetCleanRanges(oBBoxFrom, oBBoxTo, wsTo);
		for (var i = 0; i < cleanRanges.length; i++) {
			var range = cleanRanges[i];
			range.cleanAll();
			//выставляем для slave refError
			if (!copyRange)
				this.workbook.dependencyFormulas.deleteNodes(wsTo.getId(), range.getBBox0());
		}
	};
	Worksheet.prototype._moveFormulas = function(oBBoxFrom, oBBoxTo, copyRange, wsTo, offset) {
		if(!copyRange){
			this.workbook.dependencyFormulas.move(this.Id, oBBoxFrom, offset, wsTo.getId());
		}
		//todo avoid double getRange3
		this.getRange3(oBBoxFrom.r1, oBBoxFrom.c1, oBBoxFrom.r2, oBBoxFrom.c2)._foreachNoEmpty(function(cell) {
			if (cell.transformSharedFormula()) {
				var parsed = cell.getFormulaParsed();
				parsed.buildDependencies();
			}
		});
	};
	Worksheet.prototype._moveCells = function(oBBoxFrom, oBBoxTo, copyRange, wsTo, offset) {
		var oThis = this;
		var nRowsCountNew = 0;
		var nColsCountNew = 0;
		var dependencyFormulas = oThis.workbook.dependencyFormulas;
		var moveToOtherSheet = this !== wsTo;
		var isClearFromArea = !copyRange || (copyRange && oThis.workbook.bUndoChanges);
		var moveCells = function(copyRange, from, to, r1From, r1To, count){
			var fromData = oThis.getColDataNoEmpty(from);
			var toData;
			if(fromData){
				toData = wsTo.getColData(to);
				toData.copyRange(fromData, r1From, r1To, count);
				if (isClearFromArea) {
					if(from !== to || moveToOtherSheet) {
						fromData.clear(r1From, r1From + count);
					} else {
						if (r1From < r1To) {
							fromData.clear(r1From, Math.min(r1From + count, r1To));
						} else {
							fromData.clear(Math.max(r1From, r1To + count), r1From + count);
						}
					}
				}
			} else {
				toData = wsTo.getColDataNoEmpty(to);
				if(toData) {
					toData.clear(r1To, r1To + count);
				}
			}
			if (toData) {
				nRowsCountNew = Math.max(nRowsCountNew, toData.getSize());
				nColsCountNew = Math.max(nColsCountNew, to + 1);
			}
		};
		if(oBBoxFrom.c1 < oBBoxTo.c1){
			for(var i = 0 ; i < oBBoxFrom.c2 - oBBoxFrom.c1 + 1; ++i){
				moveCells(copyRange, oBBoxFrom. c2 - i, oBBoxTo.c2 - i, oBBoxFrom.r1, oBBoxTo.r1, oBBoxFrom.r2 - oBBoxFrom.r1 + 1);
			}
		} else {
			for(var i = 0 ; i < oBBoxFrom.c2 - oBBoxFrom.c1 + 1; ++i){
				moveCells(copyRange, oBBoxFrom.c1 + i, oBBoxTo.c1 + i, oBBoxFrom.r1, oBBoxTo.r1, oBBoxFrom.r2 - oBBoxFrom.r1 + 1);
			}
		}
		// ToDo возможно нужно уменьшить диапазон обновления
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_MoveRange,
			this.getId(), new Asc.Range(0, 0, gc_nMaxCol0, gc_nMaxRow0),
			new UndoRedoData_FromTo(new UndoRedoData_BBox(oBBoxFrom), new UndoRedoData_BBox(oBBoxTo), copyRange, wsTo.getId()));
		if(moveToOtherSheet) {
			//сделано для того, чтобы происходил пересчет/обновление данных на другом листе
			//таким образом заносим диапазон обновления в UpdateRigions
			History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_Null, wsTo.getId(), oBBoxTo, new UndoRedoData_FromTo(null, null));
		}

		var shiftedArrayFormula = {};
		var oldNewArrayFormulaMap = {};
		//modify nRowsCount/nColsCount for correct foreach functions
		wsTo.cellsByColRowsCount = Math.max(wsTo.cellsByColRowsCount, nRowsCountNew);
		wsTo.nRowsCount = Math.max(wsTo.nRowsCount, wsTo.cellsByColRowsCount);
		wsTo.nColsCount = Math.max(wsTo.nColsCount, nColsCountNew);
		wsTo.getRange3(oBBoxTo.r1, oBBoxTo.c1, oBBoxTo.r2, oBBoxTo.c2)._foreachNoEmpty(function(cell){
			var formula = cell.getFormulaParsed();
			if (formula) {
				var cellWithFormula = formula.getParent();
				var arrayFormula = formula.getArrayFormulaRef();
				var newArrayRef, newFormula;
				var preMoveCell = {nRow: cell.nRow - offset.row, nCol: cell.nCol - offset.col};
				var isFirstCellArray = formula.checkFirstCellArray(preMoveCell) && !shiftedArrayFormula[formula.getListenerId()];
				if (copyRange) {
					History.TurnOff();
					//***array-formula***
					if(!arrayFormula || (arrayFormula && isFirstCellArray)) {
						newFormula = oThis._moveCellsFormula(cell, formula, cellWithFormula, copyRange, oBBoxFrom, wsTo);
						cellWithFormula = newFormula.getParent();
						cellWithFormula = new CCellWithFormula(wsTo, cell.nRow, cell.nCol);
						newFormula = newFormula.clone(null, cellWithFormula, wsTo);
						newFormula.changeOffset(offset, false, true);
						newFormula.setFormulaString(newFormula.assemble(true));
						cell.setFormulaInternal(newFormula, !isClearFromArea);

						if(isFirstCellArray) {
							newArrayRef = arrayFormula.clone();
							newArrayRef.setOffset(offset);
							newFormula.setArrayFormulaRef(newArrayRef);
							shiftedArrayFormula[newFormula.getListenerId()] = 1;
							oldNewArrayFormulaMap[formula.getListenerId()] = newFormula;
						}
					} else if(arrayFormula && oldNewArrayFormulaMap[formula.getListenerId()]) {
						cell.setFormulaInternal(oldNewArrayFormulaMap[formula.getListenerId()], !isClearFromArea);
					}
					History.TurnOn();
				} else {
					//***array-formula***
					//TODO возможно стоит это делать в dependencyFormulas.move
					if(arrayFormula) {
						if(isFirstCellArray) {
							newFormula = oThis._moveCellsFormula(cell, formula, cellWithFormula, copyRange, oBBoxFrom, wsTo);
							cellWithFormula = newFormula.getParent();
							shiftedArrayFormula[formula.getListenerId()] = 1;
							newArrayRef = arrayFormula.clone();
							newArrayRef.setOffset(offset);
							newFormula.setArrayFormulaRef(newArrayRef);

							cellWithFormula.ws = wsTo;
							cellWithFormula.nRow = cell.nRow;
							cellWithFormula.nCol = cell.nCol;
						}
					} else {
						newFormula = oThis._moveCellsFormula(cell, formula, cellWithFormula, copyRange, oBBoxFrom, wsTo);
						cellWithFormula = newFormula.getParent();
						cellWithFormula.ws = wsTo;
						cellWithFormula.nRow = cell.nRow;
						cellWithFormula.nCol = cell.nCol;
					}
				}
				if(arrayFormula) {
					if(isFirstCellArray) {
						dependencyFormulas.addToBuildDependencyArray(formula);
						if(newFormula) {
							dependencyFormulas.addToBuildDependencyArray(newFormula);
						}
					}
				} else {
					dependencyFormulas.addToBuildDependencyCell(cell);
				}
			}
		});
	};
	Worksheet.prototype._moveCellsFormula = function(cell, formula, cellWithFormula, copyRange, oBBoxFrom, wsTo) {
		if (this !== wsTo) {
			if (copyRange || !this.workbook.bUndoChanges) {
				cellWithFormula = new CCellWithFormula(wsTo, cell.nRow, cell.nCol);
				formula = formula.clone(null, cellWithFormula, wsTo);
				if (!copyRange) {
					formula.convertTo3DRefs(oBBoxFrom);
				}
				formula.moveToSheet(this, wsTo);
				formula.setFormulaString(formula.assemble(true));
				cell.setFormulaParsed(formula);
			} else {
				formula.moveToSheet(this, wsTo);
				formula.setFormulaString(formula.assemble(true));
			}
		}
		return formula;
	};
	Worksheet.prototype._moveRange=function(oBBoxFrom, oBBoxTo, copyRange, wsTo){
		if (!wsTo) {
			wsTo = this;
		}
		if (oBBoxFrom.isEqual(oBBoxTo) && this === wsTo)
			return;

		History.Create_NewPoint();
		History.StartTransaction();
		this.workbook.dependencyFormulas.lockRecal();

		var offset = new AscCommon.CellBase(oBBoxTo.r1 - oBBoxFrom.r1, oBBoxTo.c1 - oBBoxFrom.c1);
		var prepared = this._moveMergedAndHyperlinksPrepare(oBBoxFrom, oBBoxTo, copyRange, wsTo, offset);
		this._moveCleanRanges(oBBoxFrom, oBBoxTo, copyRange, wsTo);
		this._moveFormulas(oBBoxFrom, oBBoxTo, copyRange, wsTo, offset);
		this._moveCells(oBBoxFrom, oBBoxTo, copyRange, wsTo, offset);
		this._moveMergedAndHyperlinks(prepared, oBBoxFrom, oBBoxTo, copyRange, wsTo, offset);

		if(true == this.workbook.bUndoChanges || true == this.workbook.bRedoChanges) {
			wsTo.autoFilters.unmergeTablesAfterMove(oBBoxTo);
		}

		if (false == this.workbook.bUndoChanges && false == this.workbook.bRedoChanges) {
			this.autoFilters._moveAutoFilters(oBBoxTo, oBBoxFrom, null, copyRange, true, oBBoxFrom, wsTo);
		}

		this.workbook.dependencyFormulas.unlockRecal();
		History.EndTransaction();
		return true;
	};
	Worksheet.prototype._shiftCellsLeft=function(oBBox){
		//todo удаление когда есть замерженые ячейки
		var t = this;
		var nLeft = oBBox.c1;
		var nRight = oBBox.c2;
		var dif = nLeft - nRight - 1;
		var oActualRange = new Asc.Range(nLeft, oBBox.r1, gc_nMaxCol0, oBBox.r2);
		var offset = new AscCommon.CellBase(0, dif);
		//renameDependencyNodes before move cells to store current location in history
		var renameRes = this.renameDependencyNodes(offset, oBBox);
		var redrawTablesArr = this.autoFilters.insertColumn( oBBox, dif );
		if (false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			this.updateSortStateOffset(oBBox, offset);
			History.LocalChange = false;
		}

		this.getRange3(oBBox.r1, oBBox.c1, oBBox.r2, oBBox.c2)._foreachNoEmpty(function(cell){
			t._removeCell(null, null, cell);
		});

		this._updateFormulasParents(oActualRange.r1, oActualRange.c1, oActualRange.r2, oActualRange.c2, oBBox, offset, renameRes.shiftedShared);
		var cellsByColLength = this.getColDataLength();
		for (var i = nRight + 1; i < cellsByColLength; ++i) {
			var sheetMemoryFrom = this.getColDataNoEmpty(i);
			if (sheetMemoryFrom) {
				this.getColData(i + dif).copyRange(sheetMemoryFrom, oBBox.r1, oBBox.r1, oBBox.r2 - oBBox.r1 + 1);
				sheetMemoryFrom.clear(oBBox.r1, oBBox.r2 + 1);
			}
		}
		//notifyChanged after move cells to get new locations(for intersect ranges)
		this.workbook.dependencyFormulas.notifyChanged(renameRes.changed);
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ShiftCellsLeft, this.getId(), oActualRange, new UndoRedoData_BBox(oBBox));

		this.autoFilters.redrawStylesTables(redrawTablesArr);
		//todo проверить не уменьшились ли границы таблицы
	};
	Worksheet.prototype._shiftCellsUp=function(oBBox){
		var t = this;
		var nTop = oBBox.r1;
		var nBottom = oBBox.r2;
		var dif = nTop - nBottom - 1;
		var oActualRange = new Asc.Range(oBBox.c1, oBBox.r1, oBBox.c2, gc_nMaxRow0);
		var offset = new AscCommon.CellBase(dif, 0);
		//renameDependencyNodes before move cells to store current location in history
		var renameRes = this.renameDependencyNodes(offset, oBBox);
		var redrawTablesArr = this.autoFilters.insertRows("delCell", oBBox, c_oAscDeleteOptions.DeleteCellsAndShiftTop);
		if (false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			this.updateSortStateOffset(oBBox, offset);
			History.LocalChange = false;
		}

		this.getRange3(oBBox.r1, oBBox.c1, oBBox.r2, oBBox.c2)._foreachNoEmpty(function(cell){
			t._removeCell(null, null, cell);
		});
		this._updateFormulasParents(oActualRange.r1, oActualRange.c1, oActualRange.r2, oActualRange.c2, oBBox, offset, renameRes.shiftedShared);
		for (var i = oBBox.c1; i <= oBBox.c2; ++i) {
			var sheetMemory = this.getColDataNoEmpty(i);
			if (sheetMemory) {
				sheetMemory.deleteRange(nTop, -dif);
			}
		}
		//notifyChanged after move cells to get new locations(for intersect ranges)
		this.workbook.dependencyFormulas.notifyChanged(renameRes.changed);
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ShiftCellsTop, this.getId(), oActualRange, new UndoRedoData_BBox(oBBox));

		this.autoFilters.redrawStylesTables(redrawTablesArr);
		//todo проверить не уменьшились ли границы таблицы
	};
	Worksheet.prototype._shiftCellsRight=function(oBBox, displayNameFormatTable){
		var nLeft = oBBox.c1;
		var nRight = oBBox.c2;
		var dif = nRight - nLeft + 1;
		var oActualRange = new Asc.Range(oBBox.c1, oBBox.r1, gc_nMaxCol0, oBBox.r2);
		var offset = new AscCommon.CellBase(0, dif);
		//renameDependencyNodes before move cells to store current location in history
		var renameRes = this.renameDependencyNodes(offset, oBBox);
		var redrawTablesArr = this.autoFilters.insertColumn( oBBox, dif, displayNameFormatTable );
		if (false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			this.updateSortStateOffset(oBBox, offset);
			History.LocalChange = false;
		}

		this._updateFormulasParents(oActualRange.r1, oActualRange.c1, oActualRange.r2, oActualRange.c2, oBBox, offset, renameRes.shiftedShared);
		var borders;
		if (nLeft > 0 && !this.workbook.bUndoChanges) {
			borders = this._getBordersForInsert(oBBox, false);
		}
		var cellsByColLength = this.getColDataLength();
		for (var i = cellsByColLength - 1; i >= nLeft; --i) {
			var sheetMemoryFrom = this.getColDataNoEmpty(i);
			if (sheetMemoryFrom) {
				if (i + dif <= gc_nMaxCol0) {
					this.getColData(i + dif).copyRange(sheetMemoryFrom, oBBox.r1, oBBox.r1, oBBox.r2 - oBBox.r1 + 1);
				}
				sheetMemoryFrom.clear(oBBox.r1, oBBox.r2 + 1);
			}
		}
		this.nColsCount = Math.max(this.nColsCount, this.getColDataLength());
		//copy property from row/cell above
		if (nLeft > 0 && !this.workbook.bUndoChanges)
		{
			var prevSheetMemory = this.getColDataNoEmpty(nLeft - 1);
			if (prevSheetMemory) {
				//todo hidden, keep only style
				for (var i = nLeft; i <= nRight; ++i) {
					this.getColData(i).copyRange(prevSheetMemory, oBBox.r1, oBBox.r1, oBBox.r2 - oBBox.r1 + 1);
				}
				this.nColsCount = Math.max(this.nColsCount, this.getColDataLength());
				//show rows and remain only cell xf property
				this.getRange3(oBBox.r1, oBBox.c1, oBBox.r2, oBBox.c2)._foreachNoEmpty(function(cell) {
					cell.clearDataKeepXf(borders[cell.nRow]);
				});
			}
		}
		//notifyChanged after move cells to get new locations(for intersect ranges)
		this.workbook.dependencyFormulas.notifyChanged(renameRes.changed);
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ShiftCellsRight, this.getId(), oActualRange, new UndoRedoData_BBox(oBBox));


		this.autoFilters.redrawStylesTables(redrawTablesArr);
	};
	Worksheet.prototype._shiftCellsBottom=function(oBBox, displayNameFormatTable){
		var t = this;
		var nTop = oBBox.r1;
		var nBottom = oBBox.r2;
		var dif = nBottom - nTop + 1;
		var oActualRange = new Asc.Range(oBBox.c1, oBBox.r1, oBBox.c2, gc_nMaxRow0);
		var offset = new AscCommon.CellBase(dif, 0);
		//renameDependencyNodes before move cells to store current location in history
		var renameRes = this.renameDependencyNodes(offset, oBBox);
		var redrawTablesArr;
		if (!this.workbook.bUndoChanges && undefined === displayNameFormatTable) {
			redrawTablesArr = this.autoFilters.insertRows("insCell", oBBox, c_oAscInsertOptions.InsertCellsAndShiftDown,
				displayNameFormatTable);
		}
		this._updateFormulasParents(oActualRange.r1, oActualRange.c1, oActualRange.r2, oActualRange.c2, oBBox, offset, renameRes.shiftedShared);
		if (false == this.workbook.bUndoChanges && (false == this.workbook.bRedoChanges || this.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			this.updateSortStateOffset(oBBox, offset);
			History.LocalChange = false;
		}

		var borders;
		if (nTop > 0 && !this.workbook.bUndoChanges) {
			borders = this._getBordersForInsert(oBBox, true);
		}
		//rowcount
		for (var i = oBBox.c1; i <= oBBox.c2; ++i) {
			var sheetMemory = this.getColDataNoEmpty(i);
			if (sheetMemory) {
				sheetMemory.insertRange(nTop, dif);
				t.cellsByColRowsCount = Math.max(t.cellsByColRowsCount, sheetMemory.getSize());
			}
		}
		this.nRowsCount = Math.max(this.nRowsCount, this.cellsByColRowsCount);
		if (nTop > 0 && !this.workbook.bUndoChanges)
		{
			for (var i = oBBox.c1; i <= oBBox.c2; ++i) {
				var sheetMemory = this.getColDataNoEmpty(i);
				if (sheetMemory) {
					sheetMemory.copyRangeByChunk((nTop - 1), 1, nTop, dif);
					t.cellsByColRowsCount = Math.max(t.cellsByColRowsCount, sheetMemory.getSize());
				}
			}
			this.nRowsCount = Math.max(this.nRowsCount, this.cellsByColRowsCount);
			//show rows and remain only cell xf property
			this.getRange3(oBBox.r1, oBBox.c1, oBBox.r2, oBBox.c2)._foreachNoEmpty(function(cell) {
				cell.clearDataKeepXf(borders[cell.nCol]);
			});
		}
		//notifyChanged after move cells to get new locations(for intersect ranges)
		this.workbook.dependencyFormulas.notifyChanged(renameRes.changed);
		History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ShiftCellsBottom, this.getId(), oActualRange, new UndoRedoData_BBox(oBBox));

		//пока перенес добавление только последней строки(в данном случае порядок занесения в истрию должен быть именно в таком порядке)
		//TODO возможно стоит полностью перенести сюда обработку для ф/т и а/ф
		if (!this.workbook.bUndoChanges && undefined !== displayNameFormatTable) {
			redrawTablesArr = this.autoFilters.insertRows("insCell", oBBox, c_oAscInsertOptions.InsertCellsAndShiftDown,
				displayNameFormatTable);
		}

		if(!this.workbook.bUndoChanges)
		{
			this.autoFilters.redrawStylesTables(redrawTablesArr);
		}
	};
	Worksheet.prototype._setIndex=function(ind){
		this.index = ind;
	};
	Worksheet.prototype._BuildDependencies=function(cellRange){
		/*
		 Построение графа зависимостей.
		 */
		var ca;
		for (var i in cellRange) {
			if (null === cellRange[i]) {
				cellRange[i] = i;
				continue;
			}

			ca = g_oCellAddressUtils.getCellAddress(i);
			this._getCellNoEmpty(ca.getRow0(), ca.getCol0(), function(c) {
				if (c) {
					c._BuildDependencies(true);
				}
			});
		}
	};
	Worksheet.prototype._setHandlersTablePart = function(){
		if(!this.TableParts)
			return;

		for(var i = 0; i < this.TableParts.length; i++)
		{
			this.TableParts[i].setHandlers(this.handlers);
		}
	};
	Worksheet.prototype.getTableRangeForFormula = function(name, objectParam){
		var res = null;
		if(!this.TableParts || !name)
			return res;

		for(var i = 0; i < this.TableParts.length; i++)
		{
			if(this.TableParts[i].DisplayName.toLowerCase() === name.toLowerCase())
			{
				res = this.TableParts[i].getTableRangeForFormula(objectParam);
				break;
			}
		}
		return res;
	};
	Worksheet.prototype.getTableIndexColumnByName = function(tableName, columnName){
		var res = null;
		if(!this.TableParts || !tableName)
			return res;

		for(var i = 0; i < this.TableParts.length; i++)
		{
			if(this.TableParts[i].DisplayName.toLowerCase() === tableName.toLowerCase())
			{
				res = this.TableParts[i].getTableIndexColumnByName(columnName);
				break;
			}
		}
		return res;
	};
	Worksheet.prototype.getTableNameColumnByIndex = function(tableName, columnIndex){
		var res = null;
		if(!this.TableParts || !tableName)
			return res;

		for(var i = 0; i < this.TableParts.length; i++)
		{
			if(this.TableParts[i].DisplayName.toLowerCase() === tableName.toLowerCase())
			{
				res = this.TableParts[i].getTableNameColumnByIndex(columnIndex);
				break;
			}
		}
		return res;
	};
	Worksheet.prototype.getTableByName = function(tableName){
		var res = null;
		if(!this.TableParts || !tableName)
			return res;

		for(var i = 0; i < this.TableParts.length; i++)
		{
			if(this.TableParts[i].DisplayName.toLowerCase() === tableName.toLowerCase())
			{
				res = this.TableParts[i];
				break;
			}
		}
		return res;
	};
	Worksheet.prototype.isApplyFilterBySheet = function () {
		var res = false;

		if (this.AutoFilter && this.AutoFilter.isApplyAutoFilter()) {
			res = true;
		}

		if (false === res && this.TableParts) {
			for (var i = 0; i < this.TableParts.length; i++) {
				if (true === this.TableParts[i].isApplyAutoFilter()) {
					res = true;
					break;
				}
			}
		}

		return res;
	};
	Worksheet.prototype.getTableNames = function() {
		var res = [];
		if (this.TableParts) {
			for (var i = 0; i < this.TableParts.length; i++) {
				res.push(this.TableParts[i].DisplayName);
			}
		}
		return res;
	};
	Worksheet.prototype.renameDependencyNodes = function(offset, oBBox){
		return this.workbook.dependencyFormulas.shift(this.Id, oBBox, offset);
	};
	Worksheet.prototype.getAllCol = function(){
		if(null == this.oAllCol)
			this.oAllCol = new AscCommonExcel.Col(this, g_nAllColIndex);
		return this.oAllCol;
	};
	Worksheet.prototype.getAllRow = function(){
		if (null == this.oSheetFormatPr.oAllRow) {
			this.oSheetFormatPr.oAllRow = new AscCommonExcel.Row(this);
			this.oSheetFormatPr.oAllRow.setIndex(g_nAllRowIndex);
		}
		return this.oSheetFormatPr.oAllRow;
	};
	Worksheet.prototype.getAllRowNoEmpty = function(){
		return this.oSheetFormatPr.oAllRow;
	};
	Worksheet.prototype.getHyperlinkByCell = function(row, col){
		var oHyperlink = this.hyperlinkManager.getByCell(row, col);
		return oHyperlink ? oHyperlink.data : null;
	};
	Worksheet.prototype.getMergedByCell = function(row, col){
		var oMergeInfo = this.mergeManager.getByCell(row, col);
		return oMergeInfo ? oMergeInfo.bbox : null;
	};
	Worksheet.prototype.getMergedByRange = function(bbox){
		return this.mergeManager.get(bbox);
	};
	Worksheet.prototype._expandRangeByMergedAddToOuter = function(aOuter, range, aMerged){
		for(var i = 0, length = aMerged.all.length; i < length; i++)
		{
			var elem = aMerged.all[i];
			if(!range.containsRange(elem.bbox))
				aOuter.push(elem);
		}
	};
	Worksheet.prototype._expandRangeByMergedGetOuter = function(range){
		var aOuter = [];
		//смотрим только границы
		this._expandRangeByMergedAddToOuter(aOuter, range, this.mergeManager.get(new Asc.Range(range.c1, range.r1, range.c1, range.r2)));
		if(range.c1 != range.c2)
		{
			this._expandRangeByMergedAddToOuter(aOuter, range, this.mergeManager.get(new Asc.Range(range.c2, range.r1, range.c2, range.r2)));
			if(range.c2 - range.c1 > 1)
			{
				this._expandRangeByMergedAddToOuter(aOuter, range, this.mergeManager.get(new Asc.Range(range.c1 + 1, range.r1, range.c2 - 1, range.r1)));
				if(range.r1 != range.r2)
					this._expandRangeByMergedAddToOuter(aOuter, range, this.mergeManager.get(new Asc.Range(range.c1 + 1, range.r2, range.c2 - 1, range.r2)));
			}
		}
		return aOuter;
	};
	Worksheet.prototype.expandRangeByMerged = function(range){
		if(null != range)
		{
			var aOuter = this._expandRangeByMergedGetOuter(range);
			if(aOuter.length > 0)
			{
				range = range.clone();
				while(aOuter.length > 0)
				{
					for(var i = 0, length = aOuter.length; i < length; i++)
						range.union2(aOuter[i].bbox);
					aOuter = this._expandRangeByMergedGetOuter(range);
				}
			}
		}
		return range;
	};
	Worksheet.prototype.createTablePart = function(){

		return new AscCommonExcel.TablePart(this.handlers);
	};
	Worksheet.prototype.onUpdateRanges = function(ranges) {
		this.workbook.updateSparklineCache(this.sName, ranges);
		// ToDo do not update conditional formatting on hidden sheet
		this.setDirtyConditionalFormatting(new AscCommonExcel.MultiplyRange(ranges));
		//this.workbook.handlers.trigger("toggleAutoCorrectOptions", null,true);
		this.clearFindResults();
	};
	Worksheet.prototype.updateSparklineCache = function(sheet, ranges) {
		for (var i = 0; i < this.aSparklineGroups.length; ++i) {
			this.aSparklineGroups[i].updateCache(sheet, ranges);
		}
	};
	Worksheet.prototype.getSparklineGroup = function(c, r) {
		for (var i = 0; i < this.aSparklineGroups.length; ++i) {
			if (-1 !== this.aSparklineGroups[i].contains(c, r)) {
				return this.aSparklineGroups[i];
			}
		}
		return null;
	};
	Worksheet.prototype.removeSparklines = function (range) {
		for (var i = this.aSparklineGroups.length - 1; i > -1 ; --i) {
			if (this.aSparklineGroups[i].remove(range)) {
				History.Add(new AscDFH.CChangesDrawingsSparklinesRemove(this.aSparklineGroups[i]));
                this.aSparklineGroups.splice(i, 1);
			}
		}
	};
	Worksheet.prototype.removeSparklineGroups = function (range) {
		for (var i = this.aSparklineGroups.length - 1; i > -1 ; --i) {
			if (-1 !== this.aSparklineGroups[i].intersectionSimple(range)) {
                History.Add(new AscDFH.CChangesDrawingsSparklinesRemove(this.aSparklineGroups[i]));
                this.aSparklineGroups.splice(i, 1);
            }
		}
	};
	Worksheet.prototype.insertSparklineGroup = function (sparklineGroup) {
		this.aSparklineGroups.push(sparklineGroup);
	};
	Worksheet.prototype.removeSparklineGroup = function (id) {
		for (var i = 0; i < this.aSparklineGroups.length; ++i) {
			if (id === this.aSparklineGroups[i].Get_Id()) {
				this.aSparklineGroups.splice(i, 1);
				break;
			}
		}
	};
	Worksheet.prototype.getCwf = function() {
		var cwf = {};
		var range = this.getRange3(0,0, gc_nMaxRow0, gc_nMaxCol0);
		range._setPropertyNoEmpty(null, null, function(cell){
			if(cell.isFormula()){
				var name = cell.getName();
				cwf[name] = name;
			}
		});
		return cwf;
	};
	Worksheet.prototype.getAllFormulas = function(formulas) {
		var range = this.getRange3(0, 0, gc_nMaxRow0, gc_nMaxCol0);
		range._setPropertyNoEmpty(null, null, function(cell) {
			if (cell.isFormula()) {
				formulas.push(cell.getFormulaParsed());
			}
		});
		for (var i = 0; i < this.TableParts.length; ++i) {
			var table = this.TableParts[i];
			table.getAllFormulas(formulas);
		}
	};
	Worksheet.prototype.setTableStyleAfterOpen = function () {
		if (this.TableParts && this.TableParts.length) {
			for (var i = 0; i < this.TableParts.length; i++) {
				var table = this.TableParts[i];
				this.autoFilters._setColorStyleTable(table.Ref, table);
			}
		}
	};
	Worksheet.prototype.setTableFormulaAfterOpen = function () {
		if (this.TableParts && this.TableParts.length) {
			for (var i = 0; i < this.TableParts.length; i++) {
				var table = this.TableParts[i];
				//TODO пока заменяем при открытии на TotalsRowFormula
				table.checkTotalRowFormula(this);
			}
		}
	};
	Worksheet.prototype.isTableTotalRow = function (range) {
		var res = false;
		if (this.TableParts && this.TableParts.length) {
			for (var i = 0; i < this.TableParts.length; i++) {
				var table = this.TableParts[i];
				var totalRowRange = table.getTotalsRowRange();
				if(totalRowRange && totalRowRange.containsRange(range)) {
					res = true;
				}
			}
		}
		return res;
	};
	Worksheet.prototype.addTablePart = function (tablePart, bAddToDependencies) {
		this.TableParts.push(tablePart);
		if (bAddToDependencies) {
			this.workbook.dependencyFormulas.addTableName(this, tablePart);
			tablePart.buildDependencies();
		}
	};
	Worksheet.prototype.changeTablePart = function (index, tablePart, bChangeName) {
		var oldTablePart = this.TableParts[index];
		if (oldTablePart) {
			oldTablePart.removeDependencies();
		}
		this.TableParts[index] = tablePart;
		tablePart.buildDependencies();
		if (bChangeName && oldTablePart) {
			this.workbook.dependencyFormulas.changeTableName(oldTablePart.DisplayName, tablePart.DisplayName);
		}
	};
	Worksheet.prototype.deleteTablePart = function (index, bConvertTableFormulaToRef) {
		if(bConvertTableFormulaToRef)
		{
			//TODO скорее всего стоит убрать else
			var tablePart = this.TableParts[index];
			this.workbook.dependencyFormulas.delTableName(tablePart.DisplayName, bConvertTableFormulaToRef);
			tablePart.removeDependencies();
			
			//delete table
			this.TableParts.splice(index, 1);
		}
		else
		{
			var deleted = this.TableParts.splice(index, 1);
			for (var delIndex = 0; delIndex < deleted.length; ++delIndex) {
				var tablePart = deleted[delIndex];
				this.workbook.dependencyFormulas.delTableName(tablePart.DisplayName);
				tablePart.removeDependencies();
			}
		}
		
	};
	Worksheet.prototype.initPivotTables = function () {
		for (var i = 0; i < this.pivotTables.length; ++i) {
			this.pivotTables[i].init();
		}
	};
	Worksheet.prototype.clearPivotTable = function (pivotTable) {
		var pos, cells;
		if (this.pageFieldsPositions) {
			for (var i = 0; i < pivotTable.pageFieldsPositions.length; ++i) {
				pos = pivotTable.pageFieldsPositions[i];
				cells = this.getRange3(pos.row, pos.col, pos.row, pos.col + 1);
				cells.clearTableStyle();
				cells.cleanAll();
			}
		}

		var pivotRange = pivotTable.getRange();
		cells = this.getRange3(pivotRange.r1, pivotRange.c1, pivotRange.r2, pivotRange.c2);
		cells.clearTableStyle();
		cells.cleanAll();
	};
	Worksheet.prototype.updatePivotTable = function (pivotTable) {
		pivotTable.init();
		var cleanRanges = [];
		var pos, cells, bWarning, pivotRange;
		var i, l = pivotTable.pageFieldsPositions.length;
		pos = 0 < l && pivotTable.pageFieldsPositions[0];
		if (pos && 0 > pos.row) {
			// ToDo add check exist data in cells
			pivotRange = pivotTable.getRange();
			pivotRange.setOffset(new AscCommon.CellBase(-1 * pos.row, 0));
			pivotTable.init();
			cells = this.getRange3(pivotRange.r1, pivotRange.c1, pivotRange.r2, pivotRange.c2);
			cells._foreachNoEmpty(function (cell) {
				return (bWarning = !cell.isNullText()) ? null : cell;
			});
			cleanRanges.push(cells);
		}
		for (i = 0; i < pivotTable.pageFieldsPositions.length; ++i) {
			pos = pivotTable.pageFieldsPositions[i];
			cells = this.getRange3(pos.row, pos.col, pos.row, pos.col + 1);
			if (!bWarning) {
				cells._foreachNoEmpty(function (cell) {
					return (bWarning = !cell.isNullText()) ? null : cell;
				});
			}
			cleanRanges.push(cells);
		}
		var t = this;
		function callback(res) {
			if (res) {
				t._updatePivotTable(pivotTable, cleanRanges);
			}
		}
		if (bWarning) {
			// ToDo add confirm event
			callback(true);
		} else {
			callback(true);
		}
	};
	Worksheet.prototype._updatePivotTable = function (pivotTable, cleanRanges) {
		var pos, cells, index, i, j, k, r, c1, r1, field, indexField, cacheIndex, sharedItem, item, items, setName,
			oCellValue, rowIndexes, last;
		for (i = 0; i < cleanRanges.length; ++i) {
			cleanRanges[i].cleanAll();
		}
		var pivotRange = pivotTable.getRange();
		var cacheRecords = pivotTable.getRecords();
		var cacheFields = pivotTable.asc_getCacheFields();
		var pivotFields = pivotTable.asc_getPivotFields();
		var pageFields = pivotTable.asc_getPageFields();
		var colFields = pivotTable.asc_getColumnFields();
		var rowFields = pivotTable.asc_getRowFields();
		var dataFields = pivotTable.asc_getDataFields();
		var rowFieldsPos = [];
		for (i = 0; i < pivotTable.pageFieldsPositions.length; ++i) {
			pos = pivotTable.pageFieldsPositions[i];
			cells = this.getRange4(pos.row, pos.col);
			index = pageFields[i].asc_getIndex();
			cells.setValue(pageFields[i].asc_getName() || pivotFields[index].asc_getName() ||
				cacheFields[index].asc_getName());

			cells = this.getRange4(pos.row, pos.col + 1);
			cells.setValue('(All)');
		}
		var countC = pivotTable.getColumnFieldsCount();
		var countR = pivotTable.getRowFieldsCount(true);
		var countD = pivotTable.getDataFieldsCount();
		var valuesWithFormat = [];
		var cacheValuesCol = [];
		var cacheValuesRow = [];

		// column
		c1 = pivotRange.c1 + countR;
		r1 = pivotRange.r1;
		if (countC) {
			cells = this.getRange4(r1, c1);
			cells.setValue('Column Labels');
			++r1;
		}

		items = pivotTable.getColItems();
		if (items) {
			for (i = 0; i < items.length; ++i) {
				item = items[i];
				r = item.getR();
				rowIndexes = undefined;
				if (countC) {
					for (j = 0; j < item.x.length; ++j) {
						if (Asc.c_oAscItemType.Grand === item.t) {
							field = null;
							oCellValue = new AscCommonExcel.CCellValue();
							oCellValue.text = 'Grand Total';
							oCellValue.type = AscCommon.CellValueType.String;
						} else {
							indexField = colFields[r + j].asc_getIndex();
							field = pivotFields[indexField];
							cacheIndex = field.getItem(item.x[j].getV());
							if (null !== item.t) {
								oCellValue = new AscCommonExcel.CCellValue();
								oCellValue.text =
									valuesWithFormat[r1 + r + j] + AscCommonExcel.ToName_ST_ItemType(item.t);
								oCellValue.type = AscCommon.CellValueType.String;
							} else {
								sharedItem = cacheFields[indexField].getSharedItem(cacheIndex.x);
								oCellValue = sharedItem.getCellValue();
							}

							if (countD) {
								rowIndexes = pivotTable.getValues(cacheRecords, rowIndexes, indexField, cacheIndex.x);
							}
						}

						cells = this.getRange4(r1 + r + j, c1 + i);
						if (field && null !== field.numFmtId) {
							cells.setNum(new AscCommonExcel.Num({id: field.numFmtId}));
						}
						cells.setValueData(new AscCommonExcel.UndoRedoData_CellValueData(null, oCellValue));
						if (null === item.t) {
							valuesWithFormat[r1 + r + j] = cells.getValueWithFormat();
						}
					}
				} else if (countR && countD) {
					// add header for data
					cells = this.getRange4(r1, c1 + i);
					index = dataFields[i].asc_getIndex();
					cells.setValue(dataFields[i].asc_getName() || pivotFields[index].asc_getName() ||
						cacheFields[index].asc_getName());
				}
				if (countD) {
					cacheValuesCol.push(rowIndexes);
				}
			}
		}

		// rows
		countR = pivotTable.getRowFieldsCount();
		if (countR) {
			c1 = pivotRange.c1;
			r1 = pivotRange.r1 + countC;
			setName = false;
			for (i = 0; i < rowFields.length; ++i) {
				if (0 === i) {
					cells = this.getRange4(r1, c1);
					cells.setValue('Row Labels');
				}
				index = rowFields[i].asc_getIndex();
				field = pivotFields[index];
				if (setName) {
					cells = this.getRange4(r1, c1);
					cells.setValue(pivotFields[index].asc_getName() || cacheFields[index].asc_getName());
					setName = false;
				}
				rowFieldsPos[i] = c1;
				if (field && false === field.compact) {
					++c1;
					setName = true;
				}
			}

			++r1;

			items = pivotTable.getRowItems();
			if (items) {
				for (i = 0; i < items.length; ++i) {
					item = items[i];
					r = item.getR();
					for (j = 0; j < item.x.length; ++j) {
						if (Asc.c_oAscItemType.Grand === item.t) {
							field = null;
							oCellValue = new AscCommonExcel.CCellValue();
							oCellValue.text = 'Grand Total';
							oCellValue.type = AscCommon.CellValueType.String;
						} else {
							indexField = rowFields[r].asc_getIndex();
							field = pivotFields[indexField];
							cacheIndex = field.getItem(item.x[j].getV());
							if (null !== item.t) {
								oCellValue = new AscCommonExcel.CCellValue();
								oCellValue.text =
									valuesWithFormat[r1 + r + j] + AscCommonExcel.ToName_ST_ItemType(item.t);
								oCellValue.type = AscCommon.CellValueType.String;
							} else {
								sharedItem = cacheFields[indexField].getSharedItem(cacheIndex.x);
								oCellValue = sharedItem.getCellValue();
							}

							if (countD) {
								cacheValuesRow.push(indexField, cacheIndex.x);
							}
						}

						cells = this.getRange4(r1 + i, rowFieldsPos[r]);
						if (field && null !== field.numFmtId) {
							cells.setNum(new AscCommonExcel.Num({id: field.numFmtId}));
						}
						cells.setValueData(new AscCommonExcel.UndoRedoData_CellValueData(null, oCellValue));

						if (null === item.t) {
							valuesWithFormat[r1 + r + j] = cells.getValueWithFormat();
						}
					}
					last = r === countR - 1 || null !== item.t;
					if (countD && (last || (field && field.asc_getSubtotalTop()))) {
						for (j = 0; j < cacheValuesCol.length; ++j) {
							rowIndexes = cacheValuesCol[j];
							for (k = 0; k < cacheValuesRow.length && (!rowIndexes || 0 !== rowIndexes.length); k += 2) {
								rowIndexes =
									pivotTable.getValues(cacheRecords, rowIndexes, cacheValuesRow[k], cacheValuesRow[k + 1]);
							}
							if (0 !== rowIndexes.length) {
								cells = this.getRange4(r1 + i, rowFieldsPos[r] + 1 + j);
								oCellValue = new AscCommonExcel.CCellValue();
								oCellValue.number = pivotTable.getValue(cacheRecords, rowIndexes, dataFields[0].asc_getIndex(),
																		(null !== item.t && Asc.c_oAscItemType.Grand !== item.t) ? item.t :
																			dataFields[0].asc_getSubtotal());
								oCellValue.type = AscCommon.CellValueType.Number;
								cells.setValueData(new AscCommonExcel.UndoRedoData_CellValueData(null, oCellValue));
							}
						}
						if (last) {
							cacheValuesRow = [];
						}
					}
				}
			}
		}
	};
	Worksheet.prototype.updatePivotTablesStyle = function (range) {
		var t = this;
		var pivotTable, pivotRange, pivotFields, rowFields, styleInfo, style, wholeStyle, cells, j, r, x, pos,
			firstHeaderRow0, firstDataCol0, countC, countCWValues, countR, countD, stripe1, stripe2, items, l, item,
			start, end, isOutline, arrSubheading, emptyStripe = new Asc.CTableStyleElement();
		var dxf, dxfLabels, dxfValues, grandColumn, index;
		var checkRowSubheading = function (_i, _r, _v, _dxf) {
			var sub, bSet = true;
			if ((sub = arrSubheading[_i])) {
				if (sub.v === _v) {
					bSet = false;
				} else {
					cells = t.getRange3(sub.r, pivotRange.c1 + _i, _r - 1, pivotRange.c1 + _i);
					cells.setTableStyle(sub.dxf);
				}
			}
			if (bSet) {
				arrSubheading[_i] = (null === _v) ? null : {r: _r, dxf: _dxf, v: _v};
			}
		};
		var endRowSubheadings = function (_i, _r) {
			for (;_i < arrSubheading.length; ++_i) {
				checkRowSubheading(_i, _r, null, null);
			}
		};

		for (var i = 0; i < this.pivotTables.length; ++i) {
			grandColumn = 0;
			pivotTable = this.pivotTables[i];
			pivotRange = pivotTable.getRange();
			pivotFields = pivotTable.asc_getPivotFields();
			rowFields = pivotTable.asc_getRowFields();
			styleInfo = pivotTable.asc_getStyleInfo();
			if (!pivotTable.isInit || !styleInfo || (range && !pivotTable.intersection(range))) {
				continue;
			}
			style = this.workbook.TableStyles.AllStyles[styleInfo.asc_getName()];

			wholeStyle = style && style.wholeTable && style.wholeTable.dxf;

			// Page Field Labels, Page Field Values
			dxfLabels = style && style.pageFieldLabels && style.pageFieldLabels.dxf;
			dxfValues = style && style.pageFieldValues && style.pageFieldValues.dxf;
			for (j = 0; j < pivotTable.pageFieldsPositions.length; ++j) {
				pos = pivotTable.pageFieldsPositions[j];
				cells = this.getRange4(pos.row, pos.col);
				cells.clearTableStyle();
				cells.setTableStyle(wholeStyle);
				cells.setTableStyle(dxfLabels);
				cells = this.getRange4(pos.row, pos.col + 1);
				cells.clearTableStyle();
				cells.setTableStyle(wholeStyle);
				cells.setTableStyle(dxfValues);
			}

			cells = this.getRange3(pivotRange.r1, pivotRange.c1, pivotRange.r2, pivotRange.c2);
			cells.clearTableStyle();

			if (!style) {
				continue;
			}

			countC = pivotTable.getColumnFieldsCount();
			countR = pivotTable.getRowFieldsCount(true);

			if (0 === countC + countR) {
				continue;
			}

			firstHeaderRow0 = pivotTable.getFirstHeaderRow0();
			firstDataCol0 = pivotTable.getFirstDataCol();
			countD = pivotTable.getDataFieldsCount();
			countCWValues = pivotTable.getColumnFieldsCount(true);

			// Whole Table
			cells.setTableStyle(wholeStyle);

			// First Column Stripe, Second Column Stripe
			if (styleInfo.showColStripes) {
				stripe1 = style.firstColumnStripe || emptyStripe;
				stripe2 = style.secondColumnStripe || emptyStripe;
				start = pivotRange.c1 + firstDataCol0;
				if (stripe1.dxf) {
					cells = this.getRange3(pivotRange.r1 + firstHeaderRow0 + 1, start, pivotRange.r2, pivotRange.c2);
					cells.setTableStyle(stripe1.dxf, new Asc.CTableStyleStripe(stripe1.size, stripe2.size));
				}
				if (stripe2.dxf && start + stripe1.size <= pivotRange.c2) {
					cells = this.getRange3(pivotRange.r1 + firstHeaderRow0 + 1, start + stripe1.size, pivotRange.r2,
						pivotRange.c2);
					cells.setTableStyle(stripe2.dxf, new Asc.CTableStyleStripe(stripe2.size, stripe1.size));
				}
			}
			// First Row Stripe, Second Row Stripe
			if (styleInfo.showRowStripes && countR && (pivotRange.c1 + countR - 1 !== pivotRange.c2)) {
				stripe1 = style.firstRowStripe || emptyStripe;
				stripe2 = style.secondRowStripe || emptyStripe;
				start = pivotRange.r1 + firstHeaderRow0 + 1;
				if (stripe1.dxf) {
					cells = this.getRange3(start, pivotRange.c1, pivotRange.r2, pivotRange.c2);
					cells.setTableStyle(stripe1.dxf, new Asc.CTableStyleStripe(stripe1.size, stripe2.size, true));
				}
				if (stripe2.dxf && start + stripe1.size <= pivotRange.r2) {
					cells = this.getRange3(start + stripe1.size, pivotRange.c1, pivotRange.r2, pivotRange.c2);
					cells.setTableStyle(stripe1.dxf, new Asc.CTableStyleStripe(stripe2.size, stripe1.size, true));
				}
			}

			// First Column
			dxf = style.firstColumn && style.firstColumn.dxf;
			if (styleInfo.showRowHeaders && countR && dxf) {
				cells = this.getRange3(pivotRange.r1, pivotRange.c1, pivotRange.r2, pivotRange.c1 +
					Math.max(0, firstDataCol0 - 1));
				cells.setTableStyle(dxf);
			}

			// Header Row
			dxf = style.headerRow && style.headerRow.dxf;
			if (styleInfo.showColHeaders && dxf) {
				cells = this.getRange3(pivotRange.r1, pivotRange.c1, pivotRange.r1 + firstHeaderRow0, pivotRange.c2);
				cells.setTableStyle(dxf);
			}

			// First Header Cell
			dxf = style.firstHeaderCell && style.firstHeaderCell.dxf;
			if (styleInfo.showColHeaders && styleInfo.showRowHeaders && countCWValues && (countR + countD) && dxf) {
				cells = this.getRange3(pivotRange.r1, pivotRange.c1, pivotRange.r1 + firstHeaderRow0 - (countR ? 1 : 0),
					pivotRange.c1 + Math.max(0, firstDataCol0 - 1));
				cells.setTableStyle(dxf);
			}

			// Subtotal Column + Grand Total Column
			items = pivotTable.getColItems();
			if (items) {
				start = pivotRange.c1 + firstDataCol0;
				for (j = 0; j < items.length; ++j) {
					dxf = null;
					item = items[j];
					r = item.getR();
					if (Asc.c_oAscItemType.Grand === item.t || 0 === countCWValues) {
						// Grand Total Column
						dxf = style.lastColumn;
						grandColumn = 1;
					} else {
						// Subtotal Column
						if (r + 1 !== countC) {
							if (countD && null !== item.t) {
								if (0 === r) {
									dxf = style.firstSubtotalColumn;
								} else if (1 === r % 2) {
									dxf = style.secondSubtotalColumn;
								} else {
									dxf = style.thirdSubtotalColumn;
								}
							}
						}
					}
					dxf = dxf && dxf.dxf;
					if (dxf) {
						cells = this.getRange3(pivotRange.r1 + 1, start + j, pivotRange.r2, start + j);
						cells.setTableStyle(dxf);
					}
				}
			}

			// Subtotal Row + Row Subheading + Grand Total Row
			items = pivotTable.getRowItems();
			if (items && countR) {
				arrSubheading = [];
				countR = pivotTable.getRowFieldsCount();
				start = pivotRange.r1 + firstHeaderRow0 + 1;
				for (j = 0; j < items.length; ++j) {
					dxf = null;
					item = items[j];
					if (null !== item.t) {
						if (Asc.c_oAscItemType.Grand === item.t) {
							// Grand Total Row
							dxf = style.totalRow;
							pos = 0;
						} else if (Asc.c_oAscItemType.Blank === item.t) {
							// Blank Row
							dxf = style.blankRow;
							pos = 0;
						} else if (styleInfo.showRowHeaders) {
							// Subtotal Row
							r = item.getR();
							if (r + 1 !== countR) {
								if (0 === r) {
									dxf = style.firstSubtotalRow;
								} else if (1 === r % 2) {
									dxf = style.secondSubtotalRow;
								} else {
									dxf = style.thirdSubtotalRow;
								}
								pos = pivotTable.getRowFieldPos(r);
							}
						}
						dxf = dxf && dxf.dxf;
						if (dxf) {
							cells = this.getRange3(start + j, pivotRange.c1 + pos, start + j, pivotRange.c2);
							cells.setTableStyle(dxf);
						}
						endRowSubheadings(pos, start + j);
					} else if (styleInfo.showRowHeaders) {
						// Row Subheading
						r = item.getR();
						index = rowFields[r].asc_getIndex();
						isOutline = (AscCommonExcel.st_VALUES !== index && false !== pivotFields[index].outline);
						for (x = 0, l = item.x.length; x < l; ++x, ++r) {
							dxf = null;
							if (r + 1 !== countR) {
								if (0 === r) {
									dxf = style.firstRowSubheading;
								} else if (1 === r % 2) {
									dxf = style.secondRowSubheading;
								} else {
									dxf = style.thirdRowSubheading;
								}
								dxf = dxf && dxf.dxf;
								if (dxf) {
									pos = pivotTable.getRowFieldPos(r);
									if (1 === l && isOutline) {
										endRowSubheadings(pos, start + j);
										cells = this.getRange3(start + j, pivotRange.c1 + pos, start + j, pivotRange.c2);
										cells.setTableStyle(dxf);
									} else {
										checkRowSubheading(pos, start + j, item.x[x].getV(), dxf);
									}
								}
							}
						}
					}
				}
				endRowSubheadings(0, pivotRange.r2 + 1);
			}

			// Column Subheading
			items = pivotTable.getColItems();
			if (items && styleInfo.showColHeaders) {
				start = pivotRange.c1 + firstDataCol0;
				end = pivotRange.c2 - grandColumn;
				for (j = 0; j < countCWValues; ++j) {
					if (0 === j) {
						dxf = style.firstColumnSubheading;
					} else if (1 === j % 2) {
						dxf = style.secondColumnSubheading;
					} else {
						dxf = style.thirdColumnSubheading;
					}
					dxf = dxf && dxf.dxf;
					if (dxf) {
						cells = this.getRange3(pivotRange.r1 + 1 + j, start, pivotRange.r1 + 1 + j, end);
						cells.setTableStyle(dxf);
					}
				}
				pos = pivotRange.r1 + 1 + firstHeaderRow0 - (countR ? 1 : 0);
				for (j = 0; j < items.length; ++j) {
					item = items[j];
					if (null !== item.t && Asc.c_oAscItemType.Grand !== item.t) {
						r = item.getR();
						if (0 === r) {
							dxf = style.firstColumnSubheading;
						} else if (1 === r % 2) {
							dxf = style.secondColumnSubheading;
						} else {
							dxf = style.thirdColumnSubheading;
						}
						dxf = dxf && dxf.dxf;
						if (dxf) {
							cells =
								this.getRange3(pivotRange.r1 + 1 + r, start + j, pos, start + j);
							cells.setTableStyle(dxf);
						}
					}
				}
			}
		}
	};
	Worksheet.prototype.updatePivotOffset = function (range, offset) {
		var pivotTable, pivotRange, cells;
		for (var i = 0; i < this.pivotTables.length; ++i) {
			pivotTable = this.pivotTables[i];
			pivotRange = pivotTable.getRange();

			if ((offset.col && range.c1 <= pivotRange.c2) || (offset.row && range.r1 <= pivotRange.r2)) {
				cells = this.getRange3(pivotRange.r1, pivotRange.c1, pivotRange.r2, pivotRange.c2);
				cells.clearTableStyle();
				pivotRange.setOffset(offset);
				pivotTable.init();
				this.updatePivotTablesStyle(pivotRange);
			}
		}
	};
	Worksheet.prototype.inPivotTable = function (range) {
		return this.pivotTables.some(function (element) {
			return element.intersection(range);
		});
	};
	Worksheet.prototype.checkShiftPivotTable = function (range, offset) {
		return this.pivotTables.some(function (element) {
			return AscCommonExcel.c_oAscShiftType.Change === element.isIntersectForShift(range, offset);
		});
	};
	Worksheet.prototype.checkDeletePivotTables = function (range) {
		for (var i = 0; i < this.pivotTables.length; ++i) {
			if (this.pivotTables[i].intersection(range) && !this.pivotTables[i].getAllRange(this).inContains(range)) {
				return false;
			}
		}
		return true;
	};
	Worksheet.prototype.deletePivotTable = function (id) {
		for (var i = 0; i < this.pivotTables.length; ++i) {
			if (id === this.pivotTables[i].Get_Id()) {
				this.clearPivotTable(this.pivotTables[i]);
				this.pivotTables.splice(i, 1);
				break;
			}
		}
	};
	Worksheet.prototype.deletePivotTables = function (range) {
		for (var i = 0; i < this.pivotTables.length; ++i) {
			if (this.pivotTables[i].intersection(range)) {
				this.clearPivotTable(this.pivotTables[i]);
				History.Add(new AscDFH.CChangesPivotTableDefinitionDelete(this.pivotTables[i]));
				this.pivotTables.splice(i--, 1);
			}
		}
		return true;
	};
	Worksheet.prototype.getPivotTable = function (col, row) {
		var res = null;
		for (var i = 0; i < this.pivotTables.length; ++i) {
			if (this.pivotTables[i].contains(col, row)) {
				res = this.pivotTables[i];
				break;
			}
		}
		return res;
	};
	Worksheet.prototype.getPivotTableByName = function (name) {
		var res = null;
		for (var i = 0; i < this.pivotTables.length; ++i) {
			if (this.pivotTables[i].asc_getName() === name) {
				res = this.pivotTables[i];
				break;
			}
		}
		return res;
	};
	Worksheet.prototype.insertPivotTable = function (pivotTable) {
		pivotTable.worksheet = this;
		this.pivotTables.push(pivotTable);
	};
	Worksheet.prototype.getPivotTableButtons = function (range) {
		var res = [];
		var pivotTable, pivotRange, j, pos, countC, countCWValues, countR, cell;
		for (var i = 0; i < this.pivotTables.length; ++i) {
			pivotTable = this.pivotTables[i];
			if (!pivotTable.intersection(range)) {
				continue;
			}

			for (j = 0; j < pivotTable.pageFieldsPositions.length; ++j) {
				pos = pivotTable.pageFieldsPositions[j];
				cell = new AscCommon.CellBase(pos.row, pos.col + 1);
				if (range.contains2(cell)) {
					res.push(cell);
				}
			}

			if (false !== pivotTable.showHeaders) {
				countC = pivotTable.getColumnFieldsCount();
				countCWValues = pivotTable.getColumnFieldsCount(true);
				countR = pivotTable.getRowFieldsCount(true);
				pivotRange = pivotTable.getRange();

				if (countR) {
					countR = pivotTable.hasCompact() ? 1 : countR;
					pos = pivotRange.r1 + pivotTable.getFirstHeaderRow0();
					for (j = 0; j < countR; ++j) {
						cell = new AscCommon.CellBase(pos, pivotRange.c1 + j);
						if (range.contains2(cell)) {
							res.push(cell);
						}
					}
				}
				if (countCWValues) {
					countC = pivotTable.hasCompact() ? 1 : countC;
					pos = pivotRange.c1 + pivotTable.getFirstDataCol();
					for (j = 0; j < countC; ++j) {
						cell = new AscCommon.CellBase(pivotRange.r1, pos + j);
						if (range.contains2(cell)) {
							res.push(cell);
						}
					}
				}
			}
		}
		return res;
	};
	Worksheet.prototype.getPivotTablesClearRanges = function (range) {
		// For outline and compact pivot tables layout we need clear the grid
		var pivotTable, pivotRange, intersection, res = [];
		for (var i = 0; i < this.pivotTables.length; ++i) {
			pivotTable = this.pivotTables[i];
			if (pivotTable.clearGrid) {
				pivotRange = pivotTable.getRange();
				if (intersection = pivotRange.intersectionSimple(range)) {
					res.push(intersection);
					res.push(pivotRange);
				}
			}
		}
		return res;
	};
	Worksheet.prototype.getDisablePrompts = function () {
		return this.dataValidations && this.dataValidations.disablePrompts;
	};
	Worksheet.prototype.getDataValidation = function (c, r) {
		if (!this.dataValidations) {
			return null;
		}
		for (var i = 0; i < this.dataValidations.elems.length; ++i) {
			if (this.dataValidations.elems[i].contains(c, r)) {
				return this.dataValidations.elems[i];
			}
		}
		return null;
	};
	// ----- Search -----
	Worksheet.prototype.clearFindResults = function () {
		this.lastFindOptions = null;
	};
	Worksheet.prototype._findAllCells = function (options) {
		if (true !== options.isMatchCase) {
			options.findWhat = options.findWhat.toLowerCase();
		}

		if(options.isWholeWord) {
			var length = options.findWhat.length;
			options.findWhat = '\\b' + options.findWhat + '\\b';
			options.findWhat = new RegExp(options.findWhat, "g");
			options.findWhat.length = length;
		}
		var selectionRange = options.selectionRange || this.selectionRange;
		var lastRange = selectionRange.getLast();
		var activeCell = selectionRange.activeCell;
		var merge = this.getMergedByCell(activeCell.row, activeCell.col);
		options.findInSelection = options.scanOnOnlySheet &&
			!(selectionRange.isSingleRange() && (lastRange.isOneCell() || lastRange.isEqual(merge)));
		var findRange = options.findInSelection ? this.getRange3(lastRange.r1, lastRange.c1, lastRange.r2, lastRange.c2) :
			this.getRange3(0, 0, this.getRowsCount(), this.getColsCount());

		if (this.lastFindOptions && this.lastFindOptions.findResults && options.isEqual2(this.lastFindOptions) &&
			findRange.getBBox0().isEqual(this.lastFindOptions.findRange)) {
			return;
		}

		var oldResults = this.lastFindOptions && this.lastFindOptions.findResults.isNotEmpty();
		var result = new AscCommonExcel.findResults(), tmp;
		findRange._foreachNoEmpty(function (cell, r, c) {
			if (!cell.isNullText() && cell.isEqual(options)) {
				if (!options.scanByRows) {
					tmp = r;
					r = c;
					c = tmp;
				}
				result.add(r, c, cell);
			}
		});
		this.lastFindOptions = options.clone();
		// ToDo support multiselect
		this.lastFindOptions.findRange = findRange.getBBox0().clone();
		this.lastFindOptions.findResults = result;

		if (!options.isReplaceAll && this.workbook.oApi.selectSearchingResults && (oldResults || result.isNotEmpty()) &&
			this === this.workbook.getActiveWs()) {
			this.workbook.handlers.trigger("drawWS");
		}
	};
	Worksheet.prototype.findCellText = function (options) {
		this._findAllCells(options);

		var selectionRange = options.selectionRange || this.selectionRange;
		var activeCell = selectionRange.activeCell;

		var tmp, key1 = activeCell.row, key2 = activeCell.col;
		if (!options.scanByRows) {
			tmp = key1;
			key1 = key2;
			key2 = tmp;
		}

		var result = null;
		var findResults = this.lastFindOptions.findResults;
		if (findResults.find(key1, key2, options.scanForward)) {
			key1 = findResults.currentKey1;
			key2 = findResults.currentKey2;
			if (!options.scanByRows) {
				tmp = key1;
				key1 = key2;
				key2 = tmp;
			}
			result = new AscCommon.CellBase(key1, key2);
		}
		return result;
	};
	Worksheet.prototype.inFindResults = function (row, col) {
		var tmp, res = false;
		var findResults = this.lastFindOptions && this.lastFindOptions.findResults;
		if (findResults) {
			if (!this.lastFindOptions.scanByRows) {
				tmp = col;
				col = row;
				row = tmp;
			}
			res = findResults.contains(row, col);
		}
		return res;
	};
	Worksheet.prototype.excludeHiddenRows = function (bExclude) {
		this.bExcludeHiddenRows = bExclude;
	};
	Worksheet.prototype.ignoreWriteFormulas = function (val) {
		this.bIgnoreWriteFormulas = val;
	};
	Worksheet.prototype.checkShiftArrayFormulas = function (range, offset) {
		//проверка на частичный сдвиг формулы массива
		//проверка на внутренний сдвиг
		var res = true;

		var isHor = offset && offset.col;
		var isDelete = offset && (offset.col < 0 || offset.row < 0);

		var checkRange = function(formulaRange) {
			//частичное выделение при удалении столбца/строки
			if(isDelete && formulaRange.intersection(range) && !range.containsRange(formulaRange)) {
				return false;
			}

			if (isHor) {
				if(range.r1 > formulaRange.r1 && range.r1 <= formulaRange.r2) {
					return false;
				}
				if(range.r2 >= formulaRange.r1 && range.r2 < formulaRange.r2) {
					return false;
				}
				if(range.c1 > formulaRange.c1 && range.c1 <= formulaRange.c2) {
					return false;
				}
				/*if(range.c1 < formulaRange.c1 && range.c2 >= formulaRange.c1 && range.c2 < formulaRange.c2) {
					return false;
				}*/
			} else {
				if(range.c1 > formulaRange.c1 && range.c1 <= formulaRange.c2) {
					return false;
				}
				if(range.c2 >= formulaRange.c1 && range.c2 < formulaRange.c2) {
					return false;
				}
				if(range.r1 > formulaRange.r1 && range.r1 <= formulaRange.r2) {
					return false;
				}
				/*if(range.r1 < formulaRange.r1 && range.r2 >= formulaRange.r1 && range.r2 < formulaRange.r2) {
					return false;
				}*/
			}

			return true;
		};

		//if intersection with range
		var alreadyCheckFormulas = [];
		var r2 = range.r2, c2 = range.c2;
		if(isHor) {
			c2 = gc_nMaxCol0;
		} else {
			r2 = gc_nMaxRow0;
		}

		this.getRange3(range.r1, range.c1, r2, c2)._foreachNoEmpty(function(cell) {
			if(res && cell.isFormula()) {
				var formulaParsed = cell.getFormulaParsed();
				var arrayFormulaRef = formulaParsed.getArrayFormulaRef();
				if(arrayFormulaRef && !alreadyCheckFormulas[formulaParsed._index]) {
					if(!checkRange(arrayFormulaRef)) {
						res = false;
					}
					alreadyCheckFormulas[formulaParsed._index] = 1;
				}
			}
		});

		return res;
	};
	Worksheet.prototype.setRowsCount = function (val) {
		if(val > gc_nMaxRow0 || val < 0) {
			return;
		}
		this.nRowsCount = val;
	};
	Worksheet.prototype.fromXLSB = function(stream, type, tmp, aCellXfs, aSharedStrings, fInitCellAfterRead) {
		stream.XlsbSkipRecord();//XLSB::rt_BEGIN_SHEET_DATA

		var oldPos = -1;
		while (oldPos !== stream.GetCurPos()) {
			oldPos = stream.GetCurPos();
			type = stream.XlsbReadRecordType();
			if (AscCommonExcel.XLSB.rt_CELL_BLANK <= type && type <= AscCommonExcel.XLSB.rt_FMLA_ERROR) {
				tmp.cell.clear();
				tmp.formula.clean();
				tmp.cell.fromXLSB(stream, type, tmp.row.index, aCellXfs, aSharedStrings, tmp);
				fInitCellAfterRead(tmp);
			}
			else if (AscCommonExcel.XLSB.rt_ROW_HDR === type) {
				tmp.row.clear();
				tmp.row.fromXLSB(stream, aCellXfs);
				tmp.row.saveContent();
				tmp.ws.cellsByColRowsCount = Math.max(tmp.ws.cellsByColRowsCount, tmp.row.index + 1);
				tmp.ws.nRowsCount = Math.max(tmp.ws.nRowsCount, tmp.ws.cellsByColRowsCount);
			}
			else if (AscCommonExcel.XLSB.rt_END_SHEET_DATA === type) {
				stream.XlsbSkipRecord();
				break;
			}
			else {
				stream.XlsbSkipRecord();
			}
		}
	};
	//need recalculate formulas after change rows
	Worksheet.prototype.needRecalFormulas = function(start, stop) {
		//TODO в данном случае необходим пересчёт только тез формул, которые зависят от данных строк + те, которые
		// меняют своё значение в зависимости от скрытия/раскрыватия строк
		var res = false;

		if(this.AutoFilter && this.AutoFilter.isApplyAutoFilter()) {
			return true;
		}

		var tableParts = this.TableParts;
		var tablePart;
		for (var i = 0; i < tableParts.length; i++) {
			tablePart = tableParts[i];
			if (tablePart && tablePart.Ref && start >= tablePart.Ref.r1 && stop <= tablePart.Ref.r2) {
				res = true;
				break;
			}
		}

		return res;
	};

	Worksheet.prototype.getRowColColors = function (columnRange, byRow, notCheckOneColor) {
		var ws = this;
		var res = {text: true, colors: [], fontColors: []};
		var alreadyAddColors = {}, alreadyAddFontColors = {};

		var getAscColor = function (color) {
			var ascColor = new Asc.asc_CColor();
			ascColor.asc_putR(color.getR());
			ascColor.asc_putG(color.getG());
			ascColor.asc_putB(color.getB());
			ascColor.asc_putA(color.getA());

			return ascColor;
		};

		var addFontColorsToArray = function (fontColor) {
			var rgb = fontColor && null !== fontColor  ? fontColor.getRgb() : null;
			if(rgb === 0) {
				rgb = null;
			}
			var isDefaultFontColor = null === rgb;

			if (true !== alreadyAddFontColors[rgb]) {
				if (isDefaultFontColor) {
					res.fontColors.push(null);
					alreadyAddFontColors[null] = true;
				} else {
					var ascFontColor = getAscColor(fontColor);
					res.fontColors.push(ascFontColor);
					alreadyAddFontColors[rgb] = true;
				}
			}
		};

		var addCellColorsToArray = function (color) {
			var rgb = null !== color && color.fill && color.fill.bg() ? color.fill.bg().getRgb() : null;
			var isDefaultCellColor = null === rgb;

			if (true !== alreadyAddColors[rgb]) {
				if (isDefaultCellColor) {
					res.colors.push(null);
					alreadyAddColors[null] = true;
				} else {
					var ascColor = getAscColor(color.fill.bg());
					res.colors.push(ascColor);
					alreadyAddColors[rgb] = true;
				}
			}
		};

		var tempText = 0, tempDigit = 0;
		var r1 = byRow ? columnRange.r1 : columnRange.r1;
		var r2 = byRow ? columnRange.r1 : columnRange.r2;
		var c1 = byRow ? columnRange.c1 : columnRange.c1;
		var c2 = byRow ? columnRange.c2 : columnRange.c1;
		ws.getRange3(r1, c1, r2, c2)._foreachNoEmpty(function(cell) {
			//добавляем без цвета ячейку
			if (!cell) {
				if (true !== alreadyAddColors[null]) {
					alreadyAddColors[null] = true;
					res.colors.push(null);
				}
				return;
			}

			if (false === cell.isNullText()) {
				var type = cell.getType();

				if (type === 0) {
					tempDigit++;
				} else {
					tempText++;
				}
			}

			//font colors
			var multiText = cell.getValueMultiText();
			var fontColor = null;
			var xfs = cell.getCompiledStyleCustom(false, true, true);
			if (null !== multiText) {
				for (var j = 0; j < multiText.length; j++) {
					fontColor = multiText[j].format ? multiText[j].format.getColor() : null;
					if(null !== fontColor) {
						addFontColorsToArray(fontColor);
					} else {
						fontColor = xfs && xfs.font ? xfs.font.getColor() : null;
						addFontColorsToArray(fontColor);
					}
				}
			} else {
				fontColor = xfs && xfs.font ? xfs.font.getColor() : null;
				addFontColorsToArray(fontColor);
			}

			//cell colors
			addCellColorsToArray(xfs);
		});

		//если один элемент в массиве, не отправляем его в меню
		if (res.colors.length === 1 && !notCheckOneColor) {
			res.colors = [];
		}
		if (res.fontColors.length === 1 && !notCheckOneColor) {
			res.fontColors = [];
		}

		res.text = tempDigit <= tempText;

		return res;
	};

	Worksheet.prototype.updateSortStateOffset = function (range, offset) {
		if(!this.sortState) {
			return;
		}
		var bAlreadyDel = false;
		if (offset.row < 0 || offset.col < 0) {
			//смотрим, не попал ли в выделение целиком
			bAlreadyDel = this.deleteSortState(range);
		}
		if(!bAlreadyDel) {
			var bboxShift = AscCommonExcel.shiftGetBBox(range, 0 !== offset.col);
			this.sortState.shift(range, offset, this, true);
			this.moveSortState(bboxShift, offset);
		}
	};

	Worksheet.prototype.deleteSortState = function (range) {
		if(this.sortState && range.containsRange(this.sortState.Ref)) {
			this._deleteSortState();
			return true;
		}
		return false;
	};

	Worksheet.prototype._deleteSortState = function () {
		var oldSortState = this.sortState.clone();
		this.sortState = null;
		History.Add(AscCommonExcel.g_oUndoRedoSortState, AscCH.historyitem_SortState_Add, this.getId(), null,
			new AscCommonExcel.UndoRedoData_SortState(oldSortState, null));
		return true;
	};

	Worksheet.prototype.moveSortState = function (range, offset) {
		if(this.sortState && range.containsRange(this.sortState.Ref)) {
			this.sortState.setOffset(offset, this, true);
			return true;
		}
		return false;
	};


//-------------------------------------------------------------------------------------------------
	var g_nCellOffsetFlag = 0;
	var g_nCellOffsetXf = g_nCellOffsetFlag + 1;
	var g_nCellOffsetFormula = g_nCellOffsetXf + 4;
	var g_nCellOffsetValue = g_nCellOffsetFormula + 4;
	var g_nCellStructSize = g_nCellOffsetValue + 8;

	var g_nCellFlag_empty = 0;
	var g_nCellFlag_init = 1;
	var g_nCellFlag_typeMask = 6;
	var g_nCellFlag_valueMask = 24;
	var g_nCellFlag_isDirtyMask = 32;
	var g_nCellFlag_isCalcMask = 64;
	/**
	 * @constructor
	 */
	function Cell(worksheet){
		this.ws = worksheet;
		this.nRow = -1;
		this.nCol = -1;
		this.xfs = null;
		this.formulaParsed = null;

		this.type = CellValueType.Number;
		this.number = null;
		this.text = null;
		this.multiText = null;
		this.textIndex = null;

		this.isDirty = false;
		this.isCalc = false;

		this._hasChanged = false;
	}
	Cell.prototype.clear = function(keepIndex) {
			this.nRow = -1;
			this.nCol = -1;
		this.clearData();

		this._hasChanged = false;
	};
	Cell.prototype.clearData = function() {
		this.xfs = null;
		this.formulaParsed = null;

		this.type = CellValueType.Number;
		this.number = null;
		this.text = null;
		this.multiText = null;
		this.textIndex = null;

		this.isDirty = false;
		this.isCalc = false;

		this._hasChanged = true;
	};
	Cell.prototype.clearDataKeepXf = function(border) {
		var xfs = this.xfs;
		this.clearData();
		this.xfs = xfs;
		History.TurnOff();
		this.setBorder(border);
		History.TurnOn();
	};
	Cell.prototype.saveContent = function(opt_inCaseOfChange) {
		if (this.hasRowCol() && (!opt_inCaseOfChange || this._hasChanged)) {
			this._hasChanged = false;
			var wb = this.ws.workbook;
			var sheetMemory = this.ws.getColData(this.nCol);
			sheetMemory.checkSize(this.nRow);
			var xfSave = this.xfs ? this.xfs.getIndexNumber() : 0;
			var numberSave = 0;
			var formulaSave = this.formulaParsed ? wb.workbookFormulas.add(this.formulaParsed).getIndexNumber() :  0;
			var flagValue = 0;
			if (null != this.number) {
				flagValue = 1;
				sheetMemory.setFloat64(this.nRow, g_nCellOffsetValue, this.number);
			} else if (null != this.text) {
				flagValue = 2;
				numberSave = this.getTextIndex();
				sheetMemory.setUint32(this.nRow, g_nCellOffsetValue, numberSave);
			} else if (null != this.multiText) {
				flagValue = 3;
				numberSave = this.getTextIndex();
				sheetMemory.setUint32(this.nRow, g_nCellOffsetValue, numberSave);
			}
			sheetMemory.setUint8(this.nRow, g_nCellOffsetFlag, this._toFlags(flagValue));
			sheetMemory.setUint32(this.nRow, g_nCellOffsetXf, xfSave);
			sheetMemory.setUint32(this.nRow, g_nCellOffsetFormula, formulaSave);
		}
	};
	Cell.prototype.loadContent = function(row, col, opt_sheetMemory) {
		var res = false;
		this.clear();
		this.nRow = row;
		this.nCol = col;
		var sheetMemory = opt_sheetMemory ? opt_sheetMemory : this.ws.getColDataNoEmpty(this.nCol);
		if (sheetMemory) {
			if (sheetMemory.hasSize(this.nRow)) {
				var flags = sheetMemory.getUint8(this.nRow, g_nCellOffsetFlag);
				if (0 != (g_nCellFlag_init & flags)) {
					var wb = this.ws.workbook;
					var flagValue = this._fromFlags(flags);
					this.xfs = g_StyleCache.getXf(sheetMemory.getUint32(this.nRow, g_nCellOffsetXf));
					this.formulaParsed = wb.workbookFormulas.get(sheetMemory.getUint32(this.nRow, g_nCellOffsetFormula));
					if (1 === flagValue) {
						this.number = sheetMemory.getFloat64(this.nRow, g_nCellOffsetValue);
					} else if (2 === flagValue) {
						this.textIndex = sheetMemory.getUint32(this.nRow, g_nCellOffsetValue);
						this.text = wb.sharedStrings.get(this.textIndex);
					} else if (3 === flagValue) {
						this.textIndex = sheetMemory.getUint32(this.nRow, g_nCellOffsetValue);
						this.multiText = wb.sharedStrings.get(this.textIndex);
					}
					res = true;
				}
			}
		}
		return res;
	};
	Cell.prototype._toFlags = function(flagValue) {
		var flags = g_nCellFlag_init | (this.type << 1) | (flagValue << 3);
		if(this.isDirty){
			flags |= g_nCellFlag_isDirtyMask;
		}
		if(this.isCalc){
			flags |= g_nCellFlag_isCalcMask;
		}
		return flags;
	};
	Cell.prototype._fromFlags = function(flags) {
		this.type = (flags & g_nCellFlag_typeMask) >>> 1;
		this.isDirty = 0 != (flags & g_nCellFlag_isDirtyMask);
		this.isCalc = 0 != (flags & g_nCellFlag_isCalcMask);
		return (flags & g_nCellFlag_valueMask) >>> 3;
	};
	Cell.prototype.processFormula = function(callback) {
		if (this.formulaParsed) {
			var shared = this.formulaParsed.getShared();
			var offsetRow, offsetCol;
			if (shared) {
				offsetRow = this.nRow - shared.base.nRow;
				offsetCol = this.nCol - shared.base.nCol;
				if (0 !== offsetRow || 0 !== offsetCol) {
					var oldRow = this.formulaParsed.parent.nRow;
					var oldCol = this.formulaParsed.parent.nCol;

					//todo assemble by param
					var old = AscCommonExcel.g_ProcessShared;
					AscCommonExcel.g_ProcessShared = true;
					var offsetShared = new AscCommon.CellBase(offsetRow, offsetCol);
					this.formulaParsed.changeOffset(offsetShared, false);
					this.formulaParsed.parent.nRow = this.nRow;
					this.formulaParsed.parent.nCol = this.nCol;
					callback(this.formulaParsed);
					offsetShared.row = -offsetRow;
					offsetShared.col = -offsetCol;
					this.formulaParsed.changeOffset(offsetShared, false);
					this.formulaParsed.parent.nRow = oldRow;
					this.formulaParsed.parent.nCol = oldCol;
					AscCommonExcel.g_ProcessShared = old;
				} else {
					callback(this.formulaParsed);
				}
			} else {
				callback(this.formulaParsed);
			}
		}
	};
	Cell.prototype.setChanged = function(val) {
		this._hasChanged = val;
	};
	Cell.prototype.getStyle=function(){
		return this.xfs;
	};
	Cell.prototype.getCompiledStyle = function (opt_styleComponents) {
		return this.ws.getCompiledStyle(this.nRow, this.nCol, this, opt_styleComponents);
	};
	Cell.prototype.getCompiledStyleCustom = function(needTable, needCell, needConditional) {
		return this.ws.getCompiledStyleCustom(this.nRow, this.nCol, needTable, needCell, needConditional, this);
	};
	Cell.prototype.getTableStyle = function () {
		var hiddenManager = this.ws.hiddenManager;
		var sheetMergedStyles = this.ws.sheetMergedStyles;
		var styleComponents = sheetMergedStyles.getStyle(hiddenManager, this.nRow, this.nCol, this.ws);
		return getCompiledStyleFromArray(null, styleComponents.table);
	};
	Cell.prototype.duplicate=function(){
		var t = this;
		var oNewCell = new Cell(this.ws);
		oNewCell.nRow = this.nRow;
		oNewCell.nCol = this.nCol;
		oNewCell.xfs = this.xfs;
		oNewCell.type = this.type;
		oNewCell.number = this.number;
		oNewCell.text = this.text;
		oNewCell.multiText = this.multiText;
		this.processFormula(function(parsed) {
			//todo without parse
			var newFormula = new parserFormula(parsed.getFormula(), oNewCell, t.ws);
			AscCommonExcel.executeInR1C1Mode(false, function () {
				newFormula.parse();
			});
			var arrayFormulaRef = parsed.getArrayFormulaRef();
			if(arrayFormulaRef) {
				newFormula.setArrayFormulaRef(arrayFormulaRef);
			}
			oNewCell.setFormulaInternal(newFormula);
		});
		return oNewCell;
	};
	Cell.prototype.clone=function(oNewWs, renameParams){
		if(!oNewWs)
			oNewWs = this.ws;
		var oNewCell = new Cell(oNewWs);
		oNewCell.nRow = this.nRow;
		oNewCell.nCol = this.nCol;
		if(null != this.xfs)
			oNewCell.xfs = this.xfs;
		oNewCell.type = this.type;
		oNewCell.number = this.number;
		oNewCell.text = this.text;
		oNewCell.multiText = this.multiText;
		this.processFormula(function(parsed) {
			var newFormula;
			if (oNewWs != this.ws && renameParams) {
				var formula = parsed.clone(null, null, this.ws);
				formula.renameSheetCopy(renameParams);
				newFormula = formula.assemble(true);
			} else {
				newFormula = parsed.getFormula();
			}
			oNewCell.setFormulaInternal(new parserFormula(newFormula, oNewCell, oNewWs));
			oNewWs.workbook.dependencyFormulas.addToBuildDependencyCell(oNewCell);
		});
		return oNewCell;
	};
	Cell.prototype.setRowCol=function(nRow, nCol){
		this.nRow = nRow;
		this.nCol = nCol;
	};
	Cell.prototype.hasRowCol = function() {
		return this.nRow >= 0 && this.nCol >= 0;
	};
	Cell.prototype.isEqual = function (options) {
		var cellText;
		cellText = (options.lookIn === Asc.c_oAscFindLookIn.Formulas) ? this.getValueForEdit() : this.getValue();
		if (true !== options.isMatchCase) {
			cellText = cellText.toLowerCase();
		}
		var isWordEnter = cellText.indexOf(options.findWhat);
		if (options.findWhat instanceof RegExp && options.isWholeWord) {
			isWordEnter = cellText.search(options.findWhat);
		}
		return (0 <= isWordEnter) &&
		(true !== options.isWholeCell || options.findWhat.length === cellText.length);
	
	};
	Cell.prototype.isNullText=function(){
		return this.isNullTextString() && !this.formulaParsed;
	};
	Cell.prototype.isEmptyTextString = function() {
		this._checkDirty();
		if(null != this.number || (null != this.text && "" != this.text))
			return false;
		if(null != this.multiText && "" != AscCommonExcel.getStringFromMultiText(this.multiText))
			return false;
		return true;
	};
	Cell.prototype.isNullTextString = function() {
		this._checkDirty();
		return null === this.number && null === this.text && null === this.multiText;
	};
	Cell.prototype.isEmpty=function(){
		if(false == this.isNullText())
			return false;
		if(null != this.xfs)
			return false;
		return true;
	};
	Cell.prototype.isFormula=function(){
		return this.formulaParsed ? true : false;
	};
	Cell.prototype.getName=function(){
		return g_oCellAddressUtils.getCellId(this.nRow, this.nCol);
	};
	Cell.prototype.setTypeInternal=function(val) {
		this.type = val;
		this._hasChanged = true;
	};
	Cell.prototype.correctValueByType = function() {
		//todo implemented only Number->String. other is stub
		switch (this.type) {
			case CellValueType.Number:
				if (null !== this.text) {
					this.setValueNumberInternal(parseInt(this.text) || 0);
				} else if (null !== this.multiText) {
					this.setValueNumberInternal(0);
				}
				break;
			case CellValueType.Bool:
				if (null !== this.text || null !== this.multiText) {
					this.setValueNumberInternal(0);
				}
				break;
			case CellValueType.String:
				if (null !== this.number) {
					this.setValueTextInternal(this.number.toString());
				}
				break;
			case CellValueType.Error:
				if (null !== this.number) {
					this.setValueTextInternal(cErrorOrigin["nil"]);
				}
				break;
		}
	};
	Cell.prototype.setValueNumberInternal=function(val) {
		this.number = val;
		this.text = null;
		this.multiText = null;
		this.textIndex = null;
		this._hasChanged = true;
	};
	Cell.prototype.setValueTextInternal=function(val) {
		this.number = null;
		this.text = val;
		this.multiText = null;
		this.textIndex = null;
		this._hasChanged = true;
	};
	Cell.prototype.setValueMultiTextInternal=function(val) {
		this.number = null;
		this.text = null;
		this.multiText = val;
		this.textIndex = null;
		this._hasChanged = true;
	};
	Cell.prototype.setValue=function(val,callback, isCopyPaste, byRef) {
		var ws = this.ws;
		var wb = ws.workbook;
		var DataOld = null;
		if (History.Is_On()) {
			DataOld = this.getValueData();
		}
		var isFirstArrayFormulaCell = byRef && this.nCol === byRef.c1 && this.nRow === byRef.r1;
		var newFP = this.setValueGetParsed(val, callback, isCopyPaste, byRef);
		if (undefined === newFP) {
			return;
		}
		//удаляем старые значения
		this.cleanText();
		this.setFormulaInternal(null);

		if (newFP) {
			this.setFormulaInternal(newFP);
			if(byRef) {
				if(isFirstArrayFormulaCell) {
					wb.dependencyFormulas.addToBuildDependencyArray(newFP);
				}
			} else {
				wb.dependencyFormulas.addToBuildDependencyCell(this);
			}
		} else if (val) {
			this._setValue(val);
			wb.dependencyFormulas.addToChangedCell(this);
		} else {
			wb.dependencyFormulas.addToChangedCell(this);
		}

		var DataNew = null;
		if (History.Is_On()) {
			DataNew = this.getValueData();
		}
		if (History.Is_On() && false == DataOld.isEqual(DataNew)) {
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeValue, this.ws.getId(),
						new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow),
						new UndoRedoData_CellSimpleData(this.nRow, this.nCol, DataOld, DataNew));
		}
		//sortDependency вызывается ниже History.Add(AscCH.historyitem_Cell_ChangeValue, потому что в ней может быть выставлен формат ячейки(если это текстовый, то принимая изменения формула станет текстом)
		this.ws.workbook.sortDependency();
		if (!this.ws.workbook.dependencyFormulas.isLockRecal()) {
			this._adjustCellFormat();
		}

		//todo не должны удаляться ссылки, если сделать merge ее части.
		if (this.isNullTextString()) {
			var cell = this.ws.getCell3(this.nRow, this.nCol);
			cell.removeHyperlink();
		}
	};
	Cell.prototype.setValueGetParsed=function(val,callback, isCopyPaste, byRef) {
		var ws = this.ws;
		var wb = ws.workbook;
		var bIsTextFormat = false;
		if (!isCopyPaste) {
			var sNumFormat;
			if (null != this.xfs && null != this.xfs.num) {
				sNumFormat = this.xfs.num.getFormat();
			} else {
				sNumFormat = g_oDefaultFormat.Num.getFormat();
			}
			var numFormat = oNumFormatCache.get(sNumFormat);
			bIsTextFormat = numFormat.isTextFormat();
		}

		var isFirstArrayFormulaCell = byRef && this.nCol === byRef.c1 && this.nRow === byRef.r1;
		var newFP = null;
		if (false == bIsTextFormat) {
			/*
			 Устанавливаем значение в Range ячеек. При этом происходит проверка значения на формулу.
			 Если значение является формулой, то проверяем содержиться ли в ячейке формула или нет, если "да" - то очищаем в графе зависимостей список, от которых зависит формула(masterNodes), позже будет построен новый. Затем выставляем флаг о необходимости дальнейшего пересчета, и заносим ячейку в список пересчитываемых ячеек.
			 */
			if (null != val && val[0] == "=" && val.length > 1) {
				//***array-formula***
				if(byRef && !isFirstArrayFormulaCell) {
					newFP = this.ws.formulaArrayLink;
					if(newFP === null) {
						return;
					}
					if(this.nCol === byRef.c2 && this.nRow === byRef.r2) {
						this.ws.formulaArrayLink = null;
					}
				} else {
					var cellWithFormula = new CCellWithFormula(this.ws, this.nRow, this.nCol);
					newFP = new parserFormula(val.substring(1), cellWithFormula, this.ws);

					var formulaLocaleParse = isCopyPaste === true ? false : oFormulaLocaleInfo.Parse;
					var formulaLocaleDigetSep = isCopyPaste === true ? false : oFormulaLocaleInfo.DigitSep;
					var parseResult = new AscCommonExcel.ParseResult();
					if (!newFP.parse(formulaLocaleParse, formulaLocaleDigetSep, parseResult)) {
						switch (parseResult.error) {
							case c_oAscError.ID.FrmlWrongFunctionName:
								break;
							case c_oAscError.ID.FrmlParenthesesCorrectCount:
								return this.setValueGetParsed("=" + newFP.getFormula(), callback, isCopyPaste, byRef);
							default :
							{
								wb.handlers.trigger("asc_onError", parseResult.error, c_oAscError.Level.NoCritical);
								if (callback) {
									callback(false);
								}
								return;
							}
						}
					} else {
						newFP.setFormulaString(newFP.assemble());
						//***array-formula***
						if(byRef) {
							newFP.ref = byRef;
							this.ws.formulaArrayLink = newFP;
						}
					}
				}
			}
		}
		return newFP;
	};
	Cell.prototype.setValue2=function(array){
		var DataOld = null;
		if(History.Is_On())
			DataOld = this.getValueData();
		//[{text:"",format:TextFormat},{}...]
		this.setFormulaInternal(null);
		this.cleanText();
		this._setValue2(array);
		this.ws.workbook.dependencyFormulas.addToChangedCell(this);
		this.ws.workbook.sortDependency();
		var DataNew = null;
		if(History.Is_On())
			DataNew = this.getValueData();
		if(History.Is_On() && false == DataOld.isEqual(DataNew))
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeValue, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, DataOld, DataNew));
		//todo не должны удаляться ссылки, если сделать merge ее части.
		if(this.isNullTextString())
		{
			var cell = this.ws.getCell3(this.nRow, this.nCol);
			cell.removeHyperlink();
		}
	};
	Cell.prototype.cloneAndSetValue = function(array, formula, callback, isCopyPaste, byRef) {
		var cell = new Cell(this.ws);
		cell.nRow = this.nRow;
		cell.nCol = this.nCol;
		cell.xfs = this.xfs;
		cell.setFormulaInternal(null);
		cell.cleanText();
		if (formula) {
			var newFP = cell.setValueGetParsed(formula, callback, isCopyPaste, byRef);
			this.ws.formulaArrayLink = null;//todo
			if (newFP) {
				cell.setFormulaInternal(newFP);
				newFP.calculate();
				cell._updateCellValue();
			} else if (undefined !== newFP) {
				cell._setValue(formula);
			}
		} else {
			cell._setValue2(array);
		}
		return cell;
	};
	Cell.prototype.setFormulaTemplate = function(bHistoryUndo, action) {
		var DataOld = null;
		var DataNew = null;
		if (History.Is_On())
			DataOld = this.getValueData();

		this.cleanText();
		action(this);

		if (History.Is_On()) {
			DataNew = this.getValueData();
			if (false == DataOld.isEqual(DataNew)){
				var typeHistory = bHistoryUndo ? AscCH.historyitem_Cell_ChangeValueUndo : AscCH.historyitem_Cell_ChangeValue;
				History.Add(AscCommonExcel.g_oUndoRedoCell, typeHistory, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, DataOld, DataNew), bHistoryUndo);}
		}
	};
	Cell.prototype.setFormula = function(formula, bHistoryUndo, formulaRef) {
		var cellWithFormula = new CCellWithFormula(this.ws, this.nRow, this.nCol);
		var parser = new parserFormula(formula, cellWithFormula, this.ws);
		if(formulaRef) {
			parser.setArrayFormulaRef(formulaRef);
			this.ws.getRange3(formulaRef.r1, formulaRef.c1, formulaRef.r2, formulaRef.c2)._foreachNoEmpty(function(cell){
				cell.setFormulaParsed(parser, bHistoryUndo);
			});
		} else {
			this.setFormulaParsed(parser, bHistoryUndo);
		}
	};
	Cell.prototype.setFormulaParsed = function(parsed, bHistoryUndo) {
		this.setFormulaTemplate(bHistoryUndo, function(cell){
			cell.setFormulaInternal(parsed);
			cell.ws.workbook.dependencyFormulas.addToBuildDependencyCell(cell);
		});
	};
	Cell.prototype.setFormulaInternal = function(formula, dontTouchPrev) {
		if (!dontTouchPrev && this.formulaParsed) {
			var shared = this.formulaParsed.getShared();
			var arrayFormula = this.formulaParsed.getArrayFormulaRef();
			if (shared) {
				if (shared.ref.isOnTheEdge(this.nCol, this.nRow)) {
					this.ws.workbook.dependencyFormulas.addToChangedShared(this.formulaParsed);
				}
				var index = this.ws.workbook.workbookFormulas.add(this.formulaParsed).getIndexNumber();
				History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_RemoveSharedFormula, this.ws.getId(),
					new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, index, null), true);
			} else if(arrayFormula && this.formulaParsed.checkFirstCellArray(this)) {
				//***array-formula***
				var fText = "=" + this.formulaParsed.getFormula();
				History.Add(AscCommonExcel.g_oUndoRedoArrayFormula, AscCH.historyitem_ArrayFromula_DeleteFormula, this.ws.getId(),
					new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new AscCommonExcel.UndoRedoData_ArrayFormula(arrayFormula, fText), true);
			} else {
				this.formulaParsed.removeDependencies();
			}
		}
		this.formulaParsed = formula;
		this._hasChanged = true;
	};
	Cell.prototype.transformSharedFormula = function() {
		var res = false;
		var parsed = this.formulaParsed;
		if (parsed) {
			var shared = parsed.getShared();
			if (shared) {
				var offsetShared = new AscCommon.CellBase(this.nRow - shared.base.nRow, this.nCol - shared.base.nCol);
				var cellWithFormula = new AscCommonExcel.CCellWithFormula(this.ws, this.nRow, this.nCol);
				var newFormula = parsed.clone(undefined, cellWithFormula);
				newFormula.removeShared();
				newFormula.changeOffset(offsetShared, false);
				newFormula.setFormulaString(newFormula.assemble(true));
				this.setFormulaInternal(newFormula);
				res = true;
			}
		}
		return res;
	};
	Cell.prototype.changeOffset = function(offset, canResize, bHistoryUndo) {
		this.setFormulaTemplate(bHistoryUndo, function(cell){
			cell.transformSharedFormula();
			var parsed = cell.getFormulaParsed();
			parsed.removeDependencies();
			parsed.changeOffset(offset, canResize);
			parsed.setFormulaString(parsed.assemble(true));
			parsed.buildDependencies();
		});
	};
	Cell.prototype.setType=function(type){
		if(type != this.type){
			var DataOld = this.getValueData();
			this.setTypeInternal(type);
			this.correctValueByType();
			this._hasChanged = true;
			var DataNew = this.getValueData();
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeValue, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, DataOld, DataNew));
		}
		return type;
	};
	Cell.prototype.getType=function(){
		this._checkDirty();
		return this.type;
	};
	Cell.prototype.setCellStyle=function(val){
		var newVal = this.ws.workbook.CellStyles._prepareCellStyle(val);
		var oRes = this.ws.workbook.oStyleManager.setCellStyle(this, newVal);
		if(History.Is_On()) {
			var oldStyleName = this.ws.workbook.CellStyles.getStyleNameByXfId(oRes.oldVal);
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Style, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oldStyleName, val));

			// Выставляем стиль
			var oStyle = this.ws.workbook.CellStyles.getStyleByXfId(oRes.newVal);
			if (oStyle.ApplyFont)
				this.setFont(oStyle.getFont());
			if (oStyle.ApplyFill)
				this.setFill(oStyle.getFill());
			if (oStyle.ApplyBorder)
				this.setBorder(oStyle.getBorder());
			if (oStyle.ApplyNumberFormat)
				this.setNumFormat(oStyle.getNumFormatStr());
		}
	};
	Cell.prototype.setNumFormat=function(val){
		this.setNum(new AscCommonExcel.Num({f:val}));
	};
	Cell.prototype.setNum=function(val){
		var oRes = this.ws.workbook.oStyleManager.setNum(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Num, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.shiftNumFormat=function(nShift, dDigitsCount){
		var bRes = false;
		var sNumFormat;
		if(null != this.xfs && null != this.xfs.num)
			sNumFormat = this.xfs.num.getFormat();
		else
			sNumFormat = g_oDefaultFormat.Num.getFormat();
		var type = this.getType();
		var oCurNumFormat = oNumFormatCache.get(sNumFormat);
		if (null != oCurNumFormat && false == oCurNumFormat.isGeneralFormat()) {
			var output = {};
			bRes = oCurNumFormat.shiftFormat(output, nShift);
			if (true == bRes) {
				this.setNumFormat(output.format);
			}
		} else if (CellValueType.Number == type) {
			var sGeneral = AscCommon.DecodeGeneralFormat(this.number, type, dDigitsCount);
			var oGeneral = oNumFormatCache.get(sGeneral);
			if (null != oGeneral && false == oGeneral.isGeneralFormat()) {
				var output = {};
				bRes = oGeneral.shiftFormat(output, nShift);
				if (true == bRes) {
					this.setNumFormat(output.format);
				}
			}
		}
		return bRes;
	};
	Cell.prototype.setFont=function(val, bModifyValue){
		if(false != bModifyValue)
		{
			//убираем комплексные строки
			if(null != this.multiText && false == this.ws.workbook.bUndoChanges && false == this.ws.workbook.bRedoChanges)
			{
				var oldVal = null;
				if(History.Is_On())
					oldVal = this.getValueData();
				this.setValueTextInternal(AscCommonExcel.getStringFromMultiText(this.multiText));
				if(History.Is_On())
				{
					var newVal = this.getValueData();
					History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeValue, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oldVal, newVal));
				}
			}
		}
		var oRes = this.ws.workbook.oStyleManager.setFont(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
		{
			var oldVal = null;
			if(null != oRes.oldVal)
				oldVal = oRes.oldVal.clone();
			var newVal = null;
			if(null != oRes.newVal)
				newVal = oRes.newVal.clone();
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_SetFont, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oldVal, newVal));
		}
	};
	Cell.prototype.setFontname=function(val){
		var oRes = this.ws.workbook.oStyleManager.setFontname(this, val);
		this._setFontProp(function(format){return val != format.getName();}, function(format){format.setName(val);});
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Fontname, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setFontsize=function(val){
		var oRes = this.ws.workbook.oStyleManager.setFontsize(this, val);
		this._setFontProp(function(format){return val != format.getSize();}, function(format){format.setSize(val);});
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Fontsize, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setFontcolor=function(val){
		var oRes = this.ws.workbook.oStyleManager.setFontcolor(this, val);
		this._setFontProp(function(format){return val != format.getColor();}, function(format){format.setColor(val);});
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Fontcolor, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setBold=function(val){
		var oRes = this.ws.workbook.oStyleManager.setBold(this, val);
		this._setFontProp(function(format){return val != format.getBold();}, function(format){format.setBold(val);});
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Bold, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setItalic=function(val){
		var oRes = this.ws.workbook.oStyleManager.setItalic(this, val);
		this._setFontProp(function(format){return val != format.getItalic();}, function(format){format.setItalic(val);});
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Italic, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setUnderline=function(val){
		var oRes = this.ws.workbook.oStyleManager.setUnderline(this, val);
		this._setFontProp(function(format){return val != format.getUnderline();}, function(format){format.setUnderline(val);});
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Underline, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setStrikeout=function(val){
		var oRes = this.ws.workbook.oStyleManager.setStrikeout(this, val);
		this._setFontProp(function(format){return val != format.getStrikeout();}, function(format){format.setStrikeout(val);});
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Strikeout, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setFontAlign=function(val){
		var oRes = this.ws.workbook.oStyleManager.setFontAlign(this, val);
		this._setFontProp(function(format){return val != format.getVerticalAlign();}, function(format){format.setVerticalAlign(val);});
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_FontAlign, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setAlignVertical=function(val){
		var oRes = this.ws.workbook.oStyleManager.setAlignVertical(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_AlignVertical, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setAlignHorizontal=function(val){
		var oRes = this.ws.workbook.oStyleManager.setAlignHorizontal(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_AlignHorizontal, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setFill=function(val){
		var oRes = this.ws.workbook.oStyleManager.setFill(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Fill, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setFillColor=function(val){
		var fill = new AscCommonExcel.Fill();
		fill.fromColor(val);
		return this.setFill(fill);
	};
	Cell.prototype.setBorder=function(val){
		var oRes = this.ws.workbook.oStyleManager.setBorder(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal){
			var oldVal = null;
			if(null != oRes.oldVal)
				oldVal = oRes.oldVal.clone();
			var newVal = null;
			if(null != oRes.newVal)
				newVal = oRes.newVal.clone();
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Border, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oldVal, newVal));
		}
	};
	Cell.prototype.setShrinkToFit=function(val){
		var oRes = this.ws.workbook.oStyleManager.setShrinkToFit(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ShrinkToFit, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setWrap=function(val){
		var oRes = this.ws.workbook.oStyleManager.setWrap(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Wrap, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setAngle=function(val){
		var oRes = this.ws.workbook.oStyleManager.setAngle(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Angle, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setVerticalText=function(val){
		var oRes = this.ws.workbook.oStyleManager.setVerticalText(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_Angle, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setQuotePrefix=function(val){
		var oRes = this.ws.workbook.oStyleManager.setQuotePrefix(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_SetQuotePrefix, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setPivotButton=function(val){
		var oRes = this.ws.workbook.oStyleManager.setPivotButton(this, val);
		if(History.Is_On() && oRes.oldVal != oRes.newVal)
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_SetPivotButton, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oRes.oldVal, oRes.newVal));
	};
	Cell.prototype.setStyle=function(xfs){
		var oldVal = this.xfs;
		this.setStyleInternal(xfs);
		if(History.Is_On() && oldVal != this.xfs)
		{
			History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_SetStyle, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, oldVal, this.xfs));
		}
	};
	Cell.prototype.setStyleInternal = function(xfs) {
		this.xfs = g_StyleCache.addXf(xfs);
		this._hasChanged = true;
	};
	Cell.prototype.getFormula=function(){
		var res = "";
		this.processFormula(function(parsed) {
			res = parsed.getFormula();
		});
		return res;
	};
	Cell.prototype.getFormulaParsed=function(){
		return this.formulaParsed;
	};
	Cell.prototype.getValueForEdit = function(checkFormulaArray) {
		this._checkDirty();
		//todo
		// if (CellValueType.Error == this.getType()) {
		// 	return this._getValueTypeError(textValueForEdit);
		// }
		var res = AscCommonExcel.getStringFromMultiText(this.getValueForEdit2());
		return this.formulaParsed && this.formulaParsed.ref && checkFormulaArray ? "{" + res + "}" : res;
	};
	Cell.prototype.getValueForEdit2 = function() {
		this._checkDirty();
		var cultureInfo = AscCommon.g_oDefaultCultureInfo;
		//todo проблема точности. в excel у чисел только 15 значащих цифр у нас больше.
		//применяем форматирование
		var oValueText = null;
		var oValueArray = null;
		var xfs = this.getCompiledStyle();
		if (this.isFormula()) {
			this.processFormula(function(parsed) {
				// ToDo если будет притормаживать, то завести переменную и не рассчитывать каждый раз!
				oValueText = "=" + parsed.assembleLocale(AscCommonExcel.cFormulaFunctionToLocale, true);
			});
		} else {
			if(null != this.text || null != this.number)
			{
				if (CellValueType.Bool === this.type && null != this.number)
					oValueText = (this.number == 1) ? cBoolLocal.t : cBoolLocal.f;
				else
				{
					if(null != this.text)
						oValueText = this.text;
					if(CellValueType.Number === this.type || CellValueType.String === this.type)
					{
						var oNumFormat;
						if(null != xfs && null != xfs.num)
							oNumFormat = oNumFormatCache.get(xfs.num.getFormat());
						else
							oNumFormat = oNumFormatCache.get(g_oDefaultFormat.Num.getFormat());
						if(CellValueType.String != this.type && null != oNumFormat && null != this.number)
						{
							var nValue = this.number;
							var oTargetFormat = oNumFormat.getFormatByValue(nValue);
							if(oTargetFormat)
							{
								if(1 == oTargetFormat.nPercent)
								{
									//prercent
									oValueText = AscCommon.oGeneralEditFormatCache.format(nValue * 100) + "%";
								}
								else if(oTargetFormat.bDateTime)
								{
									//Если число не подходит под формат даты возвращаем само число
									if(false == oTargetFormat.isInvalidDateValue(nValue))
									{
										var bDate = oTargetFormat.bDate;
										var bTime = oTargetFormat.bTime;
										if(false == bDate && nValue >= 1)
											bDate = true;
										if(false == bTime && Math.floor(nValue) != nValue)
											bTime = true;
										var sDateFormat = "";
										if (bDate) {
											sDateFormat = AscCommon.getShortDateFormat(cultureInfo);
										}
										var sTimeFormat = 'h:mm:ss';
										if (cultureInfo.AMDesignator.length > 0 && cultureInfo.PMDesignator.length > 0){
											sTimeFormat += ' AM/PM';
										}
										if(bDate && bTime)
											oNumFormat = oNumFormatCache.get(sDateFormat + ' ' + sTimeFormat);
										else if(bTime)
											oNumFormat = oNumFormatCache.get(sTimeFormat);
										else
											oNumFormat = oNumFormatCache.get(sDateFormat);

										var aFormatedValue = oNumFormat.format(nValue, CellValueType.Number, AscCommon.gc_nMaxDigCount);
										oValueText = "";
										for(var i = 0, length = aFormatedValue.length; i < length; ++i)
											oValueText += aFormatedValue[i].text;
									}
									else
										oValueText = AscCommon.oGeneralEditFormatCache.format(nValue);
								}
								else
									oValueText = AscCommon.oGeneralEditFormatCache.format(nValue);
							}
						}
					}
				}
			}
			else if(this.multiText)
				oValueArray = this.multiText;
		}
		if(null != xfs && true == xfs.QuotePrefix && CellValueType.String == this.type && false == this.isFormula())
		{
			if(null != oValueText)
				oValueText = "'" + oValueText;
			else if(null != oValueArray)
				oValueArray = [{text:"'"}].concat(oValueArray);
		}
		return this._getValue2Result(oValueText, oValueArray, true);
	};
	Cell.prototype.getValueForExample = function(numFormat, cultureInfo) {
		var aText = this._getValue2(AscCommon.gc_nMaxDigCountView, function(){return true;}, numFormat, cultureInfo);
		return AscCommonExcel.getStringFromMultiText(aText);
	};
	Cell.prototype.getValueWithoutFormat = function() {
		this._checkDirty();
		var sResult = "";
		if(null != this.number)
		{
			if(CellValueType.Bool === this.type)
				sResult = this.number == 1 ? cBoolLocal.t : cBoolLocal.f;
			else
				sResult = this.number.toString();
		}
		else if(null != this.text)
			sResult = this.text;
		else if(null != this.multiText)
			sResult = AscCommonExcel.getStringFromMultiText(this.multiText);
		return sResult;
	};
	Cell.prototype.getValue = function() {
		this._checkDirty();
		var aTextValue2 = this.getValue2(AscCommon.gc_nMaxDigCountView, function() {return true;});
		return AscCommonExcel.getStringFromMultiText(aTextValue2);
	};
	Cell.prototype.getValue2 = function(dDigitsCount, fIsFitMeasurer) {
		this._checkDirty();
		if(null == fIsFitMeasurer)
			fIsFitMeasurer = function(aText){return true;};
		if(null == dDigitsCount)
			dDigitsCount = AscCommon.gc_nMaxDigCountView;
		return this._getValue2(dDigitsCount, fIsFitMeasurer);
	};
	Cell.prototype.getNumberValue = function() {
		this._checkDirty();
		return this.number;
	};
	Cell.prototype.getBoolValue = function() {
		this._checkDirty();
		return this.number == 1;
	};
	Cell.prototype.getValueText = function() {
		this._checkDirty();
		return this.text;
	};
	Cell.prototype.getTextIndex = function() {
		if (null === this.textIndex) {
			var wb = this.ws.workbook;
			if (null != this.text) {
				this.textIndex = wb.sharedStrings.addText(this.text);
			} else if (null != this.multiText) {
				this.textIndex = wb.sharedStrings.addMultiText(this.multiText);
			}
		}
		return this.textIndex;
	};
	Cell.prototype.getValueMultiText = function() {
		this._checkDirty();
		return this.multiText;
	};
	Cell.prototype.getNumFormatStr=function(){
		if(null != this.xfs && null != this.xfs.num)
			return this.xfs.num.getFormat();
		return g_oDefaultFormat.Num.getFormat();
	};
	Cell.prototype.getNumFormat=function(){
		return oNumFormatCache.get(this.getNumFormatStr());
	};
	Cell.prototype.getNumFormatType=function(){
		return this.getNumFormat().getType();
	};
	Cell.prototype.getNumFormatTypeInfo=function(){
		return this.getNumFormat().getTypeInfo();
	};
	Cell.prototype.getOffset=function(cell){
		return this.getOffset3(cell.nCol + 1, cell.nRow + 1);
	};
	Cell.prototype.getOffset2=function(cellId){
		var cAddr2 = new CellAddress(cellId);
		return this.getOffset3(cAddr2.col, cAddr2.row);
	};
	Cell.prototype.getOffset3=function(col, row){
		return new AscCommon.CellBase(this.nRow - row + 1, this.nCol - col + 1);
	};
	Cell.prototype.getValueData = function(){
		this._checkDirty();
		var formula = this.isFormula() ? this.getFormula() : null;
		var formulaRef;
		if(formula) {
			var parser = this.getFormulaParsed();
			if(parser) {
				formulaRef = this.getFormulaParsed().getArrayFormulaRef();
			}
		}
		return new UndoRedoData_CellValueData(formula, new AscCommonExcel.CCellValue(this), formulaRef);
	};
	Cell.prototype.setValueData = function(Val){
		//значения устанавляваются через setValue, чтобы пересчитались формулы
		if(null != Val.formula)
			this.setFormula(Val.formula, null, Val.formulaRef);
		else if(null != Val.value)
		{
			var DataOld = null;
			var DataNew = null;
			if (History.Is_On())
				DataOld = this.getValueData();
			this.setFormulaInternal(null);
			this._setValueData(Val.value);
			this.ws.workbook.dependencyFormulas.addToChangedCell(this);
			this.ws.workbook.sortDependency();
			if (History.Is_On()) {
				DataNew = this.getValueData();
				if (false == DataOld.isEqual(DataNew))
					History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeValue, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, DataOld, DataNew));
			}
		}
		else
			this.setValue("");
	};
	Cell.prototype._checkDirty = function(){
		var t = this;
		if (this.getIsDirty()) {
			if (g_cCalcRecursion.incLevel()) {
				var isCalc = this.getIsCalc();
				this.setIsCalc(true);
				var calculatedArrayFormulas = [];
				this.processFormula(function(parsed) {
					if (!isCalc) {
						//***array-formula***
						//добавлен последний параметр для обработки формулы массива
						if(parsed.getArrayFormulaRef()) {
							var listenerId = parsed.getListenerId();
							if(parsed.checkFirstCellArray(t) && !calculatedArrayFormulas[listenerId]) {
								parsed.calculate();
								calculatedArrayFormulas[listenerId] = 1;
							} else {
								if(null === parsed.value && !calculatedArrayFormulas[listenerId]) {
									parsed.calculate();
									calculatedArrayFormulas[listenerId] = 1;
								}

								var oldParent = parsed.parent;
								parsed.parent = new AscCommonExcel.CCellWithFormula(t.ws, t.nRow, t.nCol);
								parsed._endCalculate();
								parsed.parent = oldParent;
							}
						} else {
							parsed.calculate();
						}
					} else {
						parsed.calculateCycleError();
		}
				});

				g_cCalcRecursion.decLevel();
				if (g_cCalcRecursion.getIsForceBacktracking()) {
					g_cCalcRecursion.insert({ws: this.ws, nRow: this.nRow, nCol: this.nCol});
					if (0 === g_cCalcRecursion.getLevel() && !g_cCalcRecursion.getIsProcessRecursion()) {
						g_cCalcRecursion.setIsProcessRecursion(true);
						do {
							g_cCalcRecursion.setIsForceBacktracking(false);
							g_cCalcRecursion.foreachInReverse(function(elem) {
								elem.ws._getCellNoEmpty(elem.nRow, elem.nCol, function(cell) {
									if(cell && cell.getIsDirty()){
										cell.setIsCalc(false);
										cell._checkDirty();
									}
								});
							});
						} while (g_cCalcRecursion.getIsForceBacktracking());
						g_cCalcRecursion.setIsProcessRecursion(false);
					}
				} else {
					this.setIsCalc(false);
					this.setIsDirty(false);
				}
			}
		}
	};
	Cell.prototype.getFont=function(){
		var xfs = this.getCompiledStyle();
		if(null != xfs && null != xfs.font)
			return xfs.font;
		return g_oDefaultFormat.Font;
	};
	Cell.prototype.getFillColor = function () {
		return this.getFill().bg();
	};
	Cell.prototype.getFill = function () {
		var xfs = this.getCompiledStyle();
		if(null != xfs && null != xfs.fill)
			return xfs.fill;
		return g_oDefaultFormat.Fill;
	};
	Cell.prototype.getBorderSrc = function () {
		var xfs = this.getCompiledStyle();
		if(null != xfs && null != xfs.border)
			return xfs.border;
		return g_oDefaultFormat.Border;
	};
	Cell.prototype.getBorder = function () {
		return this.getBorderSrc();
	};
	Cell.prototype.getAlign=function(){
		var xfs = this.getCompiledStyle();
		if(null != xfs && null != xfs.align)
			return xfs.align;
		return g_oDefaultFormat.Align;
	};
	Cell.prototype._adjustCellFormat = function() {
		var t = this;
		this.processFormula(function(parsed) {
			var valueCalc = parsed.value;
			if (valueCalc) {
			if (0 <= valueCalc.numFormat) {
					if (aStandartNumFormatsId[t.getNumFormatStr()] == 0) {
						t.setNum(new AscCommonExcel.Num({id: valueCalc.numFormat}));
				}
			} else if (AscCommonExcel.cNumFormatFirstCell === valueCalc.numFormat) {
				// ищет в формуле первый рэндж и устанавливает формат ячейки как формат первой ячейки в рэндже
					var r = parsed.getFirstRange();
						if (r && r.getNumFormatStr) {
						var sCurFormat = t.getNumFormatStr();
							if (g_oDefaultFormat.Num.getFormat() == sCurFormat) {
								var sNewFormat = r.getNumFormatStr();
								if (sCurFormat != sNewFormat) {
								t.setNumFormat(sNewFormat);
								}
							}
						}
					}
				}
		});
	};
	Cell.prototype._updateCellValue = function() {
		if (!this.isFormula()) {
			return;
		}
		var parsed = this.getFormulaParsed();
		var res = parsed.simplifyRefType(parsed.value, this);

		if (res) {
			this.cleanText();
			switch (res.type) {
				case cElementType.number:
					this.setTypeInternal(CellValueType.Number);
					this.setValueNumberInternal(res.getValue());
					break;
				case cElementType.bool:
					this.setTypeInternal(CellValueType.Bool);
					this.setValueNumberInternal(res.value ? 1 : 0);
					break;
				case cElementType.error:
					this.setTypeInternal(CellValueType.Error);
					this.setValueTextInternal(res.getValue().toString());
					break;
				case cElementType.name:
					this.setTypeInternal(CellValueType.Error);
					this.setValueTextInternal(res.getValue().toString());
					break;
				case cElementType.empty:
					//=A1:A3
					this.setTypeInternal(CellValueType.Number);
					this.setValueNumberInternal(res.getValue());
					break;
				default:
					this.setTypeInternal(CellValueType.String);
					this.setValueTextInternal(res.getValue().toString());
			}

			//обработка для функции hyperlink. необходимо проставить формат.
			var isArray = parsed.getArrayFormulaRef();
			var firstArrayRef = parsed.checkFirstCellArray(this);
			if(res.getHyperlink && null !== res.getHyperlink() && (!isArray || (isArray && firstArrayRef))) {
				var oHyperlinkFont = new AscCommonExcel.Font();
				oHyperlinkFont.setName(this.ws.workbook.getDefaultFont());
				oHyperlinkFont.setSize(this.ws.workbook.getDefaultSize());
				oHyperlinkFont.setUnderline(Asc.EUnderline.underlineSingle);
				oHyperlinkFont.setColor(AscCommonExcel.g_oColorManager.getThemeColor(AscCommonExcel.g_nColorHyperlink));
				AscFormat.ExecuteNoHistory(function () {
					this.setFont(oHyperlinkFont);
				}, this, []);
			}

			this.ws.workbook.dependencyFormulas.addToCleanCellCache(this.ws.getId(), this.nRow, this.nCol);
			AscCommonExcel.g_oVLOOKUPCache.remove(this);
			AscCommonExcel.g_oHLOOKUPCache.remove(this);
			AscCommonExcel.g_oMatchCache.remove(this);
			AscCommonExcel.g_oSUMIFSCache.remove(this);
		}
	};
	Cell.prototype.cleanText = function() {
		this.number = null;
		this.text = null;
		this.multiText = null;
		this.textIndex = null;
		this.type = CellValueType.Number;
		this._hasChanged = true;
	};
	Cell.prototype._BuildDependencies = function(parse, opt_dirty) {
		var parsed = this.getFormulaParsed();
		if (parsed) {
			if (parse) {
				parsed.parse();
			}
			parsed.buildDependencies();
			if (opt_dirty || parsed.ca || this.isNullTextString()) {
				this.ws.workbook.dependencyFormulas.addToChangedCell(this);
			}
		}
	};
	Cell.prototype._setValueData = function(val){
		this.number = val.number;
		this.text = val.text;
		this.multiText = val.multiText;
		this.textIndex = null;
		this.type = val.type;
		this._hasChanged = true;
	};
	Cell.prototype._getValue2 = function(dDigitsCount, fIsFitMeasurer, opt_numFormat, opt_cultureInfo) {
		var aRes = null;
		var bNeedMeasure = true;
		var sText = null;
		var aText = null;
		var isMultyText = false;
		if (CellValueType.Number == this.type || CellValueType.String == this.type) {
			if (null != this.text) {
				sText = this.text;
			} else if (null != this.multiText) {
				aText = this.multiText;
				isMultyText = true;
			}

			if (CellValueType.String == this.type) {
				bNeedMeasure = false;
			}
			var oNumFormat;
			if (opt_numFormat) {
				oNumFormat = opt_numFormat;
			} else {
				var xfs = this.getCompiledStyle();
				if (null != xfs && null != xfs.num) {
					oNumFormat = oNumFormatCache.get(xfs.num.getFormat());
				} else {
					oNumFormat = oNumFormatCache.get(g_oDefaultFormat.Num.getFormat());
				}
			}

			if (false == oNumFormat.isGeneralFormat()) {
				if (null != this.number) {
					aText = oNumFormat.format(this.number, this.type, dDigitsCount, false, opt_cultureInfo);
					isMultyText = false;
					sText = null;
				} else if (CellValueType.String == this.type) {
					var oTextFormat = oNumFormat.getTextFormat();
					if (null != oTextFormat && "@" != oTextFormat.formatString) {
						if (null != this.text) {
							aText = oNumFormat.format(this.text, this.type, dDigitsCount, false, opt_cultureInfo);
							isMultyText = false;
							sText = null;
						} else if (null != this.multiText) {
							var sSimpleString = AscCommonExcel.getStringFromMultiText(this.multiText);
							aText = oNumFormat.format(sSimpleString, this.type, dDigitsCount, false, opt_cultureInfo);
							isMultyText = false;
							sText = null;
						}
					}
				}
			} else if (CellValueType.Number == this.type && null != this.number) {
				bNeedMeasure = false;
				var bFindResult = false;
				//варируем dDigitsCount чтобы результат влез в ячейку
				var nTempDigCount = Math.ceil(dDigitsCount);
				var sOriginText = this.number;
				while (nTempDigCount >= 1) {
					//Строим подходящий general format
					var sGeneral = AscCommon.DecodeGeneralFormat(sOriginText, this.type, nTempDigCount);
					if (null != sGeneral) {
						oNumFormat = oNumFormatCache.get(sGeneral);
					}

					if (null != oNumFormat) {
						sText = null;
						isMultyText = false;
						aText = oNumFormat.format(sOriginText, this.type, dDigitsCount, false, opt_cultureInfo);
						if (true == oNumFormat.isTextFormat()) {
							break;
						} else {
							aRes = this._getValue2Result(sText, aText, isMultyText);
							//Проверяем влезает ли текст
							if (true == fIsFitMeasurer(aRes)) {
								bFindResult = true;
								break;
							}
							aRes = null;
						}
					}
					nTempDigCount--;
				}
				if (false == bFindResult) {
					aRes = null;
					sText = null;
					isMultyText = false;
					var font = new AscCommonExcel.Font();
					if (dDigitsCount > 1) {
						font.setRepeat(true);
						aText = [{text: "#", format: font}];
					} else {
						aText = [{text: "", format: font}];
					}
				}
			}
		} else if (CellValueType.Bool === this.type) {
			if (null != this.number) {
				sText = (0 != this.number) ? cBoolLocal.t : cBoolLocal.f;
			}
		} else if (CellValueType.Error === this.type) {
			if (null != this.text) {
				sText = this._getValueTypeError(this.text);
			}
		}
		if (bNeedMeasure) {
			aRes = this._getValue2Result(sText, aText, isMultyText);
			//Проверяем влезает ли текст
			if (false == fIsFitMeasurer(aRes)) {
				aRes = null;
				sText = null;
				isMultyText = false;
				var font = new AscCommonExcel.Font();
				font.setRepeat(true);
				aText = [{text: "#", format: font}];
			}
		}
		if (null == aRes) {
			aRes = this._getValue2Result(sText, aText, isMultyText);
		}
		return aRes;
	};
	Cell.prototype._setValue = function(val)
	{
		this.cleanText();

		function checkCellValueTypeError(sUpText){
			switch (sUpText){
				case cErrorLocal["nil"]:
					return cErrorOrigin["nil"];
					break;
				case cErrorLocal["div"]:
					return cErrorOrigin["div"];
					break;
				case cErrorLocal["value"]:
					return cErrorOrigin["value"];
					break;
				case cErrorLocal["ref"]:
					return cErrorOrigin["ref"];
					break;
				case cErrorLocal["name"]:
				case cErrorLocal["name"].replace('\\', ''): // ToDo это неправильная правка для бага 32463 (нужно переделать parse формул)
					return cErrorOrigin["name"];
					break;
				case cErrorLocal["num"]:
					return cErrorOrigin["num"];
					break;
				case cErrorLocal["na"]:
					return cErrorOrigin["na"];
					break;
				case cErrorLocal["getdata"]:
					return cErrorOrigin["getdata"];
					break;
				case cErrorLocal["uf"]:
					return cErrorOrigin["uf"];
					break;
			}
			return false;
		}

		if("" == val)
			return;
		var oNumFormat;
		var xfs = this.getCompiledStyle();
		if(null != xfs && null != xfs.num)
			oNumFormat = oNumFormatCache.get(xfs.num.getFormat());
		else
			oNumFormat = oNumFormatCache.get(g_oDefaultFormat.Num.getFormat());
		if(oNumFormat.isTextFormat())
		{
			this.setTypeInternal(CellValueType.String);
			this.setValueTextInternal(val);
		}
		else
		{
			if (AscCommon.g_oFormatParser.isLocaleNumber(val))
			{
				this.setTypeInternal(CellValueType.Number);
				this.setValueNumberInternal(AscCommon.g_oFormatParser.parseLocaleNumber(val));
			}
			else
			{
				var sUpText = val.toUpperCase();
				if(cBoolLocal.t === sUpText || cBoolLocal.f === sUpText)
				{
					this.setTypeInternal(CellValueType.Bool);
					this.setValueNumberInternal((cBoolLocal.t === sUpText) ? 1 : 0);
				}
				else if(checkCellValueTypeError(sUpText))
				{
					this.setTypeInternal(CellValueType.Error);
					this.setValueTextInternal(checkCellValueTypeError(sUpText));
				}
				else
				{
					//распознаем формат
					var res = AscCommon.g_oFormatParser.parse(val);
					if(null != res)
					{
						//Сравниваем с текущим форматом, если типы совпадают - меняем только значение ячейки
						var nFormatType = oNumFormat.getType();
						if(!((c_oAscNumFormatType.Percent == nFormatType && res.bPercent) ||
							(c_oAscNumFormatType.Currency == nFormatType && res.bCurrency) ||
							(c_oAscNumFormatType.Date == nFormatType && res.bDate) ||
							(c_oAscNumFormatType.Time == nFormatType && res.bTime)) && res.format != oNumFormat.sFormat) {
							this.setNumFormat(res.format);
						}
						this.setTypeInternal(CellValueType.Number);
						this.setValueNumberInternal(res.value);
					}
					else
					{
						this.setTypeInternal(CellValueType.String);
						//проверяем QuotePrefix
						if(val.length > 0 && "'" == val[0])
						{
							this.setQuotePrefix(true);
							val = val.substring(1);
						}
						this.setValueTextInternal(val);
					}
				}
			}
		}
		if (/(^(((http|https|ftp):\/\/)|(mailto:)|(www.)))|@/i.test(val)) {
			// Удаляем концевые пробелы и переводы строки перед проверкой гиперссылок
			val = val.replace(/\s+$/, '');
			var typeHyp = AscCommon.getUrlType(val);
			if (AscCommon.c_oAscUrlType.Invalid != typeHyp) {
				val = AscCommon.prepareUrl(val, typeHyp);

				var oNewHyperlink = new AscCommonExcel.Hyperlink();
				oNewHyperlink.Ref = this.ws.getCell3(this.nRow, this.nCol);
				oNewHyperlink.Hyperlink = val;
				oNewHyperlink.Ref.setHyperlink(oNewHyperlink);
			}
		}
	};
	Cell.prototype._setValue2 = function(aVal)
	{
		var sSimpleText = "";
		for(var i = 0, length = aVal.length; i < length; ++i)
			sSimpleText += aVal[i].text;
		this._setValue(sSimpleText);
		var nRow = this.nRow;
		var nCol = this.nCol;
		if(CellValueType.String == this.type && null == this.ws.hyperlinkManager.getByCell(nRow, nCol))
		{
			this.cleanText();
			this.setTypeInternal(CellValueType.String);
			//проверяем можно ли перевести массив в простую строку.
			if(aVal.length > 0)
			{
				this.multiText = [];
				for(var i = 0, length = aVal.length; i < length; i++){
					var item = aVal[i];
					var oNewElem = new AscCommonExcel.CMultiTextElem();
					oNewElem.text = item.text;
					if (null != item.format) {
						oNewElem.format = new AscCommonExcel.Font();
						oNewElem.format.assign(item.format);
					}
					this.multiText.push(oNewElem);
				}
				this._minimizeMultiText(true);
			}
			//обрабатываем QuotePrefix
			if(null != this.text)
			{
				if(this.text.length > 0 && "'" == this.text[0])
				{
					this.setQuotePrefix(true);
					this.setValueTextInternal(this.text.substring(1));
				}
			}
			else if(null != this.multiText)
			{
				if(this.multiText.length > 0)
				{
					var oFirstItem = this.multiText[0];
					if(null != oFirstItem.text && oFirstItem.text.length > 0 && "'" == oFirstItem.text[0])
					{
						this.setQuotePrefix(true);
						if(1 != oFirstItem.text.length)
							oFirstItem.text = oFirstItem.text.substring(1);
						else
						{
							this.multiText.shift();
							if(0 == this.multiText.length)
							{
								this.setValueTextInternal("");
							}
						}
					}
				}
			}
		}
	};
	Cell.prototype._setFontProp = function(fCheck, fAction)
	{
		var bRes = false;
		if(null != this.multiText)
		{
			//проверяем поменяются ли свойства
			var bChange = false;
			for(var i = 0, length = this.multiText.length; i < length; ++i)
			{
				var elem = this.multiText[i];
				if (null != elem.format && true == fCheck(elem.format))
				{
					bChange = true;
					break;
				}
			}
			if(bChange)
			{
				var backupObj = this.getValueData();
				for (var i = 0, length = this.multiText.length; i < length; ++i) {
					var elem = this.multiText[i];
					if (null != elem.format)
						fAction(elem.format)
				}
				//пробуем преобразовать в простую строку
				if(this._minimizeMultiText(false))
				{
					var DataNew = this.getValueData();
					History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeValue, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow,this.nCol, backupObj, DataNew));
				}
				else
				{
					var DataNew = this._cloneMultiText();
					History.Add(AscCommonExcel.g_oUndoRedoCell, AscCH.historyitem_Cell_ChangeArrayValueFormat, this.ws.getId(), new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow), new UndoRedoData_CellSimpleData(this.nRow, this.nCol, backupObj.value.multiText, DataNew));
				}
			}
			bRes = true;
		}
		return bRes;
	};
	Cell.prototype._getValue2Result = function(sText, aText, isMultyText)
	{
		var aResult = [];
		if(null == sText && null == aText)
			sText = "";
		var oNewItem, cellfont;
		var xfs = this.getCompiledStyle();
		if(null != xfs && null != xfs.font)
			cellfont = xfs.font;
		else
			cellfont = g_oDefaultFormat.Font;
		if(null != sText){
			oNewItem = new AscCommonExcel.Fragment();
			oNewItem.text = sText;
			oNewItem.format = cellfont.clone();
			oNewItem.checkVisitedHyperlink(this.nRow, this.nCol, this.ws.hyperlinkManager);
			oNewItem.format.setSkip(false);
			oNewItem.format.setRepeat(false);
			aResult.push(oNewItem);
		} else if(null != aText){
			for(var i = 0; i < aText.length; i++){
				oNewItem = new AscCommonExcel.Fragment();
				var oCurtext = aText[i];
				if(null != oCurtext.text)
				{
					oNewItem.text = oCurtext.text;
					var oCurFormat = new AscCommonExcel.Font();
					if (isMultyText) {
						if (null != oCurtext.format) {
							oCurFormat.assign(oCurtext.format);
						} else {
							oCurFormat.assign(cellfont);
							oCurFormat.setSkip(false);
							oCurFormat.setRepeat(false);
						}
					} else {
						oCurFormat.assign(cellfont);
						oCurFormat.setSkip(false);
						oCurFormat.setRepeat(false);
						if (null != oCurtext.format) {
							oCurFormat.assignFromObject(oCurtext.format);
						}
					}
					oNewItem.format = oCurFormat;
					oNewItem.checkVisitedHyperlink(this.nRow, this.nCol, this.ws.hyperlinkManager);
					aResult.push(oNewItem);
				}
			}
		}
		return aResult;
	};
	Cell.prototype._getValueTypeError = function(text) {
		switch (text){
			case cErrorOrigin["nil"]:
				return cErrorLocal["nil"];
				break;
			case cErrorOrigin["div"]:
				return cErrorLocal["div"];
				break;
			case cErrorOrigin["value"]:
				return cErrorLocal["value"];
				break;
			case cErrorOrigin["ref"]:
				return cErrorLocal["ref"];
				break;
			case cErrorOrigin["name"]:
				return cErrorLocal["name"].replace('\\', ''); // ToDo это неправильная правка для бага 32463 (нужно переделать parse формул)
				break;
			case cErrorOrigin["num"]:
				return cErrorLocal["num"];
				break;
			case cErrorOrigin["na"]:
				return cErrorLocal["na"];
				break;
			case cErrorOrigin["getdata"]:
				return cErrorLocal["getdata"];
				break;
			case cErrorOrigin["uf"]:
				return cErrorLocal["uf"];
				break;
		}
		return cErrorLocal["nil"];
	};
	Cell.prototype._minimizeMultiText = function(bSetCellFont) {
		var bRes = false;
		if(null != this.multiText && this.multiText.length > 0)
		{
			var cellFont = this.getFont();
			var oIntersectFont = null;
			for (var i = 0, length = this.multiText.length; i < length; i++) {
				var elem = this.multiText[i];
				if (null != elem.format) {
					if (null == oIntersectFont)
						oIntersectFont = elem.format.clone();
					oIntersectFont.intersect(elem.format, cellFont);
				}
				else {
					oIntersectFont = cellFont;
					break;
				}
			}

			if(bSetCellFont)
			{
				if (oIntersectFont.isEqual(g_oDefaultFormat.Font))
					this.setFont(null, false);
				else
					this.setFont(oIntersectFont, false);
			}
			//если у всех элементов один формат, то сохраняем только текст
			var bIsEqual = true;
			for (var i = 0, length = this.multiText.length; i < length; i++)
			{
				var elem = this.multiText[i];
				if (null != elem.format && false == oIntersectFont.isEqual(elem.format))
				{
					bIsEqual = false;
					break;
				}
			}
			if(bIsEqual)
			{
				this.setValueTextInternal(AscCommonExcel.getStringFromMultiText(this.multiText));
				bRes = true;
			}
		}
		return bRes;
	};
	Cell.prototype._cloneMultiText = function() {
		var oRes = [];
		for(var i = 0, length = this.multiText.length; i < length; ++i)
			oRes.push(this.multiText[i].clone());
		return oRes;
	};
	Cell.prototype.getIsDirty = function() {
		return this.isDirty;
	};
	Cell.prototype.setIsDirty = function(val) {
		this.isDirty = val;
		this._hasChanged = true;
	};
	Cell.prototype.getIsCalc = function() {
		return this.isCalc;
	};
	Cell.prototype.setIsCalc = function(val) {
		this.isCalc = val;
		this._hasChanged = true;
	};
	Cell.prototype.fromXLSB = function(stream, type, row, aCellXfs, aSharedStrings, tmp, formula) {
		var end = stream.XlsbReadRecordLength() + stream.GetCurPos();

		this.setRowCol(row, stream.GetULongLE() & 0x3FFF);
		var nStyleRef = stream.GetULongLE();
		if (0 !== (nStyleRef & 0xFFFFFF)) {
			var xf = aCellXfs[nStyleRef & 0xFFFFF];
			if (xf) {
				this.setStyle(xf);
			}
		}
		//todo rt_CELL_RK
		if (AscCommonExcel.XLSB.rt_CELL_REAL === type || AscCommonExcel.XLSB.rt_FMLA_NUM === type) {
			this.setTypeInternal(CellValueType.Number);
			this.setValueNumberInternal(stream.GetDoubleLE());
		} else if (AscCommonExcel.XLSB.rt_CELL_ISST === type) {
			this.setTypeInternal(CellValueType.String);
			//todo textIndex
			var ss = aSharedStrings[stream.GetULongLE()];
			if (undefined !== ss) {
				if (typeof ss === 'string') {
					this.setValueTextInternal(ss);
				} else {
					this.setValueMultiTextInternal(ss);
				}
			}
		} else if (AscCommonExcel.XLSB.rt_CELL_ST === type || AscCommonExcel.XLSB.rt_FMLA_STRING === type) {
			this.setTypeInternal(CellValueType.String);
			this.setValueTextInternal(stream.GetString());
		} else if (AscCommonExcel.XLSB.rt_CELL_ERROR === type || AscCommonExcel.XLSB.rt_FMLA_ERROR === type) {
			this.setTypeInternal(CellValueType.Error);
			switch (stream.GetByte()) {
				case 0x00:
					this.setValueTextInternal("#NULL!");
					break;
				case 0x07:
					this.setValueTextInternal("#DIV/0!");
					break;
				case 0x0F:
					this.setValueTextInternal("#VALUE!");
					break;
				case 0x17:
					this.setValueTextInternal("#REF!");
					break;
				case 0x1D:
					this.setValueTextInternal("#NAME?");
					break;
				case 0x24:
					this.setValueTextInternal("#NUM!");
					break;
				case 0x2A:
					this.setValueTextInternal("#N/A");
					break;
				case 0x2B:
					this.setValueTextInternal("#GETTING_DATA");
					break;
			}
		} else if (AscCommonExcel.XLSB.rt_CELL_BOOL === type || AscCommonExcel.XLSB.rt_FMLA_BOOL === type) {
			this.setTypeInternal(CellValueType.Bool);
			this.setValueNumberInternal(stream.GetByte());
		} else {
			this.setTypeInternal(CellValueType.Number);
		}
		if (AscCommonExcel.XLSB.rt_FMLA_STRING <= type && type <= AscCommonExcel.XLSB.rt_FMLA_ERROR) {
			this.fromXLSBFormula(stream, tmp.formula);
		}
		var flags = stream.GetUShortLE();
		if (0 !== (flags & 0x4)) {
			this.fromXLSBFormulaExt(stream, tmp.formula, flags);
			if (0 !== (flags & 0x4000)) {
				this.setTypeInternal(CellValueType.Number);
				this.setValueNumberInternal(null);
			}
		}
		if (0 !== (flags & 0x2000)) {
			this.setTypeInternal(CellValueType.String);
			this.setValueMultiTextInternal(this.fromXLSBRichText(stream));
		}

		stream.Seek2(end);
	};
	Cell.prototype.fromXLSBFormula = function(stream, formula) {
		var flags = stream.GetUChar();
		stream.Skip2(9);
		if (0 !== (flags & 0x2)) {
			formula.ca = true;
		}
	};
	Cell.prototype.fromXLSBFormulaExt = function(stream, formula, flags) {
		formula.t = flags & 0x3;
		formula.v = stream.GetString();
		if (0 !== (flags & 0x8)) {
			formula.aca = true;
		}
		if (0 !== (flags & 0x10)) {
			formula.bx = true;
		}
		if (0 !== (flags & 0x20)) {
			formula.del1 = true;
		}
		if (0 !== (flags & 0x40)) {
			formula.del2 = true;
		}
		if (0 !== (flags & 0x80)) {
			formula.dt2d = true;
		}
		if (0 !== (flags & 0x100)) {
			formula.dtr = true;
		}
		if (0 !== (flags & 0x200)) {
			formula.r1 = stream.GetString();
		}
		if (0 !== (flags & 0x400)) {
			formula.r2 = stream.GetString();
		}
		if (0 !== (flags & 0x800)) {
			formula.ref = stream.GetString();
		}
		if (0 !== (flags & 0x1000)) {
			formula.si = stream.GetULongLE();
		}
	};
	Cell.prototype.fromXLSBRichText = function(stream) {
		var res = [];
		var count = stream.GetULongLE();
		while (count-- > 0) {
			var typeRun = stream.GetUChar();
			var run;
			if (0x1 === typeRun) {
				run = new AscCommonExcel.CMultiTextElem();
				run.text = "";
				if (stream.GetBool()) {
					run.format = new AscCommonExcel.Font();
					run.format.fromXLSB(stream);
					run.format.checkSchemeFont(this.ws.workbook.theme);
				}
				var textCount = stream.GetULongLE();
				while (textCount-- > 0) {
					run.text += stream.GetString();
				}
				res.push(run);
			}
			else if (0x2 === typeRun) {
				run = new AscCommonExcel.CMultiTextElem();
				run.text = stream.GetString();
				res.push(run);
			}
		}
		return res;
	};
	Cell.prototype.toXLSB = function(stream, nXfsId, formulaToWrite, oSharedStrings) {
		var len = 4 + 4 + 2;
		var type = AscCommonExcel.XLSB.rt_CELL_BLANK;
		if (formulaToWrite) {
			len += this.getXLSBSizeFormula(formulaToWrite);
		}
		var textToWrite;
		var isBlankFormula = false;
		if (formulaToWrite) {
			if (!this.isNullTextString()) {
				switch (this.type) {
					case CellValueType.Number:
						type = AscCommonExcel.XLSB.rt_FMLA_NUM;
						len += 8;
						break;
					case CellValueType.String:
						type = AscCommonExcel.XLSB.rt_FMLA_STRING;
						textToWrite = this.text ? this.text : AscCommonExcel.getStringFromMultiText(this.multiText);
						len += 4 + 2 * textToWrite.length;
						break;
					case CellValueType.Error:
						type = AscCommonExcel.XLSB.rt_FMLA_ERROR;
						len += 1;
						break;
					case CellValueType.Bool:
						type = AscCommonExcel.XLSB.rt_FMLA_BOOL;
						len += 1;
						break;
				}
			} else {
				type = AscCommonExcel.XLSB.rt_FMLA_STRING;
				textToWrite = "";
				len += 4 + 2 * textToWrite.length;
				isBlankFormula = true;
			}
		} else {
			if (!this.isNullTextString()) {
				switch (this.type) {
					case CellValueType.Number:
						type = AscCommonExcel.XLSB.rt_CELL_REAL;
						len += 8;
						break;
					case CellValueType.String:
						type = AscCommonExcel.XLSB.rt_CELL_ISST;
						len += 4;
						break;
					case CellValueType.Error:
						type = AscCommonExcel.XLSB.rt_CELL_ERROR;
						len += 1;
						break;
					case CellValueType.Bool:
						type = AscCommonExcel.XLSB.rt_CELL_BOOL;
						len += 1;
						break;
				}
			}
		}

		stream.XlsbStartRecord(type, len);
		stream.WriteULong(this.nCol & 0x3FFF);
		var nStyle = 0;
		if (null !== nXfsId) {
			nStyle = nXfsId;
		}
		stream.WriteULong(nStyle);
		//todo RkNumber
		switch (type) {
			case AscCommonExcel.XLSB.rt_CELL_REAL:
			case AscCommonExcel.XLSB.rt_FMLA_NUM:
				stream.WriteDouble2(this.number);
				break;
			case AscCommonExcel.XLSB.rt_CELL_ISST:
				var index;
				var textIndex = this.getTextIndex();
				if (null !== textIndex) {
					index = oSharedStrings.strings[textIndex];
					if (undefined === index) {
						index = oSharedStrings.index++;
						oSharedStrings.strings[textIndex] = index;
					}
				}
				stream.WriteULong(index);
				break;
			case AscCommonExcel.XLSB.rt_CELL_ST:
			case AscCommonExcel.XLSB.rt_FMLA_STRING:
				stream.WriteString4(textToWrite);
				break;
			case AscCommonExcel.XLSB.rt_CELL_ERROR:
			case AscCommonExcel.XLSB.rt_FMLA_ERROR:
				if ("#NULL!" == this.text) {
					stream.WriteByte(0x00);
				}
				else if ("#DIV/0!" == this.text) {
					stream.WriteByte(0x07);
				}
				else if ("#VALUE!" == this.text) {
					stream.WriteByte(0x0F);
				}
				else if ("#REF!" == this.text) {
					stream.WriteByte(0x17);
				}
				else if ("#NAME?" == this.text) {
					stream.WriteByte(0x1D);
				}
				else if ("#NUM!" == this.text) {
					stream.WriteByte(0x24);
				}
				else if ("#N/A" == this.text) {
					stream.WriteByte(0x2A);
				}
				else {
					stream.WriteByte(0x2B);
				}
				break;
			case AscCommonExcel.XLSB.rt_CELL_BOOL:
			case AscCommonExcel.XLSB.rt_FMLA_BOOL:
				stream.WriteByte(this.number);
				break;
		}
		var flags = 0;
		if (formulaToWrite) {
			flags = this.toXLSBFormula(stream, formulaToWrite, isBlankFormula);
		}
		stream.WriteUShort(flags);
		if (formulaToWrite) {
			flags = this.toXLSBFormulaExt(stream, formulaToWrite);
		}
		stream.XlsbEndRecord();
	};
	Cell.prototype.getXLSBSizeFormula = function(formulaToWrite) {
		var len = 2 + 4 + 4;
		if (formulaToWrite.formula) {
			len += 4 + 2 * formulaToWrite.formula.length;
		} else {
			len += 4;
		}
		if (undefined !== formulaToWrite.ref) {
			len += 4 + 2 * formulaToWrite.ref.getName().length;
		}
		if (undefined !== formulaToWrite.si) {
			len += 4;
		}
		return len;
	};
	Cell.prototype.toXLSBFormula = function(stream, formulaToWrite, isBlankFormula) {
		var flags = 0;
		if (formulaToWrite.ca) {
			flags |= 0x2;
		}
		stream.WriteUShort(flags);
		stream.WriteULong(0);//cce
		stream.WriteULong(0);//cb

		var flagsExt = 0;
		if (undefined !== formulaToWrite.type) {
			flagsExt |= formulaToWrite.type;
		}
		else {
			flagsExt |= Asc.ECellFormulaType.cellformulatypeNormal;
		}
		flagsExt |= 0x4;
		if (undefined !== formulaToWrite.ref) {
			flagsExt |= 0x800;
		}
		if (undefined !== formulaToWrite.si) {
			flagsExt |= 0x1000;
		}
		if (isBlankFormula) {
			flagsExt |= 0x4000;
		}
		return flagsExt;
	};
	Cell.prototype.toXLSBFormulaExt = function(stream, formulaToWrite) {
		if (undefined !== formulaToWrite.formula) {
			stream.WriteString4(formulaToWrite.formula);
		} else {
			stream.WriteString4("");
		}
		if (undefined !== formulaToWrite.ref) {
			stream.WriteString4(formulaToWrite.ref.getName());
		}
		if (undefined !== formulaToWrite.si) {
			stream.WriteULong(formulaToWrite.si);
		}
	};
//-------------------------------------------------------------------------------------------------

	function CCellWithFormula(ws, row, col) {
		this.ws = ws;
		this.nRow = row;
		this.nCol = col;
	}
	CCellWithFormula.prototype.onFormulaEvent = function(type, eventData) {
		if (AscCommon.c_oNotifyParentType.GetRangeCell === type) {
			return new Asc.Range(this.nCol, this.nRow, this.nCol, this.nRow);
		} else if (AscCommon.c_oNotifyParentType.Change === type) {
			this._onChange(eventData);
		} else if (AscCommon.c_oNotifyParentType.ChangeFormula === type) {
			this._onChangeFormula(eventData);
		} else if (AscCommon.c_oNotifyParentType.EndCalculate === type) {
			this.ws._getCell(this.nRow, this.nCol, function(cell) {
				cell._updateCellValue();
			});
		} else if (AscCommon.c_oNotifyParentType.Shared === type) {
			return this._onShared(eventData);
					}
	};
	CCellWithFormula.prototype._onChange = function(eventData) {
		var areaData = eventData.notifyData.areaData;
		var shared = eventData.formula.getShared();
		var arrayF = eventData.formula.getArrayFormulaRef();
		var dependencyFormulas = this.ws.workbook.dependencyFormulas;
		if (shared) {
			if (areaData) {
				var bbox = areaData.bbox;
				var changedRange = bbox.getSharedIntersect(shared.ref, areaData.changedBBox);
				dependencyFormulas.addToChangedRange2(this.ws.getId(), changedRange);
			} else {
				dependencyFormulas.addToChangedRange2(this.ws.getId(), shared.ref);
			}
		} else if(arrayF) {
			dependencyFormulas.addToChangedRange2(this.ws.getId(), arrayF);
		} else {
			this.ws.workbook.dependencyFormulas.addToChangedCell(this);
		}
	};
	CCellWithFormula.prototype._onChangeFormula = function(eventData) {
		var t = this;
		var wb = this.ws.workbook;
		var parsed = eventData.formula;
		var shared = parsed.getShared();
		if (shared) {
			var index = wb.workbookFormulas.add(parsed).getIndexNumber();
			History.Add(AscCommonExcel.g_oUndoRedoSharedFormula, AscCH.historyitem_SharedFormula_ChangeFormula, null, null, new UndoRedoData_IndexSimpleProp(index, false, parsed.getFormulaRaw(), eventData.assemble), true);
			wb.dependencyFormulas.addToChangedRange2(this.ws.getId(), shared.ref);
		} else {
			this.ws._getCell(this.nRow, this.nCol, function(cell) {
				if (parsed === cell.formulaParsed) {
					cell.setFormulaTemplate(true, function(cell) {
						cell.formulaParsed.setFormulaString(eventData.assemble);
						wb.dependencyFormulas.addToChangedCell(cell);
			});
		}
			});
		}
	};
	CCellWithFormula.prototype._onShared = function(eventData) {
		var res = false;
		var data = eventData.notifyData;
		var parsed = eventData.formula;
		var forceTransform = false;
		var sharedShift;//affected shared
		var ranges;//ranges than needed to be transform
		var i;
		var shared = parsed.getShared();
		if (shared) {
			if (c_oNotifyType.Shift === data.type) {
				var bHor = 0 !== data.offset.col;
				var toDelete = data.offset.col < 0 || data.offset.row < 0;
				var bboxShift = AscCommonExcel.shiftGetBBox(data.bbox, bHor);
				sharedShift = parsed.getSharedIntersect(data.sheetId, bboxShift);
				if (sharedShift) {
					//try to remain as many shared formulas as possible
					//that shared can only be at intersection with bboxShift
					var sharedIntersect;
					if (parsed.canShiftShared(bHor) && (sharedIntersect = bboxShift.intersectionSimple(shared.ref))) {
						//collect relative complement of sharedShift and sharedIntersect
						ranges = sharedIntersect.difference(sharedShift);
						ranges = ranges.concat(sharedShift.difference(sharedIntersect));
						//cut off shared than affected relative complement of bboxShift
						var cantBeShared;
						var diff = bboxShift.difference(new Asc.Range(0, 0, gc_nMaxCol0, gc_nMaxRow0));
						if (toDelete) {
							//cut off shared than affected delete range
							diff.push(data.bbox);
						}
						for (i = 0; i < diff.length; ++i) {
							var elem = parsed.getSharedIntersect(data.sheetId, diff[i]);
							if (elem) {
								if (cantBeShared) {
									cantBeShared.union2(elem)
								} else {
									cantBeShared = elem;
								}
							}
						}
						if (cantBeShared) {
							var intersection = sharedIntersect.intersectionSimple(cantBeShared);
							if (intersection) {
								ranges.push(intersection);
							}
						}
						forceTransform = true;
						data.shiftedShared[parsed.getListenerId()] = c_oSharedShiftType.PreProcessed;
					} else {
						ranges = [sharedShift];
					}
				}
				res = true;
			} else if (c_oNotifyType.Move === data.type || c_oNotifyType.Delete === data.type) {
				sharedShift = parsed.getSharedIntersect(data.sheetId, data.bbox);
				if (sharedShift) {
					ranges = [sharedShift];
				}
				res = true;
			} else if (AscCommon.c_oNotifyType.ChangeDefName === data.type && data.bConvertTableFormulaToRef) {
				this._processShared(shared, shared.ref, data, parsed, true, function(newFormula) {
					return newFormula.processNotify(data);
				});
				res = true;
			}
			if (ranges) {
				for (i = 0; i < ranges.length; ++i) {
					this._processShared(shared, ranges[i], data, parsed, forceTransform, function(newFormula) {
						return newFormula.shiftCells(data.type, data.sheetId, data.bbox, data.offset, data.sheetIdTo);
					});
				}
			}
		}
		return res;
	};
	CCellWithFormula.prototype._processShared = function(shared, ref, data, parsed, forceTransform, action) {
		var t = this;
		var cellWithFormula;
		var cellOffset = new AscCommon.CellBase();
		var newFormula;
		this.ws.getRange3(ref.r1, ref.c1, ref.r2, ref.c2)._foreachNoEmpty(function(cell) {
			if (parsed === cell.getFormulaParsed()) {
				if (!cellWithFormula) {
					cellWithFormula = new AscCommonExcel.CCellWithFormula(cell.ws, cell.nRow, cell.nCol);
					newFormula = parsed.clone(undefined, cellWithFormula);
					newFormula.removeShared();
					cellOffset.row = cell.nRow - shared.base.nRow;
					cellOffset.col = cell.nCol - shared.base.nCol;
				} else {
					cellOffset.row = cell.nRow - cellWithFormula.nRow;
					cellOffset.col = cell.nCol - cellWithFormula.nCol;
					cellWithFormula.nRow = cell.nRow;
					cellWithFormula.nCol = cell.nCol;
				}
				newFormula.changeOffset(cellOffset, false);
				if (action(newFormula) || forceTransform) {
					cellWithFormula = undefined;
					newFormula.setFormulaString(newFormula.assemble(true));
					cell.setFormulaTemplate(true, function(cell) {
						cell.setFormulaInternal(newFormula);
						newFormula.buildDependencies();
					});
				}
				t.ws.workbook.dependencyFormulas.addToChangedCell(cell);
			}
		});
	};

	function CellTypeAndValue(type, v) {
		this.type = type;
		this.v = v;
	}
	CellTypeAndValue.prototype.valueOf = function() {
		return this.v;
	};

	function ignoreFirstRowSort(worksheet, bbox) {
		var res = false;

		var oldExcludeVal = worksheet.bExcludeHiddenRows;
		worksheet.bExcludeHiddenRows = false;
		if(bbox.r1 < bbox.r2) {
			var rowFirst = worksheet.getRange3(bbox.r1, bbox.c1, bbox.r1, bbox.c2);
			var rowSecond = worksheet.getRange3(bbox.r1 + 1, bbox.c1, bbox.r1 + 1, bbox.c2);
			var typesFirst = [];
			var typesSecond = [];
			rowFirst._setPropertyNoEmpty(null, null, function(cell, row, col) {
				if (cell && !cell.isNullTextString()) {
					typesFirst.push({col: col, type: cell.getType()});
				}
			});
			rowSecond._setPropertyNoEmpty(null, null, function(cell, row, col) {
				if (cell && !cell.isNullTextString()) {
					typesSecond.push({col: col, type: cell.getType()});
				}
			});
			var indexFirst = 0;
			var indexSecond = 0;
			while (indexFirst < typesFirst.length && indexSecond < typesSecond.length) {
				var curFirst = typesFirst[indexFirst];
				var curSecond = typesSecond[indexSecond];
				if (curFirst.col < curSecond.col) {
					indexFirst++;
				} else if (curFirst.col > curSecond.col) {
					indexSecond++;
				} else {
					if (curFirst.type != curSecond.type) {
						//has head
						res = true;
						break;
					}
					indexFirst++;
					indexSecond++;
				}
			}
		}
		worksheet.bExcludeHiddenRows = oldExcludeVal;

		return res;
	}

	/**
	 * @constructor
	 */
	function Range(worksheet, r1, c1, r2, c2){
		this.worksheet = worksheet;
		this.bbox = new Asc.Range(c1, r1, c2, r2);
	}
	Range.prototype.createFromBBox=function(worksheet, bbox){
		var oRes = new Range(worksheet, bbox.r1, bbox.c1, bbox.r2, bbox.c2);
		oRes.bbox = bbox.clone();
		return oRes;
	};
	Range.prototype.clone=function(oNewWs){
		if(!oNewWs)
			oNewWs = this.worksheet;
		return this.createFromBBox(oNewWs, this.bbox);
	};
	Range.prototype._foreach = function(action) {
		if (null != action) {
			var wb = this.worksheet.workbook;
			var tempCell = new Cell(this.worksheet);
			wb.loadCells.push(tempCell);
			var oBBox = this.bbox;
			for (var i = oBBox.r1; i <= oBBox.r2; i++) {
				if (this.worksheet.bExcludeHiddenRows && this.worksheet.getRowHidden(i)) {
					continue;
				}
				for (var j = oBBox.c1; j <= oBBox.c2; j++) {
					var targetCell = null;
					for (var k = 0; k < wb.loadCells.length - 1; ++k) {
						var elem = wb.loadCells[k];
						if (elem.nRow == i && elem.nCol == j && this.worksheet === elem.ws) {
							targetCell = elem;
							break;
						}
					}
					if (null === targetCell) {
						if (!tempCell.loadContent(i, j)) {
							this.worksheet._initCell(tempCell, i, j);
						}
						action(tempCell, i, j, oBBox.r1, oBBox.c1);
						tempCell.saveContent(true);
					} else {
						action(targetCell, i, j, oBBox.r1, oBBox.c1);
					}
				}
			}
			wb.loadCells.pop();
		}
	};
	Range.prototype._foreach2=function(action){
		if(null != action)
		{
			var wb = this.worksheet.workbook;
			var oRes;
			var tempCell = new Cell(this.worksheet);
			wb.loadCells.push(tempCell);
			var oBBox = this.bbox, minC = Math.min( this.worksheet.getColDataLength(), oBBox.c2 ), minR = Math.min( this.worksheet.cellsByColRowsCount - 1, oBBox.r2 );
			for(var i = oBBox.r1; i <= minR; i++){
				if (this.worksheet.bExcludeHiddenRows && this.worksheet.getRowHidden(i)) {
					continue;
				}
				for(var j = oBBox.c1; j <= minC; j++){
					var targetCell = null;
					for (var k = 0; k < wb.loadCells.length - 1; ++k) {
						var elem = wb.loadCells[k];
						if (elem.nRow == i && elem.nCol == j && this.worksheet === elem.ws) {
							targetCell = elem;
							break;
						}
					}
					if (null === targetCell) {
						if (tempCell.loadContent(i, j)) {
							oRes = action(tempCell, i, j, oBBox.r1, oBBox.c1);
							tempCell.saveContent(true);
						} else {
							oRes = action(null, i, j, oBBox.r1, oBBox.c1);
						}
					} else {
						oRes = action(targetCell, i, j, oBBox.r1, oBBox.c1);
					}

					if(null != oRes){
						wb.loadCells.pop();
						return oRes;
					}
				}
			}
			wb.loadCells.pop();
		}
	};
	Range.prototype._foreachNoEmpty = function(actionCell, actionRow, excludeHiddenRows) {
		var oRes, i, oBBox = this.bbox, minR = Math.max(this.worksheet.cellsByColRowsCount - 1, this.worksheet.rowsData.getSize() - 1);
		minR = Math.min(minR, oBBox.r2);
		if (actionCell || actionRow) {
			var itRow = new RowIterator();
			if (actionCell) {
				itRow.init(this.worksheet, this.bbox.r1, this.bbox.c1, this.bbox.c2);
			}
			var bExcludeHiddenRows = (this.worksheet.bExcludeHiddenRows || excludeHiddenRows);
			var excludedCount = 0;
			var tempCell;
			var tempRow = new AscCommonExcel.Row(this.worksheet);
			var allRow = this.worksheet.getAllRow();
			var allRowHidden = allRow && allRow.getHidden();
			for (i = oBBox.r1; i <= minR; i++) {
				if (actionRow) {
					if (tempRow.loadContent(i)) {
						if (bExcludeHiddenRows && tempRow.getHidden()) {
							excludedCount++;
							continue;
						}
						oRes = actionRow(tempRow, excludedCount);
						tempRow.saveContent(true);
						if (null != oRes) {
							if (actionCell) {
								itRow.release();
							}
							return oRes;
						}
					} else if (bExcludeHiddenRows && allRowHidden) {
						excludedCount++;
						continue;
					}
				} else if (bExcludeHiddenRows && this.worksheet.getRowHidden(i)) {
					excludedCount++;
					continue;
				}
				if (actionCell) {
					itRow.setRow(i);
					while (tempCell = itRow.next()) {
						oRes = actionCell(tempCell, i, tempCell.nCol, oBBox.r1, oBBox.c1, excludedCount);
						if (null != oRes) {
							if (actionCell) {
								itRow.release();
							}
							return oRes;
						}
					}
				}
			}
			if (actionCell) {
				itRow.release();
			}
		}
	};
	Range.prototype._foreachNoEmptyByCol = function(actionCell, excludeHiddenRows) {
		var oRes, i, j, colData;
		var wb = this.worksheet.workbook;
		var oBBox = this.bbox, minR = Math.min(this.worksheet.cellsByColRowsCount - 1, oBBox.r2);
		var minC = Math.min(this.worksheet.getColDataLength() - 1, oBBox.c2);
		if (actionCell && oBBox.c1 <= minC && oBBox.r1 <= minR) {
			var bExcludeHiddenRows = (this.worksheet.bExcludeHiddenRows || excludeHiddenRows);
			var excludedCount = 0;
			var tempCell = new Cell(this.worksheet);
			wb.loadCells.push(tempCell);
			for (j = oBBox.c1; j <= minC; ++j) {
				colData = this.worksheet.getColDataNoEmpty(j);
				if (colData) {
					for (i = oBBox.r1; i <= Math.min(minR, colData.getSize() - 1); i++) {
						if (bExcludeHiddenRows && this.worksheet.getRowHidden(i)) {
							excludedCount++;
							continue;
						}
						var targetCell = null;
						for (var k = 0; k < wb.loadCells.length - 1; ++k) {
							var elem = wb.loadCells[k];
							if (elem.nRow == i && elem.nCol == j && this.worksheet === elem.ws) {
								targetCell = elem;
								break;
							}
						}
						if (null === targetCell) {
							if (tempCell.loadContent(i, j, colData)) {
								oRes = actionCell(tempCell, i, j, oBBox.r1, oBBox.c1, excludedCount);
								tempCell.saveContent(true);
							}
						} else {
							oRes = actionCell(targetCell, i, j, oBBox.r1, oBBox.c1, excludedCount);
						}
						if (null != oRes) {
							wb.loadCells.pop();
							return oRes;
						}
					}
				}
			}
			wb.loadCells.pop();
		}
	};
	Range.prototype._foreachRow = function(actionRow, actionCell){
		var oBBox = this.bbox;
		if (null != actionRow) {
			var tempRow = new AscCommonExcel.Row(this.worksheet);
			for (var i = oBBox.r1; i <= oBBox.r2; i++) {
				if (!tempRow.loadContent(i)) {
					this.worksheet._initRow(tempRow, i);
				}
				if (this.worksheet.bExcludeHiddenRows && tempRow.getHidden()) {
					continue;
				}
				actionRow(tempRow);
				tempRow.saveContent(true);
			}
		}
		if (null != actionCell) {
			return this._foreachNoEmpty(actionCell);
		}
	};
	Range.prototype._foreachRowNoEmpty = function(actionRow, actionCell, excludeHiddenRows) {
		return this._foreachNoEmpty(actionCell, actionRow, excludeHiddenRows);
	};
	Range.prototype._foreachCol = function(actionCol, actionCell){
		var oBBox = this.bbox;
		if(null != actionCol)
		{
			for(var i = oBBox.c1; i <= oBBox.c2; ++i)
			{
				var col = this.worksheet._getCol(i);
				if(null != col)
					actionCol(col);
			}
		}
		if(null != actionCell) {
			this._foreachNoEmpty(actionCell);
						}
	};
	Range.prototype._foreachColNoEmpty=function(actionCol, actionCell){
		var oBBox = this.bbox;
		var minC = Math.min(oBBox.c2, this.worksheet.aCols.length);
			if(null != actionCol)
			{
				for(var i = oBBox.c1; i <= minC; ++i)
				{
					var col = this.worksheet._getColNoEmpty(i);
					if(null != col)
					{
						var oRes = actionCol(col);
						if(null != oRes)
							return oRes;
					}
				}
			}
		if (null != actionCell) {
			return this._foreachNoEmpty(actionCell);
		}
	};
	Range.prototype._getRangeType=function(oBBox){
		if(null == oBBox)
			oBBox = this.bbox;
		return getRangeType(oBBox);
	};
	Range.prototype._getValues = function (numbers) {
		var res = [];
		var fAction = numbers ? function (c) {
			var v = c.getNumberValue();
			if (null !== v) {
				res.push(v);
			}
		} : function (c) {
			res.push(new CellTypeAndValue(c.getType(), c.getValueWithoutFormat()));
		};
		this._setPropertyNoEmpty(null, null, fAction);
		return res;
	};
	Range.prototype._getValuesAndMap = function (withEmpty) {
		var v, arrRes = [], mapRes = {};
		var fAction = function(c) {
			v = c.getValueWithoutFormat();
			arrRes.push(new CellTypeAndValue(c.getType(), v));
			mapRes[v.toLowerCase()] = true;
		};
		if (withEmpty) {
			this._setProperty(null, null, fAction);
		} else {
			this._setPropertyNoEmpty(null, null, fAction);
		}
		return {values: arrRes, map: mapRes};
	};
	Range.prototype._setProperty=function(actionRow, actionCol, actionCell){
		var nRangeType = this._getRangeType();
		if(c_oRangeType.Range == nRangeType)
			this._foreach(actionCell);
		else if(c_oRangeType.Row == nRangeType)
			this._foreachRow(actionRow, actionCell);
		else if(c_oRangeType.Col == nRangeType)
			this._foreachCol(actionCol, actionCell);
		else
		{
			//сюда не должны заходить вообще
			// this._foreachRow(actionRow, actionCell);
			// if(null != actionCol)
			// this._foreachCol(actionCol, null);
		}
	};
	Range.prototype._setPropertyNoEmpty=function(actionRow, actionCol, actionCell){
		var nRangeType = this._getRangeType();
		if(c_oRangeType.Range == nRangeType)
			return this._foreachNoEmpty(actionCell);
		else if(c_oRangeType.Row == nRangeType)
			return this._foreachRowNoEmpty(actionRow, actionCell);
		else if(c_oRangeType.Col == nRangeType)
			return this._foreachColNoEmpty(actionCol, actionCell);
		else
		{
			var oRes = this._foreachRowNoEmpty(actionRow, actionCell);
			if(null != oRes)
				return oRes;
			if(null != actionCol)
				oRes = this._foreachColNoEmpty(actionCol, null);
			return oRes;
		}
	};
	Range.prototype.containCell=function(cellId){
		var cellAddress = cellId;
		return 	cellAddress.getRow0() >= this.bbox.r1 && cellAddress.getCol0() >= this.bbox.c1 &&
			cellAddress.getRow0() <= this.bbox.r2 && cellAddress.getCol0() <= this.bbox.c2;
	};
	Range.prototype.containCell2=function(cell){
		return 	cell.nRow >= this.bbox.r1 && cell.nCol >= this.bbox.c1 &&
			cell.nRow <= this.bbox.r2 && cell.nCol <= this.bbox.c2;
	};
	Range.prototype.cross = function(bbox){
		if( bbox.r1 >= this.bbox.r1 && bbox.r1 <= this.bbox.r2 && this.bbox.c1 == this.bbox.c2)
			return {r:bbox.r1};
		if( bbox.c1 >= this.bbox.c1 && bbox.c1 <= this.bbox.c2 && this.bbox.r1 == this.bbox.r2)
			return {c:bbox.c1};

		return undefined;
	};
	Range.prototype.getWorksheet=function(){
		return this.worksheet;
	};
	Range.prototype.isFormula = function(){
		var nRow = this.bbox.r1;
		var nCol = this.bbox.c1;
		var isFormula;
		this.worksheet._getCellNoEmpty(nRow, nCol, function(cell) {
			isFormula = cell.isFormula();
		});
		return isFormula;
	};
	Range.prototype.isOneCell=function(){
		var oBBox = this.bbox;
		return oBBox.r1 == oBBox.r2 && oBBox.c1 == oBBox.c2;
	};
	Range.prototype.getBBox0=function(){
		//0 - based
		return this.bbox;
	};
	Range.prototype.getName=function(){
		return this.bbox.getName();
	};
	Range.prototype.setValue=function(val,callback, isCopyPaste, byRef){
		History.Create_NewPoint();
		History.StartTransaction();
		this._foreach(function(cell){
			cell.setValue(val,callback, isCopyPaste, byRef);
			// if(cell.isEmpty())
			// cell.Remove();
		});
		History.EndTransaction();
	};
	Range.prototype.setValue2=function(array){
		History.Create_NewPoint();
		History.StartTransaction();
		//[{"text":"qwe","format":{"b":true, "i":false, "u":Asc.EUnderline.underlineNone, "s":false, "fn":"Arial", "fs": 12, "c": 0xff00ff, "va": "subscript"  }},{}...]
		/*
		 Устанавливаем значение в Range ячеек. В отличае от setValue, сюда мы попадаем только в случае ввода значения отличного от формулы. Таким образом, если в ячейке была формула, то для нее в графе очищается список ячеек от которых зависела. После чего выставляем флаг о необходимости пересчета.
		 */
		this._foreach(function(cell){
			cell.setValue2(array);
			// if(cell.isEmpty())
			// cell.Remove();
		});
		History.EndTransaction();
	};
	Range.prototype.setValueData = function(val){
		History.Create_NewPoint();
		History.StartTransaction();
		
		this._foreach(function(cell){
			cell.setValueData(val);
		});
		History.EndTransaction();
	};
	Range.prototype.setCellStyle=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setCellStyle(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setCellStyle(val);
						  },
						  function(col){
							  col.setCellStyle(val);
						  },
						  function(cell){
							  cell.setCellStyle(val);
						  });
	};
	Range.prototype.clearTableStyle = function() {
		this.worksheet.sheetMergedStyles.clearTablePivotStyle(this.bbox);
	};
	Range.prototype.setTableStyle = function(xf, stripe) {
		if (xf) {
			this.worksheet.sheetMergedStyles.setTablePivotStyle(this.bbox, xf, stripe);
		}
	};
	Range.prototype.setNumFormat=function(val){
		this.setNum(new AscCommonExcel.Num({f:val}));
	};
	Range.prototype.setNum = function(val) {
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if (c_oRangeType.All == nRangeType) {
			this.worksheet.getAllCol().setNum(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row) {
							  if (c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setNum(val);
						  },
						  function(col) {
							  col.setNum(val);
						  },
						  function(cell) {
							  cell.setNum(val);
						  });
	};
	Range.prototype.shiftNumFormat=function(nShift, aDigitsCount){
		History.Create_NewPoint();
		var bRes = false;
		this._setPropertyNoEmpty(null, null, function(cell, nRow0, nCol0, nRowStart, nColStart){
			bRes |= cell.shiftNumFormat(nShift, aDigitsCount[nCol0 - nColStart]);
		});
		return bRes;
	};
	Range.prototype.setFont=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setFont(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setFont(val);
						  },
						  function(col){
							  col.setFont(val);
						  },
						  function(cell){
							  cell.setFont(val);
						  });
	};
	Range.prototype.setFontname=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setFontname(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setFontname(val);
						  },
						  function(col){
							  col.setFontname(val);
						  },
						  function(cell){
							  cell.setFontname(val);
						  });
	};
	Range.prototype.setFontsize=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setFontsize(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setFontsize(val);
						  },
						  function(col){
							  col.setFontsize(val);
						  },
						  function(cell){
							  cell.setFontsize(val);
						  });
	};
	Range.prototype.setFontcolor=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setFontcolor(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setFontcolor(val);
						  },
						  function(col){
							  col.setFontcolor(val);
						  },
						  function(cell){
							  cell.setFontcolor(val);
						  });
	};
	Range.prototype.setBold=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setBold(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setBold(val);
						  },
						  function(col){
							  col.setBold(val);
						  },
						  function(cell){
							  cell.setBold(val);
						  });
	};
	Range.prototype.setItalic=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setItalic(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setItalic(val);
						  },
						  function(col){
							  col.setItalic(val);
						  },
						  function(cell){
							  cell.setItalic(val);
						  });
	};
	Range.prototype.setUnderline=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setUnderline(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setUnderline(val);
						  },
						  function(col){
							  col.setUnderline(val);
						  },
						  function(cell){
							  cell.setUnderline(val);
						  });
	};
	Range.prototype.setStrikeout=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setStrikeout(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setStrikeout(val);
						  },
						  function(col){
							  col.setStrikeout(val);
						  },
						  function(cell){
							  cell.setStrikeout(val);
						  });
	};
	Range.prototype.setFontAlign=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setFontAlign(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setFontAlign(val);
						  },
						  function(col){
							  col.setFontAlign(val);
						  },
						  function(cell){
							  cell.setFontAlign(val);
						  });
	};
	Range.prototype.setAlignVertical=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setAlignVertical(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setAlignVertical(val);
						  },
						  function(col){
							  col.setAlignVertical(val);
						  },
						  function(cell){
							  cell.setAlignVertical(val);
						  });
	};
	Range.prototype.setAlignHorizontal=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setAlignHorizontal(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setAlignHorizontal(val);
						  },
						  function(col){
							  col.setAlignHorizontal(val);
						  },
						  function(cell){
							  cell.setAlignHorizontal(val);
						  });
	};
	Range.prototype.setFill=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setFill(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setFill(val);
						  },
						  function(col){
							  col.setFill(val);
						  },
						  function(cell){
							  cell.setFill(val);
						  });
	};
	Range.prototype.setFillColor=function(val){
		var fill = new AscCommonExcel.Fill();
		fill.fromColor(val);
		return this.setFill(fill);
	};
	Range.prototype.setBorderSrc=function(border){
		History.Create_NewPoint();
		History.StartTransaction();
		if (null == border)
			border = new Border();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setBorder(border.clone());
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setBorder(border.clone());
						  },
						  function(col){
							  col.setBorder(border.clone());
						  },
						  function(cell){
							  cell.setBorder(border.clone());
						  });
		History.EndTransaction();
	};
	Range.prototype._setBorderMerge=function(bLeft, bTop, bRight, bBottom, oNewBorder, oCurBorder){
		var oTargetBorder = new Border();
		//не делаем clone для свойств потому у нас нельзя поменять свойство отдельное свойство border можно только применить border целиком
		if(bLeft)
			oTargetBorder.l = oNewBorder.l;
		else
			oTargetBorder.l = oNewBorder.iv;
		if(bTop)
			oTargetBorder.t = oNewBorder.t;
		else
			oTargetBorder.t = oNewBorder.ih;
		if(bRight)
			oTargetBorder.r = oNewBorder.r;
		else
			oTargetBorder.r = oNewBorder.iv;
		if(bBottom)
			oTargetBorder.b = oNewBorder.b;
		else
			oTargetBorder.b = oNewBorder.ih;
		oTargetBorder.d = oNewBorder.d;
		oTargetBorder.dd = oNewBorder.dd;
		oTargetBorder.du = oNewBorder.du;
		var oRes = null;
		if(null != oCurBorder)
		{
			oCurBorder.mergeInner(oTargetBorder);
			oRes = oCurBorder;
		}
		else
			oRes = oTargetBorder;
		return oRes;
	};
	Range.prototype._setCellBorder=function(bbox, cell, oNewBorder){
		if(null == oNewBorder)
			cell.setBorder(oNewBorder);
		else
		{
			var oCurBorder = null;
			if(null != cell.xfs && null != cell.xfs.border)
				oCurBorder = cell.xfs.border.clone();
			else
				oCurBorder = g_oDefaultFormat.Border.clone();
			var nRow = cell.nRow;
			var nCol = cell.nCol;
			cell.setBorder(this._setBorderMerge(nCol == bbox.c1, nRow == bbox.r1, nCol == bbox.c2, nRow == bbox.r2, oNewBorder, oCurBorder));
		}
	};
	Range.prototype._setRowColBorder=function(bbox, rowcol, bRow, oNewBorder){
		if(null == oNewBorder)
			rowcol.setBorder(oNewBorder);
		else
		{
			var oCurBorder = null;
			if(null != rowcol.xfs && null != rowcol.xfs.border)
				oCurBorder = rowcol.xfs.border.clone();
			var bLeft, bTop, bRight, bBottom = false;
			if(bRow)
			{
				bTop = rowcol.index == bbox.r1;
				bBottom = rowcol.index == bbox.r2;
			}
			else
			{
				bLeft = rowcol.index == bbox.c1;
				bRight = rowcol.index == bbox.c2;
			}
			rowcol.setBorder(this._setBorderMerge(bLeft, bTop, bRight, bBottom, oNewBorder, oCurBorder));
		}
	};
	Range.prototype._setBorderEdge=function(bbox, oItemWithXfs, nRow, nCol, oNewBorder){
		var oCurBorder = null;
		if(null != oItemWithXfs.xfs && null != oItemWithXfs.xfs.border)
			oCurBorder = oItemWithXfs.xfs.border;
		if(null != oCurBorder)
		{
			var oCurBorderProp = null;
			if(nCol == bbox.c1 - 1)
				oCurBorderProp = oCurBorder.r;
			else if(nRow == bbox.r1 - 1)
				oCurBorderProp = oCurBorder.b;
			else if(nCol == bbox.c2 + 1)
				oCurBorderProp = oCurBorder.l;
			else if(nRow == bbox.r2 + 1)
				oCurBorderProp = oCurBorder.t;
			var oNewBorderProp = null;
			if(null == oNewBorder)
				oNewBorderProp = new AscCommonExcel.BorderProp();
			else
			{
				if(nCol == bbox.c1 - 1)
					oNewBorderProp = oNewBorder.l;
				else if(nRow == bbox.r1 - 1)
					oNewBorderProp = oNewBorder.t;
				else if(nCol == bbox.c2 + 1)
					oNewBorderProp = oNewBorder.r;
				else if(nRow == bbox.r2 + 1)
					oNewBorderProp = oNewBorder.b;
			}

			if(null != oNewBorderProp && null != oCurBorderProp && c_oAscBorderStyles.None != oCurBorderProp.s && (null == oNewBorder || c_oAscBorderStyles.None != oNewBorderProp.s) &&
				(oNewBorderProp.s != oCurBorderProp.s || oNewBorderProp.getRgbOrNull() != oCurBorderProp.getRgbOrNull())){
				var oTargetBorder = oCurBorder.clone();
				if(nCol == bbox.c1 - 1)
					oTargetBorder.r = new AscCommonExcel.BorderProp();
				else if(nRow == bbox.r1 - 1)
					oTargetBorder.b = new AscCommonExcel.BorderProp();
				else if(nCol == bbox.c2 + 1)
					oTargetBorder.l = new AscCommonExcel.BorderProp();
				else if(nRow == bbox.r2 + 1)
					oTargetBorder.t = new AscCommonExcel.BorderProp();
				oItemWithXfs.setBorder(oTargetBorder);
			}
		}
	};
	Range.prototype.setBorder=function(border){
		//border = null очисть border
		//"ih" - внутренние горизонтальные, "iv" - внутренние вертикальные
		History.Create_NewPoint();
		var _this = this;
		var oBBox = this.bbox;
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			var oAllCol = this.worksheet.getAllCol();
			_this._setRowColBorder(oBBox, oAllCol, false, border);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  _this._setRowColBorder(oBBox, row, true, border);
						  },
						  function(col){
							  _this._setRowColBorder(oBBox, col, false, border);
						  },
						  function(cell){
							  _this._setCellBorder(oBBox, cell, border);
						  });
		//убираем граничные border
		var aEdgeBorders = [];
		if(oBBox.c1 > 0 && (null == border || !border.l.isEmpty()))
			aEdgeBorders.push(this.worksheet.getRange3(oBBox.r1, oBBox.c1 - 1, oBBox.r2, oBBox.c1 - 1));
		if(oBBox.r1 > 0 && (null == border || !border.t.isEmpty()))
			aEdgeBorders.push(this.worksheet.getRange3(oBBox.r1 - 1, oBBox.c1, oBBox.r1 - 1, oBBox.c2));
		if(oBBox.c2 < gc_nMaxCol0 && (null == border || !border.r.isEmpty()))
			aEdgeBorders.push(this.worksheet.getRange3(oBBox.r1, oBBox.c2 + 1, oBBox.r2, oBBox.c2 + 1));
		if(oBBox.r2 < gc_nMaxRow0 && (null == border || !border.b.isEmpty()))
			aEdgeBorders.push(this.worksheet.getRange3(oBBox.r2 + 1, oBBox.c1, oBBox.r2 + 1, oBBox.c2));
		for(var i = 0, length = aEdgeBorders.length; i < length; i++)
		{
			var range = aEdgeBorders[i];
			range._setPropertyNoEmpty(function(row){
										  if(c_oRangeType.All == nRangeType && null == row.xfs)
											  return;
										  _this._setBorderEdge(oBBox, row, row.index, 0, border);
									  },
									  function(col){
										  _this._setBorderEdge(oBBox, col, 0, col.index, border);
									  },
									  function(cell){
										  _this._setBorderEdge(oBBox, cell, cell.nRow, cell.nCol, border);
									  });
		}
	};
	Range.prototype.setShrinkToFit=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setShrinkToFit(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setShrinkToFit(val);
						  },
						  function(col){
							  col.setShrinkToFit(val);
						  },
						  function(cell){
							  cell.setShrinkToFit(val);
						  });
	};
	Range.prototype.setWrap=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setWrap(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setWrap(val);
						  },
						  function(col){
							  col.setWrap(val);
						  },
						  function(cell){
							  cell.setWrap(val);
						  });
	};
	Range.prototype.setAngle=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setAngle(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setAngle(val);
						  },
						  function(col){
							  col.setAngle(val);
						  },
						  function(cell){
							  cell.setAngle(val);
						  });
	};
	Range.prototype.setVerticalText=function(val){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			this.worksheet.getAllCol().setVerticalText(val);
			fSetProperty = this._setPropertyNoEmpty;
		}
		fSetProperty.call(this, function(row){
							  if(c_oRangeType.All == nRangeType && null == row.xfs)
								  return;
							  row.setVerticalText(val);
						  },
						  function(col){
							  col.setVerticalText(val);
						  },
						  function(cell){
							  cell.setVerticalText(val);
						  });
	};
	Range.prototype.setType=function(type){
		History.Create_NewPoint();
		this.createCellOnRowColCross();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
			fSetProperty = this._setPropertyNoEmpty;
		fSetProperty.call(this, null, null,
						  function(cell){
							  cell.setType(type);
						  });
	};
	Range.prototype.getType=function(){
		var type;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			if(null != cell)
				type = cell.getType();
			else
				type = null;
		});
		return type;
	};
	Range.prototype.isNullText=function(){
		var isNullText;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			isNullText = (null != cell) ? cell.isNullText() : true;
		});
		return isNullText;
	};
	Range.prototype.isEmptyTextString=function(){
		var isEmptyTextString;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			isEmptyTextString = (null != cell) ? cell.isEmptyTextString() : true;
		});
		return isEmptyTextString;
	};
	Range.prototype.isNullTextString=function(){
		var isNullTextString;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			isNullTextString = (null != cell) ? cell.isNullTextString() : true;
		});
		return isNullTextString;
	};
	Range.prototype.isFormula=function(){
		var isFormula;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			isFormula = (null != cell) ? cell.isFormula() : false;
		});
		return isFormula;
	};
	Range.prototype.getFormula=function(){
		var formula;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			if(null != cell)
				formula = cell.getFormula();
			else
				formula = "";
		});
		return formula;
	};
	Range.prototype.getValueForEdit=function(checkFormulaArray){
		var t = this;
		var valueForEdit;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			if(null != cell)
			{
				valueForEdit = cell.getValueForEdit(checkFormulaArray);
			}
			else
				valueForEdit = "";
		});
		return valueForEdit;
	};
	Range.prototype.getValueForEdit2=function(){
		var t = this;
		var valueForEdit2;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			if(null != cell)
			{
				valueForEdit2 = cell.getValueForEdit2();
			}
			else
			{
				var xfs = null;
				t.worksheet._getRowNoEmpty(t.bbox.r1, function(row){
					var oCol = t.worksheet._getColNoEmptyWithAll(t.bbox.c1);
					if(row && null != row.xfs)
						xfs = row.xfs.clone();
					else if(null != oCol && null != oCol.xfs)
						xfs = oCol.xfs.clone();
				});
				var oTempCell = new Cell(t.worksheet);
				oTempCell.setRowCol(t.bbox.r1, t.bbox.c1);
				oTempCell.setStyleInternal(xfs);
				valueForEdit2 = oTempCell.getValueForEdit2();
			}
		});
		return valueForEdit2;
	};
	Range.prototype.getValueWithoutFormat=function(){
		var valueWithoutFormat;
		this.worksheet._getCellNoEmpty(this.bbox.r1, this.bbox.c1, function(cell) {
			if(null != cell)
				valueWithoutFormat = cell.getValueWithoutFormat();
			else
				valueWithoutFormat = "";
		});
		return valueWithoutFormat;
	};
	Range.prototype.getValue=function(){
		return this.getValueWithoutFormat();
	};
	Range.prototype.getValueWithFormat=function(){
		var value;
		this.worksheet._getCellNoEmpty(this.bbox.r1, this.bbox.c1, function(cell) {
			if(null != cell)
				value = cell.getValue();
			else
				value = "";
		});
		return value;
	};
	Range.prototype.getValue2=function(dDigitsCount, fIsFitMeasurer){
		//[{"text":"qwe","format":{"b":true, "i":false, "u":Asc.EUnderline.underlineNone, "s":false, "fn":"Arial", "fs": 12, "c": 0xff00ff, "va": "subscript"  }},{}...]
		var t = this;
		var value2;
		this.worksheet._getCellNoEmpty(this.bbox.r1, this.bbox.c1, function(cell){
			if(null != cell)
				value2 = cell.getValue2(dDigitsCount, fIsFitMeasurer);
			else
			{
				var xfs = null;
				t.worksheet._getRowNoEmpty(t.bbox.r1, function(row){
					var oCol = t.worksheet._getColNoEmptyWithAll(t.bbox.c1);

					if(row && null != row.xfs)
						xfs = row.xfs.clone();
					else if(null != oCol && null != oCol.xfs)
						xfs = oCol.xfs.clone();
				});
				var oTempCell = new Cell(t.worksheet);
				oTempCell.setRowCol(t.bbox.r1, t.bbox.c1);
				oTempCell.setStyleInternal(xfs);
				value2 = oTempCell.getValue2(dDigitsCount, fIsFitMeasurer);
			}
		});
		return value2;
	};
	Range.prototype.getNumberValue = function() {
		var numberValue;
		this.worksheet._getCellNoEmpty(this.bbox.r1, this.bbox.c1, function(cell) {
			numberValue = null != cell ? cell.getNumberValue() : null;
		});
		return numberValue;
	};
	Range.prototype.getValueData=function(){
		var res = null;
		this.worksheet._getCellNoEmpty(this.bbox.r1, this.bbox.c1, function(cell) {
			if(null != cell)
				res = cell.getValueData();
		});
		return res;
	};
	Range.prototype.getXfId = function () {
		var t = this;
		var nRow = this.bbox.r1;
		var nCol = this.bbox.c1;
		var XfId = g_oDefaultFormat.XfId;
		this.worksheet._getCellNoEmpty(nRow, nCol, function (cell) {
			var xfs = cell ? cell.getCompiledStyle() : t.worksheet.getCompiledStyle(nRow, nCol);
			if (xfs && null !== xfs.XfId) {
				XfId = xfs.XfId;
			}
		});
		return XfId;
	};
	Range.prototype.getStyleName=function(){
		var res = this.worksheet.workbook.CellStyles.getStyleNameByXfId(this.getXfId());

		// ToDo убрать эту заглушку (нужно делать на открытии) в InitStyleManager
		return res || this.worksheet.workbook.CellStyles.getStyleNameByXfId(g_oDefaultFormat.XfId);
	};
	Range.prototype.getTableStyle=function(){
		var tableStyle;
		this.worksheet._getCellNoEmpty(this.bbox.r1,this.bbox.c1, function(cell) {
			tableStyle = cell ? cell.getTableStyle() : null;
		});
		return tableStyle;
	};
	Range.prototype.getCompiledStyleCustom = function(needTable, needCell, needConditional) {
		return this.worksheet.getCompiledStyleCustom(this.bbox.r1,this.bbox.c1, needTable, needCell, needConditional);
	};
	Range.prototype.getNumFormat=function(){
		return oNumFormatCache.get(this.getNumFormatStr());
	};
	Range.prototype.getNumFormatStr = function () {
		var t = this;
		var nRow = this.bbox.r1;
		var nCol = this.bbox.c1;
		var numFormatStr = g_oDefaultFormat.Num.getFormat();
		;this.worksheet._getCellNoEmpty(nRow, nCol, function (cell) {
			var xfs = cell ? cell.getCompiledStyle() : t.worksheet.getCompiledStyle(nRow, nCol);
			if (xfs && xfs.num) {
				numFormatStr = xfs.num.getFormat();
			}
		});
		return numFormatStr;
	};
	Range.prototype.getNumFormatType=function(){
		return this.getNumFormat().getType();
	};
	Range.prototype.getNumFormatTypeInfo=function(){
		return this.getNumFormat().getTypeInfo();
	};
// Узнаем отличается ли шрифт (размер и гарнитура) в ячейке от шрифта в строке
	Range.prototype.isNotDefaultFont = function () {
		// Получаем фонт ячейки
		var t = this;
		var cellFont = this.getFont();
		var rowFont = g_oDefaultFormat.Font;
		this.worksheet._getRowNoEmpty(this.bbox.r1, function(row) {
			if (row && null != row.xfs && null != row.xfs.font)
				rowFont = row.xfs.font;
			else if (null != t.worksheet.oAllCol && t.worksheet.oAllCol.xfs && t.worksheet.oAllCol.xfs.font)
				rowFont = t.worksheet.oAllCol.xfs.font;
		});

		return (cellFont.getName() !== rowFont.getName() || cellFont.getSize() !== rowFont.getSize());
	};
	Range.prototype.getFont = function (original) {
		var t = this;
		var nRow = this.bbox.r1;
		var nCol = this.bbox.c1;
		var font = g_oDefaultFormat.Font;
		this.worksheet._getCellNoEmpty(nRow, nCol, function (cell) {
			var xfs;
			if (cell) {
				xfs = original ? cell.getStyle() : cell.getCompiledStyle();
			} else {
				xfs = t.worksheet.getCompiledStyle(nRow, nCol, null, original ? emptyStyleComponents : null);
			}
			if (xfs && xfs.font) {
				font = xfs.font;
			}
		});
		return font
	};
	Range.prototype.getAlignHorizontalByValue=function(align){
		//возвращает Align в зависимости от значния в ячейке
		//values:  none, center, justify, left , right, null
		var t = this;
		if(null == align){
			//пытаемся определить по значению
			var nRow = this.bbox.r1;
			var nCol = this.bbox.c1;
			this.worksheet._getCellNoEmpty(nRow, nCol, function(cell) {
				if(cell){
					switch(cell.getType()){
						case CellValueType.String:align = AscCommon.align_Left;break;
						case CellValueType.Bool:
						case CellValueType.Error:align = AscCommon.align_Center;break;
						default:
							//Если есть value и не проставлен тип значит это число, у всех остальных типов значение не null
							if(t.getValueWithoutFormat())
							{
								//смотрим
								var oNumFmt = t.getNumFormat();
								if(true == oNumFmt.isTextFormat())
									align = AscCommon.align_Left;
								else
									align = AscCommon.align_Right;
							}
							else
								align = AscCommon.align_Left;
							break;
					}
				}
			});
			if(null == align)
				align = AscCommon.align_Left;
		}
		return align;
	};
	Range.prototype.getFillColor = function () {
		return this.getFill().bg();
	};
	Range.prototype.getFill = function () {
		var t = this;
		var nRow = this.bbox.r1;
		var nCol = this.bbox.c1;
		var fill = g_oDefaultFormat.Fill;
		this.worksheet._getCellNoEmpty(nRow, nCol, function (cell) {
			var xfs = cell ? cell.getCompiledStyle() : t.worksheet.getCompiledStyle(nRow, nCol);
			if (xfs && xfs.fill) {
				fill = xfs.fill;
			}
		});
		return fill;
	};
	Range.prototype.getBorderSrc = function (opt_row, opt_col) {
		//Возвращает как записано в файле, не проверяя бордеры соседних ячеек
		//формат
		//\{"l": {"s": "solid", "c": 0xff0000}, "t": {} ,"r": {} ,"b": {} ,"d": {},"dd": false ,"du": false }
		//"s" values: none, thick, thin, medium, dashDot, dashDotDot, dashed, dotted, double, hair, mediumDashDot, mediumDashDotDot, mediumDashed, slantDashDot
		//"dd" diagonal line, starting at the top left corner of the cell and moving down to the bottom right corner of the cell
		//"du" diagonal line, starting at the bottom left corner of the cell and moving up to the top right corner of the cell
		var t = this;
		var nRow = null != opt_row ? opt_row : this.bbox.r1;
		var nCol = null != opt_col ? opt_col : this.bbox.c1;
		var border = g_oDefaultFormat.Border;
		this.worksheet._getCellNoEmpty(nRow, nCol, function (cell) {
			var xfs = cell ? cell.getCompiledStyle() : t.worksheet.getCompiledStyle(nRow, nCol);
			if (xfs && xfs.border) {
				border = xfs.border;
			}
		});
		return border;
	};
	Range.prototype.getBorder = function (opt_row, opt_col) {
		//Возвращает как записано в файле, не проверяя бордеры соседних ячеек
		//формат
		//\{"l": {"s": "solid", "c": 0xff0000}, "t": {} ,"r": {} ,"b": {} ,"d": {},"dd": false ,"du": false }
		//"s" values: none, thick, thin, medium, dashDot, dashDotDot, dashed, dotted, double, hair, mediumDashDot, mediumDashDotDot, mediumDashed, slantDashDot
		//"dd" diagonal line, starting at the top left corner of the cell and moving down to the bottom right corner of the cell
		//"du" diagonal line, starting at the bottom left corner of the cell and moving up to the top right corner of the cell
		return this.getBorderSrc(opt_row, opt_col) || g_oDefaultFormat.Border;
	};
	Range.prototype.getBorderFull=function(){
		//Возвращает как excel, т.е. проверяет бордеры соседних ячеек
		//
		//\{"l": {"s": "solid", "c": 0xff0000}, "t": {} ,"r": {} ,"b": {} ,"d": {},"dd": false ,"du": false }
		//"s" values: none, thick, thin, medium, dashDot, dashDotDot, dashed, dotted, double, hair, mediumDashDot, mediumDashDotDot, mediumDashed, slantDashDot
		//
		//"dd" diagonal line, starting at the top left corner of the cell and moving down to the bottom right corner of the cell
		//"du" diagonal line, starting at the bottom left corner of the cell and moving up to the top right corner of the cell
		var borders = this.getBorder(this.bbox.r1, this.bbox.c1).clone();
		var nRow = this.bbox.r1;
		var nCol = this.bbox.c1;
		if(c_oAscBorderStyles.None === borders.l.s){
			if(nCol > 1){
				var left = this.getBorder(nRow, nCol - 1);
				if(c_oAscBorderStyles.None !== left.r.s)
					borders.l = left.r;
			}
		}
		if(c_oAscBorderStyles.None === borders.t.s){
			if(nRow > 1){
				var top = this.getBorder(nRow - 1, nCol);
				if(c_oAscBorderStyles.None !== top.b.s)
					borders.t = top.b;
			}
		}
		if(c_oAscBorderStyles.None === borders.r.s){
			var right = this.getBorder(nRow, nCol + 1);
			if(c_oAscBorderStyles.None !== right.l.s)
				borders.r = right.l;
		}
		if(c_oAscBorderStyles.None === borders.b.s){
			var bottom = this.getBorder(nRow + 1, nCol);
			if(c_oAscBorderStyles.None !== bottom.t.s)
				borders.b = bottom.t;
		}
		return borders;
	};
	Range.prototype.getAlign=function(){
		//угол от -90 до 90 против часовой стрелки от оси OX
		var t = this;
		var nRow = this.bbox.r1;
		var nCol = this.bbox.c1;
		var align = g_oDefaultFormat.Align;
		this.worksheet._getCellNoEmpty(nRow, nCol, function(cell) {
			var xfs = cell ? cell.getCompiledStyle() : t.worksheet.getCompiledStyle(nRow, nCol);
			if (null != xfs && null != xfs.align) {
				align = xfs.align;
			}
		});
		return align;
	};
	Range.prototype.hasMerged=function(){
		var res = this.worksheet.mergeManager.getAny(this.bbox);
		return res ? res.bbox : null;
	};
	Range.prototype.mergeOpen=function(){
		this.worksheet.mergeManager.add(this.bbox, 1);
	};
	Range.prototype.merge=function(type){
		if(null == type)
			type = Asc.c_oAscMergeOptions.Merge;
		var oBBox = this.bbox;
		History.Create_NewPoint();
		History.StartTransaction();
		if(oBBox.r1 == oBBox.r2 && oBBox.c1 == oBBox.c2){
			if(type == Asc.c_oAscMergeOptions.MergeCenter)
				this.setAlignHorizontal(AscCommon.align_Center);
			History.EndTransaction();
			return;
		}
		if(this.hasMerged())
		{
			this.unmerge();
			if(type == Asc.c_oAscMergeOptions.MergeCenter)
			{
				//сбрасываем AlignHorizontal
				this.setAlignHorizontal(null);
				History.EndTransaction();
				return;
			}
		}
		//пробегаемся по границе диапазона, чтобы посмотреть какие границы нужно оставлять
		var oLeftBorder = null;
		var oTopBorder = null;
		var oRightBorder = null;
		var oBottomBorder = null;
		var nRangeType = this._getRangeType(oBBox);
		if(c_oRangeType.Range == nRangeType)
		{
			var oThis = this;
			var fGetBorder = function(bRow, v1, v2, v3, type)
			{
				var oRes = null;
				for(var i = v1; i <= v2; ++i)
				{
					var bNeedDelete = true;
					oThis.worksheet._getCellNoEmpty(bRow ? v3 : i, bRow ? i : v3, function(cell) {
						if(null != cell && null != cell.xfs && null != cell.xfs.border)
						{
							var border = cell.xfs.border;
							var oBorderProp;
							switch(type)
							{
								case 1: oBorderProp = border.l;break;
								case 2: oBorderProp = border.t;break;
								case 3: oBorderProp = border.r;break;
								case 4: oBorderProp = border.b;break;
							}
							if(false == oBorderProp.isEmpty())
							{
								if(null == oRes)
								{
									oRes = oBorderProp;
									bNeedDelete = false;
								}
								else if(true == oRes.isEqual(oBorderProp))
									bNeedDelete = false;
							}
						}
					});
					if(bNeedDelete)
					{
						oRes = null;
						break;
					}
				}
				return oRes;
			};
			oLeftBorder = fGetBorder(false, oBBox.r1, oBBox.r2, oBBox.c1, 1);
			oTopBorder = fGetBorder(true, oBBox.c1, oBBox.c2, oBBox.r1, 2);
			oRightBorder = fGetBorder(false, oBBox.r1, oBBox.r2, oBBox.c2, 3);
			oBottomBorder = fGetBorder(true, oBBox.c1, oBBox.c2, oBBox.r2, 4);
		}
		else if(c_oRangeType.Row == nRangeType)
		{
			this.worksheet._getRowNoEmpty(oBBox.r1, function(row){
				if(row && null != row.xfs && null != row.xfs.border && false == row.xfs.border.t.isEmpty())
					oTopBorder = row.xfs.border.t;
			});
			if(oBBox.r1 != oBBox.r2)
			{
				this.worksheet._getRowNoEmpty(oBBox.r2, function(row){
					if(row && null != row.xfs && null != row.xfs.border && false == row.xfs.border.b.isEmpty())
						oBottomBorder = row.xfs.border.b;
				});
			}
		}
		else
		{
			var oLeftCol = this.worksheet._getColNoEmptyWithAll(oBBox.c1);
			if(null != oLeftCol && null != oLeftCol.xfs && null != oLeftCol.xfs.border && false == oLeftCol.xfs.border.l.isEmpty())
				oLeftBorder = oLeftCol.xfs.border.l;
			if(oBBox.c1 != oBBox.c2)
			{
				var oRightCol = this.worksheet._getColNoEmptyWithAll(oBBox.c2);
				if(null != oRightCol && null != oRightCol.xfs && null != oRightCol.xfs.border && false == oRightCol.xfs.border.r.isEmpty())
					oRightBorder = oRightCol.xfs.border.r;
			}
		}

		var bFirst = true;
		var oLeftTopCellStyle = null;
		var oFirstCellStyle = null;
		var oFirstCellValue = null;
		var oFirstCellRow = null;
		var oFirstCellCol = null;
		var oFirstCellHyperlink = null;
		this._setPropertyNoEmpty(null,null,
								 function(cell, nRow0, nCol0, nRowStart, nColStart){
									 if(bFirst && false == cell.isNullText())
									 {
										 bFirst = false;
										 oFirstCellStyle = cell.getStyle();
										 oFirstCellValue = cell.getValueData();
										 oFirstCellRow = cell.nRow;
										 oFirstCellCol = cell.nCol;

									 }
									 if(nRow0 == nRowStart && nCol0 == nColStart)
										 oLeftTopCellStyle = cell.getStyle();
								 });
		//правила работы с гиперссылками во время merge(отличются от Excel в случаем областей, например hyperlink: C3:D3 мержим C2:C3)
		// 1)оставляем все ссылки, которые не полностью лежат в merge области
		// 2)оставляем многоклеточные ссылки, top граница которых совпадает с top границей merge области, а высота merge > 1 или совпадает с высотой области merge
		// 3)оставляем и переносим в первую ячейку одну одноклеточную ссылку, если она находится в первой ячейке с данными
		var aHyperlinks = this.worksheet.hyperlinkManager.get(oBBox);
		var aHyperlinksToRestore = [];
		for(var i = 0, length = aHyperlinks.inner.length; i < length; i++)
		{
			var elem = aHyperlinks.inner[i];
			if(oFirstCellRow == elem.bbox.r1 && oFirstCellCol == elem.bbox.c1 && elem.bbox.r1 == elem.bbox.r2 && elem.bbox.c1 == elem.bbox.c2)
			{
				var oNewHyperlink = elem.data.clone();
				oNewHyperlink.Ref.setOffset(new AscCommon.CellBase(oBBox.r1 - oFirstCellRow, oBBox.c1 - oFirstCellCol));
				aHyperlinksToRestore.push(oNewHyperlink);
			}
			else if( oBBox.r1 == elem.bbox.r1 && (elem.bbox.r1 != elem.bbox.r2 || (elem.bbox.c1 != elem.bbox.c2 && oBBox.r1 == oBBox.r2)))
				aHyperlinksToRestore.push(elem.data);
		}
		this.cleanAll();
		//восстанавливаем hyperlink
		for(var i = 0, length = aHyperlinksToRestore.length; i < length; i++)
		{
			var elem = aHyperlinksToRestore[i];
			this.worksheet.hyperlinkManager.add(elem.Ref.getBBox0(), elem);
		}
		var oTargetStyle = null;
		if(null != oFirstCellValue && null != oFirstCellRow && null != oFirstCellCol)
		{
			if(null != oFirstCellStyle)
				oTargetStyle = oFirstCellStyle.clone();
			this.worksheet._getCell(oBBox.r1, oBBox.c1, function(cell){
				cell.setValueData(oFirstCellValue);
			});
			if(null != oFirstCellHyperlink)
			{
				var oLeftTopRange = this.worksheet.getCell3(oBBox.r1, oBBox.c1);
				oLeftTopRange.setHyperlink(oFirstCellHyperlink, true);
			}
		}
		else if(null != oLeftTopCellStyle)
			oTargetStyle = oLeftTopCellStyle.clone();

		//убираем бордеры
		if(null != oTargetStyle)
		{
			if(null != oTargetStyle.border)
				oTargetStyle.border = null;
		}
		else if(null != oLeftBorder || null != oTopBorder || null != oRightBorder || null != oBottomBorder)
			oTargetStyle = new AscCommonExcel.CellXfs();
		var fSetProperty = this._setProperty;
		var nRangeType = this._getRangeType();
		if(c_oRangeType.All == nRangeType)
		{
			fSetProperty = this._setPropertyNoEmpty;
			oTargetStyle = null
		}
		fSetProperty.call(this, function(row){
							  if(null == oTargetStyle)
								  row.setStyle(null);
							  else
							  {
								  var oNewStyle = oTargetStyle.clone();
								  if(row.index == oBBox.r1 && null != oTopBorder)
								  {
									  oNewStyle.border = new Border();
									  oNewStyle.border.t = oTopBorder.clone();
								  }
								  else if(row.index == oBBox.r2 && null != oBottomBorder)
								  {
									  oNewStyle.border = new Border();
									  oNewStyle.border.b = oBottomBorder.clone();
								  }
								  row.setStyle(oNewStyle);
							  }
						  },function(col){
							  if(null == oTargetStyle)
								  col.setStyle(null);
							  else
							  {
								  var oNewStyle = oTargetStyle.clone();
								  if(col.index == oBBox.c1 && null != oLeftBorder)
								  {
									  oNewStyle.border = new Border();
									  oNewStyle.border.l = oLeftBorder.clone();
								  }
								  else if(col.index == oBBox.c2 && null != oRightBorder)
								  {
									  oNewStyle.border = new Border();
									  oNewStyle.border.r = oRightBorder.clone();
								  }
								  col.setStyle(oNewStyle);
							  }
						  },
						  function(cell, nRow, nCol, nRowStart, nColStart){
							  //важно установить именно здесь, чтобы ячейка не удалилась после применения стилей.
							  if(null == oTargetStyle)
								  cell.setStyle(null);
							  else
							  {
								  var oNewStyle = oTargetStyle.clone();
								  if(oBBox.r1 == nRow && oBBox.c1 == nCol)
								  {
									  if(null != oLeftBorder || null != oTopBorder || (oBBox.r1 == oBBox.r2 && null != oBottomBorder) || (oBBox.c1 == oBBox.c2 && null != oRightBorder))
									  {
										  oNewStyle.border = new Border();
										  if(null != oLeftBorder)
											  oNewStyle.border.l = oLeftBorder.clone();
										  if(null != oTopBorder)
											  oNewStyle.border.t = oTopBorder.clone();
										  if(oBBox.r1 == oBBox.r2 && null != oBottomBorder)
											  oNewStyle.border.b = oBottomBorder.clone();
										  if(oBBox.c1 == oBBox.c2 && null != oRightBorder)
											  oNewStyle.border.r = oRightBorder.clone();
									  }
								  }
								  else if(oBBox.r1 == nRow && oBBox.c2 == nCol)
								  {
									  if(null != oRightBorder || null != oTopBorder || (oBBox.r1 == oBBox.r2 && null != oBottomBorder))
									  {
										  oNewStyle.border = new Border();
										  if(null != oRightBorder)
											  oNewStyle.border.r = oRightBorder.clone();
										  if(null != oTopBorder)
											  oNewStyle.border.t = oTopBorder.clone();
										  if(oBBox.r1 == oBBox.r2 && null != oBottomBorder)
											  oNewStyle.border.b = oBottomBorder.clone();
									  }
								  }
								  else if(oBBox.r2 == nRow && oBBox.c1 == nCol)
								  {
									  if(null != oLeftBorder || null != oBottomBorder || (oBBox.c1 == oBBox.c2 && null != oRightBorder))
									  {
										  oNewStyle.border = new Border();
										  if(null != oLeftBorder)
											  oNewStyle.border.l = oLeftBorder.clone();
										  if(null != oBottomBorder)
											  oNewStyle.border.b = oBottomBorder.clone();
										  if(oBBox.c1 == oBBox.c2 && null != oRightBorder)
											  oNewStyle.border.r = oRightBorder.clone();
									  }
								  }
								  else if(oBBox.r2 == nRow && oBBox.c2 == nCol)
								  {
									  if(null != oRightBorder || null != oBottomBorder)
									  {
										  oNewStyle.border = new Border();
										  if(null != oRightBorder)
											  oNewStyle.border.r = oRightBorder.clone();
										  if(null != oBottomBorder)
											  oNewStyle.border.b = oBottomBorder.clone();
									  }
								  }
								  else if(oBBox.r1 == nRow)
								  {
									  if(null != oTopBorder || (oBBox.r1 == oBBox.r2 && null != oBottomBorder))
									  {
										  oNewStyle.border = new Border();
										  if(null != oTopBorder)
											  oNewStyle.border.t = oTopBorder.clone();
										  if(oBBox.r1 == oBBox.r2 && null != oBottomBorder)
											  oNewStyle.border.b = oBottomBorder.clone();
									  }
								  }
								  else if(oBBox.r2 == nRow)
								  {
									  if(null != oBottomBorder)
									  {
										  oNewStyle.border = new Border();
										  oNewStyle.border.b = oBottomBorder.clone();
									  }
								  }
								  else if(oBBox.c1 == nCol)
								  {
									  if(null != oLeftBorder || (oBBox.c1 == oBBox.c2 && null != oRightBorder))
									  {
										  oNewStyle.border = new Border();
										  if(null != oLeftBorder)
											  oNewStyle.border.l = oLeftBorder.clone();
										  if(oBBox.c1 == oBBox.c2 && null != oRightBorder)
											  oNewStyle.border.r = oRightBorder.clone();
									  }
								  }
								  else if(oBBox.c2 == nCol)
								  {
									  if(null != oRightBorder)
									  {
										  oNewStyle.border = new Border();
										  oNewStyle.border.r = oRightBorder.clone();
									  }
								  }
								  cell.setStyle(oNewStyle);
							  }
						  });
		if(type == Asc.c_oAscMergeOptions.MergeCenter)
			this.setAlignHorizontal(AscCommon.align_Center);
		if(false == this.worksheet.workbook.bUndoChanges && false == this.worksheet.workbook.bRedoChanges)
			this.worksheet.mergeManager.add(this.bbox, 1);
		History.EndTransaction();
	};
	Range.prototype.unmerge=function(bOnlyInRange){
		History.Create_NewPoint();
		History.StartTransaction();
		if(false == this.worksheet.workbook.bUndoChanges && false == this.worksheet.workbook.bRedoChanges)
			this.worksheet.mergeManager.remove(this.bbox);
		History.EndTransaction();
	};
	Range.prototype._getHyperlinks=function(){
		var nRangeType = this._getRangeType();
		var result = [];
		var oThis = this;
		if(c_oRangeType.Range == nRangeType)
		{
			var oTempRows = {};
			var fAddToTempRows = function(oTempRows, bbox, data){
				if(null != bbox)
				{
					for(var i = bbox.r1; i <= bbox.r2; i++)
					{
						var row = oTempRows[i];
						if(null == row)
						{
							row = {};
							oTempRows[i] = row;
						}
						for(var j = bbox.c1; j <= bbox.c2; j++)
						{
							var cell = row[j];
							if(null == cell)
								row[j] = data;
						}
					}
				}
			};
			//todo возможно надо сделать оптимизацию для скрытых строк
			var aHyperlinks = this.worksheet.hyperlinkManager.get(this.bbox);
			for(var i = 0, length = aHyperlinks.all.length; i < length; i++)
			{
				var hyp = aHyperlinks.all[i];
				var hypBBox = hyp.bbox.intersectionSimple(this.bbox);
				fAddToTempRows(oTempRows, hypBBox, hyp.data);
				//расширяем гиперссылки на merge ячейках
				var aMerged = this.worksheet.mergeManager.get(hyp.bbox);
				for(var j = 0, length2 = aMerged.all.length; j < length2; j++)
				{
					var merge = aMerged.all[j];
					var mergeBBox = merge.bbox.intersectionSimple(this.bbox);
					fAddToTempRows(oTempRows, mergeBBox, hyp.data);
				}
			}
			//формируем результат
			for(var i in oTempRows)
			{
				var nRowIndex = i - 0;
				var row = oTempRows[i];
				for(var j in row)
				{
					var nColIndex = j - 0;
					var oCurHyp = row[j];
					result.push({hyperlink: oCurHyp, col: nColIndex, row: nRowIndex});
				}
			}
		}
		return result;
	};
	Range.prototype.getHyperlink=function(){
		var aHyperlinks = this._getHyperlinks();
		if(null != aHyperlinks && aHyperlinks.length > 0)
			return aHyperlinks[0].hyperlink;
		return null;
	};
	Range.prototype.getHyperlinks=function(){
		return this._getHyperlinks();
	};
	Range.prototype.setHyperlinkOpen=function(val){
		if(null != val && false == val.isValid())
			return;
		this.worksheet.hyperlinkManager.add(val.Ref.getBBox0(), val);
	};
	Range.prototype.setHyperlink=function(val, bWithoutStyle){
		if(null != val && false == val.isValid())
			return;
		//проверяем, может эта ссылка уже существует
		var i, length, hyp;
		var bExist = false;
		var aHyperlinks = this.worksheet.hyperlinkManager.get(this.bbox);
		for(i = 0, length = aHyperlinks.all.length; i < length; i++)
		{
			hyp = aHyperlinks.all[i];
			if(hyp.data.isEqual(val))
			{
				bExist = true;
				break;
			}
		}
		if(false == bExist)
		{
			History.Create_NewPoint();
			History.StartTransaction();
			if(false == this.worksheet.workbook.bUndoChanges && false == this.worksheet.workbook.bRedoChanges)
			{
				//удаляем ссылки с тем же адресом
				for(i = 0, length = aHyperlinks.all.length; i < length; i++)
				{
					hyp = aHyperlinks.all[i];
					if(hyp.bbox.isEqual(this.bbox))
						this.worksheet.hyperlinkManager.removeElement(hyp);
				}
			}
			//todo перейти на CellStyle
			if(true != bWithoutStyle)
			{
				var oHyperlinkFont = new AscCommonExcel.Font();
				oHyperlinkFont.setName(this.worksheet.workbook.getDefaultFont());
				oHyperlinkFont.setSize(this.worksheet.workbook.getDefaultSize());
				oHyperlinkFont.setUnderline(Asc.EUnderline.underlineSingle);
				oHyperlinkFont.setColor(AscCommonExcel.g_oColorManager.getThemeColor(AscCommonExcel.g_nColorHyperlink));
				this.setFont(oHyperlinkFont);
			}
			if(false == this.worksheet.workbook.bUndoChanges && false == this.worksheet.workbook.bRedoChanges)
				this.worksheet.hyperlinkManager.add(val.Ref.getBBox0(), val);
			History.EndTransaction();
		}
	};
	Range.prototype.removeHyperlink = function (elem, removeStyle) {
		var bbox = this.bbox;
		if(false == this.worksheet.workbook.bUndoChanges && false == this.worksheet.workbook.bRedoChanges)
		{
			History.Create_NewPoint();
			History.StartTransaction();
			var oChangeParam = { removeStyle: removeStyle };
			if(elem)
				this.worksheet.hyperlinkManager.removeElement(elem, oChangeParam);
			else
				this.worksheet.hyperlinkManager.remove(bbox, !bbox.isOneCell(), oChangeParam);
			History.EndTransaction();
		}
	};
	Range.prototype.deleteCellsShiftUp=function(preDeleteAction){
		return this._shiftUpDown(true, preDeleteAction);
	};
	Range.prototype.addCellsShiftBottom=function(displayNameFormatTable){
		return this._shiftUpDown(false, null, displayNameFormatTable);
	};
	Range.prototype.addCellsShiftRight=function(displayNameFormatTable){
		return this._shiftLeftRight(false, null,displayNameFormatTable);
	};
	Range.prototype.deleteCellsShiftLeft=function(preDeleteAction){
		return this._shiftLeftRight(true, preDeleteAction);
	};
	Range.prototype._canShiftLeftRight=function(bLeft){
		var aColsToDelete = [], aCellsToDelete = [];
		var oBBox = this.bbox;
		var nRangeType = this._getRangeType(oBBox);
		if(c_oRangeType.Range != nRangeType && c_oRangeType.Col != nRangeType)
			return null;

		var nWidth = oBBox.c2 - oBBox.c1 + 1;
		if(!bLeft && !this.worksheet.workbook.bUndoChanges && !this.worksheet.workbook.bRedoChanges){
			var rangeEdge = this.worksheet.getRange3(oBBox.r1, gc_nMaxCol0 - nWidth + 1, oBBox.r2, gc_nMaxCol0);
			var aMerged = this.worksheet.mergeManager.get(rangeEdge.bbox);
			if(aMerged.all.length > 0)
				return null;
			var aHyperlink = this.worksheet.hyperlinkManager.get(rangeEdge.bbox);
			if(aHyperlink.all.length > 0)
				return null;

			var bError = rangeEdge._setPropertyNoEmpty(null, function(col){
				if(null != col){
					if(null != col && null != col.xfs && null != col.xfs.fill && col.xfs.fill.notEmpty())
						return true;
					aColsToDelete.push(col);
				}
			}, function(cell){
				if(null != cell){
					if(null != cell.xfs && null != cell.xfs.fill && cell.xfs.fill.notEmpty())
						return true;
					if(!cell.isNullText())
						return true;
					aCellsToDelete.push(cell.nRow, cell.nCol);
				}
			});
			if(bError)
				return null;
		}
		return {aColsToDelete: aColsToDelete, aCellsToDelete: aCellsToDelete};
	};
	Range.prototype._shiftLeftRight=function(bLeft, preDeleteAction, displayNameFormatTable){
		var canShiftRes = this._canShiftLeftRight(bLeft);
		if(null === canShiftRes)
			return false;

		if (preDeleteAction)
			preDeleteAction();

		//удаляем крайние колонки и ячейки
		var i, length, colIndex;
		for(i = 0, length = canShiftRes.aColsToDelete.length; i < length; ++i){
			colIndex = canShiftRes.aColsToDelete[i].index;
			this.worksheet._removeCols(colIndex, colIndex);
		}
		for(i = 0; i < canShiftRes.aCellsToDelete.length; i+=2)
			this.worksheet._removeCell(canShiftRes.aCellsToDelete[i], canShiftRes.aCellsToDelete[i + 1]);

		var oBBox = this.bbox;
		var nWidth = oBBox.c2 - oBBox.c1 + 1;
		var nRangeType = this._getRangeType(oBBox);
		var mergeManager = this.worksheet.mergeManager;
		this.worksheet.workbook.dependencyFormulas.lockRecal();
		//todo вставить предупреждение, что будет unmerge
		History.Create_NewPoint();
		History.StartTransaction();
		var oShiftGet = null;
		if (false == this.worksheet.workbook.bUndoChanges && (false == this.worksheet.workbook.bRedoChanges || this.worksheet.workbook.bCollaborativeChanges))
		{
			History.LocalChange = true;
			oShiftGet = mergeManager.shiftGet(this.bbox, true);
			var aMerged = oShiftGet.elems;
			if(null != aMerged.outer && aMerged.outer.length > 0)
			{
				var bChanged = false;
				for(i = 0, length = aMerged.outer.length; i < length; i++)
				{
					var elem = aMerged.outer[i];
					if(!(elem.bbox.c1 < oShiftGet.bbox.c1 && oShiftGet.bbox.r1 <= elem.bbox.r1 && elem.bbox.r2 <= oShiftGet.bbox.r2))
					{
						mergeManager.removeElement(elem);
						bChanged = true;
					}
				}
				if(bChanged)
					oShiftGet = null;
			}
			History.LocalChange = false;
		}
		//сдвигаем ячейки
		if(bLeft)
		{
			if(c_oRangeType.Range == nRangeType)
				this.worksheet._shiftCellsLeft(oBBox);
			else
				this.worksheet._removeCols(oBBox.c1, oBBox.c2);
		}
		else
		{
			if(c_oRangeType.Range == nRangeType)
				this.worksheet._shiftCellsRight(oBBox, displayNameFormatTable);
			else
				this.worksheet._insertColsBefore(oBBox.c1, nWidth);
		}
		if (false == this.worksheet.workbook.bUndoChanges && (false == this.worksheet.workbook.bRedoChanges || this.worksheet.workbook.bCollaborativeChanges))
		{
			History.LocalChange = true;
			mergeManager.shift(this.bbox, !bLeft, true, oShiftGet);
			this.worksheet.hyperlinkManager.shift(this.bbox, !bLeft, true);
			History.LocalChange = false;
		}
		History.EndTransaction();
		this.worksheet.workbook.dependencyFormulas.unlockRecal();
		return true;
	};
	Range.prototype._canShiftUpDown=function(bUp){
		var aRowsToDelete = [], aCellsToDelete = [];
		var oBBox = this.bbox;
		var nRangeType = this._getRangeType(oBBox);
		if(c_oRangeType.Range != nRangeType && c_oRangeType.Row != nRangeType)
			return null;

		var nHeight = oBBox.r2 - oBBox.r1 + 1;
		if(!bUp && !this.worksheet.workbook.bUndoChanges && !this.worksheet.workbook.bRedoChanges){
			var rangeEdge = this.worksheet.getRange3(gc_nMaxRow0 - nHeight + 1, oBBox.c1, gc_nMaxRow0, oBBox.c2);
			var aMerged = this.worksheet.mergeManager.get(rangeEdge.bbox);
			if(aMerged.all.length > 0)
				return null;
			var aHyperlink = this.worksheet.hyperlinkManager.get(rangeEdge.bbox);
			if(aHyperlink.all.length > 0)
				return null;

			var bError = rangeEdge._setPropertyNoEmpty(function(row){
				if(null != row){
					if(null != row.xfs && null != row.xfs.fill && row.xfs.fill.notEmpty())
						return true;
					aRowsToDelete.push(row.index);
				}
			}, null,  function(cell){
				if(null != cell){
					if(null != cell.xfs && null != cell.xfs.fill && cell.xfs.fill.notEmpty())
						return true;
					if(!cell.isNullText())
						return true;
					aCellsToDelete.push(cell.nRow, cell.nCol);
				}
			});
			if(bError)
				return null;
		}
		return {aRowsToDelete: aRowsToDelete, aCellsToDelete: aCellsToDelete};
	};
	Range.prototype._shiftUpDown = function (bUp, preDeleteAction, displayNameFormatTable) {
		var canShiftRes = this._canShiftUpDown(bUp);
		if(null === canShiftRes)
			return false;

		if (preDeleteAction)
			preDeleteAction();

		//удаляем крайние колонки и ячейки
		var i, length, rowIndex;
		for(i = 0, length = canShiftRes.aRowsToDelete.length; i < length; ++i){
			rowIndex = canShiftRes.aRowsToDelete[i];
			this.worksheet._removeRows(rowIndex, rowIndex);
		}
		for(i = 0; i < canShiftRes.aCellsToDelete.length; i+=2)
			this.worksheet._removeCell(canShiftRes.aCellsToDelete[i], canShiftRes.aCellsToDelete[i + 1]);

		var oBBox = this.bbox;
		var nHeight = oBBox.r2 - oBBox.r1 + 1;
		var nRangeType = this._getRangeType(oBBox);
		var mergeManager = this.worksheet.mergeManager;
		this.worksheet.workbook.dependencyFormulas.lockRecal();
		//todo вставить предупреждение, что будет unmerge
		History.Create_NewPoint();
		History.StartTransaction();
		var oShiftGet = null;
		if (false == this.worksheet.workbook.bUndoChanges && (false == this.worksheet.workbook.bRedoChanges || this.worksheet.workbook.bCollaborativeChanges))
		{
			History.LocalChange = true;
			oShiftGet = mergeManager.shiftGet(this.bbox, false);
			var aMerged = oShiftGet.elems;
			if(null != aMerged.outer && aMerged.outer.length > 0)
			{
				var bChanged = false;
				for(i = 0, length = aMerged.outer.length; i < length; i++)
				{
					var elem = aMerged.outer[i];
					if(!(elem.bbox.r1 < oShiftGet.bbox.r1 && oShiftGet.bbox.c1 <= elem.bbox.c1 && elem.bbox.c2 <= oShiftGet.bbox.c2))
					{
						mergeManager.removeElement(elem);
						bChanged = true;
					}
				}
				if(bChanged)
					oShiftGet = null;
			}
			History.LocalChange = false;
		}
		//сдвигаем ячейки
		if(bUp)
		{
			if(c_oRangeType.Range == nRangeType)
				this.worksheet._shiftCellsUp(oBBox);
			else
				this.worksheet._removeRows(oBBox.r1, oBBox.r2);
		}
		else
		{
			if(c_oRangeType.Range == nRangeType)
				this.worksheet._shiftCellsBottom(oBBox, displayNameFormatTable);
			else
				this.worksheet._insertRowsBefore(oBBox.r1, nHeight);
		}
		if (false == this.worksheet.workbook.bUndoChanges && (false == this.worksheet.workbook.bRedoChanges || this.worksheet.workbook.bCollaborativeChanges))
		{
			History.LocalChange = true;
			mergeManager.shift(this.bbox, !bUp, false, oShiftGet);
			this.worksheet.hyperlinkManager.shift(this.bbox, !bUp, false);
			History.LocalChange = false;
		}
		History.EndTransaction();
		this.worksheet.workbook.dependencyFormulas.unlockRecal();
		return true;
	};
	Range.prototype.setOffset=function(offset){
		this.bbox.setOffset(offset);
	};
	Range.prototype.setOffsetFirst=function(offset){
		this.bbox.setOffsetFirst(offset);
	};
	Range.prototype.setOffsetLast=function(offset){
		this.bbox.setOffsetLast(offset);
	};
	Range.prototype.setOffsetWithAbs = function() {
		this.bbox.setOffsetWithAbs.apply(this.bbox, arguments);
	};
	Range.prototype.intersect=function(range){
		var oBBox1 = this.bbox;
		var oBBox2 = range.bbox;
		var r1 = Math.max(oBBox1.r1, oBBox2.r1);
		var c1 = Math.max(oBBox1.c1, oBBox2.c1);
		var r2 = Math.min(oBBox1.r2, oBBox2.r2);
		var c2 = Math.min(oBBox1.c2, oBBox2.c2);
		if(r1 <= r2 && c1 <= c2)
			return this.worksheet.getRange3(r1, c1, r2, c2);
		return null;
	};
	Range.prototype.cleanFormat=function(){
		History.Create_NewPoint();
		History.StartTransaction();
		this.unmerge();
		this._setPropertyNoEmpty(function(row){
			row.setStyle(null);
			// if(row.isEmpty())
			// row.Remove();
		},function(col){
			col.setStyle(null);
			// if(col.isEmpty())
			// col.Remove();
		},function(cell, nRow0, nCol0, nRowStart, nColStart){
			cell.setStyle(null);
			// if(cell.isEmpty())
			// cell.Remove();
		});
		History.EndTransaction();
	};
	Range.prototype.cleanText=function(){
		History.Create_NewPoint();
		History.StartTransaction();
		this._setPropertyNoEmpty(null, null,
								 function(cell, nRow0, nCol0, nRowStart, nColStart){
									 cell.setValue("");
									 // if(cell.isEmpty())
									 // cell.Remove();
								 });
		History.EndTransaction();
	};
	Range.prototype.cleanAll=function(){
		History.Create_NewPoint();
		History.StartTransaction();
		this.unmerge();
		//удаляем только гиперссылки, которые полностью лежат в области
		var aHyperlinks = this.worksheet.hyperlinkManager.get(this.bbox);
		for(var i = 0, length = aHyperlinks.inner.length; i < length; ++i)
			this.removeHyperlink(aHyperlinks.inner[i]);
		var oThis = this;
		this._setPropertyNoEmpty(function(row){
			row.setStyle(null);
			// if(row.isEmpty())
			// row.Remove();
		},function(col){
			col.setStyle(null);
			// if(col.isEmpty())
			// col.Remove();
		},function(cell, nRow0, nCol0, nRowStart, nColStart){
			oThis.worksheet._removeCell(nRow0, nCol0, cell);
		});

		this.worksheet.workbook.dependencyFormulas.calcTree();
		History.EndTransaction();
	};
	Range.prototype.cleanHyperlinks=function(){
		History.Create_NewPoint();
		History.StartTransaction();
		//удаляем только гиперссылки, которые полностью лежат в области
		var aHyperlinks = this.worksheet.hyperlinkManager.get(this.bbox);
		for(var i = 0, length = aHyperlinks.inner.length; i < length; ++i)
			this.removeHyperlink(aHyperlinks.inner[i]);
		History.EndTransaction();
	};
	Range.prototype.sort = function (nOption, nStartRowCol, sortColor, opt_guessHeader, opt_by_row, opt_custom_sort) {
		var bbox = this.bbox;
		if (opt_guessHeader) {
			//если тип ячеек первого и второго row попарно совпадает, то считаем первую строку заголовком
			//todo рассмотреть замерженые ячейки. стили тоже влияют, но непонятно как сравнивать border
			var bIgnoreFirstRow = ignoreFirstRowSort(this.worksheet, bbox);

			if (bIgnoreFirstRow) {
				bbox = bbox.clone();
				bbox.r1++;
			}
		}

		//todo горизонтальная сортировка
		var aMerged = this.worksheet.mergeManager.get(bbox);
		if (aMerged.outer.length > 0 || (aMerged.inner.length > 0 && null == _isSameSizeMerged(bbox, aMerged.inner, true))) {
			return null;
		}

		var nMergedWidth = 1;
		var nMergedHeight = 1;
		if (aMerged.inner.length > 0) {
			var merged = aMerged.inner[0];
			if (opt_by_row) {
				nMergedWidth = merged.bbox.c2 - merged.bbox.c1 + 1;
				//меняем nStartCol, потому что приходит колонка той ячейки, на которой начали выделение
				nStartRowCol = merged.bbox.r1;
			} else {
				nMergedHeight = merged.bbox.r2 - merged.bbox.r1 + 1;
				//меняем nStartCol, потому что приходит колонка той ячейки, на которой начали выделение
				nStartRowCol = merged.bbox.c1;
			}

		}

		this.worksheet.workbook.dependencyFormulas.lockRecal();

		var oRes = null;
		var oThis = this;
		var bAscent = false;
		if (nOption == Asc.c_oAscSortOptions.Ascending) {
			bAscent = true;
		}

		//get sort elems
		//_getSortElems - for split big function
		var elemObj = this._getSortElems(bbox, nStartRowCol, nOption, sortColor, opt_by_row, opt_custom_sort);
		var aSortElems = elemObj.aSortElems;
		var nColFirst0 = elemObj.nColFirst0;
		var nRowFirst0 = elemObj.nRowFirst0;
		var nLastRow0 = elemObj.nLastRow0;
		var nLastCol0 = elemObj.nLastCol0;


		//проверяем что это не пустая операция
		var aSortData = [];
		var nHiddenCount = 0;
		var oFromArray = {};

		var nNewIndex, oNewElem, i, length;
		var nColMax = 0, nRowMax = 0;
		var nColMin = gc_nMaxCol0, nRowMin = gc_nMaxRow0;
		var nToMax = 0;
		for (i = 0, length = aSortElems.length; i < length; ++i) {
			var item = aSortElems[i];
			if (opt_by_row) {
				nNewIndex = i * nMergedWidth + nColFirst0 + nHiddenCount;
				while (false != oThis.worksheet.getColHidden(nNewIndex)) {
					nHiddenCount++;
					nNewIndex = i * nMergedWidth + nColFirst0 + nHiddenCount;
				}
				oNewElem = new UndoRedoData_FromToRowCol(false, item.col, nNewIndex);
				oFromArray[item.col] = 1;
				if (nColMax < item.col) {
					nColMax = item.col;
				}
				if (nColMax < nNewIndex) {
					nColMax = nNewIndex;
				}
				if (nColMin > item.col) {
					nColMin = item.col;
				}
				if (nColMin > nNewIndex) {
					nColMin = nNewIndex;
				}
			} else {
				nNewIndex = i * nMergedHeight + nRowFirst0 + nHiddenCount;
				while (false != oThis.worksheet.getRowHidden(nNewIndex)) {
					nHiddenCount++;
					nNewIndex = i * nMergedHeight + nRowFirst0 + nHiddenCount;
				}
				oNewElem = new UndoRedoData_FromToRowCol(true, item.row, nNewIndex);
				oFromArray[item.row] = 1;
				if (nRowMax < item.row) {
					nRowMax = item.row;
				}
				if (nRowMax < nNewIndex) {
					nRowMax = nNewIndex;
				}
				if (nRowMin > item.row) {
					nRowMin = item.row;
				}
				if (nRowMin > nNewIndex) {
					nRowMin = nNewIndex;
				}
			}
			if (nToMax < nNewIndex) {
				nToMax = nNewIndex;
			}
			if (oNewElem.from != oNewElem.to) {
				aSortData.push(oNewElem);
			}
		}


		if (aSortData.length > 0) {
			//добавляем индексы перехода пустых ячеек(нужно для сортировки комментариев)
			var nRowColMin = opt_by_row ? nColMin : nRowMin;
			var nRowColMax = opt_by_row ? nColMax : nRowMax;
			var hiddenFunc = opt_by_row ? oThis.worksheet.getColHidden : oThis.worksheet.getRowHidden;
			for (i = nRowColMin; i <= nRowColMax; ++i) {
				if (null == oFromArray[i] && false == hiddenFunc.apply(oThis.worksheet, [i])) {
					var nFrom = i;
					var nTo = ++nToMax;
					while (false != hiddenFunc.apply(oThis.worksheet, [nTo]))
						nTo = ++nToMax;
					if (nFrom != nTo) {
						oNewElem = new UndoRedoData_FromToRowCol(false, nFrom, nTo);
						aSortData.push(oNewElem);
					}
				}
			}

			History.Create_NewPoint();
			var oSelection = History.GetSelection();
			if (null != oSelection) {
				oSelection = oSelection.clone();
				oSelection.assign(nColFirst0, nRowFirst0, nLastCol0, nLastRow0);
				History.SetSelection(oSelection);
				History.SetSelectionRedo(oSelection);
			}
			var oUndoRedoBBox = new UndoRedoData_BBox({r1: nRowFirst0, c1: nColFirst0, r2: nLastRow0, c2: nLastCol0});
			oRes = new AscCommonExcel.UndoRedoData_SortData(oUndoRedoBBox, aSortData, opt_by_row);
			this._sortByArray(oUndoRedoBBox, aSortData, null, opt_by_row);

			var range = opt_by_row ? new Asc.Range(nColFirst0, 0, nLastCol0, gc_nMaxRow0) : new Asc.Range(0, nRowFirst0, gc_nMaxCol0, nLastRow0);
			History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_Sort, this.worksheet.getId(), range, oRes)
		}
		this.worksheet.workbook.dependencyFormulas.unlockRecal();
		return oRes;
	};
	Range.prototype._getSortElems = function (bbox, nStartRowCol, nOption, sortColor, opt_by_row, opt_custom_sort) {
		var oThis = this;

		var bAscent = false;
		if (nOption == Asc.c_oAscSortOptions.Ascending) {
			bAscent = true;
		}

		var colorFill = nOption === Asc.c_oAscSortOptions.ByColorFill;
		var colorText = nOption === Asc.c_oAscSortOptions.ByColorFont;
		var isSortColor = colorFill || colorText;

		var nRowFirst0 = bbox.r1;
		var nRowLast0 = bbox.r2;
		var nColFirst0 = bbox.c1;
		var nColLast0 = bbox.c2;

		var bWholeCol = false;
		var bWholeRow = false;
		if (0 == nRowFirst0 && gc_nMaxRow0 == nRowLast0) {
			bWholeCol = true;
		}
		if (0 == nColFirst0 && gc_nMaxCol0 == nColLast0) {
			bWholeRow = true;
		}

		var sortConditions, caseSensitive;
		if(opt_custom_sort && opt_custom_sort.SortConditions) {
			sortConditions = opt_custom_sort.SortConditions;
			nStartRowCol = opt_by_row ? sortConditions[0].Ref.r1 : sortConditions[0].Ref.c1;
			bAscent = !sortConditions[0].ConditionDescending;
		}
		if(opt_custom_sort) {
			//caseSensitive = opt_custom_sort.CaseSensitive;
			//пока игнорируем данный флаг, поскольку сравнения строк в excel при сортировке работает иначе(например - "Green" > "green")
			//возможно, стоит воспользоваться функцией localeCompare - но для этого необходимо проверить грамотное ли сравнение будет
		}

		var nLastRow0, nLastCol0;
		if (opt_by_row) {
			var oRangeRow = this.worksheet.getRange(new CellAddress(nStartRowCol, nColFirst0, 0), new CellAddress(nStartRowCol, nColLast0, 0));
			nLastRow0 = nRowLast0;
			nLastCol0 = 0;
			if (true == bWholeCol) {
				nLastRow0 = 0;
				this._foreachColNoEmpty(null, function (cell) {
					var nCurRow0 = cell.nRow;
					if (nCurRow0 > nLastRow0) {
						nLastRow0 = nCurRow0;
					}
				});
			}
		} else {
			var oRangeCol = this.worksheet.getRange(new CellAddress(nRowFirst0, nStartRowCol, 0), new CellAddress(nRowLast0, nStartRowCol, 0));
			nLastRow0 = 0;
			nLastCol0 = nColLast0;
			if (true == bWholeRow) {
				nLastCol0 = 0;
				this._foreachRowNoEmpty(null, function (cell) {
					var nCurCol0 = cell.nCol;
					if (nCurCol0 > nLastCol0) {
						nLastCol0 = nCurCol0;
					}
				});
			}
		}

		var aMerged = this.worksheet.mergeManager.get(this.bbox);
		var checkMerged = function(_cell) {
			var res = null;

			if(aMerged && aMerged.inner && aMerged.inner.length > 0) {
				for(var i = 0; i < aMerged.inner.length; i++) {
					if(aMerged.inner[i].bbox.contains(_cell.nCol, _cell.nRow)) {
						if(aMerged.inner[i].bbox.r1 === _cell.nRow && aMerged.inner[i].bbox.c1 === _cell.nCol) {
							return true;
						} else {
							return false;
						}
					}
				}
			}

			return res;
		};

		//собираем массив обьектов для сортировки
		var aSortElems = [];
		var putElem = false;
		var fAddSortElems = function (oCell, nRow0, nCol0) {
			//не сортируем сткрытие строки
			if ((opt_by_row && !oThis.worksheet.getColHidden(nCol0)) || (!opt_by_row && !oThis.worksheet.getRowHidden(nRow0))) {
				if (!opt_by_row && nLastRow0 < nRow0) {
					nLastRow0 = nRow0;
				}
				if (opt_by_row && nLastCol0 < nCol0) {
					nLastCol0 = nCol0;
				}
				var val = oCell.getValueWithoutFormat();

				if(opt_custom_sort && false === checkMerged(oCell)) {
					return;
				}

				//for sort color
				var colorFillCell, colorsTextCell = null;
				if (colorFill || opt_custom_sort) {
					var styleCell = oCell.getCompiledStyleCustom(false, true, true);
					colorFillCell = styleCell !== null && styleCell.fill ? styleCell.fill.bg() : null;
				}
				if (colorText || opt_custom_sort) {
					var value2 = oCell.getValue2();
					for (var n = 0; n < value2.length; n++) {
						if (null === colorsTextCell) {
							colorsTextCell = [];
						}

						colorsTextCell.push(value2[n].format.getColor());
					}
				}

				var nNumber = null;
				var sText = null;
				var res;
				if ("" != val) {
					var nVal = val - 0;
					if (nVal == val) {
						nNumber = nVal;
					} else {
						sText = val;
					}
					if (opt_by_row) {
						res = {col: nCol0, num: nNumber, text: sText, colorFill: colorFillCell, colorsText: colorsTextCell};
					} else {
						res = {row: nRow0, num: nNumber, text: sText, colorFill: colorFillCell, colorsText: colorsTextCell};
					}
				} else if (isSortColor || (opt_custom_sort && (colorFillCell || colorsTextCell))) {
					if (opt_by_row) {
						res = {col: nCol0, num: nNumber, text: sText, colorFill: colorFillCell, colorsText: colorsTextCell};
					} else {
						res = {row: nRow0, num: nNumber, text: sText, colorFill: colorFillCell, colorsText: colorsTextCell};
					}
				}

				if(!putElem) {
					return res;
				} else if(res) {
					aSortElems.push(res);
				}
			}
		};

		putElem = true;
		if (opt_by_row) {
			if (nRowFirst0 == nStartRowCol) {
				while (0 == aSortElems.length && nStartRowCol <= nLastRow0) {
					if (false == bWholeRow) {
						oRangeRow._foreachNoEmptyByCol(fAddSortElems);
					} else {
						oRangeRow._foreachRowNoEmpty(null, fAddSortElems);
					}
					if (0 == aSortElems.length) {
						nStartRowCol++;
						oRangeRow = this.worksheet.getRange(new CellAddress(nStartRowCol, nColFirst0, 0), new CellAddress(nStartRowCol, nColLast0, 0));
					}
				}
			} else {
				if (false == bWholeRow) {
					oRangeRow._foreachNoEmptyByCol(fAddSortElems);
				} else {
					oRangeRow._foreachRowNoEmpty(null, fAddSortElems);
				}
			}
		} else {
			if (nColFirst0 == nStartRowCol) {
				while (0 == aSortElems.length && nStartRowCol <= nLastCol0) {
					if (false == bWholeCol) {
						oRangeCol._foreachNoEmpty(fAddSortElems);
					} else {
						oRangeCol._foreachColNoEmpty(null, fAddSortElems);
					}
					if (0 == aSortElems.length) {
						nStartRowCol++;
						oRangeCol = this.worksheet.getRange(new CellAddress(nRowFirst0, nStartRowCol, 0), new CellAddress(nRowLast0, nStartRowCol, 0));
					}
				}
			} else {
				if (false == bWholeCol) {
					oRangeCol._foreachNoEmpty(fAddSortElems);
				} else {
					oRangeCol._foreachColNoEmpty(null, fAddSortElems);
				}
			}
		}

		function strcmp(str1, str2) {
			return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
		}


		//color sort
		var colorFillCmp = function (color1, color2, _customCellColor) {
			var res = false;
			//TODO возможно так сравнивать не правильно, позже пересмотреть
			if (colorFill || _customCellColor === true) {
				res = (color1 !== null && color2 !== null && color1.rgb === color2.rgb) || (color1 === color2);
			} else if ((colorText || _customCellColor === false) && color1 && color1.length) {
				for (var n = 0; n < color1.length; n++) {
					if (color1[n] && color2 !== null && color1[n].rgb === color2.rgb) {
						res = true;
						break;
					}
				}
			}

			return res;
		};

		var getSortElem = function(row, col) {
			var oCell;
			oThis.worksheet._getCellNoEmpty(row, col, function(cell) {
				oCell = cell;
			});
			return oCell ? fAddSortElems(oCell, row, col) : null;
		};
		
		putElem = false;
		if (isSortColor) {
			var newArrayNeedColor = [];
			var newArrayAnotherColor = [];

			for (var i = 0; i < aSortElems.length; i++) {
				var color = colorFill ? aSortElems[i].colorFill : aSortElems[i].colorsText;
				if (colorFillCmp(color, sortColor)) {
					newArrayNeedColor.push(aSortElems[i]);
				} else {
					newArrayAnotherColor.push(aSortElems[i]);
				}
			}

			aSortElems = newArrayNeedColor.concat(newArrayAnotherColor);
		} else {
			aSortElems.sort(function (a, b) {
				var res = 0;
				var nullVal = false;
				var compare = function(_a, _b, _sortCondition) {
					//если есть opt_custom_sort(->sortConditions) - тогда может быть несколько условий сортировки
					//в данном случае идём по отдельной ветке и по-другому обрабатываем сортировку по цвету
					//TODO стоит рассмотреть вариант одной обработки для разных вариантов сортировки
					if(_sortCondition && (_sortCondition.ConditionSortBy === Asc.ESortBy.sortbyCellColor || _sortCondition.ConditionSortBy === Asc.ESortBy.sortbyFontColor)) {
						if(!_a || !_b) {
							return res;
						}
						var _isCellColor = _sortCondition.ConditionSortBy === Asc.ESortBy.sortbyCellColor;
						var _color1 = _isCellColor ? _a.colorFill : _a.colorsText;
						var _color2 = _isCellColor ? _b.colorFill : _b.colorsText;
						var _sortColor = _isCellColor ? _sortCondition.dxf.fill.bg() : _sortCondition.dxf.font.getColor();
						var cmp1 = colorFillCmp(_color1, _sortColor, _isCellColor);
						var cmp2 = colorFillCmp(_color2, _sortColor, _isCellColor);

						if(cmp1 === cmp2) {
							res = 0;
						} else if(cmp1 && !cmp2) {
							res = -1;
						} else if(!cmp1 && cmp2) {
							res = 1;
						}
					} else {
						if (_a && null != _a.text) {
							if (_b && null != _b.text) {
								var val1 = caseSensitive ? _a.text : _a.text.toUpperCase();
								var val2 = caseSensitive ? _b.text : _b.text.toUpperCase();
								res = strcmp(val1, val2);
							} else if(_b && null != _b.num) {
								res = 1;
							} else {
								res = -1;
								nullVal = true;
							}
						} else if (_a && null != _a.num) {
							if (_b && null != _b.num) {
								res = _a.num - _b.num;
							} else if(_b && null != _b.text) {
								res = -1;
							} else {
								res = -1;
								nullVal = true;
							}
						} else if(_b && (null != _b.num || null != _b.text)){
							res = 1;
							nullVal = true;
						}
					}
				};

				compare(a, b, sortConditions ? sortConditions[0] : null);
				if (0 == res) {
					if(sortConditions) {
						for(var i = 1; i < sortConditions.length; i++) {
							var row = sortConditions[i].Ref.r1;
							var col = sortConditions[i].Ref.c1;
							var row1 = opt_by_row ? row : a.row;
							var col1 = !opt_by_row ? col : a.col;
							var row2 = opt_by_row ? row : b.row;
							var col2 = !opt_by_row ? col : b.col;
							var tempA = getSortElem(row1, col1);
							var tempB = getSortElem(row2, col2);
							compare(tempA, tempB, sortConditions[i]);
							var tempAscent = !sortConditions[i].ConditionDescending;
							if(res != 0) {
								if(!tempAscent) {
									res = -res;
								}
								break;
							} else if(i === sortConditions.length - 1 && tempA && tempB) {
								res = opt_by_row ? tempA.col - tempB.col : tempA.row - tempB.row;
							}
						}
					} else {
						res = opt_by_row ? a.col - b.col : a.row - b.row;
					}
				} else if (!bAscent && !nullVal) {
					res = -res;
				}
				return res;
			});
		}

		return {aSortElems: aSortElems, nRowFirst0: nRowFirst0, nColFirst0: nColFirst0, nLastRow0: nLastRow0, nLastCol0: nLastCol0};
	};
	Range.prototype._sortByArray = function (oBBox, aSortData, bUndo, opt_by_row) {
		var t = this;
		var height = oBBox.r2 - oBBox.r1 + 1;
		var oSortedIndexes = {};
		var nFrom, nTo, length, i;
		for (i = 0, length = aSortData.length; i < length; ++i) {
			var item = aSortData[i];
			nFrom = item.from;
			nTo = item.to;
			if (true == this.worksheet.workbook.bUndoChanges) {
				nFrom = item.to;
				nTo = item.from;
			}
			oSortedIndexes[nFrom] = nTo;
		}
		//сортируются только одинарные гиперссылки, все неодинарные оставляем
		var aSortedHyperlinks = [], hyp;
		if (false == this.worksheet.workbook.bUndoChanges && (false == this.worksheet.workbook.bRedoChanges || this.worksheet.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			var aHyperlinks = this.worksheet.hyperlinkManager.get(this.bbox);
			for (i = 0, length = aHyperlinks.inner.length; i < length; i++) {
				var elem = aHyperlinks.inner[i];
				hyp = elem.data;
				if (hyp.Ref.isOneCell()) {
					nFrom = opt_by_row ? elem.bbox.c1 : elem.bbox.r1;
					nTo = oSortedIndexes[nFrom];
					if (null != nTo) {
						//удаляем ссылки, а не перемещаем, чтобы не было конфликтов(например в случае если все ячейки имеют ссылки
						// и их надо передвинуть)
						this.worksheet.hyperlinkManager.removeElement(elem);
						var oNewHyp = hyp.clone();
						if(opt_by_row) {
							oNewHyp.Ref.setOffset(new AscCommon.CellBase(0, nTo - nFrom));
						} else {
							oNewHyp.Ref.setOffset(new AscCommon.CellBase(nTo - nFrom, 0));
						}
						aSortedHyperlinks.push(oNewHyp);
					}
				}
			}
			History.LocalChange = false;
		}

		var tempRange = this.worksheet.getRange3(oBBox.r1, oBBox.c1, oBBox.r2, oBBox.c2);
		var func = opt_by_row ? tempRange._foreachNoEmptyByCol : tempRange._foreachNoEmpty;
		func.apply(tempRange, [(function (cell) {
			var ws = t.worksheet;
			var formula = cell.getFormulaParsed();
			if (formula) {
				var cellWithFormula = formula.getParent();
				var nFrom = opt_by_row ? cell.nCol : cell.nRow;
				var nTo = oSortedIndexes[nFrom];
				if (null != nTo) {
					if (opt_by_row) {
						cell.changeOffset(new AscCommon.CellBase(0, nTo - nFrom), true, true);
					} else {
						cell.changeOffset(new AscCommon.CellBase(nTo - nFrom, 0), true, true);
					}
					formula = cell.getFormulaParsed();
					cellWithFormula = formula.getParent();
					if (opt_by_row) {
						cellWithFormula.nCol = nTo;
					} else {
						cellWithFormula.nRow = nTo;
					}
				}
				ws.workbook.dependencyFormulas.addToChangedCell(cellWithFormula);
			}
		})]);


		var tempSheetMemory, nIndexFrom, nIndexTo, j;
		if (opt_by_row) {
			tempSheetMemory = [];
			for (j in oSortedIndexes) {
				nIndexFrom = j - 0;
				nIndexTo = oSortedIndexes[j];
				var sheetMemoryFrom = this.worksheet.getColData(nIndexFrom);
				var sheetMemoryTo = this.worksheet.getColData(nIndexTo);

				tempSheetMemory[nIndexTo] = new SheetMemory(g_nCellStructSize, height);
				tempSheetMemory[nIndexTo].copyRange(sheetMemoryTo, oBBox.r1, 0, height);

				if (tempSheetMemory[nIndexFrom]) {
					sheetMemoryTo.copyRange(tempSheetMemory[nIndexFrom], 0, oBBox.r1, height);
				} else {
					sheetMemoryTo.copyRange(sheetMemoryFrom, oBBox.r1, oBBox.r1, height);
				}
			}
		} else {
			tempSheetMemory = new SheetMemory(g_nCellStructSize, height);
			for (i = oBBox.c1; i <= oBBox.c2; ++i) {
				var sheetMemory = this.worksheet.getColDataNoEmpty(i);
				if (sheetMemory) {
					tempSheetMemory.copyRange(sheetMemory, oBBox.r1, 0, height);
					for (j in oSortedIndexes) {
						nIndexFrom = j - 0;
						nIndexTo = oSortedIndexes[j];
						tempSheetMemory.copyRange(sheetMemory, nIndexFrom, nIndexTo - oBBox.r1, 1);
					}
					sheetMemory.copyRange(tempSheetMemory, 0, oBBox.r1, height);
				}
			}
		}

		this.worksheet.workbook.dependencyFormulas.addToChangedRange(this.worksheet.getId(), new Asc.Range(oBBox.c1, oBBox.r1, oBBox.c2, oBBox.r2));
		this.worksheet.workbook.dependencyFormulas.calcTree();

		if (false == this.worksheet.workbook.bUndoChanges && (false == this.worksheet.workbook.bRedoChanges || this.worksheet.workbook.bCollaborativeChanges)) {
			History.LocalChange = true;
			//восстанавливаем удаленые гиперссылки
			if (aSortedHyperlinks.length > 0) {
				for (i = 0, length = aSortedHyperlinks.length; i < length; i++) {
					hyp = aSortedHyperlinks[i];
					this.worksheet.hyperlinkManager.add(hyp.Ref.getBBox0(), hyp);
				}
			}
			History.LocalChange = false;
		}
	};

	function _isSameSizeMerged(bbox, aMerged, checkProportion) {
		var oRes = null;
		var nWidth = null;
		var nHeight = null;
		for (var i = 0, length = aMerged.length; i < length; i++) {
			var mergedBBox = aMerged[i].bbox;
			var nCurWidth = mergedBBox.c2 - mergedBBox.c1 + 1;
			var nCurHeight = mergedBBox.r2 - mergedBBox.r1 + 1;
			if (null == nWidth || null == nHeight) {
				nWidth = nCurWidth;
				nHeight = nCurHeight;
			} else if (nCurWidth != nWidth || nCurHeight != nHeight) {
				nWidth = null;
				nHeight = null;
				break;
			}
		}
		if (null != nWidth && null != nHeight) {
			var getRowColArr = function (byCol) {
				var _aRowColTest = byCol ? new Array(nBBoxWidth) : new Array(nBBoxHeight);
				for (var i = 0, length = aMerged.length; i < length; i++) {
					var merged = aMerged[i];
					var j;
					if (byCol) {
						for (j = merged.bbox.c1; j <= merged.bbox.c2; j++) {
							_aRowColTest[j - bbox.c1] = 1;
						}
					} else {
						for (j = merged.bbox.r1; j <= merged.bbox.r2; j++) {
							_aRowColTest[j - bbox.r1] = 1;
						}
					}

				}
				return _aRowColTest;
			};
			var checkArr = function (_aRowColTest) {
				var _res = null;
				var bExistNull = false;
				for (var i = 0, length = _aRowColTest.length; i < length; i++) {
					if (null == _aRowColTest[i]) {
						bExistNull = true;
						break;
					}
				}
				if (!bExistNull) {
					_res = true;
				}

				return _res;
			};

			//проверяем что merge ячеки полностью заполняют область
			var nBBoxWidth = bbox.c2 - bbox.c1 + 1;
			var nBBoxHeight = bbox.r2 - bbox.r1 + 1;
			if (checkProportion && nBBoxWidth % nWidth === 0 && nBBoxHeight % nHeight === 0) {
				aRowColTest = getRowColArr();
				bRes = checkArr(aRowColTest);
				if (bRes) {
					aRowColTest = getRowColArr(true);
					bRes = checkArr(aRowColTest);
				}
				if (bRes) {
					oRes = {width: nWidth, height: nHeight};
				}
			} else if (nBBoxWidth == nWidth || nBBoxHeight == nHeight) {
				var bRes = false;
				var aRowColTest = null;
				if (nBBoxWidth == nWidth && nBBoxHeight == nHeight) {
					bRes = true;
				} else if (nBBoxWidth == nWidth) {
					aRowColTest = getRowColArr();
				} else if (nBBoxHeight == nHeight) {
					aRowColTest = getRowColArr(true);
				}
				if (null != aRowColTest) {
					bRes = checkArr(aRowColTest);
				}
				if (bRes) {
					oRes = {width: nWidth, height: nHeight};
				}
			}
		}
		return oRes;
	}
	function _canPromote(from, wsFrom, to, wsTo, bIsPromote, nWidth, nHeight, bVertical, nIndex) {
		var oRes = {oMergedFrom: null, oMergedTo: null, to: to};
		//если надо только удалить внутреннее содержимое не смотрим на замерженость
		if(!bIsPromote || !((true == bVertical && nIndex >= 0 && nIndex < nHeight) || (false == bVertical && nIndex >= 0 && nIndex < nWidth)))
		{
			if(null != to){
				var oMergedTo = wsTo.mergeManager.get(to);
				if(oMergedTo.outer.length > 0)
					oRes = null;
				else
				{
					var oMergedFrom = wsFrom.mergeManager.get(from);
					oRes.oMergedFrom = oMergedFrom;
					if(oMergedTo.inner.length > 0)
					{
						oRes.oMergedTo = oMergedTo;
						if (bIsPromote) {
							if (oMergedFrom.inner.length > 0) {
								//merge области должны иметь одинаковый размер
								var oSizeFrom = _isSameSizeMerged(from, oMergedFrom.inner);
								var oSizeTo = _isSameSizeMerged(to, oMergedTo.inner);
								if (!(null != oSizeFrom && null != oSizeTo && oSizeTo.width == oSizeFrom.width && oSizeTo.height == oSizeFrom.height))
									oRes = null;
							}
							else
								oRes = null;
						}
					}
				}
			}
		}
		return oRes;
	}
// Подготовка Copy Style
	function preparePromoteFromTo(from, to) {
		var bSuccess = true;
		if (to.isOneCell())
			to.setOffsetLast(new AscCommon.CellBase((from.r2 - from.r1) - (to.r2 - to.r1), (from.c2 - from.c1) - (to.c2 - to.c1)));

		if(!from.isIntersect(to)) {
			var bFromWholeCol = (0 == from.c1 && gc_nMaxCol0 == from.c2);
			var bFromWholeRow = (0 == from.r1 && gc_nMaxRow0 == from.r2);
			var bToWholeCol = (0 == to.c1 && gc_nMaxCol0 == to.c2);
			var bToWholeRow = (0 == to.r1 && gc_nMaxRow0 == to.r2);
			bSuccess = (bFromWholeCol === bToWholeCol && bFromWholeRow === bToWholeRow);
		} else
			bSuccess = false;
		return bSuccess;
	}
// Перед promoteFromTo обязательно должна быть вызывана функция preparePromoteFromTo
	function promoteFromTo(from, wsFrom, to, wsTo) {
		var bVertical = true;
		var nIndex = 1;
		//проверяем можно ли осуществить promote
		var oCanPromote = _canPromote(from, wsFrom, to, wsTo, false, 1, 1, bVertical, nIndex);
		if(null != oCanPromote)
		{
			History.Create_NewPoint();
			var oSelection = History.GetSelection();
			if(null != oSelection)
			{
				oSelection = oSelection.clone();
				oSelection.assign(from.c1, from.r1, from.c2, from.r2);
				History.SetSelection(oSelection);
			}
			var oSelectionRedo = History.GetSelectionRedo();
			if(null != oSelectionRedo)
			{
				oSelectionRedo = oSelectionRedo.clone();
				oSelectionRedo.assign(to.c1, to.r1, to.c2, to.r2);
				History.SetSelectionRedo(oSelectionRedo);
			}
			//удаляем merge ячейки в to(после _canPromote должны остаться только inner)
			wsTo.mergeManager.remove(to, true);
			_promoteFromTo(from, wsFrom, to, wsTo, false, oCanPromote, false, bVertical, nIndex);
		}
	}
	Range.prototype.canPromote=function(bCtrl, bVertical, nIndex){
		var oBBox = this.bbox;
		var nWidth = oBBox.c2 - oBBox.c1 + 1;
		var nHeight = oBBox.r2 - oBBox.r1 + 1;
		var bWholeCol = false;	var bWholeRow = false;
		if(0 == oBBox.r1 && gc_nMaxRow0 == oBBox.r2)
			bWholeCol = true;
		if(0 == oBBox.c1 && gc_nMaxCol0 == oBBox.c2)
			bWholeRow = true;
		if((bWholeCol && bWholeRow) || (true == bVertical && bWholeCol) || (false == bVertical && bWholeRow))
			return null;
		var oPromoteAscRange = null;
		if(0 == nIndex)
			oPromoteAscRange = new Asc.Range(oBBox.c1, oBBox.r1, oBBox.c2, oBBox.r2);
		else
		{
			if(bVertical)
			{
				if(nIndex > 0)
				{
					if(nIndex >= nHeight)
						oPromoteAscRange = new Asc.Range(oBBox.c1, oBBox.r2 + 1, oBBox.c2, oBBox.r1 + nIndex);
					else
						oPromoteAscRange = new Asc.Range(oBBox.c1, oBBox.r1 + nIndex, oBBox.c2, oBBox.r2);
				}
				else
					oPromoteAscRange = new Asc.Range(oBBox.c1, oBBox.r1 + nIndex, oBBox.c2, oBBox.r1 - 1);
			}
			else
			{
				if(nIndex > 0)
				{
					if(nIndex >= nWidth)
						oPromoteAscRange = new Asc.Range(oBBox.c2 + 1, oBBox.r1, oBBox.c1 + nIndex, oBBox.r2);
					else
						oPromoteAscRange = new Asc.Range(oBBox.c1 + nIndex, oBBox.r1, oBBox.c2, oBBox.r2);
				}
				else
					oPromoteAscRange = new Asc.Range(oBBox.c1 + nIndex, oBBox.r1, oBBox.c1 - 1, oBBox.r2);
			}
		}
		//проверяем можно ли осуществить promote
		return _canPromote(oBBox, this.worksheet, oPromoteAscRange, this.worksheet, true, nWidth, nHeight, bVertical, nIndex);
	};
	Range.prototype.promote=function(bCtrl, bVertical, nIndex, oCanPromote){
		//todo отдельный метод для promote в таблицах и merge в таблицах
		if (!oCanPromote) {
			oCanPromote = this.canPromote(bCtrl, bVertical, nIndex);
		}
		var oBBox = this.bbox;
		var nWidth = oBBox.c2 - oBBox.c1 + 1;
		var nHeight = oBBox.r2 - oBBox.r1 + 1;

		History.Create_NewPoint();
		var oSelection = History.GetSelection();
		if(null != oSelection)
		{
			oSelection = oSelection.clone();
			oSelection.assign(oBBox.c1, oBBox.r1, oBBox.c2, oBBox.r2);
			History.SetSelection(oSelection);
		}
		var oSelectionRedo = History.GetSelectionRedo();
		if(null != oSelectionRedo)
		{
			oSelectionRedo = oSelectionRedo.clone();
			if(0 == nIndex)
				oSelectionRedo.assign(oBBox.c1, oBBox.r1, oBBox.c2, oBBox.r2);
			else
			{
				if(bVertical)
				{
					if(nIndex > 0)
					{
						if(nIndex >= nHeight)
							oSelectionRedo.assign(oBBox.c1, oBBox.r1, oBBox.c2, oBBox.r1 + nIndex);
						else
							oSelectionRedo.assign(oBBox.c1, oBBox.r1, oBBox.c2, oBBox.r1 + nIndex - 1);
					}
					else
						oSelectionRedo.assign(oBBox.c1, oBBox.r1 + nIndex, oBBox.c2, oBBox.r2);
				}
				else
				{
					if(nIndex > 0)
					{
						if(nIndex >= nWidth)
							oSelectionRedo.assign(oBBox.c1, oBBox.r1, oBBox.c1 + nIndex, oBBox.r2);
						else
							oSelectionRedo.assign(oBBox.c1, oBBox.r1, oBBox.c1 + nIndex - 1, oBBox.r2);
					}
					else
						oSelectionRedo.assign(oBBox.c1 + nIndex, oBBox.r1, oBBox.c2, oBBox.r2);
				}
			}
			History.SetSelectionRedo(oSelectionRedo);
		}
		_promoteFromTo(oBBox, this.worksheet, oCanPromote.to, this.worksheet, true, oCanPromote, bCtrl, bVertical, nIndex);
	};
	function _promoteFromTo(from, wsFrom, to, wsTo, bIsPromote, oCanPromote, bCtrl, bVertical, nIndex) {
		var wb = wsFrom.workbook;

		wb.dependencyFormulas.lockRecal();
		History.StartTransaction();

		var oldExcludeHiddenRows = wsFrom.bExcludeHiddenRows;
		if(wsFrom.autoFilters.bIsExcludeHiddenRows(from, wsFrom.selectionRange.activeCell)){
			wsFrom.excludeHiddenRows(true);
		}

		var toRange = wsTo.getRange3(to.r1, to.c1, to.r2, to.c2);
		var fromRange = wsFrom.getRange3(from.r1, from.c1, from.r2, from.c2);
		var bChangeRowColProp = false;
		var nLastCol = from.c2;
		if (0 == from.c1 && gc_nMaxCol0 == from.c2)
		{
			var aRowProperties = [];
			nLastCol = 0;
			fromRange._foreachRowNoEmpty(function(row){
				if(!row.isEmptyProp())
					aRowProperties.push({index: row.index - from.r1, prop: row.getHeightProp(), style: row.getStyle()});
			}, function(cell){
				var nCurCol0 = cell.nCol;
				if(nCurCol0 > nLastCol)
					nLastCol = nCurCol0;
			});
			if(aRowProperties.length > 0)
			{
				bChangeRowColProp = true;
				var nCurCount = 0;
				var nCurIndex = 0;
				while (true) {
					for (var i = 0, length = aRowProperties.length; i < length; ++i) {
						var propElem = aRowProperties[i];
						nCurIndex = to.r1 + nCurCount * (from.r2 - from.r1 + 1) + propElem.index;
						if (nCurIndex > to.r2)
							break;
						else{
							wsTo._getRow(nCurIndex, function(row) {
								if (null != propElem.style)
									row.setStyle(propElem.style);
								if (null != propElem.prop) {
									var oNewProps = propElem.prop;
									var oOldProps = row.getHeightProp();
									if (false === oOldProps.isEqual(oNewProps)) {
										row.setHeightProp(oNewProps);
										History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_RowProp, wsTo.getId(), row._getUpdateRange(), new UndoRedoData_IndexSimpleProp(nCurIndex, true, oOldProps, oNewProps));
									}
								}
							});
						}
					}
					nCurCount++;
					if (nCurIndex > to.r2)
						break;
				}
			}
		}
		var nLastRow = from.r2;
		if (0 == from.r1 && gc_nMaxRow0 == from.r2)
		{
			var aColProperties = [];
			nLastRow = 0;
			fromRange._foreachColNoEmpty(function(col){
				if(!col.isEmpty())
					aColProperties.push({ index: col.index - from.c1, prop: col.getWidthProp(), style: col.getStyle() });
			}, function(cell){
				var nCurRow0 = cell.nRow;
				if(nCurRow0 > nLastRow)
					nLastRow = nCurRow0;
			});
			if (aColProperties.length > 0)
			{
				bChangeRowColProp = true;
				var nCurCount = 0;
				var nCurIndex = 0;
				while (true) {
					for (var i = 0, length = aColProperties.length; i < length; ++i) {
						var propElem = aColProperties[i];
						nCurIndex = to.c1 + nCurCount * (from.c2 - from.c1 + 1) + propElem.index;
						if (nCurIndex > to.c2)
							break;
						else{
							var col = wsTo._getCol(nCurIndex);
							if (null != propElem.style)
								col.setStyle(propElem.style);
							if (null != propElem.prop) {
								var oNewProps = propElem.prop;
								var oOldProps = col.getWidthProp();
								if (false == oOldProps.isEqual(oNewProps)) {
									col.setWidthProp(oNewProps);
									wsTo.initColumn(col);
									History.Add(AscCommonExcel.g_oUndoRedoWorksheet, AscCH.historyitem_Worksheet_ColProp, wsTo.getId(), new Asc.Range(nCurIndex, 0, nCurIndex, gc_nMaxRow0), new UndoRedoData_IndexSimpleProp(nCurIndex, false, oOldProps, oNewProps));
								}
							}
						}
					}
					nCurCount++;
					if (nCurIndex > to.c2)
						break;
				}
			}
		}
		if (bChangeRowColProp)
			wb.handlers.trigger("changeWorksheetUpdate", wsTo.getId());
		if(nLastCol != from.c2 || nLastRow != from.r2)
		{
			var offset = new AscCommon.CellBase(nLastRow - from.r2, nLastCol - from.c2);
			toRange.setOffsetLast(offset);
			to = toRange.getBBox0();
			fromRange.setOffsetLast(offset);
			from = fromRange.getBBox0();
		}
		var nWidth = from.c2 - from.c1 + 1;
		var nHeight = from.r2 - from.r1 + 1;
		//удаляем текст или все в области для заполнения
		if(bIsPromote && nIndex >= 0 && ((true == bVertical && nHeight > nIndex) || (false == bVertical && nWidth > nIndex)))
		{
			//удаляем только текст в области для заполнения
			toRange.cleanText();
		}
		else
		{
			//удаляем все в области для заполнения
			if(bIsPromote)
				toRange.cleanAll();
			else
				toRange.cleanFormat();
			//собираем все данные
			var bReverse = false;
			if(nIndex < 0)
				bReverse = true;
			var oPromoteHelper = new PromoteHelper(bVertical, bReverse, from);
			fromRange._foreachNoEmpty(function(oCell, nRow0, nCol0, nRowStart0, nColStart0){
				if(null != oCell)
				{
					var nVal = null;
					var bDelimiter = false;
					var sPrefix = null;
					var padding = 0;
					var bDate = false;
					if(bIsPromote)
					{
						if (!oCell.isFormula())
						{
							var sValue = oCell.getValueWithoutFormat();
							if("" != sValue)
							{
								bDelimiter = true;
								var nType = oCell.getType();
								if(CellValueType.Number == nType || CellValueType.String == nType)
								{
									if(CellValueType.Number == nType)
										nVal = sValue - 0;
									else
									{
										//если текст заканчивается на цифру тоже используем ее
										var nEndIndex = sValue.length;
										for(var k = sValue.length - 1; k >= 0; --k)
										{
											var sCurChart = sValue[k];
											if('0' <= sCurChart && sCurChart <= '9')
												nEndIndex--;
											else
												break;
										}
										if(sValue.length != nEndIndex)
										{
											sPrefix = sValue.substring(0, nEndIndex);
											var sNumber = sValue.substring(nEndIndex);
											//sNumber have no decimal point, so can use simple parseInt
											nVal = sNumber - 0;
											padding = sNumber[0] === '0' ? sNumber.length : 0;
										}
									}
								}
								if(null != oCell.xfs && null != oCell.xfs.num && null != oCell.xfs.num.getFormat()){
									var numFormat = oNumFormatCache.get(oCell.xfs.num.getFormat());
									if(numFormat.isDateTimeFormat())
										bDate = true;
								}
								if(null != nVal)
									bDelimiter = false;
							}
						}
						else
							bDelimiter = true;
					}
					oPromoteHelper.add(nRow0 - nRowStart0, nCol0 - nColStart0, nVal, bDelimiter, sPrefix, padding, bDate, oCell.duplicate());
				}
			});
			var bCopy = false;
			if(bCtrl)
				bCopy = true;
			//в случае одной ячейки с числом меняется смысл bCtrl
			if(1 == nWidth && 1 == nHeight && oPromoteHelper.isOnlyIntegerSequence())
				bCopy = !bCopy;
			oPromoteHelper.finishAdd(bCopy);
			//заполняем ячейки данными
			var nStartRow, nEndRow, nStartCol, nEndCol, nColDx, bRowFirst;
			if(bVertical)
			{
				nStartRow = to.c1;
				nEndRow = to.c2;
				bRowFirst = false;
				if(bReverse)
				{
					nStartCol = to.r2;
					nEndCol = to.r1;
					nColDx = -1;
				}
				else
				{
					nStartCol = to.r1;
					nEndCol = to.r2;
					nColDx = 1;
				}
			}
			else
			{
				nStartRow = to.r1;
				nEndRow = to.r2;
				bRowFirst = true;
				if(bReverse)
				{
					nStartCol = to.c2;
					nEndCol = to.c1;
					nColDx = -1;
				}
				else
				{
					nStartCol = to.c1;
					nEndCol = to.c2;
					nColDx = 1;
				}
			}
			var addedFormulasArray = [];
			var isAddFormulaArray = function(arrayRef) {
				var res = false;
				for(var n = 0; n < addedFormulasArray.length; n++) {
					if(addedFormulasArray[n].isEqual(arrayRef)) {
						res = true;
						break;
					}
				}
				return res;
			};
			for(var i = nStartRow; i <= nEndRow; i ++)
			{
				oPromoteHelper.setIndex(i - nStartRow);
				for(var j = nStartCol; (nStartCol - j) * (nEndCol - j) <= 0; j += nColDx)
				{
					if (bVertical && wsTo.bExcludeHiddenRows && wsTo.getRowHidden(j))
					{
						continue;
					}

					var data = oPromoteHelper.getNext();
					if(null != data && (data.oAdditional || (false == bCopy && null != data.nCurValue)))
					{
						var oFromCell = data.oAdditional;
						var nRow = bRowFirst ? i : j;
						var nCol = bRowFirst ? j : i;
						wsTo._getCell(nRow, nCol, function(oCopyCell){
							if(bIsPromote)
							{
								if(false == bCopy && null != data.nCurValue)
								{
									var oCellValue = new AscCommonExcel.CCellValue();
									if (null != data.sPrefix) {
										var sVal = data.sPrefix;
										//toString enough, becouse nCurValue nave not decimal part
										var sNumber = data.nCurValue.toString();
										if (sNumber.length < data.padding) {
											sNumber = '0'.repeat(data.padding - sNumber.length) + sNumber;
										}
										sVal += sNumber;
										oCellValue.text = sVal;
										oCellValue.type = CellValueType.String;
									} else {
										oCellValue.number = data.nCurValue;
										oCellValue.type = CellValueType.Number;
									}
									oCopyCell.setValueData(new UndoRedoData_CellValueData(null, oCellValue));
								}
								else if(null != oFromCell)
								{
									//копируем полностью
									if(!oFromCell.isFormula()){
										oCopyCell.setValueData(oFromCell.getValueData());
										//todo
										// if(oCopyCell.isEmptyTextString())
										// wsTo._getHyperlink().remove({r1: oCopyCell.nRow, c1: oCopyCell.nCol, r2: oCopyCell.nRow, c2: oCopyCell.nCol});
									} else {
										var fromFormulaParsed = oFromCell.getFormulaParsed();
										var formulaArrayRef = fromFormulaParsed.getArrayFormulaRef();

										var _p_,offset, offsetArray, assemb;
										if(formulaArrayRef) {
											var intersectionFrom = from.intersection(formulaArrayRef);
											if(intersectionFrom) {
												if((intersectionFrom.c1 === oFromCell.nCol && intersectionFrom.r1 === oFromCell.nRow) || (intersectionFrom.c2 === oFromCell.nCol && intersectionFrom.r2 === oFromCell.nRow)) {

													offsetArray = oCopyCell.getOffset2(oFromCell.getName());
													intersectionFrom.setOffset(offsetArray);

													var intersectionTo = intersectionFrom.intersection(to);
													if(intersectionTo && !isAddFormulaArray(intersectionTo)) {
														addedFormulasArray.push(intersectionTo);
														//offset = oCopyCell.getOffset3(formulaArrayRef.c1 + 1, formulaArrayRef.r1 + 1);
														offset = new AscCommon.CellBase(intersectionTo.r1 - formulaArrayRef.r1, intersectionTo.c1 - formulaArrayRef.c1);
														_p_ = oFromCell.getFormulaParsed().clone(null, oFromCell, this);
														_p_.changeOffset(offset);

														var rangeFormulaArray = oCopyCell.ws.getRange3(intersectionTo.r1, intersectionTo.c1, intersectionTo.r2, intersectionTo.c2);
														rangeFormulaArray.setValue("=" + _p_.assemble(true), function (r) {}, null, intersectionTo);

														History.Add(AscCommonExcel.g_oUndoRedoArrayFormula,
															AscCH.historyitem_ArrayFromula_AddFormula, oCopyCell.ws.getId(),
															new Asc.Range(intersectionTo.c1, intersectionTo.r1, intersectionTo.c2, intersectionTo.r2),
															new AscCommonExcel.UndoRedoData_ArrayFormula(intersectionTo, "=" + oCopyCell.getFormulaParsed().assemble(true)));
													}

												}
											}
										} else {
											_p_ = oFromCell.getFormulaParsed().clone(null, oFromCell, this);
											offset = oCopyCell.getOffset2(oFromCell.getName());
											assemb = _p_.changeOffset(offset).assemble(true);
											oCopyCell.setFormula(assemb);
										}

									}
								}
							}
							//выставляем стиль после текста, потому что если выставить числовой стиль ячейки 'text', то после этого не применится формула
							if (null != oFromCell) {
								oCopyCell.setStyle(oFromCell.getStyle());
								if (bIsPromote)
									oCopyCell.setType(oFromCell.getType());
							}
						});
					}
				}
			}
			if(bIsPromote) {
				wb.dependencyFormulas.addToChangedRange( wsTo.Id, to );
			}
			//добавляем замерженые области
			var nDx = from.c2 - from.c1 + 1;
			var nDy = from.r2 - from.r1 + 1;
			var oMergedFrom = oCanPromote.oMergedFrom;
			if(null != oMergedFrom && oMergedFrom.all.length > 0)
			{
				for (var i = to.c1; i <= to.c2; i += nDx) {
					for (var j = to.r1; j <= to.r2; j += nDy) {
						for (var k = 0, length3 = oMergedFrom.all.length; k < length3; k++) {
							var oMergedBBox = oMergedFrom.all[k].bbox;
							var oNewMerged = new Asc.Range(i + oMergedBBox.c1 - from.c1, j + oMergedBBox.r1 - from.r1, i + oMergedBBox.c2 - from.c1, j + oMergedBBox.r2 - from.r1);
							if(to.contains(oNewMerged.c1, oNewMerged.r1)) {
								if(to.c2 < oNewMerged.c2)
									oNewMerged.c2 = to.c2;
								if(to.r2 < oNewMerged.r2)
									oNewMerged.r2 = to.r2;
								if(!oNewMerged.isOneCell())
									wsTo.mergeManager.add(oNewMerged, 1);
							}
						}
					}
				}
			}
			if(bIsPromote)
			{
				//добавляем ссылки
				//не как в Excel поддерживаются ссылки на диапазоны
				var oHyperlinks = wsFrom.hyperlinkManager.get(from);
				if(oHyperlinks.inner.length > 0)
				{
					for (var i = to.c1; i <= to.c2; i += nDx) {
						for (var j = to.r1; j <= to.r2; j += nDy) {
							for(var k = 0, length3 = oHyperlinks.inner.length; k < length3; k++){
								var oHyperlink = oHyperlinks.inner[k];
								var oHyperlinkBBox = oHyperlink.bbox;
								var oNewHyperlink = new Asc.Range(i + oHyperlinkBBox.c1 - from.c1, j + oHyperlinkBBox.r1 - from.r1, i + oHyperlinkBBox.c2 - from.c1, j + oHyperlinkBBox.r2 - from.r1);
								if (to.containsRange(oNewHyperlink))
									wsTo.hyperlinkManager.add(oNewHyperlink, oHyperlink.data.clone());
							}
						}
					}
				}
			}
		}

		wsFrom.excludeHiddenRows(oldExcludeHiddenRows);
		History.EndTransaction();
		wb.dependencyFormulas.unlockRecal();
	}
	Range.prototype.createCellOnRowColCross=function(){
		var oThis = this;
		var bbox = this.bbox;
		var nRangeType = this._getRangeType(bbox);
		if(c_oRangeType.Row == nRangeType)
		{
			this._foreachColNoEmpty(function(col){
				if(null != col.xfs)
				{
					for(var i = bbox.r1; i <= bbox.r2; ++i)
						oThis.worksheet._getCell(i, col.index, function(){});
				}
			}, null);
		}
		else if(c_oRangeType.Col == nRangeType)
		{
			this._foreachRowNoEmpty(function(row){
				if(null != row.xfs)
				{
					for(var i = bbox.c1; i <= bbox.c2; ++i)
						oThis.worksheet._getCell(row.index, i, function(){});
				}
			}, null);
		}
	};

	Range.prototype.getLeftTopCell = function(fAction) {
		return this.worksheet._getCell(this.bbox.r1, this.bbox.c1, fAction);
	};

	Range.prototype.getLeftTopCellNoEmpty = function(fAction) {
		return this.worksheet._getCellNoEmpty(this.bbox.r1, this.bbox.c1, fAction);
	};

	function RowIterator() {
	}

	RowIterator.prototype.init = function(ws, r1, c1, c2) {
		this.ws = ws;
		this.cell = new Cell(ws);
		this.c1 = c1;
		this.c2 = Math.min(c2, ws.getColDataLength() - 1);
		this.indexRow = r1;
		this.indexCol = 0;

		this.colDatas = [];
		this.colDatasIndex = [];
		for (var i = this.c1; i <= this.c2; i++) {
			var colData = this.ws.getColDataNoEmpty(i);
			if (colData) {
				this.colDatas.push(colData);
				this.colDatasIndex.push(i);
			}
		}
		this.ws.workbook.loadCells.push(this.cell);
	};
	RowIterator.prototype.release = function() {
		this.cell.saveContent(true);
		this.ws.workbook.loadCells.pop();
	};
	RowIterator.prototype.setRow = function(index) {
		this.indexRow = index;
		this.indexCol = 0;
	};
	RowIterator.prototype.next = function() {
		var wb = this.ws.workbook;
		this.cell.saveContent(true);
		for (; this.indexCol < this.colDatasIndex.length; this.indexCol++) {
			var colData = this.colDatas[this.indexCol];
			var nCol = this.colDatasIndex[this.indexCol];
			if (colData.hasSize(this.indexRow)) {
				var targetCell = null;
				for (var k = 0; k < wb.loadCells.length - 1; ++k) {
					var elem = wb.loadCells[k];
					if (elem.nRow == this.indexRow && elem.nCol == nCol && this.ws === elem.ws) {
						targetCell = elem;
						break;
					}
				}
				if (null === targetCell) {
					if (this.cell.loadContent(this.indexRow, nCol, colData)) {
						this.indexCol++;
						return this.cell;
					}
				} else {
					this.indexCol++;
					return targetCell;
				}
			} else {
				//splice by one element is too slow
				var endIndex = this.indexCol + 1;
				while (endIndex < this.colDatasIndex.length && !this.colDatas[endIndex].hasSize(this.indexRow)) {
					endIndex++;
				}
				this.colDatas.splice(this.indexCol, endIndex - this.indexCol);
				this.colDatasIndex.splice(this.indexCol, endIndex - this.indexCol);
				this.indexCol--;
			}
		}
	};
//-------------------------------------------------------------------------------------------------
	/**
	 * @constructor
	 */
	function PromoteHelper(bVerical, bReverse, bbox){
		//автозаполнение происходит всегда в правую сторону, поэтому менются индексы в методе add, и это надо учитывать при вызове getNext
		this.bVerical = bVerical;
		this.bReverse = bReverse;
		this.bbox = bbox;
		this.oDataRow = {};
		//для get
		this.oCurRow = null;
		this.nCurColIndex = null;
		this.nRowLength = 0;
		this.nColLength = 0;
		if(this.bVerical)
		{
			this.nRowLength = this.bbox.c2 - this.bbox.c1 + 1;
			this.nColLength = this.bbox.r2 - this.bbox.r1 + 1;
		}
		else
		{
			this.nRowLength = this.bbox.r2 - this.bbox.r1 + 1;
			this.nColLength = this.bbox.c2 - this.bbox.c1 + 1;
		}
	}
	PromoteHelper.prototype = {
		add: function(nRow, nCol, nVal, bDelimiter, sPrefix, padding, bDate, oAdditional){
			if(this.bVerical)
			{
				//транспонируем для удобства
				var temp = nRow;
				nRow = nCol;
				nCol = temp;
			}
			if(this.bReverse)
				nCol = this.nColLength - nCol - 1;
			var row = this.oDataRow[nRow];
			if(null == row)
			{
				row = {};
				this.oDataRow[nRow] = row;
			}
			row[nCol] = {nCol: nCol, nVal: nVal, bDelimiter: bDelimiter, sPrefix: sPrefix, padding: padding, bDate: bDate, oAdditional: oAdditional, oSequence: null, nCurValue: null};
		},
		isOnlyIntegerSequence: function(){
			var bRes = true;
			var bEmpty = true;
			for(var i in this.oDataRow)
			{
				var row = this.oDataRow[i];
				for(var j in row)
				{
					var data = row[j];
					bEmpty = false;
					if(!(null != data.nVal && true != data.bDate && null == data.sPrefix))
					{
						bRes = false;
						break;
					}
				}
				if(!bRes)
					break;
			}
			if(bEmpty)
				bRes = false;
			return bRes;
		},
		_promoteSequence: function(aDigits){
			// Это коэффициенты линейного приближения (http://office.microsoft.com/ru-ru/excel-help/HP010072685.aspx)
			// y=a1*x+a0 (где: x=0,1....; y=значения в ячейках; a0 и a1 - это решения приближения функции методом наименьших квадратов
			// (n+1)*a0        + (x0+x1+....)      *a1=(y0+y1+...)
			// (x0+x1+....)*a0 + (x0*x0+x1*x1+....)*a1=(y0*x0+y1*x1+...)
			// http://www.exponenta.ru/educat/class/courses/vvm/theme_7/theory.asp
			var a0 = 0.0;
			var a1 = 0.0;
			// Индекс X
			var nX = 0;
			if(1 == aDigits.length)
			{
				nX = 1;
				a1 = 1;
				a0 = aDigits[0].y;
			}
			else
			{
				// (n+1)
				var nN = aDigits.length;
				// (x0+x1+....)
				var nXi = 0;
				// (x0*x0+x1*x1+....)
				var nXiXi = 0;
				// (y0+y1+...)
				var dYi = 0.0;
				// (y0*x0+y1*x1+...)
				var dYiXi = 0.0;

				// Цикл по всем строкам
				for (var i = 0, length = aDigits.length; i < length; ++i)
				{
					var data = aDigits[i];
					nX = data.x;
					var dValue = data.y;

					// Вычисляем значения
					nXi += nX;
					nXiXi += nX * nX;
					dYi += dValue;
					dYiXi += dValue * nX;
				}
				nX++;

				// Теперь решаем систему уравнений
				// Общий детерминант
				var dD = nN * nXiXi - nXi * nXi;
				// Детерминант первого корня
				var dD1 = dYi * nXiXi - nXi * dYiXi;
				// Детерминант второго корня
				var dD2 = nN * dYiXi - dYi * nXi;

				a0 = dD1 / dD;
				a1 = dD2 / dD;
			}
			return {a0: a0, a1: a1, nX: nX};
		},
		_addSequenceToRow : function(nRowIndex, aSortRowIndex, row, aCurSequence){
			if(aCurSequence.length > 0)
			{
				var oFirstData = aCurSequence[0];
				var bCanPromote = true;
				//если последовательность состоит из одного числа и той же колонке есть еще последовательности, то надо копировать, а не автозаполнять
				if(1 == aCurSequence.length)
				{
					var bVisitRowIndex = false;
					var oVisitData = null;
					for(var i = 0, length = aSortRowIndex.length; i < length; i++)
					{
						var nCurRowIndex = aSortRowIndex[i];
						if(nRowIndex == nCurRowIndex)
						{
							bVisitRowIndex = true;
							if(oVisitData && oFirstData.sPrefix == oVisitData.sPrefix && oFirstData.bDate == oVisitData.bDate)
							{
								bCanPromote = false;
								break;
							}
						}
						else
						{
							var oCurRow = this.oDataRow[nCurRowIndex];
							if(oCurRow)
							{
								var data = oCurRow[oFirstData.nCol];
								if(null != data)
								{
									if(null != data.nVal)
									{
										oVisitData = data;
										if(bVisitRowIndex)
										{
											if(oFirstData.sPrefix == oVisitData.sPrefix && oFirstData.bDate == oVisitData.bDate)
												bCanPromote = false;
											break;
										}
									}
									else if(data.bDelimiter)
									{
										oVisitData = null;
										if(bVisitRowIndex)
											break;
									}
								}
							}
						}
					}
				}
				if(bCanPromote)
				{
					var nMinIndex = null;
					var nMaxIndex = null;
					var bValidIndexDif = true;
					var nPrevX = null;
					var nPrevVal = null;
					var nIndexDif = null;
					var nValueDif = null;
					var nMaxPadding = 0;
					//анализируем последовательность, если числа расположены не на одинаковом расстоянии, то считаем их сплошной последовательностью
					//последовательность с промежутками может быть только целочисленной
					for(var i = 0, length = aCurSequence.length; i < length; i++)
					{
						var data = aCurSequence[i];
						var nCurX = data.nCol;
						if(null == nMinIndex || null == nMaxIndex)
							nMinIndex = nMaxIndex = nCurX;
						else
						{
							if(nCurX < nMinIndex)
								nMinIndex = nCurX;
							if(nCurX > nMaxIndex)
								nMaxIndex = nCurX;
						}
						if(bValidIndexDif)
						{
							if(null != nPrevX && null != nPrevVal)
							{
								var nCurDif = nCurX - nPrevX;
								var nCurValDif = data.nVal - nPrevVal;
								if(null == nIndexDif || null == nCurValDif)
								{
									nIndexDif = nCurDif;
									nValueDif = nCurValDif;
								}
								else if(nIndexDif != nCurDif || nValueDif != nCurValDif)
								{
									nIndexDif = null;
									bValidIndexDif = false;
								}
							}
						}
						nMaxPadding = Math.max(nMaxPadding, data.padding);
						nPrevX = nCurX;
						nPrevVal = data.nVal;
					}
					var bWithSpace = false;
					if(null != nIndexDif)
					{
						nIndexDif = Math.abs(nIndexDif);
						if(nIndexDif > 1)
							bWithSpace = true;
					}
					//заполняем массив с координатами
					var bExistSpace = false;
					nPrevX = null;
					var aDigits = [];
					for(var i = 0, length = aCurSequence.length; i < length; i++)
					{
						var data = aCurSequence[i];
						data.padding = nMaxPadding;
						var nCurX = data.nCol;
						var x = nCurX - nMinIndex;
						if(null != nIndexDif && nIndexDif > 0)
							x /= nIndexDif;
						if(null != nPrevX && nCurX - nPrevX > 1)
							bExistSpace = true;
						var y = data.nVal;
						//даты автозаполняем только по целой части
						if(data.bDate)
							y = parseInt(y);
						aDigits.push({x: x, y: y});
						nPrevX = nCurX;
					}
					if(aDigits.length > 0)
					{
						var oSequence = this._promoteSequence(aDigits);
						if(1 == aDigits.length && this.bReverse)
						{
							//меняем коэффициенты для случая одного числа в последовательности, иначе она в любую сторону будет возрастающей
							oSequence.a1 *= -1;
						}
						var bIsIntegerSequence = oSequence.a1 != parseInt(oSequence.a1);
						//для дат и чисел с префиксом автозаполняются только целочисленные последовательности
						if(!((null != oFirstData.sPrefix || true == oFirstData.bDate) && bIsIntegerSequence))
						{
							if(false == bWithSpace && bExistSpace)
							{
								for(var i = nMinIndex; i <= nMaxIndex; i++)
								{
									var data = row[i];
									if(null == data)
									{
										data = {nCol: i, nVal: null, bDelimiter: oFirstData.bDelimiter, sPrefix: oFirstData.sPrefix, bDate: oFirstData.bDate, oAdditional: null, oSequence: null, nCurValue: null};
										row[i] = data;
									}
									data.oSequence = oSequence;
								}
							}
							else
							{
								for(var i = 0, length = aCurSequence.length; i < length; i++)
								{
									var nCurX = aCurSequence[i].nCol;
									if(null != nCurX)
										row[nCurX].oSequence = oSequence;
								}
							}
						}
					}
				}
			}
		},
		finishAdd : function(bCopy){
			if(true != bCopy)
			{
				var aSortRowIndex = [];
				for(var i in this.oDataRow)
					aSortRowIndex.push(i - 0);
				aSortRowIndex.sort(fSortAscending);
				for(var i = 0, length = aSortRowIndex.length; i < length; i++)
				{
					var nRowIndex = aSortRowIndex[i];
					var row = this.oDataRow[nRowIndex];
					//собираем информация о последовательностях в row
					var aSortIndex = [];
					for(var j in row)
						aSortIndex.push(j - 0);
					aSortIndex.sort(fSortAscending);
					var aCurSequence = [];
					var oPrevData = null;
					for(var j = 0, length2 = aSortIndex.length; j < length2; j++)
					{
						var nColIndex = aSortIndex[j];
						var data = row[nColIndex];
						var bAddToSequence = false;
						if(null != data.nVal)
						{
							bAddToSequence = true;
							if(null != oPrevData && (oPrevData.bDelimiter != data.bDelimiter || oPrevData.sPrefix != data.sPrefix || oPrevData.bDate != data.bDate))
							{
								this._addSequenceToRow(nRowIndex, aSortRowIndex, row, aCurSequence);
								aCurSequence = [];
								oPrevData = null;
							}
							oPrevData = data;
						}
						else if(data.bDelimiter)
						{
							this._addSequenceToRow(nRowIndex, aSortRowIndex, row, aCurSequence);
							aCurSequence = [];
							oPrevData = null;
						}
						if(bAddToSequence)
							aCurSequence.push(data);
					}
					this._addSequenceToRow(nRowIndex, aSortRowIndex, row, aCurSequence);
				}
			}
		},
		setIndex: function(index){
			if(0 != this.nRowLength && index >= this.nRowLength)
				index = index % (this.nRowLength);
			this.oCurRow = this.oDataRow[index];
			this.nCurColIndex = 0;
		},
		getNext: function(){
			var oRes = null;
			if(this.oCurRow)
			{
				var oRes = this.oCurRow[this.nCurColIndex];
				if(null != oRes)
				{
					oRes.nCurValue = null;
					if(null != oRes.oSequence)
					{
						var sequence = oRes.oSequence;
						if(oRes.bDate || null != oRes.sPrefix)
							oRes.nCurValue = Math.abs(sequence.a1 * sequence.nX + sequence.a0);
						else
							oRes.nCurValue = sequence.a1 * sequence.nX + sequence.a0;
						sequence.nX ++;
					}
				}
				this.nCurColIndex++;
				if(this.nCurColIndex >= this.nColLength)
					this.nCurColIndex = 0;
			}
			return oRes;
		}
	};

//-------------------------------------------------------------------------------------------------

	/**
	 * @constructor
	 */
	function HiddenManager(ws) {
		this.ws = ws;
		this.hiddenRowsSum = [];
		this.hiddenColsSum = [];
		this.dirty = true;
		this.recalcHiddenRows = {};
		this.recalcHiddenCols = {};
		this.hiddenRowMin = gc_nMaxRow0;
		this.hiddenRowMax = 0;
	}
	HiddenManager.prototype.initPostOpen = function () {
		this.hiddenRowMin = gc_nMaxRow0;
		this.hiddenRowMax = 0;
	};
	HiddenManager.prototype.addHidden = function (isRow, index) {
		(isRow ? this.recalcHiddenRows : this.recalcHiddenCols)[index] = true;
		if (isRow) {
			this.hiddenRowMin = Math.min(this.hiddenRowMin, index);
			this.hiddenRowMax = Math.max(this.hiddenRowMax, index);
		}
		this.setDirty(true);
	};
	HiddenManager.prototype.getRecalcHidden = function () {
		var res = [];
		var i;
		for (i in this.recalcHiddenRows) {
			i = +i;
			res.push(new Asc.Range(0, i, gc_nMaxCol0, i));
		}
		for (i in this.recalcHiddenCols) {
			i = +i;
			res.push(new Asc.Range(i, 0, i, gc_nMaxRow0));
		}
		this.recalcHiddenRows = {};
		this.recalcHiddenCols = {};
		return res;
	};
	HiddenManager.prototype.getHiddenRowsRange = function() {
		var res;
		if (this.hiddenRowMin <= this.hiddenRowMax) {
			res = {r1: this.hiddenRowMin, r2: this.hiddenRowMax};
			this.hiddenRowMin = gc_nMaxRow0;
			this.hiddenRowMax = 0;
		}
		return res;
	};
	HiddenManager.prototype.setDirty = function(val) {
		this.dirty = val;
	};
	HiddenManager.prototype.getHiddenRowsCount = function(from, to) {
		return this._getHiddenCount(true, from, to);
	};
	HiddenManager.prototype.getHiddenColsCount = function(from, to) {
		return this._getHiddenCount(false, from, to);
	};
	HiddenManager.prototype._getHiddenCount = function(isRow, from, to) {
		//todo wrong result if 'to' is hidden
		if (this.dirty) {
			this.dirty = false;
			this._init();
		}
		var hiddenSum = isRow ? this.hiddenRowsSum : this.hiddenColsSum;
		var toCount = to < hiddenSum.length ? hiddenSum[to] : 0;
		var fromCount = from < hiddenSum.length ? hiddenSum[from] : 0;
		return fromCount - toCount;
	};
	HiddenManager.prototype._init = function() {
		if (this.ws) {
			this.hiddenColsSum = this._initHiddenSumCol(this.ws.aCols);
			this.hiddenRowsSum = this._initHiddenSumRow();
		}
	};
	HiddenManager.prototype._initHiddenSumCol = function(elems) {
		var hiddenSum = [];
		if (this.ws) {
			var i;
			var hiddenFlags = [];
			for (i in elems) {
				if (elems.hasOwnProperty(i)) {
					var elem = elems[i];
					if (null != elem && elem.getHidden()) {
						hiddenFlags[i] = 1;
					}
				}
			}
			var sum = 0;
			for (i = hiddenFlags.length - 1; i >= 0; --i) {
				if (hiddenFlags[i] > 0) {
					sum++;
				}
				hiddenSum[i] = sum;
			}
		}
		return hiddenSum;
	};
	HiddenManager.prototype._initHiddenSumRow = function() {
		var hiddenSum = [];
		if (this.ws) {
			var i;
			var hiddenFlags = [];
			this.ws._forEachRow(function(row) {
				if (row.getHidden()) {
					hiddenFlags[row.getIndex()] = 1;
				}
			});
			var sum = 0;
			for (i = hiddenFlags.length - 1; i >= 0; --i) {
				if (hiddenFlags[i] > 0) {
					sum++;
				}
				hiddenSum[i] = sum;
			}
		}
		return hiddenSum;
	};

	/**
	 * @constructor
	 */
	function DrawingObjectsManager(worksheet)
	{
		this.worksheet = worksheet;
	}

	DrawingObjectsManager.prototype.updateChartReferences = function(oldWorksheet, newWorksheet)
	{
		AscFormat.ExecuteNoHistory(function(){
			this.updateChartReferencesWidthHistory(oldWorksheet, newWorksheet);
		}, this, []);
	};

	DrawingObjectsManager.prototype.updateChartReferencesWidthHistory = function(oldWorksheet, newWorksheet, bNoRebuildCache)
	{
		var aObjects = this.worksheet.Drawings;
		for (var i = 0; i < aObjects.length; i++) {
			var graphicObject = aObjects[i].graphicObject;
			if ( graphicObject.updateChartReferences )
			{
				graphicObject.updateChartReferences(oldWorksheet, newWorksheet, bNoRebuildCache);
			}
		}
	};


	DrawingObjectsManager.prototype.rebuildCharts = function(data)
	{
		var aObjects = this.worksheet.Drawings;
		for(var i = 0; i < aObjects.length; ++i)
		{
			if(aObjects[i].graphicObject.rebuildSeries)
			{
				aObjects[i].graphicObject.rebuildSeries(data);
			}
		}
	};

	function tryTranslateToPrintArea(val) {
		var printAreaStr = "Print_Area";
		var printAreaStrLocale = AscCommon.translateManager.getValue(printAreaStr);
		if(printAreaStrLocale.toLowerCase() === val.toLowerCase()) {
			return printAreaStr;
		}
		return null;
	};

	window['AscCommonExcel'] = window['AscCommonExcel'] || {};
	window['AscCommonExcel'].g_nVerticalTextAngle = g_nVerticalTextAngle;
	window['AscCommonExcel'].oDefaultMetrics = oDefaultMetrics;
	window['AscCommonExcel'].g_nAllColIndex = g_nAllColIndex;
	window['AscCommonExcel'].g_nAllRowIndex = g_nAllRowIndex;
	window['AscCommonExcel'].g_DefNameWorksheet = null;
	window['AscCommonExcel'].aStandartNumFormats = aStandartNumFormats;
	window['AscCommonExcel'].aStandartNumFormatsId = aStandartNumFormatsId;
	window['AscCommonExcel'].oFormulaLocaleInfo = oFormulaLocaleInfo;
	window['AscCommonExcel'].getDefNameIndex = getDefNameIndex;
	window['AscCommonExcel'].getCellIndex = getCellIndex;
	window['AscCommonExcel'].angleFormatToInterface2 = angleFormatToInterface2;
	window['AscCommonExcel'].angleInterfaceToFormat = angleInterfaceToFormat;
	window['AscCommonExcel'].Workbook = Workbook;
	window['AscCommonExcel'].CT_Workbook = CT_Workbook;
	window['AscCommonExcel'].Worksheet = Worksheet;
	window['AscCommonExcel'].Cell = Cell;
	window['AscCommonExcel'].Range = Range;
	window['AscCommonExcel'].DefName = DefName;
	window['AscCommonExcel'].DependencyGraph = DependencyGraph;
	window['AscCommonExcel'].HiddenManager = HiddenManager;
	window['AscCommonExcel'].CCellWithFormula = CCellWithFormula;
	window['AscCommonExcel'].preparePromoteFromTo = preparePromoteFromTo;
	window['AscCommonExcel'].promoteFromTo = promoteFromTo;
	window['AscCommonExcel'].getCompiledStyle = getCompiledStyle;
	window['AscCommonExcel'].getCompiledStyleFromArray = getCompiledStyleFromArray;
	window['AscCommonExcel'].ignoreFirstRowSort = ignoreFirstRowSort;
	window['AscCommonExcel'].tryTranslateToPrintArea = tryTranslateToPrintArea;
	window['AscCommonExcel']._isSameSizeMerged = _isSameSizeMerged;

})(window);
