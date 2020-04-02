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
(
	/**
	 * @param {Window} window
	 * @param {undefined} undefined
	 */
	function (window, undefined) {


		/*
		 * Import
		 * -----------------------------------------------------------------------------
		 */
		var asc = window["Asc"];
		var asc_lastindexof = asc.lastIndexOf;

		function CharOffset(left, top, height, line) {
			this.left = left;
			this.top = top;
			this.height = height;
			this.lineIndex = line;
		}

		/**
		 * CellTextRender
		 * -----------------------------------------------------------------------------
		 * @param {DrawingContext} drawingCtx  Context for drawing on
		 *
		 * @constructor
		 * @memberOf Asc
		 * @extends {AscCommonExcel.StringRender}
		 */
		function CellTextRender(drawingCtx) {
			AscCommonExcel.StringRender.apply(this, arguments);

			/** @type RegExp */
			this.reWordBegining = new XRegExp("[^\\p{L}\\p{N}][\\p{L}\\p{N}]", "i");

			return this;
		}

		CellTextRender.prototype = Object.create(AscCommonExcel.StringRender.prototype);
		CellTextRender.prototype.constructor = CellTextRender;
		CellTextRender.prototype.getLinesCount = function () {
			return this.lines.length;
		};

		CellTextRender.prototype.getLineInfo = function (index) {
			return this.lines.length > 0 && index >=0 && index < this.lines.length ? this.lines[index] : null;
		};

		CellTextRender.prototype.calcLineOffset = function (index) {
			var zoom = this.drawingCtx.getZoom();
			for (var i = 0, h = 0, l = this.lines; i < index; ++i) {
				h += Asc.round(l[i].th * zoom);
			}
			return h;
		};


		CellTextRender.prototype.getPrevChar = function (pos) {
			return pos <= 0 ? 0 : pos <= this.chars.length ? pos - 1 : this.chars.length;
		};

		CellTextRender.prototype.getNextChar = function (pos) {
			return pos >= this.chars.length ? this.chars.length : pos >= 0 ? pos + 1 : 0;
		};

		CellTextRender.prototype.getPrevWord = function (pos) {
			var i = asc_lastindexof(this.chars.slice(0, pos), this.reWordBegining);
			return i >= 0 ? i + 1 : 0;
		};

		CellTextRender.prototype.getNextWord = function (pos) {
			var i = this.chars.slice(pos).search(this.reWordBegining);
			return i >= 0 ? pos + (i + 1) : this.getEndOfLine(pos);
		};

		CellTextRender.prototype.getBeginOfLine = function (pos) {
			pos = pos < 0 ? 0 : Math.min(pos, this.chars.length);

			for (var l = this.lines, i = 0; i < l.length; ++i) {
				if (pos >= l[i].beg && pos <= l[i].end) {return l[i].beg;}
			}

			// pos - в конце текста
			var lastLine = l.length - 1;
			var lastChar = this.chars.length - 1;
			return this.charWidths[lastChar] !== 0 ? l[lastLine].beg : pos;
		};

		CellTextRender.prototype.getEndOfLine = function (pos) {
			pos = pos < 0 ? 0 : Math.min(pos, this.chars.length);

			var l = this.lines;
			var lastLine = l.length - 1;
			for (var i = 0; i < lastLine; ++i) {
				if (pos >= l[i].beg && pos <= l[i].end) {return l[i].end;}
			}

			// pos - на последней линии
			var lastChar = this.chars.length - 1;
			return pos > lastChar ? pos : lastChar + (this.charWidths[lastChar] !== 0 ? 1 : 0);
		};

		CellTextRender.prototype.getBeginOfText = function () {
			return 0;
		};

		CellTextRender.prototype.getEndOfText = function () {
			return this.chars.length;
		};

		CellTextRender.prototype.getPrevLine = function (pos) {
			pos = pos < 0 ? 0 : Math.min(pos, this.chars.length);

			for (var l = this.lines, i = 0; i < l.length; ++i) {
				if (pos >= l[i].beg && pos <= l[i].end) {
					return i <= 0 ? 0 : Math.min(l[i-1].beg + pos - l[i].beg, l[i-1].end);
				}
			}

			// pos - в конце текста
			var lastLine = l.length - 1;
			var lastChar = this.chars.length - 1;
			return this.charWidths[lastChar] === 0 || l.length < 2 ?
				(0 > lastLine ? 0 : l[lastLine].beg) :
					lastChar > 0 ? Math.min(l[lastLine-1].beg + pos - l[lastLine].beg, l[lastLine-1].end) : 0;
		};

		CellTextRender.prototype.getNextLine = function (pos) {
			pos = pos < 0 ? 0 : Math.min(pos, this.chars.length);

			var l = this.lines;
			var lastLine = l.length - 1;
			for (var i = 0; i < lastLine; ++i) {
				if (pos >= l[i].beg && pos <= l[i].end) {
					return Math.min(l[i+1].beg + pos - l[i].beg, l[i+1].end);
				}
			}

			// pos - на последней линии
			return this.chars.length;
		};

		CellTextRender.prototype.getCharInfo = function (pos) {
			for (var p = this.charProps[pos]; (!p || !p.font) && pos > 0; --pos) {
				p = this.charProps[pos - 1];
			}
			return {
				fsz: p.font.FontSize,
				dh: p && p.lm && p.lm.bl2 > 0 ? p.lm.bl2 - p.lm.bl : 0,
				h: p && p.lm ? p.lm.th: 0
			};
		};

		CellTextRender.prototype.charOffset = function (pos, lineIndex, h) {
			var zoom = this.drawingCtx.getZoom();
			var li = this.lines[lineIndex];
			return new CharOffset(li.startX + (pos > 0 ? this._calcCharsWidth(li.beg, pos - 1) : 0), Asc.round(
				h * zoom), Asc.round(li.th * zoom), lineIndex);
		};

		CellTextRender.prototype.calcCharOffset = function (pos) {
			var t = this, l = t.lines, i, h, co;

			if (l.length < 1) {return null;}

			if (pos < 0) {pos = 0;}
			if (pos > t.chars.length) {pos = t.chars.length;}

			for (i = 0, h = 0; i < l.length; ++i) {
				if (pos >= l[i].beg && pos <= l[i].end) {
					return this.charOffset(pos, i, h);
				}
				if (i !== l.length - 1) {
					h += l[i].th;
				}
			}

			co = this.charOffset(pos, i - 1, h);
			return co;
		};

		CellTextRender.prototype.calcCharHeight = function (pos) {
			var t = this;
			for (var p = t.charProps[pos]; (!p || !p.font) && pos > 0; --pos) {
				p = t.charProps[pos - 1];
			}
			return t._calcLineMetrics(p.fsz !== undefined ? p.fsz : p.font.FontSize, p.va, p.fm);
		};


		CellTextRender.prototype.getCharsCount = function () {
			return this.chars.length;
		};

		CellTextRender.prototype.getChars = function (pos, len) {
			return this.chars.slice(pos, pos + len);
		};

		CellTextRender.prototype.getCharWidth = function (pos) {
			return this.charWidths[pos];
		};


		//------------------------------------------------------------export---------------------------------------------------
		window['AscCommonExcel'] = window['AscCommonExcel'] || {};
		window["AscCommonExcel"].CellTextRender = CellTextRender;
	}
)(window);
