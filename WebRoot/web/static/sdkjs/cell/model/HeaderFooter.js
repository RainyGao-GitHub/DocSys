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

	/*
	 * Import
	 * -----------------------------------------------------------------------------
	 */
	var AscBrowser = AscCommon.AscBrowser;
	var History = AscCommon.History;
	var asc = window["Asc"];
	var asc_typeof = asc.typeOf;
	var c_oAscError = asc.c_oAscError;

	//HEADER/FOOTER
	function HeaderFooterField(val) {
		this.field = val;
	}
	HeaderFooterField.prototype.getText = function (ws, indexPrintPage, countPrintPages) {
		var res = "";
		var curDate, curDateNum;
		var api = window["Asc"]["editor"];
		switch(this.field) {
			case asc.c_oAscHeaderFooterField.pageNumber: {
				res = indexPrintPage + 1 + "";
				break;
			}
			case asc.c_oAscHeaderFooterField.pageCount: {
				res = countPrintPages + "";
				break;
			}
			case asc.c_oAscHeaderFooterField.sheetName: {
				res = ws.model.sName;
				break;
			}
			case asc.c_oAscHeaderFooterField.fileName: {
				res = api.DocInfo ? api.DocInfo.Title : "";
				break;
			}
			case asc.c_oAscHeaderFooterField.filePath: {

				break;
			}
			case asc.c_oAscHeaderFooterField.date: {
				curDate = new Asc.cDate();
				curDateNum = curDate.getExcelDate();
				res = api.asc_getLocaleExample(AscCommon.getShortDateFormat(), curDateNum);
				break;
			}
			case asc.c_oAscHeaderFooterField.time: {
				curDate = new Asc.cDate();
				curDateNum = curDate.getExcelDateWithTime(true) - curDate.getTimezoneOffset()/(60*24);
				res = api.asc_getLocaleExample(AscCommon.getShortTimeFormat(), curDateNum);
				break;
			}
			case asc.c_oAscHeaderFooterField.lineBreak: {
				//TODO возможно стоит добавлять символ переноса строки к предыдущему параграфу
				res = "\n";
				break;
			}
		}
		return res;
	};


	function HeaderFooterParser() {
		this.portions = [];
		this.currPortion = null;
		this.str = null;
		this.font = null;

		this.date = null;

		this.allFontsMap = [];
	}

	var c_oPortionPosition = {
		left: 0,
		center: 1,
		right: 2
	};

	var c_nPortionLeftHeader = 0;
	var c_nPortionCenterHeader = 1;
	var c_nPortionRightHeader = 2;
	var c_nPortionLeftFooter = 3;
	var c_nPortionCenterFooter = 4;
	var c_nPortionRightFooter = 5;

	HeaderFooterParser.prototype.parse = function (date) {
		var c_nText = 0, c_nToken = 1, c_nFontName = 2, c_nFontStyle = 3, c_nFontHeight = 4;

		this.date = date;

		this.font = new AscCommonExcel.Font();
		this.currPortion = c_oPortionPosition.center;
		this.str = "";

		var nState = c_nText;
		var nFontHeight = 0;
		var sFontName = "";
		var sFontStyle = "";

		for (var i = 0; i < date.length; i++) {
			var cChar = date[i];
			switch (nState) {
				case c_nText: {
					switch (cChar) {
						case '&':
							this.pushText();
							nState = c_nToken;
							break;
						case '\n':
							this.pushText();
							this.pushLineBreak();
							break;
						default:
							this.str += cChar;
					}
					break;
				}

				case c_nToken: {
					nState = c_nText;


					switch (cChar) {
						case '&':
							this.str.push(cChar);
							break;
						case 'L':
							this.setPortion(c_oPortionPosition.left);
							this.font = new AscCommonExcel.Font();
							break;
						case 'C':
							this.setPortion(c_oPortionPosition.center);
							this.font = new AscCommonExcel.Font();
							break;
						case 'R':
							this.setPortion(c_oPortionPosition.right);
							this.font = new AscCommonExcel.Font();
							break;
						case 'P':   //page number
							this.pushField(new HeaderFooterField(asc.c_oAscHeaderFooterField.pageNumber));
							break;
						case 'N':   //total page count
							this.pushField(new HeaderFooterField(asc.c_oAscHeaderFooterField.pageCount));
							break;
						case 'A':   //current sheet name
							this.pushField(new HeaderFooterField(asc.c_oAscHeaderFooterField.sheetName));
							break;
						case 'F':   //file name
						{
							this.pushField(new HeaderFooterField(asc.c_oAscHeaderFooterField.fileName));
							break;
						}
						case 'Z':   //file path
						{
							this.pushField(new HeaderFooterField(asc.c_oAscHeaderFooterField.filePath));
							break;
						}
						case 'D':   //date
						{
							this.pushField(new HeaderFooterField(asc.c_oAscHeaderFooterField.date));
							break;
						}
						case 'T':   //time
						{
							this.pushField(new HeaderFooterField(asc.c_oAscHeaderFooterField.time));
							break;
						}
						case 'B':   //bold
							this.font.b = !this.font.b;
							break;
						case 'I':
							this.font.i = !this.font.i;
							break;
						case 'U':   //underline
							this.font.u = Asc.EUnderline.underlineSingle;
							break;
						case 'E':   //double underline
							this.font.u = Asc.EUnderline.underlineDouble;
							break;
						case 'S':   //strikeout
							this.font.s = !this.font.s;
							break;
						case 'X':   //superscript
							if (this.font.va === AscCommon.vertalign_SuperScript) {
								this.font.va = AscCommon.vertalign_Baseline;
							} else {
								this.font.va = AscCommon.vertalign_SuperScript;
							}
							break;
						case 'Y':   //subsrcipt
							if (this.font.va === AscCommon.vertalign_SubScript) {
								this.font.va = AscCommon.vertalign_Baseline;
							} else {
								this.font.va = AscCommon.vertalign_SubScript;
							}
							break;
						case 'O':   //outlined

							break;
						case 'H':   //shadow

							break;
						case 'K':   //text color
							if (i + 6 < date.length) {
								// eat the following 6 characters
								this.font.c = this.convertFontColor(date.substr(i + 1, 6));
								i += 6;
							}
							break;
						case '\"':  //font name
							sFontName = "";
							sFontStyle = "";
							nState = c_nFontName;
							break;
						default:
							if (('0' <= cChar) && (cChar <= '9'))    // font size
							{
								nFontHeight = cChar - '0';
								nState = c_nFontHeight;
							}
					}
					break;
				}
				case c_nFontName: {
					switch (cChar) {
						case '\"':
							this.convertFontName(sFontName);
							sFontName = "";
							nState = c_nText;
							break;
						case ',':
							nState = c_nFontStyle;
							break;
						default:
							sFontName += cChar;
					}
					break;
				}
				case c_nFontStyle: {
					switch (cChar) {
						case '\"':
							this.convertFontName(sFontName);
							sFontName = "";
							this.convertFontStyle(sFontStyle);
							sFontStyle = "";

							nState = c_nText;
							break;
						default:
							sFontStyle += cChar;
					}
					break;
				}
				case c_nFontHeight: {
					if (('0' <= cChar) && (cChar <= '9')) {
						if (nFontHeight >= 0) {
							nFontHeight *= 10;
							nFontHeight += (cChar - '0');
							if (nFontHeight > 1000) {
								nFontHeight = -1;
							}
						}
					} else {
						if (nFontHeight > 0) {
							this.font.fs = nFontHeight;
						}
						i--;
						nState = c_nText;
					}
					break;
				}
			}
		}

		this.endPortion();
	};

	HeaderFooterParser.prototype.convertFontColor = function(rColor) {
		var color;
		if( (rColor[ 2 ] == '+') || (rColor[ 2 ] == '-') ) {
			var theme = rColor.substr(0, 2) - 0;
			var tint = rColor.substr(2) - 0;
			color = AscCommonExcel.g_oColorManager.getThemeColor(theme, tint / 100);

		} else {
			color = new AscCommonExcel.RgbColor(AscCommonExcel.g_clipboardExcel.pasteProcessor._getBinaryColor(rColor));
		}
		return color;
	};

	HeaderFooterParser.prototype.convertFontColorFromObj = function(obj) {
		var color = null;

		if(obj instanceof AscCommonExcel.ThemeColor) {
			var theme = obj.theme.toString();
			if(theme.length === 1) {
				theme = "0" + theme;
			}
			var tint = (obj.tint * 100).toFixed(0);
			if(1 === tint.length) {
				tint = "00" + tint;
			} else if(2 === tint.length) {
				tint = "0" + tint;
			}
			color = theme + "+" + tint;
		} else if(obj instanceof AscCommonExcel.RgbColor) {

			var toHex = function componentToHex(c) {
				var res = c.toString(16);
				return res.length == 1 ? "0" + res : res;
			};

			color = toHex(obj.getR()) + toHex(obj.getG()) + toHex(obj.getB());
		} else if(obj === null){
			color = "01+000";
		}

		return color;
	};

	HeaderFooterParser.prototype.pushText = function () {
		if (0 !== this.str.length) {
			if (!this.portions[this.currPortion]) {
				this.portions[this.currPortion] = [{format: this.font.clone(), text: this.str}];
			} else {
				this.portions[this.currPortion].push({format: this.font.clone(), text: this.str});
			}

			this.str = [];
		}
	};

	HeaderFooterParser.prototype.pushField = function (field) {
		if (!this.portions[this.currPortion]) {
			this.portions[this.currPortion] = [{format: this.font.clone(), text: field}];
		} else {
			this.portions[this.currPortion].push({format: this.font.clone(), text: field});
		}
	};

	HeaderFooterParser.prototype.pushLineBreak = function () {
		this.pushField(new HeaderFooterField(asc.c_oAscHeaderFooterField.lineBreak));
	};


	HeaderFooterParser.prototype.convertFontName = function (rName) {
		if ("" !== rName) {
			// single dash is document default font
			if ((rName.length === 1) && (rName[0] === '-')) {
				//пересмотреть
				this.font.fn = null;
			} else {
				this.font.fn = rName;
				this.allFontsMap[rName] = 1;
			}
		}
	};

	HeaderFooterParser.prototype.convertFontStyle = function (rStyle) {
		//в ms жесткая завязка на font style. в lo - ддопускаются следующие строчки - "bold italic bold"  и тп
		this.font.b = this.font.i = false;

		var fontStyleArr = rStyle.split(" ");
		for(var i = 0; i < fontStyleArr.length; i++) {
			if("italic" === fontStyleArr[i].toLowerCase()) {
				this.font.i = true;
			} else if("bold" === fontStyleArr[i].toLowerCase()) {
				this.font.b = true;
			}
		}
	};

	HeaderFooterParser.prototype.endPortion = function () {
		this.pushText();
	};

	HeaderFooterParser.prototype.setPortion = function (val) {
		if (val != this.currPortion) {
			this.endPortion();
			this.currPortion = val;
		}
	};

	HeaderFooterParser.prototype.getAllFonts = function (oFontMap) {
		for(var i in this.allFontsMap) {
			if(!oFontMap[i]) {
				oFontMap[i] = 1;
			}
		}
	};

	HeaderFooterParser.prototype.assembleText = function () {
		var newStr = "";
		var curPortionLeft = this.assemblePortionText(c_oPortionPosition.left);
		if(curPortionLeft) {
			newStr += curPortionLeft;
		}
		var curPortionCenter = this.assemblePortionText(c_oPortionPosition.center);
		if(curPortionCenter) {
			newStr += curPortionCenter;
		}
		var curPortionRight = this.assemblePortionText(c_oPortionPosition.right);
		if(curPortionRight) {
			newStr += curPortionRight;
		}
		this.date = newStr;
		return {str: newStr, left: curPortionLeft, center: curPortionCenter, right: curPortionRight};
	};

	HeaderFooterParser.prototype.splitByParagraph = function (cPortionCode) {
		var res = [];

		if(this.portions[cPortionCode]) {
			var index = 0;
			var curPortion = this.portions[cPortionCode];
			for(var i = 0; i < curPortion.length; i++) {
				if(!res[index]) {
					res[index] = [];
				}
				/*if(curPortion[i] instanceof HeaderFooterField) {
				 index++;
				 continue;
				 }*/
				res[index].push(curPortion[i]);
			}
		}

		return res;
	};

	HeaderFooterParser.prototype.assemblePortionText = function (cPortion) {
		var symbolPortion;
		switch (cPortion) {
			case c_oPortionPosition.left: {
				symbolPortion = "L";
				break;
			}
			case c_oPortionPosition.center: {
				symbolPortion = "C";
				break;
			}
			case c_oPortionPosition.right: {
				symbolPortion = "R";
				break;
			}
		}

		var compareColors = function(color1, color2) {
			var isEqual = true;

			if(color1 !== color2 || (color1 && color2 && color1.rgb !== color2.rgb)) {
				isEqual = false;
			}

			return isEqual;
		};
		var res = "";
		var fontList = true;

		var aText = "";
		var prevFont = new AscCommonExcel.Font();
		var paragraphs = this.splitByParagraph(cPortion);
		for (var j = 0; j < paragraphs.length; ++j) {
			var aParaText = "";
			var aPosList = paragraphs[j];

			for (var i = 0; i < aPosList.length; ++i) {

				var aFont = aPosList[i].format;

				// font name and style
				var newFont = aPosList[i].format;
				var bNewFontName = !(prevFont.fn == newFont.fn);
				var bNewStyle = (prevFont.b != newFont.b) || (prevFont.i != newFont.i);

				if (bNewFontName || (bNewStyle && fontList)) {
					if(null === newFont.fn) {
						aParaText += "&\"" + "-";
					} else {
						aParaText += "&\"" + newFont.fn;
					}

					//TODO пересмотреть. MS каждый раз прописывает новый font style:
					// сли у предыдущего фрагмента был bold, у нового bold и italic - то у нового будет прописаны и bold и italic
					var fontStyleStr = "";
					if(prevFont.b !== newFont.b) {
						fontStyleStr = ",";
						if(newFont.b === true) {
							fontStyleStr += "Bold";
						} else {
							fontStyleStr += "Regular";
						}
					}
					if(prevFont.i !== newFont.i) {
						if("" === fontStyleStr) {
							fontStyleStr = ",";
						} else {
							fontStyleStr += " ";
						}

						if(newFont.i === true) {
							fontStyleStr += "Italic";
						} else if(-1 === fontStyleStr.indexOf("Regular")){
							fontStyleStr += "Regular";
						}
					}

					aParaText += fontStyleStr;
					aParaText += "\"";
				}

				//font size
				newFont.fs = aFont.fs;
				var bFontHtChanged = (prevFont.fs != newFont.fs);
				if (bFontHtChanged) {
					aParaText += "&" + newFont.fs;
				}

				// underline
				if (prevFont.u != newFont.u) {
					var underline = (newFont.u == Asc.EUnderline.u) ? prevFont.u : newFont.u;
					(underline == Asc.EUnderline.underlineSingle) ? aParaText += "&U" : aParaText += "&E";
				}

				// strikeout
				if (prevFont.s != newFont.s) {
					aParaText += "&S";
				}

				// super/sub script
				if (prevFont.va != newFont.va) {
					//aParaText += "&S";

					switch(newFont.va)
					{
						// close the previous super/sub script.
						case AscCommon.vertalign_SuperScript: aParaText += "&X";  break;
						case AscCommon.vertalign_SubScript:   aParaText += "&Y";  break;
						default: (prevFont.va === AscCommon.vertalign_SuperScript) ? aParaText += "&X" : aParaText += "&Y"; break;
					}
				}


				if(!compareColors(prevFont.c, newFont.c)) {
					var newColor = this.convertFontColorFromObj(newFont.c);
					if(null !== newColor) {
						aParaText += "&K";
						aParaText += newColor;
					}
				}

				prevFont = newFont;

				if (aPosList[i].text instanceof HeaderFooterField) {
					if (aPosList[i].text.field !== undefined) {
						switch(aPosList[i].text.field) {
							case asc.c_oAscHeaderFooterField.pageNumber: {
								aParaText += "&P";
								break;
							}
							case asc.c_oAscHeaderFooterField.pageCount: {
								aParaText += "&N";
								break;
							}
							case asc.c_oAscHeaderFooterField.date: {
								aParaText += "&D";
								break;
							}
							case asc.c_oAscHeaderFooterField.time: {
								aParaText += "&T";
								break;
							}
							case asc.c_oAscHeaderFooterField.sheetName: {
								aParaText += "&A";
								break;
							}
							case asc.c_oAscHeaderFooterField.fileName: {
								aParaText += "&F";
								break;
							}
							case asc.c_oAscHeaderFooterField.filePath: {

								break;
							}
						}
					}
				} else {
					var aPortionText = aPosList[i].text;
					if (bFontHtChanged && aParaText.length && "" !== aPortionText) {
						var cLast = aParaText[aParaText.length - 1];
						var cFirst = aPortionText[0];
						if (('0' <= cLast) && (cLast <= '9') && ('0' <= cFirst) && (cFirst <= '9')) {
							aParaText += " ";
						}
					}
					aParaText += aPortionText;
				}
			}

			if (j !== paragraphs.length - 1) {
				aParaText += "\n";
			}
			aText += aParaText;
		}

		if ("" !== aText) {
			res += "&" + symbolPortion + aText;
		}

		return res;
	};


	function CHeaderFooterEditorSection(type, portion, canvasObj) {
		this.type = type;
		this.portion = portion;
		this.canvasObj = canvasObj;
		this.fragments = null;

		this.changed = false;
	}
	CHeaderFooterEditorSection.prototype.setFragments = function (val) {
		this.fragments = this.isEmptyFragments(val) ? null : val;
	};
	CHeaderFooterEditorSection.prototype.isEmptyFragments = function (val) {
		var res = false;
		if(val && val.length === 1 && val[0].text === "") {
			res = true;
		}
		return res;
	};
	CHeaderFooterEditorSection.prototype.getFragments = function () {
		return this.fragments;
	};
	CHeaderFooterEditorSection.prototype.drawText = function () {
		this.canvasObj.drawingCtx.clear();
		if(!this.fragments) {
			//возможно стоит очищать канву в данном случае
			return;
		}

		var canvas = this.canvasObj.canvas;
		var width = this.canvasObj.width;
		var drawingCtx = this.canvasObj.drawingCtx;

		//draw
		//добавляю флаги для учета переноса строки
		var wb = window["Asc"]["editor"].wb;
		var ws = window["Asc"]["editor"].wb.getWorksheet();
		var cellFlags = new AscCommonExcel.CellFlags();
		cellFlags.wrapText = true;
		cellFlags.textAlign = this.getAlign();


		var cellEditorWidth = width - 2 * wb.defaults.worksheetView.cells.padding + 1;
		ws.stringRender.setString(this.fragments, cellFlags);

		var textMetrics = ws.stringRender._measureChars(cellEditorWidth);
		var parentHeight = document.getElementById(this.canvasObj.idParent).clientHeight;
		canvas.height = textMetrics.height > parentHeight ? textMetrics.height : parentHeight;
		ws.stringRender.render(drawingCtx, wb.defaults.worksheetView.cells.padding, 0, cellEditorWidth, ws.settings.activeCellBorderColor);
	};
	CHeaderFooterEditorSection.prototype.getElem = function () {
		return document.getElementById(this.canvasObj.idParent);
	};
	CHeaderFooterEditorSection.prototype.appendEditor = function (editorElemId) {
		var curElem = this.getElem();
		var editorElem = document.getElementById(editorElemId);
		curElem.appendChild(editorElem);
	};
	CHeaderFooterEditorSection.prototype.getAlign = function (portion) {
		portion = undefined !== portion ? portion : this.portion;

		var res = AscCommon.align_Left;
		if(portion === c_nPortionCenterHeader || portion === c_nPortionCenterFooter) {
			res = AscCommon.align_Center;
		} else if(portion === c_nPortionRightHeader || portion === c_nPortionRightFooter) {
			res = AscCommon.align_Right;
		}
		return res;
	};


	function convertFieldToMenuText(val) {
		var textField = null;
		var tM = AscCommon.translateManager;
		var pageTag = "&[" + tM.getValue("Page") + "]";
		var pagesTag = "&[" + tM.getValue("Pages") + "]";
		var tabTag = "&[" + tM.getValue("Tab") + "]";
		var dateTag = "&[" + tM.getValue("Date") + "]";
		var fileTag = "&[" + tM.getValue("File") + "]";
		var timeTag = "&[" + tM.getValue("Time") + "]";

		switch (val){
			case asc.c_oAscHeaderFooterField.pageNumber: {
				textField = pageTag;
				break;
			}
			case asc.c_oAscHeaderFooterField.pageCount: {
				textField = pagesTag;
				break;
			}
			case asc.c_oAscHeaderFooterField.date: {
				textField = dateTag;
				break;
			}
			case asc.c_oAscHeaderFooterField.time: {
				textField = timeTag;
				break;
			}
			case asc.c_oAscHeaderFooterField.sheetName: {
				textField = tabTag;
				break;
			}
			case asc.c_oAscHeaderFooterField.fileName: {
				textField = fileTag;
				break;
			}
			case asc.c_oAscHeaderFooterField.filePath: {

				break;
			}
			case asc.c_oAscHeaderFooterField.lineBreak: {
				textField = "\n";
				break;
			}
		}
		return textField;
	}

	window.Asc.g_header_footer_editor = null;
	function CHeaderFooterEditor(idArr, width, pageType) {
		window.Asc.g_header_footer_editor = this;

		this.parentWidth = AscBrowser.isRetina ? AscCommon.AscBrowser.convertToRetinaValue(width, true) : width;
		this.parentHeight = 90;
		this.pageType = undefined === pageType ? asc.c_oAscHeaderFooterType.odd : pageType;//odd, even, first
		this.canvas = [];
		this.sections = [];

		this.curParentFocusId = null;
		this.cellEditor = null;
		this.wbCellEditor = null;
		this.editorElemId = "ce-canvas-outer-menu";


		this.api = window["Asc"]["editor"];
		this.wb = this.api.wb;

		this.presets = null;
		this.menuPresets = null;

		this.alignWithMargins = null;
		this.differentFirst = null;
		this.differentOddEven = null;
		this.scaleWithDoc = null;

		this.init(idArr);
	}

	CHeaderFooterEditor.prototype.init = function (idArr) {
		//создаем 6 канвы(+ добавляем их в дом структуру внутрь элемента от меню) + 3 drawingCtx, необходимые для отрисовки 3 поля
		//делается это только 1 раз при инициализации класса
		//потом эти 6 канвы используются для отрисовки всех first/odd/even
		var t = this;
		var createAndPushCanvasObj = function(id) {
			var obj = {};
			obj.idParent = id;
			obj.id = id + "-canvas";
			obj.width = t.parentWidth;
			obj.canvas = document.createElement('canvas');
			obj.canvas.id = obj.id;
			obj.canvas.width = t.parentWidth;
			obj.canvas.height = t.parentHeight;
			obj.canvas.style.width = AscBrowser.isRetina ? AscCommon.AscBrowser.convertToRetinaValue(t.parentWidth) + "px" : t.parentWidth + "px";

			var curElem = document.getElementById(id);
			curElem.appendChild(obj.canvas);

			obj.drawingCtx = new asc.DrawingContext({
				canvas: obj.canvas, units: 0/*px*/, fmgrGraphics: t.wb.fmgrGraphics, font: t.wb.m_oFont
			});
			return obj;
		};

		this.parentHeight = document.getElementById(idArr[0]).clientHeight;

		this.canvas[c_nPortionLeftHeader] = createAndPushCanvasObj(idArr[0]);
		this.canvas[c_nPortionCenterHeader] = createAndPushCanvasObj(idArr[1]);
		this.canvas[c_nPortionRightHeader] = createAndPushCanvasObj(idArr[2]);
		this.canvas[c_nPortionLeftFooter] = createAndPushCanvasObj(idArr[3]);
		this.canvas[c_nPortionCenterFooter] = createAndPushCanvasObj(idArr[4]);
		this.canvas[c_nPortionRightFooter] = createAndPushCanvasObj(idArr[5]);


		//add common options
		var ws = this.wb.getWorksheet();
		this.alignWithMargins = ws.model.headerFooter.alignWithMargins;
		this.differentFirst = ws.model.headerFooter.differentFirst;
		this.differentOddEven = ws.model.headerFooter.differentOddEven;
		this.scaleWithDoc = ws.model.headerFooter.scaleWithDoc;

		//сохраняем редактор ячейки
		this.wbCellEditor = this.wb.cellEditor;

		//далее создаем классы, где будем хранить fragments всех типов колонтитулов + выполнять отрисовку
		//хранить будем в следующем виде: [c_nPageHFType.firstHeader/.../][c_nPortionLeft/.../c_nPortionRight]
		this._createAndDrawSections();
		this._generatePresetsArr();

		//лочим
		ws._isLockedHeaderFooter();
	};

	CHeaderFooterEditor.prototype.switchHeaderFooterType = function (type) {
		if(type === this.pageType) {
			return;
		}
		var isError = this._checkSave();
		if(null !== isError) {
			return isError;
		}

		if(this.cellEditor) {
			//save
			var prevField = this._getSectionById(this.curParentFocusId);
			var prevFragments = this.cellEditor.options.fragments;
			prevField.setFragments(prevFragments);
			prevField.drawText();

			prevField.canvasObj.canvas.style.display = "block";

			this.cellEditor.close();
			document.getElementById(this.editorElemId).remove();
		}

		this.curParentFocusId = null;
		this.cellEditor = null;
		this.pageType = type;

		//ещё возможно нужно будет заново добавлять в parent созданную канву(reinit)
		this._createAndDrawSections(type);
	};

	CHeaderFooterEditor.prototype.click = function (id, x, y) {
		var api = this.api;
		var wb = this.wb;
		var ws = wb.getWorksheet();
		var t = this;

		var editLockCallback = function() {
			id = id.replace("#", "");

			//если находимся в том же элементе
			if(t.curParentFocusId === id) {
				api.asc_enableKeyEvents(true);
				return;
			}

			//TODO ещё нужно учитывать, что находимся в той же вкладке - odd/even/...
			//если перед этим редактировали другое поле, сохраняем данные
			if(null !== t.curParentFocusId) {
				var prevField = t._getSectionById(t.curParentFocusId);
				var prevFragments = t.cellEditor.options.fragments;
				prevField.setFragments(prevFragments);
				prevField.drawText();

				prevField.canvasObj.canvas.style.display = "block";
			}

			t.curParentFocusId = id;


			var cSection = t._getSectionById(id);
			if(cSection) {
				var sectionElem = cSection.getElem();
				var fragments = cSection.getFragments();
				var self = wb;
				if(!t.cellEditor) {
					t.cellEditor =
						new AscCommonExcel.CellEditor(sectionElem, wb.input, wb.fmgrGraphics, wb.m_oFont, /*handlers*/{
							"closed": function () {
								self._onCloseCellEditor.apply(self, arguments);
							}, "updated": function () {
								self.Api.checkLastWork();
								self._onUpdateCellEditor.apply(self, arguments);
							}, /*"gotFocus": function (hasFocus) {
							 self.controller.setFocus(!hasFocus);
							 },*/ "updateEditorState": function (state) {
								self.handlers.trigger("asc_onEditCell", state);
							}, "updateEditorSelectionInfo": function (info) {
								self.handlers.trigger("asc_onEditorSelectionChanged", info);
							}, "onContextMenu": function (event) {
								self.handlers.trigger("asc_onContextMenu", event);
							}, "updateMenuEditorCursorPosition": function (pos, height) {
								self.handlers.trigger("asc_updateEditorCursorPosition", pos, height);
							}, "resizeEditorHeight": function () {
								self.handlers.trigger("asc_resizeEditorHeight");
							}
						}, AscCommon.AscBrowser.isRetina ? AscCommon.AscBrowser.convertToRetinaValue(2, true) :
							2, true);

					//временно меняем cellEditor у wb
					wb.cellEditor = t.cellEditor;

					//удаляем z-index для интерфейса
					t.cellEditor.canvasOuter.style.zIndex = "";
					t.cellEditor.canvas.style.zIndex = "";
					t.cellEditor.canvasOverlay.style.zIndex = "";
					t.cellEditor.cursor.style.zIndex = "";
				} else {
					t.cellEditor.close();
					cSection.appendEditor(t.editorElemId);
				}

				t._openCellEditor(t.cellEditor, fragments, /*cursorPos*/undefined, false, false, /*isHideCursor*/false, /*isQuickInput*/false, x, y, sectionElem);
				t.cellEditor.canvasOuter.style.zIndex = "";
				cSection.canvasObj.canvas.style.display = "none";


				wb.setCellEditMode(true);

				api.asc_enableKeyEvents(true);
			}
		};

		editLockCallback();
	};

	CHeaderFooterEditor.prototype._openCellEditor = function (editor, fragments, cursorPos, isFocus, isClearCell, isHideCursor, isQuickInput, x, y, sectionElem) {
		var t = this;

		var wb = this.wb;
		var ws = wb.getWorksheet();

		if (!fragments) {
			fragments = [];
			var tempFragment = new AscCommonExcel.Fragment();
			tempFragment.text = "";
			tempFragment.format = new AscCommonExcel.Font();
			fragments.push(tempFragment);
		}

		var curSection = this._getSectionById(this.curParentFocusId);
		curSection.changed = true;
		var flags = new window["AscCommonExcel"].CellFlags();
		flags.wrapText = true;
		flags.textAlign = curSection.getAlign();


		var options = {
			fragments: fragments,
			flags: flags,
			font: window['AscCommonExcel'].g_oDefaultFormat.Font,
			background: ws.settings.cells.defaultState.background,
			textColor: new window['AscCommonExcel'].RgbColor(0),
			cursorPos: cursorPos,
			//zoom: this.getZoom(),
			focus: true,
			isClearCell: isClearCell,
			isHideCursor: isHideCursor,
			isQuickInput: isQuickInput,
			autoComplete: [],
			autoCompleteLC: [],
			saveValueCallback: function (val, flags) {
				//TODO добавил для того, чтобы при нажатии на стрелки не было падения
			},
			getSides: function () {
				var bottomArr = [];
				for(var i = 0; i < 30; i++) {
					bottomArr.push(t.parentHeight + i * 19);
				}
				return {l: [0], r: [t.parentWidth], b: bottomArr, cellX: 0, cellY: 0, ri: 0, bi: 0};
			},
			checkVisible: function () {
				return true;
			},
			menuEditor: true
		};

		//TODO для определение позиции первого клика прадварительно выставляю опции и измеряю. Рассмотреть, если ли другой вариант?
		editor._setOptions(options);
		editor.textRender.measureString(fragments, flags, editor._getContentWidth());
		editor._renderText();

		//при клике на одну из секций определяем стартовую позицию
		//если позиция undefined, ищем конец текста в данном фрагменте
		if(undefined === x || undefined === y) {
			cursorPos = 0;
			if(editor.options && editor.options.fragments) {
				for(var i = 0; i < editor.options.fragments.length; i++) {
					cursorPos += editor.options.fragments[i].text.length;
				}
			}
		} else {
			cursorPos = editor._findCursorPosition({x: x, y: y});
		}

		wb.setCellEditMode(true);
		ws.setCellEditMode(true);
		options.cursorPos = cursorPos;
		editor.open(options);
		wb.input.disabled = false;
		wb.handlers.trigger("asc_onEditCell", window['Asc'].c_oAscCellEditorState.editStart);

		return true;
	};

	CHeaderFooterEditor.prototype.destroy = function (bSave) {
		//возвращаем cellEditor у wb
		var t = this;
		var api = window["Asc"]["editor"];
		var wb = api.wb;
		var ws = wb.getWorksheet();

		if(bSave /*&& bChanged*/) {
			var checkError = this._checkSave();
			if(null === checkError) {
				wb.cellEditor.close();
				wb.cellEditor = this.wbCellEditor;
				var saveCallback = function(isSuccess) {
					if (false === isSuccess) {
						ws.model.workbook.handlers.trigger("asc_onError", c_oAscError.ID.LockedAllError, c_oAscError.Level.NoCritical);
						return;
					}
					t._saveToModel();
				};
				ws._isLockedHeaderFooter(saveCallback);
			} else {
				return checkError;
			}
		} else {
			wb.cellEditor.close();
			wb.cellEditor = this.wbCellEditor;
		}
		delete window.Asc.g_header_footer_editor;

		return null;
	};

	CHeaderFooterEditor.prototype._checkSave = function() {
		var t = this;

		if(null !== this.curParentFocusId) {
			var prevField = this._getSectionById(this.curParentFocusId);
			var prevFragments = this.cellEditor.options.fragments;
			prevField.setFragments(prevFragments);

			prevField.canvasObj.canvas.style.display = "block";
		}

		var checkError = function(type) {
			var prevHeaderFooter = t._getCurPageHF(type);
			var curHeaderFooter = new Asc.CHeaderFooterData();
			curHeaderFooter.parser = new window["AscCommonExcel"].HeaderFooterParser();
			if(prevHeaderFooter && prevHeaderFooter.parser) {
				var newPortions = [];
				for(var i in prevHeaderFooter.parser.portions) {
					if(prevHeaderFooter.parser.portions[i]) {
						newPortions[i] = [];
						for(var j in prevHeaderFooter.parser.portions[i]) {
							var curPortion = prevHeaderFooter.parser.portions[i][j];
							if(curPortion) {
								newPortions[i][j] = {text: curPortion.text, format: curPortion.format.clone()}
							}
						}
					}
				}
				curHeaderFooter.parser.portions = newPortions;
			}

			if(t.sections[type][c_oPortionPosition.left] && t.sections[type][c_oPortionPosition.left].changed) {
				curHeaderFooter.parser.portions[c_oPortionPosition.left] = t._convertFragments(t.sections[type][c_oPortionPosition.left].fragments);
			}
			if(t.sections[type][c_oPortionPosition.center] && t.sections[type][c_oPortionPosition.center].changed) {
				curHeaderFooter.parser.portions[c_oPortionPosition.center] = t._convertFragments(t.sections[type][c_oPortionPosition.center].fragments);
			}
			if(t.sections[type][c_oPortionPosition.right] && t.sections[type][c_oPortionPosition.right].changed) {
				curHeaderFooter.parser.portions[c_oPortionPosition.right] = t._convertFragments(t.sections[type][c_oPortionPosition.right].fragments);
			}

			var oData = curHeaderFooter.parser.assembleText();
			if(oData.str && oData.str.length > Asc.c_oAscMaxHeaderFooterLength) {
				var maxLength = oData.left.length;
				var section = c_oPortionPosition.left;
				if(oData.right.length > oData.left.length && oData.right.length > oData.center.length) {
					section = c_oPortionPosition.right;
					maxLength = oData.right.length;
				} else if(oData.center.length > oData.left.length && oData.center.length > oData.right.length) {
					section = c_oPortionPosition.center;
					maxLength = oData.center.length;
				}

				if(t.sections[type] && t.sections[type][section] && t.sections[type][section].canvasObj) {
					return {id: "#" + t.sections[type][section].canvasObj.idParent, max: maxLength};
				}
			}
			return false
		};

		var pageHeaderType = this._getHeaderFooterType(this.pageType);
		var pageFooterType = this._getHeaderFooterType(this.pageType, true);
		var headerCheck = checkError(pageHeaderType);
		var footerCheck = checkError(pageFooterType);
		if(headerCheck && footerCheck) {
			return headerCheck.max > footerCheck.max ? headerCheck.id : footerCheck.id;
		} else if(headerCheck) {
			return headerCheck.id
		} else if(footerCheck) {
			return footerCheck.id
		}

		return null;
	};

	CHeaderFooterEditor.prototype._saveToModel = function () {
		var ws = this.wb.getWorksheet();

		var isAddHistory = false;
		for(var i = 0; i < this.sections.length; i++) {
			if(!this.sections[i]) {
				continue;
			}

			//сначала формируем новый объект, затем доблавляем в модель и записываем в историю полученную строку
			//возможно стоит пересмотреть(получать вначале строку) - создаём вначале парсер,
			//добавляем туда полученные при редактировании фрагменты, затем получаем строку
			var curHeaderFooter = this._getCurPageHF(i);
			if(null === curHeaderFooter) {
				curHeaderFooter = new Asc.CHeaderFooterData();
			}
			if(!curHeaderFooter.parser) {
				curHeaderFooter.parser = new window["AscCommonExcel"].HeaderFooterParser();
			}

			var isChanged = false;
			if(this.sections[i][c_oPortionPosition.left] && this.sections[i][c_oPortionPosition.left].changed) {
				curHeaderFooter.parser.portions[c_oPortionPosition.left] = this._convertFragments(this.sections[i][c_oPortionPosition.left].fragments);
				isChanged = true;
			}
			if(this.sections[i][c_oPortionPosition.center] && this.sections[i][c_oPortionPosition.center].changed) {
				curHeaderFooter.parser.portions[c_oPortionPosition.center] = this._convertFragments(this.sections[i][c_oPortionPosition.center].fragments);
				isChanged = true;
			}
			if(this.sections[i][c_oPortionPosition.right] && this.sections[i][c_oPortionPosition.right].changed) {
				curHeaderFooter.parser.portions[c_oPortionPosition.right] = this._convertFragments(this.sections[i][c_oPortionPosition.right].fragments);
				isChanged = true;
			}
			//нужно добавлять в историю
			if(isChanged) {
				if(!isAddHistory) {
					History.Create_NewPoint();
					History.StartTransaction();
					isAddHistory = true;
				}

				curHeaderFooter.parser.assembleText();
				//curHeaderFooter.setStr(curHeaderFooter.parser.date);
				ws.model.headerFooter.setHeaderFooterData(curHeaderFooter.parser.date, i);
			}
		}

		//common options
		ws.model.headerFooter.setAlignWithMargins(this.alignWithMargins);
		ws.model.headerFooter.setDifferentFirst(this.differentFirst);
		ws.model.headerFooter.setDifferentOddEven(this.differentOddEven);
		ws.model.headerFooter.setScaleWithDoc(this.scaleWithDoc);


		if(isAddHistory) {
			History.EndTransaction();
		}
	};

	CHeaderFooterEditor.prototype.setFontName = function(fontName) {
		if(null === this.cellEditor) {
			return;
		}

		var t = this, fonts = {};
		fonts[fontName] = 1;
		t.api._loadFonts(fonts, function() {
			t.cellEditor.setTextStyle("fn", fontName);
			t.wb.restoreFocus();
		});
	};

	CHeaderFooterEditor.prototype.setFontSize = function(fontSize) {
		if(null === this.cellEditor) {
			return;
		}

		this.cellEditor.setTextStyle("fs", fontSize);
		this.wb.restoreFocus();
	};

	CHeaderFooterEditor.prototype.setBold = function(isBold) {
		if(null === this.cellEditor) {
			return;
		}

		this.cellEditor.setTextStyle("b", isBold);
		this.wb.restoreFocus();
	};

	CHeaderFooterEditor.prototype.setItalic = function(isItalic) {
		if(null === this.cellEditor) {
			return;
		}

		this.cellEditor.setTextStyle("i", isItalic);
		this.wb.restoreFocus();
	};

	CHeaderFooterEditor.prototype.setUnderline = function(isUnderline) {
		if(null === this.cellEditor) {
			return;
		}

		this.cellEditor.setTextStyle("u", isUnderline ? Asc.EUnderline.underlineSingle : Asc.EUnderline.underlineNone);
		this.wb.restoreFocus();
	};

	CHeaderFooterEditor.prototype.setStrikeout = function(isStrikeout) {
		if(null === this.cellEditor) {
			return;
		}

		this.cellEditor.setTextStyle("s", isStrikeout);
		this.wb.restoreFocus();
	};

	CHeaderFooterEditor.prototype.setSubscript = function(isSubscript) {
		if(null === this.cellEditor) {
			return;
		}

		this.cellEditor.setTextStyle("fa", isSubscript ? AscCommon.vertalign_SubScript : null);
		this.wb.restoreFocus();
	};

	CHeaderFooterEditor.prototype.setSuperscript = function(isSuperscript) {
		if(null === this.cellEditor) {
			return;
		}

		this.cellEditor.setTextStyle("fa", isSuperscript ? AscCommon.vertalign_SuperScript : null);
		this.wb.restoreFocus();
	};

	CHeaderFooterEditor.prototype.setTextColor = function(color) {
		if(null === this.cellEditor) {
			return;
		}

		if (color instanceof Asc.asc_CColor) {
			color = AscCommonExcel.CorrectAscColor(color);
			this.cellEditor.setTextStyle("c", color);
			this.wb.restoreFocus();
		}
	};

	CHeaderFooterEditor.prototype.addField = function(val) {
		if(null === this.cellEditor) {
			return;
		}

		var textField = convertFieldToMenuText(val);
		if(null !== textField) {
			this.cellEditor.pasteText(textField);
		}
	};

	CHeaderFooterEditor.prototype.getTextPresetsArr = function() {
		var wb = this.wb;
		var ws = wb.getWorksheet();

		var arrPresets = this.menuPresets;
		if(!arrPresets) {
			return [];
		}

		var getFragmentText = function(val) {
			if ( asc_typeof(val) === "string" ){
				return val;
			} else {
				return val.getText(ws, 0, 1);
			}
		};

		var getFragmentsText = function(fragments) {
			var res = "";
			for(var n = 0; n < fragments.length; n++) {
				res += getFragmentText(fragments[n].text);
			}
			return res;
		};

		var textPresetsArr = [];
		for(var i = 0; i < arrPresets.length; i++) {
			if(!arrPresets[i]) {
				continue;
			}
			textPresetsArr[i] = "";
			for(var j = 0; j < arrPresets[i].length; j++) {
				if(arrPresets[i][j]) {
					var fragments = this._convertFragments([this._getFragments(arrPresets[i][j])]);
					if("" !== textPresetsArr[i]) {
						textPresetsArr[i] += ", ";
					}
					textPresetsArr[i] += getFragmentsText(fragments);
				}
			}
			if("" === textPresetsArr[i]) {
				textPresetsArr[i] = "None";
			}
		}

		return textPresetsArr;
	};

	CHeaderFooterEditor.prototype.applyPreset = function(type, bFooter) {

		var curType = this._getHeaderFooterType(this.pageType, bFooter);
		var section = this.sections[curType];

		if(this.cellEditor) {
			if(section[c_oPortionPosition.left] && section[c_oPortionPosition.left].canvasObj) {
				this.click(section[c_oPortionPosition.left].canvasObj.idParent);
			}
		}

		this.curParentFocusId = null;

		var fragments;
		for(var i = 0; i < section.length; i++) {
			if(!this.presets[type][i]) {
				section[i].setFragments(null);
			} else {
				fragments = [this._getFragments(this.presets[type][i], new AscCommonExcel.Font())];
				section[i].setFragments(fragments);
			}
			section[i].drawText();
			section[i].changed = true;
			section[i].canvasObj.canvas.style.display = "block";
		}
	};

	CHeaderFooterEditor.prototype.getAppliedPreset = function(type, bFooter) {
		var res = Asc.c_oAscHeaderFooterPresets.none;
		type = undefined !== type ? type : this.pageType;
		var curType = this._getHeaderFooterType(type, bFooter);
		var section = this.sections[curType];

		for(var i = 0; i < section.length; i++) {

			if(null !== section[i].fragments) {
				res = Asc.c_oAscHeaderFooterPresets.custom;
				break;
			}
		}

		return res;
	};

	CHeaderFooterEditor.prototype.setAlignWithMargins = function(val) {
		this.alignWithMargins = val;
	};

	CHeaderFooterEditor.prototype.setDifferentFirst = function(val) {
		var checkError;
		if(!val && (checkError = this._checkSave()) !== null) {
			return checkError;
		}
		this.differentFirst = val;

		return null;
	};

	CHeaderFooterEditor.prototype.setDifferentOddEven = function(val) {
		var checkError;
		if(!val && (checkError = this._checkSave()) !== null) {
			return checkError;
		}
		this.differentOddEven = val;

		return null;
	};

	CHeaderFooterEditor.prototype.setScaleWithDoc = function(val) {
		this.scaleWithDoc = val;
	};

	CHeaderFooterEditor.prototype.getAlignWithMargins = function() {
		return true === this.alignWithMargins || null === this.alignWithMargins;
	};

	CHeaderFooterEditor.prototype.getDifferentFirst = function() {
		return true === this.differentFirst;
	};

	CHeaderFooterEditor.prototype.getDifferentOddEven = function() {
		return true === this.differentOddEven;
	};

	CHeaderFooterEditor.prototype.getScaleWithDoc = function() {
		return true === this.scaleWithDoc || null === this.scaleWithDoc;
	};

	CHeaderFooterEditor.prototype._createAndDrawSections = function(pageCommonType) {
		var pageHeaderType = this._getHeaderFooterType(pageCommonType);
		var pageFooterType = this._getHeaderFooterType(pageCommonType, true);

		var getFragments = function(textPropsArr) {
			if(!textPropsArr) {
				return null;
			}
			var res = [];
			for(var i = 0; i < textPropsArr.length; i++) {
				var curProps = textPropsArr[i];
				var text = asc_typeof(curProps.text) === "string" ? curProps.text : convertFieldToMenuText(curProps.text.field);
				if(null !== text) {
					var tempFragment = new AscCommonExcel.Fragment();
					tempFragment.text = text;
					tempFragment.format = curProps.format;
					res.push(tempFragment);
				}
			}
			return res;
		};

		//header
		var curPageHF, parser, leftFragments, centerFragments, rightFragments;
		if(!this.sections[pageHeaderType]) {
			this.sections[pageHeaderType] = [];

			//создаём секции, если они уже не созданы
			this.sections[pageHeaderType][c_oPortionPosition.left] = new CHeaderFooterEditorSection(pageHeaderType, c_nPortionLeftHeader, this.canvas[c_nPortionLeftHeader]);
			this.sections[pageHeaderType][c_oPortionPosition.center] = new CHeaderFooterEditorSection(pageHeaderType, c_nPortionCenterHeader, this.canvas[c_nPortionCenterHeader]);
			this.sections[pageHeaderType][c_oPortionPosition.right] = new CHeaderFooterEditorSection(pageHeaderType, c_nPortionRightHeader, this.canvas[c_nPortionRightHeader]);

			//получаем из модели необходимый нам элемент
			curPageHF = this._getCurPageHF(pageHeaderType);
			if(curPageHF && curPageHF.str) {
				if(!curPageHF.parser) {
					curPageHF.parse();
				}
				parser = curPageHF.parser.portions;
				leftFragments = getFragments(parser[0]);
				if(null !== leftFragments) {
					this.sections[pageHeaderType][c_oPortionPosition.left].fragments = leftFragments;
				}
				centerFragments = getFragments(parser[1]);
				if(null !== centerFragments) {
					this.sections[pageHeaderType][c_oPortionPosition.center].fragments = centerFragments;
				}
				rightFragments = getFragments(parser[2]);
				if(null !== rightFragments) {
					this.sections[pageHeaderType][c_oPortionPosition.right].fragments = rightFragments;
				}
			}
		}

		//footer
		if(!this.sections[pageFooterType]) {
			this.sections[pageFooterType] = [];

			//создаём секции, если они уже не созданы
			this.sections[pageFooterType][c_oPortionPosition.left] = new CHeaderFooterEditorSection(pageFooterType, c_nPortionLeftFooter, this.canvas[c_nPortionLeftFooter]);
			this.sections[pageFooterType][c_oPortionPosition.center] = new CHeaderFooterEditorSection(pageFooterType, c_nPortionCenterFooter, this.canvas[c_nPortionCenterFooter]);
			this.sections[pageFooterType][c_oPortionPosition.right] = new CHeaderFooterEditorSection(pageFooterType, c_nPortionRightFooter, this.canvas[c_nPortionRightFooter]);

			//получаем из модели необходимый нам элемент
			curPageHF = this._getCurPageHF(pageFooterType);
			if(curPageHF && curPageHF.str) {
				if(!curPageHF.parser) {
					curPageHF.parse();
				}
				parser = curPageHF.parser.portions;
				leftFragments = getFragments(parser[0]);
				if(null !== leftFragments) {
					this.sections[pageFooterType][c_oPortionPosition.left].fragments = leftFragments;
				}
				centerFragments = getFragments(parser[1]);
				if(null !== centerFragments) {
					this.sections[pageFooterType][c_oPortionPosition.center].fragments = centerFragments;
				}
				rightFragments = getFragments(parser[2]);
				if(null !== rightFragments) {
					this.sections[pageFooterType][c_oPortionPosition.right].fragments = rightFragments;
				}
			}
		}


		//DRAW AFTER OPEN MENU
		this.sections[pageHeaderType][c_oPortionPosition.left].drawText();
		this.sections[pageHeaderType][c_oPortionPosition.center].drawText();
		this.sections[pageHeaderType][c_oPortionPosition.right].drawText();
		this.sections[pageFooterType][c_oPortionPosition.left].drawText();
		this.sections[pageFooterType][c_oPortionPosition.center].drawText();
		this.sections[pageFooterType][c_oPortionPosition.right].drawText();
	};

	CHeaderFooterEditor.prototype._getHeaderFooterType = function(type, bFooter) {
		var res = bFooter ? asc.c_oAscPageHFType.oddFooter : asc.c_oAscPageHFType.oddHeader;

		if(type === asc.c_oAscHeaderFooterType.first) {
			res = bFooter ? asc.c_oAscPageHFType.firstFooter : asc.c_oAscPageHFType.firstHeader;
		} else if (type === asc.c_oAscHeaderFooterType.even) {
			res = bFooter ? asc.c_oAscPageHFType.evenFooter : asc.c_oAscPageHFType.evenHeader;
		}

		return res;
	};

	CHeaderFooterEditor.prototype._getCurPageHF = function (type) {
		var res = null;
		var ws = this.wb.getWorksheet();

		//TODO можно у класса CHeaderFooter реализовать данную функцию
		if(ws.model.headerFooter) {
			switch (type){
				case asc.c_oAscPageHFType.firstHeader: {
					res = ws.model.headerFooter.firstHeader;
					break;
				}
				case asc.c_oAscPageHFType.oddHeader: {
					res = ws.model.headerFooter.oddHeader;
					break;
				}
				case asc.c_oAscPageHFType.evenHeader: {
					res = ws.model.headerFooter.evenHeader;
					break;
				}
				case asc.c_oAscPageHFType.firstFooter: {
					res = ws.model.headerFooter.firstFooter;
					break;
				}
				case asc.c_oAscPageHFType.oddFooter: {
					res = ws.model.headerFooter.oddFooter;
					break;
				}
				case asc.c_oAscPageHFType.evenFooter: {
					res = ws.model.headerFooter.evenFooter;
					break;
				}
			}
		}
		return res;
	};

	CHeaderFooterEditor.prototype._getSectionById = function (id) {
		var res = null;
		var type = this._getHeaderFooterType(this.pageType);
		var i;
		if(this.sections && this.sections[type]) {
			for(i = 0; i < this.sections[type].length; i++) {
				if(id === this.sections[type][i].canvasObj.idParent) {
					return this.sections[type][i];
				}
			}
		}
		type = this._getHeaderFooterType(this.pageType, true);
		if(this.sections && this.sections[type]) {
			for(i = 0; i < this.sections[type].length; i++) {
				if(id === this.sections[type][i].canvasObj.idParent) {
					return this.sections[type][i];
				}
			}
		}
		return res;
	};

	CHeaderFooterEditor.prototype._convertFragments = function(fragments) {
		if(!fragments) {
			return null;
		}

		//TODO возможно стоит созадавать portions внутри парсера с элементами Fragments
		var res = [];

		var tM = AscCommon.translateManager;

		var bToken, text, symbol, startToken, tokenText, tokenFormat;
		for(var j = 0; j < fragments.length; j++) {
			text = "";
			for(var n = 0; n < fragments[j].text.length; n++) {
				symbol = fragments[j].text[n];
				if(symbol !== "&") {
					text += symbol;
				}

				//если несколько таких символов подряд, ms оставляет 1 как текст
				//пока игнорируем данную ситуацию
				if(symbol === "&") {
					if("" !== text) {
						res.push({text: text, format: fragments[j].format});
						text = "";
					}

					bToken = true;
					tokenFormat = fragments[j].format;
				} else if(startToken) {
					if(symbol === "]") {
						switch(tokenText.toLowerCase()) {
							case tM.getValue("Page").toLowerCase(): {
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.pageNumber), format: tokenFormat});
								break;
							}
							case tM.getValue("Pages").toLowerCase(): {
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.pageCount), format: tokenFormat});
								break;
							}
							case tM.getValue("Date").toLowerCase(): {
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.date), format: tokenFormat});
								break;
							}
							case tM.getValue("Time").toLowerCase(): {
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.time), format: tokenFormat});
								break;
							}
							case tM.getValue("Tab").toLowerCase(): {
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.sheetName), format: tokenFormat});
								break;
							}
							case tM.getValue("File").toLowerCase(): {
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.fileName), format: tokenFormat});
								break;
							}
							case "&[Path]&[File]": {
								text = "";
								break;
							}
							default: {
								if("" !== text && j ===  fragments.length - 1 && n === fragments[j].text.length - 1) {
									res.push({text: text, format: fragments[j].format});
									text = "";
								}
								break;
							}
						}
						bToken = false;
						startToken = false;
					} else {
						tokenText += symbol;
					}

					if("" !== text && j ===  fragments.length - 1 && n === fragments[j].text.length - 1) {
						res.push({text: text, format: fragments[j].format});
					}
				} else if(bToken) {
					//начинаем просматривать аргумент
					if(symbol === "[") {
						startToken = true;
						tokenText = "";
					} else {
						//если за "&" следует спецсимвол
						switch(symbol) {
							case 'l':
							case 'c':
							case 'r':
							case 'b':   //bold
							case 'i':
							case 'u':   //underline
							case 'e':   //double underline
							case 's':   //strikeout
							case 'x':   //superscript
							case 'y':   //subsrcipt
							case 'o':   //outlined
							case 'h':   //shadow
							case 'k':   //text color
							case '\"':  //font name
								break;
							case 'p':   //page number
							{
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.pageNumber), format: tokenFormat});
								break;
							}
							case 'n':   //total page count
							{
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.pageCount), format: tokenFormat});
								break;
							}
							case 'a':   //current sheet name
							{
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.sheetName), format: tokenFormat});
								break;
							}
							case 'f':   //file name
							{
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.fileName), format: tokenFormat});
								break;
							}
							case 'z':   //file path
							{
								text = "";
								//res.push((new HeaderFooterField(asc.c_oAscHeaderFooterField.filePath)));
								break;
							}
							case 'd':   //date
							{
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.date), format: tokenFormat});
								break;
							}
							case 't':   //time
							{
								text = "";
								res.push({text: new HeaderFooterField(asc.c_oAscHeaderFooterField.time), format: tokenFormat});
								break;
							}
							default: {
								if("" !== text && j ===  fragments.length - 1 && n === fragments[j].text.length - 1) {
									res.push({text: text, format: fragments[j].format});
									text = "";
								}
								break;
							}
						}
						bToken = false;
					}
				} else if("" !== text && n === fragments[j].text.length - 1) {
					res.push({text: text, format: fragments[j].format});
				}
			}
		}
		return res;
	};

	CHeaderFooterEditor.prototype._getFragments = function(text, format) {
		var tempFragment = new AscCommonExcel.Fragment();
		tempFragment.text = text;
		tempFragment.format = format;
		return tempFragment;
	};

	CHeaderFooterEditor.prototype._generatePresetsArr = function() {
		var docInfo = window["Asc"]["editor"].DocInfo;
		var userInfo = docInfo ? docInfo.get_UserInfo() : null;
		var userName = userInfo ? userInfo.get_FullName() : "";
		var fileName = docInfo ? docInfo.get_Title() : "";

		var tM = AscCommon.translateManager;
		var confidential = tM.getValue("Confidential");
		var preparedBy = tM.getValue("Prepared by ");
		var page = tM.getValue("Page");
		var pageOf = tM.getValue("Page %1 of %2");

		var pageTag = "&[" + page + "]";
		var pagesTag = "&[" + tM.getValue("Pages") + "]";
		var tabTag = "&[" + tM.getValue("Tab") + "]";
		var dateTag = "&[" + tM.getValue("Date") + "]";
		var fileTag = "&[" + tM.getValue("File") + "]";

		var arrPresets = [];
		var arrPresetsMenu = [];
		arrPresets[0] = arrPresetsMenu[0] = [null, null, null];
		arrPresets[1] = arrPresetsMenu[1] = [null,  page + " " + pageTag, null];
		arrPresets[2] = [null, pageOf.replace("%1", pageTag).replace("%2", pagesTag), null];
		arrPresetsMenu[2] = [null, pageOf.replace("%1", pageTag).replace("%2", "?"), null];
		arrPresets[3] = arrPresetsMenu[3] = [null, tabTag, null];
		arrPresets[4] = arrPresetsMenu[4] = [confidential, dateTag, page + " " + pageTag];
		arrPresets[5] = arrPresetsMenu[5] = [null, fileTag, null];
		//arrPresets[6] = [null, "&[Path]&[File]", null];
		arrPresets[6] = arrPresetsMenu[6] = [null, tabTag, page + " " + pageTag];
		arrPresets[7] = arrPresetsMenu[7] = [tabTag, confidential, page + " " + pageTag];
		arrPresets[8] = arrPresetsMenu[8] = [null, fileTag, page + " " + pageTag];
		//arrPresets[10] = [null,"&[Path]&[File]","Page &[Page]"];
		arrPresets[9] = arrPresetsMenu[9] = [null, page + " " + pageTag, tabTag];
		arrPresets[10] = arrPresetsMenu[10] = [null, page + " " + pageTag, fileName];
		arrPresets[11] = arrPresetsMenu[11] = [null, page + " " + pageTag, fileTag];
		//arrPresets[12] = [null,"Page &[Page]","&[Path]&[File]"];
		arrPresets[12] = arrPresetsMenu[12] = [userName, page + " " + pageTag, dateTag];
		arrPresets[13] = arrPresetsMenu[13] = [null, preparedBy + userName + " " + dateTag, page + " " + pageTag];

		this.presets = arrPresets;
		this.menuPresets = arrPresetsMenu;
	};


	CHeaderFooterEditor.prototype.getPageType = function() {
		return this.pageType;
	};


	//------------------------------------------------------------export---------------------------------------------------
	window['AscCommonExcel'] = window['AscCommonExcel'] || {};

	window["AscCommonExcel"].HeaderFooterParser = HeaderFooterParser;
	window["AscCommonExcel"].CHeaderFooterEditorSection = CHeaderFooterEditorSection;

	window["AscCommonExcel"].CHeaderFooterEditor = window["AscCommonExcel"]["CHeaderFooterEditor"] = CHeaderFooterEditor;
	var prot = CHeaderFooterEditor.prototype;
	prot["click"] 	= prot.click;
	prot["destroy"] = prot.destroy;
	prot["setFontName"] = prot.setFontName;
	prot["setFontSize"] = prot.setFontSize;
	prot["setBold"] = prot.setBold;
	prot["setItalic"] = prot.setItalic;
	prot["setUnderline"] = prot.setUnderline;
	prot["setStrikeout"] = prot.setStrikeout;
	prot["setSubscript"] = prot.setSubscript;
	prot["setSuperscript"] = prot.setSuperscript;
	prot["setTextColor"] = prot.setTextColor;
	prot["addField"] = prot.addField;
	prot["switchHeaderFooterType"] = prot.switchHeaderFooterType;
	prot["getTextPresetsArr"] = prot.getTextPresetsArr;
	prot["applyPreset"] = prot.applyPreset;
	prot["getAppliedPreset"] = prot.getAppliedPreset;

	prot["setAlignWithMargins"] = prot.setAlignWithMargins;
	prot["setDifferentFirst"] = prot.setDifferentFirst;
	prot["setDifferentOddEven"] = prot.setDifferentOddEven;
	prot["setScaleWithDoc"] = prot.setScaleWithDoc;
	prot["getAlignWithMargins"] = prot.getAlignWithMargins;
	prot["getDifferentFirst"] = prot.getDifferentFirst;
	prot["getDifferentOddEven"] = prot.getDifferentOddEven;
	prot["getScaleWithDoc"] = prot.getScaleWithDoc;

	prot["getPageType"] = prot.getPageType;

	window['AscCommonExcel'].c_oPortionPosition = c_oPortionPosition;

})(window);
