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
function (window, undefined) {
	var g_cCharDelimiter = AscCommon.g_cCharDelimiter;
	var parserHelp = AscCommon.parserHelp;
	var gc_nMaxRow0 = AscCommon.gc_nMaxRow0;
	var gc_nMaxCol0 = AscCommon.gc_nMaxCol0;
	var g_oCellAddressUtils = AscCommon.g_oCellAddressUtils;
	var CellAddress = AscCommon.CellAddress;

	var cElementType = AscCommonExcel.cElementType;
	var cErrorType = AscCommonExcel.cErrorType;
	var cNumber = AscCommonExcel.cNumber;
	var cString = AscCommonExcel.cString;
	var cBool = AscCommonExcel.cBool;
	var cError = AscCommonExcel.cError;
	var cArea = AscCommonExcel.cArea;
	var cArea3D = AscCommonExcel.cArea3D;
	var cRef = AscCommonExcel.cRef;
	var cRef3D = AscCommonExcel.cRef3D;
	var cEmpty = AscCommonExcel.cEmpty;
	var cArray = AscCommonExcel.cArray;
	var cBaseFunction = AscCommonExcel.cBaseFunction;

	var checkTypeCell = AscCommonExcel.checkTypeCell;
	var cFormulaFunctionGroup = AscCommonExcel.cFormulaFunctionGroup;

	var _func = AscCommonExcel._func;

	cFormulaFunctionGroup['LookupAndReference'] = cFormulaFunctionGroup['LookupAndReference'] || [];
	cFormulaFunctionGroup['LookupAndReference'].push(cADDRESS, cAREAS, cCHOOSE, cCOLUMN, cCOLUMNS, cFORMULATEXT,
		cGETPIVOTDATA, cHLOOKUP, cHYPERLINK, cINDEX, cINDIRECT, cLOOKUP, cMATCH, cOFFSET, cROW, cROWS, cRTD, cTRANSPOSE,
		cVLOOKUP);

	cFormulaFunctionGroup['NotRealised'] = cFormulaFunctionGroup['NotRealised'] || [];
	cFormulaFunctionGroup['NotRealised'].push(cAREAS, cGETPIVOTDATA, cRTD);

	function searchRegExp(str, flags) {
		var vFS = str
			.replace(/(\\)/g, "\\")
			.replace(/(\^)/g, "\\^")
			.replace(/(\()/g, "\\(")
			.replace(/(\))/g, "\\)")
			.replace(/(\+)/g, "\\+")
			.replace(/(\[)/g, "\\[")
			.replace(/(\])/g, "\\]")
			.replace(/(\{)/g, "\\{")
			.replace(/(\})/g, "\\}")
			.replace(/(\$)/g, "\\$")
			.replace(/(~)?\*/g, function ($0, $1) {
				return $1 ? $0 : '(.*)';
			})
			.replace(/(~)?\?/g, function ($0, $1) {
				return $1 ? $0 : '.{1}';
			})
			.replace(/(~\*)/g, "\\*").replace(/(~\?)/g, "\\?");

		return new RegExp(vFS + "$", flags ? flags : "i");
	}

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cADDRESS() {
	}

	//***array-formula***
	cADDRESS.prototype = Object.create(cBaseFunction.prototype);
	cADDRESS.prototype.constructor = cADDRESS;
	cADDRESS.prototype.name = 'ADDRESS';
	cADDRESS.prototype.argumentsMin = 2;
	cADDRESS.prototype.argumentsMax = 5;
	cADDRESS.prototype.Calculate = function (arg) {
		var rowNumber = arg[0], colNumber = arg[1], refType = arg[2] ? arg[2] : new cNumber(1),
			A1RefType = arg[3] ? arg[3] : new cBool(true), sheetName = arg[4] ? arg[4] : null;

		if (cElementType.cellsRange === rowNumber.type || cElementType.cellsRange3D === rowNumber.type) {
			rowNumber = rowNumber.cross(arguments[1]);
		} else if (cElementType.array === rowNumber.type) {
			rowNumber = rowNumber.getElementRowCol(0, 0);
		}

		if (cElementType.cellsRange === colNumber.type || cElementType.cellsRange3D === colNumber.type) {
			colNumber = colNumber.cross(arguments[1]);
		} else if (cElementType.array === colNumber.type) {
			colNumber = colNumber.getElementRowCol(0, 0);
		}

		if (cElementType.cellsRange === refType.type || cElementType.cellsRange3D === refType.type) {
			refType = refType.cross(arguments[1]);
		} else if (cElementType.array === refType.type) {
			refType = refType.getElementRowCol(0, 0);
		} else if(cElementType.empty === refType.type) {
			refType = new cNumber(1);
		}

		if (cElementType.cellsRange === A1RefType.type || cElementType.cellsRange3D === A1RefType.type) {
			A1RefType = A1RefType.cross(arguments[1]);
		} else if (cElementType.array === A1RefType.type) {
			A1RefType = A1RefType.getElementRowCol(0, 0);
		}  else if(cElementType.empty === A1RefType.type) {
			A1RefType = new cNumber(1);
		}

		if(sheetName){
			if (cElementType.cellsRange === sheetName.type || cElementType.cellsRange3D === sheetName.type) {
				sheetName = sheetName.cross(arguments[1]);
			} else if (cElementType.array === sheetName.type) {
				sheetName = sheetName.getElementRowCol(0, 0);
			} else if (cElementType.cell === sheetName.type || cElementType.cell3D === sheetName.type) {
				sheetName = sheetName.getValue();
			} else if (cElementType.empty === sheetName.type) {
				sheetName = null;
			}
		}

		rowNumber = rowNumber.tocNumber();
		colNumber = colNumber.tocNumber();
		refType = refType.tocNumber();
		A1RefType = A1RefType.tocBool();

		if (cElementType.error === rowNumber.type) {
			return rowNumber;
		}
		if (cElementType.error === colNumber.type) {
			return colNumber;
		}
		if (cElementType.error === refType.type) {
			return refType;
		}
		if (cElementType.error === A1RefType.type) {
			return A1RefType;
		}
		if (sheetName && cElementType.error === sheetName.type) {
			return sheetName;
		}

		rowNumber = rowNumber.getValue();
		colNumber = colNumber.getValue();
		refType = refType.getValue();
		A1RefType = A1RefType.toBool();

		rowNumber = parseInt(rowNumber);
		colNumber = parseInt(colNumber);

		if (refType > 4 || refType < 1 || rowNumber < 1 || rowNumber > AscCommon.gc_nMaxRow || colNumber < 1 ||
			colNumber > AscCommon.gc_nMaxCol) {
			return new cError(cErrorType.wrong_value_type);
		}
		var strRef;
		var absR, absC;
		switch (refType - 1) {
			case AscCommonExcel.referenceType.A:
				absR = true;
				absC = true;
				break;
			case AscCommonExcel.referenceType.ARRC:
				absR = true;
				absC = false;
				break;
			case AscCommonExcel.referenceType.RRAC:
				absR = false;
				absC = true;
				break;
			case AscCommonExcel.referenceType.R:
				absR = false;
				absC = false;
				break;
		}

		strRef = this._getRef(this._absolute(absR, rowNumber, A1RefType),
			this._absolute(absC, A1RefType ? g_oCellAddressUtils.colnumToColstrFromWsView(colNumber) : colNumber,
				A1RefType), A1RefType);

		var res = strRef;
		if(sheetName){
			if("" === sheetName.getValue()){
				res = "!" + strRef;
			} else {
				res = parserHelp.get3DRef(sheetName.toString(), strRef);
			}
		}

		return new cString(res);
	};
	cADDRESS.prototype._getRef = function (row, col, A1RefType) {
		return A1RefType ? col + row : 'R' + row + 'C' + col;
	};
	cADDRESS.prototype._absolute = function (abs, val, A1RefType) {

		return abs ? (A1RefType ? '$' + val : val) : (A1RefType ? val : '[' + val + ']');
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cAREAS() {
	}

	cAREAS.prototype = Object.create(cBaseFunction.prototype);
	cAREAS.prototype.constructor = cAREAS;
	cAREAS.prototype.name = 'AREAS';

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cCHOOSE() {
	}

	//***array-formula***
	cCHOOSE.prototype = Object.create(cBaseFunction.prototype);
	cCHOOSE.prototype.constructor = cCHOOSE;
	cCHOOSE.prototype.name = 'CHOOSE';
	cCHOOSE.prototype.argumentsMin = 2;
	cCHOOSE.prototype.argumentsMax = 30;
	cCHOOSE.prototype.Calculate = function (arg) {
		var arg0 = arg[0];

		if (cElementType.cellsRange === arg0.type || cElementType.cellsRange3D === arg0.type) {
			arg0 = arg0.cross(arguments[1]);
		}
		arg0 = arg0.tocNumber();

		if (cElementType.error === arg0.type) {
			return arg0;
		}

		if (cElementType.number === arg0.type) {
			if (arg0.getValue() < 1 || arg0.getValue() > arg.length - 1) {
				return new cError(cErrorType.wrong_value_type);
			}

			return arg[Math.floor(arg0.getValue())];
		}

		return new cError(cErrorType.wrong_value_type);
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cCOLUMN() {
	}

	//***array-formula***
	cCOLUMN.prototype = Object.create(cBaseFunction.prototype);
	cCOLUMN.prototype.constructor = cCOLUMN;
	cCOLUMN.prototype.name = 'COLUMN';
	cCOLUMN.prototype.argumentsMax = 1;
	cCOLUMN.prototype.returnValueType = AscCommonExcel.cReturnFormulaType.area_to_ref;
	cCOLUMN.prototype.Calculate = function (arg) {
		var bbox;
		if (0 === arg.length) {
			bbox = arguments[1];
		} else {
			var arg0 = arg[0];
			if (cElementType.cell === arg0.type || cElementType.cell3D === arg0.type ||
				cElementType.cellsRange === arg0.type || cElementType.cellsRange3D === arg0.type) {
				bbox = arg0.getRange();
				bbox = bbox && bbox.bbox;
			}
		}
		return (bbox ? new cNumber(bbox.c1 + 1) : new cError(cErrorType.bad_reference));
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cCOLUMNS() {
	}

	//***array-formula***
	cCOLUMNS.prototype = Object.create(cBaseFunction.prototype);
	cCOLUMNS.prototype.constructor = cCOLUMNS;
	cCOLUMNS.prototype.name = 'COLUMNS';
	cCOLUMNS.prototype.argumentsMin = 1;
	cCOLUMNS.prototype.argumentsMax = 1;
	cCOLUMNS.prototype.arrayIndexes = {0: 1};
	cCOLUMNS.prototype.Calculate = function (arg) {
		var arg0 = arg[0];
		var range;
		if (cElementType.array === arg0.type) {
			return new cNumber(arg0.getCountElementInRow());
		} else if (cElementType.cellsRange === arg0.type || cElementType.cell === arg0.type ||
			cElementType.cell3D === arg0.type || cElementType.cellsRange3D === arg0.type) {
			range = arg0.getRange();
		}
		return (range ? new cNumber(Math.abs(range.getBBox0().c1 - range.getBBox0().c2) + 1) :
			new cError(cErrorType.wrong_value_type));
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cFORMULATEXT() {
	}

	//***array-formula***
	cFORMULATEXT.prototype = Object.create(cBaseFunction.prototype);
	cFORMULATEXT.prototype.constructor = cFORMULATEXT;
	cFORMULATEXT.prototype.name = 'FORMULATEXT';
	cFORMULATEXT.prototype.argumentsMin = 1;
	cFORMULATEXT.prototype.argumentsMax = 1;
	cFORMULATEXT.prototype.isXLFN = true;
	cFORMULATEXT.prototype.returnValueType = AscCommonExcel.cReturnFormulaType.area_to_ref;
	cFORMULATEXT.prototype.Calculate = function (arg) {

		var arg0 = arg[0];
		if (cElementType.error === arg0.type) {
			return arg0;
		}

		var res = null;
		if (cElementType.cell === arg0.type || cElementType.cell3D === arg0.type ||
			cElementType.cellsRange === arg0.type || cElementType.cellsRange3D === arg0.type) {
			var bbox = arg0.getRange();
			var formula = bbox.getFormula();
			if ("" === formula) {
				return new cError(cErrorType.not_available);
			} else {
				res = new cString("=" + formula);
			}
		}

		return (null !== res ? res : new cError(cErrorType.wrong_value_type));
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cGETPIVOTDATA() {
	}

	cGETPIVOTDATA.prototype = Object.create(cBaseFunction.prototype);
	cGETPIVOTDATA.prototype.constructor = cGETPIVOTDATA;
	cGETPIVOTDATA.prototype.name = 'GETPIVOTDATA';

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cHLOOKUP() {
	}

	//***array-formula***
	cHLOOKUP.prototype = Object.create(cBaseFunction.prototype);
	cHLOOKUP.prototype.constructor = cHLOOKUP;
	cHLOOKUP.prototype.name = 'HLOOKUP';
	cHLOOKUP.prototype.argumentsMin = 3;
	cHLOOKUP.prototype.argumentsMax = 4;
	cHLOOKUP.prototype.arrayIndexes = {1: 1, 2: 1};
	cHLOOKUP.prototype.Calculate = function (arg) {
		//TODO  с excel есть несоостветствие - в тестовом файле - E11:H13
		if(this.bArrayFormula) {
			//исключение, когда в формуле массива берется из одного аргумента только 1 элемент
			if(cElementType.cellsRange3D === arg[2].type || cElementType.cellsRange === arg[2].type) {
				arg[2] = arg[2].getValue2(0,0);
			} else if(cElementType.array === arg[2].type) {
				arg[2] = arg[2].getValue2(0,0);
			}
		}
		return g_oHLOOKUPCache.calculate(arg, arguments[1]);
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cHYPERLINK() {
	}

	cHYPERLINK.prototype = Object.create(cBaseFunction.prototype);
	cHYPERLINK.prototype.constructor = cHYPERLINK;
	cHYPERLINK.prototype.name = 'HYPERLINK';
	cHYPERLINK.prototype.argumentsMin = 1;
	cHYPERLINK.prototype.argumentsMax = 2;
	cHYPERLINK.prototype.Calculate = function (arg) {
		var arg0 = arg[0], arg1 = arg.length === 1 ? null : arg[1];

		if (arg0 instanceof cArea || arg0 instanceof cArea3D) {
			arg0 = arg0.cross(arguments[1]);
		} else if (arg0 instanceof cArray) {
			arg0 = arg0.getElementRowCol(0, 0);
		}
		arg0 = arg0.tocString();


		if(arg1) {
			if (arg1 instanceof cArea || arg1 instanceof cArea3D) {
				arg1 = arg1.cross(arguments[1]);
			} else if (arg1 instanceof cArray) {
				arg1 = arg1.getElementRowCol(0, 0);
			}

			if(arg1 instanceof cRef || arg1 instanceof cRef3D) {
				arg1 = arg1.getValue();
			}
			if(arg1 instanceof cEmpty) {
				arg1 = new cNumber(0);
			}
		} else {
			arg1 = arg0.tocString();
		}

		if (arg0 instanceof cError) {
			arg0.hyperlink = "";
			return arg0;
		}
		if (arg1 instanceof cError) {
			arg1.hyperlink = "";
			return arg1;
		}

		var res = arg1;
		res.hyperlink = arg0.getValue();

		return res;
	};


	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cINDEX() {
	}

	//***array-formula***
	cINDEX.prototype = Object.create(cBaseFunction.prototype);
	cINDEX.prototype.constructor = cINDEX;
	cINDEX.prototype.name = 'INDEX';
	cINDEX.prototype.argumentsMin = 2;
	cINDEX.prototype.argumentsMax = 4;
	cINDEX.prototype.numFormat = AscCommonExcel.cNumFormatNone;
	cINDEX.prototype.arrayIndexes = {0: 1};
	cINDEX.prototype.Calculate = function (arg) {
		var arg0 = arg[0], arg1 = arg[1] && (cElementType.empty !== arg[1].type) ? arg[1] : new cNumber(1),
			arg2 = arg[2] && (cElementType.empty !== arg[2].type) ? arg[2] : new cNumber(1),
			arg3 = arg[3] && (cElementType.empty !== arg[3].type) ? arg[3] : new cNumber(1), res;

		if (cElementType.cellsRange3D === arg0.type) {
			arg0 = arg0.tocArea();
			if (!arg0) {
				return new cError(cErrorType.not_available);
			}
		} else if (cElementType.error === arg0.type) {
			return arg0;
		}

		arg1 = arg1.tocNumber();
		arg2 = arg2.tocNumber();
		arg3 = arg3.tocNumber();

		if (cElementType.error === arg1.type || cElementType.error === arg2.type || cElementType.error === arg3.type) {
			return new cError(cErrorType.wrong_value_type);
		}

		if(arg[3] && cElementType.empty !== arg[3].type && arg3 > 1) {
			return new cError(cErrorType.bad_reference);
		}

		arg1 = arg1.getValue();
		arg2 = arg2.getValue();

		if (arg1 < 0 || arg2 < 0) {
			return new cError(cErrorType.wrong_value_type);
		}

		AscCommonExcel.executeInR1C1Mode(false, function () {
			if (cElementType.array === arg0.type) {
				if(undefined === arg[2] && 1 === arg0.rowCount) {//если последний аргумент опущен, и выделенa 1 строка
					res = arg0.getValue2(0, (0 === arg1) ? 0 : arg1 - 1);
				} else if(undefined === arg[2] && 1 === arg0.getCountElementInRow()) {//если последний аргумент опущен, и выделен 1 столбец
					res = arg0.getValue2((0 === arg1) ? 0 : arg1 - 1, 0);
				} else {
					res = arg0.getValue2((1 === arg0.rowCount || 0 === arg1) ? 0 : arg1 - 1, 0 === arg2 ? 0 : arg2 - 1);
				}
			} else if (cElementType.cellsRange === arg0.type) {
				var ws = arg0.getWS(), bbox = arg0.getBBox0();

				if(cElementType.empty === arg[1].type) {
					arg1 = 0;
				}

				var diffArg1 = arg1 === 0 ? 0 : 1;
				var diffArg2 = arg2 === 0 ? 0 : 1;
				if(undefined === arg[2] && bbox.r1 === bbox.r2) {//если последний аргумент опущен, и выделенa 1 строка
					if (arg1 > Math.abs(bbox.c1 - bbox.c2) + 1) {
						res = new cError(cErrorType.bad_reference);
					} else {
						res = new Asc.Range(bbox.c1 + arg1 - diffArg1, bbox.r1, bbox.c1 + arg1 - diffArg1, bbox.r1);
						res = new cRef(res.getName(), ws);
					}
				} else if(undefined === arg[2] && bbox.c1 === bbox.c2 && arg1 > 0) {//если последний аргумент опущен, и выделен 1 столбец
					if (arg1 > Math.abs(bbox.r1 - bbox.r2) + 1) {
						res = new cError(cErrorType.bad_reference);
					} else {
						res = new Asc.Range(bbox.c1, bbox.r1 + arg1 - diffArg1, bbox.c1, bbox.r1 + arg1 - diffArg1);
						res = new cRef(res.getName(), ws);
					}
				} else if(undefined === arg[2] && Math.abs(bbox.r1 - bbox.r2) + 1 > 1 && Math.abs(bbox.c1 - bbox.c2) + 1 > 1) {//если последний аргумент опущен, и выделен более 1 строки и более 1 столбца
					//так себя ведёт excel в случае с cellsArea
					res = new cError(cErrorType.bad_reference);
				} else if (bbox.r1 === bbox.r2) {/*одна строка*/
					res = new Asc.Range(bbox.c1 + arg2 - 1, bbox.r1, bbox.c1 + arg2 - 1, bbox.r1);
					res = new cRef(res.getName(), ws);
				} else {
					if (0 === arg1 && arg2 > 0) {
						if (arg2 > Math.abs(bbox.c1 - bbox.c2) + 1) {
							res = new cError(cErrorType.bad_reference);
						} else {
							res = new Asc.Range(bbox.c1 + arg2 - 1, bbox.r1, bbox.c1 + arg2 - 1, bbox.r2);
							res = new cArea(res.getName(), ws);
						}
					} else {
						if (arg1 > Math.abs(bbox.r1 - bbox.r2) + 1 || arg2 > Math.abs(bbox.c1 - bbox.c2) + 1) {
							res = new cError(cErrorType.bad_reference);
						} else {
							res = new Asc.Range(bbox.c1 + arg2 - diffArg2, bbox.r1 + arg1 - diffArg1, bbox.c1 + arg2 - diffArg2, bbox.r1 + arg1 - diffArg1);
							res = new cRef(res.getName(), ws);
						}
					}
				}
			} else if (cElementType.cell === arg0.type || cElementType.cell3D === arg0.type) {
				if ((0 === arg1 || 1 === arg1) && (0 === arg2 || 1 === arg2)) {
					res = arg0.getValue();
				}
			} else {
				res = new cError(cErrorType.wrong_value_type);
			}
		});

		return res ? res : new cError(cErrorType.bad_reference);
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cINDIRECT() {
	}

	//TODO есть разница с MS - в тестовом файле E6
	//***array-formula***
	cINDIRECT.prototype = Object.create(cBaseFunction.prototype);
	cINDIRECT.prototype.constructor = cINDIRECT;
	cINDIRECT.prototype.name = 'INDIRECT';
	cINDIRECT.prototype.argumentsMin = 1;
	cINDIRECT.prototype.argumentsMax = 2;
	cINDIRECT.prototype.ca = true;
	cINDIRECT.prototype.Calculate = function (arg) {
		var t = this, arg0 = arg[0].tocString(), arg1 = arg[1] ? arg[1] : new cBool(true), ws = arguments[3],
			wb = ws.workbook, o = {
				Formula: "", pCurrPos: 0
			}, ref, found_operand, ret;

		var _getWorksheetByName = function(name){
			if(!name) {
				return null;
			}
			for(var i = 0; i < wb.aWorksheets.length; i++)
				if(wb.aWorksheets[i].getName().toLowerCase() == name.toLowerCase()){
					return wb.aWorksheets[i];
				}
			return null;
		};

		function parseReference() {
			if ((ref = parserHelp.is3DRef.call(o, o.Formula, o.pCurrPos, true))[0]) {
				var wsFrom = _getWorksheetByName(ref[1]);
				var wsTo = (null !== ref[2]) ? _getWorksheetByName(ref[2]) : wsFrom;
				if (!(wsFrom && wsTo)) {
					return new cError(cErrorType.bad_reference);
				}
				if (parserHelp.isArea.call(o, o.Formula, o.pCurrPos)) {
					found_operand = new cArea3D(o.real_str ? o.real_str.toUpperCase() : o.operand_str.toUpperCase(), wsFrom, wsTo);
				} else if (parserHelp.isRef.call(o, o.Formula, o.pCurrPos)) {
					if (wsTo !== wsFrom) {
						found_operand = new cArea3D(o.real_str ? o.real_str.toUpperCase() : o.operand_str.toUpperCase(), wsFrom, wsTo);
					} else {
						found_operand = new cRef3D(o.real_str ? o.real_str.toUpperCase() : o.operand_str.toUpperCase(), wsFrom);
					}
				}
			} else if (parserHelp.isArea.call(o, o.Formula, o.pCurrPos)) {
				found_operand = new cArea(o.real_str ? o.real_str.toUpperCase() : o.operand_str.toUpperCase(), ws);
			} else if (parserHelp.isRef.call(o, o.Formula, o.pCurrPos, true)) {
				found_operand = new cRef(o.real_str ? o.real_str.toUpperCase() : o.operand_str.toUpperCase(), ws);
			} else if (parserHelp.isName.call(o, o.Formula, o.pCurrPos, wb)[0]) {
				found_operand = new AscCommonExcel.cName(o.operand_str, ws);
			}
		}

		if (cElementType.array === arg0.type) {
			ret = new cArray();
			arg0.foreach(function (elem, r) {
				o = {Formula: elem.toString(), pCurrPos: 0};
				AscCommonExcel.executeInR1C1Mode(!!(arg1 && arg1.value === false), parseReference);
				if (!ret.array[r]) {
					ret.addRow();
				}
				ret.addElement(found_operand)
			});
			return ret;
		} else {
			o.Formula = arg0.toString();
			AscCommonExcel.executeInR1C1Mode(!!(arg1 && arg1.value === false), parseReference);
			if (found_operand) {
				if (cElementType.name === found_operand.type) {
					found_operand = found_operand.toRef(arguments[1]);
				}

				ret = found_operand;
			} else {
				ret = new cError(cErrorType.bad_reference);
			}
		}

		return ret;

	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cLOOKUP() {
	}

	//***array-formula***
	cLOOKUP.prototype = Object.create(cBaseFunction.prototype);
	cLOOKUP.prototype.constructor = cLOOKUP;
	cLOOKUP.prototype.name = 'LOOKUP';
	cLOOKUP.prototype.argumentsMin = 2;
	cLOOKUP.prototype.argumentsMax = 3;
	cLOOKUP.prototype.arrayIndexes = {1: 1, 2: 1};
	cLOOKUP.prototype.Calculate = function (arg) {
		var arg0 = arg[0], arg1 = arg[1], arg2 = 2 === arg.length ? arg1 : arg[2], resC = -1, resR = -1,
			t = this, res;

		if (cElementType.error === arg0.type) {
			return arg0;
		}
		if (cElementType.cell === arg0.type) {
			arg0 = arg0.getValue();
		}

		function arrFinder(arr) {
			if (arr.getRowCount() > arr.getCountElementInRow()) {
				//ищем в первом столбце
				resC = arr.getCountElementInRow() > 1 ? 1 : 0;
				var arrCol = arr.getCol(0);
				resR = _func.binarySearch(arg0, arrCol);
			} else {
				//ищем в первой строке
				resR = arr.getRowCount() > 1 ? 1 : 0;
				var arrRow = arr.getRow(0);
				resC = _func.binarySearch(arg0, arrRow);
			}
		}

		if (!( (cElementType.cellsRange === arg1.type || cElementType.cellsRange3D === arg1.type ||
				cElementType.array === arg1.type) &&
				(cElementType.cellsRange === arg2.type || cElementType.cellsRange3D === arg2.type ||
					cElementType.array === arg2.type) )) {
			return new cError(cErrorType.not_available);
		}

		if (cElementType.array === arg1.type && cElementType.array === arg2.type) {
			if (arg1.getRowCount() !== arg2.getRowCount() &&
				arg1.getCountElementInRow() !== arg2.getCountElementInRow()) {
				return new cError(cErrorType.not_available);
			}

			arrFinder(arg1);

			if (resR <= -1 && resC <= -1 || resR <= -2 || resC <= -2) {
				return new cError(cErrorType.not_available);
			}

			return arg2.getElementRowCol(resR, resC);

		} else if (cElementType.array === arg1.type || cElementType.array === arg2.type) {

			var _arg1, _arg2;

			_arg1 = cElementType.array === arg1.type ? arg1 : arg2;

			_arg2 = cElementType.array === arg2.type ? arg1 : arg2;

			var BBox = _arg2.getBBox0();

			if (_arg1.getRowCount() !== (BBox.r2 - BBox.r1) && _arg1.getCountElementInRow() !== (BBox.c2 - BBox.c1)) {
				return new cError(cErrorType.not_available);
			}

			arrFinder(_arg1);

			if (resR <= -1 && resC <= -1 || resR <= -2 || resC <= -2) {
				return new cError(cErrorType.not_available);
			}

			var c = new CellAddress(BBox.r1 + resR, BBox.c1 + resC, 0);
			_arg2.getWS()._getCellNoEmpty(c.getRow0(), c.getCol0(), function (cell) {
				res = checkTypeCell(cell);
			});
			return res;
		} else {
			if (cElementType.cellsRange3D === arg1.type && !arg1.isSingleSheet() ||
				cElementType.cellsRange3D === arg2.type && !arg2.isSingleSheet()) {
				return new cError(cErrorType.not_available);
			}

			//todo test and delete!
			if(false) {
				/*var arg1Range, arg2RowsLength;

				if (cElementType.cellsRange3D === arg1.type) {
					arg1Range = arg1.getMatrix()[0];
				} else if (cElementType.cellsRange === arg1.type) {
					arg1Range = arg1.getMatrix();
				}

				if (cElementType.cellsRange3D === arg2.type) {
					arg2RowsLength = arg2.bbox.r2 - arg2.bbox.r1 + 1;
					//arg2Range = arg2.getMatrix()[0];
				} else if (cElementType.cellsRange === arg2.type) {
					arg2RowsLength = arg2.range.bbox.r2 - arg2.range.bbox.r1 + 1;
					//arg2Range = arg2.getMatrix();
				}

				var bVertical = arg1Range[0].length >= arg1Range.length;//r>=c
				var index;
				var tempArr = [], i;
				if(bVertical) {
					for (i = 0; i < arg1Range[0].length; i++) {
						tempArr.push(arg1Range[0][i]);
					}
				} else {
					for (i = 0; i < arg1Range.length; i++) {
						tempArr.push(arg1Range[i][0]);
					}
				}

				if(tempArr[tempArr.length - 1] && tempArr[tempArr.length - 1].value < arg0.value) {
					//в этом случае фукнция бинарного поиска одаст последний элемент. для конкретного случая это неверно
					//Если функции не удается найти искомое_значение, то в просматриваемом_векторе выбирается наибольшее значение, которое меньше искомого_значения или равно ему.
					var diff = null;
					var endNumber;
					for(i = 0; i < tempArr.length; i++) {
						if(cElementType.number === tempArr[i].type) {
							if(tempArr[i].value <= arg0.value && (null === diff || diff > (arg0.value - tempArr[i].value))) {
								index = i;
								diff = arg0.value - tempArr[i].value;
							}
							endNumber = i;
						}
					}
					if(undefined === index) {
						if(undefined !== endNumber) {
							index = endNumber;
						}
					}
				}
				if(index === undefined) {
					index = _func.binarySearch(arg0, tempArr);

					if (index < 0) {
						return new cError(cErrorType.not_available);
					}
				}*/
			} else {
				var arg2RowsLength;
				var bbox;
				if (cElementType.cellsRange3D === arg1.type) {
					bbox = arg1.bbox;
				} else if (cElementType.cellsRange === arg1.type) {
					bbox = arg1.range.bbox;
				}

				if (cElementType.cellsRange3D === arg2.type) {
					arg2RowsLength = arg2.bbox.r2 - arg2.bbox.r1 + 1;
				} else if (cElementType.cellsRange === arg2.type) {
					arg2RowsLength = arg2.range.bbox.r2 - arg2.range.bbox.r1 + 1;
				}


				var bVertical = bbox.r2 - bbox.r1 >= bbox.c2 - bbox.c1;
				var index;

				var _getValue = function(n) {
					var r, c;
					if(bVertical) {
						r = n;
						c = 0;
					} else {
						r = 0;
						c = n;
					}
					var res = arg1.getValueByRowCol(r, c);
					return res ? res : new cEmpty();
				};

				var length = bVertical ? bbox.r2 - bbox.r1 : bbox.c2 - bbox.c1;
				var lastValue = _getValue(length);
				if(lastValue && lastValue.value < arg0.value) {
					//в этом случае фукнция бинарного поиска одаст последний элемент. для конкретного случая это неверно
					//Если функции не удается найти искомое_значение, то в просматриваемом_векторе выбирается наибольшее значение, которое меньше искомого_значения или равно ему.
					var diff = null;
					var endNumber;
					for(var i = 0; i <= length; i++) {
						var tempValue = _getValue(i);
						if(cElementType.number === tempValue.type) {
							if(tempValue.value <= arg0.value && (null === diff || diff > (arg0.value - tempValue.value))) {
								index = i;
								diff = arg0.value - tempValue.value;
							}
							endNumber = i;
						}
					}
					if(undefined === index) {
						if(undefined !== endNumber) {
							index = endNumber;
						}
					}
				}
				if(index === undefined) {
					index = _func.binarySearchByRange(arg0, arg1);

					if (index < 0) {
						return new cError(cErrorType.not_available);
					}
				}
			} /*else {
				var arg2RowsLength;

				if (cElementType.cellsRange3D === arg2.type) {
					arg2RowsLength = arg2.bbox.r2 - arg2.bbox.r1 + 1;
				} else if (cElementType.cellsRange === arg2.type) {
					arg2RowsLength = arg2.range.bbox.r2 - arg2.range.bbox.r1 + 1;
				}

				index = g_oLOOKUPCache.calculate(arg);

				if (index < 0) {
					return new cError(cErrorType.not_available);
				}
			}*/


			var ws = cElementType.cellsRange3D === arg1.type && arg1.isSingleSheet() ? arg1.getWS() : arg1.ws;

			if (cElementType.cellsRange3D === arg1.type) {
				if (arg1.isSingleSheet()) {
					ws = arg1.getWS();
				} else {
					return new cError(cErrorType.bad_reference);
				}
			} else if (cElementType.cellsRange === arg1.type) {
				ws = arg1.getWS();
			} else {
				return new cError(cErrorType.bad_reference);
			}

			AscCommonExcel.executeInR1C1Mode(false, function () {
				var b = arg2.getBBox0();
				if (2 === arg.length) {
					if (bVertical) {
						res = new cRef(ws.getCell3(b.r1 + 0, b.c1 + index).getName(), ws);
					} else {
						res = new cRef(ws.getCell3(b.r1 + index, b.c1 + 0).getName(), ws);
					}
				} else {
					if (1 === arg2RowsLength) {
						res = new cRef(ws.getCell3(b.r1 + 0, b.c1 + index).getName(), ws);
					} else {
						res = new cRef(ws.getCell3(b.r1 + index, b.c1 + 0).getName(), ws);
					}
				}
			});
			return res;
		}
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cMATCH() {
	}

	//***array-formula***
	cMATCH.prototype = Object.create(cBaseFunction.prototype);
	cMATCH.prototype.constructor = cMATCH;
	cMATCH.prototype.name = 'MATCH';
	cMATCH.prototype.argumentsMin = 2;
	cMATCH.prototype.argumentsMax = 3;
	cMATCH.prototype.arrayIndexes = {1: 1};
	cMATCH.prototype.Calculate = function (arg) {
		var arg0 = arg[0], arg1 = arg[1], arg2 = arg[2] ? arg[2] : new cNumber(1);

		/*function findMatch(a0, a1, a2) {
			var i, item, a1RowCount = a1.length, a1ColumnCount = a1[0].length, a2Value = a2.getValue(), arr, index = -1;
			var a0Type = a0.type;
			var a0Value = a0.getValue();
			if (!(cElementType.number === a0Type || cElementType.string === a0Type || cElementType.bool === a0Type ||
					cElementType.error === a0Type || cElementType.empty === a0Type)) {
				if(cElementType.empty === a0Value.type) {
					a0Value = a0Value.tocNumber();
				}

				a0Type = a0Value.type;
				a0Value = a0Value.getValue();
			}

			if (a1RowCount > 1 && a1ColumnCount > 1) {
				return new cError(cErrorType.not_available);
			} else if (a1RowCount === 1 && a1ColumnCount >= 1) {
				arr = a1[0];
			} else {
				arr = [];
				for (i = 0; i < a1RowCount; i++) {
					arr[i] = a1[i][0];
				}
			}

			if (!(-1 === a2Value || 0 === a2Value || 1 === a2Value)) {
				return new cError(cErrorType.not_numeric);
			}

			for (i = 0; i < arr.length; ++i) {
				item = arr[i];
				if (arr[i].type === a0Type) {
					if (0 === a2Value) {
						if (cElementType.string === a0Type) {
							if (AscCommonExcel.searchRegExp2(item.toString(), a0Value)) {
								index = i;
								break;
							}
						} else {
							if (item == a0Value) {
								index = i;
								break;
							}
						}
					} else if (1 === a2Value) {
						if (item <= a0Value) {
							index = i;
						} else {
							break;
						}
					} else if (-1 === a2Value) {
						if (item >= a0Value) {
							index = i;
						} else {
							break;
						}
					}
				}
			}

			return (-1 < index) ? new cNumber(index + 1) : new cError(cErrorType.not_available);

		}

		if (cElementType.cellsRange3D === arg0.type || cElementType.array === arg0.type ||
			cElementType.cellsRange === arg0.type) {
			return new cError(cErrorType.wrong_value_type);
		} else if (cElementType.error === arg0.type) {
			return arg0;
		}

		if (cElementType.array === arg1.type || cElementType.cellsRange === arg1.type) {
			arg1 = arg1.getMatrix();
		} else if (cElementType.cellsRange3D === arg1.type && arg1.isSingleSheet()) {
			arg1 = arg1.getMatrix()[0];
		} else if (cElementType.cell === arg1.type || cElementType.cell3D === arg1.type) {
			arg1 = arg1.getMatrix();
		} else {
			return new cError(cErrorType.not_available);
		}

		if (cElementType.number === arg2.type || cElementType.bool === arg2.type) {
		} else if (cElementType.error === arg2.type) {
			return arg2;
		} else {
			return new cError(cErrorType.not_available);
		}

		return findMatch(arg0, arg1, arg2);*/

		return g_oMatchCache.calculate(arg);
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	/*function cMATCH() {
	}

	cMATCH.prototype = Object.create(cBaseFunction.prototype);
	cMATCH.prototype.constructor = cMATCH;
	cMATCH.prototype.name = 'MATCH';
	cMATCH.prototype.argumentsMin = 2;
	cMATCH.prototype.argumentsMax = 3;
	cMATCH.prototype.Calculate = function (arg) {
		var arg0 = arg[0], arg1 = arg[1], arg2 = arg[2] ? arg[2] : new cNumber(1);

		function findMatch(a0, a1, a2) {
			var i, item, a1RowCount = a1.length, a1ColumnCount = a1[0].length, a2Value = a2.getValue(), arr, index = -1;
			var a0Type = a0.type;
			var a0Value = a0.getValue();
			if (!(cElementType.number === a0Type || cElementType.string === a0Type || cElementType.bool === a0Type ||
					cElementType.error === a0Type || cElementType.empty === a0Type)) {
				a0Type = a0Value.type;
				a0Value = a0Value.getValue();
			}

			if (a1RowCount > 1 && a1ColumnCount > 1) {
				return new cError(cErrorType.not_available);
			} else if (a1RowCount === 1 && a1ColumnCount >= 1) {
				arr = a1[0];
			} else {
				arr = [];
				for (i = 0; i < a1RowCount; i++) {
					arr[i] = a1[i][0];
				}
			}

			if (!(-1 === a2Value || 0 === a2Value || 1 === a2Value)) {
				return new cError(cErrorType.not_numeric);
			}

			for (i = 0; i < arr.length; ++i) {
				item = arr[i];
				if (arr[i].type === a0Type) {
					if (0 === a2Value) {
						if (cElementType.string === a0Type) {
							if (AscCommonExcel.searchRegExp2(item.toString(), a0Value)) {
								index = i;
								break;
							}
						} else {
							if (item == a0Value) {
								index = i;
								break;
							}
						}
					} else if (1 === a2Value) {
						if (item <= a0Value) {
							index = i;
						} else {
							break;
						}
					} else if (-1 === a2Value) {
						if (item >= a0Value) {
							index = i;
						} else {
							break;
						}
					}
				}
			}

			return (-1 < index) ? new cNumber(index + 1) : new cError(cErrorType.not_available);

		}

		//TODO пока добавлена функция для отдельной обработки, если второй аргумент - area/area3d, третий - 0
		function findMatchStrict(a0, a1, a2) {
			var i, item, a2Value = a2.getValue(), arr, index = -1;

			var a0Type = a0.type;
			var a0Value = a0.getValue();
			if (!(cElementType.number === a0Type || cElementType.string === a0Type || cElementType.bool === a0Type ||
				cElementType.error === a0Type || cElementType.empty === a0Type)) {
				a0Type = a0Value.type;
				a0Value = a0Value.getValue();
			}


			var a1RowCount, a1ColumnCount, ws;
			if(cElementType.cellsRange === arg1.type) {
				a1RowCount = arg1.bbox.r2 - arg1.bbox.r1;
				a1ColumnCount = arg1.bbox.c2 - arg1.bbox.c1;
				ws = arg1.ws;
			} else if (cElementType.cellsRange3D === arg1.type && arg1.isSingleSheet()) {
				a1RowCount = arg1.bbox.r2 - arg1.bbox.r1;
				a1ColumnCount = arg1.bbox.c2 - arg1.bbox.c1;
				ws = arg1.wsTo;
			}

			var oSearchRange;
			var byRow = false;
			if (a1RowCount > 1 && a1ColumnCount > 1) {
				return new cError(cErrorType.not_available);
			} else if (a1RowCount === 1 && a1ColumnCount >= 1) {
				oSearchRange = ws.getRange3(arg1.bbox.r1, arg1.bbox.c1, arg1.bbox.r1, arg1.bbox.c2);
				byRow = true;
			} else {
				oSearchRange = ws.getRange3(arg1.bbox.r1, arg1.bbox.c1, arg1.bbox.r2, arg1.bbox.c1);
			}

			oSearchRange._foreachNoEmpty(function(cell) {
				if (cell.type === a0Type) {
					var item = cell.getValue();
					if (0 === a2Value) {
						if (cElementType.string === a0Type) {
							if (AscCommonExcel.searchRegExp2(item.toString(), a0Value)) {
								index = byRow ? cell.nCol : cell.nRow;
								return true;
							}
						} else {
							if (item == a0Value) {
								index = byRow ? cell.nCol : cell.nRow;
								return true;
							}
						}
					}
				}
			});

			return (-1 < index) ? new cNumber(index + 1) : new cError(cErrorType.not_available);
		}

		if (cElementType.cellsRange3D === arg0.type || cElementType.array === arg0.type ||
			cElementType.cellsRange === arg0.type) {
			return new cError(cErrorType.wrong_value_type);
		} else if (cElementType.error === arg0.type) {
			return arg0;
		}

		if (cElementType.number === arg2.type || cElementType.bool === arg2.type) {
		} else if (cElementType.error === arg2.type) {
			return arg2;
		} else {
			return new cError(cErrorType.not_available);
		}

		var isNull2Arg = 0 === arg2.getValue();
		if(cElementType.array === arg1.type) {
			arg1 = arg1.getMatrix();
			isNull2Arg = false;
		} else if (cElementType.cellsRange === arg1.type) {
			arg1 = !isNull2Arg ? arg1.getMatrix() : arg1;
		} else if (cElementType.cellsRange3D === arg1.type && arg1.isSingleSheet()) {
			arg1 = !isNull2Arg ? arg1.getMatrix()[0] : arg1;
		} else if (cElementType.cell === arg1.type || cElementType.cell3D === arg1.type) {
			arg1 = arg1.getMatrix();
			isNull2Arg = false;
		} else {
			return new cError(cErrorType.not_available);
		}

		return isNull2Arg ? findMatchStrict(arg0, arg1, arg2) : findMatch(arg0, arg1, arg2);

	};*/

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	/*function cMATCH() {
	}

	cMATCH.prototype = Object.create(cBaseFunction.prototype);
	cMATCH.prototype.constructor = cMATCH;
	cMATCH.prototype.name = 'MATCH';
	cMATCH.prototype.argumentsMin = 2;
	cMATCH.prototype.argumentsMax = 3;
	cMATCH.prototype.Calculate = function (arg) {
		var arg0 = arg[0], arg1 = arg[1], arg2 = arg[2] ? arg[2] : new cNumber(1);

		return new cError(cErrorType.not_available);

		var bArray = false, array, a1RowCount, a1ColumnCount;

		function search(a0, a1, a2) {
			var i, item, a2Value = a2.getValue(), arr, index = -1;
			var a0Type = a0.type;
			var a0Value = a0.getValue();
			if (!(cElementType.number === a0Type || cElementType.string === a0Type || cElementType.bool === a0Type ||
				cElementType.error === a0Type || cElementType.empty === a0Type)) {
				a0Type = a0Value.type;
				a0Value = a0Value.getValue();
			}

			if (a1RowCount > 1 && a1ColumnCount > 1) {
				return new cError(cErrorType.not_available);
			} else if (a1RowCount === 1 && a1ColumnCount >= 1) {
				arr = a1[0];
			} else {
				arr = [];
				for (i = 0; i < a1.length; i++) {
					if(a1[i]) {
						arr[i] = a1[i][0];
					}
				}
			}

			if (!(-1 === a2Value || 0 === a2Value || 1 === a2Value)) {
				return new cError(cErrorType.not_numeric);
			}

			for (i = 0; i < arr.length; ++i) {
				item = arr[i];
				if (arr[i] && arr[i].type === a0Type) {
					if (0 === a2Value) {
						if (cElementType.string === a0Type) {
							if (AscCommonExcel.searchRegExp2(item.toString(), a0Value)) {
								index = i;
								break;
							}
						} else {
							if (item == a0Value) {
								index = i;
								break;
							}
						}
					} else if (1 === a2Value) {
						if (item <= a0Value) {
							index = i;
						} else {
							break;
						}
					} else if (-1 === a2Value) {
						if (item >= a0Value) {
							index = i;
						} else {
							break;
						}
					}
				}
			}

			return (-1 < index) ? new cNumber(index + 1) : new cError(cErrorType.not_available);

		}

		var binarySearch = function (val, type, a2Value) {

			var getArrayValue = function(n) {
				var res;
				if(bArray) {
					res = a1ColumnCount === 1 ? array[0][n] : array[n][0];
				} else {
					if(a1ColumnCount === 1) {
						res = array.worksheet.getCell3(n + array.bbox.r1, array.bbox.c1).getValue();
					} else {
						res = array.worksheet.getCell3(array.bbox.r1, n + array.bbox.c1).getValue();
					}
				}
				if (!isNaN(parseFloat(res))) {
					res = parseFloat(res);
				}
				return res;
			};

			var j = a1ColumnCount;
			if(a1ColumnCount === 1) {
				j = a1RowCount;
			}
			var i = 0, k, item;
			if (1 === a2Value) {
				while (i < j) {
					k = Math.floor((i + j) / 2);

					item = getArrayValue(k);
					if(item === "") {
						i = k + 1;
						continue;
					}

					//меньше или равно искомому значению
					if (item <= val) {
						return (-1 < k) ? new cNumber(k + 1) : new cError(cErrorType.not_available);
					} else if ((val < item) ^ 0) {
						j = k;
					} else {
						i = k + 1;
					}
				}
			}

			return new cError(cErrorType.not_available);
		};

		function findMatch(a0, a1, a2) {
			var i, item, a2Value = a2.getValue(), arr, index = -1;

			var a0Type = a0.type;
			var a0Value = a0.getValue();
			if (!(cElementType.number === a0Type || cElementType.string === a0Type || cElementType.bool === a0Type ||
				cElementType.error === a0Type || cElementType.empty === a0Type)) {
				a0Type = a0Value.type;
				a0Value = a0Value.getValue();
			}

			if (!(-1 === a2Value || 0 === a2Value || 1 === a2Value)) {
				return new cError(cErrorType.not_numeric);
			}


			if(-1 === a2Value) {
				if (cElementType.array === a1.type || cElementType.cellsRange === a1.type) {
					a1 = a1.getMatrix();
				} else if (cElementType.cellsRange3D === a1.type && a1.isSingleSheet()) {
					a1 = a1.getMatrix()[0];
				} else if (cElementType.cell === a1.type || cElementType.cell3D === a1.type) {
					a1 = a1.getMatrix();
				} else {
					return new cError(cErrorType.not_available);
				}
				return search(a0, a1, a2);
			} else if(0 === a2Value) {
				if (cElementType.array === a1.type) {
					a1 = a1.getMatrix();
				} else if(cElementType.cellsRange === a1.type) {
					a1 = a1.getMatrixNoEmpty();
				} else if (cElementType.cellsRange3D === a1.type && a1.isSingleSheet()) {
					a1 = a1.getMatrixNoEmpty()[0];
				} else if (cElementType.cell === a1.type || cElementType.cell3D === a1.type) {
					a1 = a1.getMatrix();
				} else {
					return new cError(cErrorType.not_available);
				}
				return search(a0, a1, a2);
			} else {
				return binarySearch(a0Value, a0Type, a2Value);
			}
		}


		if (cElementType.cellsRange3D === arg0.type || cElementType.array === arg0.type ||
			cElementType.cellsRange === arg0.type) {
			return new cError(cErrorType.wrong_value_type);
		} else if (cElementType.error === arg0.type) {
			return arg0;
		}

		if (cElementType.number === arg2.type || cElementType.bool === arg2.type) {
		} else if (cElementType.error === arg2.type) {
			return arg2;
		} else {
			return new cError(cErrorType.not_available);
		}

		if (cElementType.array === arg1.type) {
			array = arg1.array;
			bArray = true;
		} else if(cElementType.cellsRange === arg1.type) {
			array = arg1.range;
		} else if (cElementType.cellsRange3D === arg1.type && arg1.isSingleSheet()) {
			array = arg1.getRanges()[0];
		} else if (cElementType.cell === arg1.type || cElementType.cell3D === arg1.type) {
			array = arg1.range;
		} else {
			return new cError(cErrorType.not_available);
		}

		//TODO ограничить макcимум строк
		a1RowCount = bArray ? array.length : array.bbox.r2 - array.bbox.r1 + 1;
		a1ColumnCount = bArray ? array[0].length : array.bbox.c2 - array.bbox.c1 + 1;

		if (a1RowCount > 1 && a1ColumnCount > 1) {
			return new cError(cErrorType.not_available);
		}

		return findMatch(arg0, arg1, arg2)
	};*/

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cOFFSET() {
	}

	//***array-formula***
	cOFFSET.prototype = Object.create(cBaseFunction.prototype);
	cOFFSET.prototype.constructor = cOFFSET;
	cOFFSET.prototype.name = 'OFFSET';
	cOFFSET.prototype.argumentsMin = 3;
	cOFFSET.prototype.argumentsMax = 5;
	cOFFSET.prototype.ca = true;
	cOFFSET.prototype.Calculate = function (arg) {

		function validBBOX(bbox) {
			return 0 <= bbox.r1 && bbox.r1 <= gc_nMaxRow0 && 0 <= bbox.c1 && bbox.c1 <= gc_nMaxCol0 && 0 <= bbox.r2 &&
				bbox.r2 <= gc_nMaxRow0 && 0 <= bbox.c2 && bbox.c2 <= gc_nMaxCol0;
		}

		var arg0 = arg[0], arg1 = arg[1].tocNumber(), arg2 = arg[2].tocNumber();
		var arg3 = 3 < arg.length ? (cElementType.empty === arg[3].type ? new cNumber(1) : arg[3].tocNumber()) : new cNumber(-1);
		var arg4 = 4 < arg.length ? (cElementType.empty === arg[4].type ? new cNumber(1) : arg[4].tocNumber()) : new cNumber(-1);

		var argError;
		if (argError = this._checkErrorArg([arg0, arg1, arg2, arg3, arg4])) {
			return argError;
		}

		arg1 = arg1.getValue();
		arg2 = arg2.getValue();
		arg3 = arg3.getValue();
		arg4 = arg4.getValue();

		if (arg3 == 0 || arg4 == 0)
		{
			return new cError(cErrorType.bad_reference);
		}

		var res;
		if (cElementType.cell === arg0.type || cElementType.cell3D === arg0.type ||
			cElementType.cellsRange === arg0.type || cElementType.cellsRange3D === arg0.type) {
			var box = arg0.getBBox0();
			if (box) {
				box = box.clone(true);

				//в документации написано, что в отрицательных значений в 4 и 5 аргументах быть не может
				//но на деле ms рассчитывает такие формулы
				//сделал аналогично

				box.c1 = box.c1 + arg2;
				box.r1 = box.r1 + arg1;
				box.c2 = box.c2 + arg2;
				box.r2 = box.r2 + arg1;
				if(cElementType.cell === arg0.type || cElementType.cell3D === arg0.type) {
					if (arg.length > 3) {
						if(arg4 < 0) {
							box.c1 = box.c1 + arg4 + 1;
						} else {
							box.c2 = box.c1 + arg4 - 1;
						}

						if(arg3 < 0) {
							box.r1 = box.r1 + arg3 + 1;
						} else {
							box.r2 = box.r1 + arg3 - 1;
						}
					}
				} else {
					if (arg.length > 3) {
						if(arg4 < 0) {
							box.c1 = box.c1 + arg4 + 1;
							box.c2 = box.c1 - arg4 - 1;
						} else {
							box.c2 = box.c1 + arg4 - 1;
						}

						if(arg3 < 0) {
							box.r1 = box.r1 + arg3 + 1;
							box.r2 = box.r1 - arg3 - 1;
						} else {
							box.r2 = box.r1 + arg3 - 1;
						}
					}
				}

				if (!validBBOX(box)) {
					return new cError(cErrorType.bad_reference);
				}

				var name;
				AscCommonExcel.executeInR1C1Mode(false, function () {
					name = box.getName();
				});
				var ws = arg0.getWS();
				var wsCell = arguments[3];
				if (box.isOneCell()) {
					res = wsCell === ws ? new cRef(name, ws) : new cRef3D(name, ws);
				} else {
					res = wsCell === ws ? new cArea(name, ws) : new cArea3D(name, ws, ws);
				}
			}
		}

		if (!res) {
			res = new cError(cErrorType.wrong_value_type);
		}
		return res;

	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cROW() {
	}

	//***array-formula***
	cROW.prototype = Object.create(cBaseFunction.prototype);
	cROW.prototype.constructor = cROW;
	cROW.prototype.name = 'ROW';
	cROW.prototype.argumentsMax = 1;
	cROW.prototype.returnValueType = AscCommonExcel.cReturnFormulaType.area_to_ref;
	cROW.prototype.Calculate = function (arg) {
		var bbox;
		if (0 === arg.length) {
			bbox = arguments[1];
		} else {
			var arg0 = arg[0];
			if (cElementType.cell === arg0.type || cElementType.cell3D === arg0.type ||
				cElementType.cellsRange === arg0.type || cElementType.cellsRange3D === arg0.type) {
				bbox = arg0.getRange();
				bbox = bbox && bbox.bbox;
			}
		}
		return (bbox ? new cNumber(bbox.r1 + 1) : new cError(cErrorType.bad_reference));
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cROWS() {
	}

	//***array-formula***
	cROWS.prototype = Object.create(cBaseFunction.prototype);
	cROWS.prototype.constructor = cROWS;
	cROWS.prototype.name = 'ROWS';
	cROWS.prototype.argumentsMin = 1;
	cROWS.prototype.argumentsMax = 1;
	cROWS.prototype.arrayIndexes = {0: 1};
	cROWS.prototype.Calculate = function (arg) {
		var arg0 = arg[0];
		var range;
		if (cElementType.array === arg0.type) {
			return new cNumber(arg0.getRowCount());
		} else if (cElementType.cellsRange === arg0.type || cElementType.cell === arg0.type ||
			cElementType.cell3D === arg0.type || cElementType.cellsRange3D === arg0.type) {
			range = arg0.getRange();
		}
		return (range ? new cNumber(Math.abs(range.getBBox0().r1 - range.getBBox0().r2) + 1) :
			new cError(cErrorType.wrong_value_type));
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cRTD() {
	}

	cRTD.prototype = Object.create(cBaseFunction.prototype);
	cRTD.prototype.constructor = cRTD;
	cRTD.prototype.name = 'RTD';

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cTRANSPOSE() {
	}

	//***array-formula***
	cTRANSPOSE.prototype = Object.create(cBaseFunction.prototype);
	cTRANSPOSE.prototype.constructor = cTRANSPOSE;
	cTRANSPOSE.prototype.name = 'TRANSPOSE';
	cTRANSPOSE.prototype.argumentsMin = 1;
	cTRANSPOSE.prototype.argumentsMax = 1;
	cTRANSPOSE.prototype.numFormat = AscCommonExcel.cNumFormatNone;
	cTRANSPOSE.prototype.arrayIndexes = {0: 1};
	cTRANSPOSE.prototype.Calculate = function (arg) {

		function TransposeMatrix(A) {

			var tMatrix = [], res = new cArray();

			for (var i = 0; i < A.length; i++) {
				for (var j = 0; j < A[i].length; j++) {
					if (!tMatrix[j]) {
						tMatrix[j] = [];
					}
					tMatrix[j][i] = A[i][j];
				}
			}

			res.fillFromArray(tMatrix);

			return res;
		}

		var arg0 = arg[0];
		if (cElementType.cellsRange === arg0.type) {
			//TODO возможно стоит на вход функции Calculate в случае применения как формулы массива сразу передавать преобразованный range в array
			if(!this.bArrayFormula) {
				arg0 = arg0.cross(arguments[1]);
			} else {
				arg0 = arg0.getMatrix();
			}
		} else if(cElementType.cellsRange3D === arg0.type) {
			//TODO возможно стоит на вход функции в случае применения как формулы массива сразу передавать преобразованный range в array
			arg0 = arg0.getMatrix()[0];
		} else if(cElementType.array === arg0.type) {
			arg0 = arg0.getMatrix();
		} else if (cElementType.cell === arg0.type || cElementType.cell3D === arg0.type) {
			return arg0.getValue();
		} else if (cElementType.number === arg0.type || cElementType.string === arg0.type ||
			cElementType.bool === arg0.type || cElementType.error === arg0.type) {
			return arg0;
		} else {
			return new cError(cErrorType.not_available);
		}

		if (cElementType.error === arg0.type) {
			return arg0;
		}
		if(0 === arg0.length){
			return new cError(cErrorType.wrong_value_type);
		}

		return TransposeMatrix(arg0);
	};

	/**
	 * @constructor
	 */
	function VHLOOKUPCache(bHor) {
		this.cacheId = {};
		this.cacheRanges = {};
		this.bHor = bHor;
	}

	VHLOOKUPCache.prototype.calculate = function (arg) {
		var arg0 = arg[0], arg1 = arg[1], arg2 = arg[2];
		var arg3 = arg[3] ? arg[3].tocBool().value : true;
		var t = this, number = arg2.getValue() - 1, valueForSearching, r, c, res = -1, min, regexp, count;

		if(cElementType.array === arg2.type) {
			var arg2Val = arg2.getElementRowCol(0,0);
			number = arg2Val ? arg2Val.getValue() - 1 : number;
		}

		if (isNaN(number)) {
			return new cError(cErrorType.bad_reference);
		}
		if (number < 0) {
			return new cError(cErrorType.wrong_value_type);
		}

		if (cElementType.cell3D === arg0.type || cElementType.cell === arg0.type) {
			arg0 = arg0.getValue();
		}

		if (cElementType.error === arg0.type) {
			return arg0;
		}

		var arg0Val;
		if(cElementType.array === arg0.type) {
			arg0Val = arg0.getElementRowCol(0,0);
			valueForSearching = ('' + arg0Val.getValue()).toLowerCase();
		} else {
			arg0Val = arg0;
			valueForSearching = ('' + arg0.getValue()).toLowerCase();
		}

		//TODO hlookup не правильно работает если первый агумент массив - раскомментировать тесты для hlookup
		var found = false;
		if (cElementType.array === arg1.type) {
			// ToDo
			if (cElementType.string === arg0.type) {
				regexp = searchRegExp(valueForSearching);
			}
			arg1.foreach(function (elem, r, c) {
				var v = ('' + elem.getValue()).toLowerCase();
				var i = t.bHor ? c : r;
				if (0 === i) {
					min = v;
				}

				if (arg3) {
					if (valueForSearching === v) {
						res = i;
						found = true;
					} else if (valueForSearching > v && !found) {
						res = i;
					}
				} else {
					if (cElementType.string === arg0.type) {
						if (regexp.test(v)) {
							res = i;
						}
					} else if (valueForSearching === v) {
						res = i;
					}
				}

				min = Math.min(min, v);
			});

			if (/*min > valueForSearching ||*/ -1 === res) {
				return new cError(cErrorType.not_available);
			}

			count = this.bHor ? arg1.getRowCount() : arg1.getCountElementInRow();
			if (number > count - 1) {
				return new cError(cErrorType.bad_reference);
			}

			r = this.bHor ? number : res;
			c = this.bHor ? res : number;
			return arg1.getElementRowCol(r, c);
		}

		var range;
		if (cElementType.cell === arg1.type || cElementType.cell3D === arg1.type ||
			cElementType.cellsRange === arg1.type || cElementType.cellsRange3D === arg1.type) {
			range = arg1.getRange();
		}
		if (!range) {
			return new cError(cErrorType.bad_reference);
		}

		var bb = range.getBBox0();
		count = this.bHor ? (bb.r2 - bb.r1) : (bb.c2 - bb.c1);
		if (number > count) {
			return new cError(cErrorType.bad_reference);
		}
		var ws = arg1.getWS();
		r = this.bHor ? bb.r1 : bb.r2;
		c = this.bHor ? bb.c2 : bb.c1;
		var oSearchRange = ws.getRange3(bb.r1, bb.c1, r, c);

		if(cElementType.cellsRange === arg0Val.type) {
			arg0Val = arg0Val.cross(arguments[1]);
		} else if(cElementType.cellsRange3D === arg0Val.type) {
			arg0Val = arg0Val.cross(arguments[1]);
		}

		if (cElementType.error === arg0Val.type) {
			return arg0;
		}

		res = this._get(oSearchRange, arg0Val, arg3);
		if (-1 === res) {
			return new cError(cErrorType.not_available);
		}

		r = this.bHor ? bb.r1 + number : res;
		c = this.bHor ? res : bb.c1 + number;
		var resVal;
		arg1.getWS()._getCellNoEmpty(r, c, function (cell) {
			resVal = checkTypeCell(cell);
		});
		if(cElementType.empty === resVal.type){
			resVal = new cNumber(0);
		}

		return resVal;
	};
	VHLOOKUPCache.prototype._get = function (range, valueForSearching, arg3Value) {
		var res, _this = this, wsId = range.getWorksheet().getId();
		var sRangeName;
		AscCommonExcel.executeInR1C1Mode(false, function () {
			sRangeName = wsId + g_cCharDelimiter + range.getName();
		});
		var cacheElem = this.cacheId[sRangeName];
		if (!cacheElem) {
			cacheElem = {elements: [], results: {}};
			range._foreachNoEmpty(function (cell, r, c) {
				cacheElem.elements.push({v: checkTypeCell(cell), i: (_this.bHor ? c : r)});
			});
			this.cacheId[sRangeName] = cacheElem;
			var cacheRange = this.cacheRanges[wsId];
			if (!cacheRange) {
				cacheRange = new AscCommonExcel.RangeDataManager(null);
				this.cacheRanges[wsId] = cacheRange;
			}
			cacheRange.add(range.getBBox0(), cacheElem);
		}
		var sInputKey = valueForSearching.getValue() + g_cCharDelimiter + arg3Value + g_cCharDelimiter + valueForSearching.type;
		res = cacheElem.results[sInputKey];
		if (!res) {
			cacheElem.results[sInputKey] = res = this._calculate(cacheElem.elements, valueForSearching, arg3Value);
		}
		return res;
	};
	VHLOOKUPCache.prototype._calculate = function (cacheArray, valueForSearching, lookup) {
		var res = -1, i = 0, j, length = cacheArray.length, k, elem, val;

		//TODO неверно работает функция, допустим для случая: VLOOKUP("12",A1:A5,1) 12.00 ; "qwe" ; "3" ; 3.00 ; 4.00

		//ascending order: ..., -2, -1, 0, 1, 2, ..., A-Z, FALSE
		var _compareValues = function (val1, val2, op) {
			var res = _func[val1.type][val2.type](val1, val2, op);

			//op == true -> "="; op == false -> "<"
			/*if(op) {
				if(val1.type === val2.type) {
					res = val1.value === val2.value;
				} else {
					res = false;
				}
			} else {
				if(val1.type === val2.type) {
					res = val1.value < val2.value;
				} else if(cElementType.number === val1.type && cElementType.string === val2.type) {
					res = true;
				} else if(cElementType.string === val1.type && cElementType.number === val2.type) {
					res = false;
				} else if(cElementType.number === val1.type && cElementType.bool === val2.type) {
					res = true;
				} else if(cElementType.bool === val1.type && cElementType.number === val2.type) {
					res = false;
				}
			}*/

			return res ? res.value : false;
		};

		var simpleSearch = function() {
			for (; i < length; i++) {
				elem = cacheArray[i];
				val = elem.v;
				if (_compareValues(valueForSearching, val, "=")) {
					return elem.i;
				}
			}
			return -1;
		};

		if (lookup) {
			j = length - 1;
			while (i <= j) {
				k = Math.floor((i + j) / 2);
				elem = cacheArray[k];
				val = elem.v;
				if (_compareValues(valueForSearching, val, "=")) {
					return elem.i;
				} else if (_compareValues(valueForSearching, val, "<")) {
					j = k - 1;
				} else {
					i = k + 1;
				}
			}
			res = Math.min(i, j);
			res = -1 === res ? res : cacheArray[res].i;
			if(res === -1 && cElementType.string === valueForSearching.type) {
				res = simpleSearch();
			}
		} else {
			// Exact value
			res = simpleSearch();
		}
		return res;
	};
	VHLOOKUPCache.prototype.remove = function (cell) {
		var wsId = cell.ws.getId();
		var cacheRange = this.cacheRanges[wsId];
		if (cacheRange) {
			var oGetRes = cacheRange.get(new Asc.Range(cell.nCol, cell.nRow, cell.nCol, cell.nRow));
			for (var i = 0, length = oGetRes.all.length; i < length; ++i) {
				var elem = oGetRes.all[i];
				elem.data.results = {};
			}
		}
	};
	VHLOOKUPCache.prototype.clean = function () {
		this.cacheId = {};
		this.cacheRanges = {};
	};

	function MatchCache() {
		this.cacheId = {};
		this.cacheRanges = {};
	}

	MatchCache.prototype = Object.create(VHLOOKUPCache.prototype);
	MatchCache.prototype.constructor = MatchCache;
	MatchCache.prototype.calculate = function (arg) {

		var arg0 = arg[0], arg1 = arg[1], arg2 = arg[2] ? arg[2] : new cNumber(1);

		if (cElementType.cellsRange3D === arg0.type || cElementType.array === arg0.type ||
			cElementType.cellsRange === arg0.type) {
			return new cError(cErrorType.wrong_value_type);
		} else if (cElementType.error === arg0.type) {
			return arg0;
		}

		if (cElementType.number === arg2.type || cElementType.bool === arg2.type) {
		} else if (cElementType.error === arg2.type) {
			return arg2;
		} else {
			return new cError(cErrorType.not_available);
		}

		var a2Value = arg2.getValue();
		if (!(-1 === a2Value || 0 === a2Value || 1 === a2Value)) {
			return new cError(cErrorType.not_numeric);
		}

		if(cElementType.error === arg1.type) {
			return new cError(cErrorType.not_available);
		} else if (cElementType.array === arg1.type) {
			arg1 = arg1.getMatrix();

			var i, a1RowCount = arg1.length, a1ColumnCount = arg1[0].length, arr;

			if (a1RowCount > 1 && a1ColumnCount > 1) {
				return new cError(cErrorType.not_available);
			} else if (a1RowCount === 1 && a1ColumnCount >= 1) {
				arr = arg1[0];
			} else {
				arr = [];
				for (i = 0; i < a1RowCount; i++) {
					arr[i] = arg1[i][0];
				}
			}
			return this._calculate(arr, arg0, arg2);
		}

		if (cElementType.cell === arg1.type || cElementType.cell3D === arg1.type ||
			cElementType.cellsRange === arg1.type || cElementType.cellsRange3D === arg1.type) {
			var oSearchRange = arg1.getRange();

			if (!oSearchRange) {
				return new cError(cErrorType.bad_reference);
			}


			var a1RowCount = oSearchRange.bbox.r2 - oSearchRange.bbox.r1 + 1, a1ColumnCount = oSearchRange.bbox.c2 - oSearchRange.bbox.c1 + 1;
			var bHor = false;
			if (a1RowCount > 1 && a1ColumnCount > 1) {
				return new cError(cErrorType.not_available);
			} else if (a1RowCount === 1 && a1ColumnCount >= 1) {
				bHor = true;
			}

			return this._get(oSearchRange, arg0, arg2, bHor);
		} else {
			return new cError(cErrorType.not_available);
		}
	};
	MatchCache.prototype._get = function (range, arg0, arg2, bHor) {
		var res, _this = this, wsId = range.getWorksheet().getId(),
			sRangeName = wsId + g_cCharDelimiter + range.getName(), cacheElem = this.cacheId[sRangeName];
		var arg2Value = arg2.getValue();
		var valueForSearching = arg0.getValue();
		if (!cacheElem) {
			cacheElem = {elements: [], results: {}};

			range._foreachNoEmpty(function (cell, r, c) {
				cacheElem.elements.push({v: checkTypeCell(cell), i: (bHor ? c - range.bbox.c1 : r -  range.bbox.r1)});
			});
			this.cacheId[sRangeName] = cacheElem;
			var cacheRange = this.cacheRanges[wsId];
			if (!cacheRange) {
				cacheRange = new AscCommonExcel.RangeDataManager(null);
				this.cacheRanges[wsId] = cacheRange;
			}
			cacheRange.add(range.getBBox0(), cacheElem);
		}
		var sInputKey = valueForSearching + g_cCharDelimiter + arg2Value;
		res = cacheElem.results[sInputKey];
		if (!res) {
			cacheElem.results[sInputKey] = res = this._calculate(cacheElem.elements, arg0, arg2);
		}
		return res;
	};
	MatchCache.prototype._calculate = function (arr, a0, a2) {

		var a2Value = a2.getValue();
		var a0Type = a0.type;
		var a0Value = a0.getValue();
		if (!(cElementType.number === a0Type || cElementType.string === a0Type || cElementType.bool === a0Type ||
			cElementType.error === a0Type || cElementType.empty === a0Type)) {
			if(cElementType.empty === a0Value.type) {
				a0Value = a0Value.tocNumber();
			}
			a0Type = a0Value.type;
			a0Value = a0Value.getValue();
		}

		var item, index = -1, curIndex;
		for (var i = 0; i < arr.length; ++i) {
			item = undefined !== arr[i].v ? arr[i].v : arr[i];
			curIndex = undefined !== arr[i].i ? arr[i].i : i;
			if (item.type === a0Type) {
				if (0 === a2Value) {
					if (cElementType.string === a0Type) {
						if (AscCommonExcel.searchRegExp2(item.toString(), a0Value)) {
							index = curIndex;
							break;
						}
					} else {
						if (item == a0Value) {
							index = curIndex;
							break;
						}
					}
				} else if (1 === a2Value) {
					if (item <= a0Value) {
						index = curIndex;
					} else {
						break;
					}
				} else if (-1 === a2Value) {
					if (item >= a0Value) {
						index = curIndex;
					} else {
						break;
					}
				}
			}
		}

		return (-1 < index) ? new cNumber(index + 1) : new cError(cErrorType.not_available);
	};

	function LOOKUPCache() {
		this.cacheId = {};
		this.cacheRanges = {};
	}

	LOOKUPCache.prototype = Object.create(VHLOOKUPCache.prototype);
	LOOKUPCache.prototype.constructor = LOOKUPCache;

	LOOKUPCache.prototype.calculate = function (arg) {
		var arg0 = arg[0], arg1 = arg[1];
		var t = this, r, c, count;

		if (cElementType.cell3D === arg0.type || cElementType.cell === arg0.type) {
			arg0 = arg0.getValue();
		}

		if (cElementType.error === arg0.type) {
			return arg0;
		}

		var arg0Val;
		if(cElementType.array === arg0.type) {
			arg0Val = arg0.getElementRowCol(0,0);
		} else {
			arg0Val = arg0;
		}

		var range;
		if (cElementType.cell === arg1.type || cElementType.cell3D === arg1.type ||
			cElementType.cellsRange === arg1.type || cElementType.cellsRange3D === arg1.type) {
			range = arg1.getRange();
		}
		if (!range) {
			return new cError(cErrorType.bad_reference);
		}

		var bb = range.getBBox0();
		var bHor = bb.r2 - bb.r1 < bb.c2 - bb.c1;
		//count = bHor ? (bb.r2 - bb.r1) : (bb.c2 - bb.c1);

		var ws = arg1.getWS();
		r = bHor ? bb.r1 : bb.r2;
		c = bHor ? bb.c2 : bb.c1;
		var oSearchRange = ws.getRange3(bb.r1, bb.c1, r, c);

		if(cElementType.cellsRange === arg0Val.type) {
			arg0Val = arg0Val.cross(arguments[1]);
		} else if(cElementType.cellsRange3D === arg0Val.type) {
			arg0Val = arg0Val.cross(arguments[1]);
		}

		if (cElementType.error === arg0Val.type) {
			return arg0;
		}

		var res = this._get(oSearchRange, arg0Val, true);
		if (-1 === res) {
			return new cError(cErrorType.not_available);
		}

		return res;
	};
	LOOKUPCache.prototype._calculate = function (cacheArray, valueForSearching, lookup) {
		var res = -1, i = 0, j, length = cacheArray.length, k, elem, val;

		//TODO неверно работает функция, допустим для случая: VLOOKUP("12",A1:A5,1) 12.00 ; "qwe" ; "3" ; 3.00 ; 4.00

		//ascending order: ..., -2, -1, 0, 1, 2, ..., A-Z, FALSE
		var _compareValues = function (val1, val2, op) {
			var res = _func[val1.type][val2.type](val1, val2, op);
			return res ? res.value : false;
		};

		if (lookup) {
			j = length - 1;
			while (i <= j) {
				k = Math.floor((i + j) / 2);
				elem = cacheArray[k];
				val = elem.v;
				if (_compareValues(valueForSearching, val, "=")) {
					return k;
				} else if (_compareValues(valueForSearching, val, "<")) {
					j = k - 1;
				} else {
					i = k + 1;
				}
			}
			res = Math.min(i, j);
		} else {
			// Exact value
			for (; i < length; i++) {
				elem = cacheArray[i];
				val = elem.v;
				if (_compareValues(valueForSearching, val, "=")) {
					return i;
				}
			}
		}
		return res;
	};

	/**
	 * @constructor
	 * @extends {AscCommonExcel.cBaseFunction}
	 */
	function cVLOOKUP() {
	}

	cVLOOKUP.prototype = Object.create(cBaseFunction.prototype);
	cVLOOKUP.prototype.constructor = cVLOOKUP;
	cVLOOKUP.prototype.name = 'VLOOKUP';
	cVLOOKUP.prototype.argumentsMin = 3;
	cVLOOKUP.prototype.argumentsMax = 4;
	cVLOOKUP.prototype.arrayIndexes = {1: 1, 2: {0: 0}};
	cVLOOKUP.prototype.numFormat = AscCommonExcel.cNumFormatNone;
	cVLOOKUP.prototype.Calculate = function (arg) {

		if(this.bArrayFormula) {
		 	//в случае когда первый аргумент - массив
			//исключение, когда в формуле массива берется из одного аргумента только 1 элемент
			if(cElementType.cellsRange3D === arg[2].type || cElementType.cellsRange === arg[2].type) {
				arg[2] = arg[2].getValue2(0,0);
			} else if(cElementType.array === arg[2].type) {
				arg[2] = arg[2].getValue2(0,0);
			}
		}

		return g_oVLOOKUPCache.calculate(arg, arguments[1]);
	};

	var g_oVLOOKUPCache = new VHLOOKUPCache(false);
	var g_oHLOOKUPCache = new VHLOOKUPCache(true);
	var g_oMatchCache = new MatchCache();
	var g_oLOOKUPCache = new LOOKUPCache();

//----------------------------------------------------------export----------------------------------------------------
	window['AscCommonExcel'] = window['AscCommonExcel'] || {};
	window['AscCommonExcel'].g_oVLOOKUPCache = g_oVLOOKUPCache;
	window['AscCommonExcel'].g_oHLOOKUPCache = g_oHLOOKUPCache;
	window['AscCommonExcel'].g_oMatchCache = g_oMatchCache;
})(window);
